import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ICaptureScreenOptions, IHCSwipeOptions, IWebSocketService } from './interface/websocket.interface';
export interface HcBoxRequest {
    action: string;
    comm?: any;
    sessionID?: string;
}
export interface HcBoxResponse {
    StatusCode: number;
    result: any;
}
export declare class HCWebSocketService implements IWebSocketService, OnModuleInit, OnModuleDestroy {
    private readonly logger;
    private ws;
    private wsUrl;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectDelay;
    private requestQueue;
    private pendingRequests;
    private isConnected;
    private isProcessingRequest;
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private connect;
    private scheduleReconnect;
    private disconnect;
    private handleMessage;
    private processRequestQueue;
    private _sendRequestOnce;
    private sendRequest;
    listDevices(): Promise<any[]>;
    click(deviceIds: string | string[], x: number, y: number, duration?: number): Promise<string>;
    swipe(deviceIds: string | string[], options: IHCSwipeOptions): Promise<string>;
    captureScreen(deviceId: string, options: ICaptureScreenOptions): Promise<any>;
    home(deviceIds: string | string[]): Promise<string>;
    launchApp(deviceIds: string | string[], bundleId: string): Promise<string>;
    killApp(deviceIds: string | string[], bundleId: string): Promise<string>;
    private isNumber;
    private isLetter;
    private isSpecialCharInNumberMode;
    switchKeyboardMode(deviceIds: string | string[]): Promise<void>;
    pressShiftKey(deviceIds: string | string[]): Promise<void>;
    pressReturnKey(deviceId: string): Promise<void>;
    inputText(deviceIds: string | string[], text: string): Promise<void>;
    inputNumpadNumber(deviceIds: string | string[], value: string): Promise<void>;
}
