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
OUT = ROOT / "outputs" / "zhongkao-pain-5versions-20260729"
FFMPEG = Path(r"E:\ffmpeg-8.1.1-essentials_build\bin\ffmpeg.exe")
FFPROBE = Path(r"E:\ffmpeg-8.1.1-essentials_build\bin\ffprobe.exe")
FONT = Path(r"C:\Windows\Fonts\msyh.ttc")
FONT_BOLD = Path(r"C:\Windows\Fonts\msyhbd.ttc")
VOICE = "zh-CN-YunxiNeural"
MUSIC = ROOT / "outputs" / "zhongkao-promo-video-30s-20260728" / "audio" / "广州中考志愿-家长痛点版-原创紧张递进配乐.wav"

NAVY = "#071832"
NAVY_2 = "#102B54"
WHITE = "#FFFFFF"
MIST = "#D9E8FF"
MUTED = "#AFC3DE"
YELLOW = "#FFD54A"
CYAN = "#5EEAD4"

TARGET_DURATION = 30.0
TRANSITION = 0.35
SCENE_DURATIONS = [4.30, 4.60, 5.10, 6.30, 5.00, 6.45]

OFFICIAL_URL = "https://gzzk.gz.gov.cn/gkmlpt/content/10/10811/post_10811628.html"
NOTICE_URL = "https://gzzk.gz.gov.cn/gkmlpt/content/10/10811/post_10811549.html"


VARIANTS = [
    {
        "id": "01-lowest-score",
        "label": "只看最低分",
        "accent": "#E14747",
        "hook_top": "踩线也没用！",
        "hook_bottom": "最低分不保录取",
        "cover_sub": "往年最低分，不是今年承诺",
        "segments": [
            "踩线也没用！最低分不保录取。",
            "往年最低分只是录取结果，不是今年的录取承诺。学校热度、招生计划和考生志愿都会变化。",
            "广州招考办明确提醒，踩线进策略风险大，第一志愿应参考更稳定的录取水平。",
            "如果只盯最低分，最容易把孩子的分数，押在一条会波动的线上。",
            "先看所在梯度，再看历年位置和末位志愿序号，最后安排前后承接。",
            "想了解使用方式，私信我。",
        ],
        "cards": [
            ("家长误区", "去年最低分够了，今年就稳了"),
            ("真实风险", "热度、计划和志愿都会变化"),
            ("更稳判断", "梯度＋历年位置＋志愿序号"),
        ],
        "closing": "最低分是参考线，不是保证线",
    },
    {
        "id": "02-copy-others",
        "label": "照抄别人志愿",
        "accent": "#F07B3F",
        "hook_top": "照抄志愿",
        "hook_bottom": "结果可能完全错位",
        "cover_sub": "别人的表，接不住你的孩子",
        "segments": [
            "照抄志愿，结果可能完全错位。",
            "同一所学校，放在第一志愿还是后面志愿，投档机会可能不同。",
            "孩子所在梯度、报考范围和能够接受的学校都不同，别人的表不能直接复制。",
            "只看学校名单，不看自己的位置，表面省事，实际把关键判断交给了别人。",
            "先定自己的范围，再排自己的顺序，每个志愿都要有明确理由。",
            "需要体验入口，私信咨询。",
        ],
        "cards": [
            ("同一张表", "对别人合适，对你未必合适"),
            ("三个差异", "梯度、范围、可接受去向"),
            ("正确做法", "自己的范围，自己的顺序"),
        ],
        "closing": "志愿表不能复制，只能重新判断",
    },
    {
        "id": "03-eligibility",
        "label": "资格范围没核清",
        "accent": "#9B6BF2",
        "hook_top": "白填了！",
        "hook_bottom": "资格没核清，起点就错了",
        "cover_sub": "先核资格，再谈学校",
        "segments": [
            "资格没核清，志愿可能白填。",
            "户籍、学籍、考生类别和学校招生范围，会影响哪些计划可以填报。",
            "名额分配还有单独资格审核，不能只看到学校名字就往志愿表里放。",
            "资格问题没有先排除，后面的分数比较和顺序设计，都可能失去意义。",
            "填之前先核资格、招生范围和批次，再谈学校选择。",
            "了解系统能力，私信获取说明。",
        ],
        "cards": [
            ("先核四项", "户籍、学籍、类别、招生范围"),
            ("单独审核", "名额分配资格不能想当然"),
            ("正确顺序", "资格→范围→批次→学校"),
        ],
        "closing": "资格不先核，后面分析都可能白做",
    },
    {
        "id": "04-order-priority",
        "label": "同梯度顺序排错",
        "accent": "#E14747",
        "hook_top": "分数更高",
        "hook_bottom": "也可能没录到！",
        "cover_sub": "同一梯度，先看志愿顺序",
        "segments": [
            "分数更高，也可能没录到！",
            "广州中考不是简单按照分数，从高到低扫完整张志愿表。",
            "同一梯度内，先投第一志愿，再投第二志愿，之后才继续。",
            "如果学校在前面志愿已经录满，放到后面，分数高出一些也可能错过。",
            "真正要排的，不只是学校名单，而是哪所学校必须放在前面。",
            "想了解使用方式，私信我。",
        ],
        "cards": [
            ("第一步", "先看考生所在梯度"),
            ("第二步", "同梯度先看志愿顺序"),
            ("第三步", "同一志愿再比较成绩"),
        ],
        "closing": "分数重要，顺序同样重要",
    },
    {
        "id": "05-filled-not-safe",
        "label": "填满但没有承接",
        "accent": "#1AA981",
        "hook_top": "填满也会落！",
        "hook_bottom": "志愿多，不等于接得住",
        "cover_sub": "每个位置，都要承担任务",
        "segments": [
            "填满也会落！志愿多也接不住。",
            "广州招考办明确说，不要求所有志愿都报满，但要充分利用容量，并考虑前后梯度。",
            "最怕每个志愿都集中在同一层次，看起来选择很多，实际没有承接。",
            "前面的学校一起落空，后面的学校又接不住，填了多少个都没有形成保护。",
            "每个位置都要承担任务：争取机会、承接分数，或者守住可接受去向。",
            "需要体验入口，私信咨询。",
        ],
        "cards": [
            ("表面", "志愿数量很多"),
            ("问题", "学校集中在同一层次"),
            ("结果", "前后没有真正承接"),
        ],
        "closing": "不是填得多，而是每个位置都有作用",
    },
]


def fnt(size: int, bold: bool = False):
    return ImageFont.truetype(str(FONT_BOLD if bold else FONT), size)


def gradient(size: tuple[int, int], accent: str):
    top = (5, 17, 39)
    a = tuple(int(accent[i:i + 2], 16) for i in (1, 3, 5))
    bottom = tuple(round(top[i] * 0.62 + a[i] * 0.38) for i in range(3))
    im = Image.new("RGB", size, top)
    px = im.load()
    for y in range(size[1]):
        r = y / max(1, size[1] - 1)
        color = tuple(round(top[i] * (1 - r) + bottom[i] * r) for i in range(3))
        for x in range(size[0]):
            px[x, y] = color
    return im


def brand(draw: ImageDraw.ImageDraw):
    draw.rounded_rectangle((64, 72, 164, 124), radius=26, fill=CYAN)
    draw.text((114, 98), "GZ", anchor="mm", font=fnt(25, True), fill=NAVY)
    draw.text((190, 98), "广州中考志愿模拟助手", anchor="lm", font=fnt(28, True), fill=WHITE)


def footer(draw: ImageDraw.ImageDraw, label: str):
    draw.line((64, 1805, 1016, 1805), fill="#3A577D", width=2)
    draw.text((64, 1845), f"2026广州中考｜{label}", font=fnt(25), fill=MUTED)
    draw.text((1016, 1845), "品沐提供", anchor="ra", font=fnt(25), fill=MUTED)


def draw_scene(variant: dict, index: int, path: Path):
    accent = variant["accent"]
    im = gradient((1080, 1920), accent)
    draw = ImageDraw.Draw(im)
    brand(draw)
    if index == 0:
        draw.rounded_rectangle((64, 275, 1016, 685), radius=50, fill=accent)
        draw.text((540, 405), variant["hook_top"], anchor="mm", font=fnt(92, True), fill=WHITE)
        draw.text((540, 565), variant["hook_bottom"], anchor="mm", font=fnt(53, True), fill=WHITE)
        draw.rounded_rectangle((92, 835, 988, 1190), radius=48, fill=NAVY_2, outline="#547BB2", width=3)
        draw.text((540, 955), variant["cards"][0][0], anchor="mm", font=fnt(40, True), fill=MUTED)
        draw.text((540, 1070), variant["cards"][0][1], anchor="mm", font=fnt(44, True), fill=YELLOW)
        draw.text((540, 1370), "家长最容易忽略的志愿风险", anchor="mm", font=fnt(36, True), fill=MIST)
    elif index in (1, 2, 3):
        card = variant["cards"][index - 1]
        draw.text((64, 270), card[0], font=fnt(58, True), fill=WHITE)
        draw.rounded_rectangle((64, 420, 1016, 905), radius=48, fill="#F7FAFF")
        draw.text((540, 610), card[1], anchor="mm", font=fnt(48, True), fill=NAVY)
        if index == 1:
            draw.text((540, 1055), "看起来合理", anchor="mm", font=fnt(44), fill=MUTED)
            draw.line((245, 1135, 835, 1135), fill=accent, width=16)
            draw.text((540, 1255), "可能只是漏看了关键条件", anchor="mm", font=fnt(48, True), fill=YELLOW)
        elif index == 2:
            for n, text in enumerate(["先确认条件", "再判断位置", "最后安排顺序"], 1):
                y = 1030 + (n - 1) * 155
                draw.ellipse((120, y - 46, 212, y + 46), fill=accent)
                draw.text((166, y), f"{n}", anchor="mm", font=fnt(31, True), fill=WHITE)
                draw.text((260, y), text, anchor="lm", font=fnt(43, True), fill=MIST)
        else:
            draw.rounded_rectangle((92, 1040, 988, 1395), radius=46, fill=NAVY_2, outline="#547BB2", width=3)
            draw.text((540, 1160), "问题不是少填一所学校", anchor="mm", font=fnt(38), fill=MUTED)
            draw.text((540, 1280), "而是整张表没有形成逻辑", anchor="mm", font=fnt(47, True), fill=YELLOW)
    elif index == 4:
        draw.text((540, 300), "填志愿前，先问一句", anchor="mm", font=fnt(48, True), fill=MUTED)
        draw.rounded_rectangle((64, 470, 1016, 915), radius=52, fill=accent)
        draw.text((540, 635), variant["closing"], anchor="mm", font=fnt(52, True), fill=WHITE)
        draw.text((540, 790), "这一步有没有依据？", anchor="mm", font=fnt(42), fill=WHITE)
        draw.rounded_rectangle((110, 1110, 970, 1375), radius=42, fill="#F7FAFF")
        draw.text((540, 1242), "范围、梯度、顺序、承接", anchor="mm", font=fnt(45, True), fill=NAVY)
    else:
        draw.text((540, 340), "别等录取结果出来", anchor="mm", font=fnt(62, True), fill=WHITE)
        draw.text((540, 470), "才发现关键一步漏了", anchor="mm", font=fnt(62, True), fill=YELLOW)
        draw.rounded_rectangle((64, 720, 1016, 1030), radius=52, fill=CYAN)
        cta = variant["segments"][-1].replace("。", "")
        if "，" in cta:
            first, second = cta.split("，", 1)
        else:
            first, second = "想了解使用方式", "私信我"
        draw.text((540, 830), first, anchor="mm", font=fnt(50, True), fill=NAVY)
        draw.text((540, 945), second, anchor="mm", font=fnt(74, True), fill=NAVY)
        draw.rounded_rectangle((64, 1200, 1016, 1470), radius=42, fill=NAVY_2, outline="#547BB2", width=3)
        draw.text((540, 1290), "内容为家长风险提醒", anchor="mm", font=fnt(34, True), fill=WHITE)
        draw.text((540, 1380), "请以当年广州招考官方信息为准", anchor="mm", font=fnt(32), fill=MUTED)
    footer(draw, variant["label"])
    im.save(path, quality=96)


def draw_cover(variant: dict, path: Path):
    accent = variant["accent"]
    im = gradient((1080, 1440), accent)
    draw = ImageDraw.Draw(im)
    brand(draw)
    draw.rounded_rectangle((64, 235, 1016, 610), radius=50, fill=accent)
    draw.text((540, 365), variant["hook_top"], anchor="mm", font=fnt(88, True), fill=WHITE)
    draw.text((540, 510), variant["hook_bottom"], anchor="mm", font=fnt(51, True), fill=WHITE)
    draw.text((540, 800), variant["cover_sub"], anchor="mm", font=fnt(59, True), fill=YELLOW)
    draw.rounded_rectangle((110, 960, 970, 1160), radius=44, fill="#F7FAFF")
    draw.text((540, 1060), f"痛点{variant['id'][:2]}｜{variant['label']}", anchor="mm", font=fnt(40, True), fill=NAVY)
    draw.text((64, 1325), "30秒精华版", font=fnt(30, True), fill=MIST)
    draw.text((1016, 1325), "品沐提供", anchor="ra", font=fnt(26), fill=MUTED)
    im.save(path, quality=96)


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


def caption_parts(text: str, max_chars=16):
    parts, current = [], ""
    punctuation = "，。；：！？、"
    for char in text:
        current += char
        if char in punctuation and len(current) >= 6:
            parts.append(current)
            current = ""
        elif len(current) >= max_chars:
            parts.append(current)
            current = ""
    if current:
        parts.append(current)
    normalized = []
    for part in parts:
        if normalized and all(char in punctuation for char in part):
            normalized[-1] += part
        else:
            normalized.append(part)
    return normalized


def split_caption(text: str, line_chars=9):
    return text if len(text) <= line_chars else text[:line_chars] + "\n" + text[line_chars:]


def write_srt(segments: list[str], voice: Path, path: Path):
    voice_duration = duration(voice)
    weights = [max(3, len(x)) for x in segments]
    cursor, cue_index, rows = 0.0, 1, []
    for segment_index, (text, weight) in enumerate(zip(segments, weights), 1):
        segment_end = voice_duration if segment_index == len(segments) else cursor + voice_duration * weight / sum(weights)
        parts = caption_parts(text)
        part_weights = [max(2, len(x)) for x in parts]
        part_cursor = cursor
        for part_index, (part, part_weight) in enumerate(zip(parts, part_weights), 1):
            part_end = segment_end if part_index == len(parts) else part_cursor + (segment_end - cursor) * part_weight / sum(part_weights)
            rows.append(f"{cue_index}\n{srt_time(part_cursor)} --> {srt_time(part_end)}\n{split_caption(part)}\n")
            cue_index += 1
            part_cursor = part_end
        cursor = segment_end
    path.write_text("\n".join(rows), encoding="utf-8")


async def synthesize(segments: list[str], raw: Path, voice: Path):
    await edge_tts.Communicate("".join(segments), VOICE, rate="+12%", volume="+0%").save(str(raw))
    raw_duration = duration(raw)
    tempo = raw_duration / 29.42
    subprocess.run([
        str(FFMPEG), "-y", "-loglevel", "error", "-i", str(raw),
        "-filter:a", f"atempo={tempo:.6f}", "-ar", "48000", "-ac", "1", str(voice),
    ], check=True)


def escape_subtitle(path: Path):
    return str(path).replace("\\", "/").replace(":", "\\:")


def render(scene_paths: list[Path], srt: Path, voice: Path, output: Path):
    cmd = [str(FFMPEG), "-y", "-loglevel", "error"]
    for image, span in zip(scene_paths, SCENE_DURATIONS):
        cmd += ["-loop", "1", "-t", f"{span + 0.2:.3f}", "-i", str(image)]
    cmd += ["-i", str(voice), "-i", str(MUSIC)]
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
        f"[{previous}]subtitles='{escape_subtitle(srt)}':force_style='FontName=Microsoft YaHei,FontSize=9,"
        "PrimaryColour=&H00FFFFFF,OutlineColour=&H00102030,BackColour=&HA0000000,BorderStyle=3,Outline=1,"
        "Shadow=0,MarginL=80,MarginR=80,MarginV=28,Alignment=2'[vout]"
    )
    voice_input = len(scene_paths)
    music_input = voice_input + 1
    filters += [
        f"[{voice_input}:a]highpass=f=75,lowpass=f=11000,loudnorm=I=-16.5:TP=-1.5:LRA=6,pan=stereo|c0=c0|c1=c0,asplit=2[voice_main][voice_sc]",
        f"[{music_input}:a]highpass=f=38,lowpass=f=8500,loudnorm=I=-24.5:TP=-5:LRA=10[music]",
        "[music][voice_sc]sidechaincompress=threshold=0.025:ratio=6:attack=12:release=280[ducked]",
        "[voice_main][ducked]amix=inputs=2:weights='1 0.92':normalize=0,loudnorm=I=-16.5:TP=-1.0:LRA=7,alimiter=limit=0.95[aout]",
    ]
    cmd += [
        "-filter_complex", ";".join(filters), "-map", "[vout]", "-map", "[aout]", "-t", "30",
        "-c:v", "libx264", "-preset", "fast", "-crf", "20", "-pix_fmt", "yuv420p", "-r", "30",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", str(output),
    ]
    subprocess.run(cmd, check=True)


def write_copy(variant: dict, path: Path):
    first = variant["segments"][0]
    middle = variant["segments"][1] + variant["segments"][2]
    conclusion = variant["closing"]
    cta = variant["segments"][-1]
    text = f"""# {variant['label']}｜30秒视频发布文案

发布状态：`ready_for_review_not_published`

## 抖音

标题：{variant['hook_top']}{variant['hook_bottom']}

正文：
{first}

{middle}

{conclusion}。{cta}

#广州中考 #中考志愿 #广州家长 #志愿填报

## 小红书视频

标题：广州中考避坑｜{variant['label']}

正文：
{variant['segments'][1]}

{variant['segments'][3]}

本视频为家长风险提醒，请以当年广州招考官方信息为准。

{cta}

#广州中考 #中考家长 #广州升学 #志愿规划

## 微信视频号

标题：30秒看懂广州中考志愿风险：{variant['label']}

描述：
{variant['segments'][2]}{conclusion}。请以当年官方信息为准。

{cta}

#广州中考 #中考志愿 #广州升学

## 发布提醒

- 视频含 AI 生成男声与原创程序化配乐，平台如提供相关声明选项，应如实勾选。
- 未获得明确发布授权前，仅作为本地待审素材，不执行外部发布。
"""
    path.write_text(text, encoding="utf-8")


async def build_variant(variant: dict):
    base = OUT / variant["id"]
    video_dir, cover_dir = base / "video", base / "cover"
    audio_dir, subtitle_dir = base / "audio", base / "subtitles"
    copy_dir, work_dir, qa_dir = base / "copy", base / "work", base / "qa"
    for directory in [video_dir, cover_dir, audio_dir, subtitle_dir, copy_dir, work_dir, qa_dir]:
        directory.mkdir(parents=True, exist_ok=True)
    scene_paths = []
    for index in range(6):
        scene = work_dir / f"scene-{index + 1:02}.png"
        draw_scene(variant, index, scene)
        scene_paths.append(scene)
    cover = cover_dir / f"{variant['label']}-封面-1080x1440.png"
    raw = audio_dir / f"{variant['label']}-男声原始.mp3"
    voice = audio_dir / f"{variant['label']}-30秒男声.wav"
    srt = subtitle_dir / f"{variant['label']}-字幕.srt"
    video = video_dir / f"广州中考志愿-{variant['label']}-30秒-9x16.mp4"
    draw_cover(variant, cover)
    await synthesize(variant["segments"], raw, voice)
    write_srt(variant["segments"], voice, srt)
    render(scene_paths, srt, voice, video)
    write_copy(variant, copy_dir / "发布文案.md")
    return {
        "id": variant["id"], "label": variant["label"], "status": "ready_for_review_not_published",
        "video": str(video), "cover": str(cover), "subtitles": str(srt),
        "durationSeconds": round(duration(video), 3), "videoSha256": sha256(video),
        "coverSha256": sha256(cover), "publicCta": variant["segments"][-1].rstrip("。"),
    }


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    selected = set(sys.argv[1:])
    targets = [v for v in VARIANTS if not selected or v["id"] in selected]
    results = []
    for variant in targets:
        print(f"BUILDING {variant['id']} {variant['label']}", flush=True)
        results.append(await build_variant(variant))
        print(f"DONE {variant['id']}", flush=True)
    manifest_path = OUT / "manifest.json"
    if selected and manifest_path.exists():
        existing = json.loads(manifest_path.read_text(encoding="utf-8"))
        by_id = {item["id"]: item for item in existing.get("variants", [])}
        by_id.update({item["id"]: item for item in results})
        results = [by_id[v["id"]] for v in VARIANTS]
    manifest_path.write_text(json.dumps({
        "generatedAt": "2026-07-29T00:00:00+08:00",
        "status": "ready_for_review_not_published",
        "count": len(results), "music": str(MUSIC), "variants": results,
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUT / "文案事实依据.md").write_text(f"""# 五版文案事实依据

- 广州市招生考试委员会办公室《2026年广州市中考志愿填报问答》：{OFFICIAL_URL}
- 《关于做好2026年高中阶段学校招生填报志愿工作的通知》：{NOTICE_URL}
- 核验范围：多梯度投档、志愿优先、同梯度志愿顺序、往年最低分的波动性、踩线策略风险、招生范围、名额分配资格、志愿容量与前后梯度。
- 所有视频均未使用真实考生案例、学校排名、具体学校结论或录取概率。
""", encoding="utf-8")


if __name__ == "__main__":
    asyncio.run(main())
