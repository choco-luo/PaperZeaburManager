## PaperZeaburManager(PZM) | v1.0

PaperMC伺服器部署於Zeabur時可以使用的管理介面，提供WEB終端機和伺服器檔案管理功能，使用者只需帶入自己的Docker Volume即可讓後端服務運作，不需要寫任何code就能使用。

![pzm_concept_art](https://github.com/user-attachments/assets/44d1f390-38c0-4310-9a7e-275735da32ab)

## 📦v1.0架設方式
1. 準備好需要使用的Paper伺服器檔案(實際上Bukkit、Spigot、Fabric...也通用)

2. Zeabur 購買一台2vCPU | 8GB的專有主機(推薦最低配置)

> 免費叢集的硬體配置不夠把Minecraft Server開起來，很容易在世界生成時卡住。
>
> (PZM完全針對使用Zeabur架設的情況，不維護其他平台的運作)

3. 透過Zeabur專有主機新建一個專案。

4. 進入專案建立服務選擇GitHub倉庫，並按照以下配置連接。

```yml
後端服務 -> /backend 資料夾
前端服務 -> /frontend 資料夾
```

> 建議自行clone一份服務去部署，避免main更新時被強制重新部署。

5. 前後端資料夾都配置完後，跳轉到前後端服務的"環境變數"按照範例配置參數

backend:
```yml
# 保護用的隨機字串 (隨意輸入)
JWT_SECRET=任意字串
# 帳號:密碼,...為多組帳號
USERS=admin:password
# 在Zeabur部署時配合Volume掛載的路徑 (本地可以輸入自己想要的路徑)
WORK_DIR=/mc
# 伺服器啟動的Port(預設為3000，在Zeabur上不需要設定)
PORT=3000
# 部署到Zeabur時，請改為分配到的前端網域名稱(ex: https://xxxxxxx.zeabur.app)
FRONTEND_URL=http://localhost:5173
```
frontend:
```yml
# VITE_WS_URL=後端服務綁定的子網域(ex: wss://xxxxxxx.zeabur.app)
# VITE_API_URL=後端服務綁定的子網域(ex: https://xxxxxxx.zeabur.app))
VITE_WS_URL=ws://localhost:3000
VITE_API_URL=https://localhost:3000
```

6. 回到後端服務，在硬碟選項新增一個硬碟並配置正確路徑
> Zeabur的掛載硬碟為Docker Voulme服務，每次掛載/移除動作都會重新啟動。
> 伺服器的最新進度使用Volume保存，請注意備份時間。
<img width="415" height="330" alt="backend-volume" src="https://github.com/user-attachments/assets/4c9212b8-4244-4080-9f73-4d070592f899" />

7. 接第六點，再跳到後端網路服務新增一個TCP連線方式，PORT為`25565`
<img width="659" height="477" alt="289350829035" src="https://github.com/user-attachments/assets/e20e8a83-33bf-41d9-889f-ee47cb6eadce" />

完成註冊後會得到新的TCP連線點以及對外用的PORT (建議再套一層DNS解析用於公開連線)

8. 進入前端的管理介面登入管理員帳號，並上傳打包好的伺服器檔案
> 請確認Volume已經有掛載好並且路徑正確，避免上傳先後順序問題導致被覆蓋。

[ 完成，恭喜成功架設好Zeabur環境上的PaperMC伺服器 ]