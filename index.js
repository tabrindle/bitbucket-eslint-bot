const fetch = require('node-fetch');
const path = require('path');

const eslintDocsBaseUrl = 'https://github.com/eslint/eslint/blob/master/docs/rules';

const encodeAuthorization = ({ user, password }) => {
  return `Basic ${new Buffer(`${user}:${password}`, 'binary').toString('base64')}=`;
};

const requiredParams = (params = {}) => {
  const missing = Object.keys(params)
    .filter(filterKey => params[filterKey] === undefined) // eslint-disable-line no-undefined
    .reduce((acc, reduceKey) => `${acc} ${reduceKey}`, '');
  console.log(missing);
  if (missing) {
    throw new TypeError(`The following required parameters are missing:${missing}`);
  } else {
    return true;
  }
};

const commentTopLevelFn = function(lintResults, url, bitbucketUrl, options) {
  const errors = lintResults.reduce((sum, file) => sum + file.errorCount, 0);
  const errorPlural = errors === 1 ? 'error' : 'errors';

  if (options.debug) {
    console.log('POST to: ', url);
    console.log(`[eslint] This PR contains ${errors} lint ${errorPlural}`);
    return;
  }

  return fetch(url, {
    method: 'POST',
    body: JSON.stringify({
      text: `[eslint] This PR contains ${errors} lint ${errorPlural}`,
    }),
    credentials: 'include',
    headers: {
      Authorization: encodeAuthorization(options),
      'Content-Type': 'application/json',
    },
  })
    .then(r => {
      if (r.ok) return r.json();
    })
    .then(response => {
      if(options.createTask)
        return fetch(`${bitbucketUrl}/rest/api/1.0/tasks`, {
          method: 'POST',
          body: JSON.stringify({
            text: `fix ${errors} lint ${errorPlural}`,
            anchor: {
              id: response.id,
              type: 'COMMENT',
            },
          }),
          credentials: 'include',
          headers: {
            Authorization: encodeAuthorization(options),
            'Content-Type': 'application/json',
          },
        }).then(r => {
          if (r.ok) return r.json();
        });
    })
    .catch(console.log);
};

const commentFileLevelFn = function(lintResults, url, options) {
  return lintResults.map(file => {
    if (file.messages.length) {
      return file.messages
        .filter(message => {
          if (!options.warnings && message.severity === 1) return false;
        })
        .map(message => {
          if (options.debug) {
            console.log('POST to: ', url);
            console.log(
              `[eslint] ${message.message} - ([${message.ruleId}](${eslintDocsBaseUrl}/${
                message.ruleId
              }.md))`,
            );
            console.log({
              line: message.line,
              lineType: 'ADDED',
              fileType: 'TO',
              path: file.filePath.split(process.cwd())[1],
            });
            return;
          }

          fetch(url, {
            method: 'POST',
            body: JSON.stringify({
              text: `[eslint] ${message.message} - ([${message.ruleId}](${eslintDocsBaseUrl}/${
                message.ruleId
              }.md))`,
              anchor: {
                line: message.line,
                lineType: 'ADDED',
                fileType: 'TO',
                path: file.filePath.split(process.cwd())[1],
              },
            }),
            credentials: 'include',
            headers: {
              Authorization: encodeAuthorization(options),
              'Content-Type': 'application/json',
            },
          }).catch(console.log);
        });
    }
  });
};

module.exports.run = function(
  {
    bitbucketUrl = process.env.BITBUCKET_URL,
    commentFileLevel = true,
    commentTopLevel = true,
    createTask = true,
    debug = false,
    warnings = true,
    lintResultsPath = process.env.LINT_RESULTS_PATH,
    jobName = process.env.JOB_NAME,
    password = process.env.BITBUCKET_PASSWORD,
    project = process.env.BITBUCKET_PROJECT,
    pullRequestID = process.env.PULL_REQUEST_ID,
    repository = process.env.BITBUCKET_REPOSITORY,
    user = process.env.BITBUCKET_USER,
  } = {}
) {
  if (jobName) {
    repository = repository || jobName.split('/')[0];
    if (!/PR-(\d*)/.test(jobName)) {
      console.log('Job is not a PR, and there is no supplied pullRequestID');
      return;
    }
    pullRequestID = pullRequestID || jobName.split('/')[1].match(/PR-(\d*)/)[1];
  }

  try {
    requiredParams({
      bitbucketUrl,
      lintResultsPath,
      password,
      project,
      pullRequestID,
      repository,
      user,
    });

    const lintResults = require(path.resolve(process.cwd(), lintResultsPath));
    const url = `${bitbucketUrl}/rest/api/1.0/projects/${project}/repos/${repository}/pull-requests/${pullRequestID}/comments`;

    if (lintResults && lintResults.length) {
      if (commentTopLevel) {
        commentTopLevelFn(lintResults, url, bitbucketUrl, { debug, user, password, createTask });
      }
      if (commentFileLevel) {
        commentFileLevelFn(lintResults, url, { debug, user, password, warnings });
      }
    }
  } catch (err) {
    throw err;
  }
};
