import { useState, useEffect } from 'react';

interface TickerCoin {
  symbol: string;
  price: string;
  change24h: string;
  isUp: boolean;
}

export function CryptoTicker() {
  const [coins, setCoins] = useState<TickerCoin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickers();
    const interval = setInterval(fetchTickers, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchTickers = async () => {
    try {
      // Gate.io free API endpoint for tickers
      const response = await fetch('https://api.gateio.ws/api/v4/spot/tickers');
      const data = await response.json();

      // Filter for top coins and stablecoins
      const targetSymbols = [
        'BTC_USDT', 'ETH_USDT', 'SOL_USDT', 'BNB_USDT', 
        'DOGE_USDT', 'PEPE_USDT', 'BONK_USDT', 'WIF_USDT',
        'SHIB_USDT', 'FLOKI_USDT', 'XRP_USDT', 'ADA_USDT'
      ];

      const filteredCoins: TickerCoin[] = data
        .filter((ticker: any) => targetSymbols.includes(ticker.currency_pair))
        .map((ticker: any) => {
          const change = parseFloat(ticker.change_percentage);
          return {
            symbol: ticker.currency_pair.replace('_USDT', ''),
            price: parseFloat(ticker.last).toFixed(ticker.currency_pair.includes('PEPE') || ticker.currency_pair.includes('SHIB') || ticker.currency_pair.includes('BONK') ? 8 : 2),
            change24h: Math.abs(change).toFixed(2) + '%',
            isUp: change >= 0,
          };
        });

      if (filteredCoins.length > 0) {
        setCoins(filteredCoins);
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to fetch tickers:', error);
      // Fallback to mock data
      setCoins([
        { symbol: 'BTC', price: '97543.21', change24h: '2.34%', isUp: true },
        { symbol: 'ETH', price: '3421.50', change24h: '1.87%', isUp: true },
        { symbol: 'SOL', price: '145.32', change24h: '3.45%', isUp: true },
        { symbol: 'BNB', price: '612.87', change24h: '0.92%', isUp: false },
        { symbol: 'DOGE', price: '0.38', change24h: '5.23%', isUp: true },
        { symbol: 'PEPE', price: '0.00001234', change24h: '12.45%', isUp: true },
        { symbol: 'SHIB', price: '0.00002567', change24h: '4.56%', isUp: true },
        { symbol: 'WIF', price: '2.87', change24h: '8.90%', isUp: true },
      ]);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-gray-900 via-purple-900/30 to-gray-900 border-b border-purple-500/30 py-2 overflow-hidden">
        <div className="text-center text-gray-500 text-sm animate-pulse">
          Loading market data...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-gray-900 via-purple-900/30 to-gray-900 border-b border-purple-500/30 py-2 overflow-hidden relative">
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent animate-shimmer pointer-events-none" />
      
      <div className="ticker-wrapper flex items-center whitespace-nowrap animate-scroll">
        {/* Duplicate coins for seamless loop */}
        {[...coins, ...coins].map((coin, i) => (
          <div
            key={i}
            className="inline-flex items-center gap-2 px-6 py-1 hover:bg-white/5 transition-colors cursor-pointer"
          >
            <span className="font-bold text-cyan-400 text-sm">{coin.symbol}</span>
            <span className="text-white font-mono text-sm">${coin.price}</span>
            <span
              className={`text-xs font-medium ${
                coin.isUp ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {coin.isUp ? '▲' : '▼'} {coin.change24h}
            </span>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll {
          animation: scroll 60s linear infinite;
        }

        .ticker-wrapper:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}

