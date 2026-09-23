import React, { useState, useEffect } from 'react';
import * as umap from 'umap-js';
import { fetchCacheClusters, invalidateCacheCluster } from '@/lib/api/cache';

interface SemanticCacheManagerProps {
  onCacheUpdated?: () => void;
}

const SemanticCacheManager: React.FC<SemanticCacheManagerProps> = ({ onCacheUpdated }) => {
  const [clusters, setClusters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);

  useEffect(() => {
    loadCacheClusters();
  }, []);

  const loadCacheClusters = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCacheClusters();
      
      // Extract embeddings for dimensionality reduction
      const embeddings = data.clusters.map((c: any) => c.embedding);
      const labels = data.clusters.map((c: any) => c.id);
      
      // Perform UMAP dimensionality reduction to 2D
      const reducer = new umap.UMAP({
        nComponents: 2,
        metric: 'cosine',
        nNeighbors: 15,
        minDist: 0.1
      });
      
      const projection = reducer.fit(embeddings).transform(embeddings);
      
      // Combine cluster data with 2D coordinates
      const clustersWithCoords = data.clusters.map((cluster: any, index: number) => ({
        ...cluster,
        x: projection[index][0],
        y: projection[index][1]
      }));
      
      setClusters(clustersWithCoords);
    } catch (err) {
      setError('Failed to load cache clusters');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClusterClick = (clusterId: string) => {
    setSelectedClusterId(selectedClusterId === clusterId ? null : clusterId);
  };

  const handleInvalidate = async () => {
    if (!selectedClusterId) return;
    
    try {
      await invalidateCacheCluster(selectedClusterId);
      await loadCacheClusters();
      setSelectedClusterId(null);
      onCacheUpdated?.();
    } catch (err) {
      setError('Failed to invalidate cache cluster');
    }
  };

  return (
    <div className="bg-[#121826] p-4 rounded-lg border border-[rgba(255,255,255,0.1)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-cyan-400">Semantic Cache Manager</h3>
        <div className="flex items-center space-x-2">
          <button 
            onClick={loadCacheClusters}
            disabled={loading}
            className={`px-3 py-1 rounded text-sm bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30`}
          >
            🔄 Refresh
          </button>
          <button 
            onClick={handleInvalidate}
            disabled={!selectedClusterId || loading}
            className={`px-3 py-1 rounded text-sm bg-red-600/20 text-red-400 hover:bg-red-600/30`}
          >
            🗑️ Invalidate Selected
          </button>
        </div>
      </div>

      {error ? (
        <div className="p-3 bg-red-900/20 border border-red-500/30 rounded text-red-400 text-sm">
          {error}
        </div>
      ) : loading ? (
        <div className="text-center py-8 text-cyan-400/50">
          Loading cache clusters...
        </div>
      ) : clusters.length === 0 ? (
        <div className="text-center py-8 text-cyan-400/50">
          No cache clusters found
        </div>
      ) : (
        <>
          <div className="h-[300px] relative">
            {/* SVG Scatter Plot */}
            <svg className="w-full h-full" viewBox="0 0 800 600">
              {/* Axes */}
              <line x1="50" y1="550" x2="750" y2="550" stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
              <line x1="50" y1="50" x2="50" y2="550" stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
              
              {/* Cluster Points */}
              {clusters.map((cluster: any) => (
                <g 
                  key={cluster.id}
                  onClick={() => handleClusterClick(cluster.id)}
                  className="cursor-pointer"
                  transform={`translate(${50 + (cluster.x + 1) * 350}) translate(0,${550 - (cluster.y + 1) * 250})`}
                >
                  <circle 
                    r={selectedClusterId === cluster.id ? 8 : 6} 
                    fill={selectedClusterId === cluster.id ? 'cyan' : 'rgba(255,255,255,0.3)'}
                    stroke={selectedClusterId === cluster.id ? 'cyan' : 'white'}
                    strokeWidth={selectedClusterId === cluster.id ? 2 : 1}
                  />
                  <text 
                    x={0} 
                    y={-10} 
                    fill="text-cyan-200" 
                    fontSize="10" 
                    textAnchor="middle"
                    className="pointer-events-none"
                  >
                    {cluster.id.slice(0, 6)}...
                  </text>
                </g>
              ))}
              
              {/* Axes Labels */}
              <text x="400" y="580" fill="text-cyan-400/50" fontSize="12" textAnchor="middle">
                UMAP Dimension 1
              </text>
              <text x="20" y="300" fill="text-cyan-400/50" fontSize="12" textAnchor="middle" transform="rotate(-90 20,300)">
                UMAP Dimension 2
              </text>
            </svg>
          </div>
          
          {selectedClusterId && (
            <div className="mt-4 p-3 bg-[#0B0F19/50] rounded border border-[rgba(255,255,255,0.1)]">
              <h4 className="text-cyan-300 mb-2">Selected Cluster Details</h4>
              <div className="space-y-2 text-sm">
                <div>ID: {clusters.find(c => c.id === selectedClusterId)?.id}</div>
                <div>Size: {clusters.find(c => c.id === selectedClusterId)?.size} entries</div>
                <div>Avg Similarity: {(clusters.find(c => c.id === selectedClusterId)?.avgSimilarity || 0).toFixed(2)}</div>
                <div>Last Updated: {new Date(clusters.find(c => c.id === selectedClusterId)?.lastUpdated || 0).toLocaleTimeString()}</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SemanticCacheManager;