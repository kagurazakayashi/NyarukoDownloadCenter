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
                // console.log(selects);
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
                        case 'locale':
                            select.innerHTML = '';
                            for (const key in window.g_LocaleList) {
                                if (Object.prototype.hasOwnProperty.call(window.g_LocaleList, key)) {
                                    const element = window.g_LocaleList[key];

                                    select.innerHTML += '<option value="' + key + '"' + (info['locale_code'] == key ? ' selected' : '') + '>' + element[1] + '</option>';
                                }
                            }
                            break;

                        default:
                            break;
                    }
                });
                // const enableStr: HTMLDivElement = NyaDom.byId('enableStr') as HTMLDivElement;
                // enableStr.onclick = function () {
                //     console.log('onclick');
                // };
                const btnEdit: HTMLDivElement = NyaDom.byId('btnEdit') as HTMLDivElement;
                let formData = {};
                btnEdit.onclick = () => {
                    formData = {};
                    formData = this.verifyFrom();
                };
                const editDialog: HTMLButtonElement = NyaDom.byId('Dialog') as HTMLButtonElement;
                editDialog.addEventListener('confirm', () => {
                    //TODO:连接修改端口
                    // console.log('确认修改！！！');
                    this.api.netWork(window.g_url + 'userEdit/', formData, true, (data) => {
                        if (data != null) {
                            const inst = new mdui.Dialog('#errDialog');
                            inst.open();
                            const msgDialog = NyaDom.byId('errDialog');
                            // msgDialog.style.height = '300px';
                            const mDtitle: HTMLDivElement[] = NyaDom.dom('.mdui-dialog-title', msgDialog) as HTMLDivElement[];
                            const redata = JSON.parse(data.response);
                            if (data.status == 200) {
                                // console.log(data.response);
                                mDtitle.forEach((e) => {
                                    e.innerText = redata.msg;
                                });
                            } else {
                                mDtitle.forEach((e) => {
                                    e.innerText = '修改失败！';
                                });
                                const mDcontent: HTMLDivElement[] = NyaDom.dom('.mdui-dialog-content', msgDialog) as HTMLDivElement[];
                                mDcontent.forEach((e) => {
                                    if (redata.err) {
                                        e.innerText = redata.err;
                                    } else {
                                        e.innerText = redata.msg;
                                    }
                                });
                                msgDialog.addEventListener('confirm', () => {
                                    this.api.errHandle(redata['code']);
                                });
                            }
                        }
                    });
                });

                mdui.mutation();
            }
            return true;
        });
    }

    verifyFrom(): any {
        let ueTable: HTMLFormElement = NyaDom.byId('userEditFrom') as HTMLFormElement;
        ueTable.valid;
        const doms: HTMLSelectElement[] | HTMLInputElement[] | null = NyaDom.dom('.item', ueTable) as HTMLSelectElement[] | HTMLInputElement[] | null;
        let formData: any = {};
        let isShowDialog = true;
        if (doms != null) {
            doms.forEach((element) => {
                // console.log(element.name, element.value);
                switch (element.name) {
                    case 'nick':
                        if (element.value != null && element.value != '') {
                            formData.nickname = element.value;
                        }
                        break;
                    case 'groud':
                        if (element.value != null && element.value != '') {
                            formData.groupCode = element.value;
                        }
                        break;
                    case 'permissions':
                        if (element.value != null && element.value != '') {
                            formData.permissionsId = element.value;
                        }
                        break;
                    case 'locale':
                        if (element.value != null && element.value != '') {
                            formData.localeCode = element.value;
                        }
                        break;
                    case 'enabled':
                        if (element.value != null && element.value != '') {
                            formData.enabled = element.value;
                        }
                        break;
                    case 'enableStart':
                        if (element.value != null && element.value != '') {
                            this.api.formatToTimeStamp('2022-05-09 12:00:00');
                            formData.enabled = element.value;
                        }
                        break;
                    case 'enableEnd':
                        break;
                    case 'password':
                        if (element.value != null && element.value.length > 3) {
                            formData.password = element.value;
                            isShowDialog = true;
                        } else {
                            const pw: HTMLDivElement = NyaDom.byId('pw') as HTMLDivElement;
                            pw.innerText = '密码至少 3 位';
                            isShowDialog = false;
                        }
                        break;
                    case 'newpassword':
                        if (element.value != null && element.value != '') {
                            const npw: HTMLDivElement = NyaDom.byId('npw') as HTMLDivElement;
                            const vnpw: HTMLDivElement = NyaDom.byId('vnpw') as HTMLDivElement;
                            npw.innerText = '密码至少 3 位';
                            vnpw.innerText = '无效的密码';
                            formData.newpassword = element.value;
                        }
                        break;
                    case 'verifynewpassword':
                        const vnpw: HTMLDivElement = NyaDom.byId('vnpw') as HTMLDivElement;
                        // console.log(vnpw);
                        if (formData.newpassword != null && formData.newpassword != element.value) {
                            // console.log(' 111 ');
                            delete formData.newpassword;
                            vnpw.innerText = '无效的密码';
                            isShowDialog = false;
                        } else if (formData.newpassword != null && formData.newpassword == element.value) {
                            // console.log(' 222 ');
                            vnpw.innerText = '';
                        }
                        mdui.updateTextFields('#vnpw');
                        // console.log(' === ', vnpw, ' === ');
                        break;

                    default:
                        break;
                }
            });
        }
        if (isShowDialog) {
            const inst = new mdui.Dialog('#Dialog');
            inst.open();
        }
        return formData;
    }
}
