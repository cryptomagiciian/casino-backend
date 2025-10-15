import React from 'react';
import { ProfessionalTradingTerminal } from './ProfessionalTradingTerminal';

export const TradingTerminal: React.FC<{ className?: string }> = ({ className = '' }) => {
  return <ProfessionalTradingTerminal className={className} />;
};