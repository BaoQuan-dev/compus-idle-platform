/**
 * 农大闲置 - 主题管理模块
 * 功能：深色/浅色主题切换，localStorage记忆
 * ===========================
 */

const ThemeManager = {
    // 主题键名
    KEY: 'hnau_theme',
    
    // 主题配置
    themes: {
        light: {
            name: '浅色模式',
            icon: '🌞',
            // CSS 变量
            '--bg-primary': '#ffffff',
            '--bg-secondary': '#f8f9fa',
            '--bg-light': '#f1f3f5',
            '--text-primary': '#212529',
            '--text-secondary': '#495057',
            '--text-hint': '#868e96',
            '--border-color': '#dee2e6',
            '--shadow': '0 2px 8px rgba(0,0,0,0.1)',
            '--card-bg': '#ffffff',
            '--nav-bg': '#25a649',
            '--hover-bg': '#f8f9fa',
        },
        dark: {
            name: '深色模式',
            icon: '🌙',
            // CSS 变量
            '--bg-primary': '#1a1a2e',
            '--bg-secondary': '#16213e',
            '--bg-light': '#0f3460',
            '--text-primary': '#e4e4e7',
            '--text-secondary': '#a1a1aa',
            '--text-hint': '#71717a',
            '--border-color': '#3f3f46',
            '--shadow': '0 2px 8px rgba(0,0,0,0.3)',
            '--card-bg': '#1e1e2f',
            '--nav-bg': '#1e7b34',
            '--hover-bg': '#272638',
        }
    },
    
    /**
     * 初始化主题
     */
    init() {
        // 读取保存的主题
        const savedTheme = localStorage.getItem(this.KEY) || 'light';
        this.applyTheme(savedTheme);
        
        // 监听系统主题变化
        this.watchSystemTheme();
        
        console.log('[Theme] 主题初始化完成:', savedTheme);
    },
    
    /**
     * 获取当前主题
     */
    getCurrentTheme() {
        return localStorage.getItem(this.KEY) || 'light';
    },
    
    /**
     * 切换主题
     */
    toggle() {
        const current = this.getCurrentTheme();
        const newTheme = current === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        
        Toast.show(`已切换到${this.themes[newTheme].name}`, 'success', 1500);
        
        // 触发自定义事件，供其他模块监听
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: newTheme } }));
        
        return newTheme;
    },
    
    /**
     * 应用主题
     * @param {string} themeName - 主题名称
     */
    applyTheme(themeName) {
        const theme = this.themes[themeName];
        if (!theme) {
            console.warn('[Theme] 未知主题:', themeName);
            return;
        }
        
        // 保存到 localStorage
        localStorage.setItem(this.KEY, themeName);
        
        // 应用 CSS 变量
        const root = document.documentElement;
        for (const [key, value] of Object.entries(theme)) {
            if (key.startsWith('--')) {
                root.style.setProperty(key, value);
            }
        }
        
        // 更新切换按钮图标
        this.updateToggleButton(themeName);
        
        // 添加过渡动画
        document.body.classList.add('theme-transition');
        setTimeout(() => {
            document.body.classList.remove('theme-transition');
        }, 300);
    },
    
    /**
     * 更新切换按钮图标
     */
    updateToggleButton(themeName) {
        const btn = document.getElementById('themeToggleBtn');
        if (btn) {
            btn.textContent = this.themes[themeName].icon;
            btn.title = `切换到${this.themes[themeName === 'light' ? 'dark' : 'light'].name}`;
        }
    },
    
    /**
     * 监听系统主题变化
     */
    watchSystemTheme() {
        // 首次检测
        if (!localStorage.getItem(this.KEY)) {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                this.applyTheme('dark');
            }
        }
        
        // 监听系统主题变化
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            // 只有用户没有手动设置过主题时才跟随系统
            if (!localStorage.getItem(this.KEY)) {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
};

// 主题切换按钮的点击事件处理
document.addEventListener('DOMContentLoaded', () => {
    // 等待按钮渲染后再绑定
    setTimeout(() => {
        const btn = document.getElementById('themeToggleBtn');
        if (btn) {
            // 初始化按钮状态
            const currentTheme = ThemeManager.getCurrentTheme();
            btn.textContent = ThemeManager.themes[currentTheme].icon;
            btn.title = `切换到${ThemeManager.themes[currentTheme === 'light' ? 'dark' : 'light'].name}`;
            
            // 绑定点击事件
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                ThemeManager.toggle();
            });
        }
    }, 100);
});
