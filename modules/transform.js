import { matrixCellScale } from '#tpmi/GeneralUtilities';

import ndarray from 'ndarray';
import ndArrayDistanceTransform from 'distance-transform';

const distanceTransform = mask => {
	const newMatrix = ndarray(new Float32Array(mask.data), mask.shape);

	const dTransformed = ndArrayDistanceTransform(newMatrix, Infinity);
	const cellScaled = matrixCellScale(dTransformed, [0, 1]);

	return cellScaled;
};

export {
	distanceTransform
};