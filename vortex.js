function load(url) {
  var deferred = $.Deferred();
  loadData(url, function(data) {
    deferred.resolve(data);
  });
  return deferred;
}

$(function() {
  $.when(load('u.dods'), load('v.dods'), load('w.dods')).done(function(u, v, w) {
    var _u = u[0][0][0],
        _v = v[0][0][0],
        _w = w[0][0][0],
        lonList = u[0][4],
        latList = u[0][3],
        depthList = u[0][2];
  depthList.forEach(function(depth){console.log(depth)});
    var valList = [_u, _v, _w];
    var xIndex, // x index:0~60
        yIndex, // y index:0~80
        zIndex; // z index:0~30
    var IGNORE_VALUE = -999000000;

    // draw(u[0][4], u[0][3], u[0][0][0][0], v[0][0][0][0], vor[1]);

    var pk = [-1, 1, 1, -1, -1, 1, 1, -1];
    var qk = [-1, -1, 1, 1, -1, -1, 1, 1];
    var rk = [-1, -1, -1, -1, 1, 1, 1, 1];
    var interpolate = function(lon, lat, depth) {
      // 0<=x<=61,0<=y<=81,0<=z_index<=30
      // 141<=lon<=147,35<=lat<=43
      // 0.5[0]<depth<820[30]
      var x, x0, y, y0, z, z0, z1, z_index, p, q, r;
      z_index = -1;
      x = (lon - 141) * 10;
      y = (lat - 35) * 10;
      z = depth;
      for (var item in u[0][2]) {
        if (depth < u[0][2][item]) {
          break;
        } // z_index is not number?
        z_index = z_index + 1;
        z0 = u[0][2][z_index];
      }
      x0 = Math.floor(x);
      y0 = Math.floor(y);
      z1 = u[0][2][z_index + 1];
      p = 2 * x - x0 - (x0 + 1);
      q = 2 * y - y0 - (y0 + 1);
      r = (2 * z - z0 - z1) / (z1 - z0);
      // calculate S using p,q,r and S0`S7

      for (var valNum = 2; valNum >= 0; valNum--) {
        var val = valList[valNum];
        if (val == null) return;
        for (var i = 1; i >= 0; i--) {
          if (val[z_index + i] == null) return;
          for (var j = 1; j >= 0; j--) {
            if (val[z_index + i][y0 + j] == null) return;
            for (var k = 1; k >= 0; k-- ) {
              if (val[z_index + i][y0 + j][x0 + k] == null || val[z_index + i][y0 + j][x0 + k] == IGNORE_VALUE) return;
            }
          }
        }
      }

      var _uList = [
        _u[z_index][y0][x0],
        _u[z_index][y0][x0 + 1],
        _u[z_index][y0 + 1][x0 + 1],
        _u[z_index][y0 + 1][x0],
        _u[z_index + 1][y0][x0],
        _u[z_index + 1][y0][x0 + 1],
        _u[z_index + 1][y0 + 1][x0 + 1],
        _u[z_index + 1][y0 + 1][x0]
      ];
      var _vList = [
        _v[z_index][y0][x0],
        _v[z_index][y0][x0 + 1],
        _v[z_index][y0 + 1][x0 + 1],
        _v[z_index][y0 + 1][x0],
        _v[z_index + 1][y0][x0],
        _v[z_index + 1][y0][x0 + 1],
        _v[z_index + 1][y0 + 1][x0 + 1],
        _v[z_index + 1][y0 + 1][x0]
      ];
      var _wList = [
        _w[z_index][y0][x0],
        _w[z_index][y0][x0 + 1],
        _w[z_index][y0 + 1][x0 + 1],
        _w[z_index][y0 + 1][x0],
        _w[z_index + 1][y0][x0],
        _w[z_index + 1][y0][x0 + 1],
        _w[z_index + 1][y0 + 1][x0 + 1],
        _w[z_index + 1][y0 + 1][x0]
      ];

      var vx = 0, vy = 0, vz = 0;
      for (i = 0; i < pk.length; i++) {
        vx += 0.125 * (1 + pk[i] * p) * (1 + qk[i] * q) * (1 + rk[i] * r) * _uList[i];
        vy += 0.125 * (1 + pk[i] * p) * (1 + qk[i] * q) * (1 + rk[i] * r) * _vList[i];
        vz += 0.125 * (1 + pk[i] * p) * (1 + qk[i] * q) * (1 + rk[i] * r) * _wList[i];
      }
      return [vx, vy, vz];
    };

    var k1, k2, k3, k4;
    var streamLinePoints;
    var getStreamlinePoints = function(lon, lat, depth, n, deltaT) {
      streamLinePoints = [[lon, lat, depth]];
      for (var i = 0; i < n; i++) {
        var tmpLon = lon;
        k1 = interpolate(lon, lat, depth); // x direction
        if (!k1) break;
        k2 = interpolate((lon + k1[0] * deltaT / 2), (lat + k1[1] * deltaT / 2), (depth + k1[2] * deltaT / 2));
        if (!k2) break;
        k3 = interpolate((lon + k2[0] * deltaT / 2), (lat + k2[1] * deltaT / 2), (depth + k2[2] * deltaT / 2));
        if (!k3) break;
        k4 = interpolate((lon + k3[0] * deltaT), (lat + k3[1] * deltaT), (depth + k3[2] * deltaT));
        if (!k4) break;
        lon = lon + deltaT / 6.0 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
        lat = lat + deltaT / 6.0 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
        depth = depth + deltaT / 6.0 * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]);
        if (depth > 500 || depth < 10) break; // 決め打ち?
        streamLinePoints.push([lon, lat, depth]);
      }
      return (streamLinePoints);
    };

    var pointsofvor = getSeedPoints2(lonList, latList, depthList, _u, _v, _w),
        p;
    for (var i = pointsofvor.length - 1; i >= 0; i--) {
      p = pointsofvor[i];
      var _streamlinePoints = getStreamlinePoints(p[0], p[1], p[2], 700, 0.001);
      if (_streamlinePoints && _streamlinePoints.length > 500) drawStreamline(_streamlinePoints);
    }
  });
});
