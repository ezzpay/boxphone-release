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
exports.WithdrawalService = void 0;
const common_1 = require("@nestjs/common");
const bank_service_1 = require("../bank/bank.service");
const device_service_1 = require("../device/device.service");
const redis_service_1 = require("../../common/services/redis.service");
const websocket_1 = require("../../common/modules/websocket/constants/websocket");
const withdrawal_errors_1 = require("./withdrawal-errors");
const notification_service_1 = require("../notifiction/notification.service");
const rxjs_1 = require("rxjs");
const config_1 = require("../../common/constants/config");
const axios_1 = require("@nestjs/axios");
let WithdrawalService = class WithdrawalService {
    constructor(wsService, bankService, deviceService, redisService, notificationService, httpService) {
        this.wsService = wsService;
        this.bankService = bankService;
        this.deviceService = deviceService;
        this.redisService = redisService;
        this.notificationService = notificationService;
        this.httpService = httpService;
        this.logger = new common_1.Logger('WithdrawalService');
        this.REDIS_PROCESSED_PREFIX = 'withdrawal:processed:';
        this.PROCESSING_TTL = 86400 * 1000 * 3;
        this.COMPLETED_TTL = 86400 * 1000 * 3;
    }
    async checkIfProcessed(withdrawalId) {
        try {
            const key = `${this.REDIS_PROCESSED_PREFIX}${withdrawalId}`;
            const status = await this.redisService.get(key);
            if (status === 'completed') {
                this.logger.warn(`Withdrawal ${withdrawalId} already completed`);
                return true;
            }
            if (status === 'processing') {
                this.logger.warn(`Withdrawal ${withdrawalId} is being processed by another instance`);
                return true;
            }
            return false;
        }
        catch (error) {
            this.logger.error(`Error checking processed status for ${withdrawalId}: ${error.message}`);
            return false;
        }
    }
    async markAsProcessing(withdrawalId) {
        try {
            const key = `${this.REDIS_PROCESSED_PREFIX}${withdrawalId}`;
            const result = await this.redisService.setnx(key, 'processing', this.PROCESSING_TTL);
            if (result === 'OK') {
                this.logger.debug(`Marked withdrawal ${withdrawalId} as processing`);
                return true;
            }
            this.logger.warn(`Withdrawal ${withdrawalId} is already being processed by another instance`);
            return false;
        }
        catch (error) {
            this.logger.error(`Error marking withdrawal ${withdrawalId} as processing: ${error.message}`);
            return true;
        }
    }
    async markAsCompleted(withdrawalId) {
        try {
            const key = `${this.REDIS_PROCESSED_PREFIX}${withdrawalId}`;
            await this.redisService.set(key, 'completed', this.COMPLETED_TTL);
            this.logger.log(`Marked withdrawal ${withdrawalId} as completed`);
        }
        catch (error) {
            this.logger.error(`Error marking withdrawal ${withdrawalId} as completed: ${error.message}`);
        }
    }
    async markAsFailed(withdrawalId) {
        try {
            const key = `${this.REDIS_PROCESSED_PREFIX}${withdrawalId}`;
            await this.redisService.del(key);
            this.logger.log(`Marked withdrawal ${withdrawalId} as failed (removed from processed list)`);
        }
        catch (error) {
            this.logger.error(`Error marking withdrawal ${withdrawalId} as failed: ${error.message}`);
        }
    }
    async processWithdrawal(withdrawal, deviceConfig) {
        const { withdrawalId, bankCode, amount } = withdrawal;
        const isProcessed = await this.checkIfProcessed(withdrawalId);
        if (isProcessed) {
            this.logger.warn(`Withdrawal ${withdrawalId} already processed or being processed, skipping`);
            return;
        }
        const markAsProcessing = await this.markAsProcessing(withdrawalId);
        if (!markAsProcessing) {
            const reason = `Withdrawal ${withdrawalId} is being processed by another instance`;
            this.logger.warn(reason);
            throw new withdrawal_errors_1.WithdrawalProcessingError(reason, withdrawal_errors_1.ErrorType.TEMPORARY, 'Failed: Mark as processing');
        }
        try {
            this.logger.log(`[${deviceConfig.accountName}] Processing withdrawal: ${withdrawalId} for bank: ${bankCode}, amount: ${amount}`);
            if (deviceConfig.availableAmount < amount) {
                const reason = `[${deviceConfig.accountName}] Assigned device has insufficient amount. Available: ${deviceConfig.availableAmount}, Required: ${amount}`;
                this.logger.error(reason);
                await this.markAsFailed(withdrawalId);
                await this.deviceService.updateDeviceConfig(deviceConfig.deviceId, { status: 'deactive' });
                throw new withdrawal_errors_1.WithdrawalProcessingError(reason, withdrawal_errors_1.ErrorType.TEMPORARY, 'Failed: Source account is insufficient');
            }
            await this.bankService.executeTransferWithQRCode(withdrawal, deviceConfig, deviceConfig.bankCode);
            this.deviceService.deductDeviceAmount(deviceConfig.deviceId, amount).catch(() => { });
            const analysisResult = await this.bankService.analyzeTransferBill(deviceConfig.bankCode, withdrawal);
            this.notificationService.completeWithdrawal(withdrawal, analysisResult, deviceConfig).catch(() => { });
            if (analysisResult.analyzedStatus === 'unknown') {
                await this.bankService.login(deviceConfig.bankCode, deviceConfig.deviceId, true);
            }
            await this.bankService.goToHomeScreenFromBill(deviceConfig);
            await this.markAsCompleted(withdrawalId);
            this.logger.log(`Successfully processed withdrawal: ${withdrawalId}`);
        }
        catch (error) {
            await this.markAsFailed(withdrawalId);
            throw error;
        }
    }
    async getWithdrawalDetails(id) {
        const url = `${config_1.config.ezpayBe.apiUrl}/api/internal/withdrawals/${id}`;
        const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, {
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': config_1.config.ezpayBe.apiKey,
                'x-internal-secret-key': config_1.config.ezpayBe.apiKey,
            },
            timeout: 20000,
        }));
        return response.data.data;
    }
};
exports.WithdrawalService = WithdrawalService;
exports.WithdrawalService = WithdrawalService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(websocket_1.WEBSOCKET_SERVICE)),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => device_service_1.DeviceService))),
    __metadata("design:paramtypes", [Object, bank_service_1.BankService,
        device_service_1.DeviceService,
        redis_service_1.RedisService,
        notification_service_1.NotificationService,
        axios_1.HttpService])
], WithdrawalService);
//# sourceMappingURL=withdrawal.service.js.map