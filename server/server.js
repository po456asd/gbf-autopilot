const fs = require("fs");
const resolve = require("path").resolve;
const ini = require("ini");
const Server = require("./dist/server").default;

const content = fs.readFileSync(resolve(__dirname, "./config.ini"), "utf-8");
const config = ini.parse(content);
const scenarioName = config.server.scenario;
const scenario = require("./scenarios/" + scenarioName);

new Server(config, scenario).listen();
