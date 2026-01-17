import { Withdrawal } from '../../common/interfaces/withdrawal.interface';
import { DeviceService } from '../device/device.service';
import { BaseBankService } from './base/base-bank.service';
import { IWebSocketService } from '@/common/modules/websocket/interface/websocket.interface';
import { OCRService } from '../ocr/services/ocr.service';
import { DeviceConfig } from '../device/dto/device-config.dto';
import { TelegramService } from '../notifiction/telegram.service';
import { ImagePreprocessingService } from '../ocr/services/image-preprocessing.service';
export declare class PgService extends BaseBankService {
    protected readonly wsService: IWebSocketService;
    private readonly telegramService;
    protected readonly BANK_CODE = "PGBANK";
    protected readonly BUNDLE_ID = "pgbankApp.pgbank.com.vn";
    constructor(wsService: IWebSocketService, deviceService: DeviceService, ocrService: OCRService, imagePreprocessingService: ImagePreprocessingService, telegramService: TelegramService);
    private inputPasswordFromConfig;
    private inputSmartOTPFromConfig;
    launchApp(deviceId: string): Promise<void>;
    login(deviceId: string): Promise<void>;
    executeTransferWithQRCode(withdrawal: Withdrawal, deviceConfig: DeviceConfig): Promise<void>;
    goToHomeScreenFromBill(deviceConfig: DeviceConfig): Promise<void>;
    extractTransactionAmount(imagePath: string): Promise<number | null>;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): void;
}
