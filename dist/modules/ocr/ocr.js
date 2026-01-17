"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeBill = exports.ocrBillPro = exports.ocrBillFree = void 0;
const config_1 = require("../../common/constants/config");
const ocr_space_api_wrapper_1 = require("ocr-space-api-wrapper");
const common_1 = require("@nestjs/common");
const logger = new common_1.Logger('OCRService');
const ocrBillFree = async (base64Image) => {
    try {
        const result = await (0, ocr_space_api_wrapper_1.ocrSpace)(base64Image, {
            apiKey: config_1.config.spaceocr.keyFree,
            language: 'eng',
            scale: true,
            OCREngine: '2',
            isTable: true,
        });
        return {
            parsedText: result.ParsedResults[0].ParsedText,
            processingTimeInMilliseconds: result.ProcessingTimeInMilliseconds,
        };
    }
    catch (error) {
        console.error(`Error processing OCR: ${error.message}`);
        throw error;
    }
};
exports.ocrBillFree = ocrBillFree;
const ocrBillPro = async (imageSource) => {
    try {
        const randomServer = Math.floor(Math.random() * 2) + 1;
        const datacenter = randomServer === 1 ? config_1.config.spaceocr.datacenterPrimary : config_1.config.spaceocr.datacenterSecond;
        const result = await (0, ocr_space_api_wrapper_1.ocrSpace)(imageSource, {
            apiKey: config_1.config.spaceocr.key,
            language: 'eng',
            scale: true,
            OCREngine: '2',
            isTable: true,
            ocrUrl: datacenter
        });
        return {
            parsedText: result.ParsedResults[0].ParsedText,
            processingTimeInMilliseconds: result.ProcessingTimeInMilliseconds,
        };
    }
    catch (error) {
        logger.error(`Error processing OCR: ${error.message}`);
        return null;
    }
};
exports.ocrBillPro = ocrBillPro;
const successValue = [
    'chuyển tiền thành công',
    'funds transfer successful',
];
const analyzeBill = (value) => {
    const lowerValue = value.toLowerCase();
    if (successValue.some(v => lowerValue.includes(v))) {
        return {
            analyzedStatus: 'success'
        };
    }
    return {
        analyzedStatus: 'unknown',
    };
};
exports.analyzeBill = analyzeBill;
//# sourceMappingURL=ocr.js.map