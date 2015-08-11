'use strict';

// -----------------------------------------------------------------------------
// Dependencies
// -----------------------------------------------------------------------------

var gulp = require('gulp'),
	gutil = require('gulp-util'),
	gulpif = require('gulp-if'),
	notifier = require('node-notifier'),
	sass = require('gulp-sass'),
	minifyCss = require('gulp-minify-css'),
	sourcemaps = require('gulp-sourcemaps'),
	autoprefixer = require('gulp-autoprefixer'),
	plumber = require('gulp-plumber'),
	uglify = require('gulp-uglify'),
	autopolyfiller = require('gulp-autopolyfiller'),
	changed = require('gulp-changed'),
	rename = require('gulp-rename'),
	imagemin = require('gulp-imagemin'),
	pngquant = require('imagemin-pngquant'),
	livereload = require('gulp-livereload'),
	path = require('path'),
	sizereport = require('gulp-sizereport'),
	zip = require('gulp-zip'),
	dateFormat = require('dateformat'),
	del = require('del');

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

var sassInput = 'src/scss/**/*.scss',
sassOutput = 'css',
sassOptions = { outputStyle: 'expanded' };

var jsInput = 'src/js/*.js',
jsOutput = 'js';

var imgInput = 'img/**/*.{jpeg,jpg,png,gif,svg}',
imgOutput = 'img';

var createSourceMap = false;

var sizeOptions = { gzip: true };

var backupFiles = ['**', '!node_modules/**'],
	backupDest = '../dist',
	backupName = '_PinterestEnhnced.zip';

var production = false;

// -----------------------------------------------------------------------------
// Util
// -----------------------------------------------------------------------------

// Don't break watch on error

var onError = function (err) {
	gutil.log('*********************************************');
	gutil.log ( gutil.colors.bgRed.white('File: ', path.basename(err.file)) );
	gutil.log ( gutil.colors.bgRed.white('Line: ', err.lineNumber || err.line ) );
	gutil.log ( gutil.colors.red('Line: ', err.message) );
	gutil.log('*********************************************');
	notifier.notify({
		'title': err.name,
		'message': path.basename(err.file),
		'sound': true
	})
	this.emit('end');
};

var onChange = function(file) {
	gutil.log ( gutil.colors.green('Processing ', path.basename(file.path)) );
	livereload.changed(file)
};

gulp.task('set-production', function() {
	production = true;
});

// -----------------------------------------------------------------------------
// CSS Tasks
// -----------------------------------------------------------------------------

gulp.task('sass', function () {
	return gulp
	.src(sassInput)
	.pipe(plumber({errorHandler: onError}))
	.pipe(gulpif( createSourceMap && !production, sourcemaps.init() ) )
	.pipe(sass(sassOptions).on('error', sass.logError))
	.pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
	.pipe(gulpif( production, minifyCss({compatibility: 'ie8'}) ))
	.pipe(gulpif( createSourceMap && !production, sourcemaps.write('.') ) )
	.pipe(gulpif( production, sizereport(sizeOptions) ))
	.pipe(gulp.dest(sassOutput));
});

// -----------------------------------------------------------------------------
// JS Tasks
// -----------------------------------------------------------------------------

gulp.task('script', function () {
	return gulp
	.src(jsInput)
	.pipe(plumber({errorHandler: onError}))
	.pipe( changed(jsOutput) )
	.pipe(gulpif( createSourceMap && !production, sourcemaps.init() ) )
	.pipe(gulpif( production, uglify() ))
	// .pipe(rename({ suffix: '.min' }))
	.pipe(gulpif( createSourceMap && !production, sourcemaps.write('.') ) )
	.pipe(gulpif( production, sizereport(sizeOptions) ))
	.pipe(gulp.dest(jsOutput));
});

gulp.task('jsPolyfill', function(){
	return gulp
	.src(jsInput)
	.pipe(autopolyfiller('/polyfills.js'));
})

// -----------------------------------------------------------------------------
// IMAGES Tasks
// -----------------------------------------------------------------------------

gulp.task('img', function () {
	return gulp.src(imgInput)
	.pipe(imagemin({
		progressive: true,
		svgoPlugins: [{removeViewBox: false}],
		use: [pngquant()]
	}))
	.pipe(gulpif( production, sizereport(sizeOptions) ))
	.pipe(gulp.dest(imgOutput));
});

gulp.task('clean', function() {
	del(sassOutput + '/*.map');
	del(jsOutput + '/*.map');
})

// -----------------------------------------------------------------------------
// Backup
// -----------------------------------------------------------------------------

gulp.task('backup', function(){
	var now = new Date();
	var date = dateFormat(now, "yyyymmdd");
	console.log(date);
	return gulp.src(backupFiles)
		.pipe(zip(date + backupName))
		.pipe(gulp.dest(backupDest));
})

// -----------------------------------------------------------------------------
// Compile
// -----------------------------------------------------------------------------

gulp.task('default', ['set-production', 'clean', 'sass', 'script', 'img']);

// -----------------------------------------------------------------------------
// Watcher
// -----------------------------------------------------------------------------

gulp.task('watch', function() {
	livereload.listen();
	gulp.watch(sassInput, ['sass'])
	.on('change', onChange);
	gulp.watch(jsInput, ['script'])
	.on('change',onChange);
});