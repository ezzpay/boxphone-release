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
exports.DeviceBankCode = exports.UpdateDeviceConfigDto = void 0;
const class_validator_1 = require("class-validator");
class UpdateDeviceConfigDto {
}
exports.UpdateDeviceConfigDto = UpdateDeviceConfigDto;
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.status === 'active'),
    (0, class_validator_1.IsNotEmpty)({ message: 'Bank Code is required when status is active' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateDeviceConfigDto.prototype, "bankCode", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.status === 'active'),
    (0, class_validator_1.IsNotEmpty)({ message: 'Available Amount is required when status is active' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0, { message: 'Available Amount must be greater than or equal to 0' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateDeviceConfigDto.prototype, "availableAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['active', 'deactive']),
    __metadata("design:type", String)
], UpdateDeviceConfigDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.status === 'active'),
    (0, class_validator_1.IsNotEmpty)({ message: 'Password is required when status is active' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateDeviceConfigDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.status === 'active'),
    (0, class_validator_1.IsNotEmpty)({ message: 'Smart OTP is required when status is active' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateDeviceConfigDto.prototype, "smartOTP", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.status === 'active'),
    (0, class_validator_1.IsNotEmpty)({ message: 'Account No is required when status is active' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateDeviceConfigDto.prototype, "accountNo", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.status === 'active'),
    (0, class_validator_1.IsNotEmpty)({ message: 'Account Name is required when status is active' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateDeviceConfigDto.prototype, "accountName", void 0);
var DeviceBankCode;
(function (DeviceBankCode) {
    DeviceBankCode["ACB"] = "ACB";
    DeviceBankCode["PGBANK"] = "PGBANK";
    DeviceBankCode["HDBANK"] = "HDBANK";
    DeviceBankCode["VIETCOMBANK"] = "VIETCOMBANK";
})(DeviceBankCode || (exports.DeviceBankCode = DeviceBankCode = {}));
//# sourceMappingURL=device-config.dto.js.map