from __future__ import annotations

import asyncio
import hashlib
import json
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, r"E:\pinmoo\workspace\vendor-video")
import edge_tts


ROOT = Path(r"E:\pinmoo")
SOURCE = Path(r"C:\Users\Administrator\Downloads\中考志愿填报风险_v1.mp4")
OUT = ROOT / "outputs" / "zhongkao-risk-video-20260730"
VIDEO_DIR = OUT / "video"
AUDIO_DIR = OUT / "audio"
SUBTITLE_DIR = OUT / "subtitles"
COVER_DIR = OUT / "cover"
QA_DIR = OUT / "qa"

FFMPEG = Path(r"E:\ffmpeg-8.1.1-essentials_build\bin\ffmpeg.exe")
FFPROBE = Path(r"E:\ffmpeg-8.1.1-essentials_build\bin\ffprobe.exe")
FONT = Path(r"C:\Windows\Fonts\msyh.ttc")
FONT_BOLD = Path(r"C:\Windows\Fonts\msyhbd.ttc")
VOICE_NAME = "zh-CN-YunxiNeural"
SOURCE_MUSIC = ROOT / "outputs" / "zhongkao-promo-video-30s-20260728" / "audio" / "广州中考志愿-家长痛点版-原创紧张递进配乐.wav"

NARRATION = "分数够，不代表一定录取。高中报考顺序填错，也可能连续落选。正式提交前，先模拟一次。"
SEGMENTS = [
    "分数够，不代表一定录取。",
    "高中报考顺序填错，也可能连续落选。",
    "正式提交前，先模拟一次。",
]

VOICE_RAW = AUDIO_DIR / "中考志愿填报风险-男声原始.mp3"
VOICE = AUDIO_DIR / "中考志愿填报风险-10秒男声.wav"
MUSIC = AUDIO_DIR / "中考志愿填报风险-10秒配乐.wav"
MIX = AUDIO_DIR / "中考志愿填报风险-最终混音.m4a"
SRT = SUBTITLE_DIR / "中考志愿填报风险-字幕.srt"
VIDEO = VIDEO_DIR / "中考志愿填报风险-口播配乐版-抖音-10秒-9x16.mp4"
COVER = COVER_DIR / "中考志愿填报风险-封面-1080x1440.png"


def duration(path: Path) -> float:
    value = subprocess.check_output([
        str(FFPROBE), "-v", "error", "-show_entries", "format=duration",
        "-of", "default=nw=1:nk=1", str(path),
    ], text=True)
    return float(value.strip())


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest().upper()


def srt_time(seconds: float) -> str:
    millis = round(seconds * 1000)
    hours, millis = divmod(millis, 3_600_000)
    minutes, millis = divmod(millis, 60_000)
    secs, millis = divmod(millis, 1000)
    return f"{hours:02}:{minutes:02}:{secs:02},{millis:03}"


async def synthesize_voice():
    await edge_tts.Communicate(NARRATION, VOICE_NAME, rate="+8%", volume="+0%").save(str(VOICE_RAW))
    raw_duration = duration(VOICE_RAW)
    target = 9.55
    tempo = raw_duration / target
    subprocess.run([
        str(FFMPEG), "-y", "-loglevel", "error", "-i", str(VOICE_RAW),
        "-filter:a", f"atempo={tempo:.6f}", "-ar", "48000", "-ac", "1", str(VOICE),
    ], check=True)


def build_music():
    subprocess.run([
        str(FFMPEG), "-y", "-loglevel", "error", "-i", str(SOURCE_MUSIC),
        "-af", "atrim=0:10,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.15,afade=t=out:st=8.7:d=1.3",
        "-t", "10", "-ar", "48000", "-ac", "2", str(MUSIC),
    ], check=True)


def write_srt():
    voice_duration = duration(VOICE)
    weights = [len(text) for text in SEGMENTS]
    cursor = 0.0
    rows = []
    for index, (text, weight) in enumerate(zip(SEGMENTS, weights), 1):
        end = voice_duration if index == len(SEGMENTS) else cursor + voice_duration * weight / sum(weights)
        rows.append(f"{index}\n{srt_time(cursor)} --> {srt_time(end)}\n{text}\n")
        cursor = end
    SRT.write_text("\n".join(rows), encoding="utf-8")


def escape_subtitle(path: Path):
    return str(path).replace("\\", "/").replace(":", "\\:")


def render_video():
    filters = (
        "[0:v]trim=duration=10,setpts=PTS-STARTPTS,scale=1080:1920:flags=lanczos,"
        f"subtitles='{escape_subtitle(SRT)}':force_style='FontName=Microsoft YaHei,FontSize=9,"
        "PrimaryColour=&H00FFFFFF,OutlineColour=&H00102030,BackColour=&HA5000000,BorderStyle=3,"
        "Outline=1,Shadow=0,MarginL=75,MarginR=75,MarginV=34,Alignment=2'[vout];"
        "[1:a]highpass=f=75,lowpass=f=11000,loudnorm=I=-16.5:TP=-1.5:LRA=6,"
        "pan=stereo|c0=c0|c1=c0,asplit=2[voice_main][voice_sc];"
        "[2:a]highpass=f=38,lowpass=f=8500,loudnorm=I=-25:TP=-5:LRA=10[music];"
        "[music][voice_sc]sidechaincompress=threshold=0.025:ratio=6:attack=10:release=260[ducked];"
        "[voice_main][ducked]amix=inputs=2:weights='1 0.88':normalize=0,"
        "loudnorm=I=-16.5:TP=-1.0:LRA=7,alimiter=limit=0.95[aout]"
    )
    subprocess.run([
        str(FFMPEG), "-y", "-i", str(SOURCE), "-i", str(VOICE), "-i", str(MUSIC),
        "-filter_complex", filters, "-map", "[vout]", "-map", "[aout]", "-t", "10",
        "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p", "-r", "30",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", str(VIDEO),
    ], check=True)
    subprocess.run([
        str(FFMPEG), "-y", "-loglevel", "error", "-i", str(VIDEO),
        "-vn", "-c:a", "aac", "-b:a", "192k", str(MIX),
    ], check=True)


def build_cover():
    frame = QA_DIR / "cover-source.png"
    subprocess.run([
        str(FFMPEG), "-y", "-loglevel", "error", "-ss", "2.2", "-i", str(SOURCE),
        "-frames:v", "1", "-vf", "scale=1080:1920:flags=lanczos", str(frame),
    ], check=True)
    source = Image.open(frame).convert("RGB")
    crop = source.crop((0, 160, 1080, 1600)).resize((1080, 1440), Image.Resampling.LANCZOS)
    overlay = Image.new("RGBA", crop.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    draw.rectangle((0, 0, 1080, 430), fill=(7, 24, 50, 220))
    draw.rounded_rectangle((64, 65, 230, 125), radius=30, fill="#5EEAD4")
    draw.text((147, 95), "广州中考", anchor="mm", font=ImageFont.truetype(str(FONT_BOLD), 26), fill="#071832")
    draw.text((64, 205), "分数够", font=ImageFont.truetype(str(FONT_BOLD), 82), fill="white")
    draw.text((64, 325), "不代表一定录取", font=ImageFont.truetype(str(FONT_BOLD), 66), fill="#FFD54A")
    draw.rounded_rectangle((64, 1260, 1016, 1370), radius=40, fill=(7, 24, 50, 225))
    draw.text((540, 1315), "顺序填错，也可能连续落选", anchor="mm", font=ImageFont.truetype(str(FONT_BOLD), 38), fill="white")
    Image.alpha_composite(crop.convert("RGBA"), overlay).convert("RGB").save(COVER, quality=96)


async def main():
    for directory in [VIDEO_DIR, AUDIO_DIR, SUBTITLE_DIR, COVER_DIR, QA_DIR]:
        directory.mkdir(parents=True, exist_ok=True)
    await synthesize_voice()
    build_music()
    write_srt()
    render_video()
    build_cover()
    (OUT / "manifest.json").write_text(json.dumps({
        "generatedAt": "2026-07-30T00:00:00+08:00",
        "status": "ready_for_review_not_published",
        "source": str(SOURCE),
        "sourceContainerDurationSeconds": round(duration(SOURCE), 3),
        "usedSourceRangeSeconds": [0, 10],
        "video": str(VIDEO),
        "cover": str(COVER),
        "subtitles": str(SRT),
        "voice": str(VOICE),
        "music": str(MUSIC),
        "narration": NARRATION,
        "durationSeconds": round(duration(VIDEO), 3),
        "videoSha256": sha256(VIDEO),
        "coverSha256": sha256(COVER),
    }, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    asyncio.run(main())
