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

WINDOW_TITLE = config['controller']['window_title']
DEFAULT_PORT = int(config['controller']['listener_port'])
COMMAND_PORT = int(config['controller']['command_port'])
DEFAULT_TWEEN = getattr(pyautogui, config['controller']['input_tween'])

commandStarted = False
window = Window(WINDOW_TITLE, DEFAULT_TWEEN)
app = Flask(__name__)
CORS(app)

@app.route('/start', methods=['POST'])
def start():
	global commandStarted
	print("Command started")
	commandStarted = True
	return "OK"

@app.route('/stop', methods=['POST'])
def stop():
	global commandStarted
	print("Command stopped")
	commandStarted = False
	return "OK"

@app.route('/click', methods=['POST'])
def click():
	if not commandStarted:
		return "FAIL"
	json = request.json
	window.click(
		(json['x'], json['y'], json['width'], json['height']),
		(0, 0, json['window']['width'], json['window']['height'])
	)
	return "OK"

def getKeyPressed(keyCode):
	retval = win32api.GetAsyncKeyState(keyCode)
	return retval == 1

def stopCommandServer():
	print("Stopping command server...")
	try:
		requests.post("http://localhost:%d/stop" % COMMAND_PORT)
		print("Command server stopped")
	except:
		print("Failed to stop the command server!")

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
	print(window.getRect())
	listenForEscape()
	app.run(host='localhost', port=DEFAULT_PORT)
