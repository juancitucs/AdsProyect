// — Datos de ejemplo —
const subjects = ['Matemáticas','Física','Programación','Bases de Datos'];
const postsBySubject = Object.fromEntries(subjects.map(s => [s, []]));
let currentSubject = null;

// — Referencias DOM —
const listSub   = document.getElementById('subjects-list');
const feed      = document.getElementById('feed');
const recents   = document.getElementById('recent-posts');
const searchInp = document.getElementById('search-input');

const modal     = document.getElementById('modal');
const openModal = document.getElementById('open-modal');
const fab       = document.getElementById('fab');
const closeModal= document.getElementById('modal-close');
const modalForm = document.getElementById('post-form');
const subjSel   = document.getElementById('post-subject');

// **Nuevo**: referencia al botón de perfil
const profileBtn = document.getElementById('profile-btn');
const user       = 'Estudiante'; // o extrae el nombre como prefieras

// — Inicialización —
document.addEventListener('DOMContentLoaded', () => {
  // 1) Llenar materias
  subjects.forEach(s => {
    const li = document.createElement('li');
    li.className = 'nav-item';
    li.textContent = s;
    li.onclick = () => selectSubject(s, li);
    listSub.appendChild(li);
    subjSel.add(new Option(s, s));
  });
  renderRecents();

  // **Nuevo**: al hacer click en el avatar, vamos a perfil.html
  profileBtn.addEventListener('click', () => {
    window.location.href = 'perfil.html';
  });
});

// — Seleccionar materia —
function selectSubject(s, li) {
  currentSubject = s;
  document.querySelectorAll('#subjects-list .nav-item')
    .forEach(el => el.classList.toggle('active', el === li));
  renderFeed(postsBySubject[s]);
}

// — Renderizar feed —
function renderFeed(list = []) {
  feed.innerHTML = '';
  if (list.length === 0) {
    feed.innerHTML = '<p style="color:#777;text-align:center;">Sin posts aún.</p>';
    return;
  }
  list.forEach(p => {
    const card = document.createElement('div');
    card.className = 'post';
    card.innerHTML = `
      <div class="vote">
        <button>▲</button>
        <span class="score">${p.votes||0}</span>
        <button>▼</button>
      </div>
      <div class="post-body">
        <h4>${p.title}</h4>
        <p>${p.content}</p>
        ${p.image ? `<img src="${p.image}" alt="">` : ''}
        <small>${p.subject} • ${new Date(p.time).toLocaleString()} • ${user}</small>
      </div>`;
    feed.appendChild(card);
  });
}

// — Crear post —
function addPost(post) {
  postsBySubject[post.subject].unshift(post);
  if (post.subject === currentSubject) renderFeed(postsBySubject[post.subject]);
  renderRecents();
}

modalForm.addEventListener('submit', e => {
  e.preventDefault();
  const post = {
    subject: subjSel.value,
    title:   document.getElementById('post-title').value.trim(),
    content: document.getElementById('post-body').value.trim(),
    image:   document.getElementById('post-image').value.trim(),
    author:  user,
    time:    Date.now(),
    votes:   0
  };
  addPost(post);
  modalForm.reset();
  modal.classList.remove('show');
});

// — Recientes —
function renderRecents() {
  recents.innerHTML = '';
  const all = Object.values(postsBySubject).flat()
    .sort((a,b) => b.time - a.time)
    .slice(0,6);
  all.forEach(p => {
    const li = document.createElement('li');
    li.textContent = `${p.title} — ${p.subject}`;
    recents.appendChild(li);
  });
}

// — Búsqueda global —
searchInp.addEventListener('input', () => {
  const q = searchInp.value.trim().toLowerCase();
  if (!q) {
    if (currentSubject) renderFeed(postsBySubject[currentSubject]);
    else feed.innerHTML = '';
    return;
  }
  const all = Object.values(postsBySubject).flat();
  const found = all.filter(p =>
    p.title.toLowerCase().includes(q) ||
    p.content.toLowerCase().includes(q)
  );
  renderFeed(found);
});

// — Modal & FAB handlers —
openModal.onclick = () => modal.classList.add('show');
fab.onclick       = openModal.onclick;
closeModal.onclick= () => modal.classList.remove('show');
modal.onclick     = e => { if (e.target === modal) modal.classList.remove('show'); 
    
};


