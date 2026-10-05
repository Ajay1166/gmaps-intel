"use client";

import React, { useState, useEffect } from "react";
import { useProject } from "../../lib/ProjectContext";
import { api, Post, Competitor } from "../../lib/api";
import {
  Inbox,
  Search,
  Filter,
  ExternalLink,
  Sparkles,
  Tag,
  Calendar,
  Layers,
  Store,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  X
} from "lucide-react";

export default function PostsRepositoryPage() {
  const { currentProject } = useProject();
  const [posts, setPosts] = useState<Post[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>("all");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [selectedContentType, setSelectedContentType] = useState<string>("all");
  const [selectedKeyword, setSelectedKeyword] = useState<string>("all");

  // AI Analyzing state
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);

  // Modal preview
  const [activePost, setActivePost] = useState<Post | null>(null);

  const fetchFiltersAndCompetitors = async () => {
    if (!currentProject) return;
    try {
      const [comps, tps, kws] = await Promise.all([
        api.getCompetitors(currentProject.id),
        api.getTopics(currentProject.id),
        api.getKeywords(currentProject.id),
      ]);
      setCompetitors(comps);
      setTopics(tps);
      setKeywords(kws);
    } catch (err) {
      console.error("Filter loading error:", err);
    }
  };

  const fetchPosts = async () => {
    if (!currentProject) return;
    try {
      setLoading(true);
      const data = await api.getPosts({
        project_id: currentProject.id,
        competitor_id: selectedCompetitor !== "all" ? Number(selectedCompetitor) : undefined,
        search: search.trim() || undefined,
        topic: selectedTopic !== "all" ? selectedTopic : undefined,
        content_type: selectedContentType !== "all" ? selectedContentType : undefined,
        keyword: selectedKeyword !== "all" ? selectedKeyword : undefined,
      });
      setPosts(data);
    } catch (err) {
      console.error("Failed to load posts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiltersAndCompetitors();
  }, [currentProject]);

  useEffect(() => {
    fetchPosts();
  }, [currentProject, selectedCompetitor, selectedTopic, selectedContentType, selectedKeyword]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts();
  };

  const handleAnalyzePost = async (postId: number) => {
    try {
      setAnalyzingId(postId);
      const res = await api.analyzePost(postId, "gemini");
      // Update locally
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, ...res.analysis, ai_analyzed: true } : p))
      );
    } catch (err) {
      console.error("AI Analysis failed:", err);
      alert("AI analysis error. Falling back to heuristic extraction.");
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleDeletePost = async (id: number) => {
    if (confirm("Delete this competitor post from repository?")) {
      try {
        await api.deletePost(id);
        setPosts((prev) => prev.filter((p) => p.id !== id));
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Competitor Posts Repository
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse, search, and inspect scraped updates from all monitored Google Maps profiles.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 self-start">
          {posts.length} Posts Found
        </div>
      </div>

      {/* Search & Multi-Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search post content, business name, or topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Competitor filter */}
          <div>
            <label className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">
              Competitor
            </label>
            <select
              value={selectedCompetitor}
              onChange={(e) => setSelectedCompetitor(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Competitors</option>
              {competitors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Topic filter */}
          <div>
            <label className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">
              Topic
            </label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Topics</option>
              {topics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Content Type filter */}
          <div>
            <label className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">
              Content Type
            </label>
            <select
              value={selectedContentType}
              onChange={(e) => setSelectedContentType(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Types</option>
              <option value="Promotion">Promotion</option>
              <option value="Announcement">Announcement</option>
              <option value="Educational">Educational</option>
              <option value="Case Study">Case Study / Review</option>
            </select>
          </div>

          {/* Keyword filter */}
          <div>
            <label className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">
              Keyword
            </label>
            <select
              value={selectedKeyword}
              onChange={(e) => setSelectedKeyword(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Keywords</option>
              {keywords.map((k) => (
                <option key={k} value={k}>
                  #{k}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Posts Cards Grid */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8">
          <Inbox className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            No posts match your filters
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Try resetting filters or initiating a fresh scrape run.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {posts.map((post) => (
            <div
              key={post.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div>
                {/* Header: Business & Date */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                      {post.business_name.slice(0, 1)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-slate-900 dark:text-white truncate max-w-[170px]">
                        {post.business_name}
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        {post.post_date_raw || "Recently"}
                      </span>
                    </div>
                  </div>

                  {post.post_url && (
                    <a
                      href={post.post_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-indigo-600 p-1"
                      title="Open on Google Maps"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {/* Badges: Topic & CTA */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    {post.topic || "General"}
                  </span>
                  {post.content_type && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {post.content_type}
                    </span>
                  )}
                  {post.call_to_action && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                      CTA: {post.call_to_action}
                    </span>
                  )}
                  {post.promotions && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                      🎁 Offer
                    </span>
                  )}
                </div>

                {/* Attached Image preview if any */}
                {post.images && post.images.length > 0 && (
                  <div
                    onClick={() => setActivePost(post)}
                    className="relative mb-3 h-36 w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer group"
                  >
                    <img
                      src={post.images[0]}
                      alt="Post visual"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    {post.images.length > 1 && (
                      <span className="absolute bottom-2 right-2 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-black/70 text-white">
                        +{post.images.length - 1} photos
                      </span>
                    )}
                  </div>
                )}

                {/* Post Content */}
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line line-clamp-4">
                  {post.content}
                </p>

                {/* Extracted Keywords */}
                {post.keywords && post.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {post.keywords.slice(0, 4).map((kw, i) => (
                      <span
                        key={i}
                        className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="pt-3 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                <button
                  onClick={() => handleAnalyzePost(post.id)}
                  disabled={analyzingId === post.id}
                  className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${analyzingId === post.id ? "animate-spin" : ""}`} />
                  <span>{analyzingId === post.id ? "Analyzing..." : "Re-Analyze with AI"}</span>
                </button>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setActivePost(post)}
                    className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded"
                    title="Delete post"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Full Post Details & Image View */}
      {activePost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {activePost.business_name}
                </h3>
                <span className="text-xs text-slate-400">{activePost.post_date_raw || "Recently"}</span>
              </div>
              <button
                onClick={() => setActivePost(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Images in modal */}
            {activePost.images && activePost.images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {activePost.images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt="visual"
                    className="rounded-xl w-full h-48 object-cover border border-slate-200 dark:border-slate-800"
                  />
                ))}
              </div>
            )}

            <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Post Text Content
              </span>
              <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-line leading-relaxed">
                {activePost.content}
              </p>
            </div>

            {/* Metadata pills */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Topic</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{activePost.topic}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Call To Action</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{activePost.call_to_action || "None"}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Content Type</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{activePost.content_type}</span>
              </div>
            </div>

            {/* Duplicate detection hash */}
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[11px]">
                Content Hash: {activePost.content_hash}
              </span>
              {activePost.post_url && (
                <a
                  href={activePost.post_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span>Open on Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
