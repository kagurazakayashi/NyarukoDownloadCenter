package main

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"reflect"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/kagurazakayashi/libNyaruko_Go/nyacrypt"
	"github.com/kagurazakayashi/libNyaruko_Go/nyahttphandle"
	"github.com/kagurazakayashi/libNyaruko_Go/nyamysql"
	cmap "github.com/orcaman/concurrent-map"
	"github.com/tidwall/gjson"
)

func fileList(w http.ResponseWriter, req *http.Request, c chan []byte) {
	fmt.Println("> fileListHandleFunc")
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
	uhash := gjson.Get(getUserInfo, "hash").String()
	permissions_id := gjson.Get(getUserInfo, "permissions_id")
	fromuhash, ishuhash := req.Form["uhash"]
	if permissions_id.Exists() && permissions_id.Int() == 1 && ishuhash {
		uhash = fromuhash[0]
	}
	nyaMS := mysqlIsRun()
	if nyaMS == nil {
		c <- nyahttphandle.AlertInfoJson(w, localeID, 9000)
		return
	}
	where := "`user_hash`='" + uhash + "'"
	qd, err := nyaMS.QueryData("*", "file_ascription", where, "", "", nil)
	if err != nil {
		mysqlClose(nyaMS)
		c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9001, "err", "查询'file_ascription'失败:"+err.Error())
		return
	}
	fhashs := ""
	fhashsCount := 0
	fas := cmap.New()
	for item := range qd.IterBuffered() {
		itemcmap := item.Val.(cmap.ConcurrentMap)
		icmapFileHash, ish := itemcmap.Get("file_hash")
		if !ish {
			continue
		}
		if fhashs != "" {
			fhashs += ","
		}
		fhashs += "'" + icmapFileHash.(string) + "'"
		fhashsCount += 1
		icmapFolderPath, ish := itemcmap.Get("folder_path")
		if ish {
			fas.Set(icmapFileHash.(string), icmapFolderPath)
		}
	}
	if fhashs == "" {
		redata := cmap.New()
		mysqlClose(nyaMS)
		c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 10001, "", redata)
		return
	}
	where = "`hash` IN (" + fhashs + ")"
	orderby := "`name` ASC"
	fromoffset, ishoffset := req.Form["offset"]
	fromrows, ishrows := req.Form["rows"]
	limit := ""
	if ishoffset {
		limit = fromoffset[0] + ","
		if ishrows {
			limit += fromrows[0]
		} else {
			limit += "20"
		}
	}
	fromname, ishname := req.Form["name"]
	if ishname {
		where += " AND `name` LIKE '%" + fromname[0] + "%'"
	}
	fromlocaleCode, ishLocaleCode := req.Form["localeCode"]
	if ishLocaleCode && fromlocaleCode[0] != "" {
		where += " AND `locale_code` = '" + fromlocaleCode[0] + "'"
	}
	qd, err = nyaMS.QueryData("count(*)", "file_files", where, orderby, "", nil)
	if err != nil {
		c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9001, "err", "查询'file_files'失败:"+err.Error())
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

	qd, err = nyaMS.QueryData("*", "file_files", where, orderby, limit, nil)
	mysqlClose(nyaMS)
	if err != nil {
		c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9001, "err", "查询'file_files'失败:"+err.Error())
		return
	}
	bytes, _ := fas.MarshalJSON()
	fmt.Println(string(bytes))
	// var datas []cmap.ConcurrentMap
	filePath := cmap.New()
	for i := 0; i < qd.Count(); i++ {
		stri := strconv.Itoa(i)
		item, ish := qd.Get(stri)
		if !ish {
			continue
		}
		itemcmap := item.(cmap.ConcurrentMap)
		itemcmap.Remove("path")

		fhash, ish := itemcmap.Get("hash")
		if ish {
			fa, ish := fas.Get(fhash.(string))
			if ish {
				if reflect.TypeOf(fa).Name() == "string" {
					folder_path := strings.Split(fa.(string), "/")
					if len(folder_path) == 2 && folder_path[1] == "" {
						var _fp []cmap.ConcurrentMap
						filePath_list, ish := filePath.Get("fileList")
						if ish {
							_fp = filePath_list.([]cmap.ConcurrentMap)
						}
						_fp = append(_fp, itemcmap)
						filePath.Set("fileList", _fp)
					} else if len(folder_path) >= 2 {
						thisFP := filePath
						for i := 1; i < len(folder_path); i++ {
							if i > 1 {
								cmapFP, ish := thisFP.Get(folder_path[i-1])
								if ish {
									thisFP = cmapFP.(cmap.ConcurrentMap)
								}
							}
							var _fp []cmap.ConcurrentMap
							if folder_path[i] != "" {
								_, ish := thisFP.Get(folder_path[i])
								if !ish {
									thisFP.Set(folder_path[i], cmap.New())
								}
							} else {
								filePath_list, ish := thisFP.Get("fileList")
								if ish {
									_fp = filePath_list.([]cmap.ConcurrentMap)
								}
								_fp = append(_fp, itemcmap)
								thisFP.Set("fileList", _fp)
							}
							// folderPathI,ish:=filePath.Get(folder_path[i])
						}
					}
				}
			}
		}
		// datas = append(datas, itemcmap)
	}
	// bytes, _ := filePath.MarshalJSON()
	// fmt.Println(string(bytes))
	redata := cmap.New()
	redata.Set("data", filePath)
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

func fileUpdata(w http.ResponseWriter, req *http.Request, c chan []byte) {
	fmt.Println("> fileUpdataHandleFunc")
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
	// fmt.Println(req.Header, "\n", req.Form, "\n", req)
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
	fromuhash, ishuhash := req.Form["uhash"]
	if !OpenUPFile {
		if !permissions_id.Exists() || (permissions_id.Exists() && permissions_id.Int() != 1) {
			c <- nyahttphandle.AlertInfoJson(w, localeID, 4004)
			return
		}
		if !ishuhash {
			missingParameter = append(missingParameter, "uhash")
		}
	}
	fromfolderPath, ishfolderPath := req.Form["folderPath"]
	if !ishfolderPath {
		missingParameter = append(missingParameter, "folderPath")
	}
	if len(missingParameter) != 0 {
		c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 2040, "err", missingParameter)
		return
	}
	upf, fhandle, err := req.FormFile("f")
	if err != nil {
		c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9999, "err", "读取参数'f'出错:"+err.Error())
		return
	}

	//生成文件地址
	fileInfo := strings.Split(fhandle.Filename, ".")
	fileType := fileInfo[len(fileInfo)-1]
	fileName := ""
	for i, v := range fileInfo {
		if i == len(fileInfo)-1 {
			continue
		}
		fileName += v
	}
	nowtime := fmt.Sprint(time.Now().Unix())
	filePath := saveFolder + "/" + fileName + "_" + nowtime + "." + fileType

	fileHash := ""
	if fhandle.Size < bigFileSize {
		fileHash, err = nyacrypt.SHA256File(upf, "")
		if err != nil {
			upf.Close()
			c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9999, "err", err.Error())
			return
		}
		_, err := upf.Seek(0, 0)
		if err != nil {
			upf.Close()
			c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9999, "err", "Seek err: "+err.Error())
			return
		}
	} else {
		f, err := os.Create(filePath)
		if err != nil {
			upf.Close()
			c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9300, "err", "创建文件失败:"+err.Error())
			return
		}
		_, err = io.Copy(f, upf)
		if err != nil {
			upf.Close()
			f.Close()
			c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9300, "err", "文件保存失败"+err.Error())
			return
		}
		upf.Close()

		fileHash, err = nyacrypt.SHA256FileBig(f, "", -1)
		if err != nil {
			f.Close()
			os.Remove(filePath)
			c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9999, "err", err.Error())
			return
		}
		f.Close()
	}
	nyaMS := mysqlIsRun()
	if nyaMS == nil {
		os.Remove(filePath)
		c <- nyahttphandle.AlertInfoJson(w, localeID, 9000)
		return
	}
	key := "`hash`,`name`,`describe`,`locale_code`,`creation_date`,`modification_date`,`path`,`size`"
	val := "'" + fileHash + "','" + fhandle.Filename + "','"
	fromdescribe, ishdescribe := req.Form["describe"]
	if ishdescribe {
		val += fromdescribe[0] + "','"
	} else {
		val += "','"
	}
	fromlocaleCode, ishLocaleCode := req.Form["localeCode"]
	if ishLocaleCode {
		val += fromlocaleCode[0] + "','"
	} else {
		val += defaultLocale + "','"
	}
	isdelFile := false
	val += nowtime + "','" + nowtime + "','" + filePath + "','" + strconv.Itoa(int(fhandle.Size)) + "'"
	_, err = nyaMS.AddRecord("file_files", key, val, "", nil)
	if err != nil {
		errs := strings.Split(err.Error(), "PRIMARY")
		isdelFile = true
		os.Remove(filePath)
		if len(errs) != 2 {
			mysqlClose(nyaMS)
			c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9001, "err", "文件添加失败:"+err.Error())
			return
		}
	}
	if fhandle.Size < bigFileSize {
		if !isdelFile {
			f, err := os.Create(filePath)
			if err != nil {
				mysqlClose(nyaMS)
				upf.Close()
				c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9300, "err", "创建文件失败:"+err.Error())
				return
			}
			_, err = io.Copy(f, upf)
			if err != nil {
				mysqlClose(nyaMS)
				upf.Close()
				f.Close()
				os.Remove(filePath)
				c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9300, "err", "文件保存失败"+err.Error())
				return
			}
			f.Close()
		}
		upf.Close()
	}

	uhash := gjson.Get(getUserInfo, "hash").String()
	if !OpenUPFile {
		uhash = fromuhash[0]
	}
	sqlstr := "call `f_a_add`('" + uhash + "', '" + fileHash + "', '" + fromfolderPath[0] + "', @isadd);"
	fd, err := nyaMS.FreequeryData(sqlstr, nil)
	if err != nil {
		errs := strings.Split(err.Error(), "foreign key constraint fails")
		if len(errs) >= 2 {
			mysqlClose(nyaMS)
			c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9001, "err", "文件归属错误添加失败:"+err.Error())
			return
		}
	}
	bytes, _ := fd.MarshalJSON()
	fmt.Println("f_a_add:", string(bytes))
	if fd.Count() > 0 {
		imisadd, ish := fd.Get("0")
		if ish {
			isadd, ish := imisadd.(cmap.ConcurrentMap).Get("isadd")
			if ish {
				if isadd.(string) == "0" {
					mysqlClose(nyaMS)
					c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9300, "err", "你已拥有此文件")
					return
				}
			}
		}
	}
	c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 10000, "", fileHash)
}

func fileDownload(w http.ResponseWriter, req *http.Request, c chan []byte) {
	fmt.Println("> fileDownloadHandleFunc", time.Now().In(cstSh).Format(timestyle))
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
	fromfh, ishfh := req.Form["fh"]
	var missingParameter []string
	if !isht {
		missingParameter = append(missingParameter, "t")
	}
	if !ishfh {
		missingParameter = append(missingParameter, "fh")
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
	uhash := gjson.Get(getUserInfo, "hash").String()
	permissions_id := gjson.Get(getUserInfo, "permissions_id")
	nyaMS := mysqlIsRun()
	if nyaMS == nil {
		c <- nyahttphandle.AlertInfoJson(w, localeID, 9000)
		return
	}
	if !permissions_id.Exists() || (permissions_id.Exists() && permissions_id.Int() != 1) {
		where := "`user_hash`='" + uhash + "' AND `file_hash`='" + fromfh[0] + "'"
		qd, err := nyaMS.QueryData("*", "file_ascription", where, "", "", nil)
		if err != nil {
			mysqlClose(nyaMS)
			c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9001, "err", "查询'file_ascription'失败:"+err.Error())
			return
		}
		if qd.Count() == 0 {
			mysqlClose(nyaMS)
			c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9300, "err", "文件不存在")
			return
		}
	}
	where := "`hash`='" + fromfh[0] + "'"
	qd, err := nyaMS.QueryData("*", "file_files", where, "", "", nil)
	if err != nil {
		c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9001, "err", "查询'file_files'失败:"+err.Error())
		return
	}
	if qd.Count() == 0 {
		c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9001, "err", "没有找到文件")
		return
	}
	enabled := ""
	exist := ""
	fileName := ""
	filePath := ""
	for item := range qd.IterBuffered() {
		itemcmap := item.Val.(cmap.ConcurrentMap)
		icmapenabled, ish := itemcmap.Get("enabled")
		if !ish {
			continue
		}
		enabled = icmapenabled.(string)
		icmapexist, ish := itemcmap.Get("exist")
		if !ish {
			continue
		}
		exist = icmapexist.(string)
		icmapName, ish := itemcmap.Get("name")
		if !ish {
			continue
		}
		fileName = icmapName.(string)
		icmapPath, ish := itemcmap.Get("path")
		if !ish {
			continue
		}
		filePath = icmapPath.(string)
	}
	if exist != "1" {
		c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9300, "err", "文件不存在")
	}
	if enabled != "1" {
		c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9300, "err", "文件不可用")
		return
	}

	frompath, ishpath := req.Form["path"]
	if ishpath && frompath[0] == "1" {
		f, err := os.Open(filePath)
		if err != nil {
			nyaMS.UpdataRecord("file_files", "`exist`='0'", where, nil)
			mysqlClose(nyaMS)
			c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9300, "err", "打开文件失败:"+err.Error())
			return
		}
		mysqlClose(nyaMS)

		ftype, err := GetFileContentType(f)
		if err != nil {
			fmt.Println("GetFileContentType Error:", err)
			// } else {
			// 	if ftype == "application/octet-stream" {
			// 		ftype = "text/plain; charset=utf-8"
			// 	}
		}

		// 设置头信息：Content-Disposition ，消息头指示回复的内容该以何种形式展示，
		// 是以内联的形式（即网页或者页面的一部分），还是以附件的形式下载并保存到本地
		// Content-Disposition: inline
		// Content-Disposition: attachment
		// Content-Disposition: attachment; filename="filename.后缀"
		// 第一个参数或者是inline（默认值，表示回复中的消息体会以页面的一部分或者
		// 整个页面的形式展示），或者是attachment（意味着消息体应该被下载到本地；
		// 大多数浏览器会呈现一个“保存为”的对话框，将filename的值预填为下载后的文件名，
		// 假如它存在的话）。
		fileStat, _ := f.Stat()
		fsize := strconv.FormatInt(fileStat.Size(), 10)
		fmt.Println("文件的内容类型是：", ftype, "大小：", fsize)
		w.Header().Set("Access-Control-Expose-Headers", "Content-Disposition")
		w.Header().Set("Content-Disposition", "attachment; filename="+fileName)
		w.Header().Set("Content-Type", ftype)
		w.Header().Set("Content-Length", fsize)

		f.Seek(0, 0)
		io.Copy(w, f)
		fmt.Println("io.Copy")
		f.Close()
	} else {
		mysqlClose(nyaMS)
		c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 10000, "", filePath)
	}
}

func fileDelete(w http.ResponseWriter, req *http.Request, c chan []byte) {
	fmt.Println("> fileDeleteHandleFunc")
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
	fromuhash, ishuhash := req.Form["uhash"]
	fromfh, ishfh := req.Form["fh"]
	fromisF, ishisF := req.Form["isForce"]
	fromfolderPath, ishfolderPath := req.Form["fp"]
	var missingParameter []string
	if !isht {
		missingParameter = append(missingParameter, "t")
	}
	if !ishfh {
		missingParameter = append(missingParameter, "fh")
	}
	if !ishfolderPath {
		missingParameter = append(missingParameter, "fp")
	}
	getUserInfo, locale_id, code := isOnLine(fromt[0])
	if code != -1 {
		c <- nyahttphandle.AlertInfoJson(w, localeID, code)
		return
	}
	isAdmin := false
	permissions_id := gjson.Get(getUserInfo, "permissions_id")
	// if permissions_id.Exists() && permissions_id.Int() == 1 {
	// 	isAdmin=true
	// 	// c <- nyahttphandle.AlertInfoJson(w, localeID, 4004)
	// 	// return
	// }
	// isAdmin := false
	if permissions_id.Exists() && permissions_id.Int() == 1 {
		isAdmin = true
	}
	if !OpenUPFile {
		if !isAdmin {
			c <- nyahttphandle.AlertInfoJson(w, localeID, 4004)
			return
		}
	}
	if len(missingParameter) != 0 {
		c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 2040, "err", missingParameter)
		return
	}
	if ishisF && fromisF[0] == "1" && !isAdmin {
		c <- nyahttphandle.AlertInfoJson(w, localeID, 4004)
		return
	}
	localeID = locale_id
	uhash := gjson.Get(getUserInfo, "hash").String()
	if !OpenUPFile {
		if ishuhash {
			uhash = fromuhash[0]
		}
	}
	nyaMS := mysqlIsRun()
	if nyaMS == nil {
		c <- nyahttphandle.AlertInfoJson(w, localeID, 9000)
		return
	}
	if isAdmin && ishisF && fromisF[0] == "1" {
		err = nyaMS.DeleteRecord("file_ascription", "file_hash", fromfh[0], "", "", nil)
		if err != nil {
			mysqlClose(nyaMS)
			c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9001, "err", "解除文件归属失败: "+err.Error())
			return
		}
		err = fileDeleteForHash(nyaMS, fromfh[0])
		if err != nil {
			mysqlClose(nyaMS)
			c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9300, "err", err.Error())
			return
		}
	} else {
		where := "`file_hash`='" + fromfh[0] + "' AND `folder_path`='" + fromfolderPath[0] + "'"
		qd, err := nyaMS.QueryData("*", "file_ascription", where, "", "", nil)
		if err != nil {
			mysqlClose(nyaMS)
			c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9001, "err", "查询'file_ascription'失败:"+err.Error())
			return
		}
		if qd.Count() == 0 {
			mysqlClose(nyaMS)
			c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9001, "err", "文件不存在")
			return
		}
		err = nyaMS.DeleteRecord("file_ascription", "user_hash", uhash, " AND `file_hash`='"+fromfh[0]+"' AND `folder_path`='"+fromfolderPath[0]+"'", "", nil)
		if err != nil {
			mysqlClose(nyaMS)
			c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9001, "err", "解除文件归属失败: "+err.Error())
			return
		}
		if qd.Count() == 1 {
			err = fileDeleteForHash(nyaMS, fromfh[0])
			if err != nil {
				mysqlClose(nyaMS)
				c <- nyahttphandle.AlertInfoJsonKV(w, localeID, 9300, "err", err.Error())
				return
			}
		}
	}
	mysqlClose(nyaMS)
	c <- nyahttphandle.AlertInfoJson(w, localeID, 10000)
}

func fileListHandleFunc(w http.ResponseWriter, req *http.Request) {
	wg := sync.WaitGroup{}
	wg.Add(1)
	c := make(chan []byte)
	go fileList(w, req, c)
	re := <-c
	wg.Done()
	w.Write(re)
	wg.Wait()
}

func fileUpdataHandleFunc(w http.ResponseWriter, req *http.Request) {
	wg := sync.WaitGroup{}
	wg.Add(1)
	c := make(chan []byte)
	go fileUpdata(w, req, c)
	re := <-c
	wg.Done()
	w.Write(re)
	wg.Wait()
}

func fileDownloadHandleFunc(w http.ResponseWriter, req *http.Request) {
	wg := sync.WaitGroup{}
	wg.Add(1)
	c := make(chan []byte)
	go fileDownload(w, req, c)
	re := <-c
	wg.Done()
	w.Write(re)
	wg.Wait()
}

func fileDeleteHandleFunc(w http.ResponseWriter, req *http.Request) {
	wg := sync.WaitGroup{}
	wg.Add(1)
	c := make(chan []byte)
	go fileDelete(w, req, c)
	re := <-c
	wg.Done()
	w.Write(re)
	wg.Wait()
}

func fileDeleteForHash(nyaMS *nyamysql.NyaMySQL, filehash string) error {
	where := "`hash`='" + filehash + "'"
	qd, err := nyaMS.QueryData("*", "file_files", where, "", "", nil)
	if err != nil {
		return fmt.Errorf("查询'file_files'失败:" + err.Error())
	}
	if qd.Count() > 0 {
		for item := range qd.IterBuffered() {
			itemcmap := item.Val.(cmap.ConcurrentMap)
			icmapPath, ish := itemcmap.Get("path")
			if ish {
				err = os.Remove(icmapPath.(string))
				if err != nil {
					return fmt.Errorf("文件删除失败: " + err.Error())
				}
			}
		}
		err = nyaMS.DeleteRecord("file_files", "hash", filehash, "", "", nil)
		if err != nil {
			return fmt.Errorf("'file_files'删除失败: " + err.Error())
		}
	}
	return nil
}

func GetFileContentType(ouput *os.File) (string, error) {

	// 仅嗅探内容类型的第一个
	// 使用了 512 个字节。

	buf := make([]byte, 512)

	_, err := ouput.Read(buf)

	if err != nil {
		return "", err
	}

	// 真正起作用的函数
	contentType := http.DetectContentType(buf)

	return contentType, nil
}
