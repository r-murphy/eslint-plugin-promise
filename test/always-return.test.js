'use strict'

var rule = require('../rules/always-return')
var RuleTester = require('eslint').RuleTester
var thenMessage = 'Each then() should return a value or throw'
var catchMessage = 'Each catch() should return a value or throw'
var thenErrorMessage = 'Each then() error handler should return a value or throw'
var parserOptions = { ecmaVersion: 6 }
var ruleTester = new RuleTester()
ruleTester.run('always-return', rule, {
  valid: [
    { code: 'hey.then(x => x)', parserOptions: parserOptions },
    { code: 'hey.then(x => ({}))', parserOptions: parserOptions },
    { code: 'hey.then(x => { return; })', parserOptions: parserOptions },
    { code: 'hey.then(x => { return x * 10 })', parserOptions: parserOptions },
    { code: 'hey.then(function() { return 42; })', parserOptions: parserOptions },
    { code: 'hey.then(function() { return new Promise(); })', parserOptions: parserOptions },
    { code: 'hey.then(function() { return "x"; }).then(doSomethingWicked)' },
    { code: 'hey.then(x => x).then(function() { return "3" })', parserOptions: parserOptions },
    { code: 'hey.then(function() { throw new Error("msg"); })', parserOptions: parserOptions },
    { code: 'hey.then(function(x) { if (!x) { throw new Error("no x"); } return x; })', parserOptions: parserOptions },
    { code: 'hey.then(function(x) { if (x) { return x; } throw new Error("no x"); })', parserOptions: parserOptions },
    { code: 'hey.then(x => { throw new Error("msg"); })', parserOptions: parserOptions },
    { code: 'hey.then(x => { if (!x) { throw new Error("no x"); } return x; })', parserOptions: parserOptions },
    { code: 'hey.then(x => { if (x) { return x; } throw new Error("no x"); })', parserOptions: parserOptions },
    { code: 'hey.then(x => { var f = function() { }; return f; })', parserOptions: parserOptions },
    { code: 'hey.then(x => { if (x) { return x; } else { return x; } })', parserOptions: parserOptions },
    { code: 'hey.then(x => { return x ? 1 : 2 })', parserOptions: parserOptions }, // basic ternary
    { code: 'hey.then(x => { return {y: (x ? 1 : 2)}; })', parserOptions: parserOptions }, // ternay inside literal
    { code: 'hey.then(x => { if (x) { return x ? 1 : 2; } else { return {y: (x ? 1 : 2)}; } })', parserOptions: parserOptions }, // ternaries in branches
    { code: 'hey.then(x => { return x; var y = "unreachable"; })', parserOptions: parserOptions },
    { code: 'hey.then(x => { return x; return "unreachable"; })', parserOptions: parserOptions },
    // { code: 'hey.then(x => { return; }, err=>{ log(err); })', parserOptions: parserOptions },
    { code: 'hey.then(x => { return x && x(); }, err=>{ return log(err) && err; })', parserOptions: parserOptions },
    { code: 'hey.then(x => { return x.y || x(); }, err=>{ return log(err); })', parserOptions: parserOptions },
    { code: 'hey.catch(e => { throw new Error(e.message); })', parserOptions: parserOptions },
    { code: 'hey.catch(e => { return false; })', parserOptions: parserOptions }
  ],

  invalid: [
    {
      code: 'hey.then(x => {})',
      parserOptions: parserOptions,
      errors: [ { message: thenMessage } ]
    },
    {
      code: 'hey.then(function() { })',
      errors: [ { message: thenMessage } ]
    },
    {
      code: 'hey.then(function() { }).then(x)',
      errors: [ { message: thenMessage } ]
    },
    {
      code: 'hey.then(function() { }).then(function() { })',
      errors: [ { message: thenMessage }, { message: thenMessage } ]
    },
    {
      code: 'hey.then(function() { return; }).then(function() { })',
      errors: [ { message: thenMessage } ]
    },
    {
      code: 'hey.then(function() { doSomethingWicked(); })',
      errors: [ { message: thenMessage } ]
    },
    {
      code: 'hey.then(function() { if (x) { return x; } })',
      errors: [ { message: thenMessage } ]
    },
    {
      code: 'hey.then(function() { if (x) { return x; } else { }})',
      errors: [ { message: thenMessage } ]
    },
    {
      code: 'hey.then(function() { if (x) { } else { return x; }})',
      errors: [ { message: thenMessage } ]
    },
    {
      code: 'hey.then(function() { if (x) { return you.then(function() { return x; }); } })',
      errors: [ { message: thenMessage } ]
    },
    {
      code: 'hey.catch(function() { doSomethingWicked(); })',
      errors: [ { message: catchMessage } ]
    },
    {
      code: 'hey.catch(x => {})',
      parserOptions: parserOptions,
      errors: [ { message: catchMessage } ]
    },
    {
      code: 'hey.catch(function() { })',
      errors: [ { message: catchMessage } ]
    },
    {
      code: 'hey.catch(function() { }).catch(x)',
      errors: [ { message: catchMessage } ]
    },
    {
      code: 'hey.catch(function() { }).catch(function() { })',
      errors: [ { message: catchMessage }, { message: catchMessage } ]
    },
    {
      code: 'hey.catch(function() { doSomethingWicked(); })',
      errors: [ { message: catchMessage } ]
    },
    {
      code: 'hey.then(function() { doSomethingWicked(); }, function(error) { doSomethingWicked(); })',
      errors: [ { message: thenMessage }, { message: thenErrorMessage } ]
    }
  ]
})
