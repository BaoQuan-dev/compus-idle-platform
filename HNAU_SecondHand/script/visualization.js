/**
 * 农大闲置 - 数据可视化模块
 * 功能：ECharts图表展示（认证状态饼图、商品发布柱状图等）
 * 依赖：ECharts CDN
 * ===========================
 */

const DataVisualization = {
    // 图表实例存储
    charts: {},
    
    // 配色方案
    colors: {
        light: {
            bg: '#ffffff',
            text: '#495057',
            textSecondary: '#868e96',
            border: '#dee2e6',
            palette: ['#25a649', '#ffc107', '#dc3545', '#17a2b8', '#6f42c1']
        },
        dark: {
            bg: '#1e1e2f',
            text: '#e4e4e7',
            textSecondary: '#a1a1aa',
            border: '#3f3f46',
            palette: ['#4ade80', '#fbbf24', '#f87171', '#38bdf8', '#a78bfa']
        }
    },
    
    /**
     * 获取当前主题配色
     */
    getThemeColors() {
        const theme = localStorage.getItem('hnau_theme') || 'light';
        return this.colors[theme];
    },
    
    /**
     * 加载 ECharts 库
     */
    loadECharts() {
        return new Promise((resolve, reject) => {
            // 检查是否已加载
            if (window.echarts) {
                resolve(window.echarts);
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js';
            script.onload = () => resolve(window.echarts);
            script.onerror = () => {
                console.error('[Chart] ECharts加载失败，尝试备用源');
                // 备用源
                const backup = document.createElement('script');
                backup.src = 'https://unpkg.com/echarts@5.4.3/dist/echarts.min.js';
                backup.onload = () => resolve(window.echarts);
                backup.onerror = () => reject(new Error('ECharts加载失败'));
                document.head.appendChild(backup);
            };
            document.head.appendChild(script);
        });
    },
    
    /**
     * 初始化所有图表
     */
    async init(containerId) {
        try {
            await this.loadECharts();
            
            const container = document.getElementById(containerId);
            if (!container) {
                console.error('[Chart] 找不到图表容器:', containerId);
                return;
            }
            
            // 清空容器
            container.innerHTML = '';
            
            // 创建图表卡片
            container.innerHTML = `
                <div class="chart-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px; padding: 20px;">
                    <div class="chart-card" style="background: var(--card-bg); border-radius: 12px; padding: 20px; box-shadow: var(--shadow);">
                        <h3 style="margin: 0 0 16px 0; font-size: 16px; color: var(--text-primary);">
                            <span style="margin-right: 8px;">📊</span>用户认证状态分布
                        </h3>
                        <div id="chart-auth-pie" style="width: 100%; height: 280px;"></div>
                    </div>
                    <div class="chart-card" style="background: var(--card-bg); border-radius: 12px; padding: 20px; box-shadow: var(--shadow);">
                        <h3 style="margin: 0 0 16px 0; font-size: 16px; color: var(--text-primary);">
                            <span style="margin-right: 8px;">📦</span>商品发布统计
                        </h3>
                        <div id="chart-product-bar" style="width: 100%; height: 280px;"></div>
                    </div>
                    <div class="chart-card" style="background: var(--card-bg); border-radius: 12px; padding: 20px; box-shadow: var(--shadow); grid-column: span 2;">
                        <h3 style="margin: 0 0 16px 0; font-size: 16px; color: var(--text-primary);">
                            <span style="margin-right: 8px;">📈</span>认证申请趋势
                        </h3>
                        <div id="chart-trend-line" style="width: 100%; height: 250px;"></div>
                    </div>
                </div>
            `;
            
            // 初始化各图表
            this.initAuthPieChart();
            this.initProductBarChart();
            this.initTrendLineChart();
            
            // 监听主题变化
            window.addEventListener('themechange', () => {
                this.refreshAllCharts();
            });
            
            console.log('[Chart] 数据可视化模块初始化完成');
            
        } catch (error) {
            console.error('[Chart] 初始化失败:', error);
        }
    },
    
    /**
     * 初始化认证状态饼图
     */
    initAuthPieChart() {
        const dom = document.getElementById('chart-auth-pie');
        if (!dom) return;
        
        // 获取用户数据
        const users = this.getUsers();
        const authStats = {
            unsubmitted: 0,
            pending: 0,
            approved: 0,
            rejected: 0
        };
        
        users.forEach(user => {
            const status = user.authStatus || 'unsubmitted';
            authStats[status]++;
        });
        
        const colors = this.getThemeColors();
        
        const option = {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'item',
                formatter: '{b}: {c}人 ({d}%)'
            },
            legend: {
                orient: 'vertical',
                right: 10,
                top: 'center',
                textStyle: {
                    color: colors.text
                }
            },
            color: [colors.palette[3], colors.palette[1], colors.palette[0], colors.palette[2]],
            series: [{
                name: '认证状态',
                type: 'pie',
                radius: ['40%', '70%'],
                center: ['35%', '50%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 8,
                    borderColor: 'var(--card-bg)',
                    borderWidth: 2
                },
                label: {
                    show: false,
                    position: 'center'
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 16,
                        fontWeight: 'bold',
                        color: colors.text
                    }
                },
                labelLine: {
                    show: false
                },
                data: [
                    { value: authStats.unsubmitted, name: '未提交' },
                    { value: authStats.pending, name: '待审核' },
                    { value: authStats.approved, name: '已认证' },
                    { value: authStats.rejected, name: '已拒绝' }
                ]
            }]
        };
        
        this.charts.authPie = echarts.init(dom);
        this.charts.authPie.setOption(option);
    },
    
    /**
     * 初始化商品发布柱状图
     */
    initProductBarChart() {
        const dom = document.getElementById('chart-product-bar');
        if (!dom) return;
        
        // 获取商品数据
        const products = this.getProducts();
        const colors = this.getThemeColors();
        
        // 按分类统计
        const categoryStats = {};
        products.forEach(product => {
            const category = product.category || '未分类';
            categoryStats[category] = (categoryStats[category] || 0) + 1;
        });
        
        const categories = Object.keys(categoryStats);
        const counts = Object.values(categoryStats);
        
        const option = {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: categories.length ? categories : ['暂无数据'],
                axisLabel: {
                    color: colors.text,
                    rotate: categories.length > 5 ? 30 : 0
                },
                axisLine: { lineStyle: { color: colors.border } }
            },
            yAxis: {
                type: 'value',
                axisLabel: { color: colors.text },
                axisLine: { lineStyle: { color: colors.border } },
                splitLine: { lineStyle: { color: colors.border, opacity: 0.3 } }
            },
            series: [{
                name: '商品数量',
                type: 'bar',
                barWidth: '50%',
                itemStyle: {
                    borderRadius: [8, 8, 0, 0],
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: colors.palette[0] },
                        { offset: 1, color: colors.palette[0] + '80' }
                    ])
                },
                data: counts.length ? counts : [0]
            }]
        };
        
        this.charts.productBar = echarts.init(dom);
        this.charts.productBar.setOption(option);
    },
    
    /**
     * 初始化认证申请趋势图
     */
    initTrendLineChart() {
        const dom = document.getElementById('chart-trend-line');
        if (!dom) return;
        
        // 获取待审核列表数据
        const pendingAuths = this.getPendingAuths();
        const colors = this.getThemeColors();
        
        // 按日期统计
        const dateStats = {};
        pendingAuths.forEach(auth => {
            if (auth.submitTime) {
                const date = auth.submitTime.split('T')[0];
                if (!dateStats[date]) {
                    dateStats[date] = { total: 0, approved: 0, rejected: 0 };
                }
                dateStats[date].total++;
                if (auth.status === 'approved') dateStats[date].approved++;
                if (auth.status === 'rejected') dateStats[date].rejected++;
            }
        });
        
        // 获取最近7天的数据
        const dates = [];
        const totals = [];
        const approved = [];
        const rejected = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            dates.push(dateStr.slice(5)); // MM-DD格式
            
            const stats = dateStats[dateStr] || { total: 0, approved: 0, rejected: 0 };
            totals.push(stats.total);
            approved.push(stats.approved);
            rejected.push(stats.rejected);
        }
        
        const option = {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'axis'
            },
            legend: {
                data: ['提交申请', '已通过', '已拒绝'],
                textStyle: { color: colors.text }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: dates,
                axisLabel: { color: colors.text },
                axisLine: { lineStyle: { color: colors.border } }
            },
            yAxis: {
                type: 'value',
                axisLabel: { color: colors.text },
                axisLine: { lineStyle: { color: colors.border } },
                splitLine: { lineStyle: { color: colors.border, opacity: 0.3 } }
            },
            series: [
                {
                    name: '提交申请',
                    type: 'line',
                    smooth: true,
                    data: totals,
                    lineStyle: { color: colors.palette[0], width: 2 },
                    itemStyle: { color: colors.palette[0] },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: colors.palette[0] + '40' },
                            { offset: 1, color: colors.palette[0] + '00' }
                        ])
                    }
                },
                {
                    name: '已通过',
                    type: 'line',
                    smooth: true,
                    data: approved,
                    lineStyle: { color: colors.palette[0], width: 2 },
                    itemStyle: { color: colors.palette[0] }
                },
                {
                    name: '已拒绝',
                    type: 'line',
                    smooth: true,
                    data: rejected,
                    lineStyle: { color: colors.palette[2], width: 2 },
                    itemStyle: { color: colors.palette[2] }
                }
            ]
        };
        
        this.charts.trendLine = echarts.init(dom);
        this.charts.trendLine.setOption(option);
    },
    
    /**
     * 刷新所有图表
     */
    refreshAllCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.dispose) {
                chart.dispose();
            }
        });
        this.charts = {};
        
        // 重新初始化
        this.initAuthPieChart();
        this.initProductBarChart();
        this.initTrendLineChart();
    },
    
    /**
     * 获取用户列表
     */
    getUsers() {
        try {
            const data = localStorage.getItem('hnau_users');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    },
    
    /**
     * 获取商品列表
     */
    getProducts() {
        try {
            const data = localStorage.getItem('hnau_products');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    },
    
    /**
     * 获取待审核列表
     */
    getPendingAuths() {
        try {
            const data = localStorage.getItem('hnau_pending_auths');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    },
    
    /**
     * 窗口大小变化时重绘图表
     */
    resizeCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.resize) {
                chart.resize();
            }
        });
    }
};

// 监听窗口大小变化
window.addEventListener('resize', () => {
    DataVisualization.resizeCharts();
});
