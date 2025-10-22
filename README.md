# ChuyenDeWeb2
Đầu tiên, clone về, mở cmder ngay file
1. Backend
 - cd backend
 - composer install
 Cho chạy để cài đặt lại thư mục vendor, xong thì chạy "cd .." để ra lại thư mục chính
2. Frontend
  - cd frontend
  - npm install
  cho chạy để cài đặt thư mục node_modules, xong thì chạy "cd .."
3. Bắt đầu chạy để build Docker
  - docker-compose up -d --build


==============================================================================

## Nếu container frontend dừng do lỗi Rollup, debug trực tiếp:

1. Dùng command: tail -f /dev/null trong docker-compose.yml (phần frontend)

````bash
frontend:
  build:
    context: .
    dockerfile: Dockerfile.frontend
  container_name: react_frontend
  working_dir: /var/www/frontend
  volumes:
    - ./frontend:/var/www/frontend
  ports:
    - "5173:5173"
  command: tail -f /dev/null
  networks:
    - app-network
````


2. Rebuild

`docker-compose up -d --build`

3. Vào cmder truy cập 
`docker-compose exec frontend bash`

4. Chạy lệnh
`rm -rf node_modules package-lock.json`
`npm install`
`npm install @rollup/rollup-linux-x64-gnu@latest`
`npm run dev`

5. Nếu npm run dev chạy thành công, cập nhật lại docker-compose.yml tại phần frontend
`command: npm run dev`

6. Rebuild lại
`docker-compose up -d --build`

7. Kiểm tra lại
`docker-compose ps`
========================================
# Nếu thấy có container của frontend ở trạng thái up thì truy cập `http://localhost:5173`
# Kiểm tra backend và phpMyAdmin:
- Backend: http://localhost:8000
- phpMyAdmin: http://localhost:8080