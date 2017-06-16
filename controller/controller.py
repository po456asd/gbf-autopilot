#!/usr/bin/env python
from flask import Flask, request
from flask_cors import CORS
from configparser import ConfigParser
from gbf_autopilot import Window
import pyautogui
import win32gui
import os

config = ConfigParser()
config.read(os.path.join(os.path.dirname(__file__), 'config.ini'))

WINDOW_TITLE = config['controller']['window_title']
DEFAULT_PORT = config['controller']['listener_port']
DEFAULT_TWEEN = getattr(pyautogui, config['controller']['input_tween'])

window = Window(WINDOW_TITLE, DEFAULT_TWEEN)
app = Flask(__name__)
CORS(app)

@app.route('/click', methods=['POST'])
def click():
    json = request.json
    window.click(
        (json['x'], json['y'], json['width'], json['height']), 
        (0, 0, json['window']['width'], json['window']['height'])
    )
    return "OK"

if __name__ == '__main__':
    app.run(host='localhost', port=DEFAULT_PORT)
