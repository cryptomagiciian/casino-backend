"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithdrawalsModule = void 0;
const common_1 = require("@nestjs/common");
const withdrawals_controller_1 = require("./withdrawals.controller");
const withdrawals_service_1 = require("./withdrawals.service");
const prisma_module_1 = require("../prisma/prisma.module");
const ledger_module_1 = require("../ledger/ledger.module");
const wallets_module_1 = require("../wallets/wallets.module");
const wallet_module_1 = require("../wallet/wallet.module");
let WithdrawalsModule = class WithdrawalsModule {
};
exports.WithdrawalsModule = WithdrawalsModule;
exports.WithdrawalsModule = WithdrawalsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, ledger_module_1.LedgerModule, wallets_module_1.WalletsModule, wallet_module_1.WalletModule],
        controllers: [withdrawals_controller_1.WithdrawalsController],
        providers: [withdrawals_service_1.WithdrawalsService],
        exports: [withdrawals_service_1.WithdrawalsService],
    })
], WithdrawalsModule);
//# sourceMappingURL=withdrawals.module.js.map