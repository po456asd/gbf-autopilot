import win32gui
import pyautogui
import random
import math
import time

DEFAULT_TWEEN = pyautogui.easeInOutCubic

class Window:
    def __init__(self, title, tween=DEFAULT_TWEEN, duration=0.5):
        self.title = title
        self.tween = tween
        self.duration = duration

    def getHandle(self):
        return win32gui.FindWindowEx(None, None, None, self.title)

    def getRect(self):
        hwnd = self.getHandle()
        (left, top, right, bottom) = win32gui.GetWindowRect(hwnd)
        return (left, top, right - left, bottom - top)

    def getPosition(self, elementRect, windowRect, scale=1.0):
        (x1, y1, w1, h1) = elementRect
        (x2, y2, w2, h2) = windowRect
        (x3, y3, w3, h3) = self.getRect()

        innerX = round(x1 + (w1 / 2)) * scale
        innerY = round(y1 + (h1 / 2)) * scale

        outerX = round(x3 + (w3 - w2 - 8))
        outerY = round(y3 + (h3 - h2 - 8))

        # add deviation
        devX = w1 * scale / 4
        devY = h1 * scale / 4
        devX = round(random.uniform(-devX, devX))
        devY = round(random.uniform(-devY, devY))

        return (
            outerX + innerX + devX,
            outerY + innerY + devY
        )

    def getDistance(self, source, target):
        (x1, y1) = source
        (x2, y2) = target
        return math.sqrt(math.pow(x1 - x2, 2) + math.pow(y1 - y2, 2))

    def getDuration(self, target):
        distance = self.getDistance(pyautogui.position(), target)
        duration = max(self.duration, random.uniform(0, distance / 600))
        return duration

    def click(self, elementRect=None, windowRect=None, scale=1.0, clicks=1):
        if elementRect is None or windowRect is None:
            pyautogui.click(clicks=clicks)
            return
        (x, y) = self.getPosition(elementRect, windowRect, scale)
        pyautogui.click(
            x, y,
            duration=self.getDuration((x, y)),
            tween=self.tween,
            clicks=clicks,
            interval=random.uniform(0.15, 0.35)
        )
        self.delay()
    
    def moveTo(self, elementRect, windowRect, scale=1.0):
        (x, y) = self.getPosition(elementRect, windowRect, scale)
        pyautogui.moveTo(
            x, y, 
            duration=self.getDuration((x, y)),
            tween=self.tween
        )
        self.delay()

    def delay(self):
        time.sleep(random.uniform(0.08, 0.15))

if __name__ == '__main__':
    window = Window('Granblue Fantasy - Google Chrome')
    print(window.getRect())
