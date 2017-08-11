import BaseExtension from "./BaseExtension";

export default class RaidQueue extends BaseExtension {
  constructor() {
    super();
    this.queue = [];
    this.callbacks = [];
  }

  onSetup(server) {
    server.app.post("/raid", (req, res) => {
      console.log("New raid: " + req.body);
      this.push(req.body);
      res.end();
    });
  }

  push(code) {
    if (this.callbacks.length > 0) {
      const callback = this.callbacks.shift();
      callback(code);
    } else {
      this.queue.push(code);
    }
  }

  pop() {
    return new Promise((resolve) => {
      if (this.queue.length > 0) {
        resolve(this.queue.pop());
      } else {
        this.callbacks.push(resolve);
      }
    });
  }
}
