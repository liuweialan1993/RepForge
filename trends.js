let trendWeekOffset=0,trendRange=12;
const trendNames={chest:'Chest',back:'Back',shoulders:'Shoulders',biceps:'Biceps',triceps:'Triceps',legs:'Legs'};
const trendEl=id=>document.getElementById(id);
function trendWeekStart(offset=0){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7)+offset*7);return d}
function trendWeekHistory(offset=0){const start=trendWeekStart(offset),end=new Date(start);end.setDate(end.getDate()+7);return data.history.filter(h=>{const d=new Date(h.date);return !Number.isNaN(d.getTime())&&d>=start&&d<end})}
function trendSetsIn(workout){return (workout.exercises||[]).reduce((n,e)=>n+(e.sets||[]).length,0)}
function trendSvg(content,label,height=148){return `<svg class="trend-chart" viewBox="0 0 600 ${height}" role="img" aria-label="${esc(label)}">${content}</svg>`}
function trendEmpty(message){return `<div class="trend-empty">${esc(message)}</div>`}
function trendMapGroup(name){const normalized=name.trim().toLowerCase();if(normalized==='overhead cable tricep extension'||normalized==='overhead triceps extension')return 'triceps';for(const [group,names] of Object.entries(exerciseGroups)){if(names.some(n=>n.toLowerCase()===normalized))return group}return 'other'}
function renderTrendConsistency(){
 const workouts=trendWeekHistory(trendWeekOffset),start=trendWeekStart(trendWeekOffset),end=new Date(start);end.setDate(end.getDate()+6);
 trendEl('trendsWeekLabel').textContent=`${start.toLocaleDateString(undefined,{month:'short',day:'numeric'})} – ${end.toLocaleDateString(undefined,{month:'short',day:'numeric'})}`;
 trendEl('trendWorkoutCount').textContent=workouts.length;
 if(!workouts.length){trendEl('trendConsistencyChart').innerHTML=trendEmpty('No completed workouts logged this week. Your workout history will build this view over time.');return}
 const counts=Array(7).fill(0);for(const workout of workouts){const d=new Date(workout.date);counts[(d.getDay()+6)%7]++}
 const max=Math.max(2,...counts),days=['M','T','W','T','F','S','S'],step=540/7;
 const bars=counts.map((n,i)=>{const x=34+i*step+step*.23,h=n?Math.max(7,n/max*66):0;return n?`<rect class="trend-bar" x="${x}" y="${90-h}" width="${step*.54}" height="${h}" rx="5"/>`:''}).join('');
 const labels=days.map((d,i)=>`<text class="trend-label" text-anchor="middle" x="${34+i*step+step/2}" y="116">${d}</text>`).join('');
 trendEl('trendConsistencyChart').innerHTML=trendSvg(`<line class="trend-axis" x1="30" y1="90" x2="570" y2="90"/>${bars}${labels}`,`Workout days in selected week` ,128);
}
function renderTrendCoverage(){
 const totals={};for(const workout of trendWeekHistory(trendWeekOffset))for(const exercise of workout.exercises||[]){const group=trendMapGroup(exercise.name);if(group==='other')continue;totals[group]=(totals[group]||0)+(exercise.sets||[]).length}
 const entries=Object.entries(totals).filter(([,n])=>n>0);if(!entries.length){trendEl('trendCoverageChart').innerHTML=trendEmpty('Log completed sets for a body-part breakdown. Unmatched custom exercises are left out until they have a muscle group.');return}
 const max=Math.max(8,...entries.map(([,n])=>n)),rows=entries.map(([group,n],i)=>{const y=17+i*32,width=380*n/max;return `<text class="trend-label" x="0" y="${y+13}">${trendNames[group]||'Other'}</text><rect class="trend-track" x="104" y="${y}" width="380" height="16" rx="8"/><rect class="trend-bar" x="104" y="${y}" width="${width}" height="16" rx="8"/><text class="trend-label" x="500" y="${y+13}">${n}</text>`}).join('');
 trendEl('trendCoverageChart').innerHTML=trendSvg(rows,'Working sets by primary muscle group',entries.length*32+10);
}
function trendPeriodStarts(){const last=trendWeekStart(trendWeekOffset);return Array.from({length:trendRange},(_,i)=>{const d=new Date(last);d.setDate(d.getDate()-(trendRange-1-i)*7);return d})}
function renderTrendSets(){
 const starts=trendPeriodStarts(),values=starts.map(start=>{const end=new Date(start);end.setDate(end.getDate()+7);return data.history.filter(h=>{const d=new Date(h.date);return !Number.isNaN(d.getTime())&&d>=start&&d<end}).reduce((n,h)=>n+trendSetsIn(h),0)});
 trendEl('trendSetCount').textContent=values.at(-1)||0;
 if(!values.some(Boolean)){trendEl('trendSetsChart').innerHTML=trendEmpty('Log a few workouts to see your weekly set pattern.');return}
 const max=Math.max(4,...values),step=540/values.length,bars=values.map((v,i)=>{const w=Math.min(26,step*.58),x=30+i*step+(step-w)/2,h=v?Math.max(4,v/max*70):0;return v?`<rect class="trend-bar-alt" x="${x}" y="${91-h}" width="${w}" height="${h}" rx="4"/>`:''}).join('');
 const labels=values.map((_,i)=>i===0||i===values.length-1||i===Math.floor(values.length/2)?`<text class="trend-label" text-anchor="middle" x="${30+i*step+step/2}" y="116">${starts[i].toLocaleDateString(undefined,{month:'numeric',day:'numeric'})}</text>`:'').join('');
 trendEl('trendSetsChart').innerHTML=trendSvg(`<line class="trend-axis" x1="28" y1="91" x2="572" y2="91"/><line class="trend-grid" x1="28" y1="45" x2="572" y2="45"/><text class="trend-label" x="0" y="49">${max}</text>${bars}${labels}`,`Weekly completed working sets over ${trendRange} weeks`,128);
}
function renderTrendExerciseOptions(){
 const select=trendEl('trendExerciseSelect'),previous=select.value,names=[...new Set(data.history.flatMap(h=>(h.exercises||[]).map(e=>e.name)))].sort((a,b)=>a.localeCompare(b));
 select.innerHTML='<option value="">Choose exercise</option>'+names.map(name=>`<option value="${esc(name)}">${esc(name)}</option>`).join('');
 if(names.includes(previous))select.value=previous;else if(names.length)select.value=names[0];
}
function renderTrendExercise(){
 const select=trendEl('trendExerciseSelect'),name=select.value;if(!name){trendEl('trendExerciseChart').innerHTML=trendEmpty('Finish a workout with logged sets to see exercise history here.');return}
 const min=trendPeriodStarts()[0],maxDate=new Date(trendWeekStart(trendWeekOffset));maxDate.setDate(maxDate.getDate()+7);
 const sessions=data.history.filter(h=>{const d=new Date(h.date);return d>=min&&d<maxDate&&(h.exercises||[]).some(e=>e.name===name)}).sort((a,b)=>a.date-b.date);
 if(!sessions.length){trendEl('trendExerciseChart').innerHTML=trendEmpty('No sets for this exercise in the selected period.');return}
 const points=sessions.map(h=>{const ex=h.exercises.find(e=>e.name===name),sets=ex.sets||[],top=sets.reduce((best,s)=>!best||Number(s.weight||0)>Number(best.weight||0)?s:best,null);return {date:new Date(h.date),weight:Number(top?.weight||0),reps:Number(top?.reps||0)}});
 const weighted=points.some(p=>p.weight>0),yValues=points.map(p=>weighted?p.weight:p.reps),low=Math.min(...yValues),high=Math.max(...yValues),pad=high===low?Math.max(1,high*.12):Math.max(1,(high-low)*.18),lo=Math.max(0,low-pad),hi=high+pad;
 const xy=points.map((p,i)=>({x:44+i*(520/Math.max(1,points.length-1)),y:91-(yValues[i]-lo)/(hi-lo)*58,p}));
 const line=xy.map(p=>`${p.x},${p.y}`).join(' '),dots=xy.map(p=>`<circle class="trend-point" cx="${p.x}" cy="${p.y}" r="4"><title>${p.p.date.toLocaleDateString()} · ${p.p.weight?`${p.p.weight} ${data.weightUnit||'lb'} × `:''}${p.p.reps} reps</title></circle>`).join('');
 const first=points[0].date.toLocaleDateString(undefined,{month:'short',day:'numeric'}),last=points.at(-1).date.toLocaleDateString(undefined,{month:'short',day:'numeric'}),unit=weighted?(data.weightUnit||'lb'):'reps';
 trendEl('trendExerciseChart').innerHTML=trendSvg(`<line class="trend-axis" x1="38" y1="100" x2="570" y2="100"/><line class="trend-grid" x1="38" y1="62" x2="570" y2="62"/><text class="trend-label" x="0" y="20">${esc(unit)}</text><polyline class="trend-line" points="${line}"/>${dots}<text class="trend-label" x="38" y="124">${first}</text><text class="trend-label" text-anchor="end" x="570" y="124">${last}</text>`,`Top logged ${weighted?'set load':'set reps'} for ${name}`,136);
}
function renderTrends(){renderTrendConsistency();renderTrendCoverage();renderTrendSets();renderTrendExerciseOptions();renderTrendExercise()}
document.querySelector('[data-screen="trendsScreen"]').addEventListener('click',renderTrends);
trendEl('trendsPrevWeek').addEventListener('click',()=>{trendWeekOffset--;renderTrends()});
trendEl('trendsNextWeek').addEventListener('click',()=>{if(trendWeekOffset<0){trendWeekOffset++;renderTrends()}});
document.querySelectorAll('[data-trend-range]').forEach(button=>button.addEventListener('click',()=>{trendRange=Number(button.dataset.trendRange);document.querySelectorAll('[data-trend-range]').forEach(b=>b.classList.toggle('selected',b===button));renderTrendSets();renderTrendExercise()}));
trendEl('trendExerciseSelect').addEventListener('change',renderTrendExercise);
