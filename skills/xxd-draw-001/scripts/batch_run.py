#!/usr/bin/env python3
"""Batch xxd-draw-001: one isolated worker per request, so every picture is designed from its own words.

  python3 batch_run.py requests.txt --out DIR [--model gpt-6-luna] [-j 3]

requests.txt: one request per line; a line may end with "\t/path/to/photo.jpg" for photo input.
Each line becomes DIR/NNN-<first words>/ with the finished HTML. A worker sees ONLY its own request
(its own directory, its own prompt), so it cannot write a keyword classifier that fills templates for
the whole list. Finished items are skipped on re-run. At the end batch_diversity.py checks the set;
items in a repeated-composition group or missing imagery are listed in DIR/redo.txt and re-run once.
"""
import argparse, concurrent.futures as cf, json, os, re, subprocess, sys, time
from pathlib import Path

HERE = Path(__file__).resolve().parent
QUIET = ['-c', 'features.plugins=false', '-c', 'features.remote_plugin=false', '-c', 'features.apps=false', '-c', 'analytics.enabled=false', '-c', 'notify=[]']
SINGLE = ('$xxd-draw-001 {req}\n\n这是一幅单独的作品：只围绕上面这句命题设计画面，先列出命题里的全部意象，再写 brief。'
          '不要参考或生成其他命题，不要写批量或分类脚本。把最终作品 HTML 保存到 {out} 目录，同时把 brief.json 也存到这个目录。')


def slug(text, n):
    return f'{n:03d}-' + re.sub(r'[\\/:*?"<>|\s]+', '', text)[:12]


def done(d):
    return any(p.suffix == '.html' for p in d.glob('*.html')) and (d / 'brief.json').exists()


def run(item, args):
    n, req, img = item; d = Path(args.out) / slug(req, n); d.mkdir(parents=True, exist_ok=True)
    if done(d) and not item_in_redo(d, args): return n, 'skip'
    cmd = ['codex', *QUIET, 'exec', '-m', args.model, '--skip-git-repo-check', '--ephemeral', '-C', str(d), '-s', 'danger-full-access']
    if img: cmd += ['-i', img]
    cmd += ['--', SINGLE.format(req=req, out=d)]
    env = {**os.environ, 'PLAYWRIGHT_MODULE': args.playwright, **({'BROWSER_EXECUTABLE': args.browser} if args.browser else {})}
    for attempt in range(1, 4):
        t0 = time.time()
        with open(d / 'worker.log', 'w') as log: r = subprocess.run(cmd, stdout=log, stderr=subprocess.STDOUT, stdin=subprocess.DEVNULL, env=env, timeout=args.timeout)
        if done(d): return n, f'ok {int(time.time() - t0)}s attempt={attempt}'
        if 'at capacity' not in (d / 'worker.log').read_text(errors='ignore'): break
        time.sleep(30)
    return n, 'FAILED (see worker.log)'


REDO = set()
def item_in_redo(d, args): return d.name in REDO


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('requests'); ap.add_argument('--out', required=True); ap.add_argument('--model', default='gpt-6-luna'); ap.add_argument('-j', type=int, default=3)
    ap.add_argument('--timeout', type=int, default=1800)
    ap.add_argument('--playwright', default=os.environ.get('PLAYWRIGHT_MODULE', 'playwright'))
    ap.add_argument('--browser', default=os.environ.get('BROWSER_EXECUTABLE', ''))
    a = ap.parse_args()
    items = []
    for line in Path(a.requests).read_text().splitlines():
        if not line.strip(): continue
        req, _, img = line.partition('\t'); items.append((len(items) + 1, req.strip(), img.strip() or None))
    for rnd in (1, 2):
        with cf.ThreadPoolExecutor(a.j) as ex:
            for n, status in ex.map(lambda it: run(it, a), [it for it in items if rnd == 1 or slug(it[1], it[0]) in REDO]): print(f'[{rnd}] {n:03d} {status}', flush=True)
        r = subprocess.run([sys.executable, str(HERE / 'batch_diversity.py'), a.out], capture_output=True, text=True); print(r.stdout.strip().splitlines()[-1])
        redo = set(re.findall(r'IMAGERY (\S+)', r.stdout))
        for grp in re.findall(r'SAME COMPOSITION x\d+: .*\n\s+(.*)', r.stdout): redo |= set(x.strip() for x in grp.split(' / ')[1:])  # keep one, redo the rest
        (Path(a.out) / 'redo.txt').write_text('\n'.join(sorted(redo)) + '\n')
        if not redo or rnd == 2: break
        REDO = redo; print('redo:', len(redo), 'items')
    print('BATCH DONE' if not redo else f'BATCH DONE with {len(redo)} items still flagged (see redo.txt)')
