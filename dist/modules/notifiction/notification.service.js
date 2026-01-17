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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const ezpay_be_client_service_1 = require("./ezpay-be-client.service");
let NotificationService = class NotificationService {
    constructor(ezpayBeClient) {
        this.ezpayBeClient = ezpayBeClient;
        this.logger = new common_1.Logger('NotificationService');
    }
    async completeWithdrawal(withdrawal, analysisResult, deviceConfig) {
        this.ezpayBeClient
            .completeWithdrawal(withdrawal._id, {
            analyzedStatus: analysisResult.analyzedStatus,
            sourceAccountNo: deviceConfig.accountNo,
            sourceBankCode: deviceConfig.bankCode,
            sourceAccountName: deviceConfig.accountName,
        }).catch((error) => {
            this.logger.error(`[${withdrawal.withdrawalCode}] - Error updating withdrawal status for ${withdrawal._id} - ${error.stack}`);
        });
        this.ezpayBeClient
            .uploadReceipt(withdrawal._id, analysisResult.rawPath)
            .catch((error) => {
            this.logger.error(`[${withdrawal.withdrawalCode}] - Error uploading receipt for ${withdrawal._id} - ${error.stack}`);
        });
    }
    updateWithdrawal(id, data) {
        return this.ezpayBeClient.updateWithdrawal(id, data);
    }
    uploadReceipt(id, receiptPath) {
        return this.ezpayBeClient.uploadReceipt(id, receiptPath);
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ezpay_be_client_service_1.EzpayBeClientService])
], NotificationService);
//# sourceMappingURL=notification.service.js.map