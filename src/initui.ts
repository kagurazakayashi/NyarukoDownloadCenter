import NyaDom from './nyalib/nyadom';
import NyaDebug from './nyalib/nyadebug';
import Login from './login';
import API from './API';

export default class InitUI {
    login: Login = new Login();
    api: API = new API();

    constructor() {
        this.api.getPermissionsList();
        this.api.getLocaleList();

        this.api.jumpPage();
        window.onhashchange = () => {
            this.api.jumpPage();
        };
        this.meta();
    }

    windowResize() {}

    /**
     * 在网页中插入客户端信息以方便调试
     */
    meta() {
        NyaDom.metaSet('description', NyaDom.metaGet('abstract') + NyaDom.metaGet('keywords'));
        NyaDebug.infoToMeta();
        NyaDom.metaSet('title', document.title);
        NyaDom.byId('title').innerHTML = document.title = NyaDom.metaGet('abstract') + NyaDom.metaGet('keywords');
    }
}
