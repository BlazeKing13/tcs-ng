import json
import os
from pathlib import Path

ISSUE_TITLE = os.environ.get("ISSUE_TITLE", "")
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
    labels = [x.strip() for x in ISSUE_LABELS.split(",") if x.strip()]
    for label, path in LABEL_TO_FILE.items():
        if label in labels:
            return label, path
    raise SystemExit("No supported label found on issue.")

def parse_issue_form(body: str):
    """
    GitHub issue forms arrive roughly like:

    ### Event ID
    lan-party-2026

    ### Naslov
    LAN Party

    ### Datum
    2026-04-12
    """
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

def normalize_key(key: str):
    mapping = {
        "Event ID": "id",
        "Post ID": "id",
        "Naslov": "title",
        "Title": "title",
        "Datum": "date",
        "Date": "date",
        "Slika": "image",
        "Image path": "image",
        "Opis": "description",
        "Description": "description",
        "Vsebina": "content",
        "Content": "content",
    }
    return mapping.get(key, key.lower().replace(" ", "_"))

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
    if "id" not in new_item or not new_item["id"]:
        raise SystemExit("Missing required field: id")

    for i, item in enumerate(items):
        if isinstance(item, dict) and item.get("id") == new_item["id"]:
            items[i] = {**item, **new_item}
            return items

    items.append(new_item)
    return items

def main():
    label, target_file = detect_target_file()
    raw = parse_issue_form(ISSUE_BODY)

    data = {}
    for key, value in raw.items():
        norm = normalize_key(key)
        if value not in ("", "_No response_"):
            data[norm] = value

    items = load_json(target_file)
    if not isinstance(items, list):
        raise SystemExit(f"{target_file} must contain a JSON array.")

    updated = upsert_item(items, data)
    save_json(target_file, updated)

    print(f"Updated {target_file} from label {label}")

if __name__ == "__main__":
    main()
