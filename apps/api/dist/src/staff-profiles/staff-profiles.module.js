"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffProfilesModule = void 0;
const common_1 = require("@nestjs/common");
const staff_profiles_controller_1 = require("./staff-profiles.controller");
const staff_profiles_service_1 = require("./staff-profiles.service");
const prisma_module_1 = require("../prisma/prisma.module");
const storage_module_1 = require("../storage/storage.module");
let StaffProfilesModule = class StaffProfilesModule {
};
exports.StaffProfilesModule = StaffProfilesModule;
exports.StaffProfilesModule = StaffProfilesModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, storage_module_1.StorageModule],
        controllers: [staff_profiles_controller_1.StaffProfilesController],
        providers: [staff_profiles_service_1.StaffProfilesService],
    })
], StaffProfilesModule);
//# sourceMappingURL=staff-profiles.module.js.map