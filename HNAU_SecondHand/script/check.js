/**
 * ============================================
 * 河南农业大学·农大闲置 - 校园认证页逻辑
 * 功能：上传/提交/状态/联动
 * ============================================
 */

// 学院数据
const COLLEGES_DATA = {
    '郑州校区': [
        '农学院', '林学院', '风景园林学院', '艺术与设计学院',
        '动物医学院', '动物科技学院', '机电工程学院', '经济与管理学院',
        '烟草学院', '植物保护学院', '园艺学院', '信息与管理科学学院',
        '软件学院', '生命科学学院', '食品科学技术学院', '资源与环境学院',
        '文法学院', '马克思主义学院', '理学院', '外国语学院',
        '体育学院', '国际教育学院', '马尔凯理工学院', '其他'
    ],
    '许昌校区': [
        '软件学院', '应用科技学院（许昌校区）', '其他'
    ]
};

// 校园认证模块
const CheckModule = {
    // 状态
    state: {
        verifyState: 'unsubmitted',
        verifyInfo: null,
        selectedFile: null,
        fileBase64: ''
    },

    /**
     * 初始化
     */
    init() {
        this.loadState();
        this.render();
        this.bindEvents();
    },

    /**
     * 加载状态
     */
    loadState() {
        // 【修复】只从用户数据中读取当前登录用户的认证状态
        const loginState = Auth.getLoginState();
        this.state.verifyState = Auth.getUserAuthStatus(loginState.curUser);
        this.state.verifyInfo = Auth.getVerifyInfo();
    },

    /**
     * 渲染页面状态
     */
    render() {
        const container = document.getElementById('checkContent');
        if (!container) return;

        switch (this.state.verifyState) {
            case Auth.VERIFY_STATE.UNSUBMITTED:
                this.renderForm(container);
                break;
            case Auth.VERIFY_STATE.PENDING:
                this.renderPending(container);
                break;
            case Auth.VERIFY_STATE.APPROVED:
                this.renderApproved(container);
                break;
            default:
                this.renderForm(container);
        }
    },

    /**
     * 渲染认证表单
     */
    renderForm(container) {
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">📝 校园认证信息填写</h2>
                </div>
                <form id="verifyForm" class="verify-form">
                    <!-- 学号 -->
                    <div class="form-group">
                        <label class="form-label required">学号</label>
                        <input type="text" id="studentId" class="form-input" 
                               placeholder="请输入8-12位纯数字学号" 
                               maxlength="12"
                               autocomplete="off">
                        <p class="form-error" id="studentIdError"></p>
                    </div>

                    <!-- 校区选择 -->
                    <div class="form-group">
                        <label class="form-label required">校区</label>
                        <div class="form-radio-group">
                            <label class="form-radio">
                                <input type="radio" name="campus" value="郑州校区" checked>
                                <span>郑州校区</span>
                            </label>
                            <label class="form-radio">
                                <input type="radio" name="campus" value="许昌校区">
                                <span>许昌校区</span>
                            </label>
                        </div>
                    </div>

                    <!-- 子校区选择（仅郑州校区显示） -->
                    <div class="form-group" id="subCampusGroup">
                        <label class="form-label required">子校区</label>
                        <select id="subCampus" class="form-select">
                            <option value="">请选择子校区</option>
                            <option value="龙子湖校区">龙子湖校区</option>
                            <option value="文化路校区">文化路校区</option>
                            <option value="桃李园校区">桃李园校区</option>
                        </select>
                        <p class="form-error" id="subCampusError"></p>
                    </div>

                    <!-- 学院选择 -->
                    <div class="form-group">
                        <label class="form-label required">学院</label>
                        <select id="college" class="form-select">
                            <option value="">请选择学院</option>
                        </select>
                        <p class="form-error" id="collegeError"></p>
                    </div>

                    <!-- 学生证照片上传 -->
                    <div class="form-group">
                        <label class="form-label required">学生证照片</label>
                        <div class="upload-area" id="uploadArea">
                            <input type="file" class="upload-area-input" id="studentCardInput" 
                                   accept="image/jpeg,image/png,image/webp">
                            <div class="upload-area-content">
                                <span class="upload-area-icon">📷</span>
                                <span class="upload-area-text">点击或拖拽上传学生证照片</span>
                                <span class="upload-area-hint">支持JPG/PNG/WebP格式，最大5MB</span>
                            </div>
                        </div>
                        <div class="upload-preview" id="uploadPreview">
                            <img src="" alt="预览" class="upload-preview-image" id="previewImage">
                            <div class="upload-preview-actions">
                                <button type="button" class="upload-preview-delete" id="deleteImageBtn">删除图片</button>
                            </div>
                        </div>
                        <p class="form-error" id="studentCardError"></p>
                    </div>

                    <!-- 提交按钮 -->
                    <button type="submit" class="btn btn-primary btn-lg btn-block" id="submitBtn" disabled>
                        提交认证
                    </button>
                </form>
            </div>

            <!-- 认证须知 -->
            <div class="notice-box">
                <h3 class="notice-title">📋 认证须知</h3>
                <ul class="notice-list">
                    <li class="notice-item">请确保填写的学号与学生证信息一致，审核通过后可发布商品</li>
                    <li class="notice-item">学生证照片需清晰可辨，包含照片页和注册页</li>
                    <li class="notice-item">认证审核通常在1-3个工作日内完成，请耐心等待</li>
                    <li class="notice-item">如需修改认证信息，可前往个人中心重置认证状态后重新提交</li>
                    <li class="notice-item">同一学号仅支持一个账号，认证通过后无法更换绑定</li>
                </ul>
            </div>
        `;

        // 初始化学院列表
        this.initColleges('郑州校区');
        this.updateFormState();
    },

    /**
     * 渲染待审核状态
     */
    renderPending(container) {
        container.innerHTML = `
            <div class="card">
                <div class="status-card">
                    <div class="status-card-icon">⏳</div>
                    <h2 class="status-card-title">认证待审核</h2>
                    <p class="status-card-text">您的认证信息已提交，等待管理员审核中...</p>
                    <a href="home.html" class="btn btn-primary">返回首页</a>
                </div>
            </div>
        `;
    },

    /**
     * 渲染已通过状态
     */
    renderApproved(container) {
        container.innerHTML = `
            <div class="card">
                <div class="status-card">
                    <div class="status-card-icon" style="color: var(--success-color);">✅</div>
                    <h2 class="status-card-title">认证已通过</h2>
                    <p class="status-card-text">您的校园认证已通过审核，可前往注册账号</p>
                    <button class="btn btn-primary" id="goRegisterBtn">立即去注册</button>
                </div>
            </div>
        `;

        // 绑定注册按钮
        const goRegisterBtn = document.getElementById('goRegisterBtn');
        if (goRegisterBtn) {
            goRegisterBtn.addEventListener('click', () => {
                Utils.跳转('user_login.html', 'register');
            });
        }
    },

    /**
     * 初始化学院列表
     * @param {string} campus - 校区
     */
    initColleges(campus) {
        const collegeSelect = document.getElementById('college');
        if (!collegeSelect) return;

        const colleges = COLLEGES_DATA[campus] || [];

        collegeSelect.innerHTML = '<option value="">请选择学院</option>';
        colleges.forEach(college => {
            const option = document.createElement('option');
            option.value = college;
            option.textContent = college;
            collegeSelect.appendChild(option);
        });
    },

    /**
     * 绑定事件
     */
    bindEvents() {
        // 【修复】监听认证状态变化，实时更新页面
        const loginState = Auth.getLoginState();
        this.intervalId = setInterval(() => {
            const newState = Auth.getUserAuthStatus(loginState.curUser);
            if (newState !== this.state.verifyState) {
                this.loadState();
                this.render();
                // 重新绑定事件
                setTimeout(() => this.bindEvents(), 100);
            }
        }, 1000);

        // 表单事件绑定
        this.bindFormEvents();
    },

    /**
     * 绑定表单事件
     */
    bindFormEvents() {
        const form = document.getElementById('verifyForm');
        if (!form) return;

        // 学号输入过滤
        const studentIdInput = document.getElementById('studentId');
        if (studentIdInput) {
            studentIdInput.addEventListener('input', (e) => {
                // 仅允许数字
                e.target.value = e.target.value.replace(/\D/g, '');
                this.updateFormState();
            });

            studentIdInput.addEventListener('blur', () => {
                this.validateStudentId();
            });
        }

        // 校区切换
        const campusRadios = document.querySelectorAll('input[name="campus"]');
        campusRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const campus = e.target.value;
                const subCampusGroup = document.getElementById('subCampusGroup');
                const subCampus = document.getElementById('subCampus');

                if (campus === '许昌校区') {
                    subCampusGroup.style.display = 'none';
                    if (subCampus) subCampus.value = '';
                } else {
                    subCampusGroup.style.display = 'block';
                }

                // 更新学院列表
                this.initColleges(campus);
                this.updateFormState();
            });
        });

        // 子校区选择
        const subCampusSelect = document.getElementById('subCampus');
        if (subCampusSelect) {
            subCampusSelect.addEventListener('change', () => {
                this.updateFormState();
            });
        }

        // 学院选择
        const collegeSelect = document.getElementById('college');
        if (collegeSelect) {
            collegeSelect.addEventListener('change', () => {
                this.updateFormState();
            });
        }

        // 图片上传
        this.bindUploadEvents();

        // 表单提交
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
    },

    /**
     * 绑定上传事件
     */
    bindUploadEvents() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('studentCardInput');
        const preview = document.getElementById('uploadPreview');
        const previewImage = document.getElementById('previewImage');
        const deleteBtn = document.getElementById('deleteImageBtn');

        if (!uploadArea || !fileInput) return;

        // 点击上传
        uploadArea.addEventListener('click', (e) => {
            if (e.target !== fileInput) {
                fileInput.click();
            }
        });

        // 文件选择
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                await this.handleFileSelect(file);
            }
        });

        // 拖拽上传
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', async (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');

            const file = e.dataTransfer.files[0];
            if (file) {
                await this.handleFileSelect(file);
            }
        });

        // 删除图片
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteImage();
            });
        }
    },

    /**
     * 处理文件选择
     * @param {File} file - 文件对象
     */
    async handleFileSelect(file) {
        const errorEl = document.getElementById('studentCardError');
        const uploadArea = document.getElementById('uploadArea');
        const uploadContent = uploadArea.querySelector('.upload-area-content');
        const preview = document.getElementById('uploadPreview');
        const previewImage = document.getElementById('previewImage');
        const fileInput = document.getElementById('studentCardInput');

        // 重置错误
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.classList.remove('show');
        }

        // 校验格式
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            this.showError('studentCardError', '请选择图片文件（JPG/PNG/WebP格式）');
            this.resetFileInput();
            return;
        }

        // 校验大小（5MB）
        if (file.size > 5 * 1024 * 1024) {
            this.showError('studentCardError', '文件大小不能超过5MB');
            this.resetFileInput();
            return;
        }

        try {
            // 转换为Base64
            const base64 = await Utils.fileToBase64(file);
            this.state.fileBase64 = base64;
            this.state.selectedFile = file;

            // 显示预览
            if (uploadContent) uploadContent.style.display = 'none';
            if (preview) preview.classList.add('show');
            if (previewImage) {
                previewImage.src = base64;
            }

            this.updateFormState();
        } catch (err) {
            console.error('文件处理失败:', err);
            this.showError('studentCardError', '图片处理失败，请重试');
            this.resetFileInput();
        }
    },

    /**
     * 删除图片
     */
    deleteImage() {
        this.state.selectedFile = null;
        this.state.fileBase64 = '';

        const uploadArea = document.getElementById('uploadArea');
        const uploadContent = uploadArea.querySelector('.upload-area-content');
        const preview = document.getElementById('uploadPreview');
        const fileInput = document.getElementById('studentCardInput');

        if (uploadContent) uploadContent.style.display = 'flex';
        if (preview) preview.classList.remove('show');
        if (fileInput) fileInput.value = '';

        this.updateFormState();
    },

    /**
     * 重置文件输入
     */
    resetFileInput() {
        const fileInput = document.getElementById('studentCardInput');
        if (fileInput) fileInput.value = '';
    },

    /**
     * 校验学号
     */
    validateStudentId() {
        const studentId = document.getElementById('studentId')?.value || '';
        const result = Utils.validateStudentId(studentId);

        if (!result.valid) {
            this.showError('studentIdError', result.message);
            return false;
        } else {
            this.hideError('studentIdError');
            return true;
        }
    },

    /**
     * 更新表单状态
     */
    updateFormState() {
        const studentId = document.getElementById('studentId')?.value || '';
        const campus = document.querySelector('input[name="campus"]:checked')?.value || '郑州校区';
        const subCampus = document.getElementById('subCampus')?.value || '';
        const college = document.getElementById('college')?.value || '';
        const submitBtn = document.getElementById('submitBtn');

        // 检查必填项
        const isStudentIdValid = Utils.validateStudentId(studentId).valid;
        const isSubCampusValid = campus !== '许昌校区' ? (subCampus !== '') : true;
        const isCollegeValid = college !== '';
        const isFileValid = this.state.selectedFile !== null;

        const allValid = isStudentIdValid && isSubCampusValid && isCollegeValid && isFileValid;

        if (submitBtn) {
            submitBtn.disabled = !allValid;
        }
    },

    /**
     * 显示错误
     */
    showError(elementId, message) {
        const errorEl = document.getElementById(elementId);
        const inputEl = errorEl?.previousElementSibling;

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
        const inputEl = errorEl?.previousElementSibling;

        if (errorEl) {
            errorEl.textContent = '';
            errorEl.classList.remove('show');
        }

        if (inputEl && inputEl.classList) {
            inputEl.classList.remove('error');
        }
    },

    /**
     * 处理表单提交
     */
    handleSubmit() {
        // 再次校验
        const studentId = document.getElementById('studentId')?.value || '';
        const campus = document.querySelector('input[name="campus"]:checked')?.value || '郑州校区';
        const subCampus = document.getElementById('subCampus')?.value || '';
        const college = document.getElementById('college')?.value || '';

        // 学号校验
        const studentIdValid = Utils.validateStudentId(studentId);
        if (!studentIdValid.valid) {
            this.showError('studentIdError', studentIdValid.message);
            return;
        }

        // 子校区校验（郑州校区必填）
        if (campus === '郑州校区' && !subCampus) {
            this.showError('subCampusError', '请选择子校区');
            return;
        }

        // 学院校验
        if (!college) {
            this.showError('collegeError', '请选择所属学院');
            return;
        }

        // 图片校验
        if (!this.state.selectedFile) {
            this.showError('studentCardError', '请上传学生证照片');
            return;
        }

        // 防重复提交
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn.disabled) return;

        submitBtn.disabled = true;
        submitBtn.classList.add('btn-loading');
        submitBtn.textContent = '提交中...';

        // 构建认证信息
        const verifyInfo = {
            studentId: studentId,
            campus: campus,
            subCampus: campus === '郑州校区' ? subCampus : '',
            college: college,
            studentCardImage: this.state.fileBase64,
            submitTime: new Date().toISOString()
        };

        // 提交认证
        setTimeout(() => {
            Auth.submitVerify(verifyInfo);

            Toast.show('认证信息已提交，等待管理员审核', 'success');

            // 更新状态并重新渲染
            setTimeout(() => {
                this.loadState();
                this.render();
                setTimeout(() => this.bindFormEvents(), 100);
            }, 1500);
        }, 500);
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('checkContent')) {
        CheckModule.init();
    }
});
