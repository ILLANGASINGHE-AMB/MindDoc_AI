from sentence_transformers import SentenceTransformer

# Load the model once globally so it doesn't reload on every function call.
# all-MiniLM-L6-v2 is small, fast, and works perfectly on CPU.
model = SentenceTransformer("all-MiniLM-L6-v2")

def embed_text(text: str) -> list[float]:
    """
    Generates a vector embedding for a given string of text.
    Returns a list of floats representing the embedding.
    """
    # The encode function returns a numpy array, we convert it to a python list
    embedding = model.encode(text)
    return embedding.tolist()
