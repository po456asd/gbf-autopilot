export default function() {
  const ws = new WebSocket("ws://localhost:35729/livereload");
  ws.onmessage = function(evt) {
    const data = JSON.parse(evt.data);
    if (data.command == "reload") {
      console.log("Reloading extension...");
      chrome.runtime.reload();
    }
  };
}
