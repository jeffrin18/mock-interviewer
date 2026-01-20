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
# Paste your Groq Key here
# --- 1. CONFIGURATION ---
# We get the key from the Environment Variables (Safe for GitHub)
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY is not set. Check your .env file or Render settings.")

# --- 2. INITIALIZE MODEL ---
model = GroqModel('llama-3.3-70b-versatile')

agent = Agent(
    model,
    system_prompt="You are a strict technical interviewer. You must output JSON only."
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

    prompt = f"""
    Analyze this candidate:
    RESUME: {data.resume_text}
    JOB: {data.job_description}
    
    TASK:
    Generate a harsh, realistic interview plan.
    
    OUTPUT REQUIREMENTS:
    1. Feedback: 2-3 sentences on resume fit.
    2. Technical Questions: EXACTLY 5 challenging questions.
    3. Behavioral Questions: EXACTLY 3 situational questions.
    
    OUTPUT FORMAT:
    Return ONLY valid JSON. No markdown. No conversational text.
    Use double quotes for keys.
    
    Structure:
    {{
      "feedback": "string",
      "technical_questions": [
        {{
          "question_text": "string",
          "context": "string",
          "ideal_answer_points": ["string", "string"]
        }}
      ],
      "behavioral_questions": [
        {{
          "question_text": "string",
          "context": "string",
          "ideal_answer_points": ["string", "string"]
        }}
      ]
    }}
    """

    try:
        # Run Pydantic AI Agent
        result = await agent.run(prompt)
        
        # --- NUCLEAR EXTRACTION LOGIC ---
        # 1. Try to get raw text from known attributes
        content = ""
        if hasattr(result, 'data'):
            content = result.data
        elif hasattr(result, 'output'): 
            content = result.output
        else:
            content = str(result)
            
        print(f"Extracted Content: {str(content)[:100]}...")

        # 2. Force Convert to String
        if not isinstance(content, str):
            content = str(content)

        # 3. Regex to find the FIRST JSON object { ... }
        match = re.search(r'\{.*\}', content, re.DOTALL)
        
        if match:
            json_str = match.group(0)
            json_str = json_str.replace("```json", "").replace("```", "")
        else:
            json_str = content

        print("Parsing JSON...")
        
        # 4. Final Parse
        try:
            json_data = json.loads(json_str)
        except json.JSONDecodeError:
            print("Standard parse failed. Attempting quote fix...")
            fixed_str = json_str.replace("'", '"')
            json_data = json.loads(fixed_str)

        # 5. Validate with Pydantic
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