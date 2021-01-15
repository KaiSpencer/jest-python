const chalk = require('chalk');
const throat = require('throat');
import { PytestOutput, PytestTest } from '../types/pytest';
import {
  FormattedTestResult,
  FormattedAssertionResult,
  AssertionResult,
  TestResult,
} from '../types/jest';
import defaultDiff from 'jest-diff';
import { TestRunnerOptions, Test } from 'jest-runner';
import { TestWatcher } from 'jest';
const importFresh = require('import-fresh');
require('dotenv').config();
import { exec, shell } from '@tunnckocore/execa';
import { unlink } from 'fs';
import type { Config } from '@jest/types';

interface TitleParts {
  fileName: string;
  testClass: string;
  testName: string;
}

class TestRunner {
  _globalConfig: Config.GlobalConfig;
  constructor(globalConfig) {
    this._globalConfig = globalConfig;
  }

  async runTests(
    tests: Test[],
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
      const pytestRun = `python3 -m pytest ${testPath} --json-report --json-report-indent=2 --json-report-file=${testPath}.json`;
      const pipenvRun = 'pipenv run';
      const exportPipfile = `export PIPENV_PIPFILE=${process.env.VIRTUALENV}`;
      /**
       * When a filter is applied by jest-watcher it is passed in _globalConfig.
       * Check to see if there is a test name pattern
       */
      let pytestNamePattern = '';
      if (this._globalConfig.testNamePattern) {
        let pattern: string = this._globalConfig.testNamePattern;
        // If select option remove leading ^ and trailing $
        if (pattern.charAt(0) === '^') {
          pattern = pattern.substring(1, pattern.length - 1);
        }
        pytestNamePattern = `-k ${pattern} `;
      }
      try {
        /**
         * Check if pipenv path given
         */
        if (process.env.VIRTUALENV) {
          await shell([
            exportPipfile,
            `${pipenvRun} ${pytestRun}`,
            pytestNamePattern,
          ]);
        } else {
          await exec(`${pytestRun}${pytestNamePattern}`);
        }
      } catch (error) {
        new CancelRun(error);
      }

      const testOutput: PytestOutput = importFresh(`${testPath}.json`);
      if (testOutput.tests.length === 0) {
        reject();
      }

      removeTestJsonFile(testPath);

      outputPrintStatements(testOutput);
      const end = +new Date();

      // Output print() statements

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
        testFilePath: testPath,
        testResults: assertionResults,
        leaks: false,
        numTodoTests: 0,
        openHandles: [],
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
const TITLE_BULLET = chalk.bold('\u25cf ');

const formatFailureMessage = (testOutput: PytestOutput): string => {
  const failedTests: PytestTest[] = testOutput.tests.filter(
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
      message += defaultDiff(diff[0].substr(16), diff[1].substr(1)) + '\n\n';
    }
    message += failedTests[i].call.crash.message;
    message += failedTests[i].call.longrepr;
  }
  return message;
};

const toTest = (test: PytestTest, testPath: string): AssertionResult => {
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
  const failureMessage = () => {
    if (test.outcome === 'failed') {
      return ['\n', test.call.crash.message];
    }
    return [];
  };
  const totalDuration =
    test.setup.duration + test.call.duration + test.teardown.duration;
  return {
    ancestorTitles: [titleParts().testClass],
    duration: totalDuration,
    failureMessages: failureMessage(),
    numPassingAsserts: test.outcome === 'passed' ? 1 : 0,
    status: test.outcome,
    title: titleParts().testName,
    fullName: titleParts().testName,
    location: null,
  };
};

const removeTestJsonFile = async (testPath: string) => {
  /**
   * Remove test output json file
   */
  await unlink(`${testPath}.json`, () => {});
};

const outputPrintStatements = (testOutput: PytestOutput) => {
  /**
   * Outputs Python print statements to console
   *
   * @param testOutput @type PytestOutput
   */
  testOutput.tests.map((x) =>
    x.call.stdout ? console.log(x.call.stdout) : ''
  );
};

module.exports = TestRunner;
