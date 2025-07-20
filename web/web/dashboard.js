
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

/* =====================  Utilidades  ========================== */
const getToken = () => localStorage.getItem('jwtToken');

const apiFetch = async (url, options = {}) => {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const tkn = getToken();
  if (tkn) headers.Authorization = `Bearer ${tkn}`;
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
      const errorBody = await res.json();
      console.error('API Fetch Error:', res.status, errorBody);
      throw new Error(errorBody.error || res.statusText);
  }
  return res.json();
};

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
  loadCurrentUserAvatar();
});

async function loadCurrentUserAvatar() {
  try {
    const user = await apiFetch('/api/users/me');
    const userAvatar = document.getElementById('user-avatar');
    if (user && user.perfil && user.perfil.foto) {
        userAvatar.src = user.perfil.foto;
        console.log('Avatar src set to:', userAvatar.src);
      } else {
        console.log('User or user.perfil.foto is missing. Using default avatar.');
        userAvatar.src = 'imagenes/usuario.png'; // Default avatar
        console.log('Avatar src set to default:', userAvatar.src);
      }
  } catch (error) {
    console.error('Error loading current user avatar:', error);
    const userAvatar = document.getElementById('user-avatar');
    userAvatar.src = 'imagenes/usuario.png'; // Fallback to default
  }
}

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
  const token = localStorage.getItem('jwtToken'); // Retrieve the token
  if (!token) {
    console.error('No JWT token found. User not authenticated.');
    // Optionally, redirect to login or show an error message
    return null; 
  }

  return (await fetch('/api/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // Add the Authorization header
    }, 
    body: JSON.stringify(body)
  })).json();
}

async function apiPatch(id, patchBody) {
  const token = localStorage.getItem('jwtToken'); // Retrieve the token
  if (!token) {
    console.error('No JWT token found. User not authenticated for PATCH.');
    return null; 
  }

  const url = `/api/posts/${id}`;
  const options = {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // Add the Authorization header
    },
    body: JSON.stringify(patchBody)
  };

  console.log('apiPatch - Sending request:', url, options);

  return (await fetch(url, options)).json();
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

    if (saved.error) {
      console.error('Error from server:', saved.details);
      alert(`Error al publicar: ${saved.details}`);
      return;
    }

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

  /* cuerpo */
  const body = document.createElement('div');
  body.className = 'post-body';
  body.innerHTML = `<h4>${p.title}</h4><p>${p.content}</p>`;
  if (p.image) {
    const img = document.createElement('img'); img.src = p.image; body.appendChild(img);
  }

  body.appendChild(createRatingBar(p));

  const small = document.createElement('small');
  small.className = 'post-meta'; // Add a class for styling
  small.innerHTML = `
    <img src="${p.autor?.perfil?.foto || 'imagenes/usuario.png'}" class="post-author-avatar" alt="${p.autor?.nombre || 'Usuario desconocido'}">
    <a href="perfil.html?id=${p.autor?._id}" class="post-author-link">${p.autor?.nombre || 'Usuario desconocido'}</a>
    • ${p.course} • ${new Date(p.time).toLocaleString()}
  `;
  body.appendChild(small);

  card.append(body);

  // Make the post body clickable to navigate to post.html
  body.addEventListener('click', () => {
    window.location.href = `post.html?id=${p._id}`;
  });

  return card;
}

/* =====================  Rating de cocos  ===================== */
function createRatingBar(post) {
  const div = document.createElement('div');
  div.className = 'coco-rating-container'; // Use a container for flexibility

  if (post.hasRated) {
    // If user has rated, display green icon and numerical average
    const ratedDisplay = document.createElement('div');
    ratedDisplay.className = 'rated-display';
    ratedDisplay.innerHTML = `
      <img src="imagenes/cocodrilo_highres.jpg" class="rated-icon" alt="Rated">
      <span class="rated-average">${post.averageRating.toFixed(1)}/5</span>
    `;
    div.appendChild(ratedDisplay);
  } else {
    // If user has not rated, display interactive coco-rating icons
    for (let i = 1; i <= 5; i++) {
      const img = document.createElement('img');
      img.src = COCO_ICON; img.dataset.val = i;
      img.className = 'coco-rating-icon'; // Add a class for styling

      img.onmouseenter = () => highlight(div, i);
      img.onmouseleave = () => highlight(div, post.averageRating); // Revert to average on mouseleave
      img.onclick = (e) => {
        e.stopPropagation(); // Stop event from bubbling up to the post body
        rate(post, i, div);
      };

      div.appendChild(img);
    }
    highlight(div, post.averageRating); // Initial highlight of average
  }
  return div;
}

const highlight = (c, v) => {
  // Only highlight if the container has interactive icons
  if (c.querySelector('.coco-rating-icon')) {
    [...c.querySelectorAll('.coco-rating-icon')].forEach(img => img.classList.toggle('active', img.dataset.val <= v));
  }
};
const avg = p => p.ratingCount > 0 ? (p.ratingTotal / p.ratingCount) : 0; // Keep avg for clarity, though averageRating is now stored

async function rate(post, val, container) {
  console.log('Sending rating update for post:', post._id, 'with value:', val);
  const upd = await apiPatch(post._id, { rating: val });

  if (upd.error) {
    // Apply error styling to icons
    [...container.querySelectorAll('.coco-rating-icon')].forEach(icon => {
      icon.classList.add('error');
    });

    // Remove error styling after a delay
    setTimeout(() => {
      [...container.querySelectorAll('.coco-rating-icon')].forEach(icon => {
        icon.classList.remove('error');
      });
    }, 1000); // Tremble for 1 second
    return;
  }

  Object.assign(post, upd);   // ratingTotal / ratingCount / averageRating / hasRated

  // After rating, replace icons with numerical average display
  container.innerHTML = ''; // Clear existing icons
  const ratedDisplay = document.createElement('div');
  ratedDisplay.className = 'rated-display';
  ratedDisplay.innerHTML = `
    <img src="imagenes/cocodrilo_highres.jpg" class="rated-icon" alt="Rated">
    <span class="rated-average">${post.averageRating.toFixed(1)}/5</span>
  `;
  container.appendChild(ratedDisplay);
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

