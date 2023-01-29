#!/usr/bin/env bash
set -eu

rm -rf public/i/
deno run --allow-read=originals,parts,public --allow-write=public --allow-run generate.ts
rsync \
	--checksum \
	--compress \
	--delay-updates \
	--delete-delay \
	--exclude=.DS_Store \
	--perms \
	--recursive \
	--verbose \
	public/ xmas2014.3t0.de:/var/www/rain-brainz.de/
