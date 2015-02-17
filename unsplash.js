#! /usr/bin/env node

// General dependencies
var fs = require('fs-extra');
var exec = require('child_process').exec;
var path = require('path');
var homeFolder = require('user-home');
var program = require('commander');
var request = require('request');
var inquirer = require('inquirer');
var clipboard = require('copy-paste');
var chalk = require('chalk');


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


// Prepare inquirer questions
var firstTimeQuestion = [{
	type: "confirm",
	name: "installDatabase",
	premessage: "\nHi! And thank you very much for using unsplash-cli.\n\nIt seems to be your first time using this incredible tool.\nTo begin with, we need to download the picture database to\n\n\t" + databasePath + "\n",
	message: "Do you wish to continue",
	default: false
}];

// Launch cli
fs.readFile(databasePath, 'utf8', function (err, data){
	if (err) {
		console.log(firstTimeQuestion[0].premessage);
		inquirer.prompt(firstTimeQuestion, function(answers) {
			if (answers.installDatabase) {
				fs.mkdirs(unsplashPath, function(err) {
					if (err) return console.error(err);
				});
				request(unsplashUrl.database, function (error, response, body) {
					if (!error && response.statusCode == 200) {
						fs.writeFile(databasePath, body, function (err) {
							if (err) console.log(chalk.red("\nUnable to write the database, make sure it is not already in use."));
							else console.log(chalk.green("\nThe database has been successfully saved, you can now use unsplash-cli!"));
						});
					}
					else {
						console.log(chalk.red("\nUnable to download the database, make sure you are connected to the internet..."));
					}
				});
			}
			else process.exit();
		});
	}
	else {

		var databaseContent = data;
		var databaseJson = JSON.parse(databaseContent);
		var lastId = databaseJson[databaseJson.length-1].id;

		function randomImage() {
			return random(0, lastId);
		}

		// Program General Config
		program
			.version('0.1.0')
			.usage('[command] [options] [arguments]');

		// Program Update Database
		program
			.command('update')
			.description('update image database')
			.action(function(){
				request(unsplashUrl.database, function (error, response, body) {
					if (!error && response.statusCode == 200) {
						fs.writeFile(databasePath, body, function (err) {
							if (err) console.log(chalk.red("\nUnable to write the new database, make sure it is not already in use."));
							else {
								var oldLastId = lastId;
								var newLastId;

								fs.readFile(databasePath, 'utf8', function (err, data){
									if (err) console.log(err);
									else {
										databaseContent = data;
										databaseJson = JSON.parse(databaseContent);
										newLastId = databaseJson[databaseJson.length-1].id;
										newPics = newLastId - oldLastId;
										console.log(chalk.green("\nThe database has been successfully updated, you can now enjoy your new %s pictures, from id %s to %s!"), newPics, oldLastId + 1, newLastId);
									}
								});
							}
						});
					}
					else {
						console.log(chalk.red("\nUnable to update the new database, make sure you are connected to the internet."));
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
			.option("-I, --image-name [name]", "image name")
			.option("-l, --link", "get picture link and copy to clipboard")
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
					console.log(chalk.red("\nYou must specify an image --id or choose a --random one"));
					return;
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

				if (options.imageName) {
					imageName = options.imageName + "." + databaseJson[imageId].format;
				}
				else {
					imageName = databaseJson[imageId].filename;
				}

				var imageDirPath = sanitizePath(options.path);
				var imagePath = path.join(imageDirPath, imageName);

				request(imageUrl, {encoding: 'binary'}, function (error, response, body) {
					if (!error && response.statusCode == 200) {
						fs.mkdirs(imageDirPath, function (err) {
							if(err) console.log(chalk.red("\nUnable to create the directory to store the image, make sure you have the right permissions."), imageDirPath);
						})
						fs.writeFile(imagePath, body, 'binary', function (err) {
							if (err) console.log(chalk.red("\nUnable to save the image %s to %s, please try again."), imageId, imagePath);
							else console.log(chalk.green("\nThe image %s has been successfully saved to %s from %s!"), imageId, imagePath);
						});
					}
					else {
						console.log(chalk.red("\nUnable to save image %s to %s, from %s, please make sure you are connected to the internet and try again."), imageId, imagePath, imageUrl);
					}
				});

				if (options.link) {
					clipboard.copy(imageUrl, function (err) {
						if (err) console.log(chalk.red("\nUnable to copy the link to clipboard..."));
						else console.log(chalk.green("\nLink successfully copied to clipboard"));
					})
				}
			});


		// Program Get Link To Image
		program
			.command('link')
			.description('get link to image')
			.option("-i, --id [id]", "set image id")
			.option("-r, --random", "get random image id")
			.option("-f, --full", "full size image")
			.option("-s, --size <width>,<height>", "image size in pixels - default is 300,200", splitList, [300,200])
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
					console.log(chalk.red("\nYou must specify an image --id or choose a --random one"));
					return;
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

				clipboard.copy(imageUrl, function (err) {
					if (err) console.log(chalk.red("\nUnable to copy the link to clipboard..."));
					else console.log(chalk.green("\nThe following link has been successfully copied to clipboard:\n\n\t", imageUrl));
				})
			});


		// Program Set Deskop With Image
		program
			.command('desktop')
			.description('set image as desktop')
			.option("-i, --id [id]", "set image id")
			.option("-r, --random", "get random image id")
			.option("-f, --full", "full size image")
			.option("-s, --size <width>,<height>", "image size in pixels - default is 300,200", splitList)
			.option("-p, --path [path]", "where the image should be stored", unsplashPath)
			.option("-I, --image-name [name]", "image name")
			.option("-l, --link", "get picture link and copy to clipboard")
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
					console.log(chalk.red("\nYou must specify an image --id or choose a --random one"));
					return;
				}

				if (options.size) {
					imageUrl = unsplashUrl.root + options.size[0] + "/" + options.size[1] + "?image=" + imageId;
				}
				else {
					imageUrl = databaseJson[imageId].post_url + "/download";
				}

				if (options.imageName) {
					imageName = options.imageName + "." + databaseJson[imageId].format;
				}
				else if (options.pathname === unsplashPath) {
					imageName = "desktop-image" + "." + databaseJson[imageId].format;
				}
				else {
					imageName = "desktop-image_" + databaseJson[imageId].id + "." + databaseJson[imageId].format;
				}

				var imageDirPath = sanitizePath(options.path);
				var imagePath = path.join(imageDirPath, imageName);

				request(imageUrl, {encoding: 'binary'}, function (error, response, body) {
					if (!error && response.statusCode == 200) {
						fs.mkdirs(imageDirPath, function (err) {
							if(err) console.log(chalk.red("\nUnable to create the directory to store the image, make sure you have the right permissions."), imageDirPath);
						})
						fs.writeFile(imagePath, body, 'binary', function (err) {
							if (err) console.log(chalk.red("\nUnable to save the image %s to %s, please try again."), imageId, imagePath);
							else {
								var script = "sqlite3 ~/Library/Application\\ Support/Dock/desktoppicture.db \"update data set value = \'" + imagePath + "\'\" && killall Dock";
								exec(script, function (error, stdout, stderr){
									console.log(chalk.green("\nThe image %s has been successfully saved to %s and set as your desktop image!"), imageId, imagePath);
								});
							}
						});
					}
					else {
						console.log(chalk.red("\nUnable to save image %s to %s, from %s, please make sure you are connected to the internet and try again."), imageId, imagePath, imageUrl);
					}
				});

				if (options.link) {
					clipboard.copy(imageUrl, function (err) {
						if (err) console.log(chalk.red("\nUnable to copy the link to clipboard..."));
						else console.log(chalk.green("\nLink successfully copied to clipboard"));
					})
				}
			});

		program.parse(process.argv);
	}
});

