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

var mouseX, mouseY, trackball, shiftKeyDown;

var lonW = 141,
    lonE = 147,
    latS = 35,
    latN = 43;

var xRange = { min: lonToX(lonW), max: lonToX(lonE) },
    yRange = { min: latToY(latS), max: latToY(latN) };

var width = xRange.max - xRange.min,
    height = yRange.max - yRange.min;

var camerax = (xRange.max + xRange.min) / 2,
    cameray = (yRange.max + yRange.min) / 2;
var camera = new THREE.PerspectiveCamera( 45, window.width / window.height, 1, 1000 );
var cameraz = 20
camera.position.set(camerax + 5, cameray + 5, cameraz);
camera.up.set( 0, 0, 1 );
camera.lookAt(new THREE.Vector3(camerax, cameray, 0));

renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0xfafafa, 1.0);
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild(renderer.domElement);
var scene = new THREE.Scene();

var light = new THREE.PointLight(0xffffff);
light.position = camera.position;
scene.add(light);

// TrackballControls
controls = new THREE.TrackballControls( camera );
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

// draw streamline
function draw3DStreamline(points) {
  var segments = 64, // default 64
      tubeRadius = 0.015,
      radiusSegments = 16, // default 8
      closed = false, // if set to true, the start of the tube and the end will be connected together. Default false.
      debug = true;

  var scale = d3.scale.linear().domain([0, 1]).range([0, 360]),
      tubeColor = d3.hsl(scale(Math.random()), 0.8, 0.8).toString()

  var vPoints = [], vertexColors = [];
  points.forEach(function(point) {
    vPoints.push(new THREE.Vector3(lonToX(point[0]), latToY(point[1]), mToZ(point[2])));
  });
  var spline = new THREE.SplineCurve3(vPoints);

  var geometry = new THREE.TubeGeometry(spline, segments, tubeRadius, radiusSegments, closed, debug);

  var material = new THREE.MeshLambertMaterial({
     color: tubeColor,
     wireframe: true
  });

  var mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
}

// z = 0 での流速ベクトル、及び渦点を描画
function drawMap(lonList, latList, u0, v0, vortexCore) {
  var xs = lonList.map(lonToX);
  var ys = latList.map(latToY);

  // (function() {
  //   group = new THREE.Object3D();
  //   ys.forEach(function(y, i) {
  //     xs.forEach(function(x, j) {
  //       if (u0[i][j] != IGNORE_VALUE && v0[i][j] != IGNORE_VALUE) {
  //         var u0ij = u0[i][j];
  //         var v0ij = -v0[i][j];
  //         var norm = Math.sqrt(u0ij * u0ij + v0ij * v0ij);
  //         var arrow = new THREE.ArrowHelper(
  //           new THREE.Vector3(u0ij / norm, v0ij / norm, 0),
  //           new THREE.Vector3(x, y, 0),
  //           0.1,
  //           0x3498db,
  //           0.05,
  //           0.03);
  //         group.add(arrow);
  //       }
  //     });
  //   });
  //   scene.add(group);
  // })();

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

  drawCoastLine();
  animate();
}

function drawCoastLine() {
  d3.json('coastl_jpn.json').on('load', function (data) {
    group = new THREE.Object3D();
    var lineMaterial = new THREE.LineBasicMaterial({ color: 0x34495e });
    data.forEach(function (row) {
      var geometry = new THREE.Geometry();
      row.forEach(function (pos) {
        var x = lonToX(pos[1]);
        var y = latToY(pos[0]);
        var vertice = new THREE.Vector3(x, y, 0);
        geometry.vertices.push(vertice);
      });
      var line = new THREE.Line(geometry, lineMaterial);
      group.add(line);
    });
    scene.add(group);
  }).get();
}

function animate() {
  controls.update();
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}



function mToZ (rawZ, lat) {
  // var R = 40000 * 1000;
  // var ratio = width / ((lonW - lonE) * R * Math.cos(lat) / 360);
  // return - ratio * rawZ;
  return - rawZ / 50;
}


$(document).keydown(function (e) { if (e.shiftKey) shiftKeyDown = true; });
$(document).keyup(function (e) { shiftKeyDown = false; });
$(document).click(function (e) {
  var xpos, ypos;
  if(shiftKeyDown) {
    if(e.offsetX == undefined) { // for firefox
      xpos = e.pageX - $('canvas').offset().left;
      ypos = e.pageY - $('canvas').offset().top;
    } else {
      xpos = e.offsetX;
      ypos = e.offsetY;
    }
    var pickX = (xRange.max - xRange.min) * xpos / window.innerWidth + xRange.min;
    var pickY = yRange.max - (yRange.max - yRange.min) * ypos / window.innerHeight;
    draw3DStreamline(threedstreamline(xToLon(pickX), yToLat(pickY), 50, 200, 0.01)); //  TODO: 決め打ちの値
  }
});
