import { Withdrawal } from '../../common/interfaces/withdrawal.interface';
import { DeviceService } from '../device/device.service';
import { BaseBankService } from './base/base-bank.service';
import { ICaptureScreenOptions, IWebSocketService } from '@/common/modules/websocket/interface/websocket.interface';
import { OCRService } from '../ocr/services/ocr.service';
import { DeviceConfig } from '../device/dto/device-config.dto';
import { ImagePreprocessingService } from '../ocr/services/image-preprocessing.service';
export declare class AcbService extends BaseBankService {
    protected readonly wsService: IWebSocketService;
    protected readonly BANK_CODE = "ACB";
    protected readonly BUNDLE_ID = "mobileapp.acb.com.vn";
    constructor(wsService: IWebSocketService, deviceService: DeviceService, ocrService: OCRService, imagePreprocessingService: ImagePreprocessingService);
    launchApp(deviceId: string): Promise<void>;
    captureScreen(deviceId: string, options: ICaptureScreenOptions): Promise<void>;
    clickPasswordField(deviceId: string): Promise<void>;
    inputPasswordFromConfig(deviceId: string): Promise<void>;
    clickLoginButton(deviceId: string): Promise<void>;
    login(deviceId: string): Promise<void>;
    executeTransfer(withdrawal: Withdrawal, deviceId: string): Promise<void>;
    executeTransferWithQRCode(withdrawal: Withdrawal, deviceConfig: DeviceConfig): Promise<void>;
    executeInternalTransfer(withdrawal: Withdrawal, deviceId: string): Promise<void>;
    executeExternalTransfer(withdrawal: Withdrawal, deviceId: string): Promise<void>;
    goToHomeScreenFromBill(): Promise<void>;
}
