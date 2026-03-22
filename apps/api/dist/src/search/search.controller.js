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
exports.SearchController = void 0;
const common_1 = require("@nestjs/common");
const search_service_1 = require("./search.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let SearchController = class SearchController {
    constructor(searchService) {
        this.searchService = searchService;
    }
    async globalSearch(query, limit, entityType, donorCategory, donorCity, beneficiaryHomeType, beneficiaryStatus, beneficiaryAgeGroup, beneficiarySponsored, campaignStatus, campaignStartFrom, campaignStartTo) {
        const searchLimit = limit ? Math.min(parseInt(limit, 10), 20) : 8;
        return this.searchService.globalSearch(query || '', searchLimit, {
            entityType,
            donorCategory,
            donorCity,
            beneficiaryHomeType,
            beneficiaryStatus,
            beneficiaryAgeGroup,
            beneficiarySponsored,
            campaignStatus,
            campaignStartFrom,
            campaignStartTo,
        });
    }
};
exports.SearchController = SearchController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('entityType')),
    __param(3, (0, common_1.Query)('donorCategory')),
    __param(4, (0, common_1.Query)('donorCity')),
    __param(5, (0, common_1.Query)('beneficiaryHomeType')),
    __param(6, (0, common_1.Query)('beneficiaryStatus')),
    __param(7, (0, common_1.Query)('beneficiaryAgeGroup')),
    __param(8, (0, common_1.Query)('beneficiarySponsored')),
    __param(9, (0, common_1.Query)('campaignStatus')),
    __param(10, (0, common_1.Query)('campaignStartFrom')),
    __param(11, (0, common_1.Query)('campaignStartTo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "globalSearch", null);
exports.SearchController = SearchController = __decorate([
    (0, common_1.Controller)('search'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [search_service_1.SearchService])
], SearchController);
//# sourceMappingURL=search.controller.js.map