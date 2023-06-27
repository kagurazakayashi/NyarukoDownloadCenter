package main

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/kagurazakayashi/libNyaruko_Go/nyacrypt"
	"github.com/kagurazakayashi/libNyaruko_Go/nyahttphandle"
	"github.com/kagurazakayashi/libNyaruko_Go/nyaredis"
	cmap "github.com/orcaman/concurrent-map"
	"github.com/tidwall/gjson"
)

func userInfo(w http.ResponseWriter, req *http.Request, c chan []byte) {
	fmt.Println("> userInfoHandleFunc")
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

	userInfoJson := "{\"user\":" + getUserInfo + "}"
	userInfo := cmap.New()
	gjson.Get(userInfoJson, "user").ForEach(func(key, value gjson.Result) bool {
		switch key.String() {
		case "enable":
			return true
		case "creation_date", "modification_date", "disable_startdate", "disable_enddate":
			if len(value.String()) == 10 {
				number, err := strconv.Atoi(value.String())
				if err != nil {
					userInfo.Set(key.String(), value.String())
					return true
				}
				userInfo.Set(key.String(), number)
			} else {
				if value.String() == "" {
					userInfo.Set(key.String(), -1)
				} else {
					userInfo.Set(key.String(), value.String())
				}
			}
		case "permissions_id":
			number, err := strconv.Atoi(value.String())
			if err != nil {
				userInfo.Set(key.String(), value.String())
				return true
			}
			userInfo.Set(key.String(), number)
		default:
			userInfo.Set(key.String(), value.String())
		}
		return true
	})
	c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 10000, "", userInfo)
}

func userList(w http.ResponseWriter, req *http.Request, c chan []byte) {
	fmt.Println("> userListHandleFunc")
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
	// var missingParameter []string
	// if !isht {
	// 	missingParameter = append(missingParameter, "t")
	// }
	// if len(missingParameter) != 0 {
	// 	c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 2040, "err", missingParameter)
	// 	return
	// }

	isAdmin := false
	if isht {
		getUserInfo, locale_id, code := isOnLine(fromt[0])
		if code != -1 {
			c <- nyahttphandle.AlertInfoJson(w, localeID, code)
			return
		}
		localeID = locale_id
		permissions_id := gjson.Get(getUserInfo, "permissions_id")
		if permissions_id.Exists() && permissions_id.String() == adminPermissionsID {
			isAdmin = true
		}
	}

	isSearch := false
	froms, ishs := req.Form["s"]
	if ishs {
		if froms[0] == "1" {
			isSearch = true
		}
	}
	if !isSearch {
		if !isAdmin {
			c <- nyahttphandle.AlertInfoJson(w, localeID, 4004)
			return
		}
	}

	nyaMS := mysqlIsRun()
	if nyaMS == nil {
		c <- nyahttphandle.AlertInfoJson(w, localeID, 9000)
		return
	}
	where := ""
	orderby := "`creation_date` ASC"
	limit := ""
	fromusername, ishusername := req.Form["username"]
	if ishusername && fromusername[0] != "" {
		where = "`username` LIKE '%" + fromusername[0] + "%'"
	}
	fromenable, ishenable := req.Form["enable"]
	if ishenable {
		switch fromenable[0] {
		case "0":
			if where != "" {
				where += " AND "
			}
			where += "`enable`='0'"
		case "1":
			if where != "" {
				where += " AND "
			}
			where += "`enable`='1'"
		case "2":
		}
	} else {
		if where != "" {
			where += " AND "
		}
		where += "`enable`='1'"
	}
	fromoffset, ishoffset := req.Form["offset"]
	fromrows, ishrows := req.Form["rows"]
	if ishoffset {
		limit = fromoffset[0] + ","
		if ishrows {
			limit += fromrows[0]
		} else {
			limit += "20"
		}
	}
	fhashsCount := 0
	qd, err := nyaMS.QueryData("count(*)", "account_user", where, orderby, "", nil)
	if err != nil {
		c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9001, "err", "查询数据库'account_user'失败"+err.Error())
		return
	}
	for i := 0; i < qd.Count(); i++ {
		stri := strconv.Itoa(i)
		item, ish := qd.Get(stri)
		if !ish {
			continue
		}
		itemcmap := item.(cmap.ConcurrentMap)
		cont, ish := itemcmap.Get("count(*)")
		if ish {
			count, err := strconv.Atoi(cont.(string))
			if err == nil {
				fhashsCount = count
			}
		}
	}

	qd, err = nyaMS.QueryData("*", "account_user", where, orderby, limit, nil)
	mysqlClose(nyaMS)
	if err != nil {
		c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9001, "err", "查询数据库'account_user'失败"+err.Error())
		return
	}
	if qd.Count() == 0 {
		c <- nyahttphandle.AlertInfoJson(w, localeID, 4003)
		return
	}
	var datas []interface{}
	for i := 0; i < qd.Count(); i++ {
		str := strconv.Itoa(i)
		item, ish := qd.Get(str)
		if !ish {
			continue
		}
		itemcmap := item.(cmap.ConcurrentMap)
		if isSearch {
			u, ish := itemcmap.Get("username")
			if ish {
				if u.(string) != "admin" && u.(string) != "tongdy" {
					datas = append(datas, u)
				}
			}
		} else {
			itemcmap.Remove("password")
			userInfo := cmap.New()
			for m := range itemcmap.IterBuffered() {
				val := m.Val.(string)
				switch m.Key {
				case "enable":
					userInfo.Set(m.Key, val)
				case "creation_date", "modification_date", "disable_startdate", "disable_enddate":
					if len(val) == 10 {
						number, err := strconv.Atoi(val)
						if err != nil {
							userInfo.Set(m.Key, val)
						}
						userInfo.Set(m.Key, number)
					} else {
						if val == "" {
							userInfo.Set(m.Key, -1)
						} else {
							userInfo.Set(m.Key, val)
						}
					}
				case "permissions_id":
					number, err := strconv.Atoi(val)
					if err != nil {
						userInfo.Set(m.Key, val)
					}
					userInfo.Set(m.Key, number)
				case "locale_code":
					userInfo.Set(m.Key, val)
					if m, ok := localeLists.Get(val); ok {
						mv := m.([]interface{})
						if len(mv) == 2 {
							userInfo.Set("locale_id", mv[0])
							userInfo.Set("locale", mv[1])
						}
					}
				default:
					userInfo.Set(m.Key, val)
				}
			}
			datas = append(datas, userInfo)
		}
	}
	redata := cmap.New()
	redata.Set("data", datas)
	redata.Set("total", fhashsCount)
	if ishoffset {
		offset, err := strconv.Atoi(fromoffset[0])
		if err != nil {
			redata.Set("offset", fromoffset[0])
		} else {
			redata.Set("offset", offset)
		}
	} else {
		redata.Set("offset", 0)
	}
	if ishrows {
		rows, err := strconv.Atoi(fromrows[0])
		if err != nil {
			redata.Set("rows", fromoffset[0])
		} else {
			redata.Set("rows", rows)
		}
	} else {
		redata.Set("rows", 20)
	}
	c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 10000, "", redata)
}

func login(w http.ResponseWriter, req *http.Request, c chan []byte) {
	fmt.Println("> loginHandleFunc")
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
	// t := req.Header.Get("token")
	// fmt.Println(t)

	req.ParseMultipartForm(32 << 20)
	fromusername, ishusername := req.Form["username"]
	frompassword, ishpassword := req.Form["password"]
	fromisScan, ishisScan := req.Form["isScan"]
	fromverify, ishverify := req.Form["verify"]
	var missingParameter []string
	if !ishusername {
		missingParameter = append(missingParameter, "username")
	}
	if !ishpassword {
		missingParameter = append(missingParameter, "password")
	}
	if len(missingParameter) != 0 {
		c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 2040, "err", missingParameter)
		return
	}
	username := fromusername[0]
	password := frompassword[0]

	nyaMS := mysqlIsRun()
	if nyaMS == nil {
		c <- nyahttphandle.AlertInfoJson(w, localeID, 9000)
		return
	}
	where := "`username`='" + username + "'"
	qd, err := nyaMS.QueryData("*", "account_user", where, "", "", nil)
	if err != nil {
		mysqlClose(nyaMS)
		c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9001, "err", "查询数据库'account_user'失败"+err.Error())
		return
	}
	if qd.Count() == 0 {
		mysqlClose(nyaMS)
		c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 4003, "err", "没有找到用户")
		return
	}
	where += " AND `password`='" + nyacrypt.SHA512String(password, "") + "'"
	qd, err = nyaMS.QueryData("*", "account_user", where, "", "", nil)
	if err != nil {
		mysqlClose(nyaMS)
		c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9001, "err", "查询数据库'account_user'失败"+err.Error())
		return
	}
	localeCode := ""
	if qd.Count() == 0 {
		mysqlClose(nyaMS)
		c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 4001, "err", "密码错误")
		return
	} else {
		userhash := ""
		redisVal := cmap.New()
		for i := 0; i < qd.Count(); i++ {
			stri := strconv.Itoa(i)
			item, ish := qd.Get(stri)
			if !ish {
				continue
			}
			itemHash, ish := item.(cmap.ConcurrentMap).Get("hash")
			if !ish {
				continue
			}
			userhash = itemHash.(string)
			itemEnable, ish := item.(cmap.ConcurrentMap).Get("enable")
			if !ish {
				mysqlClose(nyaMS)
				c <- nyahttphandle.AlertInfoJson(w, localeID, 3999)
				return
			} else {
				if itemEnable.(string) == "0" {
					isAllowDelete := true
					itemDisableEndDate, ish := item.(cmap.ConcurrentMap).Get("disable_enddate")
					if !ish || (ish && itemDisableEndDate.(string) == "") {
						mysqlClose(nyaMS)
						c <- nyahttphandle.AlertInfoJson(w, localeID, 3999)
						return
					}
					if ish && itemDisableEndDate.(string) != "" {
						disableEndDate, err := strconv.ParseInt(itemDisableEndDate.(string), 10, 64)
						if err == nil {
							if time.Now().Unix() > disableEndDate {
								isAllowDelete = false
								_, err = nyaMS.UpdataRecord("account_user", "`enable`='1',`disable_startdate`=NULL,`disable_enddate`=NULL", "`hash`='"+userhash+"'", nil)
								if err != nil {
									mysqlClose(nyaMS)
									c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9001, "err", "修改用户状态失败")
									return
								}
							}
						}
					}
					if isAllowDelete {
						mysqlClose(nyaMS)
						c <- nyahttphandle.AlertInfoJson(w, localeID, 3999)
						return
					}
				}
			}
			itemLocaleCode, ish := item.(cmap.ConcurrentMap).Get("locale_code")
			if !ish {
				continue
			}
			if m, ok := item.(cmap.ConcurrentMap).Get("permissions_id"); ok {
				if pid, ok := permissionsLists.Get(m.(string)); ok {
					item.(cmap.ConcurrentMap).Set("permissions", pid)
				}
			}
			localeCode = itemLocaleCode.(string)
			redisVal = item.(cmap.ConcurrentMap)
		}
		mysqlClose(nyaMS)
		if ishverify && fromverify[0] == "1" {
			if userhash == "" {
				c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 20000, "", "")
			} else {
				c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 10000, "", "")
			}
			return
		}
		if userhash == "" {
			c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 4003, "err", "没有找到用户")
			return
		}
		localeID := defaultLocaleID
		if m, ok := localeLists.Get(localeCode); ok {
			mv := m.([]interface{})
			if len(mv) == 2 {
				localeID = mv[0].(int)
				redisVal.Set("locale_id", mv[0])
				redisVal.Set("locale", mv[1])
			}
		}

		nyaR := redisIsRun()
		if nyaR == nil {
			c <- nyahttphandle.AlertInfoJson(w, localeID, 9010)
			return
		}
		timestamp := strconv.FormatInt(time.Now().Unix(), 10)
		redisKey := nyacrypt.MD5String(username+timestamp, "")
		redisVal.Remove("password")
		bytes, err := redisVal.MarshalJSON()
		if err != nil {
			redisClose(nyaR)
			c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9999, "err", "用户信息转换失败："+err.Error())
			return
		}
		TTLtime := 1800
		if ishisScan && fromisScan[0] == "0" {
			TTLtime = 36000
		}
		if nyaR.SetString("s_"+redisKey, string(bytes), nyaredis.Option_autoDelete(TTLtime)) {
			c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 10000, "", redisKey)
		} else {
			c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9011, "err", nyaR.ErrorString())
		}
		redisClose(nyaR)
	}
}

func logout(w http.ResponseWriter, req *http.Request, c chan []byte) {
	fmt.Println("> logoutHandleFunc")
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

	nyaR := redisIsRun()
	if nyaR == nil {
		c <- nyahttphandle.AlertInfoJson(w, localeID, 9010)
		return
	}
	getstr := nyaR.GetString("s_"+fromt[0], nyaredis.Option_isDelete(true))
	redisClose(nyaR)
	if getstr != "" {
		c <- nyahttphandle.AlertInfoJson(w, localeID, 10000)
	} else {
		c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9999, "err", "token无效")
	}
}

func userAdd(w http.ResponseWriter, req *http.Request, c chan []byte) {
	fmt.Println("> userAddHandleFunc")
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
	var missingParameter []string
	if !OpenRegistration {
		fromt, isht := req.Form["t"]
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
		if !permissions_id.Exists() || (permissions_id.Exists() && permissions_id.Int() != 1) {
			c <- nyahttphandle.AlertInfoJson(w, localeID, 4004)
			return
		}
	}
	fromgroupCode, ishgroupCode := req.Form["groupCode"]
	frompId, ishpId := req.Form["pid"]
	fromusername, ishusername := req.Form["username"]
	frompassword, ishpassword := req.Form["password"]
	fromnickname, ishnickname := req.Form["nickname"]
	fromlocaleCode, ishlocaleCode := req.Form["localeCode"]
	if !ishgroupCode {
		missingParameter = append(missingParameter, "groupCode")
	}
	groupCode := fromgroupCode[0]
	permissionsId := "3"
	if ishpId {
		permissionsId = frompId[0]
		if permissionsId == adminPermissionsID {
			c <- nyahttphandle.AlertInfoJson(w, localeID, 4004)
		}
	}
	if !ishusername {
		missingParameter = append(missingParameter, "username")
	}
	username := fromusername[0]
	if !ishpassword {
		missingParameter = append(missingParameter, "password")
	}
	password := frompassword[0]
	nickname := ""
	if ishnickname {
		nickname = fromnickname[0]
	}
	localeCode := defaultLocale
	if ishlocaleCode {
		localeCode = fromlocaleCode[0]
	}
	if len(missingParameter) != 0 {
		c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 2040, "err", missingParameter)
		return
	}

	nyaMS := mysqlIsRun()
	if nyaMS == nil {
		c <- nyahttphandle.AlertInfoJson(w, localeID, 9000)
		return
	}
	timestamp := strconv.FormatInt(time.Now().Unix(), 10)
	timestamp2 := strconv.FormatInt(time.Now().UnixNano(), 10)
	hashstr := nyacrypt.SHA256String(username+timestamp2, "")
	key := "`hash`,`group_code`,`permissions_id`,`username`,`password`,`locale_code`,`creation_date`,`modification_date`"
	val := "'" + hashstr + "','" + groupCode + "','" + permissionsId + "','" + username + "','" + nyacrypt.SHA512String(password, "") + "','" + localeCode + "','" + timestamp + "','" + timestamp + "'"
	if nickname != "" {
		key += ",`nickname`"
		val += ",'" + nickname + "'"
	}
	addid, err := nyaMS.AddRecord("account_user", key, val, "", nil)
	mysqlClose(nyaMS)
	if err != nil {
		reError := strings.Split(err.Error(), "account_user.username_UNIQUE")
		if len(reError) > 1 {
			c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9001, "err", "用户：'"+username+"' 已存在")
			return
		}
		c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9001, "err", "'account_user'添加失败:"+err.Error())
		return
	}
	c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 10000, "", "添加用户'"+username+"'成功:"+strconv.Itoa(int(addid)))
}

func userEdit(w http.ResponseWriter, req *http.Request, c chan []byte) {
	fmt.Println("> userEditHandleFunc")
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
	if !isht {
		c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 2040, "err", "未提供'token'")
		return
	}

	getUserInfo, locale_id, code := isOnLine(fromt[0])
	if code != -1 {
		c <- nyahttphandle.AlertInfoJson(w, localeID, code)
		return
	}
	localeID = locale_id
	set := ""

	fromgroupCode, ishgroupCode := req.Form["groupCode"]
	if ishgroupCode {
		gjInfo := gjson.Get(getUserInfo, "group_code")
		if gjInfo.Exists() && gjInfo.String() != fromgroupCode[0] {
			if set != "" {
				set += ","
			}
			set += "`group_code`='" + fromgroupCode[0] + "'"
		}
	}
	frompermissionsId, ishpermissionsId := req.Form["permissionsId"]
	if ishpermissionsId {
		gjInfo := gjson.Get(getUserInfo, "permissionsId")
		if gjInfo.Exists() && gjInfo.String() == adminPermissionsID {
			if set != "" {
				set += ","
			}
			set += "`permissions_id`='" + frompermissionsId[0] + "'"
		}
	}
	fromusername, ishusername := req.Form["username"]
	if ishusername {
		gjInfo := gjson.Get(getUserInfo, "username")
		if gjInfo.Exists() && gjInfo.String() != fromusername[0] {
			if set != "" {
				set += ","
			}
			set += "`username`='" + fromusername[0] + "'"
		}
	}
	isUpdatePassWord := false
	frompassword, ishpassword := req.Form["password"]
	if ishpassword {
		fromnewpassword, ishnewpassword := req.Form["newpassword"]
		if ishnewpassword {
			if set != "" {
				set += ","
			}
			set += "`password`='" + nyacrypt.SHA512String(fromnewpassword[0], "") + "'"
			isUpdatePassWord = true
		}
	} else {
		c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 2040, "err", "缺少参数'password'")
		return
	}
	fromnickname, ishnickname := req.Form["nickname"]
	if ishnickname {
		gjInfo := gjson.Get(getUserInfo, "nickname")
		if gjInfo.Exists() && gjInfo.String() != fromnickname[0] {
			if set != "" {
				set += ","
			}
			set += "`nickname`='" + fromnickname[0] + "'"
		}
	}
	fromlocaleCode, ishlocaleCode := req.Form["localeCode"]
	if ishlocaleCode {
		gjInfo := gjson.Get(getUserInfo, "locale_code")
		if gjInfo.Exists() && gjInfo.String() != fromlocaleCode[0] {
			if set != "" {
				set += ","
			}
			set += "`locale_code`='" + fromlocaleCode[0] + "'"
		}
	}
	nyaR := redisIsRun()
	if nyaR == nil {
		c <- nyahttphandle.AlertInfoJson(w, localeID, 9010)
		return
	}
	hashstr := ""
	if set == "" {
		redisClose(nyaR)
		c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 2041, "err", "有效参数不足或没有任何更改")
		return
	} else {
		fromhash, ishhash := req.Form["hash"]
		if ishhash {
			hashstr = fromhash[0]
		} else {
			hashstr = gjson.Get(getUserInfo, "hash").String()
		}
	}

	nyaMS := mysqlIsRun()
	if nyaMS == nil {
		c <- nyahttphandle.AlertInfoJson(w, localeID, 9000)
		return
	}
	fmt.Println("验证密码")
	where := "`hash`='" + hashstr + "' AND `password`='" + nyacrypt.SHA512String(frompassword[0], "") + "'"
	qd, err := nyaMS.QueryData("*", "account_user", where, "", "", nil)
	if err != nil {
		mysqlClose(nyaMS)
		redisClose(nyaR)
		c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9001, "err", "查询数据库'account_user'失败"+err.Error())
		return
	}
	if qd.Count() == 0 {
		mysqlClose(nyaMS)
		redisClose(nyaR)
		c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 4001, "err", "密码错误")
		return
	}

	fmt.Println("验证：", set)
	sets := strings.Split(set, ",")
	if len(sets) > 1 {
		where = strings.Join(sets, " AND ")
	} else {
		where = "`hash`='" + hashstr + "' AND " + set
	}
	qd, err = nyaMS.QueryData("*", "account_user", where, "", "", nil)
	if err != nil {
		mysqlClose(nyaMS)
		redisClose(nyaR)
		c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9001, "err", "查询数据库'account_user'失败"+err.Error())
		return
	}
	if qd.Count() > 0 {
		mysqlClose(nyaMS)
		redisClose(nyaR)
		c <- nyahttphandle.AlertInfoJson(w, localeID, 9009)
		return
	}

	where = "`hash`='" + hashstr + "'"

	if set != "" {
		set += ","
	}
	timestr := strconv.Itoa(int(time.Now().Unix()))
	set += "`modification_date`='" + timestr + "'"

	_, err = nyaMS.UpdataRecord("account_user", set, where, nil)
	if err != nil {
		reError := strings.Split(err.Error(), "account_user.username_UNIQUE")
		mysqlClose(nyaMS)
		redisClose(nyaR)
		if len(reError) > 1 {
			c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9001, "err", "用户：'"+fromusername[0]+"' 已存在")
			return
		}
		c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9001, "err", "更新数据失败："+err.Error())
		return
	}
	if isUpdatePassWord {
		nyaR.Delete([]string{"s_" + fromt[0]})
		mysqlClose(nyaMS)
		redisClose(nyaR)
		c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 10000, "", "资料更新成功，请重新登录")
	} else {
		where = "`hash`='" + hashstr + "'"
		qd, err := nyaMS.QueryData("*", "account_user", where, "", "", nil)
		if err != nil {
			mysqlClose(nyaMS)
			redisClose(nyaR)
			c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9001, "err", "查询数据库'account_user'失败"+err.Error())
			return
		}
		redisVal := cmap.New()
		for i := 0; i < qd.Count(); i++ {
			stri := strconv.Itoa(i)
			item, ish := qd.Get(stri)
			if !ish {
				continue
			}
			itemEnable, ish := item.(cmap.ConcurrentMap).Get("enable")
			if !ish || itemEnable.(string) == "0" {
				mysqlClose(nyaMS)
				redisClose(nyaR)
				c <- nyahttphandle.AlertInfoJson(w, localeID, 3999)
				return
			}
			redisVal = item.(cmap.ConcurrentMap)
		}
		redisVal.Remove("password")
		bytes, err := redisVal.MarshalJSON()
		if err != nil {
			mysqlClose(nyaMS)
			redisClose(nyaR)
			c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9999, "err", "用户信息转换失败："+err.Error())
			return
		}
		if !nyaR.SetString("s_"+fromt[0], string(bytes)) {
			mysqlClose(nyaMS)
			redisClose(nyaR)
			c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 10000, "", "资料更新成功，请重新登录")
		} else {
			mysqlClose(nyaMS)
			redisClose(nyaR)
			c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 10000, "", "资料更新成功")
		}
	}
}

func userDelete(w http.ResponseWriter, req *http.Request, c chan []byte) {
	fmt.Println("> userDeleteHandleFunc")
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
	fromh, ishh := req.Form["h"]
	var missingParameter []string
	if !isht {
		missingParameter = append(missingParameter, "t")
	}
	if !ishh {
		missingParameter = append(missingParameter, "h")
	}
	if len(missingParameter) != 0 {
		c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 2040, "err", missingParameter)
		return
	}

	isAllowDelete := false
	getUserInfo, locale_id, code := isOnLine(fromt[0])
	if code != -1 {
		c <- nyahttphandle.AlertInfoJson(w, localeID, code)
		return
	}
	localeID = locale_id
	hashjson := gjson.Get(getUserInfo, "hash")
	if hashjson.Exists() {
		if hashjson.String() == fromh[0] {
			isAllowDelete = true
		} else {
			permissionJson := gjson.Get(getUserInfo, "permissions_id")
			if permissionJson.Exists() && permissionJson.String() == adminPermissionsID {
				isAllowDelete = true
			}
		}
	}

	if !isAllowDelete {
		c <- nyahttphandle.AlertInfoJson(w, localeID, 4004)
		return
	}

	fromenable, ishenable := req.Form["enable"]
	fromdstart, ishdstart := req.Form["dstart"]
	fromdend, ishdend := req.Form["dend"]
	if ishenable {
		updata := "`enable`='" + fromenable[0] + "'"
		if fromenable[0] == "0" {
			if ishdstart {
				if len(fromdstart[0]) != 10 {
					c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 2041, "err", "参数'dstart'长度不正确,应为10位整数")
				}
				_, err := strconv.Atoi(fromdstart[0])
				if err != nil {
					c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 2041, "err", "参数'dstart'不正确,应为10位整数")
				}
				updata += ",`disable_startdate`='" + fromdstart[0] + "'"
			}
			if ishdend {
				if len(fromdend[0]) != 10 {
					c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 2041, "err", "参数'dend'长度不正确,应为10位整数")
				}
				_, err := strconv.Atoi(fromdend[0])
				if err != nil {
					c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 2041, "err", "参数'dstart'不正确,应为10位整数")
				}
				updata += ",`disable_enddate`='" + fromdend[0] + "'"
			}
		}
		where := "`hash`='" + fromh[0] + "'"
		nyaMS := mysqlIsRun()
		if nyaMS == nil {
			c <- nyahttphandle.AlertInfoJson(w, localeID, 9000)
			return
		}
		_, err = nyaMS.UpdataRecord("account_user", updata, where, nil)
		mysqlClose(nyaMS)
		if err != nil {
			c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9001, "err", "修改数据库'account_user'失败"+err.Error())
			return
		}
	} else {
		nyaMS := mysqlIsRun()
		if nyaMS == nil {
			c <- nyahttphandle.AlertInfoJson(w, localeID, 9000)
			return
		}
		err = nyaMS.DeleteRecord("account_user", "hash", fromh[0], "", "", nil)
		mysqlClose(nyaMS)
		if err != nil {
			c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9001, "err", "修改数据库'account_user'失败"+err.Error())
			return
		}
	}
	c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 10000, "", "Done")
}

func userInfoHandleFunc(w http.ResponseWriter, req *http.Request) {
	wg := sync.WaitGroup{}
	wg.Add(1)
	c := make(chan []byte)
	go userInfo(w, req, c)
	re := <-c
	wg.Done()
	w.Write(re)
	wg.Wait()
}

func userListHandleFunc(w http.ResponseWriter, req *http.Request) {
	wg := sync.WaitGroup{}
	wg.Add(1)
	c := make(chan []byte)
	go userList(w, req, c)
	re := <-c
	wg.Done()
	w.Write(re)
	wg.Wait()
}

func userloginHandleFunc(w http.ResponseWriter, req *http.Request) {
	wg := sync.WaitGroup{}
	wg.Add(1)
	c := make(chan []byte)
	go login(w, req, c)
	re := <-c
	wg.Done()
	w.Write(re)
	wg.Wait()
}

func userlogoutHandleFunc(w http.ResponseWriter, req *http.Request) {
	wg := sync.WaitGroup{}
	wg.Add(1)
	c := make(chan []byte)
	go logout(w, req, c)
	re := <-c
	wg.Done()
	w.Write(re)
	wg.Wait()
}

func userAddHandleFunc(w http.ResponseWriter, req *http.Request) {
	wg := sync.WaitGroup{}
	wg.Add(1)
	c := make(chan []byte)
	go userAdd(w, req, c)
	re := <-c
	wg.Done()
	w.Write(re)
	wg.Wait()
}

func userEditHandleFunc(w http.ResponseWriter, req *http.Request) {
	wg := sync.WaitGroup{}
	wg.Add(1)
	c := make(chan []byte)
	go userEdit(w, req, c)
	re := <-c
	wg.Done()
	w.Write(re)
	wg.Wait()
}

func userDeleteHandleFunc(w http.ResponseWriter, req *http.Request) {
	wg := sync.WaitGroup{}
	wg.Add(1)
	c := make(chan []byte)
	go userDelete(w, req, c)
	re := <-c
	wg.Done()
	w.Write(re)
	wg.Wait()
}

func isOnLine(t string) (string, int, int) {
	nyaR := redisIsRun()
	if nyaR == nil {
		redisLink -= 1
		return "", -1, 9010
	}
	getstr := nyaR.GetString("s_" + t)
	if getstr == "" {
		redisClose(nyaR)
		fmt.Println("s_" + t + "<<<")
		return "", -1, 3900
	} else {
		gjEnable := gjson.Get(getstr, "enable")
		if gjEnable.Exists() {
			if gjEnable.Int() == 0 {
				nyaR.Delete([]string{"s_" + t})
				redisClose(nyaR)
				return "", -1, 3999
			}
		}
		uhash := gjson.Get(getstr, "hash")
		if !uhash.Exists() {
			nyaR.Delete([]string{"s_" + t})
			redisClose(nyaR)
			return "", -1, 3901
		}
		if len(uhash.String()) != 64 {
			nyaR.Delete([]string{"s_" + t})
			redisClose(nyaR)
			return "", -1, 3901
		}
		// permissions_id := gjson.Get(getstr, "permissions_id")
		// if !permissions_id.Exists() {
		// 	nyaR.Delete([]string{"s_" + t})
		// 	redisClose(nyaR)
		// 	return "", 3901
		// }
		locale_id := gjson.Get(getstr, "locale_id")
		if !locale_id.Exists() {
			redisClose(nyaR)
			return "", -1, 3901
		}
		redisClose(nyaR)
		return getstr, int(locale_id.Int()), -1
	}
}
