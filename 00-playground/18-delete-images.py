import os
import sys

# Get the folder name provided as an argument from the command line
if len(sys.argv) < 2:
    print("Usage: python delete_images.py folder_name")
    sys.exit(1)
folder_name = sys.argv[1]

# Search for all .png and .jpg files in the provided folder
images = []
for root, dirs, files in os.walk(folder_name):
    for file in files:
        if file.endswith(".png") or file.endswith(".jpg"):
            images.append(os.path.join(root, file))

# Delete all the image files
for image in images:
    os.remove(image)
    print(f"{image} deleted.")
