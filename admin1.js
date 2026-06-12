const grid = document.getElementById('grid');
const status = document.getElementById('status');
const countEl = document.getElementById('count');
const refreshBtn = document.getElementById('refresh');

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
  const d = new Date(iso);
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

async function renderCard(s) {
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

async function load() {
  status.textContent = 'Loading…';
  grid.innerHTML = '';
  const { data, error } = await window.sb
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    status.textContent = 'Failed to load submissions: ' + error.message;
    countEl.textContent = '';
    return;
  }

  countEl.textContent = `(${data.length})`;
  if (!data.length) {
    status.textContent = 'No submissions yet.';
    return;
  }
  status.textContent = '';
  const cards = await Promise.all(data.map(renderCard));
  grid.innerHTML = cards.join('');
}

refreshBtn.addEventListener('click', load);
load();
