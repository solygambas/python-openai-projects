# python3 23-classifying-files.py folders

import os
import shutil
import sys


def organize_files(folder_path):
    # Create the subfolders if they don't exist
    audio_folder = os.path.join(folder_path, "audio")
    video_folder = os.path.join(folder_path, "video")
    other_folder = os.path.join(folder_path, "other")
    # mode is ignored, we have to set it explicitly 
    # https://stackoverflow.com/questions/5231901/permission-problems-when-creating-a-dir-with-os-makedirs-in-python?rq=4
    os.chmod(folder_path, mode=0o777)
    for subfolder in [audio_folder, video_folder, other_folder]:
        os.makedirs(subfolder, exist_ok=True)
        os.chmod(subfolder, mode=0o777)

    # Scan the files in the given folder
    files = os.listdir(folder_path)
    for file_name in files:
        file_path = os.path.join(folder_path, file_name)
        if os.path.isfile(file_path):
            # Determine the file type
            file_extension = os.path.splitext(file_name)[1].lower()
            if file_extension in (".mp3", ".wav", ".flac"):
                # Move audio files to the "audio" folder
                destination_folder = audio_folder
            elif file_extension in (".mp4", ".mov", ".mkv"):
                # Move video files to the "video" folder
                destination_folder = video_folder
            else:
                # Move other files to the "other" folder
                destination_folder = other_folder

            # Move the file to the appropriate subfolder
            shutil.move(file_path, os.path.join(destination_folder, file_name))

    print("File organization completed successfully!")


# Get the folder path from command-line argument
if len(sys.argv) < 2:
    print("Please provide the folder path as a command-line argument.")
else:
    folder_path = sys.argv[1]
    organize_files(folder_path)
