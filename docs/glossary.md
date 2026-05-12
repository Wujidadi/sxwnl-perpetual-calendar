# 拼音／中文縮寫 → 英文 識別字對映表

## 用途

改寫期間統一使用此表決定新版的識別字。本表為所有新版模組命名依據；每批由使用者審核凍結後填入。

## 命名原則

1. **語意保留**：只改名，不改演算法。
2. **學界術語優先**：與天文文獻一致的標準縮寫沿用（如 `J2000`、`AU`、`deltaT`）。
3. **局部短變數沿用**：函式內 `t`、`t2`、`jd`、`L`、`fa`、`dt`、`i`、`g` 等沿用，因對應公式記法。
4. **資料表內容不動**：VSOP87、ELP、SSB、SSQ 古曆資料的數值原樣搬遷，僅外層變數名可調整。
5. **常數命名**：模組頂層常數採 `SCREAMING_SNAKE_CASE`；函式採 `camelCase`；類別／物件採 `PascalCase`。

## 批次清單

| 批次 | 模組                           | 狀態      |
| ---- | ------------------------------ | --------- |
| B1   | `tools.js`                     | ✅ 已定稿  |
| B2   | `eph0.js` 常數與數學工具       | ✅ 已定稿  |
| B3   | `eph0.js` 時間／座標／攝動     | ✅ 已定稿  |
| B4   | `eph0.js` 週期項與基本天文工具 | ✅ 已定稿  |
| B4.5 | `eph0.js` 地圖投影段           | ⏳ 併入 B9 |
| B5   | `ephB.js`                      | ✅ 已定稿  |
| B6   | `eph.js`                       | ✅ 已定稿  |
| B7   | `JW.js`                        | ✅ 已定稿  |
| B8   | `lunar.js`                     | ✅ 已定稿  |
| B9   | `vml.js` + 地圖投影段          | ✅ 已定稿  |
| B10  | `help.js`／`page_gj.js`        | ✅ 已定稿  |
| B11  | HTML input IDs                 | ✅ 已定稿  |

## B1：`tools.js`

> 狀態：✅ 已定稿

### 檔案拆分

| 新檔                     | 原檔對應內容                                                                 |
| ------------------------ | ---------------------------------------------------------------------------- |
| `src/utils/year-conv.js` | `year2Ayear`、`Ayear2year`                                                   |
| `src/utils/time.js`      | `timeStr2hour`、`formatDateTime`（原 `Date.prototype.toLocaleString2` 改寫） |
| `src/utils/storage.js`   | `persistentStorage`（原 `storageL` 全部成員）                                |

### 識別字對映

| 原名                             | 中文含義                    | 新名                            | 處置                                       |
| -------------------------------- | --------------------------- | ------------------------------- | ------------------------------------------ |
| `trim`                           | 去除前後空白                | —                               | **刪除**（用原生 `String.prototype.trim`） |
| `Date.prototype.toLocaleString2` | Date 格式化                 | `formatDateTime(d)`             | **改寫**（純函式，不汙染 prototype）       |
| `year2Ayear`                     | 普通紀年→天文紀年           | `civilToAstroYear`              | 改名                                       |
| `Ayear2year`                     | 天文紀年→普通紀年           | `astroToCivilYear`              | 改名                                       |
| `timeStr2hour`                   | 時間字串→小時數             | `parseTimeToHours`              | 改名                                       |
| `storageL`                       | 持久化 wrapper              | `persistentStorage`             | 改名                                       |
| `storageL.existStorage`          | 偵測 localStorage 支援      | `persistentStorage.isAvailable` | 改名                                       |
| `storageL.setItem`               | 寫入                        | `persistentStorage.setItem`     | 沿用                                       |
| `storageL.getItem`               | 讀取                        | `persistentStorage.getItem`     | 沿用                                       |
| `storageL.setCookie`             | 寫 cookie                   | `persistentStorage._setCookie`  | 改為私有                                   |
| `storageL.getCookie`             | 讀 cookie                   | `persistentStorage._getCookie`  | 改為私有                                   |
| `addOp`                          | 為 `<select>` 加 `<option>` | —                               | **刪除**（UI 工具，不屬於 utils 層）       |

### 行為調整

| 項目                                         | 原行為                  | 新行為                                       |
| -------------------------------------------- | ----------------------- | -------------------------------------------- |
| `civilToAstroYear` 越界（< −4712 或 > 9999） | `alert('...不准')`      | `console.warn('...不准')`                    |
| `civilToAstroYear` 對 `B0` 等非法值          | `alert + return -10000` | `console.warn + return -10000`（沿用哨兵值） |

### 函式內局部變數沿用

| 函式               | 局部變數                                    |
| ------------------ | ------------------------------------------- |
| `civilToAstroYear` | `c`（輸入）、`y`（轉換結果）、`q`（首字元） |
| `astroToCivilYear` | `y`                                         |
| `parseTimeToHours` | `s`（輸入）、`a`、`b`、`c`（時／分／秒）    |

## B2：`eph0.js` 常數與數學工具

> 狀態：✅ 已定稿。範圍：`eph0.js` 第 1–213 行（不含 `dt_*`／`JD`／週期項）。

### 檔案拆分

| 新檔                        | 內容                                                     |
| --------------------------- | -------------------------------------------------------- |
| `src/astro/constants.js`    | 物理／天文常數（地球半徑、AU、光速、行星名、π 派生量等） |
| `src/astro/math-utils.js`   | 角度正規化、球面⇄直角座標、球面三角                      |
| `src/astro/angle-format.js` | 弧度⇄字串（含時分秒、度分秒）                            |

### `constants.js`

| 原名        | 含義／值                         | 新名                                                    |
| ----------- | -------------------------------- | ------------------------------------------------------- |
| `cs_rEar`   | 地球赤道半徑 6378.1366 km        | `EARTH_EQUATORIAL_RADIUS_KM`                            |
| `cs_rEarA`  | 地球平均半徑 = 0.99834 × cs_rEar | `EARTH_MEAN_RADIUS_KM`                                  |
| `cs_ba`     | 極／赤半徑比 0.99664719          | `EARTH_POLAR_EQ_RATIO`                                  |
| `cs_ba2`    | `cs_ba²`                         | `EARTH_POLAR_EQ_RATIO_SQ`                               |
| `cs_AU`     | 1 AU = 1.49597870691e8 km        | `AU_KM`                                                 |
| `cs_sinP`   | sin(太陽視差) = R⊕/AU            | `SIN_SOLAR_PARALLAX`                                    |
| `cs_PI`     | 太陽視差角（asin(cs_sinP)）      | `SOLAR_PARALLAX`                                        |
| `cs_GS`     | 光速 299792.458 km/s             | `SPEED_OF_LIGHT_KM_S`                                   |
| `cs_Agx`    | 每 AU 光行時間（儒略世紀）       | `LIGHT_TIME_PER_AU_JCY`                                 |
| `cs_xxHH`   | 行星會合週期陣列                 | `SYNODIC_PERIODS`                                       |
| `xxName`    | 行星名陣列（含冥王星，9 項）     | （已移除常數；行星名由 i18n 字典 `astro.planets` 提供） |
| `rad`       | 180×3600/π（每弧度的角秒數）     | `RAD_TO_ARCSEC`                                         |
| `radd`      | 180/π（每弧度的度數）            | `RAD_TO_DEG`                                            |
| `pi2`       | 2π                               | `TWO_PI`                                                |
| `pi_2`      | π/2                              | `HALF_PI`                                               |
| `J2000`     | 儒略日 2451545（標準曆元）       | `J2000`（沿用，學界標準）                               |
| `cs_k`      | 月／地半徑比（半影）0.2725076    | `MOON_EARTH_RATIO_PENUMBRA`                             |
| `cs_k2`     | 月／地半徑比（本影）0.2722810    | `MOON_EARTH_RATIO_UMBRA`                                |
| `cs_k0`     | 日／地半徑比 109.1222            | `SUN_EARTH_RATIO`                                       |
| `cs_sMoon`  | 月亮視半徑常數（半影）           | `MOON_RADIUS_FACTOR_PENUMBRA`                           |
| `cs_sMoon2` | 月亮視半徑常數（本影）           | `MOON_RADIUS_FACTOR_UMBRA`                              |
| `cs_sSun`   | 太陽視半徑常數 959.64″           | `SUN_RADIUS_ARCSEC`                                     |

### `math-utils.js`

**刪除的三角／取整別名**（呼叫端改用 `Math.xxx`）：`int2`、`sqrt`、`floor`、`abs`、`sin`、`cos`、`tan`、`asin`、`acos`、`atan`、`atan2`。

| 原名                           | 含義                                            | 新名                       |
| ------------------------------ | ----------------------------------------------- | -------------------------- |
| `rad2mrad(v)`                  | 正規化為 0..2π                                  | `normalizeAngle`           |
| `rad2rrad(v)`                  | 正規化為 −π..π                                  | `normalizeAngleSigned`     |
| `mod2(a,b)`（第 158 行覆蓋版） | 臨界餘數：a 與最近 b 整倍數之差，範圍 −b/2..b/2 | `balancedMod`              |
| `mod2(v,n)`（第 42 行）        | 一般取餘                                        | **刪除**（被覆蓋的死碼）   |
| `llr2xyz(JW)`                  | 球面（黃經、黃緯、距離）→ 直角                  | `sphericalToCartesian`     |
| `xyz2llr(xyz)`                 | 直角 → 球面                                     | `cartesianToSpherical`     |
| `llrConv(JW, E)`               | 球面座標旋轉（黃赤互換）                        | `rotateSpherical`          |
| `CD2DP(z, L, fa, gst)`         | 赤道座標 → 地平座標                             | `equatorialToHorizon`      |
| `j1_j2(J1, W1, J2, W2)`        | 球面兩點角距                                    | `angularSeparation`        |
| `h2g(z, a)`                    | 日心球面 → 地心球面                             | `heliocentricToGeocentric` |
| `shiChaJ(gst, L, fa, J, W)`    | 視差角                                          | `parallacticAngle`         |

### `angle-format.js`

| 原名                    | 含義                      | 新名                   |
| ----------------------- | ------------------------- | ---------------------- |
| `rad2strE(d, tim, ext)` | 弧度→字串（可指定小數位） | `formatRadianFull`     |
| `rad2str(d, tim)`       | 同上，保留 2 位           | `formatRadian`         |
| `rad2str2(d)`           | 弧度→字串（精確到分）     | `formatRadianToMinute` |
| `m2fm(v, fx, fs)`       | 角秒→分秒（三種格式）     | `formatArcSeconds`     |
| `str2rad(s, f)`         | 字串→弧度                 | `parseAngleToRadian`   |

> 字串內含「°」「′」「″」「h」「m」「s」「分」「秒」，已透過 i18n 字典 `astro.angle` 提供。

### 其他

| 原項                                       | 處置                         |
| ------------------------------------------ | ---------------------------- |
| `Number.prototype.toFixed` 重寫（IE6 bug） | **刪除**（IE6 早已不需支援） |

### 函式內局部變數沿用

| 函式                                                         | 沿用變數                                       |
| ------------------------------------------------------------ | ---------------------------------------------- |
| `normalizeAngle` / `normalizeAngleSigned`                    | `v`                                            |
| `balancedMod`                                                | `a`、`b`、`c`                                  |
| `sphericalToCartesian`                                       | `r`、`J`（經）、`W`（緯）、`R`（距離）         |
| `cartesianToSpherical`                                       | `r`、`x`、`y`、`z`                             |
| `rotateSpherical`                                            | `r`、`J`、`W`、`E`（旋轉角）                   |
| `equatorialToHorizon`                                        | `a`、`z`、`L`、`fa`、`gst`                     |
| `angularSeparation`                                          | `dJ`、`dW`                                     |
| `heliocentricToGeocentric`                                   | `z`（星體）、`a`（地球）                       |
| `parallacticAngle`                                           | `H`（時角）                                    |
| `formatRadianFull` / `formatRadian` / `formatRadianToMinute` | `s`、`w1`、`w2`、`w3`、`a`、`b`、`c`、`d`、`Q` |
| `formatArcSeconds`                                           | `gn`、`f`、`m`                                 |
| `parseAngleToRadian`                                         | `fh`、`s`                                      |

## B3：`eph0.js` 時間／座標／攝動

> 狀態：✅ 已定稿。範圍：`eph0.js` 第 215–670 行（ΔT、儒略日、歲差、章動、大氣折射、視差）。

### 檔案拆分

| 新檔                       | 內容                                            |
| -------------------------- | ----------------------------------------------- |
| `src/astro/delta-t.js`     | ΔT 計算表與函式                                 |
| `src/astro/julian-day.js`  | 儒略日換算、日期格式化、星期                    |
| `src/astro/precession.js`  | 歲差表與計算（IAU1976／IAU2000／P03）、歲差旋轉 |
| `src/astro/nutation.js`    | 章動（IAU2000B 高精度與中精度）                 |
| `src/astro/corrections.js` | 大氣折射、視差修正                              |

### `delta-t.js`

| 原名             | 含義                                 | 新名                |
| ---------------- | ------------------------------------ | ------------------- |
| `dt_at` (陣列)   | TD−UT1 計算表                        | `DELTA_T_TABLE`     |
| `dt_ext(y, jsd)` | 二次曲線外推                         | `extrapolateDeltaT` |
| `dt_calc(y)`     | 計算 ΔT（秒），傳入年份              | `computeDeltaT`     |
| `dt_T(t)`        | 傳入 JD（J2000 起算），回傳 ΔT（天） | `deltaT`            |

### `julian-day.js`

| 原名                            | 含義                            | 新名                                                                    |
| ------------------------------- | ------------------------------- | ----------------------------------------------------------------------- |
| `JD.JD(y, m, d)`                | 公曆→儒略日；`d` 可含小數天     | `gregorianToJD(year, month, day)`                                       |
| `JD.DD(jd)`                     | 儒略日→公曆物件                 | `jdToGregorian(jd)`                                                     |
| `JD.DD2str(r)`                  | 公曆物件→字串（到秒）           | `formatGregorian(g)`                                                    |
| `JD.DD2strPrecise(r)`           | 公曆物件→字串（到毫秒）         | `formatGregorianPrecise(g)`                                             |
| `JD.JD2str(jd)`                 | 儒略日→字串                     | `formatJD(jd)`                                                          |
| `JD.timeStr(jd)`                | 取 JD 的時間部分字串            | `formatTimeOfDay(jd)`                                                   |
| `JD.getWeek(jd)`                | 計算星期（0=日…6=六）           | `getWeekday(jd)`                                                        |
| `JD.nnweek(y, m, n, w)`         | 求 y 年 m 月第 n 個星期 w 的 JD | `jdOfNthWeekday(year, month, n, weekday)`                               |
| `JD.Weeks`                      | 星期名陣列                      | （已移除常數；星期名由 i18n 字典 `weekday.short`／`weekday.full` 提供） |
| `JD.Y / .M / .D / .h / .m / .s` | 共享狀態                        | **刪除**（去狀態化）                                                    |
| `JD.toJD()`                     | 自身狀態→JD                     | **刪除**（並入 `gregorianToJD`）                                        |
| `JD.setFromJD(jd)`              | JD→自身狀態                     | **刪除**（並入 `jdToGregorian`）                                        |

> **API 變化**：`jdToGregorian` 回傳鍵名由 `Y/M/D/h/m/s` 改為 `year/month/day/hour/minute/second`，下游讀取點於 B6／B8 一併調整。輸出值 bit-exact 不變。

### `precession.js`

| 原名                    | 含義                            | 新名                                       |
| ----------------------- | ------------------------------- | ------------------------------------------ |
| `preceTab_IAU1976`      | IAU1976 歲差表                  | `PRECESSION_TABLE_IAU1976`                 |
| `preceTab_IAU2000`      | IAU2000 歲差表                  | `PRECESSION_TABLE_IAU2000`                 |
| `preceTab_P03`          | P03 歲差表                      | `PRECESSION_TABLE_P03`                     |
| `prece(t, sc, mx)`      | 取得指定歲差量（`sc` 字串保留） | `precessionQuantity(jcy, quantity, model)` |
| `hcjj(t)`               | P03 黃赤交角（ε，obliquity）    | `meanObliquityP03`                         |
| `CDllr_J2D(t, llr, mx)` | 赤道球面座標：J2000 → Date      | `equatorialJ2000ToDate`                    |
| `CDllr_D2J(t, llr, mx)` | 赤道球面座標：Date → J2000      | `equatorialDateToJ2000`                    |
| `HDllr_J2D(t, llr, mx)` | 黃道球面座標：J2000 → Date      | `eclipticJ2000ToDate`                      |
| `HDllr_D2J(t, llr, mx)` | 黃道球面座標：Date → J2000      | `eclipticDateToJ2000`                      |

### `nutation.js`

| 原名                       | 含義                                          | 新名                           |
| -------------------------- | --------------------------------------------- | ------------------------------ |
| `nuTab` (陣列)             | IAU2000B 章動序列（高精度）；**內部結構不動** | `NUTATION_IAU2000B_SERIES`     |
| `nutation(t, zq)`          | 章動計算（高精度）                            | `nutation(jcy, minPeriodDays)` |
| `CDnutation(z, E, dL, dE)` | 把章動量套用到赤道座標                        | `applyEquatorialNutation`      |
| `nutB` (陣列)              | 中精度章動表                                  | `NUTATION_MEDIUM_TABLE`        |
| `nutation2(t)`             | 中精度章動                                    | `nutationMedium`               |
| `nutationLon2(t)`          | 中精度黃經章動                                | `nutationLongitudeMedium`      |

### `corrections.js`

| 原名                       | 含義                     | 新名                             |
| -------------------------- | ------------------------ | -------------------------------- |
| `MQC(h)`                   | 真高度 `h` 的大氣折射量  | `refractionFromTrueAltitude`     |
| `MQC2(ho)`                 | 視高度 `ho` 的大氣折射量 | `refractionFromApparentAltitude` |
| `parallax(z, H, fa, high)` | 視差修正（地心→站心）    | `applyParallax`                  |

## B4：`eph0.js` 週期項與基本天文工具

> 狀態：✅ 已定稿。範圍：`eph0.js` 第 678–1318 行（VSOP87 與 ELP 週期項、座標計算、光行差、平恆星時、時差、XL 高階曆元、月相與近遠點、太陽升降迭代）。  
> 地圖投影段（1319–1565）併入 B9（`vml.js`）審。

### 檔案拆分

| 新檔                         | 內容                                                               |
| ---------------------------- | ------------------------------------------------------------------ |
| `src/astro/vsop87.js`        | VSOP87 行星週期項表與行星座標計算                                  |
| `src/astro/elp-moon.js`      | ELP 月球週期項表與月球座標計算                                     |
| `src/astro/aberration.js`    | 太陽／月球光行差                                                   |
| `src/astro/sidereal-time.js` | 平恆星時、時差                                                     |
| `src/astro/ephemeris.js`     | XL 高階曆元 + 月相、月亮近遠點、地球近遠點、朔日編號、太陽升降迭代 |

### B4-a：`vsop87.js`／`elp-moon.js`／`aberration.js`／`sidereal-time.js`

#### `vsop87.js`

| 原名                         | 含義                                                        | 新名                                       |
| ---------------------------- | ----------------------------------------------------------- | ------------------------------------------ |
| `XL0`                        | VSOP87 行星週期項主表                                       | `VSOP87_PLANET_SERIES`                     |
| `XL0Pluto`                   | 冥王星週期項                                                | `PLUTO_SERIES`                             |
| `XL0_xzb`                    | 行星星曆修正表                                              | `PLANET_EPHEMERIS_CORRECTION_TABLE`        |
| `XL0_calc(xt, zn, t, n)`     | VSOP87 求值（`xt`=星體、`zn`=座標號、`t`=世紀數、`n`=項數） | `evalVSOP87(planetId, coord, jcy, nTerms)` |
| `pluto_coord(t)`             | 冥王星 J2000 直角座標                                       | `plutoCoord(jcy)`                          |
| `p_coord(xt, t, n1, n2, n3)` | 任一行星球面座標                                            | `planetCoord(planetId, jcy, n1, n2, n3)`   |
| `e_coord(t, n1, n2, n3)`     | 地球球面座標                                                | `earthCoord(jcy, n1, n2, n3)`              |

#### `elp-moon.js`

| 原名                     | 含義             | 新名                              |
| ------------------------ | ---------------- | --------------------------------- |
| `XL1`                    | ELP 月球週期項表 | `ELP_MOON_SERIES`                 |
| `XL1_calc(zn, t, n)`     | ELP 求值         | `evalELPMoon(coord, jcy, nRatio)` |
| `m_coord(t, n1, n2, n3)` | 月球球面座標     | `moonCoord(jcy, n1, n2, n3)`      |

#### `aberration.js`

| 原名             | 含義                 | 新名                      |
| ---------------- | -------------------- | ------------------------- |
| `gxc_sunLon(t)`  | 太陽黃經光行差       | `sunLongitudeAberration`  |
| `gxc_sunLat(t)`  | 太陽黃緯光行差（=0） | `sunLatitudeAberration`   |
| `gxc_moonLon(t)` | 月球黃經光行差       | `moonLongitudeAberration` |
| `gxc_moonLat(t)` | 月球黃緯光行差       | `moonLatitudeAberration`  |

#### `sidereal-time.js`

| 原名          | 含義                                    | 新名                     |
| ------------- | --------------------------------------- | ------------------------ |
| `pGST(T, dt)` | 平恆星時（`T`=UT 起算日數、`dt`=ΔT 日） | `meanSiderealTimeFromUT` |
| `pGST2(jd)`   | 平恆星時（`jd`=力學時 J2000 起算）      | `meanSiderealTimeFromTD` |
| `pty_zty(t)`  | 時差（高精度）                          | `equationOfTime`         |
| `pty_zty2(t)` | 時差（低精度，≤1 秒）                   | `equationOfTimeFast`     |

### B4-b：`ephemeris.js`

> XL 物件拆解為 named exports（不再 `XL.E_Lon`，改 `import { earthLongitude }`）。

| 原名                       | 含義                                  | 新名                          |
| -------------------------- | ------------------------------------- | ----------------------------- |
| `XL.E_Lon(t, n)`           | 地球黃經（Date 分點）                 | `earthLongitude`              |
| `XL.M_Lon(t, n)`           | 月球黃經（Date 分點）                 | `moonLongitude`               |
| `XL.E_v(t)`                | 地球角速度                            | `earthAngularVelocity`        |
| `XL.M_v(t)`                | 月球角速度                            | `moonAngularVelocity`         |
| `XL.MS_aLon(t, Mn, Sn)`    | 月日視黃經差                          | `moonSunApparentLongDiff`     |
| `XL.S_aLon(t, n)`          | 太陽視黃經                            | `sunApparentLongitude`        |
| `XL.E_Lon_t(W)`            | 已知地球真黃經求時間                  | `earthLongitudeToTime`        |
| `XL.M_Lon_t(W)`            | 已知真月球黃經求時間                  | `moonLongitudeToTime`         |
| `XL.MS_aLon_t(W)`          | 已知月日視黃經差求時間                | `moonSunDiffToTime`           |
| `XL.S_aLon_t(W)`           | 已知太陽視黃經反求時間                | `sunApparentLongToTime`       |
| `XL.MS_aLon_t1(W)`         | 同上，誤差 ≤40 秒                     | `moonSunDiffToTimeFast`       |
| `XL.S_aLon_t1(W)`          | 同上，誤差 ≤50 秒                     | `sunApparentLongToTimeFast`   |
| `XL.MS_aLon_t2(W)`         | 同上，誤差 ≤600 秒                    | `moonSunDiffToTimeFaster`     |
| `XL.S_aLon_t2(W)`          | 同上，誤差 ≤600 秒                    | `sunApparentLongToTimeFaster` |
| `XL.moonIll(t)`            | 月相照亮比例                          | `moonIlluminatedFraction`     |
| `XL.moonRad(r, h)`         | 月亮站心視半徑（角秒）                | `moonAngularRadius`           |
| `XL.moonMinR(t, min)`      | 月亮近／遠點                          | `moonPerigeeApogee`           |
| `XL.moonNode(t, asc)`      | 月亮升／降交點                        | `moonNode`                    |
| `XL.earthMinR(t, min)`     | 地球近／遠日點                        | `earthPerihelionAphelion`     |
| `suoN(jd)`                 | 朔日編號                              | `newMoonOrdinal`              |
| `sunShengJ(jd, L, fa, sj)` | 太陽升降迭代（`sj=-1` 升、`sj=1` 降） | `findSunRiseOrSet`            |

## B5：`ephB.js`

> 狀態：✅ 已定稿。範圍：`ephB.js` 全檔（恆星曆所需 SSB、光行差、引力偏轉、星座／恆星庫、多星計算）。

### 檔案拆分

| 新檔                   | 內容                                                  |
| ---------------------- | ----------------------------------------------------- |
| `src/astro/ssb.js`     | 地球在太陽系質心座標系的位置與速度數值表              |
| `src/astro/stellar.js` | 恆星周年光行差、引力偏轉、太陽 J2000 座標、多星曆計算 |
| `src/data/stars.js`    | 88 星座表、恆星庫，及檢索／格式化函式                 |

### `ssb.js`

| 原名       | 含義                         | 新名                       |
| ---------- | ---------------------------- | -------------------------- |
| `evTab`    | 地球 SSB 速度多項式表        | `EARTH_SSB_VELOCITY_TABLE` |
| `evSSB(t)` | 地球 SSB 速度（AU/儒略世紀） | `earthSSBVelocity`         |
| `epTab`    | 地心 SSB 座標多項式表        | `EARTH_SSB_POSITION_TABLE` |
| `epSSB(t)` | 地心 SSB 座標                | `earthSSBPosition`         |

### `stellar.js`

| 原名                         | 含義                       | 新名                              |
| ---------------------------- | -------------------------- | --------------------------------- |
| `ylpz(z, a)`                 | 引力偏轉                   | `gravitationalDeflection`         |
| `getGxcConst(t)`             | 取恆星光行差計算相關的常數 | `getStellarAberrationConstants`   |
| `HDzngxc(t, a)`              | 周年光行差黃道修正         | `applyEclipticAnnualAberration`   |
| `CDzngxc(t, a)`              | 周年光行差對赤道座標的影響 | `applyEquatorialAnnualAberration` |
| `scGxc(z, v, f)`             | 嚴格的恆星視差／光行差改正 | `rigorousStellarCorrection`       |
| `sun2000(t, n)`              | 太陽 J2000 球面座標        | `sunCoordJ2000`                   |
| `hxCalc(t, F, Q, lx, L, fa)` | 多顆恆星同時計算           | `computeStarEphemeris`            |

### `data/stars.js`

| 原名             | 含義                                      | 新名                |
| ---------------- | ----------------------------------------- | ------------------- |
| `xz88` (字串)    | 88 星座資料                               | `CONSTELLATIONS_88` |
| `HXK` (陣列)     | 恆星庫資料                                | `STAR_CATALOG`      |
| `schHXK(key)`    | 星庫檢索                                  | `searchStarCatalog` |
| `getHXK(s, all)` | 提取並格式化恆星庫（度分秒／角分秒→弧度） | `parseStarCatalog`  |

> `CONSTELLATIONS_88` 與 `STAR_CATALOG` 內含中英混雜字串；88 星座的中文名與族名透過 i18n 字典 `stars.*` 在 UI 顯示時替換。後續若需可將原資料拆分為中文名／英文名兩組欄位。

## B6：`eph.js`

> 狀態：✅ 已定稿（頂層識別字與物件名）。物件內部公開方法數量多，於實作時就近審；以 camelCase 原則改名。

### 檔案拆分

| 新檔                            | 內容                        |
| ------------------------------- | --------------------------- |
| `src/astro/rise-set.js`         | SZJ 日月升中天降            |
| `src/astro/planet-events.js`    | 行星天象函式族              |
| `src/astro/eclipse-geometry.js` | 線／圓／橢圓交點工具        |
| `src/astro/lunar-eclipse.js`    | msc 月食計算                |
| `src/astro/solar-eclipse.js`    | ecFast、rsGS、rsPL 日食計算 |

### `rise-set.js`

| 原名                               | 含義                     | 新名             |
| ---------------------------------- | ------------------------ | ---------------- |
| `SZJ` (物件)                       | 日月升中天降計算器       | `riseTransitSet` |
| `SZJ.L`                            | 站點經度                 | `.longitude`     |
| `SZJ.fa`                           | 站點緯度                 | `.latitude`      |
| `SZJ.dt`                           | ΔT（暫存）               | `.deltaT`        |
| `SZJ.E`                            | 黃赤交角（暫存）         | `.obliquity`     |
| `SZJ.getH(h, w)`                   | 給定地平緯度／赤緯求時角 | `.getHourAngle`  |
| `SZJ.Mcoord(jd, H0, r)`            | 月亮座標填入 `r`         | `.moonCoord`     |
| `SZJ.Mt(jd)`                       | 月亮升中降時刻           | `.moonRTS`       |
| `SZJ.Scoord(jd, xm, r)`            | 太陽座標填入 `r`         | `.sunCoord`      |
| `SZJ.St(jd)`                       | 太陽升中降時刻           | `.sunRTS`        |
| `SZJ.calcRTS(jd, n, Jdl, Wdl, sq)` | 多日升中降表             | `.multiDayRTS`   |

### `planet-events.js`

| 原名                           | 含義                         | 新名                      |
| ------------------------------ | ---------------------------- | ------------------------- |
| `xingJJ(xt, t, jing)`          | 行星距角                     | `planetElongation`        |
| `daJu(xt, t, dx)`              | 大距快速算法                 | `greatestElongation`      |
| `xingLiu0(xt, t, n, gxs)`      | 行星視座標                   | `planetApparentCoord`     |
| `xingLiu(xt, t, sn)`           | 行星留                       | `planetStation`           |
| `xingMP(xt, t, n, E, g)`       | 月亮行星視赤經差             | `moonPlanetRADiff`        |
| `xingHY(xt, t)`                | 行星合月（視赤經）           | `planetMoonConjunction`   |
| `xingSP(xt, t, n, w0, ts, tp)` | 行星太陽視黃經差與 `w0` 之差 | `planetSunLongDiffOffset` |
| `xingHR(xt, t, f=1)`           | 求衝或下合                   | `planetSunOpposition`     |
| `xingHR(xt, t, f=0)`           | 求合或下合                   | `planetSunConjunction`    |
| `xingX(xt, jd, L, fa)`         | 行星計算                     | `planetEphemeris`         |

> **`xingHR` 拆分為兩函式**：原以 `f` flag 分派；新版各自為命名函式（內部仍可共用實作）。

### `eclipse-geometry.js`

| 原名                                  | 含義                               | 新名                       |
| ------------------------------------- | ---------------------------------- | -------------------------- |
| `lineEll(x1,y1,z1, x2,y2,z2, e, r)`   | 空間線與地球（橢球）交點           | `lineEllipsoidIntersect`   |
| `lineEar2(x1,y1,z1, x2,y2,z2, e,r,I)` | 同上，貝塞爾座標參數               | `lineEarthIntersectBessel` |
| `lineEar(P, Q, gst)`                  | 分點座標中線與地球的交點，回傳地標 | `lineEarthIntersect`       |
| `cirCir(R, R2, x0, y0)`               | 兩圓交點                           | `circleCircleIntersect`    |
| `cirOvl(R, ba, R2, x0, y0)`           | 橢圓與圓交點                       | `ellipseCircleIntersect`   |
| `lineOvl(x1, y1, dx, dy, r, ba)`      | 線與橢圓交點                       | `lineEllipseIntersect`     |

### `lunar-eclipse.js`

| 原名          | 含義         | 新名                  |
| ------------- | ------------ | --------------------- |
| `msc` (物件)  | 月食計算器   | `lunarEclipse`        |
| `ysPL.lineT`  | 直線與圓交點 | `lunarEclipse.lineT`  |
| `ysPL.lecXY`  | 月影 XY 座標 | `lunarEclipse.lecXY`  |
| `ysPL.lecMax` | 月食食甚搜尋 | `lunarEclipse.lecMax` |

> 原 `ysPL` 物件雖列於日食檔案，但其 `lineT`／`lecXY`／`lecMax` 三個方法實際服務於月食計算，
> 重新命名時併入 `lunarEclipse`，其餘 19 個貝塞爾元素相關方法保留於日食檔案（見下節）。

### `solar-eclipse.js`

| 原名          | 含義                       | 新名                     |
| ------------- | -------------------------- | ------------------------ |
| `ecFast(jd)`  | 快速日食搜索               | `fastSolarEclipseSearch` |
| `rsGS` (物件) | 日食貝塞爾元素引擎         | `solarEclipseBesselian`  |
| `rsPL` (物件) | 站心日食＋全域路徑批量計算 | `solarEclipseLocal`      |

> **舊版命名混淆更正**：原 `rsGS`／`rsPL` 的字面含義（GS≈全球、PL≈local）與物件內方法的實際職責恰好相反——
> `rsGS` 內含 `init`／`feature` 等貝塞爾元素相關運算（全球視角的事件特徵），`rsPL` 才是站心日食與全域路徑的計算器（提供 `secMax`、`nbj` 等方法）。
> 重新命名時依「方法實際職責」而非字面縮寫對應到新名；另外原 `ysPL` 物件中三個服務於月食的方法則併入 `lunarEclipse`（見上節）。
> 兩物件的內部公開方法於實作時就近審視。

## B7：`JW.js`

> 狀態：✅ 已定稿。範圍：`JW.js` 全檔（城市經緯壓縮資料、解碼器、時區資料）。

### 檔案拆分

| 新檔                    | 內容                        |
| ----------------------- | --------------------------- |
| `src/data/cities.js`    | 城市經緯度壓縮資料 + 解碼器 |
| `src/data/timezones.js` | 國家／地區時區資料          |

### `cities.js`

| 原名          | 含義                                                                    | 新名                                                              |
| ------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `JWv` (陣列)  | 各省／自治區的城市清單（每項：省名 + 多個「4 字元壓縮經緯碼＋城市名」） | `CITY_REGIONS`                                                    |
| `JWdecode(v)` | 解 4 字元壓縮碼為經緯度（弧度）                                         | `decodeCityCoord(code)`（純函式，回傳 `{ longitude, latitude }`） |

> **API 變化**：`JWdecode` 由建構式（`new JWdecode(v).J/W`）改為純函式回傳物件 `{ longitude, latitude }`。bit-exact 不變；下游用到 `J/W` 之處於實作階段一併調整。

### `timezones.js`

| 原名         | 含義                       | 新名               |
| ------------ | -------------------------- | ------------------ |
| `SQv` (陣列) | 各大洲的國家／地區時區清單 | `TIMEZONE_REGIONS` |

> `SQv` 字串內以 `#`／`##` 分隔欄位（時差、夏令時規則、代表城市）；本表僅敲定外層名稱，欄位細部解析於 UI 實作時補上。

### 模組載入修補

原檔尾以 `for(i=0;i<JWv.length;i++) JWv[i] = JWv[i].split(" ");` 處理；`i` 未宣告 `var` 而洩漏到全域。新版改 `for (let i = ...)` 修補此全域汙染，輸出不變。`SQv` 同樣處理。

### i18n 註記

`CITY_REGIONS`、`TIMEZONE_REGIONS` 內所有省名、城市名、國家名為簡體中文；簡↔繁對照表已建立於 i18n 字典（`cities`／`timezones`），含臺灣慣用詞（如「悉尼／雪梨」「韓國」「烏茲別克」等）。

## B8：`lunar.js`

> 狀態：✅ 已定稿（頂層識別字與物件公開介面）。日／月物件細部欄位（`Lyear`／`Lmc`／`Ldi`／`Hyear`／`jqmc` 等約 50 個）於 `LunarMonth` 實作時就近審。

### 檔案拆分

| 新檔                          | 內容                                     |
| ----------------------------- | ---------------------------------------- |
| `src/lunar/gregorian-base.js` | oba 公曆基礎構件                         |
| `src/lunar/chinese-base.js`   | obb 農曆基礎構件                         |
| `src/lunar/ssq.js`            | SSQ 實朔實氣計算器                       |
| `src/lunar/lunar-month.js`    | Lunar() → `LunarMonth`                   |
| `src/lunar/year-calendar.js`  | nianLiHTML／nianLi2HTML 年曆 HTML 產生器 |

### 頂層識別字

| 原名               | 含義             | 新名                       |
| ------------------ | ---------------- | -------------------------- |
| `oba` (物件)       | 公曆基礎構件     | `gregorianBase`            |
| `obb` (物件)       | 農曆基礎構件     | `chineseBase`              |
| `SSQ` (物件)       | 實朔實氣計算器   | `shuoQiCalculator`         |
| `Lunar()` (建構式) | 月曆物件         | `LunarMonth` (class)       |
| `nianLiHTML`       | 年曆 HTML 產生器 | `renderYearCalendarHTML`   |
| `nianLi2HTML`      | 年曆 HTML 變體   | `renderYearCalendarV2HTML` |

### `gregorian-base.js` (`oba`)

| 原名               | 含義                                 | 新名                   |
| ------------------ | ------------------------------------ | ---------------------- |
| `wFtv` (陣列)      | 月內第 N 個星期幾的節日表            | `WEEKDAY_FESTIVALS`    |
| `sFtv` (字串)      | 陽曆日期固定節日表（由 init 初始化） | `SOLAR_DATE_FESTIVALS` |
| `init()`           | 初始化                               | `init`                 |
| `getDayName(u, r)` | 取某日節日                           | `getDayName`           |
| `getHuiLi(d0, r)`  | 回曆計算                             | `getHijriDate`         |

### `chinese-base.js` (`obb`)

#### 資料表（內容字串透過 i18n 字典 `lunar.*` 提供）

| 原名    | 含義                 | 新名                   |
| ------- | -------------------- | ---------------------- |
| `JNB`   | 紀年表（年號／皇帝） | `REIGN_TITLES`         |
| `numCn` | 中文數字             | `CHINESE_NUMERALS`     |
| `Gan`   | 天干                 | `HEAVENLY_STEMS`       |
| `Zhi`   | 地支                 | `EARTHLY_BRANCHES`     |
| `ShX`   | 生肖                 | `ZODIAC_ANIMALS`       |
| `XiZ`   | 西洋星座             | `WESTERN_ZODIAC_SIGNS` |
| `yxmc`  | 月相名稱             | `LUNAR_PHASE_NAMES`    |
| `jqmc`  | 24 節氣名稱          | `SOLAR_TERM_NAMES`     |
| `ymc`   | 月名稱（建寅）       | `LUNAR_MONTH_NAMES`    |
| `rmc`   | 日名稱（初一…卅一）  | `LUNAR_DAY_NAMES`      |

#### 方法

| 原名                    | 含義                 | 新名                            |
| ----------------------- | -------------------- | ------------------------------- |
| `init()`                | 初始化（解壓 `JNB`） | `init`                          |
| `getNH(y)`              | 取年號               | `getReignTitle`                 |
| `getDayName(u, r)`      | 計算農曆節日         | `getLunarDayName`               |
| `mingLiBaZi(jd, J, ob)` | 命理八字計算         | `computeBazi`                   |
| `qi_accurate(W)`        | 精氣（給定黃經）     | `preciseSolarTermFromLongitude` |
| `so_accurate(W)`        | 精朔（給定黃經差）   | `preciseNewMoonFromLongitude`   |
| `qi_accurate2(jd)`      | 精氣（給定 JD）      | `preciseSolarTermFromJD`        |
| `so_accurate2(jd)`      | 精朔（給定 JD）      | `preciseNewMoonFromJD`          |

### `ssq.js` (`SSQ`)

#### 資料表（古曆朔閏資料，內容不動）

| 原名    | 含義             | 新名                       |
| ------- | ---------------- | -------------------------- |
| `SB`    | 朔修正表（壓縮） | `NEW_MOON_CORRECTIONS`     |
| `QB`    | 氣修正表（壓縮） | `SOLAR_TERM_CORRECTIONS`   |
| `suoKB` | 朔直線擬合參數   | `NEW_MOON_LINEAR_COEFFS`   |
| `qiKB`  | 氣直線擬合參數   | `SOLAR_TERM_LINEAR_COEFFS` |

#### 輸出陣列

| 原名 | 含義                                 | 新名            |
| ---- | ------------------------------------ | --------------- |
| `ym` | 各月名稱                             | `monthNames`    |
| `ZQ` | 中氣表（亦含 `.liqiu` 立秋 JD 屬性） | `centralQiList` |
| `HS` | 合朔表                               | `newMoonList`   |
| `dx` | 各月大小（30/29）                    | `monthLengths`  |
| `Yn` | 年計數                               | `yearCount`     |

#### 方法

| 原名           | 含義           | 新名                     |
| -------------- | -------------- | ------------------------ |
| `so_low(W)`    | 低精度定朔     | `newMoonLowPrecision`    |
| `qi_low(W)`    | 低精度節氣     | `solarTermLowPrecision`  |
| `qi_high(W)`   | 較高精度氣     | `solarTermHighPrecision` |
| `so_high(W)`   | 較高精度朔     | `newMoonHighPrecision`   |
| `jieya(s)`     | 氣朔解壓縮     | `decompressCorrections`  |
| `init()`       | 初始化         | `init`                   |
| `calc(jd, qs)` | 主計算         | `calc(jd, type)`         |
| `calcY(jd)`    | 農曆排月序計算 | `calcYear`               |

### `lunar-month.js` (`LunarMonth`)

| 原名                      | 含義                 | 新名                                |
| ------------------------- | -------------------- | ----------------------------------- |
| `Lunar()`                 | 月物件建構式         | `LunarMonth` (class)                |
| `Lunar.yueLiCalc(By, Bm)` | 計算公曆某月的三合曆 | `LunarMonth.calcMonth(year, month)` |

> `LunarMonth` 實例欄位（`lun.y/Ly/ShX/nianhao/lun[i].*` 等約 50 個）於實作時就近審。

## B9：`vml.js` + `eph0.js` 地圖投影段

> 狀態：✅ 已定稿。範圍：`vml.js` 全檔（283 行）＋ `eph0.js` 第 1319–1565 行地圖投影段。

### 檔案拆分

| 新檔                             | 內容                                          |
| -------------------------------- | --------------------------------------------- |
| `src/ui/canvas/draw-helpers.js`  | 低階繪圖原語（`ht_*`）                        |
| `src/ui/canvas/eclipse-views.js` | 三個日月食視圖物件（tu1／tu2／tu3）           |
| `src/ui/canvas/projections.js`   | 地圖投影（touY）                              |
| `src/data/world-map.js`          | 世界地圖編碼資料與解碼器（dituJM、ditu0/1/2） |

### `draw-helpers.js`

| 原名                                 | 含義           | 新名                |
| ------------------------------------ | -------------- | ------------------- |
| `ht_init(can)`                       | 繪圖物件初始化 | `initCanvas`        |
| `ht_oval1(ctx, x, y, r, col)`        | 畫空心圓       | `drawCircleOutline` |
| `ht_oval2(ctx, x, y, r, col)`        | 畫實心圓       | `drawCircleFilled`  |
| `ht_line(ctx, x1, y1, x2, y2, col)`  | 畫線           | `drawLine`          |
| `ht_text(ctx, x, y, txt, col, font)` | 繪文本         | `drawText`          |

### `eclipse-views.js`

| 原名         | 含義                | 新名                |
| ------------ | ------------------- | ------------------- |
| `tu1` (物件) | 站心觀測視圖        | `eclipseLocalView`  |
| `tu2` (物件) | 影軸-貝塞爾交線視圖 | `eclipseAxisView`   |
| `tu3` (物件) | 全球地圖視圖        | `eclipseGlobalView` |

#### `eclipseLocalView`（tu1）方法

| 原名                                 | 含義             | 新名                        |
| ------------------------------------ | ---------------- | --------------------------- |
| `showzb()`                           | 顯示座標         | `showCoordinates`           |
| `draw1(sm, J, W, bei)`               | 地平座標中畫日月 | `drawHorizonView`           |
| `draw1b(sm, J, W, gst)`              | 時角座標中畫日月 | `drawHourAngleView`         |
| `draw2a(J1, W1, J2, W2, mr, sr)`     | 日食放大圖       | `drawSolarEclipseMagnified` |
| `draw2b(J1, W1, J2, W2, mr, er, Er)` | 月食放大圖       | `drawLunarEclipseMagnified` |
| `draw3(J, W, bl)`                    | 畫日食中心線     | `drawCenterLine`            |

#### `eclipseAxisView`（tu2）方法

| 原名            | 含義              | 新名            |
| --------------- | ----------------- | --------------- |
| `line1(as, hd)` | 畫影軸-貝塞爾交線 | `drawAxisLines` |

#### `eclipseGlobalView`（tu3）方法

| 原名                            | 含義                  | 新名                 |
| ------------------------------- | --------------------- | -------------------- |
| `lineArr(d, color)`             | 畫曲線（成串線段）    | `drawPolyline`       |
| `drawJWQ(n, m)`                 | 畫經緯圈              | `drawLatLonGrid`     |
| `lineNN(p1, n1, p2, n2, color)` | 連接 p1[n1] 到 p2[n2] | `drawSegmentBetween` |
| `draw(F, J0, W0, eR, jb, tylx)` | 主繪圖                | `drawMap`            |
| `draw2(F)`                      | 變體                  | `drawMapV2`          |

### `projections.js`

| 原名                    | 含義                         | 新名                          |
| ----------------------- | ---------------------------- | ----------------------------- |
| `touY` (物件)           | 投影工具集                   | `mapProjections`              |
| `MollCZ(W)`             | 摩爾威特投影插值法求 y 值    | `mollweideInterpolate`        |
| `toxy0(J, W, a)`        | 平面正投                     | `orthographicProjection`      |
| `toxy1(J, W, a)`        | 斜軸等距方位投影             | `azimuthalEquidistantOblique` |
| `toxy2(J, W, a)`        | 斜軸等積方位投影             | `azimuthalEqualAreaOblique`   |
| `toxy3(J, W, a)`        | 斜軸等角方位投影（立體投影） | `stereographicOblique`        |
| `toxy4(J, W, a)`        | 摩爾威特投影                 | `mollweideProjection`         |
| `toxy5(J, W, a)`        | 正軸等距圓柱                 | `cylindricalEquidistant`      |
| `toxy6(J, W, a)`        | 正軸等角圓柱                 | `cylindricalConformal`        |
| `toxy7(J, W, a)`        | 多圓錐投影                   | `polyconicProjection`         |
| `toxy8(J, W, a)`        | 中國燈籠投影（sxwnl 獨有）   | `chineseLanternProjection`    |
| `toxy(J, W, a)`         | 預設（不投影）               | `identityProjection`          |
| `setlx(lx, J0, W0, jb)` | 設置投影類型                 | `setProjectionType`           |
| `lineArr(d)`            | 對線段套用當前投影           | `projectLineSegments`         |

### `data/world-map.js`

| 原名                | 含義                                     | 新名                 |
| ------------------- | ---------------------------------------- | -------------------- |
| `dituJM(p, Jb, Wb)` | 地圖串解碼                               | `decodeMapData`      |
| `ditu0` (字串)      | 低解析地圖：2009×970 點對應 360°×180°    | `WORLD_MAP_LOW_RES`  |
| `ditu1` (字串)      | 高解析地圖：4200×2100 點                 | `WORLD_MAP_HIGH_RES` |
| `ditu2` (字串)      | 附加地圖資料（用途待釐清，加 TODO 註解） | `WORLD_MAP_EXTRA`    |

### i18n 註記

`drawAxisLines` 內含中文字串「貝黃交線」「貝赤交線」「影軸-貝塞爾交線」等繪文本內容；後續若需可抽入 i18n 字典。

## B10：`help.js` + `page_gj.js`

> 狀態：✅ 已定稿。範圍：`help.js`（含中文 HTML 說明字串）＋ `page_gj.js`（工具頁日期／PI 計算）。

### 檔案拆分

| 新檔                              | 內容                                       |
| --------------------------------- | ------------------------------------------ |
| `src/ui/help.js`                  | `showHelp` 函式（內容後續若需可抽入 i18n） |
| `src/ui/pages/tools/date-calc.js` | 工具 1：JD／日期轉換                       |
| `src/ui/pages/tools/pi-calc.js`   | 工具 2：圓周率計算                         |

### `help.js`

| 原名          | 含義                   | 新名                |
| ------------- | ---------------------- | ------------------- |
| `showHelp(f)` | 顯示／隱藏浮動說明面板 | `showHelp(panelId)` |

> 函式名已英文，沿用；參數 `f` → `panelId`。內容字串後續若需可抽入 i18n 字典。

### `pages/tools/date-calc.js`

| 原名            | 含義                                     | 新名                        |
| --------------- | ---------------------------------------- | --------------------------- |
| `GJ1_calc1()`   | JD → 公曆日期字串                        | `convertJDToDate`           |
| `GJ1_calc2(fs)` | 日期計算（加偏移／年內積日／兩日期相減） | `calculateDateOffset(mode)` |

### `pages/tools/pi-calc.js`

#### 函式

| 原名            | 含義                          | 新名                  |
| --------------- | ----------------------------- | --------------------- |
| `GJ2_pi1(fs)`   | 劉徽割圓術                    | `liuHuiCircleCutting` |
| `GJ2_jie(x, B)` | 截斷至與 `B` 同有效位數       | `truncateToDigits`    |
| `GJ2_pi2()`     | 祖沖之 π 計算（模擬古人算法） | `zuChongzhiPI`        |
| `GJ2_pi()`      | 簡易 PI 計算（連分式）        | `simplePI`            |
| `GJ2_cls()`     | 清空輸出                      | `clearToolOutput`     |

#### Machin 物件

| 原名                            | 含義                  | 新名                           |
| ------------------------------- | --------------------- | ------------------------------ |
| `GJ2_machin`                    | Machin 公式 PI 計算器 | `machinPICalculator`           |
| `GJ2_machin.add(a, b, n)`       | 多精度加              | `.add`                         |
| `GJ2_machin.sub0(a, b, r, n)`   | 多精度減              | `.sub`                         |
| `GJ2_machin.div(a, b, n)`       | 多精度除              | `.div`                         |
| `GJ2_machin.dao(a, f, b, n)`    | 倒數 `f/b`            | `.reciprocal`                  |
| `GJ2_machin.set(a, v, n)`       | 陣列置 0 並設首位     | `.setArray`                    |
| `GJ2_machin.a / .b / .c`        | 工作數組              | `.workA` / `.workB` / `.workC` |
| `GJ2_machin.arctg(k, v, zf, N)` | arctan 計算           | `.arctan`                      |
| `GJ2_machin.pi()`               | 主計算                | `.compute`                     |

> **歷史人名譯名約定**：原作者及主社群為簡體中文，Machin（John Machin, 1706）的簡中譯名為「馬青」，繁中（臺灣）譯名為「梅欽」。新版繁中註解／i18n 文件採用「梅欽」，簡中採用「馬青」。劉徽（Liu Hui）與祖沖之（Zu Chongzhi）為中國數學史人物，兩岸譯名相同，沿用原名。

## B11：HTML input IDs

> 狀態：✅ 已定稿。範圍：全部 `.htm` 入口頁的 `id` 屬性，~136 個。本表敲定**命名規則與 prefix／suffix 對映**；個別 ID 重命名於各分頁元件實作時就近處理。

### 命名規則

1. **格式**：kebab-case（HTML 標準），全小寫，連字號分隔。
2. **結構**：`<panel-prefix>-<purpose>[-<modifier>]`，如 `eclipse-year`、`local-eclipse-nasa-mode`。
3. **不再依賴瀏覽器自動把 `id` 暴露為 `window` 屬性**——所有讀取改用 `document.getElementById(...)` 或 `data-*` 綁定。
4. **避免單字母 ID**；語意化命名（直譯欄位意義，不保留拼音首字母）。

### Panel Prefix 對映

| 原 prefix | 中文含義 | 新 prefix           |
| --------- | -------- | ------------------- |
| `Cal*`    | 月曆     | `cal-`              |
| `Cb*`     | 日月食   | `eclipse-`          |
| `Cc*`     | 地方食   | `local-eclipse-`    |
| `Cd*`     | 星曆     | `ephemeris-`        |
| `Ce*`     | 天象     | `celestial-`        |
| `Cf*`     | 恆星     | `stars-`            |
| `Cml*`    | 命理     | `mingli-`           |
| `Cp2*`    | 年曆     | `year-cal-`         |
| `Cp8*`    | 氣朔     | `shuoqi-`           |
| `Cp9*`    | 升降     | `rise-set-`         |
| `Cp10*`   | 日食概略 | `eclipse-outline-`  |
| `Cp11*`   | 八字     | `mingli-`（同 Cml） |
| `Sel*`    | 共用選單 | `select-`           |
| `GJ1*`    | 日期工具 | `date-tool-`        |
| `GJ2*`    | PI 工具  | `pi-tool-`          |
| `Can*`    | Canvas   | `canvas-`           |
| `page*`   | 分頁面板 | `page-`             |

> `Cml*` 與 `Cp11*` 同歸 `mingli-` 前綴；保留原作命理區塊的獨立性（命理為廣義範疇，八字為其下分支）。

### 共用 Suffix 詞彙

| 原 suffix | 新 suffix          | 含義             |
| --------- | ------------------ | ---------------- |
| `_y`      | `-year`            | 年               |
| `_m`      | `-month`           | 月               |
| `_d`      | `-day`             | 日               |
| `_t`      | `-time`            | 時間（時:分:秒） |
| `_J`      | `-longitude`       | 經度             |
| `_W`      | `-latitude`        | 緯度             |
| `_high`   | `-altitude`        | 海拔             |
| `_ut`     | `-utc-mode`        | UTC／TD 模式     |
| `_bei`    | `-from-north`      | 正北為 0 度      |
| `_nasa`   | `-nasa-mode`       | NASA 模式        |
| `_step`   | `-step`            | 步長             |
| `_n`      | `-count`           | 個數             |
| `_dt`     | `-interval`        | 間隔             |
| `_lx`     | `-type`            | 類型             |
| `_jd`     | `-jd`              | 儒略日           |
| `_out`    | `-output`          | 輸出區           |
| `_zb`     | `-coords`          | 座標             |
| `_pause`  | `-pause`           | 暫停             |
| `_phSave` | `-save-path`       | 儲存路徑         |
| `_sjzb`   | `-hour-angle-mode` | 時角座標         |

### 對映示例（panel B / Cb 日月食）

| 原 ID             | 新 ID                                   |
| ----------------- | --------------------------------------- |
| `Cb_y`            | `eclipse-year`                          |
| `Cb_m`            | `eclipse-month`                         |
| `Cb_d`            | `eclipse-day`                           |
| `Cb_t`            | `eclipse-time`                          |
| `Cb_ut`           | `eclipse-utc-mode`                      |
| `Cb_J`            | `eclipse-longitude`                     |
| `Cb_W`            | `eclipse-latitude`                      |
| `Cb_high`         | `eclipse-altitude`                      |
| `Cb_bei`          | `eclipse-from-north`                    |
| `Cb_sjzb`         | `eclipse-hour-angle-mode`               |
| `Cb_nasa`         | `eclipse-nasa-mode`                     |
| `Cb_phSave`       | `eclipse-save-path`                     |
| `Cb_step`         | `eclipse-step`                          |
| `Cb_zb`           | `eclipse-coords`                        |
| `Cb`              | `eclipse-form`                          |
| `Cb0`             | `eclipse-result`                        |
| `Cb_b1` / `Cb_b2` | `eclipse-button-1` / `eclipse-button-2` |

> 其餘 panel（Cal、Cc、Cd、Ce、Cf、Cml/Cp11、Cp2/8/9/10）依同樣規則套用。

### 散見 ID 處置

| 原 ID               | 含義         | 新 ID                                    |
| ------------------- | ------------ | ---------------------------------------- |
| `help`              | 浮動說明面板 | `help-panel`                             |
| `out`               | 通用輸出區   | `output`                                 |
| `year`              | 動態時鐘年份 | `clock-year`                             |
| `testN`             | 測試遺留     | **刪除**                                 |
| `progText`          | 進度文字     | `progress-text`                          |
| `Clock1` / `Clock2` | 動態時鐘容器 | `clock-1` / `clock-2`                    |
| `Cjg`               | 結果輸出     | `result-output`                          |
| `Ck` / `Ck0`        | 用途不明     | 暫 `unknown-ck` / `unknown-ck0`，加 TODO |
| `Cn`                | 用途不明     | 暫 `unknown-cn`，加 TODO                 |
| `pan_1`             | 面板         | `panel-1`                                |

### 後續處理慣例

1. 新 RWD 單頁不再有 13 個獨立 panel `<div>`；改為分頁元件（route 或 tab）。
2. 每個分頁元件（如 `src/ui/pages/eclipse.js`）自管 DOM；輸入 ID 在元件內部命名，模組外不可見。
3. 跨元件共用的全域 ID（如 `help-panel`、`output`、`clock-1/2`）保留於 `index.html`。
4. 本批 prefix／suffix 為各分頁元件實作時的命名慣例。
