#!/usr/bin/env bash
set -e

rm -rf public/generated/
./generate.sh
rsync \
    --recursive --perms --times \
    --compress --verbose --checksum --delete-delay --delay-updates \
    --exclude=.DS_Store \
    public/ xmas2014.3t0.de:/var/www/rain-brainz.de/
