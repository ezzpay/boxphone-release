"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImagePreprocessingService = void 0;
const common_1 = require("@nestjs/common");
const sharp = require("sharp");
let ImagePreprocessingService = class ImagePreprocessingService {
    constructor() {
        this.logger = new common_1.Logger('ImagePreprocessingService');
        this.MIN_DIMENSION = 10;
    }
    validateROI(roi) {
        if (roi.x < 0 || roi.x > 1) {
            throw new Error(`Invalid ROI x: ${roi.x} (must be 0-1)`);
        }
        if (roi.y < 0 || roi.y > 1) {
            throw new Error(`Invalid ROI y: ${roi.y} (must be 0-1)`);
        }
        if (roi.width <= 0 || roi.width > 1) {
            throw new Error(`Invalid ROI width: ${roi.width} (must be 0-1)`);
        }
        if (roi.height <= 0 || roi.height > 1) {
            throw new Error(`Invalid ROI height: ${roi.height} (must be 0-1)`);
        }
        if (roi.x + roi.width > 1.001) {
            throw new Error(`ROI extends beyond image: x(${roi.x}) + width(${roi.width}) > 1`);
        }
        if (roi.y + roi.height > 1.001) {
            throw new Error(`ROI extends beyond image: y(${roi.y}) + height(${roi.height}) > 1`);
        }
    }
    async preprocess(imageBuffer, roi, maxWidth, options = {}) {
        try {
            this.validateROI(roi);
            const image = sharp(imageBuffer);
            const metadata = await image.metadata();
            const originalWidth = metadata.width || 0;
            const originalHeight = metadata.height || 0;
            if (originalWidth === 0 || originalHeight === 0) {
                throw new Error('Invalid image dimensions: width or height is 0');
            }
            if (originalWidth < this.MIN_DIMENSION || originalHeight < this.MIN_DIMENSION) {
                throw new Error(`Image too small: ${originalWidth}x${originalHeight} (min: ${this.MIN_DIMENSION}x${this.MIN_DIMENSION})`);
            }
            const cropX = Math.floor(roi.x * originalWidth);
            const cropY = Math.floor(roi.y * originalHeight);
            const cropWidth = Math.floor(roi.width * originalWidth);
            const cropHeight = Math.floor(roi.height * originalHeight);
            const finalCropX = Math.max(0, Math.min(cropX, originalWidth - 1));
            const finalCropY = Math.max(0, Math.min(cropY, originalHeight - 1));
            const finalCropWidth = Math.max(this.MIN_DIMENSION, Math.min(cropWidth, originalWidth - finalCropX));
            const finalCropHeight = Math.max(this.MIN_DIMENSION, Math.min(cropHeight, originalHeight - finalCropY));
            let processedImage = image.clone().extract({
                left: finalCropX,
                top: finalCropY,
                width: finalCropWidth,
                height: finalCropHeight,
            });
            let processedWidth = finalCropWidth;
            let processedHeight = finalCropHeight;
            let scaleFactor = 1;
            if (maxWidth && finalCropWidth > maxWidth) {
                scaleFactor = maxWidth / finalCropWidth;
                processedWidth = maxWidth;
                processedHeight = Math.max(this.MIN_DIMENSION, Math.floor(finalCropHeight * scaleFactor));
                processedImage = processedImage.resize(processedWidth, processedHeight, {
                    kernel: sharp.kernel.lanczos3,
                    withoutEnlargement: true,
                });
            }
            if (options.grayscale) {
                processedImage = processedImage.grayscale();
            }
            if (options.enhanceContrast) {
                processedImage = processedImage.normalize();
            }
            const processedBuffer = await processedImage.png().toBuffer();
            return {
                buffer: processedBuffer,
                metadata: {
                    originalWidth,
                    originalHeight,
                    processedWidth,
                    processedHeight,
                    scaleFactor,
                },
            };
        }
        catch (error) {
            this.logger.error(`Image preprocessing error: ${error.message}`, error.stack);
            throw error;
        }
    }
};
exports.ImagePreprocessingService = ImagePreprocessingService;
exports.ImagePreprocessingService = ImagePreprocessingService = __decorate([
    (0, common_1.Injectable)()
], ImagePreprocessingService);
//# sourceMappingURL=image-preprocessing.service.js.map