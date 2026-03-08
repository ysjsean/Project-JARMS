import asyncio
import json
import os
import websockets
from typing import Any, Dict, Optional
from core.settings import settings
from services.nurse_bot import prompts, tools
from services.nurse_bot import tools

# OpenAI Realtime API WebSocket URL
OPENAI_REALTIME_URL = (
    "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01"
)


class NurseBotOrchestrator:
    def __init__(self, case_id: str, client_websocket: Any):
        self.case_id = case_id
        self.client_ws = client_websocket
        self.openai_ws = None
        self.api_key = settings.OPENAI_API_KEY
        self.is_running = False

    async def connect(self):
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "OpenAI-Beta": "realtime=v1",
        }

        try:
            self.openai_ws = await websockets.connect(
                OPENAI_REALTIME_URL,
                additional_headers=headers,
            )
            print(f"[NURSE_BOT] Connected to OpenAI Realtime for Case {self.case_id}")

            session_config = prompts.get_session_config(self.case_id)

            await self.openai_ws.send(
                json.dumps(
                    {
                        "type": "session.update",
                        "session": session_config,
                    }
                )
            )

            self.is_running = True

        except Exception as e:
            print(f"[NURSE_BOT] Connection failed: {e}")
            raise

    async def _handle_openai_message(self, message_str: str):
        """
        Processes messages coming from OpenAI.
        Handles tool calls and forwards audio/text to the frontend.
        """
        data = json.loads(message_str)
        msg_type = data.get("type")

        # 1. Handle Tool Calls
        if msg_type == "response.function_call_arguments.done":
            fn_name = data.get("name")
            args = json.loads(data.get("arguments", "{}"))
            call_id = data.get("call_id")

            print(f"[NURSE_BOT] Bot calling tool: {fn_name}({args})")

            result = {}
            if fn_name == "get_case_details":
                result = await tools.get_case_details(self.case_id)
            elif fn_name == "get_beneficiary_history":
                result = await tools.get_beneficiary_history(args.get("nric", ""))
            elif fn_name == "escalate_urgency":
                result = await tools.escalate_urgency(
                    self.case_id, args.get("new_bucket"), args.get("reason")
                )

            # Send result back to OpenAI
            await self.openai_ws.send(
                json.dumps(
                    {
                        "type": "conversation.item.create",
                        "item": {
                            "type": "function_call_output",
                            "call_id": call_id,
                            "output": json.dumps(result),
                        },
                    }
                )
            )
            # Trigger response generation after tool result
            await self.openai_ws.send(json.dumps({"type": "response.create"}))

        # 2. Forward audio/text/events to client
        # We filter out some internal events to keep the client stream clean
        if msg_type in [
            "response.audio.delta",
            "response.audio_transcript.delta",
            "error",
        ]:
            await self.client_ws.send_text(message_str)

    async def _handle_client_message(self, message_str: str):
        """
        Processes messages coming from the Frontend.
        Usually binary audio data or text prompts.
        """
        try:
            # We expect the frontend to send JSON with 'type' and 'data' (base64 audio)
            # or raw binary if configured.
            data = json.loads(message_str)

            # Forward to OpenAI
            # Typically 'input_audio_buffer.append'
            if data.get("type") == "input_audio_buffer.append":
                await self.openai_ws.send(message_str)
            elif data.get("type") == "conversation.item.create":
                await self.openai_ws.send(message_str)
                await self.openai_ws.send(json.dumps({"type": "response.create"}))

        except Exception as e:
            # Handle raw binary if client sends it directly
            pass

    async def run(self):
        """
        Main relay loop.
        """
        if not self.openai_ws:
            await self.connect()

        async def openai_to_client():
            async for message in self.openai_ws:
                await self._handle_openai_message(message)

        async def client_to_openai():
            # In FastAPI, we usually iterate over the websocket in the router,
            # but we can do it here if we pass the websocket object.
            while self.is_running:
                try:
                    message = await self.client_ws.receive_text()
                    await self._handle_client_message(message)
                except Exception:
                    self.is_running = False
                    break

        await asyncio.gather(openai_to_client(), client_to_openai())

    async def close(self):
        self.is_running = False
        if self.openai_ws:
            await self.openai_ws.close()
