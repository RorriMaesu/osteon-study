"""Cache published spring reference models and the metadata of the exact release.

Usage: python scripts/fetch-ap3-reference-models.py EMPTY_SOURCE_DIRECTORY
The source archive is retained separately from optimized student assets.
"""
import concurrent.futures
import hashlib
import json
from pathlib import Path
import sys
from html.parser import HTMLParser
from urllib.request import Request, urlopen

HRA = {"colorectal": "ref-organ/large-intestine-male/v1.2", "node": "ref-organ/lymph-node-male/v1.4", "kidney": "ref-organ/kidney-male-left/v1.3",
       "ureter": "ref-organ/ureter-male-left/v1.2", "glomerulus": "3d-ftu/glomerulus/v1.0"}
STAGES = {12: "016955", 16: "016953", 20: "016951", 23: "016950"}


def fetch(url):
    with urlopen(Request(url, headers={"User-Agent": "Osteon anatomy curriculum"}), timeout=90) as response:
        return response.read()


class NIHPage(HTMLParser):
    def handle_data(self, text):
        if "s3Location" in text and "inputFiles" in text and ".stl" in text:
            payload = json.loads(text[text.index("["):text.rindex("]") + 1])[1]
            start = payload.index('"inputFiles":') + len('"inputFiles":')
            self.mesh = json.JSONDecoder().raw_decode(payload[start:])[0][0]
            start = payload.index('"workflowRuns":') + len('"workflowRuns":')
            run = json.JSONDecoder().raw_decode(payload[start:])[0][0]
            self.output = next(f for f in run["outputFiles"] if f["fileFormat"] == "STL")
            self.url = f"https://3d.nih.gov/api/submissions/{run['submissionId']}/runs/{run['prefectRunId']}/output-files/{self.output['fileId']}"
            self.metadata = json.JSONDecoder().raw_decode(payload[payload.rindex('"metadata":', 0, payload.index('"title":"Carnegie')) + len('"metadata":'):])[0]


def download(record):
    directory, stem, url = record
    if stem.startswith("stage"):
        page = NIHPage()
        page.feed(fetch(url).decode("utf8"))
        link = page.url
        metadata = {"entry": url, "metadata": page.metadata, "input": page.mesh, "output": page.output, "download": link}
        suffix = ".stl"
    else:
        metadata = json.loads(fetch(url))["was_derived_from"]
        link = next(d["downloadUrl"] for d in metadata["distributions"] if ".glb" in d["downloadUrl"])
        suffix = ".glb"
    if (directory / (stem + suffix)).exists() and (directory / (stem + ".json")).exists():
        previous = json.loads((directory / (stem + ".json")).read_text(encoding="utf8"))
        if previous == metadata:
            return
    data = fetch(link)
    for filename, content in [(stem + suffix, data), (stem + ".json", json.dumps(metadata, indent=2).encode())]:
        path = directory / filename
        if path.exists() and path.read_bytes() != content:
            raise FileExistsError(f"Choose a new source archive for this version: {path}")
        path.write_bytes(content)
    print(stem, len(data), hashlib.sha256(data).hexdigest(), flush=True)


if __name__ == "__main__":
    folder = Path(sys.argv[1])
    folder.mkdir(parents=True, exist_ok=True)
    records = [(folder, k, f"https://cdn.humanatlas.io/digital-objects/{v}/metadata.json") for k, v in HRA.items()]
    records += [(folder, f"stage{k}", f"https://3d.nih.gov/entries/3DPX-{v}") for k, v in STAGES.items()]
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        list(pool.map(download, records))

