import * as imagemagick from "./imagemagick.ts";

function fileExists(path: string) {
  try {
    return Deno.statSync(path).isFile;
  } catch {
    return false;
  }
}

const originals: imagemagick.ImageMeta[] = [];

for await (const e of Deno.readDirSync("originals")) {
  if (!e.isFile) continue;
  if (e.name === ".gitkeep") continue;
  const { name } = e;
  console.log("identify", originals.length, name);

  const meta = await imagemagick.identify("originals/" + name);
  originals.push(meta);
}

console.log("total originals found", originals.length);

originals.sort((a, b) => a.name.localeCompare(b.name));
originals.sort((a, b) => a.datetime.localeCompare(b.datetime));

await Deno.mkdir("public/i/", { recursive: true });
let indexHtml = await Deno.readTextFile("parts/prefix.html");

for (const [index, original] of Object.entries(originals)) {
  const i = Number(index);
  console.log(
    "handle",
    original.datetime,
    (i / originals.length).toFixed(2).slice(2) + "%",
    original.name,
    original.width,
    original.height,
  );

  const thumb = `i/${i}_thumb`;
  const big = `i/${i}_big`;
  const download = `i/${i}_download`;

  const thumbResize = ["-resize", "450x400>"];
  const jpgQuality = ["-sampling-factor", "4:2:0", "-quality"];

  if (!fileExists(`public/${big}.avif`)) {
    await Promise.all([
      imagemagick.convert(
        original.name,
        "-strip",
        "-resize",
        "3000x2500>",
        `public/${big}.avif`,
      ),
      imagemagick.convert(
        original.name,
        "-strip",
        ...thumbResize,
        `public/${thumb}.avif`,
      ),
      imagemagick.convert(
        original.name,
        "-strip",
        ...jpgQuality,
        "95",
        `public/${download}.jpg`,
      ),
      imagemagick.convert(
        original.name,
        "-strip",
        "-resize",
        "2000x1500>",
        ...jpgQuality,
        "85",
        `public/${big}.jpg`,
      ),
      imagemagick.convert(
        original.name,
        "-strip",
        ...thumbResize,
        ...jpgQuality,
        "85",
        `public/${thumb}.jpg`,
      ),
    ]);
  }

  const caption = original.caption || "Thumbnail of an untitled image";
  const { width: thumbWidth, height: thumbHeight } = await imagemagick.identify(
    `public/${thumb}.jpg`,
  );

  indexHtml += `<div class="thumbbox">
\t<a href="#${i}">
\t\t<picture>
\t\t\t<source srcset="${thumb}.avif" type="image/avif">
\t\t\t<img src="${thumb}.jpg" width="${thumbWidth}" height="${thumbHeight}" loading="lazy" alt="${caption}" />
\t\t</picture>
\t</a>
</div>
<div id="${i}" class="lightbox">
\t<div class="image" style="background-image: url(${big}.jpg); background-image: image-set(url(${big}.avif) type('image/avif'));"></div>
`;

  if (i > 0) {
    const before = i - 1;
    indexHtml +=
      `\t<a class="before" href="#${before}" aria-label="Go to the image before"></a>\n`;
  }

  if (i + 1 < originals.length) {
    const after = i + 1;
    indexHtml +=
      `\t<a class="after" href="#${after}" aria-label="Go to the image after"></a>\n`;
  }

  indexHtml +=
    `\t<a class="close" href="#_" aria-label="Close the image overlay"></a>
\t<a class="download" href="${download}.jpg" aria-label="Download the image" download="rain-brainz-${i}"></a>
</div>
`;
}

indexHtml += await Deno.readTextFile("parts/suffix.html");
await Deno.writeTextFile("public/index.html", indexHtml);
