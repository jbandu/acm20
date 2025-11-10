# ACM20 Research Platform

A comprehensive research platform that enables researchers to search across global research knowledge and ACM private intelligence using AI-powered query processing, real-time progress tracking, and interactive knowledge graph visualization.

## Overview

The ACM20 Research Platform is a Next.js application that combines multiple data sources (OpenAlex, PubMed, Google Patents, and private Document Vault) with AI models (Claude, GPT-4, Gemini, Ollama) to provide intelligent research query processing. The platform features a researcher dashboard, query builder, real-time progress tracking, results visualization, and knowledge graph exploration.

## Features

### 🎯 Core Functionality

#### 1. Researcher Dashboard
- **User Overview**: Personalized dashboard showing researcher stats, recent activity, and quick links
- **Daily Digest**: Summary of new articles, patents, clinical trials, and concepts since last login
- **Activity Feed**: Infinite-scrolling feed of team activity with real-time updates via Server-Sent Events (SSE)
- **Trending Topics**: Display of trending research topics with momentum indicators
- **Suggested Questions**: AI-generated research question suggestions based on user activity
- **Upcoming Deadlines**: Calendar integration for grant proposals and project deadlines
- **Quick Links**: Fast navigation to recent queries, knowledge graph, and templates

#### 2. Query Builder
- **Query Composition**: Rich text editor with markdown preview for research questions
- **Multi-Source Selection**: 
  - Public sources: OpenAlex (2.5M papers), PubMed (35M articles), Google Patents (15M patents)
  - Private sources: Document Vault with project-based filtering
- **AI Model Selection**: Choose from multiple LLM providers:
  - Claude Sonnet 4 (Recommended)
  - GPT-4 Turbo
  - Gemini 1.5 Pro
  - Local Ollama (Free, self-hosted)
- **Query Refinement**: AI-powered query enhancement before execution
- **Advanced Options**:
  - Search depth: Quick (~10s), Standard (~20s), or Deep (~45s)
  - Max results: Slider from 10-100 results
  - Date range filtering
  - Open access only filter
  - Project-based filtering for Document Vault
- **Cost Estimation**: Real-time calculation of query costs based on sources, models, and depth
- **Duration Estimation**: Estimated completion time for queries
- **Form Persistence**: Auto-save query state to localStorage and Zustand store
- **Template Saving**: Save queries as reusable templates

#### 3. Progress Tracker
- **Real-Time Updates**: Server-Sent Events (SSE) for live progress updates
- **Step-by-Step Visualization**: Timeline view of query processing steps:
  - Query intent refinement
  - Data source searches (OpenAlex, Patents, PubMed)
  - LLM analysis
- **Status Indicators**: Visual status for each step (Pending, Running, Done, Failed)
- **Progress Metrics**: Elapsed time, ETA, and completion percentage
- **Query Cancellation**: Ability to cancel running queries
- **Error Handling**: Connection error detection and recovery

#### 4. Results Display
- **Response Cards**: Rich display of research results with:
  - Title and summary
  - Expandable full content (markdown rendering)
  - Source badges (OpenAlex, PubMed, Google Patents, Document Vault)
  - Metadata: publication date, citations, relevance score, open access status, tags
- **Feedback System**: User feedback on results:
  - 👍 Helpful
  - ⭐ Important
  - 👎 Not useful
  - ❌ Incorrect
- **Optimistic Updates**: Instant UI feedback with server sync

#### 5. Knowledge Graph Visualization
- **Interactive Graph**: ReactFlow-powered visualization of research relationships
- **Node Types**: 
  - Concepts (blue)
  - Papers (green)
  - Patents (amber)
  - People (indigo)
  - Institutions (fuchsia)
- **Layout Options**: 
  - Force-directed layout
  - Grid layout
  - Radial layout
- **Filtering**: 
  - Filter by node type
  - Search nodes by title or tags
- **Interactive Features**:
  - Drag-and-drop nodes
  - Zoom and pan controls
  - Mini-map for navigation
  - Node details on hover

### 🔧 Technical Features

- **State Management**: Zustand stores for query state and progress tracking
- **Data Fetching**: React Query (TanStack Query) for server state management
- **Real-Time Updates**: Server-Sent Events for live progress tracking
- **Form Validation**: Zod schema validation with React Hook Form
- **Animations**: Framer Motion for smooth UI transitions
- **Markdown Rendering**: React Markdown with GitHub Flavored Markdown support
- **Responsive Design**: Mobile-first responsive UI with Tailwind CSS
- **Type Safety**: Full TypeScript support throughout the application

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom component library (shadcn/ui style)
- **State Management**: 
  - Zustand (client state)
  - TanStack Query (server state)
- **Forms**: React Hook Form + Zod
- **Animations**: Framer Motion
- **Markdown**: React Markdown + remark-gfm
- **Graph Visualization**: ReactFlow

### Backend
- **API Routes**: Next.js API Routes (App Router)
- **Real-Time**: Server-Sent Events (SSE)

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint
- **Build Tool**: Next.js built-in

## Project Structure

```
/
├── app/
│   ├── api/                          # API routes
│   │   ├── dashboard/
│   │   │   └── [userId]/
│   │   │       ├── activity/         # Activity feed (infinite scroll)
│   │   │       ├── events/           # SSE events for real-time updates
│   │   │       └── overview/         # Dashboard overview data
│   │   ├── documents/
│   │   │   └── stats/                # Document vault statistics
│   │   ├── projects/
│   │   │   └── options/              # Project options for filtering
│   │   ├── query/
│   │   │   ├── [queryId]/
│   │   │   │   ├── cancel/          # Cancel running query
│   │   │   │   ├── graph/           # Knowledge graph data
│   │   │   │   └── progress/        # SSE progress updates
│   │   │   ├── execute/             # Execute new query
│   │   │   └── refine/              # AI query refinement
│   │   └── responses/
│   │       └── [responseId]/
│   │           └── feedback/         # Submit response feedback
│   ├── layout.tsx                    # Root layout with QueryClientProvider
│   ├── page.tsx                      # Main application page
│   └── globals.css                   # Global styles
│
├── components/
│   ├── dashboard/
│   │   └── ResearcherDashboard.tsx   # Main dashboard component
│   ├── knowledge-graph/
│   │   └── GraphVisualization.tsx    # Knowledge graph visualization
│   ├── query/
│   │   ├── QueryBuilder.tsx          # Query composition form
│   │   └── ProgressTracker.tsx       # Real-time progress tracking
│   ├── results/
│   │   └── ResponseCard.tsx          # Individual result card
│   └── ui/                           # Reusable UI components
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── checkbox.tsx
│       ├── collapsible.tsx
│       ├── label.tsx
│       ├── radio-group.tsx
│       ├── slider.tsx
│       ├── tabs.tsx
│       └── textarea.tsx
│
├── lib/
│   ├── stores/
│   │   ├── query-store.ts            # Query state management (Zustand)
│   │   └── query-progress-store.ts    # Progress state management (Zustand)
│   └── utils/
│       ├── cost-calculator.ts        # Query cost and duration estimation
│       └── index.ts                  # Utility functions (cn, formatCurrency)
│
├── next.config.js                    # Next.js configuration
├── package.json                      # Dependencies and scripts
├── tailwind.config.js                # Tailwind CSS configuration
└── tsconfig.json                     # TypeScript configuration
```

## Key Components

### ResearcherDashboard
- **Location**: `components/dashboard/ResearcherDashboard.tsx`
- **Features**:
  - Three-column responsive layout
  - Overview statistics (queries, papers reviewed, contributions)
  - Daily digest with totals and breakthroughs
  - Suggested questions with AI recommendations
  - Activity feed with infinite scroll
  - Trending topics with momentum
  - Upcoming deadlines
  - Real-time updates via SSE

### QueryBuilder
- **Location**: `components/query/QueryBuilder.tsx`
- **Features**:
  - Form validation with Zod schema
  - Markdown preview toggle
  - Multi-select data sources
  - Multi-select AI models
  - Advanced options (collapsible)
  - Cost and duration estimation
  - Query refinement via API
  - Template saving
  - Form persistence (localStorage + Zustand)

### ProgressTracker
- **Location**: `components/query/ProgressTracker.tsx`
- **Features**:
  - SSE connection for real-time updates
  - Timeline visualization of query steps
  - Status indicators (idle, active, completed, error)
  - Progress percentage and ETA
  - Query cancellation
  - Error handling and reconnection

### ResponseCard
- **Location**: `components/results/ResponseCard.tsx`
- **Features**:
  - Expandable content view
  - Markdown rendering
  - Source badges
  - Metadata display (date, citations, relevance, tags)
  - Feedback buttons with optimistic updates
  - Mutation handling with React Query

### GraphVisualization
- **Location**: `components/knowledge-graph/GraphVisualization.tsx`
- **Features**:
  - ReactFlow integration
  - Multiple layout algorithms
  - Node type filtering
  - Search functionality
  - Interactive controls (zoom, pan, minimap)
  - Custom node rendering by type

## API Routes

### Dashboard APIs
- `GET /api/dashboard/[userId]/overview` - Get dashboard overview data
- `GET /api/dashboard/[userId]/activity?cursor=` - Get paginated activity feed
- `GET /api/dashboard/[userId]/events` - SSE endpoint for real-time updates

### Query APIs
- `POST /api/query/execute` - Execute a new research query
- `POST /api/query/refine` - Refine query using AI
- `GET /api/query/[queryId]/progress` - SSE endpoint for query progress
- `POST /api/query/[queryId]/cancel` - Cancel a running query
- `GET /api/query/[queryId]/graph` - Get knowledge graph data

### Document & Project APIs
- `GET /api/documents/stats` - Get document vault statistics
- `GET /api/projects/options` - Get available project options

### Response APIs
- `POST /api/responses/[responseId]/feedback` - Submit feedback on a response

## State Management

### Query Store (`lib/stores/query-store.ts`)
- Persists query form state (query text, sources, LLMs, options)
- Uses Zustand with persistence middleware
- Storage key: `query-storage`

### Query Progress Store (`lib/stores/query-progress-store.ts`)
- Manages query execution progress
- Tracks step status (idle, active, completed, error)
- Stores estimated completion time
- Ephemeral (not persisted)

## Cost Calculation

The platform includes intelligent cost estimation based on:
- **Data Sources**: Base costs per source (OpenAlex: $0.15, PubMed: $0.10, etc.)
- **AI Models**: Base costs per model (Claude: $1.80, GPT-4: $3.20, etc.)
- **Search Depth**: Multipliers (Quick: 0.5x, Standard: 1x, Deep: 2.6x)
- **Result Count**: Scaling factor based on max results

Duration estimation considers:
- Base time per depth level
- Number of sources (2.5s per source)
- Number of LLMs (3s per LLM)

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd acm20-research-app
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Code Style

- TypeScript strict mode enabled
- ESLint with Next.js configuration
- Tailwind CSS for styling
- Component-based architecture

## Notes

- The application currently uses mock data for API responses
- Real-time features (SSE) are implemented but require backend integration
- Query execution, refinement, and knowledge graph generation are placeholders
- Document vault and project filtering require backend implementation
- Cost calculations are estimates and may vary based on actual API usage

## Future Enhancements

- Backend integration for actual query processing
- Database integration for persistent storage
- User authentication and authorization
- Advanced knowledge graph algorithms
- Export functionality for results
- Collaboration features
- Advanced analytics and reporting
