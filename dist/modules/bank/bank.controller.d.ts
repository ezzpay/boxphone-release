import { BankService } from './bank.service';
import { HcBoxService } from '../hcbox/hcbox.service';
import { IWebSocketService } from '@/common/modules/websocket/interface/websocket.interface';
export declare class BankController {
    private readonly bankService;
    private readonly hcBoxService;
    protected readonly wsService: IWebSocketService;
    private readonly logger;
    constructor(bankService: BankService, hcBoxService: HcBoxService, wsService: IWebSocketService);
    private getBankService;
    getDevices(bankCode: string): Promise<{
        success: boolean;
        data: any[];
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    testLaunchApp(bankCode: string, deviceId: string): Promise<{
        success: boolean;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
    }>;
    testCaptureScreen(bankCode: string, deviceId: string, name?: string, quality?: string): Promise<{
        success: boolean;
        message: string;
        data: {
            base64Image: any;
            imageLength: any;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
        data?: undefined;
    }>;
    testClickAtCoordinates(bankCode: string, deviceId: string, x: string, y: string): Promise<{
        success: boolean;
        error: string;
        example: string;
        message?: undefined;
        coordinates?: undefined;
    } | {
        success: boolean;
        message: string;
        coordinates: {
            x: number;
            y: number;
        };
        error?: undefined;
        example?: undefined;
    } | {
        success: boolean;
        error: any;
        example?: undefined;
        message?: undefined;
        coordinates?: undefined;
    }>;
    testSwipe(bankCode: string, deviceId: string, x?: string, y?: string, type?: string, endX?: string, endY?: string, duration?: string): Promise<{
        success: boolean;
        error: string;
        example: string;
        message?: undefined;
        coordinates?: undefined;
    } | {
        success: boolean;
        message: string;
        coordinates: {
            x?: string;
            y?: string;
            type: string;
            start?: undefined;
            end?: undefined;
            duration?: undefined;
        };
        error?: undefined;
        example?: undefined;
    } | {
        success: boolean;
        message: string;
        coordinates: {
            start: {
                x: number;
                y: number;
            };
            end: {
                x: number;
                y: number;
            };
            duration: number;
        };
        error?: undefined;
        example?: undefined;
    } | {
        success: boolean;
        error: any;
        example?: undefined;
        message?: undefined;
        coordinates?: undefined;
    }>;
    testInputNumpadNumber(bankCode: string, deviceId: string, number: string): Promise<{
        success: boolean;
        error: string;
        example: string;
        message?: undefined;
        data?: undefined;
    } | {
        success: boolean;
        message: string;
        data: {
            number: string;
            digits: number[];
        };
        error?: undefined;
        example?: undefined;
    } | {
        success: boolean;
        error: any;
        example?: undefined;
        message?: undefined;
        data?: undefined;
    }>;
    testInputText(bankCode: string, deviceId: string, text: string): Promise<{
        success: boolean;
        error: string;
        example: string;
        message?: undefined;
    } | {
        success: boolean;
        message: string;
        error?: undefined;
        example?: undefined;
    } | {
        success: boolean;
        error: any;
        example?: undefined;
        message?: undefined;
    }>;
    testPressReturn(bankCode: string, deviceId: string): Promise<{
        success: boolean;
        message: string;
        note: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
        note?: undefined;
    }>;
}
