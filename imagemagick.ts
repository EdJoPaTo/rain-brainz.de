export type ImageMeta = {
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly datetime: string;
  readonly model: string;
};

export async function identify(name: string): Promise<ImageMeta> {
  const output = await exec(
    "identify",
    "-format",
    "%w\n%h\n%[EXIF:DateTime]\n%[EXIF:Model]\n",
    name,
  );

  const match = /(\d+)\n(\d+)\n(.+)\n(.+)/.exec(output);
  if (!match) {
    throw new Error("failed to parse identify stdout");
  }

  const width = Number(match[1]);
  const height = Number(match[2]);
  const datetime = match[3]!.trim().replace(
    /(\d{4}).(\d{2}).(\d{2}).(\d{2}).(\d{2}).(\d{2})/,
    "$1-$2-$3T$4-$5-$6",
  );
  const model = match[4]!.trim();

  return { name, width, height, datetime, model };
}

export async function convert(...options: string[]): Promise<void> {
  await exec("nice", "convert", ...options);
}

async function exec(...cmd: [string, ...string[]]): Promise<string> {
  const process = Deno.run({ cmd, stdout: "piped" });

  const status = await process.status();
  if (!status.success) {
    throw new Error(`Command ${cmd[0]} was not successful`);
  }

  const outputBuffer = await process.output();
  const output = new TextDecoder().decode(outputBuffer);
  return output;
}
