"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = require("dotenv");
const path_1 = require("path");
(0, dotenv_1.config)({ path: (0, path_1.join)(process.cwd(), '.env') });
exports.config = {
    NODE_ENV: (process.env.NODE_ENV || 'production'),
    boxType: 'PANDA',
    redis: {
        host: process.env.REDIS_HOST ?? '14.225.44.234',
        port: parseInt(process.env.REDIS_PORT ?? '6888'),
        db: 3,
        password: process.env.REDIS_PWD ?? 'Dcsvnqvmn1',
    },
    ezpayBe: {
        apiUrl: process.env.EZZPAY_BE ?? 'https://api-hn.botpro.world/payment',
        apiKey: process.env.EZZPAY_KEY ?? 'uHqE5X9H0QEBsqlZpdTHG0fOyvmMtHjCGgsG4ouls3Gz9WvaWg4w9HV3sqETGWfE',
    },
    ocr: {
        poolSize: parseInt(process.env.OCR_POOL_SIZE || '4', 10),
        lang: process.env.OCR_LANG || 'vie',
        rois: {
            singleLine: {
                crop: {
                    x: parseFloat(process.env.OCR_ROI_SINGLE_X || '0'),
                    y: parseFloat(process.env.OCR_ROI_SINGLE_Y || '0'),
                    width: parseFloat(process.env.OCR_ROI_SINGLE_WIDTH || '1'),
                    height: parseFloat(process.env.OCR_ROI_SINGLE_HEIGHT || '1'),
                },
                psm: parseInt(process.env.OCR_PSM_SINGLE || '7', 10),
                charWhitelist: process.env.OCR_WHITELIST_SINGLE || '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz .-',
                maxWidth: parseInt(process.env.OCR_MAX_WIDTH_SINGLE || '800', 10),
            },
            block: {
                crop: {
                    x: parseFloat(process.env.OCR_ROI_BLOCK_X || '0'),
                    y: parseFloat(process.env.OCR_ROI_BLOCK_Y || '0'),
                    width: parseFloat(process.env.OCR_ROI_BLOCK_WIDTH || '1'),
                    height: parseFloat(process.env.OCR_ROI_BLOCK_HEIGHT || '1'),
                },
                psm: parseInt(process.env.OCR_PSM_BLOCK || '6', 10),
                charWhitelist: process.env.OCR_WHITELIST_BLOCK || undefined,
                maxWidth: parseInt(process.env.OCR_MAX_WIDTH_BLOCK || '1200', 10),
            },
            full: {
                crop: {
                    x: 0,
                    y: 0,
                    width: 1,
                    height: 1,
                },
                psm: parseInt(process.env.OCR_PSM_FULL || '6', 10),
                charWhitelist: undefined,
                maxWidth: parseInt(process.env.OCR_MAX_WIDTH_FULL || '1200', 10),
            },
        },
    },
    spaceocr: {
        datacenterPrimary: 'https://apipro1.ocr.space/parse/image',
        datacenterSecond: 'https://apipro2.ocr.space/parse/image',
        key: 'G888CWKP2Y06X',
        keyFree: 'K82766678488957',
    },
};
//# sourceMappingURL=config.js.map