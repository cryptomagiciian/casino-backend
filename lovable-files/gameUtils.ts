import { apiService } from './services/api';

/**
 * Resolve a bet with timeout and error handling
 * Prevents games from hanging forever
 */
export async function resolveBetWithTimeout(
  betId: string,
  timeoutMs: number = 10000
): Promise<any> {
  return Promise.race([
    apiService.resolveBet(betId),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Bet resolution timed out')), timeoutMs)
    ),
  ]);
}

/**
 * Cashout a bet with timeout and error handling
 */
export async function cashoutBetWithTimeout(
  betId: string,
  multiplier: number,
  timeoutMs: number = 10000
): Promise<any> {
  return Promise.race([
    apiService.cashoutBet(betId, multiplier),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Cashout timed out')), timeoutMs)
    ),
  ]);
}

