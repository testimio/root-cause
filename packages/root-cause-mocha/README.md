# Testim Root Cause mocha integration


For more information visit https://www.npmjs.com/package/@testim/root-cause

## Prerequisites

Supported mocha versions are: `8.x` and `7.2`. while older versions will probably work, they are being tested.    
We assume you already have tests written with puppeteer/playwright and the browser tab you are using is exposed globally as `global.page`.


## Integration

Install the package:
```
# Using yarn
yarn add @testim/root-cause-mocha -D
# Using npm
npm install @testim/root-cause-mocha -D
```

### Mocha 8
You need to load our [Root Hook](https://mochajs.org/#root-hook-plugins), and to use our reporter.
Our reporter wraps the default reporter.  
Minimal Example:
```
mocha --require @testim/root-cause-mocha/rootHooks --reporter @testim/root-cause-mocha/reporter
```

#### Configuring the reporter
By default, the reporter will be `spec` reporter.  
You may use `--reporter-options actualReporter=REPORTERNAMEORPATH` to use different reporter, as you would with `--reporter`.  
Example:
```
mocha --require @testim/root-cause-mocha/rootHooks --reporter @testim/root-cause-mocha/reporter --reporter-options actualReporter=json
```

### Mocha 7

For mocha 7, we will use the --file option instead of Root Hook. 
Minimal Example:
```
mocha --file @testim/root-cause-mocha/pre-mocha8 --reporter @testim/root-cause-mocha/reporter
```

#### Configuring the reporter
Same as Mocha 8

### Using mocha config file

You may apply all these cli flags using [mocha config file](https://mochajs.org/#configuring-mocha-nodejs).  

Minimal example:
```json
// .mocharc.json
{
    "require": "@testim/root-cause-mocha/rootHooks",
    "reporter": "@testim/root-cause-mocha/reporter",
    "reporter-option": {
        "actualReporter": "NYAN"
    }
}
```

## If you've encountered any problem, please open an issue in:
https://github.com/testimio/root-cause/issues
