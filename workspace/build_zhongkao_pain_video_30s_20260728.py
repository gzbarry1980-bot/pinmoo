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
OUT = ROOT / "outputs" / "zhongkao-promo-video-30s-20260728"
VIDEO_DIR = OUT / "video"
COVER_DIR = OUT / "cover"
SUBTITLE_DIR = OUT / "subtitles"
AUDIO_DIR = OUT / "audio"
COPY_DIR = OUT / "copy"
QA_DIR = OUT / "qa"
WORK_DIR = OUT / "work"

FFMPEG = Path(r"E:\ffmpeg-8.1.1-essentials_build\bin\ffmpeg.exe")
FFPROBE = Path(r"E:\ffmpeg-8.1.1-essentials_build\bin\ffprobe.exe")
FONT = Path(r"C:\Windows\Fonts\msyh.ttc")
FONT_BOLD = Path(r"C:\Windows\Fonts\msyhbd.ttc")
VOICE = "zh-CN-YunxiNeural"

NAVY = "#071832"
NAVY_2 = "#102B54"
WHITE = "#FFFFFF"
MIST = "#D9E8FF"
YELLOW = "#FFD54A"
RED = "#E14747"
CYAN = "#5EEAD4"
BLUE = "#3878F2"
MUTED = "#9CB4D5"

VIDEO = VIDEO_DIR / "广州中考志愿-家长痛点精华版-30秒-9x16.mp4"
COVER = COVER_DIR / "广州中考志愿-家长痛点版封面-1080x1440.png"
SRT = SUBTITLE_DIR / "广州中考志愿-家长痛点精华版-字幕.srt"
VOICE_RAW = AUDIO_DIR / "广州中考志愿-家长痛点精华版-男声原始.mp3"
VOICE_AUDIO = AUDIO_DIR / "广州中考志愿-家长痛点精华版-30秒男声.wav"
MIXED_AUDIO = AUDIO_DIR / "广州中考志愿-家长痛点精华版-混音.m4a"

SEGMENTS = [
    "天塌了！高分却去了后面志愿。",
    "不是孩子分数低，是志愿没填好。很多家长只盯学校最低分，却忽略了广州中考是梯度投档、志愿优先。",
    "同一梯度里，先看志愿顺序，再比成绩。",
    "第一志愿冲得太高，中间没有承接，保底又不稳，分数再好也可能被错误顺序拖累。",
    "志愿不是把学校填满，而是把每一分都安排好。",
    "想了解使用方式，私信我。",
]

SCENE_DURATIONS = [4.30, 4.60, 5.10, 6.30, 5.00, 6.45]
TRANSITION = 0.35
TARGET_DURATION = 30.0


def font(size: int, bold: bool = False):
    return ImageFont.truetype(str(FONT_BOLD if bold else FONT), size)


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


def gradient(size: tuple[int, int], top=(5, 17, 39), bottom=(16, 52, 102)):
    im = Image.new("RGB", size, top)
    px = im.load()
    for y in range(size[1]):
        ratio = y / max(1, size[1] - 1)
        color = tuple(round(top[i] * (1 - ratio) + bottom[i] * ratio) for i in range(3))
        for x in range(size[0]):
            px[x, y] = color
    return im


def wrap(draw: ImageDraw.ImageDraw, text: str, f: ImageFont.FreeTypeFont, width: int):
    rows, current = [], ""
    for char in text:
        candidate = current + char
        if current and draw.textbbox((0, 0), candidate, font=f)[2] > width:
            rows.append(current)
            current = char
        else:
            current = candidate
    if current:
        rows.append(current)
    return rows


def draw_centered(draw, text, y, f, fill, width=900, spacing=18):
    rows = wrap(draw, text, f, width)
    for row in rows:
        draw.text((540, y), row, anchor="ma", font=f, fill=fill)
        y += f.size + spacing
    return y


def brand(draw: ImageDraw.ImageDraw):
    draw.rounded_rectangle((64, 72, 164, 124), radius=26, fill=CYAN)
    draw.text((114, 98), "GZ", anchor="mm", font=font(25, True), fill=NAVY)
    draw.text((190, 98), "广州中考志愿模拟助手", anchor="lm", font=font(28, True), fill=WHITE)


def footer(draw: ImageDraw.ImageDraw, text="2026广州中考｜家长痛点提醒"):
    draw.line((64, 1805, 1016, 1805), fill="#31527F", width=2)
    draw.text((64, 1845), text, font=font(25), fill=MUTED)
    draw.text((1016, 1845), "品沐提供", anchor="ra", font=font(25), fill=MUTED)


def draw_scene(index: int, path: Path):
    im = gradient((1080, 1920))
    draw = ImageDraw.Draw(im)
    brand(draw)

    if index == 0:
        draw.rounded_rectangle((64, 265, 1016, 575), radius=46, fill=RED)
        draw.text((540, 360), "天塌了！", anchor="mm", font=font(108, True), fill=WHITE)
        draw.text((540, 490), "高分却去了后面志愿", anchor="mm", font=font(56, True), fill=WHITE)
        draw.rounded_rectangle((110, 740, 970, 1160), radius=48, fill=NAVY_2, outline="#527DBB", width=3)
        draw.text((540, 825), "孩子分数不低", anchor="mm", font=font(50, True), fill=MIST)
        draw.text((540, 950), "问题出在", anchor="mm", font=font(44), fill=MUTED)
        draw.text((540, 1070), "志愿顺序", anchor="mm", font=font(82, True), fill=YELLOW)
        draw.text((540, 1295), "不是分数够不够，而是顺序对不对", anchor="mm", font=font(34, True), fill=WHITE)
    elif index == 1:
        draw.text((64, 270), "家长最容易踩的坑", font=font(58, True), fill=WHITE)
        draw.rounded_rectangle((64, 410, 1016, 760), radius=46, fill="#F7FAFF")
        draw.text((120, 485), "只盯", font=font(44, True), fill=NAVY)
        draw.text((120, 600), "学校最低分", font=font(76, True), fill=RED)
        draw.rounded_rectangle((64, 845, 1016, 1220), radius=46, fill=NAVY_2, outline="#476EA5", width=3)
        draw.text((120, 925), "却忽略", font=font(44, True), fill=MUTED)
        draw.text((120, 1040), "广州中考的投档顺序", font=font(58, True), fill=YELLOW)
        draw.text((120, 1140), "最低分不是唯一判断依据", font=font(33), fill=MIST)
    elif index == 2:
        draw.text((64, 270), "录取先后，顺序很关键", font=font(58, True), fill=WHITE)
        items = [("01", "梯度投档", BLUE), ("02", "志愿优先", RED), ("03", "再比成绩", "#168B64")]
        y = 460
        for num, text, color in items:
            draw.rounded_rectangle((90, y, 990, y + 220), radius=42, fill="#F7FAFF")
            draw.ellipse((130, y + 54, 242, y + 166), fill=color)
            draw.text((186, y + 110), num, anchor="mm", font=font(34, True), fill=WHITE)
            draw.text((300, y + 110), text, anchor="lm", font=font(58, True), fill=NAVY)
            y += 270
        draw.text((540, 1350), "同一梯度里，志愿顺序会影响去向", anchor="mm", font=font(36, True), fill=YELLOW)
    elif index == 3:
        draw.text((64, 270), "一张志愿表，三个断点", font=font(58, True), fill=WHITE)
        pains = [
            ("第一志愿冲得太高", "开头失去承接", RED),
            ("中间梯度断层", "分数没有落点", YELLOW),
            ("保底并不稳", "最后一道防线失效", CYAN),
        ]
        y = 425
        for heading, detail, color in pains:
            draw.rounded_rectangle((64, y, 1016, y + 300), radius=42, fill=NAVY_2, outline="#456B9D", width=3)
            draw.rounded_rectangle((96, y + 55, 122, y + 245), radius=12, fill=color)
            draw.text((165, y + 85), heading, font=font(50, True), fill=WHITE)
            draw.text((165, y + 180), detail, font=font(34), fill=MUTED)
            y += 345
        draw.text((540, 1540), "顺序错一步，分数优势也可能被削弱", anchor="mm", font=font(36, True), fill=YELLOW)
    elif index == 4:
        draw.text((540, 300), "志愿不是", anchor="mm", font=font(54, True), fill=MUTED)
        draw.text((540, 430), "把学校填满", anchor="mm", font=font(82, True), fill=WHITE)
        draw.line((170, 555, 910, 555), fill=RED, width=16)
        draw.text((540, 760), "而是", anchor="mm", font=font(46, True), fill=MUTED)
        draw.rounded_rectangle((64, 875, 1016, 1225), radius=52, fill=YELLOW)
        draw.text((540, 1050), "把每一分都安排好", anchor="mm", font=font(70, True), fill=NAVY)
        draw.text((540, 1390), "范围、顺序、承接、保底，一个都不能少", anchor="mm", font=font(34, True), fill=MIST)
    else:
        draw.text((540, 335), "别等录取结果出来", anchor="mm", font=font(62, True), fill=WHITE)
        draw.text((540, 455), "才发现志愿顺序错了", anchor="mm", font=font(62, True), fill=YELLOW)
        draw.rounded_rectangle((64, 700, 1016, 1010), radius=52, fill=CYAN)
        draw.text((540, 805), "想了解使用方式", anchor="mm", font=font(54, True), fill=NAVY)
        draw.text((540, 925), "私信我", anchor="mm", font=font(82, True), fill=NAVY)
        draw.rounded_rectangle((64, 1190, 1016, 1455), radius=42, fill=NAVY_2, outline="#4C75AD", width=3)
        draw.text((540, 1270), "内容为家长风险提醒", anchor="mm", font=font(34, True), fill=WHITE)
        draw.text((540, 1360), "请以当年广州招考官方信息为准", anchor="mm", font=font(32), fill=MUTED)

    footer(draw)
    im.save(path, quality=96)


def draw_cover(path: Path):
    im = gradient((1080, 1440))
    draw = ImageDraw.Draw(im)
    brand(draw)
    draw.rounded_rectangle((64, 235, 1016, 555), radius=46, fill=RED)
    draw.text((540, 330), "天塌了！", anchor="mm", font=font(104, True), fill=WHITE)
    draw.text((540, 465), "高分却去了后面志愿", anchor="mm", font=font(55, True), fill=WHITE)
    draw.text((540, 735), "志愿顺序", anchor="mm", font=font(94, True), fill=YELLOW)
    draw.text((540, 855), "错一步，结果可能差很远", anchor="mm", font=font(52, True), fill=WHITE)
    draw.rounded_rectangle((120, 1010, 960, 1170), radius=40, fill="#F7FAFF")
    draw.text((540, 1090), "广州中考家长避坑提醒", anchor="mm", font=font(40, True), fill=NAVY)
    draw.text((64, 1325), "30秒精华版", font=font(30, True), fill=MIST)
    draw.text((1016, 1325), "品沐提供", anchor="ra", font=font(26), fill=MUTED)
    im.save(path, quality=96)


def srt_time(seconds: float) -> str:
    millis = round(seconds * 1000)
    hours, millis = divmod(millis, 3_600_000)
    minutes, millis = divmod(millis, 60_000)
    secs, millis = divmod(millis, 1000)
    return f"{hours:02}:{minutes:02}:{secs:02},{millis:03}"


def caption_parts(text: str, max_chars=16):
    parts, current = [], ""
    for char in text:
        current += char
        if char in "，。；：！？" and len(current) >= 6:
            parts.append(current)
            current = ""
        elif len(current) >= max_chars:
            parts.append(current)
            current = ""
    if current:
        parts.append(current)
    return parts


def split_caption(text: str, line_chars=9):
    return text if len(text) <= line_chars else text[:line_chars] + "\n" + text[line_chars:]


def write_srt():
    voice_duration = duration(VOICE_AUDIO)
    weights = [max(3, len(x)) for x in SEGMENTS]
    cursor, cue_index, rows = 0.0, 1, []
    for segment_index, (text, weight) in enumerate(zip(SEGMENTS, weights), 1):
        segment_end = voice_duration if segment_index == len(SEGMENTS) else cursor + voice_duration * weight / sum(weights)
        parts = caption_parts(text)
        part_weights = [max(2, len(x)) for x in parts]
        part_cursor = cursor
        for part_index, (part, part_weight) in enumerate(zip(parts, part_weights), 1):
            part_end = segment_end if part_index == len(parts) else part_cursor + (segment_end - cursor) * part_weight / sum(part_weights)
            rows.append(f"{cue_index}\n{srt_time(part_cursor)} --> {srt_time(part_end)}\n{split_caption(part)}\n")
            cue_index += 1
            part_cursor = part_end
        cursor = segment_end
    SRT.write_text("\n".join(rows), encoding="utf-8")


async def synthesize():
    await edge_tts.Communicate("".join(SEGMENTS), VOICE, rate="+12%", volume="+0%").save(str(VOICE_RAW))
    raw_duration = duration(VOICE_RAW)
    tempo = raw_duration / 29.45
    subprocess.run([
        str(FFMPEG), "-y", "-i", str(VOICE_RAW), "-filter:a", f"atempo={tempo:.6f}",
        "-ar", "48000", "-ac", "1", str(VOICE_AUDIO),
    ], check=True)


def escape_subtitle(path: Path):
    return str(path).replace("\\", "/").replace(":", "\\:")


def build_video(scene_paths: list[Path]):
    command = [str(FFMPEG), "-y"]
    for image, span in zip(scene_paths, SCENE_DURATIONS):
        command += ["-loop", "1", "-t", f"{span + 0.2:.3f}", "-i", str(image)]
    command += ["-i", str(VOICE_AUDIO)]
    command += ["-f", "lavfi", "-t", str(TARGET_DURATION), "-i", "sine=frequency=110:sample_rate=48000"]
    command += ["-f", "lavfi", "-t", str(TARGET_DURATION), "-i", "sine=frequency=164.81:sample_rate=48000"]

    filters = []
    for idx, span in enumerate(SCENE_DURATIONS):
        zoom = "min(zoom+0.0005,1.055)" if idx % 2 == 0 else "if(lte(zoom,1.0),1.05,max(1.0,zoom-0.00045))"
        filters.append(
            f"[{idx}:v]fps=30,scale=1080:1920,zoompan=z='{zoom}':x='iw/2-(iw/zoom/2)':"
            f"y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30,trim=duration={span:.3f},setpts=PTS-STARTPTS[v{idx}]"
        )
    previous, elapsed = "v0", SCENE_DURATIONS[0]
    for idx in range(1, len(scene_paths)):
        label = f"x{idx}"
        offset = elapsed - TRANSITION * idx
        filters.append(f"[{previous}][v{idx}]xfade=transition=fade:duration={TRANSITION}:offset={offset:.3f}[{label}]")
        previous = label
        elapsed += SCENE_DURATIONS[idx]
    filters.append(
        f"[{previous}]subtitles='{escape_subtitle(SRT)}':force_style='FontName=Microsoft YaHei,FontSize=9,"
        "PrimaryColour=&H00FFFFFF,OutlineColour=&H00102030,BackColour=&HA0000000,BorderStyle=3,Outline=1,"
        "Shadow=0,MarginL=80,MarginR=80,MarginV=28,Alignment=2'[vout]"
    )
    voice_input = len(scene_paths)
    tone1, tone2 = voice_input + 1, voice_input + 2
    filters += [
        f"[{voice_input}:a]highpass=f=75,lowpass=f=11000,loudnorm=I=-17:TP=-1.5:LRA=6[voice]",
        f"[{tone1}:a]volume=0.018,afade=t=in:st=0:d=0.8,afade=t=out:st=28.3:d=1.7[t1]",
        f"[{tone2}:a]volume=0.010,afade=t=in:st=0:d=0.8,afade=t=out:st=28.3:d=1.7[t2]",
        "[t1][t2]amix=inputs=2:normalize=0,lowpass=f=1200,aecho=0.7:0.4:90:0.12[bgm]",
        "[voice][bgm]amix=inputs=2:weights='1 0.38':normalize=0,alimiter=limit=0.95[aout]",
    ]
    command += [
        "-filter_complex", ";".join(filters), "-map", "[vout]", "-map", "[aout]",
        "-t", str(TARGET_DURATION), "-c:v", "libx264", "-preset", "medium", "-crf", "19",
        "-pix_fmt", "yuv420p", "-r", "30", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
        "-movflags", "+faststart", str(VIDEO),
    ]
    subprocess.run(command, check=True)
    subprocess.run([str(FFMPEG), "-y", "-i", str(VIDEO), "-vn", "-c:a", "aac", "-b:a", "192k", str(MIXED_AUDIO)], check=True)


def write_copy():
    text = """# 广州中考志愿｜家长痛点30秒版发布文案

发布状态：`ready_for_review_not_published`

## 抖音

标题：高分却去了后面志愿，问题可能出在顺序

正文：
广州中考不能只盯学校最低分。同一梯度里，志愿顺序会直接影响投档先后；开头冲得太高、中间没有承接、保底不稳，都可能削弱分数优势。

志愿不是把学校填满，而是把每一分都安排好。

想了解使用方式，私信我。

#广州中考 #中考志愿 #广州家长 #志愿填报

## 小红书视频

标题：广州中考家长最怕的，不是孩子分数不够

正文：
真正容易被忽略的是志愿顺序：只看最低分、不看梯度；第一志愿冲得太高，中间没有承接；以为有保底，实际并不稳。

本视频为家长风险提醒，请以当年广州招考官方信息为准。

需要体验入口，私信咨询。

#广州中考 #中考家长 #广州升学 #志愿规划

## 微信视频号

标题：30秒看懂广州中考志愿顺序风险

描述：
广州中考采用多梯度投档录取。分数重要，梯度、顺序、承接和保底同样不能忽略。本内容为风险提醒，请以当年官方信息为准。

了解系统能力，私信获取说明。

#广州中考 #中考志愿 #广州升学

## 发布提醒

- 视频含 AI 生成男声与程序化背景音乐，平台如提供相关声明选项，应如实勾选。
- 未获得明确发布授权前，仅作为本地待审素材，不执行外部发布。
"""
    (COPY_DIR / "发布文案.md").write_text(text, encoding="utf-8")


def write_sources():
    text = """# 文案事实依据

- 官方来源：广州市招生考试委员会办公室《2026年广州市中考志愿填报问答》
- 官方链接：https://gzzk.gz.gov.cn/gkmlpt/content/10/10811/post_10811628.html
- 已核验规则：广州中考采用多梯度投档录取，遵循“梯度投档、志愿优先、择优录取”；同一梯度内先投第一志愿，再依次投后续志愿。
- 视频未使用真实考生案例、学校排名、录取概率或具体学校结论。
"""
    (OUT / "文案事实依据.md").write_text(text, encoding="utf-8")


async def main():
    for directory in [VIDEO_DIR, COVER_DIR, SUBTITLE_DIR, AUDIO_DIR, COPY_DIR, QA_DIR, WORK_DIR]:
        directory.mkdir(parents=True, exist_ok=True)
    scene_paths = []
    for index in range(6):
        path = WORK_DIR / f"pain-scene-{index + 1:02}.png"
        draw_scene(index, path)
        scene_paths.append(path)
    draw_cover(COVER)
    await synthesize()
    write_srt()
    build_video(scene_paths)
    write_copy()
    write_sources()
    manifest = {
        "generatedAt": "2026-07-28T00:00:00+08:00",
        "status": "ready_for_review_not_published",
        "video": str(VIDEO),
        "cover": str(COVER),
        "subtitles": str(SRT),
        "voice": VOICE,
        "durationSeconds": round(duration(VIDEO), 3),
        "videoSha256": sha256(VIDEO),
        "coverSha256": sha256(COVER),
        "publicCta": "想了解使用方式，私信我",
        "creative": "parent_pain_no_product_demo",
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    asyncio.run(main())
