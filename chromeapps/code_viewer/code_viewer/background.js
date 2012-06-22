// Copyright (c) 2012 The Chromium OS Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @param {string} sourceUrl Source file url.
 * @param {boolean} asText True if the file should be displayed as plain text.
 */
function openViewerTab(sourceUrl, asText) {
  chrome.tabs.create({
    url: chrome.extension.getURL('code_viewer.html') +
        '?' + sourceUrl + (asText ? '#text' : '')
  })
}

/**
 * Maximum number of tabs that we open without asking for confirmation.
 */
var MAX_SILENT_TABS = 3;

chrome.fileBrowserHandler.onExecute.addListener(function(id, details) {
  if (id == 'view-code' || id == 'view-text') {
    var fileEntries = details.entries;

    var fileCount = fileEntries.length;
    if (fileCount > MAX_SILENT_TABS &&
        !confirm('You are about to open ' + fileCount + ' new tabs.'))
      return;

    for (var i = 0; i < fileCount; ++i) {
      openViewerTab(fileEntries[i].toURL(), id == 'view-text');
    }
  }
});