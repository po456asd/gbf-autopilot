import packer from "~/lib/messaging/packer";
import assign from "lodash/assign";

function realPoint(pnt, offset, scale) {
  return offset + ((pnt - offset) * scale);
}

export default {
  "element": function(selector, cb, retry) {
    const windowRect = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    function findElement(cb) {
      var rect, element;
      const cnt = document.querySelector("#mobage-game-container");
      if (!cnt) {
        retry(() => findElement(cb));
      }
      const offset = cnt.getBoundingClientRect();
      const scale = Number(cnt.style.zoom);
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => {
        const temp = el.getBoundingClientRect();
        const real = {
          x: realPoint(temp.left, offset.left, scale),
          y: realPoint(temp.top, offset.top, scale),
          width: realPoint(temp.width, 0, scale),
          height: realPoint(temp.height, 0, scale)
        };
        if (real.x < windowRect.width && 
            real.y < windowRect.height &&
            real.width > 0 &&
            real.height > 0) {
          rect = real;
          element = el;
          return false;
        }
      });

      if (!element) {
        retry(() => findElement(cb));
      } else {
        cb(rect, element, scale);
      }
    }

    findElement((rect, element, scale) => {
      cb(packer("element", assign(rect, {
        window: windowRect,
        scale
      })));
    });
  }
};
