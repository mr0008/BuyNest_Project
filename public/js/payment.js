if (!Api.isLoggedIn()) {
  showToast('Please log in to continue to payment', 'error');
  setTimeout(() => window.location.href = '/login.html', 900);
}

let cartItems = [];
let totalAmount = 0;

function formatMoney(value) {
  return `RS.${value.toFixed(2)}`;
}

async function loadPaymentPage() {
  try {
    cartItems = await Api.get('/cart');
    const items = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cartItems.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
    const shipping = subtotal > 0 ? 5.00 : 0;
    totalAmount = subtotal + shipping;

    document.getElementById('pay-items').textContent = `${items} item(s)`;
    document.getElementById('pay-subtotal').textContent = formatMoney(subtotal);
    document.getElementById('pay-shipping').textContent = shipping ? formatMoney(shipping) : 'Free';
    document.getElementById('pay-total').textContent = formatMoney(totalAmount);
    document.getElementById('pay-btn').textContent = `Pay ${formatMoney(totalAmount)}`;

    if (!cartItems.length) {
      const content = document.getElementById('payment-content');
      content.innerHTML = `
        <div class="empty-state">
          <div class="icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Add items to your cart before checking out.</p>
          <a href="/" class="btn btn-primary" style="margin-top:20px">Browse Products</a>
        </div>
      `;
    }
  } catch (err) {
    showToast(err.message || 'Failed to load cart', 'error');
  }
}

async function processPayment(event) {
  event.preventDefault();
  if (!cartItems.length) return;

  const name = document.getElementById('name').value.trim();
  const cardNumber = document.getElementById('card-number').value.replace(/\s+/g, '');
  const expiry = document.getElementById('expiry').value.trim();
  const cvv = document.getElementById('cvv').value.trim();

  if (!name || !cardNumber || !expiry || !cvv) {
    showToast('Please fill in all payment fields', 'error');
    return;
  }

  if (!/^\d{12,19}$/.test(cardNumber)) {
    showToast('Enter a valid card number', 'error');
    return;
  }

  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
    showToast('Enter expiry as MM/YY', 'error');
    return;
  }

  if (!/^\d{3,4}$/.test(cvv)) {
    showToast('Enter a valid CVV', 'error');
    return;
  }

  try {
    document.getElementById('pay-btn').disabled = true;
    document.getElementById('pay-btn').textContent = 'Processing…';

    await Api.post('/payment/process', {
      amount: totalAmount,
      billing: {
        name,
        card_number: cardNumber,
        expiry,
        cvv
      }
    });

    showToast('Payment successful! Thank you for your order.', 'success');
    setTimeout(() => {
      window.location.href = '/';
    }, 1800);
  } catch (err) {
    showToast(err.message || 'Payment failed', 'error');
    document.getElementById('pay-btn').disabled = false;
    document.getElementById('pay-btn').textContent = `Pay ${formatMoney(totalAmount)}`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadPaymentPage();
  document.getElementById('payment-form')?.addEventListener('submit', processPayment);
});
