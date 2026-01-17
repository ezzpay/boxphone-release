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
exports.OCRWorkerPoolService = void 0;
const common_1 = require("@nestjs/common");
const Tesseract = require("tesseract.js");
const config_1 = require("../../../common/constants/config");
let OCRWorkerPoolService = class OCRWorkerPoolService {
    constructor() {
        this.logger = new common_1.Logger('OCRWorkerPoolService');
        this.pool = [];
        this.waitingQueue = [];
        this.maxWaitTime = 5000;
        this.maxPoolSize = 10;
        this.isInitializing = false;
        this.isDestroyed = false;
        this.isAcquiring = false;
        this.initializationPromise = null;
        this.poolSize = Math.max(1, Math.min(config_1.config.ocr.poolSize, this.maxPoolSize));
        this.lang = config_1.config.ocr.lang;
        if (config_1.config.ocr.poolSize > this.maxPoolSize) {
            this.logger.warn(`OCR_POOL_SIZE (${config_1.config.ocr.poolSize}) exceeds maximum (${this.maxPoolSize}). Using ${this.maxPoolSize}.`);
        }
    }
    async onModuleInit() {
        await this.warmPool();
    }
    async onModuleDestroy() {
        this.isDestroyed = true;
        this.rejectAllPending(new Error('OCR service is shutting down'));
        await this.terminateAll();
    }
    async warmPool() {
        if (this.isInitializing) {
            return this.initializationPromise || Promise.resolve();
        }
        this.isInitializing = true;
        this.initializationPromise = this.doWarmPool();
        try {
            await this.initializationPromise;
        }
        finally {
            this.isInitializing = false;
        }
    }
    async doWarmPool() {
        const startTime = Date.now();
        this.logger.log(`Warming up OCR worker pool (size: ${this.poolSize}, lang: ${this.lang})...`);
        const initPromises = Array.from({ length: this.poolSize }, (_, index) => this.createWorker(index));
        try {
            await Promise.all(initPromises);
            const warmupTime = Date.now() - startTime;
            this.logger.log(`OCR worker pool warmed up successfully in ${warmupTime}ms. Pool size: ${this.pool.length}`);
        }
        catch (error) {
            this.logger.error(`Failed to warm up worker pool: ${error.message}`, error.stack);
            await this.terminateAll();
            throw error;
        }
    }
    async createWorker(index) {
        try {
            const worker = await Tesseract.createWorker(this.lang, 1, {
                logger: (m) => {
                    if (m.status === 'error') {
                        this.logger.error(`Tesseract worker ${index} error: ${m.message}`);
                    }
                },
            });
            this.pool.push({
                id: index,
                worker,
                inUse: false,
                lastUsed: Date.now(),
            });
            this.logger.debug(`Worker ${index} created successfully`);
        }
        catch (error) {
            this.logger.error(`Failed to create worker ${index}: ${error.message}`);
            throw error;
        }
    }
    async acquireWorker() {
        if (this.isDestroyed) {
            throw new Error('OCR service is destroyed');
        }
        if (this.isInitializing && this.initializationPromise) {
            await this.initializationPromise;
        }
        const workerInfo = this.tryAcquireFromPool();
        if (workerInfo) {
            return workerInfo;
        }
        return this.waitForWorker();
    }
    tryAcquireFromPool() {
        if (this.isAcquiring) {
            return null;
        }
        this.isAcquiring = true;
        try {
            for (const workerInfo of this.pool) {
                if (!workerInfo.inUse) {
                    workerInfo.inUse = true;
                    workerInfo.lastUsed = Date.now();
                    return workerInfo;
                }
            }
            return null;
        }
        finally {
            this.isAcquiring = false;
        }
    }
    waitForWorker() {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                const index = this.waitingQueue.findIndex(p => p.resolve === resolve);
                if (index !== -1) {
                    this.waitingQueue.splice(index, 1);
                }
                this.logger.warn('Timeout waiting for worker, creating temporary worker');
                this.createTemporaryWorker()
                    .then(resolve)
                    .catch(reject);
            }, this.maxWaitTime);
            this.waitingQueue.push({ resolve, reject, timeout });
        });
    }
    async createTemporaryWorker() {
        const tempWorker = await Tesseract.createWorker(this.lang, 1, {
            logger: () => { },
        });
        return {
            id: -1,
            worker: tempWorker,
            inUse: true,
            lastUsed: Date.now(),
        };
    }
    releaseWorker(workerInfo) {
        if (this.waitingQueue.length > 0) {
            const pending = this.waitingQueue.shift();
            clearTimeout(pending.timeout);
            workerInfo.lastUsed = Date.now();
            pending.resolve(workerInfo);
        }
        else {
            workerInfo.inUse = false;
            workerInfo.lastUsed = Date.now();
        }
    }
    rejectAllPending(error) {
        while (this.waitingQueue.length > 0) {
            const pending = this.waitingQueue.shift();
            clearTimeout(pending.timeout);
            pending.reject(error);
        }
    }
    async recognize(imageBuffer, options = {}) {
        const workerInfo = await this.acquireWorker();
        const isTemporary = workerInfo.id < 0;
        const { psm, charWhitelist } = options;
        const hadCustomParams = psm !== undefined || !!charWhitelist;
        try {
            const params = {};
            if (psm !== undefined) {
                params.tessedit_pageseg_mode = psm;
            }
            if (charWhitelist) {
                params.tessedit_char_whitelist = charWhitelist;
            }
            if (Object.keys(params).length > 0) {
                await workerInfo.worker.setParameters(params);
            }
            const { data } = await workerInfo.worker.recognize(imageBuffer);
            return {
                text: data.text,
                confidence: data.confidence,
            };
        }
        finally {
            if (isTemporary) {
                try {
                    await workerInfo.worker.terminate();
                }
                catch (error) {
                    this.logger.warn(`Failed to terminate temporary worker: ${error.message}`);
                }
            }
            else {
                if (hadCustomParams) {
                    try {
                        await workerInfo.worker.setParameters({
                            tessedit_pageseg_mode: 6,
                            tessedit_char_whitelist: '',
                        });
                    }
                    catch (error) {
                        this.logger.warn(`Failed to reset worker parameters: ${error.message}`);
                    }
                }
                this.releaseWorker(workerInfo);
            }
        }
    }
    getPoolStats() {
        return {
            total: this.pool.length,
            inUse: this.pool.filter(w => w.inUse).length,
            waiting: this.waitingQueue.length,
        };
    }
    async terminateAll() {
        if (this.pool.length === 0) {
            return;
        }
        this.logger.log(`Terminating ${this.pool.length} OCR workers...`);
        const terminatePromises = this.pool.map((workerInfo) => workerInfo.worker
            .terminate()
            .then(() => {
            this.logger.debug(`Worker ${workerInfo.id} terminated`);
        })
            .catch((error) => {
            this.logger.error(`Error terminating worker ${workerInfo.id}: ${error.message}`);
        }));
        await Promise.all(terminatePromises);
        this.pool.length = 0;
        this.logger.log('All OCR workers terminated');
    }
};
exports.OCRWorkerPoolService = OCRWorkerPoolService;
exports.OCRWorkerPoolService = OCRWorkerPoolService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], OCRWorkerPoolService);
//# sourceMappingURL=ocr-worker-pool.service.js.map