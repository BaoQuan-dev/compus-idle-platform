# 农大闲置 - 发布权限校验系统

## 一、权限校验流程

```
点击「发布闲置」
    ↓
校验0：是否登录？
    ├─ 否 → 跳转登录页
    └─ 是 → 继续校验1
            ↓
        校验1：认证状态是否为 approved？
            ├─ pending → 提示"等待审核"，跳转个人中心
            ├─ rejected → 提示"重新认证"，跳转认证页
            ├─ unsubmitted → 提示"先认证"，跳转认证页
            └─ approved → 校验通过，进入发布页 ✅
```

## 二、localStorage 数据键名规范

| 键名 | 说明 | 示例值 |
|------|------|--------|
| `hnau_login_state` | 登录状态 | `{isLogin:true, curUser:"张三"}` |
| `hnau_users` | 用户列表 | `[{username:"张三", authStatus:"approved"}]` |
| `hnau_pending_auths` | 待审核认证列表 | `[{studentId:"2021001", status:"pending"}]` |
| `hnau_verify_info` | 认证信息 | `{studentId:"2021001", campus:"东校区"}` |
| `hnau_verify_state` | 认证状态 | `"pending"` |

## 三、认证状态枚举

| 状态值 | 说明 | 用户看到的文案 |
|--------|------|---------------|
| `unsubmitted` | 未提交 | 未认证 |
| `pending` | 待审核 | 审核中 |
| `approved` | 已认证 | 已认证 ✅ |
| `rejected` | 已拒绝 | 认证被拒绝 |

## 四、Coze 低代码平台配置

### 4.1 发布按钮事件配置

在「发布闲置」按钮的 **点击事件** 中添加以下逻辑：

#### 方法一：使用公式（推荐）

```javascript
// 1. 获取登录状态
const loginState = STORAGE.get('hnau_login_state') || {};

// 2. 校验0：是否登录
if (!loginState.isLogin || !loginState.curUser) {
  // 跳转登录页
  PAGE.navigate('user_login.html');
  return;
}

// 3. 获取用户认证状态
const users = STORAGE.get('hnau_users') || [];
const user = users.find(u => u.username === loginState.curUser);
const authStatus = user?.authStatus || 'unsubmitted';

// 4. 校验1：认证状态
if (authStatus === 'approved') {
  // 校验通过，跳转发布页
  PAGE.navigate('publish.html');
} else if (authStatus === 'pending') {
  TOAST.show('您的认证正在审核中，请等待审核通过');
  PAGE.navigate('user_center.html');
} else {
  TOAST.show('请先完成校园认证');
  PAGE.navigate('stu_check.html');
}
```

#### 方法二：复用 common.js 工具函数

```javascript
// 直接调用预置的权限校验函数
Auth.requireReleasePermission(() => {
  PAGE.navigate('publish.html');
});
```

---

### 4.2 登录成功后的回调配置

在「登录」按钮点击事件中，登录成功后添加：

```javascript
// 登录成功后，刷新当前页面以更新状态
PAGE.reload();
```

---

### 4.3 认证提交成功后的状态同步

在「提交认证」按钮点击事件中，认证成功后添加：

```javascript
// 1. 保存认证申请
const pendingList = STORAGE.get('hnau_pending_auths') || [];
pendingList.push({
  id: Date.now().toString(),
  studentId: INPUT.studentId,
  campus: SELECT.campus,
  college: SELECT.college,
  status: 'pending',
  submitTime: new Date().toISOString()
});
STORAGE.set('hnau_pending_auths', pendingList);

// 2. 同步更新用户的认证状态
const loginState = STORAGE.get('hnau_login_state');
const users = STORAGE.get('hnau_users') || [];
const userIndex = users.findIndex(u => u.username === loginState.curUser);
if (userIndex !== -1) {
  users[userIndex].authStatus = 'pending';
  STORAGE.set('hnau_users', users);
}

// 3. 提示并跳转
TOAST.show('认证申请已提交，请等待管理员审核');
PAGE.navigate('user_center.html');
```

---

### 4.4 管理员审核通过后的状态同步

在「通过」按钮点击事件中，审核通过后添加：

```javascript
// 1. 获取当前审核的学号
const studentId = EVENT.target.dataset.studentId;

// 2. 更新 pending_auths 中的状态
const pendingList = STORAGE.get('hnau_pending_auths') || [];
const index = pendingList.findIndex(a => a.studentId === studentId && a.status === 'pending');
if (index !== -1) {
  pendingList[index].status = 'approved';
  pendingList[index].updateTime = new Date().toISOString();
  STORAGE.set('hnau_pending_auths', pendingList);

  // 3. 根据学号找到用户并更新其认证状态
  const users = STORAGE.get('hnau_users') || [];
  // 假设学号存储在用户的 studentId 字段中
  const userIndex = users.findIndex(u => u.studentId === studentId);
  if (userIndex !== -1) {
    users[userIndex].authStatus = 'approved';
    STORAGE.set('hnau_users', users);
  }
}

// 4. 刷新列表
PAGE.reload();
```

---

### 4.5 管理员拒绝认证后的状态同步

在「拒绝」按钮点击事件中：

```javascript
// 1. 获取学号
const studentId = EVENT.target.dataset.studentId;

// 2. 更新 pending_auths 状态
const pendingList = STORAGE.get('hnau_pending_auths') || [];
const index = pendingList.findIndex(a => a.studentId === studentId && a.status === 'pending');
if (index !== -1) {
  pendingList[index].status = 'rejected';
  STORAGE.set('hnau_pending_auths', pendingList);

  // 3. 更新用户认证状态
  const users = STORAGE.get('hnau_users') || [];
  const userIndex = users.findIndex(u => u.studentId === studentId);
  if (userIndex !== -1) {
    users[userIndex].authStatus = 'rejected';
    STORAGE.set('hnau_users', users);
  }
}

PAGE.reload();
```

---

## 五、页面跳转映射

| 从页面 | 到页面 | 条件 |
|--------|--------|------|
| 任意页面点击「发布闲置」 | user_login.html | 未登录 |
| 登录成功后 | stu_check.html | 未提交认证 |
| 提交认证后 | user_center.html | 提交成功 |
| 发布按钮 | user_center.html | 认证待审核 |
| 发布按钮 | stu_check.html | 未认证/认证被拒 |
| 发布按钮 | publish.html | 已认证 ✅ |

## 六、测试用例

### 测试场景 1：未登录用户点击发布
```
操作：点击「发布闲置」
预期：弹出提示"请先登录后再发布商品"，跳转登录页
```

### 测试场景 2：已登录但未提交认证
```
操作：登录后点击「发布闲置」
预期：弹出提示"发布商品需先完成校园认证"，跳转认证页
```

### 测试场景 3：认证待审核状态
```
操作：提交认证后（管理员未审核）点击「发布闲置」
预期：弹出提示"您的认证正在审核中，请等待审核通过"，跳转个人中心
```

### 测试场景 4：认证被拒绝
```
操作：管理员拒绝后点击「发布闲置」
预期：弹出提示"您的认证申请被拒绝，请重新提交认证信息"，跳转认证页
```

### 测试场景 5：认证通过
```
操作：管理员审核通过后点击「发布闲置」
预期：正常跳转发布页 ✅
```

## 七、状态一致性检查清单

- [ ] 注册用户时，user 数据包含 `authStatus: 'unsubmitted'`
- [ ] 提交认证时，更新 `pending_auths` 和用户的 `authStatus: 'pending'`
- [ ] 管理员通过时，更新 `pending_auths.status` 和用户的 `authStatus: 'approved'`
- [ ] 管理员拒绝时，更新 `pending_auths.status` 和用户的 `authStatus: 'rejected'`
- [ ] 发布按钮校验时，优先读取用户数据的 `authStatus`
