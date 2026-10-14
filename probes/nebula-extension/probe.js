const api = globalThis.browser ?? chrome;
async function run(message) {
  document.querySelector('#result').textContent = 'Running';
  try { document.querySelector('#result').textContent = JSON.stringify(await api.runtime.sendMessage(message)); }
  catch { document.querySelector('#result').textContent = '{"result":"browser-message-failed"}'; }
}
document.querySelector('form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  const message = { type: 'live', email: form.elements.email.value, password: form.elements.password.value };
  form.reset();
  void run(message);
});
document.querySelector('#public').addEventListener('click', () => void run({ type: 'public' }));
