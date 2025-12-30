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
    spaceOcrKey: string;
}
export declare const config: IConfig;
export {};
