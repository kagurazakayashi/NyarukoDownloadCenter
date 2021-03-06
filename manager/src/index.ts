import InitUI from './initui';

window.addEventListener('load', () => {
    window.g_url = 'http://127.0.0.1:20520/';
    window.g_QRurl = 'http://127.0.0.1/download/';
    if (!!window.ActiveXObject || 'ActiveXObject' in window) {
        document.body.innerText = '不能在 IE 或旧版本浏览器下工作，请更换/更新浏览器。';
    }
    const initUI = new InitUI();
    window.addEventListener('resize', () => {
        initUI.windowResize();
    });
});
