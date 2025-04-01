import { TILE_COLORS, TILE_IDS, SYMMETRY_FUNCTIONS } from '#tpmi/CONSTANTS';
import { hexToRGB } from '#tpmi/GeneralUtilities';

import ndarray from 'ndarray';
import PNGImage from 'pngjs-image';
import fetch from 'node-fetch';

const mapIDToTileMap = (mapID) => {
	return new Promise((resolve, reject) => {
		let mapPNGLink = "https://fortunatemaps.herokuapp.com/png/" + mapID;
		PNGImage.readImage(mapPNGLink, (err, image) => {
			if(err) reject(err);

			let matrix = imageBufferToTileMap(image);

			if(!matrix) return reject("Couldn't resolve map data.");

			resolve(matrix);
		});
	}).catch(console.log);
};

const mapIDToMapPreview = (mapID) => {
	return fetch("https://fortunatemaps.herokuapp.com/preview/" + mapID + ".jpeg")
		.then(r => r.arrayBuffer()).catch(console.log);
};

const fileToTileMap = (mapFilePath) => {
	return new Promise((resolve, reject) => {
		PNGImage.readImage(mapFilePath, (err, image) => {
			if(err || !image) reject(err);

			let matrix = imageBufferToTileMap(image);

			if(!matrix) return reject("Couldn't resolve map data.");

			resolve(matrix);
		});
	}).catch(console.log);
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