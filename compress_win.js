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

// Ensure output directory exists
fs.mkdirSync(outputDir, { recursive: true });

async function processFiles(src, dest) {
  const files = fs.readdirSync(src, { withFileTypes: true });
  
  for (const file of files) {
    const srcPath = path.join(src, file.name).replace(/\\/g, "/"); // Normalize Windows path
    const destPath = path.join(dest, file.name).replace(/\\/g, "/");

    console.log(`🔍 Processing: ${srcPath}`);

    if (file.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      await processFiles(srcPath, destPath);
    } 
    else if (file.name.endsWith(".scss")) {
      try {
        console.log(`🎨 Compiling SCSS: ${srcPath}`);
        const compiledCss = sass.renderSync({ file: srcPath }).css.toString();
        const minifiedCss = csso.minify(compiledCss).css;
        const cssDestPath = destPath.replace(".scss", ".css");
        await fs.promises.writeFile(cssDestPath, minifiedCss);
        console.log(`✅ SCSS Minified: ${srcPath} → ${cssDestPath}`);
      } catch (error) {
        console.error(`❌ Failed SCSS: ${srcPath}`, error);
      }
    } 
    else if (file.name.endsWith(".css")) {
      try {
        console.log(`🎭 Minifying CSS: ${srcPath}`);
        const cssContent = await fs.promises.readFile(srcPath, "utf8");
        const minifiedCss = csso.minify(cssContent).css;
        await fs.promises.writeFile(destPath, minifiedCss);
        console.log(`✅ CSS Minified: ${srcPath} → ${destPath}`);
      } catch (error) {
        console.error(`❌ Failed CSS Minify: ${srcPath}`, error);
      }
    } 
    else if (file.name.match(/\.(jpe?g|png|svg)$/i)) {
      try {
        console.log(`🖼️ Compressing Image: ${srcPath}`);

        // Compress the image using appropriate plugins for each format.
        await imagemin([srcPath], {
          destination: dest,
          plugins: [
            imageminMozjpeg({ quality: 60 }),
            imageminPngquant({ quality: [0.55, 0.7] }),
            imageminSvgo({ plugins: [{ removeViewBox: false }] }),
          ],
        });
        console.log(`✅ Image Compressed: ${srcPath} → ${destPath}`);

        // Convert JPEG/JPG/PNG to WebP (skip SVG conversion)
        if (file.name.match(/\.(jpe?g|png)$/i)) {
          const webpDestPath = destPath.replace(/\.(jpe?g|png)$/i, ".webp");
          const { default: imageminWebp } = await import("imagemin-webp");
          await imagemin([srcPath], {
            destination: dest,
            plugins: [imageminWebp({ quality: 75 })],
          });
          console.log(`✅ Converted to WebP: ${srcPath} → ${webpDestPath}`);
        }
      } catch (error) {
        console.error(`❌ Failed Image Compression/Conversion: ${srcPath}`, error);
      }
    } 
    else {
      try {
        await fs.promises.copyFile(srcPath, destPath);
        console.log(`📄 Copied: ${srcPath} → ${destPath}`);
      } catch (error) {
        console.error(`❌ Failed Copy: ${srcPath}`, error);
      }
    }
  }
}

// Run the script
processFiles(inputDir, outputDir)
  .then(() => console.log("\n🎉 Compression, Conversion & Copying Completed Successfully!"))
  .catch((error) => console.error("\n❌ An error occurred:", error));
