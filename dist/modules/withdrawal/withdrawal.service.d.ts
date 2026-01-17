import { BankService } from '../bank/bank.service';
import { DeviceService } from '../device/device.service';
import { RedisService } from '../../common/services/redis.service';
import { Withdrawal } from '../../common/interfaces/withdrawal.interface';
import { IWebSocketService } from '@/common/modules/websocket/interface/websocket.interface';
import { NotificationService } from '../notifiction/notification.service';
import { HttpService } from '@nestjs/axios';
import { WithdrawalStatus } from './constants/withdrawal-status';
import { DeviceConfig } from '../device/dto/device-config.dto';
export declare class WithdrawalService {
    protected readonly wsService: IWebSocketService;
    private readonly bankService;
    private readonly deviceService;
    private readonly redisService;
    private readonly notificationService;
    private readonly httpService;
    private readonly logger;
    private readonly REDIS_PROCESSED_PREFIX;
    private readonly PROCESSING_TTL;
    private readonly COMPLETED_TTL;
    constructor(wsService: IWebSocketService, bankService: BankService, deviceService: DeviceService, redisService: RedisService, notificationService: NotificationService, httpService: HttpService);
    private checkIfProcessed;
    private markAsProcessing;
    private markAsCompleted;
    private markAsFailed;
    processWithdrawal(withdrawal: Withdrawal, deviceConfig: DeviceConfig): Promise<void>;
    getWithdrawalDetails(id: string): Promise<{
        status: WithdrawalStatus;
        withdrawalId: string;
        withdrawalCode: string;
        cryptoExchangeId: string;
        bankCode: string;
        beneficiaryAccountNo: string;
        beneficiaryName: string;
        amount: string;
    }>;
}
