var redis = require("redis"), redisClient;
if (process.env.VCAP_SERVICES) {
  var serviceCredentials = JSON.parse(process.env.VCAP_SERVICES)["rediscloud-n/a"][0].credentials;
  redisClient = redis.createClient(serviceCredentials.port, serviceCredentials.hostname);
  redisClient.auth(serviceCredentials.password);
} else {
  redisClient = redis.createClient();
}

module.exports = redisClient;
