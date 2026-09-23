# Phase 3: Local LLM Integration

## Goal
The objective of Phase 3 is to establish a connection between our Python backend and the **Ollama** local LLM runtime. This allows us to send text prompts and receive natural language responses entirely locally, without relying on cloud APIs like OpenAI.

## Architecture

```text
Backend Application
       ↓
  Agent LLM Client (ollama-python)
       ↓
  Ollama Background Service (localhost:11434)
       ↓
  qwen2.5:7b-instruct (or chosen model)
```

## Key Components

1. **`backend/agent/llm_client.py`**: A wrapper module that encapsulates the `ollama` Python library. It provides a simple `generate()` function that accepts a system prompt and a user query, formats them into a message array, and calls the Ollama Chat API.
2. **`backend/agent/qa_test.py`**: A simple smoke-test script that we can run from the terminal to verify that the backend can successfully communicate with Ollama and generate a coherent response.

## Prerequisites for Execution
To successfully run the LLM client, you must have:
1. The Ollama application installed on your machine.
2. The model pulled via your terminal: `ollama pull qwen2.5:7b-instruct` (or whichever model you choose in Settings).
3. The Ollama application running in the background.

## Outcomes
By the end of Phase 3:
1. The backend is fully capable of talking to a local AI model.
2. We have an abstracted `generate()` function that we can plug our Vector DB results into during Phase 4 (RAG).
