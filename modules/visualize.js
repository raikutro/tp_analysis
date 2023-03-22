import { hexToRGB, lerp } from '#tpmi/GeneralUtilities';
import ndarray from 'ndarray';

const COLOR_PALETTE = ["5e3735","b59a66","a13d77","dc9824","885a44","b8560f","3a3a41","e68556","2c4941","208cb2","c02931","6d2047","82dcd7","2c2228","253348","7a7576","b9d850","66a650","d78b98","1d1b24","3c1c43","efcb84"];

const colorize = (matrix, colorPalette=COLOR_PALETTE) => {
	const colors = colorPalette.map(c => hexToRGB(parseInt(c, 16)));
	const image = ndarray(new Float32Array(matrix.shape[0] * matrix.shape[1] * 3), matrix.shape.concat([3]));
	const getColor = index => {
		let baseIndex = index < 0 ? colorPalette.length + (Math.floor(index) % colors.length) : Math.floor(index) % colors.length;
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
			let color = getColor(matrix.get(x, y));
			image.set(x, y, 0, color[0]);
			image.set(x, y, 1, color[1]);
			image.set(x, y, 2, color[2]);
		}
	}

	return image;
};

const matrixToHTML = (matrix) => {
	let html = `<table style="font-family: monospace;"><tbody>`;
	for (let y = 0; y < matrix.shape[1]; y++) {
		html += `<tr>`;
		for (let x = 0; x < matrix.shape[0]; x++) {
			html += `<td>${String(matrix.get(x, y)).padStart(3, '.')}</td>`;
		}
		html += `</tr>`;
	}

	html += `</tbody></table>`;

	return html;
};

export {
	colorize,
	matrixToHTML
};