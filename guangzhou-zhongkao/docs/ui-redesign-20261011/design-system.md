# 广州中考志愿助手 UI 设计系统（2026-10-11）

> 专家：UI Designer（像素君）｜版本：v1  
> 目标：让家长能直接分辨“什么能点、点后去哪里、当前在哪一步、下一步在哪、怎样返回”。

---

## 1. 设计原则

1. **单一主操作**：任何任务当前步骤只有一个主 CTA，文案用“动词 + 结果”。
2. **先状态、后动作**：页面先让家长知道当前在哪一步、数据是否有效，再呈现操作按钮。
3. **返回明确**：区分“返回上一页”和“返回首页”，返回按钮使用一致样式与位置。
4. **触控优先**：所有交互目标满足最小触控尺寸，手指操作不失误。
5. **信息不伪装入口**：说明文字、数据卡片、统计数字不使用按钮色、箭头、hover 浮起模拟可点击。

---

## 2. 色彩系统

| Token | 色值 | 用途 |
|---|---|---|
| `--c-navy` | `#15283d` | 品牌色、主按钮、标题、当前步骤、激活状态 |
| `--c-navy-strong` | `#0f2032` | hover/按下状态 |
| `--c-orange` | `#cb571e` | 主要操作强调、目标校入口、当前选中 tab、风险提示 |
| `--c-orange-soft` | `#fff5ed` | 目标校/重点入口卡背景 |
| `--c-muted` | `#57677a` | 辅助说明、占位文字 |
| `--c-line` | `#dce2e7` | 边框、分隔线 |
| `--c-soft` | `#f4f6f7` | 卡片背景、信息区背景 |
| `--c-danger` | `#943c3c` | 危险操作（清空、移除） |
| `--c-risk-bg` | `#fff4dd` | 风险提示背景 |
| `--c-paper` | `#ffffff` | 页面背景 |

---

## 3. 字体层级

全站只使用三种字号，层级通过字重与颜色区分。

| 层级 | 字号 | 字重 | 行高 | 用途 |
|---|---|---|---|---|
| 标题 | 24px | 700 | 1.35 | 页面 H1、panel 标题、卡片标题 |
| 正文 | 16px | 400/700 | 1.6 | 正文、标签、按钮文字 |
| 备注 | 14px | 400 | 1.5 | 辅助说明、脚注、标签 chips |

小程序映射：24px → 48rpx，16px → 32rpx，14px → 28rpx。

---

## 4. 按钮规范

### 4.1 主按钮（Primary CTA）

```css
.btn-primary {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  min-height: 48px;
  padding: 12px 24px;
  background: var(--c-navy);
  color: #fff;
  border: 1px solid var(--c-navy);
  border-radius: 10px;
  font-size: 16px;
  font-weight: 700;
  text-decoration: none;
}
.btn-primary:hover { background: var(--c-navy-strong); }
.btn-primary:focus-visible { outline: 3px solid #6686a0; outline-offset: 3px; }
.btn-primary:disabled { opacity: .55; cursor: not-allowed; }
```

文案规则：
- 生成志愿草案
- 确认志愿，查看评估
- 保存方案
- 分析目标学校
- 查看学校

### 4.2 次按钮（Secondary）

```css
.btn-secondary {
  min-height: 44px;
  padding: 10px 18px;
  background: #fff;
  color: var(--c-navy);
  border: 1px solid var(--c-line);
  border-radius: 10px;
  font-size: 16px;
  font-weight: 500;
}
```

文案规则：
- 返回修改分数
- 返回调整志愿
- 重新选择学校
- 清除筛选

### 4.3 危险按钮

```css
.btn-danger {
  min-height: 44px;
  padding: 10px 18px;
  background: #fff;
  color: var(--c-danger);
  border: 1px solid var(--c-danger);
  border-radius: 10px;
}
```

### 4.4 链接按钮 / 普通跳转

```css
.link-action {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: var(--c-navy);
  text-decoration: underline;
  text-underline-offset: 4px;
  font-size: 16px;
}
```

普通链接必须带动作词（查看、进入、返回），不能只靠颜色或细小箭头表达可点。

---

## 5. 首页入口卡

### 5.1 四种入口卡（UI-01）

手机：2×2 网格；极窄屏或 200% 放大时转单列。
电脑：桌面 4 列横排。

每张卡是**同一个 `<a>` 标签包裹整卡**，标题、说明、空白、箭头点击都到同一正确功能。卡内不再嵌套另一可交互按钮。

```html
<a class="entry-card" href="/verify/?new=1">
  <span class="entry-card-icon">…</span>
  <strong class="entry-card-title">我只有大概分数</strong>
  <span class="entry-card-desc">生成第三、第四批志愿草案</span>
  <span class="entry-card-arrow" aria-hidden="true">→</span>
</a>
```

### 5.2 状态：继续上次方案

当 `localStorage` 存在未保存/已保存方案时，首页首屏下方显示：

```html
<div class="continue-banner">
  <span>上次做到：排列志愿（3/6 个志愿已填）</span>
  <a class="btn-secondary" href="/verify/?resume=1#volunteerForm">继续上次方案</a>
</div>
```

### 5.3 批次资料卡

- 第一批：特长 / 自主招生两个入口用明确的次按钮。
- 第二批：一个入口按钮。
- 第三四批：大卡突出主按钮。

说明文字与按钮分组，避免同一卡片内出现两个同级可点击元素。

---

## 6. 三步工作区组件（UI-02）

### 6.1 步骤栏

固定显示：1 填写条件 → 2 排列志愿 → 3 看评估。

```html
<nav class="stepper" aria-label="志愿工作进度">
  <ol>
    <li class="step-done"><a href="#profile">1 填写条件</a></li>
    <li class="step-current" aria-current="step">2 排列志愿</li>
    <li class="step-locked" title="需先完成志愿表">3 看评估</li>
  </ol>
</nav>
```

样式：
- 已完成：数字圆圈 + 深蓝文字 + 下划线链接“返回修改”。
- 当前：实心深蓝数字 + 深蓝文字加粗。
- 未解锁：灰底数字 + 灰色文字，不可点；hover 显示 tooltip“需先完成…”。

### 6.2 每步主操作

| 步骤 | 左侧次操作 | 右侧主要操作 |
|---|---|---|
| 1 条件/估分 | ← 返回首页 | 生成志愿草案 |
| 2 排列志愿 | ← 返回修改条件 | 确认志愿，查看评估 |
| 3 评估 | ← 返回调整志愿 | 保存方案 |

手机：在可用视口底部固定操作栏；为内容预留高度，避开原生 tabBar 与软键盘。
电脑：在工作区底部保持同样顺序。

### 6.3 加载/空结果/错误反馈

- 主按钮 loading：文字变为“生成中…”，禁用，显示 spinner。
- 校验错误：字段红边框 + 错误文案；第一个错误字段自动滚动到视口并聚焦。
- 空结果：显示空状态插图/文字 + “返回修改条件”按钮。

---

## 7. 学校结果卡（UI-04）

```html
<article class="school-card">
  <a class="school-card-main" href="/schools/detail/?id=xxx">
    <h3>学校名称</h3>
    <p>地址 / 录取记录摘要</p>
  </a>
  <div class="school-card-actions">
    <button class="btn-icon" aria-pressed="false" aria-label="收藏">☆</button>
    <button class="btn-icon" aria-pressed="false" aria-label="对比">⇄</button>
    <button class="btn-secondary" aria-label="加入志愿">加入志愿</button>
  </div>
</article>
```

规则：
- 主资料区进入学校档案。
- 收藏、对比、加入意向为独立按钮，点击互不串动作。
- 不使用覆盖全卡的透明链接吞掉按钮。
- 每个操作按钮最小 44×44px，相邻间隔 ≥8px。

---

## 8. 折叠说明与选项

### 8.1 折叠说明

整行标题可点击，带明确“展开/收起”图标。

```html
<details class="disclosure">
  <summary>
    <span>补充资格与偏好</span>
    <span class="disclosure-hint">按需填写</span>
    <span class="disclosure-icon" aria-hidden="true">▾</span>
  </summary>
  …
</details>
```

summary 内不使用 `<b>`、按钮色或箭头伪装入口。

### 8.2 选项与复选框

整个标签行可点击，选中标记明显。

```html
<label class="choice-row">
  <input type="checkbox" />
  <span><strong>未被第一批录取</strong><small>第一批录取后不会再参加后续批次投档</small></span>
</label>
```

操作选项与资料标签外观不同：选项使用完整标签行，资料标签使用 chip。

---

## 9. 触控与响应式目标

| 元素 | 最小高度 | 最小宽度 | 相邻间隔 |
|---|---|---|---|
| 主按钮 | 48px | — | ≥8px |
| 次/危险按钮 | 44px | — | ≥8px |
| 图标按钮 | 44px | 44px | ≥8px |
| 表单输入 | 44px | — | ≥12px |
| 卡片链接/行 | 44px | — | — |
| 移动端侧边距 | — | — | 16px |

正文行高：1.6。页面最大宽度 1240px，居中。

### 响应式断点

| 断点 | 布局调整 |
|---|---|
| ≥1024px | 电脑布局，三/四列网格 |
| 768–1023px | 平板，两列网格 |
| ≤767px | 手机单列，底部固定操作栏 |
| ≤360px 或 200% 放大 | 单列，按钮全宽 |

---

## 10. 返回导航规则

| 场景 | 组件 | 去向 |
|---|---|---|
| 子页回首页 | 顶部/底部“← 返回助手首页” | `/` |
| 子页回上一任务 | 顶部/底部“← 返回上一页” | `history.back()` 或保留上下文 |
| verify 第 2 步回第 1 步 | 次按钮“← 返回修改条件” | `#profile` |
| verify 第 3 步回第 2 步 | 次按钮“← 返回调整志愿” | `#volunteerForm` |
| 学校详情从 verify 进入 | 顶部按钮“← 返回当前志愿表/评估” | `/verify/?resume=1#volunteerForm` 或 `#analysis` |
| 学校详情从学校库进入 | 顶部按钮“← 返回学校列表” | `/schools/`（保留筛选） |

---

## 11. 可访问性要求

- 颜色对比度：正文与背景 ≥4.5:1；大文字 ≥3:1。
- 焦点状态：所有可交互元素有可见焦点环（`outline: 3px solid #6686a0; outline-offset: 3px`）。
- 键盘：Tab 顺序符合视觉顺序；Enter/Space 按语义触发按钮/链接。
- 屏幕阅读器：按钮文案独立表达含义；当前步骤使用 `aria-current="step"`。
- 减少动态：不依赖 hover 作为唯一点击提示。

---

## 12. 小程序适配

- 小程序以现有原生 `tabBar` 为唯一底部全局导航。
- H5 内嵌页不再叠加底部导航栏。
- H5 页面顶部返回与小程序原生返回一致：区分“返回上一页”和“返回首页”。
- 触控目标按 rpx 映射：48px=96rpx，44px=88rpx，16px=32rpx。
