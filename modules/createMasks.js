import { TILE_IDS } from '#tpmi/CONSTANTS';
import ndarray from 'ndarray';

const createCustomTileMask = (tileMap, types) => {
	let customMask = ndarray(new Uint8Array(tileMap.data.length), tileMap.shape);

	for (let x = 0; x < customMask.shape[0]; x++) {
		for (let y = 0; y < customMask.shape[1]; y++) {
			const tile = tileMap.get(x, y);
			if(typeof types[tile] !== "undefined") customMask.set(x, y, types[tile]);
		}
	}

	return customMask;
};

const createWallMask = tileMap => createCustomTileMask(tileMap, {
	[TILE_IDS.WALL]: 1,
	[TILE_IDS.TLWALL]: 1,
	[TILE_IDS.TRWALL]: 1,
	[TILE_IDS.BLWALL]: 1,
	[TILE_IDS.BRWALL]: 1,
	[TILE_IDS.SPIKE]: 1
});

export {
	createCustomTileMask,
	createWallMask
}