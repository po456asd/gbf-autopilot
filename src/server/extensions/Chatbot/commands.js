export default {
  "th": function(reply, code) {
    const config = this.getConfig();
    if (!this.server.running) {
      return reply.text("Autopilot is not running");
    }
    if (config.Scenario.Name !== "Leech") {
      return reply.text("Autopilot is not running in Leech mode");
    }
    this.server.extensions.raidQueue.push(code);
    return reply.text("Raid added to the queue");
  },
  "subscribe": function(reply, arg, evt) {
    if (!evt.source.userId) return;
    const userId = evt.source.userId;
    if (this.subscribers.has(userId)) {
      return reply.text("You're already subscribed to the bot.");
    }
    this.subscribers.add(userId);
    return reply.text("You're now subscribed to the bot.");
  },
  "unsubscribe": function(reply, arg, evt) {
    if (!evt.source.userId) return;
    const userId = evt.source.userId;
    if (!this.subscribers.has(userId)) {
      return reply.text("You're not subscribed to the bot.");
    }
    this.subscribers.delete(userId);
    return reply.text("You're now unsubscribed from the bot.");
  },
  "user-id": function(reply, arg, evt) {
    if (!evt.source.userId) return;
    return reply.text("Your user ID is " + evt.source.userId);
  }
};
