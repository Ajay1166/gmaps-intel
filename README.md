# Google Maps Competitor Update Intelligence Tool 🗺️⚡

A full-stack intelligence platform that monitors, collects, analyzes, and out-competes Google Maps Updates/Posts published by rival local businesses. Built with **Next.js**, **FastAPI**, **Selenium**, **SQLAlchemy (PostgreSQL / SQLite)**, and **Multi-Provider AI (Gemini 1.5 & OpenAI GPT-4o)**.

---

## 🎯 System Objective & Highlights

- **Google Maps Updates Scraping Engine**: Automated Selenium WebDriver extraction of competitor posts, photos, dates, CTA buttons, and links with anti-bot bypass, SHA-256 duplicate detection, and manual CAPTCHA pause/resume workflow.
- **Deduplication Engine**: Automatically skips duplicate posts using cryptographic content hashes (`SHA-256(business_name + content + post_date)`).
- **Multi-Provider AI Analysis**: Analyzes competitor updates to extract topics, sub-topics, promotions/discounts, keywords, content types, and sentiment using Google Gemini & OpenAI with built-in heuristic NLP offline fallback.
- **Trend Analysis Dashboard**: Visualizes topic volumes, frequency matrix (%), content type breakdown, and competitor posting activity with Recharts.
- **Strategic Content Gap Detector (Bonus)**: Pinpoints high-converting post topics competitors frequently publish that your profile is missing and gives prioritized recommendations.
- **Competitor Auto-Discovery (Bonus)**: Automatically finds nearby competitors based on your industry and location coordinates/keywords.
- **AI Idea & Post Generators**: Generates high-converting, non-generic Google Maps Business updates with emojis, SEO keywords, call-to-action buttons, and suggested image prompts.
- **Zero-Scrape Instant Demo Data**: Comes pre-seeded with realistic local businesses, competitor posts, and analytics.

---

## 🧱 Architecture Overview

```mermaid
flowchart TD
    subgraph Frontend ["Frontend (Next.js 14/15 + Tailwind CSS + Recharts)"]
        UI_Dash[Dashboard & KPI Metrics]
        UI_Proj[Project Management]
        UI_Comp[Competitor Profiles & Auto-Discovery]
        UI_Repo[Posts Repository & Filter Toolbar]
        UI_Trend[Trend Analysis & Gap Detector]
        UI_Gen[AI Idea & Post Generator]
        UI_Scrape[Scraper Workflow & Live SSE Terminal]
    end

    subgraph Backend ["Backend API (FastAPI + Python 3.12)"]
        API_Router[REST API Endpoints & SSE Stream]
        Scraper_Mgr[Scraper Manager & Job Queue]
        Selenium_Engine[Selenium Google Maps Scraper]
        Captcha_Handler[CAPTCHA Detector & Resume Event]
        AI_Module[AI Engine: Gemini / OpenAI / Heuristic]
        Gap_Engine[Content Gap Analysis]
    end

    subgraph Database ["Data Store (SQLAlchemy)"]
        DB_Proj[(Projects Table)]
        DB_Comp[(Competitors Table)]
        DB_Posts[(Posts Table - Unique Hashes)]
        DB_Logs[(ScrapeLogs Table)]
        DB_Gen[(GeneratedContent Table)]
    end

    UI_Scrape <-->|SSE Stream| API_Router
    UI_Dash & UI_Proj & UI_Comp & UI_Repo & UI_Trend & UI_Gen <-->|REST API JSON| API_Router
    API_Router --> Scraper_Mgr
    Scraper_Mgr --> Selenium_Engine
    Selenium_Engine -.-> Captcha_Handler
    API_Router --> AI_Module
    API_Router --> Gap_Engine
    Scraper_Mgr & AI_Module & Gap_Engine <--> Database
```

---

## 📂 Folder Structure

```text
gmaps-competitor-intelligence/
├── backend/
│   ├── app/
│   │   ├── ai/
│   │   │   ├── analyzer.py            # Gemini & OpenAI multi-provider post analyzer
│   │   │   ├── content_generator.py   # Idea & Google Maps post generator with anti-duplication
│   │   │   └── gap_detector.py        # Content gap and benchmark recommendation engine
│   │   ├── scraper/
│   │   │   ├── selenium_scraper.py    # Headless/headful Chrome Google Maps scraper
│   │   │   ├── scraper_manager.py     # Background runner, deduplication & SSE broadcaster
│   │   │   └── mock_scraper.py        # Realistic offline fallback simulation engine
│   │   ├── routers/
│   │   │   ├── projects.py            # Projects & business profile CRUD
│   │   │   ├── competitors.py         # Competitors CRUD & Auto-discovery
│   │   │   ├── posts.py               # Posts repository, multi-filters & keyword search
│   │   │   ├── scraper_routes.py      # Trigger scrape, CAPTCHA resume, SSE stream
│   │   │   ├── analytics.py           # Topic frequency, competitor benchmarks, KPIs
│   │   │   ├── ai_routes.py           # AI generation, analysis & gap report endpoints
│   │   │   └── seed.py                # Pre-populated demo data seeder
│   │   ├── config.py                  # Pydantic environment configuration
│   │   ├── database.py                # SQLAlchemy engine & session management
│   │   ├── models.py                  # SQLAlchemy ORM schemas
│   │   ├── schemas.py                 # Pydantic request & response schemas
│   │   └── main.py                    # FastAPI app setup, CORS & lifespan auto-seeder
│   ├── requirements.txt               # Backend dependencies
│   ├── Dockerfile                     # Container with Chromium & ChromeDriver
│   ├── .env.example                   # Backend environment template
│   └── run.py                         # Local runner script
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout with ProjectProvider & Navigation
│   │   ├── page.tsx                   # Dashboard with KPI cards, topic bars & recent posts
│   │   ├── projects/page.tsx          # Project & Business Profile management
│   │   ├── competitors/page.tsx       # Competitor profiles & Auto-discovery modal
│   │   ├── posts/page.tsx             # Posts repository with search, filters & image modal
│   │   ├── analytics/page.tsx         # Trend dashboard, Recharts visualizations & Gap analysis
│   │   ├── generator/page.tsx         # Idea Generator (5, 10, 50) & Google Maps Post Generator
│   │   └── scraper/page.tsx           # Scraper workflow, SSE live terminal & CAPTCHA banner
│   ├── components/
│   │   ├── Navbar.tsx                 # Header with project selector & demo reload
│   │   └── Sidebar.tsx                # Sidebar navigation
│   ├── lib/
│   │   ├── api.ts                     # TypeScript API client & interfaces
│   │   └── ProjectContext.tsx         # Active project global state provider
│   ├── package.json
│   ├── Dockerfile
│   └── tsconfig.json
│
├── docker-compose.yml                 # PostgreSQL + FastAPI + Next.js orchestration
└── README.md                          # Full documentation & deployment guide
```

---

## 🗄️ Database Schema

### 1. `projects`
| Column | Type | Description |
|---|---|---|
| `id` | Integer (PK) | Unique project ID |
| `name` | String(255) | Project name (e.g. "Manhattan Dental Intel") |
| `description` | Text | Project description & campaign objectives |
| `business_name` | String(255) | Our business name |
| `business_profile_url`| Text | Our Google Maps profile link |
| `business_keywords` | JSON | Target SEO keywords array |
| `industry` | String(100) | Business category (e.g. Dental Practice) |
| `location` | String(255) | City/neighborhood (e.g. New York, NY) |
| `created_at` / `updated_at` | DateTime | Timestamp tracking |

### 2. `competitors`
| Column | Type | Description |
|---|---|---|
| `id` | Integer (PK) | Unique competitor ID |
| `project_id` | Integer (FK) | Reference to `projects.id` |
| `name` | String(255) | Competitor business name |
| `maps_url` | Text | Competitor Google Maps URL |
| `address` | String(500) | Physical location |
| `rating` | Float | Google Maps rating (e.g. 4.9) |
| `reviews_count` | Integer | Total customer reviews |
| `status` | String(50) | `idle`, `scraping`, `success`, `captcha`, `failed` |
| `last_scraped_at` | DateTime | Last scrape timestamp |

### 3. `posts`
| Column | Type | Description |
|---|---|---|
| `id` | Integer (PK) | Unique post ID |
| `project_id` | Integer (FK) | Reference to `projects.id` |
| `competitor_id` | Integer (FK) | Reference to `competitors.id` |
| `business_name` | String(255) | Competitor name |
| `profile_url` | Text | Google Maps profile link |
| `post_url` | Text | Unique post URL link |
| `content_hash` | String(64) | **SHA-256 hash** for duplicate detection |
| `content` | Text | Full post text |
| `post_date` | DateTime | Extracted or estimated date |
| `post_date_raw` | String(100) | Display date (e.g. "3 days ago") |
| `images` | JSON | Array of extracted image URLs |
| `call_to_action` | String(100) | CTA label ("Book Online", "Call Now") |
| `cta_url` | Text | Call-to-action button destination |
| `topic` | String(100) | Extracted topic theme |
| `sub_topic` | String(100) | Granular sub-category |
| `keywords` | JSON | Extracted keywords array |
| `content_type` | String(50) | `Promotion`, `Announcement`, `Educational`, `Case Study` |
| `promotions` | Text | Detected coupon or discount text |
| `sentiment` | String(50) | Positive, Neutral, Urgent, Excited |
| `ai_analyzed` | Boolean | True if enriched by AI |

### 4. `scrape_logs`
| Column | Type | Description |
|---|---|---|
| `id` | Integer (PK) | Log ID |
| `project_id` | Integer (FK) | Project reference |
| `competitor_id` | Integer (FK) | Competitor reference |
| `status` | String(50) | `success`, `failure`, `captcha_detected` |
| `posts_found` | Integer | Raw posts identified |
| `posts_added` | Integer | New posts added |
| `duplicates_skipped` | Integer | Duplicate post hashes skipped |
| `started_at` / `completed_at` | DateTime | Timing benchmarks |
| `log_details` | JSON | Real-time event log array |

### 5. `generated_content`
| Column | Type | Description |
|---|---|---|
| `id` | Integer (PK) | Generated content record ID |
| `project_id` | Integer (FK) | Project reference |
| `type` | String(50) | `idea`, `post` |
| `topic` | String(255) | Strategic topic |
| `title` | String(255) | Catchy headline |
| `content` | Text | Generated idea or complete post copy |
| `keywords` | JSON | SEO hashtags & keywords |
| `call_to_action` | String(100) | Recommended CTA button |
| `image_idea` | Text | Suggested photo / visual prompt |
| `ai_provider` | String(50) | Gemini, OpenAI, or heuristic engine |

---

## 🚀 API Routes Reference

### Projects
- `GET /api/projects`: List all projects with competitor and post counts.
- `POST /api/projects`: Create a new project with business profile details.
- `GET /api/projects/{id}`: Get project details.
- `PUT /api/projects/{id}`: Update project information.
- `DELETE /api/projects/{id}`: Delete project and cascade-remove all child records.

### Competitors
- `GET /api/competitors?project_id={id}`: List competitors for a project.
- `POST /api/competitors`: Add a competitor manually.
- `DELETE /api/competitors/{id}`: Remove competitor.
- `GET /api/competitors/auto-discover/{project_id}`: Auto-discover nearby competitors by keywords & location.

### Posts Repository
- `GET /api/posts`: Filter and search posts by project, competitor, topic, keyword, content type, or search term.
- `GET /api/posts/topics/{project_id}`: Get distinct topics for filter dropdown.
- `GET /api/posts/keywords/{project_id}`: Get distinct keywords.
- `GET /api/posts/{id}`: Get post details.
- `DELETE /api/posts/{id}`: Remove post.

### Scraping Engine & Workflow
- `POST /api/scraper/trigger`: Trigger background scrape job (Supports live Selenium or fast simulation mode).
- `GET /api/scraper/status/{project_id}`: Current active scrape status.
- `POST /api/scraper/resume-captcha/{competitor_id}`: Resume paused workflow after user solves CAPTCHA.
- `GET /api/scraper/logs`: Audit trail of scrape runs.
- `GET /api/scraper/events`: **Server-Sent Events (SSE)** stream delivering live terminal events to the frontend.

### AI Intelligence & Content Generation
- `POST /api/ai/analyze-post/{post_id}`: Re-analyze a post using Gemini or OpenAI.
- `POST /api/ai/generate-ideas`: Generate 5, 10, or 50 content ideas using competitor patterns (anti-duplication enforced).
- `POST /api/ai/generate-post`: Generate a complete, ready-to-publish Google Maps post with emojis, SEO keywords, CTA, and image idea.
- `GET /api/ai/gap-analysis/{project_id}`: Run content gap analysis comparing competitor topics vs your profile.

### Demo Data Seeder
- `POST /api/seed`: Pre-populate sample competitor data if empty.
- `POST /api/seed/reset-and-seed`: Reset and re-populate fresh demo data.

---

## 💻 Local Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- Google Chrome (installed on host machine for Selenium)

### 1. Clone & Navigate
```bash
git clone <repo-url>
cd gmaps-competitor-intelligence
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Setup environment variables
cp .env.example .env
# Add GEMINI_API_KEY or OPENAI_API_KEY if desired.
# Note: The tool works 100% out-of-the-box with heuristic AI even without keys!

# Start Backend Server
python run.py
# Backend runs at http://localhost:8000 (Swagger docs at http://localhost:8000/docs)
```

### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
# Frontend runs at http://localhost:3000
```

---

## 🐳 Docker Compose (1-Command Launch)

To run the entire stack including PostgreSQL database, FastAPI backend, and Next.js frontend:

```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API & Docs: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5432`

---

## ☁️ Cloud Deployment Steps

### 1. Database (Supabase / Neon / PostgreSQL)
1. Create a free project on [Supabase](https://supabase.com).
2. Copy the Connection URI (e.g., `postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres`).

### 2. Backend (Render / Railway)
1. In Render or Railway, create a new **Web Service** pointing to the `backend/` directory.
2. Select **Docker** environment (the included `backend/Dockerfile` automatically installs Chromium & ChromeDriver).
3. Set Environment Variables:
   - `DATABASE_URL`: Your Supabase connection string.
   - `SELENIUM_HEADLESS`: `True`
   - `GEMINI_API_KEY`: Your Google Gemini API Key (optional).
   - `OPENAI_API_KEY`: Your OpenAI API Key (optional).
   - `CORS_ORIGINS`: `*` (or your frontend Vercel URL).
4. Deploy the service. Note down your backend URL (e.g. `https://gmaps-backend.onrender.com`).

### 3. Frontend (Vercel)
1. Import the repository in [Vercel](https://vercel.com).
2. Set Root Directory to `frontend`.
3. Add Environment Variable:
   - `NEXT_PUBLIC_API_URL`: Your Render/Railway backend URL (e.g. `https://gmaps-backend.onrender.com`).
4. Click **Deploy**.
5. No login required — access the dashboard directly!
