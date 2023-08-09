from flask import Flask, render_template, request, redirect
import sqlite3
import random
import string

app = Flask(__name__)
app.config["SECRET_KEY"] = "your_secret_key"


def generate_short_url():
    characters = string.ascii_letters + string.digits
    return "".join(random.choice(characters) for _ in range(6))


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/shorten", methods=["POST"])
def shorten():
    original_url = request.form["url"]

    # Generate a unique short URL
    short_url = generate_short_url()

    # Store the URL pair in the database
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO urls (short_url, original_url) VALUES (?, ?)",
        (short_url, original_url),
    )
    conn.commit()
    conn.close()

    return render_template("index.html", short_url=short_url)


@app.route("/<short_url>")
def redirect_to_url(short_url):
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()
    cursor.execute("SELECT original_url FROM urls WHERE short_url=?", (short_url,))
    result = cursor.fetchone()
    conn.close()

    if result:
        original_url = result[0]
        return redirect(original_url)
    else:
        return "URL not found"


if __name__ == "__main__":
    app.run(debug=True)
