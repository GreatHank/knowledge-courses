// 本地文件也能展开锚点指向的原页或答案，无服务器依赖。
function revealTarget(){let id;try{id=decodeURIComponent(location.hash.slice(1))}catch{return}const node=document.getElementById(id);if(!node)return;for(let p=node;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;requestAnimationFrame(()=>node.scrollIntoView({block:'start'}));}
addEventListener('DOMContentLoaded',revealTarget);addEventListener('hashchange',revealTarget);
