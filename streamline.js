var scale = d3.scale.linear().domain([0, 1]).range([0, 360]);
var segments = 64,       // default 64
    tubeRadius = 0.015,
    radiusSegments = 16, // default 8
    closed = false,      // if set to true, the start of the tube
                         // and the end will be connected together. Default false.
    debug = true;

function drawStreamline(points) {
  var tubeColor = d3.hsl(scale(Math.random()), 0.8, 0.8).toString();

  var vPoints = [];
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
