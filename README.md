[![NPM](https://nodei.co/npm/unsplash-cli.png)](https://npmjs.org/package/unsplash-cli)

[![npm version](https://badge.fury.io/js/unsplash-cli.svg)](http://badge.fury.io/js/unsplash-cli)

# unsplash-cli

## About

A command line tool to download Unsplash pictures through unsplash.it

With this tool you can:

- download any image from [unsplash.it](https://unsplash.it)
- get the link to any image with the side you need for your website
- set any image as your desktop image on OS X

## How to install

It's as easy as:

```
$ npm install -g unsplash-cli
```

And then run the following to get the database:

```
$ unsplash update
```

## How to use

### Help

With `unsplash -h` you'll get:

```
  Usage: unsplash [command] [options] [arguments]


  Commands:

    update              update image database
    get [options]       download image
    link [options]      get link to image
    desktop [options]   set image as desktop

  Options:

    -h, --help     output usage information
    -V, --version  output the version number
```

### `unsplash get`

Use `get` to download any image:

```
$ unsplash get -h

  Usage: get [options]

  download image

  Options:

    -h, --help                   output usage information
    -i, --id [id]                set image id
    -r, --random                 get random image id
    -f, --full                   full size image
    -s, --size <width>,<height>  image size in pixels - default is 300,200
    -p, --path [path]            where the image should be stored
    -I, --image-name [name]      image name
    -l, --link                   get picture link and copy to clipboard
```

**For example:**

```
$ unsplash get --id 154 --path ~/Desktop/Unsplash-cli --size 345,120 --image-name my_first_unsplash_cli_image
```

### `unsplash link`

Use `link` to get the link to any image of any size and copy to your clipboard.

```
$ unsplash link -h

Usage: link [options]

  get link to image

  Options:

    -h, --help                   output usage information
    -i, --id [id]                set image id
    -r, --random                 get random image id
    -f, --full                   full size image
    -s, --size <width>,<height>  image size in pixels - default is 300,200
```

**For example:**

```
$ unsplash link --random --size 700,350

The following link has been successfully copied to clipboard:

	 https://unsplash.it/700/350?image=542

```

### `unsplash desktop`

Use `desktop` to set any image as your desktop image.

```
$ unsplash desktop -h

  Usage: desktop [options]

  set image as desktop

  Options:

    -h, --help                   output usage information
    -i, --id [id]                set image id
    -r, --random                 get random image id
    -f, --full                   full size image
    -s, --size <width>,<height>  image size in pixels - default is 300,200
    -p, --path [path]            where the image should be stored
    -I, --image-name [name]      image name
    -l, --link                   get picture link and copy to clipboard
```

**For example:**

```
$ unsplash desktop --id 154 --path ~/Desktop/Unsplash-cli-desktop-image  --image-name my_first_unsplash_cli_image
```

## Author

Ladislas de Toldi - ladislas [at] weareleka dot com

- [github/ladislas](https://github.com/ladislas)
- [twitter/ladisonline](https://twitter.com/ladisonline)

## License

Copyright (c) 2015 Ladislas de Toldi  
Released under the MIT license
