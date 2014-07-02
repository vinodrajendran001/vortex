function load(url) {
  var deferred = $.Deferred();
  loadData(url, function(data) {
    deferred.resolve(data);
  });
  return deferred;
}

$(function() {
  $.when(load('data/u.dods'), load('data/v.dods'), load('data/w.dods')).done(function(u, v, w) {
    var _u = u[0][0][0],
        _v = v[0][0][0],
        _w = w[0][0][0],
        lonList = u[0][4],
        latList = u[0][3],
        depthList = u[0][2];
    var valList = [_u, _v, _w];
    var IGNORE_VALUE = -999000000;

    var pk = [-1, 1, 1, -1, -1, 1, 1, -1];
    var qk = [-1, -1, 1, 1, -1, -1, 1, 1];
    var rk = [-1, -1, -1, -1, 1, 1, 1, 1];
    var interpolate = function(lon, lat, depth) {
      var x, xIdx,
          y, yIdx,
          z, z0, z1, zIdx,
          p, q, r;

      zIdx = -1;
      x = (lon - 141) * 10;
      y = (lat - 35) * 10;
      z = depth;

      for (var depthIdx in depthList) {
        if (depth < depthList[depthIdx]) {
          break;
        }
        zIdx = zIdx + 1;
        z0 = depthList[depthIdx];
      }

      xIdx = Math.floor(x);
      yIdx = Math.floor(y);
      z1 = depthList[zIdx + 1];
      p = 2 * x - xIdx - (xIdx + 1);
      q = 2 * y - yIdx - (yIdx + 1);
      r = (2 * z - z0 - z1) / (z1 - z0);
      // calculate S using p,q,r and S0`S7

      for (var valNum = 2; valNum >= 0; valNum--) {
        var val = valList[valNum];
        if (val == null) return;
        for (var i = 1; i >= 0; i--) {
          if (val[zIdx + i] == null) return;
          for (var j = 1; j >= 0; j--) {
            if (val[zIdx + i][yIdx + j] == null) return;
            for (var k = 1; k >= 0; k-- ) {
              if (val[zIdx + i][yIdx + j][xIdx + k] == null || val[zIdx + i][yIdx + j][xIdx + k] == IGNORE_VALUE) return;
            }
          }
        }
      }

      var _uList = [
        _u[zIdx][yIdx][xIdx],
        _u[zIdx][yIdx][xIdx + 1],
        _u[zIdx][yIdx + 1][xIdx + 1],
        _u[zIdx][yIdx + 1][xIdx],
        _u[zIdx + 1][yIdx][xIdx],
        _u[zIdx + 1][yIdx][xIdx + 1],
        _u[zIdx + 1][yIdx + 1][xIdx + 1],
        _u[zIdx + 1][yIdx + 1][xIdx]
      ];
      var _vList = [
        _v[zIdx][yIdx][xIdx],
        _v[zIdx][yIdx][xIdx + 1],
        _v[zIdx][yIdx + 1][xIdx + 1],
        _v[zIdx][yIdx + 1][xIdx],
        _v[zIdx + 1][yIdx][xIdx],
        _v[zIdx + 1][yIdx][xIdx + 1],
        _v[zIdx + 1][yIdx + 1][xIdx + 1],
        _v[zIdx + 1][yIdx + 1][xIdx]
      ];
      var _wList = [
        _w[zIdx][yIdx][xIdx],
        _w[zIdx][yIdx][xIdx + 1],
        _w[zIdx][yIdx + 1][xIdx + 1],
        _w[zIdx][yIdx + 1][xIdx],
        _w[zIdx + 1][yIdx][xIdx],
        _w[zIdx + 1][yIdx][xIdx + 1],
        _w[zIdx + 1][yIdx + 1][xIdx + 1],
        _w[zIdx + 1][yIdx + 1][xIdx]
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
    var getStreamlinePoints = function(iniLon, iniLat, iniDepth, n, deltaT) {
      streamLinePoints = [[iniLon, iniLat, iniDepth]];
      var lon = iniLon,
          lat = iniLat,
          depth = iniDepth;
      for (var i = 0; i < n; i++) {
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
        streamLinePoints.push([lon, lat, depth]);
      }
      return (streamLinePoints);
    };

    var seedPoints = getSeedPoints(lonList, latList, depthList, _u, _v, _w);
    for (var i = seedPoints.length - 1; i >= 0; i--) {
      var sp = seedPoints[i];
      var streamlinePoints = getStreamlinePoints(sp.lon, sp.lat, sp.depth, 700, 0.001);
      if (streamlinePoints && streamlinePoints.length > 500) drawStreamline(streamlinePoints);
    }
  });
});
