function load(url) {
  var deferred = $.Deferred();
  loadData(url, function(data) {
    deferred.resolve(data);
  });
  return deferred;
}

var threedinterpolate, threedstreamline;

$(function() {
  $.when(load('u.dods'), load('v.dods'), load('w.dods')).done(function(u, v, w) {
    var _u = u[0][0][0], _v = v[0][0][0], _w = w[0][0][0];
    var valList = [_u, _v, _w];
    var zIndex; // z index:0~30
    var yIndex; // y index:0~80
    var xIndex; // x index:0~60
    var IGNORE_VALUE = -999000000;
    var vlabel = []; // ='A','B','C',or'D'
    var vorcan = []; // if is set to be vortice candidate,true for this (z,y,x)（index）
    var vor = []; // if is set to be vortice\,true for this (z,y,x)
    var pointsofvor = []; // contain exact point of vor like[[x0,y0,z0],...]

    console.time("detect vorcan");

    // function of initialization
    var inil33matrix = function(x) {
      for (zIndex = 0; zIndex <= 30; zIndex++) {
        x[zIndex] = [];
        for (yIndex = 0; yIndex <= 80; yIndex++) {
          x[zIndex][yIndex] = [];
          for (xIndex = 0; xIndex <= 60; xIndex++) {
            x[zIndex][yIndex][xIndex] = 0;
          }
        }
      }
    };

    //  initialization of matrix
    inil33matrix(vor); // if is vortice candidate,true for this (z,y,x),inil=false
    inil33matrix(vlabel);
    inil33matrix(vorcan); //  no vorcan at first

    //  function of detect vortex candidate
    var detectVortexCandidate = function(u, v) {
      var xPositive, yPositive;
      var counter; //  if counter>=3, vorcan
      for (zIndex = 0; zIndex <= 30; zIndex++) {
        for (yIndex = 0; yIndex <= 80; yIndex++) {
          for (xIndex = 0; xIndex <= 60; xIndex++) {
            if (u[0][0][0][zIndex][yIndex][xIndex] > 0) xPositive = true;
            else xPositive = false;
            if (v[0][0][0][zIndex][yIndex][xIndex] > 0) yPositive = true;
            else yPositive = false;
            if (yPositive === true) {
              if (xPositive === true) {
                vlabel[zIndex][yIndex][xIndex] = 'A';
              } else {
                vlabel[zIndex][yIndex][xIndex] = 'B';
              }
            } else if (xPositive === false) {
              vlabel[zIndex][yIndex][xIndex] = 'C';
            } else {
              vlabel[zIndex][yIndex][xIndex] = 'D';
            }
          }
        }
      }
      for (zIndex = 0; zIndex <= 30; zIndex++) {
        for (yIndex = 1; yIndex <= 79; yIndex++) {
          for (xIndex = 1; xIndex <= 59; xIndex++) {
            var counts = {
              A: 0,
              B: 0,
              C: 0,
              D: 0
            };
            var num = 0;
            for (var i1 = -1; i1 <= 1; i1 = i1 + 2) {
              for (var j1 = -1; j1 <= 1; j1 = j1 + 2) {
                switch (vlabel[zIndex][yIndex + i1][xIndex + j1]) {
                  case 'A': counts.A++; break;
                  case 'B': counts.B++; break;
                  case 'C': counts.C++; break;
                  case 'D': counts.D++; break;
                }
              }
            }

            if (counts.A > 0) num++;
            if (counts.B > 0) num++;
            if (counts.C > 0) num++;
            if (counts.D > 0) num++;

            if (num >= 3) {
              vorcan[zIndex][yIndex][xIndex] = true;
            } else {
              vorcan[zIndex][yIndex][xIndex] = false;
            }
          }
        }
      }
      return vorcan;
    };
    detectVortexCandidate(u, v);

    // function of calculate the number of vorcan or vor
    var numberofvor = function(vor) {
      var number = 0;
      for (zIndex = 0; zIndex <= 30; zIndex++) {
        for (yIndex = 0; yIndex <= 79; yIndex++) {
          for (xIndex = 0; xIndex <= 59; xIndex++) {
            if (vor[zIndex][yIndex][xIndex] === true) {
              number++;
            }
          }
        }
      }
      console.log("number of vortex candidate = " + number);
      return number;
    };
    numberofvor(vorcan);

    // function of cleanup
    // --------------to compute velocity gradient tensor
    //  set dv/dx equals to v(x+1)-v(x).not take 1/2
    var cleanupvorcan = function(vorcan) {
      for (zIndex = 1; zIndex <= 29; zIndex++) {
        for (yIndex = 1; yIndex <= 79; yIndex++) {
          for (xIndex = 1; xIndex <= 59; xIndex++) {
            if (vorcan[zIndex][yIndex][xIndex] === true) {
              var v12, v13, v21, v23, v31, v32;
              v12 = u[0][0][0][zIndex][yIndex + 1][xIndex] - u[0][0][0][zIndex][yIndex][xIndex]; // u(y+1)-u(y)
              v13 = u[0][0][0][zIndex + 1][yIndex][xIndex] - u[0][0][0][zIndex][yIndex][xIndex]; // u(z+1)-u(z)
              v21 = v[0][0][0][zIndex][yIndex][xIndex + 1] - v[0][0][0][zIndex][yIndex][xIndex];
              v23 = v[0][0][0][zIndex + 1][yIndex][xIndex] - v[0][0][0][zIndex][yIndex][xIndex];
              v31 = w[0][0][0][zIndex][yIndex][xIndex + 1] - w[0][0][0][zIndex][yIndex][xIndex];
              v32 = w[0][0][0][zIndex][yIndex + 1][xIndex] - w[0][0][0][zIndex][yIndex][xIndex];
              var delta, Q, R;
              Q = -v12 * v21 - v23 * v32 - v13 * v31; // should times 1/2??
              R = v12 * v23 * v31 + v21 * v13 * v32;

              if (Q * Q * Q / 27 + R * R / 4 > 0 && Math.abs(u[0][0][0][zIndex][yIndex][xIndex]) < 0.25 && Math.abs(v[0][0][0][zIndex][yIndex][xIndex]) < 0.25 && Math.abs(w[0][0][0][zIndex][yIndex][xIndex]) < 0.25) vor[zIndex][yIndex][xIndex] = true;
            }
          }
        }
      }
      return vor;
    };
    cleanupvorcan(vorcan);
    console.log("after cleanup:");
    numberofvor(vor);

    console.timeEnd("detect vorcan");

    // function of get the exact point of vor
    var getpointofvor = function(vor) {
      var point = []; // [(x0,y0,z0),...]
      for (zIndex = 1; zIndex <= 29; zIndex++) {
        for (yIndex = 1; yIndex <= 79; yIndex++) {
          for (xIndex = 1; xIndex <= 59; xIndex++) {
            if (vor[zIndex][yIndex][xIndex] === true) {
              point.push([
                0.1 * xIndex + 141, 0.1 * yIndex + 35, u[0][2][zIndex]
              ]);
            }
          }
        }
      }
      return point;
    };

    drawMap(u[0][4], u[0][3], u[0][0][0][0], v[0][0][0][0], vor[1]);

    // goest to 3D
    // notice first about z , u[0][2]+([0] to [30]) contains the depth of z for different indoex
    var pk = [-1, 1, 1, -1, -1, 1, 1, -1];
    var qk = [-1, -1, 1, 1, -1, -1, 1, 1];
    var rk = [-1, -1, -1, -1, 1, 1, 1, 1];
    threedinterpolate = function(lon, lat, depth) {
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

      // _wList = _wList.map(function(x) { return x * 50000; });

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
    threedstreamline = function(lon, lat, depth, n, deltaT) {
      streamLinePoints = [[lon, lat, depth]];
      for (var i = 0; i < n; i++) {
        var tmpLon = lon;
        k1 = threedinterpolate(lon, lat, depth); // x direction
        if (!k1) break;
        k2 = threedinterpolate((lon + k1[0] * deltaT / 2), (lat + k1[1] * deltaT / 2), (depth + k1[2] * deltaT / 2));
        if (!k2) break;
        k3 = threedinterpolate((lon + k2[0] * deltaT / 2), (lat + k2[1] * deltaT / 2), (depth + k2[2] * deltaT / 2));
        if (!k3) break;
        k4 = threedinterpolate((lon + k3[0] * deltaT), (lat + k3[1] * deltaT), (depth + k3[2] * deltaT));
        if (!k4) break;
        lon = lon + deltaT / 6.0 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
        lat = lat + deltaT / 6.0 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
        depth = depth + deltaT / 6.0 * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]);
        if (depth > 500 || depth < 10) break; // 決め打ち?
        streamLinePoints.push([lon, lat, depth]);
      }
      return (streamLinePoints);
    };

    var pointsofvor = getpointofvor(vor),
        p;
    for (var i = pointsofvor.length - 1; i >= 0; i--) {
      p = pointsofvor[i];
      var _streamline = threedstreamline(p[0], p[1], p[2], 500, 0.01);
      if (_streamline && _streamline.length > 1) draw3DStreamline(_streamline);
    }

  });
});
