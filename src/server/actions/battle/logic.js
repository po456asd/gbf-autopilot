export default function(callback) {
  return new Promise((resolve, reject) => {
    this.sendAction("battle.status").then((status) => {
      callback.call(this, status, resolve, reject);
    }, reject);
  });
}
