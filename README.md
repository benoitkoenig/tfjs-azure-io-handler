# Tfjs azure IO handler

`tfjs-azure-io-handler` provides a handler to save and load models from [TensorFlow.js](https://www.tensorflow.org/js) to an [Azure storage account](https://learn.microsoft.com/en-us/azure/storage/common/storage-account-overview)

## Usage

### Using an Azure container SAS token:

```ts
import createAzureIoHandler from "tfjs-azure-io-handler";

const handler = createAzureIoHandler(
  "location/within/azure/container",
  {
    containerName: "<container name>",
    storageAccount: "<storage account name>",
    storageSasToken: "<storage account sas token>",
  },
);

const model = await tf.loadLayersModel(handler);

await model.save(handler);
```

### Using an Azure storage access key:

```ts
import { StorageSharedKeyCredential } from "@azure/storage-blob";
import createAzureIoHandler from "tfjs-azure-io-handler";

const handler = createAzureIoHandler(
  "location/within/azure/container",
  {
    containerName: "<container name>",
    storageAccount: "<storage account name>",
    credential: new StorageSharedKeyCredential(
      "<storage account name>",
      "<storage account key>"
    ),
  },
);

const model = await tf.loadLayersModel(handler);

await model.save(handler);
```

### Using an anonymous connection:

```ts
import { AnonymousCredential } from "@azure/storage-blob";
import createAzureIoHandler from "tfjs-azure-io-handler";

const handler = createAzureIoHandler(
  "location/within/azure/container",
  {
    containerName: "<container name>",
    storageAccount: "<storage account name>",
    credential: new AnonymousCredential(),
  },
);

const model = await tf.loadLayersModel(handler);

// 🚫 Saving is not permitted by Azure when using `AnonymousCredential`
```
