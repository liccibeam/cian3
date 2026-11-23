"""Capture the real React prototype by following the approved user journey."""
import argparse
import hashlib
import json
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--base', default='http://127.0.0.1:5195')
    args = ap.parse_args()
    assets = HERE / 'assets'
    assets.mkdir(exist_ok=True)
    record = {'base': args.base, 'viewport': [390, 844], 'device_scale_factor': 2, 'screens': {}}
    with sync_playwright() as p:
        browser = p.chromium.launch(args=['--force-color-profile=srgb', '--hide-scrollbars'])
        page = browser.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))

        def settle():
            page.evaluate("""async () => {
              await document.fonts.ready;
              document.querySelectorAll('img').forEach(i => i.loading = 'eager');
              await Promise.all([...document.images].map(i => i.decode().catch(()=>{})));
            }""")

        def snap(name):
            settle()
            nav = page.get_by_role('navigation', name='Навигация приложения', include_hidden=True)
            nav.screenshot(path=str(assets / f'{name}-nav.png'))
            nav.evaluate("el => el.style.visibility='hidden'")
            page.screenshot(path=str(assets / f'{name}.png'), full_page=True)
            nav.evaluate("el => el.style.visibility=''")
            page.screenshot(path=str(assets / f'{name}-viewport.png'))
            data = {'url': page.url, 'title': page.title(), 'height': page.evaluate('document.documentElement.scrollHeight')}
            record['screens'][name] = data
            return data

        page.goto(args.base + '/?scenario=returning', wait_until='networkidle')
        page.get_by_role('heading', name='Найдите своё место').wait_for()
        home = snap('home')
        resume = page.get_by_role('region', name='Продолжить поиск').get_by_role('link')
        home['resume'] = resume.bounding_box()
        home['resume_text'] = resume.inner_text()
        resume.click()
        page.wait_for_url('**/search?**')
        page.get_by_role('heading', name='Продажа квартир в Москве', exact=True).wait_for()
        page.get_by_role('status', name='Загрузка объявлений').wait_for(state='hidden')
        page.locator('article').first.wait_for()
        search = snap('search')
        card = page.locator('article').first
        search['card'] = card.bounding_box()
        first_link = card.locator('a').first
        search['photo'] = first_link.bounding_box()
        card_title = card.locator('a').nth(1)
        search['card_title'] = card_title.bounding_box()
        first_link.click()
        page.wait_for_url('**/listing/1')
        page.get_by_role('heading', level=1).filter(has_text='Продаётся').wait_for()
        detail = snap('detail')
        detail['heading'] = page.get_by_role('heading', level=1).inner_text()
        record['errors'] = errors
        if errors:
            raise RuntimeError(errors)
        for f in assets.glob('*.png'):
            record.setdefault('sha256', {})[f.name] = hashlib.sha256(f.read_bytes()).hexdigest()
        (assets / 'capture.json').write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding='utf-8')
        (assets / 'capture.js').write_text('window.CAPTURE = ' + json.dumps(record, ensure_ascii=False) + ';\n', encoding='utf-8')
        browser.close()
    print(json.dumps(record['screens'], ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
