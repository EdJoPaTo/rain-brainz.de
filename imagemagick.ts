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
	const output = await exec(
		"identify",
		"-format",
		"%[EXIF:DateTime]\n%[EXIF:Model]\n%[EXIF:ImageDescription]\n",
		name,
	);

	const match = /^(.*)\n(.*)\n([\w\W]*)\n$/.exec(output);
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
	const output = await exec("identify", path);

	const match = / (\d+)x(\d+) /.exec(output);
	if (!match) {
		throw new Error("failed to parse identify stdout");
	}

	const width = Number(match[1]);
	const height = Number(match[2]);
	return { width, height };
}

export async function convert(...options: string[]): Promise<void> {
	await exec("nice", "convert", ...options);
}

export async function exec(cmd: string, ...args: string[]): Promise<string> {
	const process = new Deno.Command(cmd, { args, stdout: "piped" }).spawn();
	const status = await process.status;
	if (!status.success) {
		throw new Error(`Command ${cmd} was not successful`);
	}

	const { stdout: outputBuffer } = await process.output();
	const output = new TextDecoder().decode(outputBuffer);
	return output;
}
