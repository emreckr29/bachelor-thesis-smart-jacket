import asyncio
import pickle
import struct
import os
from bleak import BleakClient
from pyquaternion import Quaternion
from datetime import datetime
import time

# -----------------------------------------------------------------------------
# --- SETTINGS ---
# -----------------------------------------------------------------------------
USER_ID = "User-F"
MOVEMENT_TYPE = "SitAndReach"
RECORDING_LABEL = "fake"
NUMBER_OF_RECORDINGS = 5

BASE_SAVE_FOLDER = "/Users/mac/Desktop/codetry/Together"
RECORD_DURATION = 6  # seconds

# Jacket device
JACKET_DEVICE_NAME = "BE5663ED-E011-B0C5-C8F7-2829764800F7"
# Pants device
PANTS_DEVICE_NAME = "6BED8222-E5E9-9F63-6890-9C57DDB007FD"

ORIENTATION_UUID = "FF64"

# -----------------------------------------------------------------------------
# --- HELPERS ---

# -----------------------------------------------------------------------------

def parse_quaternions_int16(data):
    quaternions = []
    n_sensors = len(data) // 8
    for i in range(n_sensors):
        q_list = [struct.unpack('<h', data[i*8+j*2:i*8+j*2+2])[0] / 32768.0 for j in range(4)]
        quaternions.append(Quaternion(w=q_list[0], x=q_list[1], y=q_list[2], z=q_list[3]))
    return quaternions


async def record_from_two_devices(jacket_client, pants_client, duration):
    jacket_data, pants_data = [], []

    def jacket_handler(sender, data): jacket_data.append(parse_quaternions_int16(data))
    def pants_handler(sender, data): pants_data.append(parse_quaternions_int16(data))

    await jacket_client.start_notify(ORIENTATION_UUID, jacket_handler)
    await pants_client.start_notify(ORIENTATION_UUID, pants_handler)

    print(f"🎬 Recording {duration} seconds from BOTH devices...")
    await asyncio.sleep(duration)

    await jacket_client.stop_notify(ORIENTATION_UUID)
    await pants_client.stop_notify(ORIENTATION_UUID)

    return jacket_data, pants_data


# -----------------------------------------------------------------------------
# --- MAIN ---
# -----------------------------------------------------------------------------

async def main():
    print("--- Dual Device BLE Recorder (Jacket + Pants) ---")

    session_path = os.path.join(BASE_SAVE_FOLDER, MOVEMENT_TYPE, USER_ID, RECORDING_LABEL)
    os.makedirs(session_path, exist_ok=True)
    print(f"Saving data to: {session_path}\n")

    try:
        async with BleakClient(JACKET_DEVICE_NAME) as jacket_client, BleakClient(PANTS_DEVICE_NAME) as pants_client:
            print(f"✅ Connected to Jacket: {JACKET_DEVICE_NAME}")
            print(f"✅ Connected to Pants:  {PANTS_DEVICE_NAME}\n")

            for i in range(NUMBER_OF_RECORDINGS):
                input(f"Press Enter to start recording #{i+1}/{NUMBER_OF_RECORDINGS} ...")

                jacket_frames, pants_frames = await record_from_two_devices(
                    jacket_client, pants_client, RECORD_DURATION
                )

                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = os.path.join(session_path, f"dual_movement_{timestamp}.pkl")

                payload = {
                    "data": {
                        "jacket": [[val for q in quats for val in (q.x, q.y, q.z, q.w)] for quats in jacket_frames],
                        "pants":  [[val for q in quats for val in (q.x, q.y, q.z, q.w)] for quats in pants_frames]
                    },
                    "label": f"{MOVEMENT_TYPE}_{RECORDING_LABEL}"
                }

                with open(filename, "wb") as f:
                    pickle.dump(payload, f)

                print(f"✅ Saved combined recording: {filename}\n")
                await asyncio.sleep(1)

            print("--- All dual recordings completed! ---")

    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    asyncio.run(main())
