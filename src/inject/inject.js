/* eslint-disable no-alert */
/* global chrome */

const tokenName = 'gh_personal_token';

const headers = new Headers();
headers.append('Accept', 'application/vnd.github.v3.text-match+json');

/**
 * Adds a Download button to GitHub's search results page
 * to export results to CSV
 */
function addDownloadButton() {
  const buttonsDiv = document.querySelector('.codesearch-results .select-menu');

  const downloadButton = document.createElement('button');
  downloadButton.classList.add('btn', 'btn-sm');
  downloadButton.addEventListener('click', onDownload);

  const downloadText = chrome.i18n.getMessage('downloadBtn') || 'Download';

  downloadButton.innerHTML = `<div class="d-flex flex-space-between flex-items-center">${downloadText}
    <svg version="1.1" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" width="14" height="14" style="margin-left:5px;"><g fill="none" fill-rule="evenodd"><g fill="#000"><path d="m4 6h3v-6h2v6h3l-4 4-4-4zm11-4h-4v1h4v8h-14v-8h4v-1h-4c-0.55 0-1 0.45-1 1v9c0 0.55 0.45 1 1 1h5.34c-0.25 0.61-0.86 1.39-2.34 2h8c-1.48-0.61-2.09-1.39-2.34-2h5.34c0.55 0 1-0.45 1-1v-9c0-0.55-0.45-1-1-1z"/></g></g></svg>
  </div>`;

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
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = encodeURI(urlParams.get('q'));

    search(searchQuery, item[tokenName]);
  });
}

/**
 * Searches though code via GitHub API
 *
 * @param {string} [params='']
 * @param {string} [token='']
 * @param {number} [page=1]
 * @param {number} [resultsCount=0]
 * @param {Array} [items=[]]
 * @returns
 */
async function search(params = '', token = '', page = 1, resultsCount = 0, items = []) {
  try {
    const response = await fetch(`https://api.github.com/search/code?q=${params}&access_token=${token}&page=${page}`, {
      method: 'GET',
      headers,
      cache: 'default'
    });
    const data = await response.json();

    resultsCount += data.items.length;
    items = items.concat(data.items);

    // Iterate through pages
    if (resultsCount < data.total_count) {
      search(params, token, page + 1, resultsCount, items);
    } else { // No more pages, export file
      generateCsvFile(items);
    }
  } catch (e) {
    return e.message;
  }
}

/**
 * Creates a CSV from a Response object
 *
 * @param {Response} { total_count: totalCount, items }
 */
function generateCsvFile(data) {
  if (data) {
    let csvContent = 'Owner,Repo,Result (encoded)\n';

    data.forEach(item => {
      const matched = item.text_matches.map(match => match.fragment);
      csvContent += `${item.repository.owner.login},${item.repository.html_url},${escape(matched)}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=base64' });
    const downloadLink = window.document.createElement('a');
    const fileName = `search_results_${new Date().getTime()}.csv`;

    downloadLink.href = window.URL.createObjectURL(blob);
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  } else {
    alert('No results found');
  }
}

/**
 * Called on app init
 */
function init() {
  addDownloadButton();
}

init();
