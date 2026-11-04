// Shared by index.html and changelog.html. Wires up the share button in the top bar.

const SHARE_URL = 'https://r3hab-media.github.io/Image-Squeezer/';
const SHARE_TEXT = 'Compress images in your browser. Nothing is uploaded.';

const shareBtn = document.getElementById('share');
let toast = null;
let toastTimer = 0;

function showToast(text) {
  if (!toast) {
    toast = document.createElement('p');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.textContent = text;
  toast.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('on'), 2500);
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(SHARE_URL);
    showToast('Link copied');
  } catch {
    // No clipboard access (old browser, or not a secure context). Let them copy it by hand.
    window.prompt('Copy this link', SHARE_URL);
  }
}

shareBtn?.addEventListener('click', async () => {
  const data = { title: 'Image Squeezer', text: SHARE_TEXT, url: SHARE_URL };
  if (navigator.share && (!navigator.canShare || navigator.canShare(data))) {
    try {
      await navigator.share(data);
      return;
    } catch (err) {
      // Closing the share sheet is not a failure.
      if (err && err.name === 'AbortError') return;
    }
  }
  copyLink();
});
