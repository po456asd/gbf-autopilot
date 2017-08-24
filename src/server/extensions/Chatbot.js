import _ from "lodash";
import axios from "axios";
import io from "socket.io-client";
import BaseExtension from "./BaseExtension";
import forEach from "lodash/forEach";
import BasicCommands from "./Chatbot/BasicCommands";

const plugins = [
  new BasicCommands()
];

export default class Chatbot extends BaseExtension {
  constructor() {
    super();
    this.enabled = false;
    this.prefix = "/";
    this.commands = {};
    forEach(plugins, (plugin) => {
      forEach(plugin.getCommands(), (command, name) => {
        this.commands[name] = command;
      });
    });
  }

  getConfig() {
    return this.server.config;
  }

  onSetup(server) {
    this.server = server;
    const config = this.getConfig();
    if (!config.Chatbot.Enabled) return;

    this.enabled = true;
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

    this.users = new Set(config.Chatbot.UserId.split(/[,\s]/));
    forEach(plugins, (plugin) => {
      plugin.setup(this, server);
    });
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
    return new Promise((resolve, reject) => {
      const users = this.users.values();
      const pushMessage = () => {
        const user = users.next();
        if (user.done) resolve();
        this.pushToUser(user.value, message).then(pushMessage, reject);
      };
      pushMessage();
    });
  }

  pushToUser(user, message) {
    return this.http.post("/push", {to: user, message});
  }
}
