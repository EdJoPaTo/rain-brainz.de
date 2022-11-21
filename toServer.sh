#!/usr/bin/env bash
set -eu

rm -rf public/i/
./generate.sh
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
