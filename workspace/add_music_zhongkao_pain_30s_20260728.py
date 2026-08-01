from __future__ import annotations

import json
import subprocess
import wave
from pathlib import Path

import numpy as np


ROOT = Path(r"E:\pinmoo\outputs\zhongkao-promo-video-30s-20260728")
SOURCE_VIDEO = ROOT / "video" / "广州中考志愿-家长痛点精华版-30秒-9x16.mp4"
VOICE = ROOT / "audio" / "广州中考志愿-家长痛点精华版-30秒男声.wav"
BGM = ROOT / "audio" / "广州中考志愿-家长痛点版-原创紧张递进配乐.wav"
OUTPUT = ROOT / "video" / "广州中考志愿-家长痛点精华版-30秒-配乐增强-9x16.mp4"
MANIFEST = ROOT / "manifest-music-enhanced.json"
FFMPEG = Path(r"E:\ffmpeg-8.1.1-essentials_build\bin\ffmpeg.exe")
FFPROBE = Path(r"E:\ffmpeg-8.1.1-essentials_build\bin\ffprobe.exe")

SAMPLE_RATE = 48_000
DURATION = 30.0
N = int(SAMPLE_RATE * DURATION)


def note_frequency(midi: int) -> float:
    return 440.0 * 2 ** ((midi - 69) / 12)


def add_note(track: np.ndarray, start: float, length: float, midi: int, gain: float, pan: float = 0.0):
    begin = int(start * SAMPLE_RATE)
    count = min(int(length * SAMPLE_RATE), N - begin)
    if count <= 0:
        return
    t = np.arange(count, dtype=np.float64) / SAMPLE_RATE
    freq = note_frequency(midi)
    attack = np.minimum(1.0, t / 0.025)
    release = np.minimum(1.0, (length - t) / 0.22)
    envelope = attack * np.maximum(0.0, release) * np.exp(-1.25 * t / max(length, 0.1))
    tone = (
        np.sin(2 * np.pi * freq * t)
        + 0.34 * np.sin(2 * np.pi * freq * 2 * t)
        + 0.12 * np.sin(2 * np.pi * freq * 3 * t)
    ) / 1.46
    signal = gain * envelope * tone
    left = np.sqrt((1.0 - pan) / 2.0)
    right = np.sqrt((1.0 + pan) / 2.0)
    track[begin:begin + count, 0] += signal * left
    track[begin:begin + count, 1] += signal * right


def add_pad(track: np.ndarray, start: float, length: float, chord: list[int], gain: float):
    for idx, midi in enumerate(chord):
        add_note(track, start, length, midi, gain / len(chord), pan=(-0.45 + idx * 0.45))


def add_kick(track: np.ndarray, start: float, gain: float):
    begin = int(start * SAMPLE_RATE)
    count = min(int(0.38 * SAMPLE_RATE), N - begin)
    if count <= 0:
        return
    t = np.arange(count, dtype=np.float64) / SAMPLE_RATE
    phase = 2 * np.pi * (58 * t - 22 * t * t)
    signal = gain * np.sin(phase) * np.exp(-12 * t)
    track[begin:begin + count, 0] += signal
    track[begin:begin + count, 1] += signal


def add_impact(track: np.ndarray, start: float, gain: float):
    begin = int(start * SAMPLE_RATE)
    count = min(int(0.75 * SAMPLE_RATE), N - begin)
    if count <= 0:
        return
    t = np.arange(count, dtype=np.float64) / SAMPLE_RATE
    low = np.sin(2 * np.pi * (72 * t - 24 * t * t)) * np.exp(-5.5 * t)
    noise = np.random.default_rng(20260728).standard_normal(count)
    noise = np.convolve(noise, np.ones(40) / 40, mode="same") * np.exp(-8 * t)
    signal = gain * (0.84 * low + 0.16 * noise)
    track[begin:begin + count, 0] += signal
    track[begin:begin + count, 1] += signal


def compose():
    music = np.zeros((N, 2), dtype=np.float64)
    beat = 60 / 96
    progression = [
        [50, 53, 57],  # Dm
        [46, 50, 53],  # Bb
        [41, 45, 48],  # F
        [48, 52, 55],  # C
    ]

    add_impact(music, 0.0, 0.42)
    for marker in [4.3, 8.55, 13.3, 19.25, 23.9, 28.0]:
        add_impact(music, marker, 0.13)

    for bar in range(12):
        start = bar * beat * 4
        chord = progression[bar % len(progression)]
        pad_gain = 0.18 if start < 21 else 0.22
        add_pad(music, start, beat * 4.15, chord, pad_gain)
        pattern = [chord[0] + 12, chord[1] + 12, chord[2] + 12, chord[1] + 12,
                   chord[0] + 12, chord[1] + 12, chord[2] + 12, chord[1] + 12]
        for step, midi in enumerate(pattern):
            note_start = start + step * beat / 2
            gain = 0.16 if note_start < 4 else (0.21 if note_start < 24 else 0.17)
            pan = -0.24 if step % 2 == 0 else 0.24
            add_note(music, note_start, beat * 0.7, midi, gain, pan)

    for beat_index in range(48):
        when = beat_index * beat
        gain = 0.16 if when < 4 else (0.22 if when < 24 else 0.15)
        if beat_index % 2 == 0:
            add_kick(music, when, gain)

    fade_in = np.minimum(1.0, np.arange(N) / (SAMPLE_RATE * 0.15))
    fade_out = np.minimum(1.0, (N - np.arange(N)) / (SAMPLE_RATE * 1.4))
    music *= (fade_in * fade_out)[:, None]
    peak = np.max(np.abs(music))
    music = music / max(peak, 1e-9) * 0.78
    pcm = np.clip(music * 32767, -32768, 32767).astype("<i2")
    with wave.open(str(BGM), "wb") as handle:
        handle.setnchannels(2)
        handle.setsampwidth(2)
        handle.setframerate(SAMPLE_RATE)
        handle.writeframes(pcm.tobytes())


def render():
    filters = (
        "[1:a]highpass=f=75,lowpass=f=11000,loudnorm=I=-16.5:TP=-1.5:LRA=6,"
        "pan=stereo|c0=c0|c1=c0,asplit=2[voice_main][voice_sc];"
        "[2:a]highpass=f=38,lowpass=f=8500,loudnorm=I=-24.5:TP=-5:LRA=10[music];"
        "[music][voice_sc]sidechaincompress=threshold=0.025:ratio=6:attack=12:release=280[ducked];"
        "[voice_main][ducked]amix=inputs=2:weights='1 0.92':normalize=0,"
        "loudnorm=I=-16.5:TP=-1.0:LRA=7,alimiter=limit=0.95[aout]"
    )
    subprocess.run([
        str(FFMPEG), "-y", "-i", str(SOURCE_VIDEO), "-i", str(VOICE), "-i", str(BGM),
        "-filter_complex", filters, "-map", "0:v:0", "-map", "[aout]", "-t", "30",
        "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
        "-movflags", "+faststart", str(OUTPUT),
    ], check=True)


def probe_duration(path: Path) -> float:
    result = subprocess.check_output([
        str(FFPROBE), "-v", "error", "-show_entries", "format=duration",
        "-of", "default=nw=1:nk=1", str(path),
    ], text=True)
    return float(result.strip())


def main():
    compose()
    render()
    MANIFEST.write_text(json.dumps({
        "status": "ready_for_review_not_published",
        "sourceVideo": str(SOURCE_VIDEO),
        "music": str(BGM),
        "outputVideo": str(OUTPUT),
        "durationSeconds": round(probe_duration(OUTPUT), 3),
        "musicRights": "original_programmatic_composition",
        "mixing": "voice_led_with_sidechain_ducking",
    }, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
