var container;
var camera, scene, renderer, controls, mesh;
init();
animate();

function init() {
  renderer = new THREE.WebGLRenderer();
  renderer.setClearColor(0x222222);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
  camera.position.set(-300, -300, 300);
  camera.up = new THREE.Vector3(0,0,1);
  camera.lookAt(new THREE.Vector3(0,0,-150));

  scene.add(new THREE.AmbientLight(0x222222));
  var light = new THREE.PointLight(0xffffff);
  light.position = camera.position;
  scene.add(light);

  var points = [];
  for (var i = 0; i < 50; i++) {
    var radius = 2000 / (i+1);
    points.push(new THREE.Vector3(radius * Math.cos(i), radius * Math.sin(i), - i * 10));
  }
  var splineCurve = new THREE.SplineCurve3(points);
  var extrudeSettings = {
    steps: 500,
    bevelEnabled: false,
    extrudePath: splineCurve
  };

  var pts = [],
      numPts = 10;
  for (var j = 0; j < numPts * 2; j++) {
    var a = j / numPts * Math.PI;
    pts.push(new THREE.Vector2(Math.cos(a), Math.sin(a)));
  }
  var shape = new THREE.Shape(pts);

  var geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  var material = new THREE.MeshLambertMaterial({
    color: 0x3498db,
    wireframe: false
  });
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);

  // 無駄に回す
  var time = Date.now() * 0.005;
  mesh.rotation.z = time;
}
