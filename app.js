var Twitter = require('twitter'),
    neo4j   = require('neo4j');

var triggerstring = "@legisgraph #neo4j";

var client = new Twitter({
	consumer_key: process.env.TWITTER_CONSUMER_KEY,
	consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
	access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
	access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

var db = new neo4j.GraphDatabase(process.env.NEO4J_CONNECTION_STRING);

var stream = client.stream('user', {});

stream.on('data', function(event) {
	console.log(event);


var text = event.text,
    user = "@" + event.user.screen_name,
    status_id = event.id_str,
    cypher = text.replace(triggerstring, "");

cypher = cypher.replace("&gt;", ">");
cypher = cypher.replace("&lt;", "<");
cypher = cypher.replace(/\u2018/g, "'")
	 .replace(/\u2019/g, "'")
	 .replace(/\u201c/g, '"')
	 .replace(/\u201d/g, '"')
	 .replace(/\u2014/g, "--")
console.log(cypher);

db.cypher({query: cypher},
	function(err, results) {
		if (err || !results) {
			console.log(err);
		} else {
			var record = results[0];
			var resultText = JSON.stringify(record);
			console.log(resultText);
			var tweetText = user + " " + resultText;

			client.post('statuses/update', {status: tweetText, in_reply_to_status_id: status_id})
				.then(function(tweet) {
					console.log(tweet);
				})
				.catch(function(error) {
					console.log(error);
					});
		}
	}
);
});
