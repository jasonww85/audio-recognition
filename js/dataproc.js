
var save_freq=document.getElementById("save_freq");
var fblob = new Blob([data], { type: "text" });
var furl = (window.URL || window.webkitURL).createObjectURL(fblob);
save_freq.href = furl;
save_freq.download = 'down_freq';