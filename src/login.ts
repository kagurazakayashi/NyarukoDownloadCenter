import mdui from 'mdui';
import NyaDom from './nyalib/nyadom';
import NyaTemplate, { NyaTemplateElement } from './nyalib/nyatemplate';
import NyaNetwork from './nyalib/nyanetwork';
import NyaAs from './nyalib/nyaas';

export default class Login {
    templateHTML: string = '';

    constructor() {
        const token = sessionStorage.getItem('Token');
        console.log('==', token, '==');
        if (token == '' || token == null || token == 'undefined') {
            this.loadLogin();
        } else {
            this.getUserInfo(token);
        }
        mdui.mutation();
    }

    loadLogin() {
        NyaTemplate.loadTemplate('dist/login.template.html', NyaDom.byClassFirst('container'), (templateElement: NyaTemplateElement) => {
            if (templateElement.status < 1) {
                return;
            }
            this.loginDialog();
            this.buttonOnClick();
        });
    }

    loginDialog() {
        const loginDialog: HTMLDivElement = NyaAs.div(NyaDom.byClassFirst('loginDialog'));
        window.g_Dialog = new mdui.Dialog(loginDialog, {
            overlay: true,
            history: false,
            modal: true,
            closeOnEsc: false,
            closeOnCancel: false,
            closeOnConfirm: false,
            destroyOnClosed: true,
        });
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
                            alert(redata.msg);
                        }
                    }
                },
                false
            );
        });
    }

    getUserInfo(token: string) {
        console.log('==========');
        NyaNetwork.post(
            window.g_url + 'userInfo/',
            { t: token },
            (data: XMLHttpRequest | null, status: number) => {
                console.log(data);
                if (data != null) {
                    if (data.status == 200) {
                    } else {
                    }
                }
            },
            false
        );
    }
}
