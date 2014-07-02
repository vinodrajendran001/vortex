function getSeedPoints(lonList, latList, depthList, u, v, w) {
  var depthListLength = depthList.length,
      latListLength = latList.length,
      lonListLength = lonList.length;

  var singularPoints = [];
  (function () {
    var upsilon = 0.4;
    for (var depIdx = 0; depIdx < depthListLength; depIdx++) {
      for (var latIdx = 0; latIdx < latListLength; latIdx++) {
        for (var lonIdx = 0; lonIdx < lonListLength; lonIdx++) {
          if (Math.abs(u[depIdx][latIdx][lonIdx]) < upsilon
           && Math.abs(v[depIdx][latIdx][lonIdx]) < upsilon
           // && Math.abs(w[depIdx][latIdx][lonIdx]) < upsilon
           ) {
            var sp = {
              "depIdx": depIdx,
              "latIdx": latIdx,
              "lonIdx": lonIdx
            };
            singularPoints.push(sp);
          }
        }
      }
    }
    console.log("num of singularPoints: " + singularPoints.length);
  })();

  var seedPoints = [];
  (function () {
    var IGNORE_VALUE = -999000000;
    var dx, dy, dz;
    var _u, _v, _w;
    var v00, v01, v02,
        v10, v11, v12,
        v20, v21, v22;
    var a, b, c;
    var D;
    singularPoints.forEach(function (sp) {
      depIdx = sp.depIdx;
      latIdx = sp.latIdx;
      lonIdx = sp.lonIdx;

      // TODO: 計算できるかどうかの条件が糞なので直す
      if (depIdx < depthListLength - 1
       && lonIdx < lonListLength - 1
       && latIdx < latListLength - 1) {
        var computable = true;
        for (var i = 0; i <= 2; i++) {
          dx = 0, dy = 0, dz = 0;
          switch (i) {
            case 0: dx = 1; break;
            case 1: dy = 1; break;
            case 2: dz = 1; break;
          }
          if (u[depIdx + dz][latIdx + dy][lonIdx + dx] == IGNORE_VALUE
           || v[depIdx + dz][latIdx + dy][lonIdx + dx] == IGNORE_VALUE
           || w[depIdx + dz][latIdx + dy][lonIdx + dx] == IGNORE_VALUE) {
            computable = false;
            break;
          }
        }

        if (computable) {
          _u = u[depIdx][latIdx][lonIdx];
          _v = v[depIdx][latIdx][lonIdx];
          _w = w[depIdx][latIdx][lonIdx];

          // matrix
          // |v00 v01 v02|
          // |v10 v11 v12|
          // |v20 v21 v22|
          v00 = u[depIdx][latIdx][lonIdx + 1] - _u;
          v01 = u[depIdx][latIdx + 1][lonIdx] - _u;
          v02 = u[depIdx + 1][latIdx][lonIdx] - _u;
          v10 = v[depIdx][latIdx][lonIdx + 1] - _v;
          v11 = v[depIdx][latIdx + 1][lonIdx] - _v;
          v12 = v[depIdx + 1][latIdx][lonIdx] - _v;
          v20 = w[depIdx][latIdx][lonIdx + 1] - _w;
          v21 = w[depIdx][latIdx + 1][lonIdx] - _w;
          v22 = w[depIdx + 1][latIdx][lonIdx] - _w;

          // characteristic equation
          // x^3 + ax^2 + bx + c = 0
          a = - v00 - v11 - v22;
          b = v00 * v11 - v10 * v01 +
              v11 * v22 - v21 * v12 +
              v22 * v00 - v02 * v20;
          c = - v00 * v11 * v22 +
                v02 * v11 * v20 +
                v00 * v12 * v21 +
                v22 * v01 * v10;

          // discriminant
          // D = -4a^3c + a^2b^2 + 18abc - 4b^3 - 27c^2
          D = - 4 * Math.pow(a, 3) * c
              + Math.pow(a, 2) * Math.pow(b, 2)
              + 18 * a * b * c
              - 4 * Math.pow(b, 3)
              - 27 * Math.pow(c, 2);

          if ( D < 0 ) {
            seedPoints.push({
              "lon": lonList[lonIdx],
              "lat": latList[latIdx],
              "depth": depthList[depIdx]
            });
          }
        }
      }
    });
    console.log("num of seedPoints: " + seedPoints.length);
  })();

  return seedPoints;
}