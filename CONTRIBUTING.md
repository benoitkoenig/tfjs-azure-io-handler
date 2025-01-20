# Contributing to `tfjs-azure-io-handler`

If `tfjs-azure-io-handler` fails to support your use-case, but should, feel free to [open an issue on Github](https://github.com/benoitkoenig/tfjs-azure-io-handler/issues).
If you want to open a pull request yourself, please make sure that the `lint` and ideally the `integration-tests` scripts still pass. Because `integration-tests` require the extra work to setup, feel free to - politely - ask a contributor to check the script for you during the review.

## Testing

Due to the way `tfjs-azure-io-handler` works and its size, it currently has __no unit tests at all__. All testing is done via __integration tests__, which will actually upload/download to/from azure.

Running integration tests requires a dedicated storage account on Azure. Here is how to proceed:

- Create a dedicated storage account.
  - Add the storage account name to [.env.test](./.env.test)
  - In `Settings` -> `Configuration`, enable `Allow Blob anonymous access`
  - In `Security + networking`, copy one of the access keys and add it to [.env.test](./.env.test)
- Create a first container named `tfjs-azure-io-handler`
  - In `Settings` -> `Shared access tokens`, generate a SAS token with permissions `Read`, `Create`, `Delete` and add it to [.env.test](./.env.test)
- Create a second container named `tfjs-azure-io-handler-with-anonymous-access`
  - In `Overview`, click on `Change access level` and set it to `Blob`

[.env.test](./.env.test) should look like this:

```
AZURE_STORAGE_ACCOUNT=[…]
AZURE_STORAGE_KEY=[…]
AZURE_STORAGE_SAS_TOKEN=[…]
```
