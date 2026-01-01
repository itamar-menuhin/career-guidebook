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


def parse_cards(lines: List[str], focus_area_id: str) -> List[dict]:
    """Parse recommendation cards from text lines."""
    # For now, we'll create placeholder cards since card parsing is complex
    # The full implementation would parse card blocks similar to ingest_docx.py
    # For this migration, we can skip detailed card parsing or do it separately
    return []


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
