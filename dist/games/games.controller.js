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
exports.GamesController = exports.BetPreviewDto = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const games_service_1 = require("./games.service");
const game_search_dto_1 = require("./dto/game-search.dto");
const game_search_response_dto_1 = require("./dto/game-search-response.dto");
class BetPreviewDto {
}
exports.BetPreviewDto = BetPreviewDto;
let GamesController = class GamesController {
    constructor(gamesService) {
        this.gamesService = gamesService;
    }
    async searchGames(query) {
        return this.gamesService.searchGames(query.q || '', parseInt(query.limit || '10'));
    }
    async getGames() {
        return this.gamesService.getGames();
    }
    async getGameConfig(game) {
        return this.gamesService.getGameConfig(game);
    }
};
exports.GamesController = GamesController;
__decorate([
    (0, common_1.Get)('search'),
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Search games' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Game search results', type: game_search_response_dto_1.GameSearchResponseDto }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [game_search_dto_1.GameSearchQueryDto]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "searchGames", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all available games' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Games retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "getGames", null);
__decorate([
    (0, common_1.Get)(':game'),
    (0, swagger_1.ApiOperation)({ summary: 'Get game configuration' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Game configuration retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Game not found' }),
    __param(0, (0, common_1.Body)('game')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "getGameConfig", null);
exports.GamesController = GamesController = __decorate([
    (0, swagger_1.ApiTags)('Games'),
    (0, common_1.Controller)('games'),
    __metadata("design:paramtypes", [games_service_1.GamesService])
], GamesController);
//# sourceMappingURL=games.controller.js.map