import { matrixCellScale, floodFill } from '#tpmi/GeneralUtilities';
import { NEIGHBOR_VECTORS, NEIGHBOR_VECTORS_SYMMETRIC, SYMMETRY_FUNCTIONS, SYMMETRIC_TILE_FUNCTIONS, TILE_IDS } from '#tpmi/CONSTANTS';

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
	for (let x = 0; x < matrix.shape[0]; x++) {
		for (let y = 0; y < matrix.shape[1]; y++) {
			matrix.set(x, y, func(matrix.get(x, y), [x, y]));
		}
	}

	return matrix;
};

function spliceMatrix(dest, dstX, dstY, src, transparent=-1, mapFn){
	for (let y = 0; y < src.shape[1]; y++) {
		for (let x = 0; x < src.shape[0]; x++) {
			let srcType = src.get(x, y);
			let p = {x: dstX + x, y: dstY + y};
			if(srcType !== transparent) dest.set(p.x, p.y, mapFn ? mapFn(p, dest.get(x, y), srcType) : srcType);
		}
	}

	return dest;
}

const convolve2x2Matrix = (_matrix, func) => {
	const matrix = ndarray(new Float32Array(_matrix.data), _matrix.shape);

	for (let x = 0; x < matrix.shape[0]; x++) {
		for (let y = 0; y < matrix.shape[1]; y++) {
			const kernel = matrix.hi(x + 2, y + 2).lo(x,y);
			if(func(kernel, [x, y]) === false) return matrix;
		}
	}

	return matrix;
};

const convolve3x3Matrix = (_matrix, func) => {
	const matrix = ndarray(new Float32Array(_matrix.data), _matrix.shape);

	for (let x = 0; x < matrix.shape[0]; x++) {
		for (let y = 0; y < matrix.shape[1]; y++) {
			const kernel = matrix.hi(x + 2, y + 2).lo(x - 1, y - 1);
			if(func(kernel, [x, y]) === false) return matrix;
		}
	}

	return matrix;
};

const distanceTransform = matrix => {
	const newMatrix = ndarray(new Float32Array(matrix.data), matrix.shape);

	const dTransformed = ndArrayDistanceTransform(newMatrix, Infinity);
	const cellScaled = matrixCellScale(dTransformed, [0, 1]);

	return cellScaled;
};

const symmetrify = (tileMap, symmetry, transparent=-1) => {
	const newTileMap = ndarray(new Float32Array(tileMap.data), tileMap.shape);
	const symmetryFunction = SYMMETRY_FUNCTIONS[symmetry];

	let seqx = zigzagSequence(Math.round(tileMap.shape[0]) - 1);
	let seqy = zigzagSequence(Math.round(tileMap.shape[1]) - 1);
	// Get labels
	for (let _x = 0; _x < seqx.length; _x++) {
		let x = seqx[_x];
		for (let _y = 0; _y < seqy.length; _y++) {
			let y = seqy[_y];
			const tile = newTileMap.get(x, y);
			if(tile !== transparent) {
				const mirrored = symmetryFunction({
					width: tileMap.shape[0],
					height: tileMap.shape[1]
				}, {x, y});
				for (let i = 0; i < mirrored.length; i++) {
					const [mx, my] = mirrored[i];
					if(mx >= 0 && mx < tileMap.shape[0] && my >= 0 && my < tileMap.shape[1]) {
						newTileMap.set(mx, my, SYMMETRIC_TILE_FUNCTIONS[symmetry](tile));
					}
				}
			}
		}
	}

	return newTileMap;
}

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
				let label = currentLabel;
				floodFill([x, y], {
					color: ([ox, oy], [nx, ny]) => {
						if(newMatrix.get(nx, ny) === originColor) {
							newMatrix.set(nx, ny, label);
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

	for (let i = 0; i < newMatrix.data.length; i++) newMatrix.data[i] = Math.abs(newMatrix.data[i]);

	return newMatrix;
};

function zigzagSequence(n) {
	let result = [];
	let left = 0, right = n;
	while (left <= right) {
		result.push(left);
		if (left !== right) {
			result.push(right);
		}
		left++;
		right--;
	}
	return result;
}

const voronoiMatrix = async (_matrix, _settings={}) => {
	const settings = {
		vacuumLabel: 0,
		diagonal: false,
		encirclementMax: {

		},
		onEncirclement: () => {},
		..._settings
	};

	const matrix = ndarray(new Float32Array(_matrix.data), _matrix.shape);
	let labels = new Map();

	let seqx = zigzagSequence(matrix.shape[0] - 1);
	let seqy = zigzagSequence(matrix.shape[1] - 1);

	// Get labels
	for (let _x = 0; _x < matrix.shape[0]; _x++) {
		let x = seqx[_x];
		for (let _y = 0; _y < matrix.shape[1]; _y++) {
			let y = seqy[_y];
			const type = matrix.get(x, y);
			if(type !== settings.vacuumLabel) {
				if(!labels.has(type)) labels.set(type, []);
				labels.get(type).push([x, y]);
			}
		}
	}

	// Sort labels by distance to center
	const sortedLabelEntries = Array.from(labels.entries());

	labels = new Map(sortedLabelEntries);

	const neighborVectorLength = NEIGHBOR_VECTORS_SYMMETRIC.length - (settings.diagonal ? 0 : 4);

	// draw pixels around a set of nodes with the specified type
	// returns the newly set nodes, discards the old nodes
	function encircleNode(nodes, type) {
		let newEncirclement = [];

		for (let k = 0; k < nodes.length; k++) {
			let openNodes = [];
			for (let i = 0; i < neighborVectorLength; i++) {
				// if(!settings.diagonal && i % 2 !== 0) continue;
				const point = [nodes[k][0] + NEIGHBOR_VECTORS_SYMMETRIC[i].x, nodes[k][1] + NEIGHBOR_VECTORS_SYMMETRIC[i].y];
				if(point[0] >= matrix.shape[0] || point[0] < 0) continue;
				if(point[1] >= matrix.shape[1] || point[1] < 0) continue;

				if(matrix.get(point[0], point[1]) === settings.vacuumLabel) {
					matrix.set(point[0], point[1], type);
					openNodes.push(point);
				}
			}

			if(openNodes.length) {
				for (let i = 0; i < openNodes.length; i++) {
					newEncirclement.push(openNodes[i]);
				}
			}
		}

		return newEncirclement;
	}

	// Keep encircling every node and replace the labels with the new "edge" nodes
	let encirclementSum = 0;
	let encirclements = {};

	do {
		encirclementSum = 0;
		for(const [type, nodes] of labels) {
			if(typeof settings.encirclementMax[type] === 'number' && encirclements[type] >= settings.encirclementMax[type]) continue;
			const newNodes = encircleNode(nodes, type);
			labels.set(type, newNodes);
			encirclementSum += newNodes.length;
			if(!encirclements[type]) encirclements[type] = 0;
			encirclements[type]++;
			await settings.onEncirclement(matrix);
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
	symmetrify,
	spliceMatrix,
	convolve2x2Matrix,
	convolve3x3Matrix,
	negateMatrix
};