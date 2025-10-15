import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { apiService } from './api';

interface PriceData {
  [symbol: string]: number;
}

interface PriceContextType {
  prices: PriceData;
  isLoading: boolean;
  lastUpdated: Date | null;
  refreshPrices: () => Promise<void>;
}

const PriceContext = createContext<PriceContextType | undefined>(undefined);

export const usePrices = () => {
  const context = useContext(PriceContext);
  if (!context) {
    // Return fallback data if PriceProvider is not available
    console.warn('usePrices used outside PriceProvider, returning fallback data');
    return {
      prices: {
        BTC: 45000,
        ETH: 2500,
        SOL: 100,
        USDC: 1,
        USDT: 1,
        ASTER: 1.46,
        COAI: 0.000123,
        SUI: 2.45,
      },
      isLoading: false,
      lastUpdated: null,
      refreshPrices: async () => {},
    };
  }
  return context;
};

interface PriceProviderProps {
  children: React.ReactNode;
}

export const PriceProvider: React.FC<PriceProviderProps> = ({ children }) => {
  const [prices, setPrices] = useState<PriceData>({
    BTC: 45000,
    ETH: 2500,
    SOL: 100,
    USDC: 1,
    USDT: 1,
    ASTER: 1.46,
    COAI: 0.000123,
    SUI: 2.45,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const lastFetchRef = useRef<number>(0);
  const isFetchingRef = useRef<boolean>(false);

  const refreshPrices = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      console.log('⏳ PriceManager: Already fetching, skipping...');
      return;
    }

    // Debounce: Don't fetch if we've fetched in the last 30 seconds
    const now = Date.now();
    if (now - lastFetchRef.current < 30000) {
      console.log('⏳ PriceManager: Skipping price fetch - too soon since last fetch');
      return;
    }

    try {
      isFetchingRef.current = true;
      setIsLoading(true);
      lastFetchRef.current = now;

      console.log('🔄 PriceManager: Fetching fresh prices...');
      const response = await apiService.getCryptoPrices();
      
      if (response && typeof response === 'object') {
        const newPrices: PriceData = {};
        
        // Handle different response formats
        if (response.prices && Array.isArray(response.prices)) {
          // Format: { prices: [{ symbol: 'BTC', price: '50000' }] }
          response.prices.forEach((price: any) => {
            if (price.symbol && price.price) {
              newPrices[price.symbol] = parseFloat(price.price);
            }
          });
        } else {
          // Format: { BTC: '50000', ETH: '3000' }
          Object.keys(response).forEach(symbol => {
            if (typeof response[symbol] === 'string' || typeof response[symbol] === 'number') {
              newPrices[symbol] = parseFloat(response[symbol].toString());
            }
          });
        }

        setPrices(newPrices);
        setLastUpdated(new Date());
        console.log('✅ PriceManager: Prices updated successfully:', newPrices);
      }
    } catch (error: any) {
      // Handle rate limiting gracefully
      if (error.message?.includes('Too many requests') || error.statusCode === 429) {
        console.log('⏳ PriceManager: Rate limited - will retry later');
        return; // Don't log as error, just skip this update
      }
      console.error('❌ PriceManager: Failed to fetch prices:', error);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    refreshPrices();
    
    // Set up interval for periodic updates (every 60 seconds)
    const interval = setInterval(refreshPrices, 60000);
    
    return () => clearInterval(interval);
  }, [refreshPrices]);

  const contextValue: PriceContextType = {
    prices,
    isLoading,
    lastUpdated,
    refreshPrices,
  };

  return (
    <PriceContext.Provider value={contextValue}>
      {children}
    </PriceContext.Provider>
  );
};
