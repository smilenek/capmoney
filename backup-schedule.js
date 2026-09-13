(function(root){
 'use strict';
 const hours=[1,2,3,4,6,8,12,24];
 function valid(p){return p&&hours.includes(p.hours)&&/^([01]\d|2[0-3]):[0-5]\d$/.test(p.start)&&[3,5,10].includes(p.keep)&&Number.isFinite(p.since);}
 function slots(now,p){
  const [h,m]=p.start.split(':').map(Number),dates=[];
  for(let day=-1;day<=1;day++)for(let offset=0;offset<24;offset+=p.hours){
   const date=new Date(now);date.setDate(date.getDate()+day);date.setHours(h+offset,m,0,0);dates.push(date.getTime());
  }
  return [...new Set(dates)].sort((a,b)=>a-b);
 }
 function latest(now,p){return slots(now,p).filter(t=>t<=now).at(-1);}
 function next(now,p){return slots(now,p).find(t=>t>now);}
 function due(now,p){if(!p.enabled||!valid(p))return null;const time=latest(now,p);return time>=p.since?time:null;}
 const api={valid,latest,next,due};
 if(typeof module!=='undefined')module.exports=api;else root.BackupSchedule=api;
})(globalThis);
