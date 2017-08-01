export default class WorkerManager {
  constructor(server, socket) {
    this.server = server;
    this.socket = socket;
  }

  stop() {
    this.server.stopSocket(this.socket.id);
    return this;
  }
}
