import json
import os
import re
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

import requests

try:
    import yt_dlp
except ImportError:
    yt_dlp = None

INSTAGRAM_USER = os.environ.get("INSTAGRAM_USERNAME", "iamb.synthmusic")
INSTAGRAM_USER_ID = os.environ.get("INSTAGRAM_USER_ID")
TIKTOK_USER = os.environ.get("TIKTOK_USERNAME", "iamb.synthmusic")
YOUTUBE_CHANNEL_ID = os.environ.get("YOUTUBE_CHANNEL_ID", "UCVV-a7quRaRVbh6bfrUVx4A")
SELECTED_CREATOR_ID = os.environ.get("CREATOR_ID", "").strip().lower()
MAX_ITEMS = int(os.environ.get("SOCIAL_FEED_LIMIT", "0"))
REQUEST_TIMEOUT = int(os.environ.get("SOCIAL_FEED_TIMEOUT", "20"))

CREATOR_CONFIG_PATH = Path(os.environ.get("CREATOR_CONFIG_PATH", "assets/creators.json"))
OUTPUT_PATH = Path("assets/social-feed.json")
IG_COVER_DIR = Path("assets/ig-covers")
TIKTOK_COVER_DIR = Path("assets/tiktok-covers")

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/123.0.0.0 Safari/537.36"
)
IG_APP_ID = "936619743392459"
YOUTUBE_RSS_URL = f"https://www.youtube.com/feeds/videos.xml?channel_id={YOUTUBE_CHANNEL_ID}" if YOUTUBE_CHANNEL_ID else ""

SESSION = requests.Session()
SESSION.headers.update({"User-Agent": USER_AGENT})

ATOM_NS = "http://www.w3.org/2005/Atom"
YT_NS = "http://www.youtube.com/xml/schemas/2015"
MEDIA_NS = "http://search.yahoo.com/mrss/"
NS = {"atom": ATOM_NS, "yt": YT_NS, "media": MEDIA_NS}


def log(message):
    print(message, flush=True)


def load_creator_jobs():
    if not CREATOR_CONFIG_PATH.exists():
        return [
            {
                "id": "default",
                "output_path": OUTPUT_PATH,
                "ig_cover_dir": IG_COVER_DIR,
                "tiktok_cover_dir": TIKTOK_COVER_DIR,
                "instagram_user": INSTAGRAM_USER,
                "instagram_user_id": INSTAGRAM_USER_ID,
                "tiktok_user": TIKTOK_USER,
                "youtube_channel_id": YOUTUBE_CHANNEL_ID,
            }
        ]

    try:
        data = json.loads(CREATOR_CONFIG_PATH.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return []

    creators = data.get("creators") if isinstance(data, dict) else None
    if not isinstance(creators, dict):
        return []

    jobs = []
    for creator_id, profile in creators.items():
        normalized_id = str(creator_id).strip().lower()
        if SELECTED_CREATOR_ID and normalized_id != SELECTED_CREATOR_ID:
            continue
        if not isinstance(profile, dict):
            continue

        feed = profile.get("feed") if isinstance(profile.get("feed"), dict) else {}
        output_path = Path(profile.get("socialFeedPath") or f"assets/social-feed-{normalized_id}.json")
        jobs.append(
            {
                "id": normalized_id,
                "output_path": output_path,
                "ig_cover_dir": Path(feed.get("instagramCoverDir") or ("assets/ig-covers" if normalized_id == "iamb" else f"assets/{normalized_id}-ig-covers")),
                "tiktok_cover_dir": Path(feed.get("tiktokCoverDir") or ("assets/tiktok-covers" if normalized_id == "iamb" else f"assets/{normalized_id}-tiktok-covers")),
                "instagram_user": feed.get("instagramUsername") or "",
                "instagram_user_id": feed.get("instagramUserId") or "",
                "tiktok_user": feed.get("tiktokUsername") or "",
                "youtube_channel_id": feed.get("youtubeChannelId") or "",
            }
        )

    return jobs


def configure_job(job):
    global OUTPUT_PATH, IG_COVER_DIR, TIKTOK_COVER_DIR
    global INSTAGRAM_USER, INSTAGRAM_USER_ID, TIKTOK_USER
    global YOUTUBE_CHANNEL_ID, YOUTUBE_RSS_URL

    OUTPUT_PATH = job["output_path"]
    IG_COVER_DIR = job["ig_cover_dir"]
    TIKTOK_COVER_DIR = job["tiktok_cover_dir"]
    INSTAGRAM_USER = job["instagram_user"]
    INSTAGRAM_USER_ID = job["instagram_user_id"]
    TIKTOK_USER = job["tiktok_user"]
    YOUTUBE_CHANNEL_ID = job["youtube_channel_id"]
    YOUTUBE_RSS_URL = (
        f"https://www.youtube.com/feeds/videos.xml?channel_id={YOUTUBE_CHANNEL_ID}"
        if YOUTUBE_CHANNEL_ID
        else ""
    )


def now_iso():
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def normalize_whitespace(text):
    return " ".join((text or "").split())


def truncate_text(text, max_length):
    clean = normalize_whitespace(text)
    if len(clean) <= max_length:
        return clean
    return clean[:max_length].rstrip() + "..."


def parse_timestamp_ms(value):
    if value is None:
        return 0
    if isinstance(value, (int, float)):
        return int(value) * 1000 if value < 10_000_000_000 else int(value)
    text = str(value).strip()
    if not text:
        return 0
    if text.isdigit():
        num = int(text)
        return num * 1000 if num < 10_000_000_000 else num
    try:
        parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
        return int(parsed.timestamp() * 1000)
    except ValueError:
        return 0


def is_limit_reached(items):
    return MAX_ITEMS > 0 and len(items) >= MAX_ITEMS


def limit_items(items):
    if MAX_ITEMS <= 0:
        return list(items)
    return list(items)[:MAX_ITEMS]


def fetch_json(url, headers=None):
    try:
        response = SESSION.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
        if response.status_code != 200:
            return None
        return response.json()
    except (requests.RequestException, ValueError):
        return None


def download_image(url, dest_path, headers=None):
    request_headers = {"User-Agent": USER_AGENT}
    if headers:
        request_headers.update(headers)
    try:
        response = SESSION.get(
            url,
            headers=request_headers,
            timeout=REQUEST_TIMEOUT,
            stream=True,
        )
    except requests.RequestException:
        return False

    if response.status_code != 200:
        return False
    if "image" not in (response.headers.get("Content-Type", "") or ""):
        return False

    dest_path.parent.mkdir(parents=True, exist_ok=True)
    with dest_path.open("wb") as handle:
        for chunk in response.iter_content(chunk_size=10240):
            if chunk:
                handle.write(chunk)
    return True


def normalize_item(item, source_fallback=""):
    if not isinstance(item, dict):
        return None
    source = (item.get("source") or source_fallback or "").lower().strip()
    url = (item.get("url") or item.get("link") or "").strip()
    thumbnail = (item.get("thumbnail") or item.get("image") or "").strip()
    if not url:
        return None
    title = normalize_whitespace(item.get("title") or item.get("caption") or "")
    description = normalize_whitespace(item.get("description") or item.get("caption") or "")
    published = parse_timestamp_ms(item.get("published") or item.get("timestamp"))
    return {
        "source": source,
        "url": url,
        "thumbnail": thumbnail,
        "title": title,
        "description": description,
        "published": published,
    }


def merge_items(*groups):
    seen = set()
    merged = []
    for group in groups:
        for raw in group or []:
            normalized = normalize_item(raw)
            if not normalized:
                continue
            key = normalized["url"]
            if key in seen:
                continue
            seen.add(key)
            merged.append(normalized)
    merged.sort(key=lambda item: item.get("published") or 0, reverse=True)
    return merged


def load_existing_payload(path):
    default_payload = {
        "generated_at": "",
        "youtube": [],
        "tiktok": [],
        "instagram": [],
        "items": [],
    }
    if not path.exists():
        return default_payload
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (ValueError, OSError):
        return default_payload
    if not isinstance(data, dict):
        return default_payload

    youtube = data.get("youtube") if isinstance(data.get("youtube"), list) else []
    tiktok = data.get("tiktok") if isinstance(data.get("tiktok"), list) else []
    instagram = data.get("instagram") if isinstance(data.get("instagram"), list) else []
    items = data.get("items") if isinstance(data.get("items"), list) else []

    # Backward compatibility: very old payloads stored merged data only in "items".
    if not youtube and items:
        youtube = [entry for entry in items if isinstance(entry, dict) and (entry.get("source") or "").lower() == "youtube"]
    if not tiktok and items:
        tiktok = [entry for entry in items if isinstance(entry, dict) and (entry.get("source") or "").lower() == "tiktok"]
    if not instagram and items:
        instagram = [entry for entry in items if isinstance(entry, dict) and (entry.get("source") or "").lower() == "instagram"]

    return {
        "generated_at": data.get("generated_at") or "",
        "youtube": youtube,
        "tiktok": tiktok,
        "instagram": instagram,
        "items": items,
    }


def fetch_youtube_items():
    if not YOUTUBE_RSS_URL:
        return []

    try:
        response = SESSION.get(YOUTUBE_RSS_URL, timeout=REQUEST_TIMEOUT)
    except requests.RequestException:
        return []

    if response.status_code != 200:
        return []

    try:
        root = ET.fromstring(response.text)
    except ET.ParseError:
        return []

    items = []
    for entry in root.findall("atom:entry", NS):
        title = normalize_whitespace(entry.findtext("atom:title", default="", namespaces=NS))
        video_id = entry.findtext("yt:videoId", default="", namespaces=NS).strip()
        link_el = entry.find("atom:link[@rel='alternate']", NS)
        url = link_el.attrib.get("href", "").strip() if link_el is not None else ""
        if not url and video_id:
            url = f"https://www.youtube.com/watch?v={video_id}"
        description = normalize_whitespace(
            entry.findtext("media:group/media:description", default="", namespaces=NS)
        )
        thumb_el = entry.find("media:group/media:thumbnail", NS)
        thumbnail = thumb_el.attrib.get("url", "").strip() if thumb_el is not None else ""
        if not thumbnail and video_id:
            thumbnail = f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
        published = parse_timestamp_ms(
            entry.findtext("atom:published", default="", namespaces=NS)
            or entry.findtext("atom:updated", default="", namespaces=NS)
        )

        if not url:
            continue

        items.append(
            {
                "source": "youtube",
                "url": url,
                "thumbnail": thumbnail,
                "title": title or "YouTube Upload",
                "description": description,
                "published": published,
            }
        )
        if is_limit_reached(items):
            break

    return items


def fetch_instagram_user_id():
    if not INSTAGRAM_USER:
        return None

    api_url = (
        "https://www.instagram.com/api/v1/users/web_profile_info/"
        f"?username={INSTAGRAM_USER}"
    )
    headers = {
        "User-Agent": USER_AGENT,
        "X-IG-App-ID": IG_APP_ID,
        "Referer": f"https://www.instagram.com/{INSTAGRAM_USER}/",
    }
    data = fetch_json(api_url, headers=headers)
    if not isinstance(data, dict):
        return None
    return data.get("data", {}).get("user", {}).get("id")


def get_instagram_cover_url(entry):
    if not isinstance(entry, dict):
        return None
    image_versions = entry.get("image_versions2")
    if isinstance(image_versions, dict):
        candidates = image_versions.get("candidates") or []
        if candidates:
            return candidates[0].get("url")
    return entry.get("thumbnail_url")


def normalize_instagram_item(entry):
    if not isinstance(entry, dict):
        return None

    shortcode = (entry.get("code") or entry.get("shortcode") or "").strip()
    if not shortcode:
        return None

    caption_text = ""
    if isinstance(entry.get("caption"), dict):
        caption_text = entry["caption"].get("text") or ""
    caption_text = normalize_whitespace(caption_text)

    cover_url = None
    if entry.get("media_type") == 8 and isinstance(entry.get("carousel_media"), list):
        first_media = entry["carousel_media"][0] if entry["carousel_media"] else {}
        cover_url = get_instagram_cover_url(first_media)
    if not cover_url:
        cover_url = get_instagram_cover_url(entry)
    if not cover_url:
        return None

    local_name = f"{shortcode}.jpg"
    local_path = IG_COVER_DIR / local_name
    if not local_path.exists():
        downloaded = download_image(
            cover_url,
            local_path,
            headers={"Referer": "https://www.instagram.com/"},
        )
        if not downloaded and local_path.exists():
            local_path.unlink(missing_ok=True)
    if not local_path.exists():
        return None

    published = parse_timestamp_ms(entry.get("taken_at") or entry.get("taken_at_timestamp"))
    return {
        "source": "instagram",
        "url": f"https://www.instagram.com/p/{shortcode}/",
        "thumbnail": f"assets/ig-covers/{local_name}",
        "title": truncate_text(caption_text, 60) if caption_text else "Instagram Post",
        "description": caption_text,
        "published": published,
    }


def fetch_instagram_items():
    user_id = INSTAGRAM_USER_ID or fetch_instagram_user_id()
    if not user_id:
        return None

    headers = {
        "User-Agent": USER_AGENT,
        "X-IG-App-ID": IG_APP_ID,
        "Referer": f"https://www.instagram.com/{INSTAGRAM_USER}/",
    }

    IG_COVER_DIR.mkdir(parents=True, exist_ok=True)
    items = []
    seen = set()
    max_id = None

    while True:
        url = f"https://www.instagram.com/api/v1/feed/user/{user_id}/?count=50"
        if max_id:
            url = f"{url}&max_id={max_id}"

        try:
            response = SESSION.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
        except requests.RequestException:
            return items if items else None
        if response.status_code != 200:
            return items if items else None

        try:
            data = response.json()
        except ValueError:
            return items if items else None

        for raw in data.get("items", []):
            normalized = normalize_instagram_item(raw)
            if not normalized:
                continue
            if normalized["url"] in seen:
                continue
            seen.add(normalized["url"])
            items.append(normalized)
            if is_limit_reached(items):
                break

        if is_limit_reached(items):
            break
        if not data.get("more_available"):
            break

        next_max_id = data.get("next_max_id")
        if not next_max_id:
            break
        max_id = next_max_id

    return items


def build_instagram_items_from_covers():
    if not IG_COVER_DIR.exists():
        return []
    items = []
    for cover in sorted(IG_COVER_DIR.glob("*.jpg")):
        shortcode = cover.stem.strip()
        if not shortcode:
            continue
        items.append(
            {
                "source": "instagram",
                "url": f"https://www.instagram.com/p/{shortcode}/",
                "thumbnail": f"assets/ig-covers/{cover.name}",
                "title": "Instagram Post",
                "description": "",
                "published": 0,
            }
        )
    return items


def pick_tiktok_thumbnail(entry):
    if not isinstance(entry, dict):
        return None
    if entry.get("thumbnail"):
        return entry.get("thumbnail")
    thumbnails = entry.get("thumbnails") or []
    if isinstance(thumbnails, list):
        for thumb_id in ("originCover", "cover", "dynamicCover"):
            for thumb in thumbnails:
                if thumb.get("id") == thumb_id and thumb.get("url"):
                    return thumb.get("url")
        for thumb in thumbnails:
            if thumb.get("url"):
                return thumb.get("url")
    return None


def canonical_tiktok_url(raw_url):
    if not raw_url:
        return ""
    clean = raw_url.split("?", 1)[0].strip()
    match = re.search(r"/video/(\d+)", clean)
    if not match:
        return clean
    video_id = match.group(1)
    user_match = re.search(r"/@([^/]+)/video/", clean)
    user = user_match.group(1) if user_match else TIKTOK_USER
    return f"https://www.tiktok.com/@{user}/video/{video_id}"


def fetch_tiktok_items():
    if yt_dlp is None or not TIKTOK_USER:
        return []

    profile_url = f"https://www.tiktok.com/@{TIKTOK_USER}"
    options = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "extract_flat": True,
    }
    if MAX_ITEMS > 0:
        options["playlistend"] = MAX_ITEMS

    try:
        with yt_dlp.YoutubeDL(options) as ydl:
            info = ydl.extract_info(profile_url, download=False)
    except Exception:
        return []

    entries = list(info.get("entries") or [])
    if not entries:
        return []

    TIKTOK_COVER_DIR.mkdir(parents=True, exist_ok=True)
    items = []
    seen = set()

    for entry in entries:
        raw_url = entry.get("url") or entry.get("webpage_url")
        url = canonical_tiktok_url(raw_url)
        if not url or url in seen:
            continue
        seen.add(url)

        cover_url = pick_tiktok_thumbnail(entry)
        if not cover_url:
            continue

        item_id = str(entry.get("id") or "")
        if not item_id:
            match = re.search(r"/video/(\d+)", url)
            item_id = match.group(1) if match else str(len(seen))

        local_name = f"{item_id}.jpg"
        local_path = TIKTOK_COVER_DIR / local_name
        if not local_path.exists():
            downloaded = download_image(
                cover_url,
                local_path,
                headers={"Referer": profile_url},
            )
            if not downloaded and local_path.exists():
                local_path.unlink(missing_ok=True)
        if not local_path.exists():
            continue

        description = normalize_whitespace(entry.get("description") or "")
        title_seed = description or normalize_whitespace(entry.get("title") or "")
        published = parse_timestamp_ms(entry.get("timestamp") or entry.get("release_timestamp"))

        items.append(
            {
                "source": "tiktok",
                "url": url,
                "thumbnail": f"assets/tiktok-covers/{local_name}",
                "title": truncate_text(title_seed, 60) if title_seed else "TikTok Video",
                "description": description,
                "published": published,
            }
        )

        if is_limit_reached(items):
            break

    return items


def validate_local_thumbnails(items):
    validated = []
    for item in items:
        normalized = normalize_item(item)
        if not normalized:
            continue
        thumb = normalized.get("thumbnail") or ""
        if thumb.startswith("assets/") and not Path(thumb).exists():
            continue
        validated.append(normalized)
    return validated


def update_current_feed(creator_id):
    existing = load_existing_payload(OUTPUT_PATH)

    manual_youtube = validate_local_thumbnails(existing.get("youtube") or [])
    manual_tiktok = validate_local_thumbnails(existing.get("tiktok") or [])
    manual_instagram = validate_local_thumbnails(existing.get("instagram") or [])

    youtube_items = fetch_youtube_items()
    if youtube_items:
        log(f"{creator_id}: YouTube items fetched: {len(youtube_items)}")
    else:
        youtube_items = manual_youtube
        log(f"{creator_id}: YouTube fetch unavailable, using cached entries.")

    tiktok_items = fetch_tiktok_items()
    if tiktok_items:
        log(f"{creator_id}: TikTok items fetched: {len(tiktok_items)}")
    else:
        tiktok_items = manual_tiktok
        log(f"{creator_id}: TikTok fetch unavailable, using cached entries.")

    instagram_items = fetch_instagram_items()
    if instagram_items:
        log(f"{creator_id}: Instagram items fetched: {len(instagram_items)}")
    else:
        instagram_items = manual_instagram or build_instagram_items_from_covers()
        log(f"{creator_id}: Instagram fetch unavailable, using cached entries.")

    # Keep historical cached items and prepend fresh ones.
    youtube_items = merge_items(youtube_items, manual_youtube)
    tiktok_items = merge_items(tiktok_items, manual_tiktok)
    instagram_items = merge_items(instagram_items, manual_instagram)

    payload = {
        "generated_at": now_iso(),
        "youtube": limit_items(youtube_items),
        "tiktok": limit_items(tiktok_items),
        "instagram": limit_items(instagram_items),
    }
    payload["items"] = merge_items(payload["youtube"], payload["tiktok"], payload["instagram"])

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    log(
        f"{creator_id}: Saved feed {OUTPUT_PATH}: "
        f"youtube={len(payload['youtube'])}, "
        f"tiktok={len(payload['tiktok'])}, "
        f"instagram={len(payload['instagram'])}, "
        f"items={len(payload['items'])}"
    )


def main():
    jobs = load_creator_jobs()
    if not jobs:
        log("No creator feed jobs configured.")
        return

    for job in jobs:
        configure_job(job)
        update_current_feed(job["id"])


if __name__ == "__main__":
    main()
