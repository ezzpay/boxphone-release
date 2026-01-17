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
exports.HcBoxService = void 0;
const common_1 = require("@nestjs/common");
const websocket_1 = require("../../common/modules/websocket/constants/websocket");
const time_1 = require("../../common/utils/time");
let HcBoxService = class HcBoxService {
    constructor(wsService) {
        this.wsService = wsService;
        this.logger = new common_1.Logger('HcBoxService');
    }
    async listDevices() {
        try {
            return await this.wsService.listDevices();
        }
        catch (error) {
            this.logger.error(`Error listing devices: ${error.message}`);
            throw error;
        }
    }
    async executeTransfer(withdrawal, deviceId) {
        try {
            this.logger.log(`Executing transfer for withdrawal ${withdrawal.withdrawalId} on device ${deviceId}`);
            const bankBundleId = this.getBankBundleId(withdrawal.bankCode);
            if (bankBundleId) {
                await this.wsService.launchApp(deviceId, bankBundleId);
                await (0, time_1.sleep)(3000);
            }
            await this.wsService.click(deviceId, 0.5, 0.3, 0.2);
            await (0, time_1.sleep)(2000);
            this.logger.warn('Transfer execution flow needs to be customized per bank app UI');
            this.logger.log(`Transfer execution completed for withdrawal ${withdrawal.withdrawalId}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Error executing transfer for withdrawal ${withdrawal.withdrawalId}: ${error.message}`);
            throw error;
        }
    }
    getBankBundleId(bankCode) {
        const bundleIds = {
            VIETCOMBANK: 'com.vietcombank.mobilebanking',
            TPBANK: 'com.tpbank.mobilebanking',
            TECHCOMBANK: 'com.techcombank.mobilebanking',
        };
        return bundleIds[bankCode] || null;
    }
    async click(deviceId, x, y, duration = 0.2) {
        return this.wsService.click(deviceId, x, y, duration);
    }
    async swipe(deviceId, options) {
        return this.wsService.swipe(deviceId, options);
    }
    async screen(deviceId, options) {
        return this.wsService.captureScreen(deviceId, options);
    }
    async home(deviceId) {
        return this.wsService.home(deviceId);
    }
    async inputNumpadNumber(deviceId, value) {
        return this.wsService.inputNumpadNumber(deviceId, value);
    }
    inputText(deviceId, text) {
        return this.wsService.inputText(deviceId, text);
    }
};
exports.HcBoxService = HcBoxService;
exports.HcBoxService = HcBoxService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(websocket_1.WEBSOCKET_SERVICE)),
    __metadata("design:paramtypes", [Object])
], HcBoxService);
//# sourceMappingURL=hcbox.service.js.map