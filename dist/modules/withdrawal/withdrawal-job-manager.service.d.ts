import { OnModuleInit } from '@nestjs/common';
import { Queue } from 'bull';
import { WithdrawalService } from './withdrawal.service';
import { DeviceService } from '../device/device.service';
import { DeviceLockService } from '../device/device-lock.service';
import { IWebSocketService } from '@/common/modules/websocket/interface/websocket.interface';
import { Withdrawal } from '../../common/interfaces/withdrawal.interface';
export declare class WithdrawalJobManagerService implements OnModuleInit {
    private readonly withdrawalQueue;
    private readonly withdrawalService;
    private readonly deviceService;
    private readonly deviceLock;
    protected readonly wsService: IWebSocketService;
    private readonly logger;
    private processingJobs;
    private isInitialized;
    constructor(withdrawalQueue: Queue<Withdrawal>, withdrawalService: WithdrawalService, deviceService: DeviceService, deviceLock: DeviceLockService, wsService: IWebSocketService);
    onModuleInit(): Promise<void>;
    private initializeJobProcessing;
    startProcessing(): Promise<void>;
    private getAvailableDevices;
    pickAndProcessJobs(count?: number): Promise<void>;
    private processJob;
    private handleJobFailure;
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
    promoteDelayedJobs(): Promise<void>;
}
