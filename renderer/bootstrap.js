const host = document.getElementById('bootError');

function showBootError(error) {
  console.error('Application startup failed', error);
  if (!host) return;
  const message = error instanceof Error ? error.message : String(error);
  host.querySelector('[data-error-message]').textContent = message;
  host.classList.remove('hidden');
}

window.addEventListener('error', event => showBootError(event.error || event.message));
window.addEventListener('unhandledrejection', event => showBootError(event.reason));

if (!window.desktopApi) {
  showBootError(new Error('The secure desktop bridge did not load. Restart the application.'));
} else if (!window.PIXI) {
  showBootError(new Error('The PixiJS renderer did not load. Run npm install, then restart the application.'));
} else {
  import('./app.js').catch(showBootError);
}
