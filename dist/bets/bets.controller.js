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
const class_validator_1 = require("class-validator");
const throttler_1 = require("@nestjs/throttler");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const bets_service_1 = require("./bets.service");
const live_wins_dto_1 = require("./dto/live-wins.dto");
const live_wins_response_dto_1 = require("./dto/live-wins-response.dto");
const bet_filters_dto_1 = require("./dto/bet-filters.dto");
class BetPreviewDto {
}
exports.BetPreviewDto = BetPreviewDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Game to play', example: 'candle-flip' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BetPreviewDto.prototype, "game", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Currency to bet with', example: 'USDC' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['BTC', 'ETH', 'SOL', 'USDC', 'USDT']),
    __metadata("design:type", String)
], BetPreviewDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Bet amount', example: '100' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BetPreviewDto.prototype, "stake", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Game-specific parameters', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], BetPreviewDto.prototype, "params", void 0);
class BetPlaceDto {
}
exports.BetPlaceDto = BetPlaceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Game to play', example: 'candle-flip' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BetPlaceDto.prototype, "game", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Currency to bet with', example: 'USDC' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['BTC', 'ETH', 'SOL', 'USDC', 'USDT']),
    __metadata("design:type", String)
], BetPlaceDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Bet amount', example: '100' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BetPlaceDto.prototype, "stake", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Client seed for provably fair', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BetPlaceDto.prototype, "clientSeed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Game-specific parameters', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], BetPlaceDto.prototype, "params", void 0);
let BetsController = class BetsController {
    constructor(betsService) {
        this.betsService = betsService;
    }
    async previewBet(previewDto) {
        return this.betsService.previewBet(previewDto);
    }
    async placeBet(req, placeDto) {
        try {
            console.log(`🎲 Placing bet for user ${req.user.id}: game=${placeDto.game}, stake=${placeDto.stake}`);
            const result = await this.betsService.placeBet(req.user.id, placeDto);
            console.log(`✅ Bet placed: ${result.id}`);
            return result;
        }
        catch (error) {
            console.error(`❌ Bet placement failed:`, error.message, error.stack);
            throw error;
        }
    }
    async resolveBet(betId, resolveParams) {
        try {
            console.log(`🎲 Resolving bet: ${betId}`, resolveParams ? `with params: ${JSON.stringify(resolveParams)}` : '');
            const result = await this.betsService.resolveBet(betId, resolveParams);
            console.log(`✅ Bet resolved: ${betId}, outcome: ${result.outcome}, multiplier: ${result.resultMultiplier}`);
            return result;
        }
        catch (error) {
            console.error(`❌ Bet resolution failed for ${betId}:`, error.message, error.stack);
            throw error;
        }
    }
    async cashoutBet(betId, body) {
        return this.betsService.cashoutBet(betId, body?.multiplier);
    }
    async getBet(betId) {
        return this.betsService.getBet(betId);
    }
    async getUserBets(req, filters) {
        return this.betsService.getUserBetsWithFilters(req.user.id, filters);
    }
    async getLiveWins(query) {
        return this.betsService.getLiveWins(parseInt(query.limit || '20'));
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
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
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
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
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
    (0, swagger_1.ApiOperation)({ summary: 'Get user bets with optional filters' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User bets retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, bet_filters_dto_1.BetFiltersDto]),
    __metadata("design:returntype", Promise)
], BetsController.prototype, "getUserBets", null);
__decorate([
    (0, common_1.Get)('live-wins'),
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get recent wins across all users' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Recent wins retrieved successfully', type: live_wins_response_dto_1.LiveWinsResponseDto }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [live_wins_dto_1.LiveWinsQueryDto]),
    __metadata("design:returntype", Promise)
], BetsController.prototype, "getLiveWins", null);
exports.BetsController = BetsController = __decorate([
    (0, swagger_1.ApiTags)('Bets'),
    (0, common_1.Controller)('bets'),
    __metadata("design:paramtypes", [bets_service_1.BetsService])
], BetsController);
//# sourceMappingURL=bets.controller.js.map