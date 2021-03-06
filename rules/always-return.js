function isFunctionWithBlockStatement (node) {
  if (node.type === 'FunctionExpression') {
    return true
  }
  if (node.type === 'ArrowFunctionExpression') {
    return node.body.type === 'BlockStatement'
  }
  return false
}

function isThenCallExpression (node) {
  return (
  node.type === 'CallExpression' &&
  node.callee.type === 'MemberExpression' &&
  node.callee.property.name === 'then'
  )
}

function isCatchCallExpression (node) {
  return (
  node.type === 'CallExpression' &&
  node.callee.type === 'MemberExpression' &&
  node.callee.property.name === 'catch'
  )
}

function isFirstArgument (node) {
  return (
  node.parent &&
  node.parent.arguments &&
  node.parent.arguments[0] === node
  )
}

function isSecondArgument (node) {
  return (
  node.parent &&
  node.parent.arguments &&
  node.parent.arguments[1] === node
  )
}

function isInlineThenFunctionExpression (node) {
  return (
  isFunctionWithBlockStatement(node) &&
  isThenCallExpression(node.parent) &&
  isFirstArgument(node)
  )
}

function isInlineCatchFunctionExpression (node) {
  return (
  isFunctionWithBlockStatement(node) &&
  isCatchCallExpression(node.parent) &&
  isFirstArgument(node)
  )
}

function isInlineThenErrorFunctionExpression (node) {
  return (
  isFunctionWithBlockStatement(node) &&
  isThenCallExpression(node.parent) &&
  isSecondArgument(node)
  )
}

function peek (arr) {
  return arr[arr.length - 1]
}

module.exports = {
  create: function (context) {
    // funcInfoStack is a stack representing the stack of currently executing
    //   functions
    // funcInfoStack[i].branchIDStack is a stack representing the currently
    //   executing branches ("codePathSegment"s) within the given function
    // funcInfoStack[i].branchInfoMap is an object representing information
    //   about all branches within the given function
    // funcInfoStack[i].branchInfoMap[j].good is a boolean representing whether
    //   the given branch explictly `return`s or `throw`s. It starts as `false`
    //   for every branch and is updated to `true` if a `return` or `throw`
    //   statement is found
    // funcInfoStack[i].branchInfoMap[j].loc is a eslint SourceLocation object
    //   for the given branch
    // example:
    //   funcInfoStack = [ { branchIDStack: [ 's1_1' ],
    //       branchInfoMap:
    //        { s1_1:
    //           { good: false,
    //             loc: <loc> } } },
    //     { branchIDStack: ['s2_1', 's2_4'],
    //       branchInfoMap:
    //        { s2_1:
    //           { good: false,
    //             loc: <loc> },
    //          s2_2:
    //           { good: true,
    //             loc: <loc> },
    //          s2_4:
    //           { good: false,
    //             loc: <loc> } } } ]
    var funcInfoStack = []

    function markCurrentBranchAsGood () {
      var funcInfo = peek(funcInfoStack)
      var currentBranchID = peek(funcInfo.branchIDStack)
      if (funcInfo.branchInfoMap[currentBranchID]) {
        funcInfo.branchInfoMap[currentBranchID].good = true
      }
      // else unreachable code
    }

    return {
      ReturnStatement: markCurrentBranchAsGood,
      ThrowStatement: markCurrentBranchAsGood,

      onCodePathSegmentStart: function (segment, node) {
        var funcInfo = peek(funcInfoStack)
        var parentSegment = segment.prevSegments[0] || {}
        var parentGood = (funcInfo.branchInfoMap[parentSegment.id] || {}).good
        var good = parentGood || false
        funcInfo.branchIDStack.push(segment.id)
        funcInfo.branchInfoMap[segment.id] = {good: good, loc: node.loc}
      },

      onCodePathSegmentEnd: function (segment, node) {
        var funcInfo = peek(funcInfoStack)
        funcInfo.branchIDStack.pop()
      },

      onCodePathStart: function (path, node) {
        funcInfoStack.push({
          branchIDStack: [],
          branchInfoMap: {}
        })
      },

      onCodePathEnd: function (path, node) {
        var funcInfo = funcInfoStack.pop()

        if (!(isInlineThenFunctionExpression(node) || isInlineCatchFunctionExpression(node) || isInlineThenErrorFunctionExpression(node))) {
          return
        }

        path.finalSegments.forEach((segment) => {
          var id = segment.id
          var branch = funcInfo.branchInfoMap[id]
          if (!branch.good) {
            // check shortcircuit syntax like `x && x()` and `y || x()``
            // var prevSegments = segment.prevSegments
            // for (var ii = prevSegments.length - 1; ii >= 0; --ii) {
            //   var prevSegment = prevSegments[ii]
            //   if (funcInfo.branchInfoMap[prevSegment.id].good) return
            // }

            var message = isInlineThenFunctionExpression(node) ? 'Each then() should return a value or throw'
              : isInlineCatchFunctionExpression(node) ? 'Each catch() should return a value or throw'
              : 'Each then() error handler should return a value or throw'

            context.report({
              message: message,
              loc: branch.loc
            })
          }
        })
      }
    }
  }
}
