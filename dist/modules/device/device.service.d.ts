import { OnModuleInit } from '@nestjs/common';
import { RedisService } from '../../common/services/redis.service';
import { HcBoxService } from '../hcbox/hcbox.service';
import { DeviceConfig, UpdateDeviceConfigDto } from './dto/device-config.dto';
export declare class DeviceService implements OnModuleInit {
    private readonly redisService;
    private readonly hcBoxService;
    private readonly logger;
    private readonly REDIS_DEVICE_CONFIG_PREFIX;
    private readonly REDIS_DEVICE_CONFIG_SUFFIX;
    private readonly REDIS_SERVICE_STATUS_KEY;
    constructor(redisService: RedisService, hcBoxService: HcBoxService);
    onModuleInit(): Promise<void>;
    listDevices(): Promise<any[]>;
    getDeviceConfig(deviceId: string): Promise<DeviceConfig | null>;
    updateDeviceConfig(deviceId: string, dto: UpdateDeviceConfigDto): Promise<DeviceConfig>;
    getServiceStatus(): Promise<'active' | 'inactive'>;
    setServiceStatus(status: 'active' | 'inactive'): Promise<void>;
    deductDeviceAmount(deviceId: string, amount: number): Promise<boolean>;
    hasActiveDevice(): Promise<boolean>;
}
