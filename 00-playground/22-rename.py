# python3 22-rename.py

import os

folder_path = os.path.join(os.getcwd(), "files")

for filename in os.listdir(folder_path):
    lowercase_name = filename.lower()
    os.rename(
        os.path.join(folder_path, filename), os.path.join(folder_path, lowercase_name)
    )
