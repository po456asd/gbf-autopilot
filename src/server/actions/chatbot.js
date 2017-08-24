export default {
  "chatbot": function(text) {
    const chatbot = this.server.extensions.chatbot;
    return chatbot.pushToUsers({
      type: "text",
      text
    });
  },
  "chatbot.broadcast": function(text) {
    const chatbot = this.server.extensions.chatbot;
    return chatbot.broadcast({
      type: "text",
      text
    });
  }
};
