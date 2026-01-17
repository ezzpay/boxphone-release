import { OCRWorkerPoolService } from './ocr-worker-pool.service';
import { ImagePreprocessingService, ROI, PreprocessOptions } from './image-preprocessing.service';
export { ROI, PreprocessOptions } from './image-preprocessing.service';
export interface OCRResult {
    text: string;
    confidence: number;
    processingTime: number;
    timingBreakdown: {
        decodeImage: number;
        preprocess: number;
        ocrRecognize: number;
        postprocess: number;
    };
}
export type FieldType = 'singleLine' | 'block' | 'full';
export declare class OCRService {
    private readonly workerPoolService;
    private readonly imagePreprocessingService;
    private readonly logger;
    private readonly ocrConfig;
    constructor(workerPoolService: OCRWorkerPoolService, imagePreprocessingService: ImagePreprocessingService);
    private validateROI;
    private getROIConfig;
    recognizeFromFile(imagePath: string, options?: {
        fieldType?: FieldType;
        customROI?: ROI;
        language?: string;
        preprocess?: PreprocessOptions;
    }): Promise<OCRResult | null>;
    recognizeFromBuffer(imageBuffer: Buffer, options?: {
        fieldType?: FieldType;
        customROI?: ROI;
        language?: string;
        preprocess?: PreprocessOptions;
    }): Promise<OCRResult | null>;
    fastScreenOCR(imagePath: string, searchTexts: string[], options?: {
        fieldType?: FieldType;
        customROI?: ROI;
        preprocess?: PreprocessOptions;
    }): Promise<{
        found: boolean;
        matchedTexts: string[];
        result: OCRResult | null;
    }>;
    private postprocessText;
    private logTimingBreakdown;
}
