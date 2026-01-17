const tg = window.Telegram?.WebApp;
if (tg) tg.ready();

const API = location.origin;

const grid = document.getElementById("grid");
const search = document.getElementById("search");
const reloadBtn = document.getElementById("reload");

const cartBtn = document.getElementById("cartBtn");
const cartCount = document.getElementById("cartCount");
const drawer = document.getElementById("drawer");
const closeDrawer = document.getElementById("closeDrawer");
const cartItems = document.getElementById("cartItems");
const totalEl = document.getElementById("total");
const checkoutBtn = document.getElementById("checkout");
const checkoutResult = document.getElementById("checkoutResult");

let products = [];
let cart = new Map(); // productId -> qty

function tgUser() {
  // MVP: берём user из WebApp, если открыто в Telegram
  const u = tg?.initDataUnsafe?.user;
  return {
    tgUserId: u?.id ? String(u.id) : "guest",
    tgUsername: u?.username ? String(u.username) : null
  };
}

function money(n) { return `${n} ₽`; }

async function loadProducts() {
  const s = encodeURIComponent(search.value.trim());
  const url = `${API}/api/products?search=${s}`;
  const r = await fetch(url);
  const data = await r.json();
  products = data.items || [];
  renderProducts();
}

function renderProducts() {
  grid.innerHTML = "";
  for (const p of products) {
    const el = document.createElement("div");
    el.className = "card";
    el.innerHTML = `
      <div class="title">${escapeHtml(p.title)}</div>
      <div class="small">${escapeHtml(p.description || "")}</div>
      <div class="meta">
        <span>Регион: <b>${escapeHtml(p.region || "-")}</b></span>
        <span>${escapeHtml(p.stock_status)}</span>
      </div>
      <div class="row">
        <div class="price">${money(p.price_rub)}</div>
        <button class="btn2" data-add="${p.id}">В корзину</button>
      </div>
    `;
    el.querySelector("[data-add]")?.addEventListener("click", () => addToCart(p.id, 1));
    grid.appendChild(el);
  }
}

function addToCart(productId, delta) {
  const cur = cart.get(productId) || 0;
  const next = Math.max(cur + delta, 0);
  if (next === 0) cart.delete(productId);
  else cart.set(productId, next);
  updateCartBadge();
}

function updateCartBadge() {
  let count = 0;
  for (const v of cart.values()) count += v;
  cartCount.textContent = String(count);
}

function openDrawer() {
  drawer.classList.remove("hidden");
  renderCart();
}
function closeDrawerFn() {
  drawer.classList.add("hidden");
  checkoutResult.textContent = "";
}

function renderCart() {
  cartItems.innerHTML = "";
  let total = 0;

  for (const [productId, qty] of cart.entries()) {
    const p = products.find(x => String(x.id) === String(productId));
    if (!p) continue;
    total += p.price_rub * qty;

    const row = document.createElement("div");
    row.className = "cartItem";
    row.innerHTML = `
      <div>
        <div><b>${escapeHtml(p.title)}</b></div>
        <div class="small">Регион: ${escapeHtml(p.region || "-")}</div>
        <div class="small">Цена: ${money(p.price_rub)}</div>
      </div>
      <div class="qty">
        <button class="qbtn" data-minus>-</button>
        <b>${qty}</b>
        <button class="qbtn" data-plus>+</button>
        <button class="qbtn" data-del title="Удалить">×</button>
      </div>
    `;
    row.querySelector("[data-minus]").addEventListener("click", () => { addToCart(productId, -1); renderCart(); });
    row.querySelector("[data-plus]").addEventListener("click", () => { addToCart(productId, +1); renderCart(); });
    row.querySelector("[data-del]").addEventListener("click", () => { cart.delete(productId); updateCartBadge(); renderCart(); });

    cartItems.appendChild(row);
  }

  totalEl.textContent = String(total);
}

async function checkout() {
  checkoutResult.textContent = "Создаём заказ...";
  if (cart.size === 0) {
    checkoutResult.textContent = "Корзина пустая.";
    return;
  }

  const items = Array.from(cart.entries()).map(([productId, qty]) => ({ productId, qty }));
  const user = tgUser();

  const r = await fetch(`${API}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items, ...user })
  });

  const data = await r.json();
  if (!r.ok) {
    checkoutResult.textContent = `Ошибка: ${data.error || "unknown"}`;
    return;
  }

  // MVP: без оплаты — просто создаём заказ и показываем как оплатить вручную
  checkoutResult.textContent =
    `Заказ #${data.orderId} создан. Статус: ${data.status}\n` +
    `Сумма: ${data.total_rub} ₽\n\n` +
    `Дальше (MVP): оплата и выдача вручную.\n` +
    `Напиши в поддержку и укажи номер заказа.`;

  if (tg) tg.HapticFeedback?.notificationOccurred("success");
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"
  }[c]));
}

reloadBtn.addEventListener("click", loadProducts);
search.addEventListener("input", () => {
  clearTimeout(window.__t);
  window.__t = setTimeout(loadProducts, 250);
});

cartBtn.addEventListener("click", openDrawer);
closeDrawer.addEventListener("click", closeDrawerFn);
checkoutBtn.addEventListener("click", checkout);

loadProducts();
updateCartBadge();
