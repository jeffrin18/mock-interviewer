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
# Using the largest model for maximum creativity
model = GroqModel('llama-3.3-70b-versatile')

agent = Agent(
    model,
    system_prompt="""You are a Principal Engineer at a top-tier tech company (Google/Netflix/Startup). 
    You are interviewing a candidate who has been rejected before because they are too 'textbook'.
    
    YOUR GOAL:
    Test their CREATIVITY and INTUITION. Do not ask standard questions. 
    If they memorize LeetCode or System Design docs, they should fail this interview.
    You want to see how they think when things go wrong or when requirements are weird."""
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
    print("Received request... Generating CREATIVE interview...")

    prompt = f"""
    Analyze this candidate:
    RESUME: {data.resume_text}
    JOB: {data.job_description}
    
    TASK:
    Generate 5 TECHNICAL questions and 3 BEHAVIORAL questions.
    
    CRITICAL RULES FOR TECHNICAL QUESTIONS:
    1. ❌ BAN LIST: Do NOT ask "What is polymorphism?", "Monolith vs Microservices", "Explain REST", or "What is a Class?".
    2. ✅ CREATIVITY: Ask questions that have no single right answer.
       - Example: "Design a rate limiter using ONLY a single text file. No Redis allowed."
       - Example: "You accidentally deleted the production database. The backups are corrupt. What is your next 30 minutes like?"
       - Example: "Explain recursion to a 5-year-old without using code."
    3. If they know React, ask: "How would you break React's rendering engine?"
    4. If they know Python, ask: "How would you implement a dictionary from scratch using only arrays?"
    
    CRITICAL RULES FOR BEHAVIORAL:
    1. Ignore "Tell me about a time you worked in a team." (Too easy).
    2. Ask: "Tell me about a time you technically disagreed with your boss, implemented it your way, and you were WRONG. How did you handle it?"
    
    OUTPUT FORMAT (JSON ONLY):
    {{
      "feedback": "2 sentences on why this resume might fail a screening (be harsh but helpful).",
      "technical_questions": [
        {{
          "question_text": "The creative/tough scenario...",
          "context": "Why this tests creativity vs memorization",
          "ideal_answer_points": ["First point", "Second point"]
        }}
      ],
      "behavioral_questions": [ ... ]
    }}
    """

    try:
        result = await agent.run(prompt)
        
        # --- PARSING LOGIC ---
        content = str(result.data) if hasattr(result, 'data') else str(result)
        
        # Regex to find JSON
        match = re.search(r'\{.*\}', content, re.DOTALL)
        if match:
            json_str = match.group(0).replace("```json", "").replace("```", "")
        else:
            json_str = content

        # Fix quotes if strictly necessary
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