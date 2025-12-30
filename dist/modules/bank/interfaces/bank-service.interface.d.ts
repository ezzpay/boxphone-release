import { ICaptureScreenOptions } from '@/common/modules/websocket/interface/websocket.interface';
import { Withdrawal } from '../../../common/interfaces/withdrawal.interface';
export interface IAnalyzeTransferBillResult {
    raw: string | null;
    analyzedStatus: 'success' | 'pending' | 'unknown';
    success: boolean;
}
export interface IBankService {
    getBankCode(): string;
    launchApp(deviceId: string): Promise<void>;
    killApp(deviceId: string): Promise<void>;
    login(deviceId: string): Promise<void>;
    executeInternalTransfer(withdrawal: Withdrawal, deviceId: string): Promise<void>;
    executeExternalTransfer(withdrawal: Withdrawal, deviceId: string): Promise<void>;
    executeTransfer(withdrawal: Withdrawal, deviceId: string): Promise<void>;
    captureScreen(deviceId: string, options: ICaptureScreenOptions): Promise<void>;
    analyzeTransferBill(withdrawal: Withdrawal): Promise<IAnalyzeTransferBillResult>;
    getBillImage(withdrawalCode: string): Promise<string | null>;
}
