function startScanner() {
    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector('#scanner-container'),
            constraints: {
                facingMode: "environment", // back camera
                width: 640,
                height: 480
            },
        },
        decoder: {
            readers: ["ean_reader"] // EAN-13 barcode
        },
        locate: true
    }, function(err) {
        if (err) {
            console.error(err);
            alert("Camera initialization failed. Check permissions and HTTPS.");
            return;
        }
        Quagga.start();
        document.getElementById('scanResult').innerText = "Scanning... point camera at a barcode.";
    });

    Quagga.onDetected(function(result) {
        const code = result.codeResult.code;
        document.getElementById('scanResult').innerText = "Barcode detected: " + code;
        Quagga.stop();
    });

    Quagga.onProcessed(function(result) {
        // Optional: overlay drawing
        const drawingCtx = Quagga.canvas.ctx.overlay;
        const drawingCanvas = Quagga.canvas.dom.overlay;
        if (result) {
            drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
            if (result.boxes) {
                result.boxes.filter(b => b !== result.box).forEach(box => {
                    Quagga.ImageDebug.drawPath(box, {x:0,y:1}, drawingCtx, {color: "green", lineWidth: 2});
                });
            }
            if (result.box) {
                Quagga.ImageDebug.drawPath(result.box, {x:0,y:1}, drawingCtx, {color: "#00F", lineWidth: 2});
            }
        }
    });
}
