import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UserPayload } from '../shared/types';
export declare class AuthService {
    private prisma;
    private jwtService;
    private configService;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService);
    register(handle: string, email: string, password: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: any;
            handle: any;
            email: any;
        };
    }>;
    login(handle: string, password: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: any;
            handle: any;
            email: any;
        };
    }>;
    refreshToken(userId: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: any;
            handle: any;
            email: any;
        };
    }>;
    validateUser(userId: string): Promise<UserPayload | null>;
    private generateTokens;
    private createUserFairnessSeed;
    private generateServerSeed;
    private sha256;
}
