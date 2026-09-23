# Phase 6: Multimodal Processing (Vision)

## Goal
The objective of Phase 6 is to equip the DocMind Agent with vision capabilities. While Phase 5 allowed us to extract raw text from scanned images, Phase 6 allows the agent to visually analyze charts, graphs, diagrams, and complex tables that were extracted as images in Phase 1.

## Architecture

```text
       Extracted Image
(e.g., data/extracted/doc_id/images/page1_img1.png)
             ↓
        Base64 Encode
             ↓
    Vision Engine (Ollama)
(e.g., qwen2.5vl:7b or llava)
             ↓
        LLM Response
(e.g., "This chart shows a 20% increase in...")
```

## Key Components

1. **`backend/vision/vision_engine.py`**: A module that takes the absolute path to an image on disk and a question from the Agent. It encodes the image as a Base64 string and sends it to the local multimodal Ollama model alongside the question.

## Prerequisites
To successfully execute vision tasks, you must have a multimodal model pulled in Ollama. 
For example:
`ollama pull llava:7b`
or
`ollama pull qwen2.5vl:7b`

## Outcomes
By the end of Phase 6, we have a functional Vision Tool. In Phase 7 (Agent Layer), the Agent Controller will be able to invoke this tool dynamically when it determines that a user's question relates to a specific figure or diagram.
