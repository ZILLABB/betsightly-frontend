#!/usr/bin/env node
/** Generate the approved simple-B PWA icons using only Node built-ins. */
import fs from 'node:fs';
import path from 'node:path';
import { deflateSync } from 'node:zlib';

const dir = path.resolve(import.meta.dirname, '..', 'public');
const source = fs.readFileSync(path.join(dir, 'brand-mark.svg'), 'utf8');
if (!source.includes('M221 18') || !source.includes('#37E58C')) {
  throw new Error('Expected the approved geometric B monogram in public/brand-mark.svg');
}
const bg = [23, 33, 57]; // navy background in approved second reference image
const green = [55, 229, 140];
function add(points,x,y){points.push([x,y]);}
function cubic(points,p0,c1,c2,end,n=28){
  for(let i=1;i<=n;i++){
    const t=i/n,u=1-t;
    add(points,u*u*u*p0[0]+3*u*u*t*c1[0]+3*u*t*t*c2[0]+t*t*t*end[0],
      u*u*u*p0[1]+3*u*u*t*c1[1]+3*u*t*t*c2[1]+t*t*t*end[1]);
  }
}
function contours(){
  const top=[[221,18]];
  cubic(top,[221,18],[207,8],[187,0],[169,0]);
  add(top,0,0);add(top,0,375);add(top,278,99);
  cubic(top,[278,99],[273,66],[255,38],[221,18]);
  const holeTop=[[34,35],[162,35]];
  cubic(holeTop,[162,35],[197,35],[225,53],[237,88]);add(holeTop,34,291);
  const low=[[214,214],[0,428],[0,467],[210,467]];
  cubic(low,[210,467],[280,467],[329,417],[329,353]);
  cubic(low,[329,353],[329,283],[280,230],[214,214]);
  const holeLow=[[227,251]];
  cubic(holeLow,[227,251],[269,263],[293,302],[293,346]);
  cubic(holeLow,[293,346],[293,395],[256,432],[211,432]);add(holeLow,49,432);
  return [[top,true],[holeTop,false],[low,true],[holeLow,false]];
}
function paint(mask,points,fill,size,s,offsetX,offsetY){
  const count=size*2;
  const pts=points.map(([x,y])=>[(offsetX+x*s)*count/512,(offsetY+y*s)*count/512]);
  const first=Math.max(0,Math.floor(Math.min(...pts.map(p=>p[1]))));
  const last=Math.min(count-1,Math.ceil(Math.max(...pts.map(p=>p[1]))));
  for(let row=first;row<=last;row++){
    const mid=row+.5,cross=[];
    for(let i=0;i<pts.length;i++){
      const a=pts[i],b=pts[(i+1)%pts.length];
      if((a[1]<=mid&&b[1]>mid)||(b[1]<=mid&&a[1]>mid))
        cross.push(a[0]+(mid-a[1])*(b[0]-a[0])/(b[1]-a[1]));
    }
    cross.sort((a,b)=>a-b);
    for(let i=0;i+1<cross.length;i+=2){
      const left=Math.max(0,Math.ceil(cross[i]-.5));
      const right=Math.min(count-1,Math.floor(cross[i+1]-.5));
      for(let x=left;x<=right;x++)mask[row*count+x]=fill?1:0;
    }
  }
}
const table=new Uint32Array(256);
for(let n=0;n<256;n++){let c=n;for(let i=0;i<8;i++)c=c&1?0xEDB88320^(c>>>1):c>>>1;table[n]=c>>>0;}
function chunk(type,data){
  const tag=Buffer.from(type,'ascii'),len=Buffer.alloc(4),crc=Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  let c=0xffffffff;
  for(const v of Buffer.concat([tag,data]))c=table[(c^v)&255]^(c>>>8);
  crc.writeUInt32BE((c^0xffffffff)>>>0);
  return Buffer.concat([len,tag,data,crc]);
}
function render(size,maskable){
  const count=size*2,coverage=new Uint8Array(count*count);
  const scale=maskable?.67:.83,x=maskable?145.8:119.5,y=maskable?99.6:62.2;
  for(const [points,filled] of contours())paint(coverage,points,filled,size,scale,x,y);
  const pixels=Buffer.alloc(size*(1+size*3));
  for(let row=0;row<size;row++){
    const off=row*(1+size*3);
    for(let col=0;col<size;col++){
      const at=(row*2)*count+col*2;
      const a=(coverage[at]+coverage[at+1]+coverage[at+count]+coverage[at+count+1])/4;
      for(let c=0;c<3;c++)pixels[off+1+col*3+c]=Math.round(bg[c]*(1-a)+green[c]*a);
    }
  }
  const head=Buffer.alloc(13);
  head.writeUInt32BE(size,0);head.writeUInt32BE(size,4);
  head[8]=8;head[9]=2;
  return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',head),
    chunk('IDAT',deflateSync(pixels,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}
for(const [name,size,maskable] of [
  ['apple-touch-icon-v3.png',180,false],
  ['pwa-192x192-v3.png',192,false],
  ['pwa-512x512-v3.png',512,false],
  ['pwa-maskable-512x512-v3.png',512,true],
]){
  fs.writeFileSync(path.join(dir,name),render(size,maskable));
  console.log('Generated branded icon:',name);
}
