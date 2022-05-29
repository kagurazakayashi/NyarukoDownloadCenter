import mdui from 'mdui';
import API from './API';
import Login from './login';
import NyaAs from './nyalib/nyaas';
import NyaCalc from './nyalib/nyacalc';
import NyaDom from './nyalib/nyadom';
import NyaEvent, { NyaEventListener } from './nyalib/nyaevent';
import NyaNetwork from './nyalib/nyanetwork';
import NyaStorage from './nyalib/nyastorage';
import NyaStrings from './nyalib/nyastrings';
import { NyaTemplateElement } from './nyalib/nyatemplate';
import NyaTime from './nyalib/nyatime';

export default class UserFileList {
    templateElement: NyaTemplateElement | null = null;
    api: API = new API();
    userInfo: any = {};
    confirmDeleteObj: any = null;
    ulProg: HTMLDivElement | null = null;
    ulProgT: HTMLDivElement | null = null;
    netUpload: XMLHttpRequest | null = null;
    nowStart: number = 0;
    fileNumber: number = 65536;
    extLib: (string | string[])[][] = [
        [['jpg', 'jpeg', 'png', 'gif', 'tif', 'tiff', 'jfif', 'webp', 'bmp'], '图片文件', 'image'],
        [['mp4', 'mov', 'mkv', 'flv'], '视频文件', 'videocam'],
        [['mp3', 'wav', 'flac'], '音频文件', 'audiotrack'],
        [['exe', 'bat', 'sh'], '可执行文件', 'settings_applications'],
        [['txt', 'md', 'pdf', 'doc', 'docx'], '文字文档', 'description'],
        [['xls', 'xlsx', 'csv'], '电子表格', 'view_list'],
        [['ppt', 'pptx', 'pps'], '幻灯片', 'video_library'],
        [['zip', 'rar', '7z', 'xz', 'gz'], '压缩包', 'archive'],
        [['htm', 'html'], '网页', 'web'],
        [['c', 'h', 'cs', 'py', 'go', 'dart', 'js', 'sql'], '代码文件', 'code'],
        [['json', 'ini', 'conf', 'xml'], '配置文件', 'build'],
        [['psd', 'ai'], '图形源文件', 'build'],
    ];
    vPath: string = '/';
    vPathBar: HTMLDivElement | null = null;
    events0: NyaEventListener[] = [];
    events1: NyaEventListener[] = [];
    uploadEvent: NyaEventListener | null = null;

    constructor() {
        // console.log('UserFileList');
        const infoStr: string | null = sessionStorage.getItem('info');
        let info: any = {};
        if (infoStr == '' || infoStr == null || infoStr == 'undefined') {
            window.history.back();
            return;
        } else {
            info = JSON.parse(infoStr);
        }
        let userShow: string = info['nickname'] == '' ? info['username'] : info['nickname'] + '(' + info['username'] + ')';
        window.g_Title.innerHTML = '管理文件/' + userShow;
        this.userInfo = info;
        if (window.g_btnReloadEvent != null) {
            NyaEvent.removeEventListener(window.g_btnReloadEvent);
        }
        this.api.getTempHTML(this.templateElement, 'FileList.template', (reTemp) => {
            this.templateElement = reTemp;
            const token = sessionStorage.getItem('Token');
            if (token == '' || token == null || token == 'undefined') {
                let login = new Login();
            } else {
                NyaDom.byId('nick').innerText = this.userInfo['nickname'];
                NyaDom.byId('group').innerText = window.g_GroupList[this.userInfo['group_code']][this.api.str.name];
                NyaDom.byId('permissions').innerText = window.g_PermissionsList[this.userInfo['permissions_id']][this.api.str.describe];
                let ctime: string = this.userInfo[this.api.str.creation_date] > 0 ? NyaTime.timeStamp2timeStringFormat(this.userInfo[this.api.str.creation_date] * 1000, this.api.str.date) : '';
                NyaDom.byId('ctime').innerText = ctime;
                ctime = this.userInfo[this.api.str.modification_date] > 0 ? NyaTime.timeStamp2timeStringFormat(this.userInfo[this.api.str.modification_date] * 1000, this.api.str.date) : '';
                NyaDom.byId('mtime').innerText = ctime;
                // NyaDom.byId('locale').innerText = this.userInfo['locale_code'];
                NyaDom.byId('enable').innerText = NyaStrings.boolean2String(this.userInfo['enable'], '是', '否');
                ctime = this.userInfo['disable_startdate'] > 0 ? NyaTime.timeStamp2timeString(this.userInfo['disable_startdate']) : '账户正常使用';
                NyaDom.byId('disStrTime').innerText = ctime;
                ctime = this.userInfo['disable_enddate'] > 0 ? NyaTime.timeStamp2timeString(this.userInfo['disable_enddate']) : '-';
                NyaDom.byId('disEndTime').innerText = ctime;
                this.vPathBar = NyaAs.div(NyaDom.byId('vPathBar'));

                const selectLocale: HTMLSelectElement = NyaDom.byId('locale') as HTMLSelectElement;
                selectLocale.innerHTML = '';
                for (const key in window.g_LocaleList) {
                    if (Object.prototype.hasOwnProperty.call(window.g_LocaleList, key)) {
                        const element = window.g_LocaleList[key];
                        selectLocale.innerHTML += '<option value="' + key + '"' + (this.userInfo['locale_code'] == key ? ' selected' : '') + '>' + element[1] + '</option>';
                    }
                }
                const ev: NyaEventListener | null = NyaEvent.addEventListener(NyaDom.byId('btnFileUpload'), () => {
                    this.fileUploadUI();
                });
                if (ev) {
                    this.events0.push(ev);
                }
                this.getFileList(token);
                window.g_btnReloadEvent = NyaEvent.addEventListener(NyaDom.byId('btnReload'), () => {
                    this.getFileList(token);
                });
            }
            mdui.mutation();
            return true;
        });
    }

    turning(t: number) {
        if (Number(t) < 0) {
            this.nowStart -= this.fileNumber;
        } else {
            this.nowStart += this.fileNumber;
        }
        const token = sessionStorage.getItem('Token');
        if (token == '' || token == null || token == 'undefined') {
            let login = new Login();
        } else {
            this.getFileList(token);
        }
    }

    jumppage(j: string) {
        this.nowStart = (Number(j) - 1) * this.fileNumber;
        const token = sessionStorage.getItem('Token');
        if (token == '' || token == null || token == 'undefined') {
            let login = new Login();
        } else {
            this.getFileList(token);
        }
    }

    updateVPathBar(vDir: string = '/') {
        if (!this.vPathBar) {
            return;
        }
        this.vPathBar.innerHTML = '';
        const paths: string[] = vDir.split('/');
        let nowPath: string = '/';
        let len: number = 0;
        for (let i = -1; i < paths.length; i++) {
            const pa: HTMLButtonElement = NyaAs.button();
            pa.className = 'mdui-btn mdui-ripple';
            if (i == paths.length - 1) {
                pa.className += ' mdui-color-theme-accent';
            }
            if (i < 0) {
                pa.innerText = '根目录';
            } else {
                const pathUnit = paths[i];
                if (pathUnit.length == 0) {
                    continue;
                }
                nowPath += '/' + pathUnit;
                pa.innerText = pathUnit;
            }
            nowPath = nowPath.replace('//', '');
            pa.title = nowPath;
            const icoRight = document.createElement('i');
            icoRight.innerText = 'chevron_right';
            icoRight.className = 'mdui-icon material-icons';
            pa.appendChild(icoRight);
            const ev: NyaEventListener | null = NyaEvent.addEventListener(pa, () => {
                this.genFileList(pa.title);
            });
            if (ev) this.events1.push(ev);
            this.vPathBar.appendChild(pa);
            len++;
        }
    }

    getFileList(t: string, vDir: string = '/') {
        const url: string = window.g_url + 'fileList/';
        const arg = {
            t: t,
            uhash: this.userInfo['hash'],
            offset: this.nowStart,
            rows: this.fileNumber,
        };
        this.api.netWork(url, arg, true, (data) => {
            if (data != null) {
                let redata: any = JSON.parse(data.response);
                if (data.status == 200) {
                    NyaStorage.setString('fileList', data.response, false);
                    NyaStorage.setString('fileListPath', '/', false);
                    this.updateVPathBar(vDir);
                    if (!redata.hasOwnProperty('code')) {
                        console.error(data.response);
                        return;
                    }
                    const pagesDiv: HTMLUListElement = NyaDom.byId('pageNumber') as HTMLUListElement;
                    const code = redata['code'];
                    if (code == 10001) {
                        pagesDiv.innerHTML = '<center>没有文件</center>';
                        return;
                    }
                    if (!redata.hasOwnProperty('data')) {
                        console.error(data.response);
                        return;
                    }
                    const jdata = redata['data'];
                    if (!jdata.hasOwnProperty('data')) {
                        console.error(data.response);
                        return;
                    }
                    const listData = jdata['data']; // 文件列表数据 1:{...}, 2:{...}
                    const offset = jdata['offset'];
                    const rows = jdata['rows'];
                    const total = jdata['total'];
                    if (listData.length < total) {
                        let ULinnerHTML = '<ul>';
                        if (this.nowStart != 0) {
                            ULinnerHTML += '<li>上一页</li>';
                        }
                        for (let i = 0; i < this.api.roundup(total / this.fileNumber); i++) {
                            if (i * this.fileNumber == this.nowStart) {
                                ULinnerHTML += '<li>...</li>';
                            } else {
                                ULinnerHTML += '<li>' + (i + 1) + '</li>';
                            }
                        }
                        if (!(listData.length < rows || offset + rows >= total)) {
                            ULinnerHTML += '<li>下一页</li>';
                        }
                        ULinnerHTML += '</ul>';
                        pagesDiv.innerHTML = ULinnerHTML;

                        const lis: HTMLLIElement[] = NyaDom.dom('li', pagesDiv) as HTMLLIElement[];
                        lis.forEach((ele: HTMLLIElement) => {
                            switch (ele.innerText) {
                                case '上一页':
                                    ele.addEventListener(this.api.str.click, () => {
                                        this.turning(-1);
                                    });
                                    break;
                                case '下一页':
                                    ele.addEventListener(this.api.str.click, () => {
                                        this.turning(1);
                                    });
                                    break;

                                default:
                                    ele.addEventListener(this.api.str.click, () => {
                                        this.jumppage(ele.innerText);
                                    });
                                    break;
                            }
                        });
                    }
                    this.genFileList();
                } else {
                    this.api.errHandle(redata['code']);
                }
            } else {
                console.error(status, url, arg, data);
            }
        });
    }

    genFileList(path: string = '/') {
        NyaEvent.removeEventListeners(this.events1);
        this.events1 = [];
        const json: string = NyaStorage.getString('fileList');
        if (json.length == 0) {
            return;
        }
        let redata: any = JSON.parse(json);
        const listData = redata['data']['data'];
        const pathArr: string[] = path.split('/');
        let data = listData;
        for (const nowPath of pathArr) {
            if (nowPath == undefined || nowPath.length == 0) {
                continue;
            }
            data = data[nowPath];
        }
        let html: string = '';
        if (data == null || data.length <= 0) {
            return;
        }
        let filelist: any[] = [];
        let dirFileListTmp: any[] = [];
        let dirListTmp: string[] = [];
        for (const dirList in data) {
            const dir: any[] = data[dirList];
            if (dirList == 'fileList') {
                // 找到一個當前資料夾的檔案列表
                dirFileListTmp = dir; // 暫存檔案列表，資料夾處理完後再處理檔案列表
            } else {
                dirListTmp.push(dirList);
                // 這是一個資料夾
                html += this.templateElement?.codeByID(
                    'row',
                    [
                        [this.api.str.icon, 'folder'],
                        [this.api.str.namestyle, ''],
                        [this.api.str.btnstyle, 'style="display:none;"'],
                        [this.api.str.name, dirList],
                        [this.api.str.describe, ''],
                        [this.api.str.locale, ''],
                        [this.api.str.size, ''],
                        [this.api.str.type, '文件夹'],
                        [this.api.str.creation_date, ''],
                        [this.api.str.modification_date, ''],
                    ],
                    true
                );
            }
        }
        for (const item of dirFileListTmp) {
            const namestyle: string = item.exist == 1 ? '' : 'style="color: gray; text-decoration:line-through;';
            let extIcon: string = 'insert_drive_file';
            let extText: string = '';
            const fileName = item.name as string;
            const extNameArr = fileName.split('.');
            if (extNameArr.length >= 2) {
                const extName = extNameArr[extNameArr.length - 1];
                extText = extName.toUpperCase() + ' 文件';
                for (const extConf of this.extLib) {
                    const extConfExts: string[] = extConf[0] as string[];
                    let isExt = false;
                    for (const nowExt of extConfExts) {
                        if (nowExt == extName.toLowerCase()) {
                            isExt = true;
                            break;
                        }
                    }
                    if (isExt) {
                        extText = extName.toUpperCase() + ' ' + extConf[1];
                        extIcon = extConf[2] as string;
                        break;
                    }
                }
            }
            const sizeStr: string = NyaCalc.dataSizeStr(item['size']);
            html += this.templateElement?.codeByID('row', [
                [this.api.str.icon, extIcon],
                [this.api.str.namestyle, namestyle],
                [this.api.str.btnstyle, ''],
                [this.api.str.size, sizeStr],
                [this.api.str.type, extText],
                [this.api.str.name, fileName],
                [this.api.str.describe, item.describe.length ? item.describe : '无'],
                [this.api.str.locale, window.g_LocaleList[item.locale_code][1]],
                [this.api.str.creation_date, NyaTime.timeStamp2timeString(item.creation_date, 5)],
                [this.api.str.modification_date, NyaTime.timeStamp2timeString(item.modification_date, 5)],
            ]);
            filelist.push(item);
        }
        this.updateVPathBar(path);

        NyaDom.byId('fileListBody').innerHTML = html.length > 0 ? html : '<p>没有文件</p>';

        let btnDownloads: HTMLButtonElement[] | null = NyaDom.byClass('flbtnDownload') as HTMLButtonElement[] | null;
        let btnDeletes: HTMLButtonElement[] | null = NyaDom.byClass('flbtnDelete') as HTMLButtonElement[] | null;
        let btnIcos: HTMLButtonElement[] | null = NyaDom.byClass('flbtnIco') as HTMLButtonElement[] | null;
        let btnFileNames: HTMLSpanElement[] | null = NyaDom.byClass('flName') as HTMLSpanElement[] | null;
        if (btnDownloads == null || btnDeletes == null || btnIcos == null || btnFileNames == null) {
            return;
        }
        btnDownloads = NyaDom.removeHiddenElement(btnDownloads) as HTMLButtonElement[];
        btnDeletes = NyaDom.removeHiddenElement(btnDeletes) as HTMLButtonElement[];
        btnIcos = NyaDom.removeHiddenElement(btnIcos) as HTMLButtonElement[];
        btnFileNames = NyaDom.removeHiddenElement(btnFileNames) as HTMLButtonElement[];
        for (let i = 0; i < filelist.length; i++) {
            const file = filelist[i];
            if (btnDownloads.length > i) {
                const btnDL: HTMLButtonElement = btnDownloads[i];
                const ev: NyaEventListener | null = NyaEvent.addEventListener(btnDL, () => {
                    this.downLoad(file);
                });
                if (ev) this.events1.push(ev);
            }
            if (btnDeletes.length > i) {
                const btnDel: HTMLButtonElement = btnDeletes[i];
                const ev: NyaEventListener | null = NyaEvent.addEventListener(btnDel, () => {
                    this.deleteFile(file, path);
                });
                if (ev) this.events1.push(ev);
            }
        }
        const folderIcos: HTMLButtonElement[] = [];
        const fileIcos: HTMLButtonElement[] = [];
        const folderNames: HTMLSpanElement[] = [];
        const fileNames: HTMLSpanElement[] = [];
        for (let i = 0; i < btnIcos.length; i++) {
            const btnIco = btnIcos[i];
            const btnName = btnFileNames[i];
            const idoms: HTMLCollectionOf<HTMLElement> = btnIco.getElementsByTagName('i');
            for (const key in idoms) {
                if (Object.prototype.hasOwnProperty.call(idoms, key)) {
                    const j = idoms[key];
                    if (j.innerText == 'folder') {
                        folderIcos.push(btnIco);
                        folderNames.push(btnName);
                    } else {
                        fileIcos.push(btnIco);
                        fileNames.push(btnName);
                    }
                }
                break;
            }
        }
        for (let j = 0; j < folderIcos.length; j++) {
            const btnIco: HTMLButtonElement = folderIcos[j];
            const btnName: HTMLSpanElement = folderNames[j];
            const file: string = dirListTmp[j];
            let nPath = path + '/' + file;
            nPath = nPath.replace('//', '/');
            btnIco.title = '打开文件夹 ' + nPath;
            btnName.title = btnIco.title;
            const ev1: NyaEventListener | null = NyaEvent.addEventListener(btnName, () => {
                this.btnIcoClick(file, path);
            });
            if (ev1) this.events1.push(ev1);
            const ev2: NyaEventListener | null = NyaEvent.addEventListener(btnIco, () => {
                this.btnIcoClick(file, path);
            });
            if (ev2) this.events1.push(ev2);
        }
        for (let j = 0; j < fileIcos.length; j++) {
            const btnIco: HTMLButtonElement = fileIcos[j];
            const btnName: HTMLSpanElement = fileNames[j];
            const file: any = dirFileListTmp[j];
            let nPath = path + '/' + file.name;
            nPath = nPath.replace('//', '/');
            btnIco.title = '下载文件 ' + nPath;
            btnName.title = btnIco.title;
            const ev1: NyaEventListener | null = NyaEvent.addEventListener(btnName, () => {
                this.downLoad(file);
            });
            if (ev1) this.events1.push(ev1);
            const ev2: NyaEventListener | null = NyaEvent.addEventListener(btnIco, () => {
                this.downLoad(file);
            });
            if (ev2) this.events1.push(ev2);
        }
    }

    btnIcoClick(name: string, path: string) {
        this.genFileList((path + '/' + name).replace('//', '/'));
    }

    downLoad(file: any) {
        const nameFile = file[this.api.str.name];
        const downloadSnackbar = mdui.snackbar({
            message: '<i class="mdui-icon material-icons">arrow_downward</i>&nbsp;正在下载文件，请勿操作网页。文件: ' + nameFile + '<br/>进度: <span id="dlprogress"></span>',
            position: 'left-bottom',
            timeout: 0,
            closeOnOutsideClick: false,
        });
        // TODO: 連續下載不響應
        // const token = sessionStorage.getItem('Token');
        // NyaNetwork.postForm(window.g_url + 'fileDownload/', { fh: file[this.api.str.hash], path: 1, t: token });
        // return;
        this.api.netWork(
            window.g_url + 'fileDownload/',
            { fh: file[this.api.str.hash], path: 1 },
            true,
            (data) => {
                downloadSnackbar.close();
                if (data != null) {
                    console.log('data', data);
                    if (data.status === 200) {
                        // 返回200
                        const blob: Blob = data.response;
                        const reader = new FileReader();
                        reader.readAsDataURL(blob);
                        reader.onload = (e: ProgressEvent<FileReader>) => {
                            if (e.target == null) {
                                return;
                            }
                            // 转换完成，创建一个a标签用于下载
                            const a: HTMLAnchorElement = document.createElement('a');
                            a.download = nameFile;
                            a.href = e.target.result as string;
                            const dwdiv = NyaDom.byId('dw');
                            dwdiv.append(a); // 修复firefox中无法触发click
                            a.click();
                            dwdiv.innerHTML = '';
                        };
                    } else {
                        const blob: Blob = data.response;
                        const reader = new FileReader();
                        reader.readAsText(blob, 'utf8');
                        reader.onload = (e) => {
                            // console.log(reader.result);
                            const msg = JSON.parse(reader.result as string);
                            const inst = new mdui.Dialog('#errDialog');
                            inst.open();
                            const msgDialog = NyaDom.byId('errDialog');
                            // msgDialog.style.height = '300px';
                            const mDtitle: HTMLDivElement[] = NyaDom.dom('.mdui-dialog-title', msgDialog) as HTMLDivElement[];
                            mDtitle.forEach((e) => {
                                e.innerText = msg['msg'];
                            });
                            const mDcontent: HTMLDivElement[] = NyaDom.dom('.mdui-dialog-content', msgDialog) as HTMLDivElement[];
                            mDcontent.forEach((e) => {
                                e.innerText = msg['err'];
                            });
                            msgDialog.addEventListener('confirm', () => {
                                this.api.errHandle(msg['code']);
                            });
                        };
                    }
                }
            },
            true,
            false,
            (status: number, value: number, max: number, percent: number) => {
                const dlprogress: HTMLSpanElement = NyaDom.byId('dlprogress');
                dlprogress.innerText = value.toString() + ' / ' + max.toString() + ' ( ' + percent.toString() + '% )';
            }
        );
    }

    deleteFile(file: any, path: string) {
        const dialogTexts: string[] = ['要删除这个文件吗？', '完整路径：' + path + '/' + file.name, '描述：' + (file.describe.length > 0 ? file.describe : '无'), '语言：' + file.locale_code, '创建时间：' + NyaTime.timeStamp2timeString(file.modification_date)];
        mdui.confirm(dialogTexts.join('<br/>'), '删除文件：' + file.name, () => {
            this.api.netWork(window.g_url + 'fileDelete/', { uhash: this.userInfo[this.api.str.hash], fh: file.hash }, true, (data) => {
                if (data != null) {
                    const redata = JSON.parse(data.response);
                    if (data.status === 200) {
                        //TODO:删除成功
                    } else {
                        mdui.alert(redata.msg, '删除失败');
                    }
                }
            });
        });
    }

    fileUploadUI() {
        // console.log('fileUploadUI',fileUploadUI);
        if (this.ulProg == null) {
            this.ulProg = NyaAs.div(NyaDom.byId('ulProg'));
            this.ulProgT = NyaAs.div(NyaDom.byId('ulProgT'));
        }
        const token: string | null = sessionStorage.getItem('Token');
        if (token == null) {
            return;
        }
        const fileUploadDialog = new mdui.Dialog('#fileUploadDialog', {
            history: false,
            modal: true,
            closeOnEsc: false,
            closeOnCancel: false,
            closeOnConfirm: false,
        });
        const fileUploadDialogE = NyaDom.byId('fileUploadDialog');
        const dir: HTMLInputElement = NyaDom.byId('dir') as HTMLInputElement;
        const locale: HTMLSelectElement = NyaDom.byId('locale') as HTMLSelectElement;
        // confirm
        if (this.uploadEvent != null) {
            NyaEvent.removeEventListener(this.uploadEvent);
            this.uploadEvent = null;
        }
        this.uploadEvent = NyaEvent.addEventListener(
            fileUploadDialogE,
            () => {
                const inputF: HTMLInputElement = NyaAs.input(NyaDom.byId('fuDialogFile'));
                const mduiProgStyle: string[] = ['mdui-progress-indeterminate', 'mdui-progress-determinate', 'hide'];
                if (inputF.files == null || inputF.files.length == 0) {
                    return;
                }
                const url: string = window.g_url + 'fileUpdata/';
                if (this.ulProg!.className != mduiProgStyle[0]) {
                    this.ulProg!.className = mduiProgStyle[0];
                    this.ulProgT!.innerText = '0 %';
                }
                const ulProgOK = NyaDom.byId('ulProgOK');
                ulProgOK.style.display = 'none';
                let dirPath = dir.value;
                if (dirPath.charAt(dirPath.length - 1) != '/') {
                    dirPath += '/';
                }
                for (let i = 0; i < dirPath.length; i++) {
                    if (dirPath.charAt(0) == '.' || dirPath.charAt(0) == '/') {
                        dirPath = dirPath.slice(1);
                    } else {
                        break;
                    }
                }
                dirPath = './' + dirPath;

                this.netUpload = NyaNetwork.uploadFile(
                    url,
                    inputF,
                    false,
                    {
                        uhash: this.userInfo[this.api.str.hash],
                        t: token,
                        localeCode: locale.value,
                        folderPath: dirPath,
                    },
                    (status: number, value: number, max: number, percent: number) => {
                        // 檔案上傳狀態 0正在上傳 1上傳完畢 -1取消 -2超時 -3錯誤
                        // console.log('1->', status, value, max, percent);
                        if (status == 0) {
                            // 正在上傳
                            if (this.ulProg!.className != mduiProgStyle[1]) {
                                this.ulProg!.className = mduiProgStyle[1];
                            }
                            this.ulProg!.style.width = percent.toString() + '%';
                            this.ulProgT!.innerText = value.toString() + ' / ' + max.toString() + '   ' + percent.toString() + ' %';
                            fileUploadDialog.handleUpdate();
                        } else {
                            console.error(status, value, max, percent);
                            if (this.ulProg!.className != mduiProgStyle[2]) {
                                this.ulProg!.className = mduiProgStyle[2];
                            }
                            this.ulProgT!.innerText = '';
                        }
                    },
                    (data: XMLHttpRequest | null, status: number) => {
                        // console.log('2->', data, status);
                        if (status == undefined) {
                            return;
                        }
                        fileUploadDialog.$element.off('confirm.mdui.dialog');
                        fileUploadDialog.close(false);
                        if (this.ulProg!.className != mduiProgStyle[2]) {
                            this.ulProg!.className = mduiProgStyle[2];
                        }
                        ulProgOK.style.display = '';
                        if (data && data.responseText.length > 0) {
                            try {
                                const jsonData: any = JSON.parse(data.responseText);
                                const code: number = jsonData.code ?? '';
                                const msg: string = jsonData.msg ?? '';
                                const err: string = jsonData.err ?? '';
                                mdui.alert(err, msg + ' (' + code.toString() + ')');
                            } catch (e) {
                                mdui.alert(data.responseText, '错误 (' + status.toString() + ')');
                            }
                        }
                        this.netUpload = null;
                    },
                    true,
                    'f'
                );
            },
            'confirm'
        );
        fileUploadDialog.$element.on('cancel.mdui.dialog', () => {
            if (this.netUpload) {
                this.netUpload.abort();
                location.reload();
            }
            this.netUpload = null;
            fileUploadDialog.close();
            const ulProgOK = NyaDom.byId('ulProgOK');
            ulProgOK.style.display = '';
        });
        fileUploadDialog.open();
    }
}
