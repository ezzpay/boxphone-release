"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fastScreenOCR = exports.localOCR = void 0;
const Tesseract = require("tesseract.js");
const common_1 = require("@nestjs/common");
const promises_1 = require("fs/promises");
const logger = new common_1.Logger('LocalOCR');
const localOCR = async (imagePath, options = {}) => {
    const startTime = Date.now();
    const { language = 'vie', fastMode = true } = options;
    try {
        const imageBuffer = await (0, promises_1.readFile)(imagePath);
        const workerConfig = {
            logger: (m) => {
                if (m.status === 'error') {
                    logger.error(`Tesseract error: ${m.message}`);
                }
            },
        };
        if (fastMode) {
            workerConfig.psm = 6;
        }
        const worker = await Tesseract.createWorker(language, 1, workerConfig);
        const { data } = await worker.recognize(imageBuffer);
        await worker.terminate();
        const processingTime = Date.now() - startTime;
        logger.debug(`Local OCR completed in ${processingTime}ms. ` +
            `Confidence: ${data.confidence.toFixed(2)}%, ` +
            `Text length: ${data.text.length}`);
        return {
            text: data.text,
            confidence: data.confidence,
            processingTime
        };
    }
    catch (error) {
        logger.error(`Local OCR error: ${error.message}`);
        return null;
    }
};
exports.localOCR = localOCR;
const fastScreenOCR = async (imagePath, searchTexts) => {
    const startTime = Date.now();
    try {
        const result = await (0, exports.localOCR)(imagePath, {
            language: 'eng+vie',
            fastMode: true
        });
        if (!result || !result.text) {
            return {
                found: false,
                matchedTexts: [],
                processingTime: Date.now() - startTime
            };
        }
        const lowerText = result.text.toLowerCase();
        const matchedTexts = searchTexts.filter(searchText => lowerText.includes(searchText.toLowerCase()));
        return {
            found: matchedTexts.length > 0,
            matchedTexts,
            processingTime: Date.now() - startTime
        };
    }
    catch (error) {
        logger.error(`Fast screen OCR error: ${error.message}`);
        return {
            found: false,
            matchedTexts: [],
            processingTime: Date.now() - startTime
        };
    }
};
exports.fastScreenOCR = fastScreenOCR;
//# sourceMappingURL=local-ocr.js.map