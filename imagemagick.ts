import childProcess from "node:child_process";
import util from "node:util";

const execFile = util.promisify(childProcess.execFile);

export type ImageMeta = {
	readonly name: string;
	readonly identifier: string;
	readonly datetime: Date;
	readonly caption: string;
};

export type Size = {
	readonly width: number;
	readonly height: number;
};

export async function identify(name: string): Promise<ImageMeta> {
	const { stdout } = await execFile(
		"identify",
		["-format", "%[EXIF:DateTime]\n%[EXIF:ImageDescription]\n", name],
		{ encoding: "utf8" },
	);

	const lines = stdout
		.split("\n")
		.map((line) => line.trim())
		.toReversed();

	const datetimeNaive = lines.pop()?.replace(
		/(\d{4}).(\d{2}).(\d{2}).(\d{2}).(\d{2}).(\d{2})/u,
		"$1-$2-$3T$4:$5:$6",
	);
	const datetimeMillis = Date.parse(datetimeNaive!);
	if (!Number.isFinite(datetimeMillis)) {
		console.log("parse", name, datetimeNaive, stdout.trim());
		throw new Error("failed to parse identify");
	}
	const datetime = new Date(datetimeMillis);

	lines.reverse();
	const caption = lines.join(" ").trim();

	const identifier = datetime.toISOString()
		.replaceAll(":", "-")
		.replaceAll(/\..+/g, "");

	return { name, identifier, datetime, caption };
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
