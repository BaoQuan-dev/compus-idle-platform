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
            // 如果是存储空间不足，提供更友好的提示
            if (e.name === 'QuotaExceededError' || e.code === 22) {
                Toast.show('存储空间已满，请清理浏览器缓存后重试', 'error');
            } else {
                Toast.show('存储失败，请清理浏览器缓存后重试', 'error');
            }
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
     * 【修复】获取认证状态 - 从用户数据读取，不使用全局状态
     * @param {string} username - 用户名（可选，默认取当前登录用户）
     * @returns {string} 认证状态
     */
    getVerifyState(username) {
        // 如果没有传入用户名，使用当前登录用户
        if (!username) {
            const loginState = this.getLoginState();
            username = loginState.curUser;
        }
        return this.getUserAuthStatus(username);
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
     * 获取当前登录用户的信息
     * @returns {Object|null} 用户信息对象
     */
    getCurrentUser() {
        const loginState = this.getLoginState();
        if (!loginState.isLogin || !loginState.curUser) {
            return null;
        }
        const users = this.getUsers();
        return users.find(u => u.username === loginState.curUser) || null;
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
     * 【修复】检查认证是否通过 - 从用户数据读取
     * @returns {boolean}
     */
    isVerified() {
        const loginState = this.getLoginState();
        if (!loginState.isLogin || !loginState.curUser) {
            return false;
        }
        return this.getUserAuthStatus(loginState.curUser) === 'approved';
    },

    /**
     * 四级权限校验 - 发布商品专用
     * @returns {Object} { passed: boolean, level: number, message: string, redirect: string }
     */
    /**
     * 四级权限校验 - 发布商品专用
     * 【关键修复】简化逻辑：只需检查登录状态和用户 authStatus
     * 流程：注册 → 登录 → 提交认证 → 管理员审核通过 → 发布
     * @returns {Object} { passed: boolean, level: number, message: string, redirect: string }
     */
    checkReleasePermission() {
        const loginState = this.getLoginState();
        
        // 校验0：检查是否登录
        if (!loginState.isLogin || !loginState.curUser) {
            return {
                passed: false,
                level: 0,
                message: '请先登录后再发布商品',
                type: 'info',
                redirect: 'user_login.html',
                tab: 'login'
            };
        }
        
        // 【修复】严格读取用户数据中的authStatus，禁止用全局状态覆盖用户状态
        const verifyState = this.getUserAuthStatus(loginState.curUser);
        
        console.log('[Auth] 发布权限校验 - 用户:', loginState.curUser, '| 认证状态:', verifyState);

        // 校验1：检查认证状态
        if (verifyState === 'approved') {
            // 已认证，直接通过
            return { passed: true, level: 4 };
        }
        
        if (verifyState === 'pending') {
            return {
                passed: false,
                level: 1,
                message: '您的认证正在审核中，请等待审核通过后再发布商品',
                type: 'warning',
                redirect: 'user_center.html'
            };
        }
        
        if (verifyState === 'rejected') {
            return {
                passed: false,
                level: 1,
                message: '您的认证申请被拒绝，请重新提交认证信息',
                type: 'error',
                redirect: 'stu_check.html'
            };
        }
        
        // verifyState === 'unsubmitted' 或其他情况
        return {
            passed: false,
            level: 1,
            message: '发布商品需先完成校园认证并通过审核',
            type: 'error',
            redirect: 'stu_check.html'
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
        // 同步设置explore页面使用的状态标记
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', username);
    },

    /**
     * 退出登录
     */
    logout() {
        Storage.remove(this.KEYS.LOGIN_STATE);
        // 同步清除explore页面使用的状态标记
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('isCertified');
        localStorage.removeItem('username');
        // 刷新页面以更新导航栏状态
        location.reload();
    },

    /**
     * 提交认证
     * @param {Object} info - 认证信息
     * @returns {boolean} 是否提交成功
     */
    submitVerify(info) {
        // 获取当前登录用户名用于关联
        const loginState = this.getLoginState();
        
        const authRecord = {
            id: Date.now().toString(),  // 唯一ID
            username: loginState.curUser,  // 【修复】关联用户名
            studentId: info.studentId,
            campus: info.campus,
            subCampus: info.subCampus || '',
            college: info.college,
            studentCardImage: info.studentCardImage,
            submitTime: info.submitTime || new Date().toISOString(),
            status: 'pending'  // pending | approved | rejected
        };
        
        // 1. 保存到待审核列表
        const pendingList = this.getPendingAuths();
        pendingList.push(authRecord);
        const save1 = Storage.set(this.KEYS.PENDING_AUTHS, pendingList);
        if (!save1) {
            console.error('[Auth] 认证申请保存失败');
            return false;
        }
        
        // 2. 同步更新当前登录用户的认证状态
        if (loginState.isLogin && loginState.curUser) {
            this.updateUserAuthStatus(loginState.curUser, 'pending');
            // 同时更新用户数据中的学号、校区、学院
            const users = this.getUsers();
            const userIndex = users.findIndex(u => u.username === loginState.curUser);
            if (userIndex !== -1) {
                users[userIndex].studentId = info.studentId;
                users[userIndex].campus = info.campus;
                users[userIndex].college = info.college;
                const save2 = Storage.set(this.KEYS.USERS, users);
                if (!save2) {
                    console.error('[Auth] 用户信息更新失败');
                    return false;
                }
            }
        }
        
        // 3. 保存认证信息（可选，用于兼容）
        const save3 = Storage.set(this.KEYS.VERIFY_INFO, info);
        if (!save3) {
            console.error('[Auth] 认证信息保存失败');
            return false;
        }
        
        console.log('[Auth] 认证申请已提交，用户:', loginState.curUser, '| 学号:', info.studentId);
        return true;
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
     * 【新增】根据学号更新用户的认证状态
     * @param {string} username - 用户名
     * @param {string} authStatus - 认证状态
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
     * 【新增】根据学号在待审核列表中关联用户名
     * @param {string} studentId - 学号
     * @param {string} newStatus - 新状态
     * @param {string} username - 关联的用户名
     */
    updatePendingAuthByStudentId(studentId, newStatus, username) {
        const pendingList = this.getPendingAuths();
        const index = pendingList.findIndex(a => a.studentId === studentId && a.status === 'pending');
        if (index !== -1) {
            pendingList[index].status = newStatus;
            pendingList[index].username = username;  // 关联用户名
            pendingList[index].updateTime = new Date().toISOString();
            Storage.set(this.KEYS.PENDING_AUTHS, pendingList);
            console.log('[Auth] 待审核记录已关联:', studentId, '<->', username);
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
     * 【新增】根据学号更新用户的认证状态（管理员审核用）
     * @param {string} studentId - 学号
     * @param {string} authStatus - 认证状态
     */
    updateUserAuthStatusByStudentId(studentId, authStatus) {
        const users = this.getUsers();
        // 找到学号匹配且当前是待审核状态的用户
        const userIndex = users.findIndex(u => 
            u.studentId === studentId && u.authStatus === 'pending'
        );
        if (userIndex !== -1) {
            users[userIndex].authStatus = authStatus;
            Storage.set(this.KEYS.USERS, users);
            console.log('[Auth] 根据学号更新用户认证状态:', studentId, '->', authStatus);
            return true;
        }
        
        // 如果没找到待审核用户，尝试匹配所有用户
        const anyUserIndex = users.findIndex(u => u.studentId === studentId);
        if (anyUserIndex !== -1) {
            users[anyUserIndex].authStatus = authStatus;
            Storage.set(this.KEYS.USERS, users);
            console.log('[Auth] 根据学号更新用户认证状态:', studentId, '->', authStatus);
            return true;
        }
        
        console.warn('[Auth] 未找到学号对应的用户:', studentId);
        return false;
    },

    /**
     * 【修复】更新认证状态 - 更新用户数据中的认证状态
     * @param {string} state - 新状态
     * @param {string} studentId - 学号（用于定位用户）
     */
    updateVerifyState(state, studentId) {
        // 【修复】根据学号找到用户并更新其认证状态
        if (studentId) {
            this.updateUserAuthStatusByStudentId(studentId, state);
        } else {
            // 如果没有学号，更新当前登录用户的状态
            const loginState = this.getLoginState();
            if (loginState.curUser) {
                this.updateUserAuthStatus(loginState.curUser, state);
            }
        }
    },

    /**
     * 重置认证状态
     */
    resetVerify() {
        // 【修复】重置当前登录用户的认证状态
        const loginState = this.getLoginState();
        if (loginState.curUser) {
            this.updateUserAuthStatus(loginState.curUser, 'unsubmitted');
        }
        Storage.remove(this.KEYS.VERIFY_INFO);
    },

    /**
     * 设置当前登录用户
     * @param {Object} userInfo - 用户信息
     */
    setCurrentUser(userInfo) {
        const loginState = this.getLoginState();
        loginState.isLoggedIn = true;
        loginState.curUser = userInfo;
        Storage.set(this.KEYS.LOGIN_STATE, loginState);
        console.log('[Auth] 设置当前用户:', userInfo.username);
    },

    /**
     * 注册用户
     * @param {Object} userInfo - 用户信息
     */
    registerUser(userInfo) {
        const users = this.getUsers();
        users.push(userInfo);
        Storage.set(this.KEYS.USERS, users);

        // 注册成功后自动设置为当前登录用户
        this.setCurrentUser(userInfo);
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
        const currentPage = window.location.pathname.split('/').pop() || 'starfield.html';
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

/**
 * 获取存储空间使用情况
 */
function getStorageUsage() {
    let used = 0;
    try {
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key) && localStorage[key]) {
                used += localStorage[key].length + key.length;
            }
        }
    } catch (e) {
        console.warn('[Storage] 计算空间失败:', e);
    }
    // 估算 localStorage 总容量（通常 5MB）
    const total = 5 * 1024 * 1024;
    return {
        used: used,
        total: total,
        percent: Math.round((used / total) * 100),
        usedMB: (used / 1024 / 1024).toFixed(2),
        totalMB: (total / 1024 / 1024).toFixed(2)
    };
}

/**
 * 检查存储空间是否足够（预留 500KB 余量）
 * @param {number} neededBytes - 需要的空间（字节）
 * @returns {boolean}
 */
function checkStorageSpace(neededBytes) {
    const buffer = 500 * 1024; // 500KB 余量
    const usage = getStorageUsage();
    return (usage.used + neededBytes + buffer) < usage.total;
}

/**
 * 图片压缩工具
 */
const ImageCompressor = {
    /**
     * 压缩图片文件
     * @param {File} file - 图片文件
     * @param {object} options - 配置选项
     * @returns {Promise<string>} 返回压缩后的 Base64
     */
    async compress(file, options = {}) {
        const {
            maxWidth = 1200,      // 最大宽度
            maxHeight = 1200,     // 最大高度
            quality = 0.7,        // 压缩质量 (0-1)
            mimeType = 'image/jpeg'
        } = options;

        return new Promise((resolve, reject) => {
            // 创建图片对象
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (e) => {
                img.src = e.target.result;
            };

            img.onload = () => {
                // 计算压缩后的尺寸
                let { width, height } = img;
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }

                // 创建 Canvas 并绘制压缩后的图片
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // 输出压缩后的 Base64
                const compressed = canvas.toDataURL(mimeType, quality);
                console.log(`[ImageCompressor] 压缩完成: ${(file.size / 1024).toFixed(1)}KB -> ${(compressed.length / 1024).toFixed(1)}KB`);
                resolve(compressed);
            };

            img.onerror = () => {
                reject(new Error('图片加载失败'));
            };

            reader.onerror = () => {
                reject(new Error('文件读取失败'));
            };

            reader.readAsDataURL(file);
        });
    }
};

// ========== 清除所有登录注册相关数据 ==========
const DataCleaner = {
    // 所有需要清除的键名
    KEYS_TO_CLEAR: [
        // 登录状态
        'hnau_login_state',
        'hnau_current_user',
        // 用户相关
        'hnau_users',
        // 认证相关
        'hnau_verify_state',
        'hnau_verify_info',
        'hnau_pending_auths',
        // 商品相关（发布商品）
        'hnau_goods',
        'hnau_products',
        // 收藏相关
        'hnau_collects',
        'hnau_favorites',
        // 需求相关
        'hnau_demands',
        'demandList',
        // 公益转赠
        'hnau_donation_list',
        // 碳足迹
        'hnau_carbon_data',
        // 管理员
        'hnau_admin_login',
        'hnau_admin_state',
        // 通知
        'hnau_notifications',
        // 其他可能的数据
        'hnau_history',
        'hnau_messages',
        'hnau_settings'
    ],

    /**
     * 清除所有登录注册相关数据
     * @returns {object} 清除结果
     */
    clearAll() {
        let cleared = [];
        let failed = [];

        this.KEYS_TO_CLEAR.forEach(key => {
            try {
                if (localStorage.getItem(key) !== null) {
                    localStorage.removeItem(key);
                    cleared.push(key);
                }
            } catch (e) {
                failed.push({ key, error: e.message });
            }
        });

        console.log('[DataCleaner] 清除完成:', {
            cleared: cleared.length,
            failed: failed.length,
            keys: cleared
        });

        return {
            success: failed.length === 0,
            cleared,
            failed
        };
    },

    /**
     * 清除登录状态（保留用户数据）
     */
    clearLoginState() {
        const keys = ['hnau_login_state', 'hnau_current_user', 'hnau_admin_login', 'hnau_admin_state'];
        keys.forEach(key => {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                console.warn('[DataCleaner] 清除失败:', key);
            }
        });
        console.log('[DataCleaner] 登录状态已清除');
    },

    /**
     * 清除公益转赠数据
     */
    clearDonationData() {
        const keys = ['hnau_donation_list'];
        let cleared = [];
        keys.forEach(key => {
            try {
                if (localStorage.getItem(key) !== null) {
                    localStorage.removeItem(key);
                    cleared.push(key);
                    console.log('[DataCleaner] 已清除:', key);
                }
            } catch (e) {
                console.warn('[DataCleaner] 清除失败:', key, e);
            }
        });
        return { success: true, cleared };
    },

    /**
     * 获取存储空间使用情况
     */
    getStorageInfo() {
        let totalSize = 0;
        let keys = [];

        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key) && localStorage[key]) {
                const size = localStorage[key].length;
                totalSize += size;
                keys.push({
                    key,
                    size: (size / 1024).toFixed(2) + ' KB'
                });
            }
        }

        return {
            totalSize: (totalSize / 1024 / 1024).toFixed(2) + ' MB',
            keyCount: keys.length,
            keys: keys.sort((a, b) => parseFloat(b.size) - parseFloat(a.size))
        };
    }
};

// 暴露到全局
window.DataCleaner = DataCleaner;
window.Storage = Storage;
window.getStorageUsage = getStorageUsage;
window.checkStorageSpace = checkStorageSpace;

// ========== 页面初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
    // 初始化导航栏
    if (document.querySelector('.navbar')) {
        Navbar.init();
    }
});
