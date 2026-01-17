import { OnModuleInit } from '@nestjs/common';
import { Queue } from 'bull';
import { WithdrawalService } from './withdrawal.service';
import { DeviceService } from '../device/device.service';
import { DeviceLockService } from '../device/device-lock.service';
import { IWebSocketService } from '@/common/modules/websocket/interface/websocket.interface';
import { Withdrawal } from '../../common/interfaces/withdrawal.interface';
import { BankService } from '../bank/bank.service';
import { NotificationService } from '../notifiction/notification.service';
import { WindowsAppGitBashService } from '../window-app/window-app.service';
import { RedisLockService } from '../redis-lock/redis-lock.service';
import { TelegramService } from '../notifiction/telegram.service';
import { RedisService } from '@/common/services/redis.service';
export declare class WithdrawalJobManagerService implements OnModuleInit {
    private readonly withdrawalQueue;
    private readonly withdrawalService;
    private readonly deviceService;
    private readonly deviceLockService;
    protected readonly wsService: IWebSocketService;
    private readonly bankService;
    private readonly notificationService;
    private readonly windowsAppGitBashService;
    private readonly redisLockService;
    private readonly telegramService;
    private readonly redisService;
    private readonly logger;
    private processingJobs;
    private isInitialized;
    private isRestartingBoxphone;
    private cronRestartBoxphoneEnabled;
    constructor(withdrawalQueue: Queue<Withdrawal>, withdrawalService: WithdrawalService, deviceService: DeviceService, deviceLockService: DeviceLockService, wsService: IWebSocketService, bankService: BankService, notificationService: NotificationService, windowsAppGitBashService: WindowsAppGitBashService, redisLockService: RedisLockService, telegramService: TelegramService, redisService: RedisService);
    onModuleInit(): Promise<void>;
    private initializeJobProcessing;
    private scheduleCronRestartBoxphone;
    private restartBoxphone;
    pickAndProcessJobs(count?: number): Promise<void>;
    private processJob;
    private handleJobFailure;
    private promoteDelayedJobs;
    triggerPickJobs(count?: number): Promise<void>;
    getQueueStats(): Promise<{
        serviceStatus: "active" | "inactive";
        activeDevices: number;
        processingJobs: number;
        isInitialized: boolean;
        queue: {
            waiting: number;
            delayed: number;
            active: number;
            completed: number;
            failed: number;
            total: number;
        };
    }>;
    debugQueue(): Promise<{
        sampleWaitingJobs: {
            id: import("bull").JobId;
            data: Withdrawal;
            opts: import("bull").JobOptions;
            manualRetryCount: any;
        }[];
        sampleDelayedJobs: {
            id: import("bull").JobId;
            data: Withdrawal;
            opts: import("bull").JobOptions;
            manualRetryCount: any;
        }[];
        serviceStatus: "active" | "inactive";
        activeDevices: number;
        processingJobs: number;
        isInitialized: boolean;
        queue: {
            waiting: number;
            delayed: number;
            active: number;
            completed: number;
            failed: number;
            total: number;
        };
    }>;
    periodicJobPicking(): Promise<void>;
    promoteDelayedJobsPeriodically(): Promise<void>;
    restartPandaBoxPeriodically(): Promise<void>;
}
