const grid = document.getElementById('grid');
const statusEl = document.getElementById('status');
const countEl = document.getElementById('count');
const refreshBtn = document.getElementById('refresh');
const tabs = document.querySelectorAll('.admin-tab');

let currentTab = 'entries';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));

async function signedUrl(bucket, path) {
  if (!path) return null;
  const { data, error } = await window.sb.storage.from(bucket).createSignedUrl(path, 60 * 60);
  if (error) { console.error(error); return null; }
  return data.signedUrl;
}

function fmtDate(iso) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

async function renderEntry(s) {
  const [thumb, video] = await Promise.all([
    signedUrl('thumbnails', s.thumbnail_url),
    signedUrl('videos', s.video_url),
  ]);
  const media = video
    ? `<video class="admin-media" src="${esc(video)}" controls preload="metadata"></video>`
    : thumb
    ? `<img class="admin-media" src="${esc(thumb)}" alt="thumbnail" />`
    : `<div class="admin-media admin-media-empty">No media</div>`;
  const thumbBtn = thumb && video
    ? `<a class="chip" href="${esc(thumb)}" target="_blank" rel="noopener">View thumbnail</a>` : '';
  return `
    <article class="admin-card">
      ${media}
      <div class="admin-body">
        <div class="admin-head">
          <h3>${esc(s.full_name)}</h3>
          <span class="muted small">${esc(fmtDate(s.created_at))}</span>
        </div>
        <div class="admin-meta">
          <div><span class="muted small">Country</span><div>${esc(s.country)}</div></div>
          <div><span class="muted small">Email</span><div><a href="mailto:${esc(s.email)}">${esc(s.email)}</a></div></div>
          <div><span class="muted small">Phone</span><div><a href="tel:${esc(s.phone)}">${esc(s.phone)}</a></div></div>
          <div><span class="muted small">Portfolio</span><div><a href="${esc(s.portfolio)}" target="_blank" rel="noopener">${esc(s.portfolio)}</a></div></div>
        </div>
        <div class="admin-actions">
          ${video ? `<a class="chip" href="${esc(video)}" target="_blank" rel="noopener">Open video</a>` : ''}
          ${thumbBtn}
        </div>
      </div>
    </article>
  `;
}

async function renderProof(p) {
  const url = await signedUrl('proofs', p.proof_url);
  const isImg = url && !/\.pdf($|\?)/i.test(p.proof_url);
  const media = url
    ? (isImg
        ? `<img class="admin-media" src="${esc(url)}" alt="proof" />`
        : `<div class="admin-media admin-media-empty">📄 PDF receipt</div>`)
    : `<div class="admin-media admin-media-empty">No file</div>`;
  return `
    <article class="admin-card">
      ${media}
      <div class="admin-body">
        <div class="admin-head">
          <h3>${esc(p.full_name)}</h3>
          <span class="muted small">${esc(fmtDate(p.created_at))}</span>
        </div>
        <div class="admin-meta">
          <div><span class="muted small">Method</span><div><strong>${p.method === 'crypto' ? '₿ Crypto' : '🏦 Bank transfer'}</strong></div></div>
          <div><span class="muted small">Amount</span><div>$${Number(p.amount).toLocaleString()}</div></div>
          <div><span class="muted small">Email</span><div><a href="mailto:${esc(p.email)}">${esc(p.email)}</a></div></div>
          ${p.notes ? `<div><span class="muted small">Notes</span><div>${esc(p.notes)}</div></div>` : ''}
        </div>
        <div class="admin-actions">
          ${url ? `<a class="chip" href="${esc(url)}" target="_blank" rel="noopener">Open proof</a>` : ''}
        </div>
      </div>
    </article>
  `;
}

async function load() {
  statusEl.textContent = 'Loading…';
  grid.innerHTML = '';
  const table = currentTab === 'entries' ? 'submissions' : 'payment_proofs';
  const { data, error } = await window.sb.from(table).select('*').order('created_at', { ascending: false });
  if (error) { statusEl.textContent = 'Failed to load: ' + error.message; countEl.textContent = ''; return; }
  countEl.textContent = `(${data.length})`;
  if (!data.length) { statusEl.textContent = currentTab === 'entries' ? 'No submissions yet.' : 'No payment proofs yet.'; return; }
  statusEl.textContent = '';
  const cards = await Promise.all(data.map(currentTab === 'entries' ? renderEntry : renderProof));
  grid.innerHTML = cards.join('');
}

tabs.forEach((t) => t.addEventListener('click', () => {
  tabs.forEach((x) => x.classList.remove('active'));
  t.classList.add('active');
  currentTab = t.dataset.tab;
  load();
}));

refreshBtn.addEventListener('click', load);
load();
