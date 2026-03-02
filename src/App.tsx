import { useState, useRef } from "react";
import { Search, Upload, Loader2, BookOpen, ChevronRight, Image as ImageIcon, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Markdown from "react-markdown";
import { performDeepResearch, getQuickSummary, ResearchResult } from "./services/gemini";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [topic, setTopic] = useState("");
  const [image, setImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quickSummary, setQuickSummary] = useState("");
  const [result, setResult] = useState<ResearchResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(",")[1];
        setImage({ data: base64, mimeType: file.type });
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() && !image) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setQuickSummary("");

    try {
      // Parallel calls: Quick summary (Flash Lite) and Deep Research (Pro Thinking)
      const [summary, deepResult] = await Promise.all([
        topic ? getQuickSummary(topic) : Promise.resolve("Analyzing image..."),
        performDeepResearch(topic || "the provided image", image || undefined)
      ]);

      setQuickSummary(summary);
      setResult(deepResult);
    } catch (err: any) {
      console.error("Research failed:", err);
      setError(err.message || "An unexpected error occurred during research.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans selection:bg-emerald-100">
      {/* Header */}
      <header className="border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold tracking-tight text-lg">OmniResearch</span>
          </div>
          <div className="text-xs font-mono text-black/40 uppercase tracking-widest">
            AI Research Engine v1.0
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Search Section */}
        <section className="mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <h1 className="text-5xl md:text-6xl font-medium tracking-tight mb-4">
              What are we <span className="italic font-serif">exploring</span> today?
            </h1>
            <p className="text-black/50 max-w-xl mx-auto text-lg">
              Enter a topic, name, or upload an image to begin a deep, multi-step research journey.
            </p>
          </motion.div>

          <form onSubmit={handleSearch} className="relative max-w-3xl mx-auto">
            <div className="relative group">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-black/30 group-focus-within:text-black transition-colors" />
              </div>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Search for anything..."
                className="w-full bg-white border border-black/10 rounded-2xl py-5 pl-14 pr-32 text-xl focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black/20 transition-all shadow-sm"
              />
              <div className="absolute inset-y-2 right-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "p-3 rounded-xl transition-colors relative",
                    imagePreview ? "bg-emerald-50 text-emerald-600" : "hover:bg-black/5 text-black/40"
                  )}
                >
                  {imagePreview ? <ImageIcon className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                  {imagePreview && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                  )}
                </button>
                <button
                  type="submit"
                  disabled={loading || (!topic.trim() && !image)}
                  className="bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-black/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Research"}
                </button>
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            
            {imagePreview && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-4 flex items-center gap-4 p-3 bg-white border border-black/5 rounded-xl shadow-sm w-fit"
              >
                <img src={imagePreview} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />
                <div className="text-sm">
                  <p className="font-medium">Image attached</p>
                  <button 
                    type="button"
                    onClick={() => { setImage(null); setImagePreview(null); }}
                    className="text-red-500 hover:underline text-xs"
                  >
                    Remove
                  </button>
                </div>
              </motion.div>
            )}
          </form>
        </section>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 p-6 bg-red-50 border border-red-100 rounded-2xl text-red-700 flex items-start gap-4"
            >
              <div className="p-2 bg-red-100 rounded-lg">
                <Loader2 className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-semibold">Research Interrupted</h3>
                <p className="text-sm opacity-80">{error}</p>
                <button 
                  onClick={() => handleSearch({ preventDefault: () => {} } as any)}
                  className="mt-3 text-sm font-medium underline hover:no-underline"
                >
                  Try again
                </button>
              </div>
            </motion.div>
          )}

          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 gap-6"
            >
              <div className="relative">
                <Loader2 className="w-12 h-12 animate-spin text-black/20" />
                <Sparkles className="w-6 h-6 text-black absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-xl font-medium">Synthesizing knowledge...</p>
                <p className="text-black/40 text-sm mt-1">Using Advanced Reasoning (Thinking Mode)</p>
              </div>
            </motion.div>
          ) : result ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12"
            >
              {/* Summary Card */}
              <div className="bg-white border border-black/5 rounded-3xl p-8 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded">
                    Quick Overview
                  </div>
                </div>
                <h2 className="text-3xl font-medium mb-4">{topic || "Visual Analysis"}</h2>
                <p className="text-xl text-black/70 leading-relaxed italic font-serif">
                  {quickSummary}
                </p>
                <div className="mt-6 pt-6 border-t border-black/5">
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-black/40 mb-3">Executive Summary</h3>
                  <div className="prose prose-slate max-w-none">
                    <Markdown>{result.summary}</Markdown>
                  </div>
                </div>
              </div>

              {/* Research Steps */}
              <div className="space-y-8">
                <h3 className="text-2xl font-medium flex items-center gap-3">
                  <ChevronRight className="w-6 h-6" />
                  Step-by-Step Deep Dive
                </h3>
                <div className="grid gap-6">
                  {result.steps.map((step, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="group flex gap-6"
                    >
                      <div className="flex-none">
                        <div className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center font-mono text-sm group-hover:bg-black group-hover:text-white transition-colors">
                          {String(idx + 1).padStart(2, '0')}
                        </div>
                        {idx < result.steps.length - 1 && (
                          <div className="w-px h-full bg-black/5 mx-auto mt-2" />
                        )}
                      </div>
                      <div className="pb-8">
                        <h4 className="text-xl font-semibold mb-2">{step.title}</h4>
                        <div className="prose prose-slate max-w-none text-black/70">
                          <Markdown>{step.content}</Markdown>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Further Questions */}
              <div className="bg-black text-white rounded-3xl p-8">
                <h3 className="text-xl font-medium mb-6 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  Further Inquiry
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {result.furtherQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setTopic(q); handleSearch({ preventDefault: () => {} } as any); }}
                      className="text-left p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors text-sm leading-snug"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/5 rounded-full text-sm text-black/40 mb-4">
                <Sparkles className="w-4 h-4" />
                Powered by Gemini 3.1 Pro Thinking
              </div>
              <p className="text-black/30">Your research results will appear here.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-black/5 py-12 mt-20">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <BookOpen className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-widest">OmniResearch AI</span>
          </div>
          <div className="text-xs text-black/30">
            © 2026 AI Research Systems. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
