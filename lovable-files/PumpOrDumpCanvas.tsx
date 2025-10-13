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
  const [currentPrice, setCurrentPrice] = useState(entryPrice);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  // Ornstein-Uhlenbeck parameters based on volatility profile
  const getProfileParams = useCallback((profile: string) => {
    switch (profile) {
      case 'spiky':
        return { sigma: 0.008, kappa: 0.1, jumpRate: 0.8, jumpSize: 0.012 };
      case 'meanRevert':
        return { sigma: 0.006, kappa: 0.3, jumpRate: 0.4, jumpSize: 0.008 };
      case 'trendThenSnap':
        return { sigma: 0.007, kappa: 0.05, jumpRate: 0.6, jumpSize: 0.010 };
      case 'chopThenRip':
        return { sigma: 0.005, kappa: 0.2, jumpRate: 0.3, jumpSize: 0.015 };
      default:
        return { sigma: 0.006, kappa: 0.2, jumpRate: 0.5, jumpSize: 0.010 };
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
      
      // Fakeout: cross entry line mid-round then reverse (20% chance)
      let fakeoutBias = 0;
      if (progress > 0.3 && progress < 0.7 && Math.random() < 0.2) {
        const fakeoutDirection = trace.willWin ? -1 : 1;
        fakeoutBias = fakeoutDirection * entryPrice * 0.01 * Math.sin((progress - 0.3) * Math.PI / 0.4);
      }
      
      currentPrice += meanReversion + volatility + jump + targetBias + fakeoutBias;
      
      // Ensure we don't go too far from entry
      const maxDeviation = entryPrice * 0.08; // 8% max deviation
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
    
    // Update price based on generated path
    const pathIndex = Math.floor(progress * (durationMs / (1000/60)));
    if (pathIndex < pricePath.length) {
      setCurrentPrice(pricePath[pathIndex]);
      
      // Create new candle every 120ms (5fps for candles)
      if (pathIndex % 7 === 0) {
        const newCandle: Candle = {
          open: pathIndex > 0 ? pricePath[pathIndex - 7] : entryPrice,
          close: pricePath[pathIndex],
          high: Math.max(...pricePath.slice(Math.max(0, pathIndex - 7), pathIndex + 1)),
          low: Math.min(...pricePath.slice(Math.max(0, pathIndex - 7), pathIndex + 1)),
          timestamp: Date.now()
        };
        
        setCandles(prev => [...prev.slice(-20), newCandle]); // Keep last 20 candles
        
        // Play tick sound for new candle
        sfx.tick();
      }
    }
    
    // Render frame
    renderFrame(progress);
    
    animationRef.current = requestAnimationFrame(animate);
  }, [currentPrice, candles, isComplete, onComplete, pricePath]);

  // Render frame
  const renderFrame = useCallback((progress: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { width, height } = canvas;
    
    // Clear canvas
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw entry line
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw candles
    const candleWidth = Math.max(8, width / 25);
    const priceRange = entryPrice * 0.1; // 10% range
    
    candles.forEach((candle, index) => {
      const x = (index * candleWidth) + (width - candles.length * candleWidth);
      const isGreen = candle.close >= candle.open;
      
      // Candle body
      const bodyHeight = Math.abs(candle.close - candle.open) / priceRange * height;
      const bodyY = height / 2 - (candle.close - entryPrice) / priceRange * height;
      
      ctx.fillStyle = isGreen ? '#00ff88' : '#ff4444';
      ctx.fillRect(x, bodyY, candleWidth * 0.8, bodyHeight);
      
      // Candle wick
      const wickTop = height / 2 - (candle.high - entryPrice) / priceRange * height;
      const wickBottom = height / 2 - (candle.low - entryPrice) / priceRange * height;
      
      ctx.strokeStyle = isGreen ? '#00ff88' : '#ff4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + candleWidth / 2, wickTop);
      ctx.lineTo(x + candleWidth / 2, wickBottom);
      ctx.stroke();
    });
    
    // Draw current price line
    const currentY = height / 2 - (currentPrice - entryPrice) / priceRange * height;
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(width - 100, currentY);
    ctx.lineTo(width, currentY);
    ctx.stroke();
    
    // Draw price labels
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    ctx.fillText(`ENTRY: $${entryPrice.toFixed(0)}`, 10, 20);
    ctx.fillText(`CURRENT: $${currentPrice.toFixed(0)}`, 10, 40);
    
    if (isComplete) {
      ctx.fillText(`FINAL: $${currentPrice.toFixed(0)}`, 10, 60);
    }
  }, [entryPrice, currentPrice, candles, isComplete]);

  // Generate price path on mount
  const [pricePath, setPricePath] = useState<number[]>([]);
  
  useEffect(() => {
    const path = generatePricePath(rngTrace);
    setPricePath(path);
  }, [generatePricePath, rngTrace]);

  // Start animation
  useEffect(() => {
    if (pricePath.length > 0) {
      animationRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [pricePath, animate]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        className="w-full h-96 bg-gray-900 rounded-lg"
        style={{ imageRendering: 'pixelated' }}
      />
      
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 rounded-b-lg overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-purple-500 to-teal-500 transition-all duration-100"
          style={{ width: `${(Date.now() - (startTimeRef.current || Date.now())) / durationMs * 100}%` }}
        />
      </div>
    </div>
  );
};
