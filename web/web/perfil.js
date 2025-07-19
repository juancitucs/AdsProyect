
document.addEventListener('DOMContentLoaded', async () => {
  /* ---------------- Utilidades ---------------- */
  const qs = new URLSearchParams(location.search);
  const getToken = () => localStorage.getItem('jwtToken');

  const apiFetch = async (url, options = {}) => {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    const tkn = getToken();
    if (tkn) headers.Authorization = `Bearer ${tkn}`;
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) throw new Error((await res.json()).error || res.statusText);
    return res.json();
  };

  /* ---------------- Elementos DOM ------------- */
  const pageTitle = document.getElementById('page-title');
  const tabs = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');
  const avatarPreview = document.getElementById('avatar-preview');
  const usernameInp = document.getElementById('username');
  const emailInp = document.getElementById('email');
  const bioInp = document.getElementById('bio');
  const postsList = document.getElementById('posts-list');

  /* ---------------- Estado -------------------- */
  let profileUser = null;   // usuario mostrado

  /* ---------------- Funciones UI -------------- */
  const populateProfile = (u) => {
    usernameInp.value = u.nombre ?? '';
    emailInp.value = u.email ?? '';
    bioInp.value = u.perfil?.bio ?? '';
    avatarPreview.src = u.perfil?.foto ?? 'imagenes/workcodile-perfil2.png';
    
    pageTitle.textContent = `Perfil de ${u.nombre}`;
  };

  const renderPosts = (posts) => {
    postsList.innerHTML = posts.length
      ? posts.map(p =>
        `<li><span>${p.title}</span></li>`
      ).join('')
      : '<li>No hay posts.</li>';
  };

  /* ---------------- Cargar datos -------------- */
  async function loadData() {
    try {
      // 1. Obtener el ID del perfil de la URL
      const profileId = qs.get('id');
      if (!profileId) {
        alert('ID de perfil no especificado.');
        window.location = '/index.html'; // Redirigir si no hay ID
        return;
      }

      // 2. Cargar el perfil del usuario
      profileUser = await apiFetch(`/api/users/${profileId}`);
      populateProfile(profileUser);

      // 3. Asegurarse de que la pestaña de posts esté activa por defecto
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      document.querySelector('[data-tab="posts"]').classList.add('active');
      document.getElementById('tab-posts').classList.add('active');

      // 4. Cargar posts inicialmente
      await fetchUserPosts();
    } catch (err) {
      alert(`Error: ${err.message || 'no se pudo cargar el perfil'}`);
      window.location = '/index.html';
    }
  }

  /* ---------------- Posts --------------------- */
  async function fetchUserPosts() {
    try {
      const posts = await apiFetch(`/api/users/${profileUser._id}/posts`);
      renderPosts(posts);
    } catch (err) { console.error(err); }
  }

  /* ---------------- Eventos ------------------- */
  // Navegación entre tabs
  tabs.forEach(btn => btn.addEventListener('click', () => {
    // Solo permitir navegación si no es la pestaña de edición (que ya no existe)
    tabs.forEach(b => b.classList.remove('active'));
    contents.forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');

    if (btn.dataset.tab === 'posts') fetchUserPosts();
  }));

  document.getElementById('back-btn').onclick = () => history.back();

  const backBtn = document.getElementById('back-btn');
  if (backBtn) backBtn.onclick = () => history.back();

  /* ---------------- Init --------------------- */
  loadData();
});

