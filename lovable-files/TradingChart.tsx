import React, { useState, useEffect, useRef } from 'react';
import { apiService } from './api';

interface PriceData {
  timestamp: number;
  price: number;
  committedMark: number;
  volume?: number;
}

interface TradingChartProps {
  symbolId: string;
  showCommittedMark?: boolean;
  showBaseline?: boolean;
  height?: number;
  setShowCommittedMark?: (show: boolean) => void;
  setShowBaseline?: (show: boolean) => void;
}

export const TradingChart: React.FC<TradingChartProps> = ({
  symbolId,
  showCommittedMark = true,
  showBaseline = true,
  height = 400,
  setShowCommittedMark,
  setShowBaseline,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '4h' | '1d'>('1m');

  // Generate mock price data for demonstration
  const generateMockData = () => {
    const data: PriceData[] = [];
    const now = Date.now();
    const basePrice = 50000; // BTC base price
    
    for (let i = 0; i < 100; i++) {
      const timestamp = now - (100 - i) * 60000; // 1 minute intervals
      const randomWalk = (Math.random() - 0.5) * 1000; // Random walk
      const price = basePrice + randomWalk + (i * 10); // Slight upward trend
      
      // Committed mark with TURBOWAVE-style variation
      const committedVariation = Math.sin(i * 0.1) * 200;
      const committedMark = price + committedVariation;
      
      data.push({
        timestamp,
        price,
        committedMark,
        volume: Math.random() * 1000000,
      });
    }
    
    return data;
  };

  useEffect(() => {
    // For now, use mock data. In production, this would fetch real data
    const mockData = generateMockData();
    setPriceData(mockData);
    setLoading(false);
  }, [symbolId, timeframe]);

  useEffect(() => {
    if (!canvasRef.current || priceData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.offsetWidth, height);

    // Calculate chart dimensions
    const padding = 40;
    const chartWidth = canvas.offsetWidth - padding * 2;
    const chartHeight = height - padding * 2;

    // Find price range
    const prices = priceData.map(d => Math.max(d.price, d.committedMark));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    // Draw grid lines
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();
    }

    // Draw price lines
    if (showBaseline) {
      // Baseline price (live price)
      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      priceData.forEach((point, index) => {
        const x = padding + (chartWidth / (priceData.length - 1)) * index;
        const y = padding + chartHeight - ((point.price - minPrice) / priceRange) * chartHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }

    if (showCommittedMark) {
      // Committed mark (provably-fair price)
      ctx.strokeStyle = '#ff6b35';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      priceData.forEach((point, index) => {
        const x = padding + (chartWidth / (priceData.length - 1)) * index;
        const y = padding + chartHeight - ((point.committedMark - minPrice) / priceRange) * chartHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw price labels
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const price = maxPrice - (priceRange / 5) * i;
      const y = padding + (chartHeight / 5) * i;
      ctx.fillText(`$${price.toFixed(0)}`, padding - 10, y + 4);
    }

    // Draw legend
    ctx.textAlign = 'left';
    ctx.font = '14px Arial';
    
    if (showBaseline) {
      ctx.fillStyle = '#00d4ff';
      ctx.fillRect(padding, 10, 20, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('Live Price', padding + 25, 20);
    }
    
    if (showCommittedMark) {
      ctx.fillStyle = '#ff6b35';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(padding + 150, 10);
      ctx.lineTo(padding + 170, 10);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('Committed Mark', padding + 175, 20);
    }

  }, [priceData, showCommittedMark, showBaseline, height]);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-white">Loading chart...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-red-400">{error}</div>
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
              className={`px-3 py-1 rounded text-sm transition-colors ${
                timeframe === tf
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
        
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={showBaseline}
              onChange={(e) => setShowBaseline?.(e.target.checked)}
              className="rounded"
            />
            <span className="text-gray-300">Live Price</span>
          </label>
          
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={showCommittedMark}
              onChange={(e) => setShowCommittedMark?.(e.target.checked)}
              className="rounded"
            />
            <span className="text-gray-300">Committed Mark</span>
          </label>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full border border-gray-600 rounded"
          style={{ height }}
        />
        
        {/* Current Price Display */}
        {priceData.length > 0 && (
          <div className="absolute top-4 right-4 bg-gray-900 bg-opacity-80 p-3 rounded">
            <div className="text-sm text-gray-400">Current Price</div>
            <div className="text-lg font-bold text-cyan-400">
              ${priceData[priceData.length - 1].price.toFixed(2)}
            </div>
            {showCommittedMark && (
              <div className="text-sm text-orange-400">
                Mark: ${priceData[priceData.length - 1].committedMark.toFixed(2)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chart Info */}
      <div className="mt-4 text-xs text-gray-400">
        <div className="flex justify-between">
          <span>Symbol: {symbolId}</span>
          <span>Timeframe: {timeframe}</span>
          <span>Data Points: {priceData.length}</span>
        </div>
      </div>
    </div>
  );
};
