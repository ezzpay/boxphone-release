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
exports.HdBankService = void 0;
const websocket_1 = require("../../common/modules/websocket/constants/websocket");
const time_1 = require("../../common/utils/time");
const common_1 = require("@nestjs/common");
const device_service_1 = require("../device/device.service");
const base_bank_service_1 = require("./base/base-bank.service");
const ocr_service_1 = require("../ocr/services/ocr.service");
const withdrawal_errors_1 = require("../withdrawal/withdrawal-errors");
const bank_code_1 = require("./constants/bank-code");
const hdbank_1 = require("./constants/hdbank");
const hd_roi_1 = require("./constants/hd-roi");
const pandaSwipType_1 = require("./constants/pandaSwipType");
const image_preprocessing_service_1 = require("../ocr/services/image-preprocessing.service");
let HdBankService = class HdBankService extends base_bank_service_1.BaseBankService {
    constructor(wsService, deviceService, ocrService, imagePreprocessingService) {
        super(wsService, deviceService, ocrService, imagePreprocessingService);
        this.wsService = wsService;
        this.BANK_CODE = 'HDBANK';
        this.BUNDLE_ID = 'com.vnpay.HDBank';
    }
    async inputPasswordFromConfig(deviceId) {
        const config = await this.deviceService.getDeviceConfig(deviceId);
        if (!config || !config.password) {
            throw new Error(`Password not configured for device ${deviceId}`);
        }
        await this.clickWithTransition(deviceId, hdbank_1.HD_UI_COORDINATES.PASSWORD_FIELD.x, hdbank_1.HD_UI_COORDINATES.PASSWORD_FIELD.y, 1500);
        await this.wsService.inputText(deviceId, config.password);
        await (0, time_1.sleep)(1000);
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
            roi: hd_roi_1.HD_ROI_EXPECTED.LAUNCH_APP,
            preprocess: {
                grayscale: true,
                enhanceContrast: true
            }
        });
        if (!doesLaunchAppSuccess) {
            throw new Error('Failed to launch HDBank app and go to login screen');
        }
        else {
            this.logger.log(`[${deviceId}] - Get login app screen`);
        }
    }
    async login(deviceId) {
        await this.killApp(deviceId);
        await (0, time_1.sleep)(2000);
        await this.launchApp(deviceId);
        await this.inputPasswordFromConfig(deviceId);
        const doesLoginSuccess = await this.clickAndWaitForScreen(deviceId, hdbank_1.HD_UI_COORDINATES.LOGIN_BTN.x, hdbank_1.HD_UI_COORDINATES.LOGIN_BTN.y, {
            expectedTexts: ['tài khoản', 'chuyển khoản'],
            timeout: 20000,
            pollInterval: 500,
            roi: hd_roi_1.HD_ROI_EXPECTED.HOME_SCREEN,
        });
        if (!doesLoginSuccess) {
            throw new Error('Failed to login to HDBank');
        }
        else {
            this.logger.log(`[${deviceId}] - Login successfully`);
        }
    }
    async executeTransferWithQRCode(withdrawal, deviceConfig) {
        this.logger.log(`Executing HDBank transfer for withdrawal ${withdrawal.withdrawalId} on device ${deviceConfig.deviceId}`);
        await this.clickWithTransition(deviceConfig.deviceId, hdbank_1.HD_UI_COORDINATES.QR_CODE_BTN.x, hdbank_1.HD_UI_COORDINATES.QR_CODE_BTN.y, 3000);
        await (0, time_1.sleep)(2000);
        const doesClickImageLibrarySuccess = await this.clickAndWaitForScreen(deviceConfig.deviceId, hdbank_1.HD_UI_COORDINATES.IMAGE_LIBRARY_BTN.x, hdbank_1.HD_UI_COORDINATES.IMAGE_LIBRARY_BTN.y, {
            expectedTexts: ['Ảnh'],
            timeout: 30000,
            pollInterval: 500,
            roi: hd_roi_1.HD_ROI_EXPECTED.ALBUM_SCREEN
        });
        if (!doesClickImageLibrarySuccess) {
            throw new withdrawal_errors_1.WithdrawalProcessingError('Failed to click image library button', withdrawal_errors_1.ErrorType.FORCE_LOGIN_AND_REQUEUE, 'Failed: Mở thư viện ảnh');
        }
        else {
            this.logger.log(`[${deviceConfig.accountName}] - Get image library screen`);
        }
        await this.clickWithTransition(deviceConfig.deviceId, hdbank_1.HD_UI_COORDINATES.FIRST_IMAGE_BTN.x, hdbank_1.HD_UI_COORDINATES.FIRST_IMAGE_BTN.y, 2000);
        let verifiedAccount = false;
        if (withdrawal.bankCode === bank_code_1.BankCodeWithdrawal.HDBank) {
            verifiedAccount = await this.clickAndWaitForScreen(deviceConfig.deviceId, hdbank_1.HD_UI_COORDINATES.SELECT_IMAGE_QR_CODE_BTN.x, hdbank_1.HD_UI_COORDINATES.SELECT_IMAGE_QR_CODE_BTN.y, {
                expectedTexts: [withdrawal.beneficiaryAccountNo],
                timeout: 30000,
                pollInterval: 500,
                roi: hd_roi_1.HD_ROI_EXPECTED.VERIFY_ACCOUNT_NUMBER,
            });
        }
        else {
            verifiedAccount = await this.clickAndWaitForScreen(deviceConfig.deviceId, hdbank_1.HD_UI_COORDINATES.SELECT_IMAGE_QR_CODE_BTN.x, hdbank_1.HD_UI_COORDINATES.SELECT_IMAGE_QR_CODE_BTN.y, {
                expectedTexts: [withdrawal.beneficiaryName],
                timeout: 30000,
                pollInterval: 500,
                roi: hd_roi_1.HD_ROI_EXPECTED.VERIFY_ACCOUNT_NAME,
            });
        }
        if (!verifiedAccount) {
            await this.clickWithTransition(deviceConfig.deviceId, hdbank_1.HD_UI_COORDINATES.HOME_ICON.x, hdbank_1.HD_UI_COORDINATES.HOME_ICON.y, 2000);
            throw new withdrawal_errors_1.WithdrawalProcessingError('Choose wrong image qrcode', withdrawal_errors_1.ErrorType.FORCE_LOGIN_AND_REQUEUE, 'Failed: Kiểm tra tên tài khoản');
        }
        else {
            this.logger.log(`[${deviceConfig.accountName}] - Get Verified account name screen`);
        }
        await (0, time_1.sleep)(500);
        const doesSwipeSuccess = await this.swipeAndWaitForScreen(deviceConfig.deviceId, { type: pandaSwipType_1.PandaSwipeTypeEnum.SWIPE_UP }, {
            expectedTexts: ['danh ba thụ hưởng'],
            timeout: 10000,
            pollInterval: 500,
            roi: hd_roi_1.HD_ROI_EXPECTED.SWIPE_UP_SCREEN,
            preprocess: {
                grayscale: true,
                enhanceContrast: true
            }
        });
        if (!doesSwipeSuccess) {
            throw new withdrawal_errors_1.WithdrawalProcessingError('Swipe up failed', withdrawal_errors_1.ErrorType.FORCE_LOGIN_AND_REQUEUE, 'Failed: Vuốt lên để tiếp tục');
        }
        else {
            this.logger.log(`[${deviceConfig.accountName}] - Get Swipe up screen`);
        }
        await this.clickWithTransition(deviceConfig.deviceId, hdbank_1.HD_UI_COORDINATES.CONTINUE_TRANSFER_BTN.x, hdbank_1.HD_UI_COORDINATES.CONTINUE_TRANSFER_BTN.y, 500);
        const screenHint = await this.detectScreenByHint(deviceConfig.deviceId, hdbank_1.HD_SCREEN_OTP_HINT, {
            timeout: 20000,
            pollInterval: 500,
            roi: hd_roi_1.HD_ROI_EXPECTED.OTP_ENTER_OR_CONTINUE_TRANSFER,
            preprocess: {
                grayscale: true,
                enhanceContrast: true
            }
        });
        if (!screenHint) {
            throw new withdrawal_errors_1.WithdrawalProcessingError('Couldn\'t get HD Screen state not found', withdrawal_errors_1.ErrorType.FORCE_LOGIN_AND_REQUEUE, 'Failed: Lấy trạng thái màn hình');
        }
        else {
            await (0, time_1.sleep)(1000);
            switch (screenHint.name) {
                case hdbank_1.HD_SCREEN_HINT_NAME.ENTER_OTP:
                    await this.inputSmartOTPFromConfig(deviceConfig.deviceId);
                    await (0, time_1.sleep)(1000);
                    const isConfirmAfterOTP = await this.verifyScreenState(deviceConfig.deviceId, {
                        expectedTexts: ['OTP sẽ tự động làm mới'],
                        timeout: 30000,
                        pollInterval: 500,
                        roi: hd_roi_1.HD_ROI_EXPECTED.CONFIRM_AFTER_OTP,
                        preprocess: {
                            grayscale: true,
                            enhanceContrast: true
                        }
                    });
                    if (!isConfirmAfterOTP) {
                        throw new withdrawal_errors_1.WithdrawalProcessingError('Confirm after OTP screen not found', withdrawal_errors_1.ErrorType.FORCE_LOGIN_AND_REQUEUE, 'Failed: MH Xác nhận OTP');
                    }
                    else {
                        this.logger.log(`[${deviceConfig.accountName}] - Get Confirm after OTP screen`);
                    }
                    break;
                case hdbank_1.HD_SCREEN_HINT_NAME.TRANSACTION_VERIFY_NO_INPUT_OTP:
                    break;
                default:
                    throw new withdrawal_errors_1.WithdrawalProcessingError('Unknown screen state', withdrawal_errors_1.ErrorType.FORCE_LOGIN_AND_REQUEUE);
            }
        }
        const doesTransactionSuccess = await this.clickAndWaitForScreen(deviceConfig.deviceId, hdbank_1.HD_UI_COORDINATES.CONTINUE_TRANSFER_BTN.x, hdbank_1.HD_UI_COORDINATES.CONTINUE_TRANSFER_BTN.y, {
            expectedTexts: ['GIAO DỊCH THÀNH CÔNG'],
            timeout: 30000,
            pollInterval: 500,
            roi: hd_roi_1.HD_ROI_EXPECTED.TRANSACTION_SUCCESS,
            preprocess: {
                grayscale: true,
                enhanceContrast: true
            }
        });
        if (!doesTransactionSuccess) {
            throw new withdrawal_errors_1.WithdrawalProcessingError('Transaction verify screen not found', withdrawal_errors_1.ErrorType.NO_BILL_AFTER_OTP, 'Failed: MH Chuyển tiền thành công');
        }
        else {
            this.logger.log(`[${deviceConfig.accountName}] - Get Transaction verify screen`);
        }
        await (0, time_1.sleep)(1000);
        await this.wsService.swipe(deviceConfig.deviceId, { type: pandaSwipType_1.PandaSwipeTypeEnum.SCROLL_DOWN });
        await (0, time_1.sleep)(1000);
        await this.captureScreen(deviceConfig.deviceId, { folderPath: withdrawal.withdrawalCode });
        await (0, time_1.sleep)(2000);
    }
    async goToHomeScreenFromBill() {
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
exports.HdBankService = HdBankService;
exports.HdBankService = HdBankService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(websocket_1.WEBSOCKET_SERVICE)),
    __metadata("design:paramtypes", [Object, device_service_1.DeviceService,
        ocr_service_1.OCRService,
        image_preprocessing_service_1.ImagePreprocessingService])
], HdBankService);
//# sourceMappingURL=hdbank.service.js.map