/* global chrome */

const TOKEN_NAME = 'gh_personal_token';

/**
 * Saves options to chrome.storage
 */
function saveOptions() {
  const token = document.getElementById('token').value;

  chrome.storage.sync.set({
    [TOKEN_NAME]: token
  }, () => {
    const status = document.getElementById('status');

    status.textContent = 'Options saved.';

    setTimeout(() => {
      status.textContent = '';
    }, 750);
  });
}

/**
 * Restores previously saved token
 */
function restoreOptions() {
  chrome.storage.sync.get({
    [TOKEN_NAME]: ''
  }, item => {
    document.getElementById('token').value = item[TOKEN_NAME];
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
