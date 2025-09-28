// ----------------------
// Check permissions first
// ----------------------
async function checkCameraPermissions() {
    try {
        // Check if we're on HTTPS or localhost
        if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
            throw new Error('HTTPS required for camera access');
        }
        
        // Request camera permission explicitly
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        
        // Stop the test stream immediately
        stream.getTracks().forEach(track => track.stop());
        
        return true;
    } catch (err) {
        console.error('Permission check failed:', err);
        return false;
    }
}

// ----------------------
// Start scanner
// ----------------------
async function startScanner() {
    // Check permissions first
    document.getElementById('scanResult').innerText = "Checking camera permissions...";
    
    const hasPermission = await checkCameraPermissions();
    if (!hasPermission) {
        document.getElementById('scanResult').innerHTML = `
            <span style="color: red;">❌ Camera access denied or not available<br><br>
            <strong>Please:</strong><br>
            1. Make sure you're using HTTPS (not HTTP)<br>
            2. Click the camera icon in your address bar and allow camera access<br>
            3. Try refreshing the page<br>
            4. Check browser settings for camera permissions</span>
        `;
        return;
    }
    
    document.getElementById('scanResult').innerText = "Initializing camera...";
    
    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector('#scanner-container'),
            constraints: {
                facingMode: "environment", // back camera
                width: { ideal: 640, min: 320 },
                height: { ideal: 480, min: 240 }
            },
        },
        decoder: {
            readers: [
                "ean_reader",           // EAN-13
                "ean_8_reader",         // EAN-8
                "code_128_reader",      // Code 128
                "code_39_reader",       // Code 39
                "code_93_reader",       // Code 93
                "codabar_reader"        // Codabar
            ],
            multiple: false
        },
        locate: true,
        locator: {
            patchSize: "medium",
            halfSample: true
        }
    }, function(err) {
        if (err) {
            console.error('QuaggaJS initialization error:', err);
            let errorMsg = '<span style="color: red;">❌ Camera initialization failed<br><br>';
            
            if (err.name === 'NotAllowedError') {
                errorMsg += '<strong>Camera permission denied!</strong><br><br>' +
                           '🔧 <strong>How to fix:</strong><br>' +
                           '1. Look for a camera icon in your address bar and click "Allow"<br>' +
                           '2. Make sure you\'re using HTTPS (secure connection)<br>' +
                           '3. Go to browser settings and enable camera for this site<br>' +
                           '4. Try refreshing the page and clicking "Allow" when prompted';
            } else if (err.name === 'NotFoundError') {
                errorMsg += '<strong>No camera found!</strong><br>' +
                           'Make sure your device has a camera connected.';
            } else if (err.name === 'NotReadableError') {
                errorMsg += '<strong>Camera is busy!</strong><br>' +
                           'Close other apps that might be using the camera.';
            } else {
                errorMsg += '<strong>Error:</strong> ' + err.message;
            }
            
            errorMsg += '</span>';
            document.getElementById('scanResult').innerHTML = errorMsg;
            return;
        }
        
        console.log('QuaggaJS initialized successfully');
        Quagga.start();
        document.getElementById('scanResult').innerText = "Scanning... align barcode inside the red box.";
    });

    // --------------------
    // On detected barcode
    // --------------------
    Quagga.onDetected(function(result) {
        const code = result.codeResult.code;
        const format = result.codeResult.format;
        
        console.log('Barcode detected:', code, 'Format:', format);
        
        // Show result
        document.getElementById('scanResult').innerHTML = `
            <span style="color: green;">✅ Barcode detected!<br>
            Code: <strong>${code}</strong><br>
            Format: ${format}</span>
        `;
        
        // Optional: Play beep sound
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.value = 800;
            oscillator.type = 'square';
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (e) {
            console.log('Could not play beep sound');
        }
        
        // Stop scanner after successful detection
        setTimeout(() => {
            Quagga.stop();
        }, 1000);
    });

    // --------------------
    // Processed overlay (clean, no dancing rectangles)
    // --------------------
    Quagga.onProcessed(function(result) {
        const drawingCtx = Quagga.canvas.ctx.overlay;
        const drawingCanvas = Quagga.canvas.dom.overlay;
        if (result && drawingCtx && drawingCanvas) {
            drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);

            // Optional: only draw main detected box (green when found)
            if (result.box) {
                drawingCtx.strokeStyle = result.codeResult ? '#00ff00' : '#ff0000';
                drawingCtx.lineWidth = 2;
                drawingCtx.beginPath();
                result.box.forEach((point, index) => {
                    if (index === 0) {
                        drawingCtx.moveTo(point[0], point[1]);
                    } else {
                        drawingCtx.lineTo(point[0], point[1]);
                    }
                });
                drawingCtx.closePath();
                drawingCtx.stroke();
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

// ----------------------
// Stop scanner (optional function)
// ----------------------
function stopScanner() {
    try {
        Quagga.stop();
        console.log('Scanner stopped');
        document.getElementById('scanResult').innerText = 'Scanner stopped. Click "Start Scanner" to scan again.';
    } catch (err) {
        console.error('Error stopping scanner:', err);
    }
}
