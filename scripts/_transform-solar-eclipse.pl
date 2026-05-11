#!/usr/bin/env perl
# 將 solar-eclipse 相關段落的識別字依 glossary 重命名。
# 僅做機械式 token 替換；不變更控制流程或數值。

# 函式重命名
s/\bXL0_calc\(/evalVSOP87(/g;
s/\bXL1_calc\(/evalELPMoon(/g;
s/\bp_coord\(/planetCoord(/g;
s/\be_coord\(/earthCoord(/g;
s/\bm_coord\(/moonCoord(/g;
s/\bdt_T\(/deltaT(/g;
s/\bhcjj\(/meanObliquityP03(/g;
s/\bprece\(/precessionQuantity(/g;
s/\bCDllr_J2D\(/equatorialJ2000ToDate(/g;
s/\bCDllr_D2J\(/equatorialDateToJ2000(/g;
s/\bHDllr_J2D\(/eclipticJ2000ToDate(/g;
s/\bHDllr_D2J\(/eclipticDateToJ2000(/g;
s/\bCDnutation\(/applyEquatorialNutation(/g;
s/\bnutationLon2\(/nutationLongitudeMedium(/g;
s/\bnutation2\(/nutationMedium(/g;
s/\bMQC2\(/refractionFromApparentAltitude(/g;
s/\bMQC\(/refractionFromTrueAltitude(/g;
s/\bparallax\(/applyParallax(/g;
s/\bsuoN\(/newMoonOrdinal(/g;
s/\bsunShengJ\(/findSunRiseOrSet(/g;
s/\bpGST2\(/meanSiderealTimeFromTD(/g;
s/\bpGST\(/meanSiderealTimeFromUT(/g;
s/\bpty_zty2\(/equationOfTimeFast(/g;
s/\bpty_zty\(/equationOfTime(/g;
s/\bgxc_sunLon\(/sunLongitudeAberration(/g;
s/\bgxc_sunLat\(/sunLatitudeAberration(/g;
s/\bgxc_moonLon\(/moonLongitudeAberration(/g;
s/\bgxc_moonLat\(/moonLatitudeAberration(/g;
s/\brad2mrad\(/normalizeAngle(/g;
s/\brad2rrad\(/normalizeAngleSigned(/g;
s/\bmod2\(/balancedMod(/g;
s/\bllr2xyz\(/sphericalToCartesian(/g;
s/\bxyz2llr\(/cartesianToSpherical(/g;
s/\bllrConv\(/rotateSpherical(/g;
s/\bCD2DP\(/equatorialToHorizon(/g;
s/\bj1_j2\(/angularSeparation(/g;
s/\bh2g\(/heliocentricToGeocentric(/g;
s/\bshiChaJ\(/parallacticAngle(/g;
s/\brad2strE\(/formatRadianFull(/g;
s/\brad2str2\(/formatRadianToMinute(/g;
s/\brad2str\(/formatRadian(/g;
s/\bm2fm\(/formatArcSeconds(/g;
s/\bstr2rad\(/parseAngleToRadian(/g;
s/\blineEll\(/lineEllipsoidIntersect(/g;
s/\blineEar2\(/lineEarthIntersectBessel(/g;
s/\blineEar\(/lineEarthIntersect(/g;
s/\bcirOvl\(/ellipseCircleIntersect(/g;
s/\blineOvl\(/lineEllipseIntersect(/g;

# XL 物件成員 → named functions
s/\bXL\.E_Lon_t\b/earthLongitudeToTime/g;
s/\bXL\.M_Lon_t\b/moonLongitudeToTime/g;
s/\bXL\.MS_aLon_t2\b/moonSunDiffToTimeFaster/g;
s/\bXL\.S_aLon_t2\b/sunApparentLongToTimeFaster/g;
s/\bXL\.MS_aLon_t\b/moonSunDiffToTime/g;
s/\bXL\.S_aLon_t\b/sunApparentLongToTime/g;
s/\bXL\.E_Lon\b/earthLongitude/g;
s/\bXL\.M_Lon\b/moonLongitude/g;
s/\bXL\.E_v\b/earthAngularVelocity/g;
s/\bXL\.M_v\b/moonAngularVelocity/g;
s/\bXL\.MS_aLon\b/moonSunApparentLongDiff/g;
s/\bXL\.S_aLon\b/sunApparentLongitude/g;
s/\bXL\.moonIll\b/moonIlluminatedFraction/g;
s/\bXL\.moonRad\b/moonAngularRadius/g;
s/\bXL\.moonMinR\b/moonPerigeeApogee/g;
s/\bXL\.moonNode\b/moonNode/g;
s/\bXL\.earthMinR\b/earthPerihelionAphelion/g;

# JD 物件成員
s/\bJD\.JD2str\(/formatJD(/g;
s/\bJD\.timeStr\(/formatTimeOfDay(/g;
s/\bJD\.JD\(/gregorianToJD(/g;
s/\bJD\.DD\(/jdToGregorian(/g;

# Math 別名（必須最後做，避免與其他帶這些名稱的識別字衝突）
s/(?<![A-Za-z0-9_.])int2\(/Math.floor(/g;
s/(?<![A-Za-z0-9_.])sin\(/Math.sin(/g;
s/(?<![A-Za-z0-9_.])cos\(/Math.cos(/g;
s/(?<![A-Za-z0-9_.])tan\(/Math.tan(/g;
s/(?<![A-Za-z0-9_.])asin\(/Math.asin(/g;
s/(?<![A-Za-z0-9_.])acos\(/Math.acos(/g;
s/(?<![A-Za-z0-9_.])atan2\(/Math.atan2(/g;
s/(?<![A-Za-z0-9_.])atan\(/Math.atan(/g;
s/(?<![A-Za-z0-9_.])sqrt\(/Math.sqrt(/g;
s/(?<![A-Za-z0-9_.])abs\(/Math.abs(/g;
s/(?<![A-Za-z0-9_.])floor\(/Math.floor(/g;

# 常數識別字
s/\bpi2\b/TWO_PI/g;
s/\bpi_2\b/HALF_PI/g;
s/\bcs_rEarA\b/EARTH_MEAN_RADIUS_KM/g;
s/\bcs_rEar\b/EARTH_EQUATORIAL_RADIUS_KM/g;
s/\bcs_ba2\b/EARTH_POLAR_EQ_RATIO_SQ/g;
s/\bcs_ba\b/EARTH_POLAR_EQ_RATIO/g;
s/\bcs_AU\b/AU_KM/g;
s/\bcs_sinP\b/SIN_SOLAR_PARALLAX/g;
s/\bcs_PI\b/SOLAR_PARALLAX/g;
s/\bcs_GS\b/SPEED_OF_LIGHT_KM_S/g;
s/\bcs_Agx\b/LIGHT_TIME_PER_AU_JCY/g;
s/\bcs_xxHH\b/SYNODIC_PERIODS/g;
s/\bxxName\b/PLANET_NAMES/g;
s/\bcs_k2\b/MOON_EARTH_RATIO_UMBRA/g;
s/\bcs_k0\b/SUN_EARTH_RATIO/g;
s/\bcs_k\b/MOON_EARTH_RATIO_PENUMBRA/g;
s/\bcs_sMoon2\b/MOON_RADIUS_FACTOR_UMBRA/g;
s/\bcs_sMoon\b/MOON_RADIUS_FACTOR_PENUMBRA/g;
s/\bcs_sSun\b/SUN_RADIUS_ARCSEC/g;
s/\bradd\b/RAD_TO_DEG/g;
s/\brad\b/RAD_TO_ARCSEC/g;

# 物件外殼
s/^var ysPL\s*=\s*\{/export const solarEclipseBesselian = {/;
s/^var rsGS\s*=\s*\{/export const solarEclipseLocal = {/;
s/^var rsPL\s*=\s*\{/export const solarEclipseBatch = {/;
s/^function ecFast\(/export function fastSolarEclipseSearch(/;
