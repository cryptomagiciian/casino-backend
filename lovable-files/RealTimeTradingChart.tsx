import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiService } from './api';

interface CandlestickData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface RealTimeTradingChartProps {
  symbol: string;
  timeframe: string;
  onPriceUpdate?: (price: number) => void;
}

export const RealTimeTradingChart: React.FC<RealTimeTradingChartProps> = ({
  symbol,
  timeframe,
  onPriceUpdate
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [candlestickData, setCandlestickData] = useState<CandlestickData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Real-time update interval based on timeframe
  const getUpdateInterval = (tf: string): number => {
    switch (tf) {
      case '5s': return 2000;   // Update every 2 seconds for 5s candles
      case '15s': return 3000;  // Update every 3 seconds for 15s candles
      case '30s': return 5000;  // Update every 5 seconds for 30s candles
      case '1m': return 10000;  // Update every 10 seconds for 1m candles
      default: return 5000;     // Default 5 seconds
    }
  };

  // Fetch candlestick data with optimized caching
  const fetchCandlestickData = useCallback(async () => {
    try {
      const startTime = performance.now();
      const data = await apiService.getCandlestickData(symbol, timeframe, 50); // Reduced to 50 for faster response
      const endTime = performance.now();
      
      console.log(`⚡ Candlestick data fetched in ${(endTime - startTime).toFixed(2)}ms`);
      
      if (data && Array.isArray(data) && data.length > 0) {
        setCandlestickData(data);
        const latestPrice = data[data.length - 1].close;
        setCurrentPrice(latestPrice);
        onPriceUpdate?.(latestPrice);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to fetch candlestick data:', err);
      setError('Failed to load chart data');
    }
  }, [symbol, timeframe, onPriceUpdate]);

  // Initial data load
  useEffect(() => {
    setLoading(true);
    fetchCandlestickData().finally(() => setLoading(false));
  }, [fetchCandlestickData]);

  // Real-time updates
  useEffect(() => {
    const interval = setInterval(fetchCandlestickData, getUpdateInterval(timeframe));
    return () => clearInterval(interval);
  }, [fetchCandlestickData, timeframe]);

  // Render candlestick chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candlestickData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Calculate price range
    const prices = candlestickData.flatMap(c => [c.high, c.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const padding = priceRange * 0.1;

    // Calculate dimensions
    const chartWidth = rect.width - 60;
    const chartHeight = rect.height - 40;
    const chartX = 50;
    const chartY = 20;

    // Draw grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = chartY + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(chartX, y);
      ctx.lineTo(chartX + chartWidth, y);
      ctx.stroke();
    }

    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = chartX + (chartWidth / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, chartY);
      ctx.lineTo(x, chartY + chartHeight);
      ctx.stroke();
    }

    // Draw candlesticks
    const candleWidth = Math.max(2, chartWidth / candlestickData.length - 1);
    
    candlestickData.forEach((candle, index) => {
      const x = chartX + (chartWidth / candlestickData.length) * index;
      const isGreen = candle.close > candle.open; // Green for upward movement (close > open)
      
      // Calculate Y positions
      const highY = chartY + chartHeight - ((candle.high - minPrice + padding) / (priceRange + padding * 2)) * chartHeight;
      const lowY = chartY + chartHeight - ((candle.low - minPrice + padding) / (priceRange + padding * 2)) * chartHeight;
      const openY = chartY + chartHeight - ((candle.open - minPrice + padding) / (priceRange + padding * 2)) * chartHeight;
      const closeY = chartY + chartHeight - ((candle.close - minPrice + padding) / (priceRange + padding * 2)) * chartHeight;

      // Draw wick
      ctx.strokeStyle = isGreen ? '#10b981' : '#ef4444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Draw body
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.abs(closeY - openY);
      
      if (bodyHeight > 0) {
        ctx.fillStyle = isGreen ? '#10b981' : '#ef4444';
        ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
      } else {
        // Doji
        ctx.strokeStyle = isGreen ? '#10b981' : '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - candleWidth / 2, openY);
        ctx.lineTo(x + candleWidth / 2, openY);
        ctx.stroke();
      }
    });

    // Draw current price line
    if (currentPrice > 0) {
      const priceY = chartY + chartHeight - ((currentPrice - minPrice + padding) / (priceRange + padding * 2)) * chartHeight;
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(chartX, priceY);
      ctx.lineTo(chartX + chartWidth, priceY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw price labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 5; i++) {
      const price = maxPrice - (priceRange / 5) * i;
      const y = chartY + (chartHeight / 5) * i;
      ctx.fillText(price.toFixed(2), chartX - 10, y + 4);
    }

  }, [candlestickData, currentPrice]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <div className="text-slate-400">Loading chart...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900">
        <div className="text-center text-red-400">
          <div className="text-lg mb-2">⚠️</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-slate-900 relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ imageRendering: 'pixelated' }}
      />
      
      {/* Real-time indicator */}
      <div className="absolute top-2 right-2 flex items-center space-x-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-xs text-slate-400">LIVE</span>
      </div>
      
      {/* Current price display */}
      {currentPrice > 0 && (
        <div className="absolute top-2 left-2 bg-slate-800 px-3 py-1 rounded">
          <div className="text-sm text-slate-300">{symbol}</div>
          <div className="text-lg font-mono text-white">${currentPrice.toFixed(4)}</div>
        </div>
      )}
    </div>
  );
};
