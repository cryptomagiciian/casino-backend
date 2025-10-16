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
exports.DepositsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const deposits_service_1 = require("./deposits.service");
const create_deposit_dto_1 = require("./dto/create-deposit.dto");
const deposit_response_dto_1 = require("./dto/deposit-response.dto");
const webhook_dto_1 = require("./dto/webhook.dto");
let DepositsController = class DepositsController {
    constructor(depositsService) {
        this.depositsService = depositsService;
    }
    async createDeposit(req, createDepositDto) {
        return this.depositsService.createDeposit(req.user.sub, createDepositDto);
    }
    async getDeposits(req, limit, offset) {
        return this.depositsService.getDeposits(req.user.sub, parseInt(limit || '50'), parseInt(offset || '0'));
    }
    async getDeposit(req, id) {
        return this.depositsService.getDeposit(req.user.sub, id);
    }
    async getDepositLimits(currency) {
        return this.depositsService.getDepositLimits(currency);
    }
    async confirmDeposit(req, id) {
        return this.depositsService.confirmDeposit(req.user.sub, id);
    }
    async processWebhook(webhookData, signature) {
        await this.depositsService.processDepositWebhook(webhookData.depositId, webhookData.confirmations, webhookData.transactionHash);
        return {
            success: true,
            message: 'Webhook processed successfully',
        };
    }
};
exports.DepositsController = DepositsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new deposit' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Deposit created successfully', type: deposit_response_dto_1.DepositResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid deposit data' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_deposit_dto_1.CreateDepositDto]),
    __metadata("design:returntype", Promise)
], DepositsController.prototype, "createDeposit", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user deposits' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Number of deposits to return', example: '50' }),
    (0, swagger_1.ApiQuery)({ name: 'offset', required: false, description: 'Number of deposits to skip', example: '0' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Deposits retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], DepositsController.prototype, "getDeposits", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific deposit' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Deposit retrieved successfully', type: deposit_response_dto_1.DepositResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Deposit not found' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DepositsController.prototype, "getDeposit", null);
__decorate([
    (0, common_1.Get)('limits/:currency'),
    (0, swagger_1.ApiOperation)({ summary: 'Get deposit limits for a currency' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Deposit limits retrieved successfully' }),
    __param(0, (0, common_1.Param)('currency')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DepositsController.prototype, "getDepositLimits", null);
__decorate([
    (0, common_1.Post)(':id/confirm'),
    (0, swagger_1.ApiOperation)({ summary: 'Manually confirm a deposit (for testing)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Deposit ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Deposit confirmed successfully', type: deposit_response_dto_1.DepositResponseDto }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DepositsController.prototype, "confirmDeposit", null);
__decorate([
    (0, common_1.Post)('webhook'),
    (0, swagger_1.ApiOperation)({ summary: 'Webhook endpoint for deposit confirmations' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Webhook processed successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid webhook data' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-webhook-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [webhook_dto_1.DepositWebhookDto, String]),
    __metadata("design:returntype", Promise)
], DepositsController.prototype, "processWebhook", null);
exports.DepositsController = DepositsController = __decorate([
    (0, swagger_1.ApiTags)('deposits'),
    (0, common_1.Controller)('deposits'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [deposits_service_1.DepositsService])
], DepositsController);
//# sourceMappingURL=deposits.controller.js.map