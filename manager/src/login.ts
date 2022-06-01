import mdui from 'mdui';
import NyaDom from './nyalib/nyadom';
import NyaTemplate, { NyaTemplateElement } from './nyalib/nyatemplate';
import NyaNetwork from './nyalib/nyanetwork';
import NyaAs from './nyalib/nyaas';
import API from './API';
import UserList from './userList';

export default class Login {
    templateElement: NyaTemplateElement | null = null;
    api: API = new API();

    constructor() {
        // console.log('Login');
        window.g_nowurl = 'Login';
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
            this.api.getGroupList();
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
        btnLogin.addEventListener(this.api.str.click, () => {
            const linputs: HTMLInputElement[] = NyaDom.byClass('loginInput') as HTMLInputElement[];
            var netjson: {
                username: string;
                password: string;
                isScan: number;
            } = { username: '', password: '', isScan: 1 };
            linputs.forEach((element) => {
                switch (element.name) {
                    case this.api.str.name:
                        netjson.username = element.value;
                        break;
                    case 'password':
                        netjson.password = element.value;
                        break;

                    default:
                        break;
                }
            });
            this.api.netWork(window.g_url + 'login/', netjson, false, (data) => {
                // console.log(data);
                if (data != null) {
                    const redata = JSON.parse(data.response);
                    if (data.status == 200) {
                        sessionStorage.removeItem('info');
                        sessionStorage.setItem('Token', redata.data);
                        this.api.getGroupList();
                        NyaDom.byClassFirst('container').innerHTML = '';
                        window.g_Dialog.close();
                        this.getUserInfo(redata.data);
                    } else {
                        alert(data.responseText);
                    }
                }
            });
        });
    }

    getUserInfo(token: string) {
        this.api.netWork(window.g_url + 'userInfo/', {}, true, (data) => {
            if (data != null) {
                var isTouserList = true;
                if (data.status == 200) {
                    var userInfo = JSON.parse(data.response)['data'];
                    var permission = JSON.parse(userInfo['permissions']);
                    if (permission['id'] != 1) {
                        isTouserList = false;
                        // console.log(data.responseText);
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
                    // console.log('!!!!!');
                    this.api.jumpPage(() => {
                        const userList = new UserList();
                        return true;
                    });
                } else {
                    this.api.logOut();
                }
            }
        });
    }
}
