import { HttpService } from '@nestjs/axios';
import { BillAnalyzedStatus } from '@/modules/bank/interfaces/bank-service.interface';
export declare class EzpayBeClientService {
    private readonly httpService;
    private readonly logger;
    private readonly apiUrl;
    private readonly apiKey;
    constructor(httpService: HttpService);
    updateWithdrawalStatus(withdrawalId: string, payload: {
        analyzedStatus: BillAnalyzedStatus;
        sourceAccountNo: string;
        sourceBankCode: string;
        receipt: string;
    }, retryCount?: number): Promise<boolean>;
}
