"""Validate design tokens; optional static rendering uses local Pillow and sharp.

No application, network requests, fonts, or packages are installed.
Contrast checks use only the Python standard library.
"""

import argparse
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent


def luminance(color):
    channels = [int(color[index:index + 2], 16) / 255 for index in (1, 3, 5)]
    linear = [value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4
              for value in channels]
    return sum(value * weight for value, weight in zip(linear, (0.2126, 0.7152, 0.0722)))


def contrast(first, second):
    low, high = sorted((luminance(first), luminance(second)))
    return (high + 0.05) / (low + 0.05)


def validate(tokens):
    if abs(contrast('#000000', '#FFFFFF') - 21) > 0.000001:
        raise ValueError('Contrast reference check failed')
    colors = tokens['color']
    for name, value in colors.items():
        if not re.fullmatch(r'#[0-9A-F]{6}', value):
            raise ValueError(f'Invalid color token: {name}')
    results = []
    for pair in tokens['contrastPairs']:
        foreground, background = colors[pair['foreground']], colors[pair['background']]
        ratio = contrast(foreground, background)
        results.append({**pair, 'foregroundHex': foreground, 'backgroundHex': background,
                        'ratio': round(ratio, 3), 'passed': ratio >= pair['minimum']})
    checks = {
        'contrast': all(pair['passed'] for pair in results),
        'uniqueContrastPairs': len({p['id'] for p in results}) == len(results),
        'touchTarget': tokens['size']['touchTargetMin'] >= 48,
        'touchGap': tokens['size']['touchGapMin'] >= 8,
        'bodySize': tokens['typography']['roles']['bodyLarge']['fontSize'] >= 16,
        'responsiveOrder': tokens['layout']['mediumMinWidth'] < tokens['layout']['expandedMinWidth'],
        'motionBounds': all(tokens['motion'][key] <= tokens['motion']['customDurationMax']
                            for key in ('pressDuration', 'stateDuration', 'enterDuration',
                                        'exitDuration', 'successDuration')),
        'noDecorativeLoops': tokens['motion']['decorativeLoops'] is False,
        'reducedMotionDefined': bool(tokens['motion']['reduceMotion']),
        'logoSourceExists': (ROOT.parent / tokens['brand']['source']).is_file(),
        'componentSpacing': all(value in tokens['spacing'].values() for value in
                                tokens['component']['card'].values()),
    }
    report = {'tokenVersion': tokens['meta']['version'], 'scope': 'static-token-specification',
              'checks': checks, 'contrastPairs': results,
              'runtime': 'Not tested; no Android application exists.'}
    if not all(checks.values()):
        raise ValueError(json.dumps(report, ensure_ascii=False, indent=2))
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write-report', action='store_true')
    parser.add_argument('--render-preview', action='store_true')
    parser.add_argument('--node', default='node')
    args = parser.parse_args()
    tokens = json.loads((ROOT / 'tokens.json').read_text())
    report = validate(tokens)
    if args.write_report:
        (ROOT / 'contrast-report.json').write_text(json.dumps(report, indent=2) + '\n')
    if args.render_preview:
        from render import render_preview
        render_preview(node=args.node)
    print(json.dumps({'checks': report['checks'], 'contrastPairs': len(report['contrastPairs']),
                      'reportWritten': args.write_report, 'previewRendered': args.render_preview}, indent=2))


if __name__ == '__main__':
    main()
