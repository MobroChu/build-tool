module.exports = program => {
  const gulp = require("gulp");
  const path = require("path");
  const rimraf = require("rimraf");
  const through2 = require("through2");
  const stripCode = require("gulp-strip-code");
  const merge2 = require("merge2");
  const babel = require("gulp-babel");

  const cwd = process.cwd();
  const libDir = path.join(cwd, "lib");
  const esDir = path.join(cwd, "es");
  const replaceLib = require("./replaceLib");
  const getBabelCommonConfig = require("./getBabelCommonConfig");

  function babelify(js, modules) {
    const babelConfig = getBabelCommonConfig(modules);
    delete babelConfig.cacheDirectory;
    if (modules === false) {
      babelConfig.plugins.push(replaceLib);
    } else {
      babelConfig.plugins.push(
        require.resolve("babel-plugin-add-module-exports")
      );
    }
    let stream = js.pipe(babel(babelConfig)).pipe(
      through2.obj(function(file, encoding, next) {
        this.push(file.clone());
        next();
      })
    );
    if (modules === false) {
      stream = stream.pipe(
        stripCode({
          start_comment: "@remove-on-es-build-begin",
          end_comment: "@remove-on-es-build-end"
        })
      );
    }
    return stream.pipe(gulp.dest(modules === false ? esDir : libDir));
  }

  function compile(modules) {
    rimraf.sync(modules !== false ? libDir : esDir);
    const assets = gulp
      .src(["src/**/*.@(png|svg|css)"])
      .pipe(gulp.dest(modules === false ? esDir : libDir));
    const source = ["src/**/*.js"];
    const result = gulp.src(source);
    const filesStream = babelify(result, modules);
    return merge2([filesStream, assets]);
  }
  
  gulp.task("compile", ["compile-with-es"], () => {
    compile();
  });

  gulp.task("compile-with-es", () => {
    compile(false);
  });
}