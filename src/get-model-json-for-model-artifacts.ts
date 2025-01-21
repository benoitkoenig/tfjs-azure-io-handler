import type { io } from "@tensorflow/tfjs-core";

/**
 * This is virtually a copy/paste from tensorflow.js's io#getModelJsonForModelArtifacts, which is not exported.
 * TODO: investigate if there is a reason for it not to be exported?
 */
export default function getModelJsonForModelArtifacts(
  artifacts: io.ModelArtifacts,
  manifest: io.WeightsManifestConfig,
): io.ModelJSON {
  const result: io.ModelJSON = {
    modelTopology: artifacts.modelTopology as unknown as object,
    weightsManifest: manifest,
  };

  if (artifacts.generatedBy) {
    result.generatedBy = artifacts.generatedBy;
  }

  if (artifacts.convertedBy) {
    result.convertedBy = artifacts.convertedBy;
  }

  if (artifacts.format) {
    result.format = artifacts.format;
  }

  if (artifacts.signature) {
    result.signature = artifacts.signature;
  }

  if (artifacts.userDefinedMetadata) {
    result.userDefinedMetadata = artifacts.userDefinedMetadata;
  }

  if (artifacts.modelInitializer) {
    result.modelInitializer = artifacts.modelInitializer;
  }

  if (artifacts.initializerSignature) {
    result.initializerSignature = artifacts.initializerSignature;
  }

  if (artifacts.trainingConfig) {
    result.trainingConfig = artifacts.trainingConfig;
  }

  return result;
}
