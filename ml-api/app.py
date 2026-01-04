import os
import pickle
import numpy as np
import pandas as pd
from pyquaternion import Quaternion
from flask import Flask, request, jsonify
from flask_cors import CORS

# --- SETUP ---
app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing for all routes

# The folder where all your .pkl files are stored
MODELS_FOLDER = "final_models" 

# A global dictionary to hold all loaded assets (models, scalers, encoders)
# Structure: { "ShoulderAbduction": { "RandomForest": { "model": obj, "scaler": obj, "le": obj }, ... }, ... }
model_assets = {}

# --- DATA PROCESSING & FEATURE EXTRACTION ---
# These functions are identical to the ones used in your successful Jupyter notebook.

def reshape_from_request(frames_list):
    """Converts the flat list from the request into a list of DataFrames."""
    num_sensors = 10
    all_sensor_data = []
    for frame in frames_list:
        frame_sensors = []
        if len(frame) == num_sensors * 4:
            for i in range(num_sensors):
                x, y, z, w = frame[i*4 : i*4+4]
                frame_sensors.append({'w': w, 'x': x, 'y': y, 'z': z})
            all_sensor_data.append(frame_sensors)
    sensor_data_frames = []
    for i in range(num_sensors):
        sensor_data_frames.append(pd.DataFrame([frame[i] for frame in all_sensor_data]))
    return sensor_data_frames

def normalize_by_first_frame(movement_data_list):
    """Normalizes a movement recording relative to its own first frame."""
    if not movement_data_list or movement_data_list[0].empty: return None
    normalized_movement = []
    for i in range(len(movement_data_list)):
        q_ref_row = movement_data_list[i].iloc[0]
        q_ref = Quaternion(w=q_ref_row['w'], x=q_ref_row['x'], y=q_ref_row['y'], z=q_ref_row['z'])
        q_ref_inverse = q_ref.inverse
        
        normalized_frames = []
        for row in movement_data_list[i].itertuples():
            live_quat = Quaternion(w=row.w, x=row.x, y=row.y, z=row.z)
            normalized_quat = q_ref_inverse * live_quat
            normalized_frames.append({'w': normalized_quat.w, 'x': normalized_quat.x, 'y': normalized_quat.y, 'z': normalized_quat.z})
        normalized_movement.append(pd.DataFrame(normalized_frames))
    return normalized_movement

def get_statistical_features(timeseries):
    return {'mean': np.mean(timeseries), 'std': np.std(timeseries), 'min': np.min(timeseries), 'max': np.max(timeseries), 'range': np.max(timeseries) - np.min(timeseries)}

def get_quaternion_features(quat_df, prefix):
    features = {}
    for component in ['w', 'x', 'y', 'z']:
        stats = get_statistical_features(quat_df[component])
        for stat_name, value in stats.items(): features[f'{prefix}_{component}_{stat_name}'] = value
    return features

def calculate_relative_quaternions(df1, df2):
    relative_frames = []
    for i in range(len(df1)):
        q1 = Quaternion(w=df1.iloc[i]['w'], x=df1.iloc[i]['x'], y=df1.iloc[i]['y'], z=df1.iloc[i]['z'])
        q2 = Quaternion(w=df2.iloc[i]['w'], x=df2.iloc[i]['x'], y=df2.iloc[i]['y'], z=df2.iloc[i]['z'])
        relative_q = q2.inverse * q1
        relative_frames.append({'w': relative_q.w, 'x': relative_q.x, 'y': relative_q.y, 'z': relative_q.z})
    return pd.DataFrame(relative_frames)

def extract_features_for_movement(normalized_data):
    all_features = {}
    for i, sensor_df in enumerate(normalized_data): all_features.update(get_quaternion_features(sensor_df, f's{i+1}'))
    all_features.update(get_quaternion_features(calculate_relative_quaternions(normalized_data[1], normalized_data[4]), 'rel_s2_s5'))
    all_features.update(get_quaternion_features(calculate_relative_quaternions(normalized_data[0], normalized_data[1]), 'rel_s1_s2'))
    all_features.update(get_quaternion_features(calculate_relative_quaternions(normalized_data[2], normalized_data[7]), 'rel_s3_s8'))
    return all_features

# --- DYNAMIC MODEL LOADING ---
def load_all_models():
    """Scans the MODELS_FOLDER and loads all model assets into the global dictionary."""
    print("--- Loading All Models ---")
    if not os.path.isdir(MODELS_FOLDER):
        print(f"ERROR: Models folder not found at '{MODELS_FOLDER}'")
        return

    for filename in os.listdir(MODELS_FOLDER):
        if filename.startswith("final_model_") and filename.endswith(".pkl"):
            # Example filename: "final_model_ShoulderAbduction_RandomForest.pkl"
            clean_name = filename.replace("final_model_", "").replace(".pkl", "")
            parts = clean_name.split("_")
            
            # Robust parsing: The last part is the model name, everything before it is the movement type.
            model_name = parts[-1]
            movement_type = "_".join(parts[:-1])

            if movement_type not in model_assets:
                model_assets[movement_type] = {}
            
            try:
                # Construct paths for all three asset types
                model_path = os.path.join(MODELS_FOLDER, f"final_model_{movement_type}_{model_name}.pkl")
                scaler_path = os.path.join(MODELS_FOLDER, f"final_scaler_{movement_type}_{model_name}.pkl")
                le_path = os.path.join(MODELS_FOLDER, f"final_label_encoder_{movement_type}_{model_name}.pkl")

                with open(model_path, 'rb') as f: model = pickle.load(f)
                with open(scaler_path, 'rb') as f: scaler = pickle.load(f)
                with open(le_path, 'rb') as f: le = pickle.load(f)
                
                model_assets[movement_type][model_name] = {
                    "model": model,
                    "scaler": scaler,
                    "le": le
                }
                print(f"✅ Loaded: {movement_type} - {model_name}")
            except Exception as e:
                print(f"❌ FAILED to load assets for {movement_type} - {model_name}: {e}")
    print("--- Model Loading Complete ---")

# --- FLASK API ENDPOINT ---
@app.route('/predict', methods=['POST'])
def predict():
    content = request.json
    movement_data = content.get('movement_data')
    movement_type = content.get('movement_type')
    model_name = content.get('model_name')

    # --- Input Validation ---
    if not all([movement_data, movement_type, model_name]):
        return jsonify({'error': 'Missing required fields: movement_data, movement_type, and model_name are required.'}), 400
    
    if movement_type not in model_assets or model_name not in model_assets[movement_type]:
        return jsonify({'error': f"Model not found for movement '{movement_type}' with name '{model_name}'. Make sure the server has loaded it."}), 404

    try:
        # 1. Select the correct assets from the loaded dictionary
        assets = model_assets[movement_type][model_name]
        model = assets["model"]
        scaler = assets["scaler"]
        label_encoder = assets["le"]

        # 2. Reshape and Normalize Data
        live_movement_reshaped = reshape_from_request(movement_data)
        live_movement_normalized = normalize_by_first_frame(live_movement_reshaped)
        if live_movement_normalized is None:
            return jsonify({'error': 'Could not process movement data. It might be empty or in the wrong format.'}), 400

        # 3. Extract Features
        features = extract_features_for_movement(live_movement_normalized)
        features_df = pd.DataFrame([features])

        # 4. Scale Features
        features_scaled = scaler.transform(features_df)
        
        # 5. Make Prediction
        prediction_encoded = model.predict(features_scaled)[0]
        prediction_label = label_encoder.inverse_transform([prediction_encoded])[0]

        print(model)
        print(assets)
        print(prediction_label)
        
        return jsonify({'prediction': prediction_label, 'status': 'success'})

    except Exception as e:
        # Log the full error to the server console for debugging
        import traceback
        traceback.print_exc()
        return jsonify({'error': f"An unexpected error occurred during prediction: {str(e)}", 'status': 'failure'}), 500

if __name__ == '__main__':
    load_all_models()  # Load models when the script starts
    app.run(debug=True, port=5000)

