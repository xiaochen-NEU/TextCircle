
// // update the session current_date
// // variable every 1000 ms
// Meteor.setInterval(function(){
//   Session.set("current_date", new Date());
// }, 1000);

// Template.date_display.helpers({
//   current_date:function(){
//     return Session.get("current_date");
//   }
// });

// subscriptions - allow read access to collections
Meteor.subscribe("documents");
Meteor.subscribe("editingUsers");

Template.editor.helpers({
  docid:function(){
    setupCurrentDocument();
    return Session.get("docid");
    /// only the first document, may not be the one we want
    // var doc = Documents.findOne(); 
    // if (doc){
    //   return doc._id;
    // }
    // else {
    //   return undefined;
    // }
  },
  config:function(){
    return function(editor){
      editor.setOption("lineNumbers", true);
      editor.setOption("theme", "cobalt");
      editor.setOption("mode", "html");
      editor.on("change", function(cm_editor, info){
        //console.log(cm_editor.getValue());
        $("#viewer_iframe").contents().find("html").html(cm_editor.getValue());
        Meteor.call("addEditingUser", Session.get("docid"));
      });

    }
  },
});

Template.editingUsers.helpers({
  users:function(){
    var doc, eusers, users;
    doc = Documents.findOne({_id:Session.get("docid")});
    if (!doc){return;} // give up
    eusers = EditingUsers.findOne({docid:doc._id});
    if (!eusers){return;} // give up
    users = new Array();
    var i = 0;
    for (var user_id in eusers.users){
      users[i] = fixObjectKeys(eusers.users[user_id]);
      i++;

    }
    return users;

  }
})

Template.navbar.helpers({
  documents:function(){
    return Documents.find();
  }
})

Template.docMeta.helpers({
  document:function(){
    return Documents.findOne({_id:Session.get("docid")});
  },
  canEdit:function(){
    var doc;
    doc = Documents.findOne({_id:Session.get("docid")});
    if(doc){
      if (doc.owner == Meteor.userId()){
        return true;
      }
    }
    return false;
  }
})

Template.editableText.helpers({
  userCanEdit:function(doc, Collection){
    // can edit if the current doc is owned by me
    doc = Documents.findOne({_id:Session.get("docid"), 
      owner:Meteor.userId()});
    if (doc){
      return true;
    }
    else {
      return false;
    }
  }
})


/////////////////
//// EVENTS
////////////////

Template.navbar.events({
  "click .js-add-doc":function(event){
    event.preventDefault();
    console.log("Add a new doc!");
    if (!Meteor.user()){// user not available
      alert("You need to login first!");
    }
    else {
      // they are logged in.. lets insert a doc
      var id = Meteor.call("addDoc", function(err, res){
        if (!err){// all good
          console.log("event callback received id: "+res);// this one will be called later
          Session.set("docid", res);
        }
      });
      //console.log("event got an id back: "+id);// this one will be called first
      ///////////////////////////
      // Asynchronous code

    }
  },
  "click .js-load-doc":function(event){
    //console.log(this); //this: The data context for the template,
    //this represent a object with a field id
    Session.set("docid", this._id);

  }
})

Template.docMeta.events({
  "click .js-tog-private":function(event){// caution: full stop .
    console.log(event.target.checked);
    var doc = {_id:Session.get("docid"), isPrivate:event.target.checked};
    Meteor.call("updateDocPrivacy", doc);
  }
})

function setupCurrentDocument(){
  var doc;
  if (!Session.get("docid")){// no doc id set yet
    doc = Documents.findOne();
    if (doc){
      Session.set("docid", doc._id);
    }
  }
}


// this renames object keys by removing hyphens to make the compatible 
// with spacebars. 
function fixObjectKeys(obj){
  var newObj = {};
  for (key in obj){
    var key2 = key.replace("-", "");
    newObj[key2] = obj[key];
  }
  return newObj;
}

