import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

type CurrencyDisplay = 'crypto' | 'usd';

interface CurrencyContextType {
  displayCurrency: CurrencyDisplay;
  setDisplayCurrency: (currency: CurrencyDisplay) => void;
  usdRates: Record<string, number>;
  setUsdRates: (rates: Record<string, number>) => void;
  convertToUsd: (amount: number, currency: string) => number;
  formatBalance: (amount: number, currency: string) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [displayCurrency, setDisplayCurrency] = useState<CurrencyDisplay>(() => {
    // Initialize from localStorage, default to 'crypto'
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('displayCurrency') as CurrencyDisplay) || 'crypto';
    }
    return 'crypto';
  });

  const [usdRates, setUsdRates] = useState<Record<string, number>>({
    BTC: 45000,
    ETH: 2500,
    SOL: 100,
    USDC: 1,
    USDT: 1,
  });

  useEffect(() => {
    // Persist currency preference to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('displayCurrency', displayCurrency);
    }
  }, [displayCurrency]);

  const convertToUsd = (amount: number, currency: string): number => {
    const rate = usdRates[currency] || 1;
    return amount * rate;
  };

  const formatBalance = (amount: number, currency: string): string => {
    if (displayCurrency === 'usd') {
      const usdAmount = convertToUsd(amount, currency);
      return `$${usdAmount.toFixed(2)}`;
    } else {
      return `${amount.toFixed(2)} ${currency}`;
    }
  };

  return (
    <CurrencyContext.Provider value={{
      displayCurrency,
      setDisplayCurrency,
      usdRates,
      setUsdRates,
      convertToUsd,
      formatBalance,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export const CurrencyToggle: React.FC = () => {
  const { displayCurrency, setDisplayCurrency } = useCurrency();

  const toggleCurrency = () => {
    setDisplayCurrency(displayCurrency === 'crypto' ? 'usd' : 'crypto');
  };

  return (
    <button
      onClick={toggleCurrency}
      className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors duration-200 ${
        displayCurrency === 'crypto'
          ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'
          : 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
      }`}
    >
      {displayCurrency === 'crypto' ? 'CRYPTO' : 'USD'}
    </button>
  );
};
