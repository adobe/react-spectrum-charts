/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { l10n as l10nSingleton } from '@adobe/l10nify';

//TODO:: Set up locale setter (from locale prop passed into prism component)
//TODO:: Tests for empty state and loading state

import de_DE from '../__localization__/de_de.json';
import es_ES from '../__localization__/es_es.json';
import fr_FR from '../__localization__/fr_fr.json';
import ja_JP from '../__localization__/ja_jp.json';
import ko_KR from '../__localization__/ko_kr.json';
import pt_BR from '../__localization__/pt_br.json';
import zh_CN from '../__localization__/zh_cn.json';
import zh_TW from '../__localization__/zh_tw.json';

const l10n = l10nSingleton.newInstance({
	validLocales: ['en_US', 'de_DE', 'fr_FR', 'ja_JP', 'ko_KR', 'pt_BR', 'zh_CN', 'zh_TW', 'es_ES'],
	translations: {
		en_US: {},
		de_DE: de_DE,
		es_ES: es_ES,
		fr_FR: fr_FR,
		ja_JP: ja_JP,
		ko_KR: ko_KR,
		pt_BR: pt_BR,
		zh_CN: zh_CN,
		zh_TW: zh_TW,
	},
	currentLocale: 'en_US',
});

export default l10n;
