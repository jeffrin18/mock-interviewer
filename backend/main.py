import os
import json
import re
from typing import List
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

# --- IMPORTS ---
from pydantic_ai import Agent
from pydantic_ai.models.groq import GroqModel

load_dotenv()

# --- 1. CONFIGURATION ---
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

if not GROQ_API_KEY:
    # Fallback for local testing if env var is missing
    # But for Render, this will rely on the Environment Variable you set
    pass 

# --- 2. INITIALIZE MODEL ---
model = GroqModel('llama-3.3-70b-versatile')

agent = Agent(
    model,
    system_prompt="You are a Senior Staff Engineer at a Tier-1 Tech Company (like Google or Netflix). Your goal is to expose weak candidates."
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATA MODELS ---
class Question(BaseModel):
    question_text: str
    context: str
    ideal_answer_points: List[str]

class InterviewResponse(BaseModel):
    feedback: str
    technical_questions: List[Question]
    behavioral_questions: List[Question]

class UserInput(BaseModel):
    resume_text: str
    job_description: str

@app.post("/generate", response_model=InterviewResponse)
async def generate_interview(data: UserInput):
    print("Received request... Sending to Groq (Llama 3.3)...")

    # --- THE UPGRADED PROMPT ---
    prompt = f"""
    Analyze this candidate for a high-bar technical role.
    RESUME: {data.resume_text}
    JOB: {data.job_description}
    
    TASK:
    Create a 'Bar-Raiser' interview plan. 
    
    GUIDELINES FOR TECHNICAL QUESTIONS:
    1. NO "TEXTBOOK" DEFINITIONS. Do not ask "What is X?".
    2. Ask SCENARIO-BASED questions. (e.g., "The production DB is slow. How do you debug?" or "Design a rate limiter.")
    3. Focus on trade-offs, scalability, and edge cases.
    4. If the resume lists React, ask about re-rendering performance or state management complex patterns.
    5. If the resume lists Backend, ask about concurrency, caching, or database locking.

    GUIDELINES FOR BEHAVIORAL:
    1. Focus on conflict, failure, and ambiguity.
    2. Ask for specific examples of when things went WRONG.

    OUTPUT FORMAT (JSON ONLY):
    Use double quotes for keys.
    {{
      "feedback": "A brutally honest 2-sentence summary of the resume's weak spots.",
      "technical_questions": [
        {{
          "question_text": "A complex scenario or design problem...",
          "context": "Why this matters (e.g., 'Tests deep understanding of concurrency')",
          "ideal_answer_points": ["Mentioning race conditions", "Using a lock", "Optimistic concurrency"]
        }}
      ],
      "behavioral_questions": [
        {{
          "question_text": "Tell me about a time you disagreed with a manager...",
          "context": "Tests conflict resolution",
          "ideal_answer_points": ["Stayed calm", "Used data to argue", "Committed to final decision"]
        }}
      ]
    }}
    """

    try:
        # Run Pydantic AI Agent
        result = await agent.run(prompt)
        
        # --- NUCLEAR EXTRACTION LOGIC ---
        content = ""
        if hasattr(result, 'data'):
            content = result.data
        elif hasattr(result, 'output'): 
            content = result.output
        else:
            content = str(result)
            
        print(f"Extracted Content: {str(content)[:100]}...")

        if not isinstance(content, str):
            content = str(content)

        match = re.search(r'\{.*\}', content, re.DOTALL)
        
        if match:
            json_str = match.group(0)
            json_str = json_str.replace("```json", "").replace("```", "")
        else:
            json_str = content

        print("Parsing JSON...")
        
        try:
            json_data = json.loads(json_str)
        except json.JSONDecodeError:
            print("Standard parse failed. Attempting quote fix...")
            fixed_str = json_str.replace("'", '"')
            json_data = json.loads(fixed_str)

        parsed_data = InterviewResponse.model_validate(json_data)
        
        print("Success! Plan generated and parsed.")
        return parsed_data

    except Exception as e:
        print(f"FINAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)