const API = location.origin;

const adminKeyEl = document.getElementById("adminKey");
const statusEl = document.getElementById("status");
const loadBtn = document.getElementById("load");
const list = document.getElementById("list");

function h(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"
  }[c]));
}

async function api(path, opts = {}) {
  const adminKey = adminKeyEl.value.trim();
  if (!adminKey) throw new Error("Введи ADMIN_KEY");

  const headers = {
    ...(opts.headers || {}),
    "x-admin-key": adminKey,
    "Content-Type": "application/json"
  };
  const r = await fetch(`${API}${path}`, { ...opts, headers });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
  return data;
}

async function loadOrders() {
  list.innerHTML = "Загрузка...";
  try {
    const status = statusEl.value;
    const data = await api(`/api/admin/orders?status=${encodeURIComponent(status)}`);
    renderOrders(data.items || []);
  } catch (e) {
    list.innerHTML = `<div class="note">Ошибка: ${h(e.message || e)}</div>`;
  }
}

function renderOrders(items) {
  if (!items.length) {
    list.innerHTML = `<div class="note">Заказов нет.</div>`;
    return;
  }

  list.innerHTML = "";
  for (const o of items) {
    const el = document.createElement("div");
    el.className = "cartItem";
    el.innerHTML = `
      <div style="flex:1">
        <div><b>Заказ #${h(o.id)}</b> • <span class="small">${h(o.status)}</span></div>
        <div class="small">Сумма: <b>${h(o.total_rub)}</b> ₽</div>
        <div class="small">Пользователь: ${h(o.tg_username || "-")} (id: ${h(o.tg_user_id)})</div>
        <div class="small">Создан: ${h(o.created_at)}</div>
        <div style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap">
          <button class="btn2" data-paid>Пометить PAID</button>
          <button class="btn2" data-deliver>Выдать</button>
        </div>
        <div data-out class="note"></div>
      </div>
    `;

    const out = el.querySelector("[data-out]");

    el.querySelector("[data-paid]").addEventListener("click", async () => {
      out.textContent = "Помечаем как PAID...";
      try {
        await api(`/api/admin/orders/${o.id}/mark-paid`, { method: "POST", body: "{}" });
        out.textContent = "OK: заказ помечен как PAID. Обнови список.";
      } catch (e) {
        out.textContent = `Ошибка: ${e.message || e}`;
      }
    });

    el.querySelector("[data-deliver]").addEventListener("click", async () => {
      const secretText = prompt(
        "Вставь данные аккаунта + инструкцию (логин/пароль/что делать после входа):"
      );
      if (!secretText) return;
      out.textContent = "Выдаём...";
      try {
        const r = await api(`/api/admin/orders/${o.id}/deliver`, {
          method: "POST",
          body: JSON.stringify({ secretText })
        });
        const fullUrl = `${location.origin}${r.viewUrl}`;
        out.innerHTML = `✅ Выдано. Одноразовая ссылка клиенту: <br><a href="${fullUrl}" target="_blank">${fullUrl}</a>`;
      } catch (e) {
        out.textContent = `Ошибка: ${e.message || e}`;
      }
    });

    list.appendChild(el);
  }
}

loadBtn.addEventListener("click", loadOrders);
