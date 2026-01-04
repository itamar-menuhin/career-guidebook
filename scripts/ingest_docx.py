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
import shutil
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
SOURCE_DOCS = ROOT / "source_docs"
SOURCE_CORE = SOURCE_DOCS / "core" / "1_1_career_counselling_guidebook.docx"
SOURCE_FOCUS_ROOT = SOURCE_DOCS / "focus_areas"
CONTENT_MANUAL_DIR = ROOT / "content_manual"

GENERATED_ROOT = ROOT / "generated"
GENERATED_CONTENT_ROOT = GENERATED_ROOT / "content"
GENERATED_DATA_ROOT = GENERATED_ROOT / "data"

PUBLIC_CONTENT_ROOT = ROOT / "public" / "content"
PUBLIC_DATA_DIR = PUBLIC_CONTENT_ROOT / "data"
PUBLIC_MD_DIR = PUBLIC_CONTENT_ROOT / "md"

FLOW_OUTPUT_DIR = GENERATED_CONTENT_ROOT / "flow"
TEMPLATE_OUTPUT_DIR = GENERATED_CONTENT_ROOT / "templates"
FOCUS_AREAS_OUTPUT_DIR = GENERATED_CONTENT_ROOT / "focus-areas"

FLOW_JSON_PATH = GENERATED_DATA_ROOT / "flow.json"
TEMPLATES_JSON_PATH = GENERATED_DATA_ROOT / "templates.json"
FOCUS_AREAS_JSON_PATH = GENERATED_DATA_ROOT / "focus-areas.json"
CARDS_JSON_PATH = GENERATED_DATA_ROOT / "cards.json"

GENERATED_FILE_HEADER = "# GENERATED FILE - DO NOT EDIT MANUALLY\n\n"
PUBLIC_MD_PREFIX = Path("content") / "md"
PUBLIC_DATA_PREFIX = Path("content") / "data"


def remove_dir_if_exists(path: Path):
    if path.exists():
        shutil.rmtree(path)


def reset_generated_outputs():
    remove_dir_if_exists(GENERATED_ROOT)
    GENERATED_CONTENT_ROOT.mkdir(parents=True, exist_ok=True)
    GENERATED_DATA_ROOT.mkdir(parents=True, exist_ok=True)


def reset_public_content_dirs():
    PUBLIC_CONTENT_ROOT.mkdir(parents=True, exist_ok=True)
    for stray in PUBLIC_CONTENT_ROOT.glob("*.json"):
        stray.unlink()
    remove_dir_if_exists(PUBLIC_DATA_DIR)
    remove_dir_if_exists(PUBLIC_MD_DIR)
    PUBLIC_DATA_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_MD_DIR.mkdir(parents=True, exist_ok=True)


def load_existing_json(*paths: Path) -> list:
    for path in paths:
        if path.exists():
            return json.loads(path.read_text(encoding="utf-8"))
    return []


def sync_generated_to_public():
    reset_public_content_dirs()
    if GENERATED_DATA_ROOT.exists():
        shutil.copytree(GENERATED_DATA_ROOT, PUBLIC_DATA_DIR, dirs_exist_ok=True)
    if GENERATED_CONTENT_ROOT.exists():
        shutil.copytree(GENERATED_CONTENT_ROOT, PUBLIC_MD_DIR, dirs_exist_ok=True)


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
    body = "\n\n".join(p.strip() for p in paragraphs).strip()
    body = f"{body}\n" if body else ""
    path.write_text(GENERATED_FILE_HEADER + body, encoding="utf-8")
    return body


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

    existing_manifest = load_existing_json(PUBLIC_DATA_DIR / "flow.json", PUBLIC_CONTENT_ROOT / "flow.json")
    flow_manifest_by_id = {entry["id"]: entry for entry in existing_manifest}

    default_titles = {
        "opening": "Opening & goal",
        "background": "What they bring",
        "happiness": "What would make them happy",
        "constraints": "Constraints",
        "directions": "Iterative direction testing",
        "wrap": "Wrap & commitments",
    }

    flow_manifest = []
    for flow_id, path in flow_markdown_paths.items():
        public_md_path = PUBLIC_MD_PREFIX / "flow" / path.name
        existing = flow_manifest_by_id.get(flow_id, {})
        content_text = (path.read_text(encoding="utf-8").replace(GENERATED_FILE_HEADER, "")).strip()
        flow_manifest.append(
            {
                "id": flow_id,
                "title": existing.get("title") or default_titles.get(flow_id, flow_id.title()),
                "shortTitle": existing.get("shortTitle") or default_titles.get(flow_id, flow_id.title()),
                "summary": existing.get("summary") or summarize(content_text),
                "color": existing.get("color") or f"step-{flow_id}",
                "contentPath": str(public_md_path),
            }
        )

    FLOW_JSON_PATH.write_text(json.dumps(flow_manifest, indent=2) + "\n", encoding="utf-8")


def update_templates_content(flow_content: CoreGuidebookContent):
    template_paths = {
        "wrap-summary": TEMPLATE_OUTPUT_DIR / "wrap-summary.md",
        "focus-area-template": TEMPLATE_OUTPUT_DIR / "focus-area-template.md",
    }

    for template_id, paragraphs in flow_content.templates.items():
        write_markdown(template_paths[template_id], paragraphs)

    template_manifest = load_existing_json(PUBLIC_DATA_DIR / "templates.json", PUBLIC_CONTENT_ROOT / "templates.json")
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

    updated_manifest = []
    for template_id, path in template_paths.items():
        public_md_path = PUBLIC_MD_PREFIX / "templates" / path.name
        if template_id not in manifest_by_id:
            manifest_by_id[template_id] = {"id": template_id, **defaults[template_id], "contentPath": ""}
        updated_manifest.append({**manifest_by_id[template_id], "contentPath": str(public_md_path)})

    TEMPLATES_JSON_PATH.write_text(json.dumps(updated_manifest, indent=2) + "\n", encoding="utf-8")


# --- Focus area parsing -----------------------------------------------------


EXPERIMENT_BUCKETS = {
    "a": "quickTaste",
    "b": "deeperDive",
    "c": "handsOn",
    "d": "jobBoard",
}

BUCKET_HEADING_ALIASES = {
    normalize("Quick taste (≈1 hour)"): "quickTaste",
    normalize("Deeper dive (2–6 hours)"): "deeperDive",
    normalize("Hands-on trial"): "handsOn",
    normalize("Job board scan (real roles)"): "jobBoard",
}

TYPE_ALIASES = {
    "experiment a": "quick-taste",
    "quick taste": "quick-taste",
    "quick taste 1 hour": "quick-taste",
    "quick taste 1hour": "quick-taste",
    "quick taste ≈1 hour": "quick-taste",
    "quick taste 1h": "quick-taste",
    "quick-taste": "quick-taste",
    "a": "quick-taste",
    "experiment b": "deeper-dive",
    "deeper dive": "deeper-dive",
    "deeper dive 2–6 hours": "deeper-dive",
    "deeper dive 2-6 hours": "deeper-dive",
    "deeper-dive": "deeper-dive",
    "b": "deeper-dive",
    "experiment c": "hands-on",
    "hands on": "hands-on",
    "hands-on trial": "hands-on",
    "hands-on": "hands-on",
    "c": "hands-on",
    "experiment d": "job-board",
    "job board": "job-board",
    "job board scan real roles": "job-board",
    "job board scan": "job-board",
    "job board scan real jobs": "job-board",
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


def match_bucket_heading(text: str) -> Optional[str]:
    normalized_text = normalize(text)
    for heading, bucket in BUCKET_HEADING_ALIASES.items():
        if heading in normalized_text:
            return bucket
    return None


def detect_bucket_marker(text: str) -> Optional[str]:
    experiment_key = match_experiment_marker(text)
    if experiment_key:
        return EXPERIMENT_BUCKETS.get(experiment_key)
    return match_bucket_heading(text)


def extract_focus_area_name(paragraphs: List[str], default_name: Optional[str] = None) -> tuple[str, List[str]]:
    for idx, para in enumerate(paragraphs):
        match = re.search(r"(focus|cause)\s+area\s*:\s*(.+)", para, flags=re.IGNORECASE)
        if match:
            name = match.group(2).strip().strip(":").strip()
            remaining = paragraphs[idx + 1 :]
            return name, remaining
    if default_name:
        return default_name, paragraphs
    raise ValueError("Unable to find 'Focus area:' or 'Cause area:' line in focus area doc")


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


def split_focus_area_sections(paragraphs: List[str], filename_slug: str) -> FocusAreaContent:
    fallback_name = re.sub(r"[-_]+", " ", filename_slug).strip().title()
    name, body = extract_focus_area_name(paragraphs, default_name=fallback_name or filename_slug)
    slug = slugify(filename_slug)

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

        bucket_key = detect_bucket_marker(para)
        if bucket_key:
            current_bucket = bucket_key
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
        bucket_value = " ".join(collected_lines.get("bucket", []))
        type_value = bucket_value or " ".join(collected_lines.get("type", []))
        type_tag = map_type(type_value)
        commitment = map_commitment(" ".join(collected_lines.get("commitment", [])))
        good_fit_raw = " ".join(collected_lines.get("fit gate", []))
        good_fit_if = [item.strip() for item in re.split(r"[;•\n]", good_fit_raw) if item.strip()] or [
            "Good fit details provided in focus area doc."
        ]
        first_step_lines = (
            collected_lines.get("toe in the water", [])
            or collected_lines.get("best toe in the water step", [])
            or collected_lines.get("first small step 60 min", [])
        )
        first_step = " ".join(first_step_lines).strip()
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
    existing_cards = load_existing_json(PUBLIC_DATA_DIR / "cards.json", PUBLIC_CONTENT_ROOT / "cards.json")

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
        "overviewPath": str(PUBLIC_MD_PREFIX / "focus-areas" / content.slug / "overview.md"),
        "overviewExcerpt": overview_excerpt,
        "roleShapes": non_empty_list(content.role_shapes, "See overview for key role shapes."),
        "fitSignals": non_empty_list(content.fit_signals, "Use discovery questions in the overview."),
        "buckets": {
            "quickTaste": {
                "title": bucket_titles["quickTaste"],
                "description": bucket_summaries.get("quickTaste", "See inline guidance for quick taste ideas."),
                "cardIds": bucket_card_ids["quickTaste"],
                "inlineGuidancePath": str(
                    PUBLIC_MD_PREFIX / "focus-areas" / content.slug / "buckets" / bucket_filenames["quickTaste"]
                ),
            },
            "deeperDive": {
                "title": bucket_titles["deeperDive"],
                "description": bucket_summaries.get("deeperDive", "See inline guidance for deeper dives."),
                "cardIds": bucket_card_ids["deeperDive"],
                "inlineGuidancePath": str(
                    PUBLIC_MD_PREFIX / "focus-areas" / content.slug / "buckets" / bucket_filenames["deeperDive"]
                ),
            },
            "handsOn": {
                "title": bucket_titles["handsOn"],
                "description": bucket_summaries.get("handsOn", "See inline guidance for hands-on options."),
                "cardIds": bucket_card_ids["handsOn"],
                "inlineGuidancePath": str(
                    PUBLIC_MD_PREFIX / "focus-areas" / content.slug / "buckets" / bucket_filenames["handsOn"]
                ),
            },
            "jobBoard": {
                "title": bucket_titles["jobBoard"],
                "description": bucket_summaries.get("jobBoard", "See inline guidance for job-board scans."),
                "cardIds": bucket_card_ids["jobBoard"],
                "inlineGuidancePath": str(
                    PUBLIC_MD_PREFIX / "focus-areas" / content.slug / "buckets" / bucket_filenames["jobBoard"]
                ),
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
        focus_content = split_focus_area_sections(paragraphs, filename_slug=doc_path.stem)
        focus_contents.append(focus_content)
        parsed_cards.extend(focus_content.cards)

    if not focus_contents:
        CARDS_JSON_PATH.write_text("[]\n", encoding="utf-8")
        FOCUS_AREAS_JSON_PATH.write_text("[]\n", encoding="utf-8")
        return []

    updated_cards = update_cards_json(parsed_cards)

    focus_manifest_entries: List[dict] = []
    for focus_content in focus_contents:
        focus_cards = [card for card in updated_cards if focus_content.slug in card.get("focusAreaIds", [])]
        focus_manifest_entries.append(build_focus_area_manifest(focus_content, focus_cards))

    existing_focus = load_existing_json(PUBLIC_DATA_DIR / "focus-areas.json", PUBLIC_CONTENT_ROOT / "focus-areas.json")
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
    reset_generated_outputs()
    ingest_core()
    ingest_focus_area_docs()
    sync_generated_to_public()


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
