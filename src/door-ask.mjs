function escape(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

export function doorAskMarkup(doorId) {
  return `<section class="door-ask" data-door-ask data-door="${doorId}">
    <h2>Ask more</h2>
    <p>This is the basic point. Read it. Then ask. Keep asking if you want to go deeper. No login. No seed. No price.</p>
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
  const history = [];
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const question = box.value.trim();
    if (!question) return;
    box.value = '';
    log.insertAdjacentHTML('beforeend', `<p class="door-ask-q"><strong>You</strong> ${escape(question)}</p>`);
    const status = document.createElement('p');
    status.className = 'small';
    status.textContent = 'Asking…';
    log.append(status);
    try {
      const res = await fetch('/ask', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({door: Number(root.dataset.door), question, history: history.slice(-6)}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Ask failed (${res.status}).`);
      history.push({role: 'user', content: question}, {role: 'assistant', content: data.answer || ''});
      status.remove();
      const source = data.source === 'grok' ? 'Grok, grounded in this door and the master file.' : 'Local master-file notes. Set XAI_API_KEY on local host to ask Grok.';
      log.insertAdjacentHTML('beforeend', `<p class="door-ask-a">${escape(data.answer || '')}</p><p class="small">${escape(source)}</p>`);
    } catch (error) {
      status.textContent = error.message || 'Ask is only on local host.';
    }
  });
}
