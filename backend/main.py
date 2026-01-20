import os
import json
import re
from typing import List
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from pydantic_ai import Agent
from pydantic_ai.models.groq import GroqModel

load_dotenv()

# --- CONFIGURATION ---
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

# --- INITIALIZE MODEL ---
model = GroqModel('llama-3.3-70b-versatile')

agent = Agent(
    model,
    system_prompt="""You are an expert Tech Mentor. 
    Your goal is not just to test the candidate, but to TEACH them.
    For every question, you must provide a 'Mini-Lesson' that explains the concept simply."""
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- UPDATED DATA MODELS ---
class Question(BaseModel):
    question_text: str
    context: str
    ideal_answer_points: List[str]
    answer_guide: str  # <--- NEW FIELD: The "Mini-Lesson"

class InterviewResponse(BaseModel):
    feedback: str
    technical_questions: List[Question]
    behavioral_questions: List[Question]

class UserInput(BaseModel):
    resume_text: str
    job_description: str

@app.post("/generate", response_model=InterviewResponse)
async def generate_interview(data: UserInput):
    print("Received request... Generating LEARNING interview...")

    prompt = f"""
    Analyze this candidate:
    RESUME: {data.resume_text}
    JOB: {data.job_description}
    
    TASK:
    Generate a 'Masterclass' interview plan.
    
    QUANTITY:
    - 7 Technical Questions (Covering diverse topics).
    - 3 Behavioral Questions.
    
    CONTENT GUIDELINES:
    1. Questions must be challenging and scenario-based.
    2. **CRITICAL:** For every question, provide an 'answer_guide'. This should be 2-3 sentences teaching the user the underlying concept (like a mentor explaining it).
    
    OUTPUT FORMAT (JSON ONLY):
    {{
      "feedback": "Honest feedback...",
      "technical_questions": [
        {{
          "question_text": "Scenario...",
          "context": "System Design / Algorithms...",
          "ideal_answer_points": ["Point 1", "Point 2"],
          "answer_guide": "Here is the concept: In distributed systems, consistency is often traded for availability (CAP Theorem). The best approach here is..."
        }}
      ],
      "behavioral_questions": [ ... ]
    }}
    """

    try:
        result = await agent.run(prompt)
        
        # --- PARSING LOGIC ---
        content = str(result.data) if hasattr(result, 'data') else str(result)
        
        match = re.search(r'\{.*\}', content, re.DOTALL)
        if match:
            json_str = match.group(0).replace("```json", "").replace("```", "")
        else:
            json_str = content

        try:
            json_data = json.loads(json_str)
        except:
            json_data = json.loads(json_str.replace("'", '"'))

        return InterviewResponse.model_validate(json_data)

    except Exception as e:
        print(f"ERROR: {e}")
        raise HTTPException(status_code=500, detail="AI generation failed.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)