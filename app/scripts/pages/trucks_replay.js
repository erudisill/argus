
var trucks_replay{
	
	trucks : [],
	paths : [],

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

		// points = array of waypoints { id:xx, points: [] }
		this.sort_waypoints(points);
	},

	retrieve_paths : function(session_key){
		// 2D array to hold path data for each truck in session
		var p = [];

		for(var i = 0; i < this.trucks.length; i++){
			// Array to hold nodes, forms a path
			var t_path = [];
			// Raw data string in CSV format (lines seperated by </br> instead of \n)
			var pathStr = recorder.httpGet("http://localhost:5000/retrieve/positions/" + session_key + "/" + trucks[i].id);
			// Array of individual CSV lines
			var t_pathStr = pathStr.split("</br>");

			// Split each individual CSV line into an array of data points
			for(var i = 0; i < tPath.length; i++){
				// Array to hold data for individual node on path
				var t_Node = tPath[i].split(',');
				// Add node to path
				t_path.push(t_Node)
			}

			// Add path to 2D array
			p.push(t_path);
		}

		return p;
	}
}