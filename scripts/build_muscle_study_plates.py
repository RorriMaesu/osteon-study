"""Bake the Required Muscle List's textbook crops from its local source images.

Run with Python 3, Pillow, and Node.js 22 or newer on PATH.
"""

import json
from pathlib import Path
import subprocess

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
READ_VIEWS = """
import {muscleChecklistTargets} from './src/muscle-checklist-bank.js';
import {muscleListOpenStaxFigure} from './src/muscle-list-openstax.js';
const views = muscleChecklistTargets.map(card => muscleListOpenStaxFigure(card.id));
console.log(JSON.stringify(views.filter(view => view.panel)));
"""


def main():
    result = subprocess.run(
        ["node", "--input-type=module", "-e", READ_VIEWS],
        cwd=ROOT, capture_output=True, check=True, encoding="utf-8",
    )
    views = {view["displayImage"]["src"]: view for view in json.loads(result.stdout)}
    for destination, view in sorted(views.items()):
        output = ROOT / destination
        output.parent.mkdir(parents=True, exist_ok=True)
        x, y, width, height = view["panel"]
        with Image.open(ROOT / view["src"]) as source:
            if min(x, y) < 0 or x + width > source.width or y + height > source.height:
                raise ValueError(f"Crop for {destination} exceeds {view['src']}")
            source.crop((x, y, x + width, y + height)).save(output, quality=92, method=5)
    print(f"Built {len(views)} distinct OpenStax study panels.")


if __name__ == "__main__":
    main()
