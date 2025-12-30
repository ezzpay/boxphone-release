import { HttpService } from '@nestjs/axios';
export declare class EzpayBeClientService {
    private readonly httpService;
    private readonly logger;
    private readonly apiUrl;
    private readonly apiKey;
    constructor(httpService: HttpService);
    updateWithdrawalStatus(withdrawalId: string, payload: {
        analyzedStatus: 'success' | 'failed';
        sourceAccountNo: string;
        sourceBankCode: string;
        receipt: string;
    }, retryCount?: number): Promise<boolean>;
}
