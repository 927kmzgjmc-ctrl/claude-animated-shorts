import sys, os, re, glob
from PIL import Image, ImageDraw, ImageFont
d, out, cols = sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 6
src = open("src/akhil/story.ts").read()
shots = [(float(a), n) for n, a in re.findall(r'name: "([^"]+)", s0: ([\d.]+)', src)]
def name(f):
    t = f / 30; n = ""
    for a, nm in shots:
        if t >= a: n = nm
    return n
files = sorted(glob.glob(os.path.join(d, "*.jpeg")) + glob.glob(os.path.join(d, "*.jpg")))
W = 240; H = int(W * 16 / 9)
rows = (len(files) + cols - 1) // cols
im = Image.new("RGB", (cols * W, rows * (H + 22)), "white")
dr = ImageDraw.Draw(im)
font = ImageFont.truetype("/usr/share/fonts/truetype/freefont/FreeSans.ttf", 13)
for i, fp in enumerate(files):
    f = int(re.findall(r"(\d+)\.\w+$", fp)[0]) * int(os.environ.get("EVERY", "1"))
    x, y = (i % cols) * W, (i // cols) * (H + 22)
    im.paste(Image.open(fp).resize((W, H)), (x, y + 22))
    dr.text((x + 3, y + 3), f"{f} {name(f)}", fill="black", font=font)
im.save(out, quality=85)
print(out, im.size)
