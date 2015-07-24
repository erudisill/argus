/*global THREE */
/*global Detector */
/*global Stats */
/*global transformSVGPath */
/*global threeUtils */
/*global blueprints */
/*global trucks */

(function($) {
	'use strict';

	if (!Detector.webgl) {
		Detector.addGetWebGLMessage();
	}

	var $blueprint_xml;
	var renderer, scene, camera, stats, root, controls, clock;
	var centroid;

	var WIDTH_OFFSET = 300, HEIGHT_OFFSET = 160;
	var WIDTH = window.innerWidth - WIDTH_OFFSET, HEIGHT = window.innerHeight - HEIGHT_OFFSET;

	var FOG_COLOR = 0x222222;

	function init() {

		clock = new THREE.Clock();

		// SCENE
		scene = new THREE.Scene();
		scene.fog = new THREE.Fog(FOG_COLOR, 200, 300);
		root = new THREE.Object3D();

		// Fetch blueprint and buid scene
		start_blueprint('./blueprint.svg');
	}

	function start_blueprint(url) {
		$.ajax({
			type : 'get',
			url : url,
			dataType : 'xml',
			success : function(data) {
				$blueprint_xml = $(data);
				blueprints.init(scene);
				blueprints.build($blueprint_xml);
				create_camera();
				create_grid();
				finish_threejs();
				setup_controls();
				trucks.init(scene, blueprints.waypoints);
				animate();
			},
			error : function(xhr, status) {
				console.log('Error start_blueprint [' + url + ']: ' + status);
			}
		});
	}

	function create_grid() {
		// GRID
		//	
		var gridHelper = new THREE.GridHelper(400, 5);
		gridHelper.setColors(0x444444, 0x444444);
		gridHelper.position.set(centroid.position.x, -0.1, centroid.position.z);
		scene.add(gridHelper);
	}

	function create_camera() {
		// create centroid
		centroid = new THREE.Object3D();
		centroid.position.set(0, 0, 0);
		centroid.position
				.addVectors(blueprints.walls[0].geometry.boundingBox.min, blueprints.walls[0].geometry.boundingBox.max);
		centroid.position.divideScalar(2);
		centroid.position.y = 0;
		scene.add(centroid);

		// create camera and anchor to centroid
		var radius = blueprints.walls[0].geometry.boundingSphere.radius;
		camera = new THREE.PerspectiveCamera(60, WIDTH / HEIGHT, 1, 1000);
		centroid.add(camera);
		camera.position.x = 0;
		camera.position.z = (radius * 0.75);
		camera.position.y = 125;
	}

	function setup_controls() {
		window.addEventListener('resize', onWindowResize, false);

		controls = new THREE.OrbitControls(camera, renderer.domElement);
		controls.target = new THREE.Vector3(0, 0, 0);
		controls.update();
	}

	function finish_threejs() {
		renderer = new THREE.WebGLRenderer({
			antialias : true
		});
		renderer.setClearColor(FOG_COLOR);
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(WIDTH, HEIGHT);

		// Place Renderer in the DOM
		//
		var container = document.getElementById('container');
		container.appendChild(renderer.domElement);

		// Create Stats and place in DOM
		stats = new Stats();
		stats.domElement.style.position = 'absolute';
		stats.domElement.style.top = container.offsetTop;
		container.appendChild(stats.domElement);
	}

	function onWindowResize() {

		WIDTH = window.innerWidth - WIDTH_OFFSET;
		HEIGHT = window.innerHeight - HEIGHT_OFFSET;

		camera.aspect = WIDTH / HEIGHT;
		camera.updateProjectionMatrix();

		renderer.setSize(WIDTH, HEIGHT);

	}

	function animate() {
		requestAnimationFrame(animate);
		render();
		stats.update();

	}

	function render() {

		var delta = clock.getDelta();

		// Only render if we're running at least 10fps
		// Cheap hack to keep big deltas from screwing things up if the page loses focus
		// When we come back, we'll essentially lose 1 frame of update.
		
		if (delta < 0.10) {
//			centroid.rotation.y += delta * 0.05;
			trucks.update(delta);
			renderer.render(scene, camera);
		}

	}

	init();

})(jQuery);
