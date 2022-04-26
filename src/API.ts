import UserFileList from './fileList';
import Login from './login';
import NyaDom from './nyalib/nyadom';
import NyaNetwork from './nyalib/nyanetwork';
import NyaTemplate, { NyaTemplateElement } from './nyalib/nyatemplate';

export default class API {
    

    getTempHTML(templateHTML: NyaTemplateElement | null, url: string, callback: (isDone: any) => {}) {
        if (!templateHTML || templateHTML.status < 1) {
            NyaTemplate.loadTemplate('dist/' + url + '.html', NyaDom.byClassFirst('container'), (templateElement: NyaTemplateElement) => {
                templateHTML = templateElement;
                if (templateElement.status < 1) {
                    return;
                }
                callback(true);
            });
        } else {
            templateHTML.loadTo(NyaDom.byClassFirst('container'));
        }
    }

    getPermissionsList() {
        NyaNetwork.post(
            window.g_url + 'permissionsList/',
            undefined,
            (data: XMLHttpRequest | null, status: number) => {
                if (data != null) {
                    const redata = JSON.parse(data.response);
                    if (data.status == 200) {
                        window.g_PermissionsList = redata['data'];
                    }
                }
            },
            false
        );
    }

    logOut() {
        var token = sessionStorage.getItem('Token');
        if (token == '' || token == null || token == 'undefined') {
            return;
        }
        NyaNetwork.post(window.g_url + 'logout/', { t: token }, (data: XMLHttpRequest | null, status: number) => {
            if (data != null) {
                sessionStorage.removeItem('Token');
                var login: Login = new Login();
            }
        });
    }

    formatTimeStamp(timeStamp: any, format: string) {
        if (!timeStamp) {
            return;
        }
        if (!format) {
            format = 'YYYY-MM-dd';
        }
        var strDate: any;
        switch (typeof timeStamp) {
            case 'string':
                strDate = new Date(timeStamp.replace(/-/g, '/'));
                break;
            case 'number':
                strDate = new Date(timeStamp);
                break;
        }
        if (strDate instanceof Date) {
            const dict: any = {
                YYYY: strDate.getFullYear(),
                M: strDate.getMonth() + 1,
                d: strDate.getDate(),
                H: strDate.getHours(),
                m: strDate.getMinutes(),
                s: strDate.getSeconds(),
                MM: ('' + (strDate.getMonth() + 101)).substring(1),
                dd: ('' + (strDate.getDate() + 100)).substring(1),
                HH: ('' + (strDate.getHours() + 100)).substring(1),
                mm: ('' + (strDate.getMinutes() + 100)).substring(1),
                ss: ('' + (strDate.getSeconds() + 100)).substring(1),
            };
            return format.replace(/(YYYY|MM?|dd?|HH?|ss?|mm?)/g, function () {
                return dict[arguments[0]];
            });
        }
    }
}
