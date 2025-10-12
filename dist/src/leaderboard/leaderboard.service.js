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
exports.LeaderboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const utils_1 = require("../shared/utils");
let LeaderboardService = class LeaderboardService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDailyLeaderboard(date, limit = 100) {
        const targetDate = date || new Date();
        targetDate.setHours(0, 0, 0, 0);
        const leaderboard = await this.prisma.leaderboardDaily.findMany({
            where: {
                date: targetDate,
            },
            orderBy: {
                pnl: 'desc',
            },
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        handle: true,
                    },
                },
            },
        });
        return leaderboard.map((entry, index) => ({
            rank: index + 1,
            userId: entry.userId,
            handle: entry.user.handle,
            pnl: (0, utils_1.fromSmallestUnits)(entry.pnl, 'USDC'),
            currency: 'USDC',
        }));
    }
    async updateDailyPnL(userId, pnl, currency, date) {
        const targetDate = date || new Date();
        targetDate.setHours(0, 0, 0, 0);
        const entry = await this.prisma.leaderboardDaily.upsert({
            where: {
                userId_date: {
                    userId,
                    date: targetDate,
                },
            },
            update: {
                pnl: {
                    increment: pnl,
                },
            },
            create: {
                userId,
                pnl,
                date: targetDate,
            },
        });
        await this.updateDailyRanks(targetDate);
        return entry;
    }
    async updateDailyRanks(date) {
        const entries = await this.prisma.leaderboardDaily.findMany({
            where: { date },
            orderBy: { pnl: 'desc' },
        });
        for (let i = 0; i < entries.length; i++) {
            await this.prisma.leaderboardDaily.update({
                where: { id: entries[i].id },
                data: { rank: i + 1 },
            });
        }
    }
    async getUserLeaderboardPosition(userId, date) {
        const targetDate = date || new Date();
        targetDate.setHours(0, 0, 0, 0);
        const entry = await this.prisma.leaderboardDaily.findUnique({
            where: {
                userId_date: {
                    userId,
                    date: targetDate,
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        handle: true,
                    },
                },
            },
        });
        if (!entry) {
            return null;
        }
        return {
            rank: entry.rank || 0,
            userId: entry.userId,
            handle: entry.user.handle,
            pnl: (0, utils_1.fromSmallestUnits)(entry.pnl, 'USDC'),
            currency: 'USDC',
        };
    }
    async getUserLeaderboardHistory(userId, days = 30) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);
        const entries = await this.prisma.leaderboardDaily.findMany({
            where: {
                userId,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            orderBy: { date: 'desc' },
        });
        return entries.map(entry => ({
            date: entry.date,
            rank: entry.rank || 0,
            pnl: (0, utils_1.fromSmallestUnits)(entry.pnl, 'USDC'),
            currency: 'USDC',
        }));
    }
};
exports.LeaderboardService = LeaderboardService;
exports.LeaderboardService = LeaderboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LeaderboardService);
//# sourceMappingURL=leaderboard.service.js.map