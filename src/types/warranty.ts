export interface Customer {
  id: string;
  name: string;
  phone: string;
  deviceModel: string;
  imei: string;
  warrantyStart: string;
  warrantyEnd: string;
  notes?: string;
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  browser: string;
  os: string;
  screenSize: string;
}
