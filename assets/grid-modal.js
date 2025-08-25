document.addEventListener('DOMContentLoaded', function () {
    // Open modal
    document.querySelectorAll('.grid-plus-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        let data = JSON.parse(this.getAttribute('data-product').replace(/&quot;/g,'"'));
        document.getElementById('modal-image').innerHTML = `<img src="${data.featured_image.url}" alt="${data.title}"/>`;
        document.getElementById('modal-title').textContent = data.title;
        document.getElementById('modal-price').textContent = (data.price / 100).toLocaleString('en-IN', { style: 'currency', currency: data.currency || 'INR' });
        document.getElementById('modal-desc').innerHTML = data.description || '';
        // Variants
        let form = document.getElementById('modal-variant-form');
        form.innerHTML = '';
        // Color options
        let optionsMarkup = '';
        if (data.options && data.options.length > 0) {
          data.options.forEach((opt, idx) => {
            optionsMarkup += `<label>${opt}</label><select class="modal-variant" data-index="${idx}">`;
            data.options_with_values[idx].values.forEach(val => {
              optionsMarkup += `<option value="${val}">${val}</option>`;
            });
            optionsMarkup += `</select><br/>`;
          });
        }
        form.innerHTML = optionsMarkup;
        // Tracking
        window.currentModalProduct = data;
        window.currentModalVariantId = data.variants[0].id; // default
        window.softWinterProductTitle = "Soft Winter Jacket";
        window.softWinterProductId = null; // To be filled later
  
        // Listen for variant change
        document.querySelectorAll('.modal-variant').forEach(function(select){
          select.addEventListener('change', updateVariantIdFromSelections);
        });
        updateVariantIdFromSelections();
  
        // Show modal
        let modal = document.getElementById('product-modal');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      });
    });
  
    // Close modal
    document.getElementById('close-modal').addEventListener('click', function () {
      document.getElementById('product-modal').setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    });
  
    // Find variant ID by selected option values
    function updateVariantIdFromSelections() {
      let data = window.currentModalProduct;
      let selectedValues = [];
      document.querySelectorAll('.modal-variant').forEach(select => {
        selectedValues.push(select.value);
      });
      let found = data.variants.find(v => {
        return v.options.join('|') === selectedValues.join('|');
      });
      if (found) window.currentModalVariantId = found.id;
    }
  
    // Add to cart (with "Soft Winter Jacket" rule)
    document.getElementById('add-to-cart-btn').addEventListener('click', function () {
      let data = window.currentModalProduct;
      let selectedVariant = window.currentModalVariantId;
  
      fetch('/cart/add.js', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({id: selectedVariant, quantity: 1})
      }).then(r => r.json()).then(d => {
        // Check the current modal for Black & Medium
        let selectedColor = null, selectedSize = null;
        if(data.options && data.options.length > 0){
          let opts = data.options;
          opts.forEach((label, idx) => {
            let val = document.querySelector(`.modal-variant[data-index="${idx}"]`).value;
            if(label.toLowerCase().includes('color')) selectedColor = val;
            if(label.toLowerCase().includes('size')) selectedSize = val;
          });
        }
        // If Black and Medium, also add Soft Winter Jacket
        if(selectedColor === 'Black' && selectedSize === 'Medium'){
          // Find soft winter product/variant
          fetch('/products.json')
            .then(r => r.json())
            .then(prodData => {
              let p = prodData.products.find(item => item.title === window.softWinterProductTitle);
              if(p){
                let vId = p.variants[0].id; // First variant
                return fetch('/cart/add.js', {
                  method: 'POST',
                  headers: {'Content-Type':'application/json'},
                  body: JSON.stringify({id: vId, quantity: 1})
                });
              }
            });
        }
        alert('Added to cart!');
        document.getElementById('product-modal').setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      });
    });
  });
  