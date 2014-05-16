function load(url) {
  var deferred = $.Deferred();
  loadData(url, function(data) {
    deferred.resolve(data);
  });
  return deferred;
}
var interpolate, streamline;
$(function() {
  $.when(load('u.dods'), load('v.dods'), load('w.dods')).done(function(u, v, w) {
    var h; //z
    var i; //y
    var j; //x
    var xpositive; // true of fasle
    var ypositive;
    var vlabel = [];
    var vorcan = []; //if is vortice candidate,true for this (z,y,x)
    var vor = [];
    var i1, j1;
    //create a function number of DifferentElement of a one rank array.
    var NumberofDifferentElement = function(array) {
      var counter = array.length;
      for (var i = 1; i < array.length; i++) {
        for (var j = 0; j < i; j++) {
          if (array[j] === array[i]) {
            counter--;
            break;
          }
        }
      }
      return counter;
    };
    var counter; //if counter>=3, vorcan
    for (h = 0; h <= 30; h++) {
      vlabel[h] = [];
      vorcan[h] = [];
      vor[h] = [];
      for (i = 0; i <= 80; i++) {
        vlabel[h][i] = [];
        vorcan[h][i] = [];
        vor[h][i] = [];
        for (j = 0; j <= 60; j++) {
          vlabel[h][i][j] = 0;
          vorcan[h][i][j] = false; // no vorcan at first
          vor[h][i][j] = false;
        }
      }
    }
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
          for (i1 = -1; i1 <= 1; i1 = i1 + 2) {
            for (j1 = -1; j1 <= 1; j1 = j1 + 2) {
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
    var numberofvorcan = 0;
    for (i = 0; i <= 79; i++) {
      for (j = 0; j <= 59; j++) {
        if (vorcan[1][i][j] === true) {
          numberofvorcan++;
        }
      }
    }
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
    var numberofvor = 0;
    for (i = 0; i <= 79; i++) {
      for (j = 0; j <= 59; j++) {
        if (vor[1][i][j] === true) {
          numberofvor++;
        }
      }
    }
    interpolate = function(xx, yy) { //del 0<=x<=61,0<=y<=81
      var p, q, x, y, x0, y0, x1, y1, x2, y2, x3, y3; //0<=x0<=60,0<=y0<=80
      x = (xx - 141) * 10;
      y = (yy - 35) * 10;
      x0 = Math.floor(x);
      y0 = Math.floor(y);
      x1 = x0 + 1;
      y1 = y0;
      x2 = x0 + 1;
      y2 = y0 + 1;
      x3 = x0;
      y3 = y0 + 1;
      p = 2 * (x - x0) - 1;
      q = 2 * (y - y0) - 1;
      var vx = 0.25 * (1 - p) * (1 - q) * u[0][0][0][1][y0][x0] + 0.25 * (1 + p) * (1 - q) * u[0][0][0][1][y1][x1] + 0.25 * (1 + p) * (1 + q) * u[0][0][0][1][y2][x2] + 0.25 * (1 - p) * (1 + q) * u[0][0][0][1][y3][x3];
      var vy = 0.25 * (1 - p) * (1 - q) * v[0][0][0][1][y0][x0] + 0.25 * (1 + p) * (1 - q) * v[0][0][0][1][y1][x1] + 0.25 * (1 + p) * (1 + q) * v[0][0][0][1][y2][x2] + 0.25 * (1 - p) * (1 + q) * v[0][0][0][1][y3][x3];
      return [vx, vy];
    };
    streamline = function(x0, y0, n, deltaT) {
      var k1 = [],
        k2 = [],
        k3 = [],
        k4 = [];
      var points = [
        [x0, y0]
      ];
      for (var i = 0; i < n; i++) {
        k1[0] = (interpolate(x0, y0))[0]; //x direction
        k1[1] = (interpolate(x0, y0))[1]; //y direction
        k2[0] = (interpolate((x0 + k1[0] * deltaT / 2), (y0 + k1[1] * deltaT / 2)))[0];
        k2[1] = (interpolate((x0 + k1[0] * deltaT / 2), (y0 + k1[1] * deltaT / 2)))[1];
        k3[0] = (interpolate((x0 + k2[0] * deltaT / 2), (y0 + k2[1] * deltaT / 2)))[0];
        k3[1] = (interpolate((x0 + k2[0] * deltaT / 2), (y0 + k2[1] * deltaT / 2)))[1];
        k4[0] = (interpolate((x0 + k3[0] * deltaT), (y0 + k3[1] * deltaT)))[0];
        k4[1] = (interpolate((x0 + k3[0] * deltaT), (y0 + k3[1] * deltaT)))[1];
        x0 = x0 + deltaT / 6.0 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
        y0 = y0 + deltaT / 6.0 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
        points.push([x0, y0]);
      }
      return (points);
    };

    drawStreamline(streamline(144, 38, 20, 0.01));
    drawMap(u[0][4], u[0][3], u[0][0][0][0], v[0][0][0][0], vor[1]);
  });
});
