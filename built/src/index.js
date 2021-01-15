"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var chalk = require('chalk');
var throat = require('throat');
var jest_diff_1 = require("jest-diff");
var importFresh = require('import-fresh');
require('dotenv').config();
var execa_1 = require("@tunnckocore/execa");
var fs_1 = require("fs");
var TestRunner = /** @class */ (function () {
    function TestRunner(globalConfig) {
        this._globalConfig = globalConfig;
    }
    TestRunner.prototype.runTests = function (tests, watcher, onStart, onResult, onFailure, options) {
        return __awaiter(this, void 0, void 0, function () {
            var mutex;
            var _this = this;
            return __generator(this, function (_a) {
                mutex = throat(this._globalConfig.maxWorkers);
                return [2 /*return*/, Promise.all(tests.map(function (test) {
                        return mutex(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (watcher.isInterrupted()) {
                                            throw new CancelRun('');
                                        }
                                        return [4 /*yield*/, onStart(test)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/, this._runTest(test.path, test.context.config, test.context.resolver)
                                                .then(function (result) { return onResult(test, result); })
                                                .catch(function (err) { })];
                                }
                            });
                        }); });
                    }))];
            });
        });
    };
    TestRunner.prototype._runTest = function (testPath, projectConfig, resolver) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var extraConfig, pattern, error_1, testOutput, end, assertionResults, testResult;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 5, , 6]);
                                    extraConfig = [];
                                    /**
                                     * When a filter is applied by jest-watcher it is passed in _globalConfig.
                                     * Check to see if there is a test name pattern
                                     */
                                    if (this._globalConfig.testNamePattern) {
                                        pattern = this._globalConfig.testNamePattern;
                                        // If select option remove leading ^ and trailing $
                                        if (pattern.charAt(0) === '^') {
                                            pattern = pattern.substring(1, pattern.length - 1);
                                        }
                                        extraConfig.push("-k " + pattern);
                                    }
                                    if (!process.env.VIRTUALENV) return [3 /*break*/, 2];
                                    return [4 /*yield*/, execa_1.shell([
                                            "export PIPENV_PIPFILE=" + process.env.VIRTUALENV,
                                            "pipenv run python3 -m pytest " + testPath + " --json-report --json-report-indent=2 --json-report-file=" + testPath + ".json " + extraConfig,
                                        ])];
                                case 1:
                                    _a.sent();
                                    return [3 /*break*/, 4];
                                case 2: return [4 /*yield*/, execa_1.exec("py.test " + testPath + " --json-report --json-report-indent=2 --json-report-file=" + testPath + ".json " + extraConfig)];
                                case 3:
                                    _a.sent();
                                    _a.label = 4;
                                case 4: return [3 /*break*/, 6];
                                case 5:
                                    error_1 = _a.sent();
                                    return [3 /*break*/, 6];
                                case 6:
                                    testOutput = importFresh(testPath + ".json");
                                    if (testOutput.tests.length === 0) {
                                        reject();
                                    }
                                    return [4 /*yield*/, fs_1.unlink(testPath + ".json", function () { })];
                                case 7:
                                    _a.sent();
                                    end = +new Date();
                                    // Output print() statements
                                    testOutput.tests.map(function (x) {
                                        return x.call.stdout ? console.log(x.call.stdout) : '';
                                    });
                                    assertionResults = testOutput.tests.map(function (test) {
                                        return toTest(test, testPath);
                                    });
                                    testResult = {
                                        console: null,
                                        failureMessage: testOutput.summary.failed > 0
                                            ? formatFailureMessage(testOutput)
                                            : null,
                                        numFailingTests: testOutput.tests.filter(function (n) { return n.outcome === 'failed'; }).length || 0,
                                        numPassingTests: testOutput.tests.filter(function (n) { return n.outcome === 'passed'; }).length || 0,
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
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    return TestRunner;
}());
var CancelRun = /** @class */ (function (_super) {
    __extends(CancelRun, _super);
    function CancelRun(message) {
        var _this = _super.call(this, message) || this;
        _this.name = 'CancelRun';
        return _this;
    }
    return CancelRun;
}(Error));
var TITLE_INDENT = '  ';
var MESSAGE_INDENT = '    ';
var ANCESTRY_SEPARATOR = ' \u203A ';
var TITLE_BULLET = chalk.bold('\u25cf ');
var formatFailureMessage = function (testOutput) {
    var failedTests = testOutput.tests.filter(function (test) { return test.outcome === 'failed'; });
    var message = '';
    for (var i = 0; i < failedTests.length; i++) {
        message += chalk.bold.red(TITLE_INDENT + TITLE_BULLET + failedTests[i].nodeid + '\n\n');
        if (failedTests[i].call.crash.message.includes('!=')) {
            var failMessage = failedTests[i].call.crash.message;
            var diff = failMessage.split('!=');
            message += jest_diff_1.default(diff[0].substr(16), diff[1]) + '\n\n';
        }
        message += failedTests[i].call.crash.message;
        message += failedTests[i].call.longrepr;
    }
    return message;
};
var toTest = function (test, testPath) {
    var titleParts = function () {
        /**
         * Parse test output title into fileName, testClass and testName
         *
         * @returns TitleParts object
         *
         */
        var splitParts = test.nodeid.split('::');
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
        status: test.outcome,
        title: titleParts().testName,
        fullName: titleParts().testName,
        location: null,
    };
};
module.exports = TestRunner;
