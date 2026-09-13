'use strict';
// Offer updates without interrupting an unsaved form or an active sync.
if('serviceWorker' in navigator){
 navigator.serviceWorker.ready.then(registration=>{
  if(!registration)return;
  function offer(){
   if(!registration.waiting||document.getElementById('pwa-update'))return;
   const box=document.createElement('div');box.id='pwa-update';box.className='update-notice';
   box.innerHTML='<span>Có bản CapMoney mới</span><button type="button">Cập nhật</button>';
   box.querySelector('button').onclick=()=>{
    if(document.querySelector('#dialog').open||ScheduledBackup.isBusy()){toast('Chờ sao lưu hoàn tất và lưu/đóng biểu mẫu trước khi cập nhật.');return;}
    box.querySelector('button').disabled=true;
    navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload(),{once:true});
    registration.waiting?.postMessage({type:'ACTIVATE_UPDATE'});
   };
   document.querySelector('header').after(box);
  }
  offer();
  registration.addEventListener('updatefound',()=>registration.installing?.addEventListener('statechange',offer));
 }).catch(()=>{});
}
