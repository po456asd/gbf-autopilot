import axios from "axios";
import io from "socket.io-client";
import BaseExtension from "./BaseExtension";
import forEach from "lodash/forEach";

export default class Chatbot extends BaseExtension {
  constructor() {
    super();
    this.prefix = "/";
    this.commands = {
      "th": ::this.treasureHunt
    };
  }

  onSetup(server) {
    this.server = server;
    const config = server.initConfig;

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
      command(arg, (message) => {
        return this.http.post("/reply", {
          token: event.replyToken,
          message
        });
      });
    }
  }

  treasureHunt(code, reply) {
    this.server.extensions.raidQueue.push(code);
    reply({
      type: "text",
      text: "Raid added to queue"
    });
  }
}
