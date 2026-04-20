/**
 * ============================================
 * 河南农业大学·农大闲置 - 管理员后台逻辑
 * 功能：审核/列表/状态同步/数据管理
 * ============================================
 */

// ========== 管理员账号配置 ==========
const ADMIN_ACCOUNT = {
    username: '2589241396',
    password: '147258369Bq@'
};

// ========== localStorage 键名常量 ==========
const ADMIN_KEYS = {
    ADMIN_LOGIN: 'hnau_admin_login',
    VERIFY_INFO: 'hnau_verify_info',
    VERIFY_STATE: 'hnau_verify_state',
    USERS: 'hnau_users',
    GOODS: 'hnau_goods',
    COLLECTS: 'hnau_collects',
    PENDING_AUTHS: 'hnau_pending_auths'  // 【新增】待审核认证列表
};

// ========== 认证状态常量 ==========
const VERIFY_STATES = {
    UNSUBMITTED: 'unsubmitted',
    PENDING: 'pending',
    APPROVED: 'approved'
};

// ========== 管理员模块 ==========
const AdminModule = {
    // ---------- 状态管理 ----------
    state: {
        isLoggedIn: false,
        activeTab: 'verify'
    },

    // ---------- 初始化 ----------
    /**
     * 初始化模块
     */
    init() {
        this.checkLoginStatus();
        this.render();
        this.bindEvents();
        // 【新增】监听 localStorage 变化，实现跨页面数据同步
        this.bindStorageListener();
    },

    /**
     * 【新增】监听 localStorage 变化
     * 当其他页面（如校园认证页）修改数据时，自动刷新认证审核列表
     * 
     * 【注意】storage 事件只在跨标签页时触发
     * 同一标签页内修改 localStorage 不会触发此事件
     * 所以需要配合主动轮询机制使用
     */
    bindStorageListener() {
        // 移除旧监听器（防止重复）
        if (this._storageListener) {
            window.removeEventListener('storage', this._storageListener);
        }
        if (this._pollInterval) {
            clearInterval(this._pollInterval);
        }

        // 记录上一次的数据状态，用于检测变化
        this._lastDataHash = this._getDataHash();

        // 创建监听器 - 用于跨标签页同步
        this._storageListener = (e) => {
            if (!e.key || 
                (e.key !== ADMIN_KEYS.VERIFY_INFO && 
                 e.key !== ADMIN_KEYS.VERIFY_STATE &&
                 e.key !== ADMIN_KEYS.USERS &&
                 e.key !== ADMIN_KEYS.GOODS)) {
                return;
            }

            console.log('[Admin] 检测到其他页面数据变化:', e.key);
            this._refreshAllData();
        };

        window.addEventListener('storage', this._storageListener);

        // 【关键】主动轮询 - 用于检测同标签页内的数据变化
        this._pollInterval = setInterval(() => {
            if (!this.state.isLoggedIn) return;
            
            const currentHash = this._getDataHash();
            if (currentHash !== this._lastDataHash) {
                console.log('[Admin] 检测到数据变化（轮询）');
                this._lastDataHash = currentHash;
                this._refreshAllData();
            }
        }, 500); // 每500ms检查一次

        // 页面可见性变化时刷新数据
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && this.state.isLoggedIn) {
                console.log('[Admin] 页面恢复可见，检查数据...');
                this._refreshAllData();
            }
        });

        // 页面离开时清理
        window.addEventListener('beforeunload', () => {
            if (this._pollInterval) {
                clearInterval(this._pollInterval);
            }
        });
    },

    /**
     * 【新增】获取当前数据的哈希值
     * 用于检测数据是否发生变化
     */
    _getDataHash() {
        const data = {
            verifyState: localStorage.getItem(ADMIN_KEYS.VERIFY_STATE) || '',
            verifyInfo: localStorage.getItem(ADMIN_KEYS.VERIFY_INFO) || '',
            users: localStorage.getItem(ADMIN_KEYS.USERS) || '',
            goods: localStorage.getItem(ADMIN_KEYS.GOODS) || ''
        };
        return JSON.stringify(data);
    },

    /**
     * 【新增】刷新所有数据
     * 根据当前激活的标签页刷新对应数据
     */
    _refreshAllData() {
        // 刷新顶部统计数字
        const pendingCount = this.getPendingCount();
        const pendingCountEl = document.getElementById('pendingCountNum');
        if (pendingCountEl) {
            pendingCountEl.textContent = pendingCount;
        }

        // 更新标签徽章
        const verifyTab = document.querySelector('.tabs-nav-item[data-tab="verify"]');
        if (verifyTab) {
            let badge = verifyTab.querySelector('.tabs-badge');
            if (pendingCount > 0) {
                if (badge) {
                    badge.textContent = pendingCount;
                } else {
                    badge = document.createElement('span');
                    badge.className = 'tabs-badge';
                    badge.textContent = pendingCount;
                    verifyTab.appendChild(badge);
                }
            } else if (badge) {
                badge.remove();
            }
        }

        // 刷新当前标签页的内容
        if (this.state.activeTab === 'verify') {
            const verifyPanel = document.getElementById('verifyPanel');
            if (verifyPanel) {
                verifyPanel.innerHTML = this.renderVerifyList();
                this.bindVerifyPanelEvents();
            }
        } else if (this.state.activeTab === 'users') {
            const usersPanel = document.getElementById('usersPanel');
            if (usersPanel) {
                usersPanel.innerHTML = this.renderUsersList();
            }
        } else if (this.state.activeTab === 'goods') {
            const goodsPanel = document.getElementById('goodsPanel');
            if (goodsPanel) {
                goodsPanel.innerHTML = this.renderGoodsList();
            }
        }
    },

    /**
     * 检查登录状态
     */
    checkLoginStatus() {
        try {
            const loginStatus = localStorage.getItem(ADMIN_KEYS.ADMIN_LOGIN);
            if (loginStatus === 'true') {
                this.state.isLoggedIn = true;
            } else {
                this.state.isLoggedIn = false;
            }
        } catch (e) {
            console.warn('[Admin] 读取登录状态失败:', e);
            this.state.isLoggedIn = false;
        }
    },

    // ---------- 渲染函数 ----------
    /**
     * 渲染主容器
     * @param {HTMLElement} container - 容器元素
     */
    render() {
        const container = document.getElementById('adminContent');
        if (!container) {
            console.error('[Admin] 未找到 adminContent 容器');
            return;
        }

        if (!this.state.isLoggedIn) {
            this.renderLogin(container);
        } else {
            this.renderDashboard(container);
        }
    },

    /**
     * 渲染登录页面
     * @param {HTMLElement} container - 容器元素
     */
    renderLogin(container) {
        container.innerHTML = `
            <div class="admin-login-wrapper">
                <div class="card admin-login-card">
                    <div class="card-header" style="text-align: center; border-bottom: 1px solid var(--border-color); padding-bottom: 20px;">
                        <h2 class="card-title" style="margin: 0; font-size: 24px; color: var(--primary-color);">
                            🔐 管理员登录
                        </h2>
                    </div>
                    <div class="card-body" style="padding: 30px;">
                        <form id="adminLoginForm" novalidate>
                            <div class="form-group">
                                <label class="form-label" for="adminUsername">
                                    <span style="color: var(--error-color);">*</span> 用户名
                                </label>
                                <input 
                                    type="text" 
                                    id="adminUsername" 
                                    class="form-input" 
                                    placeholder="请输入管理员用户名"
                                    autocomplete="off"
                                    maxlength="20"
                                    required
                                >
                                <p class="form-error" id="adminUsernameError"></p>
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="adminPassword">
                                    <span style="color: var(--error-color);">*</span> 密码
                                </label>
                                <input 
                                    type="password" 
                                    id="adminPassword" 
                                    class="form-input" 
                                    placeholder="请输入管理员密码"
                                    maxlength="20"
                                    required
                                >
                                <p class="form-error" id="adminPasswordError"></p>
                            </div>
                            <button 
                                type="submit" 
                                id="adminLoginBtn"
                                class="btn btn-primary btn-lg btn-block"
                                style="margin-top: 10px; height: 48px; font-size: 16px;"
                            >
                                登 录
                            </button>
                        </form>
                        <div style="margin-top: 20px; padding: 15px; background: var(--bg-light); border-radius: 8px; font-size: 13px; color: var(--text-secondary);">
                            <p style="margin: 0 0 8px 0;"><strong>测试账号：</strong></p>
                            <p style="margin: 0;">用户名：admin</p>
                            <p style="margin: 4px 0 0 0;">密码：123456</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * 渲染仪表盘页面
     * @param {HTMLElement} container - 容器元素
     */
    renderDashboard(container) {
        const pendingCount = this.getPendingCount();
        const usersCount = this.getUsersCount();
        const goodsCount = this.getGoodsCount();

        container.innerHTML = `
            <!-- 统计卡片区域 -->
            <div class="admin-stats-grid">
                <div class="card admin-stat-card">
                    <div class="admin-stat-icon" style="background: linear-gradient(135deg, #006633 0%, #008844 100%);">
                        📋
                    </div>
                    <div class="admin-stat-content">
                        <div class="admin-stat-number" id="pendingCountNum">${pendingCount}</div>
                        <div class="admin-stat-label">待审核认证</div>
                    </div>
                </div>
                <div class="card admin-stat-card">
                    <div class="admin-stat-icon" style="background: linear-gradient(135deg, #F5A623 0%, #FF8C00 100%);">
                        👥
                    </div>
                    <div class="admin-stat-content">
                        <div class="admin-stat-number">${usersCount}</div>
                        <div class="admin-stat-label">注册用户</div>
                    </div>
                </div>
                <div class="card admin-stat-card">
                    <div class="admin-stat-icon" style="background: linear-gradient(135deg, #0D6EFD 0%, #2563EB 100%);">
                        📦
                    </div>
                    <div class="admin-stat-content">
                        <div class="admin-stat-number">${goodsCount}</div>
                        <div class="admin-stat-label">发布商品</div>
                    </div>
                </div>
            </div>

            <!-- 管理面板卡片 -->
            <div class="card admin-panel-card">
                <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                    <h2 class="card-title" style="margin: 0; display: flex; align-items: center; gap: 8px;">
                        <span>📊</span> 管理面板
                        <button 
                            id="refreshDataBtn"
                            title="刷新数据"
                            style="background: none; border: none; cursor: pointer; font-size: 18px; padding: 4px 8px; border-radius: 4px; transition: background 0.2s;"
                            onmouseover="this.style.background='#f0f0f0'"
                            onmouseout="this.style.background='none'"
                        >
                            🔄
                        </button>
                    </h2>
                    <button class="btn btn-outline btn-sm" id="adminLogoutBtn" style="display: flex; align-items: center; gap: 5px;">
                        <span>🚪</span> 退出登录
                    </button>
                </div>

                <!-- 标签页导航 -->
                <div class="tabs-nav" id="adminTabsNav" style="margin-bottom: 0; border-bottom: 2px solid var(--border-color);">
                    <div class="tabs-nav-item ${this.state.activeTab === 'verify' ? 'active' : ''}" data-tab="verify">
                        <span>📋</span> 认证审核
                        ${pendingCount > 0 ? `<span class="tabs-badge">${pendingCount}</span>` : ''}
                    </div>
                    <div class="tabs-nav-item ${this.state.activeTab === 'users' ? 'active' : ''}" data-tab="users">
                        <span>👥</span> 用户管理
                    </div>
                    <div class="tabs-nav-item ${this.state.activeTab === 'goods' ? 'active' : ''}" data-tab="goods">
                        <span>📦</span> 商品管理
                    </div>
                </div>

                <!-- 标签页内容面板 -->
                <div class="tabs-content" style="padding: 24px 0;">
                    <!-- 认证审核面板 -->
                    <div class="tabs-panel ${this.state.activeTab === 'verify' ? 'active' : ''}" id="verifyPanel">
                        ${this.renderVerifyList()}
                    </div>

                    <!-- 用户管理面板 -->
                    <div class="tabs-panel ${this.state.activeTab === 'users' ? 'active' : ''}" id="usersPanel">
                        ${this.renderUsersList()}
                    </div>

                    <!-- 商品管理面板 -->
                    <div class="tabs-panel ${this.state.activeTab === 'goods' ? 'active' : ''}" id="goodsPanel">
                        ${this.renderGoodsList()}
                    </div>
                </div>
            </div>
        `;
    },

    // ---------- 数据获取函数 ----------
    /**
     * 【修复】获取待审核数量 - 从 pendingAuthList 读取
     * @returns {number}
     */
    getPendingCount() {
        try {
            // 【关键修改】从 pendingAuthList 读取待审核申请
            const pendingAuthsStr = localStorage.getItem(ADMIN_KEYS.PENDING_AUTHS);
            let pendingAuths = [];
            if (pendingAuthsStr) {
                pendingAuths = JSON.parse(pendingAuthsStr);
            }
            
            // 只统计状态为 pending 的申请
            const pendingList = pendingAuths.filter(a => a.status === 'pending');
            const count = pendingList.length;
            console.log('[Admin] 待审核认证数量:', count, '(从 pendingAuthList)');
            return count;
        } catch (e) {
            console.error('[Admin] 获取待审核数量失败:', e);
            return 0;
        }
    },
    
    /**
     * 【新增】获取待审核认证列表
     * @returns {Array}
     */
    getPendingAuths() {
        try {
            const pendingAuthsStr = localStorage.getItem(ADMIN_KEYS.PENDING_AUTHS);
            if (!pendingAuthsStr) return [];
            const pendingAuths = JSON.parse(pendingAuthsStr);
            // 只返回 pending 状态的申请
            return pendingAuths.filter(a => a.status === 'pending');
        } catch (e) {
            console.error('[Admin] 获取待审核列表失败:', e);
            return [];
        }
    },

    /**
     * 获取用户数量
     * @returns {number}
     */
    getUsersCount() {
        try {
            const usersStr = localStorage.getItem(ADMIN_KEYS.USERS);
            if (!usersStr) return 0;
            const users = JSON.parse(usersStr);
            return Array.isArray(users) ? users.length : 0;
        } catch (e) {
            return 0;
        }
    },

    /**
     * 获取商品数量
     * @returns {number}
     */
    getGoodsCount() {
        try {
            const goodsStr = localStorage.getItem(ADMIN_KEYS.GOODS);
            if (!goodsStr) return 0;
            const goods = JSON.parse(goodsStr);
            return Array.isArray(goods) ? goods.length : 0;
        } catch (e) {
            return 0;
        }
    },

    // ---------- 列表渲染函数 ----------
    /**
     * 渲染认证审核列表
     * @returns {string} HTML字符串
     */
    /**
     * 【修复】渲染认证审核列表 - 从 pendingAuthList 读取
     * @returns {string} HTML字符串
     */
    renderVerifyList() {
        // 【关键修改】从 pendingAuthList 获取待审核申请
        const pendingAuths = this.getPendingAuths();
        console.log('[Admin] renderVerifyList - 待审核列表:', pendingAuths);

        // 无待审核数据
        if (pendingAuths.length === 0) {
            return `
                <div class="empty-state" style="padding: 60px 20px;">
                    <div class="empty-state-icon" style="font-size: 64px;">✅</div>
                    <p class="empty-state-text" style="font-size: 16px; margin-top: 16px;">暂无待审核认证</p>
                    <p style="color: var(--text-hint); font-size: 13px; margin-top: 8px;">所有认证申请已处理完毕</p>
                </div>
            `;
        }

        // 渲染待审核列表
        return `
            <div class="list-table-wrapper" style="overflow-x: auto;">
                <table class="list-table" style="min-width: 800px;">
                    <thead>
                        <tr>
                            <th style="width: 100px;">学号</th>
                            <th style="width: 90px;">校区</th>
                            <th style="width: 90px;">子校区</th>
                            <th style="width: 130px;">学院</th>
                            <th style="width: 90px;">学生证</th>
                            <th style="width: 140px;">提交时间</th>
                            <th style="width: 140px;">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pendingAuths.map(auth => `
                            <tr data-id="${auth.id}" data-studentid="${this.escapeHtml(auth.studentId)}">
                                <td>
                                    <span style="font-weight: 600; color: var(--primary-color);">
                                        ${this.escapeHtml(auth.studentId)}
                                    </span>
                                </td>
                                <td>${this.escapeHtml(auth.campus)}</td>
                                <td>${auth.subCampus ? this.escapeHtml(auth.subCampus) : '-'}</td>
                                <td>${this.escapeHtml(auth.college)}</td>
                                <td>
                                    ${auth.studentCardImage ? `
                                        <img 
                                            src="${auth.studentCardImage}" 
                                            alt="学生证" 
                                            class="verify-image"
                                            title="点击查看大图"
                                            style="cursor: pointer; width: 50px; height: 50px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-color);"
                                        >
                                    ` : '<span style="color: var(--text-hint);">未上传</span>'}
                                </td>
                                <td>
                                    <span style="font-size: 13px; color: var(--text-secondary);">
                                        ${this.formatDate(auth.submitTime)}
                                    </span>
                                </td>
                                <td>
                                    <div class="list-table-actions" style="gap: 8px;">
                                        <button 
                                            class="btn btn-sm approve-btn" 
                                            data-id="${auth.id}"
                                            data-studentid="${this.escapeHtml(auth.studentId)}"
                                            style="background: #198754; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 13px;"
                                        >
                                            ✅ 通过
                                        </button>
                                        <button 
                                            class="btn btn-sm reject-btn" 
                                            data-id="${auth.id}"
                                            data-studentid="${this.escapeHtml(auth.studentId)}"
                                            style="background: #DC3545; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 13px;"
                                        >
                                            ❌ 拒绝
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div style="margin-top: 16px; padding: 12px 16px; background: var(--bg-light); border-radius: 8px; font-size: 13px; color: var(--text-secondary);">
                <span>📌</span> 共 ${pendingAuths.length} 条待审核申请 | 数据来源: pendingAuthList
            </div>
        `;
    },

    /**
     * 渲染用户管理列表
     * @returns {string} HTML字符串
     */
    renderUsersList() {
        let users = [];

        try {
            const usersStr = localStorage.getItem(ADMIN_KEYS.USERS);
            if (usersStr) {
                users = JSON.parse(usersStr);
                if (!Array.isArray(users)) users = [];
            }
        } catch (e) {
            console.warn('[Admin] 读取用户列表失败:', e);
        }

        // 无用户数据
        if (users.length === 0) {
            return `
                <div class="empty-state" style="padding: 60px 20px;">
                    <div class="empty-state-icon" style="font-size: 64px;">👥</div>
                    <p class="empty-state-text" style="font-size: 16px; margin-top: 16px;">暂无注册用户</p>
                    <p style="color: var(--text-hint); font-size: 13px; margin-top: 8px;">等待学生完成校园认证和注册</p>
                </div>
            `;
        }

        // 【修复】认证状态映射 - 每个用户独立状态
        const getStateInfo = (authStatus) => {
            const stateMap = {
                'unsubmitted': { text: '未认证', bg: '#FFF3CD', color: '#856404' },
                'pending': { text: '审核中', bg: '#FFF3CD', color: '#856404' },
                'approved': { text: '已认证', bg: '#D4EDDA', color: '#155724' },
                'rejected': { text: '已拒绝', bg: '#F8D7DA', color: '#721C24' }
            };
            return stateMap[authStatus] || stateMap['unsubmitted'];
        };

        return `
            <div class="list-table-wrapper" style="overflow-x: auto;">
                <table class="list-table" style="min-width: 700px;">
                    <thead>
                        <tr>
                            <th style="width: 120px;">用户名</th>
                            <th style="width: 120px;">学号</th>
                            <th style="width: 100px;">校区</th>
                            <th style="width: 150px;">学院</th>
                            <th style="width: 150px;">注册时间</th>
                            <th style="width: 100px;">认证状态</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(user => {
                            const stateInfo = getStateInfo(user.authStatus);
                            return `
                            <tr>
                                <td>
                                    <span style="font-weight: 500;">
                                        ${this.escapeHtml(user.username)}
                                    </span>
                                </td>
                                <td>${user.studentId ? this.escapeHtml(user.studentId) : '-'}</td>
                                <td>${user.campus ? this.escapeHtml(user.campus) : '-'}</td>
                                <td>${user.college ? this.escapeHtml(user.college) : '-'}</td>
                                <td>
                                    <span style="font-size: 13px; color: var(--text-secondary);">
                                        ${this.formatDate(user.regTime)}
                                    </span>
                                </td>
                                <td>
                                    <span class="status-badge" style="background: ${stateInfo.bg}; color: ${stateInfo.color}; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500;">
                                        ${stateInfo.text}
                                    </span>
                                </td>
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>
            </div>
            <div style="margin-top: 16px; padding: 12px 16px; background: var(--bg-light); border-radius: 8px; font-size: 13px; color: var(--text-secondary);">
                <span>📌</span> 共 ${users.length} 位注册用户 | 认证状态与单个用户独立绑定
            </div>
        `;
    },

    /**
     * 渲染商品管理列表
     * @returns {string} HTML字符串
     */
    renderGoodsList() {
        let goods = [];

        try {
            const goodsStr = localStorage.getItem(ADMIN_KEYS.GOODS);
            if (goodsStr) {
                goods = JSON.parse(goodsStr);
                if (!Array.isArray(goods)) goods = [];
            }
        } catch (e) {
            console.warn('[Admin] 读取商品列表失败:', e);
        }

        // 无商品数据
        if (goods.length === 0) {
            return `
                <div class="empty-state" style="padding: 60px 20px;">
                    <div class="empty-state-icon" style="font-size: 64px;">📦</div>
                    <p class="empty-state-text" style="font-size: 16px; margin-top: 16px;">暂无发布商品</p>
                    <p style="color: var(--text-hint); font-size: 13px; margin-top: 8px;">等待学生发布闲置物品</p>
                </div>
            `;
        }

        return `
            <div class="list-table-wrapper" style="overflow-x: auto;">
                <table class="list-table" style="min-width: 900px;">
                    <thead>
                        <tr>
                            <th style="width: 200px;">商品名称</th>
                            <th style="width: 80px;">价格</th>
                            <th style="width: 100px;">分类</th>
                            <th style="width: 100px;">校区</th>
                            <th style="width: 100px;">发布者</th>
                            <th style="width: 150px;">发布时间</th>
                            <th style="width: 80px;">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${goods.map(item => `
                            <tr>
                                <td>
                                    <span style="font-weight: 500; color: var(--text-primary);">
                                        ${this.escapeHtml(item.name)}
                                    </span>
                                </td>
                                <td>
                                    <span style="color: var(--error-color); font-weight: 700; font-size: 15px;">
                                        ¥${parseFloat(item.price || 0).toFixed(2)}
                                    </span>
                                </td>
                                <td>
                                    <span style="background: var(--bg-light); padding: 3px 10px; border-radius: 4px; font-size: 12px;">
                                        ${this.escapeHtml(item.category || '-')}
                                    </span>
                                </td>
                                <td>${this.escapeHtml(item.campus || '-')}</td>
                                <td>
                                    <span style="color: var(--primary-color); font-weight: 500;">
                                        ${this.escapeHtml(item.publisher || '-')}
                                    </span>
                                </td>
                                <td>
                                    <span style="font-size: 13px; color: var(--text-secondary);">
                                        ${this.formatDate(item.publishTime)}
                                    </span>
                                </td>
                                <td>
                                    <button 
                                        class="btn btn-sm delete-goods-btn" 
                                        data-id="${this.escapeHtml(item.id)}"
                                        style="background: #FFF0F0; color: #DC3545; border: 1px solid #FFCCCC; padding: 4px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; transition: all 0.2s;"
                                        onmouseover="this.style.background='#FFE0E0'"
                                        onmouseout="this.style.background='#FFF0F0'"
                                    >
                                        🗑️ 删除
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div style="margin-top: 16px; padding: 12px 16px; background: var(--bg-light); border-radius: 8px; font-size: 13px; color: var(--text-secondary);">
                <span>📌</span> 共 ${goods.length} 件商品 | 删除商品将同步移除相关收藏记录
            </div>
        `;
    },

    // ---------- 工具函数 ----------
    /**
     * HTML转义，防止XSS
     * @param {string} text - 原始文本
     * @returns {string} 转义后的文本
     */
    escapeHtml(text) {
        if (text === null || text === undefined) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    },

    /**
     * 格式化日期
     * @param {string|Date} dateStr - 日期字符串
     * @returns {string} 格式化后的日期
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

    // ---------- UI组件 ----------
    /**
     * 显示Toast提示
     * @param {string} message - 提示消息
     * @param {string} type - 类型: success|error|info
     */
    showToast(message, type = 'info') {
        // 创建或获取容器
        let container = document.getElementById('adminToastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'adminToastContainer';
            container.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                z-index: 99999;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }

        // 创建Toast
        const toast = document.createElement('div');
        const colors = {
            success: { bg: '#198754', icon: '✓' },
            error: { bg: '#DC3545', icon: '✕' },
            info: { bg: '#0D6EFD', icon: 'ℹ' }
        };
        const colorConfig = colors[type] || colors.info;

        toast.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 14px 20px;
            margin-bottom: 10px;
            border-radius: 10px;
            background: ${colorConfig.bg};
            color: white;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 6px 20px rgba(0,0,0,0.2);
            animation: adminToastSlideIn 0.3s ease;
            pointer-events: auto;
            max-width: 350px;
        `;
        toast.innerHTML = `<span style="font-size: 16px;">${colorConfig.icon}</span><span>${this.escapeHtml(message)}</span>`;
        container.appendChild(toast);

        // 自动移除
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    },

    /**
     * 显示确认弹窗
     * @param {string} title - 标题
     * @param {string} message - 消息
     * @param {Function} onConfirm - 确认回调
     */
    showConfirm(title, message, onConfirm) {
        // 防止重复弹窗
        const existingOverlay = document.querySelector('.admin-confirm-overlay');
        if (existingOverlay) existingOverlay.remove();

        const overlay = document.createElement('div');
        overlay.className = 'admin-confirm-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 100000;
            animation: adminOverlayFadeIn 0.2s ease;
        `;

        overlay.innerHTML = `
            <div style="
                background: white;
                padding: 28px;
                border-radius: 16px;
                max-width: 420px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                animation: adminModalSlideUp 0.3s ease;
            ">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                    <span style="font-size: 28px;">⚠️</span>
                    <h3 style="margin: 0; font-size: 20px; color: #333; font-weight: 600;">${this.escapeHtml(title)}</h3>
                </div>
                <p style="margin: 0 0 28px 0; color: #666; font-size: 14px; line-height: 1.6;">${this.escapeHtml(message)}</p>
                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button class="admin-confirm-cancel" style="
                        padding: 10px 24px;
                        border: 1px solid #E5E7EB;
                        background: white;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        color: #666;
                        transition: all 0.2s;
                    ">取消</button>
                    <button class="admin-confirm-ok" style="
                        padding: 10px 24px;
                        border: none;
                        background: #006633;
                        color: white;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 500;
                        transition: all 0.2s;
                    ">确定</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // 取消按钮
        overlay.querySelector('.admin-confirm-cancel').addEventListener('click', () => overlay.remove());

        // 确定按钮
        overlay.querySelector('.admin-confirm-ok').addEventListener('click', () => {
            overlay.remove();
            if (typeof onConfirm === 'function') {
                onConfirm();
            }
        });

        // 点击遮罩关闭
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });

        // ESC键关闭
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    },

    /**
     * 显示图片预览
     * @param {string} src - 图片地址
     */
    showImagePreview(src) {
        // 防止重复预览
        const existingPreview = document.querySelector('.admin-image-preview');
        if (existingPreview) existingPreview.remove();

        const overlay = document.createElement('div');
        overlay.className = 'admin-image-preview';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.92);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 100001;
            cursor: zoom-out;
            animation: adminOverlayFadeIn 0.2s ease;
        `;

        const img = document.createElement('img');
        img.src = src;
        img.style.cssText = `
            max-width: 90%;
            max-height: 90%;
            object-fit: contain;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            animation: adminImageZoomIn 0.3s ease;
        `;

        const closeBtn = document.createElement('span');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = `
            position: absolute;
            top: 20px;
            right: 30px;
            color: white;
            font-size: 32px;
            cursor: pointer;
            opacity: 0.8;
            transition: opacity 0.2s;
        `;
        closeBtn.addEventListener('mouseover', () => closeBtn.style.opacity = '1');
        closeBtn.addEventListener('mouseout', () => closeBtn.style.opacity = '0.8');

        overlay.appendChild(img);
        overlay.appendChild(closeBtn);
        document.body.appendChild(overlay);

        const closePreview = () => overlay.remove();
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay || e.target === closeBtn) {
                closePreview();
            }
        });

        // ESC键关闭
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closePreview();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    },

    // ---------- 事件绑定 ----------
    /**
     * 绑定事件 - 使用 addEventListener 事件委托
     */
    bindEvents() {
        const container = document.getElementById('adminContent');
        if (!container) return;

        // 移除旧的事件监听器（防止重复绑定）
        if (this._boundHandler) {
            container.removeEventListener('click', this._boundHandler);
        }

        // 创建事件处理器
        this._boundHandler = (e) => {
            const target = e.target;

            // ========== 登录表单提交 ==========
            if (target.id === 'adminLoginBtn' || target.closest('#adminLoginBtn')) {
                e.preventDefault();
                this.handleLogin();
                return;
            }

            // ========== 退出登录 ==========
            if (target.id === 'adminLogoutBtn' || target.closest('#adminLogoutBtn')) {
                this.showConfirm(
                    '退出登录',
                    '确定要退出管理员登录吗？退出后将返回登录页面。',
                    () => {
                        try {
                            localStorage.setItem(ADMIN_KEYS.ADMIN_LOGIN, 'false');
                        } catch (err) {
                            console.warn('[Admin] 保存登录状态失败:', err);
                        }
                        this.state.isLoggedIn = false;
                        this.state.activeTab = 'verify';
                        this.render();
                        this.bindEvents();
                    }
                );
                return;
            }

            // ========== 手动刷新数据 ==========
            if (target.id === 'refreshDataBtn' || target.closest('#refreshDataBtn')) {
                console.log('[Admin] 手动刷新数据');
                this._refreshAllData();
                this.showToast('数据已刷新', 'success');
                return;
            }

            // ========== 标签页切换 ==========
            const tabItem = target.closest('.tabs-nav-item');
            if (tabItem) {
                const tabName = tabItem.getAttribute('data-tab');
                if (tabName && tabName !== this.state.activeTab) {
                    this.switchTab(tabName);
                }
                return;
            }

            // ========== 通过认证 ==========
            const approveBtn = target.closest('.approve-btn');
            if (approveBtn) {
                const authId = approveBtn.getAttribute('data-id');
                const studentId = approveBtn.getAttribute('data-studentid');
                this.showConfirm(
                    '通过认证',
                    `确定要通过学号「${studentId}」的认证申请吗？通过后该用户可以发布商品。`,
                    () => this.approveVerify(authId)
                );
                return;
            }

            // ========== 拒绝认证 ==========
            const rejectBtn = target.closest('.reject-btn');
            if (rejectBtn) {
                const authId = rejectBtn.getAttribute('data-id');
                const studentId = rejectBtn.getAttribute('data-studentid');
                this.showConfirm(
                    '拒绝认证',
                    `确定要拒绝学号「${studentId}」的认证申请吗？拒绝后该用户需要重新提交认证。`,
                    () => this.rejectVerify(authId)
                );
                return;
            }

            // ========== 删除商品 ==========
            const deleteBtn = target.closest('.delete-goods-btn');
            if (deleteBtn) {
                const goodsId = deleteBtn.getAttribute('data-id');
                this.showConfirm(
                    '删除商品',
                    '确定要删除该商品吗？此操作不可恢复，相关的收藏记录也会被同步删除。',
                    () => this.deleteGoods(goodsId)
                );
                return;
            }

            // ========== 图片预览 ==========
            const imageBtn = target.closest('.verify-image');
            if (imageBtn && imageBtn.src) {
                this.showImagePreview(imageBtn.src);
            }
        };

        // 添加事件监听器
        container.addEventListener('click', this._boundHandler);

        // ========== 表单回车提交 ==========
        const usernameInput = document.getElementById('adminUsername');
        const passwordInput = document.getElementById('adminPassword');
        if (usernameInput) {
            usernameInput.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (passwordInput) passwordInput.focus();
                }
            };
        }
        if (passwordInput) {
            passwordInput.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleLogin();
                }
            };
        }
    },

    // ---------- 业务逻辑 ----------
    /**
     * 标签页切换
     * @param {string} tabName - 标签名称
     */
    switchTab(tabName) {
        this.state.activeTab = tabName;

        // 更新标签样式
        const tabItems = document.querySelectorAll('.tabs-nav-item');
        tabItems.forEach(tab => {
            const itemTab = tab.getAttribute('data-tab');
            if (itemTab === tabName) {
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

        // 【关键修改】切换到认证审核标签时，自动刷新数据和列表
        if (tabName === 'verify') {
            this.refreshVerifyData();
        }
    },

    /**
     * 【新增】刷新认证审核数据
     * 用于切换标签时和跨页面数据同步
     */
    refreshVerifyData() {
        // 1. 更新顶部统计数字
        const pendingCount = this.getPendingCount();
        const pendingCountEl = document.getElementById('pendingCountNum');
        if (pendingCountEl) {
            pendingCountEl.textContent = pendingCount;
        }

        // 2. 更新标签页上的待审核数量徽章
        const tabBadge = document.querySelector('.tabs-nav-item[data-tab="verify"] .tabs-badge');
        if (pendingCount > 0) {
            if (tabBadge) {
                tabBadge.textContent = pendingCount;
            } else {
                const verifyTab = document.querySelector('.tabs-nav-item[data-tab="verify"]');
                if (verifyTab) {
                    const badge = document.createElement('span');
                    badge.className = 'tabs-badge';
                    badge.textContent = pendingCount;
                    verifyTab.appendChild(badge);
                }
            }
        } else if (tabBadge) {
            tabBadge.remove();
        }

        // 3. 重新渲染认证审核列表
        const verifyPanel = document.getElementById('verifyPanel');
        if (verifyPanel) {
            verifyPanel.innerHTML = this.renderVerifyList();
            // 重新绑定认证审核相关事件
            this.bindVerifyPanelEvents();
        }
    },

    /**
     * 【新增】绑定认证审核面板内的事件
     * 用于刷新列表后重新绑定按钮事件
     */
    /**
     * 【新增】绑定认证审核面板内的事件
     * 用于刷新列表后重新绑定按钮事件
     */
    bindVerifyPanelEvents() {
        const container = document.getElementById('adminContent');
        if (!container) return;

        // 绑定通过按钮
        container.querySelectorAll('.approve-btn').forEach(btn => {
            btn.onclick = null;
            btn.addEventListener('click', () => {
                const authId = btn.getAttribute('data-id');
                const studentId = btn.getAttribute('data-studentid');
                this.showConfirm(
                    '通过认证',
                    `确定要通过学号「${studentId}」的认证申请吗？`,
                    () => this.approveVerify(authId)
                );
            });
        });

        // 绑定拒绝按钮
        container.querySelectorAll('.reject-btn').forEach(btn => {
            btn.onclick = null;
            btn.addEventListener('click', () => {
                const authId = btn.getAttribute('data-id');
                const studentId = btn.getAttribute('data-studentid');
                this.showConfirm(
                    '拒绝认证',
                    `确定要拒绝学号「${studentId}」的认证申请吗？`,
                    () => this.rejectVerify(authId)
                );
            });
        });

        // 绑定图片预览
        container.querySelectorAll('.verify-image').forEach(img => {
            img.onclick = null;
            img.addEventListener('click', () => {
                if (img.src) {
                    this.showImagePreview(img.src);
                }
            });
        });
    },

    /**
     * 【修复】通过认证 - 只更新对应用户的认证状态
     * @param {string} authId - 认证申请ID
     */
    approveVerify(authId) {
        try {
            // 从 pendingAuthList 中更新状态
            const pendingAuthsStr = localStorage.getItem(ADMIN_KEYS.PENDING_AUTHS);
            if (pendingAuthsStr) {
                let pendingAuths = JSON.parse(pendingAuthsStr);
                const index = pendingAuths.findIndex(a => a.id === authId);
                if (index !== -1) {
                    const auth = pendingAuths[index];
                    auth.status = 'approved';
                    auth.updateTime = new Date().toISOString();
                    localStorage.setItem(ADMIN_KEYS.PENDING_AUTHS, JSON.stringify(pendingAuths));
                    
                    // 【修复】只更新对应用户（通过学号匹配）的认证状态
                    const usersStr = localStorage.getItem(ADMIN_KEYS.USERS);
                    if (usersStr) {
                        let users = JSON.parse(usersStr);
                        // 根据学号找到该用户并更新状态
                        const userIndex = users.findIndex(u => 
                            u.studentId === auth.studentId || 
                            (auth.username && u.username === auth.username)
                        );
                        if (userIndex !== -1) {
                            users[userIndex].authStatus = 'approved';
                            localStorage.setItem(ADMIN_KEYS.USERS, JSON.stringify(users));
                            console.log('[Admin] 用户认证状态已更新:', users[userIndex].username, '-> approved');
                            
                            // 【新增】发送通知给用户
                            if (typeof NotificationSystem !== 'undefined') {
                                NotificationSystem.notifyAuthApprove(users[userIndex].username, auth.studentId);
                            }
                        } else {
                            console.warn('[Admin] 未找到学号对应的用户:', auth.studentId);
                        }
                    }
                    
                    // 更新认证信息（保持向后兼容）
                    localStorage.setItem(ADMIN_KEYS.VERIFY_INFO, JSON.stringify({
                        studentId: auth.studentId,
                        campus: auth.campus,
                        subCampus: auth.subCampus,
                        college: auth.college,
                        studentCardImage: auth.studentCardImage,
                        submitTime: auth.submitTime,
                        approvedTime: auth.updateTime
                    }));
                    
                    console.log('[Admin] 认证已通过:', auth.studentId);
                    this.showToast(`学号 ${auth.studentId} 的认证已通过`, 'success');
                } else {
                    console.error('[Admin] 未找到认证申请:', authId);
                    this.showToast('未找到认证申请', 'error');
                }
            } else {
                this.showToast('未找到待审核列表', 'error');
            }
            
            this.render();
            this.bindEvents();
        } catch (e) {
            console.error('[Admin] 通过认证失败:', e);
            this.showToast('操作失败，请重试', 'error');
        }
    },

    /**
     * 【修复】拒绝认证 - 只更新对应用户的认证状态
     * @param {string} authId - 认证申请ID
     */
    rejectVerify(authId) {
        try {
            // 从 pendingAuthList 中更新状态
            const pendingAuthsStr = localStorage.getItem(ADMIN_KEYS.PENDING_AUTHS);
            if (pendingAuthsStr) {
                let pendingAuths = JSON.parse(pendingAuthsStr);
                const index = pendingAuths.findIndex(a => a.id === authId);
                if (index !== -1) {
                    const auth = pendingAuths[index];
                    auth.status = 'rejected';
                    auth.updateTime = new Date().toISOString();
                    localStorage.setItem(ADMIN_KEYS.PENDING_AUTHS, JSON.stringify(pendingAuths));
                    
                    // 【修复】只更新对应用户（通过学号匹配）的认证状态
                    const usersStr = localStorage.getItem(ADMIN_KEYS.USERS);
                    if (usersStr) {
                        let users = JSON.parse(usersStr);
                        const userIndex = users.findIndex(u => 
                            u.studentId === auth.studentId || 
                            (auth.username && u.username === auth.username)
                        );
                        if (userIndex !== -1) {
                            users[userIndex].authStatus = 'rejected';
                            localStorage.setItem(ADMIN_KEYS.USERS, JSON.stringify(users));
                            console.log('[Admin] 用户认证状态已更新:', users[userIndex].username, '-> rejected');
                            
                            // 【新增】发送通知给用户
                            if (typeof NotificationSystem !== 'undefined') {
                                NotificationSystem.notifyAuthReject(users[userIndex].username, auth.studentId, '认证信息不符合要求');
                            }
                        }
                    }
                    
                    console.log('[Admin] 认证已拒绝:', auth.studentId);
                    this.showToast(`学号 ${auth.studentId} 的认证已拒绝`, 'success');
                } else {
                    console.error('[Admin] 未找到认证申请:', authId);
                    this.showToast('未找到认证申请', 'error');
                }
            } else {
                this.showToast('未找到待审核列表', 'error');
            }
            
            this.render();
            this.bindEvents();
        } catch (e) {
            console.error('[Admin] 拒绝认证失败:', e);
            this.showToast('操作失败，请重试', 'error');
        }
    },

    /**
     * 删除商品
     * @param {string} goodsId - 商品ID
     */
    deleteGoods(goodsId) {
        try {
            // 删除商品
            const goodsStr = localStorage.getItem(ADMIN_KEYS.GOODS);
            if (goodsStr) {
                let goods = JSON.parse(goodsStr);
                if (!Array.isArray(goods)) goods = [];
                goods = goods.filter(g => g.id !== goodsId);
                localStorage.setItem(ADMIN_KEYS.GOODS, JSON.stringify(goods));
            }

            // 同步删除相关收藏
            const collectsStr = localStorage.getItem(ADMIN_KEYS.COLLECTS);
            if (collectsStr) {
                let collects = JSON.parse(collectsStr);
                if (!Array.isArray(collects)) collects = [];
                collects = collects.filter(c => c.goodsId !== goodsId);
                localStorage.setItem(ADMIN_KEYS.COLLECTS, JSON.stringify(collects));
            }

            this.showToast('商品已删除', 'success');
            this.render();
            this.bindEvents();
        } catch (e) {
            console.error('[Admin] 删除商品失败:', e);
            this.showToast('操作失败，请重试', 'error');
        }
    },

    /**
     * 处理登录
     */
    handleLogin() {
        const usernameEl = document.getElementById('adminUsername');
        const passwordEl = document.getElementById('adminPassword');
        const usernameErrorEl = document.getElementById('adminUsernameError');
        const passwordErrorEl = document.getElementById('adminPasswordError');

        if (!usernameEl || !passwordEl) return;

        const username = usernameEl.value.trim();
        const password = passwordEl.value;

        // 清除错误提示
        if (usernameErrorEl) {
            usernameErrorEl.textContent = '';
            usernameErrorEl.classList.remove('show');
        }
        if (passwordErrorEl) {
            passwordErrorEl.textContent = '';
            passwordErrorEl.classList.remove('show');
        }

        // 校验用户名
        if (!username) {
            if (usernameErrorEl) {
                usernameErrorEl.textContent = '请输入用户名';
                usernameErrorEl.classList.add('show');
            }
            usernameEl.focus();
            return;
        }

        // 校验密码
        if (!password) {
            if (passwordErrorEl) {
                passwordErrorEl.textContent = '请输入密码';
                passwordErrorEl.classList.add('show');
            }
            passwordEl.focus();
            return;
        }

        // 验证账号密码
        if (username === ADMIN_ACCOUNT.username && password === ADMIN_ACCOUNT.password) {
            try {
                localStorage.setItem(ADMIN_KEYS.ADMIN_LOGIN, 'true');
            } catch (e) {
                console.warn('[Admin] 保存登录状态失败:', e);
            }
            this.state.isLoggedIn = true;
            this.showToast('登录成功，欢迎回来！', 'success');
            this.render();
            this.bindEvents();
        } else {
            if (passwordErrorEl) {
                passwordErrorEl.textContent = '用户名或密码错误，请重试';
                passwordErrorEl.classList.add('show');
            }
            passwordEl.value = '';
            passwordEl.focus();
        }
    }
};

// ========== 页面加载完成后初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('adminContent');
    if (container) {
        AdminModule.init();
    }
});

// ========== 添加动画样式 ==========
const adminStyle = document.createElement('style');
adminStyle.textContent = `
    /* 登录页面样式 */
    .admin-login-wrapper {
        min-height: calc(100vh - 200px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
    }
    .admin-login-card {
        width: 100%;
        max-width: 420px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    }

    /* 统计卡片样式 */
    .admin-stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        margin-bottom: 24px;
    }
    @media (max-width: 768px) {
        .admin-stats-grid {
            grid-template-columns: 1fr;
        }
    }
    .admin-stat-card {
        display: flex;
        align-items: center;
        gap: 20px;
        padding: 24px;
    }
    .admin-stat-icon {
        width: 60px;
        height: 60px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        flex-shrink: 0;
    }
    .admin-stat-content {
        flex: 1;
    }
    .admin-stat-number {
        font-size: 32px;
        font-weight: 700;
        color: var(--text-primary);
        line-height: 1.2;
    }
    .admin-stat-label {
        font-size: 14px;
        color: var(--text-secondary);
        margin-top: 4px;
    }

    /* 标签页样式增强 */
    .tabs-nav-item {
        position: relative;
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .tabs-badge {
        background: #DC3545;
        color: white;
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 10px;
        font-weight: 600;
        margin-left: 4px;
    }

    /* 表格样式增强 */
    .list-table th {
        background: var(--primary-color) !important;
        color: white;
        font-weight: 600;
        white-space: nowrap;
    }
    .list-table tbody tr:hover {
        background: var(--bg-light);
    }

    /* Toast动画 */
    @keyframes adminToastSlideIn {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    /* 弹窗动画 */
    @keyframes adminOverlayFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    @keyframes adminModalSlideUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    @keyframes adminImageZoomIn {
        from {
            opacity: 0;
            transform: scale(0.8);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }

    /* 响应式适配 */
    @media (max-width: 768px) {
        .admin-panel-card .card-header {
            flex-direction: column;
            align-items: flex-start;
        }
        .admin-stat-card {
            padding: 16px;
        }
        .admin-stat-number {
            font-size: 24px;
        }
    }
`;
document.head.appendChild(adminStyle);
