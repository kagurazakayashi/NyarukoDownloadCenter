import mdui from 'mdui';
import API from './API';
import Login from './login';
import NyaNetwork from './nyalib/nyanetwork';
import { NyaTemplateElement } from './nyalib/nyatemplate';

export default class UserFileList {
    templateElement: NyaTemplateElement | null = null;
    api: API = new API();
    userInfo: any = {};

    constructor() {
        var infoStr: string | null = sessionStorage.getItem('info');
        var info: any = {};
        if (infoStr == '' || infoStr == null || infoStr == 'undefined') {
            window.history.back();
            return;
        } else {
            info = JSON.parse(infoStr);
        }
        var userShow: string = info['nickname'] == '' ? info['username'] : info['nickname'] + '(' + info['username'] + ')';
        window.g_Title.innerHTML = '管理文件/' + userShow;
        this.userInfo = info;
        this.api.getTempHTML(this.templateElement, 'FileList.template', (res) => {
            const token = sessionStorage.getItem('Token');
            if (token == '' || token == null || token == 'undefined') {
                var login = new Login();
            } else {
                this.getFileList(token);
            }
            return true;
        });
        mdui.mutation();
    }

    getFileList(t: string) {
        NyaNetwork.post(
            window.g_url + 'fileList/',
            { t: t, uhash: this.userInfo['hash'] },
            (data: XMLHttpRequest | null, status: number) => {
                if (data != null) {
                    var redata: any = JSON.parse(data.response);
                    console.log(redata);
                }
            },
            false
        );
    }
}
