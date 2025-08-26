// Unified News Aggregator (Serverless)
// Providers: RSS, Reddit (keyless)
// ESM module (root has type: module)

import fetch from 'node-fetch';
import RSSParser from 'rss-parser';

const rssParser = new RSSParser();

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const {
      providers = ['rss', 'reddit'],
      maxResults = 120,
      category = 'all',
      startTime,
      endTime
    } = req.body || {};

    const tasks = [];
    if (providers.includes('rss')) tasks.push(fetchRssNews({ startTime, endTime, maxResults, category }));
    if (providers.includes('reddit')) tasks.push(fetchRedditNews({ startTime, endTime, maxResults, category }));

    const results = await Promise.allSettled(tasks);
    const items = results.flatMap(r => (r.status === 'fulfilled' ? r.value : []));

    const merged = items
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, maxResults);

    res.json({ success: true, data: merged, meta: { count: merged.length } });
  } catch (error) {
    console.error('Serverless /api/news error:', error);
    res.status(500).json({ success: false, error: 'Failed to load aggregated news', message: error.message });
  }
}

function withinRange(ts, startTime, endTime) {
  if (startTime && ts < new Date(startTime)) return false;
  if (endTime && ts > new Date(endTime)) return false;
  return true;
}

function inferCategory(text) {
  if (!text) return 'all';
  if (/trade|traded|deal|acquired/i.test(text)) return 'trades';
  if (/(signing|signed|agrees|agreed|has signed|re-signed|extension|two-way|10-day)/i.test(text)) return 'signings';
  if (/injury|injured|out|questionable|doubtful|probable|returning/i.test(text)) return 'injuries';
  if (/(Q1|Q2|Q3|Q4|halftime|tipoff|tip-off|timeout|time out|Final\b|vs\b)/i.test(text)) return 'live';
  if (/rumor|rumors|sources|reportedly/i.test(text)) return 'rumors';
  if (/game|tonight|final|score|preview|recap/i.test(text)) return 'games';
  return 'all';
}

async function fetchRssNews({ startTime, endTime, maxResults = 50, category = 'all' } = {}) {
  // Regular team/news feeds
  const regularFeeds = [
    'https://www.nba.com/sixers/rss',
    'https://www.nbcsportsphiladelphia.com/tag/philadelphia-76ers/feed/',
    'https://www.libertyballers.com/rss/index.xml'
  ];

  // Free Twitter via Nitter RSS (no tokens, may be unreliable if instance rate-limits)
  const nitterBases = ['https://nitter.net', 'https://nitter.poast.org', 'https://nitter.privacydev.net'];
  const nitterHandles = [
    'sixers', 'NBA',
    'wojespn', 'ShamsCharania', 'ZachLowe_NBA', 'ramonashelburne',
    'PompeyOnSixers', 'DerekBodnerNBA', 'KyleNeubeck', 'rich_hofmann', 'JClarkNBCS',
    'WindhorstESPN', 'ChrisBHaynes', 'TheSteinLine'
  ];
  const nitterFeeds = nitterBases.flatMap(b => nitterHandles.map(h => `${b}/${h}/rss`));

  const items = [];

  // Load regular feeds as provider 'rss'
  for (const url of regularFeeds) {
    try {
      const feed = await rssParser.parseURL(url);
      for (const it of feed.items || []) {
        const ts = new Date(it.isoDate || it.pubDate || it.published || Date.now());
        if (!withinRange(ts, startTime, endTime)) continue;
        const text = (it.title || '') + (it.contentSnippet ? ` — ${it.contentSnippet}` : '');
        const cat = inferCategory(text);
        if (category !== 'all' && cat !== category) continue;
        items.push({
          id: it.guid || it.link || `${url}-${ts.getTime()}`,
          text,
          source: feed.title || 'RSS',
          handle: feed.link ? new URL(feed.link).hostname : 'rss',
          verified: false,
          profileImage: null,
          timestamp: ts,
          category: cat,
          isFeatured: false,
          likes: 0,
          retweets: 0,
          replies: 0,
          media: [],
          provider: 'rss',
          url: it.link
        });
      }
    } catch (e) {
      console.warn('RSS fetch failed:', url, e.message);
    }
  }

  // Load Nitter feeds as provider 'twitter'
  for (const url of nitterFeeds) {
    try {
      const feed = await rssParser.parseURL(url);
      const handle = (feed?.link || url).split('/').filter(Boolean).pop()?.replace('/rss','') || 'twitter';
      for (const it of feed.items || []) {
        const ts = new Date(it.isoDate || it.pubDate || it.published || Date.now());
        if (!withinRange(ts, startTime, endTime)) continue;
        const text = (it.title || '') + (it.contentSnippet ? ` — ${it.contentSnippet}` : '');
        const cat = inferCategory(text);
        if (category !== 'all' && cat !== category) continue;
        items.push({
          id: it.guid || it.link || `${url}-${ts.getTime()}`,
          text,
          source: `@${handle}`,
          handle: `@${handle}`,
          verified: false,
          profileImage: null,
          timestamp: ts,
          category: cat,
          isFeatured: false,
          likes: 0,
          retweets: 0,
          replies: 0,
          media: [],
          provider: 'twitter', // so UI provider filter shows these under Twitter
          url: it.link
        });
      }
    } catch (e) {
      console.warn('Nitter RSS fetch failed:', url, e.message);
    }
  }

  return items
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, maxResults);
}

async function fetchRedditNews({ startTime, endTime, maxResults = 50, category = 'all' } = {}) {
  const subs = ['sixers', 'nba'];
  const base = 'https://www.reddit.com/r';
  const items = [];
  for (const sub of subs) {
    try {
      const res = await fetch(`${base}/${sub}/search.json?q=Sixers&restrict_sr=on&sort=new`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const posts = data?.data?.children || [];
      for (const p of posts) {
        const post = p.data;
        const ts = new Date(post.created_utc * 1000);
        if (!withinRange(ts, startTime, endTime)) continue;
        const text = post.title || '';
        const cat = inferCategory(text);
        if (category !== 'all' && cat !== category) continue;
        const media = [];
        if (post.thumbnail && post.thumbnail.startsWith('http')) {
          media.push({ type: 'image', url: post.thumbnail });
        }
        items.push({
          id: `reddit-${post.id}`,
          text,
          source: `r/${sub}`,
          handle: `u/${post.author}`,
          verified: false,
          profileImage: null,
          timestamp: ts,
          category: cat,
          isFeatured: false,
          likes: post.ups || 0,
          retweets: 0,
          replies: post.num_comments || 0,
          media,
          provider: 'reddit',
          url: `https://www.reddit.com${post.permalink}`
        });
      }
    } catch (e) {
      console.warn('Reddit fetch failed:', sub, e.message);
    }
  }
  return items
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, maxResults);
}
