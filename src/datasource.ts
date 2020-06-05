///<reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />

import _ from 'lodash';
import * as dateMath from 'app/core/utils/datemath';
import moment from 'moment';

export default class EPICSArchAppDatasource {

    id: number;
    url: string;
    jsonData: any;

    /** @ngInject */
    constructor(instanceSettings, private backendSrv, private templateSrv, private $q) {

        this.id = instanceSettings.id;
        this.url = instanceSettings.url;
        this.jsonData = instanceSettings.jsonData;

    }

    query(options) {

        if (options.targets.length <= 0) {
            return this.$q.when({ data: [] });
        }

        const pvname = options.targets[0].pvname;

        if (pvname == '' || pvname == '-- pv name --' || pvname == undefined) {
            return this.$q.when({ data: [] });
        }

        var startTime = new Date(options.range.from);
        var stopTime = new Date(options.range.to);

        // ISO string required by EPICS Archiver Appliance
        var startTimeISO = startTime.toISOString();
        var stopTimeISO = stopTime.toISOString();

        // milliseconds required for time range calculation
        var startTime_ms = startTime.getTime();
        var stopTime_ms = stopTime.getTime();

        var time_range = new moment.duration(stopTime_ms - startTime_ms);

        // EPICS Archiver Appliances uses the following sampling values:
        //
        // 30m --> lastSample_5
        //  4h --> lastSample_15
        //  8h --> lastSample_30
        //  1d --> lastSample_120
        //  2d --> lastSample_180
        //  1w --> lastSample_600
        //  2w --> lastSample_1200
        //  1M --> lastSample_3600
        //  6M --> lastSample_14400
        //  1Y --> lastSample_43200

        // setSamplingOption does the same and interpolates for other time ranges

        var sampleRate = 1; // retrieve all data points

        if (time_range.asDays() < 1) {
            sampleRate = 5 * Math.round((3.5 * (time_range.asHours()) + 1) / 5.0) || 1;
        } else if (time_range.asWeeks() < 1) {
            sampleRate = 60 * Math.round(time_range.asDays());
        } else if (time_range.asMonths() < 1) {
            sampleRate = 600 * Math.round(time_range.asWeeks());
        } else if (Math.round(time_range.asMonths()) == 6) {
            sampleRate = 14440
        } else if (time_range.asMonths() >= 1) {
            sampleRate = 3600 * Math.round(time_range.asMonths());
        }

        const grafanaResponse = { data: [] };

        // For each one of the metrics the user entered:
        const requests = options.targets.map((target) => {
            return new Promise((resolve) => {

                if (target.hide || target.pvname == '-- pv name --') { // If the user clicked on the eye icon to hide, don't fetch the metrics.
                    resolve();
                } else {
                    return new Promise((innerResolve) => {
                        this.getMetrics(target, grafanaResponse, startTimeISO, stopTimeISO, sampleRate, resolve);
                    });
                }
            });
        });

        return Promise.all(requests).then(() => {
            return grafanaResponse;
        });

    }

    getMetrics(target, grafanaResponse, startTime, stopTime, sampleRate, callback) {

        const pvname = target.pvname;

        var retrieval_query = 'pv=lastSample_' + sampleRate + '(' + pvname + ')' + '&from=' + startTime + '&to=' + stopTime + '&fetchLatestMetadata=true';

        return this.backendSrv.datasourceRequest({
            // url: `api/datasources/proxy/${this.id}/dataRetrievalURL/data/getData.qw?${retrieval_query}`
            url: this.url + `/retrieval/data/getData.qw?${retrieval_query}`
        }).then((response) => {

            var data = [], datapoints = [], titles = [];
            var i = 0;
            var j = 0;

            if (response.data[0].data) {
                var timepos = 0;
                for (j = 0; j < response.data[0].data.length; j++) {
                    datapoints.push([
                        response.data[0].data[j]["val"], +new Date(response.data[0].data[j]["millis"])
                    ]);
                }
                grafanaResponse.data.push({
                    target: response.data[0].meta.name,
                    datapoints: datapoints,
                    refid: target.refid,
                });
            }

        }).then(() => {
            callback();
        }).catch((err) => { // Unable to get metrics
            let errMsg = 'Error getting metrics.';
            callback();
        });
    }

    annotationQuery(options) {
        throw new Error("Annotation Support not implemented yet.");
    }

    metricFindQuery(query: string) {
        throw new Error("Template Variable Support not implemented yet.");
    }

    // pv
    // An optional argument that can contain a GLOB wildcard. We will return PVs that match this GLOB. For example, if pv=KLYS*, the server will return all PVs that start with the string KLYS.
    // regex
    // An optional argument that can contain a Java regex wildcard. We will return PVs that match this regex. For example, if pv=KLYS.*, the server will return all PVs that start with the string KLYS.
    // limit
    // An optional argument that specifies the number of matched PV's that are returned. If unspecified, we return 500 PV names. To get all the PV names, (potentially in the millions), set limit to 1.

    getPVNames(query) {
        const templatedQuery = this.templateSrv.replace(query);
        return this.backendSrv.datasourceRequest({
            url: this.url + '/retrieval/bpl/getMatchingPVs?limit=36&pv=' + query + '*',
            method: 'GET',
            params: { output: 'json' }
        }).then((response) => {
            if (response.status === 200) {
                return response.data;
            } else {
                return [];
            }

        }).catch((error) => {
            return [];
        });
    }

    testDatasource() {
        return this.backendSrv
            .datasourceRequest({
                url: this.url,
                method: 'GET'
            })
            .then(res => {
                return {
                    status: 'success',
                    message: 'EPICS Archiver Appliance Connection OK'
                };
            })
            .catch(err => {
                console.log(err);
                if (err.data && err.data.message) {
                    return {
                        status: 'error',
                        message: err.data.message
                    };
                } else {
                    return {
                        status: 'error',
                        message: err.status
                    };
                }
            });
    }

    }
