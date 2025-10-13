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
exports.FairnessController = exports.RevealSeedDto = exports.RotateSeedDto = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const fairness_service_1 = require("./fairness.service");
class RotateSeedDto {
}
exports.RotateSeedDto = RotateSeedDto;
class RevealSeedDto {
}
exports.RevealSeedDto = RevealSeedDto;
let FairnessController = class FairnessController {
    constructor(fairnessService) {
        this.fairnessService = fairnessService;
    }
    async getCurrentSeed(req) {
        return this.fairnessService.getCurrentSeed(req.user.sub);
    }
    async rotateSeed(req, rotateSeedDto) {
        return this.fairnessService.rotateSeed(req.user.sub);
    }
    async revealSeed(req, revealSeedDto) {
        return this.fairnessService.revealSeed(req.user.sub, revealSeedDto.seedId);
    }
    async verifyFairness(verifyRequest) {
        return this.fairnessService.verifyFairness(verifyRequest);
    }
};
exports.FairnessController = FairnessController;
__decorate([
    (0, common_1.Get)('seed/current'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current fairness seed for user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Current seed retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FairnessController.prototype, "getCurrentSeed", null);
__decorate([
    (0, common_1.Post)('seed/rotate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Rotate fairness seed (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Seed rotated successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, RotateSeedDto]),
    __metadata("design:returntype", Promise)
], FairnessController.prototype, "rotateSeed", null);
__decorate([
    (0, common_1.Post)('seed/reveal'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Reveal fairness seed (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Seed revealed successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, RevealSeedDto]),
    __metadata("design:returntype", Promise)
], FairnessController.prototype, "revealSeed", null);
__decorate([
    (0, common_1.Post)('verify'),
    (0, swagger_1.ApiOperation)({ summary: 'Verify fairness of a bet' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Fairness verification completed' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FairnessController.prototype, "verifyFairness", null);
exports.FairnessController = FairnessController = __decorate([
    (0, swagger_1.ApiTags)('Fairness'),
    (0, common_1.Controller)('fairness'),
    __metadata("design:paramtypes", [fairness_service_1.FairnessService])
], FairnessController);
//# sourceMappingURL=fairness.controller.js.map