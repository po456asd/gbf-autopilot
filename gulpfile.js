const gulp = require("gulp");
const gutil = require("gulp-util");
const babel = require("gulp-babel");
const nodemon = require("gulp-nodemon");
const livereload = require("gulp-livereload");
const sourcemaps = require("gulp-sourcemaps");
const FileCache = require("gulp-file-cache");
const resolve = require("path").resolve;

const webpack = require("webpack");
const webpackConfig = require("./webpack.config");
const webpackCallback = function(cb) {
  var done = false;
  return function(err, stats) {
    if (err) {
      throw new gutil.PluginError("[webpack]", err);
    }

    gutil.log("[webpack]",  stats.toString({
      colors: gutil.colors.supportsColor
    }));

    livereload.reload();

    if (!done) {
      done = true;
      cb();
    }
  };
};

const cache = new FileCache();
const globs = {
  server: [
    "./src/{server,lib}/**/*.js",
    "./src/server.js"
  ],
  extension: "./extension/pages/**/*.html"
};

gulp.task("build:extension", function(cb) {
  webpack(webpackConfig, webpackCallback(cb));
});

gulp.task("build:server", function() {
  return gulp.src(globs.server)
    .pipe(sourcemaps.init())
    .pipe(cache.filter())
    .pipe(babel())
    .pipe(cache.cache())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest("./server/dist"));
});

gulp.task("watch:extension", function(cb) {
  const config = Object.assign({}, webpackConfig, {
    watch: true
  });
  webpack(config, webpackCallback(cb));
});

gulp.task("watch:server", function() {
  gulp.watch(globs.server.src, ["build:server"]);
});

gulp.task("build", ["build:server", "build:extension"]);

gulp.task("watch", ["watch:extension"], function() {
  livereload.listen();
});

gulp.task("serve", ["build:server"], function() {
  nodemon({
    script: "./server/server.js",
    watch: [
      "./src/server/", "./src/lib/",
      "./src/server.js"
    ].map(function(path) {
      return resolve(__dirname, path);
    }),
    tasks: ["build:server"]
  });
});

gulp.task("default", ["build"]);
