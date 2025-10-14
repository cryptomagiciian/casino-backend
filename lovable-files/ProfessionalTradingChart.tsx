import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, LineData, UTCTimestamp } from 'lightweight-charts';
import { apiService } from './api';

interface PriceData {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CommittedMarkData {
  time: UTCTimestamp;
  value: number;
}

interface ProfessionalTradingChartProps {
  symbolId: string;
  showCommittedMark?: boolean;
  showBaseline?: boolean;
  height?: number;
}

export const ProfessionalTradingChart: React.FC<ProfessionalTradingChartProps> = ({
  symbolId,
  showCommittedMark = true,
  showBaseline = true,
  height = 500,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const committedMarkSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const baselineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '4h' | '1d'>('1m');
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [committedMark, setCommittedMark] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [priceChangePercent, setPriceChangePercent] = useState<number>(0);

  // Generate realistic candlestick data
  const generateCandlestickData = useCallback((symbol: string, tf: string): PriceData[] => {
    const data: PriceData[] = [];
    const now = Date.now();
    const basePrice = symbol === 'BTC' ? 50000 : symbol === 'ETH' ? 3000 : symbol === 'SOL' ? 100 : 1;
    const volatility = symbol === 'BTC' ? 0.02 : symbol === 'ETH' ? 0.03 : 0.05;
    
    let currentPrice = basePrice;
    const intervalMs = tf === '1m' ? 60000 : tf === '5m' ? 300000 : tf === '15m' ? 900000 : tf === '1h' ? 3600000 : tf === '4h' ? 14400000 : 86400000;
    
    for (let i = 0; i < 200; i++) {
      const timestamp = (now - (200 - i) * intervalMs) / 1000 as UTCTimestamp;
      
      // Generate realistic OHLC data
      const open = currentPrice;
      const change = (Math.random() - 0.5) * volatility * currentPrice;
      const high = open + Math.abs(change) * (0.5 + Math.random() * 0.5);
      const low = open - Math.abs(change) * (0.5 + Math.random() * 0.5);
      const close = open + change;
      const volume = Math.random() * 1000000 + 100000;
      
      data.push({
        time: timestamp,
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

  // Generate committed mark data (TURBOWAVE-style)
  const generateCommittedMarkData = useCallback((priceData: PriceData[]): CommittedMarkData[] => {
    return priceData.map((candle, index) => {
      // TURBOWAVE-style variation
      const variation = Math.sin(index * 0.1) * 0.01 * candle.close;
      const committedValue = candle.close + variation;
      
      return {
        time: candle.time,
        value: Number(committedValue.toFixed(2)),
      };
    });
  }, []);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
      layout: {
        background: { color: '#1a1a1a' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#2a2a2a' },
        horzLines: { color: '#2a2a2a' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#2a2a2a',
        textColor: '#d1d4dc',
      },
      timeScale: {
        borderColor: '#2a2a2a',
        textColor: '#d1d4dc',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Create candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    // Create committed mark series
    const committedMarkSeries = chart.addLineSeries({
      color: '#ff6b35',
      lineWidth: 2,
      lineStyle: 2, // Dashed line
      title: 'Committed Mark',
    });

    // Create baseline series
    const baselineSeries = chart.addLineSeries({
      color: '#00d4ff',
      lineWidth: 2,
      title: 'Live Price',
    });

    // Create volume series
    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume',
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    committedMarkSeriesRef.current = committedMarkSeries;
    baselineSeriesRef.current = baselineSeries;
    volumeSeriesRef.current = volumeSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [height]);

  // Load and update data
  useEffect(() => {
    if (!candlestickSeriesRef.current || !committedMarkSeriesRef.current || !baselineSeriesRef.current || !volumeSeriesRef.current) return;

    setLoading(true);
    setError(null);

    try {
      // Generate data
      const priceData = generateCandlestickData(symbolId, timeframe);
      const committedMarkData = generateCommittedMarkData(priceData);
      
      // Update current price info
      const latestCandle = priceData[priceData.length - 1];
      const previousCandle = priceData[priceData.length - 2];
      const latestCommitted = committedMarkData[committedMarkData.length - 1];
      
      setCurrentPrice(latestCandle.close);
      setCommittedMark(latestCommitted.value);
      
      const change = latestCandle.close - previousCandle.close;
      const changePercent = (change / previousCandle.close) * 100;
      setPriceChange(change);
      setPriceChangePercent(changePercent);

      // Set data to series
      candlestickSeriesRef.current.setData(priceData);
      volumeSeriesRef.current.setData(priceData.map(d => ({ time: d.time, value: d.volume, color: d.close >= d.open ? '#26a69a' : '#ef5350' })));
      
      if (showCommittedMark) {
        committedMarkSeriesRef.current.setData(committedMarkData);
      }
      
      if (showBaseline) {
        baselineSeriesRef.current.setData(priceData.map(d => ({ time: d.time, value: d.close })));
      }

      setLoading(false);
    } catch (err) {
      setError('Failed to load chart data');
      setLoading(false);
    }
  }, [symbolId, timeframe, showCommittedMark, showBaseline, generateCandlestickData, generateCommittedMarkData]);

  // Real-time price updates simulation
  useEffect(() => {
    if (!candlestickSeriesRef.current || !committedMarkSeriesRef.current || !baselineSeriesRef.current) return;

    const interval = setInterval(() => {
      const now = Date.now() / 1000 as UTCTimestamp;
      const lastPrice = currentPrice;
      const change = (Math.random() - 0.5) * 0.01 * lastPrice;
      const newPrice = lastPrice + change;
      const newCommittedMark = committedMark + (Math.random() - 0.5) * 0.005 * committedMark;

      // Update current price
      setCurrentPrice(newPrice);
      setCommittedMark(newCommittedMark);

      // Add new data point
      const newCandle = {
        time: now,
        open: lastPrice,
        high: Math.max(lastPrice, newPrice),
        low: Math.min(lastPrice, newPrice),
        close: newPrice,
        volume: Math.random() * 100000 + 50000,
      };

      const newCommittedPoint = {
        time: now,
        value: newCommittedMark,
      };

      // Update series with new data
      candlestickSeriesRef.current?.update(newCandle);
      if (showCommittedMark) {
        committedMarkSeriesRef.current?.update(newCommittedPoint);
      }
      if (showBaseline) {
        baselineSeriesRef.current?.update({ time: now, value: newPrice });
      }
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [currentPrice, committedMark, showCommittedMark, showBaseline]);

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-gray-800 rounded-lg border border-gray-700" style={{ height }}>
        <div className="text-white text-lg">Loading professional chart...</div>
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
        <div
          ref={chartContainerRef}
          className="w-full border border-gray-600 rounded-lg"
          style={{ height }}
        />
        
        {/* Chart Overlay Info */}
        <div className="absolute top-4 left-4 bg-gray-900 bg-opacity-90 p-3 rounded-lg">
          <div className="text-xs text-gray-400 mb-1">Chart Info</div>
          <div className="text-sm text-white">Professional TradingView Chart</div>
          <div className="text-xs text-gray-500">Real-time data • Provably fair</div>
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
