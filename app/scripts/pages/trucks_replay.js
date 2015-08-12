/*global THREE */
/*global threeUtils */

'use strict';

var SESSION = 100;
var replayTicks = 0; 	// Number of ticks elapsed in current replay loop
var maxTicks = 0; 		// Total number of ticks in current replay loop
var paused = false;

// Determine what trucks need to be on screen each second
var timer = null;//setInterval(function () {trucks.choose_to_enter();}, 1000);

var trucks = {

	CREATE_WIDGETS: false,
		
	TRUCK_AWAY : 0,
	TRUCK_MOVING : 1,
	TRUCK_LOADING : 2,

	scene : {},
	trucks : [],
	truckPaths : [],

	// Create trucks, initialize environment, pull saved path data from database
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
			t.loading_timer = 3;
			t.loading_index = 0;
			t.entrance_index = 0;

			this.trucks.push(t);
		}

		var p = [];

		this.truckPaths = recorder.getAllTruckPositions(SESSION, this.trucks);
		this.parsePaths();
		maxTicks = recorder.getMaxTicks(SESSION);
		for(var i = 0; i < this.trucks.length; i++){
			console.log(this.trucks[i].rawPath);
		}	
	},

	// Parse out CSV string returned from database into array of three.js Vector2 data structures
	parsePaths : function(){
		for(var i = 0; i < this.trucks.length; i++){ 
			var p = this.truckPaths[i];
			this.trucks[i].rawPath = [];
			var pNew = [];
			for(var j = 0; j < p.length; j++){
				var pL = p[j][0].split(',');
				this.trucks[i].rawPath.push(pL);
				var point = new THREE.Vector2(parseFloat(pL[1]), parseFloat(pL[2]));
				pNew.push(point);
			}
			this.trucks[i].path = pNew;
			this.trucks[i].entrance_index = this.findEntranceIndex(p, 0);
			console.log(this.trucks[i].entrance_index);
			console.log(pNew);
		}
	},

	// Returns index of first position on path to be on screen
	findEntranceIndex : function(pathStr, startSearchIndex){
		for(var i = startSearchIndex; i < pathStr.length; i++){
			if(pathStr[i][0].split(',')[3] == 1){
				return i;
			}
		}
		return -1; // If code reaches this point, truck never entered the screen!
	},

	// Place truck on screen, start it moving
	start : function(t) {
		t.model.position.set(t.path[t.entrance_index].x, 0, t.path[t.entrance_index].y);
		t.target_index = t.entrance_index;
		t.distance = 0;
		t.target = new THREE.Vector3(0, 0, 0);
		t.status = this.TRUCK_MOVING;
		t.speed = threeUtils.swing(5, 1);

		this.scene.add(t.model);
	},

	// Logic for moving trucks from point to point
	update_one : function(delta, t) {
		if (t.status === this.TRUCK_LOADING) {
			console.log("LISTEN");
			t.loading_timer -= delta;
			if (t.loading_timer <= 0) {
				t.status = this.TRUCK_MOVING;
				t.loading_index = -1;
				t.loading_timer = 3;
			} else {
				// Loading, do nothing
				return;
			}
		}

		// Moving so check if we reached our target
		if (t.distance < 0.1) {
			// Move to next target
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

	// Determine whether a truck should be placed on the screen
	choose_to_enter : function() {
		for(var i = 0; i < this.trucks.length; i++){
			if(this.trucks[i].entrance_index == replayTicks){
				this.start(this.trucks[i]);
			}
			else if(this.trucks[i].rawPath[replayTicks][3] == this.TRUCK_LOADING){
				this.trucks[i].status = this.TRUCK_LOADING;
			} else if(this.trucks[i].rawPath[replayTicks][3] == this.TRUCK_AWAY){
				this.trucks[i].status = this.TRUCK_AWAY;
				this.trucks[i].entrance_index = this.findEntranceIndex(this.truckPaths[i], replayTicks + 1);
				this.scene.remove(this.trucks[i].model);
			} else{
				this.trucks[i].status = this.TRUCK_MOVING;
			}
		}
		if(replayTicks < maxTicks - 1){
			replayTicks++;
		} else{
			paused = true;
			clearInterval(timer);
		}
	},

	// Updates position of all trucks
	update : function(delta) {
		if(paused == false){
			for (var i = 0; i < this.trucks.length; i++) {
				var t = this.trucks[i];
				if (t.status !== this.TRUCK_AWAY) {
					this.update_one(delta, t);
				}
			}
		}
	}
};
