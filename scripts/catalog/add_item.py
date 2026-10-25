"""Adds a purchase with a cut-out product picture to the app's catalog.

The app imports public/catalog/items.json on start, so after a deploy the item
appears on both phones in «Покупки», in its tab.

    python scripts/catalog/add_item.py --wb https://www.wildberries.ru/catalog/123456789/detail.aspx --list Одежда
    python scripts/catalog/add_item.py --image photo.jpg --title "Куртка" --price 7990 --part upper --list Одежда

Pointing at the product (best quality, the way Claude does it): first look at the photo
with a coordinate grid, then give a box and points in fractions of the width/height:

    python scripts/catalog/add_item.py --wb LINK --inspect /tmp/grid.png
    python scripts/catalog/add_item.py --wb LINK --box 0.30,0.18,0.72,0.66 --point 0.5,0.4 --exclude 0.5,0.12 --list Одежда

The box and points go to Segment Anything, which cuts exactly that thing (a jacket
without the model wearing it). Without them --part decides automatically:
    upper   top garment (jacket, hoodie, shirt) — the model and background go
    lower   trousers, skirt
    full    dress, overall
    object  the main object as a whole (shoes, bag, furniture, gadgets)
    auto    guessed from the title (default)

Needs: pip install -r scripts/catalog/requirements.txt (rembg downloads its models on first use).
"""

from __future__ import annotations

import argparse
import io
import json
import re
import sys
import urllib.request
from datetime import date
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
CATALOG = ROOT / 'public' / 'catalog'
ITEMS = CATALOG / 'items.json'
MAX_SIDE = 900
UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'

UPPER = r'куртк|пухов|парк[аи]|ветровк|бомбер|пальто|жилет|пиджак|блейзер|шуб|худи|толстовк|свитшот|свитер|кофт|джемпер|футболк|лонгслив|поло|рубаш|блуз|топ\b|майк'
LOWER = r'джинс|брюк|штан|шорт|леггинс|джоггер|карго|юбк'
FULL = r'плать|сарафан|комбинезон'


# ---------- fetching ----------

def http_get(url: str, timeout: int = 30) -> bytes:
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': '*/*'})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def wb_article(link: str) -> int | None:
    m = re.search(r'/catalog/(\d+)', link) or re.search(r'(?:^|\D)(\d{6,12})(?:\D|$)', link)
    return int(m.group(1)) if m else None


def wb_paths(nm: int) -> str:
    return f'vol{nm // 100000}/part{nm // 1000}/{nm}'


def wb_basket(nm: int) -> str | None:
    """Finds the image host of an article: hosts are split by article ranges that WB extends over time."""
    path = wb_paths(nm)
    for i in range(1, 41):
        host = f'https://basket-{i:02d}.wbbasket.ru'
        try:
            http_get(f'{host}/{path}/info/ru/card.json', timeout=8)
            return host
        except Exception:
            continue
    return None


def wb_info(link: str) -> dict:
    """Title, price and main photo of a Wildberries product."""
    nm = wb_article(link)
    if not nm:
        raise SystemExit('Не нашёл артикул в ссылке Wildberries')
    info: dict = {'id': f'wb-{nm}', 'url': f'https://www.wildberries.ru/catalog/{nm}/detail.aspx'}
    host = wb_basket(nm)
    if host:
        card = json.loads(http_get(f'{host}/{wb_paths(nm)}/info/ru/card.json'))
        info['title'] = card.get('imt_name') or card.get('subj_name')
        info['image'] = f'{host}/{wb_paths(nm)}/images/big/1.webp'
    for api in (
        f'https://card.wb.ru/cards/v4/detail?appType=1&curr=rub&dest=-1257786&nm={nm}',
        f'https://card.wb.ru/cards/v2/detail?appType=1&curr=rub&dest=-1257786&nm={nm}',
    ):
        try:
            data = json.loads(http_get(api, timeout=15))
            products = data.get('products') or data.get('data', {}).get('products') or []
            if not products:
                continue
            p = products[0]
            info.setdefault('title', p.get('name'))
            sizes = p.get('sizes') or []
            prices = [s.get('price', {}).get('product') for s in sizes if s.get('price')]
            price = next((x for x in prices if x), None) or p.get('salePriceU')
            if price:
                info['price'] = round(price / 100)
            break
        except Exception:
            continue
    return info


def load_image(src: str) -> Image.Image:
    data = http_get(src) if re.match(r'https?://', src) else Path(src).read_bytes()
    return Image.open(io.BytesIO(data)).convert('RGB')


# ---------- cutting out ----------

_sessions: dict = {}


def session(name: str):
    from rembg import new_session

    if name not in _sessions:
        _sessions[name] = new_session(name)
    return _sessions[name]


def matte(img: Image.Image, model: str) -> np.ndarray:
    """Soft alpha (0..1) of the main subject."""
    from rembg import remove

    m = remove(img, session=session(model), only_mask=True, post_process_mask=False)
    return np.asarray(m, dtype=np.float32) / 255


def garment_mask(img: Image.Image, part: str) -> np.ndarray:
    """Hard mask of one garment class from the clothing segmenter, grown a little so the matte decides the edge."""
    masks = session('u2net_cloth_seg').predict(img, cc=part)
    m = masks[0].filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1.5))
    return np.asarray(m, dtype=np.float32) / 255


def pair(text: str, n: int) -> list[float]:
    vals = [float(v) for v in text.split(',')]
    if len(vals) != n or not all(0 <= v <= 1 for v in vals):
        raise SystemExit(f'Ожидаю {n} числа от 0 до 1 через запятую: {text}')
    return vals


def sam_mask(img: Image.Image, box: str | None, points: list[str], exclude: list[str], model: str) -> np.ndarray:
    """Segment Anything: cuts exactly what the box and points mark."""
    w, h = img.size
    prompt = []
    if box:
        x1, y1, x2, y2 = pair(box, 4)
        prompt.append({'type': 'rectangle', 'data': [x1 * w, y1 * h, x2 * w, y2 * h], 'label': 1})
    for p in points:
        x, y = pair(p, 2)
        prompt.append({'type': 'point', 'data': [x * w, y * h], 'label': 1})
    for p in exclude:
        x, y = pair(p, 2)
        prompt.append({'type': 'point', 'data': [x * w, y * h], 'label': 0})
    from rembg.sessions.sam import SamSession

    key = f'sam:{model}'
    if key not in _sessions:
        from rembg import new_session

        _sessions[key] = new_session('sam', sam_model=model)
    sess: SamSession = _sessions[key]
    m = sess.predict(img, sam_prompt=prompt)[0]
    return np.asarray(m.filter(ImageFilter.GaussianBlur(1.2)), dtype=np.float32) / 255


def inspect(img: Image.Image, out: str) -> None:
    """The photo with a 0..1 grid, to pick the box and points by eye."""
    from PIL import ImageDraw

    k = min(1.0, 900 / max(img.size))
    view = img.resize((round(img.width * k), round(img.height * k))).convert('RGB')
    d = ImageDraw.Draw(view)
    for i in range(1, 10):
        x, y = view.width * i / 10, view.height * i / 10
        d.line([(x, 0), (x, view.height)], fill=(255, 0, 60), width=1)
        d.line([(0, y), (view.width, y)], fill=(255, 0, 60), width=1)
        d.text((x + 2, 2), f'{i / 10:.1f}', fill=(255, 255, 0))
        d.text((2, y + 2), f'{i / 10:.1f}', fill=(255, 255, 0))
    view.save(out)
    print(f'grid: {out} ({img.width}×{img.height})')


def keep_main(alpha: np.ndarray) -> np.ndarray:
    """Drops specks: keeps the largest blob and the ones at least 15% of its size."""
    from scipy import ndimage

    solid = alpha > 0.5
    labels, n = ndimage.label(solid)
    if n <= 1:
        return alpha
    sizes = ndimage.sum(solid, labels, range(1, n + 1))
    keep = {i + 1 for i, s in enumerate(sizes) if s >= sizes.max() * 0.15}
    region = np.isin(labels, list(keep))
    region = ndimage.binary_dilation(region, iterations=3)
    return alpha * region


def guess_part(title: str) -> str:
    t = title.lower()
    if re.search(UPPER, t):
        return 'upper'
    if re.search(LOWER, t):
        return 'lower'
    if re.search(FULL, t):
        return 'full'
    return 'object'


def cut_out(img: Image.Image, part: str, model: str, prompts: dict | None = None) -> Image.Image:
    k = min(1.0, 1600 / max(img.size))
    if k < 1:
        img = img.resize((round(img.width * k), round(img.height * k)), Image.Resampling.LANCZOS)
    alpha = matte(img, model)
    if prompts:
        # the matte gives the soft edge against the background, SAM decides what belongs to the product
        alpha = np.minimum(alpha, sam_mask(img, **prompts))
    elif part != 'object':
        g = garment_mask(img, part)
        if g.max() < 0.5:
            raise SystemExit(f'На фото не нашлось одежды типа «{part}». Попробуйте --part object или другое фото')
        alpha = alpha * g
    alpha = keep_main(alpha)
    rgba = np.dstack([np.asarray(img), (np.clip(alpha, 0, 1) * 255).astype(np.uint8)])
    out = Image.fromarray(rgba, 'RGBA')
    box = out.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    if not box:
        raise SystemExit('Не получилось выделить товар на фото')
    out = out.crop(box)
    pad = round(max(out.size) * 0.02)
    canvas = Image.new('RGBA', (out.width + pad * 2, out.height + pad * 2))
    canvas.paste(out, (pad, pad))
    k = min(1.0, MAX_SIDE / max(canvas.size))
    if k < 1:
        canvas = canvas.resize((round(canvas.width * k), round(canvas.height * k)), Image.Resampling.LANCZOS)
    return canvas


def tint_of(img: Image.Image) -> str:
    a = np.asarray(img, dtype=np.float32)
    w = a[..., 3:] / 255
    if w.sum() == 0:
        return '#808080'
    rgb = (a[..., :3] * w).sum((0, 1)) / w.sum()
    return '#' + ''.join(f'{round(c):02x}' for c in rgb)


# ---------- catalog ----------

def slug(text: str) -> str:
    tr = str.maketrans('абвгдеёжзийклмнопрстуфхцчшщъыьэюя', 'abvgdeejzijklmnoprstufhccss_y_eua')
    s = re.sub(r'[^a-z0-9]+', '-', text.lower().translate(tr)).strip('-')
    return (s[:32] or 'item') + '-' + date.today().strftime('%y%m%d')


def save(item: dict, picture: Image.Image) -> Path:
    CATALOG.mkdir(parents=True, exist_ok=True)
    path = CATALOG / f'{item["id"]}.webp'
    picture.save(path, 'WEBP', quality=88, method=6)
    data = json.loads(ITEMS.read_text('utf-8')) if ITEMS.exists() else {'items': []}
    items = [x for x in data.get('items', []) if x.get('id') != item['id']]
    data['items'] = [item, *items]
    ITEMS.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', 'utf-8')
    return path


def main(argv: list[str] | None = None) -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--wb', help='ссылка на товар Wildberries: название, цена и главное фото берутся оттуда')
    ap.add_argument('--image', help='фото товара: файл или ссылка (по умолчанию — главное фото с WB)')
    ap.add_argument('--title')
    ap.add_argument('--price', type=int)
    ap.add_argument('--url', help='ссылка, которая откроется по нажатию на карточку')
    ap.add_argument('--list', help='вкладка в «Покупках», например «Одежда»; создаётся, если её нет')
    ap.add_argument('--part', default='auto', choices=['auto', 'upper', 'lower', 'full', 'object'])
    ap.add_argument('--model', default='isnet-general-use', help='модель для точного края (rembg)')
    ap.add_argument('--id', help='id в каталоге (латиница, цифры, -)')
    ap.add_argument('--preview', help='сохранить вырезанную картинку ещё и сюда (PNG), каталог не трогать')
    ap.add_argument('--inspect', help='сохранить фото с сеткой координат и выйти')
    ap.add_argument('--box', help='рамка вокруг товара: x1,y1,x2,y2 в долях 0..1')
    ap.add_argument('--point', action='append', default=[], help='точка на товаре: x,y в долях (можно несколько)')
    ap.add_argument('--exclude', action='append', default=[], help='точка, которая не входит в товар (волосы, лицо, сумка)')
    ap.add_argument('--sam', default='sam_vit_b_01ec64', choices=['sam_vit_b_01ec64', 'sam_vit_l_0b3195', 'sam_vit_h_4b8939'])
    a = ap.parse_args(argv)

    info: dict = wb_info(a.wb) if a.wb else {}
    if a.inspect:
        src = a.image or info.get('image')
        if not src:
            raise SystemExit('Нужна --image или --wb')
        inspect(load_image(src), a.inspect)
        return
    title = a.title or info.get('title')
    price = a.price if a.price is not None else info.get('price')
    image = a.image or info.get('image')
    if not title or price is None or not image:
        missing = [n for n, v in (('--title', title), ('--price', price), ('--image', image)) if not v and v != 0]
        raise SystemExit('Не хватает: ' + ', '.join(missing))

    part = guess_part(title) if a.part == 'auto' else a.part
    prompts = {'box': a.box, 'points': a.point, 'exclude': a.exclude, 'model': a.sam} if (a.box or a.point) else None
    picture = cut_out(load_image(image), part, a.model, prompts)
    if a.preview:
        picture.save(a.preview)
        print(f'preview: {a.preview} ({picture.width}×{picture.height}, {"sam" if prompts else part})')
        return

    item_id = a.id or info.get('id') or slug(title)
    if not re.fullmatch(r'[\w-]{1,60}', item_id):
        raise SystemExit('id: только латиница, цифры, _ и -')
    item = {
        'id': item_id,
        'title': title,
        'price': int(price),
        'url': a.url or info.get('url') or (a.wb or ''),
        'img': f'catalog/{item_id}.webp',
        'tint': tint_of(picture),
        **({'list': a.list} if a.list else {}),
        'added': date.today().isoformat(),
    }
    path = save(item, picture)
    print(json.dumps(item, ensure_ascii=False))
    print(f'saved: {path.relative_to(ROOT)} ({picture.width}×{picture.height}, part={part})')


if __name__ == '__main__':
    main(sys.argv[1:])
