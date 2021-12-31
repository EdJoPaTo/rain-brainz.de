#!/usr/bin/env bash
set -e

rm -rf public/generated/
./generate.sh
rsync -acv --compress --omit-dir-times --copy-links --exclude=.DS_Store --delete-delay --delay-updates public/ xmas2014.3t0.de:/var/www/rain-brainz.de/
