import { BankService } from './bank.service';
import { DeviceService } from '../device/device.service';
import { SessionManagementService } from './session-management.service';
import { RedisLockService } from '../redis-lock/redis-lock.service';
export declare class SessionRefreshScheduler {
    private readonly bankService;
    private readonly deviceService;
    private readonly sessionManagement;
    private readonly redisLockService;
    private readonly logger;
    constructor(bankService: BankService, deviceService: DeviceService, sessionManagement: SessionManagementService, redisLockService: RedisLockService);
    refreshSessions(): Promise<void>;
}
