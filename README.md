# Fieldstone Studio · Intake Tracker

静态原型。通过 GitHub Pages 发布，入口需要访问密码。

## 发布前配置

1. 仓库 **Settings → Secrets and variables → Actions** 新增 Secret：
   - Name: `SITE_PASSWORD`
   - Value: 你的访问密码（不要写进代码或 PR）
2. **Settings → Pages → Build and deployment → Source** 选 **GitHub Actions**
3. 合并到 `main` 后，workflow `Deploy GitHub Pages` 会自动构建并发布

## 本地预览（可选）

```bash
cp auth-config.example.js auth-config.js
cp "Intake Tracker.dc.html" app.html
# 把 auth-config.js 里的 REPLACE_WITH_SHA256_HEX 换成密码的 SHA-256 hex，例如：
python3 - <<'PY'
import hashlib
print(hashlib.sha256(b"your-password").hexdigest())
PY
python3 -m http.server 8080
```

打开 `http://127.0.0.1:8080/`，输入密码后进入应用。`auth-config.js` 与 `app.html` 仅用于本地，勿提交。

## 说明

- 密码只存在于 `SITE_PASSWORD` Secret；CI 在构建产物里写入 SHA-256，**不会**提交到仓库
- 会话通过 `sessionStorage` 记住已解锁状态（关闭标签页后需重新输入）
- 这是静态站前端门禁，适合原型防误入；真正敏感数据请勿放在公开 Pages 上
