import noop from "lodash/noop";

export default class BasicCommands {
  setup(chatbot, server) {
    this.chatbot = chatbot;
    this.server = server;
    this.config = server.config;
    this.logger = server.logger;
    this.defaultErrorHandler = ::server.defaultErrorHandler;
    this.subscribers = new Set();
    this.notifyOnStop = false;

    server.subscribers.push({
      onStop: () => {
        if (!this.notifyOnStop) return;
        this.notifyOnStop = false;
        chatbot.pushToUsers({
          type: "text",
          text: "Autopilot stopped."
        });
      }
    });
  }

  getCommands() {
    return {
      "th": ::this.treasureHunter,
      "subscribe": ::this.subscribe,
      "unsubscribe": ::this.unsubscribe,
      "user-id": ::this.userId,
      "start": ::this.start,
      "stop": ::this.stop
    };
  }

  treasureHunter(reply, code) {
    const config = this.config;
    if (!this.server.running) {
      return reply.text("Autopilot is not running");
    }
    if (config.Scenario.Name !== "Leech") {
      return reply.text("Autopilot is not running in Leech mode");
    }
    this.server.extensions.raidQueue.push(code);
    return reply.text("Raid added to the queue");
  }

  subscribe(reply, arg, evt) {
    if (!evt.source.userId) return;
    const userId = evt.source.userId;
    if (this.subscribers.has(userId)) {
      return reply.text("You're already subscribed to the bot.");
    }
    this.subscribers.add(userId);
    return reply.text("You're now subscribed to the bot.");
  }

  unsubscribe(reply, arg, evt) {
    if (!evt.source.userId) return;
    const userId = evt.source.userId;
    if (!this.subscribers.has(userId)) {
      return reply.text("You're not subscribed to the bot.");
    }
    this.subscribers.delete(userId);
    return reply.text("You're now unsubscribed from the bot.");
  }

  userId(reply, arg, evt) {
    if (!evt.source.userId) return;
    return reply.text("Your user ID is " + evt.source.userId);
  }

  start(reply, arg, evt) {
    if (evt.source.type !== "user") return;
    const user = evt.source.userId;

    if (!this.chatbot.users.has(user)) return;
    if (this.server.running) {
      return reply.text("Autopilot is already running");
    } else {
      reply.text("Starting autopilot...").then(() => {
        return this.server.start();
      }, this.defaultErrorHandler).then(() => {
        this.notifyOnStop = true;
        return this.pushTextToUser(user, "Autopilot started.");
      }, () => {
        return this.pushTextToUser(user, "Autopilot is already started.");
      }).then(noop, this.defaultErrorHandler);
    }
  }

  stop(reply, arg, evt) {
    if (evt.source.type !== "user") return;
    const user = evt.source.userId;

    if (!this.chatbot.users.has(user)) return;
    if (!this.server.running) {
      return reply.text("Autopilot is not running");
    } else {
      reply.text("Stopping autopilot...").then(() => {
        this.notifyOnStop = true;
        return this.server.stop();
      }, this.defaultErrorHandler).then(noop, this.defaultErrorHandler);
    }
  }

  pushTextToUser(user, text) {
    return this.chatbot.pushToUser(user, {
      type: "text",
      text
    });
  }
}
