import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ImpactFeeService {
  private readonly logger = new Logger(ImpactFeeService.name);

  /**
   * Calculate impact fee based on order size
   * Default curve: 0.02% per $1k up to 0.20% cap
   */
  calculateImpactFee(notional: number): number {
    // Impact fee curve: 0.02% per $1k up to 0.20% cap
    const impactRate = Math.min(0.002, (notional / 1000) * 0.0002);
    const impactFee = notional * impactRate;

    this.logger.debug(`Impact fee calculated: ${impactFee} (${(impactRate * 100).toFixed(4)}%) for notional ${notional}`);

    return impactFee;
  }

  /**
   * Calculate total fees for opening a position
   */
  calculateOpenFees(notional: number): {
    openFee: number;
    impactFee: number;
    totalFee: number;
  } {
    const openFee = notional * 0.0008; // 0.08% open fee
    const impactFee = this.calculateImpactFee(notional);
    const totalFee = openFee + impactFee;

    return {
      openFee,
      impactFee,
      totalFee,
    };
  }

  /**
   * Calculate close fee
   */
  calculateCloseFee(notional: number): number {
    return notional * 0.0008; // 0.08% close fee
  }

  /**
   * Calculate optimal split size to minimize impact
   */
  calculateOptimalSplitSize(totalNotional: number, maxSplits = 10): number {
    // Simple strategy: split into equal parts up to maxSplits
    // More sophisticated strategies could be implemented here
    const optimalSplits = Math.min(maxSplits, Math.ceil(totalNotional / 1000));
    return totalNotional / optimalSplits;
  }

  /**
   * Calculate fees for split orders
   */
  calculateSplitFees(totalNotional: number, splitSize?: number): {
    openFee: number;
    impactFee: number;
    totalFee: number;
    splits: number;
  } {
    const splits = splitSize ? Math.ceil(totalNotional / splitSize) : 1;
    const actualSplitSize = totalNotional / splits;

    const openFee = totalNotional * 0.0008; // 0.08% open fee (same regardless of splits)
    const impactFee = this.calculateImpactFee(actualSplitSize) * splits;
    const totalFee = openFee + impactFee;

    return {
      openFee,
      impactFee,
      totalFee,
      splits,
    };
  }
}
