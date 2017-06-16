/* This is for data handling */


var ajaxUrl = 'http://localhost:8080', socketUrl = 'ws://localhost:8080';

/*utility function*/
var staticCnt = (function() {
   var id = 0;
   return function() { return id++; };  // Return and increment
})();


/************ for hicharts plot ************/
var optionV2 = {
    chart: {
        renderTo: 'view2',
    },
    title:{
        text: 'features'
    },
    series: [{
        name: 'power(/10)',
        data: []
    },
    {
        name: 'center-freq',
        data: []
    },
    {
        name: 'Q of center-freq',
        data: []
    }]
};

var optionV3 = {
    chart: {
        renderTo: 'view3',
    },
    title:{
        text: 'classification'
    },
    series: [{
        name: 'cluster',
        type: 'column',
        stacking: 'normal',
        pointWidth: 0.5,
        data: []
    }]
};

/**********  for network transfer **************/

/*ajax server:  absolete*/
function postDataAjax(str) {
  $.ajax({
    type: "POST",
    url: ajaxUrl,
    data: str,
    contentType:'text/plain',
    //dataType: "jsonp",
    success: ajaxSuccessNewData,
    error: ajaxFailed
  });
}

function ajaxSuccessNewData(result) {
  //console.log("success: " + result);
}

function ajaxFailed(result) {
  if (result.status == 200 && result.statusText == "OK") {
    console.log("failed but net packets ok?");
    //branchDetailsSuccess(result.responseText);
  }
  else {
    console.log("failed : " + result);
  }
}


/*websock server:  absolete*/
const webSock = new WebSocket(socketUrl);
webSock.onopen = function(){
    console.log("websocket opened!");
}

webSock.onmessage = function(event){
    msg = event.data.split(',')
    x = seqPos[parseInt(msg[0])]
    y = parseInt(msg[1])
    chart3.series[0].addPoint([x,y],false,0);
}

function postData(str){
    webSock.send(str);
}


var isNeedDown = 1;  //obsolete
var freqRecord = ""; //obsolete

function extrFeatures( freqs ){
    // data-processing in python-server
    var i = 0, j = 0, centerFreq = 0;
    var power = 0, principle = 0, center = 0, Q = 0;

    var freqsA = new Array(256);
    var mul = freqs.length / 256;
    for(i = 0; i < 256; i++){
        for(j =0; j<mul; j++)3.
            freqsA[i] = freqs[i*mul + j];
    }

    // loop in FSM, window
    // vltSize: the window size that tolerate violate
    for(i = 0; i < freqs.length; i++){
        power += freqs[i];
        if(freqs[i] > centerFreq){
            centerFreq = freqs[i];
            center = i;
        }
    }
    
    j = staticCnt();
    if(j<100000 && power > thrSet.value)
    {
        data = seqId+"," +power+" " +principle+" " +center+" " +Q+";" ;
        postData(data); // send to data server for handling
        freqRecord += seqId + ' ' + freqsA.join(' ') + ";"
    }
    else if(j>1000 && isNeedDown)
    {
        var save_freq=document.getElementById("save_freq");
        var fblob = new Blob([freqRecord], { type: "text" });
        var furl = (window.URL || window.webkitURL).createObjectURL(fblob);    
        save_freq.href = furl;
        save_freq.download = 'down_freq'; 
        isNeedDown = 0;   
        console.warn("down");
    }

    
    return {"power":power, "principle":principle, "center":center, "Q":Q};
}
