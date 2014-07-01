function drawRectangle (xRange, yRange, zRange) {
  var group = new THREE.Object3D();
  var lineMaterial = new THREE.LineBasicMaterial({ color: 0x34495e });
  var geometry = new THREE.Geometry();
  geometry.vertices.push(new THREE.Vector3(xRange.min, yRange.min, zRange.min));
  geometry.vertices.push(new THREE.Vector3(xRange.max, yRange.min, zRange.min));
  geometry.vertices.push(new THREE.Vector3(xRange.max, yRange.max, zRange.min));
  geometry.vertices.push(new THREE.Vector3(xRange.min, yRange.max, zRange.min));
  geometry.vertices.push(new THREE.Vector3(xRange.min, yRange.min, zRange.min));
  var line = new THREE.Line(geometry, lineMaterial);
  group.add(line);

  geometry = new THREE.Geometry();
  geometry.vertices.push(new THREE.Vector3(xRange.min, yRange.min, zRange.max));
  geometry.vertices.push(new THREE.Vector3(xRange.max, yRange.min, zRange.max));
  geometry.vertices.push(new THREE.Vector3(xRange.max, yRange.max, zRange.max));
  geometry.vertices.push(new THREE.Vector3(xRange.min, yRange.max, zRange.max));
  geometry.vertices.push(new THREE.Vector3(xRange.min, yRange.min, zRange.max));
  line = new THREE.Line(geometry, lineMaterial);
  group.add(line);

  geometry = new THREE.Geometry();
  geometry.vertices.push(new THREE.Vector3(xRange.min, yRange.min, zRange.min));
  geometry.vertices.push(new THREE.Vector3(xRange.min, yRange.min, zRange.max));
  line = new THREE.Line(geometry, lineMaterial);
  group.add(line);

  geometry = new THREE.Geometry();
  geometry.vertices.push(new THREE.Vector3(xRange.max, yRange.min, zRange.min));
  geometry.vertices.push(new THREE.Vector3(xRange.max, yRange.min, zRange.max));
  line = new THREE.Line(geometry, lineMaterial);
  group.add(line);

  geometry = new THREE.Geometry();
  geometry.vertices.push(new THREE.Vector3(xRange.max, yRange.max, zRange.min));
  geometry.vertices.push(new THREE.Vector3(xRange.max, yRange.max, zRange.max));
  line = new THREE.Line(geometry, lineMaterial);
  group.add(line);

  geometry = new THREE.Geometry();
  geometry.vertices.push(new THREE.Vector3(xRange.min, yRange.max, zRange.min));
  geometry.vertices.push(new THREE.Vector3(xRange.min, yRange.max, zRange.max));
  line = new THREE.Line(geometry, lineMaterial);
  group.add(line);

  scene.add(group);
}