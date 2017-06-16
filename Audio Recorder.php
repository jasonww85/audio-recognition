<!DOCTYPE html>
<!-- demo for audio processing -->
<html>
	<head><meta http-equiv="Content-Type" content="text/html; charset=GBK">
	<meta name="viewport" content="width=device-width,initial-scale=1">
	<link rel="stylesheet" type="text/css" href="./style/mystyle.css">
	
	<title>Audio Recorder</title>

	<script src="js/audiodisplay.js"></script>
	<script src="js/recorder.js"></script>
	<script src="js/main.js"></script>
	<script src="lib/Highcharts-5.0.11/code/highcharts.js"></script>
	<script src="lib/Highcharts-5.0.11/code/modules/exporting.js"></script>
	<script src="js/datahandle.js"></script>
	<script src="lib/jquery-3.2.1.min.js"></script>
</head>
<body>
<div width="90%">

	<canvas id="analyser" class="viewer" ></canvas>

	<div id="view2" class="viewer"></div>
	<div id="view3" class="viewer"></div>
</div>

<div id="controls">
	<img id="record" src="./res/mic128.png" onclick="toggleRecording(this);" class="">
	<a id="save"><img src="./res/save.svg"></a>
	<img id="load" src="./res/reload.png" onclick="loadFile(this);">
	<?php
		echo '<select id="recording">';
		foreach(glob('res/*.wav') as $file) {
		    echo '<option value="'.$file. '">';
		    echo $file;
		    #$filename = explode('/', $string)[-1];
		    #echo $filename;
		    echo '</option>';
		}
		echo '</select>';

	?>

	<a id="save_freq" >download frequency</a>

	<p>fft-size: <input type="number" id="fft"/> 	
	</br>band-filter: <input type="number" id="lowbd">  <input type="number" id="hibd" >
	</br>power-threshold: <input type="number" id="thr"> </p>
</div>


</body></html>