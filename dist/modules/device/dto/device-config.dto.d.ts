export declare class UpdateDeviceConfigDto {
    bankCode?: string;
    availableAmount?: number;
    status?: 'active' | 'deactive';
    password?: string;
    smartOTP?: string;
}
export interface DeviceConfig {
    deviceId: string;
    bankCode?: string;
    availableAmount: number;
    status: 'active' | 'deactive';
    password?: string;
    smartOTP?: string;
}
