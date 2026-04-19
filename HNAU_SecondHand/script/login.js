/**
 * ============================================
 * 河南农业大学·农大闲置 - 登录注册页逻辑
 * 功能：注册/登录/判重/同步
 * ============================================
 */

const LoginModule = {
    // 状态
    state: {
        currentTab: 'login',
        isSubmitting: false,
        lastUsername: ''
    },

    /**
     * 初始化
     */
    init() {
        this.parseUrlParams();
        this.render();
        this.bindEvents();
    },

    /**
     * 解析URL参数
     */
    parseUrlParams() {
        const tab = Utils.getUrlParam('tab');
        const prefill = Utils.getUrlParam('prefill');

        if (tab === 'register') {
            this.state.currentTab = 'register';
        } else {
            this.state.currentTab = 'login';
        }

        if (prefill) {
            this.state.lastUsername = decodeURIComponent(prefill);
        }
    },

    /**
     * 渲染页面
     */
    render() {
        this.switchTab(this.state.currentTab);

        // 如果有预填充用户名，自动填充
        if (this.state.lastUsername) {
            const loginUsername = document.getElementById('loginUsername');
            if (loginUsername && this.state.currentTab === 'login') {
                loginUsername.value = this.state.lastUsername;
            }
        }
    },

    /**
     * 绑定事件
     */
    bindEvents() {
        // 选项卡切换
        const tabs = document.querySelectorAll('.tabs-nav-item');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // 注册表单事件
        this.bindRegisterEvents();

        // 登录表单事件
        this.bindLoginEvents();

        // 点击外部关闭下拉/提示
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-suggestions')) {
                const suggestions = document.querySelectorAll('.search-suggestions');
                suggestions.forEach(s => s.classList.remove('show'));
            }
        });
    },

    /**
     * 切换选项卡
     * @param {string} tabName - 选项卡名称
     */
    switchTab(tabName) {
        // 更新选项卡状态
        const tabs = document.querySelectorAll('.tabs-nav-item');
        tabs.forEach(tab => {
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

        this.state.currentTab = tabName;

        // 清空对应表单错误提示
        if (tabName === 'register') {
            this.clearErrors('register');
            // 聚焦用户名输入框
            setTimeout(() => {
                const usernameInput = document.getElementById('regUsername');
                if (usernameInput) usernameInput.focus();
            }, 100);
        } else {
            this.clearErrors('login');
            // 如果有预填充用户名，聚焦密码输入框
            if (this.state.lastUsername) {
                setTimeout(() => {
                    const passwordInput = document.getElementById('loginPassword');
                    if (passwordInput) passwordInput.focus();
                }, 100);
            } else {
                setTimeout(() => {
                    const usernameInput = document.getElementById('loginUsername');
                    if (usernameInput) usernameInput.focus();
                }, 100);
            }
        }
    },

    /**
     * 绑定注册表单事件
     */
    bindRegisterEvents() {
        const form = document.getElementById('registerForm');
        if (!form) return;

        const usernameInput = document.getElementById('regUsername');
        const passwordInput = document.getElementById('regPassword');
        const confirmInput = document.getElementById('regConfirmPassword');
        const submitBtn = document.getElementById('registerBtn');

        // 用户名输入过滤
        if (usernameInput) {
            usernameInput.addEventListener('input', () => {
                // 仅允许字母、数字、下划线
                usernameInput.value = usernameInput.value.replace(/[^a-zA-Z0-9_]/g, '');
                this.updateRegisterBtnState();
            });

            usernameInput.addEventListener('blur', () => {
                this.validateRegUsername();
            });
        }

        // 密码输入
        if (passwordInput) {
            passwordInput.addEventListener('input', () => {
                this.updateRegisterBtnState();
            });

            passwordInput.addEventListener('blur', () => {
                this.validateRegPassword();
            });
        }

        // 确认密码输入
        if (confirmInput) {
            confirmInput.addEventListener('input', () => {
                this.updateRegisterBtnState();
            });

            confirmInput.addEventListener('blur', () => {
                this.validateRegConfirm();
            });
        }

        // 提交按钮
        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }
    },

    /**
     * 绑定登录表单事件
     */
    bindLoginEvents() {
        const form = document.getElementById('loginForm');
        if (!form) return;

        const usernameInput = document.getElementById('loginUsername');
        const passwordInput = document.getElementById('loginPassword');
        const submitBtn = document.getElementById('loginBtn');

        // 用户名输入
        if (usernameInput) {
            usernameInput.addEventListener('input', () => {
                this.updateLoginBtnState();
            });

            usernameInput.addEventListener('blur', () => {
                this.validateLoginUsername();
            });
        }

        // 密码输入
        if (passwordInput) {
            passwordInput.addEventListener('input', () => {
                this.updateLoginBtnState();
            });

            passwordInput.addEventListener('blur', () => {
                this.validateLoginPassword();
            });
        }

        // 提交按钮
        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // 如果有预填充用户名，自动触发验证
        if (this.state.lastUsername && usernameInput) {
            this.updateLoginBtnState();
        }
    },

    /**
     * 更新注册按钮状态
     */
    updateRegisterBtnState() {
        const username = document.getElementById('regUsername')?.value || '';
        const password = document.getElementById('regPassword')?.value || '';
        const confirm = document.getElementById('regConfirmPassword')?.value || '';
        const submitBtn = document.getElementById('registerBtn');

        const usernameValid = Utils.validateUsername(username).valid;
        const passwordValid = Utils.validatePassword(password).valid;
        const confirmValid = confirm === password && password !== '';

        if (submitBtn) {
            submitBtn.disabled = !(usernameValid && passwordValid && confirmValid);
        }
    },

    /**
     * 更新登录按钮状态
     */
    updateLoginBtnState() {
        const username = document.getElementById('loginUsername')?.value || '';
        const password = document.getElementById('loginPassword')?.value || '';
        const submitBtn = document.getElementById('loginBtn');

        const usernameValid = username.trim() !== '';
        const passwordValid = password !== '';

        if (submitBtn) {
            submitBtn.disabled = !(usernameValid && passwordValid);
        }
    },

    /**
     * 校验注册用户名
     */
    validateRegUsername() {
        const username = document.getElementById('regUsername')?.value || '';
        const result = Utils.validateUsername(username);

        if (!result.valid) {
            this.showError('regUsernameError', result.message);
            return false;
        }

        // 检查用户名是否已存在
        if (Auth.usernameExists(username)) {
            this.showError('regUsernameError', '该用户名已被注册，请更换');
            return false;
        }

        this.hideError('regUsernameError');
        return true;
    },

    /**
     * 校验注册密码
     */
    validateRegPassword() {
        const password = document.getElementById('regPassword')?.value || '';
        const result = Utils.validatePassword(password);

        if (!result.valid) {
            this.showError('regPasswordError', result.message);
            return false;
        }

        this.hideError('regPasswordError');
        return true;
    },

    /**
     * 校验确认密码
     */
    validateRegConfirm() {
        const password = document.getElementById('regPassword')?.value || '';
        const confirm = document.getElementById('regConfirmPassword')?.value || '';

        if (confirm === '') {
            return true;
        }

        if (confirm !== password) {
            this.showError('regConfirmError', '两次输入的密码不一致');
            return false;
        }

        this.hideError('regConfirmError');
        return true;
    },

    /**
     * 校验登录用户名
     */
    validateLoginUsername() {
        const username = document.getElementById('loginUsername')?.value || '';

        if (username.trim() === '') {
            this.showError('loginUsernameError', '用户名不能为空');
            return false;
        }

        this.hideError('loginUsernameError');
        return true;
    },

    /**
     * 校验登录密码
     */
    validateLoginPassword() {
        const password = document.getElementById('loginPassword')?.value || '';

        if (password === '') {
            this.showError('loginPasswordError', '密码不能为空');
            return false;
        }

        this.hideError('loginPasswordError');
        return true;
    },

    /**
     * 显示错误
     */
    showError(elementId, message) {
        const errorEl = document.getElementById(elementId);
        const inputEl = errorEl?.previousElementSibling?.previousElementSibling;

        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.add('show');
        }

        if (inputEl && inputEl.classList) {
            inputEl.classList.add('error');
        }
    },

    /**
     * 隐藏错误
     */
    hideError(elementId) {
        const errorEl = document.getElementById(elementId);
        const inputEl = errorEl?.previousElementSibling?.previousElementSibling;

        if (errorEl) {
            errorEl.textContent = '';
            errorEl.classList.remove('show');
        }

        if (inputEl && inputEl.classList) {
            inputEl.classList.remove('error');
        }
    },

    /**
     * 清空错误
     */
    clearErrors(formType) {
        if (formType === 'register') {
            ['regUsernameError', 'regPasswordError', 'regConfirmError'].forEach(id => {
                this.hideError(id);
            });
        } else {
            ['loginUsernameError', 'loginPasswordError'].forEach(id => {
                this.hideError(id);
            });
        }
    },

    /**
     * 处理注册
     */
    handleRegister() {
        if (this.state.isSubmitting) return;

        const username = document.getElementById('regUsername')?.value || '';
        const password = document.getElementById('regPassword')?.value || '';
        const submitBtn = document.getElementById('registerBtn');

        // 校验
        if (!this.validateRegUsername()) return;
        if (!this.validateRegPassword()) return;
        if (!this.validateRegConfirm()) return;

        // 防重复提交
        this.state.isSubmitting = true;
        submitBtn.disabled = true;
        submitBtn.classList.add('btn-loading');
        submitBtn.textContent = '注册中...';

        // 模拟网络延迟
        setTimeout(() => {
            // 检查用户名是否被抢注
            if (Auth.usernameExists(username)) {
                this.showError('regUsernameError', '该用户名已被注册，请更换');
                this.resetSubmitBtn();
                return;
            }

            // 创建用户 - 【关键修改】添加 authStatus 字段
            const userInfo = {
                username: username,
                password: password,
                regTime: Utils.formatDate(new Date()),
                authStatus: 'unsubmitted'  // 新增：认证状态 (unsubmitted/pending/approved/rejected)
            };

            Auth.registerUser(userInfo);

            Toast.show('注册成功！请切换到登录页登录', 'success');

            // 清空注册表单
            document.getElementById('regUsername').value = '';
            document.getElementById('regPassword').value = '';
            document.getElementById('regConfirmPassword').value = '';

            // 1秒后切换到登录选项卡
            setTimeout(() => {
                this.switchTab('login');
                // 自动填充用户名
                const loginUsername = document.getElementById('loginUsername');
                if (loginUsername) {
                    loginUsername.value = username;
                }
                // 聚焦密码输入框
                const loginPassword = document.getElementById('loginPassword');
                if (loginPassword) {
                    loginPassword.focus();
                }
                this.resetSubmitBtn();
            }, 1000);

        }, 500);
    },

    /**
     * 处理登录
     */
    handleLogin() {
        if (this.state.isSubmitting) return;

        const username = document.getElementById('loginUsername')?.value || '';
        const password = document.getElementById('loginPassword')?.value || '';
        const submitBtn = document.getElementById('loginBtn');

        // 校验
        if (!this.validateLoginUsername()) return;
        if (!this.validateLoginPassword()) return;

        // 防重复提交
        this.state.isSubmitting = true;
        submitBtn.disabled = true;
        submitBtn.classList.add('btn-loading');
        submitBtn.textContent = '登录中...';

        // 模拟网络延迟
        setTimeout(() => {
            const result = Auth.validateLogin(username, password);

            if (!result.success) {
                if (result.message === '用户名不存在') {
                    this.showError('loginUsernameError', result.message);
                } else {
                    this.showError('loginPasswordError', result.message);
                }
                this.resetSubmitBtn();
                return;
            }

            // 登录成功
            Auth.login(username);

            Toast.show('登录成功！即将跳转到首页', 'success');

            // 1.5秒后跳转到首页
            setTimeout(() => {
                Utils.跳转('home.html');
            }, 1500);

        }, 500);
    },

    /**
     * 重置提交按钮
     */
    resetSubmitBtn() {
        this.state.isSubmitting = false;
        const regBtn = document.getElementById('registerBtn');
        const loginBtn = document.getElementById('loginBtn');

        if (regBtn) {
            regBtn.disabled = true;
            regBtn.classList.remove('btn-loading');
            regBtn.textContent = '注册';
        }

        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.classList.remove('btn-loading');
            loginBtn.textContent = '登录';
        }
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('loginContent')) {
        LoginModule.init();
    }
});
