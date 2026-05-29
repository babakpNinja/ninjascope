const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const tools = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'tools.json'), 'utf8'));

app.get('/healthz', (_, res) => res.json({ ok: true, ts: new Date().toISOString(), tools: tools.length }));

app.get('/api/tools', (req, res) => {
  const { category, pricing, q, sort, filter } = req.query;
  let out = tools.slice();
  if (filter === 'trending') out = out.filter(t => t.trending);
  if (filter === 'free') out = out.filter(t => t.pricing === 'Free' || t.priceFromUSD === 0);
  if (filter === 'new') out = out.filter(t => (t.launchedAt || '') >= '2026-04-01');
  if (category && category !== 'all') out = out.filter(t => t.category === category);
  if (pricing && pricing !== 'all') out = out.filter(t => t.pricing === pricing);
  if (q) {
    const ql = q.toLowerCase();
    out = out.filter(t => (t.name + ' ' + t.tagline + ' ' + (t.tags || []).join(' ')).toLowerCase().includes(ql));
  }
  const sorters = {
    rating: (a, b) => b.rating - a.rating,
    users: (a, b) => b.usersN - a.usersN,
    newest: (a, b) => (b.launchedAt || '').localeCompare(a.launchedAt || ''),
    name: (a, b) => a.name.localeCompare(b.name),
    price_asc: (a, b) => (a.priceFromUSD || 0) - (b.priceFromUSD || 0),
    price_desc: (a, b) => (b.priceFromUSD || 0) - (a.priceFromUSD || 0),
  };
  out.sort(sorters[sort] || sorters.rating);
  res.json({ count: out.length, tools: out });
});

app.get('/api/tools/:slug', (req, res) => {
  const t = tools.find(x => x.slug === req.params.slug);
  if (!t) return res.status(404).json({ error: 'not found' });
  const similar = tools.filter(x => x.slug !== t.slug && x.category === t.category).slice(0, 4);
  res.json({ tool: t, similar });
});

app.post('/api/compare', (req, res) => {
  const { slugs } = req.body;
  if (!Array.isArray(slugs) || slugs.length < 2 || slugs.length > 4) return res.status(400).json({ error: 'pick 2-4 tools' });
  const picks = slugs.map(s => tools.find(t => t.slug === s)).filter(Boolean);
  res.json({ tools: picks });
});

app.get('/api/stack', (_, res) => {
  const stack = [
    { slug: 'claude', monthlyCostUSD: 20, useCase: 'Research + writing' },
    { slug: 'cursor', monthlyCostUSD: 20, useCase: 'Code editor' },
    { slug: 'midjourney', monthlyCostUSD: 30, useCase: 'Marketing assets' },
    { slug: 'perplexity', monthlyCostUSD: 20, useCase: 'Quick research' },
    { slug: 'notion-ai', monthlyCostUSD: 10, useCase: 'Notes' },
    { slug: 'descript', monthlyCostUSD: 24, useCase: 'Podcast editing' },
    { slug: 'gamma', monthlyCostUSD: 15, useCase: 'Decks' },
    { slug: 'granola', monthlyCostUSD: 14, useCase: 'Meeting notes' },
    { slug: 'wispr-flow', monthlyCostUSD: 12, useCase: 'Voice-to-text' }
  ];
  const enriched = stack.map(s => ({ ...s, tool: tools.find(t => t.slug === s.slug) })).filter(x => x.tool);
  const totalMonthly = enriched.reduce((a, b) => a + b.monthlyCostUSD, 0);
  const optimizations = [
    { type: 'consolidate', text: "You're paying for Claude AND Perplexity. Claude Sonnet now covers most Perplexity use-cases with citations — drop Perplexity to save $20/mo.", savingsUSD: 20 },
    { type: 'tier_swap', text: 'Midjourney Standard ($30) → Basic ($10) is plenty for your monthly volume. Step down to save $20/mo.', savingsUSD: 20 },
    { type: 'free_alt', text: 'Granola overlaps with Notion AI for meeting notes. Try Granola Free tier for casual use, save $14/mo.', savingsUSD: 14 }
  ];
  const totalSavings = optimizations.reduce((a, b) => a + b.savingsUSD, 0);
  res.json({ stack: enriched, totalMonthly, optimizations, totalSavings });
});

app.get('/api/trending', (_, res) => {
  res.json({ trending: tools.filter(t => t.trending).slice(0, 8) });
});

app.get('/api/launches', (_, res) => {
  res.json({
    launches: tools
      .filter(t => t.launchedAt && t.launchedAt >= '2026-05-01')
      .sort((a, b) => (b.launchedAt || '').localeCompare(a.launchedAt || ''))
      .slice(0, 12)
      .map(t => ({
        ...t,
        verdict: t.rating >= 4.7 ? 'try-now' : (t.rating >= 4.5 ? 'wait-v2' : 'skip')
      }))
  });
});

app.post('/api/concierge', (req, res) => {
  const { query } = req.body;
  if (!query || query.length < 3) return res.status(400).json({ error: 'query too short' });
  const ql = query.toLowerCase();
  const scored = tools.map(t => {
    const hay = (t.name + ' ' + t.tagline + ' ' + (t.tags || []).join(' ') + ' ' + (t.useCase || '')).toLowerCase();
    const score = ql.split(/\s+/).filter(Boolean).reduce((s, w) => s + (hay.includes(w) ? 2 : 0), 0) + t.rating * 0.4;
    return { tool: t, score };
  }).sort((a, b) => b.score - a.score).slice(0, 4);
  res.json({
    answer: `For "${query}" the strongest pick is ${scored[0].tool.name} (${scored[0].tool.pricing}, ${scored[0].tool.rating}★). Other contenders below — I'd compare side-by-side before committing.`,
    suggestions: scored.map(s => s.tool)
  });
});

app.get('/api/stats', (_, res) => {
  res.json({
    toolsTotal: tools.length,
    categoriesTotal: new Set(tools.map(t => t.category)).size,
    avgRating: (tools.reduce((a, b) => a + b.rating, 0) / tools.length).toFixed(2),
    usersTracked: '2.4M+',
    lastUpdate: '2026-05-29'
  });
});

app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, '0.0.0.0', () => console.log(`👻 NinjaScope listening on 0.0.0.0:${PORT}`));
