"use client";
import { useState } from "react";
import axios from "axios";

export default function Home() {
  const [resume, setResume] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!resume || !jobDesc) {
      alert("Please fill in both fields!");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      // Connect to your Live Render Backend
      const response = await axios.post("https://mock-interviewer-api.onrender.com/generate", {
        resume_text: resume,
        job_description: jobDesc,
      });
      setResult(response.data);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 429) {
        setError("AI is busy (Rate Limit). Please wait 10 seconds and try again.");
      } else {
        setError("Failed to connect to the server. Is the backend running?");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-blue-400">
          Mock Interview Generator <span className="text-sm text-gray-500 font-normal">(Mentor Mode)</span>
        </h1>

        {/* INPUT SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Paste Resume Text
            </label>
            <textarea
              className="w-full h-64 p-4 bg-gray-800 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
              placeholder="Paste your resume here..."
              value={resume}
              onChange={(e) => setResume(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">
              Paste Job Description
            </label>
            <textarea
              className="w-full h-64 p-4 bg-gray-800 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
              placeholder="Paste the job description here..."
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
            />
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full py-4 rounded font-bold text-lg transition-colors ${
            loading
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Generating Masterclass Plan..." : "Generate Interview Plan"}
        </button>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mt-6 p-4 bg-red-900/50 border border-red-500 rounded text-red-200">
            {error}
          </div>
        )}

        {/* RESULTS SECTION */}
        {result && (
          <div className="mt-12 space-y-8 animate-fade-in">
            
            {/* Feedback */}
            <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-yellow-500">
              <h2 className="text-xl font-bold mb-2 text-yellow-400">
                Resume Feedback
              </h2>
              <p className="text-gray-300 leading-relaxed">{result.feedback}</p>
            </div>

            {/* Technical Questions */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-purple-400">
                Technical Questions (Deep Dive)
              </h2>
              <div className="space-y-4">
                {result.technical_questions.map((q: any, i: number) => (
                  <div key={i} className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <div className="flex justify-between items-start mb-3">
                        <p className="font-semibold text-lg text-white">
                        {i + 1}. {q.question_text}
                        </p>
                    </div>
                    
                    <p className="text-sm text-gray-400 mb-4 italic">
                      Context: {q.context}
                    </p>

                    <div className="bg-gray-900/50 p-4 rounded mb-4">
                      <p className="text-xs text-green-400 uppercase tracking-wide font-bold mb-2">
                        Key Points to Hit:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-gray-300">
                        {q.ideal_answer_points.map((point: string, j: number) => (
                          <li key={j}>{point}</li>
                        ))}
                      </ul>
                    </div>

                    {/* --- NEW: MENTOR MODE REVEAL --- */}
                    <details className="group mt-4 bg-gray-900/80 rounded-lg overflow-hidden border border-gray-600">
                        <summary className="flex items-center gap-2 p-3 cursor-pointer hover:bg-gray-800 transition-colors text-sm font-medium text-cyan-400 select-none">
                            <span>💡 Click to Learn the Concept (Mentor Guide)</span>
                            <span className="group-open:rotate-180 transition-transform">▼</span>
                        </summary>
                        <div className="p-4 pt-0 text-gray-300 text-sm leading-relaxed border-t border-gray-700 mt-2">
                            <p className="italic text-gray-400">"{q.answer_guide}"</p>
                        </div>
                    </details>
                  </div>
                ))}
              </div>
            </div>

            {/* Behavioral Questions */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-pink-400">
                Behavioral Questions
              </h2>
              <div className="space-y-4">
                {result.behavioral_questions.map((q: any, i: number) => (
                  <div key={i} className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <p className="font-semibold text-lg mb-2">
                      {i + 1}. {q.question_text}
                    </p>
                    <p className="text-sm text-gray-400 italic mb-4">
                      Context: {q.context}
                    </p>
                    
                    {/* --- NEW: MENTOR MODE REVEAL --- */}
                    {q.answer_guide && (
                        <details className="group mt-4 bg-gray-900/80 rounded-lg overflow-hidden border border-gray-600">
                            <summary className="flex items-center gap-2 p-3 cursor-pointer hover:bg-gray-800 transition-colors text-sm font-medium text-pink-400 select-none">
                                <span>💡 Mentor Tip: How to answer this</span>
                                <span className="group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="p-4 pt-0 text-gray-300 text-sm leading-relaxed border-t border-gray-700 mt-2">
                                <p className="italic text-gray-400">"{q.answer_guide}"</p>
                            </div>
                        </details>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}