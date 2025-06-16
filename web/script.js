document.addEventListener('DOMContentLoaded', () => {
  const tabRegister  = document.getElementById('tab-register');
  const tabLogin     = document.getElementById('tab-login');
  const formRegister = document.getElementById('register-form');
  const formLogin    = document.getElementById('login-form');

  function showForm(target) {
    if (target === 'register') {
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      formRegister.classList.add('active');
      formLogin.classList.remove('active');
    } else {
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      formLogin.classList.add('active');
      formRegister.classList.remove('active');
    }
  }

  tabRegister.addEventListener('click', () => showForm('register'));
  tabLogin.addEventListener('click', () => showForm('login'));

  // Captura de envíos (aquí iría tu llamada a la API)
  formLogin.addEventListener('submit', e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  console.log('Login →', data);
  // aquí validas con tu API…
  // si el login fue exitoso:
  window.location.href = 'dashboard.html';
});

  formLogin.addEventListener('submit', e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    console.log('Login →', data);
    // TODO: fetch('/api/login', { method: 'POST', body: JSON.stringify(data) })
  });
});


