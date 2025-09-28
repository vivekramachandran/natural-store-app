

// ----------------------
// 1. Supabase connection
// ----------------------
const supabaseUrl = 'https://fdfdxszvenmbdkmxkuej.supabase.co'; // your project URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkZmR4c3p2ZW5tYmRrbXhrdWVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMzY5MzIsImV4cCI6MjA3NDYxMjkzMn0.4p_cmxlPd8L0CY7PiWjbCZ1NZ0jQs-jI1W3tW_Vsi2A'; // your anon public key
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// ----------------------
// 2. Start camera scanner
// ----------------------
function startScanner() {
  Quagga.init({
    inputStream : {
      name : "Live",
      type : "LiveStream",
      target: document.querySelector('#scanner-container'),
      constraints: {
        facingMode: "environment"
      },
    },
    decoder : {
      readers : ["ean_reader","upc_reader","upc_e_reader"]
    }
  }, function(err) {
      if (err) { console.error(err); return; }
      console.log("Quagga initialized");
      Quagga.start();
  });

  Quagga.onDetected(function(result) {
      const code = result.codeResult.code;
      document.getElementById('scanResult').innerText = `Scanned Barcode: ${code}`;
      Quagga.stop();
      lookupProductByBarcode(code);
  });
}

// ----------------------
// 3. Fetch product + competitors + ingredients
// ----------------------
async function lookupProductByBarcode(barcode) {
  if (!barcode) return alert('No barcode detected')

  // 3a: Main product
  let { data: mainProduct, error: mainError } = await supabase
    .from('products')
    .select('*')
    .eq('barcode', barcode)
    .single()
  if (mainError) return alert('Product not found')
  displayMainProduct(mainProduct)

  // 3b: Competitors
  let { data: competitorRow } = await supabase
    .from('competitors')
    .select('*')
    .eq('product_id', mainProduct.product_id)
    .single()

  const competitorIds = [competitorRow.competitor_1, competitorRow.competitor_2, competitorRow.competitor_3]
  
  let { data: competitorProducts } = await supabase
    .from('products')
    .select('*')
    .in('product_id', competitorIds)

  displayComparisonTable(mainProduct, competitorProducts)

  // 3c: Ingredients
  const allIds = [mainProduct.product_id, ...competitorIds]
  let { data: ingredients } = await supabase
    .from('ingredients')
    .select('*')
    .in('product_id', allIds)

  displayIngredientsTable(ingredients, [mainProduct, ...competitorProducts])
}

// ----------------------
// 4. Display main product health
// ----------------------
function displayMainProduct(product) {
  const container = document.getElementById('mainProduct')
  container.innerHTML = `
    <h2>Main Product: ${product.name}</h2>
    <p>Health Score: <span class="${product.health_score >= 80 ? 'healthy' : product.health_score >= 50 ? 'warning' : 'danger'}">
      ${product.health_score}/100</span></p>
    <p>${product.health_analysis}</p>
  `
}

// ----------------------
// 5. Display comparison table
// ----------------------
function displayComparisonTable(main, competitors) {
  const container = document.getElementById('comparisonTable')
  let html = `<h2>Comparison Table</h2><table>
    <tr>
      <th>Feature</th>
      <th>${main.name}</th>
      ${competitors.map(c => `<th>${c.name}</th>`).join('')}
    </tr>
    <tr><td>Calories</td><td>${main.calories}</td>${competitors.map(c=>`<td>${c.calories}</td>`).join('')}</tr>
    <tr><td>Sugar</td><td>${main.sugar}</td>${competitors.map(c=>`<td>${c.sugar}</td>`).join('')}</tr>
    <tr><td>Fat</td><td>${main.fat}</td>${competitors.map(c=>`<td>${c.fat}</td>`).join('')}</tr>
    <tr><td>Health Score</td><td>${main.health_score}</td>${competitors.map(c=>`<td>${c.health_score}</td>`).join('')}</tr>
  </table>`
  container.innerHTML = html
}

// ----------------------
// 6. Display ingredients with shock & awe
// ----------------------
function displayIngredientsTable(allIngredients, products) {
  const container = document.getElementById('ingredientsTable')
  let html = '<h2>Ingredients / Additives</h2>'

  products.forEach(p => {
    html += `<h3>${p.name}</h3><ul>`
    allIngredients.filter(i => i.product_id === p.product_id).forEach(i => {
      let color = (i.type && (i.type.toLowerCase().includes('artificial') || i.type.toLowerCase().includes('preservative') || i.type.toLowerCase().includes('chemical'))) ? 'red' : 'green'
      html += `<li style="color:${color}">${i.name} (${i.type || 'Natural'}): ${i.impact}</li>`
    })
    html += '</ul>'
  })

  container.innerHTML = html
}
