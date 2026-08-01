import json
import sys
from pathlib import Path

sys.path.insert(0, r"E:\pinmoo\workspace")
import build_zhongkao_buyer_video as b


def main():
    b.title_card(b.SCENES[0], b.FRAMES / f"{b.SCENES[0]['id']}.png")
    b.end_card(b.SCENES[-1], b.FRAMES / f"{b.SCENES[-1]['id']}.png")

    durations = [b.duration(b.AUDIO / f"{scene['id']}.mp3") + 0.7 for scene in b.SCENES]
    b.render_segment(b.SCENES[0], 0, durations[0])
    b.render_segment(b.SCENES[-1], len(b.SCENES) - 1, durations[-1])
    b.build_srt(durations)

    segment_paths = [b.SEGMENTS / f"{idx:02d}-{scene['id']}.mp4" for idx, scene in enumerate(b.SCENES)]
    concat_file = b.WORK / "concat-final.txt"
    concat_file.write_text("\n".join(f"file '{path.as_posix()}'" for path in segment_paths), encoding="utf-8")
    joined = b.WORK / "joined-final.mp4"
    b.ffmpeg_run([str(b.FFMPEG), "-y", "-f", "concat", "-safe", "0", "-i", str(concat_file), "-c", "copy", str(joined)])

    final = b.ROOT / "广州中考志愿模拟助手-买家操作教程-正式版-v2.mp4"
    subtitle_filter = "subtitles='广州中考志愿模拟助手-买家操作教程.srt':force_style='FontName=Microsoft YaHei,FontSize=18,PrimaryColour=&H00FFFFFF,OutlineColour=&H0022384F,BackColour=&H70000000,BorderStyle=3,Outline=1,Shadow=0,MarginV=38,Alignment=2'"
    b.ffmpeg_run([
        str(b.FFMPEG), "-y", "-i", str(joined), "-vf", subtitle_filter,
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-c:a", "copy", "-movflags", "+faststart", str(final),
    ])

    manifest = {
        "video": str(final),
        "subtitles": str(b.SRT),
        "durationSeconds": round(b.duration(final), 2),
        "resolution": f"{b.W}x{b.H}",
        "voice": "zh-CN-XiaoxiaoNeural",
        "scenes": len(b.SCENES),
    }
    (b.ROOT / "成片信息.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(manifest, ensure_ascii=False))


if __name__ == "__main__":
    main()
