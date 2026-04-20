/**
 * 碳足迹海报分享模块
 * 功能：生成个人碳足迹分享海报
 */

(function() {
    'use strict';

    // ========== 海报模板配置 ==========
    var POSTER_CONFIG = {
        width: 600,
        height: 800,
        background: '#f0f9f0',
        primaryColor: '#2e7d32',
        accentColor: '#43a047'
    };

    // ========== 海报生成器 ==========
    var CarbonPoster = {
        // 生成海报数据
        generate: function(stats) {
            var canvas = document.createElement('canvas');
            canvas.width = POSTER_CONFIG.width;
            canvas.height = POSTER_CONFIG.height;
            var ctx = canvas.getContext('2d');

            // 背景
            ctx.fillStyle = POSTER_CONFIG.background;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 装饰圆形
            ctx.beginPath();
            ctx.arc(500, 100, 150, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(67, 160, 71, 0.1)';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(100, 700, 100, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(67, 160, 71, 0.08)';
            ctx.fill();

            // 标题
            ctx.fillStyle = POSTER_CONFIG.primaryColor;
            ctx.font = 'bold 36px "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🌍 我的碳足迹报告', 300, 80);

            // 副标题
            ctx.fillStyle = '#666';
            ctx.font = '18px "Microsoft YaHei", sans-serif';
            ctx.fillText('河南农业大学 · 绿色校园闲置平台', 300, 115);

            // 分隔线
            ctx.beginPath();
            ctx.moveTo(100, 145);
            ctx.lineTo(500, 145);
            ctx.strokeStyle = POSTER_CONFIG.accentColor;
            ctx.lineWidth = 2;
            ctx.stroke();

            // 用户信息
            var user = localStorage.getItem('hnau_current_user') || '农大学子';
            ctx.fillStyle = '#333';
            ctx.font = '20px "Microsoft YaHei", sans-serif';
            ctx.fillText('分享自：' + user, 300, 185);

            // 核心数据卡片
            this.drawCard(ctx, 50, 210, 240, 160, '累计减碳', stats.totalSaved.toFixed(1), 'kg CO₂', '#43a047');
            this.drawCard(ctx, 310, 210, 240, 160, '等效种树', stats.treesEquivalent.toFixed(1), '棵', '#66bb6a');

            // 第二行卡片
            this.drawCard(ctx, 50, 390, 150, 130, '碳积分', stats.totalPoints, '分', '#81c784');
            this.drawCard(ctx, 220, 390, 150, 130, '交易次数', stats.tradeCount, '次', '#a5d6a7');
            this.drawCard(ctx, 390, 390, 160, 130, '等级', stats.level.name, '', '#c8e6c9');

            // 环保贡献
            ctx.fillStyle = POSTER_CONFIG.primaryColor;
            ctx.font = 'bold 24px "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🌟 环保贡献', 300, 555);

            ctx.fillStyle = '#fff';
            ctx.fillRect(50, 570, 500, 80);
            ctx.strokeStyle = '#c8e6c9';
            ctx.lineWidth = 1;
            ctx.strokeRect(50, 570, 500, 80);

            ctx.fillStyle = '#666';
            ctx.font = '16px "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('💧 节约用水', 80, 595);
            ctx.fillText('⚡ 节约用电', 280, 595);
            ctx.fillText('🌳 等效减碳', 450, 595);

            ctx.fillStyle = '#2e7d32';
            ctx.font = 'bold 20px "Microsoft YaHei", sans-serif';
            ctx.fillText(stats.waterSaved.toFixed(1) + ' L', 80, 628);
            ctx.fillText(stats.energySaved.toFixed(1) + ' kWh', 280, 628);
            ctx.fillText(stats.totalSaved.toFixed(1) + ' kg', 450, 628);

            // 勋章展示
            if (stats.badges && stats.badges.length > 0) {
                ctx.fillStyle = POSTER_CONFIG.primaryColor;
                ctx.font = 'bold 24px "Microsoft YaHei", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('🏆 我的勋章', 300, 690);

                var badgeTexts = stats.badges.slice(0, 4).map(function(b) {
                    return b.icon + ' ' + b.name;
                }).join('    ');

                ctx.fillStyle = '#666';
                ctx.font = '18px "Microsoft YaHei", sans-serif';
                ctx.fillText(badgeTexts, 300, 725);
            }

            // 底部信息
            ctx.fillStyle = '#999';
            ctx.font = '14px "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('每一笔闲置交易，都是一次环保行动', 300, 760);
            ctx.fillText('🌱 践行双碳目标，共建绿色校园', 300, 782);

            return canvas.toDataURL('image/png');
        },

        // 绘制数据卡片
        drawCard: function(ctx, x, y, w, h, label, value, unit, color) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(x, y, w, h);
            
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(x, y, w, h, 12);
            ctx.stroke();

            ctx.fillStyle = '#666';
            ctx.font = '14px "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(label, x + w/2, y + 30);

            ctx.fillStyle = color;
            ctx.font = 'bold 32px "Microsoft YaHei", sans-serif';
            ctx.fillText(value, x + w/2, y + h/2 + 10);

            if (unit) {
                ctx.fillStyle = '#999';
                ctx.font = '14px "Microsoft YaHei", sans-serif';
                ctx.fillText(unit, x + w/2, y + h - 20);
            }
        },

        // 下载海报
        download: function() {
            var stats = HNAU_Carbon.getStats();
            var dataUrl = this.generate(stats);
            
            var link = document.createElement('a');
            link.download = '我的碳足迹报告_' + new Date().toLocaleDateString() + '.png';
            link.href = dataUrl;
            link.click();

            // 增加分享积分
            HNAU_Carbon.addShare();
        },

        // 显示预览
        preview: function(container) {
            var stats = HNAU_Carbon.getStats();
            var dataUrl = this.generate(stats);
            
            var preview = document.createElement('div');
            preview.className = 'carbon-poster-preview';
            preview.innerHTML = '<img src="' + dataUrl + '" alt="碳足迹海报"><button class="poster-download-btn" onclick="CarbonPoster.download()">保存图片</button>';
            
            container.innerHTML = '';
            container.appendChild(preview);
        }
    };

    // ========== 导出 ==========
    window.CarbonPoster = CarbonPoster;

    console.log('[HNAU Carbon Poster] 海报模块已就绪');
})();
