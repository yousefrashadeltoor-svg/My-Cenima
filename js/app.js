
/* ================================================
   My Cinema — التطبيق الرئيسي
   المطور: Yousef M.Rashad
   ================================================ */

const App = {
    // ===== بيانات المطور =====
    developer: {
        name: 'Yousef M.Rashad',
        email: 'yousef@mycinema.com',
        password: 'yousef123',
        role: 'developer'
    },

    // ===== حالة التطبيق =====
    currentUser: null,
    movies: [],
    currentPage: 'home',
    activeCategory: 'الكل',
    searchQuery: '',

    // ===== التهيئة =====
    init() {
        this.createParticles();
        this.loadSession();
        this.loadMovies();
        this.setupScrollListener();
        this.setupNavToggle();

        // إخفاء شاشة التحميل
        setTimeout(() => {
            document.getElementById('loader').classList.add('hidden');
        }, 2000);
    },

    // ===== إنشاء الجزيئات =====
    createParticles() {
        const container = document.getElementById('particles');
        const count = 25;
        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            p.style.left = Math.random() * 100 + '%';
            p.style.animationDuration = (Math.random() * 18 + 12) + 's';
            p.style.animationDelay = (Math.random() * 12) + 's';
            const size = Math.random() * 3 + 1;
            p.style.width = size + 'px';
            p.style.height = size + 'px';
            container.appendChild(p);
        }
    },

    // ===== مستمع التمرير =====
    setupScrollListener() {
        window.addEventListener('scroll', () => {
            const navbar = document.getElementById('navbar');
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    },

    // ===== قائمة الجوال =====
    setupNavToggle() {
        const toggle = document.getElementById('navToggle');
        const links = document.getElementById('navLinks');
        toggle.addEventListener('click', () => {
            links.classList.toggle('open');
        });
        // إغلاق عند النقر على رابط
        links.querySelectorAll('.nav-link, .nav-btn').forEach(link => {
            link.addEventListener('click', () => {
                links.classList.remove('open');
            });
        });
    },

    // ===== تحميل الجلسة =====
    loadSession() {
        const session = localStorage.getItem('mc_session');
        if (session) {
            try {
                this.currentUser = JSON.parse(session);
                this.updateNavUI();
            } catch (e) {
                localStorage.removeItem('mc_session');
            }
        }
        // زيارة جديدة
        let visits = parseInt(localStorage.getItem('mc_visits') || '0');
        visits++;
        localStorage.setItem('mc_visits', visits.toString());
    },

    // ===== تحميل الأفلام =====
    async loadMovies() {
        try {
            const res = await fetch('movies.json');
            if (!res.ok) throw new Error('فشل تحميل البيانات');
            this.movies = await res.json();
        } catch (e) {
            console.warn('لم يتم العثور على movies.json:', e.message);
            this.movies = [];
        }
        this.renderMovies();
        this.renderCategoryFilters();
    },

    // ===== عرض الأفلام =====
    renderMovies() {
        const grid = document.getElementById('moviesGrid');
        const emptyState = document.getElementById('emptyState');
        const countEl = document.getElementById('moviesCount');

        // تصفية الأفلام
        let filtered = this.movies.filter(m => {
            const matchCategory = this.activeCategory === 'الكل' || m.category === this.activeCategory;
            const matchSearch = !this.searchQuery || 
                m.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                (m.description && m.description.toLowerCase().includes(this.searchQuery.toLowerCase()));
            return matchCategory && matchSearch;
        });

        countEl.textContent = filtered.length + ' فيلم';

        if (filtered.length === 0) {
            grid.innerHTML = '';
            emptyState.style.display = 'block';
            if (this.movies.length === 0) {
                emptyState.querySelector('h3').textContent = 'لا توجد أفلام حالياً';
                emptyState.querySelector('p').textContent = 'أضف أفلامك في مجلد movies/ وحدّث movies.json';
            } else {
                emptyState.querySelector('h3').textContent = 'لا توجد نتائج';
                emptyState.querySelector('p').textContent = 'جرّب تغيير كلمة البحث أو التصنيف';
            }
            return;
        }

        emptyState.style.display = 'none';
        grid.innerHTML = filtered.map(movie => this.createMovieCard(movie)).join('');
    },

    // ===== إنشاء بطاقة فيلم =====
    createMovieCard(movie) {
        const posterHTML = movie.poster 
            ? `<img src="${this.escapeHTML(movie.poster)}" alt="${this.escapeHTML(movie.title)}" loading="lazy">`
            : `<div class="default-poster"><i class="fas fa-film"></i><span>${this.escapeHTML(movie.title)}</span></div>`;

        return `
            <div class="movie-card" onclick="App.playMovie(${movie.id})">
                <div class="movie-poster">
                    ${posterHTML}
                    <div class="play-overlay">
                        <i class="fas fa-play"></i>
                    </div>
                </div>
                <div class="movie-info">
                    <h3>${this.escapeHTML(movie.title)}</h3>
                    <div class="movie-meta">
                        ${movie.year ? `<span><i class="fas fa-calendar"></i> ${movie.year}</span>` : ''}
                        ${movie.duration ? `<span><i class="fas fa-clock"></i> ${movie.duration}</span>` : ''}
                    </div>
                    ${movie.category ? `<span class="movie-category-badge">${this.escapeHTML(movie.category)}</span>` : ''}
                </div>
            </div>
        `;
    },

    // ===== عرض فلاتر التصنيفات =====
    renderCategoryFilters() {
        const container = document.getElementById('categoryFilters');
        const categories = ['الكل', ...new Set(this.movies.map(m => m.category).filter(Boolean))];
        container.innerHTML = categories.map(cat => `
            <button class="cat-btn ${cat === this.activeCategory ? 'active' : ''}" 
                    onclick="App.setCategory('${this.escapeHTML(cat)}')">
                ${this.escapeHTML(cat)}
            </button>
        `).join('');
    },

    // ===== تعيين التصنيف =====
    setCategory(cat) {
        this.activeCategory = cat;
        document.querySelectorAll('.cat-btn').forEach(btn => {
            btn.classList.toggle('active', btn.textContent === cat);
        });
        this.renderMovies();
    },

    // ===== تصفية الأفلام (بحث) =====
    filterMovies() {
        this.searchQuery = document.getElementById('searchInput').value.trim();
        this.renderMovies();
    },

        // ===== تشغيل فيلم =====
    playMovie(id) {
        const movie = this.movies.find(m => m.id === id);
        if (!movie) return;

        const video = document.getElementById('videoPlayer');

        // إعادة تعيين المشغل
        video.removeAttribute('src');
        document.getElementById('videoSource').removeAttribute('src');

        // التحقق إذا كان الرابط خارجي (درايف أو أي سيرفر)
        if (movie.file.startsWith('http')) {
            video.src = movie.file;
        } else {
            // ملف محلي في المشروع
            const source = document.getElementById('videoSource');
            source.src = movie.file;
            source.type = this.getFileType(movie.file);
        }

        video.load();
        document.getElementById('playerTitle').textContent = movie.title;
        document.getElementById('playerYear').innerHTML = '<i class="fas fa-calendar"></i> ' + (movie.year || 'غير محدد');
        document.getElementById('playerDuration').innerHTML = '<i class="fas fa-clock"></i> ' + (movie.duration || 'غير محدد');
        document.getElementById('playerCategory').innerHTML = '<i class="fas fa-tag"></i> ' + (movie.category || 'غير محدد');
        document.getElementById('playerDesc').textContent = movie.description || 'لا يوجد وصف متاح لهذا الفيلم.';

        this.navigate('player');

        // محاولة تشغيل تلقائي (قد يُمنع من المتصفح)
        video.play().catch(() => {
            // المتصفح يمنع التشغيل التلقائي، المستخدم سيضغط زر Play
        });
    },

    // ===== تحديد نوع الملف =====
    getFileType(fileUrl) {
        const ext = fileUrl.split('.').pop().toLowerCase().split('?')[0];
        const types = {
            'mp4': 'video/mp4',
            'webm': 'video/webm',
            'ogg': 'video/ogg',
            'mkv': 'video/mp4' // المتصفحات تتعامل مع mkv كـ mp4
        };
        return types[ext] || 'video/mp4';
    },

    // ===== التنقل بين الصفحات =====
    navigate(page) {
        // حماية صفحة المطور
        if (page === 'dev' && (!this.currentUser || this.currentUser.role !== 'developer')) {
            this.showToast('ليس لديك صلاحية الوصول لهذه الصفحة', 'error');
            return;
        }

        // إيقاف الفيديو عند مغادرة المشغل
        if (this.currentPage === 'player' && page !== 'player') {
            const video = document.getElementById('videoPlayer');
            if (video) {
                video.pause();
                video.src = '';
            }
        }

        // إخفاء جميع الصفحات
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

        // إظهار الصفحة المطلوبة
        const target = document.getElementById('page-' + page);
        if (target) {
            target.classList.add('active');
        }

        // تحديث الرابط النشط في النافبار
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.page === page);
        });

        this.currentPage = page;
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // تحديث مركز المطور عند فتحه
        if (page === 'dev') {
            this.updateDevCenter();
        }
    },

    // ===== تسجيل الدخول =====
    handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim().toLowerCase();
        const password = document.getElementById('loginPassword').value;

        // التحقق من حساب المطور
        if (email === this.developer.email && password === this.developer.password) {
            this.currentUser = {
                name: this.developer.name,
                email: this.developer.email,
                role: this.developer.role,
                joinDate: 'المؤسس'
            };
            localStorage.setItem('mc_session', JSON.stringify(this.currentUser));
            this.updateNavUI();
            this.showToast('مرحباً بك يا مطور المنصة', 'success');
            document.getElementById('loginForm').reset();
            this.navigate('home');
            return;
        }

        // التحقق من المستخدمين المسجلين
        const users = this.getUsers();
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            this.currentUser = {
                name: user.name,
                email: user.email,
                role: 'user',
                joinDate: user.joinDate
            };
            localStorage.setItem('mc_session', JSON.stringify(this.currentUser));
            this.updateNavUI();
            this.showToast('مرحباً بك ' + user.name, 'success');
            document.getElementById('loginForm').reset();
            this.navigate('home');
            return;
        }

        this.showToast('البريد الإلكتروني أو كلمة المرور غير صحيحة', 'error');
    },

    // ===== إنشاء حساب =====
    handleRegister(e) {
        e.preventDefault();
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim().toLowerCase();
        const password = document.getElementById('regPassword').value;
        const confirm = document.getElementById('regConfirm').value;

        // التحقق من أن البريد ليس بريد المطور
        if (email === this.developer.email) {
            this.showToast('هذا البريد محجوز لحساب المطور', 'error');
            return;
        }

        // التحقق من تطابق كلمة المرور
        if (password !== confirm) {
            this.showToast('كلمتا المرور غير متطابقتين', 'error');
            return;
        }

        // التحقق من عدم وجود المستخدم مسبقاً
        const users = this.getUsers();
        if (users.find(u => u.email === email)) {
            this.showToast('هذا البريد مسجل مسبقاً. جرّب تسجيل الدخول', 'error');
            return;
        }

        // إنشاء المستخدم
        const newUser = {
            id: Date.now(),
            name: name,
            email: email,
            password: password,
            joinDate: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
        };

        users.push(newUser);
        localStorage.setItem('mc_users', JSON.stringify(users));

        this.showToast('تم إنشاء حسابك بنجاح! يمكنك تسجيل الدخول الآن', 'success');
        document.getElementById('registerForm').reset();
        this.navigate('login');
    },

    // ===== تسجيل الخروج =====
    logout() {
        this.currentUser = null;
        localStorage.removeItem('mc_session');
        this.updateNavUI();
        this.showToast('تم تسجيل الخروج بنجاح', 'info');
        this.navigate('home');
    },

    // ===== تحديث واجهة النافبار =====
    updateNavUI() {
        const guestLinks = document.getElementById('guestLinks');
        const userLinks = document.getElementById('userLinks');
        const devLinks = document.getElementById('devLinks');

        guestLinks.style.display = 'none';
        userLinks.style.display = 'none';
        devLinks.style.display = 'none';

        if (this.currentUser) {
            if (this.currentUser.role === 'developer') {
                devLinks.style.display = 'flex';
                devLinks.querySelector('span span').textContent = this.currentUser.name;
            } else {
                userLinks.style.display = 'flex';
                document.getElementById('navUsername').textContent = this.currentUser.name;
            }
        } else {
            guestLinks.style.display = 'flex';
        }
    },

    // ===== الحصول على المستخدمين =====
    getUsers() {
        try {
            return JSON.parse(localStorage.getItem('mc_users') || '[]');
        } catch {
            return [];
        }
    },

    // ===== تحديث مركز المطور =====
    updateDevCenter() {
        const users = this.getUsers();
        const visits = parseInt(localStorage.getItem('mc_visits') || '0');
        const categories = [...new Set(this.movies.map(m => m.category).filter(Boolean))];

        document.getElementById('statMovies').textContent = this.movies.length;
        document.getElementById('statUsers').textContent = users.length;
        document.getElementById('statVisits').textContent = visits;
        document.getElementById('statCategories').textContent = categories.length;
        document.getElementById('lastUpdate').textContent = new Date().toLocaleDateString('ar-EG', { 
            year: 'numeric', month: 'long', day: 'numeric' 
        });

        // جدول المستخدمين
        const tbody = document.getElementById('usersTableBody');
        const noUsers = document.getElementById('noUsers');

        if (users.length === 0) {
            tbody.innerHTML = '';
            noUsers.style.display = 'block';
            document.querySelector('.users-table-wrapper').style.display = 'none';
        } else {
            noUsers.style.display = 'none';
            document.querySelector('.users-table-wrapper').style.display = 'block';
            tbody.innerHTML = users.map((u, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${this.escapeHTML(u.name)}</td>
                    <td style="direction:ltr">${this.escapeHTML(u.email)}</td>
                    <td>${u.joinDate}</td>
                    <td><button class="btn-delete" onclick="App.deleteUser(${u.id})"><i class="fas fa-trash"></i> حذف</button></td>
                </tr>
            `).join('');
        }
    },

    // ===== حذف مستخدم =====
    deleteUser(id) {
        this.showConfirm('حذف المستخدم', 'هل أنت متأكد من حذف هذا المستخدم؟', () => {
            let users = this.getUsers();
            users = users.filter(u => u.id !== id);
            localStorage.setItem('mc_users', JSON.stringify(users));
            this.updateDevCenter();
            this.showToast('تم حذف المستخدم بنجاح', 'success');
        });
    },

    // ===== حذف جميع المستخدمين =====
    clearAllUsers() {
        this.showConfirm('حذف جميع المستخدمين', 'هل أنت متأكد من حذف جميع المستخدمين المسجلين؟ لا يمكن التراجع عن هذا الإجراء.', () => {
            localStorage.setItem('mc_users', '[]');
            this.updateDevCenter();
            this.showToast('تم حذف جميع المستخدمين', 'success');
        });
    },

    // ===== إعادة تعيين الزيارات =====
    resetVisits() {
        this.showConfirm('إعادة تعيين الزيارات', 'هل تريد إعادة تعيين عداد الزيارات إلى صفر؟', () => {
            localStorage.setItem('mc_visits', '0');
            this.updateDevCenter();
            this.showToast('تم إعادة تعيين الزيارات', 'success');
        });
    },

    // ===== تصدير البيانات =====
    exportData() {
        const data = {
            platform: 'My Cinema',
            version: '2.0.0',
            developer: this.developer,
            exportDate: new Date().toISOString(),
            movies: this.movies,
            users: this.getUsers(),
            visits: parseInt(localStorage.getItem('mc_visits') || '0')
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mycinema-backup-' + new Date().toISOString().slice(0, 10) + '.json';
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('تم تصدير البيانات بنجاح', 'success');
    },

    // ===== نموذج الاتصال =====
    handleContact(e) {
        e.preventDefault();
        const name = document.getElementById('contactName').value.trim();
        const email = document.getElementById('contactEmail').value.trim();
        const subject = document.getElementById('contactSubject').value.trim();
        const message = document.getElementById('contactMessage').value.trim();

        // حفظ الرسالة في localStorage
        const messages = JSON.parse(localStorage.getItem('mc_messages') || '[]');
        messages.push({
            id: Date.now(),
            name, email, subject, message,
            date: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
        });
        localStorage.setItem('mc_messages', JSON.stringify(messages));

        document.getElementById('contactForm').reset();
        this.showToast('تم إرسال رسالتك بنجاح! سنرد عليك في أقرب وقت', 'success');
    },

    // ===== إظهار/إخفاء كلمة المرور =====
    togglePassword(inputId, btn) {
        const input = document.getElementById(inputId);
        const icon = btn.querySelector('i');
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
        }
    },

    // ===== إشعارات Toast =====
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle'
        };

        toast.innerHTML = `<i class="${icons[type] || icons.info}"></i><span>${message}</span>`;
        container.appendChild(toast);

        // إزالة تلقائية بعد 4 ثوانٍ
        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    // ===== نافذة التأكيد =====
    showConfirm(title, message, onConfirm) {
        const modal = document.getElementById('confirmModal');
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        modal.style.display = 'flex';

        const yesBtn = document.getElementById('confirmYes');
        const noBtn = document.getElementById('confirmNo');

        // إزالة المستمعين السابقين
        const newYes = yesBtn.cloneNode(true);
        const newNo = noBtn.cloneNode(true);
        yesBtn.parentNode.replaceChild(newYes, yesBtn);
        noBtn.parentNode.replaceChild(newNo, noBtn);

        newYes.addEventListener('click', () => {
            modal.style.display = 'none';
            onConfirm();
        });

        newNo.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        // إغلاق بالنقر خارج النافذة
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        }, { once: true });
    },

    // ===== تهريب HTML =====
    escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
};

// ===== تشغيل التطبيق عند تحميل الصفحة =====
document.addEventListener('DOMContentLoaded', () => App.init());
