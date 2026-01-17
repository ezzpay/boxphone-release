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
exports.DeviceLockService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../../common/services/redis.service");
const crypto_1 = require("crypto");
const UNLOCK_SCRIPT = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  redis.call("DEL", KEYS[2])
  return redis.call("DEL", KEYS[1])
else
  return 0
end
`;
let DeviceLockService = class DeviceLockService {
    constructor(redisService) {
        this.redisService = redisService;
        this.logger = new common_1.Logger('DeviceLockService');
        this.REDIS_LOCK_PREFIX = 'device:lock:';
        this.DEFAULT_LOCK_TTL = 10 * 60 * 1000;
    }
    async acquireLock(deviceId, lockType, lockedBy, ttl = this.DEFAULT_LOCK_TTL) {
        try {
            const key = `${this.REDIS_LOCK_PREFIX}${deviceId}`;
            const metadataKey = `${this.REDIS_LOCK_PREFIX}${deviceId}:meta`;
            const lockId = (0, crypto_1.randomUUID)();
            const ttlSeconds = Math.ceil(ttl / 1000);
            const client = await this.redisService.getClient();
            const result = await client.set(key, lockId, 'EX', ttlSeconds, 'NX');
            if (result === 'OK') {
                const lockMetadata = {
                    deviceId,
                    lockType,
                    lockedAt: Date.now(),
                    lockedBy,
                    ttl,
                };
                await this.redisService.setex(metadataKey, ttlSeconds, JSON.stringify(lockMetadata));
                this.logger.log(`[${deviceId}] Acquired ${lockType} lock (${lockedBy}) with lockId ${lockId}`);
                return true;
            }
            this.logger.warn(`[${deviceId}] Device is already locked, cannot acquire lock`);
            return false;
        }
        catch (error) {
            this.logger.error(`[${deviceId}] Error acquiring lock: ${error.message}`);
            return false;
        }
    }
    async releaseLock(deviceId) {
        try {
            const key = `${this.REDIS_LOCK_PREFIX}${deviceId}`;
            const metadataKey = `${this.REDIS_LOCK_PREFIX}${deviceId}:meta`;
            const client = await this.redisService.getClient();
            const lockId = await client.get(key);
            if (!lockId) {
                await this.redisService.del(metadataKey);
                this.logger.debug(`[${deviceId}] Device is not locked, nothing to release`);
                return;
            }
            const result = await client.eval(UNLOCK_SCRIPT, 2, key, metadataKey, lockId);
            if (result === 1) {
                this.logger.log(`[${deviceId}] Released lock (lockId: ${lockId})`);
            }
            else {
                this.logger.warn(`[${deviceId}] Lock was already released or changed (expected lockId: ${lockId})`);
            }
        }
        catch (error) {
            this.logger.error(`[${deviceId}] Error releasing lock: ${error.message}`, error.stack);
        }
    }
    async getLock(deviceId) {
        try {
            const key = `${this.REDIS_LOCK_PREFIX}${deviceId}`;
            const lockId = await this.redisService.get(key);
            if (!lockId) {
                return null;
            }
            const metadataKey = `${this.REDIS_LOCK_PREFIX}${deviceId}:meta`;
            const metadataStr = await this.redisService.get(metadataKey);
            if (!metadataStr) {
                return {
                    deviceId,
                    lockType: 'transfer',
                    lockedAt: Date.now(),
                    lockedBy: 'unknown',
                    ttl: this.DEFAULT_LOCK_TTL,
                    lockId,
                };
            }
            const metadata = JSON.parse(metadataStr);
            return {
                ...metadata,
                lockId,
            };
        }
        catch (error) {
            this.logger.error(`[${deviceId}] Error getting lock: ${error.message}`);
            return null;
        }
    }
    async isLocked(deviceId, excludeType) {
        try {
            const key = `${this.REDIS_LOCK_PREFIX}${deviceId}`;
            const exists = await this.redisService.exists(key);
            if (!exists) {
                return false;
            }
            const lock = await this.getLock(deviceId);
            if (!lock) {
                return false;
            }
            if (excludeType && lock.lockType === excludeType) {
                return false;
            }
            return true;
        }
        catch (error) {
            this.logger.error(`[${deviceId}] Error checking lock status: ${error.message}`);
            return false;
        }
    }
    async extendLock(deviceId, additionalTtl) {
        try {
            const lock = await this.getLock(deviceId);
            if (!lock) {
                return false;
            }
            const key = `${this.REDIS_LOCK_PREFIX}${deviceId}`;
            const metadataKey = `${this.REDIS_LOCK_PREFIX}${deviceId}:meta`;
            const client = await this.redisService.getClient();
            const currentTtlSeconds = await client.ttl(key);
            if (currentTtlSeconds <= 0) {
                return false;
            }
            const newTtlSeconds = Math.ceil((currentTtlSeconds * 1000 + additionalTtl) / 1000);
            const expireResult = await client.expire(key, newTtlSeconds);
            if (expireResult === 1) {
                await this.redisService.expire(metadataKey, newTtlSeconds);
                this.logger.log(`[${deviceId}] Extended lock by ${additionalTtl}ms`);
                return true;
            }
            return false;
        }
        catch (error) {
            this.logger.error(`[${deviceId}] Error extending lock: ${error.message}`);
            return false;
        }
    }
    async releaseLockByType(deviceId, lockType) {
        try {
            const lock = await this.getLock(deviceId);
            if (!lock) {
                return false;
            }
            if (lock.lockType !== lockType) {
                return false;
            }
            const key = `${this.REDIS_LOCK_PREFIX}${deviceId}`;
            const metadataKey = `${this.REDIS_LOCK_PREFIX}${deviceId}:meta`;
            await this.redisService.del(key);
            await this.redisService.del(metadataKey);
            this.logger.log(`[${deviceId}] Force released ${lockType} lock`);
            return true;
        }
        catch (error) {
            this.logger.error(`[${deviceId}] Error releasing ${lockType} lock: ${error.message}`);
            return false;
        }
    }
    async hasAnyLockKeys() {
        try {
            const pattern = `${this.REDIS_LOCK_PREFIX}*`;
            const allKeys = await this.redisService.keys(pattern);
            const lockKeys = allKeys.filter(key => !key.endsWith(':meta'));
            return lockKeys.length;
        }
        catch (error) {
            this.logger.error(`Error getting all lock keys: ${error.message}`);
            return 0;
        }
    }
};
exports.DeviceLockService = DeviceLockService;
exports.DeviceLockService = DeviceLockService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], DeviceLockService);
//# sourceMappingURL=device-lock.service.js.map