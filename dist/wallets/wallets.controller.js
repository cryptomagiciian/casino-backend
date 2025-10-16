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
exports.WalletsController = exports.FaucetDto = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const wallets_service_1 = require("./wallets.service");
const clear_demo_funds_dto_1 = require("./dto/clear-demo-funds.dto");
class FaucetDto {
}
exports.FaucetDto = FaucetDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Currency to request', example: 'USDC' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['BTC', 'ETH', 'SOL', 'USDC', 'USDT']),
    __metadata("design:type", String)
], FaucetDto.prototype, "currency", void 0);
let WalletsController = class WalletsController {
    constructor(walletsService) {
        this.walletsService = walletsService;
    }
    async getBalances(req, detailed, network) {
        const targetNetwork = network || 'mainnet';
        if (detailed === 'true') {
            return this.walletsService.getDetailedWalletBalances(req.user.sub, targetNetwork);
        }
        return this.walletsService.getWalletBalances(req.user.sub, targetNetwork);
    }
    async getBalance(req, currency, network) {
        const targetNetwork = network || 'mainnet';
        return this.walletsService.getBalance(req.user.sub, currency, targetNetwork);
    }
    async faucet(req, faucetDto) {
        return this.walletsService.getTestnetFaucet(req.user.sub, faucetDto.currency, 'testnet');
    }
    async getLedgerEntries(req, currency, limit, offset) {
        return this.walletsService.getLedgerEntries(req.user.sub, currency, limit || 50, offset || 0);
    }
    async clearDemoFunds(req, clearDto) {
        if (!clearDto.confirm) {
            throw new common_1.BadRequestException('Confirmation required to clear demo funds');
        }
        return this.walletsService.clearDemoFunds(req.user.sub);
    }
};
exports.WalletsController = WalletsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all wallet balances' }),
    (0, swagger_1.ApiQuery)({ name: 'detailed', required: false, description: 'Include detailed balance information' }),
    (0, swagger_1.ApiQuery)({ name: 'network', required: false, description: 'Network to get balances for (mainnet/testnet)', enum: ['mainnet', 'testnet'] }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Wallet balances retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('detailed')),
    __param(2, (0, common_1.Query)('network')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], WalletsController.prototype, "getBalances", null);
__decorate([
    (0, common_1.Get)('balance'),
    (0, swagger_1.ApiOperation)({ summary: 'Get balance for specific currency' }),
    (0, swagger_1.ApiQuery)({ name: 'currency', description: 'Currency to get balance for' }),
    (0, swagger_1.ApiQuery)({ name: 'network', required: false, description: 'Network to get balance for (mainnet/testnet)', enum: ['mainnet', 'testnet'] }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Balance retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('currency')),
    __param(2, (0, common_1.Query)('network')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], WalletsController.prototype, "getBalance", null);
__decorate([
    (0, common_1.Post)('faucet'),
    (0, swagger_1.ApiOperation)({ summary: 'Get testnet funds from faucet (testnet only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Funds credited successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Faucet not available or limit exceeded' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, FaucetDto]),
    __metadata("design:returntype", Promise)
], WalletsController.prototype, "faucet", null);
__decorate([
    (0, common_1.Get)('ledger'),
    (0, swagger_1.ApiOperation)({ summary: 'Get ledger entries for wallet' }),
    (0, swagger_1.ApiQuery)({ name: 'currency', description: 'Currency to get ledger for' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Number of entries to return' }),
    (0, swagger_1.ApiQuery)({ name: 'offset', required: false, description: 'Number of entries to skip' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Ledger entries retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('currency')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number, Number]),
    __metadata("design:returntype", Promise)
], WalletsController.prototype, "getLedgerEntries", null);
__decorate([
    (0, common_1.Post)('clear-demo-funds'),
    (0, swagger_1.ApiOperation)({ summary: 'Clear old demo funds (for testing)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Demo funds cleared successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Confirmation required' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, clear_demo_funds_dto_1.ClearDemoFundsDto]),
    __metadata("design:returntype", Promise)
], WalletsController.prototype, "clearDemoFunds", null);
exports.WalletsController = WalletsController = __decorate([
    (0, swagger_1.ApiTags)('Wallets'),
    (0, common_1.Controller)('wallets'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [wallets_service_1.WalletsService])
], WalletsController);
//# sourceMappingURL=wallets.controller.js.map