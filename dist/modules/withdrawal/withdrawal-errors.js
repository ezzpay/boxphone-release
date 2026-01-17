"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithdrawalProcessingError = exports.ErrorType = void 0;
var ErrorType;
(function (ErrorType) {
    ErrorType["TEMPORARY"] = "TEMPORARY";
    ErrorType["PERMANENT"] = "PERMANENT";
    ErrorType["FORCE_LOGIN_AND_REQUEUE"] = "FORCE_LOGIN_AND_REQUEUE";
    ErrorType["FORCE_LOGIN_NO_REQUEUE"] = "FORCE_LOGIN_NO_REQUEUE";
    ErrorType["NO_BILL_AFTER_OTP"] = "NO_BILL_AFTER_OTP";
})(ErrorType || (exports.ErrorType = ErrorType = {}));
class WithdrawalProcessingError extends Error {
    constructor(message, errorType, context = '') {
        super(message);
        this.errorType = errorType;
        this.context = context;
        this.name = 'WithdrawalProcessingError';
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.WithdrawalProcessingError = WithdrawalProcessingError;
//# sourceMappingURL=withdrawal-errors.js.map