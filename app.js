/* Camp Board — Outdoor Ed shared planning board (Google Apps Script / Google Sheets edition) */
/* API_URL and SHORTCUT_URL now live in config.js — loaded before this file. */
const state = {pins:[],filter:"all",search:"",installPrompt:null,lightboxPin:null,zoom:1,panX:0,panY:0,userId:localStorage.getItem("campboard-user-id")||crypto.randomUUID()};
localStorage.setItem("campboard-user-id",state.userId);
const $=s=>document.querySelector(s);
const els={grid:$("#pinGrid"),empty:$("#emptyState"),sync:$("#syncStatus"),live:$("#liveText"),composer:$("#composer"),form:$("#pinForm"),url:$("#urlInput"),title:$("#titleInput"),author:$("#authorInput"),category:$("#categoryInput"),error:$("#formError"),save:$("#saveButton"),lightbox:$("#lightbox"),lightboxContent:$("#lightboxContent"),lightboxTitle:$("#lightboxTitle"),lightboxAuthor:$("#lightboxAuthor"),lightboxOriginal:$("#lightboxOriginal"),lightboxShare:$("#lightboxShare"),installButton:$("#installButton"),androidBanner:$("#androidBanner"),iosBanner:$("#iosBanner"),shortcutBanner:$("#shortcutBanner"),shortcutBannerBtn:$("#shortcutBannerBtn"),getShortcut:$("#getShortcutBtn"),search:$("#searchInput"),clearSearch:$("#clearSearch"),notice:$("#apiNotice"),profile:$("#profileButton")};
function safeUrl(v){try{const u=new URL(v);return["http:","https:"].includes(u.protocol)?u:null}catch{return null}}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function domainOf(u){try{return new URL(u).hostname.replace(/^www\./,"")}catch{return""}}
function initials(n){return(n||"A").trim().split(/\s+/).slice(0,2).map(v=>v[0]).join("").toUpperCase()||"A"}
function relTime(v){const d=new Date(v);if(Number.isNaN(d.getTime()))return"";const s=Math.max(1,Math.floor((Date.now()-d)/1000));if(s<60)return`${s}s ago`;const m=Math.floor(s/60);if(m<60)return`${m}m ago`;const h=Math.floor(m/60);if(h<24)return`${h}h ago`;const day=Math.floor(h/24);if(day<7)return`${day}d ago`;return d.toLocaleDateString()}
function detectMedia(url){const u=safeUrl(url);if(!u)return{type:"link"};const h=u.hostname.toLowerCase(),p=u.pathname.toLowerCase();if(h==="youtu.be"||h.endsWith("youtube.com")){let id="";if(h==="youtu.be")id=u.pathname.slice(1);else if(u.pathname==="/watch")id=u.searchParams.get("v")||"";else if(u.pathname.startsWith("/shorts/"))id=u.pathname.split("/")[2]||"";else if(u.pathname.startsWith("/embed/"))id=u.pathname.split("/")[2]||"";if(id)return{type:"youtube",id}}if(h.endsWith("tiktok.com")){const m=u.pathname.match(/\/video\/(\d+)/);if(m)return{type:"tiktok",id:m[1]}}if(h.endsWith("pinterest.com")||h.endsWith("pin.it")){if(/\/pin\/\d+/.test(u.pathname))return{type:"pinterest",url:u.href}}if(h.endsWith("instagram.com")){const m=u.pathname.match(/^\/(p|reel|tv)\/([^/]+)/);if(m)return{type:"instagram",url:u.href}}if(/\.(jpg|jpeg|png|gif|webp|avif)(?:$|\?)/i.test(p+u.search))return{type:"image",url:u.href};if(/\.(mp4|webm|ogg|mov)(?:$|\?)/i.test(p+u.search))return{type:"video",url:u.href};return{type:"link",url:u.href}}
function guessCategory(url){const t=detectMedia(url).type;return["youtube","tiktok","video"].includes(t)?"video":["image","pinterest","instagram"].includes(t)?"photo":"idea"}
function norm(raw){return{id:String(raw.id??raw.ID??raw.pinId??raw.pin_id??crypto.randomUUID()),created_at:raw.created_at??raw.createdAt??raw.timestamp??new Date().toISOString(),url:raw.url??raw.URL??raw.link??"",title:raw.title??raw.Title??"",author:raw.author??raw.Author??raw.user??raw.name??"Anonymous",author_id:String(raw.author_id??raw.authorId??raw.user_id??""),category:raw.category??guessCategory(raw.url??raw.URL??"")}}
async function apiGet(action){const u=new URL(API_URL);u.searchParams.set("action",action);const r=await fetch(u.href,{cache:"no-store"});const text=await r.text();let data;try{data=JSON.parse(text)}catch{throw new Error("Apps Script did not return JSON. The deployment needs a doGet() function.")}if(data.ok===false||data.success===false&&data.error)throw new Error(data.error||"API error");return data}
async function apiPost(action,payload){const r=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=UTF-8"},body:JSON.stringify({action,...payload})});const text=await r.text();let data;try{data=JSON.parse(text)}catch{throw new Error("Apps Script did not return JSON from doPost().")}if(data.ok===false||data.success===false&&data.error)throw new Error(data.error||"API error");return data}
function embed(pin){const m=detectMedia(pin.url),w=document.createElement("div");if(m.type==="image"){const x=document.createElement("img");x.src=m.url;x.alt=pin.title||"Pin image";x.loading="lazy";x.decoding="async";w.appendChild(x)}else if(m.type==="video"){const x=document.createElement("video");x.src=m.url;x.controls=true;x.loop=true;x.muted=true;x.playsInline=true;w.appendChild(x)}else if(m.type==="youtube"){const x=document.createElement("iframe");x.src=`https://www.youtube.com/embed/${encodeURIComponent(m.id)}?rel=0&modestbranding=1`;x.title=pin.title||"YouTube";x.allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";x.allowFullscreen=true;w.appendChild(x)}else if(m.type==="tiktok"){const x=document.createElement("iframe");x.src=`https://www.tiktok.com/player/v1/${encodeURIComponent(m.id)}?description=1&music_info=1`;x.title=pin.title||"TikTok";x.allow="fullscreen";x.allowFullscreen=true;w.appendChild(x)}else if(m.type==="pinterest"){const x=document.createElement("a");x.href=m.url;x.dataset.pinDo="embedPin";x.textContent="View this Pinterest Pin";w.appendChild(x);queueMicrotask(()=>window.PinUtils?.build?.())}else if(m.type==="instagram"){const x=document.createElement("blockquote");x.className="instagram-media";x.dataset.instgrmCaptioned="true";x.innerHTML=`<a href="${esc(m.url)}" target="_blank" rel="noopener noreferrer">View on Instagram</a>`;w.appendChild(x);loadInstagram()}else{const x=document.createElement("div");x.className="external-card";x.innerHTML=`<div class="external-icon">↗</div><div class="external-domain">${esc(domainOf(pin.url)||"Web link")}</div><div class="external-url">${esc(pin.url)}</div>`;w.appendChild(x)}return w}
let instagramLoaded=false;function loadInstagram(){if(instagramLoaded){window.instgrm?.Embeds?.process();return}instagramLoaded=true;const s=document.createElement("script");s.async=true;s.src="https://www.instagram.com/embed.js";s.onload=()=>window.instgrm?.Embeds?.process();document.body.appendChild(s)}
function current(){const q=state.search.trim().toLowerCase();return state.pins.filter(p=>(state.filter==="all"||p.category===state.filter)&&(!q||[p.title,p.author,p.url,p.category,domainOf(p.url)].join(" ").toLowerCase().includes(q)))}
function render(){els.grid.innerHTML="";const list=current();els.empty.hidden=!!list.length;if(!list.length)return;const f=document.createDocumentFragment();list.forEach(p=>f.appendChild(card(p)));els.grid.appendChild(f)}
function card(pin){
  const a=document.createElement("article");a.className="pin-card";
  const m=document.createElement("div");m.className="media-wrap";
  m.appendChild(embed(pin));
  const ov=document.createElement("div");ov.className="card-overlay";
  ov.innerHTML=`<div class="overlay-top"><button class="overlay-btn expand" type="button">Expand</button></div><button class="link-chip" type="button"><span>${esc(domainOf(pin.url)||"Link")}</span></button>`;
  ov.querySelector(".expand").onclick=e=>{e.stopPropagation();openLightbox(pin)};
  ov.querySelector(".link-chip").onclick=e=>{e.stopPropagation();open(pin.url)};
  if(pin.author_id===state.userId&&pin.author_id){
    const d=document.createElement("button");d.className="delete-chip";d.type="button";d.setAttribute("aria-label","Delete pin");d.textContent="✕";
    d.onclick=e=>{e.stopPropagation();deletePin(pin)};
    ov.appendChild(d);
  }
  m.appendChild(ov);
  const b=document.createElement("div");b.className="pin-body";
  b.innerHTML=`<p class="pin-title">${esc(pin.title||domainOf(pin.url)||"Untitled")}</p><div class="pin-source">${esc(domainOf(pin.url))}</div><div class="pin-footer"><div class="author"><span class="avatar">${esc(initials(pin.author))}</span><span class="author-name">${esc(pin.author||"Anonymous")}</span></div><span class="timestamp">${esc(relTime(pin.created_at))}</span></div>`;
  a.append(m,b);
  a.onclick=()=>openLightbox(pin);
  return a;
}
function loading(){els.grid.innerHTML="";for(let i=0;i<10;i++){const x=document.createElement("div");x.className="skeleton";x.style.height=`${160+(i*53)%180}px`;els.grid.appendChild(x)}}
async function load(){loading();try{const d=await apiGet("listPins");state.pins=(d.pins??d.rows??d.data??[]).map(norm).filter(p=>p.url).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));els.sync.textContent="Connected";els.live.textContent="Live board";els.notice.style.display="none";render()}catch(e){els.sync.textContent="Setup needed";els.live.textContent="Google Sheets";els.notice.textContent=e.message;els.notice.style.display="block";els.grid.innerHTML=""}}
async function add(){const u=safeUrl(els.url.value);if(!u)throw new Error("Enter a valid web link.");const author=els.author.value.trim()||"Anonymous";const row={id:crypto.randomUUID(),created_at:new Date().toISOString(),url:u.href,title:els.title.value.trim()||domainOf(u.href),author,author_id:state.userId,category:["video","photo","idea"].includes(els.category.value)?els.category.value:guessCategory(u.href)};await apiPost("addPin",row);state.pins.unshift(row);localStorage.setItem("campboard-author",author);updateAvatar();render()}
async function deletePin(pin){if(pin.author_id!==state.userId)return alert("You can only delete pins you added.");if(!confirm("Delete this pin?"))return;try{await apiPost("deletePin",{id:pin.id,author_id:state.userId});state.pins=state.pins.filter(p=>p.id!==pin.id);render()}catch(e){alert(e.message)}}
function showComposer(prefill={}){els.composer.hidden=false;els.url.value=prefill.url||"";els.title.value=prefill.title||"";els.author.value=localStorage.getItem("campboard-author")||"";els.category.value=prefill.url?guessCategory(prefill.url):"idea";setTimeout(()=>els.url.focus(),20);window.scrollTo({top:0,behavior:"smooth"})}
function hideComposer(){els.composer.hidden=true;els.form.reset();els.error.hidden=true;els.author.value=localStorage.getItem("campboard-author")||""}
els.form.onsubmit=async e=>{e.preventDefault();els.save.disabled=true;els.save.textContent="Saving…";try{await add();hideComposer()}catch(err){els.error.textContent=err.message;els.error.hidden=false}finally{els.save.disabled=false;els.save.textContent="Add pin"}}
$("#addButton").onclick=()=>showComposer();$("#emptyAdd").onclick=()=>showComposer();$("#closeComposer").onclick=hideComposer;
$("#homeButton").onclick=()=>{document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));document.querySelector('.filter[data-filter="all"]').classList.add("active");state.filter="all";state.search="";els.search.value="";els.clearSearch.hidden=true;render();window.scrollTo({top:0,behavior:"smooth"})};
document.querySelectorAll(".filter").forEach(b=>b.onclick=()=>{document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");state.filter=b.dataset.filter;render()});
els.search.oninput=()=>{state.search=els.search.value;els.clearSearch.hidden=!state.search;render()};els.clearSearch.onclick=()=>{els.search.value="";state.search="";els.clearSearch.hidden=true;render()};
function open(u){window.open(u,"_blank","noopener,noreferrer")}
function openLightbox(pin){state.lightboxPin=pin;state.zoom=1;state.panX=0;state.panY=0;els.lightboxContent.innerHTML="";const w=embed(pin);els.lightboxContent.appendChild(w.firstElementChild||w);els.lightboxTitle.textContent=pin.title||"Pin";els.lightboxAuthor.textContent=`${pin.author||"Anonymous"} · ${relTime(pin.created_at)}`;els.lightboxOriginal.href=pin.url;els.lightbox.hidden=false;document.body.style.overflow="hidden";attachZoom()}
function closeLightbox(){els.lightbox.hidden=true;document.body.style.overflow="";els.lightboxContent.innerHTML="";state.lightboxPin=null}
document.querySelectorAll("[data-close-lightbox]").forEach(x=>x.onclick=closeLightbox);document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!els.lightbox.hidden)closeLightbox()});
function attachZoom(){const t=els.lightboxContent.firstElementChild;if(!t||!["IMG","VIDEO"].includes(t.tagName))return;let dragging=false,sx=0,sy=0,ox=0,oy=0;const apply=()=>t.style.transform=`translate(${state.panX}px,${state.panY}px) scale(${state.zoom})`;$("#lightboxStage").onwheel=e=>{e.preventDefault();state.zoom=Math.min(4,Math.max(1,state.zoom+(e.deltaY<0?.15:-.15)));if(state.zoom===1){state.panX=0;state.panY=0}apply()};t.onpointerdown=e=>{if(state.zoom<=1)return;dragging=true;t.setPointerCapture(e.pointerId);sx=e.clientX;sy=e.clientY;ox=state.panX;oy=state.panY};t.onpointermove=e=>{if(!dragging)return;state.panX=ox+e.clientX-sx;state.panY=oy+e.clientY-sy;apply()};t.onpointerup=()=>dragging=false}
async function share(url,title){if(navigator.share){try{await navigator.share({title:title||"Camp Board",text:title||"Shared from Camp Board",url});return}catch(e){if(e?.name==="AbortError")return}}try{await navigator.clipboard.writeText(url);alert("Link copied to clipboard.")}catch{alert(url)}}
els.lightboxShare.onclick=()=>state.lightboxPin&&share(state.lightboxPin.url,state.lightboxPin.title);$("#shareBoard").onclick=()=>share(location.href,"Camp Board — Outdoor Ed planning board");
function updateAvatar(){els.profile.textContent=initials(localStorage.getItem("campboard-author")||"Anonymous")}
els.profile.onclick=()=>{const cur=localStorage.getItem("campboard-author")||"";const next=prompt("Your name (shown on pins you add):",cur);if(next===null)return;const name=next.trim()||"Anonymous";localStorage.setItem("campboard-author",name);els.author.value=name;updateAvatar()};
function install(){window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();state.installPrompt=e;els.installButton.hidden=false;els.androidBanner.hidden=false});els.installButton.onclick=async()=>{if(!state.installPrompt)return;state.installPrompt.prompt();await state.installPrompt.userChoice;state.installPrompt=null;els.installButton.hidden=true;els.androidBanner.hidden=true};$("#installNow").onclick=()=>els.installButton.click();const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1),standalone=isStandaloneMode();if(ios&&!standalone&&!localStorage.getItem("campboard-ios-dismissed"))els.iosBanner.hidden=false;document.querySelectorAll("[data-dismiss]").forEach(b=>b.onclick=()=>{document.getElementById(b.dataset.dismiss).hidden=true;if(b.dataset.dismiss==="iosBanner")localStorage.setItem("campboard-ios-dismissed","1");if(b.dataset.dismiss==="shortcutBanner")localStorage.setItem("campboard-shortcut-dismissed","1")})}
function initShortcutPrompt(){
  if(!SHORTCUT_URL||!isIOSUA())return;
  els.getShortcut.href=SHORTCUT_URL;els.getShortcut.hidden=false;
  if(isStandaloneMode()&&!localStorage.getItem("campboard-shortcut-dismissed")){els.shortcutBannerBtn.href=SHORTCUT_URL;els.shortcutBanner.hidden=false}
}
async function pwa(){if("serviceWorker"in navigator){try{await navigator.serviceWorker.register("./sw.js",{scope:"./"})}catch(e){console.warn(e)}}}
function shareParams(){const q=new URLSearchParams(location.search);const u=q.get("url")||q.get("text");if(u&&safeUrl(u)){showComposer({url:u,title:q.get("title")||""});history.replaceState({}, "", location.pathname)}if(q.get("create")==="1")showComposer()}
function poll(){setInterval(async()=>{if(document.hidden)return;try{const d=await apiGet("listPins");const n=(d.pins??d.rows??d.data??[]).map(norm).filter(p=>p.url);if(JSON.stringify(state.pins.map(p=>p.id))!==JSON.stringify(n.map(p=>p.id))){state.pins=n.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));render()}}catch{}},8000)}

/* ---------- Install gate: blocks use on phones until added to the Home Screen ---------- */
function isMobileUA(){return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)}
function isIOSUA(){return /iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1)}
function isStandaloneMode(){return (matchMedia?.("(display-mode: standalone)").matches)||navigator.standalone===true||document.referrer.includes("android-app://")}
function initInstallGate(){
  if(!isMobileUA()||isStandaloneMode())return;
  document.documentElement.classList.add("gate-active");document.body.classList.add("gate-active");
  const gate=$("#installGate");gate.hidden=false;
  const tabIOS=$("#gateTabIOS"),tabAndroid=$("#gateTabAndroid"),panelIOS=$("#gatePanelIOS"),panelAndroid=$("#gatePanelAndroid");
  function activate(which){tabIOS.classList.toggle("active",which==="ios");tabAndroid.classList.toggle("active",which==="android");panelIOS.classList.toggle("active",which==="ios");panelAndroid.classList.toggle("active",which==="android")}
  tabIOS.onclick=()=>activate("ios");tabAndroid.onclick=()=>activate("android");
  activate(isIOSUA()?"ios":"android");
  const gateInstallBtn=$("#gateInstallNow");
  window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();state.installPrompt=e;gateInstallBtn.hidden=false});
  gateInstallBtn.onclick=async()=>{if(!state.installPrompt)return;state.installPrompt.prompt();const choice=await state.installPrompt.userChoice;state.installPrompt=null;gateInstallBtn.hidden=true;if(choice?.outcome==="accepted")setTimeout(closeGateIfInstalled,600)};
  // Android/desktop Chrome flips display-mode to standalone the moment the
  // install finishes, even without leaving this tab — catch that and drop
  // the gate immediately instead of leaving people stuck looking at it.
  const mq=matchMedia?.("(display-mode: standalone)");
  mq?.addEventListener?.("change",closeGateIfInstalled);
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)closeGateIfInstalled()});
  window.addEventListener("focus",closeGateIfInstalled);
  function closeGateIfInstalled(){if(!isStandaloneMode())return;gate.hidden=true;document.documentElement.classList.remove("gate-active");document.body.classList.remove("gate-active")}
}

document.addEventListener("DOMContentLoaded",async()=>{els.author.value=localStorage.getItem("campboard-author")||"";updateAvatar();initInstallGate();install();initShortcutPrompt();await pwa();await load();poll();shareParams()})
