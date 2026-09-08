// SPDX-License-Identifier: MIT

import { expect, test } from 'bun:test';

const floor = (a: bigint, b: bigint) => a / b - (a % b < 0n ? 1n : 0n);
const mod = (a: bigint, b: bigint) => a - b * floor(a, b);
const ceil = (a: bigint, b: bigint) => -floor(-a, b);
const leap = (y: bigint) => y % 4n === 0n && y % 128n !== 0n;
const start = (y: bigint) => 365n*y + ceil(y,4n) - ceil(y,128n);
const gs = (y: bigint) => 365n*y + ceil(y,4n) - ceil(y,100n) + ceil(y,400n);
const lengths = (y: bigint) => [31, y%4n===0n && (y%100n!==0n || y%400n===0n) ? 29 : 28,31,30,31,30,31,31,30,31,30,31];
const year = (y: bigint) => y < 0n ? '-'+String(-y).padStart(4,'0') : y > 9999n ? '+'+y : String(y).padStart(4,'0');
const pad = (n: number, w=2) => String(n).padStart(w,'0');

function split(a: bigint, cycle: bigint, years: bigint, fn: typeof start): [bigint, number] {
  const c = floor(a,cycle), r = mod(a,cycle);
  let lo=0n, hi=years;
  while (hi-lo>1n) { const mid=(lo+hi)/2n; if(fn(mid)<=r) lo=mid; else hi=mid; }
  return [years*c+lo, Number(r-fn(lo))+1];
}

function primary(y: bigint, o: number) {
  if(o===365+Number(leap(y))) return year(y)+'-YD';
  if(leap(y) && o===197) return year(y)+'-LD';
  const q=o-1-Number(leap(y)&&o>197);
  return `${year(y)}-${pad(Math.floor(q/28)+1)}-${pad(q%28+1)}`;
}

function parse(s: string): [bigint, number] {
  const m=/^([0-9]{4}|-(?:[0-9]{4}|[1-9][0-9]{4,})|\+[1-9][0-9]{4,})-(LD|YD|[0-9]{2}-[0-9]{2}|W[0-9]{2}-K[1-7]|O[0-9]{3})$/.exec(s);
  if(!m || m[0]!==s) throw Error('syntax');
  const y=BigInt(m[1]); if(year(y)!==m[1]) throw Error('year');
  const f=m[2]; let o: number;
  if(f==='LD') { if(!leap(y)) throw Error('leap'); o=197; }
  else if(f==='YD') o=365+Number(leap(y));
  else if(f[0]==='O') o=Number(f.slice(1));
  else {
    let q: number;
    if(f[0]==='W') { const w=Number(f.slice(1,3)); if(w<1||w>52) throw Error('week'); q=(w-1)*7+Number(f[5])-1; }
    else { const m=Number(f.slice(0,2)), d=Number(f.slice(3)); if(m<1||m>13||d<1||d>28) throw Error('date'); q=(m-1)*28+d-1; }
    o=q+1+Number(leap(y)&&q>=196);
  }
  if(o<1||o>365+Number(leap(y))) throw Error('ordinal');
  return [y,o];
}

function hex(a: bigint) {
  if(a<-(1n<<63n)||a>=(1n<<63n)) throw Error('range');
  const b=new Uint8Array(8); new DataView(b.buffer).setBigInt64(0,a,false);
  return Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');
}

function record(a: bigint) {
  const [y,o]=split(a,46751n,128n,start), p=primary(y,o);
  const q=o-1-Number(leap(y)&&o>197);
  const week=p.endsWith('D') ? null : `${year(y)}-W${pad(Math.floor(q/7)+1)}-K${q%7+1}`;
  let [g,t]=split(a+1n,146097n,400n,gs), m=1;
  while(t>lengths(g)[m-1]) t-=lengths(g)[m++-1];
  return {primary:p,week,ordinal:`${year(y)}-O${pad(o,3)}`,A:String(a),hex:hex(a),gregorian:`${year(g)}-${pad(m)}-${pad(t)}`};
}

const doc=await Bun.file(new URL('../REFERENCE-APPENDIX-Draft-0.1.md',import.meta.url)).text();
const blocks=[...doc.matchAll(/```json\n([\s\S]*?)\n```/g)].map(m=>JSON.parse(m[1]));

test('normative conversion and binary vectors',()=>{
  expect(blocks.length).toBeGreaterThanOrEqual(2);
  for(const row of blocks[0]) {
    expect(record(BigInt(row.A))).toEqual(row);
    for(const s of [row.primary,row.week,row.ordinal].filter(Boolean)) {
      const [y,o]=parse(s); expect(start(y)+BigInt(o-1)).toBe(BigInt(row.A));
    }
    const bytes=Uint8Array.from(row.hex.match(/../g), (s: string)=>parseInt(s,16));
    expect(new DataView(bytes.buffer).getBigInt64(0,false)).toBe(BigInt(row.A));
  }
  expect(()=>hex(-(1n<<63n)-1n)).toThrow();
  expect(()=>hex(1n<<63n)).toThrow();
});

test('normative rejection vectors',()=>{
  for(const s of blocks[1]) expect(()=>parse(s)).toThrow();
});

test('independent day enumeration across negative, zero, and positive IRC cycles',()=>{
  let a=-46751n;
  for(let y=-128n;y<256n;y++) {
    let o=0;
    for(let m=1;m<=13;m++) {
      for(let d=1;d<=28;d++) {
        ++o;
        expect(primary(...split(a,46751n,128n,start))).toBe(`${year(y)}-${pad(m)}-${pad(d)}`);
        expect(start(y)+BigInt(o-1)).toBe(a++);
      }
      if(m===7 && leap(y)) { ++o; expect(primary(...split(a++,46751n,128n,start))).toBe(year(y)+'-LD'); }
    }
    expect(primary(...split(a++,46751n,128n,start))).toBe(year(y)+'-YD');
  }
  expect(a).toBe(93502n);
});

test('Gregorian reference agrees with runtime UTC dates across two cycles',()=>{
  const epoch=Date.UTC(2000,0,1);
  for(let g=1600;g<2400;g++) for(let m=1;m<=12;m++) for(let d=1;d<=lengths(BigInt(g))[m-1];d++) {
    const a=gs(BigInt(g))+BigInt(lengths(BigInt(g)).slice(0,m-1).reduce((a,b)=>a+b,0)+d-1);
    expect(a-730485n).toBe(BigInt((Date.UTC(g,m-1,d)-epoch)/86400000));
    const [y,o]=split(a,146097n,400n,gs);
    expect(y).toBe(BigInt(g));
    expect(o).toBe(Number(a-gs(y))+1);
  }
});

test('documented arithmetic vectors',()=>{
  const section=doc.split('### A.8.3.')[1].split('### A.8.4.')[0];
  function shift(op: string,s: string,n: bigint) {
    const [y,o]=parse(s), p=primary(y,o);
    if(op==='addDays') return primary(...split(start(y)+BigInt(o-1)+n,46751n,128n,start));
    if(op==='shiftYears') return primary(...parse(year(y+n)+p.slice(year(y).length)));
    if(p.endsWith('D')) throw Error('undefined');
    const q=BigInt(o-1-Number(leap(y)&&o>197));
    if(op==='shiftWeeks') {
      const t=364n*y+q+7n*n, y2=floor(t,364n), q2=Number(mod(t,364n));
      return `${year(y2)}-${pad(Math.floor(q2/28)+1)}-${pad(q2%28+1)}`;
    }
    const t=13n*y+q/28n+n;
    return `${year(floor(t,13n))}-${pad(Number(mod(t,13n))+1)}-${pad(Number(q%28n)+1)}`;
  }
  for(const line of section.split('\n')) {
    const m=/^(addDays|shiftWeeks|shiftMonths|shiftYears)(\s*\/ shiftMonths)?\s+(\S+)\s+(-?\d+)\s+(\S+)$/.exec(line);
    if(!m) continue;
    for(const op of m[2] ? ['shiftWeeks','shiftMonths'] : [m[1]]) {
      if(m[5]==='failure') expect(()=>shift(op,m[3],BigInt(m[4]))).toThrow();
      else expect(shift(op,m[3],BigInt(m[4]))).toBe(m[5]);
    }
  }
  for(const m of section.matchAll(/daysBetween\(([^,]+), ([^)]+)\) = (-?\d+)/g)) {
    const [y1,o1]=parse(m[1]),[y2,o2]=parse(m[2]);
    expect(start(y2)-start(y1)+BigInt(o2-o1)).toBe(BigInt(m[3]));
  }
});
