let codeReader;

function startScanner() {
    const video = document.getElementById('video');
    const overlay = document.getElementById('overlay');
    overlay.width = video.clientWidth;
    overlay.height = video.clientHeight;
    const ctx = overlay.getContext('2d');

    codeReader = new ZXing.BrowserMultiFormatReader();

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    .then(stream => {
        video.srcObject = stream;

        codeReader.decodeFromVideoDevice(null, video, (result, err) => {
            ctx.clearRect(0, 0, overlay.width, overlay.height);

            if (result) {
                const points = result.resultPoints;
                if (points && points.length > 1) {
                    ctx.strokeStyle = 'lime';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(points[0].x, points[0].y);
                    for (let i = 1; i < points.length; i++) {
                        ctx.lineTo(points[i].x, points[i].y);
                    }
                    ctx.closePath();
                    ctx.stroke();
                }

                const code = result.text;
                document.getElementById('scanResult').innerText = "Barcode detected: " + code;

                // Stop scanner
                codeReader.reset();
                video.srcObject.getTracks().forEach(track => track.stop());
            } else if (err && !(err.name === 'NotFoundException')) {
                console.error(err);
            }
        });
    })
    .catch(err => {
        console.error(err);
        alert('Cannot access camera. Make sure permissions are allowed and using HTTPS.');
    });
}
