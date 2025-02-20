#!/bin/bash

# Ensure the minified output directory exists
mkdir -p minified-html

# Run html-minifier with the specified options
html-minifier --input-dir ./ \
              --output-dir ./minified-html \
              --collapse-whitespace \
              --remove-comments \
              --minify-css true \
              --minify-js true \
              --preserve-line-breaks \
              --keep-closing-slash

echo "✅ HTML Minification Completed! Files saved in ./minified-html"
