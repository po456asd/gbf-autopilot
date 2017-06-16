import packer from "~/lib/messaging/packer";

export default {
  "location": function() {
    return packer("location", window.location);
  },
  "location.change": function(hash) {
    window.location.hash = hash;
    return packer("location.change", "OK");
  }
};
