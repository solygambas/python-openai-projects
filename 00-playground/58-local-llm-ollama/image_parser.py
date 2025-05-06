from openai import OpenAI
import os
import base64

client = OpenAI(
  base_url="http://localhost:11434/v1",
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
      model="gemma3:12b-it-qat",
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

# **Overall Impression:**

# The image features a brightly illuminated windmill at night, likely located in a European setting. The focus is on its striking red and white color scheme.

# **Details:**

# *   **Windmill:** It's a classic Dutch-style windmill, relatively small in size. Its frame is constructed with a criss-crossing pattern. The frame is lit with a red glow and adorned with bright white lights. The central hub is also illuminated.
# *   **Building:** The windmill is affixed to a building, which also is lit in a warm, red glow, with prominent arched windows that contains a bright orange/yellow light.
# * **Setting:** The photograph appears to have been taken at night, providing a dark background. The darkness enhances the vibrant colors of the windmill.

# **Lighting and Color:**

# *   **Predominant Colors:** The dominant colors are red, white, and orange.
# *   **Lighting Style:** The artificial lighting is dramatic and theatrical, emphasizing the structure and creating a festive or iconic feel. The contrast between the dark sky and the brightly lit windmill is striking.

# **Composition:**

# *   **Angle:** The windmill is captured from a slight low angle, adding some perspective and prominence to it.
# *   **Focus:** The focus is sharp on the windmill, while the background is blurred, drawing the viewer's attention to the main subject.

# **Possible Location:**
# Given the style of the windmill, and the image quality, it is possible this is the Disney theme park, Fantasyland, in Paris, and more specifically, it is a reproduction of the Moulin Rouge.

# Processing image: images\zen.jpg
# Response for zen.jpg:
# Here's a detailed description of the image:

# **Overall Impression:**

# The image presents a dreamy, artistic portrait of a young woman. It emphasizes light and shadow, creating a surreal and softly textured atmosphere.

# **Subject & Pose:**

# *   **Young Woman:** The primary subject is a young woman with medium-dark skin and shoulder-length black hair.
# *   **Expression:** Her eyes are closed, and her expression seems serene or contemplative.
# *   **Gesture:** She's gently touching the side of her forehead with her hand, as if shielding her eyes or deep in thought.

# **Lighting and Shadows:**

# *   **Strong Sunlight:** The scene is illuminated by strong, direct sunlight, coming from the left.
# *   **Dramatic Shadows:** This creates very pronounced shadows on her face, torso, and the surrounding surface. The shadows are not just outlines but have a textured, almost sculpturally defined quality.
# *   **Stripes:** The sunlight creates distinct, striped patterns on the wall behind her.  

# **Clothing & Background:**

# *   **White Shirt:** She wears a classic white button-down shirt with the top few buttons undone. The fabric has a slightly rumpled or casual feel.
# *   **White Surface:** The background appears to be a simple, clean white surface, possibly a wall or partition.
# *   **Geometric Object:** In the lower portion of the frame, there is a geometric object, potentially a table or stand, with a minimalist design.

# **Composition & Style:**

# *   **Vertical Orientation:** The photograph is taken in a vertical orientation, emphasizing the woman's stature.
# *   **Minimalist:** The overall composition is quite minimalist, with a focus on the subject and the interplay of light and shadow.
# *   **Artistic:** The image has a very artistic and dreamy quality, leaning towards a fashion or conceptual style.



# Let me know if you'd like me to focus on any specific aspect of the image in more detail!