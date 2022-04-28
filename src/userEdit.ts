import mdui from 'mdui';
import API from './API';
import Login from './login';
import NyaDom from './nyalib/nyadom';
import { NyaTemplateElement } from './nyalib/nyatemplate';

export default class UserEdit {
    templateElement: NyaTemplateElement | null = null;
    api: API = new API();
    confirmDeleteObj: any = null;
    confirmQRCodeGObj: any = null;

    constructor() {
        console.log('UserEdit');
        const infoStr: string | null = sessionStorage.getItem('info');
        let info: any = {};
        if (infoStr == '' || infoStr == null || infoStr == 'undefined') {
            window.history.back();
            return;
        } else {
            info = JSON.parse(infoStr);
        }
        let userShow: string = info['nickname'] == '' ? info['username'] : info['nickname'] + '(' + info['username'] + ')';
        window.g_Title.innerHTML = '修改用户信息/' + userShow;
        this.api.getTempHTML(this.templateElement, 'userEdit.template', (templateElement) => {
            this.templateElement = templateElement;
            const token = sessionStorage.getItem('Token');
            if (token == '' || token == null || token == 'undefined') {
                const login = new Login();
            } else {
                // this.getUserList(token);
                let ueTable = NyaDom.byId('userEditFrom');
                let selects: HTMLSelectElement[] = NyaDom.dom('select', ueTable) as HTMLSelectElement[];
                console.log(selects);
                selects.forEach((select) => {
                    switch (select.id) {
                        case 'groud':
                            select.innerHTML = '';
                            for (const key in window.g_GroupList) {
                                if (Object.prototype.hasOwnProperty.call(window.g_GroupList, key)) {
                                    const element = window.g_GroupList[key];

                                    select.innerHTML += '<option value="' + key + '"' + (info['group_code'] == key ? ' selected' : '') + '>' + element[this.api.str.name] + '</option>';
                                }
                            }
                            break;
                        case 'permissions':
                            select.innerHTML = '';
                            for (const key in window.g_PermissionsList) {
                                if (Object.prototype.hasOwnProperty.call(window.g_PermissionsList, key)) {
                                    const element = window.g_PermissionsList[key];

                                    select.innerHTML += '<option value="' + key + '"' + (info['permissions_id'] == key ? ' selected' : '') + '>' + element[this.api.str.describe] + '</option>';
                                }
                            }
                            break;

                        default:
                            break;
                    }
                });
                const enableStr: HTMLDivElement = NyaDom.byId('enableStr') as HTMLDivElement;
                enableStr.onclick = function () {
                    console.log('onclick');
                };
                const editDialog: HTMLButtonElement = NyaDom.byId('Dialog') as HTMLButtonElement;
                editDialog.addEventListener('confirm', () => {
                    //TODO:连接修改端口
                    console.log('确认修改！！！');
                });

                mdui.mutation();
            }
            return true;
        });
    }
}
