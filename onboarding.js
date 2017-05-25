/*+-+-+ +-+-+-+-+-+ +-+-+
|U|X| |S|l|a|c|k| |B|O|T|
+-+-+ +-+-+-+-+-+ +-+-+*/

////////////////////////////////////////////////////////////////////////////////////////////////
////// local slack set up using ngrok + port + clientId + clientSecret
////////////////////////////////////////////////////////////////////////////////////////////////


/* Uses the slack button feature to offer a real time bot to multiple teams */
var Botkit = require('./lib/Botkit.js');


if (!process.env.clientId || !process.env.clientSecret || !process.env.port) {
  console.log('Error: Specify clientId clientSecret and port in environment');
  process.exit(1);
}


var controller = Botkit.slackbot({
  //debug: true,
   json_file_store: './store_data/',
  //storage: mongoStorage
}).configureSlackApp(
  {
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    scopes: ['bot'],
  }
);


controller.setupWebserver(process.env.port,function(err,webserver) {
  controller.createWebhookEndpoints(controller.webserver);

  controller.createOauthEndpoints(controller.webserver,function(err,req,res) {
    if (err) {
      res.status(500).send('ERROR: ' + err);
    } else {
      res.send('Success!');
    }
  });
});


// just a simple way to make sure we don't
// connect to the RTM twice for the same team
var _bots = {};
function trackBot(bot) {
  _bots[bot.config.token] = bot;
}

// interactive message callback
controller.on('interactive_message_callback', function(bot, message) {

    var ids = message.callback_id.split(/\-/);
    var user_id = ids[0];
    var item_id = ids[1];

    controller.storage.users.get(user_id, function(err, user) {

        if (!user) {
            user = {
                id: user_id,
                list: []
            }
        }

        for (var x = 0; x < user.list.length; x++) {
            if (user.list[x].id == item_id) {
                if (message.actions[0].value=='flag') {
                    user.list[x].flagged = !user.list[x].flagged;
                }
                if (message.actions[0].value=='delete') {
                    user.list.splice(x,1);
                }
            }
        }


        var reply = {
            text: 'Here is <@' + user_id + '>s list:',
            attachments: [],
        }

        for (var x = 0; x < user.list.length; x++) {
            reply.attachments.push({
                title: user.list[x].text + (user.list[x].flagged? ' *FLAGGED*' : ''),
                callback_id: user_id + '-' + user.list[x].id,
                attachment_type: 'default',
                actions: [
                    {
                        "name":"flag",
                        "text": ":waving_black_flag: Flag",
                        "value": "flag",
                        "type": "button",
                    },
                    {
                       "text": "Delete",
                        "name": "delete",
                        "value": "delete",
                        "style": "danger",
                        "type": "button",
                        "confirm": {
                          "title": "Are you sure?",
                          "text": "This will do something!",
                          "ok_text": "Yes",
                          "dismiss_text": "No"
                        }
                    }
                ]
            })
        }

        bot.replyInteractive(message, reply);
        controller.storage.users.save(user);


    });

});

// Bot replies to the person via dm who invites the bot into the channel
controller.on('create_bot',function(bot,config) {

  if (_bots[bot.config.token]) {
    // already online! do nothing.
  } else {
    bot.startRTM(function(err) {

      if (!err) {
        trackBot(bot);
      }

      bot.startPrivateConversation({user: config.createdBy},function(err,convo) {
        if (err) {
          console.log(err);
        } else {
          convo.say('Thank you so much for inviting me into this channel.');
          convo.say('I am your Slackbot for GSIUXD community.');
        }
      });

    });
  }

});


// Handle events related to the websocket connection to Slack
controller.on('rtm_open',function(bot) {
  console.log('** The RTM api just connected!');
});

controller.on('rtm_close',function(bot) {
  console.log('** The RTM api just closed');
  // you may want to attempt to re-open
});


////////////////////////////////////////////////////////////////////////////////////////////////
////// local testing goes here
////////////////////////////////////////////////////////////////////////////////////////////////






/* ==============================
Slash Command starts 
================== */




/* quick way to add an attachment using slash command
controller.hears(["books"], [ 'direct_message','slash_command','direct_mention','mention'], function (bot, message) {
      bot.replyPrivate(message, {
      text: "Here is our <https://medium.com/gsiuxd/recommended-ux-books-87cc4ae69b66|recommended books>",
      username: "ReplyBot",
      icon_emoji: ":dash:",
      color: '#7CD197',
      mrkdwn: true
      
    });
});
*/

/* ====================================
/* Bot's bio
======================================= */







/* ===============
UX conversation 
=============================== */

/* bot hears ux books, books on ux design */






/* ===============
Update Readme.md file via githuh + add gifs
=============================== */


/* ===============
Install for GSIUXD team
=============================== */



// storage team data
controller.storage.teams.all(function(err,teams) {

  if (err) {
    throw new Error(err);
  }

  // connect all teams with bots up to slack!
  for (var t  in teams) {
    if (teams[t].bot) {
      controller.spawn(teams[t]).startRTM(function(err, bot) {
        if (err) {
          console.log('Error connecting bot to Slack:',err);
        } else {
          trackBot(bot);
        }
      });
    }
  }

});
