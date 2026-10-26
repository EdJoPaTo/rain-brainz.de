#!/usr/bin/env bash
set -eu

# rm -rf public/index.html public/i/
deno --allow-read=originals,parts,public --allow-write=public --allow-sys=cpus --allow-env --allow-run generate.ts
rsync \
	--delay-updates \
	--delete-delay \
	--exclude=.DS_Store \
	--perms \
	--prune-empty-dirs \
	--recursive \
	--times \
	--verbose \
	public/ xmas2014.3t0.de:/var/www/rain-brainz.de/
