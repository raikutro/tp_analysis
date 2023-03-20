import TPMI from './index.js';
import savePixels from 'save-pixels';
import { createWriteStream } from 'fs';

(async () => {
	const tileMap = await TPMI.mapIDToTileMap(76945);
	const wallMask = TPMI.createWallMask(tileMap);
	const wallGradient = TPMI.distanceTransform(wallMask);
	console.log(tileMap);

	savePixels(TPMI.colorize(wallMask, ['ffffff', '0']), "png")
		.pipe(createWriteStream(new URL('./tmp/mask.png', import.meta.url)));
	savePixels(TPMI.colorize(wallGradient, ['0', 'ffffff']), "png")
		.pipe(createWriteStream(new URL('./tmp/gradient.png', import.meta.url)));
})();