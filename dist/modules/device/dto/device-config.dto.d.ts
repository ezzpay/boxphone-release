export declare class UpdateDeviceConfigDto {
    bankCode?: string;
    availableAmount?: number;
    status?: 'active' | 'deactive';
    password?: string;
    smartOTP?: string;
    accountNo?: string;
    accountName?: string;
}
export interface DeviceConfig {
    deviceId: string;
    bankCode?: string;
    availableAmount: number;
    status: 'active' | 'deactive';
    password: string;
    smartOTP: string;
    accountNo: string;
    accountName: string;
}
