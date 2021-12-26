#!/usr/bin/env bash
set -e

mkdir -p public/generated
ln -srf main.css robots.txt public

cat prefix.html > public/index.html

for file in originals/*; do
	filename=$(basename "$file")
	files+=("$filename")
done

# see https://stackoverflow.com/questions/7442417/how-to-sort-an-array-in-bash#11789688
IFS=$'\n' sorted=($(sort -h <<<"${files[*]}"))

for ((i=0; i<${#sorted[@]}; i++)); do
	filename="${sorted[$i]}"
	file="originals/$filename"

	# extension="${filename##*.}"
	# basename="${filename%.*}"

	thumb="generated/${i}_thumb.webp"
	big="generated/${i}_big.webp"

	echo "handle $i: $filename"

	if [ ! -f "public/$thumb" ]; then
		convert "$file" \
			-strip \
			-resize '450x300^' -gravity Center -extent '450x300' \
			"public/$thumb"
		nice convert "$file" \
			-strip \
			-resize '2000x1000>' \
			"public/$big" &
	fi

	cat <<EOF >> public/index.html
<a href="#$i">
	<img class="thumbnail" src="$thumb" width="450" height="300" alt="Thumbnail of an untitled image" />
</a>
<div id="$i" class="lightbox">
	<div class="image" style="background-image: url($big)"></div>
EOF

	if (( i > 0 )); then
		before=$((i-1))
		cat <<EOF >> public/index.html
	<a class="lightbox_before" href="#${before}" aria-label="Go to the image before"></a>
EOF
	fi

	if (( i < ${#sorted[@]} - 1 )); then
		after=$((i+1))
		cat <<EOF >> public/index.html
	<a class="lightbox_after" href="#${after}" aria-label="Go to the image after"></a>
EOF
	fi

	cat <<EOF >> public/index.html
	<a class="lightbox_close" href="#_" aria-label="Close the image overlay"></a>
	<a class="lightbox_download" href="$big" aria-label="Download the image"></a>
</div>
EOF
done

cat suffix.html >> public/index.html
wait
