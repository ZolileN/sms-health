const gulp = require('gulp'); // eslint-disable-line
const nodemon = require('gulp-nodemon'); // eslint-disable-line

gulp.task('default', () => {
  nodemon({
    script: 'server.js',
    ext: 'js',
  });
});
