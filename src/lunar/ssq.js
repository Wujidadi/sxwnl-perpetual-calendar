// 實朔實氣計算器。
//
// 適用範圍 −722 年 2 月 22 日 ─ 1959 年 12 月。
// 平氣平朔計算使用古曆參數；定朔／定氣使用開普勒橢圓軌道（含光行差與 TD−UT 修正）。
// 古曆相對開普勒計算的誤差，以修正表（NEW_MOON_CORRECTIONS / SOLAR_TERM_CORRECTIONS）逐項校正。
//
// 平氣朔表的線性擬合：氣朔日期計算公式 D = k * n + b，n = 0…N−1。
// h 表示 k 不變時 b 允許的誤差；如果 b 不變則 k 許可誤差為 h/N。每行第 1 個參數為 k，第 2 個為 b。

import { J2000, TWO_PI } from '../astro/constants.js';
import { deltaT } from '../astro/delta-t.js';
import {
  sunApparentLongToTime,
  sunApparentLongToTimeFaster,
  moonSunDiffToTime,
  moonSunDiffToTimeFaster,
} from '../astro/ephemeris.js';

// 朔直線擬合參數
export const NEW_MOON_LINEAR_COEFFS = new Array(
  1457698.231017, 29.53067166, // −721-12-17 h=0.00032 古曆·春秋
  1546082.512234, 29.53085106, // −479-12-11 h=0.00053 古曆·戰國
  1640640.735300, 29.53060000, // −221-10-31 h=0.01010 古曆·秦漢
  1642472.151543, 29.53085439, // −216-11-04 h=0.00040 古曆·秦漢
  1683430.509300, 29.53086148, // −104-12-25 h=0.00313 漢書·律曆志（太初曆）平氣平朔
  1752148.041079, 29.53085097, //   85-02-13 h=0.00049 後漢書·律曆志（四分曆）
  1807724.481520, 29.53059851, //  237-04-12 h=0.00033 晉書·律曆志（景初曆）
  1883618.114100, 29.53060000, //  445-01-24 h=0.00030 宋書·律曆志（何承天元嘉曆）
  1907360.704700, 29.53060000, //  510-01-26 h=0.00030 宋書·律曆志（祖沖之大明曆）
  1936596.224900, 29.53060000, //  590-02-10 h=0.01010 隋書·律曆志（開皇曆）
  1939135.675300, 29.53060000, //  597-01-24 h=0.00890 隋書·律曆志（大業曆）
  1947168.00, //  619-01-21
);

// 氣直線擬合參數
export const SOLAR_TERM_LINEAR_COEFFS = new Array(
  1640650.479938, 15.21842500,  // −221-11-09 h=0.01709 古曆·秦漢
  1642476.703182, 15.21874996,  // −216-11-09 h=0.01557 古曆·秦漢
  1683430.515601, 15.218750011, // −104-12-25 h=0.01560 漢書·律曆志（太初曆）平氣平朔 回歸年=365.25000
  1752157.640664, 15.218749978, //   85-02-23 h=0.01559 後漢書·律曆志（四分曆） 回歸年=365.25000
  1807675.003759, 15.218620279, //  237-02-22 h=0.00010 晉書·律曆志（景初曆） 回歸年=365.24689
  1883627.765182, 15.218612292, //  445-02-03 h=0.00026 宋書·律曆志（何承天元嘉曆） 回歸年=365.24670
  1907369.128100, 15.218449176, //  510-02-03 h=0.00027 宋書·律曆志（祖沖之大明曆） 回歸年=365.24278
  1936603.140413, 15.218425000, //  590-02-17 h=0.00149 隋書·律曆志（開皇曆） 回歸年=365.24220
  1939145.524180, 15.218466998, //  597-02-03 h=0.00121 隋書·律曆志（大業曆） 回歸年=365.24321
  1947180.798300, 15.218524844, //  619-02-03 h=0.00052 新唐書·曆志（戊寅元曆）平氣定朔 回歸年=365.24460
  1964362.041824, 15.218533526, //  666-02-17 h=0.00059 新唐書·曆志（麟德曆） 回歸年=365.24480
  1987372.340971, 15.218513908, //  729-02-16 h=0.00096 新唐書·曆志（大衍曆，至德曆） 回歸年=365.24433
  1999653.819126, 15.218530782, //  762-10-03 h=0.00093 新唐書·曆志（五紀曆） 回歸年=365.24474
  2007445.469786, 15.218535181, //  784-02-01 h=0.00059 新唐書·曆志（正元曆，觀象曆） 回歸年=365.24484
  2021324.917146, 15.218526248, //  822-02-01 h=0.00022 新唐書·曆志（宣明曆） 回歸年=365.24463
  2047257.232342, 15.218519654, //  893-01-31 h=0.00015 新唐書·曆志（崇玄曆） 回歸年=365.24447
  2070282.898213, 15.218425000, //  956-02-16 h=0.00149 舊五代·曆志（欽天曆） 回歸年=365.24220
  2073204.872850, 15.218515221, //  964-02-16 h=0.00166 宋史·律曆志（應天曆） 回歸年=365.24437
  2080144.500926, 15.218530782, //  983-02-16 h=0.00093 宋史·律曆志（乾元曆） 回歸年=365.24474
  2086703.688963, 15.218523776, // 1001-01-31 h=0.00067 宋史·律曆志（儀天曆，崇天曆） 回歸年=365.24457
  2110033.182763, 15.218425000, // 1064-12-15 h=0.00669 宋史·律曆志（明天曆） 回歸年=365.24220
  2111190.300888, 15.218425000, // 1068-02-15 h=0.00149 宋史·律曆志（崇天曆） 回歸年=365.24220
  2113731.271005, 15.218515671, // 1075-01-30 h=0.00038 李銳補修（奉元曆） 回歸年=365.24438
  2120670.840263, 15.218425000, // 1094-01-30 h=0.00149 宋史·律曆志 回歸年=365.24220
  2123973.309063, 15.218425000, // 1103-02-14 h=0.00669 李銳補修（占天曆） 回歸年=365.24220
  2125068.997336, 15.218477932, // 1106-02-14 h=0.00056 宋史·律曆志（紀元曆） 回歸年=365.24347
  2136026.312633, 15.218472436, // 1136-02-14 h=0.00088 宋史·律曆志（統元曆，乾道曆，淳熙曆） 回歸年=365.24334
  2156099.495538, 15.218425000, // 1191-01-29 h=0.00149 宋史·律曆志（會元曆） 回歸年=365.24220
  2159021.324663, 15.218425000, // 1199-01-29 h=0.00149 宋史·律曆志（統天曆） 回歸年=365.24220
  2162308.575254, 15.218461742, // 1208-01-30 h=0.00146 宋史·律曆志（開禧曆） 回歸年=365.24308
  2178485.706538, 15.218425000, // 1252-05-15 h=0.04606 淳祐曆 回歸年=365.24220
  2178759.662849, 15.218445786, // 1253-02-13 h=0.00231 會天曆 回歸年=365.24270
  2185334.020800, 15.218425000, // 1271-02-13 h=0.00520 宋史·律曆志（成天曆） 回歸年=365.24220
  2187525.481425, 15.218425000, // 1277-02-12 h=0.00520 本天曆 回歸年=365.24220
  2188621.191481, 15.218437494, // 1280-02-13 h=0.00015 元史·曆志（郭守敬授時曆） 回歸年=365.24250
  2322147.76, // 1645-09-21
);

// 朔修正字串原始資料（619-01-21 開始 16598 個朔日修正表，d0=1947168）。
const NEW_MOON_CORRECTIONS_RAW =
  'EqoFscDcrFpmEsF2DfFideFelFpFfFfFiaipqti1ksttikptikqckstekqttgkqttgkqteksttikptikq2fjstgjqttjkqttgkqt'
+ 'ekstfkptikq2tijstgjiFkirFsAeACoFsiDaDiADc1AFbBfgdfikijFifegF1FhaikgFag1E2btaieeibggiffdeigFfqDfaiBkF'
+ '1kEaikhkigeidhhdiegcFfakF1ggkidbiaedksaFffckekidhhdhdikcikiakicjF1deedFhFccgicdekgiFbiaikcfi1kbFibef'
+ 'gEgFdcFkFeFkdcfkF1kfkcickEiFkDacFiEfbiaejcFfffkhkdgkaiei1ehigikhdFikfckF1dhhdikcfgjikhfjicjicgiehdik'
+ 'cikggcifgiejF1jkieFhegikggcikFegiegkfjebhigikggcikdgkaFkijcfkcikfkcifikiggkaeeigefkcdfcfkhkdgkegieid'
+ 'hijcFfakhfgeidieidiegikhfkfckfcjbdehdikggikgkfkicjicjF1dbidikFiggcifgiejkiegkigcdiegfggcikdbgfgefjF1'
+ 'kfegikggcikdgFkeeijcfkcikfkekcikdgkabhkFikaffcfkhkdgkegbiaekfkiakicjhfgqdq2fkiakgkfkhfkfcjiekgFebicg'
+ 'gbedF1jikejbbbiakgbgkacgiejkijjgigfiakggfggcibFifjefjF1kfekdgjcibFeFkijcfkfhkfkeaieigekgbhkfikidfcje'
+ 'aibgekgdkiffiffkiakF1jhbakgdki1dj1ikfkicjicjieeFkgdkicggkighdF1jfgkgfgbdkicggfggkidFkiekgijkeigfiski'
+ 'ggfaidheigF1jekijcikickiggkidhhdbgcfkFikikhkigeidieFikggikhkffaffijhidhhakgdkhkijF1kiakF1kfheakgdkif'
+ 'iggkigicjiejkieedikgdfcggkigieeiejfgkgkigbgikicggkiaideeijkefjeijikhkiggkiaidheigcikaikffikijgkiahi1'
+ 'hhdikgjfifaakekighie1hiaikggikhkffakicjhiahaikggikhkijF1kfejfeFhidikggiffiggkigicjiekgieeigikggiffig'
+ 'gkidheigkgfjkeigiegikifiggkidhedeijcfkFikikhkiggkidhh1ehigcikaffkhkiggkidhh1hhigikekfiFkFikcidhh1hit'
+ 'cikggikhkfkicjicghiediaikggikhkijbjfejfeFhaikggifikiggkigiejkikgkgieeigikggiffiggkigieeigekijcijikgg'
+ 'ifikiggkideedeijkefkfckikhkiggkidhh1ehijcikaffkhkiggkidhh1hhigikhkikFikfckcidhh1hiaikgjikhfjicjicgie'
+ 'hdikcikggifikigiejfejkieFhegikggifikiggfghigkfjeijkhigikggifikiggkigieeijcijcikfksikifikiggkidehdeij'
+ 'cfdckikhkiggkhghh1ehijikifffffkhsFngErD1pAfBoDd1BlEtFqA2AqoEpDqElAEsEeB2BmADlDkqBtC1FnEpDqnEmFsFsAFn'
+ 'llBbFmDsDiCtDmAB2BmtCgpEplCpAEiBiEoFqFtEqsDcCnFtADnFlEgdkEgmEtEsCtDmADqFtAFrAtEcCqAE1BoFqC1F1DrFtBmF'
+ 'tAC2ACnFaoCgADcADcCcFfoFtDlAFgmFqBq2bpEoAEmkqnEeCtAE1bAEqgDfFfCrgEcBrACfAAABqAAB1AAClEnFeCtCgAADqDoB'
+ 'mtAAACbFiAAADsEtBqAB2FsDqpFqEmFsCeDtFlCeDtoEpClEqAAFrAFoCgFmFsFqEnAEcCqFeCtFtEnAEeFtAAEkFnErAABbFkAD'
+ 'nAAeCtFeAfBoAEpFtAABtFqAApDcCGJ';

// 氣修正字串原始資料（1645-09-23 開始 7567 個節氣修正表）。
const SOLAR_TERM_CORRECTIONS_RAW =
  'FrcFs22AFsckF2tsDtFqEtF1posFdFgiFseFtmelpsEfhkF2anmelpFlF1ikrotcnEqEq2FfqmcDsrFor22FgFrcgDscFs22FgEe'
+ 'FtE2sfFs22sCoEsaF2tsD1FpeE2eFsssEciFsFnmelpFcFhkF2tcnEqEpFgkrotcnEqrEtFermcDsrE222FgBmcmr22DaEfnaF22'
+ '2sD1FpeForeF2tssEfiFpEoeFssD1iFstEqFppDgFstcnEqEpFg11FscnEqrAoAF2ClAEsDmDtCtBaDlAFbAEpAAAAAD2FgBiBqo'
+ 'BbnBaBoAAAAAAAEgDqAdBqAFrBaBoACdAAf1AACgAAAeBbCamDgEifAE2AABa1C1BgFdiAAACoCeE1ADiEifDaAEqAAFe1AcFbcA'
+ 'AAAAF1iFaAAACpACmFmAAAAAAAACrDaAAADG0';

// 解壓修正字串。
function decompressCorrections(s) {
  const o = '0000000000', o2 = o + o;
  s = s.replace(/J/g, '00');
  s = s.replace(/I/g, '000');
  s = s.replace(/H/g, '0000');
  s = s.replace(/G/g, '00000');
  s = s.replace(/t/g, '02');
  s = s.replace(/s/g, '002');
  s = s.replace(/r/g, '0002');
  s = s.replace(/q/g, '00002');
  s = s.replace(/p/g, '000002');
  s = s.replace(/o/g, '0000002');
  s = s.replace(/n/g, '00000002');
  s = s.replace(/m/g, '000000002');
  s = s.replace(/l/g, '0000000002');
  s = s.replace(/k/g, '01');
  s = s.replace(/j/g, '0101');
  s = s.replace(/i/g, '001');
  s = s.replace(/h/g, '001001');
  s = s.replace(/g/g, '0001');
  s = s.replace(/f/g, '00001');
  s = s.replace(/e/g, '000001');
  s = s.replace(/d/g, '0000001');
  s = s.replace(/c/g, '00000001');
  s = s.replace(/b/g, '000000001');
  s = s.replace(/a/g, '0000000001');
  s = s.replace(/A/g, o2 + o2 + o2);
  s = s.replace(/B/g, o2 + o2 + o);
  s = s.replace(/C/g, o2 + o2);
  s = s.replace(/D/g, o2 + o);
  s = s.replace(/E/g, o2);
  s = s.replace(/F/g, o);
  return s;
}

export const NEW_MOON_CORRECTIONS = decompressCorrections(NEW_MOON_CORRECTIONS_RAW);
export const SOLAR_TERM_CORRECTIONS = decompressCorrections(SOLAR_TERM_CORRECTIONS_RAW);

// 為了參考，仍將解壓函式對外公開。
export { decompressCorrections };

// 平朔（低精度）。±2000 年以內誤差 ≤2 小時。
function newMoonLowPrecision(W) {
  const v = 7771.37714500204;
  let t = (W + 1.08472) / v;
  t -= (
    -0.0000331 * t * t
    + 0.10976 * Math.cos(0.785 + 8328.6914 * t)
    + 0.02224 * Math.cos(0.187 + 7214.0629 * t)
    - 0.03342 * Math.cos(4.669 +  628.3076 * t)
  ) / v
    + (32 * (t + 1.8) * (t + 1.8) - 20) / 86400 / 36525;
  return t * 36525 + 8 / 24;
}

// 平氣（低精度）。最大誤差 < 30 分鐘，平均 5 分鐘。
function solarTermLowPrecision(W) {
  const v = 628.3319653318;
  let t = (W - 4.895062166) / v;
  t -= (53 * t * t + 334116 * Math.cos(4.67 + 628.307585 * t) + 2061 * Math.cos(2.678 + 628.3076 * t) * t) / v / 10000000;
  const L = 48950621.66 + 6283319653.318 * t + 53 * t * t
        + 334166 * Math.cos(4.669257 +  628.307585 * t)
        +   3489 * Math.cos(4.6261   + 1256.61517  * t)
        + 2060.6 * Math.cos(2.67823  +  628.307585 * t) * t
        -    994 -  834 * Math.sin(2.1824 - 33.75705 * t);
  t -= (L / 10000000 - W) / 628.332 + (32 * (t + 1.8) * (t + 1.8) - 20) / 86400 / 36525;
  return t * 36525 + 8 / 24;
}

// 較高精度氣。
function solarTermHighPrecision(W) {
  let t = sunApparentLongToTimeFaster(W) * 36525;
  t = t - deltaT(t) + 8 / 24;
  const v = ((t + 0.5) % 1) * 86400;
  if (v < 1200 || v > 86400 - 1200) t = sunApparentLongToTime(W) * 36525 - deltaT(t) + 8 / 24;
  return t;
}

// 較高精度朔。
function newMoonHighPrecision(W) {
  let t = moonSunDiffToTimeFaster(W) * 36525;
  t = t - deltaT(t) + 8 / 24;
  const v = ((t + 0.5) % 1) * 86400;
  if (v < 1800 || v > 86400 - 1800) t = moonSunDiffToTime(W) * 36525 - deltaT(t) + 8 / 24;
  return t;
}

// 將自身導出（含資料表存取與計算函式）。保持單例物件形式以便共用狀態欄位。
export const shuoQiCalculator = {
  // 排月序輸出
  leapMonth: 0,
  monthNames:    [], // 各月名稱
  centralQiList: [], // 中氣表（含 .liqiu / .pe1 / .pe2 屬性）
  newMoonList:   [], // 合朔表
  monthLengths: [], // 各月大小
  yearCount:     [], // 年計數

  // jd 應靠近所要取得的氣朔日；isSolarTerm=true 計算節氣，否則計算合朔。
  calc(jd, isSolarTerm) {
    jd += 2451545;
    const B  = isSolarTerm ? SOLAR_TERM_LINEAR_COEFFS : NEW_MOON_LINEAR_COEFFS;
    const pc = isSolarTerm ? 7 : 14;
    const f1 = B[0] - pc;
    const f2 = B[B.length - 1] - pc;
    const f3 = 2436935;

    // 平氣朔表之前 / 1960 之後使用現代天文算法
    if (jd < f1 || jd >= f3) {
      if (isSolarTerm) return Math.floor(solarTermHighPrecision(Math.floor((jd + pc - 2451259) / 365.2422 * 24) * Math.PI / 12) + 0.5);
      else             return Math.floor(newMoonHighPrecision(Math.floor((jd + pc - 2451551) / 29.5306) * Math.PI * 2) + 0.5);
    }

    // 平氣或平朔
    if (jd >= f1 && jd < f2) {
      let i;
      for (i = 0; i < B.length; i += 2) if (jd + pc < B[i + 2]) break;
      let D = B[i] + B[i + 1] * Math.floor((jd + pc - B[i]) / B[i + 1]);
      D = Math.floor(D + 0.5);
      // 太初曆計算 −103 年 1 月 24 日的朔，結果得到 23 日；此處修正為 24 日（實曆）。
      if (D === 1683460) D++;
      return D - 2451545;
    }

    // 定氣或定朔
    if (jd >= f2 && jd < f3) {
      let D, n;
      if (isSolarTerm) {
        D = Math.floor(solarTermLowPrecision(Math.floor((jd + pc - 2451259) / 365.2422 * 24) * Math.PI / 12) + 0.5);
        n = SOLAR_TERM_CORRECTIONS.substr(Math.floor((jd - f2) / 365.2422 * 24), 1);
      } else {
        D = Math.floor(newMoonLowPrecision(Math.floor((jd + pc - 2451551) / 29.5306) * Math.PI * 2) + 0.5);
        n = NEW_MOON_CORRECTIONS.substr(Math.floor((jd - f2) / 29.5306), 1);
      }
      if (n === '1') return D + 1;
      if (n === '2') return D - 1;
      return D;
    }
  },

  // 農曆排月序計算。有效範圍：兩個冬至之間（冬至一 ≤ d < 冬至二）。
  calcYear(jd) {
    const A = this.centralQiList;
    const B = this.newMoonList;

    // 該年的氣
    let W = Math.floor((jd - 355 + 183) / 365.2422) * 365.2422 + 355; // 2000.12 冬至基準
    if (this.calc(W, true) > jd) W -= 365.2422;
    for (let i = 0; i < 25; i++) A[i] = this.calc(W + 15.2184 * i, true);
    A.pe1 = this.calc(W - 15.2, true);
    A.pe2 = this.calc(W - 30.4, true);

    // 該年「首朔」
    let w = this.calc(A[0], false);
    if (w > A[0]) w -= 29.53;

    for (let i = 0; i < 15; i++) B[i] = this.calc(w + 29.5306 * i, false);

    // 月大小
    this.leapMonth = 0;
    for (let i = 0; i < 14; i++) {
      this.monthLengths[i] = this.newMoonList[i + 1] - this.newMoonList[i];
      this.monthNames[i] = i;
    }

    // −721 至 −104 年的後九月及月建（與朔有關，與氣無關）
    const YY = Math.floor((this.centralQiList[0] + 10 + 180) / 365.2422) + 2000;
    if (YY >= -721 && YY <= -104) {
      const ns = [];
      for (let i = 0; i < 3; i++) {
        const yy = YY + i - 1;
        if (yy >= -721) { ns[i] = this.calc(1457698 - J2000 + Math.floor(0.342 + (yy + 721) * 12.368422) * 29.5306, false); ns[i + 3] = '十三'; ns[i + 6] = 2; }
        if (yy >= -479) { ns[i] = this.calc(1546083 - J2000 + Math.floor(0.500 + (yy + 479) * 12.368422) * 29.5306, false); ns[i + 3] = '十三'; ns[i + 6] = 2; }
        if (yy >= -220) { ns[i] = this.calc(1640641 - J2000 + Math.floor(0.866 + (yy + 220) * 12.369000) * 29.5306, false); ns[i + 3] = '后九'; ns[i + 6] = 11; }
      }
      const ymc = ['十一', '十二', '正', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
      for (let i = 0; i < 14; i++) {
        let nn;
        for (nn = 2; nn >= 0; nn--) if (this.newMoonList[i] >= ns[nn]) break;
        const f1 = Math.floor((this.newMoonList[i] - ns[nn] + 15) / 29.5306);
        if (f1 < 12) this.monthNames[i] = ymc[(f1 + ns[nn + 6]) % 12];
        else         this.monthNames[i] = ns[nn + 3];
      }
      return;
    }

    // 無中氣置閏法確定閏月
    if (B[13] <= A[24]) {
      let i = 1;
      for (; B[i + 1] > A[2 * i] && i < 13; i++);
      this.leapMonth = i;
      for (; i < 14; i++) this.monthNames[i]--;
    }

    // 月建別名（建子十一、建丑十二、建寅為正…）
    const ymc = ['十一', '十二', '正', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
    for (let i = 0; i < 14; i++) {
      const Dm = this.newMoonList[i] + J2000;
      const v2 = this.monthNames[i];
      let mc = ymc[v2 % 12];
      if      (Dm >= 1724360 && Dm <= 1729794) mc = ymc[(v2 + 1) % 12]; //   8.01.15 至  23.12.02 建子為十二
      else if (Dm >= 1807724 && Dm <= 1808699) mc = ymc[(v2 + 1) % 12]; // 237.04.12 至 239.12.13 建子為十二
      else if (Dm >= 1999349 && Dm <= 1999467) mc = ymc[(v2 + 2) % 12]; // 761.12.02 至 762.03.30 建子為正月
      else if (Dm >= 1973067 && Dm <= 1977052) {
        if (v2 % 12 === 0) mc = '正';
        if (v2 === 2)      mc = '一';
      }
      if (Dm === 1729794 || Dm === 1808699) mc = '拾贰'; // 避免連續十二月
      this.monthNames[i] = mc;
    }
  },
};
