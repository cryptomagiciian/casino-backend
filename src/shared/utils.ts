import * as crypto from 'crypto';
import { CURRENCY_DECIMALS, Currency } from './constants';

/**
 * Convert from smallest currency units to display units
 */
export function fromSmallestUnits(amount: bigint, currency: Currency): string {
  const decimals = CURRENCY_DECIMALS[currency];
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const remainder = amount % divisor;
  
  if (remainder === 0n) {
    return whole.toString();
  }
  
  const remainderStr = remainder.toString().padStart(decimals, '0');
  const trimmed = remainderStr.replace(/0+$/, '');
  
  if (trimmed === '') {
    return whole.toString();
  }
  
  return `${whole}.${trimmed}`;
}

/**
 * Convert from display units to smallest currency units
 */
export function toSmallestUnits(amount: string, currency: Currency): bigint {
  const decimals = CURRENCY_DECIMALS[currency];
  const [whole, fractional = ''] = amount.split('.');
  
  const wholeBigInt = BigInt(whole || '0');
  const fractionalPadded = fractional.padEnd(decimals, '0').slice(0, decimals);
  const fractionalBigInt = BigInt(fractionalPadded);
  
  return wholeBigInt * BigInt(10 ** decimals) + fractionalBigInt;
}

/**
 * Generate a random client seed
 */
export function generateClientSeed(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Generate a random server seed
 */
export function generateServerSeed(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Calculate SHA256 hash
 */
export async function sha256(input: string): Promise<string> {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Calculate HMAC-SHA256
 */
export async function hmacSha256(key: string, message: string): Promise<string> {
  return crypto.createHmac('sha256', key).update(message).digest('hex');
}

/**
 * Generate RNG value from seeds
 */
export async function generateRng(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): Promise<number> {
  const message = `${clientSeed}:${nonce}`;
  const hash = await hmacSha256(serverSeed, message);
  
  // Take first 8 characters and convert to number (0-1)
  const hex = hash.substring(0, 8);
  const num = parseInt(hex, 16);
  return num / 0xffffffff;
}

/**
 * Calculate house edge multiplier
 */
export function calculateHouseEdgeMultiplier(winChance: number, houseEdgeBps: number): number {
  const houseEdge = houseEdgeBps / 10000;
  return (1 - houseEdge) / winChance;
}

/**
 * Validate currency amount
 */
export function validateCurrencyAmount(amount: string, currency: Currency): boolean {
  try {
    const smallestUnits = toSmallestUnits(amount, currency);
    return smallestUnits > 0n;
  } catch {
    return false;
  }
}

/**
 * Format currency amount for display
 */
export function formatCurrency(amount: string, currency: Currency): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return '0';
  
  // Format with appropriate decimal places
  const decimals = CURRENCY_DECIMALS[currency];
  return num.toFixed(decimals);
}

/**
 * Generate idempotency key
 */
export function generateIdempotencyKey(): string {
  return `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Check if demo mode is enabled
 */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === 'true';
}

/**
 * Check if demo only mode is enabled
 */
export function isDemoOnly(): boolean {
  return process.env.DEMO_ONLY === 'true';
}
