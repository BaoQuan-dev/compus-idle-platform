/**
 * ============================================
 * 河南农业大学·农大闲置 - 公共核心函数
 * 包含：存储/跳转/提示/权限/校验等公共逻辑
 * 所有页面依赖此文件
 * ============================================
 */

// ========== LocalStorage 存储工具 ==========
const Storage = {
    /**
     * 安全获取数据
     * @param {string} key - 存储键名
     * @param {*} defaultValue - 默认值
     * @returns {*} 返回解析后的数据或默认值
     */
    get(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            if (data === null) {
                return defaultValue;
            }
            const parsed = JSON.parse(data);
            return parsed;
        } catch (e) {
            console.warn(`Storage.get [${key}] 解析失败:`, e);
            return defaultValue;
        }
    },

    /**
     * 安全存储数据
     * @param {string} key - 存储键名
     * @param {*} value - 要存储的值
     * @returns {boolean} 是否存储成功
     */
    set(key, value) {
        try {
            const data = JSON.stringify(value);
            localStorage.setItem(key, data);
            return true;
        } catch (e) {
            console.error(`Storage.set [${key}] 存储失败:`, e);
            Toast.show('存储失败，请清理浏览器缓存后重试', 'error');
            return false;
        }
    },

    /**
     * 移除指定数据
     * @param {string} key - 存储键名
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn(`Storage.remove [${key}] 移除失败:`, e);
        }
    },

    /**
     * 清除所有数据
     */
    clear() {
        try {
            localStorage.clear();
        } catch (e) {
            console.warn('Storage.clear 清除失败:', e);
        }
    }
};

// ========== Toast 提示组件 ==========
const Toast = {
    container: null,

    /**
     * 初始化提示容器
     */
    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            this.container.id = 'toastContainer';
            document.body.appendChild(this.container);
        }
    },

    /**
     * 显示提示
     * @param {string} message - 提示消息
     * @param {string} type - 类型：success/error/warning/info
     * @param {number} duration - 显示时长(ms)，0表示不自动消失
     */
    show(message, type = 'info', duration = 3000) {
        this.init();

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <div class="toast-content">
                <p class="toast-message">${message}</p>
            </div>
            <button class="toast-close" onclick="Toast.hide(this.parentElement)">×</button>
        `;

        this.container.appendChild(toast);

        // 自动隐藏
        if (duration > 0) {
            setTimeout(() => {
                this.hide(toast);
            }, duration);
        }

        // 动画效果
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 10);
    },

    /**
     * 隐藏提示
     * @param {HTMLElement} toast - toast元素
     */
    hide(toast) {
        if (toast && toast.parentElement) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.parentElement.removeChild(toast);
                }
            }, 300);
        }
    }
};

// ========== Modal 弹窗组件 ==========
const Modal = {
    /**
     * 显示确认弹窗
     * @param {string} title - 标题
     * @param {string} message - 消息
     * @param {Function} onConfirm - 确认回调
     * @param {Function} onCancel - 取消回调
     */
    confirm(title, message, onConfirm, onCancel) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close" onclick="Modal.close()">×</button>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="Modal.close()">取消</button>
                    <button class="btn btn-primary" id="modalConfirmBtn">确定</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // 显示动画
        setTimeout(() => {
            overlay.classList.add('show');
        }, 10);

        // 事件绑定
        const confirmBtn = overlay.querySelector('#modalConfirmBtn');
        confirmBtn.addEventListener('click', () => {
            this.close(overlay);
            if (onConfirm && typeof onConfirm === 'function') {
                onConfirm();
            }
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.close(overlay);
                if (onCancel && typeof onCancel === 'function') {
                    onCancel();
                }
            }
        });
    },

    /**
     * 关闭弹窗
     * @param {HTMLElement} overlay - 弹窗overlay元素
     */
    close(overlay) {
        if (!overlay) {
            overlay = document.querySelector('.modal-overlay.show');
        }
        if (overlay) {
            overlay.classList.remove('show');
            setTimeout(() => {
                if (overlay.parentElement) {
                    overlay.parentElement.removeChild(overlay);
                }
            }, 300);
        }
    }
};

// ========== 权限校验模块 ==========
const Auth = {
    // 存储键名常量
    KEYS: {
        VERIFY_INFO: 'hnau_verify_info',
        VERIFY_STATE: 'hnau_verify_state',
        USERS: 'hnau_users',
        LOGIN_STATE: 'hnau_login_state',
        GOODS: 'hnau_goods',
        COLLECTS: 'hnau_collects',
        PENDING_AUTHS: 'hnau_pending_auths'  // 【新增】待审核认证列表
    },

    // 认证状态常量
    VERIFY_STATE: {
        UNSUBMITTED: 'unsubmitted',
        PENDING: 'pending',
        APPROVED: 'approved'
    },

    /**
     * 获取认证状态
     * @returns {string} 认证状态
     */
    getVerifyState() {
        return Storage.get(this.KEYS.VERIFY_STATE, this.VERIFY_STATE.UNSUBMITTED);
    },

    /**
     * 获取认证信息
     * @returns {Object|null} 认证信息
     */
    getVerifyInfo() {
        return Storage.get(this.KEYS.VERIFY_INFO, null);
    },

    /**
     * 获取登录状态
     * @returns {Object} 登录状态对象
     */
    getLoginState() {
        return Storage.get(this.KEYS.LOGIN_STATE, { isLogin: false, curUser: '' });
    },

    /**
     * 获取所有用户
     * @returns {Array} 用户数组
     */
    getUsers() {
        return Storage.get(this.KEYS.USERS, []);
    },

    /**
     * 获取所有商品
     * @returns {Array} 商品数组
     */
    getGoods() {
        return Storage.get(this.KEYS.GOODS, []);
    },

    /**
     * 获取所有收藏
     * @returns {Array} 收藏数组
     */
    getCollects() {
        return Storage.get(this.KEYS.COLLECTS, []);
    },

    /**
     * 检查是否已登录
     * @returns {boolean}
     */
    isLoggedIn() {
        const loginState = this.getLoginState();
        return loginState.isLogin === true && loginState.curUser;
    },

    /**
     * 检查认证是否通过
     * @returns {boolean}
     */
    isVerified() {
        return this.getVerifyState() === this.VERIFY_STATE.APPROVED;
    },

    /**
     * 四级权限校验 - 发布商品专用
     * @returns {Object} { passed: boolean, level: number, message: string, redirect: string }
     */
    checkReleasePermission() {
        const verifyState = this.getVerifyState();
        const users = this.getUsers();
        const loginState = this.getLoginState();

        // 校验1：未认证或待审核
        if (verifyState !== this.VERIFY_STATE.APPROVED) {
            if (verifyState === this.VERIFY_STATE.UNSUBMITTED) {
                return {
                    passed: false,
                    level: 1,
                    message: '发布商品需先完成校园认证并通过审核',
                    type: 'error',
                    redirect: 'stu_check.html'
                };
            } else if (verifyState === this.VERIFY_STATE.PENDING) {
                return {
                    passed: false,
                    level: 1,
                    message: '您的认证正在审核中，请等待审核通过后再发布商品',
                    type: 'warning',
                    redirect: 'stu_check.html'
                };
            }
        }

        // 获取认证信息中的用户名（学号作为用户名）
        const verifyInfo = this.getVerifyInfo();
        const verifyUsername = verifyInfo ? verifyInfo.studentId : '';

        // 校验2：认证通过但未注册
        const userExists = users.some(u => u.username === verifyUsername);
        if (!userExists) {
            return {
                passed: false,
                level: 2,
                message: '校园认证已通过，请先完成账号注册',
                type: 'info',
                redirect: 'user_login.html',
                tab: 'register'
            };
        }

        // 校验3：已注册但未登录
        if (!loginState.isLogin || loginState.curUser !== verifyUsername) {
            return {
                passed: false,
                level: 3,
                message: '账号已注册，请先登录',
                type: 'info',
                redirect: 'user_login.html',
                tab: 'login',
                prefillUser: verifyUsername
            };
        }

        // 校验4：全部通过
        return {
            passed: true,
            level: 4,
            message: '',
            redirect: ''
        };
    },

    /**
     * 执行权限校验并跳转
     * @param {Function} successCallback - 校验通过后的回调
     */
    requireReleasePermission(successCallback) {
        const result = this.checkReleasePermission();

        if (!result.passed) {
            Toast.show(result.message, result.type, result.type === 'error' ? 0 : 1500);

            setTimeout(() => {
                if (result.tab) {
                    Utils.跳转(result.redirect, result.tab, result.prefillUser);
                } else {
                    Utils.跳转(result.redirect);
                }
            }, result.type === 'error' ? 1000 : 1500);

            return false;
        }

        if (successCallback && typeof successCallback === 'function') {
            successCallback();
        }
        return true;
    },

    /**
     * 检查用户中心权限
     * @returns {boolean}
     */
    requireUserCenter() {
        if (!this.isLoggedIn()) {
            Toast.show('请先登录', 'info', 1500);
            setTimeout(() => {
                Utils.跳转('user_login.html', 'login');
            }, 1500);
            return false;
        }
        return true;
    },

    /**
     * 登录
     * @param {string} username - 用户名
     */
    login(username) {
        const loginState = {
            isLogin: true,
            curUser: username
        };
        Storage.set(this.KEYS.LOGIN_STATE, loginState);
    },

    /**
     * 退出登录
     */
    logout() {
        Storage.remove(this.KEYS.LOGIN_STATE);
        // 刷新页面以更新导航栏状态
        location.reload();
    },

    /**
     * 提交认证
     * @param {Object} info - 认证信息
     */
    submitVerify(info) {
        // 同时更新 pendingAuthList
        Storage.set(this.KEYS.VERIFY_INFO, info);
        Storage.set(this.KEYS.VERIFY_STATE, this.VERIFY_STATE.PENDING);
        
        // 将认证申请添加到待审核列表
        const pendingList = this.getPendingAuths();
        // 添加唯一标识和时间戳
        const authRecord = {
            id: Date.now().toString(),  // 唯一ID
            studentId: info.studentId,
            campus: info.campus,
            subCampus: info.subCampus || '',
            college: info.college,
            studentCardImage: info.studentCardImage,
            submitTime: info.submitTime || new Date().toISOString(),
            status: 'pending'  // pending | approved | rejected
        };
        pendingList.push(authRecord);
        Storage.set(this.KEYS.PENDING_AUTHS, pendingList);
        
        // 【关键修改】同步更新当前登录用户的认证状态
        const loginState = this.getLoginState();
        if (loginState.isLogin && loginState.curUser) {
            this.updateUserAuthStatus(loginState.curUser, 'pending');
        }
        
        console.log('[Auth] 认证申请已提交，pendingAuths 数量:', pendingList.length);
    },
    
    /**
     * 【新增】获取待审核认证列表
     * @returns {Array}
     */
    getPendingAuths() {
        return Storage.get(this.KEYS.PENDING_AUTHS, []);
    },
    
    /**
     * 【新增】从待审核列表中移除申请
     * @param {string} studentId - 学号
     * @param {string} newStatus - 新状态
     */
    updatePendingAuth(studentId, newStatus) {
        const pendingList = this.getPendingAuths();
        const index = pendingList.findIndex(a => a.studentId === studentId && a.status === 'pending');
        if (index !== -1) {
            pendingList[index].status = newStatus;
            pendingList[index].updateTime = new Date().toISOString();
            Storage.set(this.KEYS.PENDING_AUTHS, pendingList);
        }
    },
    
    /**
     * 【新增】根据用户名更新用户的认证状态
     * @param {string} username - 用户名
     * @param {string} authStatus - 认证状态 (unsubmitted/pending/approved/rejected)
     */
    updateUserAuthStatus(username, authStatus) {
        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.username === username);
        if (userIndex !== -1) {
            users[userIndex].authStatus = authStatus;
            Storage.set(this.KEYS.USERS, users);
            console.log('[Auth] 用户认证状态已更新:', username, '->', authStatus);
            return true;
        }
        return false;
    },
    
    /**
     * 【新增】获取用户的认证状态
     * @param {string} username - 用户名
     * @returns {string} 认证状态
     */
    getUserAuthStatus(username) {
        const users = this.getUsers();
        const user = users.find(u => u.username === username);
        return user ? (user.authStatus || 'unsubmitted') : 'unsubmitted';
    },

    /**
     * 更新认证状态
     * @param {string} state - 新状态
     * @param {string} studentId - 学号（用于定位用户）
     */
    updateVerifyState(state, studentId) {
        Storage.set(this.KEYS.VERIFY_STATE, state);
    },

    /**
     * 重置认证状态
     */
    resetVerify() {
        Storage.remove(this.KEYS.VERIFY_INFO);
        Storage.remove(this.KEYS.VERIFY_STATE);
    },

    /**
     * 注册用户
     * @param {Object} userInfo - 用户信息
     */
    registerUser(userInfo) {
        const users = this.getUsers();
        users.push(userInfo);
        Storage.set(this.KEYS.USERS, users);
    },

    /**
     * 检查用户名是否存在
     * @param {string} username - 用户名
     * @returns {boolean}
     */
    usernameExists(username) {
        const users = this.getUsers();
        return users.some(u => u.username === username);
    },

    /**
     * 验证登录
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @returns {Object} { success: boolean, message: string }
     */
    validateLogin(username, password) {
        const users = this.getUsers();
        const user = users.find(u => u.username === username);

        if (!user) {
            return { success: false, message: '用户名不存在' };
        }

        if (user.password !== password) {
            return { success: false, message: '密码错误' };
        }

        return { success: true, message: '登录成功' };
    }
};

// ========== 工具函数 ==========
const Utils = {
    /**
     * 页面跳转
     * @param {string} url - 目标URL
     * @param {string} tab - 选项卡参数
     * @param {string} prefill - 预填充值
     */
    跳转(url, tab = '', prefill = '') {
        let finalUrl = url;
        const params = [];

        if (tab) {
            params.push(`tab=${tab}`);
        }
        if (prefill) {
            params.push(`prefill=${encodeURIComponent(prefill)}`);
        }

        if (params.length > 0) {
            finalUrl += '?' + params.join('&');
        }

        // 延迟跳转，让用户看到提示
        setTimeout(() => {
            window.location.href = finalUrl;
        }, 100);
    },

    /**
     * 格式化时间
     * @param {Date|string|number} date - 日期
     * @returns {string} 格式化的日期字符串
     */
    formatDate(date) {
        if (!date) return '';

        let d;
        if (date instanceof Date) {
            d = date;
        } else {
            d = new Date(date);
        }

        if (isNaN(d.getTime())) {
            return '';
        }

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}`;
    },

    /**
     * 格式化日期（仅日期）
     * @param {Date|string|number} date - 日期
     * @returns {string}
     */
    formatDateOnly(date) {
        if (!date) return '';

        let d;
        if (date instanceof Date) {
            d = date;
        } else {
            d = new Date(date);
        }

        if (isNaN(d.getTime())) {
            return '';
        }

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    },

    /**
     * 生成唯一ID
     * @returns {string}
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },

    /**
     * 防抖函数
     * @param {Function} func - 要防抖的函数
     * @param {number} wait - 等待时间(ms)
     * @returns {Function}
     */
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * 节流函数
     * @param {Function} func - 要节流的函数
     * @param {number} limit - 限制时间(ms)
     * @returns {Function}
     */
    throttle(func, limit = 300) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * 文件转Base64
     * @param {File} file - 文件对象
     * @returns {Promise<string>} Base64字符串
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    /**
     * 获取URL参数
     * @param {string} name - 参数名
     * @returns {string|null}
     */
    getUrlParam(name) {
        const params = new URLSearchParams(window.location.search);
        return params.get(name);
    },

    /**
     * 验证学号格式
     * @param {string} studentId - 学号
     * @returns {Object} { valid: boolean, message: string }
     */
    validateStudentId(studentId) {
        if (!studentId || studentId.trim() === '') {
            return { valid: false, message: '学号不能为空' };
        }

        if (!/^\d+$/.test(studentId)) {
            return { valid: false, message: '学号必须为纯数字' };
        }

        if (studentId.length < 8 || studentId.length > 12) {
            return { valid: false, message: '学号必须为8-12位' };
        }

        return { valid: true, message: '' };
    },

    /**
     * 验证用户名格式
     * @param {string} username - 用户名
     * @returns {Object} { valid: boolean, message: string }
     */
    validateUsername(username) {
        if (!username || username.trim() === '') {
            return { valid: false, message: '用户名不能为空' };
        }

        if (username.length < 6 || username.length > 20) {
            return { valid: false, message: '用户名长度需在6-20位之间' };
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return { valid: false, message: '用户名仅允许字母、数字、下划线' };
        }

        return { valid: true, message: '' };
    },

    /**
     * 验证密码格式
     * @param {string} password - 密码
     * @returns {Object} { valid: boolean, message: string }
     */
    validatePassword(password) {
        if (!password || password === '') {
            return { valid: false, message: '密码不能为空' };
        }

        if (password.length < 6 || password.length > 16) {
            return { valid: false, message: '密码长度需在6-16位之间' };
        }

        return { valid: true, message: '' };
    },

    /**
     * 验证价格格式
     * @param {string} price - 价格
     * @returns {Object} { valid: boolean, message: string }
     */
    validatePrice(price) {
        if (!price || price.trim() === '') {
            return { valid: false, message: '价格不能为空' };
        }

        const num = parseFloat(price);
        if (isNaN(num) || num <= 0) {
            return { valid: false, message: '请输入有效的价格' };
        }

        if (num > 999999) {
            return { valid: false, message: '价格不能超过999999' };
        }

        return { valid: true, message: '' };
    },

    /**
     * 验证微信号格式
     * @param {string} wechat - 微信号
     * @returns {Object} { valid: boolean, message: string }
     */
    validateWechat(wechat) {
        if (!wechat || wechat.trim() === '') {
            return { valid: false, message: '微信号不能为空' };
        }

        if (wechat.length < 6 || wechat.length > 20) {
            return { valid: false, message: '微信号长度需在6-20位之间' };
        }

        return { valid: true, message: '' };
    }
};

// ========== 导航栏模块 ==========
const Navbar = {
    /**
     * 初始化导航栏
     */
    init() {
        this.render();
        this.bindEvents();
    },

    /**
     * 渲染导航栏
     */
    render() {
        const navbarActions = document.querySelector('.navbar-actions');
        if (!navbarActions) return;

        const loginState = Auth.getLoginState();
        const isLoggedIn = loginState.isLogin && loginState.curUser;

        if (isLoggedIn) {
            navbarActions.innerHTML = `
                <div class="navbar-user">
                    <button class="navbar-user-btn" id="userMenuBtn">
                        <span>👤</span>
                        <span>${Utils.escapeHtml(loginState.curUser)}</span>
                        <span>▼</span>
                    </button>
                    <div class="navbar-user-dropdown" id="userDropdown">
                        <a href="user_center.html" class="navbar-user-dropdown-item">📋 个人中心</a>
                        <button class="navbar-user-dropdown-item danger" id="logoutBtn">🚪 退出登录</button>
                    </div>
                </div>
            `;
        } else {
            navbarActions.innerHTML = `
                <a href="user_login.html" class="btn btn-primary">登录/注册</a>
            `;
        }

        // 移动端菜单
        const mobileActions = document.querySelector('.navbar-mobile-actions');
        if (mobileActions) {
            if (isLoggedIn) {
                mobileActions.innerHTML = `
                    <span style="color: var(--text-secondary); margin-bottom: 10px;">当前用户：${Utils.escapeHtml(loginState.curUser)}</span>
                    <a href="user_center.html" class="btn btn-secondary btn-block">个人中心</a>
                    <button class="btn btn-outline btn-block" id="mobileLogoutBtn">退出登录</button>
                `;
            } else {
                mobileActions.innerHTML = `
                    <a href="user_login.html" class="btn btn-primary btn-block">登录/注册</a>
                `;
            }
        }
    },

    /**
     * 绑定事件
     */
    bindEvents() {
        // 汉堡菜单
        const hamburger = document.querySelector('.navbar-hamburger');
        const mobileMenu = document.querySelector('.navbar-mobile-menu');
        const overlay = document.querySelector('.navbar-overlay');

        if (hamburger) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                mobileMenu.classList.toggle('show');
                overlay.classList.toggle('show');
                document.body.style.overflow = mobileMenu.classList.contains('show') ? 'hidden' : '';
            });
        }

        // 点击遮罩关闭
        if (overlay) {
            overlay.addEventListener('click', () => {
                hamburger.classList.remove('active');
                mobileMenu.classList.remove('show');
                overlay.classList.remove('show');
                document.body.style.overflow = '';
            });
        }

        // 用户下拉菜单
        const userMenuBtn = document.getElementById('userMenuBtn');
        const userDropdown = document.getElementById('userDropdown');

        if (userMenuBtn && userDropdown) {
            userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('show');
            });

            document.addEventListener('click', () => {
                userDropdown.classList.remove('show');
            });
        }

        // 退出登录
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                Modal.confirm('退出登录', '确定要退出登录吗？', () => {
                    Auth.logout();
                });
            });
        }

        // 移动端退出登录
        const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
        if (mobileLogoutBtn) {
            mobileLogoutBtn.addEventListener('click', () => {
                Modal.confirm('退出登录', '确定要退出登录吗？', () => {
                    Auth.logout();
                });
            });
        }

        // 高亮当前页面菜单
        this.highlightCurrentPage();
    },

    /**
     * 高亮当前页面菜单
     */
    highlightCurrentPage() {
        const currentPage = window.location.pathname.split('/').pop() || 'home.html';
        const menuLinks = document.querySelectorAll('.navbar-menu-link, .navbar-mobile-menu-item');

        menuLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage) {
                link.classList.add('active');
            }
        });
    }
};

// ========== HTML转义 ==========
Utils.escapeHtml = function(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

// ========== 图片预览 ==========
const ImagePreview = {
    /**
     * 显示图片预览
     * @param {string} src - 图片src
     */
    show(src) {
        const modal = document.createElement('div');
        modal.className = 'image-preview-modal';
        modal.innerHTML = `
            <img src="${src}" alt="图片预览">
            <button class="image-preview-modal-close">×</button>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        setTimeout(() => {
            modal.classList.add('show');
        }, 10);

        const close = () => {
            modal.classList.remove('show');
            document.body.style.overflow = '';
            setTimeout(() => {
                if (modal.parentElement) {
                    modal.parentElement.removeChild(modal);
                }
            }, 300);
        };

        modal.querySelector('.image-preview-modal-close').addEventListener('click', close);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                close();
            }
        });
    }
};

// ========== 页面初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
    // 初始化导航栏
    if (document.querySelector('.navbar')) {
        Navbar.init();
    }
});
