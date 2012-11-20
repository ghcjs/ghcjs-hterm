// Copyright (c) 2012 The Chromium OS Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// AUTOGENERATED FILE
//
// This file is autogenerated! If you need to modify it, be sure to
// modify the script that exports patts voice data for use in Chrome.

// Initialize the voice array if it doesn't exist so that voice data files
// can be loaded in any order.
if (!window.voices) {
  window.voices = [];
}

// Add this voice to the global voice array.
window.voices.push({
  'projectFile': '/voice_data_hmm_en-US/project',
  'prefix': '',
  'cacheToDisk': false,
  'lang': 'en-US',
  'removePaths': [],
  'files': [
    {
      'path': '/voice_data_hmm_en-US/engine_hmm_16000_ap-embedded.cfg',
      'url': '',
      'md5sum': 'f6f24ce0be8bb1a1d0d7db140fa0af21',
      'size': 4680,
    },
    {
      'path': '/voice_data_hmm_en-US/phonology_en-US.cfg',
      'url': '',
      'md5sum': '028d739b7d00047a64e2d27aac91e49a',
      'size': 17013,
    },
    {
      'path': '/voice_data_hmm_en-US/g2p_m3_syls0_stress0_en-US.fst',
      'url': '',
      'md5sum': 'a3fa31b4cb6534c50886e8663f92619f',
      'size': 684477,
    },
    {
      'path': '/voice_data_hmm_en-US/compile_hmm_16000_ph_mcep_swop_ap_msd.cfg',
      'url': '',
      'md5sum': '4fa72329fb9204aa56ba924d72805ce5',
      'size': 7340,
    },
    {
      'path': '/voice_data_hmm_en-US/en_number_names.far',
      'url': '',
      'md5sum': '60d045a09d1fa0811ffe75eff746ca3d',
      'size': 626499,
    },
    {
      'path': '/voice_data_hmm_en-US/' +
              'sfg_16000_16bit_hmm_ph_hmm_en-US_swift_cDEV-' +
              'xavigonzalvo_d1346428136000000_sfg_5000.voice',
      'url': '',
      'md5sum': '0e97dd98f1556f39c8ef582b21c693ef',
      'size': 1073226,
    },
    {
      'path': '/voice_data_hmm_en-US/textnorm_swift_en.cfg',
      'url': '',
      'md5sum': '69ff2527d23bf7c425569a56c6debce4',
      'size': 166722,
    },
    {
      'path': '/voice_data_hmm_en-US/en.blex',
      'url': '',
      'md5sum': 'c739c4884897cb392cda667665d363fc',
      'size': 5807953,
    },
    {
      'path': '/voice_data_hmm_en-US/project',
      'url': '',
      'md5sum': 'c395f6e3ad1ba8e3329bf30b633232d6',
      'size': 653,
    },
  ],
});
