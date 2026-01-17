import { IWebSocketService } from '@/common/modules/websocket/interface/websocket.interface';
import { Withdrawal } from '../../common/interfaces/withdrawal.interface';
import { DeviceService } from '../device/device.service';
import { BaseBankService } from './base/base-bank.service';
import { DeviceConfig } from '../device/dto/device-config.dto';
import { OCRService } from '../ocr/services/ocr.service';
import { ImagePreprocessingService } from '../ocr/services/image-preprocessing.service';
export declare class VietcombankService extends BaseBankService {
    protected readonly wsService: IWebSocketService;
    protected readonly BANK_CODE = "VIETCOMBANK";
    protected readonly BUNDLE_ID = "com.vcb.VCB";
    constructor(wsService: IWebSocketService, deviceService: DeviceService, ocrService: OCRService, imagePreprocessingService: ImagePreprocessingService);
    private inputPasswordFromConfig;
    private inputSmartOTPFromConfig;
    launchApp(deviceId: string): Promise<void>;
    login(deviceId: string): Promise<void>;
    executeTransferWithQRCode(withdrawal: Withdrawal, deviceConfig: DeviceConfig): Promise<void>;
    goToHomeScreenFromBill(): Promise<void>;
    extractTransactionAmount(imagePath: string): Promise<number | null>;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): void;
}
