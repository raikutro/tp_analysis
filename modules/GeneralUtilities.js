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

export {
	hexToRGB,
	matrixMinMax,
	matrixCellScale,
	lerp
};