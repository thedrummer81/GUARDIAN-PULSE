export type SensorData = {
  accelerometer: { x: number; y: number; z: number } | null;
  light: number | null;
  proximity: boolean | null;
  charging: boolean | null;
  batteryLevel: number | null;
  screenOn: boolean;
  lastInteraction: number;
};

export type ActivityPattern = {
  id: string;
  name: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  type: 'movement' | 'stationary' | 'sleep';
  status: 'learned' | 'learning';
};

export type NOKContact = {
  name: string;
  phone: string;
  relation: string;
};

export type AppState = 'monitoring' | 'alert_phase_1' | 'alert_phase_2' | 'alert_phase_3' | 'nok_alerted';
