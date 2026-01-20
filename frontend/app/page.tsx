"use client";
import { useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";

export default function Home() {
  const [resume, setResume] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --- FEATURE 1: TEXT TO SPEECH ---
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      // Select a voice (optional, defaults to system voice)
      window.speechSynthesis.cancel(); // Stop previous audio
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Your browser does not support text-to-speech.");
    }
  };

  // --- FEATURE 2: PDF DOWNLOAD ---
  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(20);
    doc.text("Interview Masterclass Plan", 10, 20);
    
    // Feedback
    doc.setFontSize(12);
    doc.text("Resume Feedback:", 10, 40);
    const feedbackLines = doc.splitTextToSize(result.feedback, pageWidth - 20);
    doc.text(feedbackLines, 10, 50);

    let yPos = 50 + (feedbackLines.length * 10);

    // Questions (Simplified for PDF)
    doc.text("Technical Questions:", 10, yPos + 10);
    yPos += 20;

    result.technical_questions.forEach((q: any, i: number) => {
      if (yPos > 270) { doc.addPage(); yPos = 20; } // New page if full
      doc.setFontSize(10);
      const qText = doc.splitTextToSize(`${i + 1}. ${q.question_text}`, pageWidth - 20);
      doc.text(qText, 10, yPos);
      yPos += (qText.length * 5) + 5;
    });

    doc.save("interview-plan.pdf");
  };

  const handleSubmit = async () => {
    if (!resume || !jobDesc) {
      alert("Please fill in both fields!");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await axios.post("https://mock-interviewer-api.onrender.com/generate", {
        resume_text: resume,
        job_description: jobDesc,
      });
      setResult(response.data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-blue-400 flex items-center gap-2">
          Mock Interview Generator <span className="text-sm text-gray-500 font-normal border border-gray-700 px-2 py-1 rounded">PRO Version</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-semibold mb-2">Resume</label>
            <textarea
              className="w-full h-64 p-4 bg-gray-800 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
              placeholder="Paste your resume..."
              value={resume}
              onChange={(e) => setResume(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Job Description</label>
            <textarea
              className="w-full h-64 p-4 bg-gray-800 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
              placeholder="Paste the job description..."
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full py-4 rounded font-bold text-lg transition-colors ${
            loading ? "bg-gray-600 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Generating Masterclass Plan..." : "Generate Interview Plan"}
        </button>

        {error && <div className="mt-6 p-4 bg-red-900/50 border border-red-500 rounded text-red-200">{error}</div>}

        {result && (
          <div className="mt-12 space-y-8 animate-fade-in">
            
            {/* Download Button */}
            <div className="flex justify-between items-center bg-gray-800 p-4 rounded-lg">
                <h2 className="text-xl font-bold text-green-400">Your Custom Plan</h2>
                <button onClick={downloadPDF} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-semibold text-sm flex items-center gap-2">
                    📄 Download PDF
                </button>
            </div>

            {/* Feedback */}
            <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-yellow-500">
              <h2 className="text-xl font-bold mb-2 text-yellow-400">Resume Analysis</h2>
              <p className="text-gray-300 leading-relaxed">{result.feedback}</p>
            </div>

            {/* Technical Questions */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-purple-400">Technical Deep Dive</h2>
              <div className="space-y-4">
                {result.technical_questions.map((q: any, i: number) => (
                  <div key={i} className="bg-gray-800 p-6 rounded-lg border border-gray-700 relative">
                    <div className="flex justify-between items-start mb-3 gap-4">
                        <p className="font-semibold text-lg text-white flex-1">
                        {i + 1}. {q.question_text}
                        </p>
                        {/* SPEAK BUTTON */}
                        <button 
                            onClick={() => speak(q.question_text)}
                            className="bg-gray-700 hover:bg-blue-600 p-2 rounded-full transition-colors text-xl"
                            title="Read Aloud"
                        >
                            🗣️
                        </button>
                    </div>
                    
                    <div className="bg-gray-900/50 p-4 rounded mb-4">
                      <p className="text-xs text-green-400 uppercase tracking-wide font-bold mb-2">Key Points:</p>
                      <ul className="list-disc list-inside space-y-1 text-gray-300">
                        {q.ideal_answer_points.map((point: string, j: number) => <li key={j}>{point}</li>)}
                      </ul>
                    </div>

                    <details className="group mt-4 bg-gray-900/80 rounded-lg overflow-hidden border border-gray-600">
                        <summary className="flex items-center gap-2 p-3 cursor-pointer hover:bg-gray-800 text-sm font-medium text-cyan-400">
                            <span>💡 Mentor Guide (Click to Reveal)</span>
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
              <h2 className="text-2xl font-bold mb-4 text-pink-400">Behavioral Questions</h2>
              <div className="space-y-4">
                {result.behavioral_questions.map((q: any, i: number) => (
                  <div key={i} className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                     <div className="flex justify-between items-start mb-3 gap-4">
                        <p className="font-semibold text-lg text-white flex-1">{i + 1}. {q.question_text}</p>
                        <button onClick={() => speak(q.question_text)} className="bg-gray-700 hover:bg-pink-600 p-2 rounded-full transition-colors text-xl">🗣️</button>
                    </div>
                    {q.answer_guide && (
                        <details className="group mt-4 bg-gray-900/80 rounded-lg overflow-hidden border border-gray-600">
                            <summary className="flex items-center gap-2 p-3 cursor-pointer hover:bg-gray-800 text-sm font-medium text-pink-400">
                                <span>💡 Mentor Tip</span>
                                <span className="group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="p-4 pt-0 text-gray-300 text-sm border-t border-gray-700 mt-2">
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