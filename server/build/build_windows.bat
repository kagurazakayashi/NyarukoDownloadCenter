SET CGO_ENABLED=0
SET GOOS=windows
SET GOARCH=amd64
DEL NyarukoDownloadCenter.exe.xz
go build -o NyarukoDownloadCenter.exe ..
xz -z -e -9 -T 0 -v NyarukoDownloadCenter
