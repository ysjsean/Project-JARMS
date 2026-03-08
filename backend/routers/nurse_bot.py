from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from services.nurse_bot.orchestrator import NurseBotOrchestrator

router = APIRouter()

@router.websocket("/ws/{case_id}")
async def nurse_bot_endpoint(websocket: WebSocket, case_id: str):
    """
    WebSocket endpoint for the Frontend to interact with the Nurse Bot.
    This routes audio and text to OpenAI Realtime and back.
    """
    await websocket.accept()
    print(f"[NURSE_BOT] WebSocket accepted for Case {case_id}")
    
    orchestrator = NurseBotOrchestrator(case_id, websocket)
    
    try:
        # Run the relay. This loop continues until disconnect or OpenAI error.
        await orchestrator.run()
    except WebSocketDisconnect:
        print(f"[NURSE_BOT] Member disconnected for Case {case_id}")
    except Exception as e:
        print(f"[NURSE_BOT] Error in session {case_id}: {e}")
        await websocket.close(code=1011, reason=str(e))
    finally:
        await orchestrator.close()
