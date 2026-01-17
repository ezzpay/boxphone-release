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
exports.BankService = void 0;
const common_1 = require("@nestjs/common");
const acb_service_1 = require("./acb.service");
const pg_service_1 = require("./pg.service");
const hdbank_service_1 = require("./hdbank.service");
const vietcombank_service_1 = require("./vietcombank.service");
const device_service_1 = require("../device/device.service");
const session_management_service_1 = require("./session-management.service");
const device_lock_service_1 = require("../device/device-lock.service");
const withdrawal_errors_1 = require("../withdrawal/withdrawal-errors");
const telegram_service_1 = require("../notifiction/telegram.service");
const time_1 = require("../../common/utils/time");
const path_1 = require("path");
const promises_1 = require("fs/promises");
const fs_1 = require("fs");
let BankService = class BankService {
    constructor(acbService, pgService, hdBankService, vietcombankService, deviceService, sessionManagement, deviceLock, telegramService) {
        this.acbService = acbService;
        this.pgService = pgService;
        this.hdBankService = hdBankService;
        this.vietcombankService = vietcombankService;
        this.deviceService = deviceService;
        this.sessionManagement = sessionManagement;
        this.deviceLock = deviceLock;
        this.telegramService = telegramService;
        this.logger = new common_1.Logger('BankService');
        this.bankServices = new Map();
        this.registerBankService(this.acbService);
        this.registerBankService(this.pgService);
        this.registerBankService(this.hdBankService);
        this.registerBankService(this.vietcombankService);
    }
    registerBankService(service) {
        const bankCode = service.getBankCode().toUpperCase();
        this.bankServices.set(bankCode, service);
        this.logger.log(`Registered bank service: ${bankCode}`);
    }
    getBankService(bankCode) {
        const service = this.bankServices.get(bankCode.toUpperCase());
        if (!service) {
            throw new withdrawal_errors_1.WithdrawalProcessingError(`Bank ${bankCode} not supported! Cannot find bank service out!`, withdrawal_errors_1.ErrorType.PERMANENT);
        }
        return service;
    }
    getSupportedBanks() {
        return Array.from(this.bankServices.keys());
    }
    async login(bankCode, deviceId, force = false) {
        if (force) {
            await this.deviceLock.releaseLock(deviceId);
        }
        const isLocked = await this.deviceLock.isLocked(deviceId);
        if (isLocked) {
            const lock = await this.deviceLock.getLock(deviceId);
            throw new Error(`Device ${deviceId} is currently locked by ${lock?.lockType} (${lock?.lockedBy}). Cannot login.`);
        }
        const operationId = `login:${bankCode}:${deviceId}:${Date.now()}`;
        const lockAcquired = await this.deviceLock.acquireLock(deviceId, 'login', operationId, 4.5 * 60 * 1000);
        if (!lockAcquired) {
            throw new Error(`Failed to acquire lock for device ${deviceId}`);
        }
        try {
            await this.sessionManagement.markLoggingIn(deviceId, bankCode);
            const service = this.getBankService(bankCode);
            if (!service) {
                throw new Error(`Bank service not found for bank code: ${bankCode}`);
            }
            this.logger.log(`[${deviceId}] Logging in to ${bankCode}`);
            await service.login(deviceId);
            await this.sessionManagement.recordLogin(deviceId, bankCode);
            this.logger.log(`[${deviceId}] Successfully logged in to ${bankCode}`);
        }
        catch (error) {
            await this.sessionManagement.clearSession(deviceId, bankCode);
            throw error;
        }
        finally {
            await this.deviceLock.releaseLock(deviceId);
        }
    }
    async loginAllActiveBanks() {
        try {
            const maxRetries = 6;
            const delayTime = 10000;
            let devices = [];
            for (let i = 0; i < maxRetries; i++) {
                this.logger.log(`[${i + 1}/${maxRetries}] Retrying to list devices on login...`);
                devices = await this.deviceService.listDevices();
                if (devices.length > 0) {
                    break;
                }
                await (0, time_1.sleep)(delayTime);
            }
            const deviceConfigs = await this.deviceService.listDeviceConfigs();
            const activeDevices = devices.filter(device => device.status === 'active' && device.bankCode);
            const activeDeviceConfigs = deviceConfigs.filter(config => config.status === 'active' && config.bankCode);
            if (activeDevices.length < activeDeviceConfigs.length) {
                const disconnectedDevices = activeDeviceConfigs.filter(config => !activeDevices.some(device => device.udid === config.deviceId));
                const messageBlocks = disconnectedDevices.map(config => `<b>Bank:</b> ${config.bankCode}\n<b>Account:</b> ${config.accountName}`).join('\n\n');
                this.telegramService.sendMessage({
                    text: `🆘 <b>Devices disconnected: ${disconnectedDevices.length}</b>\n\n${messageBlocks}`,
                    options: {
                        parseMode: 'HTML',
                    },
                });
            }
            if (activeDevices.length === 0) {
                this.logger.warn('No active devices found to login');
                return;
            }
            for (const device of activeDevices) {
                const deviceId = device.udid;
                try {
                    await this.deviceLock.releaseLockByType(deviceId, 'transfer');
                }
                catch (error) {
                    this.logger.warn(`Failed to release transfer lock for device ${deviceId}: ${error.message}`);
                }
            }
            const loginPromises = [];
            for (const device of activeDevices) {
                const bankCode = device.bankCode.toUpperCase();
                const deviceId = device.udid;
                loginPromises.push(this.login(bankCode, deviceId, true).catch(error => {
                    this.logger.error(`Failed to login ${bankCode} on device ${deviceId}: ${error.message}`);
                }));
            }
            await Promise.allSettled(loginPromises);
            this.logger.log(`Completed login process for all active banks`);
        }
        catch (error) {
            this.logger.error(`Error logging in all active banks: ${error.message}`);
            throw error;
        }
    }
    executeTransferWithQRCode(withdrawal, deviceConfig, bankCode) {
        const service = this.getBankService(bankCode);
        return service.executeTransferWithQRCode(withdrawal, deviceConfig);
    }
    async isSessionValid(deviceId, bankCode) {
        return await this.sessionManagement.isSessionValid(deviceId, bankCode);
    }
    analyzeTransferBill(bankCode, withdrawal) {
        const service = this.getBankService(bankCode);
        return service.analyzeTransferBill(bankCode, withdrawal);
    }
    async refreshSessionIfNeeded(deviceId, bankCode) {
        const session = await this.sessionManagement.getSession(deviceId, bankCode);
        if (session?.status === 'logging_in') {
            return false;
        }
        const needsRefresh = await this.sessionManagement.needsRefresh(deviceId, bankCode);
        const isValidSession = await this.sessionManagement.isSessionValid(deviceId, bankCode);
        if (!needsRefresh && isValidSession) {
            return false;
        }
        const isLocked = await this.deviceLock.isLocked(deviceId);
        if (isLocked) {
            this.logger.warn(`Cannot refresh session for device ${deviceId} - device is locked`);
            return false;
        }
        try {
            if (!isValidSession) {
                this.logger.log(`Session expired or missing for device ${deviceId}, bank ${bankCode}. Retrying login...`);
            }
            else {
                this.logger.log(`Refreshing session for device ${deviceId}, bank ${bankCode}`);
            }
            await this.login(bankCode, deviceId);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to refresh session for device ${deviceId}: ${error.message}`);
            return false;
        }
    }
    createQRCodeAndTransferTo(bankCode, deviceId, withdrawal) {
        const service = this.getBankService(bankCode);
        return service.createQRCodeAndTransferTo(deviceId, withdrawal);
    }
    captureScreen(bankCode, deviceId, folderPath) {
        const service = this.getBankService(bankCode);
        return service.captureScreen(deviceId, { folderPath });
    }
    getBillImagePath(bankCode, folderPath) {
        const service = this.getBankService(bankCode);
        return service.getBillImagePath(folderPath);
    }
    createBillFolder(bankCode, folderPath) {
        const service = this.getBankService(bankCode);
        return service.createBillFolder(folderPath);
    }
    goToHomeScreenFromBill(deviceConfig) {
        const service = this.getBankService(deviceConfig.bankCode);
        return service.goToHomeScreenFromBill(deviceConfig);
    }
    async getLatestImagePath(folderPath, timeout = 10000, pollInterval = 500) {
        if (!folderPath) {
            this.logger.warn('Folder path is null or empty');
            return null;
        }
        const startTime = Date.now();
        let attemptCount = 0;
        this.logger.debug(`Scanning folder for bill image: ${folderPath}, timeout: ${timeout}ms, pollInterval: ${pollInterval}ms`);
        while (Date.now() - startTime < timeout) {
            attemptCount++;
            try {
                if (!(0, fs_1.existsSync)(folderPath)) {
                    await (0, time_1.sleep)(pollInterval);
                    continue;
                }
                const files = await (0, promises_1.readdir)(folderPath);
                if (files.length === 0) {
                    await (0, time_1.sleep)(pollInterval);
                    continue;
                }
                const filesWithStat = await Promise.all(files.map(async (file) => {
                    try {
                        const fullPath = (0, path_1.join)(folderPath, file);
                        const s = await (0, promises_1.stat)(fullPath);
                        return { fullPath, mtime: s.mtimeMs, size: s.size };
                    }
                    catch (statError) {
                        return null;
                    }
                }));
                const validFiles = filesWithStat.filter((f) => f !== null && f.size > 0);
                if (validFiles.length === 0) {
                    await (0, time_1.sleep)(pollInterval);
                    continue;
                }
                validFiles.sort((a, b) => b.mtime - a.mtime);
                const latestFile = validFiles[0].fullPath;
                const elapsed = Date.now() - startTime;
                this.logger.log(`Found latest bill image: ${latestFile} after ${elapsed}ms (${attemptCount} attempts)`);
                return latestFile;
            }
            catch (error) {
                this.logger.debug(`Error scanning folder ${folderPath} (attempt ${attemptCount}): ${error.message}, retrying...`);
                await (0, time_1.sleep)(pollInterval);
            }
        }
        const elapsed = Date.now() - startTime;
        this.logger.warn(`Timeout scanning folder for bill image: ${folderPath} after ${elapsed}ms (${attemptCount} attempts)`);
        return null;
    }
};
exports.BankService = BankService;
exports.BankService = BankService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [acb_service_1.AcbService,
        pg_service_1.PgService,
        hdbank_service_1.HdBankService,
        vietcombank_service_1.VietcombankService,
        device_service_1.DeviceService,
        session_management_service_1.SessionManagementService,
        device_lock_service_1.DeviceLockService,
        telegram_service_1.TelegramService])
], BankService);
//# sourceMappingURL=bank.service.js.map