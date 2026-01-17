import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
export declare class OCRWorkerPoolService implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    private readonly pool;
    private readonly waitingQueue;
    private readonly poolSize;
    private readonly lang;
    private readonly maxWaitTime;
    private readonly maxPoolSize;
    private isInitializing;
    private isDestroyed;
    private isAcquiring;
    private initializationPromise;
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private warmPool;
    private doWarmPool;
    private createWorker;
    private acquireWorker;
    private tryAcquireFromPool;
    private waitForWorker;
    private createTemporaryWorker;
    private releaseWorker;
    private rejectAllPending;
    recognize(imageBuffer: Buffer, options?: {
        psm?: number;
        charWhitelist?: string;
    }): Promise<{
        text: string;
        confidence: number;
    }>;
    getPoolStats(): {
        total: number;
        inUse: number;
        waiting: number;
    };
    private terminateAll;
}
