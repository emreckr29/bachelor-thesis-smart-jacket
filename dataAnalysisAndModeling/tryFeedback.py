import asyncio
from tensorflow.keras.models import load_model
from bleak import BleakClient
import numpy as np
import pickle
from sklearn.preprocessing import StandardScaler

# Define the characteristic UUID to send LED feedback to the sensor
LED_CHARACTERISTIC_UUID = 'FF65'  # Replace with your LED characteristic UUID

# Function to parse quaternion data received from the sensor
def parse_quaternion_data(data):
    # Assuming data is a byte string representing quaternion values
    # Example: [q1, q2, q3, q4]
    quaternion_data = np.frombuffer(data, dtype=np.float32)
    return quaternion_data

# Function to send feedback to the sensor based on the model prediction
async def send_led_feedback(is_correct, sensor_address):
    async with BleakClient(sensor_address) as client:
        if is_correct:
            # Correct movement - Send green light
            led_color = '01 01 FF 00 00'
            print("Movement is correct, sending green light.")
        else:
            # Incorrect movement - Send red light
            led_color = '01 01 00 FF 00'
            print("Movement is incorrect, sending red light.")
        
        # Send the LED color command to the sensor
        await client.write_gatt_char(LED_CHARACTERISTIC_UUID, led_color.encode('utf-8'))

# Real-time feedback system that listens to sensor data and predicts the movement
async def real_time_feedback(sensor_address, model, scaler):
    async with BleakClient(sensor_address) as client:
        while True:
            # Read data from the sensor (quaternion values)
            data = await client.read_gatt_char('FF64')  # Replace with the quaternion characteristic UUID
            quaternion_data = parse_quaternion_data(data)

            # Scale the data (same as during training)
            quaternion_data_scaled = scaler.transform([quaternion_data])

            # Use the trained model to predict the movement
            prediction = model.predict(quaternion_data_scaled)
            
            # If the prediction is 1 (correct movement), send green light, otherwise red
            is_correct = (prediction[0] == 1)  # 1: correct, 0: incorrect
            await send_led_feedback(is_correct, sensor_address)

            # Sleep for a short time before fetching new data
            await asyncio.sleep(1)  # Delay for 1 second

# Loading the trained model and scaler from pickle
#with open('trained_model.pkl', 'rb') as model_file:
 #   model = pickle.load(model_file)
model = load_model('final_lstm_model.h5')

with open('scaler.pkl', 'rb') as scaler_file:
    scaler = pickle.load(scaler_file)

# Bluetooth sensor address (Replace with your sensor's actual address)
sensor_address = '583F5D38-8BD2-A9CC-79EC-8067DB2E1EAE'  # Replace with your BLE sensor address

# Start the real-time feedback system
asyncio.run(real_time_feedback(sensor_address, model, scaler))
