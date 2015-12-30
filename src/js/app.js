define(["class", "youtrack", "selection", "pubsub", "router", "util", "columns", "keys","filter"],
    function(Class, Youtrack, Selection, Pubsub, Router, Util, Columns, Keys) {
  var App = Keys.extend({
    columns: ['id',"Reporter", 'summary', "State", "Squad","updated","Assignee","Assigned QA","Code Reviewed By","Business Owner"],
    systemProperties: [
      "projectShortName",
      "numberInProject",
      "summary",
      "description",
      "created",
      "updated",
      "updaterName",
      "resolved",
      "reporterName",
      "votes",
      "commentsCount",
      "voterName",
      "attachments",
      "links",
      "JiraSubsystems",
      "reporterFullName",
      "updaterFullName"],

    fsiState: 0, // 0: hidden, 1: partially visible, 2: full screen

    init: function(youtrack_url) {
      this._super();

      this.youtrack = new Youtrack(youtrack_url);
      this.selection = new Selection();

      this.router = new Router(this._onSearch, this);

      this.youtrack.getCurrentUser(function() {
        window.fullName = this.fullName;
      });

      this.$fsi = $(".fsi");

      var self = this;

      this.selection.bind("selection", this._onSelectionChanged, this);
      Material.init()
        
          

      $(".issue").live('click', function(e) {
        var issue = $(e.target).parents(".issue");
        self.selection.select(issue.attr("id"));
      });

      $('.l_help').click(function() {
        self._showHelp();
        return false;
      });

      $('.dialog .close').live('click', function() {
        $('.dialog').css({visibility: 'hidden'});
      });

      this._initCurrentUser();
      this._initShortcuts();
      this._initSearchField();
      this._initWindows();
      this._initLogin();
      this._initRelayout();
    },

    _initLogin: function() {
      var self = this;

      var relogin = function() {
        var dialog = $('.switch');
        var server = $('#server', dialog);
        var username = $('#login', dialog);

        if (username.val().trim().length == 0) {
          username.focus();
          return;
        }

        var password = $('input[type=password]', dialog);
        if (password.val().trim().length == 0) {
          password.focus();
          return;
        }
          self.youtrack.getCurrentUser(function() {
              window.fullName = this.fullName;
          });
        self.youtrack.login(server.val().trim(),username.val().trim(), password.val().trim(), function(code) {
           var success = code == 200;
            if(success){
                self.youtrack.storeServer(server.val().trim());
                self._hideDialog();
                self.youtrack.getCurrentUser(function(){
                    self._updateUserInfo(this.fullName);
                })
            }
            self._toggleError(server, success);
        });
      };

      $('.switch input[type=button]').live('click', function() {
        relogin.call(self);
        return false;
      });

      $('.switch input').live('keydown', function(e) {
        if (self._stroke(e) == "CONTROL typed ENTER") {
          relogin.call(self);
          return false;
        }

        return true;
      });

      $('.switch a').live('click', function() {
        self._hideDialog();
        return false;
      })
    },

      _toggleError: function(el, hideError) {
          var fn = hideError ? "removeClass": "addClass";
          $(el)[fn]("error")
      },

      _showHelp: function() {
      var help = $('.help');
      help.css({
        top: Math.floor($(window).height() / 6),
        left: Math.floor(($(window).width() - help.outerWidth()) / 2),
        visibility: 'visible'
      });
    },

    _initCurrentUser: function() {
      var self = this;
      this.youtrack.getCurrentUser(function(){
          self._updateUserInfo(this.fullName)
      });
    },

    _updateUserInfo: function(userName){
        if(!userName) return;

        var self = this;
        var login = $('.top .login');
        login.html('<i><a href="" class="light">{0}</a></i>'.replace('{0}', userName));
        $('a', login).click(function(){
            self._switchUser();
            return false;
        });
    },

    _switchUser: function() {
      var dialog = $('.switch');
      $('#server', dialog).val(this.youtrack.getServer());
      dialog.css({
        top: Math.floor($(window).height() / 6),
        left: Math.floor(($(window).width() - dialog.outerWidth()) / 2),
        visibility: 'visible'
      });

      $('input[type=text]', dialog).focus();
    },

    _hideDialog: function() {
      var dialog = $('.dialog');
      var result = false;
      dialog.each(function() {
        var d = $(this);
        if (d.css('visibility') == 'visible') {
          d.css({visibility: 'hidden'});
          result = true;
        }
      });

      return result;
    },

    _initShortcuts: function() {
      this.shortcut("typed /", function() {
        this._hideDialog();
        this._focusSearch(true);
      }, this);

      this.shortcut("typed HOME", this._first, this);
      this.shortcut("typed END", this._last, this);
      this.shortcut("pressed UP", this._up, this);
      this.shortcut("pressed DOWN", this._down, this);
      this.shortcut("pressed LEFT", this._left, this);
      this.shortcut("pressed RIGHT", this._right, this);
      this.shortcut("typed H", this._showHelp, this);
      this.shortcut("typed ESCAPE", function() {
        if (!this._hideDialog()) {
          this._hideFsi(0);
        }
      }, this);

      this.shortcut("typed ENTER", function() {
        this._hideDialog();
        this._showFsi(2);
      }, this);

      var self = this;
      $('.dialog input').live('keydown', function(e) {
        if (self._stroke(e) == "typed ESCAPE") {
          self._hideDialog();
          return false;
        }
      });
    },

    _initSearchField: function() {
      var field = $(".top input[type=text]");

      var self = this;
      field.keydown(function(e) {
        if (self._stroke(e) == "typed ENTER") {
          self._search();
          return false;
        } else if (self._stroke(e) == "typed ESCAPE" || self._stroke(e) == "pressed DOWN") {
          self._focusIssueList();
          return false;
        }
      });

      var button = $(".top input[type=button]");
      button.click(function() {
        self._search();
      });

      this._fixLayout();
    },

    _focusSearch: function(select) {
      select = select ? select : false;
      var _search = $("#search");
      _search.focus();
      if (select) _search.select();

      this._hideFsi(0);
    },

    _focusIssueList: function() {
      $("#search").blur();
      $(window).focus();
    },

    _search: function() {
      this.router.navigate("/search/" + this._getSearchText(true), true);
    },

    _getSearchText: function(encode) {
      var _encode = encode ? encode : false;
      var text = $(".top input[type=text]").val();

      if (_encode) {
        text = text.replace(/ /g, '+');
//        text = encodeURIComponent(text);
      }

      return text;
    },

    _onSearch: function(query) {
      var url = this.youtrack.getServer();
      var curr = this._getSearchText(false);
      var _new = query.replace(/\+/g, ' ');
      if (curr !== _new && _new.length > 0) {
        var _s = $("#search");
        _s.val(_new);
      }

      this._clearIssues();
      this._toggleLoading(true);
      this.youtrack.search(url, encodeURIComponent(_new), this._issueFound, 0, this);
       
    },

    _clearIssues: function() {
      $('.issue').remove();
      this.selection.select();
    },

    _issueFound: function(issue, i) {
      this._toggleLoading(false);
      if (typeof(issue) == "boolean") {
        this._focusSearch(true);

        $('.issues table').append('<tr class="issue nothing"><td>No issues were found.</td></tr>');

        return;
      }

      if (i == 0) {
        this._focusIssueList();
      }

      this._appendIssue(issue);
      
    },

    _fixLayout: function() {
//      $(".c").css({"margin-top": $(".top").outerHeight(true)})
    },

    _toggleLoading: function(show){
        $(".loading")[show ? "show" : "hide"]();
    },

    _getOffset: function() {
      return 200;
    },

    _rightOffset: function() {
      return $('.handle', self.$fsi).outerWidth(true);
    },

    _initWindows: function() {
      var self = this;
      this.$fsi.addClass("hidden");

      var w = $(window);

      this.$fsi.css({visibility: 'visible'});
      var handle = $('.handle', self.$fsi);
      handle.click(function(){
          self._hideDialog();
          if (self.fsiState == undefined || self.fsiState == 0) {
              self._showFsi();
          } else if(self.fsiState == 1){
              self._hideFsi();
          }
      });

      var onResize = function() {
        self.$fsi.css({
          overflow: 'auto !important',
          width: '100%',
          height: '100%',
          left: w.width() - self._getOffset()
        });

      };

      Pubsub.subscribe("window:resized", onResize);
      onResize(); // call manually

      Pubsub.subscribe("window:resizing", function() {
        self._adopt();
      });

      $(".main").css({
        top: $(".top").outerHeight(true),
        bottom: 0,
        left: 0,
        right: this._rightOffset()
      });

      $('.content', this.$fsi).css({
        'margin-left': this._rightOffset()
      });

      $('.rbox').css({
        'margin-right': this._rightOffset(),
        'line-height': '{0}px'.replace('{0}', $('.top').height()),
        'visibility': 'visible'
      });

      /* TODO: click to show FSI */

//      fsi.click(function() {
//        if (fsi.hasClass("hidden")) {
//          self._showFsi(false);
//
//          return false;
//        }
//
//        return true;
//      });



      /* TODO: SCROLL SHADOW */
/*
      $(".main").scroll(function() {
        if ($(this).scrollTop() > 0) {
          $(".top").css({"box-shadow": "0 1px 10px #888"});
        } else {
          $(".top").css({"box-shadow": "none"});
        }
      })
*/



    },

    _scrollToIssue: function(issue) {
      var main = $(".main");
      var pos = issue.position();

      var visibleHeight = main.outerHeight(true);

      var scrollTop = main.scrollTop();

      var issueTopOffset = pos.top + scrollTop;
      var issueBottom = issueTopOffset + issue.outerHeight(true);

      if (issueBottom >= scrollTop + visibleHeight) {
        main.scrollTop(issueBottom - visibleHeight);
      } else if (issueTopOffset < scrollTop) {
        main.scrollTop(issueTopOffset);
      }
    },

    _partialOffset: function() {
      var summary = $('._summary:first');
      return summary.position().left + Math.floor(summary.outerWidth(true) / 1.3);
    },

    _left: function() {
      this._hideDialog();
      this._showFsi();
    },

    _showFsi: function(state) {
      this.fsiState = state === undefined ? this.fsiState + 1 : state;
      this.fsiState = this.fsiState > 2 ? 2 : this.fsiState;

//      if (this.$fsi.position().left <= 0) return;

      this.$fsi.removeClass("hidden");

//      if (this.fsiState < 2) {
//        $('.handle .glyph', this.$fsi).text('u');
//      }

      var offset = this.fsiState == 2 ? -this._getOffset() : this._partialOffset();

      this._updateFsi();

      this.$fsi.css({
        "-webkit-transition": "left 100ms ease",
        left: 100
      });
    },

    _hideFsi: function(state) {
      this.fsiState = state === undefined ? this.fsiState - 1 : state;
      this.fsiState = this.fsiState < 0 ? 0 : this.fsiState;

      if (this.fsiState == 0) {
        $('.handle .glyph', this.$fsi).text('v');
        this.$fsi.addClass("hidden");
      }

      var offset = this.fsiState == 0 ? $(window).width() - this._getOffset() : this._partialOffset();
      this.$fsi.css({
        "-webkit-transition": "left 100ms ease",
        left: 100
      });
    },

    _right: function() {
      this._hideDialog();
      this._hideFsi();
    },

    _up: function() {
      this._hideDialog();
      var current = this._getSelectedIssue();
      if (current.length) {
        var prev = current.prev(".issue");
        if (prev.length) {
          current = prev;
          this.selection.select(prev.attr("id"));
        } else{
          this._focusSearch();
        }

        this._scrollToIssue(current)
      }
    },

    _down: function() {
      this._hideDialog();
      var current = this._getSelectedIssue();
      if (current.length) {
        var next = current.next(".issue");
        if (next.length) {
          current = next;
          this.selection.select(next.attr("id"));
        }

        this._scrollToIssue(current)
      }
    },

    _first:function () {
      this._hideDialog();
      var issue = this._getFirstLastIssue(true);
      this.selection.select(issue.attr("id"));
      this._scrollToIssue(issue)
    },


    _last:function () {
      this._hideDialog();
      var issue = this._getFirstLastIssue(false);
      this.selection.select(issue.attr("id"));
      this._scrollToIssue(issue)
    },

    _getSelectedIssue: function() {
      return this._getIssueById(this.selection.selection());
    },

    _getFirstLastIssue:function (first) {
      var fn = first ? "first" : "last";
      return $(".issues").find(".issue")[fn]();
    },

      _getIssueById: function(id) {
      return $("#{0}".replace('{0}', id), $(".issues"));
    },

    _onSelectionChanged: function(id, old) {
      var item = this._getIssueById(id);
      if (item.length) {
        if (old) {
          this._getIssueById(old).removeClass("selected");
        }

        item.addClass("selected");
        this._updateFsi();
      }
    },

    _appendIssue: function(issue) {
      var self = this;

      var row = $("<tr/>", {class: "issue", id: issue.id});

      
      
      for (var i in this.columns) {
          
        Columns.create(this.columns[i], issue).render(row);
      }

      if(Util.valFromArray(issue.field, "resolved") !== undefined) {
        row.addClass("fixed");
      }

      row.data("issue", issue); // store issue info

      $(".issues table").append(row);

      if (!self.selection.selection()) {
        self.selection.select(issue.id);
      }
    },

    _iteratePublicFields: function(issue, callback) {
      for (i in issue.field) {
        var f = issue.field[i];
        if (this.systemProperties.indexOf(f.name) == -1) {
          callback.call(f, f);
        }
      }
    },

    _initRelayout: function() {
      // super-puper adaptive layout: more space - more properties
      var self = this;

      if (!self.layoutInitialized) {
        // calculate pixel width for the subject property

        var test = $('<div/>', {class: 'lengthBox', style: 'display: table-cell; visibility: hidden;'});

        var text = "";
        for (var i = 0; i < 50; i++) text += "W";

        test.text(text);

        var resized = function() {

          Pubsub.publish("relayout");


        };

        test.resize(resized);
        $('body').append(test);

        // call manually
        resized();

        self.layoutInitialized = true;

//        Pubsub.subscribe("relayout", self._relayout, self)
      }
    },

    // TODO:
    _adopt: function() {
      var issues = $(".issues");
      var table = $("table");

      if (issues.width() < table.width()) {
        var toCollapse = $("table .collapsable:first:not(.collapsed)");

        var cls = toCollapse.attr("class").split(" ");
        var _class = null;
        for (var i in cls) {
          if (cls[i].charAt(0) == "_") {
            _class = cls[i];
            break;
          }
        }

     //   $("table ." + _class).width(toCollapse.width() - (table.width() - issues.width()));

//        $("table ." + _class).css({'-webkit-transform' :'rotateY(100deg)'.replace('{0}', table.width() - issues.width())});

//        console.log(toCollapse);
      }
    },

    _updateFsi: function() {
      //if (this.fsiState < 1) return;
      var issue = this._getSelectedIssue();
      this._buildFsi(issue.data("issue"), $(".content", this.$fsi));
    },

    _buildFsi: function(issue, parent) {
      var self = this;
        var server = this.youtrack.getServer();
        this.youtrack.getIssue(server, issue.id, function() {
        var summary = $(".summary", parent);
        summary.html("<a target='_blank' class='id' href='{0}'>{1}</a>&nbsp;".replace('{1}', this.id).replace('{0}', server + '/issue/' + this.id) + Util.valFromArray(this.field, "summary"));
        $('.fields', parent).replaceWith(self._buildFields(this));

        var description = $(".description", parent);
        var desc = Util.valFromArray(this.field, "description");
        description.html(desc == "\n" ? "No description" : desc);
      });
    },

    _buildFields: function(issue) {
      var el = $("<div/>", {class: "mdl-card mdl-shadow--2dp fields"});
      this._iteratePublicFields(issue, function() {
        if(typeof this.value === "Object"){
          el.append('<div class="row"><div class="name">{0}</div><div class="value">{1}</div></div>'.replace("{0}", this.name).replace("{1}", JSON.stringify(this.value)));
        }
        else{
          el.append('<div class="row"><div class="name">{0}</div><div class="value">{1}</div></div>'.replace("{0}", this.name).replace("{1}", this.value));
        }

      });

      return el;
    }
  });

  return App;
});