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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTimeMachineEntryDto = exports.CreateTimeMachineEntryDto = exports.TimeMachineHome = exports.TimeMachineCategory = void 0;
const class_validator_1 = require("class-validator");
var TimeMachineCategory;
(function (TimeMachineCategory) {
    TimeMachineCategory["SUCCESS_STORY"] = "SUCCESS_STORY";
    TimeMachineCategory["INSPIRING_STORY"] = "INSPIRING_STORY";
    TimeMachineCategory["RECOGNITION"] = "RECOGNITION";
    TimeMachineCategory["DONOR_SUPPORT"] = "DONOR_SUPPORT";
    TimeMachineCategory["EVENT_BY_KIDS"] = "EVENT_BY_KIDS";
    TimeMachineCategory["VISITOR_VISIT"] = "VISITOR_VISIT";
    TimeMachineCategory["CHALLENGE_PROBLEM"] = "CHALLENGE_PROBLEM";
    TimeMachineCategory["GENERAL_UPDATE"] = "GENERAL_UPDATE";
})(TimeMachineCategory || (exports.TimeMachineCategory = TimeMachineCategory = {}));
var TimeMachineHome;
(function (TimeMachineHome) {
    TimeMachineHome["ALL_HOMES"] = "ALL_HOMES";
    TimeMachineHome["GIRLS_HOME_UPPAL"] = "GIRLS_HOME_UPPAL";
    TimeMachineHome["BLIND_HOME_BEGUMPET"] = "BLIND_HOME_BEGUMPET";
    TimeMachineHome["OLD_AGE_HOME_PEERZADIGUDA"] = "OLD_AGE_HOME_PEERZADIGUDA";
})(TimeMachineHome || (exports.TimeMachineHome = TimeMachineHome = {}));
class CreateTimeMachineEntryDto {
}
exports.CreateTimeMachineEntryDto = CreateTimeMachineEntryDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTimeMachineEntryDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateTimeMachineEntryDto.prototype, "eventDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTimeMachineEntryDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(TimeMachineCategory),
    __metadata("design:type", String)
], CreateTimeMachineEntryDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(TimeMachineHome),
    __metadata("design:type", String)
], CreateTimeMachineEntryDto.prototype, "home", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateTimeMachineEntryDto.prototype, "isPublic", void 0);
class UpdateTimeMachineEntryDto {
}
exports.UpdateTimeMachineEntryDto = UpdateTimeMachineEntryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTimeMachineEntryDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateTimeMachineEntryDto.prototype, "eventDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTimeMachineEntryDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(TimeMachineCategory),
    __metadata("design:type", String)
], UpdateTimeMachineEntryDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(TimeMachineHome),
    __metadata("design:type", String)
], UpdateTimeMachineEntryDto.prototype, "home", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateTimeMachineEntryDto.prototype, "isPublic", void 0);
//# sourceMappingURL=time-machine.dto.js.map