document.addEventListener("DOMContentLoaded", () => {
  // ----------------------------------------------------------------------
  // 1. FUNGSI GLOBAL: DARK MODE TOGGLE (Tetap konsisten)
  // ----------------------------------------------------------------------
  const toggleButton = document.getElementById("dark-mode-toggle");
  const body = document.body;

  const isDarkMode = localStorage.getItem("darkMode") === "enabled";
  if (isDarkMode) {
    body.classList.add("dark-mode");
    toggleButton.textContent = "Mode Terang ☀️";
    toggleButton.setAttribute("aria-label", "Ganti ke Mode Terang");
  } else {
    toggleButton.setAttribute("aria-label", "Ganti ke Mode Gelap");
  }

  toggleButton.addEventListener("click", () => {
    body.classList.toggle("dark-mode");

    if (body.classList.contains("dark-mode")) {
      localStorage.setItem("darkMode", "enabled");
      toggleButton.textContent = "Mode Terang ☀️";
      toggleButton.setAttribute("aria-label", "Ganti ke Mode Terang");
    } else {
      localStorage.setItem("darkMode", "disabled");
      toggleButton.textContent = "Mode Gelap 🌙";
      toggleButton.setAttribute("aria-label", "Ganti ke Mode Gelap");
    }
  });

  // ----------------------------------------------------------------------
  // 1a. NEW: FUNGSI GLOBAL: READ PROGRESS BAR (Interaktif)
  // ----------------------------------------------------------------------
  const progressBar = document.getElementById("read-progress-bar");

  function updateReadProgressBar() {
    if (!progressBar) return;

    // Hitung total tinggi yang dapat di-scroll (Tinggi Dokumen - Tinggi Viewport)
    const totalHeight = document.body.scrollHeight - window.innerHeight;
    if (totalHeight <= 0) {
      progressBar.style.width = "0%";
      return;
    }

    // Hitung persentase scroll
    const scrollPosition = window.scrollY;
    const progress = Math.min(100, (scrollPosition / totalHeight) * 100);

    progressBar.style.width = `${progress}%`;
  }

  // ----------------------------------------------------------------------
  // 2. FUNGSI HALAMAN UTAMA (index.html)
  // ----------------------------------------------------------------------
  if (document.getElementById("posts-container")) {
    loadPosts();
  }

  async function loadPosts() {
    // ... (Kode loadPosts tidak diubah, fokus pada detail.html) ...
    const container = document.getElementById("posts-container");
    // Tampilkan loading state
    container.innerHTML =
      '<p class="loading-state">Sedang memuat postingan...</p>';

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const response = await fetch("data.json");
      if (!response.ok) throw new Error("Gagal memuat data postingan.");
      const data = await response.json();

      container.innerHTML = "";

      if (data.length === 0) {
        container.innerHTML =
          '<p style="text-align: center;">Belum ada postingan blog.</p>';
        return;
      }

      data.forEach((post) => {
        const card = document.createElement("div");
        card.classList.add("post-card");

        card.innerHTML = `
                    <h3>${post.title}</h3>
                    <p>${post.excerpt}</p>
                    <a href="post-detail.html?id=${post.id}" aria-label="Baca selengkapnya untuk postingan ${post.title}">Baca Selengkapnya &rarr;</a>
                `;

        container.appendChild(card);
      });
    } catch (error) {
      console.error("Error saat memuat postingan:", error);
      container.innerHTML =
        '<p class="error-state" style="text-align: center;">❌ Maaf, terjadi kesalahan saat memuat postingan blog.</p>';
    }
  }

  // ----------------------------------------------------------------------
  // 3. FUNGSI HALAMAN DETAIL (post-detail.html) - REVISI UTAMA
  // ----------------------------------------------------------------------
  if (document.getElementById("post-detail-container")) {
    // Aktifkan progress bar saat halaman detail dimuat
    window.addEventListener("scroll", updateReadProgressBar);
    window.addEventListener("resize", updateReadProgressBar);
    updateReadProgressBar(); // Panggil pertama kali

    loadPostDetail();
    setupMobileInteractions(); // NEW: Setup interaksi mobile bar
  }

  // NEW: Fungsi untuk setup interaksi mobile (sticky bar)
  function setupMobileInteractions() {
    const commentScrollBtn = document.querySelector(".comment-scroll-btn");
    if (commentScrollBtn) {
      commentScrollBtn.addEventListener("click", (e) => {
        e.preventDefault();
        // Gunakan scrollIntoView untuk animasi scroll halus
        document
          .getElementById("comments-section")
          .scrollIntoView({ behavior: "smooth" });
      });
    }
  }

  async function loadPostDetail() {
    const detailContainer = document.getElementById("post-detail-container");
    // Karena HTML sudah memuat banyak section (meta, author, related), kita hapus hanya konten spesifik
    detailContainer.querySelector(".post-detail").innerHTML =
      '<p class="loading-state" style="text-align: center;">Memuat detail postingan...</p>';

    const urlParams = new URLSearchParams(window.location.search);
    const postId = parseInt(urlParams.get("id"));

    if (!postId) {
      detailContainer.querySelector(".post-detail").innerHTML =
        "<h1>❌ Postingan tidak ditemukan!</h1><p>ID postingan tidak valid.</p>";
      return;
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const response = await fetch("data.json");
      const posts = await response.json();
      const post = posts.find((p) => p.id === postId);

      // Seleksi elemen yang sudah ada di HTML
      const postTitle = document.getElementById("post-title");
      const postContent = document.getElementById("post-content");
      const breadcrumbTitle = document.getElementById("breadcrumb-title");
      const postAuthor = document.getElementById("post-author");
      const postDate = document.getElementById("post-date");
      const likeCountElement = document.getElementById("like-count");

      if (post) {
        // Isi Konten & Meta
        postTitle.textContent = post.title;
        // Isi breadcrumb dengan judul (dipotong jika terlalu panjang)
        breadcrumbTitle.textContent =
          post.title.length > 30
            ? post.title.substring(0, 30) + "..."
            : post.title;
        postContent.innerHTML = post.content
          .split("\n")
          .map((p) => `<p>${p}</p>`)
          .join("");

        // Isi data statis yang disimulasikan
        postAuthor.textContent = "WebDev Master";
        postDate.textContent = new Date().toLocaleDateString("id-ID", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        // Like Count
        likeCountElement.textContent = post.likes;
        localStorage.setItem(`post-${postId}-likes`, post.likes); // Inisialisasi LocalStorage

        // Setup interaktif
        setupLikeButton(postId);
        setupCommentForm(postId);
        loadComments(postId);

        // Update share links dengan URL saat ini (Modern)
        updateShareLinks(window.location.href);
      } else {
        postTitle.textContent = "Postingan Tidak Ditemukan";
        postContent.innerHTML =
          "<h1>❌ Postingan tidak ditemukan!</h1><p>Postingan dengan ID tersebut tidak ada.</p>";
      }
    } catch (error) {
      console.error("Error memuat detail postingan:", error);
      // Kembali ke loading state awal dan ubah menjadi error
      const postDetailSection = detailContainer.querySelector(".post-detail");
      if (postDetailSection)
        postDetailSection.innerHTML =
          "<h1>⚠️ Gagal Memuat Data</h1><p>Terjadi masalah jaringan atau data.</p>";
    }
  }

  // NEW: Fungsi untuk mengupdate link share (Konsistensi)
  function updateShareLinks(url) {
    const title = document.title;
    const twitterLink = document.querySelector(".share-btn.twitter");
    const facebookLink = document.querySelector(".share-btn.facebook");
    const linkedinLink = document.querySelector(".share-btn.linkedin");

    if (twitterLink) {
      twitterLink.href = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        url
      )}&text=${encodeURIComponent(title)}`;
    }
    if (facebookLink) {
      facebookLink.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        url
      )}`;
    }
    if (linkedinLink) {
      linkedinLink.href = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(
        url
      )}&title=${encodeURIComponent(title)}`;
    }
  }

  // ----------------------------------------------------------------------
  // 3a. SISTEM LIKE SEDERHANA (Disesuaikan untuk bekerja dengan DOM yang baru dibuat)
  // ----------------------------------------------------------------------
  function setupLikeButton(postId) {
    // Menggunakan kedua tombol (di detail konten dan mobile bar)
    const likeButtons = document.querySelectorAll("#like-button");
    const likeCountElements = document.querySelectorAll("#like-count");

    if (likeButtons.length === 0) return;

    // Inisialisasi hitungan dari LocalStorage atau data simulasi
    let currentLikes =
      parseInt(localStorage.getItem(`post-${postId}-likes`)) ||
      parseInt(likeCountElements[0].textContent);

    likeCountElements.forEach((el) => (el.textContent = currentLikes));

    let isLiked = localStorage.getItem(`post-${postId}-liked`) === "true";

    if (isLiked) {
      likeButtons.forEach((btn) => {
        btn.disabled = true;
        btn.classList.add("liked");
        btn.innerHTML = `❤️ Sudah Disukai (${currentLikes})`;
      });
    }

    likeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        if (isLiked) return;

        currentLikes += 1;

        // Update LocalStorage, status, dan semua elemen UI
        localStorage.setItem(`post-${postId}-likes`, currentLikes);
        localStorage.setItem(`post-${postId}-liked`, "true");
        isLiked = true;

        likeButtons.forEach((btn) => {
          btn.disabled = true;
          btn.classList.add("liked");
          btn.innerHTML = `❤️ Sudah Disukai (${currentLikes})`;
        });
        likeCountElements.forEach((el) => (el.textContent = currentLikes));
      });
    });
  }

  // ----------------------------------------------------------------------
  // 3b. SISTEM KOMENTAR SEDERHANA (Tidak ada perubahan signifikan)
  // ----------------------------------------------------------------------
  function loadComments(postId) {
    const commentsList = document.getElementById("comments-list");
    const comments =
      JSON.parse(localStorage.getItem(`post-${postId}-comments`)) || [];
    // ... (Kode loadComments dan appendCommentToDOM tidak diubah) ...
    commentsList.innerHTML = "";

    if (comments.length === 0) {
      commentsList.innerHTML =
        '<p class="empty-state" style="text-align: center;">Belum ada komentar.</p>';
      return;
    }

    comments.forEach((comment) => {
      appendCommentToDOM(comment, commentsList);
    });
  }

  function appendCommentToDOM(comment, listElement) {
    const emptyMessage = listElement.querySelector(".empty-state");
    if (emptyMessage) emptyMessage.remove();

    const commentDiv = document.createElement("div");
    commentDiv.classList.add("comment");

    commentDiv.innerHTML = `
            <strong>Anonim (${comment.timestamp})</strong> 
            <p>${comment.text}</p>
        `;
    listElement.prepend(commentDiv);
  }

  function setupCommentForm(postId) {
    const commentForm = document.getElementById("comment-form");
    const commentsList = document.getElementById("comments-list");

    if (!commentForm || !commentsList) return;

    commentForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const commentTextarea = document.getElementById("comment-text");
      const commentText = commentTextarea.value.trim();

      if (commentText === "") {
        alert("Komentar tidak boleh kosong!");
        return;
      }

      const newComment = {
        text: commentText,
        timestamp: new Date().toLocaleDateString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      let comments =
        JSON.parse(localStorage.getItem(`post-${postId}-comments`)) || [];
      comments.push(newComment);
      localStorage.setItem(`post-${postId}-comments`, JSON.stringify(comments));

      appendCommentToDOM(newComment, commentsList);

      commentTextarea.value = "";
    });
  }
});
