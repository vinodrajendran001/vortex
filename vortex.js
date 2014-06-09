function load(url) {
  var deferred = $.Deferred();
  loadData(url, function(data) {
    deferred.resolve(data);
  });
  return deferred;
}
var interpolate, streamline, threedinterpolate, threedstreamline;
$(function() {
  $.when(load('u.dods'), load('v.dods'), load('w.dods')).done(function(u, v, w) {
    console.log(w);
    var h; //z index:0~30
    var i; //y index:0~80
    var j; //x index:0~60
    var IGNORE_VALUE = -999000000;
    var vlabel = []; //='A','B','C',or'D'
    var vorcan = []; //if is set to be vortice candidate,true for this (z,y,x)（index）
    var vor = []; //if is set to be vortice\,true for this (z,y,x)
    var pointsofvor = []; //contain exact point of vor like[[x0,y0,z0],...]

    //function of initialization
    var inil33matrix = function(x) {
        for (h = 0; h <= 30; h++) {
          x[h] = [];
          for (i = 0; i <= 80; i++) {
            x[h][i] = [];
            for (j = 0; j <= 60; j++) {
              x[h][i][j] = 0;
            }
          }
        }
      };

    //initialization of matrix
    inil33matrix(vor); //if is vortice candidate,true for this (z,y,x),inil=false
    inil33matrix(vlabel);
    inil33matrix(vorcan); // no vorcan at first

    //function of detect vortex candidate
    var detectvotexcandidate = function(u, v) {
      var xpositive; // true or fasle
      var ypositive;
      var counter; //if counter>=3, vorcan
      for (h = 0; h <= 30; h++) {
        for (i = 0; i <= 80; i++) {
          for (j = 0; j <= 60; j++) {
            if (u[0][0][0][h][i][j] > 0) xpositive = true;
            else xpositive = false;
            if (v[0][0][0][h][i][j] > 0) ypositive = true;
            else ypositive = false;
            if (ypositive === true) {
              if (xpositive === true) {
                vlabel[h][i][j] = 'A';
              } else {
                vlabel[h][i][j] = 'B';
              }
            } else if (xpositive === false) {
              vlabel[h][i][j] = 'C';
            } else {
              vlabel[h][i][j] = 'D';
            }
          }
        }
      }
      for (h = 0; h <= 30; h++) {
        for (i = 1; i <= 79; i++) {
          for (j = 1; j <= 59; j++) {
            var counts = {
              A: 0,
              B: 0,
              C: 0,
              D: 0
            };
            var num = 0;
            for (var i1 = -1; i1 <= 1; i1 = i1 + 2) {
              for (var j1 = -1; j1 <= 1; j1 = j1 + 2) {
                switch (vlabel[h][i + i1][j + j1]) {
                  case 'A':
                    counts.A++;
                    break;
                  case 'B':
                    counts.B++;
                    break;
                  case 'C':
                    counts.C++;
                    break;
                  case 'D':
                    counts.D++;
                    break;
                }
              }
            }
            //console.log(counts);
            if (counts.A > 0) {
              num++;
            }
            if (counts.B > 0) {
              num++;
            }
            if (counts.C > 0) {
              num++;
            }
            if (counts.D > 0) {
              num++;
            }
            if (num >= 3) {
              vorcan[h][i][j] = true;
            } else {
              vorcan[h][i][j] = false;
            }
          }
        }
      }
      //console.log(vorcan);
      return vorcan;
    };
    detectvotexcandidate(u, v);

    //function of calculate the number of vorcan or vor
    var numberofvor = function(vor) {
      var number = 0;
      for (h = 0; h <= 30; h++) {
        for (i = 0; i <= 79; i++) {
          for (j = 0; j <= 59; j++) {
            if (vor[h][i][j] === true) {
              number++;
            }
          }
        }
      }
      console.log("number of vortex candidate = " + number);
      return number;
    };
    numberofvor(vorcan);

    //function of cleanup
    //--------------to compute velocity gradient tensor
    // set dv/dx equals to v(x+1)-v(x).not take 1/2
    var cleanupvorcan = function(vorcan) {
      for (h = 1; h <= 29; h++) {
        for (i = 1; i <= 79; i++) {
          for (j = 1; j <= 59; j++) {
            if (vorcan[h][i][j] === true) {
              var v12, v13, v21, v23, v31, v32;
              v12 = u[0][0][0][h][i + 1][j] - u[0][0][0][h][i][j]; //u(y+1)-u(y)
              v13 = u[0][0][0][h + 1][i][j] - u[0][0][0][h][i][j]; //u(z+1)-u(z)
              v21 = v[0][0][0][h][i][j + 1] - v[0][0][0][h][i][j];
              v23 = v[0][0][0][h + 1][i][j] - v[0][0][0][h][i][j];
              v31 = w[0][0][0][h][i][j + 1] - w[0][0][0][h][i][j];
              v32 = w[0][0][0][h][i + 1][j] - w[0][0][0][h][i][j];
              var delta, Q, R;
              Q = -v12 * v21 - v23 * v32 - v13 * v31; //should times 1/2??
              R = v12 * v23 * v31 + v21 * v13 * v32;
              if (Q * Q * Q / 27 + R * R / 4 > 0) vor[h][i][j] = true;
            }
          }
        }
      }
      return vor;
    };
    cleanupvorcan(vorcan);
    //after cleanup
    console.log("after cleanup:");
    numberofvor(vor);

    //function of get the exact point of vor
    var getpointofvor = function(vor) {
      var point = []; //[(x0,y0,z0),...]
      for (h = 1; h <= 29; h++) {
        for (i = 1; i <= 79; i++) {
          for (j = 1; j <= 59; j++) {
            if (vor[h][i][j] === true) {
              point.push([
                0.1 * j + 141, 0.1 * i + 35, u[0][2][h]
              ]);
            }
          }
        }
      }
      return point;
    };

    drawMap(u[0][4], u[0][3], u[0][0][0][0], v[0][0][0][0], vor[1]);

    //goest to 3D
    //notice first about z , u[0][2]+([0] to [30]) contains the depth of z for different indoex
    threedinterpolate = function(xx, yy, zz) {
      // 0<=x<=61,0<=y<=81,0<=z_index<=30
      // 141<=xx<=147,35<=yy<=43
      // 0.5[0]<zz<820[30]
      /*
(x3,y3,z3)      (x2,y2,z2)          (-1,1,-1)            (1,1,-1)

   (x,y,z)             <==>         (p,q,r)


(x0,y0,z0)      (x1,y1,z1)          (-1,-1,-1)           (1,,-1,-1)


(x6,y6,z6)      (x7,y7,z7)          (-1,1,1)            (1,1,1)

              <==>


(x4,y4,z4)      (x5,y5,z5)          (-1,-1,1)           (1,,-1,1)


(x,y,z)is between  plane[((x0,y0,z0),(x1,y1,z1),(x2,y2,z2)] (below)
       and     plane[((x4,y4,z),(x5,y5,z5),(x6,y6,z6)] (above)

*/
      var x, x0, y, y0, z, z0, z1, z_index, p, q, r;
      z_index = -1;
      x = (xx - 141) * 10;
      y = (yy - 35) * 10;
      z = zz;
      for (var item in u[0][2]) {
        if (zz < u[0][2][item]) {
          break;
        } //z_index is not number?
        z_index = z_index + 1;
        z0 = u[0][2][z_index];
      }
      x0 = Math.floor(x);
      y0 = Math.floor(y);
      z1 = u[0][2][z_index + 1];
      p = 2 * x - x0 - (x0 + 1);
      q = 2 * y - y0 - (y0 + 1);
      r = (2 * z - z0 - z1) / (z1 - z0);
      //calculate S using p,q,r and S0`S7
      var pk = [-1, 1, 1, -1, -1, 1, 1, -1];
      var qk = [-1, -1, 1, 1, -1, -1, 1, 1];
      var rk = [-1, -1, -1, -1, 1, 1, 1, 1];
      var _u = u[0][0][0], _v = v[0][0][0], _w = w[0][0][0];

      // TODO: z_index,x0,y0の値と緯度経度の範囲だけで決めて、ループ減らす
      for (var valNum = 2; valNum >= 0; valNum--) {
        var val = [_u, _v, _w][valNum];
        if (typeof val == 'undefined') return undefined;
        for (var i = 1; i >= 0; i--) {
          if (typeof val[z_index + i] == 'undefined') return undefined;
          for (var j = 1; j >= 0; j--) {
            if (typeof val[z_index + i][y0 + j] == 'undefined') return undefined;
            for (var k = 1; k >= 0; k-- ) {
              if (typeof val[z_index + i][y0 + j][x0 + k] == 'undefined') return undefined;

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
      _wList = _wList.map(function(x) { return x * 100000; });
      var vx = 0, vy = 0, vz = 0;
      for (i = 0; i < pk.length; i++) {
        vx += 0.125 * (1 + pk[i] * p) * (1 + qk[i] * q) * (1 + rk[i] * r) * _uList[i];
        vy += 0.125 * (1 + pk[i] * p) * (1 + qk[i] * q) * (1 + rk[i] * r) * _vList[i];
        vz += 0.125 * (1 + pk[i] * p) * (1 + qk[i] * q) * (1 + rk[i] * r) * _wList[i];
      }
      return [vx, vy, vz]; //
    };
    //threedinterpolate(143,38,60);

    threedstreamline = function(x, y, z, n, deltaT) {
      //141<=x<=147,35<=y<=43,0<=z_index<=30,0.5[0]<zz<820[30]
      var k1, k2, k3, k4;
      var points = [[x, y, z]];
      for (var i = 0; i < n; i++) {
        k1 = threedinterpolate(x, y, z); //x direction
        if (!k1) break;
        k2 = threedinterpolate((x + k1[0] * deltaT / 2), (y + k1[1] * deltaT / 2), (z + k1[2] * deltaT / 2));
        if (!k2) break;
        k3 = threedinterpolate((x + k2[0] * deltaT / 2), (y + k2[1] * deltaT / 2), (z + k2[2] * deltaT / 2));
        if (!k3) break;
        k4 = threedinterpolate((x + k3[0] * deltaT), (y + k3[1] * deltaT), (z + k3[2] * deltaT));
        if (!k4) break;
        x = x + deltaT / 6.0 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
        y = y + deltaT / 6.0 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
        z = z + deltaT / 6.0 * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]);
        if (z > 500 || z < 10) {
          break;
        }
        points.push([x, y, z]);
      }
      return (points);
    };
    pointsofvor = getpointofvor(vor);

    // 重いので描画数を制限する
    for (var i = pointsofvor.length - 1; i >= 0; i--) {
      var p = pointsofvor[i];
      if (p[0] > 142 && p[0] < 143 && p[1] > 36 && p[1] < 37 && p[2] > 50 && p[2] < 300) {
        var tmpStreamLine = threedstreamline(p[0] + 0.1, p[1] + 0.1, p[2] + 0.1, 2000, 0.01);
        if (tmpStreamLine) {
          draw3DStreamline(tmpStreamLine);
          break;
        }
      }

    }
  });
});
