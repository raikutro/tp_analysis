import * as CONSTANTS from '#tpmi/CONSTANTS';
import * as loadMaps from '#tpmi/loadMaps';
import * as createMasks from '#tpmi/createMasks';
import * as visualize from '#tpmi/visualize';
import * as transform from '#tpmi/transform';

export default {
	CONSTANTS,
	...loadMaps,
	...createMasks,
	...visualize,
	...transform
}