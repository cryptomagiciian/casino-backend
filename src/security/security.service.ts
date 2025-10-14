import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as crypto from 'crypto';

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);

  /**
   * Generate 2FA secret for user
   */
  generate2FASecret(userId: string): { secret: string; qrCodeUrl: string } {
    const secret = speakeasy.generateSecret({
      name: `CryptoCasino (${userId})`,
      issuer: 'CryptoCasino',
      length: 32,
    });

    return {
      secret: secret.base32,
      qrCodeUrl: secret.otpauth_url!,
    };
  }

  /**
   * Verify 2FA token
   */
  verify2FA(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps (60 seconds) tolerance
    });
  }

  /**
   * Generate email verification code
   */
  generateEmailCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
  }

  /**
   * Hash withdrawal password
   */
  hashWithdrawalPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  /**
   * Verify withdrawal password
   */
  verifyWithdrawalPassword(password: string, hashedPassword: string): boolean {
    const [salt, hash] = hashedPassword.split(':');
    const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
  }

  /**
   * Generate secure withdrawal token
   */
  generateWithdrawalToken(userId: string, withdrawalId: string): string {
    const payload = {
      userId,
      withdrawalId,
      timestamp: Date.now(),
      nonce: crypto.randomBytes(16).toString('hex'),
    };

    const token = crypto
      .createHmac('sha256', process.env.WITHDRAWAL_SECRET || 'default-secret')
      .update(JSON.stringify(payload))
      .digest('hex');

    return `${Buffer.from(JSON.stringify(payload)).toString('base64')}.${token}`;
  }

  /**
   * Verify withdrawal token
   */
  verifyWithdrawalToken(token: string): { userId: string; withdrawalId: string; valid: boolean } {
    try {
      const [payloadB64, signature] = token.split('.');
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());

      // Check if token is expired (1 hour)
      if (Date.now() - payload.timestamp > 60 * 60 * 1000) {
        return { userId: '', withdrawalId: '', valid: false };
      }

      // Verify signature
      const expectedSignature = crypto
        .createHmac('sha256', process.env.WITHDRAWAL_SECRET || 'default-secret')
        .update(JSON.stringify(payload))
        .digest('hex');

      if (signature !== expectedSignature) {
        return { userId: '', withdrawalId: '', valid: false };
      }

      return {
        userId: payload.userId,
        withdrawalId: payload.withdrawalId,
        valid: true,
      };
    } catch (error) {
      this.logger.error('Error verifying withdrawal token:', error);
      return { userId: '', withdrawalId: '', valid: false };
    }
  }

  /**
   * Rate limiting for withdrawal attempts
   */
  async checkWithdrawalRateLimit(userId: string): Promise<void> {
    // In a real implementation, you would check Redis or database
    // For now, we'll just log the check
    this.logger.log(`Checking withdrawal rate limit for user ${userId}`);
    
    // Simulate rate limiting (max 3 withdrawals per hour)
    // In production, implement proper rate limiting with Redis
  }

  /**
   * Check for suspicious withdrawal patterns
   */
  async checkSuspiciousActivity(userId: string, amount: number, currency: string): Promise<void> {
    // In a real implementation, you would:
    // 1. Check withdrawal history
    // 2. Check for unusual amounts
    // 3. Check for rapid successive withdrawals
    // 4. Check IP geolocation
    // 5. Check device fingerprinting

    this.logger.log(`Checking suspicious activity for user ${userId}: ${amount} ${currency}`);

    // Example: Flag large withdrawals
    const largeWithdrawalThresholds = {
      BTC: 1, // 1 BTC
      ETH: 10, // 10 ETH
      SOL: 1000, // 1000 SOL
      USDC: 10000, // $10k
      USDT: 10000, // $10k
    };

    if (amount > largeWithdrawalThresholds[currency as keyof typeof largeWithdrawalThresholds]) {
      this.logger.warn(`Large withdrawal detected: ${amount} ${currency} by user ${userId}`);
      // In production, you might want to require additional verification
    }
  }
}
