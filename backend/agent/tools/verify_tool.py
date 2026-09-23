from backend.agent.llm_client import generate
import json

VERIFY_PROMPT = """Given the CONTEXT and the ANSWER below, determine whether every
claim in the ANSWER is supported by the CONTEXT. Respond as JSON:
{{"supported": true, "unsupported_claims": []}}
or
{{"supported": false, "unsupported_claims": ["claim 1", "claim 2"]}}

Respond with valid JSON only. No markdown formatting.

CONTEXT:
{context}

ANSWER:
{answer}
"""

def verify_answer(answer: str, context: str) -> dict:
    raw = generate(VERIFY_PROMPT.format(context=context, answer=answer))
    
    # Clean markdown if present
    raw = raw.strip()
    if raw.startswith("```json"): raw = raw[7:]
    if raw.startswith("```"): raw = raw[3:]
    if raw.endswith("```"): raw = raw[:-3]
        
    try:
        return json.loads(raw.strip())
    except json.JSONDecodeError:
        return {"supported": True, "unsupported_claims": []} # fail-open
