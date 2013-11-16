var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

sf = {
	clock: function(){
		var a = new Date(),
		b = a.getHours(),
		c = a.getMinutes(),
		d = a.getSeconds();

		if(b < 10) b = "0" + b;
		if(c < 10) c = "0" + c;
		if(d < 10) d = "0" + d;

		return b + ":" + c + ":" + d;
	},

	randomString: function(length){
		if(typeof length === "undefined" || length.length < 1) return "Error";
		var a = "";
		for(var b = 0; b < length; b++){
			a += characters.charAt(Math.floor(Math.random() * characters.length));
		}

		return a;
	},

	emitChat: function(data){
		if(data.MSG.indexOf("!") === 0){
			var commands = data.MSG.substring(1).split(/ (.+)?/);
			if(sf.admins.indexOf(data.from.id) > -1){
				var admin = true;
			}

			switch(commands[0].toLowerCase()){
				case "password":
				case "pass":
					if(commands[1] === password){
						sf.admins.push(data.from.id);
						sf.systemMessage(data.from.name + " just claimed his spot as an admin!");
						password = sf.randomString(10);
						sys.puts("\nNew password is: " + password);
					}
				break;

				case "say":
				case "tell":
					if(!admin) return "noAdmin";
					sf.systemMessage(commands[1]);
					sys.puts("\n" + data.from.name + " just made the system say: " + commands[1]);
				break;

				case "newpass":
				case "rpass":
				case "adminpass":
					password = sf.randomString(10);
					sys.puts("\nNew password is: " + password);
				break;

				case "kickall":
					if(!admin) return "noAdmin";
					io.sockets.emit("kick", parseFloat(commands[1]) * 1000);
					sf.systemMessage(data.from.name + " has kicked everyone for " + parseFloat(commands[1]) / 1000 + " seconds.");
					sys.puts("\n" + data.from.name + " just kicked everyone.");
				break;
			}

			return "command";
		}

		io.sockets.emit("recieveChat", {
			MSG: data.MSG,
			from: data.from,
			chatID: sf.randomString(12)
		});

		sys.puts("\n" + data.from.name + " just said: " + data.MSG);
	},

	systemMessage: function(MSG){
		io.sockets.emit("systemMessage", MSG);
	},

	announceNameChange: function(data){
		sys.puts("\n" + data.from + " just changed his name to: " + data.to);
		io.sockets.emit("nameChange", data);
	},

	admins: [],
	users: []
}

var sys = require("sys"),
http = require("http"),
path = require("path"),
url = require("url"),
filesys = require("fs"),
server = http.createServer(function(request, response){
	var myPath = url.parse(request.url).pathname;

	if(myPath === "/"){
		myPath = "/" + "smooth.html";
	}

	var fullPath = path.join(process.cwd(), myPath);

	path.exists(fullPath, function(exists){
		if(!exists){
			response.writeHeader(404, {"Content-type" : "text/plain"});
			response.write("We ain't found this shit.");
			response.end();
		}else{
			filesys.readFile(fullPath, "binary", function(err, file){
				if(err){
					response.writeHeader(500, {"Content-type": "text/plain"});
					response.write(err + "\n");
					response.end();
				}else{
					response.writeHeader(200);
					response.write(file, "binary");
					response.end();
				}

			});
		}
	});
}).listen(1337);

password = sf.randomString(10);
sys.puts("Server running on child labour! - " + password);

var io = require('socket.io').listen(server, { log: false });

io.sockets.on('connection', function (socket){
	socket.on("sendChat", function(data){
		sf.emitChat(data);
	});

	socket.on("systemChat", function(data){
		if(sf.admins.indexOf(data.from.id) > -1){
			sf.systemMessage(data.MSG);
		}
	});

	socket.on("nameChange", function(data){
		sf.announceNameChange(data);
	});

	socket.on("userLeave", function(user){
		sf.systemMessage(sf.users[user.id].name + " just left the room!");
		sys.puts("\n" + sf.users[user.id].name + " just left the room!");
		sf.users[user.id] = "OFFLINE";
	});

	socket.on("userJoin", function(user){
		sf.users[user.id] = user;
		sf.systemMessage(sf.users[user.id].name + " just joined the room!");
		sys.puts("\n" + sf.users[user.id].name + " just joined the room!");
	});
});
