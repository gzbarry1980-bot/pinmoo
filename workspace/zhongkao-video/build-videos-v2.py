import asyncio
import json
import shutil
import subprocess
from pathlib import Path

import edge_tts
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(r"E:\pinmoo")
SOURCE = ROOT / "outputs" / "zhongkao-videos-20260724"
PREPARED_V1 = SOURCE / "work" / "prepared"
OUT = ROOT / "outputs" / "zhongkao-videos-v2-20260724"
WORK = OUT / "work"
PREPARED = WORK / "prepared"
FFMPEG = Path(r"E:\ffmpeg-8.1.1-essentials_build\bin\ffmpeg.exe")
FFPROBE = Path(r"E:\ffmpeg-8.1.1-essentials_build\bin\ffprobe.exe")
FONT_BOLD = Path(r"C:\Windows\Fonts\msyhbd.ttc")
FONT_REGULAR = Path(r"C:\Windows\Fonts\msyh.ttc")
VOICE = "zh-CN-XiaoxiaoNeural"

SHORT_SEGMENTS = [
    "715分，第二志愿也可能落选！",
    "广州中考不只看分数。",
    "输入估分和升学区域，",
    "系统按梯度保护生成冲稳保，",
    "再检查方案评分和录取机会。",
    "广州中考志愿模拟助手，仅供参考。",
]

LONG_SEGMENTS = [
    "715分，明明超过第二志愿712分，",
    "为什么还是没有录取？",
    "因为该校末位考生志愿序号是1，",
    "只录到第一志愿。",
    "广州中考，不是简单按最低分录取。",
    "先看这个案例。",
    "第一志愿铁一越秀最低717分，",
    "715分未达到。",
    "第二志愿六中海珠最低712分，",
    "分数够了，但只录到第一志愿，",
    "第二志愿仍然落选。",
    "第三志愿清华附中湾区最低698分，",
    "考生处于更高梯度，",
    "触发梯度保护，最终录取。",
    "弄懂规则，才知道志愿应该怎样排。",
    "广州中考志愿模拟助手提供三种入口。",
    "只知道大概分数，就输入估分上下限、考生类别和升学区域。",
    "系统参考2021到2026年公开录取数据，",
    "生成第三批和第四批的冲稳保方向。",
    "每所学校都会显示机会区间、录取门槛排名、历史志愿序号和置信度。",
    "方案可以在进取、均衡和稳健之间一键切换。",
    "已有目标学校，可以直接输入学校名称。",
    "系统会倒推冲刺起步、匹配目标和稳妥目标，",
    "并建议学校放在第几批、第几个志愿。",
    "已经排好志愿，就进入方案求证。",
    "系统会检查资格、志愿连续性、冲稳保结构、顺序与梯度。",
    "再给出方案评分、最可能录取学校、各校机会区间和未录取风险。",
    "系统按同一组模拟情景计算最可能去向，不能把单校概率简单相加。",
    "如果评分不满意，可以点击满分补强，",
    "系统自动补齐或替换学校。",
    "足球等特长项目，也能按项目汇总学校并查看官方简章。",
    "所有结果均为公开政策和历史数据的统计模拟，",
    "不代表官方录取或任何录取承诺。",
    "名额分配、随迁和跨区资格，仍需向学校或招考部门核实。",
    "请以当年广州招考部门最终公布的信息为准。",
    "本系统仅供参考。",
]


def run(command):
    subprocess.run([str(item) for item in command], check=True)


def duration(path):
    result = subprocess.run(
        [str(FFPROBE), "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path)],
        check=True, capture_output=True, text=True
    )
    return float(result.stdout.strip())


def ts(seconds):
    millis = max(0, round(seconds * 1000))
    hours, millis = divmod(millis, 3_600_000)
    minutes, millis = divmod(millis, 60_000)
    secs, millis = divmod(millis, 1000)
    return f"{hours:02}:{minutes:02}:{secs:02},{millis:03}"


def srt_from_segments(segments, total_duration, path):
    weights = [max(2, len(text.replace("，", "").replace("。", ""))) for text in segments]
    total_weight = sum(weights)
    cursor = 0.0
    rows = []
    for index, (text, weight) in enumerate(zip(segments, weights), 1):
        span = total_duration * weight / total_weight
        end = total_duration if index == len(segments) else cursor + span
        rows.append(f"{index}\n{ts(cursor)} --> {ts(end)}\n{text}\n")
        cursor = end
    path.write_text("\n".join(rows), encoding="utf-8")


async def voice(segments, audio, srt, rate):
    text = "".join(segments)
    communicate = edge_tts.Communicate(text, VOICE, rate=rate)
    await communicate.save(str(audio))
    srt_from_segments(segments, duration(audio), srt)


def gradient_background(top, bottom):
    image = Image.new("RGB", (1080, 1920), top)
    pixels = image.load()
    for y in range(1920):
        ratio = y / 1919
        color = tuple(round(top[index] * (1 - ratio) + bottom[index] * ratio) for index in range(3))
        for x in range(1080):
            pixels[x, y] = color
    return image


def brand_mark(draw, color=(124, 240, 197)):
    draw.rounded_rectangle((80, 90, 220, 155), radius=32, fill=color)
    draw.text((117, 102), "GZ", font=ImageFont.truetype(str(FONT_BOLD), 34), fill="white")
    draw.text((80, 190), "广州中考志愿模拟助手", font=ImageFont.truetype(str(FONT_BOLD), 38), fill=(225, 235, 252))


def hook_card(path):
    image = gradient_background((8, 22, 51), (18, 77, 191))
    draw = ImageDraw.Draw(image, "RGBA")
    brand_mark(draw)
    draw.rounded_rectangle((76, 340, 1004, 620), radius=38, fill=(255, 255, 255, 18), outline=(255, 255, 255, 50), width=2)
    draw.text((102, 340), "715", font=ImageFont.truetype(str(FONT_BOLD), 210), fill=(255, 214, 49))
    draw.text((545, 430), "分", font=ImageFont.truetype(str(FONT_BOLD), 88), fill="white")
    draw.rounded_rectangle((86, 720, 994, 1235), radius=46, fill=(208, 39, 52, 238))
    draw.text((135, 790), "第二志愿", font=ImageFont.truetype(str(FONT_BOLD), 94), fill="white")
    draw.text((135, 940), "也可能落选？", font=ImageFont.truetype(str(FONT_BOLD), 94), fill="white")
    draw.rounded_rectangle((86, 1335, 740, 1420), radius=40, fill=(255, 255, 255, 225))
    draw.text((125, 1350), "广州真实投档规则案例", font=ImageFont.truetype(str(FONT_BOLD), 38), fill=(13, 47, 105))
    draw.text((86, 1660), "先别只看最低录取分数线", font=ImageFont.truetype(str(FONT_BOLD), 46), fill=(215, 231, 255))
    image.save(path, quality=95)


def case_card(path):
    image = gradient_background((238, 244, 252), (221, 233, 249))
    draw = ImageDraw.Draw(image, "RGBA")
    draw.text((68, 80), "715分，三次投档发生了什么？", font=ImageFont.truetype(str(FONT_BOLD), 53), fill=(16, 35, 67))
    rows = [
        ((204, 48, 59), "第一志愿", "铁一越秀 · 门槛717分", "差2分，未达到"),
        ((216, 126, 0), "第二志愿", "六中海珠 · 门槛712分", "分数够，但只录第1志愿"),
        ((17, 133, 91), "第三志愿", "清华附中湾区 · 门槛698分", "高梯度考生优先，最终录取"),
    ]
    y = 270
    for color, label, school, result in rows:
        draw.rounded_rectangle((62, y, 1018, y + 390), radius=36, fill=(255, 255, 255, 245), outline=color + (100,), width=3)
        draw.rounded_rectangle((92, y + 40, 310, y + 112), radius=34, fill=color + (235,))
        draw.text((126, y + 52), label, font=ImageFont.truetype(str(FONT_BOLD), 32), fill="white")
        draw.text((92, y + 155), school, font=ImageFont.truetype(str(FONT_BOLD), 40), fill=(22, 42, 76))
        draw.text((92, y + 250), result, font=ImageFont.truetype(str(FONT_BOLD), 44), fill=color)
        y += 440
    draw.text((70, 1670), "关键不是“分数够不够”这一项", font=ImageFont.truetype(str(FONT_BOLD), 43), fill=(26, 68, 144))
    draw.text((70, 1735), "还要同时看梯度与末位志愿序号", font=ImageFont.truetype(str(FONT_BOLD), 43), fill=(26, 68, 144))
    image.save(path, quality=95)


def rule_card(path):
    image = gradient_background((10, 35, 79), (12, 92, 255))
    draw = ImageDraw.Draw(image, "RGBA")
    brand_mark(draw)
    draw.text((80, 360), "广州中考投档", font=ImageFont.truetype(str(FONT_BOLD), 74), fill="white")
    draw.text((80, 470), "不是只看最低分", font=ImageFont.truetype(str(FONT_BOLD), 78), fill=(255, 214, 49))
    items = [
        ("1", "梯度优先", "高梯度考生填报低梯度学校时受保护"),
        ("2", "同梯度志愿优先", "同一梯度内先看志愿位置"),
        ("3", "分数择优", "相同志愿位置再按成绩竞争"),
    ]
    y = 720
    for number, title, detail in items:
        draw.rounded_rectangle((75, y, 1005, y + 260), radius=34, fill=(255, 255, 255, 235))
        draw.ellipse((112, y + 70, 242, y + 200), fill=(11, 92, 255))
        draw.text((158, y + 90), number, font=ImageFont.truetype(str(FONT_BOLD), 45), fill="white")
        draw.text((285, y + 52), title, font=ImageFont.truetype(str(FONT_BOLD), 48), fill=(16, 35, 67))
        draw.text((285, y + 135), detail, font=ImageFont.truetype(str(FONT_REGULAR), 31), fill=(77, 91, 117))
        y += 300
    image.save(path, quality=95)


def outro_card(path):
    image = gradient_background((13, 55, 142), (8, 25, 55))
    draw = ImageDraw.Draw(image, "RGBA")
    brand_mark(draw)
    draw.text((82, 470), "先模拟，再决定", font=ImageFont.truetype(str(FONT_BOLD), 82), fill="white")
    draw.text((82, 610), "zhongkao.pinmoo.top", font=ImageFont.truetype(str(FONT_BOLD), 47), fill=(124, 240, 197))
    draw.rounded_rectangle((75, 1030, 1005, 1530), radius=40, fill=(255, 255, 255, 232))
    draw.multiline_text((125, 1100), "依据公开政策及历史数据模拟\n不代表官方录取或录取承诺\n请以当年广州招考信息为准\n本系统仅供参考", font=ImageFont.truetype(str(FONT_BOLD), 40), fill=(14, 47, 105), spacing=27, align="center")
    draw.text((82, 1720), "由品沐提供", font=ImageFont.truetype(str(FONT_REGULAR), 36), fill=(211, 228, 255))
    image.save(path, quality=95)


def prepare_cards():
    PREPARED.mkdir(parents=True, exist_ok=True)
    for image in PREPARED_V1.glob("*.png"):
        shutil.copy2(image, PREPARED / image.name)
    hook_card(PREPARED / "v2-hook.png")
    case_card(PREPARED / "v2-case.png")
    rule_card(PREPARED / "v2-rule.png")
    outro_card(PREPARED / "v2-outro.png")


def escape_subtitle_path(path):
    return str(path).replace("\\", "/").replace(":", "\\:")


def motion_video(name, images, weights, audio, srt, output, transition=0.28):
    audio_duration = duration(audio)
    raw_total = audio_duration + transition * (len(images) - 1)
    scale = raw_total / sum(weights)
    scene_durations = [weight * scale for weight in weights]
    command = [FFMPEG, "-y"]
    for image, scene_duration in zip(images, scene_durations):
        command += ["-loop", "1", "-t", f"{scene_duration + 0.2:.3f}", "-i", image]
    command += ["-i", audio]

    filters = []
    for index, scene_duration in enumerate(scene_durations):
        increment = "0.0022" if index == 0 else ("0.00055" if index % 2 else "0.00038")
        zoom = f"min(zoom+{increment},{'1.13' if index == 0 else '1.055'})"
        filters.append(
            f"[{index}:v]fps=30,scale=1080:1920,zoompan=z='{zoom}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30,"
            f"trim=duration={scene_duration:.3f},setpts=PTS-STARTPTS[v{index}]"
        )

    previous = "v0"
    elapsed = scene_durations[0]
    transitions = ["fadeblack", "wipeleft", "smoothleft", "slideup", "fade"]
    for index in range(1, len(images)):
        output_label = f"x{index}"
        offset = elapsed - transition * index
        effect = transitions[(index - 1) % len(transitions)]
        filters.append(f"[{previous}][v{index}]xfade=transition={effect}:duration={transition}:offset={offset:.3f}[{output_label}]")
        previous = output_label
        elapsed += scene_durations[index]

    subtitle = escape_subtitle_path(srt)
    filters.append(
        f"[{previous}]subtitles='{subtitle}':force_style='FontName=Microsoft YaHei,FontSize=10,PrimaryColour=&H00FFFFFF,"
        "OutlineColour=&H00000000,BackColour=&H98000000,BorderStyle=3,Outline=1,Shadow=0,MarginV=38,Alignment=2'[vout]"
    )
    command += [
        "-filter_complex", ";".join(filters), "-map", "[vout]", "-map", f"{len(images)}:a",
        "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", "-shortest", output
    ]
    run(command)
    return duration(output)


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    WORK.mkdir(parents=True, exist_ok=True)
    prepare_cards()

    short_audio = WORK / "short-v2.mp3"
    short_srt = WORK / "short-v2.srt"
    long_audio = WORK / "long-v2.mp3"
    long_srt = WORK / "long-v2.srt"
    await voice(SHORT_SEGMENTS, short_audio, short_srt, "+25%")
    await voice(LONG_SEGMENTS, long_audio, long_srt, "+18%")

    short_images = [
        PREPARED / "v2-hook.png",
        PREPARED / "03-direction-form.png",
        PREPARED / "04-direction-result.png",
        PREPARED / "12-analysis-score.png",
        PREPARED / "13-improvements.png",
        PREPARED / "v2-outro.png",
    ]
    short_weights = [2.0, 2.2, 2.4, 2.3, 2.0, 2.5]

    long_images = [
        PREPARED / "v2-hook.png",
        PREPARED / "v2-case.png",
        PREPARED / "v2-rule.png",
        PREPARED / "02-three-modes.png",
        PREPARED / "03-direction-form.png",
        PREPARED / "04-direction-result.png",
        PREPARED / "05-direction-schools.png",
        PREPARED / "06-risk-switch.png",
        PREPARED / "07-target-form.png",
        PREPARED / "08-target-result.png",
        PREPARED / "09-profile.png",
        PREPARED / "11-volunteer-plan.png",
        PREPARED / "12-analysis-score.png",
        PREPARED / "13-improvements.png",
        PREPARED / "14-special-home.png",
        PREPARED / "15-football-schools.png",
        PREPARED / "v2-outro.png",
    ]
    long_weights = [2.4, 11, 9, 6, 7, 8, 6, 5, 7, 8, 6, 7, 8, 7, 6, 6, 7]

    short_temp = WORK / "short-v2-final.mp4"
    long_temp = WORK / "long-v2-final.mp4"
    short_duration = motion_video("short-v2", short_images, short_weights, short_audio, short_srt, short_temp, transition=0.22)
    long_duration = motion_video("long-v2", long_images, long_weights, long_audio, long_srt, long_temp, transition=0.32)

    deliverables = {
        "short_video": OUT / "广州中考志愿助手-15秒强钩子版-动态字幕.mp4",
        "long_video": OUT / "广州中考志愿助手-2分钟案例详解版-动态字幕.mp4",
        "short_audio": OUT / "广州中考志愿助手-15秒强钩子版-配音.mp3",
        "long_audio": OUT / "广州中考志愿助手-2分钟案例详解版-配音.mp3",
        "short_srt": OUT / "广州中考志愿助手-15秒强钩子版.srt",
        "long_srt": OUT / "广州中考志愿助手-2分钟案例详解版.srt",
    }
    for source, target in [
        (short_temp, deliverables["short_video"]), (long_temp, deliverables["long_video"]),
        (short_audio, deliverables["short_audio"]), (long_audio, deliverables["long_audio"]),
        (short_srt, deliverables["short_srt"]), (long_srt, deliverables["long_srt"]),
    ]:
        shutil.copy2(source, target)

    manifest = {
        "short": {"duration": round(short_duration, 2), "hook": SHORT_SEGMENTS[0], "video": str(deliverables["short_video"])},
        "long": {"duration": round(long_duration, 2), "hook": LONG_SEGMENTS[0] + LONG_SEGMENTS[1], "video": str(deliverables["long_video"])},
        "format": "1080x1920 H.264/AAC",
        "motion": "zoompan + xfade + concise burned subtitles",
        "source": "https://zhongkao.pinmoo.top/",
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
