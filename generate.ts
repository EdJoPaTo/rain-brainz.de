import * as imagemagick from "./imagemagick.ts";

function fileExists(path: string) {
  try {
    return Deno.statSync(path).isFile;
  } catch {
    return false;
  }
}

const originalFiles = [...Deno.readDirSync("originals")]
  .filter((o) => o.isFile)
  .map((o) => o.name)
  .filter((o) => o !== ".gitkeep")
  .map((name, i) => ({ i, name }));

const originals: imagemagick.ImageMeta[] = [];

for (const { i, name } of originalFiles) {
  console.log(
    "identify",
    (i / originalFiles.length).toFixed(2).slice(2) + "%",
    originals.length + 1,
    name,
  );
  const meta = await imagemagick.identify("originals/" + name);
  originals.push(meta);
}

console.log("total originals found", originals.length);

originals.sort((a, b) => a.name.localeCompare(b.name));
originals.sort((a, b) => b.datetime.localeCompare(a.datetime));

await Deno.mkdir("public/i/", { recursive: true });
let indexHtml = await Deno.readTextFile("parts/prefix.html");

for (const [index, original] of Object.entries(originals)) {
  const i = Number(index);
  console.log(
    "handle",
    original.datetime,
    (i / originals.length).toFixed(2).slice(2) + "%",
    original.name,
  );

  const thumb = `i/${original.datetime}t`;
  const big = `i/${original.datetime}b`;
  const download = `i/${original.datetime}d`;

  const jpgSampling = ["-sampling-factor", "4:2:0"];

  if (!fileExists(`public/${big}.jpg`)) {
    await Promise.all([
      imagemagick.convert(
        original.name,
        "-strip",
        ...jpgSampling,
        "-quality",
        "95",
        `public/${download}.jpg`,
      ),
      imagemagick.convert(
        original.name,
        "-strip",
        "-resize",
        "2000x2000>",
        ...jpgSampling,
        "-quality",
        "85",
        `public/${big}.jpg`,
      ),
      imagemagick.convert(
        original.name,
        "-strip",
        "-resize",
        "450x400>",
        ...jpgSampling,
        "-quality",
        "85",
        `public/${thumb}.jpg`,
      ),
    ]);
  }

  const caption = original.caption || "untitled image";
  const { width: thumbWidth, height: thumbHeight } = await imagemagick
    .identifySize(`public/${thumb}.jpg`);

  indexHtml += `<div class="thumbbox">
\t<a href="#${original.datetime}">
\t\t<img src="${thumb}.jpg" width="${thumbWidth}" height="${thumbHeight}" loading="lazy" alt="${caption}" />
\t</a>
</div>
<div id="${original.datetime}" class="lightbox">
\t<div class="image" style="background-image: url(${big}.jpg);"></div>
`;

  if (i > 0) {
    const before = originals[i - 1]!.datetime;
    indexHtml +=
      `\t<a class="before" href="#${before}" aria-label="Go to the image before"></a>\n`;
  }

  if (i + 1 < originals.length) {
    const after = originals[i + 1]!.datetime;
    indexHtml +=
      `\t<a class="after" href="#${after}" aria-label="Go to the image after"></a>\n`;
  }

  indexHtml +=
    `\t<a class="close" href="#_" aria-label="Close the image overlay"></a>
\t<a class="download" href="${download}.jpg" aria-label="Download the image" download="rain-brainz-${original.datetime}"></a>
</div>
`;
}

indexHtml += await Deno.readTextFile("parts/suffix.html");
await Deno.writeTextFile("public/index.html", indexHtml);
