Package.describe({
  name: 'simple:dev-error-overlay',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2');

  api.use([
    'ecmascript',
    'http',
    'reactive-var',
    'tracker',
    'less',
    'meteor'
  ]);

  api.addFiles([
    'dev-error-overlay.js',
    'dev-error-overlay.less'
  ], 'client');
});
