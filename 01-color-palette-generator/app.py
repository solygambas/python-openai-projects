from dotenv import dotenv_values
from flask import Flask, render_template, request
import json
import openai

config = dotenv_values(".env")
openai.api_key = config["OPENAI_API_KEY"]

app = Flask(
    __name__, template_folder="templates", static_url_path="", static_folder="static"
)


def get_colors(msg):
    prompt = f"""
    You are a color palette generating assistant that responds to text prompts for color palettes.
    You should generate color palettes that fit the theme, mood, or instructions in the prompt.
    The palettes should be between 2 and 5 colors.

    Q: Convert the following verbal description of a color palette into a list of colors: The Meditation
    A: ["#594F4F", "#A1887F", "#BCAAA4", "#81C784", "#455A64"]

    Q: Convert the following verbal description of a color palette into a list of colors: The Mediterranean Sea
    A: ["#1A237E", "#1565C0", "#1E88E5", "#90CAF9", "#E1F5FE"]

    Desired Format: a JSON array of hexadecimal color codes

    Q: Convert the following verbal description of a color palette into a list of colors: {msg}
    A:
    """

    response = openai.Completion.create(
        model="text-davinci-003", prompt=prompt, max_tokens=50
    )
    colors = json.loads(response["choices"][0]["text"])
    return colors


@app.route("/palette", methods=["POST"])
def prompt_to_palette():
    query = request.form.get("query")
    # fetch OpenAI
    # colors = get_colors(query)
    # test locally
    colors = ["#FDE3A7", "#F9BF3B", "#FF9800", "#F44336", "#795548"]
    return {"colors": colors}


@app.route("/")
def index():
    return render_template("index.html")


if __name__ == "__main__":
    app.run(debug=True)
