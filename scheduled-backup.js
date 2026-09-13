'use strict';
const ScheduledBackup=(()=>{
 const KEY='capmoney-backup-schedule-v1',DB='capmoney-scheduled-backups';
 let busy=false,panelOpen=false,timer,status='',retryAfter=0;
 const defaults=()=>({enabled:false,hours:6,start:'06:00',keep:5,since:Date.now()});
 function preferences(){try{const p=JSON.parse(localStorage.getItem(KEY));return BackupSchedule.valid(p)?p:defaults();}catch{return defaults();}}
 let prefs=preferences();
 function openDB(){return new Promise((resolve,reject)=>{
  const request=indexedDB.open(DB,1);
  request.onupgradeneeded=()=>{request.result.createObjectStore('files',{keyPath:'id'});request.result.createObjectStore('schedule');};
  request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
 });}
 async function entries(){const db=await openDB();return new Promise((resolve,reject)=>{
  const tx=db.transaction('files','readonly'),request=tx.objectStore('files').getAll();
  tx.oncomplete=()=>{db.close();resolve(request.result.sort((a,b)=>b.created-a.created));};
  tx.onerror=tx.onabort=()=>{db.close();reject(tx.error||Error('Không đọc được kho sao lưu.'));};
 });}
 async function store(record){const db=await openDB();return new Promise((resolve,reject)=>{
  const tx=db.transaction(['files','schedule'],'readwrite'),s=tx.objectStore('files'),request=s.get(record.id);
  let added=false;
  request.onsuccess=()=>{
   if(record.slot){const scheduleStore=tx.objectStore('schedule'),last=scheduleStore.get('lastSlot');last.onsuccess=()=>scheduleStore.put(Math.max(record.slot,last.result||0),'lastSlot');}
   if(request.result)return;
   s.add(record);added=true;
   const all=s.getAll();all.onsuccess=()=>all.result.sort((a,b)=>b.created-a.created).slice(prefs.keep).forEach(r=>s.delete(r.id));
  };
  tx.oncomplete=()=>{db.close();resolve(added);};
  tx.onerror=tx.onabort=()=>{db.close();reject(tx.error||Error('Không lưu được bản sao lưu.'));};
 });}
 async function lastSlot(){const db=await openDB();return new Promise((resolve,reject)=>{
  const tx=db.transaction('schedule','readonly'),r=tx.objectStore('schedule').get('lastSlot');
  tx.oncomplete=()=>{db.close();resolve(r.result||0);};tx.onerror=tx.onabort=()=>{db.close();reject(tx.error||Error('Không đọc được lịch sao lưu.'));};
 });}
 const display=time=>new Date(time).toLocaleString('vi-VN');
 function update(){document.querySelectorAll('[data-backup-status]').forEach(el=>el.textContent=status);const next=$('#backup-next');if(next)next.textContent=prefs.enabled?'Lần tiếp theo: '+display(BackupSchedule.next(Date.now(),prefs)):'Lịch đang tắt';}
 function schedule(){clearTimeout(timer);if(prefs.enabled&&!document.hidden)timer=setTimeout(check,Math.min(30000,Math.max(1000,BackupSchedule.next(Date.now(),prefs)-Date.now())));}
 async function create(id,slot){
  if(busy)return;
  busy=true;status='Đang tạo bản sao lưu…';update();
  try{
   if(locked)throw Error('Sổ đang được bảo vệ; hãy khôi phục dữ liệu trước khi sao lưu.');
   const bundle=await createBackupBundle(),created=Date.now();
   const blob=new Blob([JSON.stringify(bundle)],{type:'application/json'});
   const added=await store({id,slot,created,blob,name:'CapMoney-backup-'+iso(new Date(created))+'-'+String(created)+'.json'});
   status=added?'Đã tạo bản sao lưu lúc '+display(created):'Bản sao lưu cho mốc này đã có';
   retryAfter=0;
  }catch(e){status='Chưa sao lưu được: '+(e.name==='QuotaExceededError'?'Bộ nhớ đầy. Tải bản sao lưu ra ngoài và giải phóng dung lượng.':e.message);retryAfter=Date.now()+60000;}
  finally{busy=false;update();schedule();if(panelOpen&&$('#dialog').open)await showList();}
 }
 async function check(){
  prefs=preferences();
  if(!prefs.enabled||document.hidden||busy||Date.now()<retryAfter){schedule();return;}
  const slot=BackupSchedule.due(Date.now(),prefs);
  try{
   if(slot!==null&&(await lastSlot())<slot)await create('slot-'+slot,slot);
  }catch(e){status='Không đọc được kho sao lưu: '+e.message;retryAfter=Date.now()+60000;update();}
  schedule();
 }
 async function showList(){
  const box=$('#backup-files');if(!box)return;
  try{
   const files=await entries();if(!box.isConnected)return;
   box.innerHTML=files.length?files.map(r=>'<button type="button" class="menu" data-backup-id="'+esc(r.id)+'"><span>'+esc(display(r.created))+'<small class="block">'+Math.ceil(r.blob.size/1024)+' KB · '+(r.slot?'Theo lịch':'Tạo thủ công')+'</small></span><span>Tải JSON</span></button>').join(''):'<p class="muted">Chưa có bản sao lưu tự động.</p>';
   box.querySelectorAll('[data-backup-id]').forEach(b=>b.onclick=e=>{e.stopPropagation();const r=files.find(x=>x.id===b.dataset.backupId);download(r.name,r.blob,'application/json');});
  }catch(e){box.textContent='Không đọc được bản sao lưu: '+e.message;}
 }
 function panel(){
  panelOpen=true;prefs=preferences();
  manage('Sao lưu và lịch tự động','<p class="backup-status" data-backup-status role="status">'+esc(status)+'</p>'+
   '<label><input id="backup-enabled" type="checkbox" '+(prefs.enabled?'checked':'')+'> Bật sao lưu theo lịch</label>'+
   select('Chu kỳ','backup-hours',[[1,'Mỗi 1 tiếng'],[2,'Mỗi 2 tiếng'],[3,'Mỗi 3 tiếng'],[4,'Mỗi 4 tiếng'],[6,'Mỗi 6 tiếng'],[8,'Mỗi 8 tiếng'],[12,'Mỗi 12 tiếng'],[24,'Mỗi ngày']],prefs.hours)+
   field('Giờ bắt đầu (giờ trên thiết bị)','backup-start',prefs.start,'time','required')+
   select('Giữ số bản gần nhất','backup-keep',[[3,'3 bản'],[5,'5 bản'],[10,'10 bản']],prefs.keep)+
   '<p id="backup-next" class="muted">'+(prefs.enabled?'Lần tiếp theo: '+display(BackupSchedule.next(Date.now(),prefs)):'Lịch đang tắt')+'</p>'+
   btn('Lưu lịch sao lưu','save-backup-schedule','primary full')+
   '<p class="muted">Ví dụ: mỗi 6 tiếng từ 06:00 → 06:00, 12:00, 18:00, 00:00. Mỗi 12 tiếng từ 06:00 → 06:00, 18:00.</p>'+
   '<p class="muted">Khi đóng PWA, lịch không thể chạy nền. Khi mở lại, ứng dụng tạo một bản bù từ dữ liệu hiện tại nếu đã quá hạn. Bản tự động nằm trên thiết bị, gồm cả ảnh/video; nhấn Tải JSON để lưu ra Files hoặc nơi khác. Xóa dữ liệu trình duyệt sẽ mất các bản chưa tải ra ngoài. Khi tạo bản mới, bản cũ vượt số lượng giữ sẽ được xóa.</p>'+
   '<div class="backup-actions">'+btn('Tạo bản ngay','backup-create-now','secondary')+btn('Tải sao lưu ngay','backup-full','secondary')+'</div><h3 class="section">Bản sao lưu đã tạo</h3><div id="backup-files"></div>');
  bind('[data-action=save-backup-schedule]',()=>{
   const candidate={enabled:$('#backup-enabled').checked,hours:Number($('[name=backup-hours]').value),start:$('[name=backup-start]').value,keep:Number($('[name=backup-keep]').value),since:Date.now()};
   if(!BackupSchedule.valid(candidate))throw Error('Hãy chọn giờ bắt đầu hợp lệ.');
   if(candidate.enabled&&prefs.enabled&&candidate.hours===prefs.hours&&candidate.start===prefs.start)candidate.since=prefs.since;
   localStorage.setItem(KEY,JSON.stringify(candidate));prefs=candidate;schedule();
   $('#backup-next').textContent=prefs.enabled?'Lần tiếp theo: '+display(BackupSchedule.next(Date.now(),prefs)):'Lịch đang tắt';
   toast('Đã lưu lịch sao lưu');
  });
  bind('[data-action=backup-create-now]',()=>create('manual-'+uid(),null));
  showList();
 }
 $('#dialog').addEventListener('close',()=>{panelOpen=false;});
 const oldAction=action;
 action=function(name){if(name==='backup-schedule'){panel();return;}return oldAction(name);};
 const oldProfile=renderProfile;
 renderProfile=function(){oldProfile();$('#screen').insertAdjacentHTML('afterbegin','<div class="card">'+btn('Sao lưu và lịch tự động','backup-schedule','menu')+'<small data-backup-status>'+esc(status)+'</small></div>');};
 const oldReports=reports;reports=function(){oldReports();$('#form').insertAdjacentHTML('afterbegin',btn('Lịch sao lưu tự động','backup-schedule','secondary full'));};
 const oldSettings=settings;settings=function(){oldSettings();$('#form').insertAdjacentHTML('afterbegin',btn('Lịch sao lưu tự động','backup-schedule','secondary full'));};
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTimeout(timer);else check();});
 window.addEventListener('pageshow',check);
 window.addEventListener('storage',e=>{if(e.key===KEY){prefs=preferences();schedule();}});
 setTimeout(check,1000);
 return {open:panel,check,isBusy:()=>busy};
})();
