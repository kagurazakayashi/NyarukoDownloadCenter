import mdui from 'mdui';
import API from './API';
import Login from './login';
import NyaDom from './nyalib/nyadom';
import NyaNetwork from './nyalib/nyanetwork';
import { NyaTemplateElement } from './nyalib/nyatemplate';

export default class UserList {
    templateElement: NyaTemplateElement | null = null;
    api: API = new API();

    constructor() {
        window.g_Title.innerHTML = '用户列表';
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
                        console.log(redata);
                        var tabStr: string = '';
                        var hashs: string[] = [];
                        redata['data'].forEach((ele: any) => {
                            var creationDate = ele['creation_date'] > 0 ? this.api.formatTimeStamp(ele['creation_date'] * 1000, 'YYYY-MM-dd HH:mm:ss') : '';
                            var modificationDate = ele['modification_date'] > 0 ? this.api.formatTimeStamp(ele['modification_date'] * 1000, 'YYYY-MM-dd HH:mm:ss') : '';
                            tabStr += '<tr><td style="display:none"></td><td><button class="mdui-btn mdui-btn-icon ulbtninfo"><i class="mdui-icon material-icons">account_circle</i></button></td><td>' + ele['username'] + '</td><td>' + ele['nickname'] + '</td><td>' + window.g_PermissionsList[String(ele['permissions_id'])]['describe'] + '</td><td>' + creationDate + '</td><td>' + modificationDate + '</td><td><button class="mdui-btn mdui-btn-icon ulbtnedit"><i class="mdui-icon material-icons">edit</i></button></td><td><button class="mdui-btn mdui-btn-icon ulbtndelete"><i class="mdui-icon material-icons">delete</i></button></td></tr>';
                            hashs.push(ele['hash']);
                        });
                        NyaDom.byId('userListBody').innerHTML = tabStr;
                        var btninfos: HTMLButtonElement[] = NyaDom.byClass('ulbtninfo') as HTMLButtonElement[];
                        var btnEdits: HTMLButtonElement[] = NyaDom.byClass('ulbtnedit') as HTMLButtonElement[];
                        var btndeletes: HTMLButtonElement[] = NyaDom.byClass('ulbtndelete') as HTMLButtonElement[];
                        for (let i = 0; i < hashs.length; i++) {
                            const ele: string = hashs[i];
                            const elbtninfo: HTMLButtonElement = btninfos[i];
                            elbtninfo.addEventListener('click', () => {
                                this.userInfo(ele);
                            });
                            const elbtnEdit: HTMLButtonElement = btnEdits[i];
                            elbtnEdit.addEventListener('click', () => {
                                this.userEdit(ele);
                            });
                            const elbtndeletes: HTMLButtonElement = btndeletes[i];
                            elbtndeletes.addEventListener('click', () => {
                                this.userDelete(ele);
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

    userInfo(userhash: string) {
        console.log('userInfo', userhash);
    }

    userEdit(userhash: string) {
        console.log('userEdit', userhash);
    }

    userDelete(userhash: string) {
        console.log('userDelete', userhash);
    }
}
