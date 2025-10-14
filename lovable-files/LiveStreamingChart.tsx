import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WebSocketCandlestickService } from './WebSocketCandlestickService';
import { apiService } from './api';

interface CandlestickData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface LiveStreamingChartProps {
  symbol: string;
  timeframe: string;
  onPriceUpdate?: (price: number) => void;
}

export const LiveStreamingChart: React.FC<LiveStreamingChartProps> = ({
  symbol,
  timeframe,
  onPriceUpdate
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsServiceRef = useRef<WebSocketCandlestickService | null>(null);
  
  // Chart data
  const [candlesticks, setCandlesticks] = useState<CandlestickData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<boolean>(false);
  
  // Chart state
  const [showIndicators, setShowIndicators] = useState<boolean>(false);
  const [selectedTool, setSelectedTool] = useState<string>('select');
  const [hoveredCandle, setHoveredCandle] = useState<number>(-1);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<number>(0);

  // Load initial historical data
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.getCandlestickData(symbol, timeframe, 100);
      
      if (data && Array.isArray(data) && data.length > 0) {
        setCandlesticks(data);
        const latestPrice = data[data.length - 1].close;
        setCurrentPrice(latestPrice);
        onPriceUpdate?.(latestPrice);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
      setError('Failed to load chart data');
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe, onPriceUpdate]);

  // Handle WebSocket candlestick updates
  const handleCandlestickUpdate = useCallback((candlestick: CandlestickData) => {
    setCandlesticks(prev => {
      const newCandlesticks = [...prev];
      
      // Find if this candle already exists
      const existingIndex = newCandlesticks.findIndex(
        c => c.timestamp === candlestick.timestamp
      );
      
      if (existingIndex >= 0) {
        // Update existing candle
        newCandlesticks[existingIndex] = candlestick;
      } else {
        // Add new candle (shouldn't happen in normal flow)
        newCandlesticks.push(candlestick);
      }
      
      // Keep only last 100 candles for performance
      return newCandlesticks.slice(-100);
    });
    
    setCurrentPrice(candlestick.close);
    onPriceUpdate?.(candlestick.close);
  }, [onPriceUpdate]);

  // Handle new candle creation
  const handleNewCandle = useCallback((candlestick: CandlestickData) => {
    setCandlesticks(prev => {
      const newCandlesticks = [...prev, candlestick];
      // Keep only last 100 candles for performance
      return newCandlesticks.slice(-100);
    });
    
    console.log(`🕯️ New candle created: ${symbol} ${timeframe} at ${new Date(candlestick.timestamp).toLocaleTimeString()}`);
  }, [symbol, timeframe]);

  // Handle WebSocket errors
  const handleWebSocketError = useCallback((error: Error) => {
    console.error('WebSocket error:', error);
    setError(`Connection error: ${error.message}`);
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    // Load initial data first
    loadInitialData();
    
    // Create WebSocket service
    wsServiceRef.current = new WebSocketCandlestickService({
      symbol,
      timeframe,
      onCandlestickUpdate: handleCandlestickUpdate,
      onNewCandle: handleNewCandle,
      onError: handleWebSocketError
    });

    // Connect to WebSocket
    wsServiceRef.current.connect();
    
    // Update connection status
    const statusInterval = setInterval(() => {
      if (wsServiceRef.current) {
        setConnectionStatus(wsServiceRef.current.getConnectionStatus());
      }
    }, 1000);

    return () => {
      clearInterval(statusInterval);
      if (wsServiceRef.current) {
        wsServiceRef.current.disconnect();
        wsServiceRef.current = null;
      }
    };
  }, [symbol, timeframe, loadInitialData, handleCandlestickUpdate, handleNewCandle, handleWebSocketError]);

  // Update WebSocket when symbol or timeframe changes
  useEffect(() => {
    if (wsServiceRef.current) {
      wsServiceRef.current.updateSymbol(symbol);
      wsServiceRef.current.updateTimeframe(timeframe);
    }
  }, [symbol, timeframe]);

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

  // Render chart with smooth updates
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candlesticks.length === 0) return;

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
    const prices = candlesticks.flatMap(c => [c.high, c.low]);
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
    const ma20 = showIndicators ? calculateMA(candlesticks, 20) : [];
    const ma50 = showIndicators ? calculateMA(candlesticks, 50) : [];

    // Draw moving averages
    if (showIndicators) {
      // MA20
      ctx.strokeStyle = colors.neutral;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < ma20.length; i++) {
        if (ma20[i] > 0) {
          const x = chartX + (chartWidth / candlesticks.length) * i;
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
          const x = chartX + (chartWidth / candlesticks.length) * i;
          const y = chartY + chartHeight - ((ma50[i] - minPrice + padding) / (priceRange + padding * 2)) * chartHeight;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    // Draw candlesticks with modern styling
    const candleWidth = Math.max(3, chartWidth / candlesticks.length - 2);
    
    candlesticks.forEach((candle, index) => {
      const x = chartX + (chartWidth / candlesticks.length) * index;
      const isGreen = candle.close >= candle.open;
      const isLastCandle = index === candlesticks.length - 1;
      
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

      // Highlight last candle (currently updating)
      if (isLastCandle) {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.05)';
        ctx.fillRect(x - candleWidth / 2 - 1, chartY, candleWidth + 2, chartHeight);
      }

      // Draw wick with gradient
      const wickGradient = ctx.createLinearGradient(0, highY, 0, lowY);
      wickGradient.addColorStop(0, isGreen ? colors.bullish : colors.bearish);
      wickGradient.addColorStop(1, isGreen ? colors.bullish : colors.bearish);
      ctx.strokeStyle = wickGradient;
      ctx.lineWidth = isLastCandle ? 2 : 1.5; // Thicker wick for current candle
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
        
        // Body border (thicker for current candle)
        ctx.strokeStyle = isGreen ? colors.bullish : colors.bearish;
        ctx.lineWidth = isLastCandle ? 2 : 1;
        ctx.strokeRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
      } else {
        // Doji with modern styling
        ctx.strokeStyle = isGreen ? colors.bullish : colors.bearish;
        ctx.lineWidth = isLastCandle ? 3 : 2;
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
    const maxVolume = Math.max(...candlesticks.map(c => c.volume));
    const volumeHeight = 40;
    const volumeY = rect.height - volumeHeight;
    
    candlesticks.forEach((candle, index) => {
      const x = chartX + (chartWidth / candlesticks.length) * index;
      const barHeight = (candle.volume / maxVolume) * volumeHeight;
      const isGreen = candle.close >= candle.open;
      const isLastCandle = index === candlesticks.length - 1;
      
      ctx.fillStyle = isGreen ? `${colors.bullish}40` : `${colors.bearish}40`;
      ctx.fillRect(x - candleWidth / 2, volumeY + volumeHeight - barHeight, candleWidth, barHeight);
      
      // Highlight current candle volume
      if (isLastCandle) {
        ctx.fillStyle = isGreen ? `${colors.bullish}60` : `${colors.bearish}60`;
        ctx.fillRect(x - candleWidth / 2, volumeY + volumeHeight - barHeight, candleWidth, barHeight);
      }
    });

  }, [candlesticks, currentPrice, showIndicators, hoveredCandle]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <div className="text-gray-400 text-lg">Loading live chart...</div>
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
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
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
      
      {/* Connection Status */}
      <div className={`absolute top-4 right-4 flex items-center space-x-2 px-3 py-2 rounded-lg ${
        connectionStatus ? 'bg-green-900/50' : 'bg-red-900/50'
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          connectionStatus ? 'bg-green-500 animate-pulse' : 'bg-red-500'
        }`}></div>
        <span className="text-xs text-gray-300 font-medium">
          {connectionStatus ? 'LIVE' : 'CONNECTING...'}
        </span>
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
          {candlesticks.length > 0 ? candlesticks[candlesticks.length - 1].volume.toLocaleString() : '0'}
        </div>
      </div>
    </div>
  );
};
