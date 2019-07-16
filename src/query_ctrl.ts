///<reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />

import _ from 'lodash';
import { QueryCtrl } from 'app/plugins/sdk';
import './css/query_editor.css!';

export class EPICSArchAppQueryCtrl extends QueryCtrl {
  static templateUrl = 'partials/query.editor.html';

  defaults = {
  };

  selectedProcessVariableSegment: any;

  /** @ngInject **/
  constructor($scope, $injector, private templateSrv, private uiSegmentSrv) {
    super($scope, $injector);

    _.defaultsDeep(this.target, this.defaults);

    this.target.pvname = this.target.pvname || {fake: true, value: '-- pv name --'};
    this.selectedProcessVariableSegment = this.uiSegmentSrv.newSegment(this.target.selectedProcessVariableSegment || this.target.pvname);

  }

  getOptions(query) {
    return this.datasource.metricFindQuery(query || '');
  }

  getProcessVariableSegments(query) {
    return this.datasource.getPVNames(query).then(values => {
      return values.map(value => {
        return this.uiSegmentSrv.newSegment({
          value
        });
      });
    });
  }

  onChange() {
    this.target.pvname = this.selectedProcessVariableSegment.value;
    this.panelCtrl.refresh(); // Asks the panel to refresh data.
  }

}
