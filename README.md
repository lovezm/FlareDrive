# 星科技下载中心

基于 [FlareDrive](https://github.com/lovezm/FlareDrive) 定制的 Cloudflare R2 文件管理与下载中心，使用 Cloudflare Pages Functions 和 Workers 运行。

- 项目仓库：https://github.com/lovezm/FlareDrive
- 星科技官网：https://xkji.com

## 定制内容

- 中文化的“星科技下载中心”品牌界面
- 使用站内模态框登录，替代浏览器默认的 Basic Auth 弹窗
- 响应式文件列表，展示名称、大小、修改时间和管理操作
- 支持上传、新建文件夹、新建文本、下载、重命名和批量删除
- 支持拖放上传、大文件分片上传和传输进度
- 文件夹递归删除
- 可选公开只读模式
- 保留标准 WebDAV 接口，兼容第三方 WebDAV 客户端

## 部署要求

开始之前需要：

- Cloudflare 账户
- 已启用的 R2 服务及至少一个 R2 Bucket
- 已将本仓库连接到 Cloudflare Pages

### 构建设置

```text
Build command: npm run build
Build output directory: build
```

### 环境变量与密钥

在 Cloudflare Pages 的 **Settings → Variables and Secrets** 中配置：

| 变量名 | 是否必需 | 说明 |
| --- | --- | --- |
| `WEBDAV_USERNAME` | 是 | 网页管理端和 WebDAV 登录用户名 |
| `WEBDAV_PASSWORD` | 是 | 网页管理端和 WebDAV 登录密码 |
| `FLAREDRIVE_SESSION_SECRET` | 是 | 本定制版新增，用于签名网页端登录会话；至少 32 个字符 |
| `WEBDAV_PUBLIC_READ` | 否 | 设置为 `1` 时允许访客只读浏览，上传和管理仍需登录 |

> **升级提示：** `FLAREDRIVE_SESSION_SECRET` 是本定制版新增的必要配置。旧部署升级后必须补充该密钥，否则标准 WebDAV Basic Auth 仍可使用，但网页模态框登录会提示登录服务配置不可用。

请为 `FLAREDRIVE_SESSION_SECRET` 使用独立的随机值，不要与 WebDAV 密码相同。可在本地生成：

```bash
openssl rand -hex 32
```

请将变量应用到需要使用的 **Production** 和 **Preview** 环境。修改变量后，需要重新部署才能生效。

### R2 绑定

在 Cloudflare Pages 中添加 R2 Bucket 绑定：

```text
Variable name: BUCKET
R2 bucket: 选择你的存储桶
```

完成变量和 R2 绑定后，在 **Deployments** 页面重新部署最新的 `main` 分支。

## WebDAV

WebDAV 地址：

```text
https://<你的域名>/webdav
```

用户名和密码使用 `WEBDAV_USERNAME` 与 `WEBDAV_PASSWORD`。WebDAV 客户端继续使用标准 Basic Auth，不受网页模态框登录方式影响。

受 Cloudflare Workers 单次请求大小限制，较大的文件应通过网页端分片上传。

## 本地开发与验证

```bash
npm install
npm test -- --watchAll=false --runInBand
npm run test:functions
npm run build
```

## 致谢

WebDAV 相关实现基于 [r2-webdav](https://github.com/abersheeran/r2-webdav) 项目。
