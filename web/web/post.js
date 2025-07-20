document.addEventListener('DOMContentLoaded', async () => {
    const qs = new URLSearchParams(location.search);
    const postId = qs.get('id');

    const getToken = () => localStorage.getItem('jwtToken');

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

    // DOM Elements
    const postTitleElem = document.getElementById('post-title');
    const postMetaElem = document.getElementById('post-meta');
    const postContentElem = document.getElementById('post-content');
    const postRatingDisplayElem = document.getElementById('post-rating-display');
    const commentsListElem = document.getElementById('comments-list');
    const commentForm = document.getElementById('comment-form');
    const commentContentInput = document.getElementById('comment-content-input');

    // Back button
    document.getElementById('back-btn').onclick = () => history.back();

    let currentPost = null;

    async function fetchPostAndComments() {
        if (!postId) {
            alert('Post ID no especificado.');
            window.location.href = 'dashboard.html';
            return;
        }

        try {
            // Fetch post details
            currentPost = await apiFetch(`/api/posts/${postId}`);
            postTitleElem.textContent = currentPost.title;
            postMetaElem.innerHTML = `
                <img src="${currentPost.autor?.perfil?.foto || 'imagenes/usuario.png'}" class="post-author-avatar" alt="${currentPost.autor?.nombre || 'Usuario desconocido'}">
                <a href="perfil.html?id=${currentPost.autor?._id}" class="post-author-link">${currentPost.autor?.nombre || 'Usuario desconocido'}</a>
                • ${currentPost.course} • ${new Date(currentPost.time).toLocaleString()}
            `;
            postContentElem.innerHTML = currentPost.content;
            if (currentPost.image) {
                const img = document.createElement('img');
                img.src = currentPost.image;
                postContentElem.appendChild(img);
            }

            // Display rating
            if (currentPost.hasRated) {
                postRatingDisplayElem.innerHTML = `
                    <div class="rated-display">
                        <img src="imagenes/cocodrilo_highres.jpg" class="rated-icon" alt="Rated">
                        <span class="rated-average">${currentPost.averageRating.toFixed(1)}/5</span>
                    </div>
                `;
            } else {
                // For post.html, we won't allow rating directly here, just display average if available
                // Or you can add the interactive rating if desired, but the request was to show it only if not rated
                if (currentPost.averageRating > 0) {
                    postRatingDisplayElem.innerHTML = `
                        <div class="average-rating-display">
                            Promedio: ${currentPost.averageRating.toFixed(1)}
                        </div>
                    `;
                }
            }

            // Fetch comments
            const comments = await apiFetch(`/api/posts/${postId}/comments`);
            renderComments(comments);

        } catch (error) {
            console.error('Error fetching post or comments:', error);
            alert(`Error al cargar el post: ${error.message}`);
            window.location.href = 'dashboard.html';
        }
    }

    function renderComments(comments) {
        commentsListElem.innerHTML = '';
        comments.forEach(comment => {
            commentsListElem.appendChild(createCommentElement(comment));
        });
    }

    function createCommentElement(comment) {
        const li = document.createElement('li');
        li.className = 'comment-item';
        li.dataset.commentId = comment._id;

        li.innerHTML = `
            <div class="comment-header">
                <img src="${comment.authorAvatar || 'imagenes/usuario.png'}" class="comment-author-avatar" alt="${comment.authorName}">
                <a href="perfil.html?id=${comment.author}" class="comment-author-link">${comment.authorName || 'Usuario desconocido'}</a>
                <span class="comment-date">${new Date(comment.createdAt).toLocaleString()}</span>
            </div>
            <div class="comment-content">${comment.content}</div>
            <div class="comment-actions">
                <button class="reply-btn" data-comment-id="${comment._id}">Responder</button>
            </div>
        `;

        if (comment.replies && comment.replies.length > 0) {
            const repliesUl = document.createElement('ul');
            repliesUl.className = 'replies';
            comment.replies.forEach(reply => {
                repliesUl.appendChild(createCommentElement(reply)); // Recursive call for nested replies
            });
            li.appendChild(repliesUl);
        }
        return li;
    }

    // Handle new comment submission
    commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const content = commentContentInput.value.trim();
        if (!content) return;

        try {
            const newComment = await apiFetch(`/api/posts/${postId}/comments`, {
                method: 'POST',
                body: JSON.stringify({ content, parentId: null }) // For top-level comments
            });
            // Re-fetch all comments to update the tree structure
            fetchPostAndComments(); 
            commentContentInput.value = '';
        } catch (error) {
            alert(`Error al publicar comentario: ${error.message}`);
        }
    });

    // Handle reply button click (dynamic form creation)
    commentsListElem.addEventListener('click', (e) => {
        if (e.target.classList.contains('reply-btn')) {
            const parentCommentId = e.target.dataset.commentId;
            const existingForm = e.target.closest('.comment-item').querySelector('.reply-form');
            if (existingForm) {
                existingForm.remove(); // Remove if already exists
                return;
            }

            const replyForm = document.createElement('form');
            replyForm.className = 'comment-form reply-form';
            replyForm.innerHTML = `
                <textarea placeholder="Escribe una respuesta..." required></textarea>
                <button type="submit">Responder</button>
                <button type="button" class="cancel-reply-btn">Cancelar</button>
            `;
            e.target.closest('.comment-item').appendChild(replyForm);

            replyForm.querySelector('.cancel-reply-btn').addEventListener('click', () => {
                replyForm.remove();
            });

            replyForm.addEventListener('submit', async (replyE) => {
                replyE.preventDefault();
                const content = replyForm.querySelector('textarea').value.trim();
                if (!content) return;

                try {
                    await apiFetch(`/api/posts/${postId}/comments`, {
                        method: 'POST',
                        body: JSON.stringify({ content, parentId: parentCommentId })
                    });
                    fetchPostAndComments(); // Re-fetch all comments
                    replyForm.remove();
                } catch (error) {
                    alert(`Error al publicar respuesta: ${error.message}`);
                }
            });
        }
    });

    fetchPostAndComments();
});
