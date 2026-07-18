/* ============================================================
   NEUTRON — shared site script
   Loaded by index.html and every page in /pages
   ============================================================ */

// CSS STARFIELD
(function(){
  var l=document.getElementById('css-stars');
  if(!l)return;
  var f=document.createDocumentFragment();
  for(var i=0;i<35;i++){
    var s=document.createElement('span');
    var sz=0.8+Math.random()*1.2;
    s.style.cssText='left:'+(Math.random()*100)+'%;top:'+(Math.random()*100)+'%;width:'+sz+'px;height:'+sz+'px;--d:'+(2+Math.random()*4).toFixed(1)+'s;--a1:'+(0.05+Math.random()*0.1).toFixed(2)+';--a2:'+(0.2+Math.random()*0.2).toFixed(2)+';animation-delay:-'+(Math.random()*5).toFixed(1)+'s;';
    f.appendChild(s);
  }
  l.appendChild(f);
})();

// Block pinch-zoom on iOS + Android (meta tag alone doesn't reliably work)
document.addEventListener('gesturestart', function(e){ e.preventDefault(); });
document.addEventListener('gesturechange', function(e){ e.preventDefault(); });
document.addEventListener('touchmove', function(e){
  if(e.scale !== undefined && e.scale !== 1){ e.preventDefault(); }
}, { passive:false });

// VIEW SWITCHING (landing <-> year-detail, within a single page)
function showView(id){
  Array.prototype.forEach.call(document.querySelectorAll('.view'),function(v){v.classList.remove('active');});
  var t=document.getElementById(id);if(t)t.classList.add('active');
  window.scrollTo({top:0,behavior:'instant'});
  setTimeout(function(){
    Array.prototype.forEach.call(document.querySelectorAll('#'+id+' .reveal'),function(el){el.classList.remove('visible');void el.offsetWidth;el.classList.add('visible');});
  },60);
  if(window._setScene)window._setScene(id);
}
window.showView=showView;

// YEAR DATA LOADER
// Fetches a per-year fragment from /data and drops it into that page's
// "-detail" container, e.g. loadYearView('events','2627') fetches
// ../data/events-2627.html and shows it inside #view-events-detail.
// To add a new year: 1) upload data/<section>-<year>.html  2) add one
// card in the matching pages/<section>.html landing with
// onclick="loadYearView('<section>','<year>')"
function loadYearView(section,year){
  var target=document.getElementById('view-'+section+'-detail');
  if(!target)return;
  fetch('../data/'+section+'-'+year+'.html')
    .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.text(); })
    .then(function(html){
      target.innerHTML=html;
      showView('view-'+section+'-detail');
    })
    .catch(function(err){
      target.innerHTML='<div class="ph"><h1>Content unavailable</h1><p>Could not load this year\'s data. Make sure the file exists in /data.</p></div>';
      showView('view-'+section+'-detail');
      console.error('loadYearView failed:',err);
    });
}
window.loadYearView=loadYearView;

// MOBILE NAV BURGER
function toggleNav(){document.querySelector('.nav-links').classList.toggle('open');}
window.toggleNav=toggleNav;

// SCROLL REVEAL
var ro=new IntersectionObserver(function(e){e.forEach(function(en){if(en.isIntersecting)en.target.classList.add('visible');});},{threshold:0.12});
Array.prototype.forEach.call(document.querySelectorAll('.reveal'),function(el){ro.observe(el);});

// THREE.JS UNIVERSE
(function(){
  if(typeof THREE==='undefined')return;
  var C=document.getElementById('universe-canvas');
  var isMobile=window.innerWidth<768||('ontouchstart' in window); 
  var R=new THREE.WebGLRenderer({canvas:C,antialias:!isMobile,alpha:false});
  R.setPixelRatio(Math.min(window.devicePixelRatio,2));
  R.setClearColor(0x000008,1);
  var S=new THREE.Scene();
  var cam=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,0.1,3000);
  cam.position.z=90;

  function resize(){R.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();}
  resize();window.addEventListener('resize',resize);

  // DEEP STARFIELD (spherical shell)
  var N=isMobile?700:1900,sp=new Float32Array(N*3),ss=new Float32Array(N),sc=new Float32Array(N*3);
  for(var i=0;i<N;i++){
    var r=120+Math.random()*700,th=Math.random()*Math.PI*2,ph=Math.acos(2*Math.random()-1);
    sp[i*3]=r*Math.sin(ph)*Math.cos(th);sp[i*3+1]=r*Math.sin(ph)*Math.sin(th);sp[i*3+2]=r*Math.cos(ph)-200;
    ss[i]=0.5+Math.random()*2.8;
    var t=Math.random();
    if(t<0.07){sc[i*3]=0.5;sc[i*3+1]=0.9;sc[i*3+2]=1.0;}
    else if(t<0.12){sc[i*3]=1.0;sc[i*3+1]=0.85;sc[i*3+2]=0.5;}
    else if(t<0.22){sc[i*3]=0.7;sc[i*3+1]=0.7;sc[i*3+2]=1.0;}
    else{sc[i*3]=1;sc[i*3+1]=1;sc[i*3+2]=1;}
  }
  var sG=new THREE.BufferGeometry();
  sG.setAttribute('position',new THREE.BufferAttribute(sp,3));
  sG.setAttribute('color',new THREE.BufferAttribute(sc,3));
  
  // Circular star texture
  var sTex=(function(){
    var c=document.createElement('canvas');c.width=32;c.height=32;
    var ctx=c.getContext('2d');
    var g=ctx.createRadialGradient(16,16,0,16,16,16);
    g.addColorStop(0,'rgba(255,255,255,1)');
    g.addColorStop(0.35,'rgba(255,255,255,0.8)');
    g.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=g;ctx.fillRect(0,0,32,32);
    return new THREE.CanvasTexture(c);
  })();
  var sMat=new THREE.PointsMaterial({size:isMobile?1.8:3.2,sizeAttenuation:true,map:sTex,vertexColors:true,transparent:true,opacity:1.3,blending:THREE.AdditiveBlending,depthWrite:false,alphaTest:0.01});
  var starField=new THREE.Points(sG,sMat);S.add(starField);

// CURSOR GLOW OVERLAY — desktop only, skipped on mobile (no cursor, heaviest part to render)
  if(!isMobile){
  var glowMat=new THREE.ShaderMaterial({
    uniforms:{
      uTex:{value:sTex},
      uMouse:{value:new THREE.Vector2(2,2)},
      uRadius:{value:0.35},
      uAspect:{value:innerWidth/innerHeight}
    },
    vertexShader:
      'attribute vec3 color;'+
      'varying vec3 vColor;'+
      'varying float vGlow;'+
      'uniform vec2 uMouse;'+
      'uniform float uRadius;'+
      'uniform float uAspect;'+
      'void main(){'+
        'vColor=color;'+
        'vec4 mvPosition=modelViewMatrix*vec4(position,1.0);'+
        'gl_Position=projectionMatrix*mvPosition;'+
        'vec2 ndc=gl_Position.xy/gl_Position.w;'+
        'vec2 d=ndc-uMouse;d.x*=uAspect;'+
        'float dist=length(d);'+
        'vGlow=smoothstep(uRadius,0.0,dist);'+
        'float baseSize=3.2*(300.0/-mvPosition.z);'+
        'gl_PointSize=baseSize*(1.0+vGlow*6.5);'+
      '}',
    fragmentShader:
      'precision mediump float;'+
      'uniform sampler2D uTex;'+
      'varying vec3 vColor;'+
      'varying float vGlow;'+
      'void main(){'+
        'if(vGlow<0.02)discard;'+
        'vec4 tex=texture2D(uTex,gl_PointCoord);'+
        'gl_FragColor=vec4(vColor,1.0)*tex*(vGlow*2.2);'+
      '}',
    transparent:true,
    depthWrite:false,
    blending:THREE.AdditiveBlending
  });
  var starGlow=new THREE.Points(sG,glowMat);
  S.add(starGlow);
  window.addEventListener('resize',function(){glowMat.uniforms.uAspect.value=innerWidth/innerHeight;});
  (function glowLoop(){
    requestAnimationFrame(glowLoop);
    glowMat.uniforms.uMouse.value.set(mx,my);
  })();
  }

  // GALAXY SPIRAL
  var GN=1500,gp=new Float32Array(GN*3),gc2=new Float32Array(GN*3);
  for(var g=0;g<GN;g++){
    var arm=Math.floor(Math.random()*3);
    var dist=12+Math.pow(Math.random(),0.5)*220;
    var ang=arm*(Math.PI*2/3)+(dist/38)+(Math.random()-0.5)*0.55;
    gp[g*3]=Math.cos(ang)*dist+(Math.random()-0.5)*14;
    gp[g*3+1]=(Math.random()-0.5)*12;
    gp[g*3+2]=Math.sin(ang)*dist+(Math.random()-0.5)*14-380;
    var br=0.3+Math.random()*0.7;
    if(dist<40){gc2[g*3]=br;gc2[g*3+1]=br*0.9;gc2[g*3+2]=br*0.5;}
    else if(dist<100){gc2[g*3]=br*0.5;gc2[g*3+1]=br*0.5;gc2[g*3+2]=br;}
    else{gc2[g*3]=br*0.4;gc2[g*3+1]=br*0.5;gc2[g*3+2]=br*0.9;}
  }
  var gG=new THREE.BufferGeometry();
  gG.setAttribute('position',new THREE.BufferAttribute(gp,3));
  gG.setAttribute('color',new THREE.BufferAttribute(gc2,3));
  var gMat=new THREE.PointsMaterial({size:1.4,sizeAttenuation:true,map:sTex,vertexColors:true,transparent:true,opacity:0.25,blending:THREE.AdditiveBlending,depthWrite:false,alphaTest:0.01});
  S.add(new THREE.Points(gG,gMat));

  // NEBULA PLANES (additive blended quads)
  function mkNeb(hex,x,y,z,sz,op){
    var m=new THREE.Mesh(new THREE.PlaneGeometry(sz,sz),new THREE.MeshBasicMaterial({color:hex,transparent:true,opacity:op,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));
    m.position.set(x,y,z);m.rotation.z=Math.random()*Math.PI;return m;
  }
  var nGrp=new THREE.Group();
  nGrp.add(mkNeb(0x1a0a3a,-20,10,-80,140,0.022));nGrp.add(mkNeb(0x0a1a3a,28,-5,-100,120,0.018));
  nGrp.add(mkNeb(0x2a0a2a,-38,-18,-90,110,0.015));nGrp.add(mkNeb(0x0a2a1a,32,28,-110,130,0.012));
  S.add(nGrp);

  // FLOATING DUST
  var DN=120,dp=new Float32Array(DN*3),dv=new Float32Array(DN*3);
  for(var d=0;d<DN;d++){
    dp[d*3]=(Math.random()-0.5)*180;dp[d*3+1]=(Math.random()-0.5)*120;dp[d*3+2]=(Math.random()-0.5)*90-30;
    dv[d*3]=(Math.random()-0.5)*0.009;dv[d*3+1]=(Math.random()-0.5)*0.007;dv[d*3+2]=(Math.random()-0.5)*0.005;
  }
  var dG=new THREE.BufferGeometry();dG.setAttribute('position',new THREE.BufferAttribute(dp,3));
  var dMat=new THREE.PointsMaterial({size:0.3,color:0x7dd8e8,transparent:true,opacity:0.18,blending:THREE.AdditiveBlending,depthWrite:false});
  var dust=new THREE.Points(dG,dMat);S.add(dust);

  window._setScene=function(id){};

  // MOUSE PARALLAX
  var mx=0,my=0,tmx=0,tmy=0;
  window.addEventListener('mousemove',function(e){mx=(e.clientX/innerWidth-.5)*2;my=-(e.clientY/innerHeight-.5)*2;},{passive:true});

  var clk=new THREE.Clock();
  function animate(){
    requestAnimationFrame(animate);
    var t=clk.getElapsedTime();

    // Parallax camera
    tmx+=(mx*4-tmx)*0.035;tmy+=(my*3-tmy)*0.035;
    cam.position.x=tmx;cam.position.y=tmy;
    cam.lookAt(0,0,-65);

    // Starfield slow drift
    starField.rotation.y=t*0.007;starField.rotation.x=t*0.003;

    // Nebula
    nGrp.rotation.z=t*0.009;nGrp.rotation.y=t*0.004;

    // Dust
    var da=dG.attributes.position.array;
    for(var i2=0;i2<DN;i2++){
      da[i2*3]+=dv[i2*3];da[i2*3+1]+=dv[i2*3+1];da[i2*3+2]+=dv[i2*3+2];
      if(Math.abs(da[i2*3])>90)dv[i2*3]*=-1;
      if(Math.abs(da[i2*3+1])>60)dv[i2*3+1]*=-1;
      if(Math.abs(da[i2*3+2]+30)>45)dv[i2*3+2]*=-1;
    }
    dG.attributes.position.needsUpdate=true;
    dust.rotation.y=t*0.012;



    R.render(S,cam);
  }
  animate();
})();
