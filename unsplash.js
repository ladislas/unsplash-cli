#! /usr/bin/env node

// General dependencies
var fs = require('fs-extra');
var path = require('path');
var homeFolder = require('user-home');
var program = require('commander');
var request = require('request');
var inquirer = require('inquirer');

// Global variables
var unsplashPath = path.resolve(homeFolder + '/.unsplash-cli');
var databasePath = path.resolve(unsplashPath + '/database.json');
var unsplashUrl = {
	root: "https://unsplash.it/",
	database: "https://unsplash.it/list",
}

// Global functions
function splitList(val) {
	return val.split(',').map(Number);
}

function sanitizePath(pth) {
	return path.resolve(pth);
}

function random(low, high) {
	return Math.floor(Math.random() * (high - low + 1) + low);
}

// Check if database and directory exist
var installQuestions = [{
	type: "confirm",
	name: "installDatabase",
	premessage: "\nHi! And thank you very much for using unsplash-cli.\n\nIt seems to be your first time using this incredible tool.\nTo begin with, we need to download the picture database to\n\n\t" + databasePath + "\n",
	message: "Do you wish to continue",
	default: false
}];

fs.open(databasePath, 'r', function (err, fd){
	if (err) {
		console.log(installQuestions[0].premessage);
		inquirer.prompt(installQuestions, function(answers) {
			if (answers.installDatabase) {
				fs.mkdirs(unsplashPath, function(err) {
					if (err) return console.error(err);
				});
				request(unsplashUrl.database, function (error, response, body) {
					if (!error && response.statusCode == 200) {
						fs.writeFile(databasePath, body, function (err) {
							if (err) console.log("\nUnable to write the file, make sure it does not already exist...");
							else console.log("\nThe database has been successfully saved, you can now use unsplash-cli!")
						});
					}
					else {
						console.log("\nUnable to download the database, make sure you are connected to the internet...");
					}
				});
			}
			else return;
		});
	}
});

// Load database and get last id
var databaseContent = fs.readFileSync(databasePath, 'utf8');
var databaseJson = JSON.parse(databaseContent);
var lastId = databaseJson[databaseJson.length-1].id;

function randomImage() {
	return random(0, lastId);
}

// Program General Config
program
.version('0.1.0')
.usage('[command] [option] [arguments]');

// Program Update Database
program
.command('update')
.description('update image database')
.action(function(){
	request(unsplashUrl.database, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			fs.writeFile(databasePath, body, function (err) {
				if (err) console.log("\nUnable to write the file, make sure it does not already exist...");
				else console.log("\nThe database has been successfully updated, you can now enjoy new pictures!")
			});
		}
		else {
			console.log("\nUnable to update the database, make sure you are connected to the internet...");
		}
	});
});

// Program Download Images
program
.command('get')
.description('download image')
.option("-i, --id [id]", "set image id")
.option("-r, --random", "get random image id")
.option("-f, --full", "full size image")
.option("-s, --size <width>,<height>", "image size in pixels - default is 300,200", splitList, [300,200])
.option("-p, --path [path]", "where the image should be stored", "./")
.option("-n, --name [name]", "image name")
.action(function(options){
	var imageUrl;
	var imageName;
	var imageId;

	if (options.id) {
		imageId = options.id;
	}
	else if (options.random) {
		imageId = randomImage();
	}
	else {
		console.log("You must specify an image id or choose a random one..."); return;
	}

	if (options.full) {
		imageUrl = databaseJson[imageId].post_url + "/download";
	}
	else if (options.size) {
		imageUrl = unsplashUrl.root + options.size[0] + "/" + options.size[1] + "?image=" + imageId;
	}
	else {
		imageUrl = databaseJson[imageId].post_url + "/download";
	}

	if (options.name) {
		imageName = options.name + "." + databaseJson[imageId].format;
	}
	else {
		imageName = databaseJson[imageId].filename;
	}

	var imageDirPath = sanitizePath(options.path);
	var imagePath = path.join(imageDirPath, imageName);

	request(imageUrl, {encoding: 'binary'}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			fs.mkdirs(imageDirPath, function (err) {
				if(err) console.log("Unable to create %s to store the image", imageDirPath);
			})
			fs.writeFile(imagePath, body, 'binary', function (err) {
				if (err) console.log("\nUnable to save the picture %s to %s, from %s, please try again...", imageId, imagePath, imageUrl);
				else console.log("\nSuccessfully saved picture %s to %s from %s!", imageId, imagePath, imageUrl);
			});
		}
		else {
			console.log("\nUnable to save the picture %s to %s, from %s, please try again...", imageId, imagePath, imageUrl);
			// console.log("\nUnable to save the picture %s to %s, please make sure you are connected to the internet and try again...", options.id, options.path);
		}
	});
});


// Program Get Link To Image
program
.command('link')
.description('get image link and copy to clipboard')
.option("-i, --id [value]", "image id")
.option("-r, --random", "random image")
.option("-s, --size <width> <height>", "choose image size")
.action(function(id, options){
	console.log('Download image with id %s to %s', id, options.path);
});

// Program Set Deskop With Image
program
.command('desktop')
.description('get image link')
.option("-i, --id [value]", "get image with id")
.option("-r, --random", "get a random image")
.option("-p, --path [path]", "path to directory to store the image")
.option("-s, --size <width> <height>", "choose image size")
.action(function(id, options){
	console.log('Download image with id %s to %s', id, options.path);
});

program
.command('exec <cmd>')
.alias('ex')
.description('execute the given remote cmd')
.option("-e, --exec_mode <mode>", "Which exec mode to use")
.action(function(cmd, options){
	console.log('exec "%s" using %s mode', cmd, options.exec_mode);
}).on('--help', function() {
	console.log('  Examples:');
	console.log();
	console.log('    $ deploy exec sequential');
	console.log('    $ deploy exec async');
	console.log();
});

program
.command('*')
.action(function(env){
	console.log('deploying "%s"', env);
});

program.parse(process.argv);
