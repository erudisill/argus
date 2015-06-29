/*global THREE */
var threeUtils = {
	computeCenter : function(geom) {
		geom.computeBoundingBox();
		var c = new THREE.Vector3(0, 0, 0);
		c.addVectors(geom.boundingBox.min, geom.boundingBox.max);
		c.divideScalar(2);
		return c;
	},

	computeExtents : function(geom) {
		geom.computeBoundingBox();
		var c = new THREE.Vector3(0, 0, 0);
		c.subVectors(geom.boundingBox.max, geom.boundingBox.min);
		return c;
	},

	create_object : function() {
		var object = {
			id : '',
			desc : '',
			mateial : {},
			geometry : {},
			center : {},
			extents : {},
			model : {}
		};
		return object;
	},

	swing : function(center, plusOrMinusAmt) {
		var r = Math.random();
		if (r >= 0.5) {
			r *= -1;
		}
		return center + (plusOrMinusAmt * r);
	}
}