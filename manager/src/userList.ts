import mdui from 'mdui';
import API from './API';
import UserFileList from './fileList';
import Login from './login';
import NyaDom from './nyalib/nyadom';
import NyaNetwork from './nyalib/nyanetwork';
import { NyaTemplateElement } from './nyalib/nyatemplate';
import QRCode from 'qrcode-generator';
import NyaTime from './nyalib/nyatime';
import NyaEvent, { NyaEventListener } from './nyalib/nyaevent';

export default class UserList {
    templateElement: NyaTemplateElement | null = null;
    api: API = new API();
    confirmDeleteObj: any = null;
    confirmQRCodeGObj: any = null;
    nowStart: number = 0;
    fileNumber: number = 10;
    events: NyaEventListener[] = [];

    constructor() {
        window.g_Title.innerHTML = '用户列表';
        // sessionStorage.removeItem('info');
        this.api.getTempHTML(this.templateElement, 'userlist.template', (templateElement) => {
            this.templateElement = templateElement;
            const selectLocale: HTMLSelectElement = NyaDom.byId('locale') as HTMLSelectElement;
            selectLocale.innerHTML = '';
            for (const key in window.g_LocaleList) {
                if (Object.prototype.hasOwnProperty.call(window.g_LocaleList, key)) {
                    const element = window.g_LocaleList[key];
                    selectLocale.innerHTML += '<option value="' + key + '">' + element[1] + '</option>';
                }
            }
            NyaEvent.addEventListener(NyaDom.byId('btnFileUpload'), () => {
                sessionStorage.removeItem('info');
                this.api.urlhref('#/userEdit');
            });
            this.getUserList();
            if (window.g_btnReloadEvent != null) {
                NyaEvent.removeEventListener(window.g_btnReloadEvent);
            }
            window.g_btnReloadEvent = NyaEvent.addEventListener(NyaDom.byId('btnReload'),()=>{
                this.getUserList();
            });
            return true;
        });
        mdui.mutation();
    }
    turning(t: number) {
        if (Number(t) < 0) {
            this.nowStart -= this.fileNumber;
        } else {
            this.nowStart += this.fileNumber;
        }
        this.getUserList();
    }
    jumppage(j: string) {
        this.nowStart = (Number(j) - 1) * this.fileNumber;
        this.getUserList();
    }

    getUserList() {
        let arg = {
            enable: 1,
            offset: this.nowStart,
            rows: this.fileNumber,
        };
        const nowurl: string[] = window.location.href.split('?');
        if (nowurl.length > 1) {
            const params = new URLSearchParams(nowurl[1]);
            const enable = params.get('enable');
            if (enable != null) {
                try {
                    const enableNumber = Number(enable);
                    if (0 <= enableNumber && enableNumber <= 2) {
                        arg.enable = enableNumber;
                    }
                } catch (error) {}
            }
        }
        this.api.netWork(
            window.g_url + 'userList/',
            arg,
            true,
            (data) => {
                if (data != null) {
                    const redata = JSON.parse(data.response);
                    if (data.status == 200) {
                        let tabStr: string = '';
                        const infos: any[] = [];
                        const listData = redata['data']['data'];
                        const offset = redata['data']['offset'];
                        const rows = redata['data']['rows'];
                        const total = redata['data']['total'];
                        NyaEvent.removeEventListeners(this.events);
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
                                        const ev1: NyaEventListener | null = NyaEvent.addEventListener(ele, () => {
                                            this.turning(-1);
                                        });
                                        if (ev1) this.events.push(ev1);
                                        break;
                                    case '下一页':
                                        const ev2: NyaEventListener | null = NyaEvent.addEventListener(ele, () => {
                                            this.turning(1);
                                        });
                                        if (ev2) this.events.push(ev2);
                                        break;

                                    default:
                                        const ev3: NyaEventListener | null = NyaEvent.addEventListener(ele, () => {
                                            this.jumppage(ele.innerText);
                                        });
                                        if (ev3) this.events.push(ev3);
                                        break;
                                }
                            });
                        }
                        listData.forEach((ele: any) => {
                            const creationDate = ele[this.api.str.creation_date] > 0 ? NyaTime.timeStamp2timeStringFormat(ele[this.api.str.creation_date] * 1000, this.api.str.date) : '';
                            const modificationDate = ele[this.api.str.modification_date] > 0 ? NyaTime.timeStamp2timeStringFormat(ele[this.api.str.modification_date] * 1000, this.api.str.date) : '';
                            tabStr += this.templateElement?.codeByID('row', [
                                [this.api.str.username, ele[this.api.str.username]],
                                [this.api.str.nickname, ele[this.api.str.nickname]],
                                [this.api.str.describe, window.g_PermissionsList[String(ele['permissions_id'])][this.api.str.describe]],
                                [this.api.str.creation_date, creationDate],
                                [this.api.str.modification_date, modificationDate],
                            ]);
                            infos.push(ele);
                        });
                        NyaDom.byId('userListBody').innerHTML = tabStr;
                        const btninfos: HTMLButtonElement[] = NyaDom.byClass('ulbtninfo') as HTMLButtonElement[];
                        const btnnames: HTMLSpanElement[] = NyaDom.byClass('ulbtnname') as HTMLSpanElement[];
                        const btnqrs: HTMLButtonElement[] = NyaDom.byClass('ulbtnqr') as HTMLButtonElement[];
                        const btnEdits: HTMLButtonElement[] = NyaDom.byClass('ulbtnedit') as HTMLButtonElement[];
                        const btndeletes: HTMLButtonElement[] = NyaDom.byClass('ulbtndelete') as HTMLButtonElement[];
                        for (let i = 0; i < infos.length; i++) {
                            const elInfo: string = infos[i];
                            const that = this;
                            const elbtninfo: HTMLButtonElement = btninfos[i];
                            const elbtnname: HTMLSpanElement = btnnames[i];
                            const ev1: NyaEventListener | null = NyaEvent.addEventListener(elbtninfo, function () {
                                that.userInfo(elInfo);
                            });
                            if (ev1) this.events.push(ev1);
                            const ev2: NyaEventListener | null = NyaEvent.addEventListener(elbtnname, function () {
                                that.userInfo(elInfo);
                            });
                            if (ev2) this.events.push(ev2);
                            const elbtnqr: HTMLButtonElement = btnqrs[i];
                            const ev3: NyaEventListener | null = NyaEvent.addEventListener(elbtnqr, function () {
                                that.qrcodeGenerator(elInfo);
                            });
                            if (ev3) this.events.push(ev3);
                            const elbtnEdit: HTMLButtonElement = btnEdits[i];
                            const ev4: NyaEventListener | null = NyaEvent.addEventListener(elbtnEdit, function () {
                                that.userEdit(elInfo);
                            });
                            if (ev4) this.events.push(ev4);
                            const elbtndeletes: HTMLButtonElement = btndeletes[i];
                            const ev5: NyaEventListener | null = NyaEvent.addEventListener(elbtndeletes, function () {
                                that.userDelete(elInfo);
                            });
                            if (ev5) this.events.push(ev5);
                        }
                    } else {
                        this.api.errHandle(redata['code']);
                    }
                }
            },
            false
        );
    }

    userInfo(info: any) {
        // console.log('userInfo', info);
        this.clearScreen();
        sessionStorage.setItem('info', JSON.stringify(info));
        this.api.urlhref('#/userInfo');
    }

    qrcodeGenerator(info: any) {
        const qrcondDialog: HTMLDivElement = NyaDom.byId('qrGeneratorDialog') as HTMLDivElement;
        const dialogContent: HTMLSelectElement[] | HTMLInputElement[] = NyaDom.dom('.item', qrcondDialog) as HTMLSelectElement[] | HTMLInputElement[];
        const username: string = info['username'];
        const that = this;
        const obj = {
            hash: username,
        };
        const elistener = {
            hash: '',
            fuc() {
                let password: string = '';
                let locale: string = '';
                dialogContent.forEach((ele) => {
                    switch (ele.name) {
                        case 'password':
                            password = ele.value;
                            break;
                        case 'locale':
                            locale = ele.value;
                            break;

                        default:
                            break;
                    }
                });
                that.api.netWork(
                    window.g_url + 'login/',
                    {
                        username: username,
                        password: password,
                        verify: 1,
                    },
                    false,
                    (data) => {
                        if (data != null) {
                            if (data.status === 200) {
                                setTimeout(() => {
                                    const url = window.g_QRurl + '#/' + locale + '/f/' + username + '/' + password + '/-';
                                    const qr: QRCode = QRCode(5, 'L');
                                    qr.addData(url, 'Byte');
                                    qr.make();
                                    const qrData: string = qr.createSvgTag();
                                    const qrcodeBox: HTMLDivElement = NyaDom.byId('qrcode') as HTMLDivElement;
                                    qrcodeBox.innerHTML = qrData;
                                    const qrCodeDL: HTMLAnchorElement = NyaDom.byId('qrCodeDL') as HTMLAnchorElement;
                                    qrCodeDL.href = qr.createDataURL();
                                    qrCodeDL.download = 'qr_' + username + '.gif';
                                    const qrDialog = new mdui.Dialog(NyaDom.byId('qrDialog'), {
                                        history: false,
                                    });
                                    qrDialog.open();
                                }, 100);
                            } else {
                                mdui.alert('密码错误', username, undefined, {
                                    history: false,
                                });
                            }
                        }
                    }
                );
            },
        };
        qrcondDialog.removeEventListener('confirm', this.confirmQRCodeGObj);
        this.confirmQRCodeGObj = elistener.fuc.bind(obj);
        qrcondDialog.addEventListener('confirm', this.confirmQRCodeGObj);
    }

    userEdit(info: any) {
        // console.log('userEdit', info['hash']);
        sessionStorage.setItem('info', JSON.stringify(info));
        this.api.urlhref('#/userEdit');
    }

    userDelete(info: any) {
        // console.log('userDelete', info['hash']);
        const deleteDialog: HTMLDivElement = NyaDom.byId('deleteDialog') as HTMLDivElement;
        const dialogContent: HTMLDivElement[] = NyaDom.dom('.mdui-dialog-content', deleteDialog) as HTMLDivElement[];
        // console.log('dialogContent', dialogContent);

        dialogContent.forEach((element) => {
            element.innerHTML = '是否删除用户：' + info[this.api.str.username] + ' ?';
        });

        const that = this;
        const obj = {
            hash: info[this.api.str.hash],
        };
        const elistener = {
            hash: '',
            fuc() {
                that.api.netWork(window.g_url + 'userDelete/', { h: this.hash }, true, (data) => {
                    if (data != null) {
                        const redata = JSON.parse(data.response);
                        // console.log(' redata ', data.response);
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

    clearScreen() {
        const tooltips: HTMLDivElement[] = NyaDom.byClass('mdui-tooltip') as HTMLDivElement[];
        tooltips.forEach((tt) => {
            tt.remove();
        });
    }
}
