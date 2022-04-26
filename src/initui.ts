import mdui from 'mdui';
import NyaDom from './nyalib/nyadom';
import NyaDebug from './nyalib/nyadebug';
import Login from './login';
import NyaNetwork from './nyalib/nyanetwork';
import API from './API';
import UserFileList from './fileList';
import UserList from './userList';

export default class InitUI {
    login: Login = new Login();

    constructor() {
        var api: API = new API();
        api.getPermissionsList();
        window.onhashchange = function () {
            var url: string[] = window.location.href.split('/#/');
            if (url.length == 2) {
                switch (url[1]) {
                    case 'userInfo':
                        const userFileList = new UserFileList();
                        break;
                    default:
                        const userList = new UserList();
                        break;
                }
            }else{
                const userList = new UserList();
            }
        };
        this.meta();
    }

    windowResize() {}

    /**
     * 在网页中插入客户端信息以方便调试
     */
    meta() {
        NyaDom.metaSet('description', NyaDom.metaGet('abstract') + ' ' + NyaDom.metaGet('keywords'));
        NyaDebug.infoToMeta();
        NyaDom.metaSet('title', document.title);
        NyaDom.byId('title').innerHTML = document.title = NyaDom.metaGet('abstract') + NyaDom.metaGet('keywords');
    }
}
