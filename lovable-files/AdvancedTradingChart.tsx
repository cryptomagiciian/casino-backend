import React, { useEffect, useRef, useState, useCallback } from 'react';

interface CandlestickData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface AdvancedTradingChartProps {
  symbolId: string;
  showCommittedMark?: boolean;
  showBaseline?: boolean;
  height?: number;
}

export const AdvancedTradingChart: React.FC<AdvancedTradingChartProps> = ({
  symbolId,
  showCommittedMark = true,
  showBaseline = true,
  height = 500,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '4h' | '1d'>('1m');
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [committedMark, setCommittedMark] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [priceChangePercent, setPriceChangePercent] = useState<number>(0);
  const [candlestickData, setCandlestickData] = useState<CandlestickData[]>([]);
  const [committedMarkData, setCommittedMarkData] = useState<{timestamp: number, value: number}[]>([]);
  const [hoveredCandle, setHoveredCandle] = useState<CandlestickData | null>(null);
  const [mousePosition, setMousePosition] = useState<{x: number, y: number} | null>(null);

  // Generate realistic candlestick data
  const generateCandlestickData = useCallback((symbol: string, tf: string): CandlestickData[] => {
    const data: CandlestickData[] = [];
    const now = Date.now();
    const basePrice = symbol === 'BTC' ? 50000 : symbol === 'ETH' ? 3000 : symbol === 'SOL' ? 100 : 1;
    const volatility = symbol === 'BTC' ? 0.02 : symbol === 'ETH' ? 0.03 : 0.05;
    
    let currentPrice = basePrice;
    const intervalMs = tf === '1m' ? 60000 : tf === '5m' ? 300000 : tf === '15m' ? 900000 : tf === '1h' ? 3600000 : tf === '4h' ? 14400000 : 86400000;
    
    for (let i = 0; i < 100; i++) {
      const timestamp = now - (100 - i) * intervalMs;
      
      // Generate realistic OHLC data with trend
      const trend = Math.sin(i * 0.1) * 0.01;
      const randomWalk = (Math.random() - 0.5) * volatility;
      const change = trend + randomWalk;
      
      const open = currentPrice;
      const close = open * (1 + change);
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      const volume = Math.random() * 1000000 + 100000;
      
      data.push({
        timestamp,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: Number(volume.toFixed(0)),
      });
      
      currentPrice = close;
    }
    
    return data;
  }, []);

  // Generate committed mark data
  const generateCommittedMarkData = useCallback((priceData: CandlestickData[]) => {
    return priceData.map((candle, index) => {
      const variation = Math.sin(index * 0.1) * 0.01 * candle.close;
      return {
        timestamp: candle.timestamp,
        value: Number((candle.close + variation).toFixed(2)),
      };
    });
  }, []);

  // Load data
  useEffect(() => {
    setLoading(true);
    try {
      const priceData = generateCandlestickData(symbolId, timeframe);
      const committedData = generateCommittedMarkData(priceData);
      
      setCandlestickData(priceData);
      setCommittedMarkData(committedData);
      
      const latest = priceData[priceData.length - 1];
      const previous = priceData[priceData.length - 2];
      const latestCommitted = committedData[committedData.length - 1];
      
      setCurrentPrice(latest.close);
      setCommittedMark(latestCommitted.value);
      
      const change = latest.close - previous.close;
      const changePercent = (change / previous.close) * 100;
      setPriceChange(change);
      setPriceChangePercent(changePercent);
      
      setLoading(false);
    } catch (err) {
      setError('Failed to load chart data');
      setLoading(false);
    }
  }, [symbolId, timeframe, generateCandlestickData, generateCommittedMarkData]);

  // Draw chart
  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || candlestickData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, height);

    // Chart dimensions
    const padding = { top: 20, right: 80, bottom: 60, left: 80 };
    const chartWidth = rect.width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Find price range
    const allPrices = [...candlestickData.map(d => [d.high, d.low]).flat(), ...committedMarkData.map(d => d.value)];
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = maxPrice - minPrice;
    const pricePadding = priceRange * 0.1;

    // Draw grid
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 10; i++) {
      const y = padding.top + (chartHeight / 10) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();
    }
    
    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = padding.left + (chartWidth / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, padding.top + chartHeight);
      ctx.stroke();
    }

    // Draw candlesticks
    const candleWidth = Math.max(2, chartWidth / candlestickData.length - 2);
    
    candlestickData.forEach((candle, index) => {
      const x = padding.left + (chartWidth / (candlestickData.length - 1)) * index;
      const isBullish = candle.close >= candle.open;
      
      // High-Low line
      ctx.strokeStyle = isBullish ? '#26a69a' : '#ef5350';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, padding.top + chartHeight - ((candle.high - minPrice + pricePadding) / (priceRange + pricePadding * 2)) * chartHeight);
      ctx.lineTo(x, padding.top + chartHeight - ((candle.low - minPrice + pricePadding) / (priceRange + pricePadding * 2)) * chartHeight);
      ctx.stroke();
      
      // Body
      const bodyTop = Math.max(candle.open, candle.close);
      const bodyBottom = Math.min(candle.open, candle.close);
      const bodyHeight = Math.abs(candle.close - candle.open);
      
      if (bodyHeight > 0) {
        ctx.fillStyle = isBullish ? '#26a69a' : '#ef5350';
        ctx.fillRect(
          x - candleWidth / 2,
          padding.top + chartHeight - ((bodyTop - minPrice + pricePadding) / (priceRange + pricePadding * 2)) * chartHeight,
          candleWidth,
          (bodyHeight / (priceRange + pricePadding * 2)) * chartHeight
        );
      } else {
        // Doji
        ctx.strokeStyle = isBullish ? '#26a69a' : '#ef5350';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - candleWidth / 2, padding.top + chartHeight - ((candle.close - minPrice + pricePadding) / (priceRange + pricePadding * 2)) * chartHeight);
        ctx.lineTo(x + candleWidth / 2, padding.top + chartHeight - ((candle.close - minPrice + pricePadding) / (priceRange + pricePadding * 2)) * chartHeight);
        ctx.stroke();
      }
    });

    // Draw committed mark line
    if (showCommittedMark && committedMarkData.length > 0) {
      ctx.strokeStyle = '#ff6b35';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      
      committedMarkData.forEach((point, index) => {
        const x = padding.left + (chartWidth / (committedMarkData.length - 1)) * index;
        const y = padding.top + chartHeight - ((point.value - minPrice + pricePadding) / (priceRange + pricePadding * 2)) * chartHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw baseline (close prices)
    if (showBaseline) {
      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      candlestickData.forEach((candle, index) => {
        const x = padding.left + (chartWidth / (candlestickData.length - 1)) * index;
        const y = padding.top + chartHeight - ((candle.close - minPrice + pricePadding) / (priceRange + pricePadding * 2)) * chartHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
    }

    // Draw price labels
    ctx.fillStyle = '#d1d4dc';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 10; i++) {
      const price = maxPrice - (priceRange / 10) * i;
      const y = padding.top + (chartHeight / 10) * i;
      ctx.fillText(`$${price.toFixed(0)}`, padding.left - 10, y + 4);
    }

    // Draw time labels
    ctx.textAlign = 'center';
    for (let i = 0; i <= 5; i++) {
      const index = Math.floor((candlestickData.length - 1) * i / 5);
      const candle = candlestickData[index];
      const x = padding.left + (chartWidth / (candlestickData.length - 1)) * index;
      const date = new Date(candle.timestamp);
      const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      ctx.fillText(timeStr, x, padding.top + chartHeight + 20);
    }

    // Draw hover crosshair
    if (mousePosition && hoveredCandle) {
      const index = candlestickData.indexOf(hoveredCandle);
      const x = padding.left + (chartWidth / (candlestickData.length - 1)) * index;
      
      // Vertical line
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, padding.top + chartHeight);
      ctx.stroke();
      
      // Horizontal line
      const y = padding.top + chartHeight - ((hoveredCandle.close - minPrice + pricePadding) / (priceRange + pricePadding * 2)) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Tooltip
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(x - 50, y - 80, 100, 60);
      
      ctx.fillStyle = '#fff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`O: $${hoveredCandle.open.toFixed(2)}`, x, y - 50);
      ctx.fillText(`H: $${hoveredCandle.high.toFixed(2)}`, x, y - 35);
      ctx.fillText(`L: $${hoveredCandle.low.toFixed(2)}`, x, y - 20);
      ctx.fillText(`C: $${hoveredCandle.close.toFixed(2)}`, x, y - 5);
    }

  }, [candlestickData, committedMarkData, showCommittedMark, showBaseline, height, mousePosition, hoveredCandle]);

  // Handle mouse events
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || candlestickData.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePosition({ x, y });
    
    // Find closest candle
    const padding = { left: 80, right: 80 };
    const chartWidth = rect.width - padding.left - padding.right;
    const candleIndex = Math.round(((x - padding.left) / chartWidth) * (candlestickData.length - 1));
    
    if (candleIndex >= 0 && candleIndex < candlestickData.length) {
      setHoveredCandle(candlestickData[candleIndex]);
    }
  }, [candlestickData]);

  const handleMouseLeave = useCallback(() => {
    setMousePosition(null);
    setHoveredCandle(null);
  }, []);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      drawChart();
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [drawChart]);

  // Real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCandlestickData(prev => {
        const newData = [...prev];
        const lastCandle = newData[newData.length - 1];
        const now = Date.now();
        
        // Add new candle every minute
        if (now - lastCandle.timestamp >= 60000) {
          const change = (Math.random() - 0.5) * 0.01 * lastCandle.close;
          const newClose = lastCandle.close + change;
          const newHigh = Math.max(lastCandle.close, newClose) * (1 + Math.random() * 0.005);
          const newLow = Math.min(lastCandle.close, newClose) * (1 - Math.random() * 0.005);
          
          newData.push({
            timestamp: now,
            open: lastCandle.close,
            high: Number(newHigh.toFixed(2)),
            low: Number(newLow.toFixed(2)),
            close: Number(newClose.toFixed(2)),
            volume: Math.random() * 1000000 + 100000,
          });
          
          // Keep only last 100 candles
          if (newData.length > 100) {
            newData.shift();
          }
        } else {
          // Update current candle
          const change = (Math.random() - 0.5) * 0.001 * lastCandle.close;
          const newClose = lastCandle.close + change;
          const newHigh = Math.max(lastCandle.high, newClose);
          const newLow = Math.min(lastCandle.low, newClose);
          
          newData[newData.length - 1] = {
            ...lastCandle,
            high: Number(newHigh.toFixed(2)),
            low: Number(newLow.toFixed(2)),
            close: Number(newClose.toFixed(2)),
          };
        }
        
        return newData;
      });
      
      setCommittedMarkData(prev => {
        const newData = [...prev];
        const lastMark = newData[newData.length - 1];
        const variation = Math.sin(Date.now() * 0.001) * 0.005 * lastMark.value;
        const newValue = lastMark.value + variation;
        
        newData[newData.length - 1] = {
          timestamp: Date.now(),
          value: Number(newValue.toFixed(2)),
        };
        
        return newData;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-gray-800 rounded-lg border border-gray-700" style={{ height }}>
        <div className="text-white text-lg">Loading advanced chart...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center bg-gray-800 rounded-lg border border-gray-700" style={{ height }}>
        <div className="text-red-400 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
      {/* Chart Controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          {(['1m', '5m', '15m', '1h', '4h', '1d'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                timeframe === tf
                  ? 'bg-cyan-600 text-white shadow-lg'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
        
        <div className="flex items-center space-x-6">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={showBaseline}
              onChange={(e) => setShowBaseline?.(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-cyan-600 focus:ring-cyan-500"
            />
            <span className="text-gray-300">Live Price</span>
          </label>
          
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={showCommittedMark}
              onChange={(e) => setShowCommittedMark?.(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-orange-500 focus:ring-orange-500"
            />
            <span className="text-gray-300">Committed Mark</span>
          </label>
        </div>
      </div>

      {/* Price Display */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-6">
          <div>
            <div className="text-sm text-gray-400">Current Price</div>
            <div className="text-2xl font-bold text-cyan-400">
              ${currentPrice.toFixed(2)}
            </div>
            <div className={`text-sm ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)} ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
            </div>
          </div>
          
          {showCommittedMark && (
            <div>
              <div className="text-sm text-gray-400">Committed Mark</div>
              <div className="text-xl font-semibold text-orange-400">
                ${committedMark.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">
                Diff: ${(currentPrice - committedMark).toFixed(2)}
              </div>
            </div>
          )}
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-400">Symbol</div>
          <div className="text-lg font-semibold text-white">{symbolId}</div>
          <div className="text-sm text-gray-500">Timeframe: {timeframe}</div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full border border-gray-600 rounded-lg cursor-crosshair"
          style={{ height }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        
        {/* Chart Overlay Info */}
        <div className="absolute top-4 left-4 bg-gray-900 bg-opacity-90 p-3 rounded-lg">
          <div className="text-xs text-gray-400 mb-1">Advanced Chart</div>
          <div className="text-sm text-white">Professional TradingView Style</div>
          <div className="text-xs text-gray-500">Real-time • Interactive • Provably fair</div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center space-x-8 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-0.5 bg-cyan-400"></div>
          <span className="text-gray-300">Live Price</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-0.5 bg-orange-400 border-dashed border-t-2 border-orange-400"></div>
          <span className="text-gray-300">Committed Mark</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
          <span className="text-gray-300">Bullish</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
          <span className="text-gray-300">Bearish</span>
        </div>
      </div>
    </div>
  );
};
