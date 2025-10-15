import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from './useAuth';
import { useBetting } from './GameBettingProvider';
import { useNetwork } from './NetworkContext';
import { useCurrency } from './CurrencySelector';
import { apiService } from './api';
import { usePrices } from './PriceManager';
import { TradingViewChart } from './TradingViewChart';
import { EnhancedTradingTerminalV2 } from './EnhancedTradingTerminalV2';

export const ProfessionalTradingTerminal: React.FC<{ className?: string }> = ({ className = '' }) => {
  return <EnhancedTradingTerminalV2 className={className} />;
};