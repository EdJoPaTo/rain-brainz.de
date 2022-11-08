#!/usr/bin/env bash
set -eu

mkdir -p public/i/

cp parts/prefix.html public/index.html

for file in originals/*; do
	filename=$(basename "$file")
	files+=("$filename")
done

# see https://stackoverflow.com/questions/7442417/how-to-sort-an-array-in-bash#11789688
IFS=$'\n' sorted=($(sort -h <<<"${files[*]}"))

for ((i = 0; i < ${#sorted[@]}; i++)); do
	filename="${sorted[$i]}"
	file="originals/$filename"

	# extension="${filename##*.}"
	# basename="${filename%.*}"

	thumb="i/${i}_thumb"
	big="i/${i}_big"
	download="i/${i}_download"

	echo "handle $((i + 1))/${#sorted[@]}: $filename"

	if [ ! -f "public/$big.avif" ]; then
		convert "$file" \
			-strip \
			-resize '450x300^' -gravity Center -extent '450x300' \
			"public/$thumb.avif"
		nice convert "$file" \
			-strip \
			-resize '3000x2500>' \
			"public/$big.avif" &
		nice convert "$file" \
			-strip \
			-resize '450x300^' -gravity Center -extent '450x300' \
			-sampling-factor 4:2:0 -quality 85 \
			"public/$thumb.jpg" &
		nice convert "$file" \
			-strip \
			-resize '2000x1500>' \
			-sampling-factor 4:2:0 -quality 85 \
			"public/$big.jpg" &
		nice convert "$file" \
			-strip \
			-sampling-factor 4:2:0 -quality 95 \
			"public/$download.jpg" &

		wait
	fi

	cat <<EOF >>public/index.html
<a href="#$i">
	<picture>
		<source srcset="$thumb.avif" type="image/avif">
		<img src="$thumb.jpg" width="450" height="300" loading="lazy" alt="Thumbnail of an untitled image" />
	</picture>
</a>
<div id="$i" class="lightbox">
	<div class="image" style="background-image: url($big.jpg); background-image: image-set(url($big.avif) type('image/avif'));"></div>
EOF

	if ((i > 0)); then
		before=$((i - 1))
		cat <<EOF >>public/index.html
	<a class="before" href="#${before}" aria-label="Go to the image before"></a>
EOF
	fi

	if ((i < ${#sorted[@]} - 1)); then
		after=$((i + 1))
		cat <<EOF >>public/index.html
	<a class="after" href="#${after}" aria-label="Go to the image after"></a>
EOF
	fi

	cat <<EOF >>public/index.html
	<a class="close" href="#_" aria-label="Close the image overlay"></a>
	<a class="download" href="$download.jpg" aria-label="Download the image" download="rain-brainz-$i"></a>
</div>
EOF
done

cat parts/suffix.html >>public/index.html
wait
