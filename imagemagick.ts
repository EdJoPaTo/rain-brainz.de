import childProcess from "node:child_process";
import util from "node:util";

const execFile = util.promisify(childProcess.execFile);

export type ImageMeta = {
	readonly name: string;
	readonly datetime: string;
	readonly model: string;
	readonly caption: string;
};

export type Size = {
	readonly width: number;
	readonly height: number;
};

export async function identify(name: string): Promise<ImageMeta> {
	const { stdout, stderr } = await execFile(
		"identify",
		[
			"-format",
			"%[EXIF:DateTime]\n%[EXIF:Model]\n%[EXIF:ImageDescription]\n",
			name,
		],
		{ encoding: "utf8" },
	);
	if (stderr.trim()) {
		console.log(stderr);
	}

	const match = /^(.*)\n(.*)\n([\w\W]*)\n$/.exec(stdout);
	if (!match) {
		throw new Error("failed to parse identify stdout");
	}

	const datetime = match[1]!.trim().replace(
		/(\d{4}).(\d{2}).(\d{2}).(\d{2}).(\d{2}).(\d{2})/,
		"$1-$2-$3T$4-$5-$6",
	);
	const model = match[2]!.trim();
	const caption = match[3]!.trim();
	return { name, datetime, model, caption };
}

export async function identifySize(path: string): Promise<Size> {
	const { stdout, stderr } = await execFile("identify", [path], {
		encoding: "utf8",
	});
	if (stderr.trim()) {
		throw new Error("identifySize should not return something on stderr");
	}

	const match = / (\d+)x(\d+) /.exec(stdout);
	if (!match) {
		throw new Error("failed to parse identify stdout");
	}

	const width = Number(match[1]);
	const height = Number(match[2]);
	return { width, height };
}

export async function convert(...options: string[]): Promise<void> {
	await execFile("nice", ["magick", ...options]);
}
