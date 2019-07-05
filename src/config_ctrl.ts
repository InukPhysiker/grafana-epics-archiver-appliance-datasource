///<reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />

import angular from 'angular';
import _ from 'lodash';

export class EPICSArchAppConfigCtrl {
  static templateUrl = 'partials/config.html';
  current: any;
  suggestUrl: string;
  datasources: any;

  constructor($scope, private backendSrv) {
    this.current.jsonData.identity = this.current.jsonData.identity || '';
    this.current.jsonData.engineURL = this.current.jsonData.engineURL || '';
    this.current.jsonData.retrievalURL = this.current.jsonData.retrievalURL || '';
    this.current.jsonData.dataRetrievalURL = this.current.jsonData.dataRetrievalURL || '';
  }

  getApplianceInfo() {
    this.backendSrv
      .datasourceRequest({
        url: `api/datasources/proxy/${this.current.id}/archiverappliance/mgmt/bpl/getApplianceInfo`,
        method: 'GET'
      })
      .then(res => {
        this.current.jsonData.identity = res.data.identity;
        this.current.jsonData.engineURL = res.data.engineURL;
        this.current.jsonData.retrievalURL = res.data.retrievalURL;
        this.current.jsonData.dataRetrievalURL = res.data.dataRetrievalURL;
        return;
      })
      .catch(err => {
        console.log(err);
      });
  }

  getSuggestUrls = () => {
    return [this.suggestUrl];
  };

}
