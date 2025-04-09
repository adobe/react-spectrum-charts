/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { TimeLocale } from 'vega';

import { TimeLocaleCode } from '../../types/locale.types';
import areg from './ar-EG.json';
import arsy from './ar-SY.json';
import caes from './ca-ES.json';
import cscz from './cs-CZ.json';
import dadk from './da-DK.json';
import dech from './de-CH.json';
import dede from './de-DE.json';
import enca from './en-CA.json';
import engb from './en-GB.json';
import enus from './en-US.json';
import eses from './es-ES.json';
import esmx from './es-MX.json';
import fair from './fa-IR.json';
import fifi from './fi-FI.json';
import frca from './fr-CA.json';
import frfr from './fr-FR.json';
import heil from './he-IL.json';
import hrhr from './hr-HR.json';
import huhu from './hu-HU.json';
import itit from './it-IT.json';
import jpjp from './ja-JP.json';
import kokr from './ko-KR.json';
import mkmk from './mk-MK.json';
import nbno from './nb-NO.json';
import nlbe from './nl-BE.json';
import nlnl from './nl-NL.json';
import plpl from './pl-PL.json';
import ptbr from './pt-BR.json';
import ruru from './ru-RU.json';
import svse from './sv-SE.json';
import trtr from './tr-TR.json';
import ukua from './uk-UA.json';
import zhcn from './zh-CN.json';
import zhtw from './zh-TW.json';

export const timeLocales: Record<TimeLocaleCode, TimeLocale> = {
	['ar-EG']: areg as TimeLocale,
	['ar-SY']: arsy as TimeLocale,
	['ca-ES']: caes as TimeLocale,
	['cs-CZ']: cscz as TimeLocale,
	['da-DK']: dadk as TimeLocale,
	['de-CH']: dech as TimeLocale,
	['de-DE']: dede as TimeLocale,
	['en-CA']: enca as TimeLocale,
	['en-GB']: engb as TimeLocale,
	['en-US']: enus as TimeLocale,
	['es-ES']: eses as TimeLocale,
	['es-MX']: esmx as TimeLocale,
	['fa-IR']: fair as TimeLocale,
	['fi-FI']: fifi as TimeLocale,
	['fr-CA']: frca as TimeLocale,
	['fr-FR']: frfr as TimeLocale,
	['he-IL']: heil as TimeLocale,
	['hr-HR']: hrhr as TimeLocale,
	['hu-HU']: huhu as TimeLocale,
	['it-IT']: itit as TimeLocale,
	['ja-JP']: jpjp as TimeLocale,
	['ko-KR']: kokr as TimeLocale,
	['mk-MK']: mkmk as TimeLocale,
	['nb-NO']: nbno as TimeLocale,
	['nl-BE']: nlbe as TimeLocale,
	['nl-NL']: nlnl as TimeLocale,
	['pl-PL']: plpl as TimeLocale,
	['pt-BR']: ptbr as TimeLocale,
	['ru-RU']: ruru as TimeLocale,
	['sv-SE']: svse as TimeLocale,
	['tr-TR']: trtr as TimeLocale,
	['uk-UA']: ukua as TimeLocale,
	['zh-CN']: zhcn as TimeLocale,
	['zh-TW']: zhtw as TimeLocale,
};
