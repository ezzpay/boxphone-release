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
exports.DeviceController = void 0;
const common_1 = require("@nestjs/common");
const device_service_1 = require("./device.service");
const device_config_dto_1 = require("./dto/device-config.dto");
const bank_service_1 = require("../bank/bank.service");
const config_1 = require("../../common/constants/config");
let DeviceController = class DeviceController {
    constructor(deviceService, bankService) {
        this.deviceService = deviceService;
        this.bankService = bankService;
        this.logger = new common_1.Logger('DeviceController');
    }
    async getDevicesPage() {
        const devices = await this.deviceService.listDevices();
        const serviceStatus = await this.deviceService.getServiceStatus();
        return {
            devices,
            serviceStatus,
            banks: ['ACB', 'HDBANK', 'PGBANK', 'TECHCOMBANK', 'TPBANK', 'VIETCOMBANK'],
            boxType: config_1.config.boxType,
        };
    }
    async getDevices() {
        const devices = await this.deviceService.listDevices();
        return {
            success: true,
            data: devices,
        };
    }
    async getDeviceConfig(deviceId) {
        const config = await this.deviceService.getDeviceConfigSafe(deviceId);
        return {
            success: true,
            data: config,
        };
    }
    async retryLogin(deviceId) {
        try {
            this.logger.log(`Retry login requested for device ${deviceId}`);
            const deviceConfig = await this.deviceService.getDeviceConfig(deviceId);
            if (!deviceConfig) {
                throw new common_1.HttpException({
                    success: false,
                    error: `Device ${deviceId} not found or not configured`,
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            if (!deviceConfig.bankCode || deviceConfig.bankCode.trim() === '') {
                throw new common_1.HttpException({
                    success: false,
                    error: `Device ${deviceId} does not have bankCode configured. Please configure bankCode first.`,
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            const bankCode = deviceConfig.bankCode.toUpperCase();
            await this.bankService.login(bankCode, deviceId);
            return {
                success: true,
                message: `Successfully logged in to ${bankCode} on device ${deviceId}`,
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            this.logger.error(`Error retrying login for device ${deviceId}: ${error.message}`, error.stack);
            throw new common_1.HttpException({
                success: false,
                error: error.message || 'Failed to retry login',
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async updateDeviceConfig(deviceId, dto) {
        try {
            this.logger.log(`Updating device config for ${deviceId}: ${JSON.stringify(dto)}`);
            const existingConfig = await this.deviceService.getDeviceConfig(deviceId);
            const finalStatus = dto.status !== undefined ? dto.status : existingConfig?.status || 'deactive';
            if (finalStatus === 'active') {
                const errors = [];
                const bankCode = dto.bankCode !== undefined ? dto.bankCode : existingConfig?.bankCode;
                if (!bankCode || bankCode.trim() === '') {
                    errors.push('Bank Code là bắt buộc khi status là active');
                }
                const availableAmount = dto.availableAmount !== undefined ? dto.availableAmount : existingConfig?.availableAmount;
                if (availableAmount === undefined || availableAmount === null || availableAmount < 0) {
                    errors.push('Available Amount là bắt buộc và phải >= 0 khi status là active');
                }
                const password = dto.password !== undefined ? dto.password : existingConfig?.password;
                if (!password || password.trim() === '') {
                    errors.push('Password là bắt buộc khi status là active');
                }
                const smartOTP = dto.smartOTP !== undefined ? dto.smartOTP : existingConfig?.smartOTP;
                if (!smartOTP || smartOTP.trim() === '') {
                    errors.push('Smart OTP là bắt buộc khi status là active');
                }
                if (errors.length > 0) {
                    throw new common_1.HttpException({
                        success: false,
                        error: errors.join(', '),
                    }, common_1.HttpStatus.BAD_REQUEST);
                }
            }
            const config = await this.deviceService.updateDeviceConfig(deviceId, dto);
            return {
                success: true,
                data: config,
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            this.logger.error(`Error updating device config for ${deviceId}: ${error.message}`, error.stack);
            throw new common_1.HttpException({
                success: false,
                error: error.message || 'Failed to update device config',
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getServiceStatus() {
        const status = await this.deviceService.getServiceStatus();
        return {
            success: true,
            data: { status },
        };
    }
    async startService() {
        return await this.deviceService.startService();
    }
    async stopService() {
        await this.deviceService.setServiceStatus('inactive');
        return {
            success: true,
            message: 'Service stopped successfully',
        };
    }
    async deleteDeviceConfig(deviceId) {
        await this.deviceService.deleteDeviceConfig(deviceId);
        return {
            success: true,
            message: 'Device config deleted successfully',
        };
    }
};
exports.DeviceController = DeviceController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.Render)('devices'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DeviceController.prototype, "getDevicesPage", null);
__decorate([
    (0, common_1.Get)('api/devices'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DeviceController.prototype, "getDevices", null);
__decorate([
    (0, common_1.Get)('api/devices/:deviceId/config'),
    __param(0, (0, common_1.Param)('deviceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DeviceController.prototype, "getDeviceConfig", null);
__decorate([
    (0, common_1.Post)('api/devices/:deviceId/retryLogin'),
    __param(0, (0, common_1.Param)('deviceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DeviceController.prototype, "retryLogin", null);
__decorate([
    (0, common_1.Put)('api/devices/:deviceId/config'),
    __param(0, (0, common_1.Param)('deviceId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, device_config_dto_1.UpdateDeviceConfigDto]),
    __metadata("design:returntype", Promise)
], DeviceController.prototype, "updateDeviceConfig", null);
__decorate([
    (0, common_1.Get)('api/service/status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DeviceController.prototype, "getServiceStatus", null);
__decorate([
    (0, common_1.Post)('api/service/start'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DeviceController.prototype, "startService", null);
__decorate([
    (0, common_1.Post)('api/service/stop'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DeviceController.prototype, "stopService", null);
__decorate([
    (0, common_1.Delete)('api/devices/:deviceId/config'),
    __param(0, (0, common_1.Param)('deviceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DeviceController.prototype, "deleteDeviceConfig", null);
exports.DeviceController = DeviceController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [device_service_1.DeviceService,
        bank_service_1.BankService])
], DeviceController);
//# sourceMappingURL=device.controller.js.map