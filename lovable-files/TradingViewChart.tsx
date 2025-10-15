import React, { useEffect, useRef, useState } from 'react';

interface ChartLine {
  id: string;
  type: 'entry' | 'stop_loss' | 'take_profit';
  price: number;
  side: 'LONG' | 'SHORT';
  color: string;
}

interface TradingViewChartProps {
  symbol: string;
  timeframe: string;
  width?: number;
  height?: number;
  autosize?: boolean;
  chartLines?: ChartLine[];
}

// TradingView timeframe mapping
const timeframeMap: { [key: string]: string } = {
  '5s': '5S',
  '15s': '15S', 
  '30s': '30S',
  '1m': '1',
  '5m': '5',
  '15m': '15',
  '30m': '30',
  '1h': '60',
  '4h': '240',
  '1d': '1D'
};

// Symbol mapping for TradingView
const symbolMap: { [key: string]: string } = {
  'BTC': 'BINANCE:BTCUSDT',
  'ETH': 'BINANCE:ETHUSDT',
  'SOL': 'BINANCE:SOLUSDT',
  'ASTER': 'GATEIO:ASTERUSDT',
  'COAI': 'GATEIO:COAIUSDT',
  'SUI': 'BINANCE:SUIUSDT'
};

export const TradingViewChart: React.FC<TradingViewChartProps> = ({
  symbol,
  timeframe,
  width = 2000,
  height = 800,
  autosize = true,
  chartLines = []
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load TradingView script if not already loaded
    const loadTradingViewScript = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.TradingView) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load TradingView script'));
        document.head.appendChild(script);
      });
    };

    const initializeChart = async () => {
      try {
        await loadTradingViewScript();
        
        if (!containerRef.current || !window.TradingView) return;

        // Clear previous chart
        containerRef.current.innerHTML = '';

        const tvTimeframe = timeframeMap[timeframe] || '1';
        const tvSymbol = symbolMap[symbol] || 'BINANCE:BTCUSDT';

        const widget = new window.TradingView.widget({
          autosize: autosize,
          symbol: tvSymbol,
          interval: tvTimeframe,
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#1e1e1e',
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          container_id: containerRef.current.id,
          studies: [
            'Volume@tv-basicstudies',
            'RSI@tv-basicstudies',
            'MACD@tv-basicstudies',
            'EMA@tv-basicstudies'
          ],
          overrides: {
            'paneProperties.background': '#0d1117',
            'paneProperties.vertGridProperties.color': '#21262d',
            'paneProperties.horzGridProperties.color': '#21262d',
            'symbolWatermarkProperties.transparency': 90,
            'scalesProperties.textColor': '#8b949e',
            'mainSeriesProperties.candleStyle.upColor': '#00d4aa',
            'mainSeriesProperties.candleStyle.downColor': '#ff6b6b',
            'mainSeriesProperties.candleStyle.borderUpColor': '#00d4aa',
            'mainSeriesProperties.candleStyle.borderDownColor': '#ff6b6b',
            'mainSeriesProperties.candleStyle.wickUpColor': '#00d4aa',
            'mainSeriesProperties.candleStyle.wickDownColor': '#ff6b6b'
          },
          width: autosize ? undefined : width,
          height: autosize ? undefined : height
        });

        // Add chart lines after widget is ready
        widget.onChartReady(() => {
          const chart = widget.chart();
          chartLines.forEach(line => {
            const lineStyle = line.type === 'entry' ? 0 : (line.type === 'stop_loss' ? 1 : 2);
            chart.createShape(
              { time: Date.now() / 1000, price: line.price },
              {
                shape: 'horizontal_line',
                text: `${line.type.toUpperCase()} ${line.price.toFixed(4)}`,
                overrides: {
                  linecolor: line.color,
                  linestyle: lineStyle,
                  linewidth: 2,
                  textcolor: line.color,
                  fontsize: 12
                }
              }
            );
          });
        });

        setIsLoaded(true);
        console.log(`✅ TradingView chart loaded: ${symbol} ${timeframe}`);
      } catch (error) {
        console.error('Failed to initialize TradingView chart:', error);
      }
    };

    initializeChart();
  }, [symbol, timeframe, width, height, autosize]);

  return (
    <div className="w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      <div
        ref={containerRef}
        id={`tradingview_${symbol}_${timeframe}`}
        className="w-full h-full"
        style={{ minHeight: height }}
      />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-2"></div>
            <div>Loading TradingView Chart...</div>
          </div>
        </div>
      )}
    </div>
  );
};

// Extend Window interface for TradingView
declare global {
  interface Window {
    TradingView: any;
  }
}
