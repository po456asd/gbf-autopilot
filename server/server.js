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
  const scenario = require("./scenarios/" + scenarioName);
  return scenario;
};

new Server(readConfig(), () => {
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
