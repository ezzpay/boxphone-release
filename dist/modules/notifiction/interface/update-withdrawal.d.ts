import { WithdrawalStatus } from "@/modules/withdrawal/constants/withdrawal-status";
export interface IUpdateWithdrawal {
    status?: WithdrawalStatus;
    sourceBankCode?: string;
    sourceAccountNo?: string;
    sourceAccountName?: string;
}
