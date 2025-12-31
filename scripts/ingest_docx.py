#!/usr/bin/env python3
"""
DOCX ingestion pipeline for Career Compass content.

Usage:
    python3 scripts/ingest_docx.py            # One-time ingest
    python3 scripts/ingest_docx.py --watch    # Poll for DOCX changes and re-ingest
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Optional

try:
    from docx import Document
except ImportError:  # pragma: no cover - runtime guard for missing dependency
    print("The 'python-docx' package is required. Install with `pip install python-docx`.", file=sys.stderr)
    sys.exit(1)


ROOT = Path(__file__).resolve().parents[1]
SOURCE_CORE = ROOT / "source_docs" / "core" / "1_1_career_counselling_guidebook.docx"
SOURCE_FOCUS_ROOT = ROOT / "source_docs" / "focus_areas"

CONTENT_ROOT = ROOT / "content"
PUBLIC_CONTENT = ROOT / "public" / "content"

FLOW_OUTPUT_DIR = CONTENT_ROOT / "flow"
TEMPLATE_OUTPUT_DIR = CONTENT_ROOT / "templates"
FOCUS_AREAS_OUTPUT_DIR = CONTENT_ROOT / "focus-areas"

FLOW_JSON_PATH = PUBLIC_CONTENT / "flow.json"
TEMPLATES_JSON_PATH = PUBLIC_CONTENT / "templates.json"
FOCUS_AREAS_JSON_PATH = PUBLIC_CONTENT / "focus-areas.json"
CARDS_JSON_PATH = PUBLIC_CONTENT / "cards.json"


def slugify(value: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower()
    return re.sub(r"-{2,}", "-", cleaned)


def normalize(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()


def paragraph_text(doc_path: Path) -> List[str]:
    document = Document(doc_path)
    return [p.text.strip() for p in document.paragraphs if p.text and p.text.strip()]


def write_markdown(path: Path, paragraphs: Iterable[str]) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    content = "\n\n".join(p.strip() for p in paragraphs).strip() + "\n"
    path.write_text(content, encoding="utf-8")
    return content


def summarize(text: str, max_length: int = 220) -> str:
    plain = re.sub(r"\s+", " ", text).strip()
    if len(plain) <= max_length:
        return plain
    cutoff = plain.rfind(" ", 0, max_length)
    return plain[: cutoff if cutoff > 40 else max_length].rstrip() + "…"


def list_from_paragraphs(paragraphs: Iterable[str]) -> List[str]:
    items: List[str] = []
    for para in paragraphs:
        for part in re.split(r"[\n\r]+", para):
            cleaned = part.strip()
            cleaned = re.sub(r"^[\-\u2022•▪]+", "", cleaned).strip()
            if cleaned:
                items.append(cleaned)
    return items


# --- Core guidebook parsing -------------------------------------------------


CORE_FLOW_MARKERS = [
    ("opening", ["opening & goal"]),
    ("background", ["chapter 1", "what they bring"]),
    ("happiness", ["chapter 2", "what would make them happy"]),
    ("constraints", ["chapter 3", "constraints"]),
    ("directions", ["iterative direction testing"]),
    ("wrap", ["wrap + written summary template"]),
]

CORE_TEMPLATE_MARKERS = {
    "wrap-summary": ["wrap + written summary template (locked)", "wrap & written summary template (locked)"],
    "focus-area-template": ["cause-area quick-start page template (locked)"],
}


@dataclass
class CoreGuidebookContent:
    flow_sections: dict
    templates: dict


def find_marker_indices(paragraphs: List[str], marker_sets: List[tuple[str, List[str]]]) -> dict[str, int]:
    indices: dict[str, int] = {}
    for idx, para in enumerate(paragraphs):
        normalized = normalize(para)
        for key, markers in marker_sets:
            if key in indices:
                continue
            if all(m in normalized for m in [normalize(m) for m in markers]):
                indices[key] = idx
    missing = [k for k, _ in marker_sets if k not in indices]
    if missing:
        raise ValueError(f"Missing expected sections in core guidebook: {', '.join(missing)}")
    return indices


def extract_sections(paragraphs: List[str], markers: List[tuple[str, List[str]]]) -> dict[str, List[str]]:
    indices = find_marker_indices(paragraphs, markers)
    ordered_keys = [key for key, _ in markers]
    sections: dict[str, List[str]] = {}
    for i, key in enumerate(ordered_keys):
        start = indices[key] + 1
        end = len(paragraphs)
        if i + 1 < len(ordered_keys):
            end = indices[ordered_keys[i + 1]]
        sections[key] = paragraphs[start:end]
    return sections


def parse_core_docx(path: Path) -> CoreGuidebookContent:
    paragraphs = paragraph_text(path)
    flow_sections = extract_sections(paragraphs, CORE_FLOW_MARKERS)

    template_sections: dict[str, List[str]] = {}
    for template_id, patterns in CORE_TEMPLATE_MARKERS.items():
        for idx, para in enumerate(paragraphs):
            normalized = normalize(para)
            if all(normalize(pat) in normalized for pat in patterns):
                end_idx = len(paragraphs)
                for later_idx in range(idx + 1, len(paragraphs)):
                    if normalize("recommendation cards") in normalize(paragraphs[later_idx]):
                        end_idx = later_idx
                        break
                template_sections[template_id] = paragraphs[idx + 1 : end_idx]
                break
        if template_id not in template_sections:
            raise ValueError(f"Missing template section for '{template_id}' in {path}")

    return CoreGuidebookContent(flow_sections=flow_sections, templates=template_sections)


def update_flow_content(flow_content: CoreGuidebookContent):
    flow_markdown_paths = {
        "opening": FLOW_OUTPUT_DIR / "opening.md",
        "background": FLOW_OUTPUT_DIR / "background.md",
        "happiness": FLOW_OUTPUT_DIR / "happiness.md",
        "constraints": FLOW_OUTPUT_DIR / "constraints.md",
        "directions": FLOW_OUTPUT_DIR / "directions.md",
        "wrap": FLOW_OUTPUT_DIR / "wrap.md",
    }

    for key, paragraphs in flow_content.flow_sections.items():
        write_markdown(flow_markdown_paths[key], paragraphs)

    flow_manifest = json.loads(FLOW_JSON_PATH.read_text(encoding="utf-8"))
    flow_manifest_by_id = {entry["id"]: entry for entry in flow_manifest}
    for flow_id, path in flow_markdown_paths.items():
        if flow_id not in flow_manifest_by_id:
            flow_manifest.append(
                {
                    "id": flow_id,
                    "title": flow_id.title(),
                    "shortTitle": flow_id.title(),
                    "color": f"step-{flow_id}",
                    "contentPath": "",
                }
            )
            flow_manifest_by_id = {entry["id"]: entry for entry in flow_manifest}
        flow_manifest_by_id[flow_id]["contentPath"] = str(path.relative_to(CONTENT_ROOT.parent))
    FLOW_JSON_PATH.write_text(json.dumps(flow_manifest, indent=2) + "\n", encoding="utf-8")


def update_templates_content(flow_content: CoreGuidebookContent):
    template_paths = {
        "wrap-summary": TEMPLATE_OUTPUT_DIR / "wrap-summary.md",
        "focus-area-template": TEMPLATE_OUTPUT_DIR / "focus-area-template.md",
    }

    for template_id, paragraphs in flow_content.templates.items():
        write_markdown(template_paths[template_id], paragraphs)

    template_manifest = json.loads(TEMPLATES_JSON_PATH.read_text(encoding="utf-8"))
    manifest_by_id = {entry["id"]: entry for entry in template_manifest}

    defaults = {
        "wrap-summary": {
            "name": "Wrap Summary Template",
            "description": "Standard format for session wrap-up notes",
            "category": "wrap",
            "locked": True,
        },
        "focus-area-template": {
            "name": "Focus Area Template",
            "description": "Structure for adding new focus areas",
            "category": "focus-area",
            "locked": True,
        },
    }

    for template_id, path in template_paths.items():
        if template_id not in manifest_by_id:
            template_manifest.append({"id": template_id, **defaults[template_id], "contentPath": ""})
            manifest_by_id = {entry["id"]: entry for entry in template_manifest}
        manifest_by_id[template_id]["contentPath"] = str(path.relative_to(CONTENT_ROOT.parent))

    TEMPLATES_JSON_PATH.write_text(json.dumps(template_manifest, indent=2) + "\n", encoding="utf-8")


# --- Focus area parsing -----------------------------------------------------


EXPERIMENT_BUCKETS = {
    "a": "quickTaste",
    "b": "deeperDive",
    "c": "handsOn",
    "d": "jobBoard",
}

TYPE_ALIASES = {
    "experiment a": "quick-taste",
    "quick taste": "quick-taste",
    "quick-taste": "quick-taste",
    "a": "quick-taste",
    "experiment b": "deeper-dive",
    "deeper dive": "deeper-dive",
    "deeper-dive": "deeper-dive",
    "b": "deeper-dive",
    "experiment c": "hands-on",
    "hands on": "hands-on",
    "hands-on": "hands-on",
    "c": "hands-on",
    "experiment d": "job-board",
    "job board": "job-board",
    "job-board": "job-board",
    "d": "job-board",
}

TOPIC_ALIASES = {
    "reading": "reading",
    "program": "program",
    "project": "project",
    "course": "course",
    "community": "community",
    "job board": "job-board",
    "job-board": "job-board",
    "org list": "org-list",
    "org-list": "org-list",
    "research": "research",
    "tool": "tool",
    "person": "person",
}

COMMITMENT_ALIASES = {
    "low": "low",
    "medium": "medium",
    "med": "medium",
    "high": "high",
}


def match_experiment_marker(text: str) -> Optional[str]:
    match = re.match(r"experiment\s*([abcd])", normalize(text))
    if match:
        return match.group(1).lower()
    return None


def extract_focus_area_name(paragraphs: List[str]) -> tuple[str, List[str]]:
    for idx, para in enumerate(paragraphs):
        match = re.search(r"cause\s+area\s*:\s*(.+)", para, flags=re.IGNORECASE)
        if match:
            name = match.group(1).strip().strip(":").strip()
            remaining = paragraphs[idx + 1 :]
            return name, remaining
    raise ValueError("Unable to find 'Cause area:' line in focus area doc")


@dataclass
class FocusAreaContent:
    name: str
    slug: str
    overview_paragraphs: List[str]
    role_shapes: List[str]
    fit_signals: List[str]
    people_to_talk_to: List[str]
    common_confusions: List[str]
    bucket_markdown: dict
    cards: List[dict]


def split_focus_area_sections(paragraphs: List[str]) -> FocusAreaContent:
    name, body = extract_focus_area_name(paragraphs)
    slug = slugify(name)

    overview: List[str] = []
    role_shapes: List[str] = []
    fit_signals: List[str] = []
    people_to_talk_to: List[str] = []
    common_confusions: List[str] = []
    bucket_content: dict[str, List[str]] = defaultdict(list)
    card_lines: List[str] = []

    current_bucket: Optional[str] = None
    in_cards = False
    current_section: Optional[str] = None

    section_markers = {
        "role shapes": "role_shapes",
        "fit signals": "fit_signals",
        "people to talk to prompts": "people_to_talk_to",
        "common confusions": "common_confusions",
        "recommendation cards": "cards",
    }

    for para in body:
        normalized_para = normalize(para)

        bucket_key = match_experiment_marker(para)
        if bucket_key:
            current_bucket = EXPERIMENT_BUCKETS[bucket_key]
            in_cards = False
            current_section = None
            continue

        matched_section = None
        for marker, section_key in section_markers.items():
            if marker in normalized_para:
                matched_section = section_key
                break
        if matched_section:
            current_bucket = None
            current_section = matched_section
            in_cards = matched_section == "cards"
            continue

        if in_cards:
            card_lines.append(para)
            continue

        if current_bucket:
            bucket_content[current_bucket].append(para)
            continue

        if current_section:
            if current_section == "role_shapes":
                role_shapes.append(para)
            elif current_section == "fit_signals":
                fit_signals.append(para)
            elif current_section == "people_to_talk_to":
                people_to_talk_to.append(para)
            elif current_section == "common_confusions":
                common_confusions.append(para)
            continue

        overview.append(para)

    return FocusAreaContent(
        name=name,
        slug=slug,
        overview_paragraphs=overview,
        role_shapes=list_from_paragraphs(role_shapes),
        fit_signals=list_from_paragraphs(fit_signals),
        people_to_talk_to=list_from_paragraphs(people_to_talk_to),
        common_confusions=list_from_paragraphs(common_confusions),
        bucket_markdown={k: v for k, v in bucket_content.items()},
        cards=parse_cards(card_lines, slug),
    )


def split_card_blocks(lines: List[str]) -> List[List[str]]:
    blocks: List[List[str]] = []
    current: List[str] = []
    for line in lines:
        if re.match(r"card\s+\d+", normalize(line)):
            if current:
                blocks.append(current)
                current = []
            continue
        current.append(line)
    if current:
        blocks.append(current)
    return blocks


def map_topic(value: str) -> str:
    normalized = normalize(value)
    for key, topic in TOPIC_ALIASES.items():
        if key in normalized:
            return topic
    return TOPIC_ALIASES.get(normalized, "reading")


def map_type(value: str) -> str:
    letter = match_experiment_marker(value)
    if letter:
        return TYPE_ALIASES.get(letter, "quick-taste")
    normalized = normalize(value)
    for key, mapped in TYPE_ALIASES.items():
        if key in normalized:
            return mapped
    return TYPE_ALIASES.get(normalized, "quick-taste")


def map_commitment(value: str) -> str:
    normalized = normalize(value)
    for key, level in COMMITMENT_ALIASES.items():
        if key in normalized:
            return level
    return COMMITMENT_ALIASES.get(normalized, "low")


def parse_links(lines: List[str]) -> List[dict]:
    links = []
    for line in lines:
        urls = re.findall(r"https?://\S+", line)
        if not urls:
            continue
        for url in urls:
            label = line.replace(url, "").strip(" -–—:")
            links.append({"label": label or url, "url": url})
    return links


def parse_cards(lines: List[str], focus_area_id: str) -> List[dict]:
    cards: List[dict] = []
    for block in split_card_blocks(lines):
        current_field = None
        collected_lines: dict[str, List[str]] = defaultdict(list)

        def commit_field(field_key: Optional[str], text: str):
            if field_key:
                collected_lines[field_key].append(text)

        for raw_line in block:
            line = raw_line.strip()
            field_match = re.match(r"([A-Za-z0-9 \\-/&()]+):\s*(.*)$", line)
            if field_match:
                field_label = normalize(field_match.group(1))
                value = field_match.group(2).strip()
                current_field = field_label
                if value:
                    commit_field(current_field, value)
                continue
            if current_field:
                commit_field(current_field, line)

        title = " ".join(collected_lines.get("recommendation name", [])).strip()
        one_liner = " ".join(collected_lines.get("one line pitch", [])).strip()
        when_to_suggest = " ".join(collected_lines.get("when to suggest", [])).strip()
        when_not_to = " ".join(collected_lines.get("when not to", [])).strip()
        topic = map_topic(" ".join(collected_lines.get("topic", [])))
        type_tag = map_type(" ".join(collected_lines.get("type", [])))
        commitment = map_commitment(" ".join(collected_lines.get("commitment", [])))
        good_fit_raw = " ".join(collected_lines.get("fit gate", []))
        good_fit_if = [item.strip() for item in re.split(r"[;•\n]", good_fit_raw) if item.strip()] or [
            "Good fit details provided in focus area doc."
        ]
        first_step = " ".join(
            collected_lines.get("toe in the water", []) or collected_lines.get("best toe in the water step", [])
        ).strip()
        next_step = " ".join(collected_lines.get("next step", [])).strip()
        resources_lines = collected_lines.get("resources / links", [])
        links = parse_links(resources_lines)

        cards.append(
            {
                "title": title or "Untitled recommendation",
                "oneLiner": one_liner or "See detailed guidance in resources.",
                "whenToSuggest": when_to_suggest or "Use when it aligns with the focus area goals.",
                "whenNotToSuggest": when_not_to or "Skip if it does not match the person's constraints or interests.",
                "tags": {
                    "topic": topic,
                    "type": type_tag,
                    "commitment": commitment,
                    "goodFitIf": good_fit_if,
                },
                "firstSmallStep": first_step or "Review the first linked resource.",
                "nextStep": next_step or "Review the provided resources and choose a concrete action.",
                "links": links,
                "peopleToTalkTo": [],
                "focusAreaIds": [focus_area_id],
            }
        )
    return cards


def update_cards_json(parsed_cards: List[dict]):
    existing_cards = []
    if CARDS_JSON_PATH.exists():
        existing_cards = json.loads(CARDS_JSON_PATH.read_text(encoding="utf-8"))

    existing_by_title = {card["title"].lower(): card for card in existing_cards}
    parsed_focus_areas = {fa for card in parsed_cards for fa in card.get("focusAreaIds", []) if fa}
    filtered_existing = [
        card for card in existing_cards if not parsed_focus_areas.intersection(set(card.get("focusAreaIds", [])))
    ]

    new_cards: List[dict] = filtered_existing.copy()
    for card in parsed_cards:
        match = existing_by_title.get(card["title"].lower())
        card_id = match["id"] if match else slugify(card["title"])
        merged_focus_areas = set(match.get("focusAreaIds", [])) if match else set()
        merged_focus_areas.update(card.get("focusAreaIds", []))
        card["id"] = card_id
        card["focusAreaIds"] = sorted(fa for fa in merged_focus_areas if fa)
        new_cards.append(card)

    CARDS_JSON_PATH.write_text(json.dumps(new_cards, indent=2) + "\n", encoding="utf-8")
    return new_cards


def build_focus_area_manifest(content: FocusAreaContent, cards: List[dict]) -> dict:
    overview_md_path = FOCUS_AREAS_OUTPUT_DIR / content.slug / "overview.md"
    overview_text = write_markdown(overview_md_path, content.overview_paragraphs)
    overview_excerpt = summarize(overview_text)

    bucket_titles = {
        "quickTaste": "Quick taste (≈1 hour)",
        "deeperDive": "Deeper dive (2–6 hours)",
        "handsOn": "Hands-on trial",
        "jobBoard": "Job board scan (real roles)",
    }

    bucket_filenames = {
        "quickTaste": "quick-taste.md",
        "deeperDive": "deeper-dive.md",
        "handsOn": "hands-on.md",
        "jobBoard": "job-board.md",
    }

    bucket_inline_paths = {
        key: FOCUS_AREAS_OUTPUT_DIR / content.slug / "buckets" / filename
        for key, filename in bucket_filenames.items()
    }

    bucket_summaries: dict[str, str] = {}
    for bucket_key, path in bucket_inline_paths.items():
        paragraphs = content.bucket_markdown.get(bucket_key) or [f"Inline guidance coming soon for {bucket_titles[bucket_key]}."]
        md_text = write_markdown(path, paragraphs)
        bucket_summaries[bucket_key] = summarize(md_text)

    bucket_card_ids: dict[str, List[str]] = {k: [] for k in bucket_titles}
    for card in cards:
        card_type = card["tags"]["type"]
        if card_type == "quick-taste":
            bucket_card_ids["quickTaste"].append(card["id"])
        elif card_type == "deeper-dive":
            bucket_card_ids["deeperDive"].append(card["id"])
        elif card_type == "hands-on":
            bucket_card_ids["handsOn"].append(card["id"])
        elif card_type == "job-board":
            bucket_card_ids["jobBoard"].append(card["id"])

    def non_empty_list(values: List[str], fallback: str) -> List[str]:
        if values:
            return values
        return [fallback]

    return {
        "id": content.slug,
        "name": content.name,
        "overviewPath": str(overview_md_path.relative_to(CONTENT_ROOT.parent)),
        "overviewExcerpt": overview_excerpt,
        "roleShapes": non_empty_list(content.role_shapes, "See overview for key role shapes."),
        "fitSignals": non_empty_list(content.fit_signals, "Use discovery questions in the overview."),
        "buckets": {
            "quickTaste": {
                "title": bucket_titles["quickTaste"],
                "description": bucket_summaries.get("quickTaste", "See inline guidance for quick taste ideas."),
                "cardIds": bucket_card_ids["quickTaste"],
                "inlineGuidancePath": str(bucket_inline_paths["quickTaste"].relative_to(CONTENT_ROOT.parent)),
            },
            "deeperDive": {
                "title": bucket_titles["deeperDive"],
                "description": bucket_summaries.get("deeperDive", "See inline guidance for deeper dives."),
                "cardIds": bucket_card_ids["deeperDive"],
                "inlineGuidancePath": str(bucket_inline_paths["deeperDive"].relative_to(CONTENT_ROOT.parent)),
            },
            "handsOn": {
                "title": bucket_titles["handsOn"],
                "description": bucket_summaries.get("handsOn", "See inline guidance for hands-on options."),
                "cardIds": bucket_card_ids["handsOn"],
                "inlineGuidancePath": str(bucket_inline_paths["handsOn"].relative_to(CONTENT_ROOT.parent)),
            },
            "jobBoard": {
                "title": bucket_titles["jobBoard"],
                "description": bucket_summaries.get("jobBoard", "See inline guidance for job-board scans."),
                "cardIds": bucket_card_ids["jobBoard"],
                "inlineGuidancePath": str(bucket_inline_paths["jobBoard"].relative_to(CONTENT_ROOT.parent)),
            },
        },
        "curatedCardIds": sorted({cid for cids in bucket_card_ids.values() for cid in cids}),
        "peopleToTalkToPrompts": content.people_to_talk_to,
        "commonConfusions": content.common_confusions or [],
    }


def ingest_focus_area_docs() -> List[dict]:
    focus_area_docs = sorted(SOURCE_FOCUS_ROOT.glob("*.docx"))
    focus_contents: List[FocusAreaContent] = []
    parsed_cards: List[dict] = []

    for doc_path in focus_area_docs:
        paragraphs = paragraph_text(doc_path)
        focus_content = split_focus_area_sections(paragraphs)
        focus_contents.append(focus_content)
        parsed_cards.extend(focus_content.cards)

    if not focus_contents:
        return []

    updated_cards = update_cards_json(parsed_cards)

    focus_manifest_entries: List[dict] = []
    for focus_content in focus_contents:
        focus_cards = [card for card in updated_cards if focus_content.slug in card.get("focusAreaIds", [])]
        focus_manifest_entries.append(build_focus_area_manifest(focus_content, focus_cards))

    existing_focus = []
    if FOCUS_AREAS_JSON_PATH.exists():
        existing_focus = json.loads(FOCUS_AREAS_JSON_PATH.read_text(encoding="utf-8"))

    merged: dict[str, dict] = {entry["id"]: entry for entry in existing_focus}
    for entry in focus_manifest_entries:
        merged[entry["id"]] = entry

    FOCUS_AREAS_JSON_PATH.write_text(json.dumps(list(merged.values()), indent=2) + "\n", encoding="utf-8")
    return focus_manifest_entries


def ingest_core():
    if not SOURCE_CORE.exists():
        raise FileNotFoundError(f"Missing core guidebook DOCX at {SOURCE_CORE}")
    core_content = parse_core_docx(SOURCE_CORE)
    update_flow_content(core_content)
    update_templates_content(core_content)


def ingest_all():
    ingest_core()
    ingest_focus_area_docs()


def watch_loop(poll_interval: float = 2.0):
    def get_signatures():
        sig = []
        if SOURCE_CORE.exists():
            sig.append(SOURCE_CORE.stat().st_mtime)
        for path in sorted(SOURCE_FOCUS_ROOT.glob("*.docx")):
            sig.append(path.stat().st_mtime)
        return sig

    last_sig = get_signatures()
    print("Watching for DOCX changes. Press Ctrl+C to stop.")
    while True:
        time.sleep(poll_interval)
        current_sig = get_signatures()
        if current_sig != last_sig:
            print("Change detected. Re-ingesting…")
            try:
                ingest_all()
                print("Ingest complete.")
            except Exception as exc:  # pragma: no cover - user feedback path
                print(f"Ingest failed: {exc}", file=sys.stderr)
            last_sig = current_sig


def main():
    parser = argparse.ArgumentParser(description="Ingest DOCX files into markdown + JSON content.")
    parser.add_argument("--watch", action="store_true", help="Poll for DOCX changes and re-run ingestion.")
    args = parser.parse_args()

    try:
        ingest_all()
        if args.watch:
            watch_loop()
    except Exception as exc:
        print(f"Ingestion failed: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
