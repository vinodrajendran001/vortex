var IGNORE_VALUE = -999000000;

var mouseX, mouseY, shiftKeyDown;

var lonW = 141,
    lonE = 147,
    latS = 35,
    latN = 43,
    zSha = 0.5,
    zDee = 820;

var xRange = { min: lonToX(lonW), max: lonToX(lonE) },
    yRange = { min: latToY(latS), max: latToY(latN) },
    zRange = { min: mToZ(zDee),   max: mToZ(zSha) };

var width = xRange.max - xRange.min,
    height = yRange.max - yRange.min;

var camerax = (xRange.max + xRange.min) / 2,
    cameray = (yRange.max + yRange.min) / 2,
    cameraz = 20;
var camera = new THREE.PerspectiveCamera( 45, window.width / window.height, 1, 1000 );
camera.position.set(camerax + 2, cameray + 5, cameraz);
camera.up.set( 0, 0, 1 );

var renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0xebf9ff, 1.0);
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild(renderer.domElement);

var scene = new THREE.Scene();

var light = new THREE.PointLight(0xffffff);
light.position = camera.position;
scene.add(light);

var controls = new THREE.TrackballControls( camera );
controls.staticMoving = true;
controls.rotateSpeed = 3;
controls.radius = Math.min( width, height );
controls.target = new THREE.Vector3( camerax, cameray, (zRange.max + zRange.min) / 2 );
controls.update();

drawRectangle(xRange, yRange, zRange);
drawCoastlines();
animate();

function animate() {
  requestAnimationFrame( animate );
  controls.update();
  render();
}

function render() {
  renderer.render( scene, camera );
}

$(document).keydown(function (e) { if (e.shiftKey) shiftKeyDown = true; });
$(document).keyup(function (e) { shiftKeyDown = false; });
$(document).click(function (e) {
  // TODO
});
