import mdui from 'mdui';
import NyaDom from './nyalib/nyadom';
import NyaTemplate from './nyalib/nyatemplate';
import NyaNetwork from './nyalib/nyanetwork';

export default class InitUI {
    templateHTML: string = ''

    constructor() {
        this.meta();
        this.loadLogin();
        mdui.mutation();
    }

    loadLogin() {
        if (this.templateHTML.length == 0) {
            NyaNetwork.get('dist/login.template.html', undefined, (data: XMLHttpRequest | null, status: number) => {
                if (data != null) {
                    this.templateHTML = data.responseText;
                    this.loadLoginUI()
                }
            }, false);
        }
    }

    loadLoginUI() {
        if (this.templateHTML.length > 0) {
            NyaDom.byClassFirst('container').innerHTML = NyaTemplate.loadTemplateHtml(this.templateHTML, 'subtemplate1', [], false);
        }
    }

    windowResize() {
        
    }

    meta() {
        this.addMeta('description', this.getMeta('abstract') + ' ' + this.getMeta('keywords'));
        this.addMeta('title', document.title);
        this.addMeta('u.cookie', navigator.cookieEnabled.toString());
        this.addMeta('u.track', navigator.doNotTrack ?? '');
        this.addMeta('u.hc', navigator.hardwareConcurrency.toString());
        this.addMeta('u.touch', navigator.maxTouchPoints.toString());
        this.addMeta('u.online', navigator.onLine.toString());
        this.addMeta('u.driver', navigator.webdriver.toString());
        this.addMeta('u.lang', navigator.language);
        this.addMeta('u.langs', navigator.languages.join(', '));
        this.addMeta('u.vendor', navigator.vendor);
        this.addMeta('u.ua', navigator.userAgent);
        NyaDom.byId('title').innerHTML = document.title = this.getMeta('abstract') + this.getMeta('keywords');
    }

    addMeta(name: string, content: string) {
        const meta = document.createElement('meta');
        meta.name = name;
        meta.content = content;
        document.getElementsByTagName('head')[0].appendChild(meta);
    }

    getMeta(name: string): string {
        const metas = document.getElementsByTagName('meta');
        for (let i = 0; i < metas.length; i++) {
            if (metas[i].getAttribute('name') === name) {
                return metas[i].getAttribute('content') ?? '';
            }
        }
        return '';
    }
}