import { OnModuleInit } from '@nestjs/common';
import { RedisService } from '../../common/services/redis.service';
import { DeviceConfig, UpdateDeviceConfigDto } from './dto/device-config.dto';
import { IWebSocketService } from '@/common/modules/websocket/interface/websocket.interface';
import { DeviceLockService } from './device-lock.service';
import { BankService } from '../bank/bank.service';
export declare class DeviceService implements OnModuleInit {
    private readonly redisService;
    protected readonly wsService: IWebSocketService;
    private readonly deviceLockService;
    private readonly bankService;
    private readonly logger;
    private readonly REDIS_DEVICE_CONFIG_PREFIX;
    private readonly REDIS_DEVICE_CONFIG_SUFFIX;
    private readonly REDIS_SERVICE_STATUS_KEY;
    constructor(redisService: RedisService, wsService: IWebSocketService, deviceLockService: DeviceLockService, bankService: BankService);
    onModuleInit(): Promise<void>;
    listDeviceConfigs(): Promise<DeviceConfig[]>;
    listDevices(): Promise<any[]>;
    getDeviceConfig(deviceId: string): Promise<DeviceConfig | null>;
    getDeviceConfigSafe(deviceId: string): Promise<DeviceConfig | null>;
    updateDeviceConfig(deviceId: string, dto: UpdateDeviceConfigDto): Promise<DeviceConfig>;
    deleteDeviceConfig(deviceId: string): Promise<void>;
    getServiceStatus(): Promise<'active' | 'inactive'>;
    setServiceStatus(status: 'active' | 'inactive'): Promise<void>;
    startService(): Promise<{
        success: boolean;
        message: string;
    }>;
    deductDeviceAmount(deviceId: string, amount: number): Promise<boolean>;
    hasActiveDevice(): Promise<boolean>;
    getAvailableDevices(): Promise<DeviceConfig[]>;
}
