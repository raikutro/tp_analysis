import { createSVGWindow } from 'svgdom';
import { SVG, registerWindow } from '@svgdotjs/svg.js';
import { COLOR_PALETTE } from '#tpmi/CONSTANTS';

const window = createSVGWindow();
const document = window.document;

registerWindow(window, document);

const createBaseDocument = (width, height) => {
	const baseLayer = SVG(document.documentElement).size(width, height);
	baseLayer.rect(width, height).fill('rgba(0, 0, 0, 0.1)');
	baseLayer.attr('viewBox', `0 0 ${width} ${height}`);
	baseLayer.dimensions = { width, height };
	return baseLayer;
};

const addMapPreviewLayer = (base, mapID) => {
	const layer = SVG(document.createElement('g'));
	let image = layer.image(`https://fortunatemaps.herokuapp.com/preview/${mapID}.jpeg`);

	image.attr({
		width: '100%',
		height: null
	});

	base.add(layer);
	return base;
};

const addRoutesLayer = (base, routeElements) => {
	const layer = SVG(document.createElement('g'));
	
	const CIRCLE_SIZE = 1;

	routeElements.graph.forEachNode((node, attr) => {
		layer.circle(CIRCLE_SIZE).attr({
			cx: attr.position.x + 0.5,
			cy: attr.position.y + 0.5,
			fill: 'rgba(1, 1, 1, 0.5)'
		});
		layer.text(node).attr({
			x: attr.position.x + 0.5,
			y: attr.position.y + 0.5,
			fill: '#000',
			'font-size': 1,
			'text-anchor': 'middle',
			'dominant-baseline': 'middle'
		});
	});

	routeElements.graph.forEachUndirectedEdge((edge, attr, source, target) => {
		let fromPos = routeElements.graph.getNodeAttribute(source, 'position');
		let toPos = routeElements.graph.getNodeAttribute(target, 'position');

		let [x1, y1] = [fromPos.x + 0.5, fromPos.y + 0.5];
		let [x2, y2] = [toPos.x + 0.5, toPos.y + 0.5];

		layer.line(x1, y1, x2, y2).attr({
			stroke: `#000`,
			'stroke-width': 0.05,
			opacity: 0.25
		});
	});

	for (const [key, points] of routeElements.paths) {
		layer.path(`M${points.map(p => `${p[0]} ${p[1]} `).join('L')}`).attr({
			fill: 'none',
			stroke: `#0000aa`,
			'stroke-width': 0.1,
			opacity: 0.5
		});
	}

	base.add(layer);
	return base;
};

const addMatrixLayer = (base, matrix) => {
	const layer = SVG(document.createElement('g'));
	
	for (let x = 0; x < matrix.shape[0]; x++) {
		for (let y = 0; y < matrix.shape[1]; y++) {
			let tile = matrix.get(x, y);

			if(tile === 0) continue;

			layer.rect(1, 1).attr({
				x: x,
				y: y,
				fill: `#${COLOR_PALETTE[tile % COLOR_PALETTE.length]}`,
				opacity: 0.25
			});
		}
	}

	base.add(layer);
	return base;
};

export {
	createBaseDocument,
	addMapPreviewLayer,
	addRoutesLayer,
	addMatrixLayer
};