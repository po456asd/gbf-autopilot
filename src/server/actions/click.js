import axios from "axios";

export default {
  "click": function(selector, timeout) {
    const doClick = (resolve, reject) => {
      this.sendAction("element", selector, timeout).then((data) => {
        if (!data) {
          setTimeout(() => doClick(resolve, reject), 500);
          return;
        }
        axios.post(`http://localhost:${this.port}/click`, data).then(resolve, reject);
      }, reject);
    };
    return new Promise(doClick);
  },
};
