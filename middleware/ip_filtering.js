var ip = require("ip");

exports.filterIps = function filterIps(ips) {
  var normalizedIps = [];
  
  for(var i = 0; i < ips.length; i++) {
    var splitIp = ips[i].split("/"),
        network = splitIp[0],
        mask = ip.fromPrefixLen(splitIp[1]);

    normalizedIps.push({network: ip.mask(network, mask), mask: mask});
  }

  function ipIsWhitelisted(ipToCheck) {
    for(var i = 0; i < normalizedIps.length; i++) {
      var normalizedIp = normalizedIps[i];
      if(ip.mask(ipToCheck, normalizedIp.mask) === normalizedIp.network) {
        return true;
      }
    }

    return false;
  }

  return function(req, res, next) {
    var requestIp = (req.header('x-forwarded-for') || "").split(",")[0] || req.connection.remoteAddress;

    if(ipIsWhitelisted(requestIp)) {
      next();
    } else {
      res.status(401).end("Unauthorized");
    }
  }
};

