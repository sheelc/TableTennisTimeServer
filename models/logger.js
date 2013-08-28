exports.log = function() {
  console.log("[" + Date() + "]:");
  console.log.apply(null, arguments);
};
