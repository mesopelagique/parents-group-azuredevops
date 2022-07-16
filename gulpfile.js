const path = require("path");
const gulp = require('gulp');
const clean = require("gulp-clean");
const yargs = require("yargs");
const {exec, execSync} = require('child_process');
const inlinesource = require('gulp-inline-source');

const contentFolder = 'dist';

gulp.task('clean', () => {
    return gulp.src([contentFolder, '*.vsix'], { allowEmpty: true })
        .pipe(clean());
});
gulp.task('copy-sdk', () => {
    return gulp.src('node_modules/vss-web-extension-sdk/lib/VSS.SDK.min.js')
        .pipe(gulp.dest(contentFolder + '/scripts'));
});
gulp.task('copy-img', () => {
    return gulp.src('img/*').pipe(gulp.dest(`${contentFolder}/img`));
});
gulp.task('copy-md', () => {
    return gulp.src([
        '*.md',
        ])
        .pipe(gulp.dest(contentFolder));
});
gulp.task('inline-html', gulp.series(() => {
    return gulp.src("*.html")
        .pipe(inlinesource())
        .pipe(gulp.dest(contentFolder));
}));
gulp.task('copy', gulp.parallel('copy-img', 'copy-md', 'copy-sdk'));
gulp.task('styles', gulp.series(async () => {
    
    execSync("node ./node_modules/sass/sass.js ./parents.scss ./dist/parents.css", {
        stdio: [null, process.stdout, process.stderr]
    });
}));
gulp.task('webpack', gulp.series((done) => {
    const option = yargs.argv.release ? "-p" : "-d";
    execSync(`node ./node_modules/webpack-cli/bin/cli.js ${option}`, {
        stdio: [null, process.stdout, process.stderr]
    });
    done();
}));

gulp.task('build', gulp.series(gulp.parallel('copy', 'styles'), 'inline-html', 'webpack'));

gulp.task('package', gulp.series('clean', 'build', (done) => {
    const overrides = {}
    if (yargs.argv.release) {
        overrides.public = true;
    } else {
        const manifest = require('./vss-extension.json');
        overrides.name = manifest.name + ": Development Edition";
        overrides.id = manifest.id + "-dev";
    }
    const overridesArg = `--override "${JSON.stringify(overrides).replace(/"/g, '\\"')}"`;
    const rootArg = `--root ${contentFolder}`;
    const manifestsArg = `--manifests ../vss-extension.json`;

    execSync(`tfx extension create ${rootArg} ${overridesArg} ${manifestsArg} --rev-version`,
        (err, stdout, stderr) => {
            if (err) {
                console.log(err);
            }

            console.log(stdout);
            console.log(stderr);
            
        });
    done();
}));

gulp.task('default', gulp.series('package'));
