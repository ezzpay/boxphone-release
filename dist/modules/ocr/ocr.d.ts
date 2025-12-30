import { IAnalyzeTransferBillResult } from "../bank/interfaces/bank-service.interface";
export declare const ocrBill: (base64Image: string) => Promise<{
    parsedText: string;
    processingTimeInMilliseconds: number;
}>;
export declare const analyzeBill: (value: string) => Omit<IAnalyzeTransferBillResult, "raw">;
