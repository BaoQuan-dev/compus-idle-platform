/**
 * 农大闲置平台 - 碳足迹核心模块
 * 功能：碳排放计算、积分管理、数据存储
 * 作者：HNAU Dev Team
 * 版本：v1.0
 */

(function() {
    'use strict';

    // ========== 命名空间 ==========
    window.HNAU_Carbon = window.HNAU_Carbon || {};

    // ========== 农大专属碳排放系数表 ==========
    // 基于《中国生命周期数据库CLCD》及高校场景定制
    var CARBON_COEFFICIENTS = {
        // 教材类（kg CO₂/本）
        textbooks: {
            name: '教材类',
            emission: 2.5,        // 印刷、运输总排放
            saved: 8.0,           // 相比购买新书节约
            examples: ['专业教材', '考研资料', '参考书']
        },
        // 电子设备类（kg CO₂/件）
        electronics: {
            name: '电子设备',
            emission: 25.0,       // 生产环节碳排放
            saved: 45.0,          // 延长使用寿命节约
            examples: ['计算器', '耳机', '充电宝', '台灯']
        },
        // 生活用品类（kg CO₂/件）
        dailyGoods: {
            name: '生活用品',
            emission: 5.0,
            saved: 12.0,
            examples: ['水壶', '收纳盒', '衣架', '床上用品']
        },
        // 运动器材类（kg CO₂/件）
        sports: {
            name: '运动器材',
            emission: 8.0,
            saved: 18.0,
            examples: ['篮球', '羽毛球拍', '瑜伽垫', '自行车']
        },
        // 实验器材类（kg CO₂/件）- 农大特色
        labEquipment: {
            name: '实验器材',
            emission: 15.0,
            saved: 30.0,
            examples: ['烧杯', '试管架', '移液管', '培养皿']
        },
        // 服装鞋帽类（kg CO₂/件）
        clothing: {
            name: '服装鞋帽',
            emission: 20.0,
            saved: 35.0,
            examples: ['棉衣', '运动鞋', '书包', '正装']
        },
        // 其他类（kg CO₂/件）
        others: {
            name: '其他',
            emission: 3.0,
            saved: 6.0,
            examples: ['日用品', '装饰品', '文具']
        }
    };

    // ========== 碳排放计算引擎 ==========
    var CarbonCalculator = {
        // 获取品类系数
        getCoefficient: function(category) {
            return CARBON_COEFFICIENTS[category] || CARBON_COEFFICIENTS.others;
        },

        // 计算单笔交易的碳减排量
        calculateSavings: function(category, condition) {
            var coef = this.getCoefficient(category);
            var baseSaved = coef.saved;

            // 根据新旧程度调整
            var conditionMultiplier = {
                '全新': 1.0,
                '几乎全新': 0.95,
                '轻微使用': 0.85,
                '正常使用': 0.75,
                '明显使用痕迹': 0.6
            };

            var multiplier = conditionMultiplier[condition] || 0.8;
            return {
                saved: parseFloat((baseSaved * multiplier).toFixed(2)),
                emission: coef.emission,
                category: coef.name,
                treesEquivalent: parseFloat((baseSaved * multiplier / 6.6).toFixed(2)) // 一棵成年树每年吸收约6.6kg CO₂
            };
        },

        // 计算累计减排
        calculateTotalSavings: function(transactions) {
            var total = 0;
            var byCategory = {};
            var treesCount = 0;

            transactions.forEach(function(t) {
                var result = this.calculateSavings(t.category, t.condition);
                total += result.saved;
                treesCount += result.treesEquivalent;

                if (!byCategory[t.category]) {
                    byCategory[t.category] = 0;
                }
                byCategory[t.category] += result.saved;
            }.bind(this));

            return {
                totalSaved: parseFloat(total.toFixed(2)),
                treesEquivalent: parseFloat(treesCount.toFixed(2)),
                byCategory: byCategory,
                waterSaved: parseFloat((total * 2.5).toFixed(2)),      // 节约用水估算
                energySaved: parseFloat((total * 1.8).toFixed(2))       // 节约用电估算
            };
        },

        // 获取年度趋势数据
        getYearlyTrend: function(transactions, year) {
            var monthlyData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

            transactions.forEach(function(t) {
                if (t.year === year) {
                    monthlyData[t.month - 1] += this.calculateSavings(t.category, t.condition).saved;
                }
            }.bind(this));

            return monthlyData.map(function(v) { return parseFloat(v.toFixed(2)); });
        }
    };

    // ========== 碳积分系统 ==========
    var CarbonPoints = {
        // 积分规则
        RULES: {
            perKgSaved: 10,           // 每节省1kg CO₂ = 10积分
            shareBonus: 50,            // 分享一次 = 50积分
            dailyCheckIn: 5,          // 每日签到 = 5积分
            publishGoods: 20,          // 发布闲置 = 20积分
            successfulTrade: 100,     // 成交一笔 = 100积分
            reachMilestone: [500, 1000, 5000, 10000]  // 里程碑奖励
        },

        // 计算积分
        calculatePoints: function(carbonSaved) {
            return Math.floor(carbonSaved * this.RULES.perKgSaved);
        },

        // 获取等级
        getLevel: function(totalPoints) {
            var levels = [
                { min: 0, name: '环保新手', icon: 'seedling', color: '#90EE90' },
                { min: 100, name: '低碳践行者', icon: 'leaf', color: '#32CD32' },
                { min: 500, name: '绿色传播者', icon: 'tree', color: '#228B22' },
                { min: 2000, name: '循环先锋', icon: 'recycle', color: '#006400' },
                { min: 5000, name: '碳中和大使', icon: 'award', color: '#FFD700' },
                { min: 10000, name: '零碳达人', icon: 'star', color: '#FF69B4' }
            ];

            for (var i = levels.length - 1; i >= 0; i--) {
                if (totalPoints >= levels[i].min) {
                    return levels[i];
                }
            }
            return levels[0];
        },

        // 获取勋章
        getBadges: function(stats) {
            var badges = [];

            // 交易次数勋章
            if (stats.tradeCount >= 1) badges.push({
                id: 'first_trade',
                name: '首单达成',
                icon: '🎯',
                desc: '完成首次交易'
            });

            if (stats.tradeCount >= 10) badges.push({
                id: 'trade_master',
                name: '交易达人',
                icon: '🛒',
                desc: '完成10次交易'
            });

            // 碳减排勋章
            if (stats.totalSaved >= 50) badges.push({
                id: 'carbon_saver_50',
                name: '减碳50kg',
                icon: '🌱',
                desc: '累计减碳50kg'
            });

            if (stats.totalSaved >= 200) badges.push({
                id: 'carbon_saver_200',
                name: '减碳达人',
                icon: '🌿',
                desc: '累计减碳200kg'
            });

            if (stats.totalSaved >= 500) badges.push({
                id: 'carbon_master',
                name: '减碳大师',
                icon: '🌳',
                desc: '累计减碳500kg'
            });

            // 等效种树勋章
            if (stats.treesEquivalent >= 1) badges.push({
                id: 'first_tree',
                name: '种下希望',
                icon: '🌰',
                desc: '等效种下第1棵树'
            });

            if (stats.treesEquivalent >= 10) badges.push({
                id: 'tree_grower',
                name: '护林使者',
                icon: '🌲',
                desc: '等效种下10棵树'
            });

            // 活跃勋章
            if (stats.publishCount >= 5) badges.push({
                id: 'active_publisher',
                name: '发布先锋',
                icon: '📦',
                desc: '发布5件闲置'
            });

            // 环保科普勋章
            if (stats.aiReportCount >= 1) badges.push({
                id: 'eco_learner',
                name: '环保学员',
                icon: '📚',
                desc: '获取首份环保报告'
            });

            return badges;
        }
    };

    // ========== 数据存储管理 ==========
    var CarbonStorage = {
        STORAGE_KEY: 'hnau_carbon_data',
        _listeners: [],
        _lastDataHash: '',        // 【新增】上次数据哈希
        _pollInterval: null,      // 【新增】轮询定时器
        _pollDelay: 2000,         // 【新增】轮询间隔（毫秒）

        // 获取当前用户名（兼容Auth模块）
        getCurrentUser: function() {
            // 优先使用Auth模块的当前用户
            var loginState = JSON.parse(localStorage.getItem('hnau_login_state') || '{}');
            if (loginState.curUser) {
                return loginState.curUser;
            }
            // 兼容旧版本
            return localStorage.getItem('hnau_current_user') || 'guest';
        },

        // 【新增】获取当前数据哈希（用于变化检测）
        getDataHash: function() {
            var user = this.getCurrentUser();
            var allData = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
            var userData = allData[user] || this.initUserData();
            return JSON.stringify(userData);
        },

        // 【新增】启动轮询检测数据变化
        startPolling: function() {
            var self = this;
            // 初始化哈希
            this._lastDataHash = this.getDataHash();
            // 清除之前的定时器
            if (this._pollInterval) {
                clearInterval(this._pollInterval);
            }
            // 启动轮询
            this._pollInterval = setInterval(function() {
                var currentHash = self.getDataHash();
                if (currentHash !== self._lastDataHash) {
                    self._lastDataHash = currentHash;
                    self._notifyListeners();
                    console.log('[Carbon] 检测到数据变化，通知监听器');
                }
            }, this._pollDelay);
            console.log('[Carbon] 轮询已启动，间隔', this._pollDelay, 'ms');
        },

        // 【新增】停止轮询
        stopPolling: function() {
            if (this._pollInterval) {
                clearInterval(this._pollInterval);
                this._pollInterval = null;
                console.log('[Carbon] 轮询已停止');
            }
        },

        // 获取用户碳数据
        getData: function() {
            var user = this.getCurrentUser();
            var allData = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
            return allData[user] || this.initUserData();
        },

        // 初始化用户数据
        initUserData: function() {
            return {
                joinDate: new Date().toISOString().split('T')[0],
                totalSaved: 0,           // 总减碳量(kg)
                totalPoints: 0,          // 总积分
                tradeCount: 0,           // 交易次数
                publishCount: 0,         // 发布次数
                shareCount: 0,           // 分享次数
                aiReportCount: 0,        // AI报告获取次数
                transactions: [],         // 交易记录
                yearlyTrend: {},         // 年度趋势
                badges: [],              // 已获得勋章
                lastCheckIn: null        // 最后签到日期
            };
        },

        // 保存用户数据
        saveData: function(data) {
            var user = this.getCurrentUser();
            var allData = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
            allData[user] = data;
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allData));
            
            // 【新增】通知所有监听器
            this._notifyListeners();
        },

        // 【新增】添加数据变更监听器
        addChangeListener: function(callback) {
            if (typeof callback === 'function' && this._listeners.indexOf(callback) === -1) {
                this._listeners.push(callback);
            }
        },

        // 【新增】移除数据变更监听器
        removeChangeListener: function(callback) {
            var index = this._listeners.indexOf(callback);
            if (index > -1) {
                this._listeners.splice(index, 1);
            }
        },

        // 【新增】通知所有监听器
        _notifyListeners: function() {
            var stats = this.getStats();
            this._listeners.forEach(function(callback) {
                try {
                    callback(stats);
                } catch (e) {
                    console.error('[Carbon] 监听器执行失败:', e);
                }
            });
        },

        // 【新增】初始化跨标签页/跨设备同步
        initSync: function() {
            // 【修复】防止重复初始化
            if (this._initialized) {
                console.log('[Carbon] 同步已初始化，跳过');
                return;
            }
            this._initialized = true;
            
            var self = this;
            
            // 1. 监听 storage 事件（同一浏览器跨标签页同步）
            this._storageListener = function(e) {
                if (e.key === self.STORAGE_KEY) {
                    // 数据发生变化，通知监听器
                    self._lastDataHash = self.getDataHash(); // 更新哈希避免重复触发
                    self._notifyListeners();
                    console.log('[Carbon] storage事件触发，通知监听器');
                }
            };
            window.addEventListener('storage', this._storageListener);
            
            // 2. 启动轮询（跨设备同步，间隔2秒）
            this.startPolling();
            
            // 3. 监听页面可见性变化（当用户从后台切换回来时强制刷新）
            this._visibilityHandler = function() {
                if (!document.hidden) {
                    // 页面从后台切换回来，强制更新哈希并通知监听器
                    console.log('[Carbon] 页面恢复可见，强制刷新数据');
                    self._lastDataHash = self.getDataHash();
                    self._notifyListeners();
                }
            };
            document.addEventListener('visibilitychange', this._visibilityHandler);
            
            console.log('[Carbon] 数据同步已启用（storage事件 + 轮询 + 可见性监听）');
        },

        // 【新增】清理跨标签页同步
        destroySync: function() {
            if (this._storageListener) {
                window.removeEventListener('storage', this._storageListener);
                this._storageListener = null;
            }
            this.stopPolling();  // 【新增】停止轮询
            if (this._visibilityHandler) {
                document.removeEventListener('visibilitychange', this._visibilityHandler);
                this._visibilityHandler = null;
            }
            this._listeners = [];
            this._initialized = false;  // 【新增】重置初始化状态
        },

        // 添加交易记录
        addTransaction: function(category, condition, title) {
            var data = this.getData();
            var result = CarbonCalculator.calculateSavings(category, condition);

            var transaction = {
                id: Date.now(),
                category: category,
                condition: condition,
                title: title,
                saved: result.saved,
                treesEquivalent: result.treesEquivalent,
                date: new Date().toISOString().split('T')[0],
                year: new Date().getFullYear(),
                month: new Date().getMonth() + 1
            };

            data.transactions.push(transaction);
            data.totalSaved += result.saved;
            data.totalPoints += CarbonPoints.calculatePoints(result.saved) + CarbonPoints.RULES.successfulTrade;
            data.tradeCount++;

            // 更新年度趋势
            var year = new Date().getFullYear().toString();
            if (!data.yearlyTrend[year]) {
                data.yearlyTrend[year] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            }
            data.yearlyTrend[year][new Date().getMonth()] += result.saved;

            // 检查勋章
            data.badges = CarbonPoints.getBadges(data);

            this.saveData(data);
            return data;
        },

        // 记录发布商品（增加积分和减碳记录）
        addPublish: function(category, condition, title) {
            var data = this.getData();
            
            // 计算碳足迹（使用默认品类）
            var coef = CARBON_COEFFICIENTS[category] || CARBON_COEFFICIENTS.others;
            var result = CarbonCalculator.calculateSavings(category || 'others', condition || '正常使用');
            
            // 创建交易记录
            var transaction = {
                id: Date.now(),
                type: 'publish',
                category: category || 'others',
                condition: condition || '正常使用',
                title: title || '发布闲置物品',
                saved: result.saved,
                treesEquivalent: result.treesEquivalent,
                date: new Date().toISOString().split('T')[0],
                year: new Date().getFullYear(),
                month: new Date().getMonth() + 1
            };
            
            data.transactions.push(transaction);
            data.totalSaved += result.saved;
            data.totalPoints += CarbonPoints.RULES.publishGoods;
            data.publishCount++;
            data.tradeCount++;
            
            // 更新年度趋势
            var year = new Date().getFullYear().toString();
            var month = (new Date().getMonth() + 1).toString();
            if (!data.yearlyTrend[year]) data.yearlyTrend[year] = {};
            if (!data.yearlyTrend[year][month]) data.yearlyTrend[year][month] = 0;
            data.yearlyTrend[year][month] += result.saved;
            
            // 勋章已在上面第453行通过 CarbonPoints.getBadges(data) 设置
            // 【删除】this.checkBadges(data);  // checkBadges 方法不存在！
            
            this.saveData(data);
            return data;
        },

        // 添加分享记录
        addShare: function() {
            var data = this.getData();
            data.shareCount++;
            data.totalPoints += CarbonPoints.RULES.shareBonus;
            this.saveData(data);
            return data;
        },

        // 记录AI报告
        addAIReport: function() {
            var data = this.getData();
            data.aiReportCount++;
            this.saveData(data);
            return data;
        },

        // 每日签到
        checkIn: function() {
            var data = this.getData();
            var today = new Date().toISOString().split('T')[0];

            if (data.lastCheckIn === today) {
                return { success: false, message: '今日已签到' };
            }

            data.lastCheckIn = today;
            data.totalPoints += CarbonPoints.RULES.dailyCheckIn;
            this.saveData(data);
            return { success: true, points: CarbonPoints.RULES.dailyCheckIn };
        },

        // 获取统计数据
        getStats: function() {
            var data = this.getData();
            var level = CarbonPoints.getLevel(data.totalPoints);

            return {
                totalSaved: data.totalSaved,
                totalPoints: data.totalPoints,
                treesEquivalent: parseFloat((data.totalSaved / 6.6).toFixed(2)),
                waterSaved: parseFloat((data.totalSaved * 2.5).toFixed(2)),
                energySaved: parseFloat((data.totalSaved * 1.8).toFixed(2)),
                tradeCount: data.tradeCount,
                publishCount: data.publishCount,
                shareCount: data.shareCount,
                level: level,
                badges: data.badges,
                yearlyTrend: data.yearlyTrend,
                transactions: data.transactions.slice(-10).reverse() // 最近10条
            };
        },

        // 清除用户数据（测试用）
        clearData: function() {
            var user = this.getCurrentUser();
            var allData = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
            delete allData[user];
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allData));
        },

        // 【修复】空的checkBadges函数，防止报错
        checkBadges: function() {
            return [];
        }
    };

    // ========== 导出模块 ==========
    HNAU_Carbon.COEFFICIENTS = CARBON_COEFFICIENTS;
    HNAU_Carbon.Calculator = CarbonCalculator;
    HNAU_Carbon.Points = CarbonPoints;
    HNAU_Carbon.Storage = CarbonStorage;
    HNAU_Carbon.getStats = function() { return CarbonStorage.getStats(); };
    HNAU_Carbon.addTransaction = function(c, cdt, t) { return CarbonStorage.addTransaction(c, cdt, t); };
    HNAU_Carbon.addPublish = function(cat, cdt, title) { return CarbonStorage.addPublish(cat, cdt, title); };
    HNAU_Carbon.addShare = function() { return CarbonStorage.addShare(); };
    HNAU_Carbon.checkIn = function() { return CarbonStorage.checkIn(); };
    HNAU_Carbon.addAIReport = function() { return CarbonStorage.addAIReport(); };
    // 【新增】跨标签页同步相关方法
    HNAU_Carbon.addChangeListener = function(cb) { CarbonStorage.addChangeListener(cb); };
    HNAU_Carbon.removeChangeListener = function(cb) { CarbonStorage.removeChangeListener(cb); };
    HNAU_Carbon.initSync = function() { CarbonStorage.initSync(); };
    HNAU_Carbon.destroySync = function() { CarbonStorage.destroySync(); };
    // 【兼容】空函数，防止旧缓存代码报错
    HNAU_Carbon.checkBadges = function() { return []; };

    console.log('[HNAU Carbon] 碳足迹模块已就绪');
})();
