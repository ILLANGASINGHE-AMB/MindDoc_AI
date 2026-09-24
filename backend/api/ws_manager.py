import asyncio
import json
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        self.loop = None

    def set_loop(self, loop):
        self.loop = loop

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast_async(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass

    def emit_event(self, state: str, message: str):
        if self.loop is None:
            return
        
        data = {
            "type": "agent_state",
            "state": state,
            "message": message
        }
        json_data = json.dumps(data)
        
        # Schedule the broadcast on the event loop
        asyncio.run_coroutine_threadsafe(self.broadcast_async(json_data), self.loop)

manager = ConnectionManager()
