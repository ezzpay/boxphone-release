import { IAnalyzeTransferBillResult } from "../bank/interfaces/bank-service.interface";
export declare const ocrBillFree: (base64Image: string) => Promise<{
    parsedText: string;
    processingTimeInMilliseconds: number;
}>;
export declare const ocrBillPro: (imageSource: string) => Promise<{
    parsedText: string;
    processingTimeInMilliseconds: number;
}>;
export declare const analyzeBill: (value: string) => Omit<IAnalyzeTransferBillResult, "rawPath">;
