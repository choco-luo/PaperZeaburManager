## PaperZeaburManager(PZM) | v1.0

PaperMC伺服器部署於Zeabur時可以使用的管理介面，提供WEB終端機和伺服器檔案管理功能，使用者只需帶入自己的Docker Volume即可讓後端服務運作，不需要寫任何code就能使用。

![pzm_concept_art](https://github.com/user-attachments/assets/44d1f390-38c0-4310-9a7e-275735da32ab)

## 📦v1.0架設方式
1. 準備好需要使用的伺服器檔案(Bukkit、Spigot、Paper、Fabric...)

2. Zeabur 購買一台2vCPU | 8GB的專有主機(推薦最低配置)

> 免費叢集的硬體配置不夠把Minecraft Server開起來，很容易在世界生成時卡住。
>
> (PZM完全針對使用Zeabur架設的情況，不維護其他平台的運作)

3. 透過Zeabur專有主機新建一個專案。

4. 進入專案建立服務選擇GitHub倉庫，並按照以下配置連接。

後端服務 -> backend資料夾

前端服務 -> frontend資料夾

> 建議自行clone一份服務去部署，避免main更新時被強制重新部署。

5. 前後端資料夾都配置完後，先到前後端服務的"環境變數"按照範例配置參數

backend:
```yml
# 保護用的隨機字串 (隨意輸入)
JWT_SECRET=任意字串
# USERS=帳號:密碼,...為多組帳號
USERS=admin:password
# 在Zeabur部署時配合Volume掛載的路徑 (本地可以輸入自己想要的路徑)
WORK_DIR=./mc
# 伺服器啟動的Port(預設為3000，在Zeabur上不需要設定)
PORT=3000
# 部署到Zeabur時，請改為分配到的前端網域名稱(ex: https://your-pzm-panel.zeabur.app)
FRONTEND_URL=http://localhost:5173
```
frontend:
```yml
# 部署到Zeabur時請在前端環境變數分別新增以下兩個環境變數
# VITE_WS_URL=後端服務綁定的子網域(ex: wss://xxxxxxx.zeabur.app)
# VITE_API_URL=後端服務綁定的子網域(ex: https://xxxxxxx.zeabur.app))
VITE_WS_URL=ws://localhost:3000
VITE_API_URL=https://localhost:3000
```

<撰寫中...>