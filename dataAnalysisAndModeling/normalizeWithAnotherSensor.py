import pandas as pd
import numpy as np
import quaternion  # To install: pip install numpy-quaternion
import matplotlib.pyplot as plt
import os
import pickle

def load_and_reshape_data_from_pkl(filename):
    """
    Loads a .pkl file and converts the internal 'flat' data structure
    into a list of DataFrames, one DataFrame per sensor.
    """
    print(f"Loading and reshaping data from: {filename}")
    if not os.path.exists(filename):
        print(f"WARNING: File not found - {filename}")
        return None

    with open(filename, 'rb') as f:
        loaded_dict = pickle.load(f)
    
    # The data comes as a list of frames. Each frame contains 40 values.
    frames_list = loaded_dict['data']
    
    # Convert this structure into a list of 10 DataFrames
    num_sensors = 10
    sensor_data_frames = [pd.DataFrame() for _ in range(num_sensors)]
    
    all_sensor_data = []
    for frame in frames_list:
        # Split each frame (list of 40 values) into sensor data (4 values per sensor)
        frame_sensors = []
        for i in range(num_sensors):
            # IMPORTANT: We assume the order in the dataset is x, y, z, w.
            # If it is different (e.g., w, x, y, z), this order must be changed.
            x = frame[i * 4 + 0]
            y = frame[i * 4 + 1]
            z = frame[i * 4 + 2]
            w = frame[i * 4 + 3]
            frame_sensors.append({'w': w, 'x': x, 'y': y, 'z': z})
        all_sensor_data.append(frame_sensors)

    # all_sensor_data is now structured as [frame][sensor].
    # Convert it to [sensor][frame].
    for i in range(num_sensors):
        sensor_i_timeseries = [frame[i] for frame in all_sensor_data]
        sensor_data_frames[i] = pd.DataFrame(sensor_i_timeseries)

    return sensor_data_frames

def normalize_movement(movement_data_list):
    """
    Normalizes a movement recording (list of DataFrames)
    based on the initial orientation of a reference sensor.
    """
    if not movement_data_list:
        return None

    ref_sensor_index = 4  # Sensor 5 (back) is used as the reference sensor.
    
    q_ref_row = movement_data_list[ref_sensor_index].iloc[0]
    q_ref = np.quaternion(
        q_ref_row['w'],
        q_ref_row['x'],
        q_ref_row['y'],
        q_ref_row['z']
    )
    q_ref_inverse = q_ref.inverse()
    
    normalized_movement = []
    
    for sensor_df in movement_data_list:
        quats_np_array = sensor_df[['w', 'x', 'y', 'z']].to_numpy()
        quats_array = quaternion.as_quat_array(quats_np_array)
        normalized_quats = q_ref_inverse * quats_array
        normalized_df = pd.DataFrame(
            quaternion.as_float_array(normalized_quats),
            columns=['w', 'x', 'y', 'z']
        )
        normalized_movement.append(normalized_df)
        
    return normalized_movement

# --- Main Code ---
pkl_file_1 = "/Users/mac/Desktop/codetry copy/ThesisDataSet/ShoulderFlexion/User-A/TooHighFlexion/movement_20250913_201536.pkl"
pkl_file_2 = "/Users/mac/Desktop/codetry copy/ThesisDataSet/ShoulderFlexion/User-A/TooHighFlexion/movement_20250913_201602.pkl"

# Load .pkl files and convert them to the correct format
recording1_raw = load_and_reshape_data_from_pkl(pkl_file_1)
recording2_raw = load_and_reshape_data_from_pkl(pkl_file_2)

if recording1_raw and recording2_raw:
    recording1_normalized = normalize_movement(recording1_raw)
    recording2_normalized = normalize_movement(recording2_raw)

    # --- Visualization ---
    plt.style.use('seaborn-v0_8-whitegrid')
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(15, 12))
    fig.suptitle(
        'Orientation Dependency Problem and Its Solution (Using Real Data Structure)',
        fontsize=16
    )

    sensor_to_plot_idx = 1  # Sensor 2 (right upper arm)

    # 1st Plot: BEFORE normalization
    ax1.plot(
        recording1_raw[sensor_to_plot_idx].index,
        recording1_raw[sensor_to_plot_idx]['x'],
        label=f'Sample A ({pkl_file_1}) - Original'
    )
    ax1.plot(
        recording2_raw[sensor_to_plot_idx].index,
        recording2_raw[sensor_to_plot_idx]['x'],
        label=f'Sample B ({pkl_file_2}) - Original',
        linestyle='--'
    )
    ax1.set_title('BEFORE Normalization', fontsize=14)
    ax1.set_xlabel('Time (Frame)')
    ax1.set_ylabel('Sensor 2 - "x" Value')
    ax1.legend()
    
    # 2nd Plot: AFTER normalization
    ax2.plot(
        recording1_normalized[sensor_to_plot_idx].index,
        recording1_normalized[sensor_to_plot_idx]['x'],
        label=f'Sample A ({pkl_file_1}) - Normalized'
    )
    ax2.plot(
        recording2_normalized[sensor_to_plot_idx].index,
        recording2_normalized[sensor_to_plot_idx]['x'],
        label=f'Sample B ({pkl_file_2}) - Normalized',
        linestyle='--'
    )
    ax2.set_title('AFTER Normalization', fontsize=14)
    ax2.set_xlabel('Time (Frame)')
    ax2.set_ylabel('Sensor 2 - "x" Value')
    ax2.legend()
    
    plt.tight_layout(rect=[0, 0, 1, 0.96])
    plt.savefig('orientation_normalization_effect_final.png')
    print(
        "\nProcessing completed. "
        "The figure has been saved as 'orientation_normalization_effect_final.png'."
    )

else:
    print("\nOne or both .pkl files could not be loaded.")
