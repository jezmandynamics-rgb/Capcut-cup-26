const openBtn = document.getElementById('openDonate');
const flow = document.getElementById('donateFlow');
const cryptoBox = document.getElementById('cryptoBox');
const bankBox = document.getElementById('bankBox');
const proofForm = document.getElementById('proofForm');
const methodInput = document.getElementById('method');
const proofSuccess = document.getElementById('proofSuccess');

openBtn.addEventListener('click', () => {
  flow.hidden = false;
  flow.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

document.querySelectorAll('.method-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.method-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const m = btn.dataset.method;
    methodInput.value = m;
    cryptoBox.open = m === 'crypto';
    bankBox.open = m === 'bank';
    cryptoBox.hidden = m !== 'crypto';
    bankBox.hidden = m !== 'bank';
    proofForm.hidden = false;
    proofForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// Click-to-copy wallet/bank values
document.addEventListener('click', (e) => {
  const code = e.target.closest('code.addr');
  if (!code) return;
  navigator.clipboard?.writeText(code.textContent.trim());
  const prev = code.dataset.prev || code.textContent;
  code.dataset.prev = prev;
  code.textContent = '✓ Copied!';
  setTimeout(() => { code.textContent = prev; }, 1200);
});

// Proof upload
const proofDrop = document.getElementById('proofDrop');
const proofInput = document.getElementById('proof');
const proofPreview = document.getElementById('proofPreview');
const proofName = document.getElementById('proofName');

proofDrop.addEventListener('click', () => proofInput.click());
proofInput.addEventListener('change', () => {
  const f = proofInput.files[0];
  if (!f) return;
  if (f.size > 10 * 1024 * 1024) { showErr('proof', 'File must be 10MB or less'); proofInput.value=''; return; }
  clearErr('proof');
  if (f.type.startsWith('image/')) {
    proofPreview.src = URL.createObjectURL(f);
    proofPreview.hidden = false;
    proofName.hidden = true;
  } else {
    proofName.textContent = '📄 ' + f.name;
    proofName.hidden = false;
    proofPreview.hidden = true;
  }
  proofDrop.classList.add('has-file');
});

['dragover','dragleave','drop'].forEach((ev) => {
  proofDrop.addEventListener(ev, (e) => {
    e.preventDefault();
    if (ev === 'dragover') proofDrop.classList.add('drag');
    else proofDrop.classList.remove('drag');
    if (ev === 'drop' && e.dataTransfer.files[0]) {
      proofInput.files = e.dataTransfer.files;
      proofInput.dispatchEvent(new Event('change'));
    }
  });
});

function showErr(name, msg) {
  const el = document.querySelector(`.err[data-for="${name}"]`);
  if (el) el.textContent = msg;
  const input = document.getElementById(name);
  if (input) input.classList.add('invalid');
}
function clearErr(name) {
  const el = document.querySelector(`.err[data-for="${name}"]`);
  if (el) el.textContent = '';
  const input = document.getElementById(name);
  if (input) input.classList.remove('invalid');
}
function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9.-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}
async function uploadProof(file) {
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${slugify(file.name)}`;
  const { error } = await window.sb.storage.from('proofs').upload(path, file, {
    cacheControl: '3600', upsert: false, contentType: file.type || undefined,
  });
  if (error) throw error;
  return path;
}

proofForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  let ok = true;

  const name = document.getElementById('winnerName').value.trim();
  const email = document.getElementById('winnerEmail').value.trim();
  const file = proofInput.files[0];

  if (name.length < 2) { showErr('winnerName', 'Please enter your full name'); ok = false; } else clearErr('winnerName');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showErr('winnerEmail', 'Enter a valid email'); ok = false; } else clearErr('winnerEmail');
  if (!file) { showErr('proof', 'Please upload your proof of payment'); ok = false; }
  if (!methodInput.value) { alert('Please choose a payment method first.'); ok = false; }
  if (!ok) return;

  const btn = proofForm.querySelector('button[type="submit"]');
  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Uploading…';

  try {
    const proofPath = await uploadProof(file);
    const { error: insertErr } = await window.sb.from('payment_proofs').insert({
      full_name: name,
      email,
      method: methodInput.value,
      amount: 10000,
      proof_url: proofPath,
      notes: document.getElementById('notes').value.trim() || null,
    });
    if (insertErr) throw insertErr;

    flow.hidden = true;
    proofSuccess.hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    console.error(err);
    alert('Sorry — your proof could not be sent. Please try again.\n\n' + (err.message || err));
    btn.disabled = false;
    btn.textContent = original;
  }
});
