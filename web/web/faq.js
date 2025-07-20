
document.addEventListener('DOMContentLoaded', async () => {
  /* ---------------- Utilidades ---------------- */
  const getToken = () => {
    const token = localStorage.getItem('jwtToken');
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

  /* ---------------- DOM Elements ---------------- */
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-button');

  // Sidebar elements (for consistent navigation)
  const menuInicio = document.getElementById('menu-inicio');
  const menuCursos = document.getElementById('menu-cursos');
  const menuSoporte = document.getElementById('menu-soporte');
  const menuFaq = document.getElementById('menu-faq');
  const menuAdmin = document.getElementById('menu-admin');

  // Top users (for consistent layout)
  const topUsersTableBody = document.getElementById('top-users-body');

  let currentUserRole = null; // To store the role of the logged-in user

  /* ---------------- Functions ---------------- */
  async function loadCurrentUserAvatar() {
    try {
      const user = await apiFetch('/api/users/me');
      const userAvatar = document.getElementById('user-avatar');
      if (user && user.perfil && user.perfil.foto) {
          userAvatar.src = user.perfil.foto;
        } else {
          userAvatar.src = 'imagenes/usuario.png'; // Default avatar
        }
      
      // Store user role and conditionally display admin menu
      if (user && (user.tipo === 'admin' || user.tipo === 'moderator')) {
        currentUserRole = user.tipo;
        if (menuAdmin) menuAdmin.style.display = 'block'; // Show the admin menu
      }
      return user; // Return the user object

    } catch (error) {
      console.error('Error loading current user avatar:', error);
      const userAvatar = document.getElementById('user-avatar');
      userAvatar.src = 'imagenes/usuario.png'; // Fallback to default
      return null; // Return null on error
    }
  }

  async function loadTopUsers() {
    try {
      const topUsers = await apiFetch('/api/users/top');
      renderTopUsers(topUsers);
    } catch (error) {
      console.error('Error loading top users:', error);
      if (topUsersTableBody) topUsersTableBody.innerHTML = '<tr><td colspan="3">Error al cargar los usuarios principales.</td></tr>';
    }
  }
  
  function renderTopUsers(users) {
    if (!topUsersTableBody) return; // Ensure element exists
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

  function addMessageToChat(sender, message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message', sender);
    messageElement.innerHTML = `<p>${message}</p>`;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom
  }

  async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    addMessageToChat('user', message);
    chatInput.value = '';
    sendButton.disabled = true;
    chatInput.disabled = true;

    try {
      const response = await apiFetch('/api/gemini/chat', {
        method: 'POST',
        body: JSON.stringify({ message: message })
      });
      addMessageToChat('gemini', response.reply);
    } catch (error) {
      console.error('Error sending message to Gemini:', error);
      addMessageToChat('gemini', 'Lo siento, no pude obtener una respuesta en este momento.');
    } finally {
      sendButton.disabled = false;
      chatInput.disabled = false;
      chatInput.focus();
    }
  }

  /* ---------------- Event Listeners ---------------- */
  sendButton.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  // Sidebar navigation
  if (menuInicio) menuInicio.addEventListener('click', () => { window.location.href = 'dashboard.html'; });
  if (menuCursos) menuCursos.addEventListener('click', () => { window.location.href = 'dashboard.html'; }); // Cursos link to dashboard
  if (menuSoporte) menuSoporte.addEventListener('click', () => { alert('Soporte no implementado aún.'); });
  if (menuFaq) menuFaq.addEventListener('click', () => { window.location.href = 'faq.html'; });
  if (menuAdmin) menuAdmin.addEventListener('click', () => { /* Admin menu logic, if any, or just expand */ });

  // Initial loads
  await loadCurrentUserAvatar();
  await loadTopUsers();
});
