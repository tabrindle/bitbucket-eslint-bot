# Bitbucket ESLint Bot

Bot to run on CI server to post eslint errors on Bitbucket PRs

## Config

Most configs can be passed as command line options/env vars

    - bitbucketUrl/BITBUCKET_URL - Base URL of bitbucket to POST to eg https://bitbucket.test.com
    - lintResultsPath/LINT_RESULTS_PATH - Path to JSON eslint output file
    - jobName/JOB_NAME - auto injected Jenkins job name - can extract repository + pullRequestID if setup correctly
    - password/BITBUCKET_PASSWORD - Bitbucket password for user to post comments. Be careful. 
    - project/BITBUCKET_PROJECT - Bitbucket project name eg 'APP'
    - pullRequestID/PULL_REQUEST_ID - Numeric ID of pull request in Bitbucket.
    - repository/BITBUCKET_REPOSITORY - Bitbucket repository name eg 'test-project'
    - user/BITBUCKET_USER - Bitbucket user to post comments eg 'tabrindle'
    - commentFileLevel - Write comments on each file at line of violation. Defaults to true.
    - commentTopLevel - Write a comment on the top level of the PR. Defaults to true
    - warnings - write comments for warnings. Defaults to true.
    - createTask - create a task for top level comment. Defaults to false.
    - debug - Print console statements before POSTs 

## Alternative usage
Can also be used as a js module.

```
require('bitbucket-eslint-bot').run({
  bitbucketUrl: 'https://code.company.com',
  pullRequestID: process.env.BRANCH_NAME,
  commentFileLevel: false,
  createTask: true,
  lintResultsPath: './eslint-results.json',
  password: process.env.GIT_PASSWORD,
  project: 'BTBKT',
  repository: 'client',
  user: process.env.GIT_USERNAME,
  warnings: false,
});

```

## Example

- File level comment
    [eslint] 'iconNames' is never reassigned. Use 'const' instead. - ([prefer-const](https://github.com/eslint/eslint/blob/master/docs/rules/prefer-const.md))

- Top level comment
    [eslint] This PR contains 1 lint error
