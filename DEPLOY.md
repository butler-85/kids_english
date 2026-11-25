# 部署指南（公网、多用户）

架构：静态前端 + 轻量后端（`server/app.py`，Python 标准库 + SQLite，零第三方依赖）。
每个小朋友一个档案（头像+名字，无密码），进度存服务器并跨设备同步；
断网时自动回退本机缓存继续玩，回网自动补传。

## 方案 A：云服务器（推荐，支持用户管理）

### Docker 方式（推荐）

把 `kids_english` 文件夹上传到服务器（scp / rsync / 宝塔面板均可），然后：

```bash
cd kids_english
docker compose up -d --build
```

完成。访问 `http://服务器IP:8080`。

- 端口在 `docker-compose.yml` 里改（`"8080:80"` 左边是宿主机端口）
- 所有档案与进度数据在 docker 卷 `abc-data` 里；**备份/迁移只需这一个卷**
  （或直接拷贝容器内 `/app/site/server/data/abc.db`）
- 更新代码后：`docker compose up -d --build` 一条命令

不想用 compose 时：

```bash
docker build -t abc-park .
docker run -d --name abc-park --restart always -p 8080:80 -v abc-data:/app/site/server/data abc-park
```

### 直接跑 Python（不想用 Docker）

服务器只需 Python 3.8+（绝大多数系统自带）：

```bash
cd kids_english
PORT=8080 nohup python3 server/app.py > abc.log 2>&1 &
```

开机自启（systemd，`/etc/systemd/system/abc-park.service`）：

```ini
[Unit]
Description=ABC Park
After=network.target

[Service]
WorkingDirectory=/opt/kids_english
Environment=PORT=8080
ExecStart=/usr/bin/python3 server/app.py
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload && sudo systemctl enable --now abc-park
```

数据文件在 `server/data/abc.db`（可用 `ABC_DATA` 环境变量改路径）。

### 安全组 / 防火墙

在云控制台放行所选端口（如 8080/TCP）。

## 方案 B：免费静态托管（无后端，无档案同步）

EdgeOne Pages / Cloudflare Pages 直接上传文件夹即可得到 HTTPS 地址，
但**没有用户管理**：进度存在各自设备浏览器里，换设备不同步。
适合先快速分享试玩；需要档案功能时再上云服务器（方案 A）。

## 域名与备案

- **直接用 `http://IP:端口` 访问**：不需要域名、不需要备案，最简单。
- **想用域名**：大陆服务器必须完成 ICP 备案；香港/海外服务器免备案但延迟稍高。

## HTTPS（建议最终加上）

Service Worker 离线与「添加到主屏幕」完整体验在 HTTPS 下最稳。
有域名后：

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d 你的域名
```

（用 nginx 反代到 `127.0.0.1:8080` 后再跑 certbot。）

## 更新与缓存

- 网页与代码「网络优先」：重新部署后用户下次打开即新版
- 改动较大时把 `sw.js` 里 `VERSION` 升一版（v2 → v3），旧缓存自动清理

## 隐私与安全

- 无账号无密码：档案仅含名字、头像、游戏进度，不含任何个人信息
- 服务器只读写 SQLite 单文件，无其他端口、无外部依赖，攻击面极小
- 知道地址的人都能创建档案玩；如需限制访问，可在 nginx 层加 Basic Auth 或 IP 白名单
