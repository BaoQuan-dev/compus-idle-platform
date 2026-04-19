# 农大闲置 - 用户数据隔离方案（修复版）

## 一、问题根因

**问题**：认证状态存在全局变量 `hnau_verify_state`，导致所有用户共用同一个状态。

**后果**：
- 用户A认证通过后，所有用户都显示"已认证"
- 用户B提交认证，用户A的个人中心显示"待审核"
- 不同用户之间状态互相串扰

## 二、修复方案

### 2.1 核心原则

**认证状态必须绑定到用户数据中**，每个用户独立存储自己的认证状态：

```
hnau_users (用户列表)
├── user1: { username: "张三", authStatus: "approved" }
├── user2: { username: "李四", authStatus: "pending" }
└── user3: { username: "王五", authStatus: "unsubmitted" }
```

### 2.2 localStorage 键名规范

| 键名 | 用途 | 数据结构 |
|------|------|----------|
| `hnau_users` | 用户列表 | `[{username, password, authStatus, studentId, ...}]` |
| `hnau_login_state` | 当前登录 | `{isLogin, curUser}` |
| `hnau_pending_auths` | 待审核列表 | `[{id, studentId, status, ...}]` |
| `hnau_verify_info` | 认证信息（可选） | `{studentId, campus, ...}` |

**重要**：不再使用 `hnau_verify_state` 全局状态！

## 三、Coze 配置代码

### 3.1 发布按钮点击事件

```javascript
// ========== 发布权限校验（数据隔离版）==========

// 1. 获取登录状态
const loginState = STORAGE.get('hnau_login_state') || {};

// 2. 校验0：是否登录
if (!loginState.isLogin || !loginState.curUser) {
  TOAST.show('请先登录后再发布商品');
  PAGE.navigate('user_login.html');
  return;
}

// 3. 【关键】只从当前用户数据中读取认证状态
const users = STORAGE.get('hnau_users') || [];
const currentUser = users.find(u => u.username === loginState.curUser);
const authStatus = currentUser?.authStatus || 'unsubmitted';

console.log('当前用户:', loginState.curUser, '| 认证状态:', authStatus);

// 4. 校验1：认证状态
if (authStatus === 'approved') {
  PAGE.navigate('publish.html');  // 通过，跳转发布页
} else if (authStatus === 'pending') {
  TOAST.show('您的认证正在审核中，请等待审核通过');
  PAGE.navigate('user_center.html');
} else if (authStatus === 'rejected') {
  TOAST.show('您的认证申请被拒绝，请重新提交');
  PAGE.navigate('stu_check.html');
} else {
  TOAST.show('请先完成校园认证');
  PAGE.navigate('stu_check.html');
}
```

### 3.2 注册按钮点击事件

```javascript
// ========== 注册逻辑（数据隔离版）==========

const username = INPUT.regUsername;
const password = INPUT.regPassword;
const confirmPassword = INPUT.regConfirmPassword;

// 1. 表单验证
if (!username || !password) {
  TOAST.show('请填写用户名和密码', 'error');
  return;
}
if (password !== confirmPassword) {
  TOAST.show('两次密码输入不一致', 'error');
  return;
}

// 2. 检查用户名是否已存在
const users = STORAGE.get('hnau_users') || [];
if (users.find(u => u.username === username)) {
  TOAST.show('该用户名已被注册', 'error');
  return;
}

// 3. 【关键】创建用户 - authStatus 独立存储
const newUser = {
  username: username,
  password: password,
  regTime: new Date().toISOString(),
  authStatus: 'unsubmitted',  // 每个用户独立状态
  studentId: '',
  campus: '',
  college: ''
};

users.push(newUser);
STORAGE.set('hnau_users', users);

// 4. 自动登录
STORAGE.set('hnau_login_state', { isLogin: true, curUser: username });

TOAST.show('注册成功！', 'success');
PAGE.navigate('user_center.html');
```

### 3.3 提交认证按钮点击事件

```javascript
// ========== 提交认证逻辑（数据隔离版）==========

const studentId = INPUT.studentId;
const campus = SELECT.campus;
const college = SELECT.college;
const studentCard = INPUT.studentCardImage;

if (!studentId || !campus || !college || !studentCard) {
  TOAST.show('请填写完整的认证信息', 'error');
  return;
}

// 1. 获取当前登录用户
const loginState = STORAGE.get('hnau_login_state');
if (!loginState?.curUser) {
  TOAST.show('请先登录', 'error');
  PAGE.navigate('user_login.html');
  return;
}

// 2. 添加到待审核列表
const pendingList = STORAGE.get('hnau_pending_auths') || [];
pendingList.push({
  id: Date.now().toString(),
  studentId: studentId,
  campus: campus,
  college: college,
  studentCardImage: studentCard,
  username: loginState.curUser,  // 关联用户名
  submitTime: new Date().toISOString(),
  status: 'pending'
});
STORAGE.set('hnau_pending_auths', pendingList);

// 3. 【关键】只更新当前用户的认证状态
const users = STORAGE.get('hnau_users') || [];
const userIndex = users.findIndex(u => u.username === loginState.curUser);
if (userIndex !== -1) {
  users[userIndex].authStatus = 'pending';  // 只更新当前用户
  users[userIndex].studentId = studentId;
  users[userIndex].campus = campus;
  users[userIndex].college = college;
  STORAGE.set('hnau_users', users);
}

TOAST.show('认证申请已提交，请等待管理员审核', 'success');
PAGE.navigate('user_center.html');
```

### 3.4 管理员「通过」按钮点击事件

```javascript
// ========== 管理员通过认证（数据隔离版）==========

const authId = EVENT.target.dataset.id;
const studentId = EVENT.target.dataset.studentid;

// 1. 更新待审核列表
const pendingList = STORAGE.get('hnau_pending_auths') || [];
const pendingIndex = pendingList.findIndex(a => a.id === authId);
if (pendingIndex !== -1) {
  pendingList[pendingIndex].status = 'approved';
  pendingList[pendingIndex].updateTime = new Date().toISOString();
  STORAGE.set('hnau_pending_auths', pendingList);
}

// 2. 【关键】只更新对应用户的认证状态（通过学号匹配）
const users = STORAGE.get('hnau_users') || [];
const userIndex = users.findIndex(u => u.studentId === studentId);
if (userIndex !== -1) {
  users[userIndex].authStatus = 'approved';
  STORAGE.set('hnau_users', users);
  console.log('用户状态已更新:', users[userIndex].username, '-> approved');
}

TOAST.show('认证已通过', 'success');
PAGE.reload();
```

### 3.5 管理员「拒绝」按钮点击事件

```javascript
// ========== 管理员拒绝认证（数据隔离版）==========

const authId = EVENT.target.dataset.id;
const studentId = EVENT.target.dataset.studentid;

// 1. 更新待审核列表
const pendingList = STORAGE.get('hnau_pending_auths') || [];
const pendingIndex = pendingList.findIndex(a => a.id === authId);
if (pendingIndex !== -1) {
  pendingList[pendingIndex].status = 'rejected';
  pendingList[pendingIndex].updateTime = new Date().toISOString();
  STORAGE.set('hnau_pending_auths', pendingList);
}

// 2. 【关键】只更新对应用户的认证状态
const users = STORAGE.get('hnau_users') || [];
const userIndex = users.findIndex(u => u.studentId === studentId);
if (userIndex !== -1) {
  users[userIndex].authStatus = 'rejected';
  STORAGE.set('hnau_users', users);
}

TOAST.show('认证已拒绝', 'success');
PAGE.reload();
```

### 3.6 个人中心 - 获取认证状态

```javascript
// ========== 个人中心数据加载（数据隔离版）==========

// 1. 获取登录状态
const loginState = STORAGE.get('hnau_login_state') || {};

// 2. 【关键】只从当前用户数据中读取认证状态
const users = STORAGE.get('hnau_users') || [];
const currentUser = users.find(u => u.username === loginState.curUser);
const verifyState = currentUser?.authStatus || 'unsubmitted';

// 3. 渲染状态文案
const statusMap = {
  'unsubmitted': { text: '未提交', class: 'pending', icon: '📝' },
  'pending': { text: '待审核', class: 'pending', icon: '⏳' },
  'approved': { text: '已认证', class: 'approved', icon: '✅' },
  'rejected': { text: '已拒绝', class: 'rejected', icon: '❌' }
};

TEXT.verifyStatusText = statusMap[verifyState]?.text || '未提交';
TEXT.verifyStatusIcon = statusMap[verifyState]?.icon || '📝';
```

## 四、数据隔离验证

### 4.1 测试场景

| 用户 | 操作 | 预期结果 |
|------|------|----------|
| 张三 | 注册 | authStatus = 'unsubmitted' |
| 张三 | 登录 | 显示"未提交" |
| 李四 | 注册 | authStatus = 'unsubmitted'（独立） |
| 张三 | 提交认证 | 张三 authStatus = 'pending' |
| 李四 | 查看个人中心 | 仍显示"未提交"（不受影响） |
| 张三 | 管理员审核通过 | 张三 authStatus = 'approved' |
| 李四 | 查看个人中心 | 仍显示"未提交"（不受影响） |
| 李四 | 提交认证 | 李四 authStatus = 'pending' |
| 王五 | 注册 | authStatus = 'unsubmitted'（独立） |

### 4.2 验证命令

在浏览器控制台执行：

```javascript
// 查看所有用户状态
console.log('所有用户:', JSON.parse(localStorage.getItem('hnau_users')));

// 查看待审核列表
console.log('待审核:', JSON.parse(localStorage.getItem('hnau_pending_auths')));

// 验证数据隔离
const users = JSON.parse(localStorage.getItem('hnau_users'));
const currentUser = users.find(u => u.username === '当前用户名');
console.log('当前用户状态:', currentUser?.authStatus);
```

## 五、常见错误修复

### 错误1：使用全局状态
```javascript
// ❌ 错误 - 使用全局状态
const verifyState = STORAGE.get('hnau_verify_state');

// ✅ 正确 - 从用户数据读取
const users = STORAGE.get('hnau_users') || [];
const currentUser = users.find(u => u.username === loginState.curUser);
const verifyState = currentUser?.authStatus || 'unsubmitted';
```

### 错误2：批量更新所有用户状态
```javascript
// ❌ 错误 - 更新所有待审核用户
users.forEach(user => {
  if (user.authStatus === 'pending') {
    user.authStatus = 'approved';
  }
});

// ✅ 正确 - 只更新对应用户
const userIndex = users.findIndex(u => u.studentId === studentId);
if (userIndex !== -1) {
  users[userIndex].authStatus = 'approved';
}
```

### 错误3：使用 || 作为备选导致状态被覆盖
```javascript
// ❌ 错误 - 用全局状态覆盖用户状态
const authStatus = user.authStatus || STORAGE.get('hnau_verify_state');

// ✅ 正确 - 直接使用用户状态
const authStatus = user?.authStatus || 'unsubmitted';
```
