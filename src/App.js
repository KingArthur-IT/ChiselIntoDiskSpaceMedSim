import * as THREE from 'three';

//scene
let canvas, camera, scene, light, renderer,
	chiselPlane, hummerSound;
//popup

let popupPlaneMesh,
	popupBtn = document.getElementById('popupBtn'),
	popupTexts = JSON.parse(popupData);
//params
let params = {
	sceneWidth: 850,
	sceneHeight: 450,
	bgSrc: './assets/img/interaction_hammer_chisel_bg.jpg',
	popupSrc: './assets/img/popup.png',
	audioSrc: './assets/hammer-hitting.mp3',
	isSimulationActive: false,
	isChiselMoving: false,
	popupDelay: 1000
};
let objectsParams = {
	vertebral: {
		vertebralSrc: './assets/img/interaction_hammer_chisel_top_layer.png',
		width: 850,
		height: 450,
		scale: new THREE.Vector3(0.162, 0.162, 0.162),
		position: new THREE.Vector3(0.0, 0.0, 0.0),
	},
	chisel: {
		chiselSrc: './assets/img/interaction_hammer_chisel_chisel.png',
		width: 850,
		height: 450,
		scale: new THREE.Vector3(0.16, 0.16, 0.16),
		position: new THREE.Vector3(-40.0, -8.0, -5.0),
		maxXPosition: -20.0,
		clickCount: 5,
		currentClick: 0,
		prevXPosition: -40.0,
		xMovingStep: 0.6
	}
}

class App {
	init() {
		canvas = document.getElementById('canvas');
		canvas.setAttribute('width', 	params.sceneWidth);
		canvas.setAttribute('height', 	params.sceneHeight);
		
		//scene and camera
		scene = new THREE.Scene();
		camera = new THREE.PerspectiveCamera(40.0, params.sceneWidth / params.sceneHeight, 0.1, 5000);
		camera.position.set(0, 0, 100);
		//light
		light = new THREE.AmbientLight(0xffffff);
		scene.add(light);
		
		//renderer
		renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true });
		renderer.setClearColor(0xffffff);

		//Load background texture
		let loader = new THREE.TextureLoader();
		loader.load(params.bgSrc, function (texture) {
			texture.minFilter = THREE.LinearFilter;
			scene.background = texture;
		});

		// vertebral plane
		const vertebralGeom = new THREE.PlaneGeometry(objectsParams.vertebral.width, objectsParams.vertebral.height, 10.0);
		loader = new THREE.TextureLoader();
		const vertebralMaterial = new THREE.MeshBasicMaterial({
			map: loader.load(objectsParams.vertebral.vertebralSrc, function (texture) {
				texture.minFilter = THREE.LinearFilter; }),
			transparent: true
		});    
		const vertebralPlane = new THREE.Mesh(vertebralGeom, vertebralMaterial);
		vertebralPlane.scale.copy(objectsParams.vertebral.scale);
		vertebralPlane.position.copy(objectsParams.vertebral.position);
		scene.add(vertebralPlane);
	
		// chisel plane
		const chiselGeom = new THREE.PlaneGeometry(objectsParams.chisel.width, objectsParams.chisel.height, 10.0);
		loader = new THREE.TextureLoader();
		const chiselMaterial = new THREE.MeshBasicMaterial({
			map: loader.load(objectsParams.chisel.chiselSrc, function (texture) {
				texture.minFilter = THREE.LinearFilter; }),
			transparent: true
		});    
		chiselPlane = new THREE.Mesh(chiselGeom, chiselMaterial);
		chiselPlane.scale.copy(objectsParams.chisel.scale);
		chiselPlane.position.copy(objectsParams.chisel.position);
		scene.add(chiselPlane);

		//audio
		hummerSound = document.getElementsByTagName("audio")[0];

		//popup
		createPopupPlane();
		addPopup('intro');

		renderer.render(scene, camera);
		canvas.addEventListener('mousedown', onMouseDown, false);
		popupBtn.addEventListener('click', removePopup, false);

		animate();
	}
}

function onMouseDown() {
	if (params.isSimulationActive == false)
		return;
	hummerSound.pause();
	hummerSound.currentTime = 0;
	hummerSound.play();
	params.isChiselMoving = true;
}

function animate() {
	if (params.isChiselMoving) {
		let clickStepWidth = (objectsParams.chisel.maxXPosition - objectsParams.chisel.position.x) 
			/ objectsParams.chisel.clickCount;
		if (chiselPlane.position.x < objectsParams.chisel.prevXPosition + clickStepWidth &&
			chiselPlane.position.x < objectsParams.chisel.maxXPosition)
			chiselPlane.position.x += objectsParams.chisel.xMovingStep;
		else {
			params.isChiselMoving = false;
			//hummerSound.pause();
			objectsParams.chisel.currentClick++;
			objectsParams.chisel.prevXPosition = chiselPlane.position.x;
			if (objectsParams.chisel.currentClick == objectsParams.chisel.clickCount)
				setTimeout(() => {
					addPopup('done');
				}, params.popupDelay);
		}
	}
	requestAnimationFrame(animate);
	renderer.render(scene, camera);
}

function createPopupPlane() {
	const popupPlane = new THREE.PlaneGeometry(params.sceneWidth, params.sceneHeight, 10.0);
	const loader = new THREE.TextureLoader();
	const popupMaterial = new THREE.MeshBasicMaterial({
		map: loader.load(params.popupSrc, function (texture) {
			texture.minFilter = THREE.LinearFilter; }),
		transparent: true
	});    
	popupPlaneMesh = new THREE.Mesh(popupPlane, popupMaterial);
	popupPlaneMesh.scale.set(0.105, 0.105, 0.105)
	popupPlaneMesh.position.z = 10;
}

function addPopup(status) {
	scene.add(popupPlaneMesh);
	params.isSimulationActive = false;
	//interface
	document.getElementById('popupTitle').style.display = 'block';
	document.getElementById('popupText').style.display = 'block';
	popupBtn.style.display = 'block';
	if (status == 'intro') {
		document.getElementById('popupTitle').value = popupTexts.introTitle;
		document.getElementById('popupText').value = popupTexts.introText;
		return;
	}
	if (status == 'done') {
		document.getElementById('popupTitle').value = popupTexts.correctTitle;
		document.getElementById('popupText').value = popupTexts.correctText;
		return;
	}
}

function removePopup() {
	scene.remove(popupPlaneMesh);
	params.isSimulationActive = true;
	//interface
	document.getElementById('popupTitle').style.display = 'none';
	document.getElementById('popupText').style.display = 'none';
	popupBtn.style.display = 'none';
}

export default App;
