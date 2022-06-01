package main

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"sync"

	"github.com/kagurazakayashi/libNyaruko_Go/nyahttphandle"
	cmap "github.com/orcaman/concurrent-map"
	"github.com/tidwall/gjson"
)

func localeList(w http.ResponseWriter, req *http.Request, c chan []byte) {
	fmt.Println("> localeListHandleFunc")
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
		getLocale()
	}
	if localeLists == nil {
		getLocale()
		if localeLists == nil {
			c <- nyahttphandle.AlertInfoJson(w, localeID, 9001)
			return
		}
	}
	c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 10000, "", localeLists)
}

func localeAdd(w http.ResponseWriter, req *http.Request, c chan []byte) {
	fmt.Println("> localeAddHandleFunc")
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
	fromcode, ishcode := req.Form["code"]
	fromname, ishname := req.Form["name"]
	var missingParameter []string
	if !isht {
		missingParameter = append(missingParameter, "t")
	}
	if !ishid {
		missingParameter = append(missingParameter, "id")
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
	key := "`id`,`code`,`name`"
	val := "'" + fromid[0] + "','" + fromcode[0] + "','" + fromname[0] + "'"
	nyaMS := mysqlIsRun()
	if nyaMS == nil {
		c <- nyahttphandle.AlertInfoJson(w, localeID, 9000)
		return
	}
	_, err := nyaMS.AddRecord("account_locale", key, val, "", nil)
	mysqlClose(nyaMS)
	if err != nil {
		errs := strings.Split(err.Error(), "PRIMARY")
		if len(errs) == 2 {
			c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9001, "err", "`code`已存在: "+err.Error())
			return
		}
		errs = strings.Split(err.Error(), "UNIQUE")
		if len(errs) == 2 {
			c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9001, "err", "`id`已存在: "+err.Error())
			return
		}
		c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9001, "err", err.Error())
		return
	}
	getLocale()
	c <- nyahttphandle.AlertInfoJson(w, localeID, 10000)
}

func localeDelete(w http.ResponseWriter, req *http.Request, c chan []byte) {
	fmt.Println("> localeDeleteHandleFunc")
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
	fromcode, ishcode := req.Form["code"]
	var missingParameter []string
	if !isht {
		missingParameter = append(missingParameter, "t")
	}
	if !ishid && !ishcode {
		missingParameter = append(missingParameter, "id")
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
	key := ""
	val := ""
	if ishcode {
		key = "code"
		val = fromcode[0]
	} else {
		key = "id"
		val = fromid[0]
	}
	err = nyaMS.DeleteRecord("account_locale", key, val, "", "", nil)
	mysqlClose(nyaMS)
	if err != nil {
		c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9001, "err", err.Error())
		return
	}
	getLocale()
	c <- nyahttphandle.AlertInfoJson(w, localeID, 10000)
}

func localeListHandleFunc(w http.ResponseWriter, req *http.Request) {
	wg := sync.WaitGroup{}
	wg.Add(1)
	c := make(chan []byte)
	go localeList(w, req, c)
	re := <-c
	wg.Done()
	w.Write(re)
	wg.Wait()
}

func localeAddHandleFunc(w http.ResponseWriter, req *http.Request) {
	wg := sync.WaitGroup{}
	wg.Add(1)
	c := make(chan []byte)
	go localeAdd(w, req, c)
	re := <-c
	wg.Done()
	w.Write(re)
	wg.Wait()
}

func localeDeleteHandleFunc(w http.ResponseWriter, req *http.Request) {
	wg := sync.WaitGroup{}
	wg.Add(1)
	c := make(chan []byte)
	go localeDelete(w, req, c)
	re := <-c
	wg.Done()
	w.Write(re)
	wg.Wait()
}

func getLocale() {
	nyaMS := mysqlIsRun()
	if nyaMS == nil {
		fmt.Println("打开数据库失败")
		return
	}
	qd, err := nyaMS.QueryData("*", "account_locale", "", "", "", nil)
	mysqlClose(nyaMS)
	if err != nil {
		fmt.Println("查询数据库'account_locale'失败" + err.Error())
		return
	}
	if qd.Count() == 0 {
		fmt.Println("没有返回数据")
		return
	}
	localeLists.Clear()
	for item := range qd.IterBuffered() {
		itemcmap := item.Val.(cmap.ConcurrentMap)
		var locale []interface{}

		idstr, ish := itemcmap.Get("id")
		if !ish {
			continue
		}
		id, err := strconv.Atoi(idstr.(string))
		if err != nil {
			continue
		}
		locale = append(locale, id)
		name, ish := itemcmap.Get("name")
		if !ish {
			continue
		}
		locale = append(locale, name)

		code, ish := itemcmap.Get("code")
		if !ish {
			continue
		}
		localeLists.Set(code.(string), locale)
	}
}
