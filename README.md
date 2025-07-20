# AdsProject

## Requisitos previos

*   Docker y Docker Compose instalados en tu sistema.
*   Git configurado con tu nombre y correo.
*   Editor de código (VSCode, WebStorm, etc.).
*   Conocimiento básico de línea de comandos.

---

## Estructura del proyecto

```bash
AdsProject/
├── db/                    # Scripts de inicialización de MongoDB y datos de siembra (JSON)
│   ├── init.js
│   └── Work-Codile.<collection_name>.json
├── web/                   # Código fuente de la app Node.js (backend) y archivos estáticos (frontend)
│   ├── package.json
│   ├── server.js
│   ├── routes/            # Definición de rutas API (auth, users, posts, comments, courses)
│   ├── models/            # Definición de esquemas de Mongoose (User, Post, Comment, Course)
│   ├── middleware/        # Middleware de autenticación (JWT)
│   └── web/               # Archivos estáticos del frontend (HTML, CSS, JS, imágenes)
│       ├── dashboard.html
│       ├── dashboard.js
│       └── ...
├── Dockerfile             # Define la imagen de la app web (Node.js)
├── docker-compose.yaml    # Orquesta contenedores web (Node.js) y de base de datos (MongoDB)
└── README.md
```

---

## Primer arranque (setup inicial)

1.  Clona el repositorio:

    ```bash
    git clone https://github.com/juancitucs/AdsProyect.git
    cd AdsProject
    ```

2.  Levanta los contenedores y construye las imágenes:

    ```bash
    docker-compose up --build -d
    ```

    **Nota sobre la siembra de datos (seeding):**
    El contenedor de MongoDB intentará cargar los datos iniciales desde los archivos `.json` en `db/` usando `db/init.js` la primera vez que se inicie o cuando su volumen de datos sea nuevo/eliminado. Si los datos no se cargan, asegúrate de eliminar los volúmenes de Docker antes de iniciar:
    ```bash
    docker-compose down -v
    docker-compose up --build -d
    ```

3.  Verifica los servicios:

    ```bash
    docker-compose ps
    ```

4.  Prueba en el navegador: abre [http://localhost:8080](http://localhost:8080)

---

## Uso diario

*   Levantar/Parar:

    ```bash
    docker-compose up -d      # Levanta en background
    docker-compose down       # Detiene y elimina contenedores
    ```

*   Ver logs:

    ```bash
    docker-compose logs -f web      # Logs de la app Node.js
    docker-compose logs -f mongodb  # Logs de MongoDB
    ```

*   Acceder a la base de datos (MongoDB):

    ```bash
    # Acceder al shell de MongoDB dentro del contenedor
    docker-compose exec mongodb mongosh
    ```

---

## Funcionalidades clave

*   **Autenticación de Usuarios:** Registro y login con JWT.
*   **Gestión de Publicaciones:** Crear, ver y calificar publicaciones.
*   **Roles de Usuario:** Implementación de roles `estudiante`, `moderator` y `admin`.
*   **Funcionalidades de Administrador/Moderador:**
    *   Eliminar cualquier publicación.
    *   Administrar cursos (agregar y eliminar cursos).
*   **Carga Dinámica de Cursos:** Los cursos se cargan desde la base de datos de MongoDB, no desde datos mock.

---

## Flujo de Git (Branching y Commits)

Este proyecto sigue un Git Flow ligero:

1.  **main**: rama estable, siempre deployable.
2.  **develop**: integración de features; destino de las pull requests.
3.  **feature/...**: ramas para cada nueva funcionalidad o corrección.

### Crear una nueva feature

```bash
# Partir de develop
git checkout develop
git pull origin develop
# Crear rama
git checkout -b feature/nueva-funcionalidad
```

### Realizar commits

*   Commits atómicos y descriptivos:

    ```bash
    git add ruta/al/archivo
    git commit -m "Descrpicion....."
    ```

### Push y Pull Request

```bash
git push --set-upstream origin feature/nueva-funcionalidad
```

*   En GitHub, abre un Pull Request hacia `develop`.

### Merge

*   Tras aprobación y CI verde, haz merge:

    *   Desde GitHub: botón Merge.
    *   Limpia tu rama local:

        ```bash
        git checkout develop
        git pull origin develop
        git branch -d feature/nueva-funcionalidad
        ```