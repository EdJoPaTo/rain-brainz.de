#!/usr/bin/env bash
set -eu

rm -rf public/generated/
./generate.sh
rsync \
	--recursive --perms --times --omit-dir-times \
	--compress --verbose --checksum --delete-delay --delay-updates \
	--exclude=.DS_Store \
	public/ xmas2014.3t0.de:/var/www/rain-brainz.de/
