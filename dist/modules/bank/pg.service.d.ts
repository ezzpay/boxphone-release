import { Withdrawal } from '../../common/interfaces/withdrawal.interface';
import { DeviceService } from '../device/device.service';
import { BaseBankService } from './base/base-bank.service';
import { IWebSocketService } from '@/common/modules/websocket/interface/websocket.interface';
export declare class PgService extends BaseBankService {
    protected readonly wsService: IWebSocketService;
    protected readonly BANK_CODE = "PGBANK";
    protected readonly BUNDLE_ID = "pgbankApp.pgbank.com.vn";
    constructor(wsService: IWebSocketService, deviceService: DeviceService);
    private inputPasswordFromConfig;
    private inputSmartOTPFromConfig;
    login(deviceId: string): Promise<void>;
    executeTransfer(withdrawal: Withdrawal, deviceId: string, maxRetries?: number): Promise<void>;
    executeInternalTransfer(withdrawal: Withdrawal, deviceId: string): Promise<void>;
    executeExternalTransfer(withdrawal: Withdrawal, deviceId: string): Promise<void>;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): void;
}
