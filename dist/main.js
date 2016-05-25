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
function BuildingUnitStatus() {
	return {
		status : BuildingUnitStatus.STATUS_BUILDING,
		dist : null
	}
}
BuildingUnitStatus.STATUS_BUILDING = 1;
BuildingUnitStatus.STATUS_NORMAL = 2;

function BaseBuildingUnit() {
}

BaseBuildingUnit.prototype.draw = function(status) {
	//表示
}

},{}],11:[function(require,module,exports){
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

BaseMobileUnit.prototype.getInfo = function() {
	return "<div>"+this.context.gathering_amount+"</div>"
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
		if(this.context.gathering_amount >= 10) {
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
	if(unit.info.type == "nature") {
		this.make_route( unit.position() );
		this.context.status = MobileUnitContext.STATUS.MOVING_TO_RESOURCE;
		this.context.target = unit;
		return true;
	}else if(unit.info.type == "building") {
		this.make_route( unit.position() );
		this.context.status = MobileUnitContext.STATUS.MOVING_TO_BUILDING;
		this.context.target = unit;
		return true;
	}else{
		return false;
	}
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
},{"../algorithm/astar":9,"../util/log":30,"./BaseUnit":13,"./math2d":17,"util":4}],12:[function(require,module,exports){
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

BaseNatureUnit.prototype.getInfo = function() {
	return "<div>" + this.amount + "</div>"
}


module.exports = BaseNatureUnit;

},{"./BaseUnit":13,"util":4}],13:[function(require,module,exports){
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
},{"./math2d":17,"eventemitter2":6,"util":4,"uuid":8}],14:[function(require,module,exports){
var EventEmitter = require('eventemitter2').EventEmitter2;
var util = require('util');
var UnitGraphic = require('../graphic/unitGraphic');
var BaseMobileUnit = require('./BaseMobileUnit');
var BaseNatureUnit = require('./BaseNatureUnit');
var BaseBuildingUnit = require('./BaseBuildingUnit');

function UnitManager(snap) {
	EventEmitter.call(this);
	this.metaUnits = {};
	this.units = {};
	this.snap = snap;
	this.group = snap.g();
	this.selected = null;
	this.cursors = [];
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

UnitManager.prototype.create = function(metaUnitId, player) {
	var that = this;
	var metaUnit = this.metaUnits[metaUnitId];
	var ug = new UnitGraphic(this.snap, this.group, {
		path : 'images/' + metaUnit.graphic.path,
		width : metaUnit.graphic.width,
		height : metaUnit.graphic.height,
	});
	if(metaUnit.unitinfo.type == 'nature') {
		var person = new BaseNatureUnit(ug, metaUnit.unitinfo, this.map, player);
	//}else if(metaUnit.unitinfo.type == 'building') {
	//	var person = new BaseBuildingUnit(ug, metaUnit.unitinfo, this.map, player);
	}else{
		var person = new BaseMobileUnit(ug, metaUnit.unitinfo, this.map, player);
	}
	person.on('click', function(e) {
		that.clickHandler(e, function() {
			that.select([person]);
			that.emit('click', {unit : person, event : e});
		}, function() {
			that.emit('target', {unit : person, event : e});
		});
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

UnitManager.prototype.select = function(target) {
	var that = this;
	this.selected = target;
	this.cursors.forEach(function(c) {
		c.remove();
	});
	if(this.selected) {
		this.cursors = this.selected.map(function(u) {
			var pos = u.position();
			var c = that.snap.circle(40, 40, 50);
			c.attr({
				fill: "none",
				stroke: "#1010f0",
				strokeWidth: 3
			});
			u.graphic.group.append(c);
			return c;
		});
	}
}

UnitManager.prototype.setClickHandler = function(clickHandler) {
	this.clickHandler = clickHandler;
}


module.exports = UnitManager;
},{"../graphic/unitGraphic":19,"./BaseBuildingUnit":10,"./BaseMobileUnit":11,"./BaseNatureUnit":12,"eventemitter2":6,"util":4}],15:[function(require,module,exports){
var Snap = require('../../thirdparty/snap.svg');
var UnitManager = require('./UnitManager');
var unitInfo = require('../unit');
var ControlPanel = require('../ui/controlPanel');
var Menu = require('../ui/menu');
var Preloader = require('../ui/preloader');
var Map = require('./map');
var Player = require('./player');
var Platform = require('../platform');

function Game(requestAnimationFrame) {
	this.start(requestAnimationFrame);
}

Game.prototype.start = function(requestAnimationFrame) {
	var platform = Platform();
	var mainDom = document.getElementById('main');
	var controlPanel = new ControlPanel(mainDom);
	var menu = new Menu(mainDom);
	var preloader = new Preloader(mainDom);
	preloader.show();
	var svgWrapper = document.createElement('div');
	var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	var width = window.innerWidth;
	var height = window.innerHeight;
    svg.setAttributeNS(null, 'width', width);
    svg.setAttributeNS(null, 'height', height);
    svg.setAttributeNS(null, 'viewBox', '0 0 '+width+' '+height);
    svgWrapper.appendChild(svg);
	mainDom.appendChild(svgWrapper);

	var snap = Snap(svg);
	var map = new Map(snap);
	var unitManager = new UnitManager(snap);
	unitManager.load(unitInfo);
	//map.generate(0);

	map.setUnitManager(unitManager);
	var player1 = new Player({type: Player.TYPE_HUMAN});
	var player2 = new Player({type: Player.TYPE_ENEMY});
	var player_gaia = new Player({type: Player.TYPE_GAIA});


	player1.on('update', function() {
		menu.update('tree', player1.resource('tree'));
	});
	unitManager.create('town', player1).position(250, 150);
	unitManager.create('villager', player1).position(100, 50);
	unitManager.create('villager', player1).position(100, 100);
	unitManager.create('villager', player1).position(50, 150);
	unitManager.create('villager', player1).position(200, 200);
	unitManager.create('villager', player2).position(200, 250);
	unitManager.create('tree', player_gaia).position(100, 150);
	unitManager.create('tree', player_gaia).position(600, 150);
	unitManager.create('tree', player_gaia).position(600, 200);
	unitManager.create('tree', player_gaia).position(600, 250);
	unitManager.create('tree', player_gaia).position(450, 200);
	unitManager.create('tree', player_gaia).position(400, 300);
	unitManager.create('tree', player_gaia).position(400, 250);
	unitManager.create('tree', player_gaia).position(150, 50);

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
		if(selected.length > 0)
			controlPanel.setTarget(selected[0]);
	});
	platform.setupMap(map);
	platform.setupUnitManager(unitManager);

	function gameLoop() {
		unitManager.main();
	}
	var recursiveAnim = function() {
		gameLoop();
		requestAnimationFrame(recursiveAnim)
	}
	requestAnimationFrame(recursiveAnim)

	var graph = map.getCollGraph();
	/*
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
	*/
}

module.exports = Game;
},{"../../thirdparty/snap.svg":31,"../platform":21,"../ui/controlPanel":25,"../ui/menu":26,"../ui/preloader":27,"../unit":29,"./UnitManager":14,"./map":16,"./player":18}],16:[function(require,module,exports){
var Snap = require('../../thirdparty/snap.svg');
var EventEmitter = require('eventemitter2').EventEmitter2;
var util = require('util');
var RectangleSelector = require('../ui/rectangleSelector');
var Math2D = require('./math2d');

//click:タッチ
//click:選択状態でのタッチ
//target:右クリック

function Map(snap) {
	var that = this;
	EventEmitter.call(this);
	this.width = 80;
	this.height = 80;
	var width = 2000;
	var height = 2000;
	this.pos = new Math2D.Point2D(0, 0);
	RectangleSelector.snap = snap;
	this.snap = snap;
	this.group = this.snap.g();
	this.coll = snap.rect(0, 0, width, height);
	this.group.append(this.coll);
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
			return RectangleSelector.isContain(that.global2screen(unit.position()));
		});
		that.unitManager.select(units);
		that.emit('selected', units);
	});
	this.clickHandler = function(e) {

	}
	this.coll.mousedown(function(e) {
		var pos = that.screen2global(e.pageX, e.pageY);
		that.clickHandler(e, function() {
			that.emit('click', {
				pos: pos
			});
			that.unitManager.select([]);
		}, function() {
			that.emit('target', {
				pos: pos
			});
			that.unitManager.select([]);
		});
	});
    window.addEventListener("contextmenu", function(e){
        e.preventDefault();
    }, false);
}

util.inherits(Map, EventEmitter);

Map.prototype.setUnitManager = function(unitManager) {
	var that = this;
	this.unitManager = unitManager;
	this.unitManager.setMap(this);
	this.group.append(this.unitManager.group);
	this.unitManager.on('click', function(e) {
		that.emit('selected', [e.unit]);
	});

}

Map.prototype.setClickHandler = function(clickHandler) {
	this.clickHandler = clickHandler;
}


Map.prototype.screen2global = function(x, y) {
	return (new Math2D.Point2D(x, y)).sub(this.pos)
}
Map.prototype.global2screen = function(pos) {
	return pos.add(this.pos)
}

Map.prototype.move = function(x, y) {
	this.pos = this.pos.add(new Math2D.Point2D(x, y));
	this.applyDisplay();
	console.log(this.pos);
}

Map.prototype.applyDisplay = function() {
	var myMatrix = new Snap.Matrix();
	myMatrix.translate(this.pos.x, this.pos.y);
	this.group.transform(myMatrix);
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
},{"../../thirdparty/snap.svg":31,"../ui/rectangleSelector":28,"./math2d":17,"eventemitter2":6,"util":4}],17:[function(require,module,exports){

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
},{}],18:[function(require,module,exports){
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
},{"eventemitter2":6,"util":4,"uuid":8}],19:[function(require,module,exports){
var Snap = require('../../thirdparty/snap.svg');

function UnitGraphic(snap, group, options, onLoad) {
	var that = this;
	this.group = snap.g();
	this.bound = {x:0,y:0};
	this._rotate = 0;
	this.options = options;
	group.append(this.group);
	Snap.load(options.path, function (f) {
		console.log(options.path + ' loaded svg.', f);
	    g = f.select("g");
	    that.group.append(g);
	    if(onLoad) onLoad();
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
},{"../../thirdparty/snap.svg":31}],20:[function(require,module,exports){
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
},{"../thirdparty/snap.svg":31,"./core":15,"./unit":29}],21:[function(require,module,exports){
var pc = require('./pc');
var sp = require('./sp');
var UserAgent = require('../platform/ua');

module.exports = function() {
	var ua = UserAgent();
	if(ua.mobile[0] || ua.tablet) {
		return sp();
	}else{
		return pc();
	}
}
},{"../platform/ua":24,"./pc":22,"./sp":23}],22:[function(require,module,exports){
module.exports = function() {
	return {
		setupMap: function(map) {
			window.addEventListener('keydown', function(e) {
				switch(e.keyCode) {
					case 68://d
						map.move(-10, 0);
						break;
					case 65://a
						map.move(10, 0);
						break;
					case 87://w
						map.move(0, 10);
						break;
					case 83://s
						map.move(0, -10);
						break;
				}
			});
			map.setClickHandler(function(e, click, target) {
				if(e.button == 0) {
					click();
				}else if(e.button == 2) {
					target();
				}
			});
		},
		setupUnitManager: function(unitManager) {
			unitManager.setClickHandler(function(e, click, target) {
				if(e.button == 0) {
					click();
				}else if(e.button == 2) {
					target();
				}
			});
		}
	}
}
},{}],23:[function(require,module,exports){
module.exports = function() {
	return {
		setupMap: function(map) {
			map.setClickHandler(function(e, click, target) {
				if(map.unitManager.selected && map.unitManager.selected.length > 0) {
					target();
				}else{
					click();
				}
			});
		},
		setupUnitManager: function(unitManager) {
			unitManager.setClickHandler(function(e, click, target) {
				if(unitManager.selected && unitManager.selected.length > 0) {
					target();
				}else{
					click();
				}
			});
		}
	}
}
},{}],24:[function(require,module,exports){
module.exports = function(_ua) {
	var u = _ua || window.navigator.userAgent.toLowerCase();
	var mobile = {
	        0: (u.indexOf("windows") != -1 && u.indexOf("phone") != -1)
	        || u.indexOf("iphone") != -1
	        || u.indexOf("ipod") != -1
	        || (u.indexOf("android") != -1 && u.indexOf("mobile") != -1)
	        || (u.indexOf("firefox") != -1 && u.indexOf("mobile") != -1)
	        || u.indexOf("blackberry") != -1,
	        iPhone: (u.indexOf("iphone") != -1),
	        Android: (u.indexOf("android") != -1 && u.indexOf("mobile") != -1)
	};
	var tablet = (u.indexOf("windows") != -1 && u.indexOf("touch") != -1)
	        || u.indexOf("ipad") != -1
	        || (u.indexOf("android") != -1 && u.indexOf("mobile") == -1)
	        || (u.indexOf("firefox") != -1 && u.indexOf("tablet") != -1)
	        || u.indexOf("kindle") != -1
	        || u.indexOf("silk") != -1
	        || u.indexOf("playbook") != -1;
	var pc = !mobile[0] && !tablet;
	return {
		mobile: mobile,
		tablet: tablet,
		pc: pc
	};
}

},{}],25:[function(require,module,exports){
function ControlPanel(baseDom) {
	var that = this;
	var wrapper = document.createElement('div');
	wrapper.classList.add('control-panel-wrapper');
	baseDom.appendChild(wrapper);

	var mapDom = document.createElement('div');
	var infoDom = document.createElement('div');
	var palletDom = document.createElement('div');

	mapDom.classList.add('map-panel-wrapper');
	infoDom.classList.add('info-panel-wrapper');
	palletDom.classList.add('pallet-panel-wrapper');
	wrapper.appendChild(mapDom);
	wrapper.appendChild(infoDom);
	wrapper.appendChild(palletDom);

	this.infoElem = infoDom;
	this.target = null;
	setInterval(function() {
		if(that.target) that.infoElem.innerHTML = that.target.getInfo();
	}, 2000);
}

ControlPanel.prototype.setTarget = function(target) {
	this.target = target;
	this.infoElem.innerHTML = target.getInfo();
}

module.exports = ControlPanel;
},{}],26:[function(require,module,exports){
function Menu(baseDom) {
	var that = this;
	var wrapper = document.createElement('div');
	wrapper.classList.add('menu-panel-wrapper');
	baseDom.appendChild(wrapper);

	this.treeDom = document.createElement('div');
	wrapper.appendChild(this.treeDom);

}

Menu.prototype.update = function(name, value) {
	this.treeDom.textContent = value;
};


module.exports = Menu;
},{}],27:[function(require,module,exports){
function PreLoader(baseDom) {
	var that = this;
	var wrapper = document.createElement('div');
	wrapper.classList.add('loading-animation');
	var ballsDom = document.createElement('div');
	ballsDom.classList.add('balls');
	wrapper.appendChild(ballsDom);
	baseDom.appendChild(wrapper);

	this.wrapper = wrapper;
}

PreLoader.prototype.show = function() {
	this.wrapper.style["display"] = "block";
}

PreLoader.prototype.hide = function() {
	this.wrapper.style["display"] = "none";
}

module.exports = PreLoader;
},{}],28:[function(require,module,exports){
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
},{}],29:[function(require,module,exports){
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
},{}],30:[function(require,module,exports){
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
},{}],31:[function(require,module,exports){
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

},{"eve":5}]},{},[20])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvaW5oZXJpdHMvaW5oZXJpdHNfYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvdXRpbC9zdXBwb3J0L2lzQnVmZmVyQnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy91dGlsL3V0aWwuanMiLCJub2RlX21vZHVsZXMvZXZlL2V2ZS5qcyIsIm5vZGVfbW9kdWxlcy9ldmVudGVtaXR0ZXIyL2xpYi9ldmVudGVtaXR0ZXIyLmpzIiwibm9kZV9tb2R1bGVzL3V1aWQvcm5nLWJyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvdXVpZC91dWlkLmpzIiwic3JjL2FsZ29yaXRobS9hc3Rhci5qcyIsInNyYy9jb3JlL0Jhc2VCdWlsZGluZ1VuaXQuanMiLCJzcmMvY29yZS9CYXNlTW9iaWxlVW5pdC5qcyIsInNyYy9jb3JlL0Jhc2VOYXR1cmVVbml0LmpzIiwic3JjL2NvcmUvQmFzZVVuaXQuanMiLCJzcmMvY29yZS9Vbml0TWFuYWdlci5qcyIsInNyYy9jb3JlL2luZGV4LmpzIiwic3JjL2NvcmUvbWFwLmpzIiwic3JjL2NvcmUvbWF0aDJkLmpzIiwic3JjL2NvcmUvcGxheWVyLmpzIiwic3JjL2dyYXBoaWMvdW5pdEdyYXBoaWMuanMiLCJzcmMvbWFpbi5qcyIsInNyYy9wbGF0Zm9ybS9pbmRleC5qcyIsInNyYy9wbGF0Zm9ybS9wYy5qcyIsInNyYy9wbGF0Zm9ybS9zcC5qcyIsInNyYy9wbGF0Zm9ybS91YS5qcyIsInNyYy91aS9jb250cm9sUGFuZWwuanMiLCJzcmMvdWkvbWVudS5qcyIsInNyYy91aS9wcmVsb2FkZXIuanMiLCJzcmMvdWkvcmVjdGFuZ2xlU2VsZWN0b3IuanMiLCJzcmMvdW5pdC5qcyIsInNyYy91dGlsL2xvZy5qcyIsInRoaXJkcGFydHkvc25hcC5zdmcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzFrQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMWFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUM3akJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDblpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDelFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeGJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiaWYgKHR5cGVvZiBPYmplY3QuY3JlYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gIC8vIGltcGxlbWVudGF0aW9uIGZyb20gc3RhbmRhcmQgbm9kZS5qcyAndXRpbCcgbW9kdWxlXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgICAgY29uc3RydWN0b3I6IHtcbiAgICAgICAgdmFsdWU6IGN0b3IsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG4gIH07XG59IGVsc2Uge1xuICAvLyBvbGQgc2Nob29sIHNoaW0gZm9yIG9sZCBicm93c2Vyc1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgdmFyIFRlbXBDdG9yID0gZnVuY3Rpb24gKCkge31cbiAgICBUZW1wQ3Rvci5wcm90b3R5cGUgPSBzdXBlckN0b3IucHJvdG90eXBlXG4gICAgY3Rvci5wcm90b3R5cGUgPSBuZXcgVGVtcEN0b3IoKVxuICAgIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvclxuICB9XG59XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgaWYgKCFkcmFpbmluZyB8fCAhY3VycmVudFF1ZXVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gc2V0VGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgc2V0VGltZW91dChkcmFpblF1ZXVlLCAwKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNCdWZmZXIoYXJnKSB7XG4gIHJldHVybiBhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCdcbiAgICAmJiB0eXBlb2YgYXJnLmNvcHkgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmZpbGwgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLnJlYWRVSW50OCA9PT0gJ2Z1bmN0aW9uJztcbn0iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKCFpc1N0cmluZyhmKSkge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChpbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzpcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIHJldHVybiAnW0NpcmN1bGFyXSc7XG4gICAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvciAodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKSB7XG4gICAgaWYgKGlzTnVsbCh4KSB8fCAhaXNPYmplY3QoeCkpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG5cblxuLy8gTWFyayB0aGF0IGEgbWV0aG9kIHNob3VsZCBub3QgYmUgdXNlZC5cbi8vIFJldHVybnMgYSBtb2RpZmllZCBmdW5jdGlvbiB3aGljaCB3YXJucyBvbmNlIGJ5IGRlZmF1bHQuXG4vLyBJZiAtLW5vLWRlcHJlY2F0aW9uIGlzIHNldCwgdGhlbiBpdCBpcyBhIG5vLW9wLlxuZXhwb3J0cy5kZXByZWNhdGUgPSBmdW5jdGlvbihmbiwgbXNnKSB7XG4gIC8vIEFsbG93IGZvciBkZXByZWNhdGluZyB0aGluZ3MgaW4gdGhlIHByb2Nlc3Mgb2Ygc3RhcnRpbmcgdXAuXG4gIGlmIChpc1VuZGVmaW5lZChnbG9iYWwucHJvY2VzcykpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZXhwb3J0cy5kZXByZWNhdGUoZm4sIG1zZykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHByb2Nlc3Mubm9EZXByZWNhdGlvbiA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIHZhciB3YXJuZWQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gZGVwcmVjYXRlZCgpIHtcbiAgICBpZiAoIXdhcm5lZCkge1xuICAgICAgaWYgKHByb2Nlc3MudGhyb3dEZXByZWNhdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy50cmFjZURlcHJlY2F0aW9uKSB7XG4gICAgICAgIGNvbnNvbGUudHJhY2UobXNnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICAgIH1cbiAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgcmV0dXJuIGRlcHJlY2F0ZWQ7XG59O1xuXG5cbnZhciBkZWJ1Z3MgPSB7fTtcbnZhciBkZWJ1Z0Vudmlyb247XG5leHBvcnRzLmRlYnVnbG9nID0gZnVuY3Rpb24oc2V0KSB7XG4gIGlmIChpc1VuZGVmaW5lZChkZWJ1Z0Vudmlyb24pKVxuICAgIGRlYnVnRW52aXJvbiA9IHByb2Nlc3MuZW52Lk5PREVfREVCVUcgfHwgJyc7XG4gIHNldCA9IHNldC50b1VwcGVyQ2FzZSgpO1xuICBpZiAoIWRlYnVnc1tzZXRdKSB7XG4gICAgaWYgKG5ldyBSZWdFeHAoJ1xcXFxiJyArIHNldCArICdcXFxcYicsICdpJykudGVzdChkZWJ1Z0Vudmlyb24pKSB7XG4gICAgICB2YXIgcGlkID0gcHJvY2Vzcy5waWQ7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXNnID0gZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignJXMgJWQ6ICVzJywgc2V0LCBwaWQsIG1zZyk7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge307XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWJ1Z3Nbc2V0XTtcbn07XG5cblxuLyoqXG4gKiBFY2hvcyB0aGUgdmFsdWUgb2YgYSB2YWx1ZS4gVHJ5cyB0byBwcmludCB0aGUgdmFsdWUgb3V0XG4gKiBpbiB0aGUgYmVzdCB3YXkgcG9zc2libGUgZ2l2ZW4gdGhlIGRpZmZlcmVudCB0eXBlcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcHJpbnQgb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QgdGhhdCBhbHRlcnMgdGhlIG91dHB1dC5cbiAqL1xuLyogbGVnYWN5OiBvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMqL1xuZnVuY3Rpb24gaW5zcGVjdChvYmosIG9wdHMpIHtcbiAgLy8gZGVmYXVsdCBvcHRpb25zXG4gIHZhciBjdHggPSB7XG4gICAgc2VlbjogW10sXG4gICAgc3R5bGl6ZTogc3R5bGl6ZU5vQ29sb3JcbiAgfTtcbiAgLy8gbGVnYWN5Li4uXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIGN0eC5kZXB0aCA9IGFyZ3VtZW50c1syXTtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gNCkgY3R4LmNvbG9ycyA9IGFyZ3VtZW50c1szXTtcbiAgaWYgKGlzQm9vbGVhbihvcHRzKSkge1xuICAgIC8vIGxlZ2FjeS4uLlxuICAgIGN0eC5zaG93SGlkZGVuID0gb3B0cztcbiAgfSBlbHNlIGlmIChvcHRzKSB7XG4gICAgLy8gZ290IGFuIFwib3B0aW9uc1wiIG9iamVjdFxuICAgIGV4cG9ydHMuX2V4dGVuZChjdHgsIG9wdHMpO1xuICB9XG4gIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5zaG93SGlkZGVuKSkgY3R4LnNob3dIaWRkZW4gPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5kZXB0aCkpIGN0eC5kZXB0aCA9IDI7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY29sb3JzKSkgY3R4LmNvbG9ycyA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmN1c3RvbUluc3BlY3QpKSBjdHguY3VzdG9tSW5zcGVjdCA9IHRydWU7XG4gIGlmIChjdHguY29sb3JzKSBjdHguc3R5bGl6ZSA9IHN0eWxpemVXaXRoQ29sb3I7XG4gIHJldHVybiBmb3JtYXRWYWx1ZShjdHgsIG9iaiwgY3R4LmRlcHRoKTtcbn1cbmV4cG9ydHMuaW5zcGVjdCA9IGluc3BlY3Q7XG5cblxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG5pbnNwZWN0LmNvbG9ycyA9IHtcbiAgJ2JvbGQnIDogWzEsIDIyXSxcbiAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICdibGFjaycgOiBbMzAsIDM5XSxcbiAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICdjeWFuJyA6IFszNiwgMzldLFxuICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAncmVkJyA6IFszMSwgMzldLFxuICAneWVsbG93JyA6IFszMywgMzldXG59O1xuXG4vLyBEb24ndCB1c2UgJ2JsdWUnIG5vdCB2aXNpYmxlIG9uIGNtZC5leGVcbmluc3BlY3Quc3R5bGVzID0ge1xuICAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgJ251bWJlcic6ICd5ZWxsb3cnLFxuICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAnbnVsbCc6ICdib2xkJyxcbiAgJ3N0cmluZyc6ICdncmVlbicsXG4gICdkYXRlJzogJ21hZ2VudGEnLFxuICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAncmVnZXhwJzogJ3JlZCdcbn07XG5cblxuZnVuY3Rpb24gc3R5bGl6ZVdpdGhDb2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICB2YXIgc3R5bGUgPSBpbnNwZWN0LnN0eWxlc1tzdHlsZVR5cGVdO1xuXG4gIGlmIChzdHlsZSkge1xuICAgIHJldHVybiAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVsxXSArICdtJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cblxuZnVuY3Rpb24gc3R5bGl6ZU5vQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgcmV0dXJuIHN0cjtcbn1cblxuXG5mdW5jdGlvbiBhcnJheVRvSGFzaChhcnJheSkge1xuICB2YXIgaGFzaCA9IHt9O1xuXG4gIGFycmF5LmZvckVhY2goZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBleHBvcnRzLmluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcywgY3R4KTtcbiAgICBpZiAoIWlzU3RyaW5nKHJldCkpIHtcbiAgICAgIHJldCA9IGZvcm1hdFZhbHVlKGN0eCwgcmV0LCByZWN1cnNlVGltZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgdmFyIHByaW1pdGl2ZSA9IGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKTtcbiAgaWYgKHByaW1pdGl2ZSkge1xuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4pIHtcbiAgICBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModmFsdWUpO1xuICB9XG5cbiAgLy8gSUUgZG9lc24ndCBtYWtlIGVycm9yIGZpZWxkcyBub24tZW51bWVyYWJsZVxuICAvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaWUvZHd3NTJzYnQodj12cy45NCkuYXNweFxuICBpZiAoaXNFcnJvcih2YWx1ZSlcbiAgICAgICYmIChrZXlzLmluZGV4T2YoJ21lc3NhZ2UnKSA+PSAwIHx8IGtleXMuaW5kZXhPZignZGVzY3JpcHRpb24nKSA+PSAwKSkge1xuICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkodmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cbiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodmFsdWUsIGtleSkgfHwgeyB2YWx1ZTogdmFsdWVba2V5XSB9O1xuICBpZiAoZGVzYy5nZXQpIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmICghaGFzT3duUHJvcGVydHkodmlzaWJsZUtleXMsIGtleSkpIHtcbiAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICB9XG4gIGlmICghc3RyKSB7XG4gICAgaWYgKGN0eC5zZWVuLmluZGV4T2YoZGVzYy52YWx1ZSkgPCAwKSB7XG4gICAgICBpZiAoaXNOdWxsKHJlY3Vyc2VUaW1lcykpIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgaWYgKGFycmF5KSB7XG4gICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSAnXFxuJyArIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNVbmRlZmluZWQobmFtZSkpIHtcbiAgICBpZiAoYXJyYXkgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG59XG5cblxuZnVuY3Rpb24gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpIHtcbiAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgdmFyIGxlbmd0aCA9IG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cblxuLy8gTk9URTogVGhlc2UgdHlwZSBjaGVja2luZyBmdW5jdGlvbnMgaW50ZW50aW9uYWxseSBkb24ndCB1c2UgYGluc3RhbmNlb2ZgXG4vLyBiZWNhdXNlIGl0IGlzIGZyYWdpbGUgYW5kIGNhbiBiZSBlYXNpbHkgZmFrZWQgd2l0aCBgT2JqZWN0LmNyZWF0ZSgpYC5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXIpO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuZXhwb3J0cy5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsID0gaXNOdWxsO1xuXG5mdW5jdGlvbiBpc051bGxPclVuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGxPclVuZGVmaW5lZCA9IGlzTnVsbE9yVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5pc051bWJlciA9IGlzTnVtYmVyO1xuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuZXhwb3J0cy5pc1N0cmluZyA9IGlzU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1N5bWJvbChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnO1xufVxuZXhwb3J0cy5pc1N5bWJvbCA9IGlzU3ltYm9sO1xuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuZXhwb3J0cy5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5leHBvcnRzLmlzUmVnRXhwID0gaXNSZWdFeHA7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cbmV4cG9ydHMuaXNEYXRlID0gaXNEYXRlO1xuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmXG4gICAgICAob2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXScgfHwgZSBpbnN0YW5jZW9mIEVycm9yKTtcbn1cbmV4cG9ydHMuaXNFcnJvciA9IGlzRXJyb3I7XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcblxuZnVuY3Rpb24gaXNQcmltaXRpdmUoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGwgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ251bWJlcicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3ltYm9sJyB8fCAgLy8gRVM2IHN5bWJvbFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3VuZGVmaW5lZCc7XG59XG5leHBvcnRzLmlzUHJpbWl0aXZlID0gaXNQcmltaXRpdmU7XG5cbmV4cG9ydHMuaXNCdWZmZXIgPSByZXF1aXJlKCcuL3N1cHBvcnQvaXNCdWZmZXInKTtcblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cblxuLy8gbG9nIGlzIGp1c3QgYSB0aGluIHdyYXBwZXIgdG8gY29uc29sZS5sb2cgdGhhdCBwcmVwZW5kcyBhIHRpbWVzdGFtcFxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJyVzIC0gJXMnLCB0aW1lc3RhbXAoKSwgZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKSk7XG59O1xuXG5cbi8qKlxuICogSW5oZXJpdCB0aGUgcHJvdG90eXBlIG1ldGhvZHMgZnJvbSBvbmUgY29uc3RydWN0b3IgaW50byBhbm90aGVyLlxuICpcbiAqIFRoZSBGdW5jdGlvbi5wcm90b3R5cGUuaW5oZXJpdHMgZnJvbSBsYW5nLmpzIHJld3JpdHRlbiBhcyBhIHN0YW5kYWxvbmVcbiAqIGZ1bmN0aW9uIChub3Qgb24gRnVuY3Rpb24ucHJvdG90eXBlKS4gTk9URTogSWYgdGhpcyBmaWxlIGlzIHRvIGJlIGxvYWRlZFxuICogZHVyaW5nIGJvb3RzdHJhcHBpbmcgdGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSByZXdyaXR0ZW4gdXNpbmcgc29tZSBuYXRpdmVcbiAqIGZ1bmN0aW9ucyBhcyBwcm90b3R5cGUgc2V0dXAgdXNpbmcgbm9ybWFsIEphdmFTY3JpcHQgZG9lcyBub3Qgd29yayBhc1xuICogZXhwZWN0ZWQgZHVyaW5nIGJvb3RzdHJhcHBpbmcgKHNlZSBtaXJyb3IuanMgaW4gcjExNDkwMykuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB3aGljaCBuZWVkcyB0byBpbmhlcml0IHRoZVxuICogICAgIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBpbmhlcml0IHByb3RvdHlwZSBmcm9tLlxuICovXG5leHBvcnRzLmluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcblxuZXhwb3J0cy5fZXh0ZW5kID0gZnVuY3Rpb24ob3JpZ2luLCBhZGQpIHtcbiAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWRkIGlzbid0IGFuIG9iamVjdFxuICBpZiAoIWFkZCB8fCAhaXNPYmplY3QoYWRkKSkgcmV0dXJuIG9yaWdpbjtcblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn07XG5cbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG4iLCIvLyBDb3B5cmlnaHQgKGMpIDIwMTMgQWRvYmUgU3lzdGVtcyBJbmNvcnBvcmF0ZWQuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBcbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vIFxuLy8gaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vLyBcbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vLyDilIzilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilJAgXFxcXFxuLy8g4pSCIEV2ZSAwLjUuMCAtIEphdmFTY3JpcHQgRXZlbnRzIExpYnJhcnkgICAgICAgICAgICAgICAgICAgICAg4pSCIFxcXFxcbi8vIOKUnOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUpCBcXFxcXG4vLyDilIIgQXV0aG9yIERtaXRyeSBCYXJhbm92c2tpeSAoaHR0cDovL2RtaXRyeS5iYXJhbm92c2tpeS5jb20vKSDilIIgXFxcXFxuLy8g4pSU4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSYIFxcXFxcblxuKGZ1bmN0aW9uIChnbG9iKSB7XG4gICAgdmFyIHZlcnNpb24gPSBcIjAuNS4wXCIsXG4gICAgICAgIGhhcyA9IFwiaGFzT3duUHJvcGVydHlcIixcbiAgICAgICAgc2VwYXJhdG9yID0gL1tcXC5cXC9dLyxcbiAgICAgICAgY29tYXNlcGFyYXRvciA9IC9cXHMqLFxccyovLFxuICAgICAgICB3aWxkY2FyZCA9IFwiKlwiLFxuICAgICAgICBmdW4gPSBmdW5jdGlvbiAoKSB7fSxcbiAgICAgICAgbnVtc29ydCA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gYSAtIGI7XG4gICAgICAgIH0sXG4gICAgICAgIGN1cnJlbnRfZXZlbnQsXG4gICAgICAgIHN0b3AsXG4gICAgICAgIGV2ZW50cyA9IHtuOiB7fX0sXG4gICAgICAgIGZpcnN0RGVmaW5lZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IHRoaXMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpc1tpXSAhPSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzW2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgbGFzdERlZmluZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgaSA9IHRoaXMubGVuZ3RoO1xuICAgICAgICAgICAgd2hpbGUgKC0taSkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpc1tpXSAhPSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzW2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgb2JqdG9zID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyxcbiAgICAgICAgU3RyID0gU3RyaW5nLFxuICAgICAgICBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAoYXIpIHtcbiAgICAgICAgICAgIHJldHVybiBhciBpbnN0YW5jZW9mIEFycmF5IHx8IG9ianRvcy5jYWxsKGFyKSA9PSBcIltvYmplY3QgQXJyYXldXCI7XG4gICAgICAgIH07XG4gICAgLypcXFxuICAgICAqIGV2ZVxuICAgICBbIG1ldGhvZCBdXG5cbiAgICAgKiBGaXJlcyBldmVudCB3aXRoIGdpdmVuIGBuYW1lYCwgZ2l2ZW4gc2NvcGUgYW5kIG90aGVyIHBhcmFtZXRlcnMuXG5cbiAgICAgPiBBcmd1bWVudHNcblxuICAgICAtIG5hbWUgKHN0cmluZykgbmFtZSBvZiB0aGUgKmV2ZW50KiwgZG90IChgLmApIG9yIHNsYXNoIChgL2ApIHNlcGFyYXRlZFxuICAgICAtIHNjb3BlIChvYmplY3QpIGNvbnRleHQgZm9yIHRoZSBldmVudCBoYW5kbGVyc1xuICAgICAtIHZhcmFyZ3MgKC4uLikgdGhlIHJlc3Qgb2YgYXJndW1lbnRzIHdpbGwgYmUgc2VudCB0byBldmVudCBoYW5kbGVyc1xuXG4gICAgID0gKG9iamVjdCkgYXJyYXkgb2YgcmV0dXJuZWQgdmFsdWVzIGZyb20gdGhlIGxpc3RlbmVycy4gQXJyYXkgaGFzIHR3byBtZXRob2RzIGAuZmlyc3REZWZpbmVkKClgIGFuZCBgLmxhc3REZWZpbmVkKClgIHRvIGdldCBmaXJzdCBvciBsYXN0IG5vdCBgdW5kZWZpbmVkYCB2YWx1ZS5cbiAgICBcXCovXG4gICAgICAgIGV2ZSA9IGZ1bmN0aW9uIChuYW1lLCBzY29wZSkge1xuICAgICAgICAgICAgdmFyIGUgPSBldmVudHMsXG4gICAgICAgICAgICAgICAgb2xkc3RvcCA9IHN0b3AsXG4gICAgICAgICAgICAgICAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMiksXG4gICAgICAgICAgICAgICAgbGlzdGVuZXJzID0gZXZlLmxpc3RlbmVycyhuYW1lKSxcbiAgICAgICAgICAgICAgICB6ID0gMCxcbiAgICAgICAgICAgICAgICBmID0gZmFsc2UsXG4gICAgICAgICAgICAgICAgbCxcbiAgICAgICAgICAgICAgICBpbmRleGVkID0gW10sXG4gICAgICAgICAgICAgICAgcXVldWUgPSB7fSxcbiAgICAgICAgICAgICAgICBvdXQgPSBbXSxcbiAgICAgICAgICAgICAgICBjZSA9IGN1cnJlbnRfZXZlbnQsXG4gICAgICAgICAgICAgICAgZXJyb3JzID0gW107XG4gICAgICAgICAgICBvdXQuZmlyc3REZWZpbmVkID0gZmlyc3REZWZpbmVkO1xuICAgICAgICAgICAgb3V0Lmxhc3REZWZpbmVkID0gbGFzdERlZmluZWQ7XG4gICAgICAgICAgICBjdXJyZW50X2V2ZW50ID0gbmFtZTtcbiAgICAgICAgICAgIHN0b3AgPSAwO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gbGlzdGVuZXJzLmxlbmd0aDsgaSA8IGlpOyBpKyspIGlmIChcInpJbmRleFwiIGluIGxpc3RlbmVyc1tpXSkge1xuICAgICAgICAgICAgICAgIGluZGV4ZWQucHVzaChsaXN0ZW5lcnNbaV0uekluZGV4KTtcbiAgICAgICAgICAgICAgICBpZiAobGlzdGVuZXJzW2ldLnpJbmRleCA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcXVldWVbbGlzdGVuZXJzW2ldLnpJbmRleF0gPSBsaXN0ZW5lcnNbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaW5kZXhlZC5zb3J0KG51bXNvcnQpO1xuICAgICAgICAgICAgd2hpbGUgKGluZGV4ZWRbel0gPCAwKSB7XG4gICAgICAgICAgICAgICAgbCA9IHF1ZXVlW2luZGV4ZWRbeisrXV07XG4gICAgICAgICAgICAgICAgb3V0LnB1c2gobC5hcHBseShzY29wZSwgYXJncykpO1xuICAgICAgICAgICAgICAgIGlmIChzdG9wKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0b3AgPSBvbGRzdG9wO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3V0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgbCA9IGxpc3RlbmVyc1tpXTtcbiAgICAgICAgICAgICAgICBpZiAoXCJ6SW5kZXhcIiBpbiBsKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsLnpJbmRleCA9PSBpbmRleGVkW3pdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXQucHVzaChsLmFwcGx5KHNjb3BlLCBhcmdzKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3RvcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHorKztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsID0gcXVldWVbaW5kZXhlZFt6XV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbCAmJiBvdXQucHVzaChsLmFwcGx5KHNjb3BlLCBhcmdzKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0b3ApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSB3aGlsZSAobClcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXVlW2wuekluZGV4XSA9IGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBvdXQucHVzaChsLmFwcGx5KHNjb3BlLCBhcmdzKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdG9wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN0b3AgPSBvbGRzdG9wO1xuICAgICAgICAgICAgY3VycmVudF9ldmVudCA9IGNlO1xuICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gVW5kb2N1bWVudGVkLiBEZWJ1ZyBvbmx5LlxuICAgICAgICBldmUuX2V2ZW50cyA9IGV2ZW50cztcbiAgICAvKlxcXG4gICAgICogZXZlLmxpc3RlbmVyc1xuICAgICBbIG1ldGhvZCBdXG5cbiAgICAgKiBJbnRlcm5hbCBtZXRob2Qgd2hpY2ggZ2l2ZXMgeW91IGFycmF5IG9mIGFsbCBldmVudCBoYW5kbGVycyB0aGF0IHdpbGwgYmUgdHJpZ2dlcmVkIGJ5IHRoZSBnaXZlbiBgbmFtZWAuXG5cbiAgICAgPiBBcmd1bWVudHNcblxuICAgICAtIG5hbWUgKHN0cmluZykgbmFtZSBvZiB0aGUgZXZlbnQsIGRvdCAoYC5gKSBvciBzbGFzaCAoYC9gKSBzZXBhcmF0ZWRcblxuICAgICA9IChhcnJheSkgYXJyYXkgb2YgZXZlbnQgaGFuZGxlcnNcbiAgICBcXCovXG4gICAgZXZlLmxpc3RlbmVycyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIHZhciBuYW1lcyA9IGlzQXJyYXkobmFtZSkgPyBuYW1lIDogbmFtZS5zcGxpdChzZXBhcmF0b3IpLFxuICAgICAgICAgICAgZSA9IGV2ZW50cyxcbiAgICAgICAgICAgIGl0ZW0sXG4gICAgICAgICAgICBpdGVtcyxcbiAgICAgICAgICAgIGssXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgaWksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgamosXG4gICAgICAgICAgICBuZXMsXG4gICAgICAgICAgICBlcyA9IFtlXSxcbiAgICAgICAgICAgIG91dCA9IFtdO1xuICAgICAgICBmb3IgKGkgPSAwLCBpaSA9IG5hbWVzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIG5lcyA9IFtdO1xuICAgICAgICAgICAgZm9yIChqID0gMCwgamogPSBlcy5sZW5ndGg7IGogPCBqajsgaisrKSB7XG4gICAgICAgICAgICAgICAgZSA9IGVzW2pdLm47XG4gICAgICAgICAgICAgICAgaXRlbXMgPSBbZVtuYW1lc1tpXV0sIGVbd2lsZGNhcmRdXTtcbiAgICAgICAgICAgICAgICBrID0gMjtcbiAgICAgICAgICAgICAgICB3aGlsZSAoay0tKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0gPSBpdGVtc1trXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5lcy5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0ID0gb3V0LmNvbmNhdChpdGVtLmYgfHwgW10pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZXMgPSBuZXM7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBldmUuc2VwYXJhdG9yXG4gICAgIFsgbWV0aG9kIF1cblxuICAgICAqIElmIGZvciBzb21lIHJlYXNvbnMgeW91IGRvbuKAmXQgbGlrZSBkZWZhdWx0IHNlcGFyYXRvcnMgKGAuYCBvciBgL2ApIHlvdSBjYW4gc3BlY2lmeSB5b3Vyc1xuICAgICAqIGhlcmUuIEJlIGF3YXJlIHRoYXQgaWYgeW91IHBhc3MgYSBzdHJpbmcgbG9uZ2VyIHRoYW4gb25lIGNoYXJhY3RlciBpdCB3aWxsIGJlIHRyZWF0ZWQgYXNcbiAgICAgKiBhIGxpc3Qgb2YgY2hhcmFjdGVycy5cblxuICAgICAtIHNlcGFyYXRvciAoc3RyaW5nKSBuZXcgc2VwYXJhdG9yLiBFbXB0eSBzdHJpbmcgcmVzZXRzIHRvIGRlZmF1bHQ6IGAuYCBvciBgL2AuXG4gICAgXFwqL1xuICAgIGV2ZS5zZXBhcmF0b3IgPSBmdW5jdGlvbiAoc2VwKSB7XG4gICAgICAgIGlmIChzZXApIHtcbiAgICAgICAgICAgIHNlcCA9IFN0cihzZXApLnJlcGxhY2UoLyg/PVtcXC5cXF5cXF1cXFtcXC1dKS9nLCBcIlxcXFxcIik7XG4gICAgICAgICAgICBzZXAgPSBcIltcIiArIHNlcCArIFwiXVwiO1xuICAgICAgICAgICAgc2VwYXJhdG9yID0gbmV3IFJlZ0V4cChzZXApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VwYXJhdG9yID0gL1tcXC5cXC9dLztcbiAgICAgICAgfVxuICAgIH07XG4gICAgLypcXFxuICAgICAqIGV2ZS5vblxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQmluZHMgZ2l2ZW4gZXZlbnQgaGFuZGxlciB3aXRoIGEgZ2l2ZW4gbmFtZS4gWW91IGNhbiB1c2Ugd2lsZGNhcmRzIOKAnGAqYOKAnSBmb3IgdGhlIG5hbWVzOlxuICAgICB8IGV2ZS5vbihcIioudW5kZXIuKlwiLCBmKTtcbiAgICAgfCBldmUoXCJtb3VzZS51bmRlci5mbG9vclwiKTsgLy8gdHJpZ2dlcnMgZlxuICAgICAqIFVzZSBAZXZlIHRvIHRyaWdnZXIgdGhlIGxpc3RlbmVyLlxuICAgICAqKlxuICAgICAtIG5hbWUgKHN0cmluZykgbmFtZSBvZiB0aGUgZXZlbnQsIGRvdCAoYC5gKSBvciBzbGFzaCAoYC9gKSBzZXBhcmF0ZWQsIHdpdGggb3B0aW9uYWwgd2lsZGNhcmRzXG4gICAgIC0gZiAoZnVuY3Rpb24pIGV2ZW50IGhhbmRsZXIgZnVuY3Rpb25cbiAgICAgKipcbiAgICAgLSBuYW1lIChhcnJheSkgaWYgeW91IGRvbuKAmXQgd2FudCB0byB1c2Ugc2VwYXJhdG9ycywgeW91IGNhbiB1c2UgYXJyYXkgb2Ygc3RyaW5nc1xuICAgICAtIGYgKGZ1bmN0aW9uKSBldmVudCBoYW5kbGVyIGZ1bmN0aW9uXG4gICAgICoqXG4gICAgID0gKGZ1bmN0aW9uKSByZXR1cm5lZCBmdW5jdGlvbiBhY2NlcHRzIGEgc2luZ2xlIG51bWVyaWMgcGFyYW1ldGVyIHRoYXQgcmVwcmVzZW50cyB6LWluZGV4IG9mIHRoZSBoYW5kbGVyLiBJdCBpcyBhbiBvcHRpb25hbCBmZWF0dXJlIGFuZCBvbmx5IHVzZWQgd2hlbiB5b3UgbmVlZCB0byBlbnN1cmUgdGhhdCBzb21lIHN1YnNldCBvZiBoYW5kbGVycyB3aWxsIGJlIGludm9rZWQgaW4gYSBnaXZlbiBvcmRlciwgZGVzcGl0ZSBvZiB0aGUgb3JkZXIgb2YgYXNzaWdubWVudC4gXG4gICAgID4gRXhhbXBsZTpcbiAgICAgfCBldmUub24oXCJtb3VzZVwiLCBlYXRJdCkoMik7XG4gICAgIHwgZXZlLm9uKFwibW91c2VcIiwgc2NyZWFtKTtcbiAgICAgfCBldmUub24oXCJtb3VzZVwiLCBjYXRjaEl0KSgxKTtcbiAgICAgKiBUaGlzIHdpbGwgZW5zdXJlIHRoYXQgYGNhdGNoSXRgIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIGJlZm9yZSBgZWF0SXRgLlxuICAgICAqXG4gICAgICogSWYgeW91IHdhbnQgdG8gcHV0IHlvdXIgaGFuZGxlciBiZWZvcmUgbm9uLWluZGV4ZWQgaGFuZGxlcnMsIHNwZWNpZnkgYSBuZWdhdGl2ZSB2YWx1ZS5cbiAgICAgKiBOb3RlOiBJIGFzc3VtZSBtb3N0IG9mIHRoZSB0aW1lIHlvdSBkb27igJl0IG5lZWQgdG8gd29ycnkgYWJvdXQgei1pbmRleCwgYnV0IGl04oCZcyBuaWNlIHRvIGhhdmUgdGhpcyBmZWF0dXJlIOKAnGp1c3QgaW4gY2FzZeKAnS5cbiAgICBcXCovXG4gICAgZXZlLm9uID0gZnVuY3Rpb24gKG5hbWUsIGYpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBmICE9IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHt9O1xuICAgICAgICB9XG4gICAgICAgIHZhciBuYW1lcyA9IGlzQXJyYXkobmFtZSkgPyAoaXNBcnJheShuYW1lWzBdKSA/IG5hbWUgOiBbbmFtZV0pIDogU3RyKG5hbWUpLnNwbGl0KGNvbWFzZXBhcmF0b3IpO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBuYW1lcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAoZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgbmFtZXMgPSBpc0FycmF5KG5hbWUpID8gbmFtZSA6IFN0cihuYW1lKS5zcGxpdChzZXBhcmF0b3IpLFxuICAgICAgICAgICAgICAgICAgICBlID0gZXZlbnRzLFxuICAgICAgICAgICAgICAgICAgICBleGlzdDtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBuYW1lcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGUgPSBlLm47XG4gICAgICAgICAgICAgICAgICAgIGUgPSBlLmhhc093blByb3BlcnR5KG5hbWVzW2ldKSAmJiBlW25hbWVzW2ldXSB8fCAoZVtuYW1lc1tpXV0gPSB7bjoge319KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZS5mID0gZS5mIHx8IFtdO1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDAsIGlpID0gZS5mLmxlbmd0aDsgaSA8IGlpOyBpKyspIGlmIChlLmZbaV0gPT0gZikge1xuICAgICAgICAgICAgICAgICAgICBleGlzdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAhZXhpc3QgJiYgZS5mLnB1c2goZik7XG4gICAgICAgICAgICB9KG5hbWVzW2ldKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICh6SW5kZXgpIHtcbiAgICAgICAgICAgIGlmICgrekluZGV4ID09ICt6SW5kZXgpIHtcbiAgICAgICAgICAgICAgICBmLnpJbmRleCA9ICt6SW5kZXg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogZXZlLmZcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybnMgZnVuY3Rpb24gdGhhdCB3aWxsIGZpcmUgZ2l2ZW4gZXZlbnQgd2l0aCBvcHRpb25hbCBhcmd1bWVudHMuXG4gICAgICogQXJndW1lbnRzIHRoYXQgd2lsbCBiZSBwYXNzZWQgdG8gdGhlIHJlc3VsdCBmdW5jdGlvbiB3aWxsIGJlIGFsc29cbiAgICAgKiBjb25jYXRlZCB0byB0aGUgbGlzdCBvZiBmaW5hbCBhcmd1bWVudHMuXG4gICAgIHwgZWwub25jbGljayA9IGV2ZS5mKFwiY2xpY2tcIiwgMSwgMik7XG4gICAgIHwgZXZlLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKGEsIGIsIGMpIHtcbiAgICAgfCAgICAgY29uc29sZS5sb2coYSwgYiwgYyk7IC8vIDEsIDIsIFtldmVudCBvYmplY3RdXG4gICAgIHwgfSk7XG4gICAgID4gQXJndW1lbnRzXG4gICAgIC0gZXZlbnQgKHN0cmluZykgZXZlbnQgbmFtZVxuICAgICAtIHZhcmFyZ3MgKOKApikgYW5kIGFueSBvdGhlciBhcmd1bWVudHNcbiAgICAgPSAoZnVuY3Rpb24pIHBvc3NpYmxlIGV2ZW50IGhhbmRsZXIgZnVuY3Rpb25cbiAgICBcXCovXG4gICAgZXZlLmYgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIGF0dHJzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZXZlLmFwcGx5KG51bGwsIFtldmVudCwgbnVsbF0uY29uY2F0KGF0dHJzKS5jb25jYXQoW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDApKSk7XG4gICAgICAgIH07XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogZXZlLnN0b3BcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIElzIHVzZWQgaW5zaWRlIGFuIGV2ZW50IGhhbmRsZXIgdG8gc3RvcCB0aGUgZXZlbnQsIHByZXZlbnRpbmcgYW55IHN1YnNlcXVlbnQgbGlzdGVuZXJzIGZyb20gZmlyaW5nLlxuICAgIFxcKi9cbiAgICBldmUuc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc3RvcCA9IDE7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogZXZlLm50XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBDb3VsZCBiZSB1c2VkIGluc2lkZSBldmVudCBoYW5kbGVyIHRvIGZpZ3VyZSBvdXQgYWN0dWFsIG5hbWUgb2YgdGhlIGV2ZW50LlxuICAgICAqKlxuICAgICA+IEFyZ3VtZW50c1xuICAgICAqKlxuICAgICAtIHN1Ym5hbWUgKHN0cmluZykgI29wdGlvbmFsIHN1Ym5hbWUgb2YgdGhlIGV2ZW50XG4gICAgICoqXG4gICAgID0gKHN0cmluZykgbmFtZSBvZiB0aGUgZXZlbnQsIGlmIGBzdWJuYW1lYCBpcyBub3Qgc3BlY2lmaWVkXG4gICAgICogb3JcbiAgICAgPSAoYm9vbGVhbikgYHRydWVgLCBpZiBjdXJyZW50IGV2ZW504oCZcyBuYW1lIGNvbnRhaW5zIGBzdWJuYW1lYFxuICAgIFxcKi9cbiAgICBldmUubnQgPSBmdW5jdGlvbiAoc3VibmFtZSkge1xuICAgICAgICB2YXIgY3VyID0gaXNBcnJheShjdXJyZW50X2V2ZW50KSA/IGN1cnJlbnRfZXZlbnQuam9pbihcIi5cIikgOiBjdXJyZW50X2V2ZW50O1xuICAgICAgICBpZiAoc3VibmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZWdFeHAoXCIoPzpcXFxcLnxcXFxcL3xeKVwiICsgc3VibmFtZSArIFwiKD86XFxcXC58XFxcXC98JClcIikudGVzdChjdXIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjdXI7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogZXZlLm50c1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQ291bGQgYmUgdXNlZCBpbnNpZGUgZXZlbnQgaGFuZGxlciB0byBmaWd1cmUgb3V0IGFjdHVhbCBuYW1lIG9mIHRoZSBldmVudC5cbiAgICAgKipcbiAgICAgKipcbiAgICAgPSAoYXJyYXkpIG5hbWVzIG9mIHRoZSBldmVudFxuICAgIFxcKi9cbiAgICBldmUubnRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gaXNBcnJheShjdXJyZW50X2V2ZW50KSA/IGN1cnJlbnRfZXZlbnQgOiBjdXJyZW50X2V2ZW50LnNwbGl0KHNlcGFyYXRvcik7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogZXZlLm9mZlxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyBnaXZlbiBmdW5jdGlvbiBmcm9tIHRoZSBsaXN0IG9mIGV2ZW50IGxpc3RlbmVycyBhc3NpZ25lZCB0byBnaXZlbiBuYW1lLlxuICAgICAqIElmIG5vIGFyZ3VtZW50cyBzcGVjaWZpZWQgYWxsIHRoZSBldmVudHMgd2lsbCBiZSBjbGVhcmVkLlxuICAgICAqKlxuICAgICA+IEFyZ3VtZW50c1xuICAgICAqKlxuICAgICAtIG5hbWUgKHN0cmluZykgbmFtZSBvZiB0aGUgZXZlbnQsIGRvdCAoYC5gKSBvciBzbGFzaCAoYC9gKSBzZXBhcmF0ZWQsIHdpdGggb3B0aW9uYWwgd2lsZGNhcmRzXG4gICAgIC0gZiAoZnVuY3Rpb24pIGV2ZW50IGhhbmRsZXIgZnVuY3Rpb25cbiAgICBcXCovXG4gICAgLypcXFxuICAgICAqIGV2ZS51bmJpbmRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFNlZSBAZXZlLm9mZlxuICAgIFxcKi9cbiAgICBldmUub2ZmID0gZXZlLnVuYmluZCA9IGZ1bmN0aW9uIChuYW1lLCBmKSB7XG4gICAgICAgIGlmICghbmFtZSkge1xuICAgICAgICAgICAgZXZlLl9ldmVudHMgPSBldmVudHMgPSB7bjoge319O1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBuYW1lcyA9IGlzQXJyYXkobmFtZSkgPyAoaXNBcnJheShuYW1lWzBdKSA/IG5hbWUgOiBbbmFtZV0pIDogU3RyKG5hbWUpLnNwbGl0KGNvbWFzZXBhcmF0b3IpO1xuICAgICAgICBpZiAobmFtZXMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gbmFtZXMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgIGV2ZS5vZmYobmFtZXNbaV0sIGYpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIG5hbWVzID0gaXNBcnJheShuYW1lKSA/IG5hbWUgOiBTdHIobmFtZSkuc3BsaXQoc2VwYXJhdG9yKTtcbiAgICAgICAgdmFyIGUsXG4gICAgICAgICAgICBrZXksXG4gICAgICAgICAgICBzcGxpY2UsXG4gICAgICAgICAgICBpLCBpaSwgaiwgamosXG4gICAgICAgICAgICBjdXIgPSBbZXZlbnRzXTtcbiAgICAgICAgZm9yIChpID0gMCwgaWkgPSBuYW1lcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgY3VyLmxlbmd0aDsgaiArPSBzcGxpY2UubGVuZ3RoIC0gMikge1xuICAgICAgICAgICAgICAgIHNwbGljZSA9IFtqLCAxXTtcbiAgICAgICAgICAgICAgICBlID0gY3VyW2pdLm47XG4gICAgICAgICAgICAgICAgaWYgKG5hbWVzW2ldICE9IHdpbGRjYXJkKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlW25hbWVzW2ldXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3BsaWNlLnB1c2goZVtuYW1lc1tpXV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gZSkgaWYgKGVbaGFzXShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzcGxpY2UucHVzaChlW2tleV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGN1ci5zcGxpY2UuYXBwbHkoY3VyLCBzcGxpY2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAoaSA9IDAsIGlpID0gY3VyLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIGUgPSBjdXJbaV07XG4gICAgICAgICAgICB3aGlsZSAoZS5uKSB7XG4gICAgICAgICAgICAgICAgaWYgKGYpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGUuZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChqID0gMCwgamogPSBlLmYubGVuZ3RoOyBqIDwgamo7IGorKykgaWYgKGUuZltqXSA9PSBmKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5mLnNwbGljZShqLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICFlLmYubGVuZ3RoICYmIGRlbGV0ZSBlLmY7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gZS5uKSBpZiAoZS5uW2hhc10oa2V5KSAmJiBlLm5ba2V5XS5mKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZnVuY3MgPSBlLm5ba2V5XS5mO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChqID0gMCwgamogPSBmdW5jcy5sZW5ndGg7IGogPCBqajsgaisrKSBpZiAoZnVuY3Nbal0gPT0gZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmNzLnNwbGljZShqLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICFmdW5jcy5sZW5ndGggJiYgZGVsZXRlIGUubltrZXldLmY7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgZS5mO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGtleSBpbiBlLm4pIGlmIChlLm5baGFzXShrZXkpICYmIGUubltrZXldLmYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBlLm5ba2V5XS5mO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGUgPSBlLm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBldmUub25jZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQmluZHMgZ2l2ZW4gZXZlbnQgaGFuZGxlciB3aXRoIGEgZ2l2ZW4gbmFtZSB0byBvbmx5IHJ1biBvbmNlIHRoZW4gdW5iaW5kIGl0c2VsZi5cbiAgICAgfCBldmUub25jZShcImxvZ2luXCIsIGYpO1xuICAgICB8IGV2ZShcImxvZ2luXCIpOyAvLyB0cmlnZ2VycyBmXG4gICAgIHwgZXZlKFwibG9naW5cIik7IC8vIG5vIGxpc3RlbmVyc1xuICAgICAqIFVzZSBAZXZlIHRvIHRyaWdnZXIgdGhlIGxpc3RlbmVyLlxuICAgICAqKlxuICAgICA+IEFyZ3VtZW50c1xuICAgICAqKlxuICAgICAtIG5hbWUgKHN0cmluZykgbmFtZSBvZiB0aGUgZXZlbnQsIGRvdCAoYC5gKSBvciBzbGFzaCAoYC9gKSBzZXBhcmF0ZWQsIHdpdGggb3B0aW9uYWwgd2lsZGNhcmRzXG4gICAgIC0gZiAoZnVuY3Rpb24pIGV2ZW50IGhhbmRsZXIgZnVuY3Rpb25cbiAgICAgKipcbiAgICAgPSAoZnVuY3Rpb24pIHNhbWUgcmV0dXJuIGZ1bmN0aW9uIGFzIEBldmUub25cbiAgICBcXCovXG4gICAgZXZlLm9uY2UgPSBmdW5jdGlvbiAobmFtZSwgZikge1xuICAgICAgICB2YXIgZjIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBldmUub2ZmKG5hbWUsIGYyKTtcbiAgICAgICAgICAgIHJldHVybiBmLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBldmUub24obmFtZSwgZjIpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIGV2ZS52ZXJzaW9uXG4gICAgIFsgcHJvcGVydHkgKHN0cmluZykgXVxuICAgICAqKlxuICAgICAqIEN1cnJlbnQgdmVyc2lvbiBvZiB0aGUgbGlicmFyeS5cbiAgICBcXCovXG4gICAgZXZlLnZlcnNpb24gPSB2ZXJzaW9uO1xuICAgIGV2ZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFwiWW91IGFyZSBydW5uaW5nIEV2ZSBcIiArIHZlcnNpb247XG4gICAgfTtcbiAgICAodHlwZW9mIG1vZHVsZSAhPSBcInVuZGVmaW5lZFwiICYmIG1vZHVsZS5leHBvcnRzKSA/IChtb2R1bGUuZXhwb3J0cyA9IGV2ZSkgOiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQgPyAoZGVmaW5lKFwiZXZlXCIsIFtdLCBmdW5jdGlvbigpIHsgcmV0dXJuIGV2ZTsgfSkpIDogKGdsb2IuZXZlID0gZXZlKSk7XG59KSh0aGlzKTtcbiIsIi8qIVxuICogRXZlbnRFbWl0dGVyMlxuICogaHR0cHM6Ly9naXRodWIuY29tL2hpajFueC9FdmVudEVtaXR0ZXIyXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDEzIGhpajFueFxuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuICovXG47IWZ1bmN0aW9uKHVuZGVmaW5lZCkge1xuXG4gIHZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSA/IEFycmF5LmlzQXJyYXkgOiBmdW5jdGlvbiBfaXNBcnJheShvYmopIHtcbiAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikgPT09IFwiW29iamVjdCBBcnJheV1cIjtcbiAgfTtcbiAgdmFyIGRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcblxuICBmdW5jdGlvbiBpbml0KCkge1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIGlmICh0aGlzLl9jb25mKSB7XG4gICAgICBjb25maWd1cmUuY2FsbCh0aGlzLCB0aGlzLl9jb25mKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBjb25maWd1cmUoY29uZikge1xuICAgIGlmIChjb25mKSB7XG5cbiAgICAgIHRoaXMuX2NvbmYgPSBjb25mO1xuXG4gICAgICBjb25mLmRlbGltaXRlciAmJiAodGhpcy5kZWxpbWl0ZXIgPSBjb25mLmRlbGltaXRlcik7XG4gICAgICBjb25mLm1heExpc3RlbmVycyAmJiAodGhpcy5fZXZlbnRzLm1heExpc3RlbmVycyA9IGNvbmYubWF4TGlzdGVuZXJzKTtcbiAgICAgIGNvbmYud2lsZGNhcmQgJiYgKHRoaXMud2lsZGNhcmQgPSBjb25mLndpbGRjYXJkKTtcbiAgICAgIGNvbmYubmV3TGlzdGVuZXIgJiYgKHRoaXMubmV3TGlzdGVuZXIgPSBjb25mLm5ld0xpc3RlbmVyKTtcblxuICAgICAgaWYgKHRoaXMud2lsZGNhcmQpIHtcbiAgICAgICAgdGhpcy5saXN0ZW5lclRyZWUgPSB7fTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBFdmVudEVtaXR0ZXIoY29uZikge1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIHRoaXMubmV3TGlzdGVuZXIgPSBmYWxzZTtcbiAgICBjb25maWd1cmUuY2FsbCh0aGlzLCBjb25mKTtcbiAgfVxuXG4gIC8vXG4gIC8vIEF0dGVudGlvbiwgZnVuY3Rpb24gcmV0dXJuIHR5cGUgbm93IGlzIGFycmF5LCBhbHdheXMgIVxuICAvLyBJdCBoYXMgemVybyBlbGVtZW50cyBpZiBubyBhbnkgbWF0Y2hlcyBmb3VuZCBhbmQgb25lIG9yIG1vcmVcbiAgLy8gZWxlbWVudHMgKGxlYWZzKSBpZiB0aGVyZSBhcmUgbWF0Y2hlc1xuICAvL1xuICBmdW5jdGlvbiBzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHRyZWUsIGkpIHtcbiAgICBpZiAoIXRyZWUpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgdmFyIGxpc3RlbmVycz1bXSwgbGVhZiwgbGVuLCBicmFuY2gsIHhUcmVlLCB4eFRyZWUsIGlzb2xhdGVkQnJhbmNoLCBlbmRSZWFjaGVkLFxuICAgICAgICB0eXBlTGVuZ3RoID0gdHlwZS5sZW5ndGgsIGN1cnJlbnRUeXBlID0gdHlwZVtpXSwgbmV4dFR5cGUgPSB0eXBlW2krMV07XG4gICAgaWYgKGkgPT09IHR5cGVMZW5ndGggJiYgdHJlZS5fbGlzdGVuZXJzKSB7XG4gICAgICAvL1xuICAgICAgLy8gSWYgYXQgdGhlIGVuZCBvZiB0aGUgZXZlbnQocykgbGlzdCBhbmQgdGhlIHRyZWUgaGFzIGxpc3RlbmVyc1xuICAgICAgLy8gaW52b2tlIHRob3NlIGxpc3RlbmVycy5cbiAgICAgIC8vXG4gICAgICBpZiAodHlwZW9mIHRyZWUuX2xpc3RlbmVycyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBoYW5kbGVycyAmJiBoYW5kbGVycy5wdXNoKHRyZWUuX2xpc3RlbmVycyk7XG4gICAgICAgIHJldHVybiBbdHJlZV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKGxlYWYgPSAwLCBsZW4gPSB0cmVlLl9saXN0ZW5lcnMubGVuZ3RoOyBsZWFmIDwgbGVuOyBsZWFmKyspIHtcbiAgICAgICAgICBoYW5kbGVycyAmJiBoYW5kbGVycy5wdXNoKHRyZWUuX2xpc3RlbmVyc1tsZWFmXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFt0cmVlXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoKGN1cnJlbnRUeXBlID09PSAnKicgfHwgY3VycmVudFR5cGUgPT09ICcqKicpIHx8IHRyZWVbY3VycmVudFR5cGVdKSB7XG4gICAgICAvL1xuICAgICAgLy8gSWYgdGhlIGV2ZW50IGVtaXR0ZWQgaXMgJyonIGF0IHRoaXMgcGFydFxuICAgICAgLy8gb3IgdGhlcmUgaXMgYSBjb25jcmV0ZSBtYXRjaCBhdCB0aGlzIHBhdGNoXG4gICAgICAvL1xuICAgICAgaWYgKGN1cnJlbnRUeXBlID09PSAnKicpIHtcbiAgICAgICAgZm9yIChicmFuY2ggaW4gdHJlZSkge1xuICAgICAgICAgIGlmIChicmFuY2ggIT09ICdfbGlzdGVuZXJzJyAmJiB0cmVlLmhhc093blByb3BlcnR5KGJyYW5jaCkpIHtcbiAgICAgICAgICAgIGxpc3RlbmVycyA9IGxpc3RlbmVycy5jb25jYXQoc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB0cmVlW2JyYW5jaF0sIGkrMSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbGlzdGVuZXJzO1xuICAgICAgfSBlbHNlIGlmKGN1cnJlbnRUeXBlID09PSAnKionKSB7XG4gICAgICAgIGVuZFJlYWNoZWQgPSAoaSsxID09PSB0eXBlTGVuZ3RoIHx8IChpKzIgPT09IHR5cGVMZW5ndGggJiYgbmV4dFR5cGUgPT09ICcqJykpO1xuICAgICAgICBpZihlbmRSZWFjaGVkICYmIHRyZWUuX2xpc3RlbmVycykge1xuICAgICAgICAgIC8vIFRoZSBuZXh0IGVsZW1lbnQgaGFzIGEgX2xpc3RlbmVycywgYWRkIGl0IHRvIHRoZSBoYW5kbGVycy5cbiAgICAgICAgICBsaXN0ZW5lcnMgPSBsaXN0ZW5lcnMuY29uY2F0KHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgdHJlZSwgdHlwZUxlbmd0aCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChicmFuY2ggaW4gdHJlZSkge1xuICAgICAgICAgIGlmIChicmFuY2ggIT09ICdfbGlzdGVuZXJzJyAmJiB0cmVlLmhhc093blByb3BlcnR5KGJyYW5jaCkpIHtcbiAgICAgICAgICAgIGlmKGJyYW5jaCA9PT0gJyonIHx8IGJyYW5jaCA9PT0gJyoqJykge1xuICAgICAgICAgICAgICBpZih0cmVlW2JyYW5jaF0uX2xpc3RlbmVycyAmJiAhZW5kUmVhY2hlZCkge1xuICAgICAgICAgICAgICAgIGxpc3RlbmVycyA9IGxpc3RlbmVycy5jb25jYXQoc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB0cmVlW2JyYW5jaF0sIHR5cGVMZW5ndGgpKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBsaXN0ZW5lcnMgPSBsaXN0ZW5lcnMuY29uY2F0KHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgdHJlZVticmFuY2hdLCBpKSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYoYnJhbmNoID09PSBuZXh0VHlwZSkge1xuICAgICAgICAgICAgICBsaXN0ZW5lcnMgPSBsaXN0ZW5lcnMuY29uY2F0KHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgdHJlZVticmFuY2hdLCBpKzIpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIC8vIE5vIG1hdGNoIG9uIHRoaXMgb25lLCBzaGlmdCBpbnRvIHRoZSB0cmVlIGJ1dCBub3QgaW4gdGhlIHR5cGUgYXJyYXkuXG4gICAgICAgICAgICAgIGxpc3RlbmVycyA9IGxpc3RlbmVycy5jb25jYXQoc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB0cmVlW2JyYW5jaF0sIGkpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGxpc3RlbmVycztcbiAgICAgIH1cblxuICAgICAgbGlzdGVuZXJzID0gbGlzdGVuZXJzLmNvbmNhdChzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHRyZWVbY3VycmVudFR5cGVdLCBpKzEpKTtcbiAgICB9XG5cbiAgICB4VHJlZSA9IHRyZWVbJyonXTtcbiAgICBpZiAoeFRyZWUpIHtcbiAgICAgIC8vXG4gICAgICAvLyBJZiB0aGUgbGlzdGVuZXIgdHJlZSB3aWxsIGFsbG93IGFueSBtYXRjaCBmb3IgdGhpcyBwYXJ0LFxuICAgICAgLy8gdGhlbiByZWN1cnNpdmVseSBleHBsb3JlIGFsbCBicmFuY2hlcyBvZiB0aGUgdHJlZVxuICAgICAgLy9cbiAgICAgIHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgeFRyZWUsIGkrMSk7XG4gICAgfVxuXG4gICAgeHhUcmVlID0gdHJlZVsnKionXTtcbiAgICBpZih4eFRyZWUpIHtcbiAgICAgIGlmKGkgPCB0eXBlTGVuZ3RoKSB7XG4gICAgICAgIGlmKHh4VHJlZS5fbGlzdGVuZXJzKSB7XG4gICAgICAgICAgLy8gSWYgd2UgaGF2ZSBhIGxpc3RlbmVyIG9uIGEgJyoqJywgaXQgd2lsbCBjYXRjaCBhbGwsIHNvIGFkZCBpdHMgaGFuZGxlci5cbiAgICAgICAgICBzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHh4VHJlZSwgdHlwZUxlbmd0aCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBCdWlsZCBhcnJheXMgb2YgbWF0Y2hpbmcgbmV4dCBicmFuY2hlcyBhbmQgb3RoZXJzLlxuICAgICAgICBmb3IoYnJhbmNoIGluIHh4VHJlZSkge1xuICAgICAgICAgIGlmKGJyYW5jaCAhPT0gJ19saXN0ZW5lcnMnICYmIHh4VHJlZS5oYXNPd25Qcm9wZXJ0eShicmFuY2gpKSB7XG4gICAgICAgICAgICBpZihicmFuY2ggPT09IG5leHRUeXBlKSB7XG4gICAgICAgICAgICAgIC8vIFdlIGtub3cgdGhlIG5leHQgZWxlbWVudCB3aWxsIG1hdGNoLCBzbyBqdW1wIHR3aWNlLlxuICAgICAgICAgICAgICBzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHh4VHJlZVticmFuY2hdLCBpKzIpO1xuICAgICAgICAgICAgfSBlbHNlIGlmKGJyYW5jaCA9PT0gY3VycmVudFR5cGUpIHtcbiAgICAgICAgICAgICAgLy8gQ3VycmVudCBub2RlIG1hdGNoZXMsIG1vdmUgaW50byB0aGUgdHJlZS5cbiAgICAgICAgICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB4eFRyZWVbYnJhbmNoXSwgaSsxKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGlzb2xhdGVkQnJhbmNoID0ge307XG4gICAgICAgICAgICAgIGlzb2xhdGVkQnJhbmNoW2JyYW5jaF0gPSB4eFRyZWVbYnJhbmNoXTtcbiAgICAgICAgICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB7ICcqKic6IGlzb2xhdGVkQnJhbmNoIH0sIGkrMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYoeHhUcmVlLl9saXN0ZW5lcnMpIHtcbiAgICAgICAgLy8gV2UgaGF2ZSByZWFjaGVkIHRoZSBlbmQgYW5kIHN0aWxsIG9uIGEgJyoqJ1xuICAgICAgICBzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHh4VHJlZSwgdHlwZUxlbmd0aCk7XG4gICAgICB9IGVsc2UgaWYoeHhUcmVlWycqJ10gJiYgeHhUcmVlWycqJ10uX2xpc3RlbmVycykge1xuICAgICAgICBzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHh4VHJlZVsnKiddLCB0eXBlTGVuZ3RoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbGlzdGVuZXJzO1xuICB9XG5cbiAgZnVuY3Rpb24gZ3Jvd0xpc3RlbmVyVHJlZSh0eXBlLCBsaXN0ZW5lcikge1xuXG4gICAgdHlwZSA9IHR5cGVvZiB0eXBlID09PSAnc3RyaW5nJyA/IHR5cGUuc3BsaXQodGhpcy5kZWxpbWl0ZXIpIDogdHlwZS5zbGljZSgpO1xuXG4gICAgLy9cbiAgICAvLyBMb29rcyBmb3IgdHdvIGNvbnNlY3V0aXZlICcqKicsIGlmIHNvLCBkb24ndCBhZGQgdGhlIGV2ZW50IGF0IGFsbC5cbiAgICAvL1xuICAgIGZvcih2YXIgaSA9IDAsIGxlbiA9IHR5cGUubGVuZ3RoOyBpKzEgPCBsZW47IGkrKykge1xuICAgICAgaWYodHlwZVtpXSA9PT0gJyoqJyAmJiB0eXBlW2krMV0gPT09ICcqKicpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciB0cmVlID0gdGhpcy5saXN0ZW5lclRyZWU7XG4gICAgdmFyIG5hbWUgPSB0eXBlLnNoaWZ0KCk7XG5cbiAgICB3aGlsZSAobmFtZSkge1xuXG4gICAgICBpZiAoIXRyZWVbbmFtZV0pIHtcbiAgICAgICAgdHJlZVtuYW1lXSA9IHt9O1xuICAgICAgfVxuXG4gICAgICB0cmVlID0gdHJlZVtuYW1lXTtcblxuICAgICAgaWYgKHR5cGUubGVuZ3RoID09PSAwKSB7XG5cbiAgICAgICAgaWYgKCF0cmVlLl9saXN0ZW5lcnMpIHtcbiAgICAgICAgICB0cmVlLl9saXN0ZW5lcnMgPSBsaXN0ZW5lcjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmKHR5cGVvZiB0cmVlLl9saXN0ZW5lcnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICB0cmVlLl9saXN0ZW5lcnMgPSBbdHJlZS5fbGlzdGVuZXJzLCBsaXN0ZW5lcl07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXNBcnJheSh0cmVlLl9saXN0ZW5lcnMpKSB7XG5cbiAgICAgICAgICB0cmVlLl9saXN0ZW5lcnMucHVzaChsaXN0ZW5lcik7XG5cbiAgICAgICAgICBpZiAoIXRyZWUuX2xpc3RlbmVycy53YXJuZWQpIHtcblxuICAgICAgICAgICAgdmFyIG0gPSBkZWZhdWx0TWF4TGlzdGVuZXJzO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMuX2V2ZW50cy5tYXhMaXN0ZW5lcnMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgIG0gPSB0aGlzLl9ldmVudHMubWF4TGlzdGVuZXJzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAobSA+IDAgJiYgdHJlZS5fbGlzdGVuZXJzLmxlbmd0aCA+IG0pIHtcblxuICAgICAgICAgICAgICB0cmVlLl9saXN0ZW5lcnMud2FybmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0LicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJlZS5fbGlzdGVuZXJzLmxlbmd0aCk7XG4gICAgICAgICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICBuYW1lID0gdHlwZS5zaGlmdCgpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW5cbiAgLy8gMTAgbGlzdGVuZXJzIGFyZSBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoXG4gIC8vIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxuICAvL1xuICAvLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3NcbiAgLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5cbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5kZWxpbWl0ZXIgPSAnLic7XG5cbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbihuKSB7XG4gICAgdGhpcy5fZXZlbnRzIHx8IGluaXQuY2FsbCh0aGlzKTtcbiAgICB0aGlzLl9ldmVudHMubWF4TGlzdGVuZXJzID0gbjtcbiAgICBpZiAoIXRoaXMuX2NvbmYpIHRoaXMuX2NvbmYgPSB7fTtcbiAgICB0aGlzLl9jb25mLm1heExpc3RlbmVycyA9IG47XG4gIH07XG5cbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5ldmVudCA9ICcnO1xuXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKGV2ZW50LCBmbikge1xuICAgIHRoaXMubWFueShldmVudCwgMSwgZm4pO1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUubWFueSA9IGZ1bmN0aW9uKGV2ZW50LCB0dGwsIGZuKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgaWYgKHR5cGVvZiBmbiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdtYW55IG9ubHkgYWNjZXB0cyBpbnN0YW5jZXMgb2YgRnVuY3Rpb24nKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaXN0ZW5lcigpIHtcbiAgICAgIGlmICgtLXR0bCA9PT0gMCkge1xuICAgICAgICBzZWxmLm9mZihldmVudCwgbGlzdGVuZXIpO1xuICAgICAgfVxuICAgICAgZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICBsaXN0ZW5lci5fb3JpZ2luID0gZm47XG5cbiAgICB0aGlzLm9uKGV2ZW50LCBsaXN0ZW5lcik7XG5cbiAgICByZXR1cm4gc2VsZjtcbiAgfTtcblxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbigpIHtcblxuICAgIHRoaXMuX2V2ZW50cyB8fCBpbml0LmNhbGwodGhpcyk7XG5cbiAgICB2YXIgdHlwZSA9IGFyZ3VtZW50c1swXTtcblxuICAgIGlmICh0eXBlID09PSAnbmV3TGlzdGVuZXInICYmICF0aGlzLm5ld0xpc3RlbmVyKSB7XG4gICAgICBpZiAoIXRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcikgeyByZXR1cm4gZmFsc2U7IH1cbiAgICB9XG5cbiAgICAvLyBMb29wIHRocm91Z2ggdGhlICpfYWxsKiBmdW5jdGlvbnMgYW5kIGludm9rZSB0aGVtLlxuICAgIGlmICh0aGlzLl9hbGwpIHtcbiAgICAgIHZhciBsID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGwgLSAxKTtcbiAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgbDsgaSsrKSBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgIGZvciAoaSA9IDAsIGwgPSB0aGlzLl9hbGwubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIHRoaXMuZXZlbnQgPSB0eXBlO1xuICAgICAgICB0aGlzLl9hbGxbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlcmUgaXMgbm8gJ2Vycm9yJyBldmVudCBsaXN0ZW5lciB0aGVuIHRocm93LlxuICAgIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG5cbiAgICAgIGlmICghdGhpcy5fYWxsICYmXG4gICAgICAgICF0aGlzLl9ldmVudHMuZXJyb3IgJiZcbiAgICAgICAgISh0aGlzLndpbGRjYXJkICYmIHRoaXMubGlzdGVuZXJUcmVlLmVycm9yKSkge1xuXG4gICAgICAgIGlmIChhcmd1bWVudHNbMV0gaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICAgIHRocm93IGFyZ3VtZW50c1sxXTsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmNhdWdodCwgdW5zcGVjaWZpZWQgJ2Vycm9yJyBldmVudC5cIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBoYW5kbGVyO1xuXG4gICAgaWYodGhpcy53aWxkY2FyZCkge1xuICAgICAgaGFuZGxlciA9IFtdO1xuICAgICAgdmFyIG5zID0gdHlwZW9mIHR5cGUgPT09ICdzdHJpbmcnID8gdHlwZS5zcGxpdCh0aGlzLmRlbGltaXRlcikgOiB0eXBlLnNsaWNlKCk7XG4gICAgICBzZWFyY2hMaXN0ZW5lclRyZWUuY2FsbCh0aGlzLCBoYW5kbGVyLCBucywgdGhpcy5saXN0ZW5lclRyZWUsIDApO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBoYW5kbGVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aGlzLmV2ZW50ID0gdHlwZTtcbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKVxuICAgICAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAvLyBzbG93ZXJcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdmFyIGwgPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkobCAtIDEpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBsOyBpKyspIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGVsc2UgaWYgKGhhbmRsZXIpIHtcbiAgICAgIHZhciBsID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGwgLSAxKTtcbiAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgbDsgaSsrKSBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcblxuICAgICAgdmFyIGxpc3RlbmVycyA9IGhhbmRsZXIuc2xpY2UoKTtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gbGlzdGVuZXJzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICB0aGlzLmV2ZW50ID0gdHlwZTtcbiAgICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIChsaXN0ZW5lcnMubGVuZ3RoID4gMCkgfHwgISF0aGlzLl9hbGw7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmV0dXJuICEhdGhpcy5fYWxsO1xuICAgIH1cblxuICB9O1xuXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuXG4gICAgaWYgKHR5cGVvZiB0eXBlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aGlzLm9uQW55KHR5cGUpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdvbiBvbmx5IGFjY2VwdHMgaW5zdGFuY2VzIG9mIEZ1bmN0aW9uJyk7XG4gICAgfVxuICAgIHRoaXMuX2V2ZW50cyB8fCBpbml0LmNhbGwodGhpcyk7XG5cbiAgICAvLyBUbyBhdm9pZCByZWN1cnNpb24gaW4gdGhlIGNhc2UgdGhhdCB0eXBlID09IFwibmV3TGlzdGVuZXJzXCIhIEJlZm9yZVxuICAgIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJzXCIuXG4gICAgdGhpcy5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICAgIGlmKHRoaXMud2lsZGNhcmQpIHtcbiAgICAgIGdyb3dMaXN0ZW5lclRyZWUuY2FsbCh0aGlzLCB0eXBlLCBsaXN0ZW5lcik7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSkge1xuICAgICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgICB9XG4gICAgZWxzZSBpZih0eXBlb2YgdGhpcy5fZXZlbnRzW3R5cGVdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV0sIGxpc3RlbmVyXTtcbiAgICB9XG4gICAgZWxzZSBpZiAoaXNBcnJheSh0aGlzLl9ldmVudHNbdHlwZV0pKSB7XG4gICAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG5cbiAgICAgIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gICAgICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcblxuICAgICAgICB2YXIgbSA9IGRlZmF1bHRNYXhMaXN0ZW5lcnM7XG5cbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLl9ldmVudHMubWF4TGlzdGVuZXJzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIG0gPSB0aGlzLl9ldmVudHMubWF4TGlzdGVuZXJzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG0gPiAwICYmIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGggPiBtKSB7XG5cbiAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkID0gdHJ1ZTtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0LicsXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbkFueSA9IGZ1bmN0aW9uKGZuKSB7XG5cbiAgICBpZiAodHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ29uQW55IG9ubHkgYWNjZXB0cyBpbnN0YW5jZXMgb2YgRnVuY3Rpb24nKTtcbiAgICB9XG5cbiAgICBpZighdGhpcy5fYWxsKSB7XG4gICAgICB0aGlzLl9hbGwgPSBbXTtcbiAgICB9XG5cbiAgICAvLyBBZGQgdGhlIGZ1bmN0aW9uIHRvIHRoZSBldmVudCBsaXN0ZW5lciBjb2xsZWN0aW9uLlxuICAgIHRoaXMuX2FsbC5wdXNoKGZuKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbjtcblxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9mZiA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdyZW1vdmVMaXN0ZW5lciBvbmx5IHRha2VzIGluc3RhbmNlcyBvZiBGdW5jdGlvbicpO1xuICAgIH1cblxuICAgIHZhciBoYW5kbGVycyxsZWFmcz1bXTtcblxuICAgIGlmKHRoaXMud2lsZGNhcmQpIHtcbiAgICAgIHZhciBucyA9IHR5cGVvZiB0eXBlID09PSAnc3RyaW5nJyA/IHR5cGUuc3BsaXQodGhpcy5kZWxpbWl0ZXIpIDogdHlwZS5zbGljZSgpO1xuICAgICAgbGVhZnMgPSBzZWFyY2hMaXN0ZW5lclRyZWUuY2FsbCh0aGlzLCBudWxsLCBucywgdGhpcy5saXN0ZW5lclRyZWUsIDApO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIC8vIGRvZXMgbm90IHVzZSBsaXN0ZW5lcnMoKSwgc28gbm8gc2lkZSBlZmZlY3Qgb2YgY3JlYXRpbmcgX2V2ZW50c1t0eXBlXVxuICAgICAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pIHJldHVybiB0aGlzO1xuICAgICAgaGFuZGxlcnMgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgICBsZWFmcy5wdXNoKHtfbGlzdGVuZXJzOmhhbmRsZXJzfSk7XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaUxlYWY9MDsgaUxlYWY8bGVhZnMubGVuZ3RoOyBpTGVhZisrKSB7XG4gICAgICB2YXIgbGVhZiA9IGxlYWZzW2lMZWFmXTtcbiAgICAgIGhhbmRsZXJzID0gbGVhZi5fbGlzdGVuZXJzO1xuICAgICAgaWYgKGlzQXJyYXkoaGFuZGxlcnMpKSB7XG5cbiAgICAgICAgdmFyIHBvc2l0aW9uID0gLTE7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGhhbmRsZXJzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKGhhbmRsZXJzW2ldID09PSBsaXN0ZW5lciB8fFxuICAgICAgICAgICAgKGhhbmRsZXJzW2ldLmxpc3RlbmVyICYmIGhhbmRsZXJzW2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikgfHxcbiAgICAgICAgICAgIChoYW5kbGVyc1tpXS5fb3JpZ2luICYmIGhhbmRsZXJzW2ldLl9vcmlnaW4gPT09IGxpc3RlbmVyKSkge1xuICAgICAgICAgICAgcG9zaXRpb24gPSBpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBvc2l0aW9uIDwgMCkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYodGhpcy53aWxkY2FyZCkge1xuICAgICAgICAgIGxlYWYuX2xpc3RlbmVycy5zcGxpY2UocG9zaXRpb24sIDEpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5zcGxpY2UocG9zaXRpb24sIDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGhhbmRsZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIGlmKHRoaXMud2lsZGNhcmQpIHtcbiAgICAgICAgICAgIGRlbGV0ZSBsZWFmLl9saXN0ZW5lcnM7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChoYW5kbGVycyA9PT0gbGlzdGVuZXIgfHxcbiAgICAgICAgKGhhbmRsZXJzLmxpc3RlbmVyICYmIGhhbmRsZXJzLmxpc3RlbmVyID09PSBsaXN0ZW5lcikgfHxcbiAgICAgICAgKGhhbmRsZXJzLl9vcmlnaW4gJiYgaGFuZGxlcnMuX29yaWdpbiA9PT0gbGlzdGVuZXIpKSB7XG4gICAgICAgIGlmKHRoaXMud2lsZGNhcmQpIHtcbiAgICAgICAgICBkZWxldGUgbGVhZi5fbGlzdGVuZXJzO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9mZkFueSA9IGZ1bmN0aW9uKGZuKSB7XG4gICAgdmFyIGkgPSAwLCBsID0gMCwgZm5zO1xuICAgIGlmIChmbiAmJiB0aGlzLl9hbGwgJiYgdGhpcy5fYWxsLmxlbmd0aCA+IDApIHtcbiAgICAgIGZucyA9IHRoaXMuX2FsbDtcbiAgICAgIGZvcihpID0gMCwgbCA9IGZucy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgaWYoZm4gPT09IGZuc1tpXSkge1xuICAgICAgICAgIGZucy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fYWxsID0gW107XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9mZjtcblxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgIXRoaXMuX2V2ZW50cyB8fCBpbml0LmNhbGwodGhpcyk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBpZih0aGlzLndpbGRjYXJkKSB7XG4gICAgICB2YXIgbnMgPSB0eXBlb2YgdHlwZSA9PT0gJ3N0cmluZycgPyB0eXBlLnNwbGl0KHRoaXMuZGVsaW1pdGVyKSA6IHR5cGUuc2xpY2UoKTtcbiAgICAgIHZhciBsZWFmcyA9IHNlYXJjaExpc3RlbmVyVHJlZS5jYWxsKHRoaXMsIG51bGwsIG5zLCB0aGlzLmxpc3RlbmVyVHJlZSwgMCk7XG5cbiAgICAgIGZvciAodmFyIGlMZWFmPTA7IGlMZWFmPGxlYWZzLmxlbmd0aDsgaUxlYWYrKykge1xuICAgICAgICB2YXIgbGVhZiA9IGxlYWZzW2lMZWFmXTtcbiAgICAgICAgbGVhZi5fbGlzdGVuZXJzID0gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSkgcmV0dXJuIHRoaXM7XG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgICBpZih0aGlzLndpbGRjYXJkKSB7XG4gICAgICB2YXIgaGFuZGxlcnMgPSBbXTtcbiAgICAgIHZhciBucyA9IHR5cGVvZiB0eXBlID09PSAnc3RyaW5nJyA/IHR5cGUuc3BsaXQodGhpcy5kZWxpbWl0ZXIpIDogdHlwZS5zbGljZSgpO1xuICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlLmNhbGwodGhpcywgaGFuZGxlcnMsIG5zLCB0aGlzLmxpc3RlbmVyVHJlZSwgMCk7XG4gICAgICByZXR1cm4gaGFuZGxlcnM7XG4gICAgfVxuXG4gICAgdGhpcy5fZXZlbnRzIHx8IGluaXQuY2FsbCh0aGlzKTtcblxuICAgIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKSB0aGlzLl9ldmVudHNbdHlwZV0gPSBbXTtcbiAgICBpZiAoIWlzQXJyYXkodGhpcy5fZXZlbnRzW3R5cGVdKSkge1xuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9ldmVudHNbdHlwZV07XG4gIH07XG5cbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnNBbnkgPSBmdW5jdGlvbigpIHtcblxuICAgIGlmKHRoaXMuX2FsbCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2FsbDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gIH07XG5cbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAvLyBBTUQuIFJlZ2lzdGVyIGFzIGFuIGFub255bW91cyBtb2R1bGUuXG4gICAgZGVmaW5lKGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIEV2ZW50RW1pdHRlcjtcbiAgICB9KTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICAvLyBDb21tb25KU1xuICAgIGV4cG9ydHMuRXZlbnRFbWl0dGVyMiA9IEV2ZW50RW1pdHRlcjtcbiAgfVxuICBlbHNlIHtcbiAgICAvLyBCcm93c2VyIGdsb2JhbC5cbiAgICB3aW5kb3cuRXZlbnRFbWl0dGVyMiA9IEV2ZW50RW1pdHRlcjtcbiAgfVxufSgpO1xuIiwiXG52YXIgcm5nO1xuXG5pZiAoZ2xvYmFsLmNyeXB0byAmJiBjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKSB7XG4gIC8vIFdIQVRXRyBjcnlwdG8tYmFzZWQgUk5HIC0gaHR0cDovL3dpa2kud2hhdHdnLm9yZy93aWtpL0NyeXB0b1xuICAvLyBNb2RlcmF0ZWx5IGZhc3QsIGhpZ2ggcXVhbGl0eVxuICB2YXIgX3JuZHM4ID0gbmV3IFVpbnQ4QXJyYXkoMTYpO1xuICBybmcgPSBmdW5jdGlvbiB3aGF0d2dSTkcoKSB7XG4gICAgY3J5cHRvLmdldFJhbmRvbVZhbHVlcyhfcm5kczgpO1xuICAgIHJldHVybiBfcm5kczg7XG4gIH07XG59XG5cbmlmICghcm5nKSB7XG4gIC8vIE1hdGgucmFuZG9tKCktYmFzZWQgKFJORylcbiAgLy9cbiAgLy8gSWYgYWxsIGVsc2UgZmFpbHMsIHVzZSBNYXRoLnJhbmRvbSgpLiAgSXQncyBmYXN0LCBidXQgaXMgb2YgdW5zcGVjaWZpZWRcbiAgLy8gcXVhbGl0eS5cbiAgdmFyICBfcm5kcyA9IG5ldyBBcnJheSgxNik7XG4gIHJuZyA9IGZ1bmN0aW9uKCkge1xuICAgIGZvciAodmFyIGkgPSAwLCByOyBpIDwgMTY7IGkrKykge1xuICAgICAgaWYgKChpICYgMHgwMykgPT09IDApIHIgPSBNYXRoLnJhbmRvbSgpICogMHgxMDAwMDAwMDA7XG4gICAgICBfcm5kc1tpXSA9IHIgPj4+ICgoaSAmIDB4MDMpIDw8IDMpICYgMHhmZjtcbiAgICB9XG5cbiAgICByZXR1cm4gX3JuZHM7XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcm5nO1xuXG4iLCIvLyAgICAgdXVpZC5qc1xuLy9cbi8vICAgICBDb3B5cmlnaHQgKGMpIDIwMTAtMjAxMiBSb2JlcnQgS2llZmZlclxuLy8gICAgIE1JVCBMaWNlbnNlIC0gaHR0cDovL29wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL21pdC1saWNlbnNlLnBocFxuXG4vLyBVbmlxdWUgSUQgY3JlYXRpb24gcmVxdWlyZXMgYSBoaWdoIHF1YWxpdHkgcmFuZG9tICMgZ2VuZXJhdG9yLiAgV2UgZmVhdHVyZVxuLy8gZGV0ZWN0IHRvIGRldGVybWluZSB0aGUgYmVzdCBSTkcgc291cmNlLCBub3JtYWxpemluZyB0byBhIGZ1bmN0aW9uIHRoYXRcbi8vIHJldHVybnMgMTI4LWJpdHMgb2YgcmFuZG9tbmVzcywgc2luY2UgdGhhdCdzIHdoYXQncyB1c3VhbGx5IHJlcXVpcmVkXG52YXIgX3JuZyA9IHJlcXVpcmUoJy4vcm5nJyk7XG5cbi8vIE1hcHMgZm9yIG51bWJlciA8LT4gaGV4IHN0cmluZyBjb252ZXJzaW9uXG52YXIgX2J5dGVUb0hleCA9IFtdO1xudmFyIF9oZXhUb0J5dGUgPSB7fTtcbmZvciAodmFyIGkgPSAwOyBpIDwgMjU2OyBpKyspIHtcbiAgX2J5dGVUb0hleFtpXSA9IChpICsgMHgxMDApLnRvU3RyaW5nKDE2KS5zdWJzdHIoMSk7XG4gIF9oZXhUb0J5dGVbX2J5dGVUb0hleFtpXV0gPSBpO1xufVxuXG4vLyAqKmBwYXJzZSgpYCAtIFBhcnNlIGEgVVVJRCBpbnRvIGl0J3MgY29tcG9uZW50IGJ5dGVzKipcbmZ1bmN0aW9uIHBhcnNlKHMsIGJ1Ziwgb2Zmc2V0KSB7XG4gIHZhciBpID0gKGJ1ZiAmJiBvZmZzZXQpIHx8IDAsIGlpID0gMDtcblxuICBidWYgPSBidWYgfHwgW107XG4gIHMudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9bMC05YS1mXXsyfS9nLCBmdW5jdGlvbihvY3QpIHtcbiAgICBpZiAoaWkgPCAxNikgeyAvLyBEb24ndCBvdmVyZmxvdyFcbiAgICAgIGJ1ZltpICsgaWkrK10gPSBfaGV4VG9CeXRlW29jdF07XG4gICAgfVxuICB9KTtcblxuICAvLyBaZXJvIG91dCByZW1haW5pbmcgYnl0ZXMgaWYgc3RyaW5nIHdhcyBzaG9ydFxuICB3aGlsZSAoaWkgPCAxNikge1xuICAgIGJ1ZltpICsgaWkrK10gPSAwO1xuICB9XG5cbiAgcmV0dXJuIGJ1Zjtcbn1cblxuLy8gKipgdW5wYXJzZSgpYCAtIENvbnZlcnQgVVVJRCBieXRlIGFycmF5IChhbGEgcGFyc2UoKSkgaW50byBhIHN0cmluZyoqXG5mdW5jdGlvbiB1bnBhcnNlKGJ1Ziwgb2Zmc2V0KSB7XG4gIHZhciBpID0gb2Zmc2V0IHx8IDAsIGJ0aCA9IF9ieXRlVG9IZXg7XG4gIHJldHVybiAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICsgJy0nICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArICctJyArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gKyAnLScgK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICsgJy0nICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dO1xufVxuXG4vLyAqKmB2MSgpYCAtIEdlbmVyYXRlIHRpbWUtYmFzZWQgVVVJRCoqXG4vL1xuLy8gSW5zcGlyZWQgYnkgaHR0cHM6Ly9naXRodWIuY29tL0xpb3NLL1VVSUQuanNcbi8vIGFuZCBodHRwOi8vZG9jcy5weXRob24ub3JnL2xpYnJhcnkvdXVpZC5odG1sXG5cbi8vIHJhbmRvbSAjJ3Mgd2UgbmVlZCB0byBpbml0IG5vZGUgYW5kIGNsb2Nrc2VxXG52YXIgX3NlZWRCeXRlcyA9IF9ybmcoKTtcblxuLy8gUGVyIDQuNSwgY3JlYXRlIGFuZCA0OC1iaXQgbm9kZSBpZCwgKDQ3IHJhbmRvbSBiaXRzICsgbXVsdGljYXN0IGJpdCA9IDEpXG52YXIgX25vZGVJZCA9IFtcbiAgX3NlZWRCeXRlc1swXSB8IDB4MDEsXG4gIF9zZWVkQnl0ZXNbMV0sIF9zZWVkQnl0ZXNbMl0sIF9zZWVkQnl0ZXNbM10sIF9zZWVkQnl0ZXNbNF0sIF9zZWVkQnl0ZXNbNV1cbl07XG5cbi8vIFBlciA0LjIuMiwgcmFuZG9taXplICgxNCBiaXQpIGNsb2Nrc2VxXG52YXIgX2Nsb2Nrc2VxID0gKF9zZWVkQnl0ZXNbNl0gPDwgOCB8IF9zZWVkQnl0ZXNbN10pICYgMHgzZmZmO1xuXG4vLyBQcmV2aW91cyB1dWlkIGNyZWF0aW9uIHRpbWVcbnZhciBfbGFzdE1TZWNzID0gMCwgX2xhc3ROU2VjcyA9IDA7XG5cbi8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vYnJvb2ZhL25vZGUtdXVpZCBmb3IgQVBJIGRldGFpbHNcbmZ1bmN0aW9uIHYxKG9wdGlvbnMsIGJ1Ziwgb2Zmc2V0KSB7XG4gIHZhciBpID0gYnVmICYmIG9mZnNldCB8fCAwO1xuICB2YXIgYiA9IGJ1ZiB8fCBbXTtcblxuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICB2YXIgY2xvY2tzZXEgPSBvcHRpb25zLmNsb2Nrc2VxICE9PSB1bmRlZmluZWQgPyBvcHRpb25zLmNsb2Nrc2VxIDogX2Nsb2Nrc2VxO1xuXG4gIC8vIFVVSUQgdGltZXN0YW1wcyBhcmUgMTAwIG5hbm8tc2Vjb25kIHVuaXRzIHNpbmNlIHRoZSBHcmVnb3JpYW4gZXBvY2gsXG4gIC8vICgxNTgyLTEwLTE1IDAwOjAwKS4gIEpTTnVtYmVycyBhcmVuJ3QgcHJlY2lzZSBlbm91Z2ggZm9yIHRoaXMsIHNvXG4gIC8vIHRpbWUgaXMgaGFuZGxlZCBpbnRlcm5hbGx5IGFzICdtc2VjcycgKGludGVnZXIgbWlsbGlzZWNvbmRzKSBhbmQgJ25zZWNzJ1xuICAvLyAoMTAwLW5hbm9zZWNvbmRzIG9mZnNldCBmcm9tIG1zZWNzKSBzaW5jZSB1bml4IGVwb2NoLCAxOTcwLTAxLTAxIDAwOjAwLlxuICB2YXIgbXNlY3MgPSBvcHRpb25zLm1zZWNzICE9PSB1bmRlZmluZWQgPyBvcHRpb25zLm1zZWNzIDogbmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cbiAgLy8gUGVyIDQuMi4xLjIsIHVzZSBjb3VudCBvZiB1dWlkJ3MgZ2VuZXJhdGVkIGR1cmluZyB0aGUgY3VycmVudCBjbG9ja1xuICAvLyBjeWNsZSB0byBzaW11bGF0ZSBoaWdoZXIgcmVzb2x1dGlvbiBjbG9ja1xuICB2YXIgbnNlY3MgPSBvcHRpb25zLm5zZWNzICE9PSB1bmRlZmluZWQgPyBvcHRpb25zLm5zZWNzIDogX2xhc3ROU2VjcyArIDE7XG5cbiAgLy8gVGltZSBzaW5jZSBsYXN0IHV1aWQgY3JlYXRpb24gKGluIG1zZWNzKVxuICB2YXIgZHQgPSAobXNlY3MgLSBfbGFzdE1TZWNzKSArIChuc2VjcyAtIF9sYXN0TlNlY3MpLzEwMDAwO1xuXG4gIC8vIFBlciA0LjIuMS4yLCBCdW1wIGNsb2Nrc2VxIG9uIGNsb2NrIHJlZ3Jlc3Npb25cbiAgaWYgKGR0IDwgMCAmJiBvcHRpb25zLmNsb2Nrc2VxID09PSB1bmRlZmluZWQpIHtcbiAgICBjbG9ja3NlcSA9IGNsb2Nrc2VxICsgMSAmIDB4M2ZmZjtcbiAgfVxuXG4gIC8vIFJlc2V0IG5zZWNzIGlmIGNsb2NrIHJlZ3Jlc3NlcyAobmV3IGNsb2Nrc2VxKSBvciB3ZSd2ZSBtb3ZlZCBvbnRvIGEgbmV3XG4gIC8vIHRpbWUgaW50ZXJ2YWxcbiAgaWYgKChkdCA8IDAgfHwgbXNlY3MgPiBfbGFzdE1TZWNzKSAmJiBvcHRpb25zLm5zZWNzID09PSB1bmRlZmluZWQpIHtcbiAgICBuc2VjcyA9IDA7XG4gIH1cblxuICAvLyBQZXIgNC4yLjEuMiBUaHJvdyBlcnJvciBpZiB0b28gbWFueSB1dWlkcyBhcmUgcmVxdWVzdGVkXG4gIGlmIChuc2VjcyA+PSAxMDAwMCkge1xuICAgIHRocm93IG5ldyBFcnJvcigndXVpZC52MSgpOiBDYW5cXCd0IGNyZWF0ZSBtb3JlIHRoYW4gMTBNIHV1aWRzL3NlYycpO1xuICB9XG5cbiAgX2xhc3RNU2VjcyA9IG1zZWNzO1xuICBfbGFzdE5TZWNzID0gbnNlY3M7XG4gIF9jbG9ja3NlcSA9IGNsb2Nrc2VxO1xuXG4gIC8vIFBlciA0LjEuNCAtIENvbnZlcnQgZnJvbSB1bml4IGVwb2NoIHRvIEdyZWdvcmlhbiBlcG9jaFxuICBtc2VjcyArPSAxMjIxOTI5MjgwMDAwMDtcblxuICAvLyBgdGltZV9sb3dgXG4gIHZhciB0bCA9ICgobXNlY3MgJiAweGZmZmZmZmYpICogMTAwMDAgKyBuc2VjcykgJSAweDEwMDAwMDAwMDtcbiAgYltpKytdID0gdGwgPj4+IDI0ICYgMHhmZjtcbiAgYltpKytdID0gdGwgPj4+IDE2ICYgMHhmZjtcbiAgYltpKytdID0gdGwgPj4+IDggJiAweGZmO1xuICBiW2krK10gPSB0bCAmIDB4ZmY7XG5cbiAgLy8gYHRpbWVfbWlkYFxuICB2YXIgdG1oID0gKG1zZWNzIC8gMHgxMDAwMDAwMDAgKiAxMDAwMCkgJiAweGZmZmZmZmY7XG4gIGJbaSsrXSA9IHRtaCA+Pj4gOCAmIDB4ZmY7XG4gIGJbaSsrXSA9IHRtaCAmIDB4ZmY7XG5cbiAgLy8gYHRpbWVfaGlnaF9hbmRfdmVyc2lvbmBcbiAgYltpKytdID0gdG1oID4+PiAyNCAmIDB4ZiB8IDB4MTA7IC8vIGluY2x1ZGUgdmVyc2lvblxuICBiW2krK10gPSB0bWggPj4+IDE2ICYgMHhmZjtcblxuICAvLyBgY2xvY2tfc2VxX2hpX2FuZF9yZXNlcnZlZGAgKFBlciA0LjIuMiAtIGluY2x1ZGUgdmFyaWFudClcbiAgYltpKytdID0gY2xvY2tzZXEgPj4+IDggfCAweDgwO1xuXG4gIC8vIGBjbG9ja19zZXFfbG93YFxuICBiW2krK10gPSBjbG9ja3NlcSAmIDB4ZmY7XG5cbiAgLy8gYG5vZGVgXG4gIHZhciBub2RlID0gb3B0aW9ucy5ub2RlIHx8IF9ub2RlSWQ7XG4gIGZvciAodmFyIG4gPSAwOyBuIDwgNjsgbisrKSB7XG4gICAgYltpICsgbl0gPSBub2RlW25dO1xuICB9XG5cbiAgcmV0dXJuIGJ1ZiA/IGJ1ZiA6IHVucGFyc2UoYik7XG59XG5cbi8vICoqYHY0KClgIC0gR2VuZXJhdGUgcmFuZG9tIFVVSUQqKlxuXG4vLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2Jyb29mYS9ub2RlLXV1aWQgZm9yIEFQSSBkZXRhaWxzXG5mdW5jdGlvbiB2NChvcHRpb25zLCBidWYsIG9mZnNldCkge1xuICAvLyBEZXByZWNhdGVkIC0gJ2Zvcm1hdCcgYXJndW1lbnQsIGFzIHN1cHBvcnRlZCBpbiB2MS4yXG4gIHZhciBpID0gYnVmICYmIG9mZnNldCB8fCAwO1xuXG4gIGlmICh0eXBlb2Yob3B0aW9ucykgPT0gJ3N0cmluZycpIHtcbiAgICBidWYgPSBvcHRpb25zID09ICdiaW5hcnknID8gbmV3IEFycmF5KDE2KSA6IG51bGw7XG4gICAgb3B0aW9ucyA9IG51bGw7XG4gIH1cbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgdmFyIHJuZHMgPSBvcHRpb25zLnJhbmRvbSB8fCAob3B0aW9ucy5ybmcgfHwgX3JuZykoKTtcblxuICAvLyBQZXIgNC40LCBzZXQgYml0cyBmb3IgdmVyc2lvbiBhbmQgYGNsb2NrX3NlcV9oaV9hbmRfcmVzZXJ2ZWRgXG4gIHJuZHNbNl0gPSAocm5kc1s2XSAmIDB4MGYpIHwgMHg0MDtcbiAgcm5kc1s4XSA9IChybmRzWzhdICYgMHgzZikgfCAweDgwO1xuXG4gIC8vIENvcHkgYnl0ZXMgdG8gYnVmZmVyLCBpZiBwcm92aWRlZFxuICBpZiAoYnVmKSB7XG4gICAgZm9yICh2YXIgaWkgPSAwOyBpaSA8IDE2OyBpaSsrKSB7XG4gICAgICBidWZbaSArIGlpXSA9IHJuZHNbaWldO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBidWYgfHwgdW5wYXJzZShybmRzKTtcbn1cblxuLy8gRXhwb3J0IHB1YmxpYyBBUElcbnZhciB1dWlkID0gdjQ7XG51dWlkLnYxID0gdjE7XG51dWlkLnY0ID0gdjQ7XG51dWlkLnBhcnNlID0gcGFyc2U7XG51dWlkLnVucGFyc2UgPSB1bnBhcnNlO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHV1aWQ7XG4iLCIvLyBqYXZhc2NyaXB0LWFzdGFyIDAuNC4xXG4vLyBodHRwOi8vZ2l0aHViLmNvbS9iZ3JpbnMvamF2YXNjcmlwdC1hc3RhclxuLy8gRnJlZWx5IGRpc3RyaWJ1dGFibGUgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLlxuLy8gSW1wbGVtZW50cyB0aGUgYXN0YXIgc2VhcmNoIGFsZ29yaXRobSBpbiBqYXZhc2NyaXB0IHVzaW5nIGEgQmluYXJ5IEhlYXAuXG4vLyBJbmNsdWRlcyBCaW5hcnkgSGVhcCAod2l0aCBtb2RpZmljYXRpb25zKSBmcm9tIE1hcmlqbiBIYXZlcmJla2UuXG4vLyBodHRwOi8vZWxvcXVlbnRqYXZhc2NyaXB0Lm5ldC9hcHBlbmRpeDIuaHRtbFxuKGZ1bmN0aW9uKGRlZmluaXRpb24pIHtcbiAgLyogZ2xvYmFsIG1vZHVsZSwgZGVmaW5lICovXG4gIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBkZWZpbml0aW9uKCk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgZGVmaW5lKFtdLCBkZWZpbml0aW9uKTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgZXhwb3J0cyA9IGRlZmluaXRpb24oKTtcbiAgICB3aW5kb3cuYXN0YXIgPSBleHBvcnRzLmFzdGFyO1xuICAgIHdpbmRvdy5HcmFwaCA9IGV4cG9ydHMuR3JhcGg7XG4gIH1cbn0pKGZ1bmN0aW9uKCkge1xuXG5mdW5jdGlvbiBwYXRoVG8obm9kZSkge1xuICB2YXIgY3VyciA9IG5vZGU7XG4gIHZhciBwYXRoID0gW107XG4gIHdoaWxlIChjdXJyLnBhcmVudCkge1xuICAgIHBhdGgudW5zaGlmdChjdXJyKTtcbiAgICBjdXJyID0gY3Vyci5wYXJlbnQ7XG4gIH1cbiAgcmV0dXJuIHBhdGg7XG59XG5cbmZ1bmN0aW9uIGdldEhlYXAoKSB7XG4gIHJldHVybiBuZXcgQmluYXJ5SGVhcChmdW5jdGlvbihub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUuZjtcbiAgfSk7XG59XG5cbnZhciBhc3RhciA9IHtcbiAgLyoqXG4gICogUGVyZm9ybSBhbiBBKiBTZWFyY2ggb24gYSBncmFwaCBnaXZlbiBhIHN0YXJ0IGFuZCBlbmQgbm9kZS5cbiAgKiBAcGFyYW0ge0dyYXBofSBncmFwaFxuICAqIEBwYXJhbSB7R3JpZE5vZGV9IHN0YXJ0XG4gICogQHBhcmFtIHtHcmlkTm9kZX0gZW5kXG4gICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxuICAqIEBwYXJhbSB7Ym9vbH0gW29wdGlvbnMuY2xvc2VzdF0gU3BlY2lmaWVzIHdoZXRoZXIgdG8gcmV0dXJuIHRoZVxuICAgICAgICAgICAgIHBhdGggdG8gdGhlIGNsb3Nlc3Qgbm9kZSBpZiB0aGUgdGFyZ2V0IGlzIHVucmVhY2hhYmxlLlxuICAqIEBwYXJhbSB7RnVuY3Rpb259IFtvcHRpb25zLmhldXJpc3RpY10gSGV1cmlzdGljIGZ1bmN0aW9uIChzZWVcbiAgKiAgICAgICAgICBhc3Rhci5oZXVyaXN0aWNzKS5cbiAgKi9cbiAgc2VhcmNoOiBmdW5jdGlvbihncmFwaCwgc3RhcnQsIGVuZCwgb3B0aW9ucykge1xuICAgIGdyYXBoLmNsZWFuRGlydHkoKTtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICB2YXIgaGV1cmlzdGljID0gb3B0aW9ucy5oZXVyaXN0aWMgfHwgYXN0YXIuaGV1cmlzdGljcy5tYW5oYXR0YW47XG4gICAgdmFyIGNsb3Nlc3QgPSBvcHRpb25zLmNsb3Nlc3QgfHwgZmFsc2U7XG5cbiAgICB2YXIgb3BlbkhlYXAgPSBnZXRIZWFwKCk7XG4gICAgdmFyIGNsb3Nlc3ROb2RlID0gc3RhcnQ7IC8vIHNldCB0aGUgc3RhcnQgbm9kZSB0byBiZSB0aGUgY2xvc2VzdCBpZiByZXF1aXJlZFxuXG4gICAgc3RhcnQuaCA9IGhldXJpc3RpYyhzdGFydCwgZW5kKTtcbiAgICBncmFwaC5tYXJrRGlydHkoc3RhcnQpO1xuXG4gICAgb3BlbkhlYXAucHVzaChzdGFydCk7XG5cbiAgICB3aGlsZSAob3BlbkhlYXAuc2l6ZSgpID4gMCkge1xuXG4gICAgICAvLyBHcmFiIHRoZSBsb3dlc3QgZih4KSB0byBwcm9jZXNzIG5leHQuICBIZWFwIGtlZXBzIHRoaXMgc29ydGVkIGZvciB1cy5cbiAgICAgIHZhciBjdXJyZW50Tm9kZSA9IG9wZW5IZWFwLnBvcCgpO1xuXG4gICAgICAvLyBFbmQgY2FzZSAtLSByZXN1bHQgaGFzIGJlZW4gZm91bmQsIHJldHVybiB0aGUgdHJhY2VkIHBhdGguXG4gICAgICBpZiAoY3VycmVudE5vZGUgPT09IGVuZCkge1xuICAgICAgICByZXR1cm4gcGF0aFRvKGN1cnJlbnROb2RlKTtcbiAgICAgIH1cblxuICAgICAgLy8gTm9ybWFsIGNhc2UgLS0gbW92ZSBjdXJyZW50Tm9kZSBmcm9tIG9wZW4gdG8gY2xvc2VkLCBwcm9jZXNzIGVhY2ggb2YgaXRzIG5laWdoYm9ycy5cbiAgICAgIGN1cnJlbnROb2RlLmNsb3NlZCA9IHRydWU7XG5cbiAgICAgIC8vIEZpbmQgYWxsIG5laWdoYm9ycyBmb3IgdGhlIGN1cnJlbnQgbm9kZS5cbiAgICAgIHZhciBuZWlnaGJvcnMgPSBncmFwaC5uZWlnaGJvcnMoY3VycmVudE5vZGUpO1xuXG4gICAgICBmb3IgKHZhciBpID0gMCwgaWwgPSBuZWlnaGJvcnMubGVuZ3RoOyBpIDwgaWw7ICsraSkge1xuICAgICAgICB2YXIgbmVpZ2hib3IgPSBuZWlnaGJvcnNbaV07XG5cbiAgICAgICAgaWYgKG5laWdoYm9yLmNsb3NlZCB8fCBuZWlnaGJvci5pc1dhbGwoKSkge1xuICAgICAgICAgIC8vIE5vdCBhIHZhbGlkIG5vZGUgdG8gcHJvY2Vzcywgc2tpcCB0byBuZXh0IG5laWdoYm9yLlxuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhlIGcgc2NvcmUgaXMgdGhlIHNob3J0ZXN0IGRpc3RhbmNlIGZyb20gc3RhcnQgdG8gY3VycmVudCBub2RlLlxuICAgICAgICAvLyBXZSBuZWVkIHRvIGNoZWNrIGlmIHRoZSBwYXRoIHdlIGhhdmUgYXJyaXZlZCBhdCB0aGlzIG5laWdoYm9yIGlzIHRoZSBzaG9ydGVzdCBvbmUgd2UgaGF2ZSBzZWVuIHlldC5cbiAgICAgICAgdmFyIGdTY29yZSA9IGN1cnJlbnROb2RlLmcgKyBuZWlnaGJvci5nZXRDb3N0KGN1cnJlbnROb2RlKTtcbiAgICAgICAgdmFyIGJlZW5WaXNpdGVkID0gbmVpZ2hib3IudmlzaXRlZDtcblxuICAgICAgICBpZiAoIWJlZW5WaXNpdGVkIHx8IGdTY29yZSA8IG5laWdoYm9yLmcpIHtcblxuICAgICAgICAgIC8vIEZvdW5kIGFuIG9wdGltYWwgKHNvIGZhcikgcGF0aCB0byB0aGlzIG5vZGUuICBUYWtlIHNjb3JlIGZvciBub2RlIHRvIHNlZSBob3cgZ29vZCBpdCBpcy5cbiAgICAgICAgICBuZWlnaGJvci52aXNpdGVkID0gdHJ1ZTtcbiAgICAgICAgICBuZWlnaGJvci5wYXJlbnQgPSBjdXJyZW50Tm9kZTtcbiAgICAgICAgICBuZWlnaGJvci5oID0gbmVpZ2hib3IuaCB8fCBoZXVyaXN0aWMobmVpZ2hib3IsIGVuZCk7XG4gICAgICAgICAgbmVpZ2hib3IuZyA9IGdTY29yZTtcbiAgICAgICAgICBuZWlnaGJvci5mID0gbmVpZ2hib3IuZyArIG5laWdoYm9yLmg7XG4gICAgICAgICAgZ3JhcGgubWFya0RpcnR5KG5laWdoYm9yKTtcbiAgICAgICAgICBpZiAoY2xvc2VzdCkge1xuICAgICAgICAgICAgLy8gSWYgdGhlIG5laWdoYm91ciBpcyBjbG9zZXIgdGhhbiB0aGUgY3VycmVudCBjbG9zZXN0Tm9kZSBvciBpZiBpdCdzIGVxdWFsbHkgY2xvc2UgYnV0IGhhc1xuICAgICAgICAgICAgLy8gYSBjaGVhcGVyIHBhdGggdGhhbiB0aGUgY3VycmVudCBjbG9zZXN0IG5vZGUgdGhlbiBpdCBiZWNvbWVzIHRoZSBjbG9zZXN0IG5vZGVcbiAgICAgICAgICAgIGlmIChuZWlnaGJvci5oIDwgY2xvc2VzdE5vZGUuaCB8fCAobmVpZ2hib3IuaCA9PT0gY2xvc2VzdE5vZGUuaCAmJiBuZWlnaGJvci5nIDwgY2xvc2VzdE5vZGUuZykpIHtcbiAgICAgICAgICAgICAgY2xvc2VzdE5vZGUgPSBuZWlnaGJvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIWJlZW5WaXNpdGVkKSB7XG4gICAgICAgICAgICAvLyBQdXNoaW5nIHRvIGhlYXAgd2lsbCBwdXQgaXQgaW4gcHJvcGVyIHBsYWNlIGJhc2VkIG9uIHRoZSAnZicgdmFsdWUuXG4gICAgICAgICAgICBvcGVuSGVhcC5wdXNoKG5laWdoYm9yKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gQWxyZWFkeSBzZWVuIHRoZSBub2RlLCBidXQgc2luY2UgaXQgaGFzIGJlZW4gcmVzY29yZWQgd2UgbmVlZCB0byByZW9yZGVyIGl0IGluIHRoZSBoZWFwXG4gICAgICAgICAgICBvcGVuSGVhcC5yZXNjb3JlRWxlbWVudChuZWlnaGJvcik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNsb3Nlc3QpIHtcbiAgICAgIHJldHVybiBwYXRoVG8oY2xvc2VzdE5vZGUpO1xuICAgIH1cblxuICAgIC8vIE5vIHJlc3VsdCB3YXMgZm91bmQgLSBlbXB0eSBhcnJheSBzaWduaWZpZXMgZmFpbHVyZSB0byBmaW5kIHBhdGguXG4gICAgcmV0dXJuIFtdO1xuICB9LFxuICAvLyBTZWUgbGlzdCBvZiBoZXVyaXN0aWNzOiBodHRwOi8vdGhlb3J5LnN0YW5mb3JkLmVkdS9+YW1pdHAvR2FtZVByb2dyYW1taW5nL0hldXJpc3RpY3MuaHRtbFxuICBoZXVyaXN0aWNzOiB7XG4gICAgbWFuaGF0dGFuOiBmdW5jdGlvbihwb3MwLCBwb3MxKSB7XG4gICAgICB2YXIgZDEgPSBNYXRoLmFicyhwb3MxLnggLSBwb3MwLngpO1xuICAgICAgdmFyIGQyID0gTWF0aC5hYnMocG9zMS55IC0gcG9zMC55KTtcbiAgICAgIHJldHVybiBkMSArIGQyO1xuICAgIH0sXG4gICAgZGlhZ29uYWw6IGZ1bmN0aW9uKHBvczAsIHBvczEpIHtcbiAgICAgIHZhciBEID0gMTtcbiAgICAgIHZhciBEMiA9IE1hdGguc3FydCgyKTtcbiAgICAgIHZhciBkMSA9IE1hdGguYWJzKHBvczEueCAtIHBvczAueCk7XG4gICAgICB2YXIgZDIgPSBNYXRoLmFicyhwb3MxLnkgLSBwb3MwLnkpO1xuICAgICAgcmV0dXJuIChEICogKGQxICsgZDIpKSArICgoRDIgLSAoMiAqIEQpKSAqIE1hdGgubWluKGQxLCBkMikpO1xuICAgIH1cbiAgfSxcbiAgY2xlYW5Ob2RlOiBmdW5jdGlvbihub2RlKSB7XG4gICAgbm9kZS5mID0gMDtcbiAgICBub2RlLmcgPSAwO1xuICAgIG5vZGUuaCA9IDA7XG4gICAgbm9kZS52aXNpdGVkID0gZmFsc2U7XG4gICAgbm9kZS5jbG9zZWQgPSBmYWxzZTtcbiAgICBub2RlLnBhcmVudCA9IG51bGw7XG4gIH1cbn07XG5cbi8qKlxuICogQSBncmFwaCBtZW1vcnkgc3RydWN0dXJlXG4gKiBAcGFyYW0ge0FycmF5fSBncmlkSW4gMkQgYXJyYXkgb2YgaW5wdXQgd2VpZ2h0c1xuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxuICogQHBhcmFtIHtib29sfSBbb3B0aW9ucy5kaWFnb25hbF0gU3BlY2lmaWVzIHdoZXRoZXIgZGlhZ29uYWwgbW92ZXMgYXJlIGFsbG93ZWRcbiAqL1xuZnVuY3Rpb24gR3JhcGgoZ3JpZEluLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICB0aGlzLm5vZGVzID0gW107XG4gIHRoaXMuZGlhZ29uYWwgPSAhIW9wdGlvbnMuZGlhZ29uYWw7XG4gIHRoaXMuZ3JpZCA9IFtdO1xuICBmb3IgKHZhciB4ID0gMDsgeCA8IGdyaWRJbi5sZW5ndGg7IHgrKykge1xuICAgIHRoaXMuZ3JpZFt4XSA9IFtdO1xuXG4gICAgZm9yICh2YXIgeSA9IDAsIHJvdyA9IGdyaWRJblt4XTsgeSA8IHJvdy5sZW5ndGg7IHkrKykge1xuICAgICAgdmFyIG5vZGUgPSBuZXcgR3JpZE5vZGUoeCwgeSwgcm93W3ldKTtcbiAgICAgIHRoaXMuZ3JpZFt4XVt5XSA9IG5vZGU7XG4gICAgICB0aGlzLm5vZGVzLnB1c2gobm9kZSk7XG4gICAgfVxuICB9XG4gIHRoaXMuaW5pdCgpO1xufVxuXG5HcmFwaC5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmRpcnR5Tm9kZXMgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgYXN0YXIuY2xlYW5Ob2RlKHRoaXMubm9kZXNbaV0pO1xuICB9XG59O1xuXG5HcmFwaC5wcm90b3R5cGUuY2xlYW5EaXJ0eSA9IGZ1bmN0aW9uKCkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZGlydHlOb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgIGFzdGFyLmNsZWFuTm9kZSh0aGlzLmRpcnR5Tm9kZXNbaV0pO1xuICB9XG4gIHRoaXMuZGlydHlOb2RlcyA9IFtdO1xufTtcblxuR3JhcGgucHJvdG90eXBlLm1hcmtEaXJ0eSA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgdGhpcy5kaXJ0eU5vZGVzLnB1c2gobm9kZSk7XG59O1xuXG5HcmFwaC5wcm90b3R5cGUubmVpZ2hib3JzID0gZnVuY3Rpb24obm9kZSkge1xuICB2YXIgcmV0ID0gW107XG4gIHZhciB4ID0gbm9kZS54O1xuICB2YXIgeSA9IG5vZGUueTtcbiAgdmFyIGdyaWQgPSB0aGlzLmdyaWQ7XG5cbiAgLy8gV2VzdFxuICBpZiAoZ3JpZFt4IC0gMV0gJiYgZ3JpZFt4IC0gMV1beV0pIHtcbiAgICByZXQucHVzaChncmlkW3ggLSAxXVt5XSk7XG4gIH1cblxuICAvLyBFYXN0XG4gIGlmIChncmlkW3ggKyAxXSAmJiBncmlkW3ggKyAxXVt5XSkge1xuICAgIHJldC5wdXNoKGdyaWRbeCArIDFdW3ldKTtcbiAgfVxuXG4gIC8vIFNvdXRoXG4gIGlmIChncmlkW3hdICYmIGdyaWRbeF1beSAtIDFdKSB7XG4gICAgcmV0LnB1c2goZ3JpZFt4XVt5IC0gMV0pO1xuICB9XG5cbiAgLy8gTm9ydGhcbiAgaWYgKGdyaWRbeF0gJiYgZ3JpZFt4XVt5ICsgMV0pIHtcbiAgICByZXQucHVzaChncmlkW3hdW3kgKyAxXSk7XG4gIH1cblxuICBpZiAodGhpcy5kaWFnb25hbCkge1xuICAgIC8vIFNvdXRod2VzdFxuICAgIGlmIChncmlkW3ggLSAxXSAmJiBncmlkW3ggLSAxXVt5IC0gMV0pIHtcbiAgICAgIHJldC5wdXNoKGdyaWRbeCAtIDFdW3kgLSAxXSk7XG4gICAgfVxuXG4gICAgLy8gU291dGhlYXN0XG4gICAgaWYgKGdyaWRbeCArIDFdICYmIGdyaWRbeCArIDFdW3kgLSAxXSkge1xuICAgICAgcmV0LnB1c2goZ3JpZFt4ICsgMV1beSAtIDFdKTtcbiAgICB9XG5cbiAgICAvLyBOb3J0aHdlc3RcbiAgICBpZiAoZ3JpZFt4IC0gMV0gJiYgZ3JpZFt4IC0gMV1beSArIDFdKSB7XG4gICAgICByZXQucHVzaChncmlkW3ggLSAxXVt5ICsgMV0pO1xuICAgIH1cblxuICAgIC8vIE5vcnRoZWFzdFxuICAgIGlmIChncmlkW3ggKyAxXSAmJiBncmlkW3ggKyAxXVt5ICsgMV0pIHtcbiAgICAgIHJldC5wdXNoKGdyaWRbeCArIDFdW3kgKyAxXSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJldDtcbn07XG5cbkdyYXBoLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZ3JhcGhTdHJpbmcgPSBbXTtcbiAgdmFyIG5vZGVzID0gdGhpcy5ncmlkO1xuICBmb3IgKHZhciB4ID0gMDsgeCA8IG5vZGVzLmxlbmd0aDsgeCsrKSB7XG4gICAgdmFyIHJvd0RlYnVnID0gW107XG4gICAgdmFyIHJvdyA9IG5vZGVzW3hdO1xuICAgIGZvciAodmFyIHkgPSAwOyB5IDwgcm93Lmxlbmd0aDsgeSsrKSB7XG4gICAgICByb3dEZWJ1Zy5wdXNoKHJvd1t5XS53ZWlnaHQpO1xuICAgIH1cbiAgICBncmFwaFN0cmluZy5wdXNoKHJvd0RlYnVnLmpvaW4oXCIgXCIpKTtcbiAgfVxuICByZXR1cm4gZ3JhcGhTdHJpbmcuam9pbihcIlxcblwiKTtcbn07XG5cbmZ1bmN0aW9uIEdyaWROb2RlKHgsIHksIHdlaWdodCkge1xuICB0aGlzLnggPSB4O1xuICB0aGlzLnkgPSB5O1xuICB0aGlzLndlaWdodCA9IHdlaWdodDtcbn1cblxuR3JpZE5vZGUucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBcIltcIiArIHRoaXMueCArIFwiIFwiICsgdGhpcy55ICsgXCJdXCI7XG59O1xuXG5HcmlkTm9kZS5wcm90b3R5cGUuZ2V0Q29zdCA9IGZ1bmN0aW9uKGZyb21OZWlnaGJvcikge1xuICAvLyBUYWtlIGRpYWdvbmFsIHdlaWdodCBpbnRvIGNvbnNpZGVyYXRpb24uXG4gIGlmIChmcm9tTmVpZ2hib3IgJiYgZnJvbU5laWdoYm9yLnggIT0gdGhpcy54ICYmIGZyb21OZWlnaGJvci55ICE9IHRoaXMueSkge1xuICAgIHJldHVybiB0aGlzLndlaWdodCAqIDEuNDE0MjE7XG4gIH1cbiAgcmV0dXJuIHRoaXMud2VpZ2h0O1xufTtcblxuR3JpZE5vZGUucHJvdG90eXBlLmlzV2FsbCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy53ZWlnaHQgPT09IDA7XG59O1xuXG5mdW5jdGlvbiBCaW5hcnlIZWFwKHNjb3JlRnVuY3Rpb24pIHtcbiAgdGhpcy5jb250ZW50ID0gW107XG4gIHRoaXMuc2NvcmVGdW5jdGlvbiA9IHNjb3JlRnVuY3Rpb247XG59XG5cbkJpbmFyeUhlYXAucHJvdG90eXBlID0ge1xuICBwdXNoOiBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgLy8gQWRkIHRoZSBuZXcgZWxlbWVudCB0byB0aGUgZW5kIG9mIHRoZSBhcnJheS5cbiAgICB0aGlzLmNvbnRlbnQucHVzaChlbGVtZW50KTtcblxuICAgIC8vIEFsbG93IGl0IHRvIHNpbmsgZG93bi5cbiAgICB0aGlzLnNpbmtEb3duKHRoaXMuY29udGVudC5sZW5ndGggLSAxKTtcbiAgfSxcbiAgcG9wOiBmdW5jdGlvbigpIHtcbiAgICAvLyBTdG9yZSB0aGUgZmlyc3QgZWxlbWVudCBzbyB3ZSBjYW4gcmV0dXJuIGl0IGxhdGVyLlxuICAgIHZhciByZXN1bHQgPSB0aGlzLmNvbnRlbnRbMF07XG4gICAgLy8gR2V0IHRoZSBlbGVtZW50IGF0IHRoZSBlbmQgb2YgdGhlIGFycmF5LlxuICAgIHZhciBlbmQgPSB0aGlzLmNvbnRlbnQucG9wKCk7XG4gICAgLy8gSWYgdGhlcmUgYXJlIGFueSBlbGVtZW50cyBsZWZ0LCBwdXQgdGhlIGVuZCBlbGVtZW50IGF0IHRoZVxuICAgIC8vIHN0YXJ0LCBhbmQgbGV0IGl0IGJ1YmJsZSB1cC5cbiAgICBpZiAodGhpcy5jb250ZW50Lmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMuY29udGVudFswXSA9IGVuZDtcbiAgICAgIHRoaXMuYnViYmxlVXAoMCk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH0sXG4gIHJlbW92ZTogZnVuY3Rpb24obm9kZSkge1xuICAgIHZhciBpID0gdGhpcy5jb250ZW50LmluZGV4T2Yobm9kZSk7XG5cbiAgICAvLyBXaGVuIGl0IGlzIGZvdW5kLCB0aGUgcHJvY2VzcyBzZWVuIGluICdwb3AnIGlzIHJlcGVhdGVkXG4gICAgLy8gdG8gZmlsbCB1cCB0aGUgaG9sZS5cbiAgICB2YXIgZW5kID0gdGhpcy5jb250ZW50LnBvcCgpO1xuXG4gICAgaWYgKGkgIT09IHRoaXMuY29udGVudC5sZW5ndGggLSAxKSB7XG4gICAgICB0aGlzLmNvbnRlbnRbaV0gPSBlbmQ7XG5cbiAgICAgIGlmICh0aGlzLnNjb3JlRnVuY3Rpb24oZW5kKSA8IHRoaXMuc2NvcmVGdW5jdGlvbihub2RlKSkge1xuICAgICAgICB0aGlzLnNpbmtEb3duKGkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5idWJibGVVcChpKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHNpemU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmNvbnRlbnQubGVuZ3RoO1xuICB9LFxuICByZXNjb3JlRWxlbWVudDogZnVuY3Rpb24obm9kZSkge1xuICAgIHRoaXMuc2lua0Rvd24odGhpcy5jb250ZW50LmluZGV4T2Yobm9kZSkpO1xuICB9LFxuICBzaW5rRG93bjogZnVuY3Rpb24obikge1xuICAgIC8vIEZldGNoIHRoZSBlbGVtZW50IHRoYXQgaGFzIHRvIGJlIHN1bmsuXG4gICAgdmFyIGVsZW1lbnQgPSB0aGlzLmNvbnRlbnRbbl07XG5cbiAgICAvLyBXaGVuIGF0IDAsIGFuIGVsZW1lbnQgY2FuIG5vdCBzaW5rIGFueSBmdXJ0aGVyLlxuICAgIHdoaWxlIChuID4gMCkge1xuXG4gICAgICAvLyBDb21wdXRlIHRoZSBwYXJlbnQgZWxlbWVudCdzIGluZGV4LCBhbmQgZmV0Y2ggaXQuXG4gICAgICB2YXIgcGFyZW50TiA9ICgobiArIDEpID4+IDEpIC0gMTtcbiAgICAgIHZhciBwYXJlbnQgPSB0aGlzLmNvbnRlbnRbcGFyZW50Tl07XG4gICAgICAvLyBTd2FwIHRoZSBlbGVtZW50cyBpZiB0aGUgcGFyZW50IGlzIGdyZWF0ZXIuXG4gICAgICBpZiAodGhpcy5zY29yZUZ1bmN0aW9uKGVsZW1lbnQpIDwgdGhpcy5zY29yZUZ1bmN0aW9uKHBhcmVudCkpIHtcbiAgICAgICAgdGhpcy5jb250ZW50W3BhcmVudE5dID0gZWxlbWVudDtcbiAgICAgICAgdGhpcy5jb250ZW50W25dID0gcGFyZW50O1xuICAgICAgICAvLyBVcGRhdGUgJ24nIHRvIGNvbnRpbnVlIGF0IHRoZSBuZXcgcG9zaXRpb24uXG4gICAgICAgIG4gPSBwYXJlbnROO1xuICAgICAgfVxuICAgICAgLy8gRm91bmQgYSBwYXJlbnQgdGhhdCBpcyBsZXNzLCBubyBuZWVkIHRvIHNpbmsgYW55IGZ1cnRoZXIuXG4gICAgICBlbHNlIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9LFxuICBidWJibGVVcDogZnVuY3Rpb24obikge1xuICAgIC8vIExvb2sgdXAgdGhlIHRhcmdldCBlbGVtZW50IGFuZCBpdHMgc2NvcmUuXG4gICAgdmFyIGxlbmd0aCA9IHRoaXMuY29udGVudC5sZW5ndGg7XG4gICAgdmFyIGVsZW1lbnQgPSB0aGlzLmNvbnRlbnRbbl07XG4gICAgdmFyIGVsZW1TY29yZSA9IHRoaXMuc2NvcmVGdW5jdGlvbihlbGVtZW50KTtcblxuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAvLyBDb21wdXRlIHRoZSBpbmRpY2VzIG9mIHRoZSBjaGlsZCBlbGVtZW50cy5cbiAgICAgIHZhciBjaGlsZDJOID0gKG4gKyAxKSA8PCAxO1xuICAgICAgdmFyIGNoaWxkMU4gPSBjaGlsZDJOIC0gMTtcbiAgICAgIC8vIFRoaXMgaXMgdXNlZCB0byBzdG9yZSB0aGUgbmV3IHBvc2l0aW9uIG9mIHRoZSBlbGVtZW50LCBpZiBhbnkuXG4gICAgICB2YXIgc3dhcCA9IG51bGw7XG4gICAgICB2YXIgY2hpbGQxU2NvcmU7XG4gICAgICAvLyBJZiB0aGUgZmlyc3QgY2hpbGQgZXhpc3RzIChpcyBpbnNpZGUgdGhlIGFycmF5KS4uLlxuICAgICAgaWYgKGNoaWxkMU4gPCBsZW5ndGgpIHtcbiAgICAgICAgLy8gTG9vayBpdCB1cCBhbmQgY29tcHV0ZSBpdHMgc2NvcmUuXG4gICAgICAgIHZhciBjaGlsZDEgPSB0aGlzLmNvbnRlbnRbY2hpbGQxTl07XG4gICAgICAgIGNoaWxkMVNjb3JlID0gdGhpcy5zY29yZUZ1bmN0aW9uKGNoaWxkMSk7XG5cbiAgICAgICAgLy8gSWYgdGhlIHNjb3JlIGlzIGxlc3MgdGhhbiBvdXIgZWxlbWVudCdzLCB3ZSBuZWVkIHRvIHN3YXAuXG4gICAgICAgIGlmIChjaGlsZDFTY29yZSA8IGVsZW1TY29yZSkge1xuICAgICAgICAgIHN3YXAgPSBjaGlsZDFOO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIERvIHRoZSBzYW1lIGNoZWNrcyBmb3IgdGhlIG90aGVyIGNoaWxkLlxuICAgICAgaWYgKGNoaWxkMk4gPCBsZW5ndGgpIHtcbiAgICAgICAgdmFyIGNoaWxkMiA9IHRoaXMuY29udGVudFtjaGlsZDJOXTtcbiAgICAgICAgdmFyIGNoaWxkMlNjb3JlID0gdGhpcy5zY29yZUZ1bmN0aW9uKGNoaWxkMik7XG4gICAgICAgIGlmIChjaGlsZDJTY29yZSA8IChzd2FwID09PSBudWxsID8gZWxlbVNjb3JlIDogY2hpbGQxU2NvcmUpKSB7XG4gICAgICAgICAgc3dhcCA9IGNoaWxkMk47XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gSWYgdGhlIGVsZW1lbnQgbmVlZHMgdG8gYmUgbW92ZWQsIHN3YXAgaXQsIGFuZCBjb250aW51ZS5cbiAgICAgIGlmIChzd2FwICE9PSBudWxsKSB7XG4gICAgICAgIHRoaXMuY29udGVudFtuXSA9IHRoaXMuY29udGVudFtzd2FwXTtcbiAgICAgICAgdGhpcy5jb250ZW50W3N3YXBdID0gZWxlbWVudDtcbiAgICAgICAgbiA9IHN3YXA7XG4gICAgICB9XG4gICAgICAvLyBPdGhlcndpc2UsIHdlIGFyZSBkb25lLlxuICAgICAgZWxzZSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxucmV0dXJuIHtcbiAgYXN0YXI6IGFzdGFyLFxuICBHcmFwaDogR3JhcGhcbn07XG5cbn0pOyIsImZ1bmN0aW9uIEJ1aWxkaW5nVW5pdFN0YXR1cygpIHtcblx0cmV0dXJuIHtcblx0XHRzdGF0dXMgOiBCdWlsZGluZ1VuaXRTdGF0dXMuU1RBVFVTX0JVSUxESU5HLFxuXHRcdGRpc3QgOiBudWxsXG5cdH1cbn1cbkJ1aWxkaW5nVW5pdFN0YXR1cy5TVEFUVVNfQlVJTERJTkcgPSAxO1xuQnVpbGRpbmdVbml0U3RhdHVzLlNUQVRVU19OT1JNQUwgPSAyO1xuXG5mdW5jdGlvbiBCYXNlQnVpbGRpbmdVbml0KCkge1xufVxuXG5CYXNlQnVpbGRpbmdVbml0LnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oc3RhdHVzKSB7XG5cdC8v6KGo56S6XG59XG4iLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcbnZhciBNYXRoMkQgPSByZXF1aXJlKCcuL21hdGgyZCcpO1xudmFyIEJhc2VVbml0ID0gcmVxdWlyZSgnLi9CYXNlVW5pdCcpO1xudmFyIGxvZ2dlciA9IHJlcXVpcmUoJy4uL3V0aWwvbG9nJykubG9nZ2VyKCdCYXNlTW9iaWxlVW5pdCcpO1xudmFyIGFzdGFyID0gcmVxdWlyZSgnLi4vYWxnb3JpdGhtL2FzdGFyJyk7XG5cbmZ1bmN0aW9uIE1vYmlsZVVuaXRDb250ZXh0KCkge1xuXHRyZXR1cm4ge1xuXHRcdHN0YXR1cyA6IE1vYmlsZVVuaXRDb250ZXh0LlNUQVRVU19XQUlULFxuXHRcdGRlc3QgOiBudWxsLFxuXHRcdHRhcmdldCA6IG51bGwsXG5cdFx0Z2F0aGVyaW5nX2Ftb3VudCA6IDBcblx0fVxufVxuXG5Nb2JpbGVVbml0Q29udGV4dC5TVEFUVVMgPSB7XG5cdFdBSVRJTkc6IDEsXG5cdE1PVklOR19UT19QT1M6IDIsXG5cdE1PVklOR19UT19CVUlMRElORzogMyxcblx0TU9WSU5HX1RPX1JFU09VUkNFOiA0LFxuXHRNT1ZJTkdfVE9fVU5JVDogNSxcblx0UkVUVVJOSU5HOiA2LFxuXHRBVFRBQ0tJTkc6IDcsXG5cdEdBVEhFUklORzogOCxcblx0UkVQQUlSSU5HOiA5LFxuXHRCVUlMRElORzogMTBcbn1cblxuZnVuY3Rpb24gQmFzZU1vYmlsZVVuaXQoZ3JhcGhpYywgaW5mbywgbWFwLCBwbGF5ZXIpIHtcblx0dmFyIHRoYXQgPSB0aGlzO1xuXHRCYXNlVW5pdC5jYWxsKHRoaXMsIGdyYXBoaWMsIGluZm8sIG1hcCwgcGxheWVyKTtcblx0dGhpcy5jb250ZXh0ID0gbmV3IE1vYmlsZVVuaXRDb250ZXh0KCk7XG5cdHRoaXMuYXR0YWNrID0gNTtcblx0dGhpcy5yYW5nZSA9IDM7XG5cdHRoaXMuc3BlZWQgPSA0O1xuXHQvL+asoeOBruebrueahOWcsFxuXHR0aGlzLm5leHREZXN0aW5hdGlvbiA9IG51bGw7XG5cdHRoaXMucXVldWUgPSBbXTtcblx0dGhpcy5jb3VudCA9IDA7XG5cdHRoaXMuY291bnQyID0gMDtcbn1cblxudXRpbC5pbmhlcml0cyhCYXNlTW9iaWxlVW5pdCwgQmFzZVVuaXQpO1xuXG5CYXNlTW9iaWxlVW5pdC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKHN0YXR1cykge1xuXHQvL+ihqOekulxufVxuXG5CYXNlTW9iaWxlVW5pdC5wcm90b3R5cGUuZ2V0SW5mbyA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gXCI8ZGl2PlwiK3RoaXMuY29udGV4dC5nYXRoZXJpbmdfYW1vdW50K1wiPC9kaXY+XCJcbn1cblxuXG5CYXNlTW9iaWxlVW5pdC5wcm90b3R5cGUubWFpbiA9IGZ1bmN0aW9uKCkge1xuXHRzd2l0Y2godGhpcy5jb250ZXh0LnN0YXR1cykge1xuXHRcdGNhc2UgTW9iaWxlVW5pdENvbnRleHQuU1RBVFVTLldBSVRJTkc6XG5cdFx0XHR0aGlzLmV4ZWN1dGVfd2FpdGluZyhldmVudCk7XG5cdFx0XHRicmVhaztcblx0XHRjYXNlIE1vYmlsZVVuaXRDb250ZXh0LlNUQVRVUy5NT1ZJTkdfVE9fUE9TOlxuXHRcdFx0dGhpcy5leGVjdXRlX21vdmluZ190b19wb3MoZXZlbnQpO1xuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSBNb2JpbGVVbml0Q29udGV4dC5TVEFUVVMuTU9WSU5HX1RPX0JVSUxESU5HOlxuXHRcdFx0dGhpcy5leGVjdXRlX21vdmluZ190b19idWlsZGluZyhldmVudCk7XG5cdFx0XHRicmVhaztcblx0XHRjYXNlIE1vYmlsZVVuaXRDb250ZXh0LlNUQVRVUy5NT1ZJTkdfVE9fUkVTT1VSQ0U6XG5cdFx0XHR0aGlzLmV4ZWN1dGVfbW92aW5nX3RvX3Jlc291cmNlKGV2ZW50KTtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgTW9iaWxlVW5pdENvbnRleHQuU1RBVFVTLk1PVklOR19UT19VTklUOlxuXHRcdFx0dGhpcy5leGVjdXRlX21vdmluZ190b191bml0KGV2ZW50KTtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgTW9iaWxlVW5pdENvbnRleHQuU1RBVFVTLlJFVFVSTklORzpcblx0XHRcdHRoaXMuZXhlY3V0ZV9yZXR1cm5pbmcoZXZlbnQpO1xuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSBNb2JpbGVVbml0Q29udGV4dC5TVEFUVVMuQVRUQUNLSU5HOlxuXHRcdFx0dGhpcy5leGVjdXRlX2F0dGFja2luZyhldmVudCk7XG5cdFx0XHRicmVhaztcblx0XHRjYXNlIE1vYmlsZVVuaXRDb250ZXh0LlNUQVRVUy5HQVRIRVJJTkc6XG5cdFx0XHR0aGlzLmV4ZWN1dGVfZ2F0aGVyaW5nKGV2ZW50KTtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgTW9iaWxlVW5pdENvbnRleHQuU1RBVFVTLlJFUEFJUklORzpcblx0XHRcdHRoaXMuZXhlY3V0ZV9yZXBhaXJpbmcoZXZlbnQpO1xuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSBNb2JpbGVVbml0Q29udGV4dC5TVEFUVVMuYnVpbGRpbmc6XG5cdFx0XHRicmVhaztcblx0fVxufVxuXG5CYXNlTW9iaWxlVW5pdC5wcm90b3R5cGUuZXhlY3V0ZV93YWl0aW5nID0gZnVuY3Rpb24oZXZlbnQpIHtcbn1cblxuQmFzZU1vYmlsZVVuaXQucHJvdG90eXBlLmV4ZWN1dGVfbW92aW5nX3RvX3BvcyA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdHRoaXMubW92aW5nUHJvY2VzcygpO1xuXHRpZighdGhpcy5jb250ZXh0LmRpc3QpIHJldHVybjtcblx0dmFyIGRpcyA9IE1hdGgyRC5Qb2ludDJELmRpc3RhbmNlKCB0aGlzLnBvc2l0aW9uKCksIHRoaXMuY29udGV4dC5kaXN0ICk7XG5cdGlmKGRpcyA8IDgwKSB7XG5cdFx0dGhpcy5jb250ZXh0LnN0YXR1cyA9IE1vYmlsZVVuaXRDb250ZXh0LlNUQVRVUy5XQUlUSU5HO1xuXHR9XG59XG5cbkJhc2VNb2JpbGVVbml0LnByb3RvdHlwZS5leGVjdXRlX21vdmluZ190b19idWlsZGluZyA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdHRoaXMubW92aW5nUHJvY2VzcygpO1xuXHR2YXIgZGlzID0gTWF0aDJELlBvaW50MkQuZGlzdGFuY2UoIHRoaXMucG9zaXRpb24oKSwgdGhpcy5jb250ZXh0LnRhcmdldC5wb3NpdGlvbigpICk7XG5cdGlmKGRpcyA8IDgwKSB7XG5cdFx0dGhpcy5jb250ZXh0LnN0YXR1cyA9IE1vYmlsZVVuaXRDb250ZXh0LlNUQVRVUy5XQUlUSU5HO1xuXHR9XG59XG5cbkJhc2VNb2JpbGVVbml0LnByb3RvdHlwZS5leGVjdXRlX21vdmluZ190b19yZXNvdXJjZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdHRoaXMubW92aW5nUHJvY2VzcygpO1xuXHR2YXIgZGlzID0gTWF0aDJELlBvaW50MkQuZGlzdGFuY2UoIHRoaXMucG9zaXRpb24oKSwgdGhpcy5jb250ZXh0LnRhcmdldC5wb3NpdGlvbigpICk7XG5cdGlmKGRpcyA8IDgwKSB7XG5cdFx0dGhpcy5jb3VudCA9IDIwO1xuXHRcdHRoaXMuY29udGV4dC5zdGF0dXMgPSBNb2JpbGVVbml0Q29udGV4dC5TVEFUVVMuR0FUSEVSSU5HO1xuXHR9XG59XG5cbkJhc2VNb2JpbGVVbml0LnByb3RvdHlwZS5leGVjdXRlX21vdmluZ190b191bml0ID0gZnVuY3Rpb24oZXZlbnQpIHtcblxufVxuXG5CYXNlTW9iaWxlVW5pdC5wcm90b3R5cGUuZXhlY3V0ZV9yZXR1cm5pbmcgPSBmdW5jdGlvbihldmVudCkge1xuXHR0aGlzLm1vdmluZ1Byb2Nlc3MoKTtcblx0dmFyIGRpcyA9IE1hdGgyRC5Qb2ludDJELmRpc3RhbmNlKCB0aGlzLnBvc2l0aW9uKCksIHRoaXMuY29udGV4dC50YXJnZXQucG9zaXRpb24oKSApO1xuXHRpZihkaXMgPCA4MCkge1xuXHRcdGNvbnNvbGUubG9nKFwicmV0dXJuZWRcIik7XG5cdFx0dGhpcy5wbGF5ZXIuYWRkUmVzb3VyY2UoJ3RyZWUnLCB0aGlzLmNvbnRleHQuZ2F0aGVyaW5nX2Ftb3VudCk7XG5cdFx0dGhpcy5jb250ZXh0LmdhdGhlcmluZ19hbW91bnQgPSAwO1xuXHRcdHRoaXMuY291bnQgPSAyMDtcblx0XHR2YXIgbmF0dXJlID0gdGhpcy5tYXAudW5pdE1hbmFnZXIuZ2V0TmVhck5hdHVyZSgpO1xuXHRcdHRoaXMuY29udGV4dC50YXJnZXQgPSBuYXR1cmVbMF07XG5cdFx0dGhpcy5tb3ZlX3RvX3RhcmdldCh0aGlzLmNvbnRleHQudGFyZ2V0KTtcblx0fVxuXG59XG5cbkJhc2VNb2JpbGVVbml0LnByb3RvdHlwZS5leGVjdXRlX2F0dGFja2luZyA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdGlmKGV2ZW50Lm5hbWUgPT0gXCJ3aXRoaW4gcmFuZ2VcIikge1xuXHRcdHJldHVybiB7XG5cdFx0XHRzdGF0ZTogU1RBVEUuQVRUQUNLSU5HLFxuXHRcdFx0dGFyZ2V0OiBldmVudC5jb250ZXh0LnRhcmdldFxuXHRcdH1cblx0fWVsc2UgaWYoZXZlbnQubmFtZSA9PSBcIm5vdCB3aXRoaW4gcmFuZ2VcIikge1xuXHRcdHJldHVybiB7XG5cdFx0XHRzdGF0ZTogU1RBVEUuTU9WSU5HLFxuXHRcdFx0dGFyZ2V0OiBldmVudC5jb250ZXh0LnRhcmdldFxuXHRcdH1cblx0fVxufVxuXG5CYXNlTW9iaWxlVW5pdC5wcm90b3R5cGUuZXhlY3V0ZV9nYXRoZXJpbmcgPSBmdW5jdGlvbihldmVudCkge1xuXHR0aGlzLmNvdW50LS07XG5cdGlmKHRoaXMuY291bnQgPD0gMCkge1xuXHRcdHRoaXMuY291bnQgPSAyMDtcblx0XHR0aGlzLmNvbnRleHQuZ2F0aGVyaW5nX2Ftb3VudCArPSB0aGlzLmNvbnRleHQudGFyZ2V0LmRlY3JlYXNlKDEpO1xuXHRcdGlmKHRoaXMuY29udGV4dC5nYXRoZXJpbmdfYW1vdW50ID49IDEwKSB7XG5cdFx0XHR2YXIgYnVpbGRpbmdzID0gdGhpcy5tYXAudW5pdE1hbmFnZXIuZ2V0TmVhckJ1aWxkaW5nKCk7XG5cdFx0XHR0aGlzLnJldHVybl90b190YXJnZXQoIGJ1aWxkaW5nc1swXSApO1xuXHRcdH1cblx0fVxufVxuXG5CYXNlTW9iaWxlVW5pdC5wcm90b3R5cGUuZXhlY3V0ZV9yZXBhaXJpbmcgPSBmdW5jdGlvbihldmVudCkge1xuXG59XG5cbkJhc2VNb2JpbGVVbml0LnByb3RvdHlwZS5tb3ZpbmdQcm9jZXNzID0gZnVuY3Rpb24oKSB7XG5cdGlmKHRoaXMubmV4dERlc3RpbmF0aW9uKSB7XG5cdFx0Ly/mrKHjga7nm67nmoTlnLDjgYzjgYLjgovloLTlkIhcblx0XHR0aGlzLnBvcyA9IHRoaXMucG9zLmFkZCh0aGlzLnZlYyk7XG5cdFx0aWYodGhpcy5tYXAuaGl0KHRoaXMpKSB7XG5cdFx0XHR0aGlzLnBvcyA9IHRoaXMucG9zLnN1Yih0aGlzLnZlYyk7XG5cdFx0XHR0aGlzLmNvdW50Mi0tO1xuXHRcdFx0aWYodGhpcy5jb3VudDIgPD0gMCkge1xuXHRcdFx0XHRpZih0aGlzLmNvbnRleHQuc3RhdHVzID09IE1vYmlsZVVuaXRDb250ZXh0LlNUQVRVUy5NT1ZJTkdfVE9fUE9TKSB7XG5cdFx0XHRcdFx0dGhpcy5tb3ZlX3RvX3Bvcyh0aGlzLmNvbnRleHQuZGVzdCk7XG5cdFx0XHRcdH1lbHNle1xuXHRcdFx0XHRcdHRoaXMubW92ZV90b190YXJnZXQodGhpcy5jb250ZXh0LnRhcmdldCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9ZWxzZXtcblx0XHRcdHRoaXMuY291bnQtLTtcblx0XHR9XG5cdFx0dGhpcy5ncmFwaGljLnNldFBvcyh0aGlzLnBvcy5nZXRYKCksIHRoaXMucG9zLmdldFkoKSk7XG5cdFx0Ly9uZXh0RGVzdGluYXRpb27jgavjgaTjgYTjgZ/loLTlkIhcblx0XHRpZih0aGlzLmNvdW50IDw9IDApIHRoaXMubmV4dERlc3RpbmF0aW9uID0gbnVsbDtcblx0fWVsc2V7XG5cdFx0Ly/mrKHjga7nm67nmoTlnLDjgYzjgarjgYTloLTlkIhcblx0XHR0aGlzLmNvdW50ID0gMDtcblx0XHR0aGlzLm5leHREZXN0aW5hdGlvbiA9IHRoaXMucXVldWUuc2hpZnQoKTtcblx0XHRpZih0aGlzLm5leHREZXN0aW5hdGlvbikge1xuXHRcdFx0dmFyIHZlYyA9IHRoaXMubmV4dERlc3RpbmF0aW9uLnN1Yih0aGlzLnBvcyk7XG5cdFx0XHR0aGlzLmdyYXBoaWMucm90YXRlKCBNYXRoLmF0YW4odmVjLmdldFkoKSAvIHZlYy5nZXRYKCkpIC8gTWF0aC5QSSAqIDE4MCArIDkwICk7XG5cdFx0XHR0aGlzLnZlYyA9IHZlYy50aW1lcygxLzUwKTtcblx0XHRcdHRoaXMuY291bnQgPSA1MDtcblx0XHRcdHRoaXMuY291bnQyID0gMjAwO1xuXHRcdH1cblx0fVxufVxuXG5cbkJhc2VNb2JpbGVVbml0LnByb3RvdHlwZS5tb3ZlID0gZnVuY3Rpb24oZCkge1xuXHR0aGlzLnF1ZXVlLnB1c2goZCk7XG59XG5cbkJhc2VNb2JpbGVVbml0LnByb3RvdHlwZS5tb3ZlX3RvX3BvcyA9IGZ1bmN0aW9uKHBvcykge1xuXHR0aGlzLm1ha2Vfcm91dGUoIHBvcyApO1xuXHR0aGlzLmNvbnRleHQuc3RhdHVzID0gTW9iaWxlVW5pdENvbnRleHQuU1RBVFVTLk1PVklOR19UT19QT1M7XG5cdHRoaXMuY29udGV4dC5kZXN0ID0gbmV3IE1hdGgyRC5Qb2ludDJEKHBvcy54LCBwb3MueSk7XG59XG5cbkJhc2VNb2JpbGVVbml0LnByb3RvdHlwZS5tb3ZlX3RvX3RhcmdldCA9IGZ1bmN0aW9uKHVuaXQpIHtcblx0aWYodW5pdC5pbmZvLnR5cGUgPT0gXCJuYXR1cmVcIikge1xuXHRcdHRoaXMubWFrZV9yb3V0ZSggdW5pdC5wb3NpdGlvbigpICk7XG5cdFx0dGhpcy5jb250ZXh0LnN0YXR1cyA9IE1vYmlsZVVuaXRDb250ZXh0LlNUQVRVUy5NT1ZJTkdfVE9fUkVTT1VSQ0U7XG5cdFx0dGhpcy5jb250ZXh0LnRhcmdldCA9IHVuaXQ7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1lbHNlIGlmKHVuaXQuaW5mby50eXBlID09IFwiYnVpbGRpbmdcIikge1xuXHRcdHRoaXMubWFrZV9yb3V0ZSggdW5pdC5wb3NpdGlvbigpICk7XG5cdFx0dGhpcy5jb250ZXh0LnN0YXR1cyA9IE1vYmlsZVVuaXRDb250ZXh0LlNUQVRVUy5NT1ZJTkdfVE9fQlVJTERJTkc7XG5cdFx0dGhpcy5jb250ZXh0LnRhcmdldCA9IHVuaXQ7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1lbHNle1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxufVxuXG5CYXNlTW9iaWxlVW5pdC5wcm90b3R5cGUucmV0dXJuX3RvX3RhcmdldCA9IGZ1bmN0aW9uKHVuaXQpIHtcblx0aWYodW5pdC5pbmZvLnR5cGUgPT0gXCJidWlsZGluZ1wiKSB7XG5cdFx0dGhpcy5tYWtlX3JvdXRlKCB1bml0LnBvc2l0aW9uKCkgKTtcblx0XHR0aGlzLmNvbnRleHQuc3RhdHVzID0gTW9iaWxlVW5pdENvbnRleHQuU1RBVFVTLlJFVFVSTklORztcblx0XHR0aGlzLmNvbnRleHQudGFyZ2V0ID0gdW5pdDtcblx0fWVsc2V7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiaW52YWxpZCB1bml0IHR5cGVcIik7XG5cdH1cbn1cblxuQmFzZU1vYmlsZVVuaXQucHJvdG90eXBlLm1ha2Vfcm91dGUgPSBmdW5jdGlvbih4LCB5KSB7XG5cdGlmKHggaW5zdGFuY2VvZiBNYXRoMkQuUG9pbnQyRCkge1xuXHRcdHkgPSB4LmdldFkoKTtcblx0XHR4ID0geC5nZXRYKCk7XG5cdH1cblx0dmFyIHRoYXQgPSB0aGlzO1xuXG5cdC8vY2xlYXJcblx0dGhpcy5jb3VudC0tO1xuXHR0aGlzLnF1ZXVlID0gW107XG5cblx0dmFyIHN0YXJ0UG9zID0gdGhpcy5wb3NpdGlvblRpbGUoKTtcblx0dmFyIGVuZFBvcyA9IG5ldyBNYXRoMkQuUG9pbnQyRChNYXRoLmZsb29yKHggLyA1MCksIE1hdGguZmxvb3IoeSAvIDUwKSk7XG5cblx0dmFyIGNvbGxHcmFwaCA9IHRoaXMubWFwLmdldENvbGxHcmFwaCh7XG5cdFx0ZXhjZXB0IDogW3N0YXJ0UG9zLCBlbmRQb3NdXG5cdH0pO1xuXHR2YXIgZ3JhcGggPSBuZXcgYXN0YXIuR3JhcGgoY29sbEdyYXBoKTtcblx0bG9nZ2VyKCd3YWxrRnJvbScsIHN0YXJ0UG9zLmdldFgoKSwgc3RhcnRQb3MuZ2V0WSgpKTtcblx0bG9nZ2VyKCd3YWxrVG8nLCBlbmRQb3MuZ2V0WCgpLCBlbmRQb3MuZ2V0WSgpKTtcbiAgICB2YXIgc3RhcnQgPSBncmFwaC5ncmlkW3N0YXJ0UG9zLmdldFgoKV1bc3RhcnRQb3MuZ2V0WSgpXTtcbiAgICB2YXIgZW5kID0gZ3JhcGguZ3JpZFsgZW5kUG9zLmdldFgoKSBdWyBlbmRQb3MuZ2V0WSgpIF07XG4gICAgdmFyIHJlc3VsdCA9IGFzdGFyLmFzdGFyLnNlYXJjaChncmFwaCwgc3RhcnQsIGVuZCk7XG5cbiAgICByZXN1bHQubWFwKGZ1bmN0aW9uKGdyaWROb2RlKSB7XG5cdFx0dGhhdC5xdWV1ZS5wdXNoKG5ldyBNYXRoMkQuUG9pbnQyRChncmlkTm9kZS54KjUwLCBncmlkTm9kZS55KjUwKSk7XG4gICAgfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQmFzZU1vYmlsZVVuaXQ7IiwidmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG52YXIgQmFzZVVuaXQgPSByZXF1aXJlKCcuL0Jhc2VVbml0Jyk7XG5cbmZ1bmN0aW9uIE5hdHVyZVVuaXRTdGF0dXMoKSB7XG5cdHJldHVybiB7XG5cdFx0c3RhdHVzIDogTmF0dXJlVW5pdFN0YXR1cy5TVEFUVVNfQlVJTERJTkcsXG5cdFx0ZGlzdCA6IG51bGxcblx0fVxufVxuTmF0dXJlVW5pdFN0YXR1cy5TVEFUVVNfQlVJTERJTkcgPSAxO1xuTmF0dXJlVW5pdFN0YXR1cy5TVEFUVVNfTk9STUFMID0gMjtcblxuZnVuY3Rpb24gQmFzZU5hdHVyZVVuaXQoZ3JhcGhpYywgaW5mbywgbWFwKSB7XG5cdEJhc2VVbml0LmNhbGwodGhpcywgZ3JhcGhpYywgaW5mbywgbWFwKTtcblx0dGhpcy5hbW91bnQgPSAxMDA7XG59XG5cbnV0aWwuaW5oZXJpdHMoQmFzZU5hdHVyZVVuaXQsIEJhc2VVbml0KTtcblxuQmFzZU5hdHVyZVVuaXQucHJvdG90eXBlLmRlY3JlYXNlID0gZnVuY3Rpb24oYW1vdW50KSB7XG5cdHRoaXMuYW1vdW50IC09IGFtb3VudDtcblx0aWYodGhpcy5hbW91bnQgPCAwKSB7XG5cdFx0dmFyIGxlZnQgPSAtMSAqIHRoaXMuYW1vdW50O1xuXHRcdHRoaXMuYW1vdW50ID0gMDtcblx0XHR0aGlzLm1hcC51bml0TWFuYWdlci5yZW1vdmUodGhpcy5nZXRJZCgpKTtcblx0XHRjb25zb2xlLmxvZyhsZWZ0KTtcblx0XHRyZXR1cm4gYW1vdW50IC0gbGVmdDtcblx0fWVsc2V7XG5cdFx0cmV0dXJuIGFtb3VudDtcblx0fVxufVxuXG5CYXNlTmF0dXJlVW5pdC5wcm90b3R5cGUubWFpbiA9IGZ1bmN0aW9uKCkge1xufVxuXG5CYXNlTmF0dXJlVW5pdC5wcm90b3R5cGUuZ2V0SW5mbyA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gXCI8ZGl2PlwiICsgdGhpcy5hbW91bnQgKyBcIjwvZGl2PlwiXG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBCYXNlTmF0dXJlVW5pdDtcbiIsInZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudGVtaXR0ZXIyJykuRXZlbnRFbWl0dGVyMjtcbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xudmFyIHV1aWQgPSByZXF1aXJlKCd1dWlkJyk7XG52YXIgTWF0aDJEID0gcmVxdWlyZSgnLi9tYXRoMmQnKTtcblxuZnVuY3Rpb24gQmFzZVVuaXQoZ3JhcGhpYywgaW5mbywgbWFwLCBwbGF5ZXIpIHtcblx0dmFyIHRoYXQgPSB0aGlzO1xuXHRFdmVudEVtaXR0ZXIuY2FsbCh0aGlzKTtcblx0dGhhdC5ncmFwaGljID0gZ3JhcGhpYztcblx0dGhpcy5pbmZvID0gaW5mbztcblx0dGhpcy5pZCA9IHV1aWQoKTtcblx0dGhpcy5tYXAgPSBtYXA7XG5cdHRoaXMucGxheWVyID0gcGxheWVyO1xuXHR0aGlzLnBvcyA9IG5ldyBNYXRoMkQuUG9pbnQyRCgwLCAwKTtcblx0aWYoaW5mby5zaXplIGluc3RhbmNlb2YgQXJyYXkpIHtcblx0XHR0aGF0LmdyYXBoaWMuc2V0U2l6ZShpbmZvLnNpemVbMF0gKiA1MCwgaW5mby5zaXplWzFdICogNTApO1xuXHR9ZWxzZXtcblx0XHR0aGF0LmdyYXBoaWMuc2V0U2l6ZShpbmZvLnNpemUgKiA1MCwgaW5mby5zaXplICogNTApO1xuXHR9XG5cdHRoaXMuZ3JhcGhpYy5jbGljayhmdW5jdGlvbihlKSB7XG5cdFx0Y29uc29sZS5sb2coXCJtb3VzZXVwXCIsIGUuYnV0dG9uKTtcblx0XHR0aGF0LmVtaXQoJ2NsaWNrJywgZSk7XG5cdH0pO1xufVxuXG51dGlsLmluaGVyaXRzKEJhc2VVbml0LCBFdmVudEVtaXR0ZXIpO1xuXG5CYXNlVW5pdC5wcm90b3R5cGUuZ2V0SWQgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHRoaXMuaWQ7XG59XG5cbkJhc2VVbml0LnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHRoaXMuZ3JhcGhpYy5yZW1vdmUoKTtcbn1cblxuQmFzZVVuaXQucHJvdG90eXBlLmNvbGxCb3VuZCA9IGZ1bmN0aW9uKCkge1xuXHR2YXIgb2Zmc2V0ID0gNTtcblx0dmFyIGluZm8gPSB0aGlzLmluZm87XG5cdGlmKGluZm8udHlwZSA9PSAndHJhaW5hYmxlJykgb2Zmc2V0ID0gMTU7XG5cdGlmKGluZm8uc2l6ZS5sZW5ndGggPT0gMikge1xuXHRcdHZhciB3ID0gaW5mby5zaXplWzBdICogNTA7XG5cdFx0dmFyIGggPSBpbmZvLnNpemVbMV0gKiA1MDtcblx0fWVsc2V7XG5cdFx0dmFyIHcgPSBpbmZvLnNpemUgKiA1MDtcblx0XHR2YXIgaCA9IGluZm8uc2l6ZSAqIDUwO1xuXHR9XG5cdHJldHVybiB7XG5cdFx0eCA6IHRoaXMucG9zLmdldFgoKStvZmZzZXQsXG5cdFx0eSA6IHRoaXMucG9zLmdldFkoKStvZmZzZXQsXG5cdFx0dyA6IHcgLSBvZmZzZXQqMixcblx0XHRoIDogaCAtIG9mZnNldCoyXG5cdH1cbn1cblxuQmFzZVVuaXQucHJvdG90eXBlLnBvc2l0aW9uID0gZnVuY3Rpb24oeCwgeSkge1xuXHRpZih4ID09PSB1bmRlZmluZWQgJiYgeSA9PSB1bmRlZmluZWQpIHJldHVybiB0aGlzLnBvcztcblx0dGhpcy5wb3Muc2V0TG9jYXRpb24oeCwgeSk7XG5cdHRoaXMuZ3JhcGhpYy5zZXRQb3MoeCwgeSk7XG59XG5cbkJhc2VVbml0LnByb3RvdHlwZS5wb3NpdGlvblRpbGUgPSBmdW5jdGlvbih4LCB5KSB7XG5cdGlmKHggPT09IHVuZGVmaW5lZCAmJiB5ID09IHVuZGVmaW5lZCkgcmV0dXJuIG5ldyBNYXRoMkQuUG9pbnQyRCggTWF0aC5mbG9vcih0aGlzLnBvcy5nZXRYKCkgLyA1MCksIE1hdGguZmxvb3IodGhpcy5wb3MuZ2V0WSgpIC8gNTApKTtcblx0eCAqPSA1MDtcblx0eSAqPSA1MDtcblx0dGhpcy5wb3Muc2V0TG9jYXRpb24oeCwgeSk7XG5cdHRoaXMuZ3JhcGhpYy5zZXRQb3MoeCwgeSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQmFzZVVuaXQ7IiwidmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50ZW1pdHRlcjInKS5FdmVudEVtaXR0ZXIyO1xudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG52YXIgVW5pdEdyYXBoaWMgPSByZXF1aXJlKCcuLi9ncmFwaGljL3VuaXRHcmFwaGljJyk7XG52YXIgQmFzZU1vYmlsZVVuaXQgPSByZXF1aXJlKCcuL0Jhc2VNb2JpbGVVbml0Jyk7XG52YXIgQmFzZU5hdHVyZVVuaXQgPSByZXF1aXJlKCcuL0Jhc2VOYXR1cmVVbml0Jyk7XG52YXIgQmFzZUJ1aWxkaW5nVW5pdCA9IHJlcXVpcmUoJy4vQmFzZUJ1aWxkaW5nVW5pdCcpO1xuXG5mdW5jdGlvbiBVbml0TWFuYWdlcihzbmFwKSB7XG5cdEV2ZW50RW1pdHRlci5jYWxsKHRoaXMpO1xuXHR0aGlzLm1ldGFVbml0cyA9IHt9O1xuXHR0aGlzLnVuaXRzID0ge307XG5cdHRoaXMuc25hcCA9IHNuYXA7XG5cdHRoaXMuZ3JvdXAgPSBzbmFwLmcoKTtcblx0dGhpcy5zZWxlY3RlZCA9IG51bGw7XG5cdHRoaXMuY3Vyc29ycyA9IFtdO1xufVxuXG51dGlsLmluaGVyaXRzKFVuaXRNYW5hZ2VyLCBFdmVudEVtaXR0ZXIpO1xuXG5Vbml0TWFuYWdlci5wcm90b3R5cGUuc2V0TWFwID0gZnVuY3Rpb24obWFwKSB7XG5cdHRoaXMubWFwID0gbWFwO1xufVxuXG5Vbml0TWFuYWdlci5wcm90b3R5cGUubG9hZCA9IGZ1bmN0aW9uKHVuaXRzKSB7XG5cdHZhciB0aGF0ID0gdGhpcztcblx0dW5pdHMubWFwKGZ1bmN0aW9uKHVuaXQpIHtcblx0XHR0aGF0Lm1ldGFVbml0c1t1bml0LmlkXSA9IHVuaXQ7XG5cdH0pO1xufVxuXG5Vbml0TWFuYWdlci5wcm90b3R5cGUubWFpbiA9IGZ1bmN0aW9uKCkge1xuXHR2YXIgdGhhdCA9IHRoaXM7XG5cdE9iamVjdC5rZXlzKHRoaXMudW5pdHMpLm1hcChmdW5jdGlvbihrKSB7XG5cdFx0aWYodGhhdC51bml0c1trXSkgdGhhdC51bml0c1trXS5tYWluKCk7XG5cdH0pO1xufVxuXG5Vbml0TWFuYWdlci5wcm90b3R5cGUuY3JlYXRlID0gZnVuY3Rpb24obWV0YVVuaXRJZCwgcGxheWVyKSB7XG5cdHZhciB0aGF0ID0gdGhpcztcblx0dmFyIG1ldGFVbml0ID0gdGhpcy5tZXRhVW5pdHNbbWV0YVVuaXRJZF07XG5cdHZhciB1ZyA9IG5ldyBVbml0R3JhcGhpYyh0aGlzLnNuYXAsIHRoaXMuZ3JvdXAsIHtcblx0XHRwYXRoIDogJ2ltYWdlcy8nICsgbWV0YVVuaXQuZ3JhcGhpYy5wYXRoLFxuXHRcdHdpZHRoIDogbWV0YVVuaXQuZ3JhcGhpYy53aWR0aCxcblx0XHRoZWlnaHQgOiBtZXRhVW5pdC5ncmFwaGljLmhlaWdodCxcblx0fSk7XG5cdGlmKG1ldGFVbml0LnVuaXRpbmZvLnR5cGUgPT0gJ25hdHVyZScpIHtcblx0XHR2YXIgcGVyc29uID0gbmV3IEJhc2VOYXR1cmVVbml0KHVnLCBtZXRhVW5pdC51bml0aW5mbywgdGhpcy5tYXAsIHBsYXllcik7XG5cdC8vfWVsc2UgaWYobWV0YVVuaXQudW5pdGluZm8udHlwZSA9PSAnYnVpbGRpbmcnKSB7XG5cdC8vXHR2YXIgcGVyc29uID0gbmV3IEJhc2VCdWlsZGluZ1VuaXQodWcsIG1ldGFVbml0LnVuaXRpbmZvLCB0aGlzLm1hcCwgcGxheWVyKTtcblx0fWVsc2V7XG5cdFx0dmFyIHBlcnNvbiA9IG5ldyBCYXNlTW9iaWxlVW5pdCh1ZywgbWV0YVVuaXQudW5pdGluZm8sIHRoaXMubWFwLCBwbGF5ZXIpO1xuXHR9XG5cdHBlcnNvbi5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0dGhhdC5jbGlja0hhbmRsZXIoZSwgZnVuY3Rpb24oKSB7XG5cdFx0XHR0aGF0LnNlbGVjdChbcGVyc29uXSk7XG5cdFx0XHR0aGF0LmVtaXQoJ2NsaWNrJywge3VuaXQgOiBwZXJzb24sIGV2ZW50IDogZX0pO1xuXHRcdH0sIGZ1bmN0aW9uKCkge1xuXHRcdFx0dGhhdC5lbWl0KCd0YXJnZXQnLCB7dW5pdCA6IHBlcnNvbiwgZXZlbnQgOiBlfSk7XG5cdFx0fSk7XG5cdH0pO1xuXHR0aGlzLnVuaXRzW3BlcnNvbi5pZF0gPSBwZXJzb247XG5cdHJldHVybiBwZXJzb247XG59XG5cblVuaXRNYW5hZ2VyLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbihpZCkge1xuXHRpZih0aGlzLnVuaXRzW2lkXSkge1xuXHRcdHRoaXMudW5pdHNbaWRdLnJlbW92ZSgpO1xuXHRcdGRlbGV0ZSB0aGlzLnVuaXRzW2lkXTtcblx0fVxufVxuXG5Vbml0TWFuYWdlci5wcm90b3R5cGUuZ2V0VW5pdHMgPSBmdW5jdGlvbigpIHtcblx0dmFyIHRoYXQgPSB0aGlzO1xuXHRyZXR1cm4gT2JqZWN0LmtleXModGhpcy51bml0cykubWFwKGZ1bmN0aW9uKGspIHtcblx0XHRyZXR1cm4gdGhhdC51bml0c1trXTtcblx0fSk7XHRcbn1cblxuVW5pdE1hbmFnZXIucHJvdG90eXBlLmdldFRyYWluYWJsZVVuaXRzID0gZnVuY3Rpb24oKSB7XG5cdHZhciB0aGF0ID0gdGhpcztcblx0cmV0dXJuIE9iamVjdC5rZXlzKHRoaXMudW5pdHMpLm1hcChmdW5jdGlvbihrKSB7XG5cdFx0cmV0dXJuIHRoYXQudW5pdHNba107XG5cdH0pLmZpbHRlcihmdW5jdGlvbih1bml0KSB7XG5cdFx0cmV0dXJuIHVuaXQuaW5mby50eXBlID09ICd0cmFpbmFibGUnO1xuXHR9KTtcbn1cblxuVW5pdE1hbmFnZXIucHJvdG90eXBlLmdldENvbGxVbml0cyA9IGZ1bmN0aW9uKCkge1xuXHR2YXIgdGhhdCA9IHRoaXM7XG5cdHJldHVybiBPYmplY3Qua2V5cyh0aGlzLnVuaXRzKS5tYXAoZnVuY3Rpb24oaykge1xuXHRcdHJldHVybiB0aGF0LnVuaXRzW2tdO1xuXHR9KS8qLmZpbHRlcihmdW5jdGlvbih1bml0KSB7XG5cdFx0cmV0dXJuIHVuaXQuaW5mby50eXBlID09ICdidWlsZGluZycgfHwgdW5pdC5pbmZvLnR5cGUgPT0gJ25hdHVyZSc7XG5cdH0pOyovXG59XG5cblVuaXRNYW5hZ2VyLnByb3RvdHlwZS5nZXROZWFyTmF0dXJlID0gZnVuY3Rpb24oKSB7XG5cdHZhciB0aGF0ID0gdGhpcztcblx0cmV0dXJuIE9iamVjdC5rZXlzKHRoaXMudW5pdHMpLm1hcChmdW5jdGlvbihrKSB7XG5cdFx0cmV0dXJuIHRoYXQudW5pdHNba107XG5cdH0pLmZpbHRlcihmdW5jdGlvbih1bml0KSB7XG5cdFx0cmV0dXJuIHVuaXQuaW5mby50eXBlID09ICduYXR1cmUnO1xuXHR9KTtcbn1cblxuVW5pdE1hbmFnZXIucHJvdG90eXBlLmdldE5lYXJCdWlsZGluZyA9IGZ1bmN0aW9uKCkge1xuXHR2YXIgdGhhdCA9IHRoaXM7XG5cdHJldHVybiBPYmplY3Qua2V5cyh0aGlzLnVuaXRzKS5tYXAoZnVuY3Rpb24oaykge1xuXHRcdHJldHVybiB0aGF0LnVuaXRzW2tdO1xuXHR9KS5maWx0ZXIoZnVuY3Rpb24odW5pdCkge1xuXHRcdHJldHVybiB1bml0LmluZm8udHlwZSA9PSAnYnVpbGRpbmcnO1xuXHR9KTtcbn1cblxuVW5pdE1hbmFnZXIucHJvdG90eXBlLnNlbGVjdCA9IGZ1bmN0aW9uKHRhcmdldCkge1xuXHR2YXIgdGhhdCA9IHRoaXM7XG5cdHRoaXMuc2VsZWN0ZWQgPSB0YXJnZXQ7XG5cdHRoaXMuY3Vyc29ycy5mb3JFYWNoKGZ1bmN0aW9uKGMpIHtcblx0XHRjLnJlbW92ZSgpO1xuXHR9KTtcblx0aWYodGhpcy5zZWxlY3RlZCkge1xuXHRcdHRoaXMuY3Vyc29ycyA9IHRoaXMuc2VsZWN0ZWQubWFwKGZ1bmN0aW9uKHUpIHtcblx0XHRcdHZhciBwb3MgPSB1LnBvc2l0aW9uKCk7XG5cdFx0XHR2YXIgYyA9IHRoYXQuc25hcC5jaXJjbGUoNDAsIDQwLCA1MCk7XG5cdFx0XHRjLmF0dHIoe1xuXHRcdFx0XHRmaWxsOiBcIm5vbmVcIixcblx0XHRcdFx0c3Ryb2tlOiBcIiMxMDEwZjBcIixcblx0XHRcdFx0c3Ryb2tlV2lkdGg6IDNcblx0XHRcdH0pO1xuXHRcdFx0dS5ncmFwaGljLmdyb3VwLmFwcGVuZChjKTtcblx0XHRcdHJldHVybiBjO1xuXHRcdH0pO1xuXHR9XG59XG5cblVuaXRNYW5hZ2VyLnByb3RvdHlwZS5zZXRDbGlja0hhbmRsZXIgPSBmdW5jdGlvbihjbGlja0hhbmRsZXIpIHtcblx0dGhpcy5jbGlja0hhbmRsZXIgPSBjbGlja0hhbmRsZXI7XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBVbml0TWFuYWdlcjsiLCJ2YXIgU25hcCA9IHJlcXVpcmUoJy4uLy4uL3RoaXJkcGFydHkvc25hcC5zdmcnKTtcbnZhciBVbml0TWFuYWdlciA9IHJlcXVpcmUoJy4vVW5pdE1hbmFnZXInKTtcbnZhciB1bml0SW5mbyA9IHJlcXVpcmUoJy4uL3VuaXQnKTtcbnZhciBDb250cm9sUGFuZWwgPSByZXF1aXJlKCcuLi91aS9jb250cm9sUGFuZWwnKTtcbnZhciBNZW51ID0gcmVxdWlyZSgnLi4vdWkvbWVudScpO1xudmFyIFByZWxvYWRlciA9IHJlcXVpcmUoJy4uL3VpL3ByZWxvYWRlcicpO1xudmFyIE1hcCA9IHJlcXVpcmUoJy4vbWFwJyk7XG52YXIgUGxheWVyID0gcmVxdWlyZSgnLi9wbGF5ZXInKTtcbnZhciBQbGF0Zm9ybSA9IHJlcXVpcmUoJy4uL3BsYXRmb3JtJyk7XG5cbmZ1bmN0aW9uIEdhbWUocmVxdWVzdEFuaW1hdGlvbkZyYW1lKSB7XG5cdHRoaXMuc3RhcnQocmVxdWVzdEFuaW1hdGlvbkZyYW1lKTtcbn1cblxuR2FtZS5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbihyZXF1ZXN0QW5pbWF0aW9uRnJhbWUpIHtcblx0dmFyIHBsYXRmb3JtID0gUGxhdGZvcm0oKTtcblx0dmFyIG1haW5Eb20gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFpbicpO1xuXHR2YXIgY29udHJvbFBhbmVsID0gbmV3IENvbnRyb2xQYW5lbChtYWluRG9tKTtcblx0dmFyIG1lbnUgPSBuZXcgTWVudShtYWluRG9tKTtcblx0dmFyIHByZWxvYWRlciA9IG5ldyBQcmVsb2FkZXIobWFpbkRvbSk7XG5cdHByZWxvYWRlci5zaG93KCk7XG5cdHZhciBzdmdXcmFwcGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cdHZhciBzdmcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBcInN2Z1wiKTtcblx0dmFyIHdpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XG5cdHZhciBoZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gICAgc3ZnLnNldEF0dHJpYnV0ZU5TKG51bGwsICd3aWR0aCcsIHdpZHRoKTtcbiAgICBzdmcuc2V0QXR0cmlidXRlTlMobnVsbCwgJ2hlaWdodCcsIGhlaWdodCk7XG4gICAgc3ZnLnNldEF0dHJpYnV0ZU5TKG51bGwsICd2aWV3Qm94JywgJzAgMCAnK3dpZHRoKycgJytoZWlnaHQpO1xuICAgIHN2Z1dyYXBwZXIuYXBwZW5kQ2hpbGQoc3ZnKTtcblx0bWFpbkRvbS5hcHBlbmRDaGlsZChzdmdXcmFwcGVyKTtcblxuXHR2YXIgc25hcCA9IFNuYXAoc3ZnKTtcblx0dmFyIG1hcCA9IG5ldyBNYXAoc25hcCk7XG5cdHZhciB1bml0TWFuYWdlciA9IG5ldyBVbml0TWFuYWdlcihzbmFwKTtcblx0dW5pdE1hbmFnZXIubG9hZCh1bml0SW5mbyk7XG5cdC8vbWFwLmdlbmVyYXRlKDApO1xuXG5cdG1hcC5zZXRVbml0TWFuYWdlcih1bml0TWFuYWdlcik7XG5cdHZhciBwbGF5ZXIxID0gbmV3IFBsYXllcih7dHlwZTogUGxheWVyLlRZUEVfSFVNQU59KTtcblx0dmFyIHBsYXllcjIgPSBuZXcgUGxheWVyKHt0eXBlOiBQbGF5ZXIuVFlQRV9FTkVNWX0pO1xuXHR2YXIgcGxheWVyX2dhaWEgPSBuZXcgUGxheWVyKHt0eXBlOiBQbGF5ZXIuVFlQRV9HQUlBfSk7XG5cblxuXHRwbGF5ZXIxLm9uKCd1cGRhdGUnLCBmdW5jdGlvbigpIHtcblx0XHRtZW51LnVwZGF0ZSgndHJlZScsIHBsYXllcjEucmVzb3VyY2UoJ3RyZWUnKSk7XG5cdH0pO1xuXHR1bml0TWFuYWdlci5jcmVhdGUoJ3Rvd24nLCBwbGF5ZXIxKS5wb3NpdGlvbigyNTAsIDE1MCk7XG5cdHVuaXRNYW5hZ2VyLmNyZWF0ZSgndmlsbGFnZXInLCBwbGF5ZXIxKS5wb3NpdGlvbigxMDAsIDUwKTtcblx0dW5pdE1hbmFnZXIuY3JlYXRlKCd2aWxsYWdlcicsIHBsYXllcjEpLnBvc2l0aW9uKDEwMCwgMTAwKTtcblx0dW5pdE1hbmFnZXIuY3JlYXRlKCd2aWxsYWdlcicsIHBsYXllcjEpLnBvc2l0aW9uKDUwLCAxNTApO1xuXHR1bml0TWFuYWdlci5jcmVhdGUoJ3ZpbGxhZ2VyJywgcGxheWVyMSkucG9zaXRpb24oMjAwLCAyMDApO1xuXHR1bml0TWFuYWdlci5jcmVhdGUoJ3ZpbGxhZ2VyJywgcGxheWVyMikucG9zaXRpb24oMjAwLCAyNTApO1xuXHR1bml0TWFuYWdlci5jcmVhdGUoJ3RyZWUnLCBwbGF5ZXJfZ2FpYSkucG9zaXRpb24oMTAwLCAxNTApO1xuXHR1bml0TWFuYWdlci5jcmVhdGUoJ3RyZWUnLCBwbGF5ZXJfZ2FpYSkucG9zaXRpb24oNjAwLCAxNTApO1xuXHR1bml0TWFuYWdlci5jcmVhdGUoJ3RyZWUnLCBwbGF5ZXJfZ2FpYSkucG9zaXRpb24oNjAwLCAyMDApO1xuXHR1bml0TWFuYWdlci5jcmVhdGUoJ3RyZWUnLCBwbGF5ZXJfZ2FpYSkucG9zaXRpb24oNjAwLCAyNTApO1xuXHR1bml0TWFuYWdlci5jcmVhdGUoJ3RyZWUnLCBwbGF5ZXJfZ2FpYSkucG9zaXRpb24oNDUwLCAyMDApO1xuXHR1bml0TWFuYWdlci5jcmVhdGUoJ3RyZWUnLCBwbGF5ZXJfZ2FpYSkucG9zaXRpb24oNDAwLCAzMDApO1xuXHR1bml0TWFuYWdlci5jcmVhdGUoJ3RyZWUnLCBwbGF5ZXJfZ2FpYSkucG9zaXRpb24oNDAwLCAyNTApO1xuXHR1bml0TWFuYWdlci5jcmVhdGUoJ3RyZWUnLCBwbGF5ZXJfZ2FpYSkucG9zaXRpb24oMTUwLCA1MCk7XG5cblx0dmFyIHNlbGVjdGVkID0gbnVsbDtcblx0dW5pdE1hbmFnZXIub24oJ3RhcmdldCcsIGZ1bmN0aW9uKGUpIHtcblx0XHRpZihzZWxlY3RlZCkge1xuXHRcdFx0aWYoc2VsZWN0ZWQgaW5zdGFuY2VvZiBBcnJheSkge1xuXHRcdFx0XHRzZWxlY3RlZC5mb3JFYWNoKGZ1bmN0aW9uKHMpIHtcblx0XHRcdFx0XHRzLm1vdmVfdG9fdGFyZ2V0KGUudW5pdCk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fWVsc2V7XG5cdFx0XHRcdHNlbGVjdGVkLm1vdmVfdG9fdGFyZ2V0KGUudW5pdCk7XG5cdFx0XHR9XG5cdFx0fVx0XHRcdFxuXHR9KTtcblx0bWFwLm9uKCd0YXJnZXQnLCBmdW5jdGlvbihlKSB7XG5cdFx0aWYoc2VsZWN0ZWQpIHtcblx0XHRcdGlmKHNlbGVjdGVkIGluc3RhbmNlb2YgQXJyYXkpIHtcblx0XHRcdFx0c2VsZWN0ZWQuZm9yRWFjaChmdW5jdGlvbihzKSB7XG5cdFx0XHRcdFx0cy5tb3ZlX3RvX3BvcyhlLnBvcyk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fWVsc2V7XG5cdFx0XHRcdHNlbGVjdGVkLm1vdmVfdG9fcG9zKGUucG9zKTtcblx0XHRcdH1cblx0XHR9XG5cdH0pO1xuXHRtYXAub24oJ3NlbGVjdGVkJywgZnVuY3Rpb24odW5pdHMpIHtcblx0XHRzZWxlY3RlZCA9IHVuaXRzO1xuXHRcdGlmKHNlbGVjdGVkLmxlbmd0aCA+IDApXG5cdFx0XHRjb250cm9sUGFuZWwuc2V0VGFyZ2V0KHNlbGVjdGVkWzBdKTtcblx0fSk7XG5cdHBsYXRmb3JtLnNldHVwTWFwKG1hcCk7XG5cdHBsYXRmb3JtLnNldHVwVW5pdE1hbmFnZXIodW5pdE1hbmFnZXIpO1xuXG5cdGZ1bmN0aW9uIGdhbWVMb29wKCkge1xuXHRcdHVuaXRNYW5hZ2VyLm1haW4oKTtcblx0fVxuXHR2YXIgcmVjdXJzaXZlQW5pbSA9IGZ1bmN0aW9uKCkge1xuXHRcdGdhbWVMb29wKCk7XG5cdFx0cmVxdWVzdEFuaW1hdGlvbkZyYW1lKHJlY3Vyc2l2ZUFuaW0pXG5cdH1cblx0cmVxdWVzdEFuaW1hdGlvbkZyYW1lKHJlY3Vyc2l2ZUFuaW0pXG5cblx0dmFyIGdyYXBoID0gbWFwLmdldENvbGxHcmFwaCgpO1xuXHQvKlxuXHRmb3IodmFyIGk9MDtpIDwgZ3JhcGgubGVuZ3RoO2krKykge1xuXHRcdGZvcih2YXIgaj0wO2ogPCBncmFwaFtpXS5sZW5ndGg7aisrKSB7XG5cdFx0XHRpZihncmFwaFtpXVtqXSA9PSAwKSB7XG5cdFx0XHRcdHNuYXAucmVjdChpKjUwLCBqKjUwLCA0NSwgNDUpLmF0dHIoe1xuXHRcdFx0XHRcdHN0cm9rZSA6ICcjYTc3Jyxcblx0XHRcdFx0XHRmaWxsIDogJ25vbmUnLFxuXHRcdFx0XHRcdHN0cm9rZVdpZHRoIDogM1xuXHRcdFx0XHR9KTtcblx0XHRcdH1lbHNlIGlmKGdyYXBoW2ldW2pdID09IDEpIHtcblx0XHRcdFx0c25hcC5yZWN0KGkqNTAsIGoqNTAsIDQ1LCA0NSkuYXR0cih7XG5cdFx0XHRcdFx0c3Ryb2tlIDogJyM3N2InLFxuXHRcdFx0XHRcdGZpbGwgOiAnbm9uZScsXG5cdFx0XHRcdFx0c3Ryb2tlV2lkdGggOiAzXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXHQqL1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEdhbWU7IiwidmFyIFNuYXAgPSByZXF1aXJlKCcuLi8uLi90aGlyZHBhcnR5L3NuYXAuc3ZnJyk7XG52YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRlbWl0dGVyMicpLkV2ZW50RW1pdHRlcjI7XG52YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcbnZhciBSZWN0YW5nbGVTZWxlY3RvciA9IHJlcXVpcmUoJy4uL3VpL3JlY3RhbmdsZVNlbGVjdG9yJyk7XG52YXIgTWF0aDJEID0gcmVxdWlyZSgnLi9tYXRoMmQnKTtcblxuLy9jbGljazrjgr/jg4Pjg4Fcbi8vY2xpY2s66YG45oqe54q25oWL44Gn44Gu44K/44OD44OBXG4vL3RhcmdldDrlj7Pjgq/jg6rjg4Pjgq9cblxuZnVuY3Rpb24gTWFwKHNuYXApIHtcblx0dmFyIHRoYXQgPSB0aGlzO1xuXHRFdmVudEVtaXR0ZXIuY2FsbCh0aGlzKTtcblx0dGhpcy53aWR0aCA9IDgwO1xuXHR0aGlzLmhlaWdodCA9IDgwO1xuXHR2YXIgd2lkdGggPSAyMDAwO1xuXHR2YXIgaGVpZ2h0ID0gMjAwMDtcblx0dGhpcy5wb3MgPSBuZXcgTWF0aDJELlBvaW50MkQoMCwgMCk7XG5cdFJlY3RhbmdsZVNlbGVjdG9yLnNuYXAgPSBzbmFwO1xuXHR0aGlzLnNuYXAgPSBzbmFwO1xuXHR0aGlzLmdyb3VwID0gdGhpcy5zbmFwLmcoKTtcblx0dGhpcy5jb2xsID0gc25hcC5yZWN0KDAsIDAsIHdpZHRoLCBoZWlnaHQpO1xuXHR0aGlzLmdyb3VwLmFwcGVuZCh0aGlzLmNvbGwpO1xuXHR0aGlzLmNvbGwuYXR0cih7XG5cdFx0ZmlsbCA6IFwiIzdmN1wiXG5cdH0pO1xuXHR0aGlzLmNvbGwuZHJhZyhmdW5jdGlvbihkeCwgZHkpIHtcblx0XHRSZWN0YW5nbGVTZWxlY3Rvci5tb3ZlKGR4LCBkeSk7XG5cdH0sIGZ1bmN0aW9uKHgsIHksIGUpIHtcblx0XHRjb25zb2xlLmxvZygnc3RhcnQnLCBlLnBhZ2VYLCBlLnBhZ2VZKTtcblx0XHRSZWN0YW5nbGVTZWxlY3Rvci5zdGFydChlLnBhZ2VYLCBlLnBhZ2VZKTtcblx0fSwgZnVuY3Rpb24oKSB7XG5cdFx0UmVjdGFuZ2xlU2VsZWN0b3IuZW5kKCk7XG5cdFx0dmFyIHVuaXRzID0gdGhhdC51bml0TWFuYWdlci5nZXRUcmFpbmFibGVVbml0cygpLmZpbHRlcihmdW5jdGlvbih1bml0KSB7XG5cdFx0XHRyZXR1cm4gUmVjdGFuZ2xlU2VsZWN0b3IuaXNDb250YWluKHRoYXQuZ2xvYmFsMnNjcmVlbih1bml0LnBvc2l0aW9uKCkpKTtcblx0XHR9KTtcblx0XHR0aGF0LnVuaXRNYW5hZ2VyLnNlbGVjdCh1bml0cyk7XG5cdFx0dGhhdC5lbWl0KCdzZWxlY3RlZCcsIHVuaXRzKTtcblx0fSk7XG5cdHRoaXMuY2xpY2tIYW5kbGVyID0gZnVuY3Rpb24oZSkge1xuXG5cdH1cblx0dGhpcy5jb2xsLm1vdXNlZG93bihmdW5jdGlvbihlKSB7XG5cdFx0dmFyIHBvcyA9IHRoYXQuc2NyZWVuMmdsb2JhbChlLnBhZ2VYLCBlLnBhZ2VZKTtcblx0XHR0aGF0LmNsaWNrSGFuZGxlcihlLCBmdW5jdGlvbigpIHtcblx0XHRcdHRoYXQuZW1pdCgnY2xpY2snLCB7XG5cdFx0XHRcdHBvczogcG9zXG5cdFx0XHR9KTtcblx0XHRcdHRoYXQudW5pdE1hbmFnZXIuc2VsZWN0KFtdKTtcblx0XHR9LCBmdW5jdGlvbigpIHtcblx0XHRcdHRoYXQuZW1pdCgndGFyZ2V0Jywge1xuXHRcdFx0XHRwb3M6IHBvc1xuXHRcdFx0fSk7XG5cdFx0XHR0aGF0LnVuaXRNYW5hZ2VyLnNlbGVjdChbXSk7XG5cdFx0fSk7XG5cdH0pO1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwiY29udGV4dG1lbnVcIiwgZnVuY3Rpb24oZSl7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB9LCBmYWxzZSk7XG59XG5cbnV0aWwuaW5oZXJpdHMoTWFwLCBFdmVudEVtaXR0ZXIpO1xuXG5NYXAucHJvdG90eXBlLnNldFVuaXRNYW5hZ2VyID0gZnVuY3Rpb24odW5pdE1hbmFnZXIpIHtcblx0dmFyIHRoYXQgPSB0aGlzO1xuXHR0aGlzLnVuaXRNYW5hZ2VyID0gdW5pdE1hbmFnZXI7XG5cdHRoaXMudW5pdE1hbmFnZXIuc2V0TWFwKHRoaXMpO1xuXHR0aGlzLmdyb3VwLmFwcGVuZCh0aGlzLnVuaXRNYW5hZ2VyLmdyb3VwKTtcblx0dGhpcy51bml0TWFuYWdlci5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG5cdFx0dGhhdC5lbWl0KCdzZWxlY3RlZCcsIFtlLnVuaXRdKTtcblx0fSk7XG5cbn1cblxuTWFwLnByb3RvdHlwZS5zZXRDbGlja0hhbmRsZXIgPSBmdW5jdGlvbihjbGlja0hhbmRsZXIpIHtcblx0dGhpcy5jbGlja0hhbmRsZXIgPSBjbGlja0hhbmRsZXI7XG59XG5cblxuTWFwLnByb3RvdHlwZS5zY3JlZW4yZ2xvYmFsID0gZnVuY3Rpb24oeCwgeSkge1xuXHRyZXR1cm4gKG5ldyBNYXRoMkQuUG9pbnQyRCh4LCB5KSkuc3ViKHRoaXMucG9zKVxufVxuTWFwLnByb3RvdHlwZS5nbG9iYWwyc2NyZWVuID0gZnVuY3Rpb24ocG9zKSB7XG5cdHJldHVybiBwb3MuYWRkKHRoaXMucG9zKVxufVxuXG5NYXAucHJvdG90eXBlLm1vdmUgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHRoaXMucG9zID0gdGhpcy5wb3MuYWRkKG5ldyBNYXRoMkQuUG9pbnQyRCh4LCB5KSk7XG5cdHRoaXMuYXBwbHlEaXNwbGF5KCk7XG5cdGNvbnNvbGUubG9nKHRoaXMucG9zKTtcbn1cblxuTWFwLnByb3RvdHlwZS5hcHBseURpc3BsYXkgPSBmdW5jdGlvbigpIHtcblx0dmFyIG15TWF0cml4ID0gbmV3IFNuYXAuTWF0cml4KCk7XG5cdG15TWF0cml4LnRyYW5zbGF0ZSh0aGlzLnBvcy54LCB0aGlzLnBvcy55KTtcblx0dGhpcy5ncm91cC50cmFuc2Zvcm0obXlNYXRyaXgpO1xufVxuXG5NYXAucHJvdG90eXBlLmhpdCA9IGZ1bmN0aW9uKHRhcmdldFVuaXQpIHtcblx0cmV0dXJuIHRoaXMudW5pdE1hbmFnZXIuZ2V0VW5pdHMoKS5maWx0ZXIoZnVuY3Rpb24odW5pdCkge1xuXHRcdHJldHVybiB1bml0LmdldElkKCkgIT0gdGFyZ2V0VW5pdC5nZXRJZCgpO1xuXHR9KS5tYXAoZnVuY3Rpb24odSkge1xuXHRcdHJldHVybiB1LmNvbGxCb3VuZCgpO1xuXHR9KS5maWx0ZXIoZnVuY3Rpb24oYm91bmQpIHtcblx0XHR2YXIgdGFyZ2V0Qm91bmQgPSB0YXJnZXRVbml0LmNvbGxCb3VuZCgpO1xuXHRcdHJldHVybiAoYm91bmQueCA8IHRhcmdldEJvdW5kLnggKyB0YXJnZXRCb3VuZC53ICYmICB0YXJnZXRCb3VuZC54IDwgYm91bmQueCArIGJvdW5kLncgJiZcblx0XHRcdGJvdW5kLnkgPCB0YXJnZXRCb3VuZC55ICsgdGFyZ2V0Qm91bmQuaCAmJiAgdGFyZ2V0Qm91bmQueSA8IGJvdW5kLnkgKyBib3VuZC5oKTtcblx0fSkubGVuZ3RoID4gMDtcbn1cblxuTWFwLnByb3RvdHlwZS5nZXRDb2xsR3JhcGggPSBmdW5jdGlvbihfb3B0aW9ucykge1xuXHR2YXIgb3B0aW9ucyA9IF9vcHRpb25zIHx8IHt9O1xuXHR2YXIgdGhhdCA9IHRoaXM7XG5cdHZhciBncmFwaCA9IFtdO1xuXHRmb3IodmFyIGk9MDtpIDwgdGhpcy53aWR0aDtpKyspIHtcblx0XHR2YXIgd0dyYXBoID0gW11cblx0XHRmb3IodmFyIGo9MDtqIDwgdGhpcy5oZWlnaHQ7aisrKSB7XG5cdFx0XHR3R3JhcGgucHVzaCgxKTtcblx0XHR9XG5cdFx0Z3JhcGgucHVzaCh3R3JhcGgpO1xuXHR9XG5cdHRoaXMudW5pdE1hbmFnZXIuZ2V0Q29sbFVuaXRzKCkubWFwKGZ1bmN0aW9uKHUpIHtcblx0XHRpZih1LmluZm8uc2l6ZS5sZW5ndGggPT0gMikge1xuXHRcdFx0dmFyIHcgPSB1LmluZm8uc2l6ZVswXTtcblx0XHRcdHZhciBoID0gdS5pbmZvLnNpemVbMV07XG5cdFx0fWVsc2V7XG5cdFx0XHR2YXIgdyA9IHUuaW5mby5zaXplO1xuXHRcdFx0dmFyIGggPSB1LmluZm8uc2l6ZTtcblx0XHR9XG5cdFx0cmV0dXJuIHt4OnUucG9zaXRpb25UaWxlKCkuZ2V0WCgpLCB5OnUucG9zaXRpb25UaWxlKCkuZ2V0WSgpLCB3OncsIGg6aH0744CAXG5cdH0pLmZvckVhY2goZnVuY3Rpb24ocCkge1xuXHRcdGZvcih2YXIgaSA9IHAueDtpIDwgcC54ICsgcC53O2krKykge1xuXHRcdFx0Zm9yKHZhciBqID0gcC55O2ogPCBwLnkgKyBwLmg7aisrKSB7XG5cdFx0XHRcdGdyYXBoW2ldW2pdID0gMDtcblx0XHRcdH1cblx0XHR9XG5cdH0pO1xuXHRpZihvcHRpb25zLmV4Y2VwdCkge1xuXHRcdG9wdGlvbnMuZXhjZXB0LmZvckVhY2goZnVuY3Rpb24oZSkge1xuXHRcdFx0Z3JhcGhbZS5nZXRYKCldW2UuZ2V0WSgpXSA9IDE7XG5cdFx0fSk7XG5cdH1cblx0cmV0dXJuIGdyYXBoO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1hcDsiLCJcbmZ1bmN0aW9uIFBvaW50MkQoeCwgeSkge1xuXHR0aGlzLnggPSB4O1xuXHR0aGlzLnkgPSB5O1xufVxuXG5Qb2ludDJELnplcm8gPSBuZXcgUG9pbnQyRCgwLCAwKTtcblxuUG9pbnQyRC5zdWIgPSBmdW5jdGlvbihhLGIpIHtcblx0cmV0dXJuIG5ldyBQb2ludDJEKGEueCAtIGIueCwgYS55IC0gYi55KTtcbn1cblxuUG9pbnQyRC5hZGQgPSBmdW5jdGlvbihhLGIpIHtcblx0cmV0dXJuIG5ldyBQb2ludDJEKGEueCArIGIueCwgYS55ICsgYi55KTtcbn1cblxuUG9pbnQyRC50aW1lcyA9IGZ1bmN0aW9uKGEsdCkge1xuXHRyZXR1cm4gbmV3IFBvaW50MkQoYS54ICogdCwgYS55ICogdCk7XG59XG5cblBvaW50MkQucHJvdG90eXBlLnN1YiA9IGZ1bmN0aW9uKGEpIHtcblx0cmV0dXJuIFBvaW50MkQuc3ViKHRoaXMsIGEpO1xufVxuXG5Qb2ludDJELnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbihhKSB7XG5cdHJldHVybiBQb2ludDJELmFkZCh0aGlzLCBhKTtcbn1cblxuUG9pbnQyRC5wcm90b3R5cGUudGltZXMgPSBmdW5jdGlvbihhKSB7XG5cdHJldHVybiBQb2ludDJELnRpbWVzKHRoaXMsIGEpO1xufVxuXG5cblBvaW50MkQucHJvdG90eXBlLmdldFggPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHRoaXMueDtcbn1cblxuUG9pbnQyRC5wcm90b3R5cGUuZ2V0WSA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gdGhpcy55O1xufVxuXG5cblBvaW50MkQucHJvdG90eXBlLnNldExvY2F0aW9uID0gZnVuY3Rpb24oeCwgeSkge1xuXHR0aGlzLnggPSB4O1xuXHR0aGlzLnkgPSB5O1xufVxuXG4vKlxucHVibGljIFN0cmluZyB0b1N0cmluZygpIHtcbiAgICAgICAgcmV0dXJuIFwiUG9pbnQyRC5Eb3VibGVbXCIreCtcIiwgXCIreStcIl1cIjtcbiAgICB9XG5cblxuICAgIHB1YmxpYyB2b2lkIHNldExvY2F0aW9uKFBvaW50MkQgcCkge1xuICAgICAgICBzZXRMb2NhdGlvbihwLmdldFgoKSwgcC5nZXRZKCkpO1xuICAgIH1cbiAgICAqL1xuXG4vKlxuUG9pbnQyRC5wcm90b3R5cGUuZGlzdGFuY2VTcSA9IGZ1bmN0aW9uKHgxLCB5MSwgeDIsIHkyKSB7XG4gICAgeDEgLT0geDI7XG4gICAgeTEgLT0geTI7XG4gICAgcmV0dXJuICh4MSAqIHgxICsgeTEgKiB5MSk7XG59XG5cbiAgICBwdWJsaWMgc3RhdGljIGRvdWJsZSBkaXN0YW5jZShkb3VibGUgeDEsIGRvdWJsZSB5MSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb3VibGUgeDIsIGRvdWJsZSB5MilcbiAgICB7XG4gICAgICAgIHgxIC09IHgyO1xuICAgICAgICB5MSAtPSB5MjtcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydCh4MSAqIHgxICsgeTEgKiB5MSk7XG4gICAgfVxuKi9cblBvaW50MkQucHJvdG90eXBlLmRpc3RhbmNlU3EgPSBmdW5jdGlvbihweCwgcHkpIHtcblx0cHggLT0gdGhpcy5nZXRYKCk7XG5cdHB5IC09IHRoaXMuZ2V0WSgpO1xuXHRyZXR1cm4gKHB4ICogcHggKyBweSAqIHB5KTtcbn1cblxuUG9pbnQyRC5kaXN0YW5jZVNxID0gZnVuY3Rpb24ocCwgcSkge1xuICAgIHZhciB4eCA9IHAueCAtIHEueDtcbiAgICB2YXIgeXkgPSBwLnkgLSBxLnk7XG4gICAgcmV0dXJuICh4eCAqIHh4ICsgeXkgKiB5eSk7XG59XG5cblBvaW50MkQuZGlzdGFuY2UgPSBmdW5jdGlvbihwLCBxKSB7XG5cdHJldHVybiBNYXRoLnNxcnQoUG9pbnQyRC5kaXN0YW5jZVNxKHAsIHEpKTtcbn1cblxuUG9pbnQyRC5wcm90b3R5cGUubGVuZ3RoID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiBQb2ludDJELmRpc3RhbmNlKFBvaW50MkQuemVybywgdGhpcyk7XG59XG5cbi8qXG4gICAgcHVibGljIGRvdWJsZSBkaXN0YW5jZVNxKFBvaW50MkQgcHQpIHtcbiAgICAgICAgZG91YmxlIHB4ID0gcHQuZ2V0WCgpIC0gdGhpcy5nZXRYKCk7XG4gICAgICAgIGRvdWJsZSBweSA9IHB0LmdldFkoKSAtIHRoaXMuZ2V0WSgpO1xuICAgICAgICByZXR1cm4gKHB4ICogcHggKyBweSAqIHB5KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZG91YmxlIGRpc3RhbmNlKFBvaW50MkQgcHQpIHtcbiAgICAgICAgZG91YmxlIHB4ID0gcHQuZ2V0WCgpIC0gdGhpcy5nZXRYKCk7XG4gICAgICAgIGRvdWJsZSBweSA9IHB0LmdldFkoKSAtIHRoaXMuZ2V0WSgpO1xuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KHB4ICogcHggKyBweSAqIHB5KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgT2JqZWN0IGNsb25lKCkge1xuICAgIFx0cmV0dXJuIG5ldyBQb2ludDJEKHgsIHkpO1xuICAgIH1cbiovXG5cbi8qKlxuICogTGluZTJEXG4gKiBAcGFyYW0geDEseTEseDIseTJcbiAqL1xuZnVuY3Rpb24gTGluZTJEKHgxLCB5MSwgeDIsIHkyKSB7XG5cdHRoaXMueDEgPSB4MTtcblx0dGhpcy55MSA9IHkxO1xuXHR0aGlzLngyID0geDI7XG5cdHRoaXMueTIgPSB5Mjtcbn1cblxuTGluZTJELnByb3RvdHlwZS5nZXRYMSA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gdGhpcy54MTtcbn1cblxuTGluZTJELnByb3RvdHlwZS5nZXRZMSA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gdGhpcy55MTtcbn1cblxuTGluZTJELnByb3RvdHlwZS5nZXRYMiA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gdGhpcy54Mjtcbn1cblxuTGluZTJELnByb3RvdHlwZS5nZXRZMiA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gdGhpcy55Mjtcbn1cblxuXG5MaW5lMkQucHJvdG90eXBlLnNldExpbmUgPSBmdW5jdGlvbih4MSwgeTEsIHgyLCB5Mikge1xuXHR0aGlzLngxID0geDE7XG5cdHRoaXMueTEgPSB5MTtcblx0dGhpcy54MiA9IHgyO1xuXHR0aGlzLnkyID0geTI7XG59XG5cbkxpbmUyRC5wcm90b3R5cGUuZ2V0UDEgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIG5ldyBQb2ludDJEKHRoaXMueDEsIHRoaXMueTEpO1xufVxuXG5MaW5lMkQucHJvdG90eXBlLmdldFAyID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiBuZXcgUG9pbnQyRCh0aGlzLngyLCB0aGlzLnkyKTtcbn1cblxuTGluZTJELnByb3RvdHlwZS5nZXRCb3VuZHMyRCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB4O1xuICAgIHZhciB5O1xuICAgIHZhciB3O1xuICAgIHZhciBoO1xuICAgIGlmICh0aGlzLngxIDwgdGhpcy54Mikge1xuICAgICAgICB4ID0gdGhpcy54MTtcbiAgICAgICAgdyA9IHRoaXMueDIgLSB0aGlzLngxO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHggPSB0aGlzLngyO1xuICAgICAgICB3ID0gdGhpcy54MSAtIHRoaXMueDI7XG4gICAgfVxuICAgIGlmICh0aGlzLnkxIDwgdGhpcy55Mikge1xuICAgICAgICB5ID0gdGhpcy55MTtcbiAgICAgICAgaCA9IHRoaXMueTIgLSB0aGlzLnkxO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHkgPSB0aGlzLnkyO1xuICAgICAgICBoID0gdGhpcy55MSAtIHRoaXMueTI7XG4gICAgfVxuICAgIHJldHVybiBuZXcgUmVjdGFuZ2xlMkQoeCwgeSwgdywgaCk7XG59XG5cbkxpbmUyRC5wcm90b3R5cGUuZ2V0Q29ubmVjdCA9IGZ1bmN0aW9uKGwpIHtcblx0dmFyIGRCdW5ib1x0PSAodGhpcy5nZXRYMigpIC0gdGhpcy5nZXRYMSgpIClcbiAgICBcdCBcdFx0KiAoIGwuZ2V0WTIoKSAtIGwuZ2V0WTEoKSApXG4gICAgXHQgXHRcdC0gKCB0aGlzLmdldFkyKCkgLSB0aGlzLmdldFkxKCkgKVxuICAgIFx0IFx0XHQqICggbC5nZXRYMigpIC0gbC5nZXRYMSgpKTtcbiAgICBcdCBcbiAgICBcdCBpZiggMCA9PSBkQnVuYm8gKVxuICAgIFx0IHtcbiAgICBcdFx0IHJldHVybiBudWxsO1xuICAgIFx0IH1cbiAgICBcdCBcbiAgICBcdCB2YXIgdmVjdG9yQUMgPSBuZXcgUG9pbnQyRChsLmdldFgxKCkgLSB0aGlzLmdldFgxKCksIGwuZ2V0WTEoKSAtIHRoaXMuZ2V0WTEoKSk7XG4gICAgXHQgXG4gICAgXHQgdmFyIGRSID0gKCAoIGwuZ2V0WTIoKSAtIGwuZ2V0WTEoKSApICogdmVjdG9yQUMueCAtICggbC5nZXRYMigpIC0gbC5nZXRYMSgpICkgKiB2ZWN0b3JBQy55ICkgLyBkQnVuYm87XG4vL1x0ICAgIFx0IGRvdWJsZSBkUyA9ICggKCBnZXRZMigpIC0gZ2V0WTEoKSApICogdmVjdG9yQUMueCAtICggZ2V0WDIoKSAtIGdldFgxKCkgKSAqIHZlY3RvckFDLnkgKSAvIGRCdW5ibztcbiAgICBcdCBcbiAgICBcdCByZXR1cm4gbmV3IFBvaW50MkQodGhpcy5nZXRYMSgpICsgZFIgKiAodGhpcy5nZXRYMigpIC0gdGhpcy5nZXRYMSgpKSwgdGhpcy5nZXRZMSgpICsgZFIgKiAodGhpcy5nZXRZMigpIC0gdGhpcy5nZXRZMSgpKSk7XG4gICAgXHQgfVxuXG4vKipcbiAqIHN0YXRpY+mWouaVsFxuICovXG5MaW5lMkQucmVsYXRpdmVDQ1cgPSBmdW5jdGlvbih4MSwgeTEsIHgyLCB5MiwgcHgsIHB5KSB7XG4gICAgXHQgeDIgLT0geDE7XG4gICAgXHQgeTIgLT0geTE7XG4gICAgXHQgcHggLT0geDE7XG4gICAgXHQgcHkgLT0geTE7XG4gICAgXHQgdmFyIGNjdyA9IHB4ICogeTIgLSBweSAqIHgyO1xuICAgIFx0IGlmIChjY3cgPT0gMC4wKSB7XG4gICAgXHRcdCBjY3cgPSBweCAqIHgyICsgcHkgKiB5MjtcbiAgICBcdFx0IGlmIChjY3cgPiAwLjApIHtcbiAgICBcdFx0XHQgcHggLT0geDI7XG4gICAgXHRcdFx0IHB5IC09IHkyO1xuICAgIFx0XHRcdCBjY3cgPSBweCAqIHgyICsgcHkgKiB5MjtcbiAgICBcdFx0XHQgaWYgKGNjdyA8IDAuMCkge1xuICAgIFx0XHRcdFx0IGNjdyA9IDAuMDtcbiAgICBcdFx0XHQgfVxuICAgIFx0XHQgfVxuICAgIFx0IH1cbiAgICBcdCBpZihjY3cgPCAwLjApIHtcbiAgICBcdFx0IHJldHVybiAtMTtcbiAgICBcdCB9ZWxzZXtcbiAgICBcdFx0IGlmKGNjdyA+IDAuMCkge1xuICAgIFx0XHRcdCByZXR1cm4gMTtcbiAgICBcdFx0IH1lbHNle1xuICAgIFx0XHRcdCByZXR1cm4gMFxuICAgIFx0XHQgfVxuICAgIFx0IH1cbi8vXHQgICAgXHQgcmV0dXJuIChjY3cgPCAwLjApID8gLTEgOiAoKGNjdyA+IDAuMCkgPyAxIDogMCk7XG59XG4gICAgIFxuTGluZTJELnByb3RvdHlwZS5yZWxhdGl2ZUNDVyA9IGZ1bmN0aW9uKHB4LCBweSkge1xuXHQgcmV0dXJuIHJlbGF0aXZlQ0NXKHRoaXMuZ2V0WDEoKSwgdGhpcy5nZXRZMSgpLCB0aGlzLmdldFgyKCksIHRoaXMuZ2V0WTIoKSwgcHgsIHB5KTtcbn1cbiAgICAgXG5MaW5lMkQucHJvdG90eXBlLnJlbGF0aXZlQ0NXID0gZnVuY3Rpb24ocCkge1xuICAgIFx0IHJldHVybiByZWxhdGl2ZUNDVyh0aGlzLmdldFgxKCksIHRoaXMuZ2V0WTEoKSwgdGhpcy5nZXRYMigpLCB0aGlzLmdldFkyKCksXG4gICAgXHQgICAgICAgcC5nZXRYKCksIHAuZ2V0WSgpKTtcbn1cbiAgICBcdFxuTGluZTJELmxpbmVzSW50ZXJzZWN0ID0gZnVuY3Rpb24oeDEsIHkxLCB4MiwgeTIsIHgzLCB5MywgeDQsIHk0KSB7XG5cdHJldHVybiAoKExpbmUyRC5yZWxhdGl2ZUNDVyh4MSwgeTEsIHgyLCB5MiwgeDMsIHkzKSAqXG5cdFx0XHRMaW5lMkQucmVsYXRpdmVDQ1coeDEsIHkxLCB4MiwgeTIsIHg0LCB5NCkgPD0gMClcblx0XHRcdCYmIChMaW5lMkQucmVsYXRpdmVDQ1coeDMsIHkzLCB4NCwgeTQsIHgxLCB5MSkgKlxuXHRcdFx0XHRcdExpbmUyRC5yZWxhdGl2ZUNDVyh4MywgeTMsIHg0LCB5NCwgeDIsIHkyKSA8PSAwKSk7XG59XG5cbkxpbmUyRC5wcm90b3R5cGUuaW50ZXJzZWN0c0xpbmUgPSBmdW5jdGlvbih4MSwgeTEsIHgyLCB5Mikge1xuXHRyZXR1cm4gTGluZTJELmxpbmVzSW50ZXJzZWN0KHgxLCB5MSwgeDIsIHkyLFxuXHQgICAgICAgICB0aGlzLmdldFgxKCksIHRoaXMuZ2V0WTEoKSwgdGhpcy5nZXRYMigpLCB0aGlzLmdldFkyKCkpO1xufVxuXG4vKlxuXHRwdWJsaWMgYm9vbGVhbiBpbnRlcnNlY3RzTGluZShMaW5lMkQgbCkge1xuXHRcdHJldHVybiBsaW5lc0ludGVyc2VjdChsLmdldFgxKCksIGwuZ2V0WTEoKSwgbC5nZXRYMigpLCBsLmdldFkyKCksXG5cdCAgICAgICAgIGdldFgxKCksIGdldFkxKCksIGdldFgyKCksIGdldFkyKCkpO1xuXHR9XG5cdCovXG5cdFxuTGluZTJELnB0U2VnRGlzdFNxID0gZnVuY3Rpb24oeDEsIHkxLCB4MiwgeTIsIHB4LCBweSkge1xuXHR4MiAtPSB4MTtcblx0eTIgLT0geTE7XG5cdHB4IC09IHgxO1xuXHRweSAtPSB5MTtcblx0dmFyIGRvdHByb2QgPSBweCAqIHgyICsgcHkgKiB5Mjtcblx0dmFyIHByb2psZW5TcTtcblx0aWYgKGRvdHByb2QgPD0gMC4wKSB7XG5cdFx0cHJvamxlblNxID0gMC4wO1xuXHR9IGVsc2Uge1xuXHRcdHB4ID0geDIgLSBweDtcblx0XHRweSA9IHkyIC0gcHk7XG5cdFx0ZG90cHJvZCA9IHB4ICogeDIgKyBweSAqIHkyO1xuXHRcdGlmIChkb3Rwcm9kIDw9IDAuMCkge1xuXHRcdFx0cHJvamxlblNxID0gMC4wO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRwcm9qbGVuU3EgPSBkb3Rwcm9kICogZG90cHJvZCAvICh4MiAqIHgyICsgeTIgKiB5Mik7XG5cdFx0fVxuXHR9XG5cdHZhciBsZW5TcSA9IHB4ICogcHggKyBweSAqIHB5IC0gcHJvamxlblNxO1xuXHRpZiAobGVuU3EgPCAwKSB7XG5cdFx0bGVuU3EgPSAwO1xuXHR9XG5cdHJldHVybiBsZW5TcTtcbn1cblxuLyoqXG4gKiBzdGF0aWPplqLmlbBcbiAqL1xuTGluZTJELnB0U2VnRGlzdCA9IGZ1bmN0aW9uKHgxLCB5MSwgeDIsIHkyLCBweCwgcHkpIHtcblx0cmV0dXJuIE1hdGguc3FydChMaW5lMkQucHRTZWdEaXN0U3EoeDEsIHkxLCB4MiwgeTIsIHB4LCBweSkpO1xufVxuXG5MaW5lMkQucHJvdG90eXBlLnB0U2VnRGlzdFNxID0gZnVuY3Rpb24ocHgsIHB5KSB7XG5cdHJldHVybiBMaW5lMkQucHRTZWdEaXN0U3EodGhpcy54MSwgdGhpcy55MSwgdGhpcy54MiwgdGhpcy55MiwgcHgsIHB5KTtcbn1cblxuLypcblx0cHVibGljIGRvdWJsZSBwdFNlZ0Rpc3RTcShQb2ludDJEIHB0KSB7XG5cdFx0cmV0dXJuIHB0U2VnRGlzdFNxKGdldFgxKCksIGdldFkxKCksIGdldFgyKCksIGdldFkyKCksXG5cdCAgICAgIHB0LmdldFgoKSwgcHQuZ2V0WSgpKTtcblx0fVxuXHQqL1xuXHRcblxuTGluZTJELnByb3RvdHlwZS5wdFNlZ0Rpc3QgPSBmdW5jdGlvbihweCwgcHkpIHtcblx0cmV0dXJuIExpbmUyRC5wdFNlZ0Rpc3QodGhpcy54MSwgdGhpcy55MSwgdGhpcy54MiwgdGhpcy55MiwgcHgsIHB5KTtcbn1cblxuLypcdFxuXHRwdWJsaWMgZG91YmxlIHB0U2VnRGlzdChQb2ludDJEIHB0KSB7XG5cdFx0cmV0dXJuIHB0U2VnRGlzdChnZXRYMSgpLCBnZXRZMSgpLCBnZXRYMigpLCBnZXRZMigpLFxuXHQgICAgcHQuZ2V0WCgpLCBwdC5nZXRZKCkpO1xuXHR9XG5cdFxuXHQqL1xuXG5MaW5lMkQucHRMaW5lRGlzdFNxID0gZnVuY3Rpb24oeDEsIHkxLCB4MiwgeTIsIHB4LCBweSkge1xuXHR4MiAtPSB4MTtcblx0eTIgLT0geTE7XG5cdHB4IC09IHgxO1xuXHRweSAtPSB5MTtcblx0dmFyIGRvdHByb2QgPSBweCAqIHgyICsgcHkgKiB5Mjtcblx0dmFyIHByb2psZW5TcSA9IGRvdHByb2QgKiBkb3Rwcm9kIC8gKHgyICogeDIgKyB5MiAqIHkyKTtcblx0dmFyIGxlblNxID0gcHggKiBweCArIHB5ICogcHkgLSBwcm9qbGVuU3E7XG5cdGlmIChsZW5TcSA8IDApIHtcblx0XHRsZW5TcSA9IDA7XG5cdH1cblx0cmV0dXJuIGxlblNxO1xufVxuXHRcbkxpbmUyRC5wdExpbmVEaXN0ID0gZnVuY3Rpb24oeDEsIHkxLCB4MiwgeTIsIHB4LCBweSkge1xuXHRyZXR1cm4gTWF0aC5zcXJ0KHB0TGluZURpc3RTcSh4MSwgeTEsIHgyLCB5MiwgcHgsIHB5KSk7XG59XG5cdFxuTGluZTJELnByb3RvdHlwZS5wdExpbmVEaXN0U3EgPSBmdW5jdGlvbihweCwgcHkpIHtcblx0cmV0dXJuIHB0TGluZURpc3RTcSh0aGlzLngxLCB0aGlzLnkxLCB0aGlzLngyLCB0aGlzLnkyLCBweCwgcHkpO1xufVxuXG5MaW5lMkQucHJvdG90eXBlLnB0TGluZURpc3QgPSBmdW5jdGlvbihweCwgcHkpIHtcblx0cmV0dXJuIHB0TGluZURpc3QodGhpcy54MSwgdGhpcy55MSwgdGhpcy54MiwgdGhpcy55MiwgcHgsIHB5KTtcbn1cblxuLypcdFxuXHRwdWJsaWMgZG91YmxlIHB0TGluZURpc3RTcShQb2ludDJEIHB0KSB7XG5cdFx0cmV0dXJuIHB0TGluZURpc3RTcShnZXRYMSgpLCBnZXRZMSgpLCBnZXRYMigpLCBnZXRZMigpLFxuXHRcdFx0XHRwdC5nZXRYKCksIHB0LmdldFkoKSk7XG5cdH1cblxuXHRwdWJsaWMgZG91YmxlIHB0TGluZURpc3QoUG9pbnQyRCBwdCkge1xuXHRcdHJldHVybiBwdExpbmVEaXN0KGdldFgxKCksIGdldFkxKCksIGdldFgyKCksIGdldFkyKCksXG5cdFx0XHRcdHB0LmdldFgoKSwgcHQuZ2V0WSgpKTtcblx0fVxuXHRcblx0XG5cdHB1YmxpYyBib29sZWFuIGNvbnRhaW5zKGRvdWJsZSB4LCBkb3VibGUgeSkge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXHRcblx0cHVibGljIGJvb2xlYW4gY29udGFpbnMoUG9pbnQyRCBwKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cdFxuXHQqL1xuXG5cdC8qKlxuXHQqIHtAaW5oZXJpdERvY31cblx0KiBAc2luY2UgMS4yXG5cdCovXG5cbi8qXG5cdHB1YmxpYyBib29sZWFuIGludGVyc2VjdHMoZG91YmxlIHgsIGRvdWJsZSB5LCBkb3VibGUgdywgZG91YmxlIGgpIHtcblx0XHRyZXR1cm4gaW50ZXJzZWN0cyhuZXcgUmVjdGFuZ2xlMkQoeCwgeSwgdywgaCkpO1xuXHR9XG5cdFxuXHRwdWJsaWMgYm9vbGVhbiBpbnRlcnNlY3RzKFJlY3RhbmdsZTJEIHIpIHtcblx0XHRyZXR1cm4gci5pbnRlcnNlY3RzTGluZShnZXRYMSgpLCBnZXRZMSgpLCBnZXRYMigpLCBnZXRZMigpKTtcblx0fVxuXHRcblx0XG5cdHB1YmxpYyBib29sZWFuIGNvbnRhaW5zKGRvdWJsZSB4LCBkb3VibGUgeSwgZG91YmxlIHcsIGRvdWJsZSBoKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cdFxuXHRwdWJsaWMgYm9vbGVhbiBjb250YWlucyhSZWN0YW5nbGUyRCByKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cdFxuXHRwdWJsaWMgUmVjdGFuZ2xlMkQgZ2V0Qm91bmRzKCkge1xuXHRcdHJldHVybiBnZXRCb3VuZHMyRCgpO1xuXHR9XG5cdFxuXHRwdWJsaWMgT2JqZWN0IGNsb25lKCkge1xuXHRcdHJldHVybiBuZXcgTGluZTJEKHgxLCB5MSwgeDIsIHkyKTtcblx0fVxuXHQqL1xuXG5mdW5jdGlvbiBSZWN0YW5nbGUyRCh4LCB5LCB3aWR0aCwgaGVpZ2h0KSB7XG5cdHRoaXMueCA9IHg7XG5cdHRoaXMueSA9IHk7XG5cdHRoaXMud2lkdGggPSB3aWR0aDtcblx0dGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG59XG5cblJlY3RhbmdsZTJELk9VVF9MRUZUID0gMTtcblJlY3RhbmdsZTJELk9VVF9UT1AgPSAyO1xuUmVjdGFuZ2xlMkQuT1VUX1JJR0hUID0gNDtcblJlY3RhbmdsZTJELk9VVF9CT1RUT00gPSA4O1xuXG5SZWN0YW5nbGUyRC5wcm90b3R5cGUuZ2V0WCA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gdGhpcy54O1xufVxuXG5SZWN0YW5nbGUyRC5wcm90b3R5cGUuZ2V0WSA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gdGhpcy55O1xufVxuXG5SZWN0YW5nbGUyRC5wcm90b3R5cGUuZ2V0V2lkdGggPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHRoaXMud2lkdGg7XG59XG5cblJlY3RhbmdsZTJELnByb3RvdHlwZS5nZXRIZWlnaHQgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHRoaXMuaGVpZ2h0O1xufVxuXG5SZWN0YW5nbGUyRC5wcm90b3R5cGUuY29udGFpbnMgPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgdmFyIHgwID0gdGhpcy5nZXRYKCk7XG4gICAgdmFyIHkwID0gdGhpcy5nZXRZKCk7XG4gICAgcmV0dXJuICh4ID49IHgwICYmXG4gICAgICAgICAgICB5ID49IHkwICYmXG4gICAgICAgICAgICB4IDwgeDAgKyB0aGlzLmdldFdpZHRoKCkgJiZcbiAgICAgICAgICAgIHkgPCB5MCArIHRoaXMuZ2V0SGVpZ2h0KCkpO1xufVxuXG5SZWN0YW5nbGUyRC5jb250YWlucyA9IGZ1bmN0aW9uKHJlY3QscCkge1xuICAgIHJldHVybiAocC54ID49IHJlY3QueCAmJlxuICAgICAgICAgICAgcC55ID49IHJlY3QueSAmJlxuICAgICAgICAgICAgcC54IDwgcmVjdC54ICsgcmVjdC53aWR0aCAmJlxuICAgICAgICAgICAgcC55IDwgcmVjdC55ICsgcmVjdC5oZWlnaHQpO1x0XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRQb2ludDJEIDogUG9pbnQyRCxcblx0TGluZTJEIDogTGluZTJELFxuXHRSZWN0YW5nbGUyRCA6IFJlY3RhbmdsZTJEXG59IiwidmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50ZW1pdHRlcjInKS5FdmVudEVtaXR0ZXIyO1xudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG52YXIgdXVpZCA9IHJlcXVpcmUoJ3V1aWQnKTtcblxuXG5QbGF5ZXIuVFlQRV9IVU1BTiA9IDE7XG5QbGF5ZXIuVFlQRV9FTkVNWSA9IDI7XG5QbGF5ZXIuVFlQRV9HQUlBID0gMztcblxuZnVuY3Rpb24gUGxheWVyKF9vcHRpb25zKSB7XG5cdHZhciB0aGF0ID0gdGhpcztcblx0RXZlbnRFbWl0dGVyLmNhbGwodGhpcyk7XG5cdHRoaXMub3B0aW9ucyA9IF9vcHRpb25zIHx8IHt9O1xuXHR0aGlzLl90eXBlID0gdGhpcy5vcHRpb25zLnR5cGUgfHwgUGxheWVyLlRZUEVfSFVNQU47XG5cdHRoaXMuX3Jlc291cmNlcyA9IHtcblx0XHRcInRyZWVcIiA6IDAsXG5cdFx0XCJmb29kXCIgOiAwLFxuXHRcdFwic3RvbmVcIiA6IDAsXG5cdFx0XCJtZXRhbFwiIDogMFxuXHR9O1xufVxuXG51dGlsLmluaGVyaXRzKFBsYXllciwgRXZlbnRFbWl0dGVyKTtcblxuUGxheWVyLnByb3RvdHlwZS5yZXNvdXJjZSA9IGZ1bmN0aW9uKHR5cGUpIHtcblx0cmV0dXJuIHRoaXMuX3Jlc291cmNlc1t0eXBlXTtcbn1cblxuUGxheWVyLnByb3RvdHlwZS5hZGRSZXNvdXJjZSA9IGZ1bmN0aW9uKHR5cGUsIGluYykge1xuXHR0aGlzLl9yZXNvdXJjZXNbdHlwZV0gKz0gaW5jO1xuXHR0aGlzLmVtaXQoJ3VwZGF0ZScsIHRoaXMpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBsYXllcjsiLCJ2YXIgU25hcCA9IHJlcXVpcmUoJy4uLy4uL3RoaXJkcGFydHkvc25hcC5zdmcnKTtcblxuZnVuY3Rpb24gVW5pdEdyYXBoaWMoc25hcCwgZ3JvdXAsIG9wdGlvbnMsIG9uTG9hZCkge1xuXHR2YXIgdGhhdCA9IHRoaXM7XG5cdHRoaXMuZ3JvdXAgPSBzbmFwLmcoKTtcblx0dGhpcy5ib3VuZCA9IHt4OjAseTowfTtcblx0dGhpcy5fcm90YXRlID0gMDtcblx0dGhpcy5vcHRpb25zID0gb3B0aW9ucztcblx0Z3JvdXAuYXBwZW5kKHRoaXMuZ3JvdXApO1xuXHRTbmFwLmxvYWQob3B0aW9ucy5wYXRoLCBmdW5jdGlvbiAoZikge1xuXHRcdGNvbnNvbGUubG9nKG9wdGlvbnMucGF0aCArICcgbG9hZGVkIHN2Zy4nLCBmKTtcblx0ICAgIGcgPSBmLnNlbGVjdChcImdcIik7XG5cdCAgICB0aGF0Lmdyb3VwLmFwcGVuZChnKTtcblx0ICAgIGlmKG9uTG9hZCkgb25Mb2FkKCk7XG5cdH0pO1xufVxuXG5Vbml0R3JhcGhpYy5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24oKSB7XG5cdHRoaXMuZ3JvdXAucmVtb3ZlKCk7XG59XG5cblVuaXRHcmFwaGljLnByb3RvdHlwZS5jbGljayA9IGZ1bmN0aW9uKGNiKSB7XG5cdHRoaXMuZ3JvdXAubW91c2V1cChjYik7XG59XG5cblVuaXRHcmFwaGljLnByb3RvdHlwZS5nZXRQb3MgPSBmdW5jdGlvbigpIHtcblx0XG59XG5Vbml0R3JhcGhpYy5wcm90b3R5cGUuZ2V0V2lkdGggPSBmdW5jdGlvbigpIHtcblxufVxuXG5Vbml0R3JhcGhpYy5wcm90b3R5cGUuc2V0UG9zID0gZnVuY3Rpb24oeCwgeSkge1xuXHR0aGlzLmJvdW5kLnggPSB4O1xuXHR0aGlzLmJvdW5kLnkgPSB5O1xuXHR0aGlzLmFwcGx5RGlzcGxheSgpO1xufVxuXG5Vbml0R3JhcGhpYy5wcm90b3R5cGUucm90YXRlID0gZnVuY3Rpb24ocikge1xuXHR0aGlzLl9yb3RhdGUgPSByO1xuXHR0aGlzLmFwcGx5RGlzcGxheSgpO1xufVxuXG5Vbml0R3JhcGhpYy5wcm90b3R5cGUuc2V0U2l6ZSA9IGZ1bmN0aW9uKHNpemVYLCBzaXplWSkge1xuXHR0aGlzLl93aWR0aCA9IHNpemVYO1xuXHR0aGlzLl9oZWlnaHQgPSBzaXplWTtcblx0dGhpcy5fc2NhbGVYID0gc2l6ZVggLyB0aGlzLm9wdGlvbnMud2lkdGg7XG5cdHRoaXMuX3NjYWxlWSA9IHNpemVZIC8gdGhpcy5vcHRpb25zLmhlaWdodDtcblx0dGhpcy5hcHBseURpc3BsYXkoKTtcbn1cblxuVW5pdEdyYXBoaWMucHJvdG90eXBlLmFwcGx5RGlzcGxheSA9IGZ1bmN0aW9uKCkge1xuXHR2YXIgbXlNYXRyaXggPSBuZXcgU25hcC5NYXRyaXgoKTtcblx0bXlNYXRyaXgudHJhbnNsYXRlKHRoaXMuYm91bmQueCsodGhpcy5fd2lkdGgvMiksIHRoaXMuYm91bmQueSsodGhpcy5faGVpZ2h0LzIpKTtcblx0bXlNYXRyaXgucm90YXRlKHRoaXMuX3JvdGF0ZSk7XG5cdG15TWF0cml4LnNjYWxlKHRoaXMuX3NjYWxlWCwgdGhpcy5fc2NhbGVZKTtcblx0bXlNYXRyaXgudHJhbnNsYXRlKC0odGhpcy5vcHRpb25zLndpZHRoLzIpLCAtKHRoaXMub3B0aW9ucy5oZWlnaHQvMikpO1xuXHR0aGlzLmdyb3VwLnRyYW5zZm9ybShteU1hdHJpeCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVW5pdEdyYXBoaWM7IiwidmFyIFNuYXAgPSByZXF1aXJlKCcuLi90aGlyZHBhcnR5L3NuYXAuc3ZnJyk7XG52YXIgdW5pdEluZm8gPSByZXF1aXJlKCcuL3VuaXQnKTtcbnZhciBHYW1lID0gcmVxdWlyZSgnLi9jb3JlJyk7XG5cbmZ1bmN0aW9uIFJUUygpIHtcblxufVxuXG5SVFMucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24oKSB7XG5cdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24oKSB7XG5cblx0XHR2YXIgcmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gZ2V0UmVxdWVzdEFuaW1hdGlvbkZyYW1lKCk7XG5cblx0XHQvL3ZhciBpdGVtID0gbmV3IFBhbmVsSXRlbSgpO1xuXHRcdC8vZ2FtZeOCkuS9nOaIkFxuXHRcdHZhciBnYW1lID0gbmV3IEdhbWUocmVxdWVzdEFuaW1hdGlvbkZyYW1lKTtcblx0XHQvL2l0ZW0uYWRkKGdhbWUpO1xuXHR9KTtcbn1cblxuZnVuY3Rpb24gZ2V0UmVxdWVzdEFuaW1hdGlvbkZyYW1lKCkge1xuXHRyZXR1cm4gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuXHQgICAgICAgICAgICAgICAgd2luZG93LndlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuXHQgICAgICAgICAgICAgICAgd2luZG93Lm1velJlcXVlc3RBbmltYXRpb25GcmFtZSAgICB8fFxuXHQgICAgICAgICAgICAgICAgd2luZG93Lm9SZXF1ZXN0QW5pbWF0aW9uRnJhbWUgICAgICB8fFxuXHQgICAgICAgICAgICAgICAgd2luZG93Lm1zUmVxdWVzdEFuaW1hdGlvbkZyYW1lICAgICB8fFxuXHQgICAgICAgICAgICAgICAgbnVsbCA7XG59XG5cbndpbmRvdy5SVFMgPSBuZXcgUlRTKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gUlRTO1xuXG5cbmZ1bmN0aW9uIFBhbmVsSXRlbSgpIHtcblxufSIsInZhciBwYyA9IHJlcXVpcmUoJy4vcGMnKTtcbnZhciBzcCA9IHJlcXVpcmUoJy4vc3AnKTtcbnZhciBVc2VyQWdlbnQgPSByZXF1aXJlKCcuLi9wbGF0Zm9ybS91YScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuXHR2YXIgdWEgPSBVc2VyQWdlbnQoKTtcblx0aWYodWEubW9iaWxlWzBdIHx8IHVhLnRhYmxldCkge1xuXHRcdHJldHVybiBzcCgpO1xuXHR9ZWxzZXtcblx0XHRyZXR1cm4gcGMoKTtcblx0fVxufSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiB7XG5cdFx0c2V0dXBNYXA6IGZ1bmN0aW9uKG1hcCkge1xuXHRcdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRcdHN3aXRjaChlLmtleUNvZGUpIHtcblx0XHRcdFx0XHRjYXNlIDY4Oi8vZFxuXHRcdFx0XHRcdFx0bWFwLm1vdmUoLTEwLCAwKTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdGNhc2UgNjU6Ly9hXG5cdFx0XHRcdFx0XHRtYXAubW92ZSgxMCwgMCk7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRjYXNlIDg3Oi8vd1xuXHRcdFx0XHRcdFx0bWFwLm1vdmUoMCwgMTApO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0Y2FzZSA4MzovL3Ncblx0XHRcdFx0XHRcdG1hcC5tb3ZlKDAsIC0xMCk7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHRtYXAuc2V0Q2xpY2tIYW5kbGVyKGZ1bmN0aW9uKGUsIGNsaWNrLCB0YXJnZXQpIHtcblx0XHRcdFx0aWYoZS5idXR0b24gPT0gMCkge1xuXHRcdFx0XHRcdGNsaWNrKCk7XG5cdFx0XHRcdH1lbHNlIGlmKGUuYnV0dG9uID09IDIpIHtcblx0XHRcdFx0XHR0YXJnZXQoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSxcblx0XHRzZXR1cFVuaXRNYW5hZ2VyOiBmdW5jdGlvbih1bml0TWFuYWdlcikge1xuXHRcdFx0dW5pdE1hbmFnZXIuc2V0Q2xpY2tIYW5kbGVyKGZ1bmN0aW9uKGUsIGNsaWNrLCB0YXJnZXQpIHtcblx0XHRcdFx0aWYoZS5idXR0b24gPT0gMCkge1xuXHRcdFx0XHRcdGNsaWNrKCk7XG5cdFx0XHRcdH1lbHNlIGlmKGUuYnV0dG9uID09IDIpIHtcblx0XHRcdFx0XHR0YXJnZXQoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XG59IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHtcblx0XHRzZXR1cE1hcDogZnVuY3Rpb24obWFwKSB7XG5cdFx0XHRtYXAuc2V0Q2xpY2tIYW5kbGVyKGZ1bmN0aW9uKGUsIGNsaWNrLCB0YXJnZXQpIHtcblx0XHRcdFx0aWYobWFwLnVuaXRNYW5hZ2VyLnNlbGVjdGVkICYmIG1hcC51bml0TWFuYWdlci5zZWxlY3RlZC5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdFx0dGFyZ2V0KCk7XG5cdFx0XHRcdH1lbHNle1xuXHRcdFx0XHRcdGNsaWNrKCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0sXG5cdFx0c2V0dXBVbml0TWFuYWdlcjogZnVuY3Rpb24odW5pdE1hbmFnZXIpIHtcblx0XHRcdHVuaXRNYW5hZ2VyLnNldENsaWNrSGFuZGxlcihmdW5jdGlvbihlLCBjbGljaywgdGFyZ2V0KSB7XG5cdFx0XHRcdGlmKHVuaXRNYW5hZ2VyLnNlbGVjdGVkICYmIHVuaXRNYW5hZ2VyLnNlbGVjdGVkLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0XHR0YXJnZXQoKTtcblx0XHRcdFx0fWVsc2V7XG5cdFx0XHRcdFx0Y2xpY2soKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XG59IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihfdWEpIHtcblx0dmFyIHUgPSBfdWEgfHwgd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKTtcblx0dmFyIG1vYmlsZSA9IHtcblx0ICAgICAgICAwOiAodS5pbmRleE9mKFwid2luZG93c1wiKSAhPSAtMSAmJiB1LmluZGV4T2YoXCJwaG9uZVwiKSAhPSAtMSlcblx0ICAgICAgICB8fCB1LmluZGV4T2YoXCJpcGhvbmVcIikgIT0gLTFcblx0ICAgICAgICB8fCB1LmluZGV4T2YoXCJpcG9kXCIpICE9IC0xXG5cdCAgICAgICAgfHwgKHUuaW5kZXhPZihcImFuZHJvaWRcIikgIT0gLTEgJiYgdS5pbmRleE9mKFwibW9iaWxlXCIpICE9IC0xKVxuXHQgICAgICAgIHx8ICh1LmluZGV4T2YoXCJmaXJlZm94XCIpICE9IC0xICYmIHUuaW5kZXhPZihcIm1vYmlsZVwiKSAhPSAtMSlcblx0ICAgICAgICB8fCB1LmluZGV4T2YoXCJibGFja2JlcnJ5XCIpICE9IC0xLFxuXHQgICAgICAgIGlQaG9uZTogKHUuaW5kZXhPZihcImlwaG9uZVwiKSAhPSAtMSksXG5cdCAgICAgICAgQW5kcm9pZDogKHUuaW5kZXhPZihcImFuZHJvaWRcIikgIT0gLTEgJiYgdS5pbmRleE9mKFwibW9iaWxlXCIpICE9IC0xKVxuXHR9O1xuXHR2YXIgdGFibGV0ID0gKHUuaW5kZXhPZihcIndpbmRvd3NcIikgIT0gLTEgJiYgdS5pbmRleE9mKFwidG91Y2hcIikgIT0gLTEpXG5cdCAgICAgICAgfHwgdS5pbmRleE9mKFwiaXBhZFwiKSAhPSAtMVxuXHQgICAgICAgIHx8ICh1LmluZGV4T2YoXCJhbmRyb2lkXCIpICE9IC0xICYmIHUuaW5kZXhPZihcIm1vYmlsZVwiKSA9PSAtMSlcblx0ICAgICAgICB8fCAodS5pbmRleE9mKFwiZmlyZWZveFwiKSAhPSAtMSAmJiB1LmluZGV4T2YoXCJ0YWJsZXRcIikgIT0gLTEpXG5cdCAgICAgICAgfHwgdS5pbmRleE9mKFwia2luZGxlXCIpICE9IC0xXG5cdCAgICAgICAgfHwgdS5pbmRleE9mKFwic2lsa1wiKSAhPSAtMVxuXHQgICAgICAgIHx8IHUuaW5kZXhPZihcInBsYXlib29rXCIpICE9IC0xO1xuXHR2YXIgcGMgPSAhbW9iaWxlWzBdICYmICF0YWJsZXQ7XG5cdHJldHVybiB7XG5cdFx0bW9iaWxlOiBtb2JpbGUsXG5cdFx0dGFibGV0OiB0YWJsZXQsXG5cdFx0cGM6IHBjXG5cdH07XG59XG4iLCJmdW5jdGlvbiBDb250cm9sUGFuZWwoYmFzZURvbSkge1xuXHR2YXIgdGhhdCA9IHRoaXM7XG5cdHZhciB3cmFwcGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cdHdyYXBwZXIuY2xhc3NMaXN0LmFkZCgnY29udHJvbC1wYW5lbC13cmFwcGVyJyk7XG5cdGJhc2VEb20uYXBwZW5kQ2hpbGQod3JhcHBlcik7XG5cblx0dmFyIG1hcERvbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHR2YXIgaW5mb0RvbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHR2YXIgcGFsbGV0RG9tID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cblx0bWFwRG9tLmNsYXNzTGlzdC5hZGQoJ21hcC1wYW5lbC13cmFwcGVyJyk7XG5cdGluZm9Eb20uY2xhc3NMaXN0LmFkZCgnaW5mby1wYW5lbC13cmFwcGVyJyk7XG5cdHBhbGxldERvbS5jbGFzc0xpc3QuYWRkKCdwYWxsZXQtcGFuZWwtd3JhcHBlcicpO1xuXHR3cmFwcGVyLmFwcGVuZENoaWxkKG1hcERvbSk7XG5cdHdyYXBwZXIuYXBwZW5kQ2hpbGQoaW5mb0RvbSk7XG5cdHdyYXBwZXIuYXBwZW5kQ2hpbGQocGFsbGV0RG9tKTtcblxuXHR0aGlzLmluZm9FbGVtID0gaW5mb0RvbTtcblx0dGhpcy50YXJnZXQgPSBudWxsO1xuXHRzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcblx0XHRpZih0aGF0LnRhcmdldCkgdGhhdC5pbmZvRWxlbS5pbm5lckhUTUwgPSB0aGF0LnRhcmdldC5nZXRJbmZvKCk7XG5cdH0sIDIwMDApO1xufVxuXG5Db250cm9sUGFuZWwucHJvdG90eXBlLnNldFRhcmdldCA9IGZ1bmN0aW9uKHRhcmdldCkge1xuXHR0aGlzLnRhcmdldCA9IHRhcmdldDtcblx0dGhpcy5pbmZvRWxlbS5pbm5lckhUTUwgPSB0YXJnZXQuZ2V0SW5mbygpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRyb2xQYW5lbDsiLCJmdW5jdGlvbiBNZW51KGJhc2VEb20pIHtcblx0dmFyIHRoYXQgPSB0aGlzO1xuXHR2YXIgd3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHR3cmFwcGVyLmNsYXNzTGlzdC5hZGQoJ21lbnUtcGFuZWwtd3JhcHBlcicpO1xuXHRiYXNlRG9tLmFwcGVuZENoaWxkKHdyYXBwZXIpO1xuXG5cdHRoaXMudHJlZURvbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHR3cmFwcGVyLmFwcGVuZENoaWxkKHRoaXMudHJlZURvbSk7XG5cbn1cblxuTWVudS5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcblx0dGhpcy50cmVlRG9tLnRleHRDb250ZW50ID0gdmFsdWU7XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gTWVudTsiLCJmdW5jdGlvbiBQcmVMb2FkZXIoYmFzZURvbSkge1xuXHR2YXIgdGhhdCA9IHRoaXM7XG5cdHZhciB3cmFwcGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cdHdyYXBwZXIuY2xhc3NMaXN0LmFkZCgnbG9hZGluZy1hbmltYXRpb24nKTtcblx0dmFyIGJhbGxzRG9tID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cdGJhbGxzRG9tLmNsYXNzTGlzdC5hZGQoJ2JhbGxzJyk7XG5cdHdyYXBwZXIuYXBwZW5kQ2hpbGQoYmFsbHNEb20pO1xuXHRiYXNlRG9tLmFwcGVuZENoaWxkKHdyYXBwZXIpO1xuXG5cdHRoaXMud3JhcHBlciA9IHdyYXBwZXI7XG59XG5cblByZUxvYWRlci5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uKCkge1xuXHR0aGlzLndyYXBwZXIuc3R5bGVbXCJkaXNwbGF5XCJdID0gXCJibG9ja1wiO1xufVxuXG5QcmVMb2FkZXIucHJvdG90eXBlLmhpZGUgPSBmdW5jdGlvbigpIHtcblx0dGhpcy53cmFwcGVyLnN0eWxlW1wiZGlzcGxheVwiXSA9IFwibm9uZVwiO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFByZUxvYWRlcjsiLCJtb2R1bGUuZXhwb3J0cyA9IHtcblx0c25hcCA6IG51bGwsXG5cdHN0YXJ0IDogZnVuY3Rpb24oeCwgeSkge1xuXHRcdHRoaXMueCA9IHg7XG5cdFx0dGhpcy55ID0geTtcblx0XHR0aGlzLnN0YXJ0X3ggPSB4O1xuXHRcdHRoaXMuc3RhcnRfeSA9IHk7XG5cdFx0dGhpcy5yZWN0ID0gdGhpcy5zbmFwLnJlY3QoeCwgeSwgMSwgMSk7XG5cdFx0dGhpcy5yZWN0LmF0dHIoe1xuXHRcdFx0ZmlsbCA6IFwibm9uZVwiLFxuXHRcdFx0c3Ryb2tlIDogXCIjMzMzXCIsXG5cdFx0XHRzdHJva2VXaWR0aCA6IDJcblx0XHR9KTtcblx0fSxcblx0ZW5kIDogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5yZWN0LnJlbW92ZSgpO1xuXHR9LFxuXHRtb3ZlIDogZnVuY3Rpb24oZHgsIGR5KSB7XG5cdFx0aWYoZHggPCAwKSB0aGlzLnggPSB0aGlzLnN0YXJ0X3ggKyBkeDtcblx0XHRpZihkeSA8IDApIHRoaXMueSA9IHRoaXMuc3RhcnRfeSArIGR5O1xuXHRcdHRoaXMud2lkdGggPSBNYXRoLmFicyhkeCk7XG5cdFx0dGhpcy5oZWlnaHQgPSBNYXRoLmFicyhkeSk7XG5cdFx0dGhpcy5yZWN0LmF0dHIoe1xuXHRcdFx0eCA6IHRoaXMueCxcblx0XHRcdHkgOiB0aGlzLnksXG5cdFx0XHR3aWR0aCA6IHRoaXMud2lkdGgsXG5cdFx0XHRoZWlnaHQgOiB0aGlzLmhlaWdodFxuXHRcdH0pO1xuXHR9LFxuXHRpc0NvbnRhaW4gOiBmdW5jdGlvbihwb3MpIHtcblx0XHRyZXR1cm4gdGhpcy54IDwgcG9zLmdldFgoKSAmJiB0aGlzLnkgPCBwb3MuZ2V0WSgpICYmIChwb3MuZ2V0WCgpIDwgdGhpcy54ICsgdGhpcy53aWR0aCkgJiYgKHBvcy5nZXRZKCkgPCB0aGlzLnkgKyB0aGlzLmhlaWdodCk7XG5cdH1cbn0iLCJtb2R1bGUuZXhwb3J0cyA9IFt7XG5cdGlkIDogJ3ZpbGxhZ2VyJyxcblx0bmFtZSA6ICfluILmsJEnLFxuXHRncmFwaGljIDoge1xuXHRcdHBhdGggOiAndW5pdC9jaXR5LnN2ZycsXG5cdFx0d2lkdGggOiA4MCxcblx0XHRoZWlnaHQgOiA4MCxcblx0fSxcblx0dW5pdGluZm8gOiB7XG5cdFx0dHlwZSA6ICd0cmFpbmFibGUnLFxuXHRcdHNpemUgOiAxXG5cdH1cbn0se1xuXHRpZCA6ICdtaWxpdGlhJyxcblx0bmFtZSA6ICfluILmsJEnLFxuXHRncmFwaGljIDoge1xuXHRcdHBhdGggOiAndW5pdC9zd29yZC5zdmcnLFxuXHRcdHdpZHRoIDogODAsXG5cdFx0aGVpZ2h0IDogODAsXG5cdH0sXG5cdHVuaXRpbmZvIDoge1xuXHRcdHR5cGUgOiAndHJhaW5hYmxlJyxcblx0XHRzaXplIDogMVxuXHR9XG59LHtcblx0aWQgOiAndG93bicsXG5cdG5hbWUgOiAn55S644Gu5Lit5b+DJyxcblx0Z3JhcGhpYyA6IHtcblx0XHRwYXRoIDogJ2J1aWxkaW5nL3Rvd24uc3ZnJyxcblx0XHR3aWR0aCA6IDMyMCxcblx0XHRoZWlnaHQgOiAzMjAsXG5cdH0sXG5cdHVuaXRpbmZvIDoge1xuXHRcdHR5cGUgOiAnYnVpbGRpbmcnLFxuXHRcdHNpemUgOiBbMywgM11cblx0fVxufSx7XG5cdGlkIDogJ3RyZWUnLFxuXHRuYW1lIDogJ+acqCcsXG5cdGdyYXBoaWMgOiB7XG5cdFx0cGF0aCA6ICduYXR1cmUvdHJlZS5zdmcnLFxuXHRcdHdpZHRoIDogMTYwLFxuXHRcdGhlaWdodCA6IDE2MFxuXHR9LFxuXHR1bml0aW5mbyA6IHtcblx0XHR0eXBlIDogJ25hdHVyZScsXG5cdFx0c2l6ZSA6IDFcblx0fVxufSx7XG5cdGlkIDogJ2ZydWl0Jyxcblx0bmFtZSA6ICfmnpzniaknLFxuXHRncmFwaGljIDoge1xuXHRcdHBhdGggOiAnbmF0dXJlL2ZydWl0cy5zdmcnLFxuXHRcdHdpZHRoIDogMTYwLFxuXHRcdGhlaWdodCA6IDE2MFxuXHR9LFxuXHR1bml0aW5mbyA6IHtcblx0XHR0eXBlIDogJ25hdHVyZScsXG5cdFx0c2l6ZSA6IDFcblx0fVxufV0iLCJtb2R1bGUuZXhwb3J0cyA9IHtcblx0bmFtZSA6IFwiKlwiLFxuXHRsb2dnZXIgOiBmdW5jdGlvbihuYW1lKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYobmFtZS5tYXRjaCh0aGlzLm5hbWUpKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nLmFwcGx5KGNvbnNvbGUsIGFyZ3VtZW50cyk7XG5cdFx0XHRcdC8qXG5cdFx0XHRcdHZhciBkb20gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblx0XHRcdFx0ZG9tLnRleHRDb250ZW50ID0gSlNPTi5zdHJpbmdpZnkoYXJndW1lbnRzKTtcblx0XHRcdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RlYnVnJykuYXBwZW5kQ2hpbGQoZG9tKTtcblx0XHRcdFx0Ki9cblx0XHRcdH1cblx0XHR9XG5cdH1cbn0iLCIvLyBTbmFwLnN2ZyAwLjQuMVxuLy9cbi8vIENvcHlyaWdodCAoYykgMjAxMyDigJMgMjAxNSBBZG9iZSBTeXN0ZW1zIEluY29ycG9yYXRlZC4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8vXG4vLyBidWlsZDogMjAxNS0wNC0xM1xuXG4vLyBDb3B5cmlnaHQgKGMpIDIwMTMgQWRvYmUgU3lzdGVtcyBJbmNvcnBvcmF0ZWQuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBcbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vIFxuLy8gaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vLyBcbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vLyDilIzilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilJAgXFxcXFxuLy8g4pSCIEV2ZSAwLjQuMiAtIEphdmFTY3JpcHQgRXZlbnRzIExpYnJhcnkgICAgICAgICAgICAgICAgICAgICAg4pSCIFxcXFxcbi8vIOKUnOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUpCBcXFxcXG4vLyDilIIgQXV0aG9yIERtaXRyeSBCYXJhbm92c2tpeSAoaHR0cDovL2RtaXRyeS5iYXJhbm92c2tpeS5jb20vKSDilIIgXFxcXFxuLy8g4pSU4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSYIFxcXFxcblxuKGZ1bmN0aW9uIChnbG9iKSB7XG4gICAgdmFyIHZlcnNpb24gPSBcIjAuNC4yXCIsXG4gICAgICAgIGhhcyA9IFwiaGFzT3duUHJvcGVydHlcIixcbiAgICAgICAgc2VwYXJhdG9yID0gL1tcXC5cXC9dLyxcbiAgICAgICAgY29tYXNlcGFyYXRvciA9IC9cXHMqLFxccyovLFxuICAgICAgICB3aWxkY2FyZCA9IFwiKlwiLFxuICAgICAgICBmdW4gPSBmdW5jdGlvbiAoKSB7fSxcbiAgICAgICAgbnVtc29ydCA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gYSAtIGI7XG4gICAgICAgIH0sXG4gICAgICAgIGN1cnJlbnRfZXZlbnQsXG4gICAgICAgIHN0b3AsXG4gICAgICAgIGV2ZW50cyA9IHtuOiB7fX0sXG4gICAgICAgIGZpcnN0RGVmaW5lZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IHRoaXMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpc1tpXSAhPSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzW2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgbGFzdERlZmluZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgaSA9IHRoaXMubGVuZ3RoO1xuICAgICAgICAgICAgd2hpbGUgKC0taSkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpc1tpXSAhPSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzW2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAvKlxcXG4gICAgICogZXZlXG4gICAgIFsgbWV0aG9kIF1cblxuICAgICAqIEZpcmVzIGV2ZW50IHdpdGggZ2l2ZW4gYG5hbWVgLCBnaXZlbiBzY29wZSBhbmQgb3RoZXIgcGFyYW1ldGVycy5cblxuICAgICA+IEFyZ3VtZW50c1xuXG4gICAgIC0gbmFtZSAoc3RyaW5nKSBuYW1lIG9mIHRoZSAqZXZlbnQqLCBkb3QgKGAuYCkgb3Igc2xhc2ggKGAvYCkgc2VwYXJhdGVkXG4gICAgIC0gc2NvcGUgKG9iamVjdCkgY29udGV4dCBmb3IgdGhlIGV2ZW50IGhhbmRsZXJzXG4gICAgIC0gdmFyYXJncyAoLi4uKSB0aGUgcmVzdCBvZiBhcmd1bWVudHMgd2lsbCBiZSBzZW50IHRvIGV2ZW50IGhhbmRsZXJzXG5cbiAgICAgPSAob2JqZWN0KSBhcnJheSBvZiByZXR1cm5lZCB2YWx1ZXMgZnJvbSB0aGUgbGlzdGVuZXJzLiBBcnJheSBoYXMgdHdvIG1ldGhvZHMgYC5maXJzdERlZmluZWQoKWAgYW5kIGAubGFzdERlZmluZWQoKWAgdG8gZ2V0IGZpcnN0IG9yIGxhc3Qgbm90IGB1bmRlZmluZWRgIHZhbHVlLlxuICAgIFxcKi9cbiAgICAgICAgZXZlID0gZnVuY3Rpb24gKG5hbWUsIHNjb3BlKSB7XG4gICAgICAgICAgICBuYW1lID0gU3RyaW5nKG5hbWUpO1xuICAgICAgICAgICAgdmFyIGUgPSBldmVudHMsXG4gICAgICAgICAgICAgICAgb2xkc3RvcCA9IHN0b3AsXG4gICAgICAgICAgICAgICAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMiksXG4gICAgICAgICAgICAgICAgbGlzdGVuZXJzID0gZXZlLmxpc3RlbmVycyhuYW1lKSxcbiAgICAgICAgICAgICAgICB6ID0gMCxcbiAgICAgICAgICAgICAgICBmID0gZmFsc2UsXG4gICAgICAgICAgICAgICAgbCxcbiAgICAgICAgICAgICAgICBpbmRleGVkID0gW10sXG4gICAgICAgICAgICAgICAgcXVldWUgPSB7fSxcbiAgICAgICAgICAgICAgICBvdXQgPSBbXSxcbiAgICAgICAgICAgICAgICBjZSA9IGN1cnJlbnRfZXZlbnQsXG4gICAgICAgICAgICAgICAgZXJyb3JzID0gW107XG4gICAgICAgICAgICBvdXQuZmlyc3REZWZpbmVkID0gZmlyc3REZWZpbmVkO1xuICAgICAgICAgICAgb3V0Lmxhc3REZWZpbmVkID0gbGFzdERlZmluZWQ7XG4gICAgICAgICAgICBjdXJyZW50X2V2ZW50ID0gbmFtZTtcbiAgICAgICAgICAgIHN0b3AgPSAwO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gbGlzdGVuZXJzLmxlbmd0aDsgaSA8IGlpOyBpKyspIGlmIChcInpJbmRleFwiIGluIGxpc3RlbmVyc1tpXSkge1xuICAgICAgICAgICAgICAgIGluZGV4ZWQucHVzaChsaXN0ZW5lcnNbaV0uekluZGV4KTtcbiAgICAgICAgICAgICAgICBpZiAobGlzdGVuZXJzW2ldLnpJbmRleCA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcXVldWVbbGlzdGVuZXJzW2ldLnpJbmRleF0gPSBsaXN0ZW5lcnNbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaW5kZXhlZC5zb3J0KG51bXNvcnQpO1xuICAgICAgICAgICAgd2hpbGUgKGluZGV4ZWRbel0gPCAwKSB7XG4gICAgICAgICAgICAgICAgbCA9IHF1ZXVlW2luZGV4ZWRbeisrXV07XG4gICAgICAgICAgICAgICAgb3V0LnB1c2gobC5hcHBseShzY29wZSwgYXJncykpO1xuICAgICAgICAgICAgICAgIGlmIChzdG9wKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0b3AgPSBvbGRzdG9wO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3V0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgbCA9IGxpc3RlbmVyc1tpXTtcbiAgICAgICAgICAgICAgICBpZiAoXCJ6SW5kZXhcIiBpbiBsKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsLnpJbmRleCA9PSBpbmRleGVkW3pdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXQucHVzaChsLmFwcGx5KHNjb3BlLCBhcmdzKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3RvcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHorKztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsID0gcXVldWVbaW5kZXhlZFt6XV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbCAmJiBvdXQucHVzaChsLmFwcGx5KHNjb3BlLCBhcmdzKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0b3ApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSB3aGlsZSAobClcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXVlW2wuekluZGV4XSA9IGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBvdXQucHVzaChsLmFwcGx5KHNjb3BlLCBhcmdzKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdG9wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN0b3AgPSBvbGRzdG9wO1xuICAgICAgICAgICAgY3VycmVudF9ldmVudCA9IGNlO1xuICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gVW5kb2N1bWVudGVkLiBEZWJ1ZyBvbmx5LlxuICAgICAgICBldmUuX2V2ZW50cyA9IGV2ZW50cztcbiAgICAvKlxcXG4gICAgICogZXZlLmxpc3RlbmVyc1xuICAgICBbIG1ldGhvZCBdXG5cbiAgICAgKiBJbnRlcm5hbCBtZXRob2Qgd2hpY2ggZ2l2ZXMgeW91IGFycmF5IG9mIGFsbCBldmVudCBoYW5kbGVycyB0aGF0IHdpbGwgYmUgdHJpZ2dlcmVkIGJ5IHRoZSBnaXZlbiBgbmFtZWAuXG5cbiAgICAgPiBBcmd1bWVudHNcblxuICAgICAtIG5hbWUgKHN0cmluZykgbmFtZSBvZiB0aGUgZXZlbnQsIGRvdCAoYC5gKSBvciBzbGFzaCAoYC9gKSBzZXBhcmF0ZWRcblxuICAgICA9IChhcnJheSkgYXJyYXkgb2YgZXZlbnQgaGFuZGxlcnNcbiAgICBcXCovXG4gICAgZXZlLmxpc3RlbmVycyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIHZhciBuYW1lcyA9IG5hbWUuc3BsaXQoc2VwYXJhdG9yKSxcbiAgICAgICAgICAgIGUgPSBldmVudHMsXG4gICAgICAgICAgICBpdGVtLFxuICAgICAgICAgICAgaXRlbXMsXG4gICAgICAgICAgICBrLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGlpLFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIGpqLFxuICAgICAgICAgICAgbmVzLFxuICAgICAgICAgICAgZXMgPSBbZV0sXG4gICAgICAgICAgICBvdXQgPSBbXTtcbiAgICAgICAgZm9yIChpID0gMCwgaWkgPSBuYW1lcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICBuZXMgPSBbXTtcbiAgICAgICAgICAgIGZvciAoaiA9IDAsIGpqID0gZXMubGVuZ3RoOyBqIDwgamo7IGorKykge1xuICAgICAgICAgICAgICAgIGUgPSBlc1tqXS5uO1xuICAgICAgICAgICAgICAgIGl0ZW1zID0gW2VbbmFtZXNbaV1dLCBlW3dpbGRjYXJkXV07XG4gICAgICAgICAgICAgICAgayA9IDI7XG4gICAgICAgICAgICAgICAgd2hpbGUgKGstLSkge1xuICAgICAgICAgICAgICAgICAgICBpdGVtID0gaXRlbXNba107XG4gICAgICAgICAgICAgICAgICAgIGlmIChpdGVtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXMucHVzaChpdGVtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dCA9IG91dC5jb25jYXQoaXRlbS5mIHx8IFtdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVzID0gbmVzO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICBcbiAgICAvKlxcXG4gICAgICogZXZlLm9uXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBCaW5kcyBnaXZlbiBldmVudCBoYW5kbGVyIHdpdGggYSBnaXZlbiBuYW1lLiBZb3UgY2FuIHVzZSB3aWxkY2FyZHMg4oCcYCpg4oCdIGZvciB0aGUgbmFtZXM6XG4gICAgIHwgZXZlLm9uKFwiKi51bmRlci4qXCIsIGYpO1xuICAgICB8IGV2ZShcIm1vdXNlLnVuZGVyLmZsb29yXCIpOyAvLyB0cmlnZ2VycyBmXG4gICAgICogVXNlIEBldmUgdG8gdHJpZ2dlciB0aGUgbGlzdGVuZXIuXG4gICAgICoqXG4gICAgID4gQXJndW1lbnRzXG4gICAgICoqXG4gICAgIC0gbmFtZSAoc3RyaW5nKSBuYW1lIG9mIHRoZSBldmVudCwgZG90IChgLmApIG9yIHNsYXNoIChgL2ApIHNlcGFyYXRlZCwgd2l0aCBvcHRpb25hbCB3aWxkY2FyZHNcbiAgICAgLSBmIChmdW5jdGlvbikgZXZlbnQgaGFuZGxlciBmdW5jdGlvblxuICAgICAqKlxuICAgICA9IChmdW5jdGlvbikgcmV0dXJuZWQgZnVuY3Rpb24gYWNjZXB0cyBhIHNpbmdsZSBudW1lcmljIHBhcmFtZXRlciB0aGF0IHJlcHJlc2VudHMgei1pbmRleCBvZiB0aGUgaGFuZGxlci4gSXQgaXMgYW4gb3B0aW9uYWwgZmVhdHVyZSBhbmQgb25seSB1c2VkIHdoZW4geW91IG5lZWQgdG8gZW5zdXJlIHRoYXQgc29tZSBzdWJzZXQgb2YgaGFuZGxlcnMgd2lsbCBiZSBpbnZva2VkIGluIGEgZ2l2ZW4gb3JkZXIsIGRlc3BpdGUgb2YgdGhlIG9yZGVyIG9mIGFzc2lnbm1lbnQuIFxuICAgICA+IEV4YW1wbGU6XG4gICAgIHwgZXZlLm9uKFwibW91c2VcIiwgZWF0SXQpKDIpO1xuICAgICB8IGV2ZS5vbihcIm1vdXNlXCIsIHNjcmVhbSk7XG4gICAgIHwgZXZlLm9uKFwibW91c2VcIiwgY2F0Y2hJdCkoMSk7XG4gICAgICogVGhpcyB3aWxsIGVuc3VyZSB0aGF0IGBjYXRjaEl0YCBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCBiZWZvcmUgYGVhdEl0YC5cbiAgICAgKlxuICAgICAqIElmIHlvdSB3YW50IHRvIHB1dCB5b3VyIGhhbmRsZXIgYmVmb3JlIG5vbi1pbmRleGVkIGhhbmRsZXJzLCBzcGVjaWZ5IGEgbmVnYXRpdmUgdmFsdWUuXG4gICAgICogTm90ZTogSSBhc3N1bWUgbW9zdCBvZiB0aGUgdGltZSB5b3UgZG9u4oCZdCBuZWVkIHRvIHdvcnJ5IGFib3V0IHotaW5kZXgsIGJ1dCBpdOKAmXMgbmljZSB0byBoYXZlIHRoaXMgZmVhdHVyZSDigJxqdXN0IGluIGNhc2XigJ0uXG4gICAgXFwqL1xuICAgIGV2ZS5vbiA9IGZ1bmN0aW9uIChuYW1lLCBmKSB7XG4gICAgICAgIG5hbWUgPSBTdHJpbmcobmFtZSk7XG4gICAgICAgIGlmICh0eXBlb2YgZiAhPSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7fTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbmFtZXMgPSBuYW1lLnNwbGl0KGNvbWFzZXBhcmF0b3IpO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBuYW1lcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAoZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgbmFtZXMgPSBuYW1lLnNwbGl0KHNlcGFyYXRvciksXG4gICAgICAgICAgICAgICAgICAgIGUgPSBldmVudHMsXG4gICAgICAgICAgICAgICAgICAgIGV4aXN0O1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IG5hbWVzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgZSA9IGUubjtcbiAgICAgICAgICAgICAgICAgICAgZSA9IGUuaGFzT3duUHJvcGVydHkobmFtZXNbaV0pICYmIGVbbmFtZXNbaV1dIHx8IChlW25hbWVzW2ldXSA9IHtuOiB7fX0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlLmYgPSBlLmYgfHwgW107XG4gICAgICAgICAgICAgICAgZm9yIChpID0gMCwgaWkgPSBlLmYubGVuZ3RoOyBpIDwgaWk7IGkrKykgaWYgKGUuZltpXSA9PSBmKSB7XG4gICAgICAgICAgICAgICAgICAgIGV4aXN0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICFleGlzdCAmJiBlLmYucHVzaChmKTtcbiAgICAgICAgICAgIH0obmFtZXNbaV0pKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHpJbmRleCkge1xuICAgICAgICAgICAgaWYgKCt6SW5kZXggPT0gK3pJbmRleCkge1xuICAgICAgICAgICAgICAgIGYuekluZGV4ID0gK3pJbmRleDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBldmUuZlxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJucyBmdW5jdGlvbiB0aGF0IHdpbGwgZmlyZSBnaXZlbiBldmVudCB3aXRoIG9wdGlvbmFsIGFyZ3VtZW50cy5cbiAgICAgKiBBcmd1bWVudHMgdGhhdCB3aWxsIGJlIHBhc3NlZCB0byB0aGUgcmVzdWx0IGZ1bmN0aW9uIHdpbGwgYmUgYWxzb1xuICAgICAqIGNvbmNhdGVkIHRvIHRoZSBsaXN0IG9mIGZpbmFsIGFyZ3VtZW50cy5cbiAgICAgfCBlbC5vbmNsaWNrID0gZXZlLmYoXCJjbGlja1wiLCAxLCAyKTtcbiAgICAgfCBldmUub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoYSwgYiwgYykge1xuICAgICB8ICAgICBjb25zb2xlLmxvZyhhLCBiLCBjKTsgLy8gMSwgMiwgW2V2ZW50IG9iamVjdF1cbiAgICAgfCB9KTtcbiAgICAgPiBBcmd1bWVudHNcbiAgICAgLSBldmVudCAoc3RyaW5nKSBldmVudCBuYW1lXG4gICAgIC0gdmFyYXJncyAo4oCmKSBhbmQgYW55IG90aGVyIGFyZ3VtZW50c1xuICAgICA9IChmdW5jdGlvbikgcG9zc2libGUgZXZlbnQgaGFuZGxlciBmdW5jdGlvblxuICAgIFxcKi9cbiAgICBldmUuZiA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgYXR0cnMgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBldmUuYXBwbHkobnVsbCwgW2V2ZW50LCBudWxsXS5jb25jYXQoYXR0cnMpLmNvbmNhdChbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCkpKTtcbiAgICAgICAgfTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBldmUuc3RvcFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogSXMgdXNlZCBpbnNpZGUgYW4gZXZlbnQgaGFuZGxlciB0byBzdG9wIHRoZSBldmVudCwgcHJldmVudGluZyBhbnkgc3Vic2VxdWVudCBsaXN0ZW5lcnMgZnJvbSBmaXJpbmcuXG4gICAgXFwqL1xuICAgIGV2ZS5zdG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBzdG9wID0gMTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBldmUubnRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIENvdWxkIGJlIHVzZWQgaW5zaWRlIGV2ZW50IGhhbmRsZXIgdG8gZmlndXJlIG91dCBhY3R1YWwgbmFtZSBvZiB0aGUgZXZlbnQuXG4gICAgICoqXG4gICAgID4gQXJndW1lbnRzXG4gICAgICoqXG4gICAgIC0gc3VibmFtZSAoc3RyaW5nKSAjb3B0aW9uYWwgc3VibmFtZSBvZiB0aGUgZXZlbnRcbiAgICAgKipcbiAgICAgPSAoc3RyaW5nKSBuYW1lIG9mIHRoZSBldmVudCwgaWYgYHN1Ym5hbWVgIGlzIG5vdCBzcGVjaWZpZWRcbiAgICAgKiBvclxuICAgICA9IChib29sZWFuKSBgdHJ1ZWAsIGlmIGN1cnJlbnQgZXZlbnTigJlzIG5hbWUgY29udGFpbnMgYHN1Ym5hbWVgXG4gICAgXFwqL1xuICAgIGV2ZS5udCA9IGZ1bmN0aW9uIChzdWJuYW1lKSB7XG4gICAgICAgIGlmIChzdWJuYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFJlZ0V4cChcIig/OlxcXFwufFxcXFwvfF4pXCIgKyBzdWJuYW1lICsgXCIoPzpcXFxcLnxcXFxcL3wkKVwiKS50ZXN0KGN1cnJlbnRfZXZlbnQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjdXJyZW50X2V2ZW50O1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIGV2ZS5udHNcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIENvdWxkIGJlIHVzZWQgaW5zaWRlIGV2ZW50IGhhbmRsZXIgdG8gZmlndXJlIG91dCBhY3R1YWwgbmFtZSBvZiB0aGUgZXZlbnQuXG4gICAgICoqXG4gICAgICoqXG4gICAgID0gKGFycmF5KSBuYW1lcyBvZiB0aGUgZXZlbnRcbiAgICBcXCovXG4gICAgZXZlLm50cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGN1cnJlbnRfZXZlbnQuc3BsaXQoc2VwYXJhdG9yKTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBldmUub2ZmXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIGdpdmVuIGZ1bmN0aW9uIGZyb20gdGhlIGxpc3Qgb2YgZXZlbnQgbGlzdGVuZXJzIGFzc2lnbmVkIHRvIGdpdmVuIG5hbWUuXG4gICAgICogSWYgbm8gYXJndW1lbnRzIHNwZWNpZmllZCBhbGwgdGhlIGV2ZW50cyB3aWxsIGJlIGNsZWFyZWQuXG4gICAgICoqXG4gICAgID4gQXJndW1lbnRzXG4gICAgICoqXG4gICAgIC0gbmFtZSAoc3RyaW5nKSBuYW1lIG9mIHRoZSBldmVudCwgZG90IChgLmApIG9yIHNsYXNoIChgL2ApIHNlcGFyYXRlZCwgd2l0aCBvcHRpb25hbCB3aWxkY2FyZHNcbiAgICAgLSBmIChmdW5jdGlvbikgZXZlbnQgaGFuZGxlciBmdW5jdGlvblxuICAgIFxcKi9cbiAgICAvKlxcXG4gICAgICogZXZlLnVuYmluZFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogU2VlIEBldmUub2ZmXG4gICAgXFwqL1xuICAgIGV2ZS5vZmYgPSBldmUudW5iaW5kID0gZnVuY3Rpb24gKG5hbWUsIGYpIHtcbiAgICAgICAgaWYgKCFuYW1lKSB7XG4gICAgICAgICAgICBldmUuX2V2ZW50cyA9IGV2ZW50cyA9IHtuOiB7fX07XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG5hbWVzID0gbmFtZS5zcGxpdChjb21hc2VwYXJhdG9yKTtcbiAgICAgICAgaWYgKG5hbWVzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IG5hbWVzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICBldmUub2ZmKG5hbWVzW2ldLCBmKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBuYW1lcyA9IG5hbWUuc3BsaXQoc2VwYXJhdG9yKTtcbiAgICAgICAgdmFyIGUsXG4gICAgICAgICAgICBrZXksXG4gICAgICAgICAgICBzcGxpY2UsXG4gICAgICAgICAgICBpLCBpaSwgaiwgamosXG4gICAgICAgICAgICBjdXIgPSBbZXZlbnRzXTtcbiAgICAgICAgZm9yIChpID0gMCwgaWkgPSBuYW1lcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgY3VyLmxlbmd0aDsgaiArPSBzcGxpY2UubGVuZ3RoIC0gMikge1xuICAgICAgICAgICAgICAgIHNwbGljZSA9IFtqLCAxXTtcbiAgICAgICAgICAgICAgICBlID0gY3VyW2pdLm47XG4gICAgICAgICAgICAgICAgaWYgKG5hbWVzW2ldICE9IHdpbGRjYXJkKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlW25hbWVzW2ldXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3BsaWNlLnB1c2goZVtuYW1lc1tpXV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gZSkgaWYgKGVbaGFzXShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzcGxpY2UucHVzaChlW2tleV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGN1ci5zcGxpY2UuYXBwbHkoY3VyLCBzcGxpY2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAoaSA9IDAsIGlpID0gY3VyLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIGUgPSBjdXJbaV07XG4gICAgICAgICAgICB3aGlsZSAoZS5uKSB7XG4gICAgICAgICAgICAgICAgaWYgKGYpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGUuZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChqID0gMCwgamogPSBlLmYubGVuZ3RoOyBqIDwgamo7IGorKykgaWYgKGUuZltqXSA9PSBmKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5mLnNwbGljZShqLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICFlLmYubGVuZ3RoICYmIGRlbGV0ZSBlLmY7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gZS5uKSBpZiAoZS5uW2hhc10oa2V5KSAmJiBlLm5ba2V5XS5mKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZnVuY3MgPSBlLm5ba2V5XS5mO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChqID0gMCwgamogPSBmdW5jcy5sZW5ndGg7IGogPCBqajsgaisrKSBpZiAoZnVuY3Nbal0gPT0gZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmNzLnNwbGljZShqLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICFmdW5jcy5sZW5ndGggJiYgZGVsZXRlIGUubltrZXldLmY7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgZS5mO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGtleSBpbiBlLm4pIGlmIChlLm5baGFzXShrZXkpICYmIGUubltrZXldLmYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBlLm5ba2V5XS5mO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGUgPSBlLm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBldmUub25jZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQmluZHMgZ2l2ZW4gZXZlbnQgaGFuZGxlciB3aXRoIGEgZ2l2ZW4gbmFtZSB0byBvbmx5IHJ1biBvbmNlIHRoZW4gdW5iaW5kIGl0c2VsZi5cbiAgICAgfCBldmUub25jZShcImxvZ2luXCIsIGYpO1xuICAgICB8IGV2ZShcImxvZ2luXCIpOyAvLyB0cmlnZ2VycyBmXG4gICAgIHwgZXZlKFwibG9naW5cIik7IC8vIG5vIGxpc3RlbmVyc1xuICAgICAqIFVzZSBAZXZlIHRvIHRyaWdnZXIgdGhlIGxpc3RlbmVyLlxuICAgICAqKlxuICAgICA+IEFyZ3VtZW50c1xuICAgICAqKlxuICAgICAtIG5hbWUgKHN0cmluZykgbmFtZSBvZiB0aGUgZXZlbnQsIGRvdCAoYC5gKSBvciBzbGFzaCAoYC9gKSBzZXBhcmF0ZWQsIHdpdGggb3B0aW9uYWwgd2lsZGNhcmRzXG4gICAgIC0gZiAoZnVuY3Rpb24pIGV2ZW50IGhhbmRsZXIgZnVuY3Rpb25cbiAgICAgKipcbiAgICAgPSAoZnVuY3Rpb24pIHNhbWUgcmV0dXJuIGZ1bmN0aW9uIGFzIEBldmUub25cbiAgICBcXCovXG4gICAgZXZlLm9uY2UgPSBmdW5jdGlvbiAobmFtZSwgZikge1xuICAgICAgICB2YXIgZjIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBldmUudW5iaW5kKG5hbWUsIGYyKTtcbiAgICAgICAgICAgIHJldHVybiBmLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBldmUub24obmFtZSwgZjIpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIGV2ZS52ZXJzaW9uXG4gICAgIFsgcHJvcGVydHkgKHN0cmluZykgXVxuICAgICAqKlxuICAgICAqIEN1cnJlbnQgdmVyc2lvbiBvZiB0aGUgbGlicmFyeS5cbiAgICBcXCovXG4gICAgZXZlLnZlcnNpb24gPSB2ZXJzaW9uO1xuICAgIGV2ZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFwiWW91IGFyZSBydW5uaW5nIEV2ZSBcIiArIHZlcnNpb247XG4gICAgfTtcbiAgICAodHlwZW9mIG1vZHVsZSAhPSBcInVuZGVmaW5lZFwiICYmIG1vZHVsZS5leHBvcnRzKSA/IChtb2R1bGUuZXhwb3J0cyA9IGV2ZSkgOiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQgPyAoZGVmaW5lKFwiZXZlXCIsIFtdLCBmdW5jdGlvbigpIHsgcmV0dXJuIGV2ZTsgfSkpIDogKGdsb2IuZXZlID0gZXZlKSk7XG59KSh0aGlzKTtcblxuKGZ1bmN0aW9uIChnbG9iLCBmYWN0b3J5KSB7XG4gICAgLy8gQU1EIHN1cHBvcnRcbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICAvLyBEZWZpbmUgYXMgYW4gYW5vbnltb3VzIG1vZHVsZVxuICAgICAgICBkZWZpbmUoW1wiZXZlXCJdLCBmdW5jdGlvbiAoZXZlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFjdG9yeShnbG9iLCBldmUpO1xuICAgICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIC8vIE5leHQgZm9yIE5vZGUuanMgb3IgQ29tbW9uSlNcbiAgICAgICAgdmFyIGV2ZSA9IHJlcXVpcmUoJ2V2ZScpO1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoZ2xvYiwgZXZlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBCcm93c2VyIGdsb2JhbHMgKGdsb2IgaXMgd2luZG93KVxuICAgICAgICAvLyBTbmFwIGFkZHMgaXRzZWxmIHRvIHdpbmRvd1xuICAgICAgICBmYWN0b3J5KGdsb2IsIGdsb2IuZXZlKTtcbiAgICB9XG59KHdpbmRvdyB8fCB0aGlzLCBmdW5jdGlvbiAod2luZG93LCBldmUpIHtcblxuLy8gQ29weXJpZ2h0IChjKSAyMDEzIEFkb2JlIFN5c3RlbXMgSW5jb3Jwb3JhdGVkLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vLyBcbi8vIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy8gXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxudmFyIG1pbmEgPSAoZnVuY3Rpb24gKGV2ZSkge1xuICAgIHZhciBhbmltYXRpb25zID0ge30sXG4gICAgcmVxdWVzdEFuaW1GcmFtZSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgICAgICAgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LndlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lICAgIHx8XG4gICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5vUmVxdWVzdEFuaW1hdGlvbkZyYW1lICAgICAgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgd2luZG93Lm1zUmVxdWVzdEFuaW1hdGlvbkZyYW1lICAgICB8fFxuICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoY2FsbGJhY2ssIDE2KTtcbiAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAoYSkge1xuICAgICAgICByZXR1cm4gYSBpbnN0YW5jZW9mIEFycmF5IHx8XG4gICAgICAgICAgICBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYSkgPT0gXCJbb2JqZWN0IEFycmF5XVwiO1xuICAgIH0sXG4gICAgaWRnZW4gPSAwLFxuICAgIGlkcHJlZml4ID0gXCJNXCIgKyAoK25ldyBEYXRlKS50b1N0cmluZygzNiksXG4gICAgSUQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBpZHByZWZpeCArIChpZGdlbisrKS50b1N0cmluZygzNik7XG4gICAgfSxcbiAgICBkaWZmID0gZnVuY3Rpb24gKGEsIGIsIEEsIEIpIHtcbiAgICAgICAgaWYgKGlzQXJyYXkoYSkpIHtcbiAgICAgICAgICAgIHJlcyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gYS5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgcmVzW2ldID0gZGlmZihhW2ldLCBiLCBBW2ldLCBCKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGRpZiA9IChBIC0gYSkgLyAoQiAtIGIpO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGJiKSB7XG4gICAgICAgICAgICByZXR1cm4gYSArIGRpZiAqIChiYiAtIGIpO1xuICAgICAgICB9O1xuICAgIH0sXG4gICAgdGltZXIgPSBEYXRlLm5vdyB8fCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiArbmV3IERhdGU7XG4gICAgfSxcbiAgICBzdGEgPSBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgIHZhciBhID0gdGhpcztcbiAgICAgICAgaWYgKHZhbCA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gYS5zO1xuICAgICAgICB9XG4gICAgICAgIHZhciBkcyA9IGEucyAtIHZhbDtcbiAgICAgICAgYS5iICs9IGEuZHVyICogZHM7XG4gICAgICAgIGEuQiArPSBhLmR1ciAqIGRzO1xuICAgICAgICBhLnMgPSB2YWw7XG4gICAgfSxcbiAgICBzcGVlZCA9IGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgdmFyIGEgPSB0aGlzO1xuICAgICAgICBpZiAodmFsID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBhLnNwZDtcbiAgICAgICAgfVxuICAgICAgICBhLnNwZCA9IHZhbDtcbiAgICB9LFxuICAgIGR1cmF0aW9uID0gZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICB2YXIgYSA9IHRoaXM7XG4gICAgICAgIGlmICh2YWwgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIGEuZHVyO1xuICAgICAgICB9XG4gICAgICAgIGEucyA9IGEucyAqIHZhbCAvIGEuZHVyO1xuICAgICAgICBhLmR1ciA9IHZhbDtcbiAgICB9LFxuICAgIHN0b3BpdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGEgPSB0aGlzO1xuICAgICAgICBkZWxldGUgYW5pbWF0aW9uc1thLmlkXTtcbiAgICAgICAgYS51cGRhdGUoKTtcbiAgICAgICAgZXZlKFwibWluYS5zdG9wLlwiICsgYS5pZCwgYSk7XG4gICAgfSxcbiAgICBwYXVzZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGEgPSB0aGlzO1xuICAgICAgICBpZiAoYS5wZGlmKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZGVsZXRlIGFuaW1hdGlvbnNbYS5pZF07XG4gICAgICAgIGEudXBkYXRlKCk7XG4gICAgICAgIGEucGRpZiA9IGEuZ2V0KCkgLSBhLmI7XG4gICAgfSxcbiAgICByZXN1bWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhID0gdGhpcztcbiAgICAgICAgaWYgKCFhLnBkaWYpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBhLmIgPSBhLmdldCgpIC0gYS5wZGlmO1xuICAgICAgICBkZWxldGUgYS5wZGlmO1xuICAgICAgICBhbmltYXRpb25zW2EuaWRdID0gYTtcbiAgICB9LFxuICAgIHVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGEgPSB0aGlzLFxuICAgICAgICAgICAgcmVzO1xuICAgICAgICBpZiAoaXNBcnJheShhLnN0YXJ0KSkge1xuICAgICAgICAgICAgcmVzID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMCwgamogPSBhLnN0YXJ0Lmxlbmd0aDsgaiA8IGpqOyBqKyspIHtcbiAgICAgICAgICAgICAgICByZXNbal0gPSArYS5zdGFydFtqXSArXG4gICAgICAgICAgICAgICAgICAgIChhLmVuZFtqXSAtIGEuc3RhcnRbal0pICogYS5lYXNpbmcoYS5zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlcyA9ICthLnN0YXJ0ICsgKGEuZW5kIC0gYS5zdGFydCkgKiBhLmVhc2luZyhhLnMpO1xuICAgICAgICB9XG4gICAgICAgIGEuc2V0KHJlcyk7XG4gICAgfSxcbiAgICBmcmFtZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGxlbiA9IDA7XG4gICAgICAgIGZvciAodmFyIGkgaW4gYW5pbWF0aW9ucykgaWYgKGFuaW1hdGlvbnMuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgICAgIHZhciBhID0gYW5pbWF0aW9uc1tpXSxcbiAgICAgICAgICAgICAgICBiID0gYS5nZXQoKSxcbiAgICAgICAgICAgICAgICByZXM7XG4gICAgICAgICAgICBsZW4rKztcbiAgICAgICAgICAgIGEucyA9IChiIC0gYS5iKSAvIChhLmR1ciAvIGEuc3BkKTtcbiAgICAgICAgICAgIGlmIChhLnMgPj0gMSkge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBhbmltYXRpb25zW2ldO1xuICAgICAgICAgICAgICAgIGEucyA9IDE7XG4gICAgICAgICAgICAgICAgbGVuLS07XG4gICAgICAgICAgICAgICAgKGZ1bmN0aW9uIChhKSB7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXZlKFwibWluYS5maW5pc2guXCIgKyBhLmlkLCBhKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfShhKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhLnVwZGF0ZSgpO1xuICAgICAgICB9XG4gICAgICAgIGxlbiAmJiByZXF1ZXN0QW5pbUZyYW1lKGZyYW1lKTtcbiAgICB9LFxuICAgIC8qXFxcbiAgICAgKiBtaW5hXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBHZW5lcmljIGFuaW1hdGlvbiBvZiBudW1iZXJzXG4gICAgICoqXG4gICAgIC0gYSAobnVtYmVyKSBzdGFydCBfc2xhdmVfIG51bWJlclxuICAgICAtIEEgKG51bWJlcikgZW5kIF9zbGF2ZV8gbnVtYmVyXG4gICAgIC0gYiAobnVtYmVyKSBzdGFydCBfbWFzdGVyXyBudW1iZXIgKHN0YXJ0IHRpbWUgaW4gZ2VuZXJhbCBjYXNlKVxuICAgICAtIEIgKG51bWJlcikgZW5kIF9tYXN0ZXJfIG51bWJlciAoZW5kIHRpbWUgaW4gZ2VyZWFsIGNhc2UpXG4gICAgIC0gZ2V0IChmdW5jdGlvbikgZ2V0dGVyIG9mIF9tYXN0ZXJfIG51bWJlciAoc2VlIEBtaW5hLnRpbWUpXG4gICAgIC0gc2V0IChmdW5jdGlvbikgc2V0dGVyIG9mIF9zbGF2ZV8gbnVtYmVyXG4gICAgIC0gZWFzaW5nIChmdW5jdGlvbikgI29wdGlvbmFsIGVhc2luZyBmdW5jdGlvbiwgZGVmYXVsdCBpcyBAbWluYS5saW5lYXJcbiAgICAgPSAob2JqZWN0KSBhbmltYXRpb24gZGVzY3JpcHRvclxuICAgICBvIHtcbiAgICAgbyAgICAgICAgIGlkIChzdHJpbmcpIGFuaW1hdGlvbiBpZCxcbiAgICAgbyAgICAgICAgIHN0YXJ0IChudW1iZXIpIHN0YXJ0IF9zbGF2ZV8gbnVtYmVyLFxuICAgICBvICAgICAgICAgZW5kIChudW1iZXIpIGVuZCBfc2xhdmVfIG51bWJlcixcbiAgICAgbyAgICAgICAgIGIgKG51bWJlcikgc3RhcnQgX21hc3Rlcl8gbnVtYmVyLFxuICAgICBvICAgICAgICAgcyAobnVtYmVyKSBhbmltYXRpb24gc3RhdHVzICgwLi4xKSxcbiAgICAgbyAgICAgICAgIGR1ciAobnVtYmVyKSBhbmltYXRpb24gZHVyYXRpb24sXG4gICAgIG8gICAgICAgICBzcGQgKG51bWJlcikgYW5pbWF0aW9uIHNwZWVkLFxuICAgICBvICAgICAgICAgZ2V0IChmdW5jdGlvbikgZ2V0dGVyIG9mIF9tYXN0ZXJfIG51bWJlciAoc2VlIEBtaW5hLnRpbWUpLFxuICAgICBvICAgICAgICAgc2V0IChmdW5jdGlvbikgc2V0dGVyIG9mIF9zbGF2ZV8gbnVtYmVyLFxuICAgICBvICAgICAgICAgZWFzaW5nIChmdW5jdGlvbikgZWFzaW5nIGZ1bmN0aW9uLCBkZWZhdWx0IGlzIEBtaW5hLmxpbmVhcixcbiAgICAgbyAgICAgICAgIHN0YXR1cyAoZnVuY3Rpb24pIHN0YXR1cyBnZXR0ZXIvc2V0dGVyLFxuICAgICBvICAgICAgICAgc3BlZWQgKGZ1bmN0aW9uKSBzcGVlZCBnZXR0ZXIvc2V0dGVyLFxuICAgICBvICAgICAgICAgZHVyYXRpb24gKGZ1bmN0aW9uKSBkdXJhdGlvbiBnZXR0ZXIvc2V0dGVyLFxuICAgICBvICAgICAgICAgc3RvcCAoZnVuY3Rpb24pIGFuaW1hdGlvbiBzdG9wcGVyXG4gICAgIG8gICAgICAgICBwYXVzZSAoZnVuY3Rpb24pIHBhdXNlcyB0aGUgYW5pbWF0aW9uXG4gICAgIG8gICAgICAgICByZXN1bWUgKGZ1bmN0aW9uKSByZXN1bWVzIHRoZSBhbmltYXRpb25cbiAgICAgbyAgICAgICAgIHVwZGF0ZSAoZnVuY3Rpb24pIGNhbGxlcyBzZXR0ZXIgd2l0aCB0aGUgcmlnaHQgdmFsdWUgb2YgdGhlIGFuaW1hdGlvblxuICAgICBvIH1cbiAgICBcXCovXG4gICAgbWluYSA9IGZ1bmN0aW9uIChhLCBBLCBiLCBCLCBnZXQsIHNldCwgZWFzaW5nKSB7XG4gICAgICAgIHZhciBhbmltID0ge1xuICAgICAgICAgICAgaWQ6IElEKCksXG4gICAgICAgICAgICBzdGFydDogYSxcbiAgICAgICAgICAgIGVuZDogQSxcbiAgICAgICAgICAgIGI6IGIsXG4gICAgICAgICAgICBzOiAwLFxuICAgICAgICAgICAgZHVyOiBCIC0gYixcbiAgICAgICAgICAgIHNwZDogMSxcbiAgICAgICAgICAgIGdldDogZ2V0LFxuICAgICAgICAgICAgc2V0OiBzZXQsXG4gICAgICAgICAgICBlYXNpbmc6IGVhc2luZyB8fCBtaW5hLmxpbmVhcixcbiAgICAgICAgICAgIHN0YXR1czogc3RhLFxuICAgICAgICAgICAgc3BlZWQ6IHNwZWVkLFxuICAgICAgICAgICAgZHVyYXRpb246IGR1cmF0aW9uLFxuICAgICAgICAgICAgc3RvcDogc3RvcGl0LFxuICAgICAgICAgICAgcGF1c2U6IHBhdXNlLFxuICAgICAgICAgICAgcmVzdW1lOiByZXN1bWUsXG4gICAgICAgICAgICB1cGRhdGU6IHVwZGF0ZVxuICAgICAgICB9O1xuICAgICAgICBhbmltYXRpb25zW2FuaW0uaWRdID0gYW5pbTtcbiAgICAgICAgdmFyIGxlbiA9IDAsIGk7XG4gICAgICAgIGZvciAoaSBpbiBhbmltYXRpb25zKSBpZiAoYW5pbWF0aW9ucy5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAgbGVuKys7XG4gICAgICAgICAgICBpZiAobGVuID09IDIpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsZW4gPT0gMSAmJiByZXF1ZXN0QW5pbUZyYW1lKGZyYW1lKTtcbiAgICAgICAgcmV0dXJuIGFuaW07XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogbWluYS50aW1lXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIHRoZSBjdXJyZW50IHRpbWUuIEVxdWl2YWxlbnQgdG86XG4gICAgIHwgZnVuY3Rpb24gKCkge1xuICAgICB8ICAgICByZXR1cm4gKG5ldyBEYXRlKS5nZXRUaW1lKCk7XG4gICAgIHwgfVxuICAgIFxcKi9cbiAgICBtaW5hLnRpbWUgPSB0aW1lcjtcbiAgICAvKlxcXG4gICAgICogbWluYS5nZXRCeUlkXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIGFuIGFuaW1hdGlvbiBieSBpdHMgaWRcbiAgICAgLSBpZCAoc3RyaW5nKSBhbmltYXRpb24ncyBpZFxuICAgICA9IChvYmplY3QpIFNlZSBAbWluYVxuICAgIFxcKi9cbiAgICBtaW5hLmdldEJ5SWQgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgcmV0dXJuIGFuaW1hdGlvbnNbaWRdIHx8IG51bGw7XG4gICAgfTtcblxuICAgIC8qXFxcbiAgICAgKiBtaW5hLmxpbmVhclxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogRGVmYXVsdCBsaW5lYXIgZWFzaW5nXG4gICAgIC0gbiAobnVtYmVyKSBpbnB1dCAwLi4xXG4gICAgID0gKG51bWJlcikgb3V0cHV0IDAuLjFcbiAgICBcXCovXG4gICAgbWluYS5saW5lYXIgPSBmdW5jdGlvbiAobikge1xuICAgICAgICByZXR1cm4gbjtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBtaW5hLmVhc2VvdXRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEVhc2VvdXQgZWFzaW5nXG4gICAgIC0gbiAobnVtYmVyKSBpbnB1dCAwLi4xXG4gICAgID0gKG51bWJlcikgb3V0cHV0IDAuLjFcbiAgICBcXCovXG4gICAgbWluYS5lYXNlb3V0ID0gZnVuY3Rpb24gKG4pIHtcbiAgICAgICAgcmV0dXJuIE1hdGgucG93KG4sIDEuNyk7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogbWluYS5lYXNlaW5cbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEVhc2VpbiBlYXNpbmdcbiAgICAgLSBuIChudW1iZXIpIGlucHV0IDAuLjFcbiAgICAgPSAobnVtYmVyKSBvdXRwdXQgMC4uMVxuICAgIFxcKi9cbiAgICBtaW5hLmVhc2VpbiA9IGZ1bmN0aW9uIChuKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnBvdyhuLCAuNDgpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIG1pbmEuZWFzZWlub3V0XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBFYXNlaW5vdXQgZWFzaW5nXG4gICAgIC0gbiAobnVtYmVyKSBpbnB1dCAwLi4xXG4gICAgID0gKG51bWJlcikgb3V0cHV0IDAuLjFcbiAgICBcXCovXG4gICAgbWluYS5lYXNlaW5vdXQgPSBmdW5jdGlvbiAobikge1xuICAgICAgICBpZiAobiA9PSAxKSB7XG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobiA9PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcSA9IC40OCAtIG4gLyAxLjA0LFxuICAgICAgICAgICAgUSA9IE1hdGguc3FydCguMTczNCArIHEgKiBxKSxcbiAgICAgICAgICAgIHggPSBRIC0gcSxcbiAgICAgICAgICAgIFggPSBNYXRoLnBvdyhNYXRoLmFicyh4KSwgMSAvIDMpICogKHggPCAwID8gLTEgOiAxKSxcbiAgICAgICAgICAgIHkgPSAtUSAtIHEsXG4gICAgICAgICAgICBZID0gTWF0aC5wb3coTWF0aC5hYnMoeSksIDEgLyAzKSAqICh5IDwgMCA/IC0xIDogMSksXG4gICAgICAgICAgICB0ID0gWCArIFkgKyAuNTtcbiAgICAgICAgcmV0dXJuICgxIC0gdCkgKiAzICogdCAqIHQgKyB0ICogdCAqIHQ7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogbWluYS5iYWNraW5cbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEJhY2tpbiBlYXNpbmdcbiAgICAgLSBuIChudW1iZXIpIGlucHV0IDAuLjFcbiAgICAgPSAobnVtYmVyKSBvdXRwdXQgMC4uMVxuICAgIFxcKi9cbiAgICBtaW5hLmJhY2tpbiA9IGZ1bmN0aW9uIChuKSB7XG4gICAgICAgIGlmIChuID09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzID0gMS43MDE1ODtcbiAgICAgICAgcmV0dXJuIG4gKiBuICogKChzICsgMSkgKiBuIC0gcyk7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogbWluYS5iYWNrb3V0XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBCYWNrb3V0IGVhc2luZ1xuICAgICAtIG4gKG51bWJlcikgaW5wdXQgMC4uMVxuICAgICA9IChudW1iZXIpIG91dHB1dCAwLi4xXG4gICAgXFwqL1xuICAgIG1pbmEuYmFja291dCA9IGZ1bmN0aW9uIChuKSB7XG4gICAgICAgIGlmIChuID09IDApIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG4gICAgICAgIG4gPSBuIC0gMTtcbiAgICAgICAgdmFyIHMgPSAxLjcwMTU4O1xuICAgICAgICByZXR1cm4gbiAqIG4gKiAoKHMgKyAxKSAqIG4gKyBzKSArIDE7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogbWluYS5lbGFzdGljXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBFbGFzdGljIGVhc2luZ1xuICAgICAtIG4gKG51bWJlcikgaW5wdXQgMC4uMVxuICAgICA9IChudW1iZXIpIG91dHB1dCAwLi4xXG4gICAgXFwqL1xuICAgIG1pbmEuZWxhc3RpYyA9IGZ1bmN0aW9uIChuKSB7XG4gICAgICAgIGlmIChuID09ICEhbikge1xuICAgICAgICAgICAgcmV0dXJuIG47XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIE1hdGgucG93KDIsIC0xMCAqIG4pICogTWF0aC5zaW4oKG4gLSAuMDc1KSAqXG4gICAgICAgICAgICAoMiAqIE1hdGguUEkpIC8gLjMpICsgMTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBtaW5hLmJvdW5jZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQm91bmNlIGVhc2luZ1xuICAgICAtIG4gKG51bWJlcikgaW5wdXQgMC4uMVxuICAgICA9IChudW1iZXIpIG91dHB1dCAwLi4xXG4gICAgXFwqL1xuICAgIG1pbmEuYm91bmNlID0gZnVuY3Rpb24gKG4pIHtcbiAgICAgICAgdmFyIHMgPSA3LjU2MjUsXG4gICAgICAgICAgICBwID0gMi43NSxcbiAgICAgICAgICAgIGw7XG4gICAgICAgIGlmIChuIDwgKDEgLyBwKSkge1xuICAgICAgICAgICAgbCA9IHMgKiBuICogbjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChuIDwgKDIgLyBwKSkge1xuICAgICAgICAgICAgICAgIG4gLT0gKDEuNSAvIHApO1xuICAgICAgICAgICAgICAgIGwgPSBzICogbiAqIG4gKyAuNzU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChuIDwgKDIuNSAvIHApKSB7XG4gICAgICAgICAgICAgICAgICAgIG4gLT0gKDIuMjUgLyBwKTtcbiAgICAgICAgICAgICAgICAgICAgbCA9IHMgKiBuICogbiArIC45Mzc1O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG4gLT0gKDIuNjI1IC8gcCk7XG4gICAgICAgICAgICAgICAgICAgIGwgPSBzICogbiAqIG4gKyAuOTg0Mzc1O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbDtcbiAgICB9O1xuICAgIHdpbmRvdy5taW5hID0gbWluYTtcbiAgICByZXR1cm4gbWluYTtcbn0pKHR5cGVvZiBldmUgPT0gXCJ1bmRlZmluZWRcIiA/IGZ1bmN0aW9uICgpIHt9IDogZXZlKTtcbi8vIENvcHlyaWdodCAoYykgMjAxMyAtIDIwMTUgQWRvYmUgU3lzdGVtcyBJbmNvcnBvcmF0ZWQuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBcbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vIFxuLy8gaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vLyBcbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5cbnZhciBTbmFwID0gKGZ1bmN0aW9uKHJvb3QpIHtcblNuYXAudmVyc2lvbiA9IFwiMC40LjBcIjtcbi8qXFxcbiAqIFNuYXBcbiBbIG1ldGhvZCBdXG4gKipcbiAqIENyZWF0ZXMgYSBkcmF3aW5nIHN1cmZhY2Ugb3Igd3JhcHMgZXhpc3RpbmcgU1ZHIGVsZW1lbnQuXG4gKipcbiAtIHdpZHRoIChudW1iZXJ8c3RyaW5nKSB3aWR0aCBvZiBzdXJmYWNlXG4gLSBoZWlnaHQgKG51bWJlcnxzdHJpbmcpIGhlaWdodCBvZiBzdXJmYWNlXG4gKiBvclxuIC0gRE9NIChTVkdFbGVtZW50KSBlbGVtZW50IHRvIGJlIHdyYXBwZWQgaW50byBTbmFwIHN0cnVjdHVyZVxuICogb3JcbiAtIGFycmF5IChhcnJheSkgYXJyYXkgb2YgZWxlbWVudHMgKHdpbGwgcmV0dXJuIHNldCBvZiBlbGVtZW50cylcbiAqIG9yXG4gLSBxdWVyeSAoc3RyaW5nKSBDU1MgcXVlcnkgc2VsZWN0b3JcbiA9IChvYmplY3QpIEBFbGVtZW50XG5cXCovXG5mdW5jdGlvbiBTbmFwKHcsIGgpIHtcbiAgICBpZiAodykge1xuICAgICAgICBpZiAody5ub2RlVHlwZSkge1xuICAgICAgICAgICAgcmV0dXJuIHdyYXAodyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzKHcsIFwiYXJyYXlcIikgJiYgU25hcC5zZXQpIHtcbiAgICAgICAgICAgIHJldHVybiBTbmFwLnNldC5hcHBseShTbmFwLCB3KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodyBpbnN0YW5jZW9mIEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybiB3O1xuICAgICAgICB9XG4gICAgICAgIGlmIChoID09IG51bGwpIHtcbiAgICAgICAgICAgIHcgPSBnbG9iLmRvYy5xdWVyeVNlbGVjdG9yKFN0cmluZyh3KSk7XG4gICAgICAgICAgICByZXR1cm4gd3JhcCh3KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB3ID0gdyA9PSBudWxsID8gXCIxMDAlXCIgOiB3O1xuICAgIGggPSBoID09IG51bGwgPyBcIjEwMCVcIiA6IGg7XG4gICAgcmV0dXJuIG5ldyBQYXBlcih3LCBoKTtcbn1cblNuYXAudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFwiU25hcCB2XCIgKyB0aGlzLnZlcnNpb247XG59O1xuU25hcC5fID0ge307XG52YXIgZ2xvYiA9IHtcbiAgICB3aW46IHJvb3Qud2luZG93LFxuICAgIGRvYzogcm9vdC53aW5kb3cuZG9jdW1lbnRcbn07XG5TbmFwLl8uZ2xvYiA9IGdsb2I7XG52YXIgaGFzID0gXCJoYXNPd25Qcm9wZXJ0eVwiLFxuICAgIFN0ciA9IFN0cmluZyxcbiAgICB0b0Zsb2F0ID0gcGFyc2VGbG9hdCxcbiAgICB0b0ludCA9IHBhcnNlSW50LFxuICAgIG1hdGggPSBNYXRoLFxuICAgIG1tYXggPSBtYXRoLm1heCxcbiAgICBtbWluID0gbWF0aC5taW4sXG4gICAgYWJzID0gbWF0aC5hYnMsXG4gICAgcG93ID0gbWF0aC5wb3csXG4gICAgUEkgPSBtYXRoLlBJLFxuICAgIHJvdW5kID0gbWF0aC5yb3VuZCxcbiAgICBFID0gXCJcIixcbiAgICBTID0gXCIgXCIsXG4gICAgb2JqZWN0VG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLFxuICAgIElTVVJMID0gL151cmxcXChbJ1wiXT8oW15cXCldKz8pWydcIl0/XFwpJC9pLFxuICAgIGNvbG91clJlZ0V4cCA9IC9eXFxzKigoI1thLWZcXGRdezZ9KXwoI1thLWZcXGRdezN9KXxyZ2JhP1xcKFxccyooW1xcZFxcLl0rJT9cXHMqLFxccypbXFxkXFwuXSslP1xccyosXFxzKltcXGRcXC5dKyU/KD86XFxzKixcXHMqW1xcZFxcLl0rJT8pPylcXHMqXFwpfGhzYmE/XFwoXFxzKihbXFxkXFwuXSsoPzpkZWd8XFx4YjB8JSk/XFxzKixcXHMqW1xcZFxcLl0rJT9cXHMqLFxccypbXFxkXFwuXSsoPzolP1xccyosXFxzKltcXGRcXC5dKyk/JT8pXFxzKlxcKXxoc2xhP1xcKFxccyooW1xcZFxcLl0rKD86ZGVnfFxceGIwfCUpP1xccyosXFxzKltcXGRcXC5dKyU/XFxzKixcXHMqW1xcZFxcLl0rKD86JT9cXHMqLFxccypbXFxkXFwuXSspPyU/KVxccypcXCkpXFxzKiQvaSxcbiAgICBiZXppZXJyZyA9IC9eKD86Y3ViaWMtKT9iZXppZXJcXCgoW14sXSspLChbXixdKyksKFteLF0rKSwoW15cXCldKylcXCkvLFxuICAgIHJlVVJMVmFsdWUgPSAvXnVybFxcKCM/KFteKV0rKVxcKSQvLFxuICAgIHNlcGFyYXRvciA9IFNuYXAuXy5zZXBhcmF0b3IgPSAvWyxcXHNdKy8sXG4gICAgd2hpdGVzcGFjZSA9IC9bXFxzXS9nLFxuICAgIGNvbW1hU3BhY2VzID0gL1tcXHNdKixbXFxzXSovLFxuICAgIGhzcmcgPSB7aHM6IDEsIHJnOiAxfSxcbiAgICBwYXRoQ29tbWFuZCA9IC8oW2Etel0pW1xccyxdKigoLT9cXGQqXFwuP1xcZCooPzplW1xcLStdP1xcZCspP1tcXHNdKiw/W1xcc10qKSspL2lnLFxuICAgIHRDb21tYW5kID0gLyhbcnN0bV0pW1xccyxdKigoLT9cXGQqXFwuP1xcZCooPzplW1xcLStdP1xcZCspP1tcXHNdKiw/W1xcc10qKSspL2lnLFxuICAgIHBhdGhWYWx1ZXMgPSAvKC0/XFxkKlxcLj9cXGQqKD86ZVtcXC0rXT9cXFxcZCspPylbXFxzXSosP1tcXHNdKi9pZyxcbiAgICBpZGdlbiA9IDAsXG4gICAgaWRwcmVmaXggPSBcIlNcIiArICgrbmV3IERhdGUpLnRvU3RyaW5nKDM2KSxcbiAgICBJRCA9IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICByZXR1cm4gKGVsICYmIGVsLnR5cGUgPyBlbC50eXBlIDogRSkgKyBpZHByZWZpeCArIChpZGdlbisrKS50b1N0cmluZygzNik7XG4gICAgfSxcbiAgICB4bGluayA9IFwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiLFxuICAgIHhtbG5zID0gXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLFxuICAgIGh1YiA9IHt9LFxuICAgIFVSTCA9IFNuYXAudXJsID0gZnVuY3Rpb24gKHVybCkge1xuICAgICAgICByZXR1cm4gXCJ1cmwoJyNcIiArIHVybCArIFwiJylcIjtcbiAgICB9O1xuXG5mdW5jdGlvbiAkKGVsLCBhdHRyKSB7XG4gICAgaWYgKGF0dHIpIHtcbiAgICAgICAgaWYgKGVsID09IFwiI3RleHRcIikge1xuICAgICAgICAgICAgZWwgPSBnbG9iLmRvYy5jcmVhdGVUZXh0Tm9kZShhdHRyLnRleHQgfHwgYXR0cltcIiN0ZXh0XCJdIHx8IFwiXCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChlbCA9PSBcIiNjb21tZW50XCIpIHtcbiAgICAgICAgICAgIGVsID0gZ2xvYi5kb2MuY3JlYXRlQ29tbWVudChhdHRyLnRleHQgfHwgYXR0cltcIiN0ZXh0XCJdIHx8IFwiXCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgZWwgPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgZWwgPSAkKGVsKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGF0dHIgPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgaWYgKGVsLm5vZGVUeXBlID09IDEpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXR0ci5zdWJzdHJpbmcoMCwgNikgPT0gXCJ4bGluazpcIikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZWwuZ2V0QXR0cmlidXRlTlMoeGxpbmssIGF0dHIuc3Vic3RyaW5nKDYpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGF0dHIuc3Vic3RyaW5nKDAsIDQpID09IFwieG1sOlwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlbC5nZXRBdHRyaWJ1dGVOUyh4bWxucywgYXR0ci5zdWJzdHJpbmcoNCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZWwuZ2V0QXR0cmlidXRlKGF0dHIpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChhdHRyID09IFwidGV4dFwiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsLm5vZGVWYWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVsLm5vZGVUeXBlID09IDEpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBhdHRyKSBpZiAoYXR0cltoYXNdKGtleSkpIHtcbiAgICAgICAgICAgICAgICB2YXIgdmFsID0gU3RyKGF0dHJba2V5XSk7XG4gICAgICAgICAgICAgICAgaWYgKHZhbCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5LnN1YnN0cmluZygwLCA2KSA9PSBcInhsaW5rOlwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbC5zZXRBdHRyaWJ1dGVOUyh4bGluaywga2V5LnN1YnN0cmluZyg2KSwgdmFsKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChrZXkuc3Vic3RyaW5nKDAsIDQpID09IFwieG1sOlwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbC5zZXRBdHRyaWJ1dGVOUyh4bWxucywga2V5LnN1YnN0cmluZyg0KSwgdmFsKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsLnNldEF0dHJpYnV0ZShrZXksIHZhbCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBlbC5yZW1vdmVBdHRyaWJ1dGUoa2V5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoXCJ0ZXh0XCIgaW4gYXR0cikge1xuICAgICAgICAgICAgZWwubm9kZVZhbHVlID0gYXR0ci50ZXh0O1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZWwgPSBnbG9iLmRvYy5jcmVhdGVFbGVtZW50TlMoeG1sbnMsIGVsKTtcbiAgICB9XG4gICAgcmV0dXJuIGVsO1xufVxuU25hcC5fLiQgPSAkO1xuU25hcC5fLmlkID0gSUQ7XG5mdW5jdGlvbiBnZXRBdHRycyhlbCkge1xuICAgIHZhciBhdHRycyA9IGVsLmF0dHJpYnV0ZXMsXG4gICAgICAgIG5hbWUsXG4gICAgICAgIG91dCA9IHt9O1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXR0cnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGF0dHJzW2ldLm5hbWVzcGFjZVVSSSA9PSB4bGluaykge1xuICAgICAgICAgICAgbmFtZSA9IFwieGxpbms6XCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBuYW1lID0gXCJcIjtcbiAgICAgICAgfVxuICAgICAgICBuYW1lICs9IGF0dHJzW2ldLm5hbWU7XG4gICAgICAgIG91dFtuYW1lXSA9IGF0dHJzW2ldLnRleHRDb250ZW50O1xuICAgIH1cbiAgICByZXR1cm4gb3V0O1xufVxuZnVuY3Rpb24gaXMobywgdHlwZSkge1xuICAgIHR5cGUgPSBTdHIucHJvdG90eXBlLnRvTG93ZXJDYXNlLmNhbGwodHlwZSk7XG4gICAgaWYgKHR5cGUgPT0gXCJmaW5pdGVcIikge1xuICAgICAgICByZXR1cm4gaXNGaW5pdGUobyk7XG4gICAgfVxuICAgIGlmICh0eXBlID09IFwiYXJyYXlcIiAmJlxuICAgICAgICAobyBpbnN0YW5jZW9mIEFycmF5IHx8IEFycmF5LmlzQXJyYXkgJiYgQXJyYXkuaXNBcnJheShvKSkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiAgKHR5cGUgPT0gXCJudWxsXCIgJiYgbyA9PT0gbnVsbCkgfHxcbiAgICAgICAgICAgICh0eXBlID09IHR5cGVvZiBvICYmIG8gIT09IG51bGwpIHx8XG4gICAgICAgICAgICAodHlwZSA9PSBcIm9iamVjdFwiICYmIG8gPT09IE9iamVjdChvKSkgfHxcbiAgICAgICAgICAgIG9iamVjdFRvU3RyaW5nLmNhbGwobykuc2xpY2UoOCwgLTEpLnRvTG93ZXJDYXNlKCkgPT0gdHlwZTtcbn1cbi8qXFxcbiAqIFNuYXAuZm9ybWF0XG4gWyBtZXRob2QgXVxuICoqXG4gKiBSZXBsYWNlcyBjb25zdHJ1Y3Rpb24gb2YgdHlwZSBgezxuYW1lPn1gIHRvIHRoZSBjb3JyZXNwb25kaW5nIGFyZ3VtZW50XG4gKipcbiAtIHRva2VuIChzdHJpbmcpIHN0cmluZyB0byBmb3JtYXRcbiAtIGpzb24gKG9iamVjdCkgb2JqZWN0IHdoaWNoIHByb3BlcnRpZXMgYXJlIHVzZWQgYXMgYSByZXBsYWNlbWVudFxuID0gKHN0cmluZykgZm9ybWF0dGVkIHN0cmluZ1xuID4gVXNhZ2VcbiB8IC8vIHRoaXMgZHJhd3MgYSByZWN0YW5ndWxhciBzaGFwZSBlcXVpdmFsZW50IHRvIFwiTTEwLDIwaDQwdjUwaC00MHpcIlxuIHwgcGFwZXIucGF0aChTbmFwLmZvcm1hdChcIk17eH0se3l9aHtkaW0ud2lkdGh9dntkaW0uaGVpZ2h0fWh7ZGltWyduZWdhdGl2ZSB3aWR0aCddfXpcIiwge1xuIHwgICAgIHg6IDEwLFxuIHwgICAgIHk6IDIwLFxuIHwgICAgIGRpbToge1xuIHwgICAgICAgICB3aWR0aDogNDAsXG4gfCAgICAgICAgIGhlaWdodDogNTAsXG4gfCAgICAgICAgIFwibmVnYXRpdmUgd2lkdGhcIjogLTQwXG4gfCAgICAgfVxuIHwgfSkpO1xuXFwqL1xuU25hcC5mb3JtYXQgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciB0b2tlblJlZ2V4ID0gL1xceyhbXlxcfV0rKVxcfS9nLFxuICAgICAgICBvYmpOb3RhdGlvblJlZ2V4ID0gLyg/Oig/Ol58XFwuKSguKz8pKD89XFxbfFxcLnwkfFxcKCl8XFxbKCd8XCIpKC4rPylcXDJcXF0pKFxcKFxcKSk/L2csIC8vIG1hdGNoZXMgLnh4eHh4IG9yIFtcInh4eHh4XCJdIHRvIHJ1biBvdmVyIG9iamVjdCBwcm9wZXJ0aWVzXG4gICAgICAgIHJlcGxhY2VyID0gZnVuY3Rpb24gKGFsbCwga2V5LCBvYmopIHtcbiAgICAgICAgICAgIHZhciByZXMgPSBvYmo7XG4gICAgICAgICAgICBrZXkucmVwbGFjZShvYmpOb3RhdGlvblJlZ2V4LCBmdW5jdGlvbiAoYWxsLCBuYW1lLCBxdW90ZSwgcXVvdGVkTmFtZSwgaXNGdW5jKSB7XG4gICAgICAgICAgICAgICAgbmFtZSA9IG5hbWUgfHwgcXVvdGVkTmFtZTtcbiAgICAgICAgICAgICAgICBpZiAocmVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChuYW1lIGluIHJlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzID0gcmVzW25hbWVdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHR5cGVvZiByZXMgPT0gXCJmdW5jdGlvblwiICYmIGlzRnVuYyAmJiAocmVzID0gcmVzKCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmVzID0gKHJlcyA9PSBudWxsIHx8IHJlcyA9PSBvYmogPyBhbGwgOiByZXMpICsgXCJcIjtcbiAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgIH07XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChzdHIsIG9iaikge1xuICAgICAgICByZXR1cm4gU3RyKHN0cikucmVwbGFjZSh0b2tlblJlZ2V4LCBmdW5jdGlvbiAoYWxsLCBrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiByZXBsYWNlcihhbGwsIGtleSwgb2JqKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbn0pKCk7XG5mdW5jdGlvbiBjbG9uZShvYmopIHtcbiAgICBpZiAodHlwZW9mIG9iaiA9PSBcImZ1bmN0aW9uXCIgfHwgT2JqZWN0KG9iaikgIT09IG9iaikge1xuICAgICAgICByZXR1cm4gb2JqO1xuICAgIH1cbiAgICB2YXIgcmVzID0gbmV3IG9iai5jb25zdHJ1Y3RvcjtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSBpZiAob2JqW2hhc10oa2V5KSkge1xuICAgICAgICByZXNba2V5XSA9IGNsb25lKG9ialtrZXldKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbn1cblNuYXAuXy5jbG9uZSA9IGNsb25lO1xuZnVuY3Rpb24gcmVwdXNoKGFycmF5LCBpdGVtKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGlpID0gYXJyYXkubGVuZ3RoOyBpIDwgaWk7IGkrKykgaWYgKGFycmF5W2ldID09PSBpdGVtKSB7XG4gICAgICAgIHJldHVybiBhcnJheS5wdXNoKGFycmF5LnNwbGljZShpLCAxKVswXSk7XG4gICAgfVxufVxuZnVuY3Rpb24gY2FjaGVyKGYsIHNjb3BlLCBwb3N0cHJvY2Vzc29yKSB7XG4gICAgZnVuY3Rpb24gbmV3ZigpIHtcbiAgICAgICAgdmFyIGFyZyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCksXG4gICAgICAgICAgICBhcmdzID0gYXJnLmpvaW4oXCJcXHUyNDAwXCIpLFxuICAgICAgICAgICAgY2FjaGUgPSBuZXdmLmNhY2hlID0gbmV3Zi5jYWNoZSB8fCB7fSxcbiAgICAgICAgICAgIGNvdW50ID0gbmV3Zi5jb3VudCA9IG5ld2YuY291bnQgfHwgW107XG4gICAgICAgIGlmIChjYWNoZVtoYXNdKGFyZ3MpKSB7XG4gICAgICAgICAgICByZXB1c2goY291bnQsIGFyZ3MpO1xuICAgICAgICAgICAgcmV0dXJuIHBvc3Rwcm9jZXNzb3IgPyBwb3N0cHJvY2Vzc29yKGNhY2hlW2FyZ3NdKSA6IGNhY2hlW2FyZ3NdO1xuICAgICAgICB9XG4gICAgICAgIGNvdW50Lmxlbmd0aCA+PSAxZTMgJiYgZGVsZXRlIGNhY2hlW2NvdW50LnNoaWZ0KCldO1xuICAgICAgICBjb3VudC5wdXNoKGFyZ3MpO1xuICAgICAgICBjYWNoZVthcmdzXSA9IGYuYXBwbHkoc2NvcGUsIGFyZyk7XG4gICAgICAgIHJldHVybiBwb3N0cHJvY2Vzc29yID8gcG9zdHByb2Nlc3NvcihjYWNoZVthcmdzXSkgOiBjYWNoZVthcmdzXTtcbiAgICB9XG4gICAgcmV0dXJuIG5ld2Y7XG59XG5TbmFwLl8uY2FjaGVyID0gY2FjaGVyO1xuZnVuY3Rpb24gYW5nbGUoeDEsIHkxLCB4MiwgeTIsIHgzLCB5Mykge1xuICAgIGlmICh4MyA9PSBudWxsKSB7XG4gICAgICAgIHZhciB4ID0geDEgLSB4MixcbiAgICAgICAgICAgIHkgPSB5MSAtIHkyO1xuICAgICAgICBpZiAoIXggJiYgIXkpIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAoMTgwICsgbWF0aC5hdGFuMigteSwgLXgpICogMTgwIC8gUEkgKyAzNjApICUgMzYwO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBhbmdsZSh4MSwgeTEsIHgzLCB5MykgLSBhbmdsZSh4MiwgeTIsIHgzLCB5Myk7XG4gICAgfVxufVxuZnVuY3Rpb24gcmFkKGRlZykge1xuICAgIHJldHVybiBkZWcgJSAzNjAgKiBQSSAvIDE4MDtcbn1cbmZ1bmN0aW9uIGRlZyhyYWQpIHtcbiAgICByZXR1cm4gcmFkICogMTgwIC8gUEkgJSAzNjA7XG59XG5mdW5jdGlvbiB4X3koKSB7XG4gICAgcmV0dXJuIHRoaXMueCArIFMgKyB0aGlzLnk7XG59XG5mdW5jdGlvbiB4X3lfd19oKCkge1xuICAgIHJldHVybiB0aGlzLnggKyBTICsgdGhpcy55ICsgUyArIHRoaXMud2lkdGggKyBcIiBcXHhkNyBcIiArIHRoaXMuaGVpZ2h0O1xufVxuXG4vKlxcXG4gKiBTbmFwLnJhZFxuIFsgbWV0aG9kIF1cbiAqKlxuICogVHJhbnNmb3JtIGFuZ2xlIHRvIHJhZGlhbnNcbiAtIGRlZyAobnVtYmVyKSBhbmdsZSBpbiBkZWdyZWVzXG4gPSAobnVtYmVyKSBhbmdsZSBpbiByYWRpYW5zXG5cXCovXG5TbmFwLnJhZCA9IHJhZDtcbi8qXFxcbiAqIFNuYXAuZGVnXG4gWyBtZXRob2QgXVxuICoqXG4gKiBUcmFuc2Zvcm0gYW5nbGUgdG8gZGVncmVlc1xuIC0gcmFkIChudW1iZXIpIGFuZ2xlIGluIHJhZGlhbnNcbiA9IChudW1iZXIpIGFuZ2xlIGluIGRlZ3JlZXNcblxcKi9cblNuYXAuZGVnID0gZGVnO1xuLypcXFxuICogU25hcC5zaW5cbiBbIG1ldGhvZCBdXG4gKipcbiAqIEVxdWl2YWxlbnQgdG8gYE1hdGguc2luKClgIG9ubHkgd29ya3Mgd2l0aCBkZWdyZWVzLCBub3QgcmFkaWFucy5cbiAtIGFuZ2xlIChudW1iZXIpIGFuZ2xlIGluIGRlZ3JlZXNcbiA9IChudW1iZXIpIHNpblxuXFwqL1xuU25hcC5zaW4gPSBmdW5jdGlvbiAoYW5nbGUpIHtcbiAgICByZXR1cm4gbWF0aC5zaW4oU25hcC5yYWQoYW5nbGUpKTtcbn07XG4vKlxcXG4gKiBTbmFwLnRhblxuIFsgbWV0aG9kIF1cbiAqKlxuICogRXF1aXZhbGVudCB0byBgTWF0aC50YW4oKWAgb25seSB3b3JrcyB3aXRoIGRlZ3JlZXMsIG5vdCByYWRpYW5zLlxuIC0gYW5nbGUgKG51bWJlcikgYW5nbGUgaW4gZGVncmVlc1xuID0gKG51bWJlcikgdGFuXG5cXCovXG5TbmFwLnRhbiA9IGZ1bmN0aW9uIChhbmdsZSkge1xuICAgIHJldHVybiBtYXRoLnRhbihTbmFwLnJhZChhbmdsZSkpO1xufTtcbi8qXFxcbiAqIFNuYXAuY29zXG4gWyBtZXRob2QgXVxuICoqXG4gKiBFcXVpdmFsZW50IHRvIGBNYXRoLmNvcygpYCBvbmx5IHdvcmtzIHdpdGggZGVncmVlcywgbm90IHJhZGlhbnMuXG4gLSBhbmdsZSAobnVtYmVyKSBhbmdsZSBpbiBkZWdyZWVzXG4gPSAobnVtYmVyKSBjb3NcblxcKi9cblNuYXAuY29zID0gZnVuY3Rpb24gKGFuZ2xlKSB7XG4gICAgcmV0dXJuIG1hdGguY29zKFNuYXAucmFkKGFuZ2xlKSk7XG59O1xuLypcXFxuICogU25hcC5hc2luXG4gWyBtZXRob2QgXVxuICoqXG4gKiBFcXVpdmFsZW50IHRvIGBNYXRoLmFzaW4oKWAgb25seSB3b3JrcyB3aXRoIGRlZ3JlZXMsIG5vdCByYWRpYW5zLlxuIC0gbnVtIChudW1iZXIpIHZhbHVlXG4gPSAobnVtYmVyKSBhc2luIGluIGRlZ3JlZXNcblxcKi9cblNuYXAuYXNpbiA9IGZ1bmN0aW9uIChudW0pIHtcbiAgICByZXR1cm4gU25hcC5kZWcobWF0aC5hc2luKG51bSkpO1xufTtcbi8qXFxcbiAqIFNuYXAuYWNvc1xuIFsgbWV0aG9kIF1cbiAqKlxuICogRXF1aXZhbGVudCB0byBgTWF0aC5hY29zKClgIG9ubHkgd29ya3Mgd2l0aCBkZWdyZWVzLCBub3QgcmFkaWFucy5cbiAtIG51bSAobnVtYmVyKSB2YWx1ZVxuID0gKG51bWJlcikgYWNvcyBpbiBkZWdyZWVzXG5cXCovXG5TbmFwLmFjb3MgPSBmdW5jdGlvbiAobnVtKSB7XG4gICAgcmV0dXJuIFNuYXAuZGVnKG1hdGguYWNvcyhudW0pKTtcbn07XG4vKlxcXG4gKiBTbmFwLmF0YW5cbiBbIG1ldGhvZCBdXG4gKipcbiAqIEVxdWl2YWxlbnQgdG8gYE1hdGguYXRhbigpYCBvbmx5IHdvcmtzIHdpdGggZGVncmVlcywgbm90IHJhZGlhbnMuXG4gLSBudW0gKG51bWJlcikgdmFsdWVcbiA9IChudW1iZXIpIGF0YW4gaW4gZGVncmVlc1xuXFwqL1xuU25hcC5hdGFuID0gZnVuY3Rpb24gKG51bSkge1xuICAgIHJldHVybiBTbmFwLmRlZyhtYXRoLmF0YW4obnVtKSk7XG59O1xuLypcXFxuICogU25hcC5hdGFuMlxuIFsgbWV0aG9kIF1cbiAqKlxuICogRXF1aXZhbGVudCB0byBgTWF0aC5hdGFuMigpYCBvbmx5IHdvcmtzIHdpdGggZGVncmVlcywgbm90IHJhZGlhbnMuXG4gLSBudW0gKG51bWJlcikgdmFsdWVcbiA9IChudW1iZXIpIGF0YW4yIGluIGRlZ3JlZXNcblxcKi9cblNuYXAuYXRhbjIgPSBmdW5jdGlvbiAobnVtKSB7XG4gICAgcmV0dXJuIFNuYXAuZGVnKG1hdGguYXRhbjIobnVtKSk7XG59O1xuLypcXFxuICogU25hcC5hbmdsZVxuIFsgbWV0aG9kIF1cbiAqKlxuICogUmV0dXJucyBhbiBhbmdsZSBiZXR3ZWVuIHR3byBvciB0aHJlZSBwb2ludHNcbiA+IFBhcmFtZXRlcnNcbiAtIHgxIChudW1iZXIpIHggY29vcmQgb2YgZmlyc3QgcG9pbnRcbiAtIHkxIChudW1iZXIpIHkgY29vcmQgb2YgZmlyc3QgcG9pbnRcbiAtIHgyIChudW1iZXIpIHggY29vcmQgb2Ygc2Vjb25kIHBvaW50XG4gLSB5MiAobnVtYmVyKSB5IGNvb3JkIG9mIHNlY29uZCBwb2ludFxuIC0geDMgKG51bWJlcikgI29wdGlvbmFsIHggY29vcmQgb2YgdGhpcmQgcG9pbnRcbiAtIHkzIChudW1iZXIpICNvcHRpb25hbCB5IGNvb3JkIG9mIHRoaXJkIHBvaW50XG4gPSAobnVtYmVyKSBhbmdsZSBpbiBkZWdyZWVzXG5cXCovXG5TbmFwLmFuZ2xlID0gYW5nbGU7XG4vKlxcXG4gKiBTbmFwLmxlblxuIFsgbWV0aG9kIF1cbiAqKlxuICogUmV0dXJucyBkaXN0YW5jZSBiZXR3ZWVuIHR3byBwb2ludHNcbiA+IFBhcmFtZXRlcnNcbiAtIHgxIChudW1iZXIpIHggY29vcmQgb2YgZmlyc3QgcG9pbnRcbiAtIHkxIChudW1iZXIpIHkgY29vcmQgb2YgZmlyc3QgcG9pbnRcbiAtIHgyIChudW1iZXIpIHggY29vcmQgb2Ygc2Vjb25kIHBvaW50XG4gLSB5MiAobnVtYmVyKSB5IGNvb3JkIG9mIHNlY29uZCBwb2ludFxuID0gKG51bWJlcikgZGlzdGFuY2VcblxcKi9cblNuYXAubGVuID0gZnVuY3Rpb24gKHgxLCB5MSwgeDIsIHkyKSB7XG4gICAgcmV0dXJuIE1hdGguc3FydChTbmFwLmxlbjIoeDEsIHkxLCB4MiwgeTIpKTtcbn07XG4vKlxcXG4gKiBTbmFwLmxlbjJcbiBbIG1ldGhvZCBdXG4gKipcbiAqIFJldHVybnMgc3F1YXJlZCBkaXN0YW5jZSBiZXR3ZWVuIHR3byBwb2ludHNcbiA+IFBhcmFtZXRlcnNcbiAtIHgxIChudW1iZXIpIHggY29vcmQgb2YgZmlyc3QgcG9pbnRcbiAtIHkxIChudW1iZXIpIHkgY29vcmQgb2YgZmlyc3QgcG9pbnRcbiAtIHgyIChudW1iZXIpIHggY29vcmQgb2Ygc2Vjb25kIHBvaW50XG4gLSB5MiAobnVtYmVyKSB5IGNvb3JkIG9mIHNlY29uZCBwb2ludFxuID0gKG51bWJlcikgZGlzdGFuY2VcblxcKi9cblNuYXAubGVuMiA9IGZ1bmN0aW9uICh4MSwgeTEsIHgyLCB5Mikge1xuICAgIHJldHVybiAoeDEgLSB4MikgKiAoeDEgLSB4MikgKyAoeTEgLSB5MikgKiAoeTEgLSB5Mik7XG59O1xuLypcXFxuICogU25hcC5jbG9zZXN0UG9pbnRcbiBbIG1ldGhvZCBdXG4gKipcbiAqIFJldHVybnMgY2xvc2VzdCBwb2ludCB0byBhIGdpdmVuIG9uZSBvbiBhIGdpdmVuIHBhdGguXG4gPiBQYXJhbWV0ZXJzXG4gLSBwYXRoIChFbGVtZW50KSBwYXRoIGVsZW1lbnRcbiAtIHggKG51bWJlcikgeCBjb29yZCBvZiBhIHBvaW50XG4gLSB5IChudW1iZXIpIHkgY29vcmQgb2YgYSBwb2ludFxuID0gKG9iamVjdCkgaW4gZm9ybWF0XG4ge1xuICAgIHggKG51bWJlcikgeCBjb29yZCBvZiB0aGUgcG9pbnQgb24gdGhlIHBhdGhcbiAgICB5IChudW1iZXIpIHkgY29vcmQgb2YgdGhlIHBvaW50IG9uIHRoZSBwYXRoXG4gICAgbGVuZ3RoIChudW1iZXIpIGxlbmd0aCBvZiB0aGUgcGF0aCB0byB0aGUgcG9pbnRcbiAgICBkaXN0YW5jZSAobnVtYmVyKSBkaXN0YW5jZSBmcm9tIHRoZSBnaXZlbiBwb2ludCB0byB0aGUgcGF0aFxuIH1cblxcKi9cbi8vIENvcGllZCBmcm9tIGh0dHA6Ly9ibC5vY2tzLm9yZy9tYm9zdG9jay84MDI3NjM3XG5TbmFwLmNsb3Nlc3RQb2ludCA9IGZ1bmN0aW9uIChwYXRoLCB4LCB5KSB7XG4gICAgZnVuY3Rpb24gZGlzdGFuY2UyKHApIHtcbiAgICAgICAgdmFyIGR4ID0gcC54IC0geCxcbiAgICAgICAgICAgIGR5ID0gcC55IC0geTtcbiAgICAgICAgcmV0dXJuIGR4ICogZHggKyBkeSAqIGR5O1xuICAgIH1cbiAgICB2YXIgcGF0aE5vZGUgPSBwYXRoLm5vZGUsXG4gICAgICAgIHBhdGhMZW5ndGggPSBwYXRoTm9kZS5nZXRUb3RhbExlbmd0aCgpLFxuICAgICAgICBwcmVjaXNpb24gPSBwYXRoTGVuZ3RoIC8gcGF0aE5vZGUucGF0aFNlZ0xpc3QubnVtYmVyT2ZJdGVtcyAqIC4xMjUsXG4gICAgICAgIGJlc3QsXG4gICAgICAgIGJlc3RMZW5ndGgsXG4gICAgICAgIGJlc3REaXN0YW5jZSA9IEluZmluaXR5O1xuXG4gICAgLy8gbGluZWFyIHNjYW4gZm9yIGNvYXJzZSBhcHByb3hpbWF0aW9uXG4gICAgZm9yICh2YXIgc2Nhbiwgc2Nhbkxlbmd0aCA9IDAsIHNjYW5EaXN0YW5jZTsgc2Nhbkxlbmd0aCA8PSBwYXRoTGVuZ3RoOyBzY2FuTGVuZ3RoICs9IHByZWNpc2lvbikge1xuICAgICAgICBpZiAoKHNjYW5EaXN0YW5jZSA9IGRpc3RhbmNlMihzY2FuID0gcGF0aE5vZGUuZ2V0UG9pbnRBdExlbmd0aChzY2FuTGVuZ3RoKSkpIDwgYmVzdERpc3RhbmNlKSB7XG4gICAgICAgICAgICBiZXN0ID0gc2NhbiwgYmVzdExlbmd0aCA9IHNjYW5MZW5ndGgsIGJlc3REaXN0YW5jZSA9IHNjYW5EaXN0YW5jZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIGJpbmFyeSBzZWFyY2ggZm9yIHByZWNpc2UgZXN0aW1hdGVcbiAgICBwcmVjaXNpb24gKj0gLjU7XG4gICAgd2hpbGUgKHByZWNpc2lvbiA+IC41KSB7XG4gICAgICAgIHZhciBiZWZvcmUsXG4gICAgICAgICAgICBhZnRlcixcbiAgICAgICAgICAgIGJlZm9yZUxlbmd0aCxcbiAgICAgICAgICAgIGFmdGVyTGVuZ3RoLFxuICAgICAgICAgICAgYmVmb3JlRGlzdGFuY2UsXG4gICAgICAgICAgICBhZnRlckRpc3RhbmNlO1xuICAgICAgICBpZiAoKGJlZm9yZUxlbmd0aCA9IGJlc3RMZW5ndGggLSBwcmVjaXNpb24pID49IDAgJiYgKGJlZm9yZURpc3RhbmNlID0gZGlzdGFuY2UyKGJlZm9yZSA9IHBhdGhOb2RlLmdldFBvaW50QXRMZW5ndGgoYmVmb3JlTGVuZ3RoKSkpIDwgYmVzdERpc3RhbmNlKSB7XG4gICAgICAgICAgICBiZXN0ID0gYmVmb3JlLCBiZXN0TGVuZ3RoID0gYmVmb3JlTGVuZ3RoLCBiZXN0RGlzdGFuY2UgPSBiZWZvcmVEaXN0YW5jZTtcbiAgICAgICAgfSBlbHNlIGlmICgoYWZ0ZXJMZW5ndGggPSBiZXN0TGVuZ3RoICsgcHJlY2lzaW9uKSA8PSBwYXRoTGVuZ3RoICYmIChhZnRlckRpc3RhbmNlID0gZGlzdGFuY2UyKGFmdGVyID0gcGF0aE5vZGUuZ2V0UG9pbnRBdExlbmd0aChhZnRlckxlbmd0aCkpKSA8IGJlc3REaXN0YW5jZSkge1xuICAgICAgICAgICAgYmVzdCA9IGFmdGVyLCBiZXN0TGVuZ3RoID0gYWZ0ZXJMZW5ndGgsIGJlc3REaXN0YW5jZSA9IGFmdGVyRGlzdGFuY2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwcmVjaXNpb24gKj0gLjU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBiZXN0ID0ge1xuICAgICAgICB4OiBiZXN0LngsXG4gICAgICAgIHk6IGJlc3QueSxcbiAgICAgICAgbGVuZ3RoOiBiZXN0TGVuZ3RoLFxuICAgICAgICBkaXN0YW5jZTogTWF0aC5zcXJ0KGJlc3REaXN0YW5jZSlcbiAgICB9O1xuICAgIHJldHVybiBiZXN0O1xufVxuLypcXFxuICogU25hcC5pc1xuIFsgbWV0aG9kIF1cbiAqKlxuICogSGFuZHkgcmVwbGFjZW1lbnQgZm9yIHRoZSBgdHlwZW9mYCBvcGVyYXRvclxuIC0gbyAo4oCmKSBhbnkgb2JqZWN0IG9yIHByaW1pdGl2ZVxuIC0gdHlwZSAoc3RyaW5nKSBuYW1lIG9mIHRoZSB0eXBlLCBlLmcuLCBgc3RyaW5nYCwgYGZ1bmN0aW9uYCwgYG51bWJlcmAsIGV0Yy5cbiA9IChib29sZWFuKSBgdHJ1ZWAgaWYgZ2l2ZW4gdmFsdWUgaXMgb2YgZ2l2ZW4gdHlwZVxuXFwqL1xuU25hcC5pcyA9IGlzO1xuLypcXFxuICogU25hcC5zbmFwVG9cbiBbIG1ldGhvZCBdXG4gKipcbiAqIFNuYXBzIGdpdmVuIHZhbHVlIHRvIGdpdmVuIGdyaWRcbiAtIHZhbHVlcyAoYXJyYXl8bnVtYmVyKSBnaXZlbiBhcnJheSBvZiB2YWx1ZXMgb3Igc3RlcCBvZiB0aGUgZ3JpZFxuIC0gdmFsdWUgKG51bWJlcikgdmFsdWUgdG8gYWRqdXN0XG4gLSB0b2xlcmFuY2UgKG51bWJlcikgI29wdGlvbmFsIG1heGltdW0gZGlzdGFuY2UgdG8gdGhlIHRhcmdldCB2YWx1ZSB0aGF0IHdvdWxkIHRyaWdnZXIgdGhlIHNuYXAuIERlZmF1bHQgaXMgYDEwYC5cbiA9IChudW1iZXIpIGFkanVzdGVkIHZhbHVlXG5cXCovXG5TbmFwLnNuYXBUbyA9IGZ1bmN0aW9uICh2YWx1ZXMsIHZhbHVlLCB0b2xlcmFuY2UpIHtcbiAgICB0b2xlcmFuY2UgPSBpcyh0b2xlcmFuY2UsIFwiZmluaXRlXCIpID8gdG9sZXJhbmNlIDogMTA7XG4gICAgaWYgKGlzKHZhbHVlcywgXCJhcnJheVwiKSkge1xuICAgICAgICB2YXIgaSA9IHZhbHVlcy5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpLS0pIGlmIChhYnModmFsdWVzW2ldIC0gdmFsdWUpIDw9IHRvbGVyYW5jZSkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlc1tpXTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhbHVlcyA9ICt2YWx1ZXM7XG4gICAgICAgIHZhciByZW0gPSB2YWx1ZSAlIHZhbHVlcztcbiAgICAgICAgaWYgKHJlbSA8IHRvbGVyYW5jZSkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlIC0gcmVtO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZW0gPiB2YWx1ZXMgLSB0b2xlcmFuY2UpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZSAtIHJlbSArIHZhbHVlcztcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG59O1xuLy8gQ29sb3VyXG4vKlxcXG4gKiBTbmFwLmdldFJHQlxuIFsgbWV0aG9kIF1cbiAqKlxuICogUGFyc2VzIGNvbG9yIHN0cmluZyBhcyBSR0Igb2JqZWN0XG4gLSBjb2xvciAoc3RyaW5nKSBjb2xvciBzdHJpbmcgaW4gb25lIG9mIHRoZSBmb2xsb3dpbmcgZm9ybWF0czpcbiAjIDx1bD5cbiAjICAgICA8bGk+Q29sb3IgbmFtZSAoPGNvZGU+cmVkPC9jb2RlPiwgPGNvZGU+Z3JlZW48L2NvZGU+LCA8Y29kZT5jb3JuZmxvd2VyYmx1ZTwvY29kZT4sIGV0Yyk8L2xpPlxuICMgICAgIDxsaT4j4oCi4oCi4oCiIOKAlCBzaG9ydGVuZWQgSFRNTCBjb2xvcjogKDxjb2RlPiMwMDA8L2NvZGU+LCA8Y29kZT4jZmMwPC9jb2RlPiwgZXRjLik8L2xpPlxuICMgICAgIDxsaT4j4oCi4oCi4oCi4oCi4oCi4oCiIOKAlCBmdWxsIGxlbmd0aCBIVE1MIGNvbG9yOiAoPGNvZGU+IzAwMDAwMDwvY29kZT4sIDxjb2RlPiNiZDIzMDA8L2NvZGU+KTwvbGk+XG4gIyAgICAgPGxpPnJnYijigKLigKLigKIsIOKAouKAouKAoiwg4oCi4oCi4oCiKSDigJQgcmVkLCBncmVlbiBhbmQgYmx1ZSBjaGFubmVscyB2YWx1ZXM6ICg8Y29kZT5yZ2IoMjAwLCZuYnNwOzEwMCwmbmJzcDswKTwvY29kZT4pPC9saT5cbiAjICAgICA8bGk+cmdiYSjigKLigKLigKIsIOKAouKAouKAoiwg4oCi4oCi4oCiLCDigKLigKLigKIpIOKAlCBhbHNvIHdpdGggb3BhY2l0eTwvbGk+XG4gIyAgICAgPGxpPnJnYijigKLigKLigKIlLCDigKLigKLigKIlLCDigKLigKLigKIlKSDigJQgc2FtZSBhcyBhYm92ZSwgYnV0IGluICU6ICg8Y29kZT5yZ2IoMTAwJSwmbmJzcDsxNzUlLCZuYnNwOzAlKTwvY29kZT4pPC9saT5cbiAjICAgICA8bGk+cmdiYSjigKLigKLigKIlLCDigKLigKLigKIlLCDigKLigKLigKIlLCDigKLigKLigKIlKSDigJQgYWxzbyB3aXRoIG9wYWNpdHk8L2xpPlxuICMgICAgIDxsaT5oc2Io4oCi4oCi4oCiLCDigKLigKLigKIsIOKAouKAouKAoikg4oCUIGh1ZSwgc2F0dXJhdGlvbiBhbmQgYnJpZ2h0bmVzcyB2YWx1ZXM6ICg8Y29kZT5oc2IoMC41LCZuYnNwOzAuMjUsJm5ic3A7MSk8L2NvZGU+KTwvbGk+XG4gIyAgICAgPGxpPmhzYmEo4oCi4oCi4oCiLCDigKLigKLigKIsIOKAouKAouKAoiwg4oCi4oCi4oCiKSDigJQgYWxzbyB3aXRoIG9wYWNpdHk8L2xpPlxuICMgICAgIDxsaT5oc2Io4oCi4oCi4oCiJSwg4oCi4oCi4oCiJSwg4oCi4oCi4oCiJSkg4oCUIHNhbWUgYXMgYWJvdmUsIGJ1dCBpbiAlPC9saT5cbiAjICAgICA8bGk+aHNiYSjigKLigKLigKIlLCDigKLigKLigKIlLCDigKLigKLigKIlLCDigKLigKLigKIlKSDigJQgYWxzbyB3aXRoIG9wYWNpdHk8L2xpPlxuICMgICAgIDxsaT5oc2wo4oCi4oCi4oCiLCDigKLigKLigKIsIOKAouKAouKAoikg4oCUIGh1ZSwgc2F0dXJhdGlvbiBhbmQgbHVtaW5vc2l0eSB2YWx1ZXM6ICg8Y29kZT5oc2IoMC41LCZuYnNwOzAuMjUsJm5ic3A7MC41KTwvY29kZT4pPC9saT5cbiAjICAgICA8bGk+aHNsYSjigKLigKLigKIsIOKAouKAouKAoiwg4oCi4oCi4oCiLCDigKLigKLigKIpIOKAlCBhbHNvIHdpdGggb3BhY2l0eTwvbGk+XG4gIyAgICAgPGxpPmhzbCjigKLigKLigKIlLCDigKLigKLigKIlLCDigKLigKLigKIlKSDigJQgc2FtZSBhcyBhYm92ZSwgYnV0IGluICU8L2xpPlxuICMgICAgIDxsaT5oc2xhKOKAouKAouKAoiUsIOKAouKAouKAoiUsIOKAouKAouKAoiUsIOKAouKAouKAoiUpIOKAlCBhbHNvIHdpdGggb3BhY2l0eTwvbGk+XG4gIyA8L3VsPlxuICogTm90ZSB0aGF0IGAlYCBjYW4gYmUgdXNlZCBhbnkgdGltZTogYHJnYigyMCUsIDI1NSwgNTAlKWAuXG4gPSAob2JqZWN0KSBSR0Igb2JqZWN0IGluIHRoZSBmb2xsb3dpbmcgZm9ybWF0OlxuIG8ge1xuIG8gICAgIHIgKG51bWJlcikgcmVkLFxuIG8gICAgIGcgKG51bWJlcikgZ3JlZW4sXG4gbyAgICAgYiAobnVtYmVyKSBibHVlLFxuIG8gICAgIGhleCAoc3RyaW5nKSBjb2xvciBpbiBIVE1ML0NTUyBmb3JtYXQ6ICPigKLigKLigKLigKLigKLigKIsXG4gbyAgICAgZXJyb3IgKGJvb2xlYW4pIHRydWUgaWYgc3RyaW5nIGNhbid0IGJlIHBhcnNlZFxuIG8gfVxuXFwqL1xuU25hcC5nZXRSR0IgPSBjYWNoZXIoZnVuY3Rpb24gKGNvbG91cikge1xuICAgIGlmICghY29sb3VyIHx8ICEhKChjb2xvdXIgPSBTdHIoY29sb3VyKSkuaW5kZXhPZihcIi1cIikgKyAxKSkge1xuICAgICAgICByZXR1cm4ge3I6IC0xLCBnOiAtMSwgYjogLTEsIGhleDogXCJub25lXCIsIGVycm9yOiAxLCB0b1N0cmluZzogcmdidG9TdHJpbmd9O1xuICAgIH1cbiAgICBpZiAoY29sb3VyID09IFwibm9uZVwiKSB7XG4gICAgICAgIHJldHVybiB7cjogLTEsIGc6IC0xLCBiOiAtMSwgaGV4OiBcIm5vbmVcIiwgdG9TdHJpbmc6IHJnYnRvU3RyaW5nfTtcbiAgICB9XG4gICAgIShoc3JnW2hhc10oY29sb3VyLnRvTG93ZXJDYXNlKCkuc3Vic3RyaW5nKDAsIDIpKSB8fCBjb2xvdXIuY2hhckF0KCkgPT0gXCIjXCIpICYmIChjb2xvdXIgPSB0b0hleChjb2xvdXIpKTtcbiAgICBpZiAoIWNvbG91cikge1xuICAgICAgICByZXR1cm4ge3I6IC0xLCBnOiAtMSwgYjogLTEsIGhleDogXCJub25lXCIsIGVycm9yOiAxLCB0b1N0cmluZzogcmdidG9TdHJpbmd9O1xuICAgIH1cbiAgICB2YXIgcmVzLFxuICAgICAgICByZWQsXG4gICAgICAgIGdyZWVuLFxuICAgICAgICBibHVlLFxuICAgICAgICBvcGFjaXR5LFxuICAgICAgICB0LFxuICAgICAgICB2YWx1ZXMsXG4gICAgICAgIHJnYiA9IGNvbG91ci5tYXRjaChjb2xvdXJSZWdFeHApO1xuICAgIGlmIChyZ2IpIHtcbiAgICAgICAgaWYgKHJnYlsyXSkge1xuICAgICAgICAgICAgYmx1ZSA9IHRvSW50KHJnYlsyXS5zdWJzdHJpbmcoNSksIDE2KTtcbiAgICAgICAgICAgIGdyZWVuID0gdG9JbnQocmdiWzJdLnN1YnN0cmluZygzLCA1KSwgMTYpO1xuICAgICAgICAgICAgcmVkID0gdG9JbnQocmdiWzJdLnN1YnN0cmluZygxLCAzKSwgMTYpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZ2JbM10pIHtcbiAgICAgICAgICAgIGJsdWUgPSB0b0ludCgodCA9IHJnYlszXS5jaGFyQXQoMykpICsgdCwgMTYpO1xuICAgICAgICAgICAgZ3JlZW4gPSB0b0ludCgodCA9IHJnYlszXS5jaGFyQXQoMikpICsgdCwgMTYpO1xuICAgICAgICAgICAgcmVkID0gdG9JbnQoKHQgPSByZ2JbM10uY2hhckF0KDEpKSArIHQsIDE2KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmdiWzRdKSB7XG4gICAgICAgICAgICB2YWx1ZXMgPSByZ2JbNF0uc3BsaXQoY29tbWFTcGFjZXMpO1xuICAgICAgICAgICAgcmVkID0gdG9GbG9hdCh2YWx1ZXNbMF0pO1xuICAgICAgICAgICAgdmFsdWVzWzBdLnNsaWNlKC0xKSA9PSBcIiVcIiAmJiAocmVkICo9IDIuNTUpO1xuICAgICAgICAgICAgZ3JlZW4gPSB0b0Zsb2F0KHZhbHVlc1sxXSk7XG4gICAgICAgICAgICB2YWx1ZXNbMV0uc2xpY2UoLTEpID09IFwiJVwiICYmIChncmVlbiAqPSAyLjU1KTtcbiAgICAgICAgICAgIGJsdWUgPSB0b0Zsb2F0KHZhbHVlc1syXSk7XG4gICAgICAgICAgICB2YWx1ZXNbMl0uc2xpY2UoLTEpID09IFwiJVwiICYmIChibHVlICo9IDIuNTUpO1xuICAgICAgICAgICAgcmdiWzFdLnRvTG93ZXJDYXNlKCkuc2xpY2UoMCwgNCkgPT0gXCJyZ2JhXCIgJiYgKG9wYWNpdHkgPSB0b0Zsb2F0KHZhbHVlc1szXSkpO1xuICAgICAgICAgICAgdmFsdWVzWzNdICYmIHZhbHVlc1szXS5zbGljZSgtMSkgPT0gXCIlXCIgJiYgKG9wYWNpdHkgLz0gMTAwKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmdiWzVdKSB7XG4gICAgICAgICAgICB2YWx1ZXMgPSByZ2JbNV0uc3BsaXQoY29tbWFTcGFjZXMpO1xuICAgICAgICAgICAgcmVkID0gdG9GbG9hdCh2YWx1ZXNbMF0pO1xuICAgICAgICAgICAgdmFsdWVzWzBdLnNsaWNlKC0xKSA9PSBcIiVcIiAmJiAocmVkIC89IDEwMCk7XG4gICAgICAgICAgICBncmVlbiA9IHRvRmxvYXQodmFsdWVzWzFdKTtcbiAgICAgICAgICAgIHZhbHVlc1sxXS5zbGljZSgtMSkgPT0gXCIlXCIgJiYgKGdyZWVuIC89IDEwMCk7XG4gICAgICAgICAgICBibHVlID0gdG9GbG9hdCh2YWx1ZXNbMl0pO1xuICAgICAgICAgICAgdmFsdWVzWzJdLnNsaWNlKC0xKSA9PSBcIiVcIiAmJiAoYmx1ZSAvPSAxMDApO1xuICAgICAgICAgICAgKHZhbHVlc1swXS5zbGljZSgtMykgPT0gXCJkZWdcIiB8fCB2YWx1ZXNbMF0uc2xpY2UoLTEpID09IFwiXFx4YjBcIikgJiYgKHJlZCAvPSAzNjApO1xuICAgICAgICAgICAgcmdiWzFdLnRvTG93ZXJDYXNlKCkuc2xpY2UoMCwgNCkgPT0gXCJoc2JhXCIgJiYgKG9wYWNpdHkgPSB0b0Zsb2F0KHZhbHVlc1szXSkpO1xuICAgICAgICAgICAgdmFsdWVzWzNdICYmIHZhbHVlc1szXS5zbGljZSgtMSkgPT0gXCIlXCIgJiYgKG9wYWNpdHkgLz0gMTAwKTtcbiAgICAgICAgICAgIHJldHVybiBTbmFwLmhzYjJyZ2IocmVkLCBncmVlbiwgYmx1ZSwgb3BhY2l0eSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJnYls2XSkge1xuICAgICAgICAgICAgdmFsdWVzID0gcmdiWzZdLnNwbGl0KGNvbW1hU3BhY2VzKTtcbiAgICAgICAgICAgIHJlZCA9IHRvRmxvYXQodmFsdWVzWzBdKTtcbiAgICAgICAgICAgIHZhbHVlc1swXS5zbGljZSgtMSkgPT0gXCIlXCIgJiYgKHJlZCAvPSAxMDApO1xuICAgICAgICAgICAgZ3JlZW4gPSB0b0Zsb2F0KHZhbHVlc1sxXSk7XG4gICAgICAgICAgICB2YWx1ZXNbMV0uc2xpY2UoLTEpID09IFwiJVwiICYmIChncmVlbiAvPSAxMDApO1xuICAgICAgICAgICAgYmx1ZSA9IHRvRmxvYXQodmFsdWVzWzJdKTtcbiAgICAgICAgICAgIHZhbHVlc1syXS5zbGljZSgtMSkgPT0gXCIlXCIgJiYgKGJsdWUgLz0gMTAwKTtcbiAgICAgICAgICAgICh2YWx1ZXNbMF0uc2xpY2UoLTMpID09IFwiZGVnXCIgfHwgdmFsdWVzWzBdLnNsaWNlKC0xKSA9PSBcIlxceGIwXCIpICYmIChyZWQgLz0gMzYwKTtcbiAgICAgICAgICAgIHJnYlsxXS50b0xvd2VyQ2FzZSgpLnNsaWNlKDAsIDQpID09IFwiaHNsYVwiICYmIChvcGFjaXR5ID0gdG9GbG9hdCh2YWx1ZXNbM10pKTtcbiAgICAgICAgICAgIHZhbHVlc1szXSAmJiB2YWx1ZXNbM10uc2xpY2UoLTEpID09IFwiJVwiICYmIChvcGFjaXR5IC89IDEwMCk7XG4gICAgICAgICAgICByZXR1cm4gU25hcC5oc2wycmdiKHJlZCwgZ3JlZW4sIGJsdWUsIG9wYWNpdHkpO1xuICAgICAgICB9XG4gICAgICAgIHJlZCA9IG1taW4obWF0aC5yb3VuZChyZWQpLCAyNTUpO1xuICAgICAgICBncmVlbiA9IG1taW4obWF0aC5yb3VuZChncmVlbiksIDI1NSk7XG4gICAgICAgIGJsdWUgPSBtbWluKG1hdGgucm91bmQoYmx1ZSksIDI1NSk7XG4gICAgICAgIG9wYWNpdHkgPSBtbWluKG1tYXgob3BhY2l0eSwgMCksIDEpO1xuICAgICAgICByZ2IgPSB7cjogcmVkLCBnOiBncmVlbiwgYjogYmx1ZSwgdG9TdHJpbmc6IHJnYnRvU3RyaW5nfTtcbiAgICAgICAgcmdiLmhleCA9IFwiI1wiICsgKDE2Nzc3MjE2IHwgYmx1ZSB8IChncmVlbiA8PCA4KSB8IChyZWQgPDwgMTYpKS50b1N0cmluZygxNikuc2xpY2UoMSk7XG4gICAgICAgIHJnYi5vcGFjaXR5ID0gaXMob3BhY2l0eSwgXCJmaW5pdGVcIikgPyBvcGFjaXR5IDogMTtcbiAgICAgICAgcmV0dXJuIHJnYjtcbiAgICB9XG4gICAgcmV0dXJuIHtyOiAtMSwgZzogLTEsIGI6IC0xLCBoZXg6IFwibm9uZVwiLCBlcnJvcjogMSwgdG9TdHJpbmc6IHJnYnRvU3RyaW5nfTtcbn0sIFNuYXApO1xuLypcXFxuICogU25hcC5oc2JcbiBbIG1ldGhvZCBdXG4gKipcbiAqIENvbnZlcnRzIEhTQiB2YWx1ZXMgdG8gYSBoZXggcmVwcmVzZW50YXRpb24gb2YgdGhlIGNvbG9yXG4gLSBoIChudW1iZXIpIGh1ZVxuIC0gcyAobnVtYmVyKSBzYXR1cmF0aW9uXG4gLSBiIChudW1iZXIpIHZhbHVlIG9yIGJyaWdodG5lc3NcbiA9IChzdHJpbmcpIGhleCByZXByZXNlbnRhdGlvbiBvZiB0aGUgY29sb3JcblxcKi9cblNuYXAuaHNiID0gY2FjaGVyKGZ1bmN0aW9uIChoLCBzLCBiKSB7XG4gICAgcmV0dXJuIFNuYXAuaHNiMnJnYihoLCBzLCBiKS5oZXg7XG59KTtcbi8qXFxcbiAqIFNuYXAuaHNsXG4gWyBtZXRob2QgXVxuICoqXG4gKiBDb252ZXJ0cyBIU0wgdmFsdWVzIHRvIGEgaGV4IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBjb2xvclxuIC0gaCAobnVtYmVyKSBodWVcbiAtIHMgKG51bWJlcikgc2F0dXJhdGlvblxuIC0gbCAobnVtYmVyKSBsdW1pbm9zaXR5XG4gPSAoc3RyaW5nKSBoZXggcmVwcmVzZW50YXRpb24gb2YgdGhlIGNvbG9yXG5cXCovXG5TbmFwLmhzbCA9IGNhY2hlcihmdW5jdGlvbiAoaCwgcywgbCkge1xuICAgIHJldHVybiBTbmFwLmhzbDJyZ2IoaCwgcywgbCkuaGV4O1xufSk7XG4vKlxcXG4gKiBTbmFwLnJnYlxuIFsgbWV0aG9kIF1cbiAqKlxuICogQ29udmVydHMgUkdCIHZhbHVlcyB0byBhIGhleCByZXByZXNlbnRhdGlvbiBvZiB0aGUgY29sb3JcbiAtIHIgKG51bWJlcikgcmVkXG4gLSBnIChudW1iZXIpIGdyZWVuXG4gLSBiIChudW1iZXIpIGJsdWVcbiA9IChzdHJpbmcpIGhleCByZXByZXNlbnRhdGlvbiBvZiB0aGUgY29sb3JcblxcKi9cblNuYXAucmdiID0gY2FjaGVyKGZ1bmN0aW9uIChyLCBnLCBiLCBvKSB7XG4gICAgaWYgKGlzKG8sIFwiZmluaXRlXCIpKSB7XG4gICAgICAgIHZhciByb3VuZCA9IG1hdGgucm91bmQ7XG4gICAgICAgIHJldHVybiBcInJnYmEoXCIgKyBbcm91bmQociksIHJvdW5kKGcpLCByb3VuZChiKSwgK28udG9GaXhlZCgyKV0gKyBcIilcIjtcbiAgICB9XG4gICAgcmV0dXJuIFwiI1wiICsgKDE2Nzc3MjE2IHwgYiB8IChnIDw8IDgpIHwgKHIgPDwgMTYpKS50b1N0cmluZygxNikuc2xpY2UoMSk7XG59KTtcbnZhciB0b0hleCA9IGZ1bmN0aW9uIChjb2xvcikge1xuICAgIHZhciBpID0gZ2xvYi5kb2MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJoZWFkXCIpWzBdIHx8IGdsb2IuZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwic3ZnXCIpWzBdLFxuICAgICAgICByZWQgPSBcInJnYigyNTUsIDAsIDApXCI7XG4gICAgdG9IZXggPSBjYWNoZXIoZnVuY3Rpb24gKGNvbG9yKSB7XG4gICAgICAgIGlmIChjb2xvci50b0xvd2VyQ2FzZSgpID09IFwicmVkXCIpIHtcbiAgICAgICAgICAgIHJldHVybiByZWQ7XG4gICAgICAgIH1cbiAgICAgICAgaS5zdHlsZS5jb2xvciA9IHJlZDtcbiAgICAgICAgaS5zdHlsZS5jb2xvciA9IGNvbG9yO1xuICAgICAgICB2YXIgb3V0ID0gZ2xvYi5kb2MuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZShpLCBFKS5nZXRQcm9wZXJ0eVZhbHVlKFwiY29sb3JcIik7XG4gICAgICAgIHJldHVybiBvdXQgPT0gcmVkID8gbnVsbCA6IG91dDtcbiAgICB9KTtcbiAgICByZXR1cm4gdG9IZXgoY29sb3IpO1xufSxcbmhzYnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBcImhzYihcIiArIFt0aGlzLmgsIHRoaXMucywgdGhpcy5iXSArIFwiKVwiO1xufSxcbmhzbHRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBcImhzbChcIiArIFt0aGlzLmgsIHRoaXMucywgdGhpcy5sXSArIFwiKVwiO1xufSxcbnJnYnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLm9wYWNpdHkgPT0gMSB8fCB0aGlzLm9wYWNpdHkgPT0gbnVsbCA/XG4gICAgICAgICAgICB0aGlzLmhleCA6XG4gICAgICAgICAgICBcInJnYmEoXCIgKyBbdGhpcy5yLCB0aGlzLmcsIHRoaXMuYiwgdGhpcy5vcGFjaXR5XSArIFwiKVwiO1xufSxcbnByZXBhcmVSR0IgPSBmdW5jdGlvbiAociwgZywgYikge1xuICAgIGlmIChnID09IG51bGwgJiYgaXMociwgXCJvYmplY3RcIikgJiYgXCJyXCIgaW4gciAmJiBcImdcIiBpbiByICYmIFwiYlwiIGluIHIpIHtcbiAgICAgICAgYiA9IHIuYjtcbiAgICAgICAgZyA9IHIuZztcbiAgICAgICAgciA9IHIucjtcbiAgICB9XG4gICAgaWYgKGcgPT0gbnVsbCAmJiBpcyhyLCBzdHJpbmcpKSB7XG4gICAgICAgIHZhciBjbHIgPSBTbmFwLmdldFJHQihyKTtcbiAgICAgICAgciA9IGNsci5yO1xuICAgICAgICBnID0gY2xyLmc7XG4gICAgICAgIGIgPSBjbHIuYjtcbiAgICB9XG4gICAgaWYgKHIgPiAxIHx8IGcgPiAxIHx8IGIgPiAxKSB7XG4gICAgICAgIHIgLz0gMjU1O1xuICAgICAgICBnIC89IDI1NTtcbiAgICAgICAgYiAvPSAyNTU7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBbciwgZywgYl07XG59LFxucGFja2FnZVJHQiA9IGZ1bmN0aW9uIChyLCBnLCBiLCBvKSB7XG4gICAgciA9IG1hdGgucm91bmQociAqIDI1NSk7XG4gICAgZyA9IG1hdGgucm91bmQoZyAqIDI1NSk7XG4gICAgYiA9IG1hdGgucm91bmQoYiAqIDI1NSk7XG4gICAgdmFyIHJnYiA9IHtcbiAgICAgICAgcjogcixcbiAgICAgICAgZzogZyxcbiAgICAgICAgYjogYixcbiAgICAgICAgb3BhY2l0eTogaXMobywgXCJmaW5pdGVcIikgPyBvIDogMSxcbiAgICAgICAgaGV4OiBTbmFwLnJnYihyLCBnLCBiKSxcbiAgICAgICAgdG9TdHJpbmc6IHJnYnRvU3RyaW5nXG4gICAgfTtcbiAgICBpcyhvLCBcImZpbml0ZVwiKSAmJiAocmdiLm9wYWNpdHkgPSBvKTtcbiAgICByZXR1cm4gcmdiO1xufTtcbi8qXFxcbiAqIFNuYXAuY29sb3JcbiBbIG1ldGhvZCBdXG4gKipcbiAqIFBhcnNlcyB0aGUgY29sb3Igc3RyaW5nIGFuZCByZXR1cm5zIGFuIG9iamVjdCBmZWF0dXJpbmcgdGhlIGNvbG9yJ3MgY29tcG9uZW50IHZhbHVlc1xuIC0gY2xyIChzdHJpbmcpIGNvbG9yIHN0cmluZyBpbiBvbmUgb2YgdGhlIHN1cHBvcnRlZCBmb3JtYXRzIChzZWUgQFNuYXAuZ2V0UkdCKVxuID0gKG9iamVjdCkgQ29tYmluZWQgUkdCL0hTQiBvYmplY3QgaW4gdGhlIGZvbGxvd2luZyBmb3JtYXQ6XG4gbyB7XG4gbyAgICAgciAobnVtYmVyKSByZWQsXG4gbyAgICAgZyAobnVtYmVyKSBncmVlbixcbiBvICAgICBiIChudW1iZXIpIGJsdWUsXG4gbyAgICAgaGV4IChzdHJpbmcpIGNvbG9yIGluIEhUTUwvQ1NTIGZvcm1hdDogI+KAouKAouKAouKAouKAouKAoixcbiBvICAgICBlcnJvciAoYm9vbGVhbikgYHRydWVgIGlmIHN0cmluZyBjYW4ndCBiZSBwYXJzZWQsXG4gbyAgICAgaCAobnVtYmVyKSBodWUsXG4gbyAgICAgcyAobnVtYmVyKSBzYXR1cmF0aW9uLFxuIG8gICAgIHYgKG51bWJlcikgdmFsdWUgKGJyaWdodG5lc3MpLFxuIG8gICAgIGwgKG51bWJlcikgbGlnaHRuZXNzXG4gbyB9XG5cXCovXG5TbmFwLmNvbG9yID0gZnVuY3Rpb24gKGNscikge1xuICAgIHZhciByZ2I7XG4gICAgaWYgKGlzKGNsciwgXCJvYmplY3RcIikgJiYgXCJoXCIgaW4gY2xyICYmIFwic1wiIGluIGNsciAmJiBcImJcIiBpbiBjbHIpIHtcbiAgICAgICAgcmdiID0gU25hcC5oc2IycmdiKGNscik7XG4gICAgICAgIGNsci5yID0gcmdiLnI7XG4gICAgICAgIGNsci5nID0gcmdiLmc7XG4gICAgICAgIGNsci5iID0gcmdiLmI7XG4gICAgICAgIGNsci5vcGFjaXR5ID0gMTtcbiAgICAgICAgY2xyLmhleCA9IHJnYi5oZXg7XG4gICAgfSBlbHNlIGlmIChpcyhjbHIsIFwib2JqZWN0XCIpICYmIFwiaFwiIGluIGNsciAmJiBcInNcIiBpbiBjbHIgJiYgXCJsXCIgaW4gY2xyKSB7XG4gICAgICAgIHJnYiA9IFNuYXAuaHNsMnJnYihjbHIpO1xuICAgICAgICBjbHIuciA9IHJnYi5yO1xuICAgICAgICBjbHIuZyA9IHJnYi5nO1xuICAgICAgICBjbHIuYiA9IHJnYi5iO1xuICAgICAgICBjbHIub3BhY2l0eSA9IDE7XG4gICAgICAgIGNsci5oZXggPSByZ2IuaGV4O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChpcyhjbHIsIFwic3RyaW5nXCIpKSB7XG4gICAgICAgICAgICBjbHIgPSBTbmFwLmdldFJHQihjbHIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpcyhjbHIsIFwib2JqZWN0XCIpICYmIFwiclwiIGluIGNsciAmJiBcImdcIiBpbiBjbHIgJiYgXCJiXCIgaW4gY2xyICYmICEoXCJlcnJvclwiIGluIGNscikpIHtcbiAgICAgICAgICAgIHJnYiA9IFNuYXAucmdiMmhzbChjbHIpO1xuICAgICAgICAgICAgY2xyLmggPSByZ2IuaDtcbiAgICAgICAgICAgIGNsci5zID0gcmdiLnM7XG4gICAgICAgICAgICBjbHIubCA9IHJnYi5sO1xuICAgICAgICAgICAgcmdiID0gU25hcC5yZ2IyaHNiKGNscik7XG4gICAgICAgICAgICBjbHIudiA9IHJnYi5iO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2xyID0ge2hleDogXCJub25lXCJ9O1xuICAgICAgICAgICAgY2xyLnIgPSBjbHIuZyA9IGNsci5iID0gY2xyLmggPSBjbHIucyA9IGNsci52ID0gY2xyLmwgPSAtMTtcbiAgICAgICAgICAgIGNsci5lcnJvciA9IDE7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY2xyLnRvU3RyaW5nID0gcmdidG9TdHJpbmc7XG4gICAgcmV0dXJuIGNscjtcbn07XG4vKlxcXG4gKiBTbmFwLmhzYjJyZ2JcbiBbIG1ldGhvZCBdXG4gKipcbiAqIENvbnZlcnRzIEhTQiB2YWx1ZXMgdG8gYW4gUkdCIG9iamVjdFxuIC0gaCAobnVtYmVyKSBodWVcbiAtIHMgKG51bWJlcikgc2F0dXJhdGlvblxuIC0gdiAobnVtYmVyKSB2YWx1ZSBvciBicmlnaHRuZXNzXG4gPSAob2JqZWN0KSBSR0Igb2JqZWN0IGluIHRoZSBmb2xsb3dpbmcgZm9ybWF0OlxuIG8ge1xuIG8gICAgIHIgKG51bWJlcikgcmVkLFxuIG8gICAgIGcgKG51bWJlcikgZ3JlZW4sXG4gbyAgICAgYiAobnVtYmVyKSBibHVlLFxuIG8gICAgIGhleCAoc3RyaW5nKSBjb2xvciBpbiBIVE1ML0NTUyBmb3JtYXQ6ICPigKLigKLigKLigKLigKLigKJcbiBvIH1cblxcKi9cblNuYXAuaHNiMnJnYiA9IGZ1bmN0aW9uIChoLCBzLCB2LCBvKSB7XG4gICAgaWYgKGlzKGgsIFwib2JqZWN0XCIpICYmIFwiaFwiIGluIGggJiYgXCJzXCIgaW4gaCAmJiBcImJcIiBpbiBoKSB7XG4gICAgICAgIHYgPSBoLmI7XG4gICAgICAgIHMgPSBoLnM7XG4gICAgICAgIG8gPSBoLm87XG4gICAgICAgIGggPSBoLmg7XG4gICAgfVxuICAgIGggKj0gMzYwO1xuICAgIHZhciBSLCBHLCBCLCBYLCBDO1xuICAgIGggPSAoaCAlIDM2MCkgLyA2MDtcbiAgICBDID0gdiAqIHM7XG4gICAgWCA9IEMgKiAoMSAtIGFicyhoICUgMiAtIDEpKTtcbiAgICBSID0gRyA9IEIgPSB2IC0gQztcblxuICAgIGggPSB+fmg7XG4gICAgUiArPSBbQywgWCwgMCwgMCwgWCwgQ11baF07XG4gICAgRyArPSBbWCwgQywgQywgWCwgMCwgMF1baF07XG4gICAgQiArPSBbMCwgMCwgWCwgQywgQywgWF1baF07XG4gICAgcmV0dXJuIHBhY2thZ2VSR0IoUiwgRywgQiwgbyk7XG59O1xuLypcXFxuICogU25hcC5oc2wycmdiXG4gWyBtZXRob2QgXVxuICoqXG4gKiBDb252ZXJ0cyBIU0wgdmFsdWVzIHRvIGFuIFJHQiBvYmplY3RcbiAtIGggKG51bWJlcikgaHVlXG4gLSBzIChudW1iZXIpIHNhdHVyYXRpb25cbiAtIGwgKG51bWJlcikgbHVtaW5vc2l0eVxuID0gKG9iamVjdCkgUkdCIG9iamVjdCBpbiB0aGUgZm9sbG93aW5nIGZvcm1hdDpcbiBvIHtcbiBvICAgICByIChudW1iZXIpIHJlZCxcbiBvICAgICBnIChudW1iZXIpIGdyZWVuLFxuIG8gICAgIGIgKG51bWJlcikgYmx1ZSxcbiBvICAgICBoZXggKHN0cmluZykgY29sb3IgaW4gSFRNTC9DU1MgZm9ybWF0OiAj4oCi4oCi4oCi4oCi4oCi4oCiXG4gbyB9XG5cXCovXG5TbmFwLmhzbDJyZ2IgPSBmdW5jdGlvbiAoaCwgcywgbCwgbykge1xuICAgIGlmIChpcyhoLCBcIm9iamVjdFwiKSAmJiBcImhcIiBpbiBoICYmIFwic1wiIGluIGggJiYgXCJsXCIgaW4gaCkge1xuICAgICAgICBsID0gaC5sO1xuICAgICAgICBzID0gaC5zO1xuICAgICAgICBoID0gaC5oO1xuICAgIH1cbiAgICBpZiAoaCA+IDEgfHwgcyA+IDEgfHwgbCA+IDEpIHtcbiAgICAgICAgaCAvPSAzNjA7XG4gICAgICAgIHMgLz0gMTAwO1xuICAgICAgICBsIC89IDEwMDtcbiAgICB9XG4gICAgaCAqPSAzNjA7XG4gICAgdmFyIFIsIEcsIEIsIFgsIEM7XG4gICAgaCA9IChoICUgMzYwKSAvIDYwO1xuICAgIEMgPSAyICogcyAqIChsIDwgLjUgPyBsIDogMSAtIGwpO1xuICAgIFggPSBDICogKDEgLSBhYnMoaCAlIDIgLSAxKSk7XG4gICAgUiA9IEcgPSBCID0gbCAtIEMgLyAyO1xuXG4gICAgaCA9IH5+aDtcbiAgICBSICs9IFtDLCBYLCAwLCAwLCBYLCBDXVtoXTtcbiAgICBHICs9IFtYLCBDLCBDLCBYLCAwLCAwXVtoXTtcbiAgICBCICs9IFswLCAwLCBYLCBDLCBDLCBYXVtoXTtcbiAgICByZXR1cm4gcGFja2FnZVJHQihSLCBHLCBCLCBvKTtcbn07XG4vKlxcXG4gKiBTbmFwLnJnYjJoc2JcbiBbIG1ldGhvZCBdXG4gKipcbiAqIENvbnZlcnRzIFJHQiB2YWx1ZXMgdG8gYW4gSFNCIG9iamVjdFxuIC0gciAobnVtYmVyKSByZWRcbiAtIGcgKG51bWJlcikgZ3JlZW5cbiAtIGIgKG51bWJlcikgYmx1ZVxuID0gKG9iamVjdCkgSFNCIG9iamVjdCBpbiB0aGUgZm9sbG93aW5nIGZvcm1hdDpcbiBvIHtcbiBvICAgICBoIChudW1iZXIpIGh1ZSxcbiBvICAgICBzIChudW1iZXIpIHNhdHVyYXRpb24sXG4gbyAgICAgYiAobnVtYmVyKSBicmlnaHRuZXNzXG4gbyB9XG5cXCovXG5TbmFwLnJnYjJoc2IgPSBmdW5jdGlvbiAociwgZywgYikge1xuICAgIGIgPSBwcmVwYXJlUkdCKHIsIGcsIGIpO1xuICAgIHIgPSBiWzBdO1xuICAgIGcgPSBiWzFdO1xuICAgIGIgPSBiWzJdO1xuXG4gICAgdmFyIEgsIFMsIFYsIEM7XG4gICAgViA9IG1tYXgociwgZywgYik7XG4gICAgQyA9IFYgLSBtbWluKHIsIGcsIGIpO1xuICAgIEggPSAoQyA9PSAwID8gbnVsbCA6XG4gICAgICAgICBWID09IHIgPyAoZyAtIGIpIC8gQyA6XG4gICAgICAgICBWID09IGcgPyAoYiAtIHIpIC8gQyArIDIgOlxuICAgICAgICAgICAgICAgICAgKHIgLSBnKSAvIEMgKyA0XG4gICAgICAgICk7XG4gICAgSCA9ICgoSCArIDM2MCkgJSA2KSAqIDYwIC8gMzYwO1xuICAgIFMgPSBDID09IDAgPyAwIDogQyAvIFY7XG4gICAgcmV0dXJuIHtoOiBILCBzOiBTLCBiOiBWLCB0b1N0cmluZzogaHNidG9TdHJpbmd9O1xufTtcbi8qXFxcbiAqIFNuYXAucmdiMmhzbFxuIFsgbWV0aG9kIF1cbiAqKlxuICogQ29udmVydHMgUkdCIHZhbHVlcyB0byBhbiBIU0wgb2JqZWN0XG4gLSByIChudW1iZXIpIHJlZFxuIC0gZyAobnVtYmVyKSBncmVlblxuIC0gYiAobnVtYmVyKSBibHVlXG4gPSAob2JqZWN0KSBIU0wgb2JqZWN0IGluIHRoZSBmb2xsb3dpbmcgZm9ybWF0OlxuIG8ge1xuIG8gICAgIGggKG51bWJlcikgaHVlLFxuIG8gICAgIHMgKG51bWJlcikgc2F0dXJhdGlvbixcbiBvICAgICBsIChudW1iZXIpIGx1bWlub3NpdHlcbiBvIH1cblxcKi9cblNuYXAucmdiMmhzbCA9IGZ1bmN0aW9uIChyLCBnLCBiKSB7XG4gICAgYiA9IHByZXBhcmVSR0IociwgZywgYik7XG4gICAgciA9IGJbMF07XG4gICAgZyA9IGJbMV07XG4gICAgYiA9IGJbMl07XG5cbiAgICB2YXIgSCwgUywgTCwgTSwgbSwgQztcbiAgICBNID0gbW1heChyLCBnLCBiKTtcbiAgICBtID0gbW1pbihyLCBnLCBiKTtcbiAgICBDID0gTSAtIG07XG4gICAgSCA9IChDID09IDAgPyBudWxsIDpcbiAgICAgICAgIE0gPT0gciA/IChnIC0gYikgLyBDIDpcbiAgICAgICAgIE0gPT0gZyA/IChiIC0gcikgLyBDICsgMiA6XG4gICAgICAgICAgICAgICAgICAociAtIGcpIC8gQyArIDQpO1xuICAgIEggPSAoKEggKyAzNjApICUgNikgKiA2MCAvIDM2MDtcbiAgICBMID0gKE0gKyBtKSAvIDI7XG4gICAgUyA9IChDID09IDAgPyAwIDpcbiAgICAgICAgIEwgPCAuNSA/IEMgLyAoMiAqIEwpIDpcbiAgICAgICAgICAgICAgICAgIEMgLyAoMiAtIDIgKiBMKSk7XG4gICAgcmV0dXJuIHtoOiBILCBzOiBTLCBsOiBMLCB0b1N0cmluZzogaHNsdG9TdHJpbmd9O1xufTtcblxuLy8gVHJhbnNmb3JtYXRpb25zXG4vKlxcXG4gKiBTbmFwLnBhcnNlUGF0aFN0cmluZ1xuIFsgbWV0aG9kIF1cbiAqKlxuICogVXRpbGl0eSBtZXRob2RcbiAqKlxuICogUGFyc2VzIGdpdmVuIHBhdGggc3RyaW5nIGludG8gYW4gYXJyYXkgb2YgYXJyYXlzIG9mIHBhdGggc2VnbWVudHNcbiAtIHBhdGhTdHJpbmcgKHN0cmluZ3xhcnJheSkgcGF0aCBzdHJpbmcgb3IgYXJyYXkgb2Ygc2VnbWVudHMgKGluIHRoZSBsYXN0IGNhc2UgaXQgaXMgcmV0dXJuZWQgc3RyYWlnaHQgYXdheSlcbiA9IChhcnJheSkgYXJyYXkgb2Ygc2VnbWVudHNcblxcKi9cblNuYXAucGFyc2VQYXRoU3RyaW5nID0gZnVuY3Rpb24gKHBhdGhTdHJpbmcpIHtcbiAgICBpZiAoIXBhdGhTdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHZhciBwdGggPSBTbmFwLnBhdGgocGF0aFN0cmluZyk7XG4gICAgaWYgKHB0aC5hcnIpIHtcbiAgICAgICAgcmV0dXJuIFNuYXAucGF0aC5jbG9uZShwdGguYXJyKTtcbiAgICB9XG4gICAgXG4gICAgdmFyIHBhcmFtQ291bnRzID0ge2E6IDcsIGM6IDYsIG86IDIsIGg6IDEsIGw6IDIsIG06IDIsIHI6IDQsIHE6IDQsIHM6IDQsIHQ6IDIsIHY6IDEsIHU6IDMsIHo6IDB9LFxuICAgICAgICBkYXRhID0gW107XG4gICAgaWYgKGlzKHBhdGhTdHJpbmcsIFwiYXJyYXlcIikgJiYgaXMocGF0aFN0cmluZ1swXSwgXCJhcnJheVwiKSkgeyAvLyByb3VnaCBhc3N1bXB0aW9uXG4gICAgICAgIGRhdGEgPSBTbmFwLnBhdGguY2xvbmUocGF0aFN0cmluZyk7XG4gICAgfVxuICAgIGlmICghZGF0YS5sZW5ndGgpIHtcbiAgICAgICAgU3RyKHBhdGhTdHJpbmcpLnJlcGxhY2UocGF0aENvbW1hbmQsIGZ1bmN0aW9uIChhLCBiLCBjKSB7XG4gICAgICAgICAgICB2YXIgcGFyYW1zID0gW10sXG4gICAgICAgICAgICAgICAgbmFtZSA9IGIudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIGMucmVwbGFjZShwYXRoVmFsdWVzLCBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgICAgIGIgJiYgcGFyYW1zLnB1c2goK2IpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAobmFtZSA9PSBcIm1cIiAmJiBwYXJhbXMubGVuZ3RoID4gMikge1xuICAgICAgICAgICAgICAgIGRhdGEucHVzaChbYl0uY29uY2F0KHBhcmFtcy5zcGxpY2UoMCwgMikpKTtcbiAgICAgICAgICAgICAgICBuYW1lID0gXCJsXCI7XG4gICAgICAgICAgICAgICAgYiA9IGIgPT0gXCJtXCIgPyBcImxcIiA6IFwiTFwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG5hbWUgPT0gXCJvXCIgJiYgcGFyYW1zLmxlbmd0aCA9PSAxKSB7XG4gICAgICAgICAgICAgICAgZGF0YS5wdXNoKFtiLCBwYXJhbXNbMF1dKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChuYW1lID09IFwiclwiKSB7XG4gICAgICAgICAgICAgICAgZGF0YS5wdXNoKFtiXS5jb25jYXQocGFyYW1zKSk7XG4gICAgICAgICAgICB9IGVsc2Ugd2hpbGUgKHBhcmFtcy5sZW5ndGggPj0gcGFyYW1Db3VudHNbbmFtZV0pIHtcbiAgICAgICAgICAgICAgICBkYXRhLnB1c2goW2JdLmNvbmNhdChwYXJhbXMuc3BsaWNlKDAsIHBhcmFtQ291bnRzW25hbWVdKSkpO1xuICAgICAgICAgICAgICAgIGlmICghcGFyYW1Db3VudHNbbmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgZGF0YS50b1N0cmluZyA9IFNuYXAucGF0aC50b1N0cmluZztcbiAgICBwdGguYXJyID0gU25hcC5wYXRoLmNsb25lKGRhdGEpO1xuICAgIHJldHVybiBkYXRhO1xufTtcbi8qXFxcbiAqIFNuYXAucGFyc2VUcmFuc2Zvcm1TdHJpbmdcbiBbIG1ldGhvZCBdXG4gKipcbiAqIFV0aWxpdHkgbWV0aG9kXG4gKipcbiAqIFBhcnNlcyBnaXZlbiB0cmFuc2Zvcm0gc3RyaW5nIGludG8gYW4gYXJyYXkgb2YgdHJhbnNmb3JtYXRpb25zXG4gLSBUU3RyaW5nIChzdHJpbmd8YXJyYXkpIHRyYW5zZm9ybSBzdHJpbmcgb3IgYXJyYXkgb2YgdHJhbnNmb3JtYXRpb25zIChpbiB0aGUgbGFzdCBjYXNlIGl0IGlzIHJldHVybmVkIHN0cmFpZ2h0IGF3YXkpXG4gPSAoYXJyYXkpIGFycmF5IG9mIHRyYW5zZm9ybWF0aW9uc1xuXFwqL1xudmFyIHBhcnNlVHJhbnNmb3JtU3RyaW5nID0gU25hcC5wYXJzZVRyYW5zZm9ybVN0cmluZyA9IGZ1bmN0aW9uIChUU3RyaW5nKSB7XG4gICAgaWYgKCFUU3RyaW5nKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICB2YXIgcGFyYW1Db3VudHMgPSB7cjogMywgczogNCwgdDogMiwgbTogNn0sXG4gICAgICAgIGRhdGEgPSBbXTtcbiAgICBpZiAoaXMoVFN0cmluZywgXCJhcnJheVwiKSAmJiBpcyhUU3RyaW5nWzBdLCBcImFycmF5XCIpKSB7IC8vIHJvdWdoIGFzc3VtcHRpb25cbiAgICAgICAgZGF0YSA9IFNuYXAucGF0aC5jbG9uZShUU3RyaW5nKTtcbiAgICB9XG4gICAgaWYgKCFkYXRhLmxlbmd0aCkge1xuICAgICAgICBTdHIoVFN0cmluZykucmVwbGFjZSh0Q29tbWFuZCwgZnVuY3Rpb24gKGEsIGIsIGMpIHtcbiAgICAgICAgICAgIHZhciBwYXJhbXMgPSBbXSxcbiAgICAgICAgICAgICAgICBuYW1lID0gYi50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgYy5yZXBsYWNlKHBhdGhWYWx1ZXMsIGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICAgICAgYiAmJiBwYXJhbXMucHVzaCgrYik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGRhdGEucHVzaChbYl0uY29uY2F0KHBhcmFtcykpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZGF0YS50b1N0cmluZyA9IFNuYXAucGF0aC50b1N0cmluZztcbiAgICByZXR1cm4gZGF0YTtcbn07XG5mdW5jdGlvbiBzdmdUcmFuc2Zvcm0yc3RyaW5nKHRzdHIpIHtcbiAgICB2YXIgcmVzID0gW107XG4gICAgdHN0ciA9IHRzdHIucmVwbGFjZSgvKD86XnxcXHMpKFxcdyspXFwoKFteKV0rKVxcKS9nLCBmdW5jdGlvbiAoYWxsLCBuYW1lLCBwYXJhbXMpIHtcbiAgICAgICAgcGFyYW1zID0gcGFyYW1zLnNwbGl0KC9cXHMqLFxccyp8XFxzKy8pO1xuICAgICAgICBpZiAobmFtZSA9PSBcInJvdGF0ZVwiICYmIHBhcmFtcy5sZW5ndGggPT0gMSkge1xuICAgICAgICAgICAgcGFyYW1zLnB1c2goMCwgMCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5hbWUgPT0gXCJzY2FsZVwiKSB7XG4gICAgICAgICAgICBpZiAocGFyYW1zLmxlbmd0aCA+IDIpIHtcbiAgICAgICAgICAgICAgICBwYXJhbXMgPSBwYXJhbXMuc2xpY2UoMCwgMik7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHBhcmFtcy5sZW5ndGggPT0gMikge1xuICAgICAgICAgICAgICAgIHBhcmFtcy5wdXNoKDAsIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHBhcmFtcy5sZW5ndGggPT0gMSkge1xuICAgICAgICAgICAgICAgIHBhcmFtcy5wdXNoKHBhcmFtc1swXSwgMCwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5hbWUgPT0gXCJza2V3WFwiKSB7XG4gICAgICAgICAgICByZXMucHVzaChbXCJtXCIsIDEsIDAsIG1hdGgudGFuKHJhZChwYXJhbXNbMF0pKSwgMSwgMCwgMF0pO1xuICAgICAgICB9IGVsc2UgaWYgKG5hbWUgPT0gXCJza2V3WVwiKSB7XG4gICAgICAgICAgICByZXMucHVzaChbXCJtXCIsIDEsIG1hdGgudGFuKHJhZChwYXJhbXNbMF0pKSwgMCwgMSwgMCwgMF0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzLnB1c2goW25hbWUuY2hhckF0KDApXS5jb25jYXQocGFyYW1zKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFsbDtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzO1xufVxuU25hcC5fLnN2Z1RyYW5zZm9ybTJzdHJpbmcgPSBzdmdUcmFuc2Zvcm0yc3RyaW5nO1xuU25hcC5fLnJnVHJhbnNmb3JtID0gL15bYS16XVtcXHNdKi0/XFwuP1xcZC9pO1xuZnVuY3Rpb24gdHJhbnNmb3JtMm1hdHJpeCh0c3RyLCBiYm94KSB7XG4gICAgdmFyIHRkYXRhID0gcGFyc2VUcmFuc2Zvcm1TdHJpbmcodHN0ciksXG4gICAgICAgIG0gPSBuZXcgU25hcC5NYXRyaXg7XG4gICAgaWYgKHRkYXRhKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IHRkYXRhLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIHZhciB0ID0gdGRhdGFbaV0sXG4gICAgICAgICAgICAgICAgdGxlbiA9IHQubGVuZ3RoLFxuICAgICAgICAgICAgICAgIGNvbW1hbmQgPSBTdHIodFswXSkudG9Mb3dlckNhc2UoKSxcbiAgICAgICAgICAgICAgICBhYnNvbHV0ZSA9IHRbMF0gIT0gY29tbWFuZCxcbiAgICAgICAgICAgICAgICBpbnZlciA9IGFic29sdXRlID8gbS5pbnZlcnQoKSA6IDAsXG4gICAgICAgICAgICAgICAgeDEsXG4gICAgICAgICAgICAgICAgeTEsXG4gICAgICAgICAgICAgICAgeDIsXG4gICAgICAgICAgICAgICAgeTIsXG4gICAgICAgICAgICAgICAgYmI7XG4gICAgICAgICAgICBpZiAoY29tbWFuZCA9PSBcInRcIiAmJiB0bGVuID09IDIpe1xuICAgICAgICAgICAgICAgIG0udHJhbnNsYXRlKHRbMV0sIDApO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjb21tYW5kID09IFwidFwiICYmIHRsZW4gPT0gMykge1xuICAgICAgICAgICAgICAgIGlmIChhYnNvbHV0ZSkge1xuICAgICAgICAgICAgICAgICAgICB4MSA9IGludmVyLngoMCwgMCk7XG4gICAgICAgICAgICAgICAgICAgIHkxID0gaW52ZXIueSgwLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgeDIgPSBpbnZlci54KHRbMV0sIHRbMl0pO1xuICAgICAgICAgICAgICAgICAgICB5MiA9IGludmVyLnkodFsxXSwgdFsyXSk7XG4gICAgICAgICAgICAgICAgICAgIG0udHJhbnNsYXRlKHgyIC0geDEsIHkyIC0geTEpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG0udHJhbnNsYXRlKHRbMV0sIHRbMl0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY29tbWFuZCA9PSBcInJcIikge1xuICAgICAgICAgICAgICAgIGlmICh0bGVuID09IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgYmIgPSBiYiB8fCBiYm94O1xuICAgICAgICAgICAgICAgICAgICBtLnJvdGF0ZSh0WzFdLCBiYi54ICsgYmIud2lkdGggLyAyLCBiYi55ICsgYmIuaGVpZ2h0IC8gMik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0bGVuID09IDQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFic29sdXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB4MiA9IGludmVyLngodFsyXSwgdFszXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB5MiA9IGludmVyLnkodFsyXSwgdFszXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtLnJvdGF0ZSh0WzFdLCB4MiwgeTIpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgbS5yb3RhdGUodFsxXSwgdFsyXSwgdFszXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNvbW1hbmQgPT0gXCJzXCIpIHtcbiAgICAgICAgICAgICAgICBpZiAodGxlbiA9PSAyIHx8IHRsZW4gPT0gMykge1xuICAgICAgICAgICAgICAgICAgICBiYiA9IGJiIHx8IGJib3g7XG4gICAgICAgICAgICAgICAgICAgIG0uc2NhbGUodFsxXSwgdFt0bGVuIC0gMV0sIGJiLnggKyBiYi53aWR0aCAvIDIsIGJiLnkgKyBiYi5oZWlnaHQgLyAyKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRsZW4gPT0gNCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYWJzb2x1dGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHgyID0gaW52ZXIueCh0WzJdLCB0WzNdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHkyID0gaW52ZXIueSh0WzJdLCB0WzNdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG0uc2NhbGUodFsxXSwgdFsxXSwgeDIsIHkyKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG0uc2NhbGUodFsxXSwgdFsxXSwgdFsyXSwgdFszXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRsZW4gPT0gNSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYWJzb2x1dGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHgyID0gaW52ZXIueCh0WzNdLCB0WzRdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHkyID0gaW52ZXIueSh0WzNdLCB0WzRdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG0uc2NhbGUodFsxXSwgdFsyXSwgeDIsIHkyKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG0uc2NhbGUodFsxXSwgdFsyXSwgdFszXSwgdFs0XSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNvbW1hbmQgPT0gXCJtXCIgJiYgdGxlbiA9PSA3KSB7XG4gICAgICAgICAgICAgICAgbS5hZGQodFsxXSwgdFsyXSwgdFszXSwgdFs0XSwgdFs1XSwgdFs2XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG07XG59XG5TbmFwLl8udHJhbnNmb3JtMm1hdHJpeCA9IHRyYW5zZm9ybTJtYXRyaXg7XG5TbmFwLl91bml0MnB4ID0gdW5pdDJweDtcbnZhciBjb250YWlucyA9IGdsb2IuZG9jLmNvbnRhaW5zIHx8IGdsb2IuZG9jLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uID9cbiAgICBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICB2YXIgYWRvd24gPSBhLm5vZGVUeXBlID09IDkgPyBhLmRvY3VtZW50RWxlbWVudCA6IGEsXG4gICAgICAgICAgICBidXAgPSBiICYmIGIucGFyZW50Tm9kZTtcbiAgICAgICAgICAgIHJldHVybiBhID09IGJ1cCB8fCAhIShidXAgJiYgYnVwLm5vZGVUeXBlID09IDEgJiYgKFxuICAgICAgICAgICAgICAgIGFkb3duLmNvbnRhaW5zID9cbiAgICAgICAgICAgICAgICAgICAgYWRvd24uY29udGFpbnMoYnVwKSA6XG4gICAgICAgICAgICAgICAgICAgIGEuY29tcGFyZURvY3VtZW50UG9zaXRpb24gJiYgYS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbihidXApICYgMTZcbiAgICAgICAgICAgICkpO1xuICAgIH0gOlxuICAgIGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgIGlmIChiKSB7XG4gICAgICAgICAgICB3aGlsZSAoYikge1xuICAgICAgICAgICAgICAgIGIgPSBiLnBhcmVudE5vZGU7XG4gICAgICAgICAgICAgICAgaWYgKGIgPT0gYSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG5mdW5jdGlvbiBnZXRTb21lRGVmcyhlbCkge1xuICAgIHZhciBwID0gKGVsLm5vZGUub3duZXJTVkdFbGVtZW50ICYmIHdyYXAoZWwubm9kZS5vd25lclNWR0VsZW1lbnQpKSB8fFxuICAgICAgICAgICAgKGVsLm5vZGUucGFyZW50Tm9kZSAmJiB3cmFwKGVsLm5vZGUucGFyZW50Tm9kZSkpIHx8XG4gICAgICAgICAgICBTbmFwLnNlbGVjdChcInN2Z1wiKSB8fFxuICAgICAgICAgICAgU25hcCgwLCAwKSxcbiAgICAgICAgcGRlZnMgPSBwLnNlbGVjdChcImRlZnNcIiksXG4gICAgICAgIGRlZnMgID0gcGRlZnMgPT0gbnVsbCA/IGZhbHNlIDogcGRlZnMubm9kZTtcbiAgICBpZiAoIWRlZnMpIHtcbiAgICAgICAgZGVmcyA9IG1ha2UoXCJkZWZzXCIsIHAubm9kZSkubm9kZTtcbiAgICB9XG4gICAgcmV0dXJuIGRlZnM7XG59XG5mdW5jdGlvbiBnZXRTb21lU1ZHKGVsKSB7XG4gICAgcmV0dXJuIGVsLm5vZGUub3duZXJTVkdFbGVtZW50ICYmIHdyYXAoZWwubm9kZS5vd25lclNWR0VsZW1lbnQpIHx8IFNuYXAuc2VsZWN0KFwic3ZnXCIpO1xufVxuU25hcC5fLmdldFNvbWVEZWZzID0gZ2V0U29tZURlZnM7XG5TbmFwLl8uZ2V0U29tZVNWRyA9IGdldFNvbWVTVkc7XG5mdW5jdGlvbiB1bml0MnB4KGVsLCBuYW1lLCB2YWx1ZSkge1xuICAgIHZhciBzdmcgPSBnZXRTb21lU1ZHKGVsKS5ub2RlLFxuICAgICAgICBvdXQgPSB7fSxcbiAgICAgICAgbWdyID0gc3ZnLnF1ZXJ5U2VsZWN0b3IoXCIuc3ZnLS0tbWdyXCIpO1xuICAgIGlmICghbWdyKSB7XG4gICAgICAgIG1nciA9ICQoXCJyZWN0XCIpO1xuICAgICAgICAkKG1nciwge3g6IC05ZTksIHk6IC05ZTksIHdpZHRoOiAxMCwgaGVpZ2h0OiAxMCwgXCJjbGFzc1wiOiBcInN2Zy0tLW1nclwiLCBmaWxsOiBcIm5vbmVcIn0pO1xuICAgICAgICBzdmcuYXBwZW5kQ2hpbGQobWdyKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0Vyh2YWwpIHtcbiAgICAgICAgaWYgKHZhbCA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gRTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodmFsID09ICt2YWwpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWw7XG4gICAgICAgIH1cbiAgICAgICAgJChtZ3IsIHt3aWR0aDogdmFsfSk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gbWdyLmdldEJCb3goKS53aWR0aDtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0SCh2YWwpIHtcbiAgICAgICAgaWYgKHZhbCA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gRTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodmFsID09ICt2YWwpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWw7XG4gICAgICAgIH1cbiAgICAgICAgJChtZ3IsIHtoZWlnaHQ6IHZhbH0pO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIG1nci5nZXRCQm94KCkuaGVpZ2h0O1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBzZXQobmFtLCBmKSB7XG4gICAgICAgIGlmIChuYW1lID09IG51bGwpIHtcbiAgICAgICAgICAgIG91dFtuYW1dID0gZihlbC5hdHRyKG5hbSkgfHwgMCk7XG4gICAgICAgIH0gZWxzZSBpZiAobmFtID09IG5hbWUpIHtcbiAgICAgICAgICAgIG91dCA9IGYodmFsdWUgPT0gbnVsbCA/IGVsLmF0dHIobmFtKSB8fCAwIDogdmFsdWUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHN3aXRjaCAoZWwudHlwZSkge1xuICAgICAgICBjYXNlIFwicmVjdFwiOlxuICAgICAgICAgICAgc2V0KFwicnhcIiwgZ2V0Vyk7XG4gICAgICAgICAgICBzZXQoXCJyeVwiLCBnZXRIKTtcbiAgICAgICAgY2FzZSBcImltYWdlXCI6XG4gICAgICAgICAgICBzZXQoXCJ3aWR0aFwiLCBnZXRXKTtcbiAgICAgICAgICAgIHNldChcImhlaWdodFwiLCBnZXRIKTtcbiAgICAgICAgY2FzZSBcInRleHRcIjpcbiAgICAgICAgICAgIHNldChcInhcIiwgZ2V0Vyk7XG4gICAgICAgICAgICBzZXQoXCJ5XCIsIGdldEgpO1xuICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImNpcmNsZVwiOlxuICAgICAgICAgICAgc2V0KFwiY3hcIiwgZ2V0Vyk7XG4gICAgICAgICAgICBzZXQoXCJjeVwiLCBnZXRIKTtcbiAgICAgICAgICAgIHNldChcInJcIiwgZ2V0Vyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiZWxsaXBzZVwiOlxuICAgICAgICAgICAgc2V0KFwiY3hcIiwgZ2V0Vyk7XG4gICAgICAgICAgICBzZXQoXCJjeVwiLCBnZXRIKTtcbiAgICAgICAgICAgIHNldChcInJ4XCIsIGdldFcpO1xuICAgICAgICAgICAgc2V0KFwicnlcIiwgZ2V0SCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwibGluZVwiOlxuICAgICAgICAgICAgc2V0KFwieDFcIiwgZ2V0Vyk7XG4gICAgICAgICAgICBzZXQoXCJ4MlwiLCBnZXRXKTtcbiAgICAgICAgICAgIHNldChcInkxXCIsIGdldEgpO1xuICAgICAgICAgICAgc2V0KFwieTJcIiwgZ2V0SCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwibWFya2VyXCI6XG4gICAgICAgICAgICBzZXQoXCJyZWZYXCIsIGdldFcpO1xuICAgICAgICAgICAgc2V0KFwibWFya2VyV2lkdGhcIiwgZ2V0Vyk7XG4gICAgICAgICAgICBzZXQoXCJyZWZZXCIsIGdldEgpO1xuICAgICAgICAgICAgc2V0KFwibWFya2VySGVpZ2h0XCIsIGdldEgpO1xuICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInJhZGlhbEdyYWRpZW50XCI6XG4gICAgICAgICAgICBzZXQoXCJmeFwiLCBnZXRXKTtcbiAgICAgICAgICAgIHNldChcImZ5XCIsIGdldEgpO1xuICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInRzcGFuXCI6XG4gICAgICAgICAgICBzZXQoXCJkeFwiLCBnZXRXKTtcbiAgICAgICAgICAgIHNldChcImR5XCIsIGdldEgpO1xuICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHNldChuYW1lLCBnZXRXKTtcbiAgICB9XG4gICAgc3ZnLnJlbW92ZUNoaWxkKG1ncik7XG4gICAgcmV0dXJuIG91dDtcbn1cbi8qXFxcbiAqIFNuYXAuc2VsZWN0XG4gWyBtZXRob2QgXVxuICoqXG4gKiBXcmFwcyBhIERPTSBlbGVtZW50IHNwZWNpZmllZCBieSBDU1Mgc2VsZWN0b3IgYXMgQEVsZW1lbnRcbiAtIHF1ZXJ5IChzdHJpbmcpIENTUyBzZWxlY3RvciBvZiB0aGUgZWxlbWVudFxuID0gKEVsZW1lbnQpIHRoZSBjdXJyZW50IGVsZW1lbnRcblxcKi9cblNuYXAuc2VsZWN0ID0gZnVuY3Rpb24gKHF1ZXJ5KSB7XG4gICAgcXVlcnkgPSBTdHIocXVlcnkpLnJlcGxhY2UoLyhbXlxcXFxdKTovZywgXCIkMVxcXFw6XCIpO1xuICAgIHJldHVybiB3cmFwKGdsb2IuZG9jLnF1ZXJ5U2VsZWN0b3IocXVlcnkpKTtcbn07XG4vKlxcXG4gKiBTbmFwLnNlbGVjdEFsbFxuIFsgbWV0aG9kIF1cbiAqKlxuICogV3JhcHMgRE9NIGVsZW1lbnRzIHNwZWNpZmllZCBieSBDU1Mgc2VsZWN0b3IgYXMgc2V0IG9yIGFycmF5IG9mIEBFbGVtZW50XG4gLSBxdWVyeSAoc3RyaW5nKSBDU1Mgc2VsZWN0b3Igb2YgdGhlIGVsZW1lbnRcbiA9IChFbGVtZW50KSB0aGUgY3VycmVudCBlbGVtZW50XG5cXCovXG5TbmFwLnNlbGVjdEFsbCA9IGZ1bmN0aW9uIChxdWVyeSkge1xuICAgIHZhciBub2RlbGlzdCA9IGdsb2IuZG9jLnF1ZXJ5U2VsZWN0b3JBbGwocXVlcnkpLFxuICAgICAgICBzZXQgPSAoU25hcC5zZXQgfHwgQXJyYXkpKCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2RlbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICBzZXQucHVzaCh3cmFwKG5vZGVsaXN0W2ldKSk7XG4gICAgfVxuICAgIHJldHVybiBzZXQ7XG59O1xuXG5mdW5jdGlvbiBhZGQyZ3JvdXAobGlzdCkge1xuICAgIGlmICghaXMobGlzdCwgXCJhcnJheVwiKSkge1xuICAgICAgICBsaXN0ID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcbiAgICB9XG4gICAgdmFyIGkgPSAwLFxuICAgICAgICBqID0gMCxcbiAgICAgICAgbm9kZSA9IHRoaXMubm9kZTtcbiAgICB3aGlsZSAodGhpc1tpXSkgZGVsZXRlIHRoaXNbaSsrXTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAobGlzdFtpXS50eXBlID09IFwic2V0XCIpIHtcbiAgICAgICAgICAgIGxpc3RbaV0uZm9yRWFjaChmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgICAgICBub2RlLmFwcGVuZENoaWxkKGVsLm5vZGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBub2RlLmFwcGVuZENoaWxkKGxpc3RbaV0ubm9kZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdmFyIGNoaWxkcmVuID0gbm9kZS5jaGlsZE5vZGVzO1xuICAgIGZvciAoaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICB0aGlzW2orK10gPSB3cmFwKGNoaWxkcmVuW2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59XG4vLyBIdWIgZ2FyYmFnZSBjb2xsZWN0b3IgZXZlcnkgMTBzXG5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgZm9yICh2YXIga2V5IGluIGh1YikgaWYgKGh1YltoYXNdKGtleSkpIHtcbiAgICAgICAgdmFyIGVsID0gaHViW2tleV0sXG4gICAgICAgICAgICBub2RlID0gZWwubm9kZTtcbiAgICAgICAgaWYgKGVsLnR5cGUgIT0gXCJzdmdcIiAmJiAhbm9kZS5vd25lclNWR0VsZW1lbnQgfHwgZWwudHlwZSA9PSBcInN2Z1wiICYmICghbm9kZS5wYXJlbnROb2RlIHx8IFwib3duZXJTVkdFbGVtZW50XCIgaW4gbm9kZS5wYXJlbnROb2RlICYmICFub2RlLm93bmVyU1ZHRWxlbWVudCkpIHtcbiAgICAgICAgICAgIGRlbGV0ZSBodWJba2V5XTtcbiAgICAgICAgfVxuICAgIH1cbn0sIDFlNCk7XG5mdW5jdGlvbiBFbGVtZW50KGVsKSB7XG4gICAgaWYgKGVsLnNuYXAgaW4gaHViKSB7XG4gICAgICAgIHJldHVybiBodWJbZWwuc25hcF07XG4gICAgfVxuICAgIHZhciBzdmc7XG4gICAgdHJ5IHtcbiAgICAgICAgc3ZnID0gZWwub3duZXJTVkdFbGVtZW50O1xuICAgIH0gY2F0Y2goZSkge31cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5ub2RlXG4gICAgIFsgcHJvcGVydHkgKG9iamVjdCkgXVxuICAgICAqKlxuICAgICAqIEdpdmVzIHlvdSBhIHJlZmVyZW5jZSB0byB0aGUgRE9NIG9iamVjdCwgc28geW91IGNhbiBhc3NpZ24gZXZlbnQgaGFuZGxlcnMgb3IganVzdCBtZXNzIGFyb3VuZC5cbiAgICAgPiBVc2FnZVxuICAgICB8IC8vIGRyYXcgYSBjaXJjbGUgYXQgY29vcmRpbmF0ZSAxMCwxMCB3aXRoIHJhZGl1cyBvZiAxMFxuICAgICB8IHZhciBjID0gcGFwZXIuY2lyY2xlKDEwLCAxMCwgMTApO1xuICAgICB8IGMubm9kZS5vbmNsaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICB8ICAgICBjLmF0dHIoXCJmaWxsXCIsIFwicmVkXCIpO1xuICAgICB8IH07XG4gICAgXFwqL1xuICAgIHRoaXMubm9kZSA9IGVsO1xuICAgIGlmIChzdmcpIHtcbiAgICAgICAgdGhpcy5wYXBlciA9IG5ldyBQYXBlcihzdmcpO1xuICAgIH1cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC50eXBlXG4gICAgIFsgcHJvcGVydHkgKHN0cmluZykgXVxuICAgICAqKlxuICAgICAqIFNWRyB0YWcgbmFtZSBvZiB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAgICBcXCovXG4gICAgdGhpcy50eXBlID0gZWwudGFnTmFtZSB8fCBlbC5ub2RlTmFtZTtcbiAgICB2YXIgaWQgPSB0aGlzLmlkID0gSUQodGhpcyk7XG4gICAgdGhpcy5hbmltcyA9IHt9O1xuICAgIHRoaXMuXyA9IHtcbiAgICAgICAgdHJhbnNmb3JtOiBbXVxuICAgIH07XG4gICAgZWwuc25hcCA9IGlkO1xuICAgIGh1YltpZF0gPSB0aGlzO1xuICAgIGlmICh0aGlzLnR5cGUgPT0gXCJnXCIpIHtcbiAgICAgICAgdGhpcy5hZGQgPSBhZGQyZ3JvdXA7XG4gICAgfVxuICAgIGlmICh0aGlzLnR5cGUgaW4ge2c6IDEsIG1hc2s6IDEsIHBhdHRlcm46IDEsIHN5bWJvbDogMX0pIHtcbiAgICAgICAgZm9yICh2YXIgbWV0aG9kIGluIFBhcGVyLnByb3RvdHlwZSkgaWYgKFBhcGVyLnByb3RvdHlwZVtoYXNdKG1ldGhvZCkpIHtcbiAgICAgICAgICAgIHRoaXNbbWV0aG9kXSA9IFBhcGVyLnByb3RvdHlwZVttZXRob2RdO1xuICAgICAgICB9XG4gICAgfVxufVxuICAgLypcXFxuICAgICAqIEVsZW1lbnQuYXR0clxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogR2V0cyBvciBzZXRzIGdpdmVuIGF0dHJpYnV0ZXMgb2YgdGhlIGVsZW1lbnQuXG4gICAgICoqXG4gICAgIC0gcGFyYW1zIChvYmplY3QpIGNvbnRhaW5zIGtleS12YWx1ZSBwYWlycyBvZiBhdHRyaWJ1dGVzIHlvdSB3YW50IHRvIHNldFxuICAgICAqIG9yXG4gICAgIC0gcGFyYW0gKHN0cmluZykgbmFtZSBvZiB0aGUgYXR0cmlidXRlXG4gICAgID0gKEVsZW1lbnQpIHRoZSBjdXJyZW50IGVsZW1lbnRcbiAgICAgKiBvclxuICAgICA9IChzdHJpbmcpIHZhbHVlIG9mIGF0dHJpYnV0ZVxuICAgICA+IFVzYWdlXG4gICAgIHwgZWwuYXR0cih7XG4gICAgIHwgICAgIGZpbGw6IFwiI2ZjMFwiLFxuICAgICB8ICAgICBzdHJva2U6IFwiIzAwMFwiLFxuICAgICB8ICAgICBzdHJva2VXaWR0aDogMiwgLy8gQ2FtZWxDYXNlLi4uXG4gICAgIHwgICAgIFwiZmlsbC1vcGFjaXR5XCI6IDAuNSwgLy8gb3IgZGFzaC1zZXBhcmF0ZWQgbmFtZXNcbiAgICAgfCAgICAgd2lkdGg6IFwiKj0yXCIgLy8gcHJlZml4ZWQgdmFsdWVzXG4gICAgIHwgfSk7XG4gICAgIHwgY29uc29sZS5sb2coZWwuYXR0cihcImZpbGxcIikpOyAvLyAjZmMwXG4gICAgICogUHJlZml4ZWQgdmFsdWVzIGluIGZvcm1hdCBgXCIrPTEwXCJgIHN1cHBvcnRlZC4gQWxsIGZvdXIgb3BlcmF0aW9uc1xuICAgICAqIChgK2AsIGAtYCwgYCpgIGFuZCBgL2ApIGNvdWxkIGJlIHVzZWQuIE9wdGlvbmFsbHkgeW91IGNhbiB1c2UgdW5pdHMgZm9yIGArYFxuICAgICAqIGFuZCBgLWA6IGBcIis9MmVtXCJgLlxuICAgIFxcKi9cbiAgICBFbGVtZW50LnByb3RvdHlwZS5hdHRyID0gZnVuY3Rpb24gKHBhcmFtcywgdmFsdWUpIHtcbiAgICAgICAgdmFyIGVsID0gdGhpcyxcbiAgICAgICAgICAgIG5vZGUgPSBlbC5ub2RlO1xuICAgICAgICBpZiAoIXBhcmFtcykge1xuICAgICAgICAgICAgaWYgKG5vZGUubm9kZVR5cGUgIT0gMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IG5vZGUubm9kZVZhbHVlXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBhdHRyID0gbm9kZS5hdHRyaWJ1dGVzLFxuICAgICAgICAgICAgICAgIG91dCA9IHt9O1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gYXR0ci5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgb3V0W2F0dHJbaV0ubm9kZU5hbWVdID0gYXR0cltpXS5ub2RlVmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gb3V0O1xuICAgICAgICB9XG4gICAgICAgIGlmIChpcyhwYXJhbXMsIFwic3RyaW5nXCIpKSB7XG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICB2YXIganNvbiA9IHt9O1xuICAgICAgICAgICAgICAgIGpzb25bcGFyYW1zXSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIHBhcmFtcyA9IGpzb247XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBldmUoXCJzbmFwLnV0aWwuZ2V0YXR0ci5cIiArIHBhcmFtcywgZWwpLmZpcnN0RGVmaW5lZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGF0dCBpbiBwYXJhbXMpIHtcbiAgICAgICAgICAgIGlmIChwYXJhbXNbaGFzXShhdHQpKSB7XG4gICAgICAgICAgICAgICAgZXZlKFwic25hcC51dGlsLmF0dHIuXCIgKyBhdHQsIGVsLCBwYXJhbXNbYXR0XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGVsO1xuICAgIH07XG4vKlxcXG4gKiBTbmFwLnBhcnNlXG4gWyBtZXRob2QgXVxuICoqXG4gKiBQYXJzZXMgU1ZHIGZyYWdtZW50IGFuZCBjb252ZXJ0cyBpdCBpbnRvIGEgQEZyYWdtZW50XG4gKipcbiAtIHN2ZyAoc3RyaW5nKSBTVkcgc3RyaW5nXG4gPSAoRnJhZ21lbnQpIHRoZSBARnJhZ21lbnRcblxcKi9cblNuYXAucGFyc2UgPSBmdW5jdGlvbiAoc3ZnKSB7XG4gICAgdmFyIGYgPSBnbG9iLmRvYy5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCksXG4gICAgICAgIGZ1bGwgPSB0cnVlLFxuICAgICAgICBkaXYgPSBnbG9iLmRvYy5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIHN2ZyA9IFN0cihzdmcpO1xuICAgIGlmICghc3ZnLm1hdGNoKC9eXFxzKjxcXHMqc3ZnKD86XFxzfD4pLykpIHtcbiAgICAgICAgc3ZnID0gXCI8c3ZnPlwiICsgc3ZnICsgXCI8L3N2Zz5cIjtcbiAgICAgICAgZnVsbCA9IGZhbHNlO1xuICAgIH1cbiAgICBkaXYuaW5uZXJIVE1MID0gc3ZnO1xuICAgIHN2ZyA9IGRpdi5nZXRFbGVtZW50c0J5VGFnTmFtZShcInN2Z1wiKVswXTtcbiAgICBpZiAoc3ZnKSB7XG4gICAgICAgIGlmIChmdWxsKSB7XG4gICAgICAgICAgICBmID0gc3ZnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgd2hpbGUgKHN2Zy5maXJzdENoaWxkKSB7XG4gICAgICAgICAgICAgICAgZi5hcHBlbmRDaGlsZChzdmcuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG5ldyBGcmFnbWVudChmKTtcbn07XG5mdW5jdGlvbiBGcmFnbWVudChmcmFnKSB7XG4gICAgdGhpcy5ub2RlID0gZnJhZztcbn1cbi8qXFxcbiAqIFNuYXAuZnJhZ21lbnRcbiBbIG1ldGhvZCBdXG4gKipcbiAqIENyZWF0ZXMgYSBET00gZnJhZ21lbnQgZnJvbSBhIGdpdmVuIGxpc3Qgb2YgZWxlbWVudHMgb3Igc3RyaW5nc1xuICoqXG4gLSB2YXJhcmdzICjigKYpIFNWRyBzdHJpbmdcbiA9IChGcmFnbWVudCkgdGhlIEBGcmFnbWVudFxuXFwqL1xuU25hcC5mcmFnbWVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCksXG4gICAgICAgIGYgPSBnbG9iLmRvYy5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGlpID0gYXJncy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgIHZhciBpdGVtID0gYXJnc1tpXTtcbiAgICAgICAgaWYgKGl0ZW0ubm9kZSAmJiBpdGVtLm5vZGUubm9kZVR5cGUpIHtcbiAgICAgICAgICAgIGYuYXBwZW5kQ2hpbGQoaXRlbS5ub2RlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXRlbS5ub2RlVHlwZSkge1xuICAgICAgICAgICAgZi5hcHBlbmRDaGlsZChpdGVtKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGl0ZW0gPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgZi5hcHBlbmRDaGlsZChTbmFwLnBhcnNlKGl0ZW0pLm5vZGUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBuZXcgRnJhZ21lbnQoZik7XG59O1xuXG5mdW5jdGlvbiBtYWtlKG5hbWUsIHBhcmVudCkge1xuICAgIHZhciByZXMgPSAkKG5hbWUpO1xuICAgIHBhcmVudC5hcHBlbmRDaGlsZChyZXMpO1xuICAgIHZhciBlbCA9IHdyYXAocmVzKTtcbiAgICByZXR1cm4gZWw7XG59XG5mdW5jdGlvbiBQYXBlcih3LCBoKSB7XG4gICAgdmFyIHJlcyxcbiAgICAgICAgZGVzYyxcbiAgICAgICAgZGVmcyxcbiAgICAgICAgcHJvdG8gPSBQYXBlci5wcm90b3R5cGU7XG4gICAgaWYgKHcgJiYgdy50YWdOYW1lID09IFwic3ZnXCIpIHtcbiAgICAgICAgaWYgKHcuc25hcCBpbiBodWIpIHtcbiAgICAgICAgICAgIHJldHVybiBodWJbdy5zbmFwXTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZG9jID0gdy5vd25lckRvY3VtZW50O1xuICAgICAgICByZXMgPSBuZXcgRWxlbWVudCh3KTtcbiAgICAgICAgZGVzYyA9IHcuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJkZXNjXCIpWzBdO1xuICAgICAgICBkZWZzID0gdy5nZXRFbGVtZW50c0J5VGFnTmFtZShcImRlZnNcIilbMF07XG4gICAgICAgIGlmICghZGVzYykge1xuICAgICAgICAgICAgZGVzYyA9ICQoXCJkZXNjXCIpO1xuICAgICAgICAgICAgZGVzYy5hcHBlbmRDaGlsZChkb2MuY3JlYXRlVGV4dE5vZGUoXCJDcmVhdGVkIHdpdGggU25hcFwiKSk7XG4gICAgICAgICAgICByZXMubm9kZS5hcHBlbmRDaGlsZChkZXNjKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWRlZnMpIHtcbiAgICAgICAgICAgIGRlZnMgPSAkKFwiZGVmc1wiKTtcbiAgICAgICAgICAgIHJlcy5ub2RlLmFwcGVuZENoaWxkKGRlZnMpO1xuICAgICAgICB9XG4gICAgICAgIHJlcy5kZWZzID0gZGVmcztcbiAgICAgICAgZm9yICh2YXIga2V5IGluIHByb3RvKSBpZiAocHJvdG9baGFzXShrZXkpKSB7XG4gICAgICAgICAgICByZXNba2V5XSA9IHByb3RvW2tleV07XG4gICAgICAgIH1cbiAgICAgICAgcmVzLnBhcGVyID0gcmVzLnJvb3QgPSByZXM7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmVzID0gbWFrZShcInN2Z1wiLCBnbG9iLmRvYy5ib2R5KTtcbiAgICAgICAgJChyZXMubm9kZSwge1xuICAgICAgICAgICAgaGVpZ2h0OiBoLFxuICAgICAgICAgICAgdmVyc2lvbjogMS4xLFxuICAgICAgICAgICAgd2lkdGg6IHcsXG4gICAgICAgICAgICB4bWxuczogeG1sbnNcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG59XG5mdW5jdGlvbiB3cmFwKGRvbSkge1xuICAgIGlmICghZG9tKSB7XG4gICAgICAgIHJldHVybiBkb207XG4gICAgfVxuICAgIGlmIChkb20gaW5zdGFuY2VvZiBFbGVtZW50IHx8IGRvbSBpbnN0YW5jZW9mIEZyYWdtZW50KSB7XG4gICAgICAgIHJldHVybiBkb207XG4gICAgfVxuICAgIGlmIChkb20udGFnTmFtZSAmJiBkb20udGFnTmFtZS50b0xvd2VyQ2FzZSgpID09IFwic3ZnXCIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQYXBlcihkb20pO1xuICAgIH1cbiAgICBpZiAoZG9tLnRhZ05hbWUgJiYgZG9tLnRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PSBcIm9iamVjdFwiICYmIGRvbS50eXBlID09IFwiaW1hZ2Uvc3ZnK3htbFwiKSB7XG4gICAgICAgIHJldHVybiBuZXcgUGFwZXIoZG9tLmNvbnRlbnREb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcInN2Z1wiKVswXSk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgRWxlbWVudChkb20pO1xufVxuXG5TbmFwLl8ubWFrZSA9IG1ha2U7XG5TbmFwLl8ud3JhcCA9IHdyYXA7XG4vKlxcXG4gKiBQYXBlci5lbFxuIFsgbWV0aG9kIF1cbiAqKlxuICogQ3JlYXRlcyBhbiBlbGVtZW50IG9uIHBhcGVyIHdpdGggYSBnaXZlbiBuYW1lIGFuZCBubyBhdHRyaWJ1dGVzXG4gKipcbiAtIG5hbWUgKHN0cmluZykgdGFnIG5hbWVcbiAtIGF0dHIgKG9iamVjdCkgYXR0cmlidXRlc1xuID0gKEVsZW1lbnQpIHRoZSBjdXJyZW50IGVsZW1lbnRcbiA+IFVzYWdlXG4gfCB2YXIgYyA9IHBhcGVyLmNpcmNsZSgxMCwgMTAsIDEwKTsgLy8gaXMgdGhlIHNhbWUgYXMuLi5cbiB8IHZhciBjID0gcGFwZXIuZWwoXCJjaXJjbGVcIikuYXR0cih7XG4gfCAgICAgY3g6IDEwLFxuIHwgICAgIGN5OiAxMCxcbiB8ICAgICByOiAxMFxuIHwgfSk7XG4gfCAvLyBhbmQgdGhlIHNhbWUgYXNcbiB8IHZhciBjID0gcGFwZXIuZWwoXCJjaXJjbGVcIiwge1xuIHwgICAgIGN4OiAxMCxcbiB8ICAgICBjeTogMTAsXG4gfCAgICAgcjogMTBcbiB8IH0pO1xuXFwqL1xuUGFwZXIucHJvdG90eXBlLmVsID0gZnVuY3Rpb24gKG5hbWUsIGF0dHIpIHtcbiAgICB2YXIgZWwgPSBtYWtlKG5hbWUsIHRoaXMubm9kZSk7XG4gICAgYXR0ciAmJiBlbC5hdHRyKGF0dHIpO1xuICAgIHJldHVybiBlbDtcbn07XG4vKlxcXG4gKiBFbGVtZW50LmNoaWxkcmVuXG4gWyBtZXRob2QgXVxuICoqXG4gKiBSZXR1cm5zIGFycmF5IG9mIGFsbCB0aGUgY2hpbGRyZW4gb2YgdGhlIGVsZW1lbnQuXG4gPSAoYXJyYXkpIGFycmF5IG9mIEVsZW1lbnRzXG5cXCovXG5FbGVtZW50LnByb3RvdHlwZS5jaGlsZHJlbiA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgb3V0ID0gW10sXG4gICAgICAgIGNoID0gdGhpcy5ub2RlLmNoaWxkTm9kZXM7XG4gICAgZm9yICh2YXIgaSA9IDAsIGlpID0gY2gubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICBvdXRbaV0gPSBTbmFwKGNoW2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIG91dDtcbn07XG5mdW5jdGlvbiBqc29uRmlsbGVyKHJvb3QsIG8pIHtcbiAgICBmb3IgKHZhciBpID0gMCwgaWkgPSByb290Lmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgdmFyIGl0ZW0gPSB7XG4gICAgICAgICAgICAgICAgdHlwZTogcm9vdFtpXS50eXBlLFxuICAgICAgICAgICAgICAgIGF0dHI6IHJvb3RbaV0uYXR0cigpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2hpbGRyZW4gPSByb290W2ldLmNoaWxkcmVuKCk7XG4gICAgICAgIG8ucHVzaChpdGVtKTtcbiAgICAgICAgaWYgKGNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICAgICAganNvbkZpbGxlcihjaGlsZHJlbiwgaXRlbS5jaGlsZE5vZGVzID0gW10pO1xuICAgICAgICB9XG4gICAgfVxufVxuLypcXFxuICogRWxlbWVudC50b0pTT05cbiBbIG1ldGhvZCBdXG4gKipcbiAqIFJldHVybnMgb2JqZWN0IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBnaXZlbiBlbGVtZW50IGFuZCBhbGwgaXRzIGNoaWxkcmVuLlxuID0gKG9iamVjdCkgaW4gZm9ybWF0XG4gbyB7XG4gbyAgICAgdHlwZSAoc3RyaW5nKSB0aGlzLnR5cGUsXG4gbyAgICAgYXR0ciAob2JqZWN0KSBhdHRyaWJ1dGVzIG1hcCxcbiBvICAgICBjaGlsZE5vZGVzIChhcnJheSkgb3B0aW9uYWwgYXJyYXkgb2YgY2hpbGRyZW4gaW4gdGhlIHNhbWUgZm9ybWF0XG4gbyB9XG5cXCovXG5FbGVtZW50LnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG91dCA9IFtdO1xuICAgIGpzb25GaWxsZXIoW3RoaXNdLCBvdXQpO1xuICAgIHJldHVybiBvdXRbMF07XG59O1xuLy8gZGVmYXVsdFxuZXZlLm9uKFwic25hcC51dGlsLmdldGF0dHJcIiwgZnVuY3Rpb24gKCkge1xuICAgIHZhciBhdHQgPSBldmUubnQoKTtcbiAgICBhdHQgPSBhdHQuc3Vic3RyaW5nKGF0dC5sYXN0SW5kZXhPZihcIi5cIikgKyAxKTtcbiAgICB2YXIgY3NzID0gYXR0LnJlcGxhY2UoL1tBLVpdL2csIGZ1bmN0aW9uIChsZXR0ZXIpIHtcbiAgICAgICAgcmV0dXJuIFwiLVwiICsgbGV0dGVyLnRvTG93ZXJDYXNlKCk7XG4gICAgfSk7XG4gICAgaWYgKGNzc0F0dHJbaGFzXShjc3MpKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5vZGUub3duZXJEb2N1bWVudC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKHRoaXMubm9kZSwgbnVsbCkuZ2V0UHJvcGVydHlWYWx1ZShjc3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAkKHRoaXMubm9kZSwgYXR0KTtcbiAgICB9XG59KTtcbnZhciBjc3NBdHRyID0ge1xuICAgIFwiYWxpZ25tZW50LWJhc2VsaW5lXCI6IDAsXG4gICAgXCJiYXNlbGluZS1zaGlmdFwiOiAwLFxuICAgIFwiY2xpcFwiOiAwLFxuICAgIFwiY2xpcC1wYXRoXCI6IDAsXG4gICAgXCJjbGlwLXJ1bGVcIjogMCxcbiAgICBcImNvbG9yXCI6IDAsXG4gICAgXCJjb2xvci1pbnRlcnBvbGF0aW9uXCI6IDAsXG4gICAgXCJjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnNcIjogMCxcbiAgICBcImNvbG9yLXByb2ZpbGVcIjogMCxcbiAgICBcImNvbG9yLXJlbmRlcmluZ1wiOiAwLFxuICAgIFwiY3Vyc29yXCI6IDAsXG4gICAgXCJkaXJlY3Rpb25cIjogMCxcbiAgICBcImRpc3BsYXlcIjogMCxcbiAgICBcImRvbWluYW50LWJhc2VsaW5lXCI6IDAsXG4gICAgXCJlbmFibGUtYmFja2dyb3VuZFwiOiAwLFxuICAgIFwiZmlsbFwiOiAwLFxuICAgIFwiZmlsbC1vcGFjaXR5XCI6IDAsXG4gICAgXCJmaWxsLXJ1bGVcIjogMCxcbiAgICBcImZpbHRlclwiOiAwLFxuICAgIFwiZmxvb2QtY29sb3JcIjogMCxcbiAgICBcImZsb29kLW9wYWNpdHlcIjogMCxcbiAgICBcImZvbnRcIjogMCxcbiAgICBcImZvbnQtZmFtaWx5XCI6IDAsXG4gICAgXCJmb250LXNpemVcIjogMCxcbiAgICBcImZvbnQtc2l6ZS1hZGp1c3RcIjogMCxcbiAgICBcImZvbnQtc3RyZXRjaFwiOiAwLFxuICAgIFwiZm9udC1zdHlsZVwiOiAwLFxuICAgIFwiZm9udC12YXJpYW50XCI6IDAsXG4gICAgXCJmb250LXdlaWdodFwiOiAwLFxuICAgIFwiZ2x5cGgtb3JpZW50YXRpb24taG9yaXpvbnRhbFwiOiAwLFxuICAgIFwiZ2x5cGgtb3JpZW50YXRpb24tdmVydGljYWxcIjogMCxcbiAgICBcImltYWdlLXJlbmRlcmluZ1wiOiAwLFxuICAgIFwia2VybmluZ1wiOiAwLFxuICAgIFwibGV0dGVyLXNwYWNpbmdcIjogMCxcbiAgICBcImxpZ2h0aW5nLWNvbG9yXCI6IDAsXG4gICAgXCJtYXJrZXJcIjogMCxcbiAgICBcIm1hcmtlci1lbmRcIjogMCxcbiAgICBcIm1hcmtlci1taWRcIjogMCxcbiAgICBcIm1hcmtlci1zdGFydFwiOiAwLFxuICAgIFwibWFza1wiOiAwLFxuICAgIFwib3BhY2l0eVwiOiAwLFxuICAgIFwib3ZlcmZsb3dcIjogMCxcbiAgICBcInBvaW50ZXItZXZlbnRzXCI6IDAsXG4gICAgXCJzaGFwZS1yZW5kZXJpbmdcIjogMCxcbiAgICBcInN0b3AtY29sb3JcIjogMCxcbiAgICBcInN0b3Atb3BhY2l0eVwiOiAwLFxuICAgIFwic3Ryb2tlXCI6IDAsXG4gICAgXCJzdHJva2UtZGFzaGFycmF5XCI6IDAsXG4gICAgXCJzdHJva2UtZGFzaG9mZnNldFwiOiAwLFxuICAgIFwic3Ryb2tlLWxpbmVjYXBcIjogMCxcbiAgICBcInN0cm9rZS1saW5lam9pblwiOiAwLFxuICAgIFwic3Ryb2tlLW1pdGVybGltaXRcIjogMCxcbiAgICBcInN0cm9rZS1vcGFjaXR5XCI6IDAsXG4gICAgXCJzdHJva2Utd2lkdGhcIjogMCxcbiAgICBcInRleHQtYW5jaG9yXCI6IDAsXG4gICAgXCJ0ZXh0LWRlY29yYXRpb25cIjogMCxcbiAgICBcInRleHQtcmVuZGVyaW5nXCI6IDAsXG4gICAgXCJ1bmljb2RlLWJpZGlcIjogMCxcbiAgICBcInZpc2liaWxpdHlcIjogMCxcbiAgICBcIndvcmQtc3BhY2luZ1wiOiAwLFxuICAgIFwid3JpdGluZy1tb2RlXCI6IDBcbn07XG5cbmV2ZS5vbihcInNuYXAudXRpbC5hdHRyXCIsIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHZhciBhdHQgPSBldmUubnQoKSxcbiAgICAgICAgYXR0ciA9IHt9O1xuICAgIGF0dCA9IGF0dC5zdWJzdHJpbmcoYXR0Lmxhc3RJbmRleE9mKFwiLlwiKSArIDEpO1xuICAgIGF0dHJbYXR0XSA9IHZhbHVlO1xuICAgIHZhciBzdHlsZSA9IGF0dC5yZXBsYWNlKC8tKFxcdykvZ2ksIGZ1bmN0aW9uIChhbGwsIGxldHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIGxldHRlci50b1VwcGVyQ2FzZSgpO1xuICAgICAgICB9KSxcbiAgICAgICAgY3NzID0gYXR0LnJlcGxhY2UoL1tBLVpdL2csIGZ1bmN0aW9uIChsZXR0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBcIi1cIiArIGxldHRlci50b0xvd2VyQ2FzZSgpO1xuICAgICAgICB9KTtcbiAgICBpZiAoY3NzQXR0cltoYXNdKGNzcykpIHtcbiAgICAgICAgdGhpcy5ub2RlLnN0eWxlW3N0eWxlXSA9IHZhbHVlID09IG51bGwgPyBFIDogdmFsdWU7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgJCh0aGlzLm5vZGUsIGF0dHIpO1xuICAgIH1cbn0pO1xuKGZ1bmN0aW9uIChwcm90bykge30oUGFwZXIucHJvdG90eXBlKSk7XG5cbi8vIHNpbXBsZSBhamF4XG4vKlxcXG4gKiBTbmFwLmFqYXhcbiBbIG1ldGhvZCBdXG4gKipcbiAqIFNpbXBsZSBpbXBsZW1lbnRhdGlvbiBvZiBBamF4XG4gKipcbiAtIHVybCAoc3RyaW5nKSBVUkxcbiAtIHBvc3REYXRhIChvYmplY3R8c3RyaW5nKSBkYXRhIGZvciBwb3N0IHJlcXVlc3RcbiAtIGNhbGxiYWNrIChmdW5jdGlvbikgY2FsbGJhY2tcbiAtIHNjb3BlIChvYmplY3QpICNvcHRpb25hbCBzY29wZSBvZiBjYWxsYmFja1xuICogb3JcbiAtIHVybCAoc3RyaW5nKSBVUkxcbiAtIGNhbGxiYWNrIChmdW5jdGlvbikgY2FsbGJhY2tcbiAtIHNjb3BlIChvYmplY3QpICNvcHRpb25hbCBzY29wZSBvZiBjYWxsYmFja1xuID0gKFhNTEh0dHBSZXF1ZXN0KSB0aGUgWE1MSHR0cFJlcXVlc3Qgb2JqZWN0LCBqdXN0IGluIGNhc2VcblxcKi9cblNuYXAuYWpheCA9IGZ1bmN0aW9uICh1cmwsIHBvc3REYXRhLCBjYWxsYmFjaywgc2NvcGUpe1xuICAgIHZhciByZXEgPSBuZXcgWE1MSHR0cFJlcXVlc3QsXG4gICAgICAgIGlkID0gSUQoKTtcbiAgICBpZiAocmVxKSB7XG4gICAgICAgIGlmIChpcyhwb3N0RGF0YSwgXCJmdW5jdGlvblwiKSkge1xuICAgICAgICAgICAgc2NvcGUgPSBjYWxsYmFjaztcbiAgICAgICAgICAgIGNhbGxiYWNrID0gcG9zdERhdGE7XG4gICAgICAgICAgICBwb3N0RGF0YSA9IG51bGw7XG4gICAgICAgIH0gZWxzZSBpZiAoaXMocG9zdERhdGEsIFwib2JqZWN0XCIpKSB7XG4gICAgICAgICAgICB2YXIgcGQgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBwb3N0RGF0YSkgaWYgKHBvc3REYXRhLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICBwZC5wdXNoKGVuY29kZVVSSUNvbXBvbmVudChrZXkpICsgXCI9XCIgKyBlbmNvZGVVUklDb21wb25lbnQocG9zdERhdGFba2V5XSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcG9zdERhdGEgPSBwZC5qb2luKFwiJlwiKTtcbiAgICAgICAgfVxuICAgICAgICByZXEub3BlbigocG9zdERhdGEgPyBcIlBPU1RcIiA6IFwiR0VUXCIpLCB1cmwsIHRydWUpO1xuICAgICAgICBpZiAocG9zdERhdGEpIHtcbiAgICAgICAgICAgIHJlcS5zZXRSZXF1ZXN0SGVhZGVyKFwiWC1SZXF1ZXN0ZWQtV2l0aFwiLCBcIlhNTEh0dHBSZXF1ZXN0XCIpO1xuICAgICAgICAgICAgcmVxLnNldFJlcXVlc3RIZWFkZXIoXCJDb250ZW50LXR5cGVcIiwgXCJhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWRcIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBldmUub25jZShcInNuYXAuYWpheC5cIiArIGlkICsgXCIuMFwiLCBjYWxsYmFjayk7XG4gICAgICAgICAgICBldmUub25jZShcInNuYXAuYWpheC5cIiArIGlkICsgXCIuMjAwXCIsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIGV2ZS5vbmNlKFwic25hcC5hamF4LlwiICsgaWQgKyBcIi4zMDRcIiwgY2FsbGJhY2spO1xuICAgICAgICB9XG4gICAgICAgIHJlcS5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmIChyZXEucmVhZHlTdGF0ZSAhPSA0KSByZXR1cm47XG4gICAgICAgICAgICBldmUoXCJzbmFwLmFqYXguXCIgKyBpZCArIFwiLlwiICsgcmVxLnN0YXR1cywgc2NvcGUsIHJlcSk7XG4gICAgICAgIH07XG4gICAgICAgIGlmIChyZXEucmVhZHlTdGF0ZSA9PSA0KSB7XG4gICAgICAgICAgICByZXR1cm4gcmVxO1xuICAgICAgICB9XG4gICAgICAgIHJlcS5zZW5kKHBvc3REYXRhKTtcbiAgICAgICAgcmV0dXJuIHJlcTtcbiAgICB9XG59O1xuLypcXFxuICogU25hcC5sb2FkXG4gWyBtZXRob2QgXVxuICoqXG4gKiBMb2FkcyBleHRlcm5hbCBTVkcgZmlsZSBhcyBhIEBGcmFnbWVudCAoc2VlIEBTbmFwLmFqYXggZm9yIG1vcmUgYWR2YW5jZWQgQUpBWClcbiAqKlxuIC0gdXJsIChzdHJpbmcpIFVSTFxuIC0gY2FsbGJhY2sgKGZ1bmN0aW9uKSBjYWxsYmFja1xuIC0gc2NvcGUgKG9iamVjdCkgI29wdGlvbmFsIHNjb3BlIG9mIGNhbGxiYWNrXG5cXCovXG5TbmFwLmxvYWQgPSBmdW5jdGlvbiAodXJsLCBjYWxsYmFjaywgc2NvcGUpIHtcbiAgICBTbmFwLmFqYXgodXJsLCBmdW5jdGlvbiAocmVxKSB7XG4gICAgICAgIHZhciBmID0gU25hcC5wYXJzZShyZXEucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgc2NvcGUgPyBjYWxsYmFjay5jYWxsKHNjb3BlLCBmKSA6IGNhbGxiYWNrKGYpO1xuICAgIH0pO1xufTtcbnZhciBnZXRPZmZzZXQgPSBmdW5jdGlvbiAoZWxlbSkge1xuICAgIHZhciBib3ggPSBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLFxuICAgICAgICBkb2MgPSBlbGVtLm93bmVyRG9jdW1lbnQsXG4gICAgICAgIGJvZHkgPSBkb2MuYm9keSxcbiAgICAgICAgZG9jRWxlbSA9IGRvYy5kb2N1bWVudEVsZW1lbnQsXG4gICAgICAgIGNsaWVudFRvcCA9IGRvY0VsZW0uY2xpZW50VG9wIHx8IGJvZHkuY2xpZW50VG9wIHx8IDAsIGNsaWVudExlZnQgPSBkb2NFbGVtLmNsaWVudExlZnQgfHwgYm9keS5jbGllbnRMZWZ0IHx8IDAsXG4gICAgICAgIHRvcCAgPSBib3gudG9wICArIChnLndpbi5wYWdlWU9mZnNldCB8fCBkb2NFbGVtLnNjcm9sbFRvcCB8fCBib2R5LnNjcm9sbFRvcCApIC0gY2xpZW50VG9wLFxuICAgICAgICBsZWZ0ID0gYm94LmxlZnQgKyAoZy53aW4ucGFnZVhPZmZzZXQgfHwgZG9jRWxlbS5zY3JvbGxMZWZ0IHx8IGJvZHkuc2Nyb2xsTGVmdCkgLSBjbGllbnRMZWZ0O1xuICAgIHJldHVybiB7XG4gICAgICAgIHk6IHRvcCxcbiAgICAgICAgeDogbGVmdFxuICAgIH07XG59O1xuLypcXFxuICogU25hcC5nZXRFbGVtZW50QnlQb2ludFxuIFsgbWV0aG9kIF1cbiAqKlxuICogUmV0dXJucyB5b3UgdG9wbW9zdCBlbGVtZW50IHVuZGVyIGdpdmVuIHBvaW50LlxuICoqXG4gPSAob2JqZWN0KSBTbmFwIGVsZW1lbnQgb2JqZWN0XG4gLSB4IChudW1iZXIpIHggY29vcmRpbmF0ZSBmcm9tIHRoZSB0b3AgbGVmdCBjb3JuZXIgb2YgdGhlIHdpbmRvd1xuIC0geSAobnVtYmVyKSB5IGNvb3JkaW5hdGUgZnJvbSB0aGUgdG9wIGxlZnQgY29ybmVyIG9mIHRoZSB3aW5kb3dcbiA+IFVzYWdlXG4gfCBTbmFwLmdldEVsZW1lbnRCeVBvaW50KG1vdXNlWCwgbW91c2VZKS5hdHRyKHtzdHJva2U6IFwiI2YwMFwifSk7XG5cXCovXG5TbmFwLmdldEVsZW1lbnRCeVBvaW50ID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICB2YXIgcGFwZXIgPSB0aGlzLFxuICAgICAgICBzdmcgPSBwYXBlci5jYW52YXMsXG4gICAgICAgIHRhcmdldCA9IGdsb2IuZG9jLmVsZW1lbnRGcm9tUG9pbnQoeCwgeSk7XG4gICAgaWYgKGdsb2Iud2luLm9wZXJhICYmIHRhcmdldC50YWdOYW1lID09IFwic3ZnXCIpIHtcbiAgICAgICAgdmFyIHNvID0gZ2V0T2Zmc2V0KHRhcmdldCksXG4gICAgICAgICAgICBzciA9IHRhcmdldC5jcmVhdGVTVkdSZWN0KCk7XG4gICAgICAgIHNyLnggPSB4IC0gc28ueDtcbiAgICAgICAgc3IueSA9IHkgLSBzby55O1xuICAgICAgICBzci53aWR0aCA9IHNyLmhlaWdodCA9IDE7XG4gICAgICAgIHZhciBoaXRzID0gdGFyZ2V0LmdldEludGVyc2VjdGlvbkxpc3Qoc3IsIG51bGwpO1xuICAgICAgICBpZiAoaGl0cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRhcmdldCA9IGhpdHNbaGl0cy5sZW5ndGggLSAxXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoIXRhcmdldCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIHdyYXAodGFyZ2V0KTtcbn07XG4vKlxcXG4gKiBTbmFwLnBsdWdpblxuIFsgbWV0aG9kIF1cbiAqKlxuICogTGV0IHlvdSB3cml0ZSBwbHVnaW5zLiBZb3UgcGFzcyBpbiBhIGZ1bmN0aW9uIHdpdGggZml2ZSBhcmd1bWVudHMsIGxpa2UgdGhpczpcbiB8IFNuYXAucGx1Z2luKGZ1bmN0aW9uIChTbmFwLCBFbGVtZW50LCBQYXBlciwgZ2xvYmFsLCBGcmFnbWVudCkge1xuIHwgICAgIFNuYXAubmV3bWV0aG9kID0gZnVuY3Rpb24gKCkge307XG4gfCAgICAgRWxlbWVudC5wcm90b3R5cGUubmV3bWV0aG9kID0gZnVuY3Rpb24gKCkge307XG4gfCAgICAgUGFwZXIucHJvdG90eXBlLm5ld21ldGhvZCA9IGZ1bmN0aW9uICgpIHt9O1xuIHwgfSk7XG4gKiBJbnNpZGUgdGhlIGZ1bmN0aW9uIHlvdSBoYXZlIGFjY2VzcyB0byBhbGwgbWFpbiBvYmplY3RzIChhbmQgdGhlaXJcbiAqIHByb3RvdHlwZXMpLiBUaGlzIGFsbG93IHlvdSB0byBleHRlbmQgYW55dGhpbmcgeW91IHdhbnQuXG4gKipcbiAtIGYgKGZ1bmN0aW9uKSB5b3VyIHBsdWdpbiBib2R5XG5cXCovXG5TbmFwLnBsdWdpbiA9IGZ1bmN0aW9uIChmKSB7XG4gICAgZihTbmFwLCBFbGVtZW50LCBQYXBlciwgZ2xvYiwgRnJhZ21lbnQpO1xufTtcbmdsb2Iud2luLlNuYXAgPSBTbmFwO1xucmV0dXJuIFNuYXA7XG59KHdpbmRvdyB8fCB0aGlzKSk7XG5cbi8vIENvcHlyaWdodCAoYykgMjAxMyBBZG9iZSBTeXN0ZW1zIEluY29ycG9yYXRlZC4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cblNuYXAucGx1Z2luKGZ1bmN0aW9uIChTbmFwLCBFbGVtZW50LCBQYXBlciwgZ2xvYiwgRnJhZ21lbnQpIHtcbiAgICB2YXIgZWxwcm90byA9IEVsZW1lbnQucHJvdG90eXBlLFxuICAgICAgICBpcyA9IFNuYXAuaXMsXG4gICAgICAgIFN0ciA9IFN0cmluZyxcbiAgICAgICAgdW5pdDJweCA9IFNuYXAuX3VuaXQycHgsXG4gICAgICAgICQgPSBTbmFwLl8uJCxcbiAgICAgICAgbWFrZSA9IFNuYXAuXy5tYWtlLFxuICAgICAgICBnZXRTb21lRGVmcyA9IFNuYXAuXy5nZXRTb21lRGVmcyxcbiAgICAgICAgaGFzID0gXCJoYXNPd25Qcm9wZXJ0eVwiLFxuICAgICAgICB3cmFwID0gU25hcC5fLndyYXA7XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuZ2V0QkJveFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJucyB0aGUgYm91bmRpbmcgYm94IGRlc2NyaXB0b3IgZm9yIHRoZSBnaXZlbiBlbGVtZW50XG4gICAgICoqXG4gICAgID0gKG9iamVjdCkgYm91bmRpbmcgYm94IGRlc2NyaXB0b3I6XG4gICAgIG8ge1xuICAgICBvICAgICBjeDogKG51bWJlcikgeCBvZiB0aGUgY2VudGVyLFxuICAgICBvICAgICBjeTogKG51bWJlcikgeCBvZiB0aGUgY2VudGVyLFxuICAgICBvICAgICBoOiAobnVtYmVyKSBoZWlnaHQsXG4gICAgIG8gICAgIGhlaWdodDogKG51bWJlcikgaGVpZ2h0LFxuICAgICBvICAgICBwYXRoOiAoc3RyaW5nKSBwYXRoIGNvbW1hbmQgZm9yIHRoZSBib3gsXG4gICAgIG8gICAgIHIwOiAobnVtYmVyKSByYWRpdXMgb2YgYSBjaXJjbGUgdGhhdCBmdWxseSBlbmNsb3NlcyB0aGUgYm94LFxuICAgICBvICAgICByMTogKG51bWJlcikgcmFkaXVzIG9mIHRoZSBzbWFsbGVzdCBjaXJjbGUgdGhhdCBjYW4gYmUgZW5jbG9zZWQsXG4gICAgIG8gICAgIHIyOiAobnVtYmVyKSByYWRpdXMgb2YgdGhlIGxhcmdlc3QgY2lyY2xlIHRoYXQgY2FuIGJlIGVuY2xvc2VkLFxuICAgICBvICAgICB2YjogKHN0cmluZykgYm94IGFzIGEgdmlld2JveCBjb21tYW5kLFxuICAgICBvICAgICB3OiAobnVtYmVyKSB3aWR0aCxcbiAgICAgbyAgICAgd2lkdGg6IChudW1iZXIpIHdpZHRoLFxuICAgICBvICAgICB4MjogKG51bWJlcikgeCBvZiB0aGUgcmlnaHQgc2lkZSxcbiAgICAgbyAgICAgeDogKG51bWJlcikgeCBvZiB0aGUgbGVmdCBzaWRlLFxuICAgICBvICAgICB5MjogKG51bWJlcikgeSBvZiB0aGUgYm90dG9tIGVkZ2UsXG4gICAgIG8gICAgIHk6IChudW1iZXIpIHkgb2YgdGhlIHRvcCBlZGdlXG4gICAgIG8gfVxuICAgIFxcKi9cbiAgICBlbHByb3RvLmdldEJCb3ggPSBmdW5jdGlvbiAoaXNXaXRob3V0VHJhbnNmb3JtKSB7XG4gICAgICAgIGlmICghU25hcC5NYXRyaXggfHwgIVNuYXAucGF0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubm9kZS5nZXRCQm94KCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGVsID0gdGhpcyxcbiAgICAgICAgICAgIG0gPSBuZXcgU25hcC5NYXRyaXg7XG4gICAgICAgIGlmIChlbC5yZW1vdmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gU25hcC5fLmJveCgpO1xuICAgICAgICB9XG4gICAgICAgIHdoaWxlIChlbC50eXBlID09IFwidXNlXCIpIHtcbiAgICAgICAgICAgIGlmICghaXNXaXRob3V0VHJhbnNmb3JtKSB7XG4gICAgICAgICAgICAgICAgbSA9IG0uYWRkKGVsLnRyYW5zZm9ybSgpLmxvY2FsTWF0cml4LnRyYW5zbGF0ZShlbC5hdHRyKFwieFwiKSB8fCAwLCBlbC5hdHRyKFwieVwiKSB8fCAwKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWwub3JpZ2luYWwpIHtcbiAgICAgICAgICAgICAgICBlbCA9IGVsLm9yaWdpbmFsO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgaHJlZiA9IGVsLmF0dHIoXCJ4bGluazpocmVmXCIpO1xuICAgICAgICAgICAgICAgIGVsID0gZWwub3JpZ2luYWwgPSBlbC5ub2RlLm93bmVyRG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaHJlZi5zdWJzdHJpbmcoaHJlZi5pbmRleE9mKFwiI1wiKSArIDEpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgXyA9IGVsLl8sXG4gICAgICAgICAgICBwYXRoZmluZGVyID0gU25hcC5wYXRoLmdldFtlbC50eXBlXSB8fCBTbmFwLnBhdGguZ2V0LmRlZmx0O1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKGlzV2l0aG91dFRyYW5zZm9ybSkge1xuICAgICAgICAgICAgICAgIF8uYmJveHd0ID0gcGF0aGZpbmRlciA/IFNuYXAucGF0aC5nZXRCQm94KGVsLnJlYWxQYXRoID0gcGF0aGZpbmRlcihlbCkpIDogU25hcC5fLmJveChlbC5ub2RlLmdldEJCb3goKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFNuYXAuXy5ib3goXy5iYm94d3QpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBlbC5yZWFsUGF0aCA9IHBhdGhmaW5kZXIoZWwpO1xuICAgICAgICAgICAgICAgIGVsLm1hdHJpeCA9IGVsLnRyYW5zZm9ybSgpLmxvY2FsTWF0cml4O1xuICAgICAgICAgICAgICAgIF8uYmJveCA9IFNuYXAucGF0aC5nZXRCQm94KFNuYXAucGF0aC5tYXAoZWwucmVhbFBhdGgsIG0uYWRkKGVsLm1hdHJpeCkpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gU25hcC5fLmJveChfLmJib3gpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAvLyBGaXJlZm94IGRvZXNu4oCZdCBnaXZlIHlvdSBiYm94IG9mIGhpZGRlbiBlbGVtZW50XG4gICAgICAgICAgICByZXR1cm4gU25hcC5fLmJveCgpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICB2YXIgcHJvcFN0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RyaW5nO1xuICAgIH07XG4gICAgZnVuY3Rpb24gZXh0cmFjdFRyYW5zZm9ybShlbCwgdHN0cikge1xuICAgICAgICBpZiAodHN0ciA9PSBudWxsKSB7XG4gICAgICAgICAgICB2YXIgZG9SZXR1cm4gPSB0cnVlO1xuICAgICAgICAgICAgaWYgKGVsLnR5cGUgPT0gXCJsaW5lYXJHcmFkaWVudFwiIHx8IGVsLnR5cGUgPT0gXCJyYWRpYWxHcmFkaWVudFwiKSB7XG4gICAgICAgICAgICAgICAgdHN0ciA9IGVsLm5vZGUuZ2V0QXR0cmlidXRlKFwiZ3JhZGllbnRUcmFuc2Zvcm1cIik7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGVsLnR5cGUgPT0gXCJwYXR0ZXJuXCIpIHtcbiAgICAgICAgICAgICAgICB0c3RyID0gZWwubm9kZS5nZXRBdHRyaWJ1dGUoXCJwYXR0ZXJuVHJhbnNmb3JtXCIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0c3RyID0gZWwubm9kZS5nZXRBdHRyaWJ1dGUoXCJ0cmFuc2Zvcm1cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXRzdHIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFNuYXAuTWF0cml4O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdHN0ciA9IFNuYXAuXy5zdmdUcmFuc2Zvcm0yc3RyaW5nKHRzdHIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKCFTbmFwLl8ucmdUcmFuc2Zvcm0udGVzdCh0c3RyKSkge1xuICAgICAgICAgICAgICAgIHRzdHIgPSBTbmFwLl8uc3ZnVHJhbnNmb3JtMnN0cmluZyh0c3RyKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdHN0ciA9IFN0cih0c3RyKS5yZXBsYWNlKC9cXC57M318XFx1MjAyNi9nLCBlbC5fLnRyYW5zZm9ybSB8fCBcIlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpcyh0c3RyLCBcImFycmF5XCIpKSB7XG4gICAgICAgICAgICAgICAgdHN0ciA9IFNuYXAucGF0aCA/IFNuYXAucGF0aC50b1N0cmluZy5jYWxsKHRzdHIpIDogU3RyKHRzdHIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWwuXy50cmFuc2Zvcm0gPSB0c3RyO1xuICAgICAgICB9XG4gICAgICAgIHZhciBtID0gU25hcC5fLnRyYW5zZm9ybTJtYXRyaXgodHN0ciwgZWwuZ2V0QkJveCgxKSk7XG4gICAgICAgIGlmIChkb1JldHVybikge1xuICAgICAgICAgICAgcmV0dXJuIG07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlbC5tYXRyaXggPSBtO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnRyYW5zZm9ybVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogR2V0cyBvciBzZXRzIHRyYW5zZm9ybWF0aW9uIG9mIHRoZSBlbGVtZW50XG4gICAgICoqXG4gICAgIC0gdHN0ciAoc3RyaW5nKSB0cmFuc2Zvcm0gc3RyaW5nIGluIFNuYXAgb3IgU1ZHIGZvcm1hdFxuICAgICA9IChFbGVtZW50KSB0aGUgY3VycmVudCBlbGVtZW50XG4gICAgICogb3JcbiAgICAgPSAob2JqZWN0KSB0cmFuc2Zvcm1hdGlvbiBkZXNjcmlwdG9yOlxuICAgICBvIHtcbiAgICAgbyAgICAgc3RyaW5nIChzdHJpbmcpIHRyYW5zZm9ybSBzdHJpbmcsXG4gICAgIG8gICAgIGdsb2JhbE1hdHJpeCAoTWF0cml4KSBtYXRyaXggb2YgYWxsIHRyYW5zZm9ybWF0aW9ucyBhcHBsaWVkIHRvIGVsZW1lbnQgb3IgaXRzIHBhcmVudHMsXG4gICAgIG8gICAgIGxvY2FsTWF0cml4IChNYXRyaXgpIG1hdHJpeCBvZiB0cmFuc2Zvcm1hdGlvbnMgYXBwbGllZCBvbmx5IHRvIHRoZSBlbGVtZW50LFxuICAgICBvICAgICBkaWZmTWF0cml4IChNYXRyaXgpIG1hdHJpeCBvZiBkaWZmZXJlbmNlIGJldHdlZW4gZ2xvYmFsIGFuZCBsb2NhbCB0cmFuc2Zvcm1hdGlvbnMsXG4gICAgIG8gICAgIGdsb2JhbCAoc3RyaW5nKSBnbG9iYWwgdHJhbnNmb3JtYXRpb24gYXMgc3RyaW5nLFxuICAgICBvICAgICBsb2NhbCAoc3RyaW5nKSBsb2NhbCB0cmFuc2Zvcm1hdGlvbiBhcyBzdHJpbmcsXG4gICAgIG8gICAgIHRvU3RyaW5nIChmdW5jdGlvbikgcmV0dXJucyBgc3RyaW5nYCBwcm9wZXJ0eVxuICAgICBvIH1cbiAgICBcXCovXG4gICAgZWxwcm90by50cmFuc2Zvcm0gPSBmdW5jdGlvbiAodHN0cikge1xuICAgICAgICB2YXIgXyA9IHRoaXMuXztcbiAgICAgICAgaWYgKHRzdHIgPT0gbnVsbCkge1xuICAgICAgICAgICAgdmFyIHBhcGEgPSB0aGlzLFxuICAgICAgICAgICAgICAgIGdsb2JhbCA9IG5ldyBTbmFwLk1hdHJpeCh0aGlzLm5vZGUuZ2V0Q1RNKCkpLFxuICAgICAgICAgICAgICAgIGxvY2FsID0gZXh0cmFjdFRyYW5zZm9ybSh0aGlzKSxcbiAgICAgICAgICAgICAgICBtcyA9IFtsb2NhbF0sXG4gICAgICAgICAgICAgICAgbSA9IG5ldyBTbmFwLk1hdHJpeCxcbiAgICAgICAgICAgICAgICBpLFxuICAgICAgICAgICAgICAgIGxvY2FsU3RyaW5nID0gbG9jYWwudG9UcmFuc2Zvcm1TdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBzdHJpbmcgPSBTdHIobG9jYWwpID09IFN0cih0aGlzLm1hdHJpeCkgP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFN0cihfLnRyYW5zZm9ybSkgOiBsb2NhbFN0cmluZztcbiAgICAgICAgICAgIHdoaWxlIChwYXBhLnR5cGUgIT0gXCJzdmdcIiAmJiAocGFwYSA9IHBhcGEucGFyZW50KCkpKSB7XG4gICAgICAgICAgICAgICAgbXMucHVzaChleHRyYWN0VHJhbnNmb3JtKHBhcGEpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGkgPSBtcy5sZW5ndGg7XG4gICAgICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICAgICAgbS5hZGQobXNbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdHJpbmc6IHN0cmluZyxcbiAgICAgICAgICAgICAgICBnbG9iYWxNYXRyaXg6IGdsb2JhbCxcbiAgICAgICAgICAgICAgICB0b3RhbE1hdHJpeDogbSxcbiAgICAgICAgICAgICAgICBsb2NhbE1hdHJpeDogbG9jYWwsXG4gICAgICAgICAgICAgICAgZGlmZk1hdHJpeDogZ2xvYmFsLmNsb25lKCkuYWRkKGxvY2FsLmludmVydCgpKSxcbiAgICAgICAgICAgICAgICBnbG9iYWw6IGdsb2JhbC50b1RyYW5zZm9ybVN0cmluZygpLFxuICAgICAgICAgICAgICAgIHRvdGFsOiBtLnRvVHJhbnNmb3JtU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgbG9jYWw6IGxvY2FsU3RyaW5nLFxuICAgICAgICAgICAgICAgIHRvU3RyaW5nOiBwcm9wU3RyaW5nXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGlmICh0c3RyIGluc3RhbmNlb2YgU25hcC5NYXRyaXgpIHtcbiAgICAgICAgICAgIHRoaXMubWF0cml4ID0gdHN0cjtcbiAgICAgICAgICAgIHRoaXMuXy50cmFuc2Zvcm0gPSB0c3RyLnRvVHJhbnNmb3JtU3RyaW5nKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBleHRyYWN0VHJhbnNmb3JtKHRoaXMsIHRzdHIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMubm9kZSkge1xuICAgICAgICAgICAgaWYgKHRoaXMudHlwZSA9PSBcImxpbmVhckdyYWRpZW50XCIgfHwgdGhpcy50eXBlID09IFwicmFkaWFsR3JhZGllbnRcIikge1xuICAgICAgICAgICAgICAgICQodGhpcy5ub2RlLCB7Z3JhZGllbnRUcmFuc2Zvcm06IHRoaXMubWF0cml4fSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMudHlwZSA9PSBcInBhdHRlcm5cIikge1xuICAgICAgICAgICAgICAgICQodGhpcy5ub2RlLCB7cGF0dGVyblRyYW5zZm9ybTogdGhpcy5tYXRyaXh9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJCh0aGlzLm5vZGUsIHt0cmFuc2Zvcm06IHRoaXMubWF0cml4fSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnBhcmVudFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJucyB0aGUgZWxlbWVudCdzIHBhcmVudFxuICAgICAqKlxuICAgICA9IChFbGVtZW50KSB0aGUgcGFyZW50IGVsZW1lbnRcbiAgICBcXCovXG4gICAgZWxwcm90by5wYXJlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHRoaXMubm9kZS5wYXJlbnROb2RlKTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LmFwcGVuZFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQXBwZW5kcyB0aGUgZ2l2ZW4gZWxlbWVudCB0byBjdXJyZW50IG9uZVxuICAgICAqKlxuICAgICAtIGVsIChFbGVtZW50fFNldCkgZWxlbWVudCB0byBhcHBlbmRcbiAgICAgPSAoRWxlbWVudCkgdGhlIHBhcmVudCBlbGVtZW50XG4gICAgXFwqL1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LmFkZFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogU2VlIEBFbGVtZW50LmFwcGVuZFxuICAgIFxcKi9cbiAgICBlbHByb3RvLmFwcGVuZCA9IGVscHJvdG8uYWRkID0gZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgIGlmIChlbCkge1xuICAgICAgICAgICAgaWYgKGVsLnR5cGUgPT0gXCJzZXRcIikge1xuICAgICAgICAgICAgICAgIHZhciBpdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgZWwuZm9yRWFjaChmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgaXQuYWRkKGVsKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsID0gd3JhcChlbCk7XG4gICAgICAgICAgICB0aGlzLm5vZGUuYXBwZW5kQ2hpbGQoZWwubm9kZSk7XG4gICAgICAgICAgICBlbC5wYXBlciA9IHRoaXMucGFwZXI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5hcHBlbmRUb1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQXBwZW5kcyB0aGUgY3VycmVudCBlbGVtZW50IHRvIHRoZSBnaXZlbiBvbmVcbiAgICAgKipcbiAgICAgLSBlbCAoRWxlbWVudCkgcGFyZW50IGVsZW1lbnQgdG8gYXBwZW5kIHRvXG4gICAgID0gKEVsZW1lbnQpIHRoZSBjaGlsZCBlbGVtZW50XG4gICAgXFwqL1xuICAgIGVscHJvdG8uYXBwZW5kVG8gPSBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgaWYgKGVsKSB7XG4gICAgICAgICAgICBlbCA9IHdyYXAoZWwpO1xuICAgICAgICAgICAgZWwuYXBwZW5kKHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQucHJlcGVuZFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUHJlcGVuZHMgdGhlIGdpdmVuIGVsZW1lbnQgdG8gdGhlIGN1cnJlbnQgb25lXG4gICAgICoqXG4gICAgIC0gZWwgKEVsZW1lbnQpIGVsZW1lbnQgdG8gcHJlcGVuZFxuICAgICA9IChFbGVtZW50KSB0aGUgcGFyZW50IGVsZW1lbnRcbiAgICBcXCovXG4gICAgZWxwcm90by5wcmVwZW5kID0gZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgIGlmIChlbCkge1xuICAgICAgICAgICAgaWYgKGVsLnR5cGUgPT0gXCJzZXRcIikge1xuICAgICAgICAgICAgICAgIHZhciBpdCA9IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIGZpcnN0O1xuICAgICAgICAgICAgICAgIGVsLmZvckVhY2goZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChmaXJzdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlyc3QuYWZ0ZXIoZWwpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXQucHJlcGVuZChlbCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZmlyc3QgPSBlbDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsID0gd3JhcChlbCk7XG4gICAgICAgICAgICB2YXIgcGFyZW50ID0gZWwucGFyZW50KCk7XG4gICAgICAgICAgICB0aGlzLm5vZGUuaW5zZXJ0QmVmb3JlKGVsLm5vZGUsIHRoaXMubm9kZS5maXJzdENoaWxkKTtcbiAgICAgICAgICAgIHRoaXMuYWRkICYmIHRoaXMuYWRkKCk7XG4gICAgICAgICAgICBlbC5wYXBlciA9IHRoaXMucGFwZXI7XG4gICAgICAgICAgICB0aGlzLnBhcmVudCgpICYmIHRoaXMucGFyZW50KCkuYWRkKCk7XG4gICAgICAgICAgICBwYXJlbnQgJiYgcGFyZW50LmFkZCgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQucHJlcGVuZFRvXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBQcmVwZW5kcyB0aGUgY3VycmVudCBlbGVtZW50IHRvIHRoZSBnaXZlbiBvbmVcbiAgICAgKipcbiAgICAgLSBlbCAoRWxlbWVudCkgcGFyZW50IGVsZW1lbnQgdG8gcHJlcGVuZCB0b1xuICAgICA9IChFbGVtZW50KSB0aGUgY2hpbGQgZWxlbWVudFxuICAgIFxcKi9cbiAgICBlbHByb3RvLnByZXBlbmRUbyA9IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICBlbCA9IHdyYXAoZWwpO1xuICAgICAgICBlbC5wcmVwZW5kKHRoaXMpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LmJlZm9yZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogSW5zZXJ0cyBnaXZlbiBlbGVtZW50IGJlZm9yZSB0aGUgY3VycmVudCBvbmVcbiAgICAgKipcbiAgICAgLSBlbCAoRWxlbWVudCkgZWxlbWVudCB0byBpbnNlcnRcbiAgICAgPSAoRWxlbWVudCkgdGhlIHBhcmVudCBlbGVtZW50XG4gICAgXFwqL1xuICAgIGVscHJvdG8uYmVmb3JlID0gZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgIGlmIChlbC50eXBlID09IFwic2V0XCIpIHtcbiAgICAgICAgICAgIHZhciBpdCA9IHRoaXM7XG4gICAgICAgICAgICBlbC5mb3JFYWNoKGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXJlbnQgPSBlbC5wYXJlbnQoKTtcbiAgICAgICAgICAgICAgICBpdC5ub2RlLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGVsLm5vZGUsIGl0Lm5vZGUpO1xuICAgICAgICAgICAgICAgIHBhcmVudCAmJiBwYXJlbnQuYWRkKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMucGFyZW50KCkuYWRkKCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBlbCA9IHdyYXAoZWwpO1xuICAgICAgICB2YXIgcGFyZW50ID0gZWwucGFyZW50KCk7XG4gICAgICAgIHRoaXMubm9kZS5wYXJlbnROb2RlLmluc2VydEJlZm9yZShlbC5ub2RlLCB0aGlzLm5vZGUpO1xuICAgICAgICB0aGlzLnBhcmVudCgpICYmIHRoaXMucGFyZW50KCkuYWRkKCk7XG4gICAgICAgIHBhcmVudCAmJiBwYXJlbnQuYWRkKCk7XG4gICAgICAgIGVsLnBhcGVyID0gdGhpcy5wYXBlcjtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5hZnRlclxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogSW5zZXJ0cyBnaXZlbiBlbGVtZW50IGFmdGVyIHRoZSBjdXJyZW50IG9uZVxuICAgICAqKlxuICAgICAtIGVsIChFbGVtZW50KSBlbGVtZW50IHRvIGluc2VydFxuICAgICA9IChFbGVtZW50KSB0aGUgcGFyZW50IGVsZW1lbnRcbiAgICBcXCovXG4gICAgZWxwcm90by5hZnRlciA9IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICBlbCA9IHdyYXAoZWwpO1xuICAgICAgICB2YXIgcGFyZW50ID0gZWwucGFyZW50KCk7XG4gICAgICAgIGlmICh0aGlzLm5vZGUubmV4dFNpYmxpbmcpIHtcbiAgICAgICAgICAgIHRoaXMubm9kZS5wYXJlbnROb2RlLmluc2VydEJlZm9yZShlbC5ub2RlLCB0aGlzLm5vZGUubmV4dFNpYmxpbmcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5ub2RlLnBhcmVudE5vZGUuYXBwZW5kQ2hpbGQoZWwubm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5wYXJlbnQoKSAmJiB0aGlzLnBhcmVudCgpLmFkZCgpO1xuICAgICAgICBwYXJlbnQgJiYgcGFyZW50LmFkZCgpO1xuICAgICAgICBlbC5wYXBlciA9IHRoaXMucGFwZXI7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuaW5zZXJ0QmVmb3JlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBJbnNlcnRzIHRoZSBlbGVtZW50IGFmdGVyIHRoZSBnaXZlbiBvbmVcbiAgICAgKipcbiAgICAgLSBlbCAoRWxlbWVudCkgZWxlbWVudCBuZXh0IHRvIHdob20gaW5zZXJ0IHRvXG4gICAgID0gKEVsZW1lbnQpIHRoZSBwYXJlbnQgZWxlbWVudFxuICAgIFxcKi9cbiAgICBlbHByb3RvLmluc2VydEJlZm9yZSA9IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICBlbCA9IHdyYXAoZWwpO1xuICAgICAgICB2YXIgcGFyZW50ID0gdGhpcy5wYXJlbnQoKTtcbiAgICAgICAgZWwubm9kZS5wYXJlbnROb2RlLmluc2VydEJlZm9yZSh0aGlzLm5vZGUsIGVsLm5vZGUpO1xuICAgICAgICB0aGlzLnBhcGVyID0gZWwucGFwZXI7XG4gICAgICAgIHBhcmVudCAmJiBwYXJlbnQuYWRkKCk7XG4gICAgICAgIGVsLnBhcmVudCgpICYmIGVsLnBhcmVudCgpLmFkZCgpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50Lmluc2VydEFmdGVyXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBJbnNlcnRzIHRoZSBlbGVtZW50IGFmdGVyIHRoZSBnaXZlbiBvbmVcbiAgICAgKipcbiAgICAgLSBlbCAoRWxlbWVudCkgZWxlbWVudCBuZXh0IHRvIHdob20gaW5zZXJ0IHRvXG4gICAgID0gKEVsZW1lbnQpIHRoZSBwYXJlbnQgZWxlbWVudFxuICAgIFxcKi9cbiAgICBlbHByb3RvLmluc2VydEFmdGVyID0gZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgIGVsID0gd3JhcChlbCk7XG4gICAgICAgIHZhciBwYXJlbnQgPSB0aGlzLnBhcmVudCgpO1xuICAgICAgICBlbC5ub2RlLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKHRoaXMubm9kZSwgZWwubm9kZS5uZXh0U2libGluZyk7XG4gICAgICAgIHRoaXMucGFwZXIgPSBlbC5wYXBlcjtcbiAgICAgICAgcGFyZW50ICYmIHBhcmVudC5hZGQoKTtcbiAgICAgICAgZWwucGFyZW50KCkgJiYgZWwucGFyZW50KCkuYWRkKCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQucmVtb3ZlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIGVsZW1lbnQgZnJvbSB0aGUgRE9NXG4gICAgID0gKEVsZW1lbnQpIHRoZSBkZXRhY2hlZCBlbGVtZW50XG4gICAgXFwqL1xuICAgIGVscHJvdG8ucmVtb3ZlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcGFyZW50ID0gdGhpcy5wYXJlbnQoKTtcbiAgICAgICAgdGhpcy5ub2RlLnBhcmVudE5vZGUgJiYgdGhpcy5ub2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5ub2RlKTtcbiAgICAgICAgZGVsZXRlIHRoaXMucGFwZXI7XG4gICAgICAgIHRoaXMucmVtb3ZlZCA9IHRydWU7XG4gICAgICAgIHBhcmVudCAmJiBwYXJlbnQuYWRkKCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuc2VsZWN0XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBHYXRoZXJzIHRoZSBuZXN0ZWQgQEVsZW1lbnQgbWF0Y2hpbmcgdGhlIGdpdmVuIHNldCBvZiBDU1Mgc2VsZWN0b3JzXG4gICAgICoqXG4gICAgIC0gcXVlcnkgKHN0cmluZykgQ1NTIHNlbGVjdG9yXG4gICAgID0gKEVsZW1lbnQpIHJlc3VsdCBvZiBxdWVyeSBzZWxlY3Rpb25cbiAgICBcXCovXG4gICAgZWxwcm90by5zZWxlY3QgPSBmdW5jdGlvbiAocXVlcnkpIHtcbiAgICAgICAgcmV0dXJuIHdyYXAodGhpcy5ub2RlLnF1ZXJ5U2VsZWN0b3IocXVlcnkpKTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnNlbGVjdEFsbFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogR2F0aGVycyBuZXN0ZWQgQEVsZW1lbnQgb2JqZWN0cyBtYXRjaGluZyB0aGUgZ2l2ZW4gc2V0IG9mIENTUyBzZWxlY3RvcnNcbiAgICAgKipcbiAgICAgLSBxdWVyeSAoc3RyaW5nKSBDU1Mgc2VsZWN0b3JcbiAgICAgPSAoU2V0fGFycmF5KSByZXN1bHQgb2YgcXVlcnkgc2VsZWN0aW9uXG4gICAgXFwqL1xuICAgIGVscHJvdG8uc2VsZWN0QWxsID0gZnVuY3Rpb24gKHF1ZXJ5KSB7XG4gICAgICAgIHZhciBub2RlbGlzdCA9IHRoaXMubm9kZS5xdWVyeVNlbGVjdG9yQWxsKHF1ZXJ5KSxcbiAgICAgICAgICAgIHNldCA9IChTbmFwLnNldCB8fCBBcnJheSkoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2RlbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgc2V0LnB1c2god3JhcChub2RlbGlzdFtpXSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzZXQ7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5hc1BYXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIGdpdmVuIGF0dHJpYnV0ZSBvZiB0aGUgZWxlbWVudCBhcyBhIGBweGAgdmFsdWUgKG5vdCAlLCBlbSwgZXRjLilcbiAgICAgKipcbiAgICAgLSBhdHRyIChzdHJpbmcpIGF0dHJpYnV0ZSBuYW1lXG4gICAgIC0gdmFsdWUgKHN0cmluZykgI29wdGlvbmFsIGF0dHJpYnV0ZSB2YWx1ZVxuICAgICA9IChFbGVtZW50KSByZXN1bHQgb2YgcXVlcnkgc2VsZWN0aW9uXG4gICAgXFwqL1xuICAgIGVscHJvdG8uYXNQWCA9IGZ1bmN0aW9uIChhdHRyLCB2YWx1ZSkge1xuICAgICAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgICAgICAgdmFsdWUgPSB0aGlzLmF0dHIoYXR0cik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICt1bml0MnB4KHRoaXMsIGF0dHIsIHZhbHVlKTtcbiAgICB9O1xuICAgIC8vIFNJRVJSQSBFbGVtZW50LnVzZSgpOiBJIHN1Z2dlc3QgYWRkaW5nIGEgbm90ZSBhYm91dCBob3cgdG8gYWNjZXNzIHRoZSBvcmlnaW5hbCBlbGVtZW50IHRoZSByZXR1cm5lZCA8dXNlPiBpbnN0YW50aWF0ZXMuIEl0J3MgYSBwYXJ0IG9mIFNWRyB3aXRoIHdoaWNoIG9yZGluYXJ5IHdlYiBkZXZlbG9wZXJzIG1heSBiZSBsZWFzdCBmYW1pbGlhci5cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC51c2VcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIENyZWF0ZXMgYSBgPHVzZT5gIGVsZW1lbnQgbGlua2VkIHRvIHRoZSBjdXJyZW50IGVsZW1lbnRcbiAgICAgKipcbiAgICAgPSAoRWxlbWVudCkgdGhlIGA8dXNlPmAgZWxlbWVudFxuICAgIFxcKi9cbiAgICBlbHByb3RvLnVzZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHVzZSxcbiAgICAgICAgICAgIGlkID0gdGhpcy5ub2RlLmlkO1xuICAgICAgICBpZiAoIWlkKSB7XG4gICAgICAgICAgICBpZCA9IHRoaXMuaWQ7XG4gICAgICAgICAgICAkKHRoaXMubm9kZSwge1xuICAgICAgICAgICAgICAgIGlkOiBpZFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMudHlwZSA9PSBcImxpbmVhckdyYWRpZW50XCIgfHwgdGhpcy50eXBlID09IFwicmFkaWFsR3JhZGllbnRcIiB8fFxuICAgICAgICAgICAgdGhpcy50eXBlID09IFwicGF0dGVyblwiKSB7XG4gICAgICAgICAgICB1c2UgPSBtYWtlKHRoaXMudHlwZSwgdGhpcy5ub2RlLnBhcmVudE5vZGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdXNlID0gbWFrZShcInVzZVwiLCB0aGlzLm5vZGUucGFyZW50Tm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgJCh1c2Uubm9kZSwge1xuICAgICAgICAgICAgXCJ4bGluazpocmVmXCI6IFwiI1wiICsgaWRcbiAgICAgICAgfSk7XG4gICAgICAgIHVzZS5vcmlnaW5hbCA9IHRoaXM7XG4gICAgICAgIHJldHVybiB1c2U7XG4gICAgfTtcbiAgICBmdW5jdGlvbiBmaXhpZHMoZWwpIHtcbiAgICAgICAgdmFyIGVscyA9IGVsLnNlbGVjdEFsbChcIipcIiksXG4gICAgICAgICAgICBpdCxcbiAgICAgICAgICAgIHVybCA9IC9eXFxzKnVybFxcKChcInwnfCkoLiopXFwxXFwpXFxzKiQvLFxuICAgICAgICAgICAgaWRzID0gW10sXG4gICAgICAgICAgICB1c2VzID0ge307XG4gICAgICAgIGZ1bmN0aW9uIHVybHRlc3QoaXQsIG5hbWUpIHtcbiAgICAgICAgICAgIHZhciB2YWwgPSAkKGl0Lm5vZGUsIG5hbWUpO1xuICAgICAgICAgICAgdmFsID0gdmFsICYmIHZhbC5tYXRjaCh1cmwpO1xuICAgICAgICAgICAgdmFsID0gdmFsICYmIHZhbFsyXTtcbiAgICAgICAgICAgIGlmICh2YWwgJiYgdmFsLmNoYXJBdCgpID09IFwiI1wiKSB7XG4gICAgICAgICAgICAgICAgdmFsID0gdmFsLnN1YnN0cmluZygxKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHZhbCkge1xuICAgICAgICAgICAgICAgIHVzZXNbdmFsXSA9ICh1c2VzW3ZhbF0gfHwgW10pLmNvbmNhdChmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGF0dHIgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgYXR0cltuYW1lXSA9IFVSTChpZCk7XG4gICAgICAgICAgICAgICAgICAgICQoaXQubm9kZSwgYXR0cik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gbGlua3Rlc3QoaXQpIHtcbiAgICAgICAgICAgIHZhciB2YWwgPSAkKGl0Lm5vZGUsIFwieGxpbms6aHJlZlwiKTtcbiAgICAgICAgICAgIGlmICh2YWwgJiYgdmFsLmNoYXJBdCgpID09IFwiI1wiKSB7XG4gICAgICAgICAgICAgICAgdmFsID0gdmFsLnN1YnN0cmluZygxKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHZhbCkge1xuICAgICAgICAgICAgICAgIHVzZXNbdmFsXSA9ICh1c2VzW3ZhbF0gfHwgW10pLmNvbmNhdChmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgaXQuYXR0cihcInhsaW5rOmhyZWZcIiwgXCIjXCIgKyBpZCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gZWxzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIGl0ID0gZWxzW2ldO1xuICAgICAgICAgICAgdXJsdGVzdChpdCwgXCJmaWxsXCIpO1xuICAgICAgICAgICAgdXJsdGVzdChpdCwgXCJzdHJva2VcIik7XG4gICAgICAgICAgICB1cmx0ZXN0KGl0LCBcImZpbHRlclwiKTtcbiAgICAgICAgICAgIHVybHRlc3QoaXQsIFwibWFza1wiKTtcbiAgICAgICAgICAgIHVybHRlc3QoaXQsIFwiY2xpcC1wYXRoXCIpO1xuICAgICAgICAgICAgbGlua3Rlc3QoaXQpO1xuICAgICAgICAgICAgdmFyIG9sZGlkID0gJChpdC5ub2RlLCBcImlkXCIpO1xuICAgICAgICAgICAgaWYgKG9sZGlkKSB7XG4gICAgICAgICAgICAgICAgJChpdC5ub2RlLCB7aWQ6IGl0LmlkfSk7XG4gICAgICAgICAgICAgICAgaWRzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBvbGQ6IG9sZGlkLFxuICAgICAgICAgICAgICAgICAgICBpZDogaXQuaWRcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSAwLCBpaSA9IGlkcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgZnMgPSB1c2VzW2lkc1tpXS5vbGRdO1xuICAgICAgICAgICAgaWYgKGZzKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDAsIGpqID0gZnMubGVuZ3RoOyBqIDwgamo7IGorKykge1xuICAgICAgICAgICAgICAgICAgICBmc1tqXShpZHNbaV0uaWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5jbG9uZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQ3JlYXRlcyBhIGNsb25lIG9mIHRoZSBlbGVtZW50IGFuZCBpbnNlcnRzIGl0IGFmdGVyIHRoZSBlbGVtZW50XG4gICAgICoqXG4gICAgID0gKEVsZW1lbnQpIHRoZSBjbG9uZVxuICAgIFxcKi9cbiAgICBlbHByb3RvLmNsb25lID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY2xvbmUgPSB3cmFwKHRoaXMubm9kZS5jbG9uZU5vZGUodHJ1ZSkpO1xuICAgICAgICBpZiAoJChjbG9uZS5ub2RlLCBcImlkXCIpKSB7XG4gICAgICAgICAgICAkKGNsb25lLm5vZGUsIHtpZDogY2xvbmUuaWR9KTtcbiAgICAgICAgfVxuICAgICAgICBmaXhpZHMoY2xvbmUpO1xuICAgICAgICBjbG9uZS5pbnNlcnRBZnRlcih0aGlzKTtcbiAgICAgICAgcmV0dXJuIGNsb25lO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudG9EZWZzXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBNb3ZlcyBlbGVtZW50IHRvIHRoZSBzaGFyZWQgYDxkZWZzPmAgYXJlYVxuICAgICAqKlxuICAgICA9IChFbGVtZW50KSB0aGUgZWxlbWVudFxuICAgIFxcKi9cbiAgICBlbHByb3RvLnRvRGVmcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGRlZnMgPSBnZXRTb21lRGVmcyh0aGlzKTtcbiAgICAgICAgZGVmcy5hcHBlbmRDaGlsZCh0aGlzLm5vZGUpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnRvUGF0dGVyblxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQ3JlYXRlcyBhIGA8cGF0dGVybj5gIGVsZW1lbnQgZnJvbSB0aGUgY3VycmVudCBlbGVtZW50XG4gICAgICoqXG4gICAgICogVG8gY3JlYXRlIGEgcGF0dGVybiB5b3UgaGF2ZSB0byBzcGVjaWZ5IHRoZSBwYXR0ZXJuIHJlY3Q6XG4gICAgIC0geCAoc3RyaW5nfG51bWJlcilcbiAgICAgLSB5IChzdHJpbmd8bnVtYmVyKVxuICAgICAtIHdpZHRoIChzdHJpbmd8bnVtYmVyKVxuICAgICAtIGhlaWdodCAoc3RyaW5nfG51bWJlcilcbiAgICAgPSAoRWxlbWVudCkgdGhlIGA8cGF0dGVybj5gIGVsZW1lbnRcbiAgICAgKiBZb3UgY2FuIHVzZSBwYXR0ZXJuIGxhdGVyIG9uIGFzIGFuIGFyZ3VtZW50IGZvciBgZmlsbGAgYXR0cmlidXRlOlxuICAgICB8IHZhciBwID0gcGFwZXIucGF0aChcIk0xMC01LTEwLDE1TTE1LDAsMCwxNU0wLTUtMjAsMTVcIikuYXR0cih7XG4gICAgIHwgICAgICAgICBmaWxsOiBcIm5vbmVcIixcbiAgICAgfCAgICAgICAgIHN0cm9rZTogXCIjYmFkYTU1XCIsXG4gICAgIHwgICAgICAgICBzdHJva2VXaWR0aDogNVxuICAgICB8ICAgICB9KS5wYXR0ZXJuKDAsIDAsIDEwLCAxMCksXG4gICAgIHwgICAgIGMgPSBwYXBlci5jaXJjbGUoMjAwLCAyMDAsIDEwMCk7XG4gICAgIHwgYy5hdHRyKHtcbiAgICAgfCAgICAgZmlsbDogcFxuICAgICB8IH0pO1xuICAgIFxcKi9cbiAgICBlbHByb3RvLnBhdHRlcm4gPSBlbHByb3RvLnRvUGF0dGVybiA9IGZ1bmN0aW9uICh4LCB5LCB3aWR0aCwgaGVpZ2h0KSB7XG4gICAgICAgIHZhciBwID0gbWFrZShcInBhdHRlcm5cIiwgZ2V0U29tZURlZnModGhpcykpO1xuICAgICAgICBpZiAoeCA9PSBudWxsKSB7XG4gICAgICAgICAgICB4ID0gdGhpcy5nZXRCQm94KCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzKHgsIFwib2JqZWN0XCIpICYmIFwieFwiIGluIHgpIHtcbiAgICAgICAgICAgIHkgPSB4Lnk7XG4gICAgICAgICAgICB3aWR0aCA9IHgud2lkdGg7XG4gICAgICAgICAgICBoZWlnaHQgPSB4LmhlaWdodDtcbiAgICAgICAgICAgIHggPSB4Lng7XG4gICAgICAgIH1cbiAgICAgICAgJChwLm5vZGUsIHtcbiAgICAgICAgICAgIHg6IHgsXG4gICAgICAgICAgICB5OiB5LFxuICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgICAgICBwYXR0ZXJuVW5pdHM6IFwidXNlclNwYWNlT25Vc2VcIixcbiAgICAgICAgICAgIGlkOiBwLmlkLFxuICAgICAgICAgICAgdmlld0JveDogW3gsIHksIHdpZHRoLCBoZWlnaHRdLmpvaW4oXCIgXCIpXG4gICAgICAgIH0pO1xuICAgICAgICBwLm5vZGUuYXBwZW5kQ2hpbGQodGhpcy5ub2RlKTtcbiAgICAgICAgcmV0dXJuIHA7XG4gICAgfTtcbi8vIFNJRVJSQSBFbGVtZW50Lm1hcmtlcigpOiBjbGFyaWZ5IHdoYXQgYSByZWZlcmVuY2UgcG9pbnQgaXMuIEUuZy4sIGhlbHBzIHlvdSBvZmZzZXQgdGhlIG9iamVjdCBmcm9tIGl0cyBlZGdlIHN1Y2ggYXMgd2hlbiBjZW50ZXJpbmcgaXQgb3ZlciBhIHBhdGguXG4vLyBTSUVSUkEgRWxlbWVudC5tYXJrZXIoKTogSSBzdWdnZXN0IHRoZSBtZXRob2Qgc2hvdWxkIGFjY2VwdCBkZWZhdWx0IHJlZmVyZW5jZSBwb2ludCB2YWx1ZXMuICBQZXJoYXBzIGNlbnRlcmVkIHdpdGggKHJlZlggPSB3aWR0aC8yKSBhbmQgKHJlZlkgPSBoZWlnaHQvMik/IEFsc28sIGNvdWxkbid0IGl0IGFzc3VtZSB0aGUgZWxlbWVudCdzIGN1cnJlbnQgX3dpZHRoXyBhbmQgX2hlaWdodF8/IEFuZCBwbGVhc2Ugc3BlY2lmeSB3aGF0IF94XyBhbmQgX3lfIG1lYW46IG9mZnNldHM/IElmIHNvLCBmcm9tIHdoZXJlPyAgQ291bGRuJ3QgdGhleSBhbHNvIGJlIGFzc2lnbmVkIGRlZmF1bHQgdmFsdWVzP1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50Lm1hcmtlclxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQ3JlYXRlcyBhIGA8bWFya2VyPmAgZWxlbWVudCBmcm9tIHRoZSBjdXJyZW50IGVsZW1lbnRcbiAgICAgKipcbiAgICAgKiBUbyBjcmVhdGUgYSBtYXJrZXIgeW91IGhhdmUgdG8gc3BlY2lmeSB0aGUgYm91bmRpbmcgcmVjdCBhbmQgcmVmZXJlbmNlIHBvaW50OlxuICAgICAtIHggKG51bWJlcilcbiAgICAgLSB5IChudW1iZXIpXG4gICAgIC0gd2lkdGggKG51bWJlcilcbiAgICAgLSBoZWlnaHQgKG51bWJlcilcbiAgICAgLSByZWZYIChudW1iZXIpXG4gICAgIC0gcmVmWSAobnVtYmVyKVxuICAgICA9IChFbGVtZW50KSB0aGUgYDxtYXJrZXI+YCBlbGVtZW50XG4gICAgICogWW91IGNhbiBzcGVjaWZ5IHRoZSBtYXJrZXIgbGF0ZXIgYXMgYW4gYXJndW1lbnQgZm9yIGBtYXJrZXItc3RhcnRgLCBgbWFya2VyLWVuZGAsIGBtYXJrZXItbWlkYCwgYW5kIGBtYXJrZXJgIGF0dHJpYnV0ZXMuIFRoZSBgbWFya2VyYCBhdHRyaWJ1dGUgcGxhY2VzIHRoZSBtYXJrZXIgYXQgZXZlcnkgcG9pbnQgYWxvbmcgdGhlIHBhdGgsIGFuZCBgbWFya2VyLW1pZGAgcGxhY2VzIHRoZW0gYXQgZXZlcnkgcG9pbnQgZXhjZXB0IHRoZSBzdGFydCBhbmQgZW5kLlxuICAgIFxcKi9cbiAgICAvLyBUT0RPIGFkZCB1c2FnZSBmb3IgbWFya2Vyc1xuICAgIGVscHJvdG8ubWFya2VyID0gZnVuY3Rpb24gKHgsIHksIHdpZHRoLCBoZWlnaHQsIHJlZlgsIHJlZlkpIHtcbiAgICAgICAgdmFyIHAgPSBtYWtlKFwibWFya2VyXCIsIGdldFNvbWVEZWZzKHRoaXMpKTtcbiAgICAgICAgaWYgKHggPT0gbnVsbCkge1xuICAgICAgICAgICAgeCA9IHRoaXMuZ2V0QkJveCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpcyh4LCBcIm9iamVjdFwiKSAmJiBcInhcIiBpbiB4KSB7XG4gICAgICAgICAgICB5ID0geC55O1xuICAgICAgICAgICAgd2lkdGggPSB4LndpZHRoO1xuICAgICAgICAgICAgaGVpZ2h0ID0geC5oZWlnaHQ7XG4gICAgICAgICAgICByZWZYID0geC5yZWZYIHx8IHguY3g7XG4gICAgICAgICAgICByZWZZID0geC5yZWZZIHx8IHguY3k7XG4gICAgICAgICAgICB4ID0geC54O1xuICAgICAgICB9XG4gICAgICAgICQocC5ub2RlLCB7XG4gICAgICAgICAgICB2aWV3Qm94OiBbeCwgeSwgd2lkdGgsIGhlaWdodF0uam9pbihcIiBcIiksXG4gICAgICAgICAgICBtYXJrZXJXaWR0aDogd2lkdGgsXG4gICAgICAgICAgICBtYXJrZXJIZWlnaHQ6IGhlaWdodCxcbiAgICAgICAgICAgIG9yaWVudDogXCJhdXRvXCIsXG4gICAgICAgICAgICByZWZYOiByZWZYIHx8IDAsXG4gICAgICAgICAgICByZWZZOiByZWZZIHx8IDAsXG4gICAgICAgICAgICBpZDogcC5pZFxuICAgICAgICB9KTtcbiAgICAgICAgcC5ub2RlLmFwcGVuZENoaWxkKHRoaXMubm9kZSk7XG4gICAgICAgIHJldHVybiBwO1xuICAgIH07XG4gICAgLy8gYW5pbWF0aW9uXG4gICAgZnVuY3Rpb24gc2xpY2UoZnJvbSwgdG8sIGYpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChhcnIpIHtcbiAgICAgICAgICAgIHZhciByZXMgPSBhcnIuc2xpY2UoZnJvbSwgdG8pO1xuICAgICAgICAgICAgaWYgKHJlcy5sZW5ndGggPT0gMSkge1xuICAgICAgICAgICAgICAgIHJlcyA9IHJlc1swXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmID8gZihyZXMpIDogcmVzO1xuICAgICAgICB9O1xuICAgIH1cbiAgICB2YXIgQW5pbWF0aW9uID0gZnVuY3Rpb24gKGF0dHIsIG1zLCBlYXNpbmcsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZWFzaW5nID09IFwiZnVuY3Rpb25cIiAmJiAhZWFzaW5nLmxlbmd0aCkge1xuICAgICAgICAgICAgY2FsbGJhY2sgPSBlYXNpbmc7XG4gICAgICAgICAgICBlYXNpbmcgPSBtaW5hLmxpbmVhcjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmF0dHIgPSBhdHRyO1xuICAgICAgICB0aGlzLmR1ciA9IG1zO1xuICAgICAgICBlYXNpbmcgJiYgKHRoaXMuZWFzaW5nID0gZWFzaW5nKTtcbiAgICAgICAgY2FsbGJhY2sgJiYgKHRoaXMuY2FsbGJhY2sgPSBjYWxsYmFjayk7XG4gICAgfTtcbiAgICBTbmFwLl8uQW5pbWF0aW9uID0gQW5pbWF0aW9uO1xuICAgIC8qXFxcbiAgICAgKiBTbmFwLmFuaW1hdGlvblxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQ3JlYXRlcyBhbiBhbmltYXRpb24gb2JqZWN0XG4gICAgICoqXG4gICAgIC0gYXR0ciAob2JqZWN0KSBhdHRyaWJ1dGVzIG9mIGZpbmFsIGRlc3RpbmF0aW9uXG4gICAgIC0gZHVyYXRpb24gKG51bWJlcikgZHVyYXRpb24gb2YgdGhlIGFuaW1hdGlvbiwgaW4gbWlsbGlzZWNvbmRzXG4gICAgIC0gZWFzaW5nIChmdW5jdGlvbikgI29wdGlvbmFsIG9uZSBvZiBlYXNpbmcgZnVuY3Rpb25zIG9mIEBtaW5hIG9yIGN1c3RvbSBvbmVcbiAgICAgLSBjYWxsYmFjayAoZnVuY3Rpb24pICNvcHRpb25hbCBjYWxsYmFjayBmdW5jdGlvbiB0aGF0IGZpcmVzIHdoZW4gYW5pbWF0aW9uIGVuZHNcbiAgICAgPSAob2JqZWN0KSBhbmltYXRpb24gb2JqZWN0XG4gICAgXFwqL1xuICAgIFNuYXAuYW5pbWF0aW9uID0gZnVuY3Rpb24gKGF0dHIsIG1zLCBlYXNpbmcsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiBuZXcgQW5pbWF0aW9uKGF0dHIsIG1zLCBlYXNpbmcsIGNhbGxiYWNrKTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LmluQW5pbVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJucyBhIHNldCBvZiBhbmltYXRpb25zIHRoYXQgbWF5IGJlIGFibGUgdG8gbWFuaXB1bGF0ZSB0aGUgY3VycmVudCBlbGVtZW50XG4gICAgICoqXG4gICAgID0gKG9iamVjdCkgaW4gZm9ybWF0OlxuICAgICBvIHtcbiAgICAgbyAgICAgYW5pbSAob2JqZWN0KSBhbmltYXRpb24gb2JqZWN0LFxuICAgICBvICAgICBtaW5hIChvYmplY3QpIEBtaW5hIG9iamVjdCxcbiAgICAgbyAgICAgY3VyU3RhdHVzIChudW1iZXIpIDAuLjEg4oCUIHN0YXR1cyBvZiB0aGUgYW5pbWF0aW9uOiAwIOKAlCBqdXN0IHN0YXJ0ZWQsIDEg4oCUIGp1c3QgZmluaXNoZWQsXG4gICAgIG8gICAgIHN0YXR1cyAoZnVuY3Rpb24pIGdldHMgb3Igc2V0cyB0aGUgc3RhdHVzIG9mIHRoZSBhbmltYXRpb24sXG4gICAgIG8gICAgIHN0b3AgKGZ1bmN0aW9uKSBzdG9wcyB0aGUgYW5pbWF0aW9uXG4gICAgIG8gfVxuICAgIFxcKi9cbiAgICBlbHByb3RvLmluQW5pbSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGVsID0gdGhpcyxcbiAgICAgICAgICAgIHJlcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpZCBpbiBlbC5hbmltcykgaWYgKGVsLmFuaW1zW2hhc10oaWQpKSB7XG4gICAgICAgICAgICAoZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgICAgICAgICByZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGFuaW06IG5ldyBBbmltYXRpb24oYS5fYXR0cnMsIGEuZHVyLCBhLmVhc2luZywgYS5fY2FsbGJhY2spLFxuICAgICAgICAgICAgICAgICAgICBtaW5hOiBhLFxuICAgICAgICAgICAgICAgICAgICBjdXJTdGF0dXM6IGEuc3RhdHVzKCksXG4gICAgICAgICAgICAgICAgICAgIHN0YXR1czogZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGEuc3RhdHVzKHZhbCk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHN0b3A6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGEuc3RvcCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KGVsLmFuaW1zW2lkXSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogU25hcC5hbmltYXRlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSdW5zIGdlbmVyaWMgYW5pbWF0aW9uIG9mIG9uZSBudW1iZXIgaW50byBhbm90aGVyIHdpdGggYSBjYXJpbmcgZnVuY3Rpb25cbiAgICAgKipcbiAgICAgLSBmcm9tIChudW1iZXJ8YXJyYXkpIG51bWJlciBvciBhcnJheSBvZiBudW1iZXJzXG4gICAgIC0gdG8gKG51bWJlcnxhcnJheSkgbnVtYmVyIG9yIGFycmF5IG9mIG51bWJlcnNcbiAgICAgLSBzZXR0ZXIgKGZ1bmN0aW9uKSBjYXJpbmcgZnVuY3Rpb24gdGhhdCBhY2NlcHRzIG9uZSBudW1iZXIgYXJndW1lbnRcbiAgICAgLSBkdXJhdGlvbiAobnVtYmVyKSBkdXJhdGlvbiwgaW4gbWlsbGlzZWNvbmRzXG4gICAgIC0gZWFzaW5nIChmdW5jdGlvbikgI29wdGlvbmFsIGVhc2luZyBmdW5jdGlvbiBmcm9tIEBtaW5hIG9yIGN1c3RvbVxuICAgICAtIGNhbGxiYWNrIChmdW5jdGlvbikgI29wdGlvbmFsIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGV4ZWN1dGUgd2hlbiBhbmltYXRpb24gZW5kc1xuICAgICA9IChvYmplY3QpIGFuaW1hdGlvbiBvYmplY3QgaW4gQG1pbmEgZm9ybWF0XG4gICAgIG8ge1xuICAgICBvICAgICBpZCAoc3RyaW5nKSBhbmltYXRpb24gaWQsIGNvbnNpZGVyIGl0IHJlYWQtb25seSxcbiAgICAgbyAgICAgZHVyYXRpb24gKGZ1bmN0aW9uKSBnZXRzIG9yIHNldHMgdGhlIGR1cmF0aW9uIG9mIHRoZSBhbmltYXRpb24sXG4gICAgIG8gICAgIGVhc2luZyAoZnVuY3Rpb24pIGVhc2luZyxcbiAgICAgbyAgICAgc3BlZWQgKGZ1bmN0aW9uKSBnZXRzIG9yIHNldHMgdGhlIHNwZWVkIG9mIHRoZSBhbmltYXRpb24sXG4gICAgIG8gICAgIHN0YXR1cyAoZnVuY3Rpb24pIGdldHMgb3Igc2V0cyB0aGUgc3RhdHVzIG9mIHRoZSBhbmltYXRpb24sXG4gICAgIG8gICAgIHN0b3AgKGZ1bmN0aW9uKSBzdG9wcyB0aGUgYW5pbWF0aW9uXG4gICAgIG8gfVxuICAgICB8IHZhciByZWN0ID0gU25hcCgpLnJlY3QoMCwgMCwgMTAsIDEwKTtcbiAgICAgfCBTbmFwLmFuaW1hdGUoMCwgMTAsIGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgfCAgICAgcmVjdC5hdHRyKHtcbiAgICAgfCAgICAgICAgIHg6IHZhbFxuICAgICB8ICAgICB9KTtcbiAgICAgfCB9LCAxMDAwKTtcbiAgICAgfCAvLyBpbiBnaXZlbiBjb250ZXh0IGlzIGVxdWl2YWxlbnQgdG9cbiAgICAgfCByZWN0LmFuaW1hdGUoe3g6IDEwfSwgMTAwMCk7XG4gICAgXFwqL1xuICAgIFNuYXAuYW5pbWF0ZSA9IGZ1bmN0aW9uIChmcm9tLCB0bywgc2V0dGVyLCBtcywgZWFzaW5nLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGVhc2luZyA9PSBcImZ1bmN0aW9uXCIgJiYgIWVhc2luZy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrID0gZWFzaW5nO1xuICAgICAgICAgICAgZWFzaW5nID0gbWluYS5saW5lYXI7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG5vdyA9IG1pbmEudGltZSgpLFxuICAgICAgICAgICAgYW5pbSA9IG1pbmEoZnJvbSwgdG8sIG5vdywgbm93ICsgbXMsIG1pbmEudGltZSwgc2V0dGVyLCBlYXNpbmcpO1xuICAgICAgICBjYWxsYmFjayAmJiBldmUub25jZShcIm1pbmEuZmluaXNoLlwiICsgYW5pbS5pZCwgY2FsbGJhY2spO1xuICAgICAgICByZXR1cm4gYW5pbTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnN0b3BcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFN0b3BzIGFsbCB0aGUgYW5pbWF0aW9ucyBmb3IgdGhlIGN1cnJlbnQgZWxlbWVudFxuICAgICAqKlxuICAgICA9IChFbGVtZW50KSB0aGUgY3VycmVudCBlbGVtZW50XG4gICAgXFwqL1xuICAgIGVscHJvdG8uc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFuaW1zID0gdGhpcy5pbkFuaW0oKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gYW5pbXMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgYW5pbXNbaV0uc3RvcCgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuYW5pbWF0ZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQW5pbWF0ZXMgdGhlIGdpdmVuIGF0dHJpYnV0ZXMgb2YgdGhlIGVsZW1lbnRcbiAgICAgKipcbiAgICAgLSBhdHRycyAob2JqZWN0KSBrZXktdmFsdWUgcGFpcnMgb2YgZGVzdGluYXRpb24gYXR0cmlidXRlc1xuICAgICAtIGR1cmF0aW9uIChudW1iZXIpIGR1cmF0aW9uIG9mIHRoZSBhbmltYXRpb24gaW4gbWlsbGlzZWNvbmRzXG4gICAgIC0gZWFzaW5nIChmdW5jdGlvbikgI29wdGlvbmFsIGVhc2luZyBmdW5jdGlvbiBmcm9tIEBtaW5hIG9yIGN1c3RvbVxuICAgICAtIGNhbGxiYWNrIChmdW5jdGlvbikgI29wdGlvbmFsIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgZXhlY3V0ZXMgd2hlbiB0aGUgYW5pbWF0aW9uIGVuZHNcbiAgICAgPSAoRWxlbWVudCkgdGhlIGN1cnJlbnQgZWxlbWVudFxuICAgIFxcKi9cbiAgICBlbHByb3RvLmFuaW1hdGUgPSBmdW5jdGlvbiAoYXR0cnMsIG1zLCBlYXNpbmcsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZWFzaW5nID09IFwiZnVuY3Rpb25cIiAmJiAhZWFzaW5nLmxlbmd0aCkge1xuICAgICAgICAgICAgY2FsbGJhY2sgPSBlYXNpbmc7XG4gICAgICAgICAgICBlYXNpbmcgPSBtaW5hLmxpbmVhcjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYXR0cnMgaW5zdGFuY2VvZiBBbmltYXRpb24pIHtcbiAgICAgICAgICAgIGNhbGxiYWNrID0gYXR0cnMuY2FsbGJhY2s7XG4gICAgICAgICAgICBlYXNpbmcgPSBhdHRycy5lYXNpbmc7XG4gICAgICAgICAgICBtcyA9IGF0dHJzLmR1cjtcbiAgICAgICAgICAgIGF0dHJzID0gYXR0cnMuYXR0cjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZmtleXMgPSBbXSwgdGtleXMgPSBbXSwga2V5cyA9IHt9LCBmcm9tLCB0bywgZiwgZXEsXG4gICAgICAgICAgICBlbCA9IHRoaXM7XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBhdHRycykgaWYgKGF0dHJzW2hhc10oa2V5KSkge1xuICAgICAgICAgICAgaWYgKGVsLmVxdWFsKSB7XG4gICAgICAgICAgICAgICAgZXEgPSBlbC5lcXVhbChrZXksIFN0cihhdHRyc1trZXldKSk7XG4gICAgICAgICAgICAgICAgZnJvbSA9IGVxLmZyb207XG4gICAgICAgICAgICAgICAgdG8gPSBlcS50bztcbiAgICAgICAgICAgICAgICBmID0gZXEuZjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZnJvbSA9ICtlbC5hdHRyKGtleSk7XG4gICAgICAgICAgICAgICAgdG8gPSArYXR0cnNba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBsZW4gPSBpcyhmcm9tLCBcImFycmF5XCIpID8gZnJvbS5sZW5ndGggOiAxO1xuICAgICAgICAgICAga2V5c1trZXldID0gc2xpY2UoZmtleXMubGVuZ3RoLCBma2V5cy5sZW5ndGggKyBsZW4sIGYpO1xuICAgICAgICAgICAgZmtleXMgPSBma2V5cy5jb25jYXQoZnJvbSk7XG4gICAgICAgICAgICB0a2V5cyA9IHRrZXlzLmNvbmNhdCh0byk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG5vdyA9IG1pbmEudGltZSgpLFxuICAgICAgICAgICAgYW5pbSA9IG1pbmEoZmtleXMsIHRrZXlzLCBub3csIG5vdyArIG1zLCBtaW5hLnRpbWUsIGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgICAgICAgICB2YXIgYXR0ciA9IHt9O1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBrZXlzKSBpZiAoa2V5c1toYXNdKGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgYXR0cltrZXldID0ga2V5c1trZXldKHZhbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsLmF0dHIoYXR0cik7XG4gICAgICAgICAgICB9LCBlYXNpbmcpO1xuICAgICAgICBlbC5hbmltc1thbmltLmlkXSA9IGFuaW07XG4gICAgICAgIGFuaW0uX2F0dHJzID0gYXR0cnM7XG4gICAgICAgIGFuaW0uX2NhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgICAgIGV2ZShcInNuYXAuYW5pbWNyZWF0ZWQuXCIgKyBlbC5pZCwgYW5pbSk7XG4gICAgICAgIGV2ZS5vbmNlKFwibWluYS5maW5pc2guXCIgKyBhbmltLmlkLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBkZWxldGUgZWwuYW5pbXNbYW5pbS5pZF07XG4gICAgICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjay5jYWxsKGVsKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGV2ZS5vbmNlKFwibWluYS5zdG9wLlwiICsgYW5pbS5pZCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZGVsZXRlIGVsLmFuaW1zW2FuaW0uaWRdO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGVsO1xuICAgIH07XG4gICAgdmFyIGVsZGF0YSA9IHt9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LmRhdGFcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEFkZHMgb3IgcmV0cmlldmVzIGdpdmVuIHZhbHVlIGFzc29jaWF0ZWQgd2l0aCBnaXZlbiBrZXkuIChEb27igJl0IGNvbmZ1c2VcbiAgICAgKiB3aXRoIGBkYXRhLWAgYXR0cmlidXRlcylcbiAgICAgKlxuICAgICAqIFNlZSBhbHNvIEBFbGVtZW50LnJlbW92ZURhdGFcbiAgICAgLSBrZXkgKHN0cmluZykga2V5IHRvIHN0b3JlIGRhdGFcbiAgICAgLSB2YWx1ZSAoYW55KSAjb3B0aW9uYWwgdmFsdWUgdG8gc3RvcmVcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgICAqIG9yLCBpZiB2YWx1ZSBpcyBub3Qgc3BlY2lmaWVkOlxuICAgICA9IChhbnkpIHZhbHVlXG4gICAgID4gVXNhZ2VcbiAgICAgfCBmb3IgKHZhciBpID0gMCwgaSA8IDUsIGkrKykge1xuICAgICB8ICAgICBwYXBlci5jaXJjbGUoMTAgKyAxNSAqIGksIDEwLCAxMClcbiAgICAgfCAgICAgICAgICAuYXR0cih7ZmlsbDogXCIjMDAwXCJ9KVxuICAgICB8ICAgICAgICAgIC5kYXRhKFwiaVwiLCBpKVxuICAgICB8ICAgICAgICAgIC5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgIHwgICAgICAgICAgICAgYWxlcnQodGhpcy5kYXRhKFwiaVwiKSk7XG4gICAgIHwgICAgICAgICAgfSk7XG4gICAgIHwgfVxuICAgIFxcKi9cbiAgICBlbHByb3RvLmRhdGEgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICB2YXIgZGF0YSA9IGVsZGF0YVt0aGlzLmlkXSA9IGVsZGF0YVt0aGlzLmlkXSB8fCB7fTtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT0gMCl7XG4gICAgICAgICAgICBldmUoXCJzbmFwLmRhdGEuZ2V0LlwiICsgdGhpcy5pZCwgdGhpcywgZGF0YSwgbnVsbCk7XG4gICAgICAgICAgICByZXR1cm4gZGF0YTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAxKSB7XG4gICAgICAgICAgICBpZiAoU25hcC5pcyhrZXksIFwib2JqZWN0XCIpKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSBpbiBrZXkpIGlmIChrZXlbaGFzXShpKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRhdGEoaSwga2V5W2ldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBldmUoXCJzbmFwLmRhdGEuZ2V0LlwiICsgdGhpcy5pZCwgdGhpcywgZGF0YVtrZXldLCBrZXkpO1xuICAgICAgICAgICAgcmV0dXJuIGRhdGFba2V5XTtcbiAgICAgICAgfVxuICAgICAgICBkYXRhW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgZXZlKFwic25hcC5kYXRhLnNldC5cIiArIHRoaXMuaWQsIHRoaXMsIHZhbHVlLCBrZXkpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnJlbW92ZURhdGFcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgdmFsdWUgYXNzb2NpYXRlZCB3aXRoIGFuIGVsZW1lbnQgYnkgZ2l2ZW4ga2V5LlxuICAgICAqIElmIGtleSBpcyBub3QgcHJvdmlkZWQsIHJlbW92ZXMgYWxsIHRoZSBkYXRhIG9mIHRoZSBlbGVtZW50LlxuICAgICAtIGtleSAoc3RyaW5nKSAjb3B0aW9uYWwga2V5XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgZWxwcm90by5yZW1vdmVEYXRhID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBpZiAoa2V5ID09IG51bGwpIHtcbiAgICAgICAgICAgIGVsZGF0YVt0aGlzLmlkXSA9IHt9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZWxkYXRhW3RoaXMuaWRdICYmIGRlbGV0ZSBlbGRhdGFbdGhpcy5pZF1ba2V5XTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50Lm91dGVyU1ZHXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIFNWRyBjb2RlIGZvciB0aGUgZWxlbWVudCwgZXF1aXZhbGVudCB0byBIVE1MJ3MgYG91dGVySFRNTGAuXG4gICAgICpcbiAgICAgKiBTZWUgYWxzbyBARWxlbWVudC5pbm5lclNWR1xuICAgICA9IChzdHJpbmcpIFNWRyBjb2RlIGZvciB0aGUgZWxlbWVudFxuICAgIFxcKi9cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC50b1N0cmluZ1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogU2VlIEBFbGVtZW50Lm91dGVyU1ZHXG4gICAgXFwqL1xuICAgIGVscHJvdG8ub3V0ZXJTVkcgPSBlbHByb3RvLnRvU3RyaW5nID0gdG9TdHJpbmcoMSk7XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuaW5uZXJTVkdcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybnMgU1ZHIGNvZGUgZm9yIHRoZSBlbGVtZW50J3MgY29udGVudHMsIGVxdWl2YWxlbnQgdG8gSFRNTCdzIGBpbm5lckhUTUxgXG4gICAgID0gKHN0cmluZykgU1ZHIGNvZGUgZm9yIHRoZSBlbGVtZW50XG4gICAgXFwqL1xuICAgIGVscHJvdG8uaW5uZXJTVkcgPSB0b1N0cmluZygpO1xuICAgIGZ1bmN0aW9uIHRvU3RyaW5nKHR5cGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciByZXMgPSB0eXBlID8gXCI8XCIgKyB0aGlzLnR5cGUgOiBcIlwiLFxuICAgICAgICAgICAgICAgIGF0dHIgPSB0aGlzLm5vZGUuYXR0cmlidXRlcyxcbiAgICAgICAgICAgICAgICBjaGxkID0gdGhpcy5ub2RlLmNoaWxkTm9kZXM7XG4gICAgICAgICAgICBpZiAodHlwZSkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IGF0dHIubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICByZXMgKz0gXCIgXCIgKyBhdHRyW2ldLm5hbWUgKyAnPVwiJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0cltpXS52YWx1ZS5yZXBsYWNlKC9cIi9nLCAnXFxcXFwiJykgKyAnXCInO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjaGxkLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHR5cGUgJiYgKHJlcyArPSBcIj5cIik7XG4gICAgICAgICAgICAgICAgZm9yIChpID0gMCwgaWkgPSBjaGxkLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNobGRbaV0ubm9kZVR5cGUgPT0gMykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzICs9IGNobGRbaV0ubm9kZVZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNobGRbaV0ubm9kZVR5cGUgPT0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzICs9IHdyYXAoY2hsZFtpXSkudG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0eXBlICYmIChyZXMgKz0gXCI8L1wiICsgdGhpcy50eXBlICsgXCI+XCIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0eXBlICYmIChyZXMgKz0gXCIvPlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgIH07XG4gICAgfVxuICAgIGVscHJvdG8udG9EYXRhVVJMID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAod2luZG93ICYmIHdpbmRvdy5idG9hKSB7XG4gICAgICAgICAgICB2YXIgYmIgPSB0aGlzLmdldEJCb3goKSxcbiAgICAgICAgICAgICAgICBzdmcgPSBTbmFwLmZvcm1hdCgnPHN2ZyB2ZXJzaW9uPVwiMS4xXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHhtbG5zOnhsaW5rPVwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiIHdpZHRoPVwie3dpZHRofVwiIGhlaWdodD1cIntoZWlnaHR9XCIgdmlld0JveD1cInt4fSB7eX0ge3dpZHRofSB7aGVpZ2h0fVwiPntjb250ZW50c308L3N2Zz4nLCB7XG4gICAgICAgICAgICAgICAgeDogK2JiLngudG9GaXhlZCgzKSxcbiAgICAgICAgICAgICAgICB5OiArYmIueS50b0ZpeGVkKDMpLFxuICAgICAgICAgICAgICAgIHdpZHRoOiArYmIud2lkdGgudG9GaXhlZCgzKSxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6ICtiYi5oZWlnaHQudG9GaXhlZCgzKSxcbiAgICAgICAgICAgICAgICBjb250ZW50czogdGhpcy5vdXRlclNWRygpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBcImRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsXCIgKyBidG9hKHVuZXNjYXBlKGVuY29kZVVSSUNvbXBvbmVudChzdmcpKSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBGcmFnbWVudC5zZWxlY3RcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFNlZSBARWxlbWVudC5zZWxlY3RcbiAgICBcXCovXG4gICAgRnJhZ21lbnQucHJvdG90eXBlLnNlbGVjdCA9IGVscHJvdG8uc2VsZWN0O1xuICAgIC8qXFxcbiAgICAgKiBGcmFnbWVudC5zZWxlY3RBbGxcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFNlZSBARWxlbWVudC5zZWxlY3RBbGxcbiAgICBcXCovXG4gICAgRnJhZ21lbnQucHJvdG90eXBlLnNlbGVjdEFsbCA9IGVscHJvdG8uc2VsZWN0QWxsO1xufSk7XG5cbi8vIENvcHlyaWdodCAoYykgMjAxMyBBZG9iZSBTeXN0ZW1zIEluY29ycG9yYXRlZC4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIFxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy8gXG4vLyBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vIFxuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cblNuYXAucGx1Z2luKGZ1bmN0aW9uIChTbmFwLCBFbGVtZW50LCBQYXBlciwgZ2xvYiwgRnJhZ21lbnQpIHtcbiAgICB2YXIgb2JqZWN0VG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLFxuICAgICAgICBTdHIgPSBTdHJpbmcsXG4gICAgICAgIG1hdGggPSBNYXRoLFxuICAgICAgICBFID0gXCJcIjtcbiAgICBmdW5jdGlvbiBNYXRyaXgoYSwgYiwgYywgZCwgZSwgZikge1xuICAgICAgICBpZiAoYiA9PSBudWxsICYmIG9iamVjdFRvU3RyaW5nLmNhbGwoYSkgPT0gXCJbb2JqZWN0IFNWR01hdHJpeF1cIikge1xuICAgICAgICAgICAgdGhpcy5hID0gYS5hO1xuICAgICAgICAgICAgdGhpcy5iID0gYS5iO1xuICAgICAgICAgICAgdGhpcy5jID0gYS5jO1xuICAgICAgICAgICAgdGhpcy5kID0gYS5kO1xuICAgICAgICAgICAgdGhpcy5lID0gYS5lO1xuICAgICAgICAgICAgdGhpcy5mID0gYS5mO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhICE9IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuYSA9ICthO1xuICAgICAgICAgICAgdGhpcy5iID0gK2I7XG4gICAgICAgICAgICB0aGlzLmMgPSArYztcbiAgICAgICAgICAgIHRoaXMuZCA9ICtkO1xuICAgICAgICAgICAgdGhpcy5lID0gK2U7XG4gICAgICAgICAgICB0aGlzLmYgPSArZjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuYSA9IDE7XG4gICAgICAgICAgICB0aGlzLmIgPSAwO1xuICAgICAgICAgICAgdGhpcy5jID0gMDtcbiAgICAgICAgICAgIHRoaXMuZCA9IDE7XG4gICAgICAgICAgICB0aGlzLmUgPSAwO1xuICAgICAgICAgICAgdGhpcy5mID0gMDtcbiAgICAgICAgfVxuICAgIH1cbiAgICAoZnVuY3Rpb24gKG1hdHJpeHByb3RvKSB7XG4gICAgICAgIC8qXFxcbiAgICAgICAgICogTWF0cml4LmFkZFxuICAgICAgICAgWyBtZXRob2QgXVxuICAgICAgICAgKipcbiAgICAgICAgICogQWRkcyB0aGUgZ2l2ZW4gbWF0cml4IHRvIGV4aXN0aW5nIG9uZVxuICAgICAgICAgLSBhIChudW1iZXIpXG4gICAgICAgICAtIGIgKG51bWJlcilcbiAgICAgICAgIC0gYyAobnVtYmVyKVxuICAgICAgICAgLSBkIChudW1iZXIpXG4gICAgICAgICAtIGUgKG51bWJlcilcbiAgICAgICAgIC0gZiAobnVtYmVyKVxuICAgICAgICAgKiBvclxuICAgICAgICAgLSBtYXRyaXggKG9iamVjdCkgQE1hdHJpeFxuICAgICAgICBcXCovXG4gICAgICAgIG1hdHJpeHByb3RvLmFkZCA9IGZ1bmN0aW9uIChhLCBiLCBjLCBkLCBlLCBmKSB7XG4gICAgICAgICAgICB2YXIgb3V0ID0gW1tdLCBbXSwgW11dLFxuICAgICAgICAgICAgICAgIG0gPSBbW3RoaXMuYSwgdGhpcy5jLCB0aGlzLmVdLCBbdGhpcy5iLCB0aGlzLmQsIHRoaXMuZl0sIFswLCAwLCAxXV0sXG4gICAgICAgICAgICAgICAgbWF0cml4ID0gW1thLCBjLCBlXSwgW2IsIGQsIGZdLCBbMCwgMCwgMV1dLFxuICAgICAgICAgICAgICAgIHgsIHksIHosIHJlcztcblxuICAgICAgICAgICAgaWYgKGEgJiYgYSBpbnN0YW5jZW9mIE1hdHJpeCkge1xuICAgICAgICAgICAgICAgIG1hdHJpeCA9IFtbYS5hLCBhLmMsIGEuZV0sIFthLmIsIGEuZCwgYS5mXSwgWzAsIDAsIDFdXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yICh4ID0gMDsgeCA8IDM7IHgrKykge1xuICAgICAgICAgICAgICAgIGZvciAoeSA9IDA7IHkgPCAzOyB5KyspIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzID0gMDtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh6ID0gMDsgeiA8IDM7IHorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzICs9IG1beF1bel0gKiBtYXRyaXhbel1beV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgb3V0W3hdW3ldID0gcmVzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuYSA9IG91dFswXVswXTtcbiAgICAgICAgICAgIHRoaXMuYiA9IG91dFsxXVswXTtcbiAgICAgICAgICAgIHRoaXMuYyA9IG91dFswXVsxXTtcbiAgICAgICAgICAgIHRoaXMuZCA9IG91dFsxXVsxXTtcbiAgICAgICAgICAgIHRoaXMuZSA9IG91dFswXVsyXTtcbiAgICAgICAgICAgIHRoaXMuZiA9IG91dFsxXVsyXTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9O1xuICAgICAgICAvKlxcXG4gICAgICAgICAqIE1hdHJpeC5pbnZlcnRcbiAgICAgICAgIFsgbWV0aG9kIF1cbiAgICAgICAgICoqXG4gICAgICAgICAqIFJldHVybnMgYW4gaW52ZXJ0ZWQgdmVyc2lvbiBvZiB0aGUgbWF0cml4XG4gICAgICAgICA9IChvYmplY3QpIEBNYXRyaXhcbiAgICAgICAgXFwqL1xuICAgICAgICBtYXRyaXhwcm90by5pbnZlcnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgbWUgPSB0aGlzLFxuICAgICAgICAgICAgICAgIHggPSBtZS5hICogbWUuZCAtIG1lLmIgKiBtZS5jO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBNYXRyaXgobWUuZCAvIHgsIC1tZS5iIC8geCwgLW1lLmMgLyB4LCBtZS5hIC8geCwgKG1lLmMgKiBtZS5mIC0gbWUuZCAqIG1lLmUpIC8geCwgKG1lLmIgKiBtZS5lIC0gbWUuYSAqIG1lLmYpIC8geCk7XG4gICAgICAgIH07XG4gICAgICAgIC8qXFxcbiAgICAgICAgICogTWF0cml4LmNsb25lXG4gICAgICAgICBbIG1ldGhvZCBdXG4gICAgICAgICAqKlxuICAgICAgICAgKiBSZXR1cm5zIGEgY29weSBvZiB0aGUgbWF0cml4XG4gICAgICAgICA9IChvYmplY3QpIEBNYXRyaXhcbiAgICAgICAgXFwqL1xuICAgICAgICBtYXRyaXhwcm90by5jbG9uZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgTWF0cml4KHRoaXMuYSwgdGhpcy5iLCB0aGlzLmMsIHRoaXMuZCwgdGhpcy5lLCB0aGlzLmYpO1xuICAgICAgICB9O1xuICAgICAgICAvKlxcXG4gICAgICAgICAqIE1hdHJpeC50cmFuc2xhdGVcbiAgICAgICAgIFsgbWV0aG9kIF1cbiAgICAgICAgICoqXG4gICAgICAgICAqIFRyYW5zbGF0ZSB0aGUgbWF0cml4XG4gICAgICAgICAtIHggKG51bWJlcikgaG9yaXpvbnRhbCBvZmZzZXQgZGlzdGFuY2VcbiAgICAgICAgIC0geSAobnVtYmVyKSB2ZXJ0aWNhbCBvZmZzZXQgZGlzdGFuY2VcbiAgICAgICAgXFwqL1xuICAgICAgICBtYXRyaXhwcm90by50cmFuc2xhdGUgPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWRkKDEsIDAsIDAsIDEsIHgsIHkpO1xuICAgICAgICB9O1xuICAgICAgICAvKlxcXG4gICAgICAgICAqIE1hdHJpeC5zY2FsZVxuICAgICAgICAgWyBtZXRob2QgXVxuICAgICAgICAgKipcbiAgICAgICAgICogU2NhbGVzIHRoZSBtYXRyaXhcbiAgICAgICAgIC0geCAobnVtYmVyKSBhbW91bnQgdG8gYmUgc2NhbGVkLCB3aXRoIGAxYCByZXN1bHRpbmcgaW4gbm8gY2hhbmdlXG4gICAgICAgICAtIHkgKG51bWJlcikgI29wdGlvbmFsIGFtb3VudCB0byBzY2FsZSBhbG9uZyB0aGUgdmVydGljYWwgYXhpcy4gKE90aGVyd2lzZSBgeGAgYXBwbGllcyB0byBib3RoIGF4ZXMuKVxuICAgICAgICAgLSBjeCAobnVtYmVyKSAjb3B0aW9uYWwgaG9yaXpvbnRhbCBvcmlnaW4gcG9pbnQgZnJvbSB3aGljaCB0byBzY2FsZVxuICAgICAgICAgLSBjeSAobnVtYmVyKSAjb3B0aW9uYWwgdmVydGljYWwgb3JpZ2luIHBvaW50IGZyb20gd2hpY2ggdG8gc2NhbGVcbiAgICAgICAgICogRGVmYXVsdCBjeCwgY3kgaXMgdGhlIG1pZGRsZSBwb2ludCBvZiB0aGUgZWxlbWVudC5cbiAgICAgICAgXFwqL1xuICAgICAgICBtYXRyaXhwcm90by5zY2FsZSA9IGZ1bmN0aW9uICh4LCB5LCBjeCwgY3kpIHtcbiAgICAgICAgICAgIHkgPT0gbnVsbCAmJiAoeSA9IHgpO1xuICAgICAgICAgICAgKGN4IHx8IGN5KSAmJiB0aGlzLmFkZCgxLCAwLCAwLCAxLCBjeCwgY3kpO1xuICAgICAgICAgICAgdGhpcy5hZGQoeCwgMCwgMCwgeSwgMCwgMCk7XG4gICAgICAgICAgICAoY3ggfHwgY3kpICYmIHRoaXMuYWRkKDEsIDAsIDAsIDEsIC1jeCwgLWN5KTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9O1xuICAgICAgICAvKlxcXG4gICAgICAgICAqIE1hdHJpeC5yb3RhdGVcbiAgICAgICAgIFsgbWV0aG9kIF1cbiAgICAgICAgICoqXG4gICAgICAgICAqIFJvdGF0ZXMgdGhlIG1hdHJpeFxuICAgICAgICAgLSBhIChudW1iZXIpIGFuZ2xlIG9mIHJvdGF0aW9uLCBpbiBkZWdyZWVzXG4gICAgICAgICAtIHggKG51bWJlcikgaG9yaXpvbnRhbCBvcmlnaW4gcG9pbnQgZnJvbSB3aGljaCB0byByb3RhdGVcbiAgICAgICAgIC0geSAobnVtYmVyKSB2ZXJ0aWNhbCBvcmlnaW4gcG9pbnQgZnJvbSB3aGljaCB0byByb3RhdGVcbiAgICAgICAgXFwqL1xuICAgICAgICBtYXRyaXhwcm90by5yb3RhdGUgPSBmdW5jdGlvbiAoYSwgeCwgeSkge1xuICAgICAgICAgICAgYSA9IFNuYXAucmFkKGEpO1xuICAgICAgICAgICAgeCA9IHggfHwgMDtcbiAgICAgICAgICAgIHkgPSB5IHx8IDA7XG4gICAgICAgICAgICB2YXIgY29zID0gK21hdGguY29zKGEpLnRvRml4ZWQoOSksXG4gICAgICAgICAgICAgICAgc2luID0gK21hdGguc2luKGEpLnRvRml4ZWQoOSk7XG4gICAgICAgICAgICB0aGlzLmFkZChjb3MsIHNpbiwgLXNpbiwgY29zLCB4LCB5KTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmFkZCgxLCAwLCAwLCAxLCAteCwgLXkpO1xuICAgICAgICB9O1xuICAgICAgICAvKlxcXG4gICAgICAgICAqIE1hdHJpeC54XG4gICAgICAgICBbIG1ldGhvZCBdXG4gICAgICAgICAqKlxuICAgICAgICAgKiBSZXR1cm5zIHggY29vcmRpbmF0ZSBmb3IgZ2l2ZW4gcG9pbnQgYWZ0ZXIgdHJhbnNmb3JtYXRpb24gZGVzY3JpYmVkIGJ5IHRoZSBtYXRyaXguIFNlZSBhbHNvIEBNYXRyaXgueVxuICAgICAgICAgLSB4IChudW1iZXIpXG4gICAgICAgICAtIHkgKG51bWJlcilcbiAgICAgICAgID0gKG51bWJlcikgeFxuICAgICAgICBcXCovXG4gICAgICAgIG1hdHJpeHByb3RvLnggPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICAgICAgcmV0dXJuIHggKiB0aGlzLmEgKyB5ICogdGhpcy5jICsgdGhpcy5lO1xuICAgICAgICB9O1xuICAgICAgICAvKlxcXG4gICAgICAgICAqIE1hdHJpeC55XG4gICAgICAgICBbIG1ldGhvZCBdXG4gICAgICAgICAqKlxuICAgICAgICAgKiBSZXR1cm5zIHkgY29vcmRpbmF0ZSBmb3IgZ2l2ZW4gcG9pbnQgYWZ0ZXIgdHJhbnNmb3JtYXRpb24gZGVzY3JpYmVkIGJ5IHRoZSBtYXRyaXguIFNlZSBhbHNvIEBNYXRyaXgueFxuICAgICAgICAgLSB4IChudW1iZXIpXG4gICAgICAgICAtIHkgKG51bWJlcilcbiAgICAgICAgID0gKG51bWJlcikgeVxuICAgICAgICBcXCovXG4gICAgICAgIG1hdHJpeHByb3RvLnkgPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICAgICAgcmV0dXJuIHggKiB0aGlzLmIgKyB5ICogdGhpcy5kICsgdGhpcy5mO1xuICAgICAgICB9O1xuICAgICAgICBtYXRyaXhwcm90by5nZXQgPSBmdW5jdGlvbiAoaSkge1xuICAgICAgICAgICAgcmV0dXJuICt0aGlzW1N0ci5mcm9tQ2hhckNvZGUoOTcgKyBpKV0udG9GaXhlZCg0KTtcbiAgICAgICAgfTtcbiAgICAgICAgbWF0cml4cHJvdG8udG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJtYXRyaXgoXCIgKyBbdGhpcy5nZXQoMCksIHRoaXMuZ2V0KDEpLCB0aGlzLmdldCgyKSwgdGhpcy5nZXQoMyksIHRoaXMuZ2V0KDQpLCB0aGlzLmdldCg1KV0uam9pbigpICsgXCIpXCI7XG4gICAgICAgIH07XG4gICAgICAgIG1hdHJpeHByb3RvLm9mZnNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBbdGhpcy5lLnRvRml4ZWQoNCksIHRoaXMuZi50b0ZpeGVkKDQpXTtcbiAgICAgICAgfTtcbiAgICAgICAgZnVuY3Rpb24gbm9ybShhKSB7XG4gICAgICAgICAgICByZXR1cm4gYVswXSAqIGFbMF0gKyBhWzFdICogYVsxXTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBub3JtYWxpemUoYSkge1xuICAgICAgICAgICAgdmFyIG1hZyA9IG1hdGguc3FydChub3JtKGEpKTtcbiAgICAgICAgICAgIGFbMF0gJiYgKGFbMF0gLz0gbWFnKTtcbiAgICAgICAgICAgIGFbMV0gJiYgKGFbMV0gLz0gbWFnKTtcbiAgICAgICAgfVxuICAgICAgICAvKlxcXG4gICAgICAgICAqIE1hdHJpeC5kZXRlcm1pbmFudFxuICAgICAgICAgWyBtZXRob2QgXVxuICAgICAgICAgKipcbiAgICAgICAgICogRmluZHMgZGV0ZXJtaW5hbnQgb2YgdGhlIGdpdmVuIG1hdHJpeC5cbiAgICAgICAgID0gKG51bWJlcikgZGV0ZXJtaW5hbnRcbiAgICAgICAgXFwqL1xuICAgICAgICBtYXRyaXhwcm90by5kZXRlcm1pbmFudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmEgKiB0aGlzLmQgLSB0aGlzLmIgKiB0aGlzLmM7XG4gICAgICAgIH07XG4gICAgICAgIC8qXFxcbiAgICAgICAgICogTWF0cml4LnNwbGl0XG4gICAgICAgICBbIG1ldGhvZCBdXG4gICAgICAgICAqKlxuICAgICAgICAgKiBTcGxpdHMgbWF0cml4IGludG8gcHJpbWl0aXZlIHRyYW5zZm9ybWF0aW9uc1xuICAgICAgICAgPSAob2JqZWN0KSBpbiBmb3JtYXQ6XG4gICAgICAgICBvIGR4IChudW1iZXIpIHRyYW5zbGF0aW9uIGJ5IHhcbiAgICAgICAgIG8gZHkgKG51bWJlcikgdHJhbnNsYXRpb24gYnkgeVxuICAgICAgICAgbyBzY2FsZXggKG51bWJlcikgc2NhbGUgYnkgeFxuICAgICAgICAgbyBzY2FsZXkgKG51bWJlcikgc2NhbGUgYnkgeVxuICAgICAgICAgbyBzaGVhciAobnVtYmVyKSBzaGVhclxuICAgICAgICAgbyByb3RhdGUgKG51bWJlcikgcm90YXRpb24gaW4gZGVnXG4gICAgICAgICBvIGlzU2ltcGxlIChib29sZWFuKSBjb3VsZCBpdCBiZSByZXByZXNlbnRlZCB2aWEgc2ltcGxlIHRyYW5zZm9ybWF0aW9uc1xuICAgICAgICBcXCovXG4gICAgICAgIG1hdHJpeHByb3RvLnNwbGl0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIG91dCA9IHt9O1xuICAgICAgICAgICAgLy8gdHJhbnNsYXRpb25cbiAgICAgICAgICAgIG91dC5keCA9IHRoaXMuZTtcbiAgICAgICAgICAgIG91dC5keSA9IHRoaXMuZjtcblxuICAgICAgICAgICAgLy8gc2NhbGUgYW5kIHNoZWFyXG4gICAgICAgICAgICB2YXIgcm93ID0gW1t0aGlzLmEsIHRoaXMuY10sIFt0aGlzLmIsIHRoaXMuZF1dO1xuICAgICAgICAgICAgb3V0LnNjYWxleCA9IG1hdGguc3FydChub3JtKHJvd1swXSkpO1xuICAgICAgICAgICAgbm9ybWFsaXplKHJvd1swXSk7XG5cbiAgICAgICAgICAgIG91dC5zaGVhciA9IHJvd1swXVswXSAqIHJvd1sxXVswXSArIHJvd1swXVsxXSAqIHJvd1sxXVsxXTtcbiAgICAgICAgICAgIHJvd1sxXSA9IFtyb3dbMV1bMF0gLSByb3dbMF1bMF0gKiBvdXQuc2hlYXIsIHJvd1sxXVsxXSAtIHJvd1swXVsxXSAqIG91dC5zaGVhcl07XG5cbiAgICAgICAgICAgIG91dC5zY2FsZXkgPSBtYXRoLnNxcnQobm9ybShyb3dbMV0pKTtcbiAgICAgICAgICAgIG5vcm1hbGl6ZShyb3dbMV0pO1xuICAgICAgICAgICAgb3V0LnNoZWFyIC89IG91dC5zY2FsZXk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmRldGVybWluYW50KCkgPCAwKSB7XG4gICAgICAgICAgICAgICAgb3V0LnNjYWxleCA9IC1vdXQuc2NhbGV4O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyByb3RhdGlvblxuICAgICAgICAgICAgdmFyIHNpbiA9IC1yb3dbMF1bMV0sXG4gICAgICAgICAgICAgICAgY29zID0gcm93WzFdWzFdO1xuICAgICAgICAgICAgaWYgKGNvcyA8IDApIHtcbiAgICAgICAgICAgICAgICBvdXQucm90YXRlID0gU25hcC5kZWcobWF0aC5hY29zKGNvcykpO1xuICAgICAgICAgICAgICAgIGlmIChzaW4gPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dC5yb3RhdGUgPSAzNjAgLSBvdXQucm90YXRlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgb3V0LnJvdGF0ZSA9IFNuYXAuZGVnKG1hdGguYXNpbihzaW4pKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgb3V0LmlzU2ltcGxlID0gIStvdXQuc2hlYXIudG9GaXhlZCg5KSAmJiAob3V0LnNjYWxleC50b0ZpeGVkKDkpID09IG91dC5zY2FsZXkudG9GaXhlZCg5KSB8fCAhb3V0LnJvdGF0ZSk7XG4gICAgICAgICAgICBvdXQuaXNTdXBlclNpbXBsZSA9ICErb3V0LnNoZWFyLnRvRml4ZWQoOSkgJiYgb3V0LnNjYWxleC50b0ZpeGVkKDkpID09IG91dC5zY2FsZXkudG9GaXhlZCg5KSAmJiAhb3V0LnJvdGF0ZTtcbiAgICAgICAgICAgIG91dC5ub1JvdGF0aW9uID0gIStvdXQuc2hlYXIudG9GaXhlZCg5KSAmJiAhb3V0LnJvdGF0ZTtcbiAgICAgICAgICAgIHJldHVybiBvdXQ7XG4gICAgICAgIH07XG4gICAgICAgIC8qXFxcbiAgICAgICAgICogTWF0cml4LnRvVHJhbnNmb3JtU3RyaW5nXG4gICAgICAgICBbIG1ldGhvZCBdXG4gICAgICAgICAqKlxuICAgICAgICAgKiBSZXR1cm5zIHRyYW5zZm9ybSBzdHJpbmcgdGhhdCByZXByZXNlbnRzIGdpdmVuIG1hdHJpeFxuICAgICAgICAgPSAoc3RyaW5nKSB0cmFuc2Zvcm0gc3RyaW5nXG4gICAgICAgIFxcKi9cbiAgICAgICAgbWF0cml4cHJvdG8udG9UcmFuc2Zvcm1TdHJpbmcgPSBmdW5jdGlvbiAoc2hvcnRlcikge1xuICAgICAgICAgICAgdmFyIHMgPSBzaG9ydGVyIHx8IHRoaXMuc3BsaXQoKTtcbiAgICAgICAgICAgIGlmICghK3Muc2hlYXIudG9GaXhlZCg5KSkge1xuICAgICAgICAgICAgICAgIHMuc2NhbGV4ID0gK3Muc2NhbGV4LnRvRml4ZWQoNCk7XG4gICAgICAgICAgICAgICAgcy5zY2FsZXkgPSArcy5zY2FsZXkudG9GaXhlZCg0KTtcbiAgICAgICAgICAgICAgICBzLnJvdGF0ZSA9ICtzLnJvdGF0ZS50b0ZpeGVkKDQpO1xuICAgICAgICAgICAgICAgIHJldHVybiAgKHMuZHggfHwgcy5keSA/IFwidFwiICsgWytzLmR4LnRvRml4ZWQoNCksICtzLmR5LnRvRml4ZWQoNCldIDogRSkgKyBcbiAgICAgICAgICAgICAgICAgICAgICAgIChzLnNjYWxleCAhPSAxIHx8IHMuc2NhbGV5ICE9IDEgPyBcInNcIiArIFtzLnNjYWxleCwgcy5zY2FsZXksIDAsIDBdIDogRSkgK1xuICAgICAgICAgICAgICAgICAgICAgICAgKHMucm90YXRlID8gXCJyXCIgKyBbK3Mucm90YXRlLnRvRml4ZWQoNCksIDAsIDBdIDogRSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBcIm1cIiArIFt0aGlzLmdldCgwKSwgdGhpcy5nZXQoMSksIHRoaXMuZ2V0KDIpLCB0aGlzLmdldCgzKSwgdGhpcy5nZXQoNCksIHRoaXMuZ2V0KDUpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KShNYXRyaXgucHJvdG90eXBlKTtcbiAgICAvKlxcXG4gICAgICogU25hcC5NYXRyaXhcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIE1hdHJpeCBjb25zdHJ1Y3RvciwgZXh0ZW5kIG9uIHlvdXIgb3duIHJpc2suXG4gICAgICogVG8gY3JlYXRlIG1hdHJpY2VzIHVzZSBAU25hcC5tYXRyaXguXG4gICAgXFwqL1xuICAgIFNuYXAuTWF0cml4ID0gTWF0cml4O1xuICAgIC8qXFxcbiAgICAgKiBTbmFwLm1hdHJpeFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogVXRpbGl0eSBtZXRob2RcbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIGEgbWF0cml4IGJhc2VkIG9uIHRoZSBnaXZlbiBwYXJhbWV0ZXJzXG4gICAgIC0gYSAobnVtYmVyKVxuICAgICAtIGIgKG51bWJlcilcbiAgICAgLSBjIChudW1iZXIpXG4gICAgIC0gZCAobnVtYmVyKVxuICAgICAtIGUgKG51bWJlcilcbiAgICAgLSBmIChudW1iZXIpXG4gICAgICogb3JcbiAgICAgLSBzdmdNYXRyaXggKFNWR01hdHJpeClcbiAgICAgPSAob2JqZWN0KSBATWF0cml4XG4gICAgXFwqL1xuICAgIFNuYXAubWF0cml4ID0gZnVuY3Rpb24gKGEsIGIsIGMsIGQsIGUsIGYpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBNYXRyaXgoYSwgYiwgYywgZCwgZSwgZik7XG4gICAgfTtcbn0pO1xuLy8gQ29weXJpZ2h0IChjKSAyMDEzIEFkb2JlIFN5c3RlbXMgSW5jb3Jwb3JhdGVkLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vLyBcbi8vIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy8gXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuU25hcC5wbHVnaW4oZnVuY3Rpb24gKFNuYXAsIEVsZW1lbnQsIFBhcGVyLCBnbG9iLCBGcmFnbWVudCkge1xuICAgIHZhciBoYXMgPSBcImhhc093blByb3BlcnR5XCIsXG4gICAgICAgIG1ha2UgPSBTbmFwLl8ubWFrZSxcbiAgICAgICAgd3JhcCA9IFNuYXAuXy53cmFwLFxuICAgICAgICBpcyA9IFNuYXAuaXMsXG4gICAgICAgIGdldFNvbWVEZWZzID0gU25hcC5fLmdldFNvbWVEZWZzLFxuICAgICAgICByZVVSTFZhbHVlID0gL151cmxcXCgjPyhbXildKylcXCkkLyxcbiAgICAgICAgJCA9IFNuYXAuXy4kLFxuICAgICAgICBVUkwgPSBTbmFwLnVybCxcbiAgICAgICAgU3RyID0gU3RyaW5nLFxuICAgICAgICBzZXBhcmF0b3IgPSBTbmFwLl8uc2VwYXJhdG9yLFxuICAgICAgICBFID0gXCJcIjtcbiAgICAvLyBBdHRyaWJ1dGVzIGV2ZW50IGhhbmRsZXJzXG4gICAgZXZlLm9uKFwic25hcC51dGlsLmF0dHIubWFza1wiLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRWxlbWVudCB8fCB2YWx1ZSBpbnN0YW5jZW9mIEZyYWdtZW50KSB7XG4gICAgICAgICAgICBldmUuc3RvcCgpO1xuICAgICAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRnJhZ21lbnQgJiYgdmFsdWUubm9kZS5jaGlsZE5vZGVzLmxlbmd0aCA9PSAxKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5ub2RlLmZpcnN0Q2hpbGQ7XG4gICAgICAgICAgICAgICAgZ2V0U29tZURlZnModGhpcykuYXBwZW5kQ2hpbGQodmFsdWUpO1xuICAgICAgICAgICAgICAgIHZhbHVlID0gd3JhcCh2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodmFsdWUudHlwZSA9PSBcIm1hc2tcIikge1xuICAgICAgICAgICAgICAgIHZhciBtYXNrID0gdmFsdWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1hc2sgPSBtYWtlKFwibWFza1wiLCBnZXRTb21lRGVmcyh0aGlzKSk7XG4gICAgICAgICAgICAgICAgbWFzay5ub2RlLmFwcGVuZENoaWxkKHZhbHVlLm5vZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgIW1hc2subm9kZS5pZCAmJiAkKG1hc2subm9kZSwge1xuICAgICAgICAgICAgICAgIGlkOiBtYXNrLmlkXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICQodGhpcy5ub2RlLCB7XG4gICAgICAgICAgICAgICAgbWFzazogVVJMKG1hc2suaWQpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIChmdW5jdGlvbiAoY2xpcEl0KSB7XG4gICAgICAgIGV2ZS5vbihcInNuYXAudXRpbC5hdHRyLmNsaXBcIiwgY2xpcEl0KTtcbiAgICAgICAgZXZlLm9uKFwic25hcC51dGlsLmF0dHIuY2xpcC1wYXRoXCIsIGNsaXBJdCk7XG4gICAgICAgIGV2ZS5vbihcInNuYXAudXRpbC5hdHRyLmNsaXBQYXRoXCIsIGNsaXBJdCk7XG4gICAgfShmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRWxlbWVudCB8fCB2YWx1ZSBpbnN0YW5jZW9mIEZyYWdtZW50KSB7XG4gICAgICAgICAgICBldmUuc3RvcCgpO1xuICAgICAgICAgICAgaWYgKHZhbHVlLnR5cGUgPT0gXCJjbGlwUGF0aFwiKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNsaXAgPSB2YWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY2xpcCA9IG1ha2UoXCJjbGlwUGF0aFwiLCBnZXRTb21lRGVmcyh0aGlzKSk7XG4gICAgICAgICAgICAgICAgY2xpcC5ub2RlLmFwcGVuZENoaWxkKHZhbHVlLm5vZGUpO1xuICAgICAgICAgICAgICAgICFjbGlwLm5vZGUuaWQgJiYgJChjbGlwLm5vZGUsIHtcbiAgICAgICAgICAgICAgICAgICAgaWQ6IGNsaXAuaWRcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICQodGhpcy5ub2RlLCB7XG4gICAgICAgICAgICAgICAgXCJjbGlwLXBhdGhcIjogVVJMKGNsaXAubm9kZS5pZCB8fCBjbGlwLmlkKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9KSk7XG4gICAgZnVuY3Rpb24gZmlsbFN0cm9rZShuYW1lKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIGV2ZS5zdG9wKCk7XG4gICAgICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBGcmFnbWVudCAmJiB2YWx1ZS5ub2RlLmNoaWxkTm9kZXMubGVuZ3RoID09IDEgJiZcbiAgICAgICAgICAgICAgICAodmFsdWUubm9kZS5maXJzdENoaWxkLnRhZ05hbWUgPT0gXCJyYWRpYWxHcmFkaWVudFwiIHx8XG4gICAgICAgICAgICAgICAgdmFsdWUubm9kZS5maXJzdENoaWxkLnRhZ05hbWUgPT0gXCJsaW5lYXJHcmFkaWVudFwiIHx8XG4gICAgICAgICAgICAgICAgdmFsdWUubm9kZS5maXJzdENoaWxkLnRhZ05hbWUgPT0gXCJwYXR0ZXJuXCIpKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5ub2RlLmZpcnN0Q2hpbGQ7XG4gICAgICAgICAgICAgICAgZ2V0U29tZURlZnModGhpcykuYXBwZW5kQ2hpbGQodmFsdWUpO1xuICAgICAgICAgICAgICAgIHZhbHVlID0gd3JhcCh2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlLnR5cGUgPT0gXCJyYWRpYWxHcmFkaWVudFwiIHx8IHZhbHVlLnR5cGUgPT0gXCJsaW5lYXJHcmFkaWVudFwiXG4gICAgICAgICAgICAgICAgICAgfHwgdmFsdWUudHlwZSA9PSBcInBhdHRlcm5cIikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXZhbHVlLm5vZGUuaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQodmFsdWUubm9kZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiB2YWx1ZS5pZFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdmFyIGZpbGwgPSBVUkwodmFsdWUubm9kZS5pZCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsbCA9IHZhbHVlLmF0dHIobmFtZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmaWxsID0gU25hcC5jb2xvcih2YWx1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKGZpbGwuZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGdyYWQgPSBTbmFwKGdldFNvbWVEZWZzKHRoaXMpLm93bmVyU1ZHRWxlbWVudCkuZ3JhZGllbnQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZ3JhZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFncmFkLm5vZGUuaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGdyYWQubm9kZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogZ3JhZC5pZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsbCA9IFVSTChncmFkLm5vZGUuaWQpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlsbCA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsbCA9IFN0cihmaWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgYXR0cnMgPSB7fTtcbiAgICAgICAgICAgIGF0dHJzW25hbWVdID0gZmlsbDtcbiAgICAgICAgICAgICQodGhpcy5ub2RlLCBhdHRycyk7XG4gICAgICAgICAgICB0aGlzLm5vZGUuc3R5bGVbbmFtZV0gPSBFO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBldmUub24oXCJzbmFwLnV0aWwuYXR0ci5maWxsXCIsIGZpbGxTdHJva2UoXCJmaWxsXCIpKTtcbiAgICBldmUub24oXCJzbmFwLnV0aWwuYXR0ci5zdHJva2VcIiwgZmlsbFN0cm9rZShcInN0cm9rZVwiKSk7XG4gICAgdmFyIGdyYWRyZyA9IC9eKFtscl0pKD86XFwoKFteKV0qKVxcKSk/KC4qKSQvaTtcbiAgICBldmUub24oXCJzbmFwLnV0aWwuZ3JhZC5wYXJzZVwiLCBmdW5jdGlvbiBwYXJzZUdyYWQoc3RyaW5nKSB7XG4gICAgICAgIHN0cmluZyA9IFN0cihzdHJpbmcpO1xuICAgICAgICB2YXIgdG9rZW5zID0gc3RyaW5nLm1hdGNoKGdyYWRyZyk7XG4gICAgICAgIGlmICghdG9rZW5zKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdHlwZSA9IHRva2Vuc1sxXSxcbiAgICAgICAgICAgIHBhcmFtcyA9IHRva2Vuc1syXSxcbiAgICAgICAgICAgIHN0b3BzID0gdG9rZW5zWzNdO1xuICAgICAgICBwYXJhbXMgPSBwYXJhbXMuc3BsaXQoL1xccyosXFxzKi8pLm1hcChmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgIHJldHVybiArZWwgPT0gZWwgPyArZWwgOiBlbDtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChwYXJhbXMubGVuZ3RoID09IDEgJiYgcGFyYW1zWzBdID09IDApIHtcbiAgICAgICAgICAgIHBhcmFtcyA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIHN0b3BzID0gc3RvcHMuc3BsaXQoXCItXCIpO1xuICAgICAgICBzdG9wcyA9IHN0b3BzLm1hcChmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgIGVsID0gZWwuc3BsaXQoXCI6XCIpO1xuICAgICAgICAgICAgdmFyIG91dCA9IHtcbiAgICAgICAgICAgICAgICBjb2xvcjogZWxbMF1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAoZWxbMV0pIHtcbiAgICAgICAgICAgICAgICBvdXQub2Zmc2V0ID0gcGFyc2VGbG9hdChlbFsxXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gb3V0O1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgICAgICBwYXJhbXM6IHBhcmFtcyxcbiAgICAgICAgICAgIHN0b3BzOiBzdG9wc1xuICAgICAgICB9O1xuICAgIH0pO1xuXG4gICAgZXZlLm9uKFwic25hcC51dGlsLmF0dHIuZFwiLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgZXZlLnN0b3AoKTtcbiAgICAgICAgaWYgKGlzKHZhbHVlLCBcImFycmF5XCIpICYmIGlzKHZhbHVlWzBdLCBcImFycmF5XCIpKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IFNuYXAucGF0aC50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICB2YWx1ZSA9IFN0cih2YWx1ZSk7XG4gICAgICAgIGlmICh2YWx1ZS5tYXRjaCgvW3J1b10vaSkpIHtcbiAgICAgICAgICAgIHZhbHVlID0gU25hcC5wYXRoLnRvQWJzb2x1dGUodmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgICQodGhpcy5ub2RlLCB7ZDogdmFsdWV9KTtcbiAgICB9KSgtMSk7XG4gICAgZXZlLm9uKFwic25hcC51dGlsLmF0dHIuI3RleHRcIiwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGV2ZS5zdG9wKCk7XG4gICAgICAgIHZhbHVlID0gU3RyKHZhbHVlKTtcbiAgICAgICAgdmFyIHR4dCA9IGdsb2IuZG9jLmNyZWF0ZVRleHROb2RlKHZhbHVlKTtcbiAgICAgICAgd2hpbGUgKHRoaXMubm9kZS5maXJzdENoaWxkKSB7XG4gICAgICAgICAgICB0aGlzLm5vZGUucmVtb3ZlQ2hpbGQodGhpcy5ub2RlLmZpcnN0Q2hpbGQpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubm9kZS5hcHBlbmRDaGlsZCh0eHQpO1xuICAgIH0pKC0xKTtcbiAgICBldmUub24oXCJzbmFwLnV0aWwuYXR0ci5wYXRoXCIsIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBldmUuc3RvcCgpO1xuICAgICAgICB0aGlzLmF0dHIoe2Q6IHZhbHVlfSk7XG4gICAgfSkoLTEpO1xuICAgIGV2ZS5vbihcInNuYXAudXRpbC5hdHRyLmNsYXNzXCIsIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBldmUuc3RvcCgpO1xuICAgICAgICB0aGlzLm5vZGUuY2xhc3NOYW1lLmJhc2VWYWwgPSB2YWx1ZTtcbiAgICB9KSgtMSk7XG4gICAgZXZlLm9uKFwic25hcC51dGlsLmF0dHIudmlld0JveFwiLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdmFyIHZiO1xuICAgICAgICBpZiAoaXModmFsdWUsIFwib2JqZWN0XCIpICYmIFwieFwiIGluIHZhbHVlKSB7XG4gICAgICAgICAgICB2YiA9IFt2YWx1ZS54LCB2YWx1ZS55LCB2YWx1ZS53aWR0aCwgdmFsdWUuaGVpZ2h0XS5qb2luKFwiIFwiKTtcbiAgICAgICAgfSBlbHNlIGlmIChpcyh2YWx1ZSwgXCJhcnJheVwiKSkge1xuICAgICAgICAgICAgdmIgPSB2YWx1ZS5qb2luKFwiIFwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZiID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgJCh0aGlzLm5vZGUsIHtcbiAgICAgICAgICAgIHZpZXdCb3g6IHZiXG4gICAgICAgIH0pO1xuICAgICAgICBldmUuc3RvcCgpO1xuICAgIH0pKC0xKTtcbiAgICBldmUub24oXCJzbmFwLnV0aWwuYXR0ci50cmFuc2Zvcm1cIiwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHRoaXMudHJhbnNmb3JtKHZhbHVlKTtcbiAgICAgICAgZXZlLnN0b3AoKTtcbiAgICB9KSgtMSk7XG4gICAgZXZlLm9uKFwic25hcC51dGlsLmF0dHIuclwiLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgaWYgKHRoaXMudHlwZSA9PSBcInJlY3RcIikge1xuICAgICAgICAgICAgZXZlLnN0b3AoKTtcbiAgICAgICAgICAgICQodGhpcy5ub2RlLCB7XG4gICAgICAgICAgICAgICAgcng6IHZhbHVlLFxuICAgICAgICAgICAgICAgIHJ5OiB2YWx1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9KSgtMSk7XG4gICAgZXZlLm9uKFwic25hcC51dGlsLmF0dHIudGV4dHBhdGhcIiwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGV2ZS5zdG9wKCk7XG4gICAgICAgIGlmICh0aGlzLnR5cGUgPT0gXCJ0ZXh0XCIpIHtcbiAgICAgICAgICAgIHZhciBpZCwgdHAsIG5vZGU7XG4gICAgICAgICAgICBpZiAoIXZhbHVlICYmIHRoaXMudGV4dFBhdGgpIHtcbiAgICAgICAgICAgICAgICB0cCA9IHRoaXMudGV4dFBhdGg7XG4gICAgICAgICAgICAgICAgd2hpbGUgKHRwLm5vZGUuZmlyc3RDaGlsZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm5vZGUuYXBwZW5kQ2hpbGQodHAubm9kZS5maXJzdENoaWxkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdHAucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMudGV4dFBhdGg7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlzKHZhbHVlLCBcInN0cmluZ1wiKSkge1xuICAgICAgICAgICAgICAgIHZhciBkZWZzID0gZ2V0U29tZURlZnModGhpcyksXG4gICAgICAgICAgICAgICAgICAgIHBhdGggPSB3cmFwKGRlZnMucGFyZW50Tm9kZSkucGF0aCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgZGVmcy5hcHBlbmRDaGlsZChwYXRoLm5vZGUpO1xuICAgICAgICAgICAgICAgIGlkID0gcGF0aC5pZDtcbiAgICAgICAgICAgICAgICBwYXRoLmF0dHIoe2lkOiBpZH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHdyYXAodmFsdWUpO1xuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWQgPSB2YWx1ZS5hdHRyKFwiaWRcIik7XG4gICAgICAgICAgICAgICAgICAgIGlmICghaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gdmFsdWUuaWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZS5hdHRyKHtpZDogaWR9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpZCkge1xuICAgICAgICAgICAgICAgIHRwID0gdGhpcy50ZXh0UGF0aDtcbiAgICAgICAgICAgICAgICBub2RlID0gdGhpcy5ub2RlO1xuICAgICAgICAgICAgICAgIGlmICh0cCkge1xuICAgICAgICAgICAgICAgICAgICB0cC5hdHRyKHtcInhsaW5rOmhyZWZcIjogXCIjXCIgKyBpZH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRwID0gJChcInRleHRQYXRoXCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwieGxpbms6aHJlZlwiOiBcIiNcIiArIGlkXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAobm9kZS5maXJzdENoaWxkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cC5hcHBlbmRDaGlsZChub2RlLmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG5vZGUuYXBwZW5kQ2hpbGQodHApO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRleHRQYXRoID0gd3JhcCh0cCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSkoLTEpO1xuICAgIGV2ZS5vbihcInNuYXAudXRpbC5hdHRyLnRleHRcIiwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGlmICh0aGlzLnR5cGUgPT0gXCJ0ZXh0XCIpIHtcbiAgICAgICAgICAgIHZhciBpID0gMCxcbiAgICAgICAgICAgICAgICBub2RlID0gdGhpcy5ub2RlLFxuICAgICAgICAgICAgICAgIHR1bmVyID0gZnVuY3Rpb24gKGNodW5rKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBvdXQgPSAkKFwidHNwYW5cIik7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpcyhjaHVuaywgXCJhcnJheVwiKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaHVuay5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dC5hcHBlbmRDaGlsZCh0dW5lcihjaHVua1tpXSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0LmFwcGVuZENoaWxkKGdsb2IuZG9jLmNyZWF0ZVRleHROb2RlKGNodW5rKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgb3V0Lm5vcm1hbGl6ZSAmJiBvdXQubm9ybWFsaXplKCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvdXQ7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHdoaWxlIChub2RlLmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgICAgICAgICBub2RlLnJlbW92ZUNoaWxkKG5vZGUuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgdHVuZWQgPSB0dW5lcih2YWx1ZSk7XG4gICAgICAgICAgICB3aGlsZSAodHVuZWQuZmlyc3RDaGlsZCkge1xuICAgICAgICAgICAgICAgIG5vZGUuYXBwZW5kQ2hpbGQodHVuZWQuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZXZlLnN0b3AoKTtcbiAgICB9KSgtMSk7XG4gICAgZnVuY3Rpb24gc2V0Rm9udFNpemUodmFsdWUpIHtcbiAgICAgICAgZXZlLnN0b3AoKTtcbiAgICAgICAgaWYgKHZhbHVlID09ICt2YWx1ZSkge1xuICAgICAgICAgICAgdmFsdWUgKz0gXCJweFwiO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubm9kZS5zdHlsZS5mb250U2l6ZSA9IHZhbHVlO1xuICAgIH1cbiAgICBldmUub24oXCJzbmFwLnV0aWwuYXR0ci5mb250U2l6ZVwiLCBzZXRGb250U2l6ZSkoLTEpO1xuICAgIGV2ZS5vbihcInNuYXAudXRpbC5hdHRyLmZvbnQtc2l6ZVwiLCBzZXRGb250U2l6ZSkoLTEpO1xuXG5cbiAgICBldmUub24oXCJzbmFwLnV0aWwuZ2V0YXR0ci50cmFuc2Zvcm1cIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICBldmUuc3RvcCgpO1xuICAgICAgICByZXR1cm4gdGhpcy50cmFuc2Zvcm0oKTtcbiAgICB9KSgtMSk7XG4gICAgZXZlLm9uKFwic25hcC51dGlsLmdldGF0dHIudGV4dHBhdGhcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICBldmUuc3RvcCgpO1xuICAgICAgICByZXR1cm4gdGhpcy50ZXh0UGF0aDtcbiAgICB9KSgtMSk7XG4gICAgLy8gTWFya2Vyc1xuICAgIChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZ1bmN0aW9uIGdldHRlcihlbmQpIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgZXZlLnN0b3AoKTtcbiAgICAgICAgICAgICAgICB2YXIgc3R5bGUgPSBnbG9iLmRvYy5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKHRoaXMubm9kZSwgbnVsbCkuZ2V0UHJvcGVydHlWYWx1ZShcIm1hcmtlci1cIiArIGVuZCk7XG4gICAgICAgICAgICAgICAgaWYgKHN0eWxlID09IFwibm9uZVwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzdHlsZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gU25hcChnbG9iLmRvYy5nZXRFbGVtZW50QnlJZChzdHlsZS5tYXRjaChyZVVSTFZhbHVlKVsxXSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gc2V0dGVyKGVuZCkge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIGV2ZS5zdG9wKCk7XG4gICAgICAgICAgICAgICAgdmFyIG5hbWUgPSBcIm1hcmtlclwiICsgZW5kLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgZW5kLnN1YnN0cmluZygxKTtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gXCJcIiB8fCAhdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ub2RlLnN0eWxlW25hbWVdID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlLnR5cGUgPT0gXCJtYXJrZXJcIikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaWQgPSB2YWx1ZS5ub2RlLmlkO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKHZhbHVlLm5vZGUsIHtpZDogdmFsdWUuaWR9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5vZGUuc3R5bGVbbmFtZV0gPSBVUkwoaWQpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBldmUub24oXCJzbmFwLnV0aWwuZ2V0YXR0ci5tYXJrZXItZW5kXCIsIGdldHRlcihcImVuZFwiKSkoLTEpO1xuICAgICAgICBldmUub24oXCJzbmFwLnV0aWwuZ2V0YXR0ci5tYXJrZXJFbmRcIiwgZ2V0dGVyKFwiZW5kXCIpKSgtMSk7XG4gICAgICAgIGV2ZS5vbihcInNuYXAudXRpbC5nZXRhdHRyLm1hcmtlci1zdGFydFwiLCBnZXR0ZXIoXCJzdGFydFwiKSkoLTEpO1xuICAgICAgICBldmUub24oXCJzbmFwLnV0aWwuZ2V0YXR0ci5tYXJrZXJTdGFydFwiLCBnZXR0ZXIoXCJzdGFydFwiKSkoLTEpO1xuICAgICAgICBldmUub24oXCJzbmFwLnV0aWwuZ2V0YXR0ci5tYXJrZXItbWlkXCIsIGdldHRlcihcIm1pZFwiKSkoLTEpO1xuICAgICAgICBldmUub24oXCJzbmFwLnV0aWwuZ2V0YXR0ci5tYXJrZXJNaWRcIiwgZ2V0dGVyKFwibWlkXCIpKSgtMSk7XG4gICAgICAgIGV2ZS5vbihcInNuYXAudXRpbC5hdHRyLm1hcmtlci1lbmRcIiwgc2V0dGVyKFwiZW5kXCIpKSgtMSk7XG4gICAgICAgIGV2ZS5vbihcInNuYXAudXRpbC5hdHRyLm1hcmtlckVuZFwiLCBzZXR0ZXIoXCJlbmRcIikpKC0xKTtcbiAgICAgICAgZXZlLm9uKFwic25hcC51dGlsLmF0dHIubWFya2VyLXN0YXJ0XCIsIHNldHRlcihcInN0YXJ0XCIpKSgtMSk7XG4gICAgICAgIGV2ZS5vbihcInNuYXAudXRpbC5hdHRyLm1hcmtlclN0YXJ0XCIsIHNldHRlcihcInN0YXJ0XCIpKSgtMSk7XG4gICAgICAgIGV2ZS5vbihcInNuYXAudXRpbC5hdHRyLm1hcmtlci1taWRcIiwgc2V0dGVyKFwibWlkXCIpKSgtMSk7XG4gICAgICAgIGV2ZS5vbihcInNuYXAudXRpbC5hdHRyLm1hcmtlck1pZFwiLCBzZXR0ZXIoXCJtaWRcIikpKC0xKTtcbiAgICB9KCkpO1xuICAgIGV2ZS5vbihcInNuYXAudXRpbC5nZXRhdHRyLnJcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy50eXBlID09IFwicmVjdFwiICYmICQodGhpcy5ub2RlLCBcInJ4XCIpID09ICQodGhpcy5ub2RlLCBcInJ5XCIpKSB7XG4gICAgICAgICAgICBldmUuc3RvcCgpO1xuICAgICAgICAgICAgcmV0dXJuICQodGhpcy5ub2RlLCBcInJ4XCIpO1xuICAgICAgICB9XG4gICAgfSkoLTEpO1xuICAgIGZ1bmN0aW9uIHRleHRFeHRyYWN0KG5vZGUpIHtcbiAgICAgICAgdmFyIG91dCA9IFtdO1xuICAgICAgICB2YXIgY2hpbGRyZW4gPSBub2RlLmNoaWxkTm9kZXM7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IGNoaWxkcmVuLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBjaGkgPSBjaGlsZHJlbltpXTtcbiAgICAgICAgICAgIGlmIChjaGkubm9kZVR5cGUgPT0gMykge1xuICAgICAgICAgICAgICAgIG91dC5wdXNoKGNoaS5ub2RlVmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNoaS50YWdOYW1lID09IFwidHNwYW5cIikge1xuICAgICAgICAgICAgICAgIGlmIChjaGkuY2hpbGROb2Rlcy5sZW5ndGggPT0gMSAmJiBjaGkuZmlyc3RDaGlsZC5ub2RlVHlwZSA9PSAzKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dC5wdXNoKGNoaS5maXJzdENoaWxkLm5vZGVWYWx1ZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0LnB1c2godGV4dEV4dHJhY3QoY2hpKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfVxuICAgIGV2ZS5vbihcInNuYXAudXRpbC5nZXRhdHRyLnRleHRcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy50eXBlID09IFwidGV4dFwiIHx8IHRoaXMudHlwZSA9PSBcInRzcGFuXCIpIHtcbiAgICAgICAgICAgIGV2ZS5zdG9wKCk7XG4gICAgICAgICAgICB2YXIgb3V0ID0gdGV4dEV4dHJhY3QodGhpcy5ub2RlKTtcbiAgICAgICAgICAgIHJldHVybiBvdXQubGVuZ3RoID09IDEgPyBvdXRbMF0gOiBvdXQ7XG4gICAgICAgIH1cbiAgICB9KSgtMSk7XG4gICAgZXZlLm9uKFwic25hcC51dGlsLmdldGF0dHIuI3RleHRcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ub2RlLnRleHRDb250ZW50O1xuICAgIH0pKC0xKTtcbiAgICBldmUub24oXCJzbmFwLnV0aWwuZ2V0YXR0ci52aWV3Qm94XCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZXZlLnN0b3AoKTtcbiAgICAgICAgdmFyIHZiID0gJCh0aGlzLm5vZGUsIFwidmlld0JveFwiKTtcbiAgICAgICAgaWYgKHZiKSB7XG4gICAgICAgICAgICB2YiA9IHZiLnNwbGl0KHNlcGFyYXRvcik7XG4gICAgICAgICAgICByZXR1cm4gU25hcC5fLmJveCgrdmJbMF0sICt2YlsxXSwgK3ZiWzJdLCArdmJbM10pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfSkoLTEpO1xuICAgIGV2ZS5vbihcInNuYXAudXRpbC5nZXRhdHRyLnBvaW50c1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBwID0gJCh0aGlzLm5vZGUsIFwicG9pbnRzXCIpO1xuICAgICAgICBldmUuc3RvcCgpO1xuICAgICAgICBpZiAocCkge1xuICAgICAgICAgICAgcmV0dXJuIHAuc3BsaXQoc2VwYXJhdG9yKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH0pKC0xKTtcbiAgICBldmUub24oXCJzbmFwLnV0aWwuZ2V0YXR0ci5wYXRoXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHAgPSAkKHRoaXMubm9kZSwgXCJkXCIpO1xuICAgICAgICBldmUuc3RvcCgpO1xuICAgICAgICByZXR1cm4gcDtcbiAgICB9KSgtMSk7XG4gICAgZXZlLm9uKFwic25hcC51dGlsLmdldGF0dHIuY2xhc3NcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ub2RlLmNsYXNzTmFtZS5iYXNlVmFsO1xuICAgIH0pKC0xKTtcbiAgICBmdW5jdGlvbiBnZXRGb250U2l6ZSgpIHtcbiAgICAgICAgZXZlLnN0b3AoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMubm9kZS5zdHlsZS5mb250U2l6ZTtcbiAgICB9XG4gICAgZXZlLm9uKFwic25hcC51dGlsLmdldGF0dHIuZm9udFNpemVcIiwgZ2V0Rm9udFNpemUpKC0xKTtcbiAgICBldmUub24oXCJzbmFwLnV0aWwuZ2V0YXR0ci5mb250LXNpemVcIiwgZ2V0Rm9udFNpemUpKC0xKTtcbn0pO1xuXG4vLyBDb3B5cmlnaHQgKGMpIDIwMTQgQWRvYmUgU3lzdGVtcyBJbmNvcnBvcmF0ZWQuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5TbmFwLnBsdWdpbihmdW5jdGlvbiAoU25hcCwgRWxlbWVudCwgUGFwZXIsIGdsb2IsIEZyYWdtZW50KSB7XG4gICAgdmFyIHJnTm90U3BhY2UgPSAvXFxTKy9nLFxuICAgICAgICByZ0JhZFNwYWNlID0gL1tcXHRcXHJcXG5cXGZdL2csXG4gICAgICAgIHJnVHJpbSA9IC8oXlxccyt8XFxzKyQpL2csXG4gICAgICAgIFN0ciA9IFN0cmluZyxcbiAgICAgICAgZWxwcm90byA9IEVsZW1lbnQucHJvdG90eXBlO1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LmFkZENsYXNzXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBBZGRzIGdpdmVuIGNsYXNzIG5hbWUgb3IgbGlzdCBvZiBjbGFzcyBuYW1lcyB0byB0aGUgZWxlbWVudC5cbiAgICAgLSB2YWx1ZSAoc3RyaW5nKSBjbGFzcyBuYW1lIG9yIHNwYWNlIHNlcGFyYXRlZCBsaXN0IG9mIGNsYXNzIG5hbWVzXG4gICAgICoqXG4gICAgID0gKEVsZW1lbnQpIG9yaWdpbmFsIGVsZW1lbnQuXG4gICAgXFwqL1xuICAgIGVscHJvdG8uYWRkQ2xhc3MgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdmFyIGNsYXNzZXMgPSBTdHIodmFsdWUgfHwgXCJcIikubWF0Y2gocmdOb3RTcGFjZSkgfHwgW10sXG4gICAgICAgICAgICBlbGVtID0gdGhpcy5ub2RlLFxuICAgICAgICAgICAgY2xhc3NOYW1lID0gZWxlbS5jbGFzc05hbWUuYmFzZVZhbCxcbiAgICAgICAgICAgIGN1ckNsYXNzZXMgPSBjbGFzc05hbWUubWF0Y2gocmdOb3RTcGFjZSkgfHwgW10sXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgcG9zLFxuICAgICAgICAgICAgY2xhenosXG4gICAgICAgICAgICBmaW5hbFZhbHVlO1xuXG4gICAgICAgIGlmIChjbGFzc2VzLmxlbmd0aCkge1xuICAgICAgICAgICAgaiA9IDA7XG4gICAgICAgICAgICB3aGlsZSAoKGNsYXp6ID0gY2xhc3Nlc1tqKytdKSkge1xuICAgICAgICAgICAgICAgIHBvcyA9IGN1ckNsYXNzZXMuaW5kZXhPZihjbGF6eik7XG4gICAgICAgICAgICAgICAgaWYgKCF+cG9zKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1ckNsYXNzZXMucHVzaChjbGF6eik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmaW5hbFZhbHVlID0gY3VyQ2xhc3Nlcy5qb2luKFwiIFwiKTtcbiAgICAgICAgICAgIGlmIChjbGFzc05hbWUgIT0gZmluYWxWYWx1ZSkge1xuICAgICAgICAgICAgICAgIGVsZW0uY2xhc3NOYW1lLmJhc2VWYWwgPSBmaW5hbFZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQucmVtb3ZlQ2xhc3NcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgZ2l2ZW4gY2xhc3MgbmFtZSBvciBsaXN0IG9mIGNsYXNzIG5hbWVzIGZyb20gdGhlIGVsZW1lbnQuXG4gICAgIC0gdmFsdWUgKHN0cmluZykgY2xhc3MgbmFtZSBvciBzcGFjZSBzZXBhcmF0ZWQgbGlzdCBvZiBjbGFzcyBuYW1lc1xuICAgICAqKlxuICAgICA9IChFbGVtZW50KSBvcmlnaW5hbCBlbGVtZW50LlxuICAgIFxcKi9cbiAgICBlbHByb3RvLnJlbW92ZUNsYXNzID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHZhciBjbGFzc2VzID0gU3RyKHZhbHVlIHx8IFwiXCIpLm1hdGNoKHJnTm90U3BhY2UpIHx8IFtdLFxuICAgICAgICAgICAgZWxlbSA9IHRoaXMubm9kZSxcbiAgICAgICAgICAgIGNsYXNzTmFtZSA9IGVsZW0uY2xhc3NOYW1lLmJhc2VWYWwsXG4gICAgICAgICAgICBjdXJDbGFzc2VzID0gY2xhc3NOYW1lLm1hdGNoKHJnTm90U3BhY2UpIHx8IFtdLFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIHBvcyxcbiAgICAgICAgICAgIGNsYXp6LFxuICAgICAgICAgICAgZmluYWxWYWx1ZTtcbiAgICAgICAgaWYgKGN1ckNsYXNzZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICBqID0gMDtcbiAgICAgICAgICAgIHdoaWxlICgoY2xhenogPSBjbGFzc2VzW2orK10pKSB7XG4gICAgICAgICAgICAgICAgcG9zID0gY3VyQ2xhc3Nlcy5pbmRleE9mKGNsYXp6KTtcbiAgICAgICAgICAgICAgICBpZiAofnBvcykge1xuICAgICAgICAgICAgICAgICAgICBjdXJDbGFzc2VzLnNwbGljZShwb3MsIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZmluYWxWYWx1ZSA9IGN1ckNsYXNzZXMuam9pbihcIiBcIik7XG4gICAgICAgICAgICBpZiAoY2xhc3NOYW1lICE9IGZpbmFsVmFsdWUpIHtcbiAgICAgICAgICAgICAgICBlbGVtLmNsYXNzTmFtZS5iYXNlVmFsID0gZmluYWxWYWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50Lmhhc0NsYXNzXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBDaGVja3MgaWYgdGhlIGVsZW1lbnQgaGFzIGEgZ2l2ZW4gY2xhc3MgbmFtZSBpbiB0aGUgbGlzdCBvZiBjbGFzcyBuYW1lcyBhcHBsaWVkIHRvIGl0LlxuICAgICAtIHZhbHVlIChzdHJpbmcpIGNsYXNzIG5hbWVcbiAgICAgKipcbiAgICAgPSAoYm9vbGVhbikgYHRydWVgIGlmIHRoZSBlbGVtZW50IGhhcyBnaXZlbiBjbGFzc1xuICAgIFxcKi9cbiAgICBlbHByb3RvLmhhc0NsYXNzID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHZhciBlbGVtID0gdGhpcy5ub2RlLFxuICAgICAgICAgICAgY2xhc3NOYW1lID0gZWxlbS5jbGFzc05hbWUuYmFzZVZhbCxcbiAgICAgICAgICAgIGN1ckNsYXNzZXMgPSBjbGFzc05hbWUubWF0Y2gocmdOb3RTcGFjZSkgfHwgW107XG4gICAgICAgIHJldHVybiAhIX5jdXJDbGFzc2VzLmluZGV4T2YodmFsdWUpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudG9nZ2xlQ2xhc3NcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEFkZCBvciByZW1vdmUgb25lIG9yIG1vcmUgY2xhc3NlcyBmcm9tIHRoZSBlbGVtZW50LCBkZXBlbmRpbmcgb24gZWl0aGVyXG4gICAgICogdGhlIGNsYXNz4oCZcyBwcmVzZW5jZSBvciB0aGUgdmFsdWUgb2YgdGhlIGBmbGFnYCBhcmd1bWVudC5cbiAgICAgLSB2YWx1ZSAoc3RyaW5nKSBjbGFzcyBuYW1lIG9yIHNwYWNlIHNlcGFyYXRlZCBsaXN0IG9mIGNsYXNzIG5hbWVzXG4gICAgIC0gZmxhZyAoYm9vbGVhbikgdmFsdWUgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhlIGNsYXNzIHNob3VsZCBiZSBhZGRlZCBvciByZW1vdmVkXG4gICAgICoqXG4gICAgID0gKEVsZW1lbnQpIG9yaWdpbmFsIGVsZW1lbnQuXG4gICAgXFwqL1xuICAgIGVscHJvdG8udG9nZ2xlQ2xhc3MgPSBmdW5jdGlvbiAodmFsdWUsIGZsYWcpIHtcbiAgICAgICAgaWYgKGZsYWcgIT0gbnVsbCkge1xuICAgICAgICAgICAgaWYgKGZsYWcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5hZGRDbGFzcyh2YWx1ZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnJlbW92ZUNsYXNzKHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgY2xhc3NlcyA9ICh2YWx1ZSB8fCBcIlwiKS5tYXRjaChyZ05vdFNwYWNlKSB8fCBbXSxcbiAgICAgICAgICAgIGVsZW0gPSB0aGlzLm5vZGUsXG4gICAgICAgICAgICBjbGFzc05hbWUgPSBlbGVtLmNsYXNzTmFtZS5iYXNlVmFsLFxuICAgICAgICAgICAgY3VyQ2xhc3NlcyA9IGNsYXNzTmFtZS5tYXRjaChyZ05vdFNwYWNlKSB8fCBbXSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBwb3MsXG4gICAgICAgICAgICBjbGF6eixcbiAgICAgICAgICAgIGZpbmFsVmFsdWU7XG4gICAgICAgIGogPSAwO1xuICAgICAgICB3aGlsZSAoKGNsYXp6ID0gY2xhc3Nlc1tqKytdKSkge1xuICAgICAgICAgICAgcG9zID0gY3VyQ2xhc3Nlcy5pbmRleE9mKGNsYXp6KTtcbiAgICAgICAgICAgIGlmICh+cG9zKSB7XG4gICAgICAgICAgICAgICAgY3VyQ2xhc3Nlcy5zcGxpY2UocG9zLCAxKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY3VyQ2xhc3Nlcy5wdXNoKGNsYXp6KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZpbmFsVmFsdWUgPSBjdXJDbGFzc2VzLmpvaW4oXCIgXCIpO1xuICAgICAgICBpZiAoY2xhc3NOYW1lICE9IGZpbmFsVmFsdWUpIHtcbiAgICAgICAgICAgIGVsZW0uY2xhc3NOYW1lLmJhc2VWYWwgPSBmaW5hbFZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG59KTtcblxuLy8gQ29weXJpZ2h0IChjKSAyMDEzIEFkb2JlIFN5c3RlbXMgSW5jb3Jwb3JhdGVkLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vLyBcbi8vIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy8gXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuU25hcC5wbHVnaW4oZnVuY3Rpb24gKFNuYXAsIEVsZW1lbnQsIFBhcGVyLCBnbG9iLCBGcmFnbWVudCkge1xuICAgIHZhciBvcGVyYXRvcnMgPSB7XG4gICAgICAgICAgICBcIitcIjogZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHggKyB5O1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIi1cIjogZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHggLSB5O1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIi9cIjogZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHggLyB5O1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcIipcIjogZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHggKiB5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgU3RyID0gU3RyaW5nLFxuICAgICAgICByZVVuaXQgPSAvW2Etel0rJC9pLFxuICAgICAgICByZUFkZG9uID0gL15cXHMqKFsrXFwtXFwvKl0pXFxzKj1cXHMqKFtcXGQuZUUrXFwtXSspXFxzKihbXlxcZFxcc10rKT9cXHMqJC87XG4gICAgZnVuY3Rpb24gZ2V0TnVtYmVyKHZhbCkge1xuICAgICAgICByZXR1cm4gdmFsO1xuICAgIH1cbiAgICBmdW5jdGlvbiBnZXRVbml0KHVuaXQpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgICAgIHJldHVybiArdmFsLnRvRml4ZWQoMykgKyB1bml0O1xuICAgICAgICB9O1xuICAgIH1cbiAgICBldmUub24oXCJzbmFwLnV0aWwuYXR0clwiLCBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgIHZhciBwbHVzID0gU3RyKHZhbCkubWF0Y2gocmVBZGRvbik7XG4gICAgICAgIGlmIChwbHVzKSB7XG4gICAgICAgICAgICB2YXIgZXZudCA9IGV2ZS5udCgpLFxuICAgICAgICAgICAgICAgIG5hbWUgPSBldm50LnN1YnN0cmluZyhldm50Lmxhc3RJbmRleE9mKFwiLlwiKSArIDEpLFxuICAgICAgICAgICAgICAgIGEgPSB0aGlzLmF0dHIobmFtZSksXG4gICAgICAgICAgICAgICAgYXRyID0ge307XG4gICAgICAgICAgICBldmUuc3RvcCgpO1xuICAgICAgICAgICAgdmFyIHVuaXQgPSBwbHVzWzNdIHx8IFwiXCIsXG4gICAgICAgICAgICAgICAgYVVuaXQgPSBhLm1hdGNoKHJlVW5pdCksXG4gICAgICAgICAgICAgICAgb3AgPSBvcGVyYXRvcnNbcGx1c1sxXV07XG4gICAgICAgICAgICBpZiAoYVVuaXQgJiYgYVVuaXQgPT0gdW5pdCkge1xuICAgICAgICAgICAgICAgIHZhbCA9IG9wKHBhcnNlRmxvYXQoYSksICtwbHVzWzJdKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYSA9IHRoaXMuYXNQWChuYW1lKTtcbiAgICAgICAgICAgICAgICB2YWwgPSBvcCh0aGlzLmFzUFgobmFtZSksIHRoaXMuYXNQWChuYW1lLCBwbHVzWzJdICsgdW5pdCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlzTmFOKGEpIHx8IGlzTmFOKHZhbCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhdHJbbmFtZV0gPSB2YWw7XG4gICAgICAgICAgICB0aGlzLmF0dHIoYXRyKTtcbiAgICAgICAgfVxuICAgIH0pKC0xMCk7XG4gICAgZXZlLm9uKFwic25hcC51dGlsLmVxdWFsXCIsIGZ1bmN0aW9uIChuYW1lLCBiKSB7XG4gICAgICAgIHZhciBBLCBCLCBhID0gU3RyKHRoaXMuYXR0cihuYW1lKSB8fCBcIlwiKSxcbiAgICAgICAgICAgIGVsID0gdGhpcyxcbiAgICAgICAgICAgIGJwbHVzID0gU3RyKGIpLm1hdGNoKHJlQWRkb24pO1xuICAgICAgICBpZiAoYnBsdXMpIHtcbiAgICAgICAgICAgIGV2ZS5zdG9wKCk7XG4gICAgICAgICAgICB2YXIgdW5pdCA9IGJwbHVzWzNdIHx8IFwiXCIsXG4gICAgICAgICAgICAgICAgYVVuaXQgPSBhLm1hdGNoKHJlVW5pdCksXG4gICAgICAgICAgICAgICAgb3AgPSBvcGVyYXRvcnNbYnBsdXNbMV1dO1xuICAgICAgICAgICAgaWYgKGFVbml0ICYmIGFVbml0ID09IHVuaXQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBmcm9tOiBwYXJzZUZsb2F0KGEpLFxuICAgICAgICAgICAgICAgICAgICB0bzogb3AocGFyc2VGbG9hdChhKSwgK2JwbHVzWzJdKSxcbiAgICAgICAgICAgICAgICAgICAgZjogZ2V0VW5pdChhVW5pdClcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhID0gdGhpcy5hc1BYKG5hbWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIGZyb206IGEsXG4gICAgICAgICAgICAgICAgICAgIHRvOiBvcChhLCB0aGlzLmFzUFgobmFtZSwgYnBsdXNbMl0gKyB1bml0KSksXG4gICAgICAgICAgICAgICAgICAgIGY6IGdldE51bWJlclxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KSgtMTApO1xufSk7XG4vLyBDb3B5cmlnaHQgKGMpIDIwMTMgQWRvYmUgU3lzdGVtcyBJbmNvcnBvcmF0ZWQuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBcbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vIFxuLy8gaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vLyBcbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5TbmFwLnBsdWdpbihmdW5jdGlvbiAoU25hcCwgRWxlbWVudCwgUGFwZXIsIGdsb2IsIEZyYWdtZW50KSB7XG4gICAgdmFyIHByb3RvID0gUGFwZXIucHJvdG90eXBlLFxuICAgICAgICBpcyA9IFNuYXAuaXM7XG4gICAgLypcXFxuICAgICAqIFBhcGVyLnJlY3RcbiAgICAgWyBtZXRob2QgXVxuICAgICAqXG4gICAgICogRHJhd3MgYSByZWN0YW5nbGVcbiAgICAgKipcbiAgICAgLSB4IChudW1iZXIpIHggY29vcmRpbmF0ZSBvZiB0aGUgdG9wIGxlZnQgY29ybmVyXG4gICAgIC0geSAobnVtYmVyKSB5IGNvb3JkaW5hdGUgb2YgdGhlIHRvcCBsZWZ0IGNvcm5lclxuICAgICAtIHdpZHRoIChudW1iZXIpIHdpZHRoXG4gICAgIC0gaGVpZ2h0IChudW1iZXIpIGhlaWdodFxuICAgICAtIHJ4IChudW1iZXIpICNvcHRpb25hbCBob3Jpem9udGFsIHJhZGl1cyBmb3Igcm91bmRlZCBjb3JuZXJzLCBkZWZhdWx0IGlzIDBcbiAgICAgLSByeSAobnVtYmVyKSAjb3B0aW9uYWwgdmVydGljYWwgcmFkaXVzIGZvciByb3VuZGVkIGNvcm5lcnMsIGRlZmF1bHQgaXMgcnggb3IgMFxuICAgICA9IChvYmplY3QpIHRoZSBgcmVjdGAgZWxlbWVudFxuICAgICAqKlxuICAgICA+IFVzYWdlXG4gICAgIHwgLy8gcmVndWxhciByZWN0YW5nbGVcbiAgICAgfCB2YXIgYyA9IHBhcGVyLnJlY3QoMTAsIDEwLCA1MCwgNTApO1xuICAgICB8IC8vIHJlY3RhbmdsZSB3aXRoIHJvdW5kZWQgY29ybmVyc1xuICAgICB8IHZhciBjID0gcGFwZXIucmVjdCg0MCwgNDAsIDUwLCA1MCwgMTApO1xuICAgIFxcKi9cbiAgICBwcm90by5yZWN0ID0gZnVuY3Rpb24gKHgsIHksIHcsIGgsIHJ4LCByeSkge1xuICAgICAgICB2YXIgYXR0cjtcbiAgICAgICAgaWYgKHJ5ID09IG51bGwpIHtcbiAgICAgICAgICAgIHJ5ID0gcng7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzKHgsIFwib2JqZWN0XCIpICYmIHggPT0gXCJbb2JqZWN0IE9iamVjdF1cIikge1xuICAgICAgICAgICAgYXR0ciA9IHg7XG4gICAgICAgIH0gZWxzZSBpZiAoeCAhPSBudWxsKSB7XG4gICAgICAgICAgICBhdHRyID0ge1xuICAgICAgICAgICAgICAgIHg6IHgsXG4gICAgICAgICAgICAgICAgeTogeSxcbiAgICAgICAgICAgICAgICB3aWR0aDogdyxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IGhcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAocnggIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGF0dHIucnggPSByeDtcbiAgICAgICAgICAgICAgICBhdHRyLnJ5ID0gcnk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuZWwoXCJyZWN0XCIsIGF0dHIpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFBhcGVyLmNpcmNsZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogRHJhd3MgYSBjaXJjbGVcbiAgICAgKipcbiAgICAgLSB4IChudW1iZXIpIHggY29vcmRpbmF0ZSBvZiB0aGUgY2VudHJlXG4gICAgIC0geSAobnVtYmVyKSB5IGNvb3JkaW5hdGUgb2YgdGhlIGNlbnRyZVxuICAgICAtIHIgKG51bWJlcikgcmFkaXVzXG4gICAgID0gKG9iamVjdCkgdGhlIGBjaXJjbGVgIGVsZW1lbnRcbiAgICAgKipcbiAgICAgPiBVc2FnZVxuICAgICB8IHZhciBjID0gcGFwZXIuY2lyY2xlKDUwLCA1MCwgNDApO1xuICAgIFxcKi9cbiAgICBwcm90by5jaXJjbGUgPSBmdW5jdGlvbiAoY3gsIGN5LCByKSB7XG4gICAgICAgIHZhciBhdHRyO1xuICAgICAgICBpZiAoaXMoY3gsIFwib2JqZWN0XCIpICYmIGN4ID09IFwiW29iamVjdCBPYmplY3RdXCIpIHtcbiAgICAgICAgICAgIGF0dHIgPSBjeDtcbiAgICAgICAgfSBlbHNlIGlmIChjeCAhPSBudWxsKSB7XG4gICAgICAgICAgICBhdHRyID0ge1xuICAgICAgICAgICAgICAgIGN4OiBjeCxcbiAgICAgICAgICAgICAgICBjeTogY3ksXG4gICAgICAgICAgICAgICAgcjogclxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5lbChcImNpcmNsZVwiLCBhdHRyKTtcbiAgICB9O1xuXG4gICAgdmFyIHByZWxvYWQgPSAoZnVuY3Rpb24gKCkge1xuICAgICAgICBmdW5jdGlvbiBvbmVycm9yKCkge1xuICAgICAgICAgICAgdGhpcy5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoc3JjLCBmKSB7XG4gICAgICAgICAgICB2YXIgaW1nID0gZ2xvYi5kb2MuY3JlYXRlRWxlbWVudChcImltZ1wiKSxcbiAgICAgICAgICAgICAgICBib2R5ID0gZ2xvYi5kb2MuYm9keTtcbiAgICAgICAgICAgIGltZy5zdHlsZS5jc3NUZXh0ID0gXCJwb3NpdGlvbjphYnNvbHV0ZTtsZWZ0Oi05OTk5ZW07dG9wOi05OTk5ZW1cIjtcbiAgICAgICAgICAgIGltZy5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgZi5jYWxsKGltZyk7XG4gICAgICAgICAgICAgICAgaW1nLm9ubG9hZCA9IGltZy5vbmVycm9yID0gbnVsbDtcbiAgICAgICAgICAgICAgICBib2R5LnJlbW92ZUNoaWxkKGltZyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaW1nLm9uZXJyb3IgPSBvbmVycm9yO1xuICAgICAgICAgICAgYm9keS5hcHBlbmRDaGlsZChpbWcpO1xuICAgICAgICAgICAgaW1nLnNyYyA9IHNyYztcbiAgICAgICAgfTtcbiAgICB9KCkpO1xuXG4gICAgLypcXFxuICAgICAqIFBhcGVyLmltYWdlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBQbGFjZXMgYW4gaW1hZ2Ugb24gdGhlIHN1cmZhY2VcbiAgICAgKipcbiAgICAgLSBzcmMgKHN0cmluZykgVVJJIG9mIHRoZSBzb3VyY2UgaW1hZ2VcbiAgICAgLSB4IChudW1iZXIpIHggb2Zmc2V0IHBvc2l0aW9uXG4gICAgIC0geSAobnVtYmVyKSB5IG9mZnNldCBwb3NpdGlvblxuICAgICAtIHdpZHRoIChudW1iZXIpIHdpZHRoIG9mIHRoZSBpbWFnZVxuICAgICAtIGhlaWdodCAobnVtYmVyKSBoZWlnaHQgb2YgdGhlIGltYWdlXG4gICAgID0gKG9iamVjdCkgdGhlIGBpbWFnZWAgZWxlbWVudFxuICAgICAqIG9yXG4gICAgID0gKG9iamVjdCkgU25hcCBlbGVtZW50IG9iamVjdCB3aXRoIHR5cGUgYGltYWdlYFxuICAgICAqKlxuICAgICA+IFVzYWdlXG4gICAgIHwgdmFyIGMgPSBwYXBlci5pbWFnZShcImFwcGxlLnBuZ1wiLCAxMCwgMTAsIDgwLCA4MCk7XG4gICAgXFwqL1xuICAgIHByb3RvLmltYWdlID0gZnVuY3Rpb24gKHNyYywgeCwgeSwgd2lkdGgsIGhlaWdodCkge1xuICAgICAgICB2YXIgZWwgPSB0aGlzLmVsKFwiaW1hZ2VcIik7XG4gICAgICAgIGlmIChpcyhzcmMsIFwib2JqZWN0XCIpICYmIFwic3JjXCIgaW4gc3JjKSB7XG4gICAgICAgICAgICBlbC5hdHRyKHNyYyk7XG4gICAgICAgIH0gZWxzZSBpZiAoc3JjICE9IG51bGwpIHtcbiAgICAgICAgICAgIHZhciBzZXQgPSB7XG4gICAgICAgICAgICAgICAgXCJ4bGluazpocmVmXCI6IHNyYyxcbiAgICAgICAgICAgICAgICBwcmVzZXJ2ZUFzcGVjdFJhdGlvOiBcIm5vbmVcIlxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmICh4ICE9IG51bGwgJiYgeSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgc2V0LnggPSB4O1xuICAgICAgICAgICAgICAgIHNldC55ID0geTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh3aWR0aCAhPSBudWxsICYmIGhlaWdodCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgc2V0LndpZHRoID0gd2lkdGg7XG4gICAgICAgICAgICAgICAgc2V0LmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcHJlbG9hZChzcmMsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgU25hcC5fLiQoZWwubm9kZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IHRoaXMub2Zmc2V0V2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHRoaXMub2Zmc2V0SGVpZ2h0XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgU25hcC5fLiQoZWwubm9kZSwgc2V0KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZWw7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUGFwZXIuZWxsaXBzZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogRHJhd3MgYW4gZWxsaXBzZVxuICAgICAqKlxuICAgICAtIHggKG51bWJlcikgeCBjb29yZGluYXRlIG9mIHRoZSBjZW50cmVcbiAgICAgLSB5IChudW1iZXIpIHkgY29vcmRpbmF0ZSBvZiB0aGUgY2VudHJlXG4gICAgIC0gcnggKG51bWJlcikgaG9yaXpvbnRhbCByYWRpdXNcbiAgICAgLSByeSAobnVtYmVyKSB2ZXJ0aWNhbCByYWRpdXNcbiAgICAgPSAob2JqZWN0KSB0aGUgYGVsbGlwc2VgIGVsZW1lbnRcbiAgICAgKipcbiAgICAgPiBVc2FnZVxuICAgICB8IHZhciBjID0gcGFwZXIuZWxsaXBzZSg1MCwgNTAsIDQwLCAyMCk7XG4gICAgXFwqL1xuICAgIHByb3RvLmVsbGlwc2UgPSBmdW5jdGlvbiAoY3gsIGN5LCByeCwgcnkpIHtcbiAgICAgICAgdmFyIGF0dHI7XG4gICAgICAgIGlmIChpcyhjeCwgXCJvYmplY3RcIikgJiYgY3ggPT0gXCJbb2JqZWN0IE9iamVjdF1cIikge1xuICAgICAgICAgICAgYXR0ciA9IGN4O1xuICAgICAgICB9IGVsc2UgaWYgKGN4ICE9IG51bGwpIHtcbiAgICAgICAgICAgIGF0dHIgPXtcbiAgICAgICAgICAgICAgICBjeDogY3gsXG4gICAgICAgICAgICAgICAgY3k6IGN5LFxuICAgICAgICAgICAgICAgIHJ4OiByeCxcbiAgICAgICAgICAgICAgICByeTogcnlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuZWwoXCJlbGxpcHNlXCIsIGF0dHIpO1xuICAgIH07XG4gICAgLy8gU0lFUlJBIFBhcGVyLnBhdGgoKTogVW5jbGVhciBmcm9tIHRoZSBsaW5rIHdoYXQgYSBDYXRtdWxsLVJvbSBjdXJ2ZXRvIGlzLCBhbmQgd2h5IGl0IHdvdWxkIG1ha2UgbGlmZSBhbnkgZWFzaWVyLlxuICAgIC8qXFxcbiAgICAgKiBQYXBlci5wYXRoXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBDcmVhdGVzIGEgYDxwYXRoPmAgZWxlbWVudCB1c2luZyB0aGUgZ2l2ZW4gc3RyaW5nIGFzIHRoZSBwYXRoJ3MgZGVmaW5pdGlvblxuICAgICAtIHBhdGhTdHJpbmcgKHN0cmluZykgI29wdGlvbmFsIHBhdGggc3RyaW5nIGluIFNWRyBmb3JtYXRcbiAgICAgKiBQYXRoIHN0cmluZyBjb25zaXN0cyBvZiBvbmUtbGV0dGVyIGNvbW1hbmRzLCBmb2xsb3dlZCBieSBjb21tYSBzZXByYXJhdGVkIGFyZ3VtZW50cyBpbiBudW1lcmljYWwgZm9ybS4gRXhhbXBsZTpcbiAgICAgfCBcIk0xMCwyMEwzMCw0MFwiXG4gICAgICogVGhpcyBleGFtcGxlIGZlYXR1cmVzIHR3byBjb21tYW5kczogYE1gLCB3aXRoIGFyZ3VtZW50cyBgKDEwLCAyMClgIGFuZCBgTGAgd2l0aCBhcmd1bWVudHMgYCgzMCwgNDApYC4gVXBwZXJjYXNlIGxldHRlciBjb21tYW5kcyBleHByZXNzIGNvb3JkaW5hdGVzIGluIGFic29sdXRlIHRlcm1zLCB3aGlsZSBsb3dlcmNhc2UgY29tbWFuZHMgZXhwcmVzcyB0aGVtIGluIHJlbGF0aXZlIHRlcm1zIGZyb20gdGhlIG1vc3QgcmVjZW50bHkgZGVjbGFyZWQgY29vcmRpbmF0ZXMuXG4gICAgICpcbiAgICAgIyA8cD5IZXJlIGlzIHNob3J0IGxpc3Qgb2YgY29tbWFuZHMgYXZhaWxhYmxlLCBmb3IgbW9yZSBkZXRhaWxzIHNlZSA8YSBocmVmPVwiaHR0cDovL3d3dy53My5vcmcvVFIvU1ZHL3BhdGhzLmh0bWwjUGF0aERhdGFcIiB0aXRsZT1cIkRldGFpbHMgb2YgYSBwYXRoJ3MgZGF0YSBhdHRyaWJ1dGUncyBmb3JtYXQgYXJlIGRlc2NyaWJlZCBpbiB0aGUgU1ZHIHNwZWNpZmljYXRpb24uXCI+U1ZHIHBhdGggc3RyaW5nIGZvcm1hdDwvYT4gb3IgPGEgaHJlZj1cImh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL1NWRy9UdXRvcmlhbC9QYXRoc1wiPmFydGljbGUgYWJvdXQgcGF0aCBzdHJpbmdzIGF0IE1ETjwvYT4uPC9wPlxuICAgICAjIDx0YWJsZT48dGhlYWQ+PHRyPjx0aD5Db21tYW5kPC90aD48dGg+TmFtZTwvdGg+PHRoPlBhcmFtZXRlcnM8L3RoPjwvdHI+PC90aGVhZD48dGJvZHk+XG4gICAgICMgPHRyPjx0ZD5NPC90ZD48dGQ+bW92ZXRvPC90ZD48dGQ+KHggeSkrPC90ZD48L3RyPlxuICAgICAjIDx0cj48dGQ+WjwvdGQ+PHRkPmNsb3NlcGF0aDwvdGQ+PHRkPihub25lKTwvdGQ+PC90cj5cbiAgICAgIyA8dHI+PHRkPkw8L3RkPjx0ZD5saW5ldG88L3RkPjx0ZD4oeCB5KSs8L3RkPjwvdHI+XG4gICAgICMgPHRyPjx0ZD5IPC90ZD48dGQ+aG9yaXpvbnRhbCBsaW5ldG88L3RkPjx0ZD54KzwvdGQ+PC90cj5cbiAgICAgIyA8dHI+PHRkPlY8L3RkPjx0ZD52ZXJ0aWNhbCBsaW5ldG88L3RkPjx0ZD55KzwvdGQ+PC90cj5cbiAgICAgIyA8dHI+PHRkPkM8L3RkPjx0ZD5jdXJ2ZXRvPC90ZD48dGQ+KHgxIHkxIHgyIHkyIHggeSkrPC90ZD48L3RyPlxuICAgICAjIDx0cj48dGQ+UzwvdGQ+PHRkPnNtb290aCBjdXJ2ZXRvPC90ZD48dGQ+KHgyIHkyIHggeSkrPC90ZD48L3RyPlxuICAgICAjIDx0cj48dGQ+UTwvdGQ+PHRkPnF1YWRyYXRpYyBCw6l6aWVyIGN1cnZldG88L3RkPjx0ZD4oeDEgeTEgeCB5KSs8L3RkPjwvdHI+XG4gICAgICMgPHRyPjx0ZD5UPC90ZD48dGQ+c21vb3RoIHF1YWRyYXRpYyBCw6l6aWVyIGN1cnZldG88L3RkPjx0ZD4oeCB5KSs8L3RkPjwvdHI+XG4gICAgICMgPHRyPjx0ZD5BPC90ZD48dGQ+ZWxsaXB0aWNhbCBhcmM8L3RkPjx0ZD4ocnggcnkgeC1heGlzLXJvdGF0aW9uIGxhcmdlLWFyYy1mbGFnIHN3ZWVwLWZsYWcgeCB5KSs8L3RkPjwvdHI+XG4gICAgICMgPHRyPjx0ZD5SPC90ZD48dGQ+PGEgaHJlZj1cImh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQ2F0bXVsbOKAk1JvbV9zcGxpbmUjQ2F0bXVsbC5FMi44MC45M1JvbV9zcGxpbmVcIj5DYXRtdWxsLVJvbSBjdXJ2ZXRvPC9hPio8L3RkPjx0ZD54MSB5MSAoeCB5KSs8L3RkPjwvdHI+PC90Ym9keT48L3RhYmxlPlxuICAgICAqICogX0NhdG11bGwtUm9tIGN1cnZldG9fIGlzIGEgbm90IHN0YW5kYXJkIFNWRyBjb21tYW5kIGFuZCBhZGRlZCB0byBtYWtlIGxpZmUgZWFzaWVyLlxuICAgICAqIE5vdGU6IHRoZXJlIGlzIGEgc3BlY2lhbCBjYXNlIHdoZW4gYSBwYXRoIGNvbnNpc3RzIG9mIG9ubHkgdGhyZWUgY29tbWFuZHM6IGBNMTAsMTBS4oCmemAuIEluIHRoaXMgY2FzZSB0aGUgcGF0aCBjb25uZWN0cyBiYWNrIHRvIGl0cyBzdGFydGluZyBwb2ludC5cbiAgICAgPiBVc2FnZVxuICAgICB8IHZhciBjID0gcGFwZXIucGF0aChcIk0xMCAxMEw5MCA5MFwiKTtcbiAgICAgfCAvLyBkcmF3IGEgZGlhZ29uYWwgbGluZTpcbiAgICAgfCAvLyBtb3ZlIHRvIDEwLDEwLCBsaW5lIHRvIDkwLDkwXG4gICAgXFwqL1xuICAgIHByb3RvLnBhdGggPSBmdW5jdGlvbiAoZCkge1xuICAgICAgICB2YXIgYXR0cjtcbiAgICAgICAgaWYgKGlzKGQsIFwib2JqZWN0XCIpICYmICFpcyhkLCBcImFycmF5XCIpKSB7XG4gICAgICAgICAgICBhdHRyID0gZDtcbiAgICAgICAgfSBlbHNlIGlmIChkKSB7XG4gICAgICAgICAgICBhdHRyID0ge2Q6IGR9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmVsKFwicGF0aFwiLCBhdHRyKTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBQYXBlci5nXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBDcmVhdGVzIGEgZ3JvdXAgZWxlbWVudFxuICAgICAqKlxuICAgICAtIHZhcmFyZ3MgKOKApikgI29wdGlvbmFsIGVsZW1lbnRzIHRvIG5lc3Qgd2l0aGluIHRoZSBncm91cFxuICAgICA9IChvYmplY3QpIHRoZSBgZ2AgZWxlbWVudFxuICAgICAqKlxuICAgICA+IFVzYWdlXG4gICAgIHwgdmFyIGMxID0gcGFwZXIuY2lyY2xlKCksXG4gICAgIHwgICAgIGMyID0gcGFwZXIucmVjdCgpLFxuICAgICB8ICAgICBnID0gcGFwZXIuZyhjMiwgYzEpOyAvLyBub3RlIHRoYXQgdGhlIG9yZGVyIG9mIGVsZW1lbnRzIGlzIGRpZmZlcmVudFxuICAgICAqIG9yXG4gICAgIHwgdmFyIGMxID0gcGFwZXIuY2lyY2xlKCksXG4gICAgIHwgICAgIGMyID0gcGFwZXIucmVjdCgpLFxuICAgICB8ICAgICBnID0gcGFwZXIuZygpO1xuICAgICB8IGcuYWRkKGMyLCBjMSk7XG4gICAgXFwqL1xuICAgIC8qXFxcbiAgICAgKiBQYXBlci5ncm91cFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogU2VlIEBQYXBlci5nXG4gICAgXFwqL1xuICAgIHByb3RvLmdyb3VwID0gcHJvdG8uZyA9IGZ1bmN0aW9uIChmaXJzdCkge1xuICAgICAgICB2YXIgYXR0cixcbiAgICAgICAgICAgIGVsID0gdGhpcy5lbChcImdcIik7XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09IDEgJiYgZmlyc3QgJiYgIWZpcnN0LnR5cGUpIHtcbiAgICAgICAgICAgIGVsLmF0dHIoZmlyc3QpO1xuICAgICAgICB9IGVsc2UgaWYgKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGVsLmFkZChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZWw7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUGFwZXIuc3ZnXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBDcmVhdGVzIGEgbmVzdGVkIFNWRyBlbGVtZW50LlxuICAgICAtIHggKG51bWJlcikgQG9wdGlvbmFsIFggb2YgdGhlIGVsZW1lbnRcbiAgICAgLSB5IChudW1iZXIpIEBvcHRpb25hbCBZIG9mIHRoZSBlbGVtZW50XG4gICAgIC0gd2lkdGggKG51bWJlcikgQG9wdGlvbmFsIHdpZHRoIG9mIHRoZSBlbGVtZW50XG4gICAgIC0gaGVpZ2h0IChudW1iZXIpIEBvcHRpb25hbCBoZWlnaHQgb2YgdGhlIGVsZW1lbnRcbiAgICAgLSB2YnggKG51bWJlcikgQG9wdGlvbmFsIHZpZXdib3ggWFxuICAgICAtIHZieSAobnVtYmVyKSBAb3B0aW9uYWwgdmlld2JveCBZXG4gICAgIC0gdmJ3IChudW1iZXIpIEBvcHRpb25hbCB2aWV3Ym94IHdpZHRoXG4gICAgIC0gdmJoIChudW1iZXIpIEBvcHRpb25hbCB2aWV3Ym94IGhlaWdodFxuICAgICAqKlxuICAgICA9IChvYmplY3QpIHRoZSBgc3ZnYCBlbGVtZW50XG4gICAgICoqXG4gICAgXFwqL1xuICAgIHByb3RvLnN2ZyA9IGZ1bmN0aW9uICh4LCB5LCB3aWR0aCwgaGVpZ2h0LCB2YngsIHZieSwgdmJ3LCB2YmgpIHtcbiAgICAgICAgdmFyIGF0dHJzID0ge307XG4gICAgICAgIGlmIChpcyh4LCBcIm9iamVjdFwiKSAmJiB5ID09IG51bGwpIHtcbiAgICAgICAgICAgIGF0dHJzID0geDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICh4ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBhdHRycy54ID0geDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh5ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBhdHRycy55ID0geTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh3aWR0aCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgYXR0cnMud2lkdGggPSB3aWR0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChoZWlnaHQgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGF0dHJzLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh2YnggIT0gbnVsbCAmJiB2YnkgIT0gbnVsbCAmJiB2YncgIT0gbnVsbCAmJiB2YmggIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGF0dHJzLnZpZXdCb3ggPSBbdmJ4LCB2YnksIHZidywgdmJoXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5lbChcInN2Z1wiLCBhdHRycyk7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUGFwZXIubWFza1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogRXF1aXZhbGVudCBpbiBiZWhhdmlvdXIgdG8gQFBhcGVyLmcsIGV4Y2VwdCBpdOKAmXMgYSBtYXNrLlxuICAgICAqKlxuICAgICA9IChvYmplY3QpIHRoZSBgbWFza2AgZWxlbWVudFxuICAgICAqKlxuICAgIFxcKi9cbiAgICBwcm90by5tYXNrID0gZnVuY3Rpb24gKGZpcnN0KSB7XG4gICAgICAgIHZhciBhdHRyLFxuICAgICAgICAgICAgZWwgPSB0aGlzLmVsKFwibWFza1wiKTtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT0gMSAmJiBmaXJzdCAmJiAhZmlyc3QudHlwZSkge1xuICAgICAgICAgICAgZWwuYXR0cihmaXJzdCk7XG4gICAgICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgZWwuYWRkKEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBlbDtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBQYXBlci5wdHJuXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBFcXVpdmFsZW50IGluIGJlaGF2aW91ciB0byBAUGFwZXIuZywgZXhjZXB0IGl04oCZcyBhIHBhdHRlcm4uXG4gICAgIC0geCAobnVtYmVyKSBAb3B0aW9uYWwgWCBvZiB0aGUgZWxlbWVudFxuICAgICAtIHkgKG51bWJlcikgQG9wdGlvbmFsIFkgb2YgdGhlIGVsZW1lbnRcbiAgICAgLSB3aWR0aCAobnVtYmVyKSBAb3B0aW9uYWwgd2lkdGggb2YgdGhlIGVsZW1lbnRcbiAgICAgLSBoZWlnaHQgKG51bWJlcikgQG9wdGlvbmFsIGhlaWdodCBvZiB0aGUgZWxlbWVudFxuICAgICAtIHZieCAobnVtYmVyKSBAb3B0aW9uYWwgdmlld2JveCBYXG4gICAgIC0gdmJ5IChudW1iZXIpIEBvcHRpb25hbCB2aWV3Ym94IFlcbiAgICAgLSB2YncgKG51bWJlcikgQG9wdGlvbmFsIHZpZXdib3ggd2lkdGhcbiAgICAgLSB2YmggKG51bWJlcikgQG9wdGlvbmFsIHZpZXdib3ggaGVpZ2h0XG4gICAgICoqXG4gICAgID0gKG9iamVjdCkgdGhlIGBwYXR0ZXJuYCBlbGVtZW50XG4gICAgICoqXG4gICAgXFwqL1xuICAgIHByb3RvLnB0cm4gPSBmdW5jdGlvbiAoeCwgeSwgd2lkdGgsIGhlaWdodCwgdngsIHZ5LCB2dywgdmgpIHtcbiAgICAgICAgaWYgKGlzKHgsIFwib2JqZWN0XCIpKSB7XG4gICAgICAgICAgICB2YXIgYXR0ciA9IHg7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhdHRyID0ge3BhdHRlcm5Vbml0czogXCJ1c2VyU3BhY2VPblVzZVwifTtcbiAgICAgICAgICAgIGlmICh4KSB7XG4gICAgICAgICAgICAgICAgYXR0ci54ID0geDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh5KSB7XG4gICAgICAgICAgICAgICAgYXR0ci55ID0geTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh3aWR0aCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgYXR0ci53aWR0aCA9IHdpZHRoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGhlaWdodCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgYXR0ci5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodnggIT0gbnVsbCAmJiB2eSAhPSBudWxsICYmIHZ3ICE9IG51bGwgJiYgdmggIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGF0dHIudmlld0JveCA9IFt2eCwgdnksIHZ3LCB2aF07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGF0dHIudmlld0JveCA9IFt4IHx8IDAsIHkgfHwgMCwgd2lkdGggfHwgMCwgaGVpZ2h0IHx8IDBdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmVsKFwicGF0dGVyblwiLCBhdHRyKTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBQYXBlci51c2VcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIENyZWF0ZXMgYSA8dXNlPiBlbGVtZW50LlxuICAgICAtIGlkIChzdHJpbmcpIEBvcHRpb25hbCBpZCBvZiBlbGVtZW50IHRvIGxpbmtcbiAgICAgKiBvclxuICAgICAtIGlkIChFbGVtZW50KSBAb3B0aW9uYWwgZWxlbWVudCB0byBsaW5rXG4gICAgICoqXG4gICAgID0gKG9iamVjdCkgdGhlIGB1c2VgIGVsZW1lbnRcbiAgICAgKipcbiAgICBcXCovXG4gICAgcHJvdG8udXNlID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgIGlmIChpZCAhPSBudWxsKSB7XG4gICAgICAgICAgICBpZiAoaWQgaW5zdGFuY2VvZiBFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKCFpZC5hdHRyKFwiaWRcIikpIHtcbiAgICAgICAgICAgICAgICAgICAgaWQuYXR0cih7aWQ6IFNuYXAuXy5pZChpZCl9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWQgPSBpZC5hdHRyKFwiaWRcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoU3RyaW5nKGlkKS5jaGFyQXQoKSA9PSBcIiNcIikge1xuICAgICAgICAgICAgICAgIGlkID0gaWQuc3Vic3RyaW5nKDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZWwoXCJ1c2VcIiwge1wieGxpbms6aHJlZlwiOiBcIiNcIiArIGlkfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gRWxlbWVudC5wcm90b3R5cGUudXNlLmNhbGwodGhpcyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBQYXBlci5zeW1ib2xcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIENyZWF0ZXMgYSA8c3ltYm9sPiBlbGVtZW50LlxuICAgICAtIHZieCAobnVtYmVyKSBAb3B0aW9uYWwgdmlld2JveCBYXG4gICAgIC0gdmJ5IChudW1iZXIpIEBvcHRpb25hbCB2aWV3Ym94IFlcbiAgICAgLSB2YncgKG51bWJlcikgQG9wdGlvbmFsIHZpZXdib3ggd2lkdGhcbiAgICAgLSB2YmggKG51bWJlcikgQG9wdGlvbmFsIHZpZXdib3ggaGVpZ2h0XG4gICAgID0gKG9iamVjdCkgdGhlIGBzeW1ib2xgIGVsZW1lbnRcbiAgICAgKipcbiAgICBcXCovXG4gICAgcHJvdG8uc3ltYm9sID0gZnVuY3Rpb24gKHZ4LCB2eSwgdncsIHZoKSB7XG4gICAgICAgIHZhciBhdHRyID0ge307XG4gICAgICAgIGlmICh2eCAhPSBudWxsICYmIHZ5ICE9IG51bGwgJiYgdncgIT0gbnVsbCAmJiB2aCAhPSBudWxsKSB7XG4gICAgICAgICAgICBhdHRyLnZpZXdCb3ggPSBbdngsIHZ5LCB2dywgdmhdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZWwoXCJzeW1ib2xcIiwgYXR0cik7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUGFwZXIudGV4dFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogRHJhd3MgYSB0ZXh0IHN0cmluZ1xuICAgICAqKlxuICAgICAtIHggKG51bWJlcikgeCBjb29yZGluYXRlIHBvc2l0aW9uXG4gICAgIC0geSAobnVtYmVyKSB5IGNvb3JkaW5hdGUgcG9zaXRpb25cbiAgICAgLSB0ZXh0IChzdHJpbmd8YXJyYXkpIFRoZSB0ZXh0IHN0cmluZyB0byBkcmF3IG9yIGFycmF5IG9mIHN0cmluZ3MgdG8gbmVzdCB3aXRoaW4gc2VwYXJhdGUgYDx0c3Bhbj5gIGVsZW1lbnRzXG4gICAgID0gKG9iamVjdCkgdGhlIGB0ZXh0YCBlbGVtZW50XG4gICAgICoqXG4gICAgID4gVXNhZ2VcbiAgICAgfCB2YXIgdDEgPSBwYXBlci50ZXh0KDUwLCA1MCwgXCJTbmFwXCIpO1xuICAgICB8IHZhciB0MiA9IHBhcGVyLnRleHQoNTAsIDUwLCBbXCJTXCIsXCJuXCIsXCJhXCIsXCJwXCJdKTtcbiAgICAgfCAvLyBUZXh0IHBhdGggdXNhZ2VcbiAgICAgfCB0MS5hdHRyKHt0ZXh0cGF0aDogXCJNMTAsMTBMMTAwLDEwMFwifSk7XG4gICAgIHwgLy8gb3JcbiAgICAgfCB2YXIgcHRoID0gcGFwZXIucGF0aChcIk0xMCwxMEwxMDAsMTAwXCIpO1xuICAgICB8IHQxLmF0dHIoe3RleHRwYXRoOiBwdGh9KTtcbiAgICBcXCovXG4gICAgcHJvdG8udGV4dCA9IGZ1bmN0aW9uICh4LCB5LCB0ZXh0KSB7XG4gICAgICAgIHZhciBhdHRyID0ge307XG4gICAgICAgIGlmIChpcyh4LCBcIm9iamVjdFwiKSkge1xuICAgICAgICAgICAgYXR0ciA9IHg7XG4gICAgICAgIH0gZWxzZSBpZiAoeCAhPSBudWxsKSB7XG4gICAgICAgICAgICBhdHRyID0ge1xuICAgICAgICAgICAgICAgIHg6IHgsXG4gICAgICAgICAgICAgICAgeTogeSxcbiAgICAgICAgICAgICAgICB0ZXh0OiB0ZXh0IHx8IFwiXCJcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuZWwoXCJ0ZXh0XCIsIGF0dHIpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFBhcGVyLmxpbmVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIERyYXdzIGEgbGluZVxuICAgICAqKlxuICAgICAtIHgxIChudW1iZXIpIHggY29vcmRpbmF0ZSBwb3NpdGlvbiBvZiB0aGUgc3RhcnRcbiAgICAgLSB5MSAobnVtYmVyKSB5IGNvb3JkaW5hdGUgcG9zaXRpb24gb2YgdGhlIHN0YXJ0XG4gICAgIC0geDIgKG51bWJlcikgeCBjb29yZGluYXRlIHBvc2l0aW9uIG9mIHRoZSBlbmRcbiAgICAgLSB5MiAobnVtYmVyKSB5IGNvb3JkaW5hdGUgcG9zaXRpb24gb2YgdGhlIGVuZFxuICAgICA9IChvYmplY3QpIHRoZSBgbGluZWAgZWxlbWVudFxuICAgICAqKlxuICAgICA+IFVzYWdlXG4gICAgIHwgdmFyIHQxID0gcGFwZXIubGluZSg1MCwgNTAsIDEwMCwgMTAwKTtcbiAgICBcXCovXG4gICAgcHJvdG8ubGluZSA9IGZ1bmN0aW9uICh4MSwgeTEsIHgyLCB5Mikge1xuICAgICAgICB2YXIgYXR0ciA9IHt9O1xuICAgICAgICBpZiAoaXMoeDEsIFwib2JqZWN0XCIpKSB7XG4gICAgICAgICAgICBhdHRyID0geDE7XG4gICAgICAgIH0gZWxzZSBpZiAoeDEgIT0gbnVsbCkge1xuICAgICAgICAgICAgYXR0ciA9IHtcbiAgICAgICAgICAgICAgICB4MTogeDEsXG4gICAgICAgICAgICAgICAgeDI6IHgyLFxuICAgICAgICAgICAgICAgIHkxOiB5MSxcbiAgICAgICAgICAgICAgICB5MjogeTJcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuZWwoXCJsaW5lXCIsIGF0dHIpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFBhcGVyLnBvbHlsaW5lXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBEcmF3cyBhIHBvbHlsaW5lXG4gICAgICoqXG4gICAgIC0gcG9pbnRzIChhcnJheSkgYXJyYXkgb2YgcG9pbnRzXG4gICAgICogb3JcbiAgICAgLSB2YXJhcmdzICjigKYpIHBvaW50c1xuICAgICA9IChvYmplY3QpIHRoZSBgcG9seWxpbmVgIGVsZW1lbnRcbiAgICAgKipcbiAgICAgPiBVc2FnZVxuICAgICB8IHZhciBwMSA9IHBhcGVyLnBvbHlsaW5lKFsxMCwgMTAsIDEwMCwgMTAwXSk7XG4gICAgIHwgdmFyIHAyID0gcGFwZXIucG9seWxpbmUoMTAsIDEwLCAxMDAsIDEwMCk7XG4gICAgXFwqL1xuICAgIHByb3RvLnBvbHlsaW5lID0gZnVuY3Rpb24gKHBvaW50cykge1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgIHBvaW50cyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGF0dHIgPSB7fTtcbiAgICAgICAgaWYgKGlzKHBvaW50cywgXCJvYmplY3RcIikgJiYgIWlzKHBvaW50cywgXCJhcnJheVwiKSkge1xuICAgICAgICAgICAgYXR0ciA9IHBvaW50cztcbiAgICAgICAgfSBlbHNlIGlmIChwb2ludHMgIT0gbnVsbCkge1xuICAgICAgICAgICAgYXR0ciA9IHtwb2ludHM6IHBvaW50c307XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuZWwoXCJwb2x5bGluZVwiLCBhdHRyKTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBQYXBlci5wb2x5Z29uXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBEcmF3cyBhIHBvbHlnb24uIFNlZSBAUGFwZXIucG9seWxpbmVcbiAgICBcXCovXG4gICAgcHJvdG8ucG9seWdvbiA9IGZ1bmN0aW9uIChwb2ludHMpIHtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICBwb2ludHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xuICAgICAgICB9XG4gICAgICAgIHZhciBhdHRyID0ge307XG4gICAgICAgIGlmIChpcyhwb2ludHMsIFwib2JqZWN0XCIpICYmICFpcyhwb2ludHMsIFwiYXJyYXlcIikpIHtcbiAgICAgICAgICAgIGF0dHIgPSBwb2ludHM7XG4gICAgICAgIH0gZWxzZSBpZiAocG9pbnRzICE9IG51bGwpIHtcbiAgICAgICAgICAgIGF0dHIgPSB7cG9pbnRzOiBwb2ludHN9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmVsKFwicG9seWdvblwiLCBhdHRyKTtcbiAgICB9O1xuICAgIC8vIGdyYWRpZW50c1xuICAgIChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciAkID0gU25hcC5fLiQ7XG4gICAgICAgIC8vIGdyYWRpZW50cycgaGVscGVyc1xuICAgICAgICBmdW5jdGlvbiBHc3RvcHMoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zZWxlY3RBbGwoXCJzdG9wXCIpO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIEdhZGRTdG9wKGNvbG9yLCBvZmZzZXQpIHtcbiAgICAgICAgICAgIHZhciBzdG9wID0gJChcInN0b3BcIiksXG4gICAgICAgICAgICAgICAgYXR0ciA9IHtcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiArb2Zmc2V0ICsgXCIlXCJcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29sb3IgPSBTbmFwLmNvbG9yKGNvbG9yKTtcbiAgICAgICAgICAgIGF0dHJbXCJzdG9wLWNvbG9yXCJdID0gY29sb3IuaGV4O1xuICAgICAgICAgICAgaWYgKGNvbG9yLm9wYWNpdHkgPCAxKSB7XG4gICAgICAgICAgICAgICAgYXR0cltcInN0b3Atb3BhY2l0eVwiXSA9IGNvbG9yLm9wYWNpdHk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAkKHN0b3AsIGF0dHIpO1xuICAgICAgICAgICAgdGhpcy5ub2RlLmFwcGVuZENoaWxkKHN0b3ApO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gR2dldEJCb3goKSB7XG4gICAgICAgICAgICBpZiAodGhpcy50eXBlID09IFwibGluZWFyR3JhZGllbnRcIikge1xuICAgICAgICAgICAgICAgIHZhciB4MSA9ICQodGhpcy5ub2RlLCBcIngxXCIpIHx8IDAsXG4gICAgICAgICAgICAgICAgICAgIHgyID0gJCh0aGlzLm5vZGUsIFwieDJcIikgfHwgMSxcbiAgICAgICAgICAgICAgICAgICAgeTEgPSAkKHRoaXMubm9kZSwgXCJ5MVwiKSB8fCAwLFxuICAgICAgICAgICAgICAgICAgICB5MiA9ICQodGhpcy5ub2RlLCBcInkyXCIpIHx8IDA7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFNuYXAuXy5ib3goeDEsIHkxLCBtYXRoLmFicyh4MiAtIHgxKSwgbWF0aC5hYnMoeTIgLSB5MSkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgY3ggPSB0aGlzLm5vZGUuY3ggfHwgLjUsXG4gICAgICAgICAgICAgICAgICAgIGN5ID0gdGhpcy5ub2RlLmN5IHx8IC41LFxuICAgICAgICAgICAgICAgICAgICByID0gdGhpcy5ub2RlLnIgfHwgMDtcbiAgICAgICAgICAgICAgICByZXR1cm4gU25hcC5fLmJveChjeCAtIHIsIGN5IC0gciwgciAqIDIsIHIgKiAyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBncmFkaWVudChkZWZzLCBzdHIpIHtcbiAgICAgICAgICAgIHZhciBncmFkID0gZXZlKFwic25hcC51dGlsLmdyYWQucGFyc2VcIiwgbnVsbCwgc3RyKS5maXJzdERlZmluZWQoKSxcbiAgICAgICAgICAgICAgICBlbDtcbiAgICAgICAgICAgIGlmICghZ3JhZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZ3JhZC5wYXJhbXMudW5zaGlmdChkZWZzKTtcbiAgICAgICAgICAgIGlmIChncmFkLnR5cGUudG9Mb3dlckNhc2UoKSA9PSBcImxcIikge1xuICAgICAgICAgICAgICAgIGVsID0gZ3JhZGllbnRMaW5lYXIuYXBwbHkoMCwgZ3JhZC5wYXJhbXMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBlbCA9IGdyYWRpZW50UmFkaWFsLmFwcGx5KDAsIGdyYWQucGFyYW1zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChncmFkLnR5cGUgIT0gZ3JhZC50eXBlLnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgICAgICAgICAgICAkKGVsLm5vZGUsIHtcbiAgICAgICAgICAgICAgICAgICAgZ3JhZGllbnRVbml0czogXCJ1c2VyU3BhY2VPblVzZVwiXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgc3RvcHMgPSBncmFkLnN0b3BzLFxuICAgICAgICAgICAgICAgIGxlbiA9IHN0b3BzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICBzdGFydCA9IDAsXG4gICAgICAgICAgICAgICAgaiA9IDA7XG4gICAgICAgICAgICBmdW5jdGlvbiBzZWVkKGksIGVuZCkge1xuICAgICAgICAgICAgICAgIHZhciBzdGVwID0gKGVuZCAtIHN0YXJ0KSAvIChpIC0gaik7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgayA9IGo7IGsgPCBpOyBrKyspIHtcbiAgICAgICAgICAgICAgICAgICAgc3RvcHNba10ub2Zmc2V0ID0gKygrc3RhcnQgKyBzdGVwICogKGsgLSBqKSkudG9GaXhlZCgyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaiA9IGk7XG4gICAgICAgICAgICAgICAgc3RhcnQgPSBlbmQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZW4tLTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIGlmIChcIm9mZnNldFwiIGluIHN0b3BzW2ldKSB7XG4gICAgICAgICAgICAgICAgc2VlZChpLCBzdG9wc1tpXS5vZmZzZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3RvcHNbbGVuXS5vZmZzZXQgPSBzdG9wc1tsZW5dLm9mZnNldCB8fCAxMDA7XG4gICAgICAgICAgICBzZWVkKGxlbiwgc3RvcHNbbGVuXS5vZmZzZXQpO1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8PSBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBzdG9wID0gc3RvcHNbaV07XG4gICAgICAgICAgICAgICAgZWwuYWRkU3RvcChzdG9wLmNvbG9yLCBzdG9wLm9mZnNldCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZWw7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gZ3JhZGllbnRMaW5lYXIoZGVmcywgeDEsIHkxLCB4MiwgeTIpIHtcbiAgICAgICAgICAgIHZhciBlbCA9IFNuYXAuXy5tYWtlKFwibGluZWFyR3JhZGllbnRcIiwgZGVmcyk7XG4gICAgICAgICAgICBlbC5zdG9wcyA9IEdzdG9wcztcbiAgICAgICAgICAgIGVsLmFkZFN0b3AgPSBHYWRkU3RvcDtcbiAgICAgICAgICAgIGVsLmdldEJCb3ggPSBHZ2V0QkJveDtcbiAgICAgICAgICAgIGlmICh4MSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgJChlbC5ub2RlLCB7XG4gICAgICAgICAgICAgICAgICAgIHgxOiB4MSxcbiAgICAgICAgICAgICAgICAgICAgeTE6IHkxLFxuICAgICAgICAgICAgICAgICAgICB4MjogeDIsXG4gICAgICAgICAgICAgICAgICAgIHkyOiB5MlxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGVsO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIGdyYWRpZW50UmFkaWFsKGRlZnMsIGN4LCBjeSwgciwgZngsIGZ5KSB7XG4gICAgICAgICAgICB2YXIgZWwgPSBTbmFwLl8ubWFrZShcInJhZGlhbEdyYWRpZW50XCIsIGRlZnMpO1xuICAgICAgICAgICAgZWwuc3RvcHMgPSBHc3RvcHM7XG4gICAgICAgICAgICBlbC5hZGRTdG9wID0gR2FkZFN0b3A7XG4gICAgICAgICAgICBlbC5nZXRCQm94ID0gR2dldEJCb3g7XG4gICAgICAgICAgICBpZiAoY3ggIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICQoZWwubm9kZSwge1xuICAgICAgICAgICAgICAgICAgICBjeDogY3gsXG4gICAgICAgICAgICAgICAgICAgIGN5OiBjeSxcbiAgICAgICAgICAgICAgICAgICAgcjogclxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZ4ICE9IG51bGwgJiYgZnkgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICQoZWwubm9kZSwge1xuICAgICAgICAgICAgICAgICAgICBmeDogZngsXG4gICAgICAgICAgICAgICAgICAgIGZ5OiBmeVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGVsO1xuICAgICAgICB9XG4gICAgICAgIC8qXFxcbiAgICAgICAgICogUGFwZXIuZ3JhZGllbnRcbiAgICAgICAgIFsgbWV0aG9kIF1cbiAgICAgICAgICoqXG4gICAgICAgICAqIENyZWF0ZXMgYSBncmFkaWVudCBlbGVtZW50XG4gICAgICAgICAqKlxuICAgICAgICAgLSBncmFkaWVudCAoc3RyaW5nKSBncmFkaWVudCBkZXNjcmlwdG9yXG4gICAgICAgICA+IEdyYWRpZW50IERlc2NyaXB0b3JcbiAgICAgICAgICogVGhlIGdyYWRpZW50IGRlc2NyaXB0b3IgaXMgYW4gZXhwcmVzc2lvbiBmb3JtYXR0ZWQgYXNcbiAgICAgICAgICogZm9sbG93czogYDx0eXBlPig8Y29vcmRzPik8Y29sb3JzPmAuICBUaGUgYDx0eXBlPmAgY2FuIGJlXG4gICAgICAgICAqIGVpdGhlciBsaW5lYXIgb3IgcmFkaWFsLiAgVGhlIHVwcGVyY2FzZSBgTGAgb3IgYFJgIGxldHRlcnNcbiAgICAgICAgICogaW5kaWNhdGUgYWJzb2x1dGUgY29vcmRpbmF0ZXMgb2Zmc2V0IGZyb20gdGhlIFNWRyBzdXJmYWNlLlxuICAgICAgICAgKiBMb3dlcmNhc2UgYGxgIG9yIGByYCBsZXR0ZXJzIGluZGljYXRlIGNvb3JkaW5hdGVzXG4gICAgICAgICAqIGNhbGN1bGF0ZWQgcmVsYXRpdmUgdG8gdGhlIGVsZW1lbnQgdG8gd2hpY2ggdGhlIGdyYWRpZW50IGlzXG4gICAgICAgICAqIGFwcGxpZWQuICBDb29yZGluYXRlcyBzcGVjaWZ5IGEgbGluZWFyIGdyYWRpZW50IHZlY3RvciBhc1xuICAgICAgICAgKiBgeDFgLCBgeTFgLCBgeDJgLCBgeTJgLCBvciBhIHJhZGlhbCBncmFkaWVudCBhcyBgY3hgLCBgY3lgLFxuICAgICAgICAgKiBgcmAgYW5kIG9wdGlvbmFsIGBmeGAsIGBmeWAgc3BlY2lmeWluZyBhIGZvY2FsIHBvaW50IGF3YXlcbiAgICAgICAgICogZnJvbSB0aGUgY2VudGVyIG9mIHRoZSBjaXJjbGUuIFNwZWNpZnkgYDxjb2xvcnM+YCBhcyBhIGxpc3RcbiAgICAgICAgICogb2YgZGFzaC1zZXBhcmF0ZWQgQ1NTIGNvbG9yIHZhbHVlcy4gIEVhY2ggY29sb3IgbWF5IGJlXG4gICAgICAgICAqIGZvbGxvd2VkIGJ5IGEgY3VzdG9tIG9mZnNldCB2YWx1ZSwgc2VwYXJhdGVkIHdpdGggYSBjb2xvblxuICAgICAgICAgKiBjaGFyYWN0ZXIuXG4gICAgICAgICA+IEV4YW1wbGVzXG4gICAgICAgICAqIExpbmVhciBncmFkaWVudCwgcmVsYXRpdmUgZnJvbSB0b3AtbGVmdCBjb3JuZXIgdG8gYm90dG9tLXJpZ2h0XG4gICAgICAgICAqIGNvcm5lciwgZnJvbSBibGFjayB0aHJvdWdoIHJlZCB0byB3aGl0ZTpcbiAgICAgICAgIHwgdmFyIGcgPSBwYXBlci5ncmFkaWVudChcImwoMCwgMCwgMSwgMSkjMDAwLSNmMDAtI2ZmZlwiKTtcbiAgICAgICAgICogTGluZWFyIGdyYWRpZW50LCBhYnNvbHV0ZSBmcm9tICgwLCAwKSB0byAoMTAwLCAxMDApLCBmcm9tIGJsYWNrXG4gICAgICAgICAqIHRocm91Z2ggcmVkIGF0IDI1JSB0byB3aGl0ZTpcbiAgICAgICAgIHwgdmFyIGcgPSBwYXBlci5ncmFkaWVudChcIkwoMCwgMCwgMTAwLCAxMDApIzAwMC0jZjAwOjI1LSNmZmZcIik7XG4gICAgICAgICAqIFJhZGlhbCBncmFkaWVudCwgcmVsYXRpdmUgZnJvbSB0aGUgY2VudGVyIG9mIHRoZSBlbGVtZW50IHdpdGggcmFkaXVzXG4gICAgICAgICAqIGhhbGYgdGhlIHdpZHRoLCBmcm9tIGJsYWNrIHRvIHdoaXRlOlxuICAgICAgICAgfCB2YXIgZyA9IHBhcGVyLmdyYWRpZW50KFwicigwLjUsIDAuNSwgMC41KSMwMDAtI2ZmZlwiKTtcbiAgICAgICAgICogVG8gYXBwbHkgdGhlIGdyYWRpZW50OlxuICAgICAgICAgfCBwYXBlci5jaXJjbGUoNTAsIDUwLCA0MCkuYXR0cih7XG4gICAgICAgICB8ICAgICBmaWxsOiBnXG4gICAgICAgICB8IH0pO1xuICAgICAgICAgPSAob2JqZWN0KSB0aGUgYGdyYWRpZW50YCBlbGVtZW50XG4gICAgICAgIFxcKi9cbiAgICAgICAgcHJvdG8uZ3JhZGllbnQgPSBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgICAgICByZXR1cm4gZ3JhZGllbnQodGhpcy5kZWZzLCBzdHIpO1xuICAgICAgICB9O1xuICAgICAgICBwcm90by5ncmFkaWVudExpbmVhciA9IGZ1bmN0aW9uICh4MSwgeTEsIHgyLCB5Mikge1xuICAgICAgICAgICAgcmV0dXJuIGdyYWRpZW50TGluZWFyKHRoaXMuZGVmcywgeDEsIHkxLCB4MiwgeTIpO1xuICAgICAgICB9O1xuICAgICAgICBwcm90by5ncmFkaWVudFJhZGlhbCA9IGZ1bmN0aW9uIChjeCwgY3ksIHIsIGZ4LCBmeSkge1xuICAgICAgICAgICAgcmV0dXJuIGdyYWRpZW50UmFkaWFsKHRoaXMuZGVmcywgY3gsIGN5LCByLCBmeCwgZnkpO1xuICAgICAgICB9O1xuICAgICAgICAvKlxcXG4gICAgICAgICAqIFBhcGVyLnRvU3RyaW5nXG4gICAgICAgICBbIG1ldGhvZCBdXG4gICAgICAgICAqKlxuICAgICAgICAgKiBSZXR1cm5zIFNWRyBjb2RlIGZvciB0aGUgQFBhcGVyXG4gICAgICAgICA9IChzdHJpbmcpIFNWRyBjb2RlIGZvciB0aGUgQFBhcGVyXG4gICAgICAgIFxcKi9cbiAgICAgICAgcHJvdG8udG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgZG9jID0gdGhpcy5ub2RlLm93bmVyRG9jdW1lbnQsXG4gICAgICAgICAgICAgICAgZiA9IGRvYy5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCksXG4gICAgICAgICAgICAgICAgZCA9IGRvYy5jcmVhdGVFbGVtZW50KFwiZGl2XCIpLFxuICAgICAgICAgICAgICAgIHN2ZyA9IHRoaXMubm9kZS5jbG9uZU5vZGUodHJ1ZSksXG4gICAgICAgICAgICAgICAgcmVzO1xuICAgICAgICAgICAgZi5hcHBlbmRDaGlsZChkKTtcbiAgICAgICAgICAgIGQuYXBwZW5kQ2hpbGQoc3ZnKTtcbiAgICAgICAgICAgIFNuYXAuXy4kKHN2Zywge3htbG5zOiBcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCJ9KTtcbiAgICAgICAgICAgIHJlcyA9IGQuaW5uZXJIVE1MO1xuICAgICAgICAgICAgZi5yZW1vdmVDaGlsZChmLmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgfTtcbiAgICAgICAgLypcXFxuICAgICAgICAgKiBQYXBlci50b0RhdGFVUkxcbiAgICAgICAgIFsgbWV0aG9kIF1cbiAgICAgICAgICoqXG4gICAgICAgICAqIFJldHVybnMgU1ZHIGNvZGUgZm9yIHRoZSBAUGFwZXIgYXMgRGF0YSBVUkkgc3RyaW5nLlxuICAgICAgICAgPSAoc3RyaW5nKSBEYXRhIFVSSSBzdHJpbmdcbiAgICAgICAgXFwqL1xuICAgICAgICBwcm90by50b0RhdGFVUkwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAod2luZG93ICYmIHdpbmRvdy5idG9hKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxcIiArIGJ0b2EodW5lc2NhcGUoZW5jb2RlVVJJQ29tcG9uZW50KHRoaXMpKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIC8qXFxcbiAgICAgICAgICogUGFwZXIuY2xlYXJcbiAgICAgICAgIFsgbWV0aG9kIF1cbiAgICAgICAgICoqXG4gICAgICAgICAqIFJlbW92ZXMgYWxsIGNoaWxkIG5vZGVzIG9mIHRoZSBwYXBlciwgZXhjZXB0IDxkZWZzPi5cbiAgICAgICAgXFwqL1xuICAgICAgICBwcm90by5jbGVhciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBub2RlID0gdGhpcy5ub2RlLmZpcnN0Q2hpbGQsXG4gICAgICAgICAgICAgICAgbmV4dDtcbiAgICAgICAgICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgICAgICAgICAgbmV4dCA9IG5vZGUubmV4dFNpYmxpbmc7XG4gICAgICAgICAgICAgICAgaWYgKG5vZGUudGFnTmFtZSAhPSBcImRlZnNcIikge1xuICAgICAgICAgICAgICAgICAgICBub2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobm9kZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvdG8uY2xlYXIuY2FsbCh7bm9kZTogbm9kZX0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBub2RlID0gbmV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KCkpO1xufSk7XG5cbi8vIENvcHlyaWdodCAoYykgMjAxMyBBZG9iZSBTeXN0ZW1zIEluY29ycG9yYXRlZC4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIFxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy8gXG4vLyBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vIFxuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cblNuYXAucGx1Z2luKGZ1bmN0aW9uIChTbmFwLCBFbGVtZW50LCBQYXBlciwgZ2xvYikge1xuICAgIHZhciBlbHByb3RvID0gRWxlbWVudC5wcm90b3R5cGUsXG4gICAgICAgIGlzID0gU25hcC5pcyxcbiAgICAgICAgY2xvbmUgPSBTbmFwLl8uY2xvbmUsXG4gICAgICAgIGhhcyA9IFwiaGFzT3duUHJvcGVydHlcIixcbiAgICAgICAgcDJzID0gLyw/KFthLXpdKSw/L2dpLFxuICAgICAgICB0b0Zsb2F0ID0gcGFyc2VGbG9hdCxcbiAgICAgICAgbWF0aCA9IE1hdGgsXG4gICAgICAgIFBJID0gbWF0aC5QSSxcbiAgICAgICAgbW1pbiA9IG1hdGgubWluLFxuICAgICAgICBtbWF4ID0gbWF0aC5tYXgsXG4gICAgICAgIHBvdyA9IG1hdGgucG93LFxuICAgICAgICBhYnMgPSBtYXRoLmFicztcbiAgICBmdW5jdGlvbiBwYXRocyhwcykge1xuICAgICAgICB2YXIgcCA9IHBhdGhzLnBzID0gcGF0aHMucHMgfHwge307XG4gICAgICAgIGlmIChwW3BzXSkge1xuICAgICAgICAgICAgcFtwc10uc2xlZXAgPSAxMDA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwW3BzXSA9IHtcbiAgICAgICAgICAgICAgICBzbGVlcDogMTAwXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHApIGlmIChwW2hhc10oa2V5KSAmJiBrZXkgIT0gcHMpIHtcbiAgICAgICAgICAgICAgICBwW2tleV0uc2xlZXAtLTtcbiAgICAgICAgICAgICAgICAhcFtrZXldLnNsZWVwICYmIGRlbGV0ZSBwW2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcFtwc107XG4gICAgfVxuICAgIGZ1bmN0aW9uIGJveCh4LCB5LCB3aWR0aCwgaGVpZ2h0KSB7XG4gICAgICAgIGlmICh4ID09IG51bGwpIHtcbiAgICAgICAgICAgIHggPSB5ID0gd2lkdGggPSBoZWlnaHQgPSAwO1xuICAgICAgICB9XG4gICAgICAgIGlmICh5ID09IG51bGwpIHtcbiAgICAgICAgICAgIHkgPSB4Lnk7XG4gICAgICAgICAgICB3aWR0aCA9IHgud2lkdGg7XG4gICAgICAgICAgICBoZWlnaHQgPSB4LmhlaWdodDtcbiAgICAgICAgICAgIHggPSB4Lng7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6IHgsXG4gICAgICAgICAgICB5OiB5LFxuICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgdzogd2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCxcbiAgICAgICAgICAgIGg6IGhlaWdodCxcbiAgICAgICAgICAgIHgyOiB4ICsgd2lkdGgsXG4gICAgICAgICAgICB5MjogeSArIGhlaWdodCxcbiAgICAgICAgICAgIGN4OiB4ICsgd2lkdGggLyAyLFxuICAgICAgICAgICAgY3k6IHkgKyBoZWlnaHQgLyAyLFxuICAgICAgICAgICAgcjE6IG1hdGgubWluKHdpZHRoLCBoZWlnaHQpIC8gMixcbiAgICAgICAgICAgIHIyOiBtYXRoLm1heCh3aWR0aCwgaGVpZ2h0KSAvIDIsXG4gICAgICAgICAgICByMDogbWF0aC5zcXJ0KHdpZHRoICogd2lkdGggKyBoZWlnaHQgKiBoZWlnaHQpIC8gMixcbiAgICAgICAgICAgIHBhdGg6IHJlY3RQYXRoKHgsIHksIHdpZHRoLCBoZWlnaHQpLFxuICAgICAgICAgICAgdmI6IFt4LCB5LCB3aWR0aCwgaGVpZ2h0XS5qb2luKFwiIFwiKVxuICAgICAgICB9O1xuICAgIH1cbiAgICBmdW5jdGlvbiB0b1N0cmluZygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuam9pbihcIixcIikucmVwbGFjZShwMnMsIFwiJDFcIik7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHBhdGhDbG9uZShwYXRoQXJyYXkpIHtcbiAgICAgICAgdmFyIHJlcyA9IGNsb25lKHBhdGhBcnJheSk7XG4gICAgICAgIHJlcy50b1N0cmluZyA9IHRvU3RyaW5nO1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cbiAgICBmdW5jdGlvbiBnZXRQb2ludEF0U2VnbWVudExlbmd0aChwMXgsIHAxeSwgYzF4LCBjMXksIGMyeCwgYzJ5LCBwMngsIHAyeSwgbGVuZ3RoKSB7XG4gICAgICAgIGlmIChsZW5ndGggPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIGJlemxlbihwMXgsIHAxeSwgYzF4LCBjMXksIGMyeCwgYzJ5LCBwMngsIHAyeSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZmluZERvdHNBdFNlZ21lbnQocDF4LCBwMXksIGMxeCwgYzF5LCBjMngsIGMyeSwgcDJ4LCBwMnksXG4gICAgICAgICAgICAgICAgZ2V0VG90TGVuKHAxeCwgcDF5LCBjMXgsIGMxeSwgYzJ4LCBjMnksIHAyeCwgcDJ5LCBsZW5ndGgpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBnZXRMZW5ndGhGYWN0b3J5KGlzdG90YWwsIHN1YnBhdGgpIHtcbiAgICAgICAgZnVuY3Rpb24gTyh2YWwpIHtcbiAgICAgICAgICAgIHJldHVybiArKCt2YWwpLnRvRml4ZWQoMyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFNuYXAuXy5jYWNoZXIoZnVuY3Rpb24gKHBhdGgsIGxlbmd0aCwgb25seXN0YXJ0KSB7XG4gICAgICAgICAgICBpZiAocGF0aCBpbnN0YW5jZW9mIEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICBwYXRoID0gcGF0aC5hdHRyKFwiZFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhdGggPSBwYXRoMmN1cnZlKHBhdGgpO1xuICAgICAgICAgICAgdmFyIHgsIHksIHAsIGwsIHNwID0gXCJcIiwgc3VicGF0aHMgPSB7fSwgcG9pbnQsXG4gICAgICAgICAgICAgICAgbGVuID0gMDtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IHBhdGgubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgIHAgPSBwYXRoW2ldO1xuICAgICAgICAgICAgICAgIGlmIChwWzBdID09IFwiTVwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHggPSArcFsxXTtcbiAgICAgICAgICAgICAgICAgICAgeSA9ICtwWzJdO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGwgPSBnZXRQb2ludEF0U2VnbWVudExlbmd0aCh4LCB5LCBwWzFdLCBwWzJdLCBwWzNdLCBwWzRdLCBwWzVdLCBwWzZdKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxlbiArIGwgPiBsZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdWJwYXRoICYmICFzdWJwYXRocy5zdGFydCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvaW50ID0gZ2V0UG9pbnRBdFNlZ21lbnRMZW5ndGgoeCwgeSwgcFsxXSwgcFsyXSwgcFszXSwgcFs0XSwgcFs1XSwgcFs2XSwgbGVuZ3RoIC0gbGVuKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcCArPSBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiQ1wiICsgTyhwb2ludC5zdGFydC54KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTyhwb2ludC5zdGFydC55KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTyhwb2ludC5tLngpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBPKHBvaW50Lm0ueSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE8ocG9pbnQueCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE8ocG9pbnQueSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvbmx5c3RhcnQpIHtyZXR1cm4gc3A7fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1YnBhdGhzLnN0YXJ0ID0gc3A7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3AgPSBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiTVwiICsgTyhwb2ludC54KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTyhwb2ludC55KSArIFwiQ1wiICsgTyhwb2ludC5uLngpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBPKHBvaW50Lm4ueSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE8ocG9pbnQuZW5kLngpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBPKHBvaW50LmVuZC55KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTyhwWzVdKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTyhwWzZdKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF0uam9pbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxlbiArPSBsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHggPSArcFs1XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB5ID0gK3BbNl07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzdG90YWwgJiYgIXN1YnBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb2ludCA9IGdldFBvaW50QXRTZWdtZW50TGVuZ3RoKHgsIHksIHBbMV0sIHBbMl0sIHBbM10sIHBbNF0sIHBbNV0sIHBbNl0sIGxlbmd0aCAtIGxlbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBvaW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGxlbiArPSBsO1xuICAgICAgICAgICAgICAgICAgICB4ID0gK3BbNV07XG4gICAgICAgICAgICAgICAgICAgIHkgPSArcFs2XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc3AgKz0gcC5zaGlmdCgpICsgcDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN1YnBhdGhzLmVuZCA9IHNwO1xuICAgICAgICAgICAgcG9pbnQgPSBpc3RvdGFsID8gbGVuIDogc3VicGF0aCA/IHN1YnBhdGhzIDogZmluZERvdHNBdFNlZ21lbnQoeCwgeSwgcFswXSwgcFsxXSwgcFsyXSwgcFszXSwgcFs0XSwgcFs1XSwgMSk7XG4gICAgICAgICAgICByZXR1cm4gcG9pbnQ7XG4gICAgICAgIH0sIG51bGwsIFNuYXAuXy5jbG9uZSk7XG4gICAgfVxuICAgIHZhciBnZXRUb3RhbExlbmd0aCA9IGdldExlbmd0aEZhY3RvcnkoMSksXG4gICAgICAgIGdldFBvaW50QXRMZW5ndGggPSBnZXRMZW5ndGhGYWN0b3J5KCksXG4gICAgICAgIGdldFN1YnBhdGhzQXRMZW5ndGggPSBnZXRMZW5ndGhGYWN0b3J5KDAsIDEpO1xuICAgIGZ1bmN0aW9uIGZpbmREb3RzQXRTZWdtZW50KHAxeCwgcDF5LCBjMXgsIGMxeSwgYzJ4LCBjMnksIHAyeCwgcDJ5LCB0KSB7XG4gICAgICAgIHZhciB0MSA9IDEgLSB0LFxuICAgICAgICAgICAgdDEzID0gcG93KHQxLCAzKSxcbiAgICAgICAgICAgIHQxMiA9IHBvdyh0MSwgMiksXG4gICAgICAgICAgICB0MiA9IHQgKiB0LFxuICAgICAgICAgICAgdDMgPSB0MiAqIHQsXG4gICAgICAgICAgICB4ID0gdDEzICogcDF4ICsgdDEyICogMyAqIHQgKiBjMXggKyB0MSAqIDMgKiB0ICogdCAqIGMyeCArIHQzICogcDJ4LFxuICAgICAgICAgICAgeSA9IHQxMyAqIHAxeSArIHQxMiAqIDMgKiB0ICogYzF5ICsgdDEgKiAzICogdCAqIHQgKiBjMnkgKyB0MyAqIHAyeSxcbiAgICAgICAgICAgIG14ID0gcDF4ICsgMiAqIHQgKiAoYzF4IC0gcDF4KSArIHQyICogKGMyeCAtIDIgKiBjMXggKyBwMXgpLFxuICAgICAgICAgICAgbXkgPSBwMXkgKyAyICogdCAqIChjMXkgLSBwMXkpICsgdDIgKiAoYzJ5IC0gMiAqIGMxeSArIHAxeSksXG4gICAgICAgICAgICBueCA9IGMxeCArIDIgKiB0ICogKGMyeCAtIGMxeCkgKyB0MiAqIChwMnggLSAyICogYzJ4ICsgYzF4KSxcbiAgICAgICAgICAgIG55ID0gYzF5ICsgMiAqIHQgKiAoYzJ5IC0gYzF5KSArIHQyICogKHAyeSAtIDIgKiBjMnkgKyBjMXkpLFxuICAgICAgICAgICAgYXggPSB0MSAqIHAxeCArIHQgKiBjMXgsXG4gICAgICAgICAgICBheSA9IHQxICogcDF5ICsgdCAqIGMxeSxcbiAgICAgICAgICAgIGN4ID0gdDEgKiBjMnggKyB0ICogcDJ4LFxuICAgICAgICAgICAgY3kgPSB0MSAqIGMyeSArIHQgKiBwMnksXG4gICAgICAgICAgICBhbHBoYSA9ICg5MCAtIG1hdGguYXRhbjIobXggLSBueCwgbXkgLSBueSkgKiAxODAgLyBQSSk7XG4gICAgICAgIC8vIChteCA+IG54IHx8IG15IDwgbnkpICYmIChhbHBoYSArPSAxODApO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeDogeCxcbiAgICAgICAgICAgIHk6IHksXG4gICAgICAgICAgICBtOiB7eDogbXgsIHk6IG15fSxcbiAgICAgICAgICAgIG46IHt4OiBueCwgeTogbnl9LFxuICAgICAgICAgICAgc3RhcnQ6IHt4OiBheCwgeTogYXl9LFxuICAgICAgICAgICAgZW5kOiB7eDogY3gsIHk6IGN5fSxcbiAgICAgICAgICAgIGFscGhhOiBhbHBoYVxuICAgICAgICB9O1xuICAgIH1cbiAgICBmdW5jdGlvbiBiZXppZXJCQm94KHAxeCwgcDF5LCBjMXgsIGMxeSwgYzJ4LCBjMnksIHAyeCwgcDJ5KSB7XG4gICAgICAgIGlmICghU25hcC5pcyhwMXgsIFwiYXJyYXlcIikpIHtcbiAgICAgICAgICAgIHAxeCA9IFtwMXgsIHAxeSwgYzF4LCBjMXksIGMyeCwgYzJ5LCBwMngsIHAyeV07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGJib3ggPSBjdXJ2ZURpbS5hcHBseShudWxsLCBwMXgpO1xuICAgICAgICByZXR1cm4gYm94KFxuICAgICAgICAgICAgYmJveC5taW4ueCxcbiAgICAgICAgICAgIGJib3gubWluLnksXG4gICAgICAgICAgICBiYm94Lm1heC54IC0gYmJveC5taW4ueCxcbiAgICAgICAgICAgIGJib3gubWF4LnkgLSBiYm94Lm1pbi55XG4gICAgICAgICk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGlzUG9pbnRJbnNpZGVCQm94KGJib3gsIHgsIHkpIHtcbiAgICAgICAgcmV0dXJuICB4ID49IGJib3gueCAmJlxuICAgICAgICAgICAgICAgIHggPD0gYmJveC54ICsgYmJveC53aWR0aCAmJlxuICAgICAgICAgICAgICAgIHkgPj0gYmJveC55ICYmXG4gICAgICAgICAgICAgICAgeSA8PSBiYm94LnkgKyBiYm94LmhlaWdodDtcbiAgICB9XG4gICAgZnVuY3Rpb24gaXNCQm94SW50ZXJzZWN0KGJib3gxLCBiYm94Mikge1xuICAgICAgICBiYm94MSA9IGJveChiYm94MSk7XG4gICAgICAgIGJib3gyID0gYm94KGJib3gyKTtcbiAgICAgICAgcmV0dXJuIGlzUG9pbnRJbnNpZGVCQm94KGJib3gyLCBiYm94MS54LCBiYm94MS55KVxuICAgICAgICAgICAgfHwgaXNQb2ludEluc2lkZUJCb3goYmJveDIsIGJib3gxLngyLCBiYm94MS55KVxuICAgICAgICAgICAgfHwgaXNQb2ludEluc2lkZUJCb3goYmJveDIsIGJib3gxLngsIGJib3gxLnkyKVxuICAgICAgICAgICAgfHwgaXNQb2ludEluc2lkZUJCb3goYmJveDIsIGJib3gxLngyLCBiYm94MS55MilcbiAgICAgICAgICAgIHx8IGlzUG9pbnRJbnNpZGVCQm94KGJib3gxLCBiYm94Mi54LCBiYm94Mi55KVxuICAgICAgICAgICAgfHwgaXNQb2ludEluc2lkZUJCb3goYmJveDEsIGJib3gyLngyLCBiYm94Mi55KVxuICAgICAgICAgICAgfHwgaXNQb2ludEluc2lkZUJCb3goYmJveDEsIGJib3gyLngsIGJib3gyLnkyKVxuICAgICAgICAgICAgfHwgaXNQb2ludEluc2lkZUJCb3goYmJveDEsIGJib3gyLngyLCBiYm94Mi55MilcbiAgICAgICAgICAgIHx8IChiYm94MS54IDwgYmJveDIueDIgJiYgYmJveDEueCA+IGJib3gyLnhcbiAgICAgICAgICAgICAgICB8fCBiYm94Mi54IDwgYmJveDEueDIgJiYgYmJveDIueCA+IGJib3gxLngpXG4gICAgICAgICAgICAmJiAoYmJveDEueSA8IGJib3gyLnkyICYmIGJib3gxLnkgPiBiYm94Mi55XG4gICAgICAgICAgICAgICAgfHwgYmJveDIueSA8IGJib3gxLnkyICYmIGJib3gyLnkgPiBiYm94MS55KTtcbiAgICB9XG4gICAgZnVuY3Rpb24gYmFzZTModCwgcDEsIHAyLCBwMywgcDQpIHtcbiAgICAgICAgdmFyIHQxID0gLTMgKiBwMSArIDkgKiBwMiAtIDkgKiBwMyArIDMgKiBwNCxcbiAgICAgICAgICAgIHQyID0gdCAqIHQxICsgNiAqIHAxIC0gMTIgKiBwMiArIDYgKiBwMztcbiAgICAgICAgcmV0dXJuIHQgKiB0MiAtIDMgKiBwMSArIDMgKiBwMjtcbiAgICB9XG4gICAgZnVuY3Rpb24gYmV6bGVuKHgxLCB5MSwgeDIsIHkyLCB4MywgeTMsIHg0LCB5NCwgeikge1xuICAgICAgICBpZiAoeiA9PSBudWxsKSB7XG4gICAgICAgICAgICB6ID0gMTtcbiAgICAgICAgfVxuICAgICAgICB6ID0geiA+IDEgPyAxIDogeiA8IDAgPyAwIDogejtcbiAgICAgICAgdmFyIHoyID0geiAvIDIsXG4gICAgICAgICAgICBuID0gMTIsXG4gICAgICAgICAgICBUdmFsdWVzID0gWy0uMTI1MiwuMTI1MiwtLjM2NzgsLjM2NzgsLS41ODczLC41ODczLC0uNzY5OSwuNzY5OSwtLjkwNDEsLjkwNDEsLS45ODE2LC45ODE2XSxcbiAgICAgICAgICAgIEN2YWx1ZXMgPSBbMC4yNDkxLDAuMjQ5MSwwLjIzMzUsMC4yMzM1LDAuMjAzMiwwLjIwMzIsMC4xNjAxLDAuMTYwMSwwLjEwNjksMC4xMDY5LDAuMDQ3MiwwLjA0NzJdLFxuICAgICAgICAgICAgc3VtID0gMDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBjdCA9IHoyICogVHZhbHVlc1tpXSArIHoyLFxuICAgICAgICAgICAgICAgIHhiYXNlID0gYmFzZTMoY3QsIHgxLCB4MiwgeDMsIHg0KSxcbiAgICAgICAgICAgICAgICB5YmFzZSA9IGJhc2UzKGN0LCB5MSwgeTIsIHkzLCB5NCksXG4gICAgICAgICAgICAgICAgY29tYiA9IHhiYXNlICogeGJhc2UgKyB5YmFzZSAqIHliYXNlO1xuICAgICAgICAgICAgc3VtICs9IEN2YWx1ZXNbaV0gKiBtYXRoLnNxcnQoY29tYik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHoyICogc3VtO1xuICAgIH1cbiAgICBmdW5jdGlvbiBnZXRUb3RMZW4oeDEsIHkxLCB4MiwgeTIsIHgzLCB5MywgeDQsIHk0LCBsbCkge1xuICAgICAgICBpZiAobGwgPCAwIHx8IGJlemxlbih4MSwgeTEsIHgyLCB5MiwgeDMsIHkzLCB4NCwgeTQpIDwgbGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdCA9IDEsXG4gICAgICAgICAgICBzdGVwID0gdCAvIDIsXG4gICAgICAgICAgICB0MiA9IHQgLSBzdGVwLFxuICAgICAgICAgICAgbCxcbiAgICAgICAgICAgIGUgPSAuMDE7XG4gICAgICAgIGwgPSBiZXpsZW4oeDEsIHkxLCB4MiwgeTIsIHgzLCB5MywgeDQsIHk0LCB0Mik7XG4gICAgICAgIHdoaWxlIChhYnMobCAtIGxsKSA+IGUpIHtcbiAgICAgICAgICAgIHN0ZXAgLz0gMjtcbiAgICAgICAgICAgIHQyICs9IChsIDwgbGwgPyAxIDogLTEpICogc3RlcDtcbiAgICAgICAgICAgIGwgPSBiZXpsZW4oeDEsIHkxLCB4MiwgeTIsIHgzLCB5MywgeDQsIHk0LCB0Mik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHQyO1xuICAgIH1cbiAgICBmdW5jdGlvbiBpbnRlcnNlY3QoeDEsIHkxLCB4MiwgeTIsIHgzLCB5MywgeDQsIHk0KSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIG1tYXgoeDEsIHgyKSA8IG1taW4oeDMsIHg0KSB8fFxuICAgICAgICAgICAgbW1pbih4MSwgeDIpID4gbW1heCh4MywgeDQpIHx8XG4gICAgICAgICAgICBtbWF4KHkxLCB5MikgPCBtbWluKHkzLCB5NCkgfHxcbiAgICAgICAgICAgIG1taW4oeTEsIHkyKSA+IG1tYXgoeTMsIHk0KVxuICAgICAgICApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbnggPSAoeDEgKiB5MiAtIHkxICogeDIpICogKHgzIC0geDQpIC0gKHgxIC0geDIpICogKHgzICogeTQgLSB5MyAqIHg0KSxcbiAgICAgICAgICAgIG55ID0gKHgxICogeTIgLSB5MSAqIHgyKSAqICh5MyAtIHk0KSAtICh5MSAtIHkyKSAqICh4MyAqIHk0IC0geTMgKiB4NCksXG4gICAgICAgICAgICBkZW5vbWluYXRvciA9ICh4MSAtIHgyKSAqICh5MyAtIHk0KSAtICh5MSAtIHkyKSAqICh4MyAtIHg0KTtcblxuICAgICAgICBpZiAoIWRlbm9taW5hdG9yKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHB4ID0gbnggLyBkZW5vbWluYXRvcixcbiAgICAgICAgICAgIHB5ID0gbnkgLyBkZW5vbWluYXRvcixcbiAgICAgICAgICAgIHB4MiA9ICtweC50b0ZpeGVkKDIpLFxuICAgICAgICAgICAgcHkyID0gK3B5LnRvRml4ZWQoMik7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIHB4MiA8ICttbWluKHgxLCB4MikudG9GaXhlZCgyKSB8fFxuICAgICAgICAgICAgcHgyID4gK21tYXgoeDEsIHgyKS50b0ZpeGVkKDIpIHx8XG4gICAgICAgICAgICBweDIgPCArbW1pbih4MywgeDQpLnRvRml4ZWQoMikgfHxcbiAgICAgICAgICAgIHB4MiA+ICttbWF4KHgzLCB4NCkudG9GaXhlZCgyKSB8fFxuICAgICAgICAgICAgcHkyIDwgK21taW4oeTEsIHkyKS50b0ZpeGVkKDIpIHx8XG4gICAgICAgICAgICBweTIgPiArbW1heCh5MSwgeTIpLnRvRml4ZWQoMikgfHxcbiAgICAgICAgICAgIHB5MiA8ICttbWluKHkzLCB5NCkudG9GaXhlZCgyKSB8fFxuICAgICAgICAgICAgcHkyID4gK21tYXgoeTMsIHk0KS50b0ZpeGVkKDIpXG4gICAgICAgICkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7eDogcHgsIHk6IHB5fTtcbiAgICB9XG4gICAgZnVuY3Rpb24gaW50ZXIoYmV6MSwgYmV6Mikge1xuICAgICAgICByZXR1cm4gaW50ZXJIZWxwZXIoYmV6MSwgYmV6Mik7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGludGVyQ291bnQoYmV6MSwgYmV6Mikge1xuICAgICAgICByZXR1cm4gaW50ZXJIZWxwZXIoYmV6MSwgYmV6MiwgMSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGludGVySGVscGVyKGJlejEsIGJlejIsIGp1c3RDb3VudCkge1xuICAgICAgICB2YXIgYmJveDEgPSBiZXppZXJCQm94KGJlejEpLFxuICAgICAgICAgICAgYmJveDIgPSBiZXppZXJCQm94KGJlejIpO1xuICAgICAgICBpZiAoIWlzQkJveEludGVyc2VjdChiYm94MSwgYmJveDIpKSB7XG4gICAgICAgICAgICByZXR1cm4ganVzdENvdW50ID8gMCA6IFtdO1xuICAgICAgICB9XG4gICAgICAgIHZhciBsMSA9IGJlemxlbi5hcHBseSgwLCBiZXoxKSxcbiAgICAgICAgICAgIGwyID0gYmV6bGVuLmFwcGx5KDAsIGJlejIpLFxuICAgICAgICAgICAgbjEgPSB+fihsMSAvIDgpLFxuICAgICAgICAgICAgbjIgPSB+fihsMiAvIDgpLFxuICAgICAgICAgICAgZG90czEgPSBbXSxcbiAgICAgICAgICAgIGRvdHMyID0gW10sXG4gICAgICAgICAgICB4eSA9IHt9LFxuICAgICAgICAgICAgcmVzID0ganVzdENvdW50ID8gMCA6IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG4xICsgMTsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcCA9IGZpbmREb3RzQXRTZWdtZW50LmFwcGx5KDAsIGJlejEuY29uY2F0KGkgLyBuMSkpO1xuICAgICAgICAgICAgZG90czEucHVzaCh7eDogcC54LCB5OiBwLnksIHQ6IGkgLyBuMX0pO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBuMiArIDE7IGkrKykge1xuICAgICAgICAgICAgcCA9IGZpbmREb3RzQXRTZWdtZW50LmFwcGx5KDAsIGJlejIuY29uY2F0KGkgLyBuMikpO1xuICAgICAgICAgICAgZG90czIucHVzaCh7eDogcC54LCB5OiBwLnksIHQ6IGkgLyBuMn0pO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBuMTsgaSsrKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IG4yOyBqKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgZGkgPSBkb3RzMVtpXSxcbiAgICAgICAgICAgICAgICAgICAgZGkxID0gZG90czFbaSArIDFdLFxuICAgICAgICAgICAgICAgICAgICBkaiA9IGRvdHMyW2pdLFxuICAgICAgICAgICAgICAgICAgICBkajEgPSBkb3RzMltqICsgMV0sXG4gICAgICAgICAgICAgICAgICAgIGNpID0gYWJzKGRpMS54IC0gZGkueCkgPCAuMDAxID8gXCJ5XCIgOiBcInhcIixcbiAgICAgICAgICAgICAgICAgICAgY2ogPSBhYnMoZGoxLnggLSBkai54KSA8IC4wMDEgPyBcInlcIiA6IFwieFwiLFxuICAgICAgICAgICAgICAgICAgICBpcyA9IGludGVyc2VjdChkaS54LCBkaS55LCBkaTEueCwgZGkxLnksIGRqLngsIGRqLnksIGRqMS54LCBkajEueSk7XG4gICAgICAgICAgICAgICAgaWYgKGlzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh4eVtpcy54LnRvRml4ZWQoNCldID09IGlzLnkudG9GaXhlZCg0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgeHlbaXMueC50b0ZpeGVkKDQpXSA9IGlzLnkudG9GaXhlZCg0KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHQxID0gZGkudCArIGFicygoaXNbY2ldIC0gZGlbY2ldKSAvIChkaTFbY2ldIC0gZGlbY2ldKSkgKiAoZGkxLnQgLSBkaS50KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHQyID0gZGoudCArIGFicygoaXNbY2pdIC0gZGpbY2pdKSAvIChkajFbY2pdIC0gZGpbY2pdKSkgKiAoZGoxLnQgLSBkai50KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHQxID49IDAgJiYgdDEgPD0gMSAmJiB0MiA+PSAwICYmIHQyIDw9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChqdXN0Q291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiBpcy54LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5OiBpcy55LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0MTogdDEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHQyOiB0MlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHBhdGhJbnRlcnNlY3Rpb24ocGF0aDEsIHBhdGgyKSB7XG4gICAgICAgIHJldHVybiBpbnRlclBhdGhIZWxwZXIocGF0aDEsIHBhdGgyKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gcGF0aEludGVyc2VjdGlvbk51bWJlcihwYXRoMSwgcGF0aDIpIHtcbiAgICAgICAgcmV0dXJuIGludGVyUGF0aEhlbHBlcihwYXRoMSwgcGF0aDIsIDEpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBpbnRlclBhdGhIZWxwZXIocGF0aDEsIHBhdGgyLCBqdXN0Q291bnQpIHtcbiAgICAgICAgcGF0aDEgPSBwYXRoMmN1cnZlKHBhdGgxKTtcbiAgICAgICAgcGF0aDIgPSBwYXRoMmN1cnZlKHBhdGgyKTtcbiAgICAgICAgdmFyIHgxLCB5MSwgeDIsIHkyLCB4MW0sIHkxbSwgeDJtLCB5Mm0sIGJlejEsIGJlejIsXG4gICAgICAgICAgICByZXMgPSBqdXN0Q291bnQgPyAwIDogW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IHBhdGgxLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBwaSA9IHBhdGgxW2ldO1xuICAgICAgICAgICAgaWYgKHBpWzBdID09IFwiTVwiKSB7XG4gICAgICAgICAgICAgICAgeDEgPSB4MW0gPSBwaVsxXTtcbiAgICAgICAgICAgICAgICB5MSA9IHkxbSA9IHBpWzJdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAocGlbMF0gPT0gXCJDXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgYmV6MSA9IFt4MSwgeTFdLmNvbmNhdChwaS5zbGljZSgxKSk7XG4gICAgICAgICAgICAgICAgICAgIHgxID0gYmV6MVs2XTtcbiAgICAgICAgICAgICAgICAgICAgeTEgPSBiZXoxWzddO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGJlejEgPSBbeDEsIHkxLCB4MSwgeTEsIHgxbSwgeTFtLCB4MW0sIHkxbV07XG4gICAgICAgICAgICAgICAgICAgIHgxID0geDFtO1xuICAgICAgICAgICAgICAgICAgICB5MSA9IHkxbTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDAsIGpqID0gcGF0aDIubGVuZ3RoOyBqIDwgamo7IGorKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcGogPSBwYXRoMltqXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBqWzBdID09IFwiTVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB4MiA9IHgybSA9IHBqWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgeTIgPSB5Mm0gPSBwalsyXTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwalswXSA9PSBcIkNcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJlejIgPSBbeDIsIHkyXS5jb25jYXQocGouc2xpY2UoMSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHgyID0gYmV6Mls2XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB5MiA9IGJlejJbN107XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJlejIgPSBbeDIsIHkyLCB4MiwgeTIsIHgybSwgeTJtLCB4Mm0sIHkybV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeDIgPSB4Mm07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeTIgPSB5Mm07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaW50ciA9IGludGVySGVscGVyKGJlejEsIGJlejIsIGp1c3RDb3VudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoanVzdENvdW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzICs9IGludHI7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGsgPSAwLCBrayA9IGludHIubGVuZ3RoOyBrIDwga2s7IGsrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnRyW2tdLnNlZ21lbnQxID0gaTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW50cltrXS5zZWdtZW50MiA9IGo7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludHJba10uYmV6MSA9IGJlejE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludHJba10uYmV6MiA9IGJlejI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcyA9IHJlcy5jb25jYXQoaW50cik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG4gICAgZnVuY3Rpb24gaXNQb2ludEluc2lkZVBhdGgocGF0aCwgeCwgeSkge1xuICAgICAgICB2YXIgYmJveCA9IHBhdGhCQm94KHBhdGgpO1xuICAgICAgICByZXR1cm4gaXNQb2ludEluc2lkZUJCb3goYmJveCwgeCwgeSkgJiZcbiAgICAgICAgICAgICAgIGludGVyUGF0aEhlbHBlcihwYXRoLCBbW1wiTVwiLCB4LCB5XSwgW1wiSFwiLCBiYm94LngyICsgMTBdXSwgMSkgJSAyID09IDE7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHBhdGhCQm94KHBhdGgpIHtcbiAgICAgICAgdmFyIHB0aCA9IHBhdGhzKHBhdGgpO1xuICAgICAgICBpZiAocHRoLmJib3gpIHtcbiAgICAgICAgICAgIHJldHVybiBjbG9uZShwdGguYmJveCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFwYXRoKSB7XG4gICAgICAgICAgICByZXR1cm4gYm94KCk7XG4gICAgICAgIH1cbiAgICAgICAgcGF0aCA9IHBhdGgyY3VydmUocGF0aCk7XG4gICAgICAgIHZhciB4ID0gMCwgXG4gICAgICAgICAgICB5ID0gMCxcbiAgICAgICAgICAgIFggPSBbXSxcbiAgICAgICAgICAgIFkgPSBbXSxcbiAgICAgICAgICAgIHA7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IHBhdGgubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgcCA9IHBhdGhbaV07XG4gICAgICAgICAgICBpZiAocFswXSA9PSBcIk1cIikge1xuICAgICAgICAgICAgICAgIHggPSBwWzFdO1xuICAgICAgICAgICAgICAgIHkgPSBwWzJdO1xuICAgICAgICAgICAgICAgIFgucHVzaCh4KTtcbiAgICAgICAgICAgICAgICBZLnB1c2goeSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBkaW0gPSBjdXJ2ZURpbSh4LCB5LCBwWzFdLCBwWzJdLCBwWzNdLCBwWzRdLCBwWzVdLCBwWzZdKTtcbiAgICAgICAgICAgICAgICBYID0gWC5jb25jYXQoZGltLm1pbi54LCBkaW0ubWF4LngpO1xuICAgICAgICAgICAgICAgIFkgPSBZLmNvbmNhdChkaW0ubWluLnksIGRpbS5tYXgueSk7XG4gICAgICAgICAgICAgICAgeCA9IHBbNV07XG4gICAgICAgICAgICAgICAgeSA9IHBbNl07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHhtaW4gPSBtbWluLmFwcGx5KDAsIFgpLFxuICAgICAgICAgICAgeW1pbiA9IG1taW4uYXBwbHkoMCwgWSksXG4gICAgICAgICAgICB4bWF4ID0gbW1heC5hcHBseSgwLCBYKSxcbiAgICAgICAgICAgIHltYXggPSBtbWF4LmFwcGx5KDAsIFkpLFxuICAgICAgICAgICAgYmIgPSBib3goeG1pbiwgeW1pbiwgeG1heCAtIHhtaW4sIHltYXggLSB5bWluKTtcbiAgICAgICAgcHRoLmJib3ggPSBjbG9uZShiYik7XG4gICAgICAgIHJldHVybiBiYjtcbiAgICB9XG4gICAgZnVuY3Rpb24gcmVjdFBhdGgoeCwgeSwgdywgaCwgcikge1xuICAgICAgICBpZiAocikge1xuICAgICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgICBbXCJNXCIsICt4ICsgKCtyKSwgeV0sXG4gICAgICAgICAgICAgICAgW1wibFwiLCB3IC0gciAqIDIsIDBdLFxuICAgICAgICAgICAgICAgIFtcImFcIiwgciwgciwgMCwgMCwgMSwgciwgcl0sXG4gICAgICAgICAgICAgICAgW1wibFwiLCAwLCBoIC0gciAqIDJdLFxuICAgICAgICAgICAgICAgIFtcImFcIiwgciwgciwgMCwgMCwgMSwgLXIsIHJdLFxuICAgICAgICAgICAgICAgIFtcImxcIiwgciAqIDIgLSB3LCAwXSxcbiAgICAgICAgICAgICAgICBbXCJhXCIsIHIsIHIsIDAsIDAsIDEsIC1yLCAtcl0sXG4gICAgICAgICAgICAgICAgW1wibFwiLCAwLCByICogMiAtIGhdLFxuICAgICAgICAgICAgICAgIFtcImFcIiwgciwgciwgMCwgMCwgMSwgciwgLXJdLFxuICAgICAgICAgICAgICAgIFtcInpcIl1cbiAgICAgICAgICAgIF07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHJlcyA9IFtbXCJNXCIsIHgsIHldLCBbXCJsXCIsIHcsIDBdLCBbXCJsXCIsIDAsIGhdLCBbXCJsXCIsIC13LCAwXSwgW1wielwiXV07XG4gICAgICAgIHJlcy50b1N0cmluZyA9IHRvU3RyaW5nO1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cbiAgICBmdW5jdGlvbiBlbGxpcHNlUGF0aCh4LCB5LCByeCwgcnksIGEpIHtcbiAgICAgICAgaWYgKGEgPT0gbnVsbCAmJiByeSA9PSBudWxsKSB7XG4gICAgICAgICAgICByeSA9IHJ4O1xuICAgICAgICB9XG4gICAgICAgIHggPSAreDtcbiAgICAgICAgeSA9ICt5O1xuICAgICAgICByeCA9ICtyeDtcbiAgICAgICAgcnkgPSArcnk7XG4gICAgICAgIGlmIChhICE9IG51bGwpIHtcbiAgICAgICAgICAgIHZhciByYWQgPSBNYXRoLlBJIC8gMTgwLFxuICAgICAgICAgICAgICAgIHgxID0geCArIHJ4ICogTWF0aC5jb3MoLXJ5ICogcmFkKSxcbiAgICAgICAgICAgICAgICB4MiA9IHggKyByeCAqIE1hdGguY29zKC1hICogcmFkKSxcbiAgICAgICAgICAgICAgICB5MSA9IHkgKyByeCAqIE1hdGguc2luKC1yeSAqIHJhZCksXG4gICAgICAgICAgICAgICAgeTIgPSB5ICsgcnggKiBNYXRoLnNpbigtYSAqIHJhZCksXG4gICAgICAgICAgICAgICAgcmVzID0gW1tcIk1cIiwgeDEsIHkxXSwgW1wiQVwiLCByeCwgcngsIDAsICsoYSAtIHJ5ID4gMTgwKSwgMCwgeDIsIHkyXV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXMgPSBbXG4gICAgICAgICAgICAgICAgW1wiTVwiLCB4LCB5XSxcbiAgICAgICAgICAgICAgICBbXCJtXCIsIDAsIC1yeV0sXG4gICAgICAgICAgICAgICAgW1wiYVwiLCByeCwgcnksIDAsIDEsIDEsIDAsIDIgKiByeV0sXG4gICAgICAgICAgICAgICAgW1wiYVwiLCByeCwgcnksIDAsIDEsIDEsIDAsIC0yICogcnldLFxuICAgICAgICAgICAgICAgIFtcInpcIl1cbiAgICAgICAgICAgIF07XG4gICAgICAgIH1cbiAgICAgICAgcmVzLnRvU3RyaW5nID0gdG9TdHJpbmc7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuICAgIHZhciB1bml0MnB4ID0gU25hcC5fdW5pdDJweCxcbiAgICAgICAgZ2V0UGF0aCA9IHtcbiAgICAgICAgcGF0aDogZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICByZXR1cm4gZWwuYXR0cihcInBhdGhcIik7XG4gICAgICAgIH0sXG4gICAgICAgIGNpcmNsZTogZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICB2YXIgYXR0ciA9IHVuaXQycHgoZWwpO1xuICAgICAgICAgICAgcmV0dXJuIGVsbGlwc2VQYXRoKGF0dHIuY3gsIGF0dHIuY3ksIGF0dHIucik7XG4gICAgICAgIH0sXG4gICAgICAgIGVsbGlwc2U6IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgdmFyIGF0dHIgPSB1bml0MnB4KGVsKTtcbiAgICAgICAgICAgIHJldHVybiBlbGxpcHNlUGF0aChhdHRyLmN4IHx8IDAsIGF0dHIuY3kgfHwgMCwgYXR0ci5yeCwgYXR0ci5yeSk7XG4gICAgICAgIH0sXG4gICAgICAgIHJlY3Q6IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgdmFyIGF0dHIgPSB1bml0MnB4KGVsKTtcbiAgICAgICAgICAgIHJldHVybiByZWN0UGF0aChhdHRyLnggfHwgMCwgYXR0ci55IHx8IDAsIGF0dHIud2lkdGgsIGF0dHIuaGVpZ2h0LCBhdHRyLnJ4LCBhdHRyLnJ5KTtcbiAgICAgICAgfSxcbiAgICAgICAgaW1hZ2U6IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgdmFyIGF0dHIgPSB1bml0MnB4KGVsKTtcbiAgICAgICAgICAgIHJldHVybiByZWN0UGF0aChhdHRyLnggfHwgMCwgYXR0ci55IHx8IDAsIGF0dHIud2lkdGgsIGF0dHIuaGVpZ2h0KTtcbiAgICAgICAgfSxcbiAgICAgICAgbGluZTogZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJNXCIgKyBbZWwuYXR0cihcIngxXCIpIHx8IDAsIGVsLmF0dHIoXCJ5MVwiKSB8fCAwLCBlbC5hdHRyKFwieDJcIiksIGVsLmF0dHIoXCJ5MlwiKV07XG4gICAgICAgIH0sXG4gICAgICAgIHBvbHlsaW5lOiBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgIHJldHVybiBcIk1cIiArIGVsLmF0dHIoXCJwb2ludHNcIik7XG4gICAgICAgIH0sXG4gICAgICAgIHBvbHlnb246IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgcmV0dXJuIFwiTVwiICsgZWwuYXR0cihcInBvaW50c1wiKSArIFwielwiO1xuICAgICAgICB9LFxuICAgICAgICBkZWZsdDogZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICB2YXIgYmJveCA9IGVsLm5vZGUuZ2V0QkJveCgpO1xuICAgICAgICAgICAgcmV0dXJuIHJlY3RQYXRoKGJib3gueCwgYmJveC55LCBiYm94LndpZHRoLCBiYm94LmhlaWdodCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIGZ1bmN0aW9uIHBhdGhUb1JlbGF0aXZlKHBhdGhBcnJheSkge1xuICAgICAgICB2YXIgcHRoID0gcGF0aHMocGF0aEFycmF5KSxcbiAgICAgICAgICAgIGxvd2VyQ2FzZSA9IFN0cmluZy5wcm90b3R5cGUudG9Mb3dlckNhc2U7XG4gICAgICAgIGlmIChwdGgucmVsKSB7XG4gICAgICAgICAgICByZXR1cm4gcGF0aENsb25lKHB0aC5yZWwpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghU25hcC5pcyhwYXRoQXJyYXksIFwiYXJyYXlcIikgfHwgIVNuYXAuaXMocGF0aEFycmF5ICYmIHBhdGhBcnJheVswXSwgXCJhcnJheVwiKSkge1xuICAgICAgICAgICAgcGF0aEFycmF5ID0gU25hcC5wYXJzZVBhdGhTdHJpbmcocGF0aEFycmF5KTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmVzID0gW10sXG4gICAgICAgICAgICB4ID0gMCxcbiAgICAgICAgICAgIHkgPSAwLFxuICAgICAgICAgICAgbXggPSAwLFxuICAgICAgICAgICAgbXkgPSAwLFxuICAgICAgICAgICAgc3RhcnQgPSAwO1xuICAgICAgICBpZiAocGF0aEFycmF5WzBdWzBdID09IFwiTVwiKSB7XG4gICAgICAgICAgICB4ID0gcGF0aEFycmF5WzBdWzFdO1xuICAgICAgICAgICAgeSA9IHBhdGhBcnJheVswXVsyXTtcbiAgICAgICAgICAgIG14ID0geDtcbiAgICAgICAgICAgIG15ID0geTtcbiAgICAgICAgICAgIHN0YXJ0Kys7XG4gICAgICAgICAgICByZXMucHVzaChbXCJNXCIsIHgsIHldKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBpID0gc3RhcnQsIGlpID0gcGF0aEFycmF5Lmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIHZhciByID0gcmVzW2ldID0gW10sXG4gICAgICAgICAgICAgICAgcGEgPSBwYXRoQXJyYXlbaV07XG4gICAgICAgICAgICBpZiAocGFbMF0gIT0gbG93ZXJDYXNlLmNhbGwocGFbMF0pKSB7XG4gICAgICAgICAgICAgICAgclswXSA9IGxvd2VyQ2FzZS5jYWxsKHBhWzBdKTtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHJbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImFcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJbMV0gPSBwYVsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJbMl0gPSBwYVsyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJbM10gPSBwYVszXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJbNF0gPSBwYVs0XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJbNV0gPSBwYVs1XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJbNl0gPSArKHBhWzZdIC0geCkudG9GaXhlZCgzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJbN10gPSArKHBhWzddIC0geSkudG9GaXhlZCgzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwidlwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgclsxXSA9ICsocGFbMV0gLSB5KS50b0ZpeGVkKDMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJtXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBteCA9IHBhWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgbXkgPSBwYVsyXTtcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAxLCBqaiA9IHBhLmxlbmd0aDsgaiA8IGpqOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByW2pdID0gKyhwYVtqXSAtICgoaiAlIDIpID8geCA6IHkpKS50b0ZpeGVkKDMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgciA9IHJlc1tpXSA9IFtdO1xuICAgICAgICAgICAgICAgIGlmIChwYVswXSA9PSBcIm1cIikge1xuICAgICAgICAgICAgICAgICAgICBteCA9IHBhWzFdICsgeDtcbiAgICAgICAgICAgICAgICAgICAgbXkgPSBwYVsyXSArIHk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZvciAodmFyIGsgPSAwLCBrayA9IHBhLmxlbmd0aDsgayA8IGtrOyBrKyspIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzW2ldW2tdID0gcGFba107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGxlbiA9IHJlc1tpXS5sZW5ndGg7XG4gICAgICAgICAgICBzd2l0Y2ggKHJlc1tpXVswXSkge1xuICAgICAgICAgICAgICAgIGNhc2UgXCJ6XCI6XG4gICAgICAgICAgICAgICAgICAgIHggPSBteDtcbiAgICAgICAgICAgICAgICAgICAgeSA9IG15O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiaFwiOlxuICAgICAgICAgICAgICAgICAgICB4ICs9ICtyZXNbaV1bbGVuIC0gMV07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJ2XCI6XG4gICAgICAgICAgICAgICAgICAgIHkgKz0gK3Jlc1tpXVtsZW4gLSAxXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgeCArPSArcmVzW2ldW2xlbiAtIDJdO1xuICAgICAgICAgICAgICAgICAgICB5ICs9ICtyZXNbaV1bbGVuIC0gMV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmVzLnRvU3RyaW5nID0gdG9TdHJpbmc7XG4gICAgICAgIHB0aC5yZWwgPSBwYXRoQ2xvbmUocmVzKTtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG4gICAgZnVuY3Rpb24gcGF0aFRvQWJzb2x1dGUocGF0aEFycmF5KSB7XG4gICAgICAgIHZhciBwdGggPSBwYXRocyhwYXRoQXJyYXkpO1xuICAgICAgICBpZiAocHRoLmFicykge1xuICAgICAgICAgICAgcmV0dXJuIHBhdGhDbG9uZShwdGguYWJzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlzKHBhdGhBcnJheSwgXCJhcnJheVwiKSB8fCAhaXMocGF0aEFycmF5ICYmIHBhdGhBcnJheVswXSwgXCJhcnJheVwiKSkgeyAvLyByb3VnaCBhc3N1bXB0aW9uXG4gICAgICAgICAgICBwYXRoQXJyYXkgPSBTbmFwLnBhcnNlUGF0aFN0cmluZyhwYXRoQXJyYXkpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghcGF0aEFycmF5IHx8ICFwYXRoQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gW1tcIk1cIiwgMCwgMF1dO1xuICAgICAgICB9XG4gICAgICAgIHZhciByZXMgPSBbXSxcbiAgICAgICAgICAgIHggPSAwLFxuICAgICAgICAgICAgeSA9IDAsXG4gICAgICAgICAgICBteCA9IDAsXG4gICAgICAgICAgICBteSA9IDAsXG4gICAgICAgICAgICBzdGFydCA9IDAsXG4gICAgICAgICAgICBwYTA7XG4gICAgICAgIGlmIChwYXRoQXJyYXlbMF1bMF0gPT0gXCJNXCIpIHtcbiAgICAgICAgICAgIHggPSArcGF0aEFycmF5WzBdWzFdO1xuICAgICAgICAgICAgeSA9ICtwYXRoQXJyYXlbMF1bMl07XG4gICAgICAgICAgICBteCA9IHg7XG4gICAgICAgICAgICBteSA9IHk7XG4gICAgICAgICAgICBzdGFydCsrO1xuICAgICAgICAgICAgcmVzWzBdID0gW1wiTVwiLCB4LCB5XTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgY3J6ID0gcGF0aEFycmF5Lmxlbmd0aCA9PSAzICYmXG4gICAgICAgICAgICBwYXRoQXJyYXlbMF1bMF0gPT0gXCJNXCIgJiZcbiAgICAgICAgICAgIHBhdGhBcnJheVsxXVswXS50b1VwcGVyQ2FzZSgpID09IFwiUlwiICYmXG4gICAgICAgICAgICBwYXRoQXJyYXlbMl1bMF0udG9VcHBlckNhc2UoKSA9PSBcIlpcIjtcbiAgICAgICAgZm9yICh2YXIgciwgcGEsIGkgPSBzdGFydCwgaWkgPSBwYXRoQXJyYXkubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgcmVzLnB1c2gociA9IFtdKTtcbiAgICAgICAgICAgIHBhID0gcGF0aEFycmF5W2ldO1xuICAgICAgICAgICAgcGEwID0gcGFbMF07XG4gICAgICAgICAgICBpZiAocGEwICE9IHBhMC50b1VwcGVyQ2FzZSgpKSB7XG4gICAgICAgICAgICAgICAgclswXSA9IHBhMC50b1VwcGVyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoclswXSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiQVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgclsxXSA9IHBhWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgclsyXSA9IHBhWzJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgclszXSA9IHBhWzNdO1xuICAgICAgICAgICAgICAgICAgICAgICAgcls0XSA9IHBhWzRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgcls1XSA9IHBhWzVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgcls2XSA9ICtwYVs2XSArIHg7XG4gICAgICAgICAgICAgICAgICAgICAgICByWzddID0gK3BhWzddICsgeTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiVlwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgclsxXSA9ICtwYVsxXSArIHk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkhcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJbMV0gPSArcGFbMV0gKyB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJSXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZG90cyA9IFt4LCB5XS5jb25jYXQocGEuc2xpY2UoMSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDIsIGpqID0gZG90cy5sZW5ndGg7IGogPCBqajsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZG90c1tqXSA9ICtkb3RzW2pdICsgeDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb3RzWysral0gPSArZG90c1tqXSArIHk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXMucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXMgPSByZXMuY29uY2F0KGNhdG11bGxSb20yYmV6aWVyKGRvdHMsIGNyeikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJPXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICByZXMucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb3RzID0gZWxsaXBzZVBhdGgoeCwgeSwgcGFbMV0sIHBhWzJdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvdHMucHVzaChkb3RzWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcyA9IHJlcy5jb25jYXQoZG90cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlVcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcyA9IHJlcy5jb25jYXQoZWxsaXBzZVBhdGgoeCwgeSwgcGFbMV0sIHBhWzJdLCBwYVszXSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgciA9IFtcIlVcIl0uY29uY2F0KHJlc1tyZXMubGVuZ3RoIC0gMV0uc2xpY2UoLTIpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiTVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgbXggPSArcGFbMV0gKyB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgbXkgPSArcGFbMl0gKyB5O1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChqID0gMSwgamogPSBwYS5sZW5ndGg7IGogPCBqajsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcltqXSA9ICtwYVtqXSArICgoaiAlIDIpID8geCA6IHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAocGEwID09IFwiUlwiKSB7XG4gICAgICAgICAgICAgICAgZG90cyA9IFt4LCB5XS5jb25jYXQocGEuc2xpY2UoMSkpO1xuICAgICAgICAgICAgICAgIHJlcy5wb3AoKTtcbiAgICAgICAgICAgICAgICByZXMgPSByZXMuY29uY2F0KGNhdG11bGxSb20yYmV6aWVyKGRvdHMsIGNyeikpO1xuICAgICAgICAgICAgICAgIHIgPSBbXCJSXCJdLmNvbmNhdChwYS5zbGljZSgtMikpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChwYTAgPT0gXCJPXCIpIHtcbiAgICAgICAgICAgICAgICByZXMucG9wKCk7XG4gICAgICAgICAgICAgICAgZG90cyA9IGVsbGlwc2VQYXRoKHgsIHksIHBhWzFdLCBwYVsyXSk7XG4gICAgICAgICAgICAgICAgZG90cy5wdXNoKGRvdHNbMF0pO1xuICAgICAgICAgICAgICAgIHJlcyA9IHJlcy5jb25jYXQoZG90cyk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHBhMCA9PSBcIlVcIikge1xuICAgICAgICAgICAgICAgIHJlcy5wb3AoKTtcbiAgICAgICAgICAgICAgICByZXMgPSByZXMuY29uY2F0KGVsbGlwc2VQYXRoKHgsIHksIHBhWzFdLCBwYVsyXSwgcGFbM10pKTtcbiAgICAgICAgICAgICAgICByID0gW1wiVVwiXS5jb25jYXQocmVzW3Jlcy5sZW5ndGggLSAxXS5zbGljZSgtMikpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrID0gMCwga2sgPSBwYS5sZW5ndGg7IGsgPCBrazsgaysrKSB7XG4gICAgICAgICAgICAgICAgICAgIHJba10gPSBwYVtrXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwYTAgPSBwYTAudG9VcHBlckNhc2UoKTtcbiAgICAgICAgICAgIGlmIChwYTAgIT0gXCJPXCIpIHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHJbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlpcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHggPSArbXg7XG4gICAgICAgICAgICAgICAgICAgICAgICB5ID0gK215O1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJIXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICB4ID0gclsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiVlwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgeSA9IHJbMV07XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIk1cIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIG14ID0gcltyLmxlbmd0aCAtIDJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgbXkgPSByW3IubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICB4ID0gcltyLmxlbmd0aCAtIDJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgeSA9IHJbci5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmVzLnRvU3RyaW5nID0gdG9TdHJpbmc7XG4gICAgICAgIHB0aC5hYnMgPSBwYXRoQ2xvbmUocmVzKTtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG4gICAgZnVuY3Rpb24gbDJjKHgxLCB5MSwgeDIsIHkyKSB7XG4gICAgICAgIHJldHVybiBbeDEsIHkxLCB4MiwgeTIsIHgyLCB5Ml07XG4gICAgfVxuICAgIGZ1bmN0aW9uIHEyYyh4MSwgeTEsIGF4LCBheSwgeDIsIHkyKSB7XG4gICAgICAgIHZhciBfMTMgPSAxIC8gMyxcbiAgICAgICAgICAgIF8yMyA9IDIgLyAzO1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgIF8xMyAqIHgxICsgXzIzICogYXgsXG4gICAgICAgICAgICAgICAgXzEzICogeTEgKyBfMjMgKiBheSxcbiAgICAgICAgICAgICAgICBfMTMgKiB4MiArIF8yMyAqIGF4LFxuICAgICAgICAgICAgICAgIF8xMyAqIHkyICsgXzIzICogYXksXG4gICAgICAgICAgICAgICAgeDIsXG4gICAgICAgICAgICAgICAgeTJcbiAgICAgICAgICAgIF07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGEyYyh4MSwgeTEsIHJ4LCByeSwgYW5nbGUsIGxhcmdlX2FyY19mbGFnLCBzd2VlcF9mbGFnLCB4MiwgeTIsIHJlY3Vyc2l2ZSkge1xuICAgICAgICAvLyBmb3IgbW9yZSBpbmZvcm1hdGlvbiBvZiB3aGVyZSB0aGlzIG1hdGggY2FtZSBmcm9tIHZpc2l0OlxuICAgICAgICAvLyBodHRwOi8vd3d3LnczLm9yZy9UUi9TVkcxMS9pbXBsbm90ZS5odG1sI0FyY0ltcGxlbWVudGF0aW9uTm90ZXNcbiAgICAgICAgdmFyIF8xMjAgPSBQSSAqIDEyMCAvIDE4MCxcbiAgICAgICAgICAgIHJhZCA9IFBJIC8gMTgwICogKCthbmdsZSB8fCAwKSxcbiAgICAgICAgICAgIHJlcyA9IFtdLFxuICAgICAgICAgICAgeHksXG4gICAgICAgICAgICByb3RhdGUgPSBTbmFwLl8uY2FjaGVyKGZ1bmN0aW9uICh4LCB5LCByYWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgWCA9IHggKiBtYXRoLmNvcyhyYWQpIC0geSAqIG1hdGguc2luKHJhZCksXG4gICAgICAgICAgICAgICAgICAgIFkgPSB4ICogbWF0aC5zaW4ocmFkKSArIHkgKiBtYXRoLmNvcyhyYWQpO1xuICAgICAgICAgICAgICAgIHJldHVybiB7eDogWCwgeTogWX07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgaWYgKCFyZWN1cnNpdmUpIHtcbiAgICAgICAgICAgIHh5ID0gcm90YXRlKHgxLCB5MSwgLXJhZCk7XG4gICAgICAgICAgICB4MSA9IHh5Lng7XG4gICAgICAgICAgICB5MSA9IHh5Lnk7XG4gICAgICAgICAgICB4eSA9IHJvdGF0ZSh4MiwgeTIsIC1yYWQpO1xuICAgICAgICAgICAgeDIgPSB4eS54O1xuICAgICAgICAgICAgeTIgPSB4eS55O1xuICAgICAgICAgICAgdmFyIGNvcyA9IG1hdGguY29zKFBJIC8gMTgwICogYW5nbGUpLFxuICAgICAgICAgICAgICAgIHNpbiA9IG1hdGguc2luKFBJIC8gMTgwICogYW5nbGUpLFxuICAgICAgICAgICAgICAgIHggPSAoeDEgLSB4MikgLyAyLFxuICAgICAgICAgICAgICAgIHkgPSAoeTEgLSB5MikgLyAyO1xuICAgICAgICAgICAgdmFyIGggPSAoeCAqIHgpIC8gKHJ4ICogcngpICsgKHkgKiB5KSAvIChyeSAqIHJ5KTtcbiAgICAgICAgICAgIGlmIChoID4gMSkge1xuICAgICAgICAgICAgICAgIGggPSBtYXRoLnNxcnQoaCk7XG4gICAgICAgICAgICAgICAgcnggPSBoICogcng7XG4gICAgICAgICAgICAgICAgcnkgPSBoICogcnk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgcngyID0gcnggKiByeCxcbiAgICAgICAgICAgICAgICByeTIgPSByeSAqIHJ5LFxuICAgICAgICAgICAgICAgIGsgPSAobGFyZ2VfYXJjX2ZsYWcgPT0gc3dlZXBfZmxhZyA/IC0xIDogMSkgKlxuICAgICAgICAgICAgICAgICAgICBtYXRoLnNxcnQoYWJzKChyeDIgKiByeTIgLSByeDIgKiB5ICogeSAtIHJ5MiAqIHggKiB4KSAvIChyeDIgKiB5ICogeSArIHJ5MiAqIHggKiB4KSkpLFxuICAgICAgICAgICAgICAgIGN4ID0gayAqIHJ4ICogeSAvIHJ5ICsgKHgxICsgeDIpIC8gMixcbiAgICAgICAgICAgICAgICBjeSA9IGsgKiAtcnkgKiB4IC8gcnggKyAoeTEgKyB5MikgLyAyLFxuICAgICAgICAgICAgICAgIGYxID0gbWF0aC5hc2luKCgoeTEgLSBjeSkgLyByeSkudG9GaXhlZCg5KSksXG4gICAgICAgICAgICAgICAgZjIgPSBtYXRoLmFzaW4oKCh5MiAtIGN5KSAvIHJ5KS50b0ZpeGVkKDkpKTtcblxuICAgICAgICAgICAgZjEgPSB4MSA8IGN4ID8gUEkgLSBmMSA6IGYxO1xuICAgICAgICAgICAgZjIgPSB4MiA8IGN4ID8gUEkgLSBmMiA6IGYyO1xuICAgICAgICAgICAgZjEgPCAwICYmIChmMSA9IFBJICogMiArIGYxKTtcbiAgICAgICAgICAgIGYyIDwgMCAmJiAoZjIgPSBQSSAqIDIgKyBmMik7XG4gICAgICAgICAgICBpZiAoc3dlZXBfZmxhZyAmJiBmMSA+IGYyKSB7XG4gICAgICAgICAgICAgICAgZjEgPSBmMSAtIFBJICogMjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghc3dlZXBfZmxhZyAmJiBmMiA+IGYxKSB7XG4gICAgICAgICAgICAgICAgZjIgPSBmMiAtIFBJICogMjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGYxID0gcmVjdXJzaXZlWzBdO1xuICAgICAgICAgICAgZjIgPSByZWN1cnNpdmVbMV07XG4gICAgICAgICAgICBjeCA9IHJlY3Vyc2l2ZVsyXTtcbiAgICAgICAgICAgIGN5ID0gcmVjdXJzaXZlWzNdO1xuICAgICAgICB9XG4gICAgICAgIHZhciBkZiA9IGYyIC0gZjE7XG4gICAgICAgIGlmIChhYnMoZGYpID4gXzEyMCkge1xuICAgICAgICAgICAgdmFyIGYyb2xkID0gZjIsXG4gICAgICAgICAgICAgICAgeDJvbGQgPSB4MixcbiAgICAgICAgICAgICAgICB5Mm9sZCA9IHkyO1xuICAgICAgICAgICAgZjIgPSBmMSArIF8xMjAgKiAoc3dlZXBfZmxhZyAmJiBmMiA+IGYxID8gMSA6IC0xKTtcbiAgICAgICAgICAgIHgyID0gY3ggKyByeCAqIG1hdGguY29zKGYyKTtcbiAgICAgICAgICAgIHkyID0gY3kgKyByeSAqIG1hdGguc2luKGYyKTtcbiAgICAgICAgICAgIHJlcyA9IGEyYyh4MiwgeTIsIHJ4LCByeSwgYW5nbGUsIDAsIHN3ZWVwX2ZsYWcsIHgyb2xkLCB5Mm9sZCwgW2YyLCBmMm9sZCwgY3gsIGN5XSk7XG4gICAgICAgIH1cbiAgICAgICAgZGYgPSBmMiAtIGYxO1xuICAgICAgICB2YXIgYzEgPSBtYXRoLmNvcyhmMSksXG4gICAgICAgICAgICBzMSA9IG1hdGguc2luKGYxKSxcbiAgICAgICAgICAgIGMyID0gbWF0aC5jb3MoZjIpLFxuICAgICAgICAgICAgczIgPSBtYXRoLnNpbihmMiksXG4gICAgICAgICAgICB0ID0gbWF0aC50YW4oZGYgLyA0KSxcbiAgICAgICAgICAgIGh4ID0gNCAvIDMgKiByeCAqIHQsXG4gICAgICAgICAgICBoeSA9IDQgLyAzICogcnkgKiB0LFxuICAgICAgICAgICAgbTEgPSBbeDEsIHkxXSxcbiAgICAgICAgICAgIG0yID0gW3gxICsgaHggKiBzMSwgeTEgLSBoeSAqIGMxXSxcbiAgICAgICAgICAgIG0zID0gW3gyICsgaHggKiBzMiwgeTIgLSBoeSAqIGMyXSxcbiAgICAgICAgICAgIG00ID0gW3gyLCB5Ml07XG4gICAgICAgIG0yWzBdID0gMiAqIG0xWzBdIC0gbTJbMF07XG4gICAgICAgIG0yWzFdID0gMiAqIG0xWzFdIC0gbTJbMV07XG4gICAgICAgIGlmIChyZWN1cnNpdmUpIHtcbiAgICAgICAgICAgIHJldHVybiBbbTIsIG0zLCBtNF0uY29uY2F0KHJlcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXMgPSBbbTIsIG0zLCBtNF0uY29uY2F0KHJlcykuam9pbigpLnNwbGl0KFwiLFwiKTtcbiAgICAgICAgICAgIHZhciBuZXdyZXMgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IHJlcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgbmV3cmVzW2ldID0gaSAlIDIgPyByb3RhdGUocmVzW2kgLSAxXSwgcmVzW2ldLCByYWQpLnkgOiByb3RhdGUocmVzW2ldLCByZXNbaSArIDFdLCByYWQpLng7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbmV3cmVzO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIGZpbmREb3RBdFNlZ21lbnQocDF4LCBwMXksIGMxeCwgYzF5LCBjMngsIGMyeSwgcDJ4LCBwMnksIHQpIHtcbiAgICAgICAgdmFyIHQxID0gMSAtIHQ7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB4OiBwb3codDEsIDMpICogcDF4ICsgcG93KHQxLCAyKSAqIDMgKiB0ICogYzF4ICsgdDEgKiAzICogdCAqIHQgKiBjMnggKyBwb3codCwgMykgKiBwMngsXG4gICAgICAgICAgICB5OiBwb3codDEsIDMpICogcDF5ICsgcG93KHQxLCAyKSAqIDMgKiB0ICogYzF5ICsgdDEgKiAzICogdCAqIHQgKiBjMnkgKyBwb3codCwgMykgKiBwMnlcbiAgICAgICAgfTtcbiAgICB9XG4gICAgXG4gICAgLy8gUmV0dXJucyBib3VuZGluZyBib3ggb2YgY3ViaWMgYmV6aWVyIGN1cnZlLlxuICAgIC8vIFNvdXJjZTogaHR0cDovL2Jsb2cuaGFja2Vycy1jYWZlLm5ldC8yMDA5LzA2L2hvdy10by1jYWxjdWxhdGUtYmV6aWVyLWN1cnZlcy1ib3VuZGluZy5odG1sXG4gICAgLy8gT3JpZ2luYWwgdmVyc2lvbjogTklTSElPIEhpcm9rYXp1XG4gICAgLy8gTW9kaWZpY2F0aW9uczogaHR0cHM6Ly9naXRodWIuY29tL3RpbW8yMjM0NVxuICAgIGZ1bmN0aW9uIGN1cnZlRGltKHgwLCB5MCwgeDEsIHkxLCB4MiwgeTIsIHgzLCB5Mykge1xuICAgICAgICB2YXIgdHZhbHVlcyA9IFtdLFxuICAgICAgICAgICAgYm91bmRzID0gW1tdLCBbXV0sXG4gICAgICAgICAgICBhLCBiLCBjLCB0LCB0MSwgdDIsIGIyYWMsIHNxcnRiMmFjO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDI7ICsraSkge1xuICAgICAgICAgICAgaWYgKGkgPT0gMCkge1xuICAgICAgICAgICAgICAgIGIgPSA2ICogeDAgLSAxMiAqIHgxICsgNiAqIHgyO1xuICAgICAgICAgICAgICAgIGEgPSAtMyAqIHgwICsgOSAqIHgxIC0gOSAqIHgyICsgMyAqIHgzO1xuICAgICAgICAgICAgICAgIGMgPSAzICogeDEgLSAzICogeDA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGIgPSA2ICogeTAgLSAxMiAqIHkxICsgNiAqIHkyO1xuICAgICAgICAgICAgICAgIGEgPSAtMyAqIHkwICsgOSAqIHkxIC0gOSAqIHkyICsgMyAqIHkzO1xuICAgICAgICAgICAgICAgIGMgPSAzICogeTEgLSAzICogeTA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYWJzKGEpIDwgMWUtMTIpIHtcbiAgICAgICAgICAgICAgICBpZiAoYWJzKGIpIDwgMWUtMTIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHQgPSAtYyAvIGI7XG4gICAgICAgICAgICAgICAgaWYgKDAgPCB0ICYmIHQgPCAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHR2YWx1ZXMucHVzaCh0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBiMmFjID0gYiAqIGIgLSA0ICogYyAqIGE7XG4gICAgICAgICAgICBzcXJ0YjJhYyA9IG1hdGguc3FydChiMmFjKTtcbiAgICAgICAgICAgIGlmIChiMmFjIDwgMCkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdDEgPSAoLWIgKyBzcXJ0YjJhYykgLyAoMiAqIGEpO1xuICAgICAgICAgICAgaWYgKDAgPCB0MSAmJiB0MSA8IDEpIHtcbiAgICAgICAgICAgICAgICB0dmFsdWVzLnB1c2godDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdDIgPSAoLWIgLSBzcXJ0YjJhYykgLyAoMiAqIGEpO1xuICAgICAgICAgICAgaWYgKDAgPCB0MiAmJiB0MiA8IDEpIHtcbiAgICAgICAgICAgICAgICB0dmFsdWVzLnB1c2godDIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHgsIHksIGogPSB0dmFsdWVzLmxlbmd0aCxcbiAgICAgICAgICAgIGpsZW4gPSBqLFxuICAgICAgICAgICAgbXQ7XG4gICAgICAgIHdoaWxlIChqLS0pIHtcbiAgICAgICAgICAgIHQgPSB0dmFsdWVzW2pdO1xuICAgICAgICAgICAgbXQgPSAxIC0gdDtcbiAgICAgICAgICAgIGJvdW5kc1swXVtqXSA9IChtdCAqIG10ICogbXQgKiB4MCkgKyAoMyAqIG10ICogbXQgKiB0ICogeDEpICsgKDMgKiBtdCAqIHQgKiB0ICogeDIpICsgKHQgKiB0ICogdCAqIHgzKTtcbiAgICAgICAgICAgIGJvdW5kc1sxXVtqXSA9IChtdCAqIG10ICogbXQgKiB5MCkgKyAoMyAqIG10ICogbXQgKiB0ICogeTEpICsgKDMgKiBtdCAqIHQgKiB0ICogeTIpICsgKHQgKiB0ICogdCAqIHkzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGJvdW5kc1swXVtqbGVuXSA9IHgwO1xuICAgICAgICBib3VuZHNbMV1bamxlbl0gPSB5MDtcbiAgICAgICAgYm91bmRzWzBdW2psZW4gKyAxXSA9IHgzO1xuICAgICAgICBib3VuZHNbMV1bamxlbiArIDFdID0geTM7XG4gICAgICAgIGJvdW5kc1swXS5sZW5ndGggPSBib3VuZHNbMV0ubGVuZ3RoID0gamxlbiArIDI7XG5cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIG1pbjoge3g6IG1taW4uYXBwbHkoMCwgYm91bmRzWzBdKSwgeTogbW1pbi5hcHBseSgwLCBib3VuZHNbMV0pfSxcbiAgICAgICAgICBtYXg6IHt4OiBtbWF4LmFwcGx5KDAsIGJvdW5kc1swXSksIHk6IG1tYXguYXBwbHkoMCwgYm91bmRzWzFdKX1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXRoMmN1cnZlKHBhdGgsIHBhdGgyKSB7XG4gICAgICAgIHZhciBwdGggPSAhcGF0aDIgJiYgcGF0aHMocGF0aCk7XG4gICAgICAgIGlmICghcGF0aDIgJiYgcHRoLmN1cnZlKSB7XG4gICAgICAgICAgICByZXR1cm4gcGF0aENsb25lKHB0aC5jdXJ2ZSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHAgPSBwYXRoVG9BYnNvbHV0ZShwYXRoKSxcbiAgICAgICAgICAgIHAyID0gcGF0aDIgJiYgcGF0aFRvQWJzb2x1dGUocGF0aDIpLFxuICAgICAgICAgICAgYXR0cnMgPSB7eDogMCwgeTogMCwgYng6IDAsIGJ5OiAwLCBYOiAwLCBZOiAwLCBxeDogbnVsbCwgcXk6IG51bGx9LFxuICAgICAgICAgICAgYXR0cnMyID0ge3g6IDAsIHk6IDAsIGJ4OiAwLCBieTogMCwgWDogMCwgWTogMCwgcXg6IG51bGwsIHF5OiBudWxsfSxcbiAgICAgICAgICAgIHByb2Nlc3NQYXRoID0gZnVuY3Rpb24gKHBhdGgsIGQsIHBjb20pIHtcbiAgICAgICAgICAgICAgICB2YXIgbngsIG55O1xuICAgICAgICAgICAgICAgIGlmICghcGF0aCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW1wiQ1wiLCBkLngsIGQueSwgZC54LCBkLnksIGQueCwgZC55XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgIShwYXRoWzBdIGluIHtUOiAxLCBROiAxfSkgJiYgKGQucXggPSBkLnF5ID0gbnVsbCk7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChwYXRoWzBdKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJNXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBkLlggPSBwYXRoWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZC5ZID0gcGF0aFsyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiQVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aCA9IFtcIkNcIl0uY29uY2F0KGEyYy5hcHBseSgwLCBbZC54LCBkLnldLmNvbmNhdChwYXRoLnNsaWNlKDEpKSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJTXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGNvbSA9PSBcIkNcIiB8fCBwY29tID09IFwiU1wiKSB7IC8vIEluIFwiU1wiIGNhc2Ugd2UgaGF2ZSB0byB0YWtlIGludG8gYWNjb3VudCwgaWYgdGhlIHByZXZpb3VzIGNvbW1hbmQgaXMgQy9TLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG54ID0gZC54ICogMiAtIGQuYng7ICAgICAgICAgIC8vIEFuZCByZWZsZWN0IHRoZSBwcmV2aW91c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG55ID0gZC55ICogMiAtIGQuYnk7ICAgICAgICAgIC8vIGNvbW1hbmQncyBjb250cm9sIHBvaW50IHJlbGF0aXZlIHRvIHRoZSBjdXJyZW50IHBvaW50LlxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9yIHNvbWUgZWxzZSBvciBub3RoaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbnggPSBkLng7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbnkgPSBkLnk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoID0gW1wiQ1wiLCBueCwgbnldLmNvbmNhdChwYXRoLnNsaWNlKDEpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiVFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBjb20gPT0gXCJRXCIgfHwgcGNvbSA9PSBcIlRcIikgeyAvLyBJbiBcIlRcIiBjYXNlIHdlIGhhdmUgdG8gdGFrZSBpbnRvIGFjY291bnQsIGlmIHRoZSBwcmV2aW91cyBjb21tYW5kIGlzIFEvVC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkLnF4ID0gZC54ICogMiAtIGQucXg7ICAgICAgICAvLyBBbmQgbWFrZSBhIHJlZmxlY3Rpb24gc2ltaWxhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGQucXkgPSBkLnkgKiAyIC0gZC5xeTsgICAgICAgIC8vIHRvIGNhc2UgXCJTXCIuXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHsgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gb3Igc29tZXRoaW5nIGVsc2Ugb3Igbm90aGluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGQucXggPSBkLng7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZC5xeSA9IGQueTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGggPSBbXCJDXCJdLmNvbmNhdChxMmMoZC54LCBkLnksIGQucXgsIGQucXksIHBhdGhbMV0sIHBhdGhbMl0pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiUVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgZC5xeCA9IHBhdGhbMV07XG4gICAgICAgICAgICAgICAgICAgICAgICBkLnF5ID0gcGF0aFsyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGggPSBbXCJDXCJdLmNvbmNhdChxMmMoZC54LCBkLnksIHBhdGhbMV0sIHBhdGhbMl0sIHBhdGhbM10sIHBhdGhbNF0pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiTFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aCA9IFtcIkNcIl0uY29uY2F0KGwyYyhkLngsIGQueSwgcGF0aFsxXSwgcGF0aFsyXSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJIXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoID0gW1wiQ1wiXS5jb25jYXQobDJjKGQueCwgZC55LCBwYXRoWzFdLCBkLnkpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiVlwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aCA9IFtcIkNcIl0uY29uY2F0KGwyYyhkLngsIGQueSwgZC54LCBwYXRoWzFdKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlpcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGggPSBbXCJDXCJdLmNvbmNhdChsMmMoZC54LCBkLnksIGQuWCwgZC5ZKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhdGg7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZml4QXJjID0gZnVuY3Rpb24gKHBwLCBpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHBwW2ldLmxlbmd0aCA+IDcpIHtcbiAgICAgICAgICAgICAgICAgICAgcHBbaV0uc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBpID0gcHBbaV07XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChwaS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBjb21zMVtpXSA9IFwiQVwiOyAvLyBpZiBjcmVhdGVkIG11bHRpcGxlIEM6cywgdGhlaXIgb3JpZ2luYWwgc2VnIGlzIHNhdmVkXG4gICAgICAgICAgICAgICAgICAgICAgICBwMiAmJiAocGNvbXMyW2ldID0gXCJBXCIpOyAvLyB0aGUgc2FtZSBhcyBhYm92ZVxuICAgICAgICAgICAgICAgICAgICAgICAgcHAuc3BsaWNlKGkrKywgMCwgW1wiQ1wiXS5jb25jYXQocGkuc3BsaWNlKDAsIDYpKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcHAuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICBpaSA9IG1tYXgocC5sZW5ndGgsIHAyICYmIHAyLmxlbmd0aCB8fCAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZml4TSA9IGZ1bmN0aW9uIChwYXRoMSwgcGF0aDIsIGExLCBhMiwgaSkge1xuICAgICAgICAgICAgICAgIGlmIChwYXRoMSAmJiBwYXRoMiAmJiBwYXRoMVtpXVswXSA9PSBcIk1cIiAmJiBwYXRoMltpXVswXSAhPSBcIk1cIikge1xuICAgICAgICAgICAgICAgICAgICBwYXRoMi5zcGxpY2UoaSwgMCwgW1wiTVwiLCBhMi54LCBhMi55XSk7XG4gICAgICAgICAgICAgICAgICAgIGExLmJ4ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgYTEuYnkgPSAwO1xuICAgICAgICAgICAgICAgICAgICBhMS54ID0gcGF0aDFbaV1bMV07XG4gICAgICAgICAgICAgICAgICAgIGExLnkgPSBwYXRoMVtpXVsyXTtcbiAgICAgICAgICAgICAgICAgICAgaWkgPSBtbWF4KHAubGVuZ3RoLCBwMiAmJiBwMi5sZW5ndGggfHwgMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBjb21zMSA9IFtdLCAvLyBwYXRoIGNvbW1hbmRzIG9mIG9yaWdpbmFsIHBhdGggcFxuICAgICAgICAgICAgcGNvbXMyID0gW10sIC8vIHBhdGggY29tbWFuZHMgb2Ygb3JpZ2luYWwgcGF0aCBwMlxuICAgICAgICAgICAgcGZpcnN0ID0gXCJcIiwgLy8gdGVtcG9yYXJ5IGhvbGRlciBmb3Igb3JpZ2luYWwgcGF0aCBjb21tYW5kXG4gICAgICAgICAgICBwY29tID0gXCJcIjsgLy8gaG9sZGVyIGZvciBwcmV2aW91cyBwYXRoIGNvbW1hbmQgb2Ygb3JpZ2luYWwgcGF0aFxuICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBtbWF4KHAubGVuZ3RoLCBwMiAmJiBwMi5sZW5ndGggfHwgMCk7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICBwW2ldICYmIChwZmlyc3QgPSBwW2ldWzBdKTsgLy8gc2F2ZSBjdXJyZW50IHBhdGggY29tbWFuZFxuXG4gICAgICAgICAgICBpZiAocGZpcnN0ICE9IFwiQ1wiKSAvLyBDIGlzIG5vdCBzYXZlZCB5ZXQsIGJlY2F1c2UgaXQgbWF5IGJlIHJlc3VsdCBvZiBjb252ZXJzaW9uXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcGNvbXMxW2ldID0gcGZpcnN0OyAvLyBTYXZlIGN1cnJlbnQgcGF0aCBjb21tYW5kXG4gICAgICAgICAgICAgICAgaSAmJiAoIHBjb20gPSBwY29tczFbaSAtIDFdKTsgLy8gR2V0IHByZXZpb3VzIHBhdGggY29tbWFuZCBwY29tXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwW2ldID0gcHJvY2Vzc1BhdGgocFtpXSwgYXR0cnMsIHBjb20pOyAvLyBQcmV2aW91cyBwYXRoIGNvbW1hbmQgaXMgaW5wdXR0ZWQgdG8gcHJvY2Vzc1BhdGhcblxuICAgICAgICAgICAgaWYgKHBjb21zMVtpXSAhPSBcIkFcIiAmJiBwZmlyc3QgPT0gXCJDXCIpIHBjb21zMVtpXSA9IFwiQ1wiOyAvLyBBIGlzIHRoZSBvbmx5IGNvbW1hbmRcbiAgICAgICAgICAgIC8vIHdoaWNoIG1heSBwcm9kdWNlIG11bHRpcGxlIEM6c1xuICAgICAgICAgICAgLy8gc28gd2UgaGF2ZSB0byBtYWtlIHN1cmUgdGhhdCBDIGlzIGFsc28gQyBpbiBvcmlnaW5hbCBwYXRoXG5cbiAgICAgICAgICAgIGZpeEFyYyhwLCBpKTsgLy8gZml4QXJjIGFkZHMgYWxzbyB0aGUgcmlnaHQgYW1vdW50IG9mIEE6cyB0byBwY29tczFcblxuICAgICAgICAgICAgaWYgKHAyKSB7IC8vIHRoZSBzYW1lIHByb2NlZHVyZXMgaXMgZG9uZSB0byBwMlxuICAgICAgICAgICAgICAgIHAyW2ldICYmIChwZmlyc3QgPSBwMltpXVswXSk7XG4gICAgICAgICAgICAgICAgaWYgKHBmaXJzdCAhPSBcIkNcIikge1xuICAgICAgICAgICAgICAgICAgICBwY29tczJbaV0gPSBwZmlyc3Q7XG4gICAgICAgICAgICAgICAgICAgIGkgJiYgKHBjb20gPSBwY29tczJbaSAtIDFdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcDJbaV0gPSBwcm9jZXNzUGF0aChwMltpXSwgYXR0cnMyLCBwY29tKTtcblxuICAgICAgICAgICAgICAgIGlmIChwY29tczJbaV0gIT0gXCJBXCIgJiYgcGZpcnN0ID09IFwiQ1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIHBjb21zMltpXSA9IFwiQ1wiO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZpeEFyYyhwMiwgaSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmaXhNKHAsIHAyLCBhdHRycywgYXR0cnMyLCBpKTtcbiAgICAgICAgICAgIGZpeE0ocDIsIHAsIGF0dHJzMiwgYXR0cnMsIGkpO1xuICAgICAgICAgICAgdmFyIHNlZyA9IHBbaV0sXG4gICAgICAgICAgICAgICAgc2VnMiA9IHAyICYmIHAyW2ldLFxuICAgICAgICAgICAgICAgIHNlZ2xlbiA9IHNlZy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgc2VnMmxlbiA9IHAyICYmIHNlZzIubGVuZ3RoO1xuICAgICAgICAgICAgYXR0cnMueCA9IHNlZ1tzZWdsZW4gLSAyXTtcbiAgICAgICAgICAgIGF0dHJzLnkgPSBzZWdbc2VnbGVuIC0gMV07XG4gICAgICAgICAgICBhdHRycy5ieCA9IHRvRmxvYXQoc2VnW3NlZ2xlbiAtIDRdKSB8fCBhdHRycy54O1xuICAgICAgICAgICAgYXR0cnMuYnkgPSB0b0Zsb2F0KHNlZ1tzZWdsZW4gLSAzXSkgfHwgYXR0cnMueTtcbiAgICAgICAgICAgIGF0dHJzMi5ieCA9IHAyICYmICh0b0Zsb2F0KHNlZzJbc2VnMmxlbiAtIDRdKSB8fCBhdHRyczIueCk7XG4gICAgICAgICAgICBhdHRyczIuYnkgPSBwMiAmJiAodG9GbG9hdChzZWcyW3NlZzJsZW4gLSAzXSkgfHwgYXR0cnMyLnkpO1xuICAgICAgICAgICAgYXR0cnMyLnggPSBwMiAmJiBzZWcyW3NlZzJsZW4gLSAyXTtcbiAgICAgICAgICAgIGF0dHJzMi55ID0gcDIgJiYgc2VnMltzZWcybGVuIC0gMV07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFwMikge1xuICAgICAgICAgICAgcHRoLmN1cnZlID0gcGF0aENsb25lKHApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwMiA/IFtwLCBwMl0gOiBwO1xuICAgIH1cbiAgICBmdW5jdGlvbiBtYXBQYXRoKHBhdGgsIG1hdHJpeCkge1xuICAgICAgICBpZiAoIW1hdHJpeCkge1xuICAgICAgICAgICAgcmV0dXJuIHBhdGg7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHgsIHksIGksIGosIGlpLCBqaiwgcGF0aGk7XG4gICAgICAgIHBhdGggPSBwYXRoMmN1cnZlKHBhdGgpO1xuICAgICAgICBmb3IgKGkgPSAwLCBpaSA9IHBhdGgubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgcGF0aGkgPSBwYXRoW2ldO1xuICAgICAgICAgICAgZm9yIChqID0gMSwgamogPSBwYXRoaS5sZW5ndGg7IGogPCBqajsgaiArPSAyKSB7XG4gICAgICAgICAgICAgICAgeCA9IG1hdHJpeC54KHBhdGhpW2pdLCBwYXRoaVtqICsgMV0pO1xuICAgICAgICAgICAgICAgIHkgPSBtYXRyaXgueShwYXRoaVtqXSwgcGF0aGlbaiArIDFdKTtcbiAgICAgICAgICAgICAgICBwYXRoaVtqXSA9IHg7XG4gICAgICAgICAgICAgICAgcGF0aGlbaiArIDFdID0geTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcGF0aDtcbiAgICB9XG5cbiAgICAvLyBodHRwOi8vc2NoZXBlcnMuY2MvZ2V0dGluZy10by10aGUtcG9pbnRcbiAgICBmdW5jdGlvbiBjYXRtdWxsUm9tMmJlemllcihjcnAsIHopIHtcbiAgICAgICAgdmFyIGQgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlMZW4gPSBjcnAubGVuZ3RoOyBpTGVuIC0gMiAqICF6ID4gaTsgaSArPSAyKSB7XG4gICAgICAgICAgICB2YXIgcCA9IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHt4OiArY3JwW2kgLSAyXSwgeTogK2NycFtpIC0gMV19LFxuICAgICAgICAgICAgICAgICAgICAgICAge3g6ICtjcnBbaV0sICAgICB5OiArY3JwW2kgKyAxXX0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7eDogK2NycFtpICsgMl0sIHk6ICtjcnBbaSArIDNdfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHt4OiArY3JwW2kgKyA0XSwgeTogK2NycFtpICsgNV19XG4gICAgICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICBpZiAoeikge1xuICAgICAgICAgICAgICAgIGlmICghaSkge1xuICAgICAgICAgICAgICAgICAgICBwWzBdID0ge3g6ICtjcnBbaUxlbiAtIDJdLCB5OiArY3JwW2lMZW4gLSAxXX07XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpTGVuIC0gNCA9PSBpKSB7XG4gICAgICAgICAgICAgICAgICAgIHBbM10gPSB7eDogK2NycFswXSwgeTogK2NycFsxXX07XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpTGVuIC0gMiA9PSBpKSB7XG4gICAgICAgICAgICAgICAgICAgIHBbMl0gPSB7eDogK2NycFswXSwgeTogK2NycFsxXX07XG4gICAgICAgICAgICAgICAgICAgIHBbM10gPSB7eDogK2NycFsyXSwgeTogK2NycFszXX07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoaUxlbiAtIDQgPT0gaSkge1xuICAgICAgICAgICAgICAgICAgICBwWzNdID0gcFsyXTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFpKSB7XG4gICAgICAgICAgICAgICAgICAgIHBbMF0gPSB7eDogK2NycFtpXSwgeTogK2NycFtpICsgMV19O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGQucHVzaChbXCJDXCIsXG4gICAgICAgICAgICAgICAgICAoLXBbMF0ueCArIDYgKiBwWzFdLnggKyBwWzJdLngpIC8gNixcbiAgICAgICAgICAgICAgICAgICgtcFswXS55ICsgNiAqIHBbMV0ueSArIHBbMl0ueSkgLyA2LFxuICAgICAgICAgICAgICAgICAgKHBbMV0ueCArIDYgKiBwWzJdLnggLSBwWzNdLngpIC8gNixcbiAgICAgICAgICAgICAgICAgIChwWzFdLnkgKyA2KnBbMl0ueSAtIHBbM10ueSkgLyA2LFxuICAgICAgICAgICAgICAgICAgcFsyXS54LFxuICAgICAgICAgICAgICAgICAgcFsyXS55XG4gICAgICAgICAgICBdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkO1xuICAgIH1cblxuICAgIC8vIGV4cG9ydFxuICAgIFNuYXAucGF0aCA9IHBhdGhzO1xuXG4gICAgLypcXFxuICAgICAqIFNuYXAucGF0aC5nZXRUb3RhbExlbmd0aFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJucyB0aGUgbGVuZ3RoIG9mIHRoZSBnaXZlbiBwYXRoIGluIHBpeGVsc1xuICAgICAqKlxuICAgICAtIHBhdGggKHN0cmluZykgU1ZHIHBhdGggc3RyaW5nXG4gICAgICoqXG4gICAgID0gKG51bWJlcikgbGVuZ3RoXG4gICAgXFwqL1xuICAgIFNuYXAucGF0aC5nZXRUb3RhbExlbmd0aCA9IGdldFRvdGFsTGVuZ3RoO1xuICAgIC8qXFxcbiAgICAgKiBTbmFwLnBhdGguZ2V0UG9pbnRBdExlbmd0aFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJucyB0aGUgY29vcmRpbmF0ZXMgb2YgdGhlIHBvaW50IGxvY2F0ZWQgYXQgdGhlIGdpdmVuIGxlbmd0aCBhbG9uZyB0aGUgZ2l2ZW4gcGF0aFxuICAgICAqKlxuICAgICAtIHBhdGggKHN0cmluZykgU1ZHIHBhdGggc3RyaW5nXG4gICAgIC0gbGVuZ3RoIChudW1iZXIpIGxlbmd0aCwgaW4gcGl4ZWxzLCBmcm9tIHRoZSBzdGFydCBvZiB0aGUgcGF0aCwgZXhjbHVkaW5nIG5vbi1yZW5kZXJpbmcganVtcHNcbiAgICAgKipcbiAgICAgPSAob2JqZWN0KSByZXByZXNlbnRhdGlvbiBvZiB0aGUgcG9pbnQ6XG4gICAgIG8ge1xuICAgICBvICAgICB4OiAobnVtYmVyKSB4IGNvb3JkaW5hdGUsXG4gICAgIG8gICAgIHk6IChudW1iZXIpIHkgY29vcmRpbmF0ZSxcbiAgICAgbyAgICAgYWxwaGE6IChudW1iZXIpIGFuZ2xlIG9mIGRlcml2YXRpdmVcbiAgICAgbyB9XG4gICAgXFwqL1xuICAgIFNuYXAucGF0aC5nZXRQb2ludEF0TGVuZ3RoID0gZ2V0UG9pbnRBdExlbmd0aDtcbiAgICAvKlxcXG4gICAgICogU25hcC5wYXRoLmdldFN1YnBhdGhcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybnMgdGhlIHN1YnBhdGggb2YgYSBnaXZlbiBwYXRoIGJldHdlZW4gZ2l2ZW4gc3RhcnQgYW5kIGVuZCBsZW5ndGhzXG4gICAgICoqXG4gICAgIC0gcGF0aCAoc3RyaW5nKSBTVkcgcGF0aCBzdHJpbmdcbiAgICAgLSBmcm9tIChudW1iZXIpIGxlbmd0aCwgaW4gcGl4ZWxzLCBmcm9tIHRoZSBzdGFydCBvZiB0aGUgcGF0aCB0byB0aGUgc3RhcnQgb2YgdGhlIHNlZ21lbnRcbiAgICAgLSB0byAobnVtYmVyKSBsZW5ndGgsIGluIHBpeGVscywgZnJvbSB0aGUgc3RhcnQgb2YgdGhlIHBhdGggdG8gdGhlIGVuZCBvZiB0aGUgc2VnbWVudFxuICAgICAqKlxuICAgICA9IChzdHJpbmcpIHBhdGggc3RyaW5nIGRlZmluaXRpb24gZm9yIHRoZSBzZWdtZW50XG4gICAgXFwqL1xuICAgIFNuYXAucGF0aC5nZXRTdWJwYXRoID0gZnVuY3Rpb24gKHBhdGgsIGZyb20sIHRvKSB7XG4gICAgICAgIGlmICh0aGlzLmdldFRvdGFsTGVuZ3RoKHBhdGgpIC0gdG8gPCAxZS02KSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0U3VicGF0aHNBdExlbmd0aChwYXRoLCBmcm9tKS5lbmQ7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGEgPSBnZXRTdWJwYXRoc0F0TGVuZ3RoKHBhdGgsIHRvLCAxKTtcbiAgICAgICAgcmV0dXJuIGZyb20gPyBnZXRTdWJwYXRoc0F0TGVuZ3RoKGEsIGZyb20pLmVuZCA6IGE7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5nZXRUb3RhbExlbmd0aFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJucyB0aGUgbGVuZ3RoIG9mIHRoZSBwYXRoIGluIHBpeGVscyAob25seSB3b3JrcyBmb3IgYHBhdGhgIGVsZW1lbnRzKVxuICAgICA9IChudW1iZXIpIGxlbmd0aFxuICAgIFxcKi9cbiAgICBlbHByb3RvLmdldFRvdGFsTGVuZ3RoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5ub2RlLmdldFRvdGFsTGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5ub2RlLmdldFRvdGFsTGVuZ3RoKCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8vIFNJRVJSQSBFbGVtZW50LmdldFBvaW50QXRMZW5ndGgoKS9FbGVtZW50LmdldFRvdGFsTGVuZ3RoKCk6IElmIGEgPHBhdGg+IGlzIGJyb2tlbiBpbnRvIGRpZmZlcmVudCBzZWdtZW50cywgaXMgdGhlIGp1bXAgZGlzdGFuY2UgdG8gdGhlIG5ldyBjb29yZGluYXRlcyBzZXQgYnkgdGhlIF9NXyBvciBfbV8gY29tbWFuZHMgY2FsY3VsYXRlZCBhcyBwYXJ0IG9mIHRoZSBwYXRoJ3MgdG90YWwgbGVuZ3RoP1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LmdldFBvaW50QXRMZW5ndGhcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybnMgY29vcmRpbmF0ZXMgb2YgdGhlIHBvaW50IGxvY2F0ZWQgYXQgdGhlIGdpdmVuIGxlbmd0aCBvbiB0aGUgZ2l2ZW4gcGF0aCAob25seSB3b3JrcyBmb3IgYHBhdGhgIGVsZW1lbnRzKVxuICAgICAqKlxuICAgICAtIGxlbmd0aCAobnVtYmVyKSBsZW5ndGgsIGluIHBpeGVscywgZnJvbSB0aGUgc3RhcnQgb2YgdGhlIHBhdGgsIGV4Y2x1ZGluZyBub24tcmVuZGVyaW5nIGp1bXBzXG4gICAgICoqXG4gICAgID0gKG9iamVjdCkgcmVwcmVzZW50YXRpb24gb2YgdGhlIHBvaW50OlxuICAgICBvIHtcbiAgICAgbyAgICAgeDogKG51bWJlcikgeCBjb29yZGluYXRlLFxuICAgICBvICAgICB5OiAobnVtYmVyKSB5IGNvb3JkaW5hdGUsXG4gICAgIG8gICAgIGFscGhhOiAobnVtYmVyKSBhbmdsZSBvZiBkZXJpdmF0aXZlXG4gICAgIG8gfVxuICAgIFxcKi9cbiAgICBlbHByb3RvLmdldFBvaW50QXRMZW5ndGggPSBmdW5jdGlvbiAobGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBnZXRQb2ludEF0TGVuZ3RoKHRoaXMuYXR0cihcImRcIiksIGxlbmd0aCk7XG4gICAgfTtcbiAgICAvLyBTSUVSUkEgRWxlbWVudC5nZXRTdWJwYXRoKCk6IFNpbWlsYXIgdG8gdGhlIHByb2JsZW0gZm9yIEVsZW1lbnQuZ2V0UG9pbnRBdExlbmd0aCgpLiBVbmNsZWFyIGhvdyB0aGlzIHdvdWxkIHdvcmsgZm9yIGEgc2VnbWVudGVkIHBhdGguIE92ZXJhbGwsIHRoZSBjb25jZXB0IG9mIF9zdWJwYXRoXyBhbmQgd2hhdCBJJ20gY2FsbGluZyBhIF9zZWdtZW50XyAoc2VyaWVzIG9mIG5vbi1fTV8gb3IgX1pfIGNvbW1hbmRzKSBpcyB1bmNsZWFyLlxuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LmdldFN1YnBhdGhcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybnMgc3VicGF0aCBvZiBhIGdpdmVuIGVsZW1lbnQgZnJvbSBnaXZlbiBzdGFydCBhbmQgZW5kIGxlbmd0aHMgKG9ubHkgd29ya3MgZm9yIGBwYXRoYCBlbGVtZW50cylcbiAgICAgKipcbiAgICAgLSBmcm9tIChudW1iZXIpIGxlbmd0aCwgaW4gcGl4ZWxzLCBmcm9tIHRoZSBzdGFydCBvZiB0aGUgcGF0aCB0byB0aGUgc3RhcnQgb2YgdGhlIHNlZ21lbnRcbiAgICAgLSB0byAobnVtYmVyKSBsZW5ndGgsIGluIHBpeGVscywgZnJvbSB0aGUgc3RhcnQgb2YgdGhlIHBhdGggdG8gdGhlIGVuZCBvZiB0aGUgc2VnbWVudFxuICAgICAqKlxuICAgICA9IChzdHJpbmcpIHBhdGggc3RyaW5nIGRlZmluaXRpb24gZm9yIHRoZSBzZWdtZW50XG4gICAgXFwqL1xuICAgIGVscHJvdG8uZ2V0U3VicGF0aCA9IGZ1bmN0aW9uIChmcm9tLCB0bykge1xuICAgICAgICByZXR1cm4gU25hcC5wYXRoLmdldFN1YnBhdGgodGhpcy5hdHRyKFwiZFwiKSwgZnJvbSwgdG8pO1xuICAgIH07XG4gICAgU25hcC5fLmJveCA9IGJveDtcbiAgICAvKlxcXG4gICAgICogU25hcC5wYXRoLmZpbmREb3RzQXRTZWdtZW50XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBVdGlsaXR5IG1ldGhvZFxuICAgICAqKlxuICAgICAqIEZpbmRzIGRvdCBjb29yZGluYXRlcyBvbiB0aGUgZ2l2ZW4gY3ViaWMgYmV6acOpciBjdXJ2ZSBhdCB0aGUgZ2l2ZW4gdFxuICAgICAtIHAxeCAobnVtYmVyKSB4IG9mIHRoZSBmaXJzdCBwb2ludCBvZiB0aGUgY3VydmVcbiAgICAgLSBwMXkgKG51bWJlcikgeSBvZiB0aGUgZmlyc3QgcG9pbnQgb2YgdGhlIGN1cnZlXG4gICAgIC0gYzF4IChudW1iZXIpIHggb2YgdGhlIGZpcnN0IGFuY2hvciBvZiB0aGUgY3VydmVcbiAgICAgLSBjMXkgKG51bWJlcikgeSBvZiB0aGUgZmlyc3QgYW5jaG9yIG9mIHRoZSBjdXJ2ZVxuICAgICAtIGMyeCAobnVtYmVyKSB4IG9mIHRoZSBzZWNvbmQgYW5jaG9yIG9mIHRoZSBjdXJ2ZVxuICAgICAtIGMyeSAobnVtYmVyKSB5IG9mIHRoZSBzZWNvbmQgYW5jaG9yIG9mIHRoZSBjdXJ2ZVxuICAgICAtIHAyeCAobnVtYmVyKSB4IG9mIHRoZSBzZWNvbmQgcG9pbnQgb2YgdGhlIGN1cnZlXG4gICAgIC0gcDJ5IChudW1iZXIpIHkgb2YgdGhlIHNlY29uZCBwb2ludCBvZiB0aGUgY3VydmVcbiAgICAgLSB0IChudW1iZXIpIHBvc2l0aW9uIG9uIHRoZSBjdXJ2ZSAoMC4uMSlcbiAgICAgPSAob2JqZWN0KSBwb2ludCBpbmZvcm1hdGlvbiBpbiBmb3JtYXQ6XG4gICAgIG8ge1xuICAgICBvICAgICB4OiAobnVtYmVyKSB4IGNvb3JkaW5hdGUgb2YgdGhlIHBvaW50LFxuICAgICBvICAgICB5OiAobnVtYmVyKSB5IGNvb3JkaW5hdGUgb2YgdGhlIHBvaW50LFxuICAgICBvICAgICBtOiB7XG4gICAgIG8gICAgICAgICB4OiAobnVtYmVyKSB4IGNvb3JkaW5hdGUgb2YgdGhlIGxlZnQgYW5jaG9yLFxuICAgICBvICAgICAgICAgeTogKG51bWJlcikgeSBjb29yZGluYXRlIG9mIHRoZSBsZWZ0IGFuY2hvclxuICAgICBvICAgICB9LFxuICAgICBvICAgICBuOiB7XG4gICAgIG8gICAgICAgICB4OiAobnVtYmVyKSB4IGNvb3JkaW5hdGUgb2YgdGhlIHJpZ2h0IGFuY2hvcixcbiAgICAgbyAgICAgICAgIHk6IChudW1iZXIpIHkgY29vcmRpbmF0ZSBvZiB0aGUgcmlnaHQgYW5jaG9yXG4gICAgIG8gICAgIH0sXG4gICAgIG8gICAgIHN0YXJ0OiB7XG4gICAgIG8gICAgICAgICB4OiAobnVtYmVyKSB4IGNvb3JkaW5hdGUgb2YgdGhlIHN0YXJ0IG9mIHRoZSBjdXJ2ZSxcbiAgICAgbyAgICAgICAgIHk6IChudW1iZXIpIHkgY29vcmRpbmF0ZSBvZiB0aGUgc3RhcnQgb2YgdGhlIGN1cnZlXG4gICAgIG8gICAgIH0sXG4gICAgIG8gICAgIGVuZDoge1xuICAgICBvICAgICAgICAgeDogKG51bWJlcikgeCBjb29yZGluYXRlIG9mIHRoZSBlbmQgb2YgdGhlIGN1cnZlLFxuICAgICBvICAgICAgICAgeTogKG51bWJlcikgeSBjb29yZGluYXRlIG9mIHRoZSBlbmQgb2YgdGhlIGN1cnZlXG4gICAgIG8gICAgIH0sXG4gICAgIG8gICAgIGFscGhhOiAobnVtYmVyKSBhbmdsZSBvZiB0aGUgY3VydmUgZGVyaXZhdGl2ZSBhdCB0aGUgcG9pbnRcbiAgICAgbyB9XG4gICAgXFwqL1xuICAgIFNuYXAucGF0aC5maW5kRG90c0F0U2VnbWVudCA9IGZpbmREb3RzQXRTZWdtZW50O1xuICAgIC8qXFxcbiAgICAgKiBTbmFwLnBhdGguYmV6aWVyQkJveFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogVXRpbGl0eSBtZXRob2RcbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIHRoZSBib3VuZGluZyBib3ggb2YgYSBnaXZlbiBjdWJpYyBiZXppw6lyIGN1cnZlXG4gICAgIC0gcDF4IChudW1iZXIpIHggb2YgdGhlIGZpcnN0IHBvaW50IG9mIHRoZSBjdXJ2ZVxuICAgICAtIHAxeSAobnVtYmVyKSB5IG9mIHRoZSBmaXJzdCBwb2ludCBvZiB0aGUgY3VydmVcbiAgICAgLSBjMXggKG51bWJlcikgeCBvZiB0aGUgZmlyc3QgYW5jaG9yIG9mIHRoZSBjdXJ2ZVxuICAgICAtIGMxeSAobnVtYmVyKSB5IG9mIHRoZSBmaXJzdCBhbmNob3Igb2YgdGhlIGN1cnZlXG4gICAgIC0gYzJ4IChudW1iZXIpIHggb2YgdGhlIHNlY29uZCBhbmNob3Igb2YgdGhlIGN1cnZlXG4gICAgIC0gYzJ5IChudW1iZXIpIHkgb2YgdGhlIHNlY29uZCBhbmNob3Igb2YgdGhlIGN1cnZlXG4gICAgIC0gcDJ4IChudW1iZXIpIHggb2YgdGhlIHNlY29uZCBwb2ludCBvZiB0aGUgY3VydmVcbiAgICAgLSBwMnkgKG51bWJlcikgeSBvZiB0aGUgc2Vjb25kIHBvaW50IG9mIHRoZSBjdXJ2ZVxuICAgICAqIG9yXG4gICAgIC0gYmV6IChhcnJheSkgYXJyYXkgb2Ygc2l4IHBvaW50cyBmb3IgYmV6acOpciBjdXJ2ZVxuICAgICA9IChvYmplY3QpIGJvdW5kaW5nIGJveFxuICAgICBvIHtcbiAgICAgbyAgICAgeDogKG51bWJlcikgeCBjb29yZGluYXRlIG9mIHRoZSBsZWZ0IHRvcCBwb2ludCBvZiB0aGUgYm94LFxuICAgICBvICAgICB5OiAobnVtYmVyKSB5IGNvb3JkaW5hdGUgb2YgdGhlIGxlZnQgdG9wIHBvaW50IG9mIHRoZSBib3gsXG4gICAgIG8gICAgIHgyOiAobnVtYmVyKSB4IGNvb3JkaW5hdGUgb2YgdGhlIHJpZ2h0IGJvdHRvbSBwb2ludCBvZiB0aGUgYm94LFxuICAgICBvICAgICB5MjogKG51bWJlcikgeSBjb29yZGluYXRlIG9mIHRoZSByaWdodCBib3R0b20gcG9pbnQgb2YgdGhlIGJveCxcbiAgICAgbyAgICAgd2lkdGg6IChudW1iZXIpIHdpZHRoIG9mIHRoZSBib3gsXG4gICAgIG8gICAgIGhlaWdodDogKG51bWJlcikgaGVpZ2h0IG9mIHRoZSBib3hcbiAgICAgbyB9XG4gICAgXFwqL1xuICAgIFNuYXAucGF0aC5iZXppZXJCQm94ID0gYmV6aWVyQkJveDtcbiAgICAvKlxcXG4gICAgICogU25hcC5wYXRoLmlzUG9pbnRJbnNpZGVCQm94XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBVdGlsaXR5IG1ldGhvZFxuICAgICAqKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIGdpdmVuIHBvaW50IGlzIGluc2lkZSBib3VuZGluZyBib3hcbiAgICAgLSBiYm94IChzdHJpbmcpIGJvdW5kaW5nIGJveFxuICAgICAtIHggKHN0cmluZykgeCBjb29yZGluYXRlIG9mIHRoZSBwb2ludFxuICAgICAtIHkgKHN0cmluZykgeSBjb29yZGluYXRlIG9mIHRoZSBwb2ludFxuICAgICA9IChib29sZWFuKSBgdHJ1ZWAgaWYgcG9pbnQgaXMgaW5zaWRlXG4gICAgXFwqL1xuICAgIFNuYXAucGF0aC5pc1BvaW50SW5zaWRlQkJveCA9IGlzUG9pbnRJbnNpZGVCQm94O1xuICAgIFNuYXAuY2xvc2VzdCA9IGZ1bmN0aW9uICh4LCB5LCBYLCBZKSB7XG4gICAgICAgIHZhciByID0gMTAwLFxuICAgICAgICAgICAgYiA9IGJveCh4IC0gciAvIDIsIHkgLSByIC8gMiwgciwgciksXG4gICAgICAgICAgICBpbnNpZGUgPSBbXSxcbiAgICAgICAgICAgIGdldHRlciA9IFhbMF0uaGFzT3duUHJvcGVydHkoXCJ4XCIpID8gZnVuY3Rpb24gKGkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICB4OiBYW2ldLngsXG4gICAgICAgICAgICAgICAgICAgIHk6IFhbaV0ueVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IDogZnVuY3Rpb24gKGkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICB4OiBYW2ldLFxuICAgICAgICAgICAgICAgICAgICB5OiBZW2ldXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmb3VuZCA9IDA7XG4gICAgICAgIHdoaWxlIChyIDw9IDFlNiAmJiAhZm91bmQpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IFgubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciB4eSA9IGdldHRlcihpKTtcbiAgICAgICAgICAgICAgICBpZiAoaXNQb2ludEluc2lkZUJCb3goYiwgeHkueCwgeHkueSkpIHtcbiAgICAgICAgICAgICAgICAgICAgZm91bmQrKztcbiAgICAgICAgICAgICAgICAgICAgaW5zaWRlLnB1c2goeHkpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgICAgICAgICAgciAqPSAyO1xuICAgICAgICAgICAgICAgIGIgPSBib3goeCAtIHIgLyAyLCB5IC0gciAvIDIsIHIsIHIpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHIgPT0gMWU2KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGxlbiA9IEluZmluaXR5LFxuICAgICAgICAgICAgcmVzO1xuICAgICAgICBmb3IgKGkgPSAwLCBpaSA9IGluc2lkZS5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbCA9IFNuYXAubGVuKHgsIHksIGluc2lkZVtpXS54LCBpbnNpZGVbaV0ueSk7XG4gICAgICAgICAgICBpZiAobGVuID4gbCkge1xuICAgICAgICAgICAgICAgIGxlbiA9IGw7XG4gICAgICAgICAgICAgICAgaW5zaWRlW2ldLmxlbiA9IGw7XG4gICAgICAgICAgICAgICAgcmVzID0gaW5zaWRlW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogU25hcC5wYXRoLmlzQkJveEludGVyc2VjdFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogVXRpbGl0eSBtZXRob2RcbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiB0d28gYm91bmRpbmcgYm94ZXMgaW50ZXJzZWN0XG4gICAgIC0gYmJveDEgKHN0cmluZykgZmlyc3QgYm91bmRpbmcgYm94XG4gICAgIC0gYmJveDIgKHN0cmluZykgc2Vjb25kIGJvdW5kaW5nIGJveFxuICAgICA9IChib29sZWFuKSBgdHJ1ZWAgaWYgYm91bmRpbmcgYm94ZXMgaW50ZXJzZWN0XG4gICAgXFwqL1xuICAgIFNuYXAucGF0aC5pc0JCb3hJbnRlcnNlY3QgPSBpc0JCb3hJbnRlcnNlY3Q7XG4gICAgLypcXFxuICAgICAqIFNuYXAucGF0aC5pbnRlcnNlY3Rpb25cbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFV0aWxpdHkgbWV0aG9kXG4gICAgICoqXG4gICAgICogRmluZHMgaW50ZXJzZWN0aW9ucyBvZiB0d28gcGF0aHNcbiAgICAgLSBwYXRoMSAoc3RyaW5nKSBwYXRoIHN0cmluZ1xuICAgICAtIHBhdGgyIChzdHJpbmcpIHBhdGggc3RyaW5nXG4gICAgID0gKGFycmF5KSBkb3RzIG9mIGludGVyc2VjdGlvblxuICAgICBvIFtcbiAgICAgbyAgICAge1xuICAgICBvICAgICAgICAgeDogKG51bWJlcikgeCBjb29yZGluYXRlIG9mIHRoZSBwb2ludCxcbiAgICAgbyAgICAgICAgIHk6IChudW1iZXIpIHkgY29vcmRpbmF0ZSBvZiB0aGUgcG9pbnQsXG4gICAgIG8gICAgICAgICB0MTogKG51bWJlcikgdCB2YWx1ZSBmb3Igc2VnbWVudCBvZiBwYXRoMSxcbiAgICAgbyAgICAgICAgIHQyOiAobnVtYmVyKSB0IHZhbHVlIGZvciBzZWdtZW50IG9mIHBhdGgyLFxuICAgICBvICAgICAgICAgc2VnbWVudDE6IChudW1iZXIpIG9yZGVyIG51bWJlciBmb3Igc2VnbWVudCBvZiBwYXRoMSxcbiAgICAgbyAgICAgICAgIHNlZ21lbnQyOiAobnVtYmVyKSBvcmRlciBudW1iZXIgZm9yIHNlZ21lbnQgb2YgcGF0aDIsXG4gICAgIG8gICAgICAgICBiZXoxOiAoYXJyYXkpIGVpZ2h0IGNvb3JkaW5hdGVzIHJlcHJlc2VudGluZyBiZXppw6lyIGN1cnZlIGZvciB0aGUgc2VnbWVudCBvZiBwYXRoMSxcbiAgICAgbyAgICAgICAgIGJlejI6IChhcnJheSkgZWlnaHQgY29vcmRpbmF0ZXMgcmVwcmVzZW50aW5nIGJlemnDqXIgY3VydmUgZm9yIHRoZSBzZWdtZW50IG9mIHBhdGgyXG4gICAgIG8gICAgIH1cbiAgICAgbyBdXG4gICAgXFwqL1xuICAgIFNuYXAucGF0aC5pbnRlcnNlY3Rpb24gPSBwYXRoSW50ZXJzZWN0aW9uO1xuICAgIFNuYXAucGF0aC5pbnRlcnNlY3Rpb25OdW1iZXIgPSBwYXRoSW50ZXJzZWN0aW9uTnVtYmVyO1xuICAgIC8qXFxcbiAgICAgKiBTbmFwLnBhdGguaXNQb2ludEluc2lkZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogVXRpbGl0eSBtZXRob2RcbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiBnaXZlbiBwb2ludCBpcyBpbnNpZGUgYSBnaXZlbiBjbG9zZWQgcGF0aC5cbiAgICAgKlxuICAgICAqIE5vdGU6IGZpbGwgbW9kZSBkb2VzbuKAmXQgYWZmZWN0IHRoZSByZXN1bHQgb2YgdGhpcyBtZXRob2QuXG4gICAgIC0gcGF0aCAoc3RyaW5nKSBwYXRoIHN0cmluZ1xuICAgICAtIHggKG51bWJlcikgeCBvZiB0aGUgcG9pbnRcbiAgICAgLSB5IChudW1iZXIpIHkgb2YgdGhlIHBvaW50XG4gICAgID0gKGJvb2xlYW4pIGB0cnVlYCBpZiBwb2ludCBpcyBpbnNpZGUgdGhlIHBhdGhcbiAgICBcXCovXG4gICAgU25hcC5wYXRoLmlzUG9pbnRJbnNpZGUgPSBpc1BvaW50SW5zaWRlUGF0aDtcbiAgICAvKlxcXG4gICAgICogU25hcC5wYXRoLmdldEJCb3hcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFV0aWxpdHkgbWV0aG9kXG4gICAgICoqXG4gICAgICogUmV0dXJucyB0aGUgYm91bmRpbmcgYm94IG9mIGEgZ2l2ZW4gcGF0aFxuICAgICAtIHBhdGggKHN0cmluZykgcGF0aCBzdHJpbmdcbiAgICAgPSAob2JqZWN0KSBib3VuZGluZyBib3hcbiAgICAgbyB7XG4gICAgIG8gICAgIHg6IChudW1iZXIpIHggY29vcmRpbmF0ZSBvZiB0aGUgbGVmdCB0b3AgcG9pbnQgb2YgdGhlIGJveCxcbiAgICAgbyAgICAgeTogKG51bWJlcikgeSBjb29yZGluYXRlIG9mIHRoZSBsZWZ0IHRvcCBwb2ludCBvZiB0aGUgYm94LFxuICAgICBvICAgICB4MjogKG51bWJlcikgeCBjb29yZGluYXRlIG9mIHRoZSByaWdodCBib3R0b20gcG9pbnQgb2YgdGhlIGJveCxcbiAgICAgbyAgICAgeTI6IChudW1iZXIpIHkgY29vcmRpbmF0ZSBvZiB0aGUgcmlnaHQgYm90dG9tIHBvaW50IG9mIHRoZSBib3gsXG4gICAgIG8gICAgIHdpZHRoOiAobnVtYmVyKSB3aWR0aCBvZiB0aGUgYm94LFxuICAgICBvICAgICBoZWlnaHQ6IChudW1iZXIpIGhlaWdodCBvZiB0aGUgYm94XG4gICAgIG8gfVxuICAgIFxcKi9cbiAgICBTbmFwLnBhdGguZ2V0QkJveCA9IHBhdGhCQm94O1xuICAgIFNuYXAucGF0aC5nZXQgPSBnZXRQYXRoO1xuICAgIC8qXFxcbiAgICAgKiBTbmFwLnBhdGgudG9SZWxhdGl2ZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogVXRpbGl0eSBtZXRob2RcbiAgICAgKipcbiAgICAgKiBDb252ZXJ0cyBwYXRoIGNvb3JkaW5hdGVzIGludG8gcmVsYXRpdmUgdmFsdWVzXG4gICAgIC0gcGF0aCAoc3RyaW5nKSBwYXRoIHN0cmluZ1xuICAgICA9IChhcnJheSkgcGF0aCBzdHJpbmdcbiAgICBcXCovXG4gICAgU25hcC5wYXRoLnRvUmVsYXRpdmUgPSBwYXRoVG9SZWxhdGl2ZTtcbiAgICAvKlxcXG4gICAgICogU25hcC5wYXRoLnRvQWJzb2x1dGVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFV0aWxpdHkgbWV0aG9kXG4gICAgICoqXG4gICAgICogQ29udmVydHMgcGF0aCBjb29yZGluYXRlcyBpbnRvIGFic29sdXRlIHZhbHVlc1xuICAgICAtIHBhdGggKHN0cmluZykgcGF0aCBzdHJpbmdcbiAgICAgPSAoYXJyYXkpIHBhdGggc3RyaW5nXG4gICAgXFwqL1xuICAgIFNuYXAucGF0aC50b0Fic29sdXRlID0gcGF0aFRvQWJzb2x1dGU7XG4gICAgLypcXFxuICAgICAqIFNuYXAucGF0aC50b0N1YmljXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBVdGlsaXR5IG1ldGhvZFxuICAgICAqKlxuICAgICAqIENvbnZlcnRzIHBhdGggdG8gYSBuZXcgcGF0aCB3aGVyZSBhbGwgc2VnbWVudHMgYXJlIGN1YmljIGJlemnDqXIgY3VydmVzXG4gICAgIC0gcGF0aFN0cmluZyAoc3RyaW5nfGFycmF5KSBwYXRoIHN0cmluZyBvciBhcnJheSBvZiBzZWdtZW50c1xuICAgICA9IChhcnJheSkgYXJyYXkgb2Ygc2VnbWVudHNcbiAgICBcXCovXG4gICAgU25hcC5wYXRoLnRvQ3ViaWMgPSBwYXRoMmN1cnZlO1xuICAgIC8qXFxcbiAgICAgKiBTbmFwLnBhdGgubWFwXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBUcmFuc2Zvcm0gdGhlIHBhdGggc3RyaW5nIHdpdGggdGhlIGdpdmVuIG1hdHJpeFxuICAgICAtIHBhdGggKHN0cmluZykgcGF0aCBzdHJpbmdcbiAgICAgLSBtYXRyaXggKG9iamVjdCkgc2VlIEBNYXRyaXhcbiAgICAgPSAoc3RyaW5nKSB0cmFuc2Zvcm1lZCBwYXRoIHN0cmluZ1xuICAgIFxcKi9cbiAgICBTbmFwLnBhdGgubWFwID0gbWFwUGF0aDtcbiAgICBTbmFwLnBhdGgudG9TdHJpbmcgPSB0b1N0cmluZztcbiAgICBTbmFwLnBhdGguY2xvbmUgPSBwYXRoQ2xvbmU7XG59KTtcblxuLy8gQ29weXJpZ2h0IChjKSAyMDEzIEFkb2JlIFN5c3RlbXMgSW5jb3Jwb3JhdGVkLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vLyBcbi8vIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy8gXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuU25hcC5wbHVnaW4oZnVuY3Rpb24gKFNuYXAsIEVsZW1lbnQsIFBhcGVyLCBnbG9iKSB7XG4gICAgdmFyIG1tYXggPSBNYXRoLm1heCxcbiAgICAgICAgbW1pbiA9IE1hdGgubWluO1xuXG4gICAgLy8gU2V0XG4gICAgdmFyIFNldCA9IGZ1bmN0aW9uIChpdGVtcykge1xuICAgICAgICB0aGlzLml0ZW1zID0gW107XG5cdHRoaXMuYmluZGluZ3MgPSB7fTtcbiAgICAgICAgdGhpcy5sZW5ndGggPSAwO1xuICAgICAgICB0aGlzLnR5cGUgPSBcInNldFwiO1xuICAgICAgICBpZiAoaXRlbXMpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IGl0ZW1zLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoaXRlbXNbaV0pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpc1t0aGlzLml0ZW1zLmxlbmd0aF0gPSB0aGlzLml0ZW1zW3RoaXMuaXRlbXMubGVuZ3RoXSA9IGl0ZW1zW2ldO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxlbmd0aCsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgc2V0cHJvdG8gPSBTZXQucHJvdG90eXBlO1xuICAgIC8qXFxcbiAgICAgKiBTZXQucHVzaFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQWRkcyBlYWNoIGFyZ3VtZW50IHRvIHRoZSBjdXJyZW50IHNldFxuICAgICA9IChvYmplY3QpIG9yaWdpbmFsIGVsZW1lbnRcbiAgICBcXCovXG4gICAgc2V0cHJvdG8ucHVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGl0ZW0sXG4gICAgICAgICAgICBsZW47XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICBpdGVtID0gYXJndW1lbnRzW2ldO1xuICAgICAgICAgICAgaWYgKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICBsZW4gPSB0aGlzLml0ZW1zLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB0aGlzW2xlbl0gPSB0aGlzLml0ZW1zW2xlbl0gPSBpdGVtO1xuICAgICAgICAgICAgICAgIHRoaXMubGVuZ3RoKys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogU2V0LnBvcFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyBsYXN0IGVsZW1lbnQgYW5kIHJldHVybnMgaXRcbiAgICAgPSAob2JqZWN0KSBlbGVtZW50XG4gICAgXFwqL1xuICAgIHNldHByb3RvLnBvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5sZW5ndGggJiYgZGVsZXRlIHRoaXNbdGhpcy5sZW5ndGgtLV07XG4gICAgICAgIHJldHVybiB0aGlzLml0ZW1zLnBvcCgpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFNldC5mb3JFYWNoXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBFeGVjdXRlcyBnaXZlbiBmdW5jdGlvbiBmb3IgZWFjaCBlbGVtZW50IGluIHRoZSBzZXRcbiAgICAgKlxuICAgICAqIElmIHRoZSBmdW5jdGlvbiByZXR1cm5zIGBmYWxzZWAsIHRoZSBsb29wIHN0b3BzIHJ1bm5pbmcuXG4gICAgICoqXG4gICAgIC0gY2FsbGJhY2sgKGZ1bmN0aW9uKSBmdW5jdGlvbiB0byBydW5cbiAgICAgLSB0aGlzQXJnIChvYmplY3QpIGNvbnRleHQgb2JqZWN0IGZvciB0aGUgY2FsbGJhY2tcbiAgICAgPSAob2JqZWN0KSBTZXQgb2JqZWN0XG4gICAgXFwqL1xuICAgIHNldHByb3RvLmZvckVhY2ggPSBmdW5jdGlvbiAoY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gdGhpcy5pdGVtcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoY2FsbGJhY2suY2FsbCh0aGlzQXJnLCB0aGlzLml0ZW1zW2ldLCBpKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBTZXQuYW5pbWF0ZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQW5pbWF0ZXMgZWFjaCBlbGVtZW50IGluIHNldCBpbiBzeW5jLlxuICAgICAqXG4gICAgICoqXG4gICAgIC0gYXR0cnMgKG9iamVjdCkga2V5LXZhbHVlIHBhaXJzIG9mIGRlc3RpbmF0aW9uIGF0dHJpYnV0ZXNcbiAgICAgLSBkdXJhdGlvbiAobnVtYmVyKSBkdXJhdGlvbiBvZiB0aGUgYW5pbWF0aW9uIGluIG1pbGxpc2Vjb25kc1xuICAgICAtIGVhc2luZyAoZnVuY3Rpb24pICNvcHRpb25hbCBlYXNpbmcgZnVuY3Rpb24gZnJvbSBAbWluYSBvciBjdXN0b21cbiAgICAgLSBjYWxsYmFjayAoZnVuY3Rpb24pICNvcHRpb25hbCBjYWxsYmFjayBmdW5jdGlvbiB0aGF0IGV4ZWN1dGVzIHdoZW4gdGhlIGFuaW1hdGlvbiBlbmRzXG4gICAgICogb3JcbiAgICAgLSBhbmltYXRpb24gKGFycmF5KSBhcnJheSBvZiBhbmltYXRpb24gcGFyYW1ldGVyIGZvciBlYWNoIGVsZW1lbnQgaW4gc2V0IGluIGZvcm1hdCBgW2F0dHJzLCBkdXJhdGlvbiwgZWFzaW5nLCBjYWxsYmFja11gXG4gICAgID4gVXNhZ2VcbiAgICAgfCAvLyBhbmltYXRlIGFsbCBlbGVtZW50cyBpbiBzZXQgdG8gcmFkaXVzIDEwXG4gICAgIHwgc2V0LmFuaW1hdGUoe3I6IDEwfSwgNTAwLCBtaW5hLmVhc2Vpbik7XG4gICAgIHwgLy8gb3JcbiAgICAgfCAvLyBhbmltYXRlIGZpcnN0IGVsZW1lbnQgdG8gcmFkaXVzIDEwLCBidXQgc2Vjb25kIHRvIHJhZGl1cyAyMCBhbmQgaW4gZGlmZmVyZW50IHRpbWVcbiAgICAgfCBzZXQuYW5pbWF0ZShbe3I6IDEwfSwgNTAwLCBtaW5hLmVhc2Vpbl0sIFt7cjogMjB9LCAxNTAwLCBtaW5hLmVhc2Vpbl0pO1xuICAgICA9IChFbGVtZW50KSB0aGUgY3VycmVudCBlbGVtZW50XG4gICAgXFwqL1xuICAgIHNldHByb3RvLmFuaW1hdGUgPSBmdW5jdGlvbiAoYXR0cnMsIG1zLCBlYXNpbmcsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZWFzaW5nID09IFwiZnVuY3Rpb25cIiAmJiAhZWFzaW5nLmxlbmd0aCkge1xuICAgICAgICAgICAgY2FsbGJhY2sgPSBlYXNpbmc7XG4gICAgICAgICAgICBlYXNpbmcgPSBtaW5hLmxpbmVhcjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYXR0cnMgaW5zdGFuY2VvZiBTbmFwLl8uQW5pbWF0aW9uKSB7XG4gICAgICAgICAgICBjYWxsYmFjayA9IGF0dHJzLmNhbGxiYWNrO1xuICAgICAgICAgICAgZWFzaW5nID0gYXR0cnMuZWFzaW5nO1xuICAgICAgICAgICAgbXMgPSBlYXNpbmcuZHVyO1xuICAgICAgICAgICAgYXR0cnMgPSBhdHRycy5hdHRyO1xuICAgICAgICB9XG4gICAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgICBpZiAoU25hcC5pcyhhdHRycywgXCJhcnJheVwiKSAmJiBTbmFwLmlzKGFyZ3NbYXJncy5sZW5ndGggLSAxXSwgXCJhcnJheVwiKSkge1xuICAgICAgICAgICAgdmFyIGVhY2ggPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBiZWdpbixcbiAgICAgICAgICAgIGhhbmRsZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKGJlZ2luKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYiA9IGJlZ2luO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGJlZ2luID0gdGhpcy5iO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjYiA9IDAsXG4gICAgICAgICAgICBzZXQgPSB0aGlzLFxuICAgICAgICAgICAgY2FsbGJhY2tlciA9IGNhbGxiYWNrICYmIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoKytjYiA9PSBzZXQubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmNhbGwodGhpcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZm9yRWFjaChmdW5jdGlvbiAoZWwsIGkpIHtcbiAgICAgICAgICAgIGV2ZS5vbmNlKFwic25hcC5hbmltY3JlYXRlZC5cIiArIGVsLmlkLCBoYW5kbGVyKTtcbiAgICAgICAgICAgIGlmIChlYWNoKSB7XG4gICAgICAgICAgICAgICAgYXJnc1tpXSAmJiBlbC5hbmltYXRlLmFwcGx5KGVsLCBhcmdzW2ldKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZWwuYW5pbWF0ZShhdHRycywgbXMsIGVhc2luZywgY2FsbGJhY2tlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgc2V0cHJvdG8ucmVtb3ZlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB3aGlsZSAodGhpcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRoaXMucG9wKCkucmVtb3ZlKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogU2V0LmJpbmRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFNwZWNpZmllcyBob3cgdG8gaGFuZGxlIGEgc3BlY2lmaWMgYXR0cmlidXRlIHdoZW4gYXBwbGllZFxuICAgICAqIHRvIGEgc2V0LlxuICAgICAqXG4gICAgICoqXG4gICAgIC0gYXR0ciAoc3RyaW5nKSBhdHRyaWJ1dGUgbmFtZVxuICAgICAtIGNhbGxiYWNrIChmdW5jdGlvbikgZnVuY3Rpb24gdG8gcnVuXG4gICAgICogb3JcbiAgICAgLSBhdHRyIChzdHJpbmcpIGF0dHJpYnV0ZSBuYW1lXG4gICAgIC0gZWxlbWVudCAoRWxlbWVudCkgc3BlY2lmaWMgZWxlbWVudCBpbiB0aGUgc2V0IHRvIGFwcGx5IHRoZSBhdHRyaWJ1dGUgdG9cbiAgICAgKiBvclxuICAgICAtIGF0dHIgKHN0cmluZykgYXR0cmlidXRlIG5hbWVcbiAgICAgLSBlbGVtZW50IChFbGVtZW50KSBzcGVjaWZpYyBlbGVtZW50IGluIHRoZSBzZXQgdG8gYXBwbHkgdGhlIGF0dHJpYnV0ZSB0b1xuICAgICAtIGVhdHRyIChzdHJpbmcpIGF0dHJpYnV0ZSBvbiB0aGUgZWxlbWVudCB0byBiaW5kIHRoZSBhdHRyaWJ1dGUgdG9cbiAgICAgPSAob2JqZWN0KSBTZXQgb2JqZWN0XG4gICAgXFwqL1xuICAgIHNldHByb3RvLmJpbmQgPSBmdW5jdGlvbiAoYXR0ciwgYSwgYikge1xuICAgICAgICB2YXIgZGF0YSA9IHt9O1xuICAgICAgICBpZiAodHlwZW9mIGEgPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aGlzLmJpbmRpbmdzW2F0dHJdID0gYTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBhbmFtZSA9IGIgfHwgYXR0cjtcbiAgICAgICAgICAgIHRoaXMuYmluZGluZ3NbYXR0cl0gPSBmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgICAgIGRhdGFbYW5hbWVdID0gdjtcbiAgICAgICAgICAgICAgICBhLmF0dHIoZGF0YSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgc2V0cHJvdG8uYXR0ciA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB2YXIgdW5ib3VuZCA9IHt9O1xuICAgICAgICBmb3IgKHZhciBrIGluIHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5iaW5kaW5nc1trXSkge1xuICAgICAgICAgICAgICAgIHRoaXMuYmluZGluZ3Nba10odmFsdWVba10pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB1bmJvdW5kW2tdID0gdmFsdWVba107XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gdGhpcy5pdGVtcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLml0ZW1zW2ldLmF0dHIodW5ib3VuZCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogU2V0LmNsZWFyXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIGFsbCBlbGVtZW50cyBmcm9tIHRoZSBzZXRcbiAgICBcXCovXG4gICAgc2V0cHJvdG8uY2xlYXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHdoaWxlICh0aGlzLmxlbmd0aCkge1xuICAgICAgICAgICAgdGhpcy5wb3AoKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLypcXFxuICAgICAqIFNldC5zcGxpY2VcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgcmFuZ2Ugb2YgZWxlbWVudHMgZnJvbSB0aGUgc2V0XG4gICAgICoqXG4gICAgIC0gaW5kZXggKG51bWJlcikgcG9zaXRpb24gb2YgdGhlIGRlbGV0aW9uXG4gICAgIC0gY291bnQgKG51bWJlcikgbnVtYmVyIG9mIGVsZW1lbnQgdG8gcmVtb3ZlXG4gICAgIC0gaW5zZXJ0aW9u4oCmIChvYmplY3QpICNvcHRpb25hbCBlbGVtZW50cyB0byBpbnNlcnRcbiAgICAgPSAob2JqZWN0KSBzZXQgZWxlbWVudHMgdGhhdCB3ZXJlIGRlbGV0ZWRcbiAgICBcXCovXG4gICAgc2V0cHJvdG8uc3BsaWNlID0gZnVuY3Rpb24gKGluZGV4LCBjb3VudCwgaW5zZXJ0aW9uKSB7XG4gICAgICAgIGluZGV4ID0gaW5kZXggPCAwID8gbW1heCh0aGlzLmxlbmd0aCArIGluZGV4LCAwKSA6IGluZGV4O1xuICAgICAgICBjb3VudCA9IG1tYXgoMCwgbW1pbih0aGlzLmxlbmd0aCAtIGluZGV4LCBjb3VudCkpO1xuICAgICAgICB2YXIgdGFpbCA9IFtdLFxuICAgICAgICAgICAgdG9kZWwgPSBbXSxcbiAgICAgICAgICAgIGFyZ3MgPSBbXSxcbiAgICAgICAgICAgIGk7XG4gICAgICAgIGZvciAoaSA9IDI7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3MucHVzaChhcmd1bWVudHNbaV0pO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgICAgICB0b2RlbC5wdXNoKHRoaXNbaW5kZXggKyBpXSk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICg7IGkgPCB0aGlzLmxlbmd0aCAtIGluZGV4OyBpKyspIHtcbiAgICAgICAgICAgIHRhaWwucHVzaCh0aGlzW2luZGV4ICsgaV0pO1xuICAgICAgICB9XG4gICAgICAgIHZhciBhcmdsZW4gPSBhcmdzLmxlbmd0aDtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGFyZ2xlbiArIHRhaWwubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuaXRlbXNbaW5kZXggKyBpXSA9IHRoaXNbaW5kZXggKyBpXSA9IGkgPCBhcmdsZW4gPyBhcmdzW2ldIDogdGFpbFtpIC0gYXJnbGVuXTtcbiAgICAgICAgfVxuICAgICAgICBpID0gdGhpcy5pdGVtcy5sZW5ndGggPSB0aGlzLmxlbmd0aCAtPSBjb3VudCAtIGFyZ2xlbjtcbiAgICAgICAgd2hpbGUgKHRoaXNbaV0pIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzW2krK107XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBTZXQodG9kZWwpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFNldC5leGNsdWRlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIGdpdmVuIGVsZW1lbnQgZnJvbSB0aGUgc2V0XG4gICAgICoqXG4gICAgIC0gZWxlbWVudCAob2JqZWN0KSBlbGVtZW50IHRvIHJlbW92ZVxuICAgICA9IChib29sZWFuKSBgdHJ1ZWAgaWYgb2JqZWN0IHdhcyBmb3VuZCBhbmQgcmVtb3ZlZCBmcm9tIHRoZSBzZXRcbiAgICBcXCovXG4gICAgc2V0cHJvdG8uZXhjbHVkZSA9IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSB0aGlzLmxlbmd0aDsgaSA8IGlpOyBpKyspIGlmICh0aGlzW2ldID09IGVsKSB7XG4gICAgICAgICAgICB0aGlzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuICAgIHNldHByb3RvLmluc2VydEFmdGVyID0gZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgIHZhciBpID0gdGhpcy5pdGVtcy5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgIHRoaXMuaXRlbXNbaV0uaW5zZXJ0QWZ0ZXIoZWwpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgc2V0cHJvdG8uZ2V0QkJveCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHggPSBbXSxcbiAgICAgICAgICAgIHkgPSBbXSxcbiAgICAgICAgICAgIHgyID0gW10sXG4gICAgICAgICAgICB5MiA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gdGhpcy5pdGVtcy5sZW5ndGg7IGktLTspIGlmICghdGhpcy5pdGVtc1tpXS5yZW1vdmVkKSB7XG4gICAgICAgICAgICB2YXIgYm94ID0gdGhpcy5pdGVtc1tpXS5nZXRCQm94KCk7XG4gICAgICAgICAgICB4LnB1c2goYm94LngpO1xuICAgICAgICAgICAgeS5wdXNoKGJveC55KTtcbiAgICAgICAgICAgIHgyLnB1c2goYm94LnggKyBib3gud2lkdGgpO1xuICAgICAgICAgICAgeTIucHVzaChib3gueSArIGJveC5oZWlnaHQpO1xuICAgICAgICB9XG4gICAgICAgIHggPSBtbWluLmFwcGx5KDAsIHgpO1xuICAgICAgICB5ID0gbW1pbi5hcHBseSgwLCB5KTtcbiAgICAgICAgeDIgPSBtbWF4LmFwcGx5KDAsIHgyKTtcbiAgICAgICAgeTIgPSBtbWF4LmFwcGx5KDAsIHkyKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6IHgsXG4gICAgICAgICAgICB5OiB5LFxuICAgICAgICAgICAgeDI6IHgyLFxuICAgICAgICAgICAgeTI6IHkyLFxuICAgICAgICAgICAgd2lkdGg6IHgyIC0geCxcbiAgICAgICAgICAgIGhlaWdodDogeTIgLSB5LFxuICAgICAgICAgICAgY3g6IHggKyAoeDIgLSB4KSAvIDIsXG4gICAgICAgICAgICBjeTogeSArICh5MiAtIHkpIC8gMlxuICAgICAgICB9O1xuICAgIH07XG4gICAgc2V0cHJvdG8uY2xvbmUgPSBmdW5jdGlvbiAocykge1xuICAgICAgICBzID0gbmV3IFNldDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gdGhpcy5pdGVtcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICBzLnB1c2godGhpcy5pdGVtc1tpXS5jbG9uZSgpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcztcbiAgICB9O1xuICAgIHNldHByb3RvLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gXCJTbmFwXFx1MjAxOHMgc2V0XCI7XG4gICAgfTtcbiAgICBzZXRwcm90by50eXBlID0gXCJzZXRcIjtcbiAgICAvLyBleHBvcnRcbiAgICBTbmFwLlNldCA9IFNldDtcbiAgICBTbmFwLnNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHNldCA9IG5ldyBTZXQ7XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBzZXQucHVzaC5hcHBseShzZXQsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzZXQ7XG4gICAgfTtcbn0pO1xuXG4vLyBDb3B5cmlnaHQgKGMpIDIwMTMgQWRvYmUgU3lzdGVtcyBJbmNvcnBvcmF0ZWQuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBcbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vIFxuLy8gaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vLyBcbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5TbmFwLnBsdWdpbihmdW5jdGlvbiAoU25hcCwgRWxlbWVudCwgUGFwZXIsIGdsb2IpIHtcbiAgICB2YXIgbmFtZXMgPSB7fSxcbiAgICAgICAgcmVVbml0ID0gL1thLXpdKyQvaSxcbiAgICAgICAgU3RyID0gU3RyaW5nO1xuICAgIG5hbWVzLnN0cm9rZSA9IG5hbWVzLmZpbGwgPSBcImNvbG91clwiO1xuICAgIGZ1bmN0aW9uIGdldEVtcHR5KGl0ZW0pIHtcbiAgICAgICAgdmFyIGwgPSBpdGVtWzBdO1xuICAgICAgICBzd2l0Y2ggKGwudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICAgICAgY2FzZSBcInRcIjogcmV0dXJuIFtsLCAwLCAwXTtcbiAgICAgICAgICAgIGNhc2UgXCJtXCI6IHJldHVybiBbbCwgMSwgMCwgMCwgMSwgMCwgMF07XG4gICAgICAgICAgICBjYXNlIFwiclwiOiBpZiAoaXRlbS5sZW5ndGggPT0gNCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBbbCwgMCwgaXRlbVsyXSwgaXRlbVszXV07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBbbCwgMF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFwic1wiOiBpZiAoaXRlbS5sZW5ndGggPT0gNSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBbbCwgMSwgMSwgaXRlbVszXSwgaXRlbVs0XV07XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGl0ZW0ubGVuZ3RoID09IDMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW2wsIDEsIDFdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW2wsIDFdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIGVxdWFsaXNlVHJhbnNmb3JtKHQxLCB0MiwgZ2V0QkJveCkge1xuICAgICAgICB0MiA9IFN0cih0MikucmVwbGFjZSgvXFwuezN9fFxcdTIwMjYvZywgdDEpO1xuICAgICAgICB0MSA9IFNuYXAucGFyc2VUcmFuc2Zvcm1TdHJpbmcodDEpIHx8IFtdO1xuICAgICAgICB0MiA9IFNuYXAucGFyc2VUcmFuc2Zvcm1TdHJpbmcodDIpIHx8IFtdO1xuICAgICAgICB2YXIgbWF4bGVuZ3RoID0gTWF0aC5tYXgodDEubGVuZ3RoLCB0Mi5sZW5ndGgpLFxuICAgICAgICAgICAgZnJvbSA9IFtdLFxuICAgICAgICAgICAgdG8gPSBbXSxcbiAgICAgICAgICAgIGkgPSAwLCBqLCBqaixcbiAgICAgICAgICAgIHR0MSwgdHQyO1xuICAgICAgICBmb3IgKDsgaSA8IG1heGxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0dDEgPSB0MVtpXSB8fCBnZXRFbXB0eSh0MltpXSk7XG4gICAgICAgICAgICB0dDIgPSB0MltpXSB8fCBnZXRFbXB0eSh0dDEpO1xuICAgICAgICAgICAgaWYgKCh0dDFbMF0gIT0gdHQyWzBdKSB8fFxuICAgICAgICAgICAgICAgICh0dDFbMF0udG9Mb3dlckNhc2UoKSA9PSBcInJcIiAmJiAodHQxWzJdICE9IHR0MlsyXSB8fCB0dDFbM10gIT0gdHQyWzNdKSkgfHxcbiAgICAgICAgICAgICAgICAodHQxWzBdLnRvTG93ZXJDYXNlKCkgPT0gXCJzXCIgJiYgKHR0MVszXSAhPSB0dDJbM10gfHwgdHQxWzRdICE9IHR0Mls0XSkpXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgIHQxID0gU25hcC5fLnRyYW5zZm9ybTJtYXRyaXgodDEsIGdldEJCb3goKSk7XG4gICAgICAgICAgICAgICAgICAgIHQyID0gU25hcC5fLnRyYW5zZm9ybTJtYXRyaXgodDIsIGdldEJCb3goKSk7XG4gICAgICAgICAgICAgICAgICAgIGZyb20gPSBbW1wibVwiLCB0MS5hLCB0MS5iLCB0MS5jLCB0MS5kLCB0MS5lLCB0MS5mXV07XG4gICAgICAgICAgICAgICAgICAgIHRvID0gW1tcIm1cIiwgdDIuYSwgdDIuYiwgdDIuYywgdDIuZCwgdDIuZSwgdDIuZl1dO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZyb21baV0gPSBbXTtcbiAgICAgICAgICAgIHRvW2ldID0gW107XG4gICAgICAgICAgICBmb3IgKGogPSAwLCBqaiA9IE1hdGgubWF4KHR0MS5sZW5ndGgsIHR0Mi5sZW5ndGgpOyBqIDwgamo7IGorKykge1xuICAgICAgICAgICAgICAgIGogaW4gdHQxICYmIChmcm9tW2ldW2pdID0gdHQxW2pdKTtcbiAgICAgICAgICAgICAgICBqIGluIHR0MiAmJiAodG9baV1bal0gPSB0dDJbal0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBmcm9tOiBwYXRoMmFycmF5KGZyb20pLFxuICAgICAgICAgICAgdG86IHBhdGgyYXJyYXkodG8pLFxuICAgICAgICAgICAgZjogZ2V0UGF0aChmcm9tKVxuICAgICAgICB9O1xuICAgIH1cbiAgICBmdW5jdGlvbiBnZXROdW1iZXIodmFsKSB7XG4gICAgICAgIHJldHVybiB2YWw7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldFVuaXQodW5pdCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgICAgcmV0dXJuICt2YWwudG9GaXhlZCgzKSArIHVuaXQ7XG4gICAgICAgIH07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldFZpZXdCb3godmFsKSB7XG4gICAgICAgIHJldHVybiB2YWwuam9pbihcIiBcIik7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldENvbG91cihjbHIpIHtcbiAgICAgICAgcmV0dXJuIFNuYXAucmdiKGNsclswXSwgY2xyWzFdLCBjbHJbMl0pO1xuICAgIH1cbiAgICBmdW5jdGlvbiBnZXRQYXRoKHBhdGgpIHtcbiAgICAgICAgdmFyIGsgPSAwLCBpLCBpaSwgaiwgamosIG91dCwgYSwgYiA9IFtdO1xuICAgICAgICBmb3IgKGkgPSAwLCBpaSA9IHBhdGgubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgb3V0ID0gXCJbXCI7XG4gICAgICAgICAgICBhID0gWydcIicgKyBwYXRoW2ldWzBdICsgJ1wiJ107XG4gICAgICAgICAgICBmb3IgKGogPSAxLCBqaiA9IHBhdGhbaV0ubGVuZ3RoOyBqIDwgamo7IGorKykge1xuICAgICAgICAgICAgICAgIGFbal0gPSBcInZhbFtcIiArIChrKyspICsgXCJdXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvdXQgKz0gYSArIFwiXVwiO1xuICAgICAgICAgICAgYltpXSA9IG91dDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gRnVuY3Rpb24oXCJ2YWxcIiwgXCJyZXR1cm4gU25hcC5wYXRoLnRvU3RyaW5nLmNhbGwoW1wiICsgYiArIFwiXSlcIik7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHBhdGgyYXJyYXkocGF0aCkge1xuICAgICAgICB2YXIgb3V0ID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IHBhdGgubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDEsIGpqID0gcGF0aFtpXS5sZW5ndGg7IGogPCBqajsgaisrKSB7XG4gICAgICAgICAgICAgICAgb3V0LnB1c2gocGF0aFtpXVtqXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9XG4gICAgZnVuY3Rpb24gaXNOdW1lcmljKG9iaikge1xuICAgICAgICByZXR1cm4gaXNGaW5pdGUocGFyc2VGbG9hdChvYmopKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gYXJyYXlFcXVhbChhcnIxLCBhcnIyKSB7XG4gICAgICAgIGlmICghU25hcC5pcyhhcnIxLCBcImFycmF5XCIpIHx8ICFTbmFwLmlzKGFycjIsIFwiYXJyYXlcIikpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYXJyMS50b1N0cmluZygpID09IGFycjIudG9TdHJpbmcoKTtcbiAgICB9XG4gICAgRWxlbWVudC5wcm90b3R5cGUuZXF1YWwgPSBmdW5jdGlvbiAobmFtZSwgYikge1xuICAgICAgICByZXR1cm4gZXZlKFwic25hcC51dGlsLmVxdWFsXCIsIHRoaXMsIG5hbWUsIGIpLmZpcnN0RGVmaW5lZCgpO1xuICAgIH07XG4gICAgZXZlLm9uKFwic25hcC51dGlsLmVxdWFsXCIsIGZ1bmN0aW9uIChuYW1lLCBiKSB7XG4gICAgICAgIHZhciBBLCBCLCBhID0gU3RyKHRoaXMuYXR0cihuYW1lKSB8fCBcIlwiKSxcbiAgICAgICAgICAgIGVsID0gdGhpcztcbiAgICAgICAgaWYgKGlzTnVtZXJpYyhhKSAmJiBpc051bWVyaWMoYikpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgZnJvbTogcGFyc2VGbG9hdChhKSxcbiAgICAgICAgICAgICAgICB0bzogcGFyc2VGbG9hdChiKSxcbiAgICAgICAgICAgICAgICBmOiBnZXROdW1iZXJcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5hbWVzW25hbWVdID09IFwiY29sb3VyXCIpIHtcbiAgICAgICAgICAgIEEgPSBTbmFwLmNvbG9yKGEpO1xuICAgICAgICAgICAgQiA9IFNuYXAuY29sb3IoYik7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGZyb206IFtBLnIsIEEuZywgQS5iLCBBLm9wYWNpdHldLFxuICAgICAgICAgICAgICAgIHRvOiBbQi5yLCBCLmcsIEIuYiwgQi5vcGFjaXR5XSxcbiAgICAgICAgICAgICAgICBmOiBnZXRDb2xvdXJcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5hbWUgPT0gXCJ2aWV3Qm94XCIpIHtcbiAgICAgICAgICAgIEEgPSB0aGlzLmF0dHIobmFtZSkudmIuc3BsaXQoXCIgXCIpLm1hcChOdW1iZXIpO1xuICAgICAgICAgICAgQiA9IGIuc3BsaXQoXCIgXCIpLm1hcChOdW1iZXIpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBmcm9tOiBBLFxuICAgICAgICAgICAgICAgIHRvOiBCLFxuICAgICAgICAgICAgICAgIGY6IGdldFZpZXdCb3hcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5hbWUgPT0gXCJ0cmFuc2Zvcm1cIiB8fCBuYW1lID09IFwiZ3JhZGllbnRUcmFuc2Zvcm1cIiB8fCBuYW1lID09IFwicGF0dGVyblRyYW5zZm9ybVwiKSB7XG4gICAgICAgICAgICBpZiAoYiBpbnN0YW5jZW9mIFNuYXAuTWF0cml4KSB7XG4gICAgICAgICAgICAgICAgYiA9IGIudG9UcmFuc2Zvcm1TdHJpbmcoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghU25hcC5fLnJnVHJhbnNmb3JtLnRlc3QoYikpIHtcbiAgICAgICAgICAgICAgICBiID0gU25hcC5fLnN2Z1RyYW5zZm9ybTJzdHJpbmcoYik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZXF1YWxpc2VUcmFuc2Zvcm0oYSwgYiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBlbC5nZXRCQm94KDEpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5hbWUgPT0gXCJkXCIgfHwgbmFtZSA9PSBcInBhdGhcIikge1xuICAgICAgICAgICAgQSA9IFNuYXAucGF0aC50b0N1YmljKGEsIGIpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBmcm9tOiBwYXRoMmFycmF5KEFbMF0pLFxuICAgICAgICAgICAgICAgIHRvOiBwYXRoMmFycmF5KEFbMV0pLFxuICAgICAgICAgICAgICAgIGY6IGdldFBhdGgoQVswXSlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5hbWUgPT0gXCJwb2ludHNcIikge1xuICAgICAgICAgICAgQSA9IFN0cihhKS5zcGxpdChTbmFwLl8uc2VwYXJhdG9yKTtcbiAgICAgICAgICAgIEIgPSBTdHIoYikuc3BsaXQoU25hcC5fLnNlcGFyYXRvcik7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGZyb206IEEsXG4gICAgICAgICAgICAgICAgdG86IEIsXG4gICAgICAgICAgICAgICAgZjogZnVuY3Rpb24gKHZhbCkgeyByZXR1cm4gdmFsOyB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHZhciBhVW5pdCA9IGEubWF0Y2gocmVVbml0KSxcbiAgICAgICAgICAgIGJVbml0ID0gU3RyKGIpLm1hdGNoKHJlVW5pdCk7XG4gICAgICAgIGlmIChhVW5pdCAmJiBhcnJheUVxdWFsKGFVbml0LCBiVW5pdCkpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgZnJvbTogcGFyc2VGbG9hdChhKSxcbiAgICAgICAgICAgICAgICB0bzogcGFyc2VGbG9hdChiKSxcbiAgICAgICAgICAgICAgICBmOiBnZXRVbml0KGFVbml0KVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgZnJvbTogdGhpcy5hc1BYKG5hbWUpLFxuICAgICAgICAgICAgICAgIHRvOiB0aGlzLmFzUFgobmFtZSwgYiksXG4gICAgICAgICAgICAgICAgZjogZ2V0TnVtYmVyXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuLy8gQ29weXJpZ2h0IChjKSAyMDEzIEFkb2JlIFN5c3RlbXMgSW5jb3Jwb3JhdGVkLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vLyBcbi8vIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy8gXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuU25hcC5wbHVnaW4oZnVuY3Rpb24gKFNuYXAsIEVsZW1lbnQsIFBhcGVyLCBnbG9iKSB7XG4gICAgdmFyIGVscHJvdG8gPSBFbGVtZW50LnByb3RvdHlwZSxcbiAgICBoYXMgPSBcImhhc093blByb3BlcnR5XCIsXG4gICAgc3VwcG9ydHNUb3VjaCA9IFwiY3JlYXRlVG91Y2hcIiBpbiBnbG9iLmRvYyxcbiAgICBldmVudHMgPSBbXG4gICAgICAgIFwiY2xpY2tcIiwgXCJkYmxjbGlja1wiLCBcIm1vdXNlZG93blwiLCBcIm1vdXNlbW92ZVwiLCBcIm1vdXNlb3V0XCIsXG4gICAgICAgIFwibW91c2VvdmVyXCIsIFwibW91c2V1cFwiLCBcInRvdWNoc3RhcnRcIiwgXCJ0b3VjaG1vdmVcIiwgXCJ0b3VjaGVuZFwiLFxuICAgICAgICBcInRvdWNoY2FuY2VsXCJcbiAgICBdLFxuICAgIHRvdWNoTWFwID0ge1xuICAgICAgICBtb3VzZWRvd246IFwidG91Y2hzdGFydFwiLFxuICAgICAgICBtb3VzZW1vdmU6IFwidG91Y2htb3ZlXCIsXG4gICAgICAgIG1vdXNldXA6IFwidG91Y2hlbmRcIlxuICAgIH0sXG4gICAgZ2V0U2Nyb2xsID0gZnVuY3Rpb24gKHh5LCBlbCkge1xuICAgICAgICB2YXIgbmFtZSA9IHh5ID09IFwieVwiID8gXCJzY3JvbGxUb3BcIiA6IFwic2Nyb2xsTGVmdFwiLFxuICAgICAgICAgICAgZG9jID0gZWwgJiYgZWwubm9kZSA/IGVsLm5vZGUub3duZXJEb2N1bWVudCA6IGdsb2IuZG9jO1xuICAgICAgICByZXR1cm4gZG9jW25hbWUgaW4gZG9jLmRvY3VtZW50RWxlbWVudCA/IFwiZG9jdW1lbnRFbGVtZW50XCIgOiBcImJvZHlcIl1bbmFtZV07XG4gICAgfSxcbiAgICBwcmV2ZW50RGVmYXVsdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICAgIH0sXG4gICAgcHJldmVudFRvdWNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vcmlnaW5hbEV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfSxcbiAgICBzdG9wUHJvcGFnYXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuY2FuY2VsQnViYmxlID0gdHJ1ZTtcbiAgICB9LFxuICAgIHN0b3BUb3VjaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3JpZ2luYWxFdmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9LFxuICAgIGFkZEV2ZW50ID0gZnVuY3Rpb24gKG9iaiwgdHlwZSwgZm4sIGVsZW1lbnQpIHtcbiAgICAgICAgdmFyIHJlYWxOYW1lID0gc3VwcG9ydHNUb3VjaCAmJiB0b3VjaE1hcFt0eXBlXSA/IHRvdWNoTWFwW3R5cGVdIDogdHlwZSxcbiAgICAgICAgICAgIGYgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIHZhciBzY3JvbGxZID0gZ2V0U2Nyb2xsKFwieVwiLCBlbGVtZW50KSxcbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsWCA9IGdldFNjcm9sbChcInhcIiwgZWxlbWVudCk7XG4gICAgICAgICAgICAgICAgaWYgKHN1cHBvcnRzVG91Y2ggJiYgdG91Y2hNYXBbaGFzXSh0eXBlKSkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBlLnRhcmdldFRvdWNoZXMgJiYgZS50YXJnZXRUb3VjaGVzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLnRhcmdldFRvdWNoZXNbaV0udGFyZ2V0ID09IG9iaiB8fCBvYmouY29udGFpbnMoZS50YXJnZXRUb3VjaGVzW2ldLnRhcmdldCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgb2xkZSA9IGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZSA9IGUudGFyZ2V0VG91Y2hlc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLm9yaWdpbmFsRXZlbnQgPSBvbGRlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQgPSBwcmV2ZW50VG91Y2g7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24gPSBzdG9wVG91Y2g7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHggPSBlLmNsaWVudFggKyBzY3JvbGxYLFxuICAgICAgICAgICAgICAgICAgICB5ID0gZS5jbGllbnRZICsgc2Nyb2xsWTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZm4uY2FsbChlbGVtZW50LCBlLCB4LCB5KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgaWYgKHR5cGUgIT09IHJlYWxOYW1lKSB7XG4gICAgICAgICAgICBvYmouYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBmLCBmYWxzZSk7XG4gICAgICAgIH1cblxuICAgICAgICBvYmouYWRkRXZlbnRMaXN0ZW5lcihyZWFsTmFtZSwgZiwgZmFsc2UpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAodHlwZSAhPT0gcmVhbE5hbWUpIHtcbiAgICAgICAgICAgICAgICBvYmoucmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlLCBmLCBmYWxzZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG9iai5yZW1vdmVFdmVudExpc3RlbmVyKHJlYWxOYW1lLCBmLCBmYWxzZSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIGRyYWcgPSBbXSxcbiAgICBkcmFnTW92ZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHZhciB4ID0gZS5jbGllbnRYLFxuICAgICAgICAgICAgeSA9IGUuY2xpZW50WSxcbiAgICAgICAgICAgIHNjcm9sbFkgPSBnZXRTY3JvbGwoXCJ5XCIpLFxuICAgICAgICAgICAgc2Nyb2xsWCA9IGdldFNjcm9sbChcInhcIiksXG4gICAgICAgICAgICBkcmFnaSxcbiAgICAgICAgICAgIGogPSBkcmFnLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGotLSkge1xuICAgICAgICAgICAgZHJhZ2kgPSBkcmFnW2pdO1xuICAgICAgICAgICAgaWYgKHN1cHBvcnRzVG91Y2gpIHtcbiAgICAgICAgICAgICAgICB2YXIgaSA9IGUudG91Y2hlcyAmJiBlLnRvdWNoZXMubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICB0b3VjaDtcbiAgICAgICAgICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICAgICAgICAgIHRvdWNoID0gZS50b3VjaGVzW2ldO1xuICAgICAgICAgICAgICAgICAgICBpZiAodG91Y2guaWRlbnRpZmllciA9PSBkcmFnaS5lbC5fZHJhZy5pZCB8fCBkcmFnaS5lbC5ub2RlLmNvbnRhaW5zKHRvdWNoLnRhcmdldCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHggPSB0b3VjaC5jbGllbnRYO1xuICAgICAgICAgICAgICAgICAgICAgICAgeSA9IHRvdWNoLmNsaWVudFk7XG4gICAgICAgICAgICAgICAgICAgICAgICAoZS5vcmlnaW5hbEV2ZW50ID8gZS5vcmlnaW5hbEV2ZW50IDogZSkucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgbm9kZSA9IGRyYWdpLmVsLm5vZGUsXG4gICAgICAgICAgICAgICAgbyxcbiAgICAgICAgICAgICAgICBuZXh0ID0gbm9kZS5uZXh0U2libGluZyxcbiAgICAgICAgICAgICAgICBwYXJlbnQgPSBub2RlLnBhcmVudE5vZGUsXG4gICAgICAgICAgICAgICAgZGlzcGxheSA9IG5vZGUuc3R5bGUuZGlzcGxheTtcbiAgICAgICAgICAgIC8vIGdsb2Iud2luLm9wZXJhICYmIHBhcmVudC5yZW1vdmVDaGlsZChub2RlKTtcbiAgICAgICAgICAgIC8vIG5vZGUuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgLy8gbyA9IGRyYWdpLmVsLnBhcGVyLmdldEVsZW1lbnRCeVBvaW50KHgsIHkpO1xuICAgICAgICAgICAgLy8gbm9kZS5zdHlsZS5kaXNwbGF5ID0gZGlzcGxheTtcbiAgICAgICAgICAgIC8vIGdsb2Iud2luLm9wZXJhICYmIChuZXh0ID8gcGFyZW50Lmluc2VydEJlZm9yZShub2RlLCBuZXh0KSA6IHBhcmVudC5hcHBlbmRDaGlsZChub2RlKSk7XG4gICAgICAgICAgICAvLyBvICYmIGV2ZShcInNuYXAuZHJhZy5vdmVyLlwiICsgZHJhZ2kuZWwuaWQsIGRyYWdpLmVsLCBvKTtcbiAgICAgICAgICAgIHggKz0gc2Nyb2xsWDtcbiAgICAgICAgICAgIHkgKz0gc2Nyb2xsWTtcbiAgICAgICAgICAgIGV2ZShcInNuYXAuZHJhZy5tb3ZlLlwiICsgZHJhZ2kuZWwuaWQsIGRyYWdpLm1vdmVfc2NvcGUgfHwgZHJhZ2kuZWwsIHggLSBkcmFnaS5lbC5fZHJhZy54LCB5IC0gZHJhZ2kuZWwuX2RyYWcueSwgeCwgeSwgZSk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGRyYWdVcCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIFNuYXAudW5tb3VzZW1vdmUoZHJhZ01vdmUpLnVubW91c2V1cChkcmFnVXApO1xuICAgICAgICB2YXIgaSA9IGRyYWcubGVuZ3RoLFxuICAgICAgICAgICAgZHJhZ2k7XG4gICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgIGRyYWdpID0gZHJhZ1tpXTtcbiAgICAgICAgICAgIGRyYWdpLmVsLl9kcmFnID0ge307XG4gICAgICAgICAgICBldmUoXCJzbmFwLmRyYWcuZW5kLlwiICsgZHJhZ2kuZWwuaWQsIGRyYWdpLmVuZF9zY29wZSB8fCBkcmFnaS5zdGFydF9zY29wZSB8fCBkcmFnaS5tb3ZlX3Njb3BlIHx8IGRyYWdpLmVsLCBlKTtcbiAgICAgICAgICAgIGV2ZS5vZmYoXCJzbmFwLmRyYWcuKi5cIiArIGRyYWdpLmVsLmlkKTtcbiAgICAgICAgfVxuICAgICAgICBkcmFnID0gW107XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5jbGlja1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQWRkcyBhIGNsaWNrIGV2ZW50IGhhbmRsZXIgdG8gdGhlIGVsZW1lbnRcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudW5jbGlja1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyBhIGNsaWNrIGV2ZW50IGhhbmRsZXIgZnJvbSB0aGUgZWxlbWVudFxuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICBcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5kYmxjbGlja1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQWRkcyBhIGRvdWJsZSBjbGljayBldmVudCBoYW5kbGVyIHRvIHRoZSBlbGVtZW50XG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnVuZGJsY2xpY2tcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgYSBkb3VibGUgY2xpY2sgZXZlbnQgaGFuZGxlciBmcm9tIHRoZSBlbGVtZW50XG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIFxuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50Lm1vdXNlZG93blxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQWRkcyBhIG1vdXNlZG93biBldmVudCBoYW5kbGVyIHRvIHRoZSBlbGVtZW50XG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnVubW91c2Vkb3duXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIGEgbW91c2Vkb3duIGV2ZW50IGhhbmRsZXIgZnJvbSB0aGUgZWxlbWVudFxuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICBcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5tb3VzZW1vdmVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEFkZHMgYSBtb3VzZW1vdmUgZXZlbnQgaGFuZGxlciB0byB0aGUgZWxlbWVudFxuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC51bm1vdXNlbW92ZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyBhIG1vdXNlbW92ZSBldmVudCBoYW5kbGVyIGZyb20gdGhlIGVsZW1lbnRcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQubW91c2VvdXRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEFkZHMgYSBtb3VzZW91dCBldmVudCBoYW5kbGVyIHRvIHRoZSBlbGVtZW50XG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnVubW91c2VvdXRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgYSBtb3VzZW91dCBldmVudCBoYW5kbGVyIGZyb20gdGhlIGVsZW1lbnRcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQubW91c2VvdmVyXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBBZGRzIGEgbW91c2VvdmVyIGV2ZW50IGhhbmRsZXIgdG8gdGhlIGVsZW1lbnRcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudW5tb3VzZW92ZXJcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgYSBtb3VzZW92ZXIgZXZlbnQgaGFuZGxlciBmcm9tIHRoZSBlbGVtZW50XG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIFxuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50Lm1vdXNldXBcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEFkZHMgYSBtb3VzZXVwIGV2ZW50IGhhbmRsZXIgdG8gdGhlIGVsZW1lbnRcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudW5tb3VzZXVwXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIGEgbW91c2V1cCBldmVudCBoYW5kbGVyIGZyb20gdGhlIGVsZW1lbnRcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudG91Y2hzdGFydFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQWRkcyBhIHRvdWNoc3RhcnQgZXZlbnQgaGFuZGxlciB0byB0aGUgZWxlbWVudFxuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC51bnRvdWNoc3RhcnRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgYSB0b3VjaHN0YXJ0IGV2ZW50IGhhbmRsZXIgZnJvbSB0aGUgZWxlbWVudFxuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICBcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC50b3VjaG1vdmVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEFkZHMgYSB0b3VjaG1vdmUgZXZlbnQgaGFuZGxlciB0byB0aGUgZWxlbWVudFxuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC51bnRvdWNobW92ZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyBhIHRvdWNobW92ZSBldmVudCBoYW5kbGVyIGZyb20gdGhlIGVsZW1lbnRcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudG91Y2hlbmRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEFkZHMgYSB0b3VjaGVuZCBldmVudCBoYW5kbGVyIHRvIHRoZSBlbGVtZW50XG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnVudG91Y2hlbmRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgYSB0b3VjaGVuZCBldmVudCBoYW5kbGVyIGZyb20gdGhlIGVsZW1lbnRcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudG91Y2hjYW5jZWxcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEFkZHMgYSB0b3VjaGNhbmNlbCBldmVudCBoYW5kbGVyIHRvIHRoZSBlbGVtZW50XG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnVudG91Y2hjYW5jZWxcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgYSB0b3VjaGNhbmNlbCBldmVudCBoYW5kbGVyIGZyb20gdGhlIGVsZW1lbnRcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgZm9yICh2YXIgaSA9IGV2ZW50cy5sZW5ndGg7IGktLTspIHtcbiAgICAgICAgKGZ1bmN0aW9uIChldmVudE5hbWUpIHtcbiAgICAgICAgICAgIFNuYXBbZXZlbnROYW1lXSA9IGVscHJvdG9bZXZlbnROYW1lXSA9IGZ1bmN0aW9uIChmbiwgc2NvcGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoU25hcC5pcyhmbiwgXCJmdW5jdGlvblwiKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmV2ZW50cyA9IHRoaXMuZXZlbnRzIHx8IFtdO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmV2ZW50cy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGV2ZW50TmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGY6IGZuLFxuICAgICAgICAgICAgICAgICAgICAgICAgdW5iaW5kOiBhZGRFdmVudCh0aGlzLm5vZGUgfHwgZG9jdW1lbnQsIGV2ZW50TmFtZSwgZm4sIHNjb3BlIHx8IHRoaXMpXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IHRoaXMuZXZlbnRzLmxlbmd0aDsgaSA8IGlpOyBpKyspIGlmICh0aGlzLmV2ZW50c1tpXS5uYW1lID09IGV2ZW50TmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmV2ZW50c1tpXS5mLmNhbGwodGhpcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFNuYXBbXCJ1blwiICsgZXZlbnROYW1lXSA9XG4gICAgICAgICAgICBlbHByb3RvW1widW5cIiArIGV2ZW50TmFtZV0gPSBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgICAgICB2YXIgZXZlbnRzID0gdGhpcy5ldmVudHMgfHwgW10sXG4gICAgICAgICAgICAgICAgICAgIGwgPSBldmVudHMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHdoaWxlIChsLS0pIGlmIChldmVudHNbbF0ubmFtZSA9PSBldmVudE5hbWUgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZXZlbnRzW2xdLmYgPT0gZm4gfHwgIWZuKSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudHNbbF0udW5iaW5kKCk7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50cy5zcGxpY2UobCwgMSk7XG4gICAgICAgICAgICAgICAgICAgICFldmVudHMubGVuZ3RoICYmIGRlbGV0ZSB0aGlzLmV2ZW50cztcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSkoZXZlbnRzW2ldKTtcbiAgICB9XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuaG92ZXJcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEFkZHMgaG92ZXIgZXZlbnQgaGFuZGxlcnMgdG8gdGhlIGVsZW1lbnRcbiAgICAgLSBmX2luIChmdW5jdGlvbikgaGFuZGxlciBmb3IgaG92ZXIgaW5cbiAgICAgLSBmX291dCAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIGhvdmVyIG91dFxuICAgICAtIGljb250ZXh0IChvYmplY3QpICNvcHRpb25hbCBjb250ZXh0IGZvciBob3ZlciBpbiBoYW5kbGVyXG4gICAgIC0gb2NvbnRleHQgKG9iamVjdCkgI29wdGlvbmFsIGNvbnRleHQgZm9yIGhvdmVyIG91dCBoYW5kbGVyXG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgZWxwcm90by5ob3ZlciA9IGZ1bmN0aW9uIChmX2luLCBmX291dCwgc2NvcGVfaW4sIHNjb3BlX291dCkge1xuICAgICAgICByZXR1cm4gdGhpcy5tb3VzZW92ZXIoZl9pbiwgc2NvcGVfaW4pLm1vdXNlb3V0KGZfb3V0LCBzY29wZV9vdXQgfHwgc2NvcGVfaW4pO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudW5ob3ZlclxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyBob3ZlciBldmVudCBoYW5kbGVycyBmcm9tIHRoZSBlbGVtZW50XG4gICAgIC0gZl9pbiAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIGhvdmVyIGluXG4gICAgIC0gZl9vdXQgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciBob3ZlciBvdXRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICBlbHByb3RvLnVuaG92ZXIgPSBmdW5jdGlvbiAoZl9pbiwgZl9vdXQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudW5tb3VzZW92ZXIoZl9pbikudW5tb3VzZW91dChmX291dCk7XG4gICAgfTtcbiAgICB2YXIgZHJhZ2dhYmxlID0gW107XG4gICAgLy8gU0lFUlJBIHVuY2xlYXIgd2hhdCBfY29udGV4dF8gcmVmZXJzIHRvIGZvciBzdGFydGluZywgZW5kaW5nLCBtb3ZpbmcgdGhlIGRyYWcgZ2VzdHVyZS5cbiAgICAvLyBTSUVSUkEgRWxlbWVudC5kcmFnKCk6IF94IHBvc2l0aW9uIG9mIHRoZSBtb3VzZV86IFdoZXJlIGFyZSB0aGUgeC95IHZhbHVlcyBvZmZzZXQgZnJvbT9cbiAgICAvLyBTSUVSUkEgRWxlbWVudC5kcmFnKCk6IG11Y2ggb2YgdGhpcyBtZW1iZXIncyBkb2MgYXBwZWFycyB0byBiZSBkdXBsaWNhdGVkIGZvciBzb21lIHJlYXNvbi5cbiAgICAvLyBTSUVSUkEgVW5jbGVhciBhYm91dCB0aGlzIHNlbnRlbmNlOiBfQWRkaXRpb25hbGx5IGZvbGxvd2luZyBkcmFnIGV2ZW50cyB3aWxsIGJlIHRyaWdnZXJlZDogZHJhZy5zdGFydC48aWQ+IG9uIHN0YXJ0LCBkcmFnLmVuZC48aWQ+IG9uIGVuZCBhbmQgZHJhZy5tb3ZlLjxpZD4gb24gZXZlcnkgbW92ZS5fIElzIHRoZXJlIGEgZ2xvYmFsIF9kcmFnXyBvYmplY3QgdG8gd2hpY2ggeW91IGNhbiBhc3NpZ24gaGFuZGxlcnMga2V5ZWQgYnkgYW4gZWxlbWVudCdzIElEP1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LmRyYWdcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEFkZHMgZXZlbnQgaGFuZGxlcnMgZm9yIGFuIGVsZW1lbnQncyBkcmFnIGdlc3R1cmVcbiAgICAgKipcbiAgICAgLSBvbm1vdmUgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciBtb3ZpbmdcbiAgICAgLSBvbnN0YXJ0IChmdW5jdGlvbikgaGFuZGxlciBmb3IgZHJhZyBzdGFydFxuICAgICAtIG9uZW5kIChmdW5jdGlvbikgaGFuZGxlciBmb3IgZHJhZyBlbmRcbiAgICAgLSBtY29udGV4dCAob2JqZWN0KSAjb3B0aW9uYWwgY29udGV4dCBmb3IgbW92aW5nIGhhbmRsZXJcbiAgICAgLSBzY29udGV4dCAob2JqZWN0KSAjb3B0aW9uYWwgY29udGV4dCBmb3IgZHJhZyBzdGFydCBoYW5kbGVyXG4gICAgIC0gZWNvbnRleHQgKG9iamVjdCkgI29wdGlvbmFsIGNvbnRleHQgZm9yIGRyYWcgZW5kIGhhbmRsZXJcbiAgICAgKiBBZGRpdGlvbmFseSBmb2xsb3dpbmcgYGRyYWdgIGV2ZW50cyBhcmUgdHJpZ2dlcmVkOiBgZHJhZy5zdGFydC48aWQ+YCBvbiBzdGFydCwgXG4gICAgICogYGRyYWcuZW5kLjxpZD5gIG9uIGVuZCBhbmQgYGRyYWcubW92ZS48aWQ+YCBvbiBldmVyeSBtb3ZlLiBXaGVuIGVsZW1lbnQgaXMgZHJhZ2dlZCBvdmVyIGFub3RoZXIgZWxlbWVudCBcbiAgICAgKiBgZHJhZy5vdmVyLjxpZD5gIGZpcmVzIGFzIHdlbGwuXG4gICAgICpcbiAgICAgKiBTdGFydCBldmVudCBhbmQgc3RhcnQgaGFuZGxlciBhcmUgY2FsbGVkIGluIHNwZWNpZmllZCBjb250ZXh0IG9yIGluIGNvbnRleHQgb2YgdGhlIGVsZW1lbnQgd2l0aCBmb2xsb3dpbmcgcGFyYW1ldGVyczpcbiAgICAgbyB4IChudW1iZXIpIHggcG9zaXRpb24gb2YgdGhlIG1vdXNlXG4gICAgIG8geSAobnVtYmVyKSB5IHBvc2l0aW9uIG9mIHRoZSBtb3VzZVxuICAgICBvIGV2ZW50IChvYmplY3QpIERPTSBldmVudCBvYmplY3RcbiAgICAgKiBNb3ZlIGV2ZW50IGFuZCBtb3ZlIGhhbmRsZXIgYXJlIGNhbGxlZCBpbiBzcGVjaWZpZWQgY29udGV4dCBvciBpbiBjb250ZXh0IG9mIHRoZSBlbGVtZW50IHdpdGggZm9sbG93aW5nIHBhcmFtZXRlcnM6XG4gICAgIG8gZHggKG51bWJlcikgc2hpZnQgYnkgeCBmcm9tIHRoZSBzdGFydCBwb2ludFxuICAgICBvIGR5IChudW1iZXIpIHNoaWZ0IGJ5IHkgZnJvbSB0aGUgc3RhcnQgcG9pbnRcbiAgICAgbyB4IChudW1iZXIpIHggcG9zaXRpb24gb2YgdGhlIG1vdXNlXG4gICAgIG8geSAobnVtYmVyKSB5IHBvc2l0aW9uIG9mIHRoZSBtb3VzZVxuICAgICBvIGV2ZW50IChvYmplY3QpIERPTSBldmVudCBvYmplY3RcbiAgICAgKiBFbmQgZXZlbnQgYW5kIGVuZCBoYW5kbGVyIGFyZSBjYWxsZWQgaW4gc3BlY2lmaWVkIGNvbnRleHQgb3IgaW4gY29udGV4dCBvZiB0aGUgZWxlbWVudCB3aXRoIGZvbGxvd2luZyBwYXJhbWV0ZXJzOlxuICAgICBvIGV2ZW50IChvYmplY3QpIERPTSBldmVudCBvYmplY3RcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICBlbHByb3RvLmRyYWcgPSBmdW5jdGlvbiAob25tb3ZlLCBvbnN0YXJ0LCBvbmVuZCwgbW92ZV9zY29wZSwgc3RhcnRfc2NvcGUsIGVuZF9zY29wZSkge1xuICAgICAgICB2YXIgZWwgPSB0aGlzO1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHZhciBvcmlnVHJhbnNmb3JtO1xuICAgICAgICAgICAgcmV0dXJuIGVsLmRyYWcoZnVuY3Rpb24gKGR4LCBkeSkge1xuICAgICAgICAgICAgICAgIHRoaXMuYXR0cih7XG4gICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybTogb3JpZ1RyYW5zZm9ybSArIChvcmlnVHJhbnNmb3JtID8gXCJUXCIgOiBcInRcIikgKyBbZHgsIGR5XVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIG9yaWdUcmFuc2Zvcm0gPSB0aGlzLnRyYW5zZm9ybSgpLmxvY2FsO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gc3RhcnQoZSwgeCwgeSkge1xuICAgICAgICAgICAgKGUub3JpZ2luYWxFdmVudCB8fCBlKS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgZWwuX2RyYWcueCA9IHg7XG4gICAgICAgICAgICBlbC5fZHJhZy55ID0geTtcbiAgICAgICAgICAgIGVsLl9kcmFnLmlkID0gZS5pZGVudGlmaWVyO1xuICAgICAgICAgICAgIWRyYWcubGVuZ3RoICYmIFNuYXAubW91c2Vtb3ZlKGRyYWdNb3ZlKS5tb3VzZXVwKGRyYWdVcCk7XG4gICAgICAgICAgICBkcmFnLnB1c2goe2VsOiBlbCwgbW92ZV9zY29wZTogbW92ZV9zY29wZSwgc3RhcnRfc2NvcGU6IHN0YXJ0X3Njb3BlLCBlbmRfc2NvcGU6IGVuZF9zY29wZX0pO1xuICAgICAgICAgICAgb25zdGFydCAmJiBldmUub24oXCJzbmFwLmRyYWcuc3RhcnQuXCIgKyBlbC5pZCwgb25zdGFydCk7XG4gICAgICAgICAgICBvbm1vdmUgJiYgZXZlLm9uKFwic25hcC5kcmFnLm1vdmUuXCIgKyBlbC5pZCwgb25tb3ZlKTtcbiAgICAgICAgICAgIG9uZW5kICYmIGV2ZS5vbihcInNuYXAuZHJhZy5lbmQuXCIgKyBlbC5pZCwgb25lbmQpO1xuICAgICAgICAgICAgZXZlKFwic25hcC5kcmFnLnN0YXJ0LlwiICsgZWwuaWQsIHN0YXJ0X3Njb3BlIHx8IG1vdmVfc2NvcGUgfHwgZWwsIHgsIHksIGUpO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIGluaXQoZSwgeCwgeSkge1xuICAgICAgICAgICAgZXZlKFwic25hcC5kcmFnaW5pdC5cIiArIGVsLmlkLCBlbCwgZSwgeCwgeSk7XG4gICAgICAgIH1cbiAgICAgICAgZXZlLm9uKFwic25hcC5kcmFnaW5pdC5cIiArIGVsLmlkLCBzdGFydCk7XG4gICAgICAgIGVsLl9kcmFnID0ge307XG4gICAgICAgIGRyYWdnYWJsZS5wdXNoKHtlbDogZWwsIHN0YXJ0OiBzdGFydCwgaW5pdDogaW5pdH0pO1xuICAgICAgICBlbC5tb3VzZWRvd24oaW5pdCk7XG4gICAgICAgIHJldHVybiBlbDtcbiAgICB9O1xuICAgIC8qXG4gICAgICogRWxlbWVudC5vbkRyYWdPdmVyXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBTaG9ydGN1dCB0byBhc3NpZ24gZXZlbnQgaGFuZGxlciBmb3IgYGRyYWcub3Zlci48aWQ+YCBldmVudCwgd2hlcmUgYGlkYCBpcyB0aGUgZWxlbWVudCdzIGBpZGAgKHNlZSBARWxlbWVudC5pZClcbiAgICAgLSBmIChmdW5jdGlvbikgaGFuZGxlciBmb3IgZXZlbnQsIGZpcnN0IGFyZ3VtZW50IHdvdWxkIGJlIHRoZSBlbGVtZW50IHlvdSBhcmUgZHJhZ2dpbmcgb3ZlclxuICAgIFxcKi9cbiAgICAvLyBlbHByb3RvLm9uRHJhZ092ZXIgPSBmdW5jdGlvbiAoZikge1xuICAgIC8vICAgICBmID8gZXZlLm9uKFwic25hcC5kcmFnLm92ZXIuXCIgKyB0aGlzLmlkLCBmKSA6IGV2ZS51bmJpbmQoXCJzbmFwLmRyYWcub3Zlci5cIiArIHRoaXMuaWQpO1xuICAgIC8vIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudW5kcmFnXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIGFsbCBkcmFnIGV2ZW50IGhhbmRsZXJzIGZyb20gdGhlIGdpdmVuIGVsZW1lbnRcbiAgICBcXCovXG4gICAgZWxwcm90by51bmRyYWcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBpID0gZHJhZ2dhYmxlLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGktLSkgaWYgKGRyYWdnYWJsZVtpXS5lbCA9PSB0aGlzKSB7XG4gICAgICAgICAgICB0aGlzLnVubW91c2Vkb3duKGRyYWdnYWJsZVtpXS5pbml0KTtcbiAgICAgICAgICAgIGRyYWdnYWJsZS5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICBldmUudW5iaW5kKFwic25hcC5kcmFnLiouXCIgKyB0aGlzLmlkKTtcbiAgICAgICAgICAgIGV2ZS51bmJpbmQoXCJzbmFwLmRyYWdpbml0LlwiICsgdGhpcy5pZCk7XG4gICAgICAgIH1cbiAgICAgICAgIWRyYWdnYWJsZS5sZW5ndGggJiYgU25hcC51bm1vdXNlbW92ZShkcmFnTW92ZSkudW5tb3VzZXVwKGRyYWdVcCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG59KTtcblxuLy8gQ29weXJpZ2h0IChjKSAyMDEzIEFkb2JlIFN5c3RlbXMgSW5jb3Jwb3JhdGVkLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vLyBcbi8vIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy8gXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuU25hcC5wbHVnaW4oZnVuY3Rpb24gKFNuYXAsIEVsZW1lbnQsIFBhcGVyLCBnbG9iKSB7XG4gICAgdmFyIGVscHJvdG8gPSBFbGVtZW50LnByb3RvdHlwZSxcbiAgICAgICAgcHByb3RvID0gUGFwZXIucHJvdG90eXBlLFxuICAgICAgICByZ3VybCA9IC9eXFxzKnVybFxcKCguKylcXCkvLFxuICAgICAgICBTdHIgPSBTdHJpbmcsXG4gICAgICAgICQgPSBTbmFwLl8uJDtcbiAgICBTbmFwLmZpbHRlciA9IHt9O1xuICAgIC8qXFxcbiAgICAgKiBQYXBlci5maWx0ZXJcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIENyZWF0ZXMgYSBgPGZpbHRlcj5gIGVsZW1lbnRcbiAgICAgKipcbiAgICAgLSBmaWxzdHIgKHN0cmluZykgU1ZHIGZyYWdtZW50IG9mIGZpbHRlciBwcm92aWRlZCBhcyBhIHN0cmluZ1xuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgICogTm90ZTogSXQgaXMgcmVjb21tZW5kZWQgdG8gdXNlIGZpbHRlcnMgZW1iZWRkZWQgaW50byB0aGUgcGFnZSBpbnNpZGUgYW4gZW1wdHkgU1ZHIGVsZW1lbnQuXG4gICAgID4gVXNhZ2VcbiAgICAgfCB2YXIgZiA9IHBhcGVyLmZpbHRlcignPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj1cIjJcIi8+JyksXG4gICAgIHwgICAgIGMgPSBwYXBlci5jaXJjbGUoMTAsIDEwLCAxMCkuYXR0cih7XG4gICAgIHwgICAgICAgICBmaWx0ZXI6IGZcbiAgICAgfCAgICAgfSk7XG4gICAgXFwqL1xuICAgIHBwcm90by5maWx0ZXIgPSBmdW5jdGlvbiAoZmlsc3RyKSB7XG4gICAgICAgIHZhciBwYXBlciA9IHRoaXM7XG4gICAgICAgIGlmIChwYXBlci50eXBlICE9IFwic3ZnXCIpIHtcbiAgICAgICAgICAgIHBhcGVyID0gcGFwZXIucGFwZXI7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGYgPSBTbmFwLnBhcnNlKFN0cihmaWxzdHIpKSxcbiAgICAgICAgICAgIGlkID0gU25hcC5fLmlkKCksXG4gICAgICAgICAgICB3aWR0aCA9IHBhcGVyLm5vZGUub2Zmc2V0V2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQgPSBwYXBlci5ub2RlLm9mZnNldEhlaWdodCxcbiAgICAgICAgICAgIGZpbHRlciA9ICQoXCJmaWx0ZXJcIik7XG4gICAgICAgICQoZmlsdGVyLCB7XG4gICAgICAgICAgICBpZDogaWQsXG4gICAgICAgICAgICBmaWx0ZXJVbml0czogXCJ1c2VyU3BhY2VPblVzZVwiXG4gICAgICAgIH0pO1xuICAgICAgICBmaWx0ZXIuYXBwZW5kQ2hpbGQoZi5ub2RlKTtcbiAgICAgICAgcGFwZXIuZGVmcy5hcHBlbmRDaGlsZChmaWx0ZXIpO1xuICAgICAgICByZXR1cm4gbmV3IEVsZW1lbnQoZmlsdGVyKTtcbiAgICB9O1xuICAgIFxuICAgIGV2ZS5vbihcInNuYXAudXRpbC5nZXRhdHRyLmZpbHRlclwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGV2ZS5zdG9wKCk7XG4gICAgICAgIHZhciBwID0gJCh0aGlzLm5vZGUsIFwiZmlsdGVyXCIpO1xuICAgICAgICBpZiAocCkge1xuICAgICAgICAgICAgdmFyIG1hdGNoID0gU3RyKHApLm1hdGNoKHJndXJsKTtcbiAgICAgICAgICAgIHJldHVybiBtYXRjaCAmJiBTbmFwLnNlbGVjdChtYXRjaFsxXSk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBldmUub24oXCJzbmFwLnV0aWwuYXR0ci5maWx0ZXJcIiwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEVsZW1lbnQgJiYgdmFsdWUudHlwZSA9PSBcImZpbHRlclwiKSB7XG4gICAgICAgICAgICBldmUuc3RvcCgpO1xuICAgICAgICAgICAgdmFyIGlkID0gdmFsdWUubm9kZS5pZDtcbiAgICAgICAgICAgIGlmICghaWQpIHtcbiAgICAgICAgICAgICAgICAkKHZhbHVlLm5vZGUsIHtpZDogdmFsdWUuaWR9KTtcbiAgICAgICAgICAgICAgICBpZCA9IHZhbHVlLmlkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgJCh0aGlzLm5vZGUsIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXI6IFNuYXAudXJsKGlkKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF2YWx1ZSB8fCB2YWx1ZSA9PSBcIm5vbmVcIikge1xuICAgICAgICAgICAgZXZlLnN0b3AoKTtcbiAgICAgICAgICAgIHRoaXMubm9kZS5yZW1vdmVBdHRyaWJ1dGUoXCJmaWx0ZXJcIik7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICAvKlxcXG4gICAgICogU25hcC5maWx0ZXIuYmx1clxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJucyBhbiBTVkcgbWFya3VwIHN0cmluZyBmb3IgdGhlIGJsdXIgZmlsdGVyXG4gICAgICoqXG4gICAgIC0geCAobnVtYmVyKSBhbW91bnQgb2YgaG9yaXpvbnRhbCBibHVyLCBpbiBwaXhlbHNcbiAgICAgLSB5IChudW1iZXIpICNvcHRpb25hbCBhbW91bnQgb2YgdmVydGljYWwgYmx1ciwgaW4gcGl4ZWxzXG4gICAgID0gKHN0cmluZykgZmlsdGVyIHJlcHJlc2VudGF0aW9uXG4gICAgID4gVXNhZ2VcbiAgICAgfCB2YXIgZiA9IHBhcGVyLmZpbHRlcihTbmFwLmZpbHRlci5ibHVyKDUsIDEwKSksXG4gICAgIHwgICAgIGMgPSBwYXBlci5jaXJjbGUoMTAsIDEwLCAxMCkuYXR0cih7XG4gICAgIHwgICAgICAgICBmaWx0ZXI6IGZcbiAgICAgfCAgICAgfSk7XG4gICAgXFwqL1xuICAgIFNuYXAuZmlsdGVyLmJsdXIgPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICBpZiAoeCA9PSBudWxsKSB7XG4gICAgICAgICAgICB4ID0gMjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZGVmID0geSA9PSBudWxsID8geCA6IFt4LCB5XTtcbiAgICAgICAgcmV0dXJuIFNuYXAuZm9ybWF0KCdcXDxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249XCJ7ZGVmfVwiLz4nLCB7XG4gICAgICAgICAgICBkZWY6IGRlZlxuICAgICAgICB9KTtcbiAgICB9O1xuICAgIFNuYXAuZmlsdGVyLmJsdXIudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzKCk7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogU25hcC5maWx0ZXIuc2hhZG93XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIGFuIFNWRyBtYXJrdXAgc3RyaW5nIGZvciB0aGUgc2hhZG93IGZpbHRlclxuICAgICAqKlxuICAgICAtIGR4IChudW1iZXIpICNvcHRpb25hbCBob3Jpem9udGFsIHNoaWZ0IG9mIHRoZSBzaGFkb3csIGluIHBpeGVsc1xuICAgICAtIGR5IChudW1iZXIpICNvcHRpb25hbCB2ZXJ0aWNhbCBzaGlmdCBvZiB0aGUgc2hhZG93LCBpbiBwaXhlbHNcbiAgICAgLSBibHVyIChudW1iZXIpICNvcHRpb25hbCBhbW91bnQgb2YgYmx1clxuICAgICAtIGNvbG9yIChzdHJpbmcpICNvcHRpb25hbCBjb2xvciBvZiB0aGUgc2hhZG93XG4gICAgIC0gb3BhY2l0eSAobnVtYmVyKSAjb3B0aW9uYWwgYDAuLjFgIG9wYWNpdHkgb2YgdGhlIHNoYWRvd1xuICAgICAqIG9yXG4gICAgIC0gZHggKG51bWJlcikgI29wdGlvbmFsIGhvcml6b250YWwgc2hpZnQgb2YgdGhlIHNoYWRvdywgaW4gcGl4ZWxzXG4gICAgIC0gZHkgKG51bWJlcikgI29wdGlvbmFsIHZlcnRpY2FsIHNoaWZ0IG9mIHRoZSBzaGFkb3csIGluIHBpeGVsc1xuICAgICAtIGNvbG9yIChzdHJpbmcpICNvcHRpb25hbCBjb2xvciBvZiB0aGUgc2hhZG93XG4gICAgIC0gb3BhY2l0eSAobnVtYmVyKSAjb3B0aW9uYWwgYDAuLjFgIG9wYWNpdHkgb2YgdGhlIHNoYWRvd1xuICAgICAqIHdoaWNoIG1ha2VzIGJsdXIgZGVmYXVsdCB0byBgNGAuIE9yXG4gICAgIC0gZHggKG51bWJlcikgI29wdGlvbmFsIGhvcml6b250YWwgc2hpZnQgb2YgdGhlIHNoYWRvdywgaW4gcGl4ZWxzXG4gICAgIC0gZHkgKG51bWJlcikgI29wdGlvbmFsIHZlcnRpY2FsIHNoaWZ0IG9mIHRoZSBzaGFkb3csIGluIHBpeGVsc1xuICAgICAtIG9wYWNpdHkgKG51bWJlcikgI29wdGlvbmFsIGAwLi4xYCBvcGFjaXR5IG9mIHRoZSBzaGFkb3dcbiAgICAgPSAoc3RyaW5nKSBmaWx0ZXIgcmVwcmVzZW50YXRpb25cbiAgICAgPiBVc2FnZVxuICAgICB8IHZhciBmID0gcGFwZXIuZmlsdGVyKFNuYXAuZmlsdGVyLnNoYWRvdygwLCAyLCAzKSksXG4gICAgIHwgICAgIGMgPSBwYXBlci5jaXJjbGUoMTAsIDEwLCAxMCkuYXR0cih7XG4gICAgIHwgICAgICAgICBmaWx0ZXI6IGZcbiAgICAgfCAgICAgfSk7XG4gICAgXFwqL1xuICAgIFNuYXAuZmlsdGVyLnNoYWRvdyA9IGZ1bmN0aW9uIChkeCwgZHksIGJsdXIsIGNvbG9yLCBvcGFjaXR5KSB7XG4gICAgICAgIGlmICh0eXBlb2YgYmx1ciA9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBjb2xvciA9IGJsdXI7XG4gICAgICAgICAgICBvcGFjaXR5ID0gY29sb3I7XG4gICAgICAgICAgICBibHVyID0gNDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGNvbG9yICE9IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIG9wYWNpdHkgPSBjb2xvcjtcbiAgICAgICAgICAgIGNvbG9yID0gXCIjMDAwXCI7XG4gICAgICAgIH1cbiAgICAgICAgY29sb3IgPSBjb2xvciB8fCBcIiMwMDBcIjtcbiAgICAgICAgaWYgKGJsdXIgPT0gbnVsbCkge1xuICAgICAgICAgICAgYmx1ciA9IDQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9wYWNpdHkgPT0gbnVsbCkge1xuICAgICAgICAgICAgb3BhY2l0eSA9IDE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGR4ID09IG51bGwpIHtcbiAgICAgICAgICAgIGR4ID0gMDtcbiAgICAgICAgICAgIGR5ID0gMjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZHkgPT0gbnVsbCkge1xuICAgICAgICAgICAgZHkgPSBkeDtcbiAgICAgICAgfVxuICAgICAgICBjb2xvciA9IFNuYXAuY29sb3IoY29sb3IpO1xuICAgICAgICByZXR1cm4gU25hcC5mb3JtYXQoJzxmZUdhdXNzaWFuQmx1ciBpbj1cIlNvdXJjZUFscGhhXCIgc3RkRGV2aWF0aW9uPVwie2JsdXJ9XCIvPjxmZU9mZnNldCBkeD1cIntkeH1cIiBkeT1cIntkeX1cIiByZXN1bHQ9XCJvZmZzZXRibHVyXCIvPjxmZUZsb29kIGZsb29kLWNvbG9yPVwie2NvbG9yfVwiLz48ZmVDb21wb3NpdGUgaW4yPVwib2Zmc2V0Ymx1clwiIG9wZXJhdG9yPVwiaW5cIi8+PGZlQ29tcG9uZW50VHJhbnNmZXI+PGZlRnVuY0EgdHlwZT1cImxpbmVhclwiIHNsb3BlPVwie29wYWNpdHl9XCIvPjwvZmVDb21wb25lbnRUcmFuc2Zlcj48ZmVNZXJnZT48ZmVNZXJnZU5vZGUvPjxmZU1lcmdlTm9kZSBpbj1cIlNvdXJjZUdyYXBoaWNcIi8+PC9mZU1lcmdlPicsIHtcbiAgICAgICAgICAgIGNvbG9yOiBjb2xvcixcbiAgICAgICAgICAgIGR4OiBkeCxcbiAgICAgICAgICAgIGR5OiBkeSxcbiAgICAgICAgICAgIGJsdXI6IGJsdXIsXG4gICAgICAgICAgICBvcGFjaXR5OiBvcGFjaXR5XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgU25hcC5maWx0ZXIuc2hhZG93LnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcygpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFNuYXAuZmlsdGVyLmdyYXlzY2FsZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJucyBhbiBTVkcgbWFya3VwIHN0cmluZyBmb3IgdGhlIGdyYXlzY2FsZSBmaWx0ZXJcbiAgICAgKipcbiAgICAgLSBhbW91bnQgKG51bWJlcikgYW1vdW50IG9mIGZpbHRlciAoYDAuLjFgKVxuICAgICA9IChzdHJpbmcpIGZpbHRlciByZXByZXNlbnRhdGlvblxuICAgIFxcKi9cbiAgICBTbmFwLmZpbHRlci5ncmF5c2NhbGUgPSBmdW5jdGlvbiAoYW1vdW50KSB7XG4gICAgICAgIGlmIChhbW91bnQgPT0gbnVsbCkge1xuICAgICAgICAgICAgYW1vdW50ID0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gU25hcC5mb3JtYXQoJzxmZUNvbG9yTWF0cml4IHR5cGU9XCJtYXRyaXhcIiB2YWx1ZXM9XCJ7YX0ge2J9IHtjfSAwIDAge2R9IHtlfSB7Zn0gMCAwIHtnfSB7Yn0ge2h9IDAgMCAwIDAgMCAxIDBcIi8+Jywge1xuICAgICAgICAgICAgYTogMC4yMTI2ICsgMC43ODc0ICogKDEgLSBhbW91bnQpLFxuICAgICAgICAgICAgYjogMC43MTUyIC0gMC43MTUyICogKDEgLSBhbW91bnQpLFxuICAgICAgICAgICAgYzogMC4wNzIyIC0gMC4wNzIyICogKDEgLSBhbW91bnQpLFxuICAgICAgICAgICAgZDogMC4yMTI2IC0gMC4yMTI2ICogKDEgLSBhbW91bnQpLFxuICAgICAgICAgICAgZTogMC43MTUyICsgMC4yODQ4ICogKDEgLSBhbW91bnQpLFxuICAgICAgICAgICAgZjogMC4wNzIyIC0gMC4wNzIyICogKDEgLSBhbW91bnQpLFxuICAgICAgICAgICAgZzogMC4yMTI2IC0gMC4yMTI2ICogKDEgLSBhbW91bnQpLFxuICAgICAgICAgICAgaDogMC4wNzIyICsgMC45Mjc4ICogKDEgLSBhbW91bnQpXG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgU25hcC5maWx0ZXIuZ3JheXNjYWxlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcygpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFNuYXAuZmlsdGVyLnNlcGlhXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIGFuIFNWRyBtYXJrdXAgc3RyaW5nIGZvciB0aGUgc2VwaWEgZmlsdGVyXG4gICAgICoqXG4gICAgIC0gYW1vdW50IChudW1iZXIpIGFtb3VudCBvZiBmaWx0ZXIgKGAwLi4xYClcbiAgICAgPSAoc3RyaW5nKSBmaWx0ZXIgcmVwcmVzZW50YXRpb25cbiAgICBcXCovXG4gICAgU25hcC5maWx0ZXIuc2VwaWEgPSBmdW5jdGlvbiAoYW1vdW50KSB7XG4gICAgICAgIGlmIChhbW91bnQgPT0gbnVsbCkge1xuICAgICAgICAgICAgYW1vdW50ID0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gU25hcC5mb3JtYXQoJzxmZUNvbG9yTWF0cml4IHR5cGU9XCJtYXRyaXhcIiB2YWx1ZXM9XCJ7YX0ge2J9IHtjfSAwIDAge2R9IHtlfSB7Zn0gMCAwIHtnfSB7aH0ge2l9IDAgMCAwIDAgMCAxIDBcIi8+Jywge1xuICAgICAgICAgICAgYTogMC4zOTMgKyAwLjYwNyAqICgxIC0gYW1vdW50KSxcbiAgICAgICAgICAgIGI6IDAuNzY5IC0gMC43NjkgKiAoMSAtIGFtb3VudCksXG4gICAgICAgICAgICBjOiAwLjE4OSAtIDAuMTg5ICogKDEgLSBhbW91bnQpLFxuICAgICAgICAgICAgZDogMC4zNDkgLSAwLjM0OSAqICgxIC0gYW1vdW50KSxcbiAgICAgICAgICAgIGU6IDAuNjg2ICsgMC4zMTQgKiAoMSAtIGFtb3VudCksXG4gICAgICAgICAgICBmOiAwLjE2OCAtIDAuMTY4ICogKDEgLSBhbW91bnQpLFxuICAgICAgICAgICAgZzogMC4yNzIgLSAwLjI3MiAqICgxIC0gYW1vdW50KSxcbiAgICAgICAgICAgIGg6IDAuNTM0IC0gMC41MzQgKiAoMSAtIGFtb3VudCksXG4gICAgICAgICAgICBpOiAwLjEzMSArIDAuODY5ICogKDEgLSBhbW91bnQpXG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgU25hcC5maWx0ZXIuc2VwaWEudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzKCk7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogU25hcC5maWx0ZXIuc2F0dXJhdGVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybnMgYW4gU1ZHIG1hcmt1cCBzdHJpbmcgZm9yIHRoZSBzYXR1cmF0ZSBmaWx0ZXJcbiAgICAgKipcbiAgICAgLSBhbW91bnQgKG51bWJlcikgYW1vdW50IG9mIGZpbHRlciAoYDAuLjFgKVxuICAgICA9IChzdHJpbmcpIGZpbHRlciByZXByZXNlbnRhdGlvblxuICAgIFxcKi9cbiAgICBTbmFwLmZpbHRlci5zYXR1cmF0ZSA9IGZ1bmN0aW9uIChhbW91bnQpIHtcbiAgICAgICAgaWYgKGFtb3VudCA9PSBudWxsKSB7XG4gICAgICAgICAgICBhbW91bnQgPSAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBTbmFwLmZvcm1hdCgnPGZlQ29sb3JNYXRyaXggdHlwZT1cInNhdHVyYXRlXCIgdmFsdWVzPVwie2Ftb3VudH1cIi8+Jywge1xuICAgICAgICAgICAgYW1vdW50OiAxIC0gYW1vdW50XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgU25hcC5maWx0ZXIuc2F0dXJhdGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzKCk7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogU25hcC5maWx0ZXIuaHVlUm90YXRlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIGFuIFNWRyBtYXJrdXAgc3RyaW5nIGZvciB0aGUgaHVlLXJvdGF0ZSBmaWx0ZXJcbiAgICAgKipcbiAgICAgLSBhbmdsZSAobnVtYmVyKSBhbmdsZSBvZiByb3RhdGlvblxuICAgICA9IChzdHJpbmcpIGZpbHRlciByZXByZXNlbnRhdGlvblxuICAgIFxcKi9cbiAgICBTbmFwLmZpbHRlci5odWVSb3RhdGUgPSBmdW5jdGlvbiAoYW5nbGUpIHtcbiAgICAgICAgYW5nbGUgPSBhbmdsZSB8fCAwO1xuICAgICAgICByZXR1cm4gU25hcC5mb3JtYXQoJzxmZUNvbG9yTWF0cml4IHR5cGU9XCJodWVSb3RhdGVcIiB2YWx1ZXM9XCJ7YW5nbGV9XCIvPicsIHtcbiAgICAgICAgICAgIGFuZ2xlOiBhbmdsZVxuICAgICAgICB9KTtcbiAgICB9O1xuICAgIFNuYXAuZmlsdGVyLmh1ZVJvdGF0ZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMoKTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBTbmFwLmZpbHRlci5pbnZlcnRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybnMgYW4gU1ZHIG1hcmt1cCBzdHJpbmcgZm9yIHRoZSBpbnZlcnQgZmlsdGVyXG4gICAgICoqXG4gICAgIC0gYW1vdW50IChudW1iZXIpIGFtb3VudCBvZiBmaWx0ZXIgKGAwLi4xYClcbiAgICAgPSAoc3RyaW5nKSBmaWx0ZXIgcmVwcmVzZW50YXRpb25cbiAgICBcXCovXG4gICAgU25hcC5maWx0ZXIuaW52ZXJ0ID0gZnVuY3Rpb24gKGFtb3VudCkge1xuICAgICAgICBpZiAoYW1vdW50ID09IG51bGwpIHtcbiAgICAgICAgICAgIGFtb3VudCA9IDE7XG4gICAgICAgIH1cbi8vICAgICAgICA8ZmVDb2xvck1hdHJpeCB0eXBlPVwibWF0cml4XCIgdmFsdWVzPVwiLTEgMCAwIDAgMSAgMCAtMSAwIDAgMSAgMCAwIC0xIDAgMSAgMCAwIDAgMSAwXCIgY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzPVwic1JHQlwiLz5cbiAgICAgICAgcmV0dXJuIFNuYXAuZm9ybWF0KCc8ZmVDb21wb25lbnRUcmFuc2Zlcj48ZmVGdW5jUiB0eXBlPVwidGFibGVcIiB0YWJsZVZhbHVlcz1cInthbW91bnR9IHthbW91bnQyfVwiLz48ZmVGdW5jRyB0eXBlPVwidGFibGVcIiB0YWJsZVZhbHVlcz1cInthbW91bnR9IHthbW91bnQyfVwiLz48ZmVGdW5jQiB0eXBlPVwidGFibGVcIiB0YWJsZVZhbHVlcz1cInthbW91bnR9IHthbW91bnQyfVwiLz48L2ZlQ29tcG9uZW50VHJhbnNmZXI+Jywge1xuICAgICAgICAgICAgYW1vdW50OiBhbW91bnQsXG4gICAgICAgICAgICBhbW91bnQyOiAxIC0gYW1vdW50XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgU25hcC5maWx0ZXIuaW52ZXJ0LnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcygpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFNuYXAuZmlsdGVyLmJyaWdodG5lc3NcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybnMgYW4gU1ZHIG1hcmt1cCBzdHJpbmcgZm9yIHRoZSBicmlnaHRuZXNzIGZpbHRlclxuICAgICAqKlxuICAgICAtIGFtb3VudCAobnVtYmVyKSBhbW91bnQgb2YgZmlsdGVyIChgMC4uMWApXG4gICAgID0gKHN0cmluZykgZmlsdGVyIHJlcHJlc2VudGF0aW9uXG4gICAgXFwqL1xuICAgIFNuYXAuZmlsdGVyLmJyaWdodG5lc3MgPSBmdW5jdGlvbiAoYW1vdW50KSB7XG4gICAgICAgIGlmIChhbW91bnQgPT0gbnVsbCkge1xuICAgICAgICAgICAgYW1vdW50ID0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gU25hcC5mb3JtYXQoJzxmZUNvbXBvbmVudFRyYW5zZmVyPjxmZUZ1bmNSIHR5cGU9XCJsaW5lYXJcIiBzbG9wZT1cInthbW91bnR9XCIvPjxmZUZ1bmNHIHR5cGU9XCJsaW5lYXJcIiBzbG9wZT1cInthbW91bnR9XCIvPjxmZUZ1bmNCIHR5cGU9XCJsaW5lYXJcIiBzbG9wZT1cInthbW91bnR9XCIvPjwvZmVDb21wb25lbnRUcmFuc2Zlcj4nLCB7XG4gICAgICAgICAgICBhbW91bnQ6IGFtb3VudFxuICAgICAgICB9KTtcbiAgICB9O1xuICAgIFNuYXAuZmlsdGVyLmJyaWdodG5lc3MudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzKCk7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogU25hcC5maWx0ZXIuY29udHJhc3RcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybnMgYW4gU1ZHIG1hcmt1cCBzdHJpbmcgZm9yIHRoZSBjb250cmFzdCBmaWx0ZXJcbiAgICAgKipcbiAgICAgLSBhbW91bnQgKG51bWJlcikgYW1vdW50IG9mIGZpbHRlciAoYDAuLjFgKVxuICAgICA9IChzdHJpbmcpIGZpbHRlciByZXByZXNlbnRhdGlvblxuICAgIFxcKi9cbiAgICBTbmFwLmZpbHRlci5jb250cmFzdCA9IGZ1bmN0aW9uIChhbW91bnQpIHtcbiAgICAgICAgaWYgKGFtb3VudCA9PSBudWxsKSB7XG4gICAgICAgICAgICBhbW91bnQgPSAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBTbmFwLmZvcm1hdCgnPGZlQ29tcG9uZW50VHJhbnNmZXI+PGZlRnVuY1IgdHlwZT1cImxpbmVhclwiIHNsb3BlPVwie2Ftb3VudH1cIiBpbnRlcmNlcHQ9XCJ7YW1vdW50Mn1cIi8+PGZlRnVuY0cgdHlwZT1cImxpbmVhclwiIHNsb3BlPVwie2Ftb3VudH1cIiBpbnRlcmNlcHQ9XCJ7YW1vdW50Mn1cIi8+PGZlRnVuY0IgdHlwZT1cImxpbmVhclwiIHNsb3BlPVwie2Ftb3VudH1cIiBpbnRlcmNlcHQ9XCJ7YW1vdW50Mn1cIi8+PC9mZUNvbXBvbmVudFRyYW5zZmVyPicsIHtcbiAgICAgICAgICAgIGFtb3VudDogYW1vdW50LFxuICAgICAgICAgICAgYW1vdW50MjogLjUgLSBhbW91bnQgLyAyXG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgU25hcC5maWx0ZXIuY29udHJhc3QudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzKCk7XG4gICAgfTtcbn0pO1xuXG4vLyBDb3B5cmlnaHQgKGMpIDIwMTQgQWRvYmUgU3lzdGVtcyBJbmNvcnBvcmF0ZWQuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5TbmFwLnBsdWdpbihmdW5jdGlvbiAoU25hcCwgRWxlbWVudCwgUGFwZXIsIGdsb2IsIEZyYWdtZW50KSB7XG4gICAgdmFyIGJveCA9IFNuYXAuXy5ib3gsXG4gICAgICAgIGlzID0gU25hcC5pcyxcbiAgICAgICAgZmlyc3RMZXR0ZXIgPSAvXlteYS16XSooW3RibWxyY10pL2ksXG4gICAgICAgIHRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIFwiVFwiICsgdGhpcy5keCArIFwiLFwiICsgdGhpcy5keTtcbiAgICAgICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5nZXRBbGlnblxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJucyBzaGlmdCBuZWVkZWQgdG8gYWxpZ24gdGhlIGVsZW1lbnQgcmVsYXRpdmVseSB0byBnaXZlbiBlbGVtZW50LlxuICAgICAqIElmIG5vIGVsZW1lbnRzIHNwZWNpZmllZCwgcGFyZW50IGA8c3ZnPmAgY29udGFpbmVyIHdpbGwgYmUgdXNlZC5cbiAgICAgLSBlbCAob2JqZWN0KSBAb3B0aW9uYWwgYWxpZ25tZW50IGVsZW1lbnRcbiAgICAgLSB3YXkgKHN0cmluZykgb25lIG9mIHNpeCB2YWx1ZXM6IGBcInRvcFwiYCwgYFwibWlkZGxlXCJgLCBgXCJib3R0b21cImAsIGBcImxlZnRcImAsIGBcImNlbnRlclwiYCwgYFwicmlnaHRcImBcbiAgICAgPSAob2JqZWN0fHN0cmluZykgT2JqZWN0IGluIGZvcm1hdCBge2R4OiAsIGR5OiB9YCBhbHNvIGhhcyBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBhcyBhIHRyYW5zZm9ybWF0aW9uIHN0cmluZ1xuICAgICA+IFVzYWdlXG4gICAgIHwgZWwudHJhbnNmb3JtKGVsLmdldEFsaWduKGVsMiwgXCJ0b3BcIikpO1xuICAgICAqIG9yXG4gICAgIHwgdmFyIGR5ID0gZWwuZ2V0QWxpZ24oZWwyLCBcInRvcFwiKS5keTtcbiAgICBcXCovXG4gICAgRWxlbWVudC5wcm90b3R5cGUuZ2V0QWxpZ24gPSBmdW5jdGlvbiAoZWwsIHdheSkge1xuICAgICAgICBpZiAod2F5ID09IG51bGwgJiYgaXMoZWwsIFwic3RyaW5nXCIpKSB7XG4gICAgICAgICAgICB3YXkgPSBlbDtcbiAgICAgICAgICAgIGVsID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBlbCA9IGVsIHx8IHRoaXMucGFwZXI7XG4gICAgICAgIHZhciBieCA9IGVsLmdldEJCb3ggPyBlbC5nZXRCQm94KCkgOiBib3goZWwpLFxuICAgICAgICAgICAgYmIgPSB0aGlzLmdldEJCb3goKSxcbiAgICAgICAgICAgIG91dCA9IHt9O1xuICAgICAgICB3YXkgPSB3YXkgJiYgd2F5Lm1hdGNoKGZpcnN0TGV0dGVyKTtcbiAgICAgICAgd2F5ID0gd2F5ID8gd2F5WzFdLnRvTG93ZXJDYXNlKCkgOiBcImNcIjtcbiAgICAgICAgc3dpdGNoICh3YXkpIHtcbiAgICAgICAgICAgIGNhc2UgXCJ0XCI6XG4gICAgICAgICAgICAgICAgb3V0LmR4ID0gMDtcbiAgICAgICAgICAgICAgICBvdXQuZHkgPSBieC55IC0gYmIueTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcImJcIjpcbiAgICAgICAgICAgICAgICBvdXQuZHggPSAwO1xuICAgICAgICAgICAgICAgIG91dC5keSA9IGJ4LnkyIC0gYmIueTI7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJtXCI6XG4gICAgICAgICAgICAgICAgb3V0LmR4ID0gMDtcbiAgICAgICAgICAgICAgICBvdXQuZHkgPSBieC5jeSAtIGJiLmN5O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwibFwiOlxuICAgICAgICAgICAgICAgIG91dC5keCA9IGJ4LnggLSBiYi54O1xuICAgICAgICAgICAgICAgIG91dC5keSA9IDA7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJyXCI6XG4gICAgICAgICAgICAgICAgb3V0LmR4ID0gYngueDIgLSBiYi54MjtcbiAgICAgICAgICAgICAgICBvdXQuZHkgPSAwO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIG91dC5keCA9IGJ4LmN4IC0gYmIuY3g7XG4gICAgICAgICAgICAgICAgb3V0LmR5ID0gMDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIG91dC50b1N0cmluZyA9IHRvU3RyaW5nO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuYWxpZ25cbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEFsaWducyB0aGUgZWxlbWVudCByZWxhdGl2ZWx5IHRvIGdpdmVuIG9uZSB2aWEgdHJhbnNmb3JtYXRpb24uXG4gICAgICogSWYgbm8gZWxlbWVudHMgc3BlY2lmaWVkLCBwYXJlbnQgYDxzdmc+YCBjb250YWluZXIgd2lsbCBiZSB1c2VkLlxuICAgICAtIGVsIChvYmplY3QpIEBvcHRpb25hbCBhbGlnbm1lbnQgZWxlbWVudFxuICAgICAtIHdheSAoc3RyaW5nKSBvbmUgb2Ygc2l4IHZhbHVlczogYFwidG9wXCJgLCBgXCJtaWRkbGVcImAsIGBcImJvdHRvbVwiYCwgYFwibGVmdFwiYCwgYFwiY2VudGVyXCJgLCBgXCJyaWdodFwiYFxuICAgICA9IChvYmplY3QpIHRoaXMgZWxlbWVudFxuICAgICA+IFVzYWdlXG4gICAgIHwgZWwuYWxpZ24oZWwyLCBcInRvcFwiKTtcbiAgICAgKiBvclxuICAgICB8IGVsLmFsaWduKFwibWlkZGxlXCIpO1xuICAgIFxcKi9cbiAgICBFbGVtZW50LnByb3RvdHlwZS5hbGlnbiA9IGZ1bmN0aW9uIChlbCwgd2F5KSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRyYW5zZm9ybShcIi4uLlwiICsgdGhpcy5nZXRBbGlnbihlbCwgd2F5KSk7XG4gICAgfTtcbn0pO1xuXG5yZXR1cm4gU25hcDtcbn0pKTtcbiJdfQ==
