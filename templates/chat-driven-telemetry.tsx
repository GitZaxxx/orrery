import React, { useState, useEffect } from 'react';
import { useChatStream } from '@/hooks/use-chat-stream';
import { DynamicChart } from './dynamic-chart';

interface ChatDrivenTelemetryProps {
  onChartGenerated?: (config: any) => void;
}

const ChatDrivenTelemetry: React.FC<ChatDrivenTelemetryProps> = ({ onChartGenerated }) => {
  const { input, setInput, isLoading, messages, append } = useChatStream({
    api: '/api/telemetry/chat',
    onResponse: (response) => {
      // Parse the response to extract chart config and data
      if (response.type === 'chart') {
        const { data, config } = response.payload;
        // Render the chart dynamically
        append({
          role: 'assistant',
          content: <DynamicChart data={data} config={config} key={`chart-${Date.now()}`} />
        });
        
        if (onChartGenerated) {
          onChartGenerated({ data, config });
        }
      }
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Send the chat message to backend which will generate SQL + chart config
    append({ role: 'user', content: input });
    setInput('');
  };

  return (
    <div className="bg-[#121826] p-4 rounded-lg border border-[rgba(255,255,255,0.1)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-cyan-400">Chat-Driven Telemetry</h3>
        <p className="text-xs text-cyan-400/50">Ask for charts in natural language</p>
      </div>
      
      <div className="mb-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Show me token latency trends for agent A over last hour..."
            className="flex-1 bg-[#0B0F19/50] border border-[rgba(255,255,255,0.1)] rounded px-3 py-2 text-cyan-200 focus:ring-2 focus:ring-cyan-500"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-600/90 text-cyan-200 rounded transition-colors"
          >
            {isLoading ? 'Generating...' : 'Generate Chart'}
          </button>
        </form>
      </div>
      
      <div className="h-[400px] overflow-y-auto space-y-4">
        {messages.map((msg, index) => 
          msg.content instanceof React.ReactElement ? (
            <div key={msg.key || index} className="flex justify-start">
              {msg.content}
            </div>
          ) : (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} max-w-[80%] `}>
              <div className={`${msg.role === 'user' ? 'bg-cyan-600/20' : 'bg-[#0B0F19/50]'} rounded-lg px-3 py-2 text-cyan-200 ${msg.role === 'user' ? 'ml-auto' : ''}`}>
                {msg.content}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ChatDrivenTelemetry;