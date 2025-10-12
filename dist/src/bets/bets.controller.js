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
exports.BetsController = exports.BetPlaceDto = exports.BetPreviewDto = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const bets_service_1 = require("./bets.service");
class BetPreviewDto {
}
exports.BetPreviewDto = BetPreviewDto;
class BetPlaceDto {
}
exports.BetPlaceDto = BetPlaceDto;
let BetsController = class BetsController {
    constructor(betsService) {
        this.betsService = betsService;
    }
    async previewBet(previewDto) {
        return this.betsService.previewBet(previewDto);
    }
    async placeBet(req, placeDto) {
        return this.betsService.placeBet(req.user.sub, placeDto);
    }
    async resolveBet(betId) {
        return this.betsService.resolveBet(betId);
    }
    async cashoutBet(betId) {
        return this.betsService.cashoutBet(betId);
    }
    async getBet(betId) {
        return this.betsService.getBet(betId);
    }
    async getUserBets(req, limit, offset) {
        return this.betsService.getUserBets(req.user.sub, limit || 50, offset || 0);
    }
};
exports.BetsController = BetsController;
__decorate([
    (0, common_1.Post)('preview'),
    (0, swagger_1.ApiOperation)({ summary: 'Preview a bet (calculate potential payout)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Bet preview calculated successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [BetPreviewDto]),
    __metadata("design:returntype", Promise)
], BetsController.prototype, "previewBet", null);
__decorate([
    (0, common_1.Post)('place'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Place a bet' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Bet placed successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid bet parameters' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, BetPlaceDto]),
    __metadata("design:returntype", Promise)
], BetsController.prototype, "placeBet", null);
__decorate([
    (0, common_1.Post)('resolve/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Resolve a bet (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Bet resolved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Bet not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BetsController.prototype, "resolveBet", null);
__decorate([
    (0, common_1.Post)('cashout/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Cash out a bet (for crash games)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Bet cashed out successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Bet not found' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bet cannot be cashed out' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BetsController.prototype, "cashoutBet", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get bet details' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Bet details retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Bet not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BetsController.prototype, "getBet", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user bets' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User bets retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", Promise)
], BetsController.prototype, "getUserBets", null);
exports.BetsController = BetsController = __decorate([
    (0, swagger_1.ApiTags)('Bets'),
    (0, common_1.Controller)('bets'),
    __metadata("design:paramtypes", [bets_service_1.BetsService])
], BetsController);
//# sourceMappingURL=bets.controller.js.map