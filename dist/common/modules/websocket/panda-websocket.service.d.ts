import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ICaptureScreenOptions, IPandaSwipeOptions, IWebSocketService } from './interface/websocket.interface';
import { TelegramService } from '@/modules/notifiction/telegram.service';
export interface PandaRequest<T> {
    action: string;
    devices?: string | string[];
    data?: T;
}
export interface PandaResponse<T> {
    code: number;
    message: string;
    data: T;
}
export declare class PandaWebSocketService implements IWebSocketService, OnModuleInit, OnModuleDestroy {
    private readonly telegramService;
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
    constructor(telegramService: TelegramService);
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
    swipe(deviceIds: string | string[], options: IPandaSwipeOptions): Promise<string>;
    captureScreen(deviceId: string, options: ICaptureScreenOptions): Promise<any>;
    home(deviceIds: string | string[]): Promise<string>;
    launchApp(deviceIds: string | string[], bundleId: string): Promise<string>;
    killApp(deviceIds: string | string[], bundleId: string): Promise<string>;
    switchKeyboardMode(deviceIds: string | string[]): Promise<void>;
    pressShiftKey(deviceIds: string | string[]): Promise<void>;
    pressReturnKey(deviceId: string): Promise<void>;
    inputText(deviceIds: string | string[], text: string): Promise<void>;
    inputNumpadNumber(deviceIds: string | string[], value: string): Promise<void>;
    transferFile(deviceIds: string | string[], filePath: string, fileType?: number): Promise<any>;
    isConnectedStatus(): boolean;
}
