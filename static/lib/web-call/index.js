const sdkScript = document.createElement('script');
sdkScript.src = `https://${location.host}/proxy.shenyin.eu/proxy/sdk/latest/embedded-call-widget.iife.js`;
document.head.appendChild(sdkScript);

const callButton = document.createElement('div');
callButton.id = 'call-button';
callButton.style.position = 'fixed';
callButton.style.top = '140px';
callButton.style.right = '9px';
document.body.appendChild(callButton);

window.onload = () => {
  setTimeout(() => {
    window.EmbeddedCallWidget.createCallButton({
      mount: '#call-button',
      apiBaseUrl: `https://${location.host}/proxy.shenyin.eu/proxy/`,
      siteKey: 'friendly-site-demo',
      text: '值班员',
    });
  }, 3000);
}