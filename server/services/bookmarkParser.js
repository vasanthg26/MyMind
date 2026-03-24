const cheerio = require('cheerio');

// Parse browser-exported bookmarks.html (Netscape Bookmark Format)
// Returns: [{ cluster: string, items: [{ title, url }] }]
function parseBookmarks(html) {
  const $ = cheerio.load(html, { xmlMode: false });
  const clusters = [];

  function processFolder($el, folderName) {
    const items = [];

    $el.children().each((_, child) => {
      const $child = $(child);
      const tag = child.tagName?.toLowerCase();

      if (tag === 'dt') {
        const $h3 = $child.children('h3');
        const $a = $child.children('a');
        const $dl = $child.children('dl');

        if ($h3.length) {
          // Sub-folder
          const subName = $h3.text().trim();
          if ($dl.length) {
            processFolder($dl, subName || folderName);
          }
        } else if ($a.length) {
          const url = $a.attr('href') || '';
          const title = $a.text().trim();
          if (url.startsWith('http')) {
            items.push({ title, url });
          }
        }
      }
    });

    if (items.length > 0) {
      const existing = clusters.find(c => c.cluster === folderName);
      if (existing) {
        existing.items.push(...items);
      } else {
        clusters.push({ cluster: folderName || 'General', items });
      }
    }
  }

  // Find all top-level folders
  $('dl').first().children('dt').each((_, dt) => {
    const $dt = $(dt);
    const $h3 = $dt.children('h3');
    const $dl = $dt.children('dl');
    const $a = $dt.children('a');

    if ($h3.length && $dl.length) {
      processFolder($dl, $h3.text().trim());
    } else if ($a.length) {
      const url = $a.attr('href') || '';
      const title = $a.text().trim();
      if (url.startsWith('http')) {
        let general = clusters.find(c => c.cluster === 'General');
        if (!general) { general = { cluster: 'General', items: [] }; clusters.push(general); }
        general.items.push({ title, url });
      }
    }
  });

  return clusters;
}

module.exports = { parseBookmarks };
