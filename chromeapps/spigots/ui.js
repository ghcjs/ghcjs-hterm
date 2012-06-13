// Copyright (c) 2012 The Chromium OS Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview This file contains implementation for UI elements.
 */

/**
 * Namespace for generic UI manipulation.
 */
var ui = {};

/**
 * Opens the dialog identified by the given ID prefix.
 * @param {String} idPrefix  HTML ID prefix of menu item and dialog
 *                           (ie. 'wifi').
 */
ui.openDialog = function(idPrefix) {
  // Close anything else that is already open - though none should be.
  ui.dismissDialog();
  var dialogDoms = $('#' + idPrefix + '-dialog');
  $('#overlay')[0].style.display = '-webkit-box';
  $('#overlay').keydown(function(event) {
    if (event.which == 27)
      ui.dismissDialog();
    if (event.which == 13) {
      // Try to apply.
      $('#apply-button', '#' + idPrefix + '-dialog').click();
    }
  });
  dialogDoms.show();
  $('#cancel-button', dialogDoms).click(ui.onDialogCancelPress);
  $('#apply-header', dialogDoms).html('');
  $('#apply-errors', dialogDoms).html('');
  $('#apply-warnings', dialogDoms).html('');
  main.dialogs[idPrefix].init();
};

/**
 * Return the currently selected option's i18n tag.
 * @param {String} selector  jquery selector for the option.
 * @returns {String}  i18n tag of current selected or '' if none selected.
 */
ui.getSelectedI18n = function(selector) {
  var dom = $(selector)[0];
  var selectedIndex = dom.selectedIndex;
  if (selectedIndex < 0)
    return '';
  return dom.options[selectedIndex].getAttribute('i18n');
};

/**
 * Sets the current option based on i18n tag value.  If no tag exists or
 * none matches, make no changes.
 * @param {String} selector  jquery selector for the option.
 * @param {String} i18n  Value to set
 */
ui.setSelectedI18n = function(selector, i18n) {
  var dom = $(selector)[0];
  var toSelect = -1;
  for (var i = 0; i < dom.options.length; ++i) {
    if (dom.options[i].getAttribute('i18n') == i18n) {
      toSelect = i;
      break;
    }
  }
  if (toSelect >= 0)
    dom.selectedIndex = toSelect;
};

/**
 * Dismiss/hide the active modal dialog.
 */
ui.dismissDialog = function() {
  $('#overlay').hide();
  for (var dialog in main.dialogs)
    $('#' + dialog + '-dialog').hide();
  ui.updateSummary();
};

/**
 * Handle cancel button press on any dialog.
 */
ui.onDialogCancelPress = function() {
  ui.dismissDialog();
};

/**
 * Handle edit button press in the list of networks and certs.
 * @param {String} dialogId  id for dialog to open
 * @param {Integer} index  offset inside arrays of main.oncCurrent
 */
ui.onEditPress = function(dialogId, index) {
  var dialog = main.dialogs[dialogId];
  ui.openDialog(dialogId);
  var result;
  var oncData;
  if (dialogId == 'cert') {
    oncData = main.oncCurrent.Certificates[index];
    result = onc.validateCertificate(index, main.oncCurrent);
  } else {
    oncData = main.oncCurrent.NetworkConfigurations[index];
    result = onc.validateNetwork(index, main.oncCurrent);
  }
  ui.showMessages(result, '#' + dialogId + '-dialog');
  dialog.setToUi(oncData);
  dialog.setUiVisibility();
};

/**
 * Handle remove button press in the list of networks and certs.
 * @param {Object} oncData  ONC blob for the entity to remove.
 */
ui.onRemovePress = function(oncData) {
  // Currently we always trust the user.  If the user wants to remove
  // a certificate that is referenced by a network, allow it.  Upon
  // updating the summary they should see that the network referencing
  // it now has an error.
  // TODO: Use the "Remove" tag when the entity was loaded (vs created
  // this session).

  removeDialog.setOncData(oncData);
  ui.openDialog('remove');
};

/**
 * Reset the given file picker.  The file picker must be its parent's
 * last child.
 * @param {String} domId  Query string to find picker.
 */
ui.resetFilePicker = function(domId) {
  var pickerClone = $(domId).clone();
  var parent = $(domId).parent()[0];
  parent.removeChild($(domId)[0]);
  parent.appendChild(pickerClone[0]);
};

/**
 * Converts the given message list into localized HTML to display.
 * @param {Array.<Array.<String>>} messageList array of messages to
 *   be converted.
 */
ui.convertMessagesToHtml = function(messageList) {
  if (!messageList.length)
    return '';
  messages = [];
  for (var i = 0; i < messageList.length; i++) {
    var messageFormat = messageList[i];
    var message;
    if (messageFormat.length > 1) {
      message = chrome.i18n.getMessage(messageFormat[0],
                                       messageFormat.slice(1));
    } else {
      message = chrome.i18n.getMessage(messageFormat[0]);
    }
    if (!message) {
      message = 'NO TRANSLATION FOR: ' + messageFormat[0];
    }
    messages.push(message);
  }
  return '<p>' + messages.join('</p><p>') + '<\p>';
};

/**
 * Depending on the results, apply the changes or show warnings.
 * @param {Object} result  Result of compiling the UI to ONC.
 * @param {Object} oncTest  ONC resulting from applying change.
 * @param {Object} dialog  DOM node of dialog.
 */
ui.showMessagesAndApply = function(result, oncTest, dialog) {
  ui.showMessages(result, dialog);
  // Require the user to fix errors.
  if (result.errors.length)
    return;
  main.oncCurrent = oncTest;
  ui.dismissDialog();
};

/**
 * Update a certificate dropdown with the currently loaded certificates.
 * Currently only Certificate Authority certs are listed.
 * @param {Object} optionList  DOM option list to update.
 * @param {Boolean} clearFirst  Clear the option list before adding.
 */
ui.updateCertificateDropdown = function(optionList, clearFirst) {
  if (clearFirst) optionList.options.length = 0;
  optionList.disabled = false;
  for (var i = 0; i < main.oncCurrent.Certificates.length; ++i) {
    var oncCert = main.oncCurrent.Certificates[i];
    if (oncCert.Type != 'Authority')
      continue;
    var certDescription = ui.formatCertificateName(oncCert);
    optionList.options.add(new Option(certDescription, oncCert.GUID));
  }
  if (optionList.options.length == 0) {
    optionList.options.add(new Option(chrome.i18n.getMessage
                                      ('certificateEmpty'), 'empty'));
    optionList.disabled = true;
  }
};

/**
 * Shows the error or warning mark as appropriate for the given entity.
 * @param {Object} result  Validation result.
 * @param {DOM} entityDom  DOM of entity in the list.
 */
ui.setEntityStatus = function(oncEntity, result, entityDom) {
  var info = $('.item-info', entityDom)[0];
  if (onc.isMarkedForRemoval(oncEntity)) {
    info.textContent = '[Marked for removal]';
  } else if (result.errors.length) {
    info.classList.add('error');
    info.textContent = '[Errors]';
  } else if (result.warnings.length) {
    info.textContent = '[Warnings]';
  }
};

/**
 * Returns an event handler for edit press on an entity in the summary list.
 */
ui.getOnEntityEditPress = function(type) {
  return function() {
    var index = $(this).data('index');
    ui.onEditPress(type, index);
  };
};

/**
 * Format a network configuration name for display.
 * @param {Object} oncNetwork  ONC network configuration
 */
ui.formatNetworkName = function(oncNetwork) {
  var bestName = chrome.i18n.getMessage('unknownName');
  if ('Name' in oncNetwork)
    bestName = oncNetwork.Name;
  else if ('GUID' in oncNetwork)
    bestName = oncNetwork.GUID;
  return bestName;
};

/**
 * Format a network configuration description for display.
 * @param {Object} oncNetwork  ONC network configuration
 */
ui.formatNetworkDescription = function(oncCert) {
  return '';
};

/**
 * Format a certificate description for display.
 * @param {Object} oncNetwork  ONC certificate
 */
ui.formatCertificateDescription = function(oncCert) {
  return '';
};

/**
 * Format a certificate name for display.
 * @param {Object} oncNetwork  ONC certificate
 */
ui.formatCertificateName = function(oncCert) {
  var bestName = chrome.i18n.getMessage('unknownName');
  if ('GUID' in oncCert) {
    bestName = oncCert['GUID'];
  }
  if ('X509' in oncCert) {
    var cert = main.interpretCertFromX509Pem(oncCert.X509);
    if ('commonName' in cert.subject) {
      bestName = cert.subject.commonName;
    }
  }
  return bestName;
};

/**
 * Show the summary of the current ONC settings for a given kind of entity.
 * @param {Array.<Object>} list  List of entities (networks or certificates)
 * @param {String} type Entity type.
 * @param {String} id  query id of the list's top level DOM.
 * @param {Function} validator  Called to validate this entity.
 * @param {Function} nameFormatter  Called to format name entity.
 * @param {Function} editCallback  Called to handle edit press of this entity.
 */
ui.showSummaryList = function(list, type, id, validator, nameFormatter,
                              descFormatter, editCallback) {
  for (var i = 0; i < list.length; ++i) {
    var oncEntity = list[i];
    if (type != null && type != oncEntity.Type)
      continue;
    var result = validator(i, main.oncCurrent);
    var newDom = $('.template', id).clone();
    newDom[0].classList.remove('template');

    newDom.insertBefore($('.add-row', id));
    $('.item-description', newDom)[0].textContent = descFormatter(oncEntity);
    $('.item-title', newDom)[0].textContent = nameFormatter(oncEntity);
    newDom.data('onc', oncEntity);
    newDom.data('index', i);

    ui.setEntityStatus(oncEntity, result, newDom);

    // For opaque entities which we do not know how to edit or
    // entities marked for removal already, simply remove the edit
    // button.  User can still preserve such entities and remove them,
    // but not modify them.
    if (!result.hasOpaqueEntity && !onc.isMarkedForRemoval(oncEntity)) {
      newDom.click(function(event) {
        if (!event.srcElement.classList.contains('delete-x'))
          editCallback.call(this, event);
      });
    }

    var removeButton = $('.delete-x', newDom);
    removeButton.click(function() {
      ui.onRemovePress($(this).parent().data('onc'));
    });
  }
};

/**
 * Update the summary (right) pane.
 */
ui.updateSummary = function() {
  // Remove all rows other than the template.
  var rows = $('.pod :not(.template).item-row');
  for (var i = 0; i < rows.length; ++i) {
    rows[i].parentNode.removeChild(rows[i]);
  }

  ui.showSummaryList(main.oncCurrent.NetworkConfigurations,
                     'WiFi',
                     '#wifi-pod',
                     onc.validateNetwork,
                     ui.formatNetworkName,
                     ui.formatNetworkDescription,
                     ui.getOnEntityEditPress('wifi'));

  ui.showSummaryList(main.oncCurrent.NetworkConfigurations,
                     'VPN',
                     '#vpn-pod',
                     onc.validateNetwork,
                     ui.formatNetworkName,
                     ui.formatNetworkDescription,
                     ui.getOnEntityEditPress('vpn'));

  ui.showSummaryList(main.oncCurrent.Certificates,
                     null,
                     '#cert-pod',
                     onc.validateCertificate,
                     ui.formatCertificateName,
                     ui.formatCertificateDescription,
                     ui.getOnEntityEditPress('cert'));
};

/**
 * Show the results in the dialog.
 * @param {Object} result  Result of compiling the UI to ONC.
 * @param {Object} dialog  DOM node of dialog.
 */
ui.showMessages = function(result, dialog) {
  $('#apply-errors', dialog).html(ui.convertMessagesToHtml
                                  (result.errors));
  $('#apply-warnings', dialog).html(ui.convertMessagesToHtml
                                    (result.warnings));
};

/**
 * Handles loading the body of the extension.  Called from onload
 * event handler.
 */
ui.translateText = function() {
  var i18nNodes = document.querySelectorAll('[i18n]');
  for (var i = 0; i < i18nNodes.length; ++i) {
    var i18nId = i18nNodes[i].getAttribute('i18n');
    var translation = chrome.i18n.getMessage(i18nId);
    if (translation == '') {
      translation = 'NO TRANSLATION FOR: ' + i18nId;
    }
    i18nNodes[i].textContent = translation;
  }
};

