define(["class", "util"], function(Class, Util) {
  var Column = Class.extend({
    init: function(name, issue, collapsable) {
      this.issue = issue;
      this.name = name;
      this.collapsable = collapsable === undefined ? true : collapsable;
    },

    _val: function(name) {
      var _name = name === undefined ? this.name : name;
      return Util.valFromArray(this.issue.field, _name);
    },

    isCollapsable: function() {
      return this.collapsable;
    },

    build: function() {
      console.log("implement me!");
    },

    _cell: function() {
      var result = $('<td/>', {class: "_" + this.name.toLowerCase()});
      if (this.isCollapsable()) {
        result.addClass("collapsable");
      }

      return result;
    },

    render: function(container) {
      container.append(this.build());
    },

    title: function() {
      return this.name.charAt(0).toUpperCase() + this.name.substring(1);
    },

    buildTitle: function() {
      var result = $("<td/>", {class: "_" + this.name.toLowerCase()});
      result.text(this.title());
      return result;
    }
  });

  var Text = Column.extend({
    init: function(name, issue, collapsable) {
      this._super(name, issue, collapsable);
    },

    build: function() {
      var cell = this._cell();
      cell.text(this._val());
      return cell;
    }
  });

  var Id = Text.extend({
    init: function(issue) {
      this._super("id", issue, false);
    },

    _val: function() {
      return this.issue.id;
    },

    title: function() {
      return "";
    }
  });
    
  var CodeReviewer = Text.extend({
    init: function(name, issue) {
    
      this._super(name, issue, false);
    },

    _val: function() {
       
      
        var value = Util.valFromArray(this.issue.field, this.name);
        if(value){
            return value[0].value;  
        } else{
            return "";
        }
    },

    title: function() {
      return name;
    }
  });
    
  var Reporter = Text.extend({
    init: function(issue) {
      this._super("reporterFullName", issue, false);
    },    
     
    title: function() {
      return "Reporter";
    }
  });
    
 
  var Priority = Column.extend({
    init: function(issue) {
      this._super("Priority", issue, false);
    },

    build: function() {
      var el = $('<div></div>', {class: "type"});
      el.addClass(this._val()[0].toLowerCase());
      el.text(this._val("Type")[0].substring(0, 1).toUpperCase());
      var td = this._cell();
      td.append(el);
      return td;
    },

    title: function() {
      return "";
    }
  });
    
  var State = Column.extend({
    init: function(issue) {
      this._super("State", issue, false);
    },

    build: function() {
      var el = $('<div></div>', {class: "state mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect"});
      var stateVal = Util.valFromArray(this.issue.field, this.name).toString();
      
      el.addClass(stateVal.toLowerCase().replace(/ /g,'_'));
      el.text(stateVal);
      var td = this._cell();
      td.append(el);
      return td;
    },

    title: function() {
      return "";
    }
  });
    

  var Updated = Column.extend({
    init: function(issue) {
      this._super("updated", issue);
    },

    build: function() {
      var cell = this._cell();

      var days = Util.daysPassed(this._val());
      cell.append($("<div/>", {class: days < 2 ? "recently" : "old"}));

      var issue_stamp = parseInt(this._val());
      var date = new Date(issue_stamp);

      var text = "";

      switch (days) {
        case 0:
          text = "Today";
          break;
        case 1:
          text = "Yesterday";
          break;
        case 2:
        case 3:
        case 4:
        case 5:
          text = Util.DAYS[date.getDay()];
          break;
        default:
          text = ('0' + date.getDate()).slice(-2) + "." + ('0' + date.getMonth()).slice(-2) + "." + date.getFullYear().toString().slice(2);
          break;
      }

      var _text = $("<div/>", {class: "date"});
      _text.text(text);
      cell.append(_text);

      return cell;
    }
  });

  var Factory = Class.extend({
    init: function(issue) {
      this.issue = issue;
    },

    _create: function(name) {
      var column;
      switch (name) {
        case "Priority":
          column = new Priority(this.issue);
          break;
        case "State":
          column = new State(this.issue);
          break;      
        case "id":
          column = new Id(this.issue);
          break;
        case "updated":
          column = new Updated(this.issue);
          break;
        case "Reporter":
          column = new Reporter(this.issue);
          break;          
        case "Code Reviewed By":
          column = new CodeReviewer(name,this.issue);
          break;
        case "Assignee":
          column = new CodeReviewer(name,this.issue);
          break;
        case "Assigned QA":
          column = new CodeReviewer(name,this.issue);
          break;
        case "Business Owner":
          column = new CodeReviewer(name,this.issue);
          break;      
        case "summary":
          column = new Text(name, this.issue, false);
          break;
        default:
          column = new Text(name, this.issue);
          break;
      }

      return column;
    }
  });

  Factory.create = function(name, issue) {
    return new Factory(issue)._create(name);
  };

  return Factory;
});