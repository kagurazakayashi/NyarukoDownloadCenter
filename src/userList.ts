import mdui from 'mdui';
import API from './API';
import UserFileList from './fileList';
import Login from './login';
import NyaDom from './nyalib/nyadom';
import NyaNetwork from './nyalib/nyanetwork';
import { NyaTemplateElement } from './nyalib/nyatemplate';

export default class UserList {
    templateElement: NyaTemplateElement | null = null;
    api: API = new API();
    confirmDeleteObj: any = null;

    constructor() {
        window.g_Title.innerHTML = '用户列表';
        // sessionStorage.removeItem('info');
        this.api.getTempHTML(this.templateElement, 'userlist.template', (res) => {
            const token = sessionStorage.getItem('Token');
            if (token == '' || token == null || token == 'undefined') {
                var login = new Login();
            } else {
                this.getUserList(token);
            }
            return true;
        });
        mdui.mutation();
    }

    getUserList(t: string) {
        NyaNetwork.post(
            window.g_url + 'userList/',
            { t: t },
            (data: XMLHttpRequest | null, status: number) => {
                if (data != null) {
                    const redata = JSON.parse(data.response);
                    if (data.status == 200) {
                        // console.log(redata);
                        var tabStr: string = '';
                        var infos: any[] = [];
                        redata['data'].forEach((ele: any) => {
                            var creationDate = ele['creation_date'] > 0 ? this.api.formatTimeStamp(ele['creation_date'] * 1000, 'YYYY-MM-dd HH:mm:ss') : '';
                            var modificationDate = ele['modification_date'] > 0 ? this.api.formatTimeStamp(ele['modification_date'] * 1000, 'YYYY-MM-dd HH:mm:ss') : '';
                            tabStr += '<tr><td style="display:none"></td><td><button class="mdui-btn mdui-btn-icon ulbtninfo" mdui-tooltip="{content: \'管理文件\'}"><i class="mdui-icon material-icons">account_circle</i></button></td><td>' + ele['username'] + '</td><td>' + ele['nickname'] + '</td><td>' + window.g_PermissionsList[String(ele['permissions_id'])]['describe'] + '</td><td>' + creationDate + '</td><td>' + modificationDate + '</td><td><button class="mdui-btn mdui-btn-icon ulbtnedit"><i class="mdui-icon material-icons">edit</i></button></td><td><button class="mdui-btn mdui-btn-icon ulbtndelete" mdui-dialog="{target: \'#deleteDialog\'}"><i class="mdui-icon material-icons">delete</i></button></td></tr>';
                            infos.push(ele);
                        });
                        NyaDom.byId('userListBody').innerHTML = tabStr;
                        var btninfos: HTMLButtonElement[] = NyaDom.byClass('ulbtninfo') as HTMLButtonElement[];
                        var btnEdits: HTMLButtonElement[] = NyaDom.byClass('ulbtnedit') as HTMLButtonElement[];
                        var btndeletes: HTMLButtonElement[] = NyaDom.byClass('ulbtndelete') as HTMLButtonElement[];
                        for (let i = 0; i < infos.length; i++) {
                            const elInfo: string = infos[i];
                            const elbtninfo: HTMLButtonElement = btninfos[i];
                            const that = this;
                            elbtninfo.addEventListener('click', function () {
                                that.userInfo(elInfo);
                            });
                            const elbtnEdit: HTMLButtonElement = btnEdits[i];
                            elbtnEdit.addEventListener('click', function () {
                                that.userEdit(elInfo);
                            });
                            const elbtndeletes: HTMLButtonElement = btndeletes[i];
                            elbtndeletes.addEventListener('click', function () {
                                that.userDelete(elInfo);
                            });
                        }
                    } else {
                        switch (redata['code']) {
                            case 3900:
                                sessionStorage.removeItem('Token');
                                var login = new Login();
                                break;
                            case 4004:
                                this.api.logOut();
                                break;
                            default:
                                break;
                        }
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

    userEdit(info: any) {
        console.log('userEdit', info['hash']);
    }

    userDelete(info: any) {
        console.log('userDelete', info['hash']);
        var deleteDialog: HTMLDivElement = NyaDom.byId('deleteDialog') as HTMLDivElement;
        var dialogContent: HTMLDivElement[] = NyaDom.dom('.mdui-dialog-content', deleteDialog) as HTMLDivElement[];
        console.log('dialogContent', dialogContent);

        dialogContent.forEach((element) => {
            element.innerHTML = '是否删除用户：' + info['username'] + ' ?';
        });

        const obj = {
            hash: info['hash'],
        };
        const elistener = {
            hash: '',
            fuc() {
                // NyaNetwork.post(window.g_url + 'userList/', { t: this.hash }, (data: XMLHttpRequest | null, status: number) => {
                //     if (data != null) {
                //         const redata = JSON.parse(data.response);
                //         alert(redata);
                //     }
                // });
                console.log('!!!', this.hash);
            },
        };
        deleteDialog.removeEventListener('confirm', this.confirmDeleteObj);
        this.confirmDeleteObj = elistener.fuc.bind(obj);
        deleteDialog.addEventListener('confirm', this.confirmDeleteObj);
    }

    clearScreen() {
        var tooltips: HTMLDivElement[] = NyaDom.byClass('mdui-tooltip') as HTMLDivElement[];
        tooltips.forEach((tt) => {
            tt.remove();
        });
    }
}
