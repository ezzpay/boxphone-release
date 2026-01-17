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
var OCRService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OCRService = void 0;
const common_1 = require("@nestjs/common");
const promises_1 = require("fs/promises");
const ocr_worker_pool_service_1 = require("./ocr-worker-pool.service");
const image_preprocessing_service_1 = require("./image-preprocessing.service");
const string_1 = require("../../../common/utils/string");
const config_1 = require("../../../common/constants/config");
const DEFAULT_ROI_CONFIG = {
    crop: { x: 0, y: 0, width: 1, height: 1 },
    psm: 6,
    charWhitelist: undefined,
    maxWidth: 1200,
};
let OCRService = OCRService_1 = class OCRService {
    constructor(workerPoolService, imagePreprocessingService) {
        this.workerPoolService = workerPoolService;
        this.imagePreprocessingService = imagePreprocessingService;
        this.logger = new common_1.Logger(OCRService_1.name);
        this.ocrConfig = {
            poolSize: config_1.config.ocr.poolSize,
            lang: config_1.config.ocr.lang,
            rois: {
                full: DEFAULT_ROI_CONFIG,
                singleLine: { ...DEFAULT_ROI_CONFIG, psm: 7 },
                block: { ...DEFAULT_ROI_CONFIG, psm: 6 },
            },
        };
    }
    validateROI(roi) {
        return {
            x: Math.max(0, Math.min(1, roi.x || 0)),
            y: Math.max(0, Math.min(1, roi.y || 0)),
            width: Math.max(0.01, Math.min(1, roi.width || 1)),
            height: Math.max(0.01, Math.min(1, roi.height || 1)),
        };
    }
    getROIConfig(fieldType) {
        const config = this.ocrConfig.rois?.[fieldType]
            || this.ocrConfig.rois?.full
            || DEFAULT_ROI_CONFIG;
        return {
            crop: config.crop || DEFAULT_ROI_CONFIG.crop,
            psm: config.psm ?? DEFAULT_ROI_CONFIG.psm,
            charWhitelist: config.charWhitelist,
            maxWidth: config.maxWidth ?? DEFAULT_ROI_CONFIG.maxWidth,
        };
    }
    async recognizeFromFile(imagePath, options = {}) {
        const totalStartTime = Date.now();
        const timingBreakdown = {
            decodeImage: 0,
            preprocess: 0,
            ocrRecognize: 0,
            postprocess: 0,
        };
        try {
            const decodeStart = Date.now();
            const imageBuffer = await (0, promises_1.readFile)(imagePath);
            timingBreakdown.decodeImage = Date.now() - decodeStart;
            const fieldType = options.fieldType || 'full';
            const roiConfig = this.getROIConfig(fieldType);
            const roi = this.validateROI(options.customROI || roiConfig.crop);
            const preprocessStart = Date.now();
            const preprocessResult = await this.imagePreprocessingService.preprocess(imageBuffer, roi, roiConfig.maxWidth, options.preprocess);
            timingBreakdown.preprocess = Date.now() - preprocessStart;
            const ocrStart = Date.now();
            const ocrResult = await this.workerPoolService.recognize(preprocessResult.buffer, {
                psm: roiConfig.psm,
                charWhitelist: roiConfig.charWhitelist,
            });
            timingBreakdown.ocrRecognize = Date.now() - ocrStart;
            const postprocessStart = Date.now();
            const processedText = this.postprocessText(ocrResult.text);
            timingBreakdown.postprocess = Date.now() - postprocessStart;
            const totalProcessingTime = Date.now() - totalStartTime;
            this.logTimingBreakdown(imagePath, fieldType, totalProcessingTime, timingBreakdown, ocrResult.confidence);
            return {
                text: processedText,
                confidence: ocrResult.confidence,
                processingTime: totalProcessingTime,
                timingBreakdown,
            };
        }
        catch (error) {
            this.logger.error(`OCR error for ${imagePath}: ${error.message}`, error.stack);
            return null;
        }
    }
    async recognizeFromBuffer(imageBuffer, options = {}) {
        const totalStartTime = Date.now();
        const timingBreakdown = {
            decodeImage: 0,
            preprocess: 0,
            ocrRecognize: 0,
            postprocess: 0,
        };
        try {
            timingBreakdown.decodeImage = 0;
            const fieldType = options.fieldType || 'full';
            const roiConfig = this.getROIConfig(fieldType);
            const roi = this.validateROI(options.customROI || roiConfig.crop);
            const preprocessStart = Date.now();
            const preprocessResult = await this.imagePreprocessingService.preprocess(imageBuffer, roi, roiConfig.maxWidth, options.preprocess);
            timingBreakdown.preprocess = Date.now() - preprocessStart;
            const ocrStart = Date.now();
            const ocrResult = await this.workerPoolService.recognize(preprocessResult.buffer, {
                psm: roiConfig.psm,
                charWhitelist: roiConfig.charWhitelist,
            });
            timingBreakdown.ocrRecognize = Date.now() - ocrStart;
            const postprocessStart = Date.now();
            const processedText = this.postprocessText(ocrResult.text);
            timingBreakdown.postprocess = Date.now() - postprocessStart;
            const totalProcessingTime = Date.now() - totalStartTime;
            this.logTimingBreakdown('buffer', fieldType, totalProcessingTime, timingBreakdown, ocrResult.confidence);
            return {
                text: processedText,
                confidence: ocrResult.confidence,
                processingTime: totalProcessingTime,
                timingBreakdown,
            };
        }
        catch (error) {
            this.logger.error(`OCR error from buffer: ${error.message}`, error.stack);
            return null;
        }
    }
    async fastScreenOCR(imagePath, searchTexts, options = {}) {
        const result = await this.recognizeFromFile(imagePath, {
            fieldType: options.fieldType || 'full',
            customROI: options.customROI,
            preprocess: options.preprocess,
        });
        if (!result || !result.text) {
            return {
                found: false,
                matchedTexts: [],
                result,
            };
        }
        const normalizedText = (0, string_1.normalizeBankAccountName)(result.text);
        const matchedTexts = searchTexts.filter((searchText) => normalizedText.includes((0, string_1.normalizeBankAccountName)(searchText)));
        return {
            found: matchedTexts.length > 0,
            matchedTexts,
            result,
        };
    }
    postprocessText(text) {
        return text
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/\n{3,}/g, '\n\n');
    }
    logTimingBreakdown(imageSource, fieldType, totalTime, breakdown, confidence) {
        const breakdownStr = [
            `decode=${breakdown.decodeImage}ms`,
            `preprocess=${breakdown.preprocess}ms`,
            `ocr=${breakdown.ocrRecognize}ms`,
            `postprocess=${breakdown.postprocess}ms`,
        ].join(' | ');
        if (totalTime > 1000) {
            this.logger.warn(`⚠️ OCR latency exceeded target: ${totalTime}ms > 1000ms (p95 target)`);
        }
    }
};
exports.OCRService = OCRService;
exports.OCRService = OCRService = OCRService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ocr_worker_pool_service_1.OCRWorkerPoolService,
        image_preprocessing_service_1.ImagePreprocessingService])
], OCRService);
//# sourceMappingURL=ocr.service.js.map