System.register(['moment'], function(exports_1) {
    var moment_1;
    var NewRelicDatasource;
    return {
        setters:[
            function (moment_1_1) {
                moment_1 = moment_1_1;
            }],
        execute: function() {
            NewRelicDatasource = (function () {
                /** @ngInject */
                function NewRelicDatasource(instanceSettings, $q, backendSrv, templateSrv) {
                    this.$q = $q;
                    this.backendSrv = backendSrv;
                    this.templateSrv = templateSrv;
                    this.name = instanceSettings.name;
                    this.appId = instanceSettings.jsonData.app_id;
                    this.apiKey = instanceSettings.jsonData.api_key;
                    this.apiUrl = "https://api.newrelic.com";
                    this.backendSrv = backendSrv;
                }
                NewRelicDatasource.prototype.query = function (options) {
                    var self = this;
                    var targets = options.targets;
                    var requests = [];
                    for (var t = 0; t < targets.length; t++) {
                        var target = targets[t];
                        var value = targets[t].value || null;
                        var request = {
                            refId: target.refId,
                            alias: target.alias,
                            url: this.apiUrl + '/v2/applications/' + this.appId + '/metrics/data.json',
                            params: {
                                names: [target.target],
                                to: options.range.to,
                                from: options.range.from,
                                period: self._convertToSeconds(options.interval || "60s")
                            }
                        };
                        if (value) {
                            request.params["values"] = [value];
                        }
                        requests.push(request);
                    }
                    return this.makeMultipleRequests(requests);
                };
                NewRelicDatasource.prototype.testDatasource = function () {
                    var url = this.apiUrl + '/v2/applications/' + this.appId + '.json';
                    return this.makeRequest({ url: url }).then(function () {
                        return { status: "success", message: "Data source is working", title: "Success" };
                    });
                };
                NewRelicDatasource.prototype._convertToSeconds = function (interval) {
                    var seconds = parseInt(interval);
                    var unit = interval.slice(-1).toLowerCase();
                    switch (unit) {
                        case "s":
                            break;
                        case "m":
                            seconds = seconds * 60;
                            break;
                        case "h":
                            seconds = seconds * 3600;
                            break;
                        case "d":
                            seconds = seconds * 86400;
                            break;
                    }
                    return seconds;
                };
                NewRelicDatasource.prototype._parseMetricResults = function (results) {
                    var targetList = [];
                    var metrics = results.response.metric_data.metrics;
                    for (var m = 0; m < metrics.length; m++) {
                        metrics[m].alias = results.alias;
                        targetList = targetList.concat(this._parseseacrhTarget(metrics[m]));
                    }
                    return targetList;
                };
                NewRelicDatasource.prototype._parseseacrhTarget = function (metric) {
                    var targets = Object.keys(metric.timeslices[0].values);
                    var targetData = [];
                    //get each metric
                    for (var g = 0; g < targets.length; g++) {
                        targetData.push({
                            target: this._parseTargetAlias(metric, targets[g]),
                            datapoints: this._getTargetSeries(targets[g], metric)
                        });
                    }
                    return targetData;
                };
                NewRelicDatasource.prototype._getTargetSeries = function (target, metric) {
                    var series = [];
                    for (var s = 0; s < metric.timeslices.length; s++) {
                        var slice = metric.timeslices[s];
                        series.push([slice.values[target], moment_1.default(slice.to).valueOf()]);
                    }
                    return series;
                };
                NewRelicDatasource.prototype._parseTargetAlias = function (metric, value) {
                    if (metric.alias) {
                        return metric.alias.replace(/\$value/g, value);
                    }
                    else {
                        return metric.name + ":" + value;
                    }
                };
                NewRelicDatasource.prototype.makeMultipleRequests = function (requests) {
                    var self = this;
                    return this.$q(function (resolve, reject) {
                        var mergedResults = {
                            data: []
                        };
                        var promises = [];
                        for (var q = 0; q < requests.length; q++) {
                            var promise = self.makeRequest(requests[q]).then(function (result) {
                                mergedResults.data = mergedResults.data.concat(self._parseMetricResults(result));
                            });
                            promises.push(promise);
                        }
                        self.$q.all(promises).then(function (values) {
                            resolve(mergedResults);
                        });
                    });
                };
                NewRelicDatasource.prototype.makeRequest = function (request) {
                    var options = {
                        method: "get",
                        url: request.url,
                        params: request.params,
                        data: request.data,
                    };
                    options.headers = options.headers || {};
                    options.headers["X-Api-Key"] = this.apiKey;
                    return this.backendSrv.datasourceRequest(options).then(function (result) {
                        return { response: result.data, refId: request.refId, alias: request.alias };
                    }, function (err) {
                        if (err.status !== 0 || err.status >= 300) {
                            if (err.data && err.data.error) {
                                throw { message: 'New Relic Error Response: ' + err.data.error, data: err.data, config: err.config };
                            }
                            else {
                                throw { message: 'New Relic Error: ' + err.message, data: err.data, config: err.config };
                            }
                        }
                    });
                };
                return NewRelicDatasource;
            })();
            exports_1("NewRelicDatasource", NewRelicDatasource);
        }
    }
});
//# sourceMappingURL=datasource.js.map