export default function(context, token) {
  var port;
  const actionHandlers = {
    error: (payload, done, fail) => {
      fail("Action not found!");
    },
    poker: (modelName, done) => {
      done(window.Game.view[modelName + "Model"].attributes);  
    }
  };
  const log = (message) => {
    console.log("ext>", message);
  };
  const handleMessage = (evt) => {
    console.log(evt);
    if (evt.data.token !== token) return;
    if (!evt.data.id) return;
    const {id, action, payload} = evt.data;
    const handler = actionHandlers[action] || actionHandlers.error;
    handler(payload, (result) => {
      port.postMessage({
        id, action, token,
        type: "response",
        payload: result,
        success: true
      });
    }, (result) => {
      port.postMessage({
        id, action, token,
        type: "response",
        payload: result,
        success: false
      });
    });
  };
  const setupChannel = (evt) => {
    if (evt.data.token !== token) return;
    port = evt.ports[0];
    port.onmessage = handleMessage;
    port.onmessageerror = ::console.error;
    window.removeEventListener("message", setupChannel, true);
    evt.preventDefault();
    evt.stopImmediatePropagation();
    log("External channel established");
  };
  window.addEventListener("message", setupChannel, true);
}
