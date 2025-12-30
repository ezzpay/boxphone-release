import { WithdrawalJobManagerService } from './withdrawal-job-manager.service';
export declare class WithdrawalController {
    private readonly jobManagerService;
    private readonly logger;
    constructor(jobManagerService: WithdrawalJobManagerService);
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
            data: import("../../common").Withdrawal;
            opts: import("bull").JobOptions;
            manualRetryCount: any;
        }[];
        sampleDelayedJobs: {
            id: import("bull").JobId;
            data: import("../../common").Withdrawal;
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
    triggerJobPicking(): Promise<{
        success: boolean;
        message: string;
        stats: {
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
        };
    }>;
    startProcessing(): Promise<{
        success: boolean;
        message: string;
        stats: {
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
        };
    }>;
}
