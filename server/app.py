"""ABC Park 轻量后端：用户档案 + 学习进度同步

零第三方依赖（Python 3.8+ 标准库）：
  - 同一进程托管静态网站（项目根目录）和 /api/* 接口
  - SQLite 存储（server/data/abc.db，WAL 模式），档案删除时进度一并删除

接口：
  GET    /api/profiles                    档案列表
  POST   /api/profiles                    创建档案 {name, avatar}
  DELETE /api/profiles/<id>               删除档案（含进度）
  GET    /api/profiles/<id>/progress      读取进度（无记录返回 {}）
  PUT    /api/profiles/<id>/progress      整体保存进度（JSON 文档，<200KB）

启动：python server/app.py        （默认 0.0.0.0:8899，可用环境变量 PORT 覆盖）
"""
import json
import mimetypes
import os
import re
import sqlite3
import threading
import uuid
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent          # 项目根（静态站点目录）
DATA_DIR = Path(os.environ.get('ABC_DATA') or (Path(__file__).resolve().parent / 'data'))
DB_PATH = DATA_DIR / 'abc.db'
PORT = int(os.environ.get('PORT', '8899'))

PROFILE_RE = re.compile(r'^/api/profiles/([a-f0-9]{6,32})$')
PROGRESS_RE = re.compile(r'^/api/profiles/([a-f0-9]{6,32})/progress$')
MAX_BODY = 200 * 1024

MIME_EXTRA = {
    '.webmanifest': 'application/manifest+json',
    '.woff2': 'font/woff2',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.mp3': 'audio/mpeg',
}
LONG_CACHE = ('.woff2', '.png')


def db():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(str(DB_PATH), timeout=10)
    con.execute('PRAGMA journal_mode=WAL')
    return con


def init_db():
    with db() as con:
        con.execute('''CREATE TABLE IF NOT EXISTS profiles (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            avatar TEXT NOT NULL,
            created_at TEXT NOT NULL)''')
        con.execute('''CREATE TABLE IF NOT EXISTS progress (
            profile_id TEXT PRIMARY KEY,
            data TEXT NOT NULL,
            updated_at TEXT NOT NULL)''')


def now_iso():
    return datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


class Handler(BaseHTTPRequestHandler):
    server_version = 'ABCServer/1.0'

    # ---------- 工具 ----------
    def send_json(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json(self):
        try:
            n = int(self.headers.get('Content-Length') or 0)
        except ValueError:
            n = 0
        if n <= 0 or n > MAX_BODY:
            return None
        try:
            obj = json.loads(self.rfile.read(n).decode('utf-8'))
        except (ValueError, UnicodeDecodeError):
            return None
        return obj

    def log_message(self, fmt, *args):  # 静默常规访问日志，只保留错误
        pass

    # ---------- API ----------
    def list_profiles(self):
        with db() as con:
            rows = con.execute('SELECT id, name, avatar FROM profiles ORDER BY created_at').fetchall()
        self.send_json(200, [{'id': r[0], 'name': r[1], 'avatar': r[2]} for r in rows])

    def create_profile(self):
        body = self.read_json()
        if not isinstance(body, dict):
            return self.send_json(400, {'error': 'invalid json'})
        name = str(body.get('name') or '').strip()
        avatar = str(body.get('avatar') or '').strip()
        if not re.fullmatch(r'[\w ]{1,12}', name):
            return self.send_json(400, {'error': 'name must be 1-12 word characters'})
        if not avatar or len(avatar) > 8:
            return self.send_json(400, {'error': 'invalid avatar'})
        pid = uuid.uuid4().hex[:12]
        with db() as con:
            con.execute('INSERT INTO profiles (id, name, avatar, created_at) VALUES (?,?,?,?)',
                        (pid, name, avatar, now_iso()))
        self.send_json(200, {'id': pid, 'name': name, 'avatar': avatar})

    def delete_profile(self, pid):
        with db() as con:
            cur = con.execute('DELETE FROM profiles WHERE id=?', (pid,))
            con.execute('DELETE FROM progress WHERE profile_id=?', (pid,))
        self.send_json(200, {'deleted': cur.rowcount})

    def get_progress(self, pid):
        with db() as con:
            row = con.execute('SELECT data FROM progress WHERE profile_id=?', (pid,)).fetchone()
        if row is None:
            return self.send_json(200, {})
        try:
            self.send_json(200, json.loads(row[0]))
        except ValueError:
            self.send_json(200, {})

    def put_progress(self, pid):
        body = self.read_json()
        if not isinstance(body, dict):
            return self.send_json(400, {'error': 'invalid json'})
        with db() as con:
            exists = con.execute('SELECT 1 FROM profiles WHERE id=?', (pid,)).fetchone()
            if not exists:
                return self.send_json(404, {'error': 'no such profile'})
            con.execute('''INSERT INTO progress (profile_id, data, updated_at) VALUES (?,?,?)
                           ON CONFLICT(profile_id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at''',
                        (pid, json.dumps(body, ensure_ascii=False), now_iso()))
        self.send_json(200, {'ok': True})

    # ---------- 路由 ----------
    def route(self, method):
        path = self.path.split('?', 1)[0]
        if path.startswith('/api/'):
            if method == 'GET' and path == '/api/profiles':
                return self.list_profiles()
            if method == 'POST' and path == '/api/profiles':
                return self.create_profile()
            if method == 'DELETE':
                m = PROFILE_RE.match(path)
                if m:
                    return self.delete_profile(m.group(1))
            if method == 'GET':
                m = PROGRESS_RE.match(path)
                if m:
                    return self.get_progress(m.group(1))
            if method == 'PUT':
                m = PROGRESS_RE.match(path)
                if m:
                    return self.put_progress(m.group(1))
            return self.send_json(404, {'error': 'not found'})
        if method == 'GET':
            return self.serve_static(path)
        self.send_json(405, {'error': 'method not allowed'})

    def do_GET(self):
        self.route('GET')

    def do_POST(self):
        self.route('POST')

    def do_PUT(self):
        self.route('PUT')

    def do_DELETE(self):
        self.route('DELETE')

    # ---------- 静态文件 ----------
    def serve_static(self, path):
        rel = path.lstrip('/') or 'index.html'
        if rel.endswith('/'):
            rel += 'index.html'
        target = (ROOT / rel).resolve()
        try:
            target.relative_to(ROOT)
        except ValueError:
            return self.send_response(403)
        if not target.is_file():
            return self.send_response(404)
        ctype = MIME_EXTRA.get(target.suffix.lower()) or mimetypes.guess_type(str(target))[0] or 'application/octet-stream'
        with open(target, 'rb') as f:
            body = f.read()
        status = 200
        content_range = None
        if target.suffix.lower() == '.mp3':
            # iPad Safari probes audio with a short range before playing it.
            match = re.fullmatch(r'bytes=([0-9]{1,16})-([0-9]{0,16})', self.headers.get('Range', ''))
            if match:
                length = len(body)
                start = int(match[1])
                end = min(int(match[2]), length - 1) if match[2] else length - 1
                if start > end:
                    status, content_range, body = 416, f'bytes */{length}', b''
                else:
                    status, content_range, body = 206, f'bytes {start}-{end}/{length}', body[start:end + 1]
        self.send_response(status)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(body)))
        if target.suffix.lower() == '.mp3':
            self.send_header('Accept-Ranges', 'bytes')
        if content_range:
            self.send_header('Content-Range', content_range)
        if target.suffix.lower() in LONG_CACHE:
            self.send_header('Cache-Control', 'public, max-age=86400')
        else:
            self.send_header('Cache-Control', 'no-cache')
        self.end_headers()
        self.wfile.write(body)


def main():
    init_db()
    # 静音默认每请求日志已关；启动横幅避免 emoji（Windows 控制台编码）
    srv = ThreadingHTTPServer(('0.0.0.0', PORT), Handler)
    print('=' * 52)
    print('  ABC Park server running')
    print('  local   : http://localhost:%d' % PORT)
    print('  LAN/VPN: http://<your-ip>:%d   (same WiFi)' % PORT)
    print('  data    : %s' % DB_PATH)
    print('=' * 52)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    main()
