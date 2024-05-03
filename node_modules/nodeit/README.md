# Nodeit
![Node.js CI](https://github.com/jcraftsman/nodeit/workflows/Node.js%20CI/badge.svg?branch=master)

## Synopsis

A simple tool that wraps functions from js files and export them as a node module.

## Install

All you need is to add nodeit to your devDependencies in `package.json` file.
you can use your package manager to do so:

```bash
npm install --save-dev nodeit
```

or

```bash
yarn add --dev nodeit
```

## How it works

Supposing, you have a file `src/Calculator.js` that contains the following code:

```js
function sum (a, b) {
    return a+b;
}
```

```js
const calculator = require('nodeit')
    .compile('src/Calculator');

describe('Calculator', () => {
    it('should return 4 as sum(1,3)',()=>{
        expect(calculator.sum(2,2)).toEqual(4);
    })``
});
```

## Inject dependencies

If the js you want to node has some dependencies, you can inject them with 3 methods:

#### External dependencies
  ```js
  const calculator = require('nodeit')
      .include("_", "lodash")
      .compile('src/Calculator');
```

#### Static dependencies
  ```js
  const calculator = require('nodeit')
      .dependsOnStatic("StaticClass", "staticMethodName")
      .compile('src/Calculator');
```

#### Custom dependencies
  ```js
  const calculator = require('nodeit')
      .dependsOn(dependency, "dependencyName")
      .compile('src/Calculator');
```