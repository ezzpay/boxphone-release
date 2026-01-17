import { RedisService } from '../../common/services/redis.service';
export interface BankSessionConfig {
    bankCode: string;
    sessionTimeoutMs: number;
    refreshBeforeMs: number;
}
export interface DeviceSession {
    deviceId: string;
    bankCode: string;
    loginTime: number;
    expiresAt: number;
    status: 'logged_in' | 'logging_in' | 'expired';
}
export declare class SessionManagementService {
    private readonly redisService;
    private readonly logger;
    private readonly REDIS_SESSION_PREFIX;
    private readonly BANK_SESSION_CONFIGS;
    constructor(redisService: RedisService);
    getSessionTimeout(bankCode: string): number;
    getRefreshBeforeTime(bankCode: string): number;
    recordLogin(deviceId: string, bankCode: string): Promise<void>;
    markLoggingIn(deviceId: string, bankCode: string): Promise<void>;
    getSession(deviceId: string, bankCode: string): Promise<DeviceSession | null>;
    isSessionValid(deviceId: string, bankCode: string): Promise<boolean>;
    needsRefresh(deviceId: string, bankCode: string): Promise<boolean>;
    clearSession(deviceId: string, bankCode: string): Promise<void>;
}
