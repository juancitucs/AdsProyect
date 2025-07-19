
/* =====================  Datos iniciales  ===================== */
const COURSES = ['Algoritmos', 'Física I', 'BD Avanzadas', 'POO'];
const COCO_ICON = 'imagenes/coco-chibi.png';

/* posts por curso; se irán llenando desde la API */
const postsByCourse = Object.fromEntries(COURSES.map(c => [c, []]));
let currentCourse = COURSES[0];

/* =====================  Top usuarios (mock)  ================= */
const topUsers = [
  { name: 'Ana Torres', avatar: 'imagenes/usuario.png', points: 1520 },
  { name: 'Carlos Pérez', avatar: 'imagenes/usuario.png', points: 1390 },
  { name: 'María López', avatar: 'imagenes/usuario.png', points: 1275 },
  { name: 'Luis Gómez', avatar: 'imagenes/usuario.png', points: 1180 },
  { name: 'Sofía Díaz', avatar: 'imagenes/usuario.png', points: 1105 }
];

/* =====================  DOM refs  ============================ */
const feed = document.getElementById('feed');
const searchInp = document.getElementById('search-input');
const modal = document.getElementById('modal');
const openModalBtn = document.getElementById('open-modal');
const fab = document.getElementById('fab');
const closeModal = document.getElementById('modal-close');
const modalForm = document.getElementById('post-form');
const courseSel = document.getElementById('post-course');
const titleInp = document.getElementById('post-title');
const bodyInp = document.getElementById('post-body');
const imgInp = document.getElementById('post-image');
const imgPrev = document.getElementById('post-preview');
const btnPublish = document.getElementById('btn-publish');
const topUsersUL = document.getElementById('top-users');

const menuCursos = document.getElementById('menu-cursos');
const arrowCursos = document.getElementById('arrow-cursos');
const listaCursos = document.getElementById('lista-cursos');

/* =====================  Inicialización  ====================== */
document.addEventListener('DOMContentLoaded', async () => {
  /* selector en el modal */
  COURSES.forEach(c => courseSel.add(new Option(c, c)));
  courseSel.value = currentCourse;

  populateCursosSidebar();
  attachSidebarHandlers();

  await loadPosts(currentCourse);
  renderFeed(postsByCourse[currentCourse]);
  renderTopUsers();
  setupModalHandlers();
  setupSearch();
});

/* ---------- llenar lista colapsable ------------- */
function populateCursosSidebar() {
  COURSES.forEach(curso => {
    const li = document.createElement('li');
    li.textContent = curso;
    li.dataset.curso = curso;
    if (curso === currentCourse) li.classList.add('active');
    listaCursos.appendChild(li);
  });
}

/* ---------- abrir/cerrar lista + click en curso -- */
function attachSidebarHandlers() {
  menuCursos.addEventListener('click', () => {
    const isOpen = listaCursos.style.maxHeight;
    if (isOpen) {
      closeCursos();
    } else {
      openCursos();
    }
  });

  listaCursos.addEventListener('click', async e => {
    if (e.target.tagName !== 'LI') return;
    const curso = e.target.dataset.curso;
    if (curso === currentCourse) return;

    currentCourse = curso;

    [...listaCursos.children].forEach(li => li.classList.toggle('active', li.dataset.curso === curso));

    if (postsByCourse[curso].length === 0) await loadPosts(curso);
    renderFeed(postsByCourse[curso]);
  });
}

function openCursos() { listaCursos.style.maxHeight = listaCursos.scrollHeight + 'px'; arrowCursos.style.transform = 'rotate(180deg)'; }
function closeCursos() { listaCursos.style.maxHeight = ''; arrowCursos.style.transform = ''; }

/* =====================  API calls  =========================== */
async function loadPosts(course) {
  try {
    const res = await fetch(`/api/posts?course=${encodeURIComponent(course)}`);
    postsByCourse[course] = await res.json();
  } catch (err) {
    console.error('Error al cargar posts:', err);
    postsByCourse[course] = [];
  }
}

async function apiCreate(body) {
  return (await fetch('/api/posts', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  })).json();
}

async function apiPatch(id, patchBody) {
  return (await fetch(`/api/posts/${id}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patchBody)
  })).json();
}

/* =====================  Modal & publicación  ================= */
function setupModalHandlers() {
  /* abrir / cerrar */
  openModalBtn.addEventListener('click', () => modal.classList.add('show'));
  fab.addEventListener('click', () => modal.classList.add('show'));
  closeModal.addEventListener('click', () => modal.classList.remove('show'));

  /* validación dinámica + preview */
  [courseSel, titleInp, bodyInp].forEach(i => i.addEventListener('input', validateForm));
  imgInp.addEventListener('input', handleImagePreview);

  /* submit */
  modalForm.addEventListener('submit', async e => {
    e.preventDefault();
    const newPost = buildPostObject();
    const saved = await apiCreate(newPost);

    postsByCourse[saved.course].unshift(saved);
    if (saved.course === currentCourse) renderFeed(postsByCourse[currentCourse]);

    modalForm.reset(); imgPrev.style.display = 'none'; btnPublish.disabled = true;
    modal.classList.remove('show');
  });
}

function validateForm() {
  btnPublish.disabled =
    !(courseSel.value && titleInp.value.trim().length >= 4 && bodyInp.value.trim().length >= 8);
}

function handleImagePreview() {
  const url = imgInp.value.trim();
  if (/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(url)) {
    imgPrev.src = url; imgPrev.style.display = 'block';
  } else imgPrev.style.display = 'none';
}

const buildPostObject = () => ({
  course: courseSel.value,
  title: titleInp.value.trim(),
  content: bodyInp.value.trim(),
  image: imgInp.value.trim()
});

/* =====================  Feed y tarjetas  ===================== */
function renderFeed(list) {
  feed.innerHTML = '';
  if (list.length === 0) {
    feed.innerHTML = '<p style="color:#777;text-align:center;">Sin posts aún.</p>';
    return;
  }
  list.forEach(p => feed.appendChild(createCard(p)));
}

function createCard(p) {
  const card = document.createElement('div');
  card.className = 'post';

  /* votos */
  const vote = document.createElement('div');
  vote.className = 'vote';
  vote.innerHTML =
    `<button class="up">▲</button>
     <span class="score">${p.votes}</span>
     <button class="down">▼</button>`;

  vote.querySelector('.up').addEventListener('click', () => votePost(p, +1, vote));
  vote.querySelector('.down').addEventListener('click', () => votePost(p, -1, vote));

  /* cuerpo */
  const body = document.createElement('div');
  body.className = 'post-body';
  body.innerHTML = `<h4>${p.title}</h4><p>${p.content}</p>`;
  if (p.image) {
    const img = document.createElement('img'); img.src = p.image; body.appendChild(img);
  }

  body.appendChild(createRatingBar(p));

  const small = document.createElement('small');
  small.textContent = `${p.course} • ${new Date(p.time).toLocaleString()}`;
  body.appendChild(small);

  card.append(vote, body);
  return card;
}

/* votos ▲ / ▼ */
async function votePost(post, delta, domVote) {
  const { votes } = await apiPatch(post._id, { $inc: { votes: delta } });
  post.votes = votes;
  domVote.querySelector('.score').textContent = votes;
}

/* =====================  Rating de cocos  ===================== */
function createRatingBar(post) {
  const div = document.createElement('div'); div.className = 'coco-rating';
  highlight(div, post.userRating || avg(post));

  for (let i = 1; i <= 5; i++) {
    const img = document.createElement('img');
    img.src = COCO_ICON; img.dataset.val = i;

    img.onmouseenter = () => highlight(div, i);
    img.onmouseleave = () => highlight(div, post.userRating || avg(post));
    img.onclick = () => rate(post, i, div);

    div.appendChild(img);
  }
  return div;
}

const highlight = (c, v) => [...c.children].forEach(img => img.classList.toggle('active', img.dataset.val <= v));
const avg = p => p.ratingCount ? Math.round(p.ratingTotal / p.ratingCount) : 0;

async function rate(post, val, container) {
  const upd = await apiPatch(post._id, { rating: val });
  Object.assign(post, upd);   // ratingTotal / ratingCount / userRating
  highlight(container, val);
}

/* =====================  Búsqueda  ============================ */
function setupSearch() {
  searchInp.addEventListener('input', async () => {
    const q = searchInp.value.trim().toLowerCase();

    /* carga diferida de cursos no visitados */
    await Promise.all(
      COURSES.filter(c => postsByCourse[c].length === 0).map(loadPosts)
    );

    const all = Object.values(postsByCourse).flat();
    const list = !q ? postsByCourse[currentCourse]
      : all.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q));
    renderFeed(list);
  });
}

/* =====================  Top-usuarios (mock)  ================= */
function renderTopUsers() {
  topUsersUL.innerHTML = '';
  topUsers.forEach((u, i) => {
    const li = document.createElement('li');
    li.className = 'user-item';
    li.innerHTML =
      `<span class="user-rank">${i + 1}</span>
       <img src="${u.avatar}" class="user-avatar" alt="${u.name}">
       <div class="user-info">
         <span class="user-name">${u.name}</span>
         <span class="user-points">${u.points} pts</span>
       </div>`;
    topUsersUL.appendChild(li);
  });
}

