const axios = require('axios');
const cheerio = require('cheerio');
const TurndownService = require('turndown');

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
});

const TIMEOUT_MS = 10000;
const MIN_CONTENT_LENGTH = 200;

async function fetchWithAxios(url) {
  const res = await axios.get(url, {
    timeout: TIMEOUT_MS,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; MyMind/1.0; +https://mymind.local)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    },
    maxRedirects: 5
  });

  const html = res.data;
  const $ = cheerio.load(html);

  // Remove noise
  $('nav, footer, header, aside, script, style, .ad, .ads, .advertisement, .cookie-banner, [aria-hidden="true"]').remove();

  // Extract title
  const title = $('title').text().trim()
    || $('h1').first().text().trim()
    || new URL(url).hostname;

  // Try content selectors in order of preference
  const contentSelectors = ['article', 'main', '[role="main"]', '.content', '.post-content', '.entry-content', '#content', 'body'];
  let contentEl = null;
  for (const sel of contentSelectors) {
    if ($(sel).length) { contentEl = $(sel); break; }
  }
  if (!contentEl) contentEl = $('body');

  const markdown = turndown.turndown(contentEl.html() || '');
  return { title, content: markdown };
}

async function fetchWithPuppeteer(url) {
  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch {
    throw new Error('puppeteer not available');
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (compatible; MyMind/1.0)');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);

    const result = await page.evaluate(() => {
      const title = document.title || document.querySelector('h1')?.textContent?.trim() || '';
      const content = document.querySelector('article, main, .content, body')?.innerHTML || '';
      return { title, content };
    });

    const markdown = turndown.turndown(result.content);
    return { title: result.title, content: markdown };
  } finally {
    await browser.close();
  }
}

async function fetchUrl(url) {
  const fetchedAt = new Date().toISOString();

  try {
    new URL(url); // validate URL
  } catch {
    return { error: 'invalid_url', url };
  }

  // Try axios first
  try {
    const { title, content } = await fetchWithAxios(url);

    if (content.length >= MIN_CONTENT_LENGTH) {
      return {
        title,
        content,
        wordCount: content.split(/\s+/).length,
        fetchedAt,
        method: 'axios'
      };
    }

    // Content too short — try puppeteer
    const fallback = await fetchWithPuppeteer(url);
    return {
      title: fallback.title || title,
      content: fallback.content || content,
      wordCount: (fallback.content || content).split(/\s+/).length,
      fetchedAt,
      method: 'puppeteer'
    };

  } catch (err) {
    if (err.response?.status === 403 || err.response?.status === 401) {
      return { error: 'login_required', url };
    }
    if (err.response?.status === 404) {
      return { error: 'not_found', url };
    }
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      return { error: 'timeout', url };
    }
    if (err.response?.status === 402 || err.response?.status === 451) {
      return { error: 'paywalled', url };
    }

    // Try puppeteer as last resort
    try {
      const fallback = await fetchWithPuppeteer(url);
      return {
        title: fallback.title,
        content: fallback.content,
        wordCount: fallback.content.split(/\s+/).length,
        fetchedAt,
        method: 'puppeteer'
      };
    } catch {
      return { error: 'fetch_failed', url, detail: err.message };
    }
  }
}

module.exports = { fetchUrl };
