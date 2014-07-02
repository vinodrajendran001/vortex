function drawCoastlines() {
  d3.json('data/coastl_jpn.json').on('load', function (data) {
    var group = new THREE.Object3D();
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