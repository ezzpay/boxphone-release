import { HttpService } from '@nestjs/axios';
import { BillAnalyzedStatus } from '@/modules/bank/interfaces/bank-service.interface';
import { IUpdateWithdrawal } from './interface/update-withdrawal';
export declare class EzpayBeClientService {
    private readonly httpService;
    private readonly logger;
    private readonly apiUrl;
    private readonly apiKey;
    constructor(httpService: HttpService);
    completeWithdrawal(withdrawalId: string, payload: {
        analyzedStatus: BillAnalyzedStatus;
        sourceBankCode: string;
        sourceAccountNo: string;
        sourceAccountName: string;
    }): Promise<boolean>;
    uploadReceipt(withdrawalId: string, receiptPath: string): Promise<void>;
    updateWithdrawal(id: string, data: IUpdateWithdrawal): Promise<import("axios").AxiosResponse<any, IUpdateWithdrawal, {}>>;
}
