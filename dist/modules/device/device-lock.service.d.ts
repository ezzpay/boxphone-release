import { RedisService } from '../../common/services/redis.service';
export type DeviceLockType = 'login' | 'transfer';
export interface DeviceLock {
    deviceId: string;
    lockType: DeviceLockType;
    lockedAt: number;
    lockedBy: string;
    ttl: number;
    lockId: string;
}
export declare class DeviceLockService {
    private readonly redisService;
    private readonly logger;
    private readonly REDIS_LOCK_PREFIX;
    private readonly DEFAULT_LOCK_TTL;
    constructor(redisService: RedisService);
    acquireLock(deviceId: string, lockType: DeviceLockType, lockedBy: string, ttl?: number): Promise<boolean>;
    releaseLock(deviceId: string): Promise<void>;
    getLock(deviceId: string): Promise<DeviceLock | null>;
    isLocked(deviceId: string, excludeType?: DeviceLockType): Promise<boolean>;
    extendLock(deviceId: string, additionalTtl: number): Promise<boolean>;
    releaseLockByType(deviceId: string, lockType: DeviceLockType): Promise<boolean>;
    hasAnyLockKeys(): Promise<number>;
}
