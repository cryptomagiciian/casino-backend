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

interface ProfessionalTradingInterfaceProps {
  symbolId?: string;
}

export const ProfessionalTradingInterface: React.FC<ProfessionalTradingInterfaceProps> = ({
  symbolId = 'BTC',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  
  // Trading state
  const [wager, setWager] = useState<string>('1');
  const [multiplier, setMultiplier] = useState<number>(20);
  const [isLong, setIsLong] = useState<boolean>(true);
  const [tpSlEnabled, setTpSlEnabled] = useState<boolean>(false);
  const [pnlFee, setPnlFee] = useState<boolean>(true);
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  
  // Chart state
  const [timeframe, setTimeframe] = useState<'5s' | '15s' | '30s' | '1m' | '5m' | '15m'>('5s');
  const [currentPrice, setCurrentPrice] = useState<number>(112537.03);
  const [highPrice, setHighPrice] = useState<number>(112579.75);
  const [lowPrice, setLowPrice] = useState<number>(112534.86);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [priceChangePercent, setPriceChangePercent] = useState<number>(0);
  const [candlestickData, setCandlestickData] = useState<CandlestickData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Generate realistic candlestick data
  const generateCandlestickData = useCallback((symbol: string, tf: string): CandlestickData[] => {
    const data: CandlestickData[] = [];
    const now = Date.now();
    const basePrice = symbol === 'BTC' ? 112537 : symbol === 'ETH' ? 3000 : symbol === 'SOL' ? 100 : 1;
    const volatility = 0.001; // Lower volatility for more realistic movement
    
    let currentPrice = basePrice;
    const intervalMs = tf === '5s' ? 5000 : tf === '15s' ? 15000 : tf === '30s' ? 30000 : tf === '1m' ? 60000 : tf === '5m' ? 300000 : 900000;
    
    for (let i = 0; i < 50; i++) {
      const timestamp = now - (50 - i) * intervalMs;
      
      // Generate realistic OHLC data
      const change = (Math.random() - 0.5) * volatility * currentPrice;
      const open = currentPrice;
      const close = open + change;
      const high = Math.max(open, close) * (1 + Math.random() * 0.0005);
      const low = Math.min(open, close) * (1 - Math.random() * 0.0005);
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

  // Load initial data
  useEffect(() => {
    setLoading(true);
    try {
      const priceData = generateCandlestickData(symbolId, timeframe);
      setCandlestickData(priceData);
      
      const latest = priceData[priceData.length - 1];
      setCurrentPrice(latest.close);
      setHighPrice(Math.max(...priceData.map(d => d.high)));
      setLowPrice(Math.min(...priceData.map(d => d.low)));
      
      const previous = priceData[priceData.length - 2];
      const change = latest.close - previous.close;
      const changePercent = (change / previous.close) * 100;
      setPriceChange(change);
      setPriceChangePercent(changePercent);
      
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  }, [symbolId, timeframe, generateCandlestickData]);

  // Draw chart with world map background
  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || candlestickData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Draw world map background (simplified dots pattern)
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, rect.width, rect.height);
    
    // Draw subtle world map dots
    ctx.fillStyle = '#2a2a2a';
    for (let x = 0; x < rect.width; x += 40) {
      for (let y = 0; y < rect.height; y += 40) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // Chart dimensions
    const padding = { top: 20, right: 100, bottom: 40, left: 60 };
    const chartWidth = rect.width - padding.left - padding.right;
    const chartHeight = rect.height - padding.top - padding.bottom;

    // Find price range
    const allPrices = candlestickData.map(d => [d.high, d.low]).flat();
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = maxPrice - minPrice;
    const pricePadding = priceRange * 0.05;

    // Draw grid lines (subtle)
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 0.5;
    
    // Horizontal grid lines
    for (let i = 0; i <= 8; i++) {
      const y = padding.top + (chartHeight / 8) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();
    }

    // Draw candlesticks
    const candleWidth = Math.max(1, chartWidth / candlestickData.length - 1);
    
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

    // Draw current price line
    const currentPriceY = padding.top + chartHeight - ((currentPrice - minPrice + pricePadding) / (priceRange + pricePadding * 2)) * chartHeight;
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(padding.left, currentPriceY);
    ctx.lineTo(padding.left + chartWidth, currentPriceY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw price labels
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 8; i++) {
      const price = maxPrice - (priceRange / 8) * i;
      const y = padding.top + (chartHeight / 8) * i;
      ctx.fillText(`$${price.toFixed(0)}`, padding.left - 10, y + 4);
    }

    // Draw time labels
    ctx.textAlign = 'center';
    ctx.fillStyle = '#888888';
    for (let i = 0; i <= 4; i++) {
      const index = Math.floor((candlestickData.length - 1) * i / 4);
      const candle = candlestickData[index];
      const x = padding.left + (chartWidth / (candlestickData.length - 1)) * index;
      const date = new Date(candle.timestamp);
      const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      ctx.fillText(timeStr, x, padding.top + chartHeight + 20);
    }

    // Draw current price highlight
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(padding.left - 50, currentPriceY - 10, 45, 20);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`$${currentPrice.toFixed(2)}`, padding.left - 27, currentPriceY + 3);

  }, [candlestickData, currentPrice]);

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
        
        // Add new candle based on timeframe
        const intervalMs = timeframe === '5s' ? 5000 : timeframe === '15s' ? 15000 : timeframe === '30s' ? 30000 : timeframe === '1m' ? 60000 : timeframe === '5m' ? 300000 : 900000;
        
        if (now - lastCandle.timestamp >= intervalMs) {
          const change = (Math.random() - 0.5) * 0.001 * lastCandle.close;
          const newClose = lastCandle.close + change;
          const newHigh = Math.max(lastCandle.close, newClose) * (1 + Math.random() * 0.0005);
          const newLow = Math.min(lastCandle.close, newClose) * (1 - Math.random() * 0.0005);
          
          newData.push({
            timestamp: now,
            open: lastCandle.close,
            high: Number(newHigh.toFixed(2)),
            low: Number(newLow.toFixed(2)),
            close: Number(newClose.toFixed(2)),
            volume: Math.random() * 1000000 + 100000,
          });
          
          // Keep only last 50 candles
          if (newData.length > 50) {
            newData.shift();
          }
        } else {
          // Update current candle
          const change = (Math.random() - 0.5) * 0.0005 * lastCandle.close;
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
        
        // Update current price and high/low
        const latest = newData[newData.length - 1];
        setCurrentPrice(latest.close);
        setHighPrice(Math.max(...newData.map(d => d.high)));
        setLowPrice(Math.min(...newData.map(d => d.low)));
        
        return newData;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeframe]);

  // Place trade
  const handlePlaceTrade = async () => {
    try {
      const wagerAmount = parseFloat(wager);
      if (wagerAmount <= 0) {
        alert('Please enter a valid wager amount');
        return;
      }

      if (wagerAmount > availableBalance) {
        alert('Insufficient balance');
        return;
      }

      // Here you would call your trading API
      console.log('Placing trade:', {
        symbol: symbolId,
        side: isLong ? 'LONG' : 'SHORT',
        wager: wagerAmount,
        multiplier,
        currentPrice,
      });

      alert(`Trade placed: ${isLong ? 'LONG' : 'SHORT'} ${symbolId} at ${multiplier}x leverage for $${wagerAmount}`);
      
    } catch (err: any) {
      alert(`Failed to place trade: ${err.message}`);
    }
  };

  // Quick wager buttons
  const handleQuickWager = (percentage: number) => {
    const amount = (availableBalance * percentage / 100).toFixed(2);
    setWager(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-xl">Loading trading interface...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex">
      {/* Left Trading Panel */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 p-6 flex flex-col">
        {/* Available Balance */}
        <div className="mb-6">
          <div className="text-sm text-gray-400 mb-1">Available Balance</div>
          <div className="text-2xl font-bold text-white">${availableBalance.toFixed(2)}</div>
        </div>

        {/* Wager Section */}
        <div className="mb-6">
          <div className="text-sm text-gray-400 mb-2">Wager</div>
          <input
            type="number"
            value={wager}
            onChange={(e) => setWager(e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-lg"
            placeholder="1 USD"
          />
          
          {/* Quick wager buttons */}
          <div className="flex space-x-2 mt-2">
            {[0, 25, 50, 75, 100].map((percentage) => (
              <button
                key={percentage}
                onClick={() => handleQuickWager(percentage)}
                className="flex-1 py-2 px-3 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
              >
                {percentage}%
              </button>
            ))}
          </div>
        </div>

        {/* Payout Multiplier */}
        <div className="mb-6">
          <div className="text-sm text-gray-400 mb-2">PAYOUT MULTIPLIER</div>
          <div className="flex items-center space-x-4">
            <span className="text-xs text-gray-500">x1 Safe</span>
            <input
              type="range"
              min="1"
              max="1000"
              value={multiplier}
              onChange={(e) => setMultiplier(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <span className="text-xs text-gray-500">Wild x1000</span>
          </div>
          <div className="text-center mt-2">
            <span className="text-2xl font-bold text-cyan-400">{multiplier}x</span>
          </div>
        </div>

        {/* TP/SL */}
        <div className="mb-6">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={tpSlEnabled}
              onChange={(e) => setTpSlEnabled(e.target.checked)}
              className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
            />
            <span className="text-white">TP/SL</span>
          </label>
        </div>

        {/* Trade Direction */}
        <div className="mb-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setIsLong(true)}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                isLong
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              LONG
            </button>
            <button
              onClick={() => setIsLong(false)}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                !isLong
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              SHORT
            </button>
          </div>
        </div>

        {/* Place Trade Button */}
        <button
          onClick={handlePlaceTrade}
          className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold text-lg rounded-lg transition-colors mb-6"
        >
          {isLong ? 'LONG' : 'SHORT'} {symbolId}
        </button>

        {/* Fees Section */}
        <div className="mb-4">
          <div className="flex space-x-4 mb-2">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                checked={pnlFee}
                onChange={() => setPnlFee(true)}
                className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 focus:ring-green-500"
              />
              <span className="text-white text-sm">PnL Fee</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                checked={!pnlFee}
                onChange={() => setPnlFee(false)}
                className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 focus:ring-green-500"
              />
              <span className="text-white text-sm">Flat Fee</span>
            </label>
          </div>
          <p className="text-xs text-gray-400">
            A fraction of your profits (if any) is taken when you close the trade
          </p>
        </div>

        {/* SCS Discount */}
        <div className="text-center">
          <span className="text-green-400 text-sm">SCS Discount: Save up to 60%</span>
        </div>
      </div>

      {/* Right Chart Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-400">Avbl ${availableBalance.toFixed(2)}</div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center text-white font-bold text-xs">
                B
              </div>
              <div className="text-2xl font-bold text-green-400">${currentPrice.toFixed(2)}</div>
            </div>
            <div className="text-white">
              {symbolId} • {symbolId === 'BTC' ? 'Bitcoin' : symbolId === 'ETH' ? 'Ethereum' : symbolId}
            </div>
            <div className="text-sm text-gray-400">
              H: ${highPrice.toFixed(2)} • L: ${lowPrice.toFixed(2)}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as any)}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white"
            >
              <option value="5s">5s</option>
              <option value="15s">15s</option>
              <option value="30s">30s</option>
              <option value="1m">1m</option>
              <option value="5m">5m</option>
              <option value="15m">15m</option>
            </select>
            <button className="p-2 text-gray-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button className="p-2 text-gray-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1 relative">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  );
};
