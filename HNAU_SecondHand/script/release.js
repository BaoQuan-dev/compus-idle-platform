/**
 * ============================================
 * 河南农业大学·农大闲置 - 商品发布页逻辑
 * 功能：权限拦截/表单/上传/存储
 * ============================================
 */

// 商品分类数据
const GOODS_CATEGORIES = [
    { value: '农业书籍', label: '农业书籍' },
    { value: '实验器材', label: '实验器材' },
    { value: '教材资料', label: '教材资料' },
    { value: '宿舍用品', label: '宿舍用品' },
    { value: '数码电子', label: '数码电子' },
    { value: '生活日化', label: '生活日化' },
    { value: '体育用品', label: '体育用品' },
    { value: '其他', label: '其他' }
];

// 校区数据
const CAMPUS_DATA = [
    { value: '郑州龙子湖', label: '郑州龙子湖' },
    { value: '郑州文化路', label: '郑州文化路' },
    { value: '郑州桃李园', label: '郑州桃李园' },
    { value: '许昌', label: '许昌' }
];

const ReleaseModule = {
    // 状态
    state: {
        permissionChecked: false,
        permissionPassed: false,
        images: [], // Base64数组
        isSubmitting: false
    },

    /**
     * 初始化
     */
    init() {
        // 执行权限校验
        const result = Auth.checkReleasePermission();

        if (!result.passed) {
            // 显示提示并跳转
            Toast.show(result.message, result.type, result.type === 'error' ? 0 : 1500);

            setTimeout(() => {
                if (result.tab) {
                    Utils.跳转(result.redirect, result.tab, result.prefillUser);
                } else {
                    Utils.跳转(result.redirect);
                }
            }, result.type === 'error' ? 1000 : 1500);

            // 显示禁止访问提示
            this.showAccessDenied(result.message);
            return;
        }

        // 权限通过
        this.state.permissionChecked = true;
        this.state.permissionPassed = true;
        this.render();
        this.bindEvents();
    },

    /**
     * 显示禁止访问提示
     */
    showAccessDenied(message) {
        const container = document.getElementById('releaseContent');
        if (!container) return;

        container.innerHTML = `
            <div class="card">
                <div class="status-card">
                    <div class="status-card-icon" style="color: var(--error-color);">🔒</div>
                    <h2 class="status-card-title">暂无访问权限</h2>
                    <p class="status-card-text">${message}</p>
                    <a href="home.html" class="btn btn-primary">返回首页</a>
                </div>
            </div>
        `;
    },

    /**
     * 渲染页面
     */
    render() {
        const container = document.getElementById('releaseContent');
        if (!container) return;

        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">📦 发布闲置商品</h2>
                </div>
                <form id="releaseForm" class="release-form">
                    <!-- 商品名称 -->
                    <div class="form-group">
                        <label class="form-label required">商品名称</label>
                        <input type="text" id="goodsName" class="form-input" 
                               placeholder="请输入商品名称（最多50字）" 
                               maxlength="50"
                               autocomplete="off">
                        <p class="form-error" id="goodsNameError"></p>
                    </div>

                    <!-- 商品价格 -->
                    <div class="form-group">
                        <label class="form-label required">价格（元）</label>
                        <input type="text" id="goodsPrice" class="form-input" 
                               placeholder="请输入商品价格"
                               autocomplete="off">
                        <p class="form-error" id="goodsPriceError"></p>
                    </div>

                    <!-- 商品分类 -->
                    <div class="form-group">
                        <label class="form-label required">商品分类</label>
                        <select id="goodsCategory" class="form-select">
                            <option value="">请选择商品分类</option>
                            ${GOODS_CATEGORIES.map(cat => 
                                `<option value="${cat.value}">${cat.label}</option>`
                            ).join('')}
                        </select>
                        <p class="form-error" id="goodsCategoryError"></p>
                    </div>

                    <!-- 校区 -->
                    <div class="form-group">
                        <label class="form-label required">所在校区</label>
                        <select id="goodsCampus" class="form-select">
                            <option value="">请选择校区</option>
                            ${CAMPUS_DATA.map(campus => 
                                `<option value="${campus.value}">${campus.label}</option>`
                            ).join('')}
                        </select>
                        <p class="form-error" id="goodsCampusError"></p>
                    </div>

                    <!-- 交易地点 -->
                    <div class="form-group">
                        <label class="form-label required">交易地点</label>
                        <input type="text" id="tradeLocation" class="form-input" 
                               placeholder="请输入交易地点（如：图书馆门口、学生宿舍楼等）"
                               maxlength="100"
                               autocomplete="off">
                        <p class="form-error" id="tradeLocationError"></p>
                    </div>

                    <!-- 微信号 -->
                    <div class="form-group">
                        <label class="form-label required">微信号</label>
                        <input type="text" id="wechatId" class="form-input" 
                               placeholder="请输入您的微信号（方便买家联系）"
                               maxlength="20"
                               autocomplete="off">
                        <p class="form-error" id="wechatIdError"></p>
                    </div>

                    <!-- 商品简介 -->
                    <div class="form-group">
                        <label class="form-label">商品简介</label>
                        <textarea id="goodsDesc" class="form-textarea" 
                                  placeholder="请输入商品简介（可选），描述商品的新旧程度、使用情况等信息"
                                  maxlength="500"></textarea>
                        <p class="form-help">最多500字</p>
                    </div>

                    <!-- 商品图片 -->
                    <div class="form-group">
                        <label class="form-label">商品图片（选填，最多3张，单张最大10MB）</label>
                        <div class="upload-multi-area" id="uploadMultiArea">
                            <div class="upload-add-btn" id="addImageBtn">
                                <span class="upload-add-btn-icon">➕</span>
                                <span class="upload-add-btn-text">添加图片</span>
                            </div>
                        </div>
                        <input type="file" id="imageInput" accept="image/jpeg,image/png,image/webp" style="display: none;">
                        <p class="form-error" id="goodsImageError"></p>
                    </div>

                    <!-- 提交按钮 -->
                    <button type="submit" class="btn btn-primary btn-lg btn-block" id="submitBtn" disabled>
                        发布商品
                    </button>
                </form>
            </div>
        `;
    },

    /**
     * 绑定事件
     */
    bindEvents() {
        // 商品名称输入
        const goodsName = document.getElementById('goodsName');
        if (goodsName) {
            goodsName.addEventListener('input', () => {
                this.updateSubmitBtnState();
            });

            goodsName.addEventListener('blur', () => {
                this.validateGoodsName();
            });
        }

        // 价格输入（仅允许数字和小数点）
        const goodsPrice = document.getElementById('goodsPrice');
        if (goodsPrice) {
            goodsPrice.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9.]/g, '');
                // 仅保留一个小数点
                const parts = e.target.value.split('.');
                if (parts.length > 2) {
                    e.target.value = parts[0] + '.' + parts.slice(1).join('');
                }
                this.updateSubmitBtnState();
            });

            goodsPrice.addEventListener('blur', () => {
                this.validateGoodsPrice();
            });
        }

        // 分类选择
        const goodsCategory = document.getElementById('goodsCategory');
        if (goodsCategory) {
            goodsCategory.addEventListener('change', () => {
                this.updateSubmitBtnState();
            });
        }

        // 校区选择
        const goodsCampus = document.getElementById('goodsCampus');
        if (goodsCampus) {
            goodsCampus.addEventListener('change', () => {
                this.updateSubmitBtnState();
            });
        }

        // 交易地点输入
        const tradeLocation = document.getElementById('tradeLocation');
        if (tradeLocation) {
            tradeLocation.addEventListener('input', () => {
                this.updateSubmitBtnState();
            });

            tradeLocation.addEventListener('blur', () => {
                this.validateTradeLocation();
            });
        }

        // 微信号输入
        const wechatId = document.getElementById('wechatId');
        if (wechatId) {
            wechatId.addEventListener('input', () => {
                this.updateSubmitBtnState();
            });

            wechatId.addEventListener('blur', () => {
                this.validateWechatId();
            });
        }

        // 图片上传
        this.bindImageEvents();

        // 表单提交
        const form = document.getElementById('releaseForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubmit();
            });
        }
    },

    /**
     * 绑定图片上传事件
     */
    bindImageEvents() {
        const addBtn = document.getElementById('addImageBtn');
        const imageInput = document.getElementById('imageInput');

        if (addBtn && imageInput) {
            addBtn.addEventListener('click', () => {
                if (this.state.images.length >= 3) {
                    Toast.show('最多只能上传3张图片', 'warning');
                    return;
                }
                imageInput.click();
            });

            imageInput.addEventListener('change', async (e) => {
                const files = e.target.files;
                if (files.length > 0) {
                    await this.handleImagesSelect(files);
                }
            });
        }
    },

    /**
     * 处理图片选择
     * @param {FileList} files - 文件列表
     */
    async handleImagesSelect(files) {
        const errorEl = document.getElementById('goodsImageError');
        const remaining = 3 - this.state.images.length;

        if (remaining <= 0) {
            Toast.show('最多只能上传3张图片', 'warning');
            return;
        }

        // 处理每个文件
        for (let i = 0; i < Math.min(files.length, remaining); i++) {
            const file = files[i];

            // 校验格式
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                Toast.show('请选择图片文件（JPG/PNG/WebP格式）', 'error');
                continue;
            }

            // 校验大小（10MB）
            if (file.size > 10 * 1024 * 1024) {
                Toast.show('图片大小不能超过10MB', 'error');
                continue;
            }

            try {
                const base64 = await Utils.fileToBase64(file);
                this.state.images.push(base64);
            } catch (err) {
                console.error('图片处理失败:', err);
                Toast.show('图片处理失败，请重试', 'error');
            }
        }

        this.renderImages();
        this.updateSubmitBtnState();

        // 清空input
        const imageInput = document.getElementById('imageInput');
        if (imageInput) imageInput.value = '';
    },

    /**
     * 渲染图片列表
     */
    renderImages() {
        const container = document.getElementById('uploadMultiArea');
        if (!container) return;

        // 清除现有图片
        container.innerHTML = '';

        // 渲染已上传图片
        this.state.images.forEach((img, index) => {
            const item = document.createElement('div');
            item.className = 'upload-multi-item';
            item.innerHTML = `
                <img src="${img}" alt="商品图片${index + 1}">
                <button type="button" class="upload-multi-delete" data-index="${index}">×</button>
            `;
            container.appendChild(item);

            // 删除按钮
            const deleteBtn = item.querySelector('.upload-multi-delete');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteImage(index);
            });
        });

        // 添加按钮
        if (this.state.images.length < 3) {
            const addBtn = document.createElement('div');
            addBtn.className = 'upload-add-btn';
            addBtn.id = 'addImageBtn';
            addBtn.innerHTML = `
                <span class="upload-add-btn-icon">➕</span>
                <span class="upload-add-btn-text">添加图片</span>
            `;
            container.appendChild(addBtn);

            // 重新绑定添加事件
            const imageInput = document.getElementById('imageInput');
            if (imageInput) {
                addBtn.addEventListener('click', () => {
                    imageInput.click();
                });
            }
        }
    },

    /**
     * 删除图片
     * @param {number} index - 图片索引
     */
    deleteImage(index) {
        this.state.images.splice(index, 1);
        this.renderImages();
        this.updateSubmitBtnState();
    },

    /**
     * 更新提交按钮状态
     */
    updateSubmitBtnState() {
        const goodsName = document.getElementById('goodsName')?.value || '';
        const goodsPrice = document.getElementById('goodsPrice')?.value || '';
        const goodsCategory = document.getElementById('goodsCategory')?.value || '';
        const goodsCampus = document.getElementById('goodsCampus')?.value || '';
        const tradeLocation = document.getElementById('tradeLocation')?.value || '';
        const wechatId = document.getElementById('wechatId')?.value || '';
        const submitBtn = document.getElementById('submitBtn');

        const isValid = 
            goodsName.trim() !== '' &&
            goodsPrice.trim() !== '' &&
            goodsCategory !== '' &&
            goodsCampus !== '' &&
            tradeLocation.trim() !== '' &&
            wechatId.trim() !== '';

        if (submitBtn) {
            submitBtn.disabled = !isValid;
        }
    },

    /**
     * 校验商品名称
     */
    validateGoodsName() {
        const goodsName = document.getElementById('goodsName')?.value || '';

        if (goodsName.trim() === '') {
            this.showError('goodsNameError', '商品名称不能为空');
            return false;
        }

        this.hideError('goodsNameError');
        return true;
    },

    /**
     * 校验商品价格
     */
    validateGoodsPrice() {
        const goodsPrice = document.getElementById('goodsPrice')?.value || '';
        const result = Utils.validatePrice(goodsPrice);

        if (!result.valid) {
            this.showError('goodsPriceError', result.message);
            return false;
        }

        this.hideError('goodsPriceError');
        return true;
    },

    /**
     * 校验交易地点
     */
    validateTradeLocation() {
        const tradeLocation = document.getElementById('tradeLocation')?.value || '';

        if (tradeLocation.trim() === '') {
            this.showError('tradeLocationError', '交易地点不能为空');
            return false;
        }

        this.hideError('tradeLocationError');
        return true;
    },

    /**
     * 校验微信号
     */
    validateWechatId() {
        const wechatId = document.getElementById('wechatId')?.value || '';
        const result = Utils.validateWechat(wechatId);

        if (!result.valid) {
            this.showError('wechatIdError', result.message);
            return false;
        }

        this.hideError('wechatIdError');
        return true;
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
        if (this.state.isSubmitting) return;

        // 获取表单数据
        const goodsName = document.getElementById('goodsName')?.value || '';
        const goodsPrice = document.getElementById('goodsPrice')?.value || '';
        const goodsCategory = document.getElementById('goodsCategory')?.value || '';
        const goodsCampus = document.getElementById('goodsCampus')?.value || '';
        const tradeLocation = document.getElementById('tradeLocation')?.value || '';
        const wechatId = document.getElementById('wechatId')?.value || '';
        const goodsDesc = document.getElementById('goodsDesc')?.value || '';
        const submitBtn = document.getElementById('submitBtn');

        // 校验
        if (!this.validateGoodsName()) return;
        if (!this.validateGoodsPrice()) return;

        const categorySelect = document.getElementById('goodsCategory');
        if (categorySelect && !categorySelect.value) {
            this.showError('goodsCategoryError', '请选择商品分类');
            return;
        }

        const campusSelect = document.getElementById('goodsCampus');
        if (campusSelect && !campusSelect.value) {
            this.showError('goodsCampusError', '请选择所在校区');
            return;
        }

        if (!this.validateTradeLocation()) return;
        if (!this.validateWechatId()) return;

        // 防重复提交
        this.state.isSubmitting = true;
        submitBtn.disabled = true;
        submitBtn.classList.add('btn-loading');
        submitBtn.textContent = '发布中...';

        // 构建商品数据
        const loginState = Auth.getLoginState();
        const goodsInfo = {
            id: Utils.generateId(),
            publisher: loginState.curUser,
            name: goodsName.trim(),
            price: parseFloat(goodsPrice),
            category: goodsCategory,
            campus: goodsCampus,
            tradeLocation: tradeLocation.trim(),
            wechatId: wechatId.trim(),
            description: goodsDesc.trim(),
            images: this.state.images,
            publishTime: Utils.formatDate(new Date()),
            status: 'active'
        };

        // 模拟网络延迟
        setTimeout(() => {
            // 保存商品
            const goods = Auth.getGoods();
            goods.unshift(goodsInfo);
            const saveSuccess = Storage.set(Auth.KEYS.GOODS, goods);
            
            // 【修复】检查存储是否成功
            if (!saveSuccess) {
                // 存储失败，恢复按钮状态
                this.state.isSubmitting = false;
                submitBtn.disabled = false;
                submitBtn.classList.remove('btn-loading');
                submitBtn.textContent = '发布商品';
                return;  // 停止后续操作
            }

            // 记录碳足迹（发布商品奖励）
            if (window.HNAU_Carbon) {
                // 记录碳足迹数据（使用品类和默认新旧程度）
                HNAU_Carbon.addPublish(goodsCategory, '正常使用', goodsName.trim());
            }

            Toast.show('商品发布成功！即将跳转到首页', 'success');

            // 1.5秒后跳转
            setTimeout(() => {
                Utils.跳转('home.html');
            }, 1500);

        }, 500);
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('releaseContent')) {
        ReleaseModule.init();
    }
});
