from __future__ import annotations

import asyncio
import json
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, r"E:\pinmoo\workspace\vendor-video")
import edge_tts


ROOT = Path(r"E:\pinmoo")
OUT = ROOT / "outputs" / "zhongkao-campaign-20260728-clean"
CARDS = OUT / "xiaohongshu"
VIDEO = OUT / "video"
WECHAT = OUT / "wechat"
WORK = OUT / "work"
PREPARED = ROOT / "outputs" / "zhongkao-videos-v2-20260724" / "work" / "prepared"
FFMPEG = Path(r"E:\ffmpeg-8.1.1-essentials_build\bin\ffmpeg.exe")
FFPROBE = Path(r"E:\ffmpeg-8.1.1-essentials_build\bin\ffprobe.exe")
FONT = Path(r"C:\Windows\Fonts\msyh.ttc")
FONT_BOLD = Path(r"C:\Windows\Fonts\msyhbd.ttc")
VOICE = "zh-CN-YunxiNeural"

NAVY = "#0B1F3A"
BLUE = "#125CF5"
LIGHT = "#EDF4FF"
MINT = "#72E1C1"
YELLOW = "#FFD233"
RED = "#D9363E"
INK = "#17243A"
MUTED = "#66758B"

SEGMENTS = [
    "715分，明明超过学校最低分，第二志愿为什么仍可能落选？",
    "因为广州中考投档，不是只看最低分。举个模拟案例：第一志愿门槛717分，715分没达到。",
    "第二志愿门槛712分，分数虽然够，但该校历史结果只录到第一志愿，填在第二志愿仍可能落选。",
    "第三志愿门槛698分，考生处于更高梯度，触发梯度保护，才有机会被录取。",
    "所以填志愿要同时看三件事：梯度保护、同梯度志愿顺序，以及分数择优。",
    "广州中考志愿模拟助手，可以输入估分区间、考生类别和升学区域，生成冲稳保方向。",
    "如果已经有方案，还能检查资格、志愿顺序、冲稳保结构和保底是否完整。",
    "系统给出的是概率区间、方案合理度和调整建议，都是依据公开政策与历史数据的统计估计。",
    "想了解使用方式，可以私信我。结果不代表官方录取，请以当年广州招考信息为准，仅供参考。",
]


def font(size: int, bold: bool = False):
    return ImageFont.truetype(str(FONT_BOLD if bold else FONT), size)


def gradient(size, top=(8, 25, 58), bottom=(18, 92, 245)):
    image = Image.new("RGB", size, top)
    pixels = image.load()
    for y in range(size[1]):
        ratio = y / max(1, size[1] - 1)
        color = tuple(round(top[i] * (1 - ratio) + bottom[i] * ratio) for i in range(3))
        for x in range(size[0]):
            pixels[x, y] = color
    return image


def wrap(draw, text, fnt, max_width):
    lines, current = [], ""
    for ch in text:
        trial = current + ch
        if current and draw.textbbox((0, 0), trial, font=fnt)[2] > max_width:
            lines.append(current)
            current = ch
        else:
            current = trial
    if current:
        lines.append(current)
    return lines


def text_block(draw, xy, text, fnt, fill, max_width, spacing=14, anchor="la"):
    lines = wrap(draw, text, fnt, max_width)
    x, y = xy
    line_h = fnt.size + spacing
    for line in lines:
        draw.text((x, y), line, font=fnt, fill=fill, anchor=anchor)
        y += line_h
    return y


def brand(draw, y=58, dark=False):
    fill = NAVY if dark else "#E9F2FF"
    draw.rounded_rectangle((64, y, 166, y + 50), radius=25, fill=MINT)
    draw.text((115, y + 25), "GZ", anchor="mm", font=font(25, True), fill=NAVY)
    draw.text((190, y + 25), "广州中考志愿模拟助手", anchor="lm", font=font(27, True), fill=fill)


def footer(draw, index, total=7, dark=False):
    fill = "#CCDAEE" if dark else MUTED
    draw.text((64, 1384), "品沐咨询 · 产品演示", font=font(20), fill=fill)
    draw.text((1016, 1384), f"{index}/{total}", anchor="ra", font=font(20, True), fill=fill)


def card1(path):
    im = gradient((1080, 1440))
    d = ImageDraw.Draw(im)
    brand(d)
    d.rounded_rectangle((64, 230, 1016, 600), radius=38, fill="#203A69", outline="#5775A7", width=2)
    d.text((96, 245), "715", font=font(205, True), fill=YELLOW)
    d.text((562, 355), "分", font=font(72, True), fill="white")
    d.rounded_rectangle((64, 660, 1016, 1100), radius=40, fill=RED)
    d.text((112, 725), "超过最低分", font=font(72, True), fill="white")
    d.text((112, 855), "第二志愿", font=font(88, True), fill="white")
    d.text((112, 990), "为什么仍可能落选？", font=font(58, True), fill="white")
    d.text((64, 1210), "先别只盯着学校最低录取分数线", font=font(38, True), fill="#D7E7FF")
    footer(d, 1, dark=True)
    im.save(path)


def card2(path):
    im = Image.new("RGB", (1080, 1440), LIGHT)
    d = ImageDraw.Draw(im)
    brand(d, dark=True)
    d.text((64, 160), "715分模拟案例", font=font(58, True), fill=INK)
    d.text((64, 235), "关键不只是“分数够不够”", font=font(34), fill=MUTED)
    rows = [
        (RED, "第一志愿", "门槛717分", "差2分，未达到"),
        ("#D17A00", "第二志愿", "门槛712分", "分数够，但历史只录到第1志愿"),
        ("#12835B", "第三志愿", "门槛698分", "高梯度保护，形成录取机会"),
    ]
    y = 340
    for color, pos, gate, result in rows:
        d.rounded_rectangle((64, y, 1016, y + 270), radius=30, fill="white", outline=color, width=3)
        d.rounded_rectangle((92, y + 30, 310, y + 92), radius=28, fill=color)
        d.text((201, y + 61), pos, anchor="mm", font=font(27, True), fill="white")
        d.text((92, y + 125), gate, font=font(39, True), fill=INK)
        text_block(d, (92, y + 187), result, font(30, True), color, 850)
        y += 310
    d.text((64, 1300), "案例用于解释规则，不代表未来结果", font=font(27, True), fill=RED)
    footer(d, 2)
    im.save(path)


def card3(path):
    im = gradient((1080, 1440), (7, 27, 61), (12, 73, 170))
    d = ImageDraw.Draw(im)
    brand(d)
    d.text((64, 165), "广州投档要同时看3层", font=font(57, True), fill="white")
    items = [
        ("1", "梯度保护", "高梯度考生填报低梯度学校时，优先参与投档"),
        ("2", "同梯度志愿优先", "同一梯度内，前序志愿通常更有优势"),
        ("3", "分数择优", "同梯度、同志愿序号内，再按成绩和同分序号竞争"),
    ]
    y = 310
    for number, title, detail in items:
        d.rounded_rectangle((64, y, 1016, y + 275), radius=32, fill="#FFFFFF")
        d.ellipse((100, y + 70, 230, y + 200), fill=BLUE)
        d.text((165, y + 135), number, anchor="mm", font=font(46, True), fill="white")
        d.text((275, y + 52), title, font=font(42, True), fill=INK)
        text_block(d, (275, y + 125), detail, font(28), MUTED, 660, 12)
        y += 315
    d.text((64, 1300), "最低分只是结果，不是完整投档规则", font=font(32, True), fill=YELLOW)
    footer(d, 3, dark=True)
    im.save(path)


def screenshot_card(path, title, subtitle, source, index):
    im = Image.new("RGB", (1080, 1440), "#F1F5FA")
    d = ImageDraw.Draw(im)
    brand(d, dark=True)
    d.text((64, 155), title, font=font(50, True), fill=INK)
    text_block(d, (64, 225), subtitle, font(27), MUTED, 950)
    src = Image.open(source).convert("RGB")
    target = (80, 350, 1000, 1270)
    tw, th = target[2] - target[0], target[3] - target[1]
    ratio = max(tw / src.width, th / src.height)
    resized = src.resize((round(src.width * ratio), round(src.height * ratio)), Image.Resampling.LANCZOS)
    left = max(0, (resized.width - tw) // 2)
    top = max(0, (resized.height - th) // 2)
    cropped = resized.crop((left, top, left + tw, top + th))
    im.paste(cropped, (target[0], target[1]))
    d.rounded_rectangle(target, radius=26, outline="#B8C9DD", width=4)
    footer(d, index)
    im.save(path)


def card7(path):
    im = Image.new("RGB", (1080, 1440), "#F7F9FC")
    d = ImageDraw.Draw(im)
    brand(d, dark=True)
    d.text((64, 165), "系统能做什么，也不能做什么", font=font(49, True), fill=INK)
    blocks = [
        ("可以", "输入估分区间、区域和类别，生成冲稳保方向；检查已有方案的资格、顺序、梯度和保底结构。", "#E8F7F1", "#137A56"),
        ("依据", "使用2021—2026公开政策与历史录取数据分层模拟；不同年份、批次的数据覆盖程度不同。", "#EAF2FF", "#215FAE"),
        ("不能", "不能保证录取，不能替代官方志愿填报，也不把各校概率简单相加。", "#FFF0F0", "#B83238"),
    ]
    y = 310
    for label, body, bg, color in blocks:
        d.rounded_rectangle((64, y, 1016, y + 270), radius=30, fill=bg)
        d.text((100, y + 35), label, font=font(38, True), fill=color)
        text_block(d, (100, y + 105), body, font(28), INK, 850, 12)
        y += 305
    d.rounded_rectangle((64, 1215, 1016, 1310), radius=26, fill=MINT)
    d.text((540, 1263), "想了解使用方式，私信我", anchor="mm", font=font(30, True), fill=NAVY)
    footer(d, 7)
    im.save(path)


def wechat_assets():
    cover = gradient((900, 383), (7, 28, 62), (18, 91, 238))
    d = ImageDraw.Draw(cover)
    d.rounded_rectangle((42, 40, 128, 84), radius=22, fill=MINT)
    d.text((85, 62), "GZ", anchor="mm", font=font(21, True), fill=NAVY)
    d.text((42, 130), "715分过线，第二志愿", font=font(48, True), fill="white")
    d.text((42, 204), "为什么仍可能落选？", font=font(48, True), fill=YELLOW)
    d.text((42, 305), "看懂梯度、志愿顺序与历史门槛", font=font(25), fill="#DCEAFF")
    cover.save(WECHAT / "cover-900x383.png")

    body1 = Image.open(CARDS / "02-715分模拟案例.png").crop((0, 210, 1080, 930)).resize((1080, 720), Image.Resampling.LANCZOS)
    body1.save(WECHAT / "body-01-case.png")
    body2 = Image.open(CARDS / "03-三层投档规则.png").crop((0, 220, 1080, 940)).resize((1080, 720), Image.Resampling.LANCZOS)
    body2.save(WECHAT / "body-02-rules.png")
    body3 = Image.open(CARDS / "06-方案求证.png").crop((0, 300, 1080, 1020)).resize((1080, 720), Image.Resampling.LANCZOS)
    body3.save(WECHAT / "body-03-system.png")


def srt_time(seconds):
    millis = round(seconds * 1000)
    hours, millis = divmod(millis, 3_600_000)
    minutes, millis = divmod(millis, 60_000)
    secs, millis = divmod(millis, 1000)
    return f"{hours:02}:{minutes:02}:{secs:02},{millis:03}"


def duration(path):
    result = subprocess.check_output([
        str(FFPROBE), "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path)
    ], text=True)
    return float(result.strip())


async def narration(audio):
    communicate = edge_tts.Communicate("".join(SEGMENTS), VOICE, rate="+8%", volume="+0%")
    await communicate.save(str(audio))


def write_srt(audio_duration, path):
    weights = [max(3, len(text.replace("，", "").replace("。", ""))) for text in SEGMENTS]
    total = sum(weights)
    cursor, rows = 0.0, []
    for index, (text, weight) in enumerate(zip(SEGMENTS, weights), 1):
        end = audio_duration if index == len(SEGMENTS) else cursor + audio_duration * weight / total
        rows.append(f"{index}\n{srt_time(cursor)} --> {srt_time(end)}\n{text}\n")
        cursor = end
    path.write_text("\n".join(rows), encoding="utf-8")


def escape_subtitle(path):
    return str(path).replace("\\", "/").replace(":", "\\:")


def build_video(images, audio, srt, output, margin, end_image):
    images = [*images[:-1], end_image]
    total_duration = duration(audio)
    weights = [max(3, len(text)) for text in SEGMENTS]
    transition = 0.28
    raw = total_duration + transition * (len(images) - 1)
    scale = raw / sum(weights)
    spans = [weight * scale for weight in weights]
    command = [str(FFMPEG), "-y"]
    for image, span in zip(images, spans):
        command += ["-loop", "1", "-t", f"{span + 0.25:.3f}", "-i", str(image)]
    command += ["-i", str(audio)]
    filters = []
    for index, span in enumerate(spans):
        filters.append(
            f"[{index}:v]fps=30,scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=0x0B1F3A,"
            f"zoompan=z='min(zoom+0.00035,1.045)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30,"
            f"trim=duration={span:.3f},setpts=PTS-STARTPTS[v{index}]"
        )
    previous, elapsed = "v0", spans[0]
    for index in range(1, len(images)):
        label = f"x{index}"
        offset = elapsed - transition * index
        filters.append(f"[{previous}][v{index}]xfade=transition=fade:duration={transition}:offset={offset:.3f}[{label}]")
        previous = label
        elapsed += spans[index]
    filters.append(
        f"[{previous}]subtitles='{escape_subtitle(srt)}':force_style='FontName=Microsoft YaHei,FontSize=14,"
        f"PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BackColour=&H9A000000,BorderStyle=3,Outline=1,"
        f"Shadow=0,MarginL=80,MarginR=80,MarginV={margin},Alignment=2'[vout]"
    )
    command += [
        "-filter_complex", ";".join(filters), "-map", "[vout]", "-map", f"{len(images)}:a",
        "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", "-shortest", str(output)
    ]
    subprocess.run(command, check=True)


def platform_end(path, channel):
    im = gradient((1080, 1920), (7, 27, 61), (14, 72, 167))
    d = ImageDraw.Draw(im)
    brand(d, 90)
    d.text((70, 420), "先看懂规则", font=font(76, True), fill="white")
    d.text((70, 550), "再决定怎么排志愿", font=font(68, True), fill=YELLOW)
    d.rounded_rectangle((70, 850, 1010, 1310), radius=42, fill="#FFFFFF")
    lines = ["概率与建议均为统计估计", "不代表官方录取结果或录取承诺", "以当年广州招考信息为准", "本系统仅供参考"]
    y = 925
    for line in lines:
        d.text((540, y), line, anchor="mm", font=font(34, True), fill=INK)
        y += 90
    cta = "想了解使用方式｜私信我" if channel == "douyin" else "需要体验入口｜私信咨询"
    d.rounded_rectangle((70, 1480, 1010, 1590), radius=34, fill=MINT)
    d.text((540, 1535), cta, anchor="mm", font=font(33, True), fill=NAVY)
    d.text((70, 1725), "了解系统能力｜私信获取说明", font=font(27), fill="#D5E5FF")
    d.text((70, 1780), "产品演示仅用于辅助理解志愿规则", font=font(25), fill="#BFD4F2")
    im.save(path)


async def main():
    for directory in (OUT, CARDS, VIDEO, WECHAT, WORK):
        directory.mkdir(parents=True, exist_ok=True)

    card1(CARDS / "01-过线也可能落选.png")
    card2(CARDS / "02-715分模拟案例.png")
    card3(CARDS / "03-三层投档规则.png")
    screenshot_card(CARDS / "04-输入考生条件.png", "先输入真实条件", "估分区间、考生类别、升学区域和风险偏好，都会影响可选学校与模拟结果。", PREPARED / "03-direction-form.png", 4)
    screenshot_card(CARDS / "05-生成冲稳保方向.png", "系统给出冲稳保方向", "不仅看最低分，还结合历年波动、录取门槛和志愿顺序，展示概率区间与置信度。", PREPARED / "04-direction-result.png", 5)
    screenshot_card(CARDS / "06-方案求证.png", "已有方案，再做一次求证", "检查资格、槽位利用、冲稳保结构、志愿顺序和保底完整性，并指出具体调整位置。", PREPARED / "12-analysis-score.png", 6)
    card7(CARDS / "07-系统边界与免责声明.png")
    wechat_assets()

    audio = VIDEO / "广州中考志愿规则-自然男声.mp3"
    srt = VIDEO / "广州中考志愿规则-字幕.srt"
    await narration(audio)
    write_srt(duration(audio), srt)
    douyin_end = WORK / "douyin-end.png"
    channels_end = WORK / "channels-end.png"
    platform_end(douyin_end, "douyin")
    platform_end(channels_end, "channels")
    images = [
        PREPARED / "v2-hook.png", CARDS / "02-715分模拟案例.png", CARDS / "02-715分模拟案例.png",
        CARDS / "02-715分模拟案例.png", CARDS / "03-三层投档规则.png", PREPARED / "03-direction-form.png",
        PREPARED / "12-analysis-score.png", CARDS / "07-系统边界与免责声明.png", douyin_end,
    ]
    build_video(images, audio, srt, VIDEO / "抖音-广州中考过线为何仍会落选-9x16.mp4", 300, douyin_end)
    build_video(images, audio, srt, VIDEO / "视频号-广州中考过线为何仍会落选-9x16.mp4", 245, channels_end)
    shutil.copy2(CARDS / "01-过线也可能落选.png", VIDEO / "抖音封面-1080x1440.png")
    shutil.copy2(CARDS / "03-三层投档规则.png", VIDEO / "视频号封面-1080x1440.png")
    manifest = {
        "generatedAt": "2026-07-28T00:00:00+08:00",
        "voice": VOICE,
        "cards": 7,
        "videoDurationSeconds": round(duration(audio), 2),
        "facts": {"dataYears": "2021-2026分层覆盖", "publicCallToAction": "想了解使用方式，私信我"},
        "disclaimer": "仅供参考，以当年广州招考信息为准",
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    asyncio.run(main())
