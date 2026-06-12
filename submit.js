const form = document.getElementById('entry-form');
const success = document.getElementById('success');
const submitBtn = form.querySelector('button[type="submit"]');

// --- Thumbnail upload ---
const thumbDrop = document.getElementById('thumbDrop');
const thumbInput = document.getElementById('thumbnail');
const thumbPreview = document.getElementById('thumbPreview');

thumbDrop.addEventListener('click', () => thumbInput.click());
thumbInput.addEventListener('change', () => {
  const f = thumbInput.files[0];
  if (!f) return;
  if (f.size > 5 * 1024 * 1024) {
    showErr('thumbnail', 'Image must be 5MB or less');
    thumbInput.value = '';
    return;
  }
  clearErr('thumbnail'); clearErr('video');
  thumbPreview.src = URL.createObjectURL(f);
  thumbPreview.hidden = false;
  thumbDrop.classList.add('has-file');
});

// --- Video upload ---
const videoDrop = document.getElementById('videoDrop');
const videoInput = document.getElementById('video');
const videoName = document.getElementById('videoName');

videoDrop.addEventListener('click', () => videoInput.click());
videoInput.addEventListener('change', () => {
  const f = videoInput.files[0];
  if (!f) return;
  if (f.size > 200 * 1024 * 1024) {
    showErr('video', 'Video must be 200MB or less');
    videoInput.value = '';
    return;
  }
  clearErr('video'); clearErr('thumbnail');
  videoName.textContent = '🎞️ ' + f.name;
  videoName.hidden = false;
  videoDrop.classList.add('has-file');
});

// --- Drag and drop ---
[[thumbDrop, thumbInput], [videoDrop, videoInput]].forEach(([drop, input]) => {
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('drag'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('drag'));
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    drop.classList.remove('drag');
    if (e.dataTransfer.files[0]) {
      input.files = e.dataTransfer.files;
      input.dispatchEvent(new Event('change'));
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

async function uploadFile(bucket, file) {
  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${slugify(file.name)}`;
  const { error } = await window.sb.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  return path;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  let ok = true;

  const fields = {
    fullName: (v) => v.trim().length >= 2 || 'Please enter your full name',
    country:  (v) => v.trim().length >= 2 || 'Please enter your country',
    email:    (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Enter a valid email',
    phone:    (v) => /^[+\d\s()-]{7,}$/.test(v.trim()) || 'Enter a valid phone number',
    portfolio:(v) => /^https?:\/\/.+\..+/.test(v.trim()) || 'Enter a valid URL (https://…)',
  };

  for (const [name, check] of Object.entries(fields)) {
    const val = document.getElementById(name).value;
    const res = check(val);
    if (res !== true) { showErr(name, res); ok = false; } else clearErr(name);
  }

  const thumbFile = thumbInput.files[0];
  const videoFile = videoInput.files[0];
  if (!thumbFile && !videoFile) {
    showErr('thumbnail', 'Add a thumbnail or a video (at least one)');
    showErr('video', 'Add a thumbnail or a video (at least one)');
    ok = false;
  }
  if (!document.getElementById('agree').checked) {
    alert('Please confirm the edit is your original work.');
    ok = false;
  }
  if (!ok) return;

  submitBtn.disabled = true;
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Uploading…';

  try {
    const [thumbPath, videoPath] = await Promise.all([
      thumbFile ? uploadFile('thumbnails', thumbFile) : Promise.resolve(null),
      videoFile ? uploadFile('videos', videoFile) : Promise.resolve(null),
    ]);

    const { error: insertErr } = await window.sb.from('submissions').insert({
      full_name: document.getElementById('fullName').value.trim(),
      country:   document.getElementById('country').value.trim(),
      email:     document.getElementById('email').value.trim(),
      phone:     document.getElementById('phone').value.trim(),
      portfolio: document.getElementById('portfolio').value.trim(),
      thumbnail_url: thumbPath,
      video_url:     videoPath,
    });
    if (insertErr) throw insertErr;

    form.hidden = true;
    success.hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    console.error(err);
    alert('Sorry — your submission could not be sent. Please try again.\n\n' + (err.message || err));
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});
