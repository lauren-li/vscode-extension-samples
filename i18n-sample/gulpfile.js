/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

const gulp = require('gulp');
const path = require('path');
const WebpackStream = require('webpack-stream');
const webpack = require('webpack');
const webpackConfig = require('./webpack.config.js');
const ts = require('gulp-typescript');
const typescript = require('typescript');
const sourcemaps = require('gulp-sourcemaps');
const del = require('del');
const runSequence = require('run-sequence');
const es = require('event-stream');
const vsce = require('vsce');
const nls = require('vscode-nls-dev');

const tsProject = ts.createProject('./tsconfig.json', { typescript });

const inlineMap = true;
const inlineSource = false;
const outDest = 'dist';

// If all VS Code langaues are support you can use nls.coreLanguages
const languages = [{ folderName: 'jpn', id: 'ja' }];

const cleanTask = function() {
	return del(['dist/**', 'package.nls.*.json', 'i18n-sample*.vsix']);
}

const internalCompileTask = function() {
	return doCompile(false);
};

const internalNlsCompileTask = function() {
	return doCompile(true);
};

const addI18nTask = function() {
	return gulp.src(['package.nls.json'])
		.pipe(nls.createAdditionalLanguageFiles(languages, 'i18n'))
		.pipe(gulp.dest('.'));
};

const addI18nTask2 = function() {
	return tsProject.src()
		.pipe(nls.rewriteLocalizeCalls())
		.pipe(nls.createAdditionalLanguageFiles(languages, 'i18n'))
		.pipe(gulp.dest('./dist'));
};

const webpackConfigTask = function() {
	return tsProject.src()
		.pipe(WebpackStream(webpackConfig), webpack)
		.pipe(gulp.dest('./dist'));
};

const buildTask = gulp.series(cleanTask, internalNlsCompileTask);

const doCompile = function (buildNls) {
	var r = tsProject.src()
		// .pipe(sourcemaps.init())
		// .pipe(tsProject()).js
		.pipe(WebpackStream(webpackConfig), webpack)
		.pipe(buildNls ? nls.rewriteLocalizeCalls() : es.through())
		.pipe(buildNls ? nls.createAdditionalLanguageFiles(languages, 'i18n', 'out') : es.through());

	if (inlineMap && inlineSource) {
		r = r.pipe(sourcemaps.write());
	} else {
		r = r.pipe(sourcemaps.write("../dist", {
			// no inlined source
			includeContent: inlineSource,
			// Return relative source map root directories per file.
			sourceRoot: "../src"
		}));
	}

	return r.pipe(gulp.dest(outDest));
}

const vscePublishTask = function() {
	return vsce.publish();
};

const vscePackageTask = function() {
	return vsce.createVSIX();
};

gulp.task('default', buildTask);

gulp.task('clean', cleanTask);

gulp.task('compile', gulp.series(cleanTask, internalCompileTask));

gulp.task('build', buildTask);

gulp.task('publish', gulp.series(buildTask, vscePublishTask));

gulp.task('package', gulp.series(buildTask, vscePackageTask));