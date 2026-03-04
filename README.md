## PaperZeaburManager(PZM) | v1.0

PaperMC伺服器部署於Zeabur時可以使用的管理介面，提供WEB終端機和伺服器檔案管理功能，使用者只需帶入自己的Docker Volume即可讓後端服務運作，不需要寫任何code就能使用。

![pzm_concept_art](https://github.com/user-attachments/assets/ac0fca1d-0f70-41bd-86e8-0edd42c5b09a)

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

5. 

<撰寫中...>