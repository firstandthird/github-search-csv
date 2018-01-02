/* eslint-disable no-alert */
/* global chrome */

const tokenName = 'gh_personal_token';

const textMatchHeaders = new Headers();
textMatchHeaders.append('Accept', 'application/vnd.github.v3.text-match+json');

const downloadButton = document.createElement('button');

const downloadText = chrome.i18n.getMessage('downloadBtn') || 'Download';

/**
 * Adds a Download button to GitHub's search results page
 * to export results to CSV
 */
function addDownloadButton() {
  const buttonsDiv = document.querySelector('.codesearch-results .select-menu');

  if (!buttonsDiv) return;

  downloadButton.classList.add('btn', 'btn-sm');
  downloadButton.addEventListener('click', onDownload);
  downloadButton.innerHTML = `<div class="d-flex flex-space-between flex-items-center"><span>${downloadText}</span><svg version="1.1" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" width="14" height="14" style="margin-left:5px;"><g fill="none" fill-rule="evenodd"><g fill="#000"><path d="m4 6h3v-6h2v6h3l-4 4-4-4zm11-4h-4v1h4v8h-14v-8h4v-1h-4c-0.55 0-1 0.45-1 1v9c0 0.55 0.45 1 1 1h5.34c-0.25 0.61-0.86 1.39-2.34 2h8c-1.48-0.61-2.09-1.39-2.34-2h5.34c0.55 0 1-0.45 1-1v-9c0-0.55-0.45-1-1-1z"/></g></g></svg></div>`;
  buttonsDiv.appendChild(downloadButton);
}

/**
 * Download button event handler
 *
 * @param {Event} e Event
 */
function onDownload(e) {
  chrome.storage.sync.get({
    [tokenName]: ''
  }, item => {
    downloadButton.querySelector('span').textContent = chrome.i18n.getMessage('downloadingStatus') || 'Downloading...';
    downloadButton.disabled = true;
    search(item[tokenName]);
  });
}

/**
 * Searches through code via GitHub API
 *
 * @param {string} [token='']
 * @param {number} [page=1]
 * @param {number} [resultsCount=0]
 * @param {Array} [items=[]]
 * @returns
 */
async function search(token = '', page = 1, resultsCount = 0, items = []) {
  const apiUrl = new URL('https://api.github.com/search/code');
  const queryParams = new URLSearchParams(window.location.search).get('q') || '';

  apiUrl.searchParams.set('q', queryParams);
  apiUrl.searchParams.set('page', page);
  apiUrl.searchParams.set('access_token', token);

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: textMatchHeaders,
      cache: 'default'
    });

    if (response.status === 403) {
      alert('Rate limit reached. Downloading only available items');
      return generateCsvFile(items);
    }

    const data = await response.json();

    resultsCount += data.items.length;
    items = items.concat(data.items);

    // Iterate through pages
    if (resultsCount < data.total_count) {
      search(token, page + 1, resultsCount, items);
    } else { // No more pages, export file
      generateCsvFile(items);
    }
  } catch (e) {
    return e.message;
  }
}

/**
 * Creates a blob downloadable file from a string
 *
 * @param {String} [content=''] File content
 * @param {string} [filename='download']
 */
function downloadCsvFile(content = '', filename = 'download') {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const link = window.document.createElement('a');
  const fileName = `${filename}_${new Date().getTime()}.csv`;

  link.href = window.URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);

  downloadButton.disabled = false;
  downloadButton.querySelector('span').textContent = downloadText;

  link.click();
  document.body.removeChild(link);
}

/**
 * Creates a CSV from a Response object
 *
 * @param {any} data
 */
function generateCsvFile(data) {
  if (data) {
    let csvContent = 'Organization,Repository,Repository URL,Result file URL,Results\n';

    data.forEach(item => {
      const matched = item.text_matches.map(match => match.fragment.replace(/(?:\r\n|\r|\n|,|\s{2,})/g, ' ').toString());
      csvContent += `${item.repository.owner.login},${item.repository.name},${encodeURI(item.repository.html_url)},${encodeURI(item.html_url)},${matched}\n`;
    });

    downloadCsvFile(csvContent, 'search_results');
  }
  else {
    alert('No results found');
  }
}

/**
 * Initialize library
 */
function init() {
  const observeTarget = document.querySelector('body')
  const observer = new MutationObserver(addDownloadButton);

  observer.observe(observeTarget, { childList: true });

  addDownloadButton();
}

/**
 * Called on app init
 */
window.onload = init;
