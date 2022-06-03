package main

import (
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/kagurazakayashi/libNyaruko_Go/nyahttphandle"
	"github.com/kagurazakayashi/libNyaruko_Go/nyaio"
	"github.com/kagurazakayashi/libNyaruko_Go/nyamysql"
	"github.com/kagurazakayashi/libNyaruko_Go/nyaredis"
	cmap "github.com/orcaman/concurrent-map"
	"github.com/tidwall/gjson"
)

var (
	localeLists      cmap.ConcurrentMap = cmap.New()
	groupLists       cmap.ConcurrentMap = cmap.New()
	permissionsLists cmap.ConcurrentMap = cmap.New()
)
var (
	err                error
	defaultLocale      string = "zh-cn"
	defaultLocaleID    int    = 2
	OpenRegistration   bool   = false
	OpenUPFile         bool   = false
	saveFolder         string = "temp"
	adminPermissionsID string = "1"
	bigFileSize        int64  = 10485760
	cstSh              *time.Location
	timestyle          string = "2006-01-02 15:04:05"
)

var (
	mysqlconfig  string
	mysqlLink    int = 0
	mysqlMaxLink int
	redisconfig  string
	redisLink    int = 0
	redisMaxLink int
	httpHandle   string
)

func main() {
	cstSh, err = time.LoadLocation("Asia/Shanghai")
	if err != nil {
		fmt.Println("时区文件加载失败:", err)
		cstSh = time.FixedZone("CST", 8*3600)
	}

	fmt.Println("NyarukoDownloadCenter v1.0.3")
	//获取设置
	getPublicVariable()
	fmt.Println("测试MySQL连接...")
	nyaMS := nyamysql.New(mysqlconfig)
	if nyaMS.Error() != nil {
		fmt.Println("MySQL连接失败:", nyaMS.Error().Error())
		return
	}
	nyaMS.Close()
	fmt.Println("MySQL连接成功!")

	fmt.Println("测试redis连接...")
	nyaR := nyaredis.New(redisconfig)
	if nyaR.Error() != nil {
		fmt.Println("redis连接失败:", nyaR.Error().Error())
		return
	}
	nyaR.Close()
	fmt.Println("redis连接成功!")

	setupCloseHandler()

	getLocale()
	getpermissions()
	getGroup()

	var handles []func(http.ResponseWriter, *http.Request)
	handles = append(handles, mainHandleFunc)
	handles = append(handles, localeListHandleFunc)
	handles = append(handles, localeAddHandleFunc)
	handles = append(handles, localeDeleteHandleFunc)
	handles = append(handles, permissionsListHandleFunc)
	handles = append(handles, permissionsAddHandleFunc)
	handles = append(handles, permissionsDeleteHandleFunc)
	handles = append(handles, groupListHandleFunc)
	handles = append(handles, groupAddHandleFunc)
	handles = append(handles, groupEditHandleFunc)
	handles = append(handles, groupDeleteHandleFunc)
	handles = append(handles, userloginHandleFunc)
	handles = append(handles, userlogoutHandleFunc)
	handles = append(handles, userInfoHandleFunc)
	handles = append(handles, userListHandleFunc)
	handles = append(handles, userAddHandleFunc)
	handles = append(handles, userEditHandleFunc)
	handles = append(handles, userDeleteHandleFunc)
	handles = append(handles, fileListHandleFunc)
	handles = append(handles, fileUpdataHandleFunc)
	handles = append(handles, fileDownloadHandleFunc)
	handles = append(handles, fileDeleteHandleFunc)

	err = nyahttphandle.Init(httpHandle, handles...)
	if err != nil {
		fmt.Println("[nyahttphandle]", err)
	}
}

func mainHandleFunc(w http.ResponseWriter, req *http.Request) {
	fmt.Println("> mainHandleFunc")
	publicHandle(w, req)
	w.WriteHeader(404)
	w.Write([]byte("> " + req.Method + " :" + req.Header.Get("X-Forwarded-For") + " " + req.RemoteAddr + " -> " + req.RequestURI))
}
func getPublicVariable() {
	conf, err := nyaio.FileRead("./setting.json")
	if err != nil {
		fmt.Println("err:", err)
	}
	mysql := gjson.Get(conf, "mysql")
	if mysql.Exists() {
		mysqlconfig = mysql.String()
	} else {
		fmt.Println("缺少设置:'mysql'")
	}
	redis := gjson.Get(conf, "redis")
	if redis.Exists() {
		redisconfig = redis.String()
	} else {
		fmt.Println("缺少设置:'redis'")
	}
	gjDefaultLocale := gjson.Get(conf, "defaultLocale")
	if gjDefaultLocale.Exists() {
		defaultLocaleID = int(gjDefaultLocale.Array()[0].Int())
		defaultLocale = gjDefaultLocale.Array()[1].String()
	}
	gjMaxLinkNumber := gjson.Get(conf, "maxLinkNumber")
	if gjMaxLinkNumber.Exists() {
		mysqlMaxLink = int(gjson.Get(gjMaxLinkNumber.String(), "mysql").Int())
		redisMaxLink = int(gjson.Get(gjMaxLinkNumber.String(), "redis").Int())
	}
	hH := gjson.Get(conf, "httpHandle")
	if !hH.Exists() {
		fmt.Println("缺少设置:'httpHandle'")
		return
	}
	httpHandle = hH.String()
	returnMessageFilePath := gjson.Get(conf, "returnMessageFilePath")
	if returnMessageFilePath.Exists() {
		nyahttphandle.AlertInfoTemplateLoad(returnMessageFilePath.String())
	}
	OpenRegistrationJson := gjson.Get(conf, "OpenRegistration")
	if OpenRegistrationJson.Exists() {
		OpenRegistration = OpenRegistrationJson.Bool()
	}
	OpenUPFileJson := gjson.Get(conf, "OpenUPFile")
	if OpenUPFileJson.Exists() {
		OpenUPFile = OpenUPFileJson.Bool()
	}
	tempFolderJson := gjson.Get(conf, "saveFolder")
	if tempFolderJson.Exists() {
		saveFolder = tempFolderJson.String()
	}
	_, err = nyaio.FolderCreate(saveFolder)
	if err != nil {
		fmt.Println("创建临时文件夹失败")
		os.Exit(2)
	}
	adminPermissionsIDJson := gjson.Get(conf, "adminPermissionsID")
	if adminPermissionsIDJson.Exists() {
		adminPermissionsID = adminPermissionsIDJson.String()
	}
	bigFileSizeJson := gjson.Get(conf, "bigFileSize")
	if bigFileSizeJson.Exists() {
		bigFileSize = bigFileSizeJson.Int() * 1024 * 1024
	}
}
func publicHandle(w http.ResponseWriter, req *http.Request) {
	fmt.Println("> " + req.Method + " :" + req.Header.Get("X-Forwarded-For") + " " + req.RemoteAddr + " -> " + req.RequestURI)
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "*")
	w.Header().Set("Access-Control-Allow-Headers", "*")
	w.Header().Set("content-type", "application/x-www-form-urlencoded")
	w.Header().Set("content-type", "multipart/form-data")
	// w.Header().Set("content-type", "text/plain")
	w.Header().Set("content-type", "application/json")
}

func redisIsRun() *nyaredis.NyaRedis {
	if redisLink >= redisMaxLink {
		for {
			if redisLink < redisMaxLink {
				break
			}
			time.Sleep(time.Duration(500) * time.Millisecond)
		}
	}
	// fmt.Println("==========\r\nredis连接中...")
	nyaR := nyaredis.New(redisconfig)
	if nyaR.Error() != nil {
		return nil
	}
	fmt.Println("redis连接成功!")
	redisLink += 1
	return nyaR
}
func redisClose(nyaR *nyaredis.NyaRedis) {
	if nyaR != nil {
		nyaR.Close()
		nyaR = nil
		redisLink -= 1
		fmt.Println("redis关闭连接", redisLink)
	}
}
func mysqlIsRun() *nyamysql.NyaMySQL {
	if mysqlLink >= mysqlMaxLink {
		for {
			if mysqlLink < mysqlMaxLink {
				break
			}
			time.Sleep(time.Duration(500) * time.Millisecond)
		}
	}
	// fmt.Println("==========\r\nMySQL连接中...")
	nyaMS := nyamysql.New(mysqlconfig)
	if nyaMS.Error() != nil {
		fmt.Println("MySQL连接失败:", nyaMS.Error().Error())
		return nil
	}
	fmt.Println("MySQL连接成功!")
	mysqlLink += 1
	return nyaMS
}
func mysqlClose(nyaMS *nyamysql.NyaMySQL) {
	if nyaMS != nil {
		nyaMS.Close()
		nyaMS = nil
		mysqlLink -= 1
		fmt.Println("MySQL关闭连接", mysqlLink)
	}
}

func setupCloseHandler() {
	c := make(chan os.Signal, 2)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	go func() {
		<-c
		fmt.Println("收到中止请求, 正在退出 ... ")
		fmt.Println("退出。")
		os.Exit(0)
	}()
}
