"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useProject } from "../../lib/ProjectContext";
import { api, Competitor, ScrapeLog } from "../../lib/api";
import {
  Bot,
  Play,
  Terminal,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCcw,
  ShieldAlert,
  Sliders,
  Check,
  XCircle,
  ExternalLink
} from "lucide-react";

function ScraperContent() {
  const { currentProject } = useProject();
  const searchParams = useSearchParams();
  const initialCompetitorId = searchParams.get("competitor_id");

  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [selectedCompetitorId, setSelectedCompetitorId] = useState<string>(
    initialCompetitorId || "all"
  );
  const [useSimulation, setUseSimulation] = useState<boolean>(true); // Default to fast simulated / graceful mode
  const [maxPosts, setMaxPosts] = useState<number>(10);
  const [isScraping, setIsScraping] = useState<boolean>(false);

  // Live Terminal Logs & Events
  const [liveLogs, setLiveLogs] = useState<string[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);

  // CAPTCHA State
  const [captchaAlert, setCaptchaAlert] = useState<{
    competitorId: number;
    competitorName: string;
    message: string;
  } | null>(null);

  // Historical Scrape Logs
  const [historyLogs, setHistoryLogs] = useState<ScrapeLog[]>([]);

  const loadData = async () => {
    if (!currentProject) return;
    try {
      const [comps, logs] = await Promise.all([
        api.getCompetitors(currentProject.id),
        api.getScrapeLogs(currentProject.id),
      ]);
      setCompetitors(comps);
      setHistoryLogs(logs);
    } catch (err) {
      console.error("Failed to load scraper page data:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentProject]);

  // Connect to SSE live stream for real-time logs
  useEffect(() => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const eventSource = new EventSource(`${API_BASE}/api/scraper/events`);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "scrape_started") {
          setIsScraping(true);
          appendLog(`🚀 Scrape started for project (Competitors: ${payload.data.competitor_count})`);
        } else if (payload.type === "competitor_scraping") {
          appendLog(`🔍 Scraping competitor: ${payload.data.competitor_name}...`);
        } else if (payload.type === "captcha_alert") {
          appendLog(`⚠️ CAPTCHA detected for ${payload.data.competitor_name}! Pausing for user.`);
          setCaptchaAlert({
            competitorId: payload.data.competitor_id,
            competitorName: payload.data.competitor_name,
            message: payload.data.message,
          });
        } else if (payload.type === "competitor_completed") {
          appendLog(
            `✅ Completed ${payload.data.competitor_name}: Added ${payload.data.posts_added} posts, skipped ${payload.data.duplicates_skipped} duplicates.`
          );
          // Refresh list to update counts
          loadData();
        } else if (payload.type === "scrape_completed") {
          setIsScraping(false);
          appendLog(`🎉 Scrape job finished! Total added: ${payload.data.total_posts_added}, Duplicates skipped: ${payload.data.total_duplicates_skipped}`);
          loadData();
        } else if (payload.type === "scrape_error") {
          setIsScraping(false);
          appendLog(`❌ Scrape error: ${payload.data.error}`);
        }
      } catch (err) {
        // Heartbeat or raw string
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const appendLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLiveLogs((prev) => [...prev.slice(-100), `[${timestamp}] ${msg}`]);
    setTimeout(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    }, 50);
  };

  const handleStartScrape = async () => {
    if (!currentProject) return;
    try {
      setIsScraping(true);
      setLiveLogs([]);
      appendLog(`Sending scrape command to backend for project: ${currentProject.name}`);

      const competitorIds =
        selectedCompetitorId !== "all" ? [Number(selectedCompetitorId)] : undefined;

      await api.triggerScrape({
        project_id: currentProject.id,
        competitor_ids: competitorIds,
        use_simulation: useSimulation,
        max_posts_per_competitor: maxPosts,
      });
    } catch (err) {
      console.error("Trigger scrape failed:", err);
      appendLog(`Failed to initiate scrape: ${err}`);
      setIsScraping(false);
    }
  };

  const handleResumeCaptcha = async (compId: number) => {
    try {
      appendLog(`Sending resume signal for competitor ${compId}...`);
      await api.resumeCaptcha(compId);
      setCaptchaAlert(null);
      appendLog(`Resume signal registered. Continuing scrape workflow.`);
    } catch (err) {
      console.error("Resume captcha failed:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Bot className="w-6 h-6 text-indigo-500" />
          <span>Google Maps Scraping Engine</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Automated extraction of business profile updates, duplicate detection with SHA-256, and live event monitoring.
        </p>
      </div>

      {/* CAPTCHA Alert Banner (Requirement 2 & 11) */}
      {captchaAlert && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 shadow-md animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start space-x-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-amber-900 dark:text-amber-200">
                  Google CAPTCHA Detected: Manual Intervention Required
                </h4>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                  {captchaAlert.message}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleResumeCaptcha(captchaAlert.competitorId)}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs self-start sm:self-auto cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>I Have Solved CAPTCHA / Continue</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Controls + Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scraper Controls Form */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 h-fit">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-indigo-500" />
            <span>Workflow Configuration</span>
          </h3>

          <div className="space-y-4">
            {/* Target Competitor */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Target Competitor
              </label>
              <select
                value={selectedCompetitorId}
                onChange={(e) => setSelectedCompetitorId(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-slate-200"
              >
                <option value="all">All Competitors in Project ({competitors.length})</option>
                {competitors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.post_count} posts)
                  </option>
                ))}
              </select>
            </div>

            {/* Scraping Engine Mode */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Engine Mode
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer bg-slate-50/50 dark:bg-slate-850">
                  <input
                    type="radio"
                    name="mode"
                    checked={useSimulation}
                    onChange={() => setUseSimulation(true)}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Fast Simulation Mode (Recommended for testing)
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Instant, bypasses Google bot-detection, extracts realistic sample updates.
                    </span>
                  </div>
                </label>

                <label className="flex items-center space-x-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer bg-slate-50/50 dark:bg-slate-850">
                  <input
                    type="radio"
                    name="mode"
                    checked={!useSimulation}
                    onChange={() => setUseSimulation(false)}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Live Selenium WebDriver
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Launches headless Chrome to navigate actual Google Maps URLs.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Max posts per competitor */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                <span>Max Posts per Competitor</span>
                <span className="text-indigo-600 dark:text-indigo-400">{maxPosts}</span>
              </div>
              <input
                type="range"
                min="3"
                max="25"
                value={maxPosts}
                onChange={(e) => setMaxPosts(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartScrape}
              disabled={isScraping || competitors.length === 0}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isScraping ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Scraping In Progress...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Start Scraping Run</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Terminal & Competitor Status List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Competitor Status Pills */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Live Competitor Status
            </h4>
            <div className="flex flex-wrap gap-2">
              {competitors.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{c.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      c.status === "success"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                        : c.status === "scraping"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 animate-pulse"
                        : c.status === "captcha"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                        : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Progress Terminal (SSE Stream) */}
          <div className="p-5 rounded-2xl bg-slate-950 text-slate-100 border border-slate-800 shadow-md font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-slate-200">Live Scraper Terminal Stream</span>
              </div>
              <span className="flex items-center space-x-1.5 text-[10px] text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Connected via SSE</span>
              </span>
            </div>

            <div
              ref={terminalRef}
              className="h-60 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin text-[11px] leading-relaxed"
            >
              {liveLogs.length === 0 ? (
                <p className="text-slate-500 py-6 text-center">
                  Terminal idle. Click "Start Scraping Run" to begin streaming live logs.
                </p>
              ) : (
                liveLogs.map((log, i) => (
                  <div key={i} className="text-slate-300">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Historical Scrape Logs Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
          Scraping History & Deduplication Logs
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Audit trail tracking scrape executions, errors, and duplicate post hashes skipped.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="pb-3 font-semibold">Competitor</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Posts Found</th>
                <th className="pb-3 font-semibold">New Added</th>
                <th className="pb-3 font-semibold">Duplicates Skipped</th>
                <th className="pb-3 font-semibold">Timestamp</th>
                <th className="pb-3 font-semibold">Details / Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {historyLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-3 font-semibold text-slate-900 dark:text-white">
                    {log.competitor_name || "All Competitors"}
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        log.status === "success"
                          ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
                          : log.status === "failure"
                          ? "bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400"
                          : "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">{log.posts_found}</td>
                  <td className="py-3 font-bold text-emerald-600 dark:text-emerald-400">
                    +{log.posts_added}
                  </td>
                  <td className="py-3 font-semibold text-slate-500">
                    {log.duplicates_skipped}
                  </td>
                  <td className="py-3 text-slate-400">
                    {new Date(log.started_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-3 text-slate-500 max-w-xs truncate">
                    {log.error_message || (log.log_details && log.log_details[log.log_details.length - 1]) || "Scrape completed successfully"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function ScraperPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      }
    >
      <ScraperContent />
    </Suspense>
  );
}
