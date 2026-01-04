import pickle

# Specify the path to your pickle file
file_path = '/Users/mac/Desktop/codetry copy/ThesisDataSet/ShoulderAbduction/User-A/LeaningOppositeSide/movement_20250913_202413.pkl'
# Open the file in read-binary mode and load the data
with open(file_path, 'rb') as file:
    data = pickle.load(file)

# Now, 'data' contains the deserialized object (list, dictionary, etc.)
print(data)
print(type(data))

import pickle

def count_data_in_pkl(path: str):
    with open(path, "rb") as f:
        data = pickle.load(f)
    if isinstance(data, dict) and "data" in data:
        n = len(data["data"])
        print(f"Number of data points (time steps): {n}")
        return n
    else:
        print("Unexpected format ('data' key not found in the dictionary).")
        return None

# Usage
count_data_in_pkl(file_path)
