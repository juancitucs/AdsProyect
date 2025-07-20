
/* =====================  Datos iniciales  ===================== */
let courses = []; // Will be populated from API
const COCO_ICON = 'imagenes/coco-chibi.png';

/* posts por curso; se irán llenando desde la API */
const postsByCourse = {}; // Will be populated dynamically based on fetched courses
let currentCourse = null; // Will be set after courses are loaded

/* =====================  Top usuarios  ================= */
// No longer a mock, data will be fetched from API

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
const topUsersTableBody = document.getElementById('top-users-body');

const menuInicio = document.getElementById('menu-inicio'); // Added DOM ref
const menuCursos = document.getElementById('menu-cursos');
const arrowCursos = document.getElementById('arrow-cursos');
const listaCursos = document.getElementById('lista-cursos');

// Admin elements
const menuAdmin = document.getElementById('menu-admin');
const menuAdminHeader = document.getElementById('menu-admin-header');
const arrowAdmin = document.getElementById('arrow-admin');
const listaAdmin = document.getElementById('lista-admin');
const adminCourseModal = document.getElementById('admin-course-modal');
const adminCourseModalClose = document.getElementById('admin-course-modal-close');
const addCourseForm = document.getElementById('add-course-form');
const addCourseId = document.getElementById('add-course-id');
const addCourseName = document.getElementById('add-course-name');
const addCourseDescription = document.getElementById('add-course-description');
const deleteCourseForm = document.getElementById('delete-course-form');
const deleteCourseSelect = document.getElementById('delete-course-select');

let currentUserRole = null; // To store the role of the logged-in user

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
  const loggedInUser = await loadCurrentUserAvatar(); // Load user role and get user object
  await loadCourses(); // Load courses
  
  /* selector en el modal */
  courses.forEach(c => courseSel.add(new Option(c.nombre, c.nombre)));
  
  // Initialize postsByCourse for all courses
  courses.forEach(c => postsByCourse[c.nombre] = []);

  populateCursosSidebar();
  attachSidebarHandlers();

  await loadAndRenderInitialFeed(loggedInUser); // Load and render initial feed based on favorites
  
  // Set initial active state for sidebar
  if (menuInicio) menuInicio.classList.add('active');
  if (menuCursos) menuCursos.classList.remove('active');

  await loadTopUsers(); // Call the new function to load top users
  setupModalHandlers();
  setupSearch();
});

async function loadAndRenderInitialFeed(user) {
  let coursesToLoad = [];

  if (user && user.favoritos && user.favoritos.length > 0) {
    coursesToLoad = user.favoritos;
    console.log('Loading posts from favorite courses:', coursesToLoad);
  } else if (courses.length > 0) {
    coursesToLoad = [courses[0].nombre]; // Fallback to the first course if no favorites
    console.log('No favorite courses, loading posts from default course:', coursesToLoad[0]);
  } else {
    feed.innerHTML = '<p style="color:#777;text-align:center;">No hay cursos disponibles.</p>';
    return;
  }

  // Load posts for all selected courses
  await Promise.all(coursesToLoad.map(courseName => loadPosts(courseName)));

  // Combine posts from all loaded courses and sort by time
  let initialPosts = [];
  coursesToLoad.forEach(courseName => {
    initialPosts = initialPosts.concat(postsByCourse[courseName] || []);
  });
  initialPosts.sort((a, b) => new Date(b.time) - new Date(a.time));

  // Set currentCourse to the first favorite or default course for sidebar highlighting
  if (coursesToLoad.length > 0) {
    currentCourse = coursesToLoad[0];
    // Update sidebar active class for the initial course
    // This is handled by the initial active state of menuInicio, so no change here
  }

  renderFeed(initialPosts);
}

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
    
    // Store user role and conditionally display admin menu
    if (user && (user.tipo === 'admin' || user.tipo === 'moderator')) {
      currentUserRole = user.tipo;
      menuAdmin.style.display = 'block'; // Show the admin menu
    }
    return user; // Return the user object

  } catch (error) {
    console.error('Error loading current user avatar:', error);
    const userAvatar = document.getElementById('user-avatar');
    userAvatar.src = 'imagenes/usuario.png'; // Fallback to default
    return null; // Return null on error
  }
}

async function loadCourses() {
  try {
    courses = await apiFetch('/api/courses');
    console.log('Loaded courses:', courses);
  } catch (error) {
    console.error('Error loading courses:', error);
    courses = []; // Fallback to empty array
  }
}

/* ---------- llenar lista colapsable ------------- */
function populateCursosSidebar() {
  listaCursos.innerHTML = ''; // Clear existing list items
  courses.forEach(curso => {
    const li = document.createElement('li');
    li.textContent = curso.nombre;
    li.dataset.curso = curso.nombre;
    if (curso.nombre === currentCourse) li.classList.add('active');
    listaCursos.appendChild(li);
  });
}

/* ---------- abrir/cerrar lista + click en curso -- */
function attachSidebarHandlers() {
  // Handle click on 'Inicio'
  if (menuInicio) {
    menuInicio.addEventListener('click', async () => {
      // Deactivate other menu items
      if (menuCursos) menuCursos.classList.remove('active');
      [...listaCursos.children].forEach(li => li.classList.remove('active'));
      // Activate 'Inicio'
      menuInicio.classList.add('active');
      // Re-render initial feed
      const loggedInUser = await loadCurrentUserAvatar(); // Re-fetch user to ensure latest favorites
      await loadAndRenderInitialFeed(loggedInUser);
    });
  }

  // Handle click on 'Cursos' header
  menuCursos.addEventListener('click', () => {
    const isOpen = listaCursos.style.maxHeight;
    if (isOpen) {
      closeCursos();
    } else {
      openCursos();
    }
    // When Cursos header is clicked, activate it and deactivate Inicio
    if (menuCursos) menuCursos.classList.add('active');
    if (menuInicio) menuInicio.classList.remove('active');
  });

  // Handle click on individual course in 'Cursos' list
  listaCursos.addEventListener('click', async e => {
    if (e.target.tagName !== 'LI') return;
    const curso = e.target.dataset.curso;
    if (curso === currentCourse) return;

    currentCourse = curso;

    // Deactivate 'Inicio' and activate 'Cursos' header
    if (menuInicio) menuInicio.classList.remove('active');
    if (menuCursos) menuCursos.classList.add('active');

    [...listaCursos.children].forEach(li => li.classList.toggle('active', li.dataset.curso === curso));

    if (postsByCourse[curso].length === 0) await loadPosts(curso);
    renderFeed(postsByCourse[curso]);
  });

  // Admin menu handlers
  menuAdminHeader.addEventListener('click', () => {
    const isOpen = listaAdmin.style.maxHeight;
    if (isOpen) {
      listaAdmin.style.maxHeight = '';
      arrowAdmin.style.transform = '';
    } else {
      listaAdmin.style.maxHeight = listaAdmin.scrollHeight + 'px';
      arrowAdmin.style.transform = 'rotate(180deg)';
    }
  });

  document.getElementById('admin-manage-courses').addEventListener('click', () => {
    adminCourseModal.classList.add('show');
    populateDeleteCourseSelect();
  });

  adminCourseModalClose.addEventListener('click', () => {
    adminCourseModal.classList.remove('show');
  });

  addCourseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newCourse = {
      _id: addCourseId.value.trim(),
      nombre: addCourseName.value.trim(),
      descripcion: addCourseDescription.value.trim()
    };

    try {
      await apiFetch('/api/courses', { method: 'POST', body: JSON.stringify(newCourse) });
      alert('Curso agregado exitosamente!');
      addCourseForm.reset();
      await loadCourses(); // Reload courses to update sidebar and dropdowns
      populateCursosSidebar();
      populateDeleteCourseSelect();
      // Re-render feed if current course is affected or if we want to show new course posts
      if (currentCourse) {
        await loadPosts(currentCourse);
        renderFeed(postsByCourse[currentCourse]);
      }
    } catch (error) {
      console.error('Error adding course:', error);
      alert(`Error al agregar curso: ${error.message}`);
    }
  });

  deleteCourseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const courseIdToDelete = deleteCourseSelect.value;
    if (!courseIdToDelete) return;

    if (confirm('¿Estás seguro de que quieres eliminar este curso? Esto eliminará todos los posts asociados.')) {
      try {
        await apiDelete(`/api/courses/${courseIdToDelete}`);
        alert('Curso eliminado exitosamente!');
        deleteCourseForm.reset();
        await loadCourses(); // Reload courses to update sidebar and dropdowns
        populateCursosSidebar();
        populateDeleteCourseSelect();
        // Potentially clear feed if the current course was deleted
        if (currentCourse === courseIdToDelete) {
          currentCourse = courses.length > 0 ? courses[0].nombre : null;
          if (currentCourse) {
            await loadPosts(currentCourse);
            renderFeed(postsByCourse[currentCourse]);
          } else {
            feed.innerHTML = '<p style="color:#777;text-align:center;">No hay cursos disponibles.</p>';
          }
        }
      } catch (error) {
        console.error('Error deleting course:', error);
        alert(`Error al eliminar curso: ${error.message}`);
      }
    }
  });
}

function populateDeleteCourseSelect() {
  deleteCourseSelect.innerHTML = '';
  courses.forEach(course => {
    const option = document.createElement('option');
    option.value = course._id;
    option.textContent = `${course.nombre} (${course._id})`;
    deleteCourseSelect.appendChild(option);
  });
  if (courses.length > 0) {
    deleteCourseSelect.value = courses[0]._id;
  }
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

async function apiDelete(url) {
  const token = localStorage.getItem('jwtToken');
  if (!token) {
    console.error('No JWT token found. User not authenticated for DELETE.');
    return null;
  }

  const options = {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  const res = await fetch(url, options);
  if (!res.ok) {
    const errorBody = await res.json();
    console.error('API Delete Error:', res.status, errorBody);
    throw new Error(errorBody.error || res.statusText);
  }
  return res.json();
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

  // Add delete button for admin/moderator users
  if (currentUserRole === 'admin' || currentUserRole === 'moderator') {
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete-post';
    deleteBtn.textContent = 'Eliminar Post';
    deleteBtn.onclick = async (e) => {
      e.stopPropagation(); // Prevent navigating to post.html
      if (confirm('¿Estás seguro de que quieres eliminar esta publicación?')) {
        try {
          await apiDelete(`/api/posts/${p._id}`);
          alert('Publicación eliminada exitosamente.');
          // Remove the post from the UI
          card.remove();
          // Also remove from postsByCourse to keep data consistent
          postsByCourse[p.course] = postsByCourse[p.course].filter(post => post._id !== p._id);
        } catch (error) {
          console.error('Error deleting post:', error);
          alert(`Error al eliminar publicación: ${error.message}`);
        }
      }
    };
    card.appendChild(deleteBtn);
  }

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
      courses.map(c => c.nombre).filter(c => postsByCourse[c] && postsByCourse[c].length === 0).map(loadPosts)
    );

    const all = Object.values(postsByCourse).flat();
    const list = !q ? postsByCourse[currentCourse]
      : all.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q));
    renderFeed(list);
  });
}

/* =====================  Top-usuarios  ================= */
async function loadTopUsers() {
  try {
    const topUsers = await apiFetch('/api/users/top');
    renderTopUsers(topUsers);
  } catch (error) {
    console.error('Error loading top users:', error);
    topUsersTableBody.innerHTML = '<tr><td colspan="3">Error al cargar los usuarios principales.</td></tr>';
  }
}

function renderTopUsers(users) {
  topUsersTableBody.innerHTML = ''; // Clear existing content
  if (users.length === 0) {
    topUsersTableBody.innerHTML = '<tr><td colspan="3">No hay usuarios para mostrar.</td></tr>';
    return;
  }

  users.forEach((user, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>
        <img src="${user.foto || 'imagenes/usuario.png'}" class="user-avatar" alt="${user.nombre}">
        <a href="perfil.html?id=${user.userId}">${user.nombre}</a>
      </td>
      <td>${user.overallAverageRating}</td>
    `;
    topUsersTableBody.appendChild(row);
  });
}

