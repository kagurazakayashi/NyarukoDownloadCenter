SET CGO_ENABLED=0
SET GOOS=windows
SET GOARCH=amd64
go build -o file-mgr ..
7z a -mx9 file-mgr.xz file-mgr
del file-mgr
copy ..\code.csv \\CHENXIAOCHI\share-d\[000]\file_mgr\code.csv
copy ..\setting.json \\CHENXIAOCHI\share-d\[000]\file_mgr\setting.json
move file-mgr.xz \\CHENXIAOCHI\share-d\[000]\file_mgr\file-mgr.xz