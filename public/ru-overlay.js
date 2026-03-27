(function () {
  const DICT = new Map([
    ["New chat", "Новый чат"],
    ["Settings", "Настройки"],
    ["Sign out", "Выйти"],
    ["Logout", "Выйти"],
    ["Log out", "Выйти"],
    ["Search", "Поиск"],
    ["History", "История"],
    ["Agent", "Агент"],
    ["Agents", "Агенты"],
    ["Model", "Модель"],
    ["Models", "Модели"],
    ["Tools", "Инструменты"],
    ["Send", "Отправить"],
    ["Stop", "Стоп"],
    ["Retry", "Повторить"],
    ["Clear", "Очистить"],
    ["Delete", "Удалить"],
    ["Cancel", "Отмена"],
    ["Save", "Сохранить"],
    ["Create", "Создать"],
    ["Edit", "Редактировать"],
    ["Profile", "Профиль"],
    ["Dashboard", "Кабинет"],
    ["Personal cabinet", "Личный кабинет"],
    ["Control panel", "Панель управления"],
    ["Connected", "Подключено"],
    ["Disconnected", "Отключено"],
    ["Loading...", "Загрузка..."],
    ["Type a message...", "Введите сообщение..."],
    ["Ask anything", "Спросите что угодно"],
    ["Copy", "Копировать"],
    ["Copied", "Скопировано"],
    ["Error", "Ошибка"],
    ["Try again", "Попробуйте снова"],
    ["Wallet empty — using free model. Fund your wallet to use", "Кошелек пуст — используется бесплатная модель. Пополните кошелек, чтобы использовать"]
  ]);

  const replaceText = (text) => {
    let out = text;
    for (const [en, ru] of DICT.entries()) {
      if (out.includes(en)) out = out.split(en).join(ru);
    }
    return out;
  };

  const processNode = (node) => {
    if (!node) return;
    if (node.nodeType === Node.TEXT_NODE) {
      const next = replaceText(node.nodeValue || "");
      if (next !== node.nodeValue) node.nodeValue = next;
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node;
    const attrs = ["placeholder", "title", "aria-label"];
    for (const key of attrs) {
      const val = el.getAttribute(key);
      if (!val) continue;
      const next = replaceText(val);
      if (next !== val) el.setAttribute(key, next);
    }

    for (const child of el.childNodes) processNode(child);
  };

  const apply = () => processNode(document.body);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply, { once: true });
  } else {
    apply();
  }

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const n of m.addedNodes) processNode(n);
      if (m.type === "characterData") processNode(m.target);
    }
  });

  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    characterData: true
  });
})();
