import React, { useEffect, useRef } from 'react';
import { Ball, GameConfig, Multiplier } from '../types';
import { playPopSound, playWinSound } from '../utils/sound';

interface GameCanvasProps {
  config: GameConfig;
  multipliers: Multiplier[];
  balls: Ball[];
  onBallFinish: (ballId: string, multiplier: number, betValue: number) => void;
  width: number;
  height: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  config,
  multipliers,
  balls,
  onBallFinish,
  width,
  height,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Keep track of internal ball state (position) separate from React state for 60fps
  const activeBallsRef = useRef<Ball[]>([]); 
  
  // Sync props to ref when new balls are added
  useEffect(() => {
    // Check for new balls that aren't in our active ref
    const currentIds = new Set(activeBallsRef.current.map(b => b.id));
    const newBalls = balls.filter(b => !currentIds.has(b.id));
    
    if (newBalls.length > 0) {
      activeBallsRef.current = [...activeBallsRef.current, ...newBalls];
    }
  }, [balls]);

  // Main Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let lastTime = performance.now();

    const render = (time: number) => {
      const deltaTime = Math.min((time - lastTime) / 1000, 0.1); // Cap delta to prevent huge jumps
      lastTime = time;

      ctx.clearRect(0, 0, width, height);
      
      const { rowCount } = config;

      // --- Dimensions & Spacing ---
      // Adjusted padding to ensure multipliers at the bottom are fully visible
      const paddingTop = 50; 
      const paddingBottom = 90; 
      const usableHeight = height - paddingTop - paddingBottom;
      const spacing = usableHeight / rowCount;
      const startX = width / 2;

      // --- Draw Pegs ---
      ctx.fillStyle = '#ffffff';
      const pegRadius = Math.max(2, Math.min(4, spacing * 0.15));
      
      for (let row = 0; row <= rowCount; row++) {
        for (let col = 0; col <= row; col++) {
          const x = startX + (col - row / 2) * spacing;
          const y = paddingTop + row * spacing;
          
          ctx.beginPath();
          ctx.arc(x, y, pegRadius, 0, Math.PI * 2);
          ctx.shadowBlur = 4;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.2)';
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.closePath();
        }
      }

      // --- Draw Multiplier Boxes ---
      const lastRowY = paddingTop + rowCount * spacing;
      // Calculate box size dynamically but ensure visibility
      const boxWidth = spacing * 0.95; 
      const boxHeight = Math.min(40, Math.max(24, spacing * 0.9)); // Ensure min height for text
      
      // Dynamic font size
      const fontSize = Math.max(12, Math.min(16, spacing * 0.45));
      ctx.font = `800 ${fontSize}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      multipliers.forEach((m, idx) => {
        const x = startX + (idx - rowCount / 2) * spacing;
        // Position boxes slightly below the last row
        const y = lastRowY + spacing * 0.6 + boxHeight * 0.2; 

        const rx = x - boxWidth/2;
        const ry = y - boxHeight/2;
        
        ctx.beginPath();
        ctx.roundRect(rx, ry, boxWidth, boxHeight, 4);
        
        // Background with opacity
        ctx.fillStyle = `rgba(${m.color}, 0.2)`;
        ctx.fill();
        
        // Border Stroke for definition
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = `rgba(${m.color}, 0.6)`;
        ctx.stroke();

        // Text - Use White for clarity with colored glow
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = `rgba(${m.color}, 1)`;
        ctx.shadowBlur = 6;
        ctx.fillText(m.label, x, y + 1); // +1 visual offset for vertical center
        ctx.shadowBlur = 0;
      });

      // --- Update & Draw Balls ---
      activeBallsRef.current.forEach((ball) => {
        if (ball.finished) return;

        const speed = 3 + (rowCount / 12); // Speed tuning
        ball.progress += deltaTime * speed;

        if (ball.progress >= 1) {
          ball.progress = 0;
          ball.currentRow++;
          
          if (ball.currentRow > 0 && ball.currentRow < rowCount) {
             playPopSound(1 + (ball.currentRow / rowCount) * 0.5); 
          }

          if (ball.currentRow >= rowCount) {
             ball.finished = true;
             // Calculate final index based on path (right moves)
             const rightMoves = ball.targetPath.filter(d => d === 1).length;
             // Map to multiplier index
             const finalIndex = rightMoves; 
             const safeIndex = Math.min(Math.max(finalIndex, 0), multipliers.length - 1);
             const multiplier = multipliers[safeIndex].value;

             playWinSound(multiplier);
             onBallFinish(ball.id, multiplier, ball.value);
          }
        }

        // Render Interpolation
        const getColAtRow = (r: number) => {
           if (r < 0) return 0;
           let xOffset = 0;
           for(let i=0; i < r; i++) {
              const dir = ball.targetPath[i] === 0 ? -0.5 : 0.5;
              xOffset += dir;
           }
           return xOffset;
        };

        const currentXOffset = getColAtRow(ball.currentRow);
        const nextDir = ball.targetPath[ball.currentRow] === 0 ? -0.5 : 0.5;
        const nextXOffset = currentXOffset + nextDir;

        const y1 = paddingTop + ball.currentRow * spacing;
        const y2 = paddingTop + (ball.currentRow + 1) * spacing;
        
        const x1 = startX + (currentXOffset * spacing); 
        const x2 = startX + (nextXOffset * spacing);

        const t = ball.progress;
        
        const hash = (ball.id.charCodeAt(0) + ball.currentRow) % 100;
        const jitter = (hash / 100 - 0.5) * (spacing * 0.1) * Math.sin(t * Math.PI);

        const curX = x1 + (x2 - x1) * t + jitter;
        
        // Gravity parabola
        const bounceHeight = spacing * 0.4; 
        const curY = (y1 + (y2 - y1) * t) - (Math.sin(t * Math.PI) * bounceHeight);

        let renderX, renderY;
        if (ball.currentRow === -1) {
            // Drop from spawner
            const sy1 = 20; // Spawner height
            const sy2 = paddingTop;
            renderX = startX;
            renderY = sy1 + (sy2 - sy1) * t; 
        } else {
            renderX = curX;
            renderY = curY;
        }

        ctx.beginPath();
        ctx.arc(renderX, renderY, pegRadius * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.shadowColor = ball.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.closePath();
      });

      activeBallsRef.current = activeBallsRef.current.filter(b => !b.finished);

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [config, multipliers, onBallFinish, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="mx-auto select-none"
    />
  );
};