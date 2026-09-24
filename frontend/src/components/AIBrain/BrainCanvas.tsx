import React, { useRef, useEffect } from 'react';

export type AgentState =
  | 'idle'
  | 'listening'
  | 'understanding'
  | 'searching'
  | 'retrieving'
  | 'ocr'
  | 'vision'
  | 'reasoning'
  | 'verifying'
  | 'answering'
  | 'complete'
  | 'error';

interface BrainCanvasProps {
  state: AgentState;
}

const activityMap: Record<AgentState, number> = {
  idle: 0.1,
  listening: 0.25,
  understanding: 0.4,
  searching: 0.55,
  retrieving: 0.65,
  ocr: 0.7,
  vision: 0.75,
  reasoning: 1.0,
  verifying: 0.8,
  answering: 0.6,
  complete: 0.2,
  error: 0.0,
};

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseX: number;
  baseY: number;
  radius: number;
  cluster: string;
}

interface Connection {
  source: Node;
  target: Node;
  particles: { progress: number; speed: number }[];
}

export const BrainCanvas: React.FC<BrainCanvasProps> = ({ state }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width;
    let height = canvas.height;
    
    // Handle resizing
    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        width = parent.clientWidth;
        height = parent.clientHeight;
        canvas.width = width;
        canvas.height = height;
      }
    };
    window.addEventListener('resize', resize);
    resize();

    // Procedural generation
    const nodes: Node[] = [];
    const connections: Connection[] = [];
    const numNodes = 70;
    
    for (let i = 0; i < numNodes; i++) {
      const isCenter = i < 10;
      const angle = Math.random() * Math.PI * 2;
      const dist = isCenter ? Math.random() * 50 : 50 + Math.random() * (Math.min(width, height) / 2.5 - 50);
      const baseX = width / 2 + Math.cos(angle) * dist;
      const baseY = height / 2 + Math.sin(angle) * dist;
      
      nodes.push({
        x: baseX,
        y: baseY,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        baseX,
        baseY,
        radius: isCenter ? Math.random() * 2 + 2 : Math.random() * 1.5 + 1,
        cluster: isCenter ? 'center' : (baseX < width / 2 ? 'left' : 'right')
      });
    }

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 100) {
          connections.push({
            source: nodes[i],
            target: nodes[j],
            particles: []
          });
        }
      }
    }

    let animationFrameId: number;
    let time = 0;

    const draw = () => {
      time += 0.016;
      ctx.clearRect(0, 0, width, height);
      
      const targetActivity = activityMap[state] || 0.1;

      // Update nodes
      nodes.forEach(node => {
        node.x += node.vx * targetActivity;
        node.y += node.vy * targetActivity;
        
        const dx = node.x - node.baseX;
        const dy = node.y - node.baseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 10) {
          node.vx -= dx * 0.01;
          node.vy -= dy * 0.01;
        }
        
        // Pulsing effect
        const currentRadius = node.radius * (1 + targetActivity * 0.5 * Math.sin(time * 5 + node.baseX));
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius, 0, Math.PI * 2);
        const alpha = Math.min(1, 0.2 + targetActivity * 0.8);
        ctx.fillStyle = state === 'error' ? `rgba(255, 0, 0, ${alpha})` : `rgba(217, 130, 91, ${alpha})`;
        ctx.fill();
      });

      // Update connections & particles
      connections.forEach(conn => {
        ctx.beginPath();
        ctx.moveTo(conn.source.x, conn.source.y);
        ctx.lineTo(conn.target.x, conn.target.y);
        const alpha = Math.min(0.5, 0.05 + targetActivity * 0.2);
        ctx.strokeStyle = state === 'error' ? `rgba(255, 0, 0, ${alpha})` : `rgba(217, 130, 91, ${alpha})`;
        ctx.lineWidth = 0.5 + targetActivity * 0.5;
        ctx.stroke();

        // Spawn particles based on activity
        if (Math.random() < targetActivity * 0.05) {
          conn.particles.push({ progress: 0, speed: 0.01 + targetActivity * 0.02 });
        }

        // Draw particles
        for (let i = conn.particles.length - 1; i >= 0; i--) {
          const p = conn.particles[i];
          p.progress += p.speed;
          if (p.progress >= 1) {
            conn.particles.splice(i, 1);
          } else {
            const px = conn.source.x + (conn.target.x - conn.source.x) * p.progress;
            const py = conn.source.y + (conn.target.y - conn.source.y) * p.progress;
            
            ctx.beginPath();
            ctx.arc(px, py, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = state === 'error' ? '#FF4444' : '#FF7A30';
            ctx.fill();
          }
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [state]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />;
};
