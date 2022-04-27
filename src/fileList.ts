import mdui from 'mdui';
import API from './API';
import Login from './login';
import NyaDom from './nyalib/nyadom';
import NyaNetwork from './nyalib/nyanetwork';
import NyaStrings from './nyalib/nyastrings';
import { NyaTemplateElement } from './nyalib/nyatemplate';
import NyaTime from './nyalib/nyatime';

export default class UserFileList {
    templateElement: NyaTemplateElement | null = null;
    api: API = new API();
    userInfo: any = {};

    constructor() {
        const infoStr: string | null = sessionStorage.getItem('info');
        let info: any = {};
        if (infoStr == '' || infoStr == null || infoStr == 'undefined') {
            window.history.back();
            return;
        } else {
            info = JSON.parse(infoStr);
        }
        let userShow: string = info['nickname'] == '' ? info['username'] : info['nickname'] + '(' + info['username'] + ')';
        window.g_Title.innerHTML = '管理文件/' + userShow;
        this.userInfo = info;
        this.api.getTempHTML(this.templateElement, 'FileList.template', (reTemp) => {
            this.templateElement = reTemp;
            const token = sessionStorage.getItem('Token');
            if (token == '' || token == null || token == 'undefined') {
                let login = new Login();
            } else {
                NyaDom.byId('nick').innerText = this.userInfo['nickname'];
                NyaDom.byId('group').innerText = window.g_GroupList[this.userInfo['group_code']]['name'];
                NyaDom.byId('permissions').innerText = window.g_PermissionsList[this.userInfo['permissions_id']]['describe'];
                let ctime: string = this.userInfo['creation_date'] > 0 ? this.api.formatTimeStamp(this.userInfo['creation_date'] * 1000, 'YYYY-MM-dd HH:mm:ss') : '';
                NyaDom.byId('ctime').innerText = ctime;
                ctime = this.userInfo['modification_date'] > 0 ? this.api.formatTimeStamp(this.userInfo['modification_date'] * 1000, 'YYYY-MM-dd HH:mm:ss') : '';
                NyaDom.byId('mtime').innerText = ctime;
                // NyaDom.byId('locale').innerText = this.userInfo['locale_code'];
                NyaDom.byId('enable').innerText = NyaStrings.booleanToString(this.userInfo['enable'], '是', '否');
                ctime = this.userInfo['disable_startdate'] > 0 ? NyaTime.timeStamp2timeString(this.userInfo['disable_startdate']) : '账户正常使用';
                NyaDom.byId('disStrTime').innerText = ctime;
                ctime = this.userInfo['disable_enddate'] > 0 ? NyaTime.timeStamp2timeString(this.userInfo['disable_enddate']) : '-';
                NyaDom.byId('disEndTime').innerText = ctime;
                this.getFileList(token);
            }
            return true;
        });
        mdui.mutation();
    }

    getFileList(t: string) {
        const url: string = window.g_url + 'fileList/';
        const arg = {
            t: t,
            uhash: this.userInfo['hash'],
        };
        NyaNetwork.post(
            url,
            arg,
            (data: XMLHttpRequest | null, status: number) => {
                if (data != null) {
                    let redata: any = JSON.parse(data.response);
                    if (data.status == 200) {
                        this.genFileList(redata.data);
                    } else {
                        this.api.errHandle(redata['code']);
                    }
                } else {
                    console.error(status, url, arg, data);
                }
            },
            false
        );
    }

    genFileList(data: any[]) {
        let html: string = '';
        for (const item of data) {
            const namestyle = 'style="color: ' + (item.exist == 1 ? 'black' : 'gray; text-decoration:line-through') + ';"';
            html += this.templateElement?.codeByID('row', [
                ['namestyle', namestyle],
                ['name', item.name],
                ['describe', item.describe.length ? item.describe : '无'],
                ['creation_date', NyaTime.timeStamp2timeString(item.creation_date, 5)],
                ['modification_date', NyaTime.timeStamp2timeString(item.modification_date, 5)],
            ]);
        }
        NyaDom.byId('fileListBody').innerHTML = html.length > 0 ? html : '<p>没有文件</p>';
    }
}
