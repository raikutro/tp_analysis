import TPMI from './index.js';
import savePixels from 'save-pixels';
import { createWriteStream } from 'fs';
import { writeFile } from 'fs/promises';
import { pipeline } from 'stream/promises';

(async () => {
	console.log("Running Sandbox");
	// 76945, 77007, 77014, 18626, 74440
	const tileMap = await TPMI.mapIDToTileMap(74440);

	const wallMask = TPMI.createWallMask(tileMap);
	const keyElementMask = TPMI.overlayMatrices([
		wallMask,
		TPMI.createCustomTileMask(tileMap, {
			[TPMI.TILE_IDS.REDFLAG]: 2,
			[TPMI.TILE_IDS.BLUEFLAG]: 2,
			[TPMI.TILE_IDS.YELLOWFLAG]: 2,
			[TPMI.TILE_IDS.REDENDZONE]: 2,
			[TPMI.TILE_IDS.BLUEENDZONE]: 2,
			// [TPMI.TILE_IDS.PORTAL]: 3
		})
	]);

	const wallGradient = TPMI.distanceTransform(wallMask);

	const keyElementMorphological = TPMI.morphologicalMatrix(keyElementMask, {
		diagonal: true
	});
	let encirclementCounter = 0;
	const keyElementVoronoi = await TPMI.voronoiMatrix(keyElementMorphological, {
		encirclementMax: {
			1: 2
		}
	});

	const voronoiMapEdges = TPMI.ndarray(new Float32Array(keyElementVoronoi.data.length), keyElementVoronoi.shape);
	TPMI.convolve2x2Matrix(keyElementVoronoi, kernel => {
		const kernelValues = [
			kernel.get(0, 0),
			kernel.get(1, 0),
			kernel.get(0, 1),
			kernel.get(1, 1)
		];
		const cellValueSet = new Set(kernelValues.filter(c => c));

		if(cellValueSet.size > 1) {
			kernel.data = voronoiMapEdges.data;
			kernel.set(0, 0, kernelValues[0]);
			kernel.set(1, 0, kernelValues[1]);
			kernel.set(0, 1, kernelValues[2]);
			kernel.set(1, 1, kernelValues[3]);
		}
	});

	const finalMapOverlay = TPMI.overlayMatrices([
		keyElementVoronoi,
		TPMI.mapMatrix(wallMask, num => -num)
	]);

	savePixels(TPMI.colorize(wallMask, ['0', 'ffffff']), "png")
		.pipe(createWriteStream(new URL('./tmp/wall_mask.png', import.meta.url)));
	savePixels(TPMI.colorize(keyElementMask), "png")
		.pipe(createWriteStream(new URL('./tmp/key_element_mask.png', import.meta.url)));
	savePixels(TPMI.colorize(wallGradient, ['0', 'ffffff']), "png")
		.pipe(createWriteStream(new URL('./tmp/gradient.png', import.meta.url)));
	savePixels(TPMI.colorize(keyElementMorphological), "png")
		.pipe(createWriteStream(new URL('./tmp/morphological.png', import.meta.url)));
	savePixels(TPMI.colorize(keyElementVoronoi), "png")
		.pipe(createWriteStream(new URL('./tmp/voronoi.png', import.meta.url)));
	savePixels(TPMI.colorize(voronoiMapEdges), "png")
		.pipe(createWriteStream(new URL('./tmp/edges.png', import.meta.url)));
	savePixels(TPMI.colorize(finalMapOverlay), "png")
		.pipe(createWriteStream(new URL('./tmp/overlay.png', import.meta.url)));

	await writeFile(new URL('./tmp/view.html', import.meta.url), `
		${TPMI.matrixToHTML(tileMap)}<br>
		${TPMI.matrixToHTML(keyElementMorphological)}<br>
		${TPMI.matrixToHTML(keyElementVoronoi)}<br>
	`);
})();