










// Slash command - easy one

controller.on('slash_command', function (bot, message) {
    console.log('Here is the actual slash command used: ', message.command);

    bot.replyPublic(message, '<@' + message.user + '> What are you working on!');
});

/*
controller.on('slash_command', function(bot, message) {
  
  switch (message.command) {
  case '/say':
    var choices = message.text.split(',');
    var choice = choices[Math.random() * choices.length | 0];
    slashCommand.replyPublicDelayed(message, '/say #general to update the project status every Monday at 9am');
    break;
  }
});
*/











