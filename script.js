// Accordion: one open at a time
const faq = document.getElementById('faq');
if (faq) {
  faq.querySelectorAll('details').forEach((d) => {
    d.addEventListener('toggle', () => {
      if (d.open) faq.querySelectorAll('details').forEach((o) => { if (o !== d) o.open = false; });
    });
  });
}
// Smooth scroll only for in-page hash links
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length > 1) {
      const el = document.querySelector(id);
      if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth' }); }
    }
  });
});
