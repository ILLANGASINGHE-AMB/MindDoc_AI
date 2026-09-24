import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrainCanvas, type AgentState } from './BrainCanvas';
import './AIBrain.css';

interface AgentEvent {
  type: string;
  state: AgentState;
  message: string;
  timestamp: string;
}

export const AIBrainPage: React.FC = () => {
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    // Don't connect if unmounted
    if (!mountedRef.current) return;

    // Close existing connection if any
    if (wsRef.current) {
      const ws = wsRef.current;
      ws.onclose = null;
      ws.onerror = null;
      ws.onmessage = null;
      if (ws.readyState === WebSocket.CONNECTING) {
        ws.onopen = () => ws.close();
      } else {
        try { ws.close(); } catch {}
      }
      wsRef.current = null;
    }

    const wsUrl = 'ws://localhost:8000/agent/ws';
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('AI Brain WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'agent_state') {
          const enriched: AgentEvent = {
            ...data,
            timestamp: new Date().toLocaleTimeString(),
          };
          setAgentState(data.state as AgentState);
          setEvents(prev => [...prev.slice(-99), enriched]); // keep last 100
        }
      } catch (e) {
        console.error("Failed to parse websocket message", e);
      }
    };

    ws.onerror = () => {
      // Suppress noisy console errors; onclose will handle reconnect
    };

    ws.onclose = () => {
      console.log('AI Brain WebSocket disconnected, reconnecting in 3s...');
      if (mountedRef.current) {
        reconnectTimerRef.current = setTimeout(connect, 3000);
      }
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        const ws = wsRef.current;
        ws.onclose = null; // prevent reconnect on unmount
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.onopen = () => ws.close();
        } else {
          try { ws.close(); } catch {}
        }
        wsRef.current = null;
      }
    };
  }, [connect]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  const activityLevel = agentState === 'idle' ? 'LOW'
    : agentState === 'reasoning' ? 'MAXIMUM'
    : agentState === 'complete' ? 'LOW'
    : 'HIGH';

  return (
    <div className="aibrain-view">
      <div className="aibrain-header">
        <h2>AI BRAIN</h2>
        <div className="aibrain-subtitle">Real-time Agent Activity</div>
      </div>

      <div className="aibrain-canvas-container">
        <BrainCanvas state={agentState} />
        {agentState === 'idle' && (
          <div className="idle-overlay">
            <div>IDLE</div>
            <div className="idle-sub">Waiting for activity...</div>
          </div>
        )}
      </div>

      <div className="aibrain-panels">
        <div className="aibrain-status-panel">
          <div className="panel-title">AGENT STATUS</div>
          <div className="status-row">
            <span className="status-label">STATE:</span>
            <span className="status-value">{agentState.toUpperCase()}</span>
          </div>
          <div className="status-row">
            <span className="status-label">ACTIVITY:</span>
            <span className="status-value">{activityLevel}</span>
          </div>
        </div>

        <div className="aibrain-log-panel">
          <div className="panel-title">ACTIVITY LOG</div>
          <div className="log-container">
            {events.length === 0 && (
              <div className="log-item" style={{ color: 'var(--text-muted)' }}>
                No activity yet. Ask a question in the Chat tab to see the agent work.
              </div>
            )}
            {events.map((evt, idx) => (
              <div key={idx} className="log-item">
                <span className="log-time">[{evt.timestamp}]</span> {evt.message}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};
