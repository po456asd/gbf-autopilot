import axios from "axios";

export default {
  "chatbot": function(text) {
    const port = this.config.Chatbot.ListenerPort;
    return axios.post(`http://localhost:${port}/broadcast`, {
      type: "text",
      text
    });
  }
};
