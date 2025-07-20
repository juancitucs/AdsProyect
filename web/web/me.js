
document.addEventListener('DOMContentLoaded', async () => {
  /* ---------------- Utilidades ---------------- */
  const getToken = () => {
    const token = localStorage.getItem('jwtToken');
    console.log('JWT Token:', token);
    return token;
  };

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

  /* ---------------- Elementos DOM ------------- */
  const pageTitle = document.getElementById('page-title');
  const tabs = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');
  const tabEditBtn = document.getElementById('tab-edit-btn');
  const avatarUrlInput = document.getElementById('avatar-url-input');
  const avatarPreview = document.getElementById('avatar-preview');
  const avatarUploadBtn = document.querySelector('.avatar-upload-btn');
  const usernameInp = document.getElementById('username');
  const emailInp = document.getElementById('email');
  const bioInp = document.getElementById('bio');
  const passwordFields = document.getElementById('password-fields');
  const editBtn = document.getElementById('edit-btn');
  const saveBtn = document.getElementById('save-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  const profileForm = document.getElementById('profile-form');
  const postsList = document.getElementById('posts-list');
  const commentsList = document.getElementById('comments-list');
  const coursesGrid = document.getElementById('courses-grid');

  let courses = []; // Global variable to store all courses

  /* ---------------- Estado -------------------- */
  let currentUser = null;   // usuario logeado
  let profileUser = null;   // usuario mostrado
  let isOwnProfile = false;  // ¿coinciden los IDs?
  let currentEditingPost = null; // To store the post being edited

  /* ---------------- Funciones UI -------------- */
  const setEditMode = (on) => {
    usernameInp.readOnly = !on;
    bioInp.readOnly = !on;
    avatarUrlInput.readOnly = !on;
    avatarUploadBtn.style.display = on ? 'block' : 'none';
    avatarUrlInput.style.display = on ? 'block' : 'none';
    saveBtn.style.display = on ? 'inline-block' : 'none';
    cancelBtn.style.display = on ? 'inline-block' : 'none';
    editBtn.style.display = on ? 'none' : 'inline-block';
  };

  const populateProfile = (u) => {
    usernameInp.value = u.nombre ?? '';
    emailInp.value = u.email ?? '';
    bioInp.value = u.perfil?.bio ?? '';
    avatarPreview.src = u.perfil?.foto ?? 'imagenes/workcodile-perfil2.png';
    avatarUrlInput.value = u.perfil?.foto ?? '';
    pageTitle.textContent = `Perfil de ${u.nombre}`;
  };

  const renderPosts = (posts) => {
    postsList.innerHTML = posts.length
      ? posts.map(p =>
        `<li data-post-id="${p._id}">
           <span class="post-title-link">${p.title}</span>
           <div class="post-actions">
             <button class="edit-btn" data-id="${p._id}">✏️</button>
             <button class="delete-btn" data-id="${p._id}">🗑️</button>
           </div>
         </li>`
      ).join('')
      : '<li>No hay posts.</li>';

    // Add event listener for post title clicks
    postsList.querySelectorAll('.post-title-link').forEach(span => {
      span.addEventListener('click', (e) => {
        const postId = e.target.closest('li').dataset.postId;
        window.location.href = `post.html?id=${postId}`;
      });
    });

    // Add event listeners to delete buttons
    postsList.querySelectorAll('.delete-btn').forEach(button => {
      button.addEventListener('click', async (e) => {
        const postId = e.target.dataset.id;
        if (confirm('¿Estás seguro de que quieres eliminar esta publicación?')) {
          try {
            await apiFetch(`/api/posts/${postId}`, { method: 'DELETE' });
            alert('Publicación eliminada exitosamente.');
            fetchUserPosts(); // Re-fetch posts to update the list
          } catch (err) {
            alert(`Error al eliminar la publicación: ${err.message}`);
          }
        }
      });
    });

    // Add event listeners to edit buttons
    postsList.querySelectorAll('.edit-btn').forEach(button => {
      button.addEventListener('click', async (e) => {
        const postId = e.target.dataset.id;
        // Fetch the specific post data to populate the modal
        try {
          const postToEdit = await apiFetch(`/api/posts/${postId}`); // Assuming a GET /api/posts/:id exists or can be adapted
          currentEditingPost = postToEdit;
          populateEditModal(postToEdit);
          editPostModal.classList.add('show');
        } catch (err) {
          alert(`Error al cargar la publicación para editar: ${err.message}`);
        }
      });
    });
  };

  // Populate the edit modal with post data
  const populateEditModal = (post) => {
    editPostCourseSelect.innerHTML = '';
    // Courses will be populated dynamically from the global `courses` array
    courses.forEach(c => editPostCourseSelect.add(new Option(c.nombre, c.nombre)));

    editPostCourseSelect.value = post.course || '';
    editPostTitleInput.value = post.title || '';
    editPostBodyTextarea.value = post.content || '';
    editPostImageInput.value = post.image || '';
    editPostImagePreview.src = post.image || '';
    editPostImagePreview.style.display = post.image ? 'block' : 'none';
    editPostForm.dataset.postId = post._id; // Store post ID in form dataset
  };

  const renderComments = (comments) => {
    commentsList.innerHTML = comments.length
      ? comments.map(c =>
        `<li data-comment-id="${c._id}">
           <p>${c.content}</p>
           <small>En post: <a href="post.html?id=${c.postId._id}">${c.postId.title}</a></small>
         </li>`
      ).join('')
      : '<li>No hay comentarios.</li>';

    // Add event listener for comment clicks (optional, if you want to highlight or do something else)
    commentsList.querySelectorAll('li').forEach(li => {
      li.addEventListener('click', (e) => {
        // Example: console.log('Comment clicked:', e.currentTarget.dataset.commentId);
      });
    });
  };

  const renderCourses = (allCourses, userFavorites) => {
    coursesGrid.innerHTML = ''; // Clear previous content
    if (allCourses.length === 0) {
      coursesGrid.innerHTML = '<p>No hay cursos disponibles.</p>';
      return;
    }

    allCourses.forEach(course => {
      const isFavorite = userFavorites.includes(course.nombre); // Check by course name
      const heartIcon = isFavorite ? '❤️' : '🤍'; // Filled or empty heart

      const courseCard = document.createElement('div');
      courseCard.className = 'course-card';
      courseCard.dataset.courseName = course.nombre; // Store course name for toggling

      courseCard.innerHTML = `
        <h3>${course.nombre}</h3>
        <p>${course.descripcion}</p>
        <span class="favorite-icon">${heartIcon}</span>
      `;

      const favoriteIconSpan = courseCard.querySelector('.favorite-icon');
      favoriteIconSpan.addEventListener('click', async () => {
        await toggleFavorite(course.nombre, isFavorite);
      });

      coursesGrid.appendChild(courseCard);
    });
  };

  /* ---------------- Cargar datos -------------- */
  async function loadData() {
    try {
      // Siempre carga el perfil del usuario logeado
      profileUser = await apiFetch('/api/users/me');
      console.log('Profile User Data:', profileUser);

      // Explicitly check if profileUser is valid
      if (!profileUser || !profileUser._id) {
        throw new Error('No se pudo cargar la información del perfil o el usuario no está autenticado.');
      }

      currentUser = profileUser; // Para consistencia, ya que es el propio usuario
      isOwnProfile = true; // Siempre es el propio perfil
      populateProfile(profileUser);
      setEditMode(false); // Inicia en modo visualización, pero editable

      // Load all courses
      courses = await apiFetch('/api/courses');

      // Render favorite courses grid
      renderCourses(courses, profileUser.favoritos || []);

      // 4. cargar posts inicialmente
      await fetchUserPosts();
    } catch (err) {
      console.error('Error loading data:', err);
      alert(`Error: ${err.message || 'no se pudo cargar el perfil'}`);
      window.location = '/index.html';
    }
  }

  /* ---------------- Posts --------------------- */
  async function fetchUserPosts() {
    if (!profileUser || !profileUser._id) {
      console.error('Error: profileUser no está definido o no tiene _id. No se pueden cargar los posts.');
      postsList.innerHTML = '<li>No se pudo cargar los posts del usuario.</li>';
      return;
    }
    try {
      // Fetch posts for the current user
      const posts = await apiFetch(`/api/users/${profileUser._id}/posts`);
      renderPosts(posts);
    } catch (err) { console.error(err); }
  }

  /* ---------------- Comments ------------------ */
  async function fetchUserComments() {
    if (!profileUser || !profileUser._id) {
      console.error('Error: profileUser no está definido o no tiene _id. No se pueden cargar los comentarios.');
      commentsList.innerHTML = '<li>No se pudo cargar los comentarios del usuario.</li>';
      return;
    }
    try {
      const comments = await apiFetch(`/api/user/${profileUser._id}`);
      renderComments(comments);
    } catch (err) { console.error(err); }
  }

  /* ---------------- Favorites ----------------- */
  async function toggleFavorite(courseName, isCurrentlyFavorite) {
    const action = isCurrentlyFavorite ? 'remove' : 'add';
    try {
      const updatedUser = await apiFetch('/api/users/favorites', {
        method: 'PATCH',
        body: JSON.stringify({ course: courseName, action: action })
      });
      // Update profileUser's favorites locally
      profileUser.favoritos = updatedUser.favoritos;
      // Re-render courses to reflect the change
      renderCourses(courses, profileUser.favoritos);
    } catch (err) {
      console.error('Error toggling favorite:', err);
      alert(`Error al actualizar favoritos: ${err.message}`);
    }
  }

  /* ---------------- Eventos ------------------- */
  // Navegación entre tabs
  tabs.forEach(btn => btn.addEventListener('click', () => {
    console.log('Tab clicked:', btn.dataset.tab);
    tabs.forEach(b => b.classList.remove('active'));
    contents.forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');

    if (btn.dataset.tab === 'posts') {
      fetchUserPosts();
    } else if (btn.dataset.tab === 'comments') {
      fetchUserComments();
    } else if (btn.dataset.tab === 'favorites') {
      renderCourses(courses, profileUser.favoritos || []); // Re-render favorites tab
    }
  }));

  document.getElementById('back-btn').onclick = () => history.back();

  const backBtn = document.getElementById('back-btn');
  if (backBtn) backBtn.onclick = () => history.back();

  

  // Editar / cancelar
  editBtn.onclick = () => setEditMode(true);
  cancelBtn.onclick = () => { populateProfile(profileUser); setEditMode(false); };

  // Guardar cambios
  profileForm.addEventListener('submit', async e => {
    e.preventDefault();
    try {
      const body = JSON.stringify({
        nombre: usernameInp.value,
        bio: bioInp.value,
        foto: avatarUrlInput.value
      });
      profileUser = await apiFetch('/api/users/me', { method: 'PATCH', body });
      populateProfile(profileUser);
      setEditMode(false);
      alert('Perfil actualizado.');
    } catch (err) { alert(err.message); }
  });

  /* ---------------- Init --------------------- */
  loadData();
});

