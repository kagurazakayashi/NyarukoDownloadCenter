package main

import (
	"fmt"
	"net/http"
	"strconv"
	"sync"

	"github.com/kagurazakayashi/libNyaruko_Go/nyahttphandle"
	cmap "github.com/orcaman/concurrent-map"
	"github.com/tidwall/gjson"
)

func permissionsList(w http.ResponseWriter, req *http.Request, c chan []byte) {
	fmt.Println("> permissionsListHandleFunc")
	publicHandle(w, req)

	localeID := defaultLocaleID

	if req.Method == http.MethodOptions {
		c <- nyahttphandle.AlertInfoJson(w, localeID, 1001)
		return
	} else if req.Method != http.MethodPost { // 检查是否为post请求
		// 返回 不是POST请求 的错误
		c <- nyahttphandle.AlertInfoJson(w, localeID, 2001)
		return
	}
	req.ParseMultipartForm(32 << 20)
	formcforced, ishforced := req.Form["forced"]

	if ishforced && formcforced[0] == "1" {
		getpermissions()
	}
	if permissionsLists == nil {
		getpermissions()
		if permissionsLists == nil {
			c <- nyahttphandle.AlertInfoJson(w, localeID, 9001)
			return
		}
	}
	c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 10000, "", permissionsLists)
}

func permissionsAdd(w http.ResponseWriter, req *http.Request, c chan []byte) {
	fmt.Println("> permissionsAddHandleFunc")
	publicHandle(w, req)

	localeID := defaultLocaleID

	if req.Method == http.MethodOptions {
		c <- nyahttphandle.AlertInfoJson(w, localeID, 1001)
		return
	} else if req.Method != http.MethodPost { // 检查是否为post请求
		// 返回 不是POST请求 的错误
		c <- nyahttphandle.AlertInfoJson(w, localeID, 2001)
		return
	}

	req.ParseMultipartForm(32 << 20)
	fromt, isht := req.Form["t"]
	fromname, ishname := req.Form["name"]
	fromdescribe, ishdescribe := req.Form["describe"]
	fromascription, ishascription := req.Form["ascription"]
	var missingParameter []string
	if !isht {
		missingParameter = append(missingParameter, "t")
	}
	if !ishname {
		missingParameter = append(missingParameter, "name")
	}
	if !ishdescribe {
		missingParameter = append(missingParameter, "describe")
	}
	if len(missingParameter) != 0 {
		c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 2040, "err", missingParameter)
		return
	}

	getUserInfo, locale_id, code := isOnLine(fromt[0])
	if code != -1 {
		c <- nyahttphandle.AlertInfoJson(w, localeID, code)
		return
	}
	localeID = locale_id
	permissions_id := gjson.Get(getUserInfo, "permissions_id")
	if !(permissions_id.Exists() && permissions_id.String() == adminPermissionsID) {
		c <- nyahttphandle.AlertInfoJson(w, localeID, 4004)
		return
	}
	key := "`name`,`describe`"
	val := "'" + fromname[0] + "','" + fromdescribe[0] + "'"
	if ishascription && (fromascription[0] == "0" || fromascription[0] == "1") {
		key += ",`ascription`"
		val += ",'" + fromascription[0] + "'"
	}
	nyaMS := mysqlIsRun()
	if nyaMS == nil {
		c <- nyahttphandle.AlertInfoJson(w, localeID, 9000)
		return
	}
	_, err := nyaMS.AddRecord("account_permissions", key, val, "", nil)
	mysqlClose(nyaMS)
	if err != nil {
		c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9001, "err", err.Error())
		return
	}
	getpermissions()
	c <- nyahttphandle.AlertInfoJson(w, localeID, 10000)
}

func permissionsDelete(w http.ResponseWriter, req *http.Request, c chan []byte) {
	fmt.Println("> permissionsDeleteHandleFunc")
	publicHandle(w, req)

	localeID := defaultLocaleID

	if req.Method == http.MethodOptions {
		c <- nyahttphandle.AlertInfoJson(w, localeID, 1001)
		return
	} else if req.Method != http.MethodPost { // 检查是否为post请求
		// 返回 不是POST请求 的错误
		c <- nyahttphandle.AlertInfoJson(w, localeID, 2001)
		return
	}

	req.ParseMultipartForm(32 << 20)
	fromt, isht := req.Form["t"]
	fromid, ishid := req.Form["id"]
	var missingParameter []string
	if !isht {
		missingParameter = append(missingParameter, "t")
	}
	if !ishid {
		missingParameter = append(missingParameter, "id")
	}
	if len(missingParameter) != 0 {
		c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 2040, "err", missingParameter)
		return
	}

	getUserInfo, locale_id, code := isOnLine(fromt[0])
	if code != -1 {
		c <- nyahttphandle.AlertInfoJson(w, localeID, code)
		return
	}
	localeID = locale_id
	permissions_id := gjson.Get(getUserInfo, "permissions_id")
	if !(permissions_id.Exists() && permissions_id.String() == adminPermissionsID) {
		c <- nyahttphandle.AlertInfoJson(w, localeID, 4004)
		return
	}

	nyaMS := mysqlIsRun()
	if nyaMS == nil {
		c <- nyahttphandle.AlertInfoJson(w, localeID, 9000)
		return
	}
	err = nyaMS.DeleteRecord("account_permissions", "id", fromid[0], "", "", nil)
	mysqlClose(nyaMS)
	if err != nil {
		c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9001, "err", err.Error())
		return
	}
	getpermissions()
	c <- nyahttphandle.AlertInfoJson(w, localeID, 10000)
}

func permissionsListHandleFunc(w http.ResponseWriter, req *http.Request) {
	wg := sync.WaitGroup{}
	wg.Add(1)
	c := make(chan []byte)
	go permissionsList(w, req, c)
	re := <-c
	wg.Done()
	w.Write(re)
	wg.Wait()
}

func permissionsAddHandleFunc(w http.ResponseWriter, req *http.Request) {
	wg := sync.WaitGroup{}
	wg.Add(1)
	c := make(chan []byte)
	go permissionsAdd(w, req, c)
	re := <-c
	wg.Done()
	w.Write(re)
	wg.Wait()
}

func permissionsDeleteHandleFunc(w http.ResponseWriter, req *http.Request) {
	wg := sync.WaitGroup{}
	wg.Add(1)
	c := make(chan []byte)
	go permissionsDelete(w, req, c)
	re := <-c
	wg.Done()
	w.Write(re)
	wg.Wait()
}
func getpermissions() {
	nyaMS := mysqlIsRun()
	if nyaMS == nil {
		fmt.Println("打开数据库失败")
		return
	}
	qd, err := nyaMS.QueryData("*", "account_permissions", "", "", "", nil)
	mysqlClose(nyaMS)
	if err != nil {
		fmt.Println("查询数据库'account_permissions'失败" + err.Error())
		return
	}
	if qd.Count() == 0 {
		fmt.Println("没有返回数据")
		return
	}
	permissionsLists.Clear()
	for item := range qd.IterBuffered() {
		itemcmap := item.Val.(cmap.ConcurrentMap)
		temp := cmap.New()

		idstr, ish := itemcmap.Get("id")
		if !ish {
			continue
		}
		if num, err := strconv.Atoi(idstr.(string)); err == nil {
			temp.Set("id", num)
		}
		name, ish := itemcmap.Get("name")
		if !ish {
			continue
		}
		temp.Set("name", name)

		describe, ish := itemcmap.Get("describe")
		if !ish {
			continue
		}
		temp.Set("describe", describe)

		ascriptionstr, ish := itemcmap.Get("ascription")
		if !ish {
			continue
		}
		if num, err := strconv.Atoi(ascriptionstr.(string)); err == nil {
			temp.Set("ascription", num)
		}
		permissionsLists.Set(idstr.(string), temp)
	}
}
