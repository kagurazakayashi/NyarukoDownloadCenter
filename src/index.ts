import InitUI from './initui';

window.addEventListener('load', () => {
    window.g_url = 'http://127.0.0.1:20520/';
    window.g_QRurl = 'file:///D:/object/html5/fileDownload/scan.html';
    // window.g_url = 'https://tool.tongdy.com/file/';
    // window.g_QRurl = 'https://tool.tongdy.com/fileapi/';
    if (!!window.ActiveXObject || 'ActiveXObject' in window) {
        document.body.innerText = '不能在 IE 或旧版本浏览器下工作，请更换/更新浏览器。';
    }
    const initUI = new InitUI();
    window.addEventListener('resize', () => {
        initUI.windowResize();
    });
});
