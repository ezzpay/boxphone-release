import { DeviceService } from './device.service';
import { UpdateDeviceConfigDto } from './dto/device-config.dto';
import { BankService } from '../bank/bank.service';
export declare class DeviceController {
    private readonly deviceService;
    private readonly bankService;
    private readonly logger;
    constructor(deviceService: DeviceService, bankService: BankService);
    getDevicesPage(): Promise<{
        devices: any[];
        serviceStatus: "active" | "inactive";
        banks: string[];
        boxType: "HC" | "PANDA";
    }>;
    getDevices(): Promise<{
        success: boolean;
        data: any[];
    }>;
    getDeviceConfig(deviceId: string): Promise<{
        success: boolean;
        data: import("./dto/device-config.dto").DeviceConfig;
    }>;
    retryLogin(deviceId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    updateDeviceConfig(deviceId: string, dto: UpdateDeviceConfigDto): Promise<{
        success: boolean;
        data: import("./dto/device-config.dto").DeviceConfig;
    }>;
    getServiceStatus(): Promise<{
        success: boolean;
        data: {
            status: "active" | "inactive";
        };
    }>;
    startService(): Promise<{
        success: boolean;
        message: string;
    }>;
    stopService(): Promise<{
        success: boolean;
        message: string;
    }>;
}
