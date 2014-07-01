var IGNORE_VALUE = -999000000;

var mouseX, mouseY, shiftKeyDown;

var lonW = 141,
    lonE = 147,
    latS = 35,
    latN = 43;

var xRange = { min: lonToX(lonW), max: lonToX(lonE) },
    yRange = { min: latToY(latS), max: latToY(latN) };

var width = xRange.max - xRange.min,
    height = yRange.max - yRange.min;

var camerax = (xRange.max + xRange.min) / 2,
    cameray = (yRange.max + yRange.min) / 2,
    cameraz = 20;
var camera = new THREE.PerspectiveCamera( 45, window.width / window.height, 1, 1000 );
camera.position.set(camerax + 5, cameray + 5, cameraz);
camera.up.set( 0, 0, 1 );
camera.lookAt(new THREE.Vector3(camerax, cameray, 0));

var renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0xfafafa, 1.0);
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild(renderer.domElement);

var scene = new THREE.Scene();

var light = new THREE.PointLight(0xffffff);
light.position = camera.position;
scene.add(light);

var controls = new THREE.TrackballControls( camera );
controls.staticMoving = true;
controls.rotateSpeed = 3;
controls.rotateSpeed = 1.0;
controls.zoomSpeed = 1.2;
controls.panSpeed = 0.8;
controls.noZoom = false;
controls.noPan = false;
controls.radius = Math.min( width, height );
controls.target = new THREE.Vector3( camerax, cameray, -5 );
controls.update();

function draw(lonList, latList, u0, v0, vortexCore) {
  var xs = lonList.map(lonToX);
  var ys = latList.map(latToY);

  (function() {
    var geometry = new THREE.Geometry();
    var material = new THREE.ParticleSystemMaterial({
      size: 5,
      sizeAttenuation: false,
      vertexColors: true
    });
    ys.forEach(function(y, i) {
      xs.forEach(function(x, j) {
        if (u0[i][j] != IGNORE_VALUE && v0[i][j] != IGNORE_VALUE) {
          if (vortexCore[i][j]) {
            var vertex = new THREE.Vector3(x, y, 0);
            geometry.vertices.push(vertex);
            geometry.colors.push(new THREE.Color(0xe74c3c));
          }
        }
      });
    });
    scene.add(new THREE.ParticleSystem(geometry, material));
  })();

  drawCoastlines();
  animate();
}

function animate() {
  controls.update();
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

$(document).keydown(function (e) { if (e.shiftKey) shiftKeyDown = true; });
$(document).keyup(function (e) { shiftKeyDown = false; });
$(document).click(function (e) {
  // TODO
});
