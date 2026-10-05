const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Project {
  id: number;
  name: string;
  description?: string;
  business_name: string;
  business_profile_url?: string;
  business_keywords: string[];
  industry: string;
  location?: string;
  created_at: string;
  updated_at: string;
  competitor_count: number;
  post_count: number;
}

export interface Competitor {
  id: number;
  project_id: number;
  name: string;
  maps_url: string;
  place_id?: string;
  address?: string;
  rating?: number;
  reviews_count?: number;
  status: string;
  last_scraped_at?: string;
  created_at: string;
  post_count: number;
}

export interface Post {
  id: number;
  project_id: number;
  competitor_id: number;
  business_name: string;
  profile_url?: string;
  post_url?: string;
  content_hash: string;
  content: string;
  post_date?: string;
  post_date_raw?: string;
  images: string[];
  call_to_action?: string;
  cta_url?: string;
  topic?: string;
  sub_topic?: string;
  keywords: string[];
  content_type?: string;
  promotions?: string;
  sentiment?: string;
  ai_analyzed: boolean;
  ai_analysis_raw?: any;
  created_at: string;
}

export interface ScrapeLog {
  id: number;
  project_id?: number;
  competitor_id?: number;
  competitor_name?: string;
  status: string;
  posts_found: number;
  posts_added: number;
  duplicates_skipped: number;
  error_message?: string;
  started_at: string;
  completed_at?: string;
  log_details: string[];
}

export interface DashboardMetrics {
  total_projects: number;
  total_competitors: number;
  total_posts: number;
  new_posts_last_7_days: number;
  duplicates_skipped: number;
  failed_scrapes: number;
  generated_content_count: number;
  top_keywords: { keyword: string; count: number }[];
  top_topics: { topic: string; count: number; percentage: number }[];
  content_types: { type: string; count: number }[];
  recent_posts: Post[];
  recent_logs: ScrapeLog[];
}

export interface GeneratedIdea {
  topic: string;
  title: string;
  description: string;
  angle: string;
  competitor_insight: string;
  suggested_call_to_action: string;
}

export interface GeneratedPost {
  topic: string;
  content: string;
  keywords: string[];
  call_to_action: string;
  cta_url_suggestion: string;
  image_idea: string;
  character_count: number;
}

export interface GapAnalysisItem {
  topic: string;
  competitor_coverage_pct: number;
  importance_score: string;
  competitor_examples: string[];
  suggested_angle_for_our_business: string;
}

export interface GapAnalysisResponse {
  project_id: number;
  business_name: string;
  competitor_count: number;
  total_competitor_posts: number;
  missing_topics: GapAnalysisItem[];
  improvement_recommendations: string[];
}

// API Methods
export const api = {
  // Projects
  async getProjects(): Promise<Project[]> {
    const res = await fetch(`${API_BASE}/api/projects`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch projects");
    return res.json();
  },

  async getProject(id: number): Promise<Project> {
    const res = await fetch(`${API_BASE}/api/projects/${id}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch project");
    return res.json();
  },

  async createProject(data: Partial<Project>): Promise<Project> {
    const res = await fetch(`${API_BASE}/api/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create project");
    return res.json();
  },

  async updateProject(id: number, data: Partial<Project>): Promise<Project> {
    const res = await fetch(`${API_BASE}/api/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update project");
    return res.json();
  },

  async deleteProject(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/api/projects/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete project");
  },

  // Competitors
  async getCompetitors(projectId?: number): Promise<Competitor[]> {
    const url = projectId ? `${API_BASE}/api/competitors?project_id=${projectId}` : `${API_BASE}/api/competitors`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch competitors");
    return res.json();
  },

  async createCompetitor(data: Partial<Competitor>): Promise<Competitor> {
    const res = await fetch(`${API_BASE}/api/competitors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create competitor");
    return res.json();
  },

  async deleteCompetitor(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/api/competitors/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete competitor");
  },

  async autoDiscoverCompetitors(projectId: number, query?: string) {
    const q = query ? `?query=${encodeURIComponent(query)}` : "";
    const res = await fetch(`${API_BASE}/api/competitors/auto-discover/${projectId}${q}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to auto-discover competitors");
    return res.json();
  },

  // Posts
  async getPosts(params: {
    project_id?: number;
    competitor_id?: number;
    search?: string;
    topic?: string;
    keyword?: string;
    content_type?: string;
    limit?: number;
  }): Promise<Post[]> {
    const searchParams = new URLSearchParams();
    if (params.project_id) searchParams.set("project_id", params.project_id.toString());
    if (params.competitor_id) searchParams.set("competitor_id", params.competitor_id.toString());
    if (params.search) searchParams.set("search", params.search);
    if (params.topic) searchParams.set("topic", params.topic);
    if (params.keyword) searchParams.set("keyword", params.keyword);
    if (params.content_type) searchParams.set("content_type", params.content_type);
    if (params.limit) searchParams.set("limit", params.limit.toString());

    const res = await fetch(`${API_BASE}/api/posts?${searchParams.toString()}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch posts");
    return res.json();
  },

  async getTopics(projectId: number): Promise<string[]> {
    const res = await fetch(`${API_BASE}/api/posts/topics/${projectId}`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.topics || [];
  },

  async getKeywords(projectId: number): Promise<string[]> {
    const res = await fetch(`${API_BASE}/api/posts/keywords/${projectId}`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.keywords || [];
  },

  async deletePost(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/api/posts/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete post");
  },

  // Analytics
  async getDashboardMetrics(projectId?: number): Promise<DashboardMetrics> {
    const url = projectId ? `${API_BASE}/api/analytics/dashboard?project_id=${projectId}` : `${API_BASE}/api/analytics/dashboard`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch dashboard metrics");
    return res.json();
  },

  async getCompetitorTrends(projectId: number) {
    const res = await fetch(`${API_BASE}/api/analytics/competitor-trends?project_id=${projectId}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch competitor trends");
    return res.json();
  },

  // Scraper
  async triggerScrape(payload: {
    project_id: number;
    competitor_ids?: number[];
    use_simulation?: boolean;
    max_posts_per_competitor?: number;
  }) {
    const res = await fetch(`${API_BASE}/api/scraper/trigger`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to trigger scraper");
    return res.json();
  },

  async resumeCaptcha(competitorId: number) {
    const res = await fetch(`${API_BASE}/api/scraper/resume-captcha/${competitorId}`, {
      method: "POST",
    });
    return res.json();
  },

  async getScrapeLogs(projectId?: number): Promise<ScrapeLog[]> {
    const url = projectId ? `${API_BASE}/api/scraper/logs?project_id=${projectId}` : `${API_BASE}/api/scraper/logs`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  },

  // AI Module
  async analyzePost(postId: number, provider: string = "gemini") {
    const res = await fetch(`${API_BASE}/api/ai/analyze-post/${postId}?provider=${provider}`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to analyze post");
    return res.json();
  },

  async generateIdeas(payload: {
    project_id: number;
    count: number;
    topic_focus?: string;
    ai_provider?: string;
  }): Promise<{ project_id: number; ideas: GeneratedIdea[]; ai_provider_used: string }> {
    const res = await fetch(`${API_BASE}/api/ai/generate-ideas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to generate ideas");
    return res.json();
  },

  async generatePost(payload: {
    project_id: number;
    topic: string;
    tone?: string;
    include_offer?: boolean;
    custom_instructions?: string;
    ai_provider?: string;
  }): Promise<{ project_id: number; post: GeneratedPost; ai_provider_used: string }> {
    const res = await fetch(`${API_BASE}/api/ai/generate-post`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to generate post");
    return res.json();
  },

  async getGapAnalysis(projectId: number): Promise<GapAnalysisResponse> {
    const res = await fetch(`${API_BASE}/api/ai/gap-analysis/${projectId}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch gap analysis");
    return res.json();
  },

  // Demo Seed
  async resetAndSeed() {
    const res = await fetch(`${API_BASE}/api/seed/reset-and-seed`, { method: "POST" });
    return res.json();
  },
};
