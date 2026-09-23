# AGY Command Center Dashboard Templates

This directory contains React/TypeScript template components for the AGY Command Center dashboard, designed to work with the Next.js, Podman, and LiteLLM architecture described in the design document.

## Templates Included

### 1. DashboardLayout (`dashboard-layout.tsx`)
The main layout implementing the three-pane structure:
- Left Sidebar: Tools & Capabilities
- Central Canvas: Visual Routing Map (React Flow)
- Right Sidebar: Security Metrics & Network Isolation
- Bottom Panel: Telemetry Graphs + Floating Chat Interface

### 2. TimeTravelDebugger (`time-travel-debugger.tsx`)
Implements the LLM "Time-Travel" Debugging feature:
- Timeline slider for scrubbing backward through token streams
- Historical state fetching via `/api/topology/history?time=X`
- Visualization of token streams and tool call states
- Play/pause controls for automated scrubbing

### 3. ChatDrivenTelemetry (`chat-driven-telemetry.tsx`)
Implements the Chat-Driven Telemetry feature:
- Natural language input for generating telemetry charts
- Backend generates SQL query and chart configuration
- Dynamic chart rendering within the chat feed
- Uses WebSocket-like streaming API for real-time responses

### 4. SemanticCacheManager (`semantic-cache-manager.tsx`)
Implements the Semantic Caching Management UI:
- 2D scatter plot of cache clusters using UMAP dimensionality reduction
- Click-to-select clusters for invalidation
- Visual feedback on cluster size, similarity, and age
- One-click cache invalidation via API

## Usage

Import templates directly into your Next.js pages or components:

```typescript
import { DashboardLayout, TimeTravelDebugger, ChatDrivenTelemetry, SemanticCacheManager } from '@/templates';

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="grid grid-cols-12 gap-4 p-4">
        {/* Time Travel Debugger - takes 4 columns */}
        <div className="col-span-4">
          <TimeTravelDebugger />
        </div>
        
        {/* Semantic Cache Manager - takes 4 columns */}
        <div className="col-span-4">
          <SemanticCacheManager onCacheUpdated={() => console.log('Cache updated')} />
        </div>
        
        {/* Chat-Driven Telemetry - takes 4 columns */}
        <div className="col-span-4">
          <ChatDrivenTelemetry />
        </div>
      </div>
    </DashboardLayout>
  );
}
```

## Integration Notes

1. **API Endpoints**: These templates assume the following backend endpoints exist:
   - `GET /api/topology/history?time=X` - Historical state for time-travel
   - `POST /api/telemetry/chat` - Chat-driven telemetry (returns SQL + chart config)
   - `GET /api/cache/clusters` - Cache cluster data with embeddings
   - `DELETE /api/cache/invalidate?cluster_id=Y` - Cache invalidation

2. **Styling**: Uses Tailwind CSS with the color scheme from the "Mission Control" dark theme:
   - Background: `#0B0F19` (Deep Obsidian)
   - Accents: `#00F5FF` (Electric Cyan) and `#FF00FF` (Neon Magenta)
   - Text: Various shades of cyan for readability on dark background

3. **Dependencies**: Requires:
   - `framer-motion` for layout animations
   - `umap-js` for dimensionality reduction in cache manager
   - Charting library (Recharts, Chart.js, or similar) for DynamicChart component

4. **Customization**: 
   - Adjust colors in the templates to match your chosen theme
   - Modify layout proportions in DashboardLayout as needed
   - Extend the templates with additional features specific to your use case

## Next Steps

1. Implement the corresponding backend API endpoints
2. Create the `DynamicChart` component referenced in ChatDrivenTelemetry
3. Implement the `use-chat-stream` hook for handling streaming responses
4. Connect to your actual Podman/LiteLLM monitoring systems for real data
5. Theme the components to match your selected UI option (Mission Control, Studio IDE, or Immersive Canvas)