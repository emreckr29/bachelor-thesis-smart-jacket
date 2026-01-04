import asyncio
import pickle
import struct
import os
from bleak import BleakClient
from pyquaternion import Quaternion
from datetime import datetime
import time

# -----------------------------------------------------------------------------
# --- SETTINGS: EDIT THIS SECTION BEFORE STARTING DATA COLLECTION ---
# -----------------------------------------------------------------------------

# 1. User and Movement Info
USER_ID = "User-E"
MOVEMENT_TYPE = "SitAndReach"

# 2. Recording Type and Count
# VERY IMPORTANT: Set the label for ALL recordings in this session.
# Examples: "Correct", "Wrong-Hunch", "Wrong-Fast", "Wrong-LowAngle"

RECORDING_LABEL = "SupportHand" 

# Total number of movements to record for this label in this session
NUMBER_OF_RECORDINGS = 15



# 3. Technical Settings
BASE_SAVE_FOLDER = "/Users/mac/Desktop/codetry/ThesisDataSetJacket2"
RECORD_DURATION = 4
DEVICE_NAME = "13E0BD51-AD23-1974-63B3-A9241717B240"
#BE5663ED-E011-B0C5-C8F7-2829764800F7 (1. JAcket)
#13E0BD51-AD23-1974-63B3-A9241717B240 (2. JAcket)

ORIENTATION_UUID = "FF64"

# -----------------------------------------------------------------------------
# --- CODE SECTION (Usually no need to modify) ---
# -----------------------------------------------------------------------------

def parse_quaternions_int16(data):
    quaternions = []
    n_sensors = len(data) // 8
    for i in range(n_sensors):
        q_list = [struct.unpack('<h', data[i*8+j*2:i*8+j*2+2])[0] / 32768.0 for j in range(4)]
        quaternions.append(Quaternion(w=q_list[0], x=q_list[1], y=q_list[2], z=q_list[3]))
    return quaternions

async def main():
    print("--- Advanced Batch Data Recording Script ---")
    
    # Determine folder structure and labels based on settings
    session_path = os.path.join(BASE_SAVE_FOLDER, MOVEMENT_TYPE, USER_ID)
    save_path = os.path.join(session_path, RECORDING_LABEL) # Create folder for label
    final_label_in_file = f"{MOVEMENT_TYPE}_{RECORDING_LABEL}"
    
    os.makedirs(save_path, exist_ok=True)
    print(f"User: {USER_ID}, Movement: {MOVEMENT_TYPE}")
    print(f"All recordings in this session will be labeled as '{RECORDING_LABEL}'.")
    print(f"Recordings will be saved to: {save_path}")
    print("-" * 30)

    try:
        async with BleakClient(DEVICE_NAME) as client:
            print(f"🔌 Connected to device: {DEVICE_NAME}.")
            
            npose_search_path = os.path.join(BASE_SAVE_FOLDER, MOVEMENT_TYPE, USER_ID)
            if not any(fname.startswith('npose_') for fname in os.listdir(npose_search_path)):
                input("An N-Pose reference is required for this session. Please assume N-Pose and press Enter to start recording...")
                
                received_data = []
                def npose_handler(sender, data): received_data.append(parse_quaternions_int16(data))
                await client.start_notify(ORIENTATION_UUID, npose_handler)
                print("🎬 Recording 2-second N-Pose...")
                await asyncio.sleep(2)
                await client.stop_notify(ORIENTATION_UUID)

                if received_data:
                    npose_filename = os.path.join(npose_search_path, f"npose_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pkl")
                    all_frames = [[val for q in quats for val in (q.x, q.y, q.z, q.w)] for quats in received_data]
                    with open(npose_filename, "wb") as f:
                        pickle.dump({'data': all_frames, 'label': 'npose'}, f)
                    print(f"✅ N-Pose reference for this session saved: {npose_filename}\n")
                else:
                    print("ERROR: No N-Pose data received. Script is stopping.")
                    return
            else:
                print("✅ N-Pose reference already exists for this session. Proceeding to movement recordings.\n")

            for i in range(NUMBER_OF_RECORDINGS):
                print(f"--- Recording #{i+1}/{NUMBER_OF_RECORDINGS} ({RECORDING_LABEL}) ---")
                input("Press Enter when ready...")

                received_data = []
                def movement_handler(sender, data): received_data.append(parse_quaternions_int16(data))
                await client.start_notify(ORIENTATION_UUID, movement_handler)
                print(f"🎬 Recording {RECORD_DURATION} seconds...")
                await asyncio.sleep(RECORD_DURATION)
                await client.stop_notify(ORIENTATION_UUID)

                if received_data:
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    filename = os.path.join(save_path, f"movement_{timestamp}.pkl")
                    
                    all_frames = [[val for q in quats for val in (q.x, q.y, q.z, q.w)] for quats in received_data]
                    with open(filename, "wb") as f:
                        pickle.dump({'data': all_frames, 'label': final_label_in_file}, f)
                    
                    print(f"✅ Recording saved: {filename}\n")
                else:
                    print("ERROR: No data received. Skipping this attempt.\n")
                
                time.sleep(1)
            
            print("--- All recordings for this label completed! ---")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    asyncio.run(main())
