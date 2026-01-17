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
exports.RedisLockService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../../common/services/redis.service");
const crypto_1 = require("crypto");
const UNLOCK_SCRIPT = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
else
  return 0
end
`;
let RedisLockService = class RedisLockService {
    constructor(redisService) {
        this.redisService = redisService;
        this.logger = new common_1.Logger('RedisLockService');
        this.DEFAULT_LOCK_TTL = 3 * 60 * 1000;
    }
    async acquireLock(key, ttl = this.DEFAULT_LOCK_TTL) {
        try {
            const lockId = (0, crypto_1.randomUUID)();
            const ttlSeconds = Math.ceil(ttl / 1000);
            const client = await this.redisService.getClient();
            const result = await client.set(key, lockId, 'EX', ttlSeconds, 'NX');
            return result === 'OK';
        }
        catch (error) {
            return false;
        }
    }
    async releaseLock(key) {
        try {
            const client = await this.redisService.getClient();
            const lockId = await client.get(key);
            if (!lockId) {
                return;
            }
            const result = await client.eval(UNLOCK_SCRIPT, 1, key, lockId);
            if (result === 1) {
                this.logger.log(`Released lock (lockId: ${key}:${lockId})`);
            }
            else {
                this.logger.warn(`Lock was already released or changed (expected lockId: ${key}:${lockId})`);
            }
        }
        catch (error) {
            this.logger.error(`Error releasing lock: ${key} ${error.message}`, error.stack);
        }
    }
    async getLock(key) {
        try {
            const lockId = await this.redisService.get(key);
            return lockId ?? null;
        }
        catch (error) {
            this.logger.error(`[${key}] Error getting lock: ${error.message}`);
            return null;
        }
    }
    async isLocked(key) {
        try {
            const lockId = await this.getLock(key);
            return !!lockId;
        }
        catch (error) {
            this.logger.error(`[${key}] Error checking lock status: ${error.message}`);
            return false;
        }
    }
};
exports.RedisLockService = RedisLockService;
exports.RedisLockService = RedisLockService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], RedisLockService);
//# sourceMappingURL=redis-lock.service.js.map