import { RedisService } from '../../common/services/redis.service';
export declare class RedisLockService {
    private readonly redisService;
    private readonly logger;
    private readonly DEFAULT_LOCK_TTL;
    constructor(redisService: RedisService);
    acquireLock(key: string, ttl?: number): Promise<boolean>;
    releaseLock(key: string): Promise<void>;
    getLock(key: string): Promise<string | null>;
    isLocked(key: string): Promise<boolean>;
}
