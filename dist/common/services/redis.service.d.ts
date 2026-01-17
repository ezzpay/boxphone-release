import { OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
export declare class RedisService implements OnModuleDestroy {
    private readonly logger;
    private redisClient;
    constructor();
    getClient(): Promise<Redis>;
    disconnect(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttl?: number): Promise<'OK'>;
    setex(key: string, ttl: number, value: string): Promise<'OK'>;
    del(key: string): Promise<number>;
    exists(key: string): Promise<number>;
    zadd(key: string, score: number, member: string): Promise<number>;
    zrange(key: string, start: number, stop: number): Promise<string[]>;
    zrangebyscore(key: string, min: number | string, max: number | string, limit?: {
        offset: number;
        count: number;
    }): Promise<string[]>;
    zrem(key: string, ...members: string[]): Promise<number>;
    sadd(key: string, ...members: string[]): Promise<number>;
    sismember(key: string, member: string): Promise<number>;
    hset(key: string, field: string, value: string): Promise<number>;
    hget(key: string, field: string): Promise<string | null>;
    hgetall(key: string): Promise<Record<string, string>>;
    expire(key: string, ttl: number): Promise<number>;
    keys(pattern: string): Promise<string[]>;
    setnx(key: string, value: string, ttl?: number): Promise<string | null>;
    pickFromZSet(key: string, numberOfJobs?: number): Promise<{
        jobId: string;
        score: string;
    }[]>;
}
