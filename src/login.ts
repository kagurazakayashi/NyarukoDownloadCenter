import mdui from 'mdui';
import NyaDom from './nyalib/nyadom';
import NyaTemplate from './nyalib/nyatemplate';
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
        this.loadLoginUI(this.templateHTML, 'login.template', (res) => {
            if (!res) {
                return res;
            }
            const loginDialog: HTMLDivElement = NyaAs.div(NyaDom.byId('container'));
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
            this.buttonOnClick();
            return true;
        });
    }

    loadLoginUI(templateHTML: string, tempName: string, callback: (res: any) => {}) {
        var tempHTML = NyaTemplate.loadTemplateHtml(templateHTML, tempName, [], false);
        if (tempHTML == '') {
            NyaNetwork.get('dist/' + tempName + '.html', undefined, (data: XMLHttpRequest | null, status: number) => {
                if (data != null) {
                    templateHTML = data.responseText;
                    this.loadLoginUI(templateHTML, tempName, (res) => {
                        return callback(res);
                    });
                } else {
                    alert();
                }
            });
        } else {
            NyaDom.byClassFirst('container').innerHTML = tempHTML;
            callback(true);
        }
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
