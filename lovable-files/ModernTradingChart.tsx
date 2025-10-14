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

interface ModernTradingChartProps {
  symbol: string;
  timeframe: string;
  onPriceUpdate?: (price: number) => void;
}

export const ModernTradingChart: React.FC<ModernTradingChartProps> = ({
  symbol,
  timeframe,
  onPriceUpdate
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [candlestickData, setCandlestickData] = useState<CandlestickData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showIndicators, setShowIndicators] = useState<boolean>(false);
  const [selectedTool, setSelectedTool] = useState<string>('select');
  const [drawingMode, setDrawingMode] = useState<boolean>(false);
  
  // Chart state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<number>(0);
  const [hoveredCandle, setHoveredCandle] = useState<number>(-1);

  // Real-time update interval
  const getUpdateInterval = (tf: string): number => {
    switch (tf) {
      case '5s': return 2000;
      case '15s': return 3000;
      case '30s': return 5000;
      case '1m': return 10000;
      default: return 5000;
    }
  };

  // Fetch candlestick data
  const fetchCandlestickData = useCallback(async () => {
    try {
      const startTime = performance.now();
      const data = await apiService.getCandlestickData(symbol, timeframe, 100);
      const endTime = performance.now();
      
      console.log(`⚡ Chart data fetched in ${(endTime - startTime).toFixed(2)}ms`);
      
      if (data && Array.isArray(data) && data.length > 0) {
        setCandlestickData(data);
        const latestPrice = data[data.length - 1].close;
        setCurrentPrice(latestPrice);
        onPriceUpdate?.(latestPrice);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to fetch chart data:', err);
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

  // Calculate moving averages
  const calculateMA = (data: CandlestickData[], period: number): number[] => {
    const ma: number[] = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        ma.push(0);
      } else {
        const sum = data.slice(i - period + 1, i + 1).reduce((acc, candle) => acc + candle.close, 0);
        ma.push(sum / period);
      }
    }
    return ma;
  };

  // Render modern chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candlestickData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Modern dark theme
    const colors = {
      background: '#0a0a0a',
      grid: '#1a1a1a',
      text: '#ffffff',
      textSecondary: '#888888',
      bullish: '#00d4aa',
      bearish: '#ff6b6b',
      neutral: '#6366f1',
      accent: '#f59e0b'
    };

    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, rect.height);
    gradient.addColorStop(0, '#0a0a0a');
    gradient.addColorStop(1, '#111111');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Calculate price range
    const prices = candlestickData.flatMap(c => [c.high, c.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const padding = priceRange * 0.05;

    // Chart dimensions
    const chartWidth = rect.width - 80;
    const chartHeight = rect.height - 60;
    const chartX = 60;
    const chartY = 30;

    // Draw modern grid
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 0.5;
    ctx.setLineDash([]);
    
    // Horizontal grid lines
    for (let i = 0; i <= 8; i++) {
      const y = chartY + (chartHeight / 8) * i;
      ctx.beginPath();
      ctx.moveTo(chartX, y);
      ctx.lineTo(chartX + chartWidth, y);
      ctx.stroke();
    }

    // Vertical grid lines
    for (let i = 0; i <= 12; i++) {
      const x = chartX + (chartWidth / 12) * i;
      ctx.beginPath();
      ctx.moveTo(x, chartY);
      ctx.lineTo(x, chartY + chartHeight);
      ctx.stroke();
    }

    // Calculate moving averages if indicators are enabled
    const ma20 = showIndicators ? calculateMA(candlestickData, 20) : [];
    const ma50 = showIndicators ? calculateMA(candlestickData, 50) : [];

    // Draw moving averages
    if (showIndicators) {
      // MA20
      ctx.strokeStyle = colors.neutral;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < ma20.length; i++) {
        if (ma20[i] > 0) {
          const x = chartX + (chartWidth / candlestickData.length) * i;
          const y = chartY + chartHeight - ((ma20[i] - minPrice + padding) / (priceRange + padding * 2)) * chartHeight;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // MA50
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < ma50.length; i++) {
        if (ma50[i] > 0) {
          const x = chartX + (chartWidth / candlestickData.length) * i;
          const y = chartY + chartHeight - ((ma50[i] - minPrice + padding) / (priceRange + padding * 2)) * chartHeight;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    // Draw candlesticks with modern styling
    const candleWidth = Math.max(3, chartWidth / candlestickData.length - 2);
    
    candlestickData.forEach((candle, index) => {
      const x = chartX + (chartWidth / candlestickData.length) * index;
      const isGreen = candle.close > candle.open; // Green for upward movement (close > open)
      
      // Calculate Y positions
      const highY = chartY + chartHeight - ((candle.high - minPrice + padding) / (priceRange + padding * 2)) * chartHeight;
      const lowY = chartY + chartHeight - ((candle.low - minPrice + padding) / (priceRange + padding * 2)) * chartHeight;
      const openY = chartY + chartHeight - ((candle.open - minPrice + padding) / (priceRange + padding * 2)) * chartHeight;
      const closeY = chartY + chartHeight - ((candle.close - minPrice + padding) / (priceRange + padding * 2)) * chartHeight;

      // Highlight hovered candle
      if (index === hoveredCandle) {
        ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
        ctx.fillRect(x - candleWidth / 2 - 2, chartY, candleWidth + 4, chartHeight);
      }

      // Draw wick with gradient
      const wickGradient = ctx.createLinearGradient(0, highY, 0, lowY);
      wickGradient.addColorStop(0, isGreen ? colors.bullish : colors.bearish);
      wickGradient.addColorStop(1, isGreen ? colors.bullish : colors.bearish);
      ctx.strokeStyle = wickGradient;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Draw body with modern styling
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.abs(closeY - openY);
      
      if (bodyHeight > 0) {
        // Body gradient
        const bodyGradient = ctx.createLinearGradient(0, bodyTop, 0, bodyTop + bodyHeight);
        bodyGradient.addColorStop(0, isGreen ? colors.bullish : colors.bearish);
        bodyGradient.addColorStop(1, isGreen ? '#00a085' : '#e55555');
        
        ctx.fillStyle = bodyGradient;
        ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
        
        // Body border
        ctx.strokeStyle = isGreen ? colors.bullish : colors.bearish;
        ctx.lineWidth = 1;
        ctx.strokeRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
      } else {
        // Doji with modern styling
        ctx.strokeStyle = isGreen ? colors.bullish : colors.bearish;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - candleWidth / 2, openY);
        ctx.lineTo(x + candleWidth / 2, openY);
        ctx.stroke();
      }
    });

    // Draw current price line with glow effect
    if (currentPrice > 0) {
      const priceY = chartY + chartHeight - ((currentPrice - minPrice + padding) / (priceRange + padding * 2)) * chartHeight;
      
      // Glow effect
      ctx.shadowColor = colors.accent;
      ctx.shadowBlur = 10;
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(chartX, priceY);
      ctx.lineTo(chartX + chartWidth, priceY);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.setLineDash([]);
    }

    // Draw price labels with modern typography
    ctx.fillStyle = colors.textSecondary;
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 8; i++) {
      const price = maxPrice - (priceRange / 8) * i;
      const y = chartY + (chartHeight / 8) * i;
      ctx.fillText(price.toFixed(4), chartX - 10, y + 4);
    }

    // Draw volume bars
    const maxVolume = Math.max(...candlestickData.map(c => c.volume));
    const volumeHeight = 40;
    const volumeY = rect.height - volumeHeight;
    
    candlestickData.forEach((candle, index) => {
      const x = chartX + (chartWidth / candlestickData.length) * index;
      const barHeight = (candle.volume / maxVolume) * volumeHeight;
      const isGreen = candle.close > candle.open; // Green for upward movement (close > open)
      
      ctx.fillStyle = isGreen ? `${colors.bullish}40` : `${colors.bearish}40`;
      ctx.fillRect(x - candleWidth / 2, volumeY + volumeHeight - barHeight, candleWidth, barHeight);
    });

  }, [candlestickData, currentPrice, showIndicators, hoveredCandle]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <div className="text-gray-400 text-lg">Loading chart...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="text-center text-red-400">
          <div className="text-2xl mb-4">⚠️</div>
          <div className="text-lg">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black relative">
      {/* Chart Tools */}
      <div className="absolute top-4 left-4 z-10 flex space-x-2">
        <button
          onClick={() => setSelectedTool('select')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            selectedTool === 'select' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Select
        </button>
        <button
          onClick={() => setSelectedTool('draw')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            selectedTool === 'draw' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Draw
        </button>
        <button
          onClick={() => setShowIndicators(!showIndicators)}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            showIndicators 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          MA
        </button>
      </div>

      {/* Chart */}
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ imageRendering: 'pixelated' }}
      />
      
      {/* Real-time indicator */}
      <div className="absolute top-4 right-4 flex items-center space-x-2 bg-gray-900 px-3 py-2 rounded-lg">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-xs text-gray-300 font-medium">LIVE</span>
      </div>
      
      {/* Current price display */}
      {currentPrice > 0 && (
        <div className="absolute bottom-4 left-4 bg-gray-900 px-4 py-2 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-400">{symbol}</div>
          <div className="text-xl font-mono text-white font-bold">${currentPrice.toFixed(4)}</div>
        </div>
      )}

      {/* Volume indicator */}
      <div className="absolute bottom-4 right-4 bg-gray-900 px-3 py-2 rounded-lg">
        <div className="text-xs text-gray-400">Volume</div>
        <div className="text-sm text-white font-mono">
          {candlestickData.length > 0 ? candlestickData[candlestickData.length - 1].volume.toLocaleString() : '0'}
        </div>
      </div>
    </div>
  );
};
