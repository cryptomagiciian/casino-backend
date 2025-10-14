import React, { useState, useEffect, useRef, useCallback } from 'react';

interface CandlestickData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const DexinoTradingInterface: React.FC = () => {
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
  const [currentPrice, setCurrentPrice] = useState<number>(1.00);
  const [highPrice, setHighPrice] = useState<number>(1.00);
  const [lowPrice, setLowPrice] = useState<number>(1.00);
  const [symbol, setSymbol] = useState<string>('ASTER-USDC');
  const [candlestickData, setCandlestickData] = useState<CandlestickData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Generate realistic candlestick data for ASTER
  const generateCandlestickData = useCallback((symbol: string, tf: string): CandlestickData[] => {
    const data: CandlestickData[] = [];
    const now = Date.now();
    const basePrice = 1.00; // ASTER base price
    const volatility = 0.001; // Low volatility for stablecoin-like behavior
    
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
      const priceData = generateCandlestickData(symbol, timeframe);
      setCandlestickData(priceData);
      
      const latest = priceData[priceData.length - 1];
      setCurrentPrice(latest.close);
      setHighPrice(Math.max(...priceData.map(d => d.high)));
      setLowPrice(Math.min(...priceData.map(d => d.low)));
      
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  }, [symbol, timeframe, generateCandlestickData]);

  // Draw chart with proper grid
  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Draw background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw grid lines
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    const gridSpacing = rect.height / 10;
    for (let i = 0; i <= 10; i++) {
      const y = i * gridSpacing;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(rect.width, y);
      ctx.stroke();
    }
    
    // Vertical grid lines
    const verticalSpacing = rect.width / 20;
    for (let i = 0; i <= 20; i++) {
      const x = i * verticalSpacing;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, rect.height);
      ctx.stroke();
    }

    // Draw price labels on the right
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 10; i++) {
      const price = 1.00; // ASTER price
      const y = i * gridSpacing;
      ctx.fillText(`$${price.toFixed(2)}`, rect.width - 10, y + 4);
    }

    // Draw subtle dots pattern (world map style)
    ctx.fillStyle = '#333333';
    for (let x = 0; x < rect.width; x += 40) {
      for (let y = 0; y < rect.height; y += 40) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

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

      console.log('Placing trade:', {
        symbol,
        side: isLong ? 'LONG' : 'SHORT',
        wager: wagerAmount,
        multiplier,
        currentPrice,
      });

      alert(`Trade placed: ${isLong ? 'LONG' : 'SHORT'} ${symbol} at ${multiplier}x leverage for $${wagerAmount}`);
      
    } catch (err: any) {
      alert(`Failed to place trade: ${err.message}`);
    }
  };

  // Quick wager buttons
  const handleQuickWager = (percentage: number) => {
    const amount = (availableBalance * percentage / 100).toFixed(2);
    setWager(amount);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Top Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <div className="text-2xl font-bold text-white">DEXINO</div>
            <nav className="flex space-x-6">
              <a href="#" className="text-gray-300 hover:text-white">Home</a>
              <a href="#" className="text-gray-300 hover:text-white">Games</a>
              <a href="#" className="text-gray-300 hover:text-white">Leaderboard</a>
              <a href="#" className="text-gray-300 hover:text-white">Account</a>
              <a href="#" className="text-gray-300 hover:text-white">Fairness</a>
            </nav>
          </div>
          
          {/* Right side - Status, Balance, Actions */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4">
              <span className="text-gray-400">• Live</span>
              <span className="text-orange-400">• Demo</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-white font-semibold">$6948.00</span>
            </div>
            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm">
                ↑ Withdraw
              </button>
              <button className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm">
                ✓ Deposit
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <button className="p-2 text-gray-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 1 0-15 0v5h5l-5 5-5-5h5V7a7.5 7.5 0 1 1 15 0v10z" />
                </svg>
              </button>
              <button className="p-2 text-gray-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
              <button className="p-2 text-gray-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 p-6">
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search games..."
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
            />
          </div>
          
          <nav className="space-y-2">
            <a href="#" className="block p-3 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg">Home</a>
            <a href="#" className="block p-3 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg">Games</a>
            <a href="#" className="block p-3 text-green-400 bg-green-400 bg-opacity-10 rounded-lg font-semibold">
              🚀 1000x Degen Trading
            </a>
            <a href="#" className="block p-3 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg">Leaderboard</a>
            <a href="#" className="block p-3 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg">Fairness</a>
            <a href="#" className="block p-3 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg">Account</a>
          </nav>
          
          <div className="mt-8">
            <div className="text-sm text-gray-400 mb-2">MORE</div>
            <a href="#" className="block p-3 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg">Live Support</a>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex">
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
                placeholder="1"
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
              {isLong ? 'LONG' : 'SHORT'} {symbol}
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
                  {symbol} • {symbol}
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
      </div>
    </div>
  );
};
