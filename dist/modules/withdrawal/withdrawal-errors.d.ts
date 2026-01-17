export declare enum ErrorType {
    TEMPORARY = "TEMPORARY",
    PERMANENT = "PERMANENT",
    FORCE_LOGIN_AND_REQUEUE = "FORCE_LOGIN_AND_REQUEUE",
    FORCE_LOGIN_NO_REQUEUE = "FORCE_LOGIN_NO_REQUEUE",
    NO_BILL_AFTER_OTP = "NO_BILL_AFTER_OTP"
}
export declare class WithdrawalProcessingError extends Error {
    readonly errorType: ErrorType;
    readonly context: string;
    constructor(message: string, errorType: ErrorType, context?: string);
}
