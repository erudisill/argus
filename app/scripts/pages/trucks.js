/*global THREE */
/*global threeUtils */

'use strict';

var trucks = {

	CREATE_WIDGETS: false,
		
	TRUCK_AWAY : 0,
	TRUCK_MOVING : 1,
	TRUCK_LOADING : 2,

	scene : {},
	trucks : [],
	recent_truck_entrance : 0,
	next_truck_entrance : 0,
	waypoints : {
		center : [], // center lane
		aisles : [], // left side points
		pickup : []
	// array of arrays (waypoints in pickuplanes)
	},
	widgets : [],
	pickup1_busy : false,
	pickup2_busy : false,

	init : function(s, points) {
		var i;
		var colors = [ 0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0x00ffff ];

		this.scene = s;

		// Make the trucks
		for (i = 0; i < colors.length; i++) {
			var t = threeUtils.create_object();
			t.id = 'truck_' + i;

			t.material = new THREE.MeshBasicMaterial({
				color : colors[i],
				wireframe : true
			});

			var shape = new THREE.Shape();
			var sizex = 3 / 2;
			var sizey = 5 / 2;

			shape.moveTo(-1 * sizex, 1 * sizey);
			shape.lineTo(1 * sizex, 1 * sizey);
			shape.lineTo(0 * sizex, -1 * sizey);
			shape.lineTo(-1 * sizex, 1 * sizey);
			// t.geometry = new THREE.BoxGeometry(2, 1, 2);
			var extrudeSettings = {
				amount : -2,
				bevelEnabled : false,
				material : 0,
				extrudeMaterial : 0
			};
			t.geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
			t.model = new THREE.Mesh(t.geometry, t.material);

			t.model.updateMatrix();
			t.model.geometry.applyMatrix(t.model.matrix);
			t.model.rotation.x = Math.PI / 2;
			t.model.updateMatrix();

			t.status = this.TRUCK_AWAY;
			t.speed = 5;
			t.target = null;
			t.target_index = 0;
			t.direction = null;
			t.distance = 0;
			t.pickup_path = 0;
			t.loading_timer = 0;
			t.loading_index = 0;

			this.trucks.push(t);
		}

		this.sort_waypoints(points);
		recorder.initRecorder();
		var p = [];

		console.log(recorder.getAllTruckPositions(52, this.trucks));
	},

	sort_waypoints : function(points) {
		var i;

		// Build waypoints
		for (i = 0; i < points.length; i++) {
			if (points[i].id.indexOf('center') > -1) {
				this.waypoints.center = points[i].points;
			} else if (points[i].id.indexOf('right') > -1) {
				this.waypoints.pickup.push(points[i].points);
			} else if (points[i].id.indexOf('left') > -1) {
				this.waypoints.aisles.push.apply(this.waypoints.aisles, points[i].points);
			}
		}

		if (this.CREATE_WIDGETS) {
			this.create_widgets('wps_center', this.waypoints.center);
			this.create_widgets('wps_aisle', this.waypoints.aisles);
			for (i = 0; i < this.waypoints.pickup.length; i++) {
				this.create_widgets('wps_pickup', this.waypoints.pickup[i]);
			}
		}
	},

	create_widgets : function(prefix, points) {
		if (points) {
			// Make some debuging objects
			var material = new THREE.MeshBasicMaterial({
				color : 0xffff00,
				wireframe : true
			});
			for (var i = 0; i < points.length; i++) {
				var object = threeUtils.create_object();
				object.id = prefix + '_' + i;
				object.material = material;
				object.geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
				object.model = new THREE.Mesh(object.geometry, object.material);
				object.model.position.set(points[i].x, 0, points[i].y);
				this.widgets.push(object);
				this.scene.add(object.model);
			}
		}
	},

	create_random_path : function(t) {
		// pick a random starting point - center, right1, right2
		var i = 0;
		var r = Math.floor(Math.random() * 100);

		// for the right paths, just return the points - easy
		var points = [];
		if (r <= 30) {
			if (this.pickup1_busy === false) {
				points = this.waypoints.pickup[0];
				this.pickup1_busy = true;
				t.pickup_path = 1;
				t.path = points;
				t.loading_index = 1; // hardcoded for now
				t.loading_timer = threeUtils.swing(3, 1);
				return;
			}
		} else if (r <= 60) {
			if (this.pickup2_busy === false) {
				points = this.waypoints.pickup[1];
				this.pickup2_busy = true;
				t.pickup_path = 2;
				t.path = points;
				t.loading_index = 1; // hardcoded for now
				t.loading_timer = threeUtils.swing(3, 1);
				return;
			}
		}

		// the center lane is more complicated
		// need pick a random aisle point, find the closest center exit
		// and insert it into the resulting path
		t.pickup_path = 0;
		points = this.waypoints.center.slice(0);
		r = Math.floor(Math.random() * this.waypoints.aisles.length);
		var dest = this.waypoints.aisles[r];
		var closest = {};
		var min_d = Number.MAX_VALUE;
		var index = 0;
		for (i = 0; i < points.length; i++) {
			var p = new THREE.Vector2(points[i].x, points[i].y);
			var v = new THREE.Vector2().subVectors(dest, p);
			if (v.length() < min_d) {
				closest = points[i];
				min_d = v.length();
				index = i;
			}
		}
		if (index > 0 && index < points.length) {
			points.splice(index + 1, 0, dest, closest);
		} else {
			console.log('Final index was out of range!!!');
		}
		t.loading_index = index + 1;
		t.loading_timer = threeUtils.swing(5, 1);

		t.path = points;

	},

	start : function(t) {
		this.create_random_path(t);
		t.model.position.set(t.path[0].x, 0, t.path[0].y);
		// t.model.position.set(this.waypoints.center[0].x, 0, this.waypoints.center[0].y);
		t.target_index = 0;
		t.distance = 0;
		t.target = new THREE.Vector3(0, 0, 0);
		t.status = this.TRUCK_MOVING;
		t.speed = threeUtils.swing(5, 1);

		this.scene.add(t.model);
	},

	update_one : function(delta, t) {
		if (t.status === this.TRUCK_LOADING) {
			t.loading_timer -= delta;
			if (t.loading_timer <= 0) {
				t.status = this.TRUCK_MOVING;
				t.loading_index = -1;
			} else {
				// Loading, do nothing
				return;
			}
		}

		// Moving so check if we reached our target
		if (t.distance < 0.1) {
			// Is this target the loading zone?
			if (t.target_index === t.loading_index) {
				t.status = this.TRUCK_LOADING;
				return;
			}
			// No? Then move to next target
			t.target_index++;
			// Did we reach the end of the path?
			if (t.target_index >= t.path.length) {
				t.status = this.TRUCK_AWAY;
				this.scene.remove(t.model);
				if (t.pickup_path === 1) {
					this.pickup1_busy = false;
				} else if (t.pickup_path === 2) {
					this.pickup2_busy = false;
				}
				return;
			}
			var tv = new THREE.Vector3(t.path[t.target_index].x, 0, t.path[t.target_index].y);
			t.target.set(tv.x, 0, tv.z);

			// calculate rotation
			var distx = t.target.x - t.model.position.x;
			var distz = t.target.z - t.model.position.z;
			var angle = Math.atan2(distz, distx);
			t.model.rotation.z = angle + (Math.PI / 2); // why the quarter turn addition???

		}

		t.direction = new THREE.Vector3().subVectors(t.target, t.model.position);
		t.distance = t.direction.length();
		t.direction.normalize();

		var bump = new THREE.Vector3().copy(t.direction);
		bump.multiplyScalar(delta * t.speed);
		t.model.position.add(bump);
	},

	choose_to_enter : function() {
		// check if we are ready for a new truck to enter
		var elapsed = Date.now() - this.recent_truck_entrance;
		if (elapsed >= this.next_truck_entrance) {
			// scan for an available truck (bad,unoptimized way to do this!)
			var pickANumber = Math.floor(Math.random() * (2 * this.trucks.length));
			var i = 0, n = 0, choice;
			var noneAway = true;
			while (n < pickANumber) {
				if (this.trucks[i].status === this.TRUCK_AWAY) {
					choice = this.trucks[i];
					noneAway = false;
					n++;
				}
				i++;
				if (i === this.trucks.length) {
					if (noneAway) {
						break;
					}
					i = 0;
				}
			}
			if (choice) {
				this.next_truck_entrance = threeUtils.swing(10000, 3000);
				this.recent_truck_entrance = Date.now();
				this.start(choice);
				//console.log('Elapsed: ' + elapsed + '  Picked ' + choice.id + '   Next entrance: ' + this.next_truck_entrance);
			}
		}
	},

	update : function(delta) {

		this.choose_to_enter();

		for (var i = 0; i < this.trucks.length; i++) {
			var t = this.trucks[i];
			if (t.status !== this.TRUCK_AWAY) {
				this.update_one(delta, t);
			}
		}

		recorder.logTruckPositions(this.trucks);
	}
};
