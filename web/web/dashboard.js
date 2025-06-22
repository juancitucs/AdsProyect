/* ---------- Datos iniciales ---------- */
const COURSES = ['Algoritmos', 'Física I', 'BD Avanzadas', 'POO'];
const STORAGE_KEY = 'workcodile_posts';
const COCO_ICON = 'imagenes/coco-chibi.png';

/* Recuperar posts guardados o iniciar vacíos por curso */
let postsByCourse = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
COURSES.forEach(c => postsByCourse[c] ||= []); // asegura todos los cursos

/* ---------- Top usuarios (ejemplo) ---------- */
const topUsers = [
  { name:'Ana Torres', avatar:'imagenes/usuario.png', points:1520 },
  { name:'Carlos Pérez', avatar:'imagenes/usuario.png', points:1390 },
  { name:'María López', avatar:'imagenes/usuario.png', points:1275 },
  { name:'Luis Gómez', avatar:'imagenes/usuario.png', points:1180 },
  { name:'Sofía Díaz', avatar:'imagenes/usuario.png', points:1105 }
];

/* ---------- Referencias DOM ---------- */
const feed       = document.getElementById('feed');
const searchInp  = document.getElementById('search-input');
const modal      = document.getElementById('modal');
const openModal  = document.getElementById('open-modal');
const fab        = document.getElementById('fab');
const closeModal = document.getElementById('modal-close');
const modalForm  = document.getElementById('post-form');
const courseSel  = document.getElementById('post-course');
const titleInp   = document.getElementById('post-title');
const bodyInp    = document.getElementById('post-body');
const imgInp     = document.getElementById('post-image');
const imgPrev    = document.getElementById('post-preview');
const btnPublish = document.getElementById('btn-publish');
const topUsersUL = document.getElementById('top-users');
const menuExplorar = document.getElementById('menu-explorar');

/* Estado de interfaz */
let currentCourse = COURSES[0];

/* ---------- Inicialización ---------- */
document.addEventListener('DOMContentLoaded', () => {
  /* Popular select de cursos */
  COURSES.forEach(c => courseSel.add(new Option(c, c)));
  courseSel.value = currentCourse;

  renderFeed(postsByCourse[currentCourse]);
  renderTopUsers();
  setupModalHandlers();
  setupSearch();
});

/* ---------- Modal & validación ---------- */
function setupModalHandlers() {
  openModal.onclick = () => { modal.classList.add('show'); validateForm(); };
  fab.onclick       = openModal.onclick;
  closeModal.onclick= () => modal.classList.remove('show');
  modal.onclick     = e => { if (e.target === modal) modal.classList.remove('show'); };

  [courseSel, titleInp, bodyInp].forEach(el => el.addEventListener('input', validateForm));
  imgInp.addEventListener('input', handleImagePreview);

  modalForm.addEventListener('submit', e => {
    e.preventDefault();
    const post = buildPostObject();
    postsByCourse[post.course].unshift(post);
    savePosts();
    if (post.course === currentCourse) renderFeed(postsByCourse[currentCourse]);
    modalForm.reset(); imgPrev.style.display = 'none'; btnPublish.disabled = true;
    modal.classList.remove('show');
  });
}

function validateForm() {
  btnPublish.disabled = !(
    courseSel.value && titleInp.value.trim().length >= 4 && bodyInp.value.trim().length >= 8
  );
}

function handleImagePreview() {
  const url = imgInp.value.trim();
  if (/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(url)) {
    imgPrev.src = url; imgPrev.style.display = 'block';
  } else {
    imgPrev.style.display = 'none';
  }
}

function buildPostObject() {
  return {
    course:  courseSel.value,
    title:   titleInp.value.trim(),
    content: bodyInp.value.trim(),
    image:   imgInp.value.trim(),
    time:    Date.now(),
    votes:   0,
    ratingTotal: 0,
    ratingCount: 0,
    userRating: 0
  };
}

/* ---------- Feed ---------- */
function renderFeed(list) {
  feed.innerHTML = '';
  if (list.length === 0) {
    feed.innerHTML = '<p style="color:#777;text-align:center;">Sin posts aún.</p>'; return;
  }
  list.forEach(p => feed.appendChild(createPostCard(p)));
}

function createPostCard(p) {
  const card = document.createElement('div'); card.className = 'post';
  const vote = document.createElement('div'); vote.className = 'vote';
  vote.innerHTML = `<button>▲</button><span class="score">${p.votes}</span><button>▼</button>`;

  const body = document.createElement('div'); body.className = 'post-body';
  body.innerHTML = `<h4>${p.title}</h4><p>${p.content}</p>`;
  if (p.image) { const img=document.createElement('img'); img.src=p.image; body.appendChild(img); }

  body.appendChild(createRatingBar(p));
  const small=document.createElement('small');
  small.textContent = `${p.course} • ${new Date(p.time).toLocaleString()}`;
  body.appendChild(small);

  card.append(vote, body);
  return card;
}

/* ---------- Rating ---------- */
function createRatingBar(post) {
  const div=document.createElement('div'); div.className='coco-rating';
  highlight(div, post.userRating || avg(post));

  for(let i=1;i<=5;i++){
    const img=document.createElement('img'); img.src=COCO_ICON; img.dataset.val=i;
    img.addEventListener('mouseenter',()=>highlight(div,i));
    img.addEventListener('mouseleave',()=>highlight(div,post.userRating||avg(post)));
    img.addEventListener('click',()=>rate(post,i,div));
    div.appendChild(img);
  }
  return div;
}
const highlight=(c,v)=>[...c.children].forEach(img=>img.classList.toggle('active',img.dataset.val<=v));
const avg=p=>p.ratingCount?Math.round(p.ratingTotal/p.ratingCount):0;

function rate(post,val,container){
  if(post.userRating){post.ratingTotal-=post.userRating;post.ratingCount--;}
  post.userRating=val;post.ratingTotal+=val;post.ratingCount++;
  highlight(container,val); savePosts();
}

/* ---------- Búsqueda ---------- */
function setupSearch(){
  searchInp.addEventListener('input',()=>{
    const q=searchInp.value.trim().toLowerCase();
    const all=Object.values(postsByCourse).flat();
    renderFeed(!q?postsByCourse[currentCourse]:
      all.filter(p=>p.title.toLowerCase().includes(q)||p.content.toLowerCase().includes(q)));
  });
}

/* ---------- Top usuarios ---------- */
function renderTopUsers(){
  topUsersUL.innerHTML='';
  topUsers.forEach((u,i)=>{
    const li=document.createElement('li'); li.className='user-item';
    li.innerHTML=`<span class="user-rank">${i+1}</span>
      <img src="${u.avatar}" class="user-avatar" alt="${u.name}">
      <div class="user-info">
        <span class="user-name">${u.name}</span>
        <span class="user-points">${u.points} pts</span>
      </div>`;
    topUsersUL.appendChild(li);
  });
}

/* ---------- Persistencia ---------- */
function savePosts(){ localStorage.setItem(STORAGE_KEY,JSON.stringify(postsByCourse)); }





