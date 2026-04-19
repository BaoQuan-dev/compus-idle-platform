/**
 * 农大闲置 - Toast 提示组件
 * 功能：轻量级消息提示
 * ===========================
 */

const Toast = {
    /**
     * 显示提示
     * @param {string} message - 提示内容
     * @param {string} type - 类型：success/error/info/warning
     * @param {number} duration - 显示时长(ms)
     */
    show(message, type = 'info', duration = 2000) {
        // 移除已存在的toast
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) {
            existingToast.remove();
        }
        
        // 创建toast元素
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        
        // 图标映射
        const icons = {
            success: '✅',
            error: '❌',
            info: '💡',
            warning: '⚠️'
        };
        
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
        `;
        
        // 添加样式
        this.injectStyles();
        
        // 添加到body
        document.body.appendChild(toast);
        
        // 触发动画
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
        
        // 自动移除
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },
    
    /**
     * 注入样式
     */
    injectStyles() {
        if (document.getElementById('toast-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'toast-styles';
        styles.textContent = `
            .toast-notification {
                position: fixed;
                left: 50%;
                bottom: 100px;
                transform: translateX(-50%) translateY(20px);
                background: var(--card-bg, #ffffff);
                color: var(--text-primary, #212529);
                padding: 14px 24px;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.15);
                display: flex;
                align-items: center;
                gap: 10px;
                z-index: 9999;
                opacity: 0;
                transition: all 0.3s ease;
                max-width: 90%;
                font-size: 14px;
            }
            
            .toast-notification.show {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
            
            .toast-icon {
                font-size: 18px;
            }
            
            .toast-message {
                flex: 1;
            }
            
            .toast-success {
                border-left: 4px solid #28a745;
            }
            
            .toast-error {
                border-left: 4px solid #dc3545;
            }
            
            .toast-info {
                border-left: 4px solid #17a2b8;
            }
            
            .toast-warning {
                border-left: 4px solid #ffc107;
            }
        `;
        document.head.appendChild(styles);
    }
};
