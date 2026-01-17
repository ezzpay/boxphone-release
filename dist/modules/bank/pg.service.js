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
exports.PgService = void 0;
const common_1 = require("@nestjs/common");
const device_service_1 = require("../device/device.service");
const base_bank_service_1 = require("./base/base-bank.service");
const websocket_1 = require("../../common/modules/websocket/constants/websocket");
const time_1 = require("../../common/utils/time");
const pgbank_1 = require("./constants/pgbank");
const ocr_service_1 = require("../ocr/services/ocr.service");
const withdrawal_errors_1 = require("../withdrawal/withdrawal-errors");
const pg_roi_1 = require("./constants/pg-roi");
const bank_code_1 = require("./constants/bank-code");
const telegram_service_1 = require("../notifiction/telegram.service");
const image_preprocessing_service_1 = require("../ocr/services/image-preprocessing.service");
let PgService = class PgService extends base_bank_service_1.BaseBankService {
    constructor(wsService, deviceService, ocrService, imagePreprocessingService, telegramService) {
        super(wsService, deviceService, ocrService, imagePreprocessingService);
        this.wsService = wsService;
        this.telegramService = telegramService;
        this.BANK_CODE = 'PGBANK';
        this.BUNDLE_ID = 'pgbankApp.pgbank.com.vn';
    }
    async inputPasswordFromConfig(deviceId) {
        const config = await this.deviceService.getDeviceConfig(deviceId);
        if (!config || !config.password) {
            throw new Error(`Password not configured for device ${deviceId}`);
        }
        await this.clickWithTransition(deviceId, pgbank_1.PG_UI_COORDINATES.PASSWORD_FIELD.x, pgbank_1.PG_UI_COORDINATES.PASSWORD_FIELD.y, 1500);
        await this.wsService.inputText(deviceId, config.password);
        await (0, time_1.sleep)(1000);
        await this.wsService.pressReturnKey(deviceId);
    }
    async inputSmartOTPFromConfig(deviceId, maxRetries = 3) {
        const config = await this.deviceService.getDeviceConfig(deviceId);
        if (!config || !config.smartOTP) {
            throw new Error(`SmartOTP not configured for device ${deviceId}`);
        }
        await (0, time_1.sleep)(2000);
        await this.wsService.inputText(deviceId, config.smartOTP);
    }
    async launchApp(deviceId) {
        await this.wsService.launchApp(deviceId, this.BUNDLE_ID);
        const doesLaunchAppSuccess = await this.verifyScreenState(deviceId, {
            expectedTexts: ['Đăng nhập'],
            timeout: 10000,
            pollInterval: 500,
            roi: pg_roi_1.PG_ROI_EXPECTED.LAUNCH_APP,
            preprocess: {
                grayscale: true,
                enhanceContrast: true
            }
        });
        if (!doesLaunchAppSuccess) {
            throw new Error('Failed to launch PGBank app and go to login screen');
        }
        else {
            this.logger.log(`[${deviceId}] - Get login app screen`);
        }
    }
    async login(deviceId) {
        await this.killApp(deviceId);
        await (0, time_1.sleep)(1000);
        await this.launchApp(deviceId);
        await (0, time_1.sleep)(1000);
        await this.inputPasswordFromConfig(deviceId);
        const doesLoginSuccess = await this.clickAndWaitForScreen(deviceId, pgbank_1.PG_UI_COORDINATES.LOGIN_BTN.x, pgbank_1.PG_UI_COORDINATES.LOGIN_BTN.y, {
            expectedTexts: ['tài khoản', 'chuyển tiền', 'tiết kiệm'],
            timeout: 20000,
            pollInterval: 500,
            roi: pg_roi_1.PG_ROI_EXPECTED.HOME_SCREEN,
        });
        if (!doesLoginSuccess) {
            this.telegramService.sendMessage({
                text: '❌ Login Error'
                    + `\n\n<b>Device:</b> ${deviceId}`
                    + `\n<b>Error:</b> Không thể đăng nhập vào app PGBank.`,
                options: {
                    parseMode: 'HTML'
                }
            });
            throw new Error('Failed to login to PGBank');
        }
        else {
            this.logger.log(`[${deviceId}] - Login successfully`);
        }
    }
    async executeTransferWithQRCode(withdrawal, deviceConfig) {
        this.logger.log(`Executing PG transfer for withdrawal ${withdrawal.withdrawalId} on device ${deviceConfig.deviceId}`);
        await this.clickWithTransition(deviceConfig.deviceId, pgbank_1.PG_UI_COORDINATES.QR_CODE_BTN.x, pgbank_1.PG_UI_COORDINATES.QR_CODE_BTN.y, 5000);
        const doesClickImageLibrarySuccess = await this.clickAndWaitForScreen(deviceConfig.deviceId, pgbank_1.PG_UI_COORDINATES.IMAGE_LIBRARY_BTN.x, pgbank_1.PG_UI_COORDINATES.IMAGE_LIBRARY_BTN.y, {
            expectedTexts: ['Ảnh'],
            timeout: 10000,
            pollInterval: 500,
            roi: pg_roi_1.PG_ROI_EXPECTED.ALBUM_SCREEN
        });
        if (!doesClickImageLibrarySuccess) {
            throw new withdrawal_errors_1.WithdrawalProcessingError(`[${deviceConfig.accountName}] Failed to get image library screen`, withdrawal_errors_1.ErrorType.FORCE_LOGIN_AND_REQUEUE, 'Failed: MH mở thư viện ảnh');
        }
        else {
            this.logger.log(`[${deviceConfig.accountName}] - Get image library screen`);
        }
        await this.clickWithTransition(deviceConfig.deviceId, pgbank_1.PG_UI_COORDINATES.FIRST_IMAGE_BTN.x, pgbank_1.PG_UI_COORDINATES.FIRST_IMAGE_BTN.y, 2000);
        let verifiedAccountName = false;
        if (withdrawal.bankCode === bank_code_1.BankCodeWithdrawal.PGBANK) {
            verifiedAccountName = await this.clickAndWaitForScreen(deviceConfig.deviceId, pgbank_1.PG_UI_COORDINATES.SELECT_IMAGE_QR_CODE_BTN.x, pgbank_1.PG_UI_COORDINATES.SELECT_IMAGE_QR_CODE_BTN.y, {
                expectedTexts: [withdrawal.beneficiaryName],
                timeout: 20000,
                pollInterval: 500,
                preprocess: {
                    grayscale: true,
                    enhanceContrast: true
                }
            });
        }
        else {
            verifiedAccountName = await this.clickAndWaitForScreen(deviceConfig.deviceId, pgbank_1.PG_UI_COORDINATES.SELECT_IMAGE_QR_CODE_BTN.x, pgbank_1.PG_UI_COORDINATES.SELECT_IMAGE_QR_CODE_BTN.y, {
                expectedTexts: [withdrawal.beneficiaryName],
                timeout: 20000,
                pollInterval: 500,
                roi: pg_roi_1.PG_ROI_EXPECTED.VERIFY_ACCOUNT_NAME,
                preprocess: {
                    grayscale: true,
                    enhanceContrast: true
                }
            });
        }
        if (!verifiedAccountName) {
            throw new withdrawal_errors_1.WithdrawalProcessingError('Choose wrong image qrcode', withdrawal_errors_1.ErrorType.FORCE_LOGIN_AND_REQUEUE, 'Failed: MH tra tên tài khoản');
        }
        else {
            this.logger.log(`[${deviceConfig.accountName}] - Get Verified account name screen`);
        }
        const doesTransactionConfirm = await this.clickAndWaitForScreen(deviceConfig.deviceId, pgbank_1.PG_UI_COORDINATES.CONTINUE_TRANSFER_BTN.x, pgbank_1.PG_UI_COORDINATES.CONTINUE_TRANSFER_BTN.y, {
            expectedTexts: ['Xác nhận giao dịch'],
            timeout: 30000,
            pollInterval: 500,
            roi: pg_roi_1.PG_ROI_EXPECTED.TRANSACTION_CONFIRM,
            preprocess: {
                grayscale: true,
                enhanceContrast: true
            }
        });
        if (!doesTransactionConfirm) {
            throw new withdrawal_errors_1.WithdrawalProcessingError('Transaction confirm screen not found', withdrawal_errors_1.ErrorType.FORCE_LOGIN_AND_REQUEUE, 'Failed: MH Xác nhận giao dịch');
        }
        else {
            this.logger.log(`[${deviceConfig.accountName}] - Get Transaction confirm screen`);
        }
        const doesTransactionCVerify = await this.clickAndWaitForScreen(deviceConfig.deviceId, pgbank_1.PG_UI_COORDINATES.CONTINUE_TRANSFER_BTN.x, pgbank_1.PG_UI_COORDINATES.CONTINUE_TRANSFER_BTN.y, {
            expectedTexts: ['Xác thực giao dịch'],
            timeout: 30000,
            pollInterval: 500,
            roi: pg_roi_1.PG_ROI_EXPECTED.TRANSACTION_VERIFY,
            preprocess: {
                grayscale: true,
                enhanceContrast: true
            }
        });
        if (!doesTransactionCVerify) {
            throw new withdrawal_errors_1.WithdrawalProcessingError('Transaction verification screen not found', withdrawal_errors_1.ErrorType.FORCE_LOGIN_AND_REQUEUE, 'Failed: MH Xác thực giao dịch');
        }
        else {
            this.logger.log(`[${deviceConfig.accountName}] - Get Transaction verification screen`);
        }
        await this.inputSmartOTPFromConfig(deviceConfig.deviceId);
        const doesTransactionSuccess = await this.verifyScreenState(deviceConfig.deviceId, {
            expectedTexts: ['Chuyển tiền thành công'],
            timeout: 30000,
            pollInterval: 500,
            roi: pg_roi_1.PG_ROI_EXPECTED.TRANSACTION_SUCCESS,
            preprocess: {
                grayscale: true,
                enhanceContrast: true
            }
        });
        if (!doesTransactionSuccess) {
            throw new withdrawal_errors_1.WithdrawalProcessingError('Transaction success screen not found', withdrawal_errors_1.ErrorType.NO_BILL_AFTER_OTP, 'Failed: MH Chuyển tiền thành công');
        }
        else {
            this.logger.log(`[${deviceConfig.accountName}] - Get Transaction success screen`);
        }
        await (0, time_1.sleep)(500);
        await this.captureScreen(deviceConfig.deviceId, { folderPath: withdrawal.withdrawalCode });
    }
    async goToHomeScreenFromBill(deviceConfig) {
        const gotoHomeScreen = await this.clickAndWaitForScreen(deviceConfig.deviceId, pgbank_1.PG_UI_COORDINATES.BACK_TO_HOME.x, pgbank_1.PG_UI_COORDINATES.BACK_TO_HOME.y, {
            expectedTexts: ['tài khoản', 'chuyển tiền', 'tiết kiệm'],
            timeout: 10000,
            pollInterval: 500,
            roi: pg_roi_1.PG_ROI_EXPECTED.HOME_SCREEN,
        });
        if (!gotoHomeScreen) {
            throw new withdrawal_errors_1.WithdrawalProcessingError('Failed to login to PGBank', withdrawal_errors_1.ErrorType.FORCE_LOGIN_NO_REQUEUE);
        }
        else {
            this.logger.log(`[${deviceConfig.deviceId}] - Get to home screen`);
        }
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
exports.PgService = PgService;
exports.PgService = PgService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(websocket_1.WEBSOCKET_SERVICE)),
    __metadata("design:paramtypes", [Object, device_service_1.DeviceService,
        ocr_service_1.OCRService,
        image_preprocessing_service_1.ImagePreprocessingService,
        telegram_service_1.TelegramService])
], PgService);
//# sourceMappingURL=pg.service.js.map