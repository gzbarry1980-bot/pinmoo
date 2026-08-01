from __future__ import annotations

import asyncio
import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, r"E:\pinmoo\workspace\vendor-video")
import edge_tts


ROOT = Path(r"E:\pinmoo")
OUT = ROOT / "outputs" / "zhongkao-promo-video-20260728"
VIDEO_DIR = OUT / "video"
COVER_DIR = OUT / "cover"
SUBTITLE_DIR = OUT / "subtitles"
AUDIO_DIR = OUT / "audio"
COPY_DIR = OUT / "copy"
MATERIALS_DIR = OUT / "materials"
QA_DIR = OUT / "qa"
WORK_DIR = OUT / "work"

PREPARED = ROOT / "outputs" / "zhongkao-videos-v2-20260724" / "work" / "prepared"
PREVIEWS = ROOT / "guangzhou-zhongkao" / "assets" / "previews"
FFMPEG = Path(r"E:\ffmpeg-8.1.1-essentials_build\bin\ffmpeg.exe")
FFPROBE = Path(r"E:\ffmpeg-8.1.1-essentials_build\bin\ffprobe.exe")
FONT = Path(r"C:\Windows\Fonts\msyh.ttc")
FONT_BOLD = Path(r"C:\Windows\Fonts\msyhbd.ttc")
VOICE = "zh-CN-YunxiNeural"

NAVY = "#0B1F3A"
BLUE = "#155EEF"
CYAN = "#5EEAD4"
LIGHT = "#F3F7FD"
WHITE = "#FFFFFF"
INK = "#10213D"
MUTED = "#61718A"
YELLOW = "#FFD54A"
GREEN = "#168B64"
RED = "#C9363E"

VIDEO = VIDEO_DIR / "广州中考志愿模拟器-真实功能演示-9x16.mp4"
COVER = COVER_DIR / "广州中考志愿模拟器-封面-1080x1440.png"
SRT = SUBTITLE_DIR / "广州中考志愿模拟器-字幕.srt"
VOICE_AUDIO = AUDIO_DIR / "广州中考志愿模拟器-自然男声.mp3"
MIXED_AUDIO = AUDIO_DIR / "广州中考志愿模拟器-自然男声与背景音乐.m4a"

SEGMENTS = [
    "只看学校名单，不看志愿顺序和风险结构，方案可能越排越乱。",
    "这是广州中考志愿模拟助手。三种入口，对应三种真实情况。",
    "只有大概分数，进入方向版。填估分区间、考生类别、升学区域和偏好，系统会生成可继续修改的冲、匹配、保底方向草案。",
    "已经有目标学校，进入目标校版。系统结合历年同口径录取门槛、位次和波动，给出参考分值方向、机会区间和志愿位置建议。",
    "已经排好计划，进入求证版。系统逐项核对资格、槽位利用、冲稳保结构、志愿顺序和保底完整性。",
    "分析结果会同时展示方案合理度、逐志愿机会区间、预计去向和可执行调整建议，不把一个分数简单当成录取结论。",
    "系统不要求填写姓名、准考证号或联系方式。草稿保存在当前浏览器，也支持导出匿名文件和打印另存。",
    "画面中的分数、学校和结果均为功能演示，不对应任何真实考生。",
    "系统依据公开政策与历史录取数据进行统计估计，不代表官方录取结果。想了解使用方式，私信我。",
]

SCENE_SOURCES = [
    None,
    PREPARED / "02-three-modes.png",
    PREPARED / "03-direction-form.png",
    PREVIEWS / "direction-result.webp",
    PREVIEWS / "target-result.webp",
    PREPARED / "11-volunteer-plan.png",
    PREVIEWS / "analysis-score.webp",
    PREPARED / "13-improvements.png",
    None,
]

SCENE_TITLES = [
    "学校名单排得满，不等于风险看得清",
    "三种入口，对应三种真实情况",
    "只有估分｜先找方向",
    "方向版｜生成可修改的草案",
    "有目标校｜倒推参考方向",
    "已有计划｜先检查结构",
    "求证版｜把风险拆开看",
    "隐私与输出｜匿名、本地、可导出",
    "了解系统能力｜私信获取说明",
]

SCENE_LABELS = [
    "广州中考志愿模拟助手",
    "方向版 · 目标校版 · 求证版",
    "估分区间 · 考生类别 · 升学区域 · 偏好",
    "冲刺 · 匹配 · 保底｜机会区间与置信度",
    "录取门槛 · 位次 · 波动｜参考分值与位置",
    "资格 · 槽位 · 结构 · 顺序 · 保底",
    "合理度 · 逐志愿机会 · 预计去向 · 调整建议",
    "不收集姓名、准考证号或联系方式",
    "统计估计｜不代表官方录取结果｜仅供参考",
]


def fnt(size: int, bold: bool = False):
    return ImageFont.truetype(str(FONT_BOLD if bold else FONT), size)


def gradient(size: tuple[int, int], top=(8, 25, 58), bottom=(18, 92, 245)):
    im = Image.new("RGB", size, top)
    px = im.load()
    for y in range(size[1]):
        ratio = y / max(1, size[1] - 1)
        color = tuple(round(top[i] * (1 - ratio) + bottom[i] * ratio) for i in range(3))
        for x in range(size[0]):
            px[x, y] = color
    return im


def wrap(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, width: int):
    rows: list[str] = []
    current = ""
    for char in text:
        test = current + char
        if current and draw.textbbox((0, 0), test, font=font)[2] > width:
            rows.append(current)
            current = char
        else:
            current = test
    if current:
        rows.append(current)
    return rows


def draw_lines(draw, xy, text, font, fill, width, spacing=12, anchor="la"):
    x, y = xy
    for row in wrap(draw, text, font, width):
        draw.text((x, y), row, font=font, fill=fill, anchor=anchor)
        y += font.size + spacing
    return y


def brand(draw, y=64, dark=False):
    fg = INK if dark else WHITE
    draw.rounded_rectangle((64, y, 164, y + 52), radius=26, fill=CYAN)
    draw.text((114, y + 26), "GZ", anchor="mm", font=fnt(25, True), fill=NAVY)
    draw.text((190, y + 26), "广州中考志愿模拟助手", anchor="lm", font=fnt(28, True), fill=fg)


def crop_fill(source: Path, width: int, height: int):
    im = Image.open(source).convert("RGB")
    ratio = max(width / im.width, height / im.height)
    resized = im.resize((round(im.width * ratio), round(im.height * ratio)), Image.Resampling.LANCZOS)
    left = max(0, (resized.width - width) // 2)
    top = max(0, (resized.height - height) // 2)
    return resized.crop((left, top, left + width, top + height))


def scene_card(index: int, source: Path | None, title: str, label: str, path: Path):
    if index in (0, 8):
        im = gradient((1080, 1920), (7, 24, 54), (16, 83, 210))
        draw = ImageDraw.Draw(im)
        brand(draw, 86)
        if index == 0:
            draw.rounded_rectangle((64, 345, 1016, 1035), radius=48, fill="#122A52", outline="#3F6DB0", width=3)
            draw.text((100, 410), "志愿表填满了", font=fnt(72, True), fill=WHITE)
            draw.text((100, 555), "风险就看清了吗？", font=fnt(78, True), fill=YELLOW)
            draw.rounded_rectangle((100, 755, 980, 900), radius=34, fill=RED)
            draw.text((540, 827), "不一定", anchor="mm", font=fnt(56, True), fill=WHITE)
            draw_lines(draw, (100, 1120), "真正要看的，是资格、顺序和整张方案的风险结构。", fnt(40, True), "#D9E8FF", 880, 18)
        else:
            draw.text((64, 360), "看清方案结构", font=fnt(74, True), fill=WHITE)
            draw.text((64, 490), "再决定怎么调整", font=fnt(74, True), fill=YELLOW)
            draw.rounded_rectangle((64, 760, 1016, 1210), radius=46, fill=WHITE)
            for n, text in enumerate(["统计估计，不代表官方录取结果", "画面为功能演示，不对应真实考生", "以当年广州招考信息为准", "本系统仅供参考"]):
                draw.text((540, 850 + n * 88), text, anchor="mm", font=fnt(34, True), fill=INK if n < 2 else MUTED)
            draw.rounded_rectangle((64, 1390, 1016, 1515), radius=36, fill=CYAN)
            draw.text((540, 1452), "想了解使用方式｜私信我", anchor="mm", font=fnt(36, True), fill=NAVY)
            draw.text((64, 1635), "需要体验入口，私信咨询", font=fnt(29), fill="#D7E7FF")
            draw.text((64, 1690), "了解系统能力，私信获取说明", font=fnt(29), fill="#D7E7FF")
    else:
        im = Image.new("RGB", (1080, 1920), LIGHT)
        draw = ImageDraw.Draw(im)
        brand(draw, 64, dark=True)
        draw.text((64, 160), title, font=fnt(52, True), fill=INK)
        draw_lines(draw, (64, 232), label, fnt(28), MUTED, 940, 10)
        viewport = (56, 355, 1024, 1710)
        screenshot = crop_fill(source, viewport[2] - viewport[0], viewport[3] - viewport[1])
        im.paste(screenshot, (viewport[0], viewport[1]))
        draw.rounded_rectangle(viewport, radius=30, outline="#B8C8DC", width=4)
        draw.rounded_rectangle((76, 385, 438, 448), radius=28, fill="#10213D")
        draw.text((257, 416), "演示数据｜功能展示", anchor="mm", font=fnt(24, True), fill=WHITE)
        draw.rounded_rectangle((64, 1760, 1016, 1840), radius=30, fill=NAVY)
        draw.text((540, 1800), label, anchor="mm", font=fnt(25, True), fill=WHITE)
    im.save(path, quality=95)


def cover(path: Path):
    im = gradient((1080, 1440), (7, 24, 54), (18, 92, 245))
    draw = ImageDraw.Draw(im)
    brand(draw, 70)
    draw.rounded_rectangle((64, 220, 1016, 690), radius=44, fill="#122B54", outline="#4C78BD", width=3)
    draw.text((100, 275), "志愿表填满了", font=fnt(72, True), fill=WHITE)
    draw.text((100, 405), "风险就看清了吗？", font=fnt(74, True), fill=YELLOW)
    draw.rounded_rectangle((100, 550, 970, 645), radius=32, fill=RED)
    draw.text((535, 597), "不一定", anchor="mm", font=fnt(40, True), fill=WHITE)
    draw.rounded_rectangle((64, 765, 1016, 1165), radius=42, fill=WHITE)
    rows = [
        ("方向版", "只有估分，先找方向"),
        ("目标校版", "有目标校，倒推参考"),
        ("求证版", "已有计划，检查结构"),
    ]
    y = 820
    for heading, detail in rows:
        draw.rounded_rectangle((100, y, 330, y + 72), radius=28, fill=BLUE)
        draw.text((215, y + 36), heading, anchor="mm", font=fnt(27, True), fill=WHITE)
        draw.text((380, y + 36), detail, anchor="lm", font=fnt(31, True), fill=INK)
        y += 108
    draw.text((64, 1275), "真实功能演示｜广州中考志愿模拟助手", font=fnt(30, True), fill="#D8E8FF")
    draw.text((1016, 1340), "品沐提供", anchor="ra", font=fnt(24), fill="#BCD3F2")
    im.save(path)


def duration(path: Path):
    value = subprocess.check_output([
        str(FFPROBE), "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path)
    ], text=True)
    return float(value.strip())


def srt_time(seconds: float):
    millis = round(seconds * 1000)
    hours, millis = divmod(millis, 3_600_000)
    minutes, millis = divmod(millis, 60_000)
    secs, millis = divmod(millis, 1000)
    return f"{hours:02}:{minutes:02}:{secs:02},{millis:03}"


def caption_parts(text: str, max_chars=18):
    parts = []
    current = ""
    for char in text:
        current += char
        if char in "，。；：！？" and len(current) >= 7:
            parts.append(current)
            current = ""
        elif len(current) >= max_chars:
            parts.append(current)
            current = ""
    if current:
        parts.append(current)
    return parts


def split_caption(text: str, line_chars=10):
    if len(text) <= line_chars:
        return text
    return text[:line_chars] + "\n" + text[line_chars:]


def write_srt(audio_duration: float):
    weights = [max(4, len(text.replace("，", "").replace("。", ""))) for text in SEGMENTS]
    cursor = 0.0
    rows = []
    cue_index = 1
    for segment_index, (text, weight) in enumerate(zip(SEGMENTS, weights), 1):
        segment_end = audio_duration if segment_index == len(SEGMENTS) else cursor + audio_duration * weight / sum(weights)
        parts = caption_parts(text)
        part_weights = [max(2, len(part.replace("，", "").replace("。", ""))) for part in parts]
        part_cursor = cursor
        for part_index, (part, part_weight) in enumerate(zip(parts, part_weights), 1):
            part_end = segment_end if part_index == len(parts) else part_cursor + (segment_end - cursor) * part_weight / sum(part_weights)
            rows.append(f"{cue_index}\n{srt_time(part_cursor)} --> {srt_time(part_end)}\n{split_caption(part)}\n")
            cue_index += 1
            part_cursor = part_end
        cursor = segment_end
    SRT.write_text("\n".join(rows), encoding="utf-8")


async def synthesize():
    tts = edge_tts.Communicate("".join(SEGMENTS), VOICE, rate="+10%", volume="+0%")
    await tts.save(str(VOICE_AUDIO))


def escape_subtitle(path: Path):
    return str(path).replace("\\", "/").replace(":", "\\:")


def build_video(scene_paths: list[Path]):
    total = duration(VOICE_AUDIO)
    transition = 0.32
    weights = [max(4, len(text)) for text in SEGMENTS]
    raw_total = total + transition * (len(scene_paths) - 1)
    scale = raw_total / sum(weights)
    spans = [weight * scale for weight in weights]

    command = [str(FFMPEG), "-y"]
    for image, span in zip(scene_paths, spans):
        command += ["-loop", "1", "-t", f"{span + 0.5:.3f}", "-i", str(image)]
    command += ["-i", str(VOICE_AUDIO)]
    command += ["-f", "lavfi", "-t", f"{total:.3f}", "-i", "sine=frequency=220:sample_rate=48000"]
    command += ["-f", "lavfi", "-t", f"{total:.3f}", "-i", "sine=frequency=277.18:sample_rate=48000"]
    command += ["-f", "lavfi", "-t", f"{total:.3f}", "-i", "sine=frequency=329.63:sample_rate=48000"]

    filters = []
    for idx, span in enumerate(spans):
        zoom = "min(zoom+0.00022,1.035)" if idx % 2 == 0 else "if(lte(zoom,1.0),1.035,max(1.0,zoom-0.00022))"
        filters.append(
            f"[{idx}:v]fps=30,scale=1080:1920,zoompan=z='{zoom}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
            f"d=1:s=1080x1920:fps=30,trim=duration={span:.3f},setpts=PTS-STARTPTS[v{idx}]"
        )
    previous = "v0"
    elapsed = spans[0]
    for idx in range(1, len(scene_paths)):
        label = f"x{idx}"
        offset = elapsed - transition * idx
        filters.append(f"[{previous}][v{idx}]xfade=transition=fade:duration={transition}:offset={offset:.3f}[{label}]")
        previous = label
        elapsed += spans[idx]
    filters.append(
        f"[{previous}]subtitles='{escape_subtitle(SRT)}':force_style='FontName=Microsoft YaHei,FontSize=9,"
        "PrimaryColour=&H00FFFFFF,OutlineColour=&H00102030,BackColour=&H96000000,BorderStyle=3,Outline=1,"
        "Shadow=0,MarginL=80,MarginR=80,MarginV=28,Alignment=2'[vout]"
    )

    voice_input = len(scene_paths)
    tone1, tone2, tone3 = voice_input + 1, voice_input + 2, voice_input + 3
    filters += [
        f"[{voice_input}:a]highpass=f=75,lowpass=f=11000,loudnorm=I=-17:TP=-1.5:LRA=7[voice]",
        f"[{tone1}:a]volume=0.020,afade=t=in:st=0:d=1.2,afade=t=out:st={max(0,total-1.8):.3f}:d=1.8[t1]",
        f"[{tone2}:a]volume=0.013,afade=t=in:st=0:d=1.2,afade=t=out:st={max(0,total-1.8):.3f}:d=1.8[t2]",
        f"[{tone3}:a]volume=0.010,afade=t=in:st=0:d=1.2,afade=t=out:st={max(0,total-1.8):.3f}:d=1.8[t3]",
        "[t1][t2][t3]amix=inputs=3:normalize=0,lowpass=f=1800,aecho=0.6:0.4:50:0.16[bgm]",
        "[voice][bgm]amix=inputs=2:weights='1 0.42':normalize=0,alimiter=limit=0.95[aout]",
    ]
    command += [
        "-filter_complex", ";".join(filters), "-map", "[vout]", "-map", "[aout]",
        "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p", "-r", "30",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", "-shortest", str(VIDEO),
    ]
    subprocess.run(command, check=True)
    subprocess.run([
        str(FFMPEG), "-y", "-i", str(VIDEO), "-vn", "-c:a", "aac", "-b:a", "192k", str(MIXED_AUDIO)
    ], check=True)


def sha256(path: Path):
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest().upper()


def write_copy():
    text = """# 广州中考志愿模拟助手｜竖屏视频发布文案

发布状态：`ready_for_review_not_published`

## 抖音

标题：志愿表填满了，风险就看清了吗？

正文：
广州中考志愿不能只看学校名单。只有估分、已有目标校、已经排好计划，对应不同的分析入口。

方向版先生成可修改的方向草案；目标校版倒推参考分值与志愿位置；求证版再检查资格、顺序、结构和保底完整性。

视频画面为功能演示，不对应任何真实考生。系统结果为依据公开政策与历史录取数据的统计估计，不代表官方录取结果，仅供参考。

想了解使用方式，私信我。

#广州中考 #中考志愿 #广州升学 #志愿填报 #产品演示

## 小红书视频

标题：广州中考志愿，别只排学校名单

正文：
很多方案的问题，不是学校不够多，而是资格、志愿顺序、冲稳保结构和保底没有放在一起检查。

这条视频只演示系统真实功能：
1. 只有估分，先找方向；
2. 已有目标校，倒推参考方向；
3. 已有计划，检查整张表的结构与风险。

画面中的分数、学校和结果均为演示数据，不对应真实考生。统计估计不代表官方录取结果，请以当年广州招考信息为准。

需要体验入口，私信咨询。

#广州中考 #中考家长 #中考志愿填报 #广州升学 #志愿规划

## 微信视频号

标题：三种情况，怎么用广州中考志愿模拟助手？

描述：
从估分找方向、目标校倒推参考，到已有方案求证，视频完整演示三个实际入口。系统不要求填写姓名、准考证号或联系方式，结果为统计估计，不代表官方录取结果，仅供参考。

了解系统能力，私信获取说明。

#广州中考 #中考志愿 #广州升学

## 发布提醒

- 视频含 AI 生成男声与程序化背景音乐，平台如提供相关声明选项，应如实勾选。
- 未获得明确发布授权前，仅可上传为本地待审素材，不执行外部发布。
"""
    (COPY_DIR / "发布文案.md").write_text(text, encoding="utf-8")


def write_materials(scene_paths: list[Path]):
    sources = "\n".join(f"- `{path}`" for path in [p for p in SCENE_SOURCES if p])
    text = f"""# 素材清单

## 成片组成

- 竖屏成片：`{VIDEO}`
- 封面：`{COVER}`
- 字幕：`{SRT}`
- 自然男声：`{VOICE_AUDIO}`
- 混音：`{MIXED_AUDIO}`
- 发布文案：`{COPY_DIR / '发布文案.md'}`

## 真实产品画面来源

{sources}

## 制作说明

- 画幅：1080×1920，30fps，H.264/AAC。
- 男声：Microsoft `zh-CN-YunxiNeural`，全新口播。
- 背景音乐：程序化三和弦氛围底音，固定低电平混音，不压人声。
- 所有产品能力均来自当前页面与代码中已实现的方向版、目标校版、求证版及匿名导出/打印功能。
- 画面中的分数、学校和结果已标注为“演示数据｜功能展示”。
"""
    (MATERIALS_DIR / "素材清单.md").write_text(text, encoding="utf-8")


def write_stopped_assets():
    old = ROOT / "outputs" / "zhongkao-campaign-20260727"
    text = f"""# 旧素材停用清单

状态：`停用`

以下旧素材含本轮公开视频禁用的交易导向表述，保留原文件，不覆盖、不删除：

- `{old / 'platform-copy.md'}`
- `{old / 'qa-report.md'}`
- `{old / 'manifest.json'}`
- `{old / 'video' / '广州中考志愿规则-字幕.srt'}`
- `{old / 'video' / '广州中考志愿规则-自然男声.mp3'}`
- `{old / 'video' / '抖音-广州中考过线为何仍会落选-9x16.mp4'}`
- `{old / 'video' / '视频号-广州中考过线为何仍会落选-9x16.mp4'}`
- `{old / 'zhongkao-campaign-20260727.zip'}`

停用原因：旧版结尾与发布文案包含本轮明确禁止的交易平台、交易动作和获取凭证表述，不得继续用于公开传播。
"""
    (QA_DIR / "旧素材停用清单.md").write_text(text, encoding="utf-8")


async def main():
    for directory in [VIDEO_DIR, COVER_DIR, SUBTITLE_DIR, AUDIO_DIR, COPY_DIR, MATERIALS_DIR, QA_DIR, WORK_DIR]:
        directory.mkdir(parents=True, exist_ok=True)

    scene_paths = []
    for idx, (source, title, label) in enumerate(zip(SCENE_SOURCES, SCENE_TITLES, SCENE_LABELS)):
        scene = WORK_DIR / f"scene-{idx + 1:02}.png"
        scene_card(idx, source, title, label, scene)
        scene_paths.append(scene)
    cover(COVER)
    await synthesize()
    write_srt(duration(VOICE_AUDIO))
    build_video(scene_paths)
    write_copy()
    write_materials(scene_paths)
    write_stopped_assets()

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
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    asyncio.run(main())
