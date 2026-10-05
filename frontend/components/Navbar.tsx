"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useProject } from "../lib/ProjectContext";
import { api } from "../lib/api";
import { 
  MapPin, 
  Sparkles, 
  RotateCcw, 
  CheckCircle2, 
  Layers, 
  FolderPlus,
  Compass
} from "lucide-react";

export const Navbar: React.FC = () => {
  const { projects, currentProject, setCurrentProject, refreshProjects } = useProject();
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  const handleSeed = async () => {
    try {
      setSeeding(true);
      await api.resetAndSeed();
      await refreshProjects();
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 3000);
    } catch (e) {
      console.error("Seeding failed", e);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
      {/* Brand & Project Selector */}
      <div className="flex items-center space-x-6">
        <Link href="/" className="flex items-center space-x-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-300">
              MapIntel AI
            </span>
            <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded ml-2">
              Intelligence
            </span>
          </div>
        </Link>

        {/* Active Project Dropdown */}
        <div className="flex items-center space-x-2 border-l border-slate-200 dark:border-slate-800 pl-6">
          <Layers className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-400 hidden md:inline">Project:</span>
          {projects.length > 0 ? (
            <select
              value={currentProject?.id || ""}
              onChange={(e) => {
                const p = projects.find((proj) => proj.id === Number(e.target.value));
                if (p) setCurrentProject(p);
              }}
              className="text-sm font-semibold bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name} ({proj.business_name})
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-amber-500 font-medium">No projects created</span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-3">
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
          title="Reset & Pre-populate realistic competitor updates"
        >
          {seedSuccess ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400">Data Seeded!</span>
            </>
          ) : (
            <>
              <RotateCcw className={`w-3.5 h-3.5 ${seeding ? "animate-spin text-indigo-500" : "text-slate-400"}`} />
              <span>{seeding ? "Seeding..." : "Reload Demo Data"}</span>
            </>
          )}
        </button>

        <Link
          href="/generator"
          className="hidden sm:flex items-center space-x-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-95 shadow-sm shadow-indigo-500/20 transition-all hover:shadow"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Generate Post</span>
        </Link>
      </div>
    </header>
  );
};
