(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],2:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],3:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],4:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./support/isBuffer":3,"_process":2,"inherits":1}],5:[function(require,module,exports){
// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// ┌────────────────────────────────────────────────────────────┐ \\
// │ Eve 0.5.0 - JavaScript Events Library                      │ \\
// ├────────────────────────────────────────────────────────────┤ \\
// │ Author Dmitry Baranovskiy (http://dmitry.baranovskiy.com/) │ \\
// └────────────────────────────────────────────────────────────┘ \\

(function (glob) {
    var version = "0.5.0",
        has = "hasOwnProperty",
        separator = /[\.\/]/,
        comaseparator = /\s*,\s*/,
        wildcard = "*",
        fun = function () {},
        numsort = function (a, b) {
            return a - b;
        },
        current_event,
        stop,
        events = {n: {}},
        firstDefined = function () {
            for (var i = 0, ii = this.length; i < ii; i++) {
                if (typeof this[i] != "undefined") {
                    return this[i];
                }
            }
        },
        lastDefined = function () {
            var i = this.length;
            while (--i) {
                if (typeof this[i] != "undefined") {
                    return this[i];
                }
            }
        },
        objtos = Object.prototype.toString,
        Str = String,
        isArray = Array.isArray || function (ar) {
            return ar instanceof Array || objtos.call(ar) == "[object Array]";
        };
    /*\
     * eve
     [ method ]

     * Fires event with given `name`, given scope and other parameters.

     > Arguments

     - name (string) name of the *event*, dot (`.`) or slash (`/`) separated
     - scope (object) context for the event handlers
     - varargs (...) the rest of arguments will be sent to event handlers

     = (object) array of returned values from the listeners. Array has two methods `.firstDefined()` and `.lastDefined()` to get first or last not `undefined` value.
    \*/
        eve = function (name, scope) {
            var e = events,
                oldstop = stop,
                args = Array.prototype.slice.call(arguments, 2),
                listeners = eve.listeners(name),
                z = 0,
                f = false,
                l,
                indexed = [],
                queue = {},
                out = [],
                ce = current_event,
                errors = [];
            out.firstDefined = firstDefined;
            out.lastDefined = lastDefined;
            current_event = name;
            stop = 0;
            for (var i = 0, ii = listeners.length; i < ii; i++) if ("zIndex" in listeners[i]) {
                indexed.push(listeners[i].zIndex);
                if (listeners[i].zIndex < 0) {
                    queue[listeners[i].zIndex] = listeners[i];
                }
            }
            indexed.sort(numsort);
            while (indexed[z] < 0) {
                l = queue[indexed[z++]];
                out.push(l.apply(scope, args));
                if (stop) {
                    stop = oldstop;
                    return out;
                }
            }
            for (i = 0; i < ii; i++) {
                l = listeners[i];
                if ("zIndex" in l) {
                    if (l.zIndex == indexed[z]) {
                        out.push(l.apply(scope, args));
                        if (stop) {
                            break;
                        }
                        do {
                            z++;
                            l = queue[indexed[z]];
                            l && out.push(l.apply(scope, args));
                            if (stop) {
                                break;
                            }
                        } while (l)
                    } else {
                        queue[l.zIndex] = l;
                    }
                } else {
                    out.push(l.apply(scope, args));
                    if (stop) {
                        break;
                    }
                }
            }
            stop = oldstop;
            current_event = ce;
            return out;
        };
        // Undocumented. Debug only.
        eve._events = events;
    /*\
     * eve.listeners
     [ method ]

     * Internal method which gives you array of all event handlers that will be triggered by the given `name`.

     > Arguments

     - name (string) name of the event, dot (`.`) or slash (`/`) separated

     = (array) array of event handlers
    \*/
    eve.listeners = function (name) {
        var names = isArray(name) ? name : name.split(separator),
            e = events,
            item,
            items,
            k,
            i,
            ii,
            j,
            jj,
            nes,
            es = [e],
            out = [];
        for (i = 0, ii = names.length; i < ii; i++) {
            nes = [];
            for (j = 0, jj = es.length; j < jj; j++) {
                e = es[j].n;
                items = [e[names[i]], e[wildcard]];
                k = 2;
                while (k--) {
                    item = items[k];
                    if (item) {
                        nes.push(item);
                        out = out.concat(item.f || []);
                    }
                }
            }
            es = nes;
        }
        return out;
    };
    /*\
     * eve.separator
     [ method ]

     * If for some reasons you don’t like default separators (`.` or `/`) you can specify yours
     * here. Be aware that if you pass a string longer than one character it will be treated as
     * a list of characters.

     - separator (string) new separator. Empty string resets to default: `.` or `/`.
    \*/
    eve.separator = function (sep) {
        if (sep) {
            sep = Str(sep).replace(/(?=[\.\^\]\[\-])/g, "\\");
            sep = "[" + sep + "]";
            separator = new RegExp(sep);
        } else {
            separator = /[\.\/]/;
        }
    };
    /*\
     * eve.on
     [ method ]
     **
     * Binds given event handler with a given name. You can use wildcards “`*`” for the names:
     | eve.on("*.under.*", f);
     | eve("mouse.under.floor"); // triggers f
     * Use @eve to trigger the listener.
     **
     - name (string) name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
     - f (function) event handler function
     **
     - name (array) if you don’t want to use separators, you can use array of strings
     - f (function) event handler function
     **
     = (function) returned function accepts a single numeric parameter that represents z-index of the handler. It is an optional feature and only used when you need to ensure that some subset of handlers will be invoked in a given order, despite of the order of assignment. 
     > Example:
     | eve.on("mouse", eatIt)(2);
     | eve.on("mouse", scream);
     | eve.on("mouse", catchIt)(1);
     * This will ensure that `catchIt` function will be called before `eatIt`.
     *
     * If you want to put your handler before non-indexed handlers, specify a negative value.
     * Note: I assume most of the time you don’t need to worry about z-index, but it’s nice to have this feature “just in case”.
    \*/
    eve.on = function (name, f) {
        if (typeof f != "function") {
            return function () {};
        }
        var names = isArray(name) ? (isArray(name[0]) ? name : [name]) : Str(name).split(comaseparator);
        for (var i = 0, ii = names.length; i < ii; i++) {
            (function (name) {
                var names = isArray(name) ? name : Str(name).split(separator),
                    e = events,
                    exist;
                for (var i = 0, ii = names.length; i < ii; i++) {
                    e = e.n;
                    e = e.hasOwnProperty(names[i]) && e[names[i]] || (e[names[i]] = {n: {}});
                }
                e.f = e.f || [];
                for (i = 0, ii = e.f.length; i < ii; i++) if (e.f[i] == f) {
                    exist = true;
                    break;
                }
                !exist && e.f.push(f);
            }(names[i]));
        }
        return function (zIndex) {
            if (+zIndex == +zIndex) {
                f.zIndex = +zIndex;
            }
        };
    };
    /*\
     * eve.f
     [ method ]
     **
     * Returns function that will fire given event with optional arguments.
     * Arguments that will be passed to the result function will be also
     * concated to the list of final arguments.
     | el.onclick = eve.f("click", 1, 2);
     | eve.on("click", function (a, b, c) {
     |     console.log(a, b, c); // 1, 2, [event object]
     | });
     > Arguments
     - event (string) event name
     - varargs (…) and any other arguments
     = (function) possible event handler function
    \*/
    eve.f = function (event) {
        var attrs = [].slice.call(arguments, 1);
        return function () {
            eve.apply(null, [event, null].concat(attrs).concat([].slice.call(arguments, 0)));
        };
    };
    /*\
     * eve.stop
     [ method ]
     **
     * Is used inside an event handler to stop the event, preventing any subsequent listeners from firing.
    \*/
    eve.stop = function () {
        stop = 1;
    };
    /*\
     * eve.nt
     [ method ]
     **
     * Could be used inside event handler to figure out actual name of the event.
     **
     > Arguments
     **
     - subname (string) #optional subname of the event
     **
     = (string) name of the event, if `subname` is not specified
     * or
     = (boolean) `true`, if current event’s name contains `subname`
    \*/
    eve.nt = function (subname) {
        var cur = isArray(current_event) ? current_event.join(".") : current_event;
        if (subname) {
            return new RegExp("(?:\\.|\\/|^)" + subname + "(?:\\.|\\/|$)").test(cur);
        }
        return cur;
    };
    /*\
     * eve.nts
     [ method ]
     **
     * Could be used inside event handler to figure out actual name of the event.
     **
     **
     = (array) names of the event
    \*/
    eve.nts = function () {
        return isArray(current_event) ? current_event : current_event.split(separator);
    };
    /*\
     * eve.off
     [ method ]
     **
     * Removes given function from the list of event listeners assigned to given name.
     * If no arguments specified all the events will be cleared.
     **
     > Arguments
     **
     - name (string) name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
     - f (function) event handler function
    \*/
    /*\
     * eve.unbind
     [ method ]
     **
     * See @eve.off
    \*/
    eve.off = eve.unbind = function (name, f) {
        if (!name) {
            eve._events = events = {n: {}};
            return;
        }
        var names = isArray(name) ? (isArray(name[0]) ? name : [name]) : Str(name).split(comaseparator);
        if (names.length > 1) {
            for (var i = 0, ii = names.length; i < ii; i++) {
                eve.off(names[i], f);
            }
            return;
        }
        names = isArray(name) ? name : Str(name).split(separator);
        var e,
            key,
            splice,
            i, ii, j, jj,
            cur = [events];
        for (i = 0, ii = names.length; i < ii; i++) {
            for (j = 0; j < cur.length; j += splice.length - 2) {
                splice = [j, 1];
                e = cur[j].n;
                if (names[i] != wildcard) {
                    if (e[names[i]]) {
                        splice.push(e[names[i]]);
                    }
                } else {
                    for (key in e) if (e[has](key)) {
                        splice.push(e[key]);
                    }
                }
                cur.splice.apply(cur, splice);
            }
        }
        for (i = 0, ii = cur.length; i < ii; i++) {
            e = cur[i];
            while (e.n) {
                if (f) {
                    if (e.f) {
                        for (j = 0, jj = e.f.length; j < jj; j++) if (e.f[j] == f) {
                            e.f.splice(j, 1);
                            break;
                        }
                        !e.f.length && delete e.f;
                    }
                    for (key in e.n) if (e.n[has](key) && e.n[key].f) {
                        var funcs = e.n[key].f;
                        for (j = 0, jj = funcs.length; j < jj; j++) if (funcs[j] == f) {
                            funcs.splice(j, 1);
                            break;
                        }
                        !funcs.length && delete e.n[key].f;
                    }
                } else {
                    delete e.f;
                    for (key in e.n) if (e.n[has](key) && e.n[key].f) {
                        delete e.n[key].f;
                    }
                }
                e = e.n;
            }
        }
    };
    /*\
     * eve.once
     [ method ]
     **
     * Binds given event handler with a given name to only run once then unbind itself.
     | eve.once("login", f);
     | eve("login"); // triggers f
     | eve("login"); // no listeners
     * Use @eve to trigger the listener.
     **
     > Arguments
     **
     - name (string) name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
     - f (function) event handler function
     **
     = (function) same return function as @eve.on
    \*/
    eve.once = function (name, f) {
        var f2 = function () {
            eve.off(name, f2);
            return f.apply(this, arguments);
        };
        return eve.on(name, f2);
    };
    /*\
     * eve.version
     [ property (string) ]
     **
     * Current version of the library.
    \*/
    eve.version = version;
    eve.toString = function () {
        return "You are running Eve " + version;
    };
    (typeof module != "undefined" && module.exports) ? (module.exports = eve) : (typeof define === "function" && define.amd ? (define("eve", [], function() { return eve; })) : (glob.eve = eve));
})(this);

},{}],6:[function(require,module,exports){
/*!
 * EventEmitter2
 * https://github.com/hij1nx/EventEmitter2
 *
 * Copyright (c) 2013 hij1nx
 * Licensed under the MIT license.
 */
;!function(undefined) {

  var isArray = Array.isArray ? Array.isArray : function _isArray(obj) {
    return Object.prototype.toString.call(obj) === "[object Array]";
  };
  var defaultMaxListeners = 10;

  function init() {
    this._events = {};
    if (this._conf) {
      configure.call(this, this._conf);
    }
  }

  function configure(conf) {
    if (conf) {

      this._conf = conf;

      conf.delimiter && (this.delimiter = conf.delimiter);
      conf.maxListeners && (this._events.maxListeners = conf.maxListeners);
      conf.wildcard && (this.wildcard = conf.wildcard);
      conf.newListener && (this.newListener = conf.newListener);

      if (this.wildcard) {
        this.listenerTree = {};
      }
    }
  }

  function EventEmitter(conf) {
    this._events = {};
    this.newListener = false;
    configure.call(this, conf);
  }

  //
  // Attention, function return type now is array, always !
  // It has zero elements if no any matches found and one or more
  // elements (leafs) if there are matches
  //
  function searchListenerTree(handlers, type, tree, i) {
    if (!tree) {
      return [];
    }
    var listeners=[], leaf, len, branch, xTree, xxTree, isolatedBranch, endReached,
        typeLength = type.length, currentType = type[i], nextType = type[i+1];
    if (i === typeLength && tree._listeners) {
      //
      // If at the end of the event(s) list and the tree has listeners
      // invoke those listeners.
      //
      if (typeof tree._listeners === 'function') {
        handlers && handlers.push(tree._listeners);
        return [tree];
      } else {
        for (leaf = 0, len = tree._listeners.length; leaf < len; leaf++) {
          handlers && handlers.push(tree._listeners[leaf]);
        }
        return [tree];
      }
    }

    if ((currentType === '*' || currentType === '**') || tree[currentType]) {
      //
      // If the event emitted is '*' at this part
      // or there is a concrete match at this patch
      //
      if (currentType === '*') {
        for (branch in tree) {
          if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
            listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i+1));
          }
        }
        return listeners;
      } else if(currentType === '**') {
        endReached = (i+1 === typeLength || (i+2 === typeLength && nextType === '*'));
        if(endReached && tree._listeners) {
          // The next element has a _listeners, add it to the handlers.
          listeners = listeners.concat(searchListenerTree(handlers, type, tree, typeLength));
        }

        for (branch in tree) {
          if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
            if(branch === '*' || branch === '**') {
              if(tree[branch]._listeners && !endReached) {
                listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], typeLength));
              }
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
            } else if(branch === nextType) {
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i+2));
            } else {
              // No match on this one, shift into the tree but not in the type array.
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
            }
          }
        }
        return listeners;
      }

      listeners = listeners.concat(searchListenerTree(handlers, type, tree[currentType], i+1));
    }

    xTree = tree['*'];
    if (xTree) {
      //
      // If the listener tree will allow any match for this part,
      // then recursively explore all branches of the tree
      //
      searchListenerTree(handlers, type, xTree, i+1);
    }

    xxTree = tree['**'];
    if(xxTree) {
      if(i < typeLength) {
        if(xxTree._listeners) {
          // If we have a listener on a '**', it will catch all, so add its handler.
          searchListenerTree(handlers, type, xxTree, typeLength);
        }

        // Build arrays of matching next branches and others.
        for(branch in xxTree) {
          if(branch !== '_listeners' && xxTree.hasOwnProperty(branch)) {
            if(branch === nextType) {
              // We know the next element will match, so jump twice.
              searchListenerTree(handlers, type, xxTree[branch], i+2);
            } else if(branch === currentType) {
              // Current node matches, move into the tree.
              searchListenerTree(handlers, type, xxTree[branch], i+1);
            } else {
              isolatedBranch = {};
              isolatedBranch[branch] = xxTree[branch];
              searchListenerTree(handlers, type, { '**': isolatedBranch }, i+1);
            }
          }
        }
      } else if(xxTree._listeners) {
        // We have reached the end and still on a '**'
        searchListenerTree(handlers, type, xxTree, typeLength);
      } else if(xxTree['*'] && xxTree['*']._listeners) {
        searchListenerTree(handlers, type, xxTree['*'], typeLength);
      }
    }

    return listeners;
  }

  function growListenerTree(type, listener) {

    type = typeof type === 'string' ? type.split(this.delimiter) : type.slice();

    //
    // Looks for two consecutive '**', if so, don't add the event at all.
    //
    for(var i = 0, len = type.length; i+1 < len; i++) {
      if(type[i] === '**' && type[i+1] === '**') {
        return;
      }
    }

    var tree = this.listenerTree;
    var name = type.shift();

    while (name) {

      if (!tree[name]) {
        tree[name] = {};
      }

      tree = tree[name];

      if (type.length === 0) {

        if (!tree._listeners) {
          tree._listeners = listener;
        }
        else if(typeof tree._listeners === 'function') {
          tree._listeners = [tree._listeners, listener];
        }
        else if (isArray(tree._listeners)) {

          tree._listeners.push(listener);

          if (!tree._listeners.warned) {

            var m = defaultMaxListeners;

            if (typeof this._events.maxListeners !== 'undefined') {
              m = this._events.maxListeners;
            }

            if (m > 0 && tree._listeners.length > m) {

              tree._listeners.warned = true;
              console.error('(node) warning: possible EventEmitter memory ' +
                            'leak detected. %d listeners added. ' +
                            'Use emitter.setMaxListeners() to increase limit.',
                            tree._listeners.length);
              console.trace();
            }
          }
        }
        return true;
      }
      name = type.shift();
    }
    return true;
  }

  // By default EventEmitters will print a warning if more than
  // 10 listeners are added to it. This is a useful default which
  // helps finding memory leaks.
  //
  // Obviously not all Emitters should be limited to 10. This function allows
  // that to be increased. Set to zero for unlimited.

  EventEmitter.prototype.delimiter = '.';

  EventEmitter.prototype.setMaxListeners = function(n) {
    this._events || init.call(this);
    this._events.maxListeners = n;
    if (!this._conf) this._conf = {};
    this._conf.maxListeners = n;
  };

  EventEmitter.prototype.event = '';

  EventEmitter.prototype.once = function(event, fn) {
    this.many(event, 1, fn);
    return this;
  };

  EventEmitter.prototype.many = function(event, ttl, fn) {
    var self = this;

    if (typeof fn !== 'function') {
      throw new Error('many only accepts instances of Function');
    }

    function listener() {
      if (--ttl === 0) {
        self.off(event, listener);
      }
      fn.apply(this, arguments);
    }

    listener._origin = fn;

    this.on(event, listener);

    return self;
  };

  EventEmitter.prototype.emit = function() {

    this._events || init.call(this);

    var type = arguments[0];

    if (type === 'newListener' && !this.newListener) {
      if (!this._events.newListener) { return false; }
    }

    // Loop through the *_all* functions and invoke them.
    if (this._all) {
      var l = arguments.length;
      var args = new Array(l - 1);
      for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
      for (i = 0, l = this._all.length; i < l; i++) {
        this.event = type;
        this._all[i].apply(this, args);
      }
    }

    // If there is no 'error' event listener then throw.
    if (type === 'error') {

      if (!this._all &&
        !this._events.error &&
        !(this.wildcard && this.listenerTree.error)) {

        if (arguments[1] instanceof Error) {
          throw arguments[1]; // Unhandled 'error' event
        } else {
          throw new Error("Uncaught, unspecified 'error' event.");
        }
        return false;
      }
    }

    var handler;

    if(this.wildcard) {
      handler = [];
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      searchListenerTree.call(this, handler, ns, this.listenerTree, 0);
    }
    else {
      handler = this._events[type];
    }

    if (typeof handler === 'function') {
      this.event = type;
      if (arguments.length === 1) {
        handler.call(this);
      }
      else if (arguments.length > 1)
        switch (arguments.length) {
          case 2:
            handler.call(this, arguments[1]);
            break;
          case 3:
            handler.call(this, arguments[1], arguments[2]);
            break;
          // slower
          default:
            var l = arguments.length;
            var args = new Array(l - 1);
            for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
            handler.apply(this, args);
        }
      return true;
    }
    else if (handler) {
      var l = arguments.length;
      var args = new Array(l - 1);
      for (var i = 1; i < l; i++) args[i - 1] = arguments[i];

      var listeners = handler.slice();
      for (var i = 0, l = listeners.length; i < l; i++) {
        this.event = type;
        listeners[i].apply(this, args);
      }
      return (listeners.length > 0) || !!this._all;
    }
    else {
      return !!this._all;
    }

  };

  EventEmitter.prototype.on = function(type, listener) {

    if (typeof type === 'function') {
      this.onAny(type);
      return this;
    }

    if (typeof listener !== 'function') {
      throw new Error('on only accepts instances of Function');
    }
    this._events || init.call(this);

    // To avoid recursion in the case that type == "newListeners"! Before
    // adding it to the listeners, first emit "newListeners".
    this.emit('newListener', type, listener);

    if(this.wildcard) {
      growListenerTree.call(this, type, listener);
      return this;
    }

    if (!this._events[type]) {
      // Optimize the case of one listener. Don't need the extra array object.
      this._events[type] = listener;
    }
    else if(typeof this._events[type] === 'function') {
      // Adding the second element, need to change to array.
      this._events[type] = [this._events[type], listener];
    }
    else if (isArray(this._events[type])) {
      // If we've already got an array, just append.
      this._events[type].push(listener);

      // Check for listener leak
      if (!this._events[type].warned) {

        var m = defaultMaxListeners;

        if (typeof this._events.maxListeners !== 'undefined') {
          m = this._events.maxListeners;
        }

        if (m > 0 && this._events[type].length > m) {

          this._events[type].warned = true;
          console.error('(node) warning: possible EventEmitter memory ' +
                        'leak detected. %d listeners added. ' +
                        'Use emitter.setMaxListeners() to increase limit.',
                        this._events[type].length);
          console.trace();
        }
      }
    }
    return this;
  };

  EventEmitter.prototype.onAny = function(fn) {

    if (typeof fn !== 'function') {
      throw new Error('onAny only accepts instances of Function');
    }

    if(!this._all) {
      this._all = [];
    }

    // Add the function to the event listener collection.
    this._all.push(fn);
    return this;
  };

  EventEmitter.prototype.addListener = EventEmitter.prototype.on;

  EventEmitter.prototype.off = function(type, listener) {
    if (typeof listener !== 'function') {
      throw new Error('removeListener only takes instances of Function');
    }

    var handlers,leafs=[];

    if(this.wildcard) {
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      leafs = searchListenerTree.call(this, null, ns, this.listenerTree, 0);
    }
    else {
      // does not use listeners(), so no side effect of creating _events[type]
      if (!this._events[type]) return this;
      handlers = this._events[type];
      leafs.push({_listeners:handlers});
    }

    for (var iLeaf=0; iLeaf<leafs.length; iLeaf++) {
      var leaf = leafs[iLeaf];
      handlers = leaf._listeners;
      if (isArray(handlers)) {

        var position = -1;

        for (var i = 0, length = handlers.length; i < length; i++) {
          if (handlers[i] === listener ||
            (handlers[i].listener && handlers[i].listener === listener) ||
            (handlers[i]._origin && handlers[i]._origin === listener)) {
            position = i;
            break;
          }
        }

        if (position < 0) {
          continue;
        }

        if(this.wildcard) {
          leaf._listeners.splice(position, 1);
        }
        else {
          this._events[type].splice(position, 1);
        }

        if (handlers.length === 0) {
          if(this.wildcard) {
            delete leaf._listeners;
          }
          else {
            delete this._events[type];
          }
        }
        return this;
      }
      else if (handlers === listener ||
        (handlers.listener && handlers.listener === listener) ||
        (handlers._origin && handlers._origin === listener)) {
        if(this.wildcard) {
          delete leaf._listeners;
        }
        else {
          delete this._events[type];
        }
      }
    }

    return this;
  };

  EventEmitter.prototype.offAny = function(fn) {
    var i = 0, l = 0, fns;
    if (fn && this._all && this._all.length > 0) {
      fns = this._all;
      for(i = 0, l = fns.length; i < l; i++) {
        if(fn === fns[i]) {
          fns.splice(i, 1);
          return this;
        }
      }
    } else {
      this._all = [];
    }
    return this;
  };

  EventEmitter.prototype.removeListener = EventEmitter.prototype.off;

  EventEmitter.prototype.removeAllListeners = function(type) {
    if (arguments.length === 0) {
      !this._events || init.call(this);
      return this;
    }

    if(this.wildcard) {
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      var leafs = searchListenerTree.call(this, null, ns, this.listenerTree, 0);

      for (var iLeaf=0; iLeaf<leafs.length; iLeaf++) {
        var leaf = leafs[iLeaf];
        leaf._listeners = null;
      }
    }
    else {
      if (!this._events[type]) return this;
      this._events[type] = null;
    }
    return this;
  };

  EventEmitter.prototype.listeners = function(type) {
    if(this.wildcard) {
      var handlers = [];
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      searchListenerTree.call(this, handlers, ns, this.listenerTree, 0);
      return handlers;
    }

    this._events || init.call(this);

    if (!this._events[type]) this._events[type] = [];
    if (!isArray(this._events[type])) {
      this._events[type] = [this._events[type]];
    }
    return this._events[type];
  };

  EventEmitter.prototype.listenersAny = function() {

    if(this._all) {
      return this._all;
    }
    else {
      return [];
    }

  };

  if (typeof define === 'function' && define.amd) {
     // AMD. Register as an anonymous module.
    define(function() {
      return EventEmitter;
    });
  } else if (typeof exports === 'object') {
    // CommonJS
    exports.EventEmitter2 = EventEmitter;
  }
  else {
    // Browser global.
    window.EventEmitter2 = EventEmitter;
  }
}();

},{}],7:[function(require,module,exports){
(function (global){

var rng;

if (global.crypto && crypto.getRandomValues) {
  // WHATWG crypto-based RNG - http://wiki.whatwg.org/wiki/Crypto
  // Moderately fast, high quality
  var _rnds8 = new Uint8Array(16);
  rng = function whatwgRNG() {
    crypto.getRandomValues(_rnds8);
    return _rnds8;
  };
}

if (!rng) {
  // Math.random()-based (RNG)
  //
  // If all else fails, use Math.random().  It's fast, but is of unspecified
  // quality.
  var  _rnds = new Array(16);
  rng = function() {
    for (var i = 0, r; i < 16; i++) {
      if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
      _rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
    }

    return _rnds;
  };
}

module.exports = rng;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],8:[function(require,module,exports){
//     uuid.js
//
//     Copyright (c) 2010-2012 Robert Kieffer
//     MIT License - http://opensource.org/licenses/mit-license.php

// Unique ID creation requires a high quality random # generator.  We feature
// detect to determine the best RNG source, normalizing to a function that
// returns 128-bits of randomness, since that's what's usually required
var _rng = require('./rng');

// Maps for number <-> hex string conversion
var _byteToHex = [];
var _hexToByte = {};
for (var i = 0; i < 256; i++) {
  _byteToHex[i] = (i + 0x100).toString(16).substr(1);
  _hexToByte[_byteToHex[i]] = i;
}

// **`parse()` - Parse a UUID into it's component bytes**
function parse(s, buf, offset) {
  var i = (buf && offset) || 0, ii = 0;

  buf = buf || [];
  s.toLowerCase().replace(/[0-9a-f]{2}/g, function(oct) {
    if (ii < 16) { // Don't overflow!
      buf[i + ii++] = _hexToByte[oct];
    }
  });

  // Zero out remaining bytes if string was short
  while (ii < 16) {
    buf[i + ii++] = 0;
  }

  return buf;
}

// **`unparse()` - Convert UUID byte array (ala parse()) into a string**
function unparse(buf, offset) {
  var i = offset || 0, bth = _byteToHex;
  return  bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]];
}

// **`v1()` - Generate time-based UUID**
//
// Inspired by https://github.com/LiosK/UUID.js
// and http://docs.python.org/library/uuid.html

// random #'s we need to init node and clockseq
var _seedBytes = _rng();

// Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
var _nodeId = [
  _seedBytes[0] | 0x01,
  _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]
];

// Per 4.2.2, randomize (14 bit) clockseq
var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

// Previous uuid creation time
var _lastMSecs = 0, _lastNSecs = 0;

// See https://github.com/broofa/node-uuid for API details
function v1(options, buf, offset) {
  var i = buf && offset || 0;
  var b = buf || [];

  options = options || {};

  var clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq;

  // UUID timestamps are 100 nano-second units since the Gregorian epoch,
  // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
  // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
  // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
  var msecs = options.msecs !== undefined ? options.msecs : new Date().getTime();

  // Per 4.2.1.2, use count of uuid's generated during the current clock
  // cycle to simulate higher resolution clock
  var nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1;

  // Time since last uuid creation (in msecs)
  var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

  // Per 4.2.1.2, Bump clockseq on clock regression
  if (dt < 0 && options.clockseq === undefined) {
    clockseq = clockseq + 1 & 0x3fff;
  }

  // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
  // time interval
  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
    nsecs = 0;
  }

  // Per 4.2.1.2 Throw error if too many uuids are requested
  if (nsecs >= 10000) {
    throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
  }

  _lastMSecs = msecs;
  _lastNSecs = nsecs;
  _clockseq = clockseq;

  // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
  msecs += 12219292800000;

  // `time_low`
  var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
  b[i++] = tl >>> 24 & 0xff;
  b[i++] = tl >>> 16 & 0xff;
  b[i++] = tl >>> 8 & 0xff;
  b[i++] = tl & 0xff;

  // `time_mid`
  var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
  b[i++] = tmh >>> 8 & 0xff;
  b[i++] = tmh & 0xff;

  // `time_high_and_version`
  b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
  b[i++] = tmh >>> 16 & 0xff;

  // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
  b[i++] = clockseq >>> 8 | 0x80;

  // `clock_seq_low`
  b[i++] = clockseq & 0xff;

  // `node`
  var node = options.node || _nodeId;
  for (var n = 0; n < 6; n++) {
    b[i + n] = node[n];
  }

  return buf ? buf : unparse(b);
}

// **`v4()` - Generate random UUID**

// See https://github.com/broofa/node-uuid for API details
function v4(options, buf, offset) {
  // Deprecated - 'format' argument, as supported in v1.2
  var i = buf && offset || 0;

  if (typeof(options) == 'string') {
    buf = options == 'binary' ? new Array(16) : null;
    options = null;
  }
  options = options || {};

  var rnds = options.random || (options.rng || _rng)();

  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
  rnds[6] = (rnds[6] & 0x0f) | 0x40;
  rnds[8] = (rnds[8] & 0x3f) | 0x80;

  // Copy bytes to buffer, if provided
  if (buf) {
    for (var ii = 0; ii < 16; ii++) {
      buf[i + ii] = rnds[ii];
    }
  }

  return buf || unparse(rnds);
}

// Export public API
var uuid = v4;
uuid.v1 = v1;
uuid.v4 = v4;
uuid.parse = parse;
uuid.unparse = unparse;

module.exports = uuid;

},{"./rng":7}],9:[function(require,module,exports){
// javascript-astar 0.4.1
// http://github.com/bgrins/javascript-astar
// Freely distributable under the MIT License.
// Implements the astar search algorithm in javascript using a Binary Heap.
// Includes Binary Heap (with modifications) from Marijn Haverbeke.
// http://eloquentjavascript.net/appendix2.html
(function(definition) {
  /* global module, define */
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = definition();
  } else if (typeof define === 'function' && define.amd) {
    define([], definition);
  } else {
    var exports = definition();
    window.astar = exports.astar;
    window.Graph = exports.Graph;
  }
})(function() {

function pathTo(node) {
  var curr = node;
  var path = [];
  while (curr.parent) {
    path.unshift(curr);
    curr = curr.parent;
  }
  return path;
}

function getHeap() {
  return new BinaryHeap(function(node) {
    return node.f;
  });
}

var astar = {
  /**
  * Perform an A* Search on a graph given a start and end node.
  * @param {Graph} graph
  * @param {GridNode} start
  * @param {GridNode} end
  * @param {Object} [options]
  * @param {bool} [options.closest] Specifies whether to return the
             path to the closest node if the target is unreachable.
  * @param {Function} [options.heuristic] Heuristic function (see
  *          astar.heuristics).
  */
  search: function(graph, start, end, options) {
    graph.cleanDirty();
    options = options || {};
    var heuristic = options.heuristic || astar.heuristics.manhattan;
    var closest = options.closest || false;

    var openHeap = getHeap();
    var closestNode = start; // set the start node to be the closest if required

    start.h = heuristic(start, end);
    graph.markDirty(start);

    openHeap.push(start);

    while (openHeap.size() > 0) {

      // Grab the lowest f(x) to process next.  Heap keeps this sorted for us.
      var currentNode = openHeap.pop();

      // End case -- result has been found, return the traced path.
      if (currentNode === end) {
        return pathTo(currentNode);
      }

      // Normal case -- move currentNode from open to closed, process each of its neighbors.
      currentNode.closed = true;

      // Find all neighbors for the current node.
      var neighbors = graph.neighbors(currentNode);

      for (var i = 0, il = neighbors.length; i < il; ++i) {
        var neighbor = neighbors[i];

        if (neighbor.closed || neighbor.isWall()) {
          // Not a valid node to process, skip to next neighbor.
          continue;
        }

        // The g score is the shortest distance from start to current node.
        // We need to check if the path we have arrived at this neighbor is the shortest one we have seen yet.
        var gScore = currentNode.g + neighbor.getCost(currentNode);
        var beenVisited = neighbor.visited;

        if (!beenVisited || gScore < neighbor.g) {

          // Found an optimal (so far) path to this node.  Take score for node to see how good it is.
          neighbor.visited = true;
          neighbor.parent = currentNode;
          neighbor.h = neighbor.h || heuristic(neighbor, end);
          neighbor.g = gScore;
          neighbor.f = neighbor.g + neighbor.h;
          graph.markDirty(neighbor);
          if (closest) {
            // If the neighbour is closer than the current closestNode or if it's equally close but has
            // a cheaper path than the current closest node then it becomes the closest node
            if (neighbor.h < closestNode.h || (neighbor.h === closestNode.h && neighbor.g < closestNode.g)) {
              closestNode = neighbor;
            }
          }

          if (!beenVisited) {
            // Pushing to heap will put it in proper place based on the 'f' value.
            openHeap.push(neighbor);
          } else {
            // Already seen the node, but since it has been rescored we need to reorder it in the heap
            openHeap.rescoreElement(neighbor);
          }
        }
      }
    }

    if (closest) {
      return pathTo(closestNode);
    }

    // No result was found - empty array signifies failure to find path.
    return [];
  },
  // See list of heuristics: http://theory.stanford.edu/~amitp/GameProgramming/Heuristics.html
  heuristics: {
    manhattan: function(pos0, pos1) {
      var d1 = Math.abs(pos1.x - pos0.x);
      var d2 = Math.abs(pos1.y - pos0.y);
      return d1 + d2;
    },
    diagonal: function(pos0, pos1) {
      var D = 1;
      var D2 = Math.sqrt(2);
      var d1 = Math.abs(pos1.x - pos0.x);
      var d2 = Math.abs(pos1.y - pos0.y);
      return (D * (d1 + d2)) + ((D2 - (2 * D)) * Math.min(d1, d2));
    }
  },
  cleanNode: function(node) {
    node.f = 0;
    node.g = 0;
    node.h = 0;
    node.visited = false;
    node.closed = false;
    node.parent = null;
  }
};

/**
 * A graph memory structure
 * @param {Array} gridIn 2D array of input weights
 * @param {Object} [options]
 * @param {bool} [options.diagonal] Specifies whether diagonal moves are allowed
 */
function Graph(gridIn, options) {
  options = options || {};
  this.nodes = [];
  this.diagonal = !!options.diagonal;
  this.grid = [];
  for (var x = 0; x < gridIn.length; x++) {
    this.grid[x] = [];

    for (var y = 0, row = gridIn[x]; y < row.length; y++) {
      var node = new GridNode(x, y, row[y]);
      this.grid[x][y] = node;
      this.nodes.push(node);
    }
  }
  this.init();
}

Graph.prototype.init = function() {
  this.dirtyNodes = [];
  for (var i = 0; i < this.nodes.length; i++) {
    astar.cleanNode(this.nodes[i]);
  }
};

Graph.prototype.cleanDirty = function() {
  for (var i = 0; i < this.dirtyNodes.length; i++) {
    astar.cleanNode(this.dirtyNodes[i]);
  }
  this.dirtyNodes = [];
};

Graph.prototype.markDirty = function(node) {
  this.dirtyNodes.push(node);
};

Graph.prototype.neighbors = function(node) {
  var ret = [];
  var x = node.x;
  var y = node.y;
  var grid = this.grid;

  // West
  if (grid[x - 1] && grid[x - 1][y]) {
    ret.push(grid[x - 1][y]);
  }

  // East
  if (grid[x + 1] && grid[x + 1][y]) {
    ret.push(grid[x + 1][y]);
  }

  // South
  if (grid[x] && grid[x][y - 1]) {
    ret.push(grid[x][y - 1]);
  }

  // North
  if (grid[x] && grid[x][y + 1]) {
    ret.push(grid[x][y + 1]);
  }

  if (this.diagonal) {
    // Southwest
    if (grid[x - 1] && grid[x - 1][y - 1]) {
      ret.push(grid[x - 1][y - 1]);
    }

    // Southeast
    if (grid[x + 1] && grid[x + 1][y - 1]) {
      ret.push(grid[x + 1][y - 1]);
    }

    // Northwest
    if (grid[x - 1] && grid[x - 1][y + 1]) {
      ret.push(grid[x - 1][y + 1]);
    }

    // Northeast
    if (grid[x + 1] && grid[x + 1][y + 1]) {
      ret.push(grid[x + 1][y + 1]);
    }
  }

  return ret;
};

Graph.prototype.toString = function() {
  var graphString = [];
  var nodes = this.grid;
  for (var x = 0; x < nodes.length; x++) {
    var rowDebug = [];
    var row = nodes[x];
    for (var y = 0; y < row.length; y++) {
      rowDebug.push(row[y].weight);
    }
    graphString.push(rowDebug.join(" "));
  }
  return graphString.join("\n");
};

function GridNode(x, y, weight) {
  this.x = x;
  this.y = y;
  this.weight = weight;
}

GridNode.prototype.toString = function() {
  return "[" + this.x + " " + this.y + "]";
};

GridNode.prototype.getCost = function(fromNeighbor) {
  // Take diagonal weight into consideration.
  if (fromNeighbor && fromNeighbor.x != this.x && fromNeighbor.y != this.y) {
    return this.weight * 1.41421;
  }
  return this.weight;
};

GridNode.prototype.isWall = function() {
  return this.weight === 0;
};

function BinaryHeap(scoreFunction) {
  this.content = [];
  this.scoreFunction = scoreFunction;
}

BinaryHeap.prototype = {
  push: function(element) {
    // Add the new element to the end of the array.
    this.content.push(element);

    // Allow it to sink down.
    this.sinkDown(this.content.length - 1);
  },
  pop: function() {
    // Store the first element so we can return it later.
    var result = this.content[0];
    // Get the element at the end of the array.
    var end = this.content.pop();
    // If there are any elements left, put the end element at the
    // start, and let it bubble up.
    if (this.content.length > 0) {
      this.content[0] = end;
      this.bubbleUp(0);
    }
    return result;
  },
  remove: function(node) {
    var i = this.content.indexOf(node);

    // When it is found, the process seen in 'pop' is repeated
    // to fill up the hole.
    var end = this.content.pop();

    if (i !== this.content.length - 1) {
      this.content[i] = end;

      if (this.scoreFunction(end) < this.scoreFunction(node)) {
        this.sinkDown(i);
      } else {
        this.bubbleUp(i);
      }
    }
  },
  size: function() {
    return this.content.length;
  },
  rescoreElement: function(node) {
    this.sinkDown(this.content.indexOf(node));
  },
  sinkDown: function(n) {
    // Fetch the element that has to be sunk.
    var element = this.content[n];

    // When at 0, an element can not sink any further.
    while (n > 0) {

      // Compute the parent element's index, and fetch it.
      var parentN = ((n + 1) >> 1) - 1;
      var parent = this.content[parentN];
      // Swap the elements if the parent is greater.
      if (this.scoreFunction(element) < this.scoreFunction(parent)) {
        this.content[parentN] = element;
        this.content[n] = parent;
        // Update 'n' to continue at the new position.
        n = parentN;
      }
      // Found a parent that is less, no need to sink any further.
      else {
        break;
      }
    }
  },
  bubbleUp: function(n) {
    // Look up the target element and its score.
    var length = this.content.length;
    var element = this.content[n];
    var elemScore = this.scoreFunction(element);

    while (true) {
      // Compute the indices of the child elements.
      var child2N = (n + 1) << 1;
      var child1N = child2N - 1;
      // This is used to store the new position of the element, if any.
      var swap = null;
      var child1Score;
      // If the first child exists (is inside the array)...
      if (child1N < length) {
        // Look it up and compute its score.
        var child1 = this.content[child1N];
        child1Score = this.scoreFunction(child1);

        // If the score is less than our element's, we need to swap.
        if (child1Score < elemScore) {
          swap = child1N;
        }
      }

      // Do the same checks for the other child.
      if (child2N < length) {
        var child2 = this.content[child2N];
        var child2Score = this.scoreFunction(child2);
        if (child2Score < (swap === null ? elemScore : child1Score)) {
          swap = child2N;
        }
      }

      // If the element needs to be moved, swap it, and continue.
      if (swap !== null) {
        this.content[n] = this.content[swap];
        this.content[swap] = element;
        n = swap;
      }
      // Otherwise, we are done.
      else {
        break;
      }
    }
  }
};

return {
  astar: astar,
  Graph: Graph
};

});
},{}],10:[function(require,module,exports){
var util = require('util');
var Math2D = require('./math2d');
var BaseUnit = require('./BaseUnit');
var logger = require('../util/log').logger('BaseMobileUnit');
var astar = require('../algorithm/astar');

function MobileUnitContext() {
	return {
		status : MobileUnitContext.STATUS_WAIT,
		dest : null,
		target : null,
		gathering_amount : 0
	}
}

MobileUnitContext.STATUS = {
	WAITING: 1,
	MOVING_TO_POS: 2,
	MOVING_TO_BUILDING: 3,
	MOVING_TO_RESOURCE: 4,
	MOVING_TO_UNIT: 5,
	RETURNING: 6,
	ATTACKING: 7,
	GATHERING: 8,
	REPAIRING: 9,
	BUILDING: 10
}

function BaseMobileUnit(graphic, info, map, player) {
	var that = this;
	BaseUnit.call(this, graphic, info, map, player);
	this.context = new MobileUnitContext();
	this.attack = 5;
	this.range = 3;
	this.speed = 4;
	//次の目的地
	this.nextDestination = null;
	this.queue = [];
	this.count = 0;
	this.count2 = 0;
}

util.inherits(BaseMobileUnit, BaseUnit);

BaseMobileUnit.prototype.draw = function(status) {
	//表示
}

BaseMobileUnit.prototype.toString = function() {
	return JSON.stringify(this.context.status);
}


BaseMobileUnit.prototype.main = function() {
	switch(this.context.status) {
		case MobileUnitContext.STATUS.WAITING:
			this.execute_waiting(event);
			break;
		case MobileUnitContext.STATUS.MOVING_TO_POS:
			this.execute_moving_to_pos(event);
			break;
		case MobileUnitContext.STATUS.MOVING_TO_BUILDING:
			this.execute_moving_to_building(event);
			break;
		case MobileUnitContext.STATUS.MOVING_TO_RESOURCE:
			this.execute_moving_to_resource(event);
			break;
		case MobileUnitContext.STATUS.MOVING_TO_UNIT:
			this.execute_moving_to_unit(event);
			break;
		case MobileUnitContext.STATUS.RETURNING:
			this.execute_returning(event);
			break;
		case MobileUnitContext.STATUS.ATTACKING:
			this.execute_attacking(event);
			break;
		case MobileUnitContext.STATUS.GATHERING:
			this.execute_gathering(event);
			break;
		case MobileUnitContext.STATUS.REPAIRING:
			this.execute_repairing(event);
			break;
		case MobileUnitContext.STATUS.building:
			break;
	}
}

BaseMobileUnit.prototype.execute_waiting = function(event) {
}

BaseMobileUnit.prototype.execute_moving_to_pos = function(event) {
	this.movingProcess();
	if(!this.context.dist) return;
	var dis = Math2D.Point2D.distance( this.position(), this.context.dist );
	if(dis < 80) {
		this.context.status = MobileUnitContext.STATUS.WAITING;
	}
}

BaseMobileUnit.prototype.execute_moving_to_building = function(event) {
	this.movingProcess();
	var dis = Math2D.Point2D.distance( this.position(), this.context.target.position() );
	if(dis < 80) {
		this.context.status = MobileUnitContext.STATUS.WAITING;
	}
}

BaseMobileUnit.prototype.execute_moving_to_resource = function(event) {
	this.movingProcess();
	var dis = Math2D.Point2D.distance( this.position(), this.context.target.position() );
	if(dis < 80) {
		this.count = 20;
		this.context.status = MobileUnitContext.STATUS.GATHERING;
	}
}

BaseMobileUnit.prototype.execute_moving_to_unit = function(event) {

}

BaseMobileUnit.prototype.execute_returning = function(event) {
	this.movingProcess();
	var dis = Math2D.Point2D.distance( this.position(), this.context.target.position() );
	if(dis < 80) {
		console.log("returned");
		this.player.addResource('tree', this.context.gathering_amount);
		this.context.gathering_amount = 0;
		this.count = 20;
		var nature = this.map.unitManager.getNearNature();
		this.context.target = nature[0];
		this.move_to_target(this.context.target);
	}

}

BaseMobileUnit.prototype.execute_attacking = function(event) {
	if(event.name == "within range") {
		return {
			state: STATE.ATTACKING,
			target: event.context.target
		}
	}else if(event.name == "not within range") {
		return {
			state: STATE.MOVING,
			target: event.context.target
		}
	}
}

BaseMobileUnit.prototype.execute_gathering = function(event) {
	this.count--;
	if(this.count <= 0) {
		this.count = 20;
		this.context.gathering_amount += this.context.target.decrease(1);
		if(this.context.gathering_amount == 10) {
			var buildings = this.map.unitManager.getNearBuilding();
			this.return_to_target( buildings[0] );
		}
	}
}

BaseMobileUnit.prototype.execute_repairing = function(event) {

}

BaseMobileUnit.prototype.movingProcess = function() {
	if(this.nextDestination) {
		//次の目的地がある場合
		this.pos = this.pos.add(this.vec);
		if(this.map.hit(this)) {
			this.pos = this.pos.sub(this.vec);
			this.count2--;
			if(this.count2 <= 0) {
				if(this.context.status == MobileUnitContext.STATUS.MOVING_TO_POS) {
					this.move_to_pos(this.context.dest);
				}else{
					this.move_to_target(this.context.target);
				}
			}
		}else{
			this.count--;
		}
		this.graphic.setPos(this.pos.getX(), this.pos.getY());
		//nextDestinationについた場合
		if(this.count <= 0) this.nextDestination = null;
	}else{
		//次の目的地がない場合
		this.count = 0;
		this.nextDestination = this.queue.shift();
		if(this.nextDestination) {
			var vec = this.nextDestination.sub(this.pos);
			this.graphic.rotate( Math.atan(vec.getY() / vec.getX()) / Math.PI * 180 + 90 );
			this.vec = vec.times(1/50);
			this.count = 50;
			this.count2 = 200;
		}
	}
}


BaseMobileUnit.prototype.move = function(d) {
	this.queue.push(d);
}

BaseMobileUnit.prototype.move_to_pos = function(pos) {
	this.make_route( pos );
	this.context.status = MobileUnitContext.STATUS.MOVING_TO_POS;
	this.context.dest = new Math2D.Point2D(pos.x, pos.y);
}

BaseMobileUnit.prototype.move_to_target = function(unit) {
	this.make_route( unit.position() );
	if(unit.info.type == "nature") {
		this.context.status = MobileUnitContext.STATUS.MOVING_TO_RESOURCE;
	}else if(unit.info.type == "building") {
		this.context.status = MobileUnitContext.STATUS.MOVING_TO_BUILDING;
	}
	this.context.target = unit;
}

BaseMobileUnit.prototype.return_to_target = function(unit) {
	if(unit.info.type == "building") {
		this.make_route( unit.position() );
		this.context.status = MobileUnitContext.STATUS.RETURNING;
		this.context.target = unit;
	}else{
		throw new Error("invalid unit type");
	}
}

BaseMobileUnit.prototype.make_route = function(x, y) {
	if(x instanceof Math2D.Point2D) {
		y = x.getY();
		x = x.getX();
	}
	var that = this;

	//clear
	this.count--;
	this.queue = [];

	var startPos = this.positionTile();
	var endPos = new Math2D.Point2D(Math.floor(x / 50), Math.floor(y / 50));

	var collGraph = this.map.getCollGraph({
		except : [startPos, endPos]
	});
	var graph = new astar.Graph(collGraph);
	logger('walkFrom', startPos.getX(), startPos.getY());
	logger('walkTo', endPos.getX(), endPos.getY());
    var start = graph.grid[startPos.getX()][startPos.getY()];
    var end = graph.grid[ endPos.getX() ][ endPos.getY() ];
    var result = astar.astar.search(graph, start, end);

    result.map(function(gridNode) {
		that.queue.push(new Math2D.Point2D(gridNode.x*50, gridNode.y*50));
    });
}

module.exports = BaseMobileUnit;
},{"../algorithm/astar":9,"../util/log":23,"./BaseUnit":12,"./math2d":16,"util":4}],11:[function(require,module,exports){
var util = require('util');
var BaseUnit = require('./BaseUnit');

function NatureUnitStatus() {
	return {
		status : NatureUnitStatus.STATUS_BUILDING,
		dist : null
	}
}
NatureUnitStatus.STATUS_BUILDING = 1;
NatureUnitStatus.STATUS_NORMAL = 2;

function BaseNatureUnit(graphic, info, map) {
	BaseUnit.call(this, graphic, info, map);
	this.amount = 100;
}

util.inherits(BaseNatureUnit, BaseUnit);

BaseNatureUnit.prototype.decrease = function(amount) {
	this.amount -= amount;
	if(this.amount < 0) {
		var left = -1 * this.amount;
		this.amount = 0;
		this.map.unitManager.remove(this.getId());
		console.log(left);
		return amount - left;
	}else{
		return amount;
	}
}

BaseNatureUnit.prototype.main = function() {
}

BaseNatureUnit.prototype.toString = function() {
	return this.amount;
}


module.exports = BaseNatureUnit;

},{"./BaseUnit":12,"util":4}],12:[function(require,module,exports){
var EventEmitter = require('eventemitter2').EventEmitter2;
var util = require('util');
var uuid = require('uuid');
var Math2D = require('./math2d');

function BaseUnit(graphic, info, map, player) {
	var that = this;
	EventEmitter.call(this);
	that.graphic = graphic;
	this.info = info;
	this.id = uuid();
	this.map = map;
	this.player = player;
	this.pos = new Math2D.Point2D(0, 0);
	if(info.size instanceof Array) {
		that.graphic.setSize(info.size[0] * 50, info.size[1] * 50);
	}else{
		that.graphic.setSize(info.size * 50, info.size * 50);
	}
	this.graphic.click(function(e) {
		console.log("mouseup", e.button);
		that.emit('click', e);
	});
}

util.inherits(BaseUnit, EventEmitter);

BaseUnit.prototype.getId = function() {
	return this.id;
}

BaseUnit.prototype.remove = function() {
	return this.graphic.remove();
}

BaseUnit.prototype.collBound = function() {
	var offset = 5;
	var info = this.info;
	if(info.type == 'trainable') offset = 15;
	if(info.size.length == 2) {
		var w = info.size[0] * 50;
		var h = info.size[1] * 50;
	}else{
		var w = info.size * 50;
		var h = info.size * 50;
	}
	return {
		x : this.pos.getX()+offset,
		y : this.pos.getY()+offset,
		w : w - offset*2,
		h : h - offset*2
	}
}

BaseUnit.prototype.position = function(x, y) {
	if(x === undefined && y == undefined) return this.pos;
	this.pos.setLocation(x, y);
	this.graphic.setPos(x, y);
}

BaseUnit.prototype.positionTile = function(x, y) {
	if(x === undefined && y == undefined) return new Math2D.Point2D( Math.floor(this.pos.getX() / 50), Math.floor(this.pos.getY() / 50));
	x *= 50;
	y *= 50;
	this.pos.setLocation(x, y);
	this.graphic.setPos(x, y);
}

module.exports = BaseUnit;
},{"./math2d":16,"eventemitter2":6,"util":4,"uuid":8}],13:[function(require,module,exports){
var EventEmitter = require('eventemitter2').EventEmitter2;
var util = require('util');
var RectangleSelector = require('../ui/rectangleSelector');
var Math2D = require('./math2d');

function Map(snap) {
	var that = this;
	EventEmitter.call(this);
	this.width = 80;
	this.height = 80;
	var width = 2000;
	var height = 2000;
	RectangleSelector.snap = snap;
	this.coll = snap.rect(0, 0, width, height);
	this.coll.attr({
		fill : "#7f7"
	});
	this.coll.drag(function(dx, dy) {
		RectangleSelector.move(dx, dy);
	}, function(x, y, e) {
		console.log('start', e.pageX, e.pageY);
		RectangleSelector.start(e.pageX, e.pageY);
	}, function() {
		RectangleSelector.end();
		var units = that.unitManager.getTrainableUnits().filter(function(unit) {
			return RectangleSelector.isContain(unit.position())
		});
		that.emit('selected', units);
	});
	this.coll.mousedown(function(e) {
		if(e.button == 0) {
			that.emit('click', {
				x : e.pageX,
				y : e.pageY
			});
		}else if(e.button == 2) {
			console.log(e);
			that.emit('target', {
				pos: new Math2D.Point2D(e.pageX, e.pageY)
			});
		}
	});
    window.addEventListener("contextmenu", function(e){
        e.preventDefault();
    }, false);
}

util.inherits(Map, EventEmitter);

Map.prototype.setUnitManager = function(unitManager) {
	this.unitManager = unitManager;
}

Map.prototype.hit = function(targetUnit) {
	return this.unitManager.getUnits().filter(function(unit) {
		return unit.getId() != targetUnit.getId();
	}).map(function(u) {
		return u.collBound();
	}).filter(function(bound) {
		var targetBound = targetUnit.collBound();
		return (bound.x < targetBound.x + targetBound.w &&  targetBound.x < bound.x + bound.w &&
			bound.y < targetBound.y + targetBound.h &&  targetBound.y < bound.y + bound.h);
	}).length > 0;
}

Map.prototype.getCollGraph = function(_options) {
	var options = _options || {};
	var that = this;
	var graph = [];
	for(var i=0;i < this.width;i++) {
		var wGraph = []
		for(var j=0;j < this.height;j++) {
			wGraph.push(1);
		}
		graph.push(wGraph);
	}
	this.unitManager.getCollUnits().map(function(u) {
		if(u.info.size.length == 2) {
			var w = u.info.size[0];
			var h = u.info.size[1];
		}else{
			var w = u.info.size;
			var h = u.info.size;
		}
		return {x:u.positionTile().getX(), y:u.positionTile().getY(), w:w, h:h};　
	}).forEach(function(p) {
		for(var i = p.x;i < p.x + p.w;i++) {
			for(var j = p.y;j < p.y + p.h;j++) {
				graph[i][j] = 0;
			}
		}
	});
	if(options.except) {
		options.except.forEach(function(e) {
			graph[e.getX()][e.getY()] = 1;
		});
	}
	return graph;
}

module.exports = Map;
},{"../ui/rectangleSelector":21,"./math2d":16,"eventemitter2":6,"util":4}],14:[function(require,module,exports){
var EventEmitter = require('eventemitter2').EventEmitter2;
var util = require('util');
var UnitGraphic = require('../graphic/unitGraphic');
var BaseMobileUnit = require('./BaseMobileUnit');
var BaseNatureUnit = require('./BaseNatureUnit');

function UnitManager() {
	EventEmitter.call(this);
	this.metaUnits = {};
	this.units = {};
}

util.inherits(UnitManager, EventEmitter);

UnitManager.prototype.setMap = function(map) {
	this.map = map;
}

UnitManager.prototype.load = function(units) {
	var that = this;
	units.map(function(unit) {
		that.metaUnits[unit.id] = unit;
	});
}

UnitManager.prototype.main = function() {
	var that = this;
	Object.keys(this.units).map(function(k) {
		if(that.units[k]) that.units[k].main();
	});
}

UnitManager.prototype.create = function(snap, metaUnitId, player) {
	var that = this;
	var metaUnit = this.metaUnits[metaUnitId];
	var ug = new UnitGraphic(snap, {
		path : 'images/' + metaUnit.graphic.path,
		width : metaUnit.graphic.width,
		height : metaUnit.graphic.height,
	});
	if(metaUnit.unitinfo.type == 'nature') {
		var person = new BaseNatureUnit(ug, metaUnit.unitinfo, this.map, player);
	}else{
		var person = new BaseMobileUnit(ug, metaUnit.unitinfo, this.map, player);
	}
	person.on('click', function(e) {
		if(e.button == 2) {
			that.emit('target', {unit : person, event : e});
		}else{
			//TODO:
			that.selected = person;
			//
			that.emit('click', {unit : person, event : e});
		}
	});
	this.units[person.id] = person;
	return person;
}

UnitManager.prototype.remove = function(id) {
	if(this.units[id]) {
		this.units[id].remove();
		delete this.units[id];
	}
}

UnitManager.prototype.getUnits = function() {
	var that = this;
	return Object.keys(this.units).map(function(k) {
		return that.units[k];
	});	
}

UnitManager.prototype.getTrainableUnits = function() {
	var that = this;
	return Object.keys(this.units).map(function(k) {
		return that.units[k];
	}).filter(function(unit) {
		return unit.info.type == 'trainable';
	});
}

UnitManager.prototype.getCollUnits = function() {
	var that = this;
	return Object.keys(this.units).map(function(k) {
		return that.units[k];
	})/*.filter(function(unit) {
		return unit.info.type == 'building' || unit.info.type == 'nature';
	});*/
}

UnitManager.prototype.getNearNature = function() {
	var that = this;
	return Object.keys(this.units).map(function(k) {
		return that.units[k];
	}).filter(function(unit) {
		return unit.info.type == 'nature';
	});
}

UnitManager.prototype.getNearBuilding = function() {
	var that = this;
	return Object.keys(this.units).map(function(k) {
		return that.units[k];
	}).filter(function(unit) {
		return unit.info.type == 'building';
	});
}


module.exports = UnitManager;
},{"../graphic/unitGraphic":18,"./BaseMobileUnit":10,"./BaseNatureUnit":11,"eventemitter2":6,"util":4}],15:[function(require,module,exports){
var Snap = require('../../thirdparty/snap.svg');
var UnitManager = require('./UnitManager');
var unitInfo = require('../unit');
var ControlPanel = require('../ui/controlPanel');
var Map = require('./Map');
var Player = require('./player');

function Game(requestAnimationFrame) {
	this.start(requestAnimationFrame);
}

Game.prototype.start = function(requestAnimationFrame) {
	var controlPanel = new ControlPanel();
	var mainDom = document.getElementById('main');
	var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttributeNS(null, 'width', 2000);
    svg.setAttributeNS(null, 'height', 2000);
	mainDom.appendChild(svg);

	var snap = Snap(svg);
	var unitManager = new UnitManager();
	unitManager.load(unitInfo);

	var map = new Map(snap);
	//map.generate(0);

	map.setUnitManager(unitManager);
	unitManager.setMap(map);
	var player1 = new Player({type: Player.TYPE_HUMAN});
	var player2 = new Player({type: Player.TYPE_ENEMY});
	var player_gaia = new Player({type: Player.TYPE_GAIA});


	player1.on('update', function() {
		var resource_tree = document.getElementById('resource-tree');
		resource_tree.textContent = player1.resource('tree');
	});
	unitManager.create(snap, 'town', player1).position(250, 150);
	unitManager.create(snap, 'villager', player1).position(100, 50);
	unitManager.create(snap, 'villager', player1).position(100, 100);
	unitManager.create(snap, 'villager', player1).position(50, 150);
	unitManager.create(snap, 'villager', player1).position(200, 200);
	unitManager.create(snap, 'villager', player2).position(200, 250);
	unitManager.create(snap, 'tree', player_gaia).position(100, 150);
	unitManager.create(snap, 'tree', player_gaia).position(600, 150);
	unitManager.create(snap, 'tree', player_gaia).position(600, 200);
	unitManager.create(snap, 'tree', player_gaia).position(600, 250);
	unitManager.create(snap, 'tree', player_gaia).position(450, 200);
	unitManager.create(snap, 'tree', player_gaia).position(400, 300);
	unitManager.create(snap, 'tree', player_gaia).position(400, 250);
	unitManager.create(snap, 'tree', player_gaia).position(150, 50);

	var selected = null;
	unitManager.on('target', function(e) {
		if(selected) {
			if(selected instanceof Array) {
				selected.forEach(function(s) {
					s.move_to_target(e.unit);
				});
			}else{
				selected.move_to_target(e.unit);
			}
		}			
	});
	unitManager.on('click', function(e) {
		selected = e.unit;
		controlPanel.setTarget(selected);
	});
	map.on('target', function(e) {
		if(selected) {
			if(selected instanceof Array) {
				selected.forEach(function(s) {
					s.move_to_pos(e.pos);
				});
			}else{
				selected.move_to_pos(e.pos);
			}
		}
	});
	map.on('selected', function(units) {
		selected = units;
	});

	function gameLoop() {
		unitManager.main();
	}
	var recursiveAnim = function() {
		gameLoop();
		requestAnimationFrame(recursiveAnim)
	}
	requestAnimationFrame(recursiveAnim)

	var graph = map.getCollGraph();
	for(var i=0;i < graph.length;i++) {
		for(var j=0;j < graph[i].length;j++) {
			if(graph[i][j] == 0) {
				snap.rect(i*50, j*50, 45, 45).attr({
					stroke : '#a77',
					fill : 'none',
					strokeWidth : 3
				});
			}else if(graph[i][j] == 1) {
				snap.rect(i*50, j*50, 45, 45).attr({
					stroke : '#77b',
					fill : 'none',
					strokeWidth : 3
				});
			}
		}
	}
}

module.exports = Game;
},{"../../thirdparty/snap.svg":24,"../ui/controlPanel":20,"../unit":22,"./Map":13,"./UnitManager":14,"./player":17}],16:[function(require,module,exports){

function Point2D(x, y) {
	this.x = x;
	this.y = y;
}

Point2D.zero = new Point2D(0, 0);

Point2D.sub = function(a,b) {
	return new Point2D(a.x - b.x, a.y - b.y);
}

Point2D.add = function(a,b) {
	return new Point2D(a.x + b.x, a.y + b.y);
}

Point2D.times = function(a,t) {
	return new Point2D(a.x * t, a.y * t);
}

Point2D.prototype.sub = function(a) {
	return Point2D.sub(this, a);
}

Point2D.prototype.add = function(a) {
	return Point2D.add(this, a);
}

Point2D.prototype.times = function(a) {
	return Point2D.times(this, a);
}


Point2D.prototype.getX = function() {
	return this.x;
}

Point2D.prototype.getY = function() {
	return this.y;
}


Point2D.prototype.setLocation = function(x, y) {
	this.x = x;
	this.y = y;
}

/*
public String toString() {
        return "Point2D.Double["+x+", "+y+"]";
    }


    public void setLocation(Point2D p) {
        setLocation(p.getX(), p.getY());
    }
    */

/*
Point2D.prototype.distanceSq = function(x1, y1, x2, y2) {
    x1 -= x2;
    y1 -= y2;
    return (x1 * x1 + y1 * y1);
}

    public static double distance(double x1, double y1,
                                  double x2, double y2)
    {
        x1 -= x2;
        y1 -= y2;
        return Math.sqrt(x1 * x1 + y1 * y1);
    }
*/
Point2D.prototype.distanceSq = function(px, py) {
	px -= this.getX();
	py -= this.getY();
	return (px * px + py * py);
}

Point2D.distanceSq = function(p, q) {
    var xx = p.x - q.x;
    var yy = p.y - q.y;
    return (xx * xx + yy * yy);
}

Point2D.distance = function(p, q) {
	return Math.sqrt(Point2D.distanceSq(p, q));
}

Point2D.prototype.length = function() {
	return Point2D.distance(Point2D.zero, this);
}

/*
    public double distanceSq(Point2D pt) {
        double px = pt.getX() - this.getX();
        double py = pt.getY() - this.getY();
        return (px * px + py * py);
    }

    public double distance(Point2D pt) {
        double px = pt.getX() - this.getX();
        double py = pt.getY() - this.getY();
        return Math.sqrt(px * px + py * py);
    }

    public Object clone() {
    	return new Point2D(x, y);
    }
*/

/**
 * Line2D
 * @param x1,y1,x2,y2
 */
function Line2D(x1, y1, x2, y2) {
	this.x1 = x1;
	this.y1 = y1;
	this.x2 = x2;
	this.y2 = y2;
}

Line2D.prototype.getX1 = function() {
	return this.x1;
}

Line2D.prototype.getY1 = function() {
	return this.y1;
}

Line2D.prototype.getX2 = function() {
	return this.x2;
}

Line2D.prototype.getY2 = function() {
	return this.y2;
}


Line2D.prototype.setLine = function(x1, y1, x2, y2) {
	this.x1 = x1;
	this.y1 = y1;
	this.x2 = x2;
	this.y2 = y2;
}

Line2D.prototype.getP1 = function() {
	return new Point2D(this.x1, this.y1);
}

Line2D.prototype.getP2 = function() {
	return new Point2D(this.x2, this.y2);
}

Line2D.prototype.getBounds2D = function() {
    var x;
    var y;
    var w;
    var h;
    if (this.x1 < this.x2) {
        x = this.x1;
        w = this.x2 - this.x1;
    } else {
        x = this.x2;
        w = this.x1 - this.x2;
    }
    if (this.y1 < this.y2) {
        y = this.y1;
        h = this.y2 - this.y1;
    } else {
        y = this.y2;
        h = this.y1 - this.y2;
    }
    return new Rectangle2D(x, y, w, h);
}

Line2D.prototype.getConnect = function(l) {
	var dBunbo	= (this.getX2() - this.getX1() )
    	 		* ( l.getY2() - l.getY1() )
    	 		- ( this.getY2() - this.getY1() )
    	 		* ( l.getX2() - l.getX1());
    	 
    	 if( 0 == dBunbo )
    	 {
    		 return null;
    	 }
    	 
    	 var vectorAC = new Point2D(l.getX1() - this.getX1(), l.getY1() - this.getY1());
    	 
    	 var dR = ( ( l.getY2() - l.getY1() ) * vectorAC.x - ( l.getX2() - l.getX1() ) * vectorAC.y ) / dBunbo;
//	    	 double dS = ( ( getY2() - getY1() ) * vectorAC.x - ( getX2() - getX1() ) * vectorAC.y ) / dBunbo;
    	 
    	 return new Point2D(this.getX1() + dR * (this.getX2() - this.getX1()), this.getY1() + dR * (this.getY2() - this.getY1()));
    	 }

/**
 * static関数
 */
Line2D.relativeCCW = function(x1, y1, x2, y2, px, py) {
    	 x2 -= x1;
    	 y2 -= y1;
    	 px -= x1;
    	 py -= y1;
    	 var ccw = px * y2 - py * x2;
    	 if (ccw == 0.0) {
    		 ccw = px * x2 + py * y2;
    		 if (ccw > 0.0) {
    			 px -= x2;
    			 py -= y2;
    			 ccw = px * x2 + py * y2;
    			 if (ccw < 0.0) {
    				 ccw = 0.0;
    			 }
    		 }
    	 }
    	 if(ccw < 0.0) {
    		 return -1;
    	 }else{
    		 if(ccw > 0.0) {
    			 return 1;
    		 }else{
    			 return 0
    		 }
    	 }
//	    	 return (ccw < 0.0) ? -1 : ((ccw > 0.0) ? 1 : 0);
}
     
Line2D.prototype.relativeCCW = function(px, py) {
	 return relativeCCW(this.getX1(), this.getY1(), this.getX2(), this.getY2(), px, py);
}
     
Line2D.prototype.relativeCCW = function(p) {
    	 return relativeCCW(this.getX1(), this.getY1(), this.getX2(), this.getY2(),
    	       p.getX(), p.getY());
}
    	
Line2D.linesIntersect = function(x1, y1, x2, y2, x3, y3, x4, y4) {
	return ((Line2D.relativeCCW(x1, y1, x2, y2, x3, y3) *
			Line2D.relativeCCW(x1, y1, x2, y2, x4, y4) <= 0)
			&& (Line2D.relativeCCW(x3, y3, x4, y4, x1, y1) *
					Line2D.relativeCCW(x3, y3, x4, y4, x2, y2) <= 0));
}

Line2D.prototype.intersectsLine = function(x1, y1, x2, y2) {
	return Line2D.linesIntersect(x1, y1, x2, y2,
	         this.getX1(), this.getY1(), this.getX2(), this.getY2());
}

/*
	public boolean intersectsLine(Line2D l) {
		return linesIntersect(l.getX1(), l.getY1(), l.getX2(), l.getY2(),
	         getX1(), getY1(), getX2(), getY2());
	}
	*/
	
Line2D.ptSegDistSq = function(x1, y1, x2, y2, px, py) {
	x2 -= x1;
	y2 -= y1;
	px -= x1;
	py -= y1;
	var dotprod = px * x2 + py * y2;
	var projlenSq;
	if (dotprod <= 0.0) {
		projlenSq = 0.0;
	} else {
		px = x2 - px;
		py = y2 - py;
		dotprod = px * x2 + py * y2;
		if (dotprod <= 0.0) {
			projlenSq = 0.0;
		} else {
			projlenSq = dotprod * dotprod / (x2 * x2 + y2 * y2);
		}
	}
	var lenSq = px * px + py * py - projlenSq;
	if (lenSq < 0) {
		lenSq = 0;
	}
	return lenSq;
}

/**
 * static関数
 */
Line2D.ptSegDist = function(x1, y1, x2, y2, px, py) {
	return Math.sqrt(Line2D.ptSegDistSq(x1, y1, x2, y2, px, py));
}

Line2D.prototype.ptSegDistSq = function(px, py) {
	return Line2D.ptSegDistSq(this.x1, this.y1, this.x2, this.y2, px, py);
}

/*
	public double ptSegDistSq(Point2D pt) {
		return ptSegDistSq(getX1(), getY1(), getX2(), getY2(),
	      pt.getX(), pt.getY());
	}
	*/
	

Line2D.prototype.ptSegDist = function(px, py) {
	return Line2D.ptSegDist(this.x1, this.y1, this.x2, this.y2, px, py);
}

/*	
	public double ptSegDist(Point2D pt) {
		return ptSegDist(getX1(), getY1(), getX2(), getY2(),
	    pt.getX(), pt.getY());
	}
	
	*/

Line2D.ptLineDistSq = function(x1, y1, x2, y2, px, py) {
	x2 -= x1;
	y2 -= y1;
	px -= x1;
	py -= y1;
	var dotprod = px * x2 + py * y2;
	var projlenSq = dotprod * dotprod / (x2 * x2 + y2 * y2);
	var lenSq = px * px + py * py - projlenSq;
	if (lenSq < 0) {
		lenSq = 0;
	}
	return lenSq;
}
	
Line2D.ptLineDist = function(x1, y1, x2, y2, px, py) {
	return Math.sqrt(ptLineDistSq(x1, y1, x2, y2, px, py));
}
	
Line2D.prototype.ptLineDistSq = function(px, py) {
	return ptLineDistSq(this.x1, this.y1, this.x2, this.y2, px, py);
}

Line2D.prototype.ptLineDist = function(px, py) {
	return ptLineDist(this.x1, this.y1, this.x2, this.y2, px, py);
}

/*	
	public double ptLineDistSq(Point2D pt) {
		return ptLineDistSq(getX1(), getY1(), getX2(), getY2(),
				pt.getX(), pt.getY());
	}

	public double ptLineDist(Point2D pt) {
		return ptLineDist(getX1(), getY1(), getX2(), getY2(),
				pt.getX(), pt.getY());
	}
	
	
	public boolean contains(double x, double y) {
		return false;
	}
	
	public boolean contains(Point2D p) {
		return false;
	}
	
	*/

	/**
	* {@inheritDoc}
	* @since 1.2
	*/

/*
	public boolean intersects(double x, double y, double w, double h) {
		return intersects(new Rectangle2D(x, y, w, h));
	}
	
	public boolean intersects(Rectangle2D r) {
		return r.intersectsLine(getX1(), getY1(), getX2(), getY2());
	}
	
	
	public boolean contains(double x, double y, double w, double h) {
		return false;
	}
	
	public boolean contains(Rectangle2D r) {
		return false;
	}
	
	public Rectangle2D getBounds() {
		return getBounds2D();
	}
	
	public Object clone() {
		return new Line2D(x1, y1, x2, y2);
	}
	*/

function Rectangle2D(x, y, width, height) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
}

Rectangle2D.OUT_LEFT = 1;
Rectangle2D.OUT_TOP = 2;
Rectangle2D.OUT_RIGHT = 4;
Rectangle2D.OUT_BOTTOM = 8;

Rectangle2D.prototype.getX = function() {
	return this.x;
}

Rectangle2D.prototype.getY = function() {
	return this.y;
}

Rectangle2D.prototype.getWidth = function() {
	return this.width;
}

Rectangle2D.prototype.getHeight = function() {
	return this.height;
}

Rectangle2D.prototype.contains = function(x, y) {
    var x0 = this.getX();
    var y0 = this.getY();
    return (x >= x0 &&
            y >= y0 &&
            x < x0 + this.getWidth() &&
            y < y0 + this.getHeight());
}

Rectangle2D.contains = function(rect,p) {
    return (p.x >= rect.x &&
            p.y >= rect.y &&
            p.x < rect.x + rect.width &&
            p.y < rect.y + rect.height);	
}

module.exports = {
	Point2D : Point2D,
	Line2D : Line2D,
	Rectangle2D : Rectangle2D
}
},{}],17:[function(require,module,exports){
var EventEmitter = require('eventemitter2').EventEmitter2;
var util = require('util');
var uuid = require('uuid');


Player.TYPE_HUMAN = 1;
Player.TYPE_ENEMY = 2;
Player.TYPE_GAIA = 3;

function Player(_options) {
	var that = this;
	EventEmitter.call(this);
	this.options = _options || {};
	this._type = this.options.type || Player.TYPE_HUMAN;
	this._resources = {
		"tree" : 0,
		"food" : 0,
		"stone" : 0,
		"metal" : 0
	};
}

util.inherits(Player, EventEmitter);

Player.prototype.resource = function(type) {
	return this._resources[type];
}

Player.prototype.addResource = function(type, inc) {
	this._resources[type] += inc;
	this.emit('update', this);
}

module.exports = Player;
},{"eventemitter2":6,"util":4,"uuid":8}],18:[function(require,module,exports){
var Snap = require('../../thirdparty/snap.svg');

function UnitGraphic(s, options) {
	var that = this;
	this.group = s.g();
	this.bound = {x:0,y:0};
	this._rotate = 0;
	this.options = options;
	Snap.load(options.path, function (f) {
		console.log(options.path + ' loaded svg.', f);
	    g = f.select("g");
	    that.group.append(g);
	});
}

UnitGraphic.prototype.remove = function() {
	this.group.remove();
}

UnitGraphic.prototype.click = function(cb) {
	this.group.mouseup(cb);
}

UnitGraphic.prototype.getPos = function() {
	
}
UnitGraphic.prototype.getWidth = function() {

}

UnitGraphic.prototype.setPos = function(x, y) {
	this.bound.x = x;
	this.bound.y = y;
	this.applyDisplay();
}

UnitGraphic.prototype.rotate = function(r) {
	this._rotate = r;
	this.applyDisplay();
}

UnitGraphic.prototype.setSize = function(sizeX, sizeY) {
	this._width = sizeX;
	this._height = sizeY;
	this._scaleX = sizeX / this.options.width;
	this._scaleY = sizeY / this.options.height;
	this.applyDisplay();
}

UnitGraphic.prototype.applyDisplay = function() {
	var myMatrix = new Snap.Matrix();
	myMatrix.translate(this.bound.x+(this._width/2), this.bound.y+(this._height/2));
	myMatrix.rotate(this._rotate);
	myMatrix.scale(this._scaleX, this._scaleY);
	myMatrix.translate(-(this.options.width/2), -(this.options.height/2));
	this.group.transform(myMatrix);
}

module.exports = UnitGraphic;
},{"../../thirdparty/snap.svg":24}],19:[function(require,module,exports){
var Snap = require('../thirdparty/snap.svg');
var unitInfo = require('./unit');
var Game = require('./core');

function RTS() {

}

RTS.prototype.start = function() {
	window.addEventListener('load', function() {

		var requestAnimationFrame = getRequestAnimationFrame();

		//var item = new PanelItem();
		//gameを作成
		var game = new Game(requestAnimationFrame);
		//item.add(game);
	});
}

function getRequestAnimationFrame() {
	return window.requestAnimationFrame ||
	                window.webkitRequestAnimationFrame ||
	                window.mozRequestAnimationFrame    ||
	                window.oRequestAnimationFrame      ||
	                window.msRequestAnimationFrame     ||
	                null ;
}

window.RTS = new RTS();

module.exports = RTS;


function PanelItem() {

}
},{"../thirdparty/snap.svg":24,"./core":15,"./unit":22}],20:[function(require,module,exports){
function ControlPanel() {
	var that = this;
	//var wrapper = document.createElement('div');
	//wrapper.classList.add('control-panel-wrapper');
	//document.body.appendChild(wrapper)
	this.infoElem = document.getElementById('cp-info');
	this.target = null;
	setInterval(function() {
		if(that.target) that.infoElem.innerHTML = that.target.toString();
	}, 2000);
}

ControlPanel.prototype.setTarget = function(target) {
	this.target = target;
	this.infoElem.innerHTML = target.toString();
}

module.exports = ControlPanel;
},{}],21:[function(require,module,exports){
module.exports = {
	snap : null,
	start : function(x, y) {
		this.x = x;
		this.y = y;
		this.start_x = x;
		this.start_y = y;
		this.rect = this.snap.rect(x, y, 1, 1);
		this.rect.attr({
			fill : "none",
			stroke : "#333",
			strokeWidth : 2
		});
	},
	end : function() {
		this.rect.remove();
	},
	move : function(dx, dy) {
		if(dx < 0) this.x = this.start_x + dx;
		if(dy < 0) this.y = this.start_y + dy;
		this.width = Math.abs(dx);
		this.height = Math.abs(dy);
		this.rect.attr({
			x : this.x,
			y : this.y,
			width : this.width,
			height : this.height
		});
	},
	isContain : function(pos) {
		return this.x < pos.getX() && this.y < pos.getY() && (pos.getX() < this.x + this.width) && (pos.getY() < this.y + this.height);
	}
}
},{}],22:[function(require,module,exports){
module.exports = [{
	id : 'villager',
	name : '市民',
	graphic : {
		path : 'unit/city.svg',
		width : 80,
		height : 80,
	},
	unitinfo : {
		type : 'trainable',
		size : 1
	}
},{
	id : 'militia',
	name : '市民',
	graphic : {
		path : 'unit/sword.svg',
		width : 80,
		height : 80,
	},
	unitinfo : {
		type : 'trainable',
		size : 1
	}
},{
	id : 'town',
	name : '町の中心',
	graphic : {
		path : 'building/town.svg',
		width : 320,
		height : 320,
	},
	unitinfo : {
		type : 'building',
		size : [3, 3]
	}
},{
	id : 'tree',
	name : '木',
	graphic : {
		path : 'nature/tree.svg',
		width : 160,
		height : 160
	},
	unitinfo : {
		type : 'nature',
		size : 1
	}
},{
	id : 'fruit',
	name : '果物',
	graphic : {
		path : 'nature/fruits.svg',
		width : 160,
		height : 160
	},
	unitinfo : {
		type : 'nature',
		size : 1
	}
}]
},{}],23:[function(require,module,exports){
module.exports = {
	name : "*",
	logger : function(name) {
		return function() {
			if(name.match(this.name)) {
				console.log.apply(console, arguments);
				/*
				var dom = document.createElement('div');
				dom.textContent = JSON.stringify(arguments);
				document.getElementById('debug').appendChild(dom);
				*/
			}
		}
	}
}
},{}],24:[function(require,module,exports){
// Snap.svg 0.4.1
//
// Copyright (c) 2013 – 2015 Adobe Systems Incorporated. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// build: 2015-04-13

// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// ┌────────────────────────────────────────────────────────────┐ \\
// │ Eve 0.4.2 - JavaScript Events Library                      │ \\
// ├────────────────────────────────────────────────────────────┤ \\
// │ Author Dmitry Baranovskiy (http://dmitry.baranovskiy.com/) │ \\
// └────────────────────────────────────────────────────────────┘ \\

(function (glob) {
    var version = "0.4.2",
        has = "hasOwnProperty",
        separator = /[\.\/]/,
        comaseparator = /\s*,\s*/,
        wildcard = "*",
        fun = function () {},
        numsort = function (a, b) {
            return a - b;
        },
        current_event,
        stop,
        events = {n: {}},
        firstDefined = function () {
            for (var i = 0, ii = this.length; i < ii; i++) {
                if (typeof this[i] != "undefined") {
                    return this[i];
                }
            }
        },
        lastDefined = function () {
            var i = this.length;
            while (--i) {
                if (typeof this[i] != "undefined") {
                    return this[i];
                }
            }
        },
    /*\
     * eve
     [ method ]

     * Fires event with given `name`, given scope and other parameters.

     > Arguments

     - name (string) name of the *event*, dot (`.`) or slash (`/`) separated
     - scope (object) context for the event handlers
     - varargs (...) the rest of arguments will be sent to event handlers

     = (object) array of returned values from the listeners. Array has two methods `.firstDefined()` and `.lastDefined()` to get first or last not `undefined` value.
    \*/
        eve = function (name, scope) {
            name = String(name);
            var e = events,
                oldstop = stop,
                args = Array.prototype.slice.call(arguments, 2),
                listeners = eve.listeners(name),
                z = 0,
                f = false,
                l,
                indexed = [],
                queue = {},
                out = [],
                ce = current_event,
                errors = [];
            out.firstDefined = firstDefined;
            out.lastDefined = lastDefined;
            current_event = name;
            stop = 0;
            for (var i = 0, ii = listeners.length; i < ii; i++) if ("zIndex" in listeners[i]) {
                indexed.push(listeners[i].zIndex);
                if (listeners[i].zIndex < 0) {
                    queue[listeners[i].zIndex] = listeners[i];
                }
            }
            indexed.sort(numsort);
            while (indexed[z] < 0) {
                l = queue[indexed[z++]];
                out.push(l.apply(scope, args));
                if (stop) {
                    stop = oldstop;
                    return out;
                }
            }
            for (i = 0; i < ii; i++) {
                l = listeners[i];
                if ("zIndex" in l) {
                    if (l.zIndex == indexed[z]) {
                        out.push(l.apply(scope, args));
                        if (stop) {
                            break;
                        }
                        do {
                            z++;
                            l = queue[indexed[z]];
                            l && out.push(l.apply(scope, args));
                            if (stop) {
                                break;
                            }
                        } while (l)
                    } else {
                        queue[l.zIndex] = l;
                    }
                } else {
                    out.push(l.apply(scope, args));
                    if (stop) {
                        break;
                    }
                }
            }
            stop = oldstop;
            current_event = ce;
            return out;
        };
        // Undocumented. Debug only.
        eve._events = events;
    /*\
     * eve.listeners
     [ method ]

     * Internal method which gives you array of all event handlers that will be triggered by the given `name`.

     > Arguments

     - name (string) name of the event, dot (`.`) or slash (`/`) separated

     = (array) array of event handlers
    \*/
    eve.listeners = function (name) {
        var names = name.split(separator),
            e = events,
            item,
            items,
            k,
            i,
            ii,
            j,
            jj,
            nes,
            es = [e],
            out = [];
        for (i = 0, ii = names.length; i < ii; i++) {
            nes = [];
            for (j = 0, jj = es.length; j < jj; j++) {
                e = es[j].n;
                items = [e[names[i]], e[wildcard]];
                k = 2;
                while (k--) {
                    item = items[k];
                    if (item) {
                        nes.push(item);
                        out = out.concat(item.f || []);
                    }
                }
            }
            es = nes;
        }
        return out;
    };
    
    /*\
     * eve.on
     [ method ]
     **
     * Binds given event handler with a given name. You can use wildcards “`*`” for the names:
     | eve.on("*.under.*", f);
     | eve("mouse.under.floor"); // triggers f
     * Use @eve to trigger the listener.
     **
     > Arguments
     **
     - name (string) name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
     - f (function) event handler function
     **
     = (function) returned function accepts a single numeric parameter that represents z-index of the handler. It is an optional feature and only used when you need to ensure that some subset of handlers will be invoked in a given order, despite of the order of assignment. 
     > Example:
     | eve.on("mouse", eatIt)(2);
     | eve.on("mouse", scream);
     | eve.on("mouse", catchIt)(1);
     * This will ensure that `catchIt` function will be called before `eatIt`.
     *
     * If you want to put your handler before non-indexed handlers, specify a negative value.
     * Note: I assume most of the time you don’t need to worry about z-index, but it’s nice to have this feature “just in case”.
    \*/
    eve.on = function (name, f) {
        name = String(name);
        if (typeof f != "function") {
            return function () {};
        }
        var names = name.split(comaseparator);
        for (var i = 0, ii = names.length; i < ii; i++) {
            (function (name) {
                var names = name.split(separator),
                    e = events,
                    exist;
                for (var i = 0, ii = names.length; i < ii; i++) {
                    e = e.n;
                    e = e.hasOwnProperty(names[i]) && e[names[i]] || (e[names[i]] = {n: {}});
                }
                e.f = e.f || [];
                for (i = 0, ii = e.f.length; i < ii; i++) if (e.f[i] == f) {
                    exist = true;
                    break;
                }
                !exist && e.f.push(f);
            }(names[i]));
        }
        return function (zIndex) {
            if (+zIndex == +zIndex) {
                f.zIndex = +zIndex;
            }
        };
    };
    /*\
     * eve.f
     [ method ]
     **
     * Returns function that will fire given event with optional arguments.
     * Arguments that will be passed to the result function will be also
     * concated to the list of final arguments.
     | el.onclick = eve.f("click", 1, 2);
     | eve.on("click", function (a, b, c) {
     |     console.log(a, b, c); // 1, 2, [event object]
     | });
     > Arguments
     - event (string) event name
     - varargs (…) and any other arguments
     = (function) possible event handler function
    \*/
    eve.f = function (event) {
        var attrs = [].slice.call(arguments, 1);
        return function () {
            eve.apply(null, [event, null].concat(attrs).concat([].slice.call(arguments, 0)));
        };
    };
    /*\
     * eve.stop
     [ method ]
     **
     * Is used inside an event handler to stop the event, preventing any subsequent listeners from firing.
    \*/
    eve.stop = function () {
        stop = 1;
    };
    /*\
     * eve.nt
     [ method ]
     **
     * Could be used inside event handler to figure out actual name of the event.
     **
     > Arguments
     **
     - subname (string) #optional subname of the event
     **
     = (string) name of the event, if `subname` is not specified
     * or
     = (boolean) `true`, if current event’s name contains `subname`
    \*/
    eve.nt = function (subname) {
        if (subname) {
            return new RegExp("(?:\\.|\\/|^)" + subname + "(?:\\.|\\/|$)").test(current_event);
        }
        return current_event;
    };
    /*\
     * eve.nts
     [ method ]
     **
     * Could be used inside event handler to figure out actual name of the event.
     **
     **
     = (array) names of the event
    \*/
    eve.nts = function () {
        return current_event.split(separator);
    };
    /*\
     * eve.off
     [ method ]
     **
     * Removes given function from the list of event listeners assigned to given name.
     * If no arguments specified all the events will be cleared.
     **
     > Arguments
     **
     - name (string) name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
     - f (function) event handler function
    \*/
    /*\
     * eve.unbind
     [ method ]
     **
     * See @eve.off
    \*/
    eve.off = eve.unbind = function (name, f) {
        if (!name) {
            eve._events = events = {n: {}};
            return;
        }
        var names = name.split(comaseparator);
        if (names.length > 1) {
            for (var i = 0, ii = names.length; i < ii; i++) {
                eve.off(names[i], f);
            }
            return;
        }
        names = name.split(separator);
        var e,
            key,
            splice,
            i, ii, j, jj,
            cur = [events];
        for (i = 0, ii = names.length; i < ii; i++) {
            for (j = 0; j < cur.length; j += splice.length - 2) {
                splice = [j, 1];
                e = cur[j].n;
                if (names[i] != wildcard) {
                    if (e[names[i]]) {
                        splice.push(e[names[i]]);
                    }
                } else {
                    for (key in e) if (e[has](key)) {
                        splice.push(e[key]);
                    }
                }
                cur.splice.apply(cur, splice);
            }
        }
        for (i = 0, ii = cur.length; i < ii; i++) {
            e = cur[i];
            while (e.n) {
                if (f) {
                    if (e.f) {
                        for (j = 0, jj = e.f.length; j < jj; j++) if (e.f[j] == f) {
                            e.f.splice(j, 1);
                            break;
                        }
                        !e.f.length && delete e.f;
                    }
                    for (key in e.n) if (e.n[has](key) && e.n[key].f) {
                        var funcs = e.n[key].f;
                        for (j = 0, jj = funcs.length; j < jj; j++) if (funcs[j] == f) {
                            funcs.splice(j, 1);
                            break;
                        }
                        !funcs.length && delete e.n[key].f;
                    }
                } else {
                    delete e.f;
                    for (key in e.n) if (e.n[has](key) && e.n[key].f) {
                        delete e.n[key].f;
                    }
                }
                e = e.n;
            }
        }
    };
    /*\
     * eve.once
     [ method ]
     **
     * Binds given event handler with a given name to only run once then unbind itself.
     | eve.once("login", f);
     | eve("login"); // triggers f
     | eve("login"); // no listeners
     * Use @eve to trigger the listener.
     **
     > Arguments
     **
     - name (string) name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
     - f (function) event handler function
     **
     = (function) same return function as @eve.on
    \*/
    eve.once = function (name, f) {
        var f2 = function () {
            eve.unbind(name, f2);
            return f.apply(this, arguments);
        };
        return eve.on(name, f2);
    };
    /*\
     * eve.version
     [ property (string) ]
     **
     * Current version of the library.
    \*/
    eve.version = version;
    eve.toString = function () {
        return "You are running Eve " + version;
    };
    (typeof module != "undefined" && module.exports) ? (module.exports = eve) : (typeof define === "function" && define.amd ? (define("eve", [], function() { return eve; })) : (glob.eve = eve));
})(this);

(function (glob, factory) {
    // AMD support
    if (typeof define == "function" && define.amd) {
        // Define as an anonymous module
        define(["eve"], function (eve) {
            return factory(glob, eve);
        });
    } else if (typeof exports != 'undefined') {
        // Next for Node.js or CommonJS
        var eve = require('eve');
        module.exports = factory(glob, eve);
    } else {
        // Browser globals (glob is window)
        // Snap adds itself to window
        factory(glob, glob.eve);
    }
}(window || this, function (window, eve) {

// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
var mina = (function (eve) {
    var animations = {},
    requestAnimFrame = window.requestAnimationFrame       ||
                       window.webkitRequestAnimationFrame ||
                       window.mozRequestAnimationFrame    ||
                       window.oRequestAnimationFrame      ||
                       window.msRequestAnimationFrame     ||
                       function (callback) {
                           setTimeout(callback, 16);
                       },
    isArray = Array.isArray || function (a) {
        return a instanceof Array ||
            Object.prototype.toString.call(a) == "[object Array]";
    },
    idgen = 0,
    idprefix = "M" + (+new Date).toString(36),
    ID = function () {
        return idprefix + (idgen++).toString(36);
    },
    diff = function (a, b, A, B) {
        if (isArray(a)) {
            res = [];
            for (var i = 0, ii = a.length; i < ii; i++) {
                res[i] = diff(a[i], b, A[i], B);
            }
            return res;
        }
        var dif = (A - a) / (B - b);
        return function (bb) {
            return a + dif * (bb - b);
        };
    },
    timer = Date.now || function () {
        return +new Date;
    },
    sta = function (val) {
        var a = this;
        if (val == null) {
            return a.s;
        }
        var ds = a.s - val;
        a.b += a.dur * ds;
        a.B += a.dur * ds;
        a.s = val;
    },
    speed = function (val) {
        var a = this;
        if (val == null) {
            return a.spd;
        }
        a.spd = val;
    },
    duration = function (val) {
        var a = this;
        if (val == null) {
            return a.dur;
        }
        a.s = a.s * val / a.dur;
        a.dur = val;
    },
    stopit = function () {
        var a = this;
        delete animations[a.id];
        a.update();
        eve("mina.stop." + a.id, a);
    },
    pause = function () {
        var a = this;
        if (a.pdif) {
            return;
        }
        delete animations[a.id];
        a.update();
        a.pdif = a.get() - a.b;
    },
    resume = function () {
        var a = this;
        if (!a.pdif) {
            return;
        }
        a.b = a.get() - a.pdif;
        delete a.pdif;
        animations[a.id] = a;
    },
    update = function () {
        var a = this,
            res;
        if (isArray(a.start)) {
            res = [];
            for (var j = 0, jj = a.start.length; j < jj; j++) {
                res[j] = +a.start[j] +
                    (a.end[j] - a.start[j]) * a.easing(a.s);
            }
        } else {
            res = +a.start + (a.end - a.start) * a.easing(a.s);
        }
        a.set(res);
    },
    frame = function () {
        var len = 0;
        for (var i in animations) if (animations.hasOwnProperty(i)) {
            var a = animations[i],
                b = a.get(),
                res;
            len++;
            a.s = (b - a.b) / (a.dur / a.spd);
            if (a.s >= 1) {
                delete animations[i];
                a.s = 1;
                len--;
                (function (a) {
                    setTimeout(function () {
                        eve("mina.finish." + a.id, a);
                    });
                }(a));
            }
            a.update();
        }
        len && requestAnimFrame(frame);
    },
    /*\
     * mina
     [ method ]
     **
     * Generic animation of numbers
     **
     - a (number) start _slave_ number
     - A (number) end _slave_ number
     - b (number) start _master_ number (start time in general case)
     - B (number) end _master_ number (end time in gereal case)
     - get (function) getter of _master_ number (see @mina.time)
     - set (function) setter of _slave_ number
     - easing (function) #optional easing function, default is @mina.linear
     = (object) animation descriptor
     o {
     o         id (string) animation id,
     o         start (number) start _slave_ number,
     o         end (number) end _slave_ number,
     o         b (number) start _master_ number,
     o         s (number) animation status (0..1),
     o         dur (number) animation duration,
     o         spd (number) animation speed,
     o         get (function) getter of _master_ number (see @mina.time),
     o         set (function) setter of _slave_ number,
     o         easing (function) easing function, default is @mina.linear,
     o         status (function) status getter/setter,
     o         speed (function) speed getter/setter,
     o         duration (function) duration getter/setter,
     o         stop (function) animation stopper
     o         pause (function) pauses the animation
     o         resume (function) resumes the animation
     o         update (function) calles setter with the right value of the animation
     o }
    \*/
    mina = function (a, A, b, B, get, set, easing) {
        var anim = {
            id: ID(),
            start: a,
            end: A,
            b: b,
            s: 0,
            dur: B - b,
            spd: 1,
            get: get,
            set: set,
            easing: easing || mina.linear,
            status: sta,
            speed: speed,
            duration: duration,
            stop: stopit,
            pause: pause,
            resume: resume,
            update: update
        };
        animations[anim.id] = anim;
        var len = 0, i;
        for (i in animations) if (animations.hasOwnProperty(i)) {
            len++;
            if (len == 2) {
                break;
            }
        }
        len == 1 && requestAnimFrame(frame);
        return anim;
    };
    /*\
     * mina.time
     [ method ]
     **
     * Returns the current time. Equivalent to:
     | function () {
     |     return (new Date).getTime();
     | }
    \*/
    mina.time = timer;
    /*\
     * mina.getById
     [ method ]
     **
     * Returns an animation by its id
     - id (string) animation's id
     = (object) See @mina
    \*/
    mina.getById = function (id) {
        return animations[id] || null;
    };

    /*\
     * mina.linear
     [ method ]
     **
     * Default linear easing
     - n (number) input 0..1
     = (number) output 0..1
    \*/
    mina.linear = function (n) {
        return n;
    };
    /*\
     * mina.easeout
     [ method ]
     **
     * Easeout easing
     - n (number) input 0..1
     = (number) output 0..1
    \*/
    mina.easeout = function (n) {
        return Math.pow(n, 1.7);
    };
    /*\
     * mina.easein
     [ method ]
     **
     * Easein easing
     - n (number) input 0..1
     = (number) output 0..1
    \*/
    mina.easein = function (n) {
        return Math.pow(n, .48);
    };
    /*\
     * mina.easeinout
     [ method ]
     **
     * Easeinout easing
     - n (number) input 0..1
     = (number) output 0..1
    \*/
    mina.easeinout = function (n) {
        if (n == 1) {
            return 1;
        }
        if (n == 0) {
            return 0;
        }
        var q = .48 - n / 1.04,
            Q = Math.sqrt(.1734 + q * q),
            x = Q - q,
            X = Math.pow(Math.abs(x), 1 / 3) * (x < 0 ? -1 : 1),
            y = -Q - q,
            Y = Math.pow(Math.abs(y), 1 / 3) * (y < 0 ? -1 : 1),
            t = X + Y + .5;
        return (1 - t) * 3 * t * t + t * t * t;
    };
    /*\
     * mina.backin
     [ method ]
     **
     * Backin easing
     - n (number) input 0..1
     = (number) output 0..1
    \*/
    mina.backin = function (n) {
        if (n == 1) {
            return 1;
        }
        var s = 1.70158;
        return n * n * ((s + 1) * n - s);
    };
    /*\
     * mina.backout
     [ method ]
     **
     * Backout easing
     - n (number) input 0..1
     = (number) output 0..1
    \*/
    mina.backout = function (n) {
        if (n == 0) {
            return 0;
        }
        n = n - 1;
        var s = 1.70158;
        return n * n * ((s + 1) * n + s) + 1;
    };
    /*\
     * mina.elastic
     [ method ]
     **
     * Elastic easing
     - n (number) input 0..1
     = (number) output 0..1
    \*/
    mina.elastic = function (n) {
        if (n == !!n) {
            return n;
        }
        return Math.pow(2, -10 * n) * Math.sin((n - .075) *
            (2 * Math.PI) / .3) + 1;
    };
    /*\
     * mina.bounce
     [ method ]
     **
     * Bounce easing
     - n (number) input 0..1
     = (number) output 0..1
    \*/
    mina.bounce = function (n) {
        var s = 7.5625,
            p = 2.75,
            l;
        if (n < (1 / p)) {
            l = s * n * n;
        } else {
            if (n < (2 / p)) {
                n -= (1.5 / p);
                l = s * n * n + .75;
            } else {
                if (n < (2.5 / p)) {
                    n -= (2.25 / p);
                    l = s * n * n + .9375;
                } else {
                    n -= (2.625 / p);
                    l = s * n * n + .984375;
                }
            }
        }
        return l;
    };
    window.mina = mina;
    return mina;
})(typeof eve == "undefined" ? function () {} : eve);
// Copyright (c) 2013 - 2015 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var Snap = (function(root) {
Snap.version = "0.4.0";
/*\
 * Snap
 [ method ]
 **
 * Creates a drawing surface or wraps existing SVG element.
 **
 - width (number|string) width of surface
 - height (number|string) height of surface
 * or
 - DOM (SVGElement) element to be wrapped into Snap structure
 * or
 - array (array) array of elements (will return set of elements)
 * or
 - query (string) CSS query selector
 = (object) @Element
\*/
function Snap(w, h) {
    if (w) {
        if (w.nodeType) {
            return wrap(w);
        }
        if (is(w, "array") && Snap.set) {
            return Snap.set.apply(Snap, w);
        }
        if (w instanceof Element) {
            return w;
        }
        if (h == null) {
            w = glob.doc.querySelector(String(w));
            return wrap(w);
        }
    }
    w = w == null ? "100%" : w;
    h = h == null ? "100%" : h;
    return new Paper(w, h);
}
Snap.toString = function () {
    return "Snap v" + this.version;
};
Snap._ = {};
var glob = {
    win: root.window,
    doc: root.window.document
};
Snap._.glob = glob;
var has = "hasOwnProperty",
    Str = String,
    toFloat = parseFloat,
    toInt = parseInt,
    math = Math,
    mmax = math.max,
    mmin = math.min,
    abs = math.abs,
    pow = math.pow,
    PI = math.PI,
    round = math.round,
    E = "",
    S = " ",
    objectToString = Object.prototype.toString,
    ISURL = /^url\(['"]?([^\)]+?)['"]?\)$/i,
    colourRegExp = /^\s*((#[a-f\d]{6})|(#[a-f\d]{3})|rgba?\(\s*([\d\.]+%?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+%?(?:\s*,\s*[\d\.]+%?)?)\s*\)|hsba?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?%?)\s*\)|hsla?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?%?)\s*\))\s*$/i,
    bezierrg = /^(?:cubic-)?bezier\(([^,]+),([^,]+),([^,]+),([^\)]+)\)/,
    reURLValue = /^url\(#?([^)]+)\)$/,
    separator = Snap._.separator = /[,\s]+/,
    whitespace = /[\s]/g,
    commaSpaces = /[\s]*,[\s]*/,
    hsrg = {hs: 1, rg: 1},
    pathCommand = /([a-z])[\s,]*((-?\d*\.?\d*(?:e[\-+]?\d+)?[\s]*,?[\s]*)+)/ig,
    tCommand = /([rstm])[\s,]*((-?\d*\.?\d*(?:e[\-+]?\d+)?[\s]*,?[\s]*)+)/ig,
    pathValues = /(-?\d*\.?\d*(?:e[\-+]?\\d+)?)[\s]*,?[\s]*/ig,
    idgen = 0,
    idprefix = "S" + (+new Date).toString(36),
    ID = function (el) {
        return (el && el.type ? el.type : E) + idprefix + (idgen++).toString(36);
    },
    xlink = "http://www.w3.org/1999/xlink",
    xmlns = "http://www.w3.org/2000/svg",
    hub = {},
    URL = Snap.url = function (url) {
        return "url('#" + url + "')";
    };

function $(el, attr) {
    if (attr) {
        if (el == "#text") {
            el = glob.doc.createTextNode(attr.text || attr["#text"] || "");
        }
        if (el == "#comment") {
            el = glob.doc.createComment(attr.text || attr["#text"] || "");
        }
        if (typeof el == "string") {
            el = $(el);
        }
        if (typeof attr == "string") {
            if (el.nodeType == 1) {
                if (attr.substring(0, 6) == "xlink:") {
                    return el.getAttributeNS(xlink, attr.substring(6));
                }
                if (attr.substring(0, 4) == "xml:") {
                    return el.getAttributeNS(xmlns, attr.substring(4));
                }
                return el.getAttribute(attr);
            } else if (attr == "text") {
                return el.nodeValue;
            } else {
                return null;
            }
        }
        if (el.nodeType == 1) {
            for (var key in attr) if (attr[has](key)) {
                var val = Str(attr[key]);
                if (val) {
                    if (key.substring(0, 6) == "xlink:") {
                        el.setAttributeNS(xlink, key.substring(6), val);
                    } else if (key.substring(0, 4) == "xml:") {
                        el.setAttributeNS(xmlns, key.substring(4), val);
                    } else {
                        el.setAttribute(key, val);
                    }
                } else {
                    el.removeAttribute(key);
                }
            }
        } else if ("text" in attr) {
            el.nodeValue = attr.text;
        }
    } else {
        el = glob.doc.createElementNS(xmlns, el);
    }
    return el;
}
Snap._.$ = $;
Snap._.id = ID;
function getAttrs(el) {
    var attrs = el.attributes,
        name,
        out = {};
    for (var i = 0; i < attrs.length; i++) {
        if (attrs[i].namespaceURI == xlink) {
            name = "xlink:";
        } else {
            name = "";
        }
        name += attrs[i].name;
        out[name] = attrs[i].textContent;
    }
    return out;
}
function is(o, type) {
    type = Str.prototype.toLowerCase.call(type);
    if (type == "finite") {
        return isFinite(o);
    }
    if (type == "array" &&
        (o instanceof Array || Array.isArray && Array.isArray(o))) {
        return true;
    }
    return  (type == "null" && o === null) ||
            (type == typeof o && o !== null) ||
            (type == "object" && o === Object(o)) ||
            objectToString.call(o).slice(8, -1).toLowerCase() == type;
}
/*\
 * Snap.format
 [ method ]
 **
 * Replaces construction of type `{<name>}` to the corresponding argument
 **
 - token (string) string to format
 - json (object) object which properties are used as a replacement
 = (string) formatted string
 > Usage
 | // this draws a rectangular shape equivalent to "M10,20h40v50h-40z"
 | paper.path(Snap.format("M{x},{y}h{dim.width}v{dim.height}h{dim['negative width']}z", {
 |     x: 10,
 |     y: 20,
 |     dim: {
 |         width: 40,
 |         height: 50,
 |         "negative width": -40
 |     }
 | }));
\*/
Snap.format = (function () {
    var tokenRegex = /\{([^\}]+)\}/g,
        objNotationRegex = /(?:(?:^|\.)(.+?)(?=\[|\.|$|\()|\[('|")(.+?)\2\])(\(\))?/g, // matches .xxxxx or ["xxxxx"] to run over object properties
        replacer = function (all, key, obj) {
            var res = obj;
            key.replace(objNotationRegex, function (all, name, quote, quotedName, isFunc) {
                name = name || quotedName;
                if (res) {
                    if (name in res) {
                        res = res[name];
                    }
                    typeof res == "function" && isFunc && (res = res());
                }
            });
            res = (res == null || res == obj ? all : res) + "";
            return res;
        };
    return function (str, obj) {
        return Str(str).replace(tokenRegex, function (all, key) {
            return replacer(all, key, obj);
        });
    };
})();
function clone(obj) {
    if (typeof obj == "function" || Object(obj) !== obj) {
        return obj;
    }
    var res = new obj.constructor;
    for (var key in obj) if (obj[has](key)) {
        res[key] = clone(obj[key]);
    }
    return res;
}
Snap._.clone = clone;
function repush(array, item) {
    for (var i = 0, ii = array.length; i < ii; i++) if (array[i] === item) {
        return array.push(array.splice(i, 1)[0]);
    }
}
function cacher(f, scope, postprocessor) {
    function newf() {
        var arg = Array.prototype.slice.call(arguments, 0),
            args = arg.join("\u2400"),
            cache = newf.cache = newf.cache || {},
            count = newf.count = newf.count || [];
        if (cache[has](args)) {
            repush(count, args);
            return postprocessor ? postprocessor(cache[args]) : cache[args];
        }
        count.length >= 1e3 && delete cache[count.shift()];
        count.push(args);
        cache[args] = f.apply(scope, arg);
        return postprocessor ? postprocessor(cache[args]) : cache[args];
    }
    return newf;
}
Snap._.cacher = cacher;
function angle(x1, y1, x2, y2, x3, y3) {
    if (x3 == null) {
        var x = x1 - x2,
            y = y1 - y2;
        if (!x && !y) {
            return 0;
        }
        return (180 + math.atan2(-y, -x) * 180 / PI + 360) % 360;
    } else {
        return angle(x1, y1, x3, y3) - angle(x2, y2, x3, y3);
    }
}
function rad(deg) {
    return deg % 360 * PI / 180;
}
function deg(rad) {
    return rad * 180 / PI % 360;
}
function x_y() {
    return this.x + S + this.y;
}
function x_y_w_h() {
    return this.x + S + this.y + S + this.width + " \xd7 " + this.height;
}

/*\
 * Snap.rad
 [ method ]
 **
 * Transform angle to radians
 - deg (number) angle in degrees
 = (number) angle in radians
\*/
Snap.rad = rad;
/*\
 * Snap.deg
 [ method ]
 **
 * Transform angle to degrees
 - rad (number) angle in radians
 = (number) angle in degrees
\*/
Snap.deg = deg;
/*\
 * Snap.sin
 [ method ]
 **
 * Equivalent to `Math.sin()` only works with degrees, not radians.
 - angle (number) angle in degrees
 = (number) sin
\*/
Snap.sin = function (angle) {
    return math.sin(Snap.rad(angle));
};
/*\
 * Snap.tan
 [ method ]
 **
 * Equivalent to `Math.tan()` only works with degrees, not radians.
 - angle (number) angle in degrees
 = (number) tan
\*/
Snap.tan = function (angle) {
    return math.tan(Snap.rad(angle));
};
/*\
 * Snap.cos
 [ method ]
 **
 * Equivalent to `Math.cos()` only works with degrees, not radians.
 - angle (number) angle in degrees
 = (number) cos
\*/
Snap.cos = function (angle) {
    return math.cos(Snap.rad(angle));
};
/*\
 * Snap.asin
 [ method ]
 **
 * Equivalent to `Math.asin()` only works with degrees, not radians.
 - num (number) value
 = (number) asin in degrees
\*/
Snap.asin = function (num) {
    return Snap.deg(math.asin(num));
};
/*\
 * Snap.acos
 [ method ]
 **
 * Equivalent to `Math.acos()` only works with degrees, not radians.
 - num (number) value
 = (number) acos in degrees
\*/
Snap.acos = function (num) {
    return Snap.deg(math.acos(num));
};
/*\
 * Snap.atan
 [ method ]
 **
 * Equivalent to `Math.atan()` only works with degrees, not radians.
 - num (number) value
 = (number) atan in degrees
\*/
Snap.atan = function (num) {
    return Snap.deg(math.atan(num));
};
/*\
 * Snap.atan2
 [ method ]
 **
 * Equivalent to `Math.atan2()` only works with degrees, not radians.
 - num (number) value
 = (number) atan2 in degrees
\*/
Snap.atan2 = function (num) {
    return Snap.deg(math.atan2(num));
};
/*\
 * Snap.angle
 [ method ]
 **
 * Returns an angle between two or three points
 > Parameters
 - x1 (number) x coord of first point
 - y1 (number) y coord of first point
 - x2 (number) x coord of second point
 - y2 (number) y coord of second point
 - x3 (number) #optional x coord of third point
 - y3 (number) #optional y coord of third point
 = (number) angle in degrees
\*/
Snap.angle = angle;
/*\
 * Snap.len
 [ method ]
 **
 * Returns distance between two points
 > Parameters
 - x1 (number) x coord of first point
 - y1 (number) y coord of first point
 - x2 (number) x coord of second point
 - y2 (number) y coord of second point
 = (number) distance
\*/
Snap.len = function (x1, y1, x2, y2) {
    return Math.sqrt(Snap.len2(x1, y1, x2, y2));
};
/*\
 * Snap.len2
 [ method ]
 **
 * Returns squared distance between two points
 > Parameters
 - x1 (number) x coord of first point
 - y1 (number) y coord of first point
 - x2 (number) x coord of second point
 - y2 (number) y coord of second point
 = (number) distance
\*/
Snap.len2 = function (x1, y1, x2, y2) {
    return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
};
/*\
 * Snap.closestPoint
 [ method ]
 **
 * Returns closest point to a given one on a given path.
 > Parameters
 - path (Element) path element
 - x (number) x coord of a point
 - y (number) y coord of a point
 = (object) in format
 {
    x (number) x coord of the point on the path
    y (number) y coord of the point on the path
    length (number) length of the path to the point
    distance (number) distance from the given point to the path
 }
\*/
// Copied from http://bl.ocks.org/mbostock/8027637
Snap.closestPoint = function (path, x, y) {
    function distance2(p) {
        var dx = p.x - x,
            dy = p.y - y;
        return dx * dx + dy * dy;
    }
    var pathNode = path.node,
        pathLength = pathNode.getTotalLength(),
        precision = pathLength / pathNode.pathSegList.numberOfItems * .125,
        best,
        bestLength,
        bestDistance = Infinity;

    // linear scan for coarse approximation
    for (var scan, scanLength = 0, scanDistance; scanLength <= pathLength; scanLength += precision) {
        if ((scanDistance = distance2(scan = pathNode.getPointAtLength(scanLength))) < bestDistance) {
            best = scan, bestLength = scanLength, bestDistance = scanDistance;
        }
    }

    // binary search for precise estimate
    precision *= .5;
    while (precision > .5) {
        var before,
            after,
            beforeLength,
            afterLength,
            beforeDistance,
            afterDistance;
        if ((beforeLength = bestLength - precision) >= 0 && (beforeDistance = distance2(before = pathNode.getPointAtLength(beforeLength))) < bestDistance) {
            best = before, bestLength = beforeLength, bestDistance = beforeDistance;
        } else if ((afterLength = bestLength + precision) <= pathLength && (afterDistance = distance2(after = pathNode.getPointAtLength(afterLength))) < bestDistance) {
            best = after, bestLength = afterLength, bestDistance = afterDistance;
        } else {
            precision *= .5;
        }
    }

    best = {
        x: best.x,
        y: best.y,
        length: bestLength,
        distance: Math.sqrt(bestDistance)
    };
    return best;
}
/*\
 * Snap.is
 [ method ]
 **
 * Handy replacement for the `typeof` operator
 - o (…) any object or primitive
 - type (string) name of the type, e.g., `string`, `function`, `number`, etc.
 = (boolean) `true` if given value is of given type
\*/
Snap.is = is;
/*\
 * Snap.snapTo
 [ method ]
 **
 * Snaps given value to given grid
 - values (array|number) given array of values or step of the grid
 - value (number) value to adjust
 - tolerance (number) #optional maximum distance to the target value that would trigger the snap. Default is `10`.
 = (number) adjusted value
\*/
Snap.snapTo = function (values, value, tolerance) {
    tolerance = is(tolerance, "finite") ? tolerance : 10;
    if (is(values, "array")) {
        var i = values.length;
        while (i--) if (abs(values[i] - value) <= tolerance) {
            return values[i];
        }
    } else {
        values = +values;
        var rem = value % values;
        if (rem < tolerance) {
            return value - rem;
        }
        if (rem > values - tolerance) {
            return value - rem + values;
        }
    }
    return value;
};
// Colour
/*\
 * Snap.getRGB
 [ method ]
 **
 * Parses color string as RGB object
 - color (string) color string in one of the following formats:
 # <ul>
 #     <li>Color name (<code>red</code>, <code>green</code>, <code>cornflowerblue</code>, etc)</li>
 #     <li>#••• — shortened HTML color: (<code>#000</code>, <code>#fc0</code>, etc.)</li>
 #     <li>#•••••• — full length HTML color: (<code>#000000</code>, <code>#bd2300</code>)</li>
 #     <li>rgb(•••, •••, •••) — red, green and blue channels values: (<code>rgb(200,&nbsp;100,&nbsp;0)</code>)</li>
 #     <li>rgba(•••, •••, •••, •••) — also with opacity</li>
 #     <li>rgb(•••%, •••%, •••%) — same as above, but in %: (<code>rgb(100%,&nbsp;175%,&nbsp;0%)</code>)</li>
 #     <li>rgba(•••%, •••%, •••%, •••%) — also with opacity</li>
 #     <li>hsb(•••, •••, •••) — hue, saturation and brightness values: (<code>hsb(0.5,&nbsp;0.25,&nbsp;1)</code>)</li>
 #     <li>hsba(•••, •••, •••, •••) — also with opacity</li>
 #     <li>hsb(•••%, •••%, •••%) — same as above, but in %</li>
 #     <li>hsba(•••%, •••%, •••%, •••%) — also with opacity</li>
 #     <li>hsl(•••, •••, •••) — hue, saturation and luminosity values: (<code>hsb(0.5,&nbsp;0.25,&nbsp;0.5)</code>)</li>
 #     <li>hsla(•••, •••, •••, •••) — also with opacity</li>
 #     <li>hsl(•••%, •••%, •••%) — same as above, but in %</li>
 #     <li>hsla(•••%, •••%, •••%, •••%) — also with opacity</li>
 # </ul>
 * Note that `%` can be used any time: `rgb(20%, 255, 50%)`.
 = (object) RGB object in the following format:
 o {
 o     r (number) red,
 o     g (number) green,
 o     b (number) blue,
 o     hex (string) color in HTML/CSS format: #••••••,
 o     error (boolean) true if string can't be parsed
 o }
\*/
Snap.getRGB = cacher(function (colour) {
    if (!colour || !!((colour = Str(colour)).indexOf("-") + 1)) {
        return {r: -1, g: -1, b: -1, hex: "none", error: 1, toString: rgbtoString};
    }
    if (colour == "none") {
        return {r: -1, g: -1, b: -1, hex: "none", toString: rgbtoString};
    }
    !(hsrg[has](colour.toLowerCase().substring(0, 2)) || colour.charAt() == "#") && (colour = toHex(colour));
    if (!colour) {
        return {r: -1, g: -1, b: -1, hex: "none", error: 1, toString: rgbtoString};
    }
    var res,
        red,
        green,
        blue,
        opacity,
        t,
        values,
        rgb = colour.match(colourRegExp);
    if (rgb) {
        if (rgb[2]) {
            blue = toInt(rgb[2].substring(5), 16);
            green = toInt(rgb[2].substring(3, 5), 16);
            red = toInt(rgb[2].substring(1, 3), 16);
        }
        if (rgb[3]) {
            blue = toInt((t = rgb[3].charAt(3)) + t, 16);
            green = toInt((t = rgb[3].charAt(2)) + t, 16);
            red = toInt((t = rgb[3].charAt(1)) + t, 16);
        }
        if (rgb[4]) {
            values = rgb[4].split(commaSpaces);
            red = toFloat(values[0]);
            values[0].slice(-1) == "%" && (red *= 2.55);
            green = toFloat(values[1]);
            values[1].slice(-1) == "%" && (green *= 2.55);
            blue = toFloat(values[2]);
            values[2].slice(-1) == "%" && (blue *= 2.55);
            rgb[1].toLowerCase().slice(0, 4) == "rgba" && (opacity = toFloat(values[3]));
            values[3] && values[3].slice(-1) == "%" && (opacity /= 100);
        }
        if (rgb[5]) {
            values = rgb[5].split(commaSpaces);
            red = toFloat(values[0]);
            values[0].slice(-1) == "%" && (red /= 100);
            green = toFloat(values[1]);
            values[1].slice(-1) == "%" && (green /= 100);
            blue = toFloat(values[2]);
            values[2].slice(-1) == "%" && (blue /= 100);
            (values[0].slice(-3) == "deg" || values[0].slice(-1) == "\xb0") && (red /= 360);
            rgb[1].toLowerCase().slice(0, 4) == "hsba" && (opacity = toFloat(values[3]));
            values[3] && values[3].slice(-1) == "%" && (opacity /= 100);
            return Snap.hsb2rgb(red, green, blue, opacity);
        }
        if (rgb[6]) {
            values = rgb[6].split(commaSpaces);
            red = toFloat(values[0]);
            values[0].slice(-1) == "%" && (red /= 100);
            green = toFloat(values[1]);
            values[1].slice(-1) == "%" && (green /= 100);
            blue = toFloat(values[2]);
            values[2].slice(-1) == "%" && (blue /= 100);
            (values[0].slice(-3) == "deg" || values[0].slice(-1) == "\xb0") && (red /= 360);
            rgb[1].toLowerCase().slice(0, 4) == "hsla" && (opacity = toFloat(values[3]));
            values[3] && values[3].slice(-1) == "%" && (opacity /= 100);
            return Snap.hsl2rgb(red, green, blue, opacity);
        }
        red = mmin(math.round(red), 255);
        green = mmin(math.round(green), 255);
        blue = mmin(math.round(blue), 255);
        opacity = mmin(mmax(opacity, 0), 1);
        rgb = {r: red, g: green, b: blue, toString: rgbtoString};
        rgb.hex = "#" + (16777216 | blue | (green << 8) | (red << 16)).toString(16).slice(1);
        rgb.opacity = is(opacity, "finite") ? opacity : 1;
        return rgb;
    }
    return {r: -1, g: -1, b: -1, hex: "none", error: 1, toString: rgbtoString};
}, Snap);
/*\
 * Snap.hsb
 [ method ]
 **
 * Converts HSB values to a hex representation of the color
 - h (number) hue
 - s (number) saturation
 - b (number) value or brightness
 = (string) hex representation of the color
\*/
Snap.hsb = cacher(function (h, s, b) {
    return Snap.hsb2rgb(h, s, b).hex;
});
/*\
 * Snap.hsl
 [ method ]
 **
 * Converts HSL values to a hex representation of the color
 - h (number) hue
 - s (number) saturation
 - l (number) luminosity
 = (string) hex representation of the color
\*/
Snap.hsl = cacher(function (h, s, l) {
    return Snap.hsl2rgb(h, s, l).hex;
});
/*\
 * Snap.rgb
 [ method ]
 **
 * Converts RGB values to a hex representation of the color
 - r (number) red
 - g (number) green
 - b (number) blue
 = (string) hex representation of the color
\*/
Snap.rgb = cacher(function (r, g, b, o) {
    if (is(o, "finite")) {
        var round = math.round;
        return "rgba(" + [round(r), round(g), round(b), +o.toFixed(2)] + ")";
    }
    return "#" + (16777216 | b | (g << 8) | (r << 16)).toString(16).slice(1);
});
var toHex = function (color) {
    var i = glob.doc.getElementsByTagName("head")[0] || glob.doc.getElementsByTagName("svg")[0],
        red = "rgb(255, 0, 0)";
    toHex = cacher(function (color) {
        if (color.toLowerCase() == "red") {
            return red;
        }
        i.style.color = red;
        i.style.color = color;
        var out = glob.doc.defaultView.getComputedStyle(i, E).getPropertyValue("color");
        return out == red ? null : out;
    });
    return toHex(color);
},
hsbtoString = function () {
    return "hsb(" + [this.h, this.s, this.b] + ")";
},
hsltoString = function () {
    return "hsl(" + [this.h, this.s, this.l] + ")";
},
rgbtoString = function () {
    return this.opacity == 1 || this.opacity == null ?
            this.hex :
            "rgba(" + [this.r, this.g, this.b, this.opacity] + ")";
},
prepareRGB = function (r, g, b) {
    if (g == null && is(r, "object") && "r" in r && "g" in r && "b" in r) {
        b = r.b;
        g = r.g;
        r = r.r;
    }
    if (g == null && is(r, string)) {
        var clr = Snap.getRGB(r);
        r = clr.r;
        g = clr.g;
        b = clr.b;
    }
    if (r > 1 || g > 1 || b > 1) {
        r /= 255;
        g /= 255;
        b /= 255;
    }
    
    return [r, g, b];
},
packageRGB = function (r, g, b, o) {
    r = math.round(r * 255);
    g = math.round(g * 255);
    b = math.round(b * 255);
    var rgb = {
        r: r,
        g: g,
        b: b,
        opacity: is(o, "finite") ? o : 1,
        hex: Snap.rgb(r, g, b),
        toString: rgbtoString
    };
    is(o, "finite") && (rgb.opacity = o);
    return rgb;
};
/*\
 * Snap.color
 [ method ]
 **
 * Parses the color string and returns an object featuring the color's component values
 - clr (string) color string in one of the supported formats (see @Snap.getRGB)
 = (object) Combined RGB/HSB object in the following format:
 o {
 o     r (number) red,
 o     g (number) green,
 o     b (number) blue,
 o     hex (string) color in HTML/CSS format: #••••••,
 o     error (boolean) `true` if string can't be parsed,
 o     h (number) hue,
 o     s (number) saturation,
 o     v (number) value (brightness),
 o     l (number) lightness
 o }
\*/
Snap.color = function (clr) {
    var rgb;
    if (is(clr, "object") && "h" in clr && "s" in clr && "b" in clr) {
        rgb = Snap.hsb2rgb(clr);
        clr.r = rgb.r;
        clr.g = rgb.g;
        clr.b = rgb.b;
        clr.opacity = 1;
        clr.hex = rgb.hex;
    } else if (is(clr, "object") && "h" in clr && "s" in clr && "l" in clr) {
        rgb = Snap.hsl2rgb(clr);
        clr.r = rgb.r;
        clr.g = rgb.g;
        clr.b = rgb.b;
        clr.opacity = 1;
        clr.hex = rgb.hex;
    } else {
        if (is(clr, "string")) {
            clr = Snap.getRGB(clr);
        }
        if (is(clr, "object") && "r" in clr && "g" in clr && "b" in clr && !("error" in clr)) {
            rgb = Snap.rgb2hsl(clr);
            clr.h = rgb.h;
            clr.s = rgb.s;
            clr.l = rgb.l;
            rgb = Snap.rgb2hsb(clr);
            clr.v = rgb.b;
        } else {
            clr = {hex: "none"};
            clr.r = clr.g = clr.b = clr.h = clr.s = clr.v = clr.l = -1;
            clr.error = 1;
        }
    }
    clr.toString = rgbtoString;
    return clr;
};
/*\
 * Snap.hsb2rgb
 [ method ]
 **
 * Converts HSB values to an RGB object
 - h (number) hue
 - s (number) saturation
 - v (number) value or brightness
 = (object) RGB object in the following format:
 o {
 o     r (number) red,
 o     g (number) green,
 o     b (number) blue,
 o     hex (string) color in HTML/CSS format: #••••••
 o }
\*/
Snap.hsb2rgb = function (h, s, v, o) {
    if (is(h, "object") && "h" in h && "s" in h && "b" in h) {
        v = h.b;
        s = h.s;
        o = h.o;
        h = h.h;
    }
    h *= 360;
    var R, G, B, X, C;
    h = (h % 360) / 60;
    C = v * s;
    X = C * (1 - abs(h % 2 - 1));
    R = G = B = v - C;

    h = ~~h;
    R += [C, X, 0, 0, X, C][h];
    G += [X, C, C, X, 0, 0][h];
    B += [0, 0, X, C, C, X][h];
    return packageRGB(R, G, B, o);
};
/*\
 * Snap.hsl2rgb
 [ method ]
 **
 * Converts HSL values to an RGB object
 - h (number) hue
 - s (number) saturation
 - l (number) luminosity
 = (object) RGB object in the following format:
 o {
 o     r (number) red,
 o     g (number) green,
 o     b (number) blue,
 o     hex (string) color in HTML/CSS format: #••••••
 o }
\*/
Snap.hsl2rgb = function (h, s, l, o) {
    if (is(h, "object") && "h" in h && "s" in h && "l" in h) {
        l = h.l;
        s = h.s;
        h = h.h;
    }
    if (h > 1 || s > 1 || l > 1) {
        h /= 360;
        s /= 100;
        l /= 100;
    }
    h *= 360;
    var R, G, B, X, C;
    h = (h % 360) / 60;
    C = 2 * s * (l < .5 ? l : 1 - l);
    X = C * (1 - abs(h % 2 - 1));
    R = G = B = l - C / 2;

    h = ~~h;
    R += [C, X, 0, 0, X, C][h];
    G += [X, C, C, X, 0, 0][h];
    B += [0, 0, X, C, C, X][h];
    return packageRGB(R, G, B, o);
};
/*\
 * Snap.rgb2hsb
 [ method ]
 **
 * Converts RGB values to an HSB object
 - r (number) red
 - g (number) green
 - b (number) blue
 = (object) HSB object in the following format:
 o {
 o     h (number) hue,
 o     s (number) saturation,
 o     b (number) brightness
 o }
\*/
Snap.rgb2hsb = function (r, g, b) {
    b = prepareRGB(r, g, b);
    r = b[0];
    g = b[1];
    b = b[2];

    var H, S, V, C;
    V = mmax(r, g, b);
    C = V - mmin(r, g, b);
    H = (C == 0 ? null :
         V == r ? (g - b) / C :
         V == g ? (b - r) / C + 2 :
                  (r - g) / C + 4
        );
    H = ((H + 360) % 6) * 60 / 360;
    S = C == 0 ? 0 : C / V;
    return {h: H, s: S, b: V, toString: hsbtoString};
};
/*\
 * Snap.rgb2hsl
 [ method ]
 **
 * Converts RGB values to an HSL object
 - r (number) red
 - g (number) green
 - b (number) blue
 = (object) HSL object in the following format:
 o {
 o     h (number) hue,
 o     s (number) saturation,
 o     l (number) luminosity
 o }
\*/
Snap.rgb2hsl = function (r, g, b) {
    b = prepareRGB(r, g, b);
    r = b[0];
    g = b[1];
    b = b[2];

    var H, S, L, M, m, C;
    M = mmax(r, g, b);
    m = mmin(r, g, b);
    C = M - m;
    H = (C == 0 ? null :
         M == r ? (g - b) / C :
         M == g ? (b - r) / C + 2 :
                  (r - g) / C + 4);
    H = ((H + 360) % 6) * 60 / 360;
    L = (M + m) / 2;
    S = (C == 0 ? 0 :
         L < .5 ? C / (2 * L) :
                  C / (2 - 2 * L));
    return {h: H, s: S, l: L, toString: hsltoString};
};

// Transformations
/*\
 * Snap.parsePathString
 [ method ]
 **
 * Utility method
 **
 * Parses given path string into an array of arrays of path segments
 - pathString (string|array) path string or array of segments (in the last case it is returned straight away)
 = (array) array of segments
\*/
Snap.parsePathString = function (pathString) {
    if (!pathString) {
        return null;
    }
    var pth = Snap.path(pathString);
    if (pth.arr) {
        return Snap.path.clone(pth.arr);
    }
    
    var paramCounts = {a: 7, c: 6, o: 2, h: 1, l: 2, m: 2, r: 4, q: 4, s: 4, t: 2, v: 1, u: 3, z: 0},
        data = [];
    if (is(pathString, "array") && is(pathString[0], "array")) { // rough assumption
        data = Snap.path.clone(pathString);
    }
    if (!data.length) {
        Str(pathString).replace(pathCommand, function (a, b, c) {
            var params = [],
                name = b.toLowerCase();
            c.replace(pathValues, function (a, b) {
                b && params.push(+b);
            });
            if (name == "m" && params.length > 2) {
                data.push([b].concat(params.splice(0, 2)));
                name = "l";
                b = b == "m" ? "l" : "L";
            }
            if (name == "o" && params.length == 1) {
                data.push([b, params[0]]);
            }
            if (name == "r") {
                data.push([b].concat(params));
            } else while (params.length >= paramCounts[name]) {
                data.push([b].concat(params.splice(0, paramCounts[name])));
                if (!paramCounts[name]) {
                    break;
                }
            }
        });
    }
    data.toString = Snap.path.toString;
    pth.arr = Snap.path.clone(data);
    return data;
};
/*\
 * Snap.parseTransformString
 [ method ]
 **
 * Utility method
 **
 * Parses given transform string into an array of transformations
 - TString (string|array) transform string or array of transformations (in the last case it is returned straight away)
 = (array) array of transformations
\*/
var parseTransformString = Snap.parseTransformString = function (TString) {
    if (!TString) {
        return null;
    }
    var paramCounts = {r: 3, s: 4, t: 2, m: 6},
        data = [];
    if (is(TString, "array") && is(TString[0], "array")) { // rough assumption
        data = Snap.path.clone(TString);
    }
    if (!data.length) {
        Str(TString).replace(tCommand, function (a, b, c) {
            var params = [],
                name = b.toLowerCase();
            c.replace(pathValues, function (a, b) {
                b && params.push(+b);
            });
            data.push([b].concat(params));
        });
    }
    data.toString = Snap.path.toString;
    return data;
};
function svgTransform2string(tstr) {
    var res = [];
    tstr = tstr.replace(/(?:^|\s)(\w+)\(([^)]+)\)/g, function (all, name, params) {
        params = params.split(/\s*,\s*|\s+/);
        if (name == "rotate" && params.length == 1) {
            params.push(0, 0);
        }
        if (name == "scale") {
            if (params.length > 2) {
                params = params.slice(0, 2);
            } else if (params.length == 2) {
                params.push(0, 0);
            }
            if (params.length == 1) {
                params.push(params[0], 0, 0);
            }
        }
        if (name == "skewX") {
            res.push(["m", 1, 0, math.tan(rad(params[0])), 1, 0, 0]);
        } else if (name == "skewY") {
            res.push(["m", 1, math.tan(rad(params[0])), 0, 1, 0, 0]);
        } else {
            res.push([name.charAt(0)].concat(params));
        }
        return all;
    });
    return res;
}
Snap._.svgTransform2string = svgTransform2string;
Snap._.rgTransform = /^[a-z][\s]*-?\.?\d/i;
function transform2matrix(tstr, bbox) {
    var tdata = parseTransformString(tstr),
        m = new Snap.Matrix;
    if (tdata) {
        for (var i = 0, ii = tdata.length; i < ii; i++) {
            var t = tdata[i],
                tlen = t.length,
                command = Str(t[0]).toLowerCase(),
                absolute = t[0] != command,
                inver = absolute ? m.invert() : 0,
                x1,
                y1,
                x2,
                y2,
                bb;
            if (command == "t" && tlen == 2){
                m.translate(t[1], 0);
            } else if (command == "t" && tlen == 3) {
                if (absolute) {
                    x1 = inver.x(0, 0);
                    y1 = inver.y(0, 0);
                    x2 = inver.x(t[1], t[2]);
                    y2 = inver.y(t[1], t[2]);
                    m.translate(x2 - x1, y2 - y1);
                } else {
                    m.translate(t[1], t[2]);
                }
            } else if (command == "r") {
                if (tlen == 2) {
                    bb = bb || bbox;
                    m.rotate(t[1], bb.x + bb.width / 2, bb.y + bb.height / 2);
                } else if (tlen == 4) {
                    if (absolute) {
                        x2 = inver.x(t[2], t[3]);
                        y2 = inver.y(t[2], t[3]);
                        m.rotate(t[1], x2, y2);
                    } else {
                        m.rotate(t[1], t[2], t[3]);
                    }
                }
            } else if (command == "s") {
                if (tlen == 2 || tlen == 3) {
                    bb = bb || bbox;
                    m.scale(t[1], t[tlen - 1], bb.x + bb.width / 2, bb.y + bb.height / 2);
                } else if (tlen == 4) {
                    if (absolute) {
                        x2 = inver.x(t[2], t[3]);
                        y2 = inver.y(t[2], t[3]);
                        m.scale(t[1], t[1], x2, y2);
                    } else {
                        m.scale(t[1], t[1], t[2], t[3]);
                    }
                } else if (tlen == 5) {
                    if (absolute) {
                        x2 = inver.x(t[3], t[4]);
                        y2 = inver.y(t[3], t[4]);
                        m.scale(t[1], t[2], x2, y2);
                    } else {
                        m.scale(t[1], t[2], t[3], t[4]);
                    }
                }
            } else if (command == "m" && tlen == 7) {
                m.add(t[1], t[2], t[3], t[4], t[5], t[6]);
            }
        }
    }
    return m;
}
Snap._.transform2matrix = transform2matrix;
Snap._unit2px = unit2px;
var contains = glob.doc.contains || glob.doc.compareDocumentPosition ?
    function (a, b) {
        var adown = a.nodeType == 9 ? a.documentElement : a,
            bup = b && b.parentNode;
            return a == bup || !!(bup && bup.nodeType == 1 && (
                adown.contains ?
                    adown.contains(bup) :
                    a.compareDocumentPosition && a.compareDocumentPosition(bup) & 16
            ));
    } :
    function (a, b) {
        if (b) {
            while (b) {
                b = b.parentNode;
                if (b == a) {
                    return true;
                }
            }
        }
        return false;
    };
function getSomeDefs(el) {
    var p = (el.node.ownerSVGElement && wrap(el.node.ownerSVGElement)) ||
            (el.node.parentNode && wrap(el.node.parentNode)) ||
            Snap.select("svg") ||
            Snap(0, 0),
        pdefs = p.select("defs"),
        defs  = pdefs == null ? false : pdefs.node;
    if (!defs) {
        defs = make("defs", p.node).node;
    }
    return defs;
}
function getSomeSVG(el) {
    return el.node.ownerSVGElement && wrap(el.node.ownerSVGElement) || Snap.select("svg");
}
Snap._.getSomeDefs = getSomeDefs;
Snap._.getSomeSVG = getSomeSVG;
function unit2px(el, name, value) {
    var svg = getSomeSVG(el).node,
        out = {},
        mgr = svg.querySelector(".svg---mgr");
    if (!mgr) {
        mgr = $("rect");
        $(mgr, {x: -9e9, y: -9e9, width: 10, height: 10, "class": "svg---mgr", fill: "none"});
        svg.appendChild(mgr);
    }
    function getW(val) {
        if (val == null) {
            return E;
        }
        if (val == +val) {
            return val;
        }
        $(mgr, {width: val});
        try {
            return mgr.getBBox().width;
        } catch (e) {
            return 0;
        }
    }
    function getH(val) {
        if (val == null) {
            return E;
        }
        if (val == +val) {
            return val;
        }
        $(mgr, {height: val});
        try {
            return mgr.getBBox().height;
        } catch (e) {
            return 0;
        }
    }
    function set(nam, f) {
        if (name == null) {
            out[nam] = f(el.attr(nam) || 0);
        } else if (nam == name) {
            out = f(value == null ? el.attr(nam) || 0 : value);
        }
    }
    switch (el.type) {
        case "rect":
            set("rx", getW);
            set("ry", getH);
        case "image":
            set("width", getW);
            set("height", getH);
        case "text":
            set("x", getW);
            set("y", getH);
        break;
        case "circle":
            set("cx", getW);
            set("cy", getH);
            set("r", getW);
        break;
        case "ellipse":
            set("cx", getW);
            set("cy", getH);
            set("rx", getW);
            set("ry", getH);
        break;
        case "line":
            set("x1", getW);
            set("x2", getW);
            set("y1", getH);
            set("y2", getH);
        break;
        case "marker":
            set("refX", getW);
            set("markerWidth", getW);
            set("refY", getH);
            set("markerHeight", getH);
        break;
        case "radialGradient":
            set("fx", getW);
            set("fy", getH);
        break;
        case "tspan":
            set("dx", getW);
            set("dy", getH);
        break;
        default:
            set(name, getW);
    }
    svg.removeChild(mgr);
    return out;
}
/*\
 * Snap.select
 [ method ]
 **
 * Wraps a DOM element specified by CSS selector as @Element
 - query (string) CSS selector of the element
 = (Element) the current element
\*/
Snap.select = function (query) {
    query = Str(query).replace(/([^\\]):/g, "$1\\:");
    return wrap(glob.doc.querySelector(query));
};
/*\
 * Snap.selectAll
 [ method ]
 **
 * Wraps DOM elements specified by CSS selector as set or array of @Element
 - query (string) CSS selector of the element
 = (Element) the current element
\*/
Snap.selectAll = function (query) {
    var nodelist = glob.doc.querySelectorAll(query),
        set = (Snap.set || Array)();
    for (var i = 0; i < nodelist.length; i++) {
        set.push(wrap(nodelist[i]));
    }
    return set;
};

function add2group(list) {
    if (!is(list, "array")) {
        list = Array.prototype.slice.call(arguments, 0);
    }
    var i = 0,
        j = 0,
        node = this.node;
    while (this[i]) delete this[i++];
    for (i = 0; i < list.length; i++) {
        if (list[i].type == "set") {
            list[i].forEach(function (el) {
                node.appendChild(el.node);
            });
        } else {
            node.appendChild(list[i].node);
        }
    }
    var children = node.childNodes;
    for (i = 0; i < children.length; i++) {
        this[j++] = wrap(children[i]);
    }
    return this;
}
// Hub garbage collector every 10s
setInterval(function () {
    for (var key in hub) if (hub[has](key)) {
        var el = hub[key],
            node = el.node;
        if (el.type != "svg" && !node.ownerSVGElement || el.type == "svg" && (!node.parentNode || "ownerSVGElement" in node.parentNode && !node.ownerSVGElement)) {
            delete hub[key];
        }
    }
}, 1e4);
function Element(el) {
    if (el.snap in hub) {
        return hub[el.snap];
    }
    var svg;
    try {
        svg = el.ownerSVGElement;
    } catch(e) {}
    /*\
     * Element.node
     [ property (object) ]
     **
     * Gives you a reference to the DOM object, so you can assign event handlers or just mess around.
     > Usage
     | // draw a circle at coordinate 10,10 with radius of 10
     | var c = paper.circle(10, 10, 10);
     | c.node.onclick = function () {
     |     c.attr("fill", "red");
     | };
    \*/
    this.node = el;
    if (svg) {
        this.paper = new Paper(svg);
    }
    /*\
     * Element.type
     [ property (string) ]
     **
     * SVG tag name of the given element.
    \*/
    this.type = el.tagName || el.nodeName;
    var id = this.id = ID(this);
    this.anims = {};
    this._ = {
        transform: []
    };
    el.snap = id;
    hub[id] = this;
    if (this.type == "g") {
        this.add = add2group;
    }
    if (this.type in {g: 1, mask: 1, pattern: 1, symbol: 1}) {
        for (var method in Paper.prototype) if (Paper.prototype[has](method)) {
            this[method] = Paper.prototype[method];
        }
    }
}
   /*\
     * Element.attr
     [ method ]
     **
     * Gets or sets given attributes of the element.
     **
     - params (object) contains key-value pairs of attributes you want to set
     * or
     - param (string) name of the attribute
     = (Element) the current element
     * or
     = (string) value of attribute
     > Usage
     | el.attr({
     |     fill: "#fc0",
     |     stroke: "#000",
     |     strokeWidth: 2, // CamelCase...
     |     "fill-opacity": 0.5, // or dash-separated names
     |     width: "*=2" // prefixed values
     | });
     | console.log(el.attr("fill")); // #fc0
     * Prefixed values in format `"+=10"` supported. All four operations
     * (`+`, `-`, `*` and `/`) could be used. Optionally you can use units for `+`
     * and `-`: `"+=2em"`.
    \*/
    Element.prototype.attr = function (params, value) {
        var el = this,
            node = el.node;
        if (!params) {
            if (node.nodeType != 1) {
                return {
                    text: node.nodeValue
                };
            }
            var attr = node.attributes,
                out = {};
            for (var i = 0, ii = attr.length; i < ii; i++) {
                out[attr[i].nodeName] = attr[i].nodeValue;
            }
            return out;
        }
        if (is(params, "string")) {
            if (arguments.length > 1) {
                var json = {};
                json[params] = value;
                params = json;
            } else {
                return eve("snap.util.getattr." + params, el).firstDefined();
            }
        }
        for (var att in params) {
            if (params[has](att)) {
                eve("snap.util.attr." + att, el, params[att]);
            }
        }
        return el;
    };
/*\
 * Snap.parse
 [ method ]
 **
 * Parses SVG fragment and converts it into a @Fragment
 **
 - svg (string) SVG string
 = (Fragment) the @Fragment
\*/
Snap.parse = function (svg) {
    var f = glob.doc.createDocumentFragment(),
        full = true,
        div = glob.doc.createElement("div");
    svg = Str(svg);
    if (!svg.match(/^\s*<\s*svg(?:\s|>)/)) {
        svg = "<svg>" + svg + "</svg>";
        full = false;
    }
    div.innerHTML = svg;
    svg = div.getElementsByTagName("svg")[0];
    if (svg) {
        if (full) {
            f = svg;
        } else {
            while (svg.firstChild) {
                f.appendChild(svg.firstChild);
            }
        }
    }
    return new Fragment(f);
};
function Fragment(frag) {
    this.node = frag;
}
/*\
 * Snap.fragment
 [ method ]
 **
 * Creates a DOM fragment from a given list of elements or strings
 **
 - varargs (…) SVG string
 = (Fragment) the @Fragment
\*/
Snap.fragment = function () {
    var args = Array.prototype.slice.call(arguments, 0),
        f = glob.doc.createDocumentFragment();
    for (var i = 0, ii = args.length; i < ii; i++) {
        var item = args[i];
        if (item.node && item.node.nodeType) {
            f.appendChild(item.node);
        }
        if (item.nodeType) {
            f.appendChild(item);
        }
        if (typeof item == "string") {
            f.appendChild(Snap.parse(item).node);
        }
    }
    return new Fragment(f);
};

function make(name, parent) {
    var res = $(name);
    parent.appendChild(res);
    var el = wrap(res);
    return el;
}
function Paper(w, h) {
    var res,
        desc,
        defs,
        proto = Paper.prototype;
    if (w && w.tagName == "svg") {
        if (w.snap in hub) {
            return hub[w.snap];
        }
        var doc = w.ownerDocument;
        res = new Element(w);
        desc = w.getElementsByTagName("desc")[0];
        defs = w.getElementsByTagName("defs")[0];
        if (!desc) {
            desc = $("desc");
            desc.appendChild(doc.createTextNode("Created with Snap"));
            res.node.appendChild(desc);
        }
        if (!defs) {
            defs = $("defs");
            res.node.appendChild(defs);
        }
        res.defs = defs;
        for (var key in proto) if (proto[has](key)) {
            res[key] = proto[key];
        }
        res.paper = res.root = res;
    } else {
        res = make("svg", glob.doc.body);
        $(res.node, {
            height: h,
            version: 1.1,
            width: w,
            xmlns: xmlns
        });
    }
    return res;
}
function wrap(dom) {
    if (!dom) {
        return dom;
    }
    if (dom instanceof Element || dom instanceof Fragment) {
        return dom;
    }
    if (dom.tagName && dom.tagName.toLowerCase() == "svg") {
        return new Paper(dom);
    }
    if (dom.tagName && dom.tagName.toLowerCase() == "object" && dom.type == "image/svg+xml") {
        return new Paper(dom.contentDocument.getElementsByTagName("svg")[0]);
    }
    return new Element(dom);
}

Snap._.make = make;
Snap._.wrap = wrap;
/*\
 * Paper.el
 [ method ]
 **
 * Creates an element on paper with a given name and no attributes
 **
 - name (string) tag name
 - attr (object) attributes
 = (Element) the current element
 > Usage
 | var c = paper.circle(10, 10, 10); // is the same as...
 | var c = paper.el("circle").attr({
 |     cx: 10,
 |     cy: 10,
 |     r: 10
 | });
 | // and the same as
 | var c = paper.el("circle", {
 |     cx: 10,
 |     cy: 10,
 |     r: 10
 | });
\*/
Paper.prototype.el = function (name, attr) {
    var el = make(name, this.node);
    attr && el.attr(attr);
    return el;
};
/*\
 * Element.children
 [ method ]
 **
 * Returns array of all the children of the element.
 = (array) array of Elements
\*/
Element.prototype.children = function () {
    var out = [],
        ch = this.node.childNodes;
    for (var i = 0, ii = ch.length; i < ii; i++) {
        out[i] = Snap(ch[i]);
    }
    return out;
};
function jsonFiller(root, o) {
    for (var i = 0, ii = root.length; i < ii; i++) {
        var item = {
                type: root[i].type,
                attr: root[i].attr()
            },
            children = root[i].children();
        o.push(item);
        if (children.length) {
            jsonFiller(children, item.childNodes = []);
        }
    }
}
/*\
 * Element.toJSON
 [ method ]
 **
 * Returns object representation of the given element and all its children.
 = (object) in format
 o {
 o     type (string) this.type,
 o     attr (object) attributes map,
 o     childNodes (array) optional array of children in the same format
 o }
\*/
Element.prototype.toJSON = function () {
    var out = [];
    jsonFiller([this], out);
    return out[0];
};
// default
eve.on("snap.util.getattr", function () {
    var att = eve.nt();
    att = att.substring(att.lastIndexOf(".") + 1);
    var css = att.replace(/[A-Z]/g, function (letter) {
        return "-" + letter.toLowerCase();
    });
    if (cssAttr[has](css)) {
        return this.node.ownerDocument.defaultView.getComputedStyle(this.node, null).getPropertyValue(css);
    } else {
        return $(this.node, att);
    }
});
var cssAttr = {
    "alignment-baseline": 0,
    "baseline-shift": 0,
    "clip": 0,
    "clip-path": 0,
    "clip-rule": 0,
    "color": 0,
    "color-interpolation": 0,
    "color-interpolation-filters": 0,
    "color-profile": 0,
    "color-rendering": 0,
    "cursor": 0,
    "direction": 0,
    "display": 0,
    "dominant-baseline": 0,
    "enable-background": 0,
    "fill": 0,
    "fill-opacity": 0,
    "fill-rule": 0,
    "filter": 0,
    "flood-color": 0,
    "flood-opacity": 0,
    "font": 0,
    "font-family": 0,
    "font-size": 0,
    "font-size-adjust": 0,
    "font-stretch": 0,
    "font-style": 0,
    "font-variant": 0,
    "font-weight": 0,
    "glyph-orientation-horizontal": 0,
    "glyph-orientation-vertical": 0,
    "image-rendering": 0,
    "kerning": 0,
    "letter-spacing": 0,
    "lighting-color": 0,
    "marker": 0,
    "marker-end": 0,
    "marker-mid": 0,
    "marker-start": 0,
    "mask": 0,
    "opacity": 0,
    "overflow": 0,
    "pointer-events": 0,
    "shape-rendering": 0,
    "stop-color": 0,
    "stop-opacity": 0,
    "stroke": 0,
    "stroke-dasharray": 0,
    "stroke-dashoffset": 0,
    "stroke-linecap": 0,
    "stroke-linejoin": 0,
    "stroke-miterlimit": 0,
    "stroke-opacity": 0,
    "stroke-width": 0,
    "text-anchor": 0,
    "text-decoration": 0,
    "text-rendering": 0,
    "unicode-bidi": 0,
    "visibility": 0,
    "word-spacing": 0,
    "writing-mode": 0
};

eve.on("snap.util.attr", function (value) {
    var att = eve.nt(),
        attr = {};
    att = att.substring(att.lastIndexOf(".") + 1);
    attr[att] = value;
    var style = att.replace(/-(\w)/gi, function (all, letter) {
            return letter.toUpperCase();
        }),
        css = att.replace(/[A-Z]/g, function (letter) {
            return "-" + letter.toLowerCase();
        });
    if (cssAttr[has](css)) {
        this.node.style[style] = value == null ? E : value;
    } else {
        $(this.node, attr);
    }
});
(function (proto) {}(Paper.prototype));

// simple ajax
/*\
 * Snap.ajax
 [ method ]
 **
 * Simple implementation of Ajax
 **
 - url (string) URL
 - postData (object|string) data for post request
 - callback (function) callback
 - scope (object) #optional scope of callback
 * or
 - url (string) URL
 - callback (function) callback
 - scope (object) #optional scope of callback
 = (XMLHttpRequest) the XMLHttpRequest object, just in case
\*/
Snap.ajax = function (url, postData, callback, scope){
    var req = new XMLHttpRequest,
        id = ID();
    if (req) {
        if (is(postData, "function")) {
            scope = callback;
            callback = postData;
            postData = null;
        } else if (is(postData, "object")) {
            var pd = [];
            for (var key in postData) if (postData.hasOwnProperty(key)) {
                pd.push(encodeURIComponent(key) + "=" + encodeURIComponent(postData[key]));
            }
            postData = pd.join("&");
        }
        req.open((postData ? "POST" : "GET"), url, true);
        if (postData) {
            req.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        }
        if (callback) {
            eve.once("snap.ajax." + id + ".0", callback);
            eve.once("snap.ajax." + id + ".200", callback);
            eve.once("snap.ajax." + id + ".304", callback);
        }
        req.onreadystatechange = function() {
            if (req.readyState != 4) return;
            eve("snap.ajax." + id + "." + req.status, scope, req);
        };
        if (req.readyState == 4) {
            return req;
        }
        req.send(postData);
        return req;
    }
};
/*\
 * Snap.load
 [ method ]
 **
 * Loads external SVG file as a @Fragment (see @Snap.ajax for more advanced AJAX)
 **
 - url (string) URL
 - callback (function) callback
 - scope (object) #optional scope of callback
\*/
Snap.load = function (url, callback, scope) {
    Snap.ajax(url, function (req) {
        var f = Snap.parse(req.responseText);
        scope ? callback.call(scope, f) : callback(f);
    });
};
var getOffset = function (elem) {
    var box = elem.getBoundingClientRect(),
        doc = elem.ownerDocument,
        body = doc.body,
        docElem = doc.documentElement,
        clientTop = docElem.clientTop || body.clientTop || 0, clientLeft = docElem.clientLeft || body.clientLeft || 0,
        top  = box.top  + (g.win.pageYOffset || docElem.scrollTop || body.scrollTop ) - clientTop,
        left = box.left + (g.win.pageXOffset || docElem.scrollLeft || body.scrollLeft) - clientLeft;
    return {
        y: top,
        x: left
    };
};
/*\
 * Snap.getElementByPoint
 [ method ]
 **
 * Returns you topmost element under given point.
 **
 = (object) Snap element object
 - x (number) x coordinate from the top left corner of the window
 - y (number) y coordinate from the top left corner of the window
 > Usage
 | Snap.getElementByPoint(mouseX, mouseY).attr({stroke: "#f00"});
\*/
Snap.getElementByPoint = function (x, y) {
    var paper = this,
        svg = paper.canvas,
        target = glob.doc.elementFromPoint(x, y);
    if (glob.win.opera && target.tagName == "svg") {
        var so = getOffset(target),
            sr = target.createSVGRect();
        sr.x = x - so.x;
        sr.y = y - so.y;
        sr.width = sr.height = 1;
        var hits = target.getIntersectionList(sr, null);
        if (hits.length) {
            target = hits[hits.length - 1];
        }
    }
    if (!target) {
        return null;
    }
    return wrap(target);
};
/*\
 * Snap.plugin
 [ method ]
 **
 * Let you write plugins. You pass in a function with five arguments, like this:
 | Snap.plugin(function (Snap, Element, Paper, global, Fragment) {
 |     Snap.newmethod = function () {};
 |     Element.prototype.newmethod = function () {};
 |     Paper.prototype.newmethod = function () {};
 | });
 * Inside the function you have access to all main objects (and their
 * prototypes). This allow you to extend anything you want.
 **
 - f (function) your plugin body
\*/
Snap.plugin = function (f) {
    f(Snap, Element, Paper, glob, Fragment);
};
glob.win.Snap = Snap;
return Snap;
}(window || this));

// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Snap.plugin(function (Snap, Element, Paper, glob, Fragment) {
    var elproto = Element.prototype,
        is = Snap.is,
        Str = String,
        unit2px = Snap._unit2px,
        $ = Snap._.$,
        make = Snap._.make,
        getSomeDefs = Snap._.getSomeDefs,
        has = "hasOwnProperty",
        wrap = Snap._.wrap;
    /*\
     * Element.getBBox
     [ method ]
     **
     * Returns the bounding box descriptor for the given element
     **
     = (object) bounding box descriptor:
     o {
     o     cx: (number) x of the center,
     o     cy: (number) x of the center,
     o     h: (number) height,
     o     height: (number) height,
     o     path: (string) path command for the box,
     o     r0: (number) radius of a circle that fully encloses the box,
     o     r1: (number) radius of the smallest circle that can be enclosed,
     o     r2: (number) radius of the largest circle that can be enclosed,
     o     vb: (string) box as a viewbox command,
     o     w: (number) width,
     o     width: (number) width,
     o     x2: (number) x of the right side,
     o     x: (number) x of the left side,
     o     y2: (number) y of the bottom edge,
     o     y: (number) y of the top edge
     o }
    \*/
    elproto.getBBox = function (isWithoutTransform) {
        if (!Snap.Matrix || !Snap.path) {
            return this.node.getBBox();
        }
        var el = this,
            m = new Snap.Matrix;
        if (el.removed) {
            return Snap._.box();
        }
        while (el.type == "use") {
            if (!isWithoutTransform) {
                m = m.add(el.transform().localMatrix.translate(el.attr("x") || 0, el.attr("y") || 0));
            }
            if (el.original) {
                el = el.original;
            } else {
                var href = el.attr("xlink:href");
                el = el.original = el.node.ownerDocument.getElementById(href.substring(href.indexOf("#") + 1));
            }
        }
        var _ = el._,
            pathfinder = Snap.path.get[el.type] || Snap.path.get.deflt;
        try {
            if (isWithoutTransform) {
                _.bboxwt = pathfinder ? Snap.path.getBBox(el.realPath = pathfinder(el)) : Snap._.box(el.node.getBBox());
                return Snap._.box(_.bboxwt);
            } else {
                el.realPath = pathfinder(el);
                el.matrix = el.transform().localMatrix;
                _.bbox = Snap.path.getBBox(Snap.path.map(el.realPath, m.add(el.matrix)));
                return Snap._.box(_.bbox);
            }
        } catch (e) {
            // Firefox doesn’t give you bbox of hidden element
            return Snap._.box();
        }
    };
    var propString = function () {
        return this.string;
    };
    function extractTransform(el, tstr) {
        if (tstr == null) {
            var doReturn = true;
            if (el.type == "linearGradient" || el.type == "radialGradient") {
                tstr = el.node.getAttribute("gradientTransform");
            } else if (el.type == "pattern") {
                tstr = el.node.getAttribute("patternTransform");
            } else {
                tstr = el.node.getAttribute("transform");
            }
            if (!tstr) {
                return new Snap.Matrix;
            }
            tstr = Snap._.svgTransform2string(tstr);
        } else {
            if (!Snap._.rgTransform.test(tstr)) {
                tstr = Snap._.svgTransform2string(tstr);
            } else {
                tstr = Str(tstr).replace(/\.{3}|\u2026/g, el._.transform || "");
            }
            if (is(tstr, "array")) {
                tstr = Snap.path ? Snap.path.toString.call(tstr) : Str(tstr);
            }
            el._.transform = tstr;
        }
        var m = Snap._.transform2matrix(tstr, el.getBBox(1));
        if (doReturn) {
            return m;
        } else {
            el.matrix = m;
        }
    }
    /*\
     * Element.transform
     [ method ]
     **
     * Gets or sets transformation of the element
     **
     - tstr (string) transform string in Snap or SVG format
     = (Element) the current element
     * or
     = (object) transformation descriptor:
     o {
     o     string (string) transform string,
     o     globalMatrix (Matrix) matrix of all transformations applied to element or its parents,
     o     localMatrix (Matrix) matrix of transformations applied only to the element,
     o     diffMatrix (Matrix) matrix of difference between global and local transformations,
     o     global (string) global transformation as string,
     o     local (string) local transformation as string,
     o     toString (function) returns `string` property
     o }
    \*/
    elproto.transform = function (tstr) {
        var _ = this._;
        if (tstr == null) {
            var papa = this,
                global = new Snap.Matrix(this.node.getCTM()),
                local = extractTransform(this),
                ms = [local],
                m = new Snap.Matrix,
                i,
                localString = local.toTransformString(),
                string = Str(local) == Str(this.matrix) ?
                            Str(_.transform) : localString;
            while (papa.type != "svg" && (papa = papa.parent())) {
                ms.push(extractTransform(papa));
            }
            i = ms.length;
            while (i--) {
                m.add(ms[i]);
            }
            return {
                string: string,
                globalMatrix: global,
                totalMatrix: m,
                localMatrix: local,
                diffMatrix: global.clone().add(local.invert()),
                global: global.toTransformString(),
                total: m.toTransformString(),
                local: localString,
                toString: propString
            };
        }
        if (tstr instanceof Snap.Matrix) {
            this.matrix = tstr;
            this._.transform = tstr.toTransformString();
        } else {
            extractTransform(this, tstr);
        }

        if (this.node) {
            if (this.type == "linearGradient" || this.type == "radialGradient") {
                $(this.node, {gradientTransform: this.matrix});
            } else if (this.type == "pattern") {
                $(this.node, {patternTransform: this.matrix});
            } else {
                $(this.node, {transform: this.matrix});
            }
        }

        return this;
    };
    /*\
     * Element.parent
     [ method ]
     **
     * Returns the element's parent
     **
     = (Element) the parent element
    \*/
    elproto.parent = function () {
        return wrap(this.node.parentNode);
    };
    /*\
     * Element.append
     [ method ]
     **
     * Appends the given element to current one
     **
     - el (Element|Set) element to append
     = (Element) the parent element
    \*/
    /*\
     * Element.add
     [ method ]
     **
     * See @Element.append
    \*/
    elproto.append = elproto.add = function (el) {
        if (el) {
            if (el.type == "set") {
                var it = this;
                el.forEach(function (el) {
                    it.add(el);
                });
                return this;
            }
            el = wrap(el);
            this.node.appendChild(el.node);
            el.paper = this.paper;
        }
        return this;
    };
    /*\
     * Element.appendTo
     [ method ]
     **
     * Appends the current element to the given one
     **
     - el (Element) parent element to append to
     = (Element) the child element
    \*/
    elproto.appendTo = function (el) {
        if (el) {
            el = wrap(el);
            el.append(this);
        }
        return this;
    };
    /*\
     * Element.prepend
     [ method ]
     **
     * Prepends the given element to the current one
     **
     - el (Element) element to prepend
     = (Element) the parent element
    \*/
    elproto.prepend = function (el) {
        if (el) {
            if (el.type == "set") {
                var it = this,
                    first;
                el.forEach(function (el) {
                    if (first) {
                        first.after(el);
                    } else {
                        it.prepend(el);
                    }
                    first = el;
                });
                return this;
            }
            el = wrap(el);
            var parent = el.parent();
            this.node.insertBefore(el.node, this.node.firstChild);
            this.add && this.add();
            el.paper = this.paper;
            this.parent() && this.parent().add();
            parent && parent.add();
        }
        return this;
    };
    /*\
     * Element.prependTo
     [ method ]
     **
     * Prepends the current element to the given one
     **
     - el (Element) parent element to prepend to
     = (Element) the child element
    \*/
    elproto.prependTo = function (el) {
        el = wrap(el);
        el.prepend(this);
        return this;
    };
    /*\
     * Element.before
     [ method ]
     **
     * Inserts given element before the current one
     **
     - el (Element) element to insert
     = (Element) the parent element
    \*/
    elproto.before = function (el) {
        if (el.type == "set") {
            var it = this;
            el.forEach(function (el) {
                var parent = el.parent();
                it.node.parentNode.insertBefore(el.node, it.node);
                parent && parent.add();
            });
            this.parent().add();
            return this;
        }
        el = wrap(el);
        var parent = el.parent();
        this.node.parentNode.insertBefore(el.node, this.node);
        this.parent() && this.parent().add();
        parent && parent.add();
        el.paper = this.paper;
        return this;
    };
    /*\
     * Element.after
     [ method ]
     **
     * Inserts given element after the current one
     **
     - el (Element) element to insert
     = (Element) the parent element
    \*/
    elproto.after = function (el) {
        el = wrap(el);
        var parent = el.parent();
        if (this.node.nextSibling) {
            this.node.parentNode.insertBefore(el.node, this.node.nextSibling);
        } else {
            this.node.parentNode.appendChild(el.node);
        }
        this.parent() && this.parent().add();
        parent && parent.add();
        el.paper = this.paper;
        return this;
    };
    /*\
     * Element.insertBefore
     [ method ]
     **
     * Inserts the element after the given one
     **
     - el (Element) element next to whom insert to
     = (Element) the parent element
    \*/
    elproto.insertBefore = function (el) {
        el = wrap(el);
        var parent = this.parent();
        el.node.parentNode.insertBefore(this.node, el.node);
        this.paper = el.paper;
        parent && parent.add();
        el.parent() && el.parent().add();
        return this;
    };
    /*\
     * Element.insertAfter
     [ method ]
     **
     * Inserts the element after the given one
     **
     - el (Element) element next to whom insert to
     = (Element) the parent element
    \*/
    elproto.insertAfter = function (el) {
        el = wrap(el);
        var parent = this.parent();
        el.node.parentNode.insertBefore(this.node, el.node.nextSibling);
        this.paper = el.paper;
        parent && parent.add();
        el.parent() && el.parent().add();
        return this;
    };
    /*\
     * Element.remove
     [ method ]
     **
     * Removes element from the DOM
     = (Element) the detached element
    \*/
    elproto.remove = function () {
        var parent = this.parent();
        this.node.parentNode && this.node.parentNode.removeChild(this.node);
        delete this.paper;
        this.removed = true;
        parent && parent.add();
        return this;
    };
    /*\
     * Element.select
     [ method ]
     **
     * Gathers the nested @Element matching the given set of CSS selectors
     **
     - query (string) CSS selector
     = (Element) result of query selection
    \*/
    elproto.select = function (query) {
        return wrap(this.node.querySelector(query));
    };
    /*\
     * Element.selectAll
     [ method ]
     **
     * Gathers nested @Element objects matching the given set of CSS selectors
     **
     - query (string) CSS selector
     = (Set|array) result of query selection
    \*/
    elproto.selectAll = function (query) {
        var nodelist = this.node.querySelectorAll(query),
            set = (Snap.set || Array)();
        for (var i = 0; i < nodelist.length; i++) {
            set.push(wrap(nodelist[i]));
        }
        return set;
    };
    /*\
     * Element.asPX
     [ method ]
     **
     * Returns given attribute of the element as a `px` value (not %, em, etc.)
     **
     - attr (string) attribute name
     - value (string) #optional attribute value
     = (Element) result of query selection
    \*/
    elproto.asPX = function (attr, value) {
        if (value == null) {
            value = this.attr(attr);
        }
        return +unit2px(this, attr, value);
    };
    // SIERRA Element.use(): I suggest adding a note about how to access the original element the returned <use> instantiates. It's a part of SVG with which ordinary web developers may be least familiar.
    /*\
     * Element.use
     [ method ]
     **
     * Creates a `<use>` element linked to the current element
     **
     = (Element) the `<use>` element
    \*/
    elproto.use = function () {
        var use,
            id = this.node.id;
        if (!id) {
            id = this.id;
            $(this.node, {
                id: id
            });
        }
        if (this.type == "linearGradient" || this.type == "radialGradient" ||
            this.type == "pattern") {
            use = make(this.type, this.node.parentNode);
        } else {
            use = make("use", this.node.parentNode);
        }
        $(use.node, {
            "xlink:href": "#" + id
        });
        use.original = this;
        return use;
    };
    function fixids(el) {
        var els = el.selectAll("*"),
            it,
            url = /^\s*url\(("|'|)(.*)\1\)\s*$/,
            ids = [],
            uses = {};
        function urltest(it, name) {
            var val = $(it.node, name);
            val = val && val.match(url);
            val = val && val[2];
            if (val && val.charAt() == "#") {
                val = val.substring(1);
            } else {
                return;
            }
            if (val) {
                uses[val] = (uses[val] || []).concat(function (id) {
                    var attr = {};
                    attr[name] = URL(id);
                    $(it.node, attr);
                });
            }
        }
        function linktest(it) {
            var val = $(it.node, "xlink:href");
            if (val && val.charAt() == "#") {
                val = val.substring(1);
            } else {
                return;
            }
            if (val) {
                uses[val] = (uses[val] || []).concat(function (id) {
                    it.attr("xlink:href", "#" + id);
                });
            }
        }
        for (var i = 0, ii = els.length; i < ii; i++) {
            it = els[i];
            urltest(it, "fill");
            urltest(it, "stroke");
            urltest(it, "filter");
            urltest(it, "mask");
            urltest(it, "clip-path");
            linktest(it);
            var oldid = $(it.node, "id");
            if (oldid) {
                $(it.node, {id: it.id});
                ids.push({
                    old: oldid,
                    id: it.id
                });
            }
        }
        for (i = 0, ii = ids.length; i < ii; i++) {
            var fs = uses[ids[i].old];
            if (fs) {
                for (var j = 0, jj = fs.length; j < jj; j++) {
                    fs[j](ids[i].id);
                }
            }
        }
    }
    /*\
     * Element.clone
     [ method ]
     **
     * Creates a clone of the element and inserts it after the element
     **
     = (Element) the clone
    \*/
    elproto.clone = function () {
        var clone = wrap(this.node.cloneNode(true));
        if ($(clone.node, "id")) {
            $(clone.node, {id: clone.id});
        }
        fixids(clone);
        clone.insertAfter(this);
        return clone;
    };
    /*\
     * Element.toDefs
     [ method ]
     **
     * Moves element to the shared `<defs>` area
     **
     = (Element) the element
    \*/
    elproto.toDefs = function () {
        var defs = getSomeDefs(this);
        defs.appendChild(this.node);
        return this;
    };
    /*\
     * Element.toPattern
     [ method ]
     **
     * Creates a `<pattern>` element from the current element
     **
     * To create a pattern you have to specify the pattern rect:
     - x (string|number)
     - y (string|number)
     - width (string|number)
     - height (string|number)
     = (Element) the `<pattern>` element
     * You can use pattern later on as an argument for `fill` attribute:
     | var p = paper.path("M10-5-10,15M15,0,0,15M0-5-20,15").attr({
     |         fill: "none",
     |         stroke: "#bada55",
     |         strokeWidth: 5
     |     }).pattern(0, 0, 10, 10),
     |     c = paper.circle(200, 200, 100);
     | c.attr({
     |     fill: p
     | });
    \*/
    elproto.pattern = elproto.toPattern = function (x, y, width, height) {
        var p = make("pattern", getSomeDefs(this));
        if (x == null) {
            x = this.getBBox();
        }
        if (is(x, "object") && "x" in x) {
            y = x.y;
            width = x.width;
            height = x.height;
            x = x.x;
        }
        $(p.node, {
            x: x,
            y: y,
            width: width,
            height: height,
            patternUnits: "userSpaceOnUse",
            id: p.id,
            viewBox: [x, y, width, height].join(" ")
        });
        p.node.appendChild(this.node);
        return p;
    };
// SIERRA Element.marker(): clarify what a reference point is. E.g., helps you offset the object from its edge such as when centering it over a path.
// SIERRA Element.marker(): I suggest the method should accept default reference point values.  Perhaps centered with (refX = width/2) and (refY = height/2)? Also, couldn't it assume the element's current _width_ and _height_? And please specify what _x_ and _y_ mean: offsets? If so, from where?  Couldn't they also be assigned default values?
    /*\
     * Element.marker
     [ method ]
     **
     * Creates a `<marker>` element from the current element
     **
     * To create a marker you have to specify the bounding rect and reference point:
     - x (number)
     - y (number)
     - width (number)
     - height (number)
     - refX (number)
     - refY (number)
     = (Element) the `<marker>` element
     * You can specify the marker later as an argument for `marker-start`, `marker-end`, `marker-mid`, and `marker` attributes. The `marker` attribute places the marker at every point along the path, and `marker-mid` places them at every point except the start and end.
    \*/
    // TODO add usage for markers
    elproto.marker = function (x, y, width, height, refX, refY) {
        var p = make("marker", getSomeDefs(this));
        if (x == null) {
            x = this.getBBox();
        }
        if (is(x, "object") && "x" in x) {
            y = x.y;
            width = x.width;
            height = x.height;
            refX = x.refX || x.cx;
            refY = x.refY || x.cy;
            x = x.x;
        }
        $(p.node, {
            viewBox: [x, y, width, height].join(" "),
            markerWidth: width,
            markerHeight: height,
            orient: "auto",
            refX: refX || 0,
            refY: refY || 0,
            id: p.id
        });
        p.node.appendChild(this.node);
        return p;
    };
    // animation
    function slice(from, to, f) {
        return function (arr) {
            var res = arr.slice(from, to);
            if (res.length == 1) {
                res = res[0];
            }
            return f ? f(res) : res;
        };
    }
    var Animation = function (attr, ms, easing, callback) {
        if (typeof easing == "function" && !easing.length) {
            callback = easing;
            easing = mina.linear;
        }
        this.attr = attr;
        this.dur = ms;
        easing && (this.easing = easing);
        callback && (this.callback = callback);
    };
    Snap._.Animation = Animation;
    /*\
     * Snap.animation
     [ method ]
     **
     * Creates an animation object
     **
     - attr (object) attributes of final destination
     - duration (number) duration of the animation, in milliseconds
     - easing (function) #optional one of easing functions of @mina or custom one
     - callback (function) #optional callback function that fires when animation ends
     = (object) animation object
    \*/
    Snap.animation = function (attr, ms, easing, callback) {
        return new Animation(attr, ms, easing, callback);
    };
    /*\
     * Element.inAnim
     [ method ]
     **
     * Returns a set of animations that may be able to manipulate the current element
     **
     = (object) in format:
     o {
     o     anim (object) animation object,
     o     mina (object) @mina object,
     o     curStatus (number) 0..1 — status of the animation: 0 — just started, 1 — just finished,
     o     status (function) gets or sets the status of the animation,
     o     stop (function) stops the animation
     o }
    \*/
    elproto.inAnim = function () {
        var el = this,
            res = [];
        for (var id in el.anims) if (el.anims[has](id)) {
            (function (a) {
                res.push({
                    anim: new Animation(a._attrs, a.dur, a.easing, a._callback),
                    mina: a,
                    curStatus: a.status(),
                    status: function (val) {
                        return a.status(val);
                    },
                    stop: function () {
                        a.stop();
                    }
                });
            }(el.anims[id]));
        }
        return res;
    };
    /*\
     * Snap.animate
     [ method ]
     **
     * Runs generic animation of one number into another with a caring function
     **
     - from (number|array) number or array of numbers
     - to (number|array) number or array of numbers
     - setter (function) caring function that accepts one number argument
     - duration (number) duration, in milliseconds
     - easing (function) #optional easing function from @mina or custom
     - callback (function) #optional callback function to execute when animation ends
     = (object) animation object in @mina format
     o {
     o     id (string) animation id, consider it read-only,
     o     duration (function) gets or sets the duration of the animation,
     o     easing (function) easing,
     o     speed (function) gets or sets the speed of the animation,
     o     status (function) gets or sets the status of the animation,
     o     stop (function) stops the animation
     o }
     | var rect = Snap().rect(0, 0, 10, 10);
     | Snap.animate(0, 10, function (val) {
     |     rect.attr({
     |         x: val
     |     });
     | }, 1000);
     | // in given context is equivalent to
     | rect.animate({x: 10}, 1000);
    \*/
    Snap.animate = function (from, to, setter, ms, easing, callback) {
        if (typeof easing == "function" && !easing.length) {
            callback = easing;
            easing = mina.linear;
        }
        var now = mina.time(),
            anim = mina(from, to, now, now + ms, mina.time, setter, easing);
        callback && eve.once("mina.finish." + anim.id, callback);
        return anim;
    };
    /*\
     * Element.stop
     [ method ]
     **
     * Stops all the animations for the current element
     **
     = (Element) the current element
    \*/
    elproto.stop = function () {
        var anims = this.inAnim();
        for (var i = 0, ii = anims.length; i < ii; i++) {
            anims[i].stop();
        }
        return this;
    };
    /*\
     * Element.animate
     [ method ]
     **
     * Animates the given attributes of the element
     **
     - attrs (object) key-value pairs of destination attributes
     - duration (number) duration of the animation in milliseconds
     - easing (function) #optional easing function from @mina or custom
     - callback (function) #optional callback function that executes when the animation ends
     = (Element) the current element
    \*/
    elproto.animate = function (attrs, ms, easing, callback) {
        if (typeof easing == "function" && !easing.length) {
            callback = easing;
            easing = mina.linear;
        }
        if (attrs instanceof Animation) {
            callback = attrs.callback;
            easing = attrs.easing;
            ms = attrs.dur;
            attrs = attrs.attr;
        }
        var fkeys = [], tkeys = [], keys = {}, from, to, f, eq,
            el = this;
        for (var key in attrs) if (attrs[has](key)) {
            if (el.equal) {
                eq = el.equal(key, Str(attrs[key]));
                from = eq.from;
                to = eq.to;
                f = eq.f;
            } else {
                from = +el.attr(key);
                to = +attrs[key];
            }
            var len = is(from, "array") ? from.length : 1;
            keys[key] = slice(fkeys.length, fkeys.length + len, f);
            fkeys = fkeys.concat(from);
            tkeys = tkeys.concat(to);
        }
        var now = mina.time(),
            anim = mina(fkeys, tkeys, now, now + ms, mina.time, function (val) {
                var attr = {};
                for (var key in keys) if (keys[has](key)) {
                    attr[key] = keys[key](val);
                }
                el.attr(attr);
            }, easing);
        el.anims[anim.id] = anim;
        anim._attrs = attrs;
        anim._callback = callback;
        eve("snap.animcreated." + el.id, anim);
        eve.once("mina.finish." + anim.id, function () {
            delete el.anims[anim.id];
            callback && callback.call(el);
        });
        eve.once("mina.stop." + anim.id, function () {
            delete el.anims[anim.id];
        });
        return el;
    };
    var eldata = {};
    /*\
     * Element.data
     [ method ]
     **
     * Adds or retrieves given value associated with given key. (Don’t confuse
     * with `data-` attributes)
     *
     * See also @Element.removeData
     - key (string) key to store data
     - value (any) #optional value to store
     = (object) @Element
     * or, if value is not specified:
     = (any) value
     > Usage
     | for (var i = 0, i < 5, i++) {
     |     paper.circle(10 + 15 * i, 10, 10)
     |          .attr({fill: "#000"})
     |          .data("i", i)
     |          .click(function () {
     |             alert(this.data("i"));
     |          });
     | }
    \*/
    elproto.data = function (key, value) {
        var data = eldata[this.id] = eldata[this.id] || {};
        if (arguments.length == 0){
            eve("snap.data.get." + this.id, this, data, null);
            return data;
        }
        if (arguments.length == 1) {
            if (Snap.is(key, "object")) {
                for (var i in key) if (key[has](i)) {
                    this.data(i, key[i]);
                }
                return this;
            }
            eve("snap.data.get." + this.id, this, data[key], key);
            return data[key];
        }
        data[key] = value;
        eve("snap.data.set." + this.id, this, value, key);
        return this;
    };
    /*\
     * Element.removeData
     [ method ]
     **
     * Removes value associated with an element by given key.
     * If key is not provided, removes all the data of the element.
     - key (string) #optional key
     = (object) @Element
    \*/
    elproto.removeData = function (key) {
        if (key == null) {
            eldata[this.id] = {};
        } else {
            eldata[this.id] && delete eldata[this.id][key];
        }
        return this;
    };
    /*\
     * Element.outerSVG
     [ method ]
     **
     * Returns SVG code for the element, equivalent to HTML's `outerHTML`.
     *
     * See also @Element.innerSVG
     = (string) SVG code for the element
    \*/
    /*\
     * Element.toString
     [ method ]
     **
     * See @Element.outerSVG
    \*/
    elproto.outerSVG = elproto.toString = toString(1);
    /*\
     * Element.innerSVG
     [ method ]
     **
     * Returns SVG code for the element's contents, equivalent to HTML's `innerHTML`
     = (string) SVG code for the element
    \*/
    elproto.innerSVG = toString();
    function toString(type) {
        return function () {
            var res = type ? "<" + this.type : "",
                attr = this.node.attributes,
                chld = this.node.childNodes;
            if (type) {
                for (var i = 0, ii = attr.length; i < ii; i++) {
                    res += " " + attr[i].name + '="' +
                            attr[i].value.replace(/"/g, '\\"') + '"';
                }
            }
            if (chld.length) {
                type && (res += ">");
                for (i = 0, ii = chld.length; i < ii; i++) {
                    if (chld[i].nodeType == 3) {
                        res += chld[i].nodeValue;
                    } else if (chld[i].nodeType == 1) {
                        res += wrap(chld[i]).toString();
                    }
                }
                type && (res += "</" + this.type + ">");
            } else {
                type && (res += "/>");
            }
            return res;
        };
    }
    elproto.toDataURL = function () {
        if (window && window.btoa) {
            var bb = this.getBBox(),
                svg = Snap.format('<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{width}" height="{height}" viewBox="{x} {y} {width} {height}">{contents}</svg>', {
                x: +bb.x.toFixed(3),
                y: +bb.y.toFixed(3),
                width: +bb.width.toFixed(3),
                height: +bb.height.toFixed(3),
                contents: this.outerSVG()
            });
            return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
        }
    };
    /*\
     * Fragment.select
     [ method ]
     **
     * See @Element.select
    \*/
    Fragment.prototype.select = elproto.select;
    /*\
     * Fragment.selectAll
     [ method ]
     **
     * See @Element.selectAll
    \*/
    Fragment.prototype.selectAll = elproto.selectAll;
});

// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Snap.plugin(function (Snap, Element, Paper, glob, Fragment) {
    var objectToString = Object.prototype.toString,
        Str = String,
        math = Math,
        E = "";
    function Matrix(a, b, c, d, e, f) {
        if (b == null && objectToString.call(a) == "[object SVGMatrix]") {
            this.a = a.a;
            this.b = a.b;
            this.c = a.c;
            this.d = a.d;
            this.e = a.e;
            this.f = a.f;
            return;
        }
        if (a != null) {
            this.a = +a;
            this.b = +b;
            this.c = +c;
            this.d = +d;
            this.e = +e;
            this.f = +f;
        } else {
            this.a = 1;
            this.b = 0;
            this.c = 0;
            this.d = 1;
            this.e = 0;
            this.f = 0;
        }
    }
    (function (matrixproto) {
        /*\
         * Matrix.add
         [ method ]
         **
         * Adds the given matrix to existing one
         - a (number)
         - b (number)
         - c (number)
         - d (number)
         - e (number)
         - f (number)
         * or
         - matrix (object) @Matrix
        \*/
        matrixproto.add = function (a, b, c, d, e, f) {
            var out = [[], [], []],
                m = [[this.a, this.c, this.e], [this.b, this.d, this.f], [0, 0, 1]],
                matrix = [[a, c, e], [b, d, f], [0, 0, 1]],
                x, y, z, res;

            if (a && a instanceof Matrix) {
                matrix = [[a.a, a.c, a.e], [a.b, a.d, a.f], [0, 0, 1]];
            }

            for (x = 0; x < 3; x++) {
                for (y = 0; y < 3; y++) {
                    res = 0;
                    for (z = 0; z < 3; z++) {
                        res += m[x][z] * matrix[z][y];
                    }
                    out[x][y] = res;
                }
            }
            this.a = out[0][0];
            this.b = out[1][0];
            this.c = out[0][1];
            this.d = out[1][1];
            this.e = out[0][2];
            this.f = out[1][2];
            return this;
        };
        /*\
         * Matrix.invert
         [ method ]
         **
         * Returns an inverted version of the matrix
         = (object) @Matrix
        \*/
        matrixproto.invert = function () {
            var me = this,
                x = me.a * me.d - me.b * me.c;
            return new Matrix(me.d / x, -me.b / x, -me.c / x, me.a / x, (me.c * me.f - me.d * me.e) / x, (me.b * me.e - me.a * me.f) / x);
        };
        /*\
         * Matrix.clone
         [ method ]
         **
         * Returns a copy of the matrix
         = (object) @Matrix
        \*/
        matrixproto.clone = function () {
            return new Matrix(this.a, this.b, this.c, this.d, this.e, this.f);
        };
        /*\
         * Matrix.translate
         [ method ]
         **
         * Translate the matrix
         - x (number) horizontal offset distance
         - y (number) vertical offset distance
        \*/
        matrixproto.translate = function (x, y) {
            return this.add(1, 0, 0, 1, x, y);
        };
        /*\
         * Matrix.scale
         [ method ]
         **
         * Scales the matrix
         - x (number) amount to be scaled, with `1` resulting in no change
         - y (number) #optional amount to scale along the vertical axis. (Otherwise `x` applies to both axes.)
         - cx (number) #optional horizontal origin point from which to scale
         - cy (number) #optional vertical origin point from which to scale
         * Default cx, cy is the middle point of the element.
        \*/
        matrixproto.scale = function (x, y, cx, cy) {
            y == null && (y = x);
            (cx || cy) && this.add(1, 0, 0, 1, cx, cy);
            this.add(x, 0, 0, y, 0, 0);
            (cx || cy) && this.add(1, 0, 0, 1, -cx, -cy);
            return this;
        };
        /*\
         * Matrix.rotate
         [ method ]
         **
         * Rotates the matrix
         - a (number) angle of rotation, in degrees
         - x (number) horizontal origin point from which to rotate
         - y (number) vertical origin point from which to rotate
        \*/
        matrixproto.rotate = function (a, x, y) {
            a = Snap.rad(a);
            x = x || 0;
            y = y || 0;
            var cos = +math.cos(a).toFixed(9),
                sin = +math.sin(a).toFixed(9);
            this.add(cos, sin, -sin, cos, x, y);
            return this.add(1, 0, 0, 1, -x, -y);
        };
        /*\
         * Matrix.x
         [ method ]
         **
         * Returns x coordinate for given point after transformation described by the matrix. See also @Matrix.y
         - x (number)
         - y (number)
         = (number) x
        \*/
        matrixproto.x = function (x, y) {
            return x * this.a + y * this.c + this.e;
        };
        /*\
         * Matrix.y
         [ method ]
         **
         * Returns y coordinate for given point after transformation described by the matrix. See also @Matrix.x
         - x (number)
         - y (number)
         = (number) y
        \*/
        matrixproto.y = function (x, y) {
            return x * this.b + y * this.d + this.f;
        };
        matrixproto.get = function (i) {
            return +this[Str.fromCharCode(97 + i)].toFixed(4);
        };
        matrixproto.toString = function () {
            return "matrix(" + [this.get(0), this.get(1), this.get(2), this.get(3), this.get(4), this.get(5)].join() + ")";
        };
        matrixproto.offset = function () {
            return [this.e.toFixed(4), this.f.toFixed(4)];
        };
        function norm(a) {
            return a[0] * a[0] + a[1] * a[1];
        }
        function normalize(a) {
            var mag = math.sqrt(norm(a));
            a[0] && (a[0] /= mag);
            a[1] && (a[1] /= mag);
        }
        /*\
         * Matrix.determinant
         [ method ]
         **
         * Finds determinant of the given matrix.
         = (number) determinant
        \*/
        matrixproto.determinant = function () {
            return this.a * this.d - this.b * this.c;
        };
        /*\
         * Matrix.split
         [ method ]
         **
         * Splits matrix into primitive transformations
         = (object) in format:
         o dx (number) translation by x
         o dy (number) translation by y
         o scalex (number) scale by x
         o scaley (number) scale by y
         o shear (number) shear
         o rotate (number) rotation in deg
         o isSimple (boolean) could it be represented via simple transformations
        \*/
        matrixproto.split = function () {
            var out = {};
            // translation
            out.dx = this.e;
            out.dy = this.f;

            // scale and shear
            var row = [[this.a, this.c], [this.b, this.d]];
            out.scalex = math.sqrt(norm(row[0]));
            normalize(row[0]);

            out.shear = row[0][0] * row[1][0] + row[0][1] * row[1][1];
            row[1] = [row[1][0] - row[0][0] * out.shear, row[1][1] - row[0][1] * out.shear];

            out.scaley = math.sqrt(norm(row[1]));
            normalize(row[1]);
            out.shear /= out.scaley;

            if (this.determinant() < 0) {
                out.scalex = -out.scalex;
            }

            // rotation
            var sin = -row[0][1],
                cos = row[1][1];
            if (cos < 0) {
                out.rotate = Snap.deg(math.acos(cos));
                if (sin < 0) {
                    out.rotate = 360 - out.rotate;
                }
            } else {
                out.rotate = Snap.deg(math.asin(sin));
            }

            out.isSimple = !+out.shear.toFixed(9) && (out.scalex.toFixed(9) == out.scaley.toFixed(9) || !out.rotate);
            out.isSuperSimple = !+out.shear.toFixed(9) && out.scalex.toFixed(9) == out.scaley.toFixed(9) && !out.rotate;
            out.noRotation = !+out.shear.toFixed(9) && !out.rotate;
            return out;
        };
        /*\
         * Matrix.toTransformString
         [ method ]
         **
         * Returns transform string that represents given matrix
         = (string) transform string
        \*/
        matrixproto.toTransformString = function (shorter) {
            var s = shorter || this.split();
            if (!+s.shear.toFixed(9)) {
                s.scalex = +s.scalex.toFixed(4);
                s.scaley = +s.scaley.toFixed(4);
                s.rotate = +s.rotate.toFixed(4);
                return  (s.dx || s.dy ? "t" + [+s.dx.toFixed(4), +s.dy.toFixed(4)] : E) + 
                        (s.scalex != 1 || s.scaley != 1 ? "s" + [s.scalex, s.scaley, 0, 0] : E) +
                        (s.rotate ? "r" + [+s.rotate.toFixed(4), 0, 0] : E);
            } else {
                return "m" + [this.get(0), this.get(1), this.get(2), this.get(3), this.get(4), this.get(5)];
            }
        };
    })(Matrix.prototype);
    /*\
     * Snap.Matrix
     [ method ]
     **
     * Matrix constructor, extend on your own risk.
     * To create matrices use @Snap.matrix.
    \*/
    Snap.Matrix = Matrix;
    /*\
     * Snap.matrix
     [ method ]
     **
     * Utility method
     **
     * Returns a matrix based on the given parameters
     - a (number)
     - b (number)
     - c (number)
     - d (number)
     - e (number)
     - f (number)
     * or
     - svgMatrix (SVGMatrix)
     = (object) @Matrix
    \*/
    Snap.matrix = function (a, b, c, d, e, f) {
        return new Matrix(a, b, c, d, e, f);
    };
});
// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Snap.plugin(function (Snap, Element, Paper, glob, Fragment) {
    var has = "hasOwnProperty",
        make = Snap._.make,
        wrap = Snap._.wrap,
        is = Snap.is,
        getSomeDefs = Snap._.getSomeDefs,
        reURLValue = /^url\(#?([^)]+)\)$/,
        $ = Snap._.$,
        URL = Snap.url,
        Str = String,
        separator = Snap._.separator,
        E = "";
    // Attributes event handlers
    eve.on("snap.util.attr.mask", function (value) {
        if (value instanceof Element || value instanceof Fragment) {
            eve.stop();
            if (value instanceof Fragment && value.node.childNodes.length == 1) {
                value = value.node.firstChild;
                getSomeDefs(this).appendChild(value);
                value = wrap(value);
            }
            if (value.type == "mask") {
                var mask = value;
            } else {
                mask = make("mask", getSomeDefs(this));
                mask.node.appendChild(value.node);
            }
            !mask.node.id && $(mask.node, {
                id: mask.id
            });
            $(this.node, {
                mask: URL(mask.id)
            });
        }
    });
    (function (clipIt) {
        eve.on("snap.util.attr.clip", clipIt);
        eve.on("snap.util.attr.clip-path", clipIt);
        eve.on("snap.util.attr.clipPath", clipIt);
    }(function (value) {
        if (value instanceof Element || value instanceof Fragment) {
            eve.stop();
            if (value.type == "clipPath") {
                var clip = value;
            } else {
                clip = make("clipPath", getSomeDefs(this));
                clip.node.appendChild(value.node);
                !clip.node.id && $(clip.node, {
                    id: clip.id
                });
            }
            $(this.node, {
                "clip-path": URL(clip.node.id || clip.id)
            });
        }
    }));
    function fillStroke(name) {
        return function (value) {
            eve.stop();
            if (value instanceof Fragment && value.node.childNodes.length == 1 &&
                (value.node.firstChild.tagName == "radialGradient" ||
                value.node.firstChild.tagName == "linearGradient" ||
                value.node.firstChild.tagName == "pattern")) {
                value = value.node.firstChild;
                getSomeDefs(this).appendChild(value);
                value = wrap(value);
            }
            if (value instanceof Element) {
                if (value.type == "radialGradient" || value.type == "linearGradient"
                   || value.type == "pattern") {
                    if (!value.node.id) {
                        $(value.node, {
                            id: value.id
                        });
                    }
                    var fill = URL(value.node.id);
                } else {
                    fill = value.attr(name);
                }
            } else {
                fill = Snap.color(value);
                if (fill.error) {
                    var grad = Snap(getSomeDefs(this).ownerSVGElement).gradient(value);
                    if (grad) {
                        if (!grad.node.id) {
                            $(grad.node, {
                                id: grad.id
                            });
                        }
                        fill = URL(grad.node.id);
                    } else {
                        fill = value;
                    }
                } else {
                    fill = Str(fill);
                }
            }
            var attrs = {};
            attrs[name] = fill;
            $(this.node, attrs);
            this.node.style[name] = E;
        };
    }
    eve.on("snap.util.attr.fill", fillStroke("fill"));
    eve.on("snap.util.attr.stroke", fillStroke("stroke"));
    var gradrg = /^([lr])(?:\(([^)]*)\))?(.*)$/i;
    eve.on("snap.util.grad.parse", function parseGrad(string) {
        string = Str(string);
        var tokens = string.match(gradrg);
        if (!tokens) {
            return null;
        }
        var type = tokens[1],
            params = tokens[2],
            stops = tokens[3];
        params = params.split(/\s*,\s*/).map(function (el) {
            return +el == el ? +el : el;
        });
        if (params.length == 1 && params[0] == 0) {
            params = [];
        }
        stops = stops.split("-");
        stops = stops.map(function (el) {
            el = el.split(":");
            var out = {
                color: el[0]
            };
            if (el[1]) {
                out.offset = parseFloat(el[1]);
            }
            return out;
        });
        return {
            type: type,
            params: params,
            stops: stops
        };
    });

    eve.on("snap.util.attr.d", function (value) {
        eve.stop();
        if (is(value, "array") && is(value[0], "array")) {
            value = Snap.path.toString.call(value);
        }
        value = Str(value);
        if (value.match(/[ruo]/i)) {
            value = Snap.path.toAbsolute(value);
        }
        $(this.node, {d: value});
    })(-1);
    eve.on("snap.util.attr.#text", function (value) {
        eve.stop();
        value = Str(value);
        var txt = glob.doc.createTextNode(value);
        while (this.node.firstChild) {
            this.node.removeChild(this.node.firstChild);
        }
        this.node.appendChild(txt);
    })(-1);
    eve.on("snap.util.attr.path", function (value) {
        eve.stop();
        this.attr({d: value});
    })(-1);
    eve.on("snap.util.attr.class", function (value) {
        eve.stop();
        this.node.className.baseVal = value;
    })(-1);
    eve.on("snap.util.attr.viewBox", function (value) {
        var vb;
        if (is(value, "object") && "x" in value) {
            vb = [value.x, value.y, value.width, value.height].join(" ");
        } else if (is(value, "array")) {
            vb = value.join(" ");
        } else {
            vb = value;
        }
        $(this.node, {
            viewBox: vb
        });
        eve.stop();
    })(-1);
    eve.on("snap.util.attr.transform", function (value) {
        this.transform(value);
        eve.stop();
    })(-1);
    eve.on("snap.util.attr.r", function (value) {
        if (this.type == "rect") {
            eve.stop();
            $(this.node, {
                rx: value,
                ry: value
            });
        }
    })(-1);
    eve.on("snap.util.attr.textpath", function (value) {
        eve.stop();
        if (this.type == "text") {
            var id, tp, node;
            if (!value && this.textPath) {
                tp = this.textPath;
                while (tp.node.firstChild) {
                    this.node.appendChild(tp.node.firstChild);
                }
                tp.remove();
                delete this.textPath;
                return;
            }
            if (is(value, "string")) {
                var defs = getSomeDefs(this),
                    path = wrap(defs.parentNode).path(value);
                defs.appendChild(path.node);
                id = path.id;
                path.attr({id: id});
            } else {
                value = wrap(value);
                if (value instanceof Element) {
                    id = value.attr("id");
                    if (!id) {
                        id = value.id;
                        value.attr({id: id});
                    }
                }
            }
            if (id) {
                tp = this.textPath;
                node = this.node;
                if (tp) {
                    tp.attr({"xlink:href": "#" + id});
                } else {
                    tp = $("textPath", {
                        "xlink:href": "#" + id
                    });
                    while (node.firstChild) {
                        tp.appendChild(node.firstChild);
                    }
                    node.appendChild(tp);
                    this.textPath = wrap(tp);
                }
            }
        }
    })(-1);
    eve.on("snap.util.attr.text", function (value) {
        if (this.type == "text") {
            var i = 0,
                node = this.node,
                tuner = function (chunk) {
                    var out = $("tspan");
                    if (is(chunk, "array")) {
                        for (var i = 0; i < chunk.length; i++) {
                            out.appendChild(tuner(chunk[i]));
                        }
                    } else {
                        out.appendChild(glob.doc.createTextNode(chunk));
                    }
                    out.normalize && out.normalize();
                    return out;
                };
            while (node.firstChild) {
                node.removeChild(node.firstChild);
            }
            var tuned = tuner(value);
            while (tuned.firstChild) {
                node.appendChild(tuned.firstChild);
            }
        }
        eve.stop();
    })(-1);
    function setFontSize(value) {
        eve.stop();
        if (value == +value) {
            value += "px";
        }
        this.node.style.fontSize = value;
    }
    eve.on("snap.util.attr.fontSize", setFontSize)(-1);
    eve.on("snap.util.attr.font-size", setFontSize)(-1);


    eve.on("snap.util.getattr.transform", function () {
        eve.stop();
        return this.transform();
    })(-1);
    eve.on("snap.util.getattr.textpath", function () {
        eve.stop();
        return this.textPath;
    })(-1);
    // Markers
    (function () {
        function getter(end) {
            return function () {
                eve.stop();
                var style = glob.doc.defaultView.getComputedStyle(this.node, null).getPropertyValue("marker-" + end);
                if (style == "none") {
                    return style;
                } else {
                    return Snap(glob.doc.getElementById(style.match(reURLValue)[1]));
                }
            };
        }
        function setter(end) {
            return function (value) {
                eve.stop();
                var name = "marker" + end.charAt(0).toUpperCase() + end.substring(1);
                if (value == "" || !value) {
                    this.node.style[name] = "none";
                    return;
                }
                if (value.type == "marker") {
                    var id = value.node.id;
                    if (!id) {
                        $(value.node, {id: value.id});
                    }
                    this.node.style[name] = URL(id);
                    return;
                }
            };
        }
        eve.on("snap.util.getattr.marker-end", getter("end"))(-1);
        eve.on("snap.util.getattr.markerEnd", getter("end"))(-1);
        eve.on("snap.util.getattr.marker-start", getter("start"))(-1);
        eve.on("snap.util.getattr.markerStart", getter("start"))(-1);
        eve.on("snap.util.getattr.marker-mid", getter("mid"))(-1);
        eve.on("snap.util.getattr.markerMid", getter("mid"))(-1);
        eve.on("snap.util.attr.marker-end", setter("end"))(-1);
        eve.on("snap.util.attr.markerEnd", setter("end"))(-1);
        eve.on("snap.util.attr.marker-start", setter("start"))(-1);
        eve.on("snap.util.attr.markerStart", setter("start"))(-1);
        eve.on("snap.util.attr.marker-mid", setter("mid"))(-1);
        eve.on("snap.util.attr.markerMid", setter("mid"))(-1);
    }());
    eve.on("snap.util.getattr.r", function () {
        if (this.type == "rect" && $(this.node, "rx") == $(this.node, "ry")) {
            eve.stop();
            return $(this.node, "rx");
        }
    })(-1);
    function textExtract(node) {
        var out = [];
        var children = node.childNodes;
        for (var i = 0, ii = children.length; i < ii; i++) {
            var chi = children[i];
            if (chi.nodeType == 3) {
                out.push(chi.nodeValue);
            }
            if (chi.tagName == "tspan") {
                if (chi.childNodes.length == 1 && chi.firstChild.nodeType == 3) {
                    out.push(chi.firstChild.nodeValue);
                } else {
                    out.push(textExtract(chi));
                }
            }
        }
        return out;
    }
    eve.on("snap.util.getattr.text", function () {
        if (this.type == "text" || this.type == "tspan") {
            eve.stop();
            var out = textExtract(this.node);
            return out.length == 1 ? out[0] : out;
        }
    })(-1);
    eve.on("snap.util.getattr.#text", function () {
        return this.node.textContent;
    })(-1);
    eve.on("snap.util.getattr.viewBox", function () {
        eve.stop();
        var vb = $(this.node, "viewBox");
        if (vb) {
            vb = vb.split(separator);
            return Snap._.box(+vb[0], +vb[1], +vb[2], +vb[3]);
        } else {
            return;
        }
    })(-1);
    eve.on("snap.util.getattr.points", function () {
        var p = $(this.node, "points");
        eve.stop();
        if (p) {
            return p.split(separator);
        } else {
            return;
        }
    })(-1);
    eve.on("snap.util.getattr.path", function () {
        var p = $(this.node, "d");
        eve.stop();
        return p;
    })(-1);
    eve.on("snap.util.getattr.class", function () {
        return this.node.className.baseVal;
    })(-1);
    function getFontSize() {
        eve.stop();
        return this.node.style.fontSize;
    }
    eve.on("snap.util.getattr.fontSize", getFontSize)(-1);
    eve.on("snap.util.getattr.font-size", getFontSize)(-1);
});

// Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Snap.plugin(function (Snap, Element, Paper, glob, Fragment) {
    var rgNotSpace = /\S+/g,
        rgBadSpace = /[\t\r\n\f]/g,
        rgTrim = /(^\s+|\s+$)/g,
        Str = String,
        elproto = Element.prototype;
    /*\
     * Element.addClass
     [ method ]
     **
     * Adds given class name or list of class names to the element.
     - value (string) class name or space separated list of class names
     **
     = (Element) original element.
    \*/
    elproto.addClass = function (value) {
        var classes = Str(value || "").match(rgNotSpace) || [],
            elem = this.node,
            className = elem.className.baseVal,
            curClasses = className.match(rgNotSpace) || [],
            j,
            pos,
            clazz,
            finalValue;

        if (classes.length) {
            j = 0;
            while ((clazz = classes[j++])) {
                pos = curClasses.indexOf(clazz);
                if (!~pos) {
                    curClasses.push(clazz);
                }
            }

            finalValue = curClasses.join(" ");
            if (className != finalValue) {
                elem.className.baseVal = finalValue;
            }
        }
        return this;
    };
    /*\
     * Element.removeClass
     [ method ]
     **
     * Removes given class name or list of class names from the element.
     - value (string) class name or space separated list of class names
     **
     = (Element) original element.
    \*/
    elproto.removeClass = function (value) {
        var classes = Str(value || "").match(rgNotSpace) || [],
            elem = this.node,
            className = elem.className.baseVal,
            curClasses = className.match(rgNotSpace) || [],
            j,
            pos,
            clazz,
            finalValue;
        if (curClasses.length) {
            j = 0;
            while ((clazz = classes[j++])) {
                pos = curClasses.indexOf(clazz);
                if (~pos) {
                    curClasses.splice(pos, 1);
                }
            }

            finalValue = curClasses.join(" ");
            if (className != finalValue) {
                elem.className.baseVal = finalValue;
            }
        }
        return this;
    };
    /*\
     * Element.hasClass
     [ method ]
     **
     * Checks if the element has a given class name in the list of class names applied to it.
     - value (string) class name
     **
     = (boolean) `true` if the element has given class
    \*/
    elproto.hasClass = function (value) {
        var elem = this.node,
            className = elem.className.baseVal,
            curClasses = className.match(rgNotSpace) || [];
        return !!~curClasses.indexOf(value);
    };
    /*\
     * Element.toggleClass
     [ method ]
     **
     * Add or remove one or more classes from the element, depending on either
     * the class’s presence or the value of the `flag` argument.
     - value (string) class name or space separated list of class names
     - flag (boolean) value to determine whether the class should be added or removed
     **
     = (Element) original element.
    \*/
    elproto.toggleClass = function (value, flag) {
        if (flag != null) {
            if (flag) {
                return this.addClass(value);
            } else {
                return this.removeClass(value);
            }
        }
        var classes = (value || "").match(rgNotSpace) || [],
            elem = this.node,
            className = elem.className.baseVal,
            curClasses = className.match(rgNotSpace) || [],
            j,
            pos,
            clazz,
            finalValue;
        j = 0;
        while ((clazz = classes[j++])) {
            pos = curClasses.indexOf(clazz);
            if (~pos) {
                curClasses.splice(pos, 1);
            } else {
                curClasses.push(clazz);
            }
        }

        finalValue = curClasses.join(" ");
        if (className != finalValue) {
            elem.className.baseVal = finalValue;
        }
        return this;
    };
});

// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Snap.plugin(function (Snap, Element, Paper, glob, Fragment) {
    var operators = {
            "+": function (x, y) {
                    return x + y;
                },
            "-": function (x, y) {
                    return x - y;
                },
            "/": function (x, y) {
                    return x / y;
                },
            "*": function (x, y) {
                    return x * y;
                }
        },
        Str = String,
        reUnit = /[a-z]+$/i,
        reAddon = /^\s*([+\-\/*])\s*=\s*([\d.eE+\-]+)\s*([^\d\s]+)?\s*$/;
    function getNumber(val) {
        return val;
    }
    function getUnit(unit) {
        return function (val) {
            return +val.toFixed(3) + unit;
        };
    }
    eve.on("snap.util.attr", function (val) {
        var plus = Str(val).match(reAddon);
        if (plus) {
            var evnt = eve.nt(),
                name = evnt.substring(evnt.lastIndexOf(".") + 1),
                a = this.attr(name),
                atr = {};
            eve.stop();
            var unit = plus[3] || "",
                aUnit = a.match(reUnit),
                op = operators[plus[1]];
            if (aUnit && aUnit == unit) {
                val = op(parseFloat(a), +plus[2]);
            } else {
                a = this.asPX(name);
                val = op(this.asPX(name), this.asPX(name, plus[2] + unit));
            }
            if (isNaN(a) || isNaN(val)) {
                return;
            }
            atr[name] = val;
            this.attr(atr);
        }
    })(-10);
    eve.on("snap.util.equal", function (name, b) {
        var A, B, a = Str(this.attr(name) || ""),
            el = this,
            bplus = Str(b).match(reAddon);
        if (bplus) {
            eve.stop();
            var unit = bplus[3] || "",
                aUnit = a.match(reUnit),
                op = operators[bplus[1]];
            if (aUnit && aUnit == unit) {
                return {
                    from: parseFloat(a),
                    to: op(parseFloat(a), +bplus[2]),
                    f: getUnit(aUnit)
                };
            } else {
                a = this.asPX(name);
                return {
                    from: a,
                    to: op(a, this.asPX(name, bplus[2] + unit)),
                    f: getNumber
                };
            }
        }
    })(-10);
});
// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Snap.plugin(function (Snap, Element, Paper, glob, Fragment) {
    var proto = Paper.prototype,
        is = Snap.is;
    /*\
     * Paper.rect
     [ method ]
     *
     * Draws a rectangle
     **
     - x (number) x coordinate of the top left corner
     - y (number) y coordinate of the top left corner
     - width (number) width
     - height (number) height
     - rx (number) #optional horizontal radius for rounded corners, default is 0
     - ry (number) #optional vertical radius for rounded corners, default is rx or 0
     = (object) the `rect` element
     **
     > Usage
     | // regular rectangle
     | var c = paper.rect(10, 10, 50, 50);
     | // rectangle with rounded corners
     | var c = paper.rect(40, 40, 50, 50, 10);
    \*/
    proto.rect = function (x, y, w, h, rx, ry) {
        var attr;
        if (ry == null) {
            ry = rx;
        }
        if (is(x, "object") && x == "[object Object]") {
            attr = x;
        } else if (x != null) {
            attr = {
                x: x,
                y: y,
                width: w,
                height: h
            };
            if (rx != null) {
                attr.rx = rx;
                attr.ry = ry;
            }
        }
        return this.el("rect", attr);
    };
    /*\
     * Paper.circle
     [ method ]
     **
     * Draws a circle
     **
     - x (number) x coordinate of the centre
     - y (number) y coordinate of the centre
     - r (number) radius
     = (object) the `circle` element
     **
     > Usage
     | var c = paper.circle(50, 50, 40);
    \*/
    proto.circle = function (cx, cy, r) {
        var attr;
        if (is(cx, "object") && cx == "[object Object]") {
            attr = cx;
        } else if (cx != null) {
            attr = {
                cx: cx,
                cy: cy,
                r: r
            };
        }
        return this.el("circle", attr);
    };

    var preload = (function () {
        function onerror() {
            this.parentNode.removeChild(this);
        }
        return function (src, f) {
            var img = glob.doc.createElement("img"),
                body = glob.doc.body;
            img.style.cssText = "position:absolute;left:-9999em;top:-9999em";
            img.onload = function () {
                f.call(img);
                img.onload = img.onerror = null;
                body.removeChild(img);
            };
            img.onerror = onerror;
            body.appendChild(img);
            img.src = src;
        };
    }());

    /*\
     * Paper.image
     [ method ]
     **
     * Places an image on the surface
     **
     - src (string) URI of the source image
     - x (number) x offset position
     - y (number) y offset position
     - width (number) width of the image
     - height (number) height of the image
     = (object) the `image` element
     * or
     = (object) Snap element object with type `image`
     **
     > Usage
     | var c = paper.image("apple.png", 10, 10, 80, 80);
    \*/
    proto.image = function (src, x, y, width, height) {
        var el = this.el("image");
        if (is(src, "object") && "src" in src) {
            el.attr(src);
        } else if (src != null) {
            var set = {
                "xlink:href": src,
                preserveAspectRatio: "none"
            };
            if (x != null && y != null) {
                set.x = x;
                set.y = y;
            }
            if (width != null && height != null) {
                set.width = width;
                set.height = height;
            } else {
                preload(src, function () {
                    Snap._.$(el.node, {
                        width: this.offsetWidth,
                        height: this.offsetHeight
                    });
                });
            }
            Snap._.$(el.node, set);
        }
        return el;
    };
    /*\
     * Paper.ellipse
     [ method ]
     **
     * Draws an ellipse
     **
     - x (number) x coordinate of the centre
     - y (number) y coordinate of the centre
     - rx (number) horizontal radius
     - ry (number) vertical radius
     = (object) the `ellipse` element
     **
     > Usage
     | var c = paper.ellipse(50, 50, 40, 20);
    \*/
    proto.ellipse = function (cx, cy, rx, ry) {
        var attr;
        if (is(cx, "object") && cx == "[object Object]") {
            attr = cx;
        } else if (cx != null) {
            attr ={
                cx: cx,
                cy: cy,
                rx: rx,
                ry: ry
            };
        }
        return this.el("ellipse", attr);
    };
    // SIERRA Paper.path(): Unclear from the link what a Catmull-Rom curveto is, and why it would make life any easier.
    /*\
     * Paper.path
     [ method ]
     **
     * Creates a `<path>` element using the given string as the path's definition
     - pathString (string) #optional path string in SVG format
     * Path string consists of one-letter commands, followed by comma seprarated arguments in numerical form. Example:
     | "M10,20L30,40"
     * This example features two commands: `M`, with arguments `(10, 20)` and `L` with arguments `(30, 40)`. Uppercase letter commands express coordinates in absolute terms, while lowercase commands express them in relative terms from the most recently declared coordinates.
     *
     # <p>Here is short list of commands available, for more details see <a href="http://www.w3.org/TR/SVG/paths.html#PathData" title="Details of a path's data attribute's format are described in the SVG specification.">SVG path string format</a> or <a href="https://developer.mozilla.org/en/SVG/Tutorial/Paths">article about path strings at MDN</a>.</p>
     # <table><thead><tr><th>Command</th><th>Name</th><th>Parameters</th></tr></thead><tbody>
     # <tr><td>M</td><td>moveto</td><td>(x y)+</td></tr>
     # <tr><td>Z</td><td>closepath</td><td>(none)</td></tr>
     # <tr><td>L</td><td>lineto</td><td>(x y)+</td></tr>
     # <tr><td>H</td><td>horizontal lineto</td><td>x+</td></tr>
     # <tr><td>V</td><td>vertical lineto</td><td>y+</td></tr>
     # <tr><td>C</td><td>curveto</td><td>(x1 y1 x2 y2 x y)+</td></tr>
     # <tr><td>S</td><td>smooth curveto</td><td>(x2 y2 x y)+</td></tr>
     # <tr><td>Q</td><td>quadratic Bézier curveto</td><td>(x1 y1 x y)+</td></tr>
     # <tr><td>T</td><td>smooth quadratic Bézier curveto</td><td>(x y)+</td></tr>
     # <tr><td>A</td><td>elliptical arc</td><td>(rx ry x-axis-rotation large-arc-flag sweep-flag x y)+</td></tr>
     # <tr><td>R</td><td><a href="http://en.wikipedia.org/wiki/Catmull–Rom_spline#Catmull.E2.80.93Rom_spline">Catmull-Rom curveto</a>*</td><td>x1 y1 (x y)+</td></tr></tbody></table>
     * * _Catmull-Rom curveto_ is a not standard SVG command and added to make life easier.
     * Note: there is a special case when a path consists of only three commands: `M10,10R…z`. In this case the path connects back to its starting point.
     > Usage
     | var c = paper.path("M10 10L90 90");
     | // draw a diagonal line:
     | // move to 10,10, line to 90,90
    \*/
    proto.path = function (d) {
        var attr;
        if (is(d, "object") && !is(d, "array")) {
            attr = d;
        } else if (d) {
            attr = {d: d};
        }
        return this.el("path", attr);
    };
    /*\
     * Paper.g
     [ method ]
     **
     * Creates a group element
     **
     - varargs (…) #optional elements to nest within the group
     = (object) the `g` element
     **
     > Usage
     | var c1 = paper.circle(),
     |     c2 = paper.rect(),
     |     g = paper.g(c2, c1); // note that the order of elements is different
     * or
     | var c1 = paper.circle(),
     |     c2 = paper.rect(),
     |     g = paper.g();
     | g.add(c2, c1);
    \*/
    /*\
     * Paper.group
     [ method ]
     **
     * See @Paper.g
    \*/
    proto.group = proto.g = function (first) {
        var attr,
            el = this.el("g");
        if (arguments.length == 1 && first && !first.type) {
            el.attr(first);
        } else if (arguments.length) {
            el.add(Array.prototype.slice.call(arguments, 0));
        }
        return el;
    };
    /*\
     * Paper.svg
     [ method ]
     **
     * Creates a nested SVG element.
     - x (number) @optional X of the element
     - y (number) @optional Y of the element
     - width (number) @optional width of the element
     - height (number) @optional height of the element
     - vbx (number) @optional viewbox X
     - vby (number) @optional viewbox Y
     - vbw (number) @optional viewbox width
     - vbh (number) @optional viewbox height
     **
     = (object) the `svg` element
     **
    \*/
    proto.svg = function (x, y, width, height, vbx, vby, vbw, vbh) {
        var attrs = {};
        if (is(x, "object") && y == null) {
            attrs = x;
        } else {
            if (x != null) {
                attrs.x = x;
            }
            if (y != null) {
                attrs.y = y;
            }
            if (width != null) {
                attrs.width = width;
            }
            if (height != null) {
                attrs.height = height;
            }
            if (vbx != null && vby != null && vbw != null && vbh != null) {
                attrs.viewBox = [vbx, vby, vbw, vbh];
            }
        }
        return this.el("svg", attrs);
    };
    /*\
     * Paper.mask
     [ method ]
     **
     * Equivalent in behaviour to @Paper.g, except it’s a mask.
     **
     = (object) the `mask` element
     **
    \*/
    proto.mask = function (first) {
        var attr,
            el = this.el("mask");
        if (arguments.length == 1 && first && !first.type) {
            el.attr(first);
        } else if (arguments.length) {
            el.add(Array.prototype.slice.call(arguments, 0));
        }
        return el;
    };
    /*\
     * Paper.ptrn
     [ method ]
     **
     * Equivalent in behaviour to @Paper.g, except it’s a pattern.
     - x (number) @optional X of the element
     - y (number) @optional Y of the element
     - width (number) @optional width of the element
     - height (number) @optional height of the element
     - vbx (number) @optional viewbox X
     - vby (number) @optional viewbox Y
     - vbw (number) @optional viewbox width
     - vbh (number) @optional viewbox height
     **
     = (object) the `pattern` element
     **
    \*/
    proto.ptrn = function (x, y, width, height, vx, vy, vw, vh) {
        if (is(x, "object")) {
            var attr = x;
        } else {
            attr = {patternUnits: "userSpaceOnUse"};
            if (x) {
                attr.x = x;
            }
            if (y) {
                attr.y = y;
            }
            if (width != null) {
                attr.width = width;
            }
            if (height != null) {
                attr.height = height;
            }
            if (vx != null && vy != null && vw != null && vh != null) {
                attr.viewBox = [vx, vy, vw, vh];
            } else {
                attr.viewBox = [x || 0, y || 0, width || 0, height || 0];
            }
        }
        return this.el("pattern", attr);
    };
    /*\
     * Paper.use
     [ method ]
     **
     * Creates a <use> element.
     - id (string) @optional id of element to link
     * or
     - id (Element) @optional element to link
     **
     = (object) the `use` element
     **
    \*/
    proto.use = function (id) {
        if (id != null) {
            if (id instanceof Element) {
                if (!id.attr("id")) {
                    id.attr({id: Snap._.id(id)});
                }
                id = id.attr("id");
            }
            if (String(id).charAt() == "#") {
                id = id.substring(1);
            }
            return this.el("use", {"xlink:href": "#" + id});
        } else {
            return Element.prototype.use.call(this);
        }
    };
    /*\
     * Paper.symbol
     [ method ]
     **
     * Creates a <symbol> element.
     - vbx (number) @optional viewbox X
     - vby (number) @optional viewbox Y
     - vbw (number) @optional viewbox width
     - vbh (number) @optional viewbox height
     = (object) the `symbol` element
     **
    \*/
    proto.symbol = function (vx, vy, vw, vh) {
        var attr = {};
        if (vx != null && vy != null && vw != null && vh != null) {
            attr.viewBox = [vx, vy, vw, vh];
        }

        return this.el("symbol", attr);
    };
    /*\
     * Paper.text
     [ method ]
     **
     * Draws a text string
     **
     - x (number) x coordinate position
     - y (number) y coordinate position
     - text (string|array) The text string to draw or array of strings to nest within separate `<tspan>` elements
     = (object) the `text` element
     **
     > Usage
     | var t1 = paper.text(50, 50, "Snap");
     | var t2 = paper.text(50, 50, ["S","n","a","p"]);
     | // Text path usage
     | t1.attr({textpath: "M10,10L100,100"});
     | // or
     | var pth = paper.path("M10,10L100,100");
     | t1.attr({textpath: pth});
    \*/
    proto.text = function (x, y, text) {
        var attr = {};
        if (is(x, "object")) {
            attr = x;
        } else if (x != null) {
            attr = {
                x: x,
                y: y,
                text: text || ""
            };
        }
        return this.el("text", attr);
    };
    /*\
     * Paper.line
     [ method ]
     **
     * Draws a line
     **
     - x1 (number) x coordinate position of the start
     - y1 (number) y coordinate position of the start
     - x2 (number) x coordinate position of the end
     - y2 (number) y coordinate position of the end
     = (object) the `line` element
     **
     > Usage
     | var t1 = paper.line(50, 50, 100, 100);
    \*/
    proto.line = function (x1, y1, x2, y2) {
        var attr = {};
        if (is(x1, "object")) {
            attr = x1;
        } else if (x1 != null) {
            attr = {
                x1: x1,
                x2: x2,
                y1: y1,
                y2: y2
            };
        }
        return this.el("line", attr);
    };
    /*\
     * Paper.polyline
     [ method ]
     **
     * Draws a polyline
     **
     - points (array) array of points
     * or
     - varargs (…) points
     = (object) the `polyline` element
     **
     > Usage
     | var p1 = paper.polyline([10, 10, 100, 100]);
     | var p2 = paper.polyline(10, 10, 100, 100);
    \*/
    proto.polyline = function (points) {
        if (arguments.length > 1) {
            points = Array.prototype.slice.call(arguments, 0);
        }
        var attr = {};
        if (is(points, "object") && !is(points, "array")) {
            attr = points;
        } else if (points != null) {
            attr = {points: points};
        }
        return this.el("polyline", attr);
    };
    /*\
     * Paper.polygon
     [ method ]
     **
     * Draws a polygon. See @Paper.polyline
    \*/
    proto.polygon = function (points) {
        if (arguments.length > 1) {
            points = Array.prototype.slice.call(arguments, 0);
        }
        var attr = {};
        if (is(points, "object") && !is(points, "array")) {
            attr = points;
        } else if (points != null) {
            attr = {points: points};
        }
        return this.el("polygon", attr);
    };
    // gradients
    (function () {
        var $ = Snap._.$;
        // gradients' helpers
        function Gstops() {
            return this.selectAll("stop");
        }
        function GaddStop(color, offset) {
            var stop = $("stop"),
                attr = {
                    offset: +offset + "%"
                };
            color = Snap.color(color);
            attr["stop-color"] = color.hex;
            if (color.opacity < 1) {
                attr["stop-opacity"] = color.opacity;
            }
            $(stop, attr);
            this.node.appendChild(stop);
            return this;
        }
        function GgetBBox() {
            if (this.type == "linearGradient") {
                var x1 = $(this.node, "x1") || 0,
                    x2 = $(this.node, "x2") || 1,
                    y1 = $(this.node, "y1") || 0,
                    y2 = $(this.node, "y2") || 0;
                return Snap._.box(x1, y1, math.abs(x2 - x1), math.abs(y2 - y1));
            } else {
                var cx = this.node.cx || .5,
                    cy = this.node.cy || .5,
                    r = this.node.r || 0;
                return Snap._.box(cx - r, cy - r, r * 2, r * 2);
            }
        }
        function gradient(defs, str) {
            var grad = eve("snap.util.grad.parse", null, str).firstDefined(),
                el;
            if (!grad) {
                return null;
            }
            grad.params.unshift(defs);
            if (grad.type.toLowerCase() == "l") {
                el = gradientLinear.apply(0, grad.params);
            } else {
                el = gradientRadial.apply(0, grad.params);
            }
            if (grad.type != grad.type.toLowerCase()) {
                $(el.node, {
                    gradientUnits: "userSpaceOnUse"
                });
            }
            var stops = grad.stops,
                len = stops.length,
                start = 0,
                j = 0;
            function seed(i, end) {
                var step = (end - start) / (i - j);
                for (var k = j; k < i; k++) {
                    stops[k].offset = +(+start + step * (k - j)).toFixed(2);
                }
                j = i;
                start = end;
            }
            len--;
            for (var i = 0; i < len; i++) if ("offset" in stops[i]) {
                seed(i, stops[i].offset);
            }
            stops[len].offset = stops[len].offset || 100;
            seed(len, stops[len].offset);
            for (i = 0; i <= len; i++) {
                var stop = stops[i];
                el.addStop(stop.color, stop.offset);
            }
            return el;
        }
        function gradientLinear(defs, x1, y1, x2, y2) {
            var el = Snap._.make("linearGradient", defs);
            el.stops = Gstops;
            el.addStop = GaddStop;
            el.getBBox = GgetBBox;
            if (x1 != null) {
                $(el.node, {
                    x1: x1,
                    y1: y1,
                    x2: x2,
                    y2: y2
                });
            }
            return el;
        }
        function gradientRadial(defs, cx, cy, r, fx, fy) {
            var el = Snap._.make("radialGradient", defs);
            el.stops = Gstops;
            el.addStop = GaddStop;
            el.getBBox = GgetBBox;
            if (cx != null) {
                $(el.node, {
                    cx: cx,
                    cy: cy,
                    r: r
                });
            }
            if (fx != null && fy != null) {
                $(el.node, {
                    fx: fx,
                    fy: fy
                });
            }
            return el;
        }
        /*\
         * Paper.gradient
         [ method ]
         **
         * Creates a gradient element
         **
         - gradient (string) gradient descriptor
         > Gradient Descriptor
         * The gradient descriptor is an expression formatted as
         * follows: `<type>(<coords>)<colors>`.  The `<type>` can be
         * either linear or radial.  The uppercase `L` or `R` letters
         * indicate absolute coordinates offset from the SVG surface.
         * Lowercase `l` or `r` letters indicate coordinates
         * calculated relative to the element to which the gradient is
         * applied.  Coordinates specify a linear gradient vector as
         * `x1`, `y1`, `x2`, `y2`, or a radial gradient as `cx`, `cy`,
         * `r` and optional `fx`, `fy` specifying a focal point away
         * from the center of the circle. Specify `<colors>` as a list
         * of dash-separated CSS color values.  Each color may be
         * followed by a custom offset value, separated with a colon
         * character.
         > Examples
         * Linear gradient, relative from top-left corner to bottom-right
         * corner, from black through red to white:
         | var g = paper.gradient("l(0, 0, 1, 1)#000-#f00-#fff");
         * Linear gradient, absolute from (0, 0) to (100, 100), from black
         * through red at 25% to white:
         | var g = paper.gradient("L(0, 0, 100, 100)#000-#f00:25-#fff");
         * Radial gradient, relative from the center of the element with radius
         * half the width, from black to white:
         | var g = paper.gradient("r(0.5, 0.5, 0.5)#000-#fff");
         * To apply the gradient:
         | paper.circle(50, 50, 40).attr({
         |     fill: g
         | });
         = (object) the `gradient` element
        \*/
        proto.gradient = function (str) {
            return gradient(this.defs, str);
        };
        proto.gradientLinear = function (x1, y1, x2, y2) {
            return gradientLinear(this.defs, x1, y1, x2, y2);
        };
        proto.gradientRadial = function (cx, cy, r, fx, fy) {
            return gradientRadial(this.defs, cx, cy, r, fx, fy);
        };
        /*\
         * Paper.toString
         [ method ]
         **
         * Returns SVG code for the @Paper
         = (string) SVG code for the @Paper
        \*/
        proto.toString = function () {
            var doc = this.node.ownerDocument,
                f = doc.createDocumentFragment(),
                d = doc.createElement("div"),
                svg = this.node.cloneNode(true),
                res;
            f.appendChild(d);
            d.appendChild(svg);
            Snap._.$(svg, {xmlns: "http://www.w3.org/2000/svg"});
            res = d.innerHTML;
            f.removeChild(f.firstChild);
            return res;
        };
        /*\
         * Paper.toDataURL
         [ method ]
         **
         * Returns SVG code for the @Paper as Data URI string.
         = (string) Data URI string
        \*/
        proto.toDataURL = function () {
            if (window && window.btoa) {
                return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(this)));
            }
        };
        /*\
         * Paper.clear
         [ method ]
         **
         * Removes all child nodes of the paper, except <defs>.
        \*/
        proto.clear = function () {
            var node = this.node.firstChild,
                next;
            while (node) {
                next = node.nextSibling;
                if (node.tagName != "defs") {
                    node.parentNode.removeChild(node);
                } else {
                    proto.clear.call({node: node});
                }
                node = next;
            }
        };
    }());
});

// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Snap.plugin(function (Snap, Element, Paper, glob) {
    var elproto = Element.prototype,
        is = Snap.is,
        clone = Snap._.clone,
        has = "hasOwnProperty",
        p2s = /,?([a-z]),?/gi,
        toFloat = parseFloat,
        math = Math,
        PI = math.PI,
        mmin = math.min,
        mmax = math.max,
        pow = math.pow,
        abs = math.abs;
    function paths(ps) {
        var p = paths.ps = paths.ps || {};
        if (p[ps]) {
            p[ps].sleep = 100;
        } else {
            p[ps] = {
                sleep: 100
            };
        }
        setTimeout(function () {
            for (var key in p) if (p[has](key) && key != ps) {
                p[key].sleep--;
                !p[key].sleep && delete p[key];
            }
        });
        return p[ps];
    }
    function box(x, y, width, height) {
        if (x == null) {
            x = y = width = height = 0;
        }
        if (y == null) {
            y = x.y;
            width = x.width;
            height = x.height;
            x = x.x;
        }
        return {
            x: x,
            y: y,
            width: width,
            w: width,
            height: height,
            h: height,
            x2: x + width,
            y2: y + height,
            cx: x + width / 2,
            cy: y + height / 2,
            r1: math.min(width, height) / 2,
            r2: math.max(width, height) / 2,
            r0: math.sqrt(width * width + height * height) / 2,
            path: rectPath(x, y, width, height),
            vb: [x, y, width, height].join(" ")
        };
    }
    function toString() {
        return this.join(",").replace(p2s, "$1");
    }
    function pathClone(pathArray) {
        var res = clone(pathArray);
        res.toString = toString;
        return res;
    }
    function getPointAtSegmentLength(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, length) {
        if (length == null) {
            return bezlen(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y);
        } else {
            return findDotsAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y,
                getTotLen(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, length));
        }
    }
    function getLengthFactory(istotal, subpath) {
        function O(val) {
            return +(+val).toFixed(3);
        }
        return Snap._.cacher(function (path, length, onlystart) {
            if (path instanceof Element) {
                path = path.attr("d");
            }
            path = path2curve(path);
            var x, y, p, l, sp = "", subpaths = {}, point,
                len = 0;
            for (var i = 0, ii = path.length; i < ii; i++) {
                p = path[i];
                if (p[0] == "M") {
                    x = +p[1];
                    y = +p[2];
                } else {
                    l = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4], p[5], p[6]);
                    if (len + l > length) {
                        if (subpath && !subpaths.start) {
                            point = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4], p[5], p[6], length - len);
                            sp += [
                                "C" + O(point.start.x),
                                O(point.start.y),
                                O(point.m.x),
                                O(point.m.y),
                                O(point.x),
                                O(point.y)
                            ];
                            if (onlystart) {return sp;}
                            subpaths.start = sp;
                            sp = [
                                "M" + O(point.x),
                                O(point.y) + "C" + O(point.n.x),
                                O(point.n.y),
                                O(point.end.x),
                                O(point.end.y),
                                O(p[5]),
                                O(p[6])
                            ].join();
                            len += l;
                            x = +p[5];
                            y = +p[6];
                            continue;
                        }
                        if (!istotal && !subpath) {
                            point = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4], p[5], p[6], length - len);
                            return point;
                        }
                    }
                    len += l;
                    x = +p[5];
                    y = +p[6];
                }
                sp += p.shift() + p;
            }
            subpaths.end = sp;
            point = istotal ? len : subpath ? subpaths : findDotsAtSegment(x, y, p[0], p[1], p[2], p[3], p[4], p[5], 1);
            return point;
        }, null, Snap._.clone);
    }
    var getTotalLength = getLengthFactory(1),
        getPointAtLength = getLengthFactory(),
        getSubpathsAtLength = getLengthFactory(0, 1);
    function findDotsAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t) {
        var t1 = 1 - t,
            t13 = pow(t1, 3),
            t12 = pow(t1, 2),
            t2 = t * t,
            t3 = t2 * t,
            x = t13 * p1x + t12 * 3 * t * c1x + t1 * 3 * t * t * c2x + t3 * p2x,
            y = t13 * p1y + t12 * 3 * t * c1y + t1 * 3 * t * t * c2y + t3 * p2y,
            mx = p1x + 2 * t * (c1x - p1x) + t2 * (c2x - 2 * c1x + p1x),
            my = p1y + 2 * t * (c1y - p1y) + t2 * (c2y - 2 * c1y + p1y),
            nx = c1x + 2 * t * (c2x - c1x) + t2 * (p2x - 2 * c2x + c1x),
            ny = c1y + 2 * t * (c2y - c1y) + t2 * (p2y - 2 * c2y + c1y),
            ax = t1 * p1x + t * c1x,
            ay = t1 * p1y + t * c1y,
            cx = t1 * c2x + t * p2x,
            cy = t1 * c2y + t * p2y,
            alpha = (90 - math.atan2(mx - nx, my - ny) * 180 / PI);
        // (mx > nx || my < ny) && (alpha += 180);
        return {
            x: x,
            y: y,
            m: {x: mx, y: my},
            n: {x: nx, y: ny},
            start: {x: ax, y: ay},
            end: {x: cx, y: cy},
            alpha: alpha
        };
    }
    function bezierBBox(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y) {
        if (!Snap.is(p1x, "array")) {
            p1x = [p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y];
        }
        var bbox = curveDim.apply(null, p1x);
        return box(
            bbox.min.x,
            bbox.min.y,
            bbox.max.x - bbox.min.x,
            bbox.max.y - bbox.min.y
        );
    }
    function isPointInsideBBox(bbox, x, y) {
        return  x >= bbox.x &&
                x <= bbox.x + bbox.width &&
                y >= bbox.y &&
                y <= bbox.y + bbox.height;
    }
    function isBBoxIntersect(bbox1, bbox2) {
        bbox1 = box(bbox1);
        bbox2 = box(bbox2);
        return isPointInsideBBox(bbox2, bbox1.x, bbox1.y)
            || isPointInsideBBox(bbox2, bbox1.x2, bbox1.y)
            || isPointInsideBBox(bbox2, bbox1.x, bbox1.y2)
            || isPointInsideBBox(bbox2, bbox1.x2, bbox1.y2)
            || isPointInsideBBox(bbox1, bbox2.x, bbox2.y)
            || isPointInsideBBox(bbox1, bbox2.x2, bbox2.y)
            || isPointInsideBBox(bbox1, bbox2.x, bbox2.y2)
            || isPointInsideBBox(bbox1, bbox2.x2, bbox2.y2)
            || (bbox1.x < bbox2.x2 && bbox1.x > bbox2.x
                || bbox2.x < bbox1.x2 && bbox2.x > bbox1.x)
            && (bbox1.y < bbox2.y2 && bbox1.y > bbox2.y
                || bbox2.y < bbox1.y2 && bbox2.y > bbox1.y);
    }
    function base3(t, p1, p2, p3, p4) {
        var t1 = -3 * p1 + 9 * p2 - 9 * p3 + 3 * p4,
            t2 = t * t1 + 6 * p1 - 12 * p2 + 6 * p3;
        return t * t2 - 3 * p1 + 3 * p2;
    }
    function bezlen(x1, y1, x2, y2, x3, y3, x4, y4, z) {
        if (z == null) {
            z = 1;
        }
        z = z > 1 ? 1 : z < 0 ? 0 : z;
        var z2 = z / 2,
            n = 12,
            Tvalues = [-.1252,.1252,-.3678,.3678,-.5873,.5873,-.7699,.7699,-.9041,.9041,-.9816,.9816],
            Cvalues = [0.2491,0.2491,0.2335,0.2335,0.2032,0.2032,0.1601,0.1601,0.1069,0.1069,0.0472,0.0472],
            sum = 0;
        for (var i = 0; i < n; i++) {
            var ct = z2 * Tvalues[i] + z2,
                xbase = base3(ct, x1, x2, x3, x4),
                ybase = base3(ct, y1, y2, y3, y4),
                comb = xbase * xbase + ybase * ybase;
            sum += Cvalues[i] * math.sqrt(comb);
        }
        return z2 * sum;
    }
    function getTotLen(x1, y1, x2, y2, x3, y3, x4, y4, ll) {
        if (ll < 0 || bezlen(x1, y1, x2, y2, x3, y3, x4, y4) < ll) {
            return;
        }
        var t = 1,
            step = t / 2,
            t2 = t - step,
            l,
            e = .01;
        l = bezlen(x1, y1, x2, y2, x3, y3, x4, y4, t2);
        while (abs(l - ll) > e) {
            step /= 2;
            t2 += (l < ll ? 1 : -1) * step;
            l = bezlen(x1, y1, x2, y2, x3, y3, x4, y4, t2);
        }
        return t2;
    }
    function intersect(x1, y1, x2, y2, x3, y3, x4, y4) {
        if (
            mmax(x1, x2) < mmin(x3, x4) ||
            mmin(x1, x2) > mmax(x3, x4) ||
            mmax(y1, y2) < mmin(y3, y4) ||
            mmin(y1, y2) > mmax(y3, y4)
        ) {
            return;
        }
        var nx = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4),
            ny = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4),
            denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

        if (!denominator) {
            return;
        }
        var px = nx / denominator,
            py = ny / denominator,
            px2 = +px.toFixed(2),
            py2 = +py.toFixed(2);
        if (
            px2 < +mmin(x1, x2).toFixed(2) ||
            px2 > +mmax(x1, x2).toFixed(2) ||
            px2 < +mmin(x3, x4).toFixed(2) ||
            px2 > +mmax(x3, x4).toFixed(2) ||
            py2 < +mmin(y1, y2).toFixed(2) ||
            py2 > +mmax(y1, y2).toFixed(2) ||
            py2 < +mmin(y3, y4).toFixed(2) ||
            py2 > +mmax(y3, y4).toFixed(2)
        ) {
            return;
        }
        return {x: px, y: py};
    }
    function inter(bez1, bez2) {
        return interHelper(bez1, bez2);
    }
    function interCount(bez1, bez2) {
        return interHelper(bez1, bez2, 1);
    }
    function interHelper(bez1, bez2, justCount) {
        var bbox1 = bezierBBox(bez1),
            bbox2 = bezierBBox(bez2);
        if (!isBBoxIntersect(bbox1, bbox2)) {
            return justCount ? 0 : [];
        }
        var l1 = bezlen.apply(0, bez1),
            l2 = bezlen.apply(0, bez2),
            n1 = ~~(l1 / 8),
            n2 = ~~(l2 / 8),
            dots1 = [],
            dots2 = [],
            xy = {},
            res = justCount ? 0 : [];
        for (var i = 0; i < n1 + 1; i++) {
            var p = findDotsAtSegment.apply(0, bez1.concat(i / n1));
            dots1.push({x: p.x, y: p.y, t: i / n1});
        }
        for (i = 0; i < n2 + 1; i++) {
            p = findDotsAtSegment.apply(0, bez2.concat(i / n2));
            dots2.push({x: p.x, y: p.y, t: i / n2});
        }
        for (i = 0; i < n1; i++) {
            for (var j = 0; j < n2; j++) {
                var di = dots1[i],
                    di1 = dots1[i + 1],
                    dj = dots2[j],
                    dj1 = dots2[j + 1],
                    ci = abs(di1.x - di.x) < .001 ? "y" : "x",
                    cj = abs(dj1.x - dj.x) < .001 ? "y" : "x",
                    is = intersect(di.x, di.y, di1.x, di1.y, dj.x, dj.y, dj1.x, dj1.y);
                if (is) {
                    if (xy[is.x.toFixed(4)] == is.y.toFixed(4)) {
                        continue;
                    }
                    xy[is.x.toFixed(4)] = is.y.toFixed(4);
                    var t1 = di.t + abs((is[ci] - di[ci]) / (di1[ci] - di[ci])) * (di1.t - di.t),
                        t2 = dj.t + abs((is[cj] - dj[cj]) / (dj1[cj] - dj[cj])) * (dj1.t - dj.t);
                    if (t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1) {
                        if (justCount) {
                            res++;
                        } else {
                            res.push({
                                x: is.x,
                                y: is.y,
                                t1: t1,
                                t2: t2
                            });
                        }
                    }
                }
            }
        }
        return res;
    }
    function pathIntersection(path1, path2) {
        return interPathHelper(path1, path2);
    }
    function pathIntersectionNumber(path1, path2) {
        return interPathHelper(path1, path2, 1);
    }
    function interPathHelper(path1, path2, justCount) {
        path1 = path2curve(path1);
        path2 = path2curve(path2);
        var x1, y1, x2, y2, x1m, y1m, x2m, y2m, bez1, bez2,
            res = justCount ? 0 : [];
        for (var i = 0, ii = path1.length; i < ii; i++) {
            var pi = path1[i];
            if (pi[0] == "M") {
                x1 = x1m = pi[1];
                y1 = y1m = pi[2];
            } else {
                if (pi[0] == "C") {
                    bez1 = [x1, y1].concat(pi.slice(1));
                    x1 = bez1[6];
                    y1 = bez1[7];
                } else {
                    bez1 = [x1, y1, x1, y1, x1m, y1m, x1m, y1m];
                    x1 = x1m;
                    y1 = y1m;
                }
                for (var j = 0, jj = path2.length; j < jj; j++) {
                    var pj = path2[j];
                    if (pj[0] == "M") {
                        x2 = x2m = pj[1];
                        y2 = y2m = pj[2];
                    } else {
                        if (pj[0] == "C") {
                            bez2 = [x2, y2].concat(pj.slice(1));
                            x2 = bez2[6];
                            y2 = bez2[7];
                        } else {
                            bez2 = [x2, y2, x2, y2, x2m, y2m, x2m, y2m];
                            x2 = x2m;
                            y2 = y2m;
                        }
                        var intr = interHelper(bez1, bez2, justCount);
                        if (justCount) {
                            res += intr;
                        } else {
                            for (var k = 0, kk = intr.length; k < kk; k++) {
                                intr[k].segment1 = i;
                                intr[k].segment2 = j;
                                intr[k].bez1 = bez1;
                                intr[k].bez2 = bez2;
                            }
                            res = res.concat(intr);
                        }
                    }
                }
            }
        }
        return res;
    }
    function isPointInsidePath(path, x, y) {
        var bbox = pathBBox(path);
        return isPointInsideBBox(bbox, x, y) &&
               interPathHelper(path, [["M", x, y], ["H", bbox.x2 + 10]], 1) % 2 == 1;
    }
    function pathBBox(path) {
        var pth = paths(path);
        if (pth.bbox) {
            return clone(pth.bbox);
        }
        if (!path) {
            return box();
        }
        path = path2curve(path);
        var x = 0, 
            y = 0,
            X = [],
            Y = [],
            p;
        for (var i = 0, ii = path.length; i < ii; i++) {
            p = path[i];
            if (p[0] == "M") {
                x = p[1];
                y = p[2];
                X.push(x);
                Y.push(y);
            } else {
                var dim = curveDim(x, y, p[1], p[2], p[3], p[4], p[5], p[6]);
                X = X.concat(dim.min.x, dim.max.x);
                Y = Y.concat(dim.min.y, dim.max.y);
                x = p[5];
                y = p[6];
            }
        }
        var xmin = mmin.apply(0, X),
            ymin = mmin.apply(0, Y),
            xmax = mmax.apply(0, X),
            ymax = mmax.apply(0, Y),
            bb = box(xmin, ymin, xmax - xmin, ymax - ymin);
        pth.bbox = clone(bb);
        return bb;
    }
    function rectPath(x, y, w, h, r) {
        if (r) {
            return [
                ["M", +x + (+r), y],
                ["l", w - r * 2, 0],
                ["a", r, r, 0, 0, 1, r, r],
                ["l", 0, h - r * 2],
                ["a", r, r, 0, 0, 1, -r, r],
                ["l", r * 2 - w, 0],
                ["a", r, r, 0, 0, 1, -r, -r],
                ["l", 0, r * 2 - h],
                ["a", r, r, 0, 0, 1, r, -r],
                ["z"]
            ];
        }
        var res = [["M", x, y], ["l", w, 0], ["l", 0, h], ["l", -w, 0], ["z"]];
        res.toString = toString;
        return res;
    }
    function ellipsePath(x, y, rx, ry, a) {
        if (a == null && ry == null) {
            ry = rx;
        }
        x = +x;
        y = +y;
        rx = +rx;
        ry = +ry;
        if (a != null) {
            var rad = Math.PI / 180,
                x1 = x + rx * Math.cos(-ry * rad),
                x2 = x + rx * Math.cos(-a * rad),
                y1 = y + rx * Math.sin(-ry * rad),
                y2 = y + rx * Math.sin(-a * rad),
                res = [["M", x1, y1], ["A", rx, rx, 0, +(a - ry > 180), 0, x2, y2]];
        } else {
            res = [
                ["M", x, y],
                ["m", 0, -ry],
                ["a", rx, ry, 0, 1, 1, 0, 2 * ry],
                ["a", rx, ry, 0, 1, 1, 0, -2 * ry],
                ["z"]
            ];
        }
        res.toString = toString;
        return res;
    }
    var unit2px = Snap._unit2px,
        getPath = {
        path: function (el) {
            return el.attr("path");
        },
        circle: function (el) {
            var attr = unit2px(el);
            return ellipsePath(attr.cx, attr.cy, attr.r);
        },
        ellipse: function (el) {
            var attr = unit2px(el);
            return ellipsePath(attr.cx || 0, attr.cy || 0, attr.rx, attr.ry);
        },
        rect: function (el) {
            var attr = unit2px(el);
            return rectPath(attr.x || 0, attr.y || 0, attr.width, attr.height, attr.rx, attr.ry);
        },
        image: function (el) {
            var attr = unit2px(el);
            return rectPath(attr.x || 0, attr.y || 0, attr.width, attr.height);
        },
        line: function (el) {
            return "M" + [el.attr("x1") || 0, el.attr("y1") || 0, el.attr("x2"), el.attr("y2")];
        },
        polyline: function (el) {
            return "M" + el.attr("points");
        },
        polygon: function (el) {
            return "M" + el.attr("points") + "z";
        },
        deflt: function (el) {
            var bbox = el.node.getBBox();
            return rectPath(bbox.x, bbox.y, bbox.width, bbox.height);
        }
    };
    function pathToRelative(pathArray) {
        var pth = paths(pathArray),
            lowerCase = String.prototype.toLowerCase;
        if (pth.rel) {
            return pathClone(pth.rel);
        }
        if (!Snap.is(pathArray, "array") || !Snap.is(pathArray && pathArray[0], "array")) {
            pathArray = Snap.parsePathString(pathArray);
        }
        var res = [],
            x = 0,
            y = 0,
            mx = 0,
            my = 0,
            start = 0;
        if (pathArray[0][0] == "M") {
            x = pathArray[0][1];
            y = pathArray[0][2];
            mx = x;
            my = y;
            start++;
            res.push(["M", x, y]);
        }
        for (var i = start, ii = pathArray.length; i < ii; i++) {
            var r = res[i] = [],
                pa = pathArray[i];
            if (pa[0] != lowerCase.call(pa[0])) {
                r[0] = lowerCase.call(pa[0]);
                switch (r[0]) {
                    case "a":
                        r[1] = pa[1];
                        r[2] = pa[2];
                        r[3] = pa[3];
                        r[4] = pa[4];
                        r[5] = pa[5];
                        r[6] = +(pa[6] - x).toFixed(3);
                        r[7] = +(pa[7] - y).toFixed(3);
                        break;
                    case "v":
                        r[1] = +(pa[1] - y).toFixed(3);
                        break;
                    case "m":
                        mx = pa[1];
                        my = pa[2];
                    default:
                        for (var j = 1, jj = pa.length; j < jj; j++) {
                            r[j] = +(pa[j] - ((j % 2) ? x : y)).toFixed(3);
                        }
                }
            } else {
                r = res[i] = [];
                if (pa[0] == "m") {
                    mx = pa[1] + x;
                    my = pa[2] + y;
                }
                for (var k = 0, kk = pa.length; k < kk; k++) {
                    res[i][k] = pa[k];
                }
            }
            var len = res[i].length;
            switch (res[i][0]) {
                case "z":
                    x = mx;
                    y = my;
                    break;
                case "h":
                    x += +res[i][len - 1];
                    break;
                case "v":
                    y += +res[i][len - 1];
                    break;
                default:
                    x += +res[i][len - 2];
                    y += +res[i][len - 1];
            }
        }
        res.toString = toString;
        pth.rel = pathClone(res);
        return res;
    }
    function pathToAbsolute(pathArray) {
        var pth = paths(pathArray);
        if (pth.abs) {
            return pathClone(pth.abs);
        }
        if (!is(pathArray, "array") || !is(pathArray && pathArray[0], "array")) { // rough assumption
            pathArray = Snap.parsePathString(pathArray);
        }
        if (!pathArray || !pathArray.length) {
            return [["M", 0, 0]];
        }
        var res = [],
            x = 0,
            y = 0,
            mx = 0,
            my = 0,
            start = 0,
            pa0;
        if (pathArray[0][0] == "M") {
            x = +pathArray[0][1];
            y = +pathArray[0][2];
            mx = x;
            my = y;
            start++;
            res[0] = ["M", x, y];
        }
        var crz = pathArray.length == 3 &&
            pathArray[0][0] == "M" &&
            pathArray[1][0].toUpperCase() == "R" &&
            pathArray[2][0].toUpperCase() == "Z";
        for (var r, pa, i = start, ii = pathArray.length; i < ii; i++) {
            res.push(r = []);
            pa = pathArray[i];
            pa0 = pa[0];
            if (pa0 != pa0.toUpperCase()) {
                r[0] = pa0.toUpperCase();
                switch (r[0]) {
                    case "A":
                        r[1] = pa[1];
                        r[2] = pa[2];
                        r[3] = pa[3];
                        r[4] = pa[4];
                        r[5] = pa[5];
                        r[6] = +pa[6] + x;
                        r[7] = +pa[7] + y;
                        break;
                    case "V":
                        r[1] = +pa[1] + y;
                        break;
                    case "H":
                        r[1] = +pa[1] + x;
                        break;
                    case "R":
                        var dots = [x, y].concat(pa.slice(1));
                        for (var j = 2, jj = dots.length; j < jj; j++) {
                            dots[j] = +dots[j] + x;
                            dots[++j] = +dots[j] + y;
                        }
                        res.pop();
                        res = res.concat(catmullRom2bezier(dots, crz));
                        break;
                    case "O":
                        res.pop();
                        dots = ellipsePath(x, y, pa[1], pa[2]);
                        dots.push(dots[0]);
                        res = res.concat(dots);
                        break;
                    case "U":
                        res.pop();
                        res = res.concat(ellipsePath(x, y, pa[1], pa[2], pa[3]));
                        r = ["U"].concat(res[res.length - 1].slice(-2));
                        break;
                    case "M":
                        mx = +pa[1] + x;
                        my = +pa[2] + y;
                    default:
                        for (j = 1, jj = pa.length; j < jj; j++) {
                            r[j] = +pa[j] + ((j % 2) ? x : y);
                        }
                }
            } else if (pa0 == "R") {
                dots = [x, y].concat(pa.slice(1));
                res.pop();
                res = res.concat(catmullRom2bezier(dots, crz));
                r = ["R"].concat(pa.slice(-2));
            } else if (pa0 == "O") {
                res.pop();
                dots = ellipsePath(x, y, pa[1], pa[2]);
                dots.push(dots[0]);
                res = res.concat(dots);
            } else if (pa0 == "U") {
                res.pop();
                res = res.concat(ellipsePath(x, y, pa[1], pa[2], pa[3]));
                r = ["U"].concat(res[res.length - 1].slice(-2));
            } else {
                for (var k = 0, kk = pa.length; k < kk; k++) {
                    r[k] = pa[k];
                }
            }
            pa0 = pa0.toUpperCase();
            if (pa0 != "O") {
                switch (r[0]) {
                    case "Z":
                        x = +mx;
                        y = +my;
                        break;
                    case "H":
                        x = r[1];
                        break;
                    case "V":
                        y = r[1];
                        break;
                    case "M":
                        mx = r[r.length - 2];
                        my = r[r.length - 1];
                    default:
                        x = r[r.length - 2];
                        y = r[r.length - 1];
                }
            }
        }
        res.toString = toString;
        pth.abs = pathClone(res);
        return res;
    }
    function l2c(x1, y1, x2, y2) {
        return [x1, y1, x2, y2, x2, y2];
    }
    function q2c(x1, y1, ax, ay, x2, y2) {
        var _13 = 1 / 3,
            _23 = 2 / 3;
        return [
                _13 * x1 + _23 * ax,
                _13 * y1 + _23 * ay,
                _13 * x2 + _23 * ax,
                _13 * y2 + _23 * ay,
                x2,
                y2
            ];
    }
    function a2c(x1, y1, rx, ry, angle, large_arc_flag, sweep_flag, x2, y2, recursive) {
        // for more information of where this math came from visit:
        // http://www.w3.org/TR/SVG11/implnote.html#ArcImplementationNotes
        var _120 = PI * 120 / 180,
            rad = PI / 180 * (+angle || 0),
            res = [],
            xy,
            rotate = Snap._.cacher(function (x, y, rad) {
                var X = x * math.cos(rad) - y * math.sin(rad),
                    Y = x * math.sin(rad) + y * math.cos(rad);
                return {x: X, y: Y};
            });
        if (!recursive) {
            xy = rotate(x1, y1, -rad);
            x1 = xy.x;
            y1 = xy.y;
            xy = rotate(x2, y2, -rad);
            x2 = xy.x;
            y2 = xy.y;
            var cos = math.cos(PI / 180 * angle),
                sin = math.sin(PI / 180 * angle),
                x = (x1 - x2) / 2,
                y = (y1 - y2) / 2;
            var h = (x * x) / (rx * rx) + (y * y) / (ry * ry);
            if (h > 1) {
                h = math.sqrt(h);
                rx = h * rx;
                ry = h * ry;
            }
            var rx2 = rx * rx,
                ry2 = ry * ry,
                k = (large_arc_flag == sweep_flag ? -1 : 1) *
                    math.sqrt(abs((rx2 * ry2 - rx2 * y * y - ry2 * x * x) / (rx2 * y * y + ry2 * x * x))),
                cx = k * rx * y / ry + (x1 + x2) / 2,
                cy = k * -ry * x / rx + (y1 + y2) / 2,
                f1 = math.asin(((y1 - cy) / ry).toFixed(9)),
                f2 = math.asin(((y2 - cy) / ry).toFixed(9));

            f1 = x1 < cx ? PI - f1 : f1;
            f2 = x2 < cx ? PI - f2 : f2;
            f1 < 0 && (f1 = PI * 2 + f1);
            f2 < 0 && (f2 = PI * 2 + f2);
            if (sweep_flag && f1 > f2) {
                f1 = f1 - PI * 2;
            }
            if (!sweep_flag && f2 > f1) {
                f2 = f2 - PI * 2;
            }
        } else {
            f1 = recursive[0];
            f2 = recursive[1];
            cx = recursive[2];
            cy = recursive[3];
        }
        var df = f2 - f1;
        if (abs(df) > _120) {
            var f2old = f2,
                x2old = x2,
                y2old = y2;
            f2 = f1 + _120 * (sweep_flag && f2 > f1 ? 1 : -1);
            x2 = cx + rx * math.cos(f2);
            y2 = cy + ry * math.sin(f2);
            res = a2c(x2, y2, rx, ry, angle, 0, sweep_flag, x2old, y2old, [f2, f2old, cx, cy]);
        }
        df = f2 - f1;
        var c1 = math.cos(f1),
            s1 = math.sin(f1),
            c2 = math.cos(f2),
            s2 = math.sin(f2),
            t = math.tan(df / 4),
            hx = 4 / 3 * rx * t,
            hy = 4 / 3 * ry * t,
            m1 = [x1, y1],
            m2 = [x1 + hx * s1, y1 - hy * c1],
            m3 = [x2 + hx * s2, y2 - hy * c2],
            m4 = [x2, y2];
        m2[0] = 2 * m1[0] - m2[0];
        m2[1] = 2 * m1[1] - m2[1];
        if (recursive) {
            return [m2, m3, m4].concat(res);
        } else {
            res = [m2, m3, m4].concat(res).join().split(",");
            var newres = [];
            for (var i = 0, ii = res.length; i < ii; i++) {
                newres[i] = i % 2 ? rotate(res[i - 1], res[i], rad).y : rotate(res[i], res[i + 1], rad).x;
            }
            return newres;
        }
    }
    function findDotAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t) {
        var t1 = 1 - t;
        return {
            x: pow(t1, 3) * p1x + pow(t1, 2) * 3 * t * c1x + t1 * 3 * t * t * c2x + pow(t, 3) * p2x,
            y: pow(t1, 3) * p1y + pow(t1, 2) * 3 * t * c1y + t1 * 3 * t * t * c2y + pow(t, 3) * p2y
        };
    }
    
    // Returns bounding box of cubic bezier curve.
    // Source: http://blog.hackers-cafe.net/2009/06/how-to-calculate-bezier-curves-bounding.html
    // Original version: NISHIO Hirokazu
    // Modifications: https://github.com/timo22345
    function curveDim(x0, y0, x1, y1, x2, y2, x3, y3) {
        var tvalues = [],
            bounds = [[], []],
            a, b, c, t, t1, t2, b2ac, sqrtb2ac;
        for (var i = 0; i < 2; ++i) {
            if (i == 0) {
                b = 6 * x0 - 12 * x1 + 6 * x2;
                a = -3 * x0 + 9 * x1 - 9 * x2 + 3 * x3;
                c = 3 * x1 - 3 * x0;
            } else {
                b = 6 * y0 - 12 * y1 + 6 * y2;
                a = -3 * y0 + 9 * y1 - 9 * y2 + 3 * y3;
                c = 3 * y1 - 3 * y0;
            }
            if (abs(a) < 1e-12) {
                if (abs(b) < 1e-12) {
                    continue;
                }
                t = -c / b;
                if (0 < t && t < 1) {
                    tvalues.push(t);
                }
                continue;
            }
            b2ac = b * b - 4 * c * a;
            sqrtb2ac = math.sqrt(b2ac);
            if (b2ac < 0) {
                continue;
            }
            t1 = (-b + sqrtb2ac) / (2 * a);
            if (0 < t1 && t1 < 1) {
                tvalues.push(t1);
            }
            t2 = (-b - sqrtb2ac) / (2 * a);
            if (0 < t2 && t2 < 1) {
                tvalues.push(t2);
            }
        }

        var x, y, j = tvalues.length,
            jlen = j,
            mt;
        while (j--) {
            t = tvalues[j];
            mt = 1 - t;
            bounds[0][j] = (mt * mt * mt * x0) + (3 * mt * mt * t * x1) + (3 * mt * t * t * x2) + (t * t * t * x3);
            bounds[1][j] = (mt * mt * mt * y0) + (3 * mt * mt * t * y1) + (3 * mt * t * t * y2) + (t * t * t * y3);
        }

        bounds[0][jlen] = x0;
        bounds[1][jlen] = y0;
        bounds[0][jlen + 1] = x3;
        bounds[1][jlen + 1] = y3;
        bounds[0].length = bounds[1].length = jlen + 2;


        return {
          min: {x: mmin.apply(0, bounds[0]), y: mmin.apply(0, bounds[1])},
          max: {x: mmax.apply(0, bounds[0]), y: mmax.apply(0, bounds[1])}
        };
    }

    function path2curve(path, path2) {
        var pth = !path2 && paths(path);
        if (!path2 && pth.curve) {
            return pathClone(pth.curve);
        }
        var p = pathToAbsolute(path),
            p2 = path2 && pathToAbsolute(path2),
            attrs = {x: 0, y: 0, bx: 0, by: 0, X: 0, Y: 0, qx: null, qy: null},
            attrs2 = {x: 0, y: 0, bx: 0, by: 0, X: 0, Y: 0, qx: null, qy: null},
            processPath = function (path, d, pcom) {
                var nx, ny;
                if (!path) {
                    return ["C", d.x, d.y, d.x, d.y, d.x, d.y];
                }
                !(path[0] in {T: 1, Q: 1}) && (d.qx = d.qy = null);
                switch (path[0]) {
                    case "M":
                        d.X = path[1];
                        d.Y = path[2];
                        break;
                    case "A":
                        path = ["C"].concat(a2c.apply(0, [d.x, d.y].concat(path.slice(1))));
                        break;
                    case "S":
                        if (pcom == "C" || pcom == "S") { // In "S" case we have to take into account, if the previous command is C/S.
                            nx = d.x * 2 - d.bx;          // And reflect the previous
                            ny = d.y * 2 - d.by;          // command's control point relative to the current point.
                        }
                        else {                            // or some else or nothing
                            nx = d.x;
                            ny = d.y;
                        }
                        path = ["C", nx, ny].concat(path.slice(1));
                        break;
                    case "T":
                        if (pcom == "Q" || pcom == "T") { // In "T" case we have to take into account, if the previous command is Q/T.
                            d.qx = d.x * 2 - d.qx;        // And make a reflection similar
                            d.qy = d.y * 2 - d.qy;        // to case "S".
                        }
                        else {                            // or something else or nothing
                            d.qx = d.x;
                            d.qy = d.y;
                        }
                        path = ["C"].concat(q2c(d.x, d.y, d.qx, d.qy, path[1], path[2]));
                        break;
                    case "Q":
                        d.qx = path[1];
                        d.qy = path[2];
                        path = ["C"].concat(q2c(d.x, d.y, path[1], path[2], path[3], path[4]));
                        break;
                    case "L":
                        path = ["C"].concat(l2c(d.x, d.y, path[1], path[2]));
                        break;
                    case "H":
                        path = ["C"].concat(l2c(d.x, d.y, path[1], d.y));
                        break;
                    case "V":
                        path = ["C"].concat(l2c(d.x, d.y, d.x, path[1]));
                        break;
                    case "Z":
                        path = ["C"].concat(l2c(d.x, d.y, d.X, d.Y));
                        break;
                }
                return path;
            },
            fixArc = function (pp, i) {
                if (pp[i].length > 7) {
                    pp[i].shift();
                    var pi = pp[i];
                    while (pi.length) {
                        pcoms1[i] = "A"; // if created multiple C:s, their original seg is saved
                        p2 && (pcoms2[i] = "A"); // the same as above
                        pp.splice(i++, 0, ["C"].concat(pi.splice(0, 6)));
                    }
                    pp.splice(i, 1);
                    ii = mmax(p.length, p2 && p2.length || 0);
                }
            },
            fixM = function (path1, path2, a1, a2, i) {
                if (path1 && path2 && path1[i][0] == "M" && path2[i][0] != "M") {
                    path2.splice(i, 0, ["M", a2.x, a2.y]);
                    a1.bx = 0;
                    a1.by = 0;
                    a1.x = path1[i][1];
                    a1.y = path1[i][2];
                    ii = mmax(p.length, p2 && p2.length || 0);
                }
            },
            pcoms1 = [], // path commands of original path p
            pcoms2 = [], // path commands of original path p2
            pfirst = "", // temporary holder for original path command
            pcom = ""; // holder for previous path command of original path
        for (var i = 0, ii = mmax(p.length, p2 && p2.length || 0); i < ii; i++) {
            p[i] && (pfirst = p[i][0]); // save current path command

            if (pfirst != "C") // C is not saved yet, because it may be result of conversion
            {
                pcoms1[i] = pfirst; // Save current path command
                i && ( pcom = pcoms1[i - 1]); // Get previous path command pcom
            }
            p[i] = processPath(p[i], attrs, pcom); // Previous path command is inputted to processPath

            if (pcoms1[i] != "A" && pfirst == "C") pcoms1[i] = "C"; // A is the only command
            // which may produce multiple C:s
            // so we have to make sure that C is also C in original path

            fixArc(p, i); // fixArc adds also the right amount of A:s to pcoms1

            if (p2) { // the same procedures is done to p2
                p2[i] && (pfirst = p2[i][0]);
                if (pfirst != "C") {
                    pcoms2[i] = pfirst;
                    i && (pcom = pcoms2[i - 1]);
                }
                p2[i] = processPath(p2[i], attrs2, pcom);

                if (pcoms2[i] != "A" && pfirst == "C") {
                    pcoms2[i] = "C";
                }

                fixArc(p2, i);
            }
            fixM(p, p2, attrs, attrs2, i);
            fixM(p2, p, attrs2, attrs, i);
            var seg = p[i],
                seg2 = p2 && p2[i],
                seglen = seg.length,
                seg2len = p2 && seg2.length;
            attrs.x = seg[seglen - 2];
            attrs.y = seg[seglen - 1];
            attrs.bx = toFloat(seg[seglen - 4]) || attrs.x;
            attrs.by = toFloat(seg[seglen - 3]) || attrs.y;
            attrs2.bx = p2 && (toFloat(seg2[seg2len - 4]) || attrs2.x);
            attrs2.by = p2 && (toFloat(seg2[seg2len - 3]) || attrs2.y);
            attrs2.x = p2 && seg2[seg2len - 2];
            attrs2.y = p2 && seg2[seg2len - 1];
        }
        if (!p2) {
            pth.curve = pathClone(p);
        }
        return p2 ? [p, p2] : p;
    }
    function mapPath(path, matrix) {
        if (!matrix) {
            return path;
        }
        var x, y, i, j, ii, jj, pathi;
        path = path2curve(path);
        for (i = 0, ii = path.length; i < ii; i++) {
            pathi = path[i];
            for (j = 1, jj = pathi.length; j < jj; j += 2) {
                x = matrix.x(pathi[j], pathi[j + 1]);
                y = matrix.y(pathi[j], pathi[j + 1]);
                pathi[j] = x;
                pathi[j + 1] = y;
            }
        }
        return path;
    }

    // http://schepers.cc/getting-to-the-point
    function catmullRom2bezier(crp, z) {
        var d = [];
        for (var i = 0, iLen = crp.length; iLen - 2 * !z > i; i += 2) {
            var p = [
                        {x: +crp[i - 2], y: +crp[i - 1]},
                        {x: +crp[i],     y: +crp[i + 1]},
                        {x: +crp[i + 2], y: +crp[i + 3]},
                        {x: +crp[i + 4], y: +crp[i + 5]}
                    ];
            if (z) {
                if (!i) {
                    p[0] = {x: +crp[iLen - 2], y: +crp[iLen - 1]};
                } else if (iLen - 4 == i) {
                    p[3] = {x: +crp[0], y: +crp[1]};
                } else if (iLen - 2 == i) {
                    p[2] = {x: +crp[0], y: +crp[1]};
                    p[3] = {x: +crp[2], y: +crp[3]};
                }
            } else {
                if (iLen - 4 == i) {
                    p[3] = p[2];
                } else if (!i) {
                    p[0] = {x: +crp[i], y: +crp[i + 1]};
                }
            }
            d.push(["C",
                  (-p[0].x + 6 * p[1].x + p[2].x) / 6,
                  (-p[0].y + 6 * p[1].y + p[2].y) / 6,
                  (p[1].x + 6 * p[2].x - p[3].x) / 6,
                  (p[1].y + 6*p[2].y - p[3].y) / 6,
                  p[2].x,
                  p[2].y
            ]);
        }

        return d;
    }

    // export
    Snap.path = paths;

    /*\
     * Snap.path.getTotalLength
     [ method ]
     **
     * Returns the length of the given path in pixels
     **
     - path (string) SVG path string
     **
     = (number) length
    \*/
    Snap.path.getTotalLength = getTotalLength;
    /*\
     * Snap.path.getPointAtLength
     [ method ]
     **
     * Returns the coordinates of the point located at the given length along the given path
     **
     - path (string) SVG path string
     - length (number) length, in pixels, from the start of the path, excluding non-rendering jumps
     **
     = (object) representation of the point:
     o {
     o     x: (number) x coordinate,
     o     y: (number) y coordinate,
     o     alpha: (number) angle of derivative
     o }
    \*/
    Snap.path.getPointAtLength = getPointAtLength;
    /*\
     * Snap.path.getSubpath
     [ method ]
     **
     * Returns the subpath of a given path between given start and end lengths
     **
     - path (string) SVG path string
     - from (number) length, in pixels, from the start of the path to the start of the segment
     - to (number) length, in pixels, from the start of the path to the end of the segment
     **
     = (string) path string definition for the segment
    \*/
    Snap.path.getSubpath = function (path, from, to) {
        if (this.getTotalLength(path) - to < 1e-6) {
            return getSubpathsAtLength(path, from).end;
        }
        var a = getSubpathsAtLength(path, to, 1);
        return from ? getSubpathsAtLength(a, from).end : a;
    };
    /*\
     * Element.getTotalLength
     [ method ]
     **
     * Returns the length of the path in pixels (only works for `path` elements)
     = (number) length
    \*/
    elproto.getTotalLength = function () {
        if (this.node.getTotalLength) {
            return this.node.getTotalLength();
        }
    };
    // SIERRA Element.getPointAtLength()/Element.getTotalLength(): If a <path> is broken into different segments, is the jump distance to the new coordinates set by the _M_ or _m_ commands calculated as part of the path's total length?
    /*\
     * Element.getPointAtLength
     [ method ]
     **
     * Returns coordinates of the point located at the given length on the given path (only works for `path` elements)
     **
     - length (number) length, in pixels, from the start of the path, excluding non-rendering jumps
     **
     = (object) representation of the point:
     o {
     o     x: (number) x coordinate,
     o     y: (number) y coordinate,
     o     alpha: (number) angle of derivative
     o }
    \*/
    elproto.getPointAtLength = function (length) {
        return getPointAtLength(this.attr("d"), length);
    };
    // SIERRA Element.getSubpath(): Similar to the problem for Element.getPointAtLength(). Unclear how this would work for a segmented path. Overall, the concept of _subpath_ and what I'm calling a _segment_ (series of non-_M_ or _Z_ commands) is unclear.
    /*\
     * Element.getSubpath
     [ method ]
     **
     * Returns subpath of a given element from given start and end lengths (only works for `path` elements)
     **
     - from (number) length, in pixels, from the start of the path to the start of the segment
     - to (number) length, in pixels, from the start of the path to the end of the segment
     **
     = (string) path string definition for the segment
    \*/
    elproto.getSubpath = function (from, to) {
        return Snap.path.getSubpath(this.attr("d"), from, to);
    };
    Snap._.box = box;
    /*\
     * Snap.path.findDotsAtSegment
     [ method ]
     **
     * Utility method
     **
     * Finds dot coordinates on the given cubic beziér curve at the given t
     - p1x (number) x of the first point of the curve
     - p1y (number) y of the first point of the curve
     - c1x (number) x of the first anchor of the curve
     - c1y (number) y of the first anchor of the curve
     - c2x (number) x of the second anchor of the curve
     - c2y (number) y of the second anchor of the curve
     - p2x (number) x of the second point of the curve
     - p2y (number) y of the second point of the curve
     - t (number) position on the curve (0..1)
     = (object) point information in format:
     o {
     o     x: (number) x coordinate of the point,
     o     y: (number) y coordinate of the point,
     o     m: {
     o         x: (number) x coordinate of the left anchor,
     o         y: (number) y coordinate of the left anchor
     o     },
     o     n: {
     o         x: (number) x coordinate of the right anchor,
     o         y: (number) y coordinate of the right anchor
     o     },
     o     start: {
     o         x: (number) x coordinate of the start of the curve,
     o         y: (number) y coordinate of the start of the curve
     o     },
     o     end: {
     o         x: (number) x coordinate of the end of the curve,
     o         y: (number) y coordinate of the end of the curve
     o     },
     o     alpha: (number) angle of the curve derivative at the point
     o }
    \*/
    Snap.path.findDotsAtSegment = findDotsAtSegment;
    /*\
     * Snap.path.bezierBBox
     [ method ]
     **
     * Utility method
     **
     * Returns the bounding box of a given cubic beziér curve
     - p1x (number) x of the first point of the curve
     - p1y (number) y of the first point of the curve
     - c1x (number) x of the first anchor of the curve
     - c1y (number) y of the first anchor of the curve
     - c2x (number) x of the second anchor of the curve
     - c2y (number) y of the second anchor of the curve
     - p2x (number) x of the second point of the curve
     - p2y (number) y of the second point of the curve
     * or
     - bez (array) array of six points for beziér curve
     = (object) bounding box
     o {
     o     x: (number) x coordinate of the left top point of the box,
     o     y: (number) y coordinate of the left top point of the box,
     o     x2: (number) x coordinate of the right bottom point of the box,
     o     y2: (number) y coordinate of the right bottom point of the box,
     o     width: (number) width of the box,
     o     height: (number) height of the box
     o }
    \*/
    Snap.path.bezierBBox = bezierBBox;
    /*\
     * Snap.path.isPointInsideBBox
     [ method ]
     **
     * Utility method
     **
     * Returns `true` if given point is inside bounding box
     - bbox (string) bounding box
     - x (string) x coordinate of the point
     - y (string) y coordinate of the point
     = (boolean) `true` if point is inside
    \*/
    Snap.path.isPointInsideBBox = isPointInsideBBox;
    Snap.closest = function (x, y, X, Y) {
        var r = 100,
            b = box(x - r / 2, y - r / 2, r, r),
            inside = [],
            getter = X[0].hasOwnProperty("x") ? function (i) {
                return {
                    x: X[i].x,
                    y: X[i].y
                };
            } : function (i) {
                return {
                    x: X[i],
                    y: Y[i]
                };
            },
            found = 0;
        while (r <= 1e6 && !found) {
            for (var i = 0, ii = X.length; i < ii; i++) {
                var xy = getter(i);
                if (isPointInsideBBox(b, xy.x, xy.y)) {
                    found++;
                    inside.push(xy);
                    break;
                }
            }
            if (!found) {
                r *= 2;
                b = box(x - r / 2, y - r / 2, r, r)
            }
        }
        if (r == 1e6) {
            return;
        }
        var len = Infinity,
            res;
        for (i = 0, ii = inside.length; i < ii; i++) {
            var l = Snap.len(x, y, inside[i].x, inside[i].y);
            if (len > l) {
                len = l;
                inside[i].len = l;
                res = inside[i];
            }
        }
        return res;
    };
    /*\
     * Snap.path.isBBoxIntersect
     [ method ]
     **
     * Utility method
     **
     * Returns `true` if two bounding boxes intersect
     - bbox1 (string) first bounding box
     - bbox2 (string) second bounding box
     = (boolean) `true` if bounding boxes intersect
    \*/
    Snap.path.isBBoxIntersect = isBBoxIntersect;
    /*\
     * Snap.path.intersection
     [ method ]
     **
     * Utility method
     **
     * Finds intersections of two paths
     - path1 (string) path string
     - path2 (string) path string
     = (array) dots of intersection
     o [
     o     {
     o         x: (number) x coordinate of the point,
     o         y: (number) y coordinate of the point,
     o         t1: (number) t value for segment of path1,
     o         t2: (number) t value for segment of path2,
     o         segment1: (number) order number for segment of path1,
     o         segment2: (number) order number for segment of path2,
     o         bez1: (array) eight coordinates representing beziér curve for the segment of path1,
     o         bez2: (array) eight coordinates representing beziér curve for the segment of path2
     o     }
     o ]
    \*/
    Snap.path.intersection = pathIntersection;
    Snap.path.intersectionNumber = pathIntersectionNumber;
    /*\
     * Snap.path.isPointInside
     [ method ]
     **
     * Utility method
     **
     * Returns `true` if given point is inside a given closed path.
     *
     * Note: fill mode doesn’t affect the result of this method.
     - path (string) path string
     - x (number) x of the point
     - y (number) y of the point
     = (boolean) `true` if point is inside the path
    \*/
    Snap.path.isPointInside = isPointInsidePath;
    /*\
     * Snap.path.getBBox
     [ method ]
     **
     * Utility method
     **
     * Returns the bounding box of a given path
     - path (string) path string
     = (object) bounding box
     o {
     o     x: (number) x coordinate of the left top point of the box,
     o     y: (number) y coordinate of the left top point of the box,
     o     x2: (number) x coordinate of the right bottom point of the box,
     o     y2: (number) y coordinate of the right bottom point of the box,
     o     width: (number) width of the box,
     o     height: (number) height of the box
     o }
    \*/
    Snap.path.getBBox = pathBBox;
    Snap.path.get = getPath;
    /*\
     * Snap.path.toRelative
     [ method ]
     **
     * Utility method
     **
     * Converts path coordinates into relative values
     - path (string) path string
     = (array) path string
    \*/
    Snap.path.toRelative = pathToRelative;
    /*\
     * Snap.path.toAbsolute
     [ method ]
     **
     * Utility method
     **
     * Converts path coordinates into absolute values
     - path (string) path string
     = (array) path string
    \*/
    Snap.path.toAbsolute = pathToAbsolute;
    /*\
     * Snap.path.toCubic
     [ method ]
     **
     * Utility method
     **
     * Converts path to a new path where all segments are cubic beziér curves
     - pathString (string|array) path string or array of segments
     = (array) array of segments
    \*/
    Snap.path.toCubic = path2curve;
    /*\
     * Snap.path.map
     [ method ]
     **
     * Transform the path string with the given matrix
     - path (string) path string
     - matrix (object) see @Matrix
     = (string) transformed path string
    \*/
    Snap.path.map = mapPath;
    Snap.path.toString = toString;
    Snap.path.clone = pathClone;
});

// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Snap.plugin(function (Snap, Element, Paper, glob) {
    var mmax = Math.max,
        mmin = Math.min;

    // Set
    var Set = function (items) {
        this.items = [];
	this.bindings = {};
        this.length = 0;
        this.type = "set";
        if (items) {
            for (var i = 0, ii = items.length; i < ii; i++) {
                if (items[i]) {
                    this[this.items.length] = this.items[this.items.length] = items[i];
                    this.length++;
                }
            }
        }
    },
    setproto = Set.prototype;
    /*\
     * Set.push
     [ method ]
     **
     * Adds each argument to the current set
     = (object) original element
    \*/
    setproto.push = function () {
        var item,
            len;
        for (var i = 0, ii = arguments.length; i < ii; i++) {
            item = arguments[i];
            if (item) {
                len = this.items.length;
                this[len] = this.items[len] = item;
                this.length++;
            }
        }
        return this;
    };
    /*\
     * Set.pop
     [ method ]
     **
     * Removes last element and returns it
     = (object) element
    \*/
    setproto.pop = function () {
        this.length && delete this[this.length--];
        return this.items.pop();
    };
    /*\
     * Set.forEach
     [ method ]
     **
     * Executes given function for each element in the set
     *
     * If the function returns `false`, the loop stops running.
     **
     - callback (function) function to run
     - thisArg (object) context object for the callback
     = (object) Set object
    \*/
    setproto.forEach = function (callback, thisArg) {
        for (var i = 0, ii = this.items.length; i < ii; i++) {
            if (callback.call(thisArg, this.items[i], i) === false) {
                return this;
            }
        }
        return this;
    };
    /*\
     * Set.animate
     [ method ]
     **
     * Animates each element in set in sync.
     *
     **
     - attrs (object) key-value pairs of destination attributes
     - duration (number) duration of the animation in milliseconds
     - easing (function) #optional easing function from @mina or custom
     - callback (function) #optional callback function that executes when the animation ends
     * or
     - animation (array) array of animation parameter for each element in set in format `[attrs, duration, easing, callback]`
     > Usage
     | // animate all elements in set to radius 10
     | set.animate({r: 10}, 500, mina.easein);
     | // or
     | // animate first element to radius 10, but second to radius 20 and in different time
     | set.animate([{r: 10}, 500, mina.easein], [{r: 20}, 1500, mina.easein]);
     = (Element) the current element
    \*/
    setproto.animate = function (attrs, ms, easing, callback) {
        if (typeof easing == "function" && !easing.length) {
            callback = easing;
            easing = mina.linear;
        }
        if (attrs instanceof Snap._.Animation) {
            callback = attrs.callback;
            easing = attrs.easing;
            ms = easing.dur;
            attrs = attrs.attr;
        }
        var args = arguments;
        if (Snap.is(attrs, "array") && Snap.is(args[args.length - 1], "array")) {
            var each = true;
        }
        var begin,
            handler = function () {
                if (begin) {
                    this.b = begin;
                } else {
                    begin = this.b;
                }
            },
            cb = 0,
            set = this,
            callbacker = callback && function () {
                if (++cb == set.length) {
                    callback.call(this);
                }
            };
        return this.forEach(function (el, i) {
            eve.once("snap.animcreated." + el.id, handler);
            if (each) {
                args[i] && el.animate.apply(el, args[i]);
            } else {
                el.animate(attrs, ms, easing, callbacker);
            }
        });
    };
    setproto.remove = function () {
        while (this.length) {
            this.pop().remove();
        }
        return this;
    };
    /*\
     * Set.bind
     [ method ]
     **
     * Specifies how to handle a specific attribute when applied
     * to a set.
     *
     **
     - attr (string) attribute name
     - callback (function) function to run
     * or
     - attr (string) attribute name
     - element (Element) specific element in the set to apply the attribute to
     * or
     - attr (string) attribute name
     - element (Element) specific element in the set to apply the attribute to
     - eattr (string) attribute on the element to bind the attribute to
     = (object) Set object
    \*/
    setproto.bind = function (attr, a, b) {
        var data = {};
        if (typeof a == "function") {
            this.bindings[attr] = a;
        } else {
            var aname = b || attr;
            this.bindings[attr] = function (v) {
                data[aname] = v;
                a.attr(data);
            };
        }
        return this;
    };
    setproto.attr = function (value) {
        var unbound = {};
        for (var k in value) {
            if (this.bindings[k]) {
                this.bindings[k](value[k]);
            } else {
                unbound[k] = value[k];
            }
        }
        for (var i = 0, ii = this.items.length; i < ii; i++) {
            this.items[i].attr(unbound);
        }
        return this;
    };
    /*\
     * Set.clear
     [ method ]
     **
     * Removes all elements from the set
    \*/
    setproto.clear = function () {
        while (this.length) {
            this.pop();
        }
    };
    /*\
     * Set.splice
     [ method ]
     **
     * Removes range of elements from the set
     **
     - index (number) position of the deletion
     - count (number) number of element to remove
     - insertion… (object) #optional elements to insert
     = (object) set elements that were deleted
    \*/
    setproto.splice = function (index, count, insertion) {
        index = index < 0 ? mmax(this.length + index, 0) : index;
        count = mmax(0, mmin(this.length - index, count));
        var tail = [],
            todel = [],
            args = [],
            i;
        for (i = 2; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        for (i = 0; i < count; i++) {
            todel.push(this[index + i]);
        }
        for (; i < this.length - index; i++) {
            tail.push(this[index + i]);
        }
        var arglen = args.length;
        for (i = 0; i < arglen + tail.length; i++) {
            this.items[index + i] = this[index + i] = i < arglen ? args[i] : tail[i - arglen];
        }
        i = this.items.length = this.length -= count - arglen;
        while (this[i]) {
            delete this[i++];
        }
        return new Set(todel);
    };
    /*\
     * Set.exclude
     [ method ]
     **
     * Removes given element from the set
     **
     - element (object) element to remove
     = (boolean) `true` if object was found and removed from the set
    \*/
    setproto.exclude = function (el) {
        for (var i = 0, ii = this.length; i < ii; i++) if (this[i] == el) {
            this.splice(i, 1);
            return true;
        }
        return false;
    };
    setproto.insertAfter = function (el) {
        var i = this.items.length;
        while (i--) {
            this.items[i].insertAfter(el);
        }
        return this;
    };
    setproto.getBBox = function () {
        var x = [],
            y = [],
            x2 = [],
            y2 = [];
        for (var i = this.items.length; i--;) if (!this.items[i].removed) {
            var box = this.items[i].getBBox();
            x.push(box.x);
            y.push(box.y);
            x2.push(box.x + box.width);
            y2.push(box.y + box.height);
        }
        x = mmin.apply(0, x);
        y = mmin.apply(0, y);
        x2 = mmax.apply(0, x2);
        y2 = mmax.apply(0, y2);
        return {
            x: x,
            y: y,
            x2: x2,
            y2: y2,
            width: x2 - x,
            height: y2 - y,
            cx: x + (x2 - x) / 2,
            cy: y + (y2 - y) / 2
        };
    };
    setproto.clone = function (s) {
        s = new Set;
        for (var i = 0, ii = this.items.length; i < ii; i++) {
            s.push(this.items[i].clone());
        }
        return s;
    };
    setproto.toString = function () {
        return "Snap\u2018s set";
    };
    setproto.type = "set";
    // export
    Snap.Set = Set;
    Snap.set = function () {
        var set = new Set;
        if (arguments.length) {
            set.push.apply(set, Array.prototype.slice.call(arguments, 0));
        }
        return set;
    };
});

// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Snap.plugin(function (Snap, Element, Paper, glob) {
    var names = {},
        reUnit = /[a-z]+$/i,
        Str = String;
    names.stroke = names.fill = "colour";
    function getEmpty(item) {
        var l = item[0];
        switch (l.toLowerCase()) {
            case "t": return [l, 0, 0];
            case "m": return [l, 1, 0, 0, 1, 0, 0];
            case "r": if (item.length == 4) {
                return [l, 0, item[2], item[3]];
            } else {
                return [l, 0];
            }
            case "s": if (item.length == 5) {
                return [l, 1, 1, item[3], item[4]];
            } else if (item.length == 3) {
                return [l, 1, 1];
            } else {
                return [l, 1];
            }
        }
    }
    function equaliseTransform(t1, t2, getBBox) {
        t2 = Str(t2).replace(/\.{3}|\u2026/g, t1);
        t1 = Snap.parseTransformString(t1) || [];
        t2 = Snap.parseTransformString(t2) || [];
        var maxlength = Math.max(t1.length, t2.length),
            from = [],
            to = [],
            i = 0, j, jj,
            tt1, tt2;
        for (; i < maxlength; i++) {
            tt1 = t1[i] || getEmpty(t2[i]);
            tt2 = t2[i] || getEmpty(tt1);
            if ((tt1[0] != tt2[0]) ||
                (tt1[0].toLowerCase() == "r" && (tt1[2] != tt2[2] || tt1[3] != tt2[3])) ||
                (tt1[0].toLowerCase() == "s" && (tt1[3] != tt2[3] || tt1[4] != tt2[4]))
                ) {
                    t1 = Snap._.transform2matrix(t1, getBBox());
                    t2 = Snap._.transform2matrix(t2, getBBox());
                    from = [["m", t1.a, t1.b, t1.c, t1.d, t1.e, t1.f]];
                    to = [["m", t2.a, t2.b, t2.c, t2.d, t2.e, t2.f]];
                    break;
            }
            from[i] = [];
            to[i] = [];
            for (j = 0, jj = Math.max(tt1.length, tt2.length); j < jj; j++) {
                j in tt1 && (from[i][j] = tt1[j]);
                j in tt2 && (to[i][j] = tt2[j]);
            }
        }
        return {
            from: path2array(from),
            to: path2array(to),
            f: getPath(from)
        };
    }
    function getNumber(val) {
        return val;
    }
    function getUnit(unit) {
        return function (val) {
            return +val.toFixed(3) + unit;
        };
    }
    function getViewBox(val) {
        return val.join(" ");
    }
    function getColour(clr) {
        return Snap.rgb(clr[0], clr[1], clr[2]);
    }
    function getPath(path) {
        var k = 0, i, ii, j, jj, out, a, b = [];
        for (i = 0, ii = path.length; i < ii; i++) {
            out = "[";
            a = ['"' + path[i][0] + '"'];
            for (j = 1, jj = path[i].length; j < jj; j++) {
                a[j] = "val[" + (k++) + "]";
            }
            out += a + "]";
            b[i] = out;
        }
        return Function("val", "return Snap.path.toString.call([" + b + "])");
    }
    function path2array(path) {
        var out = [];
        for (var i = 0, ii = path.length; i < ii; i++) {
            for (var j = 1, jj = path[i].length; j < jj; j++) {
                out.push(path[i][j]);
            }
        }
        return out;
    }
    function isNumeric(obj) {
        return isFinite(parseFloat(obj));
    }
    function arrayEqual(arr1, arr2) {
        if (!Snap.is(arr1, "array") || !Snap.is(arr2, "array")) {
            return false;
        }
        return arr1.toString() == arr2.toString();
    }
    Element.prototype.equal = function (name, b) {
        return eve("snap.util.equal", this, name, b).firstDefined();
    };
    eve.on("snap.util.equal", function (name, b) {
        var A, B, a = Str(this.attr(name) || ""),
            el = this;
        if (isNumeric(a) && isNumeric(b)) {
            return {
                from: parseFloat(a),
                to: parseFloat(b),
                f: getNumber
            };
        }
        if (names[name] == "colour") {
            A = Snap.color(a);
            B = Snap.color(b);
            return {
                from: [A.r, A.g, A.b, A.opacity],
                to: [B.r, B.g, B.b, B.opacity],
                f: getColour
            };
        }
        if (name == "viewBox") {
            A = this.attr(name).vb.split(" ").map(Number);
            B = b.split(" ").map(Number);
            return {
                from: A,
                to: B,
                f: getViewBox
            };
        }
        if (name == "transform" || name == "gradientTransform" || name == "patternTransform") {
            if (b instanceof Snap.Matrix) {
                b = b.toTransformString();
            }
            if (!Snap._.rgTransform.test(b)) {
                b = Snap._.svgTransform2string(b);
            }
            return equaliseTransform(a, b, function () {
                return el.getBBox(1);
            });
        }
        if (name == "d" || name == "path") {
            A = Snap.path.toCubic(a, b);
            return {
                from: path2array(A[0]),
                to: path2array(A[1]),
                f: getPath(A[0])
            };
        }
        if (name == "points") {
            A = Str(a).split(Snap._.separator);
            B = Str(b).split(Snap._.separator);
            return {
                from: A,
                to: B,
                f: function (val) { return val; }
            };
        }
        var aUnit = a.match(reUnit),
            bUnit = Str(b).match(reUnit);
        if (aUnit && arrayEqual(aUnit, bUnit)) {
            return {
                from: parseFloat(a),
                to: parseFloat(b),
                f: getUnit(aUnit)
            };
        } else {
            return {
                from: this.asPX(name),
                to: this.asPX(name, b),
                f: getNumber
            };
        }
    });
});

// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Snap.plugin(function (Snap, Element, Paper, glob) {
    var elproto = Element.prototype,
    has = "hasOwnProperty",
    supportsTouch = "createTouch" in glob.doc,
    events = [
        "click", "dblclick", "mousedown", "mousemove", "mouseout",
        "mouseover", "mouseup", "touchstart", "touchmove", "touchend",
        "touchcancel"
    ],
    touchMap = {
        mousedown: "touchstart",
        mousemove: "touchmove",
        mouseup: "touchend"
    },
    getScroll = function (xy, el) {
        var name = xy == "y" ? "scrollTop" : "scrollLeft",
            doc = el && el.node ? el.node.ownerDocument : glob.doc;
        return doc[name in doc.documentElement ? "documentElement" : "body"][name];
    },
    preventDefault = function () {
        this.returnValue = false;
    },
    preventTouch = function () {
        return this.originalEvent.preventDefault();
    },
    stopPropagation = function () {
        this.cancelBubble = true;
    },
    stopTouch = function () {
        return this.originalEvent.stopPropagation();
    },
    addEvent = function (obj, type, fn, element) {
        var realName = supportsTouch && touchMap[type] ? touchMap[type] : type,
            f = function (e) {
                var scrollY = getScroll("y", element),
                    scrollX = getScroll("x", element);
                if (supportsTouch && touchMap[has](type)) {
                    for (var i = 0, ii = e.targetTouches && e.targetTouches.length; i < ii; i++) {
                        if (e.targetTouches[i].target == obj || obj.contains(e.targetTouches[i].target)) {
                            var olde = e;
                            e = e.targetTouches[i];
                            e.originalEvent = olde;
                            e.preventDefault = preventTouch;
                            e.stopPropagation = stopTouch;
                            break;
                        }
                    }
                }
                var x = e.clientX + scrollX,
                    y = e.clientY + scrollY;
                return fn.call(element, e, x, y);
            };

        if (type !== realName) {
            obj.addEventListener(type, f, false);
        }

        obj.addEventListener(realName, f, false);

        return function () {
            if (type !== realName) {
                obj.removeEventListener(type, f, false);
            }

            obj.removeEventListener(realName, f, false);
            return true;
        };
    },
    drag = [],
    dragMove = function (e) {
        var x = e.clientX,
            y = e.clientY,
            scrollY = getScroll("y"),
            scrollX = getScroll("x"),
            dragi,
            j = drag.length;
        while (j--) {
            dragi = drag[j];
            if (supportsTouch) {
                var i = e.touches && e.touches.length,
                    touch;
                while (i--) {
                    touch = e.touches[i];
                    if (touch.identifier == dragi.el._drag.id || dragi.el.node.contains(touch.target)) {
                        x = touch.clientX;
                        y = touch.clientY;
                        (e.originalEvent ? e.originalEvent : e).preventDefault();
                        break;
                    }
                }
            } else {
                e.preventDefault();
            }
            var node = dragi.el.node,
                o,
                next = node.nextSibling,
                parent = node.parentNode,
                display = node.style.display;
            // glob.win.opera && parent.removeChild(node);
            // node.style.display = "none";
            // o = dragi.el.paper.getElementByPoint(x, y);
            // node.style.display = display;
            // glob.win.opera && (next ? parent.insertBefore(node, next) : parent.appendChild(node));
            // o && eve("snap.drag.over." + dragi.el.id, dragi.el, o);
            x += scrollX;
            y += scrollY;
            eve("snap.drag.move." + dragi.el.id, dragi.move_scope || dragi.el, x - dragi.el._drag.x, y - dragi.el._drag.y, x, y, e);
        }
    },
    dragUp = function (e) {
        Snap.unmousemove(dragMove).unmouseup(dragUp);
        var i = drag.length,
            dragi;
        while (i--) {
            dragi = drag[i];
            dragi.el._drag = {};
            eve("snap.drag.end." + dragi.el.id, dragi.end_scope || dragi.start_scope || dragi.move_scope || dragi.el, e);
            eve.off("snap.drag.*." + dragi.el.id);
        }
        drag = [];
    };
    /*\
     * Element.click
     [ method ]
     **
     * Adds a click event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unclick
     [ method ]
     **
     * Removes a click event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    
    /*\
     * Element.dblclick
     [ method ]
     **
     * Adds a double click event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.undblclick
     [ method ]
     **
     * Removes a double click event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    
    /*\
     * Element.mousedown
     [ method ]
     **
     * Adds a mousedown event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unmousedown
     [ method ]
     **
     * Removes a mousedown event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    
    /*\
     * Element.mousemove
     [ method ]
     **
     * Adds a mousemove event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unmousemove
     [ method ]
     **
     * Removes a mousemove event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    
    /*\
     * Element.mouseout
     [ method ]
     **
     * Adds a mouseout event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unmouseout
     [ method ]
     **
     * Removes a mouseout event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    
    /*\
     * Element.mouseover
     [ method ]
     **
     * Adds a mouseover event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unmouseover
     [ method ]
     **
     * Removes a mouseover event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    
    /*\
     * Element.mouseup
     [ method ]
     **
     * Adds a mouseup event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unmouseup
     [ method ]
     **
     * Removes a mouseup event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    
    /*\
     * Element.touchstart
     [ method ]
     **
     * Adds a touchstart event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.untouchstart
     [ method ]
     **
     * Removes a touchstart event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    
    /*\
     * Element.touchmove
     [ method ]
     **
     * Adds a touchmove event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.untouchmove
     [ method ]
     **
     * Removes a touchmove event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    
    /*\
     * Element.touchend
     [ method ]
     **
     * Adds a touchend event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.untouchend
     [ method ]
     **
     * Removes a touchend event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    
    /*\
     * Element.touchcancel
     [ method ]
     **
     * Adds a touchcancel event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.untouchcancel
     [ method ]
     **
     * Removes a touchcancel event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    for (var i = events.length; i--;) {
        (function (eventName) {
            Snap[eventName] = elproto[eventName] = function (fn, scope) {
                if (Snap.is(fn, "function")) {
                    this.events = this.events || [];
                    this.events.push({
                        name: eventName,
                        f: fn,
                        unbind: addEvent(this.node || document, eventName, fn, scope || this)
                    });
                } else {
                    for (var i = 0, ii = this.events.length; i < ii; i++) if (this.events[i].name == eventName) {
                        try {
                            this.events[i].f.call(this);
                        } catch (e) {}
                    }
                }
                return this;
            };
            Snap["un" + eventName] =
            elproto["un" + eventName] = function (fn) {
                var events = this.events || [],
                    l = events.length;
                while (l--) if (events[l].name == eventName &&
                               (events[l].f == fn || !fn)) {
                    events[l].unbind();
                    events.splice(l, 1);
                    !events.length && delete this.events;
                    return this;
                }
                return this;
            };
        })(events[i]);
    }
    /*\
     * Element.hover
     [ method ]
     **
     * Adds hover event handlers to the element
     - f_in (function) handler for hover in
     - f_out (function) handler for hover out
     - icontext (object) #optional context for hover in handler
     - ocontext (object) #optional context for hover out handler
     = (object) @Element
    \*/
    elproto.hover = function (f_in, f_out, scope_in, scope_out) {
        return this.mouseover(f_in, scope_in).mouseout(f_out, scope_out || scope_in);
    };
    /*\
     * Element.unhover
     [ method ]
     **
     * Removes hover event handlers from the element
     - f_in (function) handler for hover in
     - f_out (function) handler for hover out
     = (object) @Element
    \*/
    elproto.unhover = function (f_in, f_out) {
        return this.unmouseover(f_in).unmouseout(f_out);
    };
    var draggable = [];
    // SIERRA unclear what _context_ refers to for starting, ending, moving the drag gesture.
    // SIERRA Element.drag(): _x position of the mouse_: Where are the x/y values offset from?
    // SIERRA Element.drag(): much of this member's doc appears to be duplicated for some reason.
    // SIERRA Unclear about this sentence: _Additionally following drag events will be triggered: drag.start.<id> on start, drag.end.<id> on end and drag.move.<id> on every move._ Is there a global _drag_ object to which you can assign handlers keyed by an element's ID?
    /*\
     * Element.drag
     [ method ]
     **
     * Adds event handlers for an element's drag gesture
     **
     - onmove (function) handler for moving
     - onstart (function) handler for drag start
     - onend (function) handler for drag end
     - mcontext (object) #optional context for moving handler
     - scontext (object) #optional context for drag start handler
     - econtext (object) #optional context for drag end handler
     * Additionaly following `drag` events are triggered: `drag.start.<id>` on start, 
     * `drag.end.<id>` on end and `drag.move.<id>` on every move. When element is dragged over another element 
     * `drag.over.<id>` fires as well.
     *
     * Start event and start handler are called in specified context or in context of the element with following parameters:
     o x (number) x position of the mouse
     o y (number) y position of the mouse
     o event (object) DOM event object
     * Move event and move handler are called in specified context or in context of the element with following parameters:
     o dx (number) shift by x from the start point
     o dy (number) shift by y from the start point
     o x (number) x position of the mouse
     o y (number) y position of the mouse
     o event (object) DOM event object
     * End event and end handler are called in specified context or in context of the element with following parameters:
     o event (object) DOM event object
     = (object) @Element
    \*/
    elproto.drag = function (onmove, onstart, onend, move_scope, start_scope, end_scope) {
        var el = this;
        if (!arguments.length) {
            var origTransform;
            return el.drag(function (dx, dy) {
                this.attr({
                    transform: origTransform + (origTransform ? "T" : "t") + [dx, dy]
                });
            }, function () {
                origTransform = this.transform().local;
            });
        }
        function start(e, x, y) {
            (e.originalEvent || e).preventDefault();
            el._drag.x = x;
            el._drag.y = y;
            el._drag.id = e.identifier;
            !drag.length && Snap.mousemove(dragMove).mouseup(dragUp);
            drag.push({el: el, move_scope: move_scope, start_scope: start_scope, end_scope: end_scope});
            onstart && eve.on("snap.drag.start." + el.id, onstart);
            onmove && eve.on("snap.drag.move." + el.id, onmove);
            onend && eve.on("snap.drag.end." + el.id, onend);
            eve("snap.drag.start." + el.id, start_scope || move_scope || el, x, y, e);
        }
        function init(e, x, y) {
            eve("snap.draginit." + el.id, el, e, x, y);
        }
        eve.on("snap.draginit." + el.id, start);
        el._drag = {};
        draggable.push({el: el, start: start, init: init});
        el.mousedown(init);
        return el;
    };
    /*
     * Element.onDragOver
     [ method ]
     **
     * Shortcut to assign event handler for `drag.over.<id>` event, where `id` is the element's `id` (see @Element.id)
     - f (function) handler for event, first argument would be the element you are dragging over
    \*/
    // elproto.onDragOver = function (f) {
    //     f ? eve.on("snap.drag.over." + this.id, f) : eve.unbind("snap.drag.over." + this.id);
    // };
    /*\
     * Element.undrag
     [ method ]
     **
     * Removes all drag event handlers from the given element
    \*/
    elproto.undrag = function () {
        var i = draggable.length;
        while (i--) if (draggable[i].el == this) {
            this.unmousedown(draggable[i].init);
            draggable.splice(i, 1);
            eve.unbind("snap.drag.*." + this.id);
            eve.unbind("snap.draginit." + this.id);
        }
        !draggable.length && Snap.unmousemove(dragMove).unmouseup(dragUp);
        return this;
    };
});

// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Snap.plugin(function (Snap, Element, Paper, glob) {
    var elproto = Element.prototype,
        pproto = Paper.prototype,
        rgurl = /^\s*url\((.+)\)/,
        Str = String,
        $ = Snap._.$;
    Snap.filter = {};
    /*\
     * Paper.filter
     [ method ]
     **
     * Creates a `<filter>` element
     **
     - filstr (string) SVG fragment of filter provided as a string
     = (object) @Element
     * Note: It is recommended to use filters embedded into the page inside an empty SVG element.
     > Usage
     | var f = paper.filter('<feGaussianBlur stdDeviation="2"/>'),
     |     c = paper.circle(10, 10, 10).attr({
     |         filter: f
     |     });
    \*/
    pproto.filter = function (filstr) {
        var paper = this;
        if (paper.type != "svg") {
            paper = paper.paper;
        }
        var f = Snap.parse(Str(filstr)),
            id = Snap._.id(),
            width = paper.node.offsetWidth,
            height = paper.node.offsetHeight,
            filter = $("filter");
        $(filter, {
            id: id,
            filterUnits: "userSpaceOnUse"
        });
        filter.appendChild(f.node);
        paper.defs.appendChild(filter);
        return new Element(filter);
    };
    
    eve.on("snap.util.getattr.filter", function () {
        eve.stop();
        var p = $(this.node, "filter");
        if (p) {
            var match = Str(p).match(rgurl);
            return match && Snap.select(match[1]);
        }
    });
    eve.on("snap.util.attr.filter", function (value) {
        if (value instanceof Element && value.type == "filter") {
            eve.stop();
            var id = value.node.id;
            if (!id) {
                $(value.node, {id: value.id});
                id = value.id;
            }
            $(this.node, {
                filter: Snap.url(id)
            });
        }
        if (!value || value == "none") {
            eve.stop();
            this.node.removeAttribute("filter");
        }
    });
    /*\
     * Snap.filter.blur
     [ method ]
     **
     * Returns an SVG markup string for the blur filter
     **
     - x (number) amount of horizontal blur, in pixels
     - y (number) #optional amount of vertical blur, in pixels
     = (string) filter representation
     > Usage
     | var f = paper.filter(Snap.filter.blur(5, 10)),
     |     c = paper.circle(10, 10, 10).attr({
     |         filter: f
     |     });
    \*/
    Snap.filter.blur = function (x, y) {
        if (x == null) {
            x = 2;
        }
        var def = y == null ? x : [x, y];
        return Snap.format('\<feGaussianBlur stdDeviation="{def}"/>', {
            def: def
        });
    };
    Snap.filter.blur.toString = function () {
        return this();
    };
    /*\
     * Snap.filter.shadow
     [ method ]
     **
     * Returns an SVG markup string for the shadow filter
     **
     - dx (number) #optional horizontal shift of the shadow, in pixels
     - dy (number) #optional vertical shift of the shadow, in pixels
     - blur (number) #optional amount of blur
     - color (string) #optional color of the shadow
     - opacity (number) #optional `0..1` opacity of the shadow
     * or
     - dx (number) #optional horizontal shift of the shadow, in pixels
     - dy (number) #optional vertical shift of the shadow, in pixels
     - color (string) #optional color of the shadow
     - opacity (number) #optional `0..1` opacity of the shadow
     * which makes blur default to `4`. Or
     - dx (number) #optional horizontal shift of the shadow, in pixels
     - dy (number) #optional vertical shift of the shadow, in pixels
     - opacity (number) #optional `0..1` opacity of the shadow
     = (string) filter representation
     > Usage
     | var f = paper.filter(Snap.filter.shadow(0, 2, 3)),
     |     c = paper.circle(10, 10, 10).attr({
     |         filter: f
     |     });
    \*/
    Snap.filter.shadow = function (dx, dy, blur, color, opacity) {
        if (typeof blur == "string") {
            color = blur;
            opacity = color;
            blur = 4;
        }
        if (typeof color != "string") {
            opacity = color;
            color = "#000";
        }
        color = color || "#000";
        if (blur == null) {
            blur = 4;
        }
        if (opacity == null) {
            opacity = 1;
        }
        if (dx == null) {
            dx = 0;
            dy = 2;
        }
        if (dy == null) {
            dy = dx;
        }
        color = Snap.color(color);
        return Snap.format('<feGaussianBlur in="SourceAlpha" stdDeviation="{blur}"/><feOffset dx="{dx}" dy="{dy}" result="offsetblur"/><feFlood flood-color="{color}"/><feComposite in2="offsetblur" operator="in"/><feComponentTransfer><feFuncA type="linear" slope="{opacity}"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>', {
            color: color,
            dx: dx,
            dy: dy,
            blur: blur,
            opacity: opacity
        });
    };
    Snap.filter.shadow.toString = function () {
        return this();
    };
    /*\
     * Snap.filter.grayscale
     [ method ]
     **
     * Returns an SVG markup string for the grayscale filter
     **
     - amount (number) amount of filter (`0..1`)
     = (string) filter representation
    \*/
    Snap.filter.grayscale = function (amount) {
        if (amount == null) {
            amount = 1;
        }
        return Snap.format('<feColorMatrix type="matrix" values="{a} {b} {c} 0 0 {d} {e} {f} 0 0 {g} {b} {h} 0 0 0 0 0 1 0"/>', {
            a: 0.2126 + 0.7874 * (1 - amount),
            b: 0.7152 - 0.7152 * (1 - amount),
            c: 0.0722 - 0.0722 * (1 - amount),
            d: 0.2126 - 0.2126 * (1 - amount),
            e: 0.7152 + 0.2848 * (1 - amount),
            f: 0.0722 - 0.0722 * (1 - amount),
            g: 0.2126 - 0.2126 * (1 - amount),
            h: 0.0722 + 0.9278 * (1 - amount)
        });
    };
    Snap.filter.grayscale.toString = function () {
        return this();
    };
    /*\
     * Snap.filter.sepia
     [ method ]
     **
     * Returns an SVG markup string for the sepia filter
     **
     - amount (number) amount of filter (`0..1`)
     = (string) filter representation
    \*/
    Snap.filter.sepia = function (amount) {
        if (amount == null) {
            amount = 1;
        }
        return Snap.format('<feColorMatrix type="matrix" values="{a} {b} {c} 0 0 {d} {e} {f} 0 0 {g} {h} {i} 0 0 0 0 0 1 0"/>', {
            a: 0.393 + 0.607 * (1 - amount),
            b: 0.769 - 0.769 * (1 - amount),
            c: 0.189 - 0.189 * (1 - amount),
            d: 0.349 - 0.349 * (1 - amount),
            e: 0.686 + 0.314 * (1 - amount),
            f: 0.168 - 0.168 * (1 - amount),
            g: 0.272 - 0.272 * (1 - amount),
            h: 0.534 - 0.534 * (1 - amount),
            i: 0.131 + 0.869 * (1 - amount)
        });
    };
    Snap.filter.sepia.toString = function () {
        return this();
    };
    /*\
     * Snap.filter.saturate
     [ method ]
     **
     * Returns an SVG markup string for the saturate filter
     **
     - amount (number) amount of filter (`0..1`)
     = (string) filter representation
    \*/
    Snap.filter.saturate = function (amount) {
        if (amount == null) {
            amount = 1;
        }
        return Snap.format('<feColorMatrix type="saturate" values="{amount}"/>', {
            amount: 1 - amount
        });
    };
    Snap.filter.saturate.toString = function () {
        return this();
    };
    /*\
     * Snap.filter.hueRotate
     [ method ]
     **
     * Returns an SVG markup string for the hue-rotate filter
     **
     - angle (number) angle of rotation
     = (string) filter representation
    \*/
    Snap.filter.hueRotate = function (angle) {
        angle = angle || 0;
        return Snap.format('<feColorMatrix type="hueRotate" values="{angle}"/>', {
            angle: angle
        });
    };
    Snap.filter.hueRotate.toString = function () {
        return this();
    };
    /*\
     * Snap.filter.invert
     [ method ]
     **
     * Returns an SVG markup string for the invert filter
     **
     - amount (number) amount of filter (`0..1`)
     = (string) filter representation
    \*/
    Snap.filter.invert = function (amount) {
        if (amount == null) {
            amount = 1;
        }
//        <feColorMatrix type="matrix" values="-1 0 0 0 1  0 -1 0 0 1  0 0 -1 0 1  0 0 0 1 0" color-interpolation-filters="sRGB"/>
        return Snap.format('<feComponentTransfer><feFuncR type="table" tableValues="{amount} {amount2}"/><feFuncG type="table" tableValues="{amount} {amount2}"/><feFuncB type="table" tableValues="{amount} {amount2}"/></feComponentTransfer>', {
            amount: amount,
            amount2: 1 - amount
        });
    };
    Snap.filter.invert.toString = function () {
        return this();
    };
    /*\
     * Snap.filter.brightness
     [ method ]
     **
     * Returns an SVG markup string for the brightness filter
     **
     - amount (number) amount of filter (`0..1`)
     = (string) filter representation
    \*/
    Snap.filter.brightness = function (amount) {
        if (amount == null) {
            amount = 1;
        }
        return Snap.format('<feComponentTransfer><feFuncR type="linear" slope="{amount}"/><feFuncG type="linear" slope="{amount}"/><feFuncB type="linear" slope="{amount}"/></feComponentTransfer>', {
            amount: amount
        });
    };
    Snap.filter.brightness.toString = function () {
        return this();
    };
    /*\
     * Snap.filter.contrast
     [ method ]
     **
     * Returns an SVG markup string for the contrast filter
     **
     - amount (number) amount of filter (`0..1`)
     = (string) filter representation
    \*/
    Snap.filter.contrast = function (amount) {
        if (amount == null) {
            amount = 1;
        }
        return Snap.format('<feComponentTransfer><feFuncR type="linear" slope="{amount}" intercept="{amount2}"/><feFuncG type="linear" slope="{amount}" intercept="{amount2}"/><feFuncB type="linear" slope="{amount}" intercept="{amount2}"/></feComponentTransfer>', {
            amount: amount,
            amount2: .5 - amount / 2
        });
    };
    Snap.filter.contrast.toString = function () {
        return this();
    };
});

// Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Snap.plugin(function (Snap, Element, Paper, glob, Fragment) {
    var box = Snap._.box,
        is = Snap.is,
        firstLetter = /^[^a-z]*([tbmlrc])/i,
        toString = function () {
            return "T" + this.dx + "," + this.dy;
        };
    /*\
     * Element.getAlign
     [ method ]
     **
     * Returns shift needed to align the element relatively to given element.
     * If no elements specified, parent `<svg>` container will be used.
     - el (object) @optional alignment element
     - way (string) one of six values: `"top"`, `"middle"`, `"bottom"`, `"left"`, `"center"`, `"right"`
     = (object|string) Object in format `{dx: , dy: }` also has a string representation as a transformation string
     > Usage
     | el.transform(el.getAlign(el2, "top"));
     * or
     | var dy = el.getAlign(el2, "top").dy;
    \*/
    Element.prototype.getAlign = function (el, way) {
        if (way == null && is(el, "string")) {
            way = el;
            el = null;
        }
        el = el || this.paper;
        var bx = el.getBBox ? el.getBBox() : box(el),
            bb = this.getBBox(),
            out = {};
        way = way && way.match(firstLetter);
        way = way ? way[1].toLowerCase() : "c";
        switch (way) {
            case "t":
                out.dx = 0;
                out.dy = bx.y - bb.y;
            break;
            case "b":
                out.dx = 0;
                out.dy = bx.y2 - bb.y2;
            break;
            case "m":
                out.dx = 0;
                out.dy = bx.cy - bb.cy;
            break;
            case "l":
                out.dx = bx.x - bb.x;
                out.dy = 0;
            break;
            case "r":
                out.dx = bx.x2 - bb.x2;
                out.dy = 0;
            break;
            default:
                out.dx = bx.cx - bb.cx;
                out.dy = 0;
            break;
        }
        out.toString = toString;
        return out;
    };
    /*\
     * Element.align
     [ method ]
     **
     * Aligns the element relatively to given one via transformation.
     * If no elements specified, parent `<svg>` container will be used.
     - el (object) @optional alignment element
     - way (string) one of six values: `"top"`, `"middle"`, `"bottom"`, `"left"`, `"center"`, `"right"`
     = (object) this element
     > Usage
     | el.align(el2, "top");
     * or
     | el.align("middle");
    \*/
    Element.prototype.align = function (el, way) {
        return this.transform("..." + this.getAlign(el, way));
    };
});

return Snap;
}));

},{"eve":5}]},{},[19])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvaW5oZXJpdHMvaW5oZXJpdHNfYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvdXRpbC9zdXBwb3J0L2lzQnVmZmVyQnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy91dGlsL3V0aWwuanMiLCJub2RlX21vZHVsZXMvZXZlL2V2ZS5qcyIsIm5vZGVfbW9kdWxlcy9ldmVudGVtaXR0ZXIyL2xpYi9ldmVudGVtaXR0ZXIyLmpzIiwibm9kZV9tb2R1bGVzL3V1aWQvcm5nLWJyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvdXVpZC91dWlkLmpzIiwic3JjL2FsZ29yaXRobS9hc3Rhci5qcyIsInNyYy9jb3JlL0Jhc2VNb2JpbGVVbml0LmpzIiwic3JjL2NvcmUvQmFzZU5hdHVyZVVuaXQuanMiLCJzcmMvY29yZS9CYXNlVW5pdC5qcyIsInNyYy9jb3JlL01hcC5qcyIsInNyYy9jb3JlL1VuaXRNYW5hZ2VyLmpzIiwic3JjL2NvcmUvaW5kZXguanMiLCJzcmMvY29yZS9tYXRoMmQuanMiLCJzcmMvY29yZS9wbGF5ZXIuanMiLCJzcmMvZ3JhcGhpYy91bml0R3JhcGhpYy5qcyIsInNyYy9tYWluLmpzIiwic3JjL3VpL2NvbnRyb2xQYW5lbC5qcyIsInNyYy91aS9yZWN0YW5nbGVTZWxlY3Rvci5qcyIsInNyYy91bml0LmpzIiwic3JjL3V0aWwvbG9nLmpzIiwidGhpcmRwYXJ0eS9zbmFwLnN2Zy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDMWtCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxYUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzdqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiaWYgKHR5cGVvZiBPYmplY3QuY3JlYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gIC8vIGltcGxlbWVudGF0aW9uIGZyb20gc3RhbmRhcmQgbm9kZS5qcyAndXRpbCcgbW9kdWxlXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgICAgY29uc3RydWN0b3I6IHtcbiAgICAgICAgdmFsdWU6IGN0b3IsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG4gIH07XG59IGVsc2Uge1xuICAvLyBvbGQgc2Nob29sIHNoaW0gZm9yIG9sZCBicm93c2Vyc1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgdmFyIFRlbXBDdG9yID0gZnVuY3Rpb24gKCkge31cbiAgICBUZW1wQ3Rvci5wcm90b3R5cGUgPSBzdXBlckN0b3IucHJvdG90eXBlXG4gICAgY3Rvci5wcm90b3R5cGUgPSBuZXcgVGVtcEN0b3IoKVxuICAgIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvclxuICB9XG59XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgaWYgKCFkcmFpbmluZyB8fCAhY3VycmVudFF1ZXVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gc2V0VGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgc2V0VGltZW91dChkcmFpblF1ZXVlLCAwKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNCdWZmZXIoYXJnKSB7XG4gIHJldHVybiBhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCdcbiAgICAmJiB0eXBlb2YgYXJnLmNvcHkgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmZpbGwgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLnJlYWRVSW50OCA9PT0gJ2Z1bmN0aW9uJztcbn0iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKCFpc1N0cmluZyhmKSkge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChpbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzpcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIHJldHVybiAnW0NpcmN1bGFyXSc7XG4gICAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvciAodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKSB7XG4gICAgaWYgKGlzTnVsbCh4KSB8fCAhaXNPYmplY3QoeCkpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG5cblxuLy8gTWFyayB0aGF0IGEgbWV0aG9kIHNob3VsZCBub3QgYmUgdXNlZC5cbi8vIFJldHVybnMgYSBtb2RpZmllZCBmdW5jdGlvbiB3aGljaCB3YXJucyBvbmNlIGJ5IGRlZmF1bHQuXG4vLyBJZiAtLW5vLWRlcHJlY2F0aW9uIGlzIHNldCwgdGhlbiBpdCBpcyBhIG5vLW9wLlxuZXhwb3J0cy5kZXByZWNhdGUgPSBmdW5jdGlvbihmbiwgbXNnKSB7XG4gIC8vIEFsbG93IGZvciBkZXByZWNhdGluZyB0aGluZ3MgaW4gdGhlIHByb2Nlc3Mgb2Ygc3RhcnRpbmcgdXAuXG4gIGlmIChpc1VuZGVmaW5lZChnbG9iYWwucHJvY2VzcykpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZXhwb3J0cy5kZXByZWNhdGUoZm4sIG1zZykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHByb2Nlc3Mubm9EZXByZWNhdGlvbiA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIHZhciB3YXJuZWQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gZGVwcmVjYXRlZCgpIHtcbiAgICBpZiAoIXdhcm5lZCkge1xuICAgICAgaWYgKHByb2Nlc3MudGhyb3dEZXByZWNhdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy50cmFjZURlcHJlY2F0aW9uKSB7XG4gICAgICAgIGNvbnNvbGUudHJhY2UobXNnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICAgIH1cbiAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgcmV0dXJuIGRlcHJlY2F0ZWQ7XG59O1xuXG5cbnZhciBkZWJ1Z3MgPSB7fTtcbnZhciBkZWJ1Z0Vudmlyb247XG5leHBvcnRzLmRlYnVnbG9nID0gZnVuY3Rpb24oc2V0KSB7XG4gIGlmIChpc1VuZGVmaW5lZChkZWJ1Z0Vudmlyb24pKVxuICAgIGRlYnVnRW52aXJvbiA9IHByb2Nlc3MuZW52Lk5PREVfREVCVUcgfHwgJyc7XG4gIHNldCA9IHNldC50b1VwcGVyQ2FzZSgpO1xuICBpZiAoIWRlYnVnc1tzZXRdKSB7XG4gICAgaWYgKG5ldyBSZWdFeHAoJ1xcXFxiJyArIHNldCArICdcXFxcYicsICdpJykudGVzdChkZWJ1Z0Vudmlyb24pKSB7XG4gICAgICB2YXIgcGlkID0gcHJvY2Vzcy5waWQ7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXNnID0gZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignJXMgJWQ6ICVzJywgc2V0LCBwaWQsIG1zZyk7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge307XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWJ1Z3Nbc2V0XTtcbn07XG5cblxuLyoqXG4gKiBFY2hvcyB0aGUgdmFsdWUgb2YgYSB2YWx1ZS4gVHJ5cyB0byBwcmludCB0aGUgdmFsdWUgb3V0XG4gKiBpbiB0aGUgYmVzdCB3YXkgcG9zc2libGUgZ2l2ZW4gdGhlIGRpZmZlcmVudCB0eXBlcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcHJpbnQgb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QgdGhhdCBhbHRlcnMgdGhlIG91dHB1dC5cbiAqL1xuLyogbGVnYWN5OiBvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMqL1xuZnVuY3Rpb24gaW5zcGVjdChvYmosIG9wdHMpIHtcbiAgLy8gZGVmYXVsdCBvcHRpb25zXG4gIHZhciBjdHggPSB7XG4gICAgc2VlbjogW10sXG4gICAgc3R5bGl6ZTogc3R5bGl6ZU5vQ29sb3JcbiAgfTtcbiAgLy8gbGVnYWN5Li4uXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIGN0eC5kZXB0aCA9IGFyZ3VtZW50c1syXTtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gNCkgY3R4LmNvbG9ycyA9IGFyZ3VtZW50c1szXTtcbiAgaWYgKGlzQm9vbGVhbihvcHRzKSkge1xuICAgIC8vIGxlZ2FjeS4uLlxuICAgIGN0eC5zaG93SGlkZGVuID0gb3B0cztcbiAgfSBlbHNlIGlmIChvcHRzKSB7XG4gICAgLy8gZ290IGFuIFwib3B0aW9uc1wiIG9iamVjdFxuICAgIGV4cG9ydHMuX2V4dGVuZChjdHgsIG9wdHMpO1xuICB9XG4gIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5zaG93SGlkZGVuKSkgY3R4LnNob3dIaWRkZW4gPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5kZXB0aCkpIGN0eC5kZXB0aCA9IDI7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY29sb3JzKSkgY3R4LmNvbG9ycyA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmN1c3RvbUluc3BlY3QpKSBjdHguY3VzdG9tSW5zcGVjdCA9IHRydWU7XG4gIGlmIChjdHguY29sb3JzKSBjdHguc3R5bGl6ZSA9IHN0eWxpemVXaXRoQ29sb3I7XG4gIHJldHVybiBmb3JtYXRWYWx1ZShjdHgsIG9iaiwgY3R4LmRlcHRoKTtcbn1cbmV4cG9ydHMuaW5zcGVjdCA9IGluc3BlY3Q7XG5cblxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG5pbnNwZWN0LmNvbG9ycyA9IHtcbiAgJ2JvbGQnIDogWzEsIDIyXSxcbiAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICdibGFjaycgOiBbMzAsIDM5XSxcbiAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICdjeWFuJyA6IFszNiwgMzldLFxuICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAncmVkJyA6IFszMSwgMzldLFxuICAneWVsbG93JyA6IFszMywgMzldXG59O1xuXG4vLyBEb24ndCB1c2UgJ2JsdWUnIG5vdCB2aXNpYmxlIG9uIGNtZC5leGVcbmluc3BlY3Quc3R5bGVzID0ge1xuICAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgJ251bWJlcic6ICd5ZWxsb3cnLFxuICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAnbnVsbCc6ICdib2xkJyxcbiAgJ3N0cmluZyc6ICdncmVlbicsXG4gICdkYXRlJzogJ21hZ2VudGEnLFxuICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAncmVnZXhwJzogJ3JlZCdcbn07XG5cblxuZnVuY3Rpb24gc3R5bGl6ZVdpdGhDb2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICB2YXIgc3R5bGUgPSBpbnNwZWN0LnN0eWxlc1tzdHlsZVR5cGVdO1xuXG4gIGlmIChzdHlsZSkge1xuICAgIHJldHVybiAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVsxXSArICdtJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cblxuZnVuY3Rpb24gc3R5bGl6ZU5vQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgcmV0dXJuIHN0cjtcbn1cblxuXG5mdW5jdGlvbiBhcnJheVRvSGFzaChhcnJheSkge1xuICB2YXIgaGFzaCA9IHt9O1xuXG4gIGFycmF5LmZvckVhY2goZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBleHBvcnRzLmluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcywgY3R4KTtcbiAgICBpZiAoIWlzU3RyaW5nKHJldCkpIHtcbiAgICAgIHJldCA9IGZvcm1hdFZhbHVlKGN0eCwgcmV0LCByZWN1cnNlVGltZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgdmFyIHByaW1pdGl2ZSA9IGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKTtcbiAgaWYgKHByaW1pdGl2ZSkge1xuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4pIHtcbiAgICBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModmFsdWUpO1xuICB9XG5cbiAgLy8gSUUgZG9lc24ndCBtYWtlIGVycm9yIGZpZWxkcyBub24tZW51bWVyYWJsZVxuICAvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaWUvZHd3NTJzYnQodj12cy45NCkuYXNweFxuICBpZiAoaXNFcnJvcih2YWx1ZSlcbiAgICAgICYmIChrZXlzLmluZGV4T2YoJ21lc3NhZ2UnKSA+PSAwIHx8IGtleXMuaW5kZXhPZignZGVzY3JpcHRpb24nKSA+PSAwKSkge1xuICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkodmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cbiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodmFsdWUsIGtleSkgfHwgeyB2YWx1ZTogdmFsdWVba2V5XSB9O1xuICBpZiAoZGVzYy5nZXQpIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmICghaGFzT3duUHJvcGVydHkodmlzaWJsZUtleXMsIGtleSkpIHtcbiAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICB9XG4gIGlmICghc3RyKSB7XG4gICAgaWYgKGN0eC5zZWVuLmluZGV4T2YoZGVzYy52YWx1ZSkgPCAwKSB7XG4gICAgICBpZiAoaXNOdWxsKHJlY3Vyc2VUaW1lcykpIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgaWYgKGFycmF5KSB7XG4gICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSAnXFxuJyArIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNVbmRlZmluZWQobmFtZSkpIHtcbiAgICBpZiAoYXJyYXkgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG59XG5cblxuZnVuY3Rpb24gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpIHtcbiAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgdmFyIGxlbmd0aCA9IG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cblxuLy8gTk9URTogVGhlc2UgdHlwZSBjaGVja2luZyBmdW5jdGlvbnMgaW50ZW50aW9uYWxseSBkb24ndCB1c2UgYGluc3RhbmNlb2ZgXG4vLyBiZWNhdXNlIGl0IGlzIGZyYWdpbGUgYW5kIGNhbiBiZSBlYXNpbHkgZmFrZWQgd2l0aCBgT2JqZWN0LmNyZWF0ZSgpYC5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXIpO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuZXhwb3J0cy5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsID0gaXNOdWxsO1xuXG5mdW5jdGlvbiBpc051bGxPclVuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGxPclVuZGVmaW5lZCA9IGlzTnVsbE9yVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5pc051bWJlciA9IGlzTnVtYmVyO1xuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuZXhwb3J0cy5pc1N0cmluZyA9IGlzU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1N5bWJvbChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnO1xufVxuZXhwb3J0cy5pc1N5bWJvbCA9IGlzU3ltYm9sO1xuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuZXhwb3J0cy5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5leHBvcnRzLmlzUmVnRXhwID0gaXNSZWdFeHA7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cbmV4cG9ydHMuaXNEYXRlID0gaXNEYXRlO1xuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmXG4gICAgICAob2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXScgfHwgZSBpbnN0YW5jZW9mIEVycm9yKTtcbn1cbmV4cG9ydHMuaXNFcnJvciA9IGlzRXJyb3I7XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcblxuZnVuY3Rpb24gaXNQcmltaXRpdmUoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGwgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ251bWJlcicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3ltYm9sJyB8fCAgLy8gRVM2IHN5bWJvbFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3VuZGVmaW5lZCc7XG59XG5leHBvcnRzLmlzUHJpbWl0aXZlID0gaXNQcmltaXRpdmU7XG5cbmV4cG9ydHMuaXNCdWZmZXIgPSByZXF1aXJlKCcuL3N1cHBvcnQvaXNCdWZmZXInKTtcblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cblxuLy8gbG9nIGlzIGp1c3QgYSB0aGluIHdyYXBwZXIgdG8gY29uc29sZS5sb2cgdGhhdCBwcmVwZW5kcyBhIHRpbWVzdGFtcFxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJyVzIC0gJXMnLCB0aW1lc3RhbXAoKSwgZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKSk7XG59O1xuXG5cbi8qKlxuICogSW5oZXJpdCB0aGUgcHJvdG90eXBlIG1ldGhvZHMgZnJvbSBvbmUgY29uc3RydWN0b3IgaW50byBhbm90aGVyLlxuICpcbiAqIFRoZSBGdW5jdGlvbi5wcm90b3R5cGUuaW5oZXJpdHMgZnJvbSBsYW5nLmpzIHJld3JpdHRlbiBhcyBhIHN0YW5kYWxvbmVcbiAqIGZ1bmN0aW9uIChub3Qgb24gRnVuY3Rpb24ucHJvdG90eXBlKS4gTk9URTogSWYgdGhpcyBmaWxlIGlzIHRvIGJlIGxvYWRlZFxuICogZHVyaW5nIGJvb3RzdHJhcHBpbmcgdGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSByZXdyaXR0ZW4gdXNpbmcgc29tZSBuYXRpdmVcbiAqIGZ1bmN0aW9ucyBhcyBwcm90b3R5cGUgc2V0dXAgdXNpbmcgbm9ybWFsIEphdmFTY3JpcHQgZG9lcyBub3Qgd29yayBhc1xuICogZXhwZWN0ZWQgZHVyaW5nIGJvb3RzdHJhcHBpbmcgKHNlZSBtaXJyb3IuanMgaW4gcjExNDkwMykuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB3aGljaCBuZWVkcyB0byBpbmhlcml0IHRoZVxuICogICAgIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBpbmhlcml0IHByb3RvdHlwZSBmcm9tLlxuICovXG5leHBvcnRzLmluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcblxuZXhwb3J0cy5fZXh0ZW5kID0gZnVuY3Rpb24ob3JpZ2luLCBhZGQpIHtcbiAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWRkIGlzbid0IGFuIG9iamVjdFxuICBpZiAoIWFkZCB8fCAhaXNPYmplY3QoYWRkKSkgcmV0dXJuIG9yaWdpbjtcblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn07XG5cbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG4iLCIvLyBDb3B5cmlnaHQgKGMpIDIwMTMgQWRvYmUgU3lzdGVtcyBJbmNvcnBvcmF0ZWQuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBcbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vIFxuLy8gaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vLyBcbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vLyDilIzilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilJAgXFxcXFxuLy8g4pSCIEV2ZSAwLjUuMCAtIEphdmFTY3JpcHQgRXZlbnRzIExpYnJhcnkgICAgICAgICAgICAgICAgICAgICAg4pSCIFxcXFxcbi8vIOKUnOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUpCBcXFxcXG4vLyDilIIgQXV0aG9yIERtaXRyeSBCYXJhbm92c2tpeSAoaHR0cDovL2RtaXRyeS5iYXJhbm92c2tpeS5jb20vKSDilIIgXFxcXFxuLy8g4pSU4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSYIFxcXFxcblxuKGZ1bmN0aW9uIChnbG9iKSB7XG4gICAgdmFyIHZlcnNpb24gPSBcIjAuNS4wXCIsXG4gICAgICAgIGhhcyA9IFwiaGFzT3duUHJvcGVydHlcIixcbiAgICAgICAgc2VwYXJhdG9yID0gL1tcXC5cXC9dLyxcbiAgICAgICAgY29tYXNlcGFyYXRvciA9IC9cXHMqLFxccyovLFxuICAgICAgICB3aWxkY2FyZCA9IFwiKlwiLFxuICAgICAgICBmdW4gPSBmdW5jdGlvbiAoKSB7fSxcbiAgICAgICAgbnVtc29ydCA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gYSAtIGI7XG4gICAgICAgIH0sXG4gICAgICAgIGN1cnJlbnRfZXZlbnQsXG4gICAgICAgIHN0b3AsXG4gICAgICAgIGV2ZW50cyA9IHtuOiB7fX0sXG4gICAgICAgIGZpcnN0RGVmaW5lZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IHRoaXMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpc1tpXSAhPSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzW2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgbGFzdERlZmluZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgaSA9IHRoaXMubGVuZ3RoO1xuICAgICAgICAgICAgd2hpbGUgKC0taSkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpc1tpXSAhPSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzW2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgb2JqdG9zID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyxcbiAgICAgICAgU3RyID0gU3RyaW5nLFxuICAgICAgICBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAoYXIpIHtcbiAgICAgICAgICAgIHJldHVybiBhciBpbnN0YW5jZW9mIEFycmF5IHx8IG9ianRvcy5jYWxsKGFyKSA9PSBcIltvYmplY3QgQXJyYXldXCI7XG4gICAgICAgIH07XG4gICAgLypcXFxuICAgICAqIGV2ZVxuICAgICBbIG1ldGhvZCBdXG5cbiAgICAgKiBGaXJlcyBldmVudCB3aXRoIGdpdmVuIGBuYW1lYCwgZ2l2ZW4gc2NvcGUgYW5kIG90aGVyIHBhcmFtZXRlcnMuXG5cbiAgICAgPiBBcmd1bWVudHNcblxuICAgICAtIG5hbWUgKHN0cmluZykgbmFtZSBvZiB0aGUgKmV2ZW50KiwgZG90IChgLmApIG9yIHNsYXNoIChgL2ApIHNlcGFyYXRlZFxuICAgICAtIHNjb3BlIChvYmplY3QpIGNvbnRleHQgZm9yIHRoZSBldmVudCBoYW5kbGVyc1xuICAgICAtIHZhcmFyZ3MgKC4uLikgdGhlIHJlc3Qgb2YgYXJndW1lbnRzIHdpbGwgYmUgc2VudCB0byBldmVudCBoYW5kbGVyc1xuXG4gICAgID0gKG9iamVjdCkgYXJyYXkgb2YgcmV0dXJuZWQgdmFsdWVzIGZyb20gdGhlIGxpc3RlbmVycy4gQXJyYXkgaGFzIHR3byBtZXRob2RzIGAuZmlyc3REZWZpbmVkKClgIGFuZCBgLmxhc3REZWZpbmVkKClgIHRvIGdldCBmaXJzdCBvciBsYXN0IG5vdCBgdW5kZWZpbmVkYCB2YWx1ZS5cbiAgICBcXCovXG4gICAgICAgIGV2ZSA9IGZ1bmN0aW9uIChuYW1lLCBzY29wZSkge1xuICAgICAgICAgICAgdmFyIGUgPSBldmVudHMsXG4gICAgICAgICAgICAgICAgb2xkc3RvcCA9IHN0b3AsXG4gICAgICAgICAgICAgICAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMiksXG4gICAgICAgICAgICAgICAgbGlzdGVuZXJzID0gZXZlLmxpc3RlbmVycyhuYW1lKSxcbiAgICAgICAgICAgICAgICB6ID0gMCxcbiAgICAgICAgICAgICAgICBmID0gZmFsc2UsXG4gICAgICAgICAgICAgICAgbCxcbiAgICAgICAgICAgICAgICBpbmRleGVkID0gW10sXG4gICAgICAgICAgICAgICAgcXVldWUgPSB7fSxcbiAgICAgICAgICAgICAgICBvdXQgPSBbXSxcbiAgICAgICAgICAgICAgICBjZSA9IGN1cnJlbnRfZXZlbnQsXG4gICAgICAgICAgICAgICAgZXJyb3JzID0gW107XG4gICAgICAgICAgICBvdXQuZmlyc3REZWZpbmVkID0gZmlyc3REZWZpbmVkO1xuICAgICAgICAgICAgb3V0Lmxhc3REZWZpbmVkID0gbGFzdERlZmluZWQ7XG4gICAgICAgICAgICBjdXJyZW50X2V2ZW50ID0gbmFtZTtcbiAgICAgICAgICAgIHN0b3AgPSAwO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gbGlzdGVuZXJzLmxlbmd0aDsgaSA8IGlpOyBpKyspIGlmIChcInpJbmRleFwiIGluIGxpc3RlbmVyc1tpXSkge1xuICAgICAgICAgICAgICAgIGluZGV4ZWQucHVzaChsaXN0ZW5lcnNbaV0uekluZGV4KTtcbiAgICAgICAgICAgICAgICBpZiAobGlzdGVuZXJzW2ldLnpJbmRleCA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcXVldWVbbGlzdGVuZXJzW2ldLnpJbmRleF0gPSBsaXN0ZW5lcnNbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaW5kZXhlZC5zb3J0KG51bXNvcnQpO1xuICAgICAgICAgICAgd2hpbGUgKGluZGV4ZWRbel0gPCAwKSB7XG4gICAgICAgICAgICAgICAgbCA9IHF1ZXVlW2luZGV4ZWRbeisrXV07XG4gICAgICAgICAgICAgICAgb3V0LnB1c2gobC5hcHBseShzY29wZSwgYXJncykpO1xuICAgICAgICAgICAgICAgIGlmIChzdG9wKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0b3AgPSBvbGRzdG9wO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3V0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgbCA9IGxpc3RlbmVyc1tpXTtcbiAgICAgICAgICAgICAgICBpZiAoXCJ6SW5kZXhcIiBpbiBsKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsLnpJbmRleCA9PSBpbmRleGVkW3pdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXQucHVzaChsLmFwcGx5KHNjb3BlLCBhcmdzKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3RvcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHorKztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsID0gcXVldWVbaW5kZXhlZFt6XV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbCAmJiBvdXQucHVzaChsLmFwcGx5KHNjb3BlLCBhcmdzKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0b3ApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSB3aGlsZSAobClcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXVlW2wuekluZGV4XSA9IGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBvdXQucHVzaChsLmFwcGx5KHNjb3BlLCBhcmdzKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdG9wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN0b3AgPSBvbGRzdG9wO1xuICAgICAgICAgICAgY3VycmVudF9ldmVudCA9IGNlO1xuICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gVW5kb2N1bWVudGVkLiBEZWJ1ZyBvbmx5LlxuICAgICAgICBldmUuX2V2ZW50cyA9IGV2ZW50cztcbiAgICAvKlxcXG4gICAgICogZXZlLmxpc3RlbmVyc1xuICAgICBbIG1ldGhvZCBdXG5cbiAgICAgKiBJbnRlcm5hbCBtZXRob2Qgd2hpY2ggZ2l2ZXMgeW91IGFycmF5IG9mIGFsbCBldmVudCBoYW5kbGVycyB0aGF0IHdpbGwgYmUgdHJpZ2dlcmVkIGJ5IHRoZSBnaXZlbiBgbmFtZWAuXG5cbiAgICAgPiBBcmd1bWVudHNcblxuICAgICAtIG5hbWUgKHN0cmluZykgbmFtZSBvZiB0aGUgZXZlbnQsIGRvdCAoYC5gKSBvciBzbGFzaCAoYC9gKSBzZXBhcmF0ZWRcblxuICAgICA9IChhcnJheSkgYXJyYXkgb2YgZXZlbnQgaGFuZGxlcnNcbiAgICBcXCovXG4gICAgZXZlLmxpc3RlbmVycyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIHZhciBuYW1lcyA9IGlzQXJyYXkobmFtZSkgPyBuYW1lIDogbmFtZS5zcGxpdChzZXBhcmF0b3IpLFxuICAgICAgICAgICAgZSA9IGV2ZW50cyxcbiAgICAgICAgICAgIGl0ZW0sXG4gICAgICAgICAgICBpdGVtcyxcbiAgICAgICAgICAgIGssXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgaWksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgamosXG4gICAgICAgICAgICBuZXMsXG4gICAgICAgICAgICBlcyA9IFtlXSxcbiAgICAgICAgICAgIG91dCA9IFtdO1xuICAgICAgICBmb3IgKGkgPSAwLCBpaSA9IG5hbWVzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIG5lcyA9IFtdO1xuICAgICAgICAgICAgZm9yIChqID0gMCwgamogPSBlcy5sZW5ndGg7IGogPCBqajsgaisrKSB7XG4gICAgICAgICAgICAgICAgZSA9IGVzW2pdLm47XG4gICAgICAgICAgICAgICAgaXRlbXMgPSBbZVtuYW1lc1tpXV0sIGVbd2lsZGNhcmRdXTtcbiAgICAgICAgICAgICAgICBrID0gMjtcbiAgICAgICAgICAgICAgICB3aGlsZSAoay0tKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0gPSBpdGVtc1trXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5lcy5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0ID0gb3V0LmNvbmNhdChpdGVtLmYgfHwgW10pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZXMgPSBuZXM7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBldmUuc2VwYXJhdG9yXG4gICAgIFsgbWV0aG9kIF1cblxuICAgICAqIElmIGZvciBzb21lIHJlYXNvbnMgeW91IGRvbuKAmXQgbGlrZSBkZWZhdWx0IHNlcGFyYXRvcnMgKGAuYCBvciBgL2ApIHlvdSBjYW4gc3BlY2lmeSB5b3Vyc1xuICAgICAqIGhlcmUuIEJlIGF3YXJlIHRoYXQgaWYgeW91IHBhc3MgYSBzdHJpbmcgbG9uZ2VyIHRoYW4gb25lIGNoYXJhY3RlciBpdCB3aWxsIGJlIHRyZWF0ZWQgYXNcbiAgICAgKiBhIGxpc3Qgb2YgY2hhcmFjdGVycy5cblxuICAgICAtIHNlcGFyYXRvciAoc3RyaW5nKSBuZXcgc2VwYXJhdG9yLiBFbXB0eSBzdHJpbmcgcmVzZXRzIHRvIGRlZmF1bHQ6IGAuYCBvciBgL2AuXG4gICAgXFwqL1xuICAgIGV2ZS5zZXBhcmF0b3IgPSBmdW5jdGlvbiAoc2VwKSB7XG4gICAgICAgIGlmIChzZXApIHtcbiAgICAgICAgICAgIHNlcCA9IFN0cihzZXApLnJlcGxhY2UoLyg/PVtcXC5cXF5cXF1cXFtcXC1dKS9nLCBcIlxcXFxcIik7XG4gICAgICAgICAgICBzZXAgPSBcIltcIiArIHNlcCArIFwiXVwiO1xuICAgICAgICAgICAgc2VwYXJhdG9yID0gbmV3IFJlZ0V4cChzZXApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VwYXJhdG9yID0gL1tcXC5cXC9dLztcbiAgICAgICAgfVxuICAgIH07XG4gICAgLypcXFxuICAgICAqIGV2ZS5vblxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQmluZHMgZ2l2ZW4gZXZlbnQgaGFuZGxlciB3aXRoIGEgZ2l2ZW4gbmFtZS4gWW91IGNhbiB1c2Ugd2lsZGNhcmRzIOKAnGAqYOKAnSBmb3IgdGhlIG5hbWVzOlxuICAgICB8IGV2ZS5vbihcIioudW5kZXIuKlwiLCBmKTtcbiAgICAgfCBldmUoXCJtb3VzZS51bmRlci5mbG9vclwiKTsgLy8gdHJpZ2dlcnMgZlxuICAgICAqIFVzZSBAZXZlIHRvIHRyaWdnZXIgdGhlIGxpc3RlbmVyLlxuICAgICAqKlxuICAgICAtIG5hbWUgKHN0cmluZykgbmFtZSBvZiB0aGUgZXZlbnQsIGRvdCAoYC5gKSBvciBzbGFzaCAoYC9gKSBzZXBhcmF0ZWQsIHdpdGggb3B0aW9uYWwgd2lsZGNhcmRzXG4gICAgIC0gZiAoZnVuY3Rpb24pIGV2ZW50IGhhbmRsZXIgZnVuY3Rpb25cbiAgICAgKipcbiAgICAgLSBuYW1lIChhcnJheSkgaWYgeW91IGRvbuKAmXQgd2FudCB0byB1c2Ugc2VwYXJhdG9ycywgeW91IGNhbiB1c2UgYXJyYXkgb2Ygc3RyaW5nc1xuICAgICAtIGYgKGZ1bmN0aW9uKSBldmVudCBoYW5kbGVyIGZ1bmN0aW9uXG4gICAgICoqXG4gICAgID0gKGZ1bmN0aW9uKSByZXR1cm5lZCBmdW5jdGlvbiBhY2NlcHRzIGEgc2luZ2xlIG51bWVyaWMgcGFyYW1ldGVyIHRoYXQgcmVwcmVzZW50cyB6LWluZGV4IG9mIHRoZSBoYW5kbGVyLiBJdCBpcyBhbiBvcHRpb25hbCBmZWF0dXJlIGFuZCBvbmx5IHVzZWQgd2hlbiB5b3UgbmVlZCB0byBlbnN1cmUgdGhhdCBzb21lIHN1YnNldCBvZiBoYW5kbGVycyB3aWxsIGJlIGludm9rZWQgaW4gYSBnaXZlbiBvcmRlciwgZGVzcGl0ZSBvZiB0aGUgb3JkZXIgb2YgYXNzaWdubWVudC4gXG4gICAgID4gRXhhbXBsZTpcbiAgICAgfCBldmUub24oXCJtb3VzZVwiLCBlYXRJdCkoMik7XG4gICAgIHwgZXZlLm9uKFwibW91c2VcIiwgc2NyZWFtKTtcbiAgICAgfCBldmUub24oXCJtb3VzZVwiLCBjYXRjaEl0KSgxKTtcbiAgICAgKiBUaGlzIHdpbGwgZW5zdXJlIHRoYXQgYGNhdGNoSXRgIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIGJlZm9yZSBgZWF0SXRgLlxuICAgICAqXG4gICAgICogSWYgeW91IHdhbnQgdG8gcHV0IHlvdXIgaGFuZGxlciBiZWZvcmUgbm9uLWluZGV4ZWQgaGFuZGxlcnMsIHNwZWNpZnkgYSBuZWdhdGl2ZSB2YWx1ZS5cbiAgICAgKiBOb3RlOiBJIGFzc3VtZSBtb3N0IG9mIHRoZSB0aW1lIHlvdSBkb27igJl0IG5lZWQgdG8gd29ycnkgYWJvdXQgei1pbmRleCwgYnV0IGl04oCZcyBuaWNlIHRvIGhhdmUgdGhpcyBmZWF0dXJlIOKAnGp1c3QgaW4gY2FzZeKAnS5cbiAgICBcXCovXG4gICAgZXZlLm9uID0gZnVuY3Rpb24gKG5hbWUsIGYpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBmICE9IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHt9O1xuICAgICAgICB9XG4gICAgICAgIHZhciBuYW1lcyA9IGlzQXJyYXkobmFtZSkgPyAoaXNBcnJheShuYW1lWzBdKSA/IG5hbWUgOiBbbmFtZV0pIDogU3RyKG5hbWUpLnNwbGl0KGNvbWFzZXBhcmF0b3IpO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBuYW1lcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAoZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgbmFtZXMgPSBpc0FycmF5KG5hbWUpID8gbmFtZSA6IFN0cihuYW1lKS5zcGxpdChzZXBhcmF0b3IpLFxuICAgICAgICAgICAgICAgICAgICBlID0gZXZlbnRzLFxuICAgICAgICAgICAgICAgICAgICBleGlzdDtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBuYW1lcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGUgPSBlLm47XG4gICAgICAgICAgICAgICAgICAgIGUgPSBlLmhhc093blByb3BlcnR5KG5hbWVzW2ldKSAmJiBlW25hbWVzW2ldXSB8fCAoZVtuYW1lc1tpXV0gPSB7bjoge319KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZS5mID0gZS5mIHx8IFtdO1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDAsIGlpID0gZS5mLmxlbmd0aDsgaSA8IGlpOyBpKyspIGlmIChlLmZbaV0gPT0gZikge1xuICAgICAgICAgICAgICAgICAgICBleGlzdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAhZXhpc3QgJiYgZS5mLnB1c2goZik7XG4gICAgICAgICAgICB9KG5hbWVzW2ldKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICh6SW5kZXgpIHtcbiAgICAgICAgICAgIGlmICgrekluZGV4ID09ICt6SW5kZXgpIHtcbiAgICAgICAgICAgICAgICBmLnpJbmRleCA9ICt6SW5kZXg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogZXZlLmZcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybnMgZnVuY3Rpb24gdGhhdCB3aWxsIGZpcmUgZ2l2ZW4gZXZlbnQgd2l0aCBvcHRpb25hbCBhcmd1bWVudHMuXG4gICAgICogQXJndW1lbnRzIHRoYXQgd2lsbCBiZSBwYXNzZWQgdG8gdGhlIHJlc3VsdCBmdW5jdGlvbiB3aWxsIGJlIGFsc29cbiAgICAgKiBjb25jYXRlZCB0byB0aGUgbGlzdCBvZiBmaW5hbCBhcmd1bWVudHMuXG4gICAgIHwgZWwub25jbGljayA9IGV2ZS5mKFwiY2xpY2tcIiwgMSwgMik7XG4gICAgIHwgZXZlLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKGEsIGIsIGMpIHtcbiAgICAgfCAgICAgY29uc29sZS5sb2coYSwgYiwgYyk7IC8vIDEsIDIsIFtldmVudCBvYmplY3RdXG4gICAgIHwgfSk7XG4gICAgID4gQXJndW1lbnRzXG4gICAgIC0gZXZlbnQgKHN0cmluZykgZXZlbnQgbmFtZVxuICAgICAtIHZhcmFyZ3MgKOKApikgYW5kIGFueSBvdGhlciBhcmd1bWVudHNcbiAgICAgPSAoZnVuY3Rpb24pIHBvc3NpYmxlIGV2ZW50IGhhbmRsZXIgZnVuY3Rpb25cbiAgICBcXCovXG4gICAgZXZlLmYgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIGF0dHJzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZXZlLmFwcGx5KG51bGwsIFtldmVudCwgbnVsbF0uY29uY2F0KGF0dHJzKS5jb25jYXQoW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDApKSk7XG4gICAgICAgIH07XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogZXZlLnN0b3BcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIElzIHVzZWQgaW5zaWRlIGFuIGV2ZW50IGhhbmRsZXIgdG8gc3RvcCB0aGUgZXZlbnQsIHByZXZlbnRpbmcgYW55IHN1YnNlcXVlbnQgbGlzdGVuZXJzIGZyb20gZmlyaW5nLlxuICAgIFxcKi9cbiAgICBldmUuc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc3RvcCA9IDE7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogZXZlLm50XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBDb3VsZCBiZSB1c2VkIGluc2lkZSBldmVudCBoYW5kbGVyIHRvIGZpZ3VyZSBvdXQgYWN0dWFsIG5hbWUgb2YgdGhlIGV2ZW50LlxuICAgICAqKlxuICAgICA+IEFyZ3VtZW50c1xuICAgICAqKlxuICAgICAtIHN1Ym5hbWUgKHN0cmluZykgI29wdGlvbmFsIHN1Ym5hbWUgb2YgdGhlIGV2ZW50XG4gICAgICoqXG4gICAgID0gKHN0cmluZykgbmFtZSBvZiB0aGUgZXZlbnQsIGlmIGBzdWJuYW1lYCBpcyBub3Qgc3BlY2lmaWVkXG4gICAgICogb3JcbiAgICAgPSAoYm9vbGVhbikgYHRydWVgLCBpZiBjdXJyZW50IGV2ZW504oCZcyBuYW1lIGNvbnRhaW5zIGBzdWJuYW1lYFxuICAgIFxcKi9cbiAgICBldmUubnQgPSBmdW5jdGlvbiAoc3VibmFtZSkge1xuICAgICAgICB2YXIgY3VyID0gaXNBcnJheShjdXJyZW50X2V2ZW50KSA/IGN1cnJlbnRfZXZlbnQuam9pbihcIi5cIikgOiBjdXJyZW50X2V2ZW50O1xuICAgICAgICBpZiAoc3VibmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZWdFeHAoXCIoPzpcXFxcLnxcXFxcL3xeKVwiICsgc3VibmFtZSArIFwiKD86XFxcXC58XFxcXC98JClcIikudGVzdChjdXIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjdXI7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogZXZlLm50c1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQ291bGQgYmUgdXNlZCBpbnNpZGUgZXZlbnQgaGFuZGxlciB0byBmaWd1cmUgb3V0IGFjdHVhbCBuYW1lIG9mIHRoZSBldmVudC5cbiAgICAgKipcbiAgICAgKipcbiAgICAgPSAoYXJyYXkpIG5hbWVzIG9mIHRoZSBldmVudFxuICAgIFxcKi9cbiAgICBldmUubnRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gaXNBcnJheShjdXJyZW50X2V2ZW50KSA/IGN1cnJlbnRfZXZlbnQgOiBjdXJyZW50X2V2ZW50LnNwbGl0KHNlcGFyYXRvcik7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogZXZlLm9mZlxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyBnaXZlbiBmdW5jdGlvbiBmcm9tIHRoZSBsaXN0IG9mIGV2ZW50IGxpc3RlbmVycyBhc3NpZ25lZCB0byBnaXZlbiBuYW1lLlxuICAgICAqIElmIG5vIGFyZ3VtZW50cyBzcGVjaWZpZWQgYWxsIHRoZSBldmVudHMgd2lsbCBiZSBjbGVhcmVkLlxuICAgICAqKlxuICAgICA+IEFyZ3VtZW50c1xuICAgICAqKlxuICAgICAtIG5hbWUgKHN0cmluZykgbmFtZSBvZiB0aGUgZXZlbnQsIGRvdCAoYC5gKSBvciBzbGFzaCAoYC9gKSBzZXBhcmF0ZWQsIHdpdGggb3B0aW9uYWwgd2lsZGNhcmRzXG4gICAgIC0gZiAoZnVuY3Rpb24pIGV2ZW50IGhhbmRsZXIgZnVuY3Rpb25cbiAgICBcXCovXG4gICAgLypcXFxuICAgICAqIGV2ZS51bmJpbmRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFNlZSBAZXZlLm9mZlxuICAgIFxcKi9cbiAgICBldmUub2ZmID0gZXZlLnVuYmluZCA9IGZ1bmN0aW9uIChuYW1lLCBmKSB7XG4gICAgICAgIGlmICghbmFtZSkge1xuICAgICAgICAgICAgZXZlLl9ldmVudHMgPSBldmVudHMgPSB7bjoge319O1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBuYW1lcyA9IGlzQXJyYXkobmFtZSkgPyAoaXNBcnJheShuYW1lWzBdKSA/IG5hbWUgOiBbbmFtZV0pIDogU3RyKG5hbWUpLnNwbGl0KGNvbWFzZXBhcmF0b3IpO1xuICAgICAgICBpZiAobmFtZXMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gbmFtZXMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgIGV2ZS5vZmYobmFtZXNbaV0sIGYpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIG5hbWVzID0gaXNBcnJheShuYW1lKSA/IG5hbWUgOiBTdHIobmFtZSkuc3BsaXQoc2VwYXJhdG9yKTtcbiAgICAgICAgdmFyIGUsXG4gICAgICAgICAgICBrZXksXG4gICAgICAgICAgICBzcGxpY2UsXG4gICAgICAgICAgICBpLCBpaSwgaiwgamosXG4gICAgICAgICAgICBjdXIgPSBbZXZlbnRzXTtcbiAgICAgICAgZm9yIChpID0gMCwgaWkgPSBuYW1lcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgY3VyLmxlbmd0aDsgaiArPSBzcGxpY2UubGVuZ3RoIC0gMikge1xuICAgICAgICAgICAgICAgIHNwbGljZSA9IFtqLCAxXTtcbiAgICAgICAgICAgICAgICBlID0gY3VyW2pdLm47XG4gICAgICAgICAgICAgICAgaWYgKG5hbWVzW2ldICE9IHdpbGRjYXJkKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlW25hbWVzW2ldXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3BsaWNlLnB1c2goZVtuYW1lc1tpXV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gZSkgaWYgKGVbaGFzXShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzcGxpY2UucHVzaChlW2tleV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGN1ci5zcGxpY2UuYXBwbHkoY3VyLCBzcGxpY2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAoaSA9IDAsIGlpID0gY3VyLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIGUgPSBjdXJbaV07XG4gICAgICAgICAgICB3aGlsZSAoZS5uKSB7XG4gICAgICAgICAgICAgICAgaWYgKGYpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGUuZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChqID0gMCwgamogPSBlLmYubGVuZ3RoOyBqIDwgamo7IGorKykgaWYgKGUuZltqXSA9PSBmKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5mLnNwbGljZShqLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICFlLmYubGVuZ3RoICYmIGRlbGV0ZSBlLmY7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gZS5uKSBpZiAoZS5uW2hhc10oa2V5KSAmJiBlLm5ba2V5XS5mKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZnVuY3MgPSBlLm5ba2V5XS5mO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChqID0gMCwgamogPSBmdW5jcy5sZW5ndGg7IGogPCBqajsgaisrKSBpZiAoZnVuY3Nbal0gPT0gZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmNzLnNwbGljZShqLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICFmdW5jcy5sZW5ndGggJiYgZGVsZXRlIGUubltrZXldLmY7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgZS5mO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGtleSBpbiBlLm4pIGlmIChlLm5baGFzXShrZXkpICYmIGUubltrZXldLmYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBlLm5ba2V5XS5mO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGUgPSBlLm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBldmUub25jZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQmluZHMgZ2l2ZW4gZXZlbnQgaGFuZGxlciB3aXRoIGEgZ2l2ZW4gbmFtZSB0byBvbmx5IHJ1biBvbmNlIHRoZW4gdW5iaW5kIGl0c2VsZi5cbiAgICAgfCBldmUub25jZShcImxvZ2luXCIsIGYpO1xuICAgICB8IGV2ZShcImxvZ2luXCIpOyAvLyB0cmlnZ2VycyBmXG4gICAgIHwgZXZlKFwibG9naW5cIik7IC8vIG5vIGxpc3RlbmVyc1xuICAgICAqIFVzZSBAZXZlIHRvIHRyaWdnZXIgdGhlIGxpc3RlbmVyLlxuICAgICAqKlxuICAgICA+IEFyZ3VtZW50c1xuICAgICAqKlxuICAgICAtIG5hbWUgKHN0cmluZykgbmFtZSBvZiB0aGUgZXZlbnQsIGRvdCAoYC5gKSBvciBzbGFzaCAoYC9gKSBzZXBhcmF0ZWQsIHdpdGggb3B0aW9uYWwgd2lsZGNhcmRzXG4gICAgIC0gZiAoZnVuY3Rpb24pIGV2ZW50IGhhbmRsZXIgZnVuY3Rpb25cbiAgICAgKipcbiAgICAgPSAoZnVuY3Rpb24pIHNhbWUgcmV0dXJuIGZ1bmN0aW9uIGFzIEBldmUub25cbiAgICBcXCovXG4gICAgZXZlLm9uY2UgPSBmdW5jdGlvbiAobmFtZSwgZikge1xuICAgICAgICB2YXIgZjIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBldmUub2ZmKG5hbWUsIGYyKTtcbiAgICAgICAgICAgIHJldHVybiBmLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBldmUub24obmFtZSwgZjIpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIGV2ZS52ZXJzaW9uXG4gICAgIFsgcHJvcGVydHkgKHN0cmluZykgXVxuICAgICAqKlxuICAgICAqIEN1cnJlbnQgdmVyc2lvbiBvZiB0aGUgbGlicmFyeS5cbiAgICBcXCovXG4gICAgZXZlLnZlcnNpb24gPSB2ZXJzaW9uO1xuICAgIGV2ZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFwiWW91IGFyZSBydW5uaW5nIEV2ZSBcIiArIHZlcnNpb247XG4gICAgfTtcbiAgICAodHlwZW9mIG1vZHVsZSAhPSBcInVuZGVmaW5lZFwiICYmIG1vZHVsZS5leHBvcnRzKSA/IChtb2R1bGUuZXhwb3J0cyA9IGV2ZSkgOiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQgPyAoZGVmaW5lKFwiZXZlXCIsIFtdLCBmdW5jdGlvbigpIHsgcmV0dXJuIGV2ZTsgfSkpIDogKGdsb2IuZXZlID0gZXZlKSk7XG59KSh0aGlzKTtcbiIsIi8qIVxuICogRXZlbnRFbWl0dGVyMlxuICogaHR0cHM6Ly9naXRodWIuY29tL2hpajFueC9FdmVudEVtaXR0ZXIyXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDEzIGhpajFueFxuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuICovXG47IWZ1bmN0aW9uKHVuZGVmaW5lZCkge1xuXG4gIHZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSA/IEFycmF5LmlzQXJyYXkgOiBmdW5jdGlvbiBfaXNBcnJheShvYmopIHtcbiAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikgPT09IFwiW29iamVjdCBBcnJheV1cIjtcbiAgfTtcbiAgdmFyIGRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcblxuICBmdW5jdGlvbiBpbml0KCkge1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIGlmICh0aGlzLl9jb25mKSB7XG4gICAgICBjb25maWd1cmUuY2FsbCh0aGlzLCB0aGlzLl9jb25mKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBjb25maWd1cmUoY29uZikge1xuICAgIGlmIChjb25mKSB7XG5cbiAgICAgIHRoaXMuX2NvbmYgPSBjb25mO1xuXG4gICAgICBjb25mLmRlbGltaXRlciAmJiAodGhpcy5kZWxpbWl0ZXIgPSBjb25mLmRlbGltaXRlcik7XG4gICAgICBjb25mLm1heExpc3RlbmVycyAmJiAodGhpcy5fZXZlbnRzLm1heExpc3RlbmVycyA9IGNvbmYubWF4TGlzdGVuZXJzKTtcbiAgICAgIGNvbmYud2lsZGNhcmQgJiYgKHRoaXMud2lsZGNhcmQgPSBjb25mLndpbGRjYXJkKTtcbiAgICAgIGNvbmYubmV3TGlzdGVuZXIgJiYgKHRoaXMubmV3TGlzdGVuZXIgPSBjb25mLm5ld0xpc3RlbmVyKTtcblxuICAgICAgaWYgKHRoaXMud2lsZGNhcmQpIHtcbiAgICAgICAgdGhpcy5saXN0ZW5lclRyZWUgPSB7fTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBFdmVudEVtaXR0ZXIoY29uZikge1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIHRoaXMubmV3TGlzdGVuZXIgPSBmYWxzZTtcbiAgICBjb25maWd1cmUuY2FsbCh0aGlzLCBjb25mKTtcbiAgfVxuXG4gIC8vXG4gIC8vIEF0dGVudGlvbiwgZnVuY3Rpb24gcmV0dXJuIHR5cGUgbm93IGlzIGFycmF5LCBhbHdheXMgIVxuICAvLyBJdCBoYXMgemVybyBlbGVtZW50cyBpZiBubyBhbnkgbWF0Y2hlcyBmb3VuZCBhbmQgb25lIG9yIG1vcmVcbiAgLy8gZWxlbWVudHMgKGxlYWZzKSBpZiB0aGVyZSBhcmUgbWF0Y2hlc1xuICAvL1xuICBmdW5jdGlvbiBzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHRyZWUsIGkpIHtcbiAgICBpZiAoIXRyZWUpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgdmFyIGxpc3RlbmVycz1bXSwgbGVhZiwgbGVuLCBicmFuY2gsIHhUcmVlLCB4eFRyZWUsIGlzb2xhdGVkQnJhbmNoLCBlbmRSZWFjaGVkLFxuICAgICAgICB0eXBlTGVuZ3RoID0gdHlwZS5sZW5ndGgsIGN1cnJlbnRUeXBlID0gdHlwZVtpXSwgbmV4dFR5cGUgPSB0eXBlW2krMV07XG4gICAgaWYgKGkgPT09IHR5cGVMZW5ndGggJiYgdHJlZS5fbGlzdGVuZXJzKSB7XG4gICAgICAvL1xuICAgICAgLy8gSWYgYXQgdGhlIGVuZCBvZiB0aGUgZXZlbnQocykgbGlzdCBhbmQgdGhlIHRyZWUgaGFzIGxpc3RlbmVyc1xuICAgICAgLy8gaW52b2tlIHRob3NlIGxpc3RlbmVycy5cbiAgICAgIC8vXG4gICAgICBpZiAodHlwZW9mIHRyZWUuX2xpc3RlbmVycyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBoYW5kbGVycyAmJiBoYW5kbGVycy5wdXNoKHRyZWUuX2xpc3RlbmVycyk7XG4gICAgICAgIHJldHVybiBbdHJlZV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKGxlYWYgPSAwLCBsZW4gPSB0cmVlLl9saXN0ZW5lcnMubGVuZ3RoOyBsZWFmIDwgbGVuOyBsZWFmKyspIHtcbiAgICAgICAgICBoYW5kbGVycyAmJiBoYW5kbGVycy5wdXNoKHRyZWUuX2xpc3RlbmVyc1tsZWFmXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFt0cmVlXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoKGN1cnJlbnRUeXBlID09PSAnKicgfHwgY3VycmVudFR5cGUgPT09ICcqKicpIHx8IHRyZWVbY3VycmVudFR5cGVdKSB7XG4gICAgICAvL1xuICAgICAgLy8gSWYgdGhlIGV2ZW50IGVtaXR0ZWQgaXMgJyonIGF0IHRoaXMgcGFydFxuICAgICAgLy8gb3IgdGhlcmUgaXMgYSBjb25jcmV0ZSBtYXRjaCBhdCB0aGlzIHBhdGNoXG4gICAgICAvL1xuICAgICAgaWYgKGN1cnJlbnRUeXBlID09PSAnKicpIHtcbiAgICAgICAgZm9yIChicmFuY2ggaW4gdHJlZSkge1xuICAgICAgICAgIGlmIChicmFuY2ggIT09ICdfbGlzdGVuZXJzJyAmJiB0cmVlLmhhc093blByb3BlcnR5KGJyYW5jaCkpIHtcbiAgICAgICAgICAgIGxpc3RlbmVycyA9IGxpc3RlbmVycy5jb25jYXQoc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB0cmVlW2JyYW5jaF0sIGkrMSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbGlzdGVuZXJzO1xuICAgICAgfSBlbHNlIGlmKGN1cnJlbnRUeXBlID09PSAnKionKSB7XG4gICAgICAgIGVuZFJlYWNoZWQgPSAoaSsxID09PSB0eXBlTGVuZ3RoIHx8IChpKzIgPT09IHR5cGVMZW5ndGggJiYgbmV4dFR5cGUgPT09ICcqJykpO1xuICAgICAgICBpZihlbmRSZWFjaGVkICYmIHRyZWUuX2xpc3RlbmVycykge1xuICAgICAgICAgIC8vIFRoZSBuZXh0IGVsZW1lbnQgaGFzIGEgX2xpc3RlbmVycywgYWRkIGl0IHRvIHRoZSBoYW5kbGVycy5cbiAgICAgICAgICBsaXN0ZW5lcnMgPSBsaXN0ZW5lcnMuY29uY2F0KHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgdHJlZSwgdHlwZUxlbmd0aCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChicmFuY2ggaW4gdHJlZSkge1xuICAgICAgICAgIGlmIChicmFuY2ggIT09ICdfbGlzdGVuZXJzJyAmJiB0cmVlLmhhc093blByb3BlcnR5KGJyYW5jaCkpIHtcbiAgICAgICAgICAgIGlmKGJyYW5jaCA9PT0gJyonIHx8IGJyYW5jaCA9PT0gJyoqJykge1xuICAgICAgICAgICAgICBpZih0cmVlW2JyYW5jaF0uX2xpc3RlbmVycyAmJiAhZW5kUmVhY2hlZCkge1xuICAgICAgICAgICAgICAgIGxpc3RlbmVycyA9IGxpc3RlbmVycy5jb25jYXQoc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB0cmVlW2JyYW5jaF0sIHR5cGVMZW5ndGgpKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBsaXN0ZW5lcnMgPSBsaXN0ZW5lcnMuY29uY2F0KHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgdHJlZVticmFuY2hdLCBpKSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYoYnJhbmNoID09PSBuZXh0VHlwZSkge1xuICAgICAgICAgICAgICBsaXN0ZW5lcnMgPSBsaXN0ZW5lcnMuY29uY2F0KHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgdHJlZVticmFuY2hdLCBpKzIpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIC8vIE5vIG1hdGNoIG9uIHRoaXMgb25lLCBzaGlmdCBpbnRvIHRoZSB0cmVlIGJ1dCBub3QgaW4gdGhlIHR5cGUgYXJyYXkuXG4gICAgICAgICAgICAgIGxpc3RlbmVycyA9IGxpc3RlbmVycy5jb25jYXQoc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB0cmVlW2JyYW5jaF0sIGkpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGxpc3RlbmVycztcbiAgICAgIH1cblxuICAgICAgbGlzdGVuZXJzID0gbGlzdGVuZXJzLmNvbmNhdChzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHRyZWVbY3VycmVudFR5cGVdLCBpKzEpKTtcbiAgICB9XG5cbiAgICB4VHJlZSA9IHRyZWVbJyonXTtcbiAgICBpZiAoeFRyZWUpIHtcbiAgICAgIC8vXG4gICAgICAvLyBJZiB0aGUgbGlzdGVuZXIgdHJlZSB3aWxsIGFsbG93IGFueSBtYXRjaCBmb3IgdGhpcyBwYXJ0LFxuICAgICAgLy8gdGhlbiByZWN1cnNpdmVseSBleHBsb3JlIGFsbCBicmFuY2hlcyBvZiB0aGUgdHJlZVxuICAgICAgLy9cbiAgICAgIHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgeFRyZWUsIGkrMSk7XG4gICAgfVxuXG4gICAgeHhUcmVlID0gdHJlZVsnKionXTtcbiAgICBpZih4eFRyZWUpIHtcbiAgICAgIGlmKGkgPCB0eXBlTGVuZ3RoKSB7XG4gICAgICAgIGlmKHh4VHJlZS5fbGlzdGVuZXJzKSB7XG4gICAgICAgICAgLy8gSWYgd2UgaGF2ZSBhIGxpc3RlbmVyIG9uIGEgJyoqJywgaXQgd2lsbCBjYXRjaCBhbGwsIHNvIGFkZCBpdHMgaGFuZGxlci5cbiAgICAgICAgICBzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHh4VHJlZSwgdHlwZUxlbmd0aCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBCdWlsZCBhcnJheXMgb2YgbWF0Y2hpbmcgbmV4dCBicmFuY2hlcyBhbmQgb3RoZXJzLlxuICAgICAgICBmb3IoYnJhbmNoIGluIHh4VHJlZSkge1xuICAgICAgICAgIGlmKGJyYW5jaCAhPT0gJ19saXN0ZW5lcnMnICYmIHh4VHJlZS5oYXNPd25Qcm9wZXJ0eShicmFuY2gpKSB7XG4gICAgICAgICAgICBpZihicmFuY2ggPT09IG5leHRUeXBlKSB7XG4gICAgICAgICAgICAgIC8vIFdlIGtub3cgdGhlIG5leHQgZWxlbWVudCB3aWxsIG1hdGNoLCBzbyBqdW1wIHR3aWNlLlxuICAgICAgICAgICAgICBzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHh4VHJlZVticmFuY2hdLCBpKzIpO1xuICAgICAgICAgICAgfSBlbHNlIGlmKGJyYW5jaCA9PT0gY3VycmVudFR5cGUpIHtcbiAgICAgICAgICAgICAgLy8gQ3VycmVudCBub2RlIG1hdGNoZXMsIG1vdmUgaW50byB0aGUgdHJlZS5cbiAgICAgICAgICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB4eFRyZWVbYnJhbmNoXSwgaSsxKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGlzb2xhdGVkQnJhbmNoID0ge307XG4gICAgICAgICAgICAgIGlzb2xhdGVkQnJhbmNoW2JyYW5jaF0gPSB4eFRyZWVbYnJhbmNoXTtcbiAgICAgICAgICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB7ICcqKic6IGlzb2xhdGVkQnJhbmNoIH0sIGkrMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYoeHhUcmVlLl9saXN0ZW5lcnMpIHtcbiAgICAgICAgLy8gV2UgaGF2ZSByZWFjaGVkIHRoZSBlbmQgYW5kIHN0aWxsIG9uIGEgJyoqJ1xuICAgICAgICBzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHh4VHJlZSwgdHlwZUxlbmd0aCk7XG4gICAgICB9IGVsc2UgaWYoeHhUcmVlWycqJ10gJiYgeHhUcmVlWycqJ10uX2xpc3RlbmVycykge1xuICAgICAgICBzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHh4VHJlZVsnKiddLCB0eXBlTGVuZ3RoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbGlzdGVuZXJzO1xuICB9XG5cbiAgZnVuY3Rpb24gZ3Jvd0xpc3RlbmVyVHJlZSh0eXBlLCBsaXN0ZW5lcikge1xuXG4gICAgdHlwZSA9IHR5cGVvZiB0eXBlID09PSAnc3RyaW5nJyA/IHR5cGUuc3BsaXQodGhpcy5kZWxpbWl0ZXIpIDogdHlwZS5zbGljZSgpO1xuXG4gICAgLy9cbiAgICAvLyBMb29rcyBmb3IgdHdvIGNvbnNlY3V0aXZlICcqKicsIGlmIHNvLCBkb24ndCBhZGQgdGhlIGV2ZW50IGF0IGFsbC5cbiAgICAvL1xuICAgIGZvcih2YXIgaSA9IDAsIGxlbiA9IHR5cGUubGVuZ3RoOyBpKzEgPCBsZW47IGkrKykge1xuICAgICAgaWYodHlwZVtpXSA9PT0gJyoqJyAmJiB0eXBlW2krMV0gPT09ICcqKicpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciB0cmVlID0gdGhpcy5saXN0ZW5lclRyZWU7XG4gICAgdmFyIG5hbWUgPSB0eXBlLnNoaWZ0KCk7XG5cbiAgICB3aGlsZSAobmFtZSkge1xuXG4gICAgICBpZiAoIXRyZWVbbmFtZV0pIHtcbiAgICAgICAgdHJlZVtuYW1lXSA9IHt9O1xuICAgICAgfVxuXG4gICAgICB0cmVlID0gdHJlZVtuYW1lXTtcblxuICAgICAgaWYgKHR5cGUubGVuZ3RoID09PSAwKSB7XG5cbiAgICAgICAgaWYgKCF0cmVlLl9saXN0ZW5lcnMpIHtcbiAgICAgICAgICB0cmVlLl9saXN0ZW5lcnMgPSBsaXN0ZW5lcjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmKHR5cGVvZiB0cmVlLl9saXN0ZW5lcnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICB0cmVlLl9saXN0ZW5lcnMgPSBbdHJlZS5fbGlzdGVuZXJzLCBsaXN0ZW5lcl07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXNBcnJheSh0cmVlLl9saXN0ZW5lcnMpKSB7XG5cbiAgICAgICAgICB0cmVlLl9saXN0ZW5lcnMucHVzaChsaXN0ZW5lcik7XG5cbiAgICAgICAgICBpZiAoIXRyZWUuX2xpc3RlbmVycy53YXJuZWQpIHtcblxuICAgICAgICAgICAgdmFyIG0gPSBkZWZhdWx0TWF4TGlzdGVuZXJzO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMuX2V2ZW50cy5tYXhMaXN0ZW5lcnMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgIG0gPSB0aGlzLl9ldmVudHMubWF4TGlzdGVuZXJzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAobSA+IDAgJiYgdHJlZS5fbGlzdGVuZXJzLmxlbmd0aCA+IG0pIHtcblxuICAgICAgICAgICAgICB0cmVlLl9saXN0ZW5lcnMud2FybmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0LicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJlZS5fbGlzdGVuZXJzLmxlbmd0aCk7XG4gICAgICAgICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICBuYW1lID0gdHlwZS5zaGlmdCgpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW5cbiAgLy8gMTAgbGlzdGVuZXJzIGFyZSBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoXG4gIC8vIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxuICAvL1xuICAvLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3NcbiAgLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5cbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5kZWxpbWl0ZXIgPSAnLic7XG5cbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbihuKSB7XG4gICAgdGhpcy5fZXZlbnRzIHx8IGluaXQuY2FsbCh0aGlzKTtcbiAgICB0aGlzLl9ldmVudHMubWF4TGlzdGVuZXJzID0gbjtcbiAgICBpZiAoIXRoaXMuX2NvbmYpIHRoaXMuX2NvbmYgPSB7fTtcbiAgICB0aGlzLl9jb25mLm1heExpc3RlbmVycyA9IG47XG4gIH07XG5cbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5ldmVudCA9ICcnO1xuXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKGV2ZW50LCBmbikge1xuICAgIHRoaXMubWFueShldmVudCwgMSwgZm4pO1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUubWFueSA9IGZ1bmN0aW9uKGV2ZW50LCB0dGwsIGZuKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgaWYgKHR5cGVvZiBmbiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdtYW55IG9ubHkgYWNjZXB0cyBpbnN0YW5jZXMgb2YgRnVuY3Rpb24nKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaXN0ZW5lcigpIHtcbiAgICAgIGlmICgtLXR0bCA9PT0gMCkge1xuICAgICAgICBzZWxmLm9mZihldmVudCwgbGlzdGVuZXIpO1xuICAgICAgfVxuICAgICAgZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICBsaXN0ZW5lci5fb3JpZ2luID0gZm47XG5cbiAgICB0aGlzLm9uKGV2ZW50LCBsaXN0ZW5lcik7XG5cbiAgICByZXR1cm4gc2VsZjtcbiAgfTtcblxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbigpIHtcblxuICAgIHRoaXMuX2V2ZW50cyB8fCBpbml0LmNhbGwodGhpcyk7XG5cbiAgICB2YXIgdHlwZSA9IGFyZ3VtZW50c1swXTtcblxuICAgIGlmICh0eXBlID09PSAnbmV3TGlzdGVuZXInICYmICF0aGlzLm5ld0xpc3RlbmVyKSB7XG4gICAgICBpZiAoIXRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcikgeyByZXR1cm4gZmFsc2U7IH1cbiAgICB9XG5cbiAgICAvLyBMb29wIHRocm91Z2ggdGhlICpfYWxsKiBmdW5jdGlvbnMgYW5kIGludm9rZSB0aGVtLlxuICAgIGlmICh0aGlzLl9hbGwpIHtcbiAgICAgIHZhciBsID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGwgLSAxKTtcbiAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgbDsgaSsrKSBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgIGZvciAoaSA9IDAsIGwgPSB0aGlzLl9hbGwubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIHRoaXMuZXZlbnQgPSB0eXBlO1xuICAgICAgICB0aGlzLl9hbGxbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlcmUgaXMgbm8gJ2Vycm9yJyBldmVudCBsaXN0ZW5lciB0aGVuIHRocm93LlxuICAgIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG5cbiAgICAgIGlmICghdGhpcy5fYWxsICYmXG4gICAgICAgICF0aGlzLl9ldmVudHMuZXJyb3IgJiZcbiAgICAgICAgISh0aGlzLndpbGRjYXJkICYmIHRoaXMubGlzdGVuZXJUcmVlLmVycm9yKSkge1xuXG4gICAgICAgIGlmIChhcmd1bWVudHNbMV0gaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICAgIHRocm93IGFyZ3VtZW50c1sxXTsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmNhdWdodCwgdW5zcGVjaWZpZWQgJ2Vycm9yJyBldmVudC5cIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBoYW5kbGVyO1xuXG4gICAgaWYodGhpcy53aWxkY2FyZCkge1xuICAgICAgaGFuZGxlciA9IFtdO1xuICAgICAgdmFyIG5zID0gdHlwZW9mIHR5cGUgPT09ICdzdHJpbmcnID8gdHlwZS5zcGxpdCh0aGlzLmRlbGltaXRlcikgOiB0eXBlLnNsaWNlKCk7XG4gICAgICBzZWFyY2hMaXN0ZW5lclRyZWUuY2FsbCh0aGlzLCBoYW5kbGVyLCBucywgdGhpcy5saXN0ZW5lclRyZWUsIDApO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBoYW5kbGVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aGlzLmV2ZW50ID0gdHlwZTtcbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKVxuICAgICAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAvLyBzbG93ZXJcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdmFyIGwgPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkobCAtIDEpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBsOyBpKyspIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGVsc2UgaWYgKGhhbmRsZXIpIHtcbiAgICAgIHZhciBsID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGwgLSAxKTtcbiAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgbDsgaSsrKSBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcblxuICAgICAgdmFyIGxpc3RlbmVycyA9IGhhbmRsZXIuc2xpY2UoKTtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gbGlzdGVuZXJzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICB0aGlzLmV2ZW50ID0gdHlwZTtcbiAgICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIChsaXN0ZW5lcnMubGVuZ3RoID4gMCkgfHwgISF0aGlzLl9hbGw7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmV0dXJuICEhdGhpcy5fYWxsO1xuICAgIH1cblxuICB9O1xuXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuXG4gICAgaWYgKHR5cGVvZiB0eXBlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aGlzLm9uQW55KHR5cGUpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdvbiBvbmx5IGFjY2VwdHMgaW5zdGFuY2VzIG9mIEZ1bmN0aW9uJyk7XG4gICAgfVxuICAgIHRoaXMuX2V2ZW50cyB8fCBpbml0LmNhbGwodGhpcyk7XG5cbiAgICAvLyBUbyBhdm9pZCByZWN1cnNpb24gaW4gdGhlIGNhc2UgdGhhdCB0eXBlID09IFwibmV3TGlzdGVuZXJzXCIhIEJlZm9yZVxuICAgIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJzXCIuXG4gICAgdGhpcy5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICAgIGlmKHRoaXMud2lsZGNhcmQpIHtcbiAgICAgIGdyb3dMaXN0ZW5lclRyZWUuY2FsbCh0aGlzLCB0eXBlLCBsaXN0ZW5lcik7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSkge1xuICAgICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgICB9XG4gICAgZWxzZSBpZih0eXBlb2YgdGhpcy5fZXZlbnRzW3R5cGVdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV0sIGxpc3RlbmVyXTtcbiAgICB9XG4gICAgZWxzZSBpZiAoaXNBcnJheSh0aGlzLl9ldmVudHNbdHlwZV0pKSB7XG4gICAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG5cbiAgICAgIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gICAgICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcblxuICAgICAgICB2YXIgbSA9IGRlZmF1bHRNYXhMaXN0ZW5lcnM7XG5cbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLl9ldmVudHMubWF4TGlzdGVuZXJzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIG0gPSB0aGlzLl9ldmVudHMubWF4TGlzdGVuZXJzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG0gPiAwICYmIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGggPiBtKSB7XG5cbiAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkID0gdHJ1ZTtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0LicsXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbkFueSA9IGZ1bmN0aW9uKGZuKSB7XG5cbiAgICBpZiAodHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ29uQW55IG9ubHkgYWNjZXB0cyBpbnN0YW5jZXMgb2YgRnVuY3Rpb24nKTtcbiAgICB9XG5cbiAgICBpZighdGhpcy5fYWxsKSB7XG4gICAgICB0aGlzLl9hbGwgPSBbXTtcbiAgICB9XG5cbiAgICAvLyBBZGQgdGhlIGZ1bmN0aW9uIHRvIHRoZSBldmVudCBsaXN0ZW5lciBjb2xsZWN0aW9uLlxuICAgIHRoaXMuX2FsbC5wdXNoKGZuKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbjtcblxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9mZiA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdyZW1vdmVMaXN0ZW5lciBvbmx5IHRha2VzIGluc3RhbmNlcyBvZiBGdW5jdGlvbicpO1xuICAgIH1cblxuICAgIHZhciBoYW5kbGVycyxsZWFmcz1bXTtcblxuICAgIGlmKHRoaXMud2lsZGNhcmQpIHtcbiAgICAgIHZhciBucyA9IHR5cGVvZiB0eXBlID09PSAnc3RyaW5nJyA/IHR5cGUuc3BsaXQodGhpcy5kZWxpbWl0ZXIpIDogdHlwZS5zbGljZSgpO1xuICAgICAgbGVhZnMgPSBzZWFyY2hMaXN0ZW5lclRyZWUuY2FsbCh0aGlzLCBudWxsLCBucywgdGhpcy5saXN0ZW5lclRyZWUsIDApO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIC8vIGRvZXMgbm90IHVzZSBsaXN0ZW5lcnMoKSwgc28gbm8gc2lkZSBlZmZlY3Qgb2YgY3JlYXRpbmcgX2V2ZW50c1t0eXBlXVxuICAgICAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pIHJldHVybiB0aGlzO1xuICAgICAgaGFuZGxlcnMgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgICBsZWFmcy5wdXNoKHtfbGlzdGVuZXJzOmhhbmRsZXJzfSk7XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaUxlYWY9MDsgaUxlYWY8bGVhZnMubGVuZ3RoOyBpTGVhZisrKSB7XG4gICAgICB2YXIgbGVhZiA9IGxlYWZzW2lMZWFmXTtcbiAgICAgIGhhbmRsZXJzID0gbGVhZi5fbGlzdGVuZXJzO1xuICAgICAgaWYgKGlzQXJyYXkoaGFuZGxlcnMpKSB7XG5cbiAgICAgICAgdmFyIHBvc2l0aW9uID0gLTE7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGhhbmRsZXJzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKGhhbmRsZXJzW2ldID09PSBsaXN0ZW5lciB8fFxuICAgICAgICAgICAgKGhhbmRsZXJzW2ldLmxpc3RlbmVyICYmIGhhbmRsZXJzW2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikgfHxcbiAgICAgICAgICAgIChoYW5kbGVyc1tpXS5fb3JpZ2luICYmIGhhbmRsZXJzW2ldLl9vcmlnaW4gPT09IGxpc3RlbmVyKSkge1xuICAgICAgICAgICAgcG9zaXRpb24gPSBpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBvc2l0aW9uIDwgMCkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYodGhpcy53aWxkY2FyZCkge1xuICAgICAgICAgIGxlYWYuX2xpc3RlbmVycy5zcGxpY2UocG9zaXRpb24sIDEpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5zcGxpY2UocG9zaXRpb24sIDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGhhbmRsZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIGlmKHRoaXMud2lsZGNhcmQpIHtcbiAgICAgICAgICAgIGRlbGV0ZSBsZWFmLl9saXN0ZW5lcnM7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChoYW5kbGVycyA9PT0gbGlzdGVuZXIgfHxcbiAgICAgICAgKGhhbmRsZXJzLmxpc3RlbmVyICYmIGhhbmRsZXJzLmxpc3RlbmVyID09PSBsaXN0ZW5lcikgfHxcbiAgICAgICAgKGhhbmRsZXJzLl9vcmlnaW4gJiYgaGFuZGxlcnMuX29yaWdpbiA9PT0gbGlzdGVuZXIpKSB7XG4gICAgICAgIGlmKHRoaXMud2lsZGNhcmQpIHtcbiAgICAgICAgICBkZWxldGUgbGVhZi5fbGlzdGVuZXJzO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9mZkFueSA9IGZ1bmN0aW9uKGZuKSB7XG4gICAgdmFyIGkgPSAwLCBsID0gMCwgZm5zO1xuICAgIGlmIChmbiAmJiB0aGlzLl9hbGwgJiYgdGhpcy5fYWxsLmxlbmd0aCA+IDApIHtcbiAgICAgIGZucyA9IHRoaXMuX2FsbDtcbiAgICAgIGZvcihpID0gMCwgbCA9IGZucy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgaWYoZm4gPT09IGZuc1tpXSkge1xuICAgICAgICAgIGZucy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fYWxsID0gW107XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9mZjtcblxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgIXRoaXMuX2V2ZW50cyB8fCBpbml0LmNhbGwodGhpcyk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBpZih0aGlzLndpbGRjYXJkKSB7XG4gICAgICB2YXIgbnMgPSB0eXBlb2YgdHlwZSA9PT0gJ3N0cmluZycgPyB0eXBlLnNwbGl0KHRoaXMuZGVsaW1pdGVyKSA6IHR5cGUuc2xpY2UoKTtcbiAgICAgIHZhciBsZWFmcyA9IHNlYXJjaExpc3RlbmVyVHJlZS5jYWxsKHRoaXMsIG51bGwsIG5zLCB0aGlzLmxpc3RlbmVyVHJlZSwgMCk7XG5cbiAgICAgIGZvciAodmFyIGlMZWFmPTA7IGlMZWFmPGxlYWZzLmxlbmd0aDsgaUxlYWYrKykge1xuICAgICAgICB2YXIgbGVhZiA9IGxlYWZzW2lMZWFmXTtcbiAgICAgICAgbGVhZi5fbGlzdGVuZXJzID0gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSkgcmV0dXJuIHRoaXM7XG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgICBpZih0aGlzLndpbGRjYXJkKSB7XG4gICAgICB2YXIgaGFuZGxlcnMgPSBbXTtcbiAgICAgIHZhciBucyA9IHR5cGVvZiB0eXBlID09PSAnc3RyaW5nJyA/IHR5cGUuc3BsaXQodGhpcy5kZWxpbWl0ZXIpIDogdHlwZS5zbGljZSgpO1xuICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlLmNhbGwodGhpcywgaGFuZGxlcnMsIG5zLCB0aGlzLmxpc3RlbmVyVHJlZSwgMCk7XG4gICAgICByZXR1cm4gaGFuZGxlcnM7XG4gICAgfVxuXG4gICAgdGhpcy5fZXZlbnRzIHx8IGluaXQuY2FsbCh0aGlzKTtcblxuICAgIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKSB0aGlzLl9ldmVudHNbdHlwZV0gPSBbXTtcbiAgICBpZiAoIWlzQXJyYXkodGhpcy5fZXZlbnRzW3R5cGVdKSkge1xuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9ldmVudHNbdHlwZV07XG4gIH07XG5cbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnNBbnkgPSBmdW5jdGlvbigpIHtcblxuICAgIGlmKHRoaXMuX2FsbCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2FsbDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gIH07XG5cbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAvLyBBTUQuIFJlZ2lzdGVyIGFzIGFuIGFub255bW91cyBtb2R1bGUuXG4gICAgZGVmaW5lKGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIEV2ZW50RW1pdHRlcjtcbiAgICB9KTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICAvLyBDb21tb25KU1xuICAgIGV4cG9ydHMuRXZlbnRFbWl0dGVyMiA9IEV2ZW50RW1pdHRlcjtcbiAgfVxuICBlbHNlIHtcbiAgICAvLyBCcm93c2VyIGdsb2JhbC5cbiAgICB3aW5kb3cuRXZlbnRFbWl0dGVyMiA9IEV2ZW50RW1pdHRlcjtcbiAgfVxufSgpO1xuIiwiXG52YXIgcm5nO1xuXG5pZiAoZ2xvYmFsLmNyeXB0byAmJiBjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKSB7XG4gIC8vIFdIQVRXRyBjcnlwdG8tYmFzZWQgUk5HIC0gaHR0cDovL3dpa2kud2hhdHdnLm9yZy93aWtpL0NyeXB0b1xuICAvLyBNb2RlcmF0ZWx5IGZhc3QsIGhpZ2ggcXVhbGl0eVxuICB2YXIgX3JuZHM4ID0gbmV3IFVpbnQ4QXJyYXkoMTYpO1xuICBybmcgPSBmdW5jdGlvbiB3aGF0d2dSTkcoKSB7XG4gICAgY3J5cHRvLmdldFJhbmRvbVZhbHVlcyhfcm5kczgpO1xuICAgIHJldHVybiBfcm5kczg7XG4gIH07XG59XG5cbmlmICghcm5nKSB7XG4gIC8vIE1hdGgucmFuZG9tKCktYmFzZWQgKFJORylcbiAgLy9cbiAgLy8gSWYgYWxsIGVsc2UgZmFpbHMsIHVzZSBNYXRoLnJhbmRvbSgpLiAgSXQncyBmYXN0LCBidXQgaXMgb2YgdW5zcGVjaWZpZWRcbiAgLy8gcXVhbGl0eS5cbiAgdmFyICBfcm5kcyA9IG5ldyBBcnJheSgxNik7XG4gIHJuZyA9IGZ1bmN0aW9uKCkge1xuICAgIGZvciAodmFyIGkgPSAwLCByOyBpIDwgMTY7IGkrKykge1xuICAgICAgaWYgKChpICYgMHgwMykgPT09IDApIHIgPSBNYXRoLnJhbmRvbSgpICogMHgxMDAwMDAwMDA7XG4gICAgICBfcm5kc1tpXSA9IHIgPj4+ICgoaSAmIDB4MDMpIDw8IDMpICYgMHhmZjtcbiAgICB9XG5cbiAgICByZXR1cm4gX3JuZHM7XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcm5nO1xuXG4iLCIvLyAgICAgdXVpZC5qc1xuLy9cbi8vICAgICBDb3B5cmlnaHQgKGMpIDIwMTAtMjAxMiBSb2JlcnQgS2llZmZlclxuLy8gICAgIE1JVCBMaWNlbnNlIC0gaHR0cDovL29wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL21pdC1saWNlbnNlLnBocFxuXG4vLyBVbmlxdWUgSUQgY3JlYXRpb24gcmVxdWlyZXMgYSBoaWdoIHF1YWxpdHkgcmFuZG9tICMgZ2VuZXJhdG9yLiAgV2UgZmVhdHVyZVxuLy8gZGV0ZWN0IHRvIGRldGVybWluZSB0aGUgYmVzdCBSTkcgc291cmNlLCBub3JtYWxpemluZyB0byBhIGZ1bmN0aW9uIHRoYXRcbi8vIHJldHVybnMgMTI4LWJpdHMgb2YgcmFuZG9tbmVzcywgc2luY2UgdGhhdCdzIHdoYXQncyB1c3VhbGx5IHJlcXVpcmVkXG52YXIgX3JuZyA9IHJlcXVpcmUoJy4vcm5nJyk7XG5cbi8vIE1hcHMgZm9yIG51bWJlciA8LT4gaGV4IHN0cmluZyBjb252ZXJzaW9uXG52YXIgX2J5dGVUb0hleCA9IFtdO1xudmFyIF9oZXhUb0J5dGUgPSB7fTtcbmZvciAodmFyIGkgPSAwOyBpIDwgMjU2OyBpKyspIHtcbiAgX2J5dGVUb0hleFtpXSA9IChpICsgMHgxMDApLnRvU3RyaW5nKDE2KS5zdWJzdHIoMSk7XG4gIF9oZXhUb0J5dGVbX2J5dGVUb0hleFtpXV0gPSBpO1xufVxuXG4vLyAqKmBwYXJzZSgpYCAtIFBhcnNlIGEgVVVJRCBpbnRvIGl0J3MgY29tcG9uZW50IGJ5dGVzKipcbmZ1bmN0aW9uIHBhcnNlKHMsIGJ1Ziwgb2Zmc2V0KSB7XG4gIHZhciBpID0gKGJ1ZiAmJiBvZmZzZXQpIHx8IDAsIGlpID0gMDtcblxuICBidWYgPSBidWYgfHwgW107XG4gIHMudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9bMC05YS1mXXsyfS9nLCBmdW5jdGlvbihvY3QpIHtcbiAgICBpZiAoaWkgPCAxNikgeyAvLyBEb24ndCBvdmVyZmxvdyFcbiAgICAgIGJ1ZltpICsgaWkrK10gPSBfaGV4VG9CeXRlW29jdF07XG4gICAgfVxuICB9KTtcblxuICAvLyBaZXJvIG91dCByZW1haW5pbmcgYnl0ZXMgaWYgc3RyaW5nIHdhcyBzaG9ydFxuICB3aGlsZSAoaWkgPCAxNikge1xuICAgIGJ1ZltpICsgaWkrK10gPSAwO1xuICB9XG5cbiAgcmV0dXJuIGJ1Zjtcbn1cblxuLy8gKipgdW5wYXJzZSgpYCAtIENvbnZlcnQgVVVJRCBieXRlIGFycmF5IChhbGEgcGFyc2UoKSkgaW50byBhIHN0cmluZyoqXG5mdW5jdGlvbiB1bnBhcnNlKGJ1Ziwgb2Zmc2V0KSB7XG4gIHZhciBpID0gb2Zmc2V0IHx8IDAsIGJ0aCA9IF9ieXRlVG9IZXg7XG4gIHJldHVybiAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICsgJy0nICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArICctJyArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gKyAnLScgK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICsgJy0nICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dO1xufVxuXG4vLyAqKmB2MSgpYCAtIEdlbmVyYXRlIHRpbWUtYmFzZWQgVVVJRCoqXG4vL1xuLy8gSW5zcGlyZWQgYnkgaHR0cHM6Ly9naXRodWIuY29tL0xpb3NLL1VVSUQuanNcbi8vIGFuZCBodHRwOi8vZG9jcy5weXRob24ub3JnL2xpYnJhcnkvdXVpZC5odG1sXG5cbi8vIHJhbmRvbSAjJ3Mgd2UgbmVlZCB0byBpbml0IG5vZGUgYW5kIGNsb2Nrc2VxXG52YXIgX3NlZWRCeXRlcyA9IF9ybmcoKTtcblxuLy8gUGVyIDQuNSwgY3JlYXRlIGFuZCA0OC1iaXQgbm9kZSBpZCwgKDQ3IHJhbmRvbSBiaXRzICsgbXVsdGljYXN0IGJpdCA9IDEpXG52YXIgX25vZGVJZCA9IFtcbiAgX3NlZWRCeXRlc1swXSB8IDB4MDEsXG4gIF9zZWVkQnl0ZXNbMV0sIF9zZWVkQnl0ZXNbMl0sIF9zZWVkQnl0ZXNbM10sIF9zZWVkQnl0ZXNbNF0sIF9zZWVkQnl0ZXNbNV1cbl07XG5cbi8vIFBlciA0LjIuMiwgcmFuZG9taXplICgxNCBiaXQpIGNsb2Nrc2VxXG52YXIgX2Nsb2Nrc2VxID0gKF9zZWVkQnl0ZXNbNl0gPDwgOCB8IF9zZWVkQnl0ZXNbN10pICYgMHgzZmZmO1xuXG4vLyBQcmV2aW91cyB1dWlkIGNyZWF0aW9uIHRpbWVcbnZhciBfbGFzdE1TZWNzID0gMCwgX2xhc3ROU2VjcyA9IDA7XG5cbi8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vYnJvb2ZhL25vZGUtdXVpZCBmb3IgQVBJIGRldGFpbHNcbmZ1bmN0aW9uIHYxKG9wdGlvbnMsIGJ1Ziwgb2Zmc2V0KSB7XG4gIHZhciBpID0gYnVmICYmIG9mZnNldCB8fCAwO1xuICB2YXIgYiA9IGJ1ZiB8fCBbXTtcblxuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICB2YXIgY2xvY2tzZXEgPSBvcHRpb25zLmNsb2Nrc2VxICE9PSB1bmRlZmluZWQgPyBvcHRpb25zLmNsb2Nrc2VxIDogX2Nsb2Nrc2VxO1xuXG4gIC8vIFVVSUQgdGltZXN0YW1wcyBhcmUgMTAwIG5hbm8tc2Vjb25kIHVuaXRzIHNpbmNlIHRoZSBHcmVnb3JpYW4gZXBvY2gsXG4gIC8vICgxNTgyLTEwLTE1IDAwOjAwKS4gIEpTTnVtYmVycyBhcmVuJ3QgcHJlY2lzZSBlbm91Z2ggZm9yIHRoaXMsIHNvXG4gIC8vIHRpbWUgaXMgaGFuZGxlZCBpbnRlcm5hbGx5IGFzICdtc2VjcycgKGludGVnZXIgbWlsbGlzZWNvbmRzKSBhbmQgJ25zZWNzJ1xuICAvLyAoMTAwLW5hbm9zZWNvbmRzIG9mZnNldCBmcm9tIG1zZWNzKSBzaW5jZSB1bml4IGVwb2NoLCAxOTcwLTAxLTAxIDAwOjAwLlxuICB2YXIgbXNlY3MgPSBvcHRpb25zLm1zZWNzICE9PSB1bmRlZmluZWQgPyBvcHRpb25zLm1zZWNzIDogbmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cbiAgLy8gUGVyIDQuMi4xLjIsIHVzZSBjb3VudCBvZiB1dWlkJ3MgZ2VuZXJhdGVkIGR1cmluZyB0aGUgY3VycmVudCBjbG9ja1xuICAvLyBjeWNsZSB0byBzaW11bGF0ZSBoaWdoZXIgcmVzb2x1dGlvbiBjbG9ja1xuICB2YXIgbnNlY3MgPSBvcHRpb25zLm5zZWNzICE9PSB1bmRlZmluZWQgPyBvcHRpb25zLm5zZWNzIDogX2xhc3ROU2VjcyArIDE7XG5cbiAgLy8gVGltZSBzaW5jZSBsYXN0IHV1aWQgY3JlYXRpb24gKGluIG1zZWNzKVxuICB2YXIgZHQgPSAobXNlY3MgLSBfbGFzdE1TZWNzKSArIChuc2VjcyAtIF9sYXN0TlNlY3MpLzEwMDAwO1xuXG4gIC8vIFBlciA0LjIuMS4yLCBCdW1wIGNsb2Nrc2VxIG9uIGNsb2NrIHJlZ3Jlc3Npb25cbiAgaWYgKGR0IDwgMCAmJiBvcHRpb25zLmNsb2Nrc2VxID09PSB1bmRlZmluZWQpIHtcbiAgICBjbG9ja3NlcSA9IGNsb2Nrc2VxICsgMSAmIDB4M2ZmZjtcbiAgfVxuXG4gIC8vIFJlc2V0IG5zZWNzIGlmIGNsb2NrIHJlZ3Jlc3NlcyAobmV3IGNsb2Nrc2VxKSBvciB3ZSd2ZSBtb3ZlZCBvbnRvIGEgbmV3XG4gIC8vIHRpbWUgaW50ZXJ2YWxcbiAgaWYgKChkdCA8IDAgfHwgbXNlY3MgPiBfbGFzdE1TZWNzKSAmJiBvcHRpb25zLm5zZWNzID09PSB1bmRlZmluZWQpIHtcbiAgICBuc2VjcyA9IDA7XG4gIH1cblxuICAvLyBQZXIgNC4yLjEuMiBUaHJvdyBlcnJvciBpZiB0b28gbWFueSB1dWlkcyBhcmUgcmVxdWVzdGVkXG4gIGlmIChuc2VjcyA+PSAxMDAwMCkge1xuICAgIHRocm93IG5ldyBFcnJvcigndXVpZC52MSgpOiBDYW5cXCd0IGNyZWF0ZSBtb3JlIHRoYW4gMTBNIHV1aWRzL3NlYycpO1xuICB9XG5cbiAgX2xhc3RNU2VjcyA9IG1zZWNzO1xuICBfbGFzdE5TZWNzID0gbnNlY3M7XG4gIF9jbG9ja3NlcSA9IGNsb2Nrc2VxO1xuXG4gIC8vIFBlciA0LjEuNCAtIENvbnZlcnQgZnJvbSB1bml4IGVwb2NoIHRvIEdyZWdvcmlhbiBlcG9jaFxuICBtc2VjcyArPSAxMjIxOTI5MjgwMDAwMDtcblxuICAvLyBgdGltZV9sb3dgXG4gIHZhciB0bCA9ICgobXNlY3MgJiAweGZmZmZmZmYpICogMTAwMDAgKyBuc2VjcykgJSAweDEwMDAwMDAwMDtcbiAgYltpKytdID0gdGwgPj4+IDI0ICYgMHhmZjtcbiAgYltpKytdID0gdGwgPj4+IDE2ICYgMHhmZjtcbiAgYltpKytdID0gdGwgPj4+IDggJiAweGZmO1xuICBiW2krK10gPSB0bCAmIDB4ZmY7XG5cbiAgLy8gYHRpbWVfbWlkYFxuICB2YXIgdG1oID0gKG1zZWNzIC8gMHgxMDAwMDAwMDAgKiAxMDAwMCkgJiAweGZmZmZmZmY7XG4gIGJbaSsrXSA9IHRtaCA+Pj4gOCAmIDB4ZmY7XG4gIGJbaSsrXSA9IHRtaCAmIDB4ZmY7XG5cbiAgLy8gYHRpbWVfaGlnaF9hbmRfdmVyc2lvbmBcbiAgYltpKytdID0gdG1oID4+PiAyNCAmIDB4ZiB8IDB4MTA7IC8vIGluY2x1ZGUgdmVyc2lvblxuICBiW2krK10gPSB0bWggPj4+IDE2ICYgMHhmZjtcblxuICAvLyBgY2xvY2tfc2VxX2hpX2FuZF9yZXNlcnZlZGAgKFBlciA0LjIuMiAtIGluY2x1ZGUgdmFyaWFudClcbiAgYltpKytdID0gY2xvY2tzZXEgPj4+IDggfCAweDgwO1xuXG4gIC8vIGBjbG9ja19zZXFfbG93YFxuICBiW2krK10gPSBjbG9ja3NlcSAmIDB4ZmY7XG5cbiAgLy8gYG5vZGVgXG4gIHZhciBub2RlID0gb3B0aW9ucy5ub2RlIHx8IF9ub2RlSWQ7XG4gIGZvciAodmFyIG4gPSAwOyBuIDwgNjsgbisrKSB7XG4gICAgYltpICsgbl0gPSBub2RlW25dO1xuICB9XG5cbiAgcmV0dXJuIGJ1ZiA/IGJ1ZiA6IHVucGFyc2UoYik7XG59XG5cbi8vICoqYHY0KClgIC0gR2VuZXJhdGUgcmFuZG9tIFVVSUQqKlxuXG4vLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2Jyb29mYS9ub2RlLXV1aWQgZm9yIEFQSSBkZXRhaWxzXG5mdW5jdGlvbiB2NChvcHRpb25zLCBidWYsIG9mZnNldCkge1xuICAvLyBEZXByZWNhdGVkIC0gJ2Zvcm1hdCcgYXJndW1lbnQsIGFzIHN1cHBvcnRlZCBpbiB2MS4yXG4gIHZhciBpID0gYnVmICYmIG9mZnNldCB8fCAwO1xuXG4gIGlmICh0eXBlb2Yob3B0aW9ucykgPT0gJ3N0cmluZycpIHtcbiAgICBidWYgPSBvcHRpb25zID09ICdiaW5hcnknID8gbmV3IEFycmF5KDE2KSA6IG51bGw7XG4gICAgb3B0aW9ucyA9IG51bGw7XG4gIH1cbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgdmFyIHJuZHMgPSBvcHRpb25zLnJhbmRvbSB8fCAob3B0aW9ucy5ybmcgfHwgX3JuZykoKTtcblxuICAvLyBQZXIgNC40LCBzZXQgYml0cyBmb3IgdmVyc2lvbiBhbmQgYGNsb2NrX3NlcV9oaV9hbmRfcmVzZXJ2ZWRgXG4gIHJuZHNbNl0gPSAocm5kc1s2XSAmIDB4MGYpIHwgMHg0MDtcbiAgcm5kc1s4XSA9IChybmRzWzhdICYgMHgzZikgfCAweDgwO1xuXG4gIC8vIENvcHkgYnl0ZXMgdG8gYnVmZmVyLCBpZiBwcm92aWRlZFxuICBpZiAoYnVmKSB7XG4gICAgZm9yICh2YXIgaWkgPSAwOyBpaSA8IDE2OyBpaSsrKSB7XG4gICAgICBidWZbaSArIGlpXSA9IHJuZHNbaWldO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBidWYgfHwgdW5wYXJzZShybmRzKTtcbn1cblxuLy8gRXhwb3J0IHB1YmxpYyBBUElcbnZhciB1dWlkID0gdjQ7XG51dWlkLnYxID0gdjE7XG51dWlkLnY0ID0gdjQ7XG51dWlkLnBhcnNlID0gcGFyc2U7XG51dWlkLnVucGFyc2UgPSB1bnBhcnNlO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHV1aWQ7XG4iLCIvLyBqYXZhc2NyaXB0LWFzdGFyIDAuNC4xXG4vLyBodHRwOi8vZ2l0aHViLmNvbS9iZ3JpbnMvamF2YXNjcmlwdC1hc3RhclxuLy8gRnJlZWx5IGRpc3RyaWJ1dGFibGUgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLlxuLy8gSW1wbGVtZW50cyB0aGUgYXN0YXIgc2VhcmNoIGFsZ29yaXRobSBpbiBqYXZhc2NyaXB0IHVzaW5nIGEgQmluYXJ5IEhlYXAuXG4vLyBJbmNsdWRlcyBCaW5hcnkgSGVhcCAod2l0aCBtb2RpZmljYXRpb25zKSBmcm9tIE1hcmlqbiBIYXZlcmJla2UuXG4vLyBodHRwOi8vZWxvcXVlbnRqYXZhc2NyaXB0Lm5ldC9hcHBlbmRpeDIuaHRtbFxuKGZ1bmN0aW9uKGRlZmluaXRpb24pIHtcbiAgLyogZ2xvYmFsIG1vZHVsZSwgZGVmaW5lICovXG4gIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBkZWZpbml0aW9uKCk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgZGVmaW5lKFtdLCBkZWZpbml0aW9uKTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgZXhwb3J0cyA9IGRlZmluaXRpb24oKTtcbiAgICB3aW5kb3cuYXN0YXIgPSBleHBvcnRzLmFzdGFyO1xuICAgIHdpbmRvdy5HcmFwaCA9IGV4cG9ydHMuR3JhcGg7XG4gIH1cbn0pKGZ1bmN0aW9uKCkge1xuXG5mdW5jdGlvbiBwYXRoVG8obm9kZSkge1xuICB2YXIgY3VyciA9IG5vZGU7XG4gIHZhciBwYXRoID0gW107XG4gIHdoaWxlIChjdXJyLnBhcmVudCkge1xuICAgIHBhdGgudW5zaGlmdChjdXJyKTtcbiAgICBjdXJyID0gY3Vyci5wYXJlbnQ7XG4gIH1cbiAgcmV0dXJuIHBhdGg7XG59XG5cbmZ1bmN0aW9uIGdldEhlYXAoKSB7XG4gIHJldHVybiBuZXcgQmluYXJ5SGVhcChmdW5jdGlvbihub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUuZjtcbiAgfSk7XG59XG5cbnZhciBhc3RhciA9IHtcbiAgLyoqXG4gICogUGVyZm9ybSBhbiBBKiBTZWFyY2ggb24gYSBncmFwaCBnaXZlbiBhIHN0YXJ0IGFuZCBlbmQgbm9kZS5cbiAgKiBAcGFyYW0ge0dyYXBofSBncmFwaFxuICAqIEBwYXJhbSB7R3JpZE5vZGV9IHN0YXJ0XG4gICogQHBhcmFtIHtHcmlkTm9kZX0gZW5kXG4gICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxuICAqIEBwYXJhbSB7Ym9vbH0gW29wdGlvbnMuY2xvc2VzdF0gU3BlY2lmaWVzIHdoZXRoZXIgdG8gcmV0dXJuIHRoZVxuICAgICAgICAgICAgIHBhdGggdG8gdGhlIGNsb3Nlc3Qgbm9kZSBpZiB0aGUgdGFyZ2V0IGlzIHVucmVhY2hhYmxlLlxuICAqIEBwYXJhbSB7RnVuY3Rpb259IFtvcHRpb25zLmhldXJpc3RpY10gSGV1cmlzdGljIGZ1bmN0aW9uIChzZWVcbiAgKiAgICAgICAgICBhc3Rhci5oZXVyaXN0aWNzKS5cbiAgKi9cbiAgc2VhcmNoOiBmdW5jdGlvbihncmFwaCwgc3RhcnQsIGVuZCwgb3B0aW9ucykge1xuICAgIGdyYXBoLmNsZWFuRGlydHkoKTtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICB2YXIgaGV1cmlzdGljID0gb3B0aW9ucy5oZXVyaXN0aWMgfHwgYXN0YXIuaGV1cmlzdGljcy5tYW5oYXR0YW47XG4gICAgdmFyIGNsb3Nlc3QgPSBvcHRpb25zLmNsb3Nlc3QgfHwgZmFsc2U7XG5cbiAgICB2YXIgb3BlbkhlYXAgPSBnZXRIZWFwKCk7XG4gICAgdmFyIGNsb3Nlc3ROb2RlID0gc3RhcnQ7IC8vIHNldCB0aGUgc3RhcnQgbm9kZSB0byBiZSB0aGUgY2xvc2VzdCBpZiByZXF1aXJlZFxuXG4gICAgc3RhcnQuaCA9IGhldXJpc3RpYyhzdGFydCwgZW5kKTtcbiAgICBncmFwaC5tYXJrRGlydHkoc3RhcnQpO1xuXG4gICAgb3BlbkhlYXAucHVzaChzdGFydCk7XG5cbiAgICB3aGlsZSAob3BlbkhlYXAuc2l6ZSgpID4gMCkge1xuXG4gICAgICAvLyBHcmFiIHRoZSBsb3dlc3QgZih4KSB0byBwcm9jZXNzIG5leHQuICBIZWFwIGtlZXBzIHRoaXMgc29ydGVkIGZvciB1cy5cbiAgICAgIHZhciBjdXJyZW50Tm9kZSA9IG9wZW5IZWFwLnBvcCgpO1xuXG4gICAgICAvLyBFbmQgY2FzZSAtLSByZXN1bHQgaGFzIGJlZW4gZm91bmQsIHJldHVybiB0aGUgdHJhY2VkIHBhdGguXG4gICAgICBpZiAoY3VycmVudE5vZGUgPT09IGVuZCkge1xuICAgICAgICByZXR1cm4gcGF0aFRvKGN1cnJlbnROb2RlKTtcbiAgICAgIH1cblxuICAgICAgLy8gTm9ybWFsIGNhc2UgLS0gbW92ZSBjdXJyZW50Tm9kZSBmcm9tIG9wZW4gdG8gY2xvc2VkLCBwcm9jZXNzIGVhY2ggb2YgaXRzIG5laWdoYm9ycy5cbiAgICAgIGN1cnJlbnROb2RlLmNsb3NlZCA9IHRydWU7XG5cbiAgICAgIC8vIEZpbmQgYWxsIG5laWdoYm9ycyBmb3IgdGhlIGN1cnJlbnQgbm9kZS5cbiAgICAgIHZhciBuZWlnaGJvcnMgPSBncmFwaC5uZWlnaGJvcnMoY3VycmVudE5vZGUpO1xuXG4gICAgICBmb3IgKHZhciBpID0gMCwgaWwgPSBuZWlnaGJvcnMubGVuZ3RoOyBpIDwgaWw7ICsraSkge1xuICAgICAgICB2YXIgbmVpZ2hib3IgPSBuZWlnaGJvcnNbaV07XG5cbiAgICAgICAgaWYgKG5laWdoYm9yLmNsb3NlZCB8fCBuZWlnaGJvci5pc1dhbGwoKSkge1xuICAgICAgICAgIC8vIE5vdCBhIHZhbGlkIG5vZGUgdG8gcHJvY2Vzcywgc2tpcCB0byBuZXh0IG5laWdoYm9yLlxuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhlIGcgc2NvcmUgaXMgdGhlIHNob3J0ZXN0IGRpc3RhbmNlIGZyb20gc3RhcnQgdG8gY3VycmVudCBub2RlLlxuICAgICAgICAvLyBXZSBuZWVkIHRvIGNoZWNrIGlmIHRoZSBwYXRoIHdlIGhhdmUgYXJyaXZlZCBhdCB0aGlzIG5laWdoYm9yIGlzIHRoZSBzaG9ydGVzdCBvbmUgd2UgaGF2ZSBzZWVuIHlldC5cbiAgICAgICAgdmFyIGdTY29yZSA9IGN1cnJlbnROb2RlLmcgKyBuZWlnaGJvci5nZXRDb3N0KGN1cnJlbnROb2RlKTtcbiAgICAgICAgdmFyIGJlZW5WaXNpdGVkID0gbmVpZ2hib3IudmlzaXRlZDtcblxuICAgICAgICBpZiAoIWJlZW5WaXNpdGVkIHx8IGdTY29yZSA8IG5laWdoYm9yLmcpIHtcblxuICAgICAgICAgIC8vIEZvdW5kIGFuIG9wdGltYWwgKHNvIGZhcikgcGF0aCB0byB0aGlzIG5vZGUuICBUYWtlIHNjb3JlIGZvciBub2RlIHRvIHNlZSBob3cgZ29vZCBpdCBpcy5cbiAgICAgICAgICBuZWlnaGJvci52aXNpdGVkID0gdHJ1ZTtcbiAgICAgICAgICBuZWlnaGJvci5wYXJlbnQgPSBjdXJyZW50Tm9kZTtcbiAgICAgICAgICBuZWlnaGJvci5oID0gbmVpZ2hib3IuaCB8fCBoZXVyaXN0aWMobmVpZ2hib3IsIGVuZCk7XG4gICAgICAgICAgbmVpZ2hib3IuZyA9IGdTY29yZTtcbiAgICAgICAgICBuZWlnaGJvci5mID0gbmVpZ2hib3IuZyArIG5laWdoYm9yLmg7XG4gICAgICAgICAgZ3JhcGgubWFya0RpcnR5KG5laWdoYm9yKTtcbiAgICAgICAgICBpZiAoY2xvc2VzdCkge1xuICAgICAgICAgICAgLy8gSWYgdGhlIG5laWdoYm91ciBpcyBjbG9zZXIgdGhhbiB0aGUgY3VycmVudCBjbG9zZXN0Tm9kZSBvciBpZiBpdCdzIGVxdWFsbHkgY2xvc2UgYnV0IGhhc1xuICAgICAgICAgICAgLy8gYSBjaGVhcGVyIHBhdGggdGhhbiB0aGUgY3VycmVudCBjbG9zZXN0IG5vZGUgdGhlbiBpdCBiZWNvbWVzIHRoZSBjbG9zZXN0IG5vZGVcbiAgICAgICAgICAgIGlmIChuZWlnaGJvci5oIDwgY2xvc2VzdE5vZGUuaCB8fCAobmVpZ2hib3IuaCA9PT0gY2xvc2VzdE5vZGUuaCAmJiBuZWlnaGJvci5nIDwgY2xvc2VzdE5vZGUuZykpIHtcbiAgICAgICAgICAgICAgY2xvc2VzdE5vZGUgPSBuZWlnaGJvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIWJlZW5WaXNpdGVkKSB7XG4gICAgICAgICAgICAvLyBQdXNoaW5nIHRvIGhlYXAgd2lsbCBwdXQgaXQgaW4gcHJvcGVyIHBsYWNlIGJhc2VkIG9uIHRoZSAnZicgdmFsdWUuXG4gICAgICAgICAgICBvcGVuSGVhcC5wdXNoKG5laWdoYm9yKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gQWxyZWFkeSBzZWVuIHRoZSBub2RlLCBidXQgc2luY2UgaXQgaGFzIGJlZW4gcmVzY29yZWQgd2UgbmVlZCB0byByZW9yZGVyIGl0IGluIHRoZSBoZWFwXG4gICAgICAgICAgICBvcGVuSGVhcC5yZXNjb3JlRWxlbWVudChuZWlnaGJvcik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNsb3Nlc3QpIHtcbiAgICAgIHJldHVybiBwYXRoVG8oY2xvc2VzdE5vZGUpO1xuICAgIH1cblxuICAgIC8vIE5vIHJlc3VsdCB3YXMgZm91bmQgLSBlbXB0eSBhcnJheSBzaWduaWZpZXMgZmFpbHVyZSB0byBmaW5kIHBhdGguXG4gICAgcmV0dXJuIFtdO1xuICB9LFxuICAvLyBTZWUgbGlzdCBvZiBoZXVyaXN0aWNzOiBodHRwOi8vdGhlb3J5LnN0YW5mb3JkLmVkdS9+YW1pdHAvR2FtZVByb2dyYW1taW5nL0hldXJpc3RpY3MuaHRtbFxuICBoZXVyaXN0aWNzOiB7XG4gICAgbWFuaGF0dGFuOiBmdW5jdGlvbihwb3MwLCBwb3MxKSB7XG4gICAgICB2YXIgZDEgPSBNYXRoLmFicyhwb3MxLnggLSBwb3MwLngpO1xuICAgICAgdmFyIGQyID0gTWF0aC5hYnMocG9zMS55IC0gcG9zMC55KTtcbiAgICAgIHJldHVybiBkMSArIGQyO1xuICAgIH0sXG4gICAgZGlhZ29uYWw6IGZ1bmN0aW9uKHBvczAsIHBvczEpIHtcbiAgICAgIHZhciBEID0gMTtcbiAgICAgIHZhciBEMiA9IE1hdGguc3FydCgyKTtcbiAgICAgIHZhciBkMSA9IE1hdGguYWJzKHBvczEueCAtIHBvczAueCk7XG4gICAgICB2YXIgZDIgPSBNYXRoLmFicyhwb3MxLnkgLSBwb3MwLnkpO1xuICAgICAgcmV0dXJuIChEICogKGQxICsgZDIpKSArICgoRDIgLSAoMiAqIEQpKSAqIE1hdGgubWluKGQxLCBkMikpO1xuICAgIH1cbiAgfSxcbiAgY2xlYW5Ob2RlOiBmdW5jdGlvbihub2RlKSB7XG4gICAgbm9kZS5mID0gMDtcbiAgICBub2RlLmcgPSAwO1xuICAgIG5vZGUuaCA9IDA7XG4gICAgbm9kZS52aXNpdGVkID0gZmFsc2U7XG4gICAgbm9kZS5jbG9zZWQgPSBmYWxzZTtcbiAgICBub2RlLnBhcmVudCA9IG51bGw7XG4gIH1cbn07XG5cbi8qKlxuICogQSBncmFwaCBtZW1vcnkgc3RydWN0dXJlXG4gKiBAcGFyYW0ge0FycmF5fSBncmlkSW4gMkQgYXJyYXkgb2YgaW5wdXQgd2VpZ2h0c1xuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxuICogQHBhcmFtIHtib29sfSBbb3B0aW9ucy5kaWFnb25hbF0gU3BlY2lmaWVzIHdoZXRoZXIgZGlhZ29uYWwgbW92ZXMgYXJlIGFsbG93ZWRcbiAqL1xuZnVuY3Rpb24gR3JhcGgoZ3JpZEluLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICB0aGlzLm5vZGVzID0gW107XG4gIHRoaXMuZGlhZ29uYWwgPSAhIW9wdGlvbnMuZGlhZ29uYWw7XG4gIHRoaXMuZ3JpZCA9IFtdO1xuICBmb3IgKHZhciB4ID0gMDsgeCA8IGdyaWRJbi5sZW5ndGg7IHgrKykge1xuICAgIHRoaXMuZ3JpZFt4XSA9IFtdO1xuXG4gICAgZm9yICh2YXIgeSA9IDAsIHJvdyA9IGdyaWRJblt4XTsgeSA8IHJvdy5sZW5ndGg7IHkrKykge1xuICAgICAgdmFyIG5vZGUgPSBuZXcgR3JpZE5vZGUoeCwgeSwgcm93W3ldKTtcbiAgICAgIHRoaXMuZ3JpZFt4XVt5XSA9IG5vZGU7XG4gICAgICB0aGlzLm5vZGVzLnB1c2gobm9kZSk7XG4gICAgfVxuICB9XG4gIHRoaXMuaW5pdCgpO1xufVxuXG5HcmFwaC5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmRpcnR5Tm9kZXMgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgYXN0YXIuY2xlYW5Ob2RlKHRoaXMubm9kZXNbaV0pO1xuICB9XG59O1xuXG5HcmFwaC5wcm90b3R5cGUuY2xlYW5EaXJ0eSA9IGZ1bmN0aW9uKCkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZGlydHlOb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgIGFzdGFyLmNsZWFuTm9kZSh0aGlzLmRpcnR5Tm9kZXNbaV0pO1xuICB9XG4gIHRoaXMuZGlydHlOb2RlcyA9IFtdO1xufTtcblxuR3JhcGgucHJvdG90eXBlLm1hcmtEaXJ0eSA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgdGhpcy5kaXJ0eU5vZGVzLnB1c2gobm9kZSk7XG59O1xuXG5HcmFwaC5wcm90b3R5cGUubmVpZ2hib3JzID0gZnVuY3Rpb24obm9kZSkge1xuICB2YXIgcmV0ID0gW107XG4gIHZhciB4ID0gbm9kZS54O1xuICB2YXIgeSA9IG5vZGUueTtcbiAgdmFyIGdyaWQgPSB0aGlzLmdyaWQ7XG5cbiAgLy8gV2VzdFxuICBpZiAoZ3JpZFt4IC0gMV0gJiYgZ3JpZFt4IC0gMV1beV0pIHtcbiAgICByZXQucHVzaChncmlkW3ggLSAxXVt5XSk7XG4gIH1cblxuICAvLyBFYXN0XG4gIGlmIChncmlkW3ggKyAxXSAmJiBncmlkW3ggKyAxXVt5XSkge1xuICAgIHJldC5wdXNoKGdyaWRbeCArIDFdW3ldKTtcbiAgfVxuXG4gIC8vIFNvdXRoXG4gIGlmIChncmlkW3hdICYmIGdyaWRbeF1beSAtIDFdKSB7XG4gICAgcmV0LnB1c2goZ3JpZFt4XVt5IC0gMV0pO1xuICB9XG5cbiAgLy8gTm9ydGhcbiAgaWYgKGdyaWRbeF0gJiYgZ3JpZFt4XVt5ICsgMV0pIHtcbiAgICByZXQucHVzaChncmlkW3hdW3kgKyAxXSk7XG4gIH1cblxuICBpZiAodGhpcy5kaWFnb25hbCkge1xuICAgIC8vIFNvdXRod2VzdFxuICAgIGlmIChncmlkW3ggLSAxXSAmJiBncmlkW3ggLSAxXVt5IC0gMV0pIHtcbiAgICAgIHJldC5wdXNoKGdyaWRbeCAtIDFdW3kgLSAxXSk7XG4gICAgfVxuXG4gICAgLy8gU291dGhlYXN0XG4gICAgaWYgKGdyaWRbeCArIDFdICYmIGdyaWRbeCArIDFdW3kgLSAxXSkge1xuICAgICAgcmV0LnB1c2goZ3JpZFt4ICsgMV1beSAtIDFdKTtcbiAgICB9XG5cbiAgICAvLyBOb3J0aHdlc3RcbiAgICBpZiAoZ3JpZFt4IC0gMV0gJiYgZ3JpZFt4IC0gMV1beSArIDFdKSB7XG4gICAgICByZXQucHVzaChncmlkW3ggLSAxXVt5ICsgMV0pO1xuICAgIH1cblxuICAgIC8vIE5vcnRoZWFzdFxuICAgIGlmIChncmlkW3ggKyAxXSAmJiBncmlkW3ggKyAxXVt5ICsgMV0pIHtcbiAgICAgIHJldC5wdXNoKGdyaWRbeCArIDFdW3kgKyAxXSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJldDtcbn07XG5cbkdyYXBoLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZ3JhcGhTdHJpbmcgPSBbXTtcbiAgdmFyIG5vZGVzID0gdGhpcy5ncmlkO1xuICBmb3IgKHZhciB4ID0gMDsgeCA8IG5vZGVzLmxlbmd0aDsgeCsrKSB7XG4gICAgdmFyIHJvd0RlYnVnID0gW107XG4gICAgdmFyIHJvdyA9IG5vZGVzW3hdO1xuICAgIGZvciAodmFyIHkgPSAwOyB5IDwgcm93Lmxlbmd0aDsgeSsrKSB7XG4gICAgICByb3dEZWJ1Zy5wdXNoKHJvd1t5XS53ZWlnaHQpO1xuICAgIH1cbiAgICBncmFwaFN0cmluZy5wdXNoKHJvd0RlYnVnLmpvaW4oXCIgXCIpKTtcbiAgfVxuICByZXR1cm4gZ3JhcGhTdHJpbmcuam9pbihcIlxcblwiKTtcbn07XG5cbmZ1bmN0aW9uIEdyaWROb2RlKHgsIHksIHdlaWdodCkge1xuICB0aGlzLnggPSB4O1xuICB0aGlzLnkgPSB5O1xuICB0aGlzLndlaWdodCA9IHdlaWdodDtcbn1cblxuR3JpZE5vZGUucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBcIltcIiArIHRoaXMueCArIFwiIFwiICsgdGhpcy55ICsgXCJdXCI7XG59O1xuXG5HcmlkTm9kZS5wcm90b3R5cGUuZ2V0Q29zdCA9IGZ1bmN0aW9uKGZyb21OZWlnaGJvcikge1xuICAvLyBUYWtlIGRpYWdvbmFsIHdlaWdodCBpbnRvIGNvbnNpZGVyYXRpb24uXG4gIGlmIChmcm9tTmVpZ2hib3IgJiYgZnJvbU5laWdoYm9yLnggIT0gdGhpcy54ICYmIGZyb21OZWlnaGJvci55ICE9IHRoaXMueSkge1xuICAgIHJldHVybiB0aGlzLndlaWdodCAqIDEuNDE0MjE7XG4gIH1cbiAgcmV0dXJuIHRoaXMud2VpZ2h0O1xufTtcblxuR3JpZE5vZGUucHJvdG90eXBlLmlzV2FsbCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy53ZWlnaHQgPT09IDA7XG59O1xuXG5mdW5jdGlvbiBCaW5hcnlIZWFwKHNjb3JlRnVuY3Rpb24pIHtcbiAgdGhpcy5jb250ZW50ID0gW107XG4gIHRoaXMuc2NvcmVGdW5jdGlvbiA9IHNjb3JlRnVuY3Rpb247XG59XG5cbkJpbmFyeUhlYXAucHJvdG90eXBlID0ge1xuICBwdXNoOiBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgLy8gQWRkIHRoZSBuZXcgZWxlbWVudCB0byB0aGUgZW5kIG9mIHRoZSBhcnJheS5cbiAgICB0aGlzLmNvbnRlbnQucHVzaChlbGVtZW50KTtcblxuICAgIC8vIEFsbG93IGl0IHRvIHNpbmsgZG93bi5cbiAgICB0aGlzLnNpbmtEb3duKHRoaXMuY29udGVudC5sZW5ndGggLSAxKTtcbiAgfSxcbiAgcG9wOiBmdW5jdGlvbigpIHtcbiAgICAvLyBTdG9yZSB0aGUgZmlyc3QgZWxlbWVudCBzbyB3ZSBjYW4gcmV0dXJuIGl0IGxhdGVyLlxuICAgIHZhciByZXN1bHQgPSB0aGlzLmNvbnRlbnRbMF07XG4gICAgLy8gR2V0IHRoZSBlbGVtZW50IGF0IHRoZSBlbmQgb2YgdGhlIGFycmF5LlxuICAgIHZhciBlbmQgPSB0aGlzLmNvbnRlbnQucG9wKCk7XG4gICAgLy8gSWYgdGhlcmUgYXJlIGFueSBlbGVtZW50cyBsZWZ0LCBwdXQgdGhlIGVuZCBlbGVtZW50IGF0IHRoZVxuICAgIC8vIHN0YXJ0LCBhbmQgbGV0IGl0IGJ1YmJsZSB1cC5cbiAgICBpZiAodGhpcy5jb250ZW50Lmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMuY29udGVudFswXSA9IGVuZDtcbiAgICAgIHRoaXMuYnViYmxlVXAoMCk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH0sXG4gIHJlbW92ZTogZnVuY3Rpb24obm9kZSkge1xuICAgIHZhciBpID0gdGhpcy5jb250ZW50LmluZGV4T2Yobm9kZSk7XG5cbiAgICAvLyBXaGVuIGl0IGlzIGZvdW5kLCB0aGUgcHJvY2VzcyBzZWVuIGluICdwb3AnIGlzIHJlcGVhdGVkXG4gICAgLy8gdG8gZmlsbCB1cCB0aGUgaG9sZS5cbiAgICB2YXIgZW5kID0gdGhpcy5jb250ZW50LnBvcCgpO1xuXG4gICAgaWYgKGkgIT09IHRoaXMuY29udGVudC5sZW5ndGggLSAxKSB7XG4gICAgICB0aGlzLmNvbnRlbnRbaV0gPSBlbmQ7XG5cbiAgICAgIGlmICh0aGlzLnNjb3JlRnVuY3Rpb24oZW5kKSA8IHRoaXMuc2NvcmVGdW5jdGlvbihub2RlKSkge1xuICAgICAgICB0aGlzLnNpbmtEb3duKGkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5idWJibGVVcChpKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHNpemU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmNvbnRlbnQubGVuZ3RoO1xuICB9LFxuICByZXNjb3JlRWxlbWVudDogZnVuY3Rpb24obm9kZSkge1xuICAgIHRoaXMuc2lua0Rvd24odGhpcy5jb250ZW50LmluZGV4T2Yobm9kZSkpO1xuICB9LFxuICBzaW5rRG93bjogZnVuY3Rpb24obikge1xuICAgIC8vIEZldGNoIHRoZSBlbGVtZW50IHRoYXQgaGFzIHRvIGJlIHN1bmsuXG4gICAgdmFyIGVsZW1lbnQgPSB0aGlzLmNvbnRlbnRbbl07XG5cbiAgICAvLyBXaGVuIGF0IDAsIGFuIGVsZW1lbnQgY2FuIG5vdCBzaW5rIGFueSBmdXJ0aGVyLlxuICAgIHdoaWxlIChuID4gMCkge1xuXG4gICAgICAvLyBDb21wdXRlIHRoZSBwYXJlbnQgZWxlbWVudCdzIGluZGV4LCBhbmQgZmV0Y2ggaXQuXG4gICAgICB2YXIgcGFyZW50TiA9ICgobiArIDEpID4+IDEpIC0gMTtcbiAgICAgIHZhciBwYXJlbnQgPSB0aGlzLmNvbnRlbnRbcGFyZW50Tl07XG4gICAgICAvLyBTd2FwIHRoZSBlbGVtZW50cyBpZiB0aGUgcGFyZW50IGlzIGdyZWF0ZXIuXG4gICAgICBpZiAodGhpcy5zY29yZUZ1bmN0aW9uKGVsZW1lbnQpIDwgdGhpcy5zY29yZUZ1bmN0aW9uKHBhcmVudCkpIHtcbiAgICAgICAgdGhpcy5jb250ZW50W3BhcmVudE5dID0gZWxlbWVudDtcbiAgICAgICAgdGhpcy5jb250ZW50W25dID0gcGFyZW50O1xuICAgICAgICAvLyBVcGRhdGUgJ24nIHRvIGNvbnRpbnVlIGF0IHRoZSBuZXcgcG9zaXRpb24uXG4gICAgICAgIG4gPSBwYXJlbnROO1xuICAgICAgfVxuICAgICAgLy8gRm91bmQgYSBwYXJlbnQgdGhhdCBpcyBsZXNzLCBubyBuZWVkIHRvIHNpbmsgYW55IGZ1cnRoZXIuXG4gICAgICBlbHNlIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9LFxuICBidWJibGVVcDogZnVuY3Rpb24obikge1xuICAgIC8vIExvb2sgdXAgdGhlIHRhcmdldCBlbGVtZW50IGFuZCBpdHMgc2NvcmUuXG4gICAgdmFyIGxlbmd0aCA9IHRoaXMuY29udGVudC5sZW5ndGg7XG4gICAgdmFyIGVsZW1lbnQgPSB0aGlzLmNvbnRlbnRbbl07XG4gICAgdmFyIGVsZW1TY29yZSA9IHRoaXMuc2NvcmVGdW5jdGlvbihlbGVtZW50KTtcblxuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAvLyBDb21wdXRlIHRoZSBpbmRpY2VzIG9mIHRoZSBjaGlsZCBlbGVtZW50cy5cbiAgICAgIHZhciBjaGlsZDJOID0gKG4gKyAxKSA8PCAxO1xuICAgICAgdmFyIGNoaWxkMU4gPSBjaGlsZDJOIC0gMTtcbiAgICAgIC8vIFRoaXMgaXMgdXNlZCB0byBzdG9yZSB0aGUgbmV3IHBvc2l0aW9uIG9mIHRoZSBlbGVtZW50LCBpZiBhbnkuXG4gICAgICB2YXIgc3dhcCA9IG51bGw7XG4gICAgICB2YXIgY2hpbGQxU2NvcmU7XG4gICAgICAvLyBJZiB0aGUgZmlyc3QgY2hpbGQgZXhpc3RzIChpcyBpbnNpZGUgdGhlIGFycmF5KS4uLlxuICAgICAgaWYgKGNoaWxkMU4gPCBsZW5ndGgpIHtcbiAgICAgICAgLy8gTG9vayBpdCB1cCBhbmQgY29tcHV0ZSBpdHMgc2NvcmUuXG4gICAgICAgIHZhciBjaGlsZDEgPSB0aGlzLmNvbnRlbnRbY2hpbGQxTl07XG4gICAgICAgIGNoaWxkMVNjb3JlID0gdGhpcy5zY29yZUZ1bmN0aW9uKGNoaWxkMSk7XG5cbiAgICAgICAgLy8gSWYgdGhlIHNjb3JlIGlzIGxlc3MgdGhhbiBvdXIgZWxlbWVudCdzLCB3ZSBuZWVkIHRvIHN3YXAuXG4gICAgICAgIGlmIChjaGlsZDFTY29yZSA8IGVsZW1TY29yZSkge1xuICAgICAgICAgIHN3YXAgPSBjaGlsZDFOO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIERvIHRoZSBzYW1lIGNoZWNrcyBmb3IgdGhlIG90aGVyIGNoaWxkLlxuICAgICAgaWYgKGNoaWxkMk4gPCBsZW5ndGgpIHtcbiAgICAgICAgdmFyIGNoaWxkMiA9IHRoaXMuY29udGVudFtjaGlsZDJOXTtcbiAgICAgICAgdmFyIGNoaWxkMlNjb3JlID0gdGhpcy5zY29yZUZ1bmN0aW9uKGNoaWxkMik7XG4gICAgICAgIGlmIChjaGlsZDJTY29yZSA8IChzd2FwID09PSBudWxsID8gZWxlbVNjb3JlIDogY2hpbGQxU2NvcmUpKSB7XG4gICAgICAgICAgc3dhcCA9IGNoaWxkMk47XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gSWYgdGhlIGVsZW1lbnQgbmVlZHMgdG8gYmUgbW92ZWQsIHN3YXAgaXQsIGFuZCBjb250aW51ZS5cbiAgICAgIGlmIChzd2FwICE9PSBudWxsKSB7XG4gICAgICAgIHRoaXMuY29udGVudFtuXSA9IHRoaXMuY29udGVudFtzd2FwXTtcbiAgICAgICAgdGhpcy5jb250ZW50W3N3YXBdID0gZWxlbWVudDtcbiAgICAgICAgbiA9IHN3YXA7XG4gICAgICB9XG4gICAgICAvLyBPdGhlcndpc2UsIHdlIGFyZSBkb25lLlxuICAgICAgZWxzZSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxucmV0dXJuIHtcbiAgYXN0YXI6IGFzdGFyLFxuICBHcmFwaDogR3JhcGhcbn07XG5cbn0pOyIsInZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xudmFyIE1hdGgyRCA9IHJlcXVpcmUoJy4vbWF0aDJkJyk7XG52YXIgQmFzZVVuaXQgPSByZXF1aXJlKCcuL0Jhc2VVbml0Jyk7XG52YXIgbG9nZ2VyID0gcmVxdWlyZSgnLi4vdXRpbC9sb2cnKS5sb2dnZXIoJ0Jhc2VNb2JpbGVVbml0Jyk7XG52YXIgYXN0YXIgPSByZXF1aXJlKCcuLi9hbGdvcml0aG0vYXN0YXInKTtcblxuZnVuY3Rpb24gTW9iaWxlVW5pdENvbnRleHQoKSB7XG5cdHJldHVybiB7XG5cdFx0c3RhdHVzIDogTW9iaWxlVW5pdENvbnRleHQuU1RBVFVTX1dBSVQsXG5cdFx0ZGVzdCA6IG51bGwsXG5cdFx0dGFyZ2V0IDogbnVsbCxcblx0XHRnYXRoZXJpbmdfYW1vdW50IDogMFxuXHR9XG59XG5cbk1vYmlsZVVuaXRDb250ZXh0LlNUQVRVUyA9IHtcblx0V0FJVElORzogMSxcblx0TU9WSU5HX1RPX1BPUzogMixcblx0TU9WSU5HX1RPX0JVSUxESU5HOiAzLFxuXHRNT1ZJTkdfVE9fUkVTT1VSQ0U6IDQsXG5cdE1PVklOR19UT19VTklUOiA1LFxuXHRSRVRVUk5JTkc6IDYsXG5cdEFUVEFDS0lORzogNyxcblx0R0FUSEVSSU5HOiA4LFxuXHRSRVBBSVJJTkc6IDksXG5cdEJVSUxESU5HOiAxMFxufVxuXG5mdW5jdGlvbiBCYXNlTW9iaWxlVW5pdChncmFwaGljLCBpbmZvLCBtYXAsIHBsYXllcikge1xuXHR2YXIgdGhhdCA9IHRoaXM7XG5cdEJhc2VVbml0LmNhbGwodGhpcywgZ3JhcGhpYywgaW5mbywgbWFwLCBwbGF5ZXIpO1xuXHR0aGlzLmNvbnRleHQgPSBuZXcgTW9iaWxlVW5pdENvbnRleHQoKTtcblx0dGhpcy5hdHRhY2sgPSA1O1xuXHR0aGlzLnJhbmdlID0gMztcblx0dGhpcy5zcGVlZCA9IDQ7XG5cdC8v5qyh44Gu55uu55qE5ZywXG5cdHRoaXMubmV4dERlc3RpbmF0aW9uID0gbnVsbDtcblx0dGhpcy5xdWV1ZSA9IFtdO1xuXHR0aGlzLmNvdW50ID0gMDtcblx0dGhpcy5jb3VudDIgPSAwO1xufVxuXG51dGlsLmluaGVyaXRzKEJhc2VNb2JpbGVVbml0LCBCYXNlVW5pdCk7XG5cbkJhc2VNb2JpbGVVbml0LnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oc3RhdHVzKSB7XG5cdC8v6KGo56S6XG59XG5cbkJhc2VNb2JpbGVVbml0LnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gSlNPTi5zdHJpbmdpZnkodGhpcy5jb250ZXh0LnN0YXR1cyk7XG59XG5cblxuQmFzZU1vYmlsZVVuaXQucHJvdG90eXBlLm1haW4gPSBmdW5jdGlvbigpIHtcblx0c3dpdGNoKHRoaXMuY29udGV4dC5zdGF0dXMpIHtcblx0XHRjYXNlIE1vYmlsZVVuaXRDb250ZXh0LlNUQVRVUy5XQUlUSU5HOlxuXHRcdFx0dGhpcy5leGVjdXRlX3dhaXRpbmcoZXZlbnQpO1xuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSBNb2JpbGVVbml0Q29udGV4dC5TVEFUVVMuTU9WSU5HX1RPX1BPUzpcblx0XHRcdHRoaXMuZXhlY3V0ZV9tb3ZpbmdfdG9fcG9zKGV2ZW50KTtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgTW9iaWxlVW5pdENvbnRleHQuU1RBVFVTLk1PVklOR19UT19CVUlMRElORzpcblx0XHRcdHRoaXMuZXhlY3V0ZV9tb3ZpbmdfdG9fYnVpbGRpbmcoZXZlbnQpO1xuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSBNb2JpbGVVbml0Q29udGV4dC5TVEFUVVMuTU9WSU5HX1RPX1JFU09VUkNFOlxuXHRcdFx0dGhpcy5leGVjdXRlX21vdmluZ190b19yZXNvdXJjZShldmVudCk7XG5cdFx0XHRicmVhaztcblx0XHRjYXNlIE1vYmlsZVVuaXRDb250ZXh0LlNUQVRVUy5NT1ZJTkdfVE9fVU5JVDpcblx0XHRcdHRoaXMuZXhlY3V0ZV9tb3ZpbmdfdG9fdW5pdChldmVudCk7XG5cdFx0XHRicmVhaztcblx0XHRjYXNlIE1vYmlsZVVuaXRDb250ZXh0LlNUQVRVUy5SRVRVUk5JTkc6XG5cdFx0XHR0aGlzLmV4ZWN1dGVfcmV0dXJuaW5nKGV2ZW50KTtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgTW9iaWxlVW5pdENvbnRleHQuU1RBVFVTLkFUVEFDS0lORzpcblx0XHRcdHRoaXMuZXhlY3V0ZV9hdHRhY2tpbmcoZXZlbnQpO1xuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSBNb2JpbGVVbml0Q29udGV4dC5TVEFUVVMuR0FUSEVSSU5HOlxuXHRcdFx0dGhpcy5leGVjdXRlX2dhdGhlcmluZyhldmVudCk7XG5cdFx0XHRicmVhaztcblx0XHRjYXNlIE1vYmlsZVVuaXRDb250ZXh0LlNUQVRVUy5SRVBBSVJJTkc6XG5cdFx0XHR0aGlzLmV4ZWN1dGVfcmVwYWlyaW5nKGV2ZW50KTtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgTW9iaWxlVW5pdENvbnRleHQuU1RBVFVTLmJ1aWxkaW5nOlxuXHRcdFx0YnJlYWs7XG5cdH1cbn1cblxuQmFzZU1vYmlsZVVuaXQucHJvdG90eXBlLmV4ZWN1dGVfd2FpdGluZyA9IGZ1bmN0aW9uKGV2ZW50KSB7XG59XG5cbkJhc2VNb2JpbGVVbml0LnByb3RvdHlwZS5leGVjdXRlX21vdmluZ190b19wb3MgPSBmdW5jdGlvbihldmVudCkge1xuXHR0aGlzLm1vdmluZ1Byb2Nlc3MoKTtcblx0aWYoIXRoaXMuY29udGV4dC5kaXN0KSByZXR1cm47XG5cdHZhciBkaXMgPSBNYXRoMkQuUG9pbnQyRC5kaXN0YW5jZSggdGhpcy5wb3NpdGlvbigpLCB0aGlzLmNvbnRleHQuZGlzdCApO1xuXHRpZihkaXMgPCA4MCkge1xuXHRcdHRoaXMuY29udGV4dC5zdGF0dXMgPSBNb2JpbGVVbml0Q29udGV4dC5TVEFUVVMuV0FJVElORztcblx0fVxufVxuXG5CYXNlTW9iaWxlVW5pdC5wcm90b3R5cGUuZXhlY3V0ZV9tb3ZpbmdfdG9fYnVpbGRpbmcgPSBmdW5jdGlvbihldmVudCkge1xuXHR0aGlzLm1vdmluZ1Byb2Nlc3MoKTtcblx0dmFyIGRpcyA9IE1hdGgyRC5Qb2ludDJELmRpc3RhbmNlKCB0aGlzLnBvc2l0aW9uKCksIHRoaXMuY29udGV4dC50YXJnZXQucG9zaXRpb24oKSApO1xuXHRpZihkaXMgPCA4MCkge1xuXHRcdHRoaXMuY29udGV4dC5zdGF0dXMgPSBNb2JpbGVVbml0Q29udGV4dC5TVEFUVVMuV0FJVElORztcblx0fVxufVxuXG5CYXNlTW9iaWxlVW5pdC5wcm90b3R5cGUuZXhlY3V0ZV9tb3ZpbmdfdG9fcmVzb3VyY2UgPSBmdW5jdGlvbihldmVudCkge1xuXHR0aGlzLm1vdmluZ1Byb2Nlc3MoKTtcblx0dmFyIGRpcyA9IE1hdGgyRC5Qb2ludDJELmRpc3RhbmNlKCB0aGlzLnBvc2l0aW9uKCksIHRoaXMuY29udGV4dC50YXJnZXQucG9zaXRpb24oKSApO1xuXHRpZihkaXMgPCA4MCkge1xuXHRcdHRoaXMuY291bnQgPSAyMDtcblx0XHR0aGlzLmNvbnRleHQuc3RhdHVzID0gTW9iaWxlVW5pdENvbnRleHQuU1RBVFVTLkdBVEhFUklORztcblx0fVxufVxuXG5CYXNlTW9iaWxlVW5pdC5wcm90b3R5cGUuZXhlY3V0ZV9tb3ZpbmdfdG9fdW5pdCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cbn1cblxuQmFzZU1vYmlsZVVuaXQucHJvdG90eXBlLmV4ZWN1dGVfcmV0dXJuaW5nID0gZnVuY3Rpb24oZXZlbnQpIHtcblx0dGhpcy5tb3ZpbmdQcm9jZXNzKCk7XG5cdHZhciBkaXMgPSBNYXRoMkQuUG9pbnQyRC5kaXN0YW5jZSggdGhpcy5wb3NpdGlvbigpLCB0aGlzLmNvbnRleHQudGFyZ2V0LnBvc2l0aW9uKCkgKTtcblx0aWYoZGlzIDwgODApIHtcblx0XHRjb25zb2xlLmxvZyhcInJldHVybmVkXCIpO1xuXHRcdHRoaXMucGxheWVyLmFkZFJlc291cmNlKCd0cmVlJywgdGhpcy5jb250ZXh0LmdhdGhlcmluZ19hbW91bnQpO1xuXHRcdHRoaXMuY29udGV4dC5nYXRoZXJpbmdfYW1vdW50ID0gMDtcblx0XHR0aGlzLmNvdW50ID0gMjA7XG5cdFx0dmFyIG5hdHVyZSA9IHRoaXMubWFwLnVuaXRNYW5hZ2VyLmdldE5lYXJOYXR1cmUoKTtcblx0XHR0aGlzLmNvbnRleHQudGFyZ2V0ID0gbmF0dXJlWzBdO1xuXHRcdHRoaXMubW92ZV90b190YXJnZXQodGhpcy5jb250ZXh0LnRhcmdldCk7XG5cdH1cblxufVxuXG5CYXNlTW9iaWxlVW5pdC5wcm90b3R5cGUuZXhlY3V0ZV9hdHRhY2tpbmcgPSBmdW5jdGlvbihldmVudCkge1xuXHRpZihldmVudC5uYW1lID09IFwid2l0aGluIHJhbmdlXCIpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0c3RhdGU6IFNUQVRFLkFUVEFDS0lORyxcblx0XHRcdHRhcmdldDogZXZlbnQuY29udGV4dC50YXJnZXRcblx0XHR9XG5cdH1lbHNlIGlmKGV2ZW50Lm5hbWUgPT0gXCJub3Qgd2l0aGluIHJhbmdlXCIpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0c3RhdGU6IFNUQVRFLk1PVklORyxcblx0XHRcdHRhcmdldDogZXZlbnQuY29udGV4dC50YXJnZXRcblx0XHR9XG5cdH1cbn1cblxuQmFzZU1vYmlsZVVuaXQucHJvdG90eXBlLmV4ZWN1dGVfZ2F0aGVyaW5nID0gZnVuY3Rpb24oZXZlbnQpIHtcblx0dGhpcy5jb3VudC0tO1xuXHRpZih0aGlzLmNvdW50IDw9IDApIHtcblx0XHR0aGlzLmNvdW50ID0gMjA7XG5cdFx0dGhpcy5jb250ZXh0LmdhdGhlcmluZ19hbW91bnQgKz0gdGhpcy5jb250ZXh0LnRhcmdldC5kZWNyZWFzZSgxKTtcblx0XHRpZih0aGlzLmNvbnRleHQuZ2F0aGVyaW5nX2Ftb3VudCA9PSAxMCkge1xuXHRcdFx0dmFyIGJ1aWxkaW5ncyA9IHRoaXMubWFwLnVuaXRNYW5hZ2VyLmdldE5lYXJCdWlsZGluZygpO1xuXHRcdFx0dGhpcy5yZXR1cm5fdG9fdGFyZ2V0KCBidWlsZGluZ3NbMF0gKTtcblx0XHR9XG5cdH1cbn1cblxuQmFzZU1vYmlsZVVuaXQucHJvdG90eXBlLmV4ZWN1dGVfcmVwYWlyaW5nID0gZnVuY3Rpb24oZXZlbnQpIHtcblxufVxuXG5CYXNlTW9iaWxlVW5pdC5wcm90b3R5cGUubW92aW5nUHJvY2VzcyA9IGZ1bmN0aW9uKCkge1xuXHRpZih0aGlzLm5leHREZXN0aW5hdGlvbikge1xuXHRcdC8v5qyh44Gu55uu55qE5Zyw44GM44GC44KL5aC05ZCIXG5cdFx0dGhpcy5wb3MgPSB0aGlzLnBvcy5hZGQodGhpcy52ZWMpO1xuXHRcdGlmKHRoaXMubWFwLmhpdCh0aGlzKSkge1xuXHRcdFx0dGhpcy5wb3MgPSB0aGlzLnBvcy5zdWIodGhpcy52ZWMpO1xuXHRcdFx0dGhpcy5jb3VudDItLTtcblx0XHRcdGlmKHRoaXMuY291bnQyIDw9IDApIHtcblx0XHRcdFx0aWYodGhpcy5jb250ZXh0LnN0YXR1cyA9PSBNb2JpbGVVbml0Q29udGV4dC5TVEFUVVMuTU9WSU5HX1RPX1BPUykge1xuXHRcdFx0XHRcdHRoaXMubW92ZV90b19wb3ModGhpcy5jb250ZXh0LmRlc3QpO1xuXHRcdFx0XHR9ZWxzZXtcblx0XHRcdFx0XHR0aGlzLm1vdmVfdG9fdGFyZ2V0KHRoaXMuY29udGV4dC50YXJnZXQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fWVsc2V7XG5cdFx0XHR0aGlzLmNvdW50LS07XG5cdFx0fVxuXHRcdHRoaXMuZ3JhcGhpYy5zZXRQb3ModGhpcy5wb3MuZ2V0WCgpLCB0aGlzLnBvcy5nZXRZKCkpO1xuXHRcdC8vbmV4dERlc3RpbmF0aW9u44Gr44Gk44GE44Gf5aC05ZCIXG5cdFx0aWYodGhpcy5jb3VudCA8PSAwKSB0aGlzLm5leHREZXN0aW5hdGlvbiA9IG51bGw7XG5cdH1lbHNle1xuXHRcdC8v5qyh44Gu55uu55qE5Zyw44GM44Gq44GE5aC05ZCIXG5cdFx0dGhpcy5jb3VudCA9IDA7XG5cdFx0dGhpcy5uZXh0RGVzdGluYXRpb24gPSB0aGlzLnF1ZXVlLnNoaWZ0KCk7XG5cdFx0aWYodGhpcy5uZXh0RGVzdGluYXRpb24pIHtcblx0XHRcdHZhciB2ZWMgPSB0aGlzLm5leHREZXN0aW5hdGlvbi5zdWIodGhpcy5wb3MpO1xuXHRcdFx0dGhpcy5ncmFwaGljLnJvdGF0ZSggTWF0aC5hdGFuKHZlYy5nZXRZKCkgLyB2ZWMuZ2V0WCgpKSAvIE1hdGguUEkgKiAxODAgKyA5MCApO1xuXHRcdFx0dGhpcy52ZWMgPSB2ZWMudGltZXMoMS81MCk7XG5cdFx0XHR0aGlzLmNvdW50ID0gNTA7XG5cdFx0XHR0aGlzLmNvdW50MiA9IDIwMDtcblx0XHR9XG5cdH1cbn1cblxuXG5CYXNlTW9iaWxlVW5pdC5wcm90b3R5cGUubW92ZSA9IGZ1bmN0aW9uKGQpIHtcblx0dGhpcy5xdWV1ZS5wdXNoKGQpO1xufVxuXG5CYXNlTW9iaWxlVW5pdC5wcm90b3R5cGUubW92ZV90b19wb3MgPSBmdW5jdGlvbihwb3MpIHtcblx0dGhpcy5tYWtlX3JvdXRlKCBwb3MgKTtcblx0dGhpcy5jb250ZXh0LnN0YXR1cyA9IE1vYmlsZVVuaXRDb250ZXh0LlNUQVRVUy5NT1ZJTkdfVE9fUE9TO1xuXHR0aGlzLmNvbnRleHQuZGVzdCA9IG5ldyBNYXRoMkQuUG9pbnQyRChwb3MueCwgcG9zLnkpO1xufVxuXG5CYXNlTW9iaWxlVW5pdC5wcm90b3R5cGUubW92ZV90b190YXJnZXQgPSBmdW5jdGlvbih1bml0KSB7XG5cdHRoaXMubWFrZV9yb3V0ZSggdW5pdC5wb3NpdGlvbigpICk7XG5cdGlmKHVuaXQuaW5mby50eXBlID09IFwibmF0dXJlXCIpIHtcblx0XHR0aGlzLmNvbnRleHQuc3RhdHVzID0gTW9iaWxlVW5pdENvbnRleHQuU1RBVFVTLk1PVklOR19UT19SRVNPVVJDRTtcblx0fWVsc2UgaWYodW5pdC5pbmZvLnR5cGUgPT0gXCJidWlsZGluZ1wiKSB7XG5cdFx0dGhpcy5jb250ZXh0LnN0YXR1cyA9IE1vYmlsZVVuaXRDb250ZXh0LlNUQVRVUy5NT1ZJTkdfVE9fQlVJTERJTkc7XG5cdH1cblx0dGhpcy5jb250ZXh0LnRhcmdldCA9IHVuaXQ7XG59XG5cbkJhc2VNb2JpbGVVbml0LnByb3RvdHlwZS5yZXR1cm5fdG9fdGFyZ2V0ID0gZnVuY3Rpb24odW5pdCkge1xuXHRpZih1bml0LmluZm8udHlwZSA9PSBcImJ1aWxkaW5nXCIpIHtcblx0XHR0aGlzLm1ha2Vfcm91dGUoIHVuaXQucG9zaXRpb24oKSApO1xuXHRcdHRoaXMuY29udGV4dC5zdGF0dXMgPSBNb2JpbGVVbml0Q29udGV4dC5TVEFUVVMuUkVUVVJOSU5HO1xuXHRcdHRoaXMuY29udGV4dC50YXJnZXQgPSB1bml0O1xuXHR9ZWxzZXtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJpbnZhbGlkIHVuaXQgdHlwZVwiKTtcblx0fVxufVxuXG5CYXNlTW9iaWxlVW5pdC5wcm90b3R5cGUubWFrZV9yb3V0ZSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0aWYoeCBpbnN0YW5jZW9mIE1hdGgyRC5Qb2ludDJEKSB7XG5cdFx0eSA9IHguZ2V0WSgpO1xuXHRcdHggPSB4LmdldFgoKTtcblx0fVxuXHR2YXIgdGhhdCA9IHRoaXM7XG5cblx0Ly9jbGVhclxuXHR0aGlzLmNvdW50LS07XG5cdHRoaXMucXVldWUgPSBbXTtcblxuXHR2YXIgc3RhcnRQb3MgPSB0aGlzLnBvc2l0aW9uVGlsZSgpO1xuXHR2YXIgZW5kUG9zID0gbmV3IE1hdGgyRC5Qb2ludDJEKE1hdGguZmxvb3IoeCAvIDUwKSwgTWF0aC5mbG9vcih5IC8gNTApKTtcblxuXHR2YXIgY29sbEdyYXBoID0gdGhpcy5tYXAuZ2V0Q29sbEdyYXBoKHtcblx0XHRleGNlcHQgOiBbc3RhcnRQb3MsIGVuZFBvc11cblx0fSk7XG5cdHZhciBncmFwaCA9IG5ldyBhc3Rhci5HcmFwaChjb2xsR3JhcGgpO1xuXHRsb2dnZXIoJ3dhbGtGcm9tJywgc3RhcnRQb3MuZ2V0WCgpLCBzdGFydFBvcy5nZXRZKCkpO1xuXHRsb2dnZXIoJ3dhbGtUbycsIGVuZFBvcy5nZXRYKCksIGVuZFBvcy5nZXRZKCkpO1xuICAgIHZhciBzdGFydCA9IGdyYXBoLmdyaWRbc3RhcnRQb3MuZ2V0WCgpXVtzdGFydFBvcy5nZXRZKCldO1xuICAgIHZhciBlbmQgPSBncmFwaC5ncmlkWyBlbmRQb3MuZ2V0WCgpIF1bIGVuZFBvcy5nZXRZKCkgXTtcbiAgICB2YXIgcmVzdWx0ID0gYXN0YXIuYXN0YXIuc2VhcmNoKGdyYXBoLCBzdGFydCwgZW5kKTtcblxuICAgIHJlc3VsdC5tYXAoZnVuY3Rpb24oZ3JpZE5vZGUpIHtcblx0XHR0aGF0LnF1ZXVlLnB1c2gobmV3IE1hdGgyRC5Qb2ludDJEKGdyaWROb2RlLngqNTAsIGdyaWROb2RlLnkqNTApKTtcbiAgICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBCYXNlTW9iaWxlVW5pdDsiLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcbnZhciBCYXNlVW5pdCA9IHJlcXVpcmUoJy4vQmFzZVVuaXQnKTtcblxuZnVuY3Rpb24gTmF0dXJlVW5pdFN0YXR1cygpIHtcblx0cmV0dXJuIHtcblx0XHRzdGF0dXMgOiBOYXR1cmVVbml0U3RhdHVzLlNUQVRVU19CVUlMRElORyxcblx0XHRkaXN0IDogbnVsbFxuXHR9XG59XG5OYXR1cmVVbml0U3RhdHVzLlNUQVRVU19CVUlMRElORyA9IDE7XG5OYXR1cmVVbml0U3RhdHVzLlNUQVRVU19OT1JNQUwgPSAyO1xuXG5mdW5jdGlvbiBCYXNlTmF0dXJlVW5pdChncmFwaGljLCBpbmZvLCBtYXApIHtcblx0QmFzZVVuaXQuY2FsbCh0aGlzLCBncmFwaGljLCBpbmZvLCBtYXApO1xuXHR0aGlzLmFtb3VudCA9IDEwMDtcbn1cblxudXRpbC5pbmhlcml0cyhCYXNlTmF0dXJlVW5pdCwgQmFzZVVuaXQpO1xuXG5CYXNlTmF0dXJlVW5pdC5wcm90b3R5cGUuZGVjcmVhc2UgPSBmdW5jdGlvbihhbW91bnQpIHtcblx0dGhpcy5hbW91bnQgLT0gYW1vdW50O1xuXHRpZih0aGlzLmFtb3VudCA8IDApIHtcblx0XHR2YXIgbGVmdCA9IC0xICogdGhpcy5hbW91bnQ7XG5cdFx0dGhpcy5hbW91bnQgPSAwO1xuXHRcdHRoaXMubWFwLnVuaXRNYW5hZ2VyLnJlbW92ZSh0aGlzLmdldElkKCkpO1xuXHRcdGNvbnNvbGUubG9nKGxlZnQpO1xuXHRcdHJldHVybiBhbW91bnQgLSBsZWZ0O1xuXHR9ZWxzZXtcblx0XHRyZXR1cm4gYW1vdW50O1xuXHR9XG59XG5cbkJhc2VOYXR1cmVVbml0LnByb3RvdHlwZS5tYWluID0gZnVuY3Rpb24oKSB7XG59XG5cbkJhc2VOYXR1cmVVbml0LnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gdGhpcy5hbW91bnQ7XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBCYXNlTmF0dXJlVW5pdDtcbiIsInZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudGVtaXR0ZXIyJykuRXZlbnRFbWl0dGVyMjtcbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xudmFyIHV1aWQgPSByZXF1aXJlKCd1dWlkJyk7XG52YXIgTWF0aDJEID0gcmVxdWlyZSgnLi9tYXRoMmQnKTtcblxuZnVuY3Rpb24gQmFzZVVuaXQoZ3JhcGhpYywgaW5mbywgbWFwLCBwbGF5ZXIpIHtcblx0dmFyIHRoYXQgPSB0aGlzO1xuXHRFdmVudEVtaXR0ZXIuY2FsbCh0aGlzKTtcblx0dGhhdC5ncmFwaGljID0gZ3JhcGhpYztcblx0dGhpcy5pbmZvID0gaW5mbztcblx0dGhpcy5pZCA9IHV1aWQoKTtcblx0dGhpcy5tYXAgPSBtYXA7XG5cdHRoaXMucGxheWVyID0gcGxheWVyO1xuXHR0aGlzLnBvcyA9IG5ldyBNYXRoMkQuUG9pbnQyRCgwLCAwKTtcblx0aWYoaW5mby5zaXplIGluc3RhbmNlb2YgQXJyYXkpIHtcblx0XHR0aGF0LmdyYXBoaWMuc2V0U2l6ZShpbmZvLnNpemVbMF0gKiA1MCwgaW5mby5zaXplWzFdICogNTApO1xuXHR9ZWxzZXtcblx0XHR0aGF0LmdyYXBoaWMuc2V0U2l6ZShpbmZvLnNpemUgKiA1MCwgaW5mby5zaXplICogNTApO1xuXHR9XG5cdHRoaXMuZ3JhcGhpYy5jbGljayhmdW5jdGlvbihlKSB7XG5cdFx0Y29uc29sZS5sb2coXCJtb3VzZXVwXCIsIGUuYnV0dG9uKTtcblx0XHR0aGF0LmVtaXQoJ2NsaWNrJywgZSk7XG5cdH0pO1xufVxuXG51dGlsLmluaGVyaXRzKEJhc2VVbml0LCBFdmVudEVtaXR0ZXIpO1xuXG5CYXNlVW5pdC5wcm90b3R5cGUuZ2V0SWQgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHRoaXMuaWQ7XG59XG5cbkJhc2VVbml0LnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHRoaXMuZ3JhcGhpYy5yZW1vdmUoKTtcbn1cblxuQmFzZVVuaXQucHJvdG90eXBlLmNvbGxCb3VuZCA9IGZ1bmN0aW9uKCkge1xuXHR2YXIgb2Zmc2V0ID0gNTtcblx0dmFyIGluZm8gPSB0aGlzLmluZm87XG5cdGlmKGluZm8udHlwZSA9PSAndHJhaW5hYmxlJykgb2Zmc2V0ID0gMTU7XG5cdGlmKGluZm8uc2l6ZS5sZW5ndGggPT0gMikge1xuXHRcdHZhciB3ID0gaW5mby5zaXplWzBdICogNTA7XG5cdFx0dmFyIGggPSBpbmZvLnNpemVbMV0gKiA1MDtcblx0fWVsc2V7XG5cdFx0dmFyIHcgPSBpbmZvLnNpemUgKiA1MDtcblx0XHR2YXIgaCA9IGluZm8uc2l6ZSAqIDUwO1xuXHR9XG5cdHJldHVybiB7XG5cdFx0eCA6IHRoaXMucG9zLmdldFgoKStvZmZzZXQsXG5cdFx0eSA6IHRoaXMucG9zLmdldFkoKStvZmZzZXQsXG5cdFx0dyA6IHcgLSBvZmZzZXQqMixcblx0XHRoIDogaCAtIG9mZnNldCoyXG5cdH1cbn1cblxuQmFzZVVuaXQucHJvdG90eXBlLnBvc2l0aW9uID0gZnVuY3Rpb24oeCwgeSkge1xuXHRpZih4ID09PSB1bmRlZmluZWQgJiYgeSA9PSB1bmRlZmluZWQpIHJldHVybiB0aGlzLnBvcztcblx0dGhpcy5wb3Muc2V0TG9jYXRpb24oeCwgeSk7XG5cdHRoaXMuZ3JhcGhpYy5zZXRQb3MoeCwgeSk7XG59XG5cbkJhc2VVbml0LnByb3RvdHlwZS5wb3NpdGlvblRpbGUgPSBmdW5jdGlvbih4LCB5KSB7XG5cdGlmKHggPT09IHVuZGVmaW5lZCAmJiB5ID09IHVuZGVmaW5lZCkgcmV0dXJuIG5ldyBNYXRoMkQuUG9pbnQyRCggTWF0aC5mbG9vcih0aGlzLnBvcy5nZXRYKCkgLyA1MCksIE1hdGguZmxvb3IodGhpcy5wb3MuZ2V0WSgpIC8gNTApKTtcblx0eCAqPSA1MDtcblx0eSAqPSA1MDtcblx0dGhpcy5wb3Muc2V0TG9jYXRpb24oeCwgeSk7XG5cdHRoaXMuZ3JhcGhpYy5zZXRQb3MoeCwgeSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQmFzZVVuaXQ7IiwidmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50ZW1pdHRlcjInKS5FdmVudEVtaXR0ZXIyO1xudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG52YXIgUmVjdGFuZ2xlU2VsZWN0b3IgPSByZXF1aXJlKCcuLi91aS9yZWN0YW5nbGVTZWxlY3RvcicpO1xudmFyIE1hdGgyRCA9IHJlcXVpcmUoJy4vbWF0aDJkJyk7XG5cbmZ1bmN0aW9uIE1hcChzbmFwKSB7XG5cdHZhciB0aGF0ID0gdGhpcztcblx0RXZlbnRFbWl0dGVyLmNhbGwodGhpcyk7XG5cdHRoaXMud2lkdGggPSA4MDtcblx0dGhpcy5oZWlnaHQgPSA4MDtcblx0dmFyIHdpZHRoID0gMjAwMDtcblx0dmFyIGhlaWdodCA9IDIwMDA7XG5cdFJlY3RhbmdsZVNlbGVjdG9yLnNuYXAgPSBzbmFwO1xuXHR0aGlzLmNvbGwgPSBzbmFwLnJlY3QoMCwgMCwgd2lkdGgsIGhlaWdodCk7XG5cdHRoaXMuY29sbC5hdHRyKHtcblx0XHRmaWxsIDogXCIjN2Y3XCJcblx0fSk7XG5cdHRoaXMuY29sbC5kcmFnKGZ1bmN0aW9uKGR4LCBkeSkge1xuXHRcdFJlY3RhbmdsZVNlbGVjdG9yLm1vdmUoZHgsIGR5KTtcblx0fSwgZnVuY3Rpb24oeCwgeSwgZSkge1xuXHRcdGNvbnNvbGUubG9nKCdzdGFydCcsIGUucGFnZVgsIGUucGFnZVkpO1xuXHRcdFJlY3RhbmdsZVNlbGVjdG9yLnN0YXJ0KGUucGFnZVgsIGUucGFnZVkpO1xuXHR9LCBmdW5jdGlvbigpIHtcblx0XHRSZWN0YW5nbGVTZWxlY3Rvci5lbmQoKTtcblx0XHR2YXIgdW5pdHMgPSB0aGF0LnVuaXRNYW5hZ2VyLmdldFRyYWluYWJsZVVuaXRzKCkuZmlsdGVyKGZ1bmN0aW9uKHVuaXQpIHtcblx0XHRcdHJldHVybiBSZWN0YW5nbGVTZWxlY3Rvci5pc0NvbnRhaW4odW5pdC5wb3NpdGlvbigpKVxuXHRcdH0pO1xuXHRcdHRoYXQuZW1pdCgnc2VsZWN0ZWQnLCB1bml0cyk7XG5cdH0pO1xuXHR0aGlzLmNvbGwubW91c2Vkb3duKGZ1bmN0aW9uKGUpIHtcblx0XHRpZihlLmJ1dHRvbiA9PSAwKSB7XG5cdFx0XHR0aGF0LmVtaXQoJ2NsaWNrJywge1xuXHRcdFx0XHR4IDogZS5wYWdlWCxcblx0XHRcdFx0eSA6IGUucGFnZVlcblx0XHRcdH0pO1xuXHRcdH1lbHNlIGlmKGUuYnV0dG9uID09IDIpIHtcblx0XHRcdGNvbnNvbGUubG9nKGUpO1xuXHRcdFx0dGhhdC5lbWl0KCd0YXJnZXQnLCB7XG5cdFx0XHRcdHBvczogbmV3IE1hdGgyRC5Qb2ludDJEKGUucGFnZVgsIGUucGFnZVkpXG5cdFx0XHR9KTtcblx0XHR9XG5cdH0pO1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwiY29udGV4dG1lbnVcIiwgZnVuY3Rpb24oZSl7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB9LCBmYWxzZSk7XG59XG5cbnV0aWwuaW5oZXJpdHMoTWFwLCBFdmVudEVtaXR0ZXIpO1xuXG5NYXAucHJvdG90eXBlLnNldFVuaXRNYW5hZ2VyID0gZnVuY3Rpb24odW5pdE1hbmFnZXIpIHtcblx0dGhpcy51bml0TWFuYWdlciA9IHVuaXRNYW5hZ2VyO1xufVxuXG5NYXAucHJvdG90eXBlLmhpdCA9IGZ1bmN0aW9uKHRhcmdldFVuaXQpIHtcblx0cmV0dXJuIHRoaXMudW5pdE1hbmFnZXIuZ2V0VW5pdHMoKS5maWx0ZXIoZnVuY3Rpb24odW5pdCkge1xuXHRcdHJldHVybiB1bml0LmdldElkKCkgIT0gdGFyZ2V0VW5pdC5nZXRJZCgpO1xuXHR9KS5tYXAoZnVuY3Rpb24odSkge1xuXHRcdHJldHVybiB1LmNvbGxCb3VuZCgpO1xuXHR9KS5maWx0ZXIoZnVuY3Rpb24oYm91bmQpIHtcblx0XHR2YXIgdGFyZ2V0Qm91bmQgPSB0YXJnZXRVbml0LmNvbGxCb3VuZCgpO1xuXHRcdHJldHVybiAoYm91bmQueCA8IHRhcmdldEJvdW5kLnggKyB0YXJnZXRCb3VuZC53ICYmICB0YXJnZXRCb3VuZC54IDwgYm91bmQueCArIGJvdW5kLncgJiZcblx0XHRcdGJvdW5kLnkgPCB0YXJnZXRCb3VuZC55ICsgdGFyZ2V0Qm91bmQuaCAmJiAgdGFyZ2V0Qm91bmQueSA8IGJvdW5kLnkgKyBib3VuZC5oKTtcblx0fSkubGVuZ3RoID4gMDtcbn1cblxuTWFwLnByb3RvdHlwZS5nZXRDb2xsR3JhcGggPSBmdW5jdGlvbihfb3B0aW9ucykge1xuXHR2YXIgb3B0aW9ucyA9IF9vcHRpb25zIHx8IHt9O1xuXHR2YXIgdGhhdCA9IHRoaXM7XG5cdHZhciBncmFwaCA9IFtdO1xuXHRmb3IodmFyIGk9MDtpIDwgdGhpcy53aWR0aDtpKyspIHtcblx0XHR2YXIgd0dyYXBoID0gW11cblx0XHRmb3IodmFyIGo9MDtqIDwgdGhpcy5oZWlnaHQ7aisrKSB7XG5cdFx0XHR3R3JhcGgucHVzaCgxKTtcblx0XHR9XG5cdFx0Z3JhcGgucHVzaCh3R3JhcGgpO1xuXHR9XG5cdHRoaXMudW5pdE1hbmFnZXIuZ2V0Q29sbFVuaXRzKCkubWFwKGZ1bmN0aW9uKHUpIHtcblx0XHRpZih1LmluZm8uc2l6ZS5sZW5ndGggPT0gMikge1xuXHRcdFx0dmFyIHcgPSB1LmluZm8uc2l6ZVswXTtcblx0XHRcdHZhciBoID0gdS5pbmZvLnNpemVbMV07XG5cdFx0fWVsc2V7XG5cdFx0XHR2YXIgdyA9IHUuaW5mby5zaXplO1xuXHRcdFx0dmFyIGggPSB1LmluZm8uc2l6ZTtcblx0XHR9XG5cdFx0cmV0dXJuIHt4OnUucG9zaXRpb25UaWxlKCkuZ2V0WCgpLCB5OnUucG9zaXRpb25UaWxlKCkuZ2V0WSgpLCB3OncsIGg6aH0744CAXG5cdH0pLmZvckVhY2goZnVuY3Rpb24ocCkge1xuXHRcdGZvcih2YXIgaSA9IHAueDtpIDwgcC54ICsgcC53O2krKykge1xuXHRcdFx0Zm9yKHZhciBqID0gcC55O2ogPCBwLnkgKyBwLmg7aisrKSB7XG5cdFx0XHRcdGdyYXBoW2ldW2pdID0gMDtcblx0XHRcdH1cblx0XHR9XG5cdH0pO1xuXHRpZihvcHRpb25zLmV4Y2VwdCkge1xuXHRcdG9wdGlvbnMuZXhjZXB0LmZvckVhY2goZnVuY3Rpb24oZSkge1xuXHRcdFx0Z3JhcGhbZS5nZXRYKCldW2UuZ2V0WSgpXSA9IDE7XG5cdFx0fSk7XG5cdH1cblx0cmV0dXJuIGdyYXBoO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1hcDsiLCJ2YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRlbWl0dGVyMicpLkV2ZW50RW1pdHRlcjI7XG52YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcbnZhciBVbml0R3JhcGhpYyA9IHJlcXVpcmUoJy4uL2dyYXBoaWMvdW5pdEdyYXBoaWMnKTtcbnZhciBCYXNlTW9iaWxlVW5pdCA9IHJlcXVpcmUoJy4vQmFzZU1vYmlsZVVuaXQnKTtcbnZhciBCYXNlTmF0dXJlVW5pdCA9IHJlcXVpcmUoJy4vQmFzZU5hdHVyZVVuaXQnKTtcblxuZnVuY3Rpb24gVW5pdE1hbmFnZXIoKSB7XG5cdEV2ZW50RW1pdHRlci5jYWxsKHRoaXMpO1xuXHR0aGlzLm1ldGFVbml0cyA9IHt9O1xuXHR0aGlzLnVuaXRzID0ge307XG59XG5cbnV0aWwuaW5oZXJpdHMoVW5pdE1hbmFnZXIsIEV2ZW50RW1pdHRlcik7XG5cblVuaXRNYW5hZ2VyLnByb3RvdHlwZS5zZXRNYXAgPSBmdW5jdGlvbihtYXApIHtcblx0dGhpcy5tYXAgPSBtYXA7XG59XG5cblVuaXRNYW5hZ2VyLnByb3RvdHlwZS5sb2FkID0gZnVuY3Rpb24odW5pdHMpIHtcblx0dmFyIHRoYXQgPSB0aGlzO1xuXHR1bml0cy5tYXAoZnVuY3Rpb24odW5pdCkge1xuXHRcdHRoYXQubWV0YVVuaXRzW3VuaXQuaWRdID0gdW5pdDtcblx0fSk7XG59XG5cblVuaXRNYW5hZ2VyLnByb3RvdHlwZS5tYWluID0gZnVuY3Rpb24oKSB7XG5cdHZhciB0aGF0ID0gdGhpcztcblx0T2JqZWN0LmtleXModGhpcy51bml0cykubWFwKGZ1bmN0aW9uKGspIHtcblx0XHRpZih0aGF0LnVuaXRzW2tdKSB0aGF0LnVuaXRzW2tdLm1haW4oKTtcblx0fSk7XG59XG5cblVuaXRNYW5hZ2VyLnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbihzbmFwLCBtZXRhVW5pdElkLCBwbGF5ZXIpIHtcblx0dmFyIHRoYXQgPSB0aGlzO1xuXHR2YXIgbWV0YVVuaXQgPSB0aGlzLm1ldGFVbml0c1ttZXRhVW5pdElkXTtcblx0dmFyIHVnID0gbmV3IFVuaXRHcmFwaGljKHNuYXAsIHtcblx0XHRwYXRoIDogJ2ltYWdlcy8nICsgbWV0YVVuaXQuZ3JhcGhpYy5wYXRoLFxuXHRcdHdpZHRoIDogbWV0YVVuaXQuZ3JhcGhpYy53aWR0aCxcblx0XHRoZWlnaHQgOiBtZXRhVW5pdC5ncmFwaGljLmhlaWdodCxcblx0fSk7XG5cdGlmKG1ldGFVbml0LnVuaXRpbmZvLnR5cGUgPT0gJ25hdHVyZScpIHtcblx0XHR2YXIgcGVyc29uID0gbmV3IEJhc2VOYXR1cmVVbml0KHVnLCBtZXRhVW5pdC51bml0aW5mbywgdGhpcy5tYXAsIHBsYXllcik7XG5cdH1lbHNle1xuXHRcdHZhciBwZXJzb24gPSBuZXcgQmFzZU1vYmlsZVVuaXQodWcsIG1ldGFVbml0LnVuaXRpbmZvLCB0aGlzLm1hcCwgcGxheWVyKTtcblx0fVxuXHRwZXJzb24ub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuXHRcdGlmKGUuYnV0dG9uID09IDIpIHtcblx0XHRcdHRoYXQuZW1pdCgndGFyZ2V0Jywge3VuaXQgOiBwZXJzb24sIGV2ZW50IDogZX0pO1xuXHRcdH1lbHNle1xuXHRcdFx0Ly9UT0RPOlxuXHRcdFx0dGhhdC5zZWxlY3RlZCA9IHBlcnNvbjtcblx0XHRcdC8vXG5cdFx0XHR0aGF0LmVtaXQoJ2NsaWNrJywge3VuaXQgOiBwZXJzb24sIGV2ZW50IDogZX0pO1xuXHRcdH1cblx0fSk7XG5cdHRoaXMudW5pdHNbcGVyc29uLmlkXSA9IHBlcnNvbjtcblx0cmV0dXJuIHBlcnNvbjtcbn1cblxuVW5pdE1hbmFnZXIucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uKGlkKSB7XG5cdGlmKHRoaXMudW5pdHNbaWRdKSB7XG5cdFx0dGhpcy51bml0c1tpZF0ucmVtb3ZlKCk7XG5cdFx0ZGVsZXRlIHRoaXMudW5pdHNbaWRdO1xuXHR9XG59XG5cblVuaXRNYW5hZ2VyLnByb3RvdHlwZS5nZXRVbml0cyA9IGZ1bmN0aW9uKCkge1xuXHR2YXIgdGhhdCA9IHRoaXM7XG5cdHJldHVybiBPYmplY3Qua2V5cyh0aGlzLnVuaXRzKS5tYXAoZnVuY3Rpb24oaykge1xuXHRcdHJldHVybiB0aGF0LnVuaXRzW2tdO1xuXHR9KTtcdFxufVxuXG5Vbml0TWFuYWdlci5wcm90b3R5cGUuZ2V0VHJhaW5hYmxlVW5pdHMgPSBmdW5jdGlvbigpIHtcblx0dmFyIHRoYXQgPSB0aGlzO1xuXHRyZXR1cm4gT2JqZWN0LmtleXModGhpcy51bml0cykubWFwKGZ1bmN0aW9uKGspIHtcblx0XHRyZXR1cm4gdGhhdC51bml0c1trXTtcblx0fSkuZmlsdGVyKGZ1bmN0aW9uKHVuaXQpIHtcblx0XHRyZXR1cm4gdW5pdC5pbmZvLnR5cGUgPT0gJ3RyYWluYWJsZSc7XG5cdH0pO1xufVxuXG5Vbml0TWFuYWdlci5wcm90b3R5cGUuZ2V0Q29sbFVuaXRzID0gZnVuY3Rpb24oKSB7XG5cdHZhciB0aGF0ID0gdGhpcztcblx0cmV0dXJuIE9iamVjdC5rZXlzKHRoaXMudW5pdHMpLm1hcChmdW5jdGlvbihrKSB7XG5cdFx0cmV0dXJuIHRoYXQudW5pdHNba107XG5cdH0pLyouZmlsdGVyKGZ1bmN0aW9uKHVuaXQpIHtcblx0XHRyZXR1cm4gdW5pdC5pbmZvLnR5cGUgPT0gJ2J1aWxkaW5nJyB8fCB1bml0LmluZm8udHlwZSA9PSAnbmF0dXJlJztcblx0fSk7Ki9cbn1cblxuVW5pdE1hbmFnZXIucHJvdG90eXBlLmdldE5lYXJOYXR1cmUgPSBmdW5jdGlvbigpIHtcblx0dmFyIHRoYXQgPSB0aGlzO1xuXHRyZXR1cm4gT2JqZWN0LmtleXModGhpcy51bml0cykubWFwKGZ1bmN0aW9uKGspIHtcblx0XHRyZXR1cm4gdGhhdC51bml0c1trXTtcblx0fSkuZmlsdGVyKGZ1bmN0aW9uKHVuaXQpIHtcblx0XHRyZXR1cm4gdW5pdC5pbmZvLnR5cGUgPT0gJ25hdHVyZSc7XG5cdH0pO1xufVxuXG5Vbml0TWFuYWdlci5wcm90b3R5cGUuZ2V0TmVhckJ1aWxkaW5nID0gZnVuY3Rpb24oKSB7XG5cdHZhciB0aGF0ID0gdGhpcztcblx0cmV0dXJuIE9iamVjdC5rZXlzKHRoaXMudW5pdHMpLm1hcChmdW5jdGlvbihrKSB7XG5cdFx0cmV0dXJuIHRoYXQudW5pdHNba107XG5cdH0pLmZpbHRlcihmdW5jdGlvbih1bml0KSB7XG5cdFx0cmV0dXJuIHVuaXQuaW5mby50eXBlID09ICdidWlsZGluZyc7XG5cdH0pO1xufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gVW5pdE1hbmFnZXI7IiwidmFyIFNuYXAgPSByZXF1aXJlKCcuLi8uLi90aGlyZHBhcnR5L3NuYXAuc3ZnJyk7XG52YXIgVW5pdE1hbmFnZXIgPSByZXF1aXJlKCcuL1VuaXRNYW5hZ2VyJyk7XG52YXIgdW5pdEluZm8gPSByZXF1aXJlKCcuLi91bml0Jyk7XG52YXIgQ29udHJvbFBhbmVsID0gcmVxdWlyZSgnLi4vdWkvY29udHJvbFBhbmVsJyk7XG52YXIgTWFwID0gcmVxdWlyZSgnLi9NYXAnKTtcbnZhciBQbGF5ZXIgPSByZXF1aXJlKCcuL3BsYXllcicpO1xuXG5mdW5jdGlvbiBHYW1lKHJlcXVlc3RBbmltYXRpb25GcmFtZSkge1xuXHR0aGlzLnN0YXJ0KHJlcXVlc3RBbmltYXRpb25GcmFtZSk7XG59XG5cbkdhbWUucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24ocmVxdWVzdEFuaW1hdGlvbkZyYW1lKSB7XG5cdHZhciBjb250cm9sUGFuZWwgPSBuZXcgQ29udHJvbFBhbmVsKCk7XG5cdHZhciBtYWluRG9tID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21haW4nKTtcblx0dmFyIHN2ZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIFwic3ZnXCIpO1xuICAgIHN2Zy5zZXRBdHRyaWJ1dGVOUyhudWxsLCAnd2lkdGgnLCAyMDAwKTtcbiAgICBzdmcuc2V0QXR0cmlidXRlTlMobnVsbCwgJ2hlaWdodCcsIDIwMDApO1xuXHRtYWluRG9tLmFwcGVuZENoaWxkKHN2Zyk7XG5cblx0dmFyIHNuYXAgPSBTbmFwKHN2Zyk7XG5cdHZhciB1bml0TWFuYWdlciA9IG5ldyBVbml0TWFuYWdlcigpO1xuXHR1bml0TWFuYWdlci5sb2FkKHVuaXRJbmZvKTtcblxuXHR2YXIgbWFwID0gbmV3IE1hcChzbmFwKTtcblx0Ly9tYXAuZ2VuZXJhdGUoMCk7XG5cblx0bWFwLnNldFVuaXRNYW5hZ2VyKHVuaXRNYW5hZ2VyKTtcblx0dW5pdE1hbmFnZXIuc2V0TWFwKG1hcCk7XG5cdHZhciBwbGF5ZXIxID0gbmV3IFBsYXllcih7dHlwZTogUGxheWVyLlRZUEVfSFVNQU59KTtcblx0dmFyIHBsYXllcjIgPSBuZXcgUGxheWVyKHt0eXBlOiBQbGF5ZXIuVFlQRV9FTkVNWX0pO1xuXHR2YXIgcGxheWVyX2dhaWEgPSBuZXcgUGxheWVyKHt0eXBlOiBQbGF5ZXIuVFlQRV9HQUlBfSk7XG5cblxuXHRwbGF5ZXIxLm9uKCd1cGRhdGUnLCBmdW5jdGlvbigpIHtcblx0XHR2YXIgcmVzb3VyY2VfdHJlZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXNvdXJjZS10cmVlJyk7XG5cdFx0cmVzb3VyY2VfdHJlZS50ZXh0Q29udGVudCA9IHBsYXllcjEucmVzb3VyY2UoJ3RyZWUnKTtcblx0fSk7XG5cdHVuaXRNYW5hZ2VyLmNyZWF0ZShzbmFwLCAndG93bicsIHBsYXllcjEpLnBvc2l0aW9uKDI1MCwgMTUwKTtcblx0dW5pdE1hbmFnZXIuY3JlYXRlKHNuYXAsICd2aWxsYWdlcicsIHBsYXllcjEpLnBvc2l0aW9uKDEwMCwgNTApO1xuXHR1bml0TWFuYWdlci5jcmVhdGUoc25hcCwgJ3ZpbGxhZ2VyJywgcGxheWVyMSkucG9zaXRpb24oMTAwLCAxMDApO1xuXHR1bml0TWFuYWdlci5jcmVhdGUoc25hcCwgJ3ZpbGxhZ2VyJywgcGxheWVyMSkucG9zaXRpb24oNTAsIDE1MCk7XG5cdHVuaXRNYW5hZ2VyLmNyZWF0ZShzbmFwLCAndmlsbGFnZXInLCBwbGF5ZXIxKS5wb3NpdGlvbigyMDAsIDIwMCk7XG5cdHVuaXRNYW5hZ2VyLmNyZWF0ZShzbmFwLCAndmlsbGFnZXInLCBwbGF5ZXIyKS5wb3NpdGlvbigyMDAsIDI1MCk7XG5cdHVuaXRNYW5hZ2VyLmNyZWF0ZShzbmFwLCAndHJlZScsIHBsYXllcl9nYWlhKS5wb3NpdGlvbigxMDAsIDE1MCk7XG5cdHVuaXRNYW5hZ2VyLmNyZWF0ZShzbmFwLCAndHJlZScsIHBsYXllcl9nYWlhKS5wb3NpdGlvbig2MDAsIDE1MCk7XG5cdHVuaXRNYW5hZ2VyLmNyZWF0ZShzbmFwLCAndHJlZScsIHBsYXllcl9nYWlhKS5wb3NpdGlvbig2MDAsIDIwMCk7XG5cdHVuaXRNYW5hZ2VyLmNyZWF0ZShzbmFwLCAndHJlZScsIHBsYXllcl9nYWlhKS5wb3NpdGlvbig2MDAsIDI1MCk7XG5cdHVuaXRNYW5hZ2VyLmNyZWF0ZShzbmFwLCAndHJlZScsIHBsYXllcl9nYWlhKS5wb3NpdGlvbig0NTAsIDIwMCk7XG5cdHVuaXRNYW5hZ2VyLmNyZWF0ZShzbmFwLCAndHJlZScsIHBsYXllcl9nYWlhKS5wb3NpdGlvbig0MDAsIDMwMCk7XG5cdHVuaXRNYW5hZ2VyLmNyZWF0ZShzbmFwLCAndHJlZScsIHBsYXllcl9nYWlhKS5wb3NpdGlvbig0MDAsIDI1MCk7XG5cdHVuaXRNYW5hZ2VyLmNyZWF0ZShzbmFwLCAndHJlZScsIHBsYXllcl9nYWlhKS5wb3NpdGlvbigxNTAsIDUwKTtcblxuXHR2YXIgc2VsZWN0ZWQgPSBudWxsO1xuXHR1bml0TWFuYWdlci5vbigndGFyZ2V0JywgZnVuY3Rpb24oZSkge1xuXHRcdGlmKHNlbGVjdGVkKSB7XG5cdFx0XHRpZihzZWxlY3RlZCBpbnN0YW5jZW9mIEFycmF5KSB7XG5cdFx0XHRcdHNlbGVjdGVkLmZvckVhY2goZnVuY3Rpb24ocykge1xuXHRcdFx0XHRcdHMubW92ZV90b190YXJnZXQoZS51bml0KTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9ZWxzZXtcblx0XHRcdFx0c2VsZWN0ZWQubW92ZV90b190YXJnZXQoZS51bml0KTtcblx0XHRcdH1cblx0XHR9XHRcdFx0XG5cdH0pO1xuXHR1bml0TWFuYWdlci5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0c2VsZWN0ZWQgPSBlLnVuaXQ7XG5cdFx0Y29udHJvbFBhbmVsLnNldFRhcmdldChzZWxlY3RlZCk7XG5cdH0pO1xuXHRtYXAub24oJ3RhcmdldCcsIGZ1bmN0aW9uKGUpIHtcblx0XHRpZihzZWxlY3RlZCkge1xuXHRcdFx0aWYoc2VsZWN0ZWQgaW5zdGFuY2VvZiBBcnJheSkge1xuXHRcdFx0XHRzZWxlY3RlZC5mb3JFYWNoKGZ1bmN0aW9uKHMpIHtcblx0XHRcdFx0XHRzLm1vdmVfdG9fcG9zKGUucG9zKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9ZWxzZXtcblx0XHRcdFx0c2VsZWN0ZWQubW92ZV90b19wb3MoZS5wb3MpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG5cdG1hcC5vbignc2VsZWN0ZWQnLCBmdW5jdGlvbih1bml0cykge1xuXHRcdHNlbGVjdGVkID0gdW5pdHM7XG5cdH0pO1xuXG5cdGZ1bmN0aW9uIGdhbWVMb29wKCkge1xuXHRcdHVuaXRNYW5hZ2VyLm1haW4oKTtcblx0fVxuXHR2YXIgcmVjdXJzaXZlQW5pbSA9IGZ1bmN0aW9uKCkge1xuXHRcdGdhbWVMb29wKCk7XG5cdFx0cmVxdWVzdEFuaW1hdGlvbkZyYW1lKHJlY3Vyc2l2ZUFuaW0pXG5cdH1cblx0cmVxdWVzdEFuaW1hdGlvbkZyYW1lKHJlY3Vyc2l2ZUFuaW0pXG5cblx0dmFyIGdyYXBoID0gbWFwLmdldENvbGxHcmFwaCgpO1xuXHRmb3IodmFyIGk9MDtpIDwgZ3JhcGgubGVuZ3RoO2krKykge1xuXHRcdGZvcih2YXIgaj0wO2ogPCBncmFwaFtpXS5sZW5ndGg7aisrKSB7XG5cdFx0XHRpZihncmFwaFtpXVtqXSA9PSAwKSB7XG5cdFx0XHRcdHNuYXAucmVjdChpKjUwLCBqKjUwLCA0NSwgNDUpLmF0dHIoe1xuXHRcdFx0XHRcdHN0cm9rZSA6ICcjYTc3Jyxcblx0XHRcdFx0XHRmaWxsIDogJ25vbmUnLFxuXHRcdFx0XHRcdHN0cm9rZVdpZHRoIDogM1xuXHRcdFx0XHR9KTtcblx0XHRcdH1lbHNlIGlmKGdyYXBoW2ldW2pdID09IDEpIHtcblx0XHRcdFx0c25hcC5yZWN0KGkqNTAsIGoqNTAsIDQ1LCA0NSkuYXR0cih7XG5cdFx0XHRcdFx0c3Ryb2tlIDogJyM3N2InLFxuXHRcdFx0XHRcdGZpbGwgOiAnbm9uZScsXG5cdFx0XHRcdFx0c3Ryb2tlV2lkdGggOiAzXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEdhbWU7IiwiXG5mdW5jdGlvbiBQb2ludDJEKHgsIHkpIHtcblx0dGhpcy54ID0geDtcblx0dGhpcy55ID0geTtcbn1cblxuUG9pbnQyRC56ZXJvID0gbmV3IFBvaW50MkQoMCwgMCk7XG5cblBvaW50MkQuc3ViID0gZnVuY3Rpb24oYSxiKSB7XG5cdHJldHVybiBuZXcgUG9pbnQyRChhLnggLSBiLngsIGEueSAtIGIueSk7XG59XG5cblBvaW50MkQuYWRkID0gZnVuY3Rpb24oYSxiKSB7XG5cdHJldHVybiBuZXcgUG9pbnQyRChhLnggKyBiLngsIGEueSArIGIueSk7XG59XG5cblBvaW50MkQudGltZXMgPSBmdW5jdGlvbihhLHQpIHtcblx0cmV0dXJuIG5ldyBQb2ludDJEKGEueCAqIHQsIGEueSAqIHQpO1xufVxuXG5Qb2ludDJELnByb3RvdHlwZS5zdWIgPSBmdW5jdGlvbihhKSB7XG5cdHJldHVybiBQb2ludDJELnN1Yih0aGlzLCBhKTtcbn1cblxuUG9pbnQyRC5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24oYSkge1xuXHRyZXR1cm4gUG9pbnQyRC5hZGQodGhpcywgYSk7XG59XG5cblBvaW50MkQucHJvdG90eXBlLnRpbWVzID0gZnVuY3Rpb24oYSkge1xuXHRyZXR1cm4gUG9pbnQyRC50aW1lcyh0aGlzLCBhKTtcbn1cblxuXG5Qb2ludDJELnByb3RvdHlwZS5nZXRYID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiB0aGlzLng7XG59XG5cblBvaW50MkQucHJvdG90eXBlLmdldFkgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHRoaXMueTtcbn1cblxuXG5Qb2ludDJELnByb3RvdHlwZS5zZXRMb2NhdGlvbiA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0dGhpcy54ID0geDtcblx0dGhpcy55ID0geTtcbn1cblxuLypcbnB1YmxpYyBTdHJpbmcgdG9TdHJpbmcoKSB7XG4gICAgICAgIHJldHVybiBcIlBvaW50MkQuRG91YmxlW1wiK3grXCIsIFwiK3krXCJdXCI7XG4gICAgfVxuXG5cbiAgICBwdWJsaWMgdm9pZCBzZXRMb2NhdGlvbihQb2ludDJEIHApIHtcbiAgICAgICAgc2V0TG9jYXRpb24ocC5nZXRYKCksIHAuZ2V0WSgpKTtcbiAgICB9XG4gICAgKi9cblxuLypcblBvaW50MkQucHJvdG90eXBlLmRpc3RhbmNlU3EgPSBmdW5jdGlvbih4MSwgeTEsIHgyLCB5Mikge1xuICAgIHgxIC09IHgyO1xuICAgIHkxIC09IHkyO1xuICAgIHJldHVybiAoeDEgKiB4MSArIHkxICogeTEpO1xufVxuXG4gICAgcHVibGljIHN0YXRpYyBkb3VibGUgZGlzdGFuY2UoZG91YmxlIHgxLCBkb3VibGUgeTEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZG91YmxlIHgyLCBkb3VibGUgeTIpXG4gICAge1xuICAgICAgICB4MSAtPSB4MjtcbiAgICAgICAgeTEgLT0geTI7XG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQoeDEgKiB4MSArIHkxICogeTEpO1xuICAgIH1cbiovXG5Qb2ludDJELnByb3RvdHlwZS5kaXN0YW5jZVNxID0gZnVuY3Rpb24ocHgsIHB5KSB7XG5cdHB4IC09IHRoaXMuZ2V0WCgpO1xuXHRweSAtPSB0aGlzLmdldFkoKTtcblx0cmV0dXJuIChweCAqIHB4ICsgcHkgKiBweSk7XG59XG5cblBvaW50MkQuZGlzdGFuY2VTcSA9IGZ1bmN0aW9uKHAsIHEpIHtcbiAgICB2YXIgeHggPSBwLnggLSBxLng7XG4gICAgdmFyIHl5ID0gcC55IC0gcS55O1xuICAgIHJldHVybiAoeHggKiB4eCArIHl5ICogeXkpO1xufVxuXG5Qb2ludDJELmRpc3RhbmNlID0gZnVuY3Rpb24ocCwgcSkge1xuXHRyZXR1cm4gTWF0aC5zcXJ0KFBvaW50MkQuZGlzdGFuY2VTcShwLCBxKSk7XG59XG5cblBvaW50MkQucHJvdG90eXBlLmxlbmd0aCA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gUG9pbnQyRC5kaXN0YW5jZShQb2ludDJELnplcm8sIHRoaXMpO1xufVxuXG4vKlxuICAgIHB1YmxpYyBkb3VibGUgZGlzdGFuY2VTcShQb2ludDJEIHB0KSB7XG4gICAgICAgIGRvdWJsZSBweCA9IHB0LmdldFgoKSAtIHRoaXMuZ2V0WCgpO1xuICAgICAgICBkb3VibGUgcHkgPSBwdC5nZXRZKCkgLSB0aGlzLmdldFkoKTtcbiAgICAgICAgcmV0dXJuIChweCAqIHB4ICsgcHkgKiBweSk7XG4gICAgfVxuXG4gICAgcHVibGljIGRvdWJsZSBkaXN0YW5jZShQb2ludDJEIHB0KSB7XG4gICAgICAgIGRvdWJsZSBweCA9IHB0LmdldFgoKSAtIHRoaXMuZ2V0WCgpO1xuICAgICAgICBkb3VibGUgcHkgPSBwdC5nZXRZKCkgLSB0aGlzLmdldFkoKTtcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydChweCAqIHB4ICsgcHkgKiBweSk7XG4gICAgfVxuXG4gICAgcHVibGljIE9iamVjdCBjbG9uZSgpIHtcbiAgICBcdHJldHVybiBuZXcgUG9pbnQyRCh4LCB5KTtcbiAgICB9XG4qL1xuXG4vKipcbiAqIExpbmUyRFxuICogQHBhcmFtIHgxLHkxLHgyLHkyXG4gKi9cbmZ1bmN0aW9uIExpbmUyRCh4MSwgeTEsIHgyLCB5Mikge1xuXHR0aGlzLngxID0geDE7XG5cdHRoaXMueTEgPSB5MTtcblx0dGhpcy54MiA9IHgyO1xuXHR0aGlzLnkyID0geTI7XG59XG5cbkxpbmUyRC5wcm90b3R5cGUuZ2V0WDEgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHRoaXMueDE7XG59XG5cbkxpbmUyRC5wcm90b3R5cGUuZ2V0WTEgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHRoaXMueTE7XG59XG5cbkxpbmUyRC5wcm90b3R5cGUuZ2V0WDIgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHRoaXMueDI7XG59XG5cbkxpbmUyRC5wcm90b3R5cGUuZ2V0WTIgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHRoaXMueTI7XG59XG5cblxuTGluZTJELnByb3RvdHlwZS5zZXRMaW5lID0gZnVuY3Rpb24oeDEsIHkxLCB4MiwgeTIpIHtcblx0dGhpcy54MSA9IHgxO1xuXHR0aGlzLnkxID0geTE7XG5cdHRoaXMueDIgPSB4Mjtcblx0dGhpcy55MiA9IHkyO1xufVxuXG5MaW5lMkQucHJvdG90eXBlLmdldFAxID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiBuZXcgUG9pbnQyRCh0aGlzLngxLCB0aGlzLnkxKTtcbn1cblxuTGluZTJELnByb3RvdHlwZS5nZXRQMiA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gbmV3IFBvaW50MkQodGhpcy54MiwgdGhpcy55Mik7XG59XG5cbkxpbmUyRC5wcm90b3R5cGUuZ2V0Qm91bmRzMkQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgeDtcbiAgICB2YXIgeTtcbiAgICB2YXIgdztcbiAgICB2YXIgaDtcbiAgICBpZiAodGhpcy54MSA8IHRoaXMueDIpIHtcbiAgICAgICAgeCA9IHRoaXMueDE7XG4gICAgICAgIHcgPSB0aGlzLngyIC0gdGhpcy54MTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB4ID0gdGhpcy54MjtcbiAgICAgICAgdyA9IHRoaXMueDEgLSB0aGlzLngyO1xuICAgIH1cbiAgICBpZiAodGhpcy55MSA8IHRoaXMueTIpIHtcbiAgICAgICAgeSA9IHRoaXMueTE7XG4gICAgICAgIGggPSB0aGlzLnkyIC0gdGhpcy55MTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB5ID0gdGhpcy55MjtcbiAgICAgICAgaCA9IHRoaXMueTEgLSB0aGlzLnkyO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFJlY3RhbmdsZTJEKHgsIHksIHcsIGgpO1xufVxuXG5MaW5lMkQucHJvdG90eXBlLmdldENvbm5lY3QgPSBmdW5jdGlvbihsKSB7XG5cdHZhciBkQnVuYm9cdD0gKHRoaXMuZ2V0WDIoKSAtIHRoaXMuZ2V0WDEoKSApXG4gICAgXHQgXHRcdCogKCBsLmdldFkyKCkgLSBsLmdldFkxKCkgKVxuICAgIFx0IFx0XHQtICggdGhpcy5nZXRZMigpIC0gdGhpcy5nZXRZMSgpIClcbiAgICBcdCBcdFx0KiAoIGwuZ2V0WDIoKSAtIGwuZ2V0WDEoKSk7XG4gICAgXHQgXG4gICAgXHQgaWYoIDAgPT0gZEJ1bmJvIClcbiAgICBcdCB7XG4gICAgXHRcdCByZXR1cm4gbnVsbDtcbiAgICBcdCB9XG4gICAgXHQgXG4gICAgXHQgdmFyIHZlY3RvckFDID0gbmV3IFBvaW50MkQobC5nZXRYMSgpIC0gdGhpcy5nZXRYMSgpLCBsLmdldFkxKCkgLSB0aGlzLmdldFkxKCkpO1xuICAgIFx0IFxuICAgIFx0IHZhciBkUiA9ICggKCBsLmdldFkyKCkgLSBsLmdldFkxKCkgKSAqIHZlY3RvckFDLnggLSAoIGwuZ2V0WDIoKSAtIGwuZ2V0WDEoKSApICogdmVjdG9yQUMueSApIC8gZEJ1bmJvO1xuLy9cdCAgICBcdCBkb3VibGUgZFMgPSAoICggZ2V0WTIoKSAtIGdldFkxKCkgKSAqIHZlY3RvckFDLnggLSAoIGdldFgyKCkgLSBnZXRYMSgpICkgKiB2ZWN0b3JBQy55ICkgLyBkQnVuYm87XG4gICAgXHQgXG4gICAgXHQgcmV0dXJuIG5ldyBQb2ludDJEKHRoaXMuZ2V0WDEoKSArIGRSICogKHRoaXMuZ2V0WDIoKSAtIHRoaXMuZ2V0WDEoKSksIHRoaXMuZ2V0WTEoKSArIGRSICogKHRoaXMuZ2V0WTIoKSAtIHRoaXMuZ2V0WTEoKSkpO1xuICAgIFx0IH1cblxuLyoqXG4gKiBzdGF0aWPplqLmlbBcbiAqL1xuTGluZTJELnJlbGF0aXZlQ0NXID0gZnVuY3Rpb24oeDEsIHkxLCB4MiwgeTIsIHB4LCBweSkge1xuICAgIFx0IHgyIC09IHgxO1xuICAgIFx0IHkyIC09IHkxO1xuICAgIFx0IHB4IC09IHgxO1xuICAgIFx0IHB5IC09IHkxO1xuICAgIFx0IHZhciBjY3cgPSBweCAqIHkyIC0gcHkgKiB4MjtcbiAgICBcdCBpZiAoY2N3ID09IDAuMCkge1xuICAgIFx0XHQgY2N3ID0gcHggKiB4MiArIHB5ICogeTI7XG4gICAgXHRcdCBpZiAoY2N3ID4gMC4wKSB7XG4gICAgXHRcdFx0IHB4IC09IHgyO1xuICAgIFx0XHRcdCBweSAtPSB5MjtcbiAgICBcdFx0XHQgY2N3ID0gcHggKiB4MiArIHB5ICogeTI7XG4gICAgXHRcdFx0IGlmIChjY3cgPCAwLjApIHtcbiAgICBcdFx0XHRcdCBjY3cgPSAwLjA7XG4gICAgXHRcdFx0IH1cbiAgICBcdFx0IH1cbiAgICBcdCB9XG4gICAgXHQgaWYoY2N3IDwgMC4wKSB7XG4gICAgXHRcdCByZXR1cm4gLTE7XG4gICAgXHQgfWVsc2V7XG4gICAgXHRcdCBpZihjY3cgPiAwLjApIHtcbiAgICBcdFx0XHQgcmV0dXJuIDE7XG4gICAgXHRcdCB9ZWxzZXtcbiAgICBcdFx0XHQgcmV0dXJuIDBcbiAgICBcdFx0IH1cbiAgICBcdCB9XG4vL1x0ICAgIFx0IHJldHVybiAoY2N3IDwgMC4wKSA/IC0xIDogKChjY3cgPiAwLjApID8gMSA6IDApO1xufVxuICAgICBcbkxpbmUyRC5wcm90b3R5cGUucmVsYXRpdmVDQ1cgPSBmdW5jdGlvbihweCwgcHkpIHtcblx0IHJldHVybiByZWxhdGl2ZUNDVyh0aGlzLmdldFgxKCksIHRoaXMuZ2V0WTEoKSwgdGhpcy5nZXRYMigpLCB0aGlzLmdldFkyKCksIHB4LCBweSk7XG59XG4gICAgIFxuTGluZTJELnByb3RvdHlwZS5yZWxhdGl2ZUNDVyA9IGZ1bmN0aW9uKHApIHtcbiAgICBcdCByZXR1cm4gcmVsYXRpdmVDQ1codGhpcy5nZXRYMSgpLCB0aGlzLmdldFkxKCksIHRoaXMuZ2V0WDIoKSwgdGhpcy5nZXRZMigpLFxuICAgIFx0ICAgICAgIHAuZ2V0WCgpLCBwLmdldFkoKSk7XG59XG4gICAgXHRcbkxpbmUyRC5saW5lc0ludGVyc2VjdCA9IGZ1bmN0aW9uKHgxLCB5MSwgeDIsIHkyLCB4MywgeTMsIHg0LCB5NCkge1xuXHRyZXR1cm4gKChMaW5lMkQucmVsYXRpdmVDQ1coeDEsIHkxLCB4MiwgeTIsIHgzLCB5MykgKlxuXHRcdFx0TGluZTJELnJlbGF0aXZlQ0NXKHgxLCB5MSwgeDIsIHkyLCB4NCwgeTQpIDw9IDApXG5cdFx0XHQmJiAoTGluZTJELnJlbGF0aXZlQ0NXKHgzLCB5MywgeDQsIHk0LCB4MSwgeTEpICpcblx0XHRcdFx0XHRMaW5lMkQucmVsYXRpdmVDQ1coeDMsIHkzLCB4NCwgeTQsIHgyLCB5MikgPD0gMCkpO1xufVxuXG5MaW5lMkQucHJvdG90eXBlLmludGVyc2VjdHNMaW5lID0gZnVuY3Rpb24oeDEsIHkxLCB4MiwgeTIpIHtcblx0cmV0dXJuIExpbmUyRC5saW5lc0ludGVyc2VjdCh4MSwgeTEsIHgyLCB5Mixcblx0ICAgICAgICAgdGhpcy5nZXRYMSgpLCB0aGlzLmdldFkxKCksIHRoaXMuZ2V0WDIoKSwgdGhpcy5nZXRZMigpKTtcbn1cblxuLypcblx0cHVibGljIGJvb2xlYW4gaW50ZXJzZWN0c0xpbmUoTGluZTJEIGwpIHtcblx0XHRyZXR1cm4gbGluZXNJbnRlcnNlY3QobC5nZXRYMSgpLCBsLmdldFkxKCksIGwuZ2V0WDIoKSwgbC5nZXRZMigpLFxuXHQgICAgICAgICBnZXRYMSgpLCBnZXRZMSgpLCBnZXRYMigpLCBnZXRZMigpKTtcblx0fVxuXHQqL1xuXHRcbkxpbmUyRC5wdFNlZ0Rpc3RTcSA9IGZ1bmN0aW9uKHgxLCB5MSwgeDIsIHkyLCBweCwgcHkpIHtcblx0eDIgLT0geDE7XG5cdHkyIC09IHkxO1xuXHRweCAtPSB4MTtcblx0cHkgLT0geTE7XG5cdHZhciBkb3Rwcm9kID0gcHggKiB4MiArIHB5ICogeTI7XG5cdHZhciBwcm9qbGVuU3E7XG5cdGlmIChkb3Rwcm9kIDw9IDAuMCkge1xuXHRcdHByb2psZW5TcSA9IDAuMDtcblx0fSBlbHNlIHtcblx0XHRweCA9IHgyIC0gcHg7XG5cdFx0cHkgPSB5MiAtIHB5O1xuXHRcdGRvdHByb2QgPSBweCAqIHgyICsgcHkgKiB5Mjtcblx0XHRpZiAoZG90cHJvZCA8PSAwLjApIHtcblx0XHRcdHByb2psZW5TcSA9IDAuMDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cHJvamxlblNxID0gZG90cHJvZCAqIGRvdHByb2QgLyAoeDIgKiB4MiArIHkyICogeTIpO1xuXHRcdH1cblx0fVxuXHR2YXIgbGVuU3EgPSBweCAqIHB4ICsgcHkgKiBweSAtIHByb2psZW5TcTtcblx0aWYgKGxlblNxIDwgMCkge1xuXHRcdGxlblNxID0gMDtcblx0fVxuXHRyZXR1cm4gbGVuU3E7XG59XG5cbi8qKlxuICogc3RhdGlj6Zai5pWwXG4gKi9cbkxpbmUyRC5wdFNlZ0Rpc3QgPSBmdW5jdGlvbih4MSwgeTEsIHgyLCB5MiwgcHgsIHB5KSB7XG5cdHJldHVybiBNYXRoLnNxcnQoTGluZTJELnB0U2VnRGlzdFNxKHgxLCB5MSwgeDIsIHkyLCBweCwgcHkpKTtcbn1cblxuTGluZTJELnByb3RvdHlwZS5wdFNlZ0Rpc3RTcSA9IGZ1bmN0aW9uKHB4LCBweSkge1xuXHRyZXR1cm4gTGluZTJELnB0U2VnRGlzdFNxKHRoaXMueDEsIHRoaXMueTEsIHRoaXMueDIsIHRoaXMueTIsIHB4LCBweSk7XG59XG5cbi8qXG5cdHB1YmxpYyBkb3VibGUgcHRTZWdEaXN0U3EoUG9pbnQyRCBwdCkge1xuXHRcdHJldHVybiBwdFNlZ0Rpc3RTcShnZXRYMSgpLCBnZXRZMSgpLCBnZXRYMigpLCBnZXRZMigpLFxuXHQgICAgICBwdC5nZXRYKCksIHB0LmdldFkoKSk7XG5cdH1cblx0Ki9cblx0XG5cbkxpbmUyRC5wcm90b3R5cGUucHRTZWdEaXN0ID0gZnVuY3Rpb24ocHgsIHB5KSB7XG5cdHJldHVybiBMaW5lMkQucHRTZWdEaXN0KHRoaXMueDEsIHRoaXMueTEsIHRoaXMueDIsIHRoaXMueTIsIHB4LCBweSk7XG59XG5cbi8qXHRcblx0cHVibGljIGRvdWJsZSBwdFNlZ0Rpc3QoUG9pbnQyRCBwdCkge1xuXHRcdHJldHVybiBwdFNlZ0Rpc3QoZ2V0WDEoKSwgZ2V0WTEoKSwgZ2V0WDIoKSwgZ2V0WTIoKSxcblx0ICAgIHB0LmdldFgoKSwgcHQuZ2V0WSgpKTtcblx0fVxuXHRcblx0Ki9cblxuTGluZTJELnB0TGluZURpc3RTcSA9IGZ1bmN0aW9uKHgxLCB5MSwgeDIsIHkyLCBweCwgcHkpIHtcblx0eDIgLT0geDE7XG5cdHkyIC09IHkxO1xuXHRweCAtPSB4MTtcblx0cHkgLT0geTE7XG5cdHZhciBkb3Rwcm9kID0gcHggKiB4MiArIHB5ICogeTI7XG5cdHZhciBwcm9qbGVuU3EgPSBkb3Rwcm9kICogZG90cHJvZCAvICh4MiAqIHgyICsgeTIgKiB5Mik7XG5cdHZhciBsZW5TcSA9IHB4ICogcHggKyBweSAqIHB5IC0gcHJvamxlblNxO1xuXHRpZiAobGVuU3EgPCAwKSB7XG5cdFx0bGVuU3EgPSAwO1xuXHR9XG5cdHJldHVybiBsZW5TcTtcbn1cblx0XG5MaW5lMkQucHRMaW5lRGlzdCA9IGZ1bmN0aW9uKHgxLCB5MSwgeDIsIHkyLCBweCwgcHkpIHtcblx0cmV0dXJuIE1hdGguc3FydChwdExpbmVEaXN0U3EoeDEsIHkxLCB4MiwgeTIsIHB4LCBweSkpO1xufVxuXHRcbkxpbmUyRC5wcm90b3R5cGUucHRMaW5lRGlzdFNxID0gZnVuY3Rpb24ocHgsIHB5KSB7XG5cdHJldHVybiBwdExpbmVEaXN0U3EodGhpcy54MSwgdGhpcy55MSwgdGhpcy54MiwgdGhpcy55MiwgcHgsIHB5KTtcbn1cblxuTGluZTJELnByb3RvdHlwZS5wdExpbmVEaXN0ID0gZnVuY3Rpb24ocHgsIHB5KSB7XG5cdHJldHVybiBwdExpbmVEaXN0KHRoaXMueDEsIHRoaXMueTEsIHRoaXMueDIsIHRoaXMueTIsIHB4LCBweSk7XG59XG5cbi8qXHRcblx0cHVibGljIGRvdWJsZSBwdExpbmVEaXN0U3EoUG9pbnQyRCBwdCkge1xuXHRcdHJldHVybiBwdExpbmVEaXN0U3EoZ2V0WDEoKSwgZ2V0WTEoKSwgZ2V0WDIoKSwgZ2V0WTIoKSxcblx0XHRcdFx0cHQuZ2V0WCgpLCBwdC5nZXRZKCkpO1xuXHR9XG5cblx0cHVibGljIGRvdWJsZSBwdExpbmVEaXN0KFBvaW50MkQgcHQpIHtcblx0XHRyZXR1cm4gcHRMaW5lRGlzdChnZXRYMSgpLCBnZXRZMSgpLCBnZXRYMigpLCBnZXRZMigpLFxuXHRcdFx0XHRwdC5nZXRYKCksIHB0LmdldFkoKSk7XG5cdH1cblx0XG5cdFxuXHRwdWJsaWMgYm9vbGVhbiBjb250YWlucyhkb3VibGUgeCwgZG91YmxlIHkpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblx0XG5cdHB1YmxpYyBib29sZWFuIGNvbnRhaW5zKFBvaW50MkQgcCkge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXHRcblx0Ki9cblxuXHQvKipcblx0KiB7QGluaGVyaXREb2N9XG5cdCogQHNpbmNlIDEuMlxuXHQqL1xuXG4vKlxuXHRwdWJsaWMgYm9vbGVhbiBpbnRlcnNlY3RzKGRvdWJsZSB4LCBkb3VibGUgeSwgZG91YmxlIHcsIGRvdWJsZSBoKSB7XG5cdFx0cmV0dXJuIGludGVyc2VjdHMobmV3IFJlY3RhbmdsZTJEKHgsIHksIHcsIGgpKTtcblx0fVxuXHRcblx0cHVibGljIGJvb2xlYW4gaW50ZXJzZWN0cyhSZWN0YW5nbGUyRCByKSB7XG5cdFx0cmV0dXJuIHIuaW50ZXJzZWN0c0xpbmUoZ2V0WDEoKSwgZ2V0WTEoKSwgZ2V0WDIoKSwgZ2V0WTIoKSk7XG5cdH1cblx0XG5cdFxuXHRwdWJsaWMgYm9vbGVhbiBjb250YWlucyhkb3VibGUgeCwgZG91YmxlIHksIGRvdWJsZSB3LCBkb3VibGUgaCkge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXHRcblx0cHVibGljIGJvb2xlYW4gY29udGFpbnMoUmVjdGFuZ2xlMkQgcikge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXHRcblx0cHVibGljIFJlY3RhbmdsZTJEIGdldEJvdW5kcygpIHtcblx0XHRyZXR1cm4gZ2V0Qm91bmRzMkQoKTtcblx0fVxuXHRcblx0cHVibGljIE9iamVjdCBjbG9uZSgpIHtcblx0XHRyZXR1cm4gbmV3IExpbmUyRCh4MSwgeTEsIHgyLCB5Mik7XG5cdH1cblx0Ki9cblxuZnVuY3Rpb24gUmVjdGFuZ2xlMkQoeCwgeSwgd2lkdGgsIGhlaWdodCkge1xuXHR0aGlzLnggPSB4O1xuXHR0aGlzLnkgPSB5O1xuXHR0aGlzLndpZHRoID0gd2lkdGg7XG5cdHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xufVxuXG5SZWN0YW5nbGUyRC5PVVRfTEVGVCA9IDE7XG5SZWN0YW5nbGUyRC5PVVRfVE9QID0gMjtcblJlY3RhbmdsZTJELk9VVF9SSUdIVCA9IDQ7XG5SZWN0YW5nbGUyRC5PVVRfQk9UVE9NID0gODtcblxuUmVjdGFuZ2xlMkQucHJvdG90eXBlLmdldFggPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHRoaXMueDtcbn1cblxuUmVjdGFuZ2xlMkQucHJvdG90eXBlLmdldFkgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHRoaXMueTtcbn1cblxuUmVjdGFuZ2xlMkQucHJvdG90eXBlLmdldFdpZHRoID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiB0aGlzLndpZHRoO1xufVxuXG5SZWN0YW5nbGUyRC5wcm90b3R5cGUuZ2V0SGVpZ2h0ID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiB0aGlzLmhlaWdodDtcbn1cblxuUmVjdGFuZ2xlMkQucHJvdG90eXBlLmNvbnRhaW5zID0gZnVuY3Rpb24oeCwgeSkge1xuICAgIHZhciB4MCA9IHRoaXMuZ2V0WCgpO1xuICAgIHZhciB5MCA9IHRoaXMuZ2V0WSgpO1xuICAgIHJldHVybiAoeCA+PSB4MCAmJlxuICAgICAgICAgICAgeSA+PSB5MCAmJlxuICAgICAgICAgICAgeCA8IHgwICsgdGhpcy5nZXRXaWR0aCgpICYmXG4gICAgICAgICAgICB5IDwgeTAgKyB0aGlzLmdldEhlaWdodCgpKTtcbn1cblxuUmVjdGFuZ2xlMkQuY29udGFpbnMgPSBmdW5jdGlvbihyZWN0LHApIHtcbiAgICByZXR1cm4gKHAueCA+PSByZWN0LnggJiZcbiAgICAgICAgICAgIHAueSA+PSByZWN0LnkgJiZcbiAgICAgICAgICAgIHAueCA8IHJlY3QueCArIHJlY3Qud2lkdGggJiZcbiAgICAgICAgICAgIHAueSA8IHJlY3QueSArIHJlY3QuaGVpZ2h0KTtcdFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0UG9pbnQyRCA6IFBvaW50MkQsXG5cdExpbmUyRCA6IExpbmUyRCxcblx0UmVjdGFuZ2xlMkQgOiBSZWN0YW5nbGUyRFxufSIsInZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudGVtaXR0ZXIyJykuRXZlbnRFbWl0dGVyMjtcbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xudmFyIHV1aWQgPSByZXF1aXJlKCd1dWlkJyk7XG5cblxuUGxheWVyLlRZUEVfSFVNQU4gPSAxO1xuUGxheWVyLlRZUEVfRU5FTVkgPSAyO1xuUGxheWVyLlRZUEVfR0FJQSA9IDM7XG5cbmZ1bmN0aW9uIFBsYXllcihfb3B0aW9ucykge1xuXHR2YXIgdGhhdCA9IHRoaXM7XG5cdEV2ZW50RW1pdHRlci5jYWxsKHRoaXMpO1xuXHR0aGlzLm9wdGlvbnMgPSBfb3B0aW9ucyB8fCB7fTtcblx0dGhpcy5fdHlwZSA9IHRoaXMub3B0aW9ucy50eXBlIHx8IFBsYXllci5UWVBFX0hVTUFOO1xuXHR0aGlzLl9yZXNvdXJjZXMgPSB7XG5cdFx0XCJ0cmVlXCIgOiAwLFxuXHRcdFwiZm9vZFwiIDogMCxcblx0XHRcInN0b25lXCIgOiAwLFxuXHRcdFwibWV0YWxcIiA6IDBcblx0fTtcbn1cblxudXRpbC5pbmhlcml0cyhQbGF5ZXIsIEV2ZW50RW1pdHRlcik7XG5cblBsYXllci5wcm90b3R5cGUucmVzb3VyY2UgPSBmdW5jdGlvbih0eXBlKSB7XG5cdHJldHVybiB0aGlzLl9yZXNvdXJjZXNbdHlwZV07XG59XG5cblBsYXllci5wcm90b3R5cGUuYWRkUmVzb3VyY2UgPSBmdW5jdGlvbih0eXBlLCBpbmMpIHtcblx0dGhpcy5fcmVzb3VyY2VzW3R5cGVdICs9IGluYztcblx0dGhpcy5lbWl0KCd1cGRhdGUnLCB0aGlzKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBQbGF5ZXI7IiwidmFyIFNuYXAgPSByZXF1aXJlKCcuLi8uLi90aGlyZHBhcnR5L3NuYXAuc3ZnJyk7XG5cbmZ1bmN0aW9uIFVuaXRHcmFwaGljKHMsIG9wdGlvbnMpIHtcblx0dmFyIHRoYXQgPSB0aGlzO1xuXHR0aGlzLmdyb3VwID0gcy5nKCk7XG5cdHRoaXMuYm91bmQgPSB7eDowLHk6MH07XG5cdHRoaXMuX3JvdGF0ZSA9IDA7XG5cdHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG5cdFNuYXAubG9hZChvcHRpb25zLnBhdGgsIGZ1bmN0aW9uIChmKSB7XG5cdFx0Y29uc29sZS5sb2cob3B0aW9ucy5wYXRoICsgJyBsb2FkZWQgc3ZnLicsIGYpO1xuXHQgICAgZyA9IGYuc2VsZWN0KFwiZ1wiKTtcblx0ICAgIHRoYXQuZ3JvdXAuYXBwZW5kKGcpO1xuXHR9KTtcbn1cblxuVW5pdEdyYXBoaWMucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uKCkge1xuXHR0aGlzLmdyb3VwLnJlbW92ZSgpO1xufVxuXG5Vbml0R3JhcGhpYy5wcm90b3R5cGUuY2xpY2sgPSBmdW5jdGlvbihjYikge1xuXHR0aGlzLmdyb3VwLm1vdXNldXAoY2IpO1xufVxuXG5Vbml0R3JhcGhpYy5wcm90b3R5cGUuZ2V0UG9zID0gZnVuY3Rpb24oKSB7XG5cdFxufVxuVW5pdEdyYXBoaWMucHJvdG90eXBlLmdldFdpZHRoID0gZnVuY3Rpb24oKSB7XG5cbn1cblxuVW5pdEdyYXBoaWMucHJvdG90eXBlLnNldFBvcyA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0dGhpcy5ib3VuZC54ID0geDtcblx0dGhpcy5ib3VuZC55ID0geTtcblx0dGhpcy5hcHBseURpc3BsYXkoKTtcbn1cblxuVW5pdEdyYXBoaWMucHJvdG90eXBlLnJvdGF0ZSA9IGZ1bmN0aW9uKHIpIHtcblx0dGhpcy5fcm90YXRlID0gcjtcblx0dGhpcy5hcHBseURpc3BsYXkoKTtcbn1cblxuVW5pdEdyYXBoaWMucHJvdG90eXBlLnNldFNpemUgPSBmdW5jdGlvbihzaXplWCwgc2l6ZVkpIHtcblx0dGhpcy5fd2lkdGggPSBzaXplWDtcblx0dGhpcy5faGVpZ2h0ID0gc2l6ZVk7XG5cdHRoaXMuX3NjYWxlWCA9IHNpemVYIC8gdGhpcy5vcHRpb25zLndpZHRoO1xuXHR0aGlzLl9zY2FsZVkgPSBzaXplWSAvIHRoaXMub3B0aW9ucy5oZWlnaHQ7XG5cdHRoaXMuYXBwbHlEaXNwbGF5KCk7XG59XG5cblVuaXRHcmFwaGljLnByb3RvdHlwZS5hcHBseURpc3BsYXkgPSBmdW5jdGlvbigpIHtcblx0dmFyIG15TWF0cml4ID0gbmV3IFNuYXAuTWF0cml4KCk7XG5cdG15TWF0cml4LnRyYW5zbGF0ZSh0aGlzLmJvdW5kLngrKHRoaXMuX3dpZHRoLzIpLCB0aGlzLmJvdW5kLnkrKHRoaXMuX2hlaWdodC8yKSk7XG5cdG15TWF0cml4LnJvdGF0ZSh0aGlzLl9yb3RhdGUpO1xuXHRteU1hdHJpeC5zY2FsZSh0aGlzLl9zY2FsZVgsIHRoaXMuX3NjYWxlWSk7XG5cdG15TWF0cml4LnRyYW5zbGF0ZSgtKHRoaXMub3B0aW9ucy53aWR0aC8yKSwgLSh0aGlzLm9wdGlvbnMuaGVpZ2h0LzIpKTtcblx0dGhpcy5ncm91cC50cmFuc2Zvcm0obXlNYXRyaXgpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFVuaXRHcmFwaGljOyIsInZhciBTbmFwID0gcmVxdWlyZSgnLi4vdGhpcmRwYXJ0eS9zbmFwLnN2ZycpO1xudmFyIHVuaXRJbmZvID0gcmVxdWlyZSgnLi91bml0Jyk7XG52YXIgR2FtZSA9IHJlcXVpcmUoJy4vY29yZScpO1xuXG5mdW5jdGlvbiBSVFMoKSB7XG5cbn1cblxuUlRTLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKCkge1xuXHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uKCkge1xuXG5cdFx0dmFyIHJlcXVlc3RBbmltYXRpb25GcmFtZSA9IGdldFJlcXVlc3RBbmltYXRpb25GcmFtZSgpO1xuXG5cdFx0Ly92YXIgaXRlbSA9IG5ldyBQYW5lbEl0ZW0oKTtcblx0XHQvL2dhbWXjgpLkvZzmiJBcblx0XHR2YXIgZ2FtZSA9IG5ldyBHYW1lKHJlcXVlc3RBbmltYXRpb25GcmFtZSk7XG5cdFx0Ly9pdGVtLmFkZChnYW1lKTtcblx0fSk7XG59XG5cbmZ1bmN0aW9uIGdldFJlcXVlc3RBbmltYXRpb25GcmFtZSgpIHtcblx0cmV0dXJuIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcblx0ICAgICAgICAgICAgICAgIHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcblx0ICAgICAgICAgICAgICAgIHdpbmRvdy5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgICAgfHxcblx0ICAgICAgICAgICAgICAgIHdpbmRvdy5vUmVxdWVzdEFuaW1hdGlvbkZyYW1lICAgICAgfHxcblx0ICAgICAgICAgICAgICAgIHdpbmRvdy5tc1JlcXVlc3RBbmltYXRpb25GcmFtZSAgICAgfHxcblx0ICAgICAgICAgICAgICAgIG51bGwgO1xufVxuXG53aW5kb3cuUlRTID0gbmV3IFJUUygpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJUUztcblxuXG5mdW5jdGlvbiBQYW5lbEl0ZW0oKSB7XG5cbn0iLCJmdW5jdGlvbiBDb250cm9sUGFuZWwoKSB7XG5cdHZhciB0aGF0ID0gdGhpcztcblx0Ly92YXIgd3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHQvL3dyYXBwZXIuY2xhc3NMaXN0LmFkZCgnY29udHJvbC1wYW5lbC13cmFwcGVyJyk7XG5cdC8vZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh3cmFwcGVyKVxuXHR0aGlzLmluZm9FbGVtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NwLWluZm8nKTtcblx0dGhpcy50YXJnZXQgPSBudWxsO1xuXHRzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcblx0XHRpZih0aGF0LnRhcmdldCkgdGhhdC5pbmZvRWxlbS5pbm5lckhUTUwgPSB0aGF0LnRhcmdldC50b1N0cmluZygpO1xuXHR9LCAyMDAwKTtcbn1cblxuQ29udHJvbFBhbmVsLnByb3RvdHlwZS5zZXRUYXJnZXQgPSBmdW5jdGlvbih0YXJnZXQpIHtcblx0dGhpcy50YXJnZXQgPSB0YXJnZXQ7XG5cdHRoaXMuaW5mb0VsZW0uaW5uZXJIVE1MID0gdGFyZ2V0LnRvU3RyaW5nKCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQ29udHJvbFBhbmVsOyIsIm1vZHVsZS5leHBvcnRzID0ge1xuXHRzbmFwIDogbnVsbCxcblx0c3RhcnQgOiBmdW5jdGlvbih4LCB5KSB7XG5cdFx0dGhpcy54ID0geDtcblx0XHR0aGlzLnkgPSB5O1xuXHRcdHRoaXMuc3RhcnRfeCA9IHg7XG5cdFx0dGhpcy5zdGFydF95ID0geTtcblx0XHR0aGlzLnJlY3QgPSB0aGlzLnNuYXAucmVjdCh4LCB5LCAxLCAxKTtcblx0XHR0aGlzLnJlY3QuYXR0cih7XG5cdFx0XHRmaWxsIDogXCJub25lXCIsXG5cdFx0XHRzdHJva2UgOiBcIiMzMzNcIixcblx0XHRcdHN0cm9rZVdpZHRoIDogMlxuXHRcdH0pO1xuXHR9LFxuXHRlbmQgOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnJlY3QucmVtb3ZlKCk7XG5cdH0sXG5cdG1vdmUgOiBmdW5jdGlvbihkeCwgZHkpIHtcblx0XHRpZihkeCA8IDApIHRoaXMueCA9IHRoaXMuc3RhcnRfeCArIGR4O1xuXHRcdGlmKGR5IDwgMCkgdGhpcy55ID0gdGhpcy5zdGFydF95ICsgZHk7XG5cdFx0dGhpcy53aWR0aCA9IE1hdGguYWJzKGR4KTtcblx0XHR0aGlzLmhlaWdodCA9IE1hdGguYWJzKGR5KTtcblx0XHR0aGlzLnJlY3QuYXR0cih7XG5cdFx0XHR4IDogdGhpcy54LFxuXHRcdFx0eSA6IHRoaXMueSxcblx0XHRcdHdpZHRoIDogdGhpcy53aWR0aCxcblx0XHRcdGhlaWdodCA6IHRoaXMuaGVpZ2h0XG5cdFx0fSk7XG5cdH0sXG5cdGlzQ29udGFpbiA6IGZ1bmN0aW9uKHBvcykge1xuXHRcdHJldHVybiB0aGlzLnggPCBwb3MuZ2V0WCgpICYmIHRoaXMueSA8IHBvcy5nZXRZKCkgJiYgKHBvcy5nZXRYKCkgPCB0aGlzLnggKyB0aGlzLndpZHRoKSAmJiAocG9zLmdldFkoKSA8IHRoaXMueSArIHRoaXMuaGVpZ2h0KTtcblx0fVxufSIsIm1vZHVsZS5leHBvcnRzID0gW3tcblx0aWQgOiAndmlsbGFnZXInLFxuXHRuYW1lIDogJ+W4guawkScsXG5cdGdyYXBoaWMgOiB7XG5cdFx0cGF0aCA6ICd1bml0L2NpdHkuc3ZnJyxcblx0XHR3aWR0aCA6IDgwLFxuXHRcdGhlaWdodCA6IDgwLFxuXHR9LFxuXHR1bml0aW5mbyA6IHtcblx0XHR0eXBlIDogJ3RyYWluYWJsZScsXG5cdFx0c2l6ZSA6IDFcblx0fVxufSx7XG5cdGlkIDogJ21pbGl0aWEnLFxuXHRuYW1lIDogJ+W4guawkScsXG5cdGdyYXBoaWMgOiB7XG5cdFx0cGF0aCA6ICd1bml0L3N3b3JkLnN2ZycsXG5cdFx0d2lkdGggOiA4MCxcblx0XHRoZWlnaHQgOiA4MCxcblx0fSxcblx0dW5pdGluZm8gOiB7XG5cdFx0dHlwZSA6ICd0cmFpbmFibGUnLFxuXHRcdHNpemUgOiAxXG5cdH1cbn0se1xuXHRpZCA6ICd0b3duJyxcblx0bmFtZSA6ICfnlLrjga7kuK3lv4MnLFxuXHRncmFwaGljIDoge1xuXHRcdHBhdGggOiAnYnVpbGRpbmcvdG93bi5zdmcnLFxuXHRcdHdpZHRoIDogMzIwLFxuXHRcdGhlaWdodCA6IDMyMCxcblx0fSxcblx0dW5pdGluZm8gOiB7XG5cdFx0dHlwZSA6ICdidWlsZGluZycsXG5cdFx0c2l6ZSA6IFszLCAzXVxuXHR9XG59LHtcblx0aWQgOiAndHJlZScsXG5cdG5hbWUgOiAn5pyoJyxcblx0Z3JhcGhpYyA6IHtcblx0XHRwYXRoIDogJ25hdHVyZS90cmVlLnN2ZycsXG5cdFx0d2lkdGggOiAxNjAsXG5cdFx0aGVpZ2h0IDogMTYwXG5cdH0sXG5cdHVuaXRpbmZvIDoge1xuXHRcdHR5cGUgOiAnbmF0dXJlJyxcblx0XHRzaXplIDogMVxuXHR9XG59LHtcblx0aWQgOiAnZnJ1aXQnLFxuXHRuYW1lIDogJ+aenOeJqScsXG5cdGdyYXBoaWMgOiB7XG5cdFx0cGF0aCA6ICduYXR1cmUvZnJ1aXRzLnN2ZycsXG5cdFx0d2lkdGggOiAxNjAsXG5cdFx0aGVpZ2h0IDogMTYwXG5cdH0sXG5cdHVuaXRpbmZvIDoge1xuXHRcdHR5cGUgOiAnbmF0dXJlJyxcblx0XHRzaXplIDogMVxuXHR9XG59XSIsIm1vZHVsZS5leHBvcnRzID0ge1xuXHRuYW1lIDogXCIqXCIsXG5cdGxvZ2dlciA6IGZ1bmN0aW9uKG5hbWUpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24oKSB7XG5cdFx0XHRpZihuYW1lLm1hdGNoKHRoaXMubmFtZSkpIHtcblx0XHRcdFx0Y29uc29sZS5sb2cuYXBwbHkoY29uc29sZSwgYXJndW1lbnRzKTtcblx0XHRcdFx0Lypcblx0XHRcdFx0dmFyIGRvbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHRcdFx0XHRkb20udGV4dENvbnRlbnQgPSBKU09OLnN0cmluZ2lmeShhcmd1bWVudHMpO1xuXHRcdFx0XHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGVidWcnKS5hcHBlbmRDaGlsZChkb20pO1xuXHRcdFx0XHQqL1xuXHRcdFx0fVxuXHRcdH1cblx0fVxufSIsIi8vIFNuYXAuc3ZnIDAuNC4xXG4vL1xuLy8gQ29weXJpZ2h0IChjKSAyMDEzIOKAkyAyMDE1IEFkb2JlIFN5c3RlbXMgSW5jb3Jwb3JhdGVkLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLy9cbi8vIGJ1aWxkOiAyMDE1LTA0LTEzXG5cbi8vIENvcHlyaWdodCAoYykgMjAxMyBBZG9iZSBTeXN0ZW1zIEluY29ycG9yYXRlZC4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIFxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy8gXG4vLyBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vIFxuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8vIOKUjOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUkCBcXFxcXG4vLyDilIIgRXZlIDAuNC4yIC0gSmF2YVNjcmlwdCBFdmVudHMgTGlicmFyeSAgICAgICAgICAgICAgICAgICAgICDilIIgXFxcXFxuLy8g4pSc4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSkIFxcXFxcbi8vIOKUgiBBdXRob3IgRG1pdHJ5IEJhcmFub3Zza2l5IChodHRwOi8vZG1pdHJ5LmJhcmFub3Zza2l5LmNvbS8pIOKUgiBcXFxcXG4vLyDilJTilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilJggXFxcXFxuXG4oZnVuY3Rpb24gKGdsb2IpIHtcbiAgICB2YXIgdmVyc2lvbiA9IFwiMC40LjJcIixcbiAgICAgICAgaGFzID0gXCJoYXNPd25Qcm9wZXJ0eVwiLFxuICAgICAgICBzZXBhcmF0b3IgPSAvW1xcLlxcL10vLFxuICAgICAgICBjb21hc2VwYXJhdG9yID0gL1xccyosXFxzKi8sXG4gICAgICAgIHdpbGRjYXJkID0gXCIqXCIsXG4gICAgICAgIGZ1biA9IGZ1bmN0aW9uICgpIHt9LFxuICAgICAgICBudW1zb3J0ID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgIHJldHVybiBhIC0gYjtcbiAgICAgICAgfSxcbiAgICAgICAgY3VycmVudF9ldmVudCxcbiAgICAgICAgc3RvcCxcbiAgICAgICAgZXZlbnRzID0ge246IHt9fSxcbiAgICAgICAgZmlyc3REZWZpbmVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gdGhpcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzW2ldICE9IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBsYXN0RGVmaW5lZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBpID0gdGhpcy5sZW5ndGg7XG4gICAgICAgICAgICB3aGlsZSAoLS1pKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzW2ldICE9IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgIC8qXFxcbiAgICAgKiBldmVcbiAgICAgWyBtZXRob2QgXVxuXG4gICAgICogRmlyZXMgZXZlbnQgd2l0aCBnaXZlbiBgbmFtZWAsIGdpdmVuIHNjb3BlIGFuZCBvdGhlciBwYXJhbWV0ZXJzLlxuXG4gICAgID4gQXJndW1lbnRzXG5cbiAgICAgLSBuYW1lIChzdHJpbmcpIG5hbWUgb2YgdGhlICpldmVudCosIGRvdCAoYC5gKSBvciBzbGFzaCAoYC9gKSBzZXBhcmF0ZWRcbiAgICAgLSBzY29wZSAob2JqZWN0KSBjb250ZXh0IGZvciB0aGUgZXZlbnQgaGFuZGxlcnNcbiAgICAgLSB2YXJhcmdzICguLi4pIHRoZSByZXN0IG9mIGFyZ3VtZW50cyB3aWxsIGJlIHNlbnQgdG8gZXZlbnQgaGFuZGxlcnNcblxuICAgICA9IChvYmplY3QpIGFycmF5IG9mIHJldHVybmVkIHZhbHVlcyBmcm9tIHRoZSBsaXN0ZW5lcnMuIEFycmF5IGhhcyB0d28gbWV0aG9kcyBgLmZpcnN0RGVmaW5lZCgpYCBhbmQgYC5sYXN0RGVmaW5lZCgpYCB0byBnZXQgZmlyc3Qgb3IgbGFzdCBub3QgYHVuZGVmaW5lZGAgdmFsdWUuXG4gICAgXFwqL1xuICAgICAgICBldmUgPSBmdW5jdGlvbiAobmFtZSwgc2NvcGUpIHtcbiAgICAgICAgICAgIG5hbWUgPSBTdHJpbmcobmFtZSk7XG4gICAgICAgICAgICB2YXIgZSA9IGV2ZW50cyxcbiAgICAgICAgICAgICAgICBvbGRzdG9wID0gc3RvcCxcbiAgICAgICAgICAgICAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKSxcbiAgICAgICAgICAgICAgICBsaXN0ZW5lcnMgPSBldmUubGlzdGVuZXJzKG5hbWUpLFxuICAgICAgICAgICAgICAgIHogPSAwLFxuICAgICAgICAgICAgICAgIGYgPSBmYWxzZSxcbiAgICAgICAgICAgICAgICBsLFxuICAgICAgICAgICAgICAgIGluZGV4ZWQgPSBbXSxcbiAgICAgICAgICAgICAgICBxdWV1ZSA9IHt9LFxuICAgICAgICAgICAgICAgIG91dCA9IFtdLFxuICAgICAgICAgICAgICAgIGNlID0gY3VycmVudF9ldmVudCxcbiAgICAgICAgICAgICAgICBlcnJvcnMgPSBbXTtcbiAgICAgICAgICAgIG91dC5maXJzdERlZmluZWQgPSBmaXJzdERlZmluZWQ7XG4gICAgICAgICAgICBvdXQubGFzdERlZmluZWQgPSBsYXN0RGVmaW5lZDtcbiAgICAgICAgICAgIGN1cnJlbnRfZXZlbnQgPSBuYW1lO1xuICAgICAgICAgICAgc3RvcCA9IDA7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBsaXN0ZW5lcnMubGVuZ3RoOyBpIDwgaWk7IGkrKykgaWYgKFwiekluZGV4XCIgaW4gbGlzdGVuZXJzW2ldKSB7XG4gICAgICAgICAgICAgICAgaW5kZXhlZC5wdXNoKGxpc3RlbmVyc1tpXS56SW5kZXgpO1xuICAgICAgICAgICAgICAgIGlmIChsaXN0ZW5lcnNbaV0uekluZGV4IDwgMCkge1xuICAgICAgICAgICAgICAgICAgICBxdWV1ZVtsaXN0ZW5lcnNbaV0uekluZGV4XSA9IGxpc3RlbmVyc1tpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpbmRleGVkLnNvcnQobnVtc29ydCk7XG4gICAgICAgICAgICB3aGlsZSAoaW5kZXhlZFt6XSA8IDApIHtcbiAgICAgICAgICAgICAgICBsID0gcXVldWVbaW5kZXhlZFt6KytdXTtcbiAgICAgICAgICAgICAgICBvdXQucHVzaChsLmFwcGx5KHNjb3BlLCBhcmdzKSk7XG4gICAgICAgICAgICAgICAgaWYgKHN0b3ApIHtcbiAgICAgICAgICAgICAgICAgICAgc3RvcCA9IG9sZHN0b3A7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvdXQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICBsID0gbGlzdGVuZXJzW2ldO1xuICAgICAgICAgICAgICAgIGlmIChcInpJbmRleFwiIGluIGwpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGwuekluZGV4ID09IGluZGV4ZWRbel0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dC5wdXNoKGwuYXBwbHkoc2NvcGUsIGFyZ3MpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdG9wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBkbyB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeisrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGwgPSBxdWV1ZVtpbmRleGVkW3pdXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsICYmIG91dC5wdXNoKGwuYXBwbHkoc2NvcGUsIGFyZ3MpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3RvcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IHdoaWxlIChsKVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcXVldWVbbC56SW5kZXhdID0gbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG91dC5wdXNoKGwuYXBwbHkoc2NvcGUsIGFyZ3MpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0b3ApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3RvcCA9IG9sZHN0b3A7XG4gICAgICAgICAgICBjdXJyZW50X2V2ZW50ID0gY2U7XG4gICAgICAgICAgICByZXR1cm4gb3V0O1xuICAgICAgICB9O1xuICAgICAgICAvLyBVbmRvY3VtZW50ZWQuIERlYnVnIG9ubHkuXG4gICAgICAgIGV2ZS5fZXZlbnRzID0gZXZlbnRzO1xuICAgIC8qXFxcbiAgICAgKiBldmUubGlzdGVuZXJzXG4gICAgIFsgbWV0aG9kIF1cblxuICAgICAqIEludGVybmFsIG1ldGhvZCB3aGljaCBnaXZlcyB5b3UgYXJyYXkgb2YgYWxsIGV2ZW50IGhhbmRsZXJzIHRoYXQgd2lsbCBiZSB0cmlnZ2VyZWQgYnkgdGhlIGdpdmVuIGBuYW1lYC5cblxuICAgICA+IEFyZ3VtZW50c1xuXG4gICAgIC0gbmFtZSAoc3RyaW5nKSBuYW1lIG9mIHRoZSBldmVudCwgZG90IChgLmApIG9yIHNsYXNoIChgL2ApIHNlcGFyYXRlZFxuXG4gICAgID0gKGFycmF5KSBhcnJheSBvZiBldmVudCBoYW5kbGVyc1xuICAgIFxcKi9cbiAgICBldmUubGlzdGVuZXJzID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgdmFyIG5hbWVzID0gbmFtZS5zcGxpdChzZXBhcmF0b3IpLFxuICAgICAgICAgICAgZSA9IGV2ZW50cyxcbiAgICAgICAgICAgIGl0ZW0sXG4gICAgICAgICAgICBpdGVtcyxcbiAgICAgICAgICAgIGssXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgaWksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgamosXG4gICAgICAgICAgICBuZXMsXG4gICAgICAgICAgICBlcyA9IFtlXSxcbiAgICAgICAgICAgIG91dCA9IFtdO1xuICAgICAgICBmb3IgKGkgPSAwLCBpaSA9IG5hbWVzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIG5lcyA9IFtdO1xuICAgICAgICAgICAgZm9yIChqID0gMCwgamogPSBlcy5sZW5ndGg7IGogPCBqajsgaisrKSB7XG4gICAgICAgICAgICAgICAgZSA9IGVzW2pdLm47XG4gICAgICAgICAgICAgICAgaXRlbXMgPSBbZVtuYW1lc1tpXV0sIGVbd2lsZGNhcmRdXTtcbiAgICAgICAgICAgICAgICBrID0gMjtcbiAgICAgICAgICAgICAgICB3aGlsZSAoay0tKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0gPSBpdGVtc1trXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5lcy5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0ID0gb3V0LmNvbmNhdChpdGVtLmYgfHwgW10pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZXMgPSBuZXM7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIFxuICAgIC8qXFxcbiAgICAgKiBldmUub25cbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEJpbmRzIGdpdmVuIGV2ZW50IGhhbmRsZXIgd2l0aCBhIGdpdmVuIG5hbWUuIFlvdSBjYW4gdXNlIHdpbGRjYXJkcyDigJxgKmDigJ0gZm9yIHRoZSBuYW1lczpcbiAgICAgfCBldmUub24oXCIqLnVuZGVyLipcIiwgZik7XG4gICAgIHwgZXZlKFwibW91c2UudW5kZXIuZmxvb3JcIik7IC8vIHRyaWdnZXJzIGZcbiAgICAgKiBVc2UgQGV2ZSB0byB0cmlnZ2VyIHRoZSBsaXN0ZW5lci5cbiAgICAgKipcbiAgICAgPiBBcmd1bWVudHNcbiAgICAgKipcbiAgICAgLSBuYW1lIChzdHJpbmcpIG5hbWUgb2YgdGhlIGV2ZW50LCBkb3QgKGAuYCkgb3Igc2xhc2ggKGAvYCkgc2VwYXJhdGVkLCB3aXRoIG9wdGlvbmFsIHdpbGRjYXJkc1xuICAgICAtIGYgKGZ1bmN0aW9uKSBldmVudCBoYW5kbGVyIGZ1bmN0aW9uXG4gICAgICoqXG4gICAgID0gKGZ1bmN0aW9uKSByZXR1cm5lZCBmdW5jdGlvbiBhY2NlcHRzIGEgc2luZ2xlIG51bWVyaWMgcGFyYW1ldGVyIHRoYXQgcmVwcmVzZW50cyB6LWluZGV4IG9mIHRoZSBoYW5kbGVyLiBJdCBpcyBhbiBvcHRpb25hbCBmZWF0dXJlIGFuZCBvbmx5IHVzZWQgd2hlbiB5b3UgbmVlZCB0byBlbnN1cmUgdGhhdCBzb21lIHN1YnNldCBvZiBoYW5kbGVycyB3aWxsIGJlIGludm9rZWQgaW4gYSBnaXZlbiBvcmRlciwgZGVzcGl0ZSBvZiB0aGUgb3JkZXIgb2YgYXNzaWdubWVudC4gXG4gICAgID4gRXhhbXBsZTpcbiAgICAgfCBldmUub24oXCJtb3VzZVwiLCBlYXRJdCkoMik7XG4gICAgIHwgZXZlLm9uKFwibW91c2VcIiwgc2NyZWFtKTtcbiAgICAgfCBldmUub24oXCJtb3VzZVwiLCBjYXRjaEl0KSgxKTtcbiAgICAgKiBUaGlzIHdpbGwgZW5zdXJlIHRoYXQgYGNhdGNoSXRgIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIGJlZm9yZSBgZWF0SXRgLlxuICAgICAqXG4gICAgICogSWYgeW91IHdhbnQgdG8gcHV0IHlvdXIgaGFuZGxlciBiZWZvcmUgbm9uLWluZGV4ZWQgaGFuZGxlcnMsIHNwZWNpZnkgYSBuZWdhdGl2ZSB2YWx1ZS5cbiAgICAgKiBOb3RlOiBJIGFzc3VtZSBtb3N0IG9mIHRoZSB0aW1lIHlvdSBkb27igJl0IG5lZWQgdG8gd29ycnkgYWJvdXQgei1pbmRleCwgYnV0IGl04oCZcyBuaWNlIHRvIGhhdmUgdGhpcyBmZWF0dXJlIOKAnGp1c3QgaW4gY2FzZeKAnS5cbiAgICBcXCovXG4gICAgZXZlLm9uID0gZnVuY3Rpb24gKG5hbWUsIGYpIHtcbiAgICAgICAgbmFtZSA9IFN0cmluZyhuYW1lKTtcbiAgICAgICAgaWYgKHR5cGVvZiBmICE9IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHt9O1xuICAgICAgICB9XG4gICAgICAgIHZhciBuYW1lcyA9IG5hbWUuc3BsaXQoY29tYXNlcGFyYXRvcik7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IG5hbWVzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIChmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgICAgIHZhciBuYW1lcyA9IG5hbWUuc3BsaXQoc2VwYXJhdG9yKSxcbiAgICAgICAgICAgICAgICAgICAgZSA9IGV2ZW50cyxcbiAgICAgICAgICAgICAgICAgICAgZXhpc3Q7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gbmFtZXMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBlID0gZS5uO1xuICAgICAgICAgICAgICAgICAgICBlID0gZS5oYXNPd25Qcm9wZXJ0eShuYW1lc1tpXSkgJiYgZVtuYW1lc1tpXV0gfHwgKGVbbmFtZXNbaV1dID0ge246IHt9fSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGUuZiA9IGUuZiB8fCBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwLCBpaSA9IGUuZi5sZW5ndGg7IGkgPCBpaTsgaSsrKSBpZiAoZS5mW2ldID09IGYpIHtcbiAgICAgICAgICAgICAgICAgICAgZXhpc3QgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgIWV4aXN0ICYmIGUuZi5wdXNoKGYpO1xuICAgICAgICAgICAgfShuYW1lc1tpXSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoekluZGV4KSB7XG4gICAgICAgICAgICBpZiAoK3pJbmRleCA9PSArekluZGV4KSB7XG4gICAgICAgICAgICAgICAgZi56SW5kZXggPSArekluZGV4O1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIGV2ZS5mXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIGZ1bmN0aW9uIHRoYXQgd2lsbCBmaXJlIGdpdmVuIGV2ZW50IHdpdGggb3B0aW9uYWwgYXJndW1lbnRzLlxuICAgICAqIEFyZ3VtZW50cyB0aGF0IHdpbGwgYmUgcGFzc2VkIHRvIHRoZSByZXN1bHQgZnVuY3Rpb24gd2lsbCBiZSBhbHNvXG4gICAgICogY29uY2F0ZWQgdG8gdGhlIGxpc3Qgb2YgZmluYWwgYXJndW1lbnRzLlxuICAgICB8IGVsLm9uY2xpY2sgPSBldmUuZihcImNsaWNrXCIsIDEsIDIpO1xuICAgICB8IGV2ZS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uIChhLCBiLCBjKSB7XG4gICAgIHwgICAgIGNvbnNvbGUubG9nKGEsIGIsIGMpOyAvLyAxLCAyLCBbZXZlbnQgb2JqZWN0XVxuICAgICB8IH0pO1xuICAgICA+IEFyZ3VtZW50c1xuICAgICAtIGV2ZW50IChzdHJpbmcpIGV2ZW50IG5hbWVcbiAgICAgLSB2YXJhcmdzICjigKYpIGFuZCBhbnkgb3RoZXIgYXJndW1lbnRzXG4gICAgID0gKGZ1bmN0aW9uKSBwb3NzaWJsZSBldmVudCBoYW5kbGVyIGZ1bmN0aW9uXG4gICAgXFwqL1xuICAgIGV2ZS5mID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciBhdHRycyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGV2ZS5hcHBseShudWxsLCBbZXZlbnQsIG51bGxdLmNvbmNhdChhdHRycykuY29uY2F0KFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSkpO1xuICAgICAgICB9O1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIGV2ZS5zdG9wXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBJcyB1c2VkIGluc2lkZSBhbiBldmVudCBoYW5kbGVyIHRvIHN0b3AgdGhlIGV2ZW50LCBwcmV2ZW50aW5nIGFueSBzdWJzZXF1ZW50IGxpc3RlbmVycyBmcm9tIGZpcmluZy5cbiAgICBcXCovXG4gICAgZXZlLnN0b3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHN0b3AgPSAxO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIGV2ZS5udFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQ291bGQgYmUgdXNlZCBpbnNpZGUgZXZlbnQgaGFuZGxlciB0byBmaWd1cmUgb3V0IGFjdHVhbCBuYW1lIG9mIHRoZSBldmVudC5cbiAgICAgKipcbiAgICAgPiBBcmd1bWVudHNcbiAgICAgKipcbiAgICAgLSBzdWJuYW1lIChzdHJpbmcpICNvcHRpb25hbCBzdWJuYW1lIG9mIHRoZSBldmVudFxuICAgICAqKlxuICAgICA9IChzdHJpbmcpIG5hbWUgb2YgdGhlIGV2ZW50LCBpZiBgc3VibmFtZWAgaXMgbm90IHNwZWNpZmllZFxuICAgICAqIG9yXG4gICAgID0gKGJvb2xlYW4pIGB0cnVlYCwgaWYgY3VycmVudCBldmVudOKAmXMgbmFtZSBjb250YWlucyBgc3VibmFtZWBcbiAgICBcXCovXG4gICAgZXZlLm50ID0gZnVuY3Rpb24gKHN1Ym5hbWUpIHtcbiAgICAgICAgaWYgKHN1Ym5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUmVnRXhwKFwiKD86XFxcXC58XFxcXC98XilcIiArIHN1Ym5hbWUgKyBcIig/OlxcXFwufFxcXFwvfCQpXCIpLnRlc3QoY3VycmVudF9ldmVudCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGN1cnJlbnRfZXZlbnQ7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogZXZlLm50c1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQ291bGQgYmUgdXNlZCBpbnNpZGUgZXZlbnQgaGFuZGxlciB0byBmaWd1cmUgb3V0IGFjdHVhbCBuYW1lIG9mIHRoZSBldmVudC5cbiAgICAgKipcbiAgICAgKipcbiAgICAgPSAoYXJyYXkpIG5hbWVzIG9mIHRoZSBldmVudFxuICAgIFxcKi9cbiAgICBldmUubnRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gY3VycmVudF9ldmVudC5zcGxpdChzZXBhcmF0b3IpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIGV2ZS5vZmZcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgZ2l2ZW4gZnVuY3Rpb24gZnJvbSB0aGUgbGlzdCBvZiBldmVudCBsaXN0ZW5lcnMgYXNzaWduZWQgdG8gZ2l2ZW4gbmFtZS5cbiAgICAgKiBJZiBubyBhcmd1bWVudHMgc3BlY2lmaWVkIGFsbCB0aGUgZXZlbnRzIHdpbGwgYmUgY2xlYXJlZC5cbiAgICAgKipcbiAgICAgPiBBcmd1bWVudHNcbiAgICAgKipcbiAgICAgLSBuYW1lIChzdHJpbmcpIG5hbWUgb2YgdGhlIGV2ZW50LCBkb3QgKGAuYCkgb3Igc2xhc2ggKGAvYCkgc2VwYXJhdGVkLCB3aXRoIG9wdGlvbmFsIHdpbGRjYXJkc1xuICAgICAtIGYgKGZ1bmN0aW9uKSBldmVudCBoYW5kbGVyIGZ1bmN0aW9uXG4gICAgXFwqL1xuICAgIC8qXFxcbiAgICAgKiBldmUudW5iaW5kXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBTZWUgQGV2ZS5vZmZcbiAgICBcXCovXG4gICAgZXZlLm9mZiA9IGV2ZS51bmJpbmQgPSBmdW5jdGlvbiAobmFtZSwgZikge1xuICAgICAgICBpZiAoIW5hbWUpIHtcbiAgICAgICAgICAgIGV2ZS5fZXZlbnRzID0gZXZlbnRzID0ge246IHt9fTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbmFtZXMgPSBuYW1lLnNwbGl0KGNvbWFzZXBhcmF0b3IpO1xuICAgICAgICBpZiAobmFtZXMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gbmFtZXMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgIGV2ZS5vZmYobmFtZXNbaV0sIGYpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIG5hbWVzID0gbmFtZS5zcGxpdChzZXBhcmF0b3IpO1xuICAgICAgICB2YXIgZSxcbiAgICAgICAgICAgIGtleSxcbiAgICAgICAgICAgIHNwbGljZSxcbiAgICAgICAgICAgIGksIGlpLCBqLCBqaixcbiAgICAgICAgICAgIGN1ciA9IFtldmVudHNdO1xuICAgICAgICBmb3IgKGkgPSAwLCBpaSA9IG5hbWVzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBjdXIubGVuZ3RoOyBqICs9IHNwbGljZS5sZW5ndGggLSAyKSB7XG4gICAgICAgICAgICAgICAgc3BsaWNlID0gW2osIDFdO1xuICAgICAgICAgICAgICAgIGUgPSBjdXJbal0ubjtcbiAgICAgICAgICAgICAgICBpZiAobmFtZXNbaV0gIT0gd2lsZGNhcmQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVbbmFtZXNbaV1dKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzcGxpY2UucHVzaChlW25hbWVzW2ldXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGtleSBpbiBlKSBpZiAoZVtoYXNdKGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNwbGljZS5wdXNoKGVba2V5XSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY3VyLnNwbGljZS5hcHBseShjdXIsIHNwbGljZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChpID0gMCwgaWkgPSBjdXIubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgZSA9IGN1cltpXTtcbiAgICAgICAgICAgIHdoaWxlIChlLm4pIHtcbiAgICAgICAgICAgICAgICBpZiAoZikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZS5mKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAwLCBqaiA9IGUuZi5sZW5ndGg7IGogPCBqajsgaisrKSBpZiAoZS5mW2pdID09IGYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLmYuc3BsaWNlKGosIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgIWUuZi5sZW5ndGggJiYgZGVsZXRlIGUuZjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBmb3IgKGtleSBpbiBlLm4pIGlmIChlLm5baGFzXShrZXkpICYmIGUubltrZXldLmYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmdW5jcyA9IGUubltrZXldLmY7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAwLCBqaiA9IGZ1bmNzLmxlbmd0aDsgaiA8IGpqOyBqKyspIGlmIChmdW5jc1tqXSA9PSBmKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Muc3BsaWNlKGosIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgIWZ1bmNzLmxlbmd0aCAmJiBkZWxldGUgZS5uW2tleV0uZjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBlLmY7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIGUubikgaWYgKGUubltoYXNdKGtleSkgJiYgZS5uW2tleV0uZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGUubltrZXldLmY7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZSA9IGUubjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgLypcXFxuICAgICAqIGV2ZS5vbmNlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBCaW5kcyBnaXZlbiBldmVudCBoYW5kbGVyIHdpdGggYSBnaXZlbiBuYW1lIHRvIG9ubHkgcnVuIG9uY2UgdGhlbiB1bmJpbmQgaXRzZWxmLlxuICAgICB8IGV2ZS5vbmNlKFwibG9naW5cIiwgZik7XG4gICAgIHwgZXZlKFwibG9naW5cIik7IC8vIHRyaWdnZXJzIGZcbiAgICAgfCBldmUoXCJsb2dpblwiKTsgLy8gbm8gbGlzdGVuZXJzXG4gICAgICogVXNlIEBldmUgdG8gdHJpZ2dlciB0aGUgbGlzdGVuZXIuXG4gICAgICoqXG4gICAgID4gQXJndW1lbnRzXG4gICAgICoqXG4gICAgIC0gbmFtZSAoc3RyaW5nKSBuYW1lIG9mIHRoZSBldmVudCwgZG90IChgLmApIG9yIHNsYXNoIChgL2ApIHNlcGFyYXRlZCwgd2l0aCBvcHRpb25hbCB3aWxkY2FyZHNcbiAgICAgLSBmIChmdW5jdGlvbikgZXZlbnQgaGFuZGxlciBmdW5jdGlvblxuICAgICAqKlxuICAgICA9IChmdW5jdGlvbikgc2FtZSByZXR1cm4gZnVuY3Rpb24gYXMgQGV2ZS5vblxuICAgIFxcKi9cbiAgICBldmUub25jZSA9IGZ1bmN0aW9uIChuYW1lLCBmKSB7XG4gICAgICAgIHZhciBmMiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGV2ZS51bmJpbmQobmFtZSwgZjIpO1xuICAgICAgICAgICAgcmV0dXJuIGYuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIGV2ZS5vbihuYW1lLCBmMik7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogZXZlLnZlcnNpb25cbiAgICAgWyBwcm9wZXJ0eSAoc3RyaW5nKSBdXG4gICAgICoqXG4gICAgICogQ3VycmVudCB2ZXJzaW9uIG9mIHRoZSBsaWJyYXJ5LlxuICAgIFxcKi9cbiAgICBldmUudmVyc2lvbiA9IHZlcnNpb247XG4gICAgZXZlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gXCJZb3UgYXJlIHJ1bm5pbmcgRXZlIFwiICsgdmVyc2lvbjtcbiAgICB9O1xuICAgICh0eXBlb2YgbW9kdWxlICE9IFwidW5kZWZpbmVkXCIgJiYgbW9kdWxlLmV4cG9ydHMpID8gKG1vZHVsZS5leHBvcnRzID0gZXZlKSA6ICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCA/IChkZWZpbmUoXCJldmVcIiwgW10sIGZ1bmN0aW9uKCkgeyByZXR1cm4gZXZlOyB9KSkgOiAoZ2xvYi5ldmUgPSBldmUpKTtcbn0pKHRoaXMpO1xuXG4oZnVuY3Rpb24gKGdsb2IsIGZhY3RvcnkpIHtcbiAgICAvLyBBTUQgc3VwcG9ydFxuICAgIGlmICh0eXBlb2YgZGVmaW5lID09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIC8vIERlZmluZSBhcyBhbiBhbm9ueW1vdXMgbW9kdWxlXG4gICAgICAgIGRlZmluZShbXCJldmVcIl0sIGZ1bmN0aW9uIChldmUpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWN0b3J5KGdsb2IsIGV2ZSk7XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgLy8gTmV4dCBmb3IgTm9kZS5qcyBvciBDb21tb25KU1xuICAgICAgICB2YXIgZXZlID0gcmVxdWlyZSgnZXZlJyk7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShnbG9iLCBldmUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEJyb3dzZXIgZ2xvYmFscyAoZ2xvYiBpcyB3aW5kb3cpXG4gICAgICAgIC8vIFNuYXAgYWRkcyBpdHNlbGYgdG8gd2luZG93XG4gICAgICAgIGZhY3RvcnkoZ2xvYiwgZ2xvYi5ldmUpO1xuICAgIH1cbn0od2luZG93IHx8IHRoaXMsIGZ1bmN0aW9uICh3aW5kb3csIGV2ZSkge1xuXG4vLyBDb3B5cmlnaHQgKGMpIDIwMTMgQWRvYmUgU3lzdGVtcyBJbmNvcnBvcmF0ZWQuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBcbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vIFxuLy8gaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vLyBcbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG52YXIgbWluYSA9IChmdW5jdGlvbiAoZXZlKSB7XG4gICAgdmFyIGFuaW1hdGlvbnMgPSB7fSxcbiAgICByZXF1ZXN0QW5pbUZyYW1lID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSAgICAgICB8fFxuICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgICAgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgd2luZG93Lm9SZXF1ZXN0QW5pbWF0aW9uRnJhbWUgICAgICB8fFxuICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cubXNSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgICAgIHx8XG4gICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChjYWxsYmFjaywgMTYpO1xuICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIChhKSB7XG4gICAgICAgIHJldHVybiBhIGluc3RhbmNlb2YgQXJyYXkgfHxcbiAgICAgICAgICAgIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhKSA9PSBcIltvYmplY3QgQXJyYXldXCI7XG4gICAgfSxcbiAgICBpZGdlbiA9IDAsXG4gICAgaWRwcmVmaXggPSBcIk1cIiArICgrbmV3IERhdGUpLnRvU3RyaW5nKDM2KSxcbiAgICBJRCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGlkcHJlZml4ICsgKGlkZ2VuKyspLnRvU3RyaW5nKDM2KTtcbiAgICB9LFxuICAgIGRpZmYgPSBmdW5jdGlvbiAoYSwgYiwgQSwgQikge1xuICAgICAgICBpZiAoaXNBcnJheShhKSkge1xuICAgICAgICAgICAgcmVzID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBhLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICByZXNbaV0gPSBkaWZmKGFbaV0sIGIsIEFbaV0sIEIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgfVxuICAgICAgICB2YXIgZGlmID0gKEEgLSBhKSAvIChCIC0gYik7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoYmIpIHtcbiAgICAgICAgICAgIHJldHVybiBhICsgZGlmICogKGJiIC0gYik7XG4gICAgICAgIH07XG4gICAgfSxcbiAgICB0aW1lciA9IERhdGUubm93IHx8IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICtuZXcgRGF0ZTtcbiAgICB9LFxuICAgIHN0YSA9IGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgdmFyIGEgPSB0aGlzO1xuICAgICAgICBpZiAodmFsID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBhLnM7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGRzID0gYS5zIC0gdmFsO1xuICAgICAgICBhLmIgKz0gYS5kdXIgKiBkcztcbiAgICAgICAgYS5CICs9IGEuZHVyICogZHM7XG4gICAgICAgIGEucyA9IHZhbDtcbiAgICB9LFxuICAgIHNwZWVkID0gZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICB2YXIgYSA9IHRoaXM7XG4gICAgICAgIGlmICh2YWwgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIGEuc3BkO1xuICAgICAgICB9XG4gICAgICAgIGEuc3BkID0gdmFsO1xuICAgIH0sXG4gICAgZHVyYXRpb24gPSBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgIHZhciBhID0gdGhpcztcbiAgICAgICAgaWYgKHZhbCA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gYS5kdXI7XG4gICAgICAgIH1cbiAgICAgICAgYS5zID0gYS5zICogdmFsIC8gYS5kdXI7XG4gICAgICAgIGEuZHVyID0gdmFsO1xuICAgIH0sXG4gICAgc3RvcGl0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYSA9IHRoaXM7XG4gICAgICAgIGRlbGV0ZSBhbmltYXRpb25zW2EuaWRdO1xuICAgICAgICBhLnVwZGF0ZSgpO1xuICAgICAgICBldmUoXCJtaW5hLnN0b3AuXCIgKyBhLmlkLCBhKTtcbiAgICB9LFxuICAgIHBhdXNlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYSA9IHRoaXM7XG4gICAgICAgIGlmIChhLnBkaWYpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBkZWxldGUgYW5pbWF0aW9uc1thLmlkXTtcbiAgICAgICAgYS51cGRhdGUoKTtcbiAgICAgICAgYS5wZGlmID0gYS5nZXQoKSAtIGEuYjtcbiAgICB9LFxuICAgIHJlc3VtZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGEgPSB0aGlzO1xuICAgICAgICBpZiAoIWEucGRpZikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGEuYiA9IGEuZ2V0KCkgLSBhLnBkaWY7XG4gICAgICAgIGRlbGV0ZSBhLnBkaWY7XG4gICAgICAgIGFuaW1hdGlvbnNbYS5pZF0gPSBhO1xuICAgIH0sXG4gICAgdXBkYXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYSA9IHRoaXMsXG4gICAgICAgICAgICByZXM7XG4gICAgICAgIGlmIChpc0FycmF5KGEuc3RhcnQpKSB7XG4gICAgICAgICAgICByZXMgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwLCBqaiA9IGEuc3RhcnQubGVuZ3RoOyBqIDwgamo7IGorKykge1xuICAgICAgICAgICAgICAgIHJlc1tqXSA9ICthLnN0YXJ0W2pdICtcbiAgICAgICAgICAgICAgICAgICAgKGEuZW5kW2pdIC0gYS5zdGFydFtqXSkgKiBhLmVhc2luZyhhLnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzID0gK2Euc3RhcnQgKyAoYS5lbmQgLSBhLnN0YXJ0KSAqIGEuZWFzaW5nKGEucyk7XG4gICAgICAgIH1cbiAgICAgICAgYS5zZXQocmVzKTtcbiAgICB9LFxuICAgIGZyYW1lID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbGVuID0gMDtcbiAgICAgICAgZm9yICh2YXIgaSBpbiBhbmltYXRpb25zKSBpZiAoYW5pbWF0aW9ucy5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAgdmFyIGEgPSBhbmltYXRpb25zW2ldLFxuICAgICAgICAgICAgICAgIGIgPSBhLmdldCgpLFxuICAgICAgICAgICAgICAgIHJlcztcbiAgICAgICAgICAgIGxlbisrO1xuICAgICAgICAgICAgYS5zID0gKGIgLSBhLmIpIC8gKGEuZHVyIC8gYS5zcGQpO1xuICAgICAgICAgICAgaWYgKGEucyA+PSAxKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGFuaW1hdGlvbnNbaV07XG4gICAgICAgICAgICAgICAgYS5zID0gMTtcbiAgICAgICAgICAgICAgICBsZW4tLTtcbiAgICAgICAgICAgICAgICAoZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBldmUoXCJtaW5hLmZpbmlzaC5cIiArIGEuaWQsIGEpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KGEpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGEudXBkYXRlKCk7XG4gICAgICAgIH1cbiAgICAgICAgbGVuICYmIHJlcXVlc3RBbmltRnJhbWUoZnJhbWUpO1xuICAgIH0sXG4gICAgLypcXFxuICAgICAqIG1pbmFcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEdlbmVyaWMgYW5pbWF0aW9uIG9mIG51bWJlcnNcbiAgICAgKipcbiAgICAgLSBhIChudW1iZXIpIHN0YXJ0IF9zbGF2ZV8gbnVtYmVyXG4gICAgIC0gQSAobnVtYmVyKSBlbmQgX3NsYXZlXyBudW1iZXJcbiAgICAgLSBiIChudW1iZXIpIHN0YXJ0IF9tYXN0ZXJfIG51bWJlciAoc3RhcnQgdGltZSBpbiBnZW5lcmFsIGNhc2UpXG4gICAgIC0gQiAobnVtYmVyKSBlbmQgX21hc3Rlcl8gbnVtYmVyIChlbmQgdGltZSBpbiBnZXJlYWwgY2FzZSlcbiAgICAgLSBnZXQgKGZ1bmN0aW9uKSBnZXR0ZXIgb2YgX21hc3Rlcl8gbnVtYmVyIChzZWUgQG1pbmEudGltZSlcbiAgICAgLSBzZXQgKGZ1bmN0aW9uKSBzZXR0ZXIgb2YgX3NsYXZlXyBudW1iZXJcbiAgICAgLSBlYXNpbmcgKGZ1bmN0aW9uKSAjb3B0aW9uYWwgZWFzaW5nIGZ1bmN0aW9uLCBkZWZhdWx0IGlzIEBtaW5hLmxpbmVhclxuICAgICA9IChvYmplY3QpIGFuaW1hdGlvbiBkZXNjcmlwdG9yXG4gICAgIG8ge1xuICAgICBvICAgICAgICAgaWQgKHN0cmluZykgYW5pbWF0aW9uIGlkLFxuICAgICBvICAgICAgICAgc3RhcnQgKG51bWJlcikgc3RhcnQgX3NsYXZlXyBudW1iZXIsXG4gICAgIG8gICAgICAgICBlbmQgKG51bWJlcikgZW5kIF9zbGF2ZV8gbnVtYmVyLFxuICAgICBvICAgICAgICAgYiAobnVtYmVyKSBzdGFydCBfbWFzdGVyXyBudW1iZXIsXG4gICAgIG8gICAgICAgICBzIChudW1iZXIpIGFuaW1hdGlvbiBzdGF0dXMgKDAuLjEpLFxuICAgICBvICAgICAgICAgZHVyIChudW1iZXIpIGFuaW1hdGlvbiBkdXJhdGlvbixcbiAgICAgbyAgICAgICAgIHNwZCAobnVtYmVyKSBhbmltYXRpb24gc3BlZWQsXG4gICAgIG8gICAgICAgICBnZXQgKGZ1bmN0aW9uKSBnZXR0ZXIgb2YgX21hc3Rlcl8gbnVtYmVyIChzZWUgQG1pbmEudGltZSksXG4gICAgIG8gICAgICAgICBzZXQgKGZ1bmN0aW9uKSBzZXR0ZXIgb2YgX3NsYXZlXyBudW1iZXIsXG4gICAgIG8gICAgICAgICBlYXNpbmcgKGZ1bmN0aW9uKSBlYXNpbmcgZnVuY3Rpb24sIGRlZmF1bHQgaXMgQG1pbmEubGluZWFyLFxuICAgICBvICAgICAgICAgc3RhdHVzIChmdW5jdGlvbikgc3RhdHVzIGdldHRlci9zZXR0ZXIsXG4gICAgIG8gICAgICAgICBzcGVlZCAoZnVuY3Rpb24pIHNwZWVkIGdldHRlci9zZXR0ZXIsXG4gICAgIG8gICAgICAgICBkdXJhdGlvbiAoZnVuY3Rpb24pIGR1cmF0aW9uIGdldHRlci9zZXR0ZXIsXG4gICAgIG8gICAgICAgICBzdG9wIChmdW5jdGlvbikgYW5pbWF0aW9uIHN0b3BwZXJcbiAgICAgbyAgICAgICAgIHBhdXNlIChmdW5jdGlvbikgcGF1c2VzIHRoZSBhbmltYXRpb25cbiAgICAgbyAgICAgICAgIHJlc3VtZSAoZnVuY3Rpb24pIHJlc3VtZXMgdGhlIGFuaW1hdGlvblxuICAgICBvICAgICAgICAgdXBkYXRlIChmdW5jdGlvbikgY2FsbGVzIHNldHRlciB3aXRoIHRoZSByaWdodCB2YWx1ZSBvZiB0aGUgYW5pbWF0aW9uXG4gICAgIG8gfVxuICAgIFxcKi9cbiAgICBtaW5hID0gZnVuY3Rpb24gKGEsIEEsIGIsIEIsIGdldCwgc2V0LCBlYXNpbmcpIHtcbiAgICAgICAgdmFyIGFuaW0gPSB7XG4gICAgICAgICAgICBpZDogSUQoKSxcbiAgICAgICAgICAgIHN0YXJ0OiBhLFxuICAgICAgICAgICAgZW5kOiBBLFxuICAgICAgICAgICAgYjogYixcbiAgICAgICAgICAgIHM6IDAsXG4gICAgICAgICAgICBkdXI6IEIgLSBiLFxuICAgICAgICAgICAgc3BkOiAxLFxuICAgICAgICAgICAgZ2V0OiBnZXQsXG4gICAgICAgICAgICBzZXQ6IHNldCxcbiAgICAgICAgICAgIGVhc2luZzogZWFzaW5nIHx8IG1pbmEubGluZWFyLFxuICAgICAgICAgICAgc3RhdHVzOiBzdGEsXG4gICAgICAgICAgICBzcGVlZDogc3BlZWQsXG4gICAgICAgICAgICBkdXJhdGlvbjogZHVyYXRpb24sXG4gICAgICAgICAgICBzdG9wOiBzdG9waXQsXG4gICAgICAgICAgICBwYXVzZTogcGF1c2UsXG4gICAgICAgICAgICByZXN1bWU6IHJlc3VtZSxcbiAgICAgICAgICAgIHVwZGF0ZTogdXBkYXRlXG4gICAgICAgIH07XG4gICAgICAgIGFuaW1hdGlvbnNbYW5pbS5pZF0gPSBhbmltO1xuICAgICAgICB2YXIgbGVuID0gMCwgaTtcbiAgICAgICAgZm9yIChpIGluIGFuaW1hdGlvbnMpIGlmIChhbmltYXRpb25zLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICBsZW4rKztcbiAgICAgICAgICAgIGlmIChsZW4gPT0gMikge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGxlbiA9PSAxICYmIHJlcXVlc3RBbmltRnJhbWUoZnJhbWUpO1xuICAgICAgICByZXR1cm4gYW5pbTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBtaW5hLnRpbWVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybnMgdGhlIGN1cnJlbnQgdGltZS4gRXF1aXZhbGVudCB0bzpcbiAgICAgfCBmdW5jdGlvbiAoKSB7XG4gICAgIHwgICAgIHJldHVybiAobmV3IERhdGUpLmdldFRpbWUoKTtcbiAgICAgfCB9XG4gICAgXFwqL1xuICAgIG1pbmEudGltZSA9IHRpbWVyO1xuICAgIC8qXFxcbiAgICAgKiBtaW5hLmdldEJ5SWRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybnMgYW4gYW5pbWF0aW9uIGJ5IGl0cyBpZFxuICAgICAtIGlkIChzdHJpbmcpIGFuaW1hdGlvbidzIGlkXG4gICAgID0gKG9iamVjdCkgU2VlIEBtaW5hXG4gICAgXFwqL1xuICAgIG1pbmEuZ2V0QnlJZCA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICByZXR1cm4gYW5pbWF0aW9uc1tpZF0gfHwgbnVsbDtcbiAgICB9O1xuXG4gICAgLypcXFxuICAgICAqIG1pbmEubGluZWFyXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBEZWZhdWx0IGxpbmVhciBlYXNpbmdcbiAgICAgLSBuIChudW1iZXIpIGlucHV0IDAuLjFcbiAgICAgPSAobnVtYmVyKSBvdXRwdXQgMC4uMVxuICAgIFxcKi9cbiAgICBtaW5hLmxpbmVhciA9IGZ1bmN0aW9uIChuKSB7XG4gICAgICAgIHJldHVybiBuO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIG1pbmEuZWFzZW91dFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogRWFzZW91dCBlYXNpbmdcbiAgICAgLSBuIChudW1iZXIpIGlucHV0IDAuLjFcbiAgICAgPSAobnVtYmVyKSBvdXRwdXQgMC4uMVxuICAgIFxcKi9cbiAgICBtaW5hLmVhc2VvdXQgPSBmdW5jdGlvbiAobikge1xuICAgICAgICByZXR1cm4gTWF0aC5wb3cobiwgMS43KTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBtaW5hLmVhc2VpblxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogRWFzZWluIGVhc2luZ1xuICAgICAtIG4gKG51bWJlcikgaW5wdXQgMC4uMVxuICAgICA9IChudW1iZXIpIG91dHB1dCAwLi4xXG4gICAgXFwqL1xuICAgIG1pbmEuZWFzZWluID0gZnVuY3Rpb24gKG4pIHtcbiAgICAgICAgcmV0dXJuIE1hdGgucG93KG4sIC40OCk7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogbWluYS5lYXNlaW5vdXRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEVhc2Vpbm91dCBlYXNpbmdcbiAgICAgLSBuIChudW1iZXIpIGlucHV0IDAuLjFcbiAgICAgPSAobnVtYmVyKSBvdXRwdXQgMC4uMVxuICAgIFxcKi9cbiAgICBtaW5hLmVhc2Vpbm91dCA9IGZ1bmN0aW9uIChuKSB7XG4gICAgICAgIGlmIChuID09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9XG4gICAgICAgIGlmIChuID09IDApIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG4gICAgICAgIHZhciBxID0gLjQ4IC0gbiAvIDEuMDQsXG4gICAgICAgICAgICBRID0gTWF0aC5zcXJ0KC4xNzM0ICsgcSAqIHEpLFxuICAgICAgICAgICAgeCA9IFEgLSBxLFxuICAgICAgICAgICAgWCA9IE1hdGgucG93KE1hdGguYWJzKHgpLCAxIC8gMykgKiAoeCA8IDAgPyAtMSA6IDEpLFxuICAgICAgICAgICAgeSA9IC1RIC0gcSxcbiAgICAgICAgICAgIFkgPSBNYXRoLnBvdyhNYXRoLmFicyh5KSwgMSAvIDMpICogKHkgPCAwID8gLTEgOiAxKSxcbiAgICAgICAgICAgIHQgPSBYICsgWSArIC41O1xuICAgICAgICByZXR1cm4gKDEgLSB0KSAqIDMgKiB0ICogdCArIHQgKiB0ICogdDtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBtaW5hLmJhY2tpblxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQmFja2luIGVhc2luZ1xuICAgICAtIG4gKG51bWJlcikgaW5wdXQgMC4uMVxuICAgICA9IChudW1iZXIpIG91dHB1dCAwLi4xXG4gICAgXFwqL1xuICAgIG1pbmEuYmFja2luID0gZnVuY3Rpb24gKG4pIHtcbiAgICAgICAgaWYgKG4gPT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHMgPSAxLjcwMTU4O1xuICAgICAgICByZXR1cm4gbiAqIG4gKiAoKHMgKyAxKSAqIG4gLSBzKTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBtaW5hLmJhY2tvdXRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEJhY2tvdXQgZWFzaW5nXG4gICAgIC0gbiAobnVtYmVyKSBpbnB1dCAwLi4xXG4gICAgID0gKG51bWJlcikgb3V0cHV0IDAuLjFcbiAgICBcXCovXG4gICAgbWluYS5iYWNrb3V0ID0gZnVuY3Rpb24gKG4pIHtcbiAgICAgICAgaWYgKG4gPT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cbiAgICAgICAgbiA9IG4gLSAxO1xuICAgICAgICB2YXIgcyA9IDEuNzAxNTg7XG4gICAgICAgIHJldHVybiBuICogbiAqICgocyArIDEpICogbiArIHMpICsgMTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBtaW5hLmVsYXN0aWNcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEVsYXN0aWMgZWFzaW5nXG4gICAgIC0gbiAobnVtYmVyKSBpbnB1dCAwLi4xXG4gICAgID0gKG51bWJlcikgb3V0cHV0IDAuLjFcbiAgICBcXCovXG4gICAgbWluYS5lbGFzdGljID0gZnVuY3Rpb24gKG4pIHtcbiAgICAgICAgaWYgKG4gPT0gISFuKSB7XG4gICAgICAgICAgICByZXR1cm4gbjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gTWF0aC5wb3coMiwgLTEwICogbikgKiBNYXRoLnNpbigobiAtIC4wNzUpICpcbiAgICAgICAgICAgICgyICogTWF0aC5QSSkgLyAuMykgKyAxO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIG1pbmEuYm91bmNlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBCb3VuY2UgZWFzaW5nXG4gICAgIC0gbiAobnVtYmVyKSBpbnB1dCAwLi4xXG4gICAgID0gKG51bWJlcikgb3V0cHV0IDAuLjFcbiAgICBcXCovXG4gICAgbWluYS5ib3VuY2UgPSBmdW5jdGlvbiAobikge1xuICAgICAgICB2YXIgcyA9IDcuNTYyNSxcbiAgICAgICAgICAgIHAgPSAyLjc1LFxuICAgICAgICAgICAgbDtcbiAgICAgICAgaWYgKG4gPCAoMSAvIHApKSB7XG4gICAgICAgICAgICBsID0gcyAqIG4gKiBuO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKG4gPCAoMiAvIHApKSB7XG4gICAgICAgICAgICAgICAgbiAtPSAoMS41IC8gcCk7XG4gICAgICAgICAgICAgICAgbCA9IHMgKiBuICogbiArIC43NTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKG4gPCAoMi41IC8gcCkpIHtcbiAgICAgICAgICAgICAgICAgICAgbiAtPSAoMi4yNSAvIHApO1xuICAgICAgICAgICAgICAgICAgICBsID0gcyAqIG4gKiBuICsgLjkzNzU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbiAtPSAoMi42MjUgLyBwKTtcbiAgICAgICAgICAgICAgICAgICAgbCA9IHMgKiBuICogbiArIC45ODQzNzU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBsO1xuICAgIH07XG4gICAgd2luZG93Lm1pbmEgPSBtaW5hO1xuICAgIHJldHVybiBtaW5hO1xufSkodHlwZW9mIGV2ZSA9PSBcInVuZGVmaW5lZFwiID8gZnVuY3Rpb24gKCkge30gOiBldmUpO1xuLy8gQ29weXJpZ2h0IChjKSAyMDEzIC0gMjAxNSBBZG9iZSBTeXN0ZW1zIEluY29ycG9yYXRlZC4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIFxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy8gXG4vLyBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vIFxuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cblxudmFyIFNuYXAgPSAoZnVuY3Rpb24ocm9vdCkge1xuU25hcC52ZXJzaW9uID0gXCIwLjQuMFwiO1xuLypcXFxuICogU25hcFxuIFsgbWV0aG9kIF1cbiAqKlxuICogQ3JlYXRlcyBhIGRyYXdpbmcgc3VyZmFjZSBvciB3cmFwcyBleGlzdGluZyBTVkcgZWxlbWVudC5cbiAqKlxuIC0gd2lkdGggKG51bWJlcnxzdHJpbmcpIHdpZHRoIG9mIHN1cmZhY2VcbiAtIGhlaWdodCAobnVtYmVyfHN0cmluZykgaGVpZ2h0IG9mIHN1cmZhY2VcbiAqIG9yXG4gLSBET00gKFNWR0VsZW1lbnQpIGVsZW1lbnQgdG8gYmUgd3JhcHBlZCBpbnRvIFNuYXAgc3RydWN0dXJlXG4gKiBvclxuIC0gYXJyYXkgKGFycmF5KSBhcnJheSBvZiBlbGVtZW50cyAod2lsbCByZXR1cm4gc2V0IG9mIGVsZW1lbnRzKVxuICogb3JcbiAtIHF1ZXJ5IChzdHJpbmcpIENTUyBxdWVyeSBzZWxlY3RvclxuID0gKG9iamVjdCkgQEVsZW1lbnRcblxcKi9cbmZ1bmN0aW9uIFNuYXAodywgaCkge1xuICAgIGlmICh3KSB7XG4gICAgICAgIGlmICh3Lm5vZGVUeXBlKSB7XG4gICAgICAgICAgICByZXR1cm4gd3JhcCh3KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXModywgXCJhcnJheVwiKSAmJiBTbmFwLnNldCkge1xuICAgICAgICAgICAgcmV0dXJuIFNuYXAuc2V0LmFwcGx5KFNuYXAsIHcpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh3IGluc3RhbmNlb2YgRWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuIHc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGggPT0gbnVsbCkge1xuICAgICAgICAgICAgdyA9IGdsb2IuZG9jLnF1ZXJ5U2VsZWN0b3IoU3RyaW5nKHcpKTtcbiAgICAgICAgICAgIHJldHVybiB3cmFwKHcpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHcgPSB3ID09IG51bGwgPyBcIjEwMCVcIiA6IHc7XG4gICAgaCA9IGggPT0gbnVsbCA/IFwiMTAwJVwiIDogaDtcbiAgICByZXR1cm4gbmV3IFBhcGVyKHcsIGgpO1xufVxuU25hcC50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gXCJTbmFwIHZcIiArIHRoaXMudmVyc2lvbjtcbn07XG5TbmFwLl8gPSB7fTtcbnZhciBnbG9iID0ge1xuICAgIHdpbjogcm9vdC53aW5kb3csXG4gICAgZG9jOiByb290LndpbmRvdy5kb2N1bWVudFxufTtcblNuYXAuXy5nbG9iID0gZ2xvYjtcbnZhciBoYXMgPSBcImhhc093blByb3BlcnR5XCIsXG4gICAgU3RyID0gU3RyaW5nLFxuICAgIHRvRmxvYXQgPSBwYXJzZUZsb2F0LFxuICAgIHRvSW50ID0gcGFyc2VJbnQsXG4gICAgbWF0aCA9IE1hdGgsXG4gICAgbW1heCA9IG1hdGgubWF4LFxuICAgIG1taW4gPSBtYXRoLm1pbixcbiAgICBhYnMgPSBtYXRoLmFicyxcbiAgICBwb3cgPSBtYXRoLnBvdyxcbiAgICBQSSA9IG1hdGguUEksXG4gICAgcm91bmQgPSBtYXRoLnJvdW5kLFxuICAgIEUgPSBcIlwiLFxuICAgIFMgPSBcIiBcIixcbiAgICBvYmplY3RUb1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcsXG4gICAgSVNVUkwgPSAvXnVybFxcKFsnXCJdPyhbXlxcKV0rPylbJ1wiXT9cXCkkL2ksXG4gICAgY29sb3VyUmVnRXhwID0gL15cXHMqKCgjW2EtZlxcZF17Nn0pfCgjW2EtZlxcZF17M30pfHJnYmE/XFwoXFxzKihbXFxkXFwuXSslP1xccyosXFxzKltcXGRcXC5dKyU/XFxzKixcXHMqW1xcZFxcLl0rJT8oPzpcXHMqLFxccypbXFxkXFwuXSslPyk/KVxccypcXCl8aHNiYT9cXChcXHMqKFtcXGRcXC5dKyg/OmRlZ3xcXHhiMHwlKT9cXHMqLFxccypbXFxkXFwuXSslP1xccyosXFxzKltcXGRcXC5dKyg/OiU/XFxzKixcXHMqW1xcZFxcLl0rKT8lPylcXHMqXFwpfGhzbGE/XFwoXFxzKihbXFxkXFwuXSsoPzpkZWd8XFx4YjB8JSk/XFxzKixcXHMqW1xcZFxcLl0rJT9cXHMqLFxccypbXFxkXFwuXSsoPzolP1xccyosXFxzKltcXGRcXC5dKyk/JT8pXFxzKlxcKSlcXHMqJC9pLFxuICAgIGJlemllcnJnID0gL14oPzpjdWJpYy0pP2JlemllclxcKChbXixdKyksKFteLF0rKSwoW14sXSspLChbXlxcKV0rKVxcKS8sXG4gICAgcmVVUkxWYWx1ZSA9IC9edXJsXFwoIz8oW14pXSspXFwpJC8sXG4gICAgc2VwYXJhdG9yID0gU25hcC5fLnNlcGFyYXRvciA9IC9bLFxcc10rLyxcbiAgICB3aGl0ZXNwYWNlID0gL1tcXHNdL2csXG4gICAgY29tbWFTcGFjZXMgPSAvW1xcc10qLFtcXHNdKi8sXG4gICAgaHNyZyA9IHtoczogMSwgcmc6IDF9LFxuICAgIHBhdGhDb21tYW5kID0gLyhbYS16XSlbXFxzLF0qKCgtP1xcZCpcXC4/XFxkKig/OmVbXFwtK10/XFxkKyk/W1xcc10qLD9bXFxzXSopKykvaWcsXG4gICAgdENvbW1hbmQgPSAvKFtyc3RtXSlbXFxzLF0qKCgtP1xcZCpcXC4/XFxkKig/OmVbXFwtK10/XFxkKyk/W1xcc10qLD9bXFxzXSopKykvaWcsXG4gICAgcGF0aFZhbHVlcyA9IC8oLT9cXGQqXFwuP1xcZCooPzplW1xcLStdP1xcXFxkKyk/KVtcXHNdKiw/W1xcc10qL2lnLFxuICAgIGlkZ2VuID0gMCxcbiAgICBpZHByZWZpeCA9IFwiU1wiICsgKCtuZXcgRGF0ZSkudG9TdHJpbmcoMzYpLFxuICAgIElEID0gZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgIHJldHVybiAoZWwgJiYgZWwudHlwZSA/IGVsLnR5cGUgOiBFKSArIGlkcHJlZml4ICsgKGlkZ2VuKyspLnRvU3RyaW5nKDM2KTtcbiAgICB9LFxuICAgIHhsaW5rID0gXCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rXCIsXG4gICAgeG1sbnMgPSBcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsXG4gICAgaHViID0ge30sXG4gICAgVVJMID0gU25hcC51cmwgPSBmdW5jdGlvbiAodXJsKSB7XG4gICAgICAgIHJldHVybiBcInVybCgnI1wiICsgdXJsICsgXCInKVwiO1xuICAgIH07XG5cbmZ1bmN0aW9uICQoZWwsIGF0dHIpIHtcbiAgICBpZiAoYXR0cikge1xuICAgICAgICBpZiAoZWwgPT0gXCIjdGV4dFwiKSB7XG4gICAgICAgICAgICBlbCA9IGdsb2IuZG9jLmNyZWF0ZVRleHROb2RlKGF0dHIudGV4dCB8fCBhdHRyW1wiI3RleHRcIl0gfHwgXCJcIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVsID09IFwiI2NvbW1lbnRcIikge1xuICAgICAgICAgICAgZWwgPSBnbG9iLmRvYy5jcmVhdGVDb21tZW50KGF0dHIudGV4dCB8fCBhdHRyW1wiI3RleHRcIl0gfHwgXCJcIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBlbCA9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBlbCA9ICQoZWwpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgYXR0ciA9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBpZiAoZWwubm9kZVR5cGUgPT0gMSkge1xuICAgICAgICAgICAgICAgIGlmIChhdHRyLnN1YnN0cmluZygwLCA2KSA9PSBcInhsaW5rOlwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlbC5nZXRBdHRyaWJ1dGVOUyh4bGluaywgYXR0ci5zdWJzdHJpbmcoNikpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoYXR0ci5zdWJzdHJpbmcoMCwgNCkgPT0gXCJ4bWw6XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVsLmdldEF0dHJpYnV0ZU5TKHhtbG5zLCBhdHRyLnN1YnN0cmluZyg0KSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBlbC5nZXRBdHRyaWJ1dGUoYXR0cik7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGF0dHIgPT0gXCJ0ZXh0XCIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWwubm9kZVZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoZWwubm9kZVR5cGUgPT0gMSkge1xuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIGF0dHIpIGlmIChhdHRyW2hhc10oa2V5KSkge1xuICAgICAgICAgICAgICAgIHZhciB2YWwgPSBTdHIoYXR0cltrZXldKTtcbiAgICAgICAgICAgICAgICBpZiAodmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChrZXkuc3Vic3RyaW5nKDAsIDYpID09IFwieGxpbms6XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsLnNldEF0dHJpYnV0ZU5TKHhsaW5rLCBrZXkuc3Vic3RyaW5nKDYpLCB2YWwpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGtleS5zdWJzdHJpbmcoMCwgNCkgPT0gXCJ4bWw6XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsLnNldEF0dHJpYnV0ZU5TKHhtbG5zLCBrZXkuc3Vic3RyaW5nKDQpLCB2YWwpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZWwuc2V0QXR0cmlidXRlKGtleSwgdmFsKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGVsLnJlbW92ZUF0dHJpYnV0ZShrZXkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChcInRleHRcIiBpbiBhdHRyKSB7XG4gICAgICAgICAgICBlbC5ub2RlVmFsdWUgPSBhdHRyLnRleHQ7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBlbCA9IGdsb2IuZG9jLmNyZWF0ZUVsZW1lbnROUyh4bWxucywgZWwpO1xuICAgIH1cbiAgICByZXR1cm4gZWw7XG59XG5TbmFwLl8uJCA9ICQ7XG5TbmFwLl8uaWQgPSBJRDtcbmZ1bmN0aW9uIGdldEF0dHJzKGVsKSB7XG4gICAgdmFyIGF0dHJzID0gZWwuYXR0cmlidXRlcyxcbiAgICAgICAgbmFtZSxcbiAgICAgICAgb3V0ID0ge307XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhdHRycy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoYXR0cnNbaV0ubmFtZXNwYWNlVVJJID09IHhsaW5rKSB7XG4gICAgICAgICAgICBuYW1lID0gXCJ4bGluazpcIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5hbWUgPSBcIlwiO1xuICAgICAgICB9XG4gICAgICAgIG5hbWUgKz0gYXR0cnNbaV0ubmFtZTtcbiAgICAgICAgb3V0W25hbWVdID0gYXR0cnNbaV0udGV4dENvbnRlbnQ7XG4gICAgfVxuICAgIHJldHVybiBvdXQ7XG59XG5mdW5jdGlvbiBpcyhvLCB0eXBlKSB7XG4gICAgdHlwZSA9IFN0ci5wcm90b3R5cGUudG9Mb3dlckNhc2UuY2FsbCh0eXBlKTtcbiAgICBpZiAodHlwZSA9PSBcImZpbml0ZVwiKSB7XG4gICAgICAgIHJldHVybiBpc0Zpbml0ZShvKTtcbiAgICB9XG4gICAgaWYgKHR5cGUgPT0gXCJhcnJheVwiICYmXG4gICAgICAgIChvIGluc3RhbmNlb2YgQXJyYXkgfHwgQXJyYXkuaXNBcnJheSAmJiBBcnJheS5pc0FycmF5KG8pKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuICAodHlwZSA9PSBcIm51bGxcIiAmJiBvID09PSBudWxsKSB8fFxuICAgICAgICAgICAgKHR5cGUgPT0gdHlwZW9mIG8gJiYgbyAhPT0gbnVsbCkgfHxcbiAgICAgICAgICAgICh0eXBlID09IFwib2JqZWN0XCIgJiYgbyA9PT0gT2JqZWN0KG8pKSB8fFxuICAgICAgICAgICAgb2JqZWN0VG9TdHJpbmcuY2FsbChvKS5zbGljZSg4LCAtMSkudG9Mb3dlckNhc2UoKSA9PSB0eXBlO1xufVxuLypcXFxuICogU25hcC5mb3JtYXRcbiBbIG1ldGhvZCBdXG4gKipcbiAqIFJlcGxhY2VzIGNvbnN0cnVjdGlvbiBvZiB0eXBlIGB7PG5hbWU+fWAgdG8gdGhlIGNvcnJlc3BvbmRpbmcgYXJndW1lbnRcbiAqKlxuIC0gdG9rZW4gKHN0cmluZykgc3RyaW5nIHRvIGZvcm1hdFxuIC0ganNvbiAob2JqZWN0KSBvYmplY3Qgd2hpY2ggcHJvcGVydGllcyBhcmUgdXNlZCBhcyBhIHJlcGxhY2VtZW50XG4gPSAoc3RyaW5nKSBmb3JtYXR0ZWQgc3RyaW5nXG4gPiBVc2FnZVxuIHwgLy8gdGhpcyBkcmF3cyBhIHJlY3Rhbmd1bGFyIHNoYXBlIGVxdWl2YWxlbnQgdG8gXCJNMTAsMjBoNDB2NTBoLTQwelwiXG4gfCBwYXBlci5wYXRoKFNuYXAuZm9ybWF0KFwiTXt4fSx7eX1oe2RpbS53aWR0aH12e2RpbS5oZWlnaHR9aHtkaW1bJ25lZ2F0aXZlIHdpZHRoJ119elwiLCB7XG4gfCAgICAgeDogMTAsXG4gfCAgICAgeTogMjAsXG4gfCAgICAgZGltOiB7XG4gfCAgICAgICAgIHdpZHRoOiA0MCxcbiB8ICAgICAgICAgaGVpZ2h0OiA1MCxcbiB8ICAgICAgICAgXCJuZWdhdGl2ZSB3aWR0aFwiOiAtNDBcbiB8ICAgICB9XG4gfCB9KSk7XG5cXCovXG5TbmFwLmZvcm1hdCA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHRva2VuUmVnZXggPSAvXFx7KFteXFx9XSspXFx9L2csXG4gICAgICAgIG9iak5vdGF0aW9uUmVnZXggPSAvKD86KD86XnxcXC4pKC4rPykoPz1cXFt8XFwufCR8XFwoKXxcXFsoJ3xcIikoLis/KVxcMlxcXSkoXFwoXFwpKT8vZywgLy8gbWF0Y2hlcyAueHh4eHggb3IgW1wieHh4eHhcIl0gdG8gcnVuIG92ZXIgb2JqZWN0IHByb3BlcnRpZXNcbiAgICAgICAgcmVwbGFjZXIgPSBmdW5jdGlvbiAoYWxsLCBrZXksIG9iaikge1xuICAgICAgICAgICAgdmFyIHJlcyA9IG9iajtcbiAgICAgICAgICAgIGtleS5yZXBsYWNlKG9iak5vdGF0aW9uUmVnZXgsIGZ1bmN0aW9uIChhbGwsIG5hbWUsIHF1b3RlLCBxdW90ZWROYW1lLCBpc0Z1bmMpIHtcbiAgICAgICAgICAgICAgICBuYW1lID0gbmFtZSB8fCBxdW90ZWROYW1lO1xuICAgICAgICAgICAgICAgIGlmIChyZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5hbWUgaW4gcmVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXMgPSByZXNbbmFtZV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdHlwZW9mIHJlcyA9PSBcImZ1bmN0aW9uXCIgJiYgaXNGdW5jICYmIChyZXMgPSByZXMoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXMgPSAocmVzID09IG51bGwgfHwgcmVzID09IG9iaiA/IGFsbCA6IHJlcykgKyBcIlwiO1xuICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgfTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHN0ciwgb2JqKSB7XG4gICAgICAgIHJldHVybiBTdHIoc3RyKS5yZXBsYWNlKHRva2VuUmVnZXgsIGZ1bmN0aW9uIChhbGwsIGtleSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcGxhY2VyKGFsbCwga2V5LCBvYmopO1xuICAgICAgICB9KTtcbiAgICB9O1xufSkoKTtcbmZ1bmN0aW9uIGNsb25lKG9iaikge1xuICAgIGlmICh0eXBlb2Ygb2JqID09IFwiZnVuY3Rpb25cIiB8fCBPYmplY3Qob2JqKSAhPT0gb2JqKSB7XG4gICAgICAgIHJldHVybiBvYmo7XG4gICAgfVxuICAgIHZhciByZXMgPSBuZXcgb2JqLmNvbnN0cnVjdG9yO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIGlmIChvYmpbaGFzXShrZXkpKSB7XG4gICAgICAgIHJlc1trZXldID0gY2xvbmUob2JqW2tleV0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufVxuU25hcC5fLmNsb25lID0gY2xvbmU7XG5mdW5jdGlvbiByZXB1c2goYXJyYXksIGl0ZW0pIHtcbiAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBhcnJheS5sZW5ndGg7IGkgPCBpaTsgaSsrKSBpZiAoYXJyYXlbaV0gPT09IGl0ZW0pIHtcbiAgICAgICAgcmV0dXJuIGFycmF5LnB1c2goYXJyYXkuc3BsaWNlKGksIDEpWzBdKTtcbiAgICB9XG59XG5mdW5jdGlvbiBjYWNoZXIoZiwgc2NvcGUsIHBvc3Rwcm9jZXNzb3IpIHtcbiAgICBmdW5jdGlvbiBuZXdmKCkge1xuICAgICAgICB2YXIgYXJnID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSxcbiAgICAgICAgICAgIGFyZ3MgPSBhcmcuam9pbihcIlxcdTI0MDBcIiksXG4gICAgICAgICAgICBjYWNoZSA9IG5ld2YuY2FjaGUgPSBuZXdmLmNhY2hlIHx8IHt9LFxuICAgICAgICAgICAgY291bnQgPSBuZXdmLmNvdW50ID0gbmV3Zi5jb3VudCB8fCBbXTtcbiAgICAgICAgaWYgKGNhY2hlW2hhc10oYXJncykpIHtcbiAgICAgICAgICAgIHJlcHVzaChjb3VudCwgYXJncyk7XG4gICAgICAgICAgICByZXR1cm4gcG9zdHByb2Nlc3NvciA/IHBvc3Rwcm9jZXNzb3IoY2FjaGVbYXJnc10pIDogY2FjaGVbYXJnc107XG4gICAgICAgIH1cbiAgICAgICAgY291bnQubGVuZ3RoID49IDFlMyAmJiBkZWxldGUgY2FjaGVbY291bnQuc2hpZnQoKV07XG4gICAgICAgIGNvdW50LnB1c2goYXJncyk7XG4gICAgICAgIGNhY2hlW2FyZ3NdID0gZi5hcHBseShzY29wZSwgYXJnKTtcbiAgICAgICAgcmV0dXJuIHBvc3Rwcm9jZXNzb3IgPyBwb3N0cHJvY2Vzc29yKGNhY2hlW2FyZ3NdKSA6IGNhY2hlW2FyZ3NdO1xuICAgIH1cbiAgICByZXR1cm4gbmV3Zjtcbn1cblNuYXAuXy5jYWNoZXIgPSBjYWNoZXI7XG5mdW5jdGlvbiBhbmdsZSh4MSwgeTEsIHgyLCB5MiwgeDMsIHkzKSB7XG4gICAgaWYgKHgzID09IG51bGwpIHtcbiAgICAgICAgdmFyIHggPSB4MSAtIHgyLFxuICAgICAgICAgICAgeSA9IHkxIC0geTI7XG4gICAgICAgIGlmICgheCAmJiAheSkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICgxODAgKyBtYXRoLmF0YW4yKC15LCAteCkgKiAxODAgLyBQSSArIDM2MCkgJSAzNjA7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGFuZ2xlKHgxLCB5MSwgeDMsIHkzKSAtIGFuZ2xlKHgyLCB5MiwgeDMsIHkzKTtcbiAgICB9XG59XG5mdW5jdGlvbiByYWQoZGVnKSB7XG4gICAgcmV0dXJuIGRlZyAlIDM2MCAqIFBJIC8gMTgwO1xufVxuZnVuY3Rpb24gZGVnKHJhZCkge1xuICAgIHJldHVybiByYWQgKiAxODAgLyBQSSAlIDM2MDtcbn1cbmZ1bmN0aW9uIHhfeSgpIHtcbiAgICByZXR1cm4gdGhpcy54ICsgUyArIHRoaXMueTtcbn1cbmZ1bmN0aW9uIHhfeV93X2goKSB7XG4gICAgcmV0dXJuIHRoaXMueCArIFMgKyB0aGlzLnkgKyBTICsgdGhpcy53aWR0aCArIFwiIFxceGQ3IFwiICsgdGhpcy5oZWlnaHQ7XG59XG5cbi8qXFxcbiAqIFNuYXAucmFkXG4gWyBtZXRob2QgXVxuICoqXG4gKiBUcmFuc2Zvcm0gYW5nbGUgdG8gcmFkaWFuc1xuIC0gZGVnIChudW1iZXIpIGFuZ2xlIGluIGRlZ3JlZXNcbiA9IChudW1iZXIpIGFuZ2xlIGluIHJhZGlhbnNcblxcKi9cblNuYXAucmFkID0gcmFkO1xuLypcXFxuICogU25hcC5kZWdcbiBbIG1ldGhvZCBdXG4gKipcbiAqIFRyYW5zZm9ybSBhbmdsZSB0byBkZWdyZWVzXG4gLSByYWQgKG51bWJlcikgYW5nbGUgaW4gcmFkaWFuc1xuID0gKG51bWJlcikgYW5nbGUgaW4gZGVncmVlc1xuXFwqL1xuU25hcC5kZWcgPSBkZWc7XG4vKlxcXG4gKiBTbmFwLnNpblxuIFsgbWV0aG9kIF1cbiAqKlxuICogRXF1aXZhbGVudCB0byBgTWF0aC5zaW4oKWAgb25seSB3b3JrcyB3aXRoIGRlZ3JlZXMsIG5vdCByYWRpYW5zLlxuIC0gYW5nbGUgKG51bWJlcikgYW5nbGUgaW4gZGVncmVlc1xuID0gKG51bWJlcikgc2luXG5cXCovXG5TbmFwLnNpbiA9IGZ1bmN0aW9uIChhbmdsZSkge1xuICAgIHJldHVybiBtYXRoLnNpbihTbmFwLnJhZChhbmdsZSkpO1xufTtcbi8qXFxcbiAqIFNuYXAudGFuXG4gWyBtZXRob2QgXVxuICoqXG4gKiBFcXVpdmFsZW50IHRvIGBNYXRoLnRhbigpYCBvbmx5IHdvcmtzIHdpdGggZGVncmVlcywgbm90IHJhZGlhbnMuXG4gLSBhbmdsZSAobnVtYmVyKSBhbmdsZSBpbiBkZWdyZWVzXG4gPSAobnVtYmVyKSB0YW5cblxcKi9cblNuYXAudGFuID0gZnVuY3Rpb24gKGFuZ2xlKSB7XG4gICAgcmV0dXJuIG1hdGgudGFuKFNuYXAucmFkKGFuZ2xlKSk7XG59O1xuLypcXFxuICogU25hcC5jb3NcbiBbIG1ldGhvZCBdXG4gKipcbiAqIEVxdWl2YWxlbnQgdG8gYE1hdGguY29zKClgIG9ubHkgd29ya3Mgd2l0aCBkZWdyZWVzLCBub3QgcmFkaWFucy5cbiAtIGFuZ2xlIChudW1iZXIpIGFuZ2xlIGluIGRlZ3JlZXNcbiA9IChudW1iZXIpIGNvc1xuXFwqL1xuU25hcC5jb3MgPSBmdW5jdGlvbiAoYW5nbGUpIHtcbiAgICByZXR1cm4gbWF0aC5jb3MoU25hcC5yYWQoYW5nbGUpKTtcbn07XG4vKlxcXG4gKiBTbmFwLmFzaW5cbiBbIG1ldGhvZCBdXG4gKipcbiAqIEVxdWl2YWxlbnQgdG8gYE1hdGguYXNpbigpYCBvbmx5IHdvcmtzIHdpdGggZGVncmVlcywgbm90IHJhZGlhbnMuXG4gLSBudW0gKG51bWJlcikgdmFsdWVcbiA9IChudW1iZXIpIGFzaW4gaW4gZGVncmVlc1xuXFwqL1xuU25hcC5hc2luID0gZnVuY3Rpb24gKG51bSkge1xuICAgIHJldHVybiBTbmFwLmRlZyhtYXRoLmFzaW4obnVtKSk7XG59O1xuLypcXFxuICogU25hcC5hY29zXG4gWyBtZXRob2QgXVxuICoqXG4gKiBFcXVpdmFsZW50IHRvIGBNYXRoLmFjb3MoKWAgb25seSB3b3JrcyB3aXRoIGRlZ3JlZXMsIG5vdCByYWRpYW5zLlxuIC0gbnVtIChudW1iZXIpIHZhbHVlXG4gPSAobnVtYmVyKSBhY29zIGluIGRlZ3JlZXNcblxcKi9cblNuYXAuYWNvcyA9IGZ1bmN0aW9uIChudW0pIHtcbiAgICByZXR1cm4gU25hcC5kZWcobWF0aC5hY29zKG51bSkpO1xufTtcbi8qXFxcbiAqIFNuYXAuYXRhblxuIFsgbWV0aG9kIF1cbiAqKlxuICogRXF1aXZhbGVudCB0byBgTWF0aC5hdGFuKClgIG9ubHkgd29ya3Mgd2l0aCBkZWdyZWVzLCBub3QgcmFkaWFucy5cbiAtIG51bSAobnVtYmVyKSB2YWx1ZVxuID0gKG51bWJlcikgYXRhbiBpbiBkZWdyZWVzXG5cXCovXG5TbmFwLmF0YW4gPSBmdW5jdGlvbiAobnVtKSB7XG4gICAgcmV0dXJuIFNuYXAuZGVnKG1hdGguYXRhbihudW0pKTtcbn07XG4vKlxcXG4gKiBTbmFwLmF0YW4yXG4gWyBtZXRob2QgXVxuICoqXG4gKiBFcXVpdmFsZW50IHRvIGBNYXRoLmF0YW4yKClgIG9ubHkgd29ya3Mgd2l0aCBkZWdyZWVzLCBub3QgcmFkaWFucy5cbiAtIG51bSAobnVtYmVyKSB2YWx1ZVxuID0gKG51bWJlcikgYXRhbjIgaW4gZGVncmVlc1xuXFwqL1xuU25hcC5hdGFuMiA9IGZ1bmN0aW9uIChudW0pIHtcbiAgICByZXR1cm4gU25hcC5kZWcobWF0aC5hdGFuMihudW0pKTtcbn07XG4vKlxcXG4gKiBTbmFwLmFuZ2xlXG4gWyBtZXRob2QgXVxuICoqXG4gKiBSZXR1cm5zIGFuIGFuZ2xlIGJldHdlZW4gdHdvIG9yIHRocmVlIHBvaW50c1xuID4gUGFyYW1ldGVyc1xuIC0geDEgKG51bWJlcikgeCBjb29yZCBvZiBmaXJzdCBwb2ludFxuIC0geTEgKG51bWJlcikgeSBjb29yZCBvZiBmaXJzdCBwb2ludFxuIC0geDIgKG51bWJlcikgeCBjb29yZCBvZiBzZWNvbmQgcG9pbnRcbiAtIHkyIChudW1iZXIpIHkgY29vcmQgb2Ygc2Vjb25kIHBvaW50XG4gLSB4MyAobnVtYmVyKSAjb3B0aW9uYWwgeCBjb29yZCBvZiB0aGlyZCBwb2ludFxuIC0geTMgKG51bWJlcikgI29wdGlvbmFsIHkgY29vcmQgb2YgdGhpcmQgcG9pbnRcbiA9IChudW1iZXIpIGFuZ2xlIGluIGRlZ3JlZXNcblxcKi9cblNuYXAuYW5nbGUgPSBhbmdsZTtcbi8qXFxcbiAqIFNuYXAubGVuXG4gWyBtZXRob2QgXVxuICoqXG4gKiBSZXR1cm5zIGRpc3RhbmNlIGJldHdlZW4gdHdvIHBvaW50c1xuID4gUGFyYW1ldGVyc1xuIC0geDEgKG51bWJlcikgeCBjb29yZCBvZiBmaXJzdCBwb2ludFxuIC0geTEgKG51bWJlcikgeSBjb29yZCBvZiBmaXJzdCBwb2ludFxuIC0geDIgKG51bWJlcikgeCBjb29yZCBvZiBzZWNvbmQgcG9pbnRcbiAtIHkyIChudW1iZXIpIHkgY29vcmQgb2Ygc2Vjb25kIHBvaW50XG4gPSAobnVtYmVyKSBkaXN0YW5jZVxuXFwqL1xuU25hcC5sZW4gPSBmdW5jdGlvbiAoeDEsIHkxLCB4MiwgeTIpIHtcbiAgICByZXR1cm4gTWF0aC5zcXJ0KFNuYXAubGVuMih4MSwgeTEsIHgyLCB5MikpO1xufTtcbi8qXFxcbiAqIFNuYXAubGVuMlxuIFsgbWV0aG9kIF1cbiAqKlxuICogUmV0dXJucyBzcXVhcmVkIGRpc3RhbmNlIGJldHdlZW4gdHdvIHBvaW50c1xuID4gUGFyYW1ldGVyc1xuIC0geDEgKG51bWJlcikgeCBjb29yZCBvZiBmaXJzdCBwb2ludFxuIC0geTEgKG51bWJlcikgeSBjb29yZCBvZiBmaXJzdCBwb2ludFxuIC0geDIgKG51bWJlcikgeCBjb29yZCBvZiBzZWNvbmQgcG9pbnRcbiAtIHkyIChudW1iZXIpIHkgY29vcmQgb2Ygc2Vjb25kIHBvaW50XG4gPSAobnVtYmVyKSBkaXN0YW5jZVxuXFwqL1xuU25hcC5sZW4yID0gZnVuY3Rpb24gKHgxLCB5MSwgeDIsIHkyKSB7XG4gICAgcmV0dXJuICh4MSAtIHgyKSAqICh4MSAtIHgyKSArICh5MSAtIHkyKSAqICh5MSAtIHkyKTtcbn07XG4vKlxcXG4gKiBTbmFwLmNsb3Nlc3RQb2ludFxuIFsgbWV0aG9kIF1cbiAqKlxuICogUmV0dXJucyBjbG9zZXN0IHBvaW50IHRvIGEgZ2l2ZW4gb25lIG9uIGEgZ2l2ZW4gcGF0aC5cbiA+IFBhcmFtZXRlcnNcbiAtIHBhdGggKEVsZW1lbnQpIHBhdGggZWxlbWVudFxuIC0geCAobnVtYmVyKSB4IGNvb3JkIG9mIGEgcG9pbnRcbiAtIHkgKG51bWJlcikgeSBjb29yZCBvZiBhIHBvaW50XG4gPSAob2JqZWN0KSBpbiBmb3JtYXRcbiB7XG4gICAgeCAobnVtYmVyKSB4IGNvb3JkIG9mIHRoZSBwb2ludCBvbiB0aGUgcGF0aFxuICAgIHkgKG51bWJlcikgeSBjb29yZCBvZiB0aGUgcG9pbnQgb24gdGhlIHBhdGhcbiAgICBsZW5ndGggKG51bWJlcikgbGVuZ3RoIG9mIHRoZSBwYXRoIHRvIHRoZSBwb2ludFxuICAgIGRpc3RhbmNlIChudW1iZXIpIGRpc3RhbmNlIGZyb20gdGhlIGdpdmVuIHBvaW50IHRvIHRoZSBwYXRoXG4gfVxuXFwqL1xuLy8gQ29waWVkIGZyb20gaHR0cDovL2JsLm9ja3Mub3JnL21ib3N0b2NrLzgwMjc2MzdcblNuYXAuY2xvc2VzdFBvaW50ID0gZnVuY3Rpb24gKHBhdGgsIHgsIHkpIHtcbiAgICBmdW5jdGlvbiBkaXN0YW5jZTIocCkge1xuICAgICAgICB2YXIgZHggPSBwLnggLSB4LFxuICAgICAgICAgICAgZHkgPSBwLnkgLSB5O1xuICAgICAgICByZXR1cm4gZHggKiBkeCArIGR5ICogZHk7XG4gICAgfVxuICAgIHZhciBwYXRoTm9kZSA9IHBhdGgubm9kZSxcbiAgICAgICAgcGF0aExlbmd0aCA9IHBhdGhOb2RlLmdldFRvdGFsTGVuZ3RoKCksXG4gICAgICAgIHByZWNpc2lvbiA9IHBhdGhMZW5ndGggLyBwYXRoTm9kZS5wYXRoU2VnTGlzdC5udW1iZXJPZkl0ZW1zICogLjEyNSxcbiAgICAgICAgYmVzdCxcbiAgICAgICAgYmVzdExlbmd0aCxcbiAgICAgICAgYmVzdERpc3RhbmNlID0gSW5maW5pdHk7XG5cbiAgICAvLyBsaW5lYXIgc2NhbiBmb3IgY29hcnNlIGFwcHJveGltYXRpb25cbiAgICBmb3IgKHZhciBzY2FuLCBzY2FuTGVuZ3RoID0gMCwgc2NhbkRpc3RhbmNlOyBzY2FuTGVuZ3RoIDw9IHBhdGhMZW5ndGg7IHNjYW5MZW5ndGggKz0gcHJlY2lzaW9uKSB7XG4gICAgICAgIGlmICgoc2NhbkRpc3RhbmNlID0gZGlzdGFuY2UyKHNjYW4gPSBwYXRoTm9kZS5nZXRQb2ludEF0TGVuZ3RoKHNjYW5MZW5ndGgpKSkgPCBiZXN0RGlzdGFuY2UpIHtcbiAgICAgICAgICAgIGJlc3QgPSBzY2FuLCBiZXN0TGVuZ3RoID0gc2Nhbkxlbmd0aCwgYmVzdERpc3RhbmNlID0gc2NhbkRpc3RhbmNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gYmluYXJ5IHNlYXJjaCBmb3IgcHJlY2lzZSBlc3RpbWF0ZVxuICAgIHByZWNpc2lvbiAqPSAuNTtcbiAgICB3aGlsZSAocHJlY2lzaW9uID4gLjUpIHtcbiAgICAgICAgdmFyIGJlZm9yZSxcbiAgICAgICAgICAgIGFmdGVyLFxuICAgICAgICAgICAgYmVmb3JlTGVuZ3RoLFxuICAgICAgICAgICAgYWZ0ZXJMZW5ndGgsXG4gICAgICAgICAgICBiZWZvcmVEaXN0YW5jZSxcbiAgICAgICAgICAgIGFmdGVyRGlzdGFuY2U7XG4gICAgICAgIGlmICgoYmVmb3JlTGVuZ3RoID0gYmVzdExlbmd0aCAtIHByZWNpc2lvbikgPj0gMCAmJiAoYmVmb3JlRGlzdGFuY2UgPSBkaXN0YW5jZTIoYmVmb3JlID0gcGF0aE5vZGUuZ2V0UG9pbnRBdExlbmd0aChiZWZvcmVMZW5ndGgpKSkgPCBiZXN0RGlzdGFuY2UpIHtcbiAgICAgICAgICAgIGJlc3QgPSBiZWZvcmUsIGJlc3RMZW5ndGggPSBiZWZvcmVMZW5ndGgsIGJlc3REaXN0YW5jZSA9IGJlZm9yZURpc3RhbmNlO1xuICAgICAgICB9IGVsc2UgaWYgKChhZnRlckxlbmd0aCA9IGJlc3RMZW5ndGggKyBwcmVjaXNpb24pIDw9IHBhdGhMZW5ndGggJiYgKGFmdGVyRGlzdGFuY2UgPSBkaXN0YW5jZTIoYWZ0ZXIgPSBwYXRoTm9kZS5nZXRQb2ludEF0TGVuZ3RoKGFmdGVyTGVuZ3RoKSkpIDwgYmVzdERpc3RhbmNlKSB7XG4gICAgICAgICAgICBiZXN0ID0gYWZ0ZXIsIGJlc3RMZW5ndGggPSBhZnRlckxlbmd0aCwgYmVzdERpc3RhbmNlID0gYWZ0ZXJEaXN0YW5jZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHByZWNpc2lvbiAqPSAuNTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGJlc3QgPSB7XG4gICAgICAgIHg6IGJlc3QueCxcbiAgICAgICAgeTogYmVzdC55LFxuICAgICAgICBsZW5ndGg6IGJlc3RMZW5ndGgsXG4gICAgICAgIGRpc3RhbmNlOiBNYXRoLnNxcnQoYmVzdERpc3RhbmNlKVxuICAgIH07XG4gICAgcmV0dXJuIGJlc3Q7XG59XG4vKlxcXG4gKiBTbmFwLmlzXG4gWyBtZXRob2QgXVxuICoqXG4gKiBIYW5keSByZXBsYWNlbWVudCBmb3IgdGhlIGB0eXBlb2ZgIG9wZXJhdG9yXG4gLSBvICjigKYpIGFueSBvYmplY3Qgb3IgcHJpbWl0aXZlXG4gLSB0eXBlIChzdHJpbmcpIG5hbWUgb2YgdGhlIHR5cGUsIGUuZy4sIGBzdHJpbmdgLCBgZnVuY3Rpb25gLCBgbnVtYmVyYCwgZXRjLlxuID0gKGJvb2xlYW4pIGB0cnVlYCBpZiBnaXZlbiB2YWx1ZSBpcyBvZiBnaXZlbiB0eXBlXG5cXCovXG5TbmFwLmlzID0gaXM7XG4vKlxcXG4gKiBTbmFwLnNuYXBUb1xuIFsgbWV0aG9kIF1cbiAqKlxuICogU25hcHMgZ2l2ZW4gdmFsdWUgdG8gZ2l2ZW4gZ3JpZFxuIC0gdmFsdWVzIChhcnJheXxudW1iZXIpIGdpdmVuIGFycmF5IG9mIHZhbHVlcyBvciBzdGVwIG9mIHRoZSBncmlkXG4gLSB2YWx1ZSAobnVtYmVyKSB2YWx1ZSB0byBhZGp1c3RcbiAtIHRvbGVyYW5jZSAobnVtYmVyKSAjb3B0aW9uYWwgbWF4aW11bSBkaXN0YW5jZSB0byB0aGUgdGFyZ2V0IHZhbHVlIHRoYXQgd291bGQgdHJpZ2dlciB0aGUgc25hcC4gRGVmYXVsdCBpcyBgMTBgLlxuID0gKG51bWJlcikgYWRqdXN0ZWQgdmFsdWVcblxcKi9cblNuYXAuc25hcFRvID0gZnVuY3Rpb24gKHZhbHVlcywgdmFsdWUsIHRvbGVyYW5jZSkge1xuICAgIHRvbGVyYW5jZSA9IGlzKHRvbGVyYW5jZSwgXCJmaW5pdGVcIikgPyB0b2xlcmFuY2UgOiAxMDtcbiAgICBpZiAoaXModmFsdWVzLCBcImFycmF5XCIpKSB7XG4gICAgICAgIHZhciBpID0gdmFsdWVzLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGktLSkgaWYgKGFicyh2YWx1ZXNbaV0gLSB2YWx1ZSkgPD0gdG9sZXJhbmNlKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWVzW2ldO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdmFsdWVzID0gK3ZhbHVlcztcbiAgICAgICAgdmFyIHJlbSA9IHZhbHVlICUgdmFsdWVzO1xuICAgICAgICBpZiAocmVtIDwgdG9sZXJhbmNlKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWUgLSByZW07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlbSA+IHZhbHVlcyAtIHRvbGVyYW5jZSkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlIC0gcmVtICsgdmFsdWVzO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbn07XG4vLyBDb2xvdXJcbi8qXFxcbiAqIFNuYXAuZ2V0UkdCXG4gWyBtZXRob2QgXVxuICoqXG4gKiBQYXJzZXMgY29sb3Igc3RyaW5nIGFzIFJHQiBvYmplY3RcbiAtIGNvbG9yIChzdHJpbmcpIGNvbG9yIHN0cmluZyBpbiBvbmUgb2YgdGhlIGZvbGxvd2luZyBmb3JtYXRzOlxuICMgPHVsPlxuICMgICAgIDxsaT5Db2xvciBuYW1lICg8Y29kZT5yZWQ8L2NvZGU+LCA8Y29kZT5ncmVlbjwvY29kZT4sIDxjb2RlPmNvcm5mbG93ZXJibHVlPC9jb2RlPiwgZXRjKTwvbGk+XG4gIyAgICAgPGxpPiPigKLigKLigKIg4oCUIHNob3J0ZW5lZCBIVE1MIGNvbG9yOiAoPGNvZGU+IzAwMDwvY29kZT4sIDxjb2RlPiNmYzA8L2NvZGU+LCBldGMuKTwvbGk+XG4gIyAgICAgPGxpPiPigKLigKLigKLigKLigKLigKIg4oCUIGZ1bGwgbGVuZ3RoIEhUTUwgY29sb3I6ICg8Y29kZT4jMDAwMDAwPC9jb2RlPiwgPGNvZGU+I2JkMjMwMDwvY29kZT4pPC9saT5cbiAjICAgICA8bGk+cmdiKOKAouKAouKAoiwg4oCi4oCi4oCiLCDigKLigKLigKIpIOKAlCByZWQsIGdyZWVuIGFuZCBibHVlIGNoYW5uZWxzIHZhbHVlczogKDxjb2RlPnJnYigyMDAsJm5ic3A7MTAwLCZuYnNwOzApPC9jb2RlPik8L2xpPlxuICMgICAgIDxsaT5yZ2JhKOKAouKAouKAoiwg4oCi4oCi4oCiLCDigKLigKLigKIsIOKAouKAouKAoikg4oCUIGFsc28gd2l0aCBvcGFjaXR5PC9saT5cbiAjICAgICA8bGk+cmdiKOKAouKAouKAoiUsIOKAouKAouKAoiUsIOKAouKAouKAoiUpIOKAlCBzYW1lIGFzIGFib3ZlLCBidXQgaW4gJTogKDxjb2RlPnJnYigxMDAlLCZuYnNwOzE3NSUsJm5ic3A7MCUpPC9jb2RlPik8L2xpPlxuICMgICAgIDxsaT5yZ2JhKOKAouKAouKAoiUsIOKAouKAouKAoiUsIOKAouKAouKAoiUsIOKAouKAouKAoiUpIOKAlCBhbHNvIHdpdGggb3BhY2l0eTwvbGk+XG4gIyAgICAgPGxpPmhzYijigKLigKLigKIsIOKAouKAouKAoiwg4oCi4oCi4oCiKSDigJQgaHVlLCBzYXR1cmF0aW9uIGFuZCBicmlnaHRuZXNzIHZhbHVlczogKDxjb2RlPmhzYigwLjUsJm5ic3A7MC4yNSwmbmJzcDsxKTwvY29kZT4pPC9saT5cbiAjICAgICA8bGk+aHNiYSjigKLigKLigKIsIOKAouKAouKAoiwg4oCi4oCi4oCiLCDigKLigKLigKIpIOKAlCBhbHNvIHdpdGggb3BhY2l0eTwvbGk+XG4gIyAgICAgPGxpPmhzYijigKLigKLigKIlLCDigKLigKLigKIlLCDigKLigKLigKIlKSDigJQgc2FtZSBhcyBhYm92ZSwgYnV0IGluICU8L2xpPlxuICMgICAgIDxsaT5oc2JhKOKAouKAouKAoiUsIOKAouKAouKAoiUsIOKAouKAouKAoiUsIOKAouKAouKAoiUpIOKAlCBhbHNvIHdpdGggb3BhY2l0eTwvbGk+XG4gIyAgICAgPGxpPmhzbCjigKLigKLigKIsIOKAouKAouKAoiwg4oCi4oCi4oCiKSDigJQgaHVlLCBzYXR1cmF0aW9uIGFuZCBsdW1pbm9zaXR5IHZhbHVlczogKDxjb2RlPmhzYigwLjUsJm5ic3A7MC4yNSwmbmJzcDswLjUpPC9jb2RlPik8L2xpPlxuICMgICAgIDxsaT5oc2xhKOKAouKAouKAoiwg4oCi4oCi4oCiLCDigKLigKLigKIsIOKAouKAouKAoikg4oCUIGFsc28gd2l0aCBvcGFjaXR5PC9saT5cbiAjICAgICA8bGk+aHNsKOKAouKAouKAoiUsIOKAouKAouKAoiUsIOKAouKAouKAoiUpIOKAlCBzYW1lIGFzIGFib3ZlLCBidXQgaW4gJTwvbGk+XG4gIyAgICAgPGxpPmhzbGEo4oCi4oCi4oCiJSwg4oCi4oCi4oCiJSwg4oCi4oCi4oCiJSwg4oCi4oCi4oCiJSkg4oCUIGFsc28gd2l0aCBvcGFjaXR5PC9saT5cbiAjIDwvdWw+XG4gKiBOb3RlIHRoYXQgYCVgIGNhbiBiZSB1c2VkIGFueSB0aW1lOiBgcmdiKDIwJSwgMjU1LCA1MCUpYC5cbiA9IChvYmplY3QpIFJHQiBvYmplY3QgaW4gdGhlIGZvbGxvd2luZyBmb3JtYXQ6XG4gbyB7XG4gbyAgICAgciAobnVtYmVyKSByZWQsXG4gbyAgICAgZyAobnVtYmVyKSBncmVlbixcbiBvICAgICBiIChudW1iZXIpIGJsdWUsXG4gbyAgICAgaGV4IChzdHJpbmcpIGNvbG9yIGluIEhUTUwvQ1NTIGZvcm1hdDogI+KAouKAouKAouKAouKAouKAoixcbiBvICAgICBlcnJvciAoYm9vbGVhbikgdHJ1ZSBpZiBzdHJpbmcgY2FuJ3QgYmUgcGFyc2VkXG4gbyB9XG5cXCovXG5TbmFwLmdldFJHQiA9IGNhY2hlcihmdW5jdGlvbiAoY29sb3VyKSB7XG4gICAgaWYgKCFjb2xvdXIgfHwgISEoKGNvbG91ciA9IFN0cihjb2xvdXIpKS5pbmRleE9mKFwiLVwiKSArIDEpKSB7XG4gICAgICAgIHJldHVybiB7cjogLTEsIGc6IC0xLCBiOiAtMSwgaGV4OiBcIm5vbmVcIiwgZXJyb3I6IDEsIHRvU3RyaW5nOiByZ2J0b1N0cmluZ307XG4gICAgfVxuICAgIGlmIChjb2xvdXIgPT0gXCJub25lXCIpIHtcbiAgICAgICAgcmV0dXJuIHtyOiAtMSwgZzogLTEsIGI6IC0xLCBoZXg6IFwibm9uZVwiLCB0b1N0cmluZzogcmdidG9TdHJpbmd9O1xuICAgIH1cbiAgICAhKGhzcmdbaGFzXShjb2xvdXIudG9Mb3dlckNhc2UoKS5zdWJzdHJpbmcoMCwgMikpIHx8IGNvbG91ci5jaGFyQXQoKSA9PSBcIiNcIikgJiYgKGNvbG91ciA9IHRvSGV4KGNvbG91cikpO1xuICAgIGlmICghY29sb3VyKSB7XG4gICAgICAgIHJldHVybiB7cjogLTEsIGc6IC0xLCBiOiAtMSwgaGV4OiBcIm5vbmVcIiwgZXJyb3I6IDEsIHRvU3RyaW5nOiByZ2J0b1N0cmluZ307XG4gICAgfVxuICAgIHZhciByZXMsXG4gICAgICAgIHJlZCxcbiAgICAgICAgZ3JlZW4sXG4gICAgICAgIGJsdWUsXG4gICAgICAgIG9wYWNpdHksXG4gICAgICAgIHQsXG4gICAgICAgIHZhbHVlcyxcbiAgICAgICAgcmdiID0gY29sb3VyLm1hdGNoKGNvbG91clJlZ0V4cCk7XG4gICAgaWYgKHJnYikge1xuICAgICAgICBpZiAocmdiWzJdKSB7XG4gICAgICAgICAgICBibHVlID0gdG9JbnQocmdiWzJdLnN1YnN0cmluZyg1KSwgMTYpO1xuICAgICAgICAgICAgZ3JlZW4gPSB0b0ludChyZ2JbMl0uc3Vic3RyaW5nKDMsIDUpLCAxNik7XG4gICAgICAgICAgICByZWQgPSB0b0ludChyZ2JbMl0uc3Vic3RyaW5nKDEsIDMpLCAxNik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJnYlszXSkge1xuICAgICAgICAgICAgYmx1ZSA9IHRvSW50KCh0ID0gcmdiWzNdLmNoYXJBdCgzKSkgKyB0LCAxNik7XG4gICAgICAgICAgICBncmVlbiA9IHRvSW50KCh0ID0gcmdiWzNdLmNoYXJBdCgyKSkgKyB0LCAxNik7XG4gICAgICAgICAgICByZWQgPSB0b0ludCgodCA9IHJnYlszXS5jaGFyQXQoMSkpICsgdCwgMTYpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZ2JbNF0pIHtcbiAgICAgICAgICAgIHZhbHVlcyA9IHJnYls0XS5zcGxpdChjb21tYVNwYWNlcyk7XG4gICAgICAgICAgICByZWQgPSB0b0Zsb2F0KHZhbHVlc1swXSk7XG4gICAgICAgICAgICB2YWx1ZXNbMF0uc2xpY2UoLTEpID09IFwiJVwiICYmIChyZWQgKj0gMi41NSk7XG4gICAgICAgICAgICBncmVlbiA9IHRvRmxvYXQodmFsdWVzWzFdKTtcbiAgICAgICAgICAgIHZhbHVlc1sxXS5zbGljZSgtMSkgPT0gXCIlXCIgJiYgKGdyZWVuICo9IDIuNTUpO1xuICAgICAgICAgICAgYmx1ZSA9IHRvRmxvYXQodmFsdWVzWzJdKTtcbiAgICAgICAgICAgIHZhbHVlc1syXS5zbGljZSgtMSkgPT0gXCIlXCIgJiYgKGJsdWUgKj0gMi41NSk7XG4gICAgICAgICAgICByZ2JbMV0udG9Mb3dlckNhc2UoKS5zbGljZSgwLCA0KSA9PSBcInJnYmFcIiAmJiAob3BhY2l0eSA9IHRvRmxvYXQodmFsdWVzWzNdKSk7XG4gICAgICAgICAgICB2YWx1ZXNbM10gJiYgdmFsdWVzWzNdLnNsaWNlKC0xKSA9PSBcIiVcIiAmJiAob3BhY2l0eSAvPSAxMDApO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZ2JbNV0pIHtcbiAgICAgICAgICAgIHZhbHVlcyA9IHJnYls1XS5zcGxpdChjb21tYVNwYWNlcyk7XG4gICAgICAgICAgICByZWQgPSB0b0Zsb2F0KHZhbHVlc1swXSk7XG4gICAgICAgICAgICB2YWx1ZXNbMF0uc2xpY2UoLTEpID09IFwiJVwiICYmIChyZWQgLz0gMTAwKTtcbiAgICAgICAgICAgIGdyZWVuID0gdG9GbG9hdCh2YWx1ZXNbMV0pO1xuICAgICAgICAgICAgdmFsdWVzWzFdLnNsaWNlKC0xKSA9PSBcIiVcIiAmJiAoZ3JlZW4gLz0gMTAwKTtcbiAgICAgICAgICAgIGJsdWUgPSB0b0Zsb2F0KHZhbHVlc1syXSk7XG4gICAgICAgICAgICB2YWx1ZXNbMl0uc2xpY2UoLTEpID09IFwiJVwiICYmIChibHVlIC89IDEwMCk7XG4gICAgICAgICAgICAodmFsdWVzWzBdLnNsaWNlKC0zKSA9PSBcImRlZ1wiIHx8IHZhbHVlc1swXS5zbGljZSgtMSkgPT0gXCJcXHhiMFwiKSAmJiAocmVkIC89IDM2MCk7XG4gICAgICAgICAgICByZ2JbMV0udG9Mb3dlckNhc2UoKS5zbGljZSgwLCA0KSA9PSBcImhzYmFcIiAmJiAob3BhY2l0eSA9IHRvRmxvYXQodmFsdWVzWzNdKSk7XG4gICAgICAgICAgICB2YWx1ZXNbM10gJiYgdmFsdWVzWzNdLnNsaWNlKC0xKSA9PSBcIiVcIiAmJiAob3BhY2l0eSAvPSAxMDApO1xuICAgICAgICAgICAgcmV0dXJuIFNuYXAuaHNiMnJnYihyZWQsIGdyZWVuLCBibHVlLCBvcGFjaXR5KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmdiWzZdKSB7XG4gICAgICAgICAgICB2YWx1ZXMgPSByZ2JbNl0uc3BsaXQoY29tbWFTcGFjZXMpO1xuICAgICAgICAgICAgcmVkID0gdG9GbG9hdCh2YWx1ZXNbMF0pO1xuICAgICAgICAgICAgdmFsdWVzWzBdLnNsaWNlKC0xKSA9PSBcIiVcIiAmJiAocmVkIC89IDEwMCk7XG4gICAgICAgICAgICBncmVlbiA9IHRvRmxvYXQodmFsdWVzWzFdKTtcbiAgICAgICAgICAgIHZhbHVlc1sxXS5zbGljZSgtMSkgPT0gXCIlXCIgJiYgKGdyZWVuIC89IDEwMCk7XG4gICAgICAgICAgICBibHVlID0gdG9GbG9hdCh2YWx1ZXNbMl0pO1xuICAgICAgICAgICAgdmFsdWVzWzJdLnNsaWNlKC0xKSA9PSBcIiVcIiAmJiAoYmx1ZSAvPSAxMDApO1xuICAgICAgICAgICAgKHZhbHVlc1swXS5zbGljZSgtMykgPT0gXCJkZWdcIiB8fCB2YWx1ZXNbMF0uc2xpY2UoLTEpID09IFwiXFx4YjBcIikgJiYgKHJlZCAvPSAzNjApO1xuICAgICAgICAgICAgcmdiWzFdLnRvTG93ZXJDYXNlKCkuc2xpY2UoMCwgNCkgPT0gXCJoc2xhXCIgJiYgKG9wYWNpdHkgPSB0b0Zsb2F0KHZhbHVlc1szXSkpO1xuICAgICAgICAgICAgdmFsdWVzWzNdICYmIHZhbHVlc1szXS5zbGljZSgtMSkgPT0gXCIlXCIgJiYgKG9wYWNpdHkgLz0gMTAwKTtcbiAgICAgICAgICAgIHJldHVybiBTbmFwLmhzbDJyZ2IocmVkLCBncmVlbiwgYmx1ZSwgb3BhY2l0eSk7XG4gICAgICAgIH1cbiAgICAgICAgcmVkID0gbW1pbihtYXRoLnJvdW5kKHJlZCksIDI1NSk7XG4gICAgICAgIGdyZWVuID0gbW1pbihtYXRoLnJvdW5kKGdyZWVuKSwgMjU1KTtcbiAgICAgICAgYmx1ZSA9IG1taW4obWF0aC5yb3VuZChibHVlKSwgMjU1KTtcbiAgICAgICAgb3BhY2l0eSA9IG1taW4obW1heChvcGFjaXR5LCAwKSwgMSk7XG4gICAgICAgIHJnYiA9IHtyOiByZWQsIGc6IGdyZWVuLCBiOiBibHVlLCB0b1N0cmluZzogcmdidG9TdHJpbmd9O1xuICAgICAgICByZ2IuaGV4ID0gXCIjXCIgKyAoMTY3NzcyMTYgfCBibHVlIHwgKGdyZWVuIDw8IDgpIHwgKHJlZCA8PCAxNikpLnRvU3RyaW5nKDE2KS5zbGljZSgxKTtcbiAgICAgICAgcmdiLm9wYWNpdHkgPSBpcyhvcGFjaXR5LCBcImZpbml0ZVwiKSA/IG9wYWNpdHkgOiAxO1xuICAgICAgICByZXR1cm4gcmdiO1xuICAgIH1cbiAgICByZXR1cm4ge3I6IC0xLCBnOiAtMSwgYjogLTEsIGhleDogXCJub25lXCIsIGVycm9yOiAxLCB0b1N0cmluZzogcmdidG9TdHJpbmd9O1xufSwgU25hcCk7XG4vKlxcXG4gKiBTbmFwLmhzYlxuIFsgbWV0aG9kIF1cbiAqKlxuICogQ29udmVydHMgSFNCIHZhbHVlcyB0byBhIGhleCByZXByZXNlbnRhdGlvbiBvZiB0aGUgY29sb3JcbiAtIGggKG51bWJlcikgaHVlXG4gLSBzIChudW1iZXIpIHNhdHVyYXRpb25cbiAtIGIgKG51bWJlcikgdmFsdWUgb3IgYnJpZ2h0bmVzc1xuID0gKHN0cmluZykgaGV4IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBjb2xvclxuXFwqL1xuU25hcC5oc2IgPSBjYWNoZXIoZnVuY3Rpb24gKGgsIHMsIGIpIHtcbiAgICByZXR1cm4gU25hcC5oc2IycmdiKGgsIHMsIGIpLmhleDtcbn0pO1xuLypcXFxuICogU25hcC5oc2xcbiBbIG1ldGhvZCBdXG4gKipcbiAqIENvbnZlcnRzIEhTTCB2YWx1ZXMgdG8gYSBoZXggcmVwcmVzZW50YXRpb24gb2YgdGhlIGNvbG9yXG4gLSBoIChudW1iZXIpIGh1ZVxuIC0gcyAobnVtYmVyKSBzYXR1cmF0aW9uXG4gLSBsIChudW1iZXIpIGx1bWlub3NpdHlcbiA9IChzdHJpbmcpIGhleCByZXByZXNlbnRhdGlvbiBvZiB0aGUgY29sb3JcblxcKi9cblNuYXAuaHNsID0gY2FjaGVyKGZ1bmN0aW9uIChoLCBzLCBsKSB7XG4gICAgcmV0dXJuIFNuYXAuaHNsMnJnYihoLCBzLCBsKS5oZXg7XG59KTtcbi8qXFxcbiAqIFNuYXAucmdiXG4gWyBtZXRob2QgXVxuICoqXG4gKiBDb252ZXJ0cyBSR0IgdmFsdWVzIHRvIGEgaGV4IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBjb2xvclxuIC0gciAobnVtYmVyKSByZWRcbiAtIGcgKG51bWJlcikgZ3JlZW5cbiAtIGIgKG51bWJlcikgYmx1ZVxuID0gKHN0cmluZykgaGV4IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBjb2xvclxuXFwqL1xuU25hcC5yZ2IgPSBjYWNoZXIoZnVuY3Rpb24gKHIsIGcsIGIsIG8pIHtcbiAgICBpZiAoaXMobywgXCJmaW5pdGVcIikpIHtcbiAgICAgICAgdmFyIHJvdW5kID0gbWF0aC5yb3VuZDtcbiAgICAgICAgcmV0dXJuIFwicmdiYShcIiArIFtyb3VuZChyKSwgcm91bmQoZyksIHJvdW5kKGIpLCArby50b0ZpeGVkKDIpXSArIFwiKVwiO1xuICAgIH1cbiAgICByZXR1cm4gXCIjXCIgKyAoMTY3NzcyMTYgfCBiIHwgKGcgPDwgOCkgfCAociA8PCAxNikpLnRvU3RyaW5nKDE2KS5zbGljZSgxKTtcbn0pO1xudmFyIHRvSGV4ID0gZnVuY3Rpb24gKGNvbG9yKSB7XG4gICAgdmFyIGkgPSBnbG9iLmRvYy5nZXRFbGVtZW50c0J5VGFnTmFtZShcImhlYWRcIilbMF0gfHwgZ2xvYi5kb2MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJzdmdcIilbMF0sXG4gICAgICAgIHJlZCA9IFwicmdiKDI1NSwgMCwgMClcIjtcbiAgICB0b0hleCA9IGNhY2hlcihmdW5jdGlvbiAoY29sb3IpIHtcbiAgICAgICAgaWYgKGNvbG9yLnRvTG93ZXJDYXNlKCkgPT0gXCJyZWRcIikge1xuICAgICAgICAgICAgcmV0dXJuIHJlZDtcbiAgICAgICAgfVxuICAgICAgICBpLnN0eWxlLmNvbG9yID0gcmVkO1xuICAgICAgICBpLnN0eWxlLmNvbG9yID0gY29sb3I7XG4gICAgICAgIHZhciBvdXQgPSBnbG9iLmRvYy5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKGksIEUpLmdldFByb3BlcnR5VmFsdWUoXCJjb2xvclwiKTtcbiAgICAgICAgcmV0dXJuIG91dCA9PSByZWQgPyBudWxsIDogb3V0O1xuICAgIH0pO1xuICAgIHJldHVybiB0b0hleChjb2xvcik7XG59LFxuaHNidG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFwiaHNiKFwiICsgW3RoaXMuaCwgdGhpcy5zLCB0aGlzLmJdICsgXCIpXCI7XG59LFxuaHNsdG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFwiaHNsKFwiICsgW3RoaXMuaCwgdGhpcy5zLCB0aGlzLmxdICsgXCIpXCI7XG59LFxucmdidG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMub3BhY2l0eSA9PSAxIHx8IHRoaXMub3BhY2l0eSA9PSBudWxsID9cbiAgICAgICAgICAgIHRoaXMuaGV4IDpcbiAgICAgICAgICAgIFwicmdiYShcIiArIFt0aGlzLnIsIHRoaXMuZywgdGhpcy5iLCB0aGlzLm9wYWNpdHldICsgXCIpXCI7XG59LFxucHJlcGFyZVJHQiA9IGZ1bmN0aW9uIChyLCBnLCBiKSB7XG4gICAgaWYgKGcgPT0gbnVsbCAmJiBpcyhyLCBcIm9iamVjdFwiKSAmJiBcInJcIiBpbiByICYmIFwiZ1wiIGluIHIgJiYgXCJiXCIgaW4gcikge1xuICAgICAgICBiID0gci5iO1xuICAgICAgICBnID0gci5nO1xuICAgICAgICByID0gci5yO1xuICAgIH1cbiAgICBpZiAoZyA9PSBudWxsICYmIGlzKHIsIHN0cmluZykpIHtcbiAgICAgICAgdmFyIGNsciA9IFNuYXAuZ2V0UkdCKHIpO1xuICAgICAgICByID0gY2xyLnI7XG4gICAgICAgIGcgPSBjbHIuZztcbiAgICAgICAgYiA9IGNsci5iO1xuICAgIH1cbiAgICBpZiAociA+IDEgfHwgZyA+IDEgfHwgYiA+IDEpIHtcbiAgICAgICAgciAvPSAyNTU7XG4gICAgICAgIGcgLz0gMjU1O1xuICAgICAgICBiIC89IDI1NTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIFtyLCBnLCBiXTtcbn0sXG5wYWNrYWdlUkdCID0gZnVuY3Rpb24gKHIsIGcsIGIsIG8pIHtcbiAgICByID0gbWF0aC5yb3VuZChyICogMjU1KTtcbiAgICBnID0gbWF0aC5yb3VuZChnICogMjU1KTtcbiAgICBiID0gbWF0aC5yb3VuZChiICogMjU1KTtcbiAgICB2YXIgcmdiID0ge1xuICAgICAgICByOiByLFxuICAgICAgICBnOiBnLFxuICAgICAgICBiOiBiLFxuICAgICAgICBvcGFjaXR5OiBpcyhvLCBcImZpbml0ZVwiKSA/IG8gOiAxLFxuICAgICAgICBoZXg6IFNuYXAucmdiKHIsIGcsIGIpLFxuICAgICAgICB0b1N0cmluZzogcmdidG9TdHJpbmdcbiAgICB9O1xuICAgIGlzKG8sIFwiZmluaXRlXCIpICYmIChyZ2Iub3BhY2l0eSA9IG8pO1xuICAgIHJldHVybiByZ2I7XG59O1xuLypcXFxuICogU25hcC5jb2xvclxuIFsgbWV0aG9kIF1cbiAqKlxuICogUGFyc2VzIHRoZSBjb2xvciBzdHJpbmcgYW5kIHJldHVybnMgYW4gb2JqZWN0IGZlYXR1cmluZyB0aGUgY29sb3IncyBjb21wb25lbnQgdmFsdWVzXG4gLSBjbHIgKHN0cmluZykgY29sb3Igc3RyaW5nIGluIG9uZSBvZiB0aGUgc3VwcG9ydGVkIGZvcm1hdHMgKHNlZSBAU25hcC5nZXRSR0IpXG4gPSAob2JqZWN0KSBDb21iaW5lZCBSR0IvSFNCIG9iamVjdCBpbiB0aGUgZm9sbG93aW5nIGZvcm1hdDpcbiBvIHtcbiBvICAgICByIChudW1iZXIpIHJlZCxcbiBvICAgICBnIChudW1iZXIpIGdyZWVuLFxuIG8gICAgIGIgKG51bWJlcikgYmx1ZSxcbiBvICAgICBoZXggKHN0cmluZykgY29sb3IgaW4gSFRNTC9DU1MgZm9ybWF0OiAj4oCi4oCi4oCi4oCi4oCi4oCiLFxuIG8gICAgIGVycm9yIChib29sZWFuKSBgdHJ1ZWAgaWYgc3RyaW5nIGNhbid0IGJlIHBhcnNlZCxcbiBvICAgICBoIChudW1iZXIpIGh1ZSxcbiBvICAgICBzIChudW1iZXIpIHNhdHVyYXRpb24sXG4gbyAgICAgdiAobnVtYmVyKSB2YWx1ZSAoYnJpZ2h0bmVzcyksXG4gbyAgICAgbCAobnVtYmVyKSBsaWdodG5lc3NcbiBvIH1cblxcKi9cblNuYXAuY29sb3IgPSBmdW5jdGlvbiAoY2xyKSB7XG4gICAgdmFyIHJnYjtcbiAgICBpZiAoaXMoY2xyLCBcIm9iamVjdFwiKSAmJiBcImhcIiBpbiBjbHIgJiYgXCJzXCIgaW4gY2xyICYmIFwiYlwiIGluIGNscikge1xuICAgICAgICByZ2IgPSBTbmFwLmhzYjJyZ2IoY2xyKTtcbiAgICAgICAgY2xyLnIgPSByZ2IucjtcbiAgICAgICAgY2xyLmcgPSByZ2IuZztcbiAgICAgICAgY2xyLmIgPSByZ2IuYjtcbiAgICAgICAgY2xyLm9wYWNpdHkgPSAxO1xuICAgICAgICBjbHIuaGV4ID0gcmdiLmhleDtcbiAgICB9IGVsc2UgaWYgKGlzKGNsciwgXCJvYmplY3RcIikgJiYgXCJoXCIgaW4gY2xyICYmIFwic1wiIGluIGNsciAmJiBcImxcIiBpbiBjbHIpIHtcbiAgICAgICAgcmdiID0gU25hcC5oc2wycmdiKGNscik7XG4gICAgICAgIGNsci5yID0gcmdiLnI7XG4gICAgICAgIGNsci5nID0gcmdiLmc7XG4gICAgICAgIGNsci5iID0gcmdiLmI7XG4gICAgICAgIGNsci5vcGFjaXR5ID0gMTtcbiAgICAgICAgY2xyLmhleCA9IHJnYi5oZXg7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGlzKGNsciwgXCJzdHJpbmdcIikpIHtcbiAgICAgICAgICAgIGNsciA9IFNuYXAuZ2V0UkdCKGNscik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzKGNsciwgXCJvYmplY3RcIikgJiYgXCJyXCIgaW4gY2xyICYmIFwiZ1wiIGluIGNsciAmJiBcImJcIiBpbiBjbHIgJiYgIShcImVycm9yXCIgaW4gY2xyKSkge1xuICAgICAgICAgICAgcmdiID0gU25hcC5yZ2IyaHNsKGNscik7XG4gICAgICAgICAgICBjbHIuaCA9IHJnYi5oO1xuICAgICAgICAgICAgY2xyLnMgPSByZ2IucztcbiAgICAgICAgICAgIGNsci5sID0gcmdiLmw7XG4gICAgICAgICAgICByZ2IgPSBTbmFwLnJnYjJoc2IoY2xyKTtcbiAgICAgICAgICAgIGNsci52ID0gcmdiLmI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjbHIgPSB7aGV4OiBcIm5vbmVcIn07XG4gICAgICAgICAgICBjbHIuciA9IGNsci5nID0gY2xyLmIgPSBjbHIuaCA9IGNsci5zID0gY2xyLnYgPSBjbHIubCA9IC0xO1xuICAgICAgICAgICAgY2xyLmVycm9yID0gMTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjbHIudG9TdHJpbmcgPSByZ2J0b1N0cmluZztcbiAgICByZXR1cm4gY2xyO1xufTtcbi8qXFxcbiAqIFNuYXAuaHNiMnJnYlxuIFsgbWV0aG9kIF1cbiAqKlxuICogQ29udmVydHMgSFNCIHZhbHVlcyB0byBhbiBSR0Igb2JqZWN0XG4gLSBoIChudW1iZXIpIGh1ZVxuIC0gcyAobnVtYmVyKSBzYXR1cmF0aW9uXG4gLSB2IChudW1iZXIpIHZhbHVlIG9yIGJyaWdodG5lc3NcbiA9IChvYmplY3QpIFJHQiBvYmplY3QgaW4gdGhlIGZvbGxvd2luZyBmb3JtYXQ6XG4gbyB7XG4gbyAgICAgciAobnVtYmVyKSByZWQsXG4gbyAgICAgZyAobnVtYmVyKSBncmVlbixcbiBvICAgICBiIChudW1iZXIpIGJsdWUsXG4gbyAgICAgaGV4IChzdHJpbmcpIGNvbG9yIGluIEhUTUwvQ1NTIGZvcm1hdDogI+KAouKAouKAouKAouKAouKAolxuIG8gfVxuXFwqL1xuU25hcC5oc2IycmdiID0gZnVuY3Rpb24gKGgsIHMsIHYsIG8pIHtcbiAgICBpZiAoaXMoaCwgXCJvYmplY3RcIikgJiYgXCJoXCIgaW4gaCAmJiBcInNcIiBpbiBoICYmIFwiYlwiIGluIGgpIHtcbiAgICAgICAgdiA9IGguYjtcbiAgICAgICAgcyA9IGgucztcbiAgICAgICAgbyA9IGgubztcbiAgICAgICAgaCA9IGguaDtcbiAgICB9XG4gICAgaCAqPSAzNjA7XG4gICAgdmFyIFIsIEcsIEIsIFgsIEM7XG4gICAgaCA9IChoICUgMzYwKSAvIDYwO1xuICAgIEMgPSB2ICogcztcbiAgICBYID0gQyAqICgxIC0gYWJzKGggJSAyIC0gMSkpO1xuICAgIFIgPSBHID0gQiA9IHYgLSBDO1xuXG4gICAgaCA9IH5+aDtcbiAgICBSICs9IFtDLCBYLCAwLCAwLCBYLCBDXVtoXTtcbiAgICBHICs9IFtYLCBDLCBDLCBYLCAwLCAwXVtoXTtcbiAgICBCICs9IFswLCAwLCBYLCBDLCBDLCBYXVtoXTtcbiAgICByZXR1cm4gcGFja2FnZVJHQihSLCBHLCBCLCBvKTtcbn07XG4vKlxcXG4gKiBTbmFwLmhzbDJyZ2JcbiBbIG1ldGhvZCBdXG4gKipcbiAqIENvbnZlcnRzIEhTTCB2YWx1ZXMgdG8gYW4gUkdCIG9iamVjdFxuIC0gaCAobnVtYmVyKSBodWVcbiAtIHMgKG51bWJlcikgc2F0dXJhdGlvblxuIC0gbCAobnVtYmVyKSBsdW1pbm9zaXR5XG4gPSAob2JqZWN0KSBSR0Igb2JqZWN0IGluIHRoZSBmb2xsb3dpbmcgZm9ybWF0OlxuIG8ge1xuIG8gICAgIHIgKG51bWJlcikgcmVkLFxuIG8gICAgIGcgKG51bWJlcikgZ3JlZW4sXG4gbyAgICAgYiAobnVtYmVyKSBibHVlLFxuIG8gICAgIGhleCAoc3RyaW5nKSBjb2xvciBpbiBIVE1ML0NTUyBmb3JtYXQ6ICPigKLigKLigKLigKLigKLigKJcbiBvIH1cblxcKi9cblNuYXAuaHNsMnJnYiA9IGZ1bmN0aW9uIChoLCBzLCBsLCBvKSB7XG4gICAgaWYgKGlzKGgsIFwib2JqZWN0XCIpICYmIFwiaFwiIGluIGggJiYgXCJzXCIgaW4gaCAmJiBcImxcIiBpbiBoKSB7XG4gICAgICAgIGwgPSBoLmw7XG4gICAgICAgIHMgPSBoLnM7XG4gICAgICAgIGggPSBoLmg7XG4gICAgfVxuICAgIGlmIChoID4gMSB8fCBzID4gMSB8fCBsID4gMSkge1xuICAgICAgICBoIC89IDM2MDtcbiAgICAgICAgcyAvPSAxMDA7XG4gICAgICAgIGwgLz0gMTAwO1xuICAgIH1cbiAgICBoICo9IDM2MDtcbiAgICB2YXIgUiwgRywgQiwgWCwgQztcbiAgICBoID0gKGggJSAzNjApIC8gNjA7XG4gICAgQyA9IDIgKiBzICogKGwgPCAuNSA/IGwgOiAxIC0gbCk7XG4gICAgWCA9IEMgKiAoMSAtIGFicyhoICUgMiAtIDEpKTtcbiAgICBSID0gRyA9IEIgPSBsIC0gQyAvIDI7XG5cbiAgICBoID0gfn5oO1xuICAgIFIgKz0gW0MsIFgsIDAsIDAsIFgsIENdW2hdO1xuICAgIEcgKz0gW1gsIEMsIEMsIFgsIDAsIDBdW2hdO1xuICAgIEIgKz0gWzAsIDAsIFgsIEMsIEMsIFhdW2hdO1xuICAgIHJldHVybiBwYWNrYWdlUkdCKFIsIEcsIEIsIG8pO1xufTtcbi8qXFxcbiAqIFNuYXAucmdiMmhzYlxuIFsgbWV0aG9kIF1cbiAqKlxuICogQ29udmVydHMgUkdCIHZhbHVlcyB0byBhbiBIU0Igb2JqZWN0XG4gLSByIChudW1iZXIpIHJlZFxuIC0gZyAobnVtYmVyKSBncmVlblxuIC0gYiAobnVtYmVyKSBibHVlXG4gPSAob2JqZWN0KSBIU0Igb2JqZWN0IGluIHRoZSBmb2xsb3dpbmcgZm9ybWF0OlxuIG8ge1xuIG8gICAgIGggKG51bWJlcikgaHVlLFxuIG8gICAgIHMgKG51bWJlcikgc2F0dXJhdGlvbixcbiBvICAgICBiIChudW1iZXIpIGJyaWdodG5lc3NcbiBvIH1cblxcKi9cblNuYXAucmdiMmhzYiA9IGZ1bmN0aW9uIChyLCBnLCBiKSB7XG4gICAgYiA9IHByZXBhcmVSR0IociwgZywgYik7XG4gICAgciA9IGJbMF07XG4gICAgZyA9IGJbMV07XG4gICAgYiA9IGJbMl07XG5cbiAgICB2YXIgSCwgUywgViwgQztcbiAgICBWID0gbW1heChyLCBnLCBiKTtcbiAgICBDID0gViAtIG1taW4ociwgZywgYik7XG4gICAgSCA9IChDID09IDAgPyBudWxsIDpcbiAgICAgICAgIFYgPT0gciA/IChnIC0gYikgLyBDIDpcbiAgICAgICAgIFYgPT0gZyA/IChiIC0gcikgLyBDICsgMiA6XG4gICAgICAgICAgICAgICAgICAociAtIGcpIC8gQyArIDRcbiAgICAgICAgKTtcbiAgICBIID0gKChIICsgMzYwKSAlIDYpICogNjAgLyAzNjA7XG4gICAgUyA9IEMgPT0gMCA/IDAgOiBDIC8gVjtcbiAgICByZXR1cm4ge2g6IEgsIHM6IFMsIGI6IFYsIHRvU3RyaW5nOiBoc2J0b1N0cmluZ307XG59O1xuLypcXFxuICogU25hcC5yZ2IyaHNsXG4gWyBtZXRob2QgXVxuICoqXG4gKiBDb252ZXJ0cyBSR0IgdmFsdWVzIHRvIGFuIEhTTCBvYmplY3RcbiAtIHIgKG51bWJlcikgcmVkXG4gLSBnIChudW1iZXIpIGdyZWVuXG4gLSBiIChudW1iZXIpIGJsdWVcbiA9IChvYmplY3QpIEhTTCBvYmplY3QgaW4gdGhlIGZvbGxvd2luZyBmb3JtYXQ6XG4gbyB7XG4gbyAgICAgaCAobnVtYmVyKSBodWUsXG4gbyAgICAgcyAobnVtYmVyKSBzYXR1cmF0aW9uLFxuIG8gICAgIGwgKG51bWJlcikgbHVtaW5vc2l0eVxuIG8gfVxuXFwqL1xuU25hcC5yZ2IyaHNsID0gZnVuY3Rpb24gKHIsIGcsIGIpIHtcbiAgICBiID0gcHJlcGFyZVJHQihyLCBnLCBiKTtcbiAgICByID0gYlswXTtcbiAgICBnID0gYlsxXTtcbiAgICBiID0gYlsyXTtcblxuICAgIHZhciBILCBTLCBMLCBNLCBtLCBDO1xuICAgIE0gPSBtbWF4KHIsIGcsIGIpO1xuICAgIG0gPSBtbWluKHIsIGcsIGIpO1xuICAgIEMgPSBNIC0gbTtcbiAgICBIID0gKEMgPT0gMCA/IG51bGwgOlxuICAgICAgICAgTSA9PSByID8gKGcgLSBiKSAvIEMgOlxuICAgICAgICAgTSA9PSBnID8gKGIgLSByKSAvIEMgKyAyIDpcbiAgICAgICAgICAgICAgICAgIChyIC0gZykgLyBDICsgNCk7XG4gICAgSCA9ICgoSCArIDM2MCkgJSA2KSAqIDYwIC8gMzYwO1xuICAgIEwgPSAoTSArIG0pIC8gMjtcbiAgICBTID0gKEMgPT0gMCA/IDAgOlxuICAgICAgICAgTCA8IC41ID8gQyAvICgyICogTCkgOlxuICAgICAgICAgICAgICAgICAgQyAvICgyIC0gMiAqIEwpKTtcbiAgICByZXR1cm4ge2g6IEgsIHM6IFMsIGw6IEwsIHRvU3RyaW5nOiBoc2x0b1N0cmluZ307XG59O1xuXG4vLyBUcmFuc2Zvcm1hdGlvbnNcbi8qXFxcbiAqIFNuYXAucGFyc2VQYXRoU3RyaW5nXG4gWyBtZXRob2QgXVxuICoqXG4gKiBVdGlsaXR5IG1ldGhvZFxuICoqXG4gKiBQYXJzZXMgZ2l2ZW4gcGF0aCBzdHJpbmcgaW50byBhbiBhcnJheSBvZiBhcnJheXMgb2YgcGF0aCBzZWdtZW50c1xuIC0gcGF0aFN0cmluZyAoc3RyaW5nfGFycmF5KSBwYXRoIHN0cmluZyBvciBhcnJheSBvZiBzZWdtZW50cyAoaW4gdGhlIGxhc3QgY2FzZSBpdCBpcyByZXR1cm5lZCBzdHJhaWdodCBhd2F5KVxuID0gKGFycmF5KSBhcnJheSBvZiBzZWdtZW50c1xuXFwqL1xuU25hcC5wYXJzZVBhdGhTdHJpbmcgPSBmdW5jdGlvbiAocGF0aFN0cmluZykge1xuICAgIGlmICghcGF0aFN0cmluZykge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgdmFyIHB0aCA9IFNuYXAucGF0aChwYXRoU3RyaW5nKTtcbiAgICBpZiAocHRoLmFycikge1xuICAgICAgICByZXR1cm4gU25hcC5wYXRoLmNsb25lKHB0aC5hcnIpO1xuICAgIH1cbiAgICBcbiAgICB2YXIgcGFyYW1Db3VudHMgPSB7YTogNywgYzogNiwgbzogMiwgaDogMSwgbDogMiwgbTogMiwgcjogNCwgcTogNCwgczogNCwgdDogMiwgdjogMSwgdTogMywgejogMH0sXG4gICAgICAgIGRhdGEgPSBbXTtcbiAgICBpZiAoaXMocGF0aFN0cmluZywgXCJhcnJheVwiKSAmJiBpcyhwYXRoU3RyaW5nWzBdLCBcImFycmF5XCIpKSB7IC8vIHJvdWdoIGFzc3VtcHRpb25cbiAgICAgICAgZGF0YSA9IFNuYXAucGF0aC5jbG9uZShwYXRoU3RyaW5nKTtcbiAgICB9XG4gICAgaWYgKCFkYXRhLmxlbmd0aCkge1xuICAgICAgICBTdHIocGF0aFN0cmluZykucmVwbGFjZShwYXRoQ29tbWFuZCwgZnVuY3Rpb24gKGEsIGIsIGMpIHtcbiAgICAgICAgICAgIHZhciBwYXJhbXMgPSBbXSxcbiAgICAgICAgICAgICAgICBuYW1lID0gYi50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgYy5yZXBsYWNlKHBhdGhWYWx1ZXMsIGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICAgICAgYiAmJiBwYXJhbXMucHVzaCgrYik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChuYW1lID09IFwibVwiICYmIHBhcmFtcy5sZW5ndGggPiAyKSB7XG4gICAgICAgICAgICAgICAgZGF0YS5wdXNoKFtiXS5jb25jYXQocGFyYW1zLnNwbGljZSgwLCAyKSkpO1xuICAgICAgICAgICAgICAgIG5hbWUgPSBcImxcIjtcbiAgICAgICAgICAgICAgICBiID0gYiA9PSBcIm1cIiA/IFwibFwiIDogXCJMXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobmFtZSA9PSBcIm9cIiAmJiBwYXJhbXMubGVuZ3RoID09IDEpIHtcbiAgICAgICAgICAgICAgICBkYXRhLnB1c2goW2IsIHBhcmFtc1swXV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG5hbWUgPT0gXCJyXCIpIHtcbiAgICAgICAgICAgICAgICBkYXRhLnB1c2goW2JdLmNvbmNhdChwYXJhbXMpKTtcbiAgICAgICAgICAgIH0gZWxzZSB3aGlsZSAocGFyYW1zLmxlbmd0aCA+PSBwYXJhbUNvdW50c1tuYW1lXSkge1xuICAgICAgICAgICAgICAgIGRhdGEucHVzaChbYl0uY29uY2F0KHBhcmFtcy5zcGxpY2UoMCwgcGFyYW1Db3VudHNbbmFtZV0pKSk7XG4gICAgICAgICAgICAgICAgaWYgKCFwYXJhbUNvdW50c1tuYW1lXSkge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBkYXRhLnRvU3RyaW5nID0gU25hcC5wYXRoLnRvU3RyaW5nO1xuICAgIHB0aC5hcnIgPSBTbmFwLnBhdGguY2xvbmUoZGF0YSk7XG4gICAgcmV0dXJuIGRhdGE7XG59O1xuLypcXFxuICogU25hcC5wYXJzZVRyYW5zZm9ybVN0cmluZ1xuIFsgbWV0aG9kIF1cbiAqKlxuICogVXRpbGl0eSBtZXRob2RcbiAqKlxuICogUGFyc2VzIGdpdmVuIHRyYW5zZm9ybSBzdHJpbmcgaW50byBhbiBhcnJheSBvZiB0cmFuc2Zvcm1hdGlvbnNcbiAtIFRTdHJpbmcgKHN0cmluZ3xhcnJheSkgdHJhbnNmb3JtIHN0cmluZyBvciBhcnJheSBvZiB0cmFuc2Zvcm1hdGlvbnMgKGluIHRoZSBsYXN0IGNhc2UgaXQgaXMgcmV0dXJuZWQgc3RyYWlnaHQgYXdheSlcbiA9IChhcnJheSkgYXJyYXkgb2YgdHJhbnNmb3JtYXRpb25zXG5cXCovXG52YXIgcGFyc2VUcmFuc2Zvcm1TdHJpbmcgPSBTbmFwLnBhcnNlVHJhbnNmb3JtU3RyaW5nID0gZnVuY3Rpb24gKFRTdHJpbmcpIHtcbiAgICBpZiAoIVRTdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHZhciBwYXJhbUNvdW50cyA9IHtyOiAzLCBzOiA0LCB0OiAyLCBtOiA2fSxcbiAgICAgICAgZGF0YSA9IFtdO1xuICAgIGlmIChpcyhUU3RyaW5nLCBcImFycmF5XCIpICYmIGlzKFRTdHJpbmdbMF0sIFwiYXJyYXlcIikpIHsgLy8gcm91Z2ggYXNzdW1wdGlvblxuICAgICAgICBkYXRhID0gU25hcC5wYXRoLmNsb25lKFRTdHJpbmcpO1xuICAgIH1cbiAgICBpZiAoIWRhdGEubGVuZ3RoKSB7XG4gICAgICAgIFN0cihUU3RyaW5nKS5yZXBsYWNlKHRDb21tYW5kLCBmdW5jdGlvbiAoYSwgYiwgYykge1xuICAgICAgICAgICAgdmFyIHBhcmFtcyA9IFtdLFxuICAgICAgICAgICAgICAgIG5hbWUgPSBiLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICBjLnJlcGxhY2UocGF0aFZhbHVlcywgZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgICAgICBiICYmIHBhcmFtcy5wdXNoKCtiKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZGF0YS5wdXNoKFtiXS5jb25jYXQocGFyYW1zKSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBkYXRhLnRvU3RyaW5nID0gU25hcC5wYXRoLnRvU3RyaW5nO1xuICAgIHJldHVybiBkYXRhO1xufTtcbmZ1bmN0aW9uIHN2Z1RyYW5zZm9ybTJzdHJpbmcodHN0cikge1xuICAgIHZhciByZXMgPSBbXTtcbiAgICB0c3RyID0gdHN0ci5yZXBsYWNlKC8oPzpefFxccykoXFx3KylcXCgoW14pXSspXFwpL2csIGZ1bmN0aW9uIChhbGwsIG5hbWUsIHBhcmFtcykge1xuICAgICAgICBwYXJhbXMgPSBwYXJhbXMuc3BsaXQoL1xccyosXFxzKnxcXHMrLyk7XG4gICAgICAgIGlmIChuYW1lID09IFwicm90YXRlXCIgJiYgcGFyYW1zLmxlbmd0aCA9PSAxKSB7XG4gICAgICAgICAgICBwYXJhbXMucHVzaCgwLCAwKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmFtZSA9PSBcInNjYWxlXCIpIHtcbiAgICAgICAgICAgIGlmIChwYXJhbXMubGVuZ3RoID4gMikge1xuICAgICAgICAgICAgICAgIHBhcmFtcyA9IHBhcmFtcy5zbGljZSgwLCAyKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocGFyYW1zLmxlbmd0aCA9PSAyKSB7XG4gICAgICAgICAgICAgICAgcGFyYW1zLnB1c2goMCwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocGFyYW1zLmxlbmd0aCA9PSAxKSB7XG4gICAgICAgICAgICAgICAgcGFyYW1zLnB1c2gocGFyYW1zWzBdLCAwLCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobmFtZSA9PSBcInNrZXdYXCIpIHtcbiAgICAgICAgICAgIHJlcy5wdXNoKFtcIm1cIiwgMSwgMCwgbWF0aC50YW4ocmFkKHBhcmFtc1swXSkpLCAxLCAwLCAwXSk7XG4gICAgICAgIH0gZWxzZSBpZiAobmFtZSA9PSBcInNrZXdZXCIpIHtcbiAgICAgICAgICAgIHJlcy5wdXNoKFtcIm1cIiwgMSwgbWF0aC50YW4ocmFkKHBhcmFtc1swXSkpLCAwLCAxLCAwLCAwXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXMucHVzaChbbmFtZS5jaGFyQXQoMCldLmNvbmNhdChwYXJhbXMpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWxsO1xuICAgIH0pO1xuICAgIHJldHVybiByZXM7XG59XG5TbmFwLl8uc3ZnVHJhbnNmb3JtMnN0cmluZyA9IHN2Z1RyYW5zZm9ybTJzdHJpbmc7XG5TbmFwLl8ucmdUcmFuc2Zvcm0gPSAvXlthLXpdW1xcc10qLT9cXC4/XFxkL2k7XG5mdW5jdGlvbiB0cmFuc2Zvcm0ybWF0cml4KHRzdHIsIGJib3gpIHtcbiAgICB2YXIgdGRhdGEgPSBwYXJzZVRyYW5zZm9ybVN0cmluZyh0c3RyKSxcbiAgICAgICAgbSA9IG5ldyBTbmFwLk1hdHJpeDtcbiAgICBpZiAodGRhdGEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gdGRhdGEubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgdmFyIHQgPSB0ZGF0YVtpXSxcbiAgICAgICAgICAgICAgICB0bGVuID0gdC5sZW5ndGgsXG4gICAgICAgICAgICAgICAgY29tbWFuZCA9IFN0cih0WzBdKS50b0xvd2VyQ2FzZSgpLFxuICAgICAgICAgICAgICAgIGFic29sdXRlID0gdFswXSAhPSBjb21tYW5kLFxuICAgICAgICAgICAgICAgIGludmVyID0gYWJzb2x1dGUgPyBtLmludmVydCgpIDogMCxcbiAgICAgICAgICAgICAgICB4MSxcbiAgICAgICAgICAgICAgICB5MSxcbiAgICAgICAgICAgICAgICB4MixcbiAgICAgICAgICAgICAgICB5MixcbiAgICAgICAgICAgICAgICBiYjtcbiAgICAgICAgICAgIGlmIChjb21tYW5kID09IFwidFwiICYmIHRsZW4gPT0gMil7XG4gICAgICAgICAgICAgICAgbS50cmFuc2xhdGUodFsxXSwgMCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNvbW1hbmQgPT0gXCJ0XCIgJiYgdGxlbiA9PSAzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFic29sdXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIHgxID0gaW52ZXIueCgwLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgeTEgPSBpbnZlci55KDAsIDApO1xuICAgICAgICAgICAgICAgICAgICB4MiA9IGludmVyLngodFsxXSwgdFsyXSk7XG4gICAgICAgICAgICAgICAgICAgIHkyID0gaW52ZXIueSh0WzFdLCB0WzJdKTtcbiAgICAgICAgICAgICAgICAgICAgbS50cmFuc2xhdGUoeDIgLSB4MSwgeTIgLSB5MSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbS50cmFuc2xhdGUodFsxXSwgdFsyXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChjb21tYW5kID09IFwiclwiKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRsZW4gPT0gMikge1xuICAgICAgICAgICAgICAgICAgICBiYiA9IGJiIHx8IGJib3g7XG4gICAgICAgICAgICAgICAgICAgIG0ucm90YXRlKHRbMV0sIGJiLnggKyBiYi53aWR0aCAvIDIsIGJiLnkgKyBiYi5oZWlnaHQgLyAyKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRsZW4gPT0gNCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYWJzb2x1dGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHgyID0gaW52ZXIueCh0WzJdLCB0WzNdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHkyID0gaW52ZXIueSh0WzJdLCB0WzNdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG0ucm90YXRlKHRbMV0sIHgyLCB5Mik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtLnJvdGF0ZSh0WzFdLCB0WzJdLCB0WzNdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY29tbWFuZCA9PSBcInNcIikge1xuICAgICAgICAgICAgICAgIGlmICh0bGVuID09IDIgfHwgdGxlbiA9PSAzKSB7XG4gICAgICAgICAgICAgICAgICAgIGJiID0gYmIgfHwgYmJveDtcbiAgICAgICAgICAgICAgICAgICAgbS5zY2FsZSh0WzFdLCB0W3RsZW4gLSAxXSwgYmIueCArIGJiLndpZHRoIC8gMiwgYmIueSArIGJiLmhlaWdodCAvIDIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGxlbiA9PSA0KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhYnNvbHV0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgeDIgPSBpbnZlci54KHRbMl0sIHRbM10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgeTIgPSBpbnZlci55KHRbMl0sIHRbM10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgbS5zY2FsZSh0WzFdLCB0WzFdLCB4MiwgeTIpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgbS5zY2FsZSh0WzFdLCB0WzFdLCB0WzJdLCB0WzNdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGxlbiA9PSA1KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhYnNvbHV0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgeDIgPSBpbnZlci54KHRbM10sIHRbNF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgeTIgPSBpbnZlci55KHRbM10sIHRbNF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgbS5zY2FsZSh0WzFdLCB0WzJdLCB4MiwgeTIpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgbS5zY2FsZSh0WzFdLCB0WzJdLCB0WzNdLCB0WzRdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY29tbWFuZCA9PSBcIm1cIiAmJiB0bGVuID09IDcpIHtcbiAgICAgICAgICAgICAgICBtLmFkZCh0WzFdLCB0WzJdLCB0WzNdLCB0WzRdLCB0WzVdLCB0WzZdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbTtcbn1cblNuYXAuXy50cmFuc2Zvcm0ybWF0cml4ID0gdHJhbnNmb3JtMm1hdHJpeDtcblNuYXAuX3VuaXQycHggPSB1bml0MnB4O1xudmFyIGNvbnRhaW5zID0gZ2xvYi5kb2MuY29udGFpbnMgfHwgZ2xvYi5kb2MuY29tcGFyZURvY3VtZW50UG9zaXRpb24gP1xuICAgIGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgIHZhciBhZG93biA9IGEubm9kZVR5cGUgPT0gOSA/IGEuZG9jdW1lbnRFbGVtZW50IDogYSxcbiAgICAgICAgICAgIGJ1cCA9IGIgJiYgYi5wYXJlbnROb2RlO1xuICAgICAgICAgICAgcmV0dXJuIGEgPT0gYnVwIHx8ICEhKGJ1cCAmJiBidXAubm9kZVR5cGUgPT0gMSAmJiAoXG4gICAgICAgICAgICAgICAgYWRvd24uY29udGFpbnMgP1xuICAgICAgICAgICAgICAgICAgICBhZG93bi5jb250YWlucyhidXApIDpcbiAgICAgICAgICAgICAgICAgICAgYS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbiAmJiBhLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uKGJ1cCkgJiAxNlxuICAgICAgICAgICAgKSk7XG4gICAgfSA6XG4gICAgZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgaWYgKGIpIHtcbiAgICAgICAgICAgIHdoaWxlIChiKSB7XG4gICAgICAgICAgICAgICAgYiA9IGIucGFyZW50Tm9kZTtcbiAgICAgICAgICAgICAgICBpZiAoYiA9PSBhKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcbmZ1bmN0aW9uIGdldFNvbWVEZWZzKGVsKSB7XG4gICAgdmFyIHAgPSAoZWwubm9kZS5vd25lclNWR0VsZW1lbnQgJiYgd3JhcChlbC5ub2RlLm93bmVyU1ZHRWxlbWVudCkpIHx8XG4gICAgICAgICAgICAoZWwubm9kZS5wYXJlbnROb2RlICYmIHdyYXAoZWwubm9kZS5wYXJlbnROb2RlKSkgfHxcbiAgICAgICAgICAgIFNuYXAuc2VsZWN0KFwic3ZnXCIpIHx8XG4gICAgICAgICAgICBTbmFwKDAsIDApLFxuICAgICAgICBwZGVmcyA9IHAuc2VsZWN0KFwiZGVmc1wiKSxcbiAgICAgICAgZGVmcyAgPSBwZGVmcyA9PSBudWxsID8gZmFsc2UgOiBwZGVmcy5ub2RlO1xuICAgIGlmICghZGVmcykge1xuICAgICAgICBkZWZzID0gbWFrZShcImRlZnNcIiwgcC5ub2RlKS5ub2RlO1xuICAgIH1cbiAgICByZXR1cm4gZGVmcztcbn1cbmZ1bmN0aW9uIGdldFNvbWVTVkcoZWwpIHtcbiAgICByZXR1cm4gZWwubm9kZS5vd25lclNWR0VsZW1lbnQgJiYgd3JhcChlbC5ub2RlLm93bmVyU1ZHRWxlbWVudCkgfHwgU25hcC5zZWxlY3QoXCJzdmdcIik7XG59XG5TbmFwLl8uZ2V0U29tZURlZnMgPSBnZXRTb21lRGVmcztcblNuYXAuXy5nZXRTb21lU1ZHID0gZ2V0U29tZVNWRztcbmZ1bmN0aW9uIHVuaXQycHgoZWwsIG5hbWUsIHZhbHVlKSB7XG4gICAgdmFyIHN2ZyA9IGdldFNvbWVTVkcoZWwpLm5vZGUsXG4gICAgICAgIG91dCA9IHt9LFxuICAgICAgICBtZ3IgPSBzdmcucXVlcnlTZWxlY3RvcihcIi5zdmctLS1tZ3JcIik7XG4gICAgaWYgKCFtZ3IpIHtcbiAgICAgICAgbWdyID0gJChcInJlY3RcIik7XG4gICAgICAgICQobWdyLCB7eDogLTllOSwgeTogLTllOSwgd2lkdGg6IDEwLCBoZWlnaHQ6IDEwLCBcImNsYXNzXCI6IFwic3ZnLS0tbWdyXCIsIGZpbGw6IFwibm9uZVwifSk7XG4gICAgICAgIHN2Zy5hcHBlbmRDaGlsZChtZ3IpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBnZXRXKHZhbCkge1xuICAgICAgICBpZiAodmFsID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBFO1xuICAgICAgICB9XG4gICAgICAgIGlmICh2YWwgPT0gK3ZhbCkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbDtcbiAgICAgICAgfVxuICAgICAgICAkKG1nciwge3dpZHRoOiB2YWx9KTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiBtZ3IuZ2V0QkJveCgpLndpZHRoO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBnZXRIKHZhbCkge1xuICAgICAgICBpZiAodmFsID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBFO1xuICAgICAgICB9XG4gICAgICAgIGlmICh2YWwgPT0gK3ZhbCkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbDtcbiAgICAgICAgfVxuICAgICAgICAkKG1nciwge2hlaWdodDogdmFsfSk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gbWdyLmdldEJCb3goKS5oZWlnaHQ7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHNldChuYW0sIGYpIHtcbiAgICAgICAgaWYgKG5hbWUgPT0gbnVsbCkge1xuICAgICAgICAgICAgb3V0W25hbV0gPSBmKGVsLmF0dHIobmFtKSB8fCAwKTtcbiAgICAgICAgfSBlbHNlIGlmIChuYW0gPT0gbmFtZSkge1xuICAgICAgICAgICAgb3V0ID0gZih2YWx1ZSA9PSBudWxsID8gZWwuYXR0cihuYW0pIHx8IDAgOiB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc3dpdGNoIChlbC50eXBlKSB7XG4gICAgICAgIGNhc2UgXCJyZWN0XCI6XG4gICAgICAgICAgICBzZXQoXCJyeFwiLCBnZXRXKTtcbiAgICAgICAgICAgIHNldChcInJ5XCIsIGdldEgpO1xuICAgICAgICBjYXNlIFwiaW1hZ2VcIjpcbiAgICAgICAgICAgIHNldChcIndpZHRoXCIsIGdldFcpO1xuICAgICAgICAgICAgc2V0KFwiaGVpZ2h0XCIsIGdldEgpO1xuICAgICAgICBjYXNlIFwidGV4dFwiOlxuICAgICAgICAgICAgc2V0KFwieFwiLCBnZXRXKTtcbiAgICAgICAgICAgIHNldChcInlcIiwgZ2V0SCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiY2lyY2xlXCI6XG4gICAgICAgICAgICBzZXQoXCJjeFwiLCBnZXRXKTtcbiAgICAgICAgICAgIHNldChcImN5XCIsIGdldEgpO1xuICAgICAgICAgICAgc2V0KFwiclwiLCBnZXRXKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJlbGxpcHNlXCI6XG4gICAgICAgICAgICBzZXQoXCJjeFwiLCBnZXRXKTtcbiAgICAgICAgICAgIHNldChcImN5XCIsIGdldEgpO1xuICAgICAgICAgICAgc2V0KFwicnhcIiwgZ2V0Vyk7XG4gICAgICAgICAgICBzZXQoXCJyeVwiLCBnZXRIKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJsaW5lXCI6XG4gICAgICAgICAgICBzZXQoXCJ4MVwiLCBnZXRXKTtcbiAgICAgICAgICAgIHNldChcIngyXCIsIGdldFcpO1xuICAgICAgICAgICAgc2V0KFwieTFcIiwgZ2V0SCk7XG4gICAgICAgICAgICBzZXQoXCJ5MlwiLCBnZXRIKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJtYXJrZXJcIjpcbiAgICAgICAgICAgIHNldChcInJlZlhcIiwgZ2V0Vyk7XG4gICAgICAgICAgICBzZXQoXCJtYXJrZXJXaWR0aFwiLCBnZXRXKTtcbiAgICAgICAgICAgIHNldChcInJlZllcIiwgZ2V0SCk7XG4gICAgICAgICAgICBzZXQoXCJtYXJrZXJIZWlnaHRcIiwgZ2V0SCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwicmFkaWFsR3JhZGllbnRcIjpcbiAgICAgICAgICAgIHNldChcImZ4XCIsIGdldFcpO1xuICAgICAgICAgICAgc2V0KFwiZnlcIiwgZ2V0SCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwidHNwYW5cIjpcbiAgICAgICAgICAgIHNldChcImR4XCIsIGdldFcpO1xuICAgICAgICAgICAgc2V0KFwiZHlcIiwgZ2V0SCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgc2V0KG5hbWUsIGdldFcpO1xuICAgIH1cbiAgICBzdmcucmVtb3ZlQ2hpbGQobWdyKTtcbiAgICByZXR1cm4gb3V0O1xufVxuLypcXFxuICogU25hcC5zZWxlY3RcbiBbIG1ldGhvZCBdXG4gKipcbiAqIFdyYXBzIGEgRE9NIGVsZW1lbnQgc3BlY2lmaWVkIGJ5IENTUyBzZWxlY3RvciBhcyBARWxlbWVudFxuIC0gcXVlcnkgKHN0cmluZykgQ1NTIHNlbGVjdG9yIG9mIHRoZSBlbGVtZW50XG4gPSAoRWxlbWVudCkgdGhlIGN1cnJlbnQgZWxlbWVudFxuXFwqL1xuU25hcC5zZWxlY3QgPSBmdW5jdGlvbiAocXVlcnkpIHtcbiAgICBxdWVyeSA9IFN0cihxdWVyeSkucmVwbGFjZSgvKFteXFxcXF0pOi9nLCBcIiQxXFxcXDpcIik7XG4gICAgcmV0dXJuIHdyYXAoZ2xvYi5kb2MucXVlcnlTZWxlY3RvcihxdWVyeSkpO1xufTtcbi8qXFxcbiAqIFNuYXAuc2VsZWN0QWxsXG4gWyBtZXRob2QgXVxuICoqXG4gKiBXcmFwcyBET00gZWxlbWVudHMgc3BlY2lmaWVkIGJ5IENTUyBzZWxlY3RvciBhcyBzZXQgb3IgYXJyYXkgb2YgQEVsZW1lbnRcbiAtIHF1ZXJ5IChzdHJpbmcpIENTUyBzZWxlY3RvciBvZiB0aGUgZWxlbWVudFxuID0gKEVsZW1lbnQpIHRoZSBjdXJyZW50IGVsZW1lbnRcblxcKi9cblNuYXAuc2VsZWN0QWxsID0gZnVuY3Rpb24gKHF1ZXJ5KSB7XG4gICAgdmFyIG5vZGVsaXN0ID0gZ2xvYi5kb2MucXVlcnlTZWxlY3RvckFsbChxdWVyeSksXG4gICAgICAgIHNldCA9IChTbmFwLnNldCB8fCBBcnJheSkoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGVsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHNldC5wdXNoKHdyYXAobm9kZWxpc3RbaV0pKTtcbiAgICB9XG4gICAgcmV0dXJuIHNldDtcbn07XG5cbmZ1bmN0aW9uIGFkZDJncm91cChsaXN0KSB7XG4gICAgaWYgKCFpcyhsaXN0LCBcImFycmF5XCIpKSB7XG4gICAgICAgIGxpc3QgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xuICAgIH1cbiAgICB2YXIgaSA9IDAsXG4gICAgICAgIGogPSAwLFxuICAgICAgICBub2RlID0gdGhpcy5ub2RlO1xuICAgIHdoaWxlICh0aGlzW2ldKSBkZWxldGUgdGhpc1tpKytdO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChsaXN0W2ldLnR5cGUgPT0gXCJzZXRcIikge1xuICAgICAgICAgICAgbGlzdFtpXS5mb3JFYWNoKGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgICAgIG5vZGUuYXBwZW5kQ2hpbGQoZWwubm9kZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5vZGUuYXBwZW5kQ2hpbGQobGlzdFtpXS5ub2RlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB2YXIgY2hpbGRyZW4gPSBub2RlLmNoaWxkTm9kZXM7XG4gICAgZm9yIChpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRoaXNbaisrXSA9IHdyYXAoY2hpbGRyZW5baV0pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn1cbi8vIEh1YiBnYXJiYWdlIGNvbGxlY3RvciBldmVyeSAxMHNcbnNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gaHViKSBpZiAoaHViW2hhc10oa2V5KSkge1xuICAgICAgICB2YXIgZWwgPSBodWJba2V5XSxcbiAgICAgICAgICAgIG5vZGUgPSBlbC5ub2RlO1xuICAgICAgICBpZiAoZWwudHlwZSAhPSBcInN2Z1wiICYmICFub2RlLm93bmVyU1ZHRWxlbWVudCB8fCBlbC50eXBlID09IFwic3ZnXCIgJiYgKCFub2RlLnBhcmVudE5vZGUgfHwgXCJvd25lclNWR0VsZW1lbnRcIiBpbiBub2RlLnBhcmVudE5vZGUgJiYgIW5vZGUub3duZXJTVkdFbGVtZW50KSkge1xuICAgICAgICAgICAgZGVsZXRlIGh1YltrZXldO1xuICAgICAgICB9XG4gICAgfVxufSwgMWU0KTtcbmZ1bmN0aW9uIEVsZW1lbnQoZWwpIHtcbiAgICBpZiAoZWwuc25hcCBpbiBodWIpIHtcbiAgICAgICAgcmV0dXJuIGh1YltlbC5zbmFwXTtcbiAgICB9XG4gICAgdmFyIHN2ZztcbiAgICB0cnkge1xuICAgICAgICBzdmcgPSBlbC5vd25lclNWR0VsZW1lbnQ7XG4gICAgfSBjYXRjaChlKSB7fVxuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50Lm5vZGVcbiAgICAgWyBwcm9wZXJ0eSAob2JqZWN0KSBdXG4gICAgICoqXG4gICAgICogR2l2ZXMgeW91IGEgcmVmZXJlbmNlIHRvIHRoZSBET00gb2JqZWN0LCBzbyB5b3UgY2FuIGFzc2lnbiBldmVudCBoYW5kbGVycyBvciBqdXN0IG1lc3MgYXJvdW5kLlxuICAgICA+IFVzYWdlXG4gICAgIHwgLy8gZHJhdyBhIGNpcmNsZSBhdCBjb29yZGluYXRlIDEwLDEwIHdpdGggcmFkaXVzIG9mIDEwXG4gICAgIHwgdmFyIGMgPSBwYXBlci5jaXJjbGUoMTAsIDEwLCAxMCk7XG4gICAgIHwgYy5ub2RlLm9uY2xpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgIHwgICAgIGMuYXR0cihcImZpbGxcIiwgXCJyZWRcIik7XG4gICAgIHwgfTtcbiAgICBcXCovXG4gICAgdGhpcy5ub2RlID0gZWw7XG4gICAgaWYgKHN2Zykge1xuICAgICAgICB0aGlzLnBhcGVyID0gbmV3IFBhcGVyKHN2Zyk7XG4gICAgfVxuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnR5cGVcbiAgICAgWyBwcm9wZXJ0eSAoc3RyaW5nKSBdXG4gICAgICoqXG4gICAgICogU1ZHIHRhZyBuYW1lIG9mIHRoZSBnaXZlbiBlbGVtZW50LlxuICAgIFxcKi9cbiAgICB0aGlzLnR5cGUgPSBlbC50YWdOYW1lIHx8IGVsLm5vZGVOYW1lO1xuICAgIHZhciBpZCA9IHRoaXMuaWQgPSBJRCh0aGlzKTtcbiAgICB0aGlzLmFuaW1zID0ge307XG4gICAgdGhpcy5fID0ge1xuICAgICAgICB0cmFuc2Zvcm06IFtdXG4gICAgfTtcbiAgICBlbC5zbmFwID0gaWQ7XG4gICAgaHViW2lkXSA9IHRoaXM7XG4gICAgaWYgKHRoaXMudHlwZSA9PSBcImdcIikge1xuICAgICAgICB0aGlzLmFkZCA9IGFkZDJncm91cDtcbiAgICB9XG4gICAgaWYgKHRoaXMudHlwZSBpbiB7ZzogMSwgbWFzazogMSwgcGF0dGVybjogMSwgc3ltYm9sOiAxfSkge1xuICAgICAgICBmb3IgKHZhciBtZXRob2QgaW4gUGFwZXIucHJvdG90eXBlKSBpZiAoUGFwZXIucHJvdG90eXBlW2hhc10obWV0aG9kKSkge1xuICAgICAgICAgICAgdGhpc1ttZXRob2RdID0gUGFwZXIucHJvdG90eXBlW21ldGhvZF07XG4gICAgICAgIH1cbiAgICB9XG59XG4gICAvKlxcXG4gICAgICogRWxlbWVudC5hdHRyXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBHZXRzIG9yIHNldHMgZ2l2ZW4gYXR0cmlidXRlcyBvZiB0aGUgZWxlbWVudC5cbiAgICAgKipcbiAgICAgLSBwYXJhbXMgKG9iamVjdCkgY29udGFpbnMga2V5LXZhbHVlIHBhaXJzIG9mIGF0dHJpYnV0ZXMgeW91IHdhbnQgdG8gc2V0XG4gICAgICogb3JcbiAgICAgLSBwYXJhbSAoc3RyaW5nKSBuYW1lIG9mIHRoZSBhdHRyaWJ1dGVcbiAgICAgPSAoRWxlbWVudCkgdGhlIGN1cnJlbnQgZWxlbWVudFxuICAgICAqIG9yXG4gICAgID0gKHN0cmluZykgdmFsdWUgb2YgYXR0cmlidXRlXG4gICAgID4gVXNhZ2VcbiAgICAgfCBlbC5hdHRyKHtcbiAgICAgfCAgICAgZmlsbDogXCIjZmMwXCIsXG4gICAgIHwgICAgIHN0cm9rZTogXCIjMDAwXCIsXG4gICAgIHwgICAgIHN0cm9rZVdpZHRoOiAyLCAvLyBDYW1lbENhc2UuLi5cbiAgICAgfCAgICAgXCJmaWxsLW9wYWNpdHlcIjogMC41LCAvLyBvciBkYXNoLXNlcGFyYXRlZCBuYW1lc1xuICAgICB8ICAgICB3aWR0aDogXCIqPTJcIiAvLyBwcmVmaXhlZCB2YWx1ZXNcbiAgICAgfCB9KTtcbiAgICAgfCBjb25zb2xlLmxvZyhlbC5hdHRyKFwiZmlsbFwiKSk7IC8vICNmYzBcbiAgICAgKiBQcmVmaXhlZCB2YWx1ZXMgaW4gZm9ybWF0IGBcIis9MTBcImAgc3VwcG9ydGVkLiBBbGwgZm91ciBvcGVyYXRpb25zXG4gICAgICogKGArYCwgYC1gLCBgKmAgYW5kIGAvYCkgY291bGQgYmUgdXNlZC4gT3B0aW9uYWxseSB5b3UgY2FuIHVzZSB1bml0cyBmb3IgYCtgXG4gICAgICogYW5kIGAtYDogYFwiKz0yZW1cImAuXG4gICAgXFwqL1xuICAgIEVsZW1lbnQucHJvdG90eXBlLmF0dHIgPSBmdW5jdGlvbiAocGFyYW1zLCB2YWx1ZSkge1xuICAgICAgICB2YXIgZWwgPSB0aGlzLFxuICAgICAgICAgICAgbm9kZSA9IGVsLm5vZGU7XG4gICAgICAgIGlmICghcGFyYW1zKSB7XG4gICAgICAgICAgICBpZiAobm9kZS5ub2RlVHlwZSAhPSAxKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogbm9kZS5ub2RlVmFsdWVcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGF0dHIgPSBub2RlLmF0dHJpYnV0ZXMsXG4gICAgICAgICAgICAgICAgb3V0ID0ge307XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBhdHRyLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICBvdXRbYXR0cltpXS5ub2RlTmFtZV0gPSBhdHRyW2ldLm5vZGVWYWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBvdXQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzKHBhcmFtcywgXCJzdHJpbmdcIikpIHtcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgIHZhciBqc29uID0ge307XG4gICAgICAgICAgICAgICAganNvbltwYXJhbXNdID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgcGFyYW1zID0ganNvbjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGV2ZShcInNuYXAudXRpbC5nZXRhdHRyLlwiICsgcGFyYW1zLCBlbCkuZmlyc3REZWZpbmVkKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgYXR0IGluIHBhcmFtcykge1xuICAgICAgICAgICAgaWYgKHBhcmFtc1toYXNdKGF0dCkpIHtcbiAgICAgICAgICAgICAgICBldmUoXCJzbmFwLnV0aWwuYXR0ci5cIiArIGF0dCwgZWwsIHBhcmFtc1thdHRdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZWw7XG4gICAgfTtcbi8qXFxcbiAqIFNuYXAucGFyc2VcbiBbIG1ldGhvZCBdXG4gKipcbiAqIFBhcnNlcyBTVkcgZnJhZ21lbnQgYW5kIGNvbnZlcnRzIGl0IGludG8gYSBARnJhZ21lbnRcbiAqKlxuIC0gc3ZnIChzdHJpbmcpIFNWRyBzdHJpbmdcbiA9IChGcmFnbWVudCkgdGhlIEBGcmFnbWVudFxuXFwqL1xuU25hcC5wYXJzZSA9IGZ1bmN0aW9uIChzdmcpIHtcbiAgICB2YXIgZiA9IGdsb2IuZG9jLmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKSxcbiAgICAgICAgZnVsbCA9IHRydWUsXG4gICAgICAgIGRpdiA9IGdsb2IuZG9jLmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgc3ZnID0gU3RyKHN2Zyk7XG4gICAgaWYgKCFzdmcubWF0Y2goL15cXHMqPFxccypzdmcoPzpcXHN8PikvKSkge1xuICAgICAgICBzdmcgPSBcIjxzdmc+XCIgKyBzdmcgKyBcIjwvc3ZnPlwiO1xuICAgICAgICBmdWxsID0gZmFsc2U7XG4gICAgfVxuICAgIGRpdi5pbm5lckhUTUwgPSBzdmc7XG4gICAgc3ZnID0gZGl2LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwic3ZnXCIpWzBdO1xuICAgIGlmIChzdmcpIHtcbiAgICAgICAgaWYgKGZ1bGwpIHtcbiAgICAgICAgICAgIGYgPSBzdmc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB3aGlsZSAoc3ZnLmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgICAgICAgICBmLmFwcGVuZENoaWxkKHN2Zy5maXJzdENoaWxkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbmV3IEZyYWdtZW50KGYpO1xufTtcbmZ1bmN0aW9uIEZyYWdtZW50KGZyYWcpIHtcbiAgICB0aGlzLm5vZGUgPSBmcmFnO1xufVxuLypcXFxuICogU25hcC5mcmFnbWVudFxuIFsgbWV0aG9kIF1cbiAqKlxuICogQ3JlYXRlcyBhIERPTSBmcmFnbWVudCBmcm9tIGEgZ2l2ZW4gbGlzdCBvZiBlbGVtZW50cyBvciBzdHJpbmdzXG4gKipcbiAtIHZhcmFyZ3MgKOKApikgU1ZHIHN0cmluZ1xuID0gKEZyYWdtZW50KSB0aGUgQEZyYWdtZW50XG5cXCovXG5TbmFwLmZyYWdtZW50ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSxcbiAgICAgICAgZiA9IGdsb2IuZG9jLmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbiAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBhcmdzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgdmFyIGl0ZW0gPSBhcmdzW2ldO1xuICAgICAgICBpZiAoaXRlbS5ub2RlICYmIGl0ZW0ubm9kZS5ub2RlVHlwZSkge1xuICAgICAgICAgICAgZi5hcHBlbmRDaGlsZChpdGVtLm5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpdGVtLm5vZGVUeXBlKSB7XG4gICAgICAgICAgICBmLmFwcGVuZENoaWxkKGl0ZW0pO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgaXRlbSA9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBmLmFwcGVuZENoaWxkKFNuYXAucGFyc2UoaXRlbSkubm9kZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG5ldyBGcmFnbWVudChmKTtcbn07XG5cbmZ1bmN0aW9uIG1ha2UobmFtZSwgcGFyZW50KSB7XG4gICAgdmFyIHJlcyA9ICQobmFtZSk7XG4gICAgcGFyZW50LmFwcGVuZENoaWxkKHJlcyk7XG4gICAgdmFyIGVsID0gd3JhcChyZXMpO1xuICAgIHJldHVybiBlbDtcbn1cbmZ1bmN0aW9uIFBhcGVyKHcsIGgpIHtcbiAgICB2YXIgcmVzLFxuICAgICAgICBkZXNjLFxuICAgICAgICBkZWZzLFxuICAgICAgICBwcm90byA9IFBhcGVyLnByb3RvdHlwZTtcbiAgICBpZiAodyAmJiB3LnRhZ05hbWUgPT0gXCJzdmdcIikge1xuICAgICAgICBpZiAody5zbmFwIGluIGh1Yikge1xuICAgICAgICAgICAgcmV0dXJuIGh1Ylt3LnNuYXBdO1xuICAgICAgICB9XG4gICAgICAgIHZhciBkb2MgPSB3Lm93bmVyRG9jdW1lbnQ7XG4gICAgICAgIHJlcyA9IG5ldyBFbGVtZW50KHcpO1xuICAgICAgICBkZXNjID0gdy5nZXRFbGVtZW50c0J5VGFnTmFtZShcImRlc2NcIilbMF07XG4gICAgICAgIGRlZnMgPSB3LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiZGVmc1wiKVswXTtcbiAgICAgICAgaWYgKCFkZXNjKSB7XG4gICAgICAgICAgICBkZXNjID0gJChcImRlc2NcIik7XG4gICAgICAgICAgICBkZXNjLmFwcGVuZENoaWxkKGRvYy5jcmVhdGVUZXh0Tm9kZShcIkNyZWF0ZWQgd2l0aCBTbmFwXCIpKTtcbiAgICAgICAgICAgIHJlcy5ub2RlLmFwcGVuZENoaWxkKGRlc2MpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghZGVmcykge1xuICAgICAgICAgICAgZGVmcyA9ICQoXCJkZWZzXCIpO1xuICAgICAgICAgICAgcmVzLm5vZGUuYXBwZW5kQ2hpbGQoZGVmcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmVzLmRlZnMgPSBkZWZzO1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gcHJvdG8pIGlmIChwcm90b1toYXNdKGtleSkpIHtcbiAgICAgICAgICAgIHJlc1trZXldID0gcHJvdG9ba2V5XTtcbiAgICAgICAgfVxuICAgICAgICByZXMucGFwZXIgPSByZXMucm9vdCA9IHJlcztcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXMgPSBtYWtlKFwic3ZnXCIsIGdsb2IuZG9jLmJvZHkpO1xuICAgICAgICAkKHJlcy5ub2RlLCB7XG4gICAgICAgICAgICBoZWlnaHQ6IGgsXG4gICAgICAgICAgICB2ZXJzaW9uOiAxLjEsXG4gICAgICAgICAgICB3aWR0aDogdyxcbiAgICAgICAgICAgIHhtbG5zOiB4bWxuc1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbn1cbmZ1bmN0aW9uIHdyYXAoZG9tKSB7XG4gICAgaWYgKCFkb20pIHtcbiAgICAgICAgcmV0dXJuIGRvbTtcbiAgICB9XG4gICAgaWYgKGRvbSBpbnN0YW5jZW9mIEVsZW1lbnQgfHwgZG9tIGluc3RhbmNlb2YgRnJhZ21lbnQpIHtcbiAgICAgICAgcmV0dXJuIGRvbTtcbiAgICB9XG4gICAgaWYgKGRvbS50YWdOYW1lICYmIGRvbS50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT0gXCJzdmdcIikge1xuICAgICAgICByZXR1cm4gbmV3IFBhcGVyKGRvbSk7XG4gICAgfVxuICAgIGlmIChkb20udGFnTmFtZSAmJiBkb20udGFnTmFtZS50b0xvd2VyQ2FzZSgpID09IFwib2JqZWN0XCIgJiYgZG9tLnR5cGUgPT0gXCJpbWFnZS9zdmcreG1sXCIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQYXBlcihkb20uY29udGVudERvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwic3ZnXCIpWzBdKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBFbGVtZW50KGRvbSk7XG59XG5cblNuYXAuXy5tYWtlID0gbWFrZTtcblNuYXAuXy53cmFwID0gd3JhcDtcbi8qXFxcbiAqIFBhcGVyLmVsXG4gWyBtZXRob2QgXVxuICoqXG4gKiBDcmVhdGVzIGFuIGVsZW1lbnQgb24gcGFwZXIgd2l0aCBhIGdpdmVuIG5hbWUgYW5kIG5vIGF0dHJpYnV0ZXNcbiAqKlxuIC0gbmFtZSAoc3RyaW5nKSB0YWcgbmFtZVxuIC0gYXR0ciAob2JqZWN0KSBhdHRyaWJ1dGVzXG4gPSAoRWxlbWVudCkgdGhlIGN1cnJlbnQgZWxlbWVudFxuID4gVXNhZ2VcbiB8IHZhciBjID0gcGFwZXIuY2lyY2xlKDEwLCAxMCwgMTApOyAvLyBpcyB0aGUgc2FtZSBhcy4uLlxuIHwgdmFyIGMgPSBwYXBlci5lbChcImNpcmNsZVwiKS5hdHRyKHtcbiB8ICAgICBjeDogMTAsXG4gfCAgICAgY3k6IDEwLFxuIHwgICAgIHI6IDEwXG4gfCB9KTtcbiB8IC8vIGFuZCB0aGUgc2FtZSBhc1xuIHwgdmFyIGMgPSBwYXBlci5lbChcImNpcmNsZVwiLCB7XG4gfCAgICAgY3g6IDEwLFxuIHwgICAgIGN5OiAxMCxcbiB8ICAgICByOiAxMFxuIHwgfSk7XG5cXCovXG5QYXBlci5wcm90b3R5cGUuZWwgPSBmdW5jdGlvbiAobmFtZSwgYXR0cikge1xuICAgIHZhciBlbCA9IG1ha2UobmFtZSwgdGhpcy5ub2RlKTtcbiAgICBhdHRyICYmIGVsLmF0dHIoYXR0cik7XG4gICAgcmV0dXJuIGVsO1xufTtcbi8qXFxcbiAqIEVsZW1lbnQuY2hpbGRyZW5cbiBbIG1ldGhvZCBdXG4gKipcbiAqIFJldHVybnMgYXJyYXkgb2YgYWxsIHRoZSBjaGlsZHJlbiBvZiB0aGUgZWxlbWVudC5cbiA9IChhcnJheSkgYXJyYXkgb2YgRWxlbWVudHNcblxcKi9cbkVsZW1lbnQucHJvdG90eXBlLmNoaWxkcmVuID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBvdXQgPSBbXSxcbiAgICAgICAgY2ggPSB0aGlzLm5vZGUuY2hpbGROb2RlcztcbiAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBjaC5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgIG91dFtpXSA9IFNuYXAoY2hbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gb3V0O1xufTtcbmZ1bmN0aW9uIGpzb25GaWxsZXIocm9vdCwgbykge1xuICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IHJvb3QubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICB2YXIgaXRlbSA9IHtcbiAgICAgICAgICAgICAgICB0eXBlOiByb290W2ldLnR5cGUsXG4gICAgICAgICAgICAgICAgYXR0cjogcm9vdFtpXS5hdHRyKClcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjaGlsZHJlbiA9IHJvb3RbaV0uY2hpbGRyZW4oKTtcbiAgICAgICAgby5wdXNoKGl0ZW0pO1xuICAgICAgICBpZiAoY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgICAgICBqc29uRmlsbGVyKGNoaWxkcmVuLCBpdGVtLmNoaWxkTm9kZXMgPSBbXSk7XG4gICAgICAgIH1cbiAgICB9XG59XG4vKlxcXG4gKiBFbGVtZW50LnRvSlNPTlxuIFsgbWV0aG9kIF1cbiAqKlxuICogUmV0dXJucyBvYmplY3QgcmVwcmVzZW50YXRpb24gb2YgdGhlIGdpdmVuIGVsZW1lbnQgYW5kIGFsbCBpdHMgY2hpbGRyZW4uXG4gPSAob2JqZWN0KSBpbiBmb3JtYXRcbiBvIHtcbiBvICAgICB0eXBlIChzdHJpbmcpIHRoaXMudHlwZSxcbiBvICAgICBhdHRyIChvYmplY3QpIGF0dHJpYnV0ZXMgbWFwLFxuIG8gICAgIGNoaWxkTm9kZXMgKGFycmF5KSBvcHRpb25hbCBhcnJheSBvZiBjaGlsZHJlbiBpbiB0aGUgc2FtZSBmb3JtYXRcbiBvIH1cblxcKi9cbkVsZW1lbnQucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgb3V0ID0gW107XG4gICAganNvbkZpbGxlcihbdGhpc10sIG91dCk7XG4gICAgcmV0dXJuIG91dFswXTtcbn07XG4vLyBkZWZhdWx0XG5ldmUub24oXCJzbmFwLnV0aWwuZ2V0YXR0clwiLCBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGF0dCA9IGV2ZS5udCgpO1xuICAgIGF0dCA9IGF0dC5zdWJzdHJpbmcoYXR0Lmxhc3RJbmRleE9mKFwiLlwiKSArIDEpO1xuICAgIHZhciBjc3MgPSBhdHQucmVwbGFjZSgvW0EtWl0vZywgZnVuY3Rpb24gKGxldHRlcikge1xuICAgICAgICByZXR1cm4gXCItXCIgKyBsZXR0ZXIudG9Mb3dlckNhc2UoKTtcbiAgICB9KTtcbiAgICBpZiAoY3NzQXR0cltoYXNdKGNzcykpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubm9kZS5vd25lckRvY3VtZW50LmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUodGhpcy5ub2RlLCBudWxsKS5nZXRQcm9wZXJ0eVZhbHVlKGNzcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuICQodGhpcy5ub2RlLCBhdHQpO1xuICAgIH1cbn0pO1xudmFyIGNzc0F0dHIgPSB7XG4gICAgXCJhbGlnbm1lbnQtYmFzZWxpbmVcIjogMCxcbiAgICBcImJhc2VsaW5lLXNoaWZ0XCI6IDAsXG4gICAgXCJjbGlwXCI6IDAsXG4gICAgXCJjbGlwLXBhdGhcIjogMCxcbiAgICBcImNsaXAtcnVsZVwiOiAwLFxuICAgIFwiY29sb3JcIjogMCxcbiAgICBcImNvbG9yLWludGVycG9sYXRpb25cIjogMCxcbiAgICBcImNvbG9yLWludGVycG9sYXRpb24tZmlsdGVyc1wiOiAwLFxuICAgIFwiY29sb3ItcHJvZmlsZVwiOiAwLFxuICAgIFwiY29sb3ItcmVuZGVyaW5nXCI6IDAsXG4gICAgXCJjdXJzb3JcIjogMCxcbiAgICBcImRpcmVjdGlvblwiOiAwLFxuICAgIFwiZGlzcGxheVwiOiAwLFxuICAgIFwiZG9taW5hbnQtYmFzZWxpbmVcIjogMCxcbiAgICBcImVuYWJsZS1iYWNrZ3JvdW5kXCI6IDAsXG4gICAgXCJmaWxsXCI6IDAsXG4gICAgXCJmaWxsLW9wYWNpdHlcIjogMCxcbiAgICBcImZpbGwtcnVsZVwiOiAwLFxuICAgIFwiZmlsdGVyXCI6IDAsXG4gICAgXCJmbG9vZC1jb2xvclwiOiAwLFxuICAgIFwiZmxvb2Qtb3BhY2l0eVwiOiAwLFxuICAgIFwiZm9udFwiOiAwLFxuICAgIFwiZm9udC1mYW1pbHlcIjogMCxcbiAgICBcImZvbnQtc2l6ZVwiOiAwLFxuICAgIFwiZm9udC1zaXplLWFkanVzdFwiOiAwLFxuICAgIFwiZm9udC1zdHJldGNoXCI6IDAsXG4gICAgXCJmb250LXN0eWxlXCI6IDAsXG4gICAgXCJmb250LXZhcmlhbnRcIjogMCxcbiAgICBcImZvbnQtd2VpZ2h0XCI6IDAsXG4gICAgXCJnbHlwaC1vcmllbnRhdGlvbi1ob3Jpem9udGFsXCI6IDAsXG4gICAgXCJnbHlwaC1vcmllbnRhdGlvbi12ZXJ0aWNhbFwiOiAwLFxuICAgIFwiaW1hZ2UtcmVuZGVyaW5nXCI6IDAsXG4gICAgXCJrZXJuaW5nXCI6IDAsXG4gICAgXCJsZXR0ZXItc3BhY2luZ1wiOiAwLFxuICAgIFwibGlnaHRpbmctY29sb3JcIjogMCxcbiAgICBcIm1hcmtlclwiOiAwLFxuICAgIFwibWFya2VyLWVuZFwiOiAwLFxuICAgIFwibWFya2VyLW1pZFwiOiAwLFxuICAgIFwibWFya2VyLXN0YXJ0XCI6IDAsXG4gICAgXCJtYXNrXCI6IDAsXG4gICAgXCJvcGFjaXR5XCI6IDAsXG4gICAgXCJvdmVyZmxvd1wiOiAwLFxuICAgIFwicG9pbnRlci1ldmVudHNcIjogMCxcbiAgICBcInNoYXBlLXJlbmRlcmluZ1wiOiAwLFxuICAgIFwic3RvcC1jb2xvclwiOiAwLFxuICAgIFwic3RvcC1vcGFjaXR5XCI6IDAsXG4gICAgXCJzdHJva2VcIjogMCxcbiAgICBcInN0cm9rZS1kYXNoYXJyYXlcIjogMCxcbiAgICBcInN0cm9rZS1kYXNob2Zmc2V0XCI6IDAsXG4gICAgXCJzdHJva2UtbGluZWNhcFwiOiAwLFxuICAgIFwic3Ryb2tlLWxpbmVqb2luXCI6IDAsXG4gICAgXCJzdHJva2UtbWl0ZXJsaW1pdFwiOiAwLFxuICAgIFwic3Ryb2tlLW9wYWNpdHlcIjogMCxcbiAgICBcInN0cm9rZS13aWR0aFwiOiAwLFxuICAgIFwidGV4dC1hbmNob3JcIjogMCxcbiAgICBcInRleHQtZGVjb3JhdGlvblwiOiAwLFxuICAgIFwidGV4dC1yZW5kZXJpbmdcIjogMCxcbiAgICBcInVuaWNvZGUtYmlkaVwiOiAwLFxuICAgIFwidmlzaWJpbGl0eVwiOiAwLFxuICAgIFwid29yZC1zcGFjaW5nXCI6IDAsXG4gICAgXCJ3cml0aW5nLW1vZGVcIjogMFxufTtcblxuZXZlLm9uKFwic25hcC51dGlsLmF0dHJcIiwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgdmFyIGF0dCA9IGV2ZS5udCgpLFxuICAgICAgICBhdHRyID0ge307XG4gICAgYXR0ID0gYXR0LnN1YnN0cmluZyhhdHQubGFzdEluZGV4T2YoXCIuXCIpICsgMSk7XG4gICAgYXR0clthdHRdID0gdmFsdWU7XG4gICAgdmFyIHN0eWxlID0gYXR0LnJlcGxhY2UoLy0oXFx3KS9naSwgZnVuY3Rpb24gKGFsbCwgbGV0dGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gbGV0dGVyLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgIH0pLFxuICAgICAgICBjc3MgPSBhdHQucmVwbGFjZSgvW0EtWl0vZywgZnVuY3Rpb24gKGxldHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIFwiLVwiICsgbGV0dGVyLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIH0pO1xuICAgIGlmIChjc3NBdHRyW2hhc10oY3NzKSkge1xuICAgICAgICB0aGlzLm5vZGUuc3R5bGVbc3R5bGVdID0gdmFsdWUgPT0gbnVsbCA/IEUgOiB2YWx1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAkKHRoaXMubm9kZSwgYXR0cik7XG4gICAgfVxufSk7XG4oZnVuY3Rpb24gKHByb3RvKSB7fShQYXBlci5wcm90b3R5cGUpKTtcblxuLy8gc2ltcGxlIGFqYXhcbi8qXFxcbiAqIFNuYXAuYWpheFxuIFsgbWV0aG9kIF1cbiAqKlxuICogU2ltcGxlIGltcGxlbWVudGF0aW9uIG9mIEFqYXhcbiAqKlxuIC0gdXJsIChzdHJpbmcpIFVSTFxuIC0gcG9zdERhdGEgKG9iamVjdHxzdHJpbmcpIGRhdGEgZm9yIHBvc3QgcmVxdWVzdFxuIC0gY2FsbGJhY2sgKGZ1bmN0aW9uKSBjYWxsYmFja1xuIC0gc2NvcGUgKG9iamVjdCkgI29wdGlvbmFsIHNjb3BlIG9mIGNhbGxiYWNrXG4gKiBvclxuIC0gdXJsIChzdHJpbmcpIFVSTFxuIC0gY2FsbGJhY2sgKGZ1bmN0aW9uKSBjYWxsYmFja1xuIC0gc2NvcGUgKG9iamVjdCkgI29wdGlvbmFsIHNjb3BlIG9mIGNhbGxiYWNrXG4gPSAoWE1MSHR0cFJlcXVlc3QpIHRoZSBYTUxIdHRwUmVxdWVzdCBvYmplY3QsIGp1c3QgaW4gY2FzZVxuXFwqL1xuU25hcC5hamF4ID0gZnVuY3Rpb24gKHVybCwgcG9zdERhdGEsIGNhbGxiYWNrLCBzY29wZSl7XG4gICAgdmFyIHJlcSA9IG5ldyBYTUxIdHRwUmVxdWVzdCxcbiAgICAgICAgaWQgPSBJRCgpO1xuICAgIGlmIChyZXEpIHtcbiAgICAgICAgaWYgKGlzKHBvc3REYXRhLCBcImZ1bmN0aW9uXCIpKSB7XG4gICAgICAgICAgICBzY29wZSA9IGNhbGxiYWNrO1xuICAgICAgICAgICAgY2FsbGJhY2sgPSBwb3N0RGF0YTtcbiAgICAgICAgICAgIHBvc3REYXRhID0gbnVsbDtcbiAgICAgICAgfSBlbHNlIGlmIChpcyhwb3N0RGF0YSwgXCJvYmplY3RcIikpIHtcbiAgICAgICAgICAgIHZhciBwZCA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHBvc3REYXRhKSBpZiAocG9zdERhdGEuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgIHBkLnB1c2goZW5jb2RlVVJJQ29tcG9uZW50KGtleSkgKyBcIj1cIiArIGVuY29kZVVSSUNvbXBvbmVudChwb3N0RGF0YVtrZXldKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwb3N0RGF0YSA9IHBkLmpvaW4oXCImXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJlcS5vcGVuKChwb3N0RGF0YSA/IFwiUE9TVFwiIDogXCJHRVRcIiksIHVybCwgdHJ1ZSk7XG4gICAgICAgIGlmIChwb3N0RGF0YSkge1xuICAgICAgICAgICAgcmVxLnNldFJlcXVlc3RIZWFkZXIoXCJYLVJlcXVlc3RlZC1XaXRoXCIsIFwiWE1MSHR0cFJlcXVlc3RcIik7XG4gICAgICAgICAgICByZXEuc2V0UmVxdWVzdEhlYWRlcihcIkNvbnRlbnQtdHlwZVwiLCBcImFwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZFwiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGV2ZS5vbmNlKFwic25hcC5hamF4LlwiICsgaWQgKyBcIi4wXCIsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIGV2ZS5vbmNlKFwic25hcC5hamF4LlwiICsgaWQgKyBcIi4yMDBcIiwgY2FsbGJhY2spO1xuICAgICAgICAgICAgZXZlLm9uY2UoXCJzbmFwLmFqYXguXCIgKyBpZCArIFwiLjMwNFwiLCBjYWxsYmFjayk7XG4gICAgICAgIH1cbiAgICAgICAgcmVxLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKHJlcS5yZWFkeVN0YXRlICE9IDQpIHJldHVybjtcbiAgICAgICAgICAgIGV2ZShcInNuYXAuYWpheC5cIiArIGlkICsgXCIuXCIgKyByZXEuc3RhdHVzLCBzY29wZSwgcmVxKTtcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHJlcS5yZWFkeVN0YXRlID09IDQpIHtcbiAgICAgICAgICAgIHJldHVybiByZXE7XG4gICAgICAgIH1cbiAgICAgICAgcmVxLnNlbmQocG9zdERhdGEpO1xuICAgICAgICByZXR1cm4gcmVxO1xuICAgIH1cbn07XG4vKlxcXG4gKiBTbmFwLmxvYWRcbiBbIG1ldGhvZCBdXG4gKipcbiAqIExvYWRzIGV4dGVybmFsIFNWRyBmaWxlIGFzIGEgQEZyYWdtZW50IChzZWUgQFNuYXAuYWpheCBmb3IgbW9yZSBhZHZhbmNlZCBBSkFYKVxuICoqXG4gLSB1cmwgKHN0cmluZykgVVJMXG4gLSBjYWxsYmFjayAoZnVuY3Rpb24pIGNhbGxiYWNrXG4gLSBzY29wZSAob2JqZWN0KSAjb3B0aW9uYWwgc2NvcGUgb2YgY2FsbGJhY2tcblxcKi9cblNuYXAubG9hZCA9IGZ1bmN0aW9uICh1cmwsIGNhbGxiYWNrLCBzY29wZSkge1xuICAgIFNuYXAuYWpheCh1cmwsIGZ1bmN0aW9uIChyZXEpIHtcbiAgICAgICAgdmFyIGYgPSBTbmFwLnBhcnNlKHJlcS5yZXNwb25zZVRleHQpO1xuICAgICAgICBzY29wZSA/IGNhbGxiYWNrLmNhbGwoc2NvcGUsIGYpIDogY2FsbGJhY2soZik7XG4gICAgfSk7XG59O1xudmFyIGdldE9mZnNldCA9IGZ1bmN0aW9uIChlbGVtKSB7XG4gICAgdmFyIGJveCA9IGVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXG4gICAgICAgIGRvYyA9IGVsZW0ub3duZXJEb2N1bWVudCxcbiAgICAgICAgYm9keSA9IGRvYy5ib2R5LFxuICAgICAgICBkb2NFbGVtID0gZG9jLmRvY3VtZW50RWxlbWVudCxcbiAgICAgICAgY2xpZW50VG9wID0gZG9jRWxlbS5jbGllbnRUb3AgfHwgYm9keS5jbGllbnRUb3AgfHwgMCwgY2xpZW50TGVmdCA9IGRvY0VsZW0uY2xpZW50TGVmdCB8fCBib2R5LmNsaWVudExlZnQgfHwgMCxcbiAgICAgICAgdG9wICA9IGJveC50b3AgICsgKGcud2luLnBhZ2VZT2Zmc2V0IHx8IGRvY0VsZW0uc2Nyb2xsVG9wIHx8IGJvZHkuc2Nyb2xsVG9wICkgLSBjbGllbnRUb3AsXG4gICAgICAgIGxlZnQgPSBib3gubGVmdCArIChnLndpbi5wYWdlWE9mZnNldCB8fCBkb2NFbGVtLnNjcm9sbExlZnQgfHwgYm9keS5zY3JvbGxMZWZ0KSAtIGNsaWVudExlZnQ7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgeTogdG9wLFxuICAgICAgICB4OiBsZWZ0XG4gICAgfTtcbn07XG4vKlxcXG4gKiBTbmFwLmdldEVsZW1lbnRCeVBvaW50XG4gWyBtZXRob2QgXVxuICoqXG4gKiBSZXR1cm5zIHlvdSB0b3Btb3N0IGVsZW1lbnQgdW5kZXIgZ2l2ZW4gcG9pbnQuXG4gKipcbiA9IChvYmplY3QpIFNuYXAgZWxlbWVudCBvYmplY3RcbiAtIHggKG51bWJlcikgeCBjb29yZGluYXRlIGZyb20gdGhlIHRvcCBsZWZ0IGNvcm5lciBvZiB0aGUgd2luZG93XG4gLSB5IChudW1iZXIpIHkgY29vcmRpbmF0ZSBmcm9tIHRoZSB0b3AgbGVmdCBjb3JuZXIgb2YgdGhlIHdpbmRvd1xuID4gVXNhZ2VcbiB8IFNuYXAuZ2V0RWxlbWVudEJ5UG9pbnQobW91c2VYLCBtb3VzZVkpLmF0dHIoe3N0cm9rZTogXCIjZjAwXCJ9KTtcblxcKi9cblNuYXAuZ2V0RWxlbWVudEJ5UG9pbnQgPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgIHZhciBwYXBlciA9IHRoaXMsXG4gICAgICAgIHN2ZyA9IHBhcGVyLmNhbnZhcyxcbiAgICAgICAgdGFyZ2V0ID0gZ2xvYi5kb2MuZWxlbWVudEZyb21Qb2ludCh4LCB5KTtcbiAgICBpZiAoZ2xvYi53aW4ub3BlcmEgJiYgdGFyZ2V0LnRhZ05hbWUgPT0gXCJzdmdcIikge1xuICAgICAgICB2YXIgc28gPSBnZXRPZmZzZXQodGFyZ2V0KSxcbiAgICAgICAgICAgIHNyID0gdGFyZ2V0LmNyZWF0ZVNWR1JlY3QoKTtcbiAgICAgICAgc3IueCA9IHggLSBzby54O1xuICAgICAgICBzci55ID0geSAtIHNvLnk7XG4gICAgICAgIHNyLndpZHRoID0gc3IuaGVpZ2h0ID0gMTtcbiAgICAgICAgdmFyIGhpdHMgPSB0YXJnZXQuZ2V0SW50ZXJzZWN0aW9uTGlzdChzciwgbnVsbCk7XG4gICAgICAgIGlmIChoaXRzLmxlbmd0aCkge1xuICAgICAgICAgICAgdGFyZ2V0ID0gaGl0c1toaXRzLmxlbmd0aCAtIDFdO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmICghdGFyZ2V0KSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gd3JhcCh0YXJnZXQpO1xufTtcbi8qXFxcbiAqIFNuYXAucGx1Z2luXG4gWyBtZXRob2QgXVxuICoqXG4gKiBMZXQgeW91IHdyaXRlIHBsdWdpbnMuIFlvdSBwYXNzIGluIGEgZnVuY3Rpb24gd2l0aCBmaXZlIGFyZ3VtZW50cywgbGlrZSB0aGlzOlxuIHwgU25hcC5wbHVnaW4oZnVuY3Rpb24gKFNuYXAsIEVsZW1lbnQsIFBhcGVyLCBnbG9iYWwsIEZyYWdtZW50KSB7XG4gfCAgICAgU25hcC5uZXdtZXRob2QgPSBmdW5jdGlvbiAoKSB7fTtcbiB8ICAgICBFbGVtZW50LnByb3RvdHlwZS5uZXdtZXRob2QgPSBmdW5jdGlvbiAoKSB7fTtcbiB8ICAgICBQYXBlci5wcm90b3R5cGUubmV3bWV0aG9kID0gZnVuY3Rpb24gKCkge307XG4gfCB9KTtcbiAqIEluc2lkZSB0aGUgZnVuY3Rpb24geW91IGhhdmUgYWNjZXNzIHRvIGFsbCBtYWluIG9iamVjdHMgKGFuZCB0aGVpclxuICogcHJvdG90eXBlcykuIFRoaXMgYWxsb3cgeW91IHRvIGV4dGVuZCBhbnl0aGluZyB5b3Ugd2FudC5cbiAqKlxuIC0gZiAoZnVuY3Rpb24pIHlvdXIgcGx1Z2luIGJvZHlcblxcKi9cblNuYXAucGx1Z2luID0gZnVuY3Rpb24gKGYpIHtcbiAgICBmKFNuYXAsIEVsZW1lbnQsIFBhcGVyLCBnbG9iLCBGcmFnbWVudCk7XG59O1xuZ2xvYi53aW4uU25hcCA9IFNuYXA7XG5yZXR1cm4gU25hcDtcbn0od2luZG93IHx8IHRoaXMpKTtcblxuLy8gQ29weXJpZ2h0IChjKSAyMDEzIEFkb2JlIFN5c3RlbXMgSW5jb3Jwb3JhdGVkLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuU25hcC5wbHVnaW4oZnVuY3Rpb24gKFNuYXAsIEVsZW1lbnQsIFBhcGVyLCBnbG9iLCBGcmFnbWVudCkge1xuICAgIHZhciBlbHByb3RvID0gRWxlbWVudC5wcm90b3R5cGUsXG4gICAgICAgIGlzID0gU25hcC5pcyxcbiAgICAgICAgU3RyID0gU3RyaW5nLFxuICAgICAgICB1bml0MnB4ID0gU25hcC5fdW5pdDJweCxcbiAgICAgICAgJCA9IFNuYXAuXy4kLFxuICAgICAgICBtYWtlID0gU25hcC5fLm1ha2UsXG4gICAgICAgIGdldFNvbWVEZWZzID0gU25hcC5fLmdldFNvbWVEZWZzLFxuICAgICAgICBoYXMgPSBcImhhc093blByb3BlcnR5XCIsXG4gICAgICAgIHdyYXAgPSBTbmFwLl8ud3JhcDtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5nZXRCQm94XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIHRoZSBib3VuZGluZyBib3ggZGVzY3JpcHRvciBmb3IgdGhlIGdpdmVuIGVsZW1lbnRcbiAgICAgKipcbiAgICAgPSAob2JqZWN0KSBib3VuZGluZyBib3ggZGVzY3JpcHRvcjpcbiAgICAgbyB7XG4gICAgIG8gICAgIGN4OiAobnVtYmVyKSB4IG9mIHRoZSBjZW50ZXIsXG4gICAgIG8gICAgIGN5OiAobnVtYmVyKSB4IG9mIHRoZSBjZW50ZXIsXG4gICAgIG8gICAgIGg6IChudW1iZXIpIGhlaWdodCxcbiAgICAgbyAgICAgaGVpZ2h0OiAobnVtYmVyKSBoZWlnaHQsXG4gICAgIG8gICAgIHBhdGg6IChzdHJpbmcpIHBhdGggY29tbWFuZCBmb3IgdGhlIGJveCxcbiAgICAgbyAgICAgcjA6IChudW1iZXIpIHJhZGl1cyBvZiBhIGNpcmNsZSB0aGF0IGZ1bGx5IGVuY2xvc2VzIHRoZSBib3gsXG4gICAgIG8gICAgIHIxOiAobnVtYmVyKSByYWRpdXMgb2YgdGhlIHNtYWxsZXN0IGNpcmNsZSB0aGF0IGNhbiBiZSBlbmNsb3NlZCxcbiAgICAgbyAgICAgcjI6IChudW1iZXIpIHJhZGl1cyBvZiB0aGUgbGFyZ2VzdCBjaXJjbGUgdGhhdCBjYW4gYmUgZW5jbG9zZWQsXG4gICAgIG8gICAgIHZiOiAoc3RyaW5nKSBib3ggYXMgYSB2aWV3Ym94IGNvbW1hbmQsXG4gICAgIG8gICAgIHc6IChudW1iZXIpIHdpZHRoLFxuICAgICBvICAgICB3aWR0aDogKG51bWJlcikgd2lkdGgsXG4gICAgIG8gICAgIHgyOiAobnVtYmVyKSB4IG9mIHRoZSByaWdodCBzaWRlLFxuICAgICBvICAgICB4OiAobnVtYmVyKSB4IG9mIHRoZSBsZWZ0IHNpZGUsXG4gICAgIG8gICAgIHkyOiAobnVtYmVyKSB5IG9mIHRoZSBib3R0b20gZWRnZSxcbiAgICAgbyAgICAgeTogKG51bWJlcikgeSBvZiB0aGUgdG9wIGVkZ2VcbiAgICAgbyB9XG4gICAgXFwqL1xuICAgIGVscHJvdG8uZ2V0QkJveCA9IGZ1bmN0aW9uIChpc1dpdGhvdXRUcmFuc2Zvcm0pIHtcbiAgICAgICAgaWYgKCFTbmFwLk1hdHJpeCB8fCAhU25hcC5wYXRoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5ub2RlLmdldEJCb3goKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZWwgPSB0aGlzLFxuICAgICAgICAgICAgbSA9IG5ldyBTbmFwLk1hdHJpeDtcbiAgICAgICAgaWYgKGVsLnJlbW92ZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBTbmFwLl8uYm94KCk7XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKGVsLnR5cGUgPT0gXCJ1c2VcIikge1xuICAgICAgICAgICAgaWYgKCFpc1dpdGhvdXRUcmFuc2Zvcm0pIHtcbiAgICAgICAgICAgICAgICBtID0gbS5hZGQoZWwudHJhbnNmb3JtKCkubG9jYWxNYXRyaXgudHJhbnNsYXRlKGVsLmF0dHIoXCJ4XCIpIHx8IDAsIGVsLmF0dHIoXCJ5XCIpIHx8IDApKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbC5vcmlnaW5hbCkge1xuICAgICAgICAgICAgICAgIGVsID0gZWwub3JpZ2luYWw7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBocmVmID0gZWwuYXR0cihcInhsaW5rOmhyZWZcIik7XG4gICAgICAgICAgICAgICAgZWwgPSBlbC5vcmlnaW5hbCA9IGVsLm5vZGUub3duZXJEb2N1bWVudC5nZXRFbGVtZW50QnlJZChocmVmLnN1YnN0cmluZyhocmVmLmluZGV4T2YoXCIjXCIpICsgMSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBfID0gZWwuXyxcbiAgICAgICAgICAgIHBhdGhmaW5kZXIgPSBTbmFwLnBhdGguZ2V0W2VsLnR5cGVdIHx8IFNuYXAucGF0aC5nZXQuZGVmbHQ7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoaXNXaXRob3V0VHJhbnNmb3JtKSB7XG4gICAgICAgICAgICAgICAgXy5iYm94d3QgPSBwYXRoZmluZGVyID8gU25hcC5wYXRoLmdldEJCb3goZWwucmVhbFBhdGggPSBwYXRoZmluZGVyKGVsKSkgOiBTbmFwLl8uYm94KGVsLm5vZGUuZ2V0QkJveCgpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gU25hcC5fLmJveChfLmJib3h3dCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGVsLnJlYWxQYXRoID0gcGF0aGZpbmRlcihlbCk7XG4gICAgICAgICAgICAgICAgZWwubWF0cml4ID0gZWwudHJhbnNmb3JtKCkubG9jYWxNYXRyaXg7XG4gICAgICAgICAgICAgICAgXy5iYm94ID0gU25hcC5wYXRoLmdldEJCb3goU25hcC5wYXRoLm1hcChlbC5yZWFsUGF0aCwgbS5hZGQoZWwubWF0cml4KSkpO1xuICAgICAgICAgICAgICAgIHJldHVybiBTbmFwLl8uYm94KF8uYmJveCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIC8vIEZpcmVmb3ggZG9lc27igJl0IGdpdmUgeW91IGJib3ggb2YgaGlkZGVuIGVsZW1lbnRcbiAgICAgICAgICAgIHJldHVybiBTbmFwLl8uYm94KCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHZhciBwcm9wU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdHJpbmc7XG4gICAgfTtcbiAgICBmdW5jdGlvbiBleHRyYWN0VHJhbnNmb3JtKGVsLCB0c3RyKSB7XG4gICAgICAgIGlmICh0c3RyID09IG51bGwpIHtcbiAgICAgICAgICAgIHZhciBkb1JldHVybiA9IHRydWU7XG4gICAgICAgICAgICBpZiAoZWwudHlwZSA9PSBcImxpbmVhckdyYWRpZW50XCIgfHwgZWwudHlwZSA9PSBcInJhZGlhbEdyYWRpZW50XCIpIHtcbiAgICAgICAgICAgICAgICB0c3RyID0gZWwubm9kZS5nZXRBdHRyaWJ1dGUoXCJncmFkaWVudFRyYW5zZm9ybVwiKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZWwudHlwZSA9PSBcInBhdHRlcm5cIikge1xuICAgICAgICAgICAgICAgIHRzdHIgPSBlbC5ub2RlLmdldEF0dHJpYnV0ZShcInBhdHRlcm5UcmFuc2Zvcm1cIik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRzdHIgPSBlbC5ub2RlLmdldEF0dHJpYnV0ZShcInRyYW5zZm9ybVwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghdHN0cikge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgU25hcC5NYXRyaXg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0c3RyID0gU25hcC5fLnN2Z1RyYW5zZm9ybTJzdHJpbmcodHN0cik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoIVNuYXAuXy5yZ1RyYW5zZm9ybS50ZXN0KHRzdHIpKSB7XG4gICAgICAgICAgICAgICAgdHN0ciA9IFNuYXAuXy5zdmdUcmFuc2Zvcm0yc3RyaW5nKHRzdHIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0c3RyID0gU3RyKHRzdHIpLnJlcGxhY2UoL1xcLnszfXxcXHUyMDI2L2csIGVsLl8udHJhbnNmb3JtIHx8IFwiXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlzKHRzdHIsIFwiYXJyYXlcIikpIHtcbiAgICAgICAgICAgICAgICB0c3RyID0gU25hcC5wYXRoID8gU25hcC5wYXRoLnRvU3RyaW5nLmNhbGwodHN0cikgOiBTdHIodHN0cik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbC5fLnRyYW5zZm9ybSA9IHRzdHI7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG0gPSBTbmFwLl8udHJhbnNmb3JtMm1hdHJpeCh0c3RyLCBlbC5nZXRCQm94KDEpKTtcbiAgICAgICAgaWYgKGRvUmV0dXJuKSB7XG4gICAgICAgICAgICByZXR1cm4gbTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVsLm1hdHJpeCA9IG07XG4gICAgICAgIH1cbiAgICB9XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudHJhbnNmb3JtXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBHZXRzIG9yIHNldHMgdHJhbnNmb3JtYXRpb24gb2YgdGhlIGVsZW1lbnRcbiAgICAgKipcbiAgICAgLSB0c3RyIChzdHJpbmcpIHRyYW5zZm9ybSBzdHJpbmcgaW4gU25hcCBvciBTVkcgZm9ybWF0XG4gICAgID0gKEVsZW1lbnQpIHRoZSBjdXJyZW50IGVsZW1lbnRcbiAgICAgKiBvclxuICAgICA9IChvYmplY3QpIHRyYW5zZm9ybWF0aW9uIGRlc2NyaXB0b3I6XG4gICAgIG8ge1xuICAgICBvICAgICBzdHJpbmcgKHN0cmluZykgdHJhbnNmb3JtIHN0cmluZyxcbiAgICAgbyAgICAgZ2xvYmFsTWF0cml4IChNYXRyaXgpIG1hdHJpeCBvZiBhbGwgdHJhbnNmb3JtYXRpb25zIGFwcGxpZWQgdG8gZWxlbWVudCBvciBpdHMgcGFyZW50cyxcbiAgICAgbyAgICAgbG9jYWxNYXRyaXggKE1hdHJpeCkgbWF0cml4IG9mIHRyYW5zZm9ybWF0aW9ucyBhcHBsaWVkIG9ubHkgdG8gdGhlIGVsZW1lbnQsXG4gICAgIG8gICAgIGRpZmZNYXRyaXggKE1hdHJpeCkgbWF0cml4IG9mIGRpZmZlcmVuY2UgYmV0d2VlbiBnbG9iYWwgYW5kIGxvY2FsIHRyYW5zZm9ybWF0aW9ucyxcbiAgICAgbyAgICAgZ2xvYmFsIChzdHJpbmcpIGdsb2JhbCB0cmFuc2Zvcm1hdGlvbiBhcyBzdHJpbmcsXG4gICAgIG8gICAgIGxvY2FsIChzdHJpbmcpIGxvY2FsIHRyYW5zZm9ybWF0aW9uIGFzIHN0cmluZyxcbiAgICAgbyAgICAgdG9TdHJpbmcgKGZ1bmN0aW9uKSByZXR1cm5zIGBzdHJpbmdgIHByb3BlcnR5XG4gICAgIG8gfVxuICAgIFxcKi9cbiAgICBlbHByb3RvLnRyYW5zZm9ybSA9IGZ1bmN0aW9uICh0c3RyKSB7XG4gICAgICAgIHZhciBfID0gdGhpcy5fO1xuICAgICAgICBpZiAodHN0ciA9PSBudWxsKSB7XG4gICAgICAgICAgICB2YXIgcGFwYSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgZ2xvYmFsID0gbmV3IFNuYXAuTWF0cml4KHRoaXMubm9kZS5nZXRDVE0oKSksXG4gICAgICAgICAgICAgICAgbG9jYWwgPSBleHRyYWN0VHJhbnNmb3JtKHRoaXMpLFxuICAgICAgICAgICAgICAgIG1zID0gW2xvY2FsXSxcbiAgICAgICAgICAgICAgICBtID0gbmV3IFNuYXAuTWF0cml4LFxuICAgICAgICAgICAgICAgIGksXG4gICAgICAgICAgICAgICAgbG9jYWxTdHJpbmcgPSBsb2NhbC50b1RyYW5zZm9ybVN0cmluZygpLFxuICAgICAgICAgICAgICAgIHN0cmluZyA9IFN0cihsb2NhbCkgPT0gU3RyKHRoaXMubWF0cml4KSA/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgU3RyKF8udHJhbnNmb3JtKSA6IGxvY2FsU3RyaW5nO1xuICAgICAgICAgICAgd2hpbGUgKHBhcGEudHlwZSAhPSBcInN2Z1wiICYmIChwYXBhID0gcGFwYS5wYXJlbnQoKSkpIHtcbiAgICAgICAgICAgICAgICBtcy5wdXNoKGV4dHJhY3RUcmFuc2Zvcm0ocGFwYSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSA9IG1zLmxlbmd0aDtcbiAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgICAgICBtLmFkZChtc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN0cmluZzogc3RyaW5nLFxuICAgICAgICAgICAgICAgIGdsb2JhbE1hdHJpeDogZ2xvYmFsLFxuICAgICAgICAgICAgICAgIHRvdGFsTWF0cml4OiBtLFxuICAgICAgICAgICAgICAgIGxvY2FsTWF0cml4OiBsb2NhbCxcbiAgICAgICAgICAgICAgICBkaWZmTWF0cml4OiBnbG9iYWwuY2xvbmUoKS5hZGQobG9jYWwuaW52ZXJ0KCkpLFxuICAgICAgICAgICAgICAgIGdsb2JhbDogZ2xvYmFsLnRvVHJhbnNmb3JtU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgdG90YWw6IG0udG9UcmFuc2Zvcm1TdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBsb2NhbDogbG9jYWxTdHJpbmcsXG4gICAgICAgICAgICAgICAgdG9TdHJpbmc6IHByb3BTdHJpbmdcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRzdHIgaW5zdGFuY2VvZiBTbmFwLk1hdHJpeCkge1xuICAgICAgICAgICAgdGhpcy5tYXRyaXggPSB0c3RyO1xuICAgICAgICAgICAgdGhpcy5fLnRyYW5zZm9ybSA9IHRzdHIudG9UcmFuc2Zvcm1TdHJpbmcoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGV4dHJhY3RUcmFuc2Zvcm0odGhpcywgdHN0cik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5ub2RlKSB7XG4gICAgICAgICAgICBpZiAodGhpcy50eXBlID09IFwibGluZWFyR3JhZGllbnRcIiB8fCB0aGlzLnR5cGUgPT0gXCJyYWRpYWxHcmFkaWVudFwiKSB7XG4gICAgICAgICAgICAgICAgJCh0aGlzLm5vZGUsIHtncmFkaWVudFRyYW5zZm9ybTogdGhpcy5tYXRyaXh9KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy50eXBlID09IFwicGF0dGVyblwiKSB7XG4gICAgICAgICAgICAgICAgJCh0aGlzLm5vZGUsIHtwYXR0ZXJuVHJhbnNmb3JtOiB0aGlzLm1hdHJpeH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkKHRoaXMubm9kZSwge3RyYW5zZm9ybTogdGhpcy5tYXRyaXh9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQucGFyZW50XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIHRoZSBlbGVtZW50J3MgcGFyZW50XG4gICAgICoqXG4gICAgID0gKEVsZW1lbnQpIHRoZSBwYXJlbnQgZWxlbWVudFxuICAgIFxcKi9cbiAgICBlbHByb3RvLnBhcmVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodGhpcy5ub2RlLnBhcmVudE5vZGUpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuYXBwZW5kXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBBcHBlbmRzIHRoZSBnaXZlbiBlbGVtZW50IHRvIGN1cnJlbnQgb25lXG4gICAgICoqXG4gICAgIC0gZWwgKEVsZW1lbnR8U2V0KSBlbGVtZW50IHRvIGFwcGVuZFxuICAgICA9IChFbGVtZW50KSB0aGUgcGFyZW50IGVsZW1lbnRcbiAgICBcXCovXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuYWRkXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBTZWUgQEVsZW1lbnQuYXBwZW5kXG4gICAgXFwqL1xuICAgIGVscHJvdG8uYXBwZW5kID0gZWxwcm90by5hZGQgPSBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgaWYgKGVsKSB7XG4gICAgICAgICAgICBpZiAoZWwudHlwZSA9PSBcInNldFwiKSB7XG4gICAgICAgICAgICAgICAgdmFyIGl0ID0gdGhpcztcbiAgICAgICAgICAgICAgICBlbC5mb3JFYWNoKGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgICAgICAgICBpdC5hZGQoZWwpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWwgPSB3cmFwKGVsKTtcbiAgICAgICAgICAgIHRoaXMubm9kZS5hcHBlbmRDaGlsZChlbC5ub2RlKTtcbiAgICAgICAgICAgIGVsLnBhcGVyID0gdGhpcy5wYXBlcjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LmFwcGVuZFRvXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBBcHBlbmRzIHRoZSBjdXJyZW50IGVsZW1lbnQgdG8gdGhlIGdpdmVuIG9uZVxuICAgICAqKlxuICAgICAtIGVsIChFbGVtZW50KSBwYXJlbnQgZWxlbWVudCB0byBhcHBlbmQgdG9cbiAgICAgPSAoRWxlbWVudCkgdGhlIGNoaWxkIGVsZW1lbnRcbiAgICBcXCovXG4gICAgZWxwcm90by5hcHBlbmRUbyA9IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICBpZiAoZWwpIHtcbiAgICAgICAgICAgIGVsID0gd3JhcChlbCk7XG4gICAgICAgICAgICBlbC5hcHBlbmQodGhpcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5wcmVwZW5kXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBQcmVwZW5kcyB0aGUgZ2l2ZW4gZWxlbWVudCB0byB0aGUgY3VycmVudCBvbmVcbiAgICAgKipcbiAgICAgLSBlbCAoRWxlbWVudCkgZWxlbWVudCB0byBwcmVwZW5kXG4gICAgID0gKEVsZW1lbnQpIHRoZSBwYXJlbnQgZWxlbWVudFxuICAgIFxcKi9cbiAgICBlbHByb3RvLnByZXBlbmQgPSBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgaWYgKGVsKSB7XG4gICAgICAgICAgICBpZiAoZWwudHlwZSA9PSBcInNldFwiKSB7XG4gICAgICAgICAgICAgICAgdmFyIGl0ID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgZmlyc3Q7XG4gICAgICAgICAgICAgICAgZWwuZm9yRWFjaChmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZpcnN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaXJzdC5hZnRlcihlbCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdC5wcmVwZW5kKGVsKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBmaXJzdCA9IGVsO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWwgPSB3cmFwKGVsKTtcbiAgICAgICAgICAgIHZhciBwYXJlbnQgPSBlbC5wYXJlbnQoKTtcbiAgICAgICAgICAgIHRoaXMubm9kZS5pbnNlcnRCZWZvcmUoZWwubm9kZSwgdGhpcy5ub2RlLmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgdGhpcy5hZGQgJiYgdGhpcy5hZGQoKTtcbiAgICAgICAgICAgIGVsLnBhcGVyID0gdGhpcy5wYXBlcjtcbiAgICAgICAgICAgIHRoaXMucGFyZW50KCkgJiYgdGhpcy5wYXJlbnQoKS5hZGQoKTtcbiAgICAgICAgICAgIHBhcmVudCAmJiBwYXJlbnQuYWRkKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5wcmVwZW5kVG9cbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFByZXBlbmRzIHRoZSBjdXJyZW50IGVsZW1lbnQgdG8gdGhlIGdpdmVuIG9uZVxuICAgICAqKlxuICAgICAtIGVsIChFbGVtZW50KSBwYXJlbnQgZWxlbWVudCB0byBwcmVwZW5kIHRvXG4gICAgID0gKEVsZW1lbnQpIHRoZSBjaGlsZCBlbGVtZW50XG4gICAgXFwqL1xuICAgIGVscHJvdG8ucHJlcGVuZFRvID0gZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgIGVsID0gd3JhcChlbCk7XG4gICAgICAgIGVsLnByZXBlbmQodGhpcyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuYmVmb3JlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBJbnNlcnRzIGdpdmVuIGVsZW1lbnQgYmVmb3JlIHRoZSBjdXJyZW50IG9uZVxuICAgICAqKlxuICAgICAtIGVsIChFbGVtZW50KSBlbGVtZW50IHRvIGluc2VydFxuICAgICA9IChFbGVtZW50KSB0aGUgcGFyZW50IGVsZW1lbnRcbiAgICBcXCovXG4gICAgZWxwcm90by5iZWZvcmUgPSBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgaWYgKGVsLnR5cGUgPT0gXCJzZXRcIikge1xuICAgICAgICAgICAgdmFyIGl0ID0gdGhpcztcbiAgICAgICAgICAgIGVsLmZvckVhY2goZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhcmVudCA9IGVsLnBhcmVudCgpO1xuICAgICAgICAgICAgICAgIGl0Lm5vZGUucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoZWwubm9kZSwgaXQubm9kZSk7XG4gICAgICAgICAgICAgICAgcGFyZW50ICYmIHBhcmVudC5hZGQoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5wYXJlbnQoKS5hZGQoKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGVsID0gd3JhcChlbCk7XG4gICAgICAgIHZhciBwYXJlbnQgPSBlbC5wYXJlbnQoKTtcbiAgICAgICAgdGhpcy5ub2RlLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGVsLm5vZGUsIHRoaXMubm9kZSk7XG4gICAgICAgIHRoaXMucGFyZW50KCkgJiYgdGhpcy5wYXJlbnQoKS5hZGQoKTtcbiAgICAgICAgcGFyZW50ICYmIHBhcmVudC5hZGQoKTtcbiAgICAgICAgZWwucGFwZXIgPSB0aGlzLnBhcGVyO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LmFmdGVyXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBJbnNlcnRzIGdpdmVuIGVsZW1lbnQgYWZ0ZXIgdGhlIGN1cnJlbnQgb25lXG4gICAgICoqXG4gICAgIC0gZWwgKEVsZW1lbnQpIGVsZW1lbnQgdG8gaW5zZXJ0XG4gICAgID0gKEVsZW1lbnQpIHRoZSBwYXJlbnQgZWxlbWVudFxuICAgIFxcKi9cbiAgICBlbHByb3RvLmFmdGVyID0gZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgIGVsID0gd3JhcChlbCk7XG4gICAgICAgIHZhciBwYXJlbnQgPSBlbC5wYXJlbnQoKTtcbiAgICAgICAgaWYgKHRoaXMubm9kZS5uZXh0U2libGluZykge1xuICAgICAgICAgICAgdGhpcy5ub2RlLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGVsLm5vZGUsIHRoaXMubm9kZS5uZXh0U2libGluZyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLm5vZGUucGFyZW50Tm9kZS5hcHBlbmRDaGlsZChlbC5ub2RlKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnBhcmVudCgpICYmIHRoaXMucGFyZW50KCkuYWRkKCk7XG4gICAgICAgIHBhcmVudCAmJiBwYXJlbnQuYWRkKCk7XG4gICAgICAgIGVsLnBhcGVyID0gdGhpcy5wYXBlcjtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5pbnNlcnRCZWZvcmVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEluc2VydHMgdGhlIGVsZW1lbnQgYWZ0ZXIgdGhlIGdpdmVuIG9uZVxuICAgICAqKlxuICAgICAtIGVsIChFbGVtZW50KSBlbGVtZW50IG5leHQgdG8gd2hvbSBpbnNlcnQgdG9cbiAgICAgPSAoRWxlbWVudCkgdGhlIHBhcmVudCBlbGVtZW50XG4gICAgXFwqL1xuICAgIGVscHJvdG8uaW5zZXJ0QmVmb3JlID0gZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgIGVsID0gd3JhcChlbCk7XG4gICAgICAgIHZhciBwYXJlbnQgPSB0aGlzLnBhcmVudCgpO1xuICAgICAgICBlbC5ub2RlLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKHRoaXMubm9kZSwgZWwubm9kZSk7XG4gICAgICAgIHRoaXMucGFwZXIgPSBlbC5wYXBlcjtcbiAgICAgICAgcGFyZW50ICYmIHBhcmVudC5hZGQoKTtcbiAgICAgICAgZWwucGFyZW50KCkgJiYgZWwucGFyZW50KCkuYWRkKCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuaW5zZXJ0QWZ0ZXJcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEluc2VydHMgdGhlIGVsZW1lbnQgYWZ0ZXIgdGhlIGdpdmVuIG9uZVxuICAgICAqKlxuICAgICAtIGVsIChFbGVtZW50KSBlbGVtZW50IG5leHQgdG8gd2hvbSBpbnNlcnQgdG9cbiAgICAgPSAoRWxlbWVudCkgdGhlIHBhcmVudCBlbGVtZW50XG4gICAgXFwqL1xuICAgIGVscHJvdG8uaW5zZXJ0QWZ0ZXIgPSBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgZWwgPSB3cmFwKGVsKTtcbiAgICAgICAgdmFyIHBhcmVudCA9IHRoaXMucGFyZW50KCk7XG4gICAgICAgIGVsLm5vZGUucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUodGhpcy5ub2RlLCBlbC5ub2RlLm5leHRTaWJsaW5nKTtcbiAgICAgICAgdGhpcy5wYXBlciA9IGVsLnBhcGVyO1xuICAgICAgICBwYXJlbnQgJiYgcGFyZW50LmFkZCgpO1xuICAgICAgICBlbC5wYXJlbnQoKSAmJiBlbC5wYXJlbnQoKS5hZGQoKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5yZW1vdmVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgZWxlbWVudCBmcm9tIHRoZSBET01cbiAgICAgPSAoRWxlbWVudCkgdGhlIGRldGFjaGVkIGVsZW1lbnRcbiAgICBcXCovXG4gICAgZWxwcm90by5yZW1vdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBwYXJlbnQgPSB0aGlzLnBhcmVudCgpO1xuICAgICAgICB0aGlzLm5vZGUucGFyZW50Tm9kZSAmJiB0aGlzLm5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLm5vZGUpO1xuICAgICAgICBkZWxldGUgdGhpcy5wYXBlcjtcbiAgICAgICAgdGhpcy5yZW1vdmVkID0gdHJ1ZTtcbiAgICAgICAgcGFyZW50ICYmIHBhcmVudC5hZGQoKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5zZWxlY3RcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEdhdGhlcnMgdGhlIG5lc3RlZCBARWxlbWVudCBtYXRjaGluZyB0aGUgZ2l2ZW4gc2V0IG9mIENTUyBzZWxlY3RvcnNcbiAgICAgKipcbiAgICAgLSBxdWVyeSAoc3RyaW5nKSBDU1Mgc2VsZWN0b3JcbiAgICAgPSAoRWxlbWVudCkgcmVzdWx0IG9mIHF1ZXJ5IHNlbGVjdGlvblxuICAgIFxcKi9cbiAgICBlbHByb3RvLnNlbGVjdCA9IGZ1bmN0aW9uIChxdWVyeSkge1xuICAgICAgICByZXR1cm4gd3JhcCh0aGlzLm5vZGUucXVlcnlTZWxlY3RvcihxdWVyeSkpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuc2VsZWN0QWxsXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBHYXRoZXJzIG5lc3RlZCBARWxlbWVudCBvYmplY3RzIG1hdGNoaW5nIHRoZSBnaXZlbiBzZXQgb2YgQ1NTIHNlbGVjdG9yc1xuICAgICAqKlxuICAgICAtIHF1ZXJ5IChzdHJpbmcpIENTUyBzZWxlY3RvclxuICAgICA9IChTZXR8YXJyYXkpIHJlc3VsdCBvZiBxdWVyeSBzZWxlY3Rpb25cbiAgICBcXCovXG4gICAgZWxwcm90by5zZWxlY3RBbGwgPSBmdW5jdGlvbiAocXVlcnkpIHtcbiAgICAgICAgdmFyIG5vZGVsaXN0ID0gdGhpcy5ub2RlLnF1ZXJ5U2VsZWN0b3JBbGwocXVlcnkpLFxuICAgICAgICAgICAgc2V0ID0gKFNuYXAuc2V0IHx8IEFycmF5KSgpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGVsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBzZXQucHVzaCh3cmFwKG5vZGVsaXN0W2ldKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNldDtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LmFzUFhcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybnMgZ2l2ZW4gYXR0cmlidXRlIG9mIHRoZSBlbGVtZW50IGFzIGEgYHB4YCB2YWx1ZSAobm90ICUsIGVtLCBldGMuKVxuICAgICAqKlxuICAgICAtIGF0dHIgKHN0cmluZykgYXR0cmlidXRlIG5hbWVcbiAgICAgLSB2YWx1ZSAoc3RyaW5nKSAjb3B0aW9uYWwgYXR0cmlidXRlIHZhbHVlXG4gICAgID0gKEVsZW1lbnQpIHJlc3VsdCBvZiBxdWVyeSBzZWxlY3Rpb25cbiAgICBcXCovXG4gICAgZWxwcm90by5hc1BYID0gZnVuY3Rpb24gKGF0dHIsIHZhbHVlKSB7XG4gICAgICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHRoaXMuYXR0cihhdHRyKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gK3VuaXQycHgodGhpcywgYXR0ciwgdmFsdWUpO1xuICAgIH07XG4gICAgLy8gU0lFUlJBIEVsZW1lbnQudXNlKCk6IEkgc3VnZ2VzdCBhZGRpbmcgYSBub3RlIGFib3V0IGhvdyB0byBhY2Nlc3MgdGhlIG9yaWdpbmFsIGVsZW1lbnQgdGhlIHJldHVybmVkIDx1c2U+IGluc3RhbnRpYXRlcy4gSXQncyBhIHBhcnQgb2YgU1ZHIHdpdGggd2hpY2ggb3JkaW5hcnkgd2ViIGRldmVsb3BlcnMgbWF5IGJlIGxlYXN0IGZhbWlsaWFyLlxuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnVzZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQ3JlYXRlcyBhIGA8dXNlPmAgZWxlbWVudCBsaW5rZWQgdG8gdGhlIGN1cnJlbnQgZWxlbWVudFxuICAgICAqKlxuICAgICA9IChFbGVtZW50KSB0aGUgYDx1c2U+YCBlbGVtZW50XG4gICAgXFwqL1xuICAgIGVscHJvdG8udXNlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdXNlLFxuICAgICAgICAgICAgaWQgPSB0aGlzLm5vZGUuaWQ7XG4gICAgICAgIGlmICghaWQpIHtcbiAgICAgICAgICAgIGlkID0gdGhpcy5pZDtcbiAgICAgICAgICAgICQodGhpcy5ub2RlLCB7XG4gICAgICAgICAgICAgICAgaWQ6IGlkXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy50eXBlID09IFwibGluZWFyR3JhZGllbnRcIiB8fCB0aGlzLnR5cGUgPT0gXCJyYWRpYWxHcmFkaWVudFwiIHx8XG4gICAgICAgICAgICB0aGlzLnR5cGUgPT0gXCJwYXR0ZXJuXCIpIHtcbiAgICAgICAgICAgIHVzZSA9IG1ha2UodGhpcy50eXBlLCB0aGlzLm5vZGUucGFyZW50Tm9kZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB1c2UgPSBtYWtlKFwidXNlXCIsIHRoaXMubm9kZS5wYXJlbnROb2RlKTtcbiAgICAgICAgfVxuICAgICAgICAkKHVzZS5ub2RlLCB7XG4gICAgICAgICAgICBcInhsaW5rOmhyZWZcIjogXCIjXCIgKyBpZFxuICAgICAgICB9KTtcbiAgICAgICAgdXNlLm9yaWdpbmFsID0gdGhpcztcbiAgICAgICAgcmV0dXJuIHVzZTtcbiAgICB9O1xuICAgIGZ1bmN0aW9uIGZpeGlkcyhlbCkge1xuICAgICAgICB2YXIgZWxzID0gZWwuc2VsZWN0QWxsKFwiKlwiKSxcbiAgICAgICAgICAgIGl0LFxuICAgICAgICAgICAgdXJsID0gL15cXHMqdXJsXFwoKFwifCd8KSguKilcXDFcXClcXHMqJC8sXG4gICAgICAgICAgICBpZHMgPSBbXSxcbiAgICAgICAgICAgIHVzZXMgPSB7fTtcbiAgICAgICAgZnVuY3Rpb24gdXJsdGVzdChpdCwgbmFtZSkge1xuICAgICAgICAgICAgdmFyIHZhbCA9ICQoaXQubm9kZSwgbmFtZSk7XG4gICAgICAgICAgICB2YWwgPSB2YWwgJiYgdmFsLm1hdGNoKHVybCk7XG4gICAgICAgICAgICB2YWwgPSB2YWwgJiYgdmFsWzJdO1xuICAgICAgICAgICAgaWYgKHZhbCAmJiB2YWwuY2hhckF0KCkgPT0gXCIjXCIpIHtcbiAgICAgICAgICAgICAgICB2YWwgPSB2YWwuc3Vic3RyaW5nKDEpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodmFsKSB7XG4gICAgICAgICAgICAgICAgdXNlc1t2YWxdID0gKHVzZXNbdmFsXSB8fCBbXSkuY29uY2F0KGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYXR0ciA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBhdHRyW25hbWVdID0gVVJMKGlkKTtcbiAgICAgICAgICAgICAgICAgICAgJChpdC5ub2RlLCBhdHRyKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBsaW5rdGVzdChpdCkge1xuICAgICAgICAgICAgdmFyIHZhbCA9ICQoaXQubm9kZSwgXCJ4bGluazpocmVmXCIpO1xuICAgICAgICAgICAgaWYgKHZhbCAmJiB2YWwuY2hhckF0KCkgPT0gXCIjXCIpIHtcbiAgICAgICAgICAgICAgICB2YWwgPSB2YWwuc3Vic3RyaW5nKDEpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodmFsKSB7XG4gICAgICAgICAgICAgICAgdXNlc1t2YWxdID0gKHVzZXNbdmFsXSB8fCBbXSkuY29uY2F0KGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgICAgICAgICBpdC5hdHRyKFwieGxpbms6aHJlZlwiLCBcIiNcIiArIGlkKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBlbHMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgaXQgPSBlbHNbaV07XG4gICAgICAgICAgICB1cmx0ZXN0KGl0LCBcImZpbGxcIik7XG4gICAgICAgICAgICB1cmx0ZXN0KGl0LCBcInN0cm9rZVwiKTtcbiAgICAgICAgICAgIHVybHRlc3QoaXQsIFwiZmlsdGVyXCIpO1xuICAgICAgICAgICAgdXJsdGVzdChpdCwgXCJtYXNrXCIpO1xuICAgICAgICAgICAgdXJsdGVzdChpdCwgXCJjbGlwLXBhdGhcIik7XG4gICAgICAgICAgICBsaW5rdGVzdChpdCk7XG4gICAgICAgICAgICB2YXIgb2xkaWQgPSAkKGl0Lm5vZGUsIFwiaWRcIik7XG4gICAgICAgICAgICBpZiAob2xkaWQpIHtcbiAgICAgICAgICAgICAgICAkKGl0Lm5vZGUsIHtpZDogaXQuaWR9KTtcbiAgICAgICAgICAgICAgICBpZHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIG9sZDogb2xkaWQsXG4gICAgICAgICAgICAgICAgICAgIGlkOiBpdC5pZFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAoaSA9IDAsIGlpID0gaWRzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBmcyA9IHVzZXNbaWRzW2ldLm9sZF07XG4gICAgICAgICAgICBpZiAoZnMpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMCwgamogPSBmcy5sZW5ndGg7IGogPCBqajsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGZzW2pdKGlkc1tpXS5pZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LmNsb25lXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBDcmVhdGVzIGEgY2xvbmUgb2YgdGhlIGVsZW1lbnQgYW5kIGluc2VydHMgaXQgYWZ0ZXIgdGhlIGVsZW1lbnRcbiAgICAgKipcbiAgICAgPSAoRWxlbWVudCkgdGhlIGNsb25lXG4gICAgXFwqL1xuICAgIGVscHJvdG8uY2xvbmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjbG9uZSA9IHdyYXAodGhpcy5ub2RlLmNsb25lTm9kZSh0cnVlKSk7XG4gICAgICAgIGlmICgkKGNsb25lLm5vZGUsIFwiaWRcIikpIHtcbiAgICAgICAgICAgICQoY2xvbmUubm9kZSwge2lkOiBjbG9uZS5pZH0pO1xuICAgICAgICB9XG4gICAgICAgIGZpeGlkcyhjbG9uZSk7XG4gICAgICAgIGNsb25lLmluc2VydEFmdGVyKHRoaXMpO1xuICAgICAgICByZXR1cm4gY2xvbmU7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC50b0RlZnNcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIE1vdmVzIGVsZW1lbnQgdG8gdGhlIHNoYXJlZCBgPGRlZnM+YCBhcmVhXG4gICAgICoqXG4gICAgID0gKEVsZW1lbnQpIHRoZSBlbGVtZW50XG4gICAgXFwqL1xuICAgIGVscHJvdG8udG9EZWZzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZGVmcyA9IGdldFNvbWVEZWZzKHRoaXMpO1xuICAgICAgICBkZWZzLmFwcGVuZENoaWxkKHRoaXMubm9kZSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudG9QYXR0ZXJuXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBDcmVhdGVzIGEgYDxwYXR0ZXJuPmAgZWxlbWVudCBmcm9tIHRoZSBjdXJyZW50IGVsZW1lbnRcbiAgICAgKipcbiAgICAgKiBUbyBjcmVhdGUgYSBwYXR0ZXJuIHlvdSBoYXZlIHRvIHNwZWNpZnkgdGhlIHBhdHRlcm4gcmVjdDpcbiAgICAgLSB4IChzdHJpbmd8bnVtYmVyKVxuICAgICAtIHkgKHN0cmluZ3xudW1iZXIpXG4gICAgIC0gd2lkdGggKHN0cmluZ3xudW1iZXIpXG4gICAgIC0gaGVpZ2h0IChzdHJpbmd8bnVtYmVyKVxuICAgICA9IChFbGVtZW50KSB0aGUgYDxwYXR0ZXJuPmAgZWxlbWVudFxuICAgICAqIFlvdSBjYW4gdXNlIHBhdHRlcm4gbGF0ZXIgb24gYXMgYW4gYXJndW1lbnQgZm9yIGBmaWxsYCBhdHRyaWJ1dGU6XG4gICAgIHwgdmFyIHAgPSBwYXBlci5wYXRoKFwiTTEwLTUtMTAsMTVNMTUsMCwwLDE1TTAtNS0yMCwxNVwiKS5hdHRyKHtcbiAgICAgfCAgICAgICAgIGZpbGw6IFwibm9uZVwiLFxuICAgICB8ICAgICAgICAgc3Ryb2tlOiBcIiNiYWRhNTVcIixcbiAgICAgfCAgICAgICAgIHN0cm9rZVdpZHRoOiA1XG4gICAgIHwgICAgIH0pLnBhdHRlcm4oMCwgMCwgMTAsIDEwKSxcbiAgICAgfCAgICAgYyA9IHBhcGVyLmNpcmNsZSgyMDAsIDIwMCwgMTAwKTtcbiAgICAgfCBjLmF0dHIoe1xuICAgICB8ICAgICBmaWxsOiBwXG4gICAgIHwgfSk7XG4gICAgXFwqL1xuICAgIGVscHJvdG8ucGF0dGVybiA9IGVscHJvdG8udG9QYXR0ZXJuID0gZnVuY3Rpb24gKHgsIHksIHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgICAgdmFyIHAgPSBtYWtlKFwicGF0dGVyblwiLCBnZXRTb21lRGVmcyh0aGlzKSk7XG4gICAgICAgIGlmICh4ID09IG51bGwpIHtcbiAgICAgICAgICAgIHggPSB0aGlzLmdldEJCb3goKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXMoeCwgXCJvYmplY3RcIikgJiYgXCJ4XCIgaW4geCkge1xuICAgICAgICAgICAgeSA9IHgueTtcbiAgICAgICAgICAgIHdpZHRoID0geC53aWR0aDtcbiAgICAgICAgICAgIGhlaWdodCA9IHguaGVpZ2h0O1xuICAgICAgICAgICAgeCA9IHgueDtcbiAgICAgICAgfVxuICAgICAgICAkKHAubm9kZSwge1xuICAgICAgICAgICAgeDogeCxcbiAgICAgICAgICAgIHk6IHksXG4gICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCxcbiAgICAgICAgICAgIHBhdHRlcm5Vbml0czogXCJ1c2VyU3BhY2VPblVzZVwiLFxuICAgICAgICAgICAgaWQ6IHAuaWQsXG4gICAgICAgICAgICB2aWV3Qm94OiBbeCwgeSwgd2lkdGgsIGhlaWdodF0uam9pbihcIiBcIilcbiAgICAgICAgfSk7XG4gICAgICAgIHAubm9kZS5hcHBlbmRDaGlsZCh0aGlzLm5vZGUpO1xuICAgICAgICByZXR1cm4gcDtcbiAgICB9O1xuLy8gU0lFUlJBIEVsZW1lbnQubWFya2VyKCk6IGNsYXJpZnkgd2hhdCBhIHJlZmVyZW5jZSBwb2ludCBpcy4gRS5nLiwgaGVscHMgeW91IG9mZnNldCB0aGUgb2JqZWN0IGZyb20gaXRzIGVkZ2Ugc3VjaCBhcyB3aGVuIGNlbnRlcmluZyBpdCBvdmVyIGEgcGF0aC5cbi8vIFNJRVJSQSBFbGVtZW50Lm1hcmtlcigpOiBJIHN1Z2dlc3QgdGhlIG1ldGhvZCBzaG91bGQgYWNjZXB0IGRlZmF1bHQgcmVmZXJlbmNlIHBvaW50IHZhbHVlcy4gIFBlcmhhcHMgY2VudGVyZWQgd2l0aCAocmVmWCA9IHdpZHRoLzIpIGFuZCAocmVmWSA9IGhlaWdodC8yKT8gQWxzbywgY291bGRuJ3QgaXQgYXNzdW1lIHRoZSBlbGVtZW50J3MgY3VycmVudCBfd2lkdGhfIGFuZCBfaGVpZ2h0Xz8gQW5kIHBsZWFzZSBzcGVjaWZ5IHdoYXQgX3hfIGFuZCBfeV8gbWVhbjogb2Zmc2V0cz8gSWYgc28sIGZyb20gd2hlcmU/ICBDb3VsZG4ndCB0aGV5IGFsc28gYmUgYXNzaWduZWQgZGVmYXVsdCB2YWx1ZXM/XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQubWFya2VyXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBDcmVhdGVzIGEgYDxtYXJrZXI+YCBlbGVtZW50IGZyb20gdGhlIGN1cnJlbnQgZWxlbWVudFxuICAgICAqKlxuICAgICAqIFRvIGNyZWF0ZSBhIG1hcmtlciB5b3UgaGF2ZSB0byBzcGVjaWZ5IHRoZSBib3VuZGluZyByZWN0IGFuZCByZWZlcmVuY2UgcG9pbnQ6XG4gICAgIC0geCAobnVtYmVyKVxuICAgICAtIHkgKG51bWJlcilcbiAgICAgLSB3aWR0aCAobnVtYmVyKVxuICAgICAtIGhlaWdodCAobnVtYmVyKVxuICAgICAtIHJlZlggKG51bWJlcilcbiAgICAgLSByZWZZIChudW1iZXIpXG4gICAgID0gKEVsZW1lbnQpIHRoZSBgPG1hcmtlcj5gIGVsZW1lbnRcbiAgICAgKiBZb3UgY2FuIHNwZWNpZnkgdGhlIG1hcmtlciBsYXRlciBhcyBhbiBhcmd1bWVudCBmb3IgYG1hcmtlci1zdGFydGAsIGBtYXJrZXItZW5kYCwgYG1hcmtlci1taWRgLCBhbmQgYG1hcmtlcmAgYXR0cmlidXRlcy4gVGhlIGBtYXJrZXJgIGF0dHJpYnV0ZSBwbGFjZXMgdGhlIG1hcmtlciBhdCBldmVyeSBwb2ludCBhbG9uZyB0aGUgcGF0aCwgYW5kIGBtYXJrZXItbWlkYCBwbGFjZXMgdGhlbSBhdCBldmVyeSBwb2ludCBleGNlcHQgdGhlIHN0YXJ0IGFuZCBlbmQuXG4gICAgXFwqL1xuICAgIC8vIFRPRE8gYWRkIHVzYWdlIGZvciBtYXJrZXJzXG4gICAgZWxwcm90by5tYXJrZXIgPSBmdW5jdGlvbiAoeCwgeSwgd2lkdGgsIGhlaWdodCwgcmVmWCwgcmVmWSkge1xuICAgICAgICB2YXIgcCA9IG1ha2UoXCJtYXJrZXJcIiwgZ2V0U29tZURlZnModGhpcykpO1xuICAgICAgICBpZiAoeCA9PSBudWxsKSB7XG4gICAgICAgICAgICB4ID0gdGhpcy5nZXRCQm94KCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzKHgsIFwib2JqZWN0XCIpICYmIFwieFwiIGluIHgpIHtcbiAgICAgICAgICAgIHkgPSB4Lnk7XG4gICAgICAgICAgICB3aWR0aCA9IHgud2lkdGg7XG4gICAgICAgICAgICBoZWlnaHQgPSB4LmhlaWdodDtcbiAgICAgICAgICAgIHJlZlggPSB4LnJlZlggfHwgeC5jeDtcbiAgICAgICAgICAgIHJlZlkgPSB4LnJlZlkgfHwgeC5jeTtcbiAgICAgICAgICAgIHggPSB4Lng7XG4gICAgICAgIH1cbiAgICAgICAgJChwLm5vZGUsIHtcbiAgICAgICAgICAgIHZpZXdCb3g6IFt4LCB5LCB3aWR0aCwgaGVpZ2h0XS5qb2luKFwiIFwiKSxcbiAgICAgICAgICAgIG1hcmtlcldpZHRoOiB3aWR0aCxcbiAgICAgICAgICAgIG1hcmtlckhlaWdodDogaGVpZ2h0LFxuICAgICAgICAgICAgb3JpZW50OiBcImF1dG9cIixcbiAgICAgICAgICAgIHJlZlg6IHJlZlggfHwgMCxcbiAgICAgICAgICAgIHJlZlk6IHJlZlkgfHwgMCxcbiAgICAgICAgICAgIGlkOiBwLmlkXG4gICAgICAgIH0pO1xuICAgICAgICBwLm5vZGUuYXBwZW5kQ2hpbGQodGhpcy5ub2RlKTtcbiAgICAgICAgcmV0dXJuIHA7XG4gICAgfTtcbiAgICAvLyBhbmltYXRpb25cbiAgICBmdW5jdGlvbiBzbGljZShmcm9tLCB0bywgZikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGFycikge1xuICAgICAgICAgICAgdmFyIHJlcyA9IGFyci5zbGljZShmcm9tLCB0byk7XG4gICAgICAgICAgICBpZiAocmVzLmxlbmd0aCA9PSAxKSB7XG4gICAgICAgICAgICAgICAgcmVzID0gcmVzWzBdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGYgPyBmKHJlcykgOiByZXM7XG4gICAgICAgIH07XG4gICAgfVxuICAgIHZhciBBbmltYXRpb24gPSBmdW5jdGlvbiAoYXR0ciwgbXMsIGVhc2luZywgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBlYXNpbmcgPT0gXCJmdW5jdGlvblwiICYmICFlYXNpbmcubGVuZ3RoKSB7XG4gICAgICAgICAgICBjYWxsYmFjayA9IGVhc2luZztcbiAgICAgICAgICAgIGVhc2luZyA9IG1pbmEubGluZWFyO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYXR0ciA9IGF0dHI7XG4gICAgICAgIHRoaXMuZHVyID0gbXM7XG4gICAgICAgIGVhc2luZyAmJiAodGhpcy5lYXNpbmcgPSBlYXNpbmcpO1xuICAgICAgICBjYWxsYmFjayAmJiAodGhpcy5jYWxsYmFjayA9IGNhbGxiYWNrKTtcbiAgICB9O1xuICAgIFNuYXAuXy5BbmltYXRpb24gPSBBbmltYXRpb247XG4gICAgLypcXFxuICAgICAqIFNuYXAuYW5pbWF0aW9uXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBDcmVhdGVzIGFuIGFuaW1hdGlvbiBvYmplY3RcbiAgICAgKipcbiAgICAgLSBhdHRyIChvYmplY3QpIGF0dHJpYnV0ZXMgb2YgZmluYWwgZGVzdGluYXRpb25cbiAgICAgLSBkdXJhdGlvbiAobnVtYmVyKSBkdXJhdGlvbiBvZiB0aGUgYW5pbWF0aW9uLCBpbiBtaWxsaXNlY29uZHNcbiAgICAgLSBlYXNpbmcgKGZ1bmN0aW9uKSAjb3B0aW9uYWwgb25lIG9mIGVhc2luZyBmdW5jdGlvbnMgb2YgQG1pbmEgb3IgY3VzdG9tIG9uZVxuICAgICAtIGNhbGxiYWNrIChmdW5jdGlvbikgI29wdGlvbmFsIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgZmlyZXMgd2hlbiBhbmltYXRpb24gZW5kc1xuICAgICA9IChvYmplY3QpIGFuaW1hdGlvbiBvYmplY3RcbiAgICBcXCovXG4gICAgU25hcC5hbmltYXRpb24gPSBmdW5jdGlvbiAoYXR0ciwgbXMsIGVhc2luZywgY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIG5ldyBBbmltYXRpb24oYXR0ciwgbXMsIGVhc2luZywgY2FsbGJhY2spO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuaW5BbmltXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIGEgc2V0IG9mIGFuaW1hdGlvbnMgdGhhdCBtYXkgYmUgYWJsZSB0byBtYW5pcHVsYXRlIHRoZSBjdXJyZW50IGVsZW1lbnRcbiAgICAgKipcbiAgICAgPSAob2JqZWN0KSBpbiBmb3JtYXQ6XG4gICAgIG8ge1xuICAgICBvICAgICBhbmltIChvYmplY3QpIGFuaW1hdGlvbiBvYmplY3QsXG4gICAgIG8gICAgIG1pbmEgKG9iamVjdCkgQG1pbmEgb2JqZWN0LFxuICAgICBvICAgICBjdXJTdGF0dXMgKG51bWJlcikgMC4uMSDigJQgc3RhdHVzIG9mIHRoZSBhbmltYXRpb246IDAg4oCUIGp1c3Qgc3RhcnRlZCwgMSDigJQganVzdCBmaW5pc2hlZCxcbiAgICAgbyAgICAgc3RhdHVzIChmdW5jdGlvbikgZ2V0cyBvciBzZXRzIHRoZSBzdGF0dXMgb2YgdGhlIGFuaW1hdGlvbixcbiAgICAgbyAgICAgc3RvcCAoZnVuY3Rpb24pIHN0b3BzIHRoZSBhbmltYXRpb25cbiAgICAgbyB9XG4gICAgXFwqL1xuICAgIGVscHJvdG8uaW5BbmltID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZWwgPSB0aGlzLFxuICAgICAgICAgICAgcmVzID0gW107XG4gICAgICAgIGZvciAodmFyIGlkIGluIGVsLmFuaW1zKSBpZiAoZWwuYW5pbXNbaGFzXShpZCkpIHtcbiAgICAgICAgICAgIChmdW5jdGlvbiAoYSkge1xuICAgICAgICAgICAgICAgIHJlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgYW5pbTogbmV3IEFuaW1hdGlvbihhLl9hdHRycywgYS5kdXIsIGEuZWFzaW5nLCBhLl9jYWxsYmFjayksXG4gICAgICAgICAgICAgICAgICAgIG1pbmE6IGEsXG4gICAgICAgICAgICAgICAgICAgIGN1clN0YXR1czogYS5zdGF0dXMoKSxcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYS5zdGF0dXModmFsKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgc3RvcDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYS5zdG9wKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0oZWwuYW5pbXNbaWRdKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBTbmFwLmFuaW1hdGVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJ1bnMgZ2VuZXJpYyBhbmltYXRpb24gb2Ygb25lIG51bWJlciBpbnRvIGFub3RoZXIgd2l0aCBhIGNhcmluZyBmdW5jdGlvblxuICAgICAqKlxuICAgICAtIGZyb20gKG51bWJlcnxhcnJheSkgbnVtYmVyIG9yIGFycmF5IG9mIG51bWJlcnNcbiAgICAgLSB0byAobnVtYmVyfGFycmF5KSBudW1iZXIgb3IgYXJyYXkgb2YgbnVtYmVyc1xuICAgICAtIHNldHRlciAoZnVuY3Rpb24pIGNhcmluZyBmdW5jdGlvbiB0aGF0IGFjY2VwdHMgb25lIG51bWJlciBhcmd1bWVudFxuICAgICAtIGR1cmF0aW9uIChudW1iZXIpIGR1cmF0aW9uLCBpbiBtaWxsaXNlY29uZHNcbiAgICAgLSBlYXNpbmcgKGZ1bmN0aW9uKSAjb3B0aW9uYWwgZWFzaW5nIGZ1bmN0aW9uIGZyb20gQG1pbmEgb3IgY3VzdG9tXG4gICAgIC0gY2FsbGJhY2sgKGZ1bmN0aW9uKSAjb3B0aW9uYWwgY2FsbGJhY2sgZnVuY3Rpb24gdG8gZXhlY3V0ZSB3aGVuIGFuaW1hdGlvbiBlbmRzXG4gICAgID0gKG9iamVjdCkgYW5pbWF0aW9uIG9iamVjdCBpbiBAbWluYSBmb3JtYXRcbiAgICAgbyB7XG4gICAgIG8gICAgIGlkIChzdHJpbmcpIGFuaW1hdGlvbiBpZCwgY29uc2lkZXIgaXQgcmVhZC1vbmx5LFxuICAgICBvICAgICBkdXJhdGlvbiAoZnVuY3Rpb24pIGdldHMgb3Igc2V0cyB0aGUgZHVyYXRpb24gb2YgdGhlIGFuaW1hdGlvbixcbiAgICAgbyAgICAgZWFzaW5nIChmdW5jdGlvbikgZWFzaW5nLFxuICAgICBvICAgICBzcGVlZCAoZnVuY3Rpb24pIGdldHMgb3Igc2V0cyB0aGUgc3BlZWQgb2YgdGhlIGFuaW1hdGlvbixcbiAgICAgbyAgICAgc3RhdHVzIChmdW5jdGlvbikgZ2V0cyBvciBzZXRzIHRoZSBzdGF0dXMgb2YgdGhlIGFuaW1hdGlvbixcbiAgICAgbyAgICAgc3RvcCAoZnVuY3Rpb24pIHN0b3BzIHRoZSBhbmltYXRpb25cbiAgICAgbyB9XG4gICAgIHwgdmFyIHJlY3QgPSBTbmFwKCkucmVjdCgwLCAwLCAxMCwgMTApO1xuICAgICB8IFNuYXAuYW5pbWF0ZSgwLCAxMCwgZnVuY3Rpb24gKHZhbCkge1xuICAgICB8ICAgICByZWN0LmF0dHIoe1xuICAgICB8ICAgICAgICAgeDogdmFsXG4gICAgIHwgICAgIH0pO1xuICAgICB8IH0sIDEwMDApO1xuICAgICB8IC8vIGluIGdpdmVuIGNvbnRleHQgaXMgZXF1aXZhbGVudCB0b1xuICAgICB8IHJlY3QuYW5pbWF0ZSh7eDogMTB9LCAxMDAwKTtcbiAgICBcXCovXG4gICAgU25hcC5hbmltYXRlID0gZnVuY3Rpb24gKGZyb20sIHRvLCBzZXR0ZXIsIG1zLCBlYXNpbmcsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZWFzaW5nID09IFwiZnVuY3Rpb25cIiAmJiAhZWFzaW5nLmxlbmd0aCkge1xuICAgICAgICAgICAgY2FsbGJhY2sgPSBlYXNpbmc7XG4gICAgICAgICAgICBlYXNpbmcgPSBtaW5hLmxpbmVhcjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbm93ID0gbWluYS50aW1lKCksXG4gICAgICAgICAgICBhbmltID0gbWluYShmcm9tLCB0bywgbm93LCBub3cgKyBtcywgbWluYS50aW1lLCBzZXR0ZXIsIGVhc2luZyk7XG4gICAgICAgIGNhbGxiYWNrICYmIGV2ZS5vbmNlKFwibWluYS5maW5pc2guXCIgKyBhbmltLmlkLCBjYWxsYmFjayk7XG4gICAgICAgIHJldHVybiBhbmltO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuc3RvcFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogU3RvcHMgYWxsIHRoZSBhbmltYXRpb25zIGZvciB0aGUgY3VycmVudCBlbGVtZW50XG4gICAgICoqXG4gICAgID0gKEVsZW1lbnQpIHRoZSBjdXJyZW50IGVsZW1lbnRcbiAgICBcXCovXG4gICAgZWxwcm90by5zdG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYW5pbXMgPSB0aGlzLmluQW5pbSgpO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBhbmltcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICBhbmltc1tpXS5zdG9wKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5hbmltYXRlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBBbmltYXRlcyB0aGUgZ2l2ZW4gYXR0cmlidXRlcyBvZiB0aGUgZWxlbWVudFxuICAgICAqKlxuICAgICAtIGF0dHJzIChvYmplY3QpIGtleS12YWx1ZSBwYWlycyBvZiBkZXN0aW5hdGlvbiBhdHRyaWJ1dGVzXG4gICAgIC0gZHVyYXRpb24gKG51bWJlcikgZHVyYXRpb24gb2YgdGhlIGFuaW1hdGlvbiBpbiBtaWxsaXNlY29uZHNcbiAgICAgLSBlYXNpbmcgKGZ1bmN0aW9uKSAjb3B0aW9uYWwgZWFzaW5nIGZ1bmN0aW9uIGZyb20gQG1pbmEgb3IgY3VzdG9tXG4gICAgIC0gY2FsbGJhY2sgKGZ1bmN0aW9uKSAjb3B0aW9uYWwgY2FsbGJhY2sgZnVuY3Rpb24gdGhhdCBleGVjdXRlcyB3aGVuIHRoZSBhbmltYXRpb24gZW5kc1xuICAgICA9IChFbGVtZW50KSB0aGUgY3VycmVudCBlbGVtZW50XG4gICAgXFwqL1xuICAgIGVscHJvdG8uYW5pbWF0ZSA9IGZ1bmN0aW9uIChhdHRycywgbXMsIGVhc2luZywgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBlYXNpbmcgPT0gXCJmdW5jdGlvblwiICYmICFlYXNpbmcubGVuZ3RoKSB7XG4gICAgICAgICAgICBjYWxsYmFjayA9IGVhc2luZztcbiAgICAgICAgICAgIGVhc2luZyA9IG1pbmEubGluZWFyO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhdHRycyBpbnN0YW5jZW9mIEFuaW1hdGlvbikge1xuICAgICAgICAgICAgY2FsbGJhY2sgPSBhdHRycy5jYWxsYmFjaztcbiAgICAgICAgICAgIGVhc2luZyA9IGF0dHJzLmVhc2luZztcbiAgICAgICAgICAgIG1zID0gYXR0cnMuZHVyO1xuICAgICAgICAgICAgYXR0cnMgPSBhdHRycy5hdHRyO1xuICAgICAgICB9XG4gICAgICAgIHZhciBma2V5cyA9IFtdLCB0a2V5cyA9IFtdLCBrZXlzID0ge30sIGZyb20sIHRvLCBmLCBlcSxcbiAgICAgICAgICAgIGVsID0gdGhpcztcbiAgICAgICAgZm9yICh2YXIga2V5IGluIGF0dHJzKSBpZiAoYXR0cnNbaGFzXShrZXkpKSB7XG4gICAgICAgICAgICBpZiAoZWwuZXF1YWwpIHtcbiAgICAgICAgICAgICAgICBlcSA9IGVsLmVxdWFsKGtleSwgU3RyKGF0dHJzW2tleV0pKTtcbiAgICAgICAgICAgICAgICBmcm9tID0gZXEuZnJvbTtcbiAgICAgICAgICAgICAgICB0byA9IGVxLnRvO1xuICAgICAgICAgICAgICAgIGYgPSBlcS5mO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmcm9tID0gK2VsLmF0dHIoa2V5KTtcbiAgICAgICAgICAgICAgICB0byA9ICthdHRyc1trZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGxlbiA9IGlzKGZyb20sIFwiYXJyYXlcIikgPyBmcm9tLmxlbmd0aCA6IDE7XG4gICAgICAgICAgICBrZXlzW2tleV0gPSBzbGljZShma2V5cy5sZW5ndGgsIGZrZXlzLmxlbmd0aCArIGxlbiwgZik7XG4gICAgICAgICAgICBma2V5cyA9IGZrZXlzLmNvbmNhdChmcm9tKTtcbiAgICAgICAgICAgIHRrZXlzID0gdGtleXMuY29uY2F0KHRvKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbm93ID0gbWluYS50aW1lKCksXG4gICAgICAgICAgICBhbmltID0gbWluYShma2V5cywgdGtleXMsIG5vdywgbm93ICsgbXMsIG1pbmEudGltZSwgZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgICAgICAgIHZhciBhdHRyID0ge307XG4gICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIGtleXMpIGlmIChrZXlzW2hhc10oa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICBhdHRyW2tleV0gPSBrZXlzW2tleV0odmFsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWwuYXR0cihhdHRyKTtcbiAgICAgICAgICAgIH0sIGVhc2luZyk7XG4gICAgICAgIGVsLmFuaW1zW2FuaW0uaWRdID0gYW5pbTtcbiAgICAgICAgYW5pbS5fYXR0cnMgPSBhdHRycztcbiAgICAgICAgYW5pbS5fY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICAgICAgZXZlKFwic25hcC5hbmltY3JlYXRlZC5cIiArIGVsLmlkLCBhbmltKTtcbiAgICAgICAgZXZlLm9uY2UoXCJtaW5hLmZpbmlzaC5cIiArIGFuaW0uaWQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGRlbGV0ZSBlbC5hbmltc1thbmltLmlkXTtcbiAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrLmNhbGwoZWwpO1xuICAgICAgICB9KTtcbiAgICAgICAgZXZlLm9uY2UoXCJtaW5hLnN0b3AuXCIgKyBhbmltLmlkLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBkZWxldGUgZWwuYW5pbXNbYW5pbS5pZF07XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZWw7XG4gICAgfTtcbiAgICB2YXIgZWxkYXRhID0ge307XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuZGF0YVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQWRkcyBvciByZXRyaWV2ZXMgZ2l2ZW4gdmFsdWUgYXNzb2NpYXRlZCB3aXRoIGdpdmVuIGtleS4gKERvbuKAmXQgY29uZnVzZVxuICAgICAqIHdpdGggYGRhdGEtYCBhdHRyaWJ1dGVzKVxuICAgICAqXG4gICAgICogU2VlIGFsc28gQEVsZW1lbnQucmVtb3ZlRGF0YVxuICAgICAtIGtleSAoc3RyaW5nKSBrZXkgdG8gc3RvcmUgZGF0YVxuICAgICAtIHZhbHVlIChhbnkpICNvcHRpb25hbCB2YWx1ZSB0byBzdG9yZVxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgICogb3IsIGlmIHZhbHVlIGlzIG5vdCBzcGVjaWZpZWQ6XG4gICAgID0gKGFueSkgdmFsdWVcbiAgICAgPiBVc2FnZVxuICAgICB8IGZvciAodmFyIGkgPSAwLCBpIDwgNSwgaSsrKSB7XG4gICAgIHwgICAgIHBhcGVyLmNpcmNsZSgxMCArIDE1ICogaSwgMTAsIDEwKVxuICAgICB8ICAgICAgICAgIC5hdHRyKHtmaWxsOiBcIiMwMDBcIn0pXG4gICAgIHwgICAgICAgICAgLmRhdGEoXCJpXCIsIGkpXG4gICAgIHwgICAgICAgICAgLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgfCAgICAgICAgICAgICBhbGVydCh0aGlzLmRhdGEoXCJpXCIpKTtcbiAgICAgfCAgICAgICAgICB9KTtcbiAgICAgfCB9XG4gICAgXFwqL1xuICAgIGVscHJvdG8uZGF0YSA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgIHZhciBkYXRhID0gZWxkYXRhW3RoaXMuaWRdID0gZWxkYXRhW3RoaXMuaWRdIHx8IHt9O1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAwKXtcbiAgICAgICAgICAgIGV2ZShcInNuYXAuZGF0YS5nZXQuXCIgKyB0aGlzLmlkLCB0aGlzLCBkYXRhLCBudWxsKTtcbiAgICAgICAgICAgIHJldHVybiBkYXRhO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09IDEpIHtcbiAgICAgICAgICAgIGlmIChTbmFwLmlzKGtleSwgXCJvYmplY3RcIikpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpIGluIGtleSkgaWYgKGtleVtoYXNdKGkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGF0YShpLCBrZXlbaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGV2ZShcInNuYXAuZGF0YS5nZXQuXCIgKyB0aGlzLmlkLCB0aGlzLCBkYXRhW2tleV0sIGtleSk7XG4gICAgICAgICAgICByZXR1cm4gZGF0YVtrZXldO1xuICAgICAgICB9XG4gICAgICAgIGRhdGFba2V5XSA9IHZhbHVlO1xuICAgICAgICBldmUoXCJzbmFwLmRhdGEuc2V0LlwiICsgdGhpcy5pZCwgdGhpcywgdmFsdWUsIGtleSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQucmVtb3ZlRGF0YVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyB2YWx1ZSBhc3NvY2lhdGVkIHdpdGggYW4gZWxlbWVudCBieSBnaXZlbiBrZXkuXG4gICAgICogSWYga2V5IGlzIG5vdCBwcm92aWRlZCwgcmVtb3ZlcyBhbGwgdGhlIGRhdGEgb2YgdGhlIGVsZW1lbnQuXG4gICAgIC0ga2V5IChzdHJpbmcpICNvcHRpb25hbCBrZXlcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICBlbHByb3RvLnJlbW92ZURhdGEgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIGlmIChrZXkgPT0gbnVsbCkge1xuICAgICAgICAgICAgZWxkYXRhW3RoaXMuaWRdID0ge307XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlbGRhdGFbdGhpcy5pZF0gJiYgZGVsZXRlIGVsZGF0YVt0aGlzLmlkXVtrZXldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQub3V0ZXJTVkdcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybnMgU1ZHIGNvZGUgZm9yIHRoZSBlbGVtZW50LCBlcXVpdmFsZW50IHRvIEhUTUwncyBgb3V0ZXJIVE1MYC5cbiAgICAgKlxuICAgICAqIFNlZSBhbHNvIEBFbGVtZW50LmlubmVyU1ZHXG4gICAgID0gKHN0cmluZykgU1ZHIGNvZGUgZm9yIHRoZSBlbGVtZW50XG4gICAgXFwqL1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnRvU3RyaW5nXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBTZWUgQEVsZW1lbnQub3V0ZXJTVkdcbiAgICBcXCovXG4gICAgZWxwcm90by5vdXRlclNWRyA9IGVscHJvdG8udG9TdHJpbmcgPSB0b1N0cmluZygxKTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5pbm5lclNWR1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJucyBTVkcgY29kZSBmb3IgdGhlIGVsZW1lbnQncyBjb250ZW50cywgZXF1aXZhbGVudCB0byBIVE1MJ3MgYGlubmVySFRNTGBcbiAgICAgPSAoc3RyaW5nKSBTVkcgY29kZSBmb3IgdGhlIGVsZW1lbnRcbiAgICBcXCovXG4gICAgZWxwcm90by5pbm5lclNWRyA9IHRvU3RyaW5nKCk7XG4gICAgZnVuY3Rpb24gdG9TdHJpbmcodHlwZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHJlcyA9IHR5cGUgPyBcIjxcIiArIHRoaXMudHlwZSA6IFwiXCIsXG4gICAgICAgICAgICAgICAgYXR0ciA9IHRoaXMubm9kZS5hdHRyaWJ1dGVzLFxuICAgICAgICAgICAgICAgIGNobGQgPSB0aGlzLm5vZGUuY2hpbGROb2RlcztcbiAgICAgICAgICAgIGlmICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gYXR0ci5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcyArPSBcIiBcIiArIGF0dHJbaV0ubmFtZSArICc9XCInICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRyW2ldLnZhbHVlLnJlcGxhY2UoL1wiL2csICdcXFxcXCInKSArICdcIic7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNobGQubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdHlwZSAmJiAocmVzICs9IFwiPlwiKTtcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwLCBpaSA9IGNobGQubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2hsZFtpXS5ub2RlVHlwZSA9PSAzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXMgKz0gY2hsZFtpXS5ub2RlVmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY2hsZFtpXS5ub2RlVHlwZSA9PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXMgKz0gd3JhcChjaGxkW2ldKS50b1N0cmluZygpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHR5cGUgJiYgKHJlcyArPSBcIjwvXCIgKyB0aGlzLnR5cGUgKyBcIj5cIik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHR5cGUgJiYgKHJlcyArPSBcIi8+XCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZWxwcm90by50b0RhdGFVUkwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh3aW5kb3cgJiYgd2luZG93LmJ0b2EpIHtcbiAgICAgICAgICAgIHZhciBiYiA9IHRoaXMuZ2V0QkJveCgpLFxuICAgICAgICAgICAgICAgIHN2ZyA9IFNuYXAuZm9ybWF0KCc8c3ZnIHZlcnNpb249XCIxLjFcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgeG1sbnM6eGxpbms9XCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rXCIgd2lkdGg9XCJ7d2lkdGh9XCIgaGVpZ2h0PVwie2hlaWdodH1cIiB2aWV3Qm94PVwie3h9IHt5fSB7d2lkdGh9IHtoZWlnaHR9XCI+e2NvbnRlbnRzfTwvc3ZnPicsIHtcbiAgICAgICAgICAgICAgICB4OiArYmIueC50b0ZpeGVkKDMpLFxuICAgICAgICAgICAgICAgIHk6ICtiYi55LnRvRml4ZWQoMyksXG4gICAgICAgICAgICAgICAgd2lkdGg6ICtiYi53aWR0aC50b0ZpeGVkKDMpLFxuICAgICAgICAgICAgICAgIGhlaWdodDogK2JiLmhlaWdodC50b0ZpeGVkKDMpLFxuICAgICAgICAgICAgICAgIGNvbnRlbnRzOiB0aGlzLm91dGVyU1ZHKClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIFwiZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxcIiArIGJ0b2EodW5lc2NhcGUoZW5jb2RlVVJJQ29tcG9uZW50KHN2ZykpKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLypcXFxuICAgICAqIEZyYWdtZW50LnNlbGVjdFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogU2VlIEBFbGVtZW50LnNlbGVjdFxuICAgIFxcKi9cbiAgICBGcmFnbWVudC5wcm90b3R5cGUuc2VsZWN0ID0gZWxwcm90by5zZWxlY3Q7XG4gICAgLypcXFxuICAgICAqIEZyYWdtZW50LnNlbGVjdEFsbFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogU2VlIEBFbGVtZW50LnNlbGVjdEFsbFxuICAgIFxcKi9cbiAgICBGcmFnbWVudC5wcm90b3R5cGUuc2VsZWN0QWxsID0gZWxwcm90by5zZWxlY3RBbGw7XG59KTtcblxuLy8gQ29weXJpZ2h0IChjKSAyMDEzIEFkb2JlIFN5c3RlbXMgSW5jb3Jwb3JhdGVkLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vLyBcbi8vIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy8gXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuU25hcC5wbHVnaW4oZnVuY3Rpb24gKFNuYXAsIEVsZW1lbnQsIFBhcGVyLCBnbG9iLCBGcmFnbWVudCkge1xuICAgIHZhciBvYmplY3RUb1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcsXG4gICAgICAgIFN0ciA9IFN0cmluZyxcbiAgICAgICAgbWF0aCA9IE1hdGgsXG4gICAgICAgIEUgPSBcIlwiO1xuICAgIGZ1bmN0aW9uIE1hdHJpeChhLCBiLCBjLCBkLCBlLCBmKSB7XG4gICAgICAgIGlmIChiID09IG51bGwgJiYgb2JqZWN0VG9TdHJpbmcuY2FsbChhKSA9PSBcIltvYmplY3QgU1ZHTWF0cml4XVwiKSB7XG4gICAgICAgICAgICB0aGlzLmEgPSBhLmE7XG4gICAgICAgICAgICB0aGlzLmIgPSBhLmI7XG4gICAgICAgICAgICB0aGlzLmMgPSBhLmM7XG4gICAgICAgICAgICB0aGlzLmQgPSBhLmQ7XG4gICAgICAgICAgICB0aGlzLmUgPSBhLmU7XG4gICAgICAgICAgICB0aGlzLmYgPSBhLmY7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGEgIT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5hID0gK2E7XG4gICAgICAgICAgICB0aGlzLmIgPSArYjtcbiAgICAgICAgICAgIHRoaXMuYyA9ICtjO1xuICAgICAgICAgICAgdGhpcy5kID0gK2Q7XG4gICAgICAgICAgICB0aGlzLmUgPSArZTtcbiAgICAgICAgICAgIHRoaXMuZiA9ICtmO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5hID0gMTtcbiAgICAgICAgICAgIHRoaXMuYiA9IDA7XG4gICAgICAgICAgICB0aGlzLmMgPSAwO1xuICAgICAgICAgICAgdGhpcy5kID0gMTtcbiAgICAgICAgICAgIHRoaXMuZSA9IDA7XG4gICAgICAgICAgICB0aGlzLmYgPSAwO1xuICAgICAgICB9XG4gICAgfVxuICAgIChmdW5jdGlvbiAobWF0cml4cHJvdG8pIHtcbiAgICAgICAgLypcXFxuICAgICAgICAgKiBNYXRyaXguYWRkXG4gICAgICAgICBbIG1ldGhvZCBdXG4gICAgICAgICAqKlxuICAgICAgICAgKiBBZGRzIHRoZSBnaXZlbiBtYXRyaXggdG8gZXhpc3Rpbmcgb25lXG4gICAgICAgICAtIGEgKG51bWJlcilcbiAgICAgICAgIC0gYiAobnVtYmVyKVxuICAgICAgICAgLSBjIChudW1iZXIpXG4gICAgICAgICAtIGQgKG51bWJlcilcbiAgICAgICAgIC0gZSAobnVtYmVyKVxuICAgICAgICAgLSBmIChudW1iZXIpXG4gICAgICAgICAqIG9yXG4gICAgICAgICAtIG1hdHJpeCAob2JqZWN0KSBATWF0cml4XG4gICAgICAgIFxcKi9cbiAgICAgICAgbWF0cml4cHJvdG8uYWRkID0gZnVuY3Rpb24gKGEsIGIsIGMsIGQsIGUsIGYpIHtcbiAgICAgICAgICAgIHZhciBvdXQgPSBbW10sIFtdLCBbXV0sXG4gICAgICAgICAgICAgICAgbSA9IFtbdGhpcy5hLCB0aGlzLmMsIHRoaXMuZV0sIFt0aGlzLmIsIHRoaXMuZCwgdGhpcy5mXSwgWzAsIDAsIDFdXSxcbiAgICAgICAgICAgICAgICBtYXRyaXggPSBbW2EsIGMsIGVdLCBbYiwgZCwgZl0sIFswLCAwLCAxXV0sXG4gICAgICAgICAgICAgICAgeCwgeSwgeiwgcmVzO1xuXG4gICAgICAgICAgICBpZiAoYSAmJiBhIGluc3RhbmNlb2YgTWF0cml4KSB7XG4gICAgICAgICAgICAgICAgbWF0cml4ID0gW1thLmEsIGEuYywgYS5lXSwgW2EuYiwgYS5kLCBhLmZdLCBbMCwgMCwgMV1dO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKHggPSAwOyB4IDwgMzsgeCsrKSB7XG4gICAgICAgICAgICAgICAgZm9yICh5ID0gMDsgeSA8IDM7IHkrKykge1xuICAgICAgICAgICAgICAgICAgICByZXMgPSAwO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHogPSAwOyB6IDwgMzsgeisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXMgKz0gbVt4XVt6XSAqIG1hdHJpeFt6XVt5XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBvdXRbeF1beV0gPSByZXM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5hID0gb3V0WzBdWzBdO1xuICAgICAgICAgICAgdGhpcy5iID0gb3V0WzFdWzBdO1xuICAgICAgICAgICAgdGhpcy5jID0gb3V0WzBdWzFdO1xuICAgICAgICAgICAgdGhpcy5kID0gb3V0WzFdWzFdO1xuICAgICAgICAgICAgdGhpcy5lID0gb3V0WzBdWzJdO1xuICAgICAgICAgICAgdGhpcy5mID0gb3V0WzFdWzJdO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH07XG4gICAgICAgIC8qXFxcbiAgICAgICAgICogTWF0cml4LmludmVydFxuICAgICAgICAgWyBtZXRob2QgXVxuICAgICAgICAgKipcbiAgICAgICAgICogUmV0dXJucyBhbiBpbnZlcnRlZCB2ZXJzaW9uIG9mIHRoZSBtYXRyaXhcbiAgICAgICAgID0gKG9iamVjdCkgQE1hdHJpeFxuICAgICAgICBcXCovXG4gICAgICAgIG1hdHJpeHByb3RvLmludmVydCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgICAgICAgICAgeCA9IG1lLmEgKiBtZS5kIC0gbWUuYiAqIG1lLmM7XG4gICAgICAgICAgICByZXR1cm4gbmV3IE1hdHJpeChtZS5kIC8geCwgLW1lLmIgLyB4LCAtbWUuYyAvIHgsIG1lLmEgLyB4LCAobWUuYyAqIG1lLmYgLSBtZS5kICogbWUuZSkgLyB4LCAobWUuYiAqIG1lLmUgLSBtZS5hICogbWUuZikgLyB4KTtcbiAgICAgICAgfTtcbiAgICAgICAgLypcXFxuICAgICAgICAgKiBNYXRyaXguY2xvbmVcbiAgICAgICAgIFsgbWV0aG9kIF1cbiAgICAgICAgICoqXG4gICAgICAgICAqIFJldHVybnMgYSBjb3B5IG9mIHRoZSBtYXRyaXhcbiAgICAgICAgID0gKG9iamVjdCkgQE1hdHJpeFxuICAgICAgICBcXCovXG4gICAgICAgIG1hdHJpeHByb3RvLmNsb25lID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBNYXRyaXgodGhpcy5hLCB0aGlzLmIsIHRoaXMuYywgdGhpcy5kLCB0aGlzLmUsIHRoaXMuZik7XG4gICAgICAgIH07XG4gICAgICAgIC8qXFxcbiAgICAgICAgICogTWF0cml4LnRyYW5zbGF0ZVxuICAgICAgICAgWyBtZXRob2QgXVxuICAgICAgICAgKipcbiAgICAgICAgICogVHJhbnNsYXRlIHRoZSBtYXRyaXhcbiAgICAgICAgIC0geCAobnVtYmVyKSBob3Jpem9udGFsIG9mZnNldCBkaXN0YW5jZVxuICAgICAgICAgLSB5IChudW1iZXIpIHZlcnRpY2FsIG9mZnNldCBkaXN0YW5jZVxuICAgICAgICBcXCovXG4gICAgICAgIG1hdHJpeHByb3RvLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hZGQoMSwgMCwgMCwgMSwgeCwgeSk7XG4gICAgICAgIH07XG4gICAgICAgIC8qXFxcbiAgICAgICAgICogTWF0cml4LnNjYWxlXG4gICAgICAgICBbIG1ldGhvZCBdXG4gICAgICAgICAqKlxuICAgICAgICAgKiBTY2FsZXMgdGhlIG1hdHJpeFxuICAgICAgICAgLSB4IChudW1iZXIpIGFtb3VudCB0byBiZSBzY2FsZWQsIHdpdGggYDFgIHJlc3VsdGluZyBpbiBubyBjaGFuZ2VcbiAgICAgICAgIC0geSAobnVtYmVyKSAjb3B0aW9uYWwgYW1vdW50IHRvIHNjYWxlIGFsb25nIHRoZSB2ZXJ0aWNhbCBheGlzLiAoT3RoZXJ3aXNlIGB4YCBhcHBsaWVzIHRvIGJvdGggYXhlcy4pXG4gICAgICAgICAtIGN4IChudW1iZXIpICNvcHRpb25hbCBob3Jpem9udGFsIG9yaWdpbiBwb2ludCBmcm9tIHdoaWNoIHRvIHNjYWxlXG4gICAgICAgICAtIGN5IChudW1iZXIpICNvcHRpb25hbCB2ZXJ0aWNhbCBvcmlnaW4gcG9pbnQgZnJvbSB3aGljaCB0byBzY2FsZVxuICAgICAgICAgKiBEZWZhdWx0IGN4LCBjeSBpcyB0aGUgbWlkZGxlIHBvaW50IG9mIHRoZSBlbGVtZW50LlxuICAgICAgICBcXCovXG4gICAgICAgIG1hdHJpeHByb3RvLnNjYWxlID0gZnVuY3Rpb24gKHgsIHksIGN4LCBjeSkge1xuICAgICAgICAgICAgeSA9PSBudWxsICYmICh5ID0geCk7XG4gICAgICAgICAgICAoY3ggfHwgY3kpICYmIHRoaXMuYWRkKDEsIDAsIDAsIDEsIGN4LCBjeSk7XG4gICAgICAgICAgICB0aGlzLmFkZCh4LCAwLCAwLCB5LCAwLCAwKTtcbiAgICAgICAgICAgIChjeCB8fCBjeSkgJiYgdGhpcy5hZGQoMSwgMCwgMCwgMSwgLWN4LCAtY3kpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH07XG4gICAgICAgIC8qXFxcbiAgICAgICAgICogTWF0cml4LnJvdGF0ZVxuICAgICAgICAgWyBtZXRob2QgXVxuICAgICAgICAgKipcbiAgICAgICAgICogUm90YXRlcyB0aGUgbWF0cml4XG4gICAgICAgICAtIGEgKG51bWJlcikgYW5nbGUgb2Ygcm90YXRpb24sIGluIGRlZ3JlZXNcbiAgICAgICAgIC0geCAobnVtYmVyKSBob3Jpem9udGFsIG9yaWdpbiBwb2ludCBmcm9tIHdoaWNoIHRvIHJvdGF0ZVxuICAgICAgICAgLSB5IChudW1iZXIpIHZlcnRpY2FsIG9yaWdpbiBwb2ludCBmcm9tIHdoaWNoIHRvIHJvdGF0ZVxuICAgICAgICBcXCovXG4gICAgICAgIG1hdHJpeHByb3RvLnJvdGF0ZSA9IGZ1bmN0aW9uIChhLCB4LCB5KSB7XG4gICAgICAgICAgICBhID0gU25hcC5yYWQoYSk7XG4gICAgICAgICAgICB4ID0geCB8fCAwO1xuICAgICAgICAgICAgeSA9IHkgfHwgMDtcbiAgICAgICAgICAgIHZhciBjb3MgPSArbWF0aC5jb3MoYSkudG9GaXhlZCg5KSxcbiAgICAgICAgICAgICAgICBzaW4gPSArbWF0aC5zaW4oYSkudG9GaXhlZCg5KTtcbiAgICAgICAgICAgIHRoaXMuYWRkKGNvcywgc2luLCAtc2luLCBjb3MsIHgsIHkpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWRkKDEsIDAsIDAsIDEsIC14LCAteSk7XG4gICAgICAgIH07XG4gICAgICAgIC8qXFxcbiAgICAgICAgICogTWF0cml4LnhcbiAgICAgICAgIFsgbWV0aG9kIF1cbiAgICAgICAgICoqXG4gICAgICAgICAqIFJldHVybnMgeCBjb29yZGluYXRlIGZvciBnaXZlbiBwb2ludCBhZnRlciB0cmFuc2Zvcm1hdGlvbiBkZXNjcmliZWQgYnkgdGhlIG1hdHJpeC4gU2VlIGFsc28gQE1hdHJpeC55XG4gICAgICAgICAtIHggKG51bWJlcilcbiAgICAgICAgIC0geSAobnVtYmVyKVxuICAgICAgICAgPSAobnVtYmVyKSB4XG4gICAgICAgIFxcKi9cbiAgICAgICAgbWF0cml4cHJvdG8ueCA9IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgICAgICByZXR1cm4geCAqIHRoaXMuYSArIHkgKiB0aGlzLmMgKyB0aGlzLmU7XG4gICAgICAgIH07XG4gICAgICAgIC8qXFxcbiAgICAgICAgICogTWF0cml4LnlcbiAgICAgICAgIFsgbWV0aG9kIF1cbiAgICAgICAgICoqXG4gICAgICAgICAqIFJldHVybnMgeSBjb29yZGluYXRlIGZvciBnaXZlbiBwb2ludCBhZnRlciB0cmFuc2Zvcm1hdGlvbiBkZXNjcmliZWQgYnkgdGhlIG1hdHJpeC4gU2VlIGFsc28gQE1hdHJpeC54XG4gICAgICAgICAtIHggKG51bWJlcilcbiAgICAgICAgIC0geSAobnVtYmVyKVxuICAgICAgICAgPSAobnVtYmVyKSB5XG4gICAgICAgIFxcKi9cbiAgICAgICAgbWF0cml4cHJvdG8ueSA9IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgICAgICByZXR1cm4geCAqIHRoaXMuYiArIHkgKiB0aGlzLmQgKyB0aGlzLmY7XG4gICAgICAgIH07XG4gICAgICAgIG1hdHJpeHByb3RvLmdldCA9IGZ1bmN0aW9uIChpKSB7XG4gICAgICAgICAgICByZXR1cm4gK3RoaXNbU3RyLmZyb21DaGFyQ29kZSg5NyArIGkpXS50b0ZpeGVkKDQpO1xuICAgICAgICB9O1xuICAgICAgICBtYXRyaXhwcm90by50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBcIm1hdHJpeChcIiArIFt0aGlzLmdldCgwKSwgdGhpcy5nZXQoMSksIHRoaXMuZ2V0KDIpLCB0aGlzLmdldCgzKSwgdGhpcy5nZXQoNCksIHRoaXMuZ2V0KDUpXS5qb2luKCkgKyBcIilcIjtcbiAgICAgICAgfTtcbiAgICAgICAgbWF0cml4cHJvdG8ub2Zmc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIFt0aGlzLmUudG9GaXhlZCg0KSwgdGhpcy5mLnRvRml4ZWQoNCldO1xuICAgICAgICB9O1xuICAgICAgICBmdW5jdGlvbiBub3JtKGEpIHtcbiAgICAgICAgICAgIHJldHVybiBhWzBdICogYVswXSArIGFbMV0gKiBhWzFdO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIG5vcm1hbGl6ZShhKSB7XG4gICAgICAgICAgICB2YXIgbWFnID0gbWF0aC5zcXJ0KG5vcm0oYSkpO1xuICAgICAgICAgICAgYVswXSAmJiAoYVswXSAvPSBtYWcpO1xuICAgICAgICAgICAgYVsxXSAmJiAoYVsxXSAvPSBtYWcpO1xuICAgICAgICB9XG4gICAgICAgIC8qXFxcbiAgICAgICAgICogTWF0cml4LmRldGVybWluYW50XG4gICAgICAgICBbIG1ldGhvZCBdXG4gICAgICAgICAqKlxuICAgICAgICAgKiBGaW5kcyBkZXRlcm1pbmFudCBvZiB0aGUgZ2l2ZW4gbWF0cml4LlxuICAgICAgICAgPSAobnVtYmVyKSBkZXRlcm1pbmFudFxuICAgICAgICBcXCovXG4gICAgICAgIG1hdHJpeHByb3RvLmRldGVybWluYW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYSAqIHRoaXMuZCAtIHRoaXMuYiAqIHRoaXMuYztcbiAgICAgICAgfTtcbiAgICAgICAgLypcXFxuICAgICAgICAgKiBNYXRyaXguc3BsaXRcbiAgICAgICAgIFsgbWV0aG9kIF1cbiAgICAgICAgICoqXG4gICAgICAgICAqIFNwbGl0cyBtYXRyaXggaW50byBwcmltaXRpdmUgdHJhbnNmb3JtYXRpb25zXG4gICAgICAgICA9IChvYmplY3QpIGluIGZvcm1hdDpcbiAgICAgICAgIG8gZHggKG51bWJlcikgdHJhbnNsYXRpb24gYnkgeFxuICAgICAgICAgbyBkeSAobnVtYmVyKSB0cmFuc2xhdGlvbiBieSB5XG4gICAgICAgICBvIHNjYWxleCAobnVtYmVyKSBzY2FsZSBieSB4XG4gICAgICAgICBvIHNjYWxleSAobnVtYmVyKSBzY2FsZSBieSB5XG4gICAgICAgICBvIHNoZWFyIChudW1iZXIpIHNoZWFyXG4gICAgICAgICBvIHJvdGF0ZSAobnVtYmVyKSByb3RhdGlvbiBpbiBkZWdcbiAgICAgICAgIG8gaXNTaW1wbGUgKGJvb2xlYW4pIGNvdWxkIGl0IGJlIHJlcHJlc2VudGVkIHZpYSBzaW1wbGUgdHJhbnNmb3JtYXRpb25zXG4gICAgICAgIFxcKi9cbiAgICAgICAgbWF0cml4cHJvdG8uc3BsaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgb3V0ID0ge307XG4gICAgICAgICAgICAvLyB0cmFuc2xhdGlvblxuICAgICAgICAgICAgb3V0LmR4ID0gdGhpcy5lO1xuICAgICAgICAgICAgb3V0LmR5ID0gdGhpcy5mO1xuXG4gICAgICAgICAgICAvLyBzY2FsZSBhbmQgc2hlYXJcbiAgICAgICAgICAgIHZhciByb3cgPSBbW3RoaXMuYSwgdGhpcy5jXSwgW3RoaXMuYiwgdGhpcy5kXV07XG4gICAgICAgICAgICBvdXQuc2NhbGV4ID0gbWF0aC5zcXJ0KG5vcm0ocm93WzBdKSk7XG4gICAgICAgICAgICBub3JtYWxpemUocm93WzBdKTtcblxuICAgICAgICAgICAgb3V0LnNoZWFyID0gcm93WzBdWzBdICogcm93WzFdWzBdICsgcm93WzBdWzFdICogcm93WzFdWzFdO1xuICAgICAgICAgICAgcm93WzFdID0gW3Jvd1sxXVswXSAtIHJvd1swXVswXSAqIG91dC5zaGVhciwgcm93WzFdWzFdIC0gcm93WzBdWzFdICogb3V0LnNoZWFyXTtcblxuICAgICAgICAgICAgb3V0LnNjYWxleSA9IG1hdGguc3FydChub3JtKHJvd1sxXSkpO1xuICAgICAgICAgICAgbm9ybWFsaXplKHJvd1sxXSk7XG4gICAgICAgICAgICBvdXQuc2hlYXIgLz0gb3V0LnNjYWxleTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuZGV0ZXJtaW5hbnQoKSA8IDApIHtcbiAgICAgICAgICAgICAgICBvdXQuc2NhbGV4ID0gLW91dC5zY2FsZXg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHJvdGF0aW9uXG4gICAgICAgICAgICB2YXIgc2luID0gLXJvd1swXVsxXSxcbiAgICAgICAgICAgICAgICBjb3MgPSByb3dbMV1bMV07XG4gICAgICAgICAgICBpZiAoY29zIDwgMCkge1xuICAgICAgICAgICAgICAgIG91dC5yb3RhdGUgPSBTbmFwLmRlZyhtYXRoLmFjb3MoY29zKSk7XG4gICAgICAgICAgICAgICAgaWYgKHNpbiA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0LnJvdGF0ZSA9IDM2MCAtIG91dC5yb3RhdGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvdXQucm90YXRlID0gU25hcC5kZWcobWF0aC5hc2luKHNpbikpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBvdXQuaXNTaW1wbGUgPSAhK291dC5zaGVhci50b0ZpeGVkKDkpICYmIChvdXQuc2NhbGV4LnRvRml4ZWQoOSkgPT0gb3V0LnNjYWxleS50b0ZpeGVkKDkpIHx8ICFvdXQucm90YXRlKTtcbiAgICAgICAgICAgIG91dC5pc1N1cGVyU2ltcGxlID0gIStvdXQuc2hlYXIudG9GaXhlZCg5KSAmJiBvdXQuc2NhbGV4LnRvRml4ZWQoOSkgPT0gb3V0LnNjYWxleS50b0ZpeGVkKDkpICYmICFvdXQucm90YXRlO1xuICAgICAgICAgICAgb3V0Lm5vUm90YXRpb24gPSAhK291dC5zaGVhci50b0ZpeGVkKDkpICYmICFvdXQucm90YXRlO1xuICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgfTtcbiAgICAgICAgLypcXFxuICAgICAgICAgKiBNYXRyaXgudG9UcmFuc2Zvcm1TdHJpbmdcbiAgICAgICAgIFsgbWV0aG9kIF1cbiAgICAgICAgICoqXG4gICAgICAgICAqIFJldHVybnMgdHJhbnNmb3JtIHN0cmluZyB0aGF0IHJlcHJlc2VudHMgZ2l2ZW4gbWF0cml4XG4gICAgICAgICA9IChzdHJpbmcpIHRyYW5zZm9ybSBzdHJpbmdcbiAgICAgICAgXFwqL1xuICAgICAgICBtYXRyaXhwcm90by50b1RyYW5zZm9ybVN0cmluZyA9IGZ1bmN0aW9uIChzaG9ydGVyKSB7XG4gICAgICAgICAgICB2YXIgcyA9IHNob3J0ZXIgfHwgdGhpcy5zcGxpdCgpO1xuICAgICAgICAgICAgaWYgKCErcy5zaGVhci50b0ZpeGVkKDkpKSB7XG4gICAgICAgICAgICAgICAgcy5zY2FsZXggPSArcy5zY2FsZXgudG9GaXhlZCg0KTtcbiAgICAgICAgICAgICAgICBzLnNjYWxleSA9ICtzLnNjYWxleS50b0ZpeGVkKDQpO1xuICAgICAgICAgICAgICAgIHMucm90YXRlID0gK3Mucm90YXRlLnRvRml4ZWQoNCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICAocy5keCB8fCBzLmR5ID8gXCJ0XCIgKyBbK3MuZHgudG9GaXhlZCg0KSwgK3MuZHkudG9GaXhlZCg0KV0gOiBFKSArIFxuICAgICAgICAgICAgICAgICAgICAgICAgKHMuc2NhbGV4ICE9IDEgfHwgcy5zY2FsZXkgIT0gMSA/IFwic1wiICsgW3Muc2NhbGV4LCBzLnNjYWxleSwgMCwgMF0gOiBFKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAocy5yb3RhdGUgPyBcInJcIiArIFsrcy5yb3RhdGUudG9GaXhlZCg0KSwgMCwgMF0gOiBFKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwibVwiICsgW3RoaXMuZ2V0KDApLCB0aGlzLmdldCgxKSwgdGhpcy5nZXQoMiksIHRoaXMuZ2V0KDMpLCB0aGlzLmdldCg0KSwgdGhpcy5nZXQoNSldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pKE1hdHJpeC5wcm90b3R5cGUpO1xuICAgIC8qXFxcbiAgICAgKiBTbmFwLk1hdHJpeFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogTWF0cml4IGNvbnN0cnVjdG9yLCBleHRlbmQgb24geW91ciBvd24gcmlzay5cbiAgICAgKiBUbyBjcmVhdGUgbWF0cmljZXMgdXNlIEBTbmFwLm1hdHJpeC5cbiAgICBcXCovXG4gICAgU25hcC5NYXRyaXggPSBNYXRyaXg7XG4gICAgLypcXFxuICAgICAqIFNuYXAubWF0cml4XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBVdGlsaXR5IG1ldGhvZFxuICAgICAqKlxuICAgICAqIFJldHVybnMgYSBtYXRyaXggYmFzZWQgb24gdGhlIGdpdmVuIHBhcmFtZXRlcnNcbiAgICAgLSBhIChudW1iZXIpXG4gICAgIC0gYiAobnVtYmVyKVxuICAgICAtIGMgKG51bWJlcilcbiAgICAgLSBkIChudW1iZXIpXG4gICAgIC0gZSAobnVtYmVyKVxuICAgICAtIGYgKG51bWJlcilcbiAgICAgKiBvclxuICAgICAtIHN2Z01hdHJpeCAoU1ZHTWF0cml4KVxuICAgICA9IChvYmplY3QpIEBNYXRyaXhcbiAgICBcXCovXG4gICAgU25hcC5tYXRyaXggPSBmdW5jdGlvbiAoYSwgYiwgYywgZCwgZSwgZikge1xuICAgICAgICByZXR1cm4gbmV3IE1hdHJpeChhLCBiLCBjLCBkLCBlLCBmKTtcbiAgICB9O1xufSk7XG4vLyBDb3B5cmlnaHQgKGMpIDIwMTMgQWRvYmUgU3lzdGVtcyBJbmNvcnBvcmF0ZWQuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBcbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vIFxuLy8gaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vLyBcbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5TbmFwLnBsdWdpbihmdW5jdGlvbiAoU25hcCwgRWxlbWVudCwgUGFwZXIsIGdsb2IsIEZyYWdtZW50KSB7XG4gICAgdmFyIGhhcyA9IFwiaGFzT3duUHJvcGVydHlcIixcbiAgICAgICAgbWFrZSA9IFNuYXAuXy5tYWtlLFxuICAgICAgICB3cmFwID0gU25hcC5fLndyYXAsXG4gICAgICAgIGlzID0gU25hcC5pcyxcbiAgICAgICAgZ2V0U29tZURlZnMgPSBTbmFwLl8uZ2V0U29tZURlZnMsXG4gICAgICAgIHJlVVJMVmFsdWUgPSAvXnVybFxcKCM/KFteKV0rKVxcKSQvLFxuICAgICAgICAkID0gU25hcC5fLiQsXG4gICAgICAgIFVSTCA9IFNuYXAudXJsLFxuICAgICAgICBTdHIgPSBTdHJpbmcsXG4gICAgICAgIHNlcGFyYXRvciA9IFNuYXAuXy5zZXBhcmF0b3IsXG4gICAgICAgIEUgPSBcIlwiO1xuICAgIC8vIEF0dHJpYnV0ZXMgZXZlbnQgaGFuZGxlcnNcbiAgICBldmUub24oXCJzbmFwLnV0aWwuYXR0ci5tYXNrXCIsIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBFbGVtZW50IHx8IHZhbHVlIGluc3RhbmNlb2YgRnJhZ21lbnQpIHtcbiAgICAgICAgICAgIGV2ZS5zdG9wKCk7XG4gICAgICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBGcmFnbWVudCAmJiB2YWx1ZS5ub2RlLmNoaWxkTm9kZXMubGVuZ3RoID09IDEpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLm5vZGUuZmlyc3RDaGlsZDtcbiAgICAgICAgICAgICAgICBnZXRTb21lRGVmcyh0aGlzKS5hcHBlbmRDaGlsZCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB3cmFwKHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh2YWx1ZS50eXBlID09IFwibWFza1wiKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1hc2sgPSB2YWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbWFzayA9IG1ha2UoXCJtYXNrXCIsIGdldFNvbWVEZWZzKHRoaXMpKTtcbiAgICAgICAgICAgICAgICBtYXNrLm5vZGUuYXBwZW5kQ2hpbGQodmFsdWUubm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAhbWFzay5ub2RlLmlkICYmICQobWFzay5ub2RlLCB7XG4gICAgICAgICAgICAgICAgaWQ6IG1hc2suaWRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJCh0aGlzLm5vZGUsIHtcbiAgICAgICAgICAgICAgICBtYXNrOiBVUkwobWFzay5pZClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgKGZ1bmN0aW9uIChjbGlwSXQpIHtcbiAgICAgICAgZXZlLm9uKFwic25hcC51dGlsLmF0dHIuY2xpcFwiLCBjbGlwSXQpO1xuICAgICAgICBldmUub24oXCJzbmFwLnV0aWwuYXR0ci5jbGlwLXBhdGhcIiwgY2xpcEl0KTtcbiAgICAgICAgZXZlLm9uKFwic25hcC51dGlsLmF0dHIuY2xpcFBhdGhcIiwgY2xpcEl0KTtcbiAgICB9KGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBFbGVtZW50IHx8IHZhbHVlIGluc3RhbmNlb2YgRnJhZ21lbnQpIHtcbiAgICAgICAgICAgIGV2ZS5zdG9wKCk7XG4gICAgICAgICAgICBpZiAodmFsdWUudHlwZSA9PSBcImNsaXBQYXRoXCIpIHtcbiAgICAgICAgICAgICAgICB2YXIgY2xpcCA9IHZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjbGlwID0gbWFrZShcImNsaXBQYXRoXCIsIGdldFNvbWVEZWZzKHRoaXMpKTtcbiAgICAgICAgICAgICAgICBjbGlwLm5vZGUuYXBwZW5kQ2hpbGQodmFsdWUubm9kZSk7XG4gICAgICAgICAgICAgICAgIWNsaXAubm9kZS5pZCAmJiAkKGNsaXAubm9kZSwge1xuICAgICAgICAgICAgICAgICAgICBpZDogY2xpcC5pZFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgJCh0aGlzLm5vZGUsIHtcbiAgICAgICAgICAgICAgICBcImNsaXAtcGF0aFwiOiBVUkwoY2xpcC5ub2RlLmlkIHx8IGNsaXAuaWQpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0pKTtcbiAgICBmdW5jdGlvbiBmaWxsU3Ryb2tlKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgZXZlLnN0b3AoKTtcbiAgICAgICAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEZyYWdtZW50ICYmIHZhbHVlLm5vZGUuY2hpbGROb2Rlcy5sZW5ndGggPT0gMSAmJlxuICAgICAgICAgICAgICAgICh2YWx1ZS5ub2RlLmZpcnN0Q2hpbGQudGFnTmFtZSA9PSBcInJhZGlhbEdyYWRpZW50XCIgfHxcbiAgICAgICAgICAgICAgICB2YWx1ZS5ub2RlLmZpcnN0Q2hpbGQudGFnTmFtZSA9PSBcImxpbmVhckdyYWRpZW50XCIgfHxcbiAgICAgICAgICAgICAgICB2YWx1ZS5ub2RlLmZpcnN0Q2hpbGQudGFnTmFtZSA9PSBcInBhdHRlcm5cIikpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLm5vZGUuZmlyc3RDaGlsZDtcbiAgICAgICAgICAgICAgICBnZXRTb21lRGVmcyh0aGlzKS5hcHBlbmRDaGlsZCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB3cmFwKHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUudHlwZSA9PSBcInJhZGlhbEdyYWRpZW50XCIgfHwgdmFsdWUudHlwZSA9PSBcImxpbmVhckdyYWRpZW50XCJcbiAgICAgICAgICAgICAgICAgICB8fCB2YWx1ZS50eXBlID09IFwicGF0dGVyblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdmFsdWUubm9kZS5pZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJCh2YWx1ZS5ub2RlLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHZhbHVlLmlkXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2YXIgZmlsbCA9IFVSTCh2YWx1ZS5ub2RlLmlkKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBmaWxsID0gdmFsdWUuYXR0cihuYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZpbGwgPSBTbmFwLmNvbG9yKHZhbHVlKTtcbiAgICAgICAgICAgICAgICBpZiAoZmlsbC5lcnJvcikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZ3JhZCA9IFNuYXAoZ2V0U29tZURlZnModGhpcykub3duZXJTVkdFbGVtZW50KS5ncmFkaWVudCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChncmFkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWdyYWQubm9kZS5pZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoZ3JhZC5ub2RlLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBncmFkLmlkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxsID0gVVJMKGdyYWQubm9kZS5pZCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxsID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBmaWxsID0gU3RyKGZpbGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBhdHRycyA9IHt9O1xuICAgICAgICAgICAgYXR0cnNbbmFtZV0gPSBmaWxsO1xuICAgICAgICAgICAgJCh0aGlzLm5vZGUsIGF0dHJzKTtcbiAgICAgICAgICAgIHRoaXMubm9kZS5zdHlsZVtuYW1lXSA9IEU7XG4gICAgICAgIH07XG4gICAgfVxuICAgIGV2ZS5vbihcInNuYXAudXRpbC5hdHRyLmZpbGxcIiwgZmlsbFN0cm9rZShcImZpbGxcIikpO1xuICAgIGV2ZS5vbihcInNuYXAudXRpbC5hdHRyLnN0cm9rZVwiLCBmaWxsU3Ryb2tlKFwic3Ryb2tlXCIpKTtcbiAgICB2YXIgZ3JhZHJnID0gL14oW2xyXSkoPzpcXCgoW14pXSopXFwpKT8oLiopJC9pO1xuICAgIGV2ZS5vbihcInNuYXAudXRpbC5ncmFkLnBhcnNlXCIsIGZ1bmN0aW9uIHBhcnNlR3JhZChzdHJpbmcpIHtcbiAgICAgICAgc3RyaW5nID0gU3RyKHN0cmluZyk7XG4gICAgICAgIHZhciB0b2tlbnMgPSBzdHJpbmcubWF0Y2goZ3JhZHJnKTtcbiAgICAgICAgaWYgKCF0b2tlbnMpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHZhciB0eXBlID0gdG9rZW5zWzFdLFxuICAgICAgICAgICAgcGFyYW1zID0gdG9rZW5zWzJdLFxuICAgICAgICAgICAgc3RvcHMgPSB0b2tlbnNbM107XG4gICAgICAgIHBhcmFtcyA9IHBhcmFtcy5zcGxpdCgvXFxzKixcXHMqLykubWFwKGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgcmV0dXJuICtlbCA9PSBlbCA/ICtlbCA6IGVsO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHBhcmFtcy5sZW5ndGggPT0gMSAmJiBwYXJhbXNbMF0gPT0gMCkge1xuICAgICAgICAgICAgcGFyYW1zID0gW107XG4gICAgICAgIH1cbiAgICAgICAgc3RvcHMgPSBzdG9wcy5zcGxpdChcIi1cIik7XG4gICAgICAgIHN0b3BzID0gc3RvcHMubWFwKGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgZWwgPSBlbC5zcGxpdChcIjpcIik7XG4gICAgICAgICAgICB2YXIgb3V0ID0ge1xuICAgICAgICAgICAgICAgIGNvbG9yOiBlbFswXVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmIChlbFsxXSkge1xuICAgICAgICAgICAgICAgIG91dC5vZmZzZXQgPSBwYXJzZUZsb2F0KGVsWzFdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBvdXQ7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgICAgIHBhcmFtczogcGFyYW1zLFxuICAgICAgICAgICAgc3RvcHM6IHN0b3BzXG4gICAgICAgIH07XG4gICAgfSk7XG5cbiAgICBldmUub24oXCJzbmFwLnV0aWwuYXR0ci5kXCIsIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBldmUuc3RvcCgpO1xuICAgICAgICBpZiAoaXModmFsdWUsIFwiYXJyYXlcIikgJiYgaXModmFsdWVbMF0sIFwiYXJyYXlcIikpIHtcbiAgICAgICAgICAgIHZhbHVlID0gU25hcC5wYXRoLnRvU3RyaW5nLmNhbGwodmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIHZhbHVlID0gU3RyKHZhbHVlKTtcbiAgICAgICAgaWYgKHZhbHVlLm1hdGNoKC9bcnVvXS9pKSkge1xuICAgICAgICAgICAgdmFsdWUgPSBTbmFwLnBhdGgudG9BYnNvbHV0ZSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgJCh0aGlzLm5vZGUsIHtkOiB2YWx1ZX0pO1xuICAgIH0pKC0xKTtcbiAgICBldmUub24oXCJzbmFwLnV0aWwuYXR0ci4jdGV4dFwiLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgZXZlLnN0b3AoKTtcbiAgICAgICAgdmFsdWUgPSBTdHIodmFsdWUpO1xuICAgICAgICB2YXIgdHh0ID0gZ2xvYi5kb2MuY3JlYXRlVGV4dE5vZGUodmFsdWUpO1xuICAgICAgICB3aGlsZSAodGhpcy5ub2RlLmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgICAgIHRoaXMubm9kZS5yZW1vdmVDaGlsZCh0aGlzLm5vZGUuZmlyc3RDaGlsZCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ub2RlLmFwcGVuZENoaWxkKHR4dCk7XG4gICAgfSkoLTEpO1xuICAgIGV2ZS5vbihcInNuYXAudXRpbC5hdHRyLnBhdGhcIiwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGV2ZS5zdG9wKCk7XG4gICAgICAgIHRoaXMuYXR0cih7ZDogdmFsdWV9KTtcbiAgICB9KSgtMSk7XG4gICAgZXZlLm9uKFwic25hcC51dGlsLmF0dHIuY2xhc3NcIiwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGV2ZS5zdG9wKCk7XG4gICAgICAgIHRoaXMubm9kZS5jbGFzc05hbWUuYmFzZVZhbCA9IHZhbHVlO1xuICAgIH0pKC0xKTtcbiAgICBldmUub24oXCJzbmFwLnV0aWwuYXR0ci52aWV3Qm94XCIsIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB2YXIgdmI7XG4gICAgICAgIGlmIChpcyh2YWx1ZSwgXCJvYmplY3RcIikgJiYgXCJ4XCIgaW4gdmFsdWUpIHtcbiAgICAgICAgICAgIHZiID0gW3ZhbHVlLngsIHZhbHVlLnksIHZhbHVlLndpZHRoLCB2YWx1ZS5oZWlnaHRdLmpvaW4oXCIgXCIpO1xuICAgICAgICB9IGVsc2UgaWYgKGlzKHZhbHVlLCBcImFycmF5XCIpKSB7XG4gICAgICAgICAgICB2YiA9IHZhbHVlLmpvaW4oXCIgXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmIgPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICAkKHRoaXMubm9kZSwge1xuICAgICAgICAgICAgdmlld0JveDogdmJcbiAgICAgICAgfSk7XG4gICAgICAgIGV2ZS5zdG9wKCk7XG4gICAgfSkoLTEpO1xuICAgIGV2ZS5vbihcInNuYXAudXRpbC5hdHRyLnRyYW5zZm9ybVwiLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdGhpcy50cmFuc2Zvcm0odmFsdWUpO1xuICAgICAgICBldmUuc3RvcCgpO1xuICAgIH0pKC0xKTtcbiAgICBldmUub24oXCJzbmFwLnV0aWwuYXR0ci5yXCIsIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBpZiAodGhpcy50eXBlID09IFwicmVjdFwiKSB7XG4gICAgICAgICAgICBldmUuc3RvcCgpO1xuICAgICAgICAgICAgJCh0aGlzLm5vZGUsIHtcbiAgICAgICAgICAgICAgICByeDogdmFsdWUsXG4gICAgICAgICAgICAgICAgcnk6IHZhbHVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0pKC0xKTtcbiAgICBldmUub24oXCJzbmFwLnV0aWwuYXR0ci50ZXh0cGF0aFwiLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgZXZlLnN0b3AoKTtcbiAgICAgICAgaWYgKHRoaXMudHlwZSA9PSBcInRleHRcIikge1xuICAgICAgICAgICAgdmFyIGlkLCB0cCwgbm9kZTtcbiAgICAgICAgICAgIGlmICghdmFsdWUgJiYgdGhpcy50ZXh0UGF0aCkge1xuICAgICAgICAgICAgICAgIHRwID0gdGhpcy50ZXh0UGF0aDtcbiAgICAgICAgICAgICAgICB3aGlsZSAodHAubm9kZS5maXJzdENoaWxkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubm9kZS5hcHBlbmRDaGlsZCh0cC5ub2RlLmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0cC5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy50ZXh0UGF0aDtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXModmFsdWUsIFwic3RyaW5nXCIpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRlZnMgPSBnZXRTb21lRGVmcyh0aGlzKSxcbiAgICAgICAgICAgICAgICAgICAgcGF0aCA9IHdyYXAoZGVmcy5wYXJlbnROb2RlKS5wYXRoKHZhbHVlKTtcbiAgICAgICAgICAgICAgICBkZWZzLmFwcGVuZENoaWxkKHBhdGgubm9kZSk7XG4gICAgICAgICAgICAgICAgaWQgPSBwYXRoLmlkO1xuICAgICAgICAgICAgICAgIHBhdGguYXR0cih7aWQ6IGlkfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gd3JhcCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICBpZCA9IHZhbHVlLmF0dHIoXCJpZFwiKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSB2YWx1ZS5pZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlLmF0dHIoe2lkOiBpZH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlkKSB7XG4gICAgICAgICAgICAgICAgdHAgPSB0aGlzLnRleHRQYXRoO1xuICAgICAgICAgICAgICAgIG5vZGUgPSB0aGlzLm5vZGU7XG4gICAgICAgICAgICAgICAgaWYgKHRwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRwLmF0dHIoe1wieGxpbms6aHJlZlwiOiBcIiNcIiArIGlkfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdHAgPSAkKFwidGV4dFBhdGhcIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJ4bGluazpocmVmXCI6IFwiI1wiICsgaWRcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChub2RlLmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRwLmFwcGVuZENoaWxkKG5vZGUuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbm9kZS5hcHBlbmRDaGlsZCh0cCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudGV4dFBhdGggPSB3cmFwKHRwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KSgtMSk7XG4gICAgZXZlLm9uKFwic25hcC51dGlsLmF0dHIudGV4dFwiLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgaWYgKHRoaXMudHlwZSA9PSBcInRleHRcIikge1xuICAgICAgICAgICAgdmFyIGkgPSAwLFxuICAgICAgICAgICAgICAgIG5vZGUgPSB0aGlzLm5vZGUsXG4gICAgICAgICAgICAgICAgdHVuZXIgPSBmdW5jdGlvbiAoY2h1bmspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG91dCA9ICQoXCJ0c3BhblwiKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzKGNodW5rLCBcImFycmF5XCIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNodW5rLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0LmFwcGVuZENoaWxkKHR1bmVyKGNodW5rW2ldKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXQuYXBwZW5kQ2hpbGQoZ2xvYi5kb2MuY3JlYXRlVGV4dE5vZGUoY2h1bmspKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBvdXQubm9ybWFsaXplICYmIG91dC5ub3JtYWxpemUoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgd2hpbGUgKG5vZGUuZmlyc3RDaGlsZCkge1xuICAgICAgICAgICAgICAgIG5vZGUucmVtb3ZlQ2hpbGQobm9kZS5maXJzdENoaWxkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB0dW5lZCA9IHR1bmVyKHZhbHVlKTtcbiAgICAgICAgICAgIHdoaWxlICh0dW5lZC5maXJzdENoaWxkKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5hcHBlbmRDaGlsZCh0dW5lZC5maXJzdENoaWxkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBldmUuc3RvcCgpO1xuICAgIH0pKC0xKTtcbiAgICBmdW5jdGlvbiBzZXRGb250U2l6ZSh2YWx1ZSkge1xuICAgICAgICBldmUuc3RvcCgpO1xuICAgICAgICBpZiAodmFsdWUgPT0gK3ZhbHVlKSB7XG4gICAgICAgICAgICB2YWx1ZSArPSBcInB4XCI7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ub2RlLnN0eWxlLmZvbnRTaXplID0gdmFsdWU7XG4gICAgfVxuICAgIGV2ZS5vbihcInNuYXAudXRpbC5hdHRyLmZvbnRTaXplXCIsIHNldEZvbnRTaXplKSgtMSk7XG4gICAgZXZlLm9uKFwic25hcC51dGlsLmF0dHIuZm9udC1zaXplXCIsIHNldEZvbnRTaXplKSgtMSk7XG5cblxuICAgIGV2ZS5vbihcInNuYXAudXRpbC5nZXRhdHRyLnRyYW5zZm9ybVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGV2ZS5zdG9wKCk7XG4gICAgICAgIHJldHVybiB0aGlzLnRyYW5zZm9ybSgpO1xuICAgIH0pKC0xKTtcbiAgICBldmUub24oXCJzbmFwLnV0aWwuZ2V0YXR0ci50ZXh0cGF0aFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGV2ZS5zdG9wKCk7XG4gICAgICAgIHJldHVybiB0aGlzLnRleHRQYXRoO1xuICAgIH0pKC0xKTtcbiAgICAvLyBNYXJrZXJzXG4gICAgKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZnVuY3Rpb24gZ2V0dGVyKGVuZCkge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBldmUuc3RvcCgpO1xuICAgICAgICAgICAgICAgIHZhciBzdHlsZSA9IGdsb2IuZG9jLmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUodGhpcy5ub2RlLCBudWxsKS5nZXRQcm9wZXJ0eVZhbHVlKFwibWFya2VyLVwiICsgZW5kKTtcbiAgICAgICAgICAgICAgICBpZiAoc3R5bGUgPT0gXCJub25lXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN0eWxlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBTbmFwKGdsb2IuZG9jLmdldEVsZW1lbnRCeUlkKHN0eWxlLm1hdGNoKHJlVVJMVmFsdWUpWzFdKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBzZXR0ZXIoZW5kKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgZXZlLnN0b3AoKTtcbiAgICAgICAgICAgICAgICB2YXIgbmFtZSA9IFwibWFya2VyXCIgKyBlbmQuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBlbmQuc3Vic3RyaW5nKDEpO1xuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIlwiIHx8ICF2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm5vZGUuc3R5bGVbbmFtZV0gPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodmFsdWUudHlwZSA9PSBcIm1hcmtlclwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpZCA9IHZhbHVlLm5vZGUuaWQ7XG4gICAgICAgICAgICAgICAgICAgIGlmICghaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQodmFsdWUubm9kZSwge2lkOiB2YWx1ZS5pZH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubm9kZS5zdHlsZVtuYW1lXSA9IFVSTChpZCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGV2ZS5vbihcInNuYXAudXRpbC5nZXRhdHRyLm1hcmtlci1lbmRcIiwgZ2V0dGVyKFwiZW5kXCIpKSgtMSk7XG4gICAgICAgIGV2ZS5vbihcInNuYXAudXRpbC5nZXRhdHRyLm1hcmtlckVuZFwiLCBnZXR0ZXIoXCJlbmRcIikpKC0xKTtcbiAgICAgICAgZXZlLm9uKFwic25hcC51dGlsLmdldGF0dHIubWFya2VyLXN0YXJ0XCIsIGdldHRlcihcInN0YXJ0XCIpKSgtMSk7XG4gICAgICAgIGV2ZS5vbihcInNuYXAudXRpbC5nZXRhdHRyLm1hcmtlclN0YXJ0XCIsIGdldHRlcihcInN0YXJ0XCIpKSgtMSk7XG4gICAgICAgIGV2ZS5vbihcInNuYXAudXRpbC5nZXRhdHRyLm1hcmtlci1taWRcIiwgZ2V0dGVyKFwibWlkXCIpKSgtMSk7XG4gICAgICAgIGV2ZS5vbihcInNuYXAudXRpbC5nZXRhdHRyLm1hcmtlck1pZFwiLCBnZXR0ZXIoXCJtaWRcIikpKC0xKTtcbiAgICAgICAgZXZlLm9uKFwic25hcC51dGlsLmF0dHIubWFya2VyLWVuZFwiLCBzZXR0ZXIoXCJlbmRcIikpKC0xKTtcbiAgICAgICAgZXZlLm9uKFwic25hcC51dGlsLmF0dHIubWFya2VyRW5kXCIsIHNldHRlcihcImVuZFwiKSkoLTEpO1xuICAgICAgICBldmUub24oXCJzbmFwLnV0aWwuYXR0ci5tYXJrZXItc3RhcnRcIiwgc2V0dGVyKFwic3RhcnRcIikpKC0xKTtcbiAgICAgICAgZXZlLm9uKFwic25hcC51dGlsLmF0dHIubWFya2VyU3RhcnRcIiwgc2V0dGVyKFwic3RhcnRcIikpKC0xKTtcbiAgICAgICAgZXZlLm9uKFwic25hcC51dGlsLmF0dHIubWFya2VyLW1pZFwiLCBzZXR0ZXIoXCJtaWRcIikpKC0xKTtcbiAgICAgICAgZXZlLm9uKFwic25hcC51dGlsLmF0dHIubWFya2VyTWlkXCIsIHNldHRlcihcIm1pZFwiKSkoLTEpO1xuICAgIH0oKSk7XG4gICAgZXZlLm9uKFwic25hcC51dGlsLmdldGF0dHIuclwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLnR5cGUgPT0gXCJyZWN0XCIgJiYgJCh0aGlzLm5vZGUsIFwicnhcIikgPT0gJCh0aGlzLm5vZGUsIFwicnlcIikpIHtcbiAgICAgICAgICAgIGV2ZS5zdG9wKCk7XG4gICAgICAgICAgICByZXR1cm4gJCh0aGlzLm5vZGUsIFwicnhcIik7XG4gICAgICAgIH1cbiAgICB9KSgtMSk7XG4gICAgZnVuY3Rpb24gdGV4dEV4dHJhY3Qobm9kZSkge1xuICAgICAgICB2YXIgb3V0ID0gW107XG4gICAgICAgIHZhciBjaGlsZHJlbiA9IG5vZGUuY2hpbGROb2RlcztcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gY2hpbGRyZW4ubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgdmFyIGNoaSA9IGNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgaWYgKGNoaS5ub2RlVHlwZSA9PSAzKSB7XG4gICAgICAgICAgICAgICAgb3V0LnB1c2goY2hpLm5vZGVWYWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY2hpLnRhZ05hbWUgPT0gXCJ0c3BhblwiKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNoaS5jaGlsZE5vZGVzLmxlbmd0aCA9PSAxICYmIGNoaS5maXJzdENoaWxkLm5vZGVUeXBlID09IDMpIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0LnB1c2goY2hpLmZpcnN0Q2hpbGQubm9kZVZhbHVlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBvdXQucHVzaCh0ZXh0RXh0cmFjdChjaGkpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9XG4gICAgZXZlLm9uKFwic25hcC51dGlsLmdldGF0dHIudGV4dFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLnR5cGUgPT0gXCJ0ZXh0XCIgfHwgdGhpcy50eXBlID09IFwidHNwYW5cIikge1xuICAgICAgICAgICAgZXZlLnN0b3AoKTtcbiAgICAgICAgICAgIHZhciBvdXQgPSB0ZXh0RXh0cmFjdCh0aGlzLm5vZGUpO1xuICAgICAgICAgICAgcmV0dXJuIG91dC5sZW5ndGggPT0gMSA/IG91dFswXSA6IG91dDtcbiAgICAgICAgfVxuICAgIH0pKC0xKTtcbiAgICBldmUub24oXCJzbmFwLnV0aWwuZ2V0YXR0ci4jdGV4dFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5vZGUudGV4dENvbnRlbnQ7XG4gICAgfSkoLTEpO1xuICAgIGV2ZS5vbihcInNuYXAudXRpbC5nZXRhdHRyLnZpZXdCb3hcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICBldmUuc3RvcCgpO1xuICAgICAgICB2YXIgdmIgPSAkKHRoaXMubm9kZSwgXCJ2aWV3Qm94XCIpO1xuICAgICAgICBpZiAodmIpIHtcbiAgICAgICAgICAgIHZiID0gdmIuc3BsaXQoc2VwYXJhdG9yKTtcbiAgICAgICAgICAgIHJldHVybiBTbmFwLl8uYm94KCt2YlswXSwgK3ZiWzFdLCArdmJbMl0sICt2YlszXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9KSgtMSk7XG4gICAgZXZlLm9uKFwic25hcC51dGlsLmdldGF0dHIucG9pbnRzXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHAgPSAkKHRoaXMubm9kZSwgXCJwb2ludHNcIik7XG4gICAgICAgIGV2ZS5zdG9wKCk7XG4gICAgICAgIGlmIChwKSB7XG4gICAgICAgICAgICByZXR1cm4gcC5zcGxpdChzZXBhcmF0b3IpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfSkoLTEpO1xuICAgIGV2ZS5vbihcInNuYXAudXRpbC5nZXRhdHRyLnBhdGhcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcCA9ICQodGhpcy5ub2RlLCBcImRcIik7XG4gICAgICAgIGV2ZS5zdG9wKCk7XG4gICAgICAgIHJldHVybiBwO1xuICAgIH0pKC0xKTtcbiAgICBldmUub24oXCJzbmFwLnV0aWwuZ2V0YXR0ci5jbGFzc1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5vZGUuY2xhc3NOYW1lLmJhc2VWYWw7XG4gICAgfSkoLTEpO1xuICAgIGZ1bmN0aW9uIGdldEZvbnRTaXplKCkge1xuICAgICAgICBldmUuc3RvcCgpO1xuICAgICAgICByZXR1cm4gdGhpcy5ub2RlLnN0eWxlLmZvbnRTaXplO1xuICAgIH1cbiAgICBldmUub24oXCJzbmFwLnV0aWwuZ2V0YXR0ci5mb250U2l6ZVwiLCBnZXRGb250U2l6ZSkoLTEpO1xuICAgIGV2ZS5vbihcInNuYXAudXRpbC5nZXRhdHRyLmZvbnQtc2l6ZVwiLCBnZXRGb250U2l6ZSkoLTEpO1xufSk7XG5cbi8vIENvcHlyaWdodCAoYykgMjAxNCBBZG9iZSBTeXN0ZW1zIEluY29ycG9yYXRlZC4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cblNuYXAucGx1Z2luKGZ1bmN0aW9uIChTbmFwLCBFbGVtZW50LCBQYXBlciwgZ2xvYiwgRnJhZ21lbnQpIHtcbiAgICB2YXIgcmdOb3RTcGFjZSA9IC9cXFMrL2csXG4gICAgICAgIHJnQmFkU3BhY2UgPSAvW1xcdFxcclxcblxcZl0vZyxcbiAgICAgICAgcmdUcmltID0gLyheXFxzK3xcXHMrJCkvZyxcbiAgICAgICAgU3RyID0gU3RyaW5nLFxuICAgICAgICBlbHByb3RvID0gRWxlbWVudC5wcm90b3R5cGU7XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuYWRkQ2xhc3NcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEFkZHMgZ2l2ZW4gY2xhc3MgbmFtZSBvciBsaXN0IG9mIGNsYXNzIG5hbWVzIHRvIHRoZSBlbGVtZW50LlxuICAgICAtIHZhbHVlIChzdHJpbmcpIGNsYXNzIG5hbWUgb3Igc3BhY2Ugc2VwYXJhdGVkIGxpc3Qgb2YgY2xhc3MgbmFtZXNcbiAgICAgKipcbiAgICAgPSAoRWxlbWVudCkgb3JpZ2luYWwgZWxlbWVudC5cbiAgICBcXCovXG4gICAgZWxwcm90by5hZGRDbGFzcyA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB2YXIgY2xhc3NlcyA9IFN0cih2YWx1ZSB8fCBcIlwiKS5tYXRjaChyZ05vdFNwYWNlKSB8fCBbXSxcbiAgICAgICAgICAgIGVsZW0gPSB0aGlzLm5vZGUsXG4gICAgICAgICAgICBjbGFzc05hbWUgPSBlbGVtLmNsYXNzTmFtZS5iYXNlVmFsLFxuICAgICAgICAgICAgY3VyQ2xhc3NlcyA9IGNsYXNzTmFtZS5tYXRjaChyZ05vdFNwYWNlKSB8fCBbXSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBwb3MsXG4gICAgICAgICAgICBjbGF6eixcbiAgICAgICAgICAgIGZpbmFsVmFsdWU7XG5cbiAgICAgICAgaWYgKGNsYXNzZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICBqID0gMDtcbiAgICAgICAgICAgIHdoaWxlICgoY2xhenogPSBjbGFzc2VzW2orK10pKSB7XG4gICAgICAgICAgICAgICAgcG9zID0gY3VyQ2xhc3Nlcy5pbmRleE9mKGNsYXp6KTtcbiAgICAgICAgICAgICAgICBpZiAoIX5wb3MpIHtcbiAgICAgICAgICAgICAgICAgICAgY3VyQ2xhc3Nlcy5wdXNoKGNsYXp6KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZpbmFsVmFsdWUgPSBjdXJDbGFzc2VzLmpvaW4oXCIgXCIpO1xuICAgICAgICAgICAgaWYgKGNsYXNzTmFtZSAhPSBmaW5hbFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgZWxlbS5jbGFzc05hbWUuYmFzZVZhbCA9IGZpbmFsVmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5yZW1vdmVDbGFzc1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyBnaXZlbiBjbGFzcyBuYW1lIG9yIGxpc3Qgb2YgY2xhc3MgbmFtZXMgZnJvbSB0aGUgZWxlbWVudC5cbiAgICAgLSB2YWx1ZSAoc3RyaW5nKSBjbGFzcyBuYW1lIG9yIHNwYWNlIHNlcGFyYXRlZCBsaXN0IG9mIGNsYXNzIG5hbWVzXG4gICAgICoqXG4gICAgID0gKEVsZW1lbnQpIG9yaWdpbmFsIGVsZW1lbnQuXG4gICAgXFwqL1xuICAgIGVscHJvdG8ucmVtb3ZlQ2xhc3MgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdmFyIGNsYXNzZXMgPSBTdHIodmFsdWUgfHwgXCJcIikubWF0Y2gocmdOb3RTcGFjZSkgfHwgW10sXG4gICAgICAgICAgICBlbGVtID0gdGhpcy5ub2RlLFxuICAgICAgICAgICAgY2xhc3NOYW1lID0gZWxlbS5jbGFzc05hbWUuYmFzZVZhbCxcbiAgICAgICAgICAgIGN1ckNsYXNzZXMgPSBjbGFzc05hbWUubWF0Y2gocmdOb3RTcGFjZSkgfHwgW10sXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgcG9zLFxuICAgICAgICAgICAgY2xhenosXG4gICAgICAgICAgICBmaW5hbFZhbHVlO1xuICAgICAgICBpZiAoY3VyQ2xhc3Nlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGogPSAwO1xuICAgICAgICAgICAgd2hpbGUgKChjbGF6eiA9IGNsYXNzZXNbaisrXSkpIHtcbiAgICAgICAgICAgICAgICBwb3MgPSBjdXJDbGFzc2VzLmluZGV4T2YoY2xhenopO1xuICAgICAgICAgICAgICAgIGlmICh+cG9zKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1ckNsYXNzZXMuc3BsaWNlKHBvcywgMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmaW5hbFZhbHVlID0gY3VyQ2xhc3Nlcy5qb2luKFwiIFwiKTtcbiAgICAgICAgICAgIGlmIChjbGFzc05hbWUgIT0gZmluYWxWYWx1ZSkge1xuICAgICAgICAgICAgICAgIGVsZW0uY2xhc3NOYW1lLmJhc2VWYWwgPSBmaW5hbFZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuaGFzQ2xhc3NcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIENoZWNrcyBpZiB0aGUgZWxlbWVudCBoYXMgYSBnaXZlbiBjbGFzcyBuYW1lIGluIHRoZSBsaXN0IG9mIGNsYXNzIG5hbWVzIGFwcGxpZWQgdG8gaXQuXG4gICAgIC0gdmFsdWUgKHN0cmluZykgY2xhc3MgbmFtZVxuICAgICAqKlxuICAgICA9IChib29sZWFuKSBgdHJ1ZWAgaWYgdGhlIGVsZW1lbnQgaGFzIGdpdmVuIGNsYXNzXG4gICAgXFwqL1xuICAgIGVscHJvdG8uaGFzQ2xhc3MgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdmFyIGVsZW0gPSB0aGlzLm5vZGUsXG4gICAgICAgICAgICBjbGFzc05hbWUgPSBlbGVtLmNsYXNzTmFtZS5iYXNlVmFsLFxuICAgICAgICAgICAgY3VyQ2xhc3NlcyA9IGNsYXNzTmFtZS5tYXRjaChyZ05vdFNwYWNlKSB8fCBbXTtcbiAgICAgICAgcmV0dXJuICEhfmN1ckNsYXNzZXMuaW5kZXhPZih2YWx1ZSk7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC50b2dnbGVDbGFzc1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQWRkIG9yIHJlbW92ZSBvbmUgb3IgbW9yZSBjbGFzc2VzIGZyb20gdGhlIGVsZW1lbnQsIGRlcGVuZGluZyBvbiBlaXRoZXJcbiAgICAgKiB0aGUgY2xhc3PigJlzIHByZXNlbmNlIG9yIHRoZSB2YWx1ZSBvZiB0aGUgYGZsYWdgIGFyZ3VtZW50LlxuICAgICAtIHZhbHVlIChzdHJpbmcpIGNsYXNzIG5hbWUgb3Igc3BhY2Ugc2VwYXJhdGVkIGxpc3Qgb2YgY2xhc3MgbmFtZXNcbiAgICAgLSBmbGFnIChib29sZWFuKSB2YWx1ZSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGUgY2xhc3Mgc2hvdWxkIGJlIGFkZGVkIG9yIHJlbW92ZWRcbiAgICAgKipcbiAgICAgPSAoRWxlbWVudCkgb3JpZ2luYWwgZWxlbWVudC5cbiAgICBcXCovXG4gICAgZWxwcm90by50b2dnbGVDbGFzcyA9IGZ1bmN0aW9uICh2YWx1ZSwgZmxhZykge1xuICAgICAgICBpZiAoZmxhZyAhPSBudWxsKSB7XG4gICAgICAgICAgICBpZiAoZmxhZykge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmFkZENsYXNzKHZhbHVlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVtb3ZlQ2xhc3ModmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBjbGFzc2VzID0gKHZhbHVlIHx8IFwiXCIpLm1hdGNoKHJnTm90U3BhY2UpIHx8IFtdLFxuICAgICAgICAgICAgZWxlbSA9IHRoaXMubm9kZSxcbiAgICAgICAgICAgIGNsYXNzTmFtZSA9IGVsZW0uY2xhc3NOYW1lLmJhc2VWYWwsXG4gICAgICAgICAgICBjdXJDbGFzc2VzID0gY2xhc3NOYW1lLm1hdGNoKHJnTm90U3BhY2UpIHx8IFtdLFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIHBvcyxcbiAgICAgICAgICAgIGNsYXp6LFxuICAgICAgICAgICAgZmluYWxWYWx1ZTtcbiAgICAgICAgaiA9IDA7XG4gICAgICAgIHdoaWxlICgoY2xhenogPSBjbGFzc2VzW2orK10pKSB7XG4gICAgICAgICAgICBwb3MgPSBjdXJDbGFzc2VzLmluZGV4T2YoY2xhenopO1xuICAgICAgICAgICAgaWYgKH5wb3MpIHtcbiAgICAgICAgICAgICAgICBjdXJDbGFzc2VzLnNwbGljZShwb3MsIDEpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjdXJDbGFzc2VzLnB1c2goY2xhenopO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZmluYWxWYWx1ZSA9IGN1ckNsYXNzZXMuam9pbihcIiBcIik7XG4gICAgICAgIGlmIChjbGFzc05hbWUgIT0gZmluYWxWYWx1ZSkge1xuICAgICAgICAgICAgZWxlbS5jbGFzc05hbWUuYmFzZVZhbCA9IGZpbmFsVmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbn0pO1xuXG4vLyBDb3B5cmlnaHQgKGMpIDIwMTMgQWRvYmUgU3lzdGVtcyBJbmNvcnBvcmF0ZWQuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBcbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vIFxuLy8gaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vLyBcbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5TbmFwLnBsdWdpbihmdW5jdGlvbiAoU25hcCwgRWxlbWVudCwgUGFwZXIsIGdsb2IsIEZyYWdtZW50KSB7XG4gICAgdmFyIG9wZXJhdG9ycyA9IHtcbiAgICAgICAgICAgIFwiK1wiOiBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geCArIHk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiLVwiOiBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geCAtIHk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiL1wiOiBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geCAvIHk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwiKlwiOiBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geCAqIHk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBTdHIgPSBTdHJpbmcsXG4gICAgICAgIHJlVW5pdCA9IC9bYS16XSskL2ksXG4gICAgICAgIHJlQWRkb24gPSAvXlxccyooWytcXC1cXC8qXSlcXHMqPVxccyooW1xcZC5lRStcXC1dKylcXHMqKFteXFxkXFxzXSspP1xccyokLztcbiAgICBmdW5jdGlvbiBnZXROdW1iZXIodmFsKSB7XG4gICAgICAgIHJldHVybiB2YWw7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldFVuaXQodW5pdCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgICAgcmV0dXJuICt2YWwudG9GaXhlZCgzKSArIHVuaXQ7XG4gICAgICAgIH07XG4gICAgfVxuICAgIGV2ZS5vbihcInNuYXAudXRpbC5hdHRyXCIsIGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgdmFyIHBsdXMgPSBTdHIodmFsKS5tYXRjaChyZUFkZG9uKTtcbiAgICAgICAgaWYgKHBsdXMpIHtcbiAgICAgICAgICAgIHZhciBldm50ID0gZXZlLm50KCksXG4gICAgICAgICAgICAgICAgbmFtZSA9IGV2bnQuc3Vic3RyaW5nKGV2bnQubGFzdEluZGV4T2YoXCIuXCIpICsgMSksXG4gICAgICAgICAgICAgICAgYSA9IHRoaXMuYXR0cihuYW1lKSxcbiAgICAgICAgICAgICAgICBhdHIgPSB7fTtcbiAgICAgICAgICAgIGV2ZS5zdG9wKCk7XG4gICAgICAgICAgICB2YXIgdW5pdCA9IHBsdXNbM10gfHwgXCJcIixcbiAgICAgICAgICAgICAgICBhVW5pdCA9IGEubWF0Y2gocmVVbml0KSxcbiAgICAgICAgICAgICAgICBvcCA9IG9wZXJhdG9yc1twbHVzWzFdXTtcbiAgICAgICAgICAgIGlmIChhVW5pdCAmJiBhVW5pdCA9PSB1bml0KSB7XG4gICAgICAgICAgICAgICAgdmFsID0gb3AocGFyc2VGbG9hdChhKSwgK3BsdXNbMl0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhID0gdGhpcy5hc1BYKG5hbWUpO1xuICAgICAgICAgICAgICAgIHZhbCA9IG9wKHRoaXMuYXNQWChuYW1lKSwgdGhpcy5hc1BYKG5hbWUsIHBsdXNbMl0gKyB1bml0KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXNOYU4oYSkgfHwgaXNOYU4odmFsKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGF0cltuYW1lXSA9IHZhbDtcbiAgICAgICAgICAgIHRoaXMuYXR0cihhdHIpO1xuICAgICAgICB9XG4gICAgfSkoLTEwKTtcbiAgICBldmUub24oXCJzbmFwLnV0aWwuZXF1YWxcIiwgZnVuY3Rpb24gKG5hbWUsIGIpIHtcbiAgICAgICAgdmFyIEEsIEIsIGEgPSBTdHIodGhpcy5hdHRyKG5hbWUpIHx8IFwiXCIpLFxuICAgICAgICAgICAgZWwgPSB0aGlzLFxuICAgICAgICAgICAgYnBsdXMgPSBTdHIoYikubWF0Y2gocmVBZGRvbik7XG4gICAgICAgIGlmIChicGx1cykge1xuICAgICAgICAgICAgZXZlLnN0b3AoKTtcbiAgICAgICAgICAgIHZhciB1bml0ID0gYnBsdXNbM10gfHwgXCJcIixcbiAgICAgICAgICAgICAgICBhVW5pdCA9IGEubWF0Y2gocmVVbml0KSxcbiAgICAgICAgICAgICAgICBvcCA9IG9wZXJhdG9yc1ticGx1c1sxXV07XG4gICAgICAgICAgICBpZiAoYVVuaXQgJiYgYVVuaXQgPT0gdW5pdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIGZyb206IHBhcnNlRmxvYXQoYSksXG4gICAgICAgICAgICAgICAgICAgIHRvOiBvcChwYXJzZUZsb2F0KGEpLCArYnBsdXNbMl0pLFxuICAgICAgICAgICAgICAgICAgICBmOiBnZXRVbml0KGFVbml0KVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGEgPSB0aGlzLmFzUFgobmFtZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgZnJvbTogYSxcbiAgICAgICAgICAgICAgICAgICAgdG86IG9wKGEsIHRoaXMuYXNQWChuYW1lLCBicGx1c1syXSArIHVuaXQpKSxcbiAgICAgICAgICAgICAgICAgICAgZjogZ2V0TnVtYmVyXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pKC0xMCk7XG59KTtcbi8vIENvcHlyaWdodCAoYykgMjAxMyBBZG9iZSBTeXN0ZW1zIEluY29ycG9yYXRlZC4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIFxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy8gXG4vLyBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vIFxuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cblNuYXAucGx1Z2luKGZ1bmN0aW9uIChTbmFwLCBFbGVtZW50LCBQYXBlciwgZ2xvYiwgRnJhZ21lbnQpIHtcbiAgICB2YXIgcHJvdG8gPSBQYXBlci5wcm90b3R5cGUsXG4gICAgICAgIGlzID0gU25hcC5pcztcbiAgICAvKlxcXG4gICAgICogUGFwZXIucmVjdFxuICAgICBbIG1ldGhvZCBdXG4gICAgICpcbiAgICAgKiBEcmF3cyBhIHJlY3RhbmdsZVxuICAgICAqKlxuICAgICAtIHggKG51bWJlcikgeCBjb29yZGluYXRlIG9mIHRoZSB0b3AgbGVmdCBjb3JuZXJcbiAgICAgLSB5IChudW1iZXIpIHkgY29vcmRpbmF0ZSBvZiB0aGUgdG9wIGxlZnQgY29ybmVyXG4gICAgIC0gd2lkdGggKG51bWJlcikgd2lkdGhcbiAgICAgLSBoZWlnaHQgKG51bWJlcikgaGVpZ2h0XG4gICAgIC0gcnggKG51bWJlcikgI29wdGlvbmFsIGhvcml6b250YWwgcmFkaXVzIGZvciByb3VuZGVkIGNvcm5lcnMsIGRlZmF1bHQgaXMgMFxuICAgICAtIHJ5IChudW1iZXIpICNvcHRpb25hbCB2ZXJ0aWNhbCByYWRpdXMgZm9yIHJvdW5kZWQgY29ybmVycywgZGVmYXVsdCBpcyByeCBvciAwXG4gICAgID0gKG9iamVjdCkgdGhlIGByZWN0YCBlbGVtZW50XG4gICAgICoqXG4gICAgID4gVXNhZ2VcbiAgICAgfCAvLyByZWd1bGFyIHJlY3RhbmdsZVxuICAgICB8IHZhciBjID0gcGFwZXIucmVjdCgxMCwgMTAsIDUwLCA1MCk7XG4gICAgIHwgLy8gcmVjdGFuZ2xlIHdpdGggcm91bmRlZCBjb3JuZXJzXG4gICAgIHwgdmFyIGMgPSBwYXBlci5yZWN0KDQwLCA0MCwgNTAsIDUwLCAxMCk7XG4gICAgXFwqL1xuICAgIHByb3RvLnJlY3QgPSBmdW5jdGlvbiAoeCwgeSwgdywgaCwgcngsIHJ5KSB7XG4gICAgICAgIHZhciBhdHRyO1xuICAgICAgICBpZiAocnkgPT0gbnVsbCkge1xuICAgICAgICAgICAgcnkgPSByeDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXMoeCwgXCJvYmplY3RcIikgJiYgeCA9PSBcIltvYmplY3QgT2JqZWN0XVwiKSB7XG4gICAgICAgICAgICBhdHRyID0geDtcbiAgICAgICAgfSBlbHNlIGlmICh4ICE9IG51bGwpIHtcbiAgICAgICAgICAgIGF0dHIgPSB7XG4gICAgICAgICAgICAgICAgeDogeCxcbiAgICAgICAgICAgICAgICB5OiB5LFxuICAgICAgICAgICAgICAgIHdpZHRoOiB3LFxuICAgICAgICAgICAgICAgIGhlaWdodDogaFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmIChyeCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgYXR0ci5yeCA9IHJ4O1xuICAgICAgICAgICAgICAgIGF0dHIucnkgPSByeTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5lbChcInJlY3RcIiwgYXR0cik7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUGFwZXIuY2lyY2xlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBEcmF3cyBhIGNpcmNsZVxuICAgICAqKlxuICAgICAtIHggKG51bWJlcikgeCBjb29yZGluYXRlIG9mIHRoZSBjZW50cmVcbiAgICAgLSB5IChudW1iZXIpIHkgY29vcmRpbmF0ZSBvZiB0aGUgY2VudHJlXG4gICAgIC0gciAobnVtYmVyKSByYWRpdXNcbiAgICAgPSAob2JqZWN0KSB0aGUgYGNpcmNsZWAgZWxlbWVudFxuICAgICAqKlxuICAgICA+IFVzYWdlXG4gICAgIHwgdmFyIGMgPSBwYXBlci5jaXJjbGUoNTAsIDUwLCA0MCk7XG4gICAgXFwqL1xuICAgIHByb3RvLmNpcmNsZSA9IGZ1bmN0aW9uIChjeCwgY3ksIHIpIHtcbiAgICAgICAgdmFyIGF0dHI7XG4gICAgICAgIGlmIChpcyhjeCwgXCJvYmplY3RcIikgJiYgY3ggPT0gXCJbb2JqZWN0IE9iamVjdF1cIikge1xuICAgICAgICAgICAgYXR0ciA9IGN4O1xuICAgICAgICB9IGVsc2UgaWYgKGN4ICE9IG51bGwpIHtcbiAgICAgICAgICAgIGF0dHIgPSB7XG4gICAgICAgICAgICAgICAgY3g6IGN4LFxuICAgICAgICAgICAgICAgIGN5OiBjeSxcbiAgICAgICAgICAgICAgICByOiByXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmVsKFwiY2lyY2xlXCIsIGF0dHIpO1xuICAgIH07XG5cbiAgICB2YXIgcHJlbG9hZCA9IChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZ1bmN0aW9uIG9uZXJyb3IoKSB7XG4gICAgICAgICAgICB0aGlzLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChzcmMsIGYpIHtcbiAgICAgICAgICAgIHZhciBpbWcgPSBnbG9iLmRvYy5jcmVhdGVFbGVtZW50KFwiaW1nXCIpLFxuICAgICAgICAgICAgICAgIGJvZHkgPSBnbG9iLmRvYy5ib2R5O1xuICAgICAgICAgICAgaW1nLnN0eWxlLmNzc1RleHQgPSBcInBvc2l0aW9uOmFic29sdXRlO2xlZnQ6LTk5OTllbTt0b3A6LTk5OTllbVwiO1xuICAgICAgICAgICAgaW1nLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBmLmNhbGwoaW1nKTtcbiAgICAgICAgICAgICAgICBpbWcub25sb2FkID0gaW1nLm9uZXJyb3IgPSBudWxsO1xuICAgICAgICAgICAgICAgIGJvZHkucmVtb3ZlQ2hpbGQoaW1nKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpbWcub25lcnJvciA9IG9uZXJyb3I7XG4gICAgICAgICAgICBib2R5LmFwcGVuZENoaWxkKGltZyk7XG4gICAgICAgICAgICBpbWcuc3JjID0gc3JjO1xuICAgICAgICB9O1xuICAgIH0oKSk7XG5cbiAgICAvKlxcXG4gICAgICogUGFwZXIuaW1hZ2VcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFBsYWNlcyBhbiBpbWFnZSBvbiB0aGUgc3VyZmFjZVxuICAgICAqKlxuICAgICAtIHNyYyAoc3RyaW5nKSBVUkkgb2YgdGhlIHNvdXJjZSBpbWFnZVxuICAgICAtIHggKG51bWJlcikgeCBvZmZzZXQgcG9zaXRpb25cbiAgICAgLSB5IChudW1iZXIpIHkgb2Zmc2V0IHBvc2l0aW9uXG4gICAgIC0gd2lkdGggKG51bWJlcikgd2lkdGggb2YgdGhlIGltYWdlXG4gICAgIC0gaGVpZ2h0IChudW1iZXIpIGhlaWdodCBvZiB0aGUgaW1hZ2VcbiAgICAgPSAob2JqZWN0KSB0aGUgYGltYWdlYCBlbGVtZW50XG4gICAgICogb3JcbiAgICAgPSAob2JqZWN0KSBTbmFwIGVsZW1lbnQgb2JqZWN0IHdpdGggdHlwZSBgaW1hZ2VgXG4gICAgICoqXG4gICAgID4gVXNhZ2VcbiAgICAgfCB2YXIgYyA9IHBhcGVyLmltYWdlKFwiYXBwbGUucG5nXCIsIDEwLCAxMCwgODAsIDgwKTtcbiAgICBcXCovXG4gICAgcHJvdG8uaW1hZ2UgPSBmdW5jdGlvbiAoc3JjLCB4LCB5LCB3aWR0aCwgaGVpZ2h0KSB7XG4gICAgICAgIHZhciBlbCA9IHRoaXMuZWwoXCJpbWFnZVwiKTtcbiAgICAgICAgaWYgKGlzKHNyYywgXCJvYmplY3RcIikgJiYgXCJzcmNcIiBpbiBzcmMpIHtcbiAgICAgICAgICAgIGVsLmF0dHIoc3JjKTtcbiAgICAgICAgfSBlbHNlIGlmIChzcmMgIT0gbnVsbCkge1xuICAgICAgICAgICAgdmFyIHNldCA9IHtcbiAgICAgICAgICAgICAgICBcInhsaW5rOmhyZWZcIjogc3JjLFxuICAgICAgICAgICAgICAgIHByZXNlcnZlQXNwZWN0UmF0aW86IFwibm9uZVwiXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKHggIT0gbnVsbCAmJiB5ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBzZXQueCA9IHg7XG4gICAgICAgICAgICAgICAgc2V0LnkgPSB5O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHdpZHRoICE9IG51bGwgJiYgaGVpZ2h0ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBzZXQud2lkdGggPSB3aWR0aDtcbiAgICAgICAgICAgICAgICBzZXQuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwcmVsb2FkKHNyYywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBTbmFwLl8uJChlbC5ub2RlLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogdGhpcy5vZmZzZXRXaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogdGhpcy5vZmZzZXRIZWlnaHRcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBTbmFwLl8uJChlbC5ub2RlLCBzZXQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBlbDtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBQYXBlci5lbGxpcHNlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBEcmF3cyBhbiBlbGxpcHNlXG4gICAgICoqXG4gICAgIC0geCAobnVtYmVyKSB4IGNvb3JkaW5hdGUgb2YgdGhlIGNlbnRyZVxuICAgICAtIHkgKG51bWJlcikgeSBjb29yZGluYXRlIG9mIHRoZSBjZW50cmVcbiAgICAgLSByeCAobnVtYmVyKSBob3Jpem9udGFsIHJhZGl1c1xuICAgICAtIHJ5IChudW1iZXIpIHZlcnRpY2FsIHJhZGl1c1xuICAgICA9IChvYmplY3QpIHRoZSBgZWxsaXBzZWAgZWxlbWVudFxuICAgICAqKlxuICAgICA+IFVzYWdlXG4gICAgIHwgdmFyIGMgPSBwYXBlci5lbGxpcHNlKDUwLCA1MCwgNDAsIDIwKTtcbiAgICBcXCovXG4gICAgcHJvdG8uZWxsaXBzZSA9IGZ1bmN0aW9uIChjeCwgY3ksIHJ4LCByeSkge1xuICAgICAgICB2YXIgYXR0cjtcbiAgICAgICAgaWYgKGlzKGN4LCBcIm9iamVjdFwiKSAmJiBjeCA9PSBcIltvYmplY3QgT2JqZWN0XVwiKSB7XG4gICAgICAgICAgICBhdHRyID0gY3g7XG4gICAgICAgIH0gZWxzZSBpZiAoY3ggIT0gbnVsbCkge1xuICAgICAgICAgICAgYXR0ciA9e1xuICAgICAgICAgICAgICAgIGN4OiBjeCxcbiAgICAgICAgICAgICAgICBjeTogY3ksXG4gICAgICAgICAgICAgICAgcng6IHJ4LFxuICAgICAgICAgICAgICAgIHJ5OiByeVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5lbChcImVsbGlwc2VcIiwgYXR0cik7XG4gICAgfTtcbiAgICAvLyBTSUVSUkEgUGFwZXIucGF0aCgpOiBVbmNsZWFyIGZyb20gdGhlIGxpbmsgd2hhdCBhIENhdG11bGwtUm9tIGN1cnZldG8gaXMsIGFuZCB3aHkgaXQgd291bGQgbWFrZSBsaWZlIGFueSBlYXNpZXIuXG4gICAgLypcXFxuICAgICAqIFBhcGVyLnBhdGhcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIENyZWF0ZXMgYSBgPHBhdGg+YCBlbGVtZW50IHVzaW5nIHRoZSBnaXZlbiBzdHJpbmcgYXMgdGhlIHBhdGgncyBkZWZpbml0aW9uXG4gICAgIC0gcGF0aFN0cmluZyAoc3RyaW5nKSAjb3B0aW9uYWwgcGF0aCBzdHJpbmcgaW4gU1ZHIGZvcm1hdFxuICAgICAqIFBhdGggc3RyaW5nIGNvbnNpc3RzIG9mIG9uZS1sZXR0ZXIgY29tbWFuZHMsIGZvbGxvd2VkIGJ5IGNvbW1hIHNlcHJhcmF0ZWQgYXJndW1lbnRzIGluIG51bWVyaWNhbCBmb3JtLiBFeGFtcGxlOlxuICAgICB8IFwiTTEwLDIwTDMwLDQwXCJcbiAgICAgKiBUaGlzIGV4YW1wbGUgZmVhdHVyZXMgdHdvIGNvbW1hbmRzOiBgTWAsIHdpdGggYXJndW1lbnRzIGAoMTAsIDIwKWAgYW5kIGBMYCB3aXRoIGFyZ3VtZW50cyBgKDMwLCA0MClgLiBVcHBlcmNhc2UgbGV0dGVyIGNvbW1hbmRzIGV4cHJlc3MgY29vcmRpbmF0ZXMgaW4gYWJzb2x1dGUgdGVybXMsIHdoaWxlIGxvd2VyY2FzZSBjb21tYW5kcyBleHByZXNzIHRoZW0gaW4gcmVsYXRpdmUgdGVybXMgZnJvbSB0aGUgbW9zdCByZWNlbnRseSBkZWNsYXJlZCBjb29yZGluYXRlcy5cbiAgICAgKlxuICAgICAjIDxwPkhlcmUgaXMgc2hvcnQgbGlzdCBvZiBjb21tYW5kcyBhdmFpbGFibGUsIGZvciBtb3JlIGRldGFpbHMgc2VlIDxhIGhyZWY9XCJodHRwOi8vd3d3LnczLm9yZy9UUi9TVkcvcGF0aHMuaHRtbCNQYXRoRGF0YVwiIHRpdGxlPVwiRGV0YWlscyBvZiBhIHBhdGgncyBkYXRhIGF0dHJpYnV0ZSdzIGZvcm1hdCBhcmUgZGVzY3JpYmVkIGluIHRoZSBTVkcgc3BlY2lmaWNhdGlvbi5cIj5TVkcgcGF0aCBzdHJpbmcgZm9ybWF0PC9hPiBvciA8YSBocmVmPVwiaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4vU1ZHL1R1dG9yaWFsL1BhdGhzXCI+YXJ0aWNsZSBhYm91dCBwYXRoIHN0cmluZ3MgYXQgTUROPC9hPi48L3A+XG4gICAgICMgPHRhYmxlPjx0aGVhZD48dHI+PHRoPkNvbW1hbmQ8L3RoPjx0aD5OYW1lPC90aD48dGg+UGFyYW1ldGVyczwvdGg+PC90cj48L3RoZWFkPjx0Ym9keT5cbiAgICAgIyA8dHI+PHRkPk08L3RkPjx0ZD5tb3ZldG88L3RkPjx0ZD4oeCB5KSs8L3RkPjwvdHI+XG4gICAgICMgPHRyPjx0ZD5aPC90ZD48dGQ+Y2xvc2VwYXRoPC90ZD48dGQ+KG5vbmUpPC90ZD48L3RyPlxuICAgICAjIDx0cj48dGQ+TDwvdGQ+PHRkPmxpbmV0bzwvdGQ+PHRkPih4IHkpKzwvdGQ+PC90cj5cbiAgICAgIyA8dHI+PHRkPkg8L3RkPjx0ZD5ob3Jpem9udGFsIGxpbmV0bzwvdGQ+PHRkPngrPC90ZD48L3RyPlxuICAgICAjIDx0cj48dGQ+VjwvdGQ+PHRkPnZlcnRpY2FsIGxpbmV0bzwvdGQ+PHRkPnkrPC90ZD48L3RyPlxuICAgICAjIDx0cj48dGQ+QzwvdGQ+PHRkPmN1cnZldG88L3RkPjx0ZD4oeDEgeTEgeDIgeTIgeCB5KSs8L3RkPjwvdHI+XG4gICAgICMgPHRyPjx0ZD5TPC90ZD48dGQ+c21vb3RoIGN1cnZldG88L3RkPjx0ZD4oeDIgeTIgeCB5KSs8L3RkPjwvdHI+XG4gICAgICMgPHRyPjx0ZD5RPC90ZD48dGQ+cXVhZHJhdGljIELDqXppZXIgY3VydmV0bzwvdGQ+PHRkPih4MSB5MSB4IHkpKzwvdGQ+PC90cj5cbiAgICAgIyA8dHI+PHRkPlQ8L3RkPjx0ZD5zbW9vdGggcXVhZHJhdGljIELDqXppZXIgY3VydmV0bzwvdGQ+PHRkPih4IHkpKzwvdGQ+PC90cj5cbiAgICAgIyA8dHI+PHRkPkE8L3RkPjx0ZD5lbGxpcHRpY2FsIGFyYzwvdGQ+PHRkPihyeCByeSB4LWF4aXMtcm90YXRpb24gbGFyZ2UtYXJjLWZsYWcgc3dlZXAtZmxhZyB4IHkpKzwvdGQ+PC90cj5cbiAgICAgIyA8dHI+PHRkPlI8L3RkPjx0ZD48YSBocmVmPVwiaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9DYXRtdWxs4oCTUm9tX3NwbGluZSNDYXRtdWxsLkUyLjgwLjkzUm9tX3NwbGluZVwiPkNhdG11bGwtUm9tIGN1cnZldG88L2E+KjwvdGQ+PHRkPngxIHkxICh4IHkpKzwvdGQ+PC90cj48L3Rib2R5PjwvdGFibGU+XG4gICAgICogKiBfQ2F0bXVsbC1Sb20gY3VydmV0b18gaXMgYSBub3Qgc3RhbmRhcmQgU1ZHIGNvbW1hbmQgYW5kIGFkZGVkIHRvIG1ha2UgbGlmZSBlYXNpZXIuXG4gICAgICogTm90ZTogdGhlcmUgaXMgYSBzcGVjaWFsIGNhc2Ugd2hlbiBhIHBhdGggY29uc2lzdHMgb2Ygb25seSB0aHJlZSBjb21tYW5kczogYE0xMCwxMFLigKZ6YC4gSW4gdGhpcyBjYXNlIHRoZSBwYXRoIGNvbm5lY3RzIGJhY2sgdG8gaXRzIHN0YXJ0aW5nIHBvaW50LlxuICAgICA+IFVzYWdlXG4gICAgIHwgdmFyIGMgPSBwYXBlci5wYXRoKFwiTTEwIDEwTDkwIDkwXCIpO1xuICAgICB8IC8vIGRyYXcgYSBkaWFnb25hbCBsaW5lOlxuICAgICB8IC8vIG1vdmUgdG8gMTAsMTAsIGxpbmUgdG8gOTAsOTBcbiAgICBcXCovXG4gICAgcHJvdG8ucGF0aCA9IGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIHZhciBhdHRyO1xuICAgICAgICBpZiAoaXMoZCwgXCJvYmplY3RcIikgJiYgIWlzKGQsIFwiYXJyYXlcIikpIHtcbiAgICAgICAgICAgIGF0dHIgPSBkO1xuICAgICAgICB9IGVsc2UgaWYgKGQpIHtcbiAgICAgICAgICAgIGF0dHIgPSB7ZDogZH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuZWwoXCJwYXRoXCIsIGF0dHIpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFBhcGVyLmdcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIENyZWF0ZXMgYSBncm91cCBlbGVtZW50XG4gICAgICoqXG4gICAgIC0gdmFyYXJncyAo4oCmKSAjb3B0aW9uYWwgZWxlbWVudHMgdG8gbmVzdCB3aXRoaW4gdGhlIGdyb3VwXG4gICAgID0gKG9iamVjdCkgdGhlIGBnYCBlbGVtZW50XG4gICAgICoqXG4gICAgID4gVXNhZ2VcbiAgICAgfCB2YXIgYzEgPSBwYXBlci5jaXJjbGUoKSxcbiAgICAgfCAgICAgYzIgPSBwYXBlci5yZWN0KCksXG4gICAgIHwgICAgIGcgPSBwYXBlci5nKGMyLCBjMSk7IC8vIG5vdGUgdGhhdCB0aGUgb3JkZXIgb2YgZWxlbWVudHMgaXMgZGlmZmVyZW50XG4gICAgICogb3JcbiAgICAgfCB2YXIgYzEgPSBwYXBlci5jaXJjbGUoKSxcbiAgICAgfCAgICAgYzIgPSBwYXBlci5yZWN0KCksXG4gICAgIHwgICAgIGcgPSBwYXBlci5nKCk7XG4gICAgIHwgZy5hZGQoYzIsIGMxKTtcbiAgICBcXCovXG4gICAgLypcXFxuICAgICAqIFBhcGVyLmdyb3VwXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBTZWUgQFBhcGVyLmdcbiAgICBcXCovXG4gICAgcHJvdG8uZ3JvdXAgPSBwcm90by5nID0gZnVuY3Rpb24gKGZpcnN0KSB7XG4gICAgICAgIHZhciBhdHRyLFxuICAgICAgICAgICAgZWwgPSB0aGlzLmVsKFwiZ1wiKTtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT0gMSAmJiBmaXJzdCAmJiAhZmlyc3QudHlwZSkge1xuICAgICAgICAgICAgZWwuYXR0cihmaXJzdCk7XG4gICAgICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgZWwuYWRkKEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBlbDtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBQYXBlci5zdmdcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIENyZWF0ZXMgYSBuZXN0ZWQgU1ZHIGVsZW1lbnQuXG4gICAgIC0geCAobnVtYmVyKSBAb3B0aW9uYWwgWCBvZiB0aGUgZWxlbWVudFxuICAgICAtIHkgKG51bWJlcikgQG9wdGlvbmFsIFkgb2YgdGhlIGVsZW1lbnRcbiAgICAgLSB3aWR0aCAobnVtYmVyKSBAb3B0aW9uYWwgd2lkdGggb2YgdGhlIGVsZW1lbnRcbiAgICAgLSBoZWlnaHQgKG51bWJlcikgQG9wdGlvbmFsIGhlaWdodCBvZiB0aGUgZWxlbWVudFxuICAgICAtIHZieCAobnVtYmVyKSBAb3B0aW9uYWwgdmlld2JveCBYXG4gICAgIC0gdmJ5IChudW1iZXIpIEBvcHRpb25hbCB2aWV3Ym94IFlcbiAgICAgLSB2YncgKG51bWJlcikgQG9wdGlvbmFsIHZpZXdib3ggd2lkdGhcbiAgICAgLSB2YmggKG51bWJlcikgQG9wdGlvbmFsIHZpZXdib3ggaGVpZ2h0XG4gICAgICoqXG4gICAgID0gKG9iamVjdCkgdGhlIGBzdmdgIGVsZW1lbnRcbiAgICAgKipcbiAgICBcXCovXG4gICAgcHJvdG8uc3ZnID0gZnVuY3Rpb24gKHgsIHksIHdpZHRoLCBoZWlnaHQsIHZieCwgdmJ5LCB2YncsIHZiaCkge1xuICAgICAgICB2YXIgYXR0cnMgPSB7fTtcbiAgICAgICAgaWYgKGlzKHgsIFwib2JqZWN0XCIpICYmIHkgPT0gbnVsbCkge1xuICAgICAgICAgICAgYXR0cnMgPSB4O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHggIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGF0dHJzLnggPSB4O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHkgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGF0dHJzLnkgPSB5O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHdpZHRoICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBhdHRycy53aWR0aCA9IHdpZHRoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGhlaWdodCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgYXR0cnMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHZieCAhPSBudWxsICYmIHZieSAhPSBudWxsICYmIHZidyAhPSBudWxsICYmIHZiaCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgYXR0cnMudmlld0JveCA9IFt2YngsIHZieSwgdmJ3LCB2YmhdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmVsKFwic3ZnXCIsIGF0dHJzKTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBQYXBlci5tYXNrXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBFcXVpdmFsZW50IGluIGJlaGF2aW91ciB0byBAUGFwZXIuZywgZXhjZXB0IGl04oCZcyBhIG1hc2suXG4gICAgICoqXG4gICAgID0gKG9iamVjdCkgdGhlIGBtYXNrYCBlbGVtZW50XG4gICAgICoqXG4gICAgXFwqL1xuICAgIHByb3RvLm1hc2sgPSBmdW5jdGlvbiAoZmlyc3QpIHtcbiAgICAgICAgdmFyIGF0dHIsXG4gICAgICAgICAgICBlbCA9IHRoaXMuZWwoXCJtYXNrXCIpO1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAxICYmIGZpcnN0ICYmICFmaXJzdC50eXBlKSB7XG4gICAgICAgICAgICBlbC5hdHRyKGZpcnN0KTtcbiAgICAgICAgfSBlbHNlIGlmIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBlbC5hZGQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGVsO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFBhcGVyLnB0cm5cbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEVxdWl2YWxlbnQgaW4gYmVoYXZpb3VyIHRvIEBQYXBlci5nLCBleGNlcHQgaXTigJlzIGEgcGF0dGVybi5cbiAgICAgLSB4IChudW1iZXIpIEBvcHRpb25hbCBYIG9mIHRoZSBlbGVtZW50XG4gICAgIC0geSAobnVtYmVyKSBAb3B0aW9uYWwgWSBvZiB0aGUgZWxlbWVudFxuICAgICAtIHdpZHRoIChudW1iZXIpIEBvcHRpb25hbCB3aWR0aCBvZiB0aGUgZWxlbWVudFxuICAgICAtIGhlaWdodCAobnVtYmVyKSBAb3B0aW9uYWwgaGVpZ2h0IG9mIHRoZSBlbGVtZW50XG4gICAgIC0gdmJ4IChudW1iZXIpIEBvcHRpb25hbCB2aWV3Ym94IFhcbiAgICAgLSB2YnkgKG51bWJlcikgQG9wdGlvbmFsIHZpZXdib3ggWVxuICAgICAtIHZidyAobnVtYmVyKSBAb3B0aW9uYWwgdmlld2JveCB3aWR0aFxuICAgICAtIHZiaCAobnVtYmVyKSBAb3B0aW9uYWwgdmlld2JveCBoZWlnaHRcbiAgICAgKipcbiAgICAgPSAob2JqZWN0KSB0aGUgYHBhdHRlcm5gIGVsZW1lbnRcbiAgICAgKipcbiAgICBcXCovXG4gICAgcHJvdG8ucHRybiA9IGZ1bmN0aW9uICh4LCB5LCB3aWR0aCwgaGVpZ2h0LCB2eCwgdnksIHZ3LCB2aCkge1xuICAgICAgICBpZiAoaXMoeCwgXCJvYmplY3RcIikpIHtcbiAgICAgICAgICAgIHZhciBhdHRyID0geDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGF0dHIgPSB7cGF0dGVyblVuaXRzOiBcInVzZXJTcGFjZU9uVXNlXCJ9O1xuICAgICAgICAgICAgaWYgKHgpIHtcbiAgICAgICAgICAgICAgICBhdHRyLnggPSB4O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHkpIHtcbiAgICAgICAgICAgICAgICBhdHRyLnkgPSB5O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHdpZHRoICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBhdHRyLndpZHRoID0gd2lkdGg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaGVpZ2h0ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBhdHRyLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh2eCAhPSBudWxsICYmIHZ5ICE9IG51bGwgJiYgdncgIT0gbnVsbCAmJiB2aCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgYXR0ci52aWV3Qm94ID0gW3Z4LCB2eSwgdncsIHZoXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYXR0ci52aWV3Qm94ID0gW3ggfHwgMCwgeSB8fCAwLCB3aWR0aCB8fCAwLCBoZWlnaHQgfHwgMF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuZWwoXCJwYXR0ZXJuXCIsIGF0dHIpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFBhcGVyLnVzZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQ3JlYXRlcyBhIDx1c2U+IGVsZW1lbnQuXG4gICAgIC0gaWQgKHN0cmluZykgQG9wdGlvbmFsIGlkIG9mIGVsZW1lbnQgdG8gbGlua1xuICAgICAqIG9yXG4gICAgIC0gaWQgKEVsZW1lbnQpIEBvcHRpb25hbCBlbGVtZW50IHRvIGxpbmtcbiAgICAgKipcbiAgICAgPSAob2JqZWN0KSB0aGUgYHVzZWAgZWxlbWVudFxuICAgICAqKlxuICAgIFxcKi9cbiAgICBwcm90by51c2UgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgaWYgKGlkICE9IG51bGwpIHtcbiAgICAgICAgICAgIGlmIChpZCBpbnN0YW5jZW9mIEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWlkLmF0dHIoXCJpZFwiKSkge1xuICAgICAgICAgICAgICAgICAgICBpZC5hdHRyKHtpZDogU25hcC5fLmlkKGlkKX0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZCA9IGlkLmF0dHIoXCJpZFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChTdHJpbmcoaWQpLmNoYXJBdCgpID09IFwiI1wiKSB7XG4gICAgICAgICAgICAgICAgaWQgPSBpZC5zdWJzdHJpbmcoMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5lbChcInVzZVwiLCB7XCJ4bGluazpocmVmXCI6IFwiI1wiICsgaWR9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBFbGVtZW50LnByb3RvdHlwZS51c2UuY2FsbCh0aGlzKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLypcXFxuICAgICAqIFBhcGVyLnN5bWJvbFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQ3JlYXRlcyBhIDxzeW1ib2w+IGVsZW1lbnQuXG4gICAgIC0gdmJ4IChudW1iZXIpIEBvcHRpb25hbCB2aWV3Ym94IFhcbiAgICAgLSB2YnkgKG51bWJlcikgQG9wdGlvbmFsIHZpZXdib3ggWVxuICAgICAtIHZidyAobnVtYmVyKSBAb3B0aW9uYWwgdmlld2JveCB3aWR0aFxuICAgICAtIHZiaCAobnVtYmVyKSBAb3B0aW9uYWwgdmlld2JveCBoZWlnaHRcbiAgICAgPSAob2JqZWN0KSB0aGUgYHN5bWJvbGAgZWxlbWVudFxuICAgICAqKlxuICAgIFxcKi9cbiAgICBwcm90by5zeW1ib2wgPSBmdW5jdGlvbiAodngsIHZ5LCB2dywgdmgpIHtcbiAgICAgICAgdmFyIGF0dHIgPSB7fTtcbiAgICAgICAgaWYgKHZ4ICE9IG51bGwgJiYgdnkgIT0gbnVsbCAmJiB2dyAhPSBudWxsICYmIHZoICE9IG51bGwpIHtcbiAgICAgICAgICAgIGF0dHIudmlld0JveCA9IFt2eCwgdnksIHZ3LCB2aF07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5lbChcInN5bWJvbFwiLCBhdHRyKTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBQYXBlci50ZXh0XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBEcmF3cyBhIHRleHQgc3RyaW5nXG4gICAgICoqXG4gICAgIC0geCAobnVtYmVyKSB4IGNvb3JkaW5hdGUgcG9zaXRpb25cbiAgICAgLSB5IChudW1iZXIpIHkgY29vcmRpbmF0ZSBwb3NpdGlvblxuICAgICAtIHRleHQgKHN0cmluZ3xhcnJheSkgVGhlIHRleHQgc3RyaW5nIHRvIGRyYXcgb3IgYXJyYXkgb2Ygc3RyaW5ncyB0byBuZXN0IHdpdGhpbiBzZXBhcmF0ZSBgPHRzcGFuPmAgZWxlbWVudHNcbiAgICAgPSAob2JqZWN0KSB0aGUgYHRleHRgIGVsZW1lbnRcbiAgICAgKipcbiAgICAgPiBVc2FnZVxuICAgICB8IHZhciB0MSA9IHBhcGVyLnRleHQoNTAsIDUwLCBcIlNuYXBcIik7XG4gICAgIHwgdmFyIHQyID0gcGFwZXIudGV4dCg1MCwgNTAsIFtcIlNcIixcIm5cIixcImFcIixcInBcIl0pO1xuICAgICB8IC8vIFRleHQgcGF0aCB1c2FnZVxuICAgICB8IHQxLmF0dHIoe3RleHRwYXRoOiBcIk0xMCwxMEwxMDAsMTAwXCJ9KTtcbiAgICAgfCAvLyBvclxuICAgICB8IHZhciBwdGggPSBwYXBlci5wYXRoKFwiTTEwLDEwTDEwMCwxMDBcIik7XG4gICAgIHwgdDEuYXR0cih7dGV4dHBhdGg6IHB0aH0pO1xuICAgIFxcKi9cbiAgICBwcm90by50ZXh0ID0gZnVuY3Rpb24gKHgsIHksIHRleHQpIHtcbiAgICAgICAgdmFyIGF0dHIgPSB7fTtcbiAgICAgICAgaWYgKGlzKHgsIFwib2JqZWN0XCIpKSB7XG4gICAgICAgICAgICBhdHRyID0geDtcbiAgICAgICAgfSBlbHNlIGlmICh4ICE9IG51bGwpIHtcbiAgICAgICAgICAgIGF0dHIgPSB7XG4gICAgICAgICAgICAgICAgeDogeCxcbiAgICAgICAgICAgICAgICB5OiB5LFxuICAgICAgICAgICAgICAgIHRleHQ6IHRleHQgfHwgXCJcIlxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5lbChcInRleHRcIiwgYXR0cik7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUGFwZXIubGluZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogRHJhd3MgYSBsaW5lXG4gICAgICoqXG4gICAgIC0geDEgKG51bWJlcikgeCBjb29yZGluYXRlIHBvc2l0aW9uIG9mIHRoZSBzdGFydFxuICAgICAtIHkxIChudW1iZXIpIHkgY29vcmRpbmF0ZSBwb3NpdGlvbiBvZiB0aGUgc3RhcnRcbiAgICAgLSB4MiAobnVtYmVyKSB4IGNvb3JkaW5hdGUgcG9zaXRpb24gb2YgdGhlIGVuZFxuICAgICAtIHkyIChudW1iZXIpIHkgY29vcmRpbmF0ZSBwb3NpdGlvbiBvZiB0aGUgZW5kXG4gICAgID0gKG9iamVjdCkgdGhlIGBsaW5lYCBlbGVtZW50XG4gICAgICoqXG4gICAgID4gVXNhZ2VcbiAgICAgfCB2YXIgdDEgPSBwYXBlci5saW5lKDUwLCA1MCwgMTAwLCAxMDApO1xuICAgIFxcKi9cbiAgICBwcm90by5saW5lID0gZnVuY3Rpb24gKHgxLCB5MSwgeDIsIHkyKSB7XG4gICAgICAgIHZhciBhdHRyID0ge307XG4gICAgICAgIGlmIChpcyh4MSwgXCJvYmplY3RcIikpIHtcbiAgICAgICAgICAgIGF0dHIgPSB4MTtcbiAgICAgICAgfSBlbHNlIGlmICh4MSAhPSBudWxsKSB7XG4gICAgICAgICAgICBhdHRyID0ge1xuICAgICAgICAgICAgICAgIHgxOiB4MSxcbiAgICAgICAgICAgICAgICB4MjogeDIsXG4gICAgICAgICAgICAgICAgeTE6IHkxLFxuICAgICAgICAgICAgICAgIHkyOiB5MlxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5lbChcImxpbmVcIiwgYXR0cik7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUGFwZXIucG9seWxpbmVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIERyYXdzIGEgcG9seWxpbmVcbiAgICAgKipcbiAgICAgLSBwb2ludHMgKGFycmF5KSBhcnJheSBvZiBwb2ludHNcbiAgICAgKiBvclxuICAgICAtIHZhcmFyZ3MgKOKApikgcG9pbnRzXG4gICAgID0gKG9iamVjdCkgdGhlIGBwb2x5bGluZWAgZWxlbWVudFxuICAgICAqKlxuICAgICA+IFVzYWdlXG4gICAgIHwgdmFyIHAxID0gcGFwZXIucG9seWxpbmUoWzEwLCAxMCwgMTAwLCAxMDBdKTtcbiAgICAgfCB2YXIgcDIgPSBwYXBlci5wb2x5bGluZSgxMCwgMTAsIDEwMCwgMTAwKTtcbiAgICBcXCovXG4gICAgcHJvdG8ucG9seWxpbmUgPSBmdW5jdGlvbiAocG9pbnRzKSB7XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgcG9pbnRzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgYXR0ciA9IHt9O1xuICAgICAgICBpZiAoaXMocG9pbnRzLCBcIm9iamVjdFwiKSAmJiAhaXMocG9pbnRzLCBcImFycmF5XCIpKSB7XG4gICAgICAgICAgICBhdHRyID0gcG9pbnRzO1xuICAgICAgICB9IGVsc2UgaWYgKHBvaW50cyAhPSBudWxsKSB7XG4gICAgICAgICAgICBhdHRyID0ge3BvaW50czogcG9pbnRzfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5lbChcInBvbHlsaW5lXCIsIGF0dHIpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFBhcGVyLnBvbHlnb25cbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIERyYXdzIGEgcG9seWdvbi4gU2VlIEBQYXBlci5wb2x5bGluZVxuICAgIFxcKi9cbiAgICBwcm90by5wb2x5Z29uID0gZnVuY3Rpb24gKHBvaW50cykge1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgIHBvaW50cyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGF0dHIgPSB7fTtcbiAgICAgICAgaWYgKGlzKHBvaW50cywgXCJvYmplY3RcIikgJiYgIWlzKHBvaW50cywgXCJhcnJheVwiKSkge1xuICAgICAgICAgICAgYXR0ciA9IHBvaW50cztcbiAgICAgICAgfSBlbHNlIGlmIChwb2ludHMgIT0gbnVsbCkge1xuICAgICAgICAgICAgYXR0ciA9IHtwb2ludHM6IHBvaW50c307XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuZWwoXCJwb2x5Z29uXCIsIGF0dHIpO1xuICAgIH07XG4gICAgLy8gZ3JhZGllbnRzXG4gICAgKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyICQgPSBTbmFwLl8uJDtcbiAgICAgICAgLy8gZ3JhZGllbnRzJyBoZWxwZXJzXG4gICAgICAgIGZ1bmN0aW9uIEdzdG9wcygpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNlbGVjdEFsbChcInN0b3BcIik7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gR2FkZFN0b3AoY29sb3IsIG9mZnNldCkge1xuICAgICAgICAgICAgdmFyIHN0b3AgPSAkKFwic3RvcFwiKSxcbiAgICAgICAgICAgICAgICBhdHRyID0ge1xuICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6ICtvZmZzZXQgKyBcIiVcIlxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb2xvciA9IFNuYXAuY29sb3IoY29sb3IpO1xuICAgICAgICAgICAgYXR0cltcInN0b3AtY29sb3JcIl0gPSBjb2xvci5oZXg7XG4gICAgICAgICAgICBpZiAoY29sb3Iub3BhY2l0eSA8IDEpIHtcbiAgICAgICAgICAgICAgICBhdHRyW1wic3RvcC1vcGFjaXR5XCJdID0gY29sb3Iub3BhY2l0eTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICQoc3RvcCwgYXR0cik7XG4gICAgICAgICAgICB0aGlzLm5vZGUuYXBwZW5kQ2hpbGQoc3RvcCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBHZ2V0QkJveCgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnR5cGUgPT0gXCJsaW5lYXJHcmFkaWVudFwiKSB7XG4gICAgICAgICAgICAgICAgdmFyIHgxID0gJCh0aGlzLm5vZGUsIFwieDFcIikgfHwgMCxcbiAgICAgICAgICAgICAgICAgICAgeDIgPSAkKHRoaXMubm9kZSwgXCJ4MlwiKSB8fCAxLFxuICAgICAgICAgICAgICAgICAgICB5MSA9ICQodGhpcy5ub2RlLCBcInkxXCIpIHx8IDAsXG4gICAgICAgICAgICAgICAgICAgIHkyID0gJCh0aGlzLm5vZGUsIFwieTJcIikgfHwgMDtcbiAgICAgICAgICAgICAgICByZXR1cm4gU25hcC5fLmJveCh4MSwgeTEsIG1hdGguYWJzKHgyIC0geDEpLCBtYXRoLmFicyh5MiAtIHkxKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBjeCA9IHRoaXMubm9kZS5jeCB8fCAuNSxcbiAgICAgICAgICAgICAgICAgICAgY3kgPSB0aGlzLm5vZGUuY3kgfHwgLjUsXG4gICAgICAgICAgICAgICAgICAgIHIgPSB0aGlzLm5vZGUuciB8fCAwO1xuICAgICAgICAgICAgICAgIHJldHVybiBTbmFwLl8uYm94KGN4IC0gciwgY3kgLSByLCByICogMiwgciAqIDIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIGdyYWRpZW50KGRlZnMsIHN0cikge1xuICAgICAgICAgICAgdmFyIGdyYWQgPSBldmUoXCJzbmFwLnV0aWwuZ3JhZC5wYXJzZVwiLCBudWxsLCBzdHIpLmZpcnN0RGVmaW5lZCgpLFxuICAgICAgICAgICAgICAgIGVsO1xuICAgICAgICAgICAgaWYgKCFncmFkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBncmFkLnBhcmFtcy51bnNoaWZ0KGRlZnMpO1xuICAgICAgICAgICAgaWYgKGdyYWQudHlwZS50b0xvd2VyQ2FzZSgpID09IFwibFwiKSB7XG4gICAgICAgICAgICAgICAgZWwgPSBncmFkaWVudExpbmVhci5hcHBseSgwLCBncmFkLnBhcmFtcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGVsID0gZ3JhZGllbnRSYWRpYWwuYXBwbHkoMCwgZ3JhZC5wYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGdyYWQudHlwZSAhPSBncmFkLnR5cGUudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICAgICAgICAgICQoZWwubm9kZSwge1xuICAgICAgICAgICAgICAgICAgICBncmFkaWVudFVuaXRzOiBcInVzZXJTcGFjZU9uVXNlXCJcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBzdG9wcyA9IGdyYWQuc3RvcHMsXG4gICAgICAgICAgICAgICAgbGVuID0gc3RvcHMubGVuZ3RoLFxuICAgICAgICAgICAgICAgIHN0YXJ0ID0gMCxcbiAgICAgICAgICAgICAgICBqID0gMDtcbiAgICAgICAgICAgIGZ1bmN0aW9uIHNlZWQoaSwgZW5kKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0ZXAgPSAoZW5kIC0gc3RhcnQpIC8gKGkgLSBqKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrID0gajsgayA8IGk7IGsrKykge1xuICAgICAgICAgICAgICAgICAgICBzdG9wc1trXS5vZmZzZXQgPSArKCtzdGFydCArIHN0ZXAgKiAoayAtIGopKS50b0ZpeGVkKDIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBqID0gaTtcbiAgICAgICAgICAgICAgICBzdGFydCA9IGVuZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxlbi0tO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykgaWYgKFwib2Zmc2V0XCIgaW4gc3RvcHNbaV0pIHtcbiAgICAgICAgICAgICAgICBzZWVkKGksIHN0b3BzW2ldLm9mZnNldCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdG9wc1tsZW5dLm9mZnNldCA9IHN0b3BzW2xlbl0ub2Zmc2V0IHx8IDEwMDtcbiAgICAgICAgICAgIHNlZWQobGVuLCBzdG9wc1tsZW5dLm9mZnNldCk7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDw9IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0b3AgPSBzdG9wc1tpXTtcbiAgICAgICAgICAgICAgICBlbC5hZGRTdG9wKHN0b3AuY29sb3IsIHN0b3Aub2Zmc2V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBlbDtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBncmFkaWVudExpbmVhcihkZWZzLCB4MSwgeTEsIHgyLCB5Mikge1xuICAgICAgICAgICAgdmFyIGVsID0gU25hcC5fLm1ha2UoXCJsaW5lYXJHcmFkaWVudFwiLCBkZWZzKTtcbiAgICAgICAgICAgIGVsLnN0b3BzID0gR3N0b3BzO1xuICAgICAgICAgICAgZWwuYWRkU3RvcCA9IEdhZGRTdG9wO1xuICAgICAgICAgICAgZWwuZ2V0QkJveCA9IEdnZXRCQm94O1xuICAgICAgICAgICAgaWYgKHgxICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAkKGVsLm5vZGUsIHtcbiAgICAgICAgICAgICAgICAgICAgeDE6IHgxLFxuICAgICAgICAgICAgICAgICAgICB5MTogeTEsXG4gICAgICAgICAgICAgICAgICAgIHgyOiB4MixcbiAgICAgICAgICAgICAgICAgICAgeTI6IHkyXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZWw7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gZ3JhZGllbnRSYWRpYWwoZGVmcywgY3gsIGN5LCByLCBmeCwgZnkpIHtcbiAgICAgICAgICAgIHZhciBlbCA9IFNuYXAuXy5tYWtlKFwicmFkaWFsR3JhZGllbnRcIiwgZGVmcyk7XG4gICAgICAgICAgICBlbC5zdG9wcyA9IEdzdG9wcztcbiAgICAgICAgICAgIGVsLmFkZFN0b3AgPSBHYWRkU3RvcDtcbiAgICAgICAgICAgIGVsLmdldEJCb3ggPSBHZ2V0QkJveDtcbiAgICAgICAgICAgIGlmIChjeCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgJChlbC5ub2RlLCB7XG4gICAgICAgICAgICAgICAgICAgIGN4OiBjeCxcbiAgICAgICAgICAgICAgICAgICAgY3k6IGN5LFxuICAgICAgICAgICAgICAgICAgICByOiByXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZnggIT0gbnVsbCAmJiBmeSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgJChlbC5ub2RlLCB7XG4gICAgICAgICAgICAgICAgICAgIGZ4OiBmeCxcbiAgICAgICAgICAgICAgICAgICAgZnk6IGZ5XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZWw7XG4gICAgICAgIH1cbiAgICAgICAgLypcXFxuICAgICAgICAgKiBQYXBlci5ncmFkaWVudFxuICAgICAgICAgWyBtZXRob2QgXVxuICAgICAgICAgKipcbiAgICAgICAgICogQ3JlYXRlcyBhIGdyYWRpZW50IGVsZW1lbnRcbiAgICAgICAgICoqXG4gICAgICAgICAtIGdyYWRpZW50IChzdHJpbmcpIGdyYWRpZW50IGRlc2NyaXB0b3JcbiAgICAgICAgID4gR3JhZGllbnQgRGVzY3JpcHRvclxuICAgICAgICAgKiBUaGUgZ3JhZGllbnQgZGVzY3JpcHRvciBpcyBhbiBleHByZXNzaW9uIGZvcm1hdHRlZCBhc1xuICAgICAgICAgKiBmb2xsb3dzOiBgPHR5cGU+KDxjb29yZHM+KTxjb2xvcnM+YC4gIFRoZSBgPHR5cGU+YCBjYW4gYmVcbiAgICAgICAgICogZWl0aGVyIGxpbmVhciBvciByYWRpYWwuICBUaGUgdXBwZXJjYXNlIGBMYCBvciBgUmAgbGV0dGVyc1xuICAgICAgICAgKiBpbmRpY2F0ZSBhYnNvbHV0ZSBjb29yZGluYXRlcyBvZmZzZXQgZnJvbSB0aGUgU1ZHIHN1cmZhY2UuXG4gICAgICAgICAqIExvd2VyY2FzZSBgbGAgb3IgYHJgIGxldHRlcnMgaW5kaWNhdGUgY29vcmRpbmF0ZXNcbiAgICAgICAgICogY2FsY3VsYXRlZCByZWxhdGl2ZSB0byB0aGUgZWxlbWVudCB0byB3aGljaCB0aGUgZ3JhZGllbnQgaXNcbiAgICAgICAgICogYXBwbGllZC4gIENvb3JkaW5hdGVzIHNwZWNpZnkgYSBsaW5lYXIgZ3JhZGllbnQgdmVjdG9yIGFzXG4gICAgICAgICAqIGB4MWAsIGB5MWAsIGB4MmAsIGB5MmAsIG9yIGEgcmFkaWFsIGdyYWRpZW50IGFzIGBjeGAsIGBjeWAsXG4gICAgICAgICAqIGByYCBhbmQgb3B0aW9uYWwgYGZ4YCwgYGZ5YCBzcGVjaWZ5aW5nIGEgZm9jYWwgcG9pbnQgYXdheVxuICAgICAgICAgKiBmcm9tIHRoZSBjZW50ZXIgb2YgdGhlIGNpcmNsZS4gU3BlY2lmeSBgPGNvbG9ycz5gIGFzIGEgbGlzdFxuICAgICAgICAgKiBvZiBkYXNoLXNlcGFyYXRlZCBDU1MgY29sb3IgdmFsdWVzLiAgRWFjaCBjb2xvciBtYXkgYmVcbiAgICAgICAgICogZm9sbG93ZWQgYnkgYSBjdXN0b20gb2Zmc2V0IHZhbHVlLCBzZXBhcmF0ZWQgd2l0aCBhIGNvbG9uXG4gICAgICAgICAqIGNoYXJhY3Rlci5cbiAgICAgICAgID4gRXhhbXBsZXNcbiAgICAgICAgICogTGluZWFyIGdyYWRpZW50LCByZWxhdGl2ZSBmcm9tIHRvcC1sZWZ0IGNvcm5lciB0byBib3R0b20tcmlnaHRcbiAgICAgICAgICogY29ybmVyLCBmcm9tIGJsYWNrIHRocm91Z2ggcmVkIHRvIHdoaXRlOlxuICAgICAgICAgfCB2YXIgZyA9IHBhcGVyLmdyYWRpZW50KFwibCgwLCAwLCAxLCAxKSMwMDAtI2YwMC0jZmZmXCIpO1xuICAgICAgICAgKiBMaW5lYXIgZ3JhZGllbnQsIGFic29sdXRlIGZyb20gKDAsIDApIHRvICgxMDAsIDEwMCksIGZyb20gYmxhY2tcbiAgICAgICAgICogdGhyb3VnaCByZWQgYXQgMjUlIHRvIHdoaXRlOlxuICAgICAgICAgfCB2YXIgZyA9IHBhcGVyLmdyYWRpZW50KFwiTCgwLCAwLCAxMDAsIDEwMCkjMDAwLSNmMDA6MjUtI2ZmZlwiKTtcbiAgICAgICAgICogUmFkaWFsIGdyYWRpZW50LCByZWxhdGl2ZSBmcm9tIHRoZSBjZW50ZXIgb2YgdGhlIGVsZW1lbnQgd2l0aCByYWRpdXNcbiAgICAgICAgICogaGFsZiB0aGUgd2lkdGgsIGZyb20gYmxhY2sgdG8gd2hpdGU6XG4gICAgICAgICB8IHZhciBnID0gcGFwZXIuZ3JhZGllbnQoXCJyKDAuNSwgMC41LCAwLjUpIzAwMC0jZmZmXCIpO1xuICAgICAgICAgKiBUbyBhcHBseSB0aGUgZ3JhZGllbnQ6XG4gICAgICAgICB8IHBhcGVyLmNpcmNsZSg1MCwgNTAsIDQwKS5hdHRyKHtcbiAgICAgICAgIHwgICAgIGZpbGw6IGdcbiAgICAgICAgIHwgfSk7XG4gICAgICAgICA9IChvYmplY3QpIHRoZSBgZ3JhZGllbnRgIGVsZW1lbnRcbiAgICAgICAgXFwqL1xuICAgICAgICBwcm90by5ncmFkaWVudCA9IGZ1bmN0aW9uIChzdHIpIHtcbiAgICAgICAgICAgIHJldHVybiBncmFkaWVudCh0aGlzLmRlZnMsIHN0cik7XG4gICAgICAgIH07XG4gICAgICAgIHByb3RvLmdyYWRpZW50TGluZWFyID0gZnVuY3Rpb24gKHgxLCB5MSwgeDIsIHkyKSB7XG4gICAgICAgICAgICByZXR1cm4gZ3JhZGllbnRMaW5lYXIodGhpcy5kZWZzLCB4MSwgeTEsIHgyLCB5Mik7XG4gICAgICAgIH07XG4gICAgICAgIHByb3RvLmdyYWRpZW50UmFkaWFsID0gZnVuY3Rpb24gKGN4LCBjeSwgciwgZngsIGZ5KSB7XG4gICAgICAgICAgICByZXR1cm4gZ3JhZGllbnRSYWRpYWwodGhpcy5kZWZzLCBjeCwgY3ksIHIsIGZ4LCBmeSk7XG4gICAgICAgIH07XG4gICAgICAgIC8qXFxcbiAgICAgICAgICogUGFwZXIudG9TdHJpbmdcbiAgICAgICAgIFsgbWV0aG9kIF1cbiAgICAgICAgICoqXG4gICAgICAgICAqIFJldHVybnMgU1ZHIGNvZGUgZm9yIHRoZSBAUGFwZXJcbiAgICAgICAgID0gKHN0cmluZykgU1ZHIGNvZGUgZm9yIHRoZSBAUGFwZXJcbiAgICAgICAgXFwqL1xuICAgICAgICBwcm90by50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBkb2MgPSB0aGlzLm5vZGUub3duZXJEb2N1bWVudCxcbiAgICAgICAgICAgICAgICBmID0gZG9jLmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKSxcbiAgICAgICAgICAgICAgICBkID0gZG9jLmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiksXG4gICAgICAgICAgICAgICAgc3ZnID0gdGhpcy5ub2RlLmNsb25lTm9kZSh0cnVlKSxcbiAgICAgICAgICAgICAgICByZXM7XG4gICAgICAgICAgICBmLmFwcGVuZENoaWxkKGQpO1xuICAgICAgICAgICAgZC5hcHBlbmRDaGlsZChzdmcpO1xuICAgICAgICAgICAgU25hcC5fLiQoc3ZnLCB7eG1sbnM6IFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIn0pO1xuICAgICAgICAgICAgcmVzID0gZC5pbm5lckhUTUw7XG4gICAgICAgICAgICBmLnJlbW92ZUNoaWxkKGYuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9O1xuICAgICAgICAvKlxcXG4gICAgICAgICAqIFBhcGVyLnRvRGF0YVVSTFxuICAgICAgICAgWyBtZXRob2QgXVxuICAgICAgICAgKipcbiAgICAgICAgICogUmV0dXJucyBTVkcgY29kZSBmb3IgdGhlIEBQYXBlciBhcyBEYXRhIFVSSSBzdHJpbmcuXG4gICAgICAgICA9IChzdHJpbmcpIERhdGEgVVJJIHN0cmluZ1xuICAgICAgICBcXCovXG4gICAgICAgIHByb3RvLnRvRGF0YVVSTCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh3aW5kb3cgJiYgd2luZG93LmJ0b2EpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LFwiICsgYnRvYSh1bmVzY2FwZShlbmNvZGVVUklDb21wb25lbnQodGhpcykpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgLypcXFxuICAgICAgICAgKiBQYXBlci5jbGVhclxuICAgICAgICAgWyBtZXRob2QgXVxuICAgICAgICAgKipcbiAgICAgICAgICogUmVtb3ZlcyBhbGwgY2hpbGQgbm9kZXMgb2YgdGhlIHBhcGVyLCBleGNlcHQgPGRlZnM+LlxuICAgICAgICBcXCovXG4gICAgICAgIHByb3RvLmNsZWFyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm5vZGUuZmlyc3RDaGlsZCxcbiAgICAgICAgICAgICAgICBuZXh0O1xuICAgICAgICAgICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgICAgICAgICBuZXh0ID0gbm9kZS5uZXh0U2libGluZztcbiAgICAgICAgICAgICAgICBpZiAobm9kZS50YWdOYW1lICE9IFwiZGVmc1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChub2RlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBwcm90by5jbGVhci5jYWxsKHtub2RlOiBub2RlfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG5vZGUgPSBuZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0oKSk7XG59KTtcblxuLy8gQ29weXJpZ2h0IChjKSAyMDEzIEFkb2JlIFN5c3RlbXMgSW5jb3Jwb3JhdGVkLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vLyBcbi8vIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy8gXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuU25hcC5wbHVnaW4oZnVuY3Rpb24gKFNuYXAsIEVsZW1lbnQsIFBhcGVyLCBnbG9iKSB7XG4gICAgdmFyIGVscHJvdG8gPSBFbGVtZW50LnByb3RvdHlwZSxcbiAgICAgICAgaXMgPSBTbmFwLmlzLFxuICAgICAgICBjbG9uZSA9IFNuYXAuXy5jbG9uZSxcbiAgICAgICAgaGFzID0gXCJoYXNPd25Qcm9wZXJ0eVwiLFxuICAgICAgICBwMnMgPSAvLD8oW2Etel0pLD8vZ2ksXG4gICAgICAgIHRvRmxvYXQgPSBwYXJzZUZsb2F0LFxuICAgICAgICBtYXRoID0gTWF0aCxcbiAgICAgICAgUEkgPSBtYXRoLlBJLFxuICAgICAgICBtbWluID0gbWF0aC5taW4sXG4gICAgICAgIG1tYXggPSBtYXRoLm1heCxcbiAgICAgICAgcG93ID0gbWF0aC5wb3csXG4gICAgICAgIGFicyA9IG1hdGguYWJzO1xuICAgIGZ1bmN0aW9uIHBhdGhzKHBzKSB7XG4gICAgICAgIHZhciBwID0gcGF0aHMucHMgPSBwYXRocy5wcyB8fCB7fTtcbiAgICAgICAgaWYgKHBbcHNdKSB7XG4gICAgICAgICAgICBwW3BzXS5zbGVlcCA9IDEwMDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBbcHNdID0ge1xuICAgICAgICAgICAgICAgIHNsZWVwOiAxMDBcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gcCkgaWYgKHBbaGFzXShrZXkpICYmIGtleSAhPSBwcykge1xuICAgICAgICAgICAgICAgIHBba2V5XS5zbGVlcC0tO1xuICAgICAgICAgICAgICAgICFwW2tleV0uc2xlZXAgJiYgZGVsZXRlIHBba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBwW3BzXTtcbiAgICB9XG4gICAgZnVuY3Rpb24gYm94KHgsIHksIHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgICAgaWYgKHggPT0gbnVsbCkge1xuICAgICAgICAgICAgeCA9IHkgPSB3aWR0aCA9IGhlaWdodCA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHkgPT0gbnVsbCkge1xuICAgICAgICAgICAgeSA9IHgueTtcbiAgICAgICAgICAgIHdpZHRoID0geC53aWR0aDtcbiAgICAgICAgICAgIGhlaWdodCA9IHguaGVpZ2h0O1xuICAgICAgICAgICAgeCA9IHgueDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeDogeCxcbiAgICAgICAgICAgIHk6IHksXG4gICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICB3OiB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0LFxuICAgICAgICAgICAgaDogaGVpZ2h0LFxuICAgICAgICAgICAgeDI6IHggKyB3aWR0aCxcbiAgICAgICAgICAgIHkyOiB5ICsgaGVpZ2h0LFxuICAgICAgICAgICAgY3g6IHggKyB3aWR0aCAvIDIsXG4gICAgICAgICAgICBjeTogeSArIGhlaWdodCAvIDIsXG4gICAgICAgICAgICByMTogbWF0aC5taW4od2lkdGgsIGhlaWdodCkgLyAyLFxuICAgICAgICAgICAgcjI6IG1hdGgubWF4KHdpZHRoLCBoZWlnaHQpIC8gMixcbiAgICAgICAgICAgIHIwOiBtYXRoLnNxcnQod2lkdGggKiB3aWR0aCArIGhlaWdodCAqIGhlaWdodCkgLyAyLFxuICAgICAgICAgICAgcGF0aDogcmVjdFBhdGgoeCwgeSwgd2lkdGgsIGhlaWdodCksXG4gICAgICAgICAgICB2YjogW3gsIHksIHdpZHRoLCBoZWlnaHRdLmpvaW4oXCIgXCIpXG4gICAgICAgIH07XG4gICAgfVxuICAgIGZ1bmN0aW9uIHRvU3RyaW5nKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5qb2luKFwiLFwiKS5yZXBsYWNlKHAycywgXCIkMVwiKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gcGF0aENsb25lKHBhdGhBcnJheSkge1xuICAgICAgICB2YXIgcmVzID0gY2xvbmUocGF0aEFycmF5KTtcbiAgICAgICAgcmVzLnRvU3RyaW5nID0gdG9TdHJpbmc7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldFBvaW50QXRTZWdtZW50TGVuZ3RoKHAxeCwgcDF5LCBjMXgsIGMxeSwgYzJ4LCBjMnksIHAyeCwgcDJ5LCBsZW5ndGgpIHtcbiAgICAgICAgaWYgKGxlbmd0aCA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gYmV6bGVuKHAxeCwgcDF5LCBjMXgsIGMxeSwgYzJ4LCBjMnksIHAyeCwgcDJ5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmaW5kRG90c0F0U2VnbWVudChwMXgsIHAxeSwgYzF4LCBjMXksIGMyeCwgYzJ5LCBwMngsIHAyeSxcbiAgICAgICAgICAgICAgICBnZXRUb3RMZW4ocDF4LCBwMXksIGMxeCwgYzF5LCBjMngsIGMyeSwgcDJ4LCBwMnksIGxlbmd0aCkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldExlbmd0aEZhY3RvcnkoaXN0b3RhbCwgc3VicGF0aCkge1xuICAgICAgICBmdW5jdGlvbiBPKHZhbCkge1xuICAgICAgICAgICAgcmV0dXJuICsoK3ZhbCkudG9GaXhlZCgzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gU25hcC5fLmNhY2hlcihmdW5jdGlvbiAocGF0aCwgbGVuZ3RoLCBvbmx5c3RhcnQpIHtcbiAgICAgICAgICAgIGlmIChwYXRoIGluc3RhbmNlb2YgRWxlbWVudCkge1xuICAgICAgICAgICAgICAgIHBhdGggPSBwYXRoLmF0dHIoXCJkXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGF0aCA9IHBhdGgyY3VydmUocGF0aCk7XG4gICAgICAgICAgICB2YXIgeCwgeSwgcCwgbCwgc3AgPSBcIlwiLCBzdWJwYXRocyA9IHt9LCBwb2ludCxcbiAgICAgICAgICAgICAgICBsZW4gPSAwO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gcGF0aC5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgcCA9IHBhdGhbaV07XG4gICAgICAgICAgICAgICAgaWYgKHBbMF0gPT0gXCJNXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgeCA9ICtwWzFdO1xuICAgICAgICAgICAgICAgICAgICB5ID0gK3BbMl07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbCA9IGdldFBvaW50QXRTZWdtZW50TGVuZ3RoKHgsIHksIHBbMV0sIHBbMl0sIHBbM10sIHBbNF0sIHBbNV0sIHBbNl0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAobGVuICsgbCA+IGxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN1YnBhdGggJiYgIXN1YnBhdGhzLnN0YXJ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9pbnQgPSBnZXRQb2ludEF0U2VnbWVudExlbmd0aCh4LCB5LCBwWzFdLCBwWzJdLCBwWzNdLCBwWzRdLCBwWzVdLCBwWzZdLCBsZW5ndGggLSBsZW4pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNwICs9IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJDXCIgKyBPKHBvaW50LnN0YXJ0LngpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBPKHBvaW50LnN0YXJ0LnkpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBPKHBvaW50Lm0ueCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE8ocG9pbnQubS55KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTyhwb2ludC54KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTyhwb2ludC55KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9ubHlzdGFydCkge3JldHVybiBzcDt9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VicGF0aHMuc3RhcnQgPSBzcDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcCA9IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJNXCIgKyBPKHBvaW50LngpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBPKHBvaW50LnkpICsgXCJDXCIgKyBPKHBvaW50Lm4ueCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE8ocG9pbnQubi55KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTyhwb2ludC5lbmQueCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE8ocG9pbnQuZW5kLnkpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBPKHBbNV0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBPKHBbNl0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXS5qb2luKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVuICs9IGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeCA9ICtwWzVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHkgPSArcFs2XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaXN0b3RhbCAmJiAhc3VicGF0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvaW50ID0gZ2V0UG9pbnRBdFNlZ21lbnRMZW5ndGgoeCwgeSwgcFsxXSwgcFsyXSwgcFszXSwgcFs0XSwgcFs1XSwgcFs2XSwgbGVuZ3RoIC0gbGVuKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcG9pbnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbGVuICs9IGw7XG4gICAgICAgICAgICAgICAgICAgIHggPSArcFs1XTtcbiAgICAgICAgICAgICAgICAgICAgeSA9ICtwWzZdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzcCArPSBwLnNoaWZ0KCkgKyBwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3VicGF0aHMuZW5kID0gc3A7XG4gICAgICAgICAgICBwb2ludCA9IGlzdG90YWwgPyBsZW4gOiBzdWJwYXRoID8gc3VicGF0aHMgOiBmaW5kRG90c0F0U2VnbWVudCh4LCB5LCBwWzBdLCBwWzFdLCBwWzJdLCBwWzNdLCBwWzRdLCBwWzVdLCAxKTtcbiAgICAgICAgICAgIHJldHVybiBwb2ludDtcbiAgICAgICAgfSwgbnVsbCwgU25hcC5fLmNsb25lKTtcbiAgICB9XG4gICAgdmFyIGdldFRvdGFsTGVuZ3RoID0gZ2V0TGVuZ3RoRmFjdG9yeSgxKSxcbiAgICAgICAgZ2V0UG9pbnRBdExlbmd0aCA9IGdldExlbmd0aEZhY3RvcnkoKSxcbiAgICAgICAgZ2V0U3VicGF0aHNBdExlbmd0aCA9IGdldExlbmd0aEZhY3RvcnkoMCwgMSk7XG4gICAgZnVuY3Rpb24gZmluZERvdHNBdFNlZ21lbnQocDF4LCBwMXksIGMxeCwgYzF5LCBjMngsIGMyeSwgcDJ4LCBwMnksIHQpIHtcbiAgICAgICAgdmFyIHQxID0gMSAtIHQsXG4gICAgICAgICAgICB0MTMgPSBwb3codDEsIDMpLFxuICAgICAgICAgICAgdDEyID0gcG93KHQxLCAyKSxcbiAgICAgICAgICAgIHQyID0gdCAqIHQsXG4gICAgICAgICAgICB0MyA9IHQyICogdCxcbiAgICAgICAgICAgIHggPSB0MTMgKiBwMXggKyB0MTIgKiAzICogdCAqIGMxeCArIHQxICogMyAqIHQgKiB0ICogYzJ4ICsgdDMgKiBwMngsXG4gICAgICAgICAgICB5ID0gdDEzICogcDF5ICsgdDEyICogMyAqIHQgKiBjMXkgKyB0MSAqIDMgKiB0ICogdCAqIGMyeSArIHQzICogcDJ5LFxuICAgICAgICAgICAgbXggPSBwMXggKyAyICogdCAqIChjMXggLSBwMXgpICsgdDIgKiAoYzJ4IC0gMiAqIGMxeCArIHAxeCksXG4gICAgICAgICAgICBteSA9IHAxeSArIDIgKiB0ICogKGMxeSAtIHAxeSkgKyB0MiAqIChjMnkgLSAyICogYzF5ICsgcDF5KSxcbiAgICAgICAgICAgIG54ID0gYzF4ICsgMiAqIHQgKiAoYzJ4IC0gYzF4KSArIHQyICogKHAyeCAtIDIgKiBjMnggKyBjMXgpLFxuICAgICAgICAgICAgbnkgPSBjMXkgKyAyICogdCAqIChjMnkgLSBjMXkpICsgdDIgKiAocDJ5IC0gMiAqIGMyeSArIGMxeSksXG4gICAgICAgICAgICBheCA9IHQxICogcDF4ICsgdCAqIGMxeCxcbiAgICAgICAgICAgIGF5ID0gdDEgKiBwMXkgKyB0ICogYzF5LFxuICAgICAgICAgICAgY3ggPSB0MSAqIGMyeCArIHQgKiBwMngsXG4gICAgICAgICAgICBjeSA9IHQxICogYzJ5ICsgdCAqIHAyeSxcbiAgICAgICAgICAgIGFscGhhID0gKDkwIC0gbWF0aC5hdGFuMihteCAtIG54LCBteSAtIG55KSAqIDE4MCAvIFBJKTtcbiAgICAgICAgLy8gKG14ID4gbnggfHwgbXkgPCBueSkgJiYgKGFscGhhICs9IDE4MCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB4OiB4LFxuICAgICAgICAgICAgeTogeSxcbiAgICAgICAgICAgIG06IHt4OiBteCwgeTogbXl9LFxuICAgICAgICAgICAgbjoge3g6IG54LCB5OiBueX0sXG4gICAgICAgICAgICBzdGFydDoge3g6IGF4LCB5OiBheX0sXG4gICAgICAgICAgICBlbmQ6IHt4OiBjeCwgeTogY3l9LFxuICAgICAgICAgICAgYWxwaGE6IGFscGhhXG4gICAgICAgIH07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGJlemllckJCb3gocDF4LCBwMXksIGMxeCwgYzF5LCBjMngsIGMyeSwgcDJ4LCBwMnkpIHtcbiAgICAgICAgaWYgKCFTbmFwLmlzKHAxeCwgXCJhcnJheVwiKSkge1xuICAgICAgICAgICAgcDF4ID0gW3AxeCwgcDF5LCBjMXgsIGMxeSwgYzJ4LCBjMnksIHAyeCwgcDJ5XTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgYmJveCA9IGN1cnZlRGltLmFwcGx5KG51bGwsIHAxeCk7XG4gICAgICAgIHJldHVybiBib3goXG4gICAgICAgICAgICBiYm94Lm1pbi54LFxuICAgICAgICAgICAgYmJveC5taW4ueSxcbiAgICAgICAgICAgIGJib3gubWF4LnggLSBiYm94Lm1pbi54LFxuICAgICAgICAgICAgYmJveC5tYXgueSAtIGJib3gubWluLnlcbiAgICAgICAgKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gaXNQb2ludEluc2lkZUJCb3goYmJveCwgeCwgeSkge1xuICAgICAgICByZXR1cm4gIHggPj0gYmJveC54ICYmXG4gICAgICAgICAgICAgICAgeCA8PSBiYm94LnggKyBiYm94LndpZHRoICYmXG4gICAgICAgICAgICAgICAgeSA+PSBiYm94LnkgJiZcbiAgICAgICAgICAgICAgICB5IDw9IGJib3gueSArIGJib3guaGVpZ2h0O1xuICAgIH1cbiAgICBmdW5jdGlvbiBpc0JCb3hJbnRlcnNlY3QoYmJveDEsIGJib3gyKSB7XG4gICAgICAgIGJib3gxID0gYm94KGJib3gxKTtcbiAgICAgICAgYmJveDIgPSBib3goYmJveDIpO1xuICAgICAgICByZXR1cm4gaXNQb2ludEluc2lkZUJCb3goYmJveDIsIGJib3gxLngsIGJib3gxLnkpXG4gICAgICAgICAgICB8fCBpc1BvaW50SW5zaWRlQkJveChiYm94MiwgYmJveDEueDIsIGJib3gxLnkpXG4gICAgICAgICAgICB8fCBpc1BvaW50SW5zaWRlQkJveChiYm94MiwgYmJveDEueCwgYmJveDEueTIpXG4gICAgICAgICAgICB8fCBpc1BvaW50SW5zaWRlQkJveChiYm94MiwgYmJveDEueDIsIGJib3gxLnkyKVxuICAgICAgICAgICAgfHwgaXNQb2ludEluc2lkZUJCb3goYmJveDEsIGJib3gyLngsIGJib3gyLnkpXG4gICAgICAgICAgICB8fCBpc1BvaW50SW5zaWRlQkJveChiYm94MSwgYmJveDIueDIsIGJib3gyLnkpXG4gICAgICAgICAgICB8fCBpc1BvaW50SW5zaWRlQkJveChiYm94MSwgYmJveDIueCwgYmJveDIueTIpXG4gICAgICAgICAgICB8fCBpc1BvaW50SW5zaWRlQkJveChiYm94MSwgYmJveDIueDIsIGJib3gyLnkyKVxuICAgICAgICAgICAgfHwgKGJib3gxLnggPCBiYm94Mi54MiAmJiBiYm94MS54ID4gYmJveDIueFxuICAgICAgICAgICAgICAgIHx8IGJib3gyLnggPCBiYm94MS54MiAmJiBiYm94Mi54ID4gYmJveDEueClcbiAgICAgICAgICAgICYmIChiYm94MS55IDwgYmJveDIueTIgJiYgYmJveDEueSA+IGJib3gyLnlcbiAgICAgICAgICAgICAgICB8fCBiYm94Mi55IDwgYmJveDEueTIgJiYgYmJveDIueSA+IGJib3gxLnkpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBiYXNlMyh0LCBwMSwgcDIsIHAzLCBwNCkge1xuICAgICAgICB2YXIgdDEgPSAtMyAqIHAxICsgOSAqIHAyIC0gOSAqIHAzICsgMyAqIHA0LFxuICAgICAgICAgICAgdDIgPSB0ICogdDEgKyA2ICogcDEgLSAxMiAqIHAyICsgNiAqIHAzO1xuICAgICAgICByZXR1cm4gdCAqIHQyIC0gMyAqIHAxICsgMyAqIHAyO1xuICAgIH1cbiAgICBmdW5jdGlvbiBiZXpsZW4oeDEsIHkxLCB4MiwgeTIsIHgzLCB5MywgeDQsIHk0LCB6KSB7XG4gICAgICAgIGlmICh6ID09IG51bGwpIHtcbiAgICAgICAgICAgIHogPSAxO1xuICAgICAgICB9XG4gICAgICAgIHogPSB6ID4gMSA/IDEgOiB6IDwgMCA/IDAgOiB6O1xuICAgICAgICB2YXIgejIgPSB6IC8gMixcbiAgICAgICAgICAgIG4gPSAxMixcbiAgICAgICAgICAgIFR2YWx1ZXMgPSBbLS4xMjUyLC4xMjUyLC0uMzY3OCwuMzY3OCwtLjU4NzMsLjU4NzMsLS43Njk5LC43Njk5LC0uOTA0MSwuOTA0MSwtLjk4MTYsLjk4MTZdLFxuICAgICAgICAgICAgQ3ZhbHVlcyA9IFswLjI0OTEsMC4yNDkxLDAuMjMzNSwwLjIzMzUsMC4yMDMyLDAuMjAzMiwwLjE2MDEsMC4xNjAxLDAuMTA2OSwwLjEwNjksMC4wNDcyLDAuMDQ3Ml0sXG4gICAgICAgICAgICBzdW0gPSAwO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgdmFyIGN0ID0gejIgKiBUdmFsdWVzW2ldICsgejIsXG4gICAgICAgICAgICAgICAgeGJhc2UgPSBiYXNlMyhjdCwgeDEsIHgyLCB4MywgeDQpLFxuICAgICAgICAgICAgICAgIHliYXNlID0gYmFzZTMoY3QsIHkxLCB5MiwgeTMsIHk0KSxcbiAgICAgICAgICAgICAgICBjb21iID0geGJhc2UgKiB4YmFzZSArIHliYXNlICogeWJhc2U7XG4gICAgICAgICAgICBzdW0gKz0gQ3ZhbHVlc1tpXSAqIG1hdGguc3FydChjb21iKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gejIgKiBzdW07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldFRvdExlbih4MSwgeTEsIHgyLCB5MiwgeDMsIHkzLCB4NCwgeTQsIGxsKSB7XG4gICAgICAgIGlmIChsbCA8IDAgfHwgYmV6bGVuKHgxLCB5MSwgeDIsIHkyLCB4MywgeTMsIHg0LCB5NCkgPCBsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciB0ID0gMSxcbiAgICAgICAgICAgIHN0ZXAgPSB0IC8gMixcbiAgICAgICAgICAgIHQyID0gdCAtIHN0ZXAsXG4gICAgICAgICAgICBsLFxuICAgICAgICAgICAgZSA9IC4wMTtcbiAgICAgICAgbCA9IGJlemxlbih4MSwgeTEsIHgyLCB5MiwgeDMsIHkzLCB4NCwgeTQsIHQyKTtcbiAgICAgICAgd2hpbGUgKGFicyhsIC0gbGwpID4gZSkge1xuICAgICAgICAgICAgc3RlcCAvPSAyO1xuICAgICAgICAgICAgdDIgKz0gKGwgPCBsbCA/IDEgOiAtMSkgKiBzdGVwO1xuICAgICAgICAgICAgbCA9IGJlemxlbih4MSwgeTEsIHgyLCB5MiwgeDMsIHkzLCB4NCwgeTQsIHQyKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdDI7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGludGVyc2VjdCh4MSwgeTEsIHgyLCB5MiwgeDMsIHkzLCB4NCwgeTQpIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgbW1heCh4MSwgeDIpIDwgbW1pbih4MywgeDQpIHx8XG4gICAgICAgICAgICBtbWluKHgxLCB4MikgPiBtbWF4KHgzLCB4NCkgfHxcbiAgICAgICAgICAgIG1tYXgoeTEsIHkyKSA8IG1taW4oeTMsIHk0KSB8fFxuICAgICAgICAgICAgbW1pbih5MSwgeTIpID4gbW1heCh5MywgeTQpXG4gICAgICAgICkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBueCA9ICh4MSAqIHkyIC0geTEgKiB4MikgKiAoeDMgLSB4NCkgLSAoeDEgLSB4MikgKiAoeDMgKiB5NCAtIHkzICogeDQpLFxuICAgICAgICAgICAgbnkgPSAoeDEgKiB5MiAtIHkxICogeDIpICogKHkzIC0geTQpIC0gKHkxIC0geTIpICogKHgzICogeTQgLSB5MyAqIHg0KSxcbiAgICAgICAgICAgIGRlbm9taW5hdG9yID0gKHgxIC0geDIpICogKHkzIC0geTQpIC0gKHkxIC0geTIpICogKHgzIC0geDQpO1xuXG4gICAgICAgIGlmICghZGVub21pbmF0b3IpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcHggPSBueCAvIGRlbm9taW5hdG9yLFxuICAgICAgICAgICAgcHkgPSBueSAvIGRlbm9taW5hdG9yLFxuICAgICAgICAgICAgcHgyID0gK3B4LnRvRml4ZWQoMiksXG4gICAgICAgICAgICBweTIgPSArcHkudG9GaXhlZCgyKTtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgcHgyIDwgK21taW4oeDEsIHgyKS50b0ZpeGVkKDIpIHx8XG4gICAgICAgICAgICBweDIgPiArbW1heCh4MSwgeDIpLnRvRml4ZWQoMikgfHxcbiAgICAgICAgICAgIHB4MiA8ICttbWluKHgzLCB4NCkudG9GaXhlZCgyKSB8fFxuICAgICAgICAgICAgcHgyID4gK21tYXgoeDMsIHg0KS50b0ZpeGVkKDIpIHx8XG4gICAgICAgICAgICBweTIgPCArbW1pbih5MSwgeTIpLnRvRml4ZWQoMikgfHxcbiAgICAgICAgICAgIHB5MiA+ICttbWF4KHkxLCB5MikudG9GaXhlZCgyKSB8fFxuICAgICAgICAgICAgcHkyIDwgK21taW4oeTMsIHk0KS50b0ZpeGVkKDIpIHx8XG4gICAgICAgICAgICBweTIgPiArbW1heCh5MywgeTQpLnRvRml4ZWQoMilcbiAgICAgICAgKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHt4OiBweCwgeTogcHl9O1xuICAgIH1cbiAgICBmdW5jdGlvbiBpbnRlcihiZXoxLCBiZXoyKSB7XG4gICAgICAgIHJldHVybiBpbnRlckhlbHBlcihiZXoxLCBiZXoyKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gaW50ZXJDb3VudChiZXoxLCBiZXoyKSB7XG4gICAgICAgIHJldHVybiBpbnRlckhlbHBlcihiZXoxLCBiZXoyLCAxKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gaW50ZXJIZWxwZXIoYmV6MSwgYmV6MiwganVzdENvdW50KSB7XG4gICAgICAgIHZhciBiYm94MSA9IGJlemllckJCb3goYmV6MSksXG4gICAgICAgICAgICBiYm94MiA9IGJlemllckJCb3goYmV6Mik7XG4gICAgICAgIGlmICghaXNCQm94SW50ZXJzZWN0KGJib3gxLCBiYm94MikpIHtcbiAgICAgICAgICAgIHJldHVybiBqdXN0Q291bnQgPyAwIDogW107XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGwxID0gYmV6bGVuLmFwcGx5KDAsIGJlejEpLFxuICAgICAgICAgICAgbDIgPSBiZXpsZW4uYXBwbHkoMCwgYmV6MiksXG4gICAgICAgICAgICBuMSA9IH5+KGwxIC8gOCksXG4gICAgICAgICAgICBuMiA9IH5+KGwyIC8gOCksXG4gICAgICAgICAgICBkb3RzMSA9IFtdLFxuICAgICAgICAgICAgZG90czIgPSBbXSxcbiAgICAgICAgICAgIHh5ID0ge30sXG4gICAgICAgICAgICByZXMgPSBqdXN0Q291bnQgPyAwIDogW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjEgKyAxOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBwID0gZmluZERvdHNBdFNlZ21lbnQuYXBwbHkoMCwgYmV6MS5jb25jYXQoaSAvIG4xKSk7XG4gICAgICAgICAgICBkb3RzMS5wdXNoKHt4OiBwLngsIHk6IHAueSwgdDogaSAvIG4xfSk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IG4yICsgMTsgaSsrKSB7XG4gICAgICAgICAgICBwID0gZmluZERvdHNBdFNlZ21lbnQuYXBwbHkoMCwgYmV6Mi5jb25jYXQoaSAvIG4yKSk7XG4gICAgICAgICAgICBkb3RzMi5wdXNoKHt4OiBwLngsIHk6IHAueSwgdDogaSAvIG4yfSk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IG4xOyBpKyspIHtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgbjI7IGorKykge1xuICAgICAgICAgICAgICAgIHZhciBkaSA9IGRvdHMxW2ldLFxuICAgICAgICAgICAgICAgICAgICBkaTEgPSBkb3RzMVtpICsgMV0sXG4gICAgICAgICAgICAgICAgICAgIGRqID0gZG90czJbal0sXG4gICAgICAgICAgICAgICAgICAgIGRqMSA9IGRvdHMyW2ogKyAxXSxcbiAgICAgICAgICAgICAgICAgICAgY2kgPSBhYnMoZGkxLnggLSBkaS54KSA8IC4wMDEgPyBcInlcIiA6IFwieFwiLFxuICAgICAgICAgICAgICAgICAgICBjaiA9IGFicyhkajEueCAtIGRqLngpIDwgLjAwMSA/IFwieVwiIDogXCJ4XCIsXG4gICAgICAgICAgICAgICAgICAgIGlzID0gaW50ZXJzZWN0KGRpLngsIGRpLnksIGRpMS54LCBkaTEueSwgZGoueCwgZGoueSwgZGoxLngsIGRqMS55KTtcbiAgICAgICAgICAgICAgICBpZiAoaXMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHh5W2lzLngudG9GaXhlZCg0KV0gPT0gaXMueS50b0ZpeGVkKDQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB4eVtpcy54LnRvRml4ZWQoNCldID0gaXMueS50b0ZpeGVkKDQpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdDEgPSBkaS50ICsgYWJzKChpc1tjaV0gLSBkaVtjaV0pIC8gKGRpMVtjaV0gLSBkaVtjaV0pKSAqIChkaTEudCAtIGRpLnQpLFxuICAgICAgICAgICAgICAgICAgICAgICAgdDIgPSBkai50ICsgYWJzKChpc1tjal0gLSBkaltjal0pIC8gKGRqMVtjal0gLSBkaltjal0pKSAqIChkajEudCAtIGRqLnQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodDEgPj0gMCAmJiB0MSA8PSAxICYmIHQyID49IDAgJiYgdDIgPD0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGp1c3RDb3VudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcysrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6IGlzLngsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6IGlzLnksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHQxOiB0MSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdDI6IHQyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG4gICAgZnVuY3Rpb24gcGF0aEludGVyc2VjdGlvbihwYXRoMSwgcGF0aDIpIHtcbiAgICAgICAgcmV0dXJuIGludGVyUGF0aEhlbHBlcihwYXRoMSwgcGF0aDIpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBwYXRoSW50ZXJzZWN0aW9uTnVtYmVyKHBhdGgxLCBwYXRoMikge1xuICAgICAgICByZXR1cm4gaW50ZXJQYXRoSGVscGVyKHBhdGgxLCBwYXRoMiwgMSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGludGVyUGF0aEhlbHBlcihwYXRoMSwgcGF0aDIsIGp1c3RDb3VudCkge1xuICAgICAgICBwYXRoMSA9IHBhdGgyY3VydmUocGF0aDEpO1xuICAgICAgICBwYXRoMiA9IHBhdGgyY3VydmUocGF0aDIpO1xuICAgICAgICB2YXIgeDEsIHkxLCB4MiwgeTIsIHgxbSwgeTFtLCB4Mm0sIHkybSwgYmV6MSwgYmV6MixcbiAgICAgICAgICAgIHJlcyA9IGp1c3RDb3VudCA/IDAgOiBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gcGF0aDEubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgdmFyIHBpID0gcGF0aDFbaV07XG4gICAgICAgICAgICBpZiAocGlbMF0gPT0gXCJNXCIpIHtcbiAgICAgICAgICAgICAgICB4MSA9IHgxbSA9IHBpWzFdO1xuICAgICAgICAgICAgICAgIHkxID0geTFtID0gcGlbMl07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChwaVswXSA9PSBcIkNcIikge1xuICAgICAgICAgICAgICAgICAgICBiZXoxID0gW3gxLCB5MV0uY29uY2F0KHBpLnNsaWNlKDEpKTtcbiAgICAgICAgICAgICAgICAgICAgeDEgPSBiZXoxWzZdO1xuICAgICAgICAgICAgICAgICAgICB5MSA9IGJlejFbN107XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYmV6MSA9IFt4MSwgeTEsIHgxLCB5MSwgeDFtLCB5MW0sIHgxbSwgeTFtXTtcbiAgICAgICAgICAgICAgICAgICAgeDEgPSB4MW07XG4gICAgICAgICAgICAgICAgICAgIHkxID0geTFtO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMCwgamogPSBwYXRoMi5sZW5ndGg7IGogPCBqajsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwaiA9IHBhdGgyW2pdO1xuICAgICAgICAgICAgICAgICAgICBpZiAocGpbMF0gPT0gXCJNXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHgyID0geDJtID0gcGpbMV07XG4gICAgICAgICAgICAgICAgICAgICAgICB5MiA9IHkybSA9IHBqWzJdO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBqWzBdID09IFwiQ1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmV6MiA9IFt4MiwgeTJdLmNvbmNhdChwai5zbGljZSgxKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeDIgPSBiZXoyWzZdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHkyID0gYmV6Mls3XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmV6MiA9IFt4MiwgeTIsIHgyLCB5MiwgeDJtLCB5Mm0sIHgybSwgeTJtXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4MiA9IHgybTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB5MiA9IHkybTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbnRyID0gaW50ZXJIZWxwZXIoYmV6MSwgYmV6MiwganVzdENvdW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChqdXN0Q291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMgKz0gaW50cjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgayA9IDAsIGtrID0gaW50ci5sZW5ndGg7IGsgPCBrazsgaysrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludHJba10uc2VnbWVudDEgPSBpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnRyW2tdLnNlZ21lbnQyID0gajtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW50cltrXS5iZXoxID0gYmV6MTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW50cltrXS5iZXoyID0gYmV6MjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzID0gcmVzLmNvbmNhdChpbnRyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cbiAgICBmdW5jdGlvbiBpc1BvaW50SW5zaWRlUGF0aChwYXRoLCB4LCB5KSB7XG4gICAgICAgIHZhciBiYm94ID0gcGF0aEJCb3gocGF0aCk7XG4gICAgICAgIHJldHVybiBpc1BvaW50SW5zaWRlQkJveChiYm94LCB4LCB5KSAmJlxuICAgICAgICAgICAgICAgaW50ZXJQYXRoSGVscGVyKHBhdGgsIFtbXCJNXCIsIHgsIHldLCBbXCJIXCIsIGJib3gueDIgKyAxMF1dLCAxKSAlIDIgPT0gMTtcbiAgICB9XG4gICAgZnVuY3Rpb24gcGF0aEJCb3gocGF0aCkge1xuICAgICAgICB2YXIgcHRoID0gcGF0aHMocGF0aCk7XG4gICAgICAgIGlmIChwdGguYmJveCkge1xuICAgICAgICAgICAgcmV0dXJuIGNsb25lKHB0aC5iYm94KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXBhdGgpIHtcbiAgICAgICAgICAgIHJldHVybiBib3goKTtcbiAgICAgICAgfVxuICAgICAgICBwYXRoID0gcGF0aDJjdXJ2ZShwYXRoKTtcbiAgICAgICAgdmFyIHggPSAwLCBcbiAgICAgICAgICAgIHkgPSAwLFxuICAgICAgICAgICAgWCA9IFtdLFxuICAgICAgICAgICAgWSA9IFtdLFxuICAgICAgICAgICAgcDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gcGF0aC5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICBwID0gcGF0aFtpXTtcbiAgICAgICAgICAgIGlmIChwWzBdID09IFwiTVwiKSB7XG4gICAgICAgICAgICAgICAgeCA9IHBbMV07XG4gICAgICAgICAgICAgICAgeSA9IHBbMl07XG4gICAgICAgICAgICAgICAgWC5wdXNoKHgpO1xuICAgICAgICAgICAgICAgIFkucHVzaCh5KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIGRpbSA9IGN1cnZlRGltKHgsIHksIHBbMV0sIHBbMl0sIHBbM10sIHBbNF0sIHBbNV0sIHBbNl0pO1xuICAgICAgICAgICAgICAgIFggPSBYLmNvbmNhdChkaW0ubWluLngsIGRpbS5tYXgueCk7XG4gICAgICAgICAgICAgICAgWSA9IFkuY29uY2F0KGRpbS5taW4ueSwgZGltLm1heC55KTtcbiAgICAgICAgICAgICAgICB4ID0gcFs1XTtcbiAgICAgICAgICAgICAgICB5ID0gcFs2XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgeG1pbiA9IG1taW4uYXBwbHkoMCwgWCksXG4gICAgICAgICAgICB5bWluID0gbW1pbi5hcHBseSgwLCBZKSxcbiAgICAgICAgICAgIHhtYXggPSBtbWF4LmFwcGx5KDAsIFgpLFxuICAgICAgICAgICAgeW1heCA9IG1tYXguYXBwbHkoMCwgWSksXG4gICAgICAgICAgICBiYiA9IGJveCh4bWluLCB5bWluLCB4bWF4IC0geG1pbiwgeW1heCAtIHltaW4pO1xuICAgICAgICBwdGguYmJveCA9IGNsb25lKGJiKTtcbiAgICAgICAgcmV0dXJuIGJiO1xuICAgIH1cbiAgICBmdW5jdGlvbiByZWN0UGF0aCh4LCB5LCB3LCBoLCByKSB7XG4gICAgICAgIGlmIChyKSB7XG4gICAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgIFtcIk1cIiwgK3ggKyAoK3IpLCB5XSxcbiAgICAgICAgICAgICAgICBbXCJsXCIsIHcgLSByICogMiwgMF0sXG4gICAgICAgICAgICAgICAgW1wiYVwiLCByLCByLCAwLCAwLCAxLCByLCByXSxcbiAgICAgICAgICAgICAgICBbXCJsXCIsIDAsIGggLSByICogMl0sXG4gICAgICAgICAgICAgICAgW1wiYVwiLCByLCByLCAwLCAwLCAxLCAtciwgcl0sXG4gICAgICAgICAgICAgICAgW1wibFwiLCByICogMiAtIHcsIDBdLFxuICAgICAgICAgICAgICAgIFtcImFcIiwgciwgciwgMCwgMCwgMSwgLXIsIC1yXSxcbiAgICAgICAgICAgICAgICBbXCJsXCIsIDAsIHIgKiAyIC0gaF0sXG4gICAgICAgICAgICAgICAgW1wiYVwiLCByLCByLCAwLCAwLCAxLCByLCAtcl0sXG4gICAgICAgICAgICAgICAgW1wielwiXVxuICAgICAgICAgICAgXTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmVzID0gW1tcIk1cIiwgeCwgeV0sIFtcImxcIiwgdywgMF0sIFtcImxcIiwgMCwgaF0sIFtcImxcIiwgLXcsIDBdLCBbXCJ6XCJdXTtcbiAgICAgICAgcmVzLnRvU3RyaW5nID0gdG9TdHJpbmc7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGVsbGlwc2VQYXRoKHgsIHksIHJ4LCByeSwgYSkge1xuICAgICAgICBpZiAoYSA9PSBudWxsICYmIHJ5ID09IG51bGwpIHtcbiAgICAgICAgICAgIHJ5ID0gcng7XG4gICAgICAgIH1cbiAgICAgICAgeCA9ICt4O1xuICAgICAgICB5ID0gK3k7XG4gICAgICAgIHJ4ID0gK3J4O1xuICAgICAgICByeSA9ICtyeTtcbiAgICAgICAgaWYgKGEgIT0gbnVsbCkge1xuICAgICAgICAgICAgdmFyIHJhZCA9IE1hdGguUEkgLyAxODAsXG4gICAgICAgICAgICAgICAgeDEgPSB4ICsgcnggKiBNYXRoLmNvcygtcnkgKiByYWQpLFxuICAgICAgICAgICAgICAgIHgyID0geCArIHJ4ICogTWF0aC5jb3MoLWEgKiByYWQpLFxuICAgICAgICAgICAgICAgIHkxID0geSArIHJ4ICogTWF0aC5zaW4oLXJ5ICogcmFkKSxcbiAgICAgICAgICAgICAgICB5MiA9IHkgKyByeCAqIE1hdGguc2luKC1hICogcmFkKSxcbiAgICAgICAgICAgICAgICByZXMgPSBbW1wiTVwiLCB4MSwgeTFdLCBbXCJBXCIsIHJ4LCByeCwgMCwgKyhhIC0gcnkgPiAxODApLCAwLCB4MiwgeTJdXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlcyA9IFtcbiAgICAgICAgICAgICAgICBbXCJNXCIsIHgsIHldLFxuICAgICAgICAgICAgICAgIFtcIm1cIiwgMCwgLXJ5XSxcbiAgICAgICAgICAgICAgICBbXCJhXCIsIHJ4LCByeSwgMCwgMSwgMSwgMCwgMiAqIHJ5XSxcbiAgICAgICAgICAgICAgICBbXCJhXCIsIHJ4LCByeSwgMCwgMSwgMSwgMCwgLTIgKiByeV0sXG4gICAgICAgICAgICAgICAgW1wielwiXVxuICAgICAgICAgICAgXTtcbiAgICAgICAgfVxuICAgICAgICByZXMudG9TdHJpbmcgPSB0b1N0cmluZztcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG4gICAgdmFyIHVuaXQycHggPSBTbmFwLl91bml0MnB4LFxuICAgICAgICBnZXRQYXRoID0ge1xuICAgICAgICBwYXRoOiBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgIHJldHVybiBlbC5hdHRyKFwicGF0aFwiKTtcbiAgICAgICAgfSxcbiAgICAgICAgY2lyY2xlOiBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgIHZhciBhdHRyID0gdW5pdDJweChlbCk7XG4gICAgICAgICAgICByZXR1cm4gZWxsaXBzZVBhdGgoYXR0ci5jeCwgYXR0ci5jeSwgYXR0ci5yKTtcbiAgICAgICAgfSxcbiAgICAgICAgZWxsaXBzZTogZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICB2YXIgYXR0ciA9IHVuaXQycHgoZWwpO1xuICAgICAgICAgICAgcmV0dXJuIGVsbGlwc2VQYXRoKGF0dHIuY3ggfHwgMCwgYXR0ci5jeSB8fCAwLCBhdHRyLnJ4LCBhdHRyLnJ5KTtcbiAgICAgICAgfSxcbiAgICAgICAgcmVjdDogZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICB2YXIgYXR0ciA9IHVuaXQycHgoZWwpO1xuICAgICAgICAgICAgcmV0dXJuIHJlY3RQYXRoKGF0dHIueCB8fCAwLCBhdHRyLnkgfHwgMCwgYXR0ci53aWR0aCwgYXR0ci5oZWlnaHQsIGF0dHIucngsIGF0dHIucnkpO1xuICAgICAgICB9LFxuICAgICAgICBpbWFnZTogZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICB2YXIgYXR0ciA9IHVuaXQycHgoZWwpO1xuICAgICAgICAgICAgcmV0dXJuIHJlY3RQYXRoKGF0dHIueCB8fCAwLCBhdHRyLnkgfHwgMCwgYXR0ci53aWR0aCwgYXR0ci5oZWlnaHQpO1xuICAgICAgICB9LFxuICAgICAgICBsaW5lOiBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgIHJldHVybiBcIk1cIiArIFtlbC5hdHRyKFwieDFcIikgfHwgMCwgZWwuYXR0cihcInkxXCIpIHx8IDAsIGVsLmF0dHIoXCJ4MlwiKSwgZWwuYXR0cihcInkyXCIpXTtcbiAgICAgICAgfSxcbiAgICAgICAgcG9seWxpbmU6IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgcmV0dXJuIFwiTVwiICsgZWwuYXR0cihcInBvaW50c1wiKTtcbiAgICAgICAgfSxcbiAgICAgICAgcG9seWdvbjogZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJNXCIgKyBlbC5hdHRyKFwicG9pbnRzXCIpICsgXCJ6XCI7XG4gICAgICAgIH0sXG4gICAgICAgIGRlZmx0OiBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgIHZhciBiYm94ID0gZWwubm9kZS5nZXRCQm94KCk7XG4gICAgICAgICAgICByZXR1cm4gcmVjdFBhdGgoYmJveC54LCBiYm94LnksIGJib3gud2lkdGgsIGJib3guaGVpZ2h0KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgZnVuY3Rpb24gcGF0aFRvUmVsYXRpdmUocGF0aEFycmF5KSB7XG4gICAgICAgIHZhciBwdGggPSBwYXRocyhwYXRoQXJyYXkpLFxuICAgICAgICAgICAgbG93ZXJDYXNlID0gU3RyaW5nLnByb3RvdHlwZS50b0xvd2VyQ2FzZTtcbiAgICAgICAgaWYgKHB0aC5yZWwpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXRoQ2xvbmUocHRoLnJlbCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFTbmFwLmlzKHBhdGhBcnJheSwgXCJhcnJheVwiKSB8fCAhU25hcC5pcyhwYXRoQXJyYXkgJiYgcGF0aEFycmF5WzBdLCBcImFycmF5XCIpKSB7XG4gICAgICAgICAgICBwYXRoQXJyYXkgPSBTbmFwLnBhcnNlUGF0aFN0cmluZyhwYXRoQXJyYXkpO1xuICAgICAgICB9XG4gICAgICAgIHZhciByZXMgPSBbXSxcbiAgICAgICAgICAgIHggPSAwLFxuICAgICAgICAgICAgeSA9IDAsXG4gICAgICAgICAgICBteCA9IDAsXG4gICAgICAgICAgICBteSA9IDAsXG4gICAgICAgICAgICBzdGFydCA9IDA7XG4gICAgICAgIGlmIChwYXRoQXJyYXlbMF1bMF0gPT0gXCJNXCIpIHtcbiAgICAgICAgICAgIHggPSBwYXRoQXJyYXlbMF1bMV07XG4gICAgICAgICAgICB5ID0gcGF0aEFycmF5WzBdWzJdO1xuICAgICAgICAgICAgbXggPSB4O1xuICAgICAgICAgICAgbXkgPSB5O1xuICAgICAgICAgICAgc3RhcnQrKztcbiAgICAgICAgICAgIHJlcy5wdXNoKFtcIk1cIiwgeCwgeV0pO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGkgPSBzdGFydCwgaWkgPSBwYXRoQXJyYXkubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgdmFyIHIgPSByZXNbaV0gPSBbXSxcbiAgICAgICAgICAgICAgICBwYSA9IHBhdGhBcnJheVtpXTtcbiAgICAgICAgICAgIGlmIChwYVswXSAhPSBsb3dlckNhc2UuY2FsbChwYVswXSkpIHtcbiAgICAgICAgICAgICAgICByWzBdID0gbG93ZXJDYXNlLmNhbGwocGFbMF0pO1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoclswXSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiYVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgclsxXSA9IHBhWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgclsyXSA9IHBhWzJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgclszXSA9IHBhWzNdO1xuICAgICAgICAgICAgICAgICAgICAgICAgcls0XSA9IHBhWzRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgcls1XSA9IHBhWzVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgcls2XSA9ICsocGFbNl0gLSB4KS50b0ZpeGVkKDMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcls3XSA9ICsocGFbN10gLSB5KS50b0ZpeGVkKDMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJ2XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICByWzFdID0gKyhwYVsxXSAtIHkpLnRvRml4ZWQoMyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIm1cIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIG14ID0gcGFbMV07XG4gICAgICAgICAgICAgICAgICAgICAgICBteSA9IHBhWzJdO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDEsIGpqID0gcGEubGVuZ3RoOyBqIDwgamo7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJbal0gPSArKHBhW2pdIC0gKChqICUgMikgPyB4IDogeSkpLnRvRml4ZWQoMyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByID0gcmVzW2ldID0gW107XG4gICAgICAgICAgICAgICAgaWYgKHBhWzBdID09IFwibVwiKSB7XG4gICAgICAgICAgICAgICAgICAgIG14ID0gcGFbMV0gKyB4O1xuICAgICAgICAgICAgICAgICAgICBteSA9IHBhWzJdICsgeTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgayA9IDAsIGtrID0gcGEubGVuZ3RoOyBrIDwga2s7IGsrKykge1xuICAgICAgICAgICAgICAgICAgICByZXNbaV1ba10gPSBwYVtrXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgbGVuID0gcmVzW2ldLmxlbmd0aDtcbiAgICAgICAgICAgIHN3aXRjaCAocmVzW2ldWzBdKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBcInpcIjpcbiAgICAgICAgICAgICAgICAgICAgeCA9IG14O1xuICAgICAgICAgICAgICAgICAgICB5ID0gbXk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJoXCI6XG4gICAgICAgICAgICAgICAgICAgIHggKz0gK3Jlc1tpXVtsZW4gLSAxXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcInZcIjpcbiAgICAgICAgICAgICAgICAgICAgeSArPSArcmVzW2ldW2xlbiAtIDFdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICB4ICs9ICtyZXNbaV1bbGVuIC0gMl07XG4gICAgICAgICAgICAgICAgICAgIHkgKz0gK3Jlc1tpXVtsZW4gLSAxXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXMudG9TdHJpbmcgPSB0b1N0cmluZztcbiAgICAgICAgcHRoLnJlbCA9IHBhdGhDbG9uZShyZXMpO1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cbiAgICBmdW5jdGlvbiBwYXRoVG9BYnNvbHV0ZShwYXRoQXJyYXkpIHtcbiAgICAgICAgdmFyIHB0aCA9IHBhdGhzKHBhdGhBcnJheSk7XG4gICAgICAgIGlmIChwdGguYWJzKSB7XG4gICAgICAgICAgICByZXR1cm4gcGF0aENsb25lKHB0aC5hYnMpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaXMocGF0aEFycmF5LCBcImFycmF5XCIpIHx8ICFpcyhwYXRoQXJyYXkgJiYgcGF0aEFycmF5WzBdLCBcImFycmF5XCIpKSB7IC8vIHJvdWdoIGFzc3VtcHRpb25cbiAgICAgICAgICAgIHBhdGhBcnJheSA9IFNuYXAucGFyc2VQYXRoU3RyaW5nKHBhdGhBcnJheSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFwYXRoQXJyYXkgfHwgIXBhdGhBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBbW1wiTVwiLCAwLCAwXV07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHJlcyA9IFtdLFxuICAgICAgICAgICAgeCA9IDAsXG4gICAgICAgICAgICB5ID0gMCxcbiAgICAgICAgICAgIG14ID0gMCxcbiAgICAgICAgICAgIG15ID0gMCxcbiAgICAgICAgICAgIHN0YXJ0ID0gMCxcbiAgICAgICAgICAgIHBhMDtcbiAgICAgICAgaWYgKHBhdGhBcnJheVswXVswXSA9PSBcIk1cIikge1xuICAgICAgICAgICAgeCA9ICtwYXRoQXJyYXlbMF1bMV07XG4gICAgICAgICAgICB5ID0gK3BhdGhBcnJheVswXVsyXTtcbiAgICAgICAgICAgIG14ID0geDtcbiAgICAgICAgICAgIG15ID0geTtcbiAgICAgICAgICAgIHN0YXJ0Kys7XG4gICAgICAgICAgICByZXNbMF0gPSBbXCJNXCIsIHgsIHldO1xuICAgICAgICB9XG4gICAgICAgIHZhciBjcnogPSBwYXRoQXJyYXkubGVuZ3RoID09IDMgJiZcbiAgICAgICAgICAgIHBhdGhBcnJheVswXVswXSA9PSBcIk1cIiAmJlxuICAgICAgICAgICAgcGF0aEFycmF5WzFdWzBdLnRvVXBwZXJDYXNlKCkgPT0gXCJSXCIgJiZcbiAgICAgICAgICAgIHBhdGhBcnJheVsyXVswXS50b1VwcGVyQ2FzZSgpID09IFwiWlwiO1xuICAgICAgICBmb3IgKHZhciByLCBwYSwgaSA9IHN0YXJ0LCBpaSA9IHBhdGhBcnJheS5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICByZXMucHVzaChyID0gW10pO1xuICAgICAgICAgICAgcGEgPSBwYXRoQXJyYXlbaV07XG4gICAgICAgICAgICBwYTAgPSBwYVswXTtcbiAgICAgICAgICAgIGlmIChwYTAgIT0gcGEwLnRvVXBwZXJDYXNlKCkpIHtcbiAgICAgICAgICAgICAgICByWzBdID0gcGEwLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChyWzBdKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJBXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICByWzFdID0gcGFbMV07XG4gICAgICAgICAgICAgICAgICAgICAgICByWzJdID0gcGFbMl07XG4gICAgICAgICAgICAgICAgICAgICAgICByWzNdID0gcGFbM107XG4gICAgICAgICAgICAgICAgICAgICAgICByWzRdID0gcGFbNF07XG4gICAgICAgICAgICAgICAgICAgICAgICByWzVdID0gcGFbNV07XG4gICAgICAgICAgICAgICAgICAgICAgICByWzZdID0gK3BhWzZdICsgeDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJbN10gPSArcGFbN10gKyB5O1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJWXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICByWzFdID0gK3BhWzFdICsgeTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiSFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgclsxXSA9ICtwYVsxXSArIHg7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlJcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkb3RzID0gW3gsIHldLmNvbmNhdChwYS5zbGljZSgxKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMiwgamogPSBkb3RzLmxlbmd0aDsgaiA8IGpqOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb3RzW2pdID0gK2RvdHNbal0gKyB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvdHNbKytqXSA9ICtkb3RzW2pdICsgeTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcyA9IHJlcy5jb25jYXQoY2F0bXVsbFJvbTJiZXppZXIoZG90cywgY3J6KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIk9cIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvdHMgPSBlbGxpcHNlUGF0aCh4LCB5LCBwYVsxXSwgcGFbMl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgZG90cy5wdXNoKGRvdHNbMF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzID0gcmVzLmNvbmNhdChkb3RzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiVVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzID0gcmVzLmNvbmNhdChlbGxpcHNlUGF0aCh4LCB5LCBwYVsxXSwgcGFbMl0sIHBhWzNdKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByID0gW1wiVVwiXS5jb25jYXQocmVzW3Jlcy5sZW5ndGggLSAxXS5zbGljZSgtMikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJNXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBteCA9ICtwYVsxXSArIHg7XG4gICAgICAgICAgICAgICAgICAgICAgICBteSA9ICtwYVsyXSArIHk7XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAxLCBqaiA9IHBhLmxlbmd0aDsgaiA8IGpqOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByW2pdID0gK3BhW2pdICsgKChqICUgMikgPyB4IDogeSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChwYTAgPT0gXCJSXCIpIHtcbiAgICAgICAgICAgICAgICBkb3RzID0gW3gsIHldLmNvbmNhdChwYS5zbGljZSgxKSk7XG4gICAgICAgICAgICAgICAgcmVzLnBvcCgpO1xuICAgICAgICAgICAgICAgIHJlcyA9IHJlcy5jb25jYXQoY2F0bXVsbFJvbTJiZXppZXIoZG90cywgY3J6KSk7XG4gICAgICAgICAgICAgICAgciA9IFtcIlJcIl0uY29uY2F0KHBhLnNsaWNlKC0yKSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHBhMCA9PSBcIk9cIikge1xuICAgICAgICAgICAgICAgIHJlcy5wb3AoKTtcbiAgICAgICAgICAgICAgICBkb3RzID0gZWxsaXBzZVBhdGgoeCwgeSwgcGFbMV0sIHBhWzJdKTtcbiAgICAgICAgICAgICAgICBkb3RzLnB1c2goZG90c1swXSk7XG4gICAgICAgICAgICAgICAgcmVzID0gcmVzLmNvbmNhdChkb3RzKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocGEwID09IFwiVVwiKSB7XG4gICAgICAgICAgICAgICAgcmVzLnBvcCgpO1xuICAgICAgICAgICAgICAgIHJlcyA9IHJlcy5jb25jYXQoZWxsaXBzZVBhdGgoeCwgeSwgcGFbMV0sIHBhWzJdLCBwYVszXSkpO1xuICAgICAgICAgICAgICAgIHIgPSBbXCJVXCJdLmNvbmNhdChyZXNbcmVzLmxlbmd0aCAtIDFdLnNsaWNlKC0yKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGsgPSAwLCBrayA9IHBhLmxlbmd0aDsgayA8IGtrOyBrKyspIHtcbiAgICAgICAgICAgICAgICAgICAgcltrXSA9IHBhW2tdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhMCA9IHBhMC50b1VwcGVyQ2FzZSgpO1xuICAgICAgICAgICAgaWYgKHBhMCAhPSBcIk9cIikge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoclswXSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiWlwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgeCA9ICtteDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHkgPSArbXk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkhcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHggPSByWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJWXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICB5ID0gclsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiTVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgbXggPSByW3IubGVuZ3RoIC0gMl07XG4gICAgICAgICAgICAgICAgICAgICAgICBteSA9IHJbci5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIHggPSByW3IubGVuZ3RoIC0gMl07XG4gICAgICAgICAgICAgICAgICAgICAgICB5ID0gcltyLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXMudG9TdHJpbmcgPSB0b1N0cmluZztcbiAgICAgICAgcHRoLmFicyA9IHBhdGhDbG9uZShyZXMpO1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cbiAgICBmdW5jdGlvbiBsMmMoeDEsIHkxLCB4MiwgeTIpIHtcbiAgICAgICAgcmV0dXJuIFt4MSwgeTEsIHgyLCB5MiwgeDIsIHkyXTtcbiAgICB9XG4gICAgZnVuY3Rpb24gcTJjKHgxLCB5MSwgYXgsIGF5LCB4MiwgeTIpIHtcbiAgICAgICAgdmFyIF8xMyA9IDEgLyAzLFxuICAgICAgICAgICAgXzIzID0gMiAvIDM7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAgICAgXzEzICogeDEgKyBfMjMgKiBheCxcbiAgICAgICAgICAgICAgICBfMTMgKiB5MSArIF8yMyAqIGF5LFxuICAgICAgICAgICAgICAgIF8xMyAqIHgyICsgXzIzICogYXgsXG4gICAgICAgICAgICAgICAgXzEzICogeTIgKyBfMjMgKiBheSxcbiAgICAgICAgICAgICAgICB4MixcbiAgICAgICAgICAgICAgICB5MlxuICAgICAgICAgICAgXTtcbiAgICB9XG4gICAgZnVuY3Rpb24gYTJjKHgxLCB5MSwgcngsIHJ5LCBhbmdsZSwgbGFyZ2VfYXJjX2ZsYWcsIHN3ZWVwX2ZsYWcsIHgyLCB5MiwgcmVjdXJzaXZlKSB7XG4gICAgICAgIC8vIGZvciBtb3JlIGluZm9ybWF0aW9uIG9mIHdoZXJlIHRoaXMgbWF0aCBjYW1lIGZyb20gdmlzaXQ6XG4gICAgICAgIC8vIGh0dHA6Ly93d3cudzMub3JnL1RSL1NWRzExL2ltcGxub3RlLmh0bWwjQXJjSW1wbGVtZW50YXRpb25Ob3Rlc1xuICAgICAgICB2YXIgXzEyMCA9IFBJICogMTIwIC8gMTgwLFxuICAgICAgICAgICAgcmFkID0gUEkgLyAxODAgKiAoK2FuZ2xlIHx8IDApLFxuICAgICAgICAgICAgcmVzID0gW10sXG4gICAgICAgICAgICB4eSxcbiAgICAgICAgICAgIHJvdGF0ZSA9IFNuYXAuXy5jYWNoZXIoZnVuY3Rpb24gKHgsIHksIHJhZCkge1xuICAgICAgICAgICAgICAgIHZhciBYID0geCAqIG1hdGguY29zKHJhZCkgLSB5ICogbWF0aC5zaW4ocmFkKSxcbiAgICAgICAgICAgICAgICAgICAgWSA9IHggKiBtYXRoLnNpbihyYWQpICsgeSAqIG1hdGguY29zKHJhZCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHt4OiBYLCB5OiBZfTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICBpZiAoIXJlY3Vyc2l2ZSkge1xuICAgICAgICAgICAgeHkgPSByb3RhdGUoeDEsIHkxLCAtcmFkKTtcbiAgICAgICAgICAgIHgxID0geHkueDtcbiAgICAgICAgICAgIHkxID0geHkueTtcbiAgICAgICAgICAgIHh5ID0gcm90YXRlKHgyLCB5MiwgLXJhZCk7XG4gICAgICAgICAgICB4MiA9IHh5Lng7XG4gICAgICAgICAgICB5MiA9IHh5Lnk7XG4gICAgICAgICAgICB2YXIgY29zID0gbWF0aC5jb3MoUEkgLyAxODAgKiBhbmdsZSksXG4gICAgICAgICAgICAgICAgc2luID0gbWF0aC5zaW4oUEkgLyAxODAgKiBhbmdsZSksXG4gICAgICAgICAgICAgICAgeCA9ICh4MSAtIHgyKSAvIDIsXG4gICAgICAgICAgICAgICAgeSA9ICh5MSAtIHkyKSAvIDI7XG4gICAgICAgICAgICB2YXIgaCA9ICh4ICogeCkgLyAocnggKiByeCkgKyAoeSAqIHkpIC8gKHJ5ICogcnkpO1xuICAgICAgICAgICAgaWYgKGggPiAxKSB7XG4gICAgICAgICAgICAgICAgaCA9IG1hdGguc3FydChoKTtcbiAgICAgICAgICAgICAgICByeCA9IGggKiByeDtcbiAgICAgICAgICAgICAgICByeSA9IGggKiByeTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciByeDIgPSByeCAqIHJ4LFxuICAgICAgICAgICAgICAgIHJ5MiA9IHJ5ICogcnksXG4gICAgICAgICAgICAgICAgayA9IChsYXJnZV9hcmNfZmxhZyA9PSBzd2VlcF9mbGFnID8gLTEgOiAxKSAqXG4gICAgICAgICAgICAgICAgICAgIG1hdGguc3FydChhYnMoKHJ4MiAqIHJ5MiAtIHJ4MiAqIHkgKiB5IC0gcnkyICogeCAqIHgpIC8gKHJ4MiAqIHkgKiB5ICsgcnkyICogeCAqIHgpKSksXG4gICAgICAgICAgICAgICAgY3ggPSBrICogcnggKiB5IC8gcnkgKyAoeDEgKyB4MikgLyAyLFxuICAgICAgICAgICAgICAgIGN5ID0gayAqIC1yeSAqIHggLyByeCArICh5MSArIHkyKSAvIDIsXG4gICAgICAgICAgICAgICAgZjEgPSBtYXRoLmFzaW4oKCh5MSAtIGN5KSAvIHJ5KS50b0ZpeGVkKDkpKSxcbiAgICAgICAgICAgICAgICBmMiA9IG1hdGguYXNpbigoKHkyIC0gY3kpIC8gcnkpLnRvRml4ZWQoOSkpO1xuXG4gICAgICAgICAgICBmMSA9IHgxIDwgY3ggPyBQSSAtIGYxIDogZjE7XG4gICAgICAgICAgICBmMiA9IHgyIDwgY3ggPyBQSSAtIGYyIDogZjI7XG4gICAgICAgICAgICBmMSA8IDAgJiYgKGYxID0gUEkgKiAyICsgZjEpO1xuICAgICAgICAgICAgZjIgPCAwICYmIChmMiA9IFBJICogMiArIGYyKTtcbiAgICAgICAgICAgIGlmIChzd2VlcF9mbGFnICYmIGYxID4gZjIpIHtcbiAgICAgICAgICAgICAgICBmMSA9IGYxIC0gUEkgKiAyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFzd2VlcF9mbGFnICYmIGYyID4gZjEpIHtcbiAgICAgICAgICAgICAgICBmMiA9IGYyIC0gUEkgKiAyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZjEgPSByZWN1cnNpdmVbMF07XG4gICAgICAgICAgICBmMiA9IHJlY3Vyc2l2ZVsxXTtcbiAgICAgICAgICAgIGN4ID0gcmVjdXJzaXZlWzJdO1xuICAgICAgICAgICAgY3kgPSByZWN1cnNpdmVbM107XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGRmID0gZjIgLSBmMTtcbiAgICAgICAgaWYgKGFicyhkZikgPiBfMTIwKSB7XG4gICAgICAgICAgICB2YXIgZjJvbGQgPSBmMixcbiAgICAgICAgICAgICAgICB4Mm9sZCA9IHgyLFxuICAgICAgICAgICAgICAgIHkyb2xkID0geTI7XG4gICAgICAgICAgICBmMiA9IGYxICsgXzEyMCAqIChzd2VlcF9mbGFnICYmIGYyID4gZjEgPyAxIDogLTEpO1xuICAgICAgICAgICAgeDIgPSBjeCArIHJ4ICogbWF0aC5jb3MoZjIpO1xuICAgICAgICAgICAgeTIgPSBjeSArIHJ5ICogbWF0aC5zaW4oZjIpO1xuICAgICAgICAgICAgcmVzID0gYTJjKHgyLCB5MiwgcngsIHJ5LCBhbmdsZSwgMCwgc3dlZXBfZmxhZywgeDJvbGQsIHkyb2xkLCBbZjIsIGYyb2xkLCBjeCwgY3ldKTtcbiAgICAgICAgfVxuICAgICAgICBkZiA9IGYyIC0gZjE7XG4gICAgICAgIHZhciBjMSA9IG1hdGguY29zKGYxKSxcbiAgICAgICAgICAgIHMxID0gbWF0aC5zaW4oZjEpLFxuICAgICAgICAgICAgYzIgPSBtYXRoLmNvcyhmMiksXG4gICAgICAgICAgICBzMiA9IG1hdGguc2luKGYyKSxcbiAgICAgICAgICAgIHQgPSBtYXRoLnRhbihkZiAvIDQpLFxuICAgICAgICAgICAgaHggPSA0IC8gMyAqIHJ4ICogdCxcbiAgICAgICAgICAgIGh5ID0gNCAvIDMgKiByeSAqIHQsXG4gICAgICAgICAgICBtMSA9IFt4MSwgeTFdLFxuICAgICAgICAgICAgbTIgPSBbeDEgKyBoeCAqIHMxLCB5MSAtIGh5ICogYzFdLFxuICAgICAgICAgICAgbTMgPSBbeDIgKyBoeCAqIHMyLCB5MiAtIGh5ICogYzJdLFxuICAgICAgICAgICAgbTQgPSBbeDIsIHkyXTtcbiAgICAgICAgbTJbMF0gPSAyICogbTFbMF0gLSBtMlswXTtcbiAgICAgICAgbTJbMV0gPSAyICogbTFbMV0gLSBtMlsxXTtcbiAgICAgICAgaWYgKHJlY3Vyc2l2ZSkge1xuICAgICAgICAgICAgcmV0dXJuIFttMiwgbTMsIG00XS5jb25jYXQocmVzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlcyA9IFttMiwgbTMsIG00XS5jb25jYXQocmVzKS5qb2luKCkuc3BsaXQoXCIsXCIpO1xuICAgICAgICAgICAgdmFyIG5ld3JlcyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gcmVzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICBuZXdyZXNbaV0gPSBpICUgMiA/IHJvdGF0ZShyZXNbaSAtIDFdLCByZXNbaV0sIHJhZCkueSA6IHJvdGF0ZShyZXNbaV0sIHJlc1tpICsgMV0sIHJhZCkueDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuZXdyZXM7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gZmluZERvdEF0U2VnbWVudChwMXgsIHAxeSwgYzF4LCBjMXksIGMyeCwgYzJ5LCBwMngsIHAyeSwgdCkge1xuICAgICAgICB2YXIgdDEgPSAxIC0gdDtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6IHBvdyh0MSwgMykgKiBwMXggKyBwb3codDEsIDIpICogMyAqIHQgKiBjMXggKyB0MSAqIDMgKiB0ICogdCAqIGMyeCArIHBvdyh0LCAzKSAqIHAyeCxcbiAgICAgICAgICAgIHk6IHBvdyh0MSwgMykgKiBwMXkgKyBwb3codDEsIDIpICogMyAqIHQgKiBjMXkgKyB0MSAqIDMgKiB0ICogdCAqIGMyeSArIHBvdyh0LCAzKSAqIHAyeVxuICAgICAgICB9O1xuICAgIH1cbiAgICBcbiAgICAvLyBSZXR1cm5zIGJvdW5kaW5nIGJveCBvZiBjdWJpYyBiZXppZXIgY3VydmUuXG4gICAgLy8gU291cmNlOiBodHRwOi8vYmxvZy5oYWNrZXJzLWNhZmUubmV0LzIwMDkvMDYvaG93LXRvLWNhbGN1bGF0ZS1iZXppZXItY3VydmVzLWJvdW5kaW5nLmh0bWxcbiAgICAvLyBPcmlnaW5hbCB2ZXJzaW9uOiBOSVNISU8gSGlyb2thenVcbiAgICAvLyBNb2RpZmljYXRpb25zOiBodHRwczovL2dpdGh1Yi5jb20vdGltbzIyMzQ1XG4gICAgZnVuY3Rpb24gY3VydmVEaW0oeDAsIHkwLCB4MSwgeTEsIHgyLCB5MiwgeDMsIHkzKSB7XG4gICAgICAgIHZhciB0dmFsdWVzID0gW10sXG4gICAgICAgICAgICBib3VuZHMgPSBbW10sIFtdXSxcbiAgICAgICAgICAgIGEsIGIsIGMsIHQsIHQxLCB0MiwgYjJhYywgc3FydGIyYWM7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMjsgKytpKSB7XG4gICAgICAgICAgICBpZiAoaSA9PSAwKSB7XG4gICAgICAgICAgICAgICAgYiA9IDYgKiB4MCAtIDEyICogeDEgKyA2ICogeDI7XG4gICAgICAgICAgICAgICAgYSA9IC0zICogeDAgKyA5ICogeDEgLSA5ICogeDIgKyAzICogeDM7XG4gICAgICAgICAgICAgICAgYyA9IDMgKiB4MSAtIDMgKiB4MDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYiA9IDYgKiB5MCAtIDEyICogeTEgKyA2ICogeTI7XG4gICAgICAgICAgICAgICAgYSA9IC0zICogeTAgKyA5ICogeTEgLSA5ICogeTIgKyAzICogeTM7XG4gICAgICAgICAgICAgICAgYyA9IDMgKiB5MSAtIDMgKiB5MDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhYnMoYSkgPCAxZS0xMikge1xuICAgICAgICAgICAgICAgIGlmIChhYnMoYikgPCAxZS0xMikge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdCA9IC1jIC8gYjtcbiAgICAgICAgICAgICAgICBpZiAoMCA8IHQgJiYgdCA8IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgdHZhbHVlcy5wdXNoKHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGIyYWMgPSBiICogYiAtIDQgKiBjICogYTtcbiAgICAgICAgICAgIHNxcnRiMmFjID0gbWF0aC5zcXJ0KGIyYWMpO1xuICAgICAgICAgICAgaWYgKGIyYWMgPCAwKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0MSA9ICgtYiArIHNxcnRiMmFjKSAvICgyICogYSk7XG4gICAgICAgICAgICBpZiAoMCA8IHQxICYmIHQxIDwgMSkge1xuICAgICAgICAgICAgICAgIHR2YWx1ZXMucHVzaCh0MSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0MiA9ICgtYiAtIHNxcnRiMmFjKSAvICgyICogYSk7XG4gICAgICAgICAgICBpZiAoMCA8IHQyICYmIHQyIDwgMSkge1xuICAgICAgICAgICAgICAgIHR2YWx1ZXMucHVzaCh0Mik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgeCwgeSwgaiA9IHR2YWx1ZXMubGVuZ3RoLFxuICAgICAgICAgICAgamxlbiA9IGosXG4gICAgICAgICAgICBtdDtcbiAgICAgICAgd2hpbGUgKGotLSkge1xuICAgICAgICAgICAgdCA9IHR2YWx1ZXNbal07XG4gICAgICAgICAgICBtdCA9IDEgLSB0O1xuICAgICAgICAgICAgYm91bmRzWzBdW2pdID0gKG10ICogbXQgKiBtdCAqIHgwKSArICgzICogbXQgKiBtdCAqIHQgKiB4MSkgKyAoMyAqIG10ICogdCAqIHQgKiB4MikgKyAodCAqIHQgKiB0ICogeDMpO1xuICAgICAgICAgICAgYm91bmRzWzFdW2pdID0gKG10ICogbXQgKiBtdCAqIHkwKSArICgzICogbXQgKiBtdCAqIHQgKiB5MSkgKyAoMyAqIG10ICogdCAqIHQgKiB5MikgKyAodCAqIHQgKiB0ICogeTMpO1xuICAgICAgICB9XG5cbiAgICAgICAgYm91bmRzWzBdW2psZW5dID0geDA7XG4gICAgICAgIGJvdW5kc1sxXVtqbGVuXSA9IHkwO1xuICAgICAgICBib3VuZHNbMF1bamxlbiArIDFdID0geDM7XG4gICAgICAgIGJvdW5kc1sxXVtqbGVuICsgMV0gPSB5MztcbiAgICAgICAgYm91bmRzWzBdLmxlbmd0aCA9IGJvdW5kc1sxXS5sZW5ndGggPSBqbGVuICsgMjtcblxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgbWluOiB7eDogbW1pbi5hcHBseSgwLCBib3VuZHNbMF0pLCB5OiBtbWluLmFwcGx5KDAsIGJvdW5kc1sxXSl9LFxuICAgICAgICAgIG1heDoge3g6IG1tYXguYXBwbHkoMCwgYm91bmRzWzBdKSwgeTogbW1heC5hcHBseSgwLCBib3VuZHNbMV0pfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhdGgyY3VydmUocGF0aCwgcGF0aDIpIHtcbiAgICAgICAgdmFyIHB0aCA9ICFwYXRoMiAmJiBwYXRocyhwYXRoKTtcbiAgICAgICAgaWYgKCFwYXRoMiAmJiBwdGguY3VydmUpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXRoQ2xvbmUocHRoLmN1cnZlKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcCA9IHBhdGhUb0Fic29sdXRlKHBhdGgpLFxuICAgICAgICAgICAgcDIgPSBwYXRoMiAmJiBwYXRoVG9BYnNvbHV0ZShwYXRoMiksXG4gICAgICAgICAgICBhdHRycyA9IHt4OiAwLCB5OiAwLCBieDogMCwgYnk6IDAsIFg6IDAsIFk6IDAsIHF4OiBudWxsLCBxeTogbnVsbH0sXG4gICAgICAgICAgICBhdHRyczIgPSB7eDogMCwgeTogMCwgYng6IDAsIGJ5OiAwLCBYOiAwLCBZOiAwLCBxeDogbnVsbCwgcXk6IG51bGx9LFxuICAgICAgICAgICAgcHJvY2Vzc1BhdGggPSBmdW5jdGlvbiAocGF0aCwgZCwgcGNvbSkge1xuICAgICAgICAgICAgICAgIHZhciBueCwgbnk7XG4gICAgICAgICAgICAgICAgaWYgKCFwYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbXCJDXCIsIGQueCwgZC55LCBkLngsIGQueSwgZC54LCBkLnldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAhKHBhdGhbMF0gaW4ge1Q6IDEsIFE6IDF9KSAmJiAoZC5xeCA9IGQucXkgPSBudWxsKTtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHBhdGhbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIk1cIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGQuWCA9IHBhdGhbMV07XG4gICAgICAgICAgICAgICAgICAgICAgICBkLlkgPSBwYXRoWzJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJBXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoID0gW1wiQ1wiXS5jb25jYXQoYTJjLmFwcGx5KDAsIFtkLngsIGQueV0uY29uY2F0KHBhdGguc2xpY2UoMSkpKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlNcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwY29tID09IFwiQ1wiIHx8IHBjb20gPT0gXCJTXCIpIHsgLy8gSW4gXCJTXCIgY2FzZSB3ZSBoYXZlIHRvIHRha2UgaW50byBhY2NvdW50LCBpZiB0aGUgcHJldmlvdXMgY29tbWFuZCBpcyBDL1MuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbnggPSBkLnggKiAyIC0gZC5ieDsgICAgICAgICAgLy8gQW5kIHJlZmxlY3QgdGhlIHByZXZpb3VzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbnkgPSBkLnkgKiAyIC0gZC5ieTsgICAgICAgICAgLy8gY29tbWFuZCdzIGNvbnRyb2wgcG9pbnQgcmVsYXRpdmUgdG8gdGhlIGN1cnJlbnQgcG9pbnQuXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHsgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gb3Igc29tZSBlbHNlIG9yIG5vdGhpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBueCA9IGQueDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBueSA9IGQueTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGggPSBbXCJDXCIsIG54LCBueV0uY29uY2F0KHBhdGguc2xpY2UoMSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJUXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGNvbSA9PSBcIlFcIiB8fCBwY29tID09IFwiVFwiKSB7IC8vIEluIFwiVFwiIGNhc2Ugd2UgaGF2ZSB0byB0YWtlIGludG8gYWNjb3VudCwgaWYgdGhlIHByZXZpb3VzIGNvbW1hbmQgaXMgUS9ULlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGQucXggPSBkLnggKiAyIC0gZC5xeDsgICAgICAgIC8vIEFuZCBtYWtlIGEgcmVmbGVjdGlvbiBzaW1pbGFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZC5xeSA9IGQueSAqIDIgLSBkLnF5OyAgICAgICAgLy8gdG8gY2FzZSBcIlNcIi5cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgeyAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBvciBzb21ldGhpbmcgZWxzZSBvciBub3RoaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZC5xeCA9IGQueDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkLnF5ID0gZC55O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aCA9IFtcIkNcIl0uY29uY2F0KHEyYyhkLngsIGQueSwgZC5xeCwgZC5xeSwgcGF0aFsxXSwgcGF0aFsyXSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJRXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBkLnF4ID0gcGF0aFsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGQucXkgPSBwYXRoWzJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aCA9IFtcIkNcIl0uY29uY2F0KHEyYyhkLngsIGQueSwgcGF0aFsxXSwgcGF0aFsyXSwgcGF0aFszXSwgcGF0aFs0XSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJMXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoID0gW1wiQ1wiXS5jb25jYXQobDJjKGQueCwgZC55LCBwYXRoWzFdLCBwYXRoWzJdKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkhcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGggPSBbXCJDXCJdLmNvbmNhdChsMmMoZC54LCBkLnksIHBhdGhbMV0sIGQueSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJWXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoID0gW1wiQ1wiXS5jb25jYXQobDJjKGQueCwgZC55LCBkLngsIHBhdGhbMV0pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiWlwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aCA9IFtcIkNcIl0uY29uY2F0KGwyYyhkLngsIGQueSwgZC5YLCBkLlkpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcGF0aDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmaXhBcmMgPSBmdW5jdGlvbiAocHAsIGkpIHtcbiAgICAgICAgICAgICAgICBpZiAocHBbaV0ubGVuZ3RoID4gNykge1xuICAgICAgICAgICAgICAgICAgICBwcFtpXS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcGkgPSBwcFtpXTtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHBpLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGNvbXMxW2ldID0gXCJBXCI7IC8vIGlmIGNyZWF0ZWQgbXVsdGlwbGUgQzpzLCB0aGVpciBvcmlnaW5hbCBzZWcgaXMgc2F2ZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIHAyICYmIChwY29tczJbaV0gPSBcIkFcIik7IC8vIHRoZSBzYW1lIGFzIGFib3ZlXG4gICAgICAgICAgICAgICAgICAgICAgICBwcC5zcGxpY2UoaSsrLCAwLCBbXCJDXCJdLmNvbmNhdChwaS5zcGxpY2UoMCwgNikpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBwcC5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgIGlpID0gbW1heChwLmxlbmd0aCwgcDIgJiYgcDIubGVuZ3RoIHx8IDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmaXhNID0gZnVuY3Rpb24gKHBhdGgxLCBwYXRoMiwgYTEsIGEyLCBpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHBhdGgxICYmIHBhdGgyICYmIHBhdGgxW2ldWzBdID09IFwiTVwiICYmIHBhdGgyW2ldWzBdICE9IFwiTVwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGgyLnNwbGljZShpLCAwLCBbXCJNXCIsIGEyLngsIGEyLnldKTtcbiAgICAgICAgICAgICAgICAgICAgYTEuYnggPSAwO1xuICAgICAgICAgICAgICAgICAgICBhMS5ieSA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGExLnggPSBwYXRoMVtpXVsxXTtcbiAgICAgICAgICAgICAgICAgICAgYTEueSA9IHBhdGgxW2ldWzJdO1xuICAgICAgICAgICAgICAgICAgICBpaSA9IG1tYXgocC5sZW5ndGgsIHAyICYmIHAyLmxlbmd0aCB8fCAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcGNvbXMxID0gW10sIC8vIHBhdGggY29tbWFuZHMgb2Ygb3JpZ2luYWwgcGF0aCBwXG4gICAgICAgICAgICBwY29tczIgPSBbXSwgLy8gcGF0aCBjb21tYW5kcyBvZiBvcmlnaW5hbCBwYXRoIHAyXG4gICAgICAgICAgICBwZmlyc3QgPSBcIlwiLCAvLyB0ZW1wb3JhcnkgaG9sZGVyIGZvciBvcmlnaW5hbCBwYXRoIGNvbW1hbmRcbiAgICAgICAgICAgIHBjb20gPSBcIlwiOyAvLyBob2xkZXIgZm9yIHByZXZpb3VzIHBhdGggY29tbWFuZCBvZiBvcmlnaW5hbCBwYXRoXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IG1tYXgocC5sZW5ndGgsIHAyICYmIHAyLmxlbmd0aCB8fCAwKTsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIHBbaV0gJiYgKHBmaXJzdCA9IHBbaV1bMF0pOyAvLyBzYXZlIGN1cnJlbnQgcGF0aCBjb21tYW5kXG5cbiAgICAgICAgICAgIGlmIChwZmlyc3QgIT0gXCJDXCIpIC8vIEMgaXMgbm90IHNhdmVkIHlldCwgYmVjYXVzZSBpdCBtYXkgYmUgcmVzdWx0IG9mIGNvbnZlcnNpb25cbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBwY29tczFbaV0gPSBwZmlyc3Q7IC8vIFNhdmUgY3VycmVudCBwYXRoIGNvbW1hbmRcbiAgICAgICAgICAgICAgICBpICYmICggcGNvbSA9IHBjb21zMVtpIC0gMV0pOyAvLyBHZXQgcHJldmlvdXMgcGF0aCBjb21tYW5kIHBjb21cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBbaV0gPSBwcm9jZXNzUGF0aChwW2ldLCBhdHRycywgcGNvbSk7IC8vIFByZXZpb3VzIHBhdGggY29tbWFuZCBpcyBpbnB1dHRlZCB0byBwcm9jZXNzUGF0aFxuXG4gICAgICAgICAgICBpZiAocGNvbXMxW2ldICE9IFwiQVwiICYmIHBmaXJzdCA9PSBcIkNcIikgcGNvbXMxW2ldID0gXCJDXCI7IC8vIEEgaXMgdGhlIG9ubHkgY29tbWFuZFxuICAgICAgICAgICAgLy8gd2hpY2ggbWF5IHByb2R1Y2UgbXVsdGlwbGUgQzpzXG4gICAgICAgICAgICAvLyBzbyB3ZSBoYXZlIHRvIG1ha2Ugc3VyZSB0aGF0IEMgaXMgYWxzbyBDIGluIG9yaWdpbmFsIHBhdGhcblxuICAgICAgICAgICAgZml4QXJjKHAsIGkpOyAvLyBmaXhBcmMgYWRkcyBhbHNvIHRoZSByaWdodCBhbW91bnQgb2YgQTpzIHRvIHBjb21zMVxuXG4gICAgICAgICAgICBpZiAocDIpIHsgLy8gdGhlIHNhbWUgcHJvY2VkdXJlcyBpcyBkb25lIHRvIHAyXG4gICAgICAgICAgICAgICAgcDJbaV0gJiYgKHBmaXJzdCA9IHAyW2ldWzBdKTtcbiAgICAgICAgICAgICAgICBpZiAocGZpcnN0ICE9IFwiQ1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIHBjb21zMltpXSA9IHBmaXJzdDtcbiAgICAgICAgICAgICAgICAgICAgaSAmJiAocGNvbSA9IHBjb21zMltpIC0gMV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwMltpXSA9IHByb2Nlc3NQYXRoKHAyW2ldLCBhdHRyczIsIHBjb20pO1xuXG4gICAgICAgICAgICAgICAgaWYgKHBjb21zMltpXSAhPSBcIkFcIiAmJiBwZmlyc3QgPT0gXCJDXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcGNvbXMyW2ldID0gXCJDXCI7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZml4QXJjKHAyLCBpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZpeE0ocCwgcDIsIGF0dHJzLCBhdHRyczIsIGkpO1xuICAgICAgICAgICAgZml4TShwMiwgcCwgYXR0cnMyLCBhdHRycywgaSk7XG4gICAgICAgICAgICB2YXIgc2VnID0gcFtpXSxcbiAgICAgICAgICAgICAgICBzZWcyID0gcDIgJiYgcDJbaV0sXG4gICAgICAgICAgICAgICAgc2VnbGVuID0gc2VnLmxlbmd0aCxcbiAgICAgICAgICAgICAgICBzZWcybGVuID0gcDIgJiYgc2VnMi5sZW5ndGg7XG4gICAgICAgICAgICBhdHRycy54ID0gc2VnW3NlZ2xlbiAtIDJdO1xuICAgICAgICAgICAgYXR0cnMueSA9IHNlZ1tzZWdsZW4gLSAxXTtcbiAgICAgICAgICAgIGF0dHJzLmJ4ID0gdG9GbG9hdChzZWdbc2VnbGVuIC0gNF0pIHx8IGF0dHJzLng7XG4gICAgICAgICAgICBhdHRycy5ieSA9IHRvRmxvYXQoc2VnW3NlZ2xlbiAtIDNdKSB8fCBhdHRycy55O1xuICAgICAgICAgICAgYXR0cnMyLmJ4ID0gcDIgJiYgKHRvRmxvYXQoc2VnMltzZWcybGVuIC0gNF0pIHx8IGF0dHJzMi54KTtcbiAgICAgICAgICAgIGF0dHJzMi5ieSA9IHAyICYmICh0b0Zsb2F0KHNlZzJbc2VnMmxlbiAtIDNdKSB8fCBhdHRyczIueSk7XG4gICAgICAgICAgICBhdHRyczIueCA9IHAyICYmIHNlZzJbc2VnMmxlbiAtIDJdO1xuICAgICAgICAgICAgYXR0cnMyLnkgPSBwMiAmJiBzZWcyW3NlZzJsZW4gLSAxXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXAyKSB7XG4gICAgICAgICAgICBwdGguY3VydmUgPSBwYXRoQ2xvbmUocCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHAyID8gW3AsIHAyXSA6IHA7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG1hcFBhdGgocGF0aCwgbWF0cml4KSB7XG4gICAgICAgIGlmICghbWF0cml4KSB7XG4gICAgICAgICAgICByZXR1cm4gcGF0aDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgeCwgeSwgaSwgaiwgaWksIGpqLCBwYXRoaTtcbiAgICAgICAgcGF0aCA9IHBhdGgyY3VydmUocGF0aCk7XG4gICAgICAgIGZvciAoaSA9IDAsIGlpID0gcGF0aC5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICBwYXRoaSA9IHBhdGhbaV07XG4gICAgICAgICAgICBmb3IgKGogPSAxLCBqaiA9IHBhdGhpLmxlbmd0aDsgaiA8IGpqOyBqICs9IDIpIHtcbiAgICAgICAgICAgICAgICB4ID0gbWF0cml4LngocGF0aGlbal0sIHBhdGhpW2ogKyAxXSk7XG4gICAgICAgICAgICAgICAgeSA9IG1hdHJpeC55KHBhdGhpW2pdLCBwYXRoaVtqICsgMV0pO1xuICAgICAgICAgICAgICAgIHBhdGhpW2pdID0geDtcbiAgICAgICAgICAgICAgICBwYXRoaVtqICsgMV0gPSB5O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwYXRoO1xuICAgIH1cblxuICAgIC8vIGh0dHA6Ly9zY2hlcGVycy5jYy9nZXR0aW5nLXRvLXRoZS1wb2ludFxuICAgIGZ1bmN0aW9uIGNhdG11bGxSb20yYmV6aWVyKGNycCwgeikge1xuICAgICAgICB2YXIgZCA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgaUxlbiA9IGNycC5sZW5ndGg7IGlMZW4gLSAyICogIXogPiBpOyBpICs9IDIpIHtcbiAgICAgICAgICAgIHZhciBwID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAge3g6ICtjcnBbaSAtIDJdLCB5OiArY3JwW2kgLSAxXX0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7eDogK2NycFtpXSwgICAgIHk6ICtjcnBbaSArIDFdfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHt4OiArY3JwW2kgKyAyXSwgeTogK2NycFtpICsgM119LFxuICAgICAgICAgICAgICAgICAgICAgICAge3g6ICtjcnBbaSArIDRdLCB5OiArY3JwW2kgKyA1XX1cbiAgICAgICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIGlmICh6KSB7XG4gICAgICAgICAgICAgICAgaWYgKCFpKSB7XG4gICAgICAgICAgICAgICAgICAgIHBbMF0gPSB7eDogK2NycFtpTGVuIC0gMl0sIHk6ICtjcnBbaUxlbiAtIDFdfTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlMZW4gLSA0ID09IGkpIHtcbiAgICAgICAgICAgICAgICAgICAgcFszXSA9IHt4OiArY3JwWzBdLCB5OiArY3JwWzFdfTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlMZW4gLSAyID09IGkpIHtcbiAgICAgICAgICAgICAgICAgICAgcFsyXSA9IHt4OiArY3JwWzBdLCB5OiArY3JwWzFdfTtcbiAgICAgICAgICAgICAgICAgICAgcFszXSA9IHt4OiArY3JwWzJdLCB5OiArY3JwWzNdfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChpTGVuIC0gNCA9PSBpKSB7XG4gICAgICAgICAgICAgICAgICAgIHBbM10gPSBwWzJdO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIWkpIHtcbiAgICAgICAgICAgICAgICAgICAgcFswXSA9IHt4OiArY3JwW2ldLCB5OiArY3JwW2kgKyAxXX07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZC5wdXNoKFtcIkNcIixcbiAgICAgICAgICAgICAgICAgICgtcFswXS54ICsgNiAqIHBbMV0ueCArIHBbMl0ueCkgLyA2LFxuICAgICAgICAgICAgICAgICAgKC1wWzBdLnkgKyA2ICogcFsxXS55ICsgcFsyXS55KSAvIDYsXG4gICAgICAgICAgICAgICAgICAocFsxXS54ICsgNiAqIHBbMl0ueCAtIHBbM10ueCkgLyA2LFxuICAgICAgICAgICAgICAgICAgKHBbMV0ueSArIDYqcFsyXS55IC0gcFszXS55KSAvIDYsXG4gICAgICAgICAgICAgICAgICBwWzJdLngsXG4gICAgICAgICAgICAgICAgICBwWzJdLnlcbiAgICAgICAgICAgIF0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGQ7XG4gICAgfVxuXG4gICAgLy8gZXhwb3J0XG4gICAgU25hcC5wYXRoID0gcGF0aHM7XG5cbiAgICAvKlxcXG4gICAgICogU25hcC5wYXRoLmdldFRvdGFsTGVuZ3RoXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIHRoZSBsZW5ndGggb2YgdGhlIGdpdmVuIHBhdGggaW4gcGl4ZWxzXG4gICAgICoqXG4gICAgIC0gcGF0aCAoc3RyaW5nKSBTVkcgcGF0aCBzdHJpbmdcbiAgICAgKipcbiAgICAgPSAobnVtYmVyKSBsZW5ndGhcbiAgICBcXCovXG4gICAgU25hcC5wYXRoLmdldFRvdGFsTGVuZ3RoID0gZ2V0VG90YWxMZW5ndGg7XG4gICAgLypcXFxuICAgICAqIFNuYXAucGF0aC5nZXRQb2ludEF0TGVuZ3RoXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIHRoZSBjb29yZGluYXRlcyBvZiB0aGUgcG9pbnQgbG9jYXRlZCBhdCB0aGUgZ2l2ZW4gbGVuZ3RoIGFsb25nIHRoZSBnaXZlbiBwYXRoXG4gICAgICoqXG4gICAgIC0gcGF0aCAoc3RyaW5nKSBTVkcgcGF0aCBzdHJpbmdcbiAgICAgLSBsZW5ndGggKG51bWJlcikgbGVuZ3RoLCBpbiBwaXhlbHMsIGZyb20gdGhlIHN0YXJ0IG9mIHRoZSBwYXRoLCBleGNsdWRpbmcgbm9uLXJlbmRlcmluZyBqdW1wc1xuICAgICAqKlxuICAgICA9IChvYmplY3QpIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBwb2ludDpcbiAgICAgbyB7XG4gICAgIG8gICAgIHg6IChudW1iZXIpIHggY29vcmRpbmF0ZSxcbiAgICAgbyAgICAgeTogKG51bWJlcikgeSBjb29yZGluYXRlLFxuICAgICBvICAgICBhbHBoYTogKG51bWJlcikgYW5nbGUgb2YgZGVyaXZhdGl2ZVxuICAgICBvIH1cbiAgICBcXCovXG4gICAgU25hcC5wYXRoLmdldFBvaW50QXRMZW5ndGggPSBnZXRQb2ludEF0TGVuZ3RoO1xuICAgIC8qXFxcbiAgICAgKiBTbmFwLnBhdGguZ2V0U3VicGF0aFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJucyB0aGUgc3VicGF0aCBvZiBhIGdpdmVuIHBhdGggYmV0d2VlbiBnaXZlbiBzdGFydCBhbmQgZW5kIGxlbmd0aHNcbiAgICAgKipcbiAgICAgLSBwYXRoIChzdHJpbmcpIFNWRyBwYXRoIHN0cmluZ1xuICAgICAtIGZyb20gKG51bWJlcikgbGVuZ3RoLCBpbiBwaXhlbHMsIGZyb20gdGhlIHN0YXJ0IG9mIHRoZSBwYXRoIHRvIHRoZSBzdGFydCBvZiB0aGUgc2VnbWVudFxuICAgICAtIHRvIChudW1iZXIpIGxlbmd0aCwgaW4gcGl4ZWxzLCBmcm9tIHRoZSBzdGFydCBvZiB0aGUgcGF0aCB0byB0aGUgZW5kIG9mIHRoZSBzZWdtZW50XG4gICAgICoqXG4gICAgID0gKHN0cmluZykgcGF0aCBzdHJpbmcgZGVmaW5pdGlvbiBmb3IgdGhlIHNlZ21lbnRcbiAgICBcXCovXG4gICAgU25hcC5wYXRoLmdldFN1YnBhdGggPSBmdW5jdGlvbiAocGF0aCwgZnJvbSwgdG8pIHtcbiAgICAgICAgaWYgKHRoaXMuZ2V0VG90YWxMZW5ndGgocGF0aCkgLSB0byA8IDFlLTYpIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRTdWJwYXRoc0F0TGVuZ3RoKHBhdGgsIGZyb20pLmVuZDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgYSA9IGdldFN1YnBhdGhzQXRMZW5ndGgocGF0aCwgdG8sIDEpO1xuICAgICAgICByZXR1cm4gZnJvbSA/IGdldFN1YnBhdGhzQXRMZW5ndGgoYSwgZnJvbSkuZW5kIDogYTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LmdldFRvdGFsTGVuZ3RoXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIHRoZSBsZW5ndGggb2YgdGhlIHBhdGggaW4gcGl4ZWxzIChvbmx5IHdvcmtzIGZvciBgcGF0aGAgZWxlbWVudHMpXG4gICAgID0gKG51bWJlcikgbGVuZ3RoXG4gICAgXFwqL1xuICAgIGVscHJvdG8uZ2V0VG90YWxMZW5ndGggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLm5vZGUuZ2V0VG90YWxMZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm5vZGUuZ2V0VG90YWxMZW5ndGgoKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLy8gU0lFUlJBIEVsZW1lbnQuZ2V0UG9pbnRBdExlbmd0aCgpL0VsZW1lbnQuZ2V0VG90YWxMZW5ndGgoKTogSWYgYSA8cGF0aD4gaXMgYnJva2VuIGludG8gZGlmZmVyZW50IHNlZ21lbnRzLCBpcyB0aGUganVtcCBkaXN0YW5jZSB0byB0aGUgbmV3IGNvb3JkaW5hdGVzIHNldCBieSB0aGUgX01fIG9yIF9tXyBjb21tYW5kcyBjYWxjdWxhdGVkIGFzIHBhcnQgb2YgdGhlIHBhdGgncyB0b3RhbCBsZW5ndGg/XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuZ2V0UG9pbnRBdExlbmd0aFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJucyBjb29yZGluYXRlcyBvZiB0aGUgcG9pbnQgbG9jYXRlZCBhdCB0aGUgZ2l2ZW4gbGVuZ3RoIG9uIHRoZSBnaXZlbiBwYXRoIChvbmx5IHdvcmtzIGZvciBgcGF0aGAgZWxlbWVudHMpXG4gICAgICoqXG4gICAgIC0gbGVuZ3RoIChudW1iZXIpIGxlbmd0aCwgaW4gcGl4ZWxzLCBmcm9tIHRoZSBzdGFydCBvZiB0aGUgcGF0aCwgZXhjbHVkaW5nIG5vbi1yZW5kZXJpbmcganVtcHNcbiAgICAgKipcbiAgICAgPSAob2JqZWN0KSByZXByZXNlbnRhdGlvbiBvZiB0aGUgcG9pbnQ6XG4gICAgIG8ge1xuICAgICBvICAgICB4OiAobnVtYmVyKSB4IGNvb3JkaW5hdGUsXG4gICAgIG8gICAgIHk6IChudW1iZXIpIHkgY29vcmRpbmF0ZSxcbiAgICAgbyAgICAgYWxwaGE6IChudW1iZXIpIGFuZ2xlIG9mIGRlcml2YXRpdmVcbiAgICAgbyB9XG4gICAgXFwqL1xuICAgIGVscHJvdG8uZ2V0UG9pbnRBdExlbmd0aCA9IGZ1bmN0aW9uIChsZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIGdldFBvaW50QXRMZW5ndGgodGhpcy5hdHRyKFwiZFwiKSwgbGVuZ3RoKTtcbiAgICB9O1xuICAgIC8vIFNJRVJSQSBFbGVtZW50LmdldFN1YnBhdGgoKTogU2ltaWxhciB0byB0aGUgcHJvYmxlbSBmb3IgRWxlbWVudC5nZXRQb2ludEF0TGVuZ3RoKCkuIFVuY2xlYXIgaG93IHRoaXMgd291bGQgd29yayBmb3IgYSBzZWdtZW50ZWQgcGF0aC4gT3ZlcmFsbCwgdGhlIGNvbmNlcHQgb2YgX3N1YnBhdGhfIGFuZCB3aGF0IEknbSBjYWxsaW5nIGEgX3NlZ21lbnRfIChzZXJpZXMgb2Ygbm9uLV9NXyBvciBfWl8gY29tbWFuZHMpIGlzIHVuY2xlYXIuXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuZ2V0U3VicGF0aFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJucyBzdWJwYXRoIG9mIGEgZ2l2ZW4gZWxlbWVudCBmcm9tIGdpdmVuIHN0YXJ0IGFuZCBlbmQgbGVuZ3RocyAob25seSB3b3JrcyBmb3IgYHBhdGhgIGVsZW1lbnRzKVxuICAgICAqKlxuICAgICAtIGZyb20gKG51bWJlcikgbGVuZ3RoLCBpbiBwaXhlbHMsIGZyb20gdGhlIHN0YXJ0IG9mIHRoZSBwYXRoIHRvIHRoZSBzdGFydCBvZiB0aGUgc2VnbWVudFxuICAgICAtIHRvIChudW1iZXIpIGxlbmd0aCwgaW4gcGl4ZWxzLCBmcm9tIHRoZSBzdGFydCBvZiB0aGUgcGF0aCB0byB0aGUgZW5kIG9mIHRoZSBzZWdtZW50XG4gICAgICoqXG4gICAgID0gKHN0cmluZykgcGF0aCBzdHJpbmcgZGVmaW5pdGlvbiBmb3IgdGhlIHNlZ21lbnRcbiAgICBcXCovXG4gICAgZWxwcm90by5nZXRTdWJwYXRoID0gZnVuY3Rpb24gKGZyb20sIHRvKSB7XG4gICAgICAgIHJldHVybiBTbmFwLnBhdGguZ2V0U3VicGF0aCh0aGlzLmF0dHIoXCJkXCIpLCBmcm9tLCB0byk7XG4gICAgfTtcbiAgICBTbmFwLl8uYm94ID0gYm94O1xuICAgIC8qXFxcbiAgICAgKiBTbmFwLnBhdGguZmluZERvdHNBdFNlZ21lbnRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFV0aWxpdHkgbWV0aG9kXG4gICAgICoqXG4gICAgICogRmluZHMgZG90IGNvb3JkaW5hdGVzIG9uIHRoZSBnaXZlbiBjdWJpYyBiZXppw6lyIGN1cnZlIGF0IHRoZSBnaXZlbiB0XG4gICAgIC0gcDF4IChudW1iZXIpIHggb2YgdGhlIGZpcnN0IHBvaW50IG9mIHRoZSBjdXJ2ZVxuICAgICAtIHAxeSAobnVtYmVyKSB5IG9mIHRoZSBmaXJzdCBwb2ludCBvZiB0aGUgY3VydmVcbiAgICAgLSBjMXggKG51bWJlcikgeCBvZiB0aGUgZmlyc3QgYW5jaG9yIG9mIHRoZSBjdXJ2ZVxuICAgICAtIGMxeSAobnVtYmVyKSB5IG9mIHRoZSBmaXJzdCBhbmNob3Igb2YgdGhlIGN1cnZlXG4gICAgIC0gYzJ4IChudW1iZXIpIHggb2YgdGhlIHNlY29uZCBhbmNob3Igb2YgdGhlIGN1cnZlXG4gICAgIC0gYzJ5IChudW1iZXIpIHkgb2YgdGhlIHNlY29uZCBhbmNob3Igb2YgdGhlIGN1cnZlXG4gICAgIC0gcDJ4IChudW1iZXIpIHggb2YgdGhlIHNlY29uZCBwb2ludCBvZiB0aGUgY3VydmVcbiAgICAgLSBwMnkgKG51bWJlcikgeSBvZiB0aGUgc2Vjb25kIHBvaW50IG9mIHRoZSBjdXJ2ZVxuICAgICAtIHQgKG51bWJlcikgcG9zaXRpb24gb24gdGhlIGN1cnZlICgwLi4xKVxuICAgICA9IChvYmplY3QpIHBvaW50IGluZm9ybWF0aW9uIGluIGZvcm1hdDpcbiAgICAgbyB7XG4gICAgIG8gICAgIHg6IChudW1iZXIpIHggY29vcmRpbmF0ZSBvZiB0aGUgcG9pbnQsXG4gICAgIG8gICAgIHk6IChudW1iZXIpIHkgY29vcmRpbmF0ZSBvZiB0aGUgcG9pbnQsXG4gICAgIG8gICAgIG06IHtcbiAgICAgbyAgICAgICAgIHg6IChudW1iZXIpIHggY29vcmRpbmF0ZSBvZiB0aGUgbGVmdCBhbmNob3IsXG4gICAgIG8gICAgICAgICB5OiAobnVtYmVyKSB5IGNvb3JkaW5hdGUgb2YgdGhlIGxlZnQgYW5jaG9yXG4gICAgIG8gICAgIH0sXG4gICAgIG8gICAgIG46IHtcbiAgICAgbyAgICAgICAgIHg6IChudW1iZXIpIHggY29vcmRpbmF0ZSBvZiB0aGUgcmlnaHQgYW5jaG9yLFxuICAgICBvICAgICAgICAgeTogKG51bWJlcikgeSBjb29yZGluYXRlIG9mIHRoZSByaWdodCBhbmNob3JcbiAgICAgbyAgICAgfSxcbiAgICAgbyAgICAgc3RhcnQ6IHtcbiAgICAgbyAgICAgICAgIHg6IChudW1iZXIpIHggY29vcmRpbmF0ZSBvZiB0aGUgc3RhcnQgb2YgdGhlIGN1cnZlLFxuICAgICBvICAgICAgICAgeTogKG51bWJlcikgeSBjb29yZGluYXRlIG9mIHRoZSBzdGFydCBvZiB0aGUgY3VydmVcbiAgICAgbyAgICAgfSxcbiAgICAgbyAgICAgZW5kOiB7XG4gICAgIG8gICAgICAgICB4OiAobnVtYmVyKSB4IGNvb3JkaW5hdGUgb2YgdGhlIGVuZCBvZiB0aGUgY3VydmUsXG4gICAgIG8gICAgICAgICB5OiAobnVtYmVyKSB5IGNvb3JkaW5hdGUgb2YgdGhlIGVuZCBvZiB0aGUgY3VydmVcbiAgICAgbyAgICAgfSxcbiAgICAgbyAgICAgYWxwaGE6IChudW1iZXIpIGFuZ2xlIG9mIHRoZSBjdXJ2ZSBkZXJpdmF0aXZlIGF0IHRoZSBwb2ludFxuICAgICBvIH1cbiAgICBcXCovXG4gICAgU25hcC5wYXRoLmZpbmREb3RzQXRTZWdtZW50ID0gZmluZERvdHNBdFNlZ21lbnQ7XG4gICAgLypcXFxuICAgICAqIFNuYXAucGF0aC5iZXppZXJCQm94XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBVdGlsaXR5IG1ldGhvZFxuICAgICAqKlxuICAgICAqIFJldHVybnMgdGhlIGJvdW5kaW5nIGJveCBvZiBhIGdpdmVuIGN1YmljIGJlemnDqXIgY3VydmVcbiAgICAgLSBwMXggKG51bWJlcikgeCBvZiB0aGUgZmlyc3QgcG9pbnQgb2YgdGhlIGN1cnZlXG4gICAgIC0gcDF5IChudW1iZXIpIHkgb2YgdGhlIGZpcnN0IHBvaW50IG9mIHRoZSBjdXJ2ZVxuICAgICAtIGMxeCAobnVtYmVyKSB4IG9mIHRoZSBmaXJzdCBhbmNob3Igb2YgdGhlIGN1cnZlXG4gICAgIC0gYzF5IChudW1iZXIpIHkgb2YgdGhlIGZpcnN0IGFuY2hvciBvZiB0aGUgY3VydmVcbiAgICAgLSBjMnggKG51bWJlcikgeCBvZiB0aGUgc2Vjb25kIGFuY2hvciBvZiB0aGUgY3VydmVcbiAgICAgLSBjMnkgKG51bWJlcikgeSBvZiB0aGUgc2Vjb25kIGFuY2hvciBvZiB0aGUgY3VydmVcbiAgICAgLSBwMnggKG51bWJlcikgeCBvZiB0aGUgc2Vjb25kIHBvaW50IG9mIHRoZSBjdXJ2ZVxuICAgICAtIHAyeSAobnVtYmVyKSB5IG9mIHRoZSBzZWNvbmQgcG9pbnQgb2YgdGhlIGN1cnZlXG4gICAgICogb3JcbiAgICAgLSBiZXogKGFycmF5KSBhcnJheSBvZiBzaXggcG9pbnRzIGZvciBiZXppw6lyIGN1cnZlXG4gICAgID0gKG9iamVjdCkgYm91bmRpbmcgYm94XG4gICAgIG8ge1xuICAgICBvICAgICB4OiAobnVtYmVyKSB4IGNvb3JkaW5hdGUgb2YgdGhlIGxlZnQgdG9wIHBvaW50IG9mIHRoZSBib3gsXG4gICAgIG8gICAgIHk6IChudW1iZXIpIHkgY29vcmRpbmF0ZSBvZiB0aGUgbGVmdCB0b3AgcG9pbnQgb2YgdGhlIGJveCxcbiAgICAgbyAgICAgeDI6IChudW1iZXIpIHggY29vcmRpbmF0ZSBvZiB0aGUgcmlnaHQgYm90dG9tIHBvaW50IG9mIHRoZSBib3gsXG4gICAgIG8gICAgIHkyOiAobnVtYmVyKSB5IGNvb3JkaW5hdGUgb2YgdGhlIHJpZ2h0IGJvdHRvbSBwb2ludCBvZiB0aGUgYm94LFxuICAgICBvICAgICB3aWR0aDogKG51bWJlcikgd2lkdGggb2YgdGhlIGJveCxcbiAgICAgbyAgICAgaGVpZ2h0OiAobnVtYmVyKSBoZWlnaHQgb2YgdGhlIGJveFxuICAgICBvIH1cbiAgICBcXCovXG4gICAgU25hcC5wYXRoLmJlemllckJCb3ggPSBiZXppZXJCQm94O1xuICAgIC8qXFxcbiAgICAgKiBTbmFwLnBhdGguaXNQb2ludEluc2lkZUJCb3hcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFV0aWxpdHkgbWV0aG9kXG4gICAgICoqXG4gICAgICogUmV0dXJucyBgdHJ1ZWAgaWYgZ2l2ZW4gcG9pbnQgaXMgaW5zaWRlIGJvdW5kaW5nIGJveFxuICAgICAtIGJib3ggKHN0cmluZykgYm91bmRpbmcgYm94XG4gICAgIC0geCAoc3RyaW5nKSB4IGNvb3JkaW5hdGUgb2YgdGhlIHBvaW50XG4gICAgIC0geSAoc3RyaW5nKSB5IGNvb3JkaW5hdGUgb2YgdGhlIHBvaW50XG4gICAgID0gKGJvb2xlYW4pIGB0cnVlYCBpZiBwb2ludCBpcyBpbnNpZGVcbiAgICBcXCovXG4gICAgU25hcC5wYXRoLmlzUG9pbnRJbnNpZGVCQm94ID0gaXNQb2ludEluc2lkZUJCb3g7XG4gICAgU25hcC5jbG9zZXN0ID0gZnVuY3Rpb24gKHgsIHksIFgsIFkpIHtcbiAgICAgICAgdmFyIHIgPSAxMDAsXG4gICAgICAgICAgICBiID0gYm94KHggLSByIC8gMiwgeSAtIHIgLyAyLCByLCByKSxcbiAgICAgICAgICAgIGluc2lkZSA9IFtdLFxuICAgICAgICAgICAgZ2V0dGVyID0gWFswXS5oYXNPd25Qcm9wZXJ0eShcInhcIikgPyBmdW5jdGlvbiAoaSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHg6IFhbaV0ueCxcbiAgICAgICAgICAgICAgICAgICAgeTogWFtpXS55XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gOiBmdW5jdGlvbiAoaSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHg6IFhbaV0sXG4gICAgICAgICAgICAgICAgICAgIHk6IFlbaV1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZvdW5kID0gMDtcbiAgICAgICAgd2hpbGUgKHIgPD0gMWU2ICYmICFmb3VuZCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gWC5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHh5ID0gZ2V0dGVyKGkpO1xuICAgICAgICAgICAgICAgIGlmIChpc1BvaW50SW5zaWRlQkJveChiLCB4eS54LCB4eS55KSkge1xuICAgICAgICAgICAgICAgICAgICBmb3VuZCsrO1xuICAgICAgICAgICAgICAgICAgICBpbnNpZGUucHVzaCh4eSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgICAgICAgICByICo9IDI7XG4gICAgICAgICAgICAgICAgYiA9IGJveCh4IC0gciAvIDIsIHkgLSByIC8gMiwgciwgcilcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAociA9PSAxZTYpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbGVuID0gSW5maW5pdHksXG4gICAgICAgICAgICByZXM7XG4gICAgICAgIGZvciAoaSA9IDAsIGlpID0gaW5zaWRlLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBsID0gU25hcC5sZW4oeCwgeSwgaW5zaWRlW2ldLngsIGluc2lkZVtpXS55KTtcbiAgICAgICAgICAgIGlmIChsZW4gPiBsKSB7XG4gICAgICAgICAgICAgICAgbGVuID0gbDtcbiAgICAgICAgICAgICAgICBpbnNpZGVbaV0ubGVuID0gbDtcbiAgICAgICAgICAgICAgICByZXMgPSBpbnNpZGVbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBTbmFwLnBhdGguaXNCQm94SW50ZXJzZWN0XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBVdGlsaXR5IG1ldGhvZFxuICAgICAqKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIHR3byBib3VuZGluZyBib3hlcyBpbnRlcnNlY3RcbiAgICAgLSBiYm94MSAoc3RyaW5nKSBmaXJzdCBib3VuZGluZyBib3hcbiAgICAgLSBiYm94MiAoc3RyaW5nKSBzZWNvbmQgYm91bmRpbmcgYm94XG4gICAgID0gKGJvb2xlYW4pIGB0cnVlYCBpZiBib3VuZGluZyBib3hlcyBpbnRlcnNlY3RcbiAgICBcXCovXG4gICAgU25hcC5wYXRoLmlzQkJveEludGVyc2VjdCA9IGlzQkJveEludGVyc2VjdDtcbiAgICAvKlxcXG4gICAgICogU25hcC5wYXRoLmludGVyc2VjdGlvblxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogVXRpbGl0eSBtZXRob2RcbiAgICAgKipcbiAgICAgKiBGaW5kcyBpbnRlcnNlY3Rpb25zIG9mIHR3byBwYXRoc1xuICAgICAtIHBhdGgxIChzdHJpbmcpIHBhdGggc3RyaW5nXG4gICAgIC0gcGF0aDIgKHN0cmluZykgcGF0aCBzdHJpbmdcbiAgICAgPSAoYXJyYXkpIGRvdHMgb2YgaW50ZXJzZWN0aW9uXG4gICAgIG8gW1xuICAgICBvICAgICB7XG4gICAgIG8gICAgICAgICB4OiAobnVtYmVyKSB4IGNvb3JkaW5hdGUgb2YgdGhlIHBvaW50LFxuICAgICBvICAgICAgICAgeTogKG51bWJlcikgeSBjb29yZGluYXRlIG9mIHRoZSBwb2ludCxcbiAgICAgbyAgICAgICAgIHQxOiAobnVtYmVyKSB0IHZhbHVlIGZvciBzZWdtZW50IG9mIHBhdGgxLFxuICAgICBvICAgICAgICAgdDI6IChudW1iZXIpIHQgdmFsdWUgZm9yIHNlZ21lbnQgb2YgcGF0aDIsXG4gICAgIG8gICAgICAgICBzZWdtZW50MTogKG51bWJlcikgb3JkZXIgbnVtYmVyIGZvciBzZWdtZW50IG9mIHBhdGgxLFxuICAgICBvICAgICAgICAgc2VnbWVudDI6IChudW1iZXIpIG9yZGVyIG51bWJlciBmb3Igc2VnbWVudCBvZiBwYXRoMixcbiAgICAgbyAgICAgICAgIGJlejE6IChhcnJheSkgZWlnaHQgY29vcmRpbmF0ZXMgcmVwcmVzZW50aW5nIGJlemnDqXIgY3VydmUgZm9yIHRoZSBzZWdtZW50IG9mIHBhdGgxLFxuICAgICBvICAgICAgICAgYmV6MjogKGFycmF5KSBlaWdodCBjb29yZGluYXRlcyByZXByZXNlbnRpbmcgYmV6acOpciBjdXJ2ZSBmb3IgdGhlIHNlZ21lbnQgb2YgcGF0aDJcbiAgICAgbyAgICAgfVxuICAgICBvIF1cbiAgICBcXCovXG4gICAgU25hcC5wYXRoLmludGVyc2VjdGlvbiA9IHBhdGhJbnRlcnNlY3Rpb247XG4gICAgU25hcC5wYXRoLmludGVyc2VjdGlvbk51bWJlciA9IHBhdGhJbnRlcnNlY3Rpb25OdW1iZXI7XG4gICAgLypcXFxuICAgICAqIFNuYXAucGF0aC5pc1BvaW50SW5zaWRlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBVdGlsaXR5IG1ldGhvZFxuICAgICAqKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIGdpdmVuIHBvaW50IGlzIGluc2lkZSBhIGdpdmVuIGNsb3NlZCBwYXRoLlxuICAgICAqXG4gICAgICogTm90ZTogZmlsbCBtb2RlIGRvZXNu4oCZdCBhZmZlY3QgdGhlIHJlc3VsdCBvZiB0aGlzIG1ldGhvZC5cbiAgICAgLSBwYXRoIChzdHJpbmcpIHBhdGggc3RyaW5nXG4gICAgIC0geCAobnVtYmVyKSB4IG9mIHRoZSBwb2ludFxuICAgICAtIHkgKG51bWJlcikgeSBvZiB0aGUgcG9pbnRcbiAgICAgPSAoYm9vbGVhbikgYHRydWVgIGlmIHBvaW50IGlzIGluc2lkZSB0aGUgcGF0aFxuICAgIFxcKi9cbiAgICBTbmFwLnBhdGguaXNQb2ludEluc2lkZSA9IGlzUG9pbnRJbnNpZGVQYXRoO1xuICAgIC8qXFxcbiAgICAgKiBTbmFwLnBhdGguZ2V0QkJveFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogVXRpbGl0eSBtZXRob2RcbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIHRoZSBib3VuZGluZyBib3ggb2YgYSBnaXZlbiBwYXRoXG4gICAgIC0gcGF0aCAoc3RyaW5nKSBwYXRoIHN0cmluZ1xuICAgICA9IChvYmplY3QpIGJvdW5kaW5nIGJveFxuICAgICBvIHtcbiAgICAgbyAgICAgeDogKG51bWJlcikgeCBjb29yZGluYXRlIG9mIHRoZSBsZWZ0IHRvcCBwb2ludCBvZiB0aGUgYm94LFxuICAgICBvICAgICB5OiAobnVtYmVyKSB5IGNvb3JkaW5hdGUgb2YgdGhlIGxlZnQgdG9wIHBvaW50IG9mIHRoZSBib3gsXG4gICAgIG8gICAgIHgyOiAobnVtYmVyKSB4IGNvb3JkaW5hdGUgb2YgdGhlIHJpZ2h0IGJvdHRvbSBwb2ludCBvZiB0aGUgYm94LFxuICAgICBvICAgICB5MjogKG51bWJlcikgeSBjb29yZGluYXRlIG9mIHRoZSByaWdodCBib3R0b20gcG9pbnQgb2YgdGhlIGJveCxcbiAgICAgbyAgICAgd2lkdGg6IChudW1iZXIpIHdpZHRoIG9mIHRoZSBib3gsXG4gICAgIG8gICAgIGhlaWdodDogKG51bWJlcikgaGVpZ2h0IG9mIHRoZSBib3hcbiAgICAgbyB9XG4gICAgXFwqL1xuICAgIFNuYXAucGF0aC5nZXRCQm94ID0gcGF0aEJCb3g7XG4gICAgU25hcC5wYXRoLmdldCA9IGdldFBhdGg7XG4gICAgLypcXFxuICAgICAqIFNuYXAucGF0aC50b1JlbGF0aXZlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBVdGlsaXR5IG1ldGhvZFxuICAgICAqKlxuICAgICAqIENvbnZlcnRzIHBhdGggY29vcmRpbmF0ZXMgaW50byByZWxhdGl2ZSB2YWx1ZXNcbiAgICAgLSBwYXRoIChzdHJpbmcpIHBhdGggc3RyaW5nXG4gICAgID0gKGFycmF5KSBwYXRoIHN0cmluZ1xuICAgIFxcKi9cbiAgICBTbmFwLnBhdGgudG9SZWxhdGl2ZSA9IHBhdGhUb1JlbGF0aXZlO1xuICAgIC8qXFxcbiAgICAgKiBTbmFwLnBhdGgudG9BYnNvbHV0ZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogVXRpbGl0eSBtZXRob2RcbiAgICAgKipcbiAgICAgKiBDb252ZXJ0cyBwYXRoIGNvb3JkaW5hdGVzIGludG8gYWJzb2x1dGUgdmFsdWVzXG4gICAgIC0gcGF0aCAoc3RyaW5nKSBwYXRoIHN0cmluZ1xuICAgICA9IChhcnJheSkgcGF0aCBzdHJpbmdcbiAgICBcXCovXG4gICAgU25hcC5wYXRoLnRvQWJzb2x1dGUgPSBwYXRoVG9BYnNvbHV0ZTtcbiAgICAvKlxcXG4gICAgICogU25hcC5wYXRoLnRvQ3ViaWNcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFV0aWxpdHkgbWV0aG9kXG4gICAgICoqXG4gICAgICogQ29udmVydHMgcGF0aCB0byBhIG5ldyBwYXRoIHdoZXJlIGFsbCBzZWdtZW50cyBhcmUgY3ViaWMgYmV6acOpciBjdXJ2ZXNcbiAgICAgLSBwYXRoU3RyaW5nIChzdHJpbmd8YXJyYXkpIHBhdGggc3RyaW5nIG9yIGFycmF5IG9mIHNlZ21lbnRzXG4gICAgID0gKGFycmF5KSBhcnJheSBvZiBzZWdtZW50c1xuICAgIFxcKi9cbiAgICBTbmFwLnBhdGgudG9DdWJpYyA9IHBhdGgyY3VydmU7XG4gICAgLypcXFxuICAgICAqIFNuYXAucGF0aC5tYXBcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFRyYW5zZm9ybSB0aGUgcGF0aCBzdHJpbmcgd2l0aCB0aGUgZ2l2ZW4gbWF0cml4XG4gICAgIC0gcGF0aCAoc3RyaW5nKSBwYXRoIHN0cmluZ1xuICAgICAtIG1hdHJpeCAob2JqZWN0KSBzZWUgQE1hdHJpeFxuICAgICA9IChzdHJpbmcpIHRyYW5zZm9ybWVkIHBhdGggc3RyaW5nXG4gICAgXFwqL1xuICAgIFNuYXAucGF0aC5tYXAgPSBtYXBQYXRoO1xuICAgIFNuYXAucGF0aC50b1N0cmluZyA9IHRvU3RyaW5nO1xuICAgIFNuYXAucGF0aC5jbG9uZSA9IHBhdGhDbG9uZTtcbn0pO1xuXG4vLyBDb3B5cmlnaHQgKGMpIDIwMTMgQWRvYmUgU3lzdGVtcyBJbmNvcnBvcmF0ZWQuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBcbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vIFxuLy8gaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vLyBcbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5TbmFwLnBsdWdpbihmdW5jdGlvbiAoU25hcCwgRWxlbWVudCwgUGFwZXIsIGdsb2IpIHtcbiAgICB2YXIgbW1heCA9IE1hdGgubWF4LFxuICAgICAgICBtbWluID0gTWF0aC5taW47XG5cbiAgICAvLyBTZXRcbiAgICB2YXIgU2V0ID0gZnVuY3Rpb24gKGl0ZW1zKSB7XG4gICAgICAgIHRoaXMuaXRlbXMgPSBbXTtcblx0dGhpcy5iaW5kaW5ncyA9IHt9O1xuICAgICAgICB0aGlzLmxlbmd0aCA9IDA7XG4gICAgICAgIHRoaXMudHlwZSA9IFwic2V0XCI7XG4gICAgICAgIGlmIChpdGVtcykge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gaXRlbXMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChpdGVtc1tpXSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzW3RoaXMuaXRlbXMubGVuZ3RoXSA9IHRoaXMuaXRlbXNbdGhpcy5pdGVtcy5sZW5ndGhdID0gaXRlbXNbaV07XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGVuZ3RoKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBzZXRwcm90byA9IFNldC5wcm90b3R5cGU7XG4gICAgLypcXFxuICAgICAqIFNldC5wdXNoXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBBZGRzIGVhY2ggYXJndW1lbnQgdG8gdGhlIGN1cnJlbnQgc2V0XG4gICAgID0gKG9iamVjdCkgb3JpZ2luYWwgZWxlbWVudFxuICAgIFxcKi9cbiAgICBzZXRwcm90by5wdXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgaXRlbSxcbiAgICAgICAgICAgIGxlbjtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIGl0ZW0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgICAgICBpZiAoaXRlbSkge1xuICAgICAgICAgICAgICAgIGxlbiA9IHRoaXMuaXRlbXMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHRoaXNbbGVuXSA9IHRoaXMuaXRlbXNbbGVuXSA9IGl0ZW07XG4gICAgICAgICAgICAgICAgdGhpcy5sZW5ndGgrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBTZXQucG9wXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIGxhc3QgZWxlbWVudCBhbmQgcmV0dXJucyBpdFxuICAgICA9IChvYmplY3QpIGVsZW1lbnRcbiAgICBcXCovXG4gICAgc2V0cHJvdG8ucG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmxlbmd0aCAmJiBkZWxldGUgdGhpc1t0aGlzLmxlbmd0aC0tXTtcbiAgICAgICAgcmV0dXJuIHRoaXMuaXRlbXMucG9wKCk7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogU2V0LmZvckVhY2hcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEV4ZWN1dGVzIGdpdmVuIGZ1bmN0aW9uIGZvciBlYWNoIGVsZW1lbnQgaW4gdGhlIHNldFxuICAgICAqXG4gICAgICogSWYgdGhlIGZ1bmN0aW9uIHJldHVybnMgYGZhbHNlYCwgdGhlIGxvb3Agc3RvcHMgcnVubmluZy5cbiAgICAgKipcbiAgICAgLSBjYWxsYmFjayAoZnVuY3Rpb24pIGZ1bmN0aW9uIHRvIHJ1blxuICAgICAtIHRoaXNBcmcgKG9iamVjdCkgY29udGV4dCBvYmplY3QgZm9yIHRoZSBjYWxsYmFja1xuICAgICA9IChvYmplY3QpIFNldCBvYmplY3RcbiAgICBcXCovXG4gICAgc2V0cHJvdG8uZm9yRWFjaCA9IGZ1bmN0aW9uIChjYWxsYmFjaywgdGhpc0FyZykge1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSB0aGlzLml0ZW1zLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChjYWxsYmFjay5jYWxsKHRoaXNBcmcsIHRoaXMuaXRlbXNbaV0sIGkpID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFNldC5hbmltYXRlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBBbmltYXRlcyBlYWNoIGVsZW1lbnQgaW4gc2V0IGluIHN5bmMuXG4gICAgICpcbiAgICAgKipcbiAgICAgLSBhdHRycyAob2JqZWN0KSBrZXktdmFsdWUgcGFpcnMgb2YgZGVzdGluYXRpb24gYXR0cmlidXRlc1xuICAgICAtIGR1cmF0aW9uIChudW1iZXIpIGR1cmF0aW9uIG9mIHRoZSBhbmltYXRpb24gaW4gbWlsbGlzZWNvbmRzXG4gICAgIC0gZWFzaW5nIChmdW5jdGlvbikgI29wdGlvbmFsIGVhc2luZyBmdW5jdGlvbiBmcm9tIEBtaW5hIG9yIGN1c3RvbVxuICAgICAtIGNhbGxiYWNrIChmdW5jdGlvbikgI29wdGlvbmFsIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgZXhlY3V0ZXMgd2hlbiB0aGUgYW5pbWF0aW9uIGVuZHNcbiAgICAgKiBvclxuICAgICAtIGFuaW1hdGlvbiAoYXJyYXkpIGFycmF5IG9mIGFuaW1hdGlvbiBwYXJhbWV0ZXIgZm9yIGVhY2ggZWxlbWVudCBpbiBzZXQgaW4gZm9ybWF0IGBbYXR0cnMsIGR1cmF0aW9uLCBlYXNpbmcsIGNhbGxiYWNrXWBcbiAgICAgPiBVc2FnZVxuICAgICB8IC8vIGFuaW1hdGUgYWxsIGVsZW1lbnRzIGluIHNldCB0byByYWRpdXMgMTBcbiAgICAgfCBzZXQuYW5pbWF0ZSh7cjogMTB9LCA1MDAsIG1pbmEuZWFzZWluKTtcbiAgICAgfCAvLyBvclxuICAgICB8IC8vIGFuaW1hdGUgZmlyc3QgZWxlbWVudCB0byByYWRpdXMgMTAsIGJ1dCBzZWNvbmQgdG8gcmFkaXVzIDIwIGFuZCBpbiBkaWZmZXJlbnQgdGltZVxuICAgICB8IHNldC5hbmltYXRlKFt7cjogMTB9LCA1MDAsIG1pbmEuZWFzZWluXSwgW3tyOiAyMH0sIDE1MDAsIG1pbmEuZWFzZWluXSk7XG4gICAgID0gKEVsZW1lbnQpIHRoZSBjdXJyZW50IGVsZW1lbnRcbiAgICBcXCovXG4gICAgc2V0cHJvdG8uYW5pbWF0ZSA9IGZ1bmN0aW9uIChhdHRycywgbXMsIGVhc2luZywgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBlYXNpbmcgPT0gXCJmdW5jdGlvblwiICYmICFlYXNpbmcubGVuZ3RoKSB7XG4gICAgICAgICAgICBjYWxsYmFjayA9IGVhc2luZztcbiAgICAgICAgICAgIGVhc2luZyA9IG1pbmEubGluZWFyO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhdHRycyBpbnN0YW5jZW9mIFNuYXAuXy5BbmltYXRpb24pIHtcbiAgICAgICAgICAgIGNhbGxiYWNrID0gYXR0cnMuY2FsbGJhY2s7XG4gICAgICAgICAgICBlYXNpbmcgPSBhdHRycy5lYXNpbmc7XG4gICAgICAgICAgICBtcyA9IGVhc2luZy5kdXI7XG4gICAgICAgICAgICBhdHRycyA9IGF0dHJzLmF0dHI7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICAgIGlmIChTbmFwLmlzKGF0dHJzLCBcImFycmF5XCIpICYmIFNuYXAuaXMoYXJnc1thcmdzLmxlbmd0aCAtIDFdLCBcImFycmF5XCIpKSB7XG4gICAgICAgICAgICB2YXIgZWFjaCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGJlZ2luLFxuICAgICAgICAgICAgaGFuZGxlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoYmVnaW4pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5iID0gYmVnaW47XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYmVnaW4gPSB0aGlzLmI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNiID0gMCxcbiAgICAgICAgICAgIHNldCA9IHRoaXMsXG4gICAgICAgICAgICBjYWxsYmFja2VyID0gY2FsbGJhY2sgJiYgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICgrK2NiID09IHNldC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2suY2FsbCh0aGlzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICByZXR1cm4gdGhpcy5mb3JFYWNoKGZ1bmN0aW9uIChlbCwgaSkge1xuICAgICAgICAgICAgZXZlLm9uY2UoXCJzbmFwLmFuaW1jcmVhdGVkLlwiICsgZWwuaWQsIGhhbmRsZXIpO1xuICAgICAgICAgICAgaWYgKGVhY2gpIHtcbiAgICAgICAgICAgICAgICBhcmdzW2ldICYmIGVsLmFuaW1hdGUuYXBwbHkoZWwsIGFyZ3NbaV0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBlbC5hbmltYXRlKGF0dHJzLCBtcywgZWFzaW5nLCBjYWxsYmFja2VyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBzZXRwcm90by5yZW1vdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHdoaWxlICh0aGlzLmxlbmd0aCkge1xuICAgICAgICAgICAgdGhpcy5wb3AoKS5yZW1vdmUoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBTZXQuYmluZFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogU3BlY2lmaWVzIGhvdyB0byBoYW5kbGUgYSBzcGVjaWZpYyBhdHRyaWJ1dGUgd2hlbiBhcHBsaWVkXG4gICAgICogdG8gYSBzZXQuXG4gICAgICpcbiAgICAgKipcbiAgICAgLSBhdHRyIChzdHJpbmcpIGF0dHJpYnV0ZSBuYW1lXG4gICAgIC0gY2FsbGJhY2sgKGZ1bmN0aW9uKSBmdW5jdGlvbiB0byBydW5cbiAgICAgKiBvclxuICAgICAtIGF0dHIgKHN0cmluZykgYXR0cmlidXRlIG5hbWVcbiAgICAgLSBlbGVtZW50IChFbGVtZW50KSBzcGVjaWZpYyBlbGVtZW50IGluIHRoZSBzZXQgdG8gYXBwbHkgdGhlIGF0dHJpYnV0ZSB0b1xuICAgICAqIG9yXG4gICAgIC0gYXR0ciAoc3RyaW5nKSBhdHRyaWJ1dGUgbmFtZVxuICAgICAtIGVsZW1lbnQgKEVsZW1lbnQpIHNwZWNpZmljIGVsZW1lbnQgaW4gdGhlIHNldCB0byBhcHBseSB0aGUgYXR0cmlidXRlIHRvXG4gICAgIC0gZWF0dHIgKHN0cmluZykgYXR0cmlidXRlIG9uIHRoZSBlbGVtZW50IHRvIGJpbmQgdGhlIGF0dHJpYnV0ZSB0b1xuICAgICA9IChvYmplY3QpIFNldCBvYmplY3RcbiAgICBcXCovXG4gICAgc2V0cHJvdG8uYmluZCA9IGZ1bmN0aW9uIChhdHRyLCBhLCBiKSB7XG4gICAgICAgIHZhciBkYXRhID0ge307XG4gICAgICAgIGlmICh0eXBlb2YgYSA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRoaXMuYmluZGluZ3NbYXR0cl0gPSBhO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIGFuYW1lID0gYiB8fCBhdHRyO1xuICAgICAgICAgICAgdGhpcy5iaW5kaW5nc1thdHRyXSA9IGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICAgICAgZGF0YVthbmFtZV0gPSB2O1xuICAgICAgICAgICAgICAgIGEuYXR0cihkYXRhKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBzZXRwcm90by5hdHRyID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHZhciB1bmJvdW5kID0ge307XG4gICAgICAgIGZvciAodmFyIGsgaW4gdmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmJpbmRpbmdzW2tdKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5iaW5kaW5nc1trXSh2YWx1ZVtrXSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHVuYm91bmRba10gPSB2YWx1ZVtrXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSB0aGlzLml0ZW1zLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuaXRlbXNbaV0uYXR0cih1bmJvdW5kKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBTZXQuY2xlYXJcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgYWxsIGVsZW1lbnRzIGZyb20gdGhlIHNldFxuICAgIFxcKi9cbiAgICBzZXRwcm90by5jbGVhciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgd2hpbGUgKHRoaXMubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aGlzLnBvcCgpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogU2V0LnNwbGljZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyByYW5nZSBvZiBlbGVtZW50cyBmcm9tIHRoZSBzZXRcbiAgICAgKipcbiAgICAgLSBpbmRleCAobnVtYmVyKSBwb3NpdGlvbiBvZiB0aGUgZGVsZXRpb25cbiAgICAgLSBjb3VudCAobnVtYmVyKSBudW1iZXIgb2YgZWxlbWVudCB0byByZW1vdmVcbiAgICAgLSBpbnNlcnRpb27igKYgKG9iamVjdCkgI29wdGlvbmFsIGVsZW1lbnRzIHRvIGluc2VydFxuICAgICA9IChvYmplY3QpIHNldCBlbGVtZW50cyB0aGF0IHdlcmUgZGVsZXRlZFxuICAgIFxcKi9cbiAgICBzZXRwcm90by5zcGxpY2UgPSBmdW5jdGlvbiAoaW5kZXgsIGNvdW50LCBpbnNlcnRpb24pIHtcbiAgICAgICAgaW5kZXggPSBpbmRleCA8IDAgPyBtbWF4KHRoaXMubGVuZ3RoICsgaW5kZXgsIDApIDogaW5kZXg7XG4gICAgICAgIGNvdW50ID0gbW1heCgwLCBtbWluKHRoaXMubGVuZ3RoIC0gaW5kZXgsIGNvdW50KSk7XG4gICAgICAgIHZhciB0YWlsID0gW10sXG4gICAgICAgICAgICB0b2RlbCA9IFtdLFxuICAgICAgICAgICAgYXJncyA9IFtdLFxuICAgICAgICAgICAgaTtcbiAgICAgICAgZm9yIChpID0gMjsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJncy5wdXNoKGFyZ3VtZW50c1tpXSk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgICAgIHRvZGVsLnB1c2godGhpc1tpbmRleCArIGldKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKDsgaSA8IHRoaXMubGVuZ3RoIC0gaW5kZXg7IGkrKykge1xuICAgICAgICAgICAgdGFpbC5wdXNoKHRoaXNbaW5kZXggKyBpXSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGFyZ2xlbiA9IGFyZ3MubGVuZ3RoO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYXJnbGVuICsgdGFpbC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5pdGVtc1tpbmRleCArIGldID0gdGhpc1tpbmRleCArIGldID0gaSA8IGFyZ2xlbiA/IGFyZ3NbaV0gOiB0YWlsW2kgLSBhcmdsZW5dO1xuICAgICAgICB9XG4gICAgICAgIGkgPSB0aGlzLml0ZW1zLmxlbmd0aCA9IHRoaXMubGVuZ3RoIC09IGNvdW50IC0gYXJnbGVuO1xuICAgICAgICB3aGlsZSAodGhpc1tpXSkge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXNbaSsrXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IFNldCh0b2RlbCk7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogU2V0LmV4Y2x1ZGVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgZ2l2ZW4gZWxlbWVudCBmcm9tIHRoZSBzZXRcbiAgICAgKipcbiAgICAgLSBlbGVtZW50IChvYmplY3QpIGVsZW1lbnQgdG8gcmVtb3ZlXG4gICAgID0gKGJvb2xlYW4pIGB0cnVlYCBpZiBvYmplY3Qgd2FzIGZvdW5kIGFuZCByZW1vdmVkIGZyb20gdGhlIHNldFxuICAgIFxcKi9cbiAgICBzZXRwcm90by5leGNsdWRlID0gZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IHRoaXMubGVuZ3RoOyBpIDwgaWk7IGkrKykgaWYgKHRoaXNbaV0gPT0gZWwpIHtcbiAgICAgICAgICAgIHRoaXMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG4gICAgc2V0cHJvdG8uaW5zZXJ0QWZ0ZXIgPSBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgdmFyIGkgPSB0aGlzLml0ZW1zLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgdGhpcy5pdGVtc1tpXS5pbnNlcnRBZnRlcihlbCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBzZXRwcm90by5nZXRCQm94ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgeCA9IFtdLFxuICAgICAgICAgICAgeSA9IFtdLFxuICAgICAgICAgICAgeDIgPSBbXSxcbiAgICAgICAgICAgIHkyID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSB0aGlzLml0ZW1zLmxlbmd0aDsgaS0tOykgaWYgKCF0aGlzLml0ZW1zW2ldLnJlbW92ZWQpIHtcbiAgICAgICAgICAgIHZhciBib3ggPSB0aGlzLml0ZW1zW2ldLmdldEJCb3goKTtcbiAgICAgICAgICAgIHgucHVzaChib3gueCk7XG4gICAgICAgICAgICB5LnB1c2goYm94LnkpO1xuICAgICAgICAgICAgeDIucHVzaChib3gueCArIGJveC53aWR0aCk7XG4gICAgICAgICAgICB5Mi5wdXNoKGJveC55ICsgYm94LmhlaWdodCk7XG4gICAgICAgIH1cbiAgICAgICAgeCA9IG1taW4uYXBwbHkoMCwgeCk7XG4gICAgICAgIHkgPSBtbWluLmFwcGx5KDAsIHkpO1xuICAgICAgICB4MiA9IG1tYXguYXBwbHkoMCwgeDIpO1xuICAgICAgICB5MiA9IG1tYXguYXBwbHkoMCwgeTIpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeDogeCxcbiAgICAgICAgICAgIHk6IHksXG4gICAgICAgICAgICB4MjogeDIsXG4gICAgICAgICAgICB5MjogeTIsXG4gICAgICAgICAgICB3aWR0aDogeDIgLSB4LFxuICAgICAgICAgICAgaGVpZ2h0OiB5MiAtIHksXG4gICAgICAgICAgICBjeDogeCArICh4MiAtIHgpIC8gMixcbiAgICAgICAgICAgIGN5OiB5ICsgKHkyIC0geSkgLyAyXG4gICAgICAgIH07XG4gICAgfTtcbiAgICBzZXRwcm90by5jbG9uZSA9IGZ1bmN0aW9uIChzKSB7XG4gICAgICAgIHMgPSBuZXcgU2V0O1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSB0aGlzLml0ZW1zLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIHMucHVzaCh0aGlzLml0ZW1zW2ldLmNsb25lKCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzO1xuICAgIH07XG4gICAgc2V0cHJvdG8udG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBcIlNuYXBcXHUyMDE4cyBzZXRcIjtcbiAgICB9O1xuICAgIHNldHByb3RvLnR5cGUgPSBcInNldFwiO1xuICAgIC8vIGV4cG9ydFxuICAgIFNuYXAuU2V0ID0gU2V0O1xuICAgIFNuYXAuc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgc2V0ID0gbmV3IFNldDtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHNldC5wdXNoLmFwcGx5KHNldCwgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNldDtcbiAgICB9O1xufSk7XG5cbi8vIENvcHlyaWdodCAoYykgMjAxMyBBZG9iZSBTeXN0ZW1zIEluY29ycG9yYXRlZC4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIFxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy8gXG4vLyBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vIFxuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cblNuYXAucGx1Z2luKGZ1bmN0aW9uIChTbmFwLCBFbGVtZW50LCBQYXBlciwgZ2xvYikge1xuICAgIHZhciBuYW1lcyA9IHt9LFxuICAgICAgICByZVVuaXQgPSAvW2Etel0rJC9pLFxuICAgICAgICBTdHIgPSBTdHJpbmc7XG4gICAgbmFtZXMuc3Ryb2tlID0gbmFtZXMuZmlsbCA9IFwiY29sb3VyXCI7XG4gICAgZnVuY3Rpb24gZ2V0RW1wdHkoaXRlbSkge1xuICAgICAgICB2YXIgbCA9IGl0ZW1bMF07XG4gICAgICAgIHN3aXRjaCAobC50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgICAgICBjYXNlIFwidFwiOiByZXR1cm4gW2wsIDAsIDBdO1xuICAgICAgICAgICAgY2FzZSBcIm1cIjogcmV0dXJuIFtsLCAxLCAwLCAwLCAxLCAwLCAwXTtcbiAgICAgICAgICAgIGNhc2UgXCJyXCI6IGlmIChpdGVtLmxlbmd0aCA9PSA0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtsLCAwLCBpdGVtWzJdLCBpdGVtWzNdXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtsLCAwXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgXCJzXCI6IGlmIChpdGVtLmxlbmd0aCA9PSA1KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtsLCAxLCAxLCBpdGVtWzNdLCBpdGVtWzRdXTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaXRlbS5sZW5ndGggPT0gMykge1xuICAgICAgICAgICAgICAgIHJldHVybiBbbCwgMSwgMV07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBbbCwgMV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gZXF1YWxpc2VUcmFuc2Zvcm0odDEsIHQyLCBnZXRCQm94KSB7XG4gICAgICAgIHQyID0gU3RyKHQyKS5yZXBsYWNlKC9cXC57M318XFx1MjAyNi9nLCB0MSk7XG4gICAgICAgIHQxID0gU25hcC5wYXJzZVRyYW5zZm9ybVN0cmluZyh0MSkgfHwgW107XG4gICAgICAgIHQyID0gU25hcC5wYXJzZVRyYW5zZm9ybVN0cmluZyh0MikgfHwgW107XG4gICAgICAgIHZhciBtYXhsZW5ndGggPSBNYXRoLm1heCh0MS5sZW5ndGgsIHQyLmxlbmd0aCksXG4gICAgICAgICAgICBmcm9tID0gW10sXG4gICAgICAgICAgICB0byA9IFtdLFxuICAgICAgICAgICAgaSA9IDAsIGosIGpqLFxuICAgICAgICAgICAgdHQxLCB0dDI7XG4gICAgICAgIGZvciAoOyBpIDwgbWF4bGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHR0MSA9IHQxW2ldIHx8IGdldEVtcHR5KHQyW2ldKTtcbiAgICAgICAgICAgIHR0MiA9IHQyW2ldIHx8IGdldEVtcHR5KHR0MSk7XG4gICAgICAgICAgICBpZiAoKHR0MVswXSAhPSB0dDJbMF0pIHx8XG4gICAgICAgICAgICAgICAgKHR0MVswXS50b0xvd2VyQ2FzZSgpID09IFwiclwiICYmICh0dDFbMl0gIT0gdHQyWzJdIHx8IHR0MVszXSAhPSB0dDJbM10pKSB8fFxuICAgICAgICAgICAgICAgICh0dDFbMF0udG9Mb3dlckNhc2UoKSA9PSBcInNcIiAmJiAodHQxWzNdICE9IHR0MlszXSB8fCB0dDFbNF0gIT0gdHQyWzRdKSlcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgdDEgPSBTbmFwLl8udHJhbnNmb3JtMm1hdHJpeCh0MSwgZ2V0QkJveCgpKTtcbiAgICAgICAgICAgICAgICAgICAgdDIgPSBTbmFwLl8udHJhbnNmb3JtMm1hdHJpeCh0MiwgZ2V0QkJveCgpKTtcbiAgICAgICAgICAgICAgICAgICAgZnJvbSA9IFtbXCJtXCIsIHQxLmEsIHQxLmIsIHQxLmMsIHQxLmQsIHQxLmUsIHQxLmZdXTtcbiAgICAgICAgICAgICAgICAgICAgdG8gPSBbW1wibVwiLCB0Mi5hLCB0Mi5iLCB0Mi5jLCB0Mi5kLCB0Mi5lLCB0Mi5mXV07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZnJvbVtpXSA9IFtdO1xuICAgICAgICAgICAgdG9baV0gPSBbXTtcbiAgICAgICAgICAgIGZvciAoaiA9IDAsIGpqID0gTWF0aC5tYXgodHQxLmxlbmd0aCwgdHQyLmxlbmd0aCk7IGogPCBqajsgaisrKSB7XG4gICAgICAgICAgICAgICAgaiBpbiB0dDEgJiYgKGZyb21baV1bal0gPSB0dDFbal0pO1xuICAgICAgICAgICAgICAgIGogaW4gdHQyICYmICh0b1tpXVtqXSA9IHR0MltqXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZyb206IHBhdGgyYXJyYXkoZnJvbSksXG4gICAgICAgICAgICB0bzogcGF0aDJhcnJheSh0byksXG4gICAgICAgICAgICBmOiBnZXRQYXRoKGZyb20pXG4gICAgICAgIH07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldE51bWJlcih2YWwpIHtcbiAgICAgICAgcmV0dXJuIHZhbDtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0VW5pdCh1bml0KSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgICByZXR1cm4gK3ZhbC50b0ZpeGVkKDMpICsgdW5pdDtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0Vmlld0JveCh2YWwpIHtcbiAgICAgICAgcmV0dXJuIHZhbC5qb2luKFwiIFwiKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0Q29sb3VyKGNscikge1xuICAgICAgICByZXR1cm4gU25hcC5yZ2IoY2xyWzBdLCBjbHJbMV0sIGNsclsyXSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldFBhdGgocGF0aCkge1xuICAgICAgICB2YXIgayA9IDAsIGksIGlpLCBqLCBqaiwgb3V0LCBhLCBiID0gW107XG4gICAgICAgIGZvciAoaSA9IDAsIGlpID0gcGF0aC5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICBvdXQgPSBcIltcIjtcbiAgICAgICAgICAgIGEgPSBbJ1wiJyArIHBhdGhbaV1bMF0gKyAnXCInXTtcbiAgICAgICAgICAgIGZvciAoaiA9IDEsIGpqID0gcGF0aFtpXS5sZW5ndGg7IGogPCBqajsgaisrKSB7XG4gICAgICAgICAgICAgICAgYVtqXSA9IFwidmFsW1wiICsgKGsrKykgKyBcIl1cIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG91dCArPSBhICsgXCJdXCI7XG4gICAgICAgICAgICBiW2ldID0gb3V0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBGdW5jdGlvbihcInZhbFwiLCBcInJldHVybiBTbmFwLnBhdGgudG9TdHJpbmcuY2FsbChbXCIgKyBiICsgXCJdKVwiKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gcGF0aDJhcnJheShwYXRoKSB7XG4gICAgICAgIHZhciBvdXQgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gcGF0aC5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMSwgamogPSBwYXRoW2ldLmxlbmd0aDsgaiA8IGpqOyBqKyspIHtcbiAgICAgICAgICAgICAgICBvdXQucHVzaChwYXRoW2ldW2pdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH1cbiAgICBmdW5jdGlvbiBpc051bWVyaWMob2JqKSB7XG4gICAgICAgIHJldHVybiBpc0Zpbml0ZShwYXJzZUZsb2F0KG9iaikpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBhcnJheUVxdWFsKGFycjEsIGFycjIpIHtcbiAgICAgICAgaWYgKCFTbmFwLmlzKGFycjEsIFwiYXJyYXlcIikgfHwgIVNuYXAuaXMoYXJyMiwgXCJhcnJheVwiKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhcnIxLnRvU3RyaW5nKCkgPT0gYXJyMi50b1N0cmluZygpO1xuICAgIH1cbiAgICBFbGVtZW50LnByb3RvdHlwZS5lcXVhbCA9IGZ1bmN0aW9uIChuYW1lLCBiKSB7XG4gICAgICAgIHJldHVybiBldmUoXCJzbmFwLnV0aWwuZXF1YWxcIiwgdGhpcywgbmFtZSwgYikuZmlyc3REZWZpbmVkKCk7XG4gICAgfTtcbiAgICBldmUub24oXCJzbmFwLnV0aWwuZXF1YWxcIiwgZnVuY3Rpb24gKG5hbWUsIGIpIHtcbiAgICAgICAgdmFyIEEsIEIsIGEgPSBTdHIodGhpcy5hdHRyKG5hbWUpIHx8IFwiXCIpLFxuICAgICAgICAgICAgZWwgPSB0aGlzO1xuICAgICAgICBpZiAoaXNOdW1lcmljKGEpICYmIGlzTnVtZXJpYyhiKSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBmcm9tOiBwYXJzZUZsb2F0KGEpLFxuICAgICAgICAgICAgICAgIHRvOiBwYXJzZUZsb2F0KGIpLFxuICAgICAgICAgICAgICAgIGY6IGdldE51bWJlclxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmFtZXNbbmFtZV0gPT0gXCJjb2xvdXJcIikge1xuICAgICAgICAgICAgQSA9IFNuYXAuY29sb3IoYSk7XG4gICAgICAgICAgICBCID0gU25hcC5jb2xvcihiKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgZnJvbTogW0EuciwgQS5nLCBBLmIsIEEub3BhY2l0eV0sXG4gICAgICAgICAgICAgICAgdG86IFtCLnIsIEIuZywgQi5iLCBCLm9wYWNpdHldLFxuICAgICAgICAgICAgICAgIGY6IGdldENvbG91clxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmFtZSA9PSBcInZpZXdCb3hcIikge1xuICAgICAgICAgICAgQSA9IHRoaXMuYXR0cihuYW1lKS52Yi5zcGxpdChcIiBcIikubWFwKE51bWJlcik7XG4gICAgICAgICAgICBCID0gYi5zcGxpdChcIiBcIikubWFwKE51bWJlcik7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGZyb206IEEsXG4gICAgICAgICAgICAgICAgdG86IEIsXG4gICAgICAgICAgICAgICAgZjogZ2V0Vmlld0JveFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmFtZSA9PSBcInRyYW5zZm9ybVwiIHx8IG5hbWUgPT0gXCJncmFkaWVudFRyYW5zZm9ybVwiIHx8IG5hbWUgPT0gXCJwYXR0ZXJuVHJhbnNmb3JtXCIpIHtcbiAgICAgICAgICAgIGlmIChiIGluc3RhbmNlb2YgU25hcC5NYXRyaXgpIHtcbiAgICAgICAgICAgICAgICBiID0gYi50b1RyYW5zZm9ybVN0cmluZygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFTbmFwLl8ucmdUcmFuc2Zvcm0udGVzdChiKSkge1xuICAgICAgICAgICAgICAgIGIgPSBTbmFwLl8uc3ZnVHJhbnNmb3JtMnN0cmluZyhiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBlcXVhbGlzZVRyYW5zZm9ybShhLCBiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsLmdldEJCb3goMSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmFtZSA9PSBcImRcIiB8fCBuYW1lID09IFwicGF0aFwiKSB7XG4gICAgICAgICAgICBBID0gU25hcC5wYXRoLnRvQ3ViaWMoYSwgYik7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGZyb206IHBhdGgyYXJyYXkoQVswXSksXG4gICAgICAgICAgICAgICAgdG86IHBhdGgyYXJyYXkoQVsxXSksXG4gICAgICAgICAgICAgICAgZjogZ2V0UGF0aChBWzBdKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmFtZSA9PSBcInBvaW50c1wiKSB7XG4gICAgICAgICAgICBBID0gU3RyKGEpLnNwbGl0KFNuYXAuXy5zZXBhcmF0b3IpO1xuICAgICAgICAgICAgQiA9IFN0cihiKS5zcGxpdChTbmFwLl8uc2VwYXJhdG9yKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgZnJvbTogQSxcbiAgICAgICAgICAgICAgICB0bzogQixcbiAgICAgICAgICAgICAgICBmOiBmdW5jdGlvbiAodmFsKSB7IHJldHVybiB2YWw7IH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGFVbml0ID0gYS5tYXRjaChyZVVuaXQpLFxuICAgICAgICAgICAgYlVuaXQgPSBTdHIoYikubWF0Y2gocmVVbml0KTtcbiAgICAgICAgaWYgKGFVbml0ICYmIGFycmF5RXF1YWwoYVVuaXQsIGJVbml0KSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBmcm9tOiBwYXJzZUZsb2F0KGEpLFxuICAgICAgICAgICAgICAgIHRvOiBwYXJzZUZsb2F0KGIpLFxuICAgICAgICAgICAgICAgIGY6IGdldFVuaXQoYVVuaXQpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBmcm9tOiB0aGlzLmFzUFgobmFtZSksXG4gICAgICAgICAgICAgICAgdG86IHRoaXMuYXNQWChuYW1lLCBiKSxcbiAgICAgICAgICAgICAgICBmOiBnZXROdW1iZXJcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG4vLyBDb3B5cmlnaHQgKGMpIDIwMTMgQWRvYmUgU3lzdGVtcyBJbmNvcnBvcmF0ZWQuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBcbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vIFxuLy8gaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vLyBcbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5TbmFwLnBsdWdpbihmdW5jdGlvbiAoU25hcCwgRWxlbWVudCwgUGFwZXIsIGdsb2IpIHtcbiAgICB2YXIgZWxwcm90byA9IEVsZW1lbnQucHJvdG90eXBlLFxuICAgIGhhcyA9IFwiaGFzT3duUHJvcGVydHlcIixcbiAgICBzdXBwb3J0c1RvdWNoID0gXCJjcmVhdGVUb3VjaFwiIGluIGdsb2IuZG9jLFxuICAgIGV2ZW50cyA9IFtcbiAgICAgICAgXCJjbGlja1wiLCBcImRibGNsaWNrXCIsIFwibW91c2Vkb3duXCIsIFwibW91c2Vtb3ZlXCIsIFwibW91c2VvdXRcIixcbiAgICAgICAgXCJtb3VzZW92ZXJcIiwgXCJtb3VzZXVwXCIsIFwidG91Y2hzdGFydFwiLCBcInRvdWNobW92ZVwiLCBcInRvdWNoZW5kXCIsXG4gICAgICAgIFwidG91Y2hjYW5jZWxcIlxuICAgIF0sXG4gICAgdG91Y2hNYXAgPSB7XG4gICAgICAgIG1vdXNlZG93bjogXCJ0b3VjaHN0YXJ0XCIsXG4gICAgICAgIG1vdXNlbW92ZTogXCJ0b3VjaG1vdmVcIixcbiAgICAgICAgbW91c2V1cDogXCJ0b3VjaGVuZFwiXG4gICAgfSxcbiAgICBnZXRTY3JvbGwgPSBmdW5jdGlvbiAoeHksIGVsKSB7XG4gICAgICAgIHZhciBuYW1lID0geHkgPT0gXCJ5XCIgPyBcInNjcm9sbFRvcFwiIDogXCJzY3JvbGxMZWZ0XCIsXG4gICAgICAgICAgICBkb2MgPSBlbCAmJiBlbC5ub2RlID8gZWwubm9kZS5vd25lckRvY3VtZW50IDogZ2xvYi5kb2M7XG4gICAgICAgIHJldHVybiBkb2NbbmFtZSBpbiBkb2MuZG9jdW1lbnRFbGVtZW50ID8gXCJkb2N1bWVudEVsZW1lbnRcIiA6IFwiYm9keVwiXVtuYW1lXTtcbiAgICB9LFxuICAgIHByZXZlbnREZWZhdWx0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgfSxcbiAgICBwcmV2ZW50VG91Y2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm9yaWdpbmFsRXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9LFxuICAgIHN0b3BQcm9wYWdhdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5jYW5jZWxCdWJibGUgPSB0cnVlO1xuICAgIH0sXG4gICAgc3RvcFRvdWNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vcmlnaW5hbEV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH0sXG4gICAgYWRkRXZlbnQgPSBmdW5jdGlvbiAob2JqLCB0eXBlLCBmbiwgZWxlbWVudCkge1xuICAgICAgICB2YXIgcmVhbE5hbWUgPSBzdXBwb3J0c1RvdWNoICYmIHRvdWNoTWFwW3R5cGVdID8gdG91Y2hNYXBbdHlwZV0gOiB0eXBlLFxuICAgICAgICAgICAgZiA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNjcm9sbFkgPSBnZXRTY3JvbGwoXCJ5XCIsIGVsZW1lbnQpLFxuICAgICAgICAgICAgICAgICAgICBzY3JvbGxYID0gZ2V0U2Nyb2xsKFwieFwiLCBlbGVtZW50KTtcbiAgICAgICAgICAgICAgICBpZiAoc3VwcG9ydHNUb3VjaCAmJiB0b3VjaE1hcFtoYXNdKHR5cGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IGUudGFyZ2V0VG91Y2hlcyAmJiBlLnRhcmdldFRvdWNoZXMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUudGFyZ2V0VG91Y2hlc1tpXS50YXJnZXQgPT0gb2JqIHx8IG9iai5jb250YWlucyhlLnRhcmdldFRvdWNoZXNbaV0udGFyZ2V0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBvbGRlID0gZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlID0gZS50YXJnZXRUb3VjaGVzW2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUub3JpZ2luYWxFdmVudCA9IG9sZGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCA9IHByZXZlbnRUb3VjaDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbiA9IHN0b3BUb3VjaDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgeCA9IGUuY2xpZW50WCArIHNjcm9sbFgsXG4gICAgICAgICAgICAgICAgICAgIHkgPSBlLmNsaWVudFkgKyBzY3JvbGxZO1xuICAgICAgICAgICAgICAgIHJldHVybiBmbi5jYWxsKGVsZW1lbnQsIGUsIHgsIHkpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICBpZiAodHlwZSAhPT0gcmVhbE5hbWUpIHtcbiAgICAgICAgICAgIG9iai5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGYsIGZhbHNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG9iai5hZGRFdmVudExpc3RlbmVyKHJlYWxOYW1lLCBmLCBmYWxzZSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh0eXBlICE9PSByZWFsTmFtZSkge1xuICAgICAgICAgICAgICAgIG9iai5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGYsIGZhbHNlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgb2JqLnJlbW92ZUV2ZW50TGlzdGVuZXIocmVhbE5hbWUsIGYsIGZhbHNlKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9O1xuICAgIH0sXG4gICAgZHJhZyA9IFtdLFxuICAgIGRyYWdNb3ZlID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgdmFyIHggPSBlLmNsaWVudFgsXG4gICAgICAgICAgICB5ID0gZS5jbGllbnRZLFxuICAgICAgICAgICAgc2Nyb2xsWSA9IGdldFNjcm9sbChcInlcIiksXG4gICAgICAgICAgICBzY3JvbGxYID0gZ2V0U2Nyb2xsKFwieFwiKSxcbiAgICAgICAgICAgIGRyYWdpLFxuICAgICAgICAgICAgaiA9IGRyYWcubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoai0tKSB7XG4gICAgICAgICAgICBkcmFnaSA9IGRyYWdbal07XG4gICAgICAgICAgICBpZiAoc3VwcG9ydHNUb3VjaCkge1xuICAgICAgICAgICAgICAgIHZhciBpID0gZS50b3VjaGVzICYmIGUudG91Y2hlcy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgIHRvdWNoO1xuICAgICAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgdG91Y2ggPSBlLnRvdWNoZXNbaV07XG4gICAgICAgICAgICAgICAgICAgIGlmICh0b3VjaC5pZGVudGlmaWVyID09IGRyYWdpLmVsLl9kcmFnLmlkIHx8IGRyYWdpLmVsLm5vZGUuY29udGFpbnModG91Y2gudGFyZ2V0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgeCA9IHRvdWNoLmNsaWVudFg7XG4gICAgICAgICAgICAgICAgICAgICAgICB5ID0gdG91Y2guY2xpZW50WTtcbiAgICAgICAgICAgICAgICAgICAgICAgIChlLm9yaWdpbmFsRXZlbnQgPyBlLm9yaWdpbmFsRXZlbnQgOiBlKS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBub2RlID0gZHJhZ2kuZWwubm9kZSxcbiAgICAgICAgICAgICAgICBvLFxuICAgICAgICAgICAgICAgIG5leHQgPSBub2RlLm5leHRTaWJsaW5nLFxuICAgICAgICAgICAgICAgIHBhcmVudCA9IG5vZGUucGFyZW50Tm9kZSxcbiAgICAgICAgICAgICAgICBkaXNwbGF5ID0gbm9kZS5zdHlsZS5kaXNwbGF5O1xuICAgICAgICAgICAgLy8gZ2xvYi53aW4ub3BlcmEgJiYgcGFyZW50LnJlbW92ZUNoaWxkKG5vZGUpO1xuICAgICAgICAgICAgLy8gbm9kZS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICAvLyBvID0gZHJhZ2kuZWwucGFwZXIuZ2V0RWxlbWVudEJ5UG9pbnQoeCwgeSk7XG4gICAgICAgICAgICAvLyBub2RlLnN0eWxlLmRpc3BsYXkgPSBkaXNwbGF5O1xuICAgICAgICAgICAgLy8gZ2xvYi53aW4ub3BlcmEgJiYgKG5leHQgPyBwYXJlbnQuaW5zZXJ0QmVmb3JlKG5vZGUsIG5leHQpIDogcGFyZW50LmFwcGVuZENoaWxkKG5vZGUpKTtcbiAgICAgICAgICAgIC8vIG8gJiYgZXZlKFwic25hcC5kcmFnLm92ZXIuXCIgKyBkcmFnaS5lbC5pZCwgZHJhZ2kuZWwsIG8pO1xuICAgICAgICAgICAgeCArPSBzY3JvbGxYO1xuICAgICAgICAgICAgeSArPSBzY3JvbGxZO1xuICAgICAgICAgICAgZXZlKFwic25hcC5kcmFnLm1vdmUuXCIgKyBkcmFnaS5lbC5pZCwgZHJhZ2kubW92ZV9zY29wZSB8fCBkcmFnaS5lbCwgeCAtIGRyYWdpLmVsLl9kcmFnLngsIHkgLSBkcmFnaS5lbC5fZHJhZy55LCB4LCB5LCBlKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgZHJhZ1VwID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgU25hcC51bm1vdXNlbW92ZShkcmFnTW92ZSkudW5tb3VzZXVwKGRyYWdVcCk7XG4gICAgICAgIHZhciBpID0gZHJhZy5sZW5ndGgsXG4gICAgICAgICAgICBkcmFnaTtcbiAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgZHJhZ2kgPSBkcmFnW2ldO1xuICAgICAgICAgICAgZHJhZ2kuZWwuX2RyYWcgPSB7fTtcbiAgICAgICAgICAgIGV2ZShcInNuYXAuZHJhZy5lbmQuXCIgKyBkcmFnaS5lbC5pZCwgZHJhZ2kuZW5kX3Njb3BlIHx8IGRyYWdpLnN0YXJ0X3Njb3BlIHx8IGRyYWdpLm1vdmVfc2NvcGUgfHwgZHJhZ2kuZWwsIGUpO1xuICAgICAgICAgICAgZXZlLm9mZihcInNuYXAuZHJhZy4qLlwiICsgZHJhZ2kuZWwuaWQpO1xuICAgICAgICB9XG4gICAgICAgIGRyYWcgPSBbXTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LmNsaWNrXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBBZGRzIGEgY2xpY2sgZXZlbnQgaGFuZGxlciB0byB0aGUgZWxlbWVudFxuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC51bmNsaWNrXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIGEgY2xpY2sgZXZlbnQgaGFuZGxlciBmcm9tIHRoZSBlbGVtZW50XG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIFxuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LmRibGNsaWNrXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBBZGRzIGEgZG91YmxlIGNsaWNrIGV2ZW50IGhhbmRsZXIgdG8gdGhlIGVsZW1lbnRcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudW5kYmxjbGlja1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyBhIGRvdWJsZSBjbGljayBldmVudCBoYW5kbGVyIGZyb20gdGhlIGVsZW1lbnRcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQubW91c2Vkb3duXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBBZGRzIGEgbW91c2Vkb3duIGV2ZW50IGhhbmRsZXIgdG8gdGhlIGVsZW1lbnRcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudW5tb3VzZWRvd25cbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgYSBtb3VzZWRvd24gZXZlbnQgaGFuZGxlciBmcm9tIHRoZSBlbGVtZW50XG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIFxuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50Lm1vdXNlbW92ZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQWRkcyBhIG1vdXNlbW92ZSBldmVudCBoYW5kbGVyIHRvIHRoZSBlbGVtZW50XG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnVubW91c2Vtb3ZlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIGEgbW91c2Vtb3ZlIGV2ZW50IGhhbmRsZXIgZnJvbSB0aGUgZWxlbWVudFxuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICBcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5tb3VzZW91dFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQWRkcyBhIG1vdXNlb3V0IGV2ZW50IGhhbmRsZXIgdG8gdGhlIGVsZW1lbnRcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudW5tb3VzZW91dFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyBhIG1vdXNlb3V0IGV2ZW50IGhhbmRsZXIgZnJvbSB0aGUgZWxlbWVudFxuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICBcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5tb3VzZW92ZXJcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEFkZHMgYSBtb3VzZW92ZXIgZXZlbnQgaGFuZGxlciB0byB0aGUgZWxlbWVudFxuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC51bm1vdXNlb3ZlclxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyBhIG1vdXNlb3ZlciBldmVudCBoYW5kbGVyIGZyb20gdGhlIGVsZW1lbnRcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQubW91c2V1cFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQWRkcyBhIG1vdXNldXAgZXZlbnQgaGFuZGxlciB0byB0aGUgZWxlbWVudFxuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC51bm1vdXNldXBcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgYSBtb3VzZXVwIGV2ZW50IGhhbmRsZXIgZnJvbSB0aGUgZWxlbWVudFxuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICBcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC50b3VjaHN0YXJ0XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBBZGRzIGEgdG91Y2hzdGFydCBldmVudCBoYW5kbGVyIHRvIHRoZSBlbGVtZW50XG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnVudG91Y2hzdGFydFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyBhIHRvdWNoc3RhcnQgZXZlbnQgaGFuZGxlciBmcm9tIHRoZSBlbGVtZW50XG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIFxuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnRvdWNobW92ZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQWRkcyBhIHRvdWNobW92ZSBldmVudCBoYW5kbGVyIHRvIHRoZSBlbGVtZW50XG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnVudG91Y2htb3ZlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIGEgdG91Y2htb3ZlIGV2ZW50IGhhbmRsZXIgZnJvbSB0aGUgZWxlbWVudFxuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICBcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC50b3VjaGVuZFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQWRkcyBhIHRvdWNoZW5kIGV2ZW50IGhhbmRsZXIgdG8gdGhlIGVsZW1lbnRcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudW50b3VjaGVuZFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyBhIHRvdWNoZW5kIGV2ZW50IGhhbmRsZXIgZnJvbSB0aGUgZWxlbWVudFxuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICBcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC50b3VjaGNhbmNlbFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQWRkcyBhIHRvdWNoY2FuY2VsIGV2ZW50IGhhbmRsZXIgdG8gdGhlIGVsZW1lbnRcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudW50b3VjaGNhbmNlbFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyBhIHRvdWNoY2FuY2VsIGV2ZW50IGhhbmRsZXIgZnJvbSB0aGUgZWxlbWVudFxuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICBmb3IgKHZhciBpID0gZXZlbnRzLmxlbmd0aDsgaS0tOykge1xuICAgICAgICAoZnVuY3Rpb24gKGV2ZW50TmFtZSkge1xuICAgICAgICAgICAgU25hcFtldmVudE5hbWVdID0gZWxwcm90b1tldmVudE5hbWVdID0gZnVuY3Rpb24gKGZuLCBzY29wZSkge1xuICAgICAgICAgICAgICAgIGlmIChTbmFwLmlzKGZuLCBcImZ1bmN0aW9uXCIpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXZlbnRzID0gdGhpcy5ldmVudHMgfHwgW107XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXZlbnRzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogZXZlbnROYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgZjogZm4sXG4gICAgICAgICAgICAgICAgICAgICAgICB1bmJpbmQ6IGFkZEV2ZW50KHRoaXMubm9kZSB8fCBkb2N1bWVudCwgZXZlbnROYW1lLCBmbiwgc2NvcGUgfHwgdGhpcylcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gdGhpcy5ldmVudHMubGVuZ3RoOyBpIDwgaWk7IGkrKykgaWYgKHRoaXMuZXZlbnRzW2ldLm5hbWUgPT0gZXZlbnROYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZXZlbnRzW2ldLmYuY2FsbCh0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgU25hcFtcInVuXCIgKyBldmVudE5hbWVdID1cbiAgICAgICAgICAgIGVscHJvdG9bXCJ1blwiICsgZXZlbnROYW1lXSA9IGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgICAgIHZhciBldmVudHMgPSB0aGlzLmV2ZW50cyB8fCBbXSxcbiAgICAgICAgICAgICAgICAgICAgbCA9IGV2ZW50cy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgd2hpbGUgKGwtLSkgaWYgKGV2ZW50c1tsXS5uYW1lID09IGV2ZW50TmFtZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChldmVudHNbbF0uZiA9PSBmbiB8fCAhZm4pKSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50c1tsXS51bmJpbmQoKTtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRzLnNwbGljZShsLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgIWV2ZW50cy5sZW5ndGggJiYgZGVsZXRlIHRoaXMuZXZlbnRzO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KShldmVudHNbaV0pO1xuICAgIH1cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5ob3ZlclxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQWRkcyBob3ZlciBldmVudCBoYW5kbGVycyB0byB0aGUgZWxlbWVudFxuICAgICAtIGZfaW4gKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciBob3ZlciBpblxuICAgICAtIGZfb3V0IChmdW5jdGlvbikgaGFuZGxlciBmb3IgaG92ZXIgb3V0XG4gICAgIC0gaWNvbnRleHQgKG9iamVjdCkgI29wdGlvbmFsIGNvbnRleHQgZm9yIGhvdmVyIGluIGhhbmRsZXJcbiAgICAgLSBvY29udGV4dCAob2JqZWN0KSAjb3B0aW9uYWwgY29udGV4dCBmb3IgaG92ZXIgb3V0IGhhbmRsZXJcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICBlbHByb3RvLmhvdmVyID0gZnVuY3Rpb24gKGZfaW4sIGZfb3V0LCBzY29wZV9pbiwgc2NvcGVfb3V0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1vdXNlb3ZlcihmX2luLCBzY29wZV9pbikubW91c2VvdXQoZl9vdXQsIHNjb3BlX291dCB8fCBzY29wZV9pbik7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC51bmhvdmVyXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIGhvdmVyIGV2ZW50IGhhbmRsZXJzIGZyb20gdGhlIGVsZW1lbnRcbiAgICAgLSBmX2luIChmdW5jdGlvbikgaGFuZGxlciBmb3IgaG92ZXIgaW5cbiAgICAgLSBmX291dCAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIGhvdmVyIG91dFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIGVscHJvdG8udW5ob3ZlciA9IGZ1bmN0aW9uIChmX2luLCBmX291dCkge1xuICAgICAgICByZXR1cm4gdGhpcy51bm1vdXNlb3ZlcihmX2luKS51bm1vdXNlb3V0KGZfb3V0KTtcbiAgICB9O1xuICAgIHZhciBkcmFnZ2FibGUgPSBbXTtcbiAgICAvLyBTSUVSUkEgdW5jbGVhciB3aGF0IF9jb250ZXh0XyByZWZlcnMgdG8gZm9yIHN0YXJ0aW5nLCBlbmRpbmcsIG1vdmluZyB0aGUgZHJhZyBnZXN0dXJlLlxuICAgIC8vIFNJRVJSQSBFbGVtZW50LmRyYWcoKTogX3ggcG9zaXRpb24gb2YgdGhlIG1vdXNlXzogV2hlcmUgYXJlIHRoZSB4L3kgdmFsdWVzIG9mZnNldCBmcm9tP1xuICAgIC8vIFNJRVJSQSBFbGVtZW50LmRyYWcoKTogbXVjaCBvZiB0aGlzIG1lbWJlcidzIGRvYyBhcHBlYXJzIHRvIGJlIGR1cGxpY2F0ZWQgZm9yIHNvbWUgcmVhc29uLlxuICAgIC8vIFNJRVJSQSBVbmNsZWFyIGFib3V0IHRoaXMgc2VudGVuY2U6IF9BZGRpdGlvbmFsbHkgZm9sbG93aW5nIGRyYWcgZXZlbnRzIHdpbGwgYmUgdHJpZ2dlcmVkOiBkcmFnLnN0YXJ0LjxpZD4gb24gc3RhcnQsIGRyYWcuZW5kLjxpZD4gb24gZW5kIGFuZCBkcmFnLm1vdmUuPGlkPiBvbiBldmVyeSBtb3ZlLl8gSXMgdGhlcmUgYSBnbG9iYWwgX2RyYWdfIG9iamVjdCB0byB3aGljaCB5b3UgY2FuIGFzc2lnbiBoYW5kbGVycyBrZXllZCBieSBhbiBlbGVtZW50J3MgSUQ/XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuZHJhZ1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQWRkcyBldmVudCBoYW5kbGVycyBmb3IgYW4gZWxlbWVudCdzIGRyYWcgZ2VzdHVyZVxuICAgICAqKlxuICAgICAtIG9ubW92ZSAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIG1vdmluZ1xuICAgICAtIG9uc3RhcnQgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciBkcmFnIHN0YXJ0XG4gICAgIC0gb25lbmQgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciBkcmFnIGVuZFxuICAgICAtIG1jb250ZXh0IChvYmplY3QpICNvcHRpb25hbCBjb250ZXh0IGZvciBtb3ZpbmcgaGFuZGxlclxuICAgICAtIHNjb250ZXh0IChvYmplY3QpICNvcHRpb25hbCBjb250ZXh0IGZvciBkcmFnIHN0YXJ0IGhhbmRsZXJcbiAgICAgLSBlY29udGV4dCAob2JqZWN0KSAjb3B0aW9uYWwgY29udGV4dCBmb3IgZHJhZyBlbmQgaGFuZGxlclxuICAgICAqIEFkZGl0aW9uYWx5IGZvbGxvd2luZyBgZHJhZ2AgZXZlbnRzIGFyZSB0cmlnZ2VyZWQ6IGBkcmFnLnN0YXJ0LjxpZD5gIG9uIHN0YXJ0LCBcbiAgICAgKiBgZHJhZy5lbmQuPGlkPmAgb24gZW5kIGFuZCBgZHJhZy5tb3ZlLjxpZD5gIG9uIGV2ZXJ5IG1vdmUuIFdoZW4gZWxlbWVudCBpcyBkcmFnZ2VkIG92ZXIgYW5vdGhlciBlbGVtZW50IFxuICAgICAqIGBkcmFnLm92ZXIuPGlkPmAgZmlyZXMgYXMgd2VsbC5cbiAgICAgKlxuICAgICAqIFN0YXJ0IGV2ZW50IGFuZCBzdGFydCBoYW5kbGVyIGFyZSBjYWxsZWQgaW4gc3BlY2lmaWVkIGNvbnRleHQgb3IgaW4gY29udGV4dCBvZiB0aGUgZWxlbWVudCB3aXRoIGZvbGxvd2luZyBwYXJhbWV0ZXJzOlxuICAgICBvIHggKG51bWJlcikgeCBwb3NpdGlvbiBvZiB0aGUgbW91c2VcbiAgICAgbyB5IChudW1iZXIpIHkgcG9zaXRpb24gb2YgdGhlIG1vdXNlXG4gICAgIG8gZXZlbnQgKG9iamVjdCkgRE9NIGV2ZW50IG9iamVjdFxuICAgICAqIE1vdmUgZXZlbnQgYW5kIG1vdmUgaGFuZGxlciBhcmUgY2FsbGVkIGluIHNwZWNpZmllZCBjb250ZXh0IG9yIGluIGNvbnRleHQgb2YgdGhlIGVsZW1lbnQgd2l0aCBmb2xsb3dpbmcgcGFyYW1ldGVyczpcbiAgICAgbyBkeCAobnVtYmVyKSBzaGlmdCBieSB4IGZyb20gdGhlIHN0YXJ0IHBvaW50XG4gICAgIG8gZHkgKG51bWJlcikgc2hpZnQgYnkgeSBmcm9tIHRoZSBzdGFydCBwb2ludFxuICAgICBvIHggKG51bWJlcikgeCBwb3NpdGlvbiBvZiB0aGUgbW91c2VcbiAgICAgbyB5IChudW1iZXIpIHkgcG9zaXRpb24gb2YgdGhlIG1vdXNlXG4gICAgIG8gZXZlbnQgKG9iamVjdCkgRE9NIGV2ZW50IG9iamVjdFxuICAgICAqIEVuZCBldmVudCBhbmQgZW5kIGhhbmRsZXIgYXJlIGNhbGxlZCBpbiBzcGVjaWZpZWQgY29udGV4dCBvciBpbiBjb250ZXh0IG9mIHRoZSBlbGVtZW50IHdpdGggZm9sbG93aW5nIHBhcmFtZXRlcnM6XG4gICAgIG8gZXZlbnQgKG9iamVjdCkgRE9NIGV2ZW50IG9iamVjdFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIGVscHJvdG8uZHJhZyA9IGZ1bmN0aW9uIChvbm1vdmUsIG9uc3RhcnQsIG9uZW5kLCBtb3ZlX3Njb3BlLCBzdGFydF9zY29wZSwgZW5kX3Njb3BlKSB7XG4gICAgICAgIHZhciBlbCA9IHRoaXM7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgdmFyIG9yaWdUcmFuc2Zvcm07XG4gICAgICAgICAgICByZXR1cm4gZWwuZHJhZyhmdW5jdGlvbiAoZHgsIGR5KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hdHRyKHtcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtOiBvcmlnVHJhbnNmb3JtICsgKG9yaWdUcmFuc2Zvcm0gPyBcIlRcIiA6IFwidFwiKSArIFtkeCwgZHldXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgb3JpZ1RyYW5zZm9ybSA9IHRoaXMudHJhbnNmb3JtKCkubG9jYWw7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBzdGFydChlLCB4LCB5KSB7XG4gICAgICAgICAgICAoZS5vcmlnaW5hbEV2ZW50IHx8IGUpLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBlbC5fZHJhZy54ID0geDtcbiAgICAgICAgICAgIGVsLl9kcmFnLnkgPSB5O1xuICAgICAgICAgICAgZWwuX2RyYWcuaWQgPSBlLmlkZW50aWZpZXI7XG4gICAgICAgICAgICAhZHJhZy5sZW5ndGggJiYgU25hcC5tb3VzZW1vdmUoZHJhZ01vdmUpLm1vdXNldXAoZHJhZ1VwKTtcbiAgICAgICAgICAgIGRyYWcucHVzaCh7ZWw6IGVsLCBtb3ZlX3Njb3BlOiBtb3ZlX3Njb3BlLCBzdGFydF9zY29wZTogc3RhcnRfc2NvcGUsIGVuZF9zY29wZTogZW5kX3Njb3BlfSk7XG4gICAgICAgICAgICBvbnN0YXJ0ICYmIGV2ZS5vbihcInNuYXAuZHJhZy5zdGFydC5cIiArIGVsLmlkLCBvbnN0YXJ0KTtcbiAgICAgICAgICAgIG9ubW92ZSAmJiBldmUub24oXCJzbmFwLmRyYWcubW92ZS5cIiArIGVsLmlkLCBvbm1vdmUpO1xuICAgICAgICAgICAgb25lbmQgJiYgZXZlLm9uKFwic25hcC5kcmFnLmVuZC5cIiArIGVsLmlkLCBvbmVuZCk7XG4gICAgICAgICAgICBldmUoXCJzbmFwLmRyYWcuc3RhcnQuXCIgKyBlbC5pZCwgc3RhcnRfc2NvcGUgfHwgbW92ZV9zY29wZSB8fCBlbCwgeCwgeSwgZSk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gaW5pdChlLCB4LCB5KSB7XG4gICAgICAgICAgICBldmUoXCJzbmFwLmRyYWdpbml0LlwiICsgZWwuaWQsIGVsLCBlLCB4LCB5KTtcbiAgICAgICAgfVxuICAgICAgICBldmUub24oXCJzbmFwLmRyYWdpbml0LlwiICsgZWwuaWQsIHN0YXJ0KTtcbiAgICAgICAgZWwuX2RyYWcgPSB7fTtcbiAgICAgICAgZHJhZ2dhYmxlLnB1c2goe2VsOiBlbCwgc3RhcnQ6IHN0YXJ0LCBpbml0OiBpbml0fSk7XG4gICAgICAgIGVsLm1vdXNlZG93bihpbml0KTtcbiAgICAgICAgcmV0dXJuIGVsO1xuICAgIH07XG4gICAgLypcbiAgICAgKiBFbGVtZW50Lm9uRHJhZ092ZXJcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFNob3J0Y3V0IHRvIGFzc2lnbiBldmVudCBoYW5kbGVyIGZvciBgZHJhZy5vdmVyLjxpZD5gIGV2ZW50LCB3aGVyZSBgaWRgIGlzIHRoZSBlbGVtZW50J3MgYGlkYCAoc2VlIEBFbGVtZW50LmlkKVxuICAgICAtIGYgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciBldmVudCwgZmlyc3QgYXJndW1lbnQgd291bGQgYmUgdGhlIGVsZW1lbnQgeW91IGFyZSBkcmFnZ2luZyBvdmVyXG4gICAgXFwqL1xuICAgIC8vIGVscHJvdG8ub25EcmFnT3ZlciA9IGZ1bmN0aW9uIChmKSB7XG4gICAgLy8gICAgIGYgPyBldmUub24oXCJzbmFwLmRyYWcub3Zlci5cIiArIHRoaXMuaWQsIGYpIDogZXZlLnVuYmluZChcInNuYXAuZHJhZy5vdmVyLlwiICsgdGhpcy5pZCk7XG4gICAgLy8gfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC51bmRyYWdcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgYWxsIGRyYWcgZXZlbnQgaGFuZGxlcnMgZnJvbSB0aGUgZ2l2ZW4gZWxlbWVudFxuICAgIFxcKi9cbiAgICBlbHByb3RvLnVuZHJhZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGkgPSBkcmFnZ2FibGUubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaS0tKSBpZiAoZHJhZ2dhYmxlW2ldLmVsID09IHRoaXMpIHtcbiAgICAgICAgICAgIHRoaXMudW5tb3VzZWRvd24oZHJhZ2dhYmxlW2ldLmluaXQpO1xuICAgICAgICAgICAgZHJhZ2dhYmxlLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIGV2ZS51bmJpbmQoXCJzbmFwLmRyYWcuKi5cIiArIHRoaXMuaWQpO1xuICAgICAgICAgICAgZXZlLnVuYmluZChcInNuYXAuZHJhZ2luaXQuXCIgKyB0aGlzLmlkKTtcbiAgICAgICAgfVxuICAgICAgICAhZHJhZ2dhYmxlLmxlbmd0aCAmJiBTbmFwLnVubW91c2Vtb3ZlKGRyYWdNb3ZlKS51bm1vdXNldXAoZHJhZ1VwKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbn0pO1xuXG4vLyBDb3B5cmlnaHQgKGMpIDIwMTMgQWRvYmUgU3lzdGVtcyBJbmNvcnBvcmF0ZWQuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBcbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vIFxuLy8gaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vLyBcbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5TbmFwLnBsdWdpbihmdW5jdGlvbiAoU25hcCwgRWxlbWVudCwgUGFwZXIsIGdsb2IpIHtcbiAgICB2YXIgZWxwcm90byA9IEVsZW1lbnQucHJvdG90eXBlLFxuICAgICAgICBwcHJvdG8gPSBQYXBlci5wcm90b3R5cGUsXG4gICAgICAgIHJndXJsID0gL15cXHMqdXJsXFwoKC4rKVxcKS8sXG4gICAgICAgIFN0ciA9IFN0cmluZyxcbiAgICAgICAgJCA9IFNuYXAuXy4kO1xuICAgIFNuYXAuZmlsdGVyID0ge307XG4gICAgLypcXFxuICAgICAqIFBhcGVyLmZpbHRlclxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQ3JlYXRlcyBhIGA8ZmlsdGVyPmAgZWxlbWVudFxuICAgICAqKlxuICAgICAtIGZpbHN0ciAoc3RyaW5nKSBTVkcgZnJhZ21lbnQgb2YgZmlsdGVyIHByb3ZpZGVkIGFzIGEgc3RyaW5nXG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICAgKiBOb3RlOiBJdCBpcyByZWNvbW1lbmRlZCB0byB1c2UgZmlsdGVycyBlbWJlZGRlZCBpbnRvIHRoZSBwYWdlIGluc2lkZSBhbiBlbXB0eSBTVkcgZWxlbWVudC5cbiAgICAgPiBVc2FnZVxuICAgICB8IHZhciBmID0gcGFwZXIuZmlsdGVyKCc8ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPVwiMlwiLz4nKSxcbiAgICAgfCAgICAgYyA9IHBhcGVyLmNpcmNsZSgxMCwgMTAsIDEwKS5hdHRyKHtcbiAgICAgfCAgICAgICAgIGZpbHRlcjogZlxuICAgICB8ICAgICB9KTtcbiAgICBcXCovXG4gICAgcHByb3RvLmZpbHRlciA9IGZ1bmN0aW9uIChmaWxzdHIpIHtcbiAgICAgICAgdmFyIHBhcGVyID0gdGhpcztcbiAgICAgICAgaWYgKHBhcGVyLnR5cGUgIT0gXCJzdmdcIikge1xuICAgICAgICAgICAgcGFwZXIgPSBwYXBlci5wYXBlcjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZiA9IFNuYXAucGFyc2UoU3RyKGZpbHN0cikpLFxuICAgICAgICAgICAgaWQgPSBTbmFwLl8uaWQoKSxcbiAgICAgICAgICAgIHdpZHRoID0gcGFwZXIubm9kZS5vZmZzZXRXaWR0aCxcbiAgICAgICAgICAgIGhlaWdodCA9IHBhcGVyLm5vZGUub2Zmc2V0SGVpZ2h0LFxuICAgICAgICAgICAgZmlsdGVyID0gJChcImZpbHRlclwiKTtcbiAgICAgICAgJChmaWx0ZXIsIHtcbiAgICAgICAgICAgIGlkOiBpZCxcbiAgICAgICAgICAgIGZpbHRlclVuaXRzOiBcInVzZXJTcGFjZU9uVXNlXCJcbiAgICAgICAgfSk7XG4gICAgICAgIGZpbHRlci5hcHBlbmRDaGlsZChmLm5vZGUpO1xuICAgICAgICBwYXBlci5kZWZzLmFwcGVuZENoaWxkKGZpbHRlcik7XG4gICAgICAgIHJldHVybiBuZXcgRWxlbWVudChmaWx0ZXIpO1xuICAgIH07XG4gICAgXG4gICAgZXZlLm9uKFwic25hcC51dGlsLmdldGF0dHIuZmlsdGVyXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZXZlLnN0b3AoKTtcbiAgICAgICAgdmFyIHAgPSAkKHRoaXMubm9kZSwgXCJmaWx0ZXJcIik7XG4gICAgICAgIGlmIChwKSB7XG4gICAgICAgICAgICB2YXIgbWF0Y2ggPSBTdHIocCkubWF0Y2gocmd1cmwpO1xuICAgICAgICAgICAgcmV0dXJuIG1hdGNoICYmIFNuYXAuc2VsZWN0KG1hdGNoWzFdKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIGV2ZS5vbihcInNuYXAudXRpbC5hdHRyLmZpbHRlclwiLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRWxlbWVudCAmJiB2YWx1ZS50eXBlID09IFwiZmlsdGVyXCIpIHtcbiAgICAgICAgICAgIGV2ZS5zdG9wKCk7XG4gICAgICAgICAgICB2YXIgaWQgPSB2YWx1ZS5ub2RlLmlkO1xuICAgICAgICAgICAgaWYgKCFpZCkge1xuICAgICAgICAgICAgICAgICQodmFsdWUubm9kZSwge2lkOiB2YWx1ZS5pZH0pO1xuICAgICAgICAgICAgICAgIGlkID0gdmFsdWUuaWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAkKHRoaXMubm9kZSwge1xuICAgICAgICAgICAgICAgIGZpbHRlcjogU25hcC51cmwoaWQpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXZhbHVlIHx8IHZhbHVlID09IFwibm9uZVwiKSB7XG4gICAgICAgICAgICBldmUuc3RvcCgpO1xuICAgICAgICAgICAgdGhpcy5ub2RlLnJlbW92ZUF0dHJpYnV0ZShcImZpbHRlclwiKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIC8qXFxcbiAgICAgKiBTbmFwLmZpbHRlci5ibHVyXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIGFuIFNWRyBtYXJrdXAgc3RyaW5nIGZvciB0aGUgYmx1ciBmaWx0ZXJcbiAgICAgKipcbiAgICAgLSB4IChudW1iZXIpIGFtb3VudCBvZiBob3Jpem9udGFsIGJsdXIsIGluIHBpeGVsc1xuICAgICAtIHkgKG51bWJlcikgI29wdGlvbmFsIGFtb3VudCBvZiB2ZXJ0aWNhbCBibHVyLCBpbiBwaXhlbHNcbiAgICAgPSAoc3RyaW5nKSBmaWx0ZXIgcmVwcmVzZW50YXRpb25cbiAgICAgPiBVc2FnZVxuICAgICB8IHZhciBmID0gcGFwZXIuZmlsdGVyKFNuYXAuZmlsdGVyLmJsdXIoNSwgMTApKSxcbiAgICAgfCAgICAgYyA9IHBhcGVyLmNpcmNsZSgxMCwgMTAsIDEwKS5hdHRyKHtcbiAgICAgfCAgICAgICAgIGZpbHRlcjogZlxuICAgICB8ICAgICB9KTtcbiAgICBcXCovXG4gICAgU25hcC5maWx0ZXIuYmx1ciA9IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgIGlmICh4ID09IG51bGwpIHtcbiAgICAgICAgICAgIHggPSAyO1xuICAgICAgICB9XG4gICAgICAgIHZhciBkZWYgPSB5ID09IG51bGwgPyB4IDogW3gsIHldO1xuICAgICAgICByZXR1cm4gU25hcC5mb3JtYXQoJ1xcPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj1cIntkZWZ9XCIvPicsIHtcbiAgICAgICAgICAgIGRlZjogZGVmXG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgU25hcC5maWx0ZXIuYmx1ci50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMoKTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBTbmFwLmZpbHRlci5zaGFkb3dcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybnMgYW4gU1ZHIG1hcmt1cCBzdHJpbmcgZm9yIHRoZSBzaGFkb3cgZmlsdGVyXG4gICAgICoqXG4gICAgIC0gZHggKG51bWJlcikgI29wdGlvbmFsIGhvcml6b250YWwgc2hpZnQgb2YgdGhlIHNoYWRvdywgaW4gcGl4ZWxzXG4gICAgIC0gZHkgKG51bWJlcikgI29wdGlvbmFsIHZlcnRpY2FsIHNoaWZ0IG9mIHRoZSBzaGFkb3csIGluIHBpeGVsc1xuICAgICAtIGJsdXIgKG51bWJlcikgI29wdGlvbmFsIGFtb3VudCBvZiBibHVyXG4gICAgIC0gY29sb3IgKHN0cmluZykgI29wdGlvbmFsIGNvbG9yIG9mIHRoZSBzaGFkb3dcbiAgICAgLSBvcGFjaXR5IChudW1iZXIpICNvcHRpb25hbCBgMC4uMWAgb3BhY2l0eSBvZiB0aGUgc2hhZG93XG4gICAgICogb3JcbiAgICAgLSBkeCAobnVtYmVyKSAjb3B0aW9uYWwgaG9yaXpvbnRhbCBzaGlmdCBvZiB0aGUgc2hhZG93LCBpbiBwaXhlbHNcbiAgICAgLSBkeSAobnVtYmVyKSAjb3B0aW9uYWwgdmVydGljYWwgc2hpZnQgb2YgdGhlIHNoYWRvdywgaW4gcGl4ZWxzXG4gICAgIC0gY29sb3IgKHN0cmluZykgI29wdGlvbmFsIGNvbG9yIG9mIHRoZSBzaGFkb3dcbiAgICAgLSBvcGFjaXR5IChudW1iZXIpICNvcHRpb25hbCBgMC4uMWAgb3BhY2l0eSBvZiB0aGUgc2hhZG93XG4gICAgICogd2hpY2ggbWFrZXMgYmx1ciBkZWZhdWx0IHRvIGA0YC4gT3JcbiAgICAgLSBkeCAobnVtYmVyKSAjb3B0aW9uYWwgaG9yaXpvbnRhbCBzaGlmdCBvZiB0aGUgc2hhZG93LCBpbiBwaXhlbHNcbiAgICAgLSBkeSAobnVtYmVyKSAjb3B0aW9uYWwgdmVydGljYWwgc2hpZnQgb2YgdGhlIHNoYWRvdywgaW4gcGl4ZWxzXG4gICAgIC0gb3BhY2l0eSAobnVtYmVyKSAjb3B0aW9uYWwgYDAuLjFgIG9wYWNpdHkgb2YgdGhlIHNoYWRvd1xuICAgICA9IChzdHJpbmcpIGZpbHRlciByZXByZXNlbnRhdGlvblxuICAgICA+IFVzYWdlXG4gICAgIHwgdmFyIGYgPSBwYXBlci5maWx0ZXIoU25hcC5maWx0ZXIuc2hhZG93KDAsIDIsIDMpKSxcbiAgICAgfCAgICAgYyA9IHBhcGVyLmNpcmNsZSgxMCwgMTAsIDEwKS5hdHRyKHtcbiAgICAgfCAgICAgICAgIGZpbHRlcjogZlxuICAgICB8ICAgICB9KTtcbiAgICBcXCovXG4gICAgU25hcC5maWx0ZXIuc2hhZG93ID0gZnVuY3Rpb24gKGR4LCBkeSwgYmx1ciwgY29sb3IsIG9wYWNpdHkpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBibHVyID09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIGNvbG9yID0gYmx1cjtcbiAgICAgICAgICAgIG9wYWNpdHkgPSBjb2xvcjtcbiAgICAgICAgICAgIGJsdXIgPSA0O1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgY29sb3IgIT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgb3BhY2l0eSA9IGNvbG9yO1xuICAgICAgICAgICAgY29sb3IgPSBcIiMwMDBcIjtcbiAgICAgICAgfVxuICAgICAgICBjb2xvciA9IGNvbG9yIHx8IFwiIzAwMFwiO1xuICAgICAgICBpZiAoYmx1ciA9PSBudWxsKSB7XG4gICAgICAgICAgICBibHVyID0gNDtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3BhY2l0eSA9PSBudWxsKSB7XG4gICAgICAgICAgICBvcGFjaXR5ID0gMTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZHggPT0gbnVsbCkge1xuICAgICAgICAgICAgZHggPSAwO1xuICAgICAgICAgICAgZHkgPSAyO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkeSA9PSBudWxsKSB7XG4gICAgICAgICAgICBkeSA9IGR4O1xuICAgICAgICB9XG4gICAgICAgIGNvbG9yID0gU25hcC5jb2xvcihjb2xvcik7XG4gICAgICAgIHJldHVybiBTbmFwLmZvcm1hdCgnPGZlR2F1c3NpYW5CbHVyIGluPVwiU291cmNlQWxwaGFcIiBzdGREZXZpYXRpb249XCJ7Ymx1cn1cIi8+PGZlT2Zmc2V0IGR4PVwie2R4fVwiIGR5PVwie2R5fVwiIHJlc3VsdD1cIm9mZnNldGJsdXJcIi8+PGZlRmxvb2QgZmxvb2QtY29sb3I9XCJ7Y29sb3J9XCIvPjxmZUNvbXBvc2l0ZSBpbjI9XCJvZmZzZXRibHVyXCIgb3BlcmF0b3I9XCJpblwiLz48ZmVDb21wb25lbnRUcmFuc2Zlcj48ZmVGdW5jQSB0eXBlPVwibGluZWFyXCIgc2xvcGU9XCJ7b3BhY2l0eX1cIi8+PC9mZUNvbXBvbmVudFRyYW5zZmVyPjxmZU1lcmdlPjxmZU1lcmdlTm9kZS8+PGZlTWVyZ2VOb2RlIGluPVwiU291cmNlR3JhcGhpY1wiLz48L2ZlTWVyZ2U+Jywge1xuICAgICAgICAgICAgY29sb3I6IGNvbG9yLFxuICAgICAgICAgICAgZHg6IGR4LFxuICAgICAgICAgICAgZHk6IGR5LFxuICAgICAgICAgICAgYmx1cjogYmx1cixcbiAgICAgICAgICAgIG9wYWNpdHk6IG9wYWNpdHlcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBTbmFwLmZpbHRlci5zaGFkb3cudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzKCk7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogU25hcC5maWx0ZXIuZ3JheXNjYWxlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIGFuIFNWRyBtYXJrdXAgc3RyaW5nIGZvciB0aGUgZ3JheXNjYWxlIGZpbHRlclxuICAgICAqKlxuICAgICAtIGFtb3VudCAobnVtYmVyKSBhbW91bnQgb2YgZmlsdGVyIChgMC4uMWApXG4gICAgID0gKHN0cmluZykgZmlsdGVyIHJlcHJlc2VudGF0aW9uXG4gICAgXFwqL1xuICAgIFNuYXAuZmlsdGVyLmdyYXlzY2FsZSA9IGZ1bmN0aW9uIChhbW91bnQpIHtcbiAgICAgICAgaWYgKGFtb3VudCA9PSBudWxsKSB7XG4gICAgICAgICAgICBhbW91bnQgPSAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBTbmFwLmZvcm1hdCgnPGZlQ29sb3JNYXRyaXggdHlwZT1cIm1hdHJpeFwiIHZhbHVlcz1cInthfSB7Yn0ge2N9IDAgMCB7ZH0ge2V9IHtmfSAwIDAge2d9IHtifSB7aH0gMCAwIDAgMCAwIDEgMFwiLz4nLCB7XG4gICAgICAgICAgICBhOiAwLjIxMjYgKyAwLjc4NzQgKiAoMSAtIGFtb3VudCksXG4gICAgICAgICAgICBiOiAwLjcxNTIgLSAwLjcxNTIgKiAoMSAtIGFtb3VudCksXG4gICAgICAgICAgICBjOiAwLjA3MjIgLSAwLjA3MjIgKiAoMSAtIGFtb3VudCksXG4gICAgICAgICAgICBkOiAwLjIxMjYgLSAwLjIxMjYgKiAoMSAtIGFtb3VudCksXG4gICAgICAgICAgICBlOiAwLjcxNTIgKyAwLjI4NDggKiAoMSAtIGFtb3VudCksXG4gICAgICAgICAgICBmOiAwLjA3MjIgLSAwLjA3MjIgKiAoMSAtIGFtb3VudCksXG4gICAgICAgICAgICBnOiAwLjIxMjYgLSAwLjIxMjYgKiAoMSAtIGFtb3VudCksXG4gICAgICAgICAgICBoOiAwLjA3MjIgKyAwLjkyNzggKiAoMSAtIGFtb3VudClcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBTbmFwLmZpbHRlci5ncmF5c2NhbGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzKCk7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogU25hcC5maWx0ZXIuc2VwaWFcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybnMgYW4gU1ZHIG1hcmt1cCBzdHJpbmcgZm9yIHRoZSBzZXBpYSBmaWx0ZXJcbiAgICAgKipcbiAgICAgLSBhbW91bnQgKG51bWJlcikgYW1vdW50IG9mIGZpbHRlciAoYDAuLjFgKVxuICAgICA9IChzdHJpbmcpIGZpbHRlciByZXByZXNlbnRhdGlvblxuICAgIFxcKi9cbiAgICBTbmFwLmZpbHRlci5zZXBpYSA9IGZ1bmN0aW9uIChhbW91bnQpIHtcbiAgICAgICAgaWYgKGFtb3VudCA9PSBudWxsKSB7XG4gICAgICAgICAgICBhbW91bnQgPSAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBTbmFwLmZvcm1hdCgnPGZlQ29sb3JNYXRyaXggdHlwZT1cIm1hdHJpeFwiIHZhbHVlcz1cInthfSB7Yn0ge2N9IDAgMCB7ZH0ge2V9IHtmfSAwIDAge2d9IHtofSB7aX0gMCAwIDAgMCAwIDEgMFwiLz4nLCB7XG4gICAgICAgICAgICBhOiAwLjM5MyArIDAuNjA3ICogKDEgLSBhbW91bnQpLFxuICAgICAgICAgICAgYjogMC43NjkgLSAwLjc2OSAqICgxIC0gYW1vdW50KSxcbiAgICAgICAgICAgIGM6IDAuMTg5IC0gMC4xODkgKiAoMSAtIGFtb3VudCksXG4gICAgICAgICAgICBkOiAwLjM0OSAtIDAuMzQ5ICogKDEgLSBhbW91bnQpLFxuICAgICAgICAgICAgZTogMC42ODYgKyAwLjMxNCAqICgxIC0gYW1vdW50KSxcbiAgICAgICAgICAgIGY6IDAuMTY4IC0gMC4xNjggKiAoMSAtIGFtb3VudCksXG4gICAgICAgICAgICBnOiAwLjI3MiAtIDAuMjcyICogKDEgLSBhbW91bnQpLFxuICAgICAgICAgICAgaDogMC41MzQgLSAwLjUzNCAqICgxIC0gYW1vdW50KSxcbiAgICAgICAgICAgIGk6IDAuMTMxICsgMC44NjkgKiAoMSAtIGFtb3VudClcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBTbmFwLmZpbHRlci5zZXBpYS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMoKTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBTbmFwLmZpbHRlci5zYXR1cmF0ZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJucyBhbiBTVkcgbWFya3VwIHN0cmluZyBmb3IgdGhlIHNhdHVyYXRlIGZpbHRlclxuICAgICAqKlxuICAgICAtIGFtb3VudCAobnVtYmVyKSBhbW91bnQgb2YgZmlsdGVyIChgMC4uMWApXG4gICAgID0gKHN0cmluZykgZmlsdGVyIHJlcHJlc2VudGF0aW9uXG4gICAgXFwqL1xuICAgIFNuYXAuZmlsdGVyLnNhdHVyYXRlID0gZnVuY3Rpb24gKGFtb3VudCkge1xuICAgICAgICBpZiAoYW1vdW50ID09IG51bGwpIHtcbiAgICAgICAgICAgIGFtb3VudCA9IDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFNuYXAuZm9ybWF0KCc8ZmVDb2xvck1hdHJpeCB0eXBlPVwic2F0dXJhdGVcIiB2YWx1ZXM9XCJ7YW1vdW50fVwiLz4nLCB7XG4gICAgICAgICAgICBhbW91bnQ6IDEgLSBhbW91bnRcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBTbmFwLmZpbHRlci5zYXR1cmF0ZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMoKTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBTbmFwLmZpbHRlci5odWVSb3RhdGVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybnMgYW4gU1ZHIG1hcmt1cCBzdHJpbmcgZm9yIHRoZSBodWUtcm90YXRlIGZpbHRlclxuICAgICAqKlxuICAgICAtIGFuZ2xlIChudW1iZXIpIGFuZ2xlIG9mIHJvdGF0aW9uXG4gICAgID0gKHN0cmluZykgZmlsdGVyIHJlcHJlc2VudGF0aW9uXG4gICAgXFwqL1xuICAgIFNuYXAuZmlsdGVyLmh1ZVJvdGF0ZSA9IGZ1bmN0aW9uIChhbmdsZSkge1xuICAgICAgICBhbmdsZSA9IGFuZ2xlIHx8IDA7XG4gICAgICAgIHJldHVybiBTbmFwLmZvcm1hdCgnPGZlQ29sb3JNYXRyaXggdHlwZT1cImh1ZVJvdGF0ZVwiIHZhbHVlcz1cInthbmdsZX1cIi8+Jywge1xuICAgICAgICAgICAgYW5nbGU6IGFuZ2xlXG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgU25hcC5maWx0ZXIuaHVlUm90YXRlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcygpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFNuYXAuZmlsdGVyLmludmVydFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJucyBhbiBTVkcgbWFya3VwIHN0cmluZyBmb3IgdGhlIGludmVydCBmaWx0ZXJcbiAgICAgKipcbiAgICAgLSBhbW91bnQgKG51bWJlcikgYW1vdW50IG9mIGZpbHRlciAoYDAuLjFgKVxuICAgICA9IChzdHJpbmcpIGZpbHRlciByZXByZXNlbnRhdGlvblxuICAgIFxcKi9cbiAgICBTbmFwLmZpbHRlci5pbnZlcnQgPSBmdW5jdGlvbiAoYW1vdW50KSB7XG4gICAgICAgIGlmIChhbW91bnQgPT0gbnVsbCkge1xuICAgICAgICAgICAgYW1vdW50ID0gMTtcbiAgICAgICAgfVxuLy8gICAgICAgIDxmZUNvbG9yTWF0cml4IHR5cGU9XCJtYXRyaXhcIiB2YWx1ZXM9XCItMSAwIDAgMCAxICAwIC0xIDAgMCAxICAwIDAgLTEgMCAxICAwIDAgMCAxIDBcIiBjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnM9XCJzUkdCXCIvPlxuICAgICAgICByZXR1cm4gU25hcC5mb3JtYXQoJzxmZUNvbXBvbmVudFRyYW5zZmVyPjxmZUZ1bmNSIHR5cGU9XCJ0YWJsZVwiIHRhYmxlVmFsdWVzPVwie2Ftb3VudH0ge2Ftb3VudDJ9XCIvPjxmZUZ1bmNHIHR5cGU9XCJ0YWJsZVwiIHRhYmxlVmFsdWVzPVwie2Ftb3VudH0ge2Ftb3VudDJ9XCIvPjxmZUZ1bmNCIHR5cGU9XCJ0YWJsZVwiIHRhYmxlVmFsdWVzPVwie2Ftb3VudH0ge2Ftb3VudDJ9XCIvPjwvZmVDb21wb25lbnRUcmFuc2Zlcj4nLCB7XG4gICAgICAgICAgICBhbW91bnQ6IGFtb3VudCxcbiAgICAgICAgICAgIGFtb3VudDI6IDEgLSBhbW91bnRcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBTbmFwLmZpbHRlci5pbnZlcnQudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzKCk7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogU25hcC5maWx0ZXIuYnJpZ2h0bmVzc1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJucyBhbiBTVkcgbWFya3VwIHN0cmluZyBmb3IgdGhlIGJyaWdodG5lc3MgZmlsdGVyXG4gICAgICoqXG4gICAgIC0gYW1vdW50IChudW1iZXIpIGFtb3VudCBvZiBmaWx0ZXIgKGAwLi4xYClcbiAgICAgPSAoc3RyaW5nKSBmaWx0ZXIgcmVwcmVzZW50YXRpb25cbiAgICBcXCovXG4gICAgU25hcC5maWx0ZXIuYnJpZ2h0bmVzcyA9IGZ1bmN0aW9uIChhbW91bnQpIHtcbiAgICAgICAgaWYgKGFtb3VudCA9PSBudWxsKSB7XG4gICAgICAgICAgICBhbW91bnQgPSAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBTbmFwLmZvcm1hdCgnPGZlQ29tcG9uZW50VHJhbnNmZXI+PGZlRnVuY1IgdHlwZT1cImxpbmVhclwiIHNsb3BlPVwie2Ftb3VudH1cIi8+PGZlRnVuY0cgdHlwZT1cImxpbmVhclwiIHNsb3BlPVwie2Ftb3VudH1cIi8+PGZlRnVuY0IgdHlwZT1cImxpbmVhclwiIHNsb3BlPVwie2Ftb3VudH1cIi8+PC9mZUNvbXBvbmVudFRyYW5zZmVyPicsIHtcbiAgICAgICAgICAgIGFtb3VudDogYW1vdW50XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgU25hcC5maWx0ZXIuYnJpZ2h0bmVzcy50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMoKTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBTbmFwLmZpbHRlci5jb250cmFzdFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJucyBhbiBTVkcgbWFya3VwIHN0cmluZyBmb3IgdGhlIGNvbnRyYXN0IGZpbHRlclxuICAgICAqKlxuICAgICAtIGFtb3VudCAobnVtYmVyKSBhbW91bnQgb2YgZmlsdGVyIChgMC4uMWApXG4gICAgID0gKHN0cmluZykgZmlsdGVyIHJlcHJlc2VudGF0aW9uXG4gICAgXFwqL1xuICAgIFNuYXAuZmlsdGVyLmNvbnRyYXN0ID0gZnVuY3Rpb24gKGFtb3VudCkge1xuICAgICAgICBpZiAoYW1vdW50ID09IG51bGwpIHtcbiAgICAgICAgICAgIGFtb3VudCA9IDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFNuYXAuZm9ybWF0KCc8ZmVDb21wb25lbnRUcmFuc2Zlcj48ZmVGdW5jUiB0eXBlPVwibGluZWFyXCIgc2xvcGU9XCJ7YW1vdW50fVwiIGludGVyY2VwdD1cInthbW91bnQyfVwiLz48ZmVGdW5jRyB0eXBlPVwibGluZWFyXCIgc2xvcGU9XCJ7YW1vdW50fVwiIGludGVyY2VwdD1cInthbW91bnQyfVwiLz48ZmVGdW5jQiB0eXBlPVwibGluZWFyXCIgc2xvcGU9XCJ7YW1vdW50fVwiIGludGVyY2VwdD1cInthbW91bnQyfVwiLz48L2ZlQ29tcG9uZW50VHJhbnNmZXI+Jywge1xuICAgICAgICAgICAgYW1vdW50OiBhbW91bnQsXG4gICAgICAgICAgICBhbW91bnQyOiAuNSAtIGFtb3VudCAvIDJcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBTbmFwLmZpbHRlci5jb250cmFzdC50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMoKTtcbiAgICB9O1xufSk7XG5cbi8vIENvcHlyaWdodCAoYykgMjAxNCBBZG9iZSBTeXN0ZW1zIEluY29ycG9yYXRlZC4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cblNuYXAucGx1Z2luKGZ1bmN0aW9uIChTbmFwLCBFbGVtZW50LCBQYXBlciwgZ2xvYiwgRnJhZ21lbnQpIHtcbiAgICB2YXIgYm94ID0gU25hcC5fLmJveCxcbiAgICAgICAgaXMgPSBTbmFwLmlzLFxuICAgICAgICBmaXJzdExldHRlciA9IC9eW15hLXpdKihbdGJtbHJjXSkvaSxcbiAgICAgICAgdG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJUXCIgKyB0aGlzLmR4ICsgXCIsXCIgKyB0aGlzLmR5O1xuICAgICAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LmdldEFsaWduXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIHNoaWZ0IG5lZWRlZCB0byBhbGlnbiB0aGUgZWxlbWVudCByZWxhdGl2ZWx5IHRvIGdpdmVuIGVsZW1lbnQuXG4gICAgICogSWYgbm8gZWxlbWVudHMgc3BlY2lmaWVkLCBwYXJlbnQgYDxzdmc+YCBjb250YWluZXIgd2lsbCBiZSB1c2VkLlxuICAgICAtIGVsIChvYmplY3QpIEBvcHRpb25hbCBhbGlnbm1lbnQgZWxlbWVudFxuICAgICAtIHdheSAoc3RyaW5nKSBvbmUgb2Ygc2l4IHZhbHVlczogYFwidG9wXCJgLCBgXCJtaWRkbGVcImAsIGBcImJvdHRvbVwiYCwgYFwibGVmdFwiYCwgYFwiY2VudGVyXCJgLCBgXCJyaWdodFwiYFxuICAgICA9IChvYmplY3R8c3RyaW5nKSBPYmplY3QgaW4gZm9ybWF0IGB7ZHg6ICwgZHk6IH1gIGFsc28gaGFzIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIGFzIGEgdHJhbnNmb3JtYXRpb24gc3RyaW5nXG4gICAgID4gVXNhZ2VcbiAgICAgfCBlbC50cmFuc2Zvcm0oZWwuZ2V0QWxpZ24oZWwyLCBcInRvcFwiKSk7XG4gICAgICogb3JcbiAgICAgfCB2YXIgZHkgPSBlbC5nZXRBbGlnbihlbDIsIFwidG9wXCIpLmR5O1xuICAgIFxcKi9cbiAgICBFbGVtZW50LnByb3RvdHlwZS5nZXRBbGlnbiA9IGZ1bmN0aW9uIChlbCwgd2F5KSB7XG4gICAgICAgIGlmICh3YXkgPT0gbnVsbCAmJiBpcyhlbCwgXCJzdHJpbmdcIikpIHtcbiAgICAgICAgICAgIHdheSA9IGVsO1xuICAgICAgICAgICAgZWwgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGVsID0gZWwgfHwgdGhpcy5wYXBlcjtcbiAgICAgICAgdmFyIGJ4ID0gZWwuZ2V0QkJveCA/IGVsLmdldEJCb3goKSA6IGJveChlbCksXG4gICAgICAgICAgICBiYiA9IHRoaXMuZ2V0QkJveCgpLFxuICAgICAgICAgICAgb3V0ID0ge307XG4gICAgICAgIHdheSA9IHdheSAmJiB3YXkubWF0Y2goZmlyc3RMZXR0ZXIpO1xuICAgICAgICB3YXkgPSB3YXkgPyB3YXlbMV0udG9Mb3dlckNhc2UoKSA6IFwiY1wiO1xuICAgICAgICBzd2l0Y2ggKHdheSkge1xuICAgICAgICAgICAgY2FzZSBcInRcIjpcbiAgICAgICAgICAgICAgICBvdXQuZHggPSAwO1xuICAgICAgICAgICAgICAgIG91dC5keSA9IGJ4LnkgLSBiYi55O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiYlwiOlxuICAgICAgICAgICAgICAgIG91dC5keCA9IDA7XG4gICAgICAgICAgICAgICAgb3V0LmR5ID0gYngueTIgLSBiYi55MjtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIm1cIjpcbiAgICAgICAgICAgICAgICBvdXQuZHggPSAwO1xuICAgICAgICAgICAgICAgIG91dC5keSA9IGJ4LmN5IC0gYmIuY3k7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJsXCI6XG4gICAgICAgICAgICAgICAgb3V0LmR4ID0gYngueCAtIGJiLng7XG4gICAgICAgICAgICAgICAgb3V0LmR5ID0gMDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInJcIjpcbiAgICAgICAgICAgICAgICBvdXQuZHggPSBieC54MiAtIGJiLngyO1xuICAgICAgICAgICAgICAgIG91dC5keSA9IDA7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgb3V0LmR4ID0gYnguY3ggLSBiYi5jeDtcbiAgICAgICAgICAgICAgICBvdXQuZHkgPSAwO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgb3V0LnRvU3RyaW5nID0gdG9TdHJpbmc7XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5hbGlnblxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQWxpZ25zIHRoZSBlbGVtZW50IHJlbGF0aXZlbHkgdG8gZ2l2ZW4gb25lIHZpYSB0cmFuc2Zvcm1hdGlvbi5cbiAgICAgKiBJZiBubyBlbGVtZW50cyBzcGVjaWZpZWQsIHBhcmVudCBgPHN2Zz5gIGNvbnRhaW5lciB3aWxsIGJlIHVzZWQuXG4gICAgIC0gZWwgKG9iamVjdCkgQG9wdGlvbmFsIGFsaWdubWVudCBlbGVtZW50XG4gICAgIC0gd2F5IChzdHJpbmcpIG9uZSBvZiBzaXggdmFsdWVzOiBgXCJ0b3BcImAsIGBcIm1pZGRsZVwiYCwgYFwiYm90dG9tXCJgLCBgXCJsZWZ0XCJgLCBgXCJjZW50ZXJcImAsIGBcInJpZ2h0XCJgXG4gICAgID0gKG9iamVjdCkgdGhpcyBlbGVtZW50XG4gICAgID4gVXNhZ2VcbiAgICAgfCBlbC5hbGlnbihlbDIsIFwidG9wXCIpO1xuICAgICAqIG9yXG4gICAgIHwgZWwuYWxpZ24oXCJtaWRkbGVcIik7XG4gICAgXFwqL1xuICAgIEVsZW1lbnQucHJvdG90eXBlLmFsaWduID0gZnVuY3Rpb24gKGVsLCB3YXkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudHJhbnNmb3JtKFwiLi4uXCIgKyB0aGlzLmdldEFsaWduKGVsLCB3YXkpKTtcbiAgICB9O1xufSk7XG5cbnJldHVybiBTbmFwO1xufSkpO1xuIl19
