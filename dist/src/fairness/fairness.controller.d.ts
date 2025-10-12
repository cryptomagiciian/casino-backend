import { FairnessService } from './fairness.service';
import { FairnessVerifyRequest } from '../shared/types';
export declare class RotateSeedDto {
}
export declare class RevealSeedDto {
    seedId: string;
}
export declare class FairnessController {
    private fairnessService;
    constructor(fairnessService: FairnessService);
    getCurrentSeed(req: {
        user: {
            sub: string;
        };
    }): Promise<import("../shared/types").FairnessSeed>;
    rotateSeed(req: {
        user: {
            sub: string;
        };
    }, rotateSeedDto: RotateSeedDto): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        serverSeed: string;
        serverSeedHash: string;
        active: boolean;
        revealedAt: Date | null;
    }>;
    revealSeed(req: {
        user: {
            sub: string;
        };
    }, revealSeedDto: RevealSeedDto): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        serverSeed: string;
        serverSeedHash: string;
        active: boolean;
        revealedAt: Date | null;
    }>;
    verifyFairness(verifyRequest: FairnessVerifyRequest): Promise<import("../shared/types").FairnessVerifyResult>;
}
