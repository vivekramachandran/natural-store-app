

// ----------------------
// 1. Supabase connection
// ----------------------
const supabaseUrl = 'https://fdfdxszvenmbdkmxkuej.supabase.co'; // your project URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkZmR4c3p2ZW5tYmRrbXhrdWVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMzY5MzIsImV4cCI6MjA3NDYxMjkzMn0.4p_cmxlPd8L0CY7PiWjbCZ1NZ0jQs-jI1W3tW_Vsi2A'; // your anon public key
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// --------------------
// Start scanner
// --------------------
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
      readers: ["ean_reader"] // EAN-13 barcodes
    },
    locate: true,
    locator: {
    patchSize: "medium", // try "large" if still fails
    halfSample: false
}
  }, function(err) {
    if (err) {
      console.error(err);
      alert("Camera not accessible. Make sure you allow camera permissions and are using HTTPS.");
      return;
    }
    Quagga.start();
  });

  Quagga.onDetected(async function(result) {
    const code = result.codeResult.code;
    document.getElementById('scanResult').innerText = "Barcode: " + code;
    Quagga.stop();
    await lookupProductByBarcode(code);
  });
  
Quagga.onProcessed(function(result) {
    let drawingCtx = Quagga.canvas.ctx.overlay;
    let drawingCanvas = Quagga.canvas.dom.overlay;
    
    if (result) {
        if (result.boxes) {
            drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
            result.boxes.filter(b => b !== result.box).forEach(function(box) {
                Quagga.ImageDebug.drawPath(box, {x:0,y:1}, drawingCtx, {color: "green", lineWidth: 2});
            });
        }
        if (result.box) {
            Quagga.ImageDebug.drawPath(result.box, {x:0,y:1}, drawingCtx, {color: "#00F", lineWidth: 2});
        }
        if (result.codeResult && result.codeResult.code) {
            console.log("Detected code:", result.codeResult.code);
        }
    }
});

  
}

// --------------------
// Lookup product by barcode
// --------------------
async function lookupProductByBarcode(barcode) {
  // Fetch main product
  let { data: mainProduct, error } = await supabase
    .from('products')
    .select('*')
    .eq('barcode', barcode)
    .single();

  if (error || !mainProduct) {
    alert("Product not found in database.");
    return;
  }

  displayMainProduct(mainProduct);

  // Fetch competitors
  const { data: competitors } = await supabase
    .from('competitors')
    .select('*')
    .eq('product_id', mainProduct.product_id);

  displayComparisonTable(mainProduct, competitors || []);
  displayIngredients(mainProduct, competitors || []);
}

// --------------------
// Display main product health
// --------------------
function displayMainProduct(product) {
  const container = document.getElementById('mainProduct');
  container.innerHTML = `
    <h2>Main Product: ${product.clean_name}</h2>
    <p><strong>Health Score:</strong> ${product.health_score} / 100</p>
    <p>${product.health_analysis}</p>
    <p><strong>Price:</strong> ₹${product.price_mrp}</p>
  `;
}

// --------------------
// Display comparison table
// --------------------
function displayComparisonTable(mainProduct, competitors) {
  const container = document.getElementById('comparisonTable');

  let rows = `
    <tr>
      <th>Feature</th>
      <th>${mainProduct.clean_name}</th>
      ${competitors.map(c => `<th>${c.clean_name}</th>`).join('')}
      <th>Health Insight</th>
    </tr>
  `;

  // Example: calories, sugar, fat, artificial additives
  const features = ['calories', 'sweetener', 'fat_source', 'protein', 'fiber', 'artificial_colors', 'preservatives', 'additive_load', 'overall_health_score'];

  features.forEach(f => {
    rows += `<tr>
      <td>${f.replace(/_/g, ' ')}</td>
      <td>${mainProduct[f] || '-'}</td>
      ${competitors.map(c => `<td>${c[f] || '-'}</td>`).join('')}
      <td></td>
    </tr>`;
  });

  container.innerHTML = `<h2>Comparison Table</h2><table>${rows}</table>`;
}

// --------------------
// Display detailed ingredients
// --------------------
function displayIngredients(mainProduct, competitors) {
  const container = document.getElementById('ingredientsTable');
  let html = `<h2>Ingredients & Additives</h2>`;

  html += `<h3>${mainProduct.clean_name}</h3>`;
  html += `<ul>${(mainProduct.ingredients || '').split(',').map(i => `<li>${i}</li>`).join('')}</ul>`;

  competitors.forEach(c => {
    html += `<h3>${c.clean_name}</h3>`;
    html += `<ul>${(c.ingredients || '').split(',').map(i => `<li>${i}</li>`).join('')}</ul>`;
  });

  container.innerHTML = html;
}

