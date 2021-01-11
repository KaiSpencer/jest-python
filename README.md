# jest-python

Jest test runner for python.

## Usage

### Install

```
yarn add jest-python
```

### Requirements

Install via pip3

```
python3
pytest
pytest-json-report
```

Install via yarn (or npm)

```
jest

Optional:
jest-watch-typeahead
```

## Add your runner to Jest config

Once you have your Jest runner you can add it to your Jest config.

In your `package.json`

```json
"jest": {
    "runner": "jest-python",
    "watchPlugins": [
      "jest-watch-typeahead/filename",
      "jest-watch-typeahead/testname"
    ],
    "testMatch": [
      "**/test_*.py"
    ],
    "moduleFileExtensions": [
      "py"
    ]
  }
```

### Run Jest

```bash
yarn jest
```

or in watch mode

```
yarn jest --watchAll
```
