import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useNetwork } from './NetworkContext';
import { usePrices } from './PriceManager';

type CurrencyDisplay = 'crypto' | 'usd';
type BettingCurrency = 'BTC' | 'ETH' | 'SOL' | 'USDC' | 'USDT';

interface CurrencyContextType {
  displayCurrency: CurrencyDisplay;
  setDisplayCurrency: (currency: CurrencyDisplay) => void;
  bettingCurrency: BettingCurrency;
  setBettingCurrency: (currency: BettingCurrency) => void;
  usdRates: Record<string, number>;
  setUsdRates: (rates: Record<string, number>) => void;
  convertToUsd: (amount: number, currency: string) => number;
  convertUsdToCrypto: (usdAmount: number, cryptoCurrency: string) => number;
  formatBalance: (amount: number, currency: string) => string;
  getAvailableCurrencies: () => BettingCurrency[];
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { network } = useNetwork();
  const [displayCurrency, setDisplayCurrency] = useState<CurrencyDisplay>(() => {
    // Initialize from localStorage, default to 'crypto'
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('displayCurrency') as CurrencyDisplay) || 'crypto';
    }
    return 'crypto';
  });

  const [bettingCurrency, setBettingCurrency] = useState<BettingCurrency>(() => {
    // Initialize from localStorage, default to 'USDC'
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('bettingCurrency') as BettingCurrency) || 'USDC';
    }
    return 'USDC';
  });

  // Use centralized price manager
  const { prices } = usePrices();
  
  const usdRates = {
    BTC: prices.BTC || 45000,
    ETH: prices.ETH || 2500,
    SOL: prices.SOL || 100,
    USDC: prices.USDC || 1,
    USDT: prices.USDT || 1,
  };

  useEffect(() => {
    // Persist currency preferences to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('displayCurrency', displayCurrency);
      localStorage.setItem('bettingCurrency', bettingCurrency);
    }
  }, [displayCurrency, bettingCurrency]);

  // Price fetching is now handled by the centralized PriceManager

  const convertToUsd = (amount: number, currency: string): number => {
    const rate = usdRates[currency] || 1;
    return amount * rate;
  };

  const convertUsdToCrypto = (usdAmount: number, cryptoCurrency: string): number => {
    const rate = usdRates[cryptoCurrency] || 1;
    return usdAmount / rate;
  };

  const formatBalance = (amount: number, currency: string): string => {
    if (displayCurrency === 'usd') {
      const usdAmount = convertToUsd(amount, currency);
      return `$${usdAmount.toFixed(2)}`;
    } else {
      return `${amount.toFixed(2)} ${currency}`;
    }
  };

  const getAvailableCurrencies = (): BettingCurrency[] => {
    // Return all supported currencies
    return ['BTC', 'ETH', 'SOL', 'USDC', 'USDT'];
  };

  return (
    <CurrencyContext.Provider value={{
      displayCurrency,
      setDisplayCurrency,
      bettingCurrency,
      setBettingCurrency,
      usdRates,
      setUsdRates,
      convertToUsd,
      convertUsdToCrypto,
      formatBalance,
      getAvailableCurrencies,
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

export const BettingCurrencySelector: React.FC = () => {
  const { bettingCurrency, setBettingCurrency, getAvailableCurrencies } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);

  const currencies = getAvailableCurrencies();

  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case 'BTC': return '₿';
      case 'ETH': return 'Ξ';
      case 'SOL': return '◎';
      case 'USDC': return '$';
      case 'USDT': return '$';
      default: return '₿';
    }
  };

  const getCurrencyName = (currency: string) => {
    switch (currency) {
      case 'BTC': return 'Bitcoin';
      case 'ETH': return 'Ethereum';
      case 'SOL': return 'Solana';
      case 'USDC': return 'USD Coin';
      case 'USDT': return 'Tether';
      default: return currency;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1 bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 rounded-full text-sm font-semibold transition-colors duration-200"
      >
        <span>{getCurrencyIcon(bettingCurrency)}</span>
        <span>{bettingCurrency}</span>
        <span className={`text-xs transform transition-transform duration-200 ${
          isOpen ? 'rotate-180' : ''
        }`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="text-xs text-gray-400 mb-2 px-2">Select betting currency:</div>
            {currencies.map((currency) => (
              <button
                key={currency}
                onClick={() => {
                  setBettingCurrency(currency);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors duration-200 ${
                  bettingCurrency === currency
                    ? 'bg-purple-600/30 text-purple-300'
                    : 'hover:bg-gray-700 text-gray-300'
                }`}
              >
                <span className="text-lg">{getCurrencyIcon(currency)}</span>
                <div className="flex-1 text-left">
                  <div className="font-medium">{currency}</div>
                  <div className="text-xs text-gray-400">{getCurrencyName(currency)}</div>
                </div>
                {bettingCurrency === currency && (
                  <span className="text-purple-400">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
