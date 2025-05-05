from openai import OpenAI
import os
import base64

client = OpenAI(
  base_url="http://localhost:1234/v1",
  api_key="something-doesnt-matter",
)

image_folder = "images"

if not os.path.isdir(image_folder):
  print(f"Error: Folder '{image_folder}' not found.")
  exit()

# Find .jpg and .png files
image_files = [f for f in os.listdir(image_folder)
         if os.path.isfile(os.path.join(image_folder, f)) and
          (f.lower().endswith(".jpg") or f.lower().endswith(".png"))]

if not image_files:
  print(f"No .jpg or .png files found in '{image_folder}'.")
  exit()

for image_file in image_files:
  image_path = os.path.join(image_folder, image_file)
  print(f"Processing image: {image_path}")

  image_type = "jpeg" if image_file.lower().endswith(".jpg") else "png"

  try:
    with open(image_path, "rb") as img_file:
      base64_image = base64.b64encode(img_file.read()).decode('utf-8')
  except Exception as e:
    print(f"Error reading or encoding image {image_path}: {e}")
    continue

  data_url = f"data:image/{image_type};base64,{base64_image}"

  try:
    response = client.chat.completions.create(
      model="gemma-3-12b-it-qat",
      messages=[
        {
          "role": "user",
          "content": [
            {"type": "text", "text": "Describe this image in detail."},
            {
              "type": "image_url",
              "image_url": {"url": data_url},
            },
          ],
        }
      ],
    )
    print(f"Response for {image_file}:")
    print(response.choices[0].message.content)

  except Exception as e:
    print(f"Error calling API for image {image_path}: {e}")

# Processing image: images\moulin-rouge.jpg
# Response for moulin-rouge.jpg:
# Here's a detailed description of the image:

# **Overall Impression:** The image showcases the iconic Moulin Rouge windmill in Paris, France, at dusk or night. It’s beautifully lit and has a romantic, theatrical feel.

# **Key Elements & Details:**

# *   **The Windmill:** This is the focal point. It's painted a vibrant red and features four large sails. Each sail is outlined with bright pink/red neon lights in a crisscross pattern, creating a striking visual effect against the dark sky. The central hub of the windmill has a spiral design also illuminated.
# *   **Building Structure:** The windmill sits atop a rounded building structure that appears to be made of red brick or stone. It has arched windows with warm yellow light glowing from within. There are decorative details around the windows and along the roofline.
# *   **Surrounding Architecture:** To the left, there's a glimpse of another building, also painted in lighter tones (possibly white or beige). A wrought-iron fence runs along the front of the structure, adding to the Parisian aesthetic.
# *   **Lighting:** The image is dominated by artificial lighting:
#     *   The windmill sails are brightly lit with pink/red neon.
#     *   The windows glow warmly from within.
#     *   A street lamp on a post provides additional illumination near the fence.
# *   **Sky:** The sky is a deep, dark blue, suggesting twilight or nightfall. It creates a dramatic backdrop for the illuminated windmill.

# **Color Palette:** The dominant colors are red (windmill and building), pink/red (neon lights), yellow (window light), and blue (sky).

# **Composition:** The windmill is centrally positioned in the frame, drawing the viewer's eye immediately. The surrounding buildings provide context and a sense of place.



# Let me know if you would like any further details!

# Processing image: images\zen.jpg
# Response for zen.jpg:
# Here's a detailed description of the image:

# **Overall Impression:** The image is a portrait with a minimalist, modern aesthetic. It features a young Asian woman bathed in bright sunlight and strong shadows, creating a dramatic and contemplative mood.

# **Subject:**

# *   **Person:** A young woman with long, dark hair is the central focus. She has fair skin and appears to be of East Asian descent.
# *   **Pose & Expression:** Her eyes are closed, and she has a serene expression on her face. One hand gently rests on her forehead, suggesting relaxation or introspection. Her head is tilted slightly downward.

# **Setting & Background:**

# *   **Environment:** The setting appears to be an outdoor space with modern architecture. 
# *   **Background Elements:** A stark white wall forms the backdrop. Strong diagonal lines of sunlight and shadow are cast across the wall, creating a geometric pattern. There's also what looks like a metal railing or ledge in front of her where she rests her arm.       

# **Clothing & Style:**

# *   **Attire:** The woman is wearing a loose-fitting white shirt with long sleeves and button details.
# *   **Overall Aesthetic:** The clothing contributes to the clean, minimalist style of the image.

# **Lighting & Color Palette:**

# *   **Light Source:** Bright sunlight is the primary light source, creating strong contrasts between illuminated areas and deep shadows.
# *   **Color Palette:** The color palette is predominantly white, gray, and black, with a focus on monochrome tones. This reinforces the minimalist feel.

# **Composition:**

# *   **Framing:** The image is a medium shot, focusing on the woman from roughly the mid-torso up.
# *   **Rule of Thirds:** The subject is positioned slightly off-center, potentially adhering to the rule of thirds for visual interest.



# In essence, it's a stylish and evocative portrait that uses light, shadow, and minimalist elements to convey a sense of peace and contemplation.