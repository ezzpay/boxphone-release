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
exports.EzpayBeClientService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const FormData = require("form-data");
const fs_1 = require("fs");
const config_1 = require("../../common/constants/config");
const time_1 = require("../../common/utils/time");
let EzpayBeClientService = class EzpayBeClientService {
    constructor(httpService) {
        this.httpService = httpService;
        this.logger = new common_1.Logger('EzpayBeClientService');
        this.apiUrl = config_1.config.ezpayBe.apiUrl ?? 'http://localhost:3001';
        this.apiKey = config_1.config.ezpayBe.apiKey ?? '';
    }
    async completeWithdrawal(withdrawalId, payload) {
        const maxRetries = 3;
        const baseDelay = 2000;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const url = `${this.apiUrl}/api/internal/withdrawals/complete/${withdrawalId}`;
                this.logger.log(`Updating withdrawal ${withdrawalId} status to ${payload.analyzedStatus} (attempt ${attempt + 1}/${maxRetries + 1})`);
                const data = {
                    analyzedStatus: payload.analyzedStatus,
                    sourceBankCode: payload.sourceBankCode,
                    sourceAccountNo: payload.sourceAccountNo,
                    sourceAccountName: payload.sourceAccountName
                };
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.patch(url, data, {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': this.apiKey,
                        'x-internal-secret-key': 'uHqE5X9H0QEBsqlZpdTHG0fOyvmMtHjCGgsG4ouls3Gz9WvaWg4w9HV3sqETGWfE',
                    },
                    timeout: 20000,
                }));
                if (response.status === 200 || response.status === 204) {
                    this.logger.log(`Successfully updated withdrawal ${withdrawalId} status to ${payload.analyzedStatus}`);
                    return;
                }
                this.logger.warn(`Unexpected status code ${response.status} when updating withdrawal ${withdrawalId}`);
            }
            catch (error) {
                const axiosError = error;
                const payload = axiosError.response?.data;
                const errorMessage = axiosError.message;
                if (attempt < maxRetries) {
                    const delay = baseDelay * Math.pow(2, attempt);
                    this.logger.warn(`Failed to update withdrawal ${withdrawalId} (attempt ${attempt + 1}/${maxRetries + 1}): ${errorMessage}. Payload: ${JSON.stringify(payload)}, Retrying in ${delay}ms`);
                    await (0, time_1.sleep)(delay);
                }
                else {
                    this.logger.error(`Failed to update withdrawal ${withdrawalId} after ${maxRetries + 1} attempts. Payload: ${JSON.stringify(payload)}, Error: ${errorMessage}`);
                }
            }
        }
    }
    async uploadReceipt(withdrawalId, receiptPath) {
        const maxRetries = 3;
        const baseDelay = 2000;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const url = `${this.apiUrl}/api/internal/withdrawals/upload-receipt/${withdrawalId}`;
                this.logger.log(`Uploading bill for withdrawal ${withdrawalId} (attempt ${attempt + 1}/${maxRetries + 1})`);
                if (!receiptPath) {
                    this.logger.warn(`No receipt path provided for withdrawal ${withdrawalId}`);
                    return;
                }
                const formdata = new FormData();
                formdata.append('receipt', (0, fs_1.createReadStream)(receiptPath));
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.patch(url, formdata, {
                    headers: {
                        ...formdata.getHeaders(),
                        'X-API-Key': this.apiKey,
                        'x-internal-secret-key': 'uHqE5X9H0QEBsqlZpdTHG0fOyvmMtHjCGgsG4ouls3Gz9WvaWg4w9HV3sqETGWfE',
                    },
                    timeout: 20000,
                }));
                if (response.status === 200 || response.status === 204) {
                    this.logger.log(`Successfully uploaded bill for withdrawal ${withdrawalId}`);
                    return;
                }
                this.logger.warn(`Unexpected status code ${response.status} when uploading bill for withdrawal ${withdrawalId}`);
            }
            catch (error) {
                const axiosError = error;
                const response = axiosError.response?.data;
                const errorMessage = axiosError.message;
                if (attempt < maxRetries) {
                    const delay = baseDelay * Math.pow(2, attempt);
                    this.logger.warn(`Failed to upload bill for withdrawal ${withdrawalId} (attempt ${attempt + 1}/${maxRetries + 1}): ${errorMessage}. Response: ${JSON.stringify(response)}, Retrying in ${delay}ms`);
                    await (0, time_1.sleep)(delay);
                }
                else {
                    this.logger.error(`Failed to upload bill for withdrawal ${withdrawalId} after ${maxRetries + 1} attempts. Response: ${JSON.stringify(response)}, Error: ${errorMessage}`);
                }
            }
        }
    }
    updateWithdrawal(id, data) {
        this.logger.log(`Updating withdrawal ${id} data ${JSON.stringify(data)}`);
        const url = `${this.apiUrl}/api/internal/withdrawals/${id}`;
        return (0, rxjs_1.firstValueFrom)(this.httpService.patch(url, data, {
            headers: {
                'x-internal-secret-key': 'uHqE5X9H0QEBsqlZpdTHG0fOyvmMtHjCGgsG4ouls3Gz9WvaWg4w9HV3sqETGWfE',
            },
        }));
    }
};
exports.EzpayBeClientService = EzpayBeClientService;
exports.EzpayBeClientService = EzpayBeClientService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], EzpayBeClientService);
//# sourceMappingURL=ezpay-be-client.service.js.map