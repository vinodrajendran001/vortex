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

controls = new THREE.TrackballControls( camera );
controls.staticMoving = true;
controls.rotateSpeed = 3;

controls.rotateSpeed = 1.0;
controls.zoomSpeed = 1.2;
controls.panSpeed = 0.8;

controls.noZoom = false;
controls.noPan = false;

controls.radius = Math.min( width, height );
controls.target = new THREE.Vector3( camerax, cameray, 0 );

controls.update();

function draw3DStreamline(points) {
  var scale = d3.scale.linear().domain([0, 1]).range([0, 360]);
  var arrowColor = d3.hsl(scale(Math.random()), 0.8, 0.7).toString()

  var vPoints = [], hPoints = [], radius = 0.015;
  points.forEach(function(point) {
    var _x = lonToX(point[0]), _y = latToY(point[1]), _z = - point[2] / 50;
    vPoints.push(new THREE.Vector3(_x, _y, _z));
    hPoints.push(new THREE.Vector3(_x + radius * 1000, _y, _z));
  });
  var curve = new THREE.SplineCurve3(vPoints);

  var extrudeSettings = {
    steps: 200,
    bevelEnabled: false,
    extrudePath: curve
  };

  var pts = [],
      numPts = 100;
  for (var j = 0; j < numPts * 2; j++) {
    var a = j / numPts * Math.PI;
    pts.push(new THREE.Vector2(radius * Math.cos(a), radius * Math.sin(a)));
  }
  var shape = new THREE.Shape(pts);
  var geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  var material = new THREE.MeshLambertMaterial({
    color: arrowColor,
    wireframe: true
  });
  var mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

}



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
            0x3498db,
            0.05,
            0.03);
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
            geometry.colors.push(new THREE.Color(0xe74c3c));
            // draw3DStreamline(threedstreamline(xToLon(x), yToLat(y), 10, 200, 0.01));
          }
        }
      });
    });
    scene.add(new THREE.ParticleSystem(geometry, material));
  })();

  drawCoastLine();

  animate();

}

var drawCoastLine = function () {
  d3.json('coastl_jpn.json').on('load', function (data) {
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
      scene.add(line);
    });
  }).get();
};


function animate() {
  controls.update();
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

function getZ() {
  var z = $('input.z-input').val();
  if (z) return parseInt(z);
  return 40; // 決め打ち
}

function convertToZ (rawZ, lat) {
  // var R = 40000 * 1000;
  // var ratio = width / ((lonW - lonE) * R * Math.cos(lat) / 360);
  // return - ratio * rawZ;
  return - rawZ / 50;
}

$(document).keydown(function (e) {
  if (e.shiftKey) shiftKeyDown = true;
});
$(document).keyup(function (e) {
  shiftKeyDown = false;
});
$(document).click(function (e) {
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
    draw3DStreamline(threedstreamline(xToLon(pickX), yToLat(pickY), getZ(), 200, 0.01)); // z決め打ち
  }
});
