/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

const gulp = require('gulp');
const ts = require('gulp-typescript');
const typescript = require('typescript');
const sourcemaps = require('gulp-sourcemaps');
const del = require('del');
const vsce = require('vsce');
const nls = require('vscode-nls-dev');
const filter = require('gulp-filter');
const tsProject = ts.createProject('./tsconfig.json', { typescript });
// If all VS Code langaues are support you can use nls.coreLanguages
const languages = [
	{ folderName: 'jpn', id: 'ja' },
	{ folderName: 'fra', id: 'fr' }
];

const cleanTask = function() {
	return del(['dist/**', 'package.nls.*.json', 'i18n-sample*.vsix']);
}

const addI18nTask = function() {
	return gulp.src(['package.nls.json'])
		.pipe(nls.createAdditionalLanguageFiles(languages, 'i18n'))
		.pipe(gulp.dest('.'));
};

const generateSrcLocBundle = () => {
    // Transpile the TS to JS, and let vscode-nls-dev scan the files for calls to localize.
    return tsProject.src()
        .pipe(sourcemaps.init())
        .pipe(tsProject()).js
        .pipe(nls.createMetaDataFiles())
        .pipe(nls.createAdditionalLanguageFiles(languages, "i18n"))
        .pipe(nls.bundleMetaDataFiles('vscode-i18n-sample.i18n-sample', 'dist'))
        .pipe(nls.bundleLanguageFiles())
        .pipe(filter(['**/nls.bundle.*.json', '**/nls.metadata.header.json', '**/nls.metadata.json']))
        .pipe(gulp.dest('dist'));
};

const vscePublishTask = function() {
	return vsce.publish();
};

const vscePackageTask = function() {
	return vsce.createVSIX();
};
const localizationTask = gulp.series(cleanTask, generateSrcLocBundle, addI18nTask);

const buildTask = gulp.series(localizationTask);

gulp.task('default', buildTask);

gulp.task('clean', cleanTask);

gulp.task('build', buildTask);

gulp.task('localization', localizationTask);

gulp.task('publish', gulp.series(buildTask, vscePublishTask));

gulp.task('package', gulp.series(buildTask, vscePackageTask));