/*global THREE */
/*global threeUtils */
/*global transformSVGPath */

'use strict';

var blueprints = {
		
		objects: [],
		walls: [],
		labels: [],
		obstacles: [],
		waypoints: [],			// array of waypoints { id:xx, points: [] }
		widgets: [],
		scene: {},
		
		init: function(s) {
			this.scene = s;
		},
		
		build: function($blueprint) {
			var _this = this;
			var layers = $blueprint.find('g');
			$.each(layers, function(index, value) {
				var $v = $(value);
				var layer = $v.attr('id');
				var rects = $v.find('rect');
				var paths = $v.find('path');
				var bucket, material;

				if (layer === 'layer1') {
					_this.build_walls($v);
				} else if (layer === 'layer2') {
					_this.build_obstacles($v);
				} else if (layer === 'layer3') {
					_this.extract_path($v);
				} else if (layer === 'layer4') {
					_this.extract_path($v);
				} else if (layer === 'layer5') {
					_this.extract_path($v);
				} else {
					console.log('Error: unknown layer - ' + layer);
					return true; // continue
				}
			});
		},

		build_walls: function($layer) {
			var _this = this;
			var rects = $layer.find('rect');
			$.each(rects, function(index, value) {
				var $r = $(value);
				var x, y, w, h, rid, desc;

				rid = $r.attr('id');
				x = parseFloat($r.attr('x'));
				y = parseFloat($r.attr('y'));
				w = parseFloat($r.attr('width'));
				h = parseFloat($r.attr('height'));

				var desc_el = $r.find('desc');
				if (desc_el !== null) {
					desc = desc_el.text();
				} else {
					desc = '';
				}

				var material = new THREE.LineBasicMaterial({
					color : 0x0000ff,
					linewidth : 5
				});

				var object = _this.create_rect(x, y, w, h, material);
				object.rid = rid;
				object.desc = desc;

				_this.walls.push(object);
				_this.objects.push(object);
				_this.scene.add(object.model);
			});
		},

		build_obstacles: function($layer) {
			var _this = this;
			var rects = $layer.find('rect');
			$.each(rects, function(index, value) {
				var $r = $(value);
				var x, y, w, h, rid, desc;

				rid = $r.attr('id');
				x = parseFloat($r.attr('x'));
				y = parseFloat($r.attr('y'));
				w = parseFloat($r.attr('width'));
				h = parseFloat($r.attr('height'));

				var desc_el = $r.find('desc');
				if (desc_el !== null) {
					desc = desc_el.text();
				} else {
					desc = '';
				}

				var material = new THREE.LineBasicMaterial({
					color : 0x00ff00,
					linewidth : 3
				});

				var object = _this.create_rect(x, y, w, h, material);
				object.rid = rid;
				object.desc = desc;

				_this.obstacles.push(object);
				_this.objects.push(object);
				_this.scene.add(object.model);

				if (object.desc !== '') {
					_this.create_label(object);
				}
			});
		},

		extract_path: function($layer) {
			var _this = this;
			var paths = $layer.find('path');
			$.each(paths, function(index, value) {
				var $p = $(value);
				var pid = $p.attr('id');

				// Pull the points
				var pathStr = $(value).attr('d');
				var shape = transformSVGPath(pathStr);
				var points = shape.extractPoints().shape;
				var waypoints = {
					id: '',
					points: []
				};
				waypoints.id = pid;
				waypoints.points = points;
				_this.waypoints.push(waypoints);
			});
		},

		create_rect: function (x, y, w, h, material) {
			var object = threeUtils.create_object();

			object.material = material;

			object.geometry = new THREE.Geometry();
			object.geometry.vertices.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, h), new THREE.Vector3(0, 0, h),
					new THREE.Vector3(w, 0, h), new THREE.Vector3(w, 0, h), new THREE.Vector3(w, 0, 0), new THREE.Vector3(w, 0, 0),
					new THREE.Vector3(0, 0, 0));

			object.center = threeUtils.computeCenter(object.geometry);
			object.extents = threeUtils.computeExtents(object.geometry);
			object.geometry.computeLineDistances();
			object.geometry.computeBoundingSphere();

			object.model = new THREE.Line(object.geometry, object.material, THREE.LinePieces);
			object.model.position.set(x, 0, y);

			return object;
		},

		create_label: function (parent) {
			var object = threeUtils.create_object();

			object.id = parent.id + '_label';
			object.desc = parent.desc;

			object.material = new THREE.MeshBasicMaterial({
				color : 0x880000,
				wireframe: true
			});

			object.geometry = new THREE.TextGeometry(object.desc, {
				font : 'droid sans',
				size : 4,
				height : 0.1
			});

			object.center = threeUtils.computeCenter(object.geometry);
			object.extents = threeUtils.computeExtents(object.geometry);

			object.model = new THREE.Mesh(object.geometry, object.material);
			object.model.rotation.x = -Math.PI / 2;

			object.model.position.x = parent.center.x - (object.extents.x / 2);
			object.model.position.z = parent.center.z + (object.extents.y / 2);

			this.labels.push(object);
			this.objects.push(object);

			parent.model.add(object.model);
		}		
};