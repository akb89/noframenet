const path = require('path');
const mongoose = require('mongoose');

const AnnotationSet = require('noframenet-core').AnnotationSet;
const Corpus = require('noframenet-core').Corpus;
const Document = require('noframenet-core').Document;
const FERelation = require('noframenet-core').FERelation;
const FrameElement = require('noframenet-core').FrameElement;
const FrameRelation = require('noframenet-core').FrameRelation;
const FrameRelationType = require('noframenet-core').FrameRelationType;
const Frame = require('noframenet-core').Frame;
const Label = require('noframenet-core').Label;
const Lexeme = require('noframenet-core').Lexeme;
const LexUnit = require('noframenet-core').LexUnit;
const Pattern = require('noframenet-core').Pattern;
const SemType = require('noframenet-core').SemType;
const Sentence = require('noframenet-core').Sentence;
const ValenceUnit = require('noframenet-core').ValenceUnit;

const config = require('./../config');
const driver = require('./../db/mongoose');
const counts = require('./../framenet/counts');

const logger = config.logger;

async function check(dbUri) {
  await driver.connectToDatabase(dbUri);
  logger.info(`Checking database ${mongoose.connection.name}.`); // FIXME
  const fndata = path.basename(config.frameNetDir);
  if (fndata) {
    const fndataCounts = counts[fndata];
    if (fndataCounts) {
      logger.info(`${fndata} detected. Comparing documents counts...`);
      const annoSetCount = await AnnotationSet.count();
      if (annoSetCount === fndataCounts.annotationsets) {
        logger.info(`Valid AnnotationSet.count(): ${fndataCounts.annotationsets}`);
      } else {
        logger.error(`Invalid AnnotationSet.count(). Currently: ${annoSetCount}. Should be: ${fndataCounts.annotationsets}`);
      }
      const corpusCount = await Corpus.count();
      if (corpusCount === fndataCounts.corpus) {
        logger.info(`Valid Corpus.count(): ${fndataCounts.corpus}`);
      } else {
        logger.error(`Invalid Corpus.count(). Currently: ${corpusCount}. Should be: ${fndataCounts.corpus}`);
      }
      const documentCount = await Document.count();
      if (documentCount === fndataCounts.documents) {
        logger.info(`Valid Document.count(): ${fndataCounts.documents}`);
      } else {
        logger.error(`Invalid Document.count(). Currently: ${documentCount}. Should be: ${fndataCounts.document}`);
      }
      const feRelationCount = await FERelation.count();
      if (feRelationCount === fndataCounts.ferelations) {
        logger.info(`Valid FERelation.count(): ${fndataCounts.ferelations}`);
      } else {
        logger.error(`Invalid FERelation.count(). Currently: ${feRelationCount}. Should be: ${fndataCounts.ferelations}`);
      }
      const feCount = await FrameElement.count();
      if (feCount === fndataCounts.frameelements) {
        logger.info(`Valid FrameElement.count(): ${fndataCounts.frameelements}`);
      } else {
        logger.error(`Invalid FrameElement.count(). Currently: ${feCount}. Should be: ${fndataCounts.frameelements}`);
      }
      const frameRelationCount = await FrameRelation.count();
      if (frameRelationCount === fndataCounts.framerelations) {
        logger.info(`Valid FrameRelation.count(): ${fndataCounts.framerelations}`);
      } else {
        logger.error(`Invalid FrameRelation.count(). Currently: ${frameRelationCount}. Should be: ${fndataCounts.framerelations}`);
      }
      const frameRelationTypeCount = await FrameRelationType.count();
      if (frameRelationTypeCount === fndataCounts.framerelationtypes) {
        logger.info(`Valid FrameRelationType.count(): ${fndataCounts.framerelationtypes}`);
      } else {
        logger.error(`Invalid FrameRelationType.count(). Currently: ${frameRelationTypeCount}. Should be: ${fndataCounts.framerelationtypes}`);
      }
      const frameCount = await Frame.count();
      if (frameCount === fndataCounts.frames) {
        logger.info(`Valid Frame.count(): ${fndataCounts.frames}`);
      } else {
        logger.error(`Invalid Frame.count(). Currently: ${frameCount}. Should be: ${fndataCounts.frames}`);
      }
      const labelCount = await Label.count();
      if (labelCount === fndataCounts.labels) {
        logger.info(`Valid Label.count(): ${fndataCounts.labels}`);
      } else {
        logger.error(`Invalid Label.count(). Currently: ${labelCount}. Should be: ${fndataCounts.labels}`);
      }
      const lexemeCount = await Lexeme.count();
      if (lexemeCount === fndataCounts.lexemes) {
        logger.info(`Valid Lexeme.count(): ${fndataCounts.lexemes}`);
      } else {
        logger.error(`Invalid Lexeme.count(). Currently: ${lexemeCount}. Should be: ${fndataCounts.lexemes}`);
      }
      const lexUnitCount = await LexUnit.count();
      if (lexUnitCount === fndataCounts.lexunits) {
        logger.info(`Valid LexUnit.count(): ${fndataCounts.lexunits}`);
      } else {
        logger.error(`Invalid LexUnit.count(). Currently: ${lexUnitCount}. Should be: ${fndataCounts.lexunits}`);
      }
      const patternCount = await Pattern.count();
      if (patternCount === fndataCounts.patterns) {
        logger.info(`Valid Pattern.count(): ${fndataCounts.patterns}`);
      } else {
        logger.error(`Invalid Pattern.count(). Currently: ${patternCount}. Should be: ${fndataCounts.patterns}`);
      }
      const semTypeCount = await SemType.count();
      if (semTypeCount === fndataCounts.semtypes) {
        logger.info(`Valid SemType.count(): ${fndataCounts.semtypes}`);
      } else {
        logger.error(`Invalid SemType.count(). Currently: ${semTypeCount}. Should be: ${fndataCounts.semtypes}`);
      }
      const sentenceCount = await Sentence.count();
      if (sentenceCount === fndataCounts.sentences) {
        logger.info(`Valid Sentence.count(): ${fndataCounts.sentences}`);
      } else {
        logger.error(`Invalid Sentence.count(). Currently: ${sentenceCount}. Should be: ${fndataCounts.sentences}`);
      }
      const valenceunitCount = await ValenceUnit.count();
      if (valenceunitCount === fndataCounts.valenceunits) {
        logger.info(`Valid ValenceUnit.count(): ${fndataCounts.valenceunits}`);
      } else {
        logger.error(`Invalid ValenceUnit.count(). Currently: ${valenceunitCount}. Should be: ${fndataCounts.valenceunits}`);
      }
    } else {
      logger.error(`Cannot infer FrameNet data version from config.frameNetDir path: ${config.frameNetDir}. Make sure path ends with standard '/fndata-1.5', '/fndata-1.6' or '/fndata-1.7' directory name`);
      process.exit(1);
    }
  }
  await mongoose.disconnect();
}

if (require.main === module) {
  const dbUri = config.dbUri;
  check(dbUri);
}
