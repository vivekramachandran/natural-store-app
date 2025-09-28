<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Barcode Scanner with Guide Box</title>
<style>
  body { font-family: Arial, sans-serif; margin: 0; display: flex; flex-direction: column; align-items: center; }
  h1 { margin-top: 20px; }
  #scanner-container {
    width: 100vw;
    height: 70vh;
    position: relative;
    border: 2px solid #ccc;
  }
  #scanner-container canvas,
  #scanner-container video {
    width: 100% !important;
    height: 100% !important;
  }
  #guide-box {
    position: absolute;
    top: 50%; left: 50%;
    width: 60%; height: 30%;
    border: 3px dashed red;
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 10;
  }
  #scanResult { font-weight: bold; margin: 20px 0; }
  button { padding: 12px 24px; margin-bottom: 20px; cursor: pointer; font-size: 16px; }
</style>
</head>
<body>
<h1>Barcode Scanner with Guide</h1>

<div id="scanner-container">
  <div id="guide-box"></div>
</div>

<p id="scanResult">No barcode detected yet.</p>
<button onclick="startScanner()">Start Scanner</button>

<script src="https://cdnjs.cloudflare.com/ajax/libs/quagga/0.12.1/quagga.min.js"></script>
<script src="app.js"></script>
</body>
</html>
