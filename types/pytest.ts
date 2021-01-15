export interface PytestOutput {
  created: number;
  duration: number;
  exitcode: number;
  root: string;
  environment: Environment;
  summary: Summary;
  collectors: Collector[];
  tests: PytestTest[];
}

export interface PytestTest {
  nodeid: string;
  lineno: number;
  outcome: 'passed' | 'failed';
  keywords: string[];
  setup: Setup;
  call: Call;
  teardown: Setup;
}

interface Call {
  duration: number;
  outcome: string;
  crash?: Crash;
  traceback?: Crash[];
  longrepr?: string;
  stdout?: string;
  stderr?: string;
}

interface Crash {
  path: string;
  lineno: number;
  message: string;
}

interface Setup {
  duration: number;
  outcome: string;
}

interface Collector {
  nodeid: string;
  outcome: string;
  result: Result[];
}

interface Result {
  nodeid: string;
  type: string;
  lineno?: number;
}

interface Summary {
  passed: number;
  failed: number;
  total: number;
  collected: number;
}

interface Environment {
  Python: string;
  Platform: string;
  Packages: Packages;
  Plugins: Plugins;
}

interface Plugins {
  'json-report': string;
  'requests-mock': string;
  metadata: string;
}

interface Packages {
  pytest: string;
  py: string;
  pluggy: string;
}
