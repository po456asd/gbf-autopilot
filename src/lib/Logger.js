import winston from "winston";
import moment from "moment";
import fs from "fs";

function getFilename(config, level) {
  const timestamp = moment().format("YYYYMMDD");
  const directory = config.Log.LogToFileDirectory || "log";
  return directory + "/" + timestamp + (level ? "_" + level : "") + ".log";
}

function ensureLogFile(config, level) {
  const filename = getFilename(config, level);
  if (!fs.existsSync(filename)) {
    fs.closeSync(fs.openSync(filename, "w"));
  }
  return filename;
}

function createFileTransport(config, level) {
  return new (winston.transports.File)({
    name: (level || "default") + "-file",
    filename: ensureLogFile(config, level),
    timestamp: true,
    level: level || "debug"
  });
}

export default function(config) {
  const level = config.Log.Level || "debug";
  const transports = [];
  
  if (config.Log.LogToOutput) {
    transports.push(new (winston.transports.Console)({
      timestamp: true,
    }));
  }

  if (config.Log.LogToFile) {
    if (level != "error") {
      transports.push(createFileTransport(config));
    }
    transports.push(createFileTransport(config, "error"));
  }

  const logger = new (winston.Logger)({level, transports});
  return logger;
}
