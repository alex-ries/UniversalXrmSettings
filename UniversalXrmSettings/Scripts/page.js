$(function () {
    window.MNS = window.MNS || {};
    window.MNS.XrmSettings = (function () {
        if (!$ && !jQuery) {
            document.write("jQuery not found");
        }
        var xrmSettings = {
            _self: null,
            _settings: null,
            _dataSet: null,
            _clientUrl: null,
            _oDataUrl: null,
            _formTargetId: "XrmSettingsForm",
            _handleValueUpdate: function (event) {
                var self = event.data;
                var id = $(this).attr("id");
                if (self._dataSet[id] !== undefined) {
                    self._dataSet[id].value = $(this).val();
                    self._dataSet[id].isDirty = true;
                }
            },
            _createSelect: function () {
                var entityDef = this._settings.entityDefinition;
                return "$select=" + entityDef.key + "," + entityDef.value;
            },
            _createKeyFilter: function (value) {
                var entityDef = this._settings.entityDefinition;
                return "$filter=" + entityDef.key + " eq '" + value + "'";
            },
            _retrieveValueByKey: function (key, done) {
                console.log("RetrieveValueByKey")
                var self = this;
                var queryUrl = this._oDataUrl + this._settings.entityDefinition.entityName + "?" + this._createSelect() + "&" + this._createKeyFilter(key);
                console.log("Query Url: GET " + queryUrl);
                $.ajax({
                    type: "GET",
                    contentType: "application/json; charset=utf-8",
                    datatype: "json",
                    url: queryUrl,
                    beforeSend: function (XMLHttpRequest) {
                        XMLHttpRequest.setRequestHeader("OData-MaxVersion", "4.0");
                        XMLHttpRequest.setRequestHeader("OData-Version", "4.0");
                        XMLHttpRequest.setRequestHeader("Accept", "application/json");
                    },
                    async: true,
                    success: function (data, textStatus, xhr) {
                        var results = data.value;
                        var entityDef = self._settings.entityDefinition;
                        var returnValue = [];
                        for (var i in results) {
                            returnValue.push({
                                id: results[i][entityDef.id],
                                key: results[i][entityDef.key],
                                value: results[i][entityDef.value]
                            });
                        }
                        done.call(self, returnValue);
                    },
                    error: function (xhr, textStatus, errorThrown) {
                        //alert(textStatus + " " + errorThrown);
                    }
                });
            },
            _retrieveValueByGuid: function (guid, done) {
                console.log("RetrieveValueByGuid")
                var self = this;
                var queryUrl = this._oDataUrl + this._settings.entityDefinition.entityName + "(" + guid + ")?" + this._createSelect();
                console.log("Query Url: GET " + queryUrl);
                $.ajax({
                    type: "GET",
                    contentType: "application/json; charset=utf-8",
                    datatype: "json",
                    url: queryUrl,
                    beforeSend: function (XMLHttpRequest) {
                        XMLHttpRequest.setRequestHeader("OData-MaxVersion", "4.0");
                        XMLHttpRequest.setRequestHeader("OData-Version", "4.0");
                        XMLHttpRequest.setRequestHeader("Accept", "application/json");
                    },
                    async: true,
                    success: function (data, textStatus, xhr) {
                        var entityDef = self._settings.entityDefinition;
                        var returnValue = [];

                        returnValue.push({
                            id: data[entityDef.id],
                            key: data[entityDef.key],
                            value: data[entityDef.value]
                        });
                        done.call(self, returnValue);
                    },
                    error: function (xhr, textStatus, errorThrown) {

                    }
                });
            },
            loadData: function () {
                for (var key in this._dataSet) {
                    var setting = this._dataSet[key];
                    var returnedValue = null;
                    if (setting.guid !== null) {
                        this._retrieveValueByGuid(setting.guid,
                            function (results) {
                                if (results.length === 1) {
                                    var data = this._dataSet[results[0].key];
                                    data.value = results[0].value;
                                    $("#" + data.key).val(data.value);
                                }
                            });
                    }
                    else {
                        this._retrieveValueByKey(setting.key,
                            function (results) {
                                if (results.length === 1) {
                                    var data = this._dataSet[results[0].key];
                                    data.value = results[0].value;
                                    data.guid = results[0].id;
                                    $("#" + data.key).val(data.value);
                                }
                            });
                    }
                }
            },
            refresh: function () {
                this.loadData();
            },
            _handleSave: function (event) {
                var self = event.data;
                self.save.call(self);
            },
            _updateExisting: function (guid, value, done) {
                console.log("UpdateExisting")
                var self = this;
                var queryUrl = this._oDataUrl + this._settings.entityDefinition.entityName + "(" + guid + ")";
                console.log("Query Url: PATCH " + queryUrl);
                var settingRecord = {};
                settingRecord[this._settings.entityDefinition.value] = value;
                console.log("Data sent:");
                console.log(JSON.stringify(settingRecord));
                $.ajax({
                    type: "PATCH",
                    contentType: "application/json; charset=utf-8",
                    datatype: "json",
                    url: queryUrl,
                    data: JSON.stringify(settingRecord),
                    beforeSend: function (XMLHttpRequest) {
                        XMLHttpRequest.setRequestHeader("OData-MaxVersion", "4.0");
                        XMLHttpRequest.setRequestHeader("OData-Version", "4.0");
                        XMLHttpRequest.setRequestHeader("Accept", "application/json");
                    },
                    async: true,
                    success: function (data, textStatus, xhr) {
                        done.call(self);
                    },
                    error: function (xhr, textStatus, errorThrown) {
                        alert(textStatus + " " + errorThrown);
                    }
                });
            },
            _createNew: function (key, value, done) {
                console.log("CreateNew")
                var self = this;
                var queryUrl = this._oDataUrl + this._settings.entityDefinition.entityName;
                console.log("Query Url: POST " + queryUrl);
                var settingRecord = {};
                settingRecord[this._settings.entityDefinition.key] = key;
                settingRecord[this._settings.entityDefinition.value] = value;
                $.ajax({
                    type: "POST",
                    contentType: "application/json; charset=utf-8",
                    datatype: "json",
                    url: queryUrl,
                    data: JSON.stringify(settingRecord),
                    beforeSend: function (XMLHttpRequest) {
                        XMLHttpRequest.setRequestHeader("OData-MaxVersion", "4.0");
                        XMLHttpRequest.setRequestHeader("OData-Version", "4.0");
                        XMLHttpRequest.setRequestHeader("Accept", "application/json");
                    },
                    async: true,
                    success: function (data, textStatus, xhr) {
                        var uri = xhr.getResponseHeader("OData-EntityId");
                        var regExp = /\(([^)]+)\)/;
                        var matches = regExp.exec(uri);
                        var newEntityId = matches[1];
                        done.call(self, newEntityId);
                    },
                    error: function (xhr, textStatus, errorThrown) {
                        alert(textStatus + " " + errorThrown);
                    }
                });
            },
            save: function () {
                for (var i in this._dataSet) {
                    var data = this._dataSet[i];
                    var behaviour = this._settings.behaviour;
                    if ((data.guid === null || typeof (data.guid) === "undefined") && behaviour.allowCreate === true) {
                        if (data.isDirty || this._settings.behaviour.forceCreate === true) {
                            this._createNew(data.key, data.value, function (id) {
                                data.guid = id;
                                data.isDirty = false;
                            });
                        }
                    }
                    else if (data.isDirty === true) {
                        this._updateExisting(data.guid, data.value,
                            function () {
                                data.isDirty = false;
                            });
                    }
                }
            },
            buildForm: function () {
                var form = $("#" + this._formTargetId + " #XrmSettings");
                for (var i in this._dataSet) {
                    var target = this._dataSet[i];
                    var formGroup = $("<div />", { "class": "form-group" });
                    formGroup.append($("<label />", {
                        "for": target.key,
                        "class": "col-sm-2 control-label"
                    }).text(target.name));
                    formGroup.append($("<div />", {
                        "class": "col-sm-9"
                    }).append($("<input />", {
                        id: target.key,
                        type: "text",
                        "class": "form-control",
                        placeholder: target.name,
                        value: target.value || ""
                    }).bind('change', this, this._handleValueUpdate)
                    ));
                    form.append(formGroup);
                }
            }
        }

        if (typeof (GetGlobalContext) !== "undefined") {
            var context = GetGlobalContext();
            xrmSettings._clientUrl = context.getClientUrl();
            xrmSettings._oDataUrl = context.getClientUrl() + "/api/data/v8.0/";
        }

        xrmSettings._settings = settings;
        xrmSettings._self = xrmSettings;
        xrmSettings._dataSet = {};
        for (var i in xrmSettings._settings.settingSet) {
            var setting = xrmSettings._settings.settingSet[i];
            xrmSettings._dataSet[setting.key] = {
                key: setting.key,
                value: null,
                guid: null,
                isDirty: false,
                name: setting.name,
                description: setting.description
            };
        }
        xrmSettings.buildForm();
        xrmSettings.loadData();
        $("#save-button").bind("click", xrmSettings, xrmSettings._handleSave);
    })();
}
        );