import asyncio
import json
import math
import re
import shutil
import subprocess
from pathlib import Path

import edge_tts
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(r"E:\pinmoo")
OUT = ROOT / "outputs" / "zhongkao-videos-20260724"
SCENES = OUT / "scenes"
WORK = OUT / "work"
FFMPEG = Path(r"E:\ffmpeg-8.1.1-essentials_build\bin\ffmpeg.exe")
FFPROBE = Path(r"E:\ffmpeg-8.1.1-essentials_build\bin\ffprobe.exe")
FONT_BOLD = Path(r"C:\Windows\Fonts\msyhbd.ttc")
FONT_REGULAR = Path(r"C:\Windows\Fonts\msyh.ttc")
VOICE = "zh-CN-XiaoxiaoNeural"

SHORT_SCRIPT = (
    "广州中考志愿不会填？输入估分和升学区域，系统结合历年录取门槛、梯度线和梯度保护，"
    "自动生成冲稳保方案，还能评估录取机会。广州中考志愿模拟助手，仅供参考。"
)

LONG_SCRIPT = (
    "广州中考志愿，不只是看分数。梯度线、志愿序号、招生区域和梯度保护，都会影响录取结果。"
    "广州中考志愿模拟助手，为家长准备了三种使用方式。"
    "如果只知道大概分数，就选择分数方向版。输入估分上下限、考生类别、升学区域和户籍所在区，"
    "再选择进取、均衡或稳健。系统会参考二零二一年到二零二六年的公开录取数据，生成第三批和第四批的冲、稳、保方向。"
    "每所学校都会显示机会区间、录取门槛排名、历史志愿序号和置信度。家长还可以随时切换方案策略。"
    "如果已经有目标学校，就进入目标学校版。比如选择广州市培正中学，填写当前估分，"
    "系统会给出冲刺起步、匹配目标和稳妥目标，并建议学校应放在第几批、第几个志愿。"
    "如果家长已经填好志愿，就进入方案求证版。系统会检查考生资格、志愿是否连续、梯度是否合理、"
    "保底是否充分，并按照广州中考梯度优先、同梯度志愿优先、分数择优的规则进行模拟。"
    "分析完成后，可以看到方案评分、最可能录取学校、各学校机会区间，以及未被普通高中录取的估算风险。"
    "如果评分不满意，满分补强清单会指出具体批次和志愿位置。点击调整，系统可以自动补齐或替换合适学校。"
    "特长生和自主招生也有独立入口。只知道孩子是足球特长，也可以先选择足球，再查看全市相关学校、预估文化分和官方招生简章。"
    "广州中考志愿模拟助手，由品沐提供。系统依据公开政策和历史数据进行统计模拟，"
    "结果不代表官方录取或任何录取承诺。请以当年广州招考部门最终公布的信息为准，本系统仅供参考。"
)

SCENE_TITLES = {
    "01-home": "先说你知道多少，系统带你完成下一步",
    "02-three-modes": "三种入口：找方向、倒推目标、求证方案",
    "03-direction-form": "只填估分区间和升学区域",
    "04-direction-result": "自动生成冲、稳、保方向",
    "05-direction-schools": "逐校查看机会区间和历史依据",
    "06-risk-switch": "进取、均衡、稳健可以随时切换",
    "07-target-form": "有目标学校，倒推建议冲刺分",
    "08-target-result": "目标分值与志愿位置一起给出",
    "09-profile": "求证版先核对考生条件",
    "10-school-explorer": "按区域、性质和录取门槛筛选学校",
    "11-volunteer-plan": "模拟2026普通高中志愿结构",
    "12-analysis-score": "评分、机会和未录取风险一起看",
    "13-improvements": "不满意分值，可自动补强方案",
    "14-special-home": "特长生与自主招生独立查询",
    "15-football-schools": "只知道足球，也能汇总相关学校",
}


def run(command):
    subprocess.run([str(part) for part in command], check=True)


def media_duration(path):
    result = subprocess.run(
        [str(FFPROBE), "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path)],
        check=True, capture_output=True, text=True
    )
    return float(result.stdout.strip())


def timestamp(seconds):
    millis = max(0, round(seconds * 1000))
    hours, millis = divmod(millis, 3_600_000)
    minutes, millis = divmod(millis, 60_000)
    secs, millis = divmod(millis, 1000)
    return f"{hours:02}:{minutes:02}:{secs:02},{millis:03}"


def write_srt(events, path):
    groups = []
    current = []
    for event in events:
        current.append(event)
        text = "".join(item[2] for item in current).strip()
        if len(text) >= 12 or any(text.endswith(mark) for mark in "，。！？；："):
            groups.append(current)
            current = []
    if current:
        groups.append(current)

    entries = []
    for index, group in enumerate(groups, 1):
        start = group[0][0]
        end = group[-1][1]
        if index < len(groups):
            end = min(max(end, start + 0.8), groups[index][0][0] - 0.03)
        else:
            end = max(end, start + 1.0)
        text = "".join(item[2] for item in group).strip()
        entries.append(f"{index}\n{timestamp(start)} --> {timestamp(end)}\n{text}\n")
    path.write_text("\n".join(entries), encoding="utf-8")


async def synthesize(text, audio_path, srt_path, rate):
    events = []
    communicate = edge_tts.Communicate(text, VOICE, rate=rate)
    with audio_path.open("wb") as audio:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                start = chunk["offset"] / 10_000_000
                end = (chunk["offset"] + chunk["duration"]) / 10_000_000
                events.append((start, end, chunk["text"]))
    if not events:
        duration = media_duration(audio_path)
        chunks = []
        for sentence in re.findall(r"[^，。！？；：]+[，。！？；：]?", text):
            sentence = sentence.strip()
            chunks.extend(sentence[index:index + 12] for index in range(0, len(sentence), 12))
        total_chars = sum(len(item) for item in chunks) or 1
        cursor = 0.0
        for item in chunks:
            span = duration * len(item) / total_chars
            events.append((cursor, min(duration, cursor + span), item))
            cursor += span
    write_srt(events, srt_path)


def gradient_card(title, subtitle, path, disclaimer=False):
    image = Image.new("RGB", (1080, 1920), "#0d1c33")
    pixels = image.load()
    for y in range(1920):
        ratio = y / 1919
        r = int(14 + 16 * ratio)
        g = int(65 + 22 * ratio)
        b = int(205 - 55 * ratio)
        for x in range(1080):
            pixels[x, y] = (r, g, b)
    draw = ImageDraw.Draw(image, "RGBA")
    draw.rounded_rectangle((72, 120, 1008, 1800), radius=48, fill=(8, 24, 52, 120), outline=(255, 255, 255, 45), width=2)
    draw.rounded_rectangle((110, 180, 250, 245), radius=32, fill=(39, 229, 190, 235))
    draw.text((147, 192), "GZ", font=ImageFont.truetype(str(FONT_BOLD), 34), fill="white")
    draw.text((110, 300), "广州中考志愿模拟助手", font=ImageFont.truetype(str(FONT_BOLD), 44), fill=(217, 232, 255))
    y = 500
    for line in title.split("\n"):
        draw.text((110, y), line, font=ImageFont.truetype(str(FONT_BOLD), 82), fill="white")
        y += 112
    draw.multiline_text((112, y + 55), subtitle, font=ImageFont.truetype(str(FONT_REGULAR), 42), fill=(217, 232, 255), spacing=20)
    if disclaimer:
        draw.rounded_rectangle((110, 1450, 970, 1710), radius=30, fill=(255, 255, 255, 225))
        draw.multiline_text((150, 1500), "依据公开政策及历史数据模拟\n不代表官方录取或录取承诺\n本系统仅供参考", font=ImageFont.truetype(str(FONT_BOLD), 40), fill=(14, 47, 105), spacing=18, align="center")
    else:
        draw.text((110, 1650), "zhongkao.pinmoo.top", font=ImageFont.truetype(str(FONT_BOLD), 42), fill=(124, 240, 197))
        draw.text((110, 1720), "由品沐提供", font=ImageFont.truetype(str(FONT_REGULAR), 34), fill=(217, 232, 255))
    image.save(path, quality=95)


def annotate_scenes():
    prepared = WORK / "prepared"
    prepared.mkdir(parents=True, exist_ok=True)
    for source in sorted(SCENES.glob("*.png")):
        image = Image.open(source).convert("RGBA")
        if image.size != (1080, 1920):
            image = image.resize((1080, 1920), Image.Resampling.LANCZOS)
        overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay, "RGBA")
        title = SCENE_TITLES[source.stem]
        draw.rounded_rectangle((42, 125, 1038, 275), radius=28, fill=(9, 28, 59, 225), outline=(124, 240, 197, 95), width=2)
        draw.text((78, 163), title, font=ImageFont.truetype(str(FONT_BOLD), 43), fill="white")
        image = Image.alpha_composite(image, overlay).convert("RGB")
        image.save(prepared / source.name, quality=95)
    gradient_card("输入分数\n生成冲稳保方向", "广州中考志愿填报，不再靠猜。", prepared / "00-short-title.png")
    gradient_card("广州中考志愿\n怎么填更合理？", "2分钟看懂三个使用入口", prepared / "00-long-title.png")
    gradient_card("现在就可以\n开始模拟", "zhongkao.pinmoo.top", prepared / "99-outro.png", disclaimer=True)
    return prepared


def write_concat(image_names, total_duration, path):
    title_duration = 2.2 if total_duration < 30 else 4.0
    outro_duration = 2.8 if total_duration < 30 else 6.0
    middle = max(1.0, total_duration - title_duration - outro_duration)
    each = middle / max(1, len(image_names) - 2)
    durations = [title_duration] + [each] * (len(image_names) - 2) + [outro_duration]
    lines = []
    for image_name, duration in zip(image_names, durations):
        safe_path = str(image_name).replace("'", "'\\''")
        lines.extend([f"file '{safe_path}'", f"duration {duration:.3f}"])
    lines.append(f"file '{str(image_names[-1])}'")
    path.write_text("\n".join(lines), encoding="utf-8")


def make_video(name, images, audio, srt, output):
    duration = media_duration(audio)
    concat_path = WORK / f"{name}-concat.txt"
    write_concat(images, duration + 0.15, concat_path)
    subtitle_path = str(srt).replace("\\", "/").replace(":", "\\:")
    subtitle_filter = (
        f"subtitles='{subtitle_path}':force_style='FontName=Microsoft YaHei,FontSize=11,"
        "PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BackColour=&H95000000,"
        "BorderStyle=3,Outline=1,Shadow=0,MarginV=85,Alignment=2'"
    )
    run([
        FFMPEG, "-y", "-f", "concat", "-safe", "0", "-i", concat_path,
        "-i", audio, "-vf", subtitle_filter, "-r", "30", "-c:v", "libx264",
        "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", output
    ])
    return media_duration(output)


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    WORK.mkdir(parents=True, exist_ok=True)
    short_audio = WORK / "short.mp3"
    short_srt = WORK / "short.srt"
    long_audio = WORK / "long.mp3"
    long_srt = WORK / "long.srt"
    await synthesize(SHORT_SCRIPT, short_audio, short_srt, "+18%")
    await synthesize(LONG_SCRIPT, long_audio, long_srt, "+12%")
    prepared = annotate_scenes()

    short_images = [
        prepared / "00-short-title.png",
        prepared / "02-three-modes.png",
        prepared / "03-direction-form.png",
        prepared / "04-direction-result.png",
        prepared / "12-analysis-score.png",
        prepared / "99-outro.png",
    ]
    long_images = [prepared / "00-long-title.png"] + [prepared / f"{index:02}-{slug}.png" for index, slug in [
        (1, "home"), (2, "three-modes"), (3, "direction-form"), (4, "direction-result"),
        (5, "direction-schools"), (6, "risk-switch"), (7, "target-form"), (8, "target-result"),
        (9, "profile"), (10, "school-explorer"), (11, "volunteer-plan"), (12, "analysis-score"),
        (13, "improvements"), (14, "special-home"), (15, "football-schools")
    ]] + [prepared / "99-outro.png"]

    short_video_temp = WORK / "short-final.mp4"
    long_video_temp = WORK / "long-final.mp4"
    short_duration = make_video("short", short_images, short_audio, short_srt, short_video_temp)
    long_duration = make_video("long", long_images, long_audio, long_srt, long_video_temp)
    short_video = OUT / "广州中考志愿助手-15秒精华版-竖屏字幕.mp4"
    long_video = OUT / "广州中考志愿助手-2分钟详解版-竖屏字幕.mp4"
    short_srt_delivery = OUT / "广州中考志愿助手-15秒精华版.srt"
    long_srt_delivery = OUT / "广州中考志愿助手-2分钟详解版.srt"
    shutil.copy2(short_video_temp, short_video)
    shutil.copy2(long_video_temp, long_video)
    shutil.copy2(short_srt, short_srt_delivery)
    shutil.copy2(long_srt, long_srt_delivery)
    manifest = {
        "short": {"video": str(short_video), "subtitle": str(short_srt_delivery), "duration": round(short_duration, 2)},
        "long": {"video": str(long_video), "subtitle": str(long_srt_delivery), "duration": round(long_duration, 2)},
        "format": "1080x1920 H.264/AAC",
        "voice": VOICE,
        "source": "https://zhongkao.pinmoo.top/",
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
