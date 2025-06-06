/*
This file contains the configuration for semantic release, the library we use to tag the correct 
semantic version numbers onto releases. We have two release paths, one on main and one on release branch. 

In the code below we check the env variable RELEASE_TYPE to decide what we should do. As of 
the time of this file semantic release does not support specifying a config file from their CLI, 
so this is the only we can have dynamic configs based on branch. 

To test run this file, first get a github token at https://github.com/settings/tokens
and add it to the GITHUB_TOKEN env variable then specify what kind of release ou want to run (production or alpha) under RELEASE_TYPE

$ export GITHUB_TOKEN=<token>
$ export RELEASE_TYPE=<production or alpha>
$ run yarn run semantic-release -d


*/

const commitAnalyzerSetting = [
  '@semantic-release/commit-analyzer',
  {
    preset: 'angular',
    releaseRules: [
      {
        type: 'feat',
        release: 'minor',
      },
      {
        type: '*',
        release: 'patch',
      },
    ],
    parserOpts: {
      noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES'],
    },
  },
];

// used instead of `commitAnalyzerSetting` for prereleases
const execPatchAnyCommitSetting = [
  '@semantic-release/exec',
  {
    analyzeCommitsCmd: 'echo patch',
  },
];

const releaseReplaceSetting = [
  '@google/semantic-release-replace-plugin',
  {
    replacements: [
      {
        files: ['dist/manifest.json'],
        from: '"version": ".*"',
        // Remove "-alpha" string from the version in the manifest.
        // Chrome only supports numbers and dots in the version number.
        to: `"version": "<%= _.replace(nextRelease.version, /[^0-9.]/g, '') %>"`,
        results: [
          {
            file: 'dist/manifest.json',
            hasChanged: true,
            numMatches: 1,
            numReplacements: 1,
          },
        ],
        countMatches: true,
      },
      {
        files: ['dist/inpage/js/inpage.js'],
        from: 'CORE_EXTENSION_VERSION',
        // Replace CORE_EXTENSION_VERSION string to the next release number in the inpage.js file
        to: `<%= _.replace(nextRelease.version, /[^0-9.]/g, '') %>`,
        results: [
          {
            file: 'dist/inpage/js/inpage.js',
            hasChanged: true,
            numMatches: 2,
            numReplacements: 2,
          },
        ],
        countMatches: true,
      },
    ],
  },
];

const githubSetting = [
  '@semantic-release/github',
  {
    assets: [
      {
        path: 'builds/avalanche-wallet-extension.zip',
        name: 'Avalanche-wallet-extension-${nextRelease.gitTag}.zip',
        label: 'Wallet Extension (${nextRelease.gitTag})',
      },
    ],
    failTitle: false,
    successComment: false,
    failComment: false,
    labels: false,
  },
];

const execZipSetting = [
  '@semantic-release/exec',
  {
    prepareCmd: 'yarn zip',
  },
];

const execSentryReleaseSetting = [
  '@semantic-release/exec',
  {
    prepareCmd: `yarn sentry core-extension@"<%= _.replace(nextRelease.version, /[^0-9.]/g, '') %>"`,
  },
];

let plugins;
if (process.env && process.env.RELEASE_TYPE === 'production') {
  plugins = [
    commitAnalyzerSetting,
    execSentryReleaseSetting,
    releaseReplaceSetting,
    execZipSetting,
    githubSetting,
  ];
} else {
  plugins = [
    execPatchAnyCommitSetting,
    execSentryReleaseSetting,
    releaseReplaceSetting,
    execZipSetting,
    githubSetting,
  ];
}

module.exports = {
  // define a main version release branch even though we are doing all releases from main
  // this branch list gets overwritten in the production release Github Action
  branches: ['release', { name: 'main', prerelease: 'alpha' }],
  plugins,
};
