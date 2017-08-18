import packer from "~/lib/messaging/packer";

export default {
  "location": function() {
    return packer("location", window.location);
  },
  "location.change": function(hash, done) {
    window.location.hash = hash;
    window.setTimeout(() => {
      done("OK");
    }, 1000);
  },
  "location.reload": function(payload, done) {
    window.location.reload();
    window.setTimeout(() => {
      done("OK");
    }, 1000);
  }
};
