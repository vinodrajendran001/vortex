var IGNORE_VALUE = -999000000;

var _r = 128 / Math.PI;

function sinh (rad) {
  return ( Math.exp(rad) + Math.exp(-rad) ) / 2;
}

function tanh (rad) {
  return ( Math.exp(rad) - Math.exp(-rad) ) / ( Math.exp(rad) + Math.exp(-rad) );
}

function angToRad (ang) {
  return ang * Math.PI / 180;
}

function radToAng (rad) {
  return rad * 180 / Math.PI;
}

function lonToX(lon) {
  var lonRad = angToRad(lon);
  return _r * (lonRad + Math.PI);

}

function latToY(lat) {
  var latRad = angToRad(lat);
  return - _r / 2 * Math.log((1.0 + Math.sin(latRad)) / (1.0 - Math.sin(latRad))) + 128;
}

function xToLon(x) {
  return radToAng( x / _r - Math.PI );
}

function yToLat(y) {
  var E = Math.exp( 2 / _r * (128 - y) );
  return radToAng(Math.asin(tanh( (128-y) / _r )));
}

var mouseX, mouseY;

var lonW = 141;
var lonE = 147;
var latS = 35;
var latN = 43;
var margin = 0.5;
var xRange = {
  min: lonToX(lonW) - margin,
  max: lonToX(lonE) + margin
};
var yRange = {
  min: latToY(latS) - margin,
  max: latToY(latN) + margin
};
console.log(xRange, yRange);
var width = xRange.max - xRange.min;
var height = yRange.max - yRange.min;

var camerax = (xRange.max + xRange.min)/2,
    cameray = (yRange.max + yRange.min)/2;
var camera = new THREE.OrthographicCamera(width/-2, width/2, height/2, height/-2, 1, 1000);
camera.position.set(camerax, cameray, 1);
camera.lookAt(new THREE.Vector3(camerax, cameray, 0));

renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0xffffff, 1.0);
renderer.setSize(600, 800);
document.body.appendChild(renderer.domElement);
var scene = new THREE.Scene();


function drawMap(lon, lat, u0, v0, vortexCore) {
  var xs = lon.map(lonToX);
  var ys = lat.map(latToY);

  (function() {
    ys.forEach(function(y, i) {
      xs.forEach(function(x, j) {
        if (u0[i][j] != IGNORE_VALUE && v0[i][j] != IGNORE_VALUE) {
          var u0ij = u0[i][j];
          var v0ij = -v0[i][j];
          var norm = Math.sqrt(u0ij * u0ij + v0ij * v0ij);
          var arrow = new THREE.ArrowHelper(
            new THREE.Vector3(u0ij / norm, v0ij / norm, 0),
            new THREE.Vector3(x, y, 0),
            0.1,
            0x0000ff);
          scene.add(arrow);
        }
      });
    });
  })();

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
            geometry.colors.push(new THREE.Color(0xff0000));
          }
        }
      });
    });
    scene.add(new THREE.ParticleSystem(geometry, material));
  })();

  animate();

}

function draw3DStreamline(points) {
  var vPoints = [];
  points.forEach(function(point) {
    vPoints.push(new THREE.Vector3(lonToX(point[0]), latToY(point[1]), - point[2]));
  });
  var splineCurve = new THREE.SplineCurve3(vPoints);
  var extrudeSettings = {
    steps: 200,
    bevelEnabled: false,
    extrudePath: splineCurve
  };

  var pts = [],
      numPts = 10;
  for (var j = 0; j < numPts * 2; j++) {
    var a = j / numPts * Math.PI;
    var radius = 0.005;
    pts.push(new THREE.Vector2(radius * Math.cos(a), radius * Math.sin(a)));
  }
  var shape = new THREE.Shape(pts);

  var geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  var material = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    wireframe: false
  });
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
}

function animate() {
  // camera.position.x = camerax + mouseX * 0.005;
  // camera.position.y = cameray + mouseY * 0.005;
  camera.lookAt(new THREE.Vector3(camerax, cameray, 0));
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

function getZ() {
  var z = $('input.z-input').val();
  if (z) return parseInt(z);
  return 10; // 決め打ち
}

renderer.domElement.addEventListener('click', function(e) {
  var pickX = (xRange.max-xRange.min) * e.offsetX / 600 + xRange.min;
  var pickY = yRange.max - (yRange.max-yRange.min) * e.offsetY / 800;
  draw3DStreamline(threedstreamline(xToLon(pickX), yToLat(pickY), getZ(), 20, 0.01)); // z決め打ち
}, false);

document.addEventListener('mousemove', function (event) {
  mouseX = event.clientX;
  mouseY = event.clientY;
}, false);
