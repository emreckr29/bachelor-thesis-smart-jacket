import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface SensorQuaternion {
  x: number; y: number; z: number; w: number;
}

const SERVICE_UUID = '0000ff00-0000-1000-8000-00805f9b34fb';
const CHARACTERISTIC_UUID = '0000ff64-0000-1000-8000-00805f9b34fb';

@Injectable({
  providedIn: 'root'
})
export class BluetoothService {
  readonly DEVICE_NAME = "Smart_Jacket_MF-06F6";

  private rawDataSubject = new Subject<SensorQuaternion[]>();
  private statusSubject = new Subject<string>();
  private errorSubject = new Subject<string | null>();
  private connectionSubject = new Subject<boolean>();

  private device: BluetoothDevice | null = null;

  constructor() {
    if (!('bluetooth' in navigator)) {
      this.errorSubject.next("This browser does not support the Web Bluetooth API.");
    }
  }

  // --- Public API ---
  getRawDataStream = () => this.rawDataSubject.asObservable();
  getStatusStream = () => this.statusSubject.asObservable();
  getErrorStream = () => this.errorSubject.asObservable();
  getConnectionStream = () => this.connectionSubject.asObservable();

  async connect() {
    this.errorSubject.next(null);
    this.statusSubject.next('Searching for device...');
    try {
      const nav: any = navigator;
      this.device = await nav.bluetooth.requestDevice({
        filters: [{ name: this.DEVICE_NAME }],
        optionalServices: [SERVICE_UUID]
      });

      if (!this.device) {
        this.statusSubject.next('No device selected.');
        return;
      }

      this.statusSubject.next(`Connecting to: ${this.device.name}`);
      const server = await this.device.gatt?.connect();
      if (!server) throw new Error('Could not connect to GATT server.');

      this.device.addEventListener('gattserverdisconnected', this.onDisconnected.bind(this));

      const service = await server.getPrimaryService(SERVICE_UUID);
      const characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);
      characteristic.addEventListener('characteristicvaluechanged', this.handleData.bind(this));
      await characteristic.startNotifications();

      this.statusSubject.next('Connected! Ready to record movements.');
      this.connectionSubject.next(true);

    } catch (error: any) {
      this.statusSubject.next('Connection Error');
      this.errorSubject.next(`Error: ${error.message || error}`);
    }
  }

  disconnect() {
    this.device?.gatt?.disconnect();
  }

  private handleData(event: Event) {
    const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
    if (value) {
      try {
        this.rawDataSubject.next(this.parseQuaternionsInt16(value));
      } catch (e) { this.errorSubject.next('Could not parse incoming data.'); }
    }
  }

  private parseQuaternionsInt16(data: DataView): SensorQuaternion[] {
    const quaternions: SensorQuaternion[] = [];
    const nSensors = 10;
    if (data.byteLength < nSensors * 8) return [];

    for (let i = 0; i < nSensors; i++) {
        const offset = i * 8;
        const w = data.getInt16(offset, true) / 32768.0;
        const x = data.getInt16(offset + 2, true) / 32768.0;
        const y = data.getInt16(offset + 4, true) / 32768.0;
        const z = data.getInt16(offset + 6, true) / 32768.0;
        quaternions.push({ x, y, z, w });
    }
    return quaternions;
  }

  private onDisconnected() {
    this.statusSubject.next('Connection lost.');
    this.connectionSubject.next(false);
    this.device = null;
  }
}

