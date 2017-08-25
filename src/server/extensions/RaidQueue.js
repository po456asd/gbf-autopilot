import BaseExtension from "./BaseExtension";

export default class RaidQueue extends BaseExtension {
  constructor() {
    super();
    this.reset();
  }

  reset() {
    this.queue = [];
    this.callbacks = {};
    this.ids = [];
    this.id = 0;
  }

  onSetup(server) {
    server.app.get("/raid/reset", (req, res) => {
      this.reset();
      server.logger.debug("Raid queue reset!");
      res.end("OK");
    });
    server.app.post("/raid", (req, res) => {
      this.push(req.body);
      res.end("OK");
    });
  }

  push(code) {
    if (this.ids.length > 0) {
      var resolved = false;
      while (!resolved && this.ids.length > 0) {
        const id = this.ids.pop();
        const callback = this.callbacks[id];
        delete this.callbacks[id];

        /**
         * We first need to validate if the callback is still valid.
         * Invalidated callback will be rejected, removed, and replaced with the next callback in the queue.
         * Valid callback will be resolved with the code in queue.
         */
        if (callback.validate()) {
          callback.resolve(code);
          resolved = true;
        }
      }

      if (!resolved) {
        this.queue.push(code);
      }
    } else {
      this.queue.push(code);
    }
  }

  pop(validate) {
    return new Promise((resolve, reject) => {
      if (this.queue.length > 0 && validate()) {
        resolve(this.queue.pop());
      } else {
        const id = ++this.id;
        this.callbacks[id] = {
          validate, resolve, reject
        };
        this.ids.push(id);
      }
    });
  }
}
