import {actions} from "./contentscript/actions";

chrome.runtime.sendMessage("LOADED", (resp) => {
  console.log(resp);
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  var rejected = false;
  const {action, payload, timeout} = request;
  const handler = actions[action];
  const respond = (result) => {
    sendResponse(result);
  };
  const retry = (callback) => {
    if (!rejected) {
      setTimeout(callback, 500);
    } else {
      // respond with null result anyway
      respond();
    }
  };

  var result;
  if (!handler) {
    result = actions.error(action);
  } else {
    result = handler(payload, respond, retry);
  }

  if (result !== undefined) {
    respond(result);
  } else {
    setTimeout(() => {
      rejected = true;
    }, timeout);
    return true;
  }
});
