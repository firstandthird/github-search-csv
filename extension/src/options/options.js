const browser = window.browser || window.chrome;

const TOKEN_NAME = 'gscsv_personal_token';

/**
 * Saves options to browser.storage
 */
function saveOptions(event) {
  event.preventDefault();

  const token = document.getElementById('token').value;

  browser.storage.sync.set({
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
  browser.storage.sync.get({
    [TOKEN_NAME]: ''
  }, item => {
    document.getElementById('token').value = item[TOKEN_NAME];
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('options-form').addEventListener('submit', saveOptions);
