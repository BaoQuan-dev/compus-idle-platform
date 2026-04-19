/**
 * ============================================
 * 河南农业大学·农大闲置 - 个人中心逻辑
 * 功能：信息展示/我的发布/收藏/认证管理
 * ============================================
 */

// 碳足迹计算数据
const CARBON_DATA = {
    '电子产品': { factor: 30, tree: 0.15, unit: 'kg CO₂/件' },
    '服装鞋包': { factor: 15, tree: 0.08, unit: 'kg CO₂/件' },
    '书籍文具': { factor: 5, tree: 0.03, unit: 'kg CO₂/本' },
    '家具家居': { factor: 50, tree: 0.25, unit: 'kg CO₂/件' },
    '生活用品': { factor: 8, tree: 0.04, unit: 'kg CO₂/件' },
    '体育用品': { factor: 12, tree: 0.06, unit: 'kg CO₂/件' },
    '其他': { factor: 10, tree: 0.05, unit: 'kg CO₂/件' }
};

const CenterModule = {
    // 状态
    state: {
        isLoggedIn: false,
        user: null,
        verifyInfo: null,
        verifyState: 'unsubmitted',
        myGoods: [],
        myCollects: [],
        activeTab: 'info',
        calculatorSelected: null,
        calculatorAmount: 1
    },

    /**
     * 初始化
     */
    init() {
        // 检查登录状态
        if (!Auth.requireUserCenter()) {
            return;
        }

        this.loadData();
        this.render();
        this.bindEvents();
    },

    /**
     * 加载数据
     */
    loadData() {
        const loginState = Auth.getLoginState();
        this.state.isLoggedIn = loginState.isLogin;
        this.state.user = loginState.curUser;
        this.state.verifyInfo = Auth.getVerifyInfo();
        
        // 【关键修改】优先读取用户数据中的 authStatus，其次读取全局认证状态
        this.state.verifyState = Auth.getUserAuthStatus(this.state.user) || Auth.getVerifyState();

        // 我的发布
        const allGoods = Auth.getGoods();
        this.state.myGoods = allGoods
            .filter(g => g.publisher === this.state.user && g.status === 'active')
            .sort((a, b) => new Date(b.publishTime) - new Date(a.publishTime));

        // 我的收藏
        const allCollects = Auth.getCollects();
        const myCollectIds = allCollects
            .filter(c => c.user === this.state.user)
            .map(c => c.goodsId);

        this.state.myCollects = allGoods.filter(g => myCollectIds.includes(g.id));
    },

    /**
     * 渲染页面
     */
    render() {
        const container = document.getElementById('centerContent');
        if (!container) return;

        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">📋 个人中心</h2>
                </div>

                <!-- 选项卡 -->
                <div class="tabs-nav" style="margin-bottom: 20px;">
                    <div class="tabs-nav-item ${this.state.activeTab === 'info' ? 'active' : ''}" data-tab="info">基本信息</div>
                    <div class="tabs-nav-item ${this.state.activeTab === 'verify' ? 'active' : ''}" data-tab="verify">认证管理</div>
                    <div class="tabs-nav-item ${this.state.activeTab === 'publish' ? 'active' : ''}" data-tab="publish">我的发布</div>
                    <div class="tabs-nav-item ${this.state.activeTab === 'collect' ? 'active' : ''}" data-tab="collect">我的收藏</div>
                    <div class="tabs-nav-item ${this.state.activeTab === 'carbon' ? 'active' : ''}" data-tab="carbon">碳足迹计算</div>
                </div>

                <!-- 基本信息 -->
                <div class="tabs-panel ${this.state.activeTab === 'info' ? 'active' : ''}" id="infoPanel">
                    ${this.renderInfo()}
                </div>

                <!-- 认证管理 -->
                <div class="tabs-panel ${this.state.activeTab === 'verify' ? 'active' : ''}" id="verifyPanel">
                    ${this.renderVerify()}
                </div>

                <!-- 我的发布 -->
                <div class="tabs-panel ${this.state.activeTab === 'publish' ? 'active' : ''}" id="publishPanel">
                    ${this.renderPublish()}
                </div>

                <!-- 我的收藏 -->
                <div class="tabs-panel ${this.state.activeTab === 'collect' ? 'active' : ''}" id="collectPanel">
                    ${this.renderCollect()}
                </div>

                <!-- 碳足迹计算 -->
                <div class="tabs-panel ${this.state.activeTab === 'carbon' ? 'active' : ''}" id="carbonPanel">
                    ${this.renderCarbon()}
                </div>
            </div>
        `;
    },

    /**
     * 渲染基本信息
     */
    renderInfo() {
        // 【关键修改】添加 rejected 状态
        const statusMap = {
            'unsubmitted': { text: '未提交', class: 'pending' },
            'pending': { text: '待审核', class: 'pending' },
            'approved': { text: '已认证', class: 'approved' },
            'rejected': { text: '已拒绝', class: 'rejected' }
        };

        const status = statusMap[this.state.verifyState] || statusMap['unsubmitted'];

        return `
            <div class="d-flex flex-column gap-md">
                <div class="d-flex align-center gap-md">
                    <span style="color: var(--text-secondary);">用户名：</span>
                    <span style="font-weight: 600;">${Utils.escapeHtml(this.state.user)}</span>
                </div>
                <div class="d-flex align-center gap-md">
                    <span style="color: var(--text-secondary);">认证状态：</span>
                    <span class="status-badge ${status.class}">${status.text}</span>
                </div>
                ${this.state.verifyInfo ? `
                    <div class="d-flex align-center gap-md">
                        <span style="color: var(--text-secondary);">学号：</span>
                        <span>${Utils.escapeHtml(this.state.verifyInfo.studentId)}</span>
                    </div>
                    <div class="d-flex align-center gap-md">
                        <span style="color: var(--text-secondary);">校区：</span>
                        <span>${Utils.escapeHtml(this.state.verifyInfo.campus)}${this.state.verifyInfo.subCampus ? ' - ' + Utils.escapeHtml(this.state.verifyInfo.subCampus) : ''}</span>
                    </div>
                    <div class="d-flex align-center gap-md">
                        <span style="color: var(--text-secondary);">学院：</span>
                        <span>${Utils.escapeHtml(this.state.verifyInfo.college)}</span>
                    </div>
                ` : ''}
            </div>
        `;
    },

    /**
     * 渲染认证管理
     */
    renderVerify() {
        // 【关键修改】添加 rejected 状态
        const statusMap = {
            'unsubmitted': { text: '未提交认证', class: 'pending', icon: '📝' },
            'pending': { text: '认证待审核', class: 'pending', icon: '⏳' },
            'approved': { text: '认证已通过', class: 'approved', icon: '✅' },
            'rejected': { text: '认证已拒绝', class: 'rejected', icon: '❌' }
        };

        const status = statusMap[this.state.verifyState] || statusMap['unsubmitted'];

        return `
            <div class="d-flex flex-column gap-lg">
                <div class="d-flex align-center gap-md">
                    <span class="status-badge ${status.class}" style="font-size: 14px; padding: 8px 16px;">
                        ${status.icon} ${status.text}
                    </span>
                </div>

                ${this.state.verifyInfo ? `
                    <div class="d-flex flex-column gap-sm">
                        <p><strong>学号：</strong>${Utils.escapeHtml(this.state.verifyInfo.studentId)}</p>
                        <p><strong>校区：</strong>${Utils.escapeHtml(this.state.verifyInfo.campus)}${this.state.verifyInfo.subCampus ? ' - ' + Utils.escapeHtml(this.state.verifyInfo.subCampus) : ''}</p>
                        <p><strong>学院：</strong>${Utils.escapeHtml(this.state.verifyInfo.college)}</p>
                        <p><strong>提交时间：</strong>${Utils.formatDate(this.state.verifyInfo.submitTime)}</p>
                    </div>
                ` : ''}

                <div class="d-flex gap-md flex-wrap">
                    <button class="btn btn-primary" id="editVerifyBtn">✏️ 修改认证信息</button>
                    <button class="btn btn-outline" id="resetVerifyBtn" style="color: var(--error-color); border-color: var(--error-color);">🔄 重置认证状态</button>
                </div>
            </div>
        `;
    },

    /**
     * 渲染我的发布
     */
    renderPublish() {
        if (this.state.myGoods.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">📦</div>
                    <p class="empty-state-text">暂无发布商品</p>
                    <a href="release_goods.html" class="btn btn-primary mt-md">发布闲置</a>
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
                            <th>发布时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.state.myGoods.map(goods => `
                            <tr>
                                <td>${Utils.escapeHtml(goods.name)}</td>
                                <td style="color: var(--error-color); font-weight: 600;">¥${goods.price.toFixed(2)}</td>
                                <td>${goods.category}</td>
                                <td>${goods.campus}</td>
                                <td>${Utils.formatDate(goods.publishTime)}</td>
                                <td>
                                    <div class="list-table-actions">
                                        <button class="btn btn-sm btn-danger delete-goods-btn" data-id="${goods.id}">删除</button>
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
     * 渲染我的收藏
     */
    renderCollect() {
        if (this.state.myCollects.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">❤️</div>
                    <p class="empty-state-text">暂无收藏商品</p>
                    <a href="home.html" class="btn btn-primary mt-md">去逛逛</a>
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
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.state.myCollects.map(goods => `
                            <tr>
                                <td>${Utils.escapeHtml(goods.name)}</td>
                                <td style="color: var(--error-color); font-weight: 600;">¥${goods.price.toFixed(2)}</td>
                                <td>${goods.category}</td>
                                <td>${goods.campus}</td>
                                <td>${Utils.escapeHtml(goods.publisher)}</td>
                                <td>
                                    <div class="list-table-actions">
                                        <button class="btn btn-sm btn-outline cancel-collect-btn" data-id="${goods.id}">取消收藏</button>
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
     * 渲染碳足迹计算器
     */
    renderCarbon() {
        return `
            <div class="calculator-section">
                <h3 class="calculator-title">🌱 选择闲置物品类型</h3>
                <div class="calculator-grid">
                    ${Object.entries(CARBON_DATA).map(([name, data]) => `
                        <div class="calculator-item ${this.state.calculatorSelected === name ? 'selected' : ''}" data-type="${name}">
                            <div class="calculator-item-icon">
                                ${this.getCarbonIcon(name)}
                            </div>
                            <div class="calculator-item-name">${name}</div>
                        </div>
                    `).join('')}
                </div>

                <div class="calculator-result" id="carbonResult">
                    <div class="calculator-result-value" id="carbonValue">0</div>
                    <div class="calculator-result-unit">kg CO₂</div>
                    <div class="calculator-result-detail" id="carbonDetail">
                        选择物品类型开始计算
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * 获取碳足迹图标
     */
    getCarbonIcon(type) {
        const icons = {
            '电子产品': '📱',
            '服装鞋包': '👕',
            '书籍文具': '📚',
            '家具家居': '🪑',
            '生活用品': '🧴',
            '体育用品': '⚽',
            '其他': '📦'
        };
        return icons[type] || '📦';
    },

    /**
     * 绑定事件
     */
    bindEvents() {
        // 选项卡切换
        const tabItems = document.querySelectorAll('.tabs-nav-item');
        tabItems.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // 认证管理按钮
        this.bindVerifyEvents();

        // 我的发布按钮
        this.bindPublishEvents();

        // 我的收藏按钮
        this.bindCollectEvents();

        // 碳足迹计算
        this.bindCarbonEvents();
    },

    /**
     * 切换选项卡
     */
    switchTab(tabName) {
        this.state.activeTab = tabName;

        // 更新选项卡状态
        const tabItems = document.querySelectorAll('.tabs-nav-item');
        tabItems.forEach(tab => {
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // 更新面板状态
        const panels = document.querySelectorAll('.tabs-panel');
        panels.forEach(panel => {
            if (panel.id === `${tabName}Panel`) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });

        // 重新绑定事件
        this.bindVerifyEvents();
        this.bindPublishEvents();
        this.bindCollectEvents();
        this.bindCarbonEvents();
    },

    /**
     * 绑定认证管理事件
     */
    bindVerifyEvents() {
        // 修改认证信息
        const editBtn = document.getElementById('editVerifyBtn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                Utils.跳转('stu_check.html');
            });
        }

        // 重置认证状态
        const resetBtn = document.getElementById('resetVerifyBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                Modal.confirm('重置认证状态', '确定要重置认证状态吗？重置后需重新提交认证信息', () => {
                    Auth.resetVerify();
                    Toast.show('认证状态已重置', 'success');
                    setTimeout(() => {
                        Utils.跳转('stu_check.html');
                    }, 1500);
                });
            });
        }
    },

    /**
     * 绑定我的发布事件
     */
    bindPublishEvents() {
        const deleteBtns = document.querySelectorAll('.delete-goods-btn');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const goodsId = btn.dataset.id;
                Modal.confirm('删除商品', '确定要删除该商品吗？', () => {
                    const goods = Auth.getGoods();
                    const index = goods.findIndex(g => g.id === goodsId);
                    if (index !== -1) {
                        goods.splice(index, 1);
                        Storage.set(Auth.KEYS.GOODS, goods);

                        // 同步删除收藏
                        const collects = Auth.getCollects();
                        const filteredCollects = collects.filter(c => c.goodsId !== goodsId);
                        Storage.set(Auth.KEYS.COLLECTS, filteredCollects);

                        Toast.show('商品已删除', 'success');
                        this.loadData();
                        this.render();
                    }
                });
            });
        });
    },

    /**
     * 绑定我的收藏事件
     */
    bindCollectEvents() {
        const cancelBtns = document.querySelectorAll('.cancel-collect-btn');
        cancelBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const goodsId = btn.dataset.id;
                const collects = Auth.getCollects();
                const index = collects.findIndex(c => 
                    c.user === this.state.user && c.goodsId === goodsId
                );

                if (index !== -1) {
                    collects.splice(index, 1);
                    Storage.set(Auth.KEYS.COLLECTS, collects);
                    Toast.show('已取消收藏', 'success');
                    this.loadData();
                    this.render();
                }
            });
        });
    },

    /**
     * 绑定碳足迹计算事件
     */
    bindCarbonEvents() {
        const items = document.querySelectorAll('.calculator-item');
        items.forEach(item => {
            item.addEventListener('click', () => {
                const type = item.dataset.type;
                this.state.calculatorSelected = type;

                // 更新选中状态
                items.forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');

                this.calculateCarbon();
            });
        });
    },

    /**
     * 计算碳足迹
     */
    calculateCarbon() {
        if (!this.state.calculatorSelected) return;

        const data = CARBON_DATA[this.state.calculatorSelected];
        const carbon = data.factor;
        const trees = data.tree;
        const money = (carbon * 0.1).toFixed(2);

        // 数字动画
        this.animateNumber('carbonValue', 0, carbon, 1000);

        // 更新详情
        const detail = document.getElementById('carbonDetail');
        if (detail) {
            detail.innerHTML = `
                相当于节约树木约 <strong style="color: var(--primary-color);">${trees.toFixed(2)}</strong> 棵<br>
                节省处理费用约 <strong style="color: var(--primary-color);">¥${money}</strong>
            `;
        }
    },

    /**
     * 数字动画
     */
    animateNumber(elementId, start, end, duration) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const startTime = performance.now();

        const update = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // 缓动函数
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = start + (end - start) * easeOut;

            element.textContent = current.toFixed(2);

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        };

        requestAnimationFrame(update);
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('centerContent')) {
        CenterModule.init();
    }
});
