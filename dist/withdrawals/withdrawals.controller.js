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
exports.WithdrawalsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const withdrawals_service_1 = require("./withdrawals.service");
const create_withdrawal_dto_1 = require("./dto/create-withdrawal.dto");
const withdrawal_response_dto_1 = require("./dto/withdrawal-response.dto");
let WithdrawalsController = class WithdrawalsController {
    constructor(withdrawalsService) {
        this.withdrawalsService = withdrawalsService;
    }
    async createWithdrawal(req, createWithdrawalDto) {
        return this.withdrawalsService.createWithdrawal(req.user.id, createWithdrawalDto);
    }
    async getWithdrawals(req, limit, offset) {
        return this.withdrawalsService.getWithdrawals(req.user.id, parseInt(limit || '50'), parseInt(offset || '0'));
    }
    async getWithdrawal(req, id) {
        return this.withdrawalsService.getWithdrawal(req.user.id, id);
    }
    async cancelWithdrawal(req, id) {
        await this.withdrawalsService.cancelWithdrawal(req.user.id, id);
        return { message: 'Withdrawal cancelled successfully' };
    }
    async getWithdrawalLimits(currency) {
        return this.withdrawalsService.getWithdrawalLimits(currency);
    }
};
exports.WithdrawalsController = WithdrawalsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new withdrawal' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Withdrawal created successfully', type: withdrawal_response_dto_1.WithdrawalResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid withdrawal data' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Insufficient balance or security check failed' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_withdrawal_dto_1.CreateWithdrawalDto]),
    __metadata("design:returntype", Promise)
], WithdrawalsController.prototype, "createWithdrawal", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user withdrawals' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Number of withdrawals to return', example: '50' }),
    (0, swagger_1.ApiQuery)({ name: 'offset', required: false, description: 'Number of withdrawals to skip', example: '0' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Withdrawals retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], WithdrawalsController.prototype, "getWithdrawals", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific withdrawal' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Withdrawal retrieved successfully', type: withdrawal_response_dto_1.WithdrawalResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Withdrawal not found' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WithdrawalsController.prototype, "getWithdrawal", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel a pending withdrawal' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Withdrawal cancelled successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Withdrawal cannot be cancelled' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Withdrawal not found' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WithdrawalsController.prototype, "cancelWithdrawal", null);
__decorate([
    (0, common_1.Get)('limits/:currency'),
    (0, swagger_1.ApiOperation)({ summary: 'Get withdrawal limits for a currency' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Withdrawal limits retrieved successfully' }),
    __param(0, (0, common_1.Param)('currency')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WithdrawalsController.prototype, "getWithdrawalLimits", null);
exports.WithdrawalsController = WithdrawalsController = __decorate([
    (0, swagger_1.ApiTags)('withdrawals'),
    (0, common_1.Controller)('withdrawals'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [withdrawals_service_1.WithdrawalsService])
], WithdrawalsController);
//# sourceMappingURL=withdrawals.controller.js.map