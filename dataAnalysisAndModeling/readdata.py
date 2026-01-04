import asyncio
import struct
from bleak import BleakClient
from pyquaternion import Quaternion

ORIENTATION_UUID = "FF64"
DEVICE_NAME = "13E0BD51-AD23-1974-63B3-A9241717B240"

# pant: 6BED8222-E5E9-9F63-6890-9C57DDB007FD

def parse_quaternions_int16(data):
    """Parse raw int16 quaternion data into Quaternion objects."""
    quaternions = []
    n_sensors = len(data) // (2 * 4)  # 2 bytes per value, 4 values per sensor
    for i in range(n_sensors):
        q = []
        for j in range(4):
            idx = i * 8 + j * 2
            subdata = data[idx:idx + 2]
            value = struct.unpack('<h', subdata)[0] / 32768.0  # Normalize
            q.append(value)
        quaternions.append(Quaternion(q))
    return quaternions

async def read_quaternions_live():
    async with BleakClient(DEVICE_NAME) as client:
        print(f"Connected to {DEVICE_NAME}. Reading quaternions live...")
        
        while True:
            data = await client.read_gatt_char(ORIENTATION_UUID)
            quats = parse_quaternions_int16(data)
            print("=== New Reading ===")
            for idx, quat in enumerate(quats):
                print(f"Sensor {idx + 1}: {quat}")
            await asyncio.sleep(0.1)  # 10Hz okuma hızı gibi

if __name__ == "__main__":
    asyncio.run(read_quaternions_live())
