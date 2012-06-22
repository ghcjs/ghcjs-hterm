# Copyright (c) 2012 The Chromium OS Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

#!/bin/bash
readonly GIT_REPO=http://marijnhaverbeke.nl/git
readonly SRC=codemirror2
readonly DST=code_viewer/$SRC

if [ -d $SRC ]
then
  pushd $SRC
  git pull
  popd
else
  git clone $GIT_REPO/$SRC
fi

rsync -rav $SRC/lib $SRC/mode $SRC/LICENSE $DST
