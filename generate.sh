#!/usr/bin/env bash
set -e

mkdir -p public/generated
ln -srf main.css robots.txt public

cat prefix.html > public/index.html

for file in originals/*; do
    filename=$(basename "$file")
    # extension="${filename##*.}"
    basename="${filename%.*}"

    thumb="generated/${basename}_thumb.webp"
    big="generated/${basename}_big.webp"

    echo "handle $file"

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
<a href="#$basename">
    <img class="thumbnail" src="$thumb" width="450" height="300" alt="Thumbnail of an untitled image" />
</a>
<div id="$basename" class="lightbox">
    <div class="image" style="background-image: url($big)"></div>
    <a class="lightbox_close" href="#_" aria-label="Close the image overlay"></a>
    <a class="lightbox_download" href="$big" aria-label="Download the image"></a>
</div>
EOF

done

wait
cat suffix.html >> public/index.html
