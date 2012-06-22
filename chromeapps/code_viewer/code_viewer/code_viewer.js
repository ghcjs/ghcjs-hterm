// Copyright (c) 2012 The Chromium OS Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Object encapsulating the parameters that define CodeMirror behavior.
 * @param {string} opt_mode Mode (such as 'clike').
 * @param {string} opt_subMode Submode (such as 'text/csrc').
 * @constructor
 */
function Configuration(opt_mode, opt_subMode) {
  this.mode = opt_mode;
  this.subMode = opt_subMode;
}

/**
 * Factory method that creates a default configuration with no highlighting.
 *
 * @return {Configuration} Configuration instance.
 */
Configuration.createDefault = function() {
  return new Configuration();
};

/**
 * Factory method that creates a configuration for the file extension.
 *
 * @param {string} extension File extension.
 * @return {Configuration} Configuration instance.
 */
Configuration.fromExtension = function(extension) {
  for (var mode in Configuration.MODES) {
    var subModes = Configuration.MODES[mode];
    for (var subMode in subModes) {
      var extensions = subModes[subMode];
      if (!(extensions instanceof Array)) {
        extensions = [extensions];
      }
      if (extensions.indexOf(extension) != -1)
        return new Configuration(mode, subMode);
    }
  }
  return Configuration.createDefault();
};

/**
 * Create a CodeMirror object.
 *
 * @param {string} content
 */
Configuration.prototype.createCodeMirror = function(content) {
  loadMode(this.mode, function() {
    new CodeMirror(
        displayNode,
        {
          mode: this.subMode,
          value: content,
          lineNumbers: true,
          readOnly: true
        });
  }.bind(this));
};

/**
 * Modes with non-trivial features are defined here directly.
 */
Configuration.MODES = {
  clike : {
    'text/x-csrc' : 'c',
    'text/x-c++src': ['cpp', 'cc', 'c++', 'cxx', 'hpp', 'h'],
    'text/x-java' : ['jav', 'java'],
    'text/x-csharp' : 'cs'
  },
  css: {
    'text/css' : 'css'
  },
  htmlembedded: {
    'application/x-aspx' : 'aspx',
    'application/x-ejs' : 'ejs',
    'application/x-jsp' : 'jsp'
  },
  htmlmixed: {
    'text/html' : ['html', 'htm']
  },
  javascript : {
    'text/javascript': 'js',
    'application/json': 'json'
  },
  smalltalk : {
    'text/x-stsrc': 'st'
  },
  xml: {
    'text/xml' : 'xml'
  }
};

/**
 * Add 'simple' modes that just map an extension to text/x-<extension>.
 */
(function() {
  var SIMPLE_MODES = {
    clojure: 'clj',
    coffeescript: 'coffee',
    diff: ['diff', 'patch'],
    go: 'go',
    groovy: 'groovy',
    haskell: 'hs',
    lua: 'lua',
    pascal: 'pas',
    perl: 'pl',
    php: 'php',
    properties: ['ini', 'properties'],
    python: 'py',
    rst: 'rst',
    ruby: 'rb',
    scheme: 's',
    yaml: ['yml', 'yaml']
  };

  for (var key in SIMPLE_MODES) {
    var subModes = Configuration.MODES[key] = {};
    subModes['text/x-' + key] = SIMPLE_MODES[key];
  }
})();


/**
 * @param {string} mode Mode name.
 * @param {boolean) True if the mode is already loaded.
 */
function isModeLoaded(mode) {
  return CodeMirror.modes.hasOwnProperty(mode);
}

/**
 * Template for a mode script file.
 */
var MODE_SCRIPT_PATH = 'codemirror2/mode/%N/%N.js';

/**
 * Load mode script and its dependencies into the document.
 *
 * @param {string} mode Mode name.
 * @param {function) callback Completion callback.
 */
function loadMode(mode, callback) {
  if (!mode) {
    console.log('Default mode');
    callback();
    return;
  }

  if (isModeLoaded(mode)) {
    // Already loaded, probably via a different dependency path.
    callback();
    return;
  }

  var script = document.createElement('script');
  script.onload = function() {
    if (CodeMirror.modes.hasOwnProperty(mode)) {
      console.log('Loaded ' + script.src);
      loadModes(CodeMirror.modes[mode].dependencies, callback);
    } else {
      console.error('Cannot find mode object for ' + mode);
      callback();
    }
  };
  script.onerror = callback;
  script.src = MODE_SCRIPT_PATH.replace(/%N/g, mode);
  document.head.appendChild(script);
}

/**
 * Load mode dependencies.
 *
 * @param {Array.<string>} modes Mode names.
 * @param {function} callback Completion callback.
 */
function loadModes(modes, callback) {
  var missing = [];

  if (modes) {
    for (var i = 0; i != modes.length; i++)
      if (!isModeLoaded(modes[i]))
        missing.push(modes[i]);
  }

  var pending = missing.length;
  if (!pending) {
    callback();
    return;
  }

  while (missing.length) {
    loadMode(missing.shift(), function () {
      if (--pending == 0)
        callback();
    });
  }
}

/**
 * Display the message.
 *
 * @param {string} message
 */
function displayMessage(message) {
  document.body.innerText = message;
}

/**
 * Display the node in the document.
 *
 * @param {Node} node
 */
function displayNode(node) {
  document.body.appendChild(node);
}

/**
 * @param {Uint8Array} charCodeArray Array of char codes.
 * @param {Array.<string>} charArray Array of characters.
 * @param {function(string)} callback Completion callback.
 */
function convertBinaryToText(charCodeArray, charArray, callback) {
  var total = charCodeArray.length;
  var from = charArray.length;
  var CHUNK = 100000; // Convert in chunks to prevent the UI from freezing.
  var to = Math.min(total, from + CHUNK);

  for (var i = from; i < to; i++)
    charArray.push(String.fromCharCode(charCodeArray[i]));

  if (to == total) {
    displayMessage('');
    callback(charArray.join(''));
  } else {
    // We have more than one chunk, the conversion might take a while.
    // Display the progress message.
    displayMessage('Loading: ' + Math.round(100 * from / total) + '%');
    setTimeout(convertBinaryToText, 0, charCodeArray, charArray, callback);
  }
}

/**
 * Load text content from a url.
 *
 * @param {string} url Resource url.
 * @param {boolean} binary True if the file might be binary.
 * @param {function(string|ArrayBuffer)} onSuccess Success callback.
 * @param {function()} onError Error callback.
 */
function loadContent(url, binary, onSuccess, onError) {
  var xhr = new XMLHttpRequest();
  if (binary)
    xhr.responseType = 'arraybuffer';
  xhr.open('GET', url, true);
  xhr.onload = function() {
    if (xhr.status != 200)
      onError();
    else if (binary)
      convertBinaryToText(new Uint8Array(xhr.response), [], onSuccess);
    else
      onSuccess(xhr.responseText);
  };
  xhr.send();
}

/**
 * Load the file content and display it in a CodeMirror control.
 */
function onLoad() {
  var sourceUrl = document.location.search.substr(1);
  if (!sourceUrl) {
    displayMessage('Missing source file URL');
    return;
  }

  var plainText = document.location.hash == '#text';

  var config;
  if (plainText)
    config = Configuration.createDefault();
  else
    config = Configuration.fromExtension(
        sourceUrl.split('.').pop().toLowerCase());

  loadContent(sourceUrl,
      plainText,
      config.createCodeMirror.bind(config),
      displayMessage.bind(null, 'Failed to load ' + sourceUrl)
  );
}

document.addEventListener('DOMContentLoaded', onLoad);
