#!/usr/bin/env python3
"""
One-time DOCX → Vault migration script.

This script reads DOCX files from source_docs/ and creates properly formatted
Obsidian vault markdown files with YAML frontmatter.

After this migration runs successfully, the vault becomes the source of truth.
Future content edits should be made directly in the vault markdown files.

Usage:
    python3 scripts/migrateDocxToVault.py [--dry-run]
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional

try:
    from docx import Document
    import yaml
except ImportError:
    print("Required packages missing. Install with:", file=sys.stderr)
    print("  pip install python-docx pyyaml", file=sys.stderr)
    sys.exit(1)


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DOCS = ROOT / "source_docs"
SOURCE_CORE = SOURCE_DOCS / "core" / "1_1_career_counselling_guidebook.docx"
SOURCE_FOCUS_ROOT = SOURCE_DOCS / "focus_areas"
VAULT_ROOT = ROOT / "vault"


def slugify(value: str) -> str:
    """Convert text to a URL-safe slug."""
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower()
    return re.sub(r"-{2,}", "-", cleaned)


def normalize(text: str) -> str:
    """Normalize text for comparison."""
    return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()


def paragraph_text(doc_path: Path) -> List[str]:
    """Extract all paragraph text from a DOCX file."""
    document = Document(doc_path)
    return [p.text.strip() for p in document.paragraphs if p.text and p.text.strip()]


def write_vault_markdown(path: Path, frontmatter: dict, body: str):
    """Write a vault markdown file with YAML frontmatter."""
    path.parent.mkdir(parents=True, exist_ok=True)
    
    # Convert frontmatter to YAML
    yaml_text = yaml.dump(frontmatter, allow_unicode=True, default_flow_style=False, sort_keys=False)
    
    # Ensure body ends with single newline
    body_normalized = body.strip()
    if body_normalized:
        body_normalized += "\n"
    
    # Write file with frontmatter
    content = f"---\n{yaml_text}---\n\n{body_normalized}"
    path.write_text(content, encoding="utf-8")
    print(f"  ✓ Created {path.relative_to(VAULT_ROOT)}")


# --- Core guidebook parsing (Flow steps and Templates) ---

CORE_FLOW_MARKERS = [
    ("opening", ["opening & goal"]),
    ("background", ["chapter 1", "what they bring"]),
    ("happiness", ["chapter 2", "what would make them happy"]),
    ("constraints", ["chapter 3", "constraints"]),
    ("directions", ["iterative direction testing"]),
    ("wrap", ["wrap + written summary template"]),
]

FLOW_STEP_TITLES = {
    "opening": "Opening & goal",
    "background": "What they bring",
    "happiness": "What makes them happy",
    "constraints": "Constraints",
    "directions": "Iterative direction testing",
    "wrap": "Wrap & commitments",
}


def find_marker_indices(paragraphs: List[str], marker_sets: List[tuple[str, List[str]]]) -> dict[str, int]:
    """Find the indices of marker paragraphs in the content."""
    indices: dict[str, int] = {}
    for idx, para in enumerate(paragraphs):
        normalized = normalize(para)
        for key, markers in marker_sets:
            if key in indices:
                continue
            if any(normalize(m) in normalized for m in markers):
                indices[key] = idx
    missing = [k for k, _ in marker_sets if k not in indices]
    if missing:
        raise ValueError(f"Missing expected sections in core guidebook: {', '.join(missing)}")
    return indices


def extract_sections(paragraphs: List[str], markers: List[tuple[str, List[str]]]) -> dict[str, List[str]]:
    """Extract sections from paragraphs based on markers."""
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


def migrate_flow_steps(dry_run: bool = False):
    """Migrate flow steps from core DOCX to vault."""
    print("\n📋 Migrating Flow Steps...")
    
    if not SOURCE_CORE.exists():
        print(f"  ⚠ Core guidebook not found at {SOURCE_CORE}")
        return
    
    paragraphs = paragraph_text(SOURCE_CORE)
    flow_sections = extract_sections(paragraphs, CORE_FLOW_MARKERS)
    
    flow_dir = VAULT_ROOT / "01_Flow"
    
    for order, (flow_id, _) in enumerate(CORE_FLOW_MARKERS, start=1):
        section_paras = flow_sections[flow_id]
        
        # Join paragraphs into markdown body, preserving structure
        body_lines = []
        for para in section_paras:
            para = para.strip()
            if not para:
                continue
            
            # Detect if this looks like a heading (short, no punctuation at end)
            if len(para) < 60 and not para.endswith(('.', '!', '?', ':')):
                # Treat as heading
                body_lines.append(f"## {para}")
            elif para.startswith(('-', '•', '▪')):
                # Bullet point
                cleaned = re.sub(r'^[\-\u2022•▪]+\s*', '', para)
                body_lines.append(f"- {cleaned}")
            else:
                # Regular paragraph
                body_lines.append(para)
            
            body_lines.append("")  # Blank line after each element
        
        body = "\n".join(body_lines).strip()
        
        frontmatter = {
            "kind": "flow_step",
            "id": flow_id,
            "title": FLOW_STEP_TITLES[flow_id],
            "order": order,
        }
        
        vault_path = flow_dir / f"{flow_id}.md"
        
        if dry_run:
            print(f"  [DRY RUN] Would create {vault_path.relative_to(VAULT_ROOT)}")
        else:
            write_vault_markdown(vault_path, frontmatter, body)


# --- Focus area parsing ---

EXPERIMENT_BUCKETS = {
    "a": "quick-taste",
    "b": "deeper-dive",
    "c": "hands-on",
    "d": "job-board",
}

BUCKET_HEADING_ALIASES = {
    normalize("Quick taste (≈1 hour)"): "quick-taste",
    normalize("Deeper dive (2–6 hours)"): "deeper-dive",
    normalize("Hands-on trial"): "hands-on",
    normalize("Job board scan (real roles)"): "job-board",
}


def match_experiment_marker(text: str) -> Optional[str]:
    """Match experiment A/B/C/D markers."""
    match = re.match(r"experiment\s*([abcd])", normalize(text))
    if match:
        return match.group(1).lower()
    return None


def match_bucket_heading(text: str) -> Optional[str]:
    """Match bucket headings."""
    normalized_text = normalize(text)
    for heading, bucket in BUCKET_HEADING_ALIASES.items():
        if heading in normalized_text:
            return bucket
    return None


def detect_bucket_marker(text: str) -> Optional[str]:
    """Detect bucket markers in text."""
    experiment_key = match_experiment_marker(text)
    if experiment_key:
        return EXPERIMENT_BUCKETS.get(experiment_key)
    return match_bucket_heading(text)


def extract_focus_area_name(paragraphs: List[str], default_name: str) -> tuple[str, List[str]]:
    """Extract focus area name from paragraphs."""
    for idx, para in enumerate(paragraphs):
        match = re.search(r"(focus|cause)\s+area\s*:\s*(.+)", para, flags=re.IGNORECASE)
        if match:
            name = match.group(2).strip().strip(":").strip()
            remaining = paragraphs[idx + 1:]
            return name, remaining
    return default_name, paragraphs


@dataclass
class FocusAreaContent:
    """Parsed focus area content."""
    name: str
    slug: str
    overview_paragraphs: List[str]
    role_shapes: List[str]
    fit_signals: List[str]
    people_to_talk_to: List[str]
    common_confusions: List[str]
    bucket_paragraphs: dict[str, List[str]]
    cards: List[dict]


def list_from_paragraphs(paragraphs: List[str]) -> List[str]:
    """Extract list items from paragraphs."""
    items: List[str] = []
    for para in paragraphs:
        for part in re.split(r"[\n\r]+", para):
            cleaned = part.strip()
            # Remove bullet markers
            cleaned = re.sub(r"^[\-\u2022•▪]+\s*", "", cleaned)
            if cleaned:
                items.append(cleaned)
    return items


def parse_focus_area_docx(doc_path: Path) -> FocusAreaContent:
    """Parse a focus area DOCX file."""
    filename_slug = doc_path.stem.replace("1_1_career_counselling_guidebook_", "").replace("_", "-")
    fallback_name = re.sub(r"[-_]+", " ", filename_slug).strip().title()
    
    paragraphs = paragraph_text(doc_path)
    name, body = extract_focus_area_name(paragraphs, default_name=fallback_name)
    slug = slugify(filename_slug)
    
    overview: List[str] = []
    role_shapes: List[str] = []
    fit_signals: List[str] = []
    people_to_talk_to: List[str] = []
    common_confusions: List[str] = []
    bucket_content: dict[str, List[str]] = {
        "quick-taste": [],
        "deeper-dive": [],
        "hands-on": [],
        "job-board": [],
    }
    card_lines: List[str] = []
    
    current_bucket: Optional[str] = None
    in_cards = False
    in_experiments = False
    current_section: Optional[str] = None
    
    section_markers = {
        "role shapes": "role_shapes",
        "what kinds of work exist here": "role_shapes",
        "fit signals": "fit_signals",
        "what good fit often looks like": "fit_signals",
        "people to talk to prompts": "people_to_talk_to",
        "common confusions": "common_confusions",
        "recommendation cards": "cards",
    }
    
    for para in body:
        normalized_para = normalize(para)
        
        # Detect numbered section 3 (fit signals) if not already in experiments
        if not in_experiments and re.search(r'3\s*\)\s*what.*good.*fit', normalized_para):
            current_section = "fit_signals"
            current_bucket = None
            continue
        
        # Detect if we're entering the experiments/buckets section (section 4)
        if re.search(r'4\s*\)\s*experiment', normalized_para):
            in_experiments = True
            current_section = None
            continue
        
        # Check for bucket markers (Experiment A, B, C, D)
        if in_experiments:
            bucket_key = detect_bucket_marker(para)
            if bucket_key:
                current_bucket = bucket_key
                in_cards = False
                current_section = None
                continue
        
        # Check for section markers
        matched_section = None
        for marker, section_key in section_markers.items():
            if marker in normalized_para:
                matched_section = section_key
                break
        if matched_section:
            current_bucket = None
            current_section = matched_section
            in_cards = matched_section == "cards"
            in_experiments = False
            continue
        
        # Accumulate content
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
        
        # If we haven't hit experiments yet, it's overview
        if not in_experiments:
            overview.append(para)
    
    # Parse cards
    cards = parse_cards(card_lines, slug)
    
    return FocusAreaContent(
        name=name,
        slug=slug,
        overview_paragraphs=overview,
        role_shapes=list_from_paragraphs(role_shapes),
        fit_signals=list_from_paragraphs(fit_signals),
        people_to_talk_to=list_from_paragraphs(people_to_talk_to),
        common_confusions=list_from_paragraphs(common_confusions),
        bucket_paragraphs=bucket_content,
        cards=cards,
    )


def split_card_blocks(lines: List[str]) -> List[List[str]]:
    """Split card lines into individual card blocks."""
    blocks: List[List[str]] = []
    current: List[str] = []
    for line in lines:
        # Match "Card N —" or "Card N -" etc.
        if re.match(r"card\s+\d+", normalize(line)):
            if current:
                blocks.append(current)
                current = []
            # Include the card header line in the block for title extraction
            current.append(line)
            continue
        current.append(line)
    if current:
        blocks.append(current)
    return blocks


def parse_card_title_from_header(header_line: str) -> Optional[str]:
    """Extract title from 'Card N — Title' format."""
    # Match patterns like "Card 1 — Title" or "Card 1 - Title"
    match = re.search(r"card\s+\d+\s*[—\-–]\s*(.+)", header_line, flags=re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return None


def parse_cards(lines: List[str], focus_area_id: str) -> List[dict]:
    """Parse recommendation cards from text lines."""
    from collections import defaultdict
    
    # First, split any lines that contain newlines (from DOCX soft breaks)
    expanded_lines = []
    for line in lines:
        if '\n' in line:
            expanded_lines.extend(line.split('\n'))
        else:
            expanded_lines.append(line)
    
    lines = expanded_lines
    
    # Mapping constants similar to ingest_docx.py
    TOPIC_MAP = {
        "reading": "reading", "program": "program", "project": "project",
        "course": "course", "community": "community", "job board": "job-board",
        "job-board": "job-board", "org list": "org-list", "org-list": "org-list",
        "research": "research", "tool": "tool", "person": "person", "ai": "reading",
    }
    
    BUCKET_MAP = {
        "a": "quick-taste", "experiment a": "quick-taste", "quick taste": "quick-taste",
        "b": "deeper-dive", "experiment b": "deeper-dive", "deeper dive": "deeper-dive",
        "c": "hands-on", "experiment c": "hands-on", "hands on": "hands-on",
        "d": "job-board", "experiment d": "job-board", "job board": "job-board",
    }
    
    COMMITMENT_MAP = {
        "low": "low", "tiny": "low", "light": "low",
        "medium": "medium", "med": "medium", "moderate": "medium",
        "high": "high", "heavy": "high",
    }
    
    def map_field(value: str, field_map: dict, default: str) -> str:
        """Map a value using a field map."""
        if not value:
            return default
        norm = normalize(value)
        for key, mapped in field_map.items():
            if key in norm:
                return mapped
        return field_map.get(norm, default)
    
    def parse_links(text_lines: List[str]) -> List[str]:
        """Extract URLs from text lines."""
        links = []
        for line in text_lines:
            urls = re.findall(r"https?://\S+", line)
            links.extend(urls)
        return links
    
    cards: List[dict] = []
    for block in split_card_blocks(lines):
        if not block:
            continue
        
        # Try to extract title from first line if it's a card header
        card_title = None
        card_lines = block
        if block and re.match(r"card\s+\d+", normalize(block[0])):
            card_title = parse_card_title_from_header(block[0])
            card_lines = block[1:]  # Skip the header line
        
        # Parse fields from remaining lines
        current_field = None
        collected_lines: dict[str, List[str]] = defaultdict(list)
        
        for raw_line in card_lines:
            line = raw_line.strip()
            if not line:
                continue
            
            # Skip URLs that look like fields (start with https:)
            if line.startswith(('http://', 'https://')):
                if current_field:
                    collected_lines[current_field].append(line)
                continue
            
            # Try to match field pattern "Field name: value" or "Field name:"
            # Field labels are typically short (< 100 chars) and at start of line
            # Content lines with colons in the middle (like "do this: result") should not be treated as fields
            field_match = re.match(r"^(.{1,100}?):\s*(.*)$", line)
            if field_match:
                potential_field = field_match.group(1)
                value = field_match.group(2).strip()
                
                # Action verbs at start indicate content, not field labels
                action_verbs = ['watch', 'read', 'browse', 'skim', 'review', 'check', 'pick', 'join', 
                               'apply', 'write', 'note', 'complete', 'do', 'take', 'attend', 'scan']
                first_word = potential_field.split()[0].lower() if potential_field.split() else ''
                
                # Check if this looks like a field label (relatively short, doesn't start with action verb)
                # Field labels are typically title-case or all-caps
                is_likely_field = (
                    len(potential_field) < 80 and
                    first_word not in action_verbs and
                    (not potential_field[0].islower() or 
                     potential_field.startswith(('Best', 'First', 'Next', 'When', 'Topic', 'Type', 
                                                'Commitment', 'Fit', 'One-', 'Recommendation')))
                )
                
                if is_likely_field:
                    field_label = normalize(potential_field)
                    current_field = field_label
                    if value:
                        collected_lines[current_field].append(value)
                    continue
            
            # If we have a current field, add this line to it
            if current_field:
                collected_lines[current_field].append(line)
        
        # Extract card data from collected fields
        title = card_title or " ".join(collected_lines.get("recommendation name", [])).strip()
        if not title:
            # Try to find title in first few lines
            for line in card_lines[:5]:
                if line.strip() and not re.match(r"^[A-Za-z ]+:", line):
                    title = line.strip()[:100]
                    break
        
        one_liner = " ".join(collected_lines.get("one line pitch", [])).strip()
        when_to_suggest = " ".join(
            collected_lines.get("when to suggest", []) +
            collected_lines.get("when to suggest trigger criteria", [])
        ).strip()
        when_not_to = " ".join(collected_lines.get("when not to", [])).strip()
        
        topic_raw = " ".join(collected_lines.get("topic", []))
        topic = map_field(topic_raw, TOPIC_MAP, "reading")
        
        # Bucket can be in "Bucket:" or "Fits Experiment:" or "Type:" fields
        bucket_raw = " ".join(
            collected_lines.get("bucket", []) + 
            collected_lines.get("fits experiment", []) + 
            collected_lines.get("type", [])
        )
        bucket = map_field(bucket_raw, BUCKET_MAP, "quick-taste")
        
        commitment_raw = " ".join(collected_lines.get("commitment", []))
        commitment = map_field(commitment_raw, COMMITMENT_MAP, "low")
        
        # Fit gate / Good fit if
        good_fit_raw = " ".join(
            collected_lines.get("fit gate", []) +
            collected_lines.get("good fit if", [])
        )
        good_fit_if = [item.strip() for item in re.split(r"[;•\n]", good_fit_raw) if item.strip()]
        if not good_fit_if:
            good_fit_if = []
        
        # First step - multiple possible field names
        first_step = " ".join(
            collected_lines.get("best toe in the water next step 60 min", []) +
            collected_lines.get("toe in the water", []) +
            collected_lines.get("first small step 60 min", []) +
            collected_lines.get("best next step 60 min", []) +
            collected_lines.get("first small step", [])
        ).strip()
        
        next_step = " ".join(collected_lines.get("next step", [])).strip()
        
        # Resources / links
        resource_lines = (
            collected_lines.get("resources links to support the next steps", []) +
            collected_lines.get("resources links", []) +
            collected_lines.get("resources / links", [])
        )
        links = parse_links(resource_lines)
        
        # Internal notes
        internal_notes = " ".join(
            collected_lines.get("notes your internal", []) +
            collected_lines.get("internal notes", [])
        ).strip()
        
        if not title or title == "Untitled recommendation":
            # Skip cards without valid titles
            continue
        
        # Create card ID from title
        card_id = slugify(title)
        
        cards.append({
            "id": card_id,
            "title": title,
            "one_liner": one_liner,
            "when_to_suggest": when_to_suggest,
            "when_not_to_suggest": when_not_to,
            "topic": topic,
            "bucket": bucket,
            "commitment": commitment,
            "good_fit_if": good_fit_if,
            "first_small_step": first_step,
            "next_step": next_step,
            "links": links,
            "internal_notes": internal_notes,
            "focus_area_id": focus_area_id,
        })
    
    return cards


def paragraphs_to_markdown(paragraphs: List[str]) -> str:
    """Convert paragraphs to markdown, preserving structure."""
    body_lines = []
    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
        
        # Check if it's a numbered heading (e.g., "1) What it's trying to achieve")
        if re.match(r'^\d+\)\s+.+', para):
            # Remove the number and treat as heading
            cleaned = re.sub(r'^\d+\)\s+', '', para)
            body_lines.append(f"## {cleaned}")
        # Detect other headings (short lines without ending punctuation, but not bullets)
        elif len(para) < 80 and not para.endswith(('.', '!', '?', ':')) and not para.startswith(('-', '•', '▪')):
            body_lines.append(f"## {para}")
        elif para.startswith(('-', '•', '▪')):
            # Bullet point
            cleaned = re.sub(r'^[\-\u2022•▪]+\s*', '', para)
            body_lines.append(f"- {cleaned}")
        else:
            # Regular paragraph
            body_lines.append(para)
        
        body_lines.append("")
    
    return "\n".join(body_lines).strip()


def migrate_focus_areas(dry_run: bool = False):
    """Migrate focus areas from DOCX to vault."""
    print("\n🎯 Migrating Focus Areas...")
    
    focus_area_docs = sorted(SOURCE_FOCUS_ROOT.glob("*.docx"))
    
    if not focus_area_docs:
        print("  ⚠ No focus area DOCX files found")
        return
    
    for doc_path in focus_area_docs:
        print(f"\n  Processing {doc_path.name}...")
        
        try:
            content = parse_focus_area_docx(doc_path)
            
            # Create focus area directory
            area_dir = VAULT_ROOT / "02_Focus-Areas" / content.slug
            
            # Write overview
            overview_body = paragraphs_to_markdown(content.overview_paragraphs)
            overview_frontmatter = {
                "kind": "focus_area",
                "id": content.slug,
                "title": content.name,
                "summary": content.overview_paragraphs[0] if content.overview_paragraphs else "",
                "role_shapes": content.role_shapes,
                "fit_signals": content.fit_signals,
                "people_to_talk_to": content.people_to_talk_to,
                "common_confusions": content.common_confusions,
            }
            
            overview_path = area_dir / "overview.md"
            if dry_run:
                print(f"    [DRY RUN] Would create {overview_path.relative_to(VAULT_ROOT)}")
            else:
                write_vault_markdown(overview_path, overview_frontmatter, overview_body)
            
            # Write buckets
            bucket_dir = area_dir / "buckets"
            bucket_titles = {
                "quick-taste": "Quick taste (≈1 hour)",
                "deeper-dive": "Deeper dive (2–6 hours)",
                "hands-on": "Hands-on trial",
                "job-board": "Job board scan (real roles)",
            }
            
            for bucket_key, bucket_title in bucket_titles.items():
                bucket_body = paragraphs_to_markdown(content.bucket_paragraphs.get(bucket_key, []))
                
                # If no content, provide a placeholder
                if not bucket_body:
                    bucket_body = f"Guidance for {bucket_title.lower()} coming soon."
                
                bucket_frontmatter = {
                    "kind": "focus_area_bucket",
                    "focus_area_id": content.slug,
                    "bucket": bucket_key,
                    "title": bucket_title,
                    "curated_cards": [],
                }
                
                bucket_path = bucket_dir / f"{bucket_key}.md"
                if dry_run:
                    print(f"    [DRY RUN] Would create {bucket_path.relative_to(VAULT_ROOT)}")
                else:
                    write_vault_markdown(bucket_path, bucket_frontmatter, bucket_body)
            
            # Write cards
            if content.cards:
                cards_dir = VAULT_ROOT / "03_Cards" / content.slug
                print(f"    Writing {len(content.cards)} cards...")
                
                for card in content.cards:
                    # Build card body from fields
                    body_parts = []
                    
                    if card.get("one_liner"):
                        body_parts.append(f"## One-line pitch\n\n{card['one_liner']}")
                    
                    if card.get("when_to_suggest"):
                        body_parts.append(f"## When to suggest\n\n{card['when_to_suggest']}")
                    
                    if card.get("when_not_to_suggest"):
                        body_parts.append(f"## When not to\n\n{card['when_not_to_suggest']}")
                    
                    if card.get("first_small_step"):
                        body_parts.append(f"## First small step\n\n{card['first_small_step']}")
                    
                    if card.get("next_step"):
                        body_parts.append(f"## Next step\n\n{card['next_step']}")
                    
                    if card.get("links"):
                        links_section = "## Resources / Links\n\n"
                        for link in card['links']:
                            links_section += f"- {link}\n"
                        body_parts.append(links_section.strip())
                    
                    if card.get("internal_notes"):
                        body_parts.append(f"## Internal notes\n\n{card['internal_notes']}")
                    
                    card_body = "\n\n".join(body_parts)
                    
                    # Build frontmatter
                    card_frontmatter = {
                        "kind": "card",
                        "id": card["id"],
                        "title": card["title"],
                        "focus_area_id": card["focus_area_id"],
                        "bucket": card["bucket"],
                    }
                    
                    # Add optional fields if present
                    if card.get("topic"):
                        card_frontmatter["topic"] = card["topic"]
                    if card.get("commitment"):
                        card_frontmatter["commitment"] = card["commitment"]
                    if card.get("good_fit_if"):
                        card_frontmatter["good_fit_if"] = card["good_fit_if"]
                    if card.get("first_small_step"):
                        card_frontmatter["first_small_step"] = card["first_small_step"]
                    if card.get("next_step"):
                        card_frontmatter["next_step"] = card.get("next_step")
                    if card.get("one_liner"):
                        card_frontmatter["one_liner"] = card["one_liner"]
                    if card.get("when_to_suggest"):
                        card_frontmatter["when_to_suggest"] = card["when_to_suggest"]
                    if card.get("when_not_to_suggest"):
                        card_frontmatter["when_not_to_suggest"] = card["when_not_to_suggest"]
                    if card.get("links"):
                        card_frontmatter["links"] = card["links"]
                    if card.get("internal_notes"):
                        card_frontmatter["internal_notes"] = card["internal_notes"]
                    
                    card_path = cards_dir / f"{card['id']}.md"
                    if dry_run:
                        print(f"      [DRY RUN] Would create {card_path.relative_to(VAULT_ROOT)}")
                    else:
                        write_vault_markdown(card_path, card_frontmatter, card_body)
                
                print(f"    ✓ Wrote {len(content.cards)} cards")
            else:
                print(f"    ⚠ No cards found in {doc_path.name}")
            
            print(f"  ✓ Migrated focus area: {content.name}")
            
        except Exception as e:
            print(f"  ✗ Error processing {doc_path.name}: {e}")
            if not dry_run:
                raise


def main():
    """Main migration entry point."""
    parser = argparse.ArgumentParser(description="Migrate DOCX content to Obsidian vault")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be created without creating files")
    args = parser.parse_args()
    
    print("=" * 60)
    print("DOCX → Vault Migration")
    print("=" * 60)
    
    if args.dry_run:
        print("\n⚠️  DRY RUN MODE - No files will be created\n")
    
    try:
        migrate_flow_steps(dry_run=args.dry_run)
        migrate_focus_areas(dry_run=args.dry_run)
        
        print("\n" + "=" * 60)
        if args.dry_run:
            print("✓ Dry run complete")
        else:
            print("✓ Migration complete!")
            print("\nNext steps:")
            print("  1. Review the migrated vault files")
            print("  2. Run: npm run build:vault")
            print("  3. Test the website")
            print("\nThe vault is now the source of truth.")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n✗ Migration failed: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
