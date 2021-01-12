# jest-python

A jest runner for executing python tests.

![expo runner](/jest-python-2.gif?raw=true)

- [Setup](#setup)  
  &nbsp;&nbsp;- [Install](#install)  
  &nbsp;&nbsp;- [Requirements](#install)
- [Run](#run)  
  &nbsp;&nbsp;- [Running tests](#run-jest)  
  &nbsp;&nbsp;- [Running with pipenv](#run-with-pipenv)
- [Demonstration config](#demonstration-config)

## Setup

### Install

Install with yarn or npm

```
yarn add --dev jest-python
npm install --save-dev jest-python
```

### Requirements

#### Python dependencies

Install via pip/pip3

```
python3
pytest
pytest-json-report
```

#### Node dependencies

Install via yarn (or npm)

```
yarn add --dev jest
npm install --save-dev jest
```

## Add jest-python as the jest runner

In your `package.json`

```json
"jest": {
    "runner": "jest-python",
    "testMatch": [
      "**/test_*.py"
    ],
    "moduleFileExtensions": [
      "py"
    ]
  }
```

## Run

### Run Jest

```bash
yarn jest
```

### Run with pipenv

You can run tests in a pipenv shell.

In the project root create a `.env` file.

Add a variable `VIRTUALENV` assigned to the absolute path to the pipfile you wish to source.

```
VIRTUALENV=/Users/kai/projects/test-jest/Pipfile
```

### Demonstration config

#### Extra dependencies

jest-watch-typeahead

```
yarn add --dev jest-watch-typeahead
```

#### Config used

````json
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
  }```
````
