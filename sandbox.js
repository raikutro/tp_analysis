import TPMI from './index.js';
import savePixels from 'save-pixels';
import { createWriteStream } from 'fs';
import { writeFile } from 'fs/promises';

(async () => {
	console.log("Running Sandbox");
	// 76945
	const tileMap = await TPMI.mapIDToTileMap(77021);

	const wallMask = TPMI.createWallMask(tileMap);
	const wallGradient = TPMI.distanceTransform(wallMask);

	const wallMorphological = TPMI.morphologicalMatrix(wallMask, {
		diagonal: true
	});
	const wallVoronoi = TPMI.voronoiMatrix(wallMorphological, {

	});
	const voronoiMapOverlay = TPMI.overlayMatrices([
		wallVoronoi,
		TPMI.mapMatrix(wallMask, num => -num)
	]);

	savePixels(TPMI.colorize(wallMask, ['0', 'ffffff']), "png")
		.pipe(createWriteStream(new URL('./tmp/mask.png', import.meta.url)));
	savePixels(TPMI.colorize(wallGradient, ['0', 'ffffff']), "png")
		.pipe(createWriteStream(new URL('./tmp/gradient.png', import.meta.url)));
	savePixels(TPMI.colorize(wallMorphological), "png")
		.pipe(createWriteStream(new URL('./tmp/morphological.png', import.meta.url)));
	savePixels(TPMI.colorize(wallVoronoi), "png")
		.pipe(createWriteStream(new URL('./tmp/voronoi.png', import.meta.url)));
		savePixels(TPMI.colorize(voronoiMapOverlay), "png")
		.pipe(createWriteStream(new URL('./tmp/overlay.png', import.meta.url)));

	await writeFile(new URL('./tmp/view.html', import.meta.url), `
		${TPMI.matrixToHTML(tileMap)}<br>
		${TPMI.matrixToHTML(wallMorphological)}<br>
		${TPMI.matrixToHTML(wallVoronoi)}<br>
	`);
})();