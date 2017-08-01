import shortid from "shortid";

export default class ViramateApi {
  constructor(host) {
    this.host = host;
    this.pending = {};
    window.addEventListener("message", ::this.onMessage, false);
  }

  generateId() {
    return shortid.generate();
  }

  sendApiRequest(request, id) {
    id = id || this.generateId();
    return new Promise((resolve, reject) => {
      request.id = id;
      this.pending[request.id] = {resolve, reject};
      this.host.contentWindow.postMessage(request, "*");
    });
  }

  onMessage(evt) {
    if (evt.data.type !== "result") return;
    if (!evt.data.id) return;
    const promise = this.pending[evt.data.id];
    if (!promise) return;

    if (evt.data.result && evt.data.result.error) {
      promise.reject(evt.data.result);     
    } else {
      promise.resolve(evt.data.result);
    }

    delete this.pending[evt.data.id];
  }
}
