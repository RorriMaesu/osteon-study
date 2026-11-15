#!/usr/bin/env python3
"""Build Osteon's reference walking cycle from Moreira et al.'s public CC0 data.

Run from the repository root:
    python scripts/process-motion-gait.py
    python scripts/process-motion-gait.py --archive "path/to/ASCII files.zip"

The default retrieves only the ZIP directory and selected trial entries over
HTTP ranges. The browser uses the compact derived JSON, never the raw archive.
"""

import argparse
import bisect
import csv
import io
import json
import math
import urllib.error
import urllib.request
import zipfile
from pathlib import Path

ARCHIVE_URL = "https://api.figshare.com/v2/file/download/26902613"
ARCHIVE_SIZE = 1341020068
SAMPLE_COUNT = 101
TRIAL_NAME = "T1.txt"
DATA_DIRECTORY = "ASCII files/Participant1"
FORCE_THRESHOLD_N = 20
EMG_CHANNELS = {
    "tibialisAnterior": "TA",
    "lateralGastrocnemius": "GAL",
    "bicepsFemoris": "BF",
    "vastusLateralis": "VL",
}


class RemoteZip(io.RawIOBase):
    """Seekable reader which refuses unrestricted responses."""

    def __init__(self):
        self.position = 0
        self.url = ARCHIVE_URL
        self.cache_start = 0
        self.cache = b""

    def tell(self):
        return self.position

    def seekable(self):
        return True

    def readable(self):
        return True

    def seek(self, offset, whence=io.SEEK_SET):
        anchors = {io.SEEK_SET: 0, io.SEEK_CUR: self.position, io.SEEK_END: ARCHIVE_SIZE}
        position = anchors[whence] + offset
        if position < 0:
            raise ValueError("Negative ZIP offset")
        self.position = position
        return self.position

    def fetch(self, start, end):
        expected = f"bytes {start}-{end - 1}/{ARCHIVE_SIZE}"
        request = urllib.request.Request(self.url, headers={"Range": f"bytes={start}-{end - 1}"})
        try:
            response = urllib.request.urlopen(request, timeout=30)
        except urllib.error.HTTPError as exc:
            if self.url == ARCHIVE_URL or exc.code != 403:
                raise
            self.url = ARCHIVE_URL
            return self.fetch(start, end)
        with response:
            if response.status != 206 or response.headers.get("Content-Range") != expected:
                raise OSError(f"Expected the Figshare byte range {expected}")
            self.url = response.url
            data = response.read(end - start + 1)
        if len(data) != end - start:
            raise OSError("Figshare returned an incomplete byte range")
        return data

    def read(self, size=-1):
        start = self.position
        end = ARCHIVE_SIZE if size < 0 else min(start + size, ARCHIVE_SIZE)
        if end <= start:
            return b""
        if end - start > 8 * 1024 * 1024:
            raise ValueError("Unbounded walk-dataset archive request")
        if not (self.cache_start <= start and end <= self.cache_start + len(self.cache)):
            self.cache_start = start
            self.cache = self.fetch(start, min(ARCHIVE_SIZE, max(end, start + 131072)))
        self.position = end
        return self.cache[start - self.cache_start:end - self.cache_start]


def table(archive, path):
    raw = archive.read(f"{DATA_DIRECTORY}/{path}").decode("ascii")
    return [
        {key: float(value or "nan") for key, value in row.items()}
        for row in csv.DictReader(raw.splitlines(), delimiter="\t")
    ]


def plate_strikes(rows, side):
    key = f"{side}_GRF_Z"
    changes = []
    contact = False
    for row in rows:
        value = row[key]
        current = math.isfinite(value) and value >= FORCE_THRESHOLD_N
        if current != contact:
            changes.append((round(row["Time"], 6), current))
        contact = current
    if [on for _, on in changes] != [True, False, True, False]:
        raise ValueError(f"Expected two complete force-plate contacts for side {side}")
    return [t for t, _ in changes]


def interpolate(rows, indices, time):
    upper = bisect.bisect_right(indices, time)
    if upper == 0:
        return rows[0]
    if upper == len(indices):
        return rows[-1]
    lower = upper - 1
    alpha = (time - indices[lower]) / (indices[upper] - indices[lower])
    return {key: value + alpha * (rows[upper][key] - value) for key, value in rows[lower].items()}


def stance_alignment(time, clock, force, stride):
    """Align the side-normalized source signals to this trial's shared GRF clock."""
    start, off, finish = clock
    published_off = max(i for i, row in enumerate(force) if row[f"{stride}_GRF_Z"] >= FORCE_THRESHOLD_N) + 1
    if len(force) != 1001 or published_off not in range(500, 751):
        raise ValueError(f"Unexpected processed stance length at {stride}")
    anchors = [start, off, finish]
    phases = [{"index": 0}, {"index": published_off}, {"index": len(force) - 1}]
    return interpolate(phases, anchors, time)["index"]


def source_signals(archive, side):
    start = f"Processed_Data/V4/{side}"
    data = [table(archive, f"{start}/{field}/{TRIAL_NAME}") for field in ("Angles", "EMG envelope", "GRF")]
    if any(len(rows) != 1001 for rows in data):
        raise ValueError(f"Expected 1001 gait-normalized samples for {side}")
    return data


def pose_side(data, clock, stride, time, contact, force):
    angles, emg, published_forces = data
    phase = stance_alignment(time, clock, published_forces, stride)
    grid = range(len(angles))
    a = interpolate(angles, grid, phase)
    e = interpolate(emg, grid, phase)
    return {
        "hip": round(a[f"{stride}_Hip_X"], 3),
        "knee": round(a[f"{stride}_Knee_X"], 3),
        "ankle": round(a[f"{stride}_Ankle_X"], 3),
        "emg": {name: round(e[f"{stride}_{channel}"], 3) for name, channel in EMG_CHANNELS.items()},
        "contact": contact,
        "verticalForceN": round(force, 2) if math.isfinite(force) else None,
    }


def pelvis_centroid(markers, times, time):
    row = interpolate(markers, times, time)
    positions = []
    for axis in "XYZ":
        points = [row[f"{side}{spine}{axis}"] for side in "RL" for spine in ("ASIS", "PSIS")]
        if not all(math.isfinite(v) for v in points):
            raise ValueError("Missing pelvis reference marker")
        positions.append(sum(points) / (len(points) * 1000))
    right = [row[f"RASIS{axis}"] - row[f"LASIS{axis}"] for axis in "XY"]
    return positions, right


def build(archive):
    force = table(archive, f"Raw_Data/V4/GRF/{TRIAL_NAME}")
    timestamps = [r["Time"] for r in force]
    left_on, left_off, next_left_on, _ = plate_strikes(force, "L")
    right_on, right_off, next_right_on, next_right_off = plate_strikes(force, "R")
    if not right_on < left_on < right_off < next_right_on < left_off < next_left_on < next_right_off:
        raise ValueError("Bilateral contact order differs from the expected trial")
    right_duration = table(archive, "Processed_Data/V4/R/StrideTime/StrideTime.txt")[0]["St2_Time"]
    left = source_signals(archive, "L")
    right = source_signals(archive, "R")
    markers = table(archive, f"Raw_Data/V4/Trajectories/{TRIAL_NAME}")
    marker_times = [r["Time"] for r in markers]

    duration = next_left_on - left_on
    origin, right_ref = pelvis_centroid(markers, marker_times, left_on)
    end, _ = pelvis_centroid(markers, marker_times, next_left_on)
    x, y = end[0] - origin[0], end[1] - origin[1]
    travel = math.hypot(x, y)
    if travel < 0.5:
        raise ValueError("The pelvis marker path did not progress as expected")
    forward = (x / travel, y / travel)
    lateral = (forward[1], -forward[0])
    if sum(a * b for a, b in zip(right_ref, lateral)) < 0:
        lateral = (-lateral[0], -lateral[1])

    samples = []
    for i in range(SAMPLE_COUNT):
        fraction = i / (SAMPLE_COUNT - 1)
        time = left_on + fraction * duration
        clock = (right_on, right_off, next_right_on)
        stride = "St1"
        if time >= next_right_on:
            clock = (next_right_on, next_right_off, next_right_on + right_duration)
            stride = "St2"
        row = force[bisect.bisect_right(timestamps, time + 1e-9) - 1]
        point, _ = pelvis_centroid(markers, marker_times, time)
        delta = [a - b for a, b in zip(point, origin)]
        samples.append({
            "percent": round(fraction * 100, 3),
            "pelvis": {
                "forwardMeters": round(sum(a * b for a, b in zip(delta, forward)), 5),
                "upMeters": round(delta[2], 5),
                "rightMeters": round(sum(a * b for a, b in zip(delta, lateral)), 5),
            },
            "left": pose_side(left, (left_on, left_off, next_left_on), "St1", time,
                              time < left_off or i == SAMPLE_COUNT - 1, row["L_GRF_Z"]),
            "right": pose_side(right, clock, stride, time,
                               time < right_off or time >= next_right_on, row["R_GRF_Z"]),
        })

    events = [
        {"timeSeconds": round(t - left_on, 6), "percent": round((t - left_on) * 100 / duration, 3),
         "side": side, "phase": phase}
        for t, side, phase in [
            (left_on, "left", "initial-contact"), (right_off, "right", "toe-off"),
            (next_right_on, "right", "initial-contact"), (left_off, "left", "toe-off"),
            (next_left_on, "left", "initial-contact"),
        ]
    ]
    return {
        "source": {
            "title": "Lower limb kinematic, kinetic, and EMG data from young healthy humans during walking at controlled speeds",
            "authors": "Moreira, Figueiredo, Fonseca, Vilas-Boas and Santos",
            "paper": "https://doi.org/10.1038/s41597-021-00881-3",
            "doi": "https://doi.org/10.6084/m9.figshare.13169240.v1",
            "license": "CC0-1.0",
            "participant": 1,
            "trial": 1,
            "speedKmh": 4,
            "condition": "Level overground walking",
            "startSeconds": left_on,
            "endSeconds": next_left_on,
            "method": "Measured sagittal joint angles and EMG envelopes from left stride 1 and right strides 1–2, resampled to the left heel-to-heel cycle. Each published stance and swing trace is aligned to the corresponding 20 N vertical force-plate transition. Pelvis travel is the mean of four ASIS/PSIS markers relative to the cycle start.",
            "angles": "Degrees. Hip and knee flexion and ankle dorsiflexion are positive.",
            "emg": "Surface EMG envelope as percent of each channel's maximum voluntary contraction. Missing muscles were not recorded.",
        },
        "durationSeconds": round(duration, 6),
        "events": events,
        "samples": samples,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=Path)
    parser.add_argument("--output", type=Path, default=Path("src/motion-gait-data.json"))
    args = parser.parse_args()
    with zipfile.ZipFile(args.archive or RemoteZip()) as archive:
        data = build(archive)
    samples = data.pop("samples")
    encoded = json.dumps(data, indent=2, allow_nan=False)
    lines = [f"    {json.dumps(sample, separators=(',', ':'), allow_nan=False)}" for sample in samples]
    args.output.write_text(encoded[:-2] + ',\n  "samples": [\n' + ",\n".join(lines) + "\n  ]\n}\n", encoding="utf-8", newline="\n")


if __name__ == "__main__":
    main()
