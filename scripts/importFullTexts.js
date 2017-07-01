/**
 * Standalone script to import the content of the fulltext directory to MongoDB
 * This script is different from the other import scripts: it imports
 * everything synchronously as it first checks everything already in the
 * database
 */
const AnnotationSet = require('noframenet-core').AnnotationSet;
const Corpus = require('noframenet-core').Corpus;
const Document = require('noframenet-core').Document;
const Label = require('noframenet-core').Label;
const Pattern = require('noframenet-core').Pattern;
const Sentence = require('noframenet-core').Sentence;
const ValenceUnit = require('noframenet-core').ValenceUnit;
const ProgressBar = require('ascii-progress');
const toJsonixDocumentArray = require('./../utils/jsonixUtils').toJsonixDocumentArray;
const toJsonixDocumentSentenceArray = require('./../utils/jsonixUtils').toJsonixDocumentSentenceArray;
const toJsonixLabelArray = require('./../utils/jsonixUtils').toJsonixLabelArray;
const toJsonixLayerArray = require('./../utils/jsonixUtils').toJsonixLayerArray;
const toJsonixSentenceAnnoSetArray = require('./../utils/jsonixUtils').toJsonixSentenceAnnoSetArray;
const config = require('./../config');
const driver = require('./../db/mongoose');
const marshaller = require('./../marshalling/unmarshaller');
const utils = require('./../utils/utils');
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const logger = config.logger;

let notFound = 0;
let found = 0;

function isValidFNAnnoSet(jsonixAnnoSet) {
  let isValidFELayer = false;
  let isValidPTLayer = false;
  let isValidGFLayer = false;
  toJsonixLayerArray(jsonixAnnoSet).forEach((jsonixLayer) => {
    if (jsonixLayer.name === 'FE' && jsonixLayer.label) {
      isValidFELayer = true;
    }
    if (jsonixLayer.name === 'PT' && jsonixLayer.label) {
      isValidPTLayer = true;
    }
    if (jsonixLayer.name === 'GF' && jsonixLayer.label) {
      isValidGFLayer = true;
    }
  });
  if (isValidFELayer && isValidPTLayer && isValidGFLayer) {
    return true;
  }
  return false;
}

function addGFLabels(jsonixAnnoSet, labelMap) {
  if (!jsonixAnnoSet || labelMap.size === 0) {
    return new Map();
  }
  const gfLabelMap = new Map(labelMap);
  for (const jsonixLayer of toJsonixLayerArray(jsonixAnnoSet)) {
    if (jsonixLayer.name === 'GF') {
      for (const jsonixLabel of toJsonixLabelArray(jsonixLayer)) {
        if (jsonixLabel.start !== undefined && jsonixLabel.end !== undefined) {
          const key = `${jsonixLabel.start}#${jsonixLabel.end}#${jsonixLayer.rank}`;
          if (!gfLabelMap.has(key)) {
            // This is probably an annotation error
            logger.verbose(`annotation error: GF with no FE and/or PT on #${jsonixAnnoSet.id} and layer ${jsonixLayer.name} and label ${JSON.stringify(key)}`);
            return new Map();
          }
          gfLabelMap.get(key).GF = jsonixLabel.name;
        }
      }
    }
  }
  return gfLabelMap;
}

function addPTLabels(jsonixAnnoSet, labelMap) {
  if (!jsonixAnnoSet || labelMap.size === 0) {
    return new Map();
  }
  const ptLabelMap = new Map(labelMap);
  for (const jsonixLayer of toJsonixLayerArray(jsonixAnnoSet)) {
    if (jsonixLayer.name === 'PT') {
      for (const jsonixLabel of toJsonixLabelArray(jsonixLayer)) {
        if (jsonixLabel.start !== undefined && jsonixLabel.end !== undefined) {
          const key = `${jsonixLabel.start}#${jsonixLabel.end}#${jsonixLayer.rank}`;
          if (!ptLabelMap.has(key)) {
            // This is probably an annotation error
            logger.verbose(`annotation error: PT with no FE on #${jsonixAnnoSet.id} and layer ${jsonixLayer.name} and label ${JSON.stringify(key)}`);
            return new Map();
          }
          ptLabelMap.get(key).PT = jsonixLabel.name;
        }
      }
    }
  }
  return ptLabelMap;
}

function addFELabels(jsonixAnnoSet, labelMap) {
  if (!jsonixAnnoSet) {
    return new Map();
  }
  for (const jsonixLayer of toJsonixLayerArray(jsonixAnnoSet)) {
    if (jsonixLayer.name === 'FE') {
      for (const jsonixLabel of toJsonixLabelArray(jsonixLayer)) {
        if (jsonixLabel.start !== undefined && jsonixLabel.end !== undefined) {
          const key = `${jsonixLabel.start}#${jsonixLabel.end}#${jsonixLayer.rank}`;
          if (labelMap.has(key)) {
            // Do not process cases where multiple FE labels have
            // same start/end values
            logger.verbose(`annotation error: multiple FE labels with same start/end values on #${jsonixAnnoSet.id} and layer ${jsonixLayer.name} and label ${JSON.stringify(key)}`);
            return new Map();
          }
          const value = {
            FE: jsonixLabel.feID,
          };
          if (jsonixLabel.itype !== undefined) {
            value.PT = jsonixLabel.itype;
          }
          labelMap.set(key, value);
        }
      }
    }
  }
  return labelMap;
}

// FE / PT / GF labels can come in any order
function getLabelMap(jsonixAnnoSet) {
  let labelMap = new Map();
  labelMap = addFELabels(jsonixAnnoSet, labelMap);
  labelMap = addPTLabels(jsonixAnnoSet, labelMap);
  labelMap = addGFLabels(jsonixAnnoSet, labelMap);
  return labelMap;
}

async function saveAnnoSets(jsonixSentence) {
  for (const jsonixAnnoSet of toJsonixSentenceAnnoSetArray(jsonixSentence)) {
    logger.silly(`Processing AnnotationSet #${jsonixAnnoSet.id}`);
    // In FrameNet 1.5 there are collisions in AnnotationSet IDs. When a
    // collision is detected, replace by the fulltext reference
    const nLabels = toJsonixLayerArray(jsonixAnnoSet)
      .map(jsonixLayer => toJsonixLabelArray(jsonixLayer)
        .map(jsonixLabel => new Label({
          name: jsonixLabel.name,
          type: jsonixLayer.name,
          rank: jsonixLayer.rank,
          startPos: jsonixLabel.start,
          endPos: jsonixLabel.end,
        })))
      .reduce((a, b) => a.concat(b));
    logger.silly(`nLabels = ${nLabels}`);
    if (nLabels.length !== 0) {
      await Label.insertMany(nLabels);
    }
    const annoSet = new AnnotationSet({
      _id: jsonixAnnoSet.id,
      lexUnit: jsonixAnnoSet.luID,
      sentence: jsonixSentence.id,
      labels: nLabels,
    });
    logger.silly(`new annoSet = ${annoSet}`);
    if (isValidFNAnnoSet(jsonixAnnoSet)) {
      logger.silly(`isValidFNAnnoSet = ${jsonixAnnoSet.id}`);
      // Look for pattern and add to annoSet
      const labelMap = getLabelMap(jsonixAnnoSet);
      const vus = [];
      for (const value of labelMap.values()) {
        logger.silly(`Looking for valenceUnit = ${JSON.stringify(value)}`);
        const vu = await ValenceUnit.findOne(value);
        if (vu) {
          logger.silly(`vu exists = ${JSON.stringify(vu._id)}`);
          vus.push(vu._id);
        } else {
          logger.silly(`vu not found = ${JSON.stringify(value)}`);
          const newVu = new ValenceUnit(value);
          await newVu.save();
          vus.push(newVu._id);
        }
      }
      if (vus.length !== 0) {
        const pattern = await Pattern.find({ valenceUnits: { $all: vus } });
        if (pattern.length > 0) {
          logger.silly(`pattern found = ${pattern._id} with vus = ${vus}`);
          annoSet.pattern = pattern._id;
          found += 1;
        } else {
          logger.silly(`new pattern with vus = ${vus}`);
          const newPattern = new Pattern({
            valenceUnits: vus,
          });
          notFound += 1;
          await newPattern.save();
          annoSet.pattern = newPattern._id;
        }
      }
    }
    await AnnotationSet.where({
      _id: jsonixAnnoSet.id,
    }).setOptions({
      upsert: true,
    }).update(annoSet);
  }
}

async function saveSentences(jsonixFullText) {
  logger.silly('Saving sentences');
  for (const jsonixSentence of toJsonixDocumentSentenceArray(jsonixFullText)) {
    const dbSentence = await Sentence.findById(jsonixSentence.id);
    if (!dbSentence) {
      logger.silly(`Could not find sentence #${jsonixSentence.id} in database`);
      const sentence = new Sentence({
        _id: jsonixSentence.id,
        text: jsonixSentence.text,
        paragraphNumber: jsonixSentence.paragNo,
        sentenceNumber: jsonixSentence.sentNo,
        aPos: jsonixSentence.aPos,
      });
      await sentence.save();
    } else {
      logger.silly(`Sentence #${jsonixSentence.id} already in database`);
    }
    await saveAnnoSets(jsonixSentence);
  }
}

/**
 * Theoretically (in header.xsd), maxOccurs="unbounded" for
 * document so it is processed as an array here
 */
async function saveCorpusAndDocument(jsonixFullText) {
  const corpusId = jsonixFullText.value.header.corpus[0].id;
  const corpus = await Corpus.findById(corpusId);
  const jsonixDocs = toJsonixDocumentArray(jsonixFullText.value.header.corpus[0]);
  await Document.collection.insertMany(jsonixDocs.map(jsonixDoc =>
    new Document({
      _id: jsonixDoc.id,
      name: jsonixDoc.name,
      description: jsonixDoc.description,
      sentences: toJsonixDocumentSentenceArray(jsonixFullText)
        .map(jsonixSentence => jsonixSentence.id),
    })));
  if (corpus) {
    corpus.documents.push(...jsonixDocs.map(jsonixDoc => jsonixDoc.id));
    await corpus.update({
      $set: {
        documents: corpus.documents,
      },
    });
  } else {
    await (new Corpus({
      _id: corpusId,
      name: jsonixFullText.value.header.corpus[0].name,
      description: jsonixFullText.value.header.corpus[0].description,
      documents: jsonixDocs.map(jsonixDoc => jsonixDoc.id),
    })).save();
  }
}

async function importFile(file) {
  logger.debug(`Importing fulltext file ${file}...`);
  const jsonixFullText = await marshaller.unmarshall(file);
  await saveCorpusAndDocument(jsonixFullText);
  await saveSentences(jsonixFullText);
}

/**
 * Sentences, AnnotationSets and Labels will be imported with the
 * importLexUnits script.
 */
async function importFiles(files) {
  logger.info('Importing fulltext files...');
  const fulltextProgressBar = new ProgressBar({
    total: files.length,
    clean: true,
  });
  for (const file of files) {
    try {
      await importFile(file);
    } catch (err) {
      logger.error(err);
      logger.info('Exiting NoFrameNet');
      process.exit(1);
    }
    fulltextProgressBar.tick();
  }
}

async function importFullTextOnceConnectedToDb(fullTextDir) {
  let files;
  try {
    files = await utils.filter(fullTextDir);
  } catch (err) {
    logger.error(err);
    logger.info('Exiting NoFrameNet');
    process.exit(1);
  }
  await importFiles(files);
  logger.info(`found = ${found}`);
  logger.info(`notFound = ${notFound}`);
}

async function importFullText(fullTextDir, dbUri) {
  await driver.connectToDatabase(dbUri);
  await importFullTextOnceConnectedToDb(fullTextDir);
  await mongoose.disconnect();
}

if (require.main === module) {
  const startTime = process.hrtime();
  const dbUri = config.dbUri;
  const fullTextDir = config.frameNetDir.concat('fulltext');
  importFullText(fullTextDir, dbUri)
    .then(() => logger.info(`Import process completed in ${process.hrtime(startTime)[0]}s`));
}

module.exports = {
  importFullTextOnceConnectedToDb,
  importFile,
};
