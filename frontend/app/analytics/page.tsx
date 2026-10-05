"use client";

import React, { useState, useEffect } from "react";
import { useProject } from "../../lib/ProjectContext";
import { api, DashboardMetrics, GapAnalysisResponse } from "../../lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  AlertCircle,
  Lightbulb,
  CheckCircle,
  ArrowUpRight,
  ShieldAlert,
  Percent
} from "lucide-react";

const COLORS = ["#4f46e5", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

export default function AnalyticsPage() {
  const { currentProject } = useProject();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!currentProject) return;
      try {
        setLoading(true);
        const [m, t, g] = await Promise.all([
          api.getDashboardMetrics(currentProject.id),
          api.getCompetitorTrends(currentProject.id),
          api.getGapAnalysis(currentProject.id),
        ]);
        setMetrics(m);
        setTrends(t.trends || []);
        setGapAnalysis(g);
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentProject]);

  const topicChartData = (metrics?.top_topics || []).map((t) => ({
    name: t.topic.length > 18 ? t.topic.slice(0, 18) + "..." : t.topic,
    count: t.count,
    percentage: t.percentage,
  }));

  const contentTypeData = (metrics?.content_types || []).map((ct) => ({
    name: ct.type,
    value: ct.count,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Trend Analysis & Competitor Intelligence
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Quantitative patterns, topic frequencies, and content gap analysis against local competitors.
        </p>
      </div>

      {/* Primary Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Most Common Topics (Bar Chart) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                <span>Most Common Topics (Volume)</span>
              </h2>
              <p className="text-xs text-slate-400">Total number of competitor updates by topic</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              Recharts Active
            </span>
          </div>

          <div className="h-64 w-full mt-4">
            {topicChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topicChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px",
                      border: "none",
                    }}
                  />
                  <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No topic data to render
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Content Types Breakdown (Pie Chart) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="mb-4">
            <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-blue-500" />
              <span>Content Type Share</span>
            </h2>
            <p className="text-xs text-slate-400">Promotion vs Announcement vs Educational</p>
          </div>

          <div className="h-64 w-full">
            {contentTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={contentTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {contentTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      borderRadius: "10px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No content type data
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Topic Frequency Table (%) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h2 className="font-bold text-base text-slate-900 dark:text-white mb-1 flex items-center gap-2">
          <Percent className="w-4 h-4 text-emerald-500" />
          <span>Topic Frequency Matrix</span>
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Detailed percentage breakdown of what competitor profiles post on Google Maps
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="pb-3 font-semibold">Topic Category</th>
                <th className="pb-3 font-semibold">Post Count</th>
                <th className="pb-3 font-semibold">Share (%)</th>
                <th className="pb-3 font-semibold">Market Saturation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {metrics?.top_topics && metrics.top_topics.length > 0 ? (
                metrics.top_topics.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 font-medium text-slate-800 dark:text-slate-200">{item.topic}</td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">{item.count}</td>
                    <td className="py-3 font-bold text-indigo-600 dark:text-indigo-400">{item.percentage}%</td>
                    <td className="py-3">
                      <div className="w-32 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${Math.min(100, item.percentage * 2)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-slate-400">
                    No data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Competitor Usage Comparison Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h2 className="font-bold text-base text-slate-900 dark:text-white mb-1">
          Competitor Activity & Posting Comparison
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Compare post volume, dominant topics, and active promotions per competitor
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="pb-3 font-semibold">Competitor</th>
                <th className="pb-3 font-semibold">Rating / Reviews</th>
                <th className="pb-3 font-semibold">Posts Scraped</th>
                <th className="pb-3 font-semibold">Top Topic</th>
                <th className="pb-3 font-semibold">Promotions Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {trends.map((c, i) => (
                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 font-semibold text-slate-900 dark:text-white">{c.competitor_name}</td>
                  <td className="py-3.5 text-slate-600 dark:text-slate-300">
                    ⭐ {c.rating} ({c.reviews_count})
                  </td>
                  <td className="py-3.5 font-bold text-indigo-600 dark:text-indigo-400">{c.total_posts}</td>
                  <td className="py-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {c.top_topic}
                    </span>
                  </td>
                  <td className="py-3.5">
                    {c.promotions_count > 0 ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                        {c.promotions_count} Promo Post(s)
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">None</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bonus Feature: Content Gap Analysis vs Competitors */}
      {gapAnalysis && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/30 border border-indigo-100 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Lightbulb className="w-4 h-4" />
                <span>Strategic Intelligence Bonus</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                Content Gap Analysis for {gapAnalysis.business_name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Identify high-converting topics competitors post that our business profile is missing.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-600 text-white shadow-xs">
              AI Gap Detector
            </span>
          </div>

          {/* Missing Content Topics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gapAnalysis.missing_topics.map((gap, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-850 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                    {gap.topic}
                  </h4>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      gap.importance_score === "High"
                        ? "bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400"
                        : "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {gap.importance_score} Priority
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Competitor Coverage: <span className="font-semibold text-slate-700 dark:text-slate-300">{gap.competitor_coverage_pct}%</span>
                </div>
                <p className="text-xs text-indigo-900 dark:text-indigo-200 mt-2 bg-indigo-50/60 dark:bg-indigo-950/40 p-2.5 rounded-lg leading-relaxed">
                  💡 <strong>Action Angle:</strong> {gap.suggested_angle_for_our_business}
                </p>
              </div>
            ))}
          </div>

          {/* Actionable Recommendations */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Competitor Outranking Recommendations</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
              {gapAnalysis.improvement_recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2">
                  <ArrowUpRight className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
