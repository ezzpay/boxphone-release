export declare const withCronLock: (key: string, ttlMs: number, fn: () => Promise<void>) => Promise<void>;
