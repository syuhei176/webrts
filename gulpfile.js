var gulp         = require('gulp');
var connect      = require('gulp-connect');
var mocha        = require('gulp-mocha');
var plumber      = require('gulp-plumber');
var browserify   = require('browserify');
var source       = require('vinyl-source-stream');
var buffer       = require('vinyl-buffer');

gulp.task('serve', function() {
  return connect.server({
    root: 'dist',
    port : 3000,
    livereload: true
  });
});

gulp.task("move-html", function(){
  return gulp.src(["./src/*.html"])
    .pipe(plumber())
    .pipe(gulp.dest("dist"));
});

gulp.task('move-img',function(){
  return gulp.src(['./graphics/**/*.svg'])
        .pipe( gulp.dest('dist/images') );
});

gulp.task('move-css',function(){
  return gulp.src(['./css/**/*.css'])
        .pipe( gulp.dest('dist/css') );
});

gulp.task('script', function() {
	browserify({
		entries: ['./src/main.js'],
    debug: true
	})
	.bundle()
  .on('error', function(err){   //ここからエラーだった時の記述
      console.log(err);
  })
  .pipe(source('main.js'))
	.pipe(buffer())
// .pipe(uglify())
	.pipe(gulp.dest("./dist/"))
});

gulp.task('watch',function(){
  gulp.watch(["src/**/*.js"],["script"]);
  gulp.watch(["graphics/**/*.svg"],["move-img"]);
  gulp.watch(["src/**/*.html"],["move-html"]);
  gulp.watch(["css/**/*.css"],["move-css"]);
});

var buildTasks = ['script', 'move-img', 'move-html', 'move-css'];
gulp.task('build', buildTasks);
gulp.task('default', buildTasks.concat(['serve', 'watch']));
