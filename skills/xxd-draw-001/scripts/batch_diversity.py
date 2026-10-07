#!/usr/bin/env python3
"""Check a batch of briefs for template reuse: each request must get its own composition.

  python3 batch_diversity.py DIR      # finds DIR/**/brief.json

Flags (1) groups of briefs with the same multiset of forms, (2) briefs whose
imagery is missing from their subjects, (3) generic subject names. Exit 1 if any group
of 3+ identical compositions exists or more than 10% of briefs miss imagery.
"""
import json, sys, collections
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from compose import imagery_gaps

root = Path(sys.argv[1]); briefs = sorted(root.rglob('brief.json'))
groups = collections.defaultdict(list); missing_n = 0; generic_n = 0
for b in briefs:
    try: d = json.loads(b.read_text())
    except Exception: continue
    # a composition = which forms, in which habit/shape/pose: two pictures of hills+tree+water+boat count as the same
    key = tuple(sorted(f"{t.get('form')}:{t.get('habit') or t.get('shape') or t.get('surface') or t.get('pose') or ''}" for t in d.get('things', []) if t.get('form') != 'free'))
    groups[key].append(b.parent.name)
    miss, gen = imagery_gaps(d)
    if not d.get('imagery') or miss: missing_n += 1; print('IMAGERY', b.parent.name, 'no imagery list' if not d.get('imagery') else '缺: ' + '、'.join(miss))
    if gen: generic_n += 1
bad = [(k, v) for k, v in groups.items() if len(v) >= 3]
for k, v in sorted(bad, key=lambda kv: -len(kv[1])): print(f'SAME COMPOSITION x{len(v)}: {list(k)}\n   ' + ' / '.join(v))
print(f'briefs={len(briefs)} distinct_compositions={len(groups)} repeated_groups(3+)={len(bad)} missing_imagery={missing_n} generic_names={generic_n}')
sys.exit(1 if bad or missing_n > .1 * max(1, len(briefs)) else 0)
