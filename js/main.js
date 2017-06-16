/* Copyright 2013 Chris Wilson

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

window.AudioContext = window.AudioContext || window.webkitAudioContext;

var audioContext = new AudioContext();
var audioInput = null,
    inputPoint = null,
    audioRecorder = null;
var rafID = null;
var analyserContext = null, analyserNode = null;
var canvasWidth, canvasHeight;
var recIndex = 0, seqId = 0;

var biFilter;

var DEF_FFT = 4096, DEF_THR = 20000, DEF_LOWBD = 0, DEF_HIBD = 20000; //now empirical, should come from learning
var chart2 = null, chart3 = null; 
var fftSet = null, lowbdSet = null, hibdSet = null, thrSet = null;
var isGap=0, seqPos=[0]

/* TODO:
- offer mono option
- "Monitor input" switch
*/

/* New option: load audio file*/
function loadFile(e){
    audioContext.close(); // can't remove sourceStream in elegant way!
    audioContext = new AudioContext();

    var source = audioContext.createBufferSource();
    var request = new XMLHttpRequest();
    file = document.getElementById('recording').value;

    request.open('GET', file, true);
    request.responseType = 'arraybuffer';

    request.onload = function() {
            analyserNode  = audioContext.createAnalyser();
            analyserNode.fftSize = fftSet.value; 

            var audioData = request.response;

            audioContext.decodeAudioData(audioData, function(buffer) {
            source.buffer = buffer;
            source.connect(analyserNode);
            source.connect(audioContext.destination);
            source.loop = false;
            source.start(0);
        },

        function(e){ console.log("Error with decoding audio data" + e.err); });
    }
    request.send();

}



function saveAudio() {
    audioRecorder.exportWAV( doneEncoding );
    // could get mono instead by saying
    // audioRecorder.exportMonoWAV( doneEncoding );
}

function gotBuffers( buffers ) {
    /*
    var canvas = document.getElementById( "wavedisplay" );
    drawBuffer( canvas.width, canvas.height, canvas.getContext('2d'), buffers[0] );
    */
    // the ONLY time gotBuffers is called is right after a new recording is completed - 
    // so here's where we should set up the download.
    audioRecorder.exportWAV( doneEncoding );
}

function doneEncoding( blob ) {
    Recorder.setupDownload( blob, "myRecording" + ((recIndex<10)?"0":"") + recIndex + ".wav" );
    recIndex++;
}

function toggleRecording( e ) {
    if (e.classList.contains("recording")) {
        // stop recording
        audioRecorder.stop();
        e.classList.remove("recording");
        audioRecorder.getBuffers( gotBuffers );
    } else {
        // start recording
        if (!audioRecorder)
            return;
        e.classList.add("recording");
        audioRecorder.clear();
        audioRecorder.record();
    }
}

function convertToMono( input ) {
    var splitter = audioContext.createChannelSplitter(2);
    var merger = audioContext.createChannelMerger(2);

    input.connect( splitter );
    splitter.connect( merger, 0, 0 );
    splitter.connect( merger, 0, 1 );
    return merger;
}

function cancelAnalyserUpdates() {
    window.cancelAnimationFrame( rafID );
    rafID = null;
}

function updateAnalysers(time) {
    if (!analyserContext) {
        var canvas = document.getElementById("analyser");
        canvasWidth = canvas.width;
        canvasHeight = canvas.height;
        analyserContext = canvas.getContext('2d');
    }

    // analyzer draw code here
    {
        // bar: canvas vision;  bin: fft data-array; 
        var SPACING = 3;
        var BAR_WIDTH = 1;
        var freqPerBin = 24 * 1024 / analyserNode.frequencyBinCount;
        var numBars = Math.round(canvasWidth / SPACING);
        var freqByteData = new Uint8Array(analyserNode.frequencyBinCount);
        var features = null;

        analyserNode.getByteFrequencyData(freqByteData); 

        analyserContext.clearRect(0, 0, canvasWidth, canvasHeight);
        analyserContext.fillStyle = '#F6D565';
        analyserContext.lineCap = 'round';
        var multiplier = analyserNode.frequencyBinCount / numBars;

        // Draw rectangle for each frequency bar.
        for (var i = 0; i < numBars; ++i) {
            var magnitude = 0;
            var offset = Math.floor( i * multiplier );

            // 1. band filter  2. sum/average and plot
            for (var j = 0; j< multiplier; j++){
                if(freqPerBin*(offset+j) < lowbdSet.value || freqPerBin*(offset+j) > hibdSet.value)
                    freqByteData[offset + j] = 0;
                else
                    magnitude += freqByteData[offset + j];
            }
            magnitude = magnitude / multiplier;
            analyserContext.fillStyle = "hsl( " + Math.round((i*360)/numBars) + ", 100%, 50%)";
            analyserContext.fillRect(i * SPACING, canvasHeight, BAR_WIDTH, -magnitude);
        }
        features = extrFeatures(freqByteData);
        if(features.power > thrSet.value)
        {
            chart2.series[0].addPoint(features.power/10,false,0);
            chart2.series[1].addPoint(features.center * freqPerBin,false,0);
            isGap = 1           
        }
        else if(isGap)
        {
            chart2.series[0].addPoint(0,false,0);
            chart2.series[1].addPoint(0,false,0);
            chart2.series[0].addPoint(0,false,0);
            chart2.series[1].addPoint(0,false,0);
            chart2.series[0].addPoint(0,false,0);
            chart2.series[1].addPoint(0,false,0);
            cmin = Math.max(0, chart2.series[0].xData.length-200);
            cmax = chart2.series[0].xData.length;
            chart2.xAxis[0].setExtremes(cmin, cmax);
            chart3.xAxis[0].setExtremes(cmin, cmax);
            isGap = 0 
            seqId ++
            seqPos[seqId] = chart2.series[0].xData.length
        }
    }
    setTimeout(updateAnalysers, fftSet.value / (48 * 8));
    //rafID = window.requestAnimationFrame( updateAnalysers );
}


function gotStream(stream) {
	analyserNode  = audioContext.createAnalyser();
    analyserNode.fftSize = fftSet.value; 

	biFilter = audioContext.createBiquadFilter();
	// input ==>  
	//			--> <fft>(show) --> stat (show)

    audioInput = audioContext.createMediaStreamSource(stream);
	audioInput.connect(biFilter);
    biFilter.connect(audioContext.destination);
	
    audioInput.connect(analyserNode);
	
    audioRecorder = new Recorder( audioInput );
    updateAnalysers();
}

function initAudio() {
        if (!navigator.getUserMedia)
            navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        if (!navigator.cancelAnimationFrame)
            navigator.cancelAnimationFrame = navigator.webkitCancelAnimationFrame || navigator.mozCancelAnimationFrame;
        if (!navigator.requestAnimationFrame)
            navigator.requestAnimationFrame = navigator.webkitRequestAnimationFrame || navigator.mozRequestAnimationFrame;

    navigator.getUserMedia(
        {
            "audio": {
                "mandatory": {
                    "googEchoCancellation": "false",
                    "googAutoGainControl": "false",
                    "googNoiseSuppression": "false",
                    "googHighpassFilter": "false"
                },
                "optional": []
            },
        }, gotStream, function(e) {
            alert('Error getting audio');
            console.log(e);
        });

    chart2 = new Highcharts.Chart(optionV2);
    chart3 = new Highcharts.Chart(optionV3);  

    fftSet = document.getElementById("fft");
    fftSet.value = DEF_FFT;
    fftSet.onchange = function(){analyserNode.fftSize = fftSet.value};

    lowbdSet = document.getElementById("lowbd");  
    hibdSet = document.getElementById("hibd");  
    lowbdSet.value = DEF_LOWBD;
    hibdSet.value = DEF_HIBD;

    thrSet = document.getElementById("thr");  
    thrSet.value = DEF_THR;
}

window.addEventListener('load', initAudio );
