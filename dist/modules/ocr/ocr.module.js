"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OCRModule = void 0;
const common_1 = require("@nestjs/common");
const ocr_worker_pool_service_1 = require("./services/ocr-worker-pool.service");
const image_preprocessing_service_1 = require("./services/image-preprocessing.service");
const ocr_service_1 = require("./services/ocr.service");
let OCRModule = class OCRModule {
};
exports.OCRModule = OCRModule;
exports.OCRModule = OCRModule = __decorate([
    (0, common_1.Module)({
        providers: [
            ocr_worker_pool_service_1.OCRWorkerPoolService,
            image_preprocessing_service_1.ImagePreprocessingService,
            ocr_service_1.OCRService,
        ],
        exports: [
            ocr_service_1.OCRService,
            ocr_worker_pool_service_1.OCRWorkerPoolService,
            image_preprocessing_service_1.ImagePreprocessingService,
        ],
    })
], OCRModule);
//# sourceMappingURL=ocr.module.js.map