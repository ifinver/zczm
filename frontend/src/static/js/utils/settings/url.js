let PAGES = null;

export function init(pages_url) {
  PAGES = {};

  for (let k in pages_url) {
    PAGES[k] = pages_url[k];
  }
}

export function pages() {
  return PAGES;
}

export function get(page) {
  return PAGES[page];
}

export function videos() {
  return PAGES.videos;
}
