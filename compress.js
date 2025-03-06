const imagemin = require("imagemin");
const imageminMozjpeg = require("imagemin-mozjpeg");
const imageminPngquant = require("imagemin-pngquant");
const imageminSvgo = require("imagemin-svgo");
const csso = require("csso");
const sass = require("sass");
const path = require("path");
const fs = require("fs");

const inputDir = "assets";
const outputDir = "minified-assets";

async function processFiles(src, dest) {
  const files = fs.readdirSync(src, { withFileTypes: true });

  for (const file of files) {
    const srcPath = path.join(src, file.name);
    const destPath = path.join(dest, file.name);

    if (file.isDirectory()) {
      // Create the directory in output and process its files
      fs.mkdirSync(destPath, { recursive: true });
      await processFiles(srcPath, destPath);
    } 
    else if (file.name.endsWith(".scss")) {
      // Compile & Minify SCSS
      try {
        const compiledCss = sass.renderSync({ file: srcPath }).css.toString();
        const minifiedCss = csso.minify(compiledCss).css;
        const cssDestPath = destPath.replace(".scss", ".css");
        fs.writeFileSync(cssDestPath, minifiedCss);
        console.log(`✅ Compiled & Minified SCSS: ${srcPath} → ${cssDestPath}`);
      } catch (error) {
        console.error(`❌ Failed to process SCSS: ${srcPath}`, error);
      }
    } 
    else if (file.name.endsWith(".css")) {
      // Minify CSS
      try {
        const cssContent = fs.readFileSync(srcPath, "utf8");
        const minifiedCss = csso.minify(cssContent).css;
        fs.writeFileSync(destPath, minifiedCss);
        console.log(`✅ Minified CSS: ${srcPath} → ${destPath}`);
      } catch (error) {
        console.error(`❌ Failed to minify CSS: ${srcPath}`, error);
      }
    } 
    else if (file.name.match(/\.(jpe?g|png|svg)$/i)) {
      // Optimize Images (JPEG, PNG, SVG)
      try {
        await imagemin([srcPath], {
          destination: dest,
          plugins: [
            imageminMozjpeg({ quality: 60 }),
            imageminPngquant({ quality: [0.55, 0.7] }),
            imageminSvgo({
              plugins: [
                { removeViewBox: false },
                { cleanupIDs: true },
                { removeMetadata: true }
              ]
            })
          ],
        });
        console.log(`✅ Compressed Image: ${srcPath} → ${destPath}`);
      } catch (error) {
        console.error(`❌ Failed to compress image: ${srcPath}`, error);
      }
    } 
    else {
      // Copy other files as-is
      try {
        fs.copyFileSync(srcPath, destPath);
        console.log(`✅ Copied: ${srcPath} → ${destPath}`);
      } catch (error) {
        console.error(`❌ Failed to copy file: ${srcPath}`, error);
      }
    }
  }
}

// Ensure output directory exists
fs.mkdirSync(outputDir, { recursive: true });

// Start processing
processFiles(inputDir, outputDir)
  .then(() => console.log("\n🎉 Compression & Copying Completed Successfully!"))
  .catch((error) => console.error("\n❌ An error occurred:", error));
