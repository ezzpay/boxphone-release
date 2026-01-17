import { Logger } from '@nestjs/common';
import { DeviceService } from '../../device/device.service';
import { IAnalyzeTransferBillResult, IBankService } from '../interfaces/bank-service.interface';
import { Withdrawal } from '../../../common/interfaces/withdrawal.interface';
import { ICaptureScreenOptions, IHCSwipeOptions, IPandaSwipeOptions, IWebSocketService } from '@/common/modules/websocket/interface/websocket.interface';
import { OCRService } from '@/modules/ocr/services/ocr.service';
import { ImagePreprocessingService, ROI } from '@/modules/ocr/services/image-preprocessing.service';
import { DeviceConfig } from '@/modules/device/dto/device-config.dto';
export interface ScreenVerificationConfig {
    expectedTexts?: string[];
    unexpectedTexts?: string[];
    timeout?: number;
    pollInterval?: number;
    roi?: ROI;
    fieldType?: 'singleLine' | 'block' | 'full';
    preprocess?: {
        grayscale?: boolean;
        enhanceContrast?: boolean;
    };
}
export declare abstract class BaseBankService implements IBankService {
    protected readonly wsService: IWebSocketService;
    protected readonly deviceService: DeviceService;
    protected ocrService: OCRService;
    protected readonly imagePreprocessingService: ImagePreprocessingService;
    protected readonly logger: Logger;
    protected abstract readonly BANK_CODE: string;
    protected abstract readonly BUNDLE_ID: string;
    protected readonly baseTransactionFolderPath = "C:/EasyData";
    protected readonly baseTransactionExecutionFolder = "C:/EasyTrx";
    private static folderCreationInProgress;
    private static folderCreated;
    constructor(wsService: IWebSocketService, deviceService: DeviceService, ocrService: OCRService, imagePreprocessingService: ImagePreprocessingService);
    private static createTransactionFolder;
    getBankCode(): string;
    killApp(deviceId: string): Promise<void>;
    clickWithTransition(deviceId: string, x: number, y: number, transitionTime: number, log?: string): Promise<void>;
    private cleanupFolder;
    protected verifyScreenState(deviceId: string, config: ScreenVerificationConfig): Promise<boolean>;
    getLatestImagePath(folderPath: string, timeout?: number, pollInterval?: number): Promise<string | null>;
    detectScreenByHint(deviceId: string, screenHints: Array<{
        name: string;
        hint: string;
    }>, config: Pick<ScreenVerificationConfig, 'timeout' | 'pollInterval' | 'roi' | 'preprocess'>): Promise<{
        name: string;
        hint: string;
    } | null>;
    protected clickAndWaitForScreen(deviceId: string, x: number, y: number, screenConfig: ScreenVerificationConfig, log?: string): Promise<boolean>;
    protected swipeAndWaitForScreen(deviceId: string, swipeOptions: IHCSwipeOptions | IPandaSwipeOptions, screenConfig: ScreenVerificationConfig, log?: string): Promise<boolean>;
    createBillFolder(folderPath: string): Promise<void>;
    captureScreen(deviceId: string, options: ICaptureScreenOptions): Promise<void>;
    getBillImagePath(folderPath: string, timeout?: number, pollInterval?: number): Promise<string | null>;
    analyzeTransferBill(bankCode: string, withdrawal: Partial<Withdrawal>): Promise<IAnalyzeTransferBillResult>;
    createQRCodeAndTransferTo(deviceId: string, withdrawal: Withdrawal): Promise<void>;
    abstract login(deviceId: string): Promise<void>;
    abstract launchApp(deviceId: string): Promise<void>;
    abstract executeTransferWithQRCode(withdrawal: Withdrawal, deviceConfig: DeviceConfig): Promise<void>;
    abstract goToHomeScreenFromBill(deviceConfig: DeviceConfig): Promise<void>;
}
