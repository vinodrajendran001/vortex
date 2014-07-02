var _r = 128 / Math.PI;

function sinh (rad) {
  return ( Math.exp(rad) + Math.exp(-rad) ) / 2;
}

function tanh (rad) {
  return (Math.exp(rad) - Math.exp(-rad)) / (Math.exp(rad) + Math.exp(-rad));
}

function angToRad (ang) {
  return ang * Math.PI / 180;
}

function radToAng (rad) {
  return rad * 180 / Math.PI;
}

function lonToX(lon) {
  var lonRad = angToRad( lon );
  return _r * ( lonRad + Math.PI );
}

function latToY(lat) {
  var latRad = angToRad(lat);
  return - _r / 2 * Math.log((1.0 + Math.sin(latRad)) / (1.0 - Math.sin(latRad))) + 128;
}

function xToLon(x) {
  return radToAng(x / _r - Math.PI);
}

function yToLat(y) {
  var E = Math.exp(2 / _r * (128 - y));
  return radToAng(Math.asin(tanh((128 - y) / _r)));
}

function mToZ (rawZ, lat) {
  return - rawZ / 300;
}