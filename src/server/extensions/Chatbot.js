import axios from "axios";
import io from "socket.io-client";
import BaseExtension from "./BaseExtension";
import forEach from "lodash/forEach";
import commands from "./Chatbot/commands";

export default class Chatbot extends BaseExtension {
  constructor() {
    super();
    this.prefix = "/";
    this.commands = {};
    this.subscribers = new Set();
    forEach(commands, (command, name) => {
      this.commands[name] = command.bind(this);
    });
  }

  getConfig() {
    return this.server.config;
  }

  onSetup(server) {
    this.server = server;

    const config = this.getConfig();
    this.url = config.Chatbot.URL;
    this.token = config.Chatbot.Token;
    this.http = axios.create({
      baseURL: this.url + "/api/",
      headers: {
        "Authorization": "Bearer " + this.token
      }
    });

    this.socket = io(this.url, {
      path: "/listen",
      query: "token=" + this.token
    });
    this.socket.on("connect", ::this.onChatConnect);
    this.socket.on("events", ::this.onChatEvents);

    this.users = config.Chatbot.UserId.split(/[,\s]/);
  }

  onChatConnect() {}

  onChatEvents(events) {
    forEach(events, ::this.onChatEvent);
  }

  onChatEvent(event) {
    if (event.type !== "message") return;
    if (event.message.type !== "text") return;
    const text = event.message.text;
    const trigger = text.split(" ")[0];
    if (trigger.startsWith(this.prefix)) {
      const prefixLength = this.prefix.length;
      const triggerLength = trigger.length;
      const command = this.commands[trigger.substr(prefixLength)];
      if (!command) return;
      const arg = text.substr(triggerLength).trim();
      command(this.createReplyCallback(event.replyToken), arg, event);
    }
  }

  createReplyCallback(replyToken) {
    return {
      text: (text) => {
        return this.reply(replyToken, {type: "text", text});
      }
    };
  }

  broadcast(message) {
    return this.http.post("/broadcast", {message});
  }

  reply(token, message) {
    return this.http.post("/reply", {token, message});
  }

  pushToUsers(message) {
    const users = this.users.slice();
    const pushMessage = () => {
      const user = users.pop();
      if (!user) return;
      this.http.post("/push", {to: user, message}).then(pushMessage, ::console.error);
    };
    pushMessage();
  }
}
