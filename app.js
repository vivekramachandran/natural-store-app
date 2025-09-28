// ----------------------
// Start scanner
// ----------------------
function startScanner() {
    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector('#scanner-container'),
            constraints: {
                facingMode: "environment", // back camera
                width: { min: 640 },
                height: { min: 480 }
            },
        },
        decoder: {
            readers: ["ean_reader"], // EAN-13 barcode
            multiple: false
        },
        locate: true,
        locator: {
            patchSize: "medium",
            halfSample: true
        }
    }, function(err) {
        if (err) {
            console.error(err);
            alert("Camera initialization failed. Check permissions and HTTPS.");
            return;
        }
        Quagga.start();
        document.getElementById('scanResult').innerText = "Scanning... align barcode inside the red box.";
    });

    // --------------------
    // On detected barcode
    // --------------------
    Quagga.onDetected(function(result) {
        const code = result.codeResult.code;
        document.getElementById('scanResult').innerText = "Barcode detected: " + code;
        Quagga.stop();
    });

    // --------------------
    // Processed overlay (clean, no dancing rectangles)
    // --------------------
    Quagga.onProcessed(function(result) {
        const drawingCtx = Quagga.canvas.ctx.overlay;
        const drawingCanvas = Quagga.canvas.dom.overlay;
        if (result) {
            drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);

            // Optional: only draw main detected box (blue)
            if (result.box) {
                Quagga.ImageDebug.drawPath(result.box, {x:0,y:1}, drawingCtx, {color: "#00F", lineWidth: 2});
            }

            // Comment out everything below to remove green candidate boxes
            // if (result.boxes) {
            //     result.boxes.filter(b => b !== result.box).forEach(box => {
            //         Quagga.ImageDebug.drawPath(box, {x:0,y:1}, drawingCtx, {color: "green", lineWidth: 2});
            //     });
            // }
        }
    });
}
