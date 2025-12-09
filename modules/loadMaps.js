import { TILE_COLORS, TILE_IDS, SYMMETRY_FUNCTIONS } from '#tpmi/CONSTANTS';
import { hexToRGB } from '#tpmi/GeneralUtilities';

import ndarray from 'ndarray';
import PNGImage from 'pngjs-image';
import fetch from 'node-fetch';

const BASE_MAP_URL = process.env.CHUNK_MAP_BASE_URL || process.env.CHUNK_BASE_URL || 'https://fortunatemaps.herokuapp.com';

const mapIDToTileMap = (mapID) => {
	return new Promise((resolve, reject) => {
		const mapPNGLink = `${BASE_MAP_URL.replace(/\/$/, "")}/png/${mapID}.png`;
		PNGImage.readImage(mapPNGLink, (err, image) => {
			if(err || !image) return reject(err || new Error('Missing image'));

			let matrix = imageBufferToTileMap(image);

			if(!matrix) return reject(new Error("Couldn't resolve map data."));

			resolve(matrix);
		});
	});
};

const mapIDToMapPreview = (mapID) => {
	const url = `${BASE_MAP_URL.replace(/\/$/, "")}/preview/${mapID}.jpeg`;
	return fetch(url).then(r => r.arrayBuffer());
};

const fileToTileMap = (mapFilePath) => {
	return new Promise((resolve, reject) => {
		PNGImage.readImage(mapFilePath, (err, image) => {
			if(err || !image) reject(err || new Error('Missing image'));

			let matrix = imageBufferToTileMap(image);

			if(!matrix) return reject(new Error("Couldn't resolve map data."));

			resolve(matrix);
		});
	});
};

const imageBufferToTileMap = image => {
	const width = image.getWidth();
	const height = image.getHeight();

	const buffer = ndarray(new Uint8Array(width * height), [width, height]);

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			let tileType = TILE_COLORS.findIndex(a => {
				let tileRGB = hexToRGB(image.getColor(x, y));
				return a.red === tileRGB[0] && a.green === tileRGB[1] && a.blue === tileRGB[2];
			});
			if(tileType === -1) {
				tileType = TILE_IDS.BACKGROUND;
			}

			buffer.set(x, y, tileType);
		}
	}

	return buffer;
};

export {
	mapIDToTileMap,
	mapIDToMapPreview,
	fileToTileMap,
	imageBufferToTileMap
}
