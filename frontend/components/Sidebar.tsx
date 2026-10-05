"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProject } from "../lib/ProjectContext";
import { 
  LayoutDashboard, 
  FolderKanban, 
  Users2, 
  Inbox, 
  BarChart3, 
  Sparkles, 
  Bot, 
  Store,
  ExternalLink
} from "lucide-react";

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { currentProject } = useProject();

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Projects", href: "/projects", icon: FolderKanban },
    { label: "Competitors", href: "/competitors", icon: Users2 },
    { label: "Posts Repository", href: "/posts", icon: Inbox },
    { label: "Analytics & Trends", href: "/analytics", icon: BarChart3 },
    { label: "Content Generator", href: "/generator", icon: Sparkles },
    { label: "Scraper Engine", href: "/scraper", icon: Bot },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4">
      {/* Navigation Links */}
      <div className="space-y-1">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Active Business Profile Card */}
      {currentProject && (
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-50 to-indigo-50/40 dark:from-slate-800/80 dark:to-indigo-950/20 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Store className="w-3.5 h-3.5" />
            <span>Our Business</span>
          </div>
          <div className="font-bold text-sm text-slate-800 dark:text-slate-100 mt-1 truncate">
            {currentProject.business_name}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {currentProject.industry} • {currentProject.location || "Local"}
          </div>
          {currentProject.business_profile_url && (
            <a
              href={currentProject.business_profile_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center space-x-1 text-[11px] text-indigo-500 hover:underline"
            >
              <span>Maps Profile</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </aside>
  );
};
