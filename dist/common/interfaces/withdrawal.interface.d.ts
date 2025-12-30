export interface Withdrawal {
    _id: string;
    withdrawalId: string;
    withdrawalCode: string;
    bankCode: string;
    beneficiaryAccountNo: string;
    beneficiaryName: string;
    amount: number;
    status: string;
    description?: string;
    createdAt: string;
}
export interface WithdrawalRequestJob {
    withdrawal: Withdrawal;
    retryCount?: number;
}
