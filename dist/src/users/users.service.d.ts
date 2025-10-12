import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<{
        handle: string;
        email: string;
        id: string;
        createdAt: Date;
    }>;
    findByHandle(handle: string): Promise<{
        handle: string;
        email: string;
        id: string;
        createdAt: Date;
    }>;
    updateProfile(id: string, data: {
        handle?: string;
        email?: string;
    }): Promise<{
        handle: string;
        email: string;
        id: string;
        updatedAt: Date;
    }>;
}
