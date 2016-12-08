# NoFrameNet
[![Build][travis-image]][travis-url]
[![Dependencies][david-dep-image]][david-url]
[![MIT License][license-image]][license-url]
[![FrameNet][framenet-image]][framenet-url]

Opinionated import of FrameNet XML data to MongoDB

## Requirements
You need to have [Mongo](https://docs.mongodb.com/manual/administration/install-community/), [Node and npm](https://nodejs.org/en/download/) installed on your system.
NoFrameNet should work on Node v6.9.2 and above, npm v3.10.9 and above and mongo v3.2.9 and above. Earlier versions may work as well but we haven't tested them.

## Import
To import FrameNet XML data to MongoDB

### 1. Download [FrameNet XML data](https://framenet.icsi.berkeley.edu/fndrupal/framenet_request_data)
### 2. Download [NoFrameNet](https://github.com/akb89/noframenet/releases/tag/v1.0)
### 3. Install the required dependencies
Run the following command in your terminal, under the NoFrameNet directory:
```
npm install
```
### 4. Set-up the configuration
Modify the `config/production.js` file
```
const config = {
  dbUri: 'mongodb://localhost:27017/noframenet15',
  logger: logger.info,
  frameNetDir: '/Users/AKB/Desktop/fndata-1.5/',
  frameChunkSize: 100,
  lexUnitChunkSize: 50,
  fullTextChunkSize: 20,
};
```
The `frameNetDir` parameter should refer to the absolute path of the unzipped FrameNet data directory.

You can tweak the `frameChunkSize` and `lexUnitChunkSize`, `fullTextChunkSize` parameters to improve import speed by specifying how many frames, lu or fulltext files should be processed at once.  

### 5. Start the full import process
Run the following command in your terminal, under the NoFrameNet directory:
```
npm run import
```

The import process usually takes about 20min to 30min in total (tested on a MacBook Pro with 2,8 GHz Intel Core i5 and 8 GB 1600 MHz DDR3)

## Data Fix
### Wrong Phrase Type
In Sentence#1492916 , _'Before his death Edward IV had also initiated military activity against France , following Louis XI 's renunciation of some of the key terms of the 1475 treaty of Picquigny .'_, the Phrase Type of the 'Activity' frame element corresponding to the 'initiate.v' lexical unit is mistakenly marked as an 'Obj'.
To replace the 'Obj' with an 'NP', run the following command after import:
```
npm run fix
```

## Models
Details about the underlying Mongoose models can be found on [NoFrameNet-Core](https://github.com/akb89/noframenet-core)

## FrameNet Version Compatibility
NoFrameNet has been tested on FrameNet:
- 1.5
- 1.6
- 1.7

[travis-image]:https://img.shields.io/travis/akb89/noframenet.svg?style=flat-square
[travis-url]:https://travis-ci.org/akb89/noframenet
[framenet-image]:https://img.shields.io/badge/FrameNet-%3E%3D1.5-blue.svg?style=flat-square
[framenet-url]:https://framenet.icsi.berkeley.edu/fndrupal
[license-image]:http://img.shields.io/badge/license-MIT-000000.svg?style=flat-square
[license-url]:LICENSE.txt
[david-dep-image]: https://david-dm.org/akb89/noframenet.svg?style=flat-square
[david-url]: https://david-dm.org/akb89/noframenet.svg?style=flat-square
