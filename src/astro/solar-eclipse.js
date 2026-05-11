// 日食計算：快速搜索、貝塞爾元素引擎、局部觀測、全域批量。
//
// solarEclipseBesselian（原 ysPL）：原註解標「月食快速計算器」，但內部 22 個方法皆為日食邏輯
//   （貝塞爾元素 bse2cd／bse2db、影軸-貝塞爾交線、南北界 nanbei、界線 jieX 等）。新版以實際內容命名。
// solarEclipseLocal（原 rsGS）：局部日食（站心觀測，secXY 求視位置、secMax 求食甚）。
// solarEclipseBatch（原 rsPL）：全域日食批量計算（含 nbj 南北界）。

import {
  RAD_TO_ARCSEC,
  RAD_TO_DEG,
  TWO_PI,
  HALF_PI,
  AU_KM,
  J2000,
  EARTH_EQUATORIAL_RADIUS_KM,
  EARTH_MEAN_RADIUS_KM,
  EARTH_POLAR_EQ_RATIO,
  EARTH_POLAR_EQ_RATIO_SQ,
  MOON_EARTH_RATIO_PENUMBRA,
  MOON_EARTH_RATIO_UMBRA,
  SUN_EARTH_RATIO,
  MOON_RADIUS_FACTOR_PENUMBRA,
  MOON_RADIUS_FACTOR_UMBRA,
  SUN_RADIUS_ARCSEC,
  SOLAR_PARALLAX,
  SIN_SOLAR_PARALLAX,
  SPEED_OF_LIGHT_KM_S,
  LIGHT_TIME_PER_AU_JCY,
} from './constants.js';
import {
  normalizeAngle,
  normalizeAngleSigned,
  balancedMod,
  sphericalToCartesian,
  cartesianToSpherical,
  rotateSpherical,
  equatorialToHorizon,
  angularSeparation,
  heliocentricToGeocentric,
  parallacticAngle,
} from './math-utils.js';
import { formatRadianFull, formatRadian, formatRadianToMinute, formatArcSeconds, parseAngleToRadian } from './angle-format.js';
import { deltaT } from './delta-t.js';
import { gregorianToJD, jdToGregorian, formatJD, formatTimeOfDay } from './julian-day.js';
import { meanObliquityP03, precessionQuantity, equatorialJ2000ToDate, equatorialDateToJ2000, eclipticJ2000ToDate, eclipticDateToJ2000 } from './precession.js';
import { nutation, applyEquatorialNutation, nutationMedium, nutationLongitudeMedium } from './nutation.js';
import { refractionFromTrueAltitude, refractionFromApparentAltitude, applyParallax } from './corrections.js';
import { evalVSOP87, planetCoord, earthCoord } from './vsop87.js';
import { evalELPMoon, moonCoord } from './elp-moon.js';
import { sunLongitudeAberration, sunLatitudeAberration, moonLongitudeAberration, moonLatitudeAberration } from './aberration.js';
import { meanSiderealTimeFromUT, meanSiderealTimeFromTD, equationOfTime, equationOfTimeFast } from './sidereal-time.js';
import {
  earthLongitude,
  moonLongitude,
  earthAngularVelocity,
  moonAngularVelocity,
  moonSunApparentLongDiff,
  sunApparentLongitude,
  earthLongitudeToTime,
  moonLongitudeToTime,
  moonSunDiffToTime,
  sunApparentLongToTime,
  moonSunDiffToTimeFaster,
  sunApparentLongToTimeFaster,
  moonIlluminatedFraction,
  moonAngularRadius,
  moonPerigeeApogee,
  moonNode,
  earthPerihelionAphelion,
  newMoonOrdinal,
  findSunRiseOrSet,
} from './ephemeris.js';
import { lineEllipsoidIntersect, lineEarthIntersectBessel, lineEarthIntersect, ellipseCircleIntersect, lineEllipseIntersect } from './eclipse-geometry.js';

// ===== fastSolarEclipseSearch（原 ecFast）=====

export function fastSolarEclipseSearch(jd){ // 快速日食搜索, jd為朔時間(J2000起算的儒略日數, 不必很精確)
 var re=new Object();
 var t, t2, t3, t4;
 var L, mB, mR, sR, vL, vB, vR;
 var W = Math.floor((jd+8)/29.5306)*Math.PI*2; // 合朔時的日月黃經差

 // 合朔時間計算, 2000前+-4000年誤差1小時以內，+-2000年小于10分鐘
 t  = ( W + 1.08472 )/7771.37714500204; // 平朔時間
 re.jd = re.jdSuo = t*36525;

 t2=t*t, t3=t2*t, t4=t3*t;
 L = ( 93.2720993+483202.0175273*t-0.0034029*t2-t3/3526000+t4/863310000 )/180*Math.PI;
 re.ac=1, re.lx='N';
 if(Math.abs(Math.sin(L))>0.4) return re; // 一般大于21度已不可能

 t -= ( -0.0000331*t*t + 0.10976 *Math.cos( 0.785 + 8328.6914*t) )/7771;
 t2=t*t;
 L = -1.084719 +7771.377145013*t -0.0000331*t2 +
 (22640 * Math.cos(0.785+  8328.6914*t +0.000152*t2)
  +4586 * Math.cos(0.19 +  7214.063*t  -0.000218*t2)
  +2370 * Math.cos(2.54 + 15542.754*t  -0.000070*t2)
  + 769 * Math.cos(3.1  + 16657.383*t)
  + 666 * Math.cos(1.5  +   628.302*t)
  + 412 * Math.cos(4.8  + 16866.93*t)
  + 212 * Math.cos(4.1    -1114.63*t)
  + 205 * Math.cos(0.2  +  6585.76*t)
  + 192 * Math.cos(4.9  + 23871.45*t)
  + 165 * Math.cos(2.6  + 14914.45*t)
  + 147 * Math.cos(5.5    -7700.39*t)
  + 125 * Math.cos(0.5  +  7771.38*t)
  + 109 * Math.cos(3.9  +  8956.99*t)
  +  55 * Math.cos(5.6    -1324.18*t)
  +  45 * Math.cos(0.9  + 25195.62*t)
  +  40 * Math.cos(3.8    -8538.24*t)
  +  38 * Math.cos(4.3  + 22756.82*t)
  +  36 * Math.cos(5.5  + 24986.07*t)
  -6893 * Math.cos(4.669257+628.3076*t)
  -  72 * Math.cos(4.6261 +1256.62*t)
  -  43 * Math.cos(2.67823 +628.31*t)*t
  +  21) / RAD_TO_ARCSEC;
 t += ( W - L ) / ( 7771.38
  - 914 * Math.sin( 0.7848 + 8328.691425*t + 0.0001523*t2 )
  - 179 * Math.sin( 2.543  +15542.7543*t )
  - 160 * Math.sin( 0.1874 + 7214.0629*t ) );
 re.jd = re.jdSuo = jd = t*36525; // 朔時刻

 // 緯 52, 15 (角秒)
 t2=t*t/10000, t3=t2*t/10000;
 mB=
  18461*Math.cos(0.0571+  8433.46616*t   -0.640*t2    -1*t3)
 + 1010*Math.cos(2.413 + 16762.1576 *t +  0.88 *t2 +  25*t3)
 + 1000*Math.cos(5.440    -104.7747 *t +  2.16 *t2 +  26*t3)
 +  624*Math.cos(0.915 +  7109.2881 *t +  0    *t2 +   7*t3)
 +  199*Math.cos(1.82  + 15647.529  *t   -2.8  *t2   -19*t3)
 +  167*Math.cos(4.84    -1219.403  *t   -1.5  *t2   -18*t3)
 +  117*Math.cos(4.17  + 23976.220  *t   -1.3  *t2 +   6*t3)
 +   62*Math.cos(4.8   + 25090.849  *t +  2    *t2 +  50*t3)
 +   33*Math.cos(3.3   + 15437.980  *t +  2    *t2 +  32*t3)
 +   32*Math.cos(1.5   +  8223.917  *t +  4    *t2 +  51*t3)
 +   30*Math.cos(1.0   +  6480.986  *t +  0    *t2 +   7*t3)
 +   16*Math.cos(2.5     -9548.095  *t   -3    *t2   -43*t3)
 +   15*Math.cos(0.2   + 32304.912  *t +  0    *t2 +  31*t3)
 +   12*Math.cos(4.0   +  7737.590  *t)
 +    9*Math.cos(1.9   + 15019.227  *t)
 +    8*Math.cos(5.4   +  8399.709  *t)
 +    8*Math.cos(4.2   + 23347.918  *t)
 +    7*Math.cos(4.9     -1847.705  *t)
 +    7*Math.cos(3.8    -16133.856  *t)
 +    7*Math.cos(2.7   + 14323.351  *t);
 mB/=RAD_TO_ARCSEC;

 // 距 106, 23 (千米)
 mR = 385001
 +20905*Math.cos(5.4971+  8328.691425*t+  1.52 *t2 +  25*t3)
 + 3699*Math.cos(4.900 +  7214.06287*t   -2.18 *t2   -19*t3)
 + 2956*Math.cos(0.972 + 15542.75429*t   -0.66 *t2 +   6*t3)
 +  570*Math.cos(1.57  + 16657.3828 *t +  3.0  *t2 +  50*t3)
 +  246*Math.cos(5.69    -1114.6286 *t   -3.7  *t2   -44*t3)
 +  205*Math.cos(1.02  + 14914.4523 *t   -1    *t2 +   6*t3)
 +  171*Math.cos(3.33  + 23871.4457 *t +  1    *t2 +  31*t3)
 +  152*Math.cos(4.94  +  6585.761  *t   -2    *t2   -19*t3)
 +  130*Math.cos(0.74    -7700.389  *t   -2    *t2   -25*t3)
 +  109*Math.cos(5.20  +  7771.377  *t)
 +  105*Math.cos(2.31  +  8956.993  *t +  1    *t2 +  25*t3)
 +   80*Math.cos(5.38    -8538.241  *t +  2.8  *t2 +  26*t3)
 +   49*Math.cos(6.24  +   628.302  *t)
 +   35*Math.cos(2.7   + 22756.817  *t   -3    *t2   -13*t3)
 +   31*Math.cos(4.1   + 16171.056  *t   -1    *t2 +   6*t3)
 +   24*Math.cos(1.7   +  7842.365  *t   -2    *t2   -19*t3)
 +   23*Math.cos(3.9   + 24986.074  *t +  5    *t2 +  75*t3)
 +   22*Math.cos(0.4   + 14428.126  *t   -4    *t2   -38*t3)
 +   17*Math.cos(2.0   +  8399.679  *t);
 mR/=6378.1366;

 t=jd/365250, t2=t*t, t3=t2*t;
 // 誤0.0002AU
 sR = 10001399 // 日地距離
 +167070*Math.cos(3.098464 +  6283.07585*t)
 +  1396*Math.cos(3.0552   + 12566.1517 *t)
 + 10302*Math.cos(1.10749  +  6283.07585*t)*t
 +   172*Math.cos(1.064    + 12566.152  *t)*t
 +   436*Math.cos(5.785    +  6283.076  *t)*t2
 +    14*Math.cos(4.27     +  6283.08   *t)*t3;
 sR*=1.49597870691/6378.1366*10;

 // 經緯速度
 t=jd/36525;
 vL = 7771 // 月日黃經差速度
     -914*Math.sin(0.785 + 8328.6914*t)
     -179*Math.sin(2.543 +15542.7543*t)
     -160*Math.sin(0.187 + 7214.0629*t);
 vB =-755*Math.sin(0.057 + 8433.4662*t) // 月亮黃緯速度
     - 82*Math.sin(2.413 +16762.1576*t);
 vR =-27299*Math.sin(5.497 + 8328.691425*t)
     - 4184*Math.sin(4.900 + 7214.06287*t)
     - 7204*Math.sin(0.972 +15542.75429*t);
 vL/=36525, vB/=36525, vR/=36525; // 每日速度


 var gm = mR*Math.sin(mB)*vL/Math.sqrt(vB*vB+vL*vL), smR=sR-mR; // gm伽馬值, smR日月距
 var mk = 0.2725076, sk = 109.1222;
 var f1 = (sk+mk)/smR, r1 = mk+f1*mR; // tanf1半影錐角, r1半影半徑
 var f2 = (sk-mk)/smR, r2 = mk-f2*mR; // tanf2本影錐角, r2本影半徑
 var b = 0.9972, Agm = Math.abs(gm), Ar2 = Math.abs(r2);
 var fh2 = mR-mk/f2, h = Agm<1 ? Math.sqrt(1-gm*gm) : 0; // fh2本影頂點的z坐標
 var ls1, ls2, ls3, ls4;

 if(fh2<h) re.lx = 'T';
 else      re.lx = 'A';

 ls1 = Agm-(b+r1 ); if(Math.abs(ls1)<0.016) re.ac=0; // 無食分界
 ls2 = Agm-(b+Ar2); if(Math.abs(ls2)<0.016) re.ac=0; // 偏食分界
 ls3 = Agm-(b    ); if(Math.abs(ls3)<0.016) re.ac=0; // 無中心食分界
 ls4 = Agm-(b-Ar2); if(Math.abs(ls4)<0.016) re.ac=0; // 有中心食分界(但本影未全部進入)

 if     (ls1>0) re.lx  = 'N'; // 無日食
 else if(ls2>0) re.lx  = 'P'; // 偏食
 else if(ls3>0) re.lx += '0'; // 無中心
 else if(ls4>0) re.lx += '1'; // 有中心(本影未全部進入)
 else{ // 本影全進入
  if(Math.abs(fh2-h)<0.019) re.ac=0;
  if( Math.abs(fh2)<h ){
    var dr = vR*h/vL/mR;
    var H1 = mR-dr-mk/f2;  // 入點影錐z坐標
    var H2 = mR+dr-mk/f2;  // 出點影錐z坐標
    if(H1>0) re.lx='H3';      // 環全全
    if(H2>0) re.lx='H2';      // 全全環
    if(H1>0&&H2>0) re.lx='H'; // 環全環
    if(Math.abs(H1)<0.019) re.ac=0;
    if(Math.abs(H2)<0.019) re.ac=0;
  }
 }
 return re;
}



// ===== solarEclipseBesselian（原 ysPL）=====

export const solarEclipseBesselian = { // 月食快速計算器
 lineT:function(G, v, u, r, n){// 已知t1時刻星體位置、速度，求x*x+y*y=r*r時, t的值
  var b=G.y*v-G.x*u, A=u*u+v*v, B=u*b, C=b*b-r*r*v*v, D=B*B-A*C;
  if(D<0) return 0;
  D=Math.sqrt(D); if(!n) D=-D;
  return G.t+((-B+D)/A-G.x)/v;
 },
 lecXY:function(jd, re){// 日月黃經緯差轉為日面中心直角坐標(用于月食)
  var T=jd/36525, zm=new Array(), zs=new Array();

  // =======太陽月亮黃道坐標========
  zs = earthCoord(T, -1, -1, -1);   // 地球坐標
  zs[0]  = normalizeAngle(zs[0]+Math.PI+sunLongitudeAberration(T));  zs[1]  =-zs[1] + sunLatitudeAberration(T); // 補上太陽光行差
  zm = moonCoord(T, -1, -1, -1); // 月球坐標
  zm[0]  = normalizeAngle( zm[0]+moonLongitudeAberration(T) );  zm[1] += moonLatitudeAberration(T);  // 補上月球光行差就可以了

  // =======視半徑=======
  re.e_mRad = MOON_RADIUS_FACTOR_PENUMBRA/zm[2]; // 月亮地心視半徑(角秒)
  re.eShadow = (EARTH_MEAN_RADIUS_KM/zm[2]*RAD_TO_ARCSEC-(959.63-8.794)/zs[2] )*51/50; // 地本影在月球向徑處的半徑(角秒), 式中51/50是大氣厚度補償
  re.eShadow2= (EARTH_MEAN_RADIUS_KM/zm[2]*RAD_TO_ARCSEC+(959.63+8.794)/zs[2] )*51/50; // 地半影在月球向徑處的半徑(角秒), 式中51/50是大氣厚度補償

  re.x = normalizeAngleSigned(zm[0]+Math.PI-zs[0]) * Math.cos((zm[1]-zs[1])/2);
  re.y = zm[1]+zs[1];
  re.mr= re.e_mRad/RAD_TO_ARCSEC,  re.er=re.eShadow/RAD_TO_ARCSEC, re.Er=re.eShadow2/RAD_TO_ARCSEC;
  re.t = jd;
 },
 lecMax:function(jd){ // 月食的食甚計算(jd為近朔的力學時, 誤差幾天不要緊)
  this.lT=new Array();
  for(var i=0;i<7;i++) this.lT[i]=0; // 分別是:食甚, 初虧, 複圓, 半影食始, 半影食終, 食既, 生光
  this.sf=0;
  this.LX='';

  jd = moonSunDiffToTimeFaster( Math.floor((jd-4)/29.5306)*Math.PI*2 +Math.PI)*36525; // 低精度的朔(誤差10分鐘), 與食甚相差10分鐘左右

  var g=new Object(), G=new Object(), u, v;

  // 求極值(平均誤差數秒)
  u = -18461 * Math.sin(0.057109+0.23089571958*jd)*0.23090/RAD_TO_ARCSEC; // 月日黃緯速度差
  v = (moonAngularVelocity(jd/36525)-earthAngularVelocity(jd/36525))/36525; // 月日黃經速度差
  this.lecXY(jd, G);
  jd -= (G.y*u+G.x*v)/(u*u+v*v); // 極值時間

  // 精密求極值
  var dt=60/86400;
  this.lecXY(jd, G); this.lecXY(jd+dt, g); // 精密差分得速度, 再求食甚
  u = (g.y-G.y)/dt;
  v = (g.x-G.x)/dt;
  dt= -(G.y*u+G.x*v)/(u*u+v*v); jd += dt; // 極值時間

  // 求直線到影子中心的最小值
  var x=G.x+dt*v, y=G.y+dt*u, rmin=Math.sqrt(x*x+y*y);
  // 注意, 以上計算得到了極值及最小距rmin, 但沒有再次計算極值時刻的半徑, 對以下的判斷造成一定的風險, 必要的話可以再算一次。不過必要性不很大，因為第一次極值計算已經很准確了, 誤差只有幾秒
  // 求月球與影子的位置關系
  if(rmin<=G.mr+G.er){ // 食計算
   this.lT[1] = jd; // 食甚
   this.LX = '偏';
   this.sf=(G.mr+G.er-rmin)/G.mr/2; // 食分

   this.lT[0] = this.lineT(G, v, u, G.mr+G.er, 0); // 初虧
   this.lecXY(this.lT[0], g);
   this.lT[0] = this.lineT(g, v, u, g.mr+g.er, 0); // 初虧再算一次

   this.lT[2] = this.lineT(G, v, u, G.mr+G.er, 1); // 複圓
   this.lecXY(this.lT[2], g);
   this.lT[2] = this.lineT(g, v, u, g.mr+g.er, 1); // 複圓再算一次
  }
  if(rmin<=G.mr+G.Er){ // 半影食計算
   this.lT[3] = this.lineT(G, v, u, G.mr+G.Er, 0); // 半影食始
   this.lecXY(this.lT[3], g);
   this.lT[3] = this.lineT(g, v, u, g.mr+g.Er, 0); // 半影食始再算一次

   this.lT[4] = this.lineT(G, v, u, G.mr+G.Er, 1); // 半影食終
   this.lecXY(this.lT[4], g);
   this.lT[4] = this.lineT(g, v, u, g.mr+g.Er, 1); // 半影食終再算一次
  }
  if(rmin<=G.er-G.mr){ // 全食計算
   this.LX = '全';
   this.lT[5] = this.lineT(G, v, u, G.er-G.mr, 0); // 食既
   this.lecXY(this.lT[5], g);
   this.lT[5] = this.lineT(g, v, u, g.er-g.mr, 0); // 食既再算一次

   this.lT[6] = this.lineT(G, v, u, G.er-G.mr, 1); // 生光
   this.lecXY(this.lT[6], g);
   this.lT[6] = this.lineT(g, v, u, g.er-g.mr, 1); // 生光再算一次
  }
 }
};
;

// ===== solarEclipseLocal（原 rsGS）=====

export const solarEclipseLocal = {
 Zs   : new Array(),  // 日月赤道坐標插值表
 Zdt  : 0.04,   // 插值點之間的時間間距
 Zjd  : 0,      // 插值表中心時間
 dT   : 0,      // deltatT
 tanf1: 0.0046, // 半影錐角
 tanf2: 0.0045, // 本影錐角
 srad : 0.0046, // 太陽視半徑
 bba  : 1,      // 貝圓極赤比
 bhc  : 0,      // 黃交線與赤交線的夾角簡易作圖用
 dyj  : 23500,  // 地月距
 
 init:function(jd, n){ // 創建插值表(根數表)
  if(newMoonOrdinal(jd)==newMoonOrdinal(this.Zjd) && this.Zs.length==n*9) return;
  this.Zs.length=0;
  this.Zjd  = jd = moonSunDiffToTimeFaster( newMoonOrdinal(jd)*Math.PI*2 )*36525; // 低精度的朔(誤差10分鐘)
  this.dT   = deltaT(jd); // deltat T

  var zd = nutationMedium(jd/36525); // 章動
  var E = meanObliquityP03(jd/36525)+zd[1]; // 黃赤交角

  var i, k, T, S, M, B, a=this.Zs;
  for(i=0;i<n;i++){ // 插值點範圍不要超過360度(約1個月)
   T=( this.Zjd + (i-n/2+0.5)*this.Zdt ) / 36525;

   if(n==7) S = earthCoord(T, -1, -1, -1), M = moonCoord(T, -1, -1, -1);    // 地球坐標及月球坐標, 全精度
   if(n==3) S = earthCoord(T, 65, 65, 65), M = moonCoord(T, -1, 150, 150);  // 中精度
   if(n==2) S = earthCoord(T, 20, 20, 20), M = moonCoord(T, 30, 30, 30);    // 低精度


   S[0] = S[0]+zd[0]+sunLongitudeAberration(T)+Math.PI;  S[1] = -S[1] + sunLatitudeAberration(T);  // 補上太陽光行差及章動
   M[0] = M[0]+zd[0]+moonLongitudeAberration(T);         M[1] =  M[1] + moonLatitudeAberration(T); // 補上月球光行差及章動
   S = rotateSpherical( S, E );  M = rotateSpherical( M, E ); S[2]*=AU_KM; // 轉為赤道坐標
   if(i && S[0]<a[0]) S[0]+=TWO_PI;  // 確保插值數據連續
   if(i && M[0]<a[3]) M[0]+=TWO_PI;  // 確保插值數據連續

   k = i*9;
   a[k+0]=S[0], a[k+1]=S[1], a[k+2]=S[2]; // 存入插值表
   a[k+3]=M[0], a[k+4]=M[1], a[k+5]=M[2];


   // 貝塞爾坐標的z軸坐標計算, 得到a[k+6, 7, 8]交點赤經, 貝赤交角, 真恆星時
   S=sphericalToCartesian(S), M=sphericalToCartesian(M);
   B = cartesianToSpherical( new Array(S[0]-M[0], S[1]-M[1], S[2]-M[2]) );
   B[0] = Math.PI/2+B[0];
   B[1] = Math.PI/2-B[1];
   if(i && B[0]<a[6]) B[0]+=TWO_PI; // 確保插值數據連續

   a[k+6]=B[0], a[k+7]=B[1], a[k+8]=meanSiderealTimeFromUT(T*36525-this.dT, this.dT)+zd[0]*Math.cos(E); // 真恆星時
  }
  // 一些輔助參數的計算
  var p=a.length-9;
  this.dyj = (a[2]+a[p+2]-a[5]-a[p+5])/2/EARTH_EQUATORIAL_RADIUS_KM; // 地月平均距離
  this.tanf1 = (SUN_EARTH_RATIO+MOON_EARTH_RATIO_PENUMBRA )/this.dyj; // tanf1半影錐角
  this.tanf2 = (SUN_EARTH_RATIO-MOON_EARTH_RATIO_UMBRA)/this.dyj; // tanf2本影錐角
  this.srad = SUN_EARTH_RATIO/((a[2]+a[p+2])/2/EARTH_EQUATORIAL_RADIUS_KM);
  this.bba = Math.sin( (a[1]+a[p+1])/2 );
  this.bba = EARTH_POLAR_EQ_RATIO*(1+(1-EARTH_POLAR_EQ_RATIO_SQ)*this.bba*this.bba/2);
  this.bhc = -Math.atan(Math.tan(E)*Math.sin( (a[6]+a[p+6])/2 )); // 黃交線與赤交線的夾角

 },

 chazhi:function(jd, xt){// 日月坐標快速計算(貝賽爾插值法), 計算第p個根數開始的m個根數
  var p=xt*3, m=3; // 計算第p個根數開始的m個根數
  var i, N=this.Zs.length/9, B=this.Zs, z=new Array();
  var w = B.length/N; // 每節點個數
  var t = (jd-this.Zjd)/this.Zdt+N/2-0.5; // 相對于第一點的時間距離

  if(N==2) { for(i=0; i<m; i++, p++) z[i] = B[p] + (B[p+w]-B[p])*t; return z; }
  var c=Math.floor(t+0.5); if(c<=0) c=1; if(c>N-2) c=N-2; // 確定c, 並對超出範圍的處理
  t-=c, p+=c*w; // c插值中心, t為插值因子, t再轉為插值中心在數據中的位置
  for(i=0; i<m; i++, p++)
    z[i] = B[p] + ( B[p+w]-B[p-w] + (B[p+w]+B[p-w]-B[p]*2)*t ) * t/2;
  return z;
 },

 sun :function(jd){ return this.chazhi(jd, 0); }, // 傳回值可能超過360度
 moon:function(jd){ return this.chazhi(jd, 1); },
 bse :function(jd){ return this.chazhi(jd, 2); },

 cd2bse:function(z, I){ // 赤道轉貝塞爾坐標
  var r=new Array(z[0]-I[0], z[1], z[2]);
  r = rotateSpherical(r, -I[1]);
  return sphericalToCartesian(r);
 },
 bse2cd:function(z, I){ // 貝塞爾轉赤道坐標
  var r = cartesianToSpherical(z);
  r = rotateSpherical(r, I[1]);
  r[0] = normalizeAngle(r[0]+I[0]);
  return r;
 },
 bse2db:function(z, I, f){ // 貝賽爾轉地標(p點到原點連線與地球的交點, z為p點直角坐標), f=1時把地球看成橢球
  var r = cartesianToSpherical(z);
  r = rotateSpherical(r, I[1]);
  r[0] = normalizeAngleSigned(r[0]+I[0]-I[2]);
  if(f) r[1] = Math.atan( Math.tan(r[1])/EARTH_POLAR_EQ_RATIO_SQ );
  return r;
 },
 bseXY2db:function(x, y, I, f){ // 貝賽爾轉地標(過p點垂直于基面的線與地球的交點, p坐標為(x, y, 任意z)), f=1時把地球看成橢球
  var b=f?EARTH_POLAR_EQ_RATIO:1;
  var F = lineEarthIntersectBessel(x, y, 2,  x, y, 0,  b, 1, I);// 求中心對應的地標
  return [F.J, F.W];
 },

 bseM:function(jd){  // 月亮的貝塞爾坐標
   var a=this.cd2bse(this.chazhi(jd, 1), this.chazhi(jd, 2));
   a[0]/=EARTH_EQUATORIAL_RADIUS_KM, a[1]/=EARTH_EQUATORIAL_RADIUS_KM, a[2]/=EARTH_EQUATORIAL_RADIUS_KM;
   return a;
 },

 // 以下計算日食總體情況

 Vxy:function(x, y, s, vx, vy){ // 地球上一點的速度，用貝塞爾坐標表達，s為貝赤交角
   var r = new Object();
   var h = 1-x*x-y*y;
   if(h<0) h = 0;  // 越界置0，使速度場連續，置零有助于迭代時單向收斂
   else    h = Math.sqrt(h);
   r.vx = TWO_PI*( Math.sin(s)*h-Math.cos(s)*y );
   r.vy = TWO_PI*x*Math.cos(s);
   r.Vx = vx - r.vx;
   r.Vy = vy - r.vy;
   r.V = Math.sqrt(r.Vx*r.Vx+r.Vy*r.Vy);
   return r;
 },
 rSM:function(mR){ // rm, rs單位千米
  var re = new Object();
  re.r1 = MOON_EARTH_RATIO_PENUMBRA +this.tanf1*mR; // 半影半徑
  re.r2 = MOON_EARTH_RATIO_UMBRA-this.tanf2*mR; // 本影半徑
  re.ar2 = Math.abs(re.r2);
  re.sf = MOON_EARTH_RATIO_UMBRA/mR/SUN_EARTH_RATIO*(this.dyj+mR); // 食分
  return re;
 },
 qrd:function(jd, dx, dy, fs){ // 求切入點
  var ba2 = this.bba*this.bba;
  var M = this.bseM(jd), x=M[0], y=M[1];
  var B = this.rSM(M[2]);
  var r = 0; if(fs==1) r = B.r1;
  var d = 1-(1/ba2-1)*y*y/(x*x+y*y)/2 + r;
  var t = (d*d-x*x-y*y)/(dx*x+dy*y)/2;
  x+=t*dx, y+=t*dy, jd+=t;

  var c=(1-ba2)*r*x*y/d/d/d;
  x += c*y;
  y -= c*x;
  var re=this.bse2db([x/d, y/d, 0], this.bse(jd), 1);
  // re[0] +=0.275/RAD_TO_DEG; //轉為deltatT為66秒的曆書經度
  re[2]=jd;
  return re;
 },
 feature:function(jd){// 日食的基本特征
  jd = this.Zjd; // 低精度的朔(誤差10分鐘)

  var tg=0.04, jd1=jd-tg/2, re=new Object(), ls;



  var tg=0.04, re=new Object(), ls;
  var a = this.bseM(jd-tg);
  var b = this.bseM(jd);
  var c = this.bseM(jd+tg);
  var vx = (c[0]-a[0])/tg/2;
  var vy = (c[1]-a[1])/tg/2;
  var vz = (c[2]-a[2])/tg/2;
  var ax = (c[0]+a[0]-2*b[0])/tg/tg;
  var ay = (c[1]+a[1]-2*b[1])/tg/tg;
  var v = Math.sqrt(vx*vx+vy*vy), v2=v*v;

  // 影軸在貝塞爾面掃線的特征參數
  re.jdSuo = jd;    // 朔
  re.dT = this.dT;  // deltat T
  re.ds = this.bhc; // 黃交線與赤交線的夾角
  re.vx = vx;       // 影速x
  re.vy = vy;       // 影速y
  re.ax = ax;
  re.ay = ay;
  re.v  = v;
  re.k  = vy/vx;    // 斜率

  var t0 = -(b[0]*vx+b[1]*vy)/v2;
  re.jd = jd+t0;  // 中點時間
  re.xc = b[0]+vx*t0;  // 中點坐標x
  re.yc = b[1]+vy*t0;  // 中點坐標y
  re.zc = b[2]+vz*t0-1.37*t0*t0;  // 中點坐標z
  re.D  = (vx*b[1]-vy*b[0])/v;
  re.d  = Math.abs(re.D);  // 直線到圓心的距離
  re.I  = this.bse(re.jd); // 中心點的貝塞爾z軸的赤道坐標及恆星時，(J, W, g)

  // 影軸交點判斷
  var F = lineEarthIntersectBessel(re.xc, re.yc, 2,  re.xc, re.yc, 0,  EARTH_POLAR_EQ_RATIO, 1, re.I);// 求中心對應的地標
  // 四個關鍵點的影子半徑計算
  var Bc, Bp, B2, B3,  dt, t2, t3, t4, t5, t6;
  Bc=Bp=B2=B3 = this.rSM(re.zc); // 中點處的影子半徑
  if(F.W!=100)  Bp = this.rSM(re.zc - F.R2);
  if(re.d<1){
    dt=Math.sqrt(1-re.d*re.d)/v;  t2=t0-dt, t3=t0+dt; // 中心始終參數
    B2 = this.rSM(t2*vz+b[2]-1.37*t2*t2);   // 中心線始影半徑
    B3 = this.rSM(t3*vz+b[2]-1.37*t3*t3);   // 中心線終影半徑
  }
  ls = 1;        dt=0; if(re.d<ls) dt=Math.sqrt(ls*ls-re.d*re.d)/v; t2=t0-dt, t3=t0+dt; // 偏食始終參數, t2, t3
  ls = 1+Bc.r1;  dt=0; if(re.d<ls) dt=Math.sqrt(ls*ls-re.d*re.d)/v; t4=t0-dt, t5=t0+dt; // 偏食始終參數, t4, t5
  t6 = -b[0]/vx; // 視午參數l6
  if(re.d<1){
   re.gk1 = this.qrd(t2+jd, vx, vy, 0); // 中心始
   re.gk2 = this.qrd(t3+jd, vx, vy, 0); // 中心終
  }else{
   re.gk1 = [0, 0, 0];
   re.gk2 = [0, 0, 0];
  }
  re.gk3 = this.qrd(t4+jd, vx, vy, 1); // 偏食始
  re.gk4 = this.qrd(t5+jd, vx, vy, 1); // 偏食終
  re.gk5 = this.bseXY2db(t6*vx+b[0], t6*vy+b[1], this.bse(t6+jd), 1);  re.gk5[2]=t6+jd; // 地方視午日食

  // 日食類型、最大食地標、食分、太陽地平坐標
  if(F.W==100){ // 無中心線
   // 最大食地標及時分
   ls = this.bse2db([re.xc, re.yc, 0], re.I, 0); re.zxJ=ls[0], re.zxW=ls[1]; // 最大食地標
   re.sf = (Bc.r1-(re.d-0.9972))/(Bc.r1-Bc.r2); // 0.9969是南北極區的平半徑
   // 類型判斷
   if     (re.d>0.9972+Bc.r1)  { re.lx = 'N'; } // 無食, 半影沒有進入
   else if(re.d>0.9972+Bc.ar2) { re.lx = 'P'; } // 偏食, 本影沒有進入
   else                        { if(Bc.sf<1) re.lx = 'A0'; else re.lx = 'T0'; } // 中心線未進入, 本影部分進入(無中心，所以只是部分地入)
  }else{ // 有中心線
   // 最大食地標及時分
   re.zxJ=F.J, re.zxW=F.W;  // 最大食地標
   re.sf = Bp.sf; // 食分
   // 類型判斷
   if(re.d>0.9966-Bp.ar2) { if(Bp.sf<1) re.lx = 'A1'; else re.lx = 'T1'; } // 中心進入, 但本影沒有完全進入
   else{ // 本影全進入有中心日食
    if(Bp.sf>=1){
      re.lx = 'H';
      if(B2.sf>1) re.lx = 'H2'; // 全環食, 全始
      if(B3.sf>1) re.lx = 'H3'; // 全環食, 全終
      if(B2.sf>1 && B3.sf>1) re.lx='T'; // 全食
    } else re.lx = 'A'; // 環食
   }
  }
  re.Sdp = equatorialToHorizon(this.sun(re.jd), re.zxJ, re.zxW, re.I[2]);  // 太陽在中心點的地平坐標

  // 食帶寬度和時延
  if(F.W!=100){
    re.dw = Math.abs(2*Bp.r2*EARTH_EQUATORIAL_RADIUS_KM) / Math.sin(re.Sdp[1]); // 食帶寬度
    ls = this.Vxy(re.xc, re.yc, re.I[1], re.vx, re.vy); // 求地表影速
    re.tt = 2*Math.abs(Bp.r2)/ls.V; // 時延
  } else re.dw = re.tt =0;
  return re;
 },

 // 界線圖
 push:function(z, p){ p[p.length]=z[0], p[p.length]=z[1]; }, // 經度改為东經為正, 所以有個負號
 elmCpy:function(a, n, b, m){ // 數據元素複制
   if(!b.length) return;
   if(n==-2) n=a.length;
   if(m==-2) m=b.length;
   if(n==-1) n=a.length-2;
   if(m==-1) m=b.length-2;
   a[n]=b[m], a[n+1]=b[m+1];
 },
 nanbei:function(M, vx0, vy0, h, r, I){ // vx0, vy0為影足速度(也是整個影子速度), h=1計算北界, h=-1計算南界
   var x=M[0]-vy0/vx0*r*h, y=M[1]+h*r, z, i;
   var vx, vy, v, sinA, cosA, js=0;
   for(i=0;i<3;i++){
    z = 1 - x*x - y*y;
    if(z<0) { if(js) break;  z=0;js++; } // z小于0則置0，如果两次小于0，可能不收斂造成的，故不再迭代了
    z = Math.sqrt(z);
    x -= (x-M[0])*z/M[2];
    y -= (y-M[1])*z/M[2];
    vx = vx0 - TWO_PI*( Math.sin(I[1])*z-Math.cos(I[1])*y );
    vy = vy0 - TWO_PI*  Math.cos(I[1])*x;
    v  = Math.sqrt(vx*vx+vy*vy);
    sinA = h*vy/v, cosA = h*vx/v;
    x = M[0] - r*sinA, y = M[1] + r*cosA;
   }
   var X = M[0] - MOON_EARTH_RATIO_PENUMBRA*sinA, Y = M[1] + MOON_EARTH_RATIO_PENUMBRA*cosA;
   var p = lineEarthIntersectBessel(X, Y, M[2],  x, y, 0,  EARTH_POLAR_EQ_RATIO, 1, I);
   return [p.J, p.W, x, y];
 },

 mQie:function(M, vx0, vy0, h, r, I, A){ // vx0, vy0為影足速度(也是整個影子速度), h=1計算北界, h=-1計算南界
   var p=this.nanbei(M, vx0, vy0, h, r, I);
   if(!A.f2) A.f2=0;   A.f = p[1]==100?0:1; // 記錄有無解
   if(A.f2!=A.f){ // 補線頭線尾
     var g=lineEllipseIntersect(p[2], p[3], vx0, vy0, 1, this.bba), dj, F;
     if(g.n){
      if(A.f) dj=g.R2, F=g.B;
      else    dj=g.R1, F=g.A;
      F[2]=0;
      var I2 = new Array( I[0], I[1], I[2] - dj/Math.sqrt(vx0*vx0+vy0*vy0)*6.28 );  // 也可以不重算計算恆星時，直接用I[2]代替，但線頭不會嚴格落在日出日沒食甚線上
      this.push( this.bse2db(F, I2, 1), A);// 有解補線頭
     }
   }
   A.f2 = A.f; // 記錄上次有無解

   if(p[1]!=100) this.push(p, A);
 },
 mDian:function(M, vx0, vy0, AB, r, I, A){ // 日出日沒食甚
   var i, p, a=M, R, c=new Object();
   for(i=0;i<2;i++){ // 迭代求交點
     c = this.Vxy(a[0], a[1], I[1], vx0, vy0);
     p = lineEllipseIntersect(M[0], M[1], c.Vy, -c.Vx, 1, this.bba);
     if(!p.n) break;
     if(AB) a=p.A, R=p.R1;
     else   a=p.B, R=p.R2;
   }
   if(p.n && R<=r){ // 有交點
     a=this.bse2db([a[0], a[1], 0], I, 1); // 轉為地標
     this.push(a, A ); // 保存第一食甚線A或B根
     return 1;
   }
   return 0;
 },
 jieX:function(jd){ // 日出日沒的初虧食甚複圓線，南北界線等
  var i, p, ls;
  var re=this.feature(jd);  // 求特征參數

  re.p1=new Array(), re.p2=new Array(), re.p3=new Array(), re.p4=new Array();
  re.q1=new Array(), re.q2=new Array(), re.q3=new Array(), re.q4=new Array();
  re.L1=new Array(), re.L2=new Array(), re.L3=new Array(), re.L4=new Array();
  re.L5=new Array(), re.L6=new Array(); // 0.5食分線
  re.L0=new Array(); // 中心線

  var T = 1.7*1.7-re.d*re.d; if(T<0) T=0; T=Math.sqrt(T)/re.v+0.01;
  var t=re.jd-T, N=400, dt=2*T/N;

  var n1=0, n4=0; // n1切入時序

  // 對日出日沒食甚線預置一個點
  var Ua=re.q1, Ub=re.q2;
  this.push([0, 0], re.q2); this.push([0, 0], re.q3); this.push([0, 0], re.q4);

  for(i=0;i<=N;i++, t+=dt){
   var vx = re.vx+re.ax*(t-re.jdSuo);
   var vy = re.vy+re.ay*(t-re.jdSuo);
   var M = this.bseM(t);    // 此刻月亮貝塞爾坐標(其x和y正是影足)
   var B = this.rSM(M[2]);  // 本半影等
   var r = B.r1;            // 半影半徑
   var I = this.bse(t);     // 貝塞爾坐標參數

   p=ellipseCircleIntersect(1, this.bba, r, M[0], M[1]); // 求橢圓與圓交點
   if(n1%2) {if(!p.n) n1++;} else {if(p.n) n1++;}
   if(p.n) { // 有交點
    p.A[2]=p.B[2]=0;  p.A=this.bse2db(p.A, I, 1);  p.B=this.bse2db(p.B, I, 1); // 轉為地標
    if(n1==1){ this.push(p.A, re.p1); this.push(p.B, re.p2); }// 保存第一虧圓界線
    if(n1==3){ this.push(p.A, re.p3); this.push(p.B, re.p4); }// 保存第二虧圓界線
   }

   // 日出日沒食甚線
   if( !this.mDian(M, vx, vy, 0, r, I, Ua) ) { if(Ua.length>0) Ua=re.q3; };
   if( !this.mDian(M, vx, vy, 1, r, I, Ub) ) { if(Ub.length>2) Ub=re.q4; };
   if(t>re.jd){
     if(Ua.length==0) Ua=re.q3;
     if(Ub.length==2) Ub=re.q4;
   }

   // 求中心線
   p = this.bseXY2db(M[0], M[1], I, 1);
   if( p[1]!=100&&n4==0 || p[1]==100&&n4==1 ){ // 從無交點跳到有交點或反之
     ls=lineEllipseIntersect(M[0], M[1], vx, vy, 1, this.bba);
     var dj;
     if(n4==0) dj=ls.R2, ls=ls.B; // 首坐標
     else      dj=ls.R1, ls=ls.A; // 末坐標
     ls[2]=0;
     var I2 = new Array( I[0], I[1], I[2] - dj/Math.sqrt(vx*vx+vy*vy)*6.28 );  // 也可以不重算計算恆星時，直接用I[2]代替，但線頭不會嚴格落在日出日沒食甚線上
     this.push( this.bse2db(ls, I2, 1), re.L0 );
     n4++;
   }
   if(p[1]!=100) this.push(p, re.L0); // 保存中心線

   // 南北界
   this.mQie(M, vx, vy, +1, r,          I, re.L1); // 半影北界
   this.mQie(M, vx, vy, -1, r,          I, re.L2); // 半影南界
   this.mQie(M, vx, vy, +1, B.r2,       I, re.L3); // 本影北界
   this.mQie(M, vx, vy, -1, B.r2,       I, re.L4); // 本影南界
   this.mQie(M, vx, vy, +1, (r+B.r2)/2, I, re.L5); // 0.5半影北界
   this.mQie(M, vx, vy, -1, (r+B.r2)/2, I, re.L6); // 0.5半影南界
  }


  // 日出日沒食甚線的線頭連接
  this.elmCpy(re.q3, 0, re.q1, -1); // 連接q1和a3, 單邊界必須
  this.elmCpy(re.q4, 0, re.q2, -1); // 連接q2和a4, 單邊界必須

  this.elmCpy(re.q1, -2, re.L1, 0); // 半影北界線西端
  this.elmCpy(re.q2, -2, re.L2, 0); // 半影南界線西端
  this.elmCpy(re.q3, 0, re.L1, -1); // 半影北界線东端
  this.elmCpy(re.q4, 0, re.L2, -1); // 半影南界線东端

  this.elmCpy(re.q2, 0, re.q1, 0);
  this.elmCpy(re.q3, -2, re.q4, -1);

  return re;
 },
 jieX2:function (jd){ // jd力學時
  var re=new Object();
  var p1=new Array(), p2=new Array(), p3=new Array();

  if(Math.abs(jd-this.Zjd)>0.5) return re;

  var i, s, p, x, y, X, Y;
  var S = this.sun(jd);   // 此刻太陽赤道坐標
  var M = this.bseM(jd);  // 此刻月亮
  var B = this.rSM(M[2]); // 本半影等
  var I = this.bse(jd);   // 貝塞爾坐標參數
  var Z = M[2];           // 月亮的坐標的z量

  var a0=M[0]*M[0]+M[1]*M[1];
  var a1=a0-B.r2*B.r2;
  var a2=a0-B.r1*B.r1;
  var N = 200;
  for(i=0;i<N;i++){// 第0和第N點是同一點，可形成一個環，但不必計算，因為第0點可能在界外而無效
    s=i/N*TWO_PI;
    var cosS=Math.cos(s), sinS=Math.sin(s);
    X = M[0] + MOON_EARTH_RATIO_PENUMBRA*cosS, Y = M[1] + MOON_EARTH_RATIO_PENUMBRA*sinS;
    // 本影
    x = M[0] + B.r2*cosS, y = M[1] + B.r2*sinS;
    p = lineEarthIntersectBessel(X, Y, Z,  x, y, 0,  EARTH_POLAR_EQ_RATIO, 1, I);
    if(p.W!=100) this.push( [p.J, p.W], p1 );
    else { if(Math.sqrt(x*x+y*y)>a1) this.push( this.bse2db([x, y, 0], I, 1), p1 ); }
    // 半影
    x = M[0] + B.r1*cosS, y = M[1] + B.r1*sinS;
    p = lineEarthIntersectBessel(X, Y, Z,  x, y, 0,  EARTH_POLAR_EQ_RATIO, 1, I);
    if(p.W!=100) this.push( [p.J, p.W], p2 );
    else { if(Math.sqrt(x*x+y*y)>a2) this.push( this.bse2db([x, y, 0], I, 1), p2 ); }
    // 晨昏圈
    p = rotateSpherical([s, 0, 0], HALF_PI-S[1]);
    p[0] = normalizeAngleSigned( p[0]+S[0]+HALF_PI-I[2] );
    this.push(p, p3);
  }
  p1[p1.length]=p1[0], p1[p1.length]=p1[1];
  p2[p2.length]=p2[0], p2[p2.length]=p2[1];
  p3[p3.length]=p3[0], p3[p3.length]=p3[1];

  re.p1=p1, re.p2=p2, re.p3=p3;
  return re;
 },
 jieX3:function(jd){ // 界線表
  var i, k, p, ls;
  var re=this.feature(jd);  // 求特征參數

  var t = Math.floor(re.jd*1440)/1440 -3/24;
  var N=360, dt=1/1440, s='', s2;

  for(i=0;i<N;i++, t+=dt){
   var vx = re.vx+re.ax*(t-re.jdSuo);
   var vy = re.vy+re.ay*(t-re.jdSuo);
   var M = this.bseM(t);    // 此刻月亮貝塞爾坐標(其x和y正是影足)
   var B = this.rSM(M[2]);  // 本半影等
   var r = B.r1;            // 半影半徑
   var I = this.bse(t);     // 貝塞爾坐標參數
   s2 = formatJD(t+J2000)+' ', k=0;
   // 南北界
   p = this.nanbei(M, vx, vy, +1, r,     I); if(p[1]!=100) s2+=formatRadianToMinute(p[0])+' '+formatRadianToMinute(p[1])+'|', k++; else s2+='-------------------|'; // 半影北界
   p = this.nanbei(M, vx, vy, +1, B.r2,  I); if(p[1]!=100) s2+=formatRadianToMinute(p[0])+' '+formatRadianToMinute(p[1])+'|', k++; else s2+='-------------------|'; // 本影北界
   p = this.bseXY2db(M[0], M[1], I, 1);       if(p[1]!=100) s2+=formatRadianToMinute(p[0])+' '+formatRadianToMinute(p[1])+'|', k++; else s2+='-------------------|'; // 中心線
   p = this.nanbei(M, vx, vy, -1, B.r2,  I); if(p[1]!=100) s2+=formatRadianToMinute(p[0])+' '+formatRadianToMinute(p[1])+'|', k++; else s2+='-------------------|'; // 本影南界
   p = this.nanbei(M, vx, vy, -1, r,     I); if(p[1]!=100) s2+=formatRadianToMinute(p[0])+' '+formatRadianToMinute(p[1])+' ', k++; else s2+='------------------- '; // 半影南界
   if(k) s+=s2+'<br>';
  }
  return '<pre>时间(力学时) 半影北界限 本影北界线 中心线 本影南界线 半影南界线，(伪本影南北界应互换)<br>'+s+'</pre>';
 }
};
;

// ===== solarEclipseBatch（原 rsPL）=====

export const solarEclipseBatch = { // 日食批量快速計算器
 nasa_r:0, // 為1表示採用NASA的視徑比
 sT:new Array(), // 地方日食時間表

 secXY:function(jd, L, fa, high, re){ // 日月xy坐標計算。參數：jd是力學時, 站點經緯L, fa, 海拔high(千米)
  // 基本參數計算
  var deltat = deltaT(jd); // TD-UT
  var zd=nutationMedium(jd/36525);
  var gst= meanSiderealTimeFromUT(jd-deltat, deltat) + zd[0]*Math.cos(meanObliquityP03(jd/36525) + zd[1]); // 真恆星時(不考慮非多項式部分)

  var z;
  // =======月亮========
  z=rsGS.moon(jd); re.mCJ=z[0]; re.mCW=z[1]; re.mR=z[2]; // 月亮視赤經, 月球赤緯
  var mShiJ = normalizeAngleSigned(gst + L - z[0]); // 得到此刻月亮時角
  applyParallax(z, mShiJ, fa, high); re.mCJ2=z[0], re.mCW2=z[1], re.mR2=z[2]; // 修正了視差的赤道坐標

  // =======太陽========
  z=rsGS.sun(jd); re.sCJ=z[0]; re.sCW=z[1]; re.sR=z[2]; // 太陽視赤經, 太陽赤緯
  var sShiJ = normalizeAngleSigned(gst + L - z[0]); // 得到此刻太陽時角
  applyParallax(z, sShiJ, fa, high); re.sCJ2=z[0], re.sCW2=z[1], re.sR2=z[2]; // 修正了視差的赤道坐標

  // =======視半徑========
  re.mr = MOON_RADIUS_FACTOR_PENUMBRA/re.mR2/RAD_TO_ARCSEC;
  re.sr = 959.63/re.sR2/RAD_TO_ARCSEC*AU_KM;
  if(this.nasa_r) re.mr*=MOON_RADIUS_FACTOR_UMBRA/MOON_RADIUS_FACTOR_PENUMBRA; // 0.99925;
  // =======日月赤經緯差轉為日面中心直角坐標(用于日食)==============
  re.x = normalizeAngleSigned(re.mCJ2-re.sCJ2) * Math.cos((re.mCW2+re.sCW2)/2);
  re.y = re.mCW2-re.sCW2;
  re.t = jd;
 },
 lineT:function(G, v, u, r, n){// 已知t1時刻星體位置、速度，求x*x+y*y=r*r時, t的值
  var b=G.y*v-G.x*u, A=u*u+v*v, B=u*b, C=b*b-r*r*v*v, D=B*B-A*C;
  if(D<0) return 0;
  D=Math.sqrt(D); if(!n) D=-D;
  return G.t+((-B+D)/A-G.x)/v;
 },
 secMax:function(jd, L, fa, high){ // 日食的食甚計算(jd為近朔的力學時, 誤差幾天不要緊)
  var i;
  for(i=0;i<5;i++) this.sT[i]=0; // 分別是:食甚, 初虧, 複圓, 食既, 生光
  this.LX=''; // 類型
  this.sf=0;  // 食分
  this.sf2=0; // 食分(日出食分)
  this.sf3=0; // 食分(日沒食分)
  this.sflx = " "; // 食分類型
  this.b1=1;  // 月日半徑比(食甚時刻)
  this.dur = 0; // 持續時間
  this.P1 = this.V1 = 0;  // 初虧方位, P北點起算, V頂點起算
  this.P2 = this.V2 = 0;  // 複圓方位, P北點起算, V頂點起算
  this.sun_s = this.sun_j = 0; // 日出日沒

  rsGS.init(jd, 7);
  jd=rsGS.Zjd; // 食甚初始估值為插值表中心時刻(粗朔)

  var G=new Object(), g=new Object();
  this.secXY(jd, L, fa, high, G);
  jd -= G.x/0.2128; // 與食甚的誤差在20分鐘以內

  var u, v, dt=60/86400, dt2;
  for(i=0;i<2;i++){
   if( this.secXY(jd, L, fa, high, G)   =='err') return;
   if( this.secXY(jd+dt, L, fa, high, g)=='err') return;
   u = (g.y-G.y)/dt;
   v = (g.x-G.x)/dt;
   dt2 = -(G.y*u+G.x*v)/(u*u+v*v);
   jd += dt2; // 極值時間
  }

  // 求直線到太陽中心的最小值
  var maxsf = 0, maxjd = jd, rmin, ls;
  for (i = -30; i < 30; i += 6) {
   tt = jd + i / 86400;
   this.secXY(tt, L, fa, high, g);
   ls = (g.mr + g.sr - Math.sqrt(g.x * g.x + g.y * g.y)) / g.sr / 2;
   if (ls > maxsf) maxsf = ls, maxjd = tt;
  }
  jd = maxjd;
  for (i = -5; i < 5; i += 1) {
   tt = jd + i / 86400;
   this.secXY(tt, L, fa, high, g);
   ls = (g.mr + g.sr - Math.sqrt(g.x * g.x + g.y * g.y)) / g.sr / 2;
   if (ls > maxsf) maxsf = ls, maxjd = tt;
  }
  jd = maxjd;
  this.secXY(jd, L, fa, high, G);
  rmin = Math.sqrt(G.x * G.x + G.y * G.y);

  this.sun_s = findSunRiseOrSet(jd-deltaT(jd)+L/TWO_PI, L, fa, -1) +deltaT(jd); // 日出, 統一用力學時
  this.sun_j = findSunRiseOrSet(jd-deltaT(jd)+L/TWO_PI, L, fa, 1) +deltaT(jd); // 日沒, 統一用力學時


  if(rmin<=G.mr+G.sr){ // 食計算
   this.sT[1] = jd; // 食甚
   this.LX='偏';
   this.sf=(G.mr+G.sr-rmin)/G.sr/2; // 食分
   this.b1=G.mr/G.sr;

   this.secXY(this.sun_s, L, fa, high, g); // 日出食分
   this.sf2=(g.mr+g.sr-Math.sqrt(g.x*g.x+g.y*g.y))/g.sr/2; // 日出食分
   if(this.sf2<0) this.sf2=0;

   this.secXY(this.sun_j, L, fa, high, g); // 日沒食分
   this.sf3=(g.mr+g.sr-Math.sqrt(g.x*g.x+g.y*g.y))/g.sr/2; // 日沒食分
   if(this.sf3<0) this.sf3=0;

   this.sT[0] = this.lineT(G, v, u, G.mr+G.sr, 0); // 初虧
   for(i=0;i<3;i++) { // 初虧再算3次
    this.secXY(this.sT[0], L, fa, high, g);
    this.sT[0] = this.lineT(g, v, u, g.mr+g.sr, 0);
   }

   this.P1 = normalizeAngle(Math.atan2(g.x, g.y)); // 初虧位置角
   this.V1 = normalizeAngle(this.P1-parallacticAngle(meanSiderealTimeFromTD(this.sT[0]), L, fa, g.sCJ, g.sCW)); // 這里g.sCJ與g.sCW對應的時間與sT[0]還差了一點，所以有一小點誤差，不採用真恆星時也誤差一點

   this.sT[2] = this.lineT(G, v, u, G.mr+G.sr, 1); // 複圓
   for(i=0;i<3;i++) { // 複圓再算3次
    this.secXY(this.sT[2], L, fa, high, g);
    this.sT[2] = this.lineT(g, v, u, g.mr+g.sr, 1);
   }
   this.P2 = normalizeAngle(Math.atan2(g.x, g.y));
   this.V2 = normalizeAngle(this.P2-parallacticAngle(meanSiderealTimeFromTD(this.sT[2]), L, fa, g.sCJ, g.sCW)); // 這里g.sCJ與g.sCW對應的時間與sT[2]還差了一點，所以有一小點誤差，不採用真恆星時也誤差一點
  }
  if(rmin<=G.mr-G.sr){ // 全食計算
   this.LX='全';
   this.sT[3] = this.lineT(G, v, u, G.mr-G.sr, 0); // 食既
   this.secXY(this.sT[3], L, fa, high, g);
   this.sT[3] = this.lineT(g, v, u, g.mr-g.sr, 0); // 食既再算1次

   this.sT[4] = this.lineT(G, v, u, G.mr-G.sr, 1); // 生光
   this.secXY(this.sT[4], L, fa, high, g);
   this.sT[4] = this.lineT(g, v, u, g.mr-g.sr, 1); // 生光再算1次
   this.dur = this.sT[4]-this.sT[3];
  }
  if(rmin<=G.sr-G.mr){ // 環食計算
   this.LX='环';
   this.sT[3] = this.lineT(G, v, u, G.sr-G.mr, 0); // 食既
   this.secXY(this.sT[3], L, fa, high, g);
   this.sT[3] = this.lineT(g, v, u, g.sr-g.mr, 0); // 食既再算1次

   this.sT[4] = this.lineT(G, v, u, G.sr-G.mr, 1); // 生光
   this.secXY(this.sT[4], L, fa, high, g);
   this.sT[4] = this.lineT(g, v, u, g.sr-g.mr, 1); // 生光再算1次
   this.dur = this.sT[4]-this.sT[3];
  }
  if(this.sT[1]<this.sun_s && this.sf2>0 ) this.sf=this.sf2, this.sflx="#"; // 食甚在日出前，取日出食分
  if(this.sT[1]>this.sun_j && this.sf3>0 ) this.sf=this.sf3, this.sflx="*"; // 食甚在日沒後，取日沒食分

  for(i=0;i<5;i++){
    if(this.sT[i]<this.sun_s || this.sT[i]>this.sun_j) this.sT[i]=0; // 升降時間之外的日食算值無效，因為地球不是透明的
  }

  this.sun_s -= deltaT(jd);
  this.sun_j -= deltaT(jd);
 },

 // 以下涉及南北界計算
 A:new Array(), B:new Array(), // 本半影錐頂點坐標
 P : {S:new Array(), M:new Array(), g:0}, // t1時刻的日月坐標, g為恆星時
 Q : {S:new Array(), M:new Array(), g:0}, // t2時刻的日月坐標
 V : new Array(), // 食界表
 Vc: '', Vb: '',  // 食中心類型, 本影南北距離

 zb0:function(jd){
  // 基本參數計算
  var deltat = deltaT(jd); // TD-UT
  var E=meanObliquityP03(jd/36525);
  var zd=nutationMedium(jd/36525);

  this.P.g = meanSiderealTimeFromUT(jd-deltat, deltat) + zd[0]*Math.cos(E+zd[1]); // 真恆星時(不考慮非多項式部分)
  this.P.S=rsGS.sun(jd);
  this.P.M=rsGS.moon(jd);

  var t2=jd+60/86400;
  this.Q.g = meanSiderealTimeFromUT(t2-deltat, deltat) + zd[0]*Math.cos(E+zd[1]);
  this.Q.S=rsGS.sun(t2);
  this.Q.M=rsGS.moon(t2);

  // 轉為直角坐標
  var z1=new Array(), z2=new Array();
  z1 = sphericalToCartesian(this.P.S);
  z2 = sphericalToCartesian(this.P.M);

  var k=959.63/MOON_RADIUS_FACTOR_PENUMBRA*AU_KM, F; // k為日月半徑比
  // 本影錐頂點坐標計算
  F = new Array(
   (z1[0]-z2[0])/(1-k)+z2[0],
   (z1[1]-z2[1])/(1-k)+z2[1],
   (z1[2]-z2[2])/(1-k)+z2[2]);
  this.A = cartesianToSpherical(F);
  // 半影錐頂點坐標計算
  F = new Array(
   (z1[0]-z2[0])/(1+k)+z2[0],
   (z1[1]-z2[1])/(1+k)+z2[1],
   (z1[2]-z2[2])/(1+k)+z2[2]);
  this.B = cartesianToSpherical(F);
 },

 zbXY:function(p, L, fa){
  var s=new Array(p.S[0], p.S[1], p.S[2]);
  var m=new Array(p.M[0], p.M[1], p.M[2]);
  applyParallax(s, p.g+L-p.S[0], fa, 0); // 修正了視差的赤道坐標
  applyParallax(m, p.g+L-p.M[0], fa, 0); // 修正了視差的赤道坐標
  // =======視半徑========
  p.mr = MOON_RADIUS_FACTOR_PENUMBRA/m[2]/RAD_TO_ARCSEC;
  p.sr = 959.63/s[2]/RAD_TO_ARCSEC*AU_KM;
  // =======日月赤經緯差轉為日面中心直角坐標(用于日食)==============
  p.x = normalizeAngleSigned(m[0]-s[0]) * Math.cos((m[1]+s[1])/2);
  p.y = m[1]-s[1];
 },
 p2p:function(L, fa, re, fAB, f){ // f取+-1
  var p=this.P, q=this.Q;
  this.zbXY(this.P, L, fa);
  this.zbXY(this.Q, L, fa);

  var u=q.y-p.y, v=q.x-p.x, a=Math.sqrt(u*u+v*v), r=959.63/p.S[2]/RAD_TO_ARCSEC*AU_KM;

  var W=p.S[1]+f*r*v/a, J=p.S[0]-f*r*u/a/Math.cos((W+p.S[1])/2), R=p.S[2];

  var A = fAB ? this.A : this.B;

  var pp = lineEarthIntersect( new Array(J, W, R), A, p.g );
  re.J = pp.J;
  re.W = pp.W;
 },
 pp0:function(re){ // 食中心點計算
  var p=this.P;
  var pp = lineEarthIntersect( p.M, p.S, p.g );
  re.J = pp.J;
  re.W = pp.W; // 無解返回值是100
  
  if(re.W==100) { re.c = ''; return; }
  re.c='全';
  this.zbXY(p, re.J, re.W);
  if(p.sr>p.mr) re.c='环';
 },
 nbj:function(jd){ // 南北界計算
  rsGS.init(jd, 7);
  var i, G=new Object(), V=this.V;
  for(i=0;i<10;i++) V[i]=100; this.Vc='', this.Vb=''; // 返回初始化, 緯度值為100表示無解, 經度100也是無解, 但在以下程序中經度會被轉為-PI到+PI

  this.zb0(jd);
  this.pp0(G); V[0]=G.J, V[1]=G.W, this.Vc=G.c; // 食中心

  G.J=G.W=0; for(i=0;i<2;i++) this.p2p(G.J, G.W, G, 1, 1); V[2]=G.J, V[3]=G.W; // 本影北界, 環食為南界(本影區之內, 變差u, v基本不變, 所以計算两次足夠)
  G.J=G.W=0; for(i=0;i<2;i++) this.p2p(G.J, G.W, G, 1, -1); V[4]=G.J, V[5]=G.W; // 本影南界, 環食為北界
  G.J=G.W=0; for(i=0;i<3;i++) this.p2p(G.J, G.W, G, 0, -1); V[6]=G.J, V[7]=G.W; // 半影北界
  G.J=G.W=0; for(i=0;i<3;i++) this.p2p(G.J, G.W, G, 0, 1); V[8]=G.J, V[9]=G.W; // 半影南界

  if(V[3]!=100&&V[5]!=100){ // 粗算本影南北距離
    var x=(V[2]-V[4])*Math.cos((V[3]+V[5])/2), y=V[3]-V[5];
    this.Vb = (EARTH_MEAN_RADIUS_KM*Math.sqrt(x*x+y*y)).toFixed(0)+'千米';
  }
 }
};
;
