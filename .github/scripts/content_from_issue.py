import json
import os
from pathlib import Path

ISSUE_BODY = os.environ.get("ISSUE_BODY", "")
ISSUE_LABELS = os.environ.get("ISSUE_LABELS", "")

ROOT = Path(".")

LABEL_TO_FILE = {
    "event": ROOT / "events.json",
    "event_en": ROOT / "events_en.json",
    "post": ROOT / "posts.json",
    "post_en": ROOT / "posts_en.json",
}

def detect_target_file():
    labels = [x.strip().lower() for x in ISSUE_LABELS.split(",") if x.strip()]
    for label, path in LABEL_TO_FILE.items():
        if label in labels:
            return label, path
    raise SystemExit(f"No supported label found on issue. Got: {labels}")

def parse_issue_form(body: str):
    result = {}
    current_key = None
    current_value = []

    for line in body.splitlines():
        if line.startswith("### "):
            if current_key is not None:
                result[current_key] = "\n".join(current_value).strip()
            current_key = line[4:].strip()
            current_value = []
        else:
            current_value.append(line)

    if current_key is not None:
        result[current_key] = "\n".join(current_value).strip()

    return result

def to_bool(value: str):
    return str(value).strip().lower() == "true"

def normalize_value(key: str, value: str):
    if value in ("", "_No response_"):
        return None
    if key in {"actual", "past", "important"}:
        return to_bool(value)
    return value

def load_json(path: Path):
    if not path.exists():
        return []
    text = path.read_text(encoding="utf-8").strip()
    if not text:
        return []
    return json.loads(text)

def save_json(path: Path, data):
    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

def upsert_item(items, new_item):
    item_id = new_item.get("id")
    if not item_id:
        raise SystemExit("Missing required field: id")

    for i, item in enumerate(items):
        if isinstance(item, dict) and item.get("id") == item_id:
            items[i] = {**item, **new_item}
            return items

    items.append(new_item)
    return items

def build_event_item(raw):
    item = {}
    expected_keys = ["id", "date", "actual", "past", "title", "flyer", "alt", "short", "long"]

    for key in expected_keys:
        if key in raw:
            value = normalize_value(key, raw[key])
            if value is not None:
                item[key] = value

    return item

def build_post_item(raw):
    item = {}
    expected_keys = ["id", "date", "important", "title", "image", "alt", "short", "long"]

    for key in expected_keys:
        if key in raw:
            value = normalize_value(key, raw[key])
            if value is not None:
                item[key] = value

    return item

def main():
    label, target_file = detect_target_file()
    raw = parse_issue_form(ISSUE_BODY)

    if label in {"event", "event_en"}:
        item = build_event_item(raw)
    elif label in {"post", "post_en"}:
        item = build_post_item(raw)
    else:
        raise SystemExit(f"Unsupported label: {label}")

    items = load_json(target_file)
    if not isinstance(items, list):
        raise SystemExit(f"{target_file} must contain a JSON array.")

    updated = upsert_item(items, item)
    save_json(target_file, updated)

    print(f"Updated {target_file}")

if __name__ == "__main__":
    main()
