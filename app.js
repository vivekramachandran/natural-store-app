// ----------------------
// 1. Supabase connection
// ----------------------
const supabaseUrl = 'https://fdfdxszvenmbdkmxkuej.supabase.co'; // your project URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkZmR4c3p2ZW5tYmRrbXhrdWVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMzY5MzIsImV4cCI6MjA3NDYxMjkzMn0.4p_cmxlPd8L0CY7PiWjbCZ1NZ0jQs-jI1W3tW_Vsi2A'; // your anon public key
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// --------------------
// Start scanner
// --------------------
let html5QrCode;

function startScanner() {
    html5QrCode = new Html5Qrcode("reader");

    html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (decodedText, decodedResult) => {
            document.getElementById('scanResult').innerText = "Barcode detected: " + decodedText;

            // stop scanner
            await html5QrCode.stop();

            // lookup product
            await lookupProductByBarcode(decodedText);
        },
        (errorMessage) => {
            // optional: handle scan errors
        }
    ).catch(err => {
        console.error(err);
        alert("Cannot start scanner. Make sure camera permissions are allowed.");
    });
}

// --------------------
// Lookup product by barcode
// --------------------
async function lookupProductByBarcode(barcode) {
    const { data: mainProduct, error } = await supabase
        .from('products')
        .select('*')
        .eq('barcode', barcode)
        .single();

    if (error || !mainProduct) {
        alert("Product not found in database.");
        return;
    }

    displayMainProduct(mainProduct);

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
