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
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
const config_1 = require("../constants/config");
let RedisService = class RedisService {
    constructor() {
        this.logger = new common_1.Logger('RedisService');
        this.redisClient = null;
    }
    async getClient() {
        if (this.redisClient) {
            return this.redisClient;
        }
        const host = config_1.config.redis.host ?? 'localhost';
        const port = config_1.config.redis.port ?? 6379;
        const password = config_1.config.redis.password ?? undefined;
        const db = config_1.config.redis.db ?? 3;
        this.redisClient = new ioredis_1.default({
            host,
            port,
            password,
            db,
            enableReadyCheck: false,
            maxRetriesPerRequest: null,
            lazyConnect: true,
        });
        this.redisClient.on('error', (err) => {
            this.logger.error('Redis Client Error', err.stack || err.message);
        });
        this.redisClient.on('connect', () => {
            this.logger.log('Redis Client Connected');
        });
        this.redisClient.on('ready', () => {
            this.logger.log('Redis Client Ready');
        });
        this.redisClient.on('close', () => {
            this.logger.warn('Redis Client Connection Closed');
        });
        this.redisClient.on('reconnecting', () => {
            this.logger.log('Redis Client Reconnecting...');
        });
        await this.redisClient.connect();
        return this.redisClient;
    }
    async disconnect() {
        if (this.redisClient) {
            await this.redisClient.disconnect();
            this.redisClient = null;
            this.logger.log('Redis Client Disconnected');
        }
    }
    async onModuleDestroy() {
        await this.disconnect();
    }
    async get(key) {
        const client = await this.getClient();
        return client.get(key);
    }
    async set(key, value, ttl) {
        const client = await this.getClient();
        if (ttl) {
            const ttlSeconds = Math.ceil(ttl / 1000);
            return client.setex(key, ttlSeconds, value);
        }
        return client.set(key, value);
    }
    async setex(key, ttl, value) {
        const client = await this.getClient();
        const ttlSeconds = Math.ceil(ttl / 1000);
        return client.setex(key, ttlSeconds, value);
    }
    async del(key) {
        const client = await this.getClient();
        return client.del(key);
    }
    async exists(key) {
        const client = await this.getClient();
        return client.exists(key);
    }
    async zadd(key, score, member) {
        const client = await this.getClient();
        return client.zadd(key, score, member);
    }
    async zrange(key, start, stop) {
        const client = await this.getClient();
        return client.zrange(key, start, stop);
    }
    async zrangebyscore(key, min, max, limit) {
        const client = await this.getClient();
        if (limit) {
            return client.zrangebyscore(key, min, max, 'LIMIT', limit.offset, limit.count);
        }
        return client.zrangebyscore(key, min, max);
    }
    async zrem(key, ...members) {
        const client = await this.getClient();
        return client.zrem(key, ...members);
    }
    async sadd(key, ...members) {
        const client = await this.getClient();
        return client.sadd(key, ...members);
    }
    async sismember(key, member) {
        const client = await this.getClient();
        return client.sismember(key, member);
    }
    async hset(key, field, value) {
        const client = await this.getClient();
        return client.hset(key, field, value);
    }
    async hget(key, field) {
        const client = await this.getClient();
        return client.hget(key, field);
    }
    async hgetall(key) {
        const client = await this.getClient();
        return client.hgetall(key);
    }
    async expire(key, ttl) {
        const client = await this.getClient();
        return client.expire(key, ttl);
    }
    async keys(pattern) {
        const client = await this.getClient();
        const keys = [];
        let cursor = '0';
        do {
            const result = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
            cursor = result[0];
            keys.push(...result[1]);
        } while (cursor !== '0');
        return keys;
    }
    async setnx(key, value, ttl) {
        const client = await this.getClient();
        if (ttl) {
            const ttlSeconds = Math.ceil(ttl / 1000);
            const result = await client.set(key, value, 'EX', ttlSeconds, 'NX');
            return result;
        }
        const result = await client.set(key, value, 'NX');
        return result;
    }
    async pickFromZSet(key, numberOfJobs = 1) {
        const client = await this.getClient();
        const jobs = await client.zrange(key, 0, numberOfJobs - 1, 'WITHSCORES');
        if (!jobs || jobs.length === 0) {
            return [];
        }
        const result = [];
        for (let i = 0; i < jobs.length; i += 2) {
            result.push({
                jobId: jobs[i],
                score: jobs[i + 1]
            });
        }
        return result;
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], RedisService);
//# sourceMappingURL=redis.service.js.map