from flask import Flask, render_template
from flask_cors import CORS

app = Flask(__name__, template_folder=".")
CORS(app)

@app.route("/")
def index():
    return render_template("lsm-arena.html")

@app.route("/lsm-arena")
def contacto():
    return render_template("index.html")

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
