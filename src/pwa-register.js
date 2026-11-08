/** Install prompt and service-worker integration; never stores external API responses. */
let deferredPrompt = null;
let installed = false;
let ready = false;

function isInstalled() {
  return installed || (typeof window !== 'undefined'
    && window.matchMedia?.('(display-mode: standalone)').matches)
    || (typeof navigator !== 'undefined' && navigator.standalone === true);
}

function updateInstallUI(message) {
  const button = document.getElementById('installPwaBtn');
  const status = document.getElementById('pwaStatus');
  if (!button || !status) return;
  button.textContent = isInstalled() ? 'App ist installiert' : 'App installieren';
  button.disabled = Boolean(isInstalled());
  status.textContent = message || (isInstalled()
    ? 'Nachthimmel läuft als installierte App.'
    : ready ? 'Die Himmelskarte ist für die Offline-Nutzung vorbereitet.'
      : 'Für die Installation HTTPS oder localhost verwenden.');
}

export function registerPwa() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
  const supported = 'serviceWorker' in navigator;
  const secure = (typeof location !== 'undefined' && (location.protocol === 'https:'
    || (location.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname))));

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event;
    updateInstallUI('Die App kann auf diesem Gerät installiert werden.');
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    deferredPrompt = null;
    updateInstallUI();
  });

  const button = document.getElementById('installPwaBtn');
  button?.addEventListener('click', async () => {
    if (isInstalled()) return;
    if (deferredPrompt) {
      const prompt = deferredPrompt;
      deferredPrompt = null;
      await prompt.prompt();
      const choice = await prompt.userChoice;
      updateInstallUI(choice?.outcome === 'accepted'
        ? 'Die Installation wurde im Browser bestätigt.'
        : 'Installation nicht ausgeführt. Im Browsermenü erneut versuchen.');
    } else if (!secure || !supported) {
      updateInstallUI('Nur über HTTPS oder localhost als PWA installierbar.');
    } else {
      updateInstallUI('Im Browsermenü „Installieren“ oder „Zum Home-Bildschirm“ wählen.');
    }
  });

  if (!supported || !secure) {
    updateInstallUI('Für Installation und Offline-Modus die App über HTTPS oder localhost öffnen.');
    return;
  }

  // Vite's hot-reload client and virtual modules are development-only. Do not
  // cache them as an offline installation. Test the PWA using the dist build.
  if (document.querySelector?.('script[src="/@vite/client"]')) {
    updateInstallUI('PWA im Produktions-Build testen (npm run preview).');
    return;
  }

  // Register relative to the current app directory; works under subpaths too.
  navigator.serviceWorker.register(new URL('./sw.js', document.baseURI), {scope: './'})
    .then(() => navigator.serviceWorker.ready)
    .then(() => { ready = true; updateInstallUI(); })
    .catch(() => updateInstallUI('Offline-Modus konnte nicht eingerichtet werden.'));
  updateInstallUI();
}
