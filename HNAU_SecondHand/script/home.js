/**
 * ============================================
 * 河南农业大学·农大闲置 - 首页逻辑
 * 功能：搜索/筛选/商品渲染/收藏
 * ============================================
 */

// 筛选数据
const FILTER_DATA = {
    campuses: [
        { value: '', label: '全部校区' },
        { value: '郑州龙子湖', label: '郑州龙子湖' },
        { value: '郑州文化路', label: '郑州文化路' },
        { value: '郑州桃李园', label: '郑州桃李园' },
        { value: '许昌', label: '许昌' }
    ],
    categories: [
        { value: '', label: '全部分类' },
        { value: '农业书籍', label: '农业书籍' },
        { value: '实验器材', label: '实验器材' },
        { value: '教材资料', label: '教材资料' },
        { value: '宿舍用品', label: '宿舍用品' },
        { value: '数码电子', label: '数码电子' },
        { value: '生活日化', label: '生活日化' },
        { value: '体育用品', label: '体育用品' },
        { value: '其他', label: '其他' }
    ]
};

const HomeModule = {
    // 状态
    state: {
        goods: [],
        collects: [],
        filteredGoods: [],
        searchKeyword: '',
        filterCampus: '',
        filterCategory: '',
        suggestions: []
    },

    /**
     * 初始化
     */
    init() {
        this.loadData();
        this.render();
        this.bindEvents();
    },

    /**
     * 加载数据
     */
    loadData() {
        this.state.goods = Auth.getGoods().filter(g => g.status === 'active');
        this.state.collects = Auth.getCollects();
        this.applyFilters();
    },

    /**
     * 渲染页面
     */
    render() {
        // 渲染筛选器
        this.renderFilters();

        // 渲染商品列表
        this.renderGoods();
    },

    /**
     * 渲染筛选器
     */
    renderFilters() {
        const campusSelect = document.getElementById('filterCampus');
        const categorySelect = document.getElementById('filterCategory');

        if (campusSelect) {
            campusSelect.innerHTML = FILTER_DATA.campuses.map(c => 
                `<option value="${c.value}" ${this.state.filterCampus === c.value ? 'selected' : ''}>${c.label}</option>`
            ).join('');
        }

        if (categorySelect) {
            categorySelect.innerHTML = FILTER_DATA.categories.map(c => 
                `<option value="${c.value}" ${this.state.filterCategory === c.value ? 'selected' : ''}>${c.label}</option>`
            ).join('');
        }

        // 搜索框
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = this.state.searchKeyword;
        }
    },

    /**
     * 渲染商品列表
     */
    renderGoods() {
        const container = document.getElementById('goodsGrid');
        if (!container) return;

        if (this.state.filteredGoods.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-state-icon">📦</div>
                    <p class="empty-state-text">暂无符合条件的商品</p>
                </div>
            `;
            return;
        }

        const loginState = Auth.getLoginState();
        const isLoggedIn = loginState.isLogin;

        container.innerHTML = this.state.filteredGoods.map(goods => {
            const isCollected = isLoggedIn && this.isCollected(goods.id);
            const imageSrc = goods.images && goods.images.length > 0 
                ? goods.images[0] 
                : '';

            return `
                <div class="goods-card" data-id="${goods.id}">
                    <div class="goods-card-flip">
                        <div class="goods-card-inner">
                            <!-- 正面 -->
                            <div class="goods-card-front">
                                <span class="goods-card-campus">${goods.campus}</span>
                                ${isLoggedIn ? `
                                    <button class="goods-card-collect ${isCollected ? 'collected' : ''}" 
                                            data-id="${goods.id}" 
                                            title="${isCollected ? '取消收藏' : '收藏'}">
                                        <span class="goods-card-collect-icon">${isCollected ? '❤️' : '🤍'}</span>
                                    </button>
                                ` : ''}
                                ${imageSrc ? `
                                    <img src="${imageSrc}" alt="${Utils.escapeHtml(goods.name)}" 
                                         class="goods-card-image"
                                         onerror="this.parentElement.querySelector('.goods-card-placeholder').style.display='flex'; this.style.display='none';">
                                    <div class="goods-card-placeholder" style="display: none;">
                                        <img src="./images/logo.png" alt="logo">
                                    </div>
                                ` : `
                                    <div class="goods-card-placeholder">
                                        <img src="./images/logo.png" alt="logo">
                                    </div>
                                `}
                                <div class="goods-card-info">
                                    <h3 class="goods-card-name">${Utils.escapeHtml(goods.name)}</h3>
                                    <p class="goods-card-price">${goods.price.toFixed(2)}</p>
                                    <p class="goods-card-meta">${goods.category} · ${Utils.formatDateOnly(goods.publishTime)}</p>
                                </div>
                            </div>
                            <!-- 背面 -->
                            <div class="goods-card-back">
                                <h3 class="goods-card-back-title">${Utils.escapeHtml(goods.name)}</h3>
                                <p class="goods-card-back-desc">${goods.description ? Utils.escapeHtml(goods.description) : '暂无简介'}</p>
                                <p class="goods-card-back-info">发布者：${Utils.escapeHtml(goods.publisher)}</p>
                                <p class="goods-card-back-info">交易地点：${Utils.escapeHtml(goods.tradeLocation)}</p>
                                <p class="goods-card-back-info">微信号：${Utils.escapeHtml(goods.wechatId)}</p>
                                <div class="goods-card-back-actions">
                                    ${isLoggedIn ? `
                                        <button class="btn btn-sm ${isCollected ? 'btn-outline' : 'btn-primary'} goods-collect-btn ${isCollected ? 'collected' : ''}" 
                                                data-id="${goods.id}">
                                            ${isCollected ? '取消收藏' : '❤️ 收藏'}
                                        </button>
                                    ` : `
                                        <button class="btn btn-sm btn-primary goods-login-btn">登录后收藏</button>
                                    `}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // 绑定收藏按钮事件
        this.bindCollectEvents();
    },

    /**
     * 绑定收藏按钮事件
     */
    bindCollectEvents() {
        // 收藏按钮
        const collectBtns = document.querySelectorAll('.goods-collect-btn');
        collectBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const goodsId = btn.dataset.id;
                this.toggleCollect(goodsId);
            });
        });

        // 心形收藏按钮
        const heartBtns = document.querySelectorAll('.goods-card-collect');
        heartBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const goodsId = btn.dataset.id;
                this.toggleCollect(goodsId);
            });
        });

        // 登录提示按钮
        const loginBtns = document.querySelectorAll('.goods-login-btn');
        loginBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                Toast.show('请先登录', 'info', 1500);
                setTimeout(() => {
                    Utils.跳转('user_login.html', 'login');
                }, 1500);
            });
        });

        // 卡片点击翻转（不阻止事件冒泡到卡片）
        const cards = document.querySelectorAll('.goods-card');
        cards.forEach(card => {
            card.addEventListener('click', (e) => {
                // 点击卡片时切换翻转状态
                card.classList.toggle('flipped');
            });
        });
    },

    /**
     * 绑定事件
     */
    bindEvents() {
        // 搜索输入
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.handleSearch(e.target.value);
            }, 300));

            searchInput.addEventListener('focus', () => {
                this.showSuggestions();
            });
        }

        // 点击外部关闭联想列表
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-input-wrapper')) {
                this.hideSuggestions();
            }
        });

        // 校区筛选
        const campusSelect = document.getElementById('filterCampus');
        if (campusSelect) {
            campusSelect.addEventListener('change', (e) => {
                this.state.filterCampus = e.target.value;
                this.applyFilters();
                this.renderGoods();
            });
        }

        // 分类筛选
        const categorySelect = document.getElementById('filterCategory');
        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => {
                this.state.filterCategory = e.target.value;
                this.applyFilters();
                this.renderGoods();
            });
        }

        // 清除筛选
        const clearBtn = document.getElementById('clearFilterBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearFilters();
            });
        }

        // 发布按钮
        const releaseBtn = document.getElementById('releaseBtn');
        if (releaseBtn) {
            releaseBtn.addEventListener('click', () => {
                Auth.requireReleasePermission(() => {
                    Utils.跳转('release_goods.html');
                });
            });
        }

        // 搜索按钮
        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                const keyword = searchInput?.value || '';
                this.handleSearch(keyword);
            });
        }
    },

    /**
     * 处理搜索
     * @param {string} keyword - 关键词
     */
    handleSearch(keyword) {
        this.state.searchKeyword = keyword.trim().toLowerCase();
        this.applyFilters();
        this.renderGoods();
        this.updateSuggestions();
    },

    /**
     * 应用筛选
     */
    applyFilters() {
        let goods = [...this.state.goods];

        // 搜索筛选
        if (this.state.searchKeyword) {
            goods = goods.filter(g => 
                g.name.toLowerCase().includes(this.state.searchKeyword)
            );
        }

        // 校区筛选
        if (this.state.filterCampus) {
            goods = goods.filter(g => g.campus === this.state.filterCampus);
        }

        // 分类筛选
        if (this.state.filterCategory) {
            goods = goods.filter(g => g.category === this.state.filterCategory);
        }

        // 按发布时间倒序
        goods.sort((a, b) => {
            const timeA = new Date(a.publishTime).getTime();
            const timeB = new Date(b.publishTime).getTime();
            return timeB - timeA;
        });

        this.state.filteredGoods = goods;
    },

    /**
     * 清除筛选
     */
    clearFilters() {
        this.state.searchKeyword = '';
        this.state.filterCampus = '';
        this.state.filterCategory = '';
        this.applyFilters();
        this.renderFilters();
        this.renderGoods();
    },

    /**
     * 显示联想列表
     */
    showSuggestions() {
        this.updateSuggestions();
        const suggestions = document.getElementById('searchSuggestions');
        if (suggestions) {
            suggestions.classList.add('show');
        }
    },

    /**
     * 隐藏联想列表
     */
    hideSuggestions() {
        const suggestions = document.getElementById('searchSuggestions');
        if (suggestions) {
            suggestions.classList.remove('show');
        }
    },

    /**
     * 更新联想列表
     */
    updateSuggestions() {
        const suggestions = document.getElementById('searchSuggestions');
        if (!suggestions) return;

        if (!this.state.searchKeyword) {
            suggestions.classList.remove('show');
            return;
        }

        // 获取匹配的商品名称
        const matches = this.state.goods
            .filter(g => g.name.toLowerCase().includes(this.state.searchKeyword))
            .map(g => g.name)
            .filter((v, i, a) => a.indexOf(v) === i) // 去重
            .slice(0, 8);

        if (matches.length === 0) {
            suggestions.innerHTML = `
                <div class="search-suggestion-item no-result">暂无相关商品</div>
            `;
        } else {
            suggestions.innerHTML = matches.map(name => 
                `<div class="search-suggestion-item">${Utils.escapeHtml(name)}</div>`
            ).join('');
        }

        // 绑定点击事件
        const items = suggestions.querySelectorAll('.search-suggestion-item:not(.no-result)');
        items.forEach((item, index) => {
            item.addEventListener('click', () => {
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.value = matches[index];
                    this.handleSearch(matches[index]);
                }
                this.hideSuggestions();
            });
        });

        suggestions.classList.add('show');
    },

    /**
     * 检查是否已收藏
     * @param {string} goodsId - 商品ID
     * @returns {boolean}
     */
    isCollected(goodsId) {
        const loginState = Auth.getLoginState();
        if (!loginState.isLogin) return false;

        return this.state.collects.some(c => 
            c.user === loginState.curUser && c.goodsId === goodsId
        );
    },

    /**
     * 切换收藏状态
     * @param {string} goodsId - 商品ID
     */
    toggleCollect(goodsId) {
        if (!Auth.isLoggedIn()) {
            Toast.show('请先登录', 'info', 1500);
            setTimeout(() => {
                Utils.跳转('user_login.html', 'login');
            }, 1500);
            return;
        }

        const loginState = Auth.getLoginState();
        const collects = this.state.collects;

        const existIndex = collects.findIndex(c => 
            c.user === loginState.curUser && c.goodsId === goodsId
        );

        if (existIndex !== -1) {
            // 取消收藏
            collects.splice(existIndex, 1);
            Storage.set(Auth.KEYS.COLLECTS, collects);
            Toast.show('已取消收藏', 'success');
        } else {
            // 添加收藏
            collects.push({
                user: loginState.curUser,
                goodsId: goodsId,
                collectTime: Utils.formatDate(new Date())
            });
            Storage.set(Auth.KEYS.COLLECTS, collects);
            Toast.show('收藏成功', 'success');
        }

        // 重新加载数据并渲染
        this.state.collects = collects;
        
        // 保存翻转状态
        const flippedCards = {};
        document.querySelectorAll('.goods-card.flipped').forEach(card => {
            flippedCards[card.dataset.id] = true;
        });
        
        this.renderGoods();
        
        // 恢复翻转状态
        Object.keys(flippedCards).forEach(id => {
            const card = document.querySelector(`.goods-card[data-id="${id}"]`);
            if (card) {
                card.classList.add('flipped');
            }
        });
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('homeContent')) {
        HomeModule.init();
    }
});

// 定时刷新商品列表（检测新发布）
setInterval(() => {
    if (document.getElementById('homeContent') && HomeModule) {
        const newGoods = Auth.getGoods().filter(g => g.status === 'active');
        if (newGoods.length !== HomeModule.state.goods.length) {
            HomeModule.loadData();
            HomeModule.renderGoods();
        }
    }
}, 3000);
