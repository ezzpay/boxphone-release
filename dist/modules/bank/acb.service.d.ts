import { Withdrawal } from '../../common/interfaces/withdrawal.interface';
import { DeviceService } from '../device/device.service';
import { BaseBankService } from './base/base-bank.service';
import { ICaptureScreenOptions, IWebSocketService } from '@/common/modules/websocket/interface/websocket.interface';
export declare class AcbService extends BaseBankService {
    protected readonly wsService: IWebSocketService;
    protected readonly BANK_CODE = "ACB";
    protected readonly BUNDLE_ID = "mobileapp.acb.com.vn";
    constructor(wsService: IWebSocketService, deviceService: DeviceService);
    captureScreen(deviceId: string, options: ICaptureScreenOptions): Promise<void>;
    clickPasswordField(deviceId: string): Promise<void>;
    inputPasswordFromConfig(deviceId: string): Promise<void>;
    clickLoginButton(deviceId: string): Promise<void>;
    login(deviceId: string): Promise<void>;
    executeTransfer(withdrawal: Withdrawal, deviceId: string): Promise<void>;
    executeInternalTransfer(withdrawal: Withdrawal, deviceId: string): Promise<void>;
    executeExternalTransfer(withdrawal: Withdrawal, deviceId: string): Promise<void>;
}
