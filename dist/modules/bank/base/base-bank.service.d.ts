import { Logger } from '@nestjs/common';
import { DeviceService } from '../../device/device.service';
import { IAnalyzeTransferBillResult, IBankService } from '../interfaces/bank-service.interface';
import { Withdrawal } from '../../../common/interfaces/withdrawal.interface';
import { ICaptureScreenOptions, IWebSocketService } from '@/common/modules/websocket/interface/websocket.interface';
export declare abstract class BaseBankService implements IBankService {
    protected readonly wsService: IWebSocketService;
    protected readonly deviceService: DeviceService;
    protected readonly logger: Logger;
    protected abstract readonly BANK_CODE: string;
    protected abstract readonly BUNDLE_ID: string;
    protected readonly baseTransactionFolderPath = "C:/EzpData";
    private static folderCreationInProgress;
    private static folderCreated;
    constructor(wsService: IWebSocketService, deviceService: DeviceService);
    private static createTransactionFolder;
    getBankCode(): string;
    launchApp(deviceId: string, maxRetries?: number): Promise<void>;
    killApp(deviceId: string, maxRetries?: number): Promise<void>;
    clickWithTransition(deviceId: string, x: number, y: number, transitionTime: number, log?: string): Promise<void>;
    captureScreen(deviceId: string, options: ICaptureScreenOptions): Promise<void>;
    getBillImage(folderPath: string): Promise<string | null>;
    analyzeTransferBill(withdrawal: Partial<Withdrawal>): Promise<IAnalyzeTransferBillResult>;
    abstract login(deviceId: string): Promise<void>;
    abstract executeInternalTransfer(withdrawal: Withdrawal, deviceId: string): Promise<void>;
    abstract executeExternalTransfer(withdrawal: Withdrawal, deviceId: string): Promise<void>;
    abstract executeTransfer(withdrawal: Withdrawal, deviceId: string): Promise<void>;
}
