'use strict';
const $ = selector => document.querySelector(selector);
const KEY = 'capmoney-local-v2';
const iso = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const today = iso();
const fresh = () => ({version:2,user:'Nos',accounts:[{id:'wallet',name:'Wallet',kind:'Tiền mặt',opening:0},{id:'bank',name:'Bank',kind:'Ngân hàng',opening:0}],transactions:[],budgets:[],loans:[],investments:[],categories:['Ăn uống','Di chuyển','Mua sắm','Nhà ở','Sức khỏe','Giải trí','Học tập','Lương','Khác']});
let state = fresh(), locked = false;
try { const raw=localStorage.getItem(KEY); if(raw){state=JSON.parse(raw);validate(state);} } catch {locked=true;state=fresh();$('#notice').hidden=false;$('#notice').textContent='Không đọc được dữ liệu đã lưu. Dữ liệu cũ được giữ nguyên; hãy khôi phục từ bản sao lưu trong Hồ sơ.';}
let page='home',month=today.slice(0,7),selected=today,view='month',account='all',sub='accounts',statsMode='month',hidden=false,query='';
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => hidden?'••••':new Intl.NumberFormat('vi-VN').format(n)+'đ';
const sum = (items,type) => items.filter(t=>t.type===type).reduce((n,t)=>n+t.amount,0);
const balance = id => state.transactions.reduce((n,t)=>n+(t.account===id?(t.type==='income'?t.amount:-t.amount):0)+(t.type==='transfer'&&t.to===id?t.amount:0),state.accounts.find(a=>a.id===id)?.opening||0);
const accountName = id => state.accounts.find(a=>a.id===id)?.name||'—';
const uid = () => crypto.randomUUID();
const icons={
 home:'M3 10.5 12 3l9 7.5M5 9v11h5v-6h4v6h5V9',
 stats:'M4 20h16M7 16v-5m5 5V4m5 12V8',accounts:'M4 6h15a2 2 0 0 1 2 2v11H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12v2M21 11h-6v4h6',
 budget:'M4 5h16v15H4zM4 10h16M8 15h3',profile:'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M5 21v-2a7 7 0 0 1 14 0v2',
 empty:'M5 4h14v17H5zM9 9h6m-6 4h6m-6 4h3',plus:'M12 5v14M5 12h14',close:'m6 6 12 12M18 6 6 18',
 prev:'m14 5-7 7 7 7',next:'m10 5 7 7-7 7',expense:'M6 18 18 6M7 6h11v11',income:'M18 6 6 18M6 7v11h11',transfer:'M3 8h18m-4-4 4 4-4 4M21 16H3m4-4-4 4 4 4',
 scan:'M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5M7 9h10m-10 4h10m-10 4h5',edit:'m4 16 11-11 4 4L8 20H4zm9-9 4 4',
 calendar:'M4 5h16v16H4zM8 3v4m8-4v4M4 10h16',users:'M10 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0M2 20v-3a5 5 0 0 1 10 0v3M16 4a3 3 0 0 1 0 6m0 3a5 5 0 0 1 6 5v2',
 settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2',
 export:'M12 16V3m-4 4 4-4 4 4M4 13v8h16v-8',cloud:'M7 19h11a4 4 0 0 0 1-8 7 7 0 0 0-13-2 5 5 0 0 0 1 10',
 repeat:'M3 10a9 9 0 0 1 16-5l2 3m0-5v5h-5M21 14a9 9 0 0 1-16 5l-2-3m0 5v-5h5',
 category:'M3 4h7v7H3zm11 0h7v7h-7zM3 15h7v6H3zm11 0h7v6h-7z',eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
 help:'M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 4m0 3v1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',crown:'m3 7 4 4 5-7 5 7 4-4-3 13H6z',sort:'M8 3v18m-4-4 4 4 4-4M16 21V3m-4 4 4-4 4 4'
};
Object.assign(icons,{"friend":"M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8M2 21v-2a7 7 0 0 1 11-6M18 12v8m-4-4h8","group":"M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6M16 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6M1 20v-3a7 7 0 0 1 14 0v3m2-7a5 5 0 0 1 6 5v2","split":"M12 3v7M5 21v-6l7-5 7 5v6m-17-3 3 3 3-3m8 0 3 3 3-3","saving":"M4 9 12 3l8 6H4m2 3v6m6-6v6m6-6v6M3 21h18","widget":"M3 3h18v18H3zM3 9h18M10 9v12","download":"M12 3v12m-4-4 4 4 4-4M4 17v4h16v-4","feedback":"M3 4h18v13H9l-6 4V4m4 5h10m-10 4h6","share":"M8 12 16 6M8 12l8 6M7 12a2 2 0 1 0-4 0 2 2 0 0 0 4 0M20 5a2 2 0 1 0-4 0 2 2 0 0 0 4 0M20 19a2 2 0 1 0-4 0 2 2 0 0 0 4 0","cashback":"M4 5h16v5H4zM4 10v9h8m3-5 3-3 3 3m-3-3v8m-4-2a4 4 0 0 0 7 3","shared":"M5 3h10l4 4v8M5 3v18h6M15 3v5h4M14 16h8m-3-3 3 3-3 3M8 8h3m-3 4h4","locate":"M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10M12 2v3m0 14v3M2 12h3m14 0h3","accountAdd":"M3 5h13v15H3zM3 10h13m2 3h5m-2.5-2.5v5","budgetAdd":"M3 4h14v16H3zM6 8h5m-5 4h3m9 1v8m-4-4h8"});
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${icons[name]||icons.budget}"/></svg>`;
const actionIcon={transaction:'plus',transfer:'transfer',account:'accountAdd',budget:'budgetAdd',name:'edit',scan:'scan',cloud:'cloud',friends:'friend',groups:'group',split:'split',recurring:'repeat',savings:'saving',settings:'settings',categories:'category',reports:'export',widget:'widget',install:'download',feedback:'feedback','share-app':'share','shared-records':'shared',locate:'locate','pro-status':'crown','sort-accounts':'sort',cashback:'cashback',today:'calendar',hide:'eye',prev:'prev',next:'next','previous-day':'prev','following-day':'next',close:'close'};
const avatarMarkup=()=>state.avatar?`<img src="${esc(state.avatar)}" alt="Ảnh đại diện">`:esc(state.user[0]||'N');

const empty = (title,description='') => `<div class="empty">${icon('empty')}<strong>${title}</strong><p>${description}</p></div>`;
const btn=(label,action,cls='')=>{const name=actionIcon[action]||(label.startsWith('+')?'plus':null);const text=label.replace(/^(?:[+⚡⇄]|↑↓)\s*/, '');return `<button type="button" class="${cls}" data-action="${action}" ${['prev','next','previous-day','following-day'].includes(action)?`aria-label="${action==='previous-day'?'Ngày trước':action==='following-day'?'Ngày sau':action==='prev'?'Kỳ trước':'Kỳ sau'}"`:''}>${name?icon(name):''}${['prev','next','previous-day','following-day'].includes(action)?'':`<span>${text}</span>`}</button>`;};
function validate(s){
 if(!s||s.version!==2||typeof s.user!=='string'||!Array.isArray(s.categories)||!s.categories.every(c=>typeof c==='string')||!['accounts','transactions','budgets','loans','investments'].every(k=>Array.isArray(s[k])))throw Error('Bản sao lưu không đúng định dạng CapMoney.');
 if(s.avatar!=null&&(typeof s.avatar!=='string'||s.avatar.length>300000||!/^data:image\/(jpeg|png|webp);base64,/.test(s.avatar)))throw Error('Ảnh đại diện không hợp lệ.');
 const ids=new Set(); for(const a of s.accounts){if(typeof a.id!=='string'||ids.has(a.id)||typeof a.name!=='string'||!Number.isSafeInteger(a.opening))throw Error('Tài khoản không hợp lệ.');ids.add(a.id);}if(!ids.size)throw Error('Cần ít nhất một tài khoản.');
 const tids=new Set();for(const t of s.transactions){if(typeof t.id!=='string'||tids.has(t.id)||!['income','expense','transfer'].includes(t.type)||!Number.isSafeInteger(t.amount)||t.amount<=0||!ids.has(t.account)||!validDate(t.date)||typeof t.category!=='string'||typeof t.note!=='string'||(t.type==='transfer'&&(!ids.has(t.to)||t.to===t.account))||(t.image&&!/^data:image\/(png|jpeg|webp);base64,/.test(t.image)))throw Error('Giao dịch không hợp lệ.');tids.add(t.id);}
 for(const b of s.budgets)if(typeof b.id!=='string'||typeof b.name!=='string'||typeof b.category!=='string'||!/^\d{4}-\d{2}$/.test(b.month)||!Number.isSafeInteger(b.amount)||b.amount<=0)throw Error('Ngân sách không hợp lệ.');
 for(const k of ['loans','investments'])for(const r of s[k])if(typeof r.id!=='string'||typeof r.name!=='string'||!Number.isSafeInteger(r.amount)||r.amount<=0||!Number.isSafeInteger(r.current)||r.current<0||!validDate(r.date))throw Error('Khoản theo dõi không hợp lệ.');
}
function validDate(s){if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T12:00:00');return !isNaN(d)&&iso(d)===s;}
function commit(next){if(locked)throw Error('Dữ liệu cũ đang được bảo vệ. Hãy khôi phục bản sao lưu trước.');validate(next);try{localStorage.setItem(KEY,JSON.stringify(next));}catch{throw Error('Không lưu được. Bộ nhớ có thể đã đầy; hãy giảm ảnh đính kèm hoặc xuất bản sao lưu.');}state=next;}
function toast(msg){$('#toast').textContent=msg;$('#toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('show'),3000);}
function filtered(){return state.transactions.filter(t=>(account==='all'||t.account===account||t.to===account)&&t.date.startsWith(month));}
function period(){return `<div class="period">${btn('‹','prev')}<span>${new Intl.DateTimeFormat('vi-VN',{month:'long',year:'numeric'}).format(new Date(month+'-15T12:00:00'))}</span>${btn('›','next')}</div>`;}
function chips(){return `<div class="chips"><button data-account="all" class="${account==='all'?'active':''}">${icon('accounts')} Tất cả</button>${state.accounts.map(a=>`<button data-account="${esc(a.id)}" class="${account===a.id?'active':''}">${esc(a.name)}</button>`).join('')}</div>`;}
function summary(items){return `<div class="grid"><div class="card"><small class="metric-label">${icon('expense')} Chi tiêu</small><strong class="amount expense">${money(sum(items,'expense'))}</strong></div><div class="card"><small class="metric-label">${icon('income')} Thu nhập</small><strong class="amount income">${money(sum(items,'income'))}</strong></div></div>`;}
function txList(items){return items.length?`<div class="card">${[...items].sort((a,b)=>b.date.localeCompare(a.date)).map(t=>`<button class="transaction" data-tx="${esc(t.id)}"><span class="badge">${icon(t.type)}</span><span class="details"><strong>${esc(t.note||t.category)}</strong><small>${esc(accountName(t.account))}${t.type==='transfer'?' → '+esc(accountName(t.to)):''} · ${esc(t.date.split('-').reverse().join('/'))}</small></span><span class="txamount ${t.type==='income'?'income':t.type==='expense'?'expense':'blue'}">${t.type==='income'?'+':t.type==='expense'?'−':''}${money(t.amount)}</span></button>`).join('')}</div>`:empty('Chưa có giao dịch','Nhấn + để ghi lại khoản thu hoặc chi đầu tiên.');}
function render(){
 $('.avatar').innerHTML=avatarMarkup();$('#add').innerHTML=icon('plus');$('#username').textContent=state.user;$('#greeting').textContent=new Date().getHours()<12?'Chào buổi sáng ☀':new Date().getHours()<18?'Chào buổi chiều ☀':'Chào buổi tối ☾';
 $('#nav').innerHTML=[['home','Trang chủ'],['stats','Thống kê'],['accounts','Tài khoản'],['budget','Ngân sách'],['profile','Hồ sơ']].map(([p,label])=>`<button data-page="${p}" class="${page===p?'active':''}" ${page===p?'aria-current="page"':''}>${icon(p)}<span>${label}</span></button>`).join('');
 $('#add').hidden=page!=='home';
 ({home:renderHome,stats:renderStats,accounts:renderAccounts,budget:renderBudget,profile:renderProfile}[page])();
}
function renderHome(){
 const items=filtered(),daily=state.transactions.filter(t=>t.date===today&&t.type==='expense');
 let cal='';const first=new Date(month+'-01T12:00:00'),offset=(first.getDay()+6)%7,days=new Date(first.getFullYear(),first.getMonth()+1,0).getDate();
 for(let i=0;i<offset;i++)cal+='<span></span>';
 for(let d=1;d<=days;d++){const date=month+'-'+String(d).padStart(2,'0');cal+=`<button class="day ${date===selected?'selected':''} ${date===today?'today':''}" data-date="${date}" aria-label="Ngày ${d}" aria-pressed="${date===selected}">${d}${items.some(t=>t.date===date)?'<i class="dot"></i>':''}</button>`;}
 const list=items.filter(t=>t.date===selected&&(!query||(t.note+' '+t.category+' '+t.amount).toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi'))));
 $('#screen').innerHTML=`<div class="row home-status"><span class="status pill">${daily.length?'Hôm nay đã chi '+money(sum(daily,'expense')):'Hôm nay chưa chi tiêu'}</span>${btn(hidden?'Hiện tiền':'Ẩn tiền','hide','link')}</div><div class="segments"><button data-view="day" class="${view==='day'?'active':''}">Danh sách</button><button data-view="month" class="${view==='month'?'active':''}">Lịch tháng</button></div>${summary(view==='day'?items.filter(t=>t.date===selected):items)}${chips()}${view==='day'?`<div class="day-picker">${btn('‹','previous-day')}<label>Ngày giao dịch<span class="date-shell"><input id="dayDate" type="date" value="${selected}" aria-label="Ngày giao dịch"></span></label>${btn('›','following-day')}</div>`:period()}${view==='month'?`<div class="calendar">${['T2','T3','T4','T5','T6','T7','CN'].map(d=>`<div class="weekday">${d}</div>`).join('')}${cal}</div>`:''}<div class="row section day-heading"><h2>${'Ngày '+selected.split('-').reverse().join('/')}</h2>${btn('Hôm nay','today','link')}</div><input type="search" id="search" aria-label="Tìm giao dịch" placeholder="Tìm ghi chú, danh mục, số tiền…" value="${esc(query)}">${txList(list)}`;
}
function statsRange(){
 const anchor=new Date(selected+'T12:00:00');
 if(statsMode==='week'){
  anchor.setDate(anchor.getDate()-(anchor.getDay()+6)%7);
  const dates=Array.from({length:7},(_,i)=>{const d=new Date(anchor);d.setDate(d.getDate()+i);return iso(d);});
  return {start:dates[0],end:dates[6],dates};
 }
 const start=statsMode==='year'?month.slice(0,4)+'-01-01':month+'-01';
 const endDate=statsMode==='year'?new Date(Number(month.slice(0,4)),11,31,12):new Date(Number(month.slice(0,4)),Number(month.slice(5)),0,12);
 const dates=[];for(let d=new Date(start+'T12:00:00');d<=endDate;d.setDate(d.getDate()+1))dates.push(iso(d));
 return {start,end:iso(endDate),dates};
}
function statsPeriod(){
 if(statsMode==='month')return period();
 const range=statsRange(),short=d=>d.split('-').reverse().slice(0,2).join('/');
 const title=statsMode==='year'?'Năm '+month.slice(0,4):short(range.start)+' – '+short(range.end)+' / '+range.end.slice(0,4);
 return `<div class="period">${btn('‹','prev')}<span>${title}</span>${btn('›','next')}</div>`+(statsMode==='week'?`<div class="week-strip" aria-label="Các ngày trong tuần">${range.dates.map((d,i)=>`<button type="button" data-date="${d}" class="week-day ${d===today?'today':''} ${d===selected?'selected':''}" aria-pressed="${d===selected}" aria-label="Xem giao dịch ngày ${d.split('-').reverse().join('/')}"><small>${['T2','T3','T4','T5','T6','T7','CN'][i]}</small><strong>${Number(d.slice(8))}</strong><i class="week-dot ${state.transactions.some(t=>t.date===d&&(account==='all'||t.account===account||t.to===account))?'has-data':''}"></i></button>`).join('')}</div><div class="week-tools">${btn('Tuần này','today','link')}<label class="week-jump">Đến tuần<span class="date-shell"><input type="date" id="weekDate" value="${selected}" aria-label="Chọn ngày để chuyển đến tuần"></span></label></div>`:'');
}
function renderStats(){let items=state.transactions.filter(t=>(account==='all'||t.account===account||t.to===account));const range=statsRange();items=items.filter(t=>t.date>=range.start&&t.date<=range.end);
 const total=sum(items,'expense'),groups={};items.filter(t=>t.type==='expense').forEach(t=>groups[t.category]=(groups[t.category]||0)+t.amount);
 $('#screen').innerHTML=`<h2>Thống kê</h2><div class="segments">${[['week','Tuần'],['month','Tháng'],['year','Năm']].map(([k,v])=>`<button data-stats="${k}" class="${statsMode===k?'active':''}">${v}</button>`).join('')}</div>${statsPeriod()}${chips()}${summary(items)}<div class="card"><small>Chênh lệch thu − chi</small><strong class="amount income">${money(sum(items,'income')-total)}</strong></div><h2 class="section">Chi tiêu theo danh mục</h2>${total?`<div class="card">${Object.entries(groups).sort((a,b)=>b[1]-a[1]).map(([name,n])=>`<div class="chart-row"><div class="row"><span>${esc(name)}</span><strong>${money(n)}</strong></div><div class="bar"><i style="width:${n/total*100}%"></i></div><small>${Math.round(n/total*100)}% tổng chi</small></div>`).join('')}</div>`:empty('Chưa có dữ liệu','Biểu đồ sẽ xuất hiện khi có khoản chi trong kỳ.')}`;
 if(statsMode==='week')$('#screen>.grid').insertAdjacentHTML('afterend',`<section class="selected-day"><div class="row section day-heading"><h2>Giao dịch ngày ${selected.split('-').reverse().join('/')}</h2>${btn('Thêm giao dịch','transaction','secondary')}</div>${summary(items.filter(t=>t.date===selected))}${txList(items.filter(t=>t.date===selected))}</section>`);
}
function renderAccounts(){const total=state.accounts.reduce((n,a)=>n+balance(a.id),0);$('#screen').innerHTML=`<div class="segments">${[['accounts','Tài khoản'],['loans','Khoản vay'],['investments','Đầu tư']].map(([k,v])=>`<button data-sub="${k}" class="${sub===k?'active':''}">${v}</button>`).join('')}</div>`;
 if(sub!=='accounts'){const loans=sub==='loans';$('#screen').innerHTML+=`${btn('+ Thêm '+(loans?'khoản vay':'khoản đầu tư'),'record','primary full')}<p class="muted">${loans?'Theo dõi dư nợ thủ công. Khoản vay chưa tự ghi vào thu chi.':'Theo dõi giá trị do bạn nhập; chưa kết nối giá thị trường.'}</p>${state[sub].length?state[sub].map(r=>`<button class="card full" data-record="${esc(r.id)}"><div class="row"><strong>${esc(r.name)}</strong><span>›</span></div><div class="row section"><small>${loans?'Dư nợ còn lại':'Giá trị hiện tại'}</small><strong class="income">${money(r.current)}</strong></div><small>${loans?'Khoản vay ban đầu':'Vốn ban đầu'}: ${money(r.amount)} · ${esc(r.date)}</small></button>`).join(''):empty(loans?'Chưa có khoản vay':'Chưa có khoản đầu tư','Nhấn nút Thêm để bắt đầu theo dõi.')}`;return;}
 $('#screen').innerHTML+=`<div class="card hero"><small>Tổng số dư hiện tại</small><strong class="amount income">${money(total)}</strong><small>Tính từ số dư đầu kỳ và tất cả giao dịch</small></div><div class="grid">${btn('⇄ Chuyển tiền','transfer','primary')}${btn('+ Tài khoản','account','secondary')}</div><h2 class="section">Tài khoản</h2><div class="card">${state.accounts.map(a=>`<button class="transaction" data-edit-account="${esc(a.id)}"><span class="badge">${icon('budget')}</span><span class="details"><strong>${esc(a.name)}</strong><small>${esc(a.kind||'Tài khoản')}</small></span><span class="income">${money(balance(a.id))}</span></button>`).join('')}</div><h2 class="section">Lịch sử chuyển tiền</h2>${txList(state.transactions.filter(t=>t.type==='transfer'))}`;
}
function renderBudget(){const budgets=state.budgets.filter(b=>b.month===month);$('#screen').innerHTML=`<div class="row"><h2>Quản lý ngân sách</h2>${btn('+ Thêm','budget','primary')}</div>${period()}${budgets.length?budgets.map(b=>{const used=sum(state.transactions.filter(t=>t.date.startsWith(month)&&(b.category==='Tất cả'||t.category===b.category)),'expense');return `<button class="card full" data-budget="${esc(b.id)}"><div class="row"><strong>${esc(b.name)}</strong><small>${esc(b.category)}</small></div><strong class="amount ${used>b.amount?'expense':'income'}">${Math.round(used/b.amount*100)}%</strong><div class="bar"><i style="width:${Math.min(100,used/b.amount*100)}%"></i></div><div class="row"><small>Đã chi ${money(used)}</small><small>Hạn mức ${money(b.amount)}</small></div><p class="${used>b.amount?'expense':'muted'}">${used>b.amount?'Vượt ngân sách '+money(used-b.amount):'Còn lại '+money(b.amount-used)}</p></button>`;}).join(''):empty('Chưa có ngân sách','Tạo ngân sách để theo dõi chi tiêu tháng này.')}`;}
function renderProfile(){$('#screen').innerHTML=`<div class="card hero"><div class="profile-avatar">${esc(state.user[0]||'N')}</div><h2>${esc(state.user)}</h2>${btn('Chỉnh sửa tên','name','link')}</div><div class="grid"><div class="card"><small>Giao dịch</small><strong class="amount">${state.transactions.length}</strong></div><div class="card"><small>Tài khoản</small><strong class="amount">${state.accounts.length}</strong></div></div><div class="card">${[['Danh mục','categories'],['Xuất bản sao lưu JSON','export'],['Khôi phục bản sao lưu','import'],['Xuất giao dịch CSV','csv'],['Hướng dẫn cài ứng dụng','install'],['Các tính năng kết nối','roadmap']].map(([l,a])=>btn(l+' <span>›</span>',a,'menu')).join('')}</div><p class="saved-note">CapMoney PWA · Tiếng Việt · VND<br>Dữ liệu được lưu trên trình duyệt này. Hãy xuất bản sao lưu định kỳ.</p>`;}
const field=(label,name,value='',type='text',extra='')=>`<label>${label}<span class="${type==='date'||type==='month'?'date-shell':'input-shell'}"><input name="${name}" type="${type}" value="${esc(value)}" ${extra}></span></label>`;
const select=(label,name,options,value)=>`<label>${label}<select name="${name}">${options.map(o=>{const [v,l]=Array.isArray(o)?o:[o,o];return `<option value="${esc(v)}" ${v===value?'selected':''}>${esc(l)}</option>`;}).join('')}</select></label>`;
let dialogScroll=null;
function lockDialogPage(){
 if(!document.body||dialogScroll)return;
 dialogScroll={y:window.scrollY,css:document.body.style.cssText};
 Object.assign(document.body.style,{position:'fixed',top:`-${dialogScroll.y}px`,left:'0',right:'0',width:'100%'});
 $('#dialog').addEventListener('close',()=>{const saved=dialogScroll;if(!saved)return;dialogScroll=null;document.body.style.cssText=saved.css;window.scrollTo({top:saved.y,behavior:'instant'});},{once:true});
}
function modal(title,body,submit,submitLabel='Lưu'){
 const form=$('#form');lockDialogPage();form.scrollTop=0;
 $('#dialogTitle').textContent=title;
 form.innerHTML=body+'<p id="formError" class="error" role="alert" tabindex="-1"></p>'+(submit?'<div class="form-actions"><button type="button" data-action="close" class="secondary">Hủy</button><button class="'+(submitLabel==='Xóa'?'danger':'primary')+'" type="submit">'+esc(submitLabel)+'</button></div>':'');
 let saving=false;
 form.onsubmit=async e=>{
  e.preventDefault();if(!submit||saving)return;
  const button=form.querySelector('button[type=submit]'),error=$('#formError');
  saving=true;button.disabled=true;button.textContent='Đang xử lý…';error.textContent='';
  try{await submit(new FormData(form));$('#dialog').close();render();toast(submitLabel==='Xóa'?'Đã xóa':'Đã lưu');}
  catch(err){error.textContent=err.message;error.focus();}
  finally{saving=false;button.disabled=false;button.textContent=submitLabel;}
 };
 if(!$('#dialog').open)$('#dialog').showModal();
}
function amount(value,zero=false){const n=Number(value);if(!Number.isSafeInteger(n)||n<(zero?0:1)||n>1e14)throw Error('Nhập số tiền nguyên hợp lệ, tối đa 100.000 tỷ đồng.');return n;}
function transaction(id,type='expense'){const existing=state.transactions.find(t=>t.id===id),t=existing||{type,amount:'',date:selected,account:state.accounts[0].id,category:state.categories[0],note:'',to:state.accounts[1]?.id};const accts=state.accounts.map(a=>[a.id,a.name]);
 modal(existing?'Sửa giao dịch':'Thêm giao dịch',select('Loại giao dịch','type',[['expense','Chi tiêu'],['income','Thu nhập'],['transfer','Chuyển tiền']],t.type)+field('Số tiền (VND)','amount',t.amount,'number','required min="1" step="1" inputmode="numeric"')+select('Tài khoản','account',accts,t.account)+`<div id="toField">${select('Tài khoản nhận','to',accts,t.to)}</div><div id="categoryField">${select('Danh mục','category',state.categories,t.category)}</div>`+field('Ngày','date',t.date,'date','required')+field('Ghi chú','note',t.note,'text','maxlength="200"')+`<label>Ảnh hóa đơn (tối đa 1 MB)<input type="file" name="image" accept="image/png,image/jpeg,image/webp"></label>${t.image?`<img class="preview-image" src="${esc(t.image)}" alt="Ảnh hóa đơn"><label><input type="checkbox" name="removeImage"> Xóa ảnh đính kèm</label>`:''}`+(existing?btn('Xóa giao dịch','delete-tx','danger full'):''),async f=>{
 const next=structuredClone(state),r={id:t.id||uid(),type:f.get('type'),amount:amount(f.get('amount')),account:f.get('account'),to:f.get('to'),category:f.get('type')==='transfer'?'Chuyển tiền':f.get('category'),date:f.get('date'),note:f.get('note').trim(),image:f.get('removeImage')?null:t.image||null};if(!validDate(r.date))throw Error('Ngày không hợp lệ.');if(r.type==='transfer'&&r.account===r.to)throw Error('Hãy chọn hai tài khoản khác nhau.');
 const file=f.get('image');if(file.size){if(file.size>1024*1024||!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Chọn ảnh PNG, JPG hoặc WebP dưới 1 MB.');r.image=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Không đọc được ảnh.'));reader.readAsDataURL(file);});}
 const index=next.transactions.findIndex(x=>x.id===r.id);if(index<0)next.transactions.push(r);else next.transactions[index]=r;commit(next);
 });const change=()=>{$('#toField').hidden=$('#form [name=type]').value!=='transfer';$('#categoryField').hidden=!$('#toField').hidden;};$('#form [name=type]').onchange=change;change();if(existing)$('[data-action=delete-tx]').onclick=()=>removeRecord('transactions',id,'Xóa giao dịch này? Số dư sẽ được tính lại.');}
function removeRecord(key,id,title){modal(title,'<p>Thao tác này sẽ xóa mục đã chọn.</p>',()=>{const next=structuredClone(state);next[key]=next[key].filter(x=>x.id!==id);commit(next);},'Xóa');}
function editAccount(id){const a=state.accounts.find(a=>a.id===id)||{name:'',kind:'Tiền mặt',opening:0};modal(id?'Sửa tài khoản':'Thêm tài khoản',field('Tên tài khoản','name',a.name,'text','required maxlength="60"')+select('Loại tài khoản','kind',['Tiền mặt','Ngân hàng','Ví điện tử','Thẻ tín dụng','Tiết kiệm'],a.kind)+field('Số dư đầu kỳ (VND)','opening',a.opening,'number','required step="1"')+'<p class="muted">Số dư hiện tại = số dư đầu kỳ + thu − chi ± chuyển tiền.</p>',f=>{const next=structuredClone(state),opening=Number(f.get('opening')),name=f.get('name').trim();if(!name||!Number.isSafeInteger(opening)||Math.abs(opening)>1e14)throw Error('Tên hoặc số dư đầu kỳ không hợp lệ.');const r={id:id||uid(),name,kind:f.get('kind'),opening};const i=next.accounts.findIndex(x=>x.id===id);if(i<0)next.accounts.push(r);else next.accounts[i]=r;commit(next);});}
function editBudget(id){const b=state.budgets.find(b=>b.id===id)||{name:'',amount:'',category:'Tất cả',month};modal(id?'Sửa ngân sách':'Thêm ngân sách',field('Tên ngân sách','name',b.name,'text','required maxlength="80"')+field('Hạn mức (VND)','amount',b.amount,'number','required min="1" step="1"')+field('Tháng','month',b.month,'month','required')+select('Danh mục','category',['Tất cả',...state.categories],b.category)+(id?btn('Xóa ngân sách','delete-budget','danger full'):''),f=>{const next=structuredClone(state),r={id:id||uid(),name:f.get('name').trim(),amount:amount(f.get('amount')),month:f.get('month'),category:f.get('category')};if(!r.name)throw Error('Nhập tên ngân sách.');const i=next.budgets.findIndex(x=>x.id===id);if(i<0)next.budgets.push(r);else next.budgets[i]=r;commit(next);});if(id)$('[data-action=delete-budget]').onclick=()=>removeRecord('budgets',id,'Xóa ngân sách?');}
function editRecord(id){const key=sub,r=state[key].find(r=>r.id===id)||{name:'',amount:'',current:'',date:today};modal(key==='loans'?'Theo dõi khoản vay':'Theo dõi đầu tư',field('Tên khoản / người liên quan','name',r.name,'text','required maxlength="80"')+field('Số tiền ban đầu (VND)','amount',r.amount,'number','required min="1"')+field(key==='loans'?'Dư nợ còn lại (VND)':'Giá trị hiện tại (VND)','current',r.current,'number','required min="0"')+field('Ngày ghi nhận','date',r.date,'date','required')+(id?btn('Xóa mục','delete-record','danger full'):''),f=>{const next=structuredClone(state),record={id:id||uid(),name:f.get('name').trim(),amount:amount(f.get('amount')),current:amount(f.get('current'),true),date:f.get('date')};if(!record.name)throw Error('Nhập tên khoản theo dõi.');const i=next[key].findIndex(r=>r.id===id);if(i<0)next[key].push(record);else next[key][i]=record;commit(next);});if(id)$('[data-action=delete-record]').onclick=()=>removeRecord(key,id,'Xóa khoản theo dõi?');}
function download(name,content,type){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function action(name){
 if(name==='close'){$('#dialog').close();return;}
 if(name==='transaction')return transaction();if(name==='transfer')return transaction(null,'transfer');if(name==='account')return editAccount();if(name==='budget')return editBudget();if(name==='record')return editRecord();
 if(name==='previous-day'||name==='following-day'){const d=new Date(selected+'T12:00:00');d.setDate(d.getDate()+(name==='previous-day'?-1:1));selected=iso(d);month=selected.slice(0,7);}
 if(name==='hide')hidden=!hidden;
 if(name==='today'){month=today.slice(0,7);selected=today;}
 if(name==='prev'||name==='next'){
 const step=name==='prev'?-1:1;
 const d=new Date((page==='stats'&&statsMode==='week'?selected:month+'-01')+'T12:00:00');
 if(page==='stats'&&statsMode==='week')d.setDate(d.getDate()+step*7);
 else if(page==='stats'&&statsMode==='year')d.setFullYear(d.getFullYear()+step);
 else d.setMonth(d.getMonth()+step);
 selected=iso(d);month=selected.slice(0,7);
}
 if(name==='name')return editProfile();

 if(name==='categories')return modal('Danh mục',`<div class="chips wrap">${state.categories.map(c=>`<span class="pill">${esc(c)}</span>`).join('')}</div>`+field('Thêm danh mục','category','','text','required maxlength="40"'),f=>{const next=structuredClone(state),c=f.get('category').trim();if(!c||next.categories.some(x=>x.toLowerCase()===c.toLowerCase()))throw Error('Danh mục trống hoặc đã tồn tại.');next.categories.push(c);commit(next);});
 if(name==='export'){download('capmoney-'+today+'.json',JSON.stringify(state,null,2),'application/json');return;}
 if(name==='csv'){const cell=v=>'"'+String(v).replace(/^[=+@-]/,"'$&").replace(/"/g,'""')+'"';download('capmoney-giao-dich.csv','\uFEFF'+[['Ngày','Loại','Số tiền VND','Tài khoản','Tài khoản nhận','Danh mục','Ghi chú'],...state.transactions.map(t=>[t.date,t.type,t.amount,accountName(t.account),t.type==='transfer'?accountName(t.to):'',t.category,t.note])].map(row=>row.map(cell).join(',')).join('\r\n'),'text/csv;charset=utf-8');return;}
 if(name==='import')return modal('Khôi phục bản sao lưu','<p>Bản sao lưu sẽ thay thế dữ liệu hiện tại. Hãy xuất dữ liệu trước khi khôi phục.</p><label>Chọn bản sao lưu JSON<input type="file" name="backup" accept="application/json,.json" required></label><label><input name="confirm" type="checkbox" required> Tôi đồng ý thay thế dữ liệu hiện tại</label>',async f=>{const file=f.get('backup');if(file.size>10*1024*1024)throw Error('Bản sao lưu vượt quá 10 MB.');const next=JSON.parse(await file.text());validate(next);const was=locked;locked=false;try{commit(next);}catch(e){locked=was;throw e;}$('#notice').hidden=true;account='all';});
 if(name==='install')return modal('Cài CapMoney','<p>Mở ứng dụng qua địa chỉ HTTPS trên điện thoại. Trong menu trình duyệt, chọn thêm vào màn hình chính nếu có.</p><p>Hãy mở ứng dụng trực tuyến ít nhất một lần để tải các file cần dùng ngoại tuyến.</p><p class="muted">Địa chỉ 127.0.0.1 của bản chạy thử chỉ dùng trên máy tính này.</p>');
 if(name==='roadmap')return modal('Các tính năng kết nối','<p>Bản này lưu và quản lý dữ liệu trên thiết bị.</p><p>Chưa tích hợp: đồng bộ nhóm/bạn bè, đăng nhập Apple, nhận diện hóa đơn, Shortcuts, tiện ích màn hình chính, video, giá thị trường trực tuyến và xuất PDF/Excel định dạng chuẩn.</p><p>Xuất CSV và bản sao lưu JSON đã có trong Hồ sơ.</p>');
 render();
}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.closest('#form')&&b.type==='submit'&&!b.dataset.action)return;
 if(b.dataset.action){e.preventDefault();action(b.dataset.action);return;}
 if(b.dataset.page){page=b.dataset.page;query='';window.scrollTo({top:0});}
 if(b.dataset.account)account=b.dataset.account;if(b.dataset.view)view=b.dataset.view;if(b.dataset.date)selected=b.dataset.date;if(b.dataset.stats)statsMode=b.dataset.stats;if(b.dataset.sub)sub=b.dataset.sub;
 if(b.dataset.tx)return transaction(b.dataset.tx);if(b.dataset.editAccount)return editAccount(b.dataset.editAccount);if(b.dataset.budget)return editBudget(b.dataset.budget);if(b.dataset.record)return editRecord(b.dataset.record);render();
});
document.addEventListener('input',e=>{if(e.target.id==='search'){const pos=e.target.selectionStart;query=e.target.value;renderHome();$('#search').focus();$('#search').setSelectionRange(pos,pos);}});
document.addEventListener('change',e=>{if(['weekDate','dayDate'].includes(e.target.id)&&validDate(e.target.value)){selected=e.target.value;month=selected.slice(0,7);render();}});
window.addEventListener('storage',e=>{if(e.key===KEY&&e.newValue){try{const next=JSON.parse(e.newValue);validate(next);state=next;if($('#dialog').open)$('#dialog').close();render();toast('Dữ liệu đã được cập nhật từ thẻ khác.');}catch{toast('Không đọc được thay đổi từ thẻ khác.');}}});
render();
if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(()=>toast('Chưa bật được chế độ ngoại tuyến.'));
