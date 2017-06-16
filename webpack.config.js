const resolve = require("path").resolve;

module.exports = {
  devtool: "cheap-module-source-map",
  entry: {
    background: "./src/background.js",
    contentscript: "./src/contentscript.js",
    popup: "./src/popup.js"
  },
  output: {
    filename: "[name].js",
    path: resolve(__dirname, "extension/dist")
  },
  module: {
    rules: [{
      test: /\.js$/, 
      use: "babel-loader",
      include: [
        resolve(__dirname, "src")
      ],
      exclude: [
        resolve(__dirname, "node_modules")
      ]
    }]
  }
};
