Package.describe({
  name: 'simple:dev-error-overlay',
  version: '1.0.1',
  summary: 'Alerts you when you have a build error.',
  git: 'https://github.com/stubailo/meteor-dev-error-overlay',
  documentation: 'README.md',
  debugOnly: true
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
