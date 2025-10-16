"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = class AuthService {
    constructor(prisma, jwtService, configService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async register(handle, email, password) {
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { handle },
                    { email },
                ],
            },
        });
        if (existingUser) {
            throw new common_1.ConflictException('User with this handle or email already exists');
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await this.prisma.user.create({
            data: {
                handle,
                email,
                password: hashedPassword,
            },
        });
        await this.createUserFairnessSeed(user.id);
        return this.generateTokens(user);
    }
    async login(handle, password) {
        const user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { handle },
                    { email: handle },
                ],
            },
        });
        if (!user || !user.password) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        return this.generateTokens(user);
    }
    async refreshToken(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        return this.generateTokens(user);
    }
    async validateUser(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            return null;
        }
        return {
            sub: user.id,
            handle: user.handle,
            email: user.email,
        };
    }
    async generateTokens(user) {
        const payload = {
            sub: user.id,
            handle: user.handle,
            email: user.email,
        };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_SECRET'),
                expiresIn: this.configService.get('JWT_EXPIRES_IN', '1h'),
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
                expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
            }),
        ]);
        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                handle: user.handle,
                email: user.email,
            },
        };
    }
    async createUserFairnessSeed(userId) {
        const serverSeed = this.generateServerSeed();
        const serverSeedHash = await this.sha256(serverSeed);
        await this.prisma.fairnessSeed.create({
            data: {
                userId,
                serverSeed,
                serverSeedHash,
                active: true,
            },
        });
    }
    generateServerSeed() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 64; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    async sha256(input) {
        return crypto.createHash('sha256').update(input).digest('hex');
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map