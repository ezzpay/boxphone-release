export declare const localOCR: (imagePath: string, options?: {
    language?: string;
    fastMode?: boolean;
}) => Promise<{
    text: string;
    confidence: number;
    processingTime: number;
} | null>;
export declare const fastScreenOCR: (imagePath: string, searchTexts: string[]) => Promise<{
    found: boolean;
    matchedTexts: string[];
    processingTime: number;
}>;
