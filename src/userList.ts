import mdui from 'mdui';
import API from './API';
import UserFileList from './fileList';
import Login from './login';
import NyaDom from './nyalib/nyadom';
import NyaNetwork from './nyalib/nyanetwork';
import { NyaTemplateElement } from './nyalib/nyatemplate';
import QRCode from 'qrcode-generator';

export default class UserList {
    templateElement: NyaTemplateElement | null = null;
    api: API = new API();
    confirmDeleteObj: any = null;
    confirmQRCodeGObj: any = null;

    constructor() {
        window.g_Title.innerHTML = '用户列表';
        // sessionStorage.removeItem('info');
        this.api.getTempHTML(this.templateElement, 'userlist.template', (templateElement) => {
            this.templateElement = templateElement;
            this.getUserList();

            return true;
        });
        mdui.mutation();
    }

    getUserList() {
        let arg = {
            enable: 1,
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
                        // console.log(redata);
                        let tabStr: string = '';
                        const infos: any[] = [];
                        redata['data'].forEach((ele: any) => {
                            const creationDate = ele[this.api.str.creation_date] > 0 ? this.api.formatTimeStamp(ele[this.api.str.creation_date] * 1000, this.api.str.date) : '';
                            const modificationDate = ele[this.api.str.modification_date] > 0 ? this.api.formatTimeStamp(ele[this.api.str.modification_date] * 1000, this.api.str.date) : '';
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
                        const btnqrs: HTMLButtonElement[] = NyaDom.byClass('ulbtnqr') as HTMLButtonElement[];
                        const btnEdits: HTMLButtonElement[] = NyaDom.byClass('ulbtnedit') as HTMLButtonElement[];
                        const btndeletes: HTMLButtonElement[] = NyaDom.byClass('ulbtndelete') as HTMLButtonElement[];
                        for (let i = 0; i < infos.length; i++) {
                            const elInfo: string = infos[i];
                            const that = this;
                            const elbtninfo: HTMLButtonElement = btninfos[i];
                            elbtninfo.addEventListener(this.api.str.click, function () {
                                that.userInfo(elInfo);
                            });
                            const elbtnqr: HTMLButtonElement = btnqrs[i];
                            elbtnqr.addEventListener(this.api.str.click, function () {
                                that.qrcodeGenerator(elInfo);
                            });
                            const elbtnEdit: HTMLButtonElement = btnEdits[i];
                            elbtnEdit.addEventListener(this.api.str.click, function () {
                                that.userEdit(elInfo);
                            });
                            const elbtndeletes: HTMLButtonElement = btndeletes[i];
                            elbtndeletes.addEventListener(this.api.str.click, function () {
                                that.userDelete(elInfo);
                            });
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
        console.log('userInfo', info);
        this.clearScreen();
        sessionStorage.setItem('info', JSON.stringify(info));
        window.location.href = '#/userInfo';
    }

    qrcodeGenerator(info: any) {
        const qrcondDialog: HTMLDivElement = NyaDom.byId('qrGeneratorDialog') as HTMLDivElement;
        const dialogContent: HTMLInputElement[] = NyaDom.dom('.verifypassword', qrcondDialog) as HTMLInputElement[];
        const username: string = info['username'];
        const that = this;
        const obj = {
            hash: username,
        };
        const elistener = {
            hash: '',
            fuc() {
                const password: string = dialogContent[0].value;
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
                                    const url = window.g_url + '#a=qlogin&u=' + username + '&p=' + password;
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
        console.log('userEdit', info['hash']);
        sessionStorage.setItem('info', JSON.stringify(info));
        window.location.href = '#/userEdit';
    }

    userDelete(info: any) {
        console.log('userDelete', info['hash']);
        const deleteDialog: HTMLDivElement = NyaDom.byId('deleteDialog') as HTMLDivElement;
        const dialogContent: HTMLDivElement[] = NyaDom.dom('.mdui-dialog-content', deleteDialog) as HTMLDivElement[];
        console.log('dialogContent', dialogContent);

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
                        console.log(' redata ', data.response);
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
