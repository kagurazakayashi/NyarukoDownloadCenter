import mdui from 'mdui';
import API from './API';
import Login from './login';
import NyaDom from './nyalib/nyadom';
import NyaNetwork from './nyalib/nyanetwork';
import NyaStrings from './nyalib/nyastrings';
import { NyaTemplateElement } from './nyalib/nyatemplate';
import NyaTime from './nyalib/nyatime';

export default class UserFileList {
    templateElement: NyaTemplateElement | null = null;
    api: API = new API();
    userInfo: any = {};
    filelist: any[] = [];
    confirmDeleteObj: any = null;

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
                let ctime: string = this.userInfo[this.api.str.creation_date] > 0 ? this.api.formatTimeStamp(this.userInfo[this.api.str.creation_date] * 1000, 'YYYY-MM-dd HH:mm:ss') : '';
                NyaDom.byId('ctime').innerText = ctime;
                ctime = this.userInfo[this.api.str.modification_date] > 0 ? this.api.formatTimeStamp(this.userInfo[this.api.str.modification_date] * 1000, 'YYYY-MM-dd HH:mm:ss') : '';
                NyaDom.byId('mtime').innerText = ctime;
                // NyaDom.byId('locale').innerText = this.userInfo['locale_code'];
                NyaDom.byId('enable').innerText = NyaStrings.booleanToString(this.userInfo['enable'], '是', '否');
                ctime = this.userInfo['disable_startdate'] > 0 ? NyaTime.timeStamp2timeString(this.userInfo['disable_startdate']) : '账户正常使用';
                NyaDom.byId('disStrTime').innerText = ctime;
                ctime = this.userInfo['disable_enddate'] > 0 ? NyaTime.timeStamp2timeString(this.userInfo['disable_enddate']) : '-';
                NyaDom.byId('disEndTime').innerText = ctime;
                this.getFileList(token);

                const btnDownloads = NyaDom.byClass('flbtnDownload');
                const btnDeletes = NyaDom.byClass('flbtnDelete');
                for (let i = 0; i < this.filelist.length; i++) {
                    const file = this.filelist[i];
                    btnDownloads[i].addEventListener(this.api.str.click, () => {
                        this.downLoad(file);
                    });
                    btnDeletes[i].addEventListener(this.api.str.click, () => {
                        this.deleteFile(file);
                    });
                }
                const btnfileUpload = NyaDom.byId('btnFileUpload');
                btnfileUpload.addEventListener(this.api.str.click, () => {
                    this.fileUP();
                });
            }
            return true;
        });
        mdui.mutation();
    }

    getFileList(t: string) {
        const url: string = window.g_url + 'fileList/';
        const arg = {
            t: t,
            uhash: this.userInfo['hash'],
        };
        this.api.netWork(url, arg, true, (data) => {
            if (data != null) {
                let redata: any = JSON.parse(data.response);
                if (data.status == 200) {
                    this.genFileList(redata.data);
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
        for (const item of data) {
            const namestyle = 'style="color: ' + (item.exist == 1 ? 'black' : 'gray; text-decoration:line-through') + ';"';
            html += this.templateElement?.codeByID('row', [
                ['namestyle', namestyle],
                [this.api.str.name, item.name],
                [this.api.str.describe, item.describe.length ? item.describe : '无'],
                [this.api.str.creation_date, NyaTime.timeStamp2timeString(item.creation_date, 5)],
                [this.api.str.modification_date, NyaTime.timeStamp2timeString(item.modification_date, 5)],
            ]);
            this.filelist.push(item);
        }
        NyaDom.byId('fileListBody').innerHTML = html.length > 0 ? html : '<p>没有文件</p>';
    }

    downLoad(fhash: string) {
        console.log(fhash);
        this.api.netWork(
            window.g_url + 'fileDownload/',
            { fh: fhash[this.api.str.hash], path: 1 },
            true,
            (data) => {
                if (data != null) {
                    console.log(data);
                    if (data.status === 200) {
                        // 返回200
                        var blob = data.response;
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
                        var blob = data.response;
                        var reader = new FileReader();
                        reader.readAsText(blob, 'utf8'); // 转换为base64，可以直接放入a表情href
                        reader.onload = (e) => {
                            var msg = JSON.parse(reader.result as string);
                            this.api.errHandle(msg['code']);
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
        console.log('dialogContent', dialogContent);

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
                        if (data.status === 200) {
                            //TODO:成功
                        } else {
                            alert(redata.msg);
                        }
                    }
                });
                console.log('!!!', this.uhash, '\r\n', this.fh);
            },
        };
        deleteDialog.removeEventListener('confirm', this.confirmDeleteObj);
        this.confirmDeleteObj = elistener.fuc.bind(obj);
        deleteDialog.addEventListener('confirm', this.confirmDeleteObj);
    }

    fileUP() {
        const inputF: HTMLInputElement = NyaDom.byId('fuDialogFile') as HTMLInputElement;
        const fileUploadDialog: HTMLDivElement = NyaDom.byId('fileUploadDialog') as HTMLDivElement;
        // const btnConfirm: HTMLButtonElement = NyaDom.dom('.mdui-btn', fileUploadDialog, true) as HTMLButtonElement;
        console.log(new Date().valueOf());
        const that = this;
        const obj = {
            uhash: this.userInfo[this.api.str.hash],
        };
        const elistener = {
            uhash: '',
            fuc() {
                const files: FileList | null = inputF.files;
                if (files != null && files.length > 0) {
                    // const xhr: XMLHttpRequest = new XMLHttpRequest();
                    // xhr.open('post', window.g_url + 'fileUpdata/', true);
                    // xhr.onload = function () {
                    //     // this.log(`请求网址 ${url} 成功，返回数据 ${this.responseText}`, this.nyaLibName);
                    //     console.log(this);
                    // };
                    // xhr.onerror = function () {
                    //     // this.log(`请求网址 ${url} 失败，返回状态码 ${this.status}`, this.nyaLibName, -2);
                    //     console.log(this);
                    // };

                    // xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
                    // xhr.setRequestHeader('Content-Type', 'multipart/form-data');
                    // const token = sessionStorage.getItem('Token');
                    // const dataStr: any = { uhash: this.uhash, t: token, f: files.item(0) };
                    // xhr.send(dataStr);

                    that.api.netWork(
                        window.g_url + 'fileUpdata/',
                        { uhash: this.uhash, f: files.item(0) },
                        true,
                        (data) => {
                            if (data != null) {
                                const redata = JSON.parse(data.response);
                                console.log(redata);
                                if (data.status === 200) {
                                    //TODO:成功
                                } else {
                                    alert(redata.msg);
                                }
                            }
                        },
                        false,
                        false
                    );
                } else {
                    alert('没有选择文件');
                }
            },
        };
        fileUploadDialog.removeEventListener('confirm', this.confirmDeleteObj);
        this.confirmDeleteObj = elistener.fuc.bind(obj);
        fileUploadDialog.addEventListener('confirm', this.confirmDeleteObj);
    }
}
