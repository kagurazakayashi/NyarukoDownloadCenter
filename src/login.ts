import mdui from 'mdui';
import NyaDom from './nyalib/nyadom';
import NyaTemplate from './nyalib/nyatemplate';
import NyaNetwork from './nyalib/nyanetwork';
import NyaAs from './nyalib/nyaas';

export default class Login {
    templateHTML: string = ''

    constructor() {
        this.loadLogin();
        mdui.mutation();
    }

    loadLogin() {
        if (this.templateHTML.length == 0) {
            NyaNetwork.get('dist/login.template.html', undefined, (data: XMLHttpRequest | null, status: number) => {
                if (data != null) {
                    this.templateHTML = data.responseText;
                    this.loadLoginUI();
                    const loginDialog:HTMLDivElement = NyaAs.div(NyaDom.byId('loginDialog'));
                    const loginDialogWindow = new mdui.Dialog(loginDialog,{
                        overlay: true,
                        history: false,
                        modal: true,
                        closeOnEsc: false,
                        closeOnCancel: false,
                        closeOnConfirm: false,
                        destroyOnClosed: true,
                    });
                    loginDialogWindow.open();
                    loginDialogWindow.handleUpdate();
                }
            }, false);
        }
    }

    loadLoginUI() {
        if (this.templateHTML.length > 0) {
            NyaDom.byClassFirst('container').innerHTML = NyaTemplate.loadTemplateHtml(this.templateHTML, 'subtemplate1', [], false);
        }
    }
}