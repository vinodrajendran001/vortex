function load(url) {
  var deferred = $.Deferred();
  loadData(url, function(data) {
    deferred.resolve(data);
  });
  return deferred;
}


$(function() {
  $.when(load('u.dods'), load('v.dods'), load('w.dods'))
    .done(function(u, v, w) {
      var h; //z
      var i; //y
      var j; //x
      
      var xpositive;// if positive, equals 0
      var ypositive;
      var vlabel=[];
      var vorcan=[];//if is vortice candidate,0 for this (z,y,x)
     
      var i1,j1;
  
      
     /*
      //create a function number of DifferentElement of a one rank array.
      var NumberofDifferentElement=function(array){
      var counter=1;
      
      for (var i=1;i<array.length;i++){
      counter++;
      for (var j=0;j<i;j++){
      if(var array[j]===array[i-1]){
      counter--;
      break;
      }
      }
      }
      return counter;
      }
      */
      
      //console.log(NumberofDifferentElement['A','B','C']); 
      var counter;//if counter>=3, vorcan
      
      for(h=0;h<=30;h++){
      vlabel[h]=[];
      vorcan[h]=[];
      for(i=0;i<=80;i++){
      vlabel[h][i]=[];
      vorcan[h][i]=[];
      for(j=0;j<=60;j++){
      vlabel[h][i][j]=0;
      vorcan[h][i][j]=false; // no vorcan at first
      }
      }
      }
      //vlabel[0][0][1]=1;
      //console.log(vlabel[0][0][1]);
      //console.log(u[0][0][0][0][0]);
      //console.log(counter(vlabel));
      for(i=0;i<=80;i++){
      for(j=0;j<=60;j++){
      if(u[0][0][0][0][i][j]>0) xpositive=0;else xpositive=1;
      if(v[0][0][0][0][i][j]>0) ypositive=0;else ypositive=1;
      if(ypositive===0){
      if(xpositive===0){vlabel[0][i][j]='A';}
      else {vlabel[0][i][j]='B';}}
      else if(xpositive===1){vlabel[0][i][j]='C';}
      else {vlabel[0][i][j]='D';}
      }
      }
      
      /*
      for(i=1;i<=79;i++){
      for(j=1;j<=59;j++){
      var testarray=[vlabel[0][i+1][j+1],vlabel[0][i-1][j+1],vlabel[0][i+1][j-1],vlabel[0][i-1][j-1]];
      counter=NumberofDifferentElement(testarray);
      //console.log(testarray);
      //console.log(counter);
      if (counter>=3)
      { vorcan[0][i][j]=0;}else {vorcan[0][i][j]=1;}
      }}*/
      
      for (i=1;i<=79;i++){
      for(j=1;j<=59;j++){
     
      var counts={
      A:0,
      B:0,
      C:0,
      D:0
      }
      var num=0;
      
      for(i1=-1;i1<=1;i1=i1+2){
      for(j1=-1;j1<=1;j1=j1+2){
      switch (vlabel[0][i+i1][j+j1]){
      case 'A':
      counts.A++;
      break;
      case 'B':
      counts.B++;
      break
      case 'C':
      counts.C++;
      break;
      case 'D':
      counts.D++;
      break;
      }
      }}
      //console.log(counts);
    
      if(counts.A>0){num++;}
      if(counts.B>0){num++;}
      if(counts.C>0){num++;}
      if(counts.D>0){num++;}
      if(num>=3){vorcan[0][i][j]=true;}
      else{vorcan[0][i][j]=false;}
      //console.log(vorcan[0][i][j]);
      }}
      
      console.log(vorcan);
     // console.log(vlabel);// TODO
    //console.log(u, v, w);
    
      drawMap(u[0][4], u[0][3], u[0][0][0][0], v[0][0][0][0], vorcan[0]);
    });
});
