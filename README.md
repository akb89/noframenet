# NoFrameNet
Opinionated import of FrameNet XML data to MongoDB

## Requirements
You need to have node, npm and Mongo installed on your system

## Import
To import FrameNet XML data to MongoDB

### 1. Download [FrameNet XML data](https://framenet.icsi.berkeley.edu/fndrupal/framenet_request_data)
### 2. Download [NoFrameNet]()
### 3. Install the required dependencies
Run the following command in your terminal, under the NoFrameNet directory:
```
npm install
```
### 4. Set-up the configuration
Modify the `config/production.js` file
```
const config = {
  dbUri: 'mongodb://localhost:27017/noframenet',
  logger: logger.info,
  frameNetDir: '/Users/AKB/Desktop/fndata-1.6',
  frameChunkSize: 100,
  lexUnitChunkSize: 50,
  fullTextChunkSize: 20,
};
```
### 5. Start the full import process
Run the following command in your terminal, under the NoFrameNet directory:
```
npm run import
```

The import process usually takes about 20min to 30min in total (tested on a MacBook Pro)

## FrameNet Data versions compatibility
The NoFrameNet scripts have been tested on FN 1.5, FN 1.6 and FN 1.7

## Data Cleanup
Misc. problems with FrameNet data
