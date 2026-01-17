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
exports.SessionRefreshScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const bank_service_1 = require("./bank.service");
const device_service_1 = require("../device/device.service");
const session_management_service_1 = require("./session-management.service");
const redis_lock_service_1 = require("../redis-lock/redis-lock.service");
const lock_1 = require("../withdrawal/constants/lock");
let SessionRefreshScheduler = class SessionRefreshScheduler {
    constructor(bankService, deviceService, sessionManagement, redisLockService) {
        this.bankService = bankService;
        this.deviceService = deviceService;
        this.sessionManagement = sessionManagement;
        this.redisLockService = redisLockService;
        this.logger = new common_1.Logger('SessionRefreshScheduler');
    }
    async refreshSessions() {
        try {
            const isNeedRestartBoxphone = await this.redisLockService.getLock(lock_1.SYSTEM_LOCK_BOXPHONE);
            if (isNeedRestartBoxphone) {
                return;
            }
            const serviceStatus = await this.deviceService.getServiceStatus();
            if (serviceStatus !== 'active') {
                return;
            }
            const devices = await this.deviceService.listDevices();
            const activeDevices = devices.filter(device => device.status === 'active' && device.bankCode);
            for (const device of activeDevices) {
                const bankCode = device.bankCode.toUpperCase();
                try {
                    await this.bankService.refreshSessionIfNeeded(device.udid, bankCode);
                }
                catch (error) {
                    this.logger.error(`Error refreshing session for device ${device.udid}, bank ${bankCode}: ${error.message}`);
                }
            }
        }
        catch (error) {
            this.logger.error(`Error in session refresh scheduler: ${error.message}`);
        }
    }
};
exports.SessionRefreshScheduler = SessionRefreshScheduler;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_30_SECONDS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SessionRefreshScheduler.prototype, "refreshSessions", null);
exports.SessionRefreshScheduler = SessionRefreshScheduler = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [bank_service_1.BankService,
        device_service_1.DeviceService,
        session_management_service_1.SessionManagementService,
        redis_lock_service_1.RedisLockService])
], SessionRefreshScheduler);
//# sourceMappingURL=session-refresh.scheduler.js.map