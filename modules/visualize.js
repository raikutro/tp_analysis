import { hexToRGB, lerp } from '#tpmi/GeneralUtilities';
import ndarray from 'ndarray';
import { COLOR_PALETTE } from '#tpmi/CONSTANTS';

const colorize = (matrix, colorPalette=COLOR_PALETTE) => {
	const colors = colorPalette.map(c => {
		return typeof c.red === "number" ? [c.red, c.green, c.blue] : hexToRGB(parseInt(c, 16));
	});
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
			html += `<td>${String(matrix.get(x, y)).padStart(2, '0')}</td>`;
		}
		html += `</tr>`;
	}

	html += `</tbody>
	</table>`;

	return html;
};

const pointsToSVG = (points) => {
	const groupElem = document.createElement('g');

	for (let i = 0; i < points.length; i++) {
		groupElem.innerHTML += `<circle cx="${points[i][0]}" cy="${points[i][1]}" r="5" />`;
	}

	return groupElem;
};

const wrapSVG = (svgGroups, _settings={}) => {
	const settings = {
		viewboxDimensions: [100, 50],
		..._settings
	};
	const svgElem = document.createElement('svg');
	svgElem.outerHTML = `<svg viewBox="0 0 ${settings.viewboxDimensions[0]} ${settings.viewboxDimensions[1]}" xmlns="http://www.w3.org/2000/svg"></svg>`;

	for (let i = 0; i < svgGroups.length; i++) {
		svgElem.append(svgElem);
	}

	return svgElem;
};

export {
	colorize,
	matrixToHTML,
	pointsToSVG,
	wrapSVG
};