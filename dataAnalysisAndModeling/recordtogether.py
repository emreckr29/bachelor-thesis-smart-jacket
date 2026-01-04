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
USER_ID = "User-F"
MOVEMENT_TYPE = "SitAndReach"

# 2. Recording Type and Count
RECORDING_LABEL = "Trueee" 
NUMBER_OF_RECORDINGS = 15

# 3. Technical Settings
BASE_SAVE_FOLDER = "/Users/mac/Desktop/codetry/Together"
RECORD_DURATION = 6

# --- YENİ: Cihaz Adresleri ---
# Ceket ve pantolon için cihaz adreslerini buraya ekleyin.
DEVICE_JACKET_ADDRESS = "BE5663ED-E011-B0C5-C8F7-2829764800F7"
DEVICE_TROUSERS_ADDRESS = "6BED8222-E5E9-9F63-6890-9C57DDB007FD"
ORIENTATION_UUID = "FF64" # İki cihazın da aynı UUID'yi kullandığını varsayıyoruz.

# -----------------------------------------------------------------------------
# --- CODE SECTION (Usually no need to modify) ---
# -----------------------------------------------------------------------------

def parse_quaternions_int16(data):
    """Gelen ham byte verisini quaternion listesine çevirir."""
    quaternions = []
    n_sensors = len(data) // 8
    for i in range(n_sensors):
        q_list = [struct.unpack('<h', data[i*8+j*2:i*8+j*2+2])[0] / 32768.0 for j in range(4)]
        quaternions.append(Quaternion(w=q_list[0], x=q_list[1], y=q_list[2], z=q_list[3]))
    return quaternions

async def record_from_device(device_address, char_uuid, duration):
    """Belirtilen bir adresteki tek bir cihazdan veri toplamak için asenkron fonksiyon."""
    print(f"  -> {device_address} adresine bağlanmaya çalışılıyor...")
    try:
        async with BleakClient(device_address, timeout=10.0) as client:
            if not client.is_connected:
                print(f"  ❌ HATA: {device_address} adresine bağlanılamadı.")
                return None
            
            print(f"  🔌 {device_address} adresine başarıyla bağlandı.")
            
            received_data = []
            def data_handler(sender, data):
                received_data.append(parse_quaternions_int16(data))

            await client.start_notify(char_uuid, data_handler)
            print(f"  🎬 {device_address} adresinden {duration} saniye kayıt yapılıyor...")
            await asyncio.sleep(duration)
            await client.stop_notify(char_uuid)
            
            print(f"  ✅ {device_address} adresinden kayıt tamamlandı.")
            return received_data
            
    except Exception as e:
        print(f"  ❌ {device_address} ile ilgili bir hata oluştu: {e}")
        return None

async def main():
    print("--- Advanced Batch Data Recording Script (Dual Device) ---")
    
    session_path = os.path.join(BASE_SAVE_FOLDER, MOVEMENT_TYPE, USER_ID)
    save_path = os.path.join(session_path, RECORDING_LABEL)
    final_label_in_file = f"{MOVEMENT_TYPE}_{RECORDING_LABEL}"
    
    os.makedirs(save_path, exist_ok=True)
    print(f"User: {USER_ID}, Movement: {MOVEMENT_TYPE}")
    print(f"All recordings in this session will be labeled as '{RECORDING_LABEL}'.")
    print(f"Recordings will be saved to: {save_path}")
    print("-" * 30)

    # N-Pose Kaydı (İki cihazdan da)
    npose_search_path = os.path.join(BASE_SAVE_FOLDER, MOVEMENT_TYPE, USER_ID)
    if not any(fname.startswith('npose_') for fname in os.listdir(npose_search_path)):
        input("An N-Pose reference is required. Please assume N-Pose and press Enter to start recording from BOTH devices...")
        
        print("🎬 Starting 2-second N-Pose recording from both devices concurrently...")
        # asyncio.gather ile iki cihazdan aynı anda veri topluyoruz.
        npose_results = await asyncio.gather(
            record_from_device(DEVICE_JACKET_ADDRESS, ORIENTATION_UUID, 2),
            record_from_device(DEVICE_TROUSERS_ADDRESS, ORIENTATION_UUID, 2)
        )
        
        jacket_npose_data, trousers_npose_data = npose_results

        if jacket_npose_data and trousers_npose_data:
            npose_filename = os.path.join(npose_search_path, f"npose_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pkl")
            
            # İki cihazın verilerini birleştiriyoruz.
            combined_frames = []
            min_len = min(len(jacket_npose_data), len(trousers_npose_data))
            for i in range(min_len):
                jacket_frame = [val for q in jacket_npose_data[i] for val in (q.x, q.y, q.z, q.w)]
                trousers_frame = [val for q in trousers_npose_data[i] for val in (q.x, q.y, q.z, q.w)]
                combined_frames.append(jacket_frame + trousers_frame)

            with open(npose_filename, "wb") as f:
                pickle.dump({'data': combined_frames, 'label': 'npose'}, f)
            print(f"✅ Combined N-Pose reference saved: {npose_filename}\n")
        else:
            print("❌ ERROR: Failed to receive N-Pose data from one or both devices. Script is stopping.")
            return
    else:
        print("✅ N-Pose reference already exists. Proceeding to movement recordings.\n")

    # Hareket Kayıtları
    for i in range(NUMBER_OF_RECORDINGS):
        print(f"--- Recording #{i+1}/{NUMBER_OF_RECORDINGS} ({RECORDING_LABEL}) ---")
        input("Press Enter when ready...")

        print(f"🎬 Starting {RECORD_DURATION}-second movement recording from both devices concurrently...")
        movement_results = await asyncio.gather(
            record_from_device(DEVICE_JACKET_ADDRESS, ORIENTATION_UUID, RECORD_DURATION),
            record_from_device(DEVICE_TROUSERS_ADDRESS, ORIENTATION_UUID, RECORD_DURATION)
        )

        jacket_mov_data, trousers_mov_data = movement_results

        if jacket_mov_data and trousers_mov_data:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = os.path.join(save_path, f"movement_{timestamp}.pkl")
            
            # Hareket verilerini birleştiriyoruz.
            combined_frames = []
            min_len = min(len(jacket_mov_data), len(trousers_mov_data))
            for i in range(min_len):
                jacket_frame = [val for q in jacket_mov_data[i] for val in (q.x, q.y, q.z, q.w)]
                trousers_frame = [val for q in trousers_mov_data[i] for val in (q.x, q.y, q.z, q.w)]
                combined_frames.append(jacket_frame + trousers_frame)

            with open(filename, "wb") as f:
                pickle.dump({'data': combined_frames, 'label': final_label_in_file}, f)
            
            print(f"✅ Recording saved: {filename}\n")
        else:
            print("❌ ERROR: No data received from one or both devices. Skipping this attempt.\n")
        
        time.sleep(1)
    
    print("--- All recordings for this label completed! ---")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as e:
        print(f"An unexpected error occurred in the main loop: {e}")