import os
import torch
import platform

class Config:
    """
    Central configuration and hardware-awareness for DocMind.
    """
    def __init__(self):
        self.device = self._detect_device()
        self.embedding_model = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
        self.agent_model = os.getenv("AGENT_MODEL", "qwen2.5:7b-instruct")
        self.vision_model = os.getenv("VISION_MODEL", "llava:7b")
        
    def _detect_device(self) -> str:
        if torch.cuda.is_available():
            return "cuda"
        elif torch.backends.mps.is_available():
            # For Apple Silicon (M1/M2/M3)
            return "mps"
        return "cpu"
        
config = Config()
