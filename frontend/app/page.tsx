"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useProject } from "../lib/ProjectContext";
import { api, DashboardMetrics, Post } from "../lib/api";
import {
  Users2,
  Inbox,
  Clock,
  CopyCheck,
  AlertTriangle,
  Sparkles,
  Bot,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Tag,
  CheckCircle2,
  Calendar,
  Layers
} from "lucide-react";

export default function DashboardPage() {
  const { currentProject, projects, loading: projectLoading } = useProject();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await api.getDashboardMetrics(currentProject?.id);
        setMetrics(data);
      } catch (err) {
        console.error("Failed to load metrics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentProject]);

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Competitor Intelligence Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time monitoring of competitor updates, content strategies, and Google Maps post frequency.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/scraper"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Bot className="w-4 h-4" />
            <span>Start Scraper</span>
          </Link>
          <Link
            href="/generator"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-medium text-sm transition-all"
          >
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Generate Content</span>
          </Link>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Competitors */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Competitors</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {metrics?.total_competitors ?? 0}
            </p>
            <Link href="/competitors" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-1 inline-block">
              Manage profiles →
            </Link>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Users2 className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Total Posts Collected */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Posts Collected</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {metrics?.total_posts ?? 0}
            </p>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1 inline-block">
              +{metrics?.new_posts_last_7_days ?? 0} in last 7 days
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Inbox className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Duplicates Skipped */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Duplicates Skipped</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {metrics?.duplicates_skipped ?? 0}
            </p>
            <span className="text-xs text-slate-400 font-medium mt-1 inline-block">
              Via SHA-256 Content Hash
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CopyCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4: Generated Content */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">AI Ideas & Posts</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {metrics?.generated_content_count ?? 0}
            </p>
            <span className="text-xs text-indigo-500 font-medium mt-1 inline-block">
              Gemini & OpenAI Ready
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Grid: Top Topics Breakdown + Keywords Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Topics Card */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                <span>Top Competitor Post Topics</span>
              </h2>
              <p className="text-xs text-slate-400">Frequency distribution of themes used in competitor updates</p>
            </div>
            <Link href="/analytics" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
              Deep Analytics →
            </Link>
          </div>

          <div className="space-y-3.5 mt-2">
            {metrics?.top_topics && metrics.top_topics.length > 0 ? (
              metrics.top_topics.map((t, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700 dark:text-slate-300">{t.topic}</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {t.count} posts ({t.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(5, t.percentage))}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No topic data available yet. Scrape or reload demo data.</p>
            )}
          </div>
        </div>

        {/* Top Keywords Cloud */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-blue-500" />
              <span>Competitor Keywords</span>
            </h2>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Top 10</span>
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            {metrics?.top_keywords && metrics.top_keywords.length > 0 ? (
              metrics.top_keywords.map((kw, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 transition-colors"
                >
                  #{kw.keyword} <span className="text-slate-400 text-[10px]">({kw.count})</span>
                </span>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4">No keywords extracted yet.</p>
            )}
          </div>

          {/* Scrape Health Warning if failures */}
          {metrics && metrics.failed_scrapes > 0 && (
            <div className="mt-6 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold text-amber-800 dark:text-amber-300">
                  {metrics.failed_scrapes} scrape errors recorded.
                </span>
                <p className="text-amber-700 dark:text-amber-400 mt-0.5">
                  Check Scraper logs for details or solve CAPTCHA if prompted.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Competitor Posts Feed */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-base text-slate-900 dark:text-white">
              Recent Competitor Google Maps Updates
            </h2>
            <p className="text-xs text-slate-400">Latest extracted posts from monitored business profiles</p>
          </div>
          <Link href="/posts" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
            View All ({metrics?.total_posts ?? 0}) →
          </Link>
        </div>

        {metrics?.recent_posts && metrics.recent_posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.recent_posts.map((post) => (
              <div
                key={post.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-xs text-slate-900 dark:text-white truncate max-w-[170px]">
                      {post.business_name}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {post.post_date_raw || "Recently"}
                    </span>
                  </div>

                  {/* Topic badge */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400">
                      {post.topic || "General"}
                    </span>
                    {post.call_to_action && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
                        CTA: {post.call_to_action}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                    {post.content}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-mono text-[10px]">
                    Hash: {post.content_hash.slice(0, 8)}...
                  </span>
                  {post.post_url && (
                    <a
                      href={post.post_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <span>Maps</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <Inbox className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No competitor posts collected yet</p>
            <p className="text-xs text-slate-400 mt-1">Click Start Scraper or Reload Demo Data to see posts</p>
          </div>
        )}
      </div>
    </div>
  );
}
