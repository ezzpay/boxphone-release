export interface ROI {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface PreprocessResult {
    buffer: Buffer;
    metadata: {
        originalWidth: number;
        originalHeight: number;
        processedWidth: number;
        processedHeight: number;
        scaleFactor: number;
    };
}
export interface PreprocessOptions {
    grayscale?: boolean;
    enhanceContrast?: boolean;
}
export declare class ImagePreprocessingService {
    private readonly logger;
    private readonly MIN_DIMENSION;
    private validateROI;
    preprocess(imageBuffer: Buffer, roi: ROI, maxWidth?: number, options?: PreprocessOptions): Promise<PreprocessResult>;
}
