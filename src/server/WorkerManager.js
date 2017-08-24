export default class WorkerManager {
  constructor(server, socket) {
    this.server = server;
    this.socket = socket;
  }

  stop() {
    return this.server.stopSocket(this.socket.id);
  }
}
