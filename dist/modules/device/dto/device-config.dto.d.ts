export declare class UpdateDeviceConfigDto {
    bankCode?: DeviceBankCode;
    availableAmount?: number;
    status?: 'active' | 'deactive';
    password?: string;
    smartOTP?: string;
    accountNo?: string;
    accountName?: string;
}
export declare enum DeviceBankCode {
    ACB = "ACB",
    PGBANK = "PGBANK",
    HDBANK = "HDBANK",
    VIETCOMBANK = "VIETCOMBANK"
}
export interface DeviceConfig {
    deviceId: string;
    bankCode: DeviceBankCode;
    availableAmount: number;
    status: 'active' | 'deactive';
    password: string;
    smartOTP: string;
    accountNo: string;
    accountName: string;
}
