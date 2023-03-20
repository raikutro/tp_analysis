import { hexToRGB, lerp } from '#tpmi/GeneralUtilities';
import ndarray from 'ndarray';

const COLOR_PALETTE = ["dddddd", "222222", "2c4941","66a650","b9d850","82dcd7","208cb2","253348","1d1b24","3a3a41","7a7576","b59a66","cec7b1","edefe2","d78b98","a13d77","6d2047","3c1c43","2c2228","5e3735","885a44","b8560f","dc9824","efcb84","e68556","c02931"];

const colorize = (array, colorPalette=COLOR_PALETTE) => {
	const colors = colorPalette.map(c => hexToRGB(parseInt(c, 16)));
	const image = ndarray(new Float32Array(array.shape[0] * array.shape[1] * 3), array.shape.concat([3]));
	const getColor = index => {
		let baseIndex = index < 0 ? 24 + (Math.floor(index) % colors.length) : Math.floor(index) % colors.length;
		const baseColor = colors[baseIndex];
		let decimal = Math.abs(index) - Math.floor(Math.abs(index));
		if(decimal === 0) {
			return baseColor;
		}

		const nextColor = colors[(baseIndex + 1) % colors.length];

		return baseColor.map((c, i) => lerp(c, nextColor[i], decimal));
	}

	for (let x = 0; x < image.shape[0]; x++) {
		for (let y = 0; y < image.shape[1]; y++) {
			let color = getColor(array.get(x, y));
			image.set(x, y, 0, color[0]);
			image.set(x, y, 1, color[1]);
			image.set(x, y, 2, color[2]);
		}
	}

	return image;
};

export {
	colorize
};