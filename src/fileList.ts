import mdui from 'mdui';
import API from './API';
import Login from './login';
import NyaAs from './nyalib/nyaas';
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
        [['c', 'h', 'cs', 'py', 'go', 'dart', 'js'], '代码文件', 'code'],
        [['json', 'ini', 'conf', 'xml'], '配置文件', 'build'],
    ];
    vPath: string = '/';
    vPathBar: HTMLDivElement | null = null;
    vPathEvent: NyaEventListener | null = null;
    events:NyaEventListener[]=[];

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
                    this.events.push(ev);
                }
                this.getFileList(token);
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
        if (this.vPathEvent) {
            NyaEvent.removeEventListener(this.vPathEvent);
            this.vPathEvent = null;
        }
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
            nowPath = nowPath.replace('//','');
            pa.title = nowPath;
            const icoRight = document.createElement('i');
            icoRight.innerText = 'chevron_right';
            icoRight.className = 'mdui-icon material-icons';
            pa.appendChild(icoRight);
            NyaEvent.addEventListener(pa,()=>{
                this.genFileList(nowPath);
            });
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
                    const listData = redata['data']['data']; // 文件列表数据 1:{...}, 2:{...}
                    const offset = redata['data']['offset'];
                    const rows = redata['data']['rows'];
                    const total = redata['data']['total'];
                    if (listData.length < total) {
                        let pagesDiv: HTMLUListElement = NyaDom.byId('pageNumber') as HTMLUListElement;
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
                        // console.log(lis);
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
        console.log('genFileList',path);
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
                        [this.api.str.type, '文件夹'],
                        [this.api.str.creation_date, ''],
                        [this.api.str.modification_date, ''],
                    ],
                    true
                );
            }
        }
        for (const item of dirFileListTmp) {
            const namestyle: string = 'style="color: ' + (item.exist == 1 ? 'black' : 'gray; text-decoration:line-through') + ';"';
            let extIcon: string = 'insert_drive_file';
            let extText: string = '';
            const fileName = item.name as string;
            const extNameArr = fileName.split('.');
            if (extNameArr.length >= 2) {
                const extName = extNameArr[extNameArr.length - 1];
                extText = extName + ' 文件';
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
            html += this.templateElement?.codeByID('row', [
                [this.api.str.icon, extIcon],
                [this.api.str.namestyle, namestyle],
                [this.api.str.btnstyle, ''],
                [this.api.str.type, extText],
                [this.api.str.name, fileName],
                [this.api.str.describe, item.describe.length ? item.describe : '无'],
                [this.api.str.locale, window.g_LocaleList[item.locale_code][1]],
                [this.api.str.creation_date, NyaTime.timeStamp2timeString(item.creation_date, 5)],
                [this.api.str.modification_date, NyaTime.timeStamp2timeString(item.modification_date, 5)],
            ]);
            filelist.push(item);
            this.updateVPathBar(path);
        }

        NyaDom.byId('fileListBody').innerHTML = html.length > 0 ? html : '<p>没有文件</p>';

        let btnDownloads: HTMLButtonElement[] | null = NyaDom.byClass('flbtnDownload') as HTMLButtonElement[] | null;
        let btnDeletes: HTMLButtonElement[] | null = NyaDom.byClass('flbtnDelete') as HTMLButtonElement[] | null;
        let btnIcos: HTMLButtonElement[] | null = NyaDom.byClass('flbtnIco') as HTMLButtonElement[] | null;
        if (btnDownloads == null || btnDeletes == null || btnIcos == null) {
            return;
        }
        btnDownloads = NyaDom.removeHiddenElement(btnDownloads) as HTMLButtonElement[];
        btnDeletes = NyaDom.removeHiddenElement(btnDeletes) as HTMLButtonElement[];
        btnIcos = NyaDom.removeHiddenElement(btnIcos) as HTMLButtonElement[];
        for (let i = 0; i < filelist.length; i++) {
            const file = filelist[i];
            if (btnDownloads.length > i) {
                const btnDL: HTMLButtonElement = btnDownloads[i];
                NyaEvent.addEventListener(btnDL, () => {
                    this.downLoad(file);
                });
            }
            if (btnDeletes.length > i) {
                const btnDel: HTMLButtonElement = btnDeletes[i];
                NyaEvent.addEventListener(btnDel, () => {
                    this.deleteFile(file, path);
                });
            }
        }
        const folderIcos: HTMLButtonElement[] = [];
        const fileIcos: HTMLButtonElement[] = [];
        for (const btnIco of btnIcos) {
            const idoms: HTMLCollectionOf<HTMLElement> = btnIco.getElementsByTagName('i');
            for (const key in idoms) {
                if (Object.prototype.hasOwnProperty.call(idoms, key)) {
                    const i = idoms[key];
                    if (i.innerText == 'folder') {
                        folderIcos.push(btnIco);
                    } else {
                        fileIcos.push(btnIco);
                    }
                }
                break;
            }
        }
        for (let j = 0; j < folderIcos.length; j++) {
            const btnIco: HTMLButtonElement = folderIcos[j];
            const file: string = dirListTmp[j];
            let nPath = path + '/' + file;
            nPath = nPath.replace('//','/');
            btnIco.title = '打开文件夹 ' + nPath;
            NyaEvent.addEventListener(btnIco, () => {
                this.btnIcoClick(file, path);
            });
        }
        for (let j = 0; j < fileIcos.length; j++) {
            const btnIco: HTMLButtonElement = fileIcos[j];
            const file: any = dirFileListTmp[j];
            let nPath = path+ '/' + file.name;
            nPath = nPath.replace('//','/');
            btnIco.title = '下载文件 ' + nPath;
            NyaEvent.addEventListener(btnIco, () => {
                this.downLoad(file);
            });
        }
    }

    btnIcoClick(name: string, path: string) {
        this.genFileList((path + '/' + name).replace('//','/'));
    }

    downLoad(file: any) {
        const nameFile = file[this.api.str.name];
        mdui.snackbar({
            message: '<i class="mdui-icon material-icons">arrow_downward</i> 正在后台下载：' + nameFile,
            position: 'left-bottom',
        });
        this.api.netWork(
            window.g_url + 'fileDownload/',
            { fh: file[this.api.str.hash], path: 1 },
            true,
            (data) => {
                if (data != null) {
                    if (data.status === 200) {
                        // 返回200
                        var blob: Blob = data.response;
                        var reader = new FileReader();
                        reader.readAsDataURL(blob); // 转换为base64，可以直接放入a表情href
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
                        var blob: Blob = data.response;
                        var reader = new FileReader();
                        reader.readAsText(blob, 'utf8'); // 转换为base64，可以直接放入a表情href
                        reader.onload = (e) => {
                            // console.log(reader.result);
                            var msg = JSON.parse(reader.result as string);
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
            true
        );
    }

    deleteFile(file: any, path: string) {
        const dialogTexts: string[] = ['要删除这个文件吗？', '完整路径：' + path + '/' + file.name, '描述：' + (file.describe.length > 0 ? file.describe : '无'), '语言：' + file.locale_code, '创建时间：' + NyaTime.timeStamp2timeString(file.modification_date)];
        mdui.confirm(dialogTexts.join('<br/>'), '删除文件：' + file.name, () => {
            this.api.netWork(window.g_url + 'fileDelete/', { uhash: file.uhash, fh: file.fh }, true, (data) => {
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
        const locale: HTMLSelectElement = NyaDom.byId('locale') as HTMLSelectElement;
        fileUploadDialog.$element.on('confirm.mdui.dialog', () => {
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
            this.netUpload = NyaNetwork.uploadFile(
                url,
                inputF,
                false,
                {
                    uhash: this.userInfo[this.api.str.hash],
                    t: token,
                    localeCode: locale.value,
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
        });
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
