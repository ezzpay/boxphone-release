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
exports.DeviceService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../../common/services/redis.service");
const websocket_1 = require("../../common/modules/websocket/constants/websocket");
const device_lock_service_1 = require("./device-lock.service");
const bank_service_1 = require("../bank/bank.service");
const lodash_1 = require("lodash");
let DeviceService = class DeviceService {
    constructor(redisService, wsService, deviceLockService, bankService) {
        this.redisService = redisService;
        this.wsService = wsService;
        this.deviceLockService = deviceLockService;
        this.bankService = bankService;
        this.logger = new common_1.Logger('DeviceService');
        this.REDIS_DEVICE_CONFIG_PREFIX = 'device:';
        this.REDIS_DEVICE_CONFIG_SUFFIX = ':config';
        this.REDIS_SERVICE_STATUS_KEY = 'service:status';
    }
    async onModuleInit() {
        try {
            await this.setServiceStatus('inactive');
            this.logger.log('Service status initialized to: inactive');
        }
        catch (error) {
            this.logger.error(`Failed to initialize service status: ${error.message}`);
        }
    }
    async listDeviceConfigs() {
        try {
            const pattern = `${this.REDIS_DEVICE_CONFIG_PREFIX}*${this.REDIS_DEVICE_CONFIG_SUFFIX}`;
            const keys = await this.redisService.keys(pattern);
            if (keys.length === 0) {
                return [];
            }
            const configs = await Promise.all(keys.map(async (key) => {
                try {
                    const data = await this.redisService.get(key);
                    if (!data) {
                        return null;
                    }
                    return JSON.parse(data);
                }
                catch (error) {
                    this.logger.error(`Error parsing config for key ${key}: ${error.message}`);
                    return null;
                }
            }));
            return configs.filter((config) => !(0, lodash_1.isNil)(config));
        }
        catch (error) {
            this.logger.error(`Error listing device configs: ${error.message}`);
            return [];
        }
    }
    async listDevices() {
        try {
            const devices = await this.wsService.listDevices();
            const devicesWithConfig = await Promise.all(devices.map(async (device) => {
                const config = await this.getDeviceConfig(device.udid);
                return {
                    ...device,
                    bankCode: config?.bankCode || '',
                    availableAmount: config?.availableAmount || 0,
                    status: config?.status || 'deactive',
                    password: config?.password || '',
                    smartOTP: config?.smartOTP || '',
                    accountNo: config?.accountNo || '',
                    accountName: config?.accountName || '',
                };
            }));
            return devicesWithConfig;
        }
        catch (error) {
            this.logger.error(`Error listing devices: ${error.message}`);
            return [];
        }
    }
    async getDeviceConfig(deviceId) {
        try {
            const key = `${this.REDIS_DEVICE_CONFIG_PREFIX}${deviceId}${this.REDIS_DEVICE_CONFIG_SUFFIX}`;
            const data = await this.redisService.get(key);
            if (!data) {
                return null;
            }
            return JSON.parse(data);
        }
        catch (error) {
            this.logger.error(`Error getting device config for ${deviceId}: ${error.message}`);
            return null;
        }
    }
    async getDeviceConfigSafe(deviceId) {
        try {
            const config = await this.getDeviceConfig(deviceId);
            if (!config) {
                return null;
            }
            return {
                ...config,
                password: config.password ? '' : undefined,
                smartOTP: config.smartOTP ? '' : undefined,
            };
        }
        catch (error) {
            this.logger.error(`Error getting safe device config for ${deviceId}: ${error.message}`);
            return null;
        }
    }
    async updateDeviceConfig(deviceId, dto) {
        try {
            const key = `${this.REDIS_DEVICE_CONFIG_PREFIX}${deviceId}${this.REDIS_DEVICE_CONFIG_SUFFIX}`;
            const existing = await this.getDeviceConfig(deviceId);
            const hasExistingConfig = existing?.password || existing?.smartOTP;
            const password = hasExistingConfig
                ? (existing?.password || '')
                : (dto.password !== undefined ? dto.password : '');
            const smartOTP = hasExistingConfig
                ? (existing?.smartOTP || '')
                : (dto.smartOTP !== undefined ? dto.smartOTP : '');
            const config = {
                deviceId,
                bankCode: dto.bankCode !== undefined ? dto.bankCode : existing?.bankCode || '',
                availableAmount: dto.availableAmount !== undefined ? dto.availableAmount : existing?.availableAmount || 0,
                status: dto.status !== undefined ? dto.status : existing?.status || 'deactive',
                password,
                smartOTP,
                accountNo: dto.accountNo !== undefined ? dto.accountNo : existing?.accountNo || '',
                accountName: dto.accountName !== undefined ? dto.accountName : existing?.accountName || '',
            };
            await this.redisService.set(key, JSON.stringify(config));
            this.logger.log(`[${deviceId}] Updated device config (bankCode: ${config.bankCode || 'not set'}): ${JSON.stringify((0, lodash_1.omit)(config, ['password', 'smartOTP']))}`);
            return config;
        }
        catch (error) {
            this.logger.error(`[${deviceId}] Error updating device config: ${error.message}`);
            throw error;
        }
    }
    async deleteDeviceConfig(deviceId) {
        try {
            const key = `${this.REDIS_DEVICE_CONFIG_PREFIX}${deviceId}${this.REDIS_DEVICE_CONFIG_SUFFIX}`;
            await this.redisService.del(key);
            this.logger.log(`[${deviceId}] Deleted device config`);
        }
        catch (error) {
            this.logger.error(`[${deviceId}] Error deleting device config: ${error.message}`);
            throw error;
        }
    }
    async getServiceStatus() {
        try {
            const status = await this.redisService.get(this.REDIS_SERVICE_STATUS_KEY);
            return status || 'inactive';
        }
        catch (error) {
            this.logger.error(`Error getting service status: ${error.message}`);
            return 'inactive';
        }
    }
    async setServiceStatus(status) {
        try {
            await this.redisService.set(this.REDIS_SERVICE_STATUS_KEY, status);
            this.logger.log(`Service status set to: ${status}`);
        }
        catch (error) {
            this.logger.error(`Error setting service status: ${error.message}`);
            throw error;
        }
    }
    async startService() {
        try {
            const hasActiveDevice = await this.hasActiveDevice();
            if (!hasActiveDevice) {
                throw new common_1.HttpException({
                    success: false,
                    error: 'Vui lòng active bank trước khi start',
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            this.bankService.loginAllActiveBanks().catch(err => {
                this.logger.error(`Error during background login process: ${err.message}`);
            });
            await new Promise(resolve => setTimeout(resolve, 2000));
            await this.setServiceStatus('active');
            return {
                success: true,
                message: 'Service started successfully. Devices are logging in and will accept jobs when ready.',
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            this.logger.error(`Error starting service: ${error.message}`, error.stack);
            throw new common_1.HttpException({
                success: false,
                error: error.message || 'Failed to start service',
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async deductDeviceAmount(deviceId, amount) {
        try {
            const config = await this.getDeviceConfig(deviceId);
            if (!config) {
                return false;
            }
            const newAmount = config.availableAmount - amount;
            if (newAmount < 0) {
                this.logger.warn(`Insufficient amount for device ${deviceId}. Available: ${config.availableAmount}, Requested: ${amount}`);
                return false;
            }
            await this.updateDeviceConfig(deviceId, { availableAmount: newAmount });
            return true;
        }
        catch (error) {
            this.logger.error(`Error deducting amount for device ${deviceId}: ${error.message}`);
            return false;
        }
    }
    async hasActiveDevice() {
        try {
            const devices = await this.listDevices();
            return devices.some(device => device.status === 'active');
        }
        catch (error) {
            this.logger.error(`Error checking active devices: ${error.message}`);
            return false;
        }
    }
    async getAvailableDevices() {
        try {
            const devices = await this.wsService.listDevices();
            const availableDevices = [];
            for (const device of devices) {
                const deviceConfig = await this.getDeviceConfig(device.udid);
                if (deviceConfig?.status !== 'active') {
                    continue;
                }
                const isLocked = await this.deviceLockService.isLocked(device.udid);
                if (isLocked) {
                    continue;
                }
                const hasValidSession = await this.bankService.isSessionValid(device.udid, deviceConfig.bankCode);
                if (!hasValidSession) {
                    this.logger.error(`[${device.udid}] Device does not have valid session for bank ${deviceConfig.bankCode}`);
                    continue;
                }
                availableDevices.push(deviceConfig);
            }
            return availableDevices;
        }
        catch (error) {
            this.logger.error(`Error getting available devices: ${error.message}`);
            return [];
        }
    }
};
exports.DeviceService = DeviceService;
exports.DeviceService = DeviceService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(websocket_1.WEBSOCKET_SERVICE)),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => bank_service_1.BankService))),
    __metadata("design:paramtypes", [redis_service_1.RedisService, Object, device_lock_service_1.DeviceLockService,
        bank_service_1.BankService])
], DeviceService);
//# sourceMappingURL=device.service.js.map