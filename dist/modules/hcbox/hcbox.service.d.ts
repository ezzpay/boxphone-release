import { Withdrawal } from '../../common/interfaces/withdrawal.interface';
import { ICaptureScreenOptions, IHCSwipeOptions, IPandaSwipeOptions, IWebSocketService } from '@/common/modules/websocket/interface/websocket.interface';
export declare class HcBoxService {
    private readonly wsService;
    private readonly logger;
    constructor(wsService: IWebSocketService);
    listDevices(): Promise<any[]>;
    executeTransfer(withdrawal: Withdrawal, deviceId: string): Promise<boolean>;
    private getBankBundleId;
    click(deviceId: string, x: number, y: number, duration?: number): Promise<string>;
    swipe(deviceId: string, options: IHCSwipeOptions | IPandaSwipeOptions): Promise<string>;
    screen(deviceId: string, options: ICaptureScreenOptions): Promise<string>;
    home(deviceId: string): Promise<string>;
    inputNumpadNumber(deviceId: string, value: string): Promise<void>;
    inputText(deviceId: string, text: string): Promise<void>;
}
