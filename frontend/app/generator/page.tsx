"use client";

import React, { useState } from "react";
import { useProject } from "../../lib/ProjectContext";
import { api, GeneratedIdea, GeneratedPost } from "../../lib/api";
import {
  Sparkles,
  Bot,
  Copy,
  Check,
  Send,
  Layers,
  Lightbulb,
  FileText,
  ImageIcon,
  Hash,
  MousePointerClick,
  Sliders,
  Flame
} from "lucide-react";

export default function GeneratorPage() {
  const { currentProject } = useProject();
  const [activeTab, setActiveTab] = useState<"ideas" | "posts">("ideas");

  // Idea Generator State
  const [ideaCount, setIdeaCount] = useState<number>(5);
  const [ideaTopicFocus, setIdeaTopicFocus] = useState<string>("");
  const [ideaProvider, setIdeaProvider] = useState<string>("gemini");
  const [generatedIdeas, setGeneratedIdeas] = useState<GeneratedIdea[]>([]);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [ideasProviderUsed, setIdeasProviderUsed] = useState<string>("");

  // Post Generator State
  const [postTopic, setPostTopic] = useState<string>("Special Spring Promotion");
  const [postTone, setPostTone] = useState<string>("Friendly & Trustworthy");
  const [includeOffer, setIncludeOffer] = useState<boolean>(true);
  const [customInstructions, setCustomInstructions] = useState<string>("");
  const [postProvider, setPostProvider] = useState<string>("gemini");
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);
  const [postLoading, setPostLoading] = useState(false);
  const [postProviderUsed, setPostProviderUsed] = useState<string>("");

  // Copy Feedback state
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedPost, setCopiedPost] = useState(false);

  const handleGenerateIdeas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;

    try {
      setIdeasLoading(true);
      const res = await api.generateIdeas({
        project_id: currentProject.id,
        count: ideaCount,
        topic_focus: ideaTopicFocus.trim() || undefined,
        ai_provider: ideaProvider,
      });
      setGeneratedIdeas(res.ideas || []);
      setIdeasProviderUsed(res.ai_provider_used);
    } catch (err) {
      console.error("Idea generation failed:", err);
      alert("Idea generation error. Check backend connection.");
    } finally {
      setIdeasLoading(false);
    }
  };

  const handleGeneratePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;

    try {
      setPostLoading(true);
      const res = await api.generatePost({
        project_id: currentProject.id,
        topic: postTopic,
        tone: postTone,
        include_offer: includeOffer,
        custom_instructions: customInstructions.trim() || undefined,
        ai_provider: postProvider,
      });
      setGeneratedPost(res.post);
      setPostProviderUsed(res.ai_provider_used);
    } catch (err) {
      console.error("Post generation failed:", err);
      alert("Post generation error. Check backend connection.");
    } finally {
      setPostLoading(false);
    }
  };

  const copyToClipboard = (text: string, index?: number) => {
    navigator.clipboard.writeText(text);
    if (typeof index === "number") {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2500);
    } else {
      setCopiedPost(true);
      setTimeout(() => setCopiedPost(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-indigo-500" />
          <span>AI Content Intelligence & Generator</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Turn competitor posts into unique, non-generic Google Maps update ideas and high-converting posts.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("ideas")}
          className={`flex items-center space-x-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "ideas"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          <span>Content Idea Generator</span>
        </button>

        <button
          onClick={() => setActiveTab("posts")}
          className={`flex items-center space-x-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "posts"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Google Maps Post Generator</span>
        </button>
      </div>

      {/* TAB 1: CONTENT IDEA GENERATOR */}
      {activeTab === "ideas" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Form */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs h-fit space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
              Idea Parameters
            </h3>

            <form onSubmit={handleGenerateIdeas} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Number of Ideas
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 10, 50].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setIdeaCount(num)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        ideaCount === num
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {num} Ideas
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Topic Focus (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Teeth Whitening, Emergency Care"
                  value={ideaTopicFocus}
                  onChange={(e) => setIdeaTopicFocus(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  AI Engine Provider
                </label>
                <select
                  value={ideaProvider}
                  onChange={(e) => setIdeaProvider(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-slate-200"
                >
                  <option value="gemini">Google Gemini 1.5 Flash</option>
                  <option value="openai">OpenAI GPT-4o-mini</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  *Uses heuristic engine fallback if API keys are not supplied.
                </span>
              </div>

              <button
                type="submit"
                disabled={ideasLoading}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className={`w-3.5 h-3.5 ${ideasLoading ? "animate-spin" : ""}`} />
                <span>{ideasLoading ? "Analyzing Competitor Data..." : `Generate ${ideaCount} Ideas`}</span>
              </button>
            </form>
          </div>

          {/* Ideas Results Grid */}
          <div className="lg:col-span-2 space-y-4">
            {ideasProviderUsed && (
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Generated {generatedIdeas.length} ideas using:{" "}
                  <strong className="text-indigo-600 dark:text-indigo-400">{ideasProviderUsed}</strong>
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  ✓ Anti-duplication active
                </span>
              </div>
            )}

            {ideasLoading ? (
              <div className="p-16 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
                <p className="text-xs text-slate-400">Mining competitor updates and finding gaps...</p>
              </div>
            ) : generatedIdeas.length > 0 ? (
              <div className="space-y-3.5">
                {generatedIdeas.map((idea, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 uppercase">
                          {idea.topic}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1.5">
                          {idea.title}
                        </h4>
                      </div>

                      <button
                        onClick={() => copyToClipboard(`${idea.title}\n\n${idea.description}`, idx)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-600 text-xs flex items-center gap-1 cursor-pointer"
                        title="Copy idea"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-[10px] text-emerald-500">Copied</span>
                          </>
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {idea.description}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                        <span className="text-slate-400 font-semibold block text-[10px]">Strategic Angle:</span>
                        <span className="text-slate-700 dark:text-slate-200">{idea.angle}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                        <span className="text-slate-400 font-semibold block text-[10px]">Competitor Hook:</span>
                        <span className="text-slate-700 dark:text-slate-200">{idea.competitor_insight}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        Suggested CTA: {idea.suggested_call_to_action}
                      </span>
                      <button
                        onClick={() => {
                          setPostTopic(idea.title);
                          setActiveTab("posts");
                        }}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        Draft Post from this Idea →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <Lightbulb className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Ready to generate ideas
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Choose a count and click "Generate Ideas" to extract insights from competitor posts.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: GOOGLE MAPS POST GENERATOR */}
      {activeTab === "posts" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Post Form */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
              Post Settings
            </h3>

            <form onSubmit={handleGeneratePost} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Post Topic / Subject *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Free 3D Smile Scan with Clear Aligners"
                  value={postTopic}
                  onChange={(e) => setPostTopic(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Tone of Voice
                  </label>
                  <select
                    value={postTone}
                    onChange={(e) => setPostTone(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-slate-200"
                  >
                    <option value="Friendly & Welcoming">Friendly & Welcoming</option>
                    <option value="Professional & Authoritative">Professional & Authoritative</option>
                    <option value="Urgent & Promotional">Urgent & Promotional</option>
                    <option value="Educational & Informative">Educational & Informative</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    AI Provider
                  </label>
                  <select
                    value={postProvider}
                    onChange={(e) => setPostProvider(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-slate-200"
                  >
                    <option value="gemini">Google Gemini 1.5</option>
                    <option value="openai">OpenAI GPT-4o-mini</option>
                  </select>
                </div>
              </div>

              {/* Special Offer checkbox */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="includeOffer"
                  checked={includeOffer}
                  onChange={(e) => setIncludeOffer(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <label htmlFor="includeOffer" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Include an introductory discount / special promotional incentive
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Custom Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Mention Saturday slots, parking availability, or specific doctor credentials..."
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={postLoading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white font-semibold text-xs shadow-xs disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className={`w-3.5 h-3.5 ${postLoading ? "animate-spin" : ""}`} />
                <span>{postLoading ? "Crafting Post..." : "Generate Complete Google Maps Post"}</span>
              </button>
            </form>
          </div>

          {/* Generated Post Output Preview */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  <span>Google Maps Post Preview</span>
                </h3>

                {generatedPost && (
                  <button
                    onClick={() => copyToClipboard(generatedPost.content)}
                    className="flex items-center space-x-1 text-xs font-medium px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    {copiedPost ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500 text-[10px]">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy Post</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {postLoading ? (
                <div className="py-20 flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
                  <p className="text-xs text-slate-400">Writing optimized Google Maps update...</p>
                </div>
              ) : generatedPost ? (
                <div className="space-y-4 mt-4">
                  {/* Topic badge */}
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                      Topic: {generatedPost.topic}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {generatedPost.character_count} chars
                    </span>
                  </div>

                  {/* Post Content Body */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-800 dark:text-slate-100 whitespace-pre-line leading-relaxed">
                      {generatedPost.content}
                    </p>
                  </div>

                  {/* Action CTA Button Simulation */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/50">
                    <div className="flex items-center space-x-2">
                      <MousePointerClick className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                        Call-To-Action Button:
                      </span>
                    </div>
                    <span className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs shadow-xs">
                      {generatedPost.call_to_action}
                    </span>
                  </div>

                  {/* Keywords */}
                  <div>
                    <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-1.5 flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      <span>Local SEO Keywords & Tags</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {generatedPost.keywords.map((kw, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        >
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Suggested Image Prompt */}
                  <div className="p-3.5 rounded-xl bg-violet-50/60 dark:bg-violet-950/30 border border-violet-200/60 dark:border-violet-800/40">
                    <span className="text-xs font-bold text-violet-700 dark:text-violet-300 flex items-center gap-1.5 mb-1">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Suggested Visual / Photo Idea</span>
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                      "{generatedPost.image_idea}"
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-xs text-slate-400">
                  Fill in the parameters on the left and click "Generate Complete Google Maps Post".
                </div>
              )}
            </div>

            {postProviderUsed && (
              <div className="pt-3 mt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                Generated with AI engine: <strong className="text-indigo-500">{postProviderUsed}</strong>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
