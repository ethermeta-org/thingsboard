///
/// Copyright © 2016-2022 The Thingsboard Authors
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///     http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

import { Component, Input, OnInit } from '@angular/core';
import { PageComponent } from '@shared/components/page.component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  ComplexVersionCreateRequest,
  createDefaultEntityTypesVersionCreate,
  SyncStrategy, syncStrategyHintMap, syncStrategyTranslationMap,
  VersionCreateRequestType,
  VersionCreationResult
} from '@shared/models/vc.models';
import { Store } from '@ngrx/store';
import { AppState } from '@core/core.state';
import { EntitiesVersionControlService } from '@core/http/entities-version-control.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'tb-complex-version-create',
  templateUrl: './complex-version-create.component.html',
  styleUrls: ['./complex-version-create.component.scss']
})
export class ComplexVersionCreateComponent extends PageComponent implements OnInit {

  @Input()
  branch: string;

  @Input()
  onClose: (result: VersionCreationResult | null, branch: string | null) => void;

  @Input()
  onContentUpdated: () => void;

  createVersionFormGroup: FormGroup;

  syncStrategies = Object.values(SyncStrategy);

  syncStrategyTranslations = syncStrategyTranslationMap;

  syncStrategyHints = syncStrategyHintMap;

  resultMessage: string;

  versionCreateResult: VersionCreationResult = null;

  versionCreateBranch: string = null;

  constructor(protected store: Store<AppState>,
              private entitiesVersionControlService: EntitiesVersionControlService,
              private translate: TranslateService,
              private fb: FormBuilder) {
    super(store);
  }

  ngOnInit(): void {
    this.createVersionFormGroup = this.fb.group({
      branch: [this.branch, [Validators.required]],
      versionName: [null, [Validators.required]],
      syncStrategy: [SyncStrategy.MERGE, Validators.required],
      entityTypes: [createDefaultEntityTypesVersionCreate(), []],
    });
  }

  cancel(): void {
    if (this.onClose) {
      this.onClose(this.versionCreateResult, this.versionCreateBranch);
    }
  }

  export(): void {
    const request: ComplexVersionCreateRequest = {
      branch: this.createVersionFormGroup.get('branch').value,
      versionName: this.createVersionFormGroup.get('versionName').value,
      syncStrategy: this.createVersionFormGroup.get('syncStrategy').value,
      entityTypes: this.createVersionFormGroup.get('entityTypes').value,
      type: VersionCreateRequestType.COMPLEX
    };
    this.entitiesVersionControlService.saveEntitiesVersion(request).subscribe((result) => {
      if (!result.added && !result.modified && !result.removed) {
        this.resultMessage = this.translate.instant('version-control.nothing-to-commit');
      } else {
        this.resultMessage = this.translate.instant('version-control.version-create-result',
          {added: result.added, modified: result.modified, removed: result.removed});
      }
      this.versionCreateResult = result;
      this.versionCreateBranch = request.branch;
      if (this.onContentUpdated) {
        this.onContentUpdated();
      }
    });
  }
}
