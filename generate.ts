import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	utimesSync,
	writeFileSync,
} from "node:fs";
import { cpus } from "node:os";

import * as imagemagick from "./imagemagick.ts";

const cores = cpus().length;

const originalFiles = readdirSync("originals", { withFileTypes: true })
	.filter((o) => o.isFile)
	.map((o) => o.name)
	.filter((o) => o !== ".gitkeep")
	.filter((o) => o !== ".DS_Store");

const originals: imagemagick.ImageMeta[] = [];

while (originalFiles.length) {
	console.log("identify", originalFiles.length, "->", originals.length);
	const batch = await Promise.all(
		originalFiles
			.splice(0, cores)
			.map((name) => imagemagick.identify("originals/" + name)),
	);
	originals.push(...batch);
}
console.log("total originals found", originals.length);

originals.sort((a, b) => a.name.localeCompare(b.name));
originals.sort((a, b) => b.datetime.getTime() - a.datetime.getTime());

mkdirSync("public/i/", { recursive: true });
let indexHtml = readFileSync("parts/prefix.html", "utf8");

for (const [index, original] of Object.entries(originals)) {
	const i = Number(index);
	console.log(
		"handle",
		original.identifier,
		(i / originals.length).toFixed(2).slice(2) + "%",
		original.name,
	);

	const thumb = `i/${original.identifier}t`;
	const big = `i/${original.identifier}b`;
	const download = `i/${original.identifier}d`;

	const jpgSampling = ["-sampling-factor", "4:2:0"];

	if (!existsSync(`public/${big}.jpg`)) {
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

		for (const name of [thumb, big, download]) {
			utimesSync(`public/${name}.jpg`, original.datetime, original.datetime);
		}
	}

	const caption = original.caption || "untitled image";
	const { width: thumbWidth, height: thumbHeight } = await imagemagick
		.identifySize(`public/${thumb}.jpg`);
	const { width: bigWidth, height: bigHeight } = await imagemagick
		.identifySize(`public/${big}.jpg`);

	indexHtml += `<div class="thumbbox">
\t<a href="#${original.identifier}">
\t\t<img src="${thumb}.jpg" width="${thumbWidth}" height="${thumbHeight}" loading="lazy" alt="${caption}" />
\t</a>
</div>
<div id="${original.identifier}" class="lightbox">
\t<img src="${big}.jpg" width="${bigWidth}" height="${bigHeight}" loading="lazy" alt="${caption}" title="${caption}" />
`;

	if (i > 0) {
		const before = originals[i - 1]!.identifier;
		indexHtml +=
			`\t<a class="before" href="#${before}" aria-label="Go to the image before"></a>\n`;
	}

	if (i + 1 < originals.length) {
		const after = originals[i + 1]!.identifier;
		indexHtml +=
			`\t<a class="after" href="#${after}" aria-label="Go to the image after"></a>\n`;
	}

	indexHtml +=
		`\t<a class="close" href="#_" aria-label="Close the image overlay"></a>
\t<a class="download" href="${download}.jpg" aria-label="Download the image" download="rain-brainz-${original.identifier}.jpg"></a>
\t<p class="caption">
`;

	if (original.caption) {
		indexHtml += `\t\t${caption}
\t\t<br>
`;
	}

	indexHtml +=
		`\t\t<a href="https://creativecommons.org/licenses/by-nd/4.0/">CC-BY-ND 4.0</a> <a href="https://edjopato.de/">EdJoPaTo</a>
\t</p>
</div>
`;
}

indexHtml += readFileSync("parts/suffix.html", "utf8");
writeFileSync("public/index.html", indexHtml);
