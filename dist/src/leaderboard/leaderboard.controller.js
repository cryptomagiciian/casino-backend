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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaderboardController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const leaderboard_service_1 = require("./leaderboard.service");
let LeaderboardController = class LeaderboardController {
    constructor(leaderboardService) {
        this.leaderboardService = leaderboardService;
    }
    async getDailyLeaderboard(date, limit) {
        const targetDate = date ? new Date(date) : undefined;
        return this.leaderboardService.getDailyLeaderboard(targetDate, limit || 100);
    }
    async getUserPosition(req, date) {
        const targetDate = date ? new Date(date) : undefined;
        return this.leaderboardService.getUserLeaderboardPosition(req.user.sub, targetDate);
    }
    async getUserHistory(req, days) {
        return this.leaderboardService.getUserLeaderboardHistory(req.user.sub, days || 30);
    }
};
exports.LeaderboardController = LeaderboardController;
__decorate([
    (0, common_1.Get)('daily'),
    (0, swagger_1.ApiOperation)({ summary: 'Get daily leaderboard' }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: false, description: 'Date for leaderboard (YYYY-MM-DD)' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Number of entries to return' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Daily leaderboard retrieved successfully' }),
    __param(0, (0, common_1.Query)('date')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], LeaderboardController.prototype, "getDailyLeaderboard", null);
__decorate([
    (0, common_1.Get)('position'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user leaderboard position' }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: false, description: 'Date for leaderboard (YYYY-MM-DD)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User position retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], LeaderboardController.prototype, "getUserPosition", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user leaderboard history' }),
    (0, swagger_1.ApiQuery)({ name: 'days', required: false, description: 'Number of days to retrieve' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User history retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], LeaderboardController.prototype, "getUserHistory", null);
exports.LeaderboardController = LeaderboardController = __decorate([
    (0, swagger_1.ApiTags)('Leaderboard'),
    (0, common_1.Controller)('leaderboard'),
    __metadata("design:paramtypes", [leaderboard_service_1.LeaderboardService])
], LeaderboardController);
//# sourceMappingURL=leaderboard.controller.js.map