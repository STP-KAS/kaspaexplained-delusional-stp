const CAP = 50;

function escape(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

export function doorAskMarkup(doorId) {
  return `<section class="door-ask" data-door-ask data-door="${doorId}">
    <h2>Ask more</h2>
    <p>This is the basic point. Read it. Then ask. Keep asking if you want to go deeper. No login. No seed. No price. Enter sends. Shift+Enter is a new line. ${CAP} questions per door, then refresh.</p>
    <p class="small" data-door-ask-count></p>
    <form data-door-ask-form>
      <label class="sr-only" for="door-ask-${doorId}">Your question</label>
      <textarea id="door-ask-${doorId}" name="q" rows="3" required maxlength="800" placeholder="Ask about this door."></textarea>
      <button class="primary-button" type="submit">Ask</button>
    </form>
    <div class="door-ask-log" data-door-ask-log aria-live="polite"></div>
  </section>`;
}

export function mountDoorAsk() {
  const root = document.querySelector('[data-door-ask]');
  if (!root) return;
  const form = root.querySelector('[data-door-ask-form]');
  const log = root.querySelector('[data-door-ask-log]');
  const box = form.querySelector('textarea');
  const button = form.querySelector('button');
  const countEl = root.querySelector('[data-door-ask-count]');
  const doorId = Number(root.dataset.door) || 1;
  const history = [];
  let count = 0;
  let warned40 = false;
  let warned48 = false;

  const paintCount = () => {
    const left = Math.max(0, CAP - count);
    countEl.textContent = left ? `${count} of ${CAP} questions this door.` : 'Session cap reached. Refresh the door or open another door.';
    const done = count >= CAP;
    box.disabled = done;
    button.disabled = done;
  };
  paintCount();

  const submit = async () => {
    if (count >= CAP) {
      paintCount();
      return;
    }
    const question = box.value.trim();
    if (!question) return;
    box.value = '';
    count += 1;
    paintCount();
    log.insertAdjacentHTML('beforeend', `<p class="door-ask-q"><strong>You</strong> ${escape(question)}</p>`);
    const status = document.createElement('p');
    status.className = 'small';
    status.textContent = 'Asking…';
    log.append(status);
    try {
      const res = await fetch('/ask', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({door: doorId, question, count, history: history.slice(-8)}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Ask failed (${res.status}).`);
      history.push({role: 'user', content: question}, {role: 'assistant', content: data.answer || ''});
      let extra = '';
      if (count === 40 && !warned40) { warned40 = true; extra = '\n\n10 questions left in this session.'; }
      if (count === 48 && !warned48) { warned48 = true; extra = '\n\n2 left, then this door Ask stops.'; }
      if (count >= CAP) extra = '\n\nSession cap reached. Refresh the door or open another door.';
      status.remove();
      const source = data.source === 'grok' ? 'Grok. Door text stays the first answer.' : 'Local notes. Set XAI_API_KEY on local host for Grok.';
      log.insertAdjacentHTML('beforeend', `<p class="door-ask-a">${escape((data.answer || '') + extra)}</p><p class="small">${escape(source)}</p>`);
    } catch (error) {
      status.textContent = error.message || 'Ask is only on local host.';
    }
  };

  form.addEventListener('submit', event => {
    event.preventDefault();
    submit();
  });
  box.addEventListener('keydown', event => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    form.requestSubmit();
  });
}
