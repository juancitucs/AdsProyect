
// Registro con _id
document.getElementById('register-form').addEventListener('submit', async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      _id: data.studentCode,       // Usamos _id como identificador único
      email: data.email,
      contrasena: data.password,
      tipo: 'estudiante',
      perfil: { bio: '', foto: '', intereses: [] }
    })
  });
  const result = await res.json();
  console.log('Registro →', result);
});

// Login con _id
document.getElementById('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  console.log("test")
  const data = Object.fromEntries(new FormData(e.target));
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      _id: data.studentCode,       // también usamos _id aquí
      contrasena: data.password
    })
  });
  if (res.ok) {
    const { user } = await res.json();
    console.log('Login exitoso →', user);
    window.location.href = 'dashboard.html';
  } else {
    const err = await res.json();
    alert(err.error);
  }
});

