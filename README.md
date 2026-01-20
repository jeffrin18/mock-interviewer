# 🚀 AI Mock Interviewer (Full Stack)

A "Bar-Raiser" interview simulation platform powered by **Llama 3** and **FastAPI**.
This application helps candidates prepare for high-bar technical roles by generating scenario-based questions tailored to their resume and target job description.

🔴 **Live Demo:** [https://mock-interviewer-beryl.vercel.app](https://mock-interviewer-beryl.vercel.app)

## ✨ Key Features
- **Context-Aware AI:** Analyzes Resume vs. Job Description to find skill gaps.
- **Mentor Mode:** Provides "Mini-Lessons" for every technical question to teach concepts instantly.
- **Text-to-Speech:** Built-in voice synthesis for realistic interview simulation.
- **PDF Export:** Generates downloadable study plans.
- **Anti-Rote Learning:** AI is prompted to reject textbook definitions and ask for creative system design solutions.

## 🛠️ Tech Stack
- **Frontend:** Next.js (React), TypeScript, TailwindCSS
- **Backend:** FastAPI (Python), Pydantic AI
- **AI Model:** Llama 3.3 70B (via Groq Cloud)
- **Deployment:** Vercel (Frontend) + Render (Backend)

## 🚀 How to Run Locally

### 1. Clone the Repo
```bash
git clone [https://github.com/YOUR_GITHUB_USERNAME/mock-interviewer.git](https://github.com/YOUR_GITHUB_USERNAME/mock-interviewer.git)
cd mock-interviewer