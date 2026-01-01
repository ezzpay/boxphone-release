import { EzpayBeClientService } from '../../common/services/ezpay-be-client.service';
import { BankService } from '../bank/bank.service';
import { DeviceService } from '../device/device.service';
import { DeviceLockService } from '../device/device-lock.service';
import { RedisService } from '../../common/services/redis.service';
import { Withdrawal } from '../../common/interfaces/withdrawal.interface';
import { IWebSocketService } from '@/common/modules/websocket/interface/websocket.interface';
import { IAnalyzeTransferBillResult } from '../bank/interfaces/bank-service.interface';
import { DeviceConfig } from '../device/dto/device-config.dto';
export declare class WithdrawalService {
    private readonly ezpayBeClient;
    protected readonly wsService: IWebSocketService;
    private readonly bankService;
    private readonly deviceService;
    private readonly deviceLock;
    private readonly redisService;
    private readonly logger;
    private readonly REDIS_PROCESSED_PREFIX;
    private readonly PROCESSING_TTL;
    private readonly COMPLETED_TTL;
    constructor(ezpayBeClient: EzpayBeClientService, wsService: IWebSocketService, bankService: BankService, deviceService: DeviceService, deviceLock: DeviceLockService, redisService: RedisService);
    private checkIfProcessed;
    private markAsProcessing;
    private markAsCompleted;
    private markAsFailed;
    processWithdrawal(withdrawal: Withdrawal, assignedDeviceId: string): Promise<void>;
    notifyEzpayBe(withdrawal: Withdrawal, analysisResult: IAnalyzeTransferBillResult, deviceConfig: DeviceConfig): Promise<void>;
}
