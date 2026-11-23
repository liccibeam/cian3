/* Actual captured screens; every frame is a pure function of time. */
(() => {
  const $ = E.$, {lin,eio,eout,lerp} = E;
  const keys = [
    [0,1160,65,1.08],[1.6,1156,61,1.09],[2.85,1080,-110,1.42],
    [3.65,1080,-110,1.42],[4.35,1150,65,1.08],[5.8,1145,61,1.09],
    [6.9,1140,50,1.12],[8.4,1120,12,1.18],[9.2,1100,-20,1.24],
    [9.7,1110,-10,1.20],[10.4,1140,38,1.12],[11.5,1140,38,1.12],
    [12.7,1210,115,.98],[15,1210,115,.98]
  ];
  function sample(t){
    if(t<=keys[0][0])return keys[0].slice(1);
    for(let i=1;i<keys.length;i++)if(t<keys[i][0]){
      const a=keys[i-1],b=keys[i],p=eio(lin(t,a[0],b[0]));
      return [lerp(a[1],b[1],p),lerp(a[2],b[2],p),Math.exp(lerp(Math.log(a[3]),Math.log(b[3]),p))];
    }
    return keys[keys.length-1].slice(1);
  }
  function copy(id,t,start,end,last=false){
    const entry = start===0 ? 1 : eout(lin(t,start,start+.42));
    const exit = last ? 1 : 1-eio(lin(t,end-.28,end));
    const el=$(id);el.style.opacity=entry*exit;
    el.style.transform=`translateY(${(1-entry)*24-(1-exit)*12}px)`;
    el.style.visibility=entry*exit>.0001?'visible':'hidden';
  }
  function scene(t){
    const s1=eio(lin(t,3.54,3.86)),s2=eio(lin(t,9.45,9.78));
    const scroll=eio(lin(t,7.0,8.18))*430;
    const ds=eio(lin(t,10.0,10.9))*96;
    const [x,y,s]=sample(t);
    $('device').style.transform=`translate(${x}px,${y}px) scale(${s})`;
    // Opaque slides preserve the original UI throughout each navigation.
    // Crossfading screenshots would double text and lighten the screen.
    $('page-home').style.opacity=s1<1?1:0;
    $('page-search').style.opacity=s2<1?1:0;
    $('page-detail').style.opacity=1;
    $('page-search').style.transform=`translateX(${(1-s1)*390-s2*36}px)`;
    $('page-detail').style.transform=`translateX(${(1-s2)*390}px)`;
    $('img-home').style.transform='translateY(0px)';
    $('img-search').style.transform=`translateY(${-scroll}px)`;
    $('img-detail').style.transform=`translateY(${-ds}px)`;
    const focus=eout(lin(t,1.95,2.4))*(1-eio(lin(t,3.45,3.7)));
    $('focus').style.opacity=focus*.8;
    const first=t<6,at=first?3.38:9.38;
    const a=first?window.CAPTURE.screens.home.resume:window.CAPTURE.screens.search.photo;
    const tx=a.x+a.width*.73,ty=a.y+a.height*.5-(first?0:scroll);
    const touch=eout(lin(t,at-.45,at-.12))*(1-eio(lin(t,at+.16,at+.35)));
    const press=Math.sin(lin(t,at-.05,at+.12)*Math.PI);
    $('touch').style.opacity=touch;
    $('touch').style.transform=`translate(${tx-15}px,${ty-15}px) scale(${1-.18*press})`;
    const rp=lin(t,at,at+.55);
    $('pulse').style.opacity=rp>0&&rp<1?(1-rp)*.7:0;
    $('pulse').style.transform=`translate(${tx-37}px,${ty-37}px) scale(${.25+rp*1.15})`;
    copy('copy0',t,0,3.15);copy('copy1',t,3.0,7.2);copy('copy2',t,7.05,11.7);copy('copy3',t,11.5,15,true);
    const final=eio(lin(t,11.5,12.45));
    $('brand').style.width=`${190+44*final}px`;
    $('eyebrow').style.opacity=1-final;
    $('disc').style.transform=`translateX(${final*52}px) scale(${1-final*.05})`;
    const c=t<3?0:t<7.05?1:t<11.5?2:3;
    $('chapter-num').textContent=String(c+1).padStart(2,'0');
    $('chapter-name').textContent=['Сохранённый поиск','Те же параметры','Выбор квартиры','Циан · Найдите своё место'][c];
    const starts=[0,3,7.05,11.5],ends=[3,7.05,11.5,13];
    for(let i=0;i<4;i++)$('p'+i).style.transform=`scaleX(${lin(t,starts[i],ends[i])})`;
  }
  E.start({scene,setup(){E.camera([[0,960,540,1],[15,960,540,1]],[[0,960,540,1]]);E.cursor([]);}});
})();
