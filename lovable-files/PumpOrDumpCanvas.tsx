import React, { useRef, useEffect, useState, useCallback } from 'react';
import { apiService } from '../services/api';
import { useWallet } from '../hooks/useWallet';
import { sfx } from './SFXSystem';

interface Candle {
  open: number;
  close: number;
  high: number;
  low: number;
  timestamp: number;
}

interface RngTrace {
  pWin: number;
  profile: 'spiky' | 'meanRevert' | 'trendThenSnap' | 'chopThenRip';
  endBps: number;
  userChoice: string;
  willWin: boolean;
  rng: number;
}

interface PumpOrDumpCanvasProps {
  entryPrice: number;
  rngTrace: RngTrace;
  durationMs?: number;
  onComplete: (result: any) => void;
}

export const PumpOrDumpCanvas: React.FC<PumpOrDumpCanvasProps> = ({
  entryPrice,
  rngTrace,
  durationMs = 6500,
  onComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const pricePathRef = useRef<number[]>([]);
  const lastCandleTimeRef = useRef<number>(0);
  const [currentPrice, setCurrentPrice] = useState(entryPrice);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  // Ornstein-Uhlenbeck parameters based on volatility profile (more dramatic like irugged.fun)
  const getProfileParams = useCallback((profile: string) => {
    switch (profile) {
      case 'spiky':
        return { sigma: 0.012, kappa: 0.08, jumpRate: 1.2, jumpSize: 0.018 };
      case 'meanRevert':
        return { sigma: 0.010, kappa: 0.25, jumpRate: 0.6, jumpSize: 0.012 };
      case 'trendThenSnap':
        return { sigma: 0.011, kappa: 0.03, jumpRate: 0.8, jumpSize: 0.015 };
      case 'chopThenRip':
        return { sigma: 0.008, kappa: 0.15, jumpRate: 0.5, jumpSize: 0.020 };
      default:
        return { sigma: 0.010, kappa: 0.15, jumpRate: 0.7, jumpSize: 0.014 };
    }
  }, []);

  // Generate price path using Ornstein-Uhlenbeck with jumps
  const generatePricePath = useCallback((trace: RngTrace) => {
    const params = getProfileParams(trace.profile);
    const targetEndPrice = entryPrice * (1 + (trace.endBps / 10000) * (trace.willWin ? 1 : -1));
    
    const path: number[] = [];
    const dt = 1/60; // 60fps
    const totalSteps = Math.floor(durationMs / (dt * 1000));
    
    let currentPrice = entryPrice;
    let lastJumpTime = 0;
    
    for (let i = 0; i < totalSteps; i++) {
      const t = i * dt;
      const progress = i / totalSteps;
      
      // Ornstein-Uhlenbeck process
      const meanReversion = params.kappa * (entryPrice - currentPrice) * dt;
      const volatility = params.sigma * Math.sqrt(dt) * (Math.random() - 0.5) * 2;
      
      // Jump process (Poisson)
      let jump = 0;
      if (t - lastJumpTime > 1/params.jumpRate && Math.random() < params.jumpRate * dt) {
        jump = (Math.random() - 0.5) * params.jumpSize * entryPrice;
        lastJumpTime = t;
      }
      
      // Path shaping to match final outcome
      let targetBias = 0;
      if (progress > 0.85) {
        // Last 15%: steer toward target
        const targetProgress = (progress - 0.85) / 0.15;
        targetBias = (targetEndPrice - currentPrice) * targetProgress * 0.1;
      }
      
      // Fakeout: cross entry line mid-round then reverse (30% chance for more drama)
      let fakeoutBias = 0;
      if (progress > 0.2 && progress < 0.8 && Math.random() < 0.3) {
        const fakeoutDirection = trace.willWin ? -1 : 1;
        fakeoutBias = fakeoutDirection * entryPrice * 0.015 * Math.sin((progress - 0.2) * Math.PI / 0.6);
      }
      
      // Add more dramatic swings
      let dramaBias = 0;
      if (Math.random() < 0.1) { // 10% chance for dramatic moves
        dramaBias = (Math.random() - 0.5) * entryPrice * 0.02;
      }
      
      currentPrice += meanReversion + volatility + jump + targetBias + fakeoutBias + dramaBias;
      
      // Allow more dramatic movements (like irugged.fun)
      const maxDeviation = entryPrice * 0.12; // 12% max deviation for more drama
      currentPrice = Math.max(entryPrice - maxDeviation, Math.min(entryPrice + maxDeviation, currentPrice));
      
      path.push(currentPrice);
    }
    
    // Ensure final price matches target
    path[path.length - 1] = targetEndPrice;
    
    return path;
  }, [entryPrice, durationMs, getProfileParams]);

  // Animation loop
  const animate = useCallback((timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }
    
    const elapsed = timestamp - startTimeRef.current;
    const progress = Math.min(elapsed / durationMs, 1);
    
    if (progress >= 1 && !isComplete) {
      setIsComplete(true);
      sfx.final(); // Play final sound
      onComplete({ price: currentPrice, candles });
      return;
    }
    
    // Update price based on generated path (60fps)
    const pathIndex = Math.floor(progress * pricePathRef.current.length);
    if (pathIndex < pricePathRef.current.length) {
      const newPrice = pricePathRef.current[pathIndex];
      setCurrentPrice(newPrice);
      
      // Create new candle every 80ms (12.5fps for candles - more frequent like irugged.fun)
      if (elapsed - lastCandleTimeRef.current >= 80) {
        const candleStartIndex = Math.max(0, pathIndex - 7);
        const candleEndIndex = pathIndex;
        
        const newCandle: Candle = {
          open: candleStartIndex > 0 ? pricePathRef.current[candleStartIndex] : entryPrice,
          close: newPrice,
          high: Math.max(...pricePathRef.current.slice(candleStartIndex, candleEndIndex + 1)),
          low: Math.min(...pricePathRef.current.slice(candleStartIndex, candleEndIndex + 1)),
          timestamp: timestamp
        };
        
        setCandles(prev => [...prev.slice(-20), newCandle]); // Keep last 20 candles
        lastCandleTimeRef.current = elapsed;
        
        // Play tick sound for new candle
        sfx.tick();
      }
    }
    
    // Render frame
    renderFrame(progress);
    
    animationRef.current = requestAnimationFrame(animate);
  }, [entryPrice, durationMs, isComplete, onComplete]);

  // Render frame
  const renderFrame = useCallback((progress: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { width, height } = canvas;
    
    // Clear canvas with red gradient background (like irugged.fun)
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#2d1b1b'); // Dark red top
    gradient.addColorStop(1, '#0a0a0a'); // Black bottom
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Draw subtle grid lines
    ctx.strokeStyle = '#1a0f0f';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw entry line with yellow color and multiplier tags
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw multiplier tags on entry line
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 12px Arial';
    ctx.fillText('1.00x', 10, height / 2 - 5);
    ctx.fillText('1.00x', width - 50, height / 2 - 5);
    
    // Draw candles with irugged.fun style
    const candleWidth = Math.max(12, width / 20); // Thicker candles
    const priceRange = entryPrice * 0.15; // 15% range for more dramatic movement
    
    candles.forEach((candle, index) => {
      const x = (index * candleWidth) + (width - candles.length * candleWidth);
      const isGreen = candle.close >= candle.open;
      
      // Calculate positions
      const bodyTop = height / 2 - (Math.max(candle.open, candle.close) - entryPrice) / priceRange * height;
      const bodyBottom = height / 2 - (Math.min(candle.open, candle.close) - entryPrice) / priceRange * height;
      const bodyHeight = bodyBottom - bodyTop;
      
      // Candle body - thicker and more prominent
      ctx.fillStyle = isGreen ? '#00ff88' : '#ff4444';
      ctx.fillRect(x + 2, bodyTop, candleWidth - 4, Math.max(2, bodyHeight));
      
      // Candle wicks - more prominent
      const wickTop = height / 2 - (candle.high - entryPrice) / priceRange * height;
      const wickBottom = height / 2 - (candle.low - entryPrice) / priceRange * height;
      
      ctx.strokeStyle = isGreen ? '#00ff88' : '#ff4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + candleWidth / 2, wickTop);
      ctx.lineTo(x + candleWidth / 2, wickBottom);
      ctx.stroke();
      
      // Add subtle glow to candles
      ctx.shadowColor = isGreen ? '#00ff88' : '#ff4444';
      ctx.shadowBlur = 5;
      ctx.fillRect(x + 2, bodyTop, candleWidth - 4, Math.max(2, bodyHeight));
      ctx.shadowBlur = 0;
    });
    
    // Draw current price line with multiplier
    const currentY = height / 2 - (currentPrice - entryPrice) / priceRange * height;
    const currentMultiplier = (currentPrice / entryPrice).toFixed(2);
    
    // Price line
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width - 150, currentY);
    ctx.lineTo(width, currentY);
    ctx.stroke();
    
    // Multiplier tag
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`${currentMultiplier}x`, width - 80, currentY - 8);
    
    // Draw price labels in top-left
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`ENTRY: $${entryPrice.toFixed(0)}`, 15, 25);
    ctx.fillText(`CURRENT: $${currentPrice.toFixed(0)}`, 15, 45);
    
    if (isComplete) {
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 18px Arial';
      ctx.fillText(`FINAL: $${currentPrice.toFixed(0)}`, 15, 70);
    }
  }, [entryPrice, currentPrice, candles, isComplete]);

  // Generate price path on mount
  useEffect(() => {
    const path = generatePricePath(rngTrace);
    pricePathRef.current = path;
    
    // Start animation immediately after path generation
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [generatePricePath, rngTrace, animate]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        className="w-full h-96 rounded-lg"
        style={{ 
          background: 'linear-gradient(to bottom, #2d1b1b 0%, #0a0a0a 100%)',
          imageRendering: 'auto'
        }}
      />
      
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 rounded-b-lg overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-purple-500 to-teal-500 transition-all duration-100"
          style={{ 
            width: `${startTimeRef.current ? Math.min((Date.now() - startTimeRef.current) / durationMs * 100, 100) : 0}%` 
          }}
        />
      </div>
    </div>
  );
};
