#!/usr/bin/env bash
set -eu

# rm -rf public/index.html public/i/
deno --allow-read=originals,parts,public --allow-write=public --allow-env --allow-run generate.ts
rsync \
	--checksum \
	--delay-updates \
	--delete-delay \
	--exclude=.DS_Store \
	--perms \
	--recursive \
	--verbose \
	public/ xmas2014.3t0.de:/var/www/rain-brainz.de/
