define(["underscore", "backbone", "class"], function (_, Backbone, Class) {
    var Youtrack = Class.extend({
        limit: 300,
        cookieName: "youtrack_slide",
        server: "",
        oTable: undefined,

        init: function (url) {
            this.url = url;
            _.extend(this, Backbone.Events);
        },

        storeServer: function (url) {
            document.cookie = this.cookieName + "=" + url + "; path=/";
            this.server = url;
        },

        getServer: function () {
            var self = this;
            var server = this.url;
            $.each(document.cookie.split("; "), function (index, value) {
                var i = value.indexOf(self.cookieName);
                if (i != -1) {
                    server = this.substr(i + self.cookieName.length + 1);
                    return false;
                }
            });
            return server;
        },

        _req: function (method, url, callback, withCredentials) {
            withCredentials = withCredentials ? withCredentials : false;

            var req = new XMLHttpRequest();
            var self = this;
            req.onreadystatechange = function () {
                if (req.readyState == 4) {
                    if (req.status == 200) {
                        callback.call(self, true, req.status, req.responseText);
                    } else {
                        callback.call(self, false);

                    }
                }
            };
            req.open(method, url, true);
            req.withCredentials = withCredentials;
            // it's necessary to set a significant timeout, otherwise browsers receive no data
            req.timeout = 40000;
            if (req.setRequestHeader) {
                req.setRequestHeader("Accept", "application/json");
            }

            req.send("");
        },

        _paramsToUrl: function (dict) {
            dict = dict ? dict : [];
            var result = [];
            for (var prop in dict) {
                result.push("{0}={1}".replace("{0}", prop).replace("{1}", dict[prop]));
            }

            return result.length == 0 ? "" : "?" + result.join("&");
        },

        search: function (url, query, cb, offset, context, limit) {
            limit = limit ? limit : this.limit;
            this._req("GET", url + "/rest/issue/search" + this._paramsToUrl({
                    filter: query,
                    after: offset,
                    max: limit
                }),
                function (status, code, data) {
                    var issues = data ? JSON.parse(data) : {};
                    $('.issue').remove();


                    if (issues.issue && issues.issue.length > 0) {


                        if (typeof oTable == 'undefined') {
                            for (var i in issues.issue) {
                                cb.call(context, issues.issue[i], i);
                            }
                            buildTable();
                            $('#filterOpen').css("display", "block");
                            $('#searchResults').css("visibility", "visible");
                            $('.dataTables_scrollHead .dataTables_scrollHeadInner table').css("visibility", "visible");
                        } else {
                            oTable.destroy();
                            document.getElementById('tableWrapper').innerHTML = '<table id="searchResults" class="display mdl-data-table mdl-js-data-table mdl-shadow--2dp is-upgraded" data-upgraded=",MaterialDataTable" cellspacing="0" width="100%" style="visibility: hidden;"> <thead class="thead"> <tr> <th class="mdl-data-table__cell">Rank</th><th class="mdl-data-table__cell">Issue ID</th> <th class="mdl-data-table__cell">Reporter</th> <th>Summary</th> <th>Status</th> <th>Squad</th> <th>Last Updated</th> <th>Assignee</th> <th>AssignedBy</th> <th>Code Reviewer</th> <th>Product Owner</th> </tr></thead> <tbody> </tbody> </table>';

                            for (var i in issues.issue) {
                                cb.call(context, issues.issue[i], i);
                            }
                            buildTable();
                            $('#filterOpen').css("display", "block");
                            $('#searchResults').css("visibility", "visible");
                            $('.dataTables_scrollHead .dataTables_scrollHeadInner table').css("visibility", "visible");
                        }

                        $('.dt-button').addClass('mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect');
                        $('.dataTables_filter label input').addClass("mdl-textfield__input search-filter-input");

                    } else {
                        cb.call(context, false);
                    }

                    function buildTable() {

                        oTable = $('#searchResults').DataTable({
                            select: true,
                            responsive: true,
                            "bAutoWidth": true,
                            destroy: false,
                            retrieve: true,
                            dom: 'Bfrt',
                            fixedHeader: true,
                            "scrollY": window.innerHeight - 172 + "px",
                            "scrollCollapse": true,
                            "paging": false,
                            "ordering": true,
                            "order": [[0, "asc"]],
                            "info": false,
                            "dom": '<"mdl-layout__drawer drawer"fB><"top">rt',
                            buttons: [
                                'columnsToggle',
                                {
                                    extend: 'copyHtml5',
                                    exportOptions: {
                                        columns: [0, ':visible']
                                    }
                                },
                                {
                                    extend: 'csvHtml5',
                                    exportOptions: {
                                        columns: ':visible'
                                    }
                                },
                                {
                                    extend: 'pdfHtml5',
                                    exportOptions: {
                                        columns: ':visible'
                                    },
                                    text: 'PDF',
                                    title: '',
                                    orientation: 'landscape',
                                    customize: function (doc) {
                                        // Data URL generated by http://dataurl.net/#dataurlmaker
                                    }
                                }
                        ]
                        });
                    }

                }, true);
        },

        getCurrentUser: function (cb) {
            return this.getUserInfo(this.getServer(), "current", cb);
        },

        getUserInfo: function (url, login, cb) {
            this._req("GET", url + "/rest/user/" + login, function (status, code, data) {
                var map = data ? JSON.parse(data) : {};
                cb.call(map, map);
            }, true);
        },

        getProjects: function (url, callback, context) {
            this._req("GET", url + "/rest/project/all", function (status, code, data) {
                var projects = data ? JSON.parse(data) : {};
                for (var i in projects) {
                    callback.call(context ? context : projects[i], projects[i]);
                }
            }, true);
        },

        getIssues: function (url, project, callback, offset, limit) {
            offset = offset ? offset : 0;
            limit = limit ? limit : this.limit;
            this._req("GET", url + "/rest/issue/byproject/" + project + this._paramsToUrl({
                    after: offset,
                    max: limit
                }),
                function (status, code, data) {
                    var issues = JSON.parse(data);
                    for (var i in issues) {
                        callback.call(issues[i], issues[i]);
                    }

                }, true);
        },

        getIssue: function (url, id, callback) {
            this._req("GET", url + "/rest/issue/" + id + this._paramsToUrl({
                    wikifyDescription: true
                }),
                function (status, code, data) {
                    var issue = data ? JSON.parse(data) : {};
                    callback.call(issue, issue);
                }, true)
        },

        login: function (url, username, password, cb) {
            var it = this;
            this._req("POST", url + "/rest/user/login" + this._paramsToUrl({
                    login: username,
                    password: password
                }),
                function (status, code, data) {
                    debugger;
                    cb(code);
                }, true);
        }
    });

    return Youtrack;
});
