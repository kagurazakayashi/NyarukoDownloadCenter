import UserFileList from './fileList';
import Login from './login';
import NyaDom from './nyalib/nyadom';
import NyaNetwork from './nyalib/nyanetwork';
import NyaTemplate, { NyaTemplateElement } from './nyalib/nyatemplate';
import UserEdit from './userEdit';
import UserList from './userList';

export default class API {
    str: any = {
        date: 'YYYY-MM-dd HH:mm:ss',
        hash: 'hash',
        name: 'name',
        username: 'username',
        nickname: 'nickname',
        describe: 'describe',
        locale: 'locale',
        creation_date: 'creation_date',
        modification_date: 'modification_date',
        click: 'click',
    };

    urlhref(toPage: string) {
        const nowurl: string[] = window.location.href.split('?');
        if (nowurl.length > 1) {
            window.location.href = nowurl[0] + toPage; //+ '?' + nowurl[1];
        } else {
            window.location.href = toPage;
        }
    }

    jumpPage(run?: () => {}) {
        const nowurl: string[] = window.location.href.split('?');
        if (nowurl.length > 1 && window.g_nowurl == nowurl[0]) {
            // console.log(' 111 ');
            return;
        }
        // console.log(' 222 ');
        window.g_nowurl = nowurl[0];
        let url: string[] = nowurl[0].split('/#/');
        if (url.length == 2) {
            // console.log(' 333 ');
            const token = sessionStorage.getItem('Token');
            if (token == '' || token == null || token == 'undefined') {
                let login = new Login();
                // console.log(' 444 ');
            } else {
                // console.log(' 555 ');
                this.getGroupList();
                switch (url[1]) {
                    case 'userInfo':
                        const userFileList = new UserFileList();
                        break;
                    case 'userEdit':
                        const userEdit = new UserEdit();
                        break;
                    default:
                        const userList = new UserList();
                        break;
                }
            }
        } else {
            // console.log(' 666 ');
            url = window.location.href.split('/#');
            if (url.length != 2) {
                // console.log(' 777 ');
                if (run != null) {
                    // console.log(' 888 ');
                    run();
                } else {
                    // console.log(' 999 ');
                    const userList = new UserList();
                }
            }
        }
    }

    getTempHTML(templateHTML: NyaTemplateElement | null, url: string, callback: (isDone: any) => {}) {
        if (!templateHTML || templateHTML.status < 1) {
            NyaTemplate.loadTemplate('dist/' + url + '.html', NyaDom.byClassFirst('container'), (templateElement: NyaTemplateElement) => {
                if (templateElement.status < 1) {
                    return;
                }
                callback(templateElement);
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

    getGroupList() {
        NyaNetwork.post(
            window.g_url + 'groupList/',
            { t: sessionStorage.getItem('Token') },
            (data: XMLHttpRequest | null, status: number) => {
                if (data != null) {
                    const redata = JSON.parse(data.response);
                    if (data.status == 200) {
                        window.g_GroupList = redata['data'];
                    }
                }
            },
            false
        );
    }

    getLocaleList() {
        NyaNetwork.post(
            window.g_url + 'localeList/',
            undefined,
            (data: XMLHttpRequest | null, status: number) => {
                if (data != null) {
                    const redata = JSON.parse(data.response);
                    if (data.status == 200) {
                        window.g_LocaleList = redata['data'];
                    }
                }
            },
            false
        );
    }

    errHandle(errCode: number) {
        switch (errCode) {
            case 3900:
                sessionStorage.removeItem('Token');
                let login = new Login();
                break;
            case 4004:
                this.logOut();
                break;
            default:
                break;
        }
    }

    netWork(url: string, data: any, isToken: boolean = true, callback?: (cb: XMLHttpRequest | null) => void, isblob: boolean = false, isupload: boolean = false) {
        const token = sessionStorage.getItem('Token');
        if (isToken && (token == '' || token == null || token == 'undefined')) {
            let login = new Login();
        } else {
            if (isToken) {
                data['t'] = token;
                // console.log(data);
            }
            // console.log(isblob);
            NyaNetwork.post(
                url,
                data,
                (msg: XMLHttpRequest | null, status: number) => {
                    if (callback) callback(msg);
                },
                true,
                isblob
            );
        }
    }

    logOut() {
        let token = sessionStorage.getItem('Token');
        if (token == '' || token == null || token == 'undefined') {
            return;
        }
        NyaNetwork.post(window.g_url + 'logout/', { t: token }, (data: XMLHttpRequest | null, status: number) => {
            if (data != null) {
                sessionStorage.removeItem('Token');
                let login: Login = new Login();
            }
        });
    }
    
    formatToTimeStamp(str: string): string {
        // const reg = /^(\d+)-(\d+)-(\d+) (\d+):(\d+):(\d+)/;
        // const s: RegExpMatchArray | null = str.match(reg);
        // let result;
        // if (s) {
        //     result = new Date(Number(s[1]), Number(s[2]) - 1, Number(s[3]), Number(s[4]), Number(s[5]), Number(s[6]));
        // }
        // console.log(result?.getTime().toString());
        const newstr = str.replace(/-/g, '/');
        const date = new Date(newstr);
        const time_str = date.getTime().toString();
        return time_str.substring(0, 10);
    }
    roundup(v:number):number {
        var _max = parseInt(v.toString()) + 1;
        if (_max - v < 1) {
            return _max;
        }
        return v;
    }
}
