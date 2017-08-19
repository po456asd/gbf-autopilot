import axios from "axios";

export function request(self, data, path="click") {
  return axios.post(`http://localhost:${self.port}/${path}`, data);
}

export function executeQuery(self, selector, timeout) {
  return self.sendAction("element", {selector, retry: true}, timeout);
}

export function executeClick(self, data, path) {
  return request(self, data, path);
}

export function doClick(self, selector, path="click", timeout) {
  return new Promise((resolve, reject) => {
    executeQuery(self, selector, timeout).then((data) => {
      if (!data) {
        setTimeout(() => doClick(resolve, reject), 500);
        return;
      }
      executeClick(self, data, path).then(resolve, reject);
    });
  });
}

export default {
  "click": function(selector, timeout) {
    return doClick(this, selector, "click", timeout);
  },
  "click.immediate": function() {
    return executeClick(this, "click/immediate");
  },
  "dblclick": function(selector, timeout) {
    return doClick(this, selector, "dblclick", timeout);
  },
  "move": function(selector, timeout) {
    return new Promise((resolve, reject) => {
      executeQuery(this, selector, timeout).then((data) => {
        request(this, data, "move").then(resolve, reject);
      }, reject);
    });
  }
};
