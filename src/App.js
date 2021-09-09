import * as THREE from 'three';
import { Line2, LineGeometry, LineMaterial } from 'three-fatline';

//scene
let canvas, camera, scene, light, renderer,
	chiselPlane, hummerSound, lineObj;
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
	isSimulationActive: false,
	isChiselMoving: false,
	popupDelay: 2000
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
		position: new THREE.Vector3(-33.0, -3.0, -5.0),
		prevXPosition: -33.0, //position x
		maxXPosition: -9.15,
		clickCount: 5,
		currentClick: 0,
		xMovingStep: 1.0
	},
	line: {
		lineColor: 0x16ff00,
		lineWarning: 0xff0000,
		warningWaitTime: 250,
		lineWidth: 4,
		lineEndsPositionArray: [34.9, -1.0, -5.0, 34.9, -8.0, -5.0]
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

		//line
		const lineMtl = new LineMaterial({
			color: objectsParams.line.lineColor,
			linewidth: objectsParams.line.lineWidth, // px
			resolution: new THREE.Vector2(params.sceneWidth, params.sceneHeight) // resolution of the viewport
		});
		const lineGeometry = new LineGeometry();
		lineGeometry.setPositions(objectsParams.line.lineEndsPositionArray);
		lineObj = new Line2(lineGeometry, lineMtl);

		//popup
		createPopupPlane();
		addPopup('intro');

		renderer.render(scene, camera);
		canvas.addEventListener('mousedown', onMouseDown, false);
		popupBtn.addEventListener('click', removePopup, false);

		canvas.addEventListener("touchstart",   touch_start_handler);

		animate();
	}
}

function onMouseDown() {
	if (!params.isSimulationActive) return;
	hummerClick();
}

function hummerClick() {
	document.title = objectsParams.chisel.currentClick;
	if (objectsParams.chisel.currentClick == objectsParams.chisel.clickCount)
	{
		lineObj.material.color.setHex(objectsParams.line.lineWarning);
		setTimeout(() => {
			lineObj.material.color.setHex(objectsParams.line.lineColor);
		}, objectsParams.line.warningWaitTime);
		return;
	}
	hummerSound.pause();
	hummerSound.currentTime = 0;
	hummerSound.play();
	params.isChiselMoving = true;
	params.isSimulationActive = false;
}

function animate() {
	if (params.isChiselMoving) {
		let clickStepWidth = (objectsParams.chisel.maxXPosition - objectsParams.chisel.position.x) 
			/ objectsParams.chisel.clickCount;
		if (chiselPlane.position.x < objectsParams.chisel.prevXPosition + clickStepWidth &&
			chiselPlane.position.x < objectsParams.chisel.maxXPosition) {
			params.isSimulationActive = false;
			chiselPlane.position.x += objectsParams.chisel.xMovingStep;
		}
		else {
			params.isChiselMoving = false;
			setTimeout(() => {
				params.isSimulationActive = true;
			}, 1000);
			//hummerSound.pause();
			objectsParams.chisel.currentClick++;
			objectsParams.chisel.prevXPosition = chiselPlane.position.x;
			if (objectsParams.chisel.currentClick == objectsParams.chisel.clickCount)
			{
				scene.add(lineObj);
				setTimeout(() => {
					addPopup('done');
				}, params.popupDelay);
			}
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
	popupPlaneMesh.scale.set(0.12, 0.14, 0.12)
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

function touch_start_handler() {
	if (!params.isSimulationActive) return;
	hummerClick();
}

export default App;
