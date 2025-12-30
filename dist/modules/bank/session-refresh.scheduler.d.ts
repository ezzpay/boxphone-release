import { BankService } from './bank.service';
import { DeviceService } from '../device/device.service';
import { SessionManagementService } from './session-management.service';
export declare class SessionRefreshScheduler {
    private readonly bankService;
    private readonly deviceService;
    private readonly sessionManagement;
    private readonly logger;
    constructor(bankService: BankService, deviceService: DeviceService, sessionManagement: SessionManagementService);
    refreshSessions(): Promise<void>;
}
