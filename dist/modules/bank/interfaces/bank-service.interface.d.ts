import { ICaptureScreenOptions } from '@/common/modules/websocket/interface/websocket.interface';
import { Withdrawal } from '../../../common/interfaces/withdrawal.interface';
import { DeviceConfig } from '@/modules/device/dto/device-config.dto';
export type BillAnalyzedStatus = 'success' | 'unknown' | 'na';
export interface IAnalyzeTransferBillResult {
    rawPath: string | null;
    analyzedStatus: BillAnalyzedStatus;
}
export interface IBankService {
    getBankCode(): string;
    launchApp(deviceId: string): Promise<void>;
    killApp(deviceId: string): Promise<void>;
    login(deviceId: string): Promise<void>;
    executeTransferWithQRCode(withdrawal: Withdrawal, deviceConfig: DeviceConfig): Promise<void>;
    captureScreen(deviceId: string, options: ICaptureScreenOptions): Promise<void>;
    analyzeTransferBill(bankCode: string, withdrawal: Withdrawal): Promise<IAnalyzeTransferBillResult>;
    createQRCodeAndTransferTo(deviceId: string, withdrawal: Withdrawal): Promise<void>;
    createBillFolder(folderPath: string): Promise<void>;
    getBillImagePath(folderPath: string, timeout?: number, pollInterval?: number): Promise<string | null>;
    goToHomeScreenFromBill(deviceConfig: DeviceConfig): Promise<void>;
}
