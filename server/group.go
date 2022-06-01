package main

import (
	"fmt"
	"net/http"
	"strings"
	"sync"

	"github.com/kagurazakayashi/libNyaruko_Go/nyahttphandle"
	cmap "github.com/orcaman/concurrent-map"
	"github.com/tidwall/gjson"
)

func groupList(w http.ResponseWriter, req *http.Request, c chan []byte) {
	fmt.Println("> groupListHandleFunc")
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
	var missingParameter []string
	if !isht {
		missingParameter = append(missingParameter, "t")
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

	formcforced, ishforced := req.Form["forced"]

	if ishforced && formcforced[0] == "1" {
		getGroup()
	}
	if groupLists == nil {
		getGroup()
		if groupLists == nil {
			c <- nyahttphandle.AlertInfoJson(w, localeID, 9001)
			return
		}
	}
	c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 10000, "", groupLists)
}

func groupAdd(w http.ResponseWriter, req *http.Request, c chan []byte) {
	fmt.Println("> groupAddHandleFunc")
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
	fromcode, ishcode := req.Form["code"]
	fromname, ishname := req.Form["name"]
	frompid, ishpid := req.Form["pid"]
	var missingParameter []string
	if !isht {
		missingParameter = append(missingParameter, "t")
	}
	if !ishcode {
		missingParameter = append(missingParameter, "code")
	}
	if !ishname {
		missingParameter = append(missingParameter, "name")
	}
	if len(missingParameter) != 0 {
		c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 2040, "err", missingParameter)
		return
	}

	_, locale_id, code := isOnLine(fromt[0])
	if code != -1 {
		c <- nyahttphandle.AlertInfoJson(w, localeID, code)
		return
	}
	localeID = locale_id
	// permissions_id := gjson.Get(getUserInfo, "permissions_id")
	// if !(permissions_id.Exists() && permissions_id.String() == adminPermissionsID) {
	// 	c <- nyahttphandle.AlertInfoJson(w, localeID, 4004)
	// 	return
	// }

	key := "`code`,`name`"
	val := "'" + fromcode[0] + "','" + fromname[0] + "'"
	if ishpid {
		key += ",`permissions_id`"
		val += ",'" + frompid[0] + "'"
	}
	nyaMS := mysqlIsRun()
	if nyaMS == nil {
		c <- nyahttphandle.AlertInfoJson(w, localeID, 9000)
		return
	}
	_, err := nyaMS.AddRecord("account_group", key, val, "", nil)
	mysqlClose(nyaMS)
	if err != nil {
		errs := strings.Split(err.Error(), "PRIMARY")
		if len(errs) == 2 {
			c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9001, "err", "`code`已存在: "+err.Error())
			return
		}
		c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9001, "err", err.Error())
		return
	}
	getGroup()
	c <- nyahttphandle.AlertInfoJson(w, localeID, 10000)
}

func groupEdit(w http.ResponseWriter, req *http.Request, c chan []byte) {
	fmt.Println("> groupEditHandleFunc")
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
	fromcode, ishcode := req.Form["code"]
	fromname, ishname := req.Form["name"]
	frompid, ishpid := req.Form["pid"]
	var missingParameter []string
	if !isht {
		missingParameter = append(missingParameter, "t")
	}
	if !ishcode {
		missingParameter = append(missingParameter, "code")
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
	updata := ""
	if ishname {
		updata += "`name`='" + fromname[0] + "'"
	}
	if ishpid {
		if updata != "" {
			updata += ","
		}
		updata += "`permissions_id`='" + frompid[0] + "'"
	}
	upi, err := nyaMS.UpdataRecord("account_group", updata, "`code`='"+fromcode[0]+"'", nil)
	mysqlClose(nyaMS)
	if err != nil {
		c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9001, "err", err.Error())
		return
	}
	if upi == 0 {
		c <- nyahttphandle.AlertInfoJson(w, localeID, 9009)
		return
	}
	getGroup()
	c <- nyahttphandle.AlertInfoJson(w, localeID, 10000)
}

func groupDelete(w http.ResponseWriter, req *http.Request, c chan []byte) {
	fmt.Println("> groupDeleteHandleFunc")
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
	fromcode, ishcode := req.Form["code"]
	var missingParameter []string
	if !isht {
		missingParameter = append(missingParameter, "t")
	}
	if !ishcode {
		missingParameter = append(missingParameter, "code")
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
	err = nyaMS.DeleteRecord("account_group", "code", fromcode[0], "", "", nil)
	if err != nil {
		c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9001, "err", err.Error())
		return
	}
	getGroup()
	c <- nyahttphandle.AlertInfoJson(w, localeID, 10000)
}

func groupListHandleFunc(w http.ResponseWriter, req *http.Request) {
	wg := sync.WaitGroup{}
	wg.Add(1)
	c := make(chan []byte)
	go groupList(w, req, c)
	re := <-c
	wg.Done()
	w.Write(re)
	wg.Wait()
}

func groupAddHandleFunc(w http.ResponseWriter, req *http.Request) {
	wg := sync.WaitGroup{}
	wg.Add(1)
	c := make(chan []byte)
	go groupAdd(w, req, c)
	re := <-c
	wg.Done()
	w.Write(re)
	wg.Wait()
}

func groupEditHandleFunc(w http.ResponseWriter, req *http.Request) {
	wg := sync.WaitGroup{}
	wg.Add(1)
	c := make(chan []byte)
	go groupEdit(w, req, c)
	re := <-c
	wg.Done()
	w.Write(re)
	wg.Wait()
}

func groupDeleteHandleFunc(w http.ResponseWriter, req *http.Request) {
	wg := sync.WaitGroup{}
	wg.Add(1)
	c := make(chan []byte)
	go groupDelete(w, req, c)
	re := <-c
	wg.Done()
	w.Write(re)
	wg.Wait()
}

func getGroup() {
	nyaMS := mysqlIsRun()
	if nyaMS == nil {
		fmt.Println("打开数据库失败")
		return
	}
	qd, err := nyaMS.QueryData("*", "account_group", "", "", "", nil)
	mysqlClose(nyaMS)
	if err != nil {
		fmt.Println("查询数据库'account_group'失败" + err.Error())
		return
	}
	if qd.Count() == 0 {
		fmt.Println("没有返回数据")
		return
	}
	groupLists.Clear()
	for item := range qd.IterBuffered() {
		itemcmap := item.Val.(cmap.ConcurrentMap)
		temp := cmap.New()

		codestr, ish := itemcmap.Get("code")
		if !ish {
			continue
		}
		name, ish := itemcmap.Get("name")
		if !ish {
			continue
		}
		temp.Set("name", name)

		permissions_id, ish := itemcmap.Get("permissions_id")
		if !ish {
			continue
		}
		if m, ok := permissionsLists.Get(permissions_id.(string)); ok {
			temp.Set("permissions", m)
		}
		groupLists.Set(codestr.(string), temp)
	}
}
