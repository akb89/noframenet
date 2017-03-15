/**
 * Standalone script to import the content of the fulltext directory to MongoDB
 * This script is different from the other import scripts: it imports
 * everything synchronously as it first checks everything already in the
 * database
 */

import { AnnotationSet, Corpus, Document, Label, Pattern, Sentence, ValenceUnit } from 'noframenet-core';
import ProgressBar from 'ascii-progress';
import { toJsonixDocumentArray, toJsonixDocumentSentenceArray, toJsonixLabelArray, toJsonixLayerArray, toJsonixSentenceAnnoSetArray } from './../utils/jsonixUtils';
import config from './../config';
import driver from './../db/mongo';
import marshaller from './../marshalling/unmarshaller';
import utils from './../utils/utils';

const logger = config.default.logger;

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

function addGFLabels(annoSetLabelMap) {
  if (!annoSetLabelMap.annoSet || annoSetLabelMap.labelMap.size === 0) {
    return annoSetLabelMap;
  }
  for (const jsonixLayer of toJsonixLayerArray(annoSetLabelMap.annoSet)) {
    if (jsonixLayer.name === 'GF') {
      for (const jsonixLabel of toJsonixLabelArray(jsonixLayer)) {
        if (jsonixLabel.start && jsonixLabel.end) {
          const key = `${jsonixLabel.start}#${jsonixLabel.end}#${jsonixLayer.rank}`;
          if (!annoSetLabelMap.labelMap.has(key)) {
            // This is probably an annotation error
            logger.verbose(`annotation error: GF with no FE and/or PT on #${annoSetLabelMap.annoSet.id} and layer ${jsonixLayer.name} and label ${JSON.stringify(key)}`);
            return {
              annoSet: annoSetLabelMap.jsonixAnnoSet,
              labelMap: new Map(),
            };
          }
          annoSetLabelMap.labelMap.get(key).GF = jsonixLabel.name;
        }
      }
    }
  }
  return annoSetLabelMap;
}

function addPTLabels(annoSetLabelMap) {
  if (!annoSetLabelMap.annoSet || annoSetLabelMap.labelMap.size === 0) {
    return annoSetLabelMap;
  }
  for (const jsonixLayer of toJsonixLayerArray(annoSetLabelMap.annoSet)) {
    if (jsonixLayer.name === 'PT') {
      for (const jsonixLabel of toJsonixLabelArray(jsonixLayer)) {
        if (jsonixLabel.start && jsonixLabel.end) {
          const key = `${jsonixLabel.start}#${jsonixLabel.end}#${jsonixLayer.rank}`;
          if (!annoSetLabelMap.labelMap.has(key)) {
            // This is probably an annotation error
            logger.verbose(`annotation error: PT with no FE on #${annoSetLabelMap.annoSet.id} and layer ${jsonixLayer.name} and label ${JSON.stringify(key)}`);
            return {
              annoSet: annoSetLabelMap.jsonixAnnoSet,
              labelMap: new Map(),
            };
          }
          annoSetLabelMap.labelMap.get(key).PT = jsonixLabel.name;
        }
      }
    }
  }
  return annoSetLabelMap;
}

function addFELabels(annoSetLabelMap) {
  if (!annoSetLabelMap.annoSet) {
    return annoSetLabelMap;
  }
  for (const jsonixLayer of toJsonixLayerArray(annoSetLabelMap.annoSet)) {
    if (jsonixLayer.name === 'FE') {
      for (const jsonixLabel of toJsonixLabelArray(jsonixLayer)) {
        if (jsonixLabel.start && jsonixLabel.end) {
          const key = `${jsonixLabel.start}#${jsonixLabel.end}#${jsonixLayer.rank}`;
          if (annoSetLabelMap.labelMap.has(key)) {
            // Do not process cases where multiple FE labels have
            // same start/end values
            logger.verbose(`annotation error: multiple FE labels with same start/end values on #${annoSetLabelMap.annoSet.id} and layer ${jsonixLayer.name} and label ${JSON.stringify(key)}`);
            return {
              annoSet: annoSetLabelMap.jsonixAnnoSet,
              labelMap: new Map(),
            };
          }
          const value = {
            FE: jsonixLabel.feID,
          };
          if (jsonixLabel.itype) {
            value.PT = jsonixLabel.itype;
          }
          annoSetLabelMap.labelMap.set(key, value);
        }
      }
    }
  }
  return annoSetLabelMap;
}

function getLabelMap(jsonixAnnoSet) {
  return addGFLabels(addPTLabels(addFELabels({
    annoSet: jsonixAnnoSet,
    labelMap: new Map(),
  }))).labelMap;
}

async function saveAnnoSets(jsonixSentence) {
  for (const jsonixAnnoSet of toJsonixSentenceAnnoSetArray(jsonixSentence)) {
    const dbAnnoSet = await AnnotationSet.findOne().where('_id').equals(jsonixAnnoSet.id);
    if (!dbAnnoSet) {
      logger.debug(`Could not find annotationSet #${jsonixAnnoSet.id} in database`);
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
      logger.debug(`nLabels = ${nLabels}`);
      if (nLabels.length !== 0) {
        await Label.insertMany(nLabels);
      }
      const annoSet = new AnnotationSet({
        _id: jsonixAnnoSet.id,
        lexUnit: jsonixAnnoSet.luID,
        sentence: jsonixSentence.id,
        labels: nLabels,
      });
      logger.debug(`new annoSet = ${annoSet}`);
      if (isValidFNAnnoSet(jsonixAnnoSet)) {
        logger.debug(`isValidFNAnnoSet = ${jsonixAnnoSet.id}`);
        // Look for pattern and add to annoSet
        const labelMap = getLabelMap(jsonixAnnoSet);
        const vus = [];
        for (const value of labelMap.values()) {
          logger.debug(`Looking for valenceUnit = ${JSON.stringify(value)}`);
          const vu = await ValenceUnit.findOne(value);
          if (vu) {
            logger.debug(`vu exists = ${JSON.stringify(vu._id)}`);
            vus.add(vu._id);
          } else {
            logger.debug(`vu not found = ${JSON.stringify(value)}`);
            const newVu = new ValenceUnit(value);
            await newVu.save();
            vus.add(newVu._id);
          }
        }
        const pattern = await Pattern.findOne().where('valenceUnits').in(vus);
        if (pattern) {
          logger.debug(`pattern found = ${pattern._id} with vus = ${vus}`);
          annoSet.pattern = pattern._id;
        } else {
          logger.debug(`new pattern with vus = ${vus}`);
          const newPattern = new Pattern({
            valenceUnits: vus,
          });
          await newPattern.save();
          annoSet.pattern = newPattern._id;
        }
      }
      await annoSet.save();
    }
  }
}

async function saveSentences(jsonixFullText) {
  logger.debug('Saving sentences');
  for (const jsonixSentence of toJsonixDocumentSentenceArray(jsonixFullText)) {
    const dbSentence = await Sentence.findOne().where('_id').equals(jsonixSentence.id);
    if (!dbSentence) {
      logger.debug(`Could not find sentence #${jsonixSentence.id} in database`);
      const sentence = new Sentence({
        _id: jsonixSentence.id,
        text: jsonixSentence.text,
        paragraphNumber: jsonixSentence.paragNo,
        sentenceNumber: jsonixSentence.sentNo,
        aPos: jsonixSentence.aPos,
      });
      await sentence.save();
    } else {
      logger.debug(`Sentence #${jsonixSentence.id} already in database`);
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
  const corpus = await Corpus.findOne().where('_id').equals(corpusId);
  const jsonixDocs = toJsonixDocumentArray(jsonixFullText.value.header.corpus[0]);
  for (const jsonixDoc of jsonixDocs) {
    const newDoc = new Document({
      _id: jsonixDoc.id,
      name: jsonixDoc.name,
      description: jsonixDoc.description,
      sentences: toJsonixDocumentSentenceArray(jsonixFullText)
        .map(jsonixSentence => jsonixSentence.id),
    });
    await newDoc.save();
  }
  if (corpus) {
    corpus.documents.push(...jsonixDocs.map(jsonixDoc => jsonixDoc.id));
  } else {
    const newCorpus = new Corpus({
      _id: corpusId,
      name: jsonixFullText.value.header.corpus[0].name,
      description: jsonixFullText.value.header.corpus[0].description,
    });
    newCorpus.documents = jsonixDocs.map(jsonixDoc => jsonixDoc.id);
    await newCorpus.save();
  }
}

async function importFile(file) {
  const jsonixFullText = await marshaller.unmarshall(file);
  await saveCorpusAndDocument(jsonixFullText);
  await saveSentences(jsonixFullText);
}

/**
 * Sentences, AnnotationSets and Labels will be imported with the
 * importLexUnits script.
 */
async function importFiles(files) {
  const fulltextProgressBar = new ProgressBar({
    total: files.length,
    clean: true,
  });
  logger.info('Importing fulltext files...');
  for (const file of files) {
    logger.debug(`Importing fullText file ${file}...`);
    try {
      await importFile(file); // eslint-disable-line no-await-in-loop
    } catch (err) {
      logger.error(err);
      process.exit(1);
    }
    fulltextProgressBar.tick();
  }
}

async function importFullTextOnceConnectedToDb(fullTextDir) {
  const files = await utils.filter(fullTextDir);
  await importFiles(files);
}

async function importFullText(fullTextDir, dbUri) {
  const db = await driver.connectToDatabase(dbUri);
  await importFullTextOnceConnectedToDb(fullTextDir);
  db.mongo.close();
  db.mongoose.disconnect();
}

if (require.main === module) {
  const startTime = process.hrtime();
  const dbUri = config.default.dbUri;
  const fullTextDir = config.default.frameNetDir.concat('fulltext');
  importFullText(fullTextDir, dbUri)
    .then(() => logger.info(`Import process completed in ${process.hrtime(startTime)[0]}s`));
}

export default {
  importFullTextOnceConnectedToDb,
};
