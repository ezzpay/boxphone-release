import { Withdrawal } from '../../common/interfaces/withdrawal.interface';
import { EzpayBeClientService } from './ezpay-be-client.service';
import { IAnalyzeTransferBillResult } from '../bank/interfaces/bank-service.interface';
import { DeviceConfig } from '../device/dto/device-config.dto';
import { IUpdateWithdrawal } from './interface/update-withdrawal';
export declare class NotificationService {
    private readonly ezpayBeClient;
    private readonly logger;
    constructor(ezpayBeClient: EzpayBeClientService);
    completeWithdrawal(withdrawal: Withdrawal, analysisResult: IAnalyzeTransferBillResult, deviceConfig: DeviceConfig): Promise<void>;
    updateWithdrawal(id: string, data: IUpdateWithdrawal): Promise<import("axios").AxiosResponse<any, IUpdateWithdrawal, {}>>;
    uploadReceipt(id: string, receiptPath: string): Promise<void>;
}
