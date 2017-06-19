import axios from "axios";

function request(self, path, data) {
  return axios.post(`http://localhost:${self.port}/${path}`, data);
}

function executeQuery(self, selector, timeout) {
  return self.sendAction("element", {selector, retry: true}, timeout);
}

function executeClick(self, path, data) {
  return request(self, path, data);
}

function doClick(self, selector, path="click", timeout) {
  return new Promise((resolve, reject) => {
    executeQuery(self, selector, timeout).then((data) => {
      if (!data) {
        setTimeout(() => doClick(resolve, reject), 500);
        return;
      }
      executeClick(self, path, data).then(resolve, reject);
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
        request(this, "move", data).then(resolve, reject);
      }, reject);
    });
  }
};
