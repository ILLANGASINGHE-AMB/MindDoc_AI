from backend.agent.llm_client import generate
import json

PLANNER_SYSTEM_PROMPT = """You are a planning module for a document AI agent.
Given a user question, output a JSON plan with these fields:
- needs_search: bool
- needs_ocr: bool
- needs_vision: bool
- needs_comparison: bool
- sub_queries: list of strings (specific things to search for)

Respond with valid JSON only. No markdown formatting or extra text."""

def plan(question: str) -> dict:
    """
    Takes a question and asks the LLM to output a JSON execution plan.
    """
    raw = generate(question, system=PLANNER_SYSTEM_PROMPT)
    
    # Clean up response if it contains markdown code blocks
    raw = raw.strip()
    if raw.startswith("```json"):
        raw = raw[7:]
    if raw.startswith("```"):
        raw = raw[3:]
    if raw.endswith("```"):
        raw = raw[:-3]
        
    try:
        return json.loads(raw.strip())
    except json.JSONDecodeError:
        # Fallback: assume a standard search is always needed
        return {
            "needs_search": True, 
            "needs_ocr": False,
            "needs_vision": False, 
            "needs_comparison": False,
            "sub_queries": [question]
        }
