(() => {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, t) => { const p = clamp((t - a) / (b - a)); return p * p * (3 - 2 * p); };
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = preference.matches;
  const scenes = $$('.scene'), chapters = $$('.chapter');
  // 自动展开参数：进入本幕（画面钉住）后延迟 AUTO_DELAY 秒开始，用 AUTO_DURATION 秒缓慢放大到全屏；
  // 滚离本幕时用 AUTO_COLLAPSE 秒收回，可反复重播。展开不再由滚动进度驱动。
  const AUTO_DELAY=.55, AUTO_DURATION=4.6, AUTO_COLLAPSE=1.1;
  const expandClock=new Map();
  let current = 0, dirty = true, previousTime = 0, heroOnscreen = true;
  const pointer = {x:.5, y:.68, targetX:.5, targetY:.68, moved:false};
  const hero = $('#hero'), header = $('.site-header');
  const heroArt=$('.hero-art'), heroFallback=$('.hero-fallback');
  const previous = $('#previous'), next = $('#next'), motion = $('#motion-toggle');
  const menu = $('#mobile-nav'), menuToggle = $('.menu-toggle');
  const drawer = $('#source-drawer');
  let drawerTrigger = null;
  function setMenu(open) {
    menu.hidden=!open;
    menuToggle.setAttribute('aria-expanded',String(open));
    menuToggle.setAttribute('aria-label',open?'收起章节导航':'展开章节导航');
    $$('main,.presentation-tools,.brand,.begin,.chapter-nav,.skip').forEach(el=>{el.inert=open;});
    document.body.classList.toggle('menu-open',open);
  }

  function navigate(index) {
    index = clamp(index, 0, scenes.length - 1);
    const section = scenes[index];
    let target = section.offsetTop;
    if (section.classList.contains('chapter')) target += (section.offsetHeight - innerHeight) * .12;
    window.scrollTo({top:target, behavior:reduced ? 'instant' : 'smooth'});
    history.replaceState(null, '', '#' + section.id);
    setMenu(false);
    const heading = $('h1,h2',section);
    heading?.setAttribute('tabindex','-1'); heading?.focus({preventScroll:true});
  }
  $$('a[href^="#"]').forEach(link => link.addEventListener('click', e => {
    const index = scenes.findIndex(s => '#' + s.id === link.getAttribute('href'));
    if (index < 0 || link.classList.contains('skip')) return;
    e.preventDefault(); navigate(index);
  }));
  previous.addEventListener('click', () => navigate(current - 1));
  next.addEventListener('click', () => navigate(current + 1));
  menuToggle.addEventListener('click', () => {
    setMenu(menu.hidden);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Tab' && !menu.hidden) {
      const last = $$('a',menu).at(-1);
      if(e.shiftKey && document.activeElement===menuToggle){e.preventDefault();last.focus();}
      else if(!e.shiftKey && document.activeElement===last){e.preventDefault();menuToggle.focus();}
      return;
    }
    if (e.key === 'Tab' && !drawer.hidden) {
      const focusable = $$('button,a[href]',drawer);
      const first = focusable[0], last = focusable[focusable.length-1];
      if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
      return;
    }
    if (e.key === 'Escape') {
      if (!drawer.hidden) closeDrawer();
      if (!menu.hidden) { setMenu(false); menuToggle.focus(); }
      return;
    }
    if (e.altKey || e.ctrlKey || e.metaKey || !drawer.hidden || !menu.hidden || /INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName)) return;
    if (['ArrowRight','ArrowDown','PageDown'].includes(e.key)) {e.preventDefault();navigate(current + 1);}
    if (['ArrowLeft','ArrowUp','PageUp'].includes(e.key)) {e.preventDefault();navigate(current - 1);}
    if (e.key === 'Home') {e.preventDefault();navigate(0);}
    if (e.key === 'End') {e.preventDefault();navigate(6);}
  });
  function setReduced(value) {
    reduced = value;
    document.body.classList.toggle('reduced', reduced);
    motion.setAttribute('aria-pressed', String(reduced));
    motion.setAttribute('aria-label', reduced ? '恢复动效' : '减弱动效');
    motion.title = reduced ? '恢复动效' : '减弱动效';
    motion.innerHTML = reduced ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 9 6-9 6Z"/></svg>' : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6v12M15 6v12"/></svg>';
    $('#dust').style.opacity = reduced ? '0' : '1';
    $('#light-scene').style.visibility = reduced ? 'hidden' : 'visible';
    if(reduced)heroFallback.style.transform='';
    dirty = true;
  }
  motion.addEventListener('click', () => setReduced(!reduced));
  preference.addEventListener('change', e => setReduced(e.matches));
  setReduced(reduced);

  const sourceData = {
    phenomenology: {title:'Phänomenologie des Geistes',caption:'G. W. F. Hegel · 1807年，班贝格／维尔茨堡',detail:'《精神现象学》的早期印刷书页。第一幕参照“感性确定性”，第二幕参照“自我意识的独立性与依赖性”。这是印刷本，非亲笔稿。',credit:'历史文本公有领域。扫描来源见原件页面。',url:'https://digital.staatsbibliothek-berlin.de/werkansicht?PPN=PPN816955166'},
    fantin: {title:'Still Life with Flowers and Fruit',caption:'Henri Fantin-Latour · 1866',detail:'《花果静物》。花蕾、盛放的花朵与果实同在一幅静物里，作为《精神现象学》序言“花蕾—花朵—果实”比喻的视觉诠释。画作与黑格尔文本并无直接关联。',credit:'The Metropolitan Museum of Art · 1980.3 · Open Access / Public Domain',url:'https://www.metmuseum.org/art/collection/search/436293'},
    'two-men': {title:'Two Men Contemplating the Moon',caption:'Caspar David Friedrich · 约1825—1830',detail:'《两人观月》。两个人共同面向世界，作为“承认与关系”的视觉入口；画作本身不描绘黑格尔的主奴论证。',credit:'The Metropolitan Museum of Art · 2000.51 · Open Access / Public Domain',url:'https://www.metmuseum.org/art/collection/search/438417'},
    declaration: {title:'Déclaration des droits de l’homme',caption:'Jean-Jacques-François Le Barbier · 约1789',detail:'《人权和公民权宣言》的绘画呈现，用于第三幕关于普遍自由如何获得具体制度形式的讨论。',credit:'Paris Musées / Musée Carnavalet · P708 · CC0',url:'https://www.parismuseescollections.paris.fr/fr/musee-carnavalet/oeuvres/declaration-des-droits-de-l-homme-et-du-citoyen-5'},
    jena: {title:'Napoleon Crossing the Alps',caption:'Alphonse François，依据 Paul Delaroche · 1851',detail:'《拿破仑翻越阿尔卑斯山》版画，作为拿破仑时代的视觉入口，描绘阿尔卑斯山题材，并非耶拿现场。黑格尔于1806年10月13日的信中称拿破仑为Weltseele，世界之魂。',credit:'The Metropolitan Museum of Art · 49.40.177 · Public Domain',url:'https://www.metmuseum.org/art/collection/search/339867'},
    schinkel: {title:'Gotischer Dom am Wasser',caption:'Karl Friedrich Schinkel · 1813',detail:'《水边的哥特式大教堂》。以暮色、城市与水面作为尾声的视觉诠释。猫头鹰引文出自《法哲学原理》序言；“真理是全体”出自《精神现象学》序言。',credit:'Staatliche Museen zu Berlin / Alte Nationalgalerie · Foto: Jörg P. Anders · Public Domain Mark 1.0',url:'https://search.smb.museum/object/obj-958640'}
  };
  function openDrawer(id, trigger) {
    const data = sourceData[id]; if (!data) return;
    drawerTrigger = trigger;
    const el = $('#source-detail'); el.replaceChildren();
    ['h3','p','p','p','a'].forEach((tag,i) => {
      const node = document.createElement(tag);
      node.textContent = [data.title,data.caption,data.detail,data.credit,'查看馆藏与来源 ↗'][i];
      if (tag === 'a') {node.href=data.url;node.target='_blank';node.rel='noopener noreferrer';}
      el.append(node);
    });
    drawer.hidden = false;
    $$('body > :not(#source-drawer):not(script):not(noscript)').forEach(el=>{el.inert=true;});
    document.body.classList.add('panel-open');
    $('#close-sources').focus();
  }
  function closeDrawer() {
    drawer.hidden=true;
    $$('body > [inert]').forEach(el=>{el.inert=false;});
    document.body.classList.remove('panel-open');
    drawerTrigger?.focus();
  }
  $$('.art-credit').forEach(button => button.addEventListener('click', () => openDrawer(button.dataset.source, button)));
  $('#close-sources').addEventListener('click', closeDrawer);
  document.addEventListener('pointerdown', e => {if (!drawer.hidden && !drawer.contains(e.target) && !e.target.closest('.art-credit')) closeDrawer();});
  $$('.art,.epilogue-art').forEach(img => {
    img.addEventListener('error', () => {
      if (img.dataset.fallback && !img.dataset.fallbackUsed) {img.dataset.fallbackUsed='true';img.src=img.dataset.fallback;return;}
      img.parentElement.classList.add('media-error');
    });
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {if (entry.isIntersecting) entry.target.classList.add('entered');});
  }, {threshold:.16});
  scenes.forEach(scene => observer.observe(scene));
  new IntersectionObserver(entries => {heroOnscreen=entries[0].isIntersecting;}, {threshold:0}).observe(hero);
  addEventListener('scroll', () => {dirty=true;}, {passive:true});
  addEventListener('resize', () => {dirty=true;resizeGraphics();}, {passive:true});
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || !heroOnscreen || reduced) return;
    pointer.targetX = e.clientX / innerWidth; pointer.targetY = e.clientY / innerHeight;pointer.moved=true;
  }, {passive:true});
  document.addEventListener('visibilitychange', () => {previousTime=0;dirty=true;});

  function updateScroll() {
    const h = innerHeight, w = innerWidth;
    const geometry = scenes.map(s => ({scene:s,top:s.getBoundingClientRect().top,height:s.offsetHeight}));
    const selected = geometry.findLastIndex(s => s.top < h * .5);
    current = Math.max(0,selected);
    $('#page-current').textContent = String(current + 1).padStart(2,'0');
    previous.disabled=current===0;next.disabled=current===6;
    header.classList.toggle('scrolled',current>0);
    $$('.chapter-nav a').forEach(a => {if (a.hash==='#'+scenes[current].id)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    for (const {scene,top,height} of geometry) {
      if (!scene.classList.contains('chapter') || top > h || top + height < 0) continue;
      const stage = $('.chapter-stage',scene), image = $('.art',scene), art = $('.art-window',scene), copy = $('.chapter-copy',scene), shade = $('.art-shade',scene);
      const p = clamp(-top / (height-h));
      // 展开进度来自自动播放的时钟（进入本幕后开始计时），与滚动位置解耦
      const elapsed = expandClock.get(scene) || 0;
      const expand = reduced ? 1 : smooth(0,1,(elapsed-AUTO_DELAY)/AUTO_DURATION);
      const right = scene.dataset.side==='right', mobile=w<=640;
      const start = mobile ? [18,right?24:5,15,right?5:24] : [14,right?43:5,15,right?5:43];
      art.style.inset=start.map(n => (n*(1-expand)).toFixed(3)+'%').join(' ');
      art.style.borderRadius=(16*(1-expand)).toFixed(1)+'px';
      // 边缘虚化：静止时轻微柔边，展开途中羽化最强（画面从暗色中柔和浮现），抵达全屏时归于干净
      const soften = reduced ? 0 : Math.max(4*expand*(1-expand), .16*(1-expand));
      art.style.setProperty('--edge-blur',(Math.min(w*.055,110)*soften).toFixed(1));
      art.style.setProperty('--edge-soft',(Math.min(w*.011,18)*soften).toFixed(1));
      // 让画面内容保持稳定，由窗口扩展主导"画面扩大"的观感
      image.style.transform=reduced?'none':`scale(${mix(1.1,1.06,expand)}) translateY(${mix(2,-2,p)}%)`;
      shade.style.opacity=String(mobile?1:mix(.78,1,expand));
      copy.style.transform=`translateY(calc(-50% + ${reduced?0:mix(18,-28,p)}px))`;
      stage.style.setProperty('--chapter-progress',expand.toFixed(4));
    }
    if (!reduced) {
      const scroll = clamp(scrollY/h);
      $('.hero-title').style.transform=`translateY(${-scroll*65}px)`;
      $('.hero-title').style.opacity=String(1-smooth(.4,.95,scroll));
      $('.hero-note').style.opacity=String(1-smooth(.3,.8,scroll));
      $('.hero-art').style.transform=`translateY(${scroll*55}px)`;
    }
    dirty=false;
  }

  // Image-based WebGL relighting: a luminance-derived depth field displaces
  // the painting gently; diffuse light, a moving spotlight and soft beams
  // follow the pointer. This is a 2.5D reconstruction, not physical ray tracing.
  const canvas=$('#light-scene');
  let gl=null, program=null, uniforms={}, imageReady=false, graphicsAvailable=false;
  let textureSize=[1672,941];
  try {gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});} catch (_) {}
  const vertex=`attribute vec2 position;varying vec2 uv;void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
  const fragment=`precision mediump float;
    uniform sampler2D image;uniform vec2 resolution;uniform vec2 imageSize;
    uniform vec2 pointer;uniform float time;varying vec2 uv;
    float lum(vec3 c){return dot(c,vec3(.299,.587,.114));}
    vec2 cover(vec2 p){float a=resolution.x/resolution.y;float b=imageSize.x/imageSize.y;return (p-.5)*vec2(min(a/b,1.),min(b/a,1.))+.5;}
    void main(){
      vec2 screen=vec2(uv.x,1.-uv.y);vec2 q=cover(screen);
      vec3 original=texture2D(image,q).rgb;
      float depth=lum(original)*.65+.25;
      q+=(pointer-.5)*.012*(depth-.45);
      vec3 c=texture2D(image,q).rgb;
      vec2 px=1./imageSize;
      float dx=lum(texture2D(image,q+vec2(px.x*3.,0.)).rgb)-lum(texture2D(image,q-vec2(px.x*3.,0.)).rgb);
      float dy=lum(texture2D(image,q+vec2(0.,px.y*3.)).rgb)-lum(texture2D(image,q-vec2(0.,px.y*3.)).rgb);
      vec3 normal=normalize(vec3(-dx*2.,-dy*2.,1.));
      vec2 delta=(screen-pointer)*vec2(resolution.x/resolution.y,1.);
      float spot=exp(-dot(delta,delta)*6.8);
      vec3 light=normalize(vec3(-delta.x,-delta.y,.65));
      float diffuse=max(dot(normal,light),0.);
      float breathing=.96+.04*sin(time*.8);
      float brightness=.48+spot*.62*diffuse*breathing;
      c=mix(vec3(lum(c)),c,.88)*brightness;
      c+=vec3(1.,.72,.37)*spot*spot*.045;
      vec2 source=vec2(pointer.x*.45+.3,-.25);
      vec2 ray=normalize(pointer-source);vec2 d=screen-source;
      float along=dot(d,ray);float across=abs(d.x*ray.y-d.y*ray.x);
      float beam=exp(-across*across*170.)*smoothstep(0.,.4,along)*(1.-smoothstep(.8,1.6,along));
      c+=vec3(.7,.49,.25)*beam*.075*(.8+.2*sin(time*.35));
      float vignette=1.-smoothstep(.4,.95,length((screen-.5)*vec2(.8,1.)))*.25;
      gl_FragColor=vec4(c*vignette,1.);
    }`;
  function shader(type,source) {const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('shader compilation failed');return s;}
  if (gl) try {
    program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
    if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw Error('shader linking failed');
    gl.useProgram(program);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    const location=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,2,gl.FLOAT,false,0,0);
    ['resolution','imageSize','pointer','time'].forEach(key=>uniforms[key]=gl.getUniformLocation(program,key));
    const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    const image=new Image();image.onload=()=>{gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,image);textureSize=[image.naturalWidth,image.naturalHeight];imageReady=true;graphicsAvailable=true;canvas.classList.add('ready');heroArt.classList.remove('fallback-light');resizeGraphics();};image.src='assets/hero-arcade.webp';
  } catch (error) {gl=null;canvas.remove();}
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();graphicsAvailable=false;canvas.classList.remove('ready');heroArt.classList.add('fallback-light');});
  canvas.addEventListener('webglcontextrestored',()=>location.reload());
  const dustCanvas=$('#dust'),dustContext=dustCanvas.getContext('2d');
  let dustWidth=0,dustHeight=0;
  const particles=Array.from({length:38},()=>({x:Math.random(),y:Math.random(),r:.4+Math.random()*.7,speed:.002+Math.random()*.004,phase:Math.random()*6.28}));
  function resizeGraphics() {
    const dpr=Math.min(devicePixelRatio||1,1.4);
    canvas.width=Math.round(innerWidth*dpr);canvas.height=Math.round(innerHeight*dpr);
    if(gl){gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(uniforms.resolution,canvas.width,canvas.height);gl.uniform2f(uniforms.imageSize,...textureSize);}
    dustWidth=innerWidth;dustHeight=innerHeight;dustCanvas.width=Math.round(dustWidth*dpr);dustCanvas.height=Math.round(dustHeight*dpr);dustContext?.setTransform(dpr,0,0,dpr,0,0);
  }
  // 自动展开时钟：本幕画面钉住于视口时前进（展开），离开时快速倒退（收回）
  let expanding=false;
  function advanceExpansion(dt) {
    expanding=false;
    const h=innerHeight;
    for(const scene of chapters){
      const rect=scene.getBoundingClientRect();
      const pinned=rect.top<=1&&rect.bottom>=h-1;
      const elapsed=expandClock.get(scene)||0;
      const next=pinned
        ?Math.min(elapsed+dt,AUTO_DELAY+AUTO_DURATION)
        :Math.max(elapsed-dt*((AUTO_DELAY+AUTO_DURATION)/AUTO_COLLAPSE),0);
      if(next!==elapsed){expandClock.set(scene,next);expanding=true;}
    }
  }
  function render(now) {
    requestAnimationFrame(render);
    if(document.hidden)return;
    const dt=Math.min((now-(previousTime||now))/1000,.05);previousTime=now;
    if(!reduced)advanceExpansion(dt);
    if(dirty||expanding)updateScroll();
    if(!heroOnscreen||reduced)return;
    const t=now/1000;
    if(!pointer.moved){pointer.targetX=.5+Math.sin(t*.24)*.16;pointer.targetY=.57+Math.sin(t*.19)*.13;}
    const follow=1-Math.exp(-dt*4);
    pointer.x=mix(pointer.x,pointer.targetX,follow);pointer.y=mix(pointer.y,pointer.targetY,follow);
    if(!graphicsAvailable){
      heroArt.style.setProperty('--light-x',(pointer.x*100).toFixed(2)+'%');
      heroArt.style.setProperty('--light-y',(pointer.y*100).toFixed(2)+'%');
      heroFallback.style.transform=`translate(${((pointer.x-.5)*-8).toFixed(2)}px,${((pointer.y-.5)*-5).toFixed(2)}px) scale(1.035)`;
    }
    if(gl&&imageReady&&graphicsAvailable){gl.uniform2f(uniforms.pointer,pointer.x,pointer.y);gl.uniform1f(uniforms.time,t);gl.drawArrays(gl.TRIANGLES,0,6);}
    if(dustContext){
      dustContext.clearRect(0,0,dustWidth,dustHeight);
      for(const p of particles){p.y-=p.speed*dt;p.x+=p.speed*.24*dt;if(p.y<0)p.y=1;if(p.x>1)p.x=0;
        const distance=Math.hypot((p.x-pointer.x)*1.4,p.y-pointer.y);const alpha=clamp(1-distance*2)*(.13+.17*Math.sin(t*.7+p.phase));
        if(alpha<=0)continue;dustContext.beginPath();dustContext.arc(p.x*dustWidth,p.y*dustHeight,p.r,0,Math.PI*2);dustContext.fillStyle=`rgba(245,221,179,${alpha})`;dustContext.fill();
      }
    }
  }
  resizeGraphics();
  requestAnimationFrame(()=>{hero.classList.add('entered');requestAnimationFrame(render);});
  window.addEventListener('load',()=>{if(location.hash){const i=scenes.findIndex(s=>'#'+s.id===location.hash);if(i>=0)navigate(i);}dirty=true;},{once:true});
})();
