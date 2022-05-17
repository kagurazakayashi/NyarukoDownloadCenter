import mdui from 'mdui';
import API from './API';
import Login from './login';
import NyaAs from './nyalib/nyaas';
import NyaDom from './nyalib/nyadom';
import NyaEvent from './nyalib/nyaevent';
import NyaNetwork from './nyalib/nyanetwork';
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
    fileNumber: number = 3;

    constructor() {
        console.log('UserFileList');
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
                NyaDom.byId('enable').innerText = NyaStrings.booleanToString(this.userInfo['enable'], '是', '否');
                ctime = this.userInfo['disable_startdate'] > 0 ? NyaTime.timeStamp2timeString(this.userInfo['disable_startdate']) : '账户正常使用';
                NyaDom.byId('disStrTime').innerText = ctime;
                ctime = this.userInfo['disable_enddate'] > 0 ? NyaTime.timeStamp2timeString(this.userInfo['disable_enddate']) : '-';
                NyaDom.byId('disEndTime').innerText = ctime;

                const selectLocale: HTMLSelectElement = NyaDom.byId('locale') as HTMLSelectElement;
                selectLocale.innerHTML = '';
                for (const key in window.g_LocaleList) {
                    if (Object.prototype.hasOwnProperty.call(window.g_LocaleList, key)) {
                        const element = window.g_LocaleList[key];
                        selectLocale.innerHTML += '<option value="' + key + '"' + (this.userInfo['locale_code'] == key ? ' selected' : '') + '>' + element[1] + '</option>';
                    }
                }
                NyaEvent.addEventListener(NyaDom.byId('btnFileUpload'), this.api.str.click, () => {
                    this.fileUploadUI();
                });
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

    getFileList(t: string) {
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
                console.log(data.response);
                if (data.status == 200) {
                    const listData = redata['data']['data'];
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
                        console.log(lis);
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
                    this.genFileList(listData);
                } else {
                    this.api.errHandle(redata['code']);
                }
            } else {
                console.error(status, url, arg, data);
            }
        });
    }

    genFileList(data: any[]) {
        let html: string = '';
        if (data == null || data.length <= 0) {
            return;
        }
        let filelist: any[] = [];
        for (const item of data) {
            const namestyle = 'style="color: ' + (item.exist == 1 ? 'black' : 'gray; text-decoration:line-through') + ';"';
            html += this.templateElement?.codeByID('row', [
                ['namestyle', namestyle],
                [this.api.str.name, item.name],
                [this.api.str.describe, item.describe.length ? item.describe : '无'],
                [this.api.str.locale, window.g_LocaleList[item.locale_code][1]],
                [this.api.str.creation_date, NyaTime.timeStamp2timeString(item.creation_date, 5)],
                [this.api.str.modification_date, NyaTime.timeStamp2timeString(item.modification_date, 5)],
            ]);
            filelist.push(item);
        }

        NyaDom.byId('fileListBody').innerHTML = html.length > 0 ? html : '<p>没有文件</p>';

        const btnDownloads: HTMLButtonElement[] | null = NyaDom.byClass('flbtnDownload') as HTMLButtonElement[] | null;
        const btnDeletes: HTMLButtonElement[] | null = NyaDom.byClass('flbtnDelete') as HTMLButtonElement[] | null;
        for (let i = 0; i < filelist.length; i++) {
            const file = filelist[i];
            if (btnDownloads != null && btnDownloads.length > i) {
                const btnDL: HTMLButtonElement = btnDownloads[i];
                NyaEvent.addEventListener(btnDL, this.api.str.click, () => {
                    this.downLoad(file);
                });
            }
            if (btnDeletes != null && btnDeletes.length > i) {
                const btnDel: HTMLButtonElement = btnDeletes[i];
                NyaEvent.addEventListener(btnDel, this.api.str.click, () => {
                    this.deleteFile(file);
                });
            }
        }
    }

    downLoad(fhash: string) {
        this.api.netWork(
            window.g_url + 'fileDownload/',
            { fh: fhash[this.api.str.hash], path: 1 },
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
                            var a: HTMLAnchorElement = document.createElement('a');

                            var nameFile = fhash[this.api.str.name];
                            a.download = nameFile;
                            a.href = e.target.result as string;
                            var dwdiv = NyaDom.byId('dw');
                            dwdiv.append(a); // 修复firefox中无法触发click
                            a.click();
                            dwdiv.innerHTML = '';
                        };
                    } else {
                        var blob: Blob = data.response;
                        var reader = new FileReader();
                        reader.readAsText(blob, 'utf8'); // 转换为base64，可以直接放入a表情href
                        reader.onload = (e) => {
                            console.log(reader.result);
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

    deleteFile(info: any) {
        const deleteDialog: HTMLDivElement = NyaDom.byId('deleteDialog') as HTMLDivElement;
        const dialogContent: HTMLDivElement[] = NyaDom.dom('.mdui-dialog-content', deleteDialog) as HTMLDivElement[];

        dialogContent.forEach((element) => {
            element.innerHTML = '是否删除文件：' + info[this.api.str.name] + ' ?';
        });

        const that = this;
        const obj = {
            uhash: this.userInfo[this.api.str.hash],
            fh: info[this.api.str.hash],
        };
        const elistener = {
            uhash: '',
            fh: '',
            fuc() {
                that.api.netWork(window.g_url + 'fileDelete/', { uhash: this.uhash, fh: this.fh }, true, (data) => {
                    if (data != null) {
                        const redata = JSON.parse(data.response);
                        // console.log(redata);
                        if (data.status === 200) {
                            //TODO:成功
                        } else {
                            alert(redata.msg);
                        }
                    }
                });
            },
        };
        deleteDialog.removeEventListener('confirm', this.confirmDeleteObj);
        this.confirmDeleteObj = elistener.fuc.bind(obj);
        deleteDialog.addEventListener('confirm', this.confirmDeleteObj);
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
