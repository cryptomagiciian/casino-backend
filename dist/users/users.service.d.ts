import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<{
        id: string;
        handle: string;
        email: string;
        createdAt: Date;
    }>;
    findByHandle(handle: string): Promise<{
        id: string;
        handle: string;
        email: string;
        createdAt: Date;
    }>;
    updateProfile(id: string, data: {
        handle?: string;
        email?: string;
    }): Promise<{
        id: string;
        handle: string;
        email: string;
        updatedAt: Date;
    }>;
}
