export declare enum ErrorType {
    TEMPORARY = "TEMPORARY",
    PERMANENT = "PERMANENT",
    UNKNOWN = "UNKNOWN"
}
export declare class WithdrawalProcessingError extends Error {
    readonly errorType: ErrorType;
    readonly withdrawalId: string;
    constructor(message: string, errorType: ErrorType, withdrawalId: string);
}
export declare function classifyError(reason: string, error?: Error): ErrorType;
