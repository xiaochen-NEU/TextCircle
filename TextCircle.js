this.Documents = new Mongo.Collection("documents");
EditingUsers = new Mongo.Collection("editingUsers");

if (Meteor.isClient) {

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

  Template.editor.helpers({
    docid:function(){
      // console.log("doc id helper:");
      // console.log(Documents.findOne());
      // return Documents.findOne()._id;
      var doc = Documents.findOne();
      if (doc){
        return doc._id;
      }
      else {
        return undefined;
      }
    },
    config:function(){
      return function(editor){
        editor.setOption("lineNumbers", true);
        editor.setOption("theme", "cobalt");
        editor.setOption("mode", "html");
        editor.on("change", function(cm_editor, info){
          //console.log(cm_editor.getValue());
          $("#viewer_iframe").contents().find("html").html(cm_editor.getValue());
          Meteor.call("addEditingUser");
        });

      }
    },
  });

  Template.editingUsers.helpers({
    users:function(){
      var doc, eusers, users;
      doc = Documents.findOne();
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

}// end isClient...

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
    // startup code that creates a document in case there isn't one yet. 
    if (!Documents.findOne()){// no documents yet!
      Documents.insert({title:"my new document"});
    }
  });
}


Meteor.methods({
  addEditingUser: function(){
    var doc, user, eusers;
    doc = Documents.findOne();
    if (!doc){return;} // no doc give up
    if (!this.userId){return;} // no login user give up
    // now I have a doc and possibly a user
    user = Meteor.user().profile;
    eusers = EditingUsers.findOne({docid:doc._id});
    if (!eusers){
      eusers = {
        docid:doc._id,
        users:{},
      };
    }
    user.lastEdit = new Date();
    eusers.users[this.userId] = user;
    //upsert: insert or update if filter matches
    EditingUsers.upsert({_id:eusers._id}, eusers); 
  }
})



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
