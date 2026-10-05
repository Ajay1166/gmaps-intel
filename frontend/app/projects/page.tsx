"use client";

import React, { useState } from "react";
import { useProject } from "../../lib/ProjectContext";
import { api, Project } from "../../lib/api";
import {
  FolderPlus,
  Edit2,
  Trash2,
  ExternalLink,
  Store,
  Layers,
  Users2,
  Inbox,
  Check,
  X
} from "lucide-react";

export default function ProjectsPage() {
  const { projects, currentProject, setCurrentProject, refreshProjects } = useProject();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    business_name: "",
    business_profile_url: "",
    business_keywords: "",
    industry: "Dental Practice",
    location: "",
  });

  const openCreateModal = () => {
    setEditingProject(null);
    setFormData({
      name: "",
      description: "",
      business_name: "",
      business_profile_url: "",
      business_keywords: "",
      industry: "Dental Practice",
      location: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (proj: Project) => {
    setEditingProject(proj);
    setFormData({
      name: proj.name,
      description: proj.description || "",
      business_name: proj.business_name,
      business_profile_url: proj.business_profile_url || "",
      business_keywords: (proj.business_keywords || []).join(", "),
      industry: proj.industry || "General",
      location: proj.location || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const keywordsArray = formData.business_keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);

      const payload = {
        name: formData.name,
        description: formData.description,
        business_name: formData.business_name,
        business_profile_url: formData.business_profile_url,
        business_keywords: keywordsArray,
        industry: formData.industry,
        location: formData.location,
      };

      if (editingProject) {
        await api.updateProject(editingProject.id, payload);
      } else {
        const newProj = await api.createProject(payload);
        setCurrentProject(newProj);
      }

      await refreshProjects();
      setIsModalOpen(false);
    } catch (err) {
      console.error("Save project failed:", err);
      alert("Failed to save project. Please check backend connection.");
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete project "${name}" and all its competitor data?`)) {
      try {
        await api.deleteProject(id);
        await refreshProjects();
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Project Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Organize monitoring projects by target market, client, or business entity.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm shadow-indigo-500/20 transition-all cursor-pointer"
        >
          <FolderPlus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((proj) => {
          const isSelected = currentProject?.id === proj.id;
          return (
            <div
              key={proj.id}
              className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                isSelected
                  ? "bg-white dark:bg-slate-900 border-indigo-500 shadow-md ring-1 ring-indigo-500"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">{proj.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{proj.industry} • {proj.location || "Local"}</p>
                  </div>
                  {isSelected && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                      Active
                    </span>
                  )}
                </div>

                {proj.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 line-clamp-2">
                    {proj.description}
                  </p>
                )}

                {/* Business Profile (Our Business) */}
                <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                  <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                    <Store className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Our Business Profile</span>
                  </div>
                  <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 mt-1">
                    {proj.business_name}
                  </div>
                  {proj.business_profile_url && (
                    <a
                      href={proj.business_profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-indigo-500 hover:underline flex items-center gap-1 mt-1 truncate"
                    >
                      <span className="truncate">{proj.business_profile_url}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  )}

                  {/* Keywords */}
                  {proj.business_keywords && proj.business_keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {proj.business_keywords.slice(0, 4).map((kw, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 text-[10px] rounded bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600"
                        >
                          {kw}
                        </span>
                      ))}
                      {proj.business_keywords.length > 4 && (
                        <span className="text-[10px] text-slate-400 self-center">
                          +{proj.business_keywords.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Counts */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Competitors</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{proj.competitor_count}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Posts</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{proj.post_count}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setCurrentProject(proj)}
                  disabled={isSelected}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    isSelected
                      ? "text-slate-400 cursor-default"
                      : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100"
                  }`}
                >
                  {isSelected ? "Current Active" : "Select Project"}
                </button>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => openEditModal(proj)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    title="Edit project"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(proj.id, proj.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                    title="Delete project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create / Edit Project */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingProject ? "Edit Project" : "Create New Project"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Manhattan Dental Clinic Intel"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-sm px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Goals, target geography, or campaign context..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full text-sm px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-3">
                  Our Business Profile
                </span>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Business Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Family & Cosmetic Dental"
                      value={formData.business_name}
                      onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                      className="w-full text-sm px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Industry / Category
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Dental Practice"
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        className="w-full text-sm px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Location / City
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. New York, NY"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full text-sm px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Our Google Maps Profile URL (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://maps.google.com/?cid=..."
                      value={formData.business_profile_url}
                      onChange={(e) => setFormData({ ...formData, business_profile_url: e.target.value })}
                      className="w-full text-sm px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Target Keywords (comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="invisalign, teeth whitening, emergency dentist"
                      value={formData.business_keywords}
                      onChange={(e) => setFormData({ ...formData, business_keywords: e.target.value })}
                      className="w-full text-sm px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs"
                >
                  {editingProject ? "Update Project" : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
