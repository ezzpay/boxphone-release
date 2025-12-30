import { AcbService } from './acb.service';
import { PgService } from './pg.service';
import { DeviceService } from '../device/device.service';
import { HcBoxService } from '../hcbox/hcbox.service';
import { Withdrawal } from '../../common/interfaces/withdrawal.interface';
import { IBankService, IAnalyzeTransferBillResult } from './interfaces/bank-service.interface';
import { SessionManagementService } from './session-management.service';
import { DeviceLockService } from '../device/device-lock.service';
export declare class BankService {
    private readonly acbService;
    private readonly pgService;
    private readonly deviceService;
    private readonly hcBoxService;
    private readonly sessionManagement;
    private readonly deviceLock;
    private readonly logger;
    private readonly bankServices;
    constructor(acbService: AcbService, pgService: PgService, deviceService: DeviceService, hcBoxService: HcBoxService, sessionManagement: SessionManagementService, deviceLock: DeviceLockService);
    private registerBankService;
    getBankService(bankCode: string): IBankService | null;
    getSupportedBanks(): string[];
    login(bankCode: string, deviceId: string, force?: boolean): Promise<void>;
    loginAllActiveBanks(): Promise<void>;
    executeTransfer(withdrawal: Withdrawal, deviceId: string, bankCode: string, skipLockCheck?: boolean, maxRetries?: number): Promise<boolean>;
    isSessionValid(deviceId: string, bankCode: string): Promise<boolean>;
    getBillImage(bankCode: string, withdrawalCode: string): Promise<string | null>;
    analyzeTransferBill(bankCode: string, withdrawal: Withdrawal): Promise<IAnalyzeTransferBillResult | null>;
    refreshSessionIfNeeded(deviceId: string, bankCode: string): Promise<boolean>;
}
