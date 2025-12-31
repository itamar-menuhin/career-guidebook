#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VAULT_ROOT = path.join(ROOT, 'vault');
const PUBLIC_CONTENT = path.join(ROOT, 'public', 'content');

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function stripGenerated(content) {
  return content.replace(/^# GENERATED FILE[^\n]*\n\n?/, '').trim();
}

function stringifyFrontmatter(body, frontmatter) {
  const yamlText = yaml.dump(frontmatter, { lineWidth: 1000 }).trim();
  const normalized = body?.trim() || '';
  return `---\n${yamlText}\n---\n\n${normalized}\n`;
}

async function readJson(rel) {
  const full = path.join(PUBLIC_CONTENT, 'data', rel);
  const raw = await fs.readFile(full, 'utf-8');
  return JSON.parse(raw);
}

async function readMarkdown(rel) {
  const cleaned = rel.replace(/^content\//, '');
  const full = path.join(PUBLIC_CONTENT, cleaned);
  const raw = await fs.readFile(full, 'utf-8');
  return stripGenerated(raw);
}

async function migrateFlow() {
  const flow = await readJson('flow.json');
  const destDir = path.join(VAULT_ROOT, '01_Flow');
  await ensureDir(destDir);
  for (const [index, step] of flow.entries()) {
    const body = await readMarkdown(step.contentPath);
    const fm = {
      kind: 'flow_step',
      id: step.id,
      title: step.title,
      order: step.order ?? index + 1,
    };
    const md = stringifyFrontmatter(body, fm);
    await fs.writeFile(path.join(destDir, `${step.id}.md`), md, 'utf-8');
  }
}

async function migrateFocusAreas() {
  const focusAreas = await readJson('focus-areas.json');
  for (const area of focusAreas) {
    const areaDir = path.join(VAULT_ROOT, '02_Focus-Areas', area.id);
    await ensureDir(areaDir);
    const overviewBody = await readMarkdown(area.overviewPath);
    const fm = {
      kind: 'focus_area',
      id: area.id,
      title: area.name,
      summary: area.overviewExcerpt || overviewBody.slice(0, 200),
      role_shapes: area.roleShapes || [],
      fit_signals: area.fitSignals || [],
      people_to_talk_to: area.peopleToTalkToPrompts || [],
      common_confusions: area.commonConfusions || [],
    };
    const md = stringifyFrontmatter(overviewBody, fm);
    await fs.writeFile(path.join(areaDir, 'overview.md'), md, 'utf-8');

    const bucketDir = path.join(areaDir, 'buckets');
    await ensureDir(bucketDir);
    const bucketMap = {
      quickTaste: 'quick-taste',
      deeperDive: 'deeper-dive',
      handsOn: 'hands-on',
      jobBoard: 'job-board',
    };

    for (const [key, bucket] of Object.entries(area.buckets || {})) {
      const slug = bucketMap[key] || key;
      const body = bucket.inlineGuidancePath
        ? await readMarkdown(bucket.inlineGuidancePath)
        : bucket.description || '';
      const fmBucket = {
        kind: 'focus_area_bucket',
        focus_area_id: area.id,
        bucket: slug,
        title: bucket.title,
        curated_cards: bucket.cardIds || [],
      };
      const bucketMd = stringifyFrontmatter(body, fmBucket);
      await fs.writeFile(path.join(bucketDir, `${slug}.md`), bucketMd, 'utf-8');
    }
  }
}

async function migrateCards() {
  const cards = await readJson('cards.json');
  for (const card of cards) {
    const focusAreaId = card.focusAreaIds?.[0] || 'general';
    const dir = path.join(VAULT_ROOT, '03_Cards', focusAreaId);
    await ensureDir(dir);
    const fm = {
      kind: 'card',
      id: card.id,
      title: card.title,
      focus_area_id: focusAreaId,
      bucket: card.tags.type,
      topic: card.tags.topic,
      commitment: card.tags.commitment,
      good_fit_if: card.tags.goodFitIf || [],
      one_liner: card.oneLiner,
      first_small_step: card.firstSmallStep,
      next_step: card.nextStep,
      links: (card.links || []).map(l => l.url || l),
      when_to_suggest: card.whenToSuggest,
      when_not_to_suggest: card.whenNotToSuggest,
      internal_notes: card.internalNotes,
    };
    const bodyLines = [
      '## When to suggest',
      card.whenToSuggest,
      '',
      '## When not to suggest',
      card.whenNotToSuggest,
      '',
      '## Notes',
      card.oneLiner,
    ].join('\n');
    const md = stringifyFrontmatter(bodyLines.trim(), fm);
    await fs.writeFile(path.join(dir, `${card.id}.md`), md, 'utf-8');
  }
}

async function migratePathways() {
  const pathways = await readJson('pathways.json');
  const dir = path.join(VAULT_ROOT, '04_Common-Pathways');
  await ensureDir(dir);
  for (const [index, p] of pathways.entries()) {
    const fm = {
      kind: 'pathway',
      id: p.id,
      title: p.name,
      order: index + 1,
      when_to_suggest: p.whenToSuggest,
      fit_test_prompts: p.fitTestPrompts || [],
      default_first_small_step: p.defaultFirstSmallStep,
      related_card_ids: p.relatedCardIds || [],
    };
    const body = [p.description, '', ...(p.fitTestPrompts || []).map(q => `- ${q}`)].join('\n');
    const md = stringifyFrontmatter(body.trim(), fm);
    await fs.writeFile(path.join(dir, `${p.id}.md`), md, 'utf-8');
  }
}

async function migrateTemplates() {
  const templates = await readJson('templates.json');
  const dir = path.join(VAULT_ROOT, '05_Templates');
  await ensureDir(dir);
  for (const tpl of templates) {
    const body = await readMarkdown(tpl.contentPath);
    const fm = {
      kind: 'template',
      id: tpl.id,
      title: tpl.name,
      description: tpl.description,
      category: tpl.category || 'other',
    };
    const md = stringifyFrontmatter(body, fm);
    await fs.writeFile(path.join(dir, `${tpl.id}.md`), md, 'utf-8');
  }
}

async function ensureVaultSkeleton() {
  await Promise.all(
    [
      '00_Start-Here',
      '01_Flow',
      '02_Focus-Areas',
      '03_Cards',
      '04_Common-Pathways',
      '05_Templates',
      '_Templates',
    ].map(folder => ensureDir(path.join(VAULT_ROOT, folder)))
  );
}

async function main() {
  await ensureVaultSkeleton();
  await migrateFlow();
  await migrateFocusAreas();
  await migrateCards();
  await migratePathways();
  await migrateTemplates();
  console.log('Migration to vault complete.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
