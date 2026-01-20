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
      // Connect to your Python Backend
      const response = await axios.post("http://127.0.0.1:8000/generate", {
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
          Mock Interview Generator
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
          {loading ? "Generating Interview..." : "Generate Interview Plan"}
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
                Technical Questions
              </h2>
              <div className="space-y-4">
                {result.technical_questions.map((q: any, i: number) => (
                  <div key={i} className="bg-gray-800 p-6 rounded-lg">
                    <p className="font-semibold text-lg mb-2">
                      {i + 1}. {q.question_text}
                    </p>
                    <p className="text-sm text-gray-400 mb-4 italic">
                      Context: {q.context}
                    </p>
                    <div className="bg-gray-900/50 p-4 rounded">
                      <p className="text-xs text-green-400 uppercase tracking-wide font-bold mb-2">
                        Look for this in the answer:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-gray-300">
                        {q.ideal_answer_points.map((point: string, j: number) => (
                          <li key={j}>{point}</li>
                        ))}
                      </ul>
                    </div>
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
                  <div key={i} className="bg-gray-800 p-6 rounded-lg">
                    <p className="font-semibold text-lg mb-2">
                      {i + 1}. {q.question_text}
                    </p>
                    <p className="text-sm text-gray-400 italic">
                      Context: {q.context}
                    </p>
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