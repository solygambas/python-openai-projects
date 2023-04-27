from flask import Flask, render_template, request

app = Flask(__name__,
            template_folder='templates')

@app.route("/")
def index():
    return "HELLO THERE FROM FLASK"

if __name__ == "__main__":
    app.run(debug=True)