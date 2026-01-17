import { ErrorType } from "@/modules/withdrawal/withdrawal-errors";
export declare class Withdrawal {
    _id: string;
    withdrawalId: string;
    withdrawalCode: string;
    bankCode: string;
    beneficiaryAccountNo: string;
    beneficiaryName: string;
    amount: number;
    transferCode: string;
    status: string;
    description: string;
    createdAt: string;
    manualRetryCount?: number;
    lastErrorType?: ErrorType;
    lastErrorReason?: string;
}
export interface WithdrawalRequestJob {
    withdrawal: Withdrawal;
    retryCount?: number;
}
