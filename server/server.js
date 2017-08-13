const fs = require("fs");
const resolve = require("path").resolve;
const ini = require("ini");
const Server = require("./dist/server").default;

const readConfig = () => {
  const content = fs.readFileSync(resolve(__dirname, "./config.ini"), "utf-8");
  const config = ini.parse(content);
  return config;
};

const readScenario = (scenarioName) => {
  const modulePath = "./scenarios/" + scenarioName;
  const resolved = require.resolve(modulePath);
  // make sure to invalidate cached scenario
  if (require.cache[resolved]) {
    delete require.cache[resolved];
  }
  const scenario = require(modulePath);
  return scenario;
};

new Server(readConfig(), __dirname, () => {
  return new Promise((resolve, reject) => {
    try {
      const config = readConfig();
      const scenario = readScenario(config.Server.Scenario);
      resolve({config, scenario});
    } catch (err) {
      reject(err);
    }
  });
}).listen();
