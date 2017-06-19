import _ from "lodash";

function query(selector) {
  return document.querySelectorAll(selector);
}

function realPoint(pnt, offset, scale) {
  return Math.round(pnt * scale * window.devicePixelRatio);
}

function checkStyle(el) {
  var valid = true;
  _.forEach({
    "display": ["none"], 
    "visibility": ["hidden"]
  }, (values, key) => {
    values.forEach((value) => {
      valid = el.style[key] != value;
      return valid;
    });
    return valid;
  });
  return valid;
}

export default {
  "element": function(payload, done, fail, retry) {
    var selector = payload;
    var retryOnNull = false;
    if (_.isArray(payload)) {
      selector = payload.join(",");
    } else if (_.isObject(payload)) {
      selector = payload.selector;
      retryOnNull = payload.retry;
    }

    const windowRect = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    const cb = (rect, element, scale) => {
      done(_.assign(rect, {
        window: windowRect,
        selector, scale
      }));
    };

    function findElement() {
      var rect, element;
      const cnt = query("#mobage-game-container")[0];
      if (!cnt) {
        return retry(findElement, 150);
      }
      const offset = cnt.parentNode.getBoundingClientRect();
      const scale = Number(cnt.style.zoom);
      const elements = query(selector);
      elements.forEach((el) => {
        if (!checkStyle(el)) {
          return;
        }
        const temp = el.getBoundingClientRect();
        const real = {
          x: realPoint(temp.left, offset.left, scale),
          y: realPoint(temp.top, offset.top, scale),
          width: realPoint(temp.width, 0, scale),
          height: realPoint(temp.height, 0, scale)
        };
        if (real.width <= 0 || real.height <= 0) {
          return;
        } else if (real.x > windowRect.width || real.x < 0) {
          return;
        } else if (real.y > windowRect.height || real.y < 0) {
          const before = cnt.parentNode.scrollTop;
          cnt.parentNode.scrollTop += real.y;
          const after = cnt.parentNode.scrollTop;
          real.y -= after - before;
        }
        rect = real;
        element = el;
        return false;
      });

      if (!element) {
        if (retryOnNull) {
          retry(findElement);
        } else {
          fail(selector);
        }
      } else {
        cb(rect, element, scale);
      }
    }
    findElement();
  }
};
