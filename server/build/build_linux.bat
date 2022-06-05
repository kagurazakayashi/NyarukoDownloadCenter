SET CGO_ENABLED=0
SET GOOS=linux
SET GOARCH=amd64
DEL NyarukoDownloadCenter.xz
go build -o NyarukoDownloadCenter ..
xz -z -e -9 -T 0 -v NyarukoDownloadCenter
