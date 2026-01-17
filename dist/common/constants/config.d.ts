export type NodeEnv = 'development' | 'production';
export interface IConfig {
    NODE_ENV: NodeEnv;
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
    ocr: {
        poolSize: number;
        lang: string;
        rois: {
            [fieldType: string]: {
                crop: {
                    x: number;
                    y: number;
                    width: number;
                    height: number;
                };
                psm: number;
                charWhitelist?: string;
                maxWidth?: number;
            };
        };
    };
    spaceocr: {
        datacenterPrimary: string;
        datacenterSecond: string;
        key: string;
        keyFree: string;
    };
}
export declare const config: IConfig;
