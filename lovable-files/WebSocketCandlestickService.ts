interface CandlestickData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface WebSocketCandlestickServiceOptions {
  symbol: string;
  timeframe: string;
  onCandlestickUpdate: (candlestick: CandlestickData) => void;
  onNewCandle: (candlestick: CandlestickData) => void;
  onError?: (error: Error) => void;
}

export class WebSocketCandlestickService {
  private ws: WebSocket | null = null;
  private symbol: string;
  private timeframe: string;
  private onCandlestickUpdate: (candlestick: CandlestickData) => void;
  private onNewCandle: (candlestick: CandlestickData) => void;
  private onError?: (error: Error) => void;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnected = false;
  private currentCandle: CandlestickData | null = null;
  private lastCandleTime = 0;

  constructor(options: WebSocketCandlestickServiceOptions) {
    this.symbol = options.symbol;
    this.timeframe = options.timeframe;
    this.onCandlestickUpdate = options.onCandlestickUpdate;
    this.onNewCandle = options.onNewCandle;
    this.onError = options.onError;
  }

  connect(): void {
    try {
      // Gate.io WebSocket endpoint for candlestick data
      const wsUrl = 'wss://api.gateio.ws/ws/v4/';
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('🔌 WebSocket connected to Gate.io');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.subscribeToCandlesticks();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        this.isConnected = false;
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.onError?.(new Error('WebSocket connection failed'));
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.onError?.(new Error('Failed to create WebSocket connection'));
    }
  }

  private subscribeToCandlesticks(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const subscription = {
      id: Date.now(),
      method: 'trades.subscribe',
      params: [`${this.symbol}_USDT`]
    };

    this.ws.send(JSON.stringify(subscription));
    console.log(`📊 Subscribed to ${this.symbol}_USDT trades for ${this.timeframe} timeframe`);
  }

  private handleMessage(data: any): void {
    if (data.method === 'trades.update' && data.params) {
      const trades = data.params[1];
      if (Array.isArray(trades)) {
        trades.forEach(trade => this.processTrade(trade));
      }
    } else if (data.method === 'trades.subscribe' && data.result) {
      console.log(`✅ Successfully subscribed to ${this.symbol}_USDT trades`);
    } else if (data.error) {
      console.error('WebSocket subscription error:', data.error);
      this.onError?.(new Error(`Subscription failed: ${data.error.message || 'Unknown error'}`));
    }
  }

  private processTrade(trade: any): void {
    const price = parseFloat(trade.price);
    const volume = parseFloat(trade.amount);
    const timestamp = parseInt(trade.time) * 1000; // Convert to milliseconds

    // Get current candle interval
    const intervalMs = this.getIntervalMs(this.timeframe);
    const candleStartTime = Math.floor(timestamp / intervalMs) * intervalMs;

    // Check if this is a new candle
    if (this.lastCandleTime !== candleStartTime) {
      // Save previous candle if it exists
      if (this.currentCandle) {
        this.onNewCandle(this.currentCandle);
      }

      // Create new candle
      this.currentCandle = {
        timestamp: candleStartTime,
        open: price,
        high: price,
        low: price,
        close: price,
        volume: volume
      };
      this.lastCandleTime = candleStartTime;
    } else if (this.currentCandle) {
      // Update current candle
      this.currentCandle.high = Math.max(this.currentCandle.high, price);
      this.currentCandle.low = Math.min(this.currentCandle.low, price);
      this.currentCandle.close = price;
      this.currentCandle.volume += volume;
    }

    // Notify of update
    if (this.currentCandle) {
      this.onCandlestickUpdate(this.currentCandle);
    }
  }

  private getIntervalMs(timeframe: string): number {
    const intervals: Record<string, number> = {
      '5s': 5 * 1000,
      '15s': 15 * 1000,
      '30s': 30 * 1000,
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000
    };
    return intervals[timeframe] || 60 * 1000;
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('❌ Max reconnection attempts reached');
      this.onError?.(new Error('Max reconnection attempts reached'));
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.currentCandle = null;
  }

  updateSymbol(newSymbol: string): void {
    if (newSymbol !== this.symbol) {
      this.symbol = newSymbol;
      if (this.isConnected) {
        this.disconnect();
        this.connect();
      }
    }
  }

  updateTimeframe(newTimeframe: string): void {
    if (newTimeframe !== this.timeframe) {
      this.timeframe = newTimeframe;
      // Reset current candle when timeframe changes
      this.currentCandle = null;
      this.lastCandleTime = 0;
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}
