import chromadb
from pathlib import Path
from backend.embeddings.embedder import embed_text

# Ensure the database directory exists
DB_PATH = Path("data/vector_db")
DB_PATH.mkdir(parents=True, exist_ok=True)

# Initialize ChromaDB persistent client
client = chromadb.PersistentClient(path=str(DB_PATH))

# Create or get the collection for our document chunks
collection = client.get_or_create_collection(
    name="docmind_chunks",
    metadata={"hnsw:space": "cosine"} # Use cosine similarity for text embeddings
)

def add_chunks(chunks: list[dict]):
    """
    Takes a list of chunk dictionaries, generates embeddings, and adds them to ChromaDB.
    """
    if not chunks:
        return
        
    ids = []
    embeddings = []
    metadatas = []
    documents = []
    
    for i, c in enumerate(chunks):
        # Generate a unique ID for each chunk
        chunk_id = f"{c['doc_id']}_p{c['page']}_c{i}"
        
        ids.append(chunk_id)
        embeddings.append(embed_text(c["text"]))
        metadatas.append({
            "doc_id": c["doc_id"], 
            "page": c["page"]
        })
        documents.append(c["text"])
        
    collection.add(
        ids=ids,
        embeddings=embeddings,
        metadatas=metadatas,
        documents=documents
    )

def search(query: str, k: int = 5, doc_ids: list[str] = None) -> list[dict]:
    """
    Searches the vector database for the most relevant chunks to the query.
    Optionally filter by a list of document IDs.
    """
    query_embedding = embed_text(query)
    
    where_clause = None
    if doc_ids:
        # If filtering by specific documents
        if len(doc_ids) == 1:
            where_clause = {"doc_id": doc_ids[0]}
        else:
            where_clause = {"doc_id": {"$in": doc_ids}}
            
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=k,
        where=where_clause
    )
    
    # Format the results into a clean list of dictionaries
    formatted_results = []
    
    if results and results["documents"] and len(results["documents"][0]) > 0:
        docs = results["documents"][0]
        metas = results["metadatas"][0]
        distances = results["distances"][0]
        
        for doc, meta, dist in zip(docs, metas, distances):
            formatted_results.append({
                "text": doc,
                "page": meta["page"],
                "doc_id": meta["doc_id"],
                "score": dist
            })
            
    return formatted_results
