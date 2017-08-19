#!/usr/bin/env python
from flask import Flask, request
from flask_cors import CORS
from configparser import ConfigParser
from gbf_autopilot import Window
from threading import Thread

import requests
import pyautogui
import win32gui
import win32api
import win32con
import time
import os

config = ConfigParser()
config.read(os.path.join(os.path.dirname(__file__), 'config.ini'))

WINDOW_TITLE = config['Controller']['WindowTitle']
DEFAULT_PORT = int(config['Controller']['ListenerPort'])
COMMAND_PORT = int(config['Controller']['CommandPort'])
DEFAULT_TWEEN = getattr(pyautogui, config['Controller']['InputTween'])

commandStarted = False
window = Window(WINDOW_TITLE, DEFAULT_TWEEN)
app = Flask(__name__)
CORS(app)

def elementRect(json):
    return (json['x'], json['y'], json['width'], json['height'])

def windowRect(json):
    return (0, 0, json['window']['width'], json['window']['height'])

@app.route('/start', methods=['POST'])
def start():
    global commandStarted
    if not commandStarted:
        commandStarted = True
        print('Command started')
    return 'OK'

@app.route('/stop', methods=['POST'])
def stop():
    global commandStarted
    if commandStarted:
        commandStarted = False
        print('Command stopped')
    return 'OK'

def doClick(json, clicks=1):
    if not commandStarted:
        return 'FAIL'
    window.click(
        elementRect(json),
        windowRect(json),
        clicks=clicks
    )
    return 'OK'

@app.route('/click', methods=['POST'])
def click():
    json = request.json
    return doClick(json)

@app.route('/click/immediate', methods=['POST'])
def clickImmediate():
    if not commandStarted:
        return 'FAIL'
    window.click()
    return 'OK'

@app.route('/dblclick', methods=['POST'])
def dblclick():
    json = request.json
    return doClick(json, 2)

@app.route('/move', methods=['POST'])
def move():
    json = request.json
    if not commandStarted:
        return 'FAIL'
    window.moveTo(
        elementRect(json),
        windowRect(json)
    )
    return 'OK'

def getKeyPressed(keyCode):
    retval = win32api.GetAsyncKeyState(keyCode)
    return retval == 1

def stopCommandServer():
    global commandStarted
    print('Stopping command server...')
    try:
        requests.post('http://localhost:%d/stop' % COMMAND_PORT)
        commandStarted = False
        print('Command server stopped')
    except:
        print('Failed to stop the command server!')

def listenForEscape():
    running = True

    def task():
        if commandStarted and getKeyPressed(win32con.VK_ESCAPE):
            stopCommandServer()

    def runner():
        while running:
            task()
            time.sleep(0.5)
    t = Thread(target=runner)
    t.setDaemon(True)
    t.start()

if __name__ == '__main__':
    listenForEscape()
    app.run(host='localhost', port=DEFAULT_PORT)
