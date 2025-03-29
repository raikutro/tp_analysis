import { convolve2x2Matrix } from '#tpmi/transform';
import { NEIGHBOR_VECTORS } from '#tpmi/CONSTANTS';

import simplify from 'simplify-js';
import ndarray from 'ndarray';
import Graph from 'graphology';

const extractRoutes = (keyElementVoronoiMatrix, _settings={}) => {
	const routeElements = {
		graph: new Graph({
			type: 'undirected'
		}),
		paths: new Map()
	};

	const settings = {
		routeSimplificationTolerance: 1,
		..._settings,
	};

	const points = new Map();
	let nodes = [];

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

			if(cellValueSet.size > 2) nodes.push({x, y, id: points.size});
			points.set(`${x}|${y}`, {cells: Array.from(cellValueSet), id: points.size, position: {x, y}});
		}
	});

	const visitedPoints = new Set();
	const pointEntries = Array.from(points.entries());
	let stack = [];
	let edges = [];

	for(const point of nodes) {
		routeElements.graph.addNode(point.id, { position: { x: point.x + 0.5, y: point.y + 0.5 } });
		stack.push([`${point.x}|${point.y}`, null]);
	}

	const routeTracker = new Map();
	const nodeIDToData = nodeID => pointEntries[nodeID][1];
	const createCellID = cells => cells.sort((a, b) => a - b).join('|');

	while(stack.length) {
		const [point, from] = stack.pop();
		const [x, y] = point.split('|').map(Number);
		const pointData = points.get(point);

		const visitID = `${from}|${point}`;

		if(!pointData) continue;
		if(visitedPoints.has(visitID)) continue;
		visitedPoints.add(visitID);

		let nextFromNode = null;

		if(pointData.cells.length > 2) {
			if(from !== null) {
				const fromNodeData = nodeIDToData(from);
				const sharedCells = fromNodeData.cells.filter(c => pointData.cells.includes(c));
				// Check if this node is related to the other from node.
				if(sharedCells.length > 1){
					const cellID = createCellID(sharedCells.slice(0, 2));
					const routeID = `${from}|${cellID}`;
					edges.push([from, pointData.id, routeID]);
				}
			}

			nextFromNode = pointData.id;
		} else {
			nextFromNode = from;
			const cellID = createCellID(pointData.cells);
			const routeID = `${nextFromNode}|${cellID}`;
			let route = routeTracker.get(routeID);
			if(!route) {
				route = [];
				routeTracker.set(routeID, route);
			}
			route.push([x + 1, y + 1]);
		}

		for (let i = 0; i < NEIGHBOR_VECTORS.length; i += 2) {
			const v = NEIGHBOR_VECTORS[i];
			const [dx, dy] = [x + v.x, y + v.y];
			const neighbor = `${dx}|${dy}`;
			const neighborData = points.get(neighbor);

			if(neighborData && neighborData.cells.filter(c => pointData.cells.includes(c)).length > 1) {
				stack.push([neighbor, nextFromNode]);
			}
		}
	}

	for(const [from, to, routeID] of edges) {
		routeElements.graph.mergeEdge(from, to, {
			routeID
		});
	}

	routeElements.graph.forEachUndirectedEdge((edge, attr, source, target) => {
		const [startingNodeID] = attr.routeID.split('|');
		const points = routeTracker.get(attr.routeID);
		const fromPos = routeElements.graph.getNodeAttribute(source, 'position');
		const toPos = routeElements.graph.getNodeAttribute(target, 'position');

		if(source === startingNodeID) return;

		routeElements.paths.set(attr.routeID,
			simplify(
				points.map(p => ({x: p[0], y: p[1]})),
				settings.routeSimplificationTolerance,
				true
			).map(({x, y}) => [x, y])
		);
	});

	return [routeElements, voronoiMapEdges];
};

export {
	extractRoutes
};