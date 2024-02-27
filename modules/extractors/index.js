import { convolve2x2Matrix } from '#tpmi/transform';

import simplify from 'simplify-js';
import ndarray from 'ndarray';

const extractRoutes = (keyElementVoronoiMatrix) => {
	const routeElements = {
		decisionNodes: new Map(),
		routes: new Map()
	};

	const voronoiMapEdges = ndarray(new Float32Array(keyElementVoronoiMatrix.data.length), keyElementVoronoiMatrix.shape);
	convolve2x2Matrix(keyElementVoronoiMatrix, (kernel, [x, y]) => {
		const kernelValues = [
			kernel.get(0, 0),
			kernel.get(1, 0),
			kernel.get(0, 1),
			kernel.get(1, 1)
		];
		const cellValueSet = new Set(kernelValues.filter(c => c));

		if(cellValueSet.size > 1) {
			kernel.data = voronoiMapEdges.data;
			kernel.set(0, 0, kernelValues[0]);
			kernel.set(1, 0, kernelValues[1]);
			kernel.set(0, 1, kernelValues[2]);
			kernel.set(1, 1, kernelValues[3]);

			const nodeID = Array.from(cellValueSet).sort((a, b) => a - b).join('|');
			if(cellValueSet.size === 2) {
				let routePoints = routeElements.routes.get(nodeID);
				if(!routePoints) {
					routePoints = [];
				}
				routePoints.push([x, y]);
				routeElements.routes.set(nodeID, routePoints);
			} else {
				routeElements.decisionNodes.set(nodeID, [x, y]);
			}
		}
	});

	for(const [key, points] in routeElements.routes) {
		routeElements.set(key, simplify(points.map(p => ({x: p[0], y: p[1]})), 2, true).map(({x, y}) => [x, y]));
	}

	return [routeElements, voronoiMapEdges];
};

export {
	extractRoutes
};