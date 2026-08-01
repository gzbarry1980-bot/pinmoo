from __future__ import annotations

import asyncio
import json
import math
import re
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

sys.path.insert(0, r"E:\pinmoo\workspace\vendor-video")
import edge_tts


ROOT = Path(r"E:\pinmoo\outputs\zhongkao\video-demo")
SCREENS = ROOT / "screens"
WORK = ROOT / "work"
AUDIO = WORK / "audio"
FRAMES = WORK / "frames"
SEGMENTS = WORK / "segments"
FINAL = ROOT / "广州中考志愿模拟助手-买家操作教程.mp4"
SRT = ROOT / "广州中考志愿模拟助手-买家操作教程.srt"
FFMPEG = Path(r"E:\ffmpeg-8.1.1-essentials_build\bin\ffmpeg.exe")
FFPROBE = Path(r"E:\ffmpeg-8.1.1-essentials_build\bin\ffprobe.exe")

W, H = 1920, 1080
FONT = Path(r"C:\Windows\Fonts\msyh.ttc")
FONT_BOLD = Path(r"C:\Windows\Fonts\msyhbd.ttc")


SCENES = [
    {
        "id": "00_hook",
        "kind": "title",
        "title": "分数够了，志愿顺序没填好\n也可能错过更适合的高中",
        "subtitle": "广州中考志愿模拟助手｜买家完整操作教程",
        "narration": "分数够了，志愿顺序没填好，也可能错过更适合的高中。这条视频带你从序列号解锁开始，完整体验广州中考志愿模拟助手。",
    },
    {
        "id": "01_home",
        "image": "01_home.png",
        "url": "https://zhongkao.pinmooconsulting.com/",
        "tag": "第1步｜打开正式网站",
        "cursor": ((0.18, 0.80), (0.93, 0.04)),
        "narration": "先在浏览器打开 zhongkao.pinmooconsulting.com。首页会显示当前数据版本、三种使用模式，以及特长生和自主招生的查询入口。",
    },
    {
        "id": "02_unlock_blank",
        "image": "02_unlock_blank.png",
        "url": "https://zhongkao.pinmooconsulting.com/unlock/",
        "tag": "第2步｜进入序列号解锁页",
        "cursor": ((0.86, 0.05), (0.50, 0.54)),
        "narration": "第一次使用，点击右上角的解锁或账户，进入序列号页面。系统不要求注册账号，也不需要填写考生姓名、准考证号或联系方式。",
    },
    {
        "id": "03_unlock_filled",
        "image": "03_unlock_filled.png",
        "url": "https://zhongkao.pinmooconsulting.com/unlock/",
        "tag": "粘贴购买平台发送的序列号",
        "cursor": ((0.50, 0.54), (0.50, 0.66)),
        "narration": "把购买平台发送的十位序列号完整粘贴，然后点击验证并解锁。一个序列号最多绑定两台不同设备，第三台设备需要新的序列号。",
    },
    {
        "id": "04_unlocked",
        "image": "04_unlocked.png",
        "url": "https://zhongkao.pinmooconsulting.com/unlock/",
        "tag": "解锁成功｜还能绑定1台设备",
        "cursor": ((0.50, 0.66), (0.50, 0.53)),
        "narration": "验证成功后，页面会显示当前设备已经解锁、已绑定设备数量和剩余次数。以后用这台设备再次访问，可以直接进入完整功能。",
    },
    {
        "id": "05_mode_overview",
        "image": "01_home.png",
        "url": "https://zhongkao.pinmooconsulting.com/",
        "tag": "三种模式可以互相切换",
        "cursor": ((0.90, 0.05), (0.20, 0.56)),
        "narration": "首页有三个入口。只知道大概分数，就用方向版；已经有目标学校，就用目标校版；已有志愿计划，想检查风险，就进入求证版。",
    },
    {
        "id": "06_direction_form",
        "image": "05_direction_form.png",
        "url": "https://zhongkao.pinmooconsulting.com/direction/",
        "tag": "模式一｜只填分数找方向",
        "cursor": ((0.18, 0.50), (0.89, 0.83)),
        "narration": "先看方向版。示例填写六百八十分到七百分，户籍生，升学区和户籍区都选天河区，方案偏向均衡。还可以开启高保真模拟，让系统同时考虑估分波动和历年难度。",
    },
    {
        "id": "07_direction_result",
        "image": "06_direction_result_top.png",
        "url": "https://zhongkao.pinmooconsulting.com/direction/",
        "tag": "系统自动生成冲、稳、保草案",
        "cursor": ((0.88, 0.83), (0.89, 0.22)),
        "narration": "点击生成后，系统直接给出第三批和第四批草案，并展示估分中心、冲稳保结构、当前评分、未录取风险和最可能去向。每所学校同时显示单校把握和整组志愿中的最终去向。",
    },
    {
        "id": "08_direction_stable",
        "image": "07_direction_stable.png",
        "url": "https://zhongkao.pinmooconsulting.com/direction/",
        "tag": "进取、均衡、稳健一键切换",
        "cursor": ((0.75, 0.22), (0.91, 0.22)),
        "narration": "家长可以在进取、均衡和稳健之间一键切换。这里选择稳健后，冲刺学校减少，匹配和保底位置增加，整张表会重新计算，而不只是换一句提示。",
    },
    {
        "id": "09_target_form",
        "image": "08_target_form.png",
        "url": "https://zhongkao.pinmooconsulting.com/target/",
        "tag": "模式二｜围绕目标学校倒推",
        "cursor": ((0.18, 0.50), (0.91, 0.66)),
        "narration": "再看目标校版。输入广州市培正中学，当前估分六百九十分，考生类别选户籍生，升学区和户籍区选择越秀区，然后点击分析目标学校。",
    },
    {
        "id": "10_target_result",
        "image": "09_target_result.png",
        "url": "https://zhongkao.pinmooconsulting.com/target/",
        "tag": "冲刺分、历史依据和志愿位置",
        "cursor": ((0.90, 0.66), (0.90, 0.17)),
        "narration": "系统倒推出培正中学建议冲刺分六百九十三分起，并分别给出冲刺、匹配和稳妥目标。下方列出二零二三到二零二六年的录取依据，以及目标学校应该放在哪个志愿位置。",
    },
    {
        "id": "11_verify_draft",
        "image": "10_verify_draft.png",
        "url": "https://zhongkao.pinmooconsulting.com/verify/?draft=target",
        "tag": "模式三｜目标建议自动带入求证版",
        "cursor": ((0.90, 0.17), (0.92, 0.28)),
        "narration": "点击按此建议生成求证草案，目标学校、考生分数和配套学校会自动带入求证版。这里已经填好第三批六个、第四批六个志愿，家长不用重新逐项选择。",
    },
    {
        "id": "12_verify_analysis",
        "image": "11_verify_analysis.png",
        "url": "https://zhongkao.pinmooconsulting.com/verify/",
        "tag": "整张表评分｜录取机会｜调整建议",
        "cursor": ((0.92, 0.28), (0.88, 0.67)),
        "narration": "点击帮我检查，系统先给整张表评分，再拆解资格、槽位利用、冲稳保结构、志愿顺序和保底偏好。当前示例六十二分，系统明确指出还缺匹配校、保底校，以及哪些志愿顺序需要调整。",
    },
    {
        "id": "13_verify_adjusted",
        "image": "12_verify_adjusted.png",
        "url": "https://zhongkao.pinmooconsulting.com/verify/",
        "tag": "点击系统自动补强｜评分自动更新",
        "cursor": ((0.88, 0.67), (0.91, 0.63)),
        "narration": "在满分补强清单中点击系统自动补强，网站会直接替换学校或重排位置，并自动重新分析。这个示例调整后由六十二分提升到七十六分，最可能去向和各维度得分也同步更新。",
    },
    {
        "id": "14_end",
        "kind": "end",
        "title": "先模拟，再填报",
        "subtitle": "zhongkao.pinmooconsulting.com",
        "narration": "最后提醒：所有评分、机会区间和学校建议都是基于公开政策与历史数据的统计估计，不代表官方录取结果或任何录取承诺。正式填报前，请再次核对当年广州招考官方信息。本系统仅供参考。",
    },
]


def font(size: int, bold: bool = False):
    return ImageFont.truetype(str(FONT_BOLD if bold else FONT), size=size)


def rounded_gradient(size, top, bottom, radius=0):
    w, h = size
    im = Image.new("RGB", size)
    px = im.load()
    for y in range(h):
        t = y / max(1, h - 1)
        color = tuple(round(top[i] * (1 - t) + bottom[i] * t) for i in range(3))
        for x in range(w):
            px[x, y] = color
    if radius:
        mask = Image.new("L", size, 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, w, h), radius=radius, fill=255)
        im.putalpha(mask)
    return im


def draw_centered_multiline(draw, xy, text, fnt, fill, spacing=20):
    box = draw.multiline_textbbox((0, 0), text, font=fnt, spacing=spacing, align="center")
    tw, th = box[2] - box[0], box[3] - box[1]
    draw.multiline_text((xy[0] - tw / 2, xy[1] - th / 2), text, font=fnt, fill=fill, spacing=spacing, align="center")


def title_card(scene, out):
    im = rounded_gradient((W, H), (9, 43, 78), (26, 93, 154)).convert("RGBA")
    draw = ImageDraw.Draw(im)
    draw.ellipse((1500, -180, 2080, 400), fill=(46, 116, 181, 95))
    draw.ellipse((-220, 710, 420, 1350), fill=(231, 166, 41, 55))
    draw.rounded_rectangle((158, 116, 520, 166), radius=25, fill=(255, 255, 255, 28))
    draw.text((184, 126), "品沐咨询 · 广州中考", font=font(24, True), fill="#123B66")
    draw_centered_multiline(draw, (W / 2, 450), scene["title"], font(64, True), "#FFFFFF", spacing=28)
    draw.rounded_rectangle((430, 650, 1490, 744), radius=28, fill=(255, 255, 255, 32), outline=(255, 255, 255, 65), width=2)
    draw_centered_multiline(draw, (W / 2, 697), scene["subtitle"], font(30, False), "#123B66", spacing=12)
    draw.text((W / 2, 920), "由品沐咨询提供", anchor="mm", font=font(23, False), fill="#BCD6EA")
    im.convert("RGB").save(out, quality=95)


def end_card(scene, out):
    im = rounded_gradient((W, H), (245, 249, 253), (224, 238, 250)).convert("RGBA")
    draw = ImageDraw.Draw(im)
    draw.rounded_rectangle((180, 126, 1740, 866), radius=42, fill="#FFFFFF", outline="#D6E3EF", width=3)
    draw.ellipse((270, 240, 390, 360), fill="#0E6EF0")
    draw.line((298, 301, 322, 327), fill="#FFFFFF", width=12)
    draw.line((321, 327, 363, 276), fill="#FFFFFF", width=12)
    draw_centered_multiline(draw, (W / 2, 410), scene["title"], font(72, True), "#123B66")
    draw.text((W / 2, 550), scene["subtitle"], anchor="mm", font=font(33, False), fill="#2E74B5")
    draw.rounded_rectangle((510, 650, 1410, 730), radius=28, fill="#FFF6DF")
    draw.text((W / 2, 690), "模拟结果不代表录取承诺 · 请以当年官方信息为准", anchor="mm", font=font(24, True), fill="#8A6320")
    draw.text((W / 2, 820), "本系统仅供参考", anchor="mm", font=font(26, False), fill="#66788A")
    im.convert("RGB").save(out, quality=95)


def browser_frame(scene, out):
    src = Image.open(SCREENS / scene["image"]).convert("RGB")
    canvas = Image.new("RGB", (W, H), "#E9EFF5")
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((50, 14, 1870, 1074), radius=28, fill=(15, 38, 62, 70))
    shadow = shadow.filter(ImageFilter.GaussianBlur(12))
    canvas.paste(shadow, (0, 0), shadow)
    window = Image.new("RGB", (1800, 1040), "white")
    wd = ImageDraw.Draw(window)
    wd.rounded_rectangle((0, 0, 1800, 1040), radius=24, fill="#FFFFFF")
    wd.rectangle((0, 24, 1800, 62), fill="#F7F9FB")
    for i, color in enumerate(("#FF605C", "#FFBD44", "#00CA4E")):
        wd.ellipse((24 + 34 * i, 22, 42 + 34 * i, 40), fill=color)
    wd.rounded_rectangle((170, 13, 1640, 50), radius=18, fill="#FFFFFF", outline="#DCE5ED", width=2)
    wd.text((197, 24), scene["url"], font=font(18), fill="#52677B")
    wd.rounded_rectangle((1655, 13, 1780, 50), radius=18, fill="#EAF3FA")
    wd.text((1718, 31), "安全连接", anchor="mm", font=font(16, True), fill="#2E74B5")
    target_w, target_h = 1800, 978
    src_ratio = src.width / src.height
    target_ratio = target_w / target_h
    if src_ratio < target_ratio:
        crop_h = round(src.width / target_ratio)
        top = 0
        src = src.crop((0, top, src.width, top + crop_h))
    else:
        crop_w = round(src.height * target_ratio)
        left = (src.width - crop_w) // 2
        src = src.crop((left, 0, left + crop_w, src.height))
    src = src.resize((target_w, target_h), Image.Resampling.LANCZOS)
    window.paste(src, (0, 62))
    canvas.paste(window, (60, 20))
    draw = ImageDraw.Draw(canvas)
    tag_w = max(330, draw.textbbox((0, 0), scene["tag"], font=font(24, True))[2] + 58)
    draw.rounded_rectangle((92, 92, 92 + tag_w, 144), radius=18, fill="#123B66")
    draw.text((121, 105), scene["tag"], font=font(24, True), fill="#FFFFFF")
    canvas.save(out, quality=95)


def make_cursor_assets():
    cursor = Image.new("RGBA", (72, 92), (0, 0, 0, 0))
    d = ImageDraw.Draw(cursor)
    pts = [(8, 6), (8, 70), (25, 54), (37, 85), (51, 78), (39, 49), (65, 46)]
    d.polygon(pts, fill="#FFFFFF", outline="#123B66")
    d.line(pts + [pts[0]], fill="#123B66", width=5, joint="curve")
    cursor.save(WORK / "cursor.png")
    ring = Image.new("RGBA", (120, 120), (0, 0, 0, 0))
    rd = ImageDraw.Draw(ring)
    rd.ellipse((12, 12, 108, 108), outline=(14, 110, 240, 220), width=8)
    rd.ellipse((36, 36, 84, 84), outline=(14, 110, 240, 150), width=5)
    ring.save(WORK / "click-ring.png")


async def synthesize(scene, out):
    communicate = edge_tts.Communicate(scene["narration"], "zh-CN-XiaoxiaoNeural", rate="-4%", volume="+0%")
    await communicate.save(str(out))


def duration(path):
    cmd = [str(FFPROBE), "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path)]
    return float(subprocess.check_output(cmd, text=True).strip())


def ffmpeg_run(cmd):
    proc = subprocess.run(
        cmd,
        cwd=ROOT,
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    if proc.returncode:
        raise RuntimeError(proc.stdout[-6000:])


def render_segment(scene, idx, seconds):
    bg = FRAMES / f"{scene['id']}.png"
    audio = AUDIO / f"{scene['id']}.mp3"
    out = SEGMENTS / f"{idx:02d}-{scene['id']}.mp4"
    fade_out = max(0.1, seconds - 0.28)
    if scene.get("kind") in {"title", "end"}:
        vf = f"scale={W}:{H},format=yuv420p,fade=t=in:st=0:d=0.25,fade=t=out:st={fade_out:.3f}:d=0.25"
        cmd = [str(FFMPEG), "-y", "-loop", "1", "-i", str(bg), "-i", str(audio), "-vf", vf, "-map", "0:v", "-map", "1:a", "-t", f"{seconds:.3f}"]
    else:
        (sx, sy), (ex, ey) = scene["cursor"]
        sx, sy, ex, ey = sx * W, sy * H, ex * W, ey * H
        move_start = max(0.4, seconds - 2.2)
        move_len = 1.45
        click_start = max(0.5, seconds - 0.65)
        click_end = max(click_start + 0.2, seconds - 0.18)
        x_expr = f"if(lt(t,{move_start:.3f}),{sx:.1f},if(lt(t,{move_start + move_len:.3f}),{sx:.1f}+({ex - sx:.1f})*(t-{move_start:.3f})/{move_len:.3f},{ex:.1f}))"
        y_expr = f"if(lt(t,{move_start:.3f}),{sy:.1f},if(lt(t,{move_start + move_len:.3f}),{sy:.1f}+({ey - sy:.1f})*(t-{move_start:.3f})/{move_len:.3f},{ey:.1f}))"
        filters = (
            f"[0:v]scale={W}:{H},format=rgba[bg];"
            f"[1:v]format=rgba[cur];[bg][cur]overlay=x='{x_expr}':y='{y_expr}'[withcur];"
            f"[2:v]format=rgba[ring];[withcur][ring]overlay=x={ex - 60:.1f}:y={ey - 60:.1f}:enable='between(t,{click_start:.3f},{click_end:.3f})',"
            f"format=yuv420p,fade=t=in:st=0:d=0.25,fade=t=out:st={fade_out:.3f}:d=0.25[v]"
        )
        cmd = [
            str(FFMPEG), "-y", "-loop", "1", "-i", str(bg), "-loop", "1", "-i", str(WORK / "cursor.png"),
            "-loop", "1", "-i", str(WORK / "click-ring.png"), "-i", str(audio), "-filter_complex", filters,
            "-map", "[v]", "-map", "3:a", "-t", f"{seconds:.3f}"
        ]
    cmd += ["-r", "30", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-movflags", "+faststart", str(out)]
    ffmpeg_run(cmd)
    return out


def srt_time(seconds):
    ms = round(seconds * 1000)
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def wrap_cn(text, width=21):
    text = text.strip()
    if len(text) <= width:
        return text
    pivot = min(width, len(text))
    preferred = [i for i, ch in enumerate(text[: width + 3]) if ch in "，、；："]
    if preferred and preferred[-1] >= width // 2:
        pivot = preferred[-1] + 1
    if len(text) - pivot <= 2:
        pivot = max(width // 2, len(text) // 2)
    return text[:pivot] + "\n" + text[pivot:]


def build_srt(durations):
    current = 0.0
    cues = []
    number = 1
    for scene, scene_dur in zip(SCENES, durations):
        parts = [x.strip() for x in re.split(r"(?<=[。！？])", scene["narration"]) if x.strip()]
        usable = max(0.8, scene_dur - 0.25)
        weights = [max(1, len(p)) for p in parts]
        total = sum(weights)
        local = current + 0.1
        for part, weight in zip(parts, weights):
            part_dur = usable * weight / total
            end = min(current + scene_dur - 0.05, local + part_dur)
            cues.append(f"{number}\n{srt_time(local)} --> {srt_time(end)}\n{wrap_cn(part)}\n")
            number += 1
            local = end
        current += scene_dur
    SRT.write_text("\n".join(cues), encoding="utf-8-sig")


async def main():
    for p in (WORK, AUDIO, FRAMES, SEGMENTS):
        p.mkdir(parents=True, exist_ok=True)
    make_cursor_assets()
    for scene in SCENES:
        out = FRAMES / f"{scene['id']}.png"
        if scene.get("kind") == "title":
            title_card(scene, out)
        elif scene.get("kind") == "end":
            end_card(scene, out)
        else:
            browser_frame(scene, out)
        await synthesize(scene, AUDIO / f"{scene['id']}.mp3")

    durations = [duration(AUDIO / f"{scene['id']}.mp3") + 0.7 for scene in SCENES]
    segment_paths = [render_segment(scene, idx, sec) for idx, (scene, sec) in enumerate(zip(SCENES, durations))]
    concat_file = WORK / "concat.txt"
    concat_file.write_text("\n".join(f"file '{p.as_posix()}'" for p in segment_paths), encoding="utf-8")
    joined = WORK / "joined.mp4"
    ffmpeg_run([str(FFMPEG), "-y", "-f", "concat", "-safe", "0", "-i", str(concat_file), "-c", "copy", str(joined)])
    build_srt(durations)
    subtitle_filter = "subtitles='广州中考志愿模拟助手-买家操作教程.srt':force_style='FontName=Microsoft YaHei,FontSize=18,PrimaryColour=&H00FFFFFF,OutlineColour=&H0022384F,BackColour=&H70000000,BorderStyle=3,Outline=1,Shadow=0,MarginV=38,Alignment=2'"
    ffmpeg_run([
        str(FFMPEG), "-y", "-i", str(joined), "-vf", subtitle_filter,
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-c:a", "copy", "-movflags", "+faststart", str(FINAL)
    ])
    manifest = {
        "video": str(FINAL),
        "subtitles": str(SRT),
        "durationSeconds": round(duration(FINAL), 2),
        "resolution": f"{W}x{H}",
        "voice": "zh-CN-XiaoxiaoNeural",
        "scenes": [{"id": s["id"], "duration": round(d, 2), "narration": s["narration"]} for s, d in zip(SCENES, durations)],
    }
    (ROOT / "成片信息.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
