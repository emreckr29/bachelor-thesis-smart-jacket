import pickle
import pandas as pd

file_path = "/Users/mac/Desktop/codetry/dataset/right/right_20250428_015936.pkl"
with open(file_path, "rb") as f:
    data_dict = pickle.load(f)

data = data_dict["data"]
label = data_dict["label"]

# Automatically generate column names
sensor_count = 10
columns = []
for i in range(sensor_count):
    for j in range(4):
        columns.append(f"S{i+1}_Q{j+1}")

# Convert to DataFrame
df = pd.DataFrame(data, columns=columns)
df["Label"] = label  # Add the same label to each row

# Save to Excel
excel_path = file_path.replace(".pkl", ".xlsx")
df.to_excel(excel_path, index=False)
