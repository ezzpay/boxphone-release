export interface IHCSwipeOptions {
    x: number;
    y: number;
    endX: number;
    endY: number;
    duration: number;
}
export type PandaSwipeType = '0' | '1' | '2' | '4' | '5' | '6' | '7' | '8' | '9' | '10';
export interface IPandaSwipeOptions {
    type: PandaSwipeType;
    x?: string;
    y?: string;
}
export interface ICaptureScreenOptions {
    rect?: {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
    };
    quality?: number;
    scale?: number;
    folderPath: string;
}
export interface ITransferFileOptions {
    filePath: string;
    fileType: number;
}
export interface IWebSocketService {
    listDevices(): Promise<any[]>;
    click(deviceIds: string | string[], x: number, y: number, duration?: number): Promise<string>;
    swipe(deviceIds: string | string[], options: IHCSwipeOptions | IPandaSwipeOptions): Promise<string>;
    captureScreen(deviceId: string, options: ICaptureScreenOptions): Promise<any>;
    home(deviceIds: string | string[]): Promise<string>;
    launchApp(deviceIds: string | string[], bundleId: string): Promise<string>;
    killApp(deviceIds: string | string[], bundleId: string): Promise<string>;
    inputText(deviceIds: string | string[], text: string): Promise<void>;
    inputNumpadNumber(deviceIds: string | string[], number: string): Promise<void>;
    pressReturnKey(deviceIds: string | string[]): Promise<void>;
    switchKeyboardMode(deviceIds: string | string[]): Promise<void>;
    pressShiftKey(deviceIds: string | string[]): Promise<void>;
    transferFile(deviceIds: string | string[], filePath: string, fileType?: number): Promise<any>;
    isConnectedStatus(): boolean;
}
