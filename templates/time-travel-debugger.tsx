import React, { useState, useEffect } from 'react';
import { useHistorySlider } from './use-history-slider';
import { fetchHistoricalState } from '@/lib/api';

interface TimeTravelDebuggerProps {
  nodeId?: string; // Optional: focus on specific node
}

const TimeTravelDebugger: React.FC<TimeTravelDebuggerProps> = ({ nodeId }) => {
  const { currentTime, setCurrentTime, minTime, maxTime, isPlaying } = useHistorySlider();
  const [historicalState, setHistoricalState] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Fetch historical state when time changes
  useEffect(() => {
    if (currentTime === null) return;

    setLoading(true);
    fetchHistoricalState({ time: currentTime, nodeId })
      .then(data => {
        setHistoricalState(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to fetch historical state:', error);
        setLoading(false);
      });
  }, [currentTime, nodeId]);

  return (
    <div className="bg-[#121826] p-4 rounded-lg border border-[rgba(255,255,255,0.1)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-cyan-400">LLM Time-Travel Debugger</h3>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setCurrentTime(isPlaying ? null : minTime)}
            disabled={loading || currentTime === minTime}
            className={`px-3 py-1 rounded text-sm ${isPlaying ? 'bg-cyan-600/20' : 'bg-cyan-600'} text-cyan-400 hover:bg-cyan-600/30`}
          >
            {isPlaying ? '⏸' : '⏮'} Reset
          </button>
          <button 
            onClick={() => setCurrentTime(prev => prev === null ? minTime : null)}
            disabled={loading}
            className={`px-3 py-1 rounded text-sm ${isPlaying ? 'bg-cyan-600' : 'bg-cyan-600/20'} text-cyan-400 hover:bg-cyan-600/30`}
          >
            {isPlaying ? '⏸' : '▶️'} Play
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-cyan-400/50">Loading historical state...</div>
      ) : historicalState ? (
        <div className="space-y-4">
          <div className="text-sm text-cyan-400/70">
            Time: {new Date(historicalState.timestamp).toLocaleTimeString()} | 
            {' '}
            State Hash: {historicalState.stateHash?.slice(0, 8)}...
          </div>
          
          {/* Token Stream Visualization */}
          <div className="bg-[#0B0F19/50] p-3 rounded">
            <h4 className="text-cyan-300 mb-2">Token Stream:</h4>
            <pre className="text-xs text-cyan-200 overflow-auto h-32">
              {historicalState.tokenStream?.map((token: string, index: number) => 
                `${index}: ${token}`
              ).join('\n') || 'No token stream data'}
            </pre>
          </div>

          {/* Tool Call States */}
          <div className="bg-[#0B0F19/50] p-3 rounded">
            <h4 className="text-cyan-300 mb-2">Tool Call States:</h4>
            <pre className="text-xs text-cyan-200 overflow-auto h-32">
              {JSON.stringify(historicalState.toolCallStates, null, 2) || 'No tool call data'}
            </pre>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-cyan-400/50">
          Select a time on the timeline to view historical state
        </div>
      )}
    </div>
  );
};

export default TimeTravelDebugger;