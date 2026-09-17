# Triển khai learn.22792.me

Ứng dụng tĩnh chạy trong Nginx không đặc quyền, kết nối với mạng Docker `edge-network`. Traefik hiện hữu chịu trách nhiệm HTTP→HTTPS và Let’s Encrypt.

## Build và khởi động

```bash
npm ci
npm run build
docker compose -f deploy/docker-compose.yml up -d --build
```

Lệnh `docker compose ... up -d` tạo router TLS với `certresolver=letsencrypt`. Khi router xuất hiện lần đầu, Traefik tự gửi yêu cầu cấp chứng chỉ cho `learn.22792.me` bằng HTTP-01 challenge.

## Xác minh SSL

```bash
curl -I http://learn.22792.me
curl -I https://learn.22792.me
docker logs --since 10m edge-traefik 2>&1 | grep -iE 'learn\.22792\.me|acme|certificate'
openssl s_client -connect learn.22792.me:443 -servername learn.22792.me </dev/null 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates
```

## Tự động gia hạn

Traefik kiểm tra chứng chỉ định kỳ và tự gia hạn trước khi hết hạn; không cần cron hay `certbot renew`. Dữ liệu ACME được lưu bền vững tại `/root/edge-traefik/letsencrypt/acme.json` trên VPS.

Kiểm tra container và kho ACME:

```bash
docker inspect edge-traefik --format '{{json .Config.Cmd}}'
stat -c '%a %n' /root/edge-traefik/letsencrypt/acme.json
```

## Cập nhật

Build lại `dist`, tải lên VPS rồi chạy:

```bash
docker compose -f /opt/learn-english-words/deploy/docker-compose.yml up -d --build
```

## Rollback

Giữ lại image cũ với tag phiên bản trước, đổi dòng `image:` trong compose, rồi chạy `docker compose up -d`. Việc này không ảnh hưởng Traefik hoặc các dịch vụ VPS khác.


## Tài khoản và database

API chạy trong container `learn-english-words-api`; SQLite nằm trong volume Docker `learn-english-words-data`, không nằm trong image nên vẫn còn khi cập nhật container.

```bash
# Kiểm tra API
docker inspect learn-english-words-api --format '{{.State.Status}}/{{.State.Health.Status}}'
curl -fsS https://learn.22792.me/api/health

# Sao lưu nhất quán bằng SQLite online backup API
mkdir -p /root/backups/learn-english-words
docker exec learn-english-words-api node -e "const D=require('better-sqlite3');const db=new D('/data/learning.sqlite');db.backup('/data/learning-backup.sqlite').then(()=>db.close())"
docker cp learn-english-words-api:/data/learning-backup.sqlite /root/backups/learn-english-words/learning-$(date +%Y%m%d-%H%M%S).sqlite

# Xóa file backup tạm trong volume sau khi đã copy
docker exec learn-english-words-api node -e "require('node:fs').rmSync('/data/learning-backup.sqlite',{force:true})"
```

Quyền riêng tư: mật khẩu chỉ lưu dưới dạng bcrypt hash; session token lưu hash trong database và cookie thật là `HttpOnly`, `Secure`, `SameSite=Lax`. API giới hạn tốc độ đăng nhập và kiểm tra origin cho thao tác ghi.
