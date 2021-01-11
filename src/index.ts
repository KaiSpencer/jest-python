const chalk = require('chalk');
const throat = require('throat');
import { PytestOutput, Test } from '../types/pytest';
const execa = require('execa');
import defaultDiff from 'jest-diff';
const tempy = require('tempy');
const fs = require('fs');
const path = require('path');
import { TestWatcher } from 'jest';
const importFresh = require('import-fresh');

class TestRunner {
  _globalConfig: any;
  constructor(globalConfig) {
    this._globalConfig = globalConfig;
  }

  async runTests(
    tests,
    watcher: TestWatcher,
    onStart,
    onResult,
    onFailure,
    options
  ) {
    const mutex = throat(this._globalConfig.maxWorkers);
    return Promise.all(
      tests.map((test) =>
        mutex(async () => {
          if (watcher.isInterrupted()) {
            throw new CancelRun('');
          }

          await onStart(test);
          return this._runTest(
            test.path,
            test.context.config,
            test.context.resolver
          ).then((result) => onResult(test, result));
        })
      )
    );
  }

  async _runTest(testPath, projectConfig, resolver) {
    return new Promise(async (resolve, reject) => {
      try {
        await execa('py.test', [
          testPath,
          '--json-report',
          '--json-report-indent=2',
          `--json-report-file=${testPath}.json`,
        ]);
      } catch (error) {}

      const testOutput: PytestOutput = importFresh(`${testPath}.json`);
      // console.log('path is ', path.resolve(`${testPath}.json`));

      // console.log(testOutput);

      const end = +new Date();

      resolve({
        console: null,
        failureMessage:
          testOutput.summary.failed > 0
            ? formatFailureMessage(testOutput)
            : null,
        numFailingTests:
          testOutput.tests.filter((n) => n.outcome === 'failed').length || 0,
        numPassingTests:
          testOutput.tests.filter((n) => n.outcome === 'passed').length || 0,
        numPendingTests: 0,
        perfStats: {
          end: end,
          start: end - testOutput.duration,
        },
        skipped: false,
        snapshot: {
          added: 0,
          fileDeleted: false,
          matched: 0,
          unchecked: 0,
          unmatched: 0,
          updated: 0,
        },
        sourceMaps: {},
        testExecError: null,
        testFilePath: testPath,
        testResults: testOutput.tests.map(toTest),
      });
    });
  }
}

class CancelRun extends Error {
  constructor(message) {
    super(message);
    this.name = 'CancelRun';
  }
}

const TITLE_INDENT = '  ';
const MESSAGE_INDENT = '    ';
const ANCESTRY_SEPARATOR = ' \u203A ';
const TITLE_BULLET = chalk.bold('\u25cf ');

const formatFailureMessage = (testOutput: PytestOutput): string => {
  const failedTests: Test[] = testOutput.tests.filter(
    (test) => test.outcome === 'failed'
  );
  let message = '';
  for (let i = 0; i < failedTests.length; i++) {
    message += chalk.bold.red(
      TITLE_INDENT + TITLE_BULLET + failedTests[i].nodeid + '\n\n'
    );

    if (failedTests[i].call.crash.message.includes('!=')) {
      const failMessage = failedTests[i].call.crash.message;
      const diff = failMessage.split('!=');
      message += defaultDiff(diff[0].substr(16), diff[1]) + '\n\n';
    }
    message += failedTests[i].call.crash.message;
    message += failedTests[i].call.longrepr;
  }
  return message;
};

const toTest = (test: Test) => ({
  ancestorTitles: [],
  duration: test.setup.duration + test.call.duration + test.teardown.duration,
  failureMessages: test.outcome === 'failed' ? [test.call.crash.message] : [],
  fullName: test.nodeid,
  numPassingAsserts: test.outcome === 'passed' ? 1 : 0,
  status: test.outcome,
  title: test.nodeid,
});

module.exports = TestRunner;
