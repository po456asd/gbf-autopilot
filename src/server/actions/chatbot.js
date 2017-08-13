export default {
  "chatbot": function(text) {
    const chatbot = this.server.extensions.chatbot;
    return chatbot.pushToUsers({
      type: "text",
      text
    });
  }
};
