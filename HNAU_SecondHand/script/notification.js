/**
 * 农大闲置 - 消息通知系统
 * 功能：消息通知存储、显示、红点提示
 * ===========================
 */

const NotificationSystem = {
    // 消息键名
    KEY: 'hnau_notifications',
    
    // 最大保存消息数
    MAX_NOTIFICATIONS: 50,
    
    // 消息类型配置
    types: {
        auth_submit: { icon: '📝', title: '认证申请', color: '#ffc107' },
        auth_approve: { icon: '✅', title: '认证通过', color: '#28a745' },
        auth_reject: { icon: '❌', title: '认证拒绝', color: '#dc3545' },
        system: { icon: '🔔', title: '系统通知', color: '#17a2b8' }
    },
    
    /**
     * 初始化通知系统
     */
    init() {
        // 确保消息数组存在
        const notifications = this.getNotifications();
        if (!Array.isArray(notifications)) {
            this.saveNotifications([]);
        }
        
        // 更新红点显示
        this.updateBadge();
        
        // 监听 storage 变化（跨标签页同步）
        window.addEventListener('storage', (e) => {
            if (e.key === this.KEY) {
                this.updateBadge();
                // 触发自定义事件通知页面更新
                window.dispatchEvent(new CustomEvent('notificationschange'));
            }
        });
        
        console.log('[Notification] 通知系统初始化完成');
    },
    
    /**
     * 获取所有消息
     */
    getNotifications() {
        try {
            const data = localStorage.getItem(this.KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('[Notification] 读取消息失败:', e);
            return [];
        }
    },
    
    /**
     * 保存消息
     */
    saveNotifications(notifications) {
        localStorage.setItem(this.KEY, JSON.stringify(notifications));
    },
    
    /**
     * 添加消息
     * @param {Object} notification - 消息对象
     */
    add(notification) {
        const notifications = this.getNotifications();
        
        const msg = {
            id: Date.now().toString(),
            type: notification.type || 'system',
            title: notification.title || '新通知',
            content: notification.content || '',
            timestamp: new Date().toISOString(),
            read: false,
            // 关联的用户（可选）
            username: notification.username || '',
            // 附加数据（可选）
            data: notification.data || null
        };
        
        // 添加到数组开头
        notifications.unshift(msg);
        
        // 限制最大数量
        if (notifications.length > this.MAX_NOTIFICATIONS) {
            notifications.splice(this.MAX_NOTIFICATIONS);
        }
        
        this.saveNotifications(notifications);
        
        // 更新红点
        this.updateBadge();
        
        // 显示 toast 提示
        Toast.show(msg.title + ': ' + msg.content, 'info', 3000);
        
        // 触发自定义事件
        window.dispatchEvent(new CustomEvent('notificationadd', { detail: msg }));
        
        console.log('[Notification] 新消息:', msg);
        
        return msg;
    },
    
    /**
     * 标记消息为已读
     * @param {string} id - 消息ID
     */
    markAsRead(id) {
        const notifications = this.getNotifications();
        const index = notifications.findIndex(n => n.id === id);
        
        if (index !== -1) {
            notifications[index].read = true;
            this.saveNotifications(notifications);
            this.updateBadge();
            
            window.dispatchEvent(new CustomEvent('notificationread', { detail: { id } }));
        }
    },
    
    /**
     * 标记所有消息为已读
     */
    markAllAsRead() {
        const notifications = this.getNotifications();
        notifications.forEach(n => n.read = true);
        this.saveNotifications(notifications);
        this.updateBadge();
        
        window.dispatchEvent(new CustomEvent('notificationschange'));
    },
    
    /**
     * 删除消息
     * @param {string} id - 消息ID
     */
    delete(id) {
        let notifications = this.getNotifications();
        notifications = notifications.filter(n => n.id !== id);
        this.saveNotifications(notifications);
        this.updateBadge();
    },
    
    /**
     * 清空所有消息
     */
    clearAll() {
        this.saveNotifications([]);
        this.updateBadge();
        window.dispatchEvent(new CustomEvent('notificationschange'));
    },
    
    /**
     * 获取未读消息数量
     */
    getUnreadCount() {
        const notifications = this.getNotifications();
        return notifications.filter(n => !n.read).length;
    },
    
    /**
     * 更新红点显示
     */
    updateBadge() {
        const badge = document.getElementById('notificationBadge');
        const count = this.getUnreadCount();
        
        if (badge) {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    },
    
    /**
     * 获取消息列表（可分页）
     * @param {number} page - 页码
     * @param {number} pageSize - 每页数量
     */
    getList(page = 1, pageSize = 20) {
        const notifications = this.getNotifications();
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        
        return {
            total: notifications.length,
            page,
            pageSize,
            list: notifications.slice(start, end)
        };
    },
    
    // ========== 快捷方法 ==========
    
    /**
     * 用户提交认证后发送通知（发给管理员）
     */
    notifyAuthSubmit(username, studentId) {
        return this.add({
            type: 'auth_submit',
            title: '新认证申请',
            content: `用户 ${username} 提交了认证申请（学号：${studentId}）`,
            data: { username, studentId }
        });
    },
    
    /**
     * 管理员审核通过后发送通知（发给用户）
     */
    notifyAuthApprove(username, studentId) {
        return this.add({
            type: 'auth_approve',
            title: '认证已通过',
            content: `您的校园认证已通过审核，可以发布闲置物品了！`,
            username,
            data: { username, studentId }
        });
    },
    
    /**
     * 管理员拒绝后发送通知（发给用户）
     */
    notifyAuthReject(username, studentId, reason) {
        return this.add({
            type: 'auth_reject',
            title: '认证被拒绝',
            content: reason || `您的校园认证申请被拒绝，请重新提交`,
            username,
            data: { username, studentId }
        });
    },
    
    /**
     * 发送系统通知
     */
    notifySystem(title, content) {
        return this.add({
            type: 'system',
            title,
            content
        });
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    NotificationSystem.init();
});
