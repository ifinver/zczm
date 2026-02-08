# MediaCMS

自动更新导航域名的脚本位置：
static/update+_nav.sh

app下载界面的文件位置：
static/app-download.html

## 代码更新后, 依次执行如下命令，来编译网站并重启程序：
cd /home/mediacms.io/mediacms 
source  /home/mediacms.io/bin/activate 
git pull 
pip install -r requirements.txt -U 
python manage.py migrate 
cd frontend/
export NODE_OPTIONS="--openssl-legacy-provider"
npm run dist
cd ..
sudo systemctl restart mediacms celery_long celery_short 

