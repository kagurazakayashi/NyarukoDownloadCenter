import mdui from 'mdui';
import NyaDom from './nyalib/nyadom';
import NyaTemplate, { NyaTemplateElement } from './nyalib/nyatemplate';
import NyaNetwork from './nyalib/nyanetwork';
import NyaAs from './nyalib/nyaas';
import API from './API';
import UserList from './userList';
import NyaArgv from './nyalib/nyaargv';
import UserFileList from './fileList';

export default class Login {
    templateElement: NyaTemplateElement | null = null;
    api: API = new API();

    constructor() {
        window.g_Title = NyaDom.byClassFirst('mdui-typo-title');
        window.g_Title.innerHTML = '登录';
        const token = sessionStorage.getItem('Token');
        if (token == '' || token == null || token == 'undefined') {
            this.api.getTempHTML(this.templateElement, 'login.template', () => {
                this.loginDialog();
                this.buttonOnClick();
                return true;
            });
        } else {
            this.getUserInfo(token);
        }
        mdui.mutation();
    }

    loginDialog() {
        if (window.g_Dialog == null) {
            const loginDialog: HTMLDivElement = NyaAs.div(NyaDom.byId('dialog'));
            window.g_Dialog = new mdui.Dialog(loginDialog, {
                overlay: true,
                history: false,
                modal: true,
                closeOnEsc: false,
                closeOnCancel: false,
                closeOnConfirm: false,
                destroyOnClosed: true,
            });
        }
        window.g_Dialog.open();
        window.g_Dialog.handleUpdate();
    }

    buttonOnClick() {
        const btnLogin = NyaDom.byId('btnLogin');
        btnLogin.addEventListener('click', () => {
            const linputs: HTMLInputElement[] = NyaDom.byClass('loginInput') as HTMLInputElement[];
            var netjson: {
                username: string;
                password: string;
                isScan: number;
            } = { username: '', password: '', isScan: 1 };
            linputs.forEach((element) => {
                switch (element.name) {
                    case 'name':
                        netjson.username = element.value;
                        break;
                    case 'password':
                        netjson.password = element.value;
                        break;

                    default:
                        break;
                }
            });
            NyaNetwork.post(
                window.g_url + 'login/',
                netjson,
                (data: XMLHttpRequest | null, status: number) => {
                    if (data != null) {
                        const redata = JSON.parse(data.response);
                        if (data.status == 200) {
                            sessionStorage.setItem('Token', redata.data);
                            NyaDom.byClassFirst('container').innerHTML = '';
                            window.g_Dialog.close();
                            this.getUserInfo(redata.data);
                        } else {
                            alert(data.responseText);
                        }
                    }
                },
                false
            );
        });
    }

    getUserInfo(token: string) {
        NyaNetwork.post(
            window.g_url + 'userInfo/',
            { t: token },
            (data: XMLHttpRequest | null, status: number) => {
                if (data != null) {
                    var isTouserList = true;
                    if (data.status == 200) {
                        var userInfo = JSON.parse(data.response)['data'];
                        var permission = JSON.parse(userInfo['permissions']);
                        if (permission['id'] != 1) {
                            isTouserList = false;
                            console.log(data.responseText);
                            alert('此用户没有权限');
                        }
                    } else {
                        isTouserList = false;
                        this.api.getTempHTML(this.templateElement, 'login.template', () => {
                            this.loginDialog();
                            this.buttonOnClick();
                            return true;
                        });
                    }
                    if (isTouserList) {
                        const userList = new UserList();
                    } else {
                        this.api.logOut();
                    }
                }
            },
            false
        );
    }
}
