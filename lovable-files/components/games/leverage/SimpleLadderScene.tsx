import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

interface SimpleLadderSceneProps {
  currentLevel: number;
  multiplier: number;
  risk: number;
  milestones?: number[];
  onMilestoneReached?: (milestone: number) => void;
}

export interface SimpleLadderSceneRef {
  animateAdvance: () => void;
  animateLiquidation: () => void;
  animateCashout: () => void;
  updateRisk: (risk: number) => void;
}

const SimpleLadderScene = forwardRef<SimpleLadderSceneRef, SimpleLadderSceneProps>(({
  currentLevel,
  multiplier,
  risk,
  milestones = [2, 5, 10],
  onMilestoneReached
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useImperativeHandle(ref, () => ({
    animateAdvance: () => {
      console.log('🎯 SimpleLadderScene: animateAdvance called');
      // Simple animation - just flash the canvas
      if (canvasRef.current) {
        canvasRef.current.style.filter = 'brightness(1.5)';
        setTimeout(() => {
          if (canvasRef.current) {
            canvasRef.current.style.filter = 'brightness(1)';
          }
        }, 200);
      }
    },
    
    animateLiquidation: () => {
      console.log('💥 SimpleLadderScene: animateLiquidation called');
      // Simple liquidation animation - red flash
      if (canvasRef.current) {
        canvasRef.current.style.filter = 'brightness(2) saturate(0) hue-rotate(0deg)';
        setTimeout(() => {
          if (canvasRef.current) {
            canvasRef.current.style.filter = 'brightness(1) saturate(1) hue-rotate(0deg)';
          }
        }, 500);
      }
    },
    
    animateCashout: () => {
      console.log('💰 SimpleLadderScene: animateCashout called');
      // Simple cashout animation - green flash
      if (canvasRef.current) {
        canvasRef.current.style.filter = 'brightness(1.5) saturate(2) hue-rotate(120deg)';
        setTimeout(() => {
          if (canvasRef.current) {
            canvasRef.current.style.filter = 'brightness(1) saturate(1) hue-rotate(0deg)';
          }
        }, 300);
      }
    },
    
    updateRisk: (newRisk: number) => {
      console.log('🔥 SimpleLadderScene: updateRisk called with', newRisk);
      // Update flame height based on risk
      if (canvasRef.current) {
        const flameHeight = Math.min(100, newRisk * 2);
        canvasRef.current.style.borderBottomWidth = `${flameHeight}px`;
      }
    }
  }));

  // Draw the scene
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#071228'); // Deep navy
      gradient.addColorStop(1, '#0E1F3A'); // Lighter navy
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stars
      ctx.fillStyle = '#FFFFFF';
      for (let i = 0; i < 50; i++) {
        const x = (i * 137.5) % canvas.width;
        const y = (i * 73.2) % (canvas.height * 0.6);
        const size = Math.sin(Date.now() * 0.001 + i) * 0.5 + 1;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Moon
      const moonX = canvas.width * 0.8;
      const moonY = canvas.height * 0.2;
      const moonSize = 60;
      
      // Moon glow
      const moonGradient = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, moonSize + 20);
      moonGradient.addColorStop(0, 'rgba(230, 243, 255, 0.8)');
      moonGradient.addColorStop(1, 'rgba(230, 243, 255, 0)');
      ctx.fillStyle = moonGradient;
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonSize + 20, 0, Math.PI * 2);
      ctx.fill();
      
      // Moon body
      ctx.fillStyle = '#E6F3FF';
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonSize, 0, Math.PI * 2);
      ctx.fill();

      // Flames at bottom
      const flameHeight = Math.min(100, risk * 2);
      const flameY = canvas.height - flameHeight;
      
      // Flame gradient
      const flameGradient = ctx.createLinearGradient(0, flameY, 0, canvas.height);
      flameGradient.addColorStop(0, '#FF6A00');
      flameGradient.addColorStop(1, '#FFB000');
      ctx.fillStyle = flameGradient;
      ctx.fillRect(canvas.width * 0.3, flameY, canvas.width * 0.4, flameHeight);

      // Ladder (candlesticks)
      const ladderX = canvas.width / 2;
      const ladderStartY = canvas.height - 200;
      const rungSpacing = 60;
      
      for (let level = 1; level <= Math.max(10, currentLevel + 3); level++) {
        const rungY = ladderStartY - (level - 1) * rungSpacing;
        
        // Skip if off screen
        if (rungY < 0) continue;
        
        // Candle color based on level
        let candleColor = '#21E39E'; // Green
        if (level > 3) candleColor = '#00C2FF'; // Cyan
        if (level > 6) candleColor = '#9A2EFF'; // Purple
        if (level > 9) candleColor = '#FFE26B'; // Gold
        
        // Candle body
        const bodyWidth = 40;
        const bodyHeight = 20;
        ctx.fillStyle = candleColor;
        ctx.fillRect(ladderX - bodyWidth/2, rungY - bodyHeight/2, bodyWidth, bodyHeight);
        
        // Candle wicks
        ctx.strokeStyle = candleColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ladderX, rungY - bodyHeight/2);
        ctx.lineTo(ladderX, rungY - bodyHeight/2 - 8);
        ctx.moveTo(ladderX, rungY + bodyHeight/2);
        ctx.lineTo(ladderX, rungY + bodyHeight/2 + 8);
        ctx.stroke();
        
        // Glow effect
        ctx.shadowColor = candleColor;
        ctx.shadowBlur = 8;
        ctx.fillStyle = candleColor;
        ctx.fillRect(ladderX - bodyWidth/2, rungY - bodyHeight/2, bodyWidth, bodyHeight);
        ctx.shadowBlur = 0;
        
        // Highlight current level
        if (level === currentLevel) {
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 3;
          ctx.strokeRect(ladderX - bodyWidth/2 - 5, rungY - bodyHeight/2 - 5, bodyWidth + 10, bodyHeight + 10);
        }
      }

      // Avatar (player position)
      if (currentLevel > 0) {
        const avatarY = ladderStartY - (currentLevel - 1) * rungSpacing;
        ctx.fillStyle = '#FFD700';
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(ladderX, avatarY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Milestone labels
      milestones.forEach(milestone => {
        const milestoneY = ladderStartY - (milestone - 1) * rungSpacing;
        if (milestoneY > 0 && milestoneY < canvas.height) {
          ctx.fillStyle = milestone === 2 ? '#61FFE8' : milestone === 5 ? '#FF9AF6' : '#FFE26B';
          ctx.font = 'bold 24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`${milestone}×`, ladderX + 80, milestoneY);
        }
      });

      // Continue animation
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [currentLevel, multiplier, risk, milestones]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const container = canvas.parentElement;
      if (!container) return;
      
      const { clientWidth, clientHeight } = container;
      canvas.width = clientWidth;
      canvas.height = clientHeight;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ 
          width: '100%', 
          height: '100%',
          display: 'block',
          borderBottom: `${Math.min(100, risk * 2)}px solid #FF6A00`
        }}
      />
    </div>
  );
});

SimpleLadderScene.displayName = 'SimpleLadderScene';

export default SimpleLadderScene;
