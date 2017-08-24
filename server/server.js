const fs = require("fs");
const resolve = require("path").resolve;
const ini = require("ini");
const Server = require("./dist/server").default;

const readConfig = () => {
  const content = fs.readFileSync(resolve(__dirname, "./config.ini"), "utf-8");
  const config = ini.parse(content);
  return config;
};

const resetScenarios = () => {
  const scenariosDir = resolve(__dirname, "./scenarios");
  Object.keys(require.cache).filter((path) => {
    return path.indexOf(scenariosDir) != -1;
  }).forEach((path) => {
    delete require.cache[path];
  });
};

const readScenario = (scenarioName) => {
  resetScenarios();
  const modulePath = "./scenarios/" + scenarioName;
  const scenario = require(modulePath);
  return scenario;
};

new Server(readConfig(), __dirname, () => {
  return new Promise((resolve, reject) => {
    try {
      const config = readConfig();
      const scenario = readScenario(config.Scenario.Name);
      resolve({config, scenario});
    } catch (err) {
      reject(err);
    }
  });
}).listen();
