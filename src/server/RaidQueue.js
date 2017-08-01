export default class RaidQueue {
  constructor() {
    this.queue = [];
    this.callbacks = [];
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
