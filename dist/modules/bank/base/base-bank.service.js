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
var BaseBankService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseBankService = void 0;
const common_1 = require("@nestjs/common");
const device_service_1 = require("../../device/device.service");
const websocket_1 = require("../../../common/modules/websocket/constants/websocket");
const time_1 = require("../../../common/utils/time");
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const ocr_service_1 = require("../../ocr/services/ocr.service");
const image_preprocessing_service_1 = require("../../ocr/services/image-preprocessing.service");
const qrcode_1 = require("qrcode");
const analyze_bill_1 = require("../constants/analyze-bill");
const string_1 = require("../../../common/utils/string");
let BaseBankService = BaseBankService_1 = class BaseBankService {
    constructor(wsService, deviceService, ocrService, imagePreprocessingService) {
        this.wsService = wsService;
        this.deviceService = deviceService;
        this.ocrService = ocrService;
        this.imagePreprocessingService = imagePreprocessingService;
        this.baseTransactionFolderPath = 'C:/EasyData';
        this.baseTransactionExecutionFolder = 'C:/EasyTrx';
        this.cleanupFolder = async (dir, deviceId) => {
            if ((0, fs_1.existsSync)(dir)) {
                try {
                    await (0, promises_1.rm)(dir, { recursive: true, force: true });
                }
                catch (cleanupError) {
                    this.logger.debug(`[${deviceId}] Failed to cleanup folder: ${cleanupError.message}`);
                }
            }
        };
        this.logger = new common_1.Logger('BaseBankService');
        BaseBankService_1.createTransactionFolder(this.baseTransactionFolderPath, this.logger);
        BaseBankService_1.createTransactionFolder(this.baseTransactionExecutionFolder, this.logger);
    }
    static createTransactionFolder(folderPath, logger) {
        if (BaseBankService_1.folderCreated) {
            return;
        }
        if (BaseBankService_1.folderCreationInProgress) {
            let attempts = 0;
            const maxAttempts = 10;
            while (BaseBankService_1.folderCreationInProgress && attempts < maxAttempts) {
                attempts++;
                const start = Date.now();
                while (Date.now() - start < 10) {
                }
            }
            if (BaseBankService_1.folderCreated || (0, fs_1.existsSync)(folderPath)) {
                BaseBankService_1.folderCreated = true;
                return;
            }
        }
        try {
            BaseBankService_1.folderCreationInProgress = true;
            if (!(0, fs_1.existsSync)(folderPath)) {
                (0, fs_1.mkdirSync)(folderPath, { recursive: true });
                logger.log(`Created base folder: ${folderPath}`);
            }
            else {
                logger.debug(`Base folder already exists: ${folderPath}`);
            }
            BaseBankService_1.folderCreated = true;
        }
        catch (error) {
            if (error.code !== 'EEXIST') {
                logger.error(`Failed to create base folder ${folderPath}: ${error.message}`);
            }
            else {
                BaseBankService_1.folderCreated = true;
                logger.debug(`Base folder already exists (created by another process): ${folderPath}`);
            }
        }
        finally {
            BaseBankService_1.folderCreationInProgress = false;
        }
    }
    getBankCode() {
        return this.BANK_CODE;
    }
    async killApp(deviceId) {
        this.logger.log(`[${deviceId}] Killing ${this.BANK_CODE} app`);
        await this.wsService.killApp(deviceId, this.BUNDLE_ID);
    }
    async clickWithTransition(deviceId, x, y, transitionTime, log = '') {
        await this.wsService.click(deviceId, x, y, 0.2);
        if (log) {
            this.logger.log(log);
        }
        await (0, time_1.sleep)(transitionTime);
    }
    async verifyScreenState(deviceId, config) {
        const { expectedTexts = [], unexpectedTexts = [], timeout = 30000, pollInterval = 500, roi, fieldType = 'full', preprocess, } = config;
        const startTime = Date.now();
        let attemptCount = 0;
        const tempDir = (0, path_1.join)(this.baseTransactionExecutionFolder, `scan_${deviceId}`);
        const roiInfo = roi
            ? `ROI: x=${roi.x}, y=${roi.y}, w=${roi.width}, h=${roi.height}`
            : 'Full screen';
        this.logger.debug(`[${deviceId}] Starting screen verification. ` +
            `Expected: [${expectedTexts.join(', ')}], ` +
            `Unexpected: [${unexpectedTexts.join(', ')}], ` +
            `${roiInfo}, ` +
            `Timeout: ${timeout}ms, Poll: ${pollInterval}ms`);
        try {
            await this.cleanupFolder(tempDir, deviceId);
            await (0, promises_1.mkdir)(tempDir, { recursive: true });
            while (Date.now() - startTime < timeout) {
                attemptCount++;
                let tempScreenshotPath = null;
                try {
                    const beforeCaptureTime = Date.now();
                    await this.wsService.captureScreen(deviceId, {
                        folderPath: tempDir
                    });
                    let latestFile = null;
                    const maxFileWaitAttempts = 5;
                    let fileWaitAttempt = 0;
                    while (fileWaitAttempt < maxFileWaitAttempts && !latestFile) {
                        fileWaitAttempt++;
                        await (0, time_1.sleep)(500);
                        try {
                            if (!(0, fs_1.existsSync)(tempDir)) {
                                continue;
                            }
                            const files = await (0, promises_1.readdir)(tempDir);
                            const pngFiles = files.filter(f => f.endsWith('.png'));
                            if (pngFiles.length === 0) {
                                continue;
                            }
                            let latestMtime = 0;
                            const now = Date.now();
                            for (const file of pngFiles) {
                                const filePath = (0, path_1.join)(tempDir, file);
                                try {
                                    const fileStat = await (0, promises_1.stat)(filePath);
                                    if (fileStat.size === 0) {
                                        continue;
                                    }
                                    if (fileStat.mtimeMs >= beforeCaptureTime - 2000) {
                                        if (fileStat.mtimeMs > latestMtime) {
                                            latestMtime = fileStat.mtimeMs;
                                            latestFile = filePath;
                                        }
                                    }
                                }
                                catch (statError) {
                                    continue;
                                }
                            }
                        }
                        catch (readdirError) {
                            continue;
                        }
                    }
                    if (!latestFile) {
                        await (0, time_1.sleep)(pollInterval);
                        continue;
                    }
                    tempScreenshotPath = latestFile;
                    const allSearchTexts = [...expectedTexts, ...unexpectedTexts];
                    const ocrResult = await this.ocrService.fastScreenOCR(tempScreenshotPath, allSearchTexts, {
                        fieldType: roi ? 'singleLine' : fieldType,
                        customROI: roi,
                        preprocess: preprocess,
                    });
                    if (!ocrResult || !ocrResult.found) {
                        await (0, time_1.sleep)(pollInterval);
                        continue;
                    }
                    const hasExpectedTexts = expectedTexts.length === 0 || expectedTexts.some(text => ocrResult.matchedTexts.includes(text));
                    const hasUnexpectedTexts = unexpectedTexts.some(text => ocrResult.matchedTexts.includes(text));
                    if (hasExpectedTexts && !hasUnexpectedTexts) {
                        await this.cleanupFolder(tempDir, deviceId);
                        const elapsed = Date.now() - startTime;
                        const ocrTime = ocrResult.result?.processingTime || 0;
                        const roiStr = roi ? ` (ROI: ${roi.x},${roi.y} ${roi.width}x${roi.height})` : '';
                        this.logger.log(`[${deviceId}] Screen verified successfully after ${elapsed}ms ` +
                            `(${attemptCount} attempts, OCR: ${ocrTime}ms)${roiStr}. ` +
                            `Matched: [${ocrResult.matchedTexts.join(', ')}]`);
                        return true;
                    }
                    if (attemptCount % 5 === 0) {
                        this.logger.debug(`[${deviceId}] Screen not matched yet (attempt ${attemptCount}). ` +
                            `Matched texts: [${ocrResult.matchedTexts.join(', ')}], ` +
                            `Expected: [${expectedTexts.join(', ')}]`);
                    }
                    if (tempScreenshotPath) {
                        try {
                            await (0, promises_1.unlink)(tempScreenshotPath);
                        }
                        catch {
                        }
                    }
                    await (0, time_1.sleep)(pollInterval);
                }
                catch (error) {
                    this.logger.debug(`[${deviceId}] Error verifying screen (attempt ${attemptCount}): ${error.message}, retrying...`);
                    await (0, time_1.sleep)(pollInterval);
                }
            }
            await this.cleanupFolder(tempDir, deviceId);
            const elapsed = Date.now() - startTime;
            this.logger.warn(`[${deviceId}] Screen verification timeout after ${elapsed}ms ` +
                `(${attemptCount} attempts). Expected: [${expectedTexts.join(', ')}]`);
            return false;
        }
        catch (error) {
            await this.cleanupFolder(tempDir, deviceId);
            throw error;
        }
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
    async detectScreenByHint(deviceId, screenHints, config) {
        const tempDir = (0, path_1.join)(this.baseTransactionExecutionFolder, `scan_${deviceId}`);
        const screenHintProcessed = screenHints.map(screenHint => {
            return {
                name: screenHint.name,
                hint: (0, string_1.removeVietnameseTones)(screenHint.hint),
            };
        });
        const startTime = Date.now();
        let attemptCount = 0;
        const { roi, timeout, pollInterval } = config;
        const roiInfo = roi
            ? `ROI: x=${roi.x}, y=${roi.y}, w=${roi.width}, h=${roi.height}`
            : 'Full screen';
        this.logger.debug(`[${deviceId}] Start detecting screen. ` +
            `Screen: [${screenHints.map(screenHint => screenHint.name).join(' or ')}], ` +
            `${roiInfo}, ` +
            `Timeout: ${timeout}ms, Poll: ${pollInterval}ms`);
        try {
            await this.cleanupFolder(tempDir, deviceId);
            await (0, promises_1.mkdir)(tempDir, { recursive: true });
            while (Date.now() - startTime < timeout) {
                attemptCount++;
                let tempScreenshotPath = null;
                try {
                    const beforeCaptureTime = Date.now();
                    await this.wsService.captureScreen(deviceId, {
                        folderPath: tempDir
                    });
                    let latestFile = null;
                    const maxFileWaitAttempts = 5;
                    let fileWaitAttempt = 0;
                    while (fileWaitAttempt < maxFileWaitAttempts && !latestFile) {
                        fileWaitAttempt++;
                        await (0, time_1.sleep)(500);
                        try {
                            if (!(0, fs_1.existsSync)(tempDir)) {
                                continue;
                            }
                            const files = await (0, promises_1.readdir)(tempDir);
                            const pngFiles = files.filter(f => f.endsWith('.png'));
                            if (pngFiles.length === 0) {
                                continue;
                            }
                            let latestMtime = 0;
                            for (const file of pngFiles) {
                                const filePath = (0, path_1.join)(tempDir, file);
                                try {
                                    const fileStat = await (0, promises_1.stat)(filePath);
                                    if (fileStat.size === 0) {
                                        continue;
                                    }
                                    if (fileStat.mtimeMs >= beforeCaptureTime - 2000) {
                                        if (fileStat.mtimeMs > latestMtime) {
                                            latestMtime = fileStat.mtimeMs;
                                            latestFile = filePath;
                                        }
                                    }
                                }
                                catch (statError) {
                                    continue;
                                }
                            }
                        }
                        catch (readdirError) {
                            continue;
                        }
                    }
                    if (!latestFile) {
                        await (0, time_1.sleep)(pollInterval);
                        continue;
                    }
                    const imageBuffer = await (0, promises_1.readFile)(latestFile);
                    const processedImage = await this.imagePreprocessingService.preprocess(imageBuffer, config.roi
                        ? config.roi
                        : {
                            x: 0,
                            y: 0,
                            width: 1,
                            height: 1,
                        }, undefined, config.preprocess);
                    const ocrResult = await this.ocrService.recognizeFromBuffer(processedImage.buffer);
                    if (!ocrResult.text) {
                        await (0, time_1.sleep)(pollInterval);
                        continue;
                    }
                    const normalizedText = (0, string_1.removeVietnameseTones)(ocrResult.text);
                    const screenHintFound = screenHintProcessed.find(screenHint => normalizedText.includes(screenHint.hint));
                    if (!screenHintFound) {
                        await (0, time_1.sleep)(pollInterval);
                        continue;
                    }
                    if (tempScreenshotPath) {
                        try {
                            await (0, promises_1.unlink)(tempScreenshotPath);
                        }
                        catch {
                        }
                    }
                    return screenHintFound;
                }
                catch (error) {
                    this.logger.debug(`[${deviceId}] Error verifying screen (attempt ${attemptCount}): ${error.message}, retrying...`);
                    await (0, time_1.sleep)(pollInterval);
                }
            }
            await this.cleanupFolder(tempDir, deviceId);
            const elapsed = Date.now() - startTime;
            this.logger.warn(`[${deviceId}] Screen verification timeout after ${elapsed}ms ` +
                `(${attemptCount} attempts). Expected: Find [${screenHints.join(' or ')}],`);
            return null;
        }
        catch (error) {
            await this.cleanupFolder(tempDir, deviceId);
            throw error;
        }
    }
    async clickAndWaitForScreen(deviceId, x, y, screenConfig, log) {
        await this.wsService.click(deviceId, x, y, 0.2);
        if (log) {
            this.logger.log(log);
        }
        const verified = await this.verifyScreenState(deviceId, screenConfig);
        return verified;
    }
    async swipeAndWaitForScreen(deviceId, swipeOptions, screenConfig, log) {
        const maxRetries = 3;
        const timeoutPerAttempt = 3000;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            await this.wsService.swipe(deviceId, swipeOptions);
            await (0, time_1.sleep)(800);
            if (log && attempt === 1) {
                this.logger.log(log);
            }
            const verified = await this.verifyScreenState(deviceId, {
                ...screenConfig,
                timeout: timeoutPerAttempt,
            });
            if (verified) {
                if (attempt > 1) {
                    this.logger.log(`[${deviceId}] Screen verified after ${attempt} swipe attempts`);
                }
                return true;
            }
            try {
                const tempDir = (0, path_1.join)(this.baseTransactionExecutionFolder, `scan_${deviceId}_debug`);
                if ((0, fs_1.existsSync)(tempDir)) {
                    try {
                        await (0, promises_1.rm)(tempDir, { recursive: true, force: true });
                    }
                    catch { }
                }
                await (0, promises_1.mkdir)(tempDir, { recursive: true });
                const beforeCaptureTime = Date.now();
                await this.wsService.captureScreen(deviceId, {
                    folderPath: tempDir
                });
                let latestFile = null;
                const maxFileWaitAttempts = 5;
                let fileWaitAttempt = 0;
                while (fileWaitAttempt < maxFileWaitAttempts && !latestFile) {
                    fileWaitAttempt++;
                    await (0, time_1.sleep)(500);
                    try {
                        if (!(0, fs_1.existsSync)(tempDir)) {
                            continue;
                        }
                        const files = await (0, promises_1.readdir)(tempDir);
                        const pngFiles = files.filter(f => f.endsWith('.png'));
                        if (pngFiles.length === 0) {
                            continue;
                        }
                        let latestMtime = 0;
                        for (const file of pngFiles) {
                            const filePath = (0, path_1.join)(tempDir, file);
                            try {
                                const fileStat = await (0, promises_1.stat)(filePath);
                                if (fileStat.size > 0 && fileStat.mtimeMs >= beforeCaptureTime - 2000) {
                                    if (fileStat.mtimeMs > latestMtime) {
                                        latestMtime = fileStat.mtimeMs;
                                        latestFile = filePath;
                                    }
                                }
                            }
                            catch { }
                        }
                    }
                    catch { }
                }
                if (latestFile) {
                    const { expectedTexts = [], unexpectedTexts = [], roi, fieldType = 'full', preprocess } = screenConfig;
                    const allSearchTexts = [...expectedTexts, ...unexpectedTexts];
                    let ocrText = '';
                    let matchedTexts = [];
                    if (allSearchTexts.length > 0) {
                        const ocrResult = await this.ocrService.fastScreenOCR(latestFile, allSearchTexts, {
                            fieldType: roi ? 'singleLine' : fieldType,
                            customROI: roi,
                            preprocess: preprocess,
                        });
                        ocrText = ocrResult?.result?.text || '';
                        matchedTexts = ocrResult?.matchedTexts || [];
                    }
                    else {
                        const ocrResult = await this.ocrService.recognizeFromFile(latestFile, {
                            fieldType: roi ? 'singleLine' : fieldType,
                            customROI: roi,
                            preprocess: preprocess,
                        });
                        ocrText = ocrResult?.text || '';
                    }
                    const roiStr = roi ? ` ROI: (${roi.x},${roi.y} ${roi.width}x${roi.height})` : '';
                    if (ocrText) {
                        this.logger.warn(`[${deviceId}] Swipe attempt ${attempt}/${maxRetries} - OCR detected text: "${ocrText}"` +
                            (matchedTexts.length > 0 ? ` | Matched texts: [${matchedTexts.join(', ')}]` : '') +
                            ` | Expected: [${expectedTexts.join(', ') || 'none'}]${roiStr}`);
                    }
                    else {
                        this.logger.warn(`[${deviceId}] Swipe attempt ${attempt}/${maxRetries} - OCR found no text${roiStr}`);
                    }
                }
                else {
                    this.logger.warn(`[${deviceId}] Swipe attempt ${attempt}/${maxRetries} - Could not find screenshot file after ${fileWaitAttempt} attempts`);
                }
                try {
                    await (0, promises_1.rm)(tempDir, { recursive: true, force: true });
                }
                catch { }
            }
            catch (debugError) {
                this.logger.debug(`[${deviceId}] Failed to debug OCR: ${debugError.message}`);
            }
            if (attempt < maxRetries) {
                this.logger.debug(`[${deviceId}] Screen not detected after swipe (attempt ${attempt}/${maxRetries}), retrying...`);
            }
        }
        this.logger.warn(`[${deviceId}] Failed to detect screen after ${maxRetries} swipe attempts`);
        return false;
    }
    async createBillFolder(folderPath) {
        const path = (0, path_1.resolve)(this.baseTransactionFolderPath, folderPath);
        await (0, promises_1.mkdir)(path, { recursive: true });
    }
    async captureScreen(deviceId, options) {
        this.logger.log(`Capturing screen on device ${deviceId} with folderPath: ${options.folderPath}`);
        const path = (0, path_1.resolve)(this.baseTransactionFolderPath, options.folderPath);
        await this.wsService.captureScreen(deviceId, {
            ...options,
            folderPath: path,
        });
        await (0, time_1.sleep)(500);
    }
    async getBillImagePath(folderPath, timeout = 10000, pollInterval = 500) {
        if (!folderPath) {
            this.logger.warn('Folder path is null or empty');
            return null;
        }
        const folder = (0, path_1.join)(this.baseTransactionFolderPath, folderPath);
        const startTime = Date.now();
        let attemptCount = 0;
        this.logger.debug(`Scanning folder for bill image: ${folderPath}, timeout: ${timeout}ms, pollInterval: ${pollInterval}ms`);
        while (Date.now() - startTime < timeout) {
            attemptCount++;
            try {
                if (!(0, fs_1.existsSync)(folder)) {
                    await (0, time_1.sleep)(pollInterval);
                    continue;
                }
                const files = await (0, promises_1.readdir)(folder);
                if (files.length === 0) {
                    await (0, time_1.sleep)(pollInterval);
                    continue;
                }
                const filesWithStat = await Promise.all(files.map(async (file) => {
                    try {
                        const fullPath = (0, path_1.join)(folder, file);
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
    async analyzeTransferBill(bankCode, withdrawal) {
        const { ROI, expectedTexts } = analyze_bill_1.ANALYZE_BILL_ROI[bankCode];
        const billImage = await this.getBillImagePath(withdrawal.withdrawalCode);
        try {
            if (!billImage) {
                this.logger.warn(`No bill image path ${withdrawal.withdrawalCode}`);
                return {
                    rawPath: null,
                    analyzedStatus: 'na',
                };
            }
            const ocrResult = await this.ocrService.fastScreenOCR(billImage, expectedTexts, {
                fieldType: 'singleLine',
                customROI: ROI,
                preprocess: {
                    grayscale: true,
                    enhanceContrast: true
                }
            });
            if (!ocrResult.found) {
                this.logger.warn(`No OCR result found for ${withdrawal.withdrawalCode}`);
                return {
                    rawPath: billImage,
                    analyzedStatus: 'na'
                };
            }
            return {
                rawPath: billImage,
                analyzedStatus: ocrResult.found ? 'success' : 'unknown',
            };
        }
        catch (error) {
            this.logger.error(`Error analyzing transfer bill: ${error.message}`);
            return {
                rawPath: billImage,
                analyzedStatus: 'na'
            };
        }
    }
    async createQRCodeAndTransferTo(deviceId, withdrawal) {
        const folderPath = (0, path_1.join)(this.baseTransactionExecutionFolder, 'qrcode');
        await (0, promises_1.mkdir)(folderPath, { recursive: true });
        const fileName = `qr_${withdrawal.withdrawalCode}.png`;
        const filePath = (0, path_1.join)(folderPath, fileName);
        await (0, qrcode_1.toFile)(filePath, withdrawal.transferCode, {
            type: 'png',
            width: 228,
            margin: 2
        });
        await (0, time_1.sleep)(500);
        await this.wsService.transferFile(deviceId, filePath, 1);
        await (0, time_1.sleep)(500);
        this.logger.log(`[${deviceId}] QR code is created and transferred for withdrawal ${withdrawal.withdrawalId}`);
    }
};
exports.BaseBankService = BaseBankService;
BaseBankService.folderCreationInProgress = false;
BaseBankService.folderCreated = false;
exports.BaseBankService = BaseBankService = BaseBankService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(websocket_1.WEBSOCKET_SERVICE)),
    __metadata("design:paramtypes", [Object, device_service_1.DeviceService,
        ocr_service_1.OCRService,
        image_preprocessing_service_1.ImagePreprocessingService])
], BaseBankService);
//# sourceMappingURL=base-bank.service.js.map