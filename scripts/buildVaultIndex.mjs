#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VAULT_ROOT = path.join(ROOT, 'vault');
const PUBLIC_CONTENT_ROOT = path.join(ROOT, 'public', 'content');
const PUBLIC_DATA_DIR = path.join(PUBLIC_CONTENT_ROOT, 'data');
const PUBLIC_MD_DIR = path.join(PUBLIC_CONTENT_ROOT, 'md');

const GENERATED_HEADER = '# GENERATED FROM VAULT — DO NOT EDIT. Source of truth: /vault\n\n';
const BUCKET_KEYS = ['quick-taste', 'deeper-dive', 'hands-on', 'job-board'];
const CARD_TOPICS = ['org-list', 'reading', 'program', 'project', 'course', 'community', 'job-board', 'research', 'tool', 'person'];

const focusAreaBucketLabels = new Map([
  ['quick-taste', 'Quick taste (≈1 hour)'],
  ['deeper-dive', 'Deeper dive (2–6 hours)'],
  ['hands-on', 'Hands-on trial'],
  ['job-board', 'Job board scan (real roles)'],
]);

function toCamelBucket(bucket) {
  switch (bucket) {
    case 'quick-taste':
      return 'quickTaste';
    case 'deeper-dive':
      return 'deeperDive';
    case 'hands-on':
      return 'handsOn';
    case 'job-board':
      return 'jobBoard';
    default:
      return bucket;
  }
}

function toSlug(input) {
  return input.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').replace(/--+/g, '-');
}

function normalizeCommitment(commitment) {
  if (!commitment) return 'low';
  const lower = commitment.toLowerCase();
  // Map various commitment descriptions to low/medium/high
  if (lower.includes('tiny') || lower.includes('light') || lower.includes('quick') || lower.includes('1 hour') || lower.includes('1h')) {
    return 'low';
  }
  if (lower.includes('heavy') || lower.includes('full-time') || lower.includes('intensive') || lower.includes('long')) {
    return 'high';
  }
  // Default to medium for anything else
  return 'medium';
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function parseFrontmatter(raw) {
  if (!raw.startsWith('---')) return { frontmatter: {}, body: raw.trim() };
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return { frontmatter: {}, body: raw.trim() };
  const fm = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).trim();
  const data = fm ? yaml.load(fm) || {} : {};
  return { frontmatter: data, body };
}

async function readMarkdown(filePath) {
  const raw = await fs.readFile(filePath, 'utf-8');
  return parseFrontmatter(raw);
}

async function collectMarkdownFiles() {
  const files = [];
  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      if (entry.isDirectory()) {
        if (entry.name === '_Templates' || entry.name === '.obsidian') continue;
        await walk(path.join(dir, entry.name));
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
        files.push(path.join(dir, entry.name));
      }
    }
  }
  await walk(VAULT_ROOT);
  return files;
}

function summarize(text, maxLength = 220) {
  const plain = text.replace(/\s+/g, ' ').trim();
  if (!plain) return '';
  if (plain.length <= maxLength) return plain;
  const cutoff = plain.lastIndexOf(' ', maxLength);
  return `${plain.slice(0, cutoff > 40 ? cutoff : maxLength).trim()}…`;
}

function ensureRelativeMdPath(dest) {
  const rel = path.relative(PUBLIC_MD_DIR, dest).replace(/\\/g, '/');
  return `content/md/${rel}`;
}

async function writeMarkdown(dest, body) {
  await fs.mkdir(path.dirname(dest), { recursive: true });
  const normalized = body.endsWith('\n') ? body : `${body}\n`;
  await fs.writeFile(dest, GENERATED_HEADER + normalized, 'utf-8');
}

function validateRequired(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function build() {
  if (!(await exists(VAULT_ROOT))) throw new Error('Vault folder not found at /vault');

  await fs.rm(PUBLIC_DATA_DIR, { recursive: true, force: true });
  await fs.rm(PUBLIC_MD_DIR, { recursive: true, force: true });
  await fs.mkdir(PUBLIC_DATA_DIR, { recursive: true });
  await fs.mkdir(PUBLIC_MD_DIR, { recursive: true });

  const files = await collectMarkdownFiles();
  const flowSteps = [];
  const focusAreas = new Map();
  const focusBuckets = [];
  const cards = [];
  const pathways = [];
  const templates = [];

  for (const file of files) {
    const { frontmatter, body } = await readMarkdown(file);
    const kind = frontmatter?.kind;
    if (kind === 'flow_step') {
      validateRequired(frontmatter.id && frontmatter.title, `Missing id/title in ${file}`);
      flowSteps.push({ meta: frontmatter, body, source: file });
    } else if (kind === 'focus_area') {
      validateRequired(frontmatter.id && frontmatter.title, `Missing focus area id/title in ${file}`);
      focusAreas.set(frontmatter.id, { meta: frontmatter, body, source: file });
    } else if (kind === 'focus_area_bucket') {
      validateRequired(frontmatter.focus_area_id && frontmatter.bucket, `Missing bucket metadata in ${file}`);
      focusBuckets.push({ meta: frontmatter, body, source: file });
    } else if (kind === 'card') {
      validateRequired(frontmatter.id && frontmatter.title, `Missing card id/title in ${file}`);
      cards.push({ meta: frontmatter, body, source: file });
    } else if (kind === 'pathway') {
      validateRequired(frontmatter.id && frontmatter.title, `Missing pathway id/title in ${file}`);
      pathways.push({ meta: frontmatter, body, source: file });
    } else if (kind === 'template') {
      validateRequired(frontmatter.id && frontmatter.title, `Missing template id/title in ${file}`);
      templates.push({ meta: frontmatter, body, source: file });
    }
  }

  validateRequired(flowSteps.length > 0, 'No flow steps found in vault.');
  validateRequired(focusAreas.size > 0, 'No focus areas found in vault.');

  flowSteps.sort((a, b) => (a.meta.order || 0) - (b.meta.order || 0) || a.meta.id.localeCompare(b.meta.id));

  const flowManifest = [];
  for (const step of flowSteps) {
    const dest = path.join(PUBLIC_MD_DIR, 'flow', `${step.meta.id}.md`);
    await writeMarkdown(dest, step.body);
    flowManifest.push({
      id: step.meta.id,
      title: step.meta.title,
      shortTitle: step.meta.shortTitle || step.meta.title,
      summary: step.meta.summary || summarize(step.body || step.meta.title),
      color: step.meta.color || `step-${step.meta.id}`,
      contentPath: ensureRelativeMdPath(dest),
      order: step.meta.order,
    });
  }
  await fs.writeFile(path.join(PUBLIC_DATA_DIR, 'flow.json'), JSON.stringify(flowManifest, null, 2) + '\n');

  const cardManifest = [];
  for (const card of cards) {
    const topicValue = Array.isArray(card.meta.topic) ? card.meta.topic[0] : card.meta.topic;
    const normalizedTopic = typeof topicValue === 'string' ? toSlug(topicValue) : 'reading';
    const topic = CARD_TOPICS.includes(normalizedTopic) ? normalizedTopic : 'reading';
    const bucket = card.meta.bucket;
    const links = (card.meta.links || []).map(link => ({ label: link, url: link }));

    cardManifest.push({
      id: card.meta.id,
      title: card.meta.title,
      oneLiner: card.meta.one_liner || summarize(card.body || card.meta.title, 140),
      whenToSuggest: card.meta.when_to_suggest || 'Use when it aligns with the focus area goals.',
      whenNotToSuggest: card.meta.when_not_to_suggest || "Skip if it does not match the person's constraints or interests.",
      tags: {
        topic,
        type: bucket,
        commitment: normalizeCommitment(card.meta.commitment),
        goodFitIf: card.meta.good_fit_if || [],
      },
      firstSmallStep: card.meta.first_small_step || 'Review the linked resources.',
      nextStep: card.meta.next_step || 'Take the next action that feels most valuable.',
      links,
      peopleToTalkTo: [],
      internalNotes: card.meta.internal_notes,
      focusAreaIds: [card.meta.focus_area_id],
    });
  }

  const focusAreaManifest = [];
  const validCardIds = new Set(cardManifest.map(c => c.id));

  const resolveCurated = (list, fallback) => {
    const valid = (list || []).filter(id => validCardIds.has(id));
    return valid.length ? valid : fallback;
  };
  for (const [focusId, focus] of focusAreas.entries()) {
    const destOverview = path.join(PUBLIC_MD_DIR, 'focus-areas', focusId, 'overview.md');
    await writeMarkdown(destOverview, focus.body);

    const bucketsForArea = focusBuckets.filter(b => b.meta.focus_area_id === focusId);
    const bucketsByKey = new Map(bucketsForArea.map(b => [b.meta.bucket, b]));

    const mappedBuckets = {};
    for (const [bucketKey, bucketTitle] of focusAreaBucketLabels.entries()) {
      const bucket = bucketsByKey.get(bucketKey);
      validateRequired(bucket, `Missing bucket ${bucketKey} for focus area ${focusId}`);
      const destBucket = path.join(PUBLIC_MD_DIR, 'focus-areas', focusId, 'buckets', `${bucketKey}.md`);
      await writeMarkdown(destBucket, bucket.body);

      const bucketCardIds = cardManifest
        .filter(c => c.focusAreaIds.includes(focusId) && c.tags.type === bucketKey)
        .map(c => c.id);
      const curatedCardIds = resolveCurated(bucket.meta.curated_cards, bucketCardIds);

      mappedBuckets[toCamelBucket(bucketKey)] = {
        title: bucketTitle,
        description: summarize(bucket.body || bucketTitle),
        descriptionPath: undefined,
        cardIds: bucketCardIds,
        inlineGuidance: undefined,
        inlineGuidancePath: ensureRelativeMdPath(destBucket),
        curatedCardIds,
      };
    }

    focusAreaManifest.push({
      id: focus.meta.id,
      name: focus.meta.title,
      overviewPath: ensureRelativeMdPath(destOverview),
      overviewExcerpt: focus.meta.summary || summarize(focus.body),
      roleShapes: focus.meta.role_shapes || [],
      fitSignals: focus.meta.fit_signals || [],
      buckets: mappedBuckets,
      curatedCardIds: Array.from(
        new Set(Object.values(mappedBuckets).flatMap(b => resolveCurated(b.curatedCardIds, b.cardIds)))
      ),
      peopleToTalkToPrompts: focus.meta.people_to_talk_to || [],
      commonConfusions: focus.meta.common_confusions || [],
    });
  }

  focusAreaManifest.sort((a, b) => a.name.localeCompare(b.name));
  await fs.writeFile(path.join(PUBLIC_DATA_DIR, 'focus-areas.json'), JSON.stringify(focusAreaManifest, null, 2) + '\n');

  const pathwaysManifest = [];
  for (const pathway of pathways.sort((a, b) => (a.meta.order || 0) - (b.meta.order || 0) || a.meta.id.localeCompare(b.meta.id))) {
    const dest = path.join(PUBLIC_MD_DIR, 'pathways', `${pathway.meta.id}.md`);
    await writeMarkdown(dest, pathway.body);
    pathwaysManifest.push({
      id: pathway.meta.id,
      name: pathway.meta.title,
      contentPath: ensureRelativeMdPath(dest),
      order: pathway.meta.order,
      group: pathway.meta.group,
    });
  }
  await fs.writeFile(path.join(PUBLIC_DATA_DIR, 'pathways.json'), JSON.stringify(pathwaysManifest, null, 2) + '\n');

  // Sort templates: 'worksheet' first, then alphabetical by title
  templates.sort((a, b) => {
    if (a.meta.id === 'worksheet') return -1;
    if (b.meta.id === 'worksheet') return 1;
    return (a.meta.title || '').localeCompare(b.meta.title || '');
  });

  const templatesManifest = [];
  for (const tpl of templates) {
    const dest = path.join(PUBLIC_MD_DIR, 'templates', `${tpl.meta.id}.md`);
    await writeMarkdown(dest, tpl.body);
    templatesManifest.push({
      id: tpl.meta.id,
      name: tpl.meta.title,
      description: tpl.meta.description || summarize(tpl.body || tpl.meta.title),
      category: tpl.meta.category || 'other',
      locked: tpl.meta.locked ?? true,
      contentPath: ensureRelativeMdPath(dest),
    });
  }
  await fs.writeFile(path.join(PUBLIC_DATA_DIR, 'templates.json'), JSON.stringify(templatesManifest, null, 2) + '\n');

  await fs.writeFile(path.join(PUBLIC_DATA_DIR, 'cards.json'), JSON.stringify(cardManifest, null, 2) + '\n');

  // Log warnings for zero counts
  if (flowSteps.length === 0) console.warn('⚠️  Loaded 0 flow steps – check vault frontmatter/kind');
  if (templates.length === 0) console.warn('⚠️  Loaded 0 templates – check vault frontmatter/kind');
  if (pathways.length === 0) console.warn('⚠️  Loaded 0 pathways – check vault frontmatter/kind');
  if (focusAreas.size === 0) console.warn('⚠️  Loaded 0 focus areas – check vault frontmatter/kind');
  if (cards.length === 0) console.warn('⚠️  Loaded 0 cards – check vault frontmatter/kind');

  console.log('Vault index built.');
  console.log(`  Flow steps: ${flowSteps.length}`);
  console.log(`  Templates: ${templates.length}`);
  console.log(`  Pathways: ${pathways.length}`);
  console.log(`  Focus areas: ${focusAreas.size}`);
  console.log(`  Cards: ${cards.length}`);
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});
