import { matrixCellScale, floodFill } from '#tpmi/GeneralUtilities';
import { NEIGHBOR_VECTORS } from '#tpmi/CONSTANTS';

import ndarray from 'ndarray';
import pack from 'ndarray-pack';
import ndarrayConvolve from 'ndarray-convolve';
import ndArrayDistanceTransform from 'distance-transform';

const overlayMatrices = (matrices, _settings={}) => {
	const settings = {
		vacuumLabel: 0,
		..._settings
	};

	const matrix = ndarray(new Float32Array(matrices[0].data), matrices[0].shape);

	for (let x = 0; x < matrix.shape[0]; x++) {
		for (let y = 0; y < matrix.shape[1]; y++) {
			for (let i = 1; i < matrices.length; i++) {
				const value = matrices[i].get(x, y);
				if(value !== settings.vacuumLabel) matrix.set(x, y, matrices[i].get(x, y));
			}
		}
	}

	return matrix;
};

const negateMatrix = (_matrix) => mapMatrix(_matrix, num => ~~!num);

const mapMatrix = (_matrix, func) => {
	const matrix = ndarray(new Float32Array(_matrix.data), _matrix.shape);

	// flip nums
	for (let i = 0; i < matrix.data.length; i++) matrix.data[i] = func(matrix.data[i]);

	return matrix;
};

const distanceTransform = matrix => {
	const newMatrix = ndarray(new Float32Array(matrix.data), matrix.shape);

	const dTransformed = ndArrayDistanceTransform(newMatrix, Infinity);
	const cellScaled = matrixCellScale(dTransformed, [0, 1]);

	return cellScaled;
};

const morphologicalMatrix = (matrix, _settings={}) => {
	const settings = {
		vacuumLabel: 0,
		diagonal: false,
		..._settings
	};

	const newMatrix = ndarray(new Float32Array(matrix.data), matrix.shape);
	let currentLabel = -1;

	for (let x = 0; x < matrix.shape[0]; x++) {
		for (let y = 0; y < matrix.shape[1]; y++) {
			const originColor = newMatrix.get(x, y);
			if(originColor !== settings.vacuumLabel && originColor > 0) {
				floodFill([x, y], {
					color: ([ox, oy], [nx, ny]) => {
						if(newMatrix.get(nx, ny) === originColor) {
							newMatrix.set(nx, ny, currentLabel);
							return true;
						}

						return false;
					},
					diagonal: settings.diagonal
				});
				currentLabel--;
			}
		}
	}

	for (let i = 0; i < newMatrix.data.length; i++) newMatrix.data[i] = -newMatrix.data[i];

	return newMatrix;
};

const voronoiMatrix = (_matrix, _settings={}) => {
	const settings = {
		vacuumLabel: 0,
		diagonal: false,
		..._settings
	};

	const matrix = ndarray(new Float32Array(_matrix.data), _matrix.shape);
	const labels = new Map();

	// Get labels
	for (let x = 0; x < matrix.shape[0]; x++) {
		for (let y = 0; y < matrix.shape[1]; y++) {
			const type = matrix.get(x, y);
			if(type !== settings.vacuumLabel) {
				if(!labels.has(type)) labels.set(type, []);
				labels.get(type).push([x, y]);
			}
		}
	}

	// draw pixels around a set of nodes with the specified type
	// returns the newly set nodes, discards the old nodes
	function encircleNode(nodes, type) {
		let newEncirclement = [];

		for (let k = 0; k < nodes.length; k++) {
			for (let i = 0; i < NEIGHBOR_VECTORS.length; i++) {
				if(!settings.diagonal && i % 2 !== 0) continue;
				const point = [nodes[k][0] + NEIGHBOR_VECTORS[i].x, nodes[k][1] + NEIGHBOR_VECTORS[i].y];
				if(matrix.get(point[0], point[1]) === settings.vacuumLabel) {
					matrix.set(point[0], point[1], type);
					newEncirclement.push(point);
				}
			}
		}

		return newEncirclement;
	}

	// Keep encircling every node and replace the labels with the new "edge" nodes
	let encirclementSum = 0;
	do {
		encirclementSum = 0;
		for(const [type, nodes] of labels) {
			const newNodes = encircleNode(nodes, type);
			labels.set(type, newNodes);
			encirclementSum += newNodes.length;
		}
	} while(encirclementSum > 0);

	return matrix;
};

const floodFillMatrix = (matrix, _settings={}) => {
	const settings = {
		target: 0,
		value: 1,
		diagonal: false
	};

	const newMatrix = ndarray(new Float32Array(matrix.data), matrix.shape);

	return floodFill({
		color: ([ox, oy], [nx, ny]) => {
			if(newMatrix.get(nx, ny) === settings.target) {
				newMatrix.set(nx, ny, settings.value);
				return true;
			}
		},
		diagonal: settings.diagonal
	});
};

const matrixDerivative = matrix => {
	const newMatrix = ndarray(new Float32Array(matrix.data.length), matrix.shape);

	for (let x = 0; x < matrix.shape[0]; x++) {
		for (let y = 0; y < matrix.shape[1]; y++) {
			let sum = 0;
			let i = 0;
			let cellValue = matrix.get(x, y);

			// loop 4 for half of neighbor vectors
			for (i = 0; i < NEIGHBOR_VECTORS.length; i++) {
				const startVec = NEIGHBOR_VECTORS[i];
				const endVec = NEIGHBOR_VECTORS[(i + 3) % NEIGHBOR_VECTORS.length];
				const startValue = matrix.get(x + startVec.x, y + startVec.y);
				const endValue = matrix.get(x + endVec.x, y + endVec.y);

				if(typeof startValue === 'undefined' || typeof endValue === 'undefined') continue;

				const slope = Math.abs((cellValue - startValue) - (cellValue - endValue));
				sum += slope;
			}

			const averageSlope = (sum / (NEIGHBOR_VECTORS.length)) || 0;
			newMatrix.set(x, y, averageSlope);
		}
	}

	return newMatrix;
};

export {
	distanceTransform,
	matrixDerivative,
	morphologicalMatrix,
	voronoiMatrix,
	floodFillMatrix,
	overlayMatrices,
	mapMatrix,
	negateMatrix
};