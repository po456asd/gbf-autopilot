import axios from "axios";

const SERVER_URL = "http://localhost:5000";
export default {
  "click": function(payload) {
    return new Promise((resolve, reject) => {
      axios.post(SERVER_URL + "/click", payload).then(resolve, reject);
    });
  }
};
