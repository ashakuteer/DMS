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
exports.StaffSalaryController = void 0;
const common_1 = require("@nestjs/common");
const staff_salary_service_1 = require("./staff-salary.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let StaffSalaryController = class StaffSalaryController {
    constructor(service) {
        this.service = service;
    }
    getOverview(homeId) {
        return this.service.getPayrollOverview(homeId);
    }
    getSalaryStructure(staffId) {
        return this.service.getSalaryStructure(staffId);
    }
    upsertSalaryStructure(staffId, body) {
        return this.service.upsertSalaryStructure(staffId, body);
    }
    getPayments(staffId, year) {
        return this.service.getPayments(staffId, year ? parseInt(year) : undefined);
    }
    recordPayment(staffId, body) {
        return this.service.recordPayment(staffId, body);
    }
    deletePayment(paymentId) {
        return this.service.deletePayment(paymentId);
    }
};
exports.StaffSalaryController = StaffSalaryController;
__decorate([
    (0, common_1.Get)('overview'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Query)('homeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StaffSalaryController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)(':staffId/structure'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('staffId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StaffSalaryController.prototype, "getSalaryStructure", null);
__decorate([
    (0, common_1.Post)(':staffId/structure'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('staffId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StaffSalaryController.prototype, "upsertSalaryStructure", null);
__decorate([
    (0, common_1.Get)(':staffId/payments'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF),
    __param(0, (0, common_1.Param)('staffId')),
    __param(1, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], StaffSalaryController.prototype, "getPayments", null);
__decorate([
    (0, common_1.Post)(':staffId/payments'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('staffId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StaffSalaryController.prototype, "recordPayment", null);
__decorate([
    (0, common_1.Delete)('payments/:paymentId'),
    (0, roles_decorator_1.Roles)(client_1.Role.FOUNDER, client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('paymentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StaffSalaryController.prototype, "deletePayment", null);
exports.StaffSalaryController = StaffSalaryController = __decorate([
    (0, common_1.Controller)('staff-salary'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [staff_salary_service_1.StaffSalaryService])
], StaffSalaryController);
//# sourceMappingURL=staff-salary.controller.js.map