
# AdsProject


## Requisitos previos

* Docker y Docker Compose instalados en tu sistema.
* Git configurado con tu nombre y correo.
* Editor de código (VSCode, WebStorm, etc.).
* Conocimiento básico de línea de comandos.

---

## Estructura del proyecto

```bash
AdsProject/
├── db/                    # Scripts de inicialización de MySQL
│   ├── 01-schema.sql
│   └── 02-seed.sql
├── web/                   # Código fuente de la app Node.js y archivos estáticos
│   ├── index.html
│   ├── server.js
│   ├── script.js
│   ├── style.css
│   └── package.json
├── Dockerfile             # Define la imagen de la app web
├── docker-compose.yaml    # Orquesta contenedores web y db
└── README.md              
```

---

## Primer arranque (setup inicial)

1. Clona el repositorio:

   ```bash
   git clone https://github.com/tu-org/AdsProject.git
   cd AdsProject
   ```


2. Levanta los contenedores:

   ```bash
   docker-compose up --build -d
   ```

3. Verifica los servicios:

   ```bash
   docker-compose ps
   ```

4. Prueba en el navegador: abre [http://localhost:8080](http://localhost:8080)

---

## Uso diario

* Levantar/Parar:

  ```bash
  docker-compose up -d      # Levanta en background
  docker-compose down       # Detiene y elimina contenedores
  ```

* Ver logs:

  ```bash
  docker-compose logs -f web   # Logs de la app Node.js
  docker-compose logs -f db    # Logs de MySQL
  ```

* Acceder a la base de datos:

  ```bash
  # Desde host (con cliente MySQL instalado)
  mysql -h 127.0.0.1 -P 3306 -u root -p

  # Desde contenedor
  docker-compose exec db mysql -uroot -p
  ```


## Flujo de Git (Branching y Commits)

Este proyecto sigue un Git Flow ligero:

1. **main**: rama estable, siempre deployable.
2. **develop**: integración de features; destino de las pull requests.
3. **feature/...**: ramas para cada nueva funcionalidad o corrección.

### Crear una nueva feature

```bash
# Partir de develop
git checkout develop
git pull origin develop
# Crear rama
git checkout -b feature/nueva-funcionalidad
```

### Realizar commits

* Commits atómicos y descriptivos:

  ```bash
  git add ruta/al/archivo
  git commit -m "Descrpicion....."
  ```

### Push y Pull Request

```bash
git push --set-upstream origin feature/nueva-funcionalidad
```

* En GitHub, abre un Pull Request hacia `develop`.

### Merge

* Tras aprobación y CI verde, haz merge:

  * Desde GitHub: botón Merge.
  * Limpia tu rama local:

    ```bash
    git checkout develop
    git pull origin develop
    git branch -d feature/nueva-funcionalidad
    ```

---

