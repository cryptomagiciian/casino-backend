import { PrismaService } from '../prisma/prisma.service';
import { FairnessSeed, FairnessVerifyRequest, FairnessVerifyResult } from '../shared/types';
export declare class FairnessService {
    private prisma;
    constructor(prisma: PrismaService);
    getCurrentSeed(userId: string): Promise<FairnessSeed>;
    rotateSeed(userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        serverSeedHash: string;
        serverSeed: string;
        active: boolean;
        revealedAt: Date | null;
    }>;
    revealSeed(userId: string, seedId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        serverSeedHash: string;
        serverSeed: string;
        active: boolean;
        revealedAt: Date | null;
    }>;
    verifyFairness(request: FairnessVerifyRequest): Promise<FairnessVerifyResult>;
    private getNextNonce;
    private generateServerSeed;
    private generateGameOutcome;
    private generateCandleFlipOutcome;
    private generatePumpOrDumpOutcome;
    private generateSupportOrResistanceOutcome;
    private generateBullVsBearOutcome;
    private generateLeverageLadderOutcome;
    private generateStopLossRouletteOutcome;
    private generateFreezeTheBagOutcome;
    private generateToTheMoonOutcome;
    private generateDiamondHandsOutcome;
}
