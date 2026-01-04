import pickle

# Örnek bir pkl dosyasının yolunu belirt
file_path = "/Users/mac/Desktop/codetry/dataset/testing/wrong/wrong_20250428_032529.pkl"  # Burayı kendi dosyanla değiştir

# Dosyayı aç ve veriyi kontrol et
with open(file_path, "rb") as f:
    content = pickle.load(f)
    sequence = content['data']
    print(f"Frame sayısı: {len(sequence)}")
