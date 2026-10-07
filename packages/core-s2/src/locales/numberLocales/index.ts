/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { NumberLocale } from 'vega';

import { NumberLocaleCode } from '../locale.types.js';
import arae from './ar-AE.json' with { type: 'json' };
import arbh from './ar-BH.json' with { type: 'json' };
import ardj from './ar-DJ.json' with { type: 'json' };
import ardz from './ar-DZ.json' with { type: 'json' };
import areg from './ar-EG.json' with { type: 'json' };
import aril from './ar-IL.json' with { type: 'json' };
import ariq from './ar-IQ.json' with { type: 'json' };
import arjo from './ar-JO.json' with { type: 'json' };
import arkm from './ar-KM.json' with { type: 'json' };
import arkw from './ar-KW.json' with { type: 'json' };
import arlb from './ar-LB.json' with { type: 'json' };
import arly from './ar-LY.json' with { type: 'json' };
import arma from './ar-MA.json' with { type: 'json' };
import arom from './ar-OM.json' with { type: 'json' };
import arps from './ar-PS.json' with { type: 'json' };
import arqa from './ar-QA.json' with { type: 'json' };
import arsa from './ar-SA.json' with { type: 'json' };
import arsd from './ar-SD.json' with { type: 'json' };
import arso from './ar-SO.json' with { type: 'json' };
import arss from './ar-SS.json' with { type: 'json' };
import arsy from './ar-SY.json' with { type: 'json' };
import artd from './ar-TD.json' with { type: 'json' };
import artn from './ar-TN.json' with { type: 'json' };
import arye from './ar-YE.json' with { type: 'json' };
import caes from './ca-ES.json' with { type: 'json' };
import cscz from './cs-CZ.json' with { type: 'json' };
import dadk from './da-DK.json' with { type: 'json' };
import dech from './de-CH.json' with { type: 'json' };
import dede from './de-DE.json' with { type: 'json' };
import enca from './en-CA.json' with { type: 'json' };
import engb from './en-GB.json' with { type: 'json' };
import enie from './en-IE.json' with { type: 'json' };
import enin from './en-IN.json' with { type: 'json' };
import enus from './en-US.json' with { type: 'json' };
import esbo from './es-BO.json' with { type: 'json' };
import eses from './es-ES.json' with { type: 'json' };
import esmx from './es-MX.json' with { type: 'json' };
import fifi from './fi-FI.json' with { type: 'json' };
import frca from './fr-CA.json' with { type: 'json' };
import frfr from './fr-FR.json' with { type: 'json' };
import heil from './he-IL.json' with { type: 'json' };
import huhu from './hu-HU.json' with { type: 'json' };
import itit from './it-IT.json' with { type: 'json' };
import jpjp from './ja-JP.json' with { type: 'json' };
import kokr from './ko-KR.json' with { type: 'json' };
import mkmk from './mk-MK.json' with { type: 'json' };
import nlnl from './nl-NL.json' with { type: 'json' };
import plpl from './pl-PL.json' with { type: 'json' };
import ptbr from './pt-BR.json' with { type: 'json' };
import ptpt from './pt-PT.json' with { type: 'json' };
import ruru from './ru-RU.json' with { type: 'json' };
import slsi from './sl-SI.json' with { type: 'json' };
import svse from './sv-SE.json' with { type: 'json' };
import ukua from './uk-UA.json' with { type: 'json' };
import zhcn from './zh-CN.json' with { type: 'json' };

export const numberLocales: Record<NumberLocaleCode, NumberLocale> = {
  ['ar-AE']: arae as NumberLocale,
  ['ar-BH']: arbh as NumberLocale,
  ['ar-DJ']: ardj as NumberLocale,
  ['ar-DZ']: ardz as NumberLocale,
  ['ar-EG']: areg as NumberLocale,
  ['ar-IL']: aril as NumberLocale,
  ['ar-IQ']: ariq as NumberLocale,
  ['ar-JO']: arjo as NumberLocale,
  ['ar-KM']: arkm as NumberLocale,
  ['ar-KW']: arkw as NumberLocale,
  ['ar-LB']: arlb as NumberLocale,
  ['ar-LY']: arly as NumberLocale,
  ['ar-MA']: arma as NumberLocale,
  ['ar-OM']: arom as NumberLocale,
  ['ar-PS']: arps as NumberLocale,
  ['ar-QA']: arqa as NumberLocale,
  ['ar-SA']: arsa as NumberLocale,
  ['ar-SD']: arsd as NumberLocale,
  ['ar-SO']: arso as NumberLocale,
  ['ar-SS']: arss as NumberLocale,
  ['ar-SY']: arsy as NumberLocale,
  ['ar-TD']: artd as NumberLocale,
  ['ar-TN']: artn as NumberLocale,
  ['ar-YE']: arye as NumberLocale,
  ['ca-ES']: caes as NumberLocale,
  ['cs-CZ']: cscz as NumberLocale,
  ['da-DK']: dadk as NumberLocale,
  ['de-CH']: dech as NumberLocale,
  ['de-DE']: dede as NumberLocale,
  ['en-CA']: enca as NumberLocale,
  ['en-GB']: engb as NumberLocale,
  ['en-IE']: enie as NumberLocale,
  ['en-IN']: enin as NumberLocale,
  ['en-US']: enus as NumberLocale,
  ['es-BO']: esbo as NumberLocale,
  ['es-ES']: eses as NumberLocale,
  ['es-MX']: esmx as NumberLocale,
  ['fi-FI']: fifi as NumberLocale,
  ['fr-CA']: frca as NumberLocale,
  ['fr-FR']: frfr as NumberLocale,
  ['he-IL']: heil as NumberLocale,
  ['hu-HU']: huhu as NumberLocale,
  ['it-IT']: itit as NumberLocale,
  ['ja-JP']: jpjp as NumberLocale,
  ['ko-KR']: kokr as NumberLocale,
  ['mk-MK']: mkmk as NumberLocale,
  ['nl-NL']: nlnl as NumberLocale,
  ['pl-PL']: plpl as NumberLocale,
  ['pt-BR']: ptbr as NumberLocale,
  ['pt-PT']: ptpt as NumberLocale,
  ['ru-RU']: ruru as NumberLocale,
  ['sl-SI']: slsi as NumberLocale,
  ['sv-SE']: svse as NumberLocale,
  ['uk-UA']: ukua as NumberLocale,
  ['zh-CN']: zhcn as NumberLocale,
};
