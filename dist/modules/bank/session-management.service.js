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
exports.SessionManagementService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../../common/services/redis.service");
let SessionManagementService = class SessionManagementService {
    constructor(redisService) {
        this.redisService = redisService;
        this.logger = new common_1.Logger('SessionManagementService');
        this.REDIS_SESSION_PREFIX = 'bank:session:';
        this.BANK_SESSION_CONFIGS = new Map([
            [
                'ACB',
                {
                    bankCode: 'ACB',
                    sessionTimeoutMs: 15 * 60 * 1000,
                    refreshBeforeMs: 1 * 60 * 1000,
                },
            ],
            [
                'PGBANK',
                {
                    bankCode: 'PGBANK',
                    sessionTimeoutMs: 4.5 * 60 * 1000,
                    refreshBeforeMs: 30 * 1000,
                },
            ],
            [
                'HDBANK',
                {
                    bankCode: 'HDBANK',
                    sessionTimeoutMs: 7.5 * 60 * 1000,
                    refreshBeforeMs: 30 * 1000,
                },
            ],
        ]);
    }
    getSessionTimeout(bankCode) {
        const config = this.BANK_SESSION_CONFIGS.get(bankCode.toUpperCase());
        return config?.sessionTimeoutMs || 4.5 * 60 * 1000;
    }
    getRefreshBeforeTime(bankCode) {
        const config = this.BANK_SESSION_CONFIGS.get(bankCode.toUpperCase());
        return config?.refreshBeforeMs || 30 * 1000;
    }
    async recordLogin(deviceId, bankCode) {
        const timeout = this.getSessionTimeout(bankCode);
        const expiresAt = Date.now() + timeout;
        const session = {
            deviceId,
            bankCode: bankCode.toUpperCase(),
            loginTime: Date.now(),
            expiresAt,
            status: 'logged_in',
        };
        const key = `${this.REDIS_SESSION_PREFIX}${deviceId}:${bankCode.toUpperCase()}`;
        await this.redisService.set(key, JSON.stringify(session), timeout);
        this.logger.log(`[${deviceId}] Recorded login session (bank: ${bankCode}, expires at: ${new Date(expiresAt).toISOString()})`);
    }
    async markLoggingIn(deviceId, bankCode) {
        const key = `${this.REDIS_SESSION_PREFIX}${deviceId}:${bankCode.toUpperCase()}`;
        const existing = await this.getSession(deviceId, bankCode);
        const session = {
            deviceId,
            bankCode: bankCode.toUpperCase(),
            loginTime: existing?.loginTime || Date.now(),
            expiresAt: existing?.expiresAt || Date.now() + this.getSessionTimeout(bankCode),
            status: 'logging_in',
        };
        await this.redisService.set(key, JSON.stringify(session), 5 * 60 * 1000);
        this.logger.log(`Marked device ${deviceId}, bank ${bankCode} as logging in`);
    }
    async getSession(deviceId, bankCode) {
        try {
            const key = `${this.REDIS_SESSION_PREFIX}${deviceId}:${bankCode.toUpperCase()}`;
            const data = await this.redisService.get(key);
            if (!data) {
                return null;
            }
            return JSON.parse(data);
        }
        catch (error) {
            this.logger.error(`Error getting session for device ${deviceId}, bank ${bankCode}: ${error.message}`);
            return null;
        }
    }
    async isSessionValid(deviceId, bankCode) {
        const session = await this.getSession(deviceId, bankCode);
        if (!session) {
            return false;
        }
        if (session.expiresAt < Date.now()) {
            return false;
        }
        if (session.status === 'logging_in') {
            return false;
        }
        return session.status === 'logged_in';
    }
    async needsRefresh(deviceId, bankCode) {
        const session = await this.getSession(deviceId, bankCode);
        if (!session || session.status !== 'logged_in') {
            return false;
        }
        const refreshBeforeTime = this.getRefreshBeforeTime(bankCode);
        const timeUntilExpiry = session.expiresAt - Date.now();
        return timeUntilExpiry <= refreshBeforeTime;
    }
    async clearSession(deviceId, bankCode) {
        const key = `${this.REDIS_SESSION_PREFIX}${deviceId}:${bankCode.toUpperCase()}`;
        await this.redisService.del(key);
        this.logger.log(`Cleared session for device ${deviceId}, bank ${bankCode}`);
    }
};
exports.SessionManagementService = SessionManagementService;
exports.SessionManagementService = SessionManagementService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], SessionManagementService);
//# sourceMappingURL=session-management.service.js.map