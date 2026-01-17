"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VietcombankService = void 0;
const websocket_1 = require("../../common/modules/websocket/constants/websocket");
const time_1 = require("../../common/utils/time");
const common_1 = require("@nestjs/common");
const device_service_1 = require("../device/device.service");
const base_bank_service_1 = require("./base/base-bank.service");
const ocr_service_1 = require("../ocr/services/ocr.service");
const withdrawal_errors_1 = require("../withdrawal/withdrawal-errors");
const vcb_roi_1 = require("./constants/vcb-roi");
const vietcombank_1 = require("./constants/vietcombank");
const image_preprocessing_service_1 = require("../ocr/services/image-preprocessing.service");
let VietcombankService = class VietcombankService extends base_bank_service_1.BaseBankService {
    constructor(wsService, deviceService, ocrService, imagePreprocessingService) {
        super(wsService, deviceService, ocrService, imagePreprocessingService);
        this.wsService = wsService;
        this.BANK_CODE = 'VIETCOMBANK';
        this.BUNDLE_ID = 'com.vcb.VCB';
    }
    async inputPasswordFromConfig(deviceId) {
        const config = await this.deviceService.getDeviceConfig(deviceId);
        if (!config || !config.password) {
            throw new Error(`Password not configured for device ${deviceId}`);
        }
        await this.clickWithTransition(deviceId, vietcombank_1.VCB_UI_COORDINATES.PASSWORD_FIELD.x, vietcombank_1.VCB_UI_COORDINATES.PASSWORD_FIELD.y, 1500);
        await this.wsService.inputText(deviceId, config.password);
        await (0, time_1.sleep)(1000);
        await this.wsService.pressReturnKey(deviceId);
        await (0, time_1.sleep)(500);
    }
    async inputSmartOTPFromConfig(deviceId, maxRetries = 3) {
        const config = await this.deviceService.getDeviceConfig(deviceId);
        if (!config || !config.smartOTP) {
            throw new Error(`SmartOTP not configured for device ${deviceId}`);
        }
        await (0, time_1.sleep)(500);
        await this.wsService.inputText(deviceId, config.smartOTP);
    }
    async launchApp(deviceId) {
        await this.wsService.launchApp(deviceId, this.BUNDLE_ID);
        const doesLaunchAppSuccess = await this.verifyScreenState(deviceId, {
            expectedTexts: ['Đăng nhập'],
            timeout: 10000,
            pollInterval: 500,
            roi: vcb_roi_1.VCB_ROI_EXPECTED.LAUNCH_APP,
            preprocess: {
                grayscale: true,
                enhanceContrast: true
            }
        });
        if (!doesLaunchAppSuccess) {
            throw new withdrawal_errors_1.WithdrawalProcessingError('Failed to launch VIETCOMBANK app', withdrawal_errors_1.ErrorType.FORCE_LOGIN_AND_REQUEUE);
        }
        else {
            this.logger.log(`[${deviceId}] - Get login app screen`);
        }
    }
    async login(deviceId) {
        await this.killApp(deviceId);
        await (0, time_1.sleep)(2000);
        await this.launchApp(deviceId);
        await this.verifyScreenState(deviceId, {
            expectedTexts: ['Đăng nhập'],
            timeout: 20000,
            pollInterval: 500,
            roi: vcb_roi_1.VCB_ROI_EXPECTED.LAUNCH_APP,
        });
        await this.inputPasswordFromConfig(deviceId);
        const doesLoginSuccess = await this.clickAndWaitForScreen(deviceId, vietcombank_1.VCB_UI_COORDINATES.LOGIN_BTN.x, vietcombank_1.VCB_UI_COORDINATES.LOGIN_BTN.y, {
            expectedTexts: ['Chức năng ưa thích'],
            timeout: 20000,
            pollInterval: 500,
            roi: vcb_roi_1.VCB_ROI_EXPECTED.HOME_SCREEN,
        });
        if (!doesLoginSuccess) {
            throw new withdrawal_errors_1.WithdrawalProcessingError('Failed to login to VIETCOMBANK', withdrawal_errors_1.ErrorType.FORCE_LOGIN_AND_REQUEUE);
        }
        else {
            this.logger.log(`[${deviceId}] - Login successfully`);
        }
    }
    async executeTransferWithQRCode(withdrawal, deviceConfig) {
        this.logger.log(`Executing VIETCOMBANK transfer for withdrawal ${withdrawal.withdrawalId} on device ${deviceConfig.deviceId}`);
        await this.clickWithTransition(deviceConfig.deviceId, vietcombank_1.VCB_UI_COORDINATES.QR_CODE_BTN.x, vietcombank_1.VCB_UI_COORDINATES.QR_CODE_BTN.y, 3000);
        await (0, time_1.sleep)(2000);
        const doesClickImageLibrarySuccess = await this.clickAndWaitForScreen(deviceConfig.deviceId, vietcombank_1.VCB_UI_COORDINATES.IMAGE_LIBRARY_BTN.x, vietcombank_1.VCB_UI_COORDINATES.IMAGE_LIBRARY_BTN.y, {
            expectedTexts: ['Ảnh', 'Album'],
            timeout: 30000,
            pollInterval: 500,
            roi: vcb_roi_1.VCB_ROI_EXPECTED.ALBUM_SCREEN,
        });
        if (!doesClickImageLibrarySuccess) {
            throw new withdrawal_errors_1.WithdrawalProcessingError('Failed to click image library button', withdrawal_errors_1.ErrorType.FORCE_LOGIN_AND_REQUEUE);
        }
        else {
            this.logger.log(`[${deviceConfig.accountName}] - Get image library screen`);
        }
        const verifiedAccount = await this.clickAndWaitForScreen(deviceConfig.deviceId, vietcombank_1.VCB_UI_COORDINATES.FIRST_IMAGE_BTN.x, vietcombank_1.VCB_UI_COORDINATES.FIRST_IMAGE_BTN.y, {
            expectedTexts: [withdrawal.beneficiaryName],
            timeout: 30000,
            pollInterval: 500,
            roi: vcb_roi_1.VCB_ROI_EXPECTED.VERIFY_ACCOUNT_NAME,
        });
        if (!verifiedAccount) {
            await this.clickWithTransition(deviceConfig.deviceId, vietcombank_1.VCB_UI_COORDINATES.HOME_ICON.x, vietcombank_1.VCB_UI_COORDINATES.HOME_ICON.y, 2000);
            throw new withdrawal_errors_1.WithdrawalProcessingError('Choose wrong image qrcode', withdrawal_errors_1.ErrorType.TEMPORARY);
        }
        else {
            this.logger.log(`[${deviceConfig.accountName}] - Get Verified account name screen`);
        }
        const doesTransactionVerify = await this.clickAndWaitForScreen(deviceConfig.deviceId, vietcombank_1.VCB_UI_COORDINATES.CONTINUE_TRANSFER_BTN.x, vietcombank_1.VCB_UI_COORDINATES.CONTINUE_TRANSFER_BTN.y, {
            expectedTexts: ['kiểm tra và xác nhận'],
            timeout: 30000,
            pollInterval: 500,
            roi: vcb_roi_1.VCB_ROI_EXPECTED.TRANSACTION_VERIFY,
        });
        if (!doesTransactionVerify) {
            throw new withdrawal_errors_1.WithdrawalProcessingError('Transaction verification screen not found', withdrawal_errors_1.ErrorType.FORCE_LOGIN_AND_REQUEUE);
        }
        else {
            this.logger.log(`[${deviceConfig.accountName}] - Get Transaction verification screen`);
        }
        const doesOTPEnterSuccess = await this.clickAndWaitForScreen(deviceConfig.deviceId, vietcombank_1.VCB_UI_COORDINATES.CONTINUE_TRANSFER_BTN.x, vietcombank_1.VCB_UI_COORDINATES.CONTINUE_TRANSFER_BTN.y, {
            expectedTexts: ['smart OTP'],
            timeout: 30000,
            pollInterval: 500,
            roi: vcb_roi_1.VCB_ROI_EXPECTED.OTP_ENTER,
        });
        if (!doesOTPEnterSuccess) {
            throw new withdrawal_errors_1.WithdrawalProcessingError('Transaction verify screen not found', withdrawal_errors_1.ErrorType.FORCE_LOGIN_AND_REQUEUE);
        }
        else {
            this.logger.log(`[${deviceConfig.accountName}] - Get Transaction verify screen`);
        }
        await this.inputSmartOTPFromConfig(deviceConfig.deviceId);
        await (0, time_1.sleep)(500);
        const doesOTPVerifySuccess = await this.clickAndWaitForScreen(deviceConfig.deviceId, vietcombank_1.VCB_UI_COORDINATES.OTP_ENTER_TRANSFER_BTN.x, vietcombank_1.VCB_UI_COORDINATES.OTP_ENTER_TRANSFER_BTN.y, {
            expectedTexts: ['Mã xác thực giao dịch'],
            timeout: 30000,
            pollInterval: 500,
            roi: vcb_roi_1.VCB_ROI_EXPECTED.OTP_VERIFY,
        });
        if (!doesOTPVerifySuccess) {
            throw new withdrawal_errors_1.WithdrawalProcessingError('Transaction verify screen not found', withdrawal_errors_1.ErrorType.NO_BILL_AFTER_OTP);
        }
        else {
            this.logger.log(`[${deviceConfig.accountName}] - Get Transaction verify screen`);
        }
        const doesTransactionSuccess = await this.clickAndWaitForScreen(deviceConfig.deviceId, vietcombank_1.VCB_UI_COORDINATES.CONTINUE_OTP_VERIFY_BTN.x, vietcombank_1.VCB_UI_COORDINATES.CONTINUE_OTP_VERIFY_BTN.y, {
            expectedTexts: ['Giao dịch thành công'],
            timeout: 30000,
            pollInterval: 500,
            roi: vcb_roi_1.VCB_ROI_EXPECTED.TRANSACTION_SUCCESS,
            preprocess: {
                grayscale: true,
                enhanceContrast: true
            }
        });
        if (!doesTransactionSuccess) {
            throw new withdrawal_errors_1.WithdrawalProcessingError('Transaction success screen not found', withdrawal_errors_1.ErrorType.NO_BILL_AFTER_OTP);
        }
        else {
            this.logger.log(`[${deviceConfig.accountName}] - Get Transaction success screen`);
        }
        await (0, time_1.sleep)(500);
        await this.captureScreen(deviceConfig.deviceId, { folderPath: withdrawal.withdrawalCode });
        await this.clickWithTransition(deviceConfig.deviceId, vietcombank_1.VCB_UI_COORDINATES.HOME_ICON.x, vietcombank_1.VCB_UI_COORDINATES.HOME_ICON.y, 5000, `[${deviceConfig.accountName}] - Get back to home screen`);
    }
    async goToHomeScreenFromBill() {
        console.warn('VCB not implement');
    }
    async extractTransactionAmount(imagePath) {
        try {
            const result = await this.ocrService.recognizeFromFile(imagePath, {
                fieldType: 'singleLine',
                customROI: {
                    x: 0.05,
                    y: 0.75,
                    width: 0.9,
                    height: 0.12,
                },
                preprocess: {
                    grayscale: true,
                    enhanceContrast: true,
                },
            });
            if (!result) {
                this.logger.warn('Failed to extract transaction amount from ROI');
                return null;
            }
            const amountText = result.text.replace(/[^\d.,]/g, '').replace(/,/g, '');
            const amount = parseFloat(amountText);
            if (isNaN(amount)) {
                this.logger.warn(`Could not parse amount from OCR text: ${result.text}`);
                return null;
            }
            this.logger.log(`Extracted transaction amount: ${amount.toLocaleString('vi-VN')} VND ` +
                `(confidence: ${result.confidence.toFixed(2)}%, time: ${result.processingTime}ms)`);
            return amount;
        }
        catch (error) {
            this.logger.error(`Error extracting transaction amount: ${error.message}`, error.stack);
            return null;
        }
    }
    async onModuleInit() {
    }
    onModuleDestroy() {
    }
};
exports.VietcombankService = VietcombankService;
exports.VietcombankService = VietcombankService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(websocket_1.WEBSOCKET_SERVICE)),
    __metadata("design:paramtypes", [Object, device_service_1.DeviceService,
        ocr_service_1.OCRService,
        image_preprocessing_service_1.ImagePreprocessingService])
], VietcombankService);
//# sourceMappingURL=vietcombank.service.js.map