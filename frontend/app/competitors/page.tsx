"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useProject } from "../../lib/ProjectContext";
import { api, Competitor } from "../../lib/api";
import {
  Users2,
  Plus,
  Compass,
  Star,
  ExternalLink,
  Trash2,
  Bot,
  Search,
  Check,
  AlertCircle,
  Clock,
  CheckCircle2,
  X
} from "lucide-react";

export default function CompetitorsPage() {
  const { currentProject } = useProject();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Competitor Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [address, setAddress] = useState("");
  const [rating, setRating] = useState<string>("4.8");
  const [reviewsCount, setReviewsCount] = useState<string>("250");

  // Auto-Discover State
  const [isDiscoverModalOpen, setIsDiscoverModalOpen] = useState(false);
  const [discoverQuery, setDiscoverQuery] = useState("");
  const [discoveredList, setDiscoveredList] = useState<any[]>([]);
  const [discovering, setDiscovering] = useState(false);
  const [addedNames, setAddedNames] = useState<Set<string>>(new Set());

  const loadCompetitors = async () => {
    if (!currentProject) return;
    try {
      setLoading(true);
      const data = await api.getCompetitors(currentProject.id);
      setCompetitors(data);
    } catch (err) {
      console.error("Failed to load competitors:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompetitors();
  }, [currentProject]);

  const handleAddCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;

    try {
      await api.createCompetitor({
        project_id: currentProject.id,
        name,
        maps_url: mapsUrl,
        address,
        rating: rating ? parseFloat(rating) : undefined,
        reviews_count: reviewsCount ? parseInt(reviewsCount) : undefined,
      });

      setName("");
      setMapsUrl("");
      setAddress("");
      setIsAddModalOpen(false);
      await loadCompetitors();
    } catch (err) {
      console.error("Failed to add competitor:", err);
      alert("Failed to add competitor. Check inputs or backend status.");
    }
  };

  const handleDelete = async (id: number, compName: string) => {
    if (confirm(`Remove "${compName}" from monitored competitors?`)) {
      try {
        await api.deleteCompetitor(id);
        await loadCompetitors();
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }
  };

  const handleAutoDiscover = async () => {
    if (!currentProject) return;
    try {
      setDiscovering(true);
      const res = await api.autoDiscoverCompetitors(currentProject.id, discoverQuery);
      setDiscoveredList(res.discovered_competitors || []);
    } catch (err) {
      console.error("Auto discover error:", err);
    } finally {
      setDiscovering(false);
    }
  };

  const addDiscoveredCompetitor = async (item: any) => {
    if (!currentProject) return;
    try {
      await api.createCompetitor({
        project_id: currentProject.id,
        name: item.name,
        maps_url: item.maps_url,
        address: item.address,
        rating: item.rating,
        reviews_count: item.reviews_count,
      });
      setAddedNames((prev) => new Set(prev).add(item.name));
      await loadCompetitors();
    } catch (err) {
      console.error("Failed to add discovered competitor:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Monitored Competitor Profiles
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tracking Google Maps Business profiles for project:{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {currentProject?.name || "None Selected"}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Auto-Discover Bonus Button */}
          <button
            onClick={() => {
              setIsDiscoverModalOpen(true);
              if (discoveredList.length === 0) {
                handleAutoDiscover();
              }
            }}
            className="inline-flex items-center space-x-2 px-3.5 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium text-sm hover:bg-indigo-100 transition-colors cursor-pointer"
          >
            <Compass className="w-4 h-4 text-indigo-500" />
            <span>Auto-Discover</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Competitor</span>
          </button>
        </div>
      </div>

      {/* Competitors List / Grid */}
      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : competitors.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8">
          <Users2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            No competitors added yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            Add competitor Google Maps URLs manually or use the Auto-Discover tool to find rivals in your area.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setIsDiscoverModalOpen(true)}
              className="text-xs font-semibold px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
            >
              Auto-Discover Competitors
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="text-xs font-semibold px-4 py-2 rounded-xl bg-indigo-600 text-white"
            >
              Add Manually
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {competitors.map((comp) => (
            <div
              key={comp.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                    {comp.name}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      comp.status === "success"
                        ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
                        : comp.status === "scraping"
                        ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 animate-pulse"
                        : comp.status === "captcha"
                        ? "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {comp.status}
                  </span>
                </div>

                {comp.address && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                    {comp.address}
                  </p>
                )}

                {/* Rating & Reviews */}
                <div className="flex items-center space-x-3 mt-3">
                  <div className="flex items-center space-x-1 text-xs font-semibold text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{comp.rating ? comp.rating.toFixed(1) : "N/A"}</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    ({comp.reviews_count || 0} reviews)
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                    {comp.post_count} posts scraped
                  </span>
                </div>

                {/* Maps link */}
                <div className="mt-3">
                  <a
                    href={comp.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate max-w-[220px]">View Google Maps Profile</span>
                  </a>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {comp.last_scraped_at
                    ? new Date(comp.last_scraped_at).toLocaleDateString()
                    : "Not scraped yet"}
                </span>

                <div className="flex items-center space-x-2">
                  <Link
                    href={`/scraper?competitor_id=${comp.id}`}
                    className="text-xs font-medium px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors flex items-center gap-1"
                  >
                    <Bot className="w-3 h-3" />
                    <span>Scrape</span>
                  </Link>

                  <button
                    onClick={() => handleDelete(comp.id, comp.name)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                    title="Remove competitor"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add Competitor Manually */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Add Competitor Profile
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCompetitor} className="space-y-3.5 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tribeca Premier Dentistry"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Google Maps URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://maps.google.com/?cid=..."
                  value={mapsUrl}
                  onChange={(e) => setMapsUrl(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Address (Optional)
                </label>
                <input
                  type="text"
                  placeholder="120 Hudson St, New York, NY"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Rating (1-5)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Reviews Count
                  </label>
                  <input
                    type="number"
                    value={reviewsCount}
                    onChange={(e) => setReviewsCount(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
                >
                  Add Competitor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Auto-Discover Competitors Bonus */}
      {isDiscoverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Compass className="w-5 h-5 text-indigo-500" />
                  <span>Auto-Discover Competitors</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Find competitor profiles around your location and industry
                </p>
              </div>
              <button
                onClick={() => setIsDiscoverModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder={`Search query (default: ${currentProject?.industry} ${currentProject?.location || ""})`}
                value={discoverQuery}
                onChange={(e) => setDiscoverQuery(e.target.value)}
                className="flex-1 text-sm px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleAutoDiscover}
                disabled={discovering}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{discovering ? "Searching..." : "Search"}</span>
              </button>
            </div>

            <div className="mt-4 space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {discovering ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Scanning Google Maps directory...
                </div>
              ) : discoveredList.length > 0 ? (
                discoveredList.map((item, idx) => {
                  const alreadyAdded =
                    addedNames.has(item.name) ||
                    competitors.some((c) => c.name.toLowerCase() === item.name.toLowerCase());
                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-semibold text-xs text-slate-900 dark:text-white">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{item.address}</div>
                        <div className="flex items-center gap-2 mt-1 text-[11px]">
                          <span className="text-amber-500 font-semibold flex items-center gap-0.5">
                            ★ {item.rating}
                          </span>
                          <span className="text-slate-400">({item.reviews_count} reviews)</span>
                        </div>
                      </div>

                      <button
                        onClick={() => addDiscoveredCompetitor(item)}
                        disabled={alreadyAdded}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          alreadyAdded
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                        }`}
                      >
                        {alreadyAdded ? "Added" : "+ Add"}
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-xs text-slate-400">
                  No competitors discovered for this query.
                </div>
              )}
            </div>

            <div className="pt-4 mt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setIsDiscoverModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
