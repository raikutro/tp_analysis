import { NEIGHBOR_VECTORS, NEIGHBOR_VECTORS_SYMMETRIC } from '#tpmi/CONSTANTS';
import ndarray from 'ndarray';

const hexToRGB = hex => {
	return [hex & 0xFF, hex >> 8 & 0xFF, hex >> 16];
}

const lerp = (start, end, t) => {
	return start + t * (end - start);
}

const matrixMinMax = (matrix) => {
	let min = matrix.data[0];
	let max = matrix.data[0];

	for (let i = matrix.data.length - 1; i >= 0; i--) {
		if(matrix.data[i] > max) max = matrix.data[i];
		if(matrix.data[i] < min) min = matrix.data[i];
	}

	return [min, max];
};

const matrixCellScale = (matrix, [newMin, newMax]) => {
	let [min, max] = matrixMinMax(matrix);

	const newMatrix = ndarray(new Float32Array(matrix.data.length), matrix.shape);

	for (let i = matrix.data.length - 1; i >= 0; i--) {
		newMatrix.data[i] = (matrix.data[i] - min) * (newMax - newMin) / (max - min) + newMin;
	}

	return newMatrix;
};

const floodFill = (origin, _settings={}) => {
	const settings = {
		color: (originPoint, checkPoint) => {},
		diagonal: false,
		radius: Infinity,
		..._settings
	};

	const queue = [];

	// Color the origin cell
	settings.color(origin, origin);
	queue.push(Array.from(origin));
	let currentRadius = 0;
	const neighborVectorLength = NEIGHBOR_VECTORS_SYMMETRIC.length - (settings.diagonal ? 0 : 4);
	while (queue.length && currentRadius < settings.radius) {
		const [x1, y1] = queue.pop();

		for (let i = 0; i < neighborVectorLength; i++) {
			// if(!settings.diagonal && i % 2 !== 0) continue;
			const point = [x1 + NEIGHBOR_VECTORS_SYMMETRIC[i].x, y1 + NEIGHBOR_VECTORS_SYMMETRIC[i].y];
			const isValid = settings.color([x1, y1], point);
			if(isValid) queue.push(point);
		}
		currentRadius++;
	}

	return true;
};

export {
	hexToRGB,
	matrixMinMax,
	matrixCellScale,
	floodFill,
	lerp
};