document.addEventListener('DOMContentLoaded', () => {
  // --- Tabs ---
  const tabs      = document.querySelectorAll('.tab-btn');
  const contents  = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(b => b.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      contents.forEach(sec => {
        sec.id === `tab-${target}`
          ? sec.classList.add('active')
          : sec.classList.remove('active');
      });
    });
  });

  // --- Avatar preview ---
  const avatarInput   = document.getElementById('avatar-input');
  const avatarPreview = document.getElementById('avatar-preview');
  avatarInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => avatarPreview.src = evt.target.result;
    reader.readAsDataURL(file);
  });

  // --- Back button ---
  document.getElementById('back-btn')
    .addEventListener('click', () => history.back());

  // --- Datos de ejemplo ---
  const examplePosts = [
    'Cómo resolver el ejercicio de álgebra',
    'Mis apuntes de física: movimiento circular',
    'Proyecto en JavaScript'
  ];
  const exampleComments = [
    '¡Gran aporte en tu post de JavaScript!',
    'Gracias por compartir tus apuntes.',
    '¿Podrías explicar la derivada de esa función?'
  ];

  // --- Render Posts con delete ---
  const postsList = document.getElementById('posts-list');
  examplePosts.forEach(text => {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = text;
    const btn = document.createElement('button');
    btn.className = 'delete-btn';
    btn.textContent = '×';
    btn.title = 'Eliminar post';
    btn.addEventListener('click', () => {
      if (confirm('¿Estás seguro de eliminar este post?')) {
        li.remove();
      }
    });
    li.append(span, btn);
    postsList.appendChild(li);
  });

  // --- Render Comments con delete ---
  const commentsList = document.getElementById('comments-list');
  exampleComments.forEach(text => {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = text;
    const btn = document.createElement('button');
    btn.className = 'delete-btn';
    btn.textContent = '×';
    btn.title = 'Eliminar comentario';
    btn.addEventListener('click', () => {
      if (confirm('¿Estás seguro de eliminar este comentario?')) {
        li.remove();
      }
    });
    li.append(span, btn);
    commentsList.appendChild(li);
  });

  // --- Submit formulario editar perfil ---
  document.getElementById('profile-form')
    .addEventListener('submit', e => {
      e.preventDefault();
      alert('Perfil actualizado (simulado).');
    });
});


