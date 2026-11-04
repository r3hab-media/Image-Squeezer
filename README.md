# Image Squeezer

Compresses images in the browser. Nothing is uploaded anywhere. Works offline once it has loaded, and can be installed as an app from the browser menu.

## What it does

- Takes up to 25 images at a time (drop, click, paste, or share from another app).
- Caps width at 2000 px by default. The size box on the page changes it, and it can apply to the long edge instead so portrait photos shrink too. Smaller images are never enlarged.
- Changing the settings after adding a batch? **Re-squeeze with current settings** runs every image again.
- JPEG stays JPEG (mozjpeg, quality 80). PNG stays PNG (libimagequant to 256 colors, then oxipng). WebP stays WebP.
- HEIC, AVIF, BMP and GIF are converted. They become JPEG, or PNG if they have transparency or are GIFs.
- If a file cannot get smaller and does not need resizing, the original is returned unchanged.
- Each image downloads on its own, or all at once as a zip.
- Re-encoded images carry no metadata, so GPS location and other EXIF data are dropped. An original that is returned unchanged keeps its metadata.
- A share button in the top bar shares the GitHub Pages link. A features overview opens once on a first visit, and again from the Features link.
- Animated GIF, PNG and WebP files are rejected so the animation is not silently flattened.

## Put it on GitHub Pages

1. Push this repository to GitHub.
2. In the repository, open Settings, then Pages, and set the source to **GitHub Actions**.
3. Every push to `main` runs `.github/workflows/deploy.yml`, which installs dependencies, runs the build and publishes the result.
4. After a minute the site is live at `https://<your-account>.github.io/<repo-name>/`. Share that link.

All paths are relative, so it works from a subfolder URL like that without changes.

The build output (`js/worker.js`, `js/chunks/`, `wasm/`, `sw.js`) is not committed. It is generated during the workflow, so the repository holds only source.

## Changing it

Edit `js/app.js`, `css/style.css` or `index.html` directly. No build needed.

To change the compression code or the service worker, edit `src/worker.src.js` or `src/sw.src.js` and run the following.

```
npm install
npm run build
```

This rebuilds `js/worker.js` and the `js/chunks` folder, copies the wasm files into `wasm/`, and generates `sw.js`.

Node 20 or newer is required.

Settings you are most likely to change in `src/worker.src.js`
- `JPEG_QUALITY` (80)
- `WEBP_QUALITY` (0.8)
- The oxipng level in `encodePng` (2 is fast, 3 saves a little more and is about 4x slower)

In `js/app.js`
- `MAX_FILES` (25). The share target in `src/sw.src.js` has its own cap of 25 to match.
- `MAX_BYTES` (60 MB per file)

In `js/share.js`
- `SHARE_URL`, the link the share button sends. Change it if you publish somewhere else.

## Publishing an update

Push to `main`. The build hashes the precached files and writes that hash into `sw.js` as the cache version, so installed copies pick up a change as soon as one actually happens. There is nothing to bump by hand.

## Todo

- **Pin down what makes the quantizer trap.** `quantize_image` from `@panda-ai/imagequant` panics with a wasm `unreachable` error on some images. `encodePng` catches it and falls back to lossless PNG, so nothing fails outright, but the fallback produces a larger file and says nothing about it. The trigger is still unknown: it is not size related, and several images that reproduced it earlier could not be reproduced later from regenerated copies. Worth finding a reliable repro before deciding on a real fix.

## Notes

- HEIC rotation is handled by libheif. It applies the `irot` and `imir` boxes while decoding and reports the rotated size. Checked with a real phone HEIC and a copy with a 90 degree `irot` added, which came out 3000 x 4000 and upright.

- Very large photos need memory to decode. A 10 MB JPEG is fine on a desktop. Phones with little memory may fail on huge files and will show an error on that row.
- TIFF is not supported because browsers cannot decode it.
- The HEIC decoder is about 2 MB. It only downloads the first time someone drops a HEIC file that the browser cannot open itself.

## License

MIT. See [LICENSE](LICENSE).
