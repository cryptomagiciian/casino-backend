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
          console.log('📨 WebSocket message received:', data);
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

    // Gate.io WebSocket API format for candlesticks
    const subscription = {
      time: Math.floor(Date.now() / 1000),
      channel: 'spot.candlesticks',
      event: 'subscribe',
      payload: [this.timeframe, `${this.symbol}_USDT`]
    };

    this.ws.send(JSON.stringify(subscription));
    console.log(`📊 Subscribed to ${this.symbol}_USDT candlesticks for ${this.timeframe} timeframe`);
  }

  private handleMessage(data: any): void {
    if (data.channel === 'spot.candlesticks' && data.event === 'update') {
      // Handle candlestick updates from Gate.io
      this.processCandlestickUpdate(data);
    } else if (data.channel === 'spot.candlesticks' && data.event === 'subscribe' && data.result) {
      console.log(`✅ Successfully subscribed to ${this.symbol}_USDT candlesticks`);
    } else if (data.error) {
      console.error('WebSocket subscription error:', data.error);
      this.onError?.(new Error(`Subscription failed: ${data.error.message || 'Unknown error'}`));
    }
  }

  private processCandlestickUpdate(data: any): void {
    console.log('🔍 Processing candlestick update:', data);
    
    // Gate.io candlestick data format: [timestamp, volume, close, high, low, open]
    const candlestickData = data.result;
    console.log('📊 Candlestick data:', candlestickData);
    
    if (!candlestickData) {
      console.warn('⚠️ No candlestick data in result');
      return;
    }

    // Handle different data structures
    let candles: any[] = [];
    
    if (Array.isArray(candlestickData)) {
      candles = candlestickData;
    } else if (candlestickData.c && Array.isArray(candlestickData.c)) {
      // Handle object with candlestick array
      candles = candlestickData.c;
    } else if (typeof candlestickData === 'object') {
      // Handle single candlestick object
      candles = [candlestickData];
    }

    console.log('🕯️ Processing candles:', candles);

    candles.forEach((candle: any, index: number) => {
      console.log(`🕯️ Processing candle ${index}:`, candle);
      
      let candlestick: CandlestickData | null = null;
      
      // Handle array format: [timestamp, volume, close, high, low, open]
      if (Array.isArray(candle) && candle.length >= 6) {
        const timestamp = parseInt(candle[0]) * 1000;
        const volume = parseFloat(candle[1]);
        const close = parseFloat(candle[2]);
        const high = parseFloat(candle[3]);
        const low = parseFloat(candle[4]);
        const open = parseFloat(candle[5]);
        
        // Validate all values are finite numbers
        if (isFinite(timestamp) && isFinite(volume) && isFinite(close) && isFinite(high) && isFinite(low) && isFinite(open) &&
            timestamp > 0 && volume >= 0 && close > 0 && high > 0 && low > 0 && open > 0) {
          candlestick = {
            timestamp,
            volume,
            close,
            high,
            low,
            open
          };
        } else {
          console.warn('⚠️ Invalid candlestick values:', { timestamp, volume, close, high, low, open });
        }
      }
      // Handle object format: {t: timestamp, v: volume, c: close, h: high, l: low, o: open}
      else if (typeof candle === 'object' && candle.t && candle.v && candle.c && candle.h && candle.l && candle.o) {
        const timestamp = parseInt(candle.t) * 1000;
        const volume = parseFloat(candle.v);
        const close = parseFloat(candle.c);
        const high = parseFloat(candle.h);
        const low = parseFloat(candle.l);
        const open = parseFloat(candle.o);
        
        // Validate all values are finite numbers
        if (isFinite(timestamp) && isFinite(volume) && isFinite(close) && isFinite(high) && isFinite(low) && isFinite(open) &&
            timestamp > 0 && volume >= 0 && close > 0 && high > 0 && low > 0 && open > 0) {
          candlestick = {
            timestamp,
            volume,
            close,
            high,
            low,
            open
          };
        } else {
          console.warn('⚠️ Invalid candlestick values:', { timestamp, volume, close, high, low, open });
        }
      }
      
      if (candlestick) {
        console.log('✅ Parsed candlestick:', candlestick);

        // Check if this is a new candle (different timestamp)
        if (this.lastCandleTime !== candlestick.timestamp) {
          // Save previous candle if it exists
          if (this.currentCandle) {
            console.log('🔄 Creating new candle, saving previous:', this.currentCandle);
            this.onNewCandle(this.currentCandle);
          }

          // Set new current candle
          this.currentCandle = candlestick;
          this.lastCandleTime = candlestick.timestamp;
          console.log('🆕 New candle created:', candlestick);
        } else if (this.currentCandle) {
          // Update current candle with latest data
          console.log('🔄 Updating current candle:', candlestick);
          this.currentCandle = candlestick;
        }

        // Notify of update
        if (this.currentCandle) {
          console.log('📡 Notifying candlestick update:', this.currentCandle);
          this.onCandlestickUpdate(this.currentCandle);
        }
      } else {
        console.warn('⚠️ Invalid candle format:', candle);
      }
    });
  }

  private processTrade(trade: any): void {
    // This method is kept for potential future use with trade data
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
