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
exports.AcbService = void 0;
const common_1 = require("@nestjs/common");
const websocket_1 = require("../../common/modules/websocket/constants/websocket");
const device_service_1 = require("../device/device.service");
const base_bank_service_1 = require("./base/base-bank.service");
const time_1 = require("../../common/utils/time");
const keyboard_1 = require("../../common/constants/keyboard");
const acbank_1 = require("./constants/acbank");
const ocr_service_1 = require("../ocr/services/ocr.service");
const image_preprocessing_service_1 = require("../ocr/services/image-preprocessing.service");
let AcbService = class AcbService extends base_bank_service_1.BaseBankService {
    constructor(wsService, deviceService, ocrService, imagePreprocessingService) {
        super(wsService, deviceService, ocrService, imagePreprocessingService);
        this.wsService = wsService;
        this.BANK_CODE = 'ACB';
        this.BUNDLE_ID = 'mobileapp.acb.com.vn';
    }
    launchApp(deviceId) {
        throw new Error('Method not implemented.');
    }
    async captureScreen(deviceId, options) {
        const typedOptions = options;
    }
    async clickPasswordField(deviceId) {
        try {
            const { x, y } = acbank_1.ACB_UI_COORDINATES.PASSWORD_FIELD;
            this.logger.log(`Clicking password field on device ${deviceId} at coordinates (${x}, ${y})`);
            await this.clickWithTransition(deviceId, x, y, 0.2);
            await (0, time_1.sleep)(1000);
            this.logger.log(`Password field clicked successfully on device ${deviceId}`);
        }
        catch (error) {
            this.logger.error(`Error clicking password field on device ${deviceId}: ${error.message}`);
            throw error;
        }
    }
    async inputPasswordFromConfig(deviceId) {
        try {
            const config = await this.deviceService.getDeviceConfig(deviceId);
            if (!config || !config.password) {
                throw new Error(`Password not configured for device ${deviceId}`);
            }
            await this.wsService.inputText(deviceId, config.password);
        }
        catch (error) {
            this.logger.error(`Error inputting password from config for device ${deviceId}: ${error.message}`);
            throw error;
        }
    }
    async clickLoginButton(deviceId) {
        try {
            const { x, y } = acbank_1.ACB_UI_COORDINATES.LOGIN_BUTTON;
            this.logger.log(`Clicking login button on device ${deviceId} at coordinates (${x}, ${y})`);
            await this.wsService.click(deviceId, x, y, 0.2);
            await (0, time_1.sleep)(5000);
            this.logger.log(`Login button clicked successfully on device ${deviceId}`);
        }
        catch (error) {
            this.logger.error(`Error clicking login button on device ${deviceId}: ${error.message}`);
            throw error;
        }
    }
    async login(deviceId) {
        try {
            await this.killApp(deviceId);
            await this.launchApp(deviceId);
            const { x, y } = acbank_1.ACB_UI_COORDINATES.LOGIN_BUTTON;
            this.logger.log(`Clicking login button on device ${deviceId} at coordinates (${x}, ${y})`);
            await this.wsService.click(deviceId, x, y, 0.2);
            await (0, time_1.sleep)(2000);
            await this.inputPasswordFromConfig(deviceId);
            await (0, time_1.sleep)(2000);
            const { x: xReturn, y: yReturn } = keyboard_1.COMMON_COORDINATES.RETURN_KEY;
            this.logger.log(`Clicking return key on device ${deviceId} at coordinates (${xReturn}, ${yReturn})`);
            await this.wsService.click(deviceId, xReturn, yReturn, 0.2);
            await (0, time_1.sleep)(2000);
            await this.wsService.click(deviceId, 0.5, 0.62, 0.2);
            await (0, time_1.sleep)(5000);
            await this.wsService.click(deviceId, 0.3, 0.55, 0.2);
            await this.wsService.click(deviceId, 0.5, 0.65, 0.2);
        }
        catch (error) {
            this.logger.error(`Error logging in on device ${deviceId}: ${error.message}`);
            throw error;
        }
    }
    async executeTransfer(withdrawal, deviceId) {
    }
    async executeTransferWithQRCode(withdrawal, deviceConfig) {
        console.warn('ACB executeTransferWithQRCode');
    }
    async executeInternalTransfer(withdrawal, deviceId) {
        return this.executeExternalTransfer(withdrawal, deviceId);
    }
    async executeExternalTransfer(withdrawal, deviceId) {
        console.warn('ACB executeExternalTransfer');
    }
    async goToHomeScreenFromBill() {
        console.warn('ACB not implement');
    }
};
exports.AcbService = AcbService;
exports.AcbService = AcbService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(websocket_1.WEBSOCKET_SERVICE)),
    __metadata("design:paramtypes", [Object, device_service_1.DeviceService,
        ocr_service_1.OCRService,
        image_preprocessing_service_1.ImagePreprocessingService])
], AcbService);
//# sourceMappingURL=acb.service.js.map