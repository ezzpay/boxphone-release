interface IConfig {
    boxType: 'HC' | 'PANDA';
    redis: {
        host: string;
        port: number;
        db: number;
        password: string;
    };
    ezpayBe: {
        apiUrl: string;
        apiKey: string;
    };
    spaceocr: {
        datacenterPrimary: string;
        datacenterSecond: string;
        key: string;
        keyFree: string;
    };
}
export declare const config: IConfig;
export {};
