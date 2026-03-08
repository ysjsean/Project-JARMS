from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from services.nurse_bot.orchestrator import NurseBotOrchestrator

router = APIRouter()


@router.websocket("/cases/{case_id}/nurse-bot")
async def nurse_bot_ws(websocket: WebSocket, case_id: str):
    await websocket.accept()

    bot = NurseBotOrchestrator(case_id, websocket)

    try:
        await bot.run()

    except WebSocketDisconnect:
        print(f"[NURSE_BOT] Client disconnected {case_id}")

    finally:
        await bot.close()
