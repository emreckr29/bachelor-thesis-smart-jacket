import pickle
import numpy as np
from pyquaternion import Quaternion
import matplotlib.pyplot as plt
import visualize

# ---------------- Insert your visualize_10_sensors() function here ---------------- #

def load_quaternion_frames(pkl_path):
    with open(pkl_path, 'rb') as f:
        data = pickle.load(f)
    frames = data['data']
    all_quat_frames = []
    for frame in frames:
        if len(frame) != 40:
            continue  # Skip invalid frames
        quats = [Quaternion(frame[i:i+4]) for i in range(0, 40, 4)]
        all_quat_frames.append(quats)
    return all_quat_frames

def animate_quaternions(frames):
    visualize.init()
    for quats in frames:
        visualize.visualize_10_sensorforread(*quats)  # You must define this above
        plt.pause(0.1)  # Short delay between frames

if __name__ == "__main__":
    pkl_path = "/Users/mac/Desktop/codetry copy/ThesisDataSet/ShoulderAbduction/User-A/True/movement_20250913_202035.pkl"  # Replace with your path if needed
    all_frames = load_quaternion_frames(pkl_path)
    animate_quaternions(all_frames)



