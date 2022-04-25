import mdui from 'mdui';
import NyaDom from './nyalib/nyadom';
import NyaDebug from './nyalib/nyadebug';
import Login from './login';
import NyaNetwork from './nyalib/nyanetwork';
import API from './API';

export default class InitUI {
    login: Login = new Login();

    constructor() {
        var api: API = new API();
        api.getPermissionsList();
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
