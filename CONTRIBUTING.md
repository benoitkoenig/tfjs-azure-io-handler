# Contributing to `tfjs-azure-io-handler`

If `tfjs-azure-io-handler` fails to support your use-case, but should, feel free to [open an issue on Github](https://github.com/benoitkoenig/tfjs-azure-io-handler/issues).
If you want to open a pull request yourself, please make sure that the `lint` and ideally the `integration-tests` scripts still pass. Because `integration-tests` require the extra work to setup, feel free to - politely - ask a contributor to check the script for you during the review.

## Testing

Due to the way `tfjs-azure-io-handler` works and its size, it currently has __no unit tests at all__. All testing is done via __integration tests__, which will actually upload/download to/from azure.

Running integration tests requires a dedicated storage account on Azure.

### Set up the integration-tests environment

#### Create the resources

- On the [Azure Portal](https://portal.azure.com/#home), create or pick an existing __subscription__ to host the integration-tests resources
- Install [terraform](https://www.terraform.io/) locally
- Run `terraform apply` and provide your subscription's id

#### Generate a SAS token

> TODO: Check if there is a way to include this step within `Terraform`

> ℹ️ The resources in this step have been created by Terraform in the previous step

- Navigate to the `tfjsazureiohandler` Storage Account
- Go to `Data storage` -> `Containers` and select the container named `tfjs-azure-io-handler`
- Go to `Settings` -> `Shared access tokens`
- Generate a SAS token
  - Set `Signing method` to `Account key`
  - Set `Permissions` to `Read`, `Create`, `Delete`
  - Set `Expiry` to a value that suits you
  - Remember to copy the generated __SAS token__, you will need to add it in your [.env.test](./.env.test)

#### Create [.env.test](./.env.test)

Populate your [.env.test](./.env.test) like this:

```
AZURE_STORAGE_ACCOUNT=[Output by terraform under the name `storage_account_name`]
AZURE_STORAGE_KEY=[Output by terraform under the name `primary_access_key`]
AZURE_STORAGE_SAS_TOKEN=[Copied during the `Generate a SAS token step`]
```
