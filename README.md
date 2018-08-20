# NoFrameNet
[![GitHub release][release-image]][release-url]
[![Build][travis-image]][travis-url]
[![Dependencies][david-dep-image]][david-url]
[![DevDependencies][david-dev-dep-image]][david-dev-url]
[![MIT License][license-image]][license-url]
[![FrameNet][framenet-image]][framenet-url]

Opinionated import of FrameNet XML data to MongoDB

## Requirements
You need to have [Mongo](https://docs.mongodb.com/manual/administration/install-community/), [Node and npm](https://nodejs.org/en/download/) installed on your system.
NoFrameNet should work on Node v6.9.2 and above, npm v3.10.9 and above and mongo v3.2.9 and above. Earlier versions may work as well but we haven't tested them.

## Import
To import FrameNet XML data to MongoDB

### 1. Download [FrameNet XML data](https://framenet.icsi.berkeley.edu/fndrupal/framenet_request_data)
### 2. Download [NoFrameNet](https://github.com/akb89/noframenet/releases/latest)
### 3. Install the required dependencies
Run the following command in your terminal, under the NoFrameNet directory:
```
npm install
```
### 4. Set-up the configuration
Modify the `config/production.js` file
```
const config = {
  dbUri: 'mongodb://localhost:27017/fn_en_170',
  logger: logger.info,
  frameNetDir: '/Users/AKB/Dropbox/FrameNetData/fndata-1.7',
  splitsDir: '/Users/AKB/Dropbox/FrameNetData/fndata-1.7',
  importLexUnits: true,
  importFullTexts: true,
  importHierarchy: true,
  frameChunkSize: 150,
  lexUnitChunkSize: 200,
};
```
The `frameNetDir` parameter should refer to the absolute path of the unzipped FrameNet data directory.

You can tweak the `frameChunkSize` and `lexUnitChunkSize`parameters to improve import speed by specifying how many frame or lexunit files should be processed at once.

Set `importLexUnits` to `true` if you wish to import the content of the `lu` dir. Set `importFullTexts` to `true` if you wish to important the content of the `fulltext` dir. Set `importHierarchy` to `true` if you wish to import a
formatted collection of FrameNet Frame and FE hierarchies, as used by
the [Valencer API](http://www.github.io/akb89/valencer).

Specify a different `splitsDir` parameter if you want to split FrameNet files into train/dev/test directories and import only a specific dir.
Your frameNetDir should have the following structure:
```
.
|-- frameNetDir
|   |-- frame
|   |   |-- Abandonment.xml
|   |   |-- ...
|   |-- frRelation.xml
|   |-- train
|   |   |-- fulltext
|   |   |   |-- corpusNameXYZ__123.xml
|   |   |   |-- ...
|   |   |-- lu
|   |   |   |-- luFile.xml
|   |   |   |-- ...
|   |-- dev
|   |   |-- fulltext
|   |   |   |-- corpusNameXYZ__123.xml
|   |   |   |-- ...
|   |   |-- lu
|   |   |   |-- luFile.xml
|   |   |   |-- ...
|   |-- test
|   |   |-- fulltext
|   |   |   |-- corpusNameXYZ__123.xml
|   |   |   |-- ...
|   |   |-- lu
|   |   |   |-- luFile.xml
|   |   |   |-- ...
```

### 5. Start the full import process
Run the following command in your terminal, under the NoFrameNet directory:
```
npm run import
```

The import process usually takes about 20min to 30min in total (tested on a MacBook Pro with 2,8 GHz Intel Core i5 and 8 GB 1600 MHz DDR3)

## Data Fix
### Wrong Phrase Type
In Sentence#1492916 , _'Before his death Edward IV had also initiated military activity against France , following Louis XI 's renunciation of some of the key terms of the 1475 treaty of Picquigny .'_, the Phrase Type of the 'Activity' frame element corresponding to the 'initiate.v' lexical unit is mistakenly marked as an 'Obj'.
Data are fixed automatically after import via the `fix` script.

## Models
Details about the underlying Mongoose models can be found on [NoFrameNet-Core](https://github.com/akb89/noframenet-core)

## FrameNet Version Compatibility
NoFrameNet has been tested on FrameNet:
- 1.5
- 1.6
- 1.7

[release-image]:https://img.shields.io/github/release/akb89/noframenet.svg?style=flat-square
[release-url]:https://github.com/akb89/noframenet/releases/latest
[travis-image]:https://img.shields.io/travis/akb89/noframenet.svg?style=flat-square
[travis-url]:https://travis-ci.org/akb89/noframenet
[framenet-image]:https://img.shields.io/badge/framenet-1.5%E2%87%A1-blue.svg?style=flat-square
[framenet-url]:https://framenet.icsi.berkeley.edu/fndrupal
[license-image]:http://img.shields.io/badge/license-MIT-000000.svg?style=flat-square
[license-url]:LICENSE.txt
[david-url]: https://david-dm.org/akb89/noframenet
[david-dep-image]: https://david-dm.org/akb89/noframenet.svg?style=flat-square
[david-dev-dep-image]: https://img.shields.io/david/dev/akb89/noframenet.svg?style=flat-square
[david-dev-url]: https://david-dm.org/akb89/noframenet?type=dev
