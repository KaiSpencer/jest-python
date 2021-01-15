const chalk = require('chalk');
const throat = require('throat');
import { PytestOutput, Test } from '../types/pytest';
import {
  FormattedTestResult,
  FormattedAssertionResult,
  AssertionResult,
  TestResult,
} from '../types/jest';
import defaultDiff from 'jest-diff';
import { TestRunnerOptions } from 'jest-runner';
import { TestWatcher } from 'jest';
const importFresh = require('import-fresh');
require('dotenv').config();
import { exec, shell } from '@tunnckocore/execa';
import { unlink } from 'fs';

interface TitleParts {
  fileName: string;
  testClass: string;
  testName: string;
}

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
    options: TestRunnerOptions
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
          )
            .then((result) => onResult(test, result))
            .catch((err) => {});
        })
      )
    );
  }

  async _runTest(testPath, projectConfig, resolver) {
    return new Promise(async (resolve, reject) => {
      try {
        const extraConfig = [];
        /**
         * When a filter is applied by jest-watcher it is passed in _globalConfig.
         * Check to see if there is a test name pattern
         */
        if (this._globalConfig.testNamePattern) {
          let pattern: string = this._globalConfig.testNamePattern;
          // If select option remove leading ^ and trailing $
          if (pattern.charAt(0) === '^') {
            pattern = pattern.substring(1, pattern.length - 1);
          }
          extraConfig.push(`-k ${pattern}`);
        }
        if (process.env.VIRTUALENV) {
          await shell([
            `export PIPENV_PIPFILE=${process.env.VIRTUALENV}`,
            `pipenv run python3 -m pytest ${testPath} --json-report --json-report-indent=2 --json-report-file=${testPath}.json ${extraConfig}`,
          ]);
        } else {
          await exec(
            `py.test ${testPath} --json-report --json-report-indent=2 --json-report-file=${testPath}.json ${extraConfig}`
          );
        }
      } catch (error) {}

      const testOutput: PytestOutput = importFresh(`${testPath}.json`);
      if (testOutput.tests.length === 0) {
        reject();
      }
      await unlink(`${testPath}.json`, () => {});
      const end = +new Date();

      // Output print() statements
      testOutput.tests.map((x) =>
        x.call.stdout ? console.log(x.call.stdout) : ''
      );

      const assertionResults: AssertionResult[] = testOutput.tests.map((test) =>
        toTest(test, testPath)
      );

      const testResult: TestResult = {
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
          uncheckedKeys: [''],
        },
        sourceMaps: {},
        testExecError: null,
        testFilePath: testPath,
        testResults: assertionResults,
        leaks: false,
        numTodoTests: 0,
        openHandles: [],
        displayName: { name: 'display name', color: 'cyanBright' },
      };
      resolve(testResult);
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

const toTest = (test: Test, testPath: string): AssertionResult => {
  const titleParts = (): TitleParts => {
    /**
     * Parse test output title into fileName, testClass and testName
     *
     * @returns TitleParts object
     *
     */
    const splitParts = test.nodeid.split('::');
    return {
      fileName: splitParts[0],
      testClass: splitParts[1],
      testName: splitParts[2],
    };
  };

  return {
    ancestorTitles: [titleParts().testClass],
    duration: test.setup.duration + test.call.duration + test.teardown.duration,
    failureMessages: test.outcome === 'failed' ? [test.call.crash.message] : [],
    numPassingAsserts: test.outcome === 'passed' ? 1 : 0,
    status: test.outcome as 'failed' | 'passed',
    title: titleParts().testName,
    fullName: titleParts().testName,
    location: null,
  };
};

module.exports = TestRunner;
