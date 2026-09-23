from sentence_transformers import SentenceTransformer
from backend.config import config

# Load the model once globally so it doesn't reload on every function call.
model = SentenceTransformer(config.embedding_model)

def embed_text(text: str) -> list[float]:
    """
    Generates a vector embedding for a given string of text.
    Returns a list of floats representing the embedding.
    """
    # The encode function returns a numpy array, we convert it to a python list
    embedding = model.encode(text)
    return embedding.tolist()
