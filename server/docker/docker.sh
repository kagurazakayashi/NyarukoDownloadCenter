docker volume create nyaruko_download_center_v
rm -f NyarukoDownloadCenter
xz -d -k NyarukoDownloadCenter.xz
md5sum NyarukoDownloadCenter
docker stop nyaruko_download_center_c
docker rm nyaruko_download_center_c
docker rmi nyaruko_download_center_i
docker build -t nyaruko_download_center_i .
docker run -it -p 12522:12522 --name nyaruko_download_center_c --net work --ip 172.18.0.122 -v nyaruko_download_center_v:/root/files -d nyaruko_download_center_i
