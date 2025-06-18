
document.addEventListener('DOMContentLoaded', () => {
  const tabRegister = document.getElementById('tab-register');
  const tabLogin = document.getElementById('tab-login');
  const formRegister = document.getElementById('register-form');
  const formLogin = document.getElementById('login-form');


  //CAMBIAR ENTRE LOGIN Y REGISTER
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

  // LOGIN FUNCIONAL
  formLogin.addEventListener('submit', async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const resData = await response.json();
        console.log('✅ Login exitoso:', resData);
        // Guardar info si se quiere mantener sesión
        // localStorage.setItem('user', JSON.stringify(resData.user));
        window.location.href = 'dashboard.html';
      } else {
        const error = await response.json();
        alert('❌ Error: ' + (error.error || 'Credenciales inválidas'));
      }

    } catch (err) {
      console.error('❌ Error en login:', err);
      alert('❌ Error de red al intentar iniciar sesión');
    }
  });
});

