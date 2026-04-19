/**
 * ============================================
 * 河南农业大学·农大闲置 - 管理员后台逻辑
 * 功能：审核/列表/状态同步/数据管理
 * 
 * 【修改说明】
 * 1. 使用事件委托，确保动态生成的内容也能响应点击
 * 2. 标签页切换使用 classList.toggle 方式
 * 3. 通过/拒绝操作同步更新 localStorage
 * 4. 页面刷新后数据持久化
 * ============================================
 */

// 管理员账号
const ADMIN_ACCOUNT = {
    username: 'admin',
    password: '123456'
};

// localStorage 键名
const ADMIN_KEYS = {
    ADMIN_LOGIN: 'hnau_admin_login',
    VERIFY_INFO: 'hnau_verify_info',
    VERIFY_STATE: 'hnau_verify_state',
    USERS: 'hnau_users',
    GOODS: 'hnau_goods',
    COLLECTS: 'hnau_collects'
};

const AdminModule = {
    // 状态
    state: {
        isLoggedIn: false,
        activeTab: 'verify'
    },

    /**
     * 初始化
     */
    init() {
        // 检查是否已登录（从 localStorage 读取）
        this.checkLoginStatus();
        // 渲染页面
        this.render();
        // 绑定事件（使用事件委托）
        this.bindEvents();
    },

    /**
     * 检查登录状态
     */
    checkLoginStatus() {
        try {
            const loginStatus = localStorage.getItem(ADMIN_KEYS.ADMIN_LOGIN);
            if (loginStatus === 'true') {
                this.state.isLoggedIn = true;
            }
        } catch (e) {
            console.warn('读取登录状态失败:', e);
            this.state.isLoggedIn = false;
        }
    },

    /**
     * 渲染页面
     */
    render() {
        const container = document.getElementById('adminContent');
        if (!container) return;

        if (!this.state.isLoggedIn) {
            this.renderLogin(container);
        } else {
            this.renderDashboard(container);
        }
    },

    /**
     * 渲染登录页
     */
    renderLogin(container) {
        container.innerHTML = `
            <div class="card" style="max-width: 400px; margin: 100px auto;">
                <div class="card-header">
                    <h2 class="card-title">🔐 管理员登录</h2>
                </div>
                <form id="adminLoginForm">
                    <div class="form-group">
                        <label class="form-label" for="adminUsername">用户名</label>
                        <input type="text" id="adminUsername" class="form-input" 
                               placeholder="请输入管理员用户名" autocomplete="off">
                        <p class="form-error" id="adminUsernameError"></p>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="adminPassword">密码</label>
                        <input type="password" id="adminPassword" class="form-input" 
                               placeholder="请输入管理员密码">
                        <p class="form-error" id="adminPasswordError"></p>
                    </div>
                    <button type="submit" class="btn btn-primary btn-lg btn-block">
                        登录
                    </button>
                </form>
            </div>
        `;
    },

    /**
     * 渲染仪表盘
     */
    renderDashboard(container) {
        container.innerHTML = `
            <!-- 统计卡片 -->
            <div class="d-flex gap-md flex-wrap" style="margin-bottom: 20px;">
                <div class="card" style="flex: 1; min-width: 200px; text-align: center;">
                    <div style="font-size: 36px; font-weight: bold; color: var(--primary-color);" id="pendingCount">${this.getPendingCount()}</div>
                    <div style="color: var(--text-secondary);">待审核认证</div>
                </div>
                <div class="card" style="flex: 1; min-width: 200px; text-align: center;">
                    <div style="font-size: 36px; font-weight: bold; color: var(--primary-color);">${this.getUsersCount()}</div>
                    <div style="color: var(--text-secondary);">注册用户</div>
                </div>
                <div class="card" style="flex: 1; min-width: 200px; text-align: center;">
                    <div style="font-size: 36px; font-weight: bold; color: var(--primary-color);">${this.getGoodsCount()}</div>
                    <div style="color: var(--text-secondary);">发布商品</div>
                </div>
            </div>

            <!-- 选项卡 -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">📊 管理面板</h2>
                    <button class="btn btn-outline btn-sm" id="adminLogoutBtn">退出登录</button>
                </div>

                <div class="tabs-nav" style="margin-bottom: 20px;">
                    <div class="tabs-nav-item ${this.state.activeTab === 'verify' ? 'active' : ''}" data-tab="verify">认证审核</div>
                    <div class="tabs-nav-item ${this.state.activeTab === 'users' ? 'active' : ''}" data-tab="users">用户管理</div>
                    <div class="tabs-nav-item ${this.state.activeTab === 'goods' ? 'active' : ''}" data-tab="goods">商品管理</div>
                </div>

                <!-- 认证审核 -->
                <div class="tabs-panel ${this.state.activeTab === 'verify' ? 'active' : ''}" id="verifyPanel">
                    ${this.renderVerifyList()}
                </div>

                <!-- 用户管理 -->
                <div class="tabs-panel ${this.state.activeTab === 'users' ? 'active' : ''}" id="usersPanel">
                    ${this.renderUsersList()}
                </div>

                <!-- 商品管理 -->
                <div class="tabs-panel ${this.state.activeTab === 'goods' ? 'active' : ''}" id="goodsPanel">
                    ${this.renderGoodsList()}
                </div>
            </div>
        `;
    },

    /**
     * 获取待审核数量
     */
    getPendingCount() {
        try {
            const verifyState = localStorage.getItem(ADMIN_KEYS.VERIFY_STATE);
            if (verifyState === 'pending') {
                return 1;
            }
        } catch (e) {}
        return 0;
    },

    /**
     * 获取用户数量
     */
    getUsersCount() {
        try {
            const users = localStorage.getItem(ADMIN_KEYS.USERS);
            if (users) {
                return JSON.parse(users).length;
            }
        } catch (e) {}
        return 0;
    },

    /**
     * 获取商品数量
     */
    getGoodsCount() {
        try {
            const goods = localStorage.getItem(ADMIN_KEYS.GOODS);
            if (goods) {
                return JSON.parse(goods).length;
            }
        } catch (e) {}
        return 0;
    },

    /**
     * 渲染认证审核列表
     */
    renderVerifyList() {
        let pendingVerify = null;
        try {
            const verifyState = localStorage.getItem(ADMIN_KEYS.VERIFY_STATE);
            if (verifyState === 'pending') {
                const verifyInfo = localStorage.getItem(ADMIN_KEYS.VERIFY_INFO);
                if (verifyInfo) {
                    pendingVerify = JSON.parse(verifyInfo);
                }
            }
        } catch (e) {}

        if (!pendingVerify) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">✅</div>
                    <p class="empty-state-text">暂无待审核认证</p>
                </div>
            `;
        }

        return `
            <div class="list-table-wrapper">
                <table class="list-table">
                    <thead>
                        <tr>
                            <th>学号</th>
                            <th>校区</th>
                            <th>子校区</th>
                            <th>学院</th>
                            <th>学生证</th>
                            <th>提交时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr data-studentid="${pendingVerify.studentId}">
                            <td>${this.escapeHtml(pendingVerify.studentId)}</td>
                            <td>${this.escapeHtml(pendingVerify.campus)}</td>
                            <td>${pendingVerify.subCampus ? this.escapeHtml(pendingVerify.subCampus) : '-'}</td>
                            <td>${this.escapeHtml(pendingVerify.college)}</td>
                            <td>
                                ${pendingVerify.studentCardImage ? `
                                    <img src="${pendingVerify.studentCardImage}" alt="学生证" 
                                         class="list-table-image verify-image" 
                                         style="cursor: pointer; max-width: 60px; max-height: 60px; object-fit: cover;">
                                ` : '-'}
                            </td>
                            <td>${this.formatDate(pendingVerify.submitTime)}</td>
                            <td>
                                <div class="list-table-actions">
                                    <button class="btn btn-sm btn-success approve-btn" data-id="${pendingVerify.studentId}">通过</button>
                                    <button class="btn btn-sm btn-danger reject-btn" data-id="${pendingVerify.studentId}">拒绝</button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    },

    /**
     * 渲染用户列表
     */
    renderUsersList() {
        let users = [];
        try {
            const usersStr = localStorage.getItem(ADMIN_KEYS.USERS);
            if (usersStr) {
                users = JSON.parse(usersStr);
            }
        } catch (e) {}

        if (users.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <p class="empty-state-text">暂无注册用户</p>
                </div>
            `;
        }

        let verifyInfo = null;
        let verifyState = 'unsubmitted';
        try {
            verifyState = localStorage.getItem(ADMIN_KEYS.VERIFY_STATE) || 'unsubmitted';
            const verifyInfoStr = localStorage.getItem(ADMIN_KEYS.VERIFY_INFO);
            if (verifyInfoStr) {
                verifyInfo = JSON.parse(verifyInfoStr);
            }
        } catch (e) {}

        const stateMap = {
            'unsubmitted': { text: '未认证', class: 'pending' },
            'pending': { text: '审核中', class: 'pending' },
            'approved': { text: '已认证', class: 'approved' }
        };
        const state = stateMap[verifyState] || stateMap['unsubmitted'];

        return `
            <div class="list-table-wrapper">
                <table class="list-table">
                    <thead>
                        <tr>
                            <th>用户名</th>
                            <th>学号</th>
                            <th>校区</th>
                            <th>学院</th>
                            <th>注册时间</th>
                            <th>认证状态</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(user => `
                            <tr>
                                <td>${this.escapeHtml(user.username)}</td>
                                <td>${verifyInfo ? this.escapeHtml(verifyInfo.studentId) : '-'}</td>
                                <td>${verifyInfo ? this.escapeHtml(verifyInfo.campus) : '-'}</td>
                                <td>${verifyInfo ? this.escapeHtml(verifyInfo.college) : '-'}</td>
                                <td>${this.formatDate(user.regTime)}</td>
                                <td><span class="status-badge ${state.class}">${state.text}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    /**
     * 渲染商品列表
     */
    renderGoodsList() {
        let goods = [];
        try {
            const goodsStr = localStorage.getItem(ADMIN_KEYS.GOODS);
            if (goodsStr) {
                goods = JSON.parse(goodsStr);
            }
        } catch (e) {}

        if (goods.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">📦</div>
                    <p class="empty-state-text">暂无发布商品</p>
                </div>
            `;
        }

        return `
            <div class="list-table-wrapper">
                <table class="list-table">
                    <thead>
                        <tr>
                            <th>商品名称</th>
                            <th>价格</th>
                            <th>分类</th>
                            <th>校区</th>
                            <th>发布者</th>
                            <th>发布时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${goods.map(item => `
                            <tr>
                                <td>${this.escapeHtml(item.name)}</td>
                                <td style="color: var(--error-color); font-weight: 600;">¥${parseFloat(item.price).toFixed(2)}</td>
                                <td>${item.category || '-'}</td>
                                <td>${item.campus || '-'}</td>
                                <td>${this.escapeHtml(item.publisher)}</td>
                                <td>${this.formatDate(item.publishTime)}</td>
                                <td>
                                    <div class="list-table-actions">
                                        <button class="btn btn-sm btn-danger delete-goods-btn" data-id="${item.id}">删除</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    /**
     * HTML转义
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * 格式化日期
     */
    formatDate(dateStr) {
        if (!dateStr) return '-';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '-';
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}`;
        } catch (e) {
            return '-';
        }
    },

    /**
     * 显示提示
     */
    showToast(message, type = 'info') {
        // 创建 toast 容器
        let container = document.getElementById('adminToastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'adminToastContainer';
            container.style.cssText = 'position: fixed; top: 80px; right: 20px; z-index: 9999;';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.style.cssText = `
            padding: 12px 20px;
            margin-bottom: 10px;
            border-radius: 8px;
            background: ${type === 'success' ? '#198754' : type === 'error' ? '#DC3545' : '#0D6EFD'};
            color: white;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideInRight 0.3s ease;
        `;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    },

    /**
     * 显示确认弹窗
     */
    showConfirm(title, message, onConfirm) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        overlay.innerHTML = `
            <div style="background: white; padding: 24px; border-radius: 12px; max-width: 400px; width: 90%; box-shadow: 0 8px 32px rgba(0,0,0,0.2);">
                <h3 style="margin: 0 0 16px 0; font-size: 18px; color: #333;">${title}</h3>
                <p style="margin: 0 0 24px 0; color: #666; font-size: 14px;">${message}</p>
                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button class="cancel-btn" style="padding: 8px 20px; border: 1px solid #ddd; background: #fff; border-radius: 6px; cursor: pointer; font-size: 14px;">取消</button>
                    <button class="confirm-btn" style="padding: 8px 20px; border: none; background: #006633; color: white; border-radius: 6px; cursor: pointer; font-size: 14px;">确定</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // 取消按钮
        overlay.querySelector('.cancel-btn').addEventListener('click', () => {
            overlay.remove();
        });

        // 确定按钮
        overlay.querySelector('.confirm-btn').addEventListener('click', () => {
            overlay.remove();
            if (onConfirm) onConfirm();
        });

        // 点击遮罩关闭
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
    },

    /**
     * 【关键修改】绑定事件 - 使用事件委托
     */
    bindEvents() {
        const container = document.getElementById('adminContent');
        if (!container) return;

        // 使用事件委托，在容器上绑定所有事件
        container.onclick = (e) => {
            const target = e.target;

            // ========== 登录表单提交 ==========
            if (target.closest('#adminLoginForm')) {
                if (target.type === 'submit' || target.closest('button[type="submit"]')) {
                    e.preventDefault();
                    this.handleLogin();
                }
            }

            // ========== 退出登录 ==========
            if (target.id === 'adminLogoutBtn' || target.closest('#adminLogoutBtn')) {
                this.showConfirm('退出登录', '确定要退出管理员登录吗？', () => {
                    try {
                        localStorage.setItem(ADMIN_KEYS.ADMIN_LOGIN, 'false');
                    } catch (e) {}
                    this.state.isLoggedIn = false;
                    this.render();
                    this.bindEvents();
                });
            }

            // ========== 标签页切换 ==========
            if (target.classList.contains('tabs-nav-item') || target.closest('.tabs-nav-item')) {
                const tabItem = target.classList.contains('tabs-nav-item') ? target : target.closest('.tabs-nav-item');
                const tabName = tabItem.getAttribute('data-tab');
                if (tabName) {
                    this.switchTab(tabName);
                }
            }

            // ========== 通过认证 ==========
            if (target.classList.contains('approve-btn') || target.closest('.approve-btn')) {
                const btn = target.classList.contains('approve-btn') ? target : target.closest('.approve-btn');
                const studentId = btn.getAttribute('data-id');
                this.showConfirm('通过认证', `确定要通过学号 ${studentId} 的认证申请吗？`, () => {
                    this.approveVerify(studentId);
                });
            }

            // ========== 拒绝认证 ==========
            if (target.classList.contains('reject-btn') || target.closest('.reject-btn')) {
                const btn = target.classList.contains('reject-btn') ? target : target.closest('.reject-btn');
                const studentId = btn.getAttribute('data-id');
                this.showConfirm('拒绝认证', `确定要拒绝学号 ${studentId} 的认证申请吗？`, () => {
                    this.rejectVerify();
                });
            }

            // ========== 删除商品 ==========
            if (target.classList.contains('delete-goods-btn') || target.closest('.delete-goods-btn')) {
                const btn = target.classList.contains('delete-goods-btn') ? target : target.closest('.delete-goods-btn');
                const goodsId = btn.getAttribute('data-id');
                this.showConfirm('删除商品', '确定要删除该商品吗？', () => {
                    this.deleteGoods(goodsId);
                });
            }

            // ========== 图片预览 ==========
            if (target.classList.contains('verify-image') || target.closest('.verify-image')) {
                const img = target.classList.contains('verify-image') ? target : target.closest('.verify-image');
                if (img.src) {
                    this.showImagePreview(img.src);
                }
            }
        };
    },

    /**
     * 【关键修改】标签页切换
     */
    switchTab(tabName) {
        this.state.activeTab = tabName;

        // 更新标签样式
        const tabItems = document.querySelectorAll('.tabs-nav-item');
        tabItems.forEach(tab => {
            if (tab.getAttribute('data-tab') === tabName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // 更新面板显示
        const panels = document.querySelectorAll('.tabs-panel');
        panels.forEach(panel => {
            const panelId = panel.id;
            if (panelId === `${tabName}Panel`) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });
    },

    /**
     * 【关键修改】通过认证
     */
    approveVerify(studentId) {
        try {
            // 更新认证状态为通过
            localStorage.setItem(ADMIN_KEYS.VERIFY_STATE, 'approved');
            this.showToast('认证已通过', 'success');
            // 重新渲染
            this.render();
            this.bindEvents();
        } catch (e) {
            this.showToast('操作失败', 'error');
        }
    },

    /**
     * 【关键修改】拒绝认证
     */
    rejectVerify() {
        try {
            // 清除认证信息和状态
            localStorage.removeItem(ADMIN_KEYS.VERIFY_INFO);
            localStorage.setItem(ADMIN_KEYS.VERIFY_STATE, 'unsubmitted');
            this.showToast('认证申请已拒绝', 'success');
            // 重新渲染
            this.render();
            this.bindEvents();
        } catch (e) {
            this.showToast('操作失败', 'error');
        }
    },

    /**
     * 【关键修改】删除商品
     */
    deleteGoods(goodsId) {
        try {
            // 获取商品列表
            const goodsStr = localStorage.getItem(ADMIN_KEYS.GOODS);
            if (goodsStr) {
                let goods = JSON.parse(goodsStr);
                // 过滤掉要删除的商品
                goods = goods.filter(g => g.id !== goodsId);
                // 保存回 localStorage
                localStorage.setItem(ADMIN_KEYS.GOODS, JSON.stringify(goods));

                // 同步删除相关收藏
                const collectsStr = localStorage.getItem(ADMIN_KEYS.COLLECTS);
                if (collectsStr) {
                    let collects = JSON.parse(collectsStr);
                    collects = collects.filter(c => c.goodsId !== goodsId);
                    localStorage.setItem(ADMIN_KEYS.COLLECTS, JSON.stringify(collects));
                }

                this.showToast('商品已删除', 'success');
                // 重新渲染
                this.render();
                this.bindEvents();
            }
        } catch (e) {
            this.showToast('操作失败', 'error');
        }
    },

    /**
     * 处理登录
     */
    handleLogin() {
        const username = document.getElementById('adminUsername')?.value || '';
        const password = document.getElementById('adminPassword')?.value || '';
        const usernameError = document.getElementById('adminUsernameError');
        const passwordError = document.getElementById('adminPasswordError');

        // 清除错误
        if (usernameError) {
            usernameError.textContent = '';
            usernameError.classList.remove('show');
        }
        if (passwordError) {
            passwordError.textContent = '';
            passwordError.classList.remove('show');
        }

        // 校验
        if (!username) {
            if (usernameError) {
                usernameError.textContent = '请输入用户名';
                usernameError.classList.add('show');
            }
            return;
        }

        if (!password) {
            if (passwordError) {
                passwordError.textContent = '请输入密码';
                passwordError.classList.add('show');
            }
            return;
        }

        // 验证账号密码
        if (username === ADMIN_ACCOUNT.username && password === ADMIN_ACCOUNT.password) {
            try {
                localStorage.setItem(ADMIN_KEYS.ADMIN_LOGIN, 'true');
            } catch (e) {}
            this.state.isLoggedIn = true;
            this.showToast('登录成功', 'success');
            this.render();
            this.bindEvents();
        } else {
            if (passwordError) {
                passwordError.textContent = '用户名或密码错误';
                passwordError.classList.add('show');
            }
        }
    },

    /**
     * 图片预览
     */
    showImagePreview(src) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
            cursor: pointer;
        `;

        const img = document.createElement('img');
        img.src = src;
        img.style.cssText = 'max-width: 90%; max-height: 90%; object-fit: contain;';
        overlay.appendChild(img);

        // 关闭按钮
        const closeBtn = document.createElement('span');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = 'position: absolute; top: 20px; right: 20px; color: white; font-size: 36px; cursor: pointer;';
        overlay.appendChild(closeBtn);

        overlay.addEventListener('click', (e) => {
            if (e.target !== img) {
                overlay.remove();
            }
        });

        closeBtn.addEventListener('click', () => overlay.remove());

        document.body.appendChild(overlay);
    }
};

// ========== 页面加载完成后初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('adminContent')) {
        AdminModule.init();
    }
});

// ========== 添加动画样式 ==========
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(style);
