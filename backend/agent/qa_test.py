import sys
from pathlib import Path

# Add project root to python path so we can import backend modules
project_root = Path(__file__).parent.parent.parent
sys.path.append(str(project_root))

from backend.agent.llm_client import generate

def run_smoke_test():
    print("--- DocMind LLM Smoke Test ---")
    
    # We will use llama3.2 as a small fast model if qwen2.5 is not available.
    # But let's try the default first.
    test_model = "qwen2.5:7b-instruct"
    system_prompt = "You are a helpful AI assistant. Keep your answer under 2 sentences."
    user_query = "What is Retrieval-Augmented Generation (RAG)?"
    
    print(f"\nModel: {test_model}")
    print(f"System: {system_prompt}")
    print(f"User: {user_query}")
    print("\nGenerating response...\n")
    
    response = generate(
        prompt=user_query,
        model=test_model,
        system=system_prompt
    )
    
    print("Response:")
    print("-" * 40)
    print(response)
    print("-" * 40)

if __name__ == "__main__":
    run_smoke_test()
